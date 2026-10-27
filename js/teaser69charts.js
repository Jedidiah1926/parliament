// ===== Hemicycle 티저 1.6.9 — 경제 그래프 (js/teaser69.js가 씀) =====
// SVG로 그리는 작은 그래프 묶음. 색은 .t69-viz의 CSS 변수(라이트 · 다크 각각 고른 색)로만 칠하고,
// 내보낼 때는 변수를 실제 색으로 바꿔 담는다. 규칙: 축은 하나(두 눈금 겹치지 않음), 색은 지표마다 고정,
// 상태(안전 · 경고 · 위험 · 위기)는 상태색 + 글자, 마우스를 올리면 십자선 · 값, 표로도 볼 수 있게.
//   T69C.gauge · lines · panels · stackBars · budgetHemi · budgetBars · sankey · scatter · tornado · trajectory · table
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-app-mode') !== 'teaser' || !['69'].includes(document.documentElement.getAttribute('data-teaser') || '69')) return;

    const NS = 'http://www.w3.org/2000/svg';
    const S = (tag, attrs, parent) => {
        const e = document.createElementNS(NS, tag);
        if (attrs) for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
        if (parent) parent.appendChild(e);
        return e;
    };
    const T = (parent, x, y, text, attrs) => { const e = S('text', Object.assign({ x, y }, attrs || {}), parent); e.textContent = text; return e; };
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const finite = v => typeof v === 'number' && isFinite(v);
    const fmtNum = (v, d = 1) => (finite(v) ? (Math.abs(v) >= 1000 ? Math.round(v).toLocaleString() : v.toFixed(d)) : '—');
    const STATUS = { good: { word: '안전', icon: '●' }, warning: { word: '경고', icon: '▲' }, serious: { word: '위험', icon: '◆' }, critical: { word: '위기', icon: '✖' } };

    // 눈금 — 사람이 읽기 좋은 간격 (1 · 2 · 5 × 10ⁿ)
    function ticks(min, max, n = 5) {
        if (!(max > min)) { max = min + 1; }
        const span = max - min, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
        const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= n) || 10 * mag;
        const out = [];
        for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
        return out;
    }
    function extent(arrs, padFrac = 0.08, includeZero = false) {
        let lo = Infinity, hi = -Infinity;
        arrs.forEach(a => a.forEach(v => { if (finite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }));
        if (!isFinite(lo)) { lo = 0; hi = 1; }
        if (includeZero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
        if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
        const p = (hi - lo) * padFrac;
        return [lo - (includeZero && lo === 0 ? 0 : p), hi + p];
    }

    // ---- 툴팁 하나 (값이 앞, 이름이 뒤 · 이름은 textContent로만) ----
    let tipEl = null;
    function tip() {
        if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 't69-tip t69-viz'; tipEl.setAttribute('role', 'status'); document.body.appendChild(tipEl); }
        return tipEl;
    }
    function showTip(clientX, clientY, title, rows) {
        const el = tip();
        el.textContent = '';
        if (title) { const h = document.createElement('div'); h.className = 't69-tip-h'; h.textContent = title; el.appendChild(h); }
        rows.forEach(r => {
            const row = document.createElement('div'); row.className = 't69-tip-r';
            if (r.color) { const k = document.createElement('i'); k.style.background = r.color; if (r.dash) k.className = 'dash'; row.appendChild(k); }
            const v = document.createElement('b'); v.textContent = r.value; row.appendChild(v);
            const l = document.createElement('span'); l.textContent = r.label || ''; row.appendChild(l);
            el.appendChild(row);
        });
        el.style.display = 'block';
        const w = el.offsetWidth, h = el.offsetHeight;
        let x = clientX + 14, y = clientY + 14;
        if (x + w > window.innerWidth - 8) x = clientX - w - 14;
        if (y + h > window.innerHeight - 8) y = clientY - h - 14;
        el.style.left = Math.max(8, x) + 'px'; el.style.top = Math.max(8, y) + 'px';
    }
    function hideTip() { if (tipEl) tipEl.style.display = 'none'; }

    // ---- 크기가 바뀌면 다시 그리기 ----
    const ro = window.ResizeObserver ? new ResizeObserver(entries => entries.forEach(en => {
        const c = en.target; if (!c.__t69draw) return;
        const w = Math.round(en.contentRect.width);
        if (w && Math.abs(w - (c.__t69w || 0)) > 2) { c.__t69w = w; clearTimeout(c.__t69rt); c.__t69rt = setTimeout(() => c.__t69draw(), 60); }
    })) : null;
    function mount(container, draw) {
        container.__t69draw = draw;
        container.__t69w = container.clientWidth;
        if (ro && !container.__t69ro) { ro.observe(container); container.__t69ro = true; }
        draw();
    }
    const widthOf = (c, fallback = 560) => Math.max(240, Math.floor(c.clientWidth || fallback));

    // ================= 반원 계기 =================
    // opt: { label, value, unit, min, max, bands: [{ from, to, status }], decimals, spark: [], delta, status, onClick(event), sub, title }
    function gauge(container, opt) {
        container.textContent = '';
        container.classList.add('t69-gauge');
        const W = 132, H = 84, cx = W / 2, cy = 66, r = 50, thick = 9;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, class: 't69-gauge-svg', role: 'img', 'aria-label': `${opt.label} ${fmtNum(opt.value, opt.decimals ?? 1)}${opt.unit || ''}` }, container);
        const a = v => Math.PI * (1 - (clamp(v, opt.min, opt.max) - opt.min) / (opt.max - opt.min));
        const pt = (ang, rr) => [cx + rr * Math.cos(ang), cy - rr * Math.sin(ang)];
        const arc = (v0, v1, rr, cls) => {
            const a0 = a(v0), a1 = a(v1);
            const [x0, y0] = pt(a0, rr), [x1, y1] = pt(a1, rr);
            S('path', { d: `M${x0.toFixed(2)},${y0.toFixed(2)} A${rr},${rr} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}`, class: cls, fill: 'none', 'stroke-width': thick }, svg);
        };
        S('path', { d: `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`, fill: 'none', class: 't69-gauge-track', 'stroke-width': thick }, svg);
        (opt.bands || []).forEach(b => arc(Math.max(b.from, opt.min), Math.min(b.to, opt.max), r, `t69-band t69-st-${b.status}`));
        const v = finite(opt.value) ? opt.value : opt.min;
        const [nx, ny] = pt(a(v), r - 4);
        S('line', { x1: cx, y1: cy, x2: nx.toFixed(2), y2: ny.toFixed(2), class: 't69-needle', 'stroke-width': 2.5, 'stroke-linecap': 'round' }, svg);
        S('circle', { cx, cy, r: 4, class: 't69-needle-hub' }, svg);
        T(svg, cx - r, cy + 13, fmtNum(opt.min, 0), { class: 't69-gauge-end', 'text-anchor': 'middle' });
        T(svg, cx + r, cy + 13, fmtNum(opt.max, 0) + (opt.maxPlus ? '+' : ''), { class: 't69-gauge-end', 'text-anchor': 'middle' });
        const body = document.createElement('div'); body.className = 't69-gauge-body';
        const val = document.createElement('div'); val.className = 't69-gauge-val'; val.textContent = (opt.valueText != null ? opt.valueText : fmtNum(opt.value, opt.decimals ?? 1) + (opt.unit || ''));
        const lab = document.createElement('div'); lab.className = 't69-gauge-label'; lab.textContent = opt.label;
        body.append(val, lab);
        if (opt.status) {
            const st = document.createElement('div'); st.className = `t69-gauge-st t69-st-text-${opt.status}`;
            st.textContent = `${STATUS[opt.status].icon} ${STATUS[opt.status].word}`;
            body.appendChild(st);
        }
        if (finite(opt.delta)) {
            const d = document.createElement('div'); d.className = 't69-gauge-delta';
            d.textContent = `${opt.delta > 0 ? '▲' : opt.delta < 0 ? '▼' : '–'} ${fmtNum(Math.abs(opt.delta), opt.decimals ?? 1)}${opt.deltaUnit ?? (opt.unit === '%' ? '%p' : opt.unit || '')}`;
            body.appendChild(d);
        }
        if (opt.spark && opt.spark.filter(finite).length > 1) {
            const sp = S('svg', { viewBox: '0 0 100 22', preserveAspectRatio: 'none', class: 't69-spark', 'aria-hidden': 'true' });
            const vals = opt.spark.filter(finite), [lo, hi] = extent([vals], 0.1);
            const pts = vals.map((x, i) => `${(i / (vals.length - 1) * 100).toFixed(1)},${(20 - (x - lo) / (hi - lo) * 18).toFixed(1)}`).join(' ');
            S('polyline', { points: pts, fill: 'none', class: 't69-spark-line', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, sp);
            body.appendChild(sp);
        }
        container.appendChild(body);
        if (opt.sub) { const s = document.createElement('div'); s.className = 't69-gauge-sub'; s.textContent = opt.sub; container.appendChild(s); }
        // onClick(event) — 키보드(Enter · Space)도 같은 이벤트를 넘겨 Shift를 함께 볼 수 있게
        if (opt.onClick) { container.tabIndex = 0; container.setAttribute('role', 'button'); container.onclick = opt.onClick; container.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opt.onClick(e); } }; }
        if (opt.title) container.title = opt.title;
    }

    // ================= 시계열 선 그래프 (한 칸) =================
    // opt: { x: [이름], series: [{ id, label, color, values, dash, width }], unit, height, log, zero, markers: [{ i, label, kind }],
    //        shade: [[i0, i1]], fan: [{ color, lo50, hi50, lo90, hi90, start }], range: [i0, i1], group, title, decimals, yMin, yMax, compact }
    const groups = new Map(); // 같은 십자선을 쓰는 그래프 묶음
    // x 위치 — opt.t(칸마다 시간, 오름차순)가 있으면 시간 길이대로(1개월 칸은 1년 칸의 1/12), 없으면 칸마다 같은 너비
    function xScale(opt, i0, i1, x0, w) {
        const t = opt.t && opt.t.length === opt.x.length ? opt.t : null;
        const pos = i => (t ? t[i] : i), a = pos(i0), span = pos(i1) - a;
        const X = i => x0 + (span <= 0 ? w / 2 : (pos(i) - a) / span * w);
        const idxAt = px => {
            if (span <= 0) return i0;
            const v = a + (px - x0) / w * span;
            let best = i0; for (let i = i0; i <= i1; i++) if (Math.abs(pos(i) - v) < Math.abs(pos(best) - v)) best = i;
            return best;
        };
        // 이웃 칸까지 평균 간격 (음영 · 막대 너비)
        const gap = i => { const a2 = Math.max(i - 1, i0), b2 = Math.min(i + 1, i1); return b2 > a2 ? (X(b2) - X(a2)) / (b2 - a2) : w; };
        return { X, idxAt, gap };
    }
    // x 이름 — 앞 이름과 minGap 이상 떨어질 때만 (오른쪽 끝에 걸려 잘리는 이름은 건너뜀)
    function xLabels(svg, opt, i0, i1, X, y, right, minGap = 64) {
        let last = -1e9;
        for (let i = i0; i <= i1; i++) {
            const xx = X(i);
            if (xx - last < minGap || (xx > right - 26 && i !== i0)) continue;
            T(svg, xx, y, String(opt.x[i] ?? ''), { class: 't69-tick', 'text-anchor': 'middle' }); last = xx;
        }
    }
    function lines(container, opt) {
        const draw = () => drawLines(container, opt);
        mount(container, draw);
    }
    function drawLines(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const W = widthOf(container), H = opt.height || 220;
        const n = opt.x.length;
        const i0 = opt.range ? clamp(opt.range[0], 0, n - 1) : 0, i1 = opt.range ? clamp(opt.range[1], i0, n - 1) : n - 1;
        const padL = 46, padR = 14, padT = opt.title ? 24 : 10, padB = opt.noX ? 6 : opt.compact ? 18 : 26;
        const pw = W - padL - padR, ph = H - padT - padB;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': opt.title || opt.series.map(s => s.label).join(', ') }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        if (opt.title) T(svg, padL, 15, opt.title, { class: 't69-title' });
        const readout = opt.title ? T(svg, W - padR, 15, '', { class: 't69-readout', 'text-anchor': 'end' }) : null;
        const slice = a => a.slice(i0, i1 + 1);
        const fanVals = (opt.fan || []).flatMap(f => [f.lo90 || [], f.hi90 || []].map(slice));
        let [lo, hi] = extent(opt.series.map(s => slice(s.values)).concat(fanVals), 0.08, !!opt.zero);
        if (finite(opt.yMin)) lo = Math.min(lo, opt.yMin);
        if (finite(opt.yMax)) hi = Math.max(hi, opt.yMax);
        const useLog = opt.log && lo > 0;
        const tf = v => (useLog ? Math.log10(Math.max(v, 1e-6)) : v);
        const tlo = tf(lo), thi = tf(hi);
        const xs = xScale(opt, i0, i1, padL, pw), X = xs.X;
        const Y = v => padT + ph - (tf(v) - tlo) / (thi - tlo) * ph;
        // 침체 음영
        (opt.shade || []).forEach(([a, b]) => {
            const s0 = Math.max(a, i0), s1 = Math.min(b, i1); if (s1 < s0) return;
            const l = Math.max(padL, X(s0) - xs.gap(s0) / 2), r = Math.min(padL + pw, X(s1) + xs.gap(s1) / 2);
            S('rect', { x: l, y: padT, width: Math.max(2, r - l), height: ph, class: 't69-shade' }, svg);
        });
        // 눈금 · 격자 (실선 가는 줄)
        const tv = useLog ? (() => { const out = []; for (let e = Math.floor(tlo); e <= Math.ceil(thi); e++) [1, 2, 5].forEach(m => { const v = m * Math.pow(10, e); if (v >= lo && v <= hi) out.push(v); }); return out; })() : ticks(lo, hi, opt.compact ? 3 : 5);
        tv.forEach(v => {
            S('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: Math.abs(v) < 1e-9 ? 't69-axis' : 't69-grid' }, svg);
            T(svg, padL - 6, Y(v) + 3.5, fmtNum(v, Math.abs(v) < 10 && v % 1 ? 1 : 0) + (opt.unit && opt.unit !== '%' ? '' : opt.unit || ''), { class: 't69-tick', 'text-anchor': 'end' });
        });
        S('line', { x1: padL, x2: W - padR, y1: padT + ph, y2: padT + ph, class: 't69-axis' }, svg);
        // x 눈금 — 겹치지 않을 만큼만
        if (!opt.noX) xLabels(svg, opt, i0, i1, X, H - (opt.compact ? 5 : 9), W - padR);
        // 예측 부채꼴 (90% 옅게, 50% 진하게)
        (opt.fan || []).forEach(f => {
            const band = (loA, hiA, cls) => {
                const idx = []; for (let i = Math.max(f.start, i0); i <= i1; i++) if (finite(loA[i]) && finite(hiA[i])) idx.push(i);
                if (idx.length < 2) return;
                const d = 'M' + idx.map(i => `${X(i).toFixed(1)},${Y(hiA[i]).toFixed(1)}`).join('L') + 'L' + idx.slice().reverse().map(i => `${X(i).toFixed(1)},${Y(loA[i]).toFixed(1)}`).join('L') + 'Z';
                S('path', { d, class: cls, fill: f.color }, svg);
            };
            band(f.lo90, f.hi90, 't69-fan90'); band(f.lo50, f.hi50, 't69-fan50');
        });
        // 사건 깃발 (세로선)
        (opt.markers || []).forEach(m => {
            if (m.i < i0 || m.i > i1) return;
            S('line', { x1: X(m.i), x2: X(m.i), y1: padT, y2: padT + ph, class: `t69-marker t69-marker-${m.kind || 'policy'}` }, svg);
            if (!opt.compact) { const f = S('path', { d: `M${X(m.i)},${padT} l7,3 l-7,3 z`, class: `t69-flag t69-marker-${m.kind || 'policy'}` }, svg); const tt = S('title', null, f); tt.textContent = m.label; }
        });
        // 선
        opt.series.forEach(s => {
            let d = '', pen = false;
            for (let i = i0; i <= i1; i++) {
                const v = s.values[i];
                if (!finite(v) || (useLog && v <= 0)) { pen = false; continue; }
                d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); pen = true;
            }
            if (d) S('path', { d, fill: 'none', stroke: s.color, 'stroke-width': s.width || 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': s.dash ? '4 4' : null, class: 't69-line' }, svg);
        });
        // 끝점 이름(선이 4개 이하일 때만, 겹치면 생략)
        if (!opt.compact && opt.series.length <= 4 && opt.series.length > 1) {
            const used = [];
            opt.series.filter(s => !s.dash).forEach(s => {
                let li = -1; for (let i = i1; i >= i0; i--) if (finite(s.values[i])) { li = i; break; }
                if (li < 0) return;
                const y = Y(s.values[li]);
                if (used.some(u => Math.abs(u - y) < 11)) return;
                used.push(y);
                T(svg, Math.min(X(li) + 5, W - padR), y - 5, s.label, { class: 't69-endlabel', 'text-anchor': X(li) > W - padR - 40 ? 'end' : 'start' });
            });
        }
        // 십자선
        const cross = S('line', { y1: padT, y2: padT + ph, class: 't69-cross', visibility: 'hidden' }, svg);
        const dots = opt.series.map(s => S('circle', { r: 4, fill: s.color, class: 't69-crossdot', visibility: 'hidden' }, svg));
        const hit = S('rect', { x: padL, y: padT, width: pw, height: ph, fill: 'transparent', class: 't69-hit', tabindex: 0 }, svg);
        const decimals = opt.decimals ?? 1;
        const setCross = (i, ev) => {
            if (i == null) { cross.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); if (readout) readout.textContent = ''; return; }
            cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
            opt.series.forEach((s, k) => {
                const v = s.values[i];
                if (finite(v) && !(useLog && v <= 0)) { dots[k].setAttribute('cx', X(i)); dots[k].setAttribute('cy', Y(v)); dots[k].setAttribute('visibility', 'visible'); } else dots[k].setAttribute('visibility', 'hidden');
            });
            if (readout) readout.textContent = `${opt.x[i] ?? ''} · ` + opt.series.filter(s => finite(s.values[i])).map(s => `${s.label} ${fmtNum(s.values[i], decimals)}${opt.unit || ''}`).join(' · ');
            if (ev) {
                const rows = opt.series.filter(s => finite(s.values[i])).map(s => ({ color: s.color, dash: s.dash, value: fmtNum(s.values[i], decimals) + (opt.unit || ''), label: s.label }));
                (opt.fan || []).forEach(f => { if (i >= f.start && finite(f.lo90?.[i])) rows.push({ value: `${fmtNum(f.lo90[i], decimals)} ~ ${fmtNum(f.hi90[i], decimals)}${opt.unit || ''}`, label: '예측 90% 범위' }); });
                (opt.markers || []).filter(m => m.i === i).forEach(m => rows.push({ value: '⚑', label: m.label }));
                showTip(ev.clientX, ev.clientY, String(opt.x[i] ?? ''), rows);
            }
        };
        const idxAt = ev => { const r = svg.getBoundingClientRect(); return xs.idxAt((ev.clientX - r.left) * (W / r.width)); };
        const members = opt.group ? (groups.get(opt.group) || groups.set(opt.group, new Set()).get(opt.group)) : null;
        const me = { setCross, alive: () => svg.isConnected };
        if (members) { [...members].forEach(m => { if (!m.alive()) members.delete(m); }); members.add(me); }
        const broadcast = (i, ev) => { if (members) members.forEach(m => m !== me && m.alive() && m.setCross(i)); setCross(i, ev); };
        let kbd = i1;
        hit.addEventListener('pointermove', ev => broadcast(idxAt(ev), ev));
        hit.addEventListener('pointerleave', () => { broadcast(null); hideTip(); });
        hit.addEventListener('keydown', ev => {
            if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
            ev.preventDefault(); kbd = clamp(kbd + (ev.key === 'ArrowLeft' ? -1 : 1), i0, i1);
            const r = svg.getBoundingClientRect(); broadcast(kbd, { clientX: r.left + X(kbd) * r.width / W, clientY: r.top + padT + 20 });
        });
        hit.addEventListener('blur', () => { broadcast(null); hideTip(); });
        svg.dataset.exportKind = 't69chart';
        return svg;
    }

    // ================= 연동 다중 패널 + 미니맵(기간 고르기) =================
    // opt: { x, panels: [{ title, unit, series, log, fan, zero, height, decimals }], markers, shade, range, onRange, overview: { series } }
    let groupSeq = 0;
    function panels(container, opt) {
        container.textContent = '';
        container.classList.add('t69-panels');
        const group = 'g' + (++groupSeq);
        const n = opt.x.length;
        const range = opt.range && opt.range[1] > opt.range[0] ? opt.range : [0, Math.max(0, n - 1)];
        opt.panels.forEach((p, k) => {
            const div = document.createElement('div'); div.className = 't69-panel';
            container.appendChild(div);
            const last = k === opt.panels.length - 1;
            lines(div, { x: opt.x, t: opt.t, series: p.series, unit: p.unit, title: p.title, height: (p.height || 150) - (last ? 0 : 12), log: p.log, zero: p.zero, fan: p.fan, decimals: p.decimals, markers: opt.markers, shade: opt.shade, range, group, compact: true, noX: !last });
        });
        if (n > 4 && opt.overview) {
            const mini = document.createElement('div'); mini.className = 't69-mini';
            container.appendChild(mini);
            mount(mini, () => drawMini(mini, opt, range));
        }
    }
    function drawMini(container, opt, range) {
        container.textContent = '';
        const W = widthOf(container), H = 46, padL = 46, padR = 14, pw = W - padL - padR, n = opt.x.length;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg t69-mini-svg', role: 'img', 'aria-label': '기간 고르기 — 끌어서 확대할 기간을 고르세요' }, container);
        const s = opt.overview.series;
        const [lo, hi] = extent([s.values], 0.1);
        const xs = xScale(opt, 0, n - 1, padL, pw), X = xs.X, Y = v => 6 + (H - 18) - (v - lo) / (hi - lo) * (H - 18);
        let d = ''; s.values.forEach((v, i) => { if (finite(v)) d += (d ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); });
        S('path', { d, fill: 'none', stroke: s.color, 'stroke-width': 1.5, opacity: 0.7 }, svg);
        T(svg, 4, H / 2 + 3, '기간', { class: 't69-tick' });
        const win = S('rect', { y: 2, height: H - 10, class: 't69-brush' }, svg);
        const place = (a, b) => { win.setAttribute('x', X(a)); win.setAttribute('width', Math.max(4, X(b) - X(a))); };
        place(range[0], range[1]);
        const idx = ev => { const r = svg.getBoundingClientRect(); return xs.idxAt((ev.clientX - r.left) * (W / r.width)); };
        let start = null, moveFrom = null, cur = range.slice();
        svg.addEventListener('pointerdown', ev => {
            svg.setPointerCapture(ev.pointerId);
            const i = idx(ev);
            if (i >= cur[0] && i <= cur[1] && cur[1] - cur[0] < n - 1) moveFrom = { i, a: cur[0], b: cur[1] }; else start = i;
        });
        svg.addEventListener('pointermove', ev => {
            if (start == null && !moveFrom) return;
            const i = idx(ev);
            if (moveFrom) { const len = moveFrom.b - moveFrom.a; let a = clamp(moveFrom.a + i - moveFrom.i, 0, n - 1 - len); cur = [a, a + len]; }
            else cur = [Math.min(start, i), Math.max(start, i)];
            place(cur[0], cur[1]);
        });
        const end = () => {
            if (start == null && !moveFrom) return;
            start = null; moveFrom = null;
            if (cur[1] - cur[0] < 2) cur = [0, n - 1];
            if (opt.onRange) opt.onRange(cur[0], cur[1]);
        };
        svg.addEventListener('pointerup', end);
        svg.addEventListener('dblclick', () => { cur = [0, n - 1]; place(0, n - 1); if (opt.onRange) opt.onRange(0, n - 1); });
    }

    // ================= 쌓인 막대 (기여도 분해 · 예산 구성 변화) — 양수는 위로, 음수는 아래로 =================
    // opt: { x, parts: [{ id, label, color, values }], net: { label, values }, unit, height, range, title, decimals }
    function stackBars(container, opt) { mount(container, () => drawStack(container, opt)); }
    function drawStack(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const W = widthOf(container), H = opt.height || 220, n = opt.x.length;
        const i0 = opt.range ? opt.range[0] : 0, i1 = opt.range ? opt.range[1] : n - 1;
        const padL = 46, padR = 14, padT = opt.title ? 24 : 10, padB = 26, pw = W - padL - padR, ph = H - padT - padB;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': opt.title || '쌓인 막대' }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        if (opt.title) T(svg, padL, 15, opt.title, { class: 't69-title' });
        let lo = 0, hi = 0;
        for (let i = i0; i <= i1; i++) {
            let p = 0, m = 0; opt.parts.forEach(pt => { const v = pt.values[i] || 0; if (v > 0) p += v; else m += v; });
            hi = Math.max(hi, p, opt.net ? opt.net.values[i] || 0 : 0); lo = Math.min(lo, m, opt.net ? opt.net.values[i] || 0 : 0);
        }
        if (hi - lo < 1e-9) hi = lo + 1;
        const pad = (hi - lo) * 0.08; hi += pad; lo -= lo < 0 ? pad : 0;
        const count = i1 - i0 + 1, slot0 = pw / count;
        const xs = xScale(opt, i0, i1, padL + slot0 / 2, pw - slot0), X = xs.X, Y = v => padT + ph - (v - lo) / (hi - lo) * ph;
        const slotAt = i => (count === 1 ? pw : xs.gap(i)), bwAt = i => Math.max(1.5, Math.min(28, slotAt(i) - 2));
        ticks(lo, hi, 5).forEach(v => { S('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: Math.abs(v) < 1e-9 ? 't69-axis' : 't69-grid' }, svg); T(svg, padL - 6, Y(v) + 3.5, fmtNum(v, Math.abs(v) < 10 && v % 1 ? 1 : 0), { class: 't69-tick', 'text-anchor': 'end' }); });
        xLabels(svg, opt, i0, i1, X, H - 9, W - padR);
        const dec = opt.decimals ?? 2;
        for (let i = i0; i <= i1; i++) {
            let up = 0, down = 0;
            const bw = bwAt(i), slot = slotAt(i);
            const g = S('g', { class: 't69-barcol' }, svg);
            opt.parts.forEach(pt => {
                const v = pt.values[i] || 0; if (Math.abs(v) < 1e-9) return;
                const a = v > 0 ? up : down, b = a + v;
                if (v > 0) up = b; else down = b;
                const y = Math.min(Y(a), Y(b)), h = Math.abs(Y(a) - Y(b));
                S('rect', { x: X(i) - bw / 2, y: y + 1, width: bw, height: Math.max(0.5, h - 2), fill: pt.color, rx: Math.min(2, bw / 4) }, g);
            });
            const hitR = S('rect', { x: X(i) - slot / 2, y: padT, width: slot, height: ph, fill: 'transparent', tabindex: 0 }, g);
            const show = ev => {
                const rows = opt.parts.filter(pt => Math.abs(pt.values[i] || 0) > 1e-9).map(pt => ({ color: pt.color, value: (pt.values[i] > 0 ? '+' : '') + fmtNum(pt.values[i], dec) + (opt.unit || ''), label: pt.label }));
                if (opt.net) rows.unshift({ value: fmtNum(opt.net.values[i], dec) + (opt.unit || ''), label: opt.net.label });
                showTip(ev.clientX, ev.clientY, String(opt.x[i] ?? ''), rows);
                g.classList.add('hover');
            };
            hitR.addEventListener('pointermove', show);
            hitR.addEventListener('focus', () => { const r = hitR.getBoundingClientRect(); show({ clientX: r.right, clientY: r.top + 20 }); });
            hitR.addEventListener('pointerleave', () => { hideTip(); g.classList.remove('hover'); });
            hitR.addEventListener('blur', () => { hideTip(); g.classList.remove('hover'); });
        }
        if (opt.net) {
            let d = ''; for (let i = i0; i <= i1; i++) { const v = opt.net.values[i]; if (finite(v)) d += (d ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(v).toFixed(1); }
            S('path', { d, fill: 'none', class: 't69-netline', 'stroke-width': 2 }, svg);
            for (let i = i0; i <= i1; i++) if (finite(opt.net.values[i])) S('circle', { cx: X(i), cy: Y(opt.net.values[i]), r: 3, class: 't69-netdot' }, svg);
        }
        svg.dataset.exportKind = 't69chart';
        legend(container, opt.parts.map(p => ({ label: p.label, color: p.color })).concat(opt.net ? [{ label: opt.net.label, line: true }] : []));
    }
    function legend(container, items) {
        const lg = document.createElement('div'); lg.className = 't69-legend';
        items.forEach(it => {
            const s = document.createElement('span');
            const k = document.createElement('i'); k.className = it.line ? 'line' : ''; if (it.color) k.style.background = it.color;
            s.appendChild(k); s.appendChild(document.createTextNode(it.label)); lg.appendChild(s);
        });
        container.appendChild(lg);
    }

    // ================= 예산 반원 — 위 세출 · 아래 세입(뒤집음), 두께 = 세출 · 세입 차이 =================
    // opt: { spend: [{ label, value, color }], rev: [...], unit, center }
    function budgetHemi(container, opt) { mount(container, () => drawHemi(container, opt)); }
    function drawHemi(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        container.classList.add('t69-hemi');
        const W = Math.min(widthOf(container), 400), H = Math.round(W * 0.82);
        const cx = W / 2, cy = H / 2, sum = a => a.reduce((t, x) => t + Math.max(0, x.value), 0);
        const ts = sum(opt.spend), tr = sum(opt.rev), big = Math.max(ts, tr) || 1;
        // 안쪽 구멍은 위아래 같게 두고, 지금 두께를 100%로 — 세출 · 세입이 차이 나는 만큼 많은 쪽은 두껍게 · 적은 쪽은 얇게
        // (최대 110% · 90%, 차이가 예산의 4%면 끝까지). 적자 · 흑자가 작아도 한눈에 보이게 2.5배로 키운다
        const Rmax = Math.min(W / 2 - 8, H / 2 - 18), inner = 0.42, MAXD = 0.1;
        const R = Rmax / (inner + (1 - inner) * (1 + MAXD)), ri0 = R * inner, th = R - ri0;
        const d = Math.max(-MAXD, Math.min(MAXD, (ts - tr) / big * 2.5));
        const outS = ri0 + th * (1 + d), outR = ri0 + th * (1 - d);
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': `세출 ${fmtNum(ts)} · 세입 ${fmtNum(tr)}` }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        const half = (items, total, up) => {
            const ro2 = up ? outS : outR, ri = ri0; let acc = 0;
            items.forEach(it => {
                if (!(it.value > 0)) return;
                const a0 = Math.PI * (acc / total), a1 = Math.PI * ((acc + it.value) / total); acc += it.value;
                const p = (ang, r) => { const x = cx - r * Math.cos(ang), y = up ? cy - r * Math.sin(ang) : cy + r * Math.sin(ang); return `${x.toFixed(2)},${y.toFixed(2)}`; };
                const large = a1 - a0 > Math.PI ? 1 : 0, sw = up ? 1 : 0;
                const d = `M${p(a0, ri)}L${p(a0, ro2)}A${ro2},${ro2} 0 ${large} ${sw} ${p(a1, ro2)}L${p(a1, ri)}A${ri},${ri} 0 ${large} ${1 - sw} ${p(a0, ri)}Z`;
                const seg = S('path', { d, fill: it.color, class: 't69-seg' }, svg);
                seg.setAttribute('tabindex', '0');
                // 넉넉한 조각에는 이름을 바로 적는다 (색만으로 구별하지 않게)
                if ((a1 - a0) * (ri + ro2) / 2 > 46 && ro2 - ri > 24) {
                    const am = (a0 + a1) / 2, rm = (ri + ro2) / 2;
                    const lx = cx - rm * Math.cos(am), ly = (up ? cy - rm * Math.sin(am) : cy + rm * Math.sin(am)) + 4;
                    T(svg, lx, ly, it.label.length > 7 ? it.label.slice(0, 6) + '…' : it.label, { class: 't69-seglabel', 'text-anchor': 'middle' });
                }
                const show = ev => showTip(ev.clientX, ev.clientY, up ? '세출' : '세입', [{ color: it.color, value: `${fmtNum(it.value)}${opt.unit || ''} (${(it.value / total * 100).toFixed(1)}%)`, label: it.label }]);
                seg.addEventListener('pointermove', show);
                seg.addEventListener('focus', () => { const r = seg.getBoundingClientRect(); show({ clientX: r.right, clientY: r.top }); });
                seg.addEventListener('pointerleave', hideTip); seg.addEventListener('blur', hideTip);
            });
        };
        half(opt.spend, ts, true); half(opt.rev, tr, false);
        S('line', { x1: 6, x2: W - 6, y1: cy, y2: cy, class: 't69-axis' }, svg);
        T(svg, cx, cy - outS - 6, `세출 ${fmtNum(ts)}${opt.unit || ''}`, { class: 't69-title', 'text-anchor': 'middle' });
        T(svg, cx, cy + outR + 15, `세입 ${fmtNum(tr)}${opt.unit || ''}`, { class: 't69-title', 'text-anchor': 'middle' });
        if (opt.center) { T(svg, cx, cy - 6, opt.center[0], { class: 't69-hero-sm', 'text-anchor': 'middle' }); T(svg, cx, cy + 14, opt.center[1], { class: 't69-tick', 'text-anchor': 'middle' }); }
        svg.dataset.exportKind = 't69chart';
        twoLegends(container, opt);
    }
    function twoLegends(container, opt) {
        const wrap = document.createElement('div'); wrap.className = 't69-legend2';
        [['세출', opt.spend], ['세입', opt.rev]].forEach(([title, items]) => {
            const col = document.createElement('div');
            const h = document.createElement('div'); h.className = 't69-legend2-h'; h.textContent = title; col.appendChild(h);
            items.filter(it => it.value > 0).forEach(it => {
                const r = document.createElement('div'); r.className = 't69-legend2-r';
                const k = document.createElement('i'); k.style.background = it.color;
                const l = document.createElement('span'); l.textContent = it.label;
                const v = document.createElement('b'); v.textContent = fmtNum(it.value) + (opt.unit || '');
                r.append(k, l, v); col.appendChild(r);
            });
            wrap.appendChild(col);
        });
        container.appendChild(wrap);
    }
    // ================= 가로 막대 두 줄 — 같은 축의 세출 · 세입 =================
    function budgetBars(container, opt) { mount(container, () => drawBars2(container, opt)); }
    function drawBars2(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const W = widthOf(container), H = 118, padL = 44, padR = 70, bh = 26;
        const sum = a => a.reduce((t, x) => t + Math.max(0, x.value), 0), ts = sum(opt.spend), tr = sum(opt.rev), big = Math.max(ts, tr) || 1;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': `세출 ${fmtNum(ts)} · 세입 ${fmtNum(tr)}` }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        const pw = W - padL - padR, X = v => padL + v / big * pw;
        const row = (items, total, y, title) => {
            T(svg, padL - 6, y + bh / 2 + 4, title, { class: 't69-tick', 'text-anchor': 'end' });
            let acc = 0;
            items.forEach(it => {
                if (!(it.value > 0)) return;
                const x0 = X(acc), x1 = X(acc + it.value); acc += it.value;
                const r = S('rect', { x: x0 + 1, y, width: Math.max(0.5, x1 - x0 - 2), height: bh, fill: it.color, rx: 2, class: 't69-seg', tabindex: 0 }, svg);
                if (x1 - x0 > 52) T(svg, (x0 + x1) / 2, y + bh / 2 + 4, it.label.length > 7 ? it.label.slice(0, 6) + '…' : it.label, { class: 't69-seglabel', 'text-anchor': 'middle' });
                const show = ev => showTip(ev.clientX, ev.clientY, title, [{ color: it.color, value: `${fmtNum(it.value)}${opt.unit || ''} (${(it.value / total * 100).toFixed(1)}%)`, label: it.label }]);
                r.addEventListener('pointermove', show); r.addEventListener('pointerleave', hideTip);
                r.addEventListener('focus', () => { const b = r.getBoundingClientRect(); show({ clientX: b.right, clientY: b.top }); }); r.addEventListener('blur', hideTip);
            });
            T(svg, X(total) + 6, y + bh / 2 + 4, fmtNum(total) + (opt.unit || ''), { class: 't69-tick' });
        };
        row(opt.spend, ts, 14, '세출'); row(opt.rev, tr, 14 + bh + 12, '세입');
        const gapY = 14 + 2 * bh + 26;
        if (Math.abs(ts - tr) > 1e-9) {
            const a = X(Math.min(ts, tr)), b = X(Math.max(ts, tr));
            S('line', { x1: a, x2: b, y1: gapY - 8, y2: gapY - 8, class: ts > tr ? 't69-deficit' : 't69-surplus', 'stroke-width': 2 }, svg);
            T(svg, (a + b) / 2, gapY + 6, `${ts > tr ? '적자' : '흑자'} ${fmtNum(Math.abs(ts - tr))}${opt.unit || ''}`, { class: 't69-tick', 'text-anchor': 'middle' });
        }
        svg.dataset.exportKind = 't69chart';
        twoLegends(container, opt);
    }

    // ================= 생키 (예산 흐름도) =================
    // opt: { cols: [[{ id, label, value, color }]], links: [{ from, to, value, color }], unit }
    function sankey(container, opt) { mount(container, () => drawSankey(container, opt)); }
    function drawSankey(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const W = widthOf(container), nCol = opt.cols.length;
        const maxNodes = Math.max(...opt.cols.map(c => c.length));
        const H = Math.max(240, Math.min(560, 40 + maxNodes * 30));
        const padT = 14, padB = 14, nodeW = 12, gap = 6, labelW = Math.min(150, W * 0.2);
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': '예산 흐름도' }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        const colX = c => labelW + (nCol <= 1 ? 0 : c / (nCol - 1) * (W - 2 * labelW - nodeW));
        const totals = opt.cols.map(col => col.reduce((t, n) => t + Math.max(0, n.value), 0));
        const scale = Math.min(...opt.cols.map((col, c) => (H - padT - padB - gap * Math.max(0, col.length - 1)) / (totals[c] || 1)));
        const pos = {};
        opt.cols.forEach((col, c) => {
            let y = padT + ((H - padT - padB) - (totals[c] * scale + gap * Math.max(0, col.length - 1))) / 2;
            col.forEach(nd => {
                const h = Math.max(1, nd.value * scale);
                pos[nd.id] = { x: colX(c), y, h, out: 0, in: 0, c, nd };
                y += h + gap;
            });
        });
        const linkEls = [];
        opt.links.forEach(l => {
            const a = pos[l.from], b = pos[l.to]; if (!a || !b || !(l.value > 0)) return;
            const h = l.value * scale;
            const y0 = a.y + a.out + h / 2, y1 = b.y + b.in + h / 2; a.out += h; b.in += h;
            const x0 = a.x + nodeW, x1 = b.x, mx = (x0 + x1) / 2;
            const p = S('path', { d: `M${x0},${y0}C${mx},${y0} ${mx},${y1} ${x1},${y1}`, fill: 'none', stroke: l.color || 'var(--t69-muted)', 'stroke-width': Math.max(1, h), class: 't69-link', tabindex: 0 }, svg);
            p.dataset.from = l.from; p.dataset.to = l.to;
            const show = ev => showTip(ev.clientX, ev.clientY, `${a.nd.label} → ${b.nd.label}`, [{ color: l.color, value: fmtNum(l.value) + (opt.unit || ''), label: '' }]);
            p.addEventListener('pointermove', ev => { show(ev); p.classList.add('hover'); });
            p.addEventListener('pointerleave', () => { hideTip(); p.classList.remove('hover'); });
            linkEls.push(p);
        });
        Object.values(pos).forEach(p => {
            const r = S('rect', { x: p.x, y: p.y, width: nodeW, height: p.h, fill: p.nd.color || 'var(--t69-ink2)', rx: 2, class: 't69-node', tabindex: 0 }, svg);
            const left = p.c === 0, right = p.c === nCol - 1;
            const tx = left ? p.x - 6 : p.x + nodeW + 6;
            if (p.h >= 9 || left || right) T(svg, tx, p.y + p.h / 2 + 4, `${p.nd.label} ${fmtNum(p.nd.value)}`, { class: 't69-tick', 'text-anchor': left ? 'end' : 'start' });
            const focusOn = on => linkEls.forEach(l => l.classList.toggle('dim', on && l.dataset.from !== p.nd.id && l.dataset.to !== p.nd.id));
            r.addEventListener('pointerenter', ev => { focusOn(true); showTip(ev.clientX, ev.clientY, p.nd.label, [{ color: p.nd.color, value: fmtNum(p.nd.value) + (opt.unit || ''), label: '' }]); });
            r.addEventListener('pointerleave', () => { focusOn(false); hideTip(); });
        });
        svg.dataset.exportKind = 't69chart';
    }

    // ================= 산점도 (지역구) — 가로 · 세로 · 크기 · 색 =================
    // opt: { points: [{ id, x, y, size, color, label, extra }], xLabel, yLabel, xUnit, yUnit, onHover(id|null), highlight, legendItems }
    function scatter(container, opt) { mount(container, () => drawScatter(container, opt)); }
    function drawScatter(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const W = widthOf(container), H = opt.height || 300, padL = 52, padR = 16, padT = 12, padB = 40, pw = W - padL - padR, ph = H - padT - padB;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': `${opt.yLabel} × ${opt.xLabel}` }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        const pts = opt.points.filter(p => finite(p.x) && finite(p.y));
        const [x0, x1] = extent([pts.map(p => p.x)]), [y0, y1] = extent([pts.map(p => p.y)]);
        const X = v => padL + (v - x0) / (x1 - x0) * pw, Y = v => padT + ph - (v - y0) / (y1 - y0) * ph;
        ticks(y0, y1, 5).forEach(v => { S('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: 't69-grid' }, svg); T(svg, padL - 6, Y(v) + 3.5, fmtNum(v, v % 1 ? 1 : 0), { class: 't69-tick', 'text-anchor': 'end' }); });
        ticks(x0, x1, Math.max(3, Math.floor(pw / 80))).forEach(v => { S('line', { x1: X(v), x2: X(v), y1: padT, y2: padT + ph, class: 't69-grid' }, svg); T(svg, X(v), padT + ph + 14, fmtNum(v, v % 1 ? 1 : 0), { class: 't69-tick', 'text-anchor': 'middle' }); });
        S('line', { x1: padL, x2: W - padR, y1: padT + ph, y2: padT + ph, class: 't69-axis' }, svg);
        T(svg, padL + pw / 2, H - 6, `${opt.xLabel}${opt.xUnit ? ` (${opt.xUnit})` : ''}`, { class: 't69-axislabel', 'text-anchor': 'middle' });
        T(svg, 12, padT + ph / 2, `${opt.yLabel}${opt.yUnit ? ` (${opt.yUnit})` : ''}`, { class: 't69-axislabel', 'text-anchor': 'middle', transform: `rotate(-90 12 ${padT + ph / 2})` });
        const maxSize = Math.max(...pts.map(p => p.size || 1), 1);
        const rOf = s => 4 + Math.sqrt((s || 1) / maxSize) * 14;
        const sorted = pts.slice().sort((a, b) => (b.size || 0) - (a.size || 0));
        const els = new Map();
        sorted.forEach(p => { const c = S('circle', { cx: X(p.x), cy: Y(p.y), r: rOf(p.size), fill: p.color, class: 't69-dot' + (opt.highlight === p.id ? ' hl' : '') }, svg); els.set(p.id, c); });
        // 가장 가까운 점 고르기 (점을 정확히 맞히지 않아도 됨)
        const hit = S('rect', { x: padL, y: padT, width: pw, height: ph, fill: 'transparent', tabindex: 0 }, svg);
        let last = null;
        const near = ev => {
            const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * W / r.width, my = (ev.clientY - r.top) * H / r.height;
            let best = null, bd = 34 * 34;
            pts.forEach(p => { const d = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2 - rOf(p.size) ** 2; if (d < bd) { bd = d; best = p; } });
            return best;
        };
        hit.addEventListener('pointermove', ev => {
            const p = near(ev);
            if (last && last !== p) els.get(last.id)?.classList.remove('hover');
            if (!p) { hideTip(); if (last) opt.onHover?.(null); last = null; return; }
            els.get(p.id)?.classList.add('hover');
            if (last !== p) opt.onHover?.(p.id);
            last = p;
            showTip(ev.clientX, ev.clientY, p.label, [{ value: fmtNum(p.x) + (opt.xUnit || ''), label: opt.xLabel }, { value: fmtNum(p.y) + (opt.yUnit || ''), label: opt.yLabel }].concat(p.extra || []));
        });
        hit.addEventListener('pointerleave', () => { hideTip(); if (last) { els.get(last.id)?.classList.remove('hover'); opt.onHover?.(null); } last = null; });
        hit.addEventListener('click', ev => { const p = near(ev); if (p && opt.onClick) opt.onClick(p.id); });
        svg.dataset.exportKind = 't69chart';
        if (opt.legendItems) legend(container, opt.legendItems);
    }

    // ================= 토네이도 (정책 민감도) =================
    // opt: { rows: [{ label, value, sub }], unit, title, decimals }
    function tornado(container, opt) { mount(container, () => drawTornado(container, opt)); }
    function drawTornado(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const rows = opt.rows.slice().sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
        const W = widthOf(container), rh = 24, padT = opt.title ? 26 : 8, H = padT + rows.length * rh + 22, labelW = Math.min(170, W * 0.36), padR = 54;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': opt.title || '정책 민감도' }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        if (opt.title) T(svg, 8, 16, opt.title, { class: 't69-title' });
        const m = Math.max(...rows.map(r => Math.abs(r.value)), 1e-6) * 1.05;
        const pw = W - labelW - padR, cx = labelW + pw / 2, X = v => cx + v / m * (pw / 2);
        S('line', { x1: cx, x2: cx, y1: padT - 4, y2: padT + rows.length * rh, class: 't69-axis' }, svg);
        const dec = opt.decimals ?? 2;
        rows.forEach((r, k) => {
            const y = padT + k * rh;
            T(svg, labelW - 8, y + rh / 2 + 4, r.label, { class: 't69-tick', 'text-anchor': 'end' });
            const a = Math.min(X(0), X(r.value)), b = Math.max(X(0), X(r.value));
            const rect = S('rect', { x: a, y: y + 4, width: Math.max(1, b - a), height: rh - 8, rx: 2, class: r.value >= 0 ? 't69-pos' : 't69-neg', tabindex: 0 }, svg);
            T(svg, r.value >= 0 ? b + 4 : a - 4, y + rh / 2 + 4, (r.value > 0 ? '+' : '') + fmtNum(r.value, dec) + (opt.unit || ''), { class: 't69-tick', 'text-anchor': r.value >= 0 ? 'start' : 'end' });
            const show = ev => showTip(ev.clientX, ev.clientY, r.label, [{ value: (r.value > 0 ? '+' : '') + fmtNum(r.value, dec) + (opt.unit || ''), label: r.sub || '' }]);
            rect.addEventListener('pointermove', show); rect.addEventListener('pointerleave', hideTip);
        });
        T(svg, cx, H - 6, '← 낮춤 · 높임 →', { class: 't69-axislabel', 'text-anchor': 'middle' });
        svg.dataset.exportKind = 't69chart';
    }

    // ================= 경제 궤적 (실업 × 인플레이션) =================
    // opt: { points: [{ x, y, label }], xLabel, yLabel, unit, range }
    function trajectory(container, opt) { mount(container, () => drawTraj(container, opt)); }
    function drawTraj(container, opt) {
        container.textContent = '';
        container.classList.add('t69-chart');
        const all = opt.points, i0 = opt.range ? opt.range[0] : 0, i1 = opt.range ? opt.range[1] : all.length - 1;
        const pts = all.slice(i0, i1 + 1).filter(p => finite(p.x) && finite(p.y));
        const W = widthOf(container), H = opt.height || 300, padL = 48, padR = 16, padT = 12, padB = 38, pw = W - padL - padR, ph = H - padT - padB;
        const svg = S('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, class: 't69-svg', role: 'img', 'aria-label': '경제 궤적 — 실업률과 인플레이션' }, container);
        S('rect', { x: 0, y: 0, width: W, height: H, class: 't69-surface' }, svg);
        const [x0, x1] = extent([pts.map(p => p.x)], 0.15, true), [y0, y1] = extent([pts.map(p => p.y)], 0.15, true);
        const X = v => padL + (v - x0) / (x1 - x0) * pw, Y = v => padT + ph - (v - y0) / (y1 - y0) * ph;
        ticks(y0, y1, 5).forEach(v => { S('line', { x1: padL, x2: W - padR, y1: Y(v), y2: Y(v), class: Math.abs(v) < 1e-9 ? 't69-axis' : 't69-grid' }, svg); T(svg, padL - 6, Y(v) + 3.5, fmtNum(v, v % 1 ? 1 : 0) + '%', { class: 't69-tick', 'text-anchor': 'end' }); });
        ticks(x0, x1, 5).forEach(v => { S('line', { x1: X(v), x2: X(v), y1: padT, y2: padT + ph, class: 't69-grid' }, svg); T(svg, X(v), padT + ph + 14, fmtNum(v, v % 1 ? 1 : 0) + '%', { class: 't69-tick', 'text-anchor': 'middle' }); });
        // 사분면 이름 (기준: 실업 6% · 인플레이션 4%)
        const qx = X(clamp(6, x0, x1)), qy = Y(clamp(4, y0, y1));
        S('line', { x1: qx, x2: qx, y1: padT, y2: padT + ph, class: 't69-quad' }, svg); S('line', { x1: padL, x2: W - padR, y1: qy, y2: qy, class: 't69-quad' }, svg);
        T(svg, W - padR - 4, padT + 12, '스태그플레이션', { class: 't69-quadlabel', 'text-anchor': 'end' });
        T(svg, padL + 4, padT + 12, '과열', { class: 't69-quadlabel' });
        T(svg, W - padR - 4, padT + ph - 6, '불황', { class: 't69-quadlabel', 'text-anchor': 'end' });
        T(svg, padL + 4, padT + ph - 6, '안정', { class: 't69-quadlabel' });
        T(svg, padL + pw / 2, H - 6, opt.xLabel, { class: 't69-axislabel', 'text-anchor': 'middle' });
        T(svg, 12, padT + ph / 2, opt.yLabel, { class: 't69-axislabel', 'text-anchor': 'middle', transform: `rotate(-90 12 ${padT + ph / 2})` });
        if (pts.length > 1) S('path', { d: 'M' + pts.map(p => `${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('L'), fill: 'none', class: 't69-trail', 'stroke-width': 1.5 }, svg);
        pts.forEach((p, k) => S('circle', { cx: X(p.x), cy: Y(p.y), r: k === pts.length - 1 ? 6 : 3, class: k === pts.length - 1 ? 't69-trail-now' : 't69-trail-dot', style: `opacity:${(0.35 + 0.65 * (k + 1) / pts.length).toFixed(2)}` }, svg));
        if (pts.length) { const last = pts[pts.length - 1]; T(svg, X(last.x) + 9, Y(last.y) - 8, `지금 (${last.label})`, { class: 't69-endlabel' }); }
        const hit = S('rect', { x: padL, y: padT, width: pw, height: ph, fill: 'transparent' }, svg);
        hit.addEventListener('pointermove', ev => {
            const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * W / r.width, my = (ev.clientY - r.top) * H / r.height;
            let best = null, bd = 30 * 30; pts.forEach(p => { const d = (X(p.x) - mx) ** 2 + (Y(p.y) - my) ** 2; if (d < bd) { bd = d; best = p; } });
            if (!best) { hideTip(); return; }
            showTip(ev.clientX, ev.clientY, best.label, [{ value: fmtNum(best.x) + '%', label: opt.xLabel }, { value: fmtNum(best.y) + '%', label: opt.yLabel }]);
        });
        hit.addEventListener('pointerleave', hideTip);
        svg.dataset.exportKind = 't69chart';
    }

    // ================= 표 + CSV =================
    // opt: { cols: [{ key, label, fmt }], rows: [{}], filename }
    function table(container, opt) {
        container.textContent = '';
        const wrap = document.createElement('div'); wrap.className = 't69-tablewrap';
        const t = document.createElement('table'); t.className = 't69-table';
        const thead = document.createElement('thead'), tr = document.createElement('tr');
        opt.cols.forEach(c => { const th = document.createElement('th'); th.textContent = c.label; th.scope = 'col'; tr.appendChild(th); });
        thead.appendChild(tr); t.appendChild(thead);
        const tb = document.createElement('tbody');
        opt.rows.forEach(r => {
            const row = document.createElement('tr');
            opt.cols.forEach(c => { const td = document.createElement('td'); const v = r[c.key]; td.textContent = c.fmt ? c.fmt(v, r) : (v == null ? '' : String(v)); row.appendChild(td); });
            tb.appendChild(row);
        });
        t.appendChild(tb); wrap.appendChild(t); container.appendChild(wrap);
    }
    function csv(opt) {
        const q = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
        const lines2 = [opt.cols.map(c => q(c.label)).join(',')].concat(opt.rows.map(r => opt.cols.map(c => q(c.raw ? c.raw(r[c.key], r) : r[c.key])).join(',')));
        const blob = new Blob(['﻿' + lines2.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = opt.filename || 'economy.csv';
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }

    // ================= 내보내기 — CSS 변수 · 클래스 색을 실제 값으로 담은 SVG 문자열 =================
    function exportSvgString(svg) {
        const clone = svg.cloneNode(true);
        const src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
        const drop = [];
        src.forEach((el, k) => {
            const cs = getComputedStyle(el), d = dst[k];
            ['fill', 'stroke', 'opacity', 'stroke-width', 'stroke-dasharray', 'font-size', 'font-family', 'font-weight'].forEach(p => {
                const v = cs.getPropertyValue(p);
                if (v && v !== 'normal' && !(p === 'stroke-dasharray' && v === 'none')) d.setAttribute(p, v);
            });
            // 십자선 · 마우스 받는 투명 칸은 그림에 담지 않는다
            if (el.classList && (el.classList.contains('t69-cross') || el.classList.contains('t69-crossdot') || el.classList.contains('t69-hit') || el.getAttribute('fill') === 'transparent')) drop.push(d);
            d.removeAttribute('class'); d.removeAttribute('tabindex');
        });
        drop.forEach(d => d.remove());
        clone.setAttribute('xmlns', NS);
        return new XMLSerializer().serializeToString(clone);
    }

    window.T69C = { gauge, lines, panels, stackBars, budgetHemi, budgetBars, sankey, scatter, tornado, trajectory, table, csv, legend, exportSvgString, showTip, hideTip, STATUS, fmtNum, ticks };

    // ================= 색 · 모양 (라이트 · 다크 각각 고른 색 — 다크는 네온 테마에도 씀) =================
    const style = document.createElement('style');
    style.textContent = `
        .t69-viz, .t69-tip {
            --t69-surface: #1a1a19; --t69-ink: #f0efec; --t69-ink2: #c3c2b7; --t69-muted: #898781; --t69-grid: #2c2c2a; --t69-axis: #4a4a46;
            --s1: #3987e5; --s2: #d95926; --s3: #199e70; --s4: #c98500; --s5: #d55181; --s6: #008300; --s7: #9085e9; --s8: #e66767;
            --good: #0ca30c; --warning: #fab219; --serious: #ec835a; --critical: #d03b3b;
            --pos: #3987e5; --neg: #e66767; --t69-shade: rgba(255,255,255,.05); --t69-hover: rgba(255,255,255,.06);
            /* 세입 — 보라 한 가지 색의 진하기 (세출의 여러 색과 겹치지 않게, 큰 세목일수록 진하게) */
            --rv1: #b3abf3; --rv2: #9085e9; --rv3: #7466d9; --rv4: #5a4bbd; --rv5: #46399c; --rv6: #362b7c;
        }
        html[data-theme-mode="light"] .t69-viz, html[data-theme-mode="light"] .t69-tip {
            --t69-surface: #fcfcfb; --t69-ink: #0b0b0b; --t69-ink2: #52514e; --t69-muted: #898781; --t69-grid: #e1e0d9; --t69-axis: #c3c2b7;
            --s1: #2a78d6; --s2: #eb6834; --s3: #1baf7a; --s4: #eda100; --s5: #e87ba4; --s6: #008300; --s7: #6250d6; --s8: #e34948;
            --pos: #2a78d6; --neg: #e34948; --t69-shade: rgba(0,0,0,.05); --t69-hover: rgba(0,0,0,.05);
            --rv1: #3b2c99; --rv2: #4f3fc0; --rv3: #6250d6; --rv4: #8476e0; --rv5: #a69deb; --rv6: #c6c0f3;
        }
        .t69-dispbox { color: var(--t69-ink); }
        .t69-svg { display: block; max-width: 100%; height: auto; font-family: inherit; }
        .t69-hemi > .t69-svg { margin: 0 auto; } /* 반원 예산은 최대 400px — 넓은 화면에서 가운데로 */
        .t69-surface { fill: var(--t69-surface); }
        .t69-grid { stroke: var(--t69-grid); stroke-width: 1; }
        .t69-axis { stroke: var(--t69-axis); stroke-width: 1; }
        .t69-tick { fill: var(--t69-muted); font-size: 10.5px; font-variant-numeric: tabular-nums; }
        .t69-title { fill: var(--t69-ink2); font-size: 12px; font-weight: 600; }
        .t69-readout { fill: var(--t69-ink2); font-size: 10.5px; font-variant-numeric: tabular-nums; }
        .t69-axislabel { fill: var(--t69-muted); font-size: 10.5px; }
        .t69-endlabel { fill: var(--t69-ink2); font-size: 10.5px; }
        .t69-hero-sm { fill: var(--t69-ink); font-size: 18px; font-weight: 700; }
        .t69-shade { fill: var(--t69-shade); }
        .t69-cross { stroke: var(--t69-ink2); stroke-width: 1; }
        .t69-crossdot { stroke: var(--t69-surface); stroke-width: 2; }
        .t69-hit { cursor: crosshair; outline: none; }
        .t69-hit:focus-visible { stroke: var(--t69-ink2); stroke-width: 1; }
        .t69-marker { stroke-width: 1; stroke: var(--t69-muted); opacity: .7; }
        .t69-flag { fill: var(--t69-muted); }
        .t69-marker-crisis { stroke: var(--critical); fill: var(--critical); }
        .t69-marker-election { stroke: var(--s7); fill: var(--s7); }
        .t69-marker-budget { stroke: var(--s3); fill: var(--s3); }
        .t69-fan90 { opacity: .13; } .t69-fan50 { opacity: .26; }
        .t69-netline { stroke: var(--t69-ink); } .t69-netdot { fill: var(--t69-ink); stroke: var(--t69-surface); stroke-width: 1.5; }
        .t69-barcol.hover rect:not([fill="transparent"]) { filter: brightness(1.15); }
        .t69-seg { stroke: var(--t69-surface); stroke-width: 2; cursor: default; outline: none; }
        .t69-seg:hover, .t69-seg:focus-visible { filter: brightness(1.15); }
        .t69-seglabel { fill: #fff; font-size: 10.5px; font-weight: 600; pointer-events: none; paint-order: stroke; stroke: rgba(0,0,0,.45); stroke-width: 2.5px; }
        .t69-deficit { stroke: var(--critical); } .t69-surplus { stroke: var(--good); }
        .t69-link { opacity: .32; transition: opacity .12s; outline: none; } .t69-link.hover { opacity: .6; } .t69-link.dim { opacity: .08; }
        .t69-node { outline: none; }
        .t69-dot { stroke: var(--t69-surface); stroke-width: 2; opacity: .88; transition: opacity .12s; }
        .t69-dot.hover, .t69-dot.hl { opacity: 1; stroke: var(--t69-ink); stroke-width: 2; }
        .t69-pos { fill: var(--pos); } .t69-neg { fill: var(--neg); }
        .t69-quad { stroke: var(--t69-axis); stroke-width: 1; }
        .t69-quadlabel { fill: var(--t69-muted); font-size: 10.5px; opacity: .8; }
        .t69-trail { stroke: var(--s1); opacity: .6; } .t69-trail-dot { fill: var(--s1); } .t69-trail-now { fill: var(--s2); stroke: var(--t69-surface); stroke-width: 2; }
        .t69-brush { fill: var(--t69-hover); stroke: var(--t69-ink2); stroke-width: 1; cursor: grab; }
        .t69-mini { margin-top: 2px; } .t69-mini-svg { cursor: ew-resize; touch-action: none; }
        .t69-panel + .t69-panel { margin-top: 4px; }
        .t69-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .74rem; color: var(--t69-ink2); margin: 6px 0 0 46px; }
        .t69-legend i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; vertical-align: -1px; }
        .t69-legend i.line { height: 2px; width: 14px; vertical-align: 3px; background: var(--t69-ink); }
        .t69-legend2 { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 28px; font-size: .74rem; color: var(--t69-ink2); margin: 8px auto 0; max-width: 560px; } /* 넓은 화면에서 이름과 금액이 멀어지지 않게 */
        .t69-legend2-h { font-weight: 600; color: var(--t69-ink); margin-bottom: 2px; }
        .t69-legend2-r { display: grid; grid-template-columns: 12px minmax(0,1fr) auto; gap: 6px; align-items: center; }
        .t69-legend2-r i { width: 10px; height: 10px; border-radius: 2px; }
        .t69-legend2-r span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .t69-legend2-r b { font-weight: 500; font-variant-numeric: tabular-nums; color: var(--t69-ink); }
        .t69-tip { position: fixed; z-index: 100000; display: none; pointer-events: none; background: var(--t69-surface); color: var(--t69-ink); border: 1px solid var(--t69-axis); border-radius: 8px; padding: 7px 9px; font-size: 12px; line-height: 1.45; box-shadow: 0 6px 18px rgba(0,0,0,.25); max-width: 300px; }
        .t69-tip-h { color: var(--t69-muted); font-size: 11px; margin-bottom: 3px; }
        .t69-tip-r { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .t69-tip-r i { width: 12px; height: 2px; flex: none; } .t69-tip-r i.dash { height: 0; border-top: 2px dashed currentColor; background: none !important; }
        .t69-tip-r b { font-weight: 700; font-variant-numeric: tabular-nums; } .t69-tip-r span { color: var(--t69-ink2); overflow: hidden; text-overflow: ellipsis; }
        /* 계기 */
        .t69-gauge { display: flex; flex-direction: column; align-items: center; padding: 6px 4px 8px; border-radius: 10px; cursor: default; min-width: 0; }
        .t69-gauge[role="button"] { cursor: pointer; } .t69-gauge[role="button"]:hover, .t69-gauge:focus-visible { background: var(--t69-hover); outline: none; }
        .t69-gauge-svg { width: 100%; max-width: 132px; height: auto; display: block; }
        .t69-gauge-track { stroke: var(--t69-grid); }
        .t69-band { opacity: .9; } .t69-st-good { stroke: var(--good); } .t69-st-warning { stroke: var(--warning); } .t69-st-serious { stroke: var(--serious); } .t69-st-critical { stroke: var(--critical); }
        .t69-needle { stroke: var(--t69-ink); } .t69-needle-hub { fill: var(--t69-ink); }
        .t69-gauge-end { fill: var(--t69-muted); font-size: 9px; }
        .t69-gauge-body { display: flex; flex-direction: column; align-items: center; margin-top: -6px; width: 100%; }
        .t69-gauge-val { font-size: 1.15rem; font-weight: 700; color: var(--t69-ink); }
        .t69-gauge-label { font-size: .74rem; color: var(--t69-ink2); }
        .t69-gauge-st { font-size: .68rem; margin-top: 1px; color: var(--t69-ink2); }
        .t69-st-text-good::first-letter { color: var(--good); } .t69-st-text-warning::first-letter { color: var(--warning); } .t69-st-text-serious::first-letter { color: var(--serious); } .t69-st-text-critical::first-letter { color: var(--critical); }
        .t69-gauge-delta { font-size: .68rem; color: var(--t69-muted); font-variant-numeric: tabular-nums; }
        .t69-spark { width: 84%; height: 18px; margin-top: 2px; } .t69-spark-line { stroke: var(--t69-ink2); }
        .t69-gauge-sub { font-size: .66rem; color: var(--t69-muted); text-align: center; }
        /* 표 */
        .t69-tablewrap { overflow: auto; max-height: 520px; border: 1px solid var(--t69-grid); border-radius: 8px; }
        .t69-table { border-collapse: collapse; width: 100%; font-size: .76rem; font-variant-numeric: tabular-nums; }
        .t69-table th { position: sticky; top: 0; background: var(--t69-surface); color: var(--t69-ink2); font-weight: 600; text-align: right; padding: 6px 8px; border-bottom: 1px solid var(--t69-axis); white-space: nowrap; }
        .t69-table td { text-align: right; padding: 4px 8px; border-bottom: 1px solid var(--t69-grid); color: var(--t69-ink); white-space: nowrap; }
        .t69-table th:first-child, .t69-table td:first-child { text-align: left; position: sticky; left: 0; background: var(--t69-surface); }
    `;
    document.head.appendChild(style);
})();
