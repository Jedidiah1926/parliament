// 키 번역(0.2.4, js/lang.js) — 한국어 · 영어 · 불러온 팩에서
//  - data-i18n(글자) · data-i18n-title(속성) · {변수} · 복수형 · 문서를 읽는 중(DOMContentLoaded 전)에도 i18n()이 바로 됨
//  - 고른 팩에 없는 키는 한국어 글자 → 사전 번역(예전 방식)으로 이어짐, 키로 채운 글자는 사전 번역이 다시 건드리지 않음
//  - 나중에 그려진 data-i18n도 채움, 자식 요소가 있으면 건드리지 않음, 없는 키는 키 그대로 + missing()
//  - @2 팩 검사(keys만 있는 팩 · 복수형 · 잘못된 형식) · 번역 템플릿에 keys
//  - 실제 메인 화면: 한국어 · 영어에서 오류 없이 열리고 예전 사전 번역도 그대로
//   python3 -m http.server 8000 & node tests/lang-keys.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';

const KR_KEYS = {
    't.hello': '안녕하세요',
    't.tip': '도움말',
    't.days': '{n}일 뒤 다시',
    't.seats': { other: '{count}석' },
    't.fallback': '설정',
    't.ok': '국회 소식',
};
const EN_KEYS = {
    't.hello': 'Hello',
    't.tip': 'Help',
    't.days': 'Again in {n} days',
    't.seats': { one: '{count} seat', other: '{count} seats' },
    // t.fallback 없음 → 한국어 "설정" → 사전 번역 "Settings"
    't.ok': '설정 news', // 키로 채운 글자 안의 한국어는 사전 번역이 건드리지 않아야 함
};
const krPack = `window.DnoLangPacks = window.DnoLangPacks || {}; window.DnoLangPacks.kr = ${JSON.stringify({ format: 'dno-lang-pack@2', code: 'kr', name: '한국어', keys: KR_KEYS })};`;
const enPack = fs.readFileSync(path.join(__dirname, '..', 'lang', 'en.js'), 'utf8') + `\nwindow.DnoLangPacks.en.keys = ${JSON.stringify(EN_KEYS)};`;
const FIXTURE = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>i18n</title>
<script src="js/lang.js"></script></head><body>
<span id="a" data-i18n="t.hello">안녕</span>
<button id="b" data-i18n-title="t.tip" title="옛 도움말">?</button>
<span id="c" data-i18n="t.days" data-i18n-vars='{"n":3}'></span>
<span id="d1" data-i18n="t.seats" data-i18n-vars='{"count":1}'></span><span id="d2" data-i18n="t.seats" data-i18n-vars='{"count":2}'></span>
<span id="e" data-i18n="t.fallback">설정</span>
<span id="ok" data-i18n="t.ok">국회 소식</span>
<div id="f" data-i18n="t.hello"><b>자식</b></div>
<span id="g"></span>
<script>document.getElementById('g').textContent = i18n('t.days', { n: 5 }); window.__early = document.readyState;</script>
</body></html>`;

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        async function open(lang, url, packs = true, storage = {}) {
            const errors = [];
            const ctx = await browser.newContext(), p = await ctx.newPage();
            p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message));
            await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
            if (packs) {
                await ctx.route('**/lang/kr.js', r => r.fulfill({ contentType: 'text/javascript', body: krPack }));
                await ctx.route('**/lang/en.js', r => r.fulfill({ contentType: 'text/javascript', body: enPack }));
            }
            await ctx.route('**/__i18n.html', r => r.fulfill({ contentType: 'text/html', body: FIXTURE }));
            await ctx.addInitScript(([l, st]) => { Object.entries(st).forEach(([k, v]) => localStorage.setItem(k, v)); localStorage.setItem('dnoLang', l); }, [lang, storage]);
            await p.goto(base + url);
            await p.waitForLoadState('load');
            return { p, ctx, errors };
        }
        const read = p => p.evaluate(() => {
            const $ = id => document.getElementById(id);
            return { a: $('a').textContent, b: $('b').title, c: $('c').textContent, d1: $('d1').textContent, d2: $('d2').textContent, e: $('e').textContent,
                ok: $('ok').textContent, okMark: $('ok').hasAttribute('data-i18n-ok'), f: $('f').innerHTML, g: $('g').textContent, early: window.__early };
        });

        // ---- 한국어 ----
        {
            const { p, ctx, errors } = await open('kr', '/__i18n.html');
            const r = await read(p);
            assert.equal(r.a, '안녕하세요', 'kr: data-i18n은 한국어 팩 글자로 (HTML에 적힌 글자보다 우선)');
            assert.equal(r.b, '도움말', 'kr: data-i18n-title');
            assert.equal(r.c, '3일 뒤 다시', 'kr: data-i18n-vars 변수');
            assert.equal(r.d1, '1석'); assert.equal(r.d2, '2석');
            assert.equal(r.g, '5일 뒤 다시', 'kr: 문서를 읽는 중에도 i18n()이 바로 됨');
            assert.equal(r.early, 'loading');
            assert.equal(r.f, '<b>자식</b>', '자식 요소가 있는 data-i18n은 그대로');
            assert.equal(r.okMark, false, 'kr에선 data-i18n-ok를 달지 않음');
            const miss = await p.evaluate(() => [i18n('t.nope'), DnoLang.missing(), DnoLang.has('t.hello'), DnoLang.lang]);
            assert.deepEqual(miss, ['t.nope', ['t.nope'], true, 'kr'], '없는 키는 키 그대로 + missing()');
            // 나중에 그린 부분은 translateSubtree(= apply)로
            const late = await p.evaluate(() => { const s = document.createElement('span'); s.setAttribute('data-i18n', 't.hello'); document.body.appendChild(s); DnoLang.translateSubtree(s); return s.textContent; });
            assert.equal(late, '안녕하세요');
            assert.deepEqual(errors, []);
            await ctx.close();
        }

        // ---- 영어 (기본 제공 팩, 키 + 사전) ----
        {
            const { p, ctx, errors } = await open('en', '/__i18n.html');
            await p.waitForFunction(() => DnoLang.ready);
            const r = await read(p);
            assert.equal(r.a, 'Hello'); assert.equal(r.b, 'Help');
            assert.equal(r.c, 'Again in 3 days');
            assert.equal(r.d1, '1 seat', 'en: 복수형 one'); assert.equal(r.d2, '2 seats', 'en: 복수형 other');
            assert.equal(r.g, 'Again in 5 days', 'en: 문서를 읽는 중에도 영어 팩이 준비돼 있음 (깜빡임 없음)');
            assert.equal(r.e, 'Settings', 'en 팩에 없는 키 → 한국어 글자 → 사전 번역');
            assert.equal(r.ok, '설정 news', '키로 채운 글자는 사전 번역이 다시 건드리지 않음');
            assert.equal(r.okMark, true);
            // 나중에 그려진 data-i18n은 MutationObserver가 채움
            await p.evaluate(() => { const s = document.createElement('div'); s.id = 'late'; s.innerHTML = '<span data-i18n="t.hello">안녕</span><span>설정</span>'; document.body.appendChild(s); });
            await p.waitForFunction(() => document.getElementById('late').textContent === 'HelloSettings');
            // 번역 템플릿에 keys (한국어 키 전부, 영어 기준은 영어 글자 · 없으면 한국어)
            const tpl = await p.evaluate(async () => JSON.parse(await DnoLang.template('en')));
            assert.equal(tpl.format, 'dno-lang-pack@2');
            assert.equal(tpl.keys['t.hello'], 'Hello'); assert.equal(tpl.keys['t.fallback'], '설정');
            assert.ok(Array.isArray(tpl.dict) && tpl.dict.length > 1000, '템플릿에 사전도 그대로');
            assert.deepEqual(errors, []);
            await ctx.close();
        }

        // ---- 불러온 @2 팩 (keys만) · 팩 검사 ----
        {
            const { p, ctx } = await open('kr', '/__i18n.html');
            const v = await p.evaluate(() => ({
                keysOnly: DnoLang.validate({ format: 'dno-lang-pack@2', code: 'jp', name: '日本語', keys: { 't.hello': 'こんにちは', 't.seats': { other: '{count}議席', bad: 1 }, 'bad key!': 'x', 't.num': 3 } }),
                v1: DnoLang.validate({ format: 'dno-lang-pack@1', code: 'jp', name: '日本語', dict: [['국회', '国会']] }),
                v3: DnoLang.validate({ format: 'dno-lang-pack@3', code: 'jp', name: '日本語', keys: { a: 'b' } }),
                empty: DnoLang.validate({ format: 'dno-lang-pack@2', code: 'jp', name: '日本語', keys: {} }),
                install: DnoLang.install({ format: 'dno-lang-pack@2', code: 'jp', name: '日本語', keys: { 't.hello': 'こんにちは', 't.days': '{n}日後にまた' } }),
                stored: localStorage.getItem('dnoLangPacks'),
            }));
            assert.deepEqual(v.keysOnly.pack.keys, { 't.hello': 'こんにちは', 't.seats': { other: '{count}議席' } }, '잘못된 키 이름 · 글자가 아닌 값은 버림');
            assert.deepEqual(v.keysOnly.pack.dict, []);
            assert.ok(v.v1.pack, '예전 @1 팩도 읽음'); assert.deepEqual(v.v1.pack.keys, {});
            assert.ok(v.v3.error, '모르는 형식은 거절'); assert.ok(v.empty.error, 'keys도 dict도 없으면 거절');
            assert.equal(v.install.ok, true);
            await ctx.close();
            const jp = await open('jp', '/__i18n.html', true, { dnoLangPacks: v.stored }); // 불러온 팩은 브라우저 저장소에 남는다
            await jp.p.waitForFunction(() => DnoLang.ready);
            const r = await read(jp.p);
            assert.equal(r.a, 'こんにちは'); assert.equal(r.g, '5日後にまた', '불러온 팩도 문서를 읽는 중에 바로');
            assert.equal(r.b, '도움말', '그 팩에 없는 키는 한국어 글자');
            assert.deepEqual(jp.errors, []);
            await jp.ctx.close();
        }

        // ---- 실제 메인 화면 (실제 lang/kr.js · lang/en.js) ----
        for (const lang of ['kr', 'en']) {
            const { p, ctx, errors } = await open(lang, '/index.html', false);
            if (lang === 'en') await p.waitForFunction(() => DnoLang.ready);
            const r = await p.evaluate(() => ({ i18n: typeof window.i18n, kr: !!(window.DnoLangPacks && DnoLangPacks.kr), en: !!(window.DnoLangPacks && DnoLangPacks.en), label: document.querySelector('.home-menu-primary .home-menu-label').textContent }));
            assert.equal(r.i18n, 'function'); assert.equal(r.kr, true);
            assert.equal(r.en, lang === 'en', '영어일 때만 영어 팩을 읽음');
            if (lang === 'kr') assert.equal(r.label, '시작하기');
            else assert.ok(!/[가-힣]/.test(r.label), `en: 메인 메뉴가 예전처럼 영어로 (${r.label})`);
            assert.deepEqual(errors, [], `${lang}: 페이지 오류 없음`);
            await ctx.close();
        }
        console.log('lang-keys: 모두 통과');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
