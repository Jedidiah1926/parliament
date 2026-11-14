// 모던 테마 인라인 style 규칙을 클래스 규칙으로 바꿔 빠르게 (css/modern.css)
//
// css/modern.css는 옛 화면의 인라인 style(예: style="color:#888")을 테마색으로 바꾸려고
//   html[data-theme-family="modern"] [style*="color:#888" i]:not(:where([style*="border-left"]))
// 같은 선택자를 500개 넘게 쓴다. 이런 선택자는 브라우저가 style 속성이 있는 "모든" 요소마다 500번씩 글자를 찾아봐야 해서,
// 의원 카드처럼 요소가 수천 개 새로 생기는 탭을 열 때 스타일 계산만 0.2초씩 두세 번 걸렸다.
//
// 여기서 그 선택자들을 한 번 읽어
//   1) 규칙의 선택자를 클래스(.hs12)로 바꾸고 (우선순위가 같도록 클래스를 필요한 만큼 겹쳐 씀)
//   2) style 글자 → 붙일 클래스 목록을 글자별로 한 번만 계산해 두었다가 (같은 템플릿은 같은 글자라 거의 다 재사용)
//   3) 요소가 생기거나 style이 바뀌면 그 클래스를 붙인다.
// 그래서 css/modern.css는 지금처럼 [style*=...]로 계속 쓰면 된다. 시트를 읽을 수 없는 환경이면 아무것도 안 바꾼다(예전 그대로).
(function () {
    'use strict';
    const PREFIX = 'html[data-theme-family="modern"] ';
    const EMPTY = [];

    // 선택자 글자 해석 — 정규식으로 한 번에 훑는다 (규칙 글자가 250KB라 한 글자씩 보면 페이지를 열 때 20 ~ 40ms가 들었다)
    // [style*="값" i] · [style^="값"] 하나 — { op, val, ci }
    const Q = '"(?:[^"\\\\]|\\\\.)*"';
    const ATTR_SRC = `\\[style([*^$]?=)(${Q})(?:\\s+([is]))?\\]`;
    const ATTR_Y = new RegExp(ATTR_SRC, 'y'), ATTR_G = new RegExp(ATTR_SRC, 'g');
    const ATTR_ANY = `\\[style[*^$]?=${Q}(?:\\s+[is])?\\]`;
    const NOT_WHERE_Y = new RegExp(`:not\\(:where\\(((?:${ATTR_ANY}\\s*,?\\s*)+)\\)\\)`, 'y'); // :where()는 우선순위 0
    const NOT_Y = new RegExp(`:not\\((${ATTR_ANY})\\)`, 'y');                               // :not(x)는 x만큼
    const condOf = m => ({ op: m[1], val: m[2].slice(1, -1).replace(/\\(.)/g, '$1'), ci: m[3] === 'i' });
    const listOf = src => { const out = []; ATTR_G.lastIndex = 0; let m; while ((m = ATTR_G.exec(src))) out.push(condOf(m)); return out; };
    // 괄호 · 따옴표 밖의 쉼표로 나누기
    const TOK = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[()[\],]/g;
    function splitTop(src) {
        const out = []; let depth = 0, start = 0, m;
        TOK.lastIndex = 0;
        while ((m = TOK.exec(src))) {
            const c = m[0];
            if (c.length > 1) continue; // 따옴표 글자
            if (c === '(' || c === '[') depth++;
            else if (c === ')' || c === ']') depth--;
            else if (depth === 0) { out.push(src.slice(start, m.index)); start = m.index + 1; }
        }
        out.push(src.slice(start));
        return out.map(s => s.trim()).filter(Boolean);
    }
    // 복합 선택자가 style 속성 조건만으로 되어 있으면 { pos, neg, weight }, 아니면 null
    function parseCompound(src) {
        const pos = [], neg = []; let weight = 0, i = 0, m;
        while (i < src.length) {
            ATTR_Y.lastIndex = i;
            if ((m = ATTR_Y.exec(src))) { pos.push(condOf(m)); weight++; i = ATTR_Y.lastIndex; continue; }
            NOT_WHERE_Y.lastIndex = i;
            if ((m = NOT_WHERE_Y.exec(src))) { neg.push(listOf(m[1])); i = NOT_WHERE_Y.lastIndex; continue; }
            NOT_Y.lastIndex = i;
            if ((m = NOT_Y.exec(src))) { neg.push(listOf(m[1])); weight++; i = NOT_Y.lastIndex; continue; }
            return null;
        }
        return pos.length ? { pos, neg, weight } : null;
    }
    function hit(style, low, c) {
        const s = c.ci ? low : style, v = c.ci ? (c.lv || (c.lv = c.val.toLowerCase())) : c.val;
        if (c.op === '*=') return v !== '' && s.includes(v);
        if (c.op === '^=') return v !== '' && s.startsWith(v);
        if (c.op === '$=') return v !== '' && s.endsWith(v);
        return s === v;
    }

    const conds = [];          // [{ cls, pos, neg }]
    const byKey = new Map();   // 같은 조건은 같은 클래스
    let ready = false;
    const timing = { convert: 0, first: 0, observe: 0 }; // 걸린 시간(ms) — 성능 측정용

    // 선택자 목록 하나를 바꾼 글자, 바꿀 게 없으면 null
    function convertSelector(text) {
        let changed = false;
        const parts = splitTop(text).map(part => {
            if (!part.startsWith(PREFIX)) return part;
            const c = parseCompound(part.slice(PREFIX.length)); // 후손 선택자 · 클래스 · 의사 클래스가 섞이면 null → 그대로 둔다
            if (!c) return part;
            const key = JSON.stringify([c.pos, c.neg]);
            let entry = byKey.get(key);
            if (!entry) { entry = { cls: 'hs' + conds.length, pos: c.pos, neg: c.neg }; conds.push(entry); byKey.set(key, entry); }
            changed = true;
            return PREFIX + ('.' + entry.cls).repeat(Math.max(1, c.weight));
        });
        return changed ? parts.join(', ') : null;
    }
    // 규칙의 선택자만 바꾼다(selectorText). 바뀐 글자 전체로 새 <style>을 만드는 쪽이 더 빠르지만,
    // 브라우저가 var()가 든 단축 속성(background: var(--…) 등)을 글자로 되돌릴 때 값을 잃어 규칙이 깨지므로 쓰지 않는다
    function convertSheet(sheet) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { return 0; }
        let n = 0;
        const walk = list => {
            for (const rule of Array.from(list)) {
                if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules); continue; }
                const text = rule.selectorText;
                if (!text || text.indexOf('[style') < 0) continue;
                const next = convertSelector(text);
                if (next == null) continue;
                try { rule.selectorText = next; } catch (e) { continue; }
                if (rule.selectorText !== text) n++; // 바꾸지 못했으면 예전 선택자 그대로 동작
            }
        };
        walk(rules);
        return n;
    }

    // 빨리 거르기 — 조건마다 "이 글자가 style에 없으면 절대 안 맞는" 조각(그 조건의 글자 중 가장 드문 것)을 하나 골라 묶어 둔다.
    // style 글자 하나에 조건 1,400개를 다 해 보는 대신, 들어 있는 조각의 조건만 해 본다 (페이지를 열 때 수천 개 요소)
    let groups = null; // [[조각, [조건…]], …] + 조각 없는 조건
    let always = [];
    function buildGroups() {
        const tokensOf = c => {
            const out = new Set();
            c.pos.forEach(p => { const lv = p.val.toLowerCase(); (lv.match(/[a-z0-9#.%(),-]{3,}/g) || []).forEach(t => out.add(t)); });
            return [...out];
        };
        const freq = new Map();
        const toks = conds.map(c => { const t = tokensOf(c); t.forEach(x => freq.set(x, (freq.get(x) || 0) + 1)); return t; });
        const by = new Map(); always = [];
        conds.forEach((c, i) => {
            if (!toks[i].length) { always.push(c); return; }
            const best = toks[i].reduce((a, b) => (freq.get(b) < freq.get(a) || (freq.get(b) === freq.get(a) && b.length > a.length) ? b : a));
            if (!by.has(best)) by.set(best, []);
            by.get(best).push(c);
        });
        groups = [...by];
    }
    function test(style, low, c) {
        for (const p of c.pos) if (!hit(style, low, p)) return false;
        for (const list of c.neg) for (const p of list) if (hit(style, low, p)) return false;
        return true;
    }
    const cache = new Map();
    function classesFor(style) {
        let r = cache.get(style);
        if (r) return r;
        if (!groups) buildGroups();
        const low = style.toLowerCase();
        r = [];
        for (const c of always) if (test(style, low, c)) r.push(c.cls);
        for (const [tok, list] of groups) {
            if (low.indexOf(tok) < 0) continue;
            for (const c of list) if (test(style, low, c)) r.push(c.cls);
        }
        if (!r.length) r = EMPTY;
        if (cache.size > 20000) cache.clear();
        cache.set(style, r);
        return r;
    }
    function apply(el) {
        const style = el.getAttribute('style');
        const want = style ? classesFor(style) : EMPTY;
        const had = el.__hsCls || EMPTY;
        if (want === had) {
            if (want.length && !want.every(c => el.classList.contains(c))) el.classList.add(...want); // className을 통째로 바꾼 경우
            return;
        }
        for (const c of had) if (!want.includes(c)) el.classList.remove(c);
        for (const c of want) if (!el.classList.contains(c)) el.classList.add(c);
        el.__hsCls = want;
    }
    function applyTree(node) {
        if (node.nodeType !== 1) return;
        if (node.hasAttribute('style') || node.__hsCls) apply(node);
        if (node.firstElementChild) node.querySelectorAll('[style]').forEach(apply);
    }

    function start() {
        if (ready) return true;
        const sheets = Array.from(document.styleSheets).filter(s => s.href && /\/css\/modern\.css(\?|#|$)/.test(s.href));
        if (!sheets.length) return false;
        let converted = 0;
        const t0 = performance.now();
        sheets.forEach(s => { converted += convertSheet(s); });
        timing.convert = performance.now() - t0;
        ready = true;
        if (!converted) return true;
        const t1 = performance.now();
        applyTree(document.documentElement);
        timing.first = performance.now() - t1;
        new MutationObserver(records => {
            const t2 = performance.now();
            for (const m of records) {
                if (m.type === 'childList') m.addedNodes.forEach(applyTree);
                else if (m.target.nodeType === 1 && (m.attributeName === 'style' || m.target.__hsCls)) apply(m.target);
            }
            timing.observe += performance.now() - t2;
        }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
        return true;
    }

    window.HemiModernStyleIndex = { start, classesFor, timing, get rules() { return conds.length; }, get ready() { return ready; }, _parseCompound: parseCompound };
    // 네온(TNO) 테마에서는 이 규칙들이 아예 적용되지 않으니(html[data-theme-family="modern"] 아래) 아무것도 하지 않다가,
    // 모던(라이트 · 다크)으로 바뀌는 순간 시작한다 — 그 전까지는 원래 [style*=…] 규칙이 그대로 살아 있어 화면은 같다
    const root = document.documentElement;
    if (root.getAttribute('data-theme-family') && root.getAttribute('data-theme-family') !== 'modern') {
        const mo = new MutationObserver(() => { if (root.getAttribute('data-theme-family') === 'modern') { mo.disconnect(); start(); } });
        mo.observe(root, { attributes: true, attributeFilter: ['data-theme-family'] });
    } else if (document.readyState !== 'complete') {
        // 페이지를 다 연 뒤 한가할 때 — 여는 동안(첫 화면 · 로드)에는 아무것도 하지 않는다. 그 전까지는 원래 [style*=…] 규칙이 그대로 적용되고,
        // 바꾸는 순간에도 선택자 교체와 클래스 붙이기를 한 번에 해서 화면은 같다
        window.addEventListener('load', () => {
            if (typeof requestIdleCallback === 'function') requestIdleCallback(() => start(), { timeout: 400 }); else setTimeout(start, 0);
        }, { once: true });
    } else if (!start()) {
        // 시트가 아직 안 읽혔으면 읽히는 대로
        const link = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(l => /css\/modern\.css/.test(l.getAttribute('href') || ''));
        if (link) link.addEventListener('load', start, { once: true });
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
