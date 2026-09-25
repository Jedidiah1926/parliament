// ===== old2.html 전용 — 저장 공간 분리 =====
// old2.html은 UI 개편 전(1.5.5, 가로 탭 시절) 화면을 체험하는 스냅숏이다. 옛 코드가 지금 버전의 세이브를
// 덮어쓰면 그 사이 추가된 값(도움말 탭 위치, 건설적 불신임 설정 등)이 사라질 수 있으므로, 이 페이지의
// localStorage는 "dnoOld2:" 접두사를 붙인 별도 공간을 쓴다. 처음 열 때 지금 세이브를 한 번 복사해 와서
// 내 나라로 바로 체험할 수 있고, 여기서 바꾼 내용은 지금 버전(dno.html)에 영향을 주지 않는다.
// 테마 · 화면 모드 · 테마 색 · 언어 설정만은 지금 버전과 같이 쓴다. 반드시 다른 스크립트보다 먼저 불러와야 한다.
(function () {
    'use strict';
    const PREFIX = 'dnoOld2:';
    const INIT_KEY = PREFIX + '__copied';
    const SHARED = new Set(['dnoThemeMode', 'dnoUiMode', 'dnoThemeColor', 'dnoLang']);
    let real;
    try { real = window.localStorage; real.length; } catch (e) { return; } // 저장소를 못 쓰는 환경이면 그대로 둔다

    const mapKey = key => (SHARED.has(key) ? key : PREFIX + key);

    // 지금 버전에만 있는 값이 옛 코드를 깨뜨리지 않게 읽을 때 걸러낸다
    //  - 마지막으로 보던 탭이 "도움말"이면 옛 화면엔 그 탭이 없으므로 국가 탭으로
    //  - 옛 언어 전환은 한국어/영어만 안다
    function sanitize(key, value) {
        if (value == null) return value;
        if (key === 'dnoLang') return (value === 'ko' || value === 'en') ? value : 'ko';
        if (value.indexOf('"currentMainTab":"help"') !== -1) value = value.split('"currentMainTab":"help"').join('"currentMainTab":"nation"');
        return value;
    }

    // 처음 열 때: 지금 버전의 세이브 · 설정을 한 번 복사 (이후엔 서로 독립)
    if (real.getItem(INIT_KEY) === null) {
        const keys = [];
        for (let i = 0; i < real.length; i++) {
            const k = real.key(i);
            if (k && k.indexOf('dno') === 0 && !SHARED.has(k)) keys.push(k);
        }
        keys.forEach(k => { try { real.setItem(PREFIX + k, real.getItem(k)); } catch (e) { /* 용량 부족 등 — 건너뜀 */ } });
        real.setItem(INIT_KEY, new Date().toISOString());
    }

    function ownKeys() {
        const out = [];
        for (let i = 0; i < real.length; i++) {
            const k = real.key(i);
            if (k && k.indexOf(PREFIX) === 0 && k !== INIT_KEY) out.push(k.slice(PREFIX.length));
        }
        SHARED.forEach(k => { if (real.getItem(k) !== null) out.push(k); });
        return out;
    }

    const store = {
        getItem: key => sanitize(String(key), real.getItem(mapKey(String(key)))),
        setItem: (key, value) => real.setItem(mapKey(String(key)), String(value)),
        removeItem: key => real.removeItem(mapKey(String(key))),
        clear: () => ownKeys().forEach(k => { if (!SHARED.has(k)) real.removeItem(PREFIX + k); }),
        key: i => ownKeys()[i] ?? null,
        get length() { return ownKeys().length; },
    };
    try {
        Object.defineProperty(window, 'localStorage', { configurable: true, get: () => store });
    } catch (e) {
        console.warn('old2: 저장 공간 분리 실패 — 지금 버전과 세이브를 함께 씁니다', e);
    }
})();
