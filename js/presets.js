// ===== DATANET PARLIAMENT SIMULATION — 프리셋 목록/불러오기 (main.html·dno.html 공용) =====
// 프리셋은 두 가지 경로로 모인다:
//   1) 내장 프리셋(BUILTIN) — presets/*.js에 JS로 감싸 두고 <script>로 불러온다.
//      데스크톱 앱(Electron)은 file://로 열려 fetch로 JSON을 읽을 수 없기 때문.
//   2) 배포자가 추가한 프리셋 — presets/index.json에 {file, title, description?, tutorial?}로
//      등록한 presets/<file>(.json). fetch를 쓰므로 웹(http)으로 열었을 때만 보인다 (README 참고).
// 각 프리셋은 { id, title, description, tutorial, ... } 형태로 통일되고, id로 다시 찾아 상태를 불러온다.
(function () {
    'use strict';

    const BUILTIN = [
        {
            id: 'builtin:tutorial',
            title: '튜토리얼 공화국',
            description: '처음이라면 여기서 시작하세요 — 가상의 나라에서 화면 구성과 기본 조작을 단계별로 안내합니다.',
            tutorial: true,
            script: 'presets/tutorial.js',
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
                .map(p => ({ id: 'file:' + p.file, title: String(p.title), description: p.description ? String(p.description) : '', tutorial: !!p.tutorial, file: p.file }));
        } catch (e) {
            return []; // file://(데스크톱 앱) 등 fetch를 쓸 수 없는 환경 — 내장 프리셋만 사용
        }
    }

    async function list() {
        if (!listCache) listCache = BUILTIN.map(p => ({ ...p })).concat(await fetchIndexPresets());
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

    // 프리셋 상태(getAppState()와 같은 형태)를 불러와 복사본으로 돌려준다 — 원본을 건드리지 않게
    async function loadState(preset) {
        if (!preset) throw new Error('preset not found');
        let state;
        if (preset.script) {
            await loadScriptOnce(preset.script);
            state = window.DNO_PRESET_DATA && window.DNO_PRESET_DATA[preset.id];
        } else {
            const res = await fetch('presets/' + preset.file);
            if (!res.ok) throw new Error('preset fetch failed');
            state = await res.json();
        }
        if (!state) throw new Error('preset data missing');
        return JSON.parse(JSON.stringify(state));
    }

    window.DnoPresets = { list, find, loadState };
})();
