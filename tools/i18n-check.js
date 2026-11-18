#!/usr/bin/env node
// 키 번역(0.2.4) 검사 — 한국어 팩(lang/kr.js) · 기본 제공 팩(lang/en.js) · 화면(HTML · JS)이 서로 어긋나지 않았는지 본다.
//   node tools/i18n-check.js            오류가 있으면 종료 코드 1 (경고는 출력만)
//   node tools/i18n-check.js --strict   영어 팩에 빠진 키도 오류로
// 오류
//   - 화면에서 쓰는 키가 한국어 팩에 없음 (data-i18n="…" · i18n('…') · HemiLang.k('…'))
//   - 다른 팩에만 있는 키 (한국어 팩에서 지웠거나 오타)
//   - 다른 팩의 글자에 한국어 글자와 다른 {변수} 자리가 있음
//   - 복수형 글자({ one, other … })에 "other"가 없음
//   - HTML에 적어 둔 한국어 글자(<span data-i18n="키">글자</span>)가 한국어 팩 글자와 다름
// 경고
//   - 한국어 팩에는 있는데 다른 팩에 없는 키 (그 언어에서는 한국어 글자로 보임)
//   - 어디서도 쓰지 않는 키 (i18n(`prefix.${…}`) · 'prefix.' + 이름처럼 키를 만들어 쓰는 곳은 그 prefix로 시작하는 키를 쓰는 것으로 본다)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const ROOT = path.join(__dirname, '..');
const strict = process.argv.includes('--strict');
const SOURCE = 'kr';

function loadPacks() {
    const sandbox = { window: {} };
    vm.createContext(sandbox);
    for (const f of fs.readdirSync(path.join(ROOT, 'lang')).filter(f => /\.js$/.test(f)).sort()) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, 'lang', f), 'utf8'), sandbox, { filename: 'lang/' + f });
    }
    return sandbox.window.HemiLangPacks || {};
}

function listSources() {
    const files = [];
    for (const f of fs.readdirSync(ROOT)) if (/\.html$/.test(f) && !/^old/.test(f)) files.push(f);
    for (const f of fs.readdirSync(path.join(ROOT, 'js'))) if (/\.js$/.test(f) && f !== 'lang.js') files.push('js/' + f); // lang.js(엔진)는 주석에 예시 키가 있어 뺀다
    return files.sort();
}

const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const placeholders = v => {
    const all = typeof v === 'string' ? [v] : Object.values(v || {});
    return [...new Set(all.flatMap(s => [...String(s).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map(m => m[1])))].sort().join(',');
};
const decode = s => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

function main() {
    const packs = loadPacks();
    const kr = packs[SOURCE];
    const errors = [], warnings = [];
    if (!kr || !kr.keys) { console.error('lang/kr.js에 한국어 팩(keys)이 없습니다.'); process.exit(1); }
    const krKeys = kr.keys;

    // 쓰는 곳 모으기
    const used = new Map(); // key → ["file:line", ...]
    const prefixes = new Set();
    const mentioned = new Set(); // 따옴표 안에 적힌 키 이름 — i18n(cond ? 'a.b' : 'a.c')처럼 고르는 경우도 쓰는 것으로 본다
    const ATTR = /\bdata-i18n(?:-title|-placeholder|-alt|-aria-label|-modern-label)?="([^"$]+)"/g;
    const CALL = /(?:\bi18n(?:\.ref)?|\bHemiLang\.(?:k|source))\(\s*(['"])([^'"\n]+)\1/g;
    const DYN = /(?:\bi18n|\bHemiLang\.k)\(\s*`([^`$]*)\$\{/g;
    const INLINE = /<([a-zA-Z][\w-]*)\b([^>]*?)\sdata-i18n="([^"$]+)"([^>]*)>([^<]*)<\/\1>/g;
    for (const file of listSources()) {
        const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
        const add = (key, idx) => { if (!used.has(key)) used.set(key, []); used.get(key).push(`${file}:${lineOf(text, idx)}`); };
        for (const m of text.matchAll(ATTR)) add(m[1], m.index);
        for (const m of text.matchAll(CALL)) { if (m[2].endsWith('.')) prefixes.add(m[2]); else add(m[2], m.index); } // i18n('a.' + kind)는 prefix
        for (const m of text.matchAll(DYN)) if (m[1]) prefixes.add(m[1]);
        // 'common.date.' + form 처럼 점으로 끝나는 글자를 이어 붙여 키를 만드는 곳
        for (const m of text.matchAll(/(['"`])([A-Za-z0-9_][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)*\.)\1/g)) prefixes.add(m[2]);
        for (const m of text.matchAll(/(['"`])([A-Za-z0-9_][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+)\1/g)) mentioned.add(m[2]);
        // HTML에 적어 둔 한국어 글자 = 한국어 팩 글자 (변수가 있는 요소는 빼고)
        for (const m of text.matchAll(INLINE)) {
            const attrs = m[2] + m[4], key = m[3], inline = decode(m[5]).trim();
            if (/data-i18n-vars=/.test(attrs) || !inline || /\$\{/.test(inline)) continue;
            const v = krKeys[key];
            if (typeof v === 'string' && v.trim() !== inline) errors.push(`${file}:${lineOf(text, m.index)} — "${key}"의 HTML 글자 "${inline}"가 한국어 팩 글자 "${v}"와 다릅니다`);
        }
    }

    for (const [key, where] of used) if (!Object.prototype.hasOwnProperty.call(krKeys, key)) errors.push(`한국어 팩에 없는 키 "${key}" — ${where.slice(0, 3).join(', ')}${where.length > 3 ? ' …' : ''}`);
    for (const [key, v] of Object.entries(krKeys)) {
        if (v && typeof v === 'object' && typeof v.other !== 'string') errors.push(`lang/kr.js "${key}": 복수형에 "other"가 없습니다`);
        if (!used.has(key) && !mentioned.has(key) && ![...prefixes].some(p => key.startsWith(p))) warnings.push(`쓰지 않는 키 "${key}"`);
    }
    for (const [code, pack] of Object.entries(packs)) {
        if (code === SOURCE || !pack || !pack.keys) continue;
        const missing = [];
        for (const key of Object.keys(krKeys)) if (!Object.prototype.hasOwnProperty.call(pack.keys, key)) missing.push(key);
        for (const [key, v] of Object.entries(pack.keys)) {
            if (!Object.prototype.hasOwnProperty.call(krKeys, key)) { errors.push(`lang/${code}.js에만 있는 키 "${key}"`); continue; }
            if (v && typeof v === 'object' && typeof v.other !== 'string') errors.push(`lang/${code}.js "${key}": 복수형에 "other"가 없습니다`);
            if (placeholders(v) !== placeholders(krKeys[key])) errors.push(`lang/${code}.js "${key}": 변수 자리 {${placeholders(v)}}가 한국어 {${placeholders(krKeys[key])}}와 다릅니다`);
        }
        if (missing.length) (strict ? errors : warnings).push(`lang/${code}.js에 없는 키 ${missing.length}개: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ' …' : ''}`);
    }

    const total = Object.keys(krKeys).length;
    console.log(`키 ${total}개 · 화면에서 쓰는 키 ${used.size}개 · 팩: ${Object.keys(packs).sort().join(', ')}`);
    warnings.forEach(w => console.log('경고: ' + w));
    errors.forEach(e => console.log('오류: ' + e));
    if (errors.length) { console.log(`오류 ${errors.length}개`); process.exit(1); }
    console.log('문제없음');
}
main();
