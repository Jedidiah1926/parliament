// ===== 맵 메이커(map.html) 보조 — 그림 지도 자동 추적 · .jsx 지도 다시 열기 =====
// MapTrace.traceImage(file, opts) → Promise<{ svgText, count, width, height }>
//   webp · png · jpg 같은 그림 지도에서 같은 색으로 칠해진 덩어리를 찾아 도형(<path>)으로 바꾼다.
//   어두운 경계선 · 색이 번진 가장자리 · 얇은 선은 이웃 지역이 나눠 가지고, 가장자리를 둘러싼 큰 덩어리(바다 · 바탕)는 뺄 수 있다.
//   opts: { tolerance(색 허용 오차 0~255), minArea(최소 크기, 원본 그림 화소 기준 비율 ‰), dropBackground(bool), maxSize(추적 해상도) }
// MapTrace.jsxToSvg(text) → { svgText, count } — 맵 메이커가 내보낸 .jsx를 다시 SVG로 (게임의 parseDistrictJsx와 같은 규칙)
(function () {
    'use strict';

    function loadImage(file) {
        return new Promise((ok, bad) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => ok({ img, url });
            img.onerror = () => { URL.revokeObjectURL(url); bad(new Error('그림을 읽지 못했습니다 (지원하지 않는 형식이거나 손상된 파일).')); };
            img.src = url;
        });
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

    async function traceImage(file, opts) {
        const o = Object.assign({ tolerance: 40, minArea: 0.3, dropBackground: true, maxSize: 1000 }, opts || {});
        const { img, url } = await loadImage(file);
        try {
            const IW = img.naturalWidth || img.width, IH = img.naturalHeight || img.height;
            if (!IW || !IH) throw new Error('그림 크기를 알 수 없습니다.');
            const sc = Math.min(1, o.maxSize / Math.max(IW, IH));
            const W = Math.max(1, Math.round(IW * sc)), H = Math.max(1, Math.round(IH * sc));
            const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
            const cx = cv.getContext('2d', { willReadFrequently: true });
            cx.imageSmoothingEnabled = false;
            cx.drawImage(img, 0, 0, W, H);
            const px = cx.getImageData(0, 0, W, H).data;
            const N = W * H;
            // lab: -1 미정 · -2 경계(어두운 선 · 버린 덩어리) · -3 투명(바탕) · 0 이상 덩어리 번호
            const lab = new Int32Array(N).fill(-1);
            for (let i = 0; i < N; i++) {
                const a = px[i * 4 + 3];
                if (a < 128) { lab[i] = -3; continue; }
                const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
                if (0.299 * r + 0.587 * g + 0.114 * b < 55) lab[i] = -2; // 검은 · 진한 경계선
            }
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
            const minPx = Math.max(6, N * o.minArea / 1000);
            comps.forEach(c => {
                if (c.area < minPx) c.keep = false;              // 너무 작은 덩어리 (글자 · 번진 가장자리)
                else if (c.area / c.perim < 0.9) c.keep = false; // 얇은 선 (흰 경계선 등)
            });
            // 바탕: 그림 가장자리를 가장 많이 두른 큰 덩어리 (바다 · 흰 바탕) — 둘레의 30% 넘게 가장자리에 닿으면 뺀다
            let bg = null;
            if (o.dropBackground) {
                const border = 2 * (W + H);
                comps.forEach(c => { if (c.keep && c.edge > border * 0.3 && (!bg || c.edge > bg.edge)) bg = c; });
                if (bg) bg.keep = false;
            }
            // 버린 덩어리 화소는 경계로 → 남은 이웃 덩어리가 나눠 가짐 (바탕은 그대로 비워 둠)
            for (let i = 0; i < N; i++) {
                const c = lab[i];
                if (c >= 0 && !comps[c].keep) lab[i] = bg && c === bg.id ? -3 : -2;
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
                        const sp = simplify(pts.length >= 3 ? pts : ring, 1.1);
                        if (sp.length < 3) continue;
                        d += 'M' + sp.map(p => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
                    }
                }
                if (d) paths.push(`<path id="지역 ${n + 1}" d="${d}" fill="${hex(...c.color)}" fill-rule="evenodd" stroke="#333" stroke-width="${Math.max(0.5, Math.round(k * 10) / 10)}"/>`);
            });
            const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${IW} ${IH}" width="${IW}" height="${IH}">${paths.join('')}</svg>`;
            return { svgText, count: paths.length, width: IW, height: IH };
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

    window.MapTrace = { traceImage, jsxToSvg };
})();
