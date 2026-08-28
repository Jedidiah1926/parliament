// ===== DATANET PARLIAMENT SIMULATION — UI 모드(데스크톱/모바일) 모듈 =====
// 사용자가 dno.settings.html에서 고른 데스크톱(가로형)/모바일(세로형) 레이아웃을
// localStorage에 저장하고, <html>에 data-ui-mode 속성으로 반영한다.
// dno.css의 [data-ui-mode="mobile"] 규칙이 실제 레이아웃 전환을 담당한다.
// <head>에서 body가 파싱되기 전에 동기 실행되어야 레이아웃 깜빡임이 없으므로,
// DOMContentLoaded를 기다리지 않고 document.documentElement에 바로 적용한다.
(function () {
    'use strict';

    const UI_MODE_KEY = 'dnoUiMode';

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

    function getUiMode() {
        return safeGet(UI_MODE_KEY) === 'mobile' ? 'mobile' : 'desktop';
    }
    function setUiMode(mode) {
        if (mode !== 'desktop' && mode !== 'mobile') return;
        safeSet(UI_MODE_KEY, mode);
        document.documentElement.setAttribute('data-ui-mode', mode);
    }
    window.getUiMode = getUiMode;
    window.setUiMode = setUiMode;

    document.documentElement.setAttribute('data-ui-mode', getUiMode());
})();
