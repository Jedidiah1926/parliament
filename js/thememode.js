// ===== DATANET PARLIAMENT SIMULATION — 테마 모드(라이트/다크/TNO) 모듈 =====
// 라이트/다크는 CRT 이펙트·픽셀 폰트 없이 깔끔한 UI로, TNO는 기존의 레트로 CRT
// 터미널 감성을 그대로 유지한다. localStorage에 저장하고 <html>에 data-theme-mode
// 속성으로 반영 — 실제 색/이펙트 전환은 각 CSS의 [data-theme-mode="..."] 규칙이 담당한다.
// uimode.js/theme.js와 마찬가지로 body가 파싱되기 전에 동기 실행되어야 화면이
// 깜빡이지 않으므로, DOMContentLoaded를 기다리지 않고 head에서 바로 적용한다.
// theme.js(테마 색 = TNO 전용 커스텀 네온 강조색)보다 먼저 로드되어야 한다 —
// theme.js가 getThemeMode()로 현재 모드를 확인해 TNO가 아닐 때는 커스텀 색을 적용하지 않는다.
(function () {
    'use strict';

    const THEME_MODE_KEY = 'dnoThemeMode';
    const VALID_MODES = ['tno', 'light', 'dark'];
    const DEFAULT_MODE = 'tno';

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

    function getThemeMode() {
        const v = safeGet(THEME_MODE_KEY);
        return VALID_MODES.includes(v) ? v : DEFAULT_MODE;
    }

    function setThemeMode(mode) {
        if (!VALID_MODES.includes(mode)) return;
        safeSet(THEME_MODE_KEY, mode);
        document.documentElement.setAttribute('data-theme-mode', mode);
        // 라이트/다크로 바뀌면 TNO 전용 커스텀 네온 색은 더 이상 적용하지 않음(테마별 고정 강조색 사용)
        if (window.applyThemeColorForMode) window.applyThemeColorForMode();
    }

    window.getThemeMode = getThemeMode;
    window.setThemeMode = setThemeMode;

    document.documentElement.setAttribute('data-theme-mode', getThemeMode());

    window.addEventListener('storage', function (e) {
        if (e.key === THEME_MODE_KEY || e.key === null) {
            document.documentElement.setAttribute('data-theme-mode', getThemeMode());
            if (window.applyThemeColorForMode) window.applyThemeColorForMode();
        }
    });
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) document.documentElement.setAttribute('data-theme-mode', getThemeMode());
    });
})();
