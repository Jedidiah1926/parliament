// ===== 브라우저 저장소 키 이름 옮기기 (dno… → hemi…) =====
// 예전 이름(DATANET Parliament)의 "dno"로 시작하던 저장소 키를 "hemi"로 바꿨다 (예: dnoParliamentSaveSlots → hemiParliamentSaveSlots).
// 처음 한 번, 예전 키의 값을 그대로(압축된 세이브도 글자 그대로) 새 키로 옮긴다 — 다른 어떤 스크립트보다 먼저 읽어야 한다
// (특히 js/slotstore.js · js/desktopsaves.js보다 먼저 — 이 둘은 새 키만 본다).
//   - 티저 · 로고처럼 앞에 저장 공간 이름이 붙은 키("hemicycleTeaserV2-61:dno…")도 같은 규칙으로
//   - 새 키에 쓰고 다시 읽어 똑같을 때만 예전 키를 지운다 (예전 키를 백업으로 남기면 세이브가 두 벌이 되어 저장소 한도를 금방 넘는다)
//   - 공간이 모자라 새 키를 못 쓰면 예전 키를 먼저 지우고 다시 쓰고, 그래도 안 되면 예전 키를 되돌려 둔다
//   - 하나라도 못 옮기면 끝 표시를 남기지 않아 다음에 다시 시도한다
(function () {
    'use strict';
    const DONE = 'hemiStorageMigrated';
    let ls;
    try { ls = window.localStorage; if (!ls || ls.getItem(DONE) === '1') return; } catch (e) { return; }
    const OLD = /^([A-Za-z0-9-]+:)?dno([A-Z].*)$/;
    const keys = [];
    try { for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && OLD.test(k)) keys.push(k); } } catch (e) { return; }
    let failed = 0;
    keys.forEach(oldKey => {
        const newKey = oldKey.replace(OLD, (m, ns, rest) => (ns || '') + 'hemi' + rest);
        try {
            const v = ls.getItem(oldKey);
            if (v === null) return;
            if (ls.getItem(newKey) === null) {
                try { ls.setItem(newKey, v); }
                catch (e) {
                    ls.removeItem(oldKey);
                    try { ls.setItem(newKey, v); } catch (e2) { try { ls.setItem(oldKey, v); } catch (e3) { /* 되돌릴 수도 없음 */ } failed++; return; }
                }
            }
            if (ls.getItem(newKey) === v) ls.removeItem(oldKey); else failed++; // 새 키가 이미 다른 값이면 예전 키는 그대로 둔다
        } catch (e) { failed++; }
    });
    if (!failed) { try { ls.setItem(DONE, '1'); } catch (e) { /* 다음에 다시 */ } }
})();
