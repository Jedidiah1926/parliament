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
    --dno-tip-c: var(--tno-neon, #00ffff);
    position: fixed; z-index: 100000; pointer-events: none; max-width: min(320px, calc(100vw - 16px));
    padding: 6px 11px; font-size: 0.8rem; line-height: 1.45; word-break: keep-all;
    opacity: 0; transition: opacity .12s ease;
    background: var(--tno-panel, #0a0c10); color: var(--dno-tip-c);
    border: 1px solid var(--dno-tip-c); border-left-width: 3px;
    box-shadow: 0 0 12px color-mix(in srgb, var(--dno-tip-c) 35%, transparent);
    font-family: 'NeoDunggeunmo', 'VT323', monospace;
}
.dno-tip.show { opacity: 1; }
/* 바로 옆 대상으로 옮길 때 — 사라졌다 다시 뜨지 않고 미끄러지듯 따라간다 (접힌 사이드바의 점 훑기도) */
.dno-tip.moving { transition: opacity .12s ease, left .14s cubic-bezier(.2, .8, .2, 1), top .14s cubic-bezier(.2, .8, .2, 1); }
.dno-tip-title { display: block; white-space: pre-line; }
.dno-tip-sub { display: block; margin-top: 2px; font-size: .9em; color: #9aa4ad; white-space: pre-line; }
/* 꼬리 — 가리키는 쪽으로. 위치를 화면 안으로 당겨도 대상의 가운데를 가리키도록 --dno-tip-ax/ay로 옮긴다 */
.dno-tip::before {
    content: ''; position: absolute; width: 8px; height: 8px; box-sizing: border-box;
    background: inherit; border: inherit; border-width: 1px; transform: rotate(45deg);
}
.dno-tip[data-side="bottom"]::before { top: -5px; left: calc(var(--dno-tip-ax, 50%) - 4px); border-right: none; border-bottom: none; }
.dno-tip[data-side="top"]::before { bottom: -5px; left: calc(var(--dno-tip-ax, 50%) - 4px); border-left: none; border-top: none; }
.dno-tip[data-side="right"]::before { left: -6px; top: calc(var(--dno-tip-ay, 50%) - 4px); border-top: none; border-right: none; }
.dno-tip[data-side="left"]::before { right: -5px; top: calc(var(--dno-tip-ay, 50%) - 4px); border-bottom: none; border-left: none; }
html[data-theme-family="modern"] .dno-tip {
    background: var(--m-text, #18181b); color: var(--m-surface, #fff); border: none; border-radius: 8px; padding: 6px 10px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, .18); font-family: var(--m-font, inherit); font-weight: 500; font-size: 0.78rem;
}
html[data-theme-family="modern"] .dno-tip-sub { color: inherit; opacity: .72; font-weight: 400; }
html[data-theme-family="modern"] .dno-tip::before { border: none; }
@media (prefers-reduced-motion: reduce) { .dno-tip, .dno-tip.moving { transition: none; } }
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

    // 말풍선 — 처음엔 0.3초 뒤에 뜨고, 뜬 뒤(또는 사라진 지 0.6초 안에) 다른 대상으로 옮기면 기다리지 않고 미끄러지듯 따라간다.
    // 두 줄: data-dno-tip-sub(흐린 둘째 줄) 또는 글자의 첫 줄 = 이름, 나머지 = 설명.
    // 네온: 가리킨 대상의 색으로. 회색 대상은 기본은 네온색, 설정(dnoTipNeonGray = 'gray')이면 회색 그대로
    const SHOW_DELAY = 300, WARM_MS = 600, FADE_DELAY = 70;
    let tipEl = null, tipTarget = null, tipTimer = null, fadeTimer = null, lastShownAt = 0, visible = false;
    function ensureTip() {
        if (tipEl) return tipEl;
        tipEl = document.createElement('div'); tipEl.className = 'dno-tip'; tipEl.setAttribute('role', 'tooltip'); tipEl.id = 'dnoTip';
        tipEl.innerHTML = '<span class="dno-tip-title"></span><span class="dno-tip-sub"></span>';
        document.body.appendChild(tipEl);
        return tipEl;
    }
    function hideTip(now) {
        clearTimeout(tipTimer);
        if (tipTarget) { tipTarget.removeAttribute('aria-describedby'); tipTarget = null; }
        if (!tipEl || !visible) return;
        clearTimeout(fadeTimer);
        const fade = () => { tipEl.classList.remove('show', 'moving'); visible = false; lastShownAt = performance.now(); };
        if (now) fade(); else fadeTimer = setTimeout(fade, FADE_DELAY); // 바로 옆으로 옮기는 중이면 꺼지기 전에 다음 대상이 잡는다
    }
    function sideOf(target) {
        if (target.dataset.tipSide) return target.dataset.tipSide;
        return target.closest('.side-nav') ? 'right' : 'bottom';
    }
    function placeTip(target) {
        const r = target.getBoundingClientRect();
        const tr = tipEl.getBoundingClientRect();
        const vw = window.innerWidth, vh = window.innerHeight, gap = 9;
        let side = sideOf(target), x, y;
        if (side === 'right' || side === 'left') {
            x = side === 'right' ? r.right + gap : r.left - gap - tr.width;
            if (side === 'right' && x + tr.width > vw - 8) { side = 'left'; x = r.left - gap - tr.width; }
            else if (side === 'left' && x < 8) { side = 'right'; x = r.right + gap; }
            y = r.top + r.height / 2 - tr.height / 2;
        } else {
            y = side === 'bottom' ? r.bottom + gap : r.top - gap - tr.height;
            if (side === 'bottom' && y + tr.height > vh - 8) { side = 'top'; y = r.top - gap - tr.height; }
            else if (side === 'top' && y < 8) { side = 'bottom'; y = r.bottom + gap; }
            x = r.left + r.width / 2 - tr.width / 2;
        }
        x = Math.max(8, Math.min(x, vw - tr.width - 8));
        y = Math.max(8, Math.min(y, vh - tr.height - 8));
        tipEl.dataset.side = side;
        // 화면 끝에서 상자를 당겨도 꼬리는 대상의 가운데를
        tipEl.style.setProperty('--dno-tip-ax', Math.max(10, Math.min(tr.width - 10, r.left + r.width / 2 - x)) + 'px');
        tipEl.style.setProperty('--dno-tip-ay', Math.max(10, Math.min(tr.height - 10, r.top + r.height / 2 - y)) + 'px');
        tipEl.style.left = x + 'px';
        tipEl.style.top = y + 'px';
    }
    function neonColorOf(target) {
        const c = getComputedStyle(target).color;
        const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c || '');
        if (!m || (m[4] !== undefined && +m[4] === 0)) return '';
        const v = [+m[1], +m[2], +m[3]];
        const gray = Math.max(...v) - Math.min(...v) < 40; // 채도가 거의 없는 색 = 회색 · 흰색 · 검정
        if (gray) { let pref = null; try { pref = localStorage.getItem('dnoTipNeonGray'); } catch (e) { /* 저장 불가 */ } if (pref !== 'gray') return ''; }
        return c;
    }
    function tipText(target) {
        const raw = t(target.getAttribute('data-dno-tip') || '');
        const sub = target.getAttribute('data-dno-tip-sub');
        if (sub != null) return [raw, t(sub)];
        const i = raw.indexOf('\n');
        return i > 0 ? [raw.slice(0, i), raw.slice(i + 1).replace(/^\n+/, '')] : [raw, ''];
    }
    function showTip(target) {
        if (!target.isConnected || !target.getAttribute('data-dno-tip')) return;
        if (target.dataset.tipWhen === 'collapsed' && !document.body.classList.contains('side-nav-collapsed')) return;
        ensureTip();
        clearTimeout(fadeTimer);
        const [title, sub] = tipText(target);
        tipEl.querySelector('.dno-tip-title').textContent = title;
        const subEl = tipEl.querySelector('.dno-tip-sub');
        subEl.textContent = sub; subEl.style.display = sub ? '' : 'none';
        if (!isModern()) { const c = neonColorOf(target); if (c) tipEl.style.setProperty('--dno-tip-c', c); else tipEl.style.removeProperty('--dno-tip-c'); }
        else tipEl.style.removeProperty('--dno-tip-c');
        const follow = visible; // 이미 떠 있으면 그 자리에서 미끄러져 옮겨 감
        tipEl.classList.toggle('moving', follow);
        if (!follow) { tipEl.style.left = '-9999px'; tipEl.style.top = '0'; }
        placeTip(target);
        tipEl.classList.add('show');
        visible = true;
        target.setAttribute('aria-describedby', 'dnoTip');
    }
    function armTip(target, immediate) {
        if (target === tipTarget) return;
        clearTimeout(tipTimer);
        if (tipTarget) tipTarget.removeAttribute('aria-describedby');
        tipTarget = target;
        const warm = visible || performance.now() - lastShownAt < WARM_MS;
        if (immediate || warm) showTip(target);
        else tipTimer = setTimeout(() => { if (tipTarget === target) showTip(target); }, SHOW_DELAY);
    }
    document.addEventListener('mouseover', e => {
        const target = e.target.closest ? e.target.closest('[data-dno-tip]') : null;
        if (target === tipTarget) return;
        if (!target) { hideTip(); return; }
        armTip(target);
    }, true);
    document.addEventListener('mouseout', e => {
        if (tipTarget && (!e.relatedTarget || !tipTarget.contains(e.relatedTarget))) {
            const next = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('[data-dno-tip]') : null;
            if (!next) hideTip();
        }
    }, true);
    // 키보드로 옮겨 온 포커스에도 (마우스 클릭으로 생긴 포커스는 빼고)
    document.addEventListener('focusin', e => {
        const target = e.target.closest ? e.target.closest('[data-dno-tip]') : null;
        if (!target) return;
        let kb = false; try { kb = e.target.matches(':focus-visible'); } catch (err) { /* 미지원 */ }
        if (kb) armTip(target, true);
    }, true);
    document.addEventListener('focusout', e => { if (tipTarget && e.target.closest && e.target.closest('[data-dno-tip]') === tipTarget) hideTip(true); }, true);
    ['mousedown', 'wheel', 'blur'].forEach(ev => window.addEventListener(ev, () => hideTip(true), true));
    window.addEventListener('keydown', e => { if (e.key !== 'Tab' && e.key !== 'Shift') hideTip(true); }, true);
    window.addEventListener('scroll', () => hideTip(true), true);
    window.DnoTip = { hide: () => hideTip(true), show: el => armTip(el, true) };

    // ===== 알림창 · 확인창 =====
    const queue = [];
    let open = null;
    function runNext() {
        if (open || !queue.length) return;
        const job = queue.shift();
        injectStyle();
        hideTip(true);
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
