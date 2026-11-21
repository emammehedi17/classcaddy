/**
 * Class Caddy MCQ Engine — Universal Rich-Content Sanitizer & Renderer
 *
 * Security pipeline:
 * 1. DOMPurify sanitizes ALL HTML BEFORE math/code hydration (strips <script>,
 *    <iframe>, <object>, <embed>, on* attributes, raw untrusted <svg>,
 *    javascript: URIs, data:image/svg+xml, dangerous CSS expressions).
 * 2. Code blocks (<pre><code> and fenced markdown ```) are highlighted via
 *    highlight.js cleanly on textContent—code is NEVER parsed as HTML or LaTeX.
 * 3. LaTeX ($$...$$, \[...\], \(...\), careful $...$) is rendered via KaTeX
 *    synchronously in non-code text nodes (with graceful fallback on invalid TeX),
 *    while sanitized MathML (<math>) passes through natively.
 * 4. Shared identically across View MCQ, Study Mode, Classic Quiz, New Exam UI,
 *    Review Screens, Import Workspace, and Print Layouts.
 */

import DOMPurify from 'dompurify';
import katex from 'katex';
import hljs from 'highlight.js/lib/common';
import { escapeHtmlBasic, decodeHtmlEntities, htmlToPlainText, hasRichMarkup, getOptionPrefixLabel } from './schema.js';

const ALLOWED_TAGS = [
  'p', 'br', 'div', 'span', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'ins',
  'mark', 'sup', 'sub', 'small', 'blockquote', 'pre', 'code', 'kbd', 'samp',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'a', 'img', 'table', 'caption', 'colgroup', 'col', 'thead', 'tbody',
  'tfoot', 'tr', 'th', 'td', 'figure', 'figcaption', 'details', 'summary',
  // Safe static SVG diagram tags
  'svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon',
  'rect', 'text', 'tspan', 'defs', 'marker', 'lineargradient', 'linearGradient',
  'radialgradient', 'radialGradient', 'stop', 'clippath', 'clipPath',
  'pattern', 'mask', 'title', 'desc',
  // MathML tags
  'math', 'semantics', 'annotation', 'annotation-xml', 'mrow', 'mi', 'mn',
  'mo', 'ms', 'mtext', 'mspace', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt',
  'mroot', 'mstyle', 'merror', 'mpadded', 'mphantom', 'mfenced', 'mtable',
  'mtr', 'mtd', 'mlabeledtr', 'munder', 'mover', 'munderover', 'mmultiscripts',
  'mprescripts', 'none', 'menclose',
];

const ALLOWED_TAGS_SET = new Set(ALLOWED_TAGS.map((t) => t.toLowerCase()));
const SELF_CLOSING_TAGS_SET = new Set(['br', 'hr', 'img', 'col']);
const SVG_CAMEL_TAG_MAP = {
  lineargradient: 'linearGradient',
  radialgradient: 'radialGradient',
  clippath: 'clipPath',
};

const ALLOWED_ATTR = [
  'class', 'title', 'alt', 'src', 'width', 'height', 'href', 'target', 'rel',
  'colspan', 'rowspan', 'scope', 'align', 'valign', 'start', 'type', 'style',
  'data-lang', 'data-latex',
  // SVG diagram presentation & geometry attrs
  'viewbox', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'strokeWidth',
  'stroke-dasharray', 'strokeDasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin',
  'stroke-miterlimit', 'stroke-opacity', 'fill-opacity', 'fill-rule', 'clip-rule', 'opacity',
  'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'dx', 'dy',
  'd', 'points', 'transform', 'text-anchor', 'dominant-baseline', 'alignment-baseline',
  'font-size', 'font-family', 'font-weight', 'font-style', 'letter-spacing',
  'marker-start', 'marker-mid', 'marker-end', 'id', 'orient',
  'markerwidth', 'markerWidth', 'markerheight', 'markerHeight',
  'refx', 'refX', 'refy', 'refY', 'markerunits', 'markerUnits',
  'gradientunits', 'gradientUnits', 'gradienttransform', 'gradientTransform',
  'spreadmethod', 'spreadMethod', 'offset', 'stop-color', 'stop-opacity',
  'preserveaspectratio', 'preserveAspectRatio', 'clip-path', 'mask', 'vector-effect',
  // MathML attrs
  'mathvariant', 'mathsize', 'mathcolor', 'mathbackground', 'display',
  'encoding', 'columnalign', 'rowalign', 'linethickness', 'fence', 'separator',
  'stretchy', 'lspace', 'rspace', 'notation', 'accent', 'accentunder', 'bevelled',
];

