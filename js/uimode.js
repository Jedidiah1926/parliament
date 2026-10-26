// ===== Hemicycle — UI 모드(데스크톱/모바일) 모듈 =====
// 사용자가 settings.html에서 고른 데스크톱(가로형)/모바일(세로형) 레이아웃을
// localStorage에 저장하고, <html>에 data-ui-mode 속성으로 반영한다.
// main.css의 [data-ui-mode="mobile"] 규칙이 실제 레이아웃 전환을 담당한다.
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

    // ===== 실행(PROTOCOL EXECUTE) 버튼 표시 — 설정 › 화면 (기본: 숨김) =====
    // 대부분의 편집이 의석 화면을 알아서 다시 그리므로 버튼은 기본으로 숨기고, 켜면 편집 패널 아래 버튼과 모바일 떠 있는 버튼이 보인다.
    // 숨겨도 입력 칸 밖에서 Enter를 누르면 다시 그린다. <html data-exec-btn="on|off"> — css/main.css가 숨긴다
    const EXEC_BTN_KEY = 'dnoExecButton';
    const getExecButton = () => safeGet(EXEC_BTN_KEY) === 'on';
    function setExecButton(on) {
        safeSet(EXEC_BTN_KEY, on ? 'on' : 'off');
        document.documentElement.setAttribute('data-exec-btn', on ? 'on' : 'off');
    }
    window.getExecButton = getExecButton;
    window.setExecButton = setExecButton;
    document.documentElement.setAttribute('data-exec-btn', getExecButton() ? 'on' : 'off');

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
