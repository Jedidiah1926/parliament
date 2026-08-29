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

    // ===== 모바일 모드 전용 — 좌측(컨트롤)/우측(디스플레이) 패널 전환 =====
    // 세션 동안만 유지되는 UI 상태이며(새로고침 시 컨트롤 패널로 초기화), 페이지 로드 시점에
    // 유효한 값이 있어야 CSS 규칙이 즉시 적용되므로 기본값을 미리 지정해 둔다.
    function setMobilePanel(panel) {
        if (panel !== 'controls' && panel !== 'display') return;
        document.documentElement.setAttribute('data-mobile-panel', panel);
        const btnControls = document.getElementById('mobilePanelBtnControls');
        const btnDisplay = document.getElementById('mobilePanelBtnDisplay');
        if (btnControls) btnControls.classList.toggle('active', panel === 'controls');
        if (btnDisplay) btnDisplay.classList.toggle('active', panel === 'display');
    }
    window.setMobilePanel = setMobilePanel;
    document.documentElement.setAttribute('data-mobile-panel', 'controls');
})();
