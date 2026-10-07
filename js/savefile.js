// ===== Hemicycle 세이브 파일(.hemi) 읽기/쓰기 =====
// .hemi = 세이브 상태 JSON을 gzip으로 압축한 파일 (보통 원래 크기의 1/3 정도).
// 읽을 때는 파일 첫 두 바이트(1F 8B)로 gzip인지 알아보고, 아니면 예전처럼 그냥 JSON 글자로 읽는다
// → 예전 .json 세이브, 압축 전 .hemi 모두 그대로 불러올 수 있다.
// 압축 기능(CompressionStream)이 없는 오래된 브라우저에서는 압축 없이 JSON 그대로 저장한다.
(function () {
    'use strict';

    const canGzip = typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';

    async function encode(obj) {
        const json = JSON.stringify(obj); // 들여쓰기 없이 — 사람이 읽을 파일이 아니므로
        if (!canGzip) return new Blob([json], { type: 'application/octet-stream' });
        const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
        return new Blob([await new Response(stream).arrayBuffer()], { type: 'application/octet-stream' });
    }

    async function readText(file) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
            if (!canGzip) throw new Error('이 브라우저는 압축된 세이브 파일을 열 수 없습니다');
            const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
            return await new Response(stream).text();
        }
        return new TextDecoder('utf-8').decode(bytes);
    }

    // ── 모바일: 파일 고르기 창이 .hemi · .jsx를 못 고르는 문제 ──
    // 안드로이드 · iOS의 파일 선택 창은 accept의 확장자를 파일 종류(MIME)로 바꿔 거르는데, .hemi · .jsx는 알려진 종류가 아니라
    // 회색으로 막혀 고를 수 없다 (예전 .json은 application/json이라 골라졌음). 모바일에서는 그런 칸의 거르기를 빼고,
    // 고른 파일은 읽을 때 내용으로 확인한다 (세이브가 아니면 "형식이 올바르지 않음" 안내).
    const isMobile = () => {
        try { return matchMedia('(pointer: coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent); }
        catch (e) { return false; }
    };
    function relaxFileInputs(root) {
        if (!isMobile()) return;
        (root || document).querySelectorAll('input[type=file][accept]').forEach(inp => {
            if (/\.(hemi|jsx)\b/i.test(inp.getAttribute('accept'))) inp.removeAttribute('accept');
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => relaxFileInputs());
    else relaxFileInputs();

    // ── 큰 세이브 넘겨주기: 시작 화면 → 게임 화면 ──
    // 시작 화면에서 고른 세이브는 sessionStorage로 넘기는데, 지도 · 사진이 든 큰 세이브는 그 한도(약 5MB)를 넘어 실패한다.
    // 그럴 때는 IndexedDB에 잠깐 맡겨 두고 게임 화면이 열린 뒤 꺼내 쓴다.
    function idb() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open('hemicycleHandoff', 1);
            req.onupgradeneeded = () => req.result.createObjectStore('f');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }
    async function stash(key, value) {
        const db = await idb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction('f', 'readwrite');
            tx.objectStore('f').put(value, key);
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    }
    async function take(key) {
        const db = await idb();
        const value = await new Promise((resolve, reject) => {
            const tx = db.transaction('f', 'readwrite');
            const store = tx.objectStore('f');
            const req = store.get(key);
            req.onsuccess = () => { store.delete(key); };
            tx.oncomplete = () => resolve(req.result);
            tx.onerror = () => reject(tx.error);
        });
        db.close();
        return value;
    }

    window.HemiFile = { encode, readText, compressed: canGzip, relaxFileInputs, isMobile, stash, take };
})();
