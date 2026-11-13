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

    // [style*="값" i] · [style^="값"] 하나 — { op, val, ci }
    const ATTR = /^\[style([*^$]?=)"((?:[^"\\]|\\.)*)"(?:\s+([is]))?\]/;
    function parseAttr(src) {
        const m = ATTR.exec(src);
        if (!m) return null;
        return { len: m[0].length, cond: { op: m[1], val: m[2].replace(/\\(.)/g, '$1'), ci: m[3] === 'i' } };
    }
    // 괄호 짝을 맞춰 안쪽 글자
    function inside(src, open) {
        let depth = 0, q = null;
        for (let i = open; i < src.length; i++) {
            const c = src[i];
            if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
            if (c === '"' || c === "'") q = c;
            else if (c === '(') depth++;
            else if (c === ')' && --depth === 0) return { body: src.slice(open + 1, i), end: i + 1 };
        }
        return null;
    }
    function splitTop(src) {
        const out = []; let depth = 0, q = null, start = 0;
        for (let i = 0; i < src.length; i++) {
            const c = src[i];
            if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
            if (c === '"' || c === "'") q = c;
            else if (c === '(' || c === '[') depth++;
            else if (c === ')' || c === ']') depth--;
            else if (c === ',' && depth === 0) { out.push(src.slice(start, i)); start = i + 1; }
        }
        out.push(src.slice(start));
        return out.map(s => s.trim()).filter(Boolean);
    }
    // 복합 선택자가 style 속성 조건만으로 되어 있으면 { pos, neg, weight }, 아니면 null
    function parseCompound(src) {
        const pos = [], neg = []; let weight = 0, i = 0;
        while (i < src.length) {
            const rest = src.slice(i);
            const a = parseAttr(rest);
            if (a) { pos.push(a.cond); weight++; i += a.len; continue; }
            if (rest.startsWith(':not(')) {
                const p = inside(src, i + 4);
                if (!p) return null;
                let body = p.body.trim(), counts = true;
                if (body.startsWith(':where(')) {
                    const w = inside(body, 6);
                    if (!w || w.end !== body.length) return null;
                    body = w.body; counts = false; // :where()는 우선순위 0
                }
                const list = splitTop(body).map(x => { const r = parseAttr(x); return r && r.len === x.length ? r.cond : null; });
                if (!list.length || list.some(x => !x)) return null;
                neg.push(list);
                if (counts) weight++; // :not(x)는 x만큼
                i = p.end; continue;
            }
            return null;
        }
        return pos.length ? { pos, neg, weight } : null;
    }
    function hit(style, low, c) {
        const s = c.ci ? low : style, v = c.ci ? c.val.toLowerCase() : c.val;
        if (c.op === '*=') return v !== '' && s.includes(v);
        if (c.op === '^=') return v !== '' && s.startsWith(v);
        if (c.op === '$=') return v !== '' && s.endsWith(v);
        return s === v;
    }

    const conds = [];          // [{ cls, pos, neg }]
    const byKey = new Map();   // 같은 조건은 같은 클래스
    let ready = false;

    function convertSheet(sheet) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { return 0; }
        let n = 0;
        const walk = list => {
            for (const rule of Array.from(list)) {
                if (rule.cssRules && !rule.selectorText) { walk(rule.cssRules); continue; }
                const text = rule.selectorText;
                if (!text || text.indexOf('[style') < 0) continue;
                let changed = false;
                const parts = splitTop(text).map(part => {
                    if (!part.startsWith(PREFIX)) return part;
                    const compound = part.slice(PREFIX.length);
                    const c = parseCompound(compound); // 후손 선택자 · 클래스 · 의사 클래스가 섞이면 null → 그대로 둔다
                    if (!c) return part;
                    const key = JSON.stringify([c.pos, c.neg]);
                    let entry = byKey.get(key);
                    if (!entry) { entry = { cls: 'hs' + conds.length, pos: c.pos, neg: c.neg }; conds.push(entry); byKey.set(key, entry); }
                    changed = true;
                    return PREFIX + ('.' + entry.cls).repeat(Math.max(1, c.weight));
                });
                if (!changed) continue;
                const next = parts.join(', ');
                try { rule.selectorText = next; } catch (e) { continue; }
                if (rule.selectorText === text) continue; // 바꾸지 못함 — 예전 선택자 그대로 동작
                n++;
            }
        };
        walk(rules);
        return n;
    }

    const cache = new Map();
    function classesFor(style) {
        let r = cache.get(style);
        if (r) return r;
        const low = style.toLowerCase();
        r = [];
        for (const c of conds) {
            if (!c.pos.every(p => hit(style, low, p))) continue;
            if (c.neg.some(list => list.some(p => hit(style, low, p)))) continue;
            r.push(c.cls);
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
        sheets.forEach(s => { converted += convertSheet(s); });
        ready = true;
        if (!converted) return true;
        applyTree(document.documentElement);
        new MutationObserver(records => {
            for (const m of records) {
                if (m.type === 'childList') m.addedNodes.forEach(applyTree);
                else if (m.target.nodeType === 1 && (m.attributeName === 'style' || m.target.__hsCls)) apply(m.target);
            }
        }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
        return true;
    }

    window.HemiModernStyleIndex = { start, classesFor, get rules() { return conds.length; }, _parseCompound: parseCompound };
    if (!start()) {
        // 시트가 아직 안 읽혔으면 읽히는 대로
        const link = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find(l => /css\/modern\.css/.test(l.getAttribute('href') || ''));
        if (link) link.addEventListener('load', start, { once: true });
        document.addEventListener('DOMContentLoaded', start, { once: true });
    }
})();
