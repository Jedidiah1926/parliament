// ===== DATANET PARLIAMENT SIMULATION — 테마 모드(라이트/다크/네온) 모듈 =====
// 라이트/다크는 CRT 이펙트·픽셀 폰트 없이 깔끔한 모던 UI로, 네온(내부값 'tno')은 기존의 레트로 CRT
// 터미널 감성을 그대로 유지한다. localStorage에 저장하고 <html>에 두 속성으로 반영한다:
//   data-theme-mode   = 'light' | 'dark' | 'tno'   — 모드별 색 토큰(css/modern.css)
//   data-theme-family = 'modern' | 'tno'           — 라이트/다크 공통 모던 UI 규칙(css/modern.css)
// uimode.js/theme.js와 마찬가지로 body가 파싱되기 전에 동기 실행되어야 화면이
// 깜빡이지 않으므로, DOMContentLoaded를 기다리지 않고 head에서 바로 적용한다.
// theme.js(테마 색 = 네온 모드 전용 커스텀 강조색)보다 먼저 로드되어야 한다 —
// theme.js가 getThemeMode()로 현재 모드를 확인해 네온 모드가 아닐 때는 커스텀 색을 적용하지 않는다.
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

    function applyAttributes(mode) {
        const root = document.documentElement;
        root.setAttribute('data-theme-mode', mode);
        root.setAttribute('data-theme-family', mode === 'tno' ? 'tno' : 'modern');
    }

    function setThemeMode(mode) {
        if (!VALID_MODES.includes(mode)) return;
        safeSet(THEME_MODE_KEY, mode);
        applyAttributes(mode);
        // 라이트/다크로 바뀌면 네온 전용 커스텀 강조색은 더 이상 적용하지 않음(테마별 고정 강조색 사용)
        if (window.applyThemeColorForMode) window.applyThemeColorForMode();
        window.dispatchEvent(new CustomEvent('thememodechange', { detail: { mode } }));
    }

    window.getThemeMode = getThemeMode;
    window.setThemeMode = setThemeMode;

    applyAttributes(getThemeMode());

    window.addEventListener('storage', function (e) {
        if (e.key === THEME_MODE_KEY || e.key === null) {
            applyAttributes(getThemeMode());
            if (window.applyThemeColorForMode) window.applyThemeColorForMode();
            window.dispatchEvent(new CustomEvent('thememodechange', { detail: { mode: getThemeMode() } }));
        }
    });
    window.addEventListener('pageshow', function (e) {
        if (e.persisted) applyAttributes(getThemeMode());
    });

    // ===== 이모지 표시 방식 =====
    // 모든 테마(네온 · 라이트 · 다크)에서 이모지를 글자형(흑백, 글자색을 따름 — 예: 👑︎)으로 보여준다.
    // 이모지 뒤에 텍스트 표시 선택자(U+FE0E)를 붙이는 방식이라, 화면에 그려진 글자(텍스트 노드)를 직접 바꾸고
    // 나중에 새로 그려지는 부분도 MutationObserver로 따라간다. (CSS font-variant-emoji는 데스크톱 앱의 Chromium이 지원하지 않음)
    // 사용자가 입력하는 칸(textarea/input 값)은 건드리지 않는다.
    const EMOJI_TEXT = /(\p{Extended_Pictographic})[\uFE0E\uFE0F]?/gu;
    function emojiFix(str) {
        if (!str) return str;
        return str.replace(EMOJI_TEXT, '$1\uFE0E');
    }
    function emojiFixTree(root) {
        if (!root) return;
        if (root.nodeType === 3) {
            const p = root.parentNode;
            if (p && (p.nodeName === 'TEXTAREA' || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE')) return;
            const t = emojiFix(root.nodeValue);
            if (t !== root.nodeValue) root.nodeValue = t;
            return;
        }
        if (root.nodeType !== 1 && root.nodeType !== 9) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: n => {
                const p = n.parentNode;
                if (!p || p.nodeName === 'TEXTAREA' || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return NodeFilter.FILTER_REJECT;
                return /[\u00a9\u00ae\u203c-\u32ff\u{1F000}-\u{1FAFF}\uFE0E]/u.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
            },
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(n => { const t = emojiFix(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; });
    }
    window.DnoEmoji = { fix: emojiFix, fixTree: emojiFixTree };
    function startEmojiMode() {
        emojiFixTree(document.body);
        // 결과가 같으면 건드리지 않으므로 이 변경이 다시 관찰돼도 한 번 더 확인하고 멈춘다
        new MutationObserver(muts => {
            for (const m of muts) {
                if (m.type === 'childList') m.addedNodes.forEach(n => { if (n.isConnected) emojiFixTree(n); });
                else if (m.type === 'characterData') emojiFixTree(m.target);
            }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.body) startEmojiMode();
    else document.addEventListener('DOMContentLoaded', startEmojiMode);
})();
