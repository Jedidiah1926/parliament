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

    window.HemiFile = { encode, readText, compressed: canGzip };
})();
