// ===== Hemicycle — 언어 전환 엔진 =====
// 화면은 한국어로 만들어져 있고, 다른 언어는 "언어 팩"(한국어 → 번역 사전 + 패턴 규칙)으로
// 렌더링된 DOM 텍스트를 페이지 로드 때 한 번 치환해 표시한다. 언어 팩은 순수 데이터(JSON)라서
// 누구나 새 언어를 만들어 공유(창작마당)하고, 설정 화면에서 .json 파일로 불러와 쓸 수 있다.
//   - 기본 제공 팩: lang/<code>.js (JSON을 JS로 감싼 것 — 데스크톱 앱 file://에서도 읽힘)
//   - 불러온 팩: localStorage(dnoLangPacks)에 보관
// 팩 형식은 README의 "번역(언어 팩) 만들기" 참고 (형식 식별자: dno-lang-pack@1).
(function () {
    'use strict';

    const LANG_KEY = 'dnoLang';
    const PACKS_KEY = 'dnoLangPacks';
    const PACK_FORMAT = 'dno-lang-pack@1';
    const SOURCE_LANG = { code: 'kr', name: '한국어' };
    const BUILTIN = { en: { code: 'en', name: 'English', script: 'lang/en.js' } };
    const MAX_PACK_BYTES = 1500000; // localStorage 용량(보통 5MB)을 세이브와 나눠 쓰므로 팩 하나의 상한

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

    function loadInstalled() {
        try {
            const obj = JSON.parse(safeGet(PACKS_KEY) || '{}');
            return obj && typeof obj === 'object' ? obj : {};
        } catch (e) { return {}; }
    }

    function isKnown(code) { return code === SOURCE_LANG.code || !!BUILTIN[code] || !!loadInstalled()[code]; }

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
        ];
    }

    // ---- 팩 검증/정리 — 불러온 JSON을 엔진이 쓰는 형태로 맞추고, 문제가 있으면 이유를 돌려준다 ----
    function normalizePack(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: '언어 팩 형식이 아닙니다.' };
        if (raw.format && raw.format !== PACK_FORMAT) return { error: `지원하지 않는 형식입니다 (${String(raw.format)}).` };
        const code = String(raw.code || '').trim().toLowerCase();
        if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(code)) return { error: '언어 코드(code)가 올바르지 않습니다. 예: "ja", "zh-tw", "en-gb"' };
        if (code === SOURCE_LANG.code || code === 'ko') return { error: '한국어는 기본 언어라 팩으로 불러올 수 없습니다.' };
        if (BUILTIN[code]) return { error: `"${code}"는 기본 제공 언어의 코드입니다. 다른 코드(예: "${code}-custom")를 쓰세요.` };
        const name = String(raw.name || '').trim();
        if (!name || name.length > 40) return { error: '언어 이름(name)을 1~40자로 적어 주세요.' };
        let dict = raw.dict;
        if (dict && !Array.isArray(dict) && typeof dict === 'object') dict = Object.entries(dict);
        if (!Array.isArray(dict)) return { error: '번역 사전(dict)이 없습니다.' };
        dict = dict.filter(e => Array.isArray(e) && typeof e[0] === 'string' && e[0] && typeof e[1] === 'string');
        const patterns = [];
        for (const p of (Array.isArray(raw.patterns) ? raw.patterns : [])) {
            if (!p || typeof p.re !== 'string' || typeof p.to !== 'string') continue;
            try { new RegExp(p.re, p.flags || 'g'); } catch (e) { return { error: `패턴 정규식 오류: ${p.re}` }; }
            patterns.push({ re: p.re, to: p.to, flags: p.flags || 'g' });
        }
        const months = Array.isArray(raw.months) && raw.months.length === 12 ? raw.months.map(String) : null;
        const ordinal = raw.ordinal === 'en' ? 'en' : 'none';
        return { pack: { format: PACK_FORMAT, code, name, author: String(raw.author || ''), version: String(raw.version || ''), months, ordinal, patterns, dict } };
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
        if (safeGet(LANG_KEY) === code) safeSet(LANG_KEY, SOURCE_LANG.code);
        return true;
    }

    // 기본 제공 팩 스크립트(lang/<code>.js)를 불러와 그 팩 데이터를 돌려준다
    const scriptLoads = {};
    function loadBuiltin(code) {
        const b = BUILTIN[code];
        if (!b) return Promise.reject(new Error('unknown builtin language: ' + code));
        if (window.DnoLangPacks && window.DnoLangPacks[code]) return Promise.resolve(window.DnoLangPacks[code]);
        if (!scriptLoads[code]) {
            scriptLoads[code] = new Promise((resolve, reject) => {
                const el = document.createElement('script');
                el.src = b.script;
                el.onload = () => (window.DnoLangPacks && window.DnoLangPacks[code] ? resolve(window.DnoLangPacks[code]) : reject(new Error('pack missing')));
                el.onerror = () => { delete scriptLoads[code]; reject(new Error('language pack load failed: ' + b.script)); };
                document.head.appendChild(el);
            });
        }
        return scriptLoads[code];
    }

    function getPack(code) {
        const installed = loadInstalled()[code];
        if (installed) return Promise.resolve(installed);
        return loadBuiltin(code);
    }

    // 번역가용 템플릿: 영어 팩을 그대로 복사해 이름·코드만 비워 둔다 — 두 번째 칸(번역)만 바꾸면 된다
    async function buildTemplate() {
        const en = await loadBuiltin('en');
        return JSON.stringify({
            format: PACK_FORMAT,
            code: '',
            name: '',
            author: '',
            version: '1',
            _help: 'dict의 각 항목은 ["한국어 원문", "번역"]입니다. 두 번째 칸만 바꾸세요. code(예: "ja")와 name(예: "日本語")을 채운 뒤 설정 > 언어 팩 불러오기로 적용합니다. 자세한 형식은 README "번역(언어 팩) 만들기" 참고.',
            months: en.months,
            ordinal: en.ordinal,
            patterns: en.patterns,
            dict: en.dict,
        }, null, 1);
    }

    window.getLang = getLang;
    window.setLang = setLang;
    // translateSubtree(el): 페이지 로드 뒤에 새로 그려진 부분(시작 화면 세이브 목록, 로드맵 버전 탭 등)을 번역.
    // 한국어일 땐 아무 일도 하지 않고, 팩이 준비되기 전에 불리면 준비된 뒤에 번역한다.
    // t(s): 문자열 하나를 번역 (한국어이거나 팩이 아직 준비 전이면 그대로)
    window.DnoLang = { list: listLanguages, install: installPack, remove: removePack, template: buildTemplate, validate: normalizePack, format: PACK_FORMAT, translateSubtree: () => {}, t: s => s };

    const current = getLang();
    if (current === SOURCE_LANG.code) return; // 기본값(한국어)일 때는 아무 것도 하지 않는다

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
        return function translateString(orig) {
            if (!orig) return orig;
            let s = orig.replace(/\uFE0E/g, '');
            const base = s;
            for (const [re, rep] of patterns) s = s.replace(re, rep);
            if (dictRegex) s = s.replace(dictRegex, m => dictMap.get(m) ?? m);
            // 번역할 게 없었다면 선택자를 떼지 않은 원래 글자를 그대로 돌려준다 (이모지 표시 방식과 서로 되돌리며 반복하지 않게)
            return s === base ? orig : (window.DnoEmoji ? window.DnoEmoji.fix(s) : s);
        };
    }

    function translateTree(root, translateString) {
        function translateAttrs(el) {
            ['placeholder', 'title', 'alt'].forEach(attr => {
                if (el.hasAttribute && el.hasAttribute(attr)) {
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
            translateAttrs(node);
            if (tag === 'TEXTAREA') return; // 텍스트에어리어 내용은 사용자가 입력한 법안 본문 — 번역하지 않음
            for (const child of Array.from(node.childNodes)) translateNodeDeep(child);
        }
        translateNodeDeep(root);
    }
    translateTree.attrsOnly = function (el, translateString) {
        ['placeholder', 'title', 'alt'].forEach(attr => {
            if (el.hasAttribute && el.hasAttribute(attr)) {
                const v = el.getAttribute(attr);
                const t = translateString(v);
                if (t !== v) el.setAttribute(attr, t);
            }
        });
    };

    // 초기 화면 로드 시점에 전체를 번역하고, 그 뒤에 새로 그려지거나 바뀐 부분은 MutationObserver로 계속 번역한다.
    // dno.js/roadmap.js의 자체 초기 렌더링(window.onload)이 끝난 뒤에 실행되도록 load 이벤트를 기다린다.
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
    window.DnoLang.translateSubtree = el => { if (el) waiting.add(el); };
    Promise.all([packReady, pageLoaded]).then(([pack]) => {
        translate = buildTranslator(pack);
        translateTree(document.documentElement, translate);
        window.DnoLang.translateSubtree = el => { if (el) translateTree(el, translate); };
        window.DnoLang.t = s => translate(s);
        waiting.forEach(el => { if (el.isConnected) translateTree(el, translate); });
        waiting.clear();
        // 앱이 나중에 다시 그리는 부분(목록 갱신, 도움말, 튜토리얼 말풍선, 알림창 등)도 계속 번역한다.
        // 번역 결과가 같으면 건드리지 않으므로, 이 번역이 다시 변경을 일으켜도 한 번 더 확인하고 멈춘다.
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.isConnected) translateTree(n, translate); });
                else if (m.type === 'characterData') { if (m.target.parentNode && m.target.parentNode.tagName !== 'TEXTAREA') translateTree(m.target, translate); }
                else if (m.type === 'attributes') translateTree.attrsOnly(m.target, translate);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'alt'] });
    }).catch(() => { /* 팩을 읽지 못하면 한국어 그대로 표시 */ });
})();
