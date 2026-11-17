// ===== Hemicycle — 언어 전환 엔진 =====
// 화면은 한국어로 만들어져 있고, 다른 언어는 "언어 팩"(한국어 → 번역 사전 + 패턴 규칙)으로
// 렌더링된 DOM 텍스트를 페이지 로드 때 한 번 치환해 표시한다. 언어 팩은 순수 데이터(JSON)라서
// 누구나 새 언어를 만들어 공유(창작마당)하고, 설정 화면에서 .json 파일로 불러와 쓸 수 있다.
//   - 기본 제공 팩: lang/<code>.js (JSON을 JS로 감싼 것 — 데스크톱 앱 file://에서도 읽힘)
//   - 불러온 팩: localStorage(hemiLangPacks)에 보관
//   - 모드 · 창작마당 팩(데스크톱 앱): 모드 폴더와 Steam 창작마당 구독 아이템에서 앱이 읽어 넘겨준다
//     (window.hemicycleDesktop.modLanguagePacks — electron/mods.js 참고). 지우려면 폴더를 지우거나 구독을 끊는다
// 팩 형식은 README의 "번역(언어 팩) 만들기" 참고 (형식 식별자: hemicycle-lang@2, 예전 @1도 읽음).
//
// 번역 방식 두 가지가 함께 돈다 (0.2.4 — 화면을 하나씩 키 방식으로 옮기는 중):
//   1) 키 번역(새 방식): 화면 글자마다 고유 키(예: "home.menu.start")를 두고, 고른 언어 팩의 keys에서 글자를 찾는다.
//      한국어도 팩 하나(lang/kr.js)다. HTML은 data-i18n="키"(글자) · data-i18n-title 등(속성), JS는 i18n('키', { 변수 })
//      팩에 키가 없으면 한국어 팩 글자 → 그래도 없으면 키 그대로. 한국어 글자로 돌아간 경우는 아래 2)가 이어서 번역한다
//   2) 사전 번역(예전 방식): 다 그려진 한국어 글자를 dict · patterns로 바꿔 끼운다. 아직 키로 옮기지 않은 화면용
(function () {
    'use strict';

    const LANG_KEY = 'hemiLang';
    const PACKS_KEY = 'hemiLangPacks';
    const PACK_FORMAT = 'hemicycle-lang@2';
    const PACK_FORMATS = ['dno-lang-pack@1', PACK_FORMAT]; // @1: 사전(dict · patterns)만 · @2: 키(keys)도
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
        let dict = raw.dict;
        if (dict && !Array.isArray(dict) && typeof dict === 'object') dict = Object.entries(dict);
        if (!Array.isArray(dict)) {
            if (!Object.keys(keys).length) return { error: '번역(keys 또는 dict)이 없습니다.' };
            dict = [];
        }
        dict = dict.filter(e => Array.isArray(e) && typeof e[0] === 'string' && e[0] && typeof e[1] === 'string');
        const patterns = [];
        for (const p of (Array.isArray(raw.patterns) ? raw.patterns : [])) {
            if (!p || typeof p.re !== 'string' || typeof p.to !== 'string') continue;
            try { new RegExp(p.re, p.flags || 'g'); } catch (e) { return { error: `패턴 정규식 오류: ${p.re}` }; }
            patterns.push({ re: p.re, to: p.to, flags: p.flags || 'g' });
        }
        const months = Array.isArray(raw.months) && raw.months.length === 12 ? raw.months.map(String) : null;
        const ordinal = raw.ordinal === 'en' ? 'en' : 'none';
        const neonFont = NEON_FONTS[raw.neonFont] ? String(raw.neonFont) : undefined; // 네온 테마 글꼴 (위 NEON_FONTS 참고)
        return { pack: { format: PACK_FORMAT, code, name, author: String(raw.author || ''), version: String(raw.version || ''), months, ordinal, patterns, dict, keys, ...(neonFont ? { neonFont } : {}) } };
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

    // 번역가용 템플릿 두 가지
    //  · keys: { "키": "글자" } — 키(왼쪽)는 그대로 두고 글자(오른쪽)만 번역. {이름}은 변수 자리라 그대로 둔다
    //  · dict: ["한국어 원문", "번역"] — 아직 키로 옮기지 않은 화면용. 첫 번째 칸은 앱이 찾는 열쇠라 그대로, 두 번째 칸만 번역
    //  · base 'kr': 한국어 글자를 채워 둠 (한국어를 보고 번역할 때) · base 'en': 영어 글자를 채워 둠 (영어를 보고 번역할 때)
    // 규칙(patterns)의 "to"는 어느 쪽이든 영어 예시로 들어 있으니 함께 번역한다
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
            _help: ko
                ? 'keys는 { "키": "글자" }입니다. 키(왼쪽)는 바꾸지 말고 글자(오른쪽)만 번역하세요. 글자 안의 {name} 같은 자리는 그대로 두세요. dict의 각 항목은 ["한국어 원문", "번역"]입니다. 두 번째 칸에 한국어 원문이 그대로 들어 있으니 그 칸만 번역하세요 (첫 번째 칸은 바꾸지 마세요). patterns의 "to"는 영어 예시이니 함께 번역하세요. code(예: "jp")와 name(예: "日本語")을 채운 뒤 메인 화면 🌐 > 언어 팩 불러오기로 적용합니다. 데스크톱 앱에서는 🌐 > 모드 폴더 열기로 연 폴더 안에 새 폴더를 만들어 이 파일을 넣어도 되고, 그 폴더가 그대로 창작마당 아이템이 됩니다.'
                : 'keys는 { "키": "글자" }입니다. 키(왼쪽)는 바꾸지 말고 글자(오른쪽)만 바꾸세요. {name} 같은 자리는 그대로 두세요. dict의 각 항목은 ["한국어 원문", "번역"]입니다. 두 번째 칸에 영어 번역이 들어 있으니 그 칸만 바꾸세요 (첫 번째 칸은 바꾸지 마세요). code(예: "jp")와 name(예: "日本語")을 채운 뒤 메인 화면 🌐 > 언어 팩 불러오기로 적용합니다. 데스크톱 앱에서는 🌐 > 모드 폴더 열기로 연 폴더 안에 새 폴더를 만들어 이 파일을 넣어도 됩니다 (그 폴더가 그대로 창작마당 아이템). / "keys" maps a key to its text: keep the key (left), translate only the text (right) and keep {placeholders} as they are. Each dict entry is ["Korean source", "translation"]. Replace only the second (English) column. In the desktop app you can also put this file in its own folder inside 🌐 > Open mods folder — that folder is a Workshop item as-is.',
            months: ko ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'] : en.months,
            ordinal: ko ? '' : en.ordinal,
            keys,
            patterns: en.patterns,
            dict: ko ? en.dict.map(e => [e[0], e[0]]) : en.dict,
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
    // 고른 언어 팩의 키로 만든 글자는 기억해 두고, 사전 번역(아래 엔진 · 알림창)이 다시 건드리지 않게 한다 —
    // 변수로 들어간 세이브 이름 같은 데이터("내 세이브")가 사전 때문에 "내 Save"로 바뀌지 않도록
    const keyedOutputs = new Set();
    function rememberKeyed(text) {
        const t = String(text).replace(/\uFE0E/g, '').trim();
        if (!t || !/[가-힣]/.test(t)) return; // 한국어가 없으면 사전 번역이 바꿀 것도 없다
        keyedOutputs.delete(t);
        keyedOutputs.add(t);
        if (keyedOutputs.size > 2000) keyedOutputs.delete(keyedOutputs.values().next().value);
    }
    // i18n(key, vars): 키의 글자. 변수는 {이름} 자리에 들어간다(글자 그대로 — innerHTML에 넣을 땐 부르는 쪽에서 escape)
    function k(key, vars) {
        const r = lookup(String(key));
        if (r.v == null) return String(key);
        const out = formatText(r, vars);
        if (r.hit && current !== SOURCE_LANG.code) rememberKeyed(out);
        return out;
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
    // 엔진이 넣은 글자 · 속성 값 기억 — 스크립트가 나중에 그 글자를 바꿔 썼으면(게임 화면의 갱신되는 칸) 키로 되돌리지 않고,
    // 사전 번역(아래 엔진)도 다시 그 글자를 번역하게 둔다. 처음 HTML에 적힌 한국어 글자(= 한국어 팩 글자)는 키 글자로 바꿔도 된다
    const keyedText = new WeakMap(), keyedAttr = new WeakMap();
    const srcText = (key, vars) => { const src = sourceKeys(); return hasOwn(src, key) ? formatText({ v: src[key], code: SOURCE_LANG.code }, vars) : null; };
    const untouched = (cur, mine, key, vars) => (mine != null ? cur === mine : (cur.trim() === '' || cur.trim() === String(srcText(key, vars) ?? '').trim()));
    function applyKeysTo(el) {
        let vars = null;
        const rawVars = el.getAttribute('data-i18n-vars');
        if (rawVars) { try { vars = JSON.parse(rawVars); } catch (e) { vars = null; } }
        let allHit = true;
        const key = el.getAttribute('data-i18n');
        if (key) {
            if (el.children.length) {
                if (!warnedEls.has(el)) { warnedEls.add(el); console.warn('[i18n] data-i18n은 자식 요소가 없는 요소에만 다세요:', key, el); }
                allHit = false;
            } else if (!untouched(el.textContent, keyedText.get(el), key, vars)) {
                keyedText.delete(el); allHit = false; // 스크립트가 바꾼 글자 — 그대로 두고 사전 번역에 맡김
            } else {
                const r = lookup(key);
                if (r.v != null) { const t = formatText(r, vars); if (el.textContent !== t) el.textContent = t; keyedText.set(el, t); }
                allHit = allHit && r.hit;
            }
        }
        for (const [dataAttr, attr] of Object.entries(KEY_ATTRS)) {
            const ak = el.getAttribute(dataAttr);
            if (!ak) continue;
            const mine = (keyedAttr.get(el) || {})[attr];
            if (!untouched(el.getAttribute(attr) || '', mine, ak, vars)) { const m = keyedAttr.get(el); if (m) delete m[attr]; allHit = false; continue; }
            const r = lookup(ak);
            if (r.v != null) { const t = formatText(r, vars); if (el.getAttribute(attr) !== t) el.setAttribute(attr, t); const m = keyedAttr.get(el) || {}; m[attr] = t; keyedAttr.set(el, m); }
            allHit = allHit && r.hit;
        }
        // 고른 언어 팩에서 모두 찾은 요소는 사전 번역(아래 엔진)이 다시 건드리지 않게 표시해 둔다
        if (current !== SOURCE_LANG.code) { if (allHit) el.setAttribute('data-i18n-ok', ''); else el.removeAttribute('data-i18n-ok'); }
    }
    // 사전 번역이 건너뛸 요소인가 — data-i18n-ok이고, 글자가 아직 엔진이 넣은 그대로일 때만
    function keyedIntact(el) {
        if (!el || !el.hasAttribute || !el.hasAttribute('data-i18n-ok')) return false;
        if (el.hasAttribute('data-i18n') && keyedText.has(el) && el.textContent !== keyedText.get(el)) { el.removeAttribute('data-i18n-ok'); return false; }
        return true;
    }
    const keyedAttrIntact = (el, attr) => { const m = keyedAttr.get(el); return !!(m && m[attr] != null && el.getAttribute(attr) === m[attr]); };
    function applyKeysWhenReady() {
        if (document.readyState === 'loading') return; // DOMContentLoaded에서 한 번에
        applyKeys(document.documentElement);
    }
    document.addEventListener('DOMContentLoaded', () => applyKeys(document.documentElement), { once: true });

    window.getLang = getLang;
    window.setLang = setLang;
    // translateSubtree(el): 페이지 로드 뒤에 새로 그려진 부분(시작 화면 세이브 목록, 로드맵 버전 탭 등)을 번역.
    // 한국어일 땐 키(data-i18n)만 채우고, 팩이 준비되기 전에 불리면 준비된 뒤에 번역한다.
    // t(s): 문자열 하나를 사전 번역 (한국어이거나 팩이 아직 준비 전이면 그대로)
    // k(key, vars) = window.i18n: 키 번역 · apply(el): el 안의 data-i18n 채우기 · has(key): 한국어 팩에 있는 키인지
    // month(n): 달 이름 · source(key, vars): 한국어 글자 · i18n.ref(key, vars): 세이브에 남길 { key, vars }
    // missing(): 이 페이지에서 쓰였는데 한국어 팩에도 없는 키 · lang: 지금 언어 코드
    // setDataStrings(list): 세이브에 든 데이터(정당 · 지역구 · 의원 · 법안 이름 등) — 화면 번역에서 건드리지 않는다 (1.6.0, js/main.js가 알려 줌)
    // exact(s): 사전에 통째로 있는 글자면 그 번역, 아니면 null (예전 세이브의 기본 이름을 한 번 바꿀 때 사용) · ready: 팩이 준비됐는지
    window.HemiLang = { list: listLanguages, install: installPack, remove: removePack, template: buildTemplate, validate: normalizePack, format: PACK_FORMAT,
        lang: current, k, month, source, apply: applyKeys, has: key => hasOwn(sourceKeys(), key), missing: () => [...missingKeys],
        translateSubtree: el => applyKeys(el), t: s => s, setDataStrings: () => {}, exact: () => null, ready: false };
    window.i18n = k;

    if (current === SOURCE_LANG.code) return; // 기본값(한국어)일 때는 사전 번역을 하지 않는다
    applyNeonFont(current); // 언어 코드로 정해 둔 네온 폰트 (팩에 neonFont가 있으면 팩을 읽은 뒤 한 번 더)

    // ===== 번역 엔진 =====
    function ordinalEn(v) {
        const n = parseInt(v, 10);
        if (isNaN(n)) return v;
        const suf = ['th', 'st', 'nd', 'rd'];
        const m = n % 100;
        return n + (suf[(m - 20) % 10] || suf[m] || suf[0]);
    }

    function buildTranslator(pack) {
        // 긴 문구가 짧은 부분 문자열보다 먼저 매칭되도록 길이 내림차순으로 정렬한 뒤
        // 하나의 정규식 alternation으로 합쳐 한 번에 치환한다 (겹치는 후보 중 먼저 오는 것이 우선됨)
        const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 네온 테마는 이모지 뒤에 텍스트 표시 선택자(U+FE0E)를 붙이므로(js/thememode.js), 사전 매칭에서는 이를 무시한다
        const sortedDict = pack.dict.map(e => [e[0].replace(/\uFE0E/g, ''), e[1]]).sort((a, b) => b[0].length - a[0].length);
        const dictMap = new Map(sortedDict);
        const dictRegex = sortedDict.length ? new RegExp(sortedDict.map(p => escapeRe(p[0])).join('|'), 'g') : null;
        const months = pack.months;
        const helpers = {
            month: v => { const i = parseInt(v, 10); return months && i >= 1 && i <= 12 ? months[i - 1] : v; },
            ordinal: v => (pack.ordinal === 'en' ? ordinalEn(v) : v),
            dict: v => dictMap.get(v) ?? v,
            map: (v, opt) => {
                for (const pair of String(opt || '').split(';')) {
                    const i = pair.indexOf('=');
                    if (i > 0 && pair.slice(0, i) === v) return pair.slice(i + 1);
                }
                return v;
            },
        };
        // 패턴의 "to" 템플릿: $1 같은 그룹 참조와 {{도우미:$1|옵션}} 형태의 도우미 호출
        const TOKEN = /\{\{(\w+):\$(\d+)(?:\|([^}]*))?\}\}|\$(\d+)/g;
        const patterns = (pack.patterns || []).map(p => {
            const re = new RegExp(p.re, p.flags || 'g');
            const replacer = (...args) => {
                const hasNamed = typeof args[args.length - 1] === 'object';
                const groups = args.slice(1, hasNamed ? -3 : -2);
                return p.to.replace(TOKEN, (_, name, hIdx, opt, gIdx) => {
                    if (gIdx) return groups[gIdx - 1] ?? '';
                    const v = groups[hIdx - 1] ?? '';
                    return helpers[name] ? helpers[name](v, opt) : v;
                });
            };
            return [re, replacer];
        });
        const translateString = function translateString(orig) {
            if (!orig) return orig;
            let s = orig.replace(/\uFE0E/g, '');
            const base = s;
            // 세이브 데이터(이름 등)는 번역하지 않는다 — 글자 전체가 데이터면 그대로, 섞여 있으면 데이터 부분을 잠시 빼 두었다가 되돌림
            const whole = s.trim();
            if (dataSet.has(whole) || keyedOutputs.has(whole)) return orig; // 키로 만든 글자도 그대로
            // 글자 전체가 사전에 있는 UI 문구면(예: "무소속 포함하기") 데이터 단어가 섞여 있어도 UI로 번역
            if (dictMap.has(whole)) { const t = s.replace(whole, dictMap.get(whole)); return window.HemiEmoji ? window.HemiEmoji.fix(t) : t; }
            const held = [];
            if (dataRe) s = s.replace(dataRe, m => { held.push(m); return '\uE000' + (held.length - 1) + '\uE001'; });
            for (const [re, rep] of patterns) s = s.replace(re, rep);
            if (dictRegex) s = s.replace(dictRegex, m => dictMap.get(m) ?? m);
            if (held.length) s = s.replace(/\uE000(\d+)\uE001/g, (_, i) => held[+i] ?? '');
            // 번역할 게 없었다면 선택자를 떼지 않은 원래 글자를 그대로 돌려준다 (이모지 표시 방식과 서로 되돌리며 반복하지 않게)
            return s === base ? orig : (window.HemiEmoji ? window.HemiEmoji.fix(s) : s);
        };
        translateString.exact = v => { const k = String(v == null ? '' : v).replace(/\uFE0E/g, ''); return dictMap.has(k) ? dictMap.get(k) : null; };
        return translateString;
    }

    // ── 세이브 데이터 보호 (1.6.0) ──
    // 화면 번역은 메뉴 · 버튼 · 안내 같은 UI 글자에만. 사용자가 정한 이름(정당 "국회" 등)이 "Parliament"로 바뀌지 않도록,
    // main.js가 알려 준 데이터 글자는 번역에서 뺀다. 앞뒤가 한글 · 영문 · 숫자로 이어진 경우(다른 단어의 일부)는 데이터로 보지 않는다
    let dataSet = new Set();
    let dataRe = null;
    let dataKey = '';
    function setDataStrings(list) {
        const uniq = [...new Set((list || []).map(v => String(v == null ? '' : v).replace(/\uFE0E/g, '').trim()).filter(v => v.length >= 2 && !/^[\d\s.,:%#()-]+$/.test(v)))];
        const key = uniq.join('\u0001');
        if (key === dataKey) return false;
        dataKey = key;
        dataSet = new Set(uniq);
        const esc = v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const sorted = uniq.slice().sort((a, b) => b.length - a.length);
        try { dataRe = sorted.length ? new RegExp('(?<![가-힣A-Za-z0-9])(?:' + sorted.map(esc).join('|') + ')(?![가-힣A-Za-z0-9])', 'g') : null; }
        catch (e) { dataRe = null; }
        return true;
    }
    window.HemiLang.setDataStrings = setDataStrings;
    // translate="no"가 붙은 요소(조문 등 데이터 덩어리) 안과, 키 번역으로 이미 채운 요소(data-i18n-ok)는 사전 번역하지 않는다
    const noTranslate = node => {
        const el = node && (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
        if (!el || !el.closest) return false;
        if (el.closest('[translate="no"]')) return true;
        const k = el.closest('[data-i18n-ok]');
        return !!(k && keyedIntact(k));
    };

    function translateTree(root, translateString) {
        function translateAttrs(el) {
            ['placeholder', 'title', 'alt'].forEach(attr => {
                if (el.hasAttribute && el.hasAttribute(attr) && !keyedAttrIntact(el, attr)) {
                    const v = el.getAttribute(attr);
                    const t = translateString(v);
                    if (t !== v) el.setAttribute(attr, t);
                }
            });
        }
        function translateNodeDeep(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const t = translateString(node.nodeValue);
                if (t !== node.nodeValue) node.nodeValue = t;
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const tag = node.tagName;
            if (tag === 'SCRIPT' || tag === 'STYLE') return;
            if (node.getAttribute('translate') === 'no') return;
            translateAttrs(node);
            if (keyedIntact(node)) return; // 키로 채운 글자 (아직 그대로)
            if (tag === 'TEXTAREA') return; // 텍스트에어리어 내용은 사용자가 입력한 법안 본문 — 번역하지 않음
            for (const child of Array.from(node.childNodes)) translateNodeDeep(child);
        }
        if (noTranslate(root)) return;
        translateNodeDeep(root);
    }
    translateTree.attrsOnly = function (el, translateString) {
        ['placeholder', 'title', 'alt'].forEach(attr => {
            if (el.hasAttribute && el.hasAttribute(attr) && !keyedAttrIntact(el, attr)) {
                const v = el.getAttribute(attr);
                const t = translateString(v);
                if (t !== v) el.setAttribute(attr, t);
            }
        });
    };

    // 초기 화면 로드 시점에 전체를 번역하고, 그 뒤에 새로 그려지거나 바뀐 부분은 MutationObserver로 계속 번역한다.
    // main.js/roadmap.js의 자체 초기 렌더링(window.onload)이 끝난 뒤에 실행되도록 load 이벤트를 기다린다.
    const pageLoaded = new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', () => resolve());
    });
    const packReady = getPack(current).then(pack => normalizePack(pack).pack || pack);

    // alert()/confirm()도 번역 사전을 거치도록 감싼다 (팩이 준비되기 전 메시지는 원문 그대로)
    let translate = s => s;
    const _alert = window.alert, _confirm = window.confirm;
    window.alert = function (msg) { return _alert.call(window, translate(String(msg))); };
    window.confirm = function (msg) { return _confirm.call(window, translate(String(msg))); };

    const waiting = new Set(); // 팩 준비 전에 번역 요청된 부분
    window.HemiLang.translateSubtree = el => { if (el) { applyKeys(el); waiting.add(el); } };
    packReady.then(pack => applyNeonFont(current, pack)).catch(() => {});
    Promise.all([packReady, pageLoaded]).then(([pack]) => {
        translate = buildTranslator(pack);
        translateTree(document.documentElement, translate);
        window.HemiLang.translateSubtree = el => { if (el) { applyKeys(el); translateTree(el, translate); } };
        window.HemiLang.t = s => translate(s);
        window.HemiLang.exact = s => translate.exact(s);
        window.HemiLang.ready = true;
        waiting.forEach(el => { if (el.isConnected) translateTree(el, translate); });
        waiting.clear();
        // 번역된 문자열로 직접 다시 그려야 하는 화면(로드맵 카드 제목 등)에 알림
        window.dispatchEvent(new Event('hemilangready'));
        // 앱이 나중에 다시 그리는 부분(목록 갱신, 도움말, 튜토리얼 말풍선, 알림창 등)도 계속 번역한다.
        // 번역 결과가 같으면 건드리지 않으므로, 이 번역이 다시 변경을 일으켜도 한 번 더 확인하고 멈춘다.
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                // 새로 그려진 부분: 키(data-i18n)를 먼저 채우고, 남은 한국어 글자를 사전으로 번역
                if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.isConnected) { applyKeys(n); translateTree(n, translate); } });
                else if (m.type === 'characterData') { if (m.target.parentNode && m.target.parentNode.tagName !== 'TEXTAREA') translateTree(m.target, translate); }
                else if (m.type === 'attributes') translateTree.attrsOnly(m.target, translate);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'alt'] });
    }).catch(() => { /* 팩을 읽지 못하면 한국어 그대로 표시 */ });
})();
