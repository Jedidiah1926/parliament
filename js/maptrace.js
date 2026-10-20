// ===== 맵 메이커(map.html) 보조 — 그림 지도 자동 추적 · .jsx 지도 다시 열기 =====
// MapTrace.traceImage(file, opts) → Promise<{ svgText, count, width, height }>
//   webp · png · jpg · bmp 같은 그림 지도에서 같은 색으로 칠해진 덩어리를 찾아 도형(<path>)으로 바꾼다.
//   어두운 경계선 · 색이 번진 가장자리 · 얇은 선은 이웃 지역이 나눠 가지고, 가장자리를 둘러싼 큰 덩어리(바다 · 바탕)는 뺄 수 있다.
//   opts: { tolerance(색 허용 오차 0~255), minArea(최소 크기, 그림 넓이 대비 ‰), dropBackground(bool), mergeSame(같은 색 이웃 합치기), maxSize(추적 해상도),
//           pixel(픽셀 지도 — 색이 정확히 같은 화소끼리 한 지역, 키우기 · 작은 조각 지우기 · 단순화 없음), joinSameColor(픽셀 지도에서 같은 색은 떨어져 있어도 한 지역) }
// MapTrace.detectPixelMap(file) → Promise<bool> — 화소 단위로 칠한 지도(프로빈스 맵 등)인지 (번짐 · 압축 얼룩이 없고 색 수가 적음)
// MapTrace.jsxToSvg(text) → { svgText, count } — 맵 메이커가 내보낸 .jsx를 다시 SVG로 (게임의 parseDistrictJsx와 같은 규칙)
(function () {
    'use strict';

    function loadImage(file) {
        return new Promise((ok, bad) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => ok({ img, url });
            img.onerror = async () => {
                // 브라우저가 못 읽는 BMP(오래된 헤더 · RLE · 비트필드 등)는 직접 풀어서 캔버스로
                try {
                    const canvas = decodeBmp(await file.arrayBuffer());
                    if (canvas) { ok({ img: canvas, url }); return; }
                } catch (e) { /* 아래 오류로 */ }
                URL.revokeObjectURL(url);
                bad(new Error('그림을 읽지 못했습니다 (지원하지 않는 형식이거나 손상된 파일).'));
            };
            img.src = url;
        });
    }

    // ---- BMP 해독 (BITMAPCOREHEADER · BITMAPINFOHEADER ~ V5, 1 · 4 · 8 · 16 · 24 · 32비트, RLE4 · RLE8 · 비트필드) ----
    // BMP가 아니면 null
    function decodeBmp(buf) {
        const dv = new DataView(buf);
        if (buf.byteLength < 26 || dv.getUint16(0, false) !== 0x424d) return null; // 'BM'
        const dataOff = dv.getUint32(10, true);
        const hs = dv.getUint32(14, true);
        let W, H, bpp, comp = 0, nColors = 0;
        if (hs === 12) { W = dv.getUint16(18, true); H = dv.getInt16(20, true); bpp = dv.getUint16(24, true); }
        else { W = dv.getInt32(18, true); H = dv.getInt32(22, true); bpp = dv.getUint16(28, true); comp = dv.getUint32(30, true); nColors = hs >= 36 ? dv.getUint32(46, true) : 0; }
        const topDown = H < 0; H = Math.abs(H);
        if (!(W > 0 && H > 0) || W * H > 64e6) throw new Error('bad size');
        // 팔레트 (BGR(A) — core 헤더는 3바이트씩)
        const palEntry = hs === 12 ? 3 : 4;
        const pal = [];
        if (bpp <= 8) {
            const n = nColors || (1 << bpp);
            for (let i = 0; i < n; i++) { const o = 14 + hs + i * palEntry; if (o + 2 >= buf.byteLength) break; pal.push([dv.getUint8(o + 2), dv.getUint8(o + 1), dv.getUint8(o)]); }
        }
        // 비트필드 마스크 (BI_BITFIELDS=3 · BI_ALPHABITFIELDS=6) — V4 이상 헤더는 헤더 안, 아니면 헤더 바로 뒤
        let masks = null;
        if (comp === 3 || comp === 6) {
            const mo = hs >= 52 ? 54 : 14 + hs;
            masks = [dv.getUint32(mo, true), dv.getUint32(mo + 4, true), dv.getUint32(mo + 8, true), comp === 6 || hs >= 56 ? dv.getUint32(mo + 12, true) : 0];
        } else if (bpp === 16) masks = [0x7c00, 0x03e0, 0x001f, 0];
        else if (bpp === 32) masks = [0xff0000, 0xff00, 0xff, 0];
        const chan = m => { if (!m) return null; let sh = 0; while (!((m >>> sh) & 1)) sh++; let bits = 0; while ((m >>> (sh + bits)) & 1) bits++; return { sh, max: (1 << bits) - 1 }; };
        const ch = masks ? masks.map(chan) : null;
        const pick = (v, c) => (c ? Math.round(((v >>> c.sh) & c.max) * 255 / c.max) : 255);
        const out = new Uint8ClampedArray(W * H * 4);
        const put = (x, y, r, g, b, a) => { const row = topDown ? y : H - 1 - y; const i = (row * W + x) * 4; out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = a; };
        const putPal = (x, y, idx) => { const c = pal[idx] || [0, 0, 0]; put(x, y, c[0], c[1], c[2], 255); };
        if (comp === 1 || comp === 2) {
            // RLE8 · RLE4 — y는 파일 순서(아래부터)
            const four = comp === 2;
            let o = dataOff, x = 0, y = 0;
            while (o + 1 < buf.byteLength && y < H) {
                const n = dv.getUint8(o), v = dv.getUint8(o + 1); o += 2;
                if (n > 0) { for (let i = 0; i < n && x < W; i++, x++) putPal(x, y, four ? (i & 1 ? v & 15 : v >> 4) : v); }
                else if (v === 0) { x = 0; y++; }
                else if (v === 1) break;
                else if (v === 2) { x += dv.getUint8(o); y += dv.getUint8(o + 1); o += 2; }
                else {
                    for (let i = 0; i < v && x < W; i++, x++) { const byte = dv.getUint8(o + (four ? i >> 1 : i)); putPal(x, y, four ? (i & 1 ? byte & 15 : byte >> 4) : byte); }
                    const used = four ? Math.ceil(v / 2) : v; o += used + (used & 1);
                }
            }
        } else {
            const stride = Math.floor((bpp * W + 31) / 32) * 4;
            for (let y = 0; y < H; y++) {
                const ro = dataOff + y * stride;
                if (ro + stride > buf.byteLength) break;
                for (let x = 0; x < W; x++) {
                    if (bpp === 24) { const o = ro + x * 3; put(x, y, dv.getUint8(o + 2), dv.getUint8(o + 1), dv.getUint8(o), 255); }
                    else if (bpp === 32) { const v = dv.getUint32(ro + x * 4, true); put(x, y, pick(v, ch[0]), pick(v, ch[1]), pick(v, ch[2]), ch[3] ? pick(v, ch[3]) : 255); }
                    else if (bpp === 16) { const v = dv.getUint16(ro + x * 2, true); put(x, y, pick(v, ch[0]), pick(v, ch[1]), pick(v, ch[2]), ch[3] ? pick(v, ch[3]) : 255); }
                    else if (bpp <= 8) { const bit = x * bpp, byte = dv.getUint8(ro + (bit >> 3)); putPal(x, y, (byte >> (8 - bpp - (bit & 7))) & ((1 << bpp) - 1)); }
                    else throw new Error('bpp');
                }
            }
        }
        // 32비트인데 알파가 모두 0이면 (알파를 안 쓰는 파일) 불투명으로
        if (bpp === 32 && ch && ch[3]) { let any = false; for (let i = 3; i < out.length; i += 4) if (out[i]) { any = true; break; } if (!any) for (let i = 3; i < out.length; i += 4) out[i] = 255; }
        const canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.getContext('2d').putImageData(new ImageData(out, W, H), 0, 0);
        return canvas;
    }

    const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

    // 닫힌 다각형 단순화 — 계단 모양 화소 경계를 매끈한 선으로 (Ramer–Douglas–Peucker)
    function simplify(pts, eps) {
        if (pts.length < 4) return pts;
        const keep = new Uint8Array(pts.length);
        const rdp = (a, b) => {
            const [ax, ay] = pts[a], [bx, by] = pts[b];
            const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
            let best = -1, bi = -1;
            for (let i = a + 1; i < b; i++) {
                const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
                if (d > best) { best = d; bi = i; }
            }
            if (best > eps) { keep[bi] = 1; rdp(a, bi); rdp(bi, b); }
        };
        // 고리를 가장 먼 두 점으로 나눠 각각 단순화
        let far = 0, fd = -1;
        for (let i = 1; i < pts.length; i++) { const d = (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2; if (d > fd) { fd = d; far = i; } }
        keep[0] = keep[far] = 1;
        rdp(0, far);
        const ring = pts.concat([pts[0]]);
        const k2 = new Uint8Array(ring.length);
        const rdp2 = (a, b) => {
            const [ax, ay] = ring[a], [bx, by] = ring[b];
            const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
            let best = -1, bi = -1;
            for (let i = a + 1; i < b; i++) {
                const d = Math.abs(dy * ring[i][0] - dx * ring[i][1] + bx * ay - by * ax) / len;
                if (d > best) { best = d; bi = i; }
            }
            if (best > eps) { k2[bi] = 1; rdp2(a, bi); rdp2(bi, b); }
        };
        rdp2(far, ring.length - 1);
        const out = [];
        for (let i = 0; i < pts.length; i++) if (keep[i] || k2[i]) out.push(pts[i]);
        return out;
    }

    // 마스크 열림(opening) — 반지름 r의 정사각형 창이 꽉 차는 자리만 남긴 뒤 다시 r만큼 넓힘.
    // 폭이 2r보다 좁은 부분(경계선)은 사라지고 넓은 면(바다 · 큰 어두운 지역)은 그대로 남는다
    function openMask(mask, W, H, r) {
        const integ = src => {
            const S = new Int32Array((W + 1) * (H + 1));
            for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += src[y * W + x]; S[(y + 1) * (W + 1) + x + 1] = S[y * (W + 1) + x + 1] + row; } }
            return S;
        };
        const box = (S, x, y) => {
            const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(W, x + r + 1), y1 = Math.min(H, y + r + 1);
            return [S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0], (x1 - x0) * (y1 - y0)];
        };
        const S1 = integ(mask), core = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (mask[i]) { const [n, a] = box(S1, x, y); if (n === a) core[i] = 1; } }
        const S2 = integ(core), out = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (mask[i] && box(S2, x, y)[0] > 0) out[i] = 1; }
        return out;
    }

    // ---- 픽셀 지도 알아보기 — 화소마다 색을 정확히 칠한 지도는 거의 모든 화소가 "여러 번 쓰인 색"이고 색 수도 적다 (2만 개 이하)
    //      (JPEG · 번진 가장자리가 있는 그림은 경계마다 한두 번만 쓰인 중간색 화소가 많이 생긴다)
    async function detectPixelMap(file) {
        const { img, url } = await loadImage(file);
        try {
            const IW = img.naturalWidth || img.width, IH = img.naturalHeight || img.height;
            if (!IW || !IH) return false;
            // 아주 큰 그림은 화소를 고르게 골라(섞지 않고) 16M 화소 이하로 줄여 본다 — 색은 그대로 남는다
            const r = Math.min(1, Math.sqrt(16e6 / (IW * IH)));
            const W = Math.max(1, Math.round(IW * r)), H = Math.max(1, Math.round(IH * r));
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
            const cx = cv.getContext('2d', { willReadFrequently: true });
            cx.imageSmoothingEnabled = false;
            cx.drawImage(img, 0, 0, W, H);
            const px = cx.getImageData(0, 0, W, H).data;
            const N = W * H;
            const count = new Map();
            let opaque = 0;
            for (let i = 0; i < N; i++) {
                if (px[i * 4 + 3] < 128) continue;
                opaque++;
                const k = (px[i * 4] << 16) | (px[i * 4 + 1] << 8) | px[i * 4 + 2];
                count.set(k, (count.get(k) || 0) + 1);
                if (count.size > 20000) return false; // 프로빈스 맵도 색은 많아야 1만여 개 — 번진 그림을 키운 것(중간색이 여러 화소로 불어남)은 색이 훨씬 많다
            }
            let rare = 0;
            count.forEach(n => { if (n < 4) rare += n; });
            return opaque > 0 && rare / opaque < 0.002;
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    // ---- 픽셀 지도 추적 — 색이 정확히 같은 이웃 화소끼리(4방향) 한 지역, 화소 경계 그대로 (이웃 지역과 틈 없이 맞물림)
    function tracePixel(img, IW, IH, o) {
        // 너무 큰 그림만 화소를 고르게 골라 줄인다 (부드럽게 섞지 않음 — 섞으면 새 색이 생긴다)
        const MAXPX = 16e6;
        const sc = IW * IH > MAXPX ? Math.sqrt(MAXPX / (IW * IH)) : 1;
        const W = Math.max(1, Math.round(IW * sc)), H = Math.max(1, Math.round(IH * sc));
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const cx = cv.getContext('2d', { willReadFrequently: true });
        cx.imageSmoothingEnabled = false;
        cx.drawImage(img, 0, 0, W, H);
        const px = cx.getImageData(0, 0, W, H).data;
        const N = W * H;
        const key = new Int32Array(N);
        for (let i = 0; i < N; i++) key[i] = px[i * 4 + 3] < 128 ? -1 : (px[i * 4] << 16) | (px[i * 4 + 1] << 8) | px[i * 4 + 2];
        // lab: -3 투명(바탕) · -2 경계(가는 검은 선) · 0 이상 지역 번호
        const lab = new Int32Array(N).fill(-1);
        const comps = [];
        const queue = new Int32Array(N);
        const byColor = new Map(); // joinSameColor: 색 → 지역 번호
        for (let s = 0; s < N; s++) {
            if (lab[s] !== -1) continue;
            const k = key[s];
            if (k < 0) { lab[s] = -3; continue; }
            let id;
            if (o.joinSameColor && byColor.has(k)) id = byColor.get(k);
            else { id = comps.length; comps.push({ id, key: k, area: 0, edge: 0, keep: true }); byColor.set(k, id); }
            const c = comps[id];
            let qh = 0, qt = 0;
            queue[qt++] = s; lab[s] = id;
            while (qh < qt) {
                const i = queue[qh++], x = i % W, y = (i - x) / W;
                c.area++;
                if (x === 0 || y === 0 || x === W - 1 || y === H - 1) c.edge++;
                if (x > 0 && lab[i - 1] === -1 && key[i - 1] === k) { lab[i - 1] = id; queue[qt++] = i - 1; }
                if (x < W - 1 && lab[i + 1] === -1 && key[i + 1] === k) { lab[i + 1] = id; queue[qt++] = i + 1; }
                if (y > 0 && lab[i - W] === -1 && key[i - W] === k) { lab[i - W] = id; queue[qt++] = i - W; }
                if (y < H - 1 && lab[i + W] === -1 && key[i + W] === k) { lab[i + W] = id; queue[qt++] = i + W; }
            }
        }
        // 가는 검은 선은 지역이 아니라 경계 — 이웃 지역이 나눠 갖는다
        const lum = k => 0.299 * (k >> 16 & 255) + 0.587 * (k >> 8 & 255) + 0.114 * (k & 255);
        // (아주 어두운 덩어리 중 거의 전부가 폭 4화소 이하인 것만 — 넓은 어두운 프로빈스 · 20화소 미만의 작은 어두운 프로빈스는 그대로 지역)
        const dark = new Uint8Array(N);
        for (let i = 0; i < N; i++) { const c = lab[i]; if (c >= 0 && lum(comps[c].key) < 55) dark[i] = 1; }
        const wide = openMask(dark, W, H, 2);
        for (let i = 0; i < N; i++) if (dark[i] && !wide[i]) comps[lab[i]].thin = (comps[lab[i]].thin || 0) + 1;
        comps.forEach(c => { if (c.thin && c.area >= 20 && c.thin >= c.area * 0.8) { c.keep = false; c.line = true; } });
        // 바탕: 그림 가장자리를 가장 많이 두른 덩어리 (둘레의 30% 넘게) — 같은 색 덩어리(호수 · 내해)도 함께 뺀다
        let bg = null;
        if (o.dropBackground) {
            const border = 2 * (W + H);
            comps.forEach(c => { if (c.keep && c.edge > border * 0.3 && (!bg || c.edge > bg.edge)) bg = c; });
            if (bg) comps.forEach(c => { if (c.key === bg.key) { c.keep = false; c.bg = true; } });
        }
        for (let i = 0; i < N; i++) { const c = lab[i]; if (c >= 0 && !comps[c].keep) lab[i] = comps[c].bg ? -3 : -2; }
        // 경계 화소를 가까운 지역에 나눠 주기
        let qh = 0, qt = 0;
        for (let i = 0; i < N; i++) {
            if (lab[i] < 0) continue;
            const x = i % W;
            if ((x > 0 && lab[i - 1] === -2) || (x < W - 1 && lab[i + 1] === -2) || (i >= W && lab[i - W] === -2) || (i < N - W && lab[i + W] === -2)) queue[qt++] = i;
        }
        while (qh < qt) {
            const i = queue[qh++], c = lab[i], x = i % W;
            if (x > 0 && lab[i - 1] === -2) { lab[i - 1] = c; queue[qt++] = i - 1; }
            if (x < W - 1 && lab[i + 1] === -2) { lab[i + 1] = c; queue[qt++] = i + 1; }
            if (i >= W && lab[i - W] === -2) { lab[i - W] = c; queue[qt++] = i - W; }
            if (i < N - W && lab[i + W] === -2) { lab[i + W] = c; queue[qt++] = i + W; }
        }
        const kept = comps.filter(c => c.keep);
        const hexKey = k => '#' + (k & 0xffffff).toString(16).padStart(6, '0');
        const paths = ringsToPaths(lab, W, H, kept, 1 / sc, 0, c => hexKey(c.key));
        const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${IW} ${IH}" width="${IW}" height="${IH}">${paths.join('')}</svg>`;
        return { svgText, count: paths.length, width: IW, height: IH, pixel: true, stats: { comps: comps.length, lines: comps.filter(c => c.line).length, W, H } };
    }

    // 지역마다 화소 경계를 방향 있는 변으로 모아 고리로 이어 <path>로 — eps가 0이면 단순화 없이 화소 경계 그대로 (일직선 위의 점만 뺌)
    function ringsToPaths(lab, W, H, kept, k, eps, colorOf) {
        const N = W * H, VW = W + 1;
        const idx = new Map(kept.map((c, n) => [c.id, n]));
        const edges = kept.map(() => new Map());
        const addEdge = (m, a, b) => { let l = m.get(a); if (!l) m.set(a, (l = [])); l.push(b); };
        for (let i = 0; i < N; i++) {
            const c = lab[i]; if (c < 0) continue;
            const n = idx.get(c); if (n === undefined) continue;
            const m = edges[n], x = i % W, y = (i - x) / W;
            if (y === 0 || lab[i - W] !== c) addEdge(m, y * VW + x, y * VW + x + 1);
            if (x === W - 1 || lab[i + 1] !== c) addEdge(m, y * VW + x + 1, (y + 1) * VW + x + 1);
            if (y === H - 1 || lab[i + W] !== c) addEdge(m, (y + 1) * VW + x + 1, (y + 1) * VW + x);
            if (x === 0 || lab[i - 1] !== c) addEdge(m, (y + 1) * VW + x, y * VW + x);
        }
        // 위에서 아래, 왼쪽에서 오른쪽 순으로 번호 (무게중심 기준)
        const cen = kept.map(() => [0, 0, 0]);
        for (let i = 0; i < N; i++) { const n = idx.get(lab[i]); if (n !== undefined) { const t = cen[n]; t[0] += i % W; t[1] += Math.floor(i / W); t[2]++; } }
        const order = kept.map((c, n) => n).sort((a, b) => { const A = cen[a], B = cen[b]; const ay = A[1] / A[2], by = B[1] / B[2]; return Math.abs(ay - by) > H * 0.04 ? ay - by : A[0] / A[2] - B[0] / B[2]; });
        const f = v => (Math.round(v * k * 100) / 100).toString();
        const paths = [];
        order.forEach((n, rank) => {
            const m = edges[n];
            let d = '';
            for (const [start] of m) {
                while (m.get(start) && m.get(start).length) {
                    const ring = [];
                    let cur = start, guard = 0;
                    do {
                        const l = m.get(cur);
                        if (!l || !l.length) break;
                        const nxt = l.pop();
                        if (!l.length) m.delete(cur);
                        ring.push([cur % VW, Math.floor(cur / VW)]);
                        cur = nxt;
                    } while (cur !== start && ++guard < 4 * N);
                    if (ring.length < 3) continue;
                    const pts = ring.filter((p, i) => { const a = ring[(i - 1 + ring.length) % ring.length], b = ring[(i + 1) % ring.length]; return (b[0] - a[0]) * (p[1] - a[1]) !== (b[1] - a[1]) * (p[0] - a[0]); });
                    const sp = eps > 0 ? simplify(pts.length >= 3 ? pts : ring, eps) : (pts.length >= 3 ? pts : ring);
                    if (sp.length < 3) continue;
                    d += 'M' + sp.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
                }
            }
            if (d) paths.push(`<path id="지역 ${rank + 1}" d="${d}" fill="${colorOf(kept[n])}" fill-rule="evenodd" stroke="#333" stroke-width="0.6" vector-effect="non-scaling-stroke"/>`);
        });
        return paths;
    }

    async function traceImage(file, opts) {
        const o = Object.assign({ tolerance: 12, minArea: 0.03, dropBackground: true, mergeSame: true, maxSize: 3000 }, opts || {});
        const { img, url } = await loadImage(file);
        try {
            const IW = img.naturalWidth || img.width, IH = img.naturalHeight || img.height;
            if (!IW || !IH) throw new Error('그림 크기를 알 수 없습니다.');
            if (o.pixel) return tracePixel(img, IW, IH, o);
            // 작은 그림은 부드럽게 키워서 추적 — 경계가 화소 계단 대신 반 화소 단위로 잡혀 더 정확하고 매끈해진다
            const big = Math.max(IW, IH);
            const sc = big > o.maxSize ? o.maxSize / big : Math.max(1, Math.min(o.upscale || 2, 2400 / big));
            const W = Math.max(1, Math.round(IW * sc)), H = Math.max(1, Math.round(IH * sc));
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
            const cx = cv.getContext('2d', { willReadFrequently: true });
            cx.imageSmoothingEnabled = sc > 1;
            cx.imageSmoothingQuality = 'high';
            cx.drawImage(img, 0, 0, W, H);
            const px = cx.getImageData(0, 0, W, H).data;
            const N = W * H;
            // lab: -1 미정 · -2 경계(어두운 선 · 버린 덩어리) · -3 투명(바탕) · 0 이상 덩어리 번호
            const lab = new Int32Array(N).fill(-1);
            // 검은 · 진한 화소 중 가는 선(폭 4화소 이하)만 경계로 — 어두운 바다처럼 넓은 면은 보통 색처럼 덩어리로 묶는다
            const dark = new Uint8Array(N);
            for (let i = 0; i < N; i++) {
                if (px[i * 4 + 3] < 128) { lab[i] = -3; continue; }
                if (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2] < 55) dark[i] = 1;
            }
            const darkWide = openMask(dark, W, H, Math.max(2, Math.round(2 * sc)));
            // lineAt: 검은 경계선 화소 — 나중에 "같은 색 이웃 합치기"가 검은 선을 넘어 합치지 않게 기억해 둔다
            const lineAt = new Uint8Array(N);
            for (let i = 0; i < N; i++) if (dark[i] && !darkWide[i]) { lab[i] = -2; lineAt[i] = 1; }
            // 같은 색 덩어리 찾기 (시작 화소 색 기준 허용 오차 안의 이웃)
            const tol2 = (o.tolerance * o.tolerance) * 3;
            const comps = [];
            const queue = new Int32Array(N);
            for (let s = 0; s < N; s++) {
                if (lab[s] !== -1) continue;
                const id = comps.length;
                const r0 = px[s * 4], g0 = px[s * 4 + 1], b0 = px[s * 4 + 2];
                let qh = 0, qt = 0, area = 0, sr = 0, sg = 0, sb = 0, edge = 0;
                queue[qt++] = s; lab[s] = id;
                while (qh < qt) {
                    const i = queue[qh++];
                    area++; sr += px[i * 4]; sg += px[i * 4 + 1]; sb += px[i * 4 + 2];
                    const x = i % W, y = (i - x) / W;
                    if (x === 0 || y === 0 || x === W - 1 || y === H - 1) edge++;
                    const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
                    for (const j of nb) {
                        if (j < 0 || lab[j] !== -1) continue;
                        const dr = px[j * 4] - r0, dg = px[j * 4 + 1] - g0, db = px[j * 4 + 2] - b0;
                        if (dr * dr + dg * dg + db * db > tol2) continue;
                        lab[j] = id; queue[qt++] = j;
                    }
                }
                comps.push({ id, area, color: [sr / area, sg / area, sb / area], edge, perim: 0, keep: true });
            }
            // 둘레(이웃이 다른 화소인 변의 수) — 얇은 선 덩어리를 가려내는 데 씀
            for (let i = 0; i < N; i++) {
                const c = lab[i]; if (c < 0) continue;
                const x = i % W;
                if (x === 0 || lab[i - 1] !== c) comps[c].perim++;
                if (x === W - 1 || lab[i + 1] !== c) comps[c].perim++;
                if (i < W || lab[i - W] !== c) comps[c].perim++;
                if (i >= N - W || lab[i + W] !== c) comps[c].perim++;
            }
            // 속(3×3이 모두 같은 덩어리인 화소) — 번진 가장자리 · 가는 선은 속이 없고, 작은 나라라도 실제 지역은 속이 있다
            for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
                const i = y * W + x, c = lab[i]; if (c < 0) continue;
                if (lab[i - 1] === c && lab[i + 1] === c && lab[i - W] === c && lab[i + W] === c && lab[i - W - 1] === c && lab[i - W + 1] === c && lab[i + W - 1] === c && lab[i + W + 1] === c) comps[c].core = (comps[c].core || 0) + 1;
            }
            const minPx = Math.max(9, N * o.minArea / 1000);
            comps.forEach(c => {
                if (c.area < minPx) { c.keep = false; c.why = 'small'; }               // 너무 작은 덩어리 (글자 조각 · 점)
                else if (!c.core) { c.keep = false; c.why = 'nocore'; }                // 속이 없음 = 번진 가장자리 · 가는 선
                else if (c.area / c.perim < 0.9) { c.keep = false; c.why = 'thin'; }   // 얇은 선 (흰 경계선 등)
                else if (c.area / c.perim < 0.9 * sc) c.band = true;                 // 원본 2화소 폭 미만의 띠 — 압축으로 생긴 가장자리 띠일 수 있음 (합치기에서 조금 더 너그럽게)
            });
            // 바탕: 그림 가장자리를 가장 많이 두른 큰 덩어리 (바다 · 흰 바탕) — 둘레의 30% 넘게 가장자리에 닿으면 뺀다
            let bg = null;
            if (o.dropBackground) {
                const border = 2 * (W + H);
                comps.forEach(c => { if (c.keep && c.edge > border * 0.3 && (!bg || c.edge > bg.edge)) bg = c; });
                if (bg) {
                    bg.keep = false;
                    // 바탕과 같은 색인 안쪽 덩어리(호수 · 내해)도 뺀다
                    comps.forEach(c => {
                        if (!c.keep) return;
                        const dr = c.color[0] - bg.color[0], dg = c.color[1] - bg.color[1], db = c.color[2] - bg.color[2];
                        if (dr * dr + dg * dg + db * db <= Math.max(tol2 * 2.56, 35 * 35)) { c.keep = false; c.bgLike = true; }
                    });
                }
            }
            // 버린 작은 조각 중 바탕색에 가까운 것(압축으로 얼룩진 바다 가장자리)은 바다로 — 땅이 바다로 번지지 않게
            if (bg) {
                const sea = Math.max((o.tolerance * 2.5) ** 2 * 3, 50 * 50);
                comps.forEach(c => {
                    if (c.keep || c === bg) return;
                    const dr = c.color[0] - bg.color[0], dg = c.color[1] - bg.color[1], db = c.color[2] - bg.color[2];
                    if (dr * dr + dg * dg + db * db <= sea) c.seaish = true;
                });
            }
            // 버린 덩어리 화소는 경계로 → 남은 이웃 덩어리가 나눠 가짐 (바탕은 그대로 비워 둠)
            for (let i = 0; i < N; i++) {
                const c = lab[i];
                if (c >= 0 && !comps[c].keep) lab[i] = (bg && c === bg.id) || comps[c].bgLike || comps[c].seaish ? -3 : -2;
            }
            // 바탕 중 가는 줄기(바탕색으로 그린 경계선 · 좁은 틈)는 이웃 지역이 나눠 갖게 경계로
            if (bg) {
                const bgm = new Uint8Array(N);
                for (let i = 0; i < N; i++) if (lab[i] === -3 && px[i * 4 + 3] >= 128) bgm[i] = 1;
                const wide = openMask(bgm, W, H, Math.max(1, Math.round(sc)));
                for (let i = 0; i < N; i++) if (bgm[i] && !wide[i]) lab[i] = -2;
            }
            // 경계 화소를 가까운 덩어리에 나눠 주기 (여러 출발점 너비 우선 탐색)
            let qh = 0, qt = 0;
            for (let i = 0; i < N; i++) {
                if (lab[i] < 0) continue;
                const x = i % W;
                if ((x > 0 && lab[i - 1] === -2) || (x < W - 1 && lab[i + 1] === -2) || (i >= W && lab[i - W] === -2) || (i < N - W && lab[i + W] === -2)) queue[qt++] = i;
            }
            while (qh < qt) {
                const i = queue[qh++], c = lab[i], x = i % W;
                const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1];
                for (const j of nb) { if (j >= 0 && lab[j] === -2) { lab[j] = c; queue[qt++] = j; } }
            }
            // 같은 색 이웃 합치기 — 옅은 내부 경계선(주 · 도 경계)으로 쪼개진 같은 나라 조각을 하나로 (평균 색이 거의 같고 맞닿은 덩어리)
            if (o.mergeSame) {
                // 맞닿은 쌍을 색이 가까운 순서로 합치되, 합칠 때마다 합쳐진 평균 색으로 다시 비교 — 비슷한 색이 줄줄이 이어져
                // 다른 나라까지 한 덩어리가 되는 것(갈색 → 회갈색 → 회색 …)을 막는다
                const nC = comps.length;
                const par = new Int32Array(nC).map((_, i) => i);
                const find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
                const lim = Math.max(14, o.tolerance * 0.8) ** 2; // 같은 나라 조각은 평균 색이 거의 똑같다 (압축 잡음 정도) — 비슷한 색의 다른 나라는 합치지 않게 좁게
                const dist = (A, B) => (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2 + (A[2] - B[2]) ** 2;
                const bandK = 2.5; // 가장자리 띠는 색 차이를 이만큼(제곱 거리 배수) 더 봐줌
                const pairs = new Map();
                for (let i = 0; i < N; i++) {
                    const a = lab[i]; if (a < 0) continue;
                    const x = i % W;
                    for (const j of [x < W - 1 ? i + 1 : -1, i < N - W ? i + W : -1]) {
                        if (j < 0) continue;
                        const b = lab[j];
                        if (b < 0 || b === a) continue;
                        const key = a < b ? a * nC + b : b * nC + a;
                        let e = pairs.get(key);
                        if (e === undefined) { const d = dist(comps[a].color, comps[b].color); e = d <= lim * bandK ? [d, 0, 0] : null; pairs.set(key, e); }
                        if (e) { e[1]++; if (lineAt[i] || lineAt[j]) e[2]++; }
                    }
                }
                // 검은 선으로 나뉜 곳은 색이 같아도 합치지 않는다 — 맞닿은 경계의 30% 넘게 검은 선이면 지도를 그린 사람이 일부러 나눈 경계
                const col = comps.map(c => c.color.slice()), area = comps.map(c => c.area);
                // 단, 아주 작은 조각(원본 5×5화소 미만 — 글자 속 구멍 같은 것)은 검은 선 너머라도 붙인다
                const tiny = (5 * sc) ** 2;
                const limOf = key => (comps[Math.floor(key / nC)].band || comps[key % nC].band ? lim * bandK : lim);
                [...pairs.entries()].filter(([key, e]) => e && e[0] <= limOf(key) && (e[2] <= e[1] * 0.3 || Math.min(comps[Math.floor(key / nC)].area, comps[key % nC].area) < tiny)).sort((p1, p2) => p1[1][0] - p2[1][0]).forEach(([key]) => {
                    const ra = find(Math.floor(key / nC)), rb = find(key % nC);
                    if (ra === rb || dist(col[ra], col[rb]) > limOf(key)) return;
                    const t = area[ra] + area[rb];
                    col[ra] = col[ra].map((v, k) => (v * area[ra] + col[rb][k] * area[rb]) / t);
                    area[ra] = t; par[rb] = ra;
                });
                let merged = 0;
                comps.forEach(c => { const r = find(c.id); if (r !== c.id && c.keep) { c.keep = false; merged++; } });
                comps.forEach(c => { if (find(c.id) === c.id) { c.color = col[c.id]; c.area = area[c.id]; } });
                if (merged) for (let i = 0; i < N; i++) if (lab[i] >= 0) lab[i] = find(lab[i]);
            }
            // 덩어리마다 화소 경계를 방향 있는 변으로 모아 고리로 잇기 (y가 아래로 느는 좌표계에서 시계 방향)
            const kept = comps.filter(c => c.keep);
            const edgesOf = new Map(kept.map(c => [c.id, new Map()]));
            const VW = W + 1;
            const addEdge = (m, a, b) => { let l = m.get(a); if (!l) m.set(a, (l = [])); l.push(b); };
            for (let i = 0; i < N; i++) {
                const c = lab[i]; if (c < 0) continue;
                const m = edgesOf.get(c); if (!m) continue;
                const x = i % W, y = (i - x) / W;
                const v = (vx, vy) => vy * VW + vx;
                if (y === 0 || lab[i - W] !== c) addEdge(m, v(x, y), v(x + 1, y));
                if (x === W - 1 || lab[i + 1] !== c) addEdge(m, v(x + 1, y), v(x + 1, y + 1));
                if (y === H - 1 || lab[i + W] !== c) addEdge(m, v(x + 1, y + 1), v(x, y + 1));
                if (x === 0 || lab[i - 1] !== c) addEdge(m, v(x, y + 1), v(x, y));
            }
            const k = 1 / sc;
            const f = n => (Math.round(n * k * 10) / 10).toString();
            // 위에서 아래, 왼쪽에서 오른쪽 순으로 번호를 매기도록 무게중심 기준 정렬
            const centroid = new Map(kept.map(c => [c.id, [0, 0, 0]]));
            for (let i = 0; i < N; i++) { const c = lab[i]; const t = centroid.get(c); if (t) { t[0] += i % W; t[1] += Math.floor(i / W); t[2]++; } }
            kept.sort((a, b) => { const A = centroid.get(a.id), B = centroid.get(b.id); const ay = A[1] / A[2], by = B[1] / B[2]; return Math.abs(ay - by) > H * 0.04 ? ay - by : A[0] / A[2] - B[0] / B[2]; });
            const paths = [];
            kept.forEach((c, n) => {
                const m = edgesOf.get(c.id);
                let d = '';
                for (const [start] of m) {
                    while (m.get(start) && m.get(start).length) {
                        const ring = [];
                        let cur = start, guard = 0;
                        do {
                            const l = m.get(cur);
                            if (!l || !l.length) break;
                            const nxt = l.pop();
                            if (!l.length) m.delete(cur);
                            ring.push([cur % VW, Math.floor(cur / VW)]);
                            cur = nxt;
                        } while (cur !== start && ++guard < 4 * N);
                        if (ring.length < 3) continue;
                        // 일직선 위의 점 빼기 → 단순화
                        const pts = ring.filter((p, i) => { const a = ring[(i - 1 + ring.length) % ring.length], b = ring[(i + 1) % ring.length]; return (b[0] - a[0]) * (p[1] - a[1]) !== (b[1] - a[1]) * (p[0] - a[0]); });
                        const sp = simplify(pts.length >= 3 ? pts : ring, Math.max(0.75, sc * 0.5));
                        if (sp.length < 3) continue;
                        d += 'M' + sp.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
                    }
                }
                if (d) paths.push(`<path id="지역 ${n + 1}" d="${d}" fill="${hex(...c.color)}" fill-rule="evenodd" stroke="#333" stroke-width="${Math.max(0.5, Math.round(k * 10) / 10)}"/>`);
            });
            const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${IW} ${IH}" width="${IW}" height="${IH}">${paths.join('')}</svg>`;
            const stats = { comps: comps.length, W, H, small: 0, nocore: 0, thin: 0, droppedPx: 0 };
            comps.forEach(c => { if (c.why) { stats[c.why]++; stats.droppedPx += c.area; } });
            return { svgText, count: paths.length, width: IW, height: IH, stats };
        } finally {
            URL.revokeObjectURL(url);
        }
    }

    // 맵 메이커가 내보낸 .jsx → SVG 텍스트 (data-key가 지역구 이름 → 도형 id)
    function jsxToSvg(text) {
        const vbMatch = String(text).match(/\/\/\s*VIEWBOX:\s*(.+)/);
        const viewBox = vbMatch ? vbMatch[1].trim() : '0 0 100 100';
        const compRe = /export const (\w+)\s*=\s*\([^)]*\)\s*=>\s*\(\s*<(\w+)\s*([^>]*?)\/?>\s*\)/g;
        const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const els = [];
        let m;
        while ((m = compRe.exec(text))) {
            const [, name, tag, attrStr] = m;
            if (!/^(path|polygon|polyline|rect|circle|ellipse)$/i.test(tag)) continue;
            const attrs = {};
            let key = null;
            const attrRe = /([a-zA-Z0-9_:-]+)="([^"]*)"/g;
            let am;
            while ((am = attrRe.exec(attrStr))) {
                const v = am[2].replace(/&quot;/g, '"').replace(/\\`/g, '`');
                if (am[1] === 'data-key') key = v;
                else if (['d', 'points', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'ry', 'transform', 'fill-rule'].includes(am[1])) attrs[am[1]] = v;
            }
            const a = Object.entries(attrs).map(([k2, v]) => ` ${k2}="${esc(v)}"`).join('');
            els.push(`<${tag.toLowerCase()} id="${esc(key || name)}"${a} fill="#cfd6e0" stroke="#4a5160" stroke-width="1" vector-effect="non-scaling-stroke"/>`);
        }
        return { svgText: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${esc(viewBox)}">${els.join('')}</svg>`, count: els.length };
    }

    window.MapTrace = { traceImage, detectPixelMap, jsxToSvg, decodeBmp };
})();
