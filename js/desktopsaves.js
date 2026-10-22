// ===== 데스크톱 앱: 세이브를 저장 폴더의 .hemi 파일로 (electron/saves.js) =====
// 게임 코드(js/main.js · 시작 화면 · js/official.js)는 그대로 브라우저 저장소(localStorage)의 세이브 목록을 읽고 쓴다.
// 앱에서는 이 파일이 그 목록을 폴더와 맞춘다:
//   - 페이지를 열 때: 폴더의 세이브를 읽어 저장소의 목록을 덮는다 (폴더가 원본, 저장소는 작업용 사본)
//     처음 쓰는 폴더면 반대로 저장소에 있던 세이브를 폴더로 옮겨 담는다
//   - 세이브 목록을 저장할 때마다(setItem) 같은 내용을 폴더에도 쓴다 — 바뀐 세이브만 파일로, 지운 세이브는 휴지통으로
// 웹 버전(window.hemicycleDesktop 없음)에서는 아무것도 하지 않는다. 다른 게임 스크립트보다 먼저 읽어야 한다.
(function () {
    'use strict';
    const api = window.hemicycleDesktop && window.hemicycleDesktop.saves;
    if (!api) return;
    const SLOTS = 'dnoParliamentSaveSlots';
    const KEY_RE = /^(hemicycleTeaserV2-\d{2}:|hemicycleLogo:)?dnoParliamentSaveSlots$/;
    let ls;
    try { ls = window.localStorage; } catch (e) { return; }
    const origSet = Storage.prototype.setItem, origRemove = Storage.prototype.removeItem;
    let lastError = null;

    // 이 화면이 쓰는 저장 공간 (js/main.js LS_PREFIX와 같은 규칙) — 시작 화면은 본 게임 + (개발자 모드면) 미리보기 세이브도 보여 준다
    const root = document.documentElement;
    const mode = root.getAttribute('data-app-mode');
    const spaces = [];
    if (mode === 'teaser') spaces.push(`hemicycleTeaserV2-${root.getAttribute('data-teaser') || '67'}:`);
    else if (mode === 'logo') spaces.push('hemicycleLogo:');
    else {
        spaces.push('');
        spaces.push('hemicycleTeaserV2-61:'); // 없앤 1.6.1 미리보기의 세이브 — 시작 화면이 본 게임 세이브로 옮긴다 (index.html)
        if (window.HemiDev && window.HemiDev.isOn()) window.HemiDev.teasers.forEach(t => spaces.push(`hemicycleTeaserV2-${t.id}:`));
    }

    function push(ns, text) {
        let r;
        try { r = api.write(ns, text); } catch (e) { r = { ok: false, error: String(e && e.message || e) }; }
        if (!r || !r.ok) { lastError = (r && r.error) || '알 수 없는 오류'; console.warn('[세이브 폴더] 저장 실패:', lastError); }
        else lastError = null;
        return r;
    }

    // 열 때: 폴더 → 저장소
    spaces.forEach(ns => {
        const key = ns + SLOTS;
        let r;
        try { r = api.read(ns); } catch (e) { r = null; }
        if (!r || r.error || !Array.isArray(r.slots)) { if (r && r.error) lastError = r.error; return; }
        if (!r.initialized) {
            // 처음 쓰는 폴더 — 지금까지 앱 저장소에 있던 세이브를 폴더로
            let local = null;
            try { local = ls.getItem(key); } catch (e) { /* 없음 */ }
            push(ns, local || '[]');
            return;
        }
        try { origSet.call(ls, key, JSON.stringify(r.slots)); }
        catch (e) { lastError = '세이브가 너무 커서 불러오지 못했습니다'; console.warn('[세이브 폴더] 저장소에 담지 못함:', e); }
    });

    // 저장할 때: 저장소 → 폴더
    Storage.prototype.setItem = function (k, v) {
        origSet.call(this, k, v);
        if (this === ls && KEY_RE.test(String(k))) push(String(k).slice(0, -SLOTS.length), String(v));
    };
    Storage.prototype.removeItem = function (k) {
        origRemove.call(this, k);
        if (this === ls && KEY_RE.test(String(k))) push(String(k).slice(0, -SLOTS.length), '[]');
    };

    window.HemiSaveFolder = { dir: () => { try { return api.dir(); } catch (e) { return ''; } }, lastError: () => lastError };
})();
