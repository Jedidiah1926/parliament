// ===== 방향성(중점) 상자 그리기 — 게임(js/campaign.js)과 캠페인 편집기(js/campaign-editor.js)가 함께 씀 =====
// 기본 모양은 HOI4 중점처럼: 위에 큰 아이콘(그림 · 이모지), 아래에 이름판, 그 밑에 남은 날 · 진행 막대.
// 캠페인(모드)이 focusStyle로 모양을 통째로 바꿀 수 있다 (중점 템플릿 디자인):
//   focusStyle = { width, height, gapX, gapY, template: "HTML", css: "CSS" }
//   template의 자리표시: {{icon}}(그림/이모지 HTML) {{iconUrl}} {{title}} {{days}} {{daysText}} {{status}} {{statusText}} {{progress}} {{desc}} {{id}}
//   상자 바깥 요소에는 늘 class="hf-node hf-<상태>"(available · current · done · locked · blocked)가 붙으므로 CSS에서 상태별로 꾸밀 수 있다.
//   css는 방향성 트리 안에만 걸리도록 앞에 범위를 붙이고, 바깥 주소(url) · @import · 스크립트는 막는다 (그림은 data: 만).
(function () {
    'use strict';
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const DEFAULT = { width: 124, height: 116, gapX: 22, gapY: 30 };
    const num = (v, d, a, b) => { const n = Number(v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d; };

    function style(data) {
        const fs = (data && data.focusStyle) || {};
        return {
            width: num(fs.width, DEFAULT.width, 40, 400), height: num(fs.height, DEFAULT.height, 30, 400),
            gapX: num(fs.gapX, DEFAULT.gapX, 0, 200), gapY: num(fs.gapY, DEFAULT.gapY, 0, 200),
            template: typeof fs.template === 'string' ? fs.template.slice(0, 8000) : '',
            css: typeof fs.css === 'string' ? fs.css.slice(0, 20000) : '',
        };
    }

    // ---- 템플릿 HTML 거르기: 정해 둔 태그 · 속성만 남긴다 ----
    const TAGS = new Set(['DIV', 'SPAN', 'B', 'I', 'STRONG', 'EM', 'SMALL', 'BR', 'P', 'IMG', 'U', 'S', 'SUP', 'SUB']);
    const safeUrl = u => /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/i.test(u) || /^[\w./-]+\.(png|jpe?g|webp|gif|svg)$/i.test(u) || /^\{\{iconUrl\}\}$/.test(u);
    const cleanStyleAttr = v => String(v).replace(/url\s*\(([^)]*)\)/gi, (m, u) => (safeUrl(u.trim().replace(/^['"]|['"]$/g, '')) ? m : 'none')).replace(/expression\s*\(/gi, '(').replace(/javascript:/gi, '');
    const tplCache = new Map();
    function cleanTemplate(html) {
        if (tplCache.has(html)) return tplCache.get(html);
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const walk = node => {
            [...node.childNodes].forEach(ch => {
                if (ch.nodeType === 8) { ch.remove(); return; }
                if (ch.nodeType !== 1) return;
                if (!TAGS.has(ch.tagName)) { ch.replaceWith(...ch.childNodes); return walk(node); }
                [...ch.attributes].forEach(a => {
                    const n = a.name.toLowerCase();
                    if (n === 'class' || n === 'alt' || n === 'title' || n.startsWith('data-')) return;
                    if (n === 'style') { ch.setAttribute('style', cleanStyleAttr(a.value)); return; }
                    if (n === 'src' && ch.tagName === 'IMG' && safeUrl(a.value)) return;
                    ch.removeAttribute(a.name);
                });
                walk(ch);
            });
        };
        walk(tpl.content);
        const out = tpl.innerHTML;
        tplCache.set(html, out);
        if (tplCache.size > 50) tplCache.delete(tplCache.keys().next().value);
        return out;
    }

    // ---- CSS 거르기 + 범위 붙이기 ----
    function cleanCss(css) {
        return String(css || '').replace(/<\/?style/gi, '').replace(/@import[^;]*;?/gi, '').replace(/@charset[^;]*;?/gi, '')
            .replace(/url\s*\(([^)]*)\)/gi, (m, u) => (safeUrl(u.trim().replace(/^['"]|['"]$/g, '')) ? m : 'none'))
            .replace(/expression\s*\(/gi, '(').replace(/javascript:/gi, '').replace(/behavior\s*:/gi, 'x:');
    }
    function scopeCss(css, scope) {
        css = cleanCss(css).replace(/\/\*[\s\S]*?\*\//g, '');
        let out = '', i = 0;
        const scopeSel = sel => sel.split(',').map(x => { x = x.trim(); if (!x) return ''; if (/^(:root|html|body)\b/.test(x)) return scope + x.replace(/^(:root|html|body)/, ''); return `${scope} ${x}`; }).filter(Boolean).join(', ');
        while (i < css.length) {
            const open = css.indexOf('{', i);
            if (open < 0) break;
            const head = css.slice(i, open).trim();
            // 짝 맞는 } 찾기
            let depth = 1, j = open + 1;
            while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
            const body = css.slice(open + 1, j - 1);
            if (/^@(media|supports|container)/i.test(head)) out += `${head}{${scopeCss(body, scope)}}`;
            else if (/^@(-webkit-)?keyframes/i.test(head) || /^@font-face/i.test(head)) out += `${head}{${body}}`;
            else if (head && !head.startsWith('@')) out += `${scopeSel(head)}{${body}}`;
            i = j;
        }
        return out;
    }

    // ---- 상자 속 ----
    const STATUS_TEXT = { done: '완료', current: '진행 중', available: '고를 수 있음', locked: '아직 못 고름', blocked: '막힘' };
    function iconHtml(f) {
        if (f.iconImage) return `<img class="hf-icon-img" src="${esc(f.iconImage)}" alt="">`;
        if (f.icon) return `<span class="hf-icon-emoji">${esc(f.icon)}</span>`;
        return '<span class="hf-icon-blank"></span>';
    }
    // ctx = { status, daysText, progress(0~100), current }
    function inner(f, ctx, st) {
        const status = ctx.status || 'available';
        if (st && st.template) {
            const vals = { icon: iconHtml(f), iconUrl: esc(f.iconImage || ''), title: esc(f.title || f.id), days: esc(Number(f.days) || 0), daysText: esc(ctx.daysText || ''),
                status: esc(status), statusText: esc(STATUS_TEXT[status] || ''), progress: esc(Math.round(ctx.progress || 0)), desc: esc(f.desc || ''), id: esc(f.id) };
            return cleanTemplate(st.template).replace(/\{\{(\w+)\}\}/g, (m, k) => (k in vals ? vals[k] : ''));
        }
        return `<span class="hf-icon">${iconHtml(f)}${status === 'done' ? '<span class="hf-check">✔</span>' : ''}${status === 'blocked' ? '<span class="hf-x">✕</span>' : ''}</span>
            <span class="hf-plate"><span class="hf-title">${esc(f.title || f.id)}</span></span>
            <span class="hf-days">${esc(ctx.daysText || '')}</span>
            ${ctx.current ? `<span class="hf-bar"><i style="width:${Math.max(0, Math.min(100, ctx.progress || 0))}%"></i></span>` : ''}`;
    }
    // 트리 안에 넣을 <style> — 캠페인이 정한 css를 그 트리 안으로만
    function styleTag(st, scope) { return st && st.css ? `<style>${scopeCss(st.css, scope)}</style>` : ''; }

    // ---- 기본(HOI4 중점) 모양 ----
    const css = document.createElement('style');
    css.textContent = `
        .hf-node { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 3px; padding: 2px 0 0; background: none; border: none; color: #ddd; font: inherit; text-align: center; }
        .hf-icon { position: relative; flex: 0 0 auto; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
        .hf-icon-img { width: 64px; height: 64px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
        .hf-icon-emoji { font-size: 40px; line-height: 1; filter: drop-shadow(0 2px 2px rgba(0,0,0,.6)); }
        .hf-icon-blank { width: 52px; height: 52px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #5a6470, #1e242b); border: 2px solid #7b8692; }
        .hf-plate { position: relative; width: 100%; padding: 3px 6px; background: linear-gradient(#2a2f36, #15191e); border: 1px solid #5d5640; box-shadow: inset 0 1px 0 rgba(255,255,255,.08); }
        .hf-title { display: block; font-size: .74rem; line-height: 1.2; color: #e8e1c8; word-break: keep-all; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .hf-days { font-size: .64rem; color: #8a94a3; line-height: 1; }
        .hf-bar { width: 86%; height: 4px; background: #1a1f26; border: 1px solid #333; } .hf-bar i { display: block; height: 100%; background: #ffd700; }
        .hf-check { position: absolute; right: -2px; bottom: -2px; font-size: .8rem; color: #fff; background: #2f9e44; border-radius: 50%; width: 18px; height: 18px; line-height: 18px; }
        .hf-x { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 2.6rem; color: #e5484d; text-shadow: 0 0 4px #000; }
        .hf-available .hf-plate { border-color: #c9a227; box-shadow: 0 0 8px rgba(255,215,0,.35); }
        .hf-available .hf-icon-img, .hf-available .hf-icon-emoji { filter: drop-shadow(0 0 6px rgba(255,215,0,.55)); }
        .hf-current .hf-plate { border-color: #ffd700; background: linear-gradient(#5a4a12, #2b230a); } .hf-current .hf-title { color: #fff6cf; }
        .hf-done .hf-plate { border-color: #3a8f5a; background: linear-gradient(#24462f, #142a1c); } .hf-done .hf-title { color: #d6f5df; }
        .hf-locked .hf-icon, .hf-locked .hf-plate { filter: grayscale(1) brightness(.7); } .hf-locked { opacity: .8; }
        .hf-blocked .hf-icon, .hf-blocked .hf-plate { filter: grayscale(1) brightness(.5); } .hf-blocked .hf-title { text-decoration: line-through; }
        html[data-theme-family="modern"] .hf-node { color: var(--m-text); }
        html[data-theme-family="modern"] .hf-plate { background: var(--m-surface); border: 1px solid var(--m-border); border-radius: 8px; box-shadow: var(--m-shadow-sm); }
        html[data-theme-family="modern"] .hf-title { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .hf-days { color: var(--m-text-3); }
        html[data-theme-family="modern"] .hf-icon-blank { background: radial-gradient(circle at 35% 30%, var(--m-surface-3), var(--m-border-strong)); border-color: var(--m-border); }
        html[data-theme-family="modern"] .hf-icon-img, html[data-theme-family="modern"] .hf-icon-emoji { filter: drop-shadow(0 2px 3px rgba(0,0,0,.25)); }
        html[data-theme-family="modern"] .hf-available .hf-plate { border-color: var(--m-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--m-accent) 22%, transparent); }
        html[data-theme-family="modern"] .hf-current .hf-plate { border-color: var(--m-gold); background: color-mix(in srgb, var(--m-gold) 14%, var(--m-surface)); } html[data-theme-family="modern"] .hf-current .hf-title { color: var(--m-text); }
        html[data-theme-family="modern"] .hf-done .hf-plate { border-color: var(--m-success); background: color-mix(in srgb, var(--m-success) 12%, var(--m-surface)); } html[data-theme-family="modern"] .hf-done .hf-title { color: var(--m-text); }
        html[data-theme-family="modern"] .hf-bar { background: var(--m-surface-2); border: none; border-radius: 3px; overflow: hidden; } html[data-theme-family="modern"] .hf-bar i { background: var(--m-gold); }
    `;
    document.head.appendChild(css);

    // 예제 템플릿 (편집기의 "예제 템플릿 넣기") — 동그란 메달 + 리본
    const EXAMPLE = {
        width: 110, height: 120, gapX: 26, gapY: 30,
        template: '<div class="medal">{{icon}}</div><div class="ribbon">{{title}}</div><small class="when">{{daysText}}</small>',
        css: '.hf-node .medal { width: 70px; height: 70px; border-radius: 50%; background: #1d2633; border: 3px solid #8a6d1f; display: flex; align-items: center; justify-content: center; overflow: hidden; }\n.hf-node .medal img { width: 56px; height: 56px; object-fit: contain; }\n.hf-node .ribbon { margin-top: 4px; padding: 2px 8px; background: #6b1f1f; color: #fff; font-size: 12px; clip-path: polygon(0 0, 100% 0, 92% 50%, 100% 100%, 0 100%, 8% 50%); }\n.hf-node .when { font-size: 10px; opacity: .7; }\n.hf-done .medal { border-color: #2f9e44; }\n.hf-available .medal { box-shadow: 0 0 10px #ffd700; }\n.hf-locked { filter: grayscale(1); opacity: .6; }',
    };

    window.HemiFocusView = { DEFAULT, style, inner, styleTag, scopeCss, cleanTemplate, iconHtml, EXAMPLE, STATUS_TEXT };
})();
