// ===== 테마에 맞춘 말풍선(툴팁) · 알림창(alert) · 확인창(confirm) =====
// 브라우저 기본 title 말풍선과 alert/confirm 창은 테마를 따르지 않으므로(흰 상자), 앱 자체 UI로 대신 그린다.
//  - 말풍선: title 속성을 data-dno-tip으로 옮겨 기본 말풍선을 끄고, 마우스를 올리면 테마색 말풍선을 띄운다
//  - DnoUI.alert(msg, opts) → Promise (확인을 누르면 끝남) · window.alert도 이것으로 대신한다
//  - DnoUI.confirm(msg, opts) → Promise<boolean> (confirm은 멈춰 기다릴 수 없으므로 await로 써야 한다)
//  - opts: { title, okText, cancelText, tone: 'info' | 'warn' | 'danger' }
(function () {
    if (window.DnoUI) return;
    const t = s => (window.DnoLang && typeof DnoLang.t === 'function' ? DnoLang.t(String(s)) : String(s));
    const isModern = () => document.documentElement.getAttribute('data-theme-family') === 'modern';

    const css = `
.dno-tip {
    position: fixed; z-index: 100000; pointer-events: none; max-width: min(320px, calc(100vw - 16px));
    padding: 6px 10px; font-size: 0.8rem; line-height: 1.45; white-space: pre-line; word-break: keep-all;
    opacity: 0; transform: translateY(2px); transition: opacity .12s, transform .12s;
    background: #05070a; color: var(--dno-tip-c, var(--tno-neon, #00ffff));
    border: 1px solid var(--dno-tip-c, var(--tno-neon, #00ffff));
    box-shadow: 0 0 10px color-mix(in srgb, var(--dno-tip-c, var(--tno-neon, #00ffff)) 35%, transparent);
    font-family: 'NeoDunggeunmo', 'VT323', monospace;
}
.dno-tip.show { opacity: 1; transform: none; }
html[data-theme-family="modern"] .dno-tip {
    background: var(--m-text, #18181b); color: var(--m-surface, #fff); border: none; border-radius: 8px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, .18); font-family: var(--m-font, inherit); font-weight: 500;
}
.dno-dialog-overlay {
    position: fixed; inset: 0; z-index: 100001; display: flex; align-items: center; justify-content: center;
    padding: 16px; background: rgba(0, 0, 0, .72);
}
.dno-dialog {
    --dno-dlg-c: var(--tno-neon, #00ffff);
    width: 360px; max-width: 100%; padding: 20px; background: #0a0c10; color: #ddd;
    border: 1px solid var(--dno-dlg-c); box-shadow: 0 0 18px color-mix(in srgb, var(--dno-dlg-c) 30%, transparent);
    font-family: 'NeoDunggeunmo', 'VT323', monospace;
}
.dno-dialog.tone-warn { --dno-dlg-c: var(--tno-gold, #ffd700); }
.dno-dialog.tone-danger { --dno-dlg-c: #ff5555; }
.dno-dialog-title { color: var(--dno-dlg-c); font-size: 1.05rem; margin-bottom: 10px; letter-spacing: 1px; }
.dno-dialog-msg { font-size: 0.95rem; line-height: 1.6; white-space: pre-line; word-break: keep-all; overflow-wrap: anywhere; max-height: 60vh; overflow-y: auto; }
.dno-dialog-actions { display: flex; gap: 8px; margin-top: 20px; }
.dno-dialog-btn {
    flex: 1; padding: 9px 12px; cursor: pointer; font: inherit; font-size: 0.95rem;
    background: color-mix(in srgb, var(--dno-dlg-c) 12%, transparent); color: var(--dno-dlg-c); border: 1px solid var(--dno-dlg-c);
}
.dno-dialog-btn:hover, .dno-dialog-btn:focus-visible { background: color-mix(in srgb, var(--dno-dlg-c) 24%, transparent); outline: none; }
.dno-dialog-btn.cancel { background: transparent; color: #888; border-color: #333; }
.dno-dialog-btn.cancel:hover, .dno-dialog-btn.cancel:focus-visible { color: #ddd; border-color: #666; }
html[data-theme-family="modern"] .dno-dialog-overlay { background: rgba(0, 0, 0, .4); }
html[data-theme-family="modern"] .dno-dialog {
    --dno-dlg-c: var(--m-accent, #18181b);
    background: var(--m-surface, #fff); color: var(--m-text, #18181b); border: 1px solid var(--m-border, #e4e4e7);
    border-radius: 16px; box-shadow: 0 20px 50px rgba(0, 0, 0, .25); font-family: var(--m-font, inherit); padding: 22px;
}
html[data-theme-family="modern"] .dno-dialog.tone-warn { --dno-dlg-c: var(--m-gold, #d97706); }
html[data-theme-family="modern"] .dno-dialog.tone-danger { --dno-dlg-c: var(--m-danger, #dc2626); }
html[data-theme-family="modern"] .dno-dialog-title { color: var(--m-text, #18181b); font-weight: 700; letter-spacing: 0; }
html[data-theme-family="modern"] .dno-dialog-msg { color: var(--m-text-2, #52525b); }
html[data-theme-family="modern"] .dno-dialog-btn {
    border: none; border-radius: 10px; font-weight: 600; background: var(--dno-dlg-c); color: var(--m-surface, #fff);
}
html[data-theme-family="modern"] .dno-dialog-btn:hover, html[data-theme-family="modern"] .dno-dialog-btn:focus-visible { filter: brightness(1.12); background: var(--dno-dlg-c); }
html[data-theme-family="modern"] .dno-dialog-btn.cancel { background: var(--m-surface-2, #f4f4f5); color: var(--m-text, #18181b); }
html[data-theme-family="modern"] .dno-dialog-btn.cancel:hover, html[data-theme-family="modern"] .dno-dialog-btn.cancel:focus-visible { background: var(--m-surface-3, #e4e4e7); filter: none; }
`;
    function injectStyle() {
        if (document.getElementById('dnoDialogsStyle')) return;
        const st = document.createElement('style');
        st.id = 'dnoDialogsStyle';
        st.textContent = css;
        (document.head || document.documentElement).appendChild(st);
    }
    injectStyle();

    // ===== 말풍선 =====
    // title → data-dno-tip (새로 그려지거나 나중에 title이 바뀌어도 바로 옮긴다)
    function adopt(el) {
        const v = el.getAttribute('title');
        if (v === null || el instanceof SVGElement) return;
        el.removeAttribute('title');
        if (v.trim()) el.setAttribute('data-dno-tip', v); else el.removeAttribute('data-dno-tip');
        if (!el.hasAttribute('aria-label') && !el.textContent.trim() && v.trim()) el.setAttribute('aria-label', v);
    }
    function adoptTree(root) {
        if (root.nodeType !== 1) return;
        if (root.hasAttribute('title')) adopt(root);
        root.querySelectorAll('[title]').forEach(adopt);
    }
    new MutationObserver(muts => {
        for (const m of muts) {
            if (m.type === 'attributes') { if (m.target.hasAttribute('title')) adopt(m.target); }
            else m.addedNodes.forEach(adoptTree);
        }
    }).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['title'] });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => adoptTree(document.documentElement));
    else adoptTree(document.documentElement);

    let tipEl = null, tipTarget = null, tipTimer = null;
    function hideTip() {
        clearTimeout(tipTimer);
        tipTarget = null;
        if (tipEl) tipEl.classList.remove('show');
    }
    function placeTip(target) {
        const r = target.getBoundingClientRect();
        const tr = tipEl.getBoundingClientRect();
        const vw = window.innerWidth, vh = window.innerHeight, gap = 8;
        let x, y;
        // 세로 사이드바의 아이콘은 오른쪽에, 나머지는 아래(자리가 없으면 위)에
        if (target.closest('.side-nav') || target.dataset.tipSide === 'right') {
            x = r.right + gap; y = r.top + r.height / 2 - tr.height / 2;
            if (x + tr.width > vw - 8) x = r.left - gap - tr.width;
        } else {
            x = r.left + r.width / 2 - tr.width / 2; y = r.bottom + gap;
            if (y + tr.height > vh - 8) y = r.top - gap - tr.height;
        }
        x = Math.max(8, Math.min(x, vw - tr.width - 8));
        y = Math.max(8, Math.min(y, vh - tr.height - 8));
        tipEl.style.left = x + 'px';
        tipEl.style.top = y + 'px';
    }
    function showTip(target) {
        const text = target.getAttribute('data-dno-tip');
        if (!text || !target.isConnected) return;
        if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'dno-tip'; tipEl.setAttribute('role', 'tooltip'); document.body.appendChild(tipEl); }
        tipEl.textContent = t(text);
        // 네온 테마: 가리킨 버튼의 색(입법=보라, 선거=금색 …)을 말풍선 테두리·글자색으로
        if (!isModern()) {
            const c = getComputedStyle(target).color;
            tipEl.style.setProperty('--dno-tip-c', c && c !== 'rgba(0, 0, 0, 0)' ? c : '');
        } else tipEl.style.removeProperty('--dno-tip-c');
        tipEl.classList.remove('show');
        tipEl.style.left = '-9999px'; tipEl.style.top = '0';
        placeTip(target);
        tipEl.classList.add('show');
    }
    document.addEventListener('mouseover', e => {
        const target = e.target.closest ? e.target.closest('[data-dno-tip]') : null;
        if (target === tipTarget) return;
        hideTip();
        if (!target) return;
        tipTarget = target;
        tipTimer = setTimeout(() => { if (tipTarget === target) showTip(target); }, 350);
    }, true);
    document.addEventListener('mouseout', e => {
        if (tipTarget && (!e.relatedTarget || !tipTarget.contains(e.relatedTarget))) hideTip();
    }, true);
    ['mousedown', 'wheel', 'keydown', 'blur'].forEach(ev => window.addEventListener(ev, hideTip, true));
    window.addEventListener('scroll', hideTip, true);

    // ===== 알림창 · 확인창 =====
    const queue = [];
    let open = null;
    function runNext() {
        if (open || !queue.length) return;
        const job = queue.shift();
        injectStyle();
        hideTip();
        const overlay = document.createElement('div');
        overlay.className = 'dno-dialog-overlay';
        const box = document.createElement('div');
        box.className = 'dno-dialog tone-' + (job.opts.tone || (job.confirm || isModern() ? 'info' : 'warn'));
        box.setAttribute('role', job.confirm ? 'alertdialog' : 'alert');
        box.setAttribute('aria-modal', 'true');
        if (job.opts.title) {
            const h = document.createElement('div');
            h.className = 'dno-dialog-title';
            h.textContent = t(job.opts.title);
            box.appendChild(h);
        }
        const msg = document.createElement('div');
        msg.className = 'dno-dialog-msg';
        msg.textContent = t(job.message);
        box.appendChild(msg);
        const actions = document.createElement('div');
        actions.className = 'dno-dialog-actions';
        const ok = document.createElement('button');
        ok.type = 'button';
        ok.className = 'dno-dialog-btn ok';
        ok.textContent = job.opts.okText ? t(job.opts.okText) : (typeof getLang === 'function' && getLang() !== 'kr' ? 'OK' : '확인');
        actions.appendChild(ok);
        let cancel = null;
        if (job.confirm) {
            cancel = document.createElement('button');
            cancel.type = 'button';
            cancel.className = 'dno-dialog-btn cancel';
            cancel.textContent = t(job.opts.cancelText || '취소');
            actions.appendChild(cancel);
        }
        box.appendChild(actions);
        overlay.appendChild(box);
        const prevFocus = document.activeElement;
        const close = result => {
            document.removeEventListener('keydown', onKey, true);
            overlay.remove();
            open = null;
            if (prevFocus && prevFocus.focus && prevFocus.isConnected) try { prevFocus.focus({ preventScroll: true }); } catch (e) { /* 무시 */ }
            job.resolve(job.confirm ? result : undefined);
            runNext();
        };
        // 창이 떠 있는 동안 Esc/Enter는 이 창만 처리 (뒤 화면의 단축키로 새지 않게)
        const onKey = e => {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(false); }
            else if (e.key === 'Enter' && document.activeElement !== cancel) { e.preventDefault(); e.stopPropagation(); close(true); }
            else if (e.key === 'Tab') {
                e.preventDefault();
                const btns = cancel ? [ok, cancel] : [ok];
                const i = btns.indexOf(document.activeElement);
                btns[(i + (e.shiftKey ? btns.length - 1 : 1)) % btns.length].focus();
            } else e.stopPropagation();
        };
        ok.onclick = () => close(true);
        if (cancel) cancel.onclick = () => close(false);
        overlay.addEventListener('mousedown', e => { if (e.target === overlay && job.confirm) close(false); });
        document.addEventListener('keydown', onKey, true);
        (document.body || document.documentElement).appendChild(overlay);
        open = job;
        (job.opts.danger || job.opts.focusCancel) && cancel ? cancel.focus() : ok.focus();
    }
    function enqueue(message, opts, confirm) {
        return new Promise(resolve => {
            queue.push({ message: message == null ? '' : String(message), opts: opts || {}, confirm, resolve });
            if (document.body) runNext();
            else document.addEventListener('DOMContentLoaded', runNext, { once: true });
        });
    }

    window.DnoUI = {
        alert: (message, opts) => enqueue(message, opts, false),
        confirm: (message, opts) => enqueue(message, opts, true),
    };
    // 기존 코드의 alert()도 테마 창으로 — 알림 뒤의 코드는 기다리지 않고 바로 이어진다(기존 호출은 모두 알림 후 return)
    window.alert = message => { window.DnoUI.alert(message); };
})();
