// ===== Hemicycle — 화면 요소 표시 설정 =====
// <head>에서 body가 파싱되기 전에 동기 실행되어야 깜빡임이 없으므로,
// DOMContentLoaded를 기다리지 않고 document.documentElement에 바로 적용한다.
// (예전의 데스크톱/모바일 UI 모드는 없어졌다 — 화면은 가로형 하나)
(function () {
    'use strict';

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
    try { localStorage.removeItem('dnoUiMode'); } catch (e) { /* 저장 불가 */ }

    // ===== 실행(PROTOCOL EXECUTE) 버튼 표시 — 설정 › 화면 (기본: 숨김) =====
    // 대부분의 편집이 의석 화면을 알아서 다시 그리므로 버튼은 기본으로 숨기고, 켜면 편집 패널 아래 버튼이 보인다.
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
})();