const ALLOWED_ATTR_SET = new Set(ALLOWED_ATTR.map((a) => a.toLowerCase()));
const SVG_CAMEL_ATTR_MAP = {
  viewbox: 'viewBox',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  refx: 'refX',
  refy: 'refY',
  markerunits: 'markerUnits',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  spreadmethod: 'spreadMethod',
  preserveaspectratio: 'preserveAspectRatio',
};

const SAFE_STYLE_PROPS = new Set([
  'color',
  'background-color',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-align',
  'vertical-align',
  'white-space',
  'max-width',
  'width',
  'height',
  'margin',
  'margin-top',
  'margin-bottom',
  'display',
]);

function filterSafeInlineStyle(rawStyle) {
  if (!rawStyle) return '';
  const cleaned = [];
  String(rawStyle)
    .split(';')
    .forEach((decl) => {
      const idx = decl.indexOf(':');
      if (idx === -1) return;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const val = decl.slice(idx + 1).trim();
      if (!SAFE_STYLE_PROPS.has(prop)) return;
      if (/expression|javascript:|vbscript:|url\s*\(|-moz-binding|@import/i.test(val)) return;
      if (val) cleaned.push(`${prop}: ${val}`);
    });
  return cleaned.join('; ');
}

/**
 * Strict allowlist fallback HTML sanitizer used when DOMPurify.sanitize is
 * unavailable (e.g. headless Node.js environment without window/DOM).
 */
function sanitizeHtmlAllowlistFallback(dirtyHtml) {
  let s = String(dirtyHtml || '');
  // 1. Remove forbidden dangerous block tags and their entire contents
  s = s.replace(/<(script|style|iframe|object|embed|foreignobject|form|frameset|applet|noscript|animate|animatetransform|animatemotion)\b[\s\S]*?<\/\1\s*>/gi, '');
  s = s.replace(/<(script|style|iframe|object|embed|foreignobject|use|animate|animatetransform|animatemotion|set|form|input|textarea|select|button|meta|link|base)\b[^>]*\/?>/gi, '');
  // 2. Remove HTML comments
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  // 3. Process remaining tags against ALLOWED_TAGS_SET and ALLOWED_ATTR_SET
  s = s.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (full, rawTag, rawAttrs) => {
    const tag = String(rawTag || '').toLowerCase();
    if (!ALLOWED_TAGS_SET.has(tag)) return '';
    const outTag = SVG_CAMEL_TAG_MAP[tag] || tag;
    if (full.startsWith('</')) return `</${outTag}>`;

    const isXmlSelfClosing = /\/\s*>$/.test(full);
    const safeAttrs = [];
    const attrRe = /([a-zA-Z0-9_-]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`/]+)))?/g;
    let m;
    while ((m = attrRe.exec(rawAttrs || '')) !== null) {
      const attrNameLower = m[1].toLowerCase();
      if (attrNameLower.startsWith('on') || !ALLOWED_ATTR_SET.has(attrNameLower)) continue;
      if (attrNameLower === 'href' && tag !== 'a') continue;
      const outAttrName = SVG_CAMEL_ATTR_MAP[attrNameLower] || attrNameLower;
      const rawVal = m[2] ?? m[3] ?? m[4] ?? '';
      if (attrNameLower === 'style') {
        const cleanStyle = filterSafeInlineStyle(rawVal);
        if (cleanStyle) safeAttrs.push(`style="${escapeHtmlBasic(cleanStyle)}"`);
      } else if (attrNameLower === 'src') {
        if (tag !== 'img') continue;
        const src = rawVal.trim();
        const isSafeUrl =
          /^https?:\/\//i.test(src) ||
          /^\//.test(src) ||
          /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(src);
        if (isSafeUrl) safeAttrs.push(`src="${escapeHtmlBasic(src)}"`);
      } else if (attrNameLower === 'href') {
        const href = rawVal.trim();
        const isSafeHref =
          /^https?:\/\//i.test(href) ||
          /^mailto:/i.test(href) ||
          /^#/.test(href) ||
          /^\//.test(href);
        if (isSafeHref) safeAttrs.push(`href="${escapeHtmlBasic(href)}"`);
      } else {
        safeAttrs.push(`${outAttrName}="${escapeHtmlBasic(rawVal)}"`);
      }
    }
    const attrStr = safeAttrs.length > 0 ? ' ' + safeAttrs.join(' ') : '';
    if (SELF_CLOSING_TAGS_SET.has(tag)) {
      return `<${outTag}${attrStr}>`;
    }
    return isXmlSelfClosing ? `<${outTag}${attrStr} />` : `<${outTag}${attrStr}>`;
  });
  return s;
}

let cachedPurifier = null;

function getPurifier() {
  if (cachedPurifier && typeof cachedPurifier.sanitize === 'function') {
    return cachedPurifier;
  }

  let instance = DOMPurify;
  if (typeof DOMPurify === 'function' && typeof DOMPurify.sanitize !== 'function') {
    if (typeof globalThis.window !== 'undefined') {
      instance = DOMPurify(globalThis.window);
    }
  }

  if (instance && typeof instance.addHook === 'function' && !instance.__ccHooksInstalled) {
    instance.__ccHooksInstalled = true;

    instance.addHook('afterSanitizeAttributes', (node) => {
      if (!node || typeof node.getAttribute !== 'function') return;
      const tagUpper = (node.tagName || '').toUpperCase();

      // 1. Validate <img src>
      if (tagUpper === 'IMG') {
        const src = (node.getAttribute('src') || '').trim();
        const isSafeUrl =
          /^https?:\/\//i.test(src) ||
          /^\//.test(src) ||
          /^data:image\/(png|jpeg|jpg|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(src);
        if (!isSafeUrl) {
          node.removeAttribute('src');
          if (!node.getAttribute('alt')) {
            node.setAttribute('alt', 'Blocked unsafe image source');
          }
        }
        node.setAttribute('loading', 'lazy');
      } else if (node.hasAttribute('src')) {
        node.removeAttribute('src');
      }

      // 2. Validate <a href> (never allow href on SVG elements)
      if (tagUpper === 'A') {
        const href = (node.getAttribute('href') || '').trim();
        const isSafeHref =
          /^https?:\/\//i.test(href) ||
          /^mailto:/i.test(href) ||
          /^#/.test(href) ||
          /^\//.test(href);
        if (!isSafeHref) {
          node.removeAttribute('href');
        } else if (/^https?:\/\//i.test(href)) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener noreferrer');
        }
      } else if (node.hasAttribute('href')) {
        node.removeAttribute('href');
      }

      // 3. Strictly filter inline style properties
      if (node.hasAttribute('style')) {
        const cleanStyle = filterSafeInlineStyle(node.getAttribute('style') || '');
        if (cleanStyle) {
          node.setAttribute('style', cleanStyle);
        } else {
          node.removeAttribute('style');
        }
      }
    });
  }

  cachedPurifier = instance;
  return instance;
}

/**
 * Sanitizes rich HTML using DOMPurify allowlist (or strict allowlist fallback in Node).
 */
export function sanitizeRichHtml(dirtyHtml) {
  if (dirtyHtml === null || dirtyHtml === undefined) return '';
  const str = String(dirtyHtml);
  const purifier = getPurifier();
  if (purifier && typeof purifier.sanitize === 'function') {
    return purifier.sanitize(str, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: [
        'script', 'style', 'iframe', 'object', 'embed', 'form', 'input',
        'textarea', 'select', 'foreignobject', 'foreignObject', 'use',
        'animate', 'animatetransform', 'animateTransform', 'animatemotion',
        'animateMotion', 'set',
      ],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'xlink:href'],
    });
  }
  return sanitizeHtmlAllowlistFallback(str);
}

const KATEX_MACROS = {
  '\\degree': '^\\circ',
  '\\bold': '\\mathbf{#1}',
};

function renderLatexSegment(expr, displayMode) {
  const decoded = decodeHtmlEntities(String(expr || '')).trim();
  if (!decoded) return '';
  try {
    return katex.renderToString(decoded, {
      displayMode: Boolean(displayMode),
      throwOnError: true,
      strict: 'ignore',
      trust: false,
      macros: KATEX_MACROS,
      output: 'htmlAndMathml',
    });
  } catch {
    return `<code class="cc-math-fallback" data-latex="${escapeHtmlBasic(decoded)}" title="LaTeX expression">${escapeHtmlBasic(
      displayMode ? `$$${decoded}$$` : `$${decoded}$`
    )}</code>`;
  }
}

function highlightCodeString(codeText, lang = '') {
  const cleanCode = String(codeText || '').replace(/^\n+|\n+$/g, '');
  const cleanLang = String(lang || '')
    .toLowerCase()
    .replace(/^language-/, '')
    .replace(/[^a-z0-9_+-]/g, '');

  try {
    if (cleanLang && hljs.getLanguage(cleanLang)) {
      const res = hljs.highlight(cleanCode, { language: cleanLang, ignoreIllegals: true });
      return { html: res.value, language: cleanLang };
    }
    const auto = hljs.highlightAuto(cleanCode);
    return { html: auto.value, language: auto.language || cleanLang || 'code' };
  } catch {
    return { html: escapeHtmlBasic(cleanCode), language: cleanLang || 'code' };
  }
}

/**
 * Protects LaTeX delimiters containing `<` or `>` inside rich HTML strings
 * (outside `<pre>`, `<code>`, `<script>`, `<style>`) before HTML parsing so
 * expressions like `$x < y$` or `$x > y$` are not corrupted by DOM parsing.
 */
function protectMathAnglesInHtml(htmlStr) {
  if (!htmlStr || (!htmlStr.includes('$') && !htmlStr.includes('\\(') && !htmlStr.includes('\\['))) {
    return htmlStr;
  }
  const codePlaceholders = [];
  let working = String(htmlStr).replace(/<(pre|code|script|style)\b[\s\S]*?<\/\1\s*>/gi, (m) => {
    const tok = `@@CC_CODE_GUARD_${codePlaceholders.length}@@`;
    codePlaceholders.push(m);
    return tok;
  });

  const mathRe = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$(?!\s)([^$\n]{1,400}?)(?<!\\|\s)\$(?!\d))/g;
  working = working.replace(mathRe, (m) => {
    if (!m.includes('<') && !m.includes('>')) return m;
    // Do not treat across HTML tags as inline math if it looks like an actual HTML tag
    if (/<\/?(b|strong|i|em|u|br|p|div|span|ul|ol|li|table|tr|td|th|sub|sup)\b/i.test(m)) {
      return m;
    }
    return m.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  });

  return working.replace(/@@CC_CODE_GUARD_(\d+)@@/g, (_, idx) => codePlaceholders[Number(idx)] || '');
}

/**
 * Converts fenced markdown code blocks (```lang ... ```) and inline `code`
 * inside plain-text strings into safe <pre><code> blocks while preserving
 * non-code text untouched for LaTeX rendering.
 */
function preprocessPlainTextInput(rawText, inlineOnly = false) {
  const str = String(rawText ?? '');
  const placeholders = [];
  const hold = (html) => {
    const token = `@@CC_BLK_${placeholders.length}@@`;
    placeholders.push(html);
    return token;
  };

  let working = str;

  // 1. Fenced code blocks ```lang\n...\n```
  if (!inlineOnly) {
    working = working.replace(/```([a-zA-Z0-9_+-]*)[ \t]*\r?\n([\s\S]*?)```/g, (_, lang, code) => {
      const highlighted = highlightCodeString(code, lang);
      const badge = highlighted.language ? `<span class="cc-code-lang">${escapeHtmlBasic(highlighted.language)}</span>` : '';
      return hold(
        `<div class="cc-code-block">${badge}<pre><code class="hljs language-${escapeHtmlBasic(highlighted.language)}">${highlighted.html}</code></pre></div>`
      );
    });
  }

  // 2. Inline code `...` (only when content does not span newlines and looks like code)
  working = working.replace(/`([^`\n]{1,180})`/g, (_, code) => {
    return hold(`<code class="cc-inline-code">${escapeHtmlBasic(code)}</code>`);
  });

  // 3. Escape remaining text & preserve newlines
  let escaped = escapeHtmlBasic(working);
  if (!inlineOnly) {
    escaped = escaped.replace(/\r?\n/g, '<br>');
  } else {
    escaped = escaped.replace(/\r?\n/g, ' ');
  }

  // 4. Restore code placeholders before LaTeX pass (note: placeholders have no $, so LaTeX ignores them)
  let restored = escaped.replace(/@@CC_BLK_(\d+)@@/g, (_, idx) => placeholders[Number(idx)] || '');

  return hydrateLatexInHtmlFragment(restored);
}

/**
 * Hydrates LaTeX delimiters ONLY in safe text nodes (never inside <pre>, <code>,
 * <math>, <kbd>, <samp>, .katex, or .cc-math-fallback) and enhances <pre><code>
 * blocks + tables in sanitized HTML fragments.
 */
let sharedDomParser = null;
function getSharedDomParser() {
  if (!sharedDomParser && typeof globalThis.DOMParser === 'function') {
    sharedDomParser = new globalThis.DOMParser();
  }
  return sharedDomParser;
}

function hydrateLatexInHtmlFragment(safeHtml) {
  if (!safeHtml) return '';

  const parser = getSharedDomParser();
  if (!parser) {
    // Node.js fallback: protect <pre>, <code>, <math>, and <svg> blocks before hydrating LaTeX
    const protectedBlocks = [];
    const masked = String(safeHtml).replace(/<(pre|code|math|svg)\b[\s\S]*?<\/\1\s*>/gi, (m) => {
      const tok = `@@CC_NODE_CODE_${protectedBlocks.length}@@`;
      protectedBlocks.push(m);
      return tok;
    });
    const rendered = renderLatexInRawText(masked);
    return rendered.replace(/@@CC_NODE_CODE_(\d+)@@/g, (_, idx) => protectedBlocks[Number(idx)] || '');
  }

  try {
    const doc = parser.parseFromString(`<div class="cc-root">${safeHtml}</div>`, 'text/html');
    const root = doc.body.firstElementChild;
    if (!root) return safeHtml;

    // 1. Highlight <pre><code> and raw <pre> blocks first
    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.cc-code-block')) return;
      const codeEl = pre.querySelector('code');
      const rawCode = codeEl ? codeEl.textContent : pre.textContent;
      const classAttr = (codeEl?.getAttribute('class') || pre.getAttribute('class') || '').trim();
      const langMatch = classAttr.match(/(?:language-|lang-)([a-z0-9_+-]+)/i);
      const dataLang = pre.getAttribute('data-lang') || codeEl?.getAttribute('data-lang') || (langMatch ? langMatch[1] : '');
      const highlighted = highlightCodeString(rawCode || '', dataLang);

      const wrapper = doc.createElement('div');
      wrapper.className = 'cc-code-block';
      if (highlighted.language) {
        const badge = doc.createElement('span');
        badge.className = 'cc-code-lang';
        badge.textContent = highlighted.language;
        wrapper.appendChild(badge);
      }
      const newPre = doc.createElement('pre');
      const newCode = doc.createElement('code');
      newCode.className = `hljs language-${highlighted.language}`;
      newCode.innerHTML = highlighted.html;
      newPre.appendChild(newCode);
      wrapper.appendChild(newPre);
      pre.replaceWith(wrapper);
    });

    // 2. Wrap standalone <table> in responsive scroll wrapper
    root.querySelectorAll('table').forEach((tbl) => {
      if (tbl.closest('.cc-table-scroll') || tbl.closest('.katex')) return;
      const wrap = doc.createElement('div');
      wrap.className = 'cc-table-scroll';
      tbl.parentNode.insertBefore(wrap, tbl);
      wrap.appendChild(tbl);
    });

    // 3. Walk text nodes outside protected elements and hydrate LaTeX
    const SKIP_TAGS = new Set(['PRE', 'CODE', 'KBD', 'SAMP', 'MATH', 'SCRIPT', 'STYLE', 'SVG']);
    const textNodes = [];
    const walk = (node) => {
      if (!node) return;
      if (node.nodeType === 1) {
        const tag = node.tagName ? node.tagName.toUpperCase() : '';
        if (SKIP_TAGS.has(tag)) return;
        if (node.classList && (node.classList.contains('katex') || node.classList.contains('cc-math-fallback') || node.classList.contains('cc-code-block'))) {
          return;
        }
      }
      if (node.nodeType === 3) {
        if (node.nodeValue && (node.nodeValue.includes('$') || node.nodeValue.includes('\\(') || node.nodeValue.includes('\\['))) {
          textNodes.push(node);
        }
        return;
      }
      const children = Array.from(node.childNodes || []);
      children.forEach(walk);
    };
    walk(root);

    textNodes.forEach((tn) => {
      const rendered = renderLatexInRawText(tn.nodeValue || '');
      if (rendered !== tn.nodeValue) {
        const tpl = doc.createElement('span');
        tpl.innerHTML = rendered;
        const frag = doc.createDocumentFragment();
        while (tpl.firstChild) frag.appendChild(tpl.firstChild);
        tn.parentNode.replaceChild(frag, tn);
      }
    });

    return root.innerHTML;
  } catch {
    return safeHtml;
  }
}

/**
 * Matches $$...$$, \[...\], \(...\), and $...$ inside text while avoiding
 * standalone currency values ($50, $10 and $20, $10-$20, $50/$100).
 */
function renderLatexInRawText(text) {
  if (!text) return '';
  const str = String(text);

  // Order matters: display delimiters before inline delimiters
  const mathPattern =
    /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|(?<!\\)\$(?!\s)([^$\n]{1,400}?)(?<!\\|\s)\$(?!\d))/g;

  let lastIndex = 0;
  let out = '';
  let match;

  while ((match = mathPattern.exec(str)) !== null) {
    out += str.slice(lastIndex, match.index);
    const full = match[0];

    if (full.startsWith('$$') && full.endsWith('$$')) {
      out += renderLatexSegment(full.slice(2, -2), true);
    } else if (full.startsWith('\\[') && full.endsWith('\\]')) {
      out += renderLatexSegment(full.slice(2, -2), true);
    } else if (full.startsWith('\\(') && full.endsWith('\\)')) {
      out += renderLatexSegment(full.slice(2, -2), false);
    } else if (full.startsWith('$') && full.endsWith('$')) {
      const inner = full.slice(1, -1);
      out += renderLatexSegment(inner, false);
    } else {
      out += full;
    }

    lastIndex = match.index + full.length;
  }

  out += str.slice(lastIndex);
  return out;
}

/**
 * Primary universal HTML string renderer.
 * Accepts either rich HTML or plain text (optionally containing LaTeX / fenced code).
 * Guarantees sanitized, KaTeX + highlight.js hydrated HTML output wrapped safely.
 */
const MAX_RENDER_CACHE = 2000;
const renderHtmlCache = new Map();

export function renderRichHtmlString(value, options = {}) {
  const { inlineOnly = false, forcePlainText = false } = options;
  if (value === null || value === undefined || value === '') return '';

  const str = String(value);
  const cacheKey = `${inlineOnly ? '1' : '0'}|${forcePlainText ? '1' : '0'}|${str}`;
  const cached = renderHtmlCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const looksLikeHtml =
    !forcePlainText &&
    (hasRichMarkup(str) || /<(script|iframe|svg)\b/i.test(str));

  let hydrated;
  if (!looksLikeHtml) {
    hydrated = preprocessPlainTextInput(str, inlineOnly);
  } else {
    // CRITICAL SECURITY ORDER: Protect math `<`/`>`, sanitize HTML first, THEN highlight code & render LaTeX
    const protectedStr = protectMathAnglesInHtml(str);
    const clean = sanitizeRichHtml(protectedStr);
    hydrated = hydrateLatexInHtmlFragment(clean);
  }

  const finalHtml = inlineOnly
    ? `<span class="cc-rich-content cc-rich-inline">${hydrated}</span>`
    : `<div class="cc-rich-content">${hydrated}</div>`;

  if (renderHtmlCache.size >= MAX_RENDER_CACHE) {
    const oldestKey = renderHtmlCache.keys().next().value;
    if (oldestKey !== undefined) renderHtmlCache.delete(oldestKey);
  }
  renderHtmlCache.set(cacheKey, finalHtml);
  return finalHtml;
}

/**
 * Renders a specific field of a normalized or legacy MCQ object through the
 * universal rich renderer.
 */
function pickPreferredMcqValue(htmlVal, plainVal) {
  if (typeof htmlVal === 'string' && htmlVal.trim() && hasRichMarkup(htmlVal)) {
    return htmlVal;
  }
  if (plainVal !== undefined && plainVal !== null && String(plainVal).trim() !== '') {
    return String(plainVal);
  }
  if (typeof htmlVal === 'string' && htmlVal.trim()) {
    return decodeHtmlEntities(htmlVal);
  }
  return '';
}

export function renderMcqFieldHtml(mcq, field = 'question', optIndex = 0, opts = {}) {
  if (!mcq) return '';
  if (field === 'question') {
    const val = pickPreferredMcqValue(mcq.questionHtml, mcq.question || mcq.questionText || '');
    return renderRichHtmlString(val, opts);
  }
  if (field === 'option') {
    const optHtml = Array.isArray(mcq.optionsHtml) ? mcq.optionsHtml[optIndex] : '';
    const optPlain = Array.isArray(mcq.options) ? mcq.options[optIndex] : '';
    const val = pickPreferredMcqValue(optHtml, optPlain);
    return renderRichHtmlString(val, { inlineOnly: true, ...opts });
  }
  if (field === 'correctAnswer') {
    const val = pickPreferredMcqValue(mcq.correctAnswerHtml, mcq.correctAnswer);
    return renderRichHtmlString(val, { inlineOnly: true, ...opts });
  }
  if (field === 'explanation') {
    const val = (mcq.explanationHtml && hasRichMarkup(mcq.explanationHtml))
      ? mcq.explanationHtml
      : (mcq.explanation || pickPreferredMcqValue(mcq.noteHtml, mcq.note) || (mcq.explanationHtml ? decodeHtmlEntities(mcq.explanationHtml) : ''));
    return renderRichHtmlString(val, opts);
  }
  if (field === 'note') {
    const val = (mcq.noteHtml && hasRichMarkup(mcq.noteHtml))
      ? mcq.noteHtml
      : (mcq.note || pickPreferredMcqValue(mcq.explanationHtml, mcq.explanation) || (mcq.noteHtml ? decodeHtmlEntities(mcq.noteHtml) : ''));
    return renderRichHtmlString(val, opts);
  }
  return '';
}

export function renderRichIntoElement(element, value, options = {}) {
  if (!element) return;
  element.innerHTML = renderRichHtmlString(value, options);
}

/**
 * Formats an array of legacy or v2 MCQs cleanly for clipboard copy (readable plain text).
 */
export function formatMcqsForClipboardPlain(mcqs) {
  if (!Array.isArray(mcqs) || mcqs.length === 0) return '';
  return mcqs
    .map((mcq, index) => {
      const qText = mcq.questionText || htmlToPlainText(mcq.questionHtml || mcq.question || '');
      const opts = Array.isArray(mcq.options)
        ? mcq.options.map((o) => htmlToPlainText(o))
        : [];
      const optLines = opts
        .map((opt, i) => `${getOptionPrefixLabel(i, qText)}. ${opt}`)
        .join('\n');

      const correctPlain = htmlToPlainText(mcq.correctAnswer || '');
      let ansLine = '';
      if (correctPlain) {
        const idx = opts.findIndex((o) => o === correctPlain);
        if (idx !== -1) {
          ansLine = `Correct answer: ${getOptionPrefixLabel(idx, qText)}. ${correctPlain}`;
        } else {
          ansLine = `Correct answer: ${correctPlain}`;
        }
      } else {
        ansLine = `Correct answer: ${htmlToPlainText(mcq.explanation || '') || 'Unresolved'}`;
      }

      const notePlain = htmlToPlainText(mcq.note || mcq.explanation || '');
      if (notePlain && !ansLine.includes(notePlain)) {
        ansLine += `\nNote: ${notePlain}`;
      }

      return `${index + 1}. ${qText}\n${optLines}\n${ansLine}`;
    })
    .join('\n\n');
}
