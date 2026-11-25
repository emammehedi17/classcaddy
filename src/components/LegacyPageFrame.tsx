import React, { useCallback, useRef } from 'react';

type Props = { src: string; title: string };

export const LegacyPageFrame: React.FC<Props> = ({ src, title }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const prepareFrame = useCallback(() => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (!frame || !doc) return;
    const style = doc.createElement('style');
    style.dataset.classCaddyEmbedded = 'true';
    style.textContent = `header.main-website-ui,#main-navigation-header,#scroll-toggle-btn,#global-dark-mode-btn,#action-buttons-container{display:none!important}main{padding-top:0!important}.go-to-top-btn,#back-to-top,.back-to-top{display:none!important}`;
    doc.head.appendChild(style);
    if (doc.body) doc.body.style.paddingTop = '0';
    window.parent.postMessage({ type: 'classcaddy:navigation-loaded' }, window.location.origin);
    doc.defaultView?.addEventListener('classcaddy:settings-change', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && typeof detail === 'object') window.parent.postMessage({ type: 'classcaddy:settings-change', settings: detail }, window.location.origin);
    });
    const resize = () => { frame.style.height = `${Math.max(640, doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0)}px`; };
    doc.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, doc.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === doc.location.pathname && url.hash) return;
      const path = url.pathname.toLowerCase();
      const isShellPage = path === '/' || path.endsWith('/index.html') || path.includes('archives') || path.includes('study_plan') || path.includes('study-plan') || path.includes('about') || path.includes('contact') || path.includes('privacy') || path.includes('academic') || /\.html?$/i.test(path);
      if (!isShellPage) return;
      event.preventDefault();
      window.parent.postMessage({ type: 'classcaddy:navigate', href: url.pathname + url.search + url.hash }, window.location.origin);
    });
    new ResizeObserver(resize).observe(doc.documentElement);
    new MutationObserver(resize).observe(doc.body || doc.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    resize();
  }, []);

  return <iframe ref={frameRef} title={title} src={src} onLoad={prepareFrame} className="block w-full border-0" style={{ minHeight: 'calc(100vh - 100px)' }} />;
};
