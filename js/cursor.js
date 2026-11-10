// ===== Hemicycle — 테마 색 커서 모듈 =====
// 픽셀아트 커서(기본·손가락·텍스트·로딩)를 현재 강조색(--tno-neon)으로 그려서 적용한다.
// theme.js / thememode.js 다음에 head에서 로드한다.
//  - 네온 모드(네온 바탕 모드 테마 포함)에서만 켜짐: 사용자가 고른 테마 색을 따라감
//  - 라이트/다크로 바꾸면 커스텀 커서를 걷어 내고 원래 커서(CSS 키워드)로 되돌림
// 테마 색이나 모드가 바뀌면 theme.js가 쏘는 'hemi-theme-color' 이벤트를 받아 다시 그린다.
// 각 페이지 CSS에 이미 적힌 cursor: pointer / text / wait / default 규칙도 찾아서
// 커스텀 커서로 바꿔 주므로, CSS 파일을 따로 고칠 필요가 없다.
(function () {
    'use strict';

    // 'X' 테두리, 'o' 강조색, 'g' 모래(골드), 'd' 유리 안쪽(반투명 어둠)
    const SHAPES = {
        default: { hot: [0, 0], rows: [
            'X..........', 'XX.........', 'XoX........', 'XooX.......', 'XoooX......', 'XooooX.....',
            'XoooooX....', 'XooooooX...', 'XoooooooX..', 'XooooXXXXX.', 'XooXoX.....', 'XoX.XoX....',
            'XX..XoX....', 'X....XoX...', '.....XoX...', '......XX...'] },
        pointer: { hot: [5, 0], rows: [
            '.....XX.........', '....XooX........', '....XooX........', '....XooX........',
            '....XooXXX......', '....XooXooXXX...', '....XooXooXooXX.', '.XX.XooXooXooXoX',
            'XooXoooooooooooX', 'XooooooooooooooX', '.XooooooooooooX.', '.XooooooooooooX.',
            '..XooooooooooX..', '..XooooooooooX..', '...XooooooooX...', '...XXXXXXXXXX...'] },
        text: { hot: [4, 8], center: true, rows: [
            '.XXX.XXX.', '.XooXooX.', '..XXoXX..', '...XoX...', '...XoX...', '...XoX...', '...XoX...',
            '...XoX...', '...XoX...', '...XoX...', '...XoX...', '...XoX...', '...XoX...', '..XXoXX..',
            '.XooXooX.', '.XXX.XXX.'] },
        wait: { hot: [5, 7], center: true, rows: [
            'XXXXXXXXXXX', 'XoooooooooX', 'XXXXXXXXXXX', '.XdddddddX.', '.XgggggggX.', '..XgggggX..',
            '...XgggX...', '....XgX....', '...XdgdX...', '..XddgddX..', '.XdddgdddX.', '.XddgggddX.',
            '.XgggggggX.', 'XXXXXXXXXXX', 'XoooooooooX', 'XXXXXXXXXXX'] }
    };
    const FALLBACK = { default: 'default', pointer: 'pointer', text: 'text', wait: 'wait' };
    const DARK = '#05070a', LIGHT = '#f2f2f2', SAND = '#ffd700', GLASS = 'rgba(5,7,10,.66)';

    // 채움색 대비가 더 큰 쪽(검정/흰색)을 테두리로 쓴다 (WCAG 상대 휘도 기준)
    function luminance([r, g, b]) {
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function outlineFor(accent) {
        const L = luminance(accent);
        return (L + 0.05) / 0.05 >= 1.05 / (L + 0.05) ? DARK : LIGHT;
    }

    // 아무 CSS 색 문자열을 [r,g,b]로
    function toRgb(color) {
        const c = document.createElement('canvas').getContext('2d');
        c.fillStyle = '#00ffff';
        c.fillStyle = color;
        const v = c.fillStyle;
        if (v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
        const m = v.match(/[\d.]+/g);
        return m ? m.slice(0, 3).map(Number) : [0, 255, 255];
    }

    function currentAccent() {
        let v = '';
        try { v = getComputedStyle(document.documentElement).getPropertyValue('--tno-neon').trim(); } catch (e) {}
        if (!v && window.getThemeColor) v = window.getThemeColor();
        return v || '#00ffff';
    }

    // scale배 크기 + 바깥 테두리(pad)까지 그린 data URL
    function render(shape, accent, scale) {
        const rows = shape.rows, w = Math.max(...rows.map(r => r.length));
        const ox = shape.center ? Math.floor((16 - w) / 2) : 0;
        const pad = scale / 2, size = 16 * scale + pad * 2;
        const cv = document.createElement('canvas'); cv.width = cv.height = size;
        const ctx = cv.getContext('2d');
        const [r, g, b] = accent;
        const acc = `rgb(${r},${g},${b})`;

        // 1) 바깥 글로우 테두리: 실루엣을 pad만큼 넓혀 한 번에 반투명으로 합성
        const ring = document.createElement('canvas'); ring.width = ring.height = size;
        const rc = ring.getContext('2d'); rc.fillStyle = acc;
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
            if (ch !== '.') rc.fillRect((x + ox) * scale, y * scale, scale + pad * 2, scale + pad * 2);
        }));
        ctx.globalAlpha = 0.43; ctx.drawImage(ring, 0, 0); ctx.globalAlpha = 1;

        // 2) 본체 픽셀
        const col = { X: outlineFor(accent), o: acc, g: SAND, d: GLASS };
        rows.forEach((row, y) => [...row].forEach((ch, x) => {
            if (ch === '.') return;
            if (ch === 'd') ctx.clearRect(pad + (x + ox) * scale, pad + y * scale, scale, scale);
            ctx.fillStyle = col[ch];
            ctx.fillRect(pad + (x + ox) * scale, pad + y * scale, scale, scale);
        }));
        return { url: cv.toDataURL('image/png'), hx: (shape.hot[0] + ox) * scale + pad, hy: shape.hot[1] * scale + pad };
    }

    let supportsImageSet = null;
    function cursorValue(kind, accent) {
        const one = render(SHAPES[kind], accent, 2), two = render(SHAPES[kind], accent, 4);
        const tail = ` ${one.hx} ${one.hy}, ${FALLBACK[kind]}`;
        const set = `image-set(url("${one.url}") 1x, url("${two.url}") 2x)${tail}`;
        if (supportsImageSet === null) {
            try { supportsImageSet = CSS.supports('cursor', 'image-set(url("a.png") 1x) 0 0, auto'); } catch (e) { supportsImageSet = false; }
        }
        return supportsImageSet ? set : `url("${one.url}")${tail}`;
    }

    // ---- 1) 기본 규칙 (태그 단위) ----
    const BASE = {
        default: 'html, body',
        pointer: 'a[href], button:not(:disabled), select, summary, label[for], [role="button"], [onclick], .clickable, input[type="checkbox"], input[type="radio"], input[type="color"], input[type="range"], input[type="button"], input[type="submit"]',
        text: 'input[type="text"], input[type="search"], input[type="number"], input[type="email"], input[type="password"], input:not([type]), textarea, [contenteditable="true"]',
        wait: '[aria-busy="true"], .is-loading'
    };
    let styleEl = null;

    // ---- 2) 기존 CSS의 cursor 키워드 규칙을 찾아서 교체 ----
    const original = new WeakMap(); // rule -> 원래 키워드
    const patched = new Set();      // 커스텀 커서로 바꾼 규칙 — 네온이 아니게 되면 원래 키워드로 되돌림
    function eachRule(list, fn) {
        for (const rule of Array.from(list || [])) {
            if (rule.style && rule.style.cursor !== undefined) fn(rule);
            if (rule.cssRules) eachRule(rule.cssRules, fn);
        }
    }
    function patchSheets(values) {
        for (const sheet of Array.from(document.styleSheets)) {
            if (sheet.ownerNode === styleEl) continue;
            let rules; try { rules = sheet.cssRules; } catch (e) { continue; } // 다른 출처 시트는 건너뜀
            eachRule(rules, rule => {
                let kw = original.get(rule);
                if (!kw) {
                    const cur = rule.style.cursor.trim();
                    if (!values[cur]) return;
                    kw = cur; original.set(rule, kw);
                }
                rule.style.setProperty('cursor', values[kw], rule.style.getPropertyPriority('cursor'));
                patched.add(rule);
            });
        }
    }
    function restoreSheets() {
        patched.forEach(rule => {
            const kw = original.get(rule);
            if (kw) { try { rule.style.setProperty('cursor', kw, rule.style.getPropertyPriority('cursor')); } catch (e) {} }
        });
        patched.clear();
    }

    // 네온 모드인지 — thememode.js가 <html data-theme-family="tno">로 표시 (네온 바탕 모드 테마도 tno)
    function isNeon() {
        const root = document.documentElement;
        const fam = root.getAttribute('data-theme-family');
        if (fam) return fam === 'tno';
        return root.getAttribute('data-theme-mode') === 'tno';
    }

    let lastKey = '';
    function apply(force) {
        if (!isNeon()) {
            if (lastKey === 'off' && !force) return;
            lastKey = 'off';
            if (styleEl) styleEl.textContent = '';
            restoreSheets();
            return;
        }
        const accent = toRgb(currentAccent());
        const key = accent.join(',');
        if (key === lastKey && !force) return;
        lastKey = key;
        const values = {};
        Object.keys(SHAPES).forEach(k => { values[k] = cursorValue(k, accent); });
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = 'hemi-cursor-style';
            (document.head || document.documentElement).appendChild(styleEl);
        }
        styleEl.textContent = Object.keys(BASE).map(k => `${BASE[k]} { cursor: ${values[k]}; }`).join('\n');
        patchSheets(values);
    }

    // CSS 변수가 바뀐 직후 계산값을 읽도록 한 프레임 미룸
    function later(force) { requestAnimationFrame(() => apply(force)); }

    apply();
    document.addEventListener('DOMContentLoaded', () => apply(true));
    window.addEventListener('load', () => apply(true));
    window.addEventListener('hemi-theme-color', () => later(false));
    window.addEventListener('pageshow', e => { if (e.persisted) later(true); });
    // 모드 전환이 data-theme-mode 속성만 바꾸는 경우에도 따라가도록
    try {
        new MutationObserver(() => later(false)).observe(document.documentElement,
            { attributes: true, attributeFilter: ['data-theme-mode', 'data-theme-family', 'data-theme-mod', 'style', 'class'] });
    } catch (e) {}

    window.refreshHemiCursors = () => apply(true);
})();
