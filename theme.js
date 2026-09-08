// ===== DATANET PARLIAMENT SIMULATION — 테마 색 모듈 =====
// 사용자가 settings.html에서 고른 테마 색(네온 강조색)을 localStorage에 저장하고,
// --tno-neon / --tno-neon-dim 커스텀 프로퍼티로 반영한다. lang.js/uimode.js와 마찬가지로
// body가 파싱되기 전에 동기 실행되어야 색이 깜빡이지 않으므로, DOMContentLoaded를
// 기다리지 않고 head에서 바로 적용한다.
(function () {
    'use strict';

    const THEME_KEY = 'dnoThemeColor';
    const DEFAULT_COLOR = '#00ffff';

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

    function isValidHex(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v); }

    function hexToRgb(hex) {
        const m = hex.replace('#', '').match(/.{1,2}/g);
        return m ? m.map(h => parseInt(h, 16)).join(',') : '0,255,255';
    }

    function getThemeColor() {
        const v = safeGet(THEME_KEY);
        return isValidHex(v) ? v : DEFAULT_COLOR;
    }

    function applyThemeColor(hex) {
        const root = document.documentElement.style;
        root.setProperty('--tno-neon', hex);
        root.setProperty('--tno-neon-dim', `rgba(${hexToRgb(hex)}, .3)`);
    }

    function setThemeColor(hex) {
        if (!isValidHex(hex)) return;
        safeSet(THEME_KEY, hex);
        applyThemeColor(hex);
    }

    function resetThemeColor() {
        try { localStorage.removeItem(THEME_KEY); } catch (e) {}
        applyThemeColor(DEFAULT_COLOR);
    }

    window.getThemeColor = getThemeColor;
    window.setThemeColor = setThemeColor;
    window.resetThemeColor = resetThemeColor;
    window.getDefaultThemeColor = function () { return DEFAULT_COLOR; };
    window.isValidHexColor = isValidHex;

    applyThemeColor(getThemeColor());

    // 다른 탭에서 설정을 바꾼 경우(storage 이벤트)와, 뒤로가기로 bfcache에서 페이지가 복원된
    // 경우(pageshow, persisted) 모두 현재 페이지가 스크립트를 다시 실행하지 않으므로 색이 갱신되지
    // 않는다 — 두 경우 모두 감지해서 최신 색을 다시 적용한다.
    window.addEventListener('storage', function (e) {
        if (e.key === THEME_KEY || e.key === null) applyThemeColor(getThemeColor());
    });
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) applyThemeColor(getThemeColor());
    });
})();
