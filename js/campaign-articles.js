// Campaign-only informational articles. No news effects, decisions or crisis state.
(function (root) {
    'use strict';
    const dateKey = s => { const m = /^(-?\d{1,5})-(\d{1,2})-(\d{1,2})$/.exec(String(s || '')); return m ? +m[1] * 10000 + +m[2] * 100 + +m[3] : null; };
    function due(data, state, evaluate, date) {
        return (data.articles || []).filter(a => {
            if (Object.hasOwn(state.articles.published, a.id)) return false;
            const eligible = a.when === 'start' || a.when === 'focus' && !!state.focus.done[a.focus]
                || a.when === 'date' && dateKey(a.date) != null && date != null && date >= dateKey(a.date)
                || a.when === 'condition' && a.trigger != null;
            return !!eligible && (a.trigger == null || evaluate(a.trigger));
        });
    }
    function publish(state, article, date) {
        if (!article || Object.hasOwn(state.articles.published, article.id)) return false;
        Object.defineProperty(state.articles.published, article.id, {value:{at:date,read:false},enumerable:true,writable:true,configurable:true});
        state.articles.queue.push(article.id);
        return true;
    }
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const paragraphs = text => esc(text).split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g,'<br>')}</p>`).join('');
    let current = null;
    function show(article, options = {}) {
        if (current) current.close(false);
        const fill = options.fill || (v => v || '');
        const overlay = document.createElement('div');
        overlay.className = 'ca-overlay';
        overlay.innerHTML = `<article class="ca-paper" role="dialog" aria-modal="true" aria-labelledby="caHeadline"><header class="ca-masthead"><span>${esc(fill(article.source || '시나리오 특별 보도'))}</span><button type="button" class="ca-close" aria-label="기사 닫기">×</button></header><div class="ca-meta"><span>시나리오 기사${options.preview ? ' · 미리 보기' : ''}</span><time>${esc(options.date || '')}</time></div><h1 id="caHeadline">${esc(fill(article.title || '새로운 소식'))}</h1>${article.subtitle ? `<p class="ca-subtitle">${esc(fill(article.subtitle))}</p>` : ''}${article.image ? `<img class="ca-image" src="${esc(article.image)}" alt="">` : ''}<div class="ca-body">${paragraphs(fill(article.body || ''))}</div><footer><button type="button" class="ca-confirm">확인</button></footer></article>`;
        const before = document.activeElement;
        let closed = false;
        const close = (notify = true) => {
            if (closed) return; closed = true; overlay.remove(); document.removeEventListener('keydown', onKey, true);
            if (current?.element === overlay) current = null;
            if (before?.isConnected) before.focus();
            if (notify) options.onClose?.();
        };
        const onKey = e => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); }
            e.stopPropagation();
            if (e.key === 'Tab') {
                const buttons = [...overlay.querySelectorAll('button')], i = buttons.indexOf(document.activeElement);
                e.preventDefault(); e.stopImmediatePropagation(); buttons[(i + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
            }
        };
        overlay.querySelector('.ca-close').onclick = () => close();
        overlay.querySelector('.ca-confirm').onclick = () => close();
        document.addEventListener('keydown', onKey, true); document.body.appendChild(overlay);
        overlay.querySelector('.ca-confirm').focus();
        current = { element: overlay, close }; return current;
    }
    const api = { due, publish, show, dismiss: () => current?.close(false) };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiCampaignArticles = api;
})(typeof window === 'undefined' ? globalThis : window);
