// ===== Hemicycle — 프리셋 목록/불러오기 (index.html·main.html 공용) =====
// 프리셋은 두 가지 경로로 모인다:
//   1) 내장 프리셋(BUILTIN) — presets/*.js에 JS로 감싸 두고 <script>로 불러온다.
//      데스크톱 앱(Electron)은 file://로 열려 fetch로 JSON을 읽을 수 없기 때문.
//   2) 배포자가 추가한 프리셋 — presets/index.json에 {file, title, description?, date?, tutorial?}로
//      등록한 presets/<file>(.json). fetch를 쓰므로 웹(http)으로 열었을 때만 보인다 (README 참고).
//   3) 모드 · 창작마당 프리셋(데스크톱 앱) — 모드 폴더나 구독한 창작마당 아이템에 든 세이브 파일.
//      목록은 앱이 넘겨주고(window.hemicycleDesktop.modPresets), 상태는 고를 때 앱에서 읽어 온다 (electron/mods.js 참고)
// 각 프리셋은 { id, title, description, date(게임 속 시작 날짜), tutorial, comingSoon, langs, ... } 형태로 통일되고, id로 다시 찾아 상태를 불러온다.
// 언어별 파일 (1.6.0): langs = { en: { script | file | key, title, description } } — 지금 언어의 파일이 있으면 그 파일을,
// 없으면 기본(한국어) 파일을 그대로 쓴다. 화면 번역(js/lang.js)으로 데이터를 바꿔 끼우는 예전 방식(경로 덮어쓰기)은 없앴다.
// 내장 프리셋의 언어 파일은 DNO_PRESET_DATA['<id>@<언어>']에 담는다 (예: presets/tutorial.en.js).
// 모드 · 창작마당에서 내장 프리셋에 언어 파일을 더할 수도 있다 (electron/mods.js의 presetLangs).
// comingSoon이면 목록에 "준비 중"으로 보이기만 하고 고를 수는 없다.
(function () {
    'use strict';

    const BUILTIN = [
        {
            id: 'builtin:tutorial',
            title: '튜토리얼 공화국',
            description: '처음이라면 여기서 시작하세요. 가상의 나라에서 기본 튜토리얼 6개로 화면과 조작을 직접 해보며 익히고, 선거 · 지도 · 단일화 · 부정선거 같은 기능은 세부 튜토리얼에서 골라 배울 수 있어요.',
            date: '2026년 3월 2일',
            tutorial: true,
            script: 'presets/tutorial.js',
            langs: { en: { script: 'presets/tutorial.en.js', title: 'Tutorial Republic', description: "Start here if you're new. In a made-up country, six basic lessons walk you through the screens and controls hands-on, and detailed lessons cover features like elections, maps, candidate unification and election fraud whenever you need them." } },
        },
        {
            id: 'builtin:japan',
            title: '일본국',
            description: '제작자: sushdjr0106',
            date: '2026년 2월 9일',
            author: 'sushdjr0106',
            script: 'presets/japan.js',
            langs: { en: { script: 'presets/japan.en.js', title: 'Japan', description: 'By sushdjr0106' } },
        },
        {
            id: 'builtin:usa',
            title: '미합중국',
            description: '제작자: ttorri',
            date: '2026년 11월 13일',
            author: 'ttorri',
            script: 'presets/usa.js',
            langs: { en: { script: 'presets/usa.en.js', title: 'United States of America', description: 'By ttorri' } },
        },
    ];
    const INDEX_URL = 'presets/index.json';
    let listCache = null;

    async function fetchIndexPresets() {
        try {
            const res = await fetch(INDEX_URL);
            if (!res.ok) return [];
            const list = await res.json();
            return (Array.isArray(list) ? list : [])
                .filter(p => p && p.file && p.title)
                .map(p => ({ id: 'file:' + p.file, title: String(p.title), description: p.description ? String(p.description) : '', date: p.date ? String(p.date) : '', tutorial: !!p.tutorial, file: p.file,
                    langs: p.langs && typeof p.langs === 'object' ? p.langs : {} }));
        } catch (e) {
            return []; // file://(데스크톱 앱) 등 fetch를 쓸 수 없는 환경 — 내장 프리셋만 사용
        }
    }

    function modPresets() {
        const d = window.hemicycleDesktop;
        const raw = d && Array.isArray(d.modPresets) ? d.modPresets : [];
        return raw.filter(p => p && p.key).map(p => ({
            id: 'mod:' + p.key,
            title: String(p.title || p.folder || ''),
            description: String(p.description || ''),
            date: String(p.date || ''),
            author: String(p.author || ''),
            source: p.source === 'workshop' ? 'workshop' : 'local',
            modKey: p.key,
            langs: p.langs && typeof p.langs === 'object' ? p.langs : {},
        }));
    }

    function currentLang() {
        return typeof window.getLang === 'function' ? window.getLang() : 'kr';
    }
    // 지금 언어의 파일 정보 (없으면 null)
    function langVariant(preset) {
        const v = preset && preset.langs && preset.langs[currentLang()];
        return v && (v.script || v.file || v.key) ? v : null;
    }

    async function list() {
        if (!listCache) {
            const all = BUILTIN.map(p => ({ ...p, langs: { ...(p.langs || {}) } })).concat(await fetchIndexPresets(), modPresets());
            // 모드 · 창작마당에서 더한 언어 파일 (예: 프랑스어 언어 팩과 함께 올린 튜토리얼 공화국 프랑스어 파일)
            const d = window.hemicycleDesktop;
            (d && Array.isArray(d.modPresetLangs) ? d.modPresetLangs : []).forEach(x => {
                const target = all.find(p => p.id === x.target);
                if (!target || !x.lang || !x.key) return;
                target.langs = { ...(target.langs || {}) };
                if (!target.langs[x.lang]) target.langs[x.lang] = { key: x.key, title: x.title || '', description: x.description || '' };
            });
            // 지금 언어의 제목 · 설명이 있으면 목록에도 그 글자로
            const lang = currentLang();
            all.forEach(p => {
                const v = p.langs && p.langs[lang];
                if (v && v.title) p.title = String(v.title);
                if (v && v.description) p.description = String(v.description);
            });
            listCache = all;
        }
        return listCache;
    }

    async function find(id) {
        return (await list()).find(p => p.id === id) || null;
    }

    const scriptLoads = {};
    function loadScriptOnce(src) {
        if (!scriptLoads[src]) {
            scriptLoads[src] = new Promise((resolve, reject) => {
                const el = document.createElement('script');
                el.src = src;
                el.onload = () => resolve();
                el.onerror = () => { delete scriptLoads[src]; reject(new Error('preset script load failed: ' + src)); };
                document.head.appendChild(el);
            });
        }
        return scriptLoads[src];
    }

    // 파일 하나 읽기 — src: { script, id } | { key } | { file }
    async function readSource(src, dataId) {
        if (src.script) {
            await loadScriptOnce(src.script);
            return window.DNO_PRESET_DATA && window.DNO_PRESET_DATA[dataId];
        }
        if (src.key || src.modKey) {
            if (!window.hemicycleDesktop || !window.hemicycleDesktop.loadModPreset) throw new Error('mod presets need the desktop app');
            return window.hemicycleDesktop.loadModPreset(src.key || src.modKey);
        }
        const res = await fetch('presets/' + src.file);
        if (!res.ok) throw new Error('preset fetch failed');
        return res.json();
    }

    // 프리셋 상태(getAppState()와 같은 형태)를 불러와 복사본으로 돌려준다 — 원본을 건드리지 않게.
    // 지금 언어의 파일이 있으면 그 파일, 없거나 읽지 못하면 기본(한국어) 파일
    async function loadState(preset) {
        if (!preset) throw new Error('preset not found');
        let state = null, lang = null;
        const v = langVariant(preset);
        if (v) {
            try { state = await readSource(v, preset.id + '@' + currentLang()); lang = currentLang(); }
            catch (e) { state = null; } // 언어 파일이 깨졌으면 기본 파일로
        }
        if (!state) state = await readSource(preset, preset.id);
        if (!state) throw new Error('preset data missing');
        const copy = JSON.parse(JSON.stringify(state));
        // 데이터 언어 표시 — 언어 파일이면 그 언어, 기본 파일이면 파일에 적힌 언어(없으면 한국어). 화면 번역으로 데이터를 바꾸지 않게
        copy.meta = { ...(copy.meta || {}), dataLang: lang || (copy.meta && copy.meta.dataLang) || 'kr' };
        return copy;
    }

    window.DnoPresets = { list, find, loadState };
})();
