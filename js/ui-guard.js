// ===== 게임 화면 드래그 막기 — 웹 페이지처럼 글자가 파랗게 선택되거나 그림 · 링크 · 버튼이 끌려 나오지 않게 =====
// - 글자 드래그 선택: 입력 칸(input · textarea · select · 편집 가능한 곳)과 코드(code · pre)만 선택된다. 나머지 화면은 끌어도 선택되지 않는다
// - 브라우저 기본 끌기(그림 · 링크의 유령 그림): 막는다. 앱의 끌기 기능(정당 순서 바꾸기 · 지도 칠하기 · 트리 이동 등)은 포인터 이벤트라 그대로
//   직접 draggable="true"를 단 요소만 예외. 바깥(탐색기)에서 파일을 끌어다 놓는 것은 막지 않는다
// - 선택이 필요한 곳은 class="hemi-selectable"을 달면 된다
(function () {
    'use strict';
    const css = document.createElement('style');
    css.id = 'hemiUiGuard';
    css.textContent = `
        html { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
        input, textarea, select, [contenteditable]:not([contenteditable="false"]), [contenteditable]:not([contenteditable="false"]) *,
        code, pre, .hemi-selectable, .hemi-selectable * { -webkit-user-select: text; user-select: text; -webkit-touch-callout: default; }
        button code, [role="button"] code { -webkit-user-select: none; user-select: none; }
        img, svg, a, button { -webkit-user-drag: none; }
        [draggable="true"] { -webkit-user-drag: element; }
    `;
    (document.head || document.documentElement).appendChild(css);
    const own = el => !!(el && el.closest && el.closest('[draggable="true"]'));
    document.addEventListener('dragstart', e => {
        let t = e.target;
        if (t && t.nodeType === 3) t = t.parentElement;
        if (!own(t)) e.preventDefault();
    }, true);
})();
