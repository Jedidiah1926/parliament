// ===== Hemicycle — 언어 전환 엔진 (키 번역) =====
// 화면 글자마다 고유 키(예: "home.menu.start")를 두고, 고른 언어 팩의 keys에서 글자를 찾는다. 한국어도 팩 하나(lang/kr.js)다.
//   HTML: data-i18n="키"(글자) · data-i18n-title / -placeholder / -alt / -aria-label / -modern-label(속성), 변수는 data-i18n-vars
//   JS:   i18n('키', { 변수 }) · 세이브에 남길 글은 i18n.ref('키', { 변수 })
//   팩에 키가 없으면 한국어 팩 글자 → 그래도 없으면 키 그대로.
// 언어 팩은 순수 데이터(JSON)라서 누구나 새 언어를 만들어 공유(창작마당)하고, 메인 화면 🌐에서 .json 파일로 불러와 쓸 수 있다.
//   - 기본 제공 팩: lang/<code>.js (JSON을 JS로 감싼 것 — 데스크톱 앱 file://에서도 읽힘)
//   - 불러온 팩: localStorage(hemiLangPacks)에 보관
//   - 모드 · 창작마당 팩(데스크톱 앱): 모드 폴더와 Steam 창작마당 구독 아이템에서 앱이 읽어 넘겨준다
//     (window.hemicycleDesktop.modLanguagePacks — electron/mods.js 참고). 지우려면 폴더를 지우거나 구독을 끊는다
// 팩 형식은 README의 "번역(언어 팩) 만들기" 참고 (형식 식별자: hemicycle-lang@2).
// (예전의 사전 번역 — 다 그려진 한국어 글자를 dict · patterns로 바꿔 끼우던 방식 — 은 모든 화면을 키로 옮긴 뒤 없앴다)
(function () {
    'use strict';

    const LANG_KEY = 'hemiLang';
    const PACKS_KEY = 'hemiLangPacks';
    const PACK_FORMAT = 'hemicycle-lang@2';
    const PACK_FORMATS = ['dno-lang-pack@1', PACK_FORMAT]; // @1: 예전 사전 팩(keys가 없으면 쓸 게 없어 거절) · @2: 키(keys)
    const KEY_NAME = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,119}$/; // 키 이름: 영문 · 숫자 · _ . -
    const PLURAL_CATS = ['zero', 'one', 'two', 'few', 'many', 'other'];
    const SOURCE_LANG = { code: 'kr', name: '한국어' };
    const BUILTIN = { en: { code: 'en', name: 'English', script: 'lang/en.js' } };
    const MAX_PACK_BYTES = 1500000; // localStorage 용량(보통 5MB)을 세이브와 나눠 쓰므로 팩 하나의 상한
    // 언어별 네온 폰트 — 네온 테마 글꼴(네오둥근모)에 없는 글자를 쓰는 언어는 그 글자를 지원하는 픽셀 폰트로 바꾼다.
    // 화면 곳곳의 font-family가 'NeoDunggeunmo' 이름을 직접 쓰므로, 같은 이름의 @font-face를 뒤에 하나 더 넣어 통째로 갈아 끼운다.
    //   maruminya: 마루미냐 한글(x12y12pxMaruMinyaHangul, SIL OFL 1.1 — fonts/maruminya/OFL.txt) — 한국어 · 일본어 12px 픽셀 폰트
    //              github.com/quiple/x12y12pxMaruMinyaHangul (원본: hicchicc/x12y12pxMaruMinya)
    // 언어 코드로 정해 두거나(일본어 jp), 언어 팩에 "neonFont": "maruminya"를 적는다
    const NEON_FONTS = { maruminya: 'fonts/maruminya/x12y12pxMaruMinyaHangul.woff2' };
    const NEON_FONT_BY_LANG = { jp: 'maruminya' };
    let neonFontApplied = '';
    function applyNeonFont(code, pack) {
        const key = (pack && NEON_FONTS[pack.neonFont] ? pack.neonFont : '') || NEON_FONT_BY_LANG[String(code || '').split('-')[0]];
        if (!key || !NEON_FONTS[key] || neonFontApplied === key) return;
        neonFontApplied = key;
        const style = document.createElement('style');
        style.id = 'hemiNeonFont';
        style.textContent = `@font-face { font-family: 'NeoDunggeunmo'; font-weight: normal; font-style: normal; font-display: block; src: url('${NEON_FONTS[key]}') format('woff2'); }`;
        (document.head || document.documentElement).appendChild(style);
        document.documentElement.setAttribute('data-neon-font', key);
    }

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

    function loadInstalled() {
        try {
            const obj = JSON.parse(safeGet(PACKS_KEY) || '{}');
            return obj && typeof obj === 'object' ? obj : {};
        } catch (e) { return {}; }
    }

    // 모드 · 창작마당 팩 — 형식 검사를 통과한 것만, 같은 코드는 먼저 온 것(모드 폴더 → 창작마당 순)만 쓴다
    const EXTERNAL = (function () {
        const out = {};
        const list = (window.hemicycleDesktop && Array.isArray(window.hemicycleDesktop.modLanguagePacks)) ? window.hemicycleDesktop.modLanguagePacks : [];
        list.forEach(entry => {
            const res = normalizePack(entry && entry.pack);
            if (res.error) { console.warn('언어 팩을 건너뜀:', entry && entry.folder, res.error); return; }
            if (out[res.pack.code]) return;
            out[res.pack.code] = { ...res.pack, source: entry.source === 'workshop' ? 'workshop' : 'local', itemId: entry.itemId || null };
        });
        return out;
    })();
    function externalPack(code) {
        // 직접 불러온 팩(localStorage)이 같은 코드를 쓰면 그쪽이 우선
        return loadInstalled()[code] ? null : (EXTERNAL[code] || null);
    }

    function isKnown(code) { return code === SOURCE_LANG.code || !!BUILTIN[code] || !!loadInstalled()[code] || !!EXTERNAL[code]; }

    function getLang() {
        const v = safeGet(LANG_KEY);
        return v && isKnown(v) ? v : SOURCE_LANG.code;
    }
    function setLang(code) {
        if (!isKnown(code)) return false;
        return safeSet(LANG_KEY, code);
    }

    function listLanguages() {
        const installed = loadInstalled();
        return [
            { code: SOURCE_LANG.code, name: SOURCE_LANG.name, builtin: true },
            ...Object.values(BUILTIN).map(b => ({ code: b.code, name: b.name, builtin: true })),
            ...Object.values(installed).map(p => ({ code: p.code, name: p.name, author: p.author || '', installed: true })),
            ...Object.values(EXTERNAL).filter(p => !installed[p.code]).map(p => ({ code: p.code, name: p.name, author: p.author || '', external: p.source })),
        ];
    }

    // ---- 팩 검증/정리 — 불러온 JSON을 엔진이 쓰는 형태로 맞추고, 문제가 있으면 이유를 돌려준다 ----
    function normalizePack(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: '언어 팩 형식이 아닙니다.' };
        if (raw.format && !PACK_FORMATS.includes(raw.format)) return { error: `지원하지 않는 형식입니다 (${String(raw.format)}).` };
        const code = String(raw.code || '').trim().toLowerCase();
        if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code)) return { error: '언어 코드(code)가 올바르지 않습니다. 예: "jp", "zh-tw", "en-gb"' };
        if (code === SOURCE_LANG.code || code === 'ko') return { error: '한국어는 기본 언어라 팩으로 불러올 수 없습니다.' };
        if (BUILTIN[code]) return { error: `"${code}"는 기본 제공 언어의 코드입니다. 다른 코드(예: "${code}-custom")를 쓰세요.` };
        const name = String(raw.name || '').trim();
        if (!name || name.length > 40) return { error: '언어 이름(name)을 1~40자로 적어 주세요.' };
        const keys = normalizeKeys(raw.keys);
        if (!Object.keys(keys).length) return { error: '번역(keys)이 없습니다. 예전 사전(dict) 팩은 더 쓰지 않습니다 — 번역 템플릿을 새로 받아 keys를 채워 주세요.' };
        const months = Array.isArray(raw.months) && raw.months.length === 12 ? raw.months.map(String) : null;
        const neonFont = NEON_FONTS[raw.neonFont] ? String(raw.neonFont) : undefined; // 네온 테마 글꼴 (위 NEON_FONTS 참고)
        return { pack: { format: PACK_FORMAT, code, name, author: String(raw.author || ''), version: String(raw.version || ''), months, keys, ...(neonFont ? { neonFont } : {}) } };
    }

    // keys: { "키": "글자" } — 글자 안의 {이름}은 변수 자리. 수에 따라 모양이 바뀌는 글자는
    // { "one": "{count} seat", "other": "{count} seats" }처럼 복수 범주(Intl.PluralRules)로 적고 count 변수로 고른다
    // trusted: 기본 제공 팩(lang/*.js). 불러온 팩 · 모드 팩은 글자의 < >를 전각(＜ ＞)으로 바꾼다 —
    // 화면이 키 글자를 innerHTML로 넣는 곳이 있어, 팩에 든 태그가 그대로 실행되지 않게
    const safeText = s => String(s).replace(/</g, '＜').replace(/>/g, '＞');
    function normalizeKeys(raw, trusted) {
        const out = {};
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
        const clean = trusted ? (s => s) : safeText;
        for (const [k, v] of Object.entries(raw)) {
            if (!KEY_NAME.test(k)) continue;
            if (typeof v === 'string') { out[k] = clean(v); continue; }
            if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.other === 'string') {
                const forms = {};
                PLURAL_CATS.forEach(c => { if (typeof v[c] === 'string') forms[c] = clean(v[c]); });
                out[k] = forms;
            }
        }
        return out;
    }

    function installPack(raw) {
        const text = JSON.stringify(raw);
        if (text.length > MAX_PACK_BYTES) return { ok: false, error: '언어 팩이 너무 큽니다.' };
        const { pack, error } = normalizePack(raw);
        if (error) return { ok: false, error };
        const installed = loadInstalled();
        installed[pack.code] = pack;
        if (!safeSet(PACKS_KEY, JSON.stringify(installed))) return { ok: false, error: '저장 공간이 부족해 언어 팩을 저장하지 못했습니다.' };
        return { ok: true, code: pack.code, name: pack.name };
    }

    function removePack(code) {
        const installed = loadInstalled();
        if (!installed[code]) return false;
        delete installed[code];
        safeSet(PACKS_KEY, JSON.stringify(installed));
        if (safeGet(LANG_KEY) === code && !EXTERNAL[code]) safeSet(LANG_KEY, SOURCE_LANG.code);
        return true;
    }

    // 기본 제공 팩 스크립트(lang/<code>.js)를 불러와 그 팩 데이터를 돌려준다
    const scriptLoads = {};
    function loadBuiltin(code) {
        const b = BUILTIN[code];
        if (!b) return Promise.reject(new Error('unknown builtin language: ' + code));
        if (window.HemiLangPacks && window.HemiLangPacks[code]) return Promise.resolve(window.HemiLangPacks[code]);
        if (!scriptLoads[code]) {
            scriptLoads[code] = new Promise((resolve, reject) => {
                const el = document.createElement('script');
                el.src = b.script;
                el.onload = () => (window.HemiLangPacks && window.HemiLangPacks[code] ? resolve(window.HemiLangPacks[code]) : reject(new Error('pack missing')));
                el.onerror = () => { delete scriptLoads[code]; reject(new Error('language pack load failed: ' + b.script)); };
                document.head.appendChild(el);
            });
        }
        return scriptLoads[code];
    }

    function getPack(code) {
        const installed = loadInstalled()[code];
        if (installed) return Promise.resolve(installed);
        const ext = externalPack(code);
        if (ext) return Promise.resolve(ext);
        return loadBuiltin(code);
    }

    // 번역가용 템플릿 — keys: { "키": "글자" }. 키(왼쪽)는 그대로 두고 글자(오른쪽)만 번역. {이름}은 변수 자리라 그대로 둔다
    //  · base 'kr': 한국어 글자를 채워 둠 (한국어를 보고 번역할 때) · base 'en': 영어 글자를 채워 둠 (영어를 보고 번역할 때)
    async function buildTemplate(base) {
        const en = await loadBuiltin('en');
        const ko = base === 'kr' || base === 'ko';
        const krKeys = sourceKeys(), enKeys = normalizeKeys(en.keys, true);
        const keys = {};
        Object.keys(krKeys).forEach(k => { keys[k] = ko ? krKeys[k] : (Object.prototype.hasOwnProperty.call(enKeys, k) ? enKeys[k] : krKeys[k]); });
        return JSON.stringify({
            format: PACK_FORMAT,
            code: '',
            name: '',
            author: '',
            version: '1',
            // 한국어 템플릿(키-한국어)은 한국어 모딩용 — 안내도 한국어로, 영어 템플릿(키-영어)은 해외 번역용 — 안내도 영어로
            _help: ko
                ? '키-한국어 템플릿입니다 (한국어 모딩용). keys는 { "키": "글자" }입니다. 키(왼쪽)는 바꾸지 말고 글자(오른쪽)만 고치세요. 글자 안의 {name} 같은 자리는 그대로 두세요. 수에 따라 모양이 바뀌는 글자는 { "one": "…", "other": "…" }처럼 적을 수 있습니다. months는 달 이름 12개입니다. code(예: "ko-mod", "jp")와 name(예: "한국어 (사투리)")을 채운 뒤 메인 화면 🌐 › 언어 팩 불러오기로 적용합니다 — "kr"과 "en"은 기본 언어 코드라 쓸 수 없습니다. 데스크톱 앱에서는 🌐 › 모드 폴더 열기로 연 폴더 안에 새 폴더를 만들어 이 파일을 넣어도 되고, 그 폴더가 그대로 창작마당 아이템이 됩니다.'
                : 'Key-English template (for translators). "keys" maps a key to its text: keep the key (left) and translate only the text (right). Keep {placeholders} such as {name} as they are. Text that changes with a number can be written as { "one": "…", "other": "…" }. "months" holds the 12 month names. Fill in "code" (e.g. "jp", "zh-tw", "en-gb") and "name" (e.g. "日本語"), then load the file via 🌐 › Load language pack on the main screen — "kr" and "en" are reserved for the built-in languages. In the desktop app you can also put this file in its own folder inside 🌐 › Open mods folder; that folder is a Workshop item as-is.',
            months: ko ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'] : en.months,
            keys,
        }, null, 1);
    }

    const current = getLang();
    const hasOwn = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);

    // ===== 키 번역 (0.2.4) =====
    // 한국어 팩(lang/kr.js)과 고른 기본 제공 팩(lang/<code>.js)은 페이지를 읽는 도중에 바로 붙여(document.write) 둔다 —
    // 그래야 뒤따르는 스크립트가 처음 그릴 때부터 i18n()을 쓸 수 있고, 한국어가 보였다가 바뀌는 깜빡임이 없다.
    // (이 파일은 모든 페이지에서 일반 <script>로 읽으므로 그 시점엔 아직 문서를 읽는 중이다)
    const packRegistry = () => (window.HemiLangPacks = window.HemiLangPacks || {});
    function writeScript(src) {
        if (document.readyState !== 'loading') return false;
        document.write('<script src="' + src + '"><\/script>');
        return true;
    }
    const SOURCE_SCRIPT = 'lang/kr.js';
    if (!packRegistry()[SOURCE_LANG.code] && !writeScript(SOURCE_SCRIPT)) {
        const el = document.createElement('script');
        el.src = SOURCE_SCRIPT;
        el.onload = () => applyKeysWhenReady();
        document.head.appendChild(el);
    }
    if (BUILTIN[current] && !packRegistry()[current] && !loadInstalled()[current] && !EXTERNAL[current] && writeScript(BUILTIN[current].script)) {
        // 붙여 둔 스크립트는 DOMContentLoaded 전에 실행된다. 그때도 없으면(파일 오류) 평소처럼 따로 읽는다
        scriptLoads[current] = new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
            .then(() => { const pk = packRegistry()[current]; if (pk) return pk; delete scriptLoads[current]; return loadBuiltin(current); });
    }

    function sourceKeys() {
        const pk = packRegistry()[SOURCE_LANG.code];
        if (pk && !pk._keys) pk._keys = normalizeKeys(pk.keys, true);
        return pk ? pk._keys : {};
    }
    let currentKeysCache = null;
    function currentKeys() {
        if (current === SOURCE_LANG.code) return sourceKeys();
        if (currentKeysCache) return currentKeysCache;
        const mine = loadInstalled()[current] || externalPack(current);
        const raw = mine || packRegistry()[current];
        if (!raw) return null; // 기본 제공 팩을 아직 읽는 중
        currentKeysCache = normalizeKeys(raw.keys, !mine);
        return currentKeysCache;
    }
    const LOCALE = { kr: 'ko', jp: 'ja', cn: 'zh-CN', tw: 'zh-TW' };
    const pluralRules = {};
    function plural(code, n) {
        const loc = LOCALE[code] || code;
        if (!pluralRules[loc]) { try { pluralRules[loc] = new Intl.PluralRules(loc); } catch (e) { pluralRules[loc] = new Intl.PluralRules('en'); } }
        return pluralRules[loc].select(n);
    }
    const missingKeys = new Set();
    // { v: 글자 또는 복수형, code: 그 글자의 언어, hit: 고른 언어 팩에서 찾았는지 }
    function lookup(key) {
        const cur = currentKeys();
        if (cur && hasOwn(cur, key)) return { v: cur[key], code: current, hit: true };
        const src = sourceKeys();
        if (hasOwn(src, key)) return { v: src[key], code: SOURCE_LANG.code, hit: current === SOURCE_LANG.code };
        if (!missingKeys.has(key)) { missingKeys.add(key); if (packRegistry()[SOURCE_LANG.code]) console.warn('[i18n] 한국어 팩에 없는 키:', key); }
        return { v: null, code: SOURCE_LANG.code, hit: false };
    }
    function formatText(r, vars) {
        let v = r.v;
        if (v && typeof v === 'object') {
            const n = Number(vars && vars.count);
            v = v[plural(r.code, isFinite(n) ? n : 0)] ?? v.other;
        }
        return String(v).replace(/\{([A-Za-z0-9_]+)\}/g, (m, name) => (vars && hasOwn(vars, name) && vars[name] != null ? String(vars[name]) : m));
    }
    // i18n(key, vars): 키의 글자. 변수는 {이름} 자리에 들어간다(글자 그대로 — innerHTML에 넣을 땐 부르는 쪽에서 escape)
    function k(key, vars) {
        const r = lookup(String(key));
        if (r.v == null) return String(key);
        return formatText(r, vars);
    }
    // ref(key, vars): 세이브에 남길 글자 — 글자 대신 { key, vars }를 저장해 두고, 보여 줄 때 그때 언어로 i18n(ref.key, ref.vars)
    k.ref = (key, vars) => (vars ? { key: String(key), vars } : { key: String(key) });
    // source(key, vars): 한국어 팩 글자 (세이브에 함께 남기는 한국어 글 — 예전 앱 · 기록 검색용)
    function source(key, vars) {
        const src = sourceKeys();
        return hasOwn(src, key) ? formatText({ v: src[key], code: SOURCE_LANG.code }, vars) : String(key);
    }
    // month(n): 달 이름 (한국어 "3월", 영어 "March") — 고른 팩에 months가 없으면 숫자 그대로
    function month(n) {
        const i = parseInt(n, 10);
        const raw = current === SOURCE_LANG.code ? packRegistry()[SOURCE_LANG.code] : (loadInstalled()[current] || externalPack(current) || packRegistry()[current]);
        const ms = raw && Array.isArray(raw.months) && raw.months.length === 12 ? raw.months : null;
        return ms && i >= 1 && i <= 12 ? String(ms[i - 1]) : String(n);
    }

    // HTML의 data-i18n(글자) · data-i18n-title 등(속성)을 채운다. 변수는 data-i18n-vars='{"n": 3}'
    // data-i18n은 자식 요소가 없는 요소에만 (아이콘 같은 자식이 지워지지 않도록 글자는 안쪽 <span>에 단다)
    const KEY_ATTRS = { 'data-i18n-title': 'title', 'data-i18n-placeholder': 'placeholder', 'data-i18n-alt': 'alt', 'data-i18n-aria-label': 'aria-label', 'data-i18n-modern-label': 'data-modern-label' };
    const KEY_SELECTOR = ['[data-i18n]', ...Object.keys(KEY_ATTRS).map(a => `[${a}]`)].join(',');
    const warnedEls = new WeakSet();
    function applyKeys(root) {
        if (!root || root.nodeType !== 1) return;
        const els = root.querySelectorAll(KEY_SELECTOR);
        if (root.matches(KEY_SELECTOR)) applyKeysTo(root);
        els.forEach(applyKeysTo);
    }
    // 엔진이 넣은 글자 · 속성 값 기억 — 스크립트가 나중에 그 글자를 바꿔 썼으면(게임 화면의 갱신되는 칸) 키로 되돌리지 않는다.
    // 처음 HTML에 적힌 한국어 글자(= 한국어 팩 글자)는 키 글자로 바꿔도 된다
    const keyedText = new WeakMap(), keyedAttr = new WeakMap();
    const srcText = (key, vars) => { const src = sourceKeys(); return hasOwn(src, key) ? formatText({ v: src[key], code: SOURCE_LANG.code }, vars) : null; };
    // 비교할 때 이모지 표시 선택자(U+FE0E · U+FE0F — 네온 테마가 이모지 뒤에 붙임, js/thememode.js)는 무시한다
    const plain = v => String(v ?? '').replace(/[\uFE0E\uFE0F]/g, '').trim();
    const untouched = (cur, mine, key, vars) => (mine != null ? plain(cur) === plain(mine) : (plain(cur) === '' || plain(cur) === plain(srcText(key, vars))));
    function applyKeysTo(el) {
        let vars = null;
        const rawVars = el.getAttribute('data-i18n-vars');
        if (rawVars) { try { vars = JSON.parse(rawVars); } catch (e) { vars = null; } }
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.children.length) {
                if (!warnedEls.has(el)) { warnedEls.add(el); console.warn('[i18n] data-i18n은 자식 요소가 없는 요소에만 다세요:', key, el); }
            } else if (!untouched(el.textContent, keyedText.get(el), key, vars)) {
                keyedText.delete(el); // 스크립트가 바꾼 글자 — 그대로 둔다
            } else {
                const r = lookup(key);
                if (r.v != null) { const t = formatText(r, vars); if (el.textContent !== t) el.textContent = t; keyedText.set(el, t); }
            }
        }
        for (const [dataAttr, attr] of Object.entries(KEY_ATTRS)) {
            const ak = el.getAttribute(dataAttr);
            if (!ak) continue;
            const mine = (keyedAttr.get(el) || {})[attr];
            if (!untouched(el.getAttribute(attr) || '', mine, ak, vars)) { const m = keyedAttr.get(el); if (m) delete m[attr]; continue; }
            const r = lookup(ak);
            if (r.v != null) { const t = formatText(r, vars); if (el.getAttribute(attr) !== t) el.setAttribute(attr, t); const m = keyedAttr.get(el) || {}; m[attr] = t; keyedAttr.set(el, m); }
        }
    }
    function applyKeysWhenReady() {
        if (document.readyState === 'loading') return; // DOMContentLoaded에서 한 번에
        applyKeys(document.documentElement);
    }
    document.addEventListener('DOMContentLoaded', () => applyKeys(document.documentElement), { once: true });

    window.getLang = getLang;
    window.setLang = setLang;
    // translateSubtree(el): 페이지 로드 뒤에 새로 그려진 부분의 data-i18n을 채운다 (보통은 아래 감시가 알아서 한다)
    // k(key, vars) = window.i18n: 키 번역 · apply(el): el 안의 data-i18n 채우기 · has(key): 한국어 팩에 있는 키인지
    // month(n): 달 이름 · source(key, vars): 한국어 글자 · i18n.ref(key, vars): 세이브에 남길 { key, vars }
    // missing(): 이 페이지에서 쓰였는데 한국어 팩에도 없는 키 · lang: 지금 언어 코드 · ready: 고른 언어 팩이 준비됐는지
    window.HemiLang = { list: listLanguages, install: installPack, remove: removePack, template: buildTemplate, validate: normalizePack, format: PACK_FORMAT,
        lang: current, k, month, source, apply: applyKeys, has: key => hasOwn(sourceKeys(), key), missing: () => [...missingKeys],
        translateSubtree: el => applyKeys(el), ready: current === SOURCE_LANG.code };
    window.i18n = k;

    if (current === SOURCE_LANG.code) return; // 한국어: HTML에 적힌 글자가 곧 한국어 팩 글자라 따로 할 일이 없다
    applyNeonFont(current); // 언어 코드로 정해 둔 네온 폰트 (팩에 neonFont가 있으면 팩을 읽은 뒤 한 번 더)

    // 고른 언어 팩이 준비되면 화면 전체의 키를 채우고, 그 뒤에 새로 그려지는 부분(innerHTML로 다시 그린 목록 · 창 등)도 계속 채운다
    const pageReady = new Promise(resolve => {
        if (document.readyState !== 'loading') resolve();
        else document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
    const packReady = getPack(current).then(pack => normalizePack(pack).pack || pack);
    packReady.then(pack => applyNeonFont(current, pack)).catch(() => {});
    Promise.all([packReady, pageReady]).then(() => {
        currentKeysCache = null; // 팩을 늦게 읽었으면 다시
        applyKeys(document.documentElement);
        window.HemiLang.ready = true;
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) m.addedNodes.forEach(n => { if (n.nodeType === 1 && n.isConnected) applyKeys(n); });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }).catch(() => { /* 팩을 읽지 못하면 한국어 그대로 표시 */ });
})();
