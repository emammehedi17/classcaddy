import React, { useCallback, useEffect, useRef } from 'react';

type Props = { src: string; title: string; viewportMode?: boolean; fixedViewport?: boolean; hideHeaderOnScroll?: boolean; headerHidden?: boolean; active?: boolean };

export const LegacyPageFrame: React.FC<Props> = ({ src, title, viewportMode = false, fixedViewport = false, hideHeaderOnScroll = false, headerHidden = false, active = true }) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const sendSettings = (event: Event) => {
      const settings = (event as CustomEvent).detail;
      if (settings && typeof settings === 'object') frameRef.current?.contentWindow?.postMessage({ type: 'classcaddy:parent-settings-change', settings }, window.location.origin);
    };
    const sendExamSettings = (event: Event) => {
      const preferences = (event as CustomEvent).detail;
      if (preferences && typeof preferences === 'object') frameRef.current?.contentWindow?.postMessage({ type: 'classcaddy:parent-exam-settings-change', preferences }, window.location.origin);
    };
    window.addEventListener('classcaddy:settings-change', sendSettings);
    window.addEventListener('classcaddy:exam-settings-change', sendExamSettings);
    return () => {
      window.removeEventListener('classcaddy:settings-change', sendSettings);
      window.removeEventListener('classcaddy:exam-settings-change', sendExamSettings);
    };
  }, []);
  const prepareFrame = useCallback(() => {
    const frame = frameRef.current;
    const doc = frame?.contentDocument;
    if (!frame || !doc) return;
    const style = doc.createElement('style');
    style.dataset.classCaddyEmbedded = 'true';
    style.textContent = `header.main-website-ui,#main-navigation-header,html.cc-embedded #scroll-toggle-btn,html.cc-embedded #global-dark-mode-btn,html.cc-embedded #action-buttons-container{display:none!important}main{padding-top:0!important}.go-to-top-btn,#back-to-top,.back-to-top{display:none!important}`;
    doc.head.appendChild(style);
    if (doc.body) doc.body.style.paddingTop = '0';
    window.parent.postMessage({ type: 'classcaddy:navigation-loaded' }, window.location.origin);
    if (hideHeaderOnScroll && active) frame.contentWindow?.postMessage({ type: 'classcaddy:studyplan-activate' }, window.location.origin);
    doc.defaultView?.addEventListener('classcaddy:settings-change', (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail && typeof detail === 'object' && detail.__classCaddyParentSync !== true) window.parent.postMessage({ type: 'classcaddy:settings-change', settings: detail }, window.location.origin);
    });
    let previousScrollY = doc.defaultView?.scrollY || 0;
    let headerIsHidden = false;
    if (hideHeaderOnScroll) {
      doc.defaultView?.addEventListener('scroll', () => {
        const scrollY = doc.defaultView?.scrollY || 0;
        if (scrollY > previousScrollY && scrollY > 64) headerIsHidden = true;
        else if (scrollY < previousScrollY) headerIsHidden = false;
        previousScrollY = scrollY;
        window.parent.postMessage({ type: 'classcaddy:studyplan-scroll', hideHeader: headerIsHidden }, window.location.origin);
      }, { passive: true });
    }
    doc.defaultView?.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === 'classcaddy:parent-header-state') {
        headerIsHidden = Boolean(event.data.hidden);
        previousScrollY = doc.defaultView?.scrollY || 0;
        return;
      }
      if (event.data?.type === 'classcaddy:parent-exam-settings-change') {
        const preferences = event.data.preferences;
        if (!preferences || typeof preferences !== 'object') return;
        if (preferences.legacy) localStorage.setItem('cc_quiz_settings', JSON.stringify(preferences.legacy));
        if (preferences.exam) localStorage.setItem('cc_new_exam_settings_v1', JSON.stringify(preferences.exam));
        const examEvent = doc.createEvent('CustomEvent');
        examEvent.initCustomEvent('classcaddy:exam-settings-change', false, false, preferences);
        doc.defaultView?.dispatchEvent(examEvent);
        return;
      }
      if (event.data?.type !== 'classcaddy:parent-settings-change') return;
      const settings = event.data.settings as Record<string, unknown>;
      if (!settings || typeof settings !== 'object') return;
      let currentSettings: Record<string, unknown> = {};
      try { currentSettings = JSON.parse(localStorage.getItem('class_caddy_settings_v1') || '{}'); } catch {}
      const mergedSettings: Record<string, unknown> = { ...currentSettings, ...settings };
      delete mergedSettings.__classCaddyParentSync;
      try { localStorage.setItem('class_caddy_settings_v1', JSON.stringify(mergedSettings)); } catch {}
      const settingsEvent = doc.createEvent('CustomEvent');
      settingsEvent.initCustomEvent('classcaddy:settings-change', false, false, { ...mergedSettings, __classCaddyParentSync: true });
      doc.defaultView?.dispatchEvent(settingsEvent);
    });
    const initialSettings = (() => { try { return JSON.parse(localStorage.getItem('class_caddy_settings_v1') || '{}'); } catch { return {}; } })();
    frame.contentWindow?.postMessage({ type: 'classcaddy:parent-settings-change', settings: initialSettings }, window.location.origin);
    const resize = () => { if (!viewportMode) frame.style.height = `${Math.max(640, doc.documentElement.scrollHeight, doc.body?.scrollHeight || 0)}px`; };
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
    if (!viewportMode) {
      new ResizeObserver(resize).observe(doc.documentElement);
      new MutationObserver(resize).observe(doc.body || doc.documentElement, { childList: true, subtree: true, attributes: true, characterData: true });
    }
    resize();
  }, [viewportMode, active, hideHeaderOnScroll]);

  useEffect(() => {
    if (hideHeaderOnScroll && active) frameRef.current?.contentWindow?.postMessage({ type: 'classcaddy:studyplan-activate' }, window.location.origin);
  }, [active, hideHeaderOnScroll]);

  const frameStyle: React.CSSProperties = hideHeaderOnScroll
    ? { position: 'fixed', top: headerHidden ? 0 : 64, left: 0, width: '100%', height: headerHidden ? '100dvh' : 'calc(100dvh - 64px)', transition: 'top 300ms ease, height 300ms ease' }
    : fixedViewport ? { position: 'fixed', top: 64, left: 0, width: '100%', height: 'calc(100dvh - 64px)' }
    : viewportMode ? { height: 'calc(100dvh - 64px)', minHeight: 'calc(100vh - 64px)' } : { minHeight: 'calc(100vh - 100px)' };
  return <iframe ref={frameRef} title={title} src={src} onLoad={prepareFrame} scrolling={viewportMode ? 'yes' : 'no'} className="block w-full border-0" style={frameStyle} />;
};
