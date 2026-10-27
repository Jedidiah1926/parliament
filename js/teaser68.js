// ===== Hemicycle 티저 1.6.8 (teaser68) — 다음 업데이트 기능 미리 써 보기 =====
// teaser68.html은 main.html을 그대로 복사한 화면에 이 파일 하나를 더 불러 미리보기 기능을 얹는다.
// (저장 공간은 본 게임과 따로 — main.js의 LS_PREFIX 'hemicycleTeaserV2-68:')
//
// 1.6.8 "갈라질 수도 없고 분리될 수도 없다" 미리보기 — 종속국 · 종속국 의회 · 합병 · 해방
//   - 국가 › 종속국 탭을 새로 둔다. 종속국을 여러 개 만들고(이름 · 색 · 형태 — 보호국 · 괴뢰국 · 자치령 …),
//     종속 형태는 기본 목록(보호국 · 보호령 · 동군연합 …)에 더해 직접 추가 · 이름 바꾸기 · 지우기가 된다. "칠하기"로 지도에서 지역구를 차례로 눌러 그 종속국 땅으로 정한다. 종속국 땅은 모든 지도에서 그 나라 색 점무늬로 따로 보이고
//     (미수복 지역의 빗금과 다르게), 본국의 지역구 선거 · 지방선거 · 국민투표에서 빠진다 (그 지역구 의석은 지역구 의석 수에서 빠짐)
//   - 종속국마다 따로 의회가 있다 — 의회 이름 · 의석 수 · 봉쇄조항 · 정당(지지율 · 의석)을 정하고 "선거 실시"로 의석을 새로 나눈다.
//     작은 반원형 의석 그림으로 보여 준다
//   - "합병"은 종속국을 본국에 합쳐 그 땅을 일반 지역구로 돌린다 (선거 · 의석에 들어감, 종속국 의회는 해산)
//   - "해방"은 종속국을 독립시켜 본국에서 떼어 낸다 — 독립국으로 지도에 따로 보이고 선거에서 계속 빠지며,
//     세계 › 국가 순위(1.6.5)가 있으면 그 나라를 순위에 올린다. 독립국은 다시 종속국으로 삼거나 지역구에서 아예 뺄 수 있다
// main.js의 최상위 함수(getAppState · renderDistrictSvgInto 등)는 전역에 이름으로 걸려 있어서 여기서 감싸 덮어쓴다
/* global getAppState, setAppState, renderDistrictSvgInto, districtRenderNamePanel, districtActiveSeatCount,
   elecSimulateDistrictsSvg, districtNames, districtSeatCounts, districtGrid, selectedDistrictKey, parties,
   districtMapMode, districtRedrawAllMaps, renderDistrictListPanel, elecUpdateDistrictInfo, showCustomConfirm, showCustomAlert, escapeHtmlText,
   switchSubTab, switchMainTab, switchDispTab, districtUpdateModeUI, districtInitCanvas, currentMainTab, currentSubTab, districtOrderSync */
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-app-mode') !== 'teaser' || !['68', '69'].includes(document.documentElement.getAttribute('data-teaser') || '68')) return;

    // vassals = [{ id, name, color, kind, parliament: { name, seats, threshold, parties:[{ id, name, color, support, seats }], elections, shares } }]
    // vassalOf = { 지역구 키: 종속국 id }
    // liberated = [{ id, name, color, kind }] · liberatedOf = { 지역구 키: 독립국 id } — 해방된 나라 (본국에서 떨어져 나감)
    const PALETTE = ['#c084fc', '#38bdf8', '#facc15', '#4ade80', '#fb7185', '#f97316', '#2dd4bf', '#e879f9'];
    // 종속 형태 — 기본 목록에 직접 추가 · 이름 바꾸기 · 지우기 (세이브에 함께 저장)
    const DEFAULT_KINDS = ['보호국', '보호령', '괴뢰국', '자치령', '위성국', '속국', '동군연합', '신탁통치령'];
    let kinds = DEFAULT_KINDS.slice();
    let kindEditFor = null; // "＋ 새 형태"를 고른 종속국 카드 — 그 자리에 형태 이름 칸을 띄운다
    const cleanKind = k => String(k == null ? '' : k).trim().slice(0, 30);
    const defaultKind = () => kinds[0] || '종속국';
    function addKind(k) {
        k = cleanKind(k);
        if (k && !kinds.includes(k)) kinds.push(k);
        return k;
    }
    // 형태 칩 이름 칸 폭 — 글자 수에 맞춤 (한글 · 한자는 넓게)
    const kindChipWidth = k => `${[...k].reduce((w, c) => w + (/[\u1100-\uffff]/.test(c) ? 1 : 0.55), 0.6).toFixed(2)}em`;
    function renameKind(from, to) {
        to = cleanKind(to);
        if (!to || to === from) return;
        if (kinds.includes(to)) kinds = kinds.filter(k => k !== from); else kinds = kinds.map(k => (k === from ? to : k));
        vassals.concat(liberated).forEach(v => { if (v.kind === from) v.kind = to; });
    }
    let vassals = [];
    let vassalOf = {};
    let liberated = [];
    let liberatedOf = {};
    let brush = null; // 칠하기 도구 — null(끔) | 종속국 id | 'erase'
    const openParl = new Set(); // 의회 칸을 펼친 종속국
    let kindsOpen = false; // 종속 형태 목록을 펼쳤는지
    const vassalById = id => vassals.find(v => v.id === id) || null;
    const libById = id => liberated.find(v => v.id === id) || null;
    const vassalOfKey = key => vassalById(vassalOf[key]);
    const libOfKey = key => libById(liberatedOf[key]);
    const isVassal = key => !!vassalOfKey(key);
    const isLib = key => !!libOfKey(key);
    const isOut = key => isVassal(key) || isLib(key);
    window.isDistrictVassal = isOut; // 지방선거 · 국민투표(js/popvote.js)가 이걸 보고 뺀다
    const unrecPrev = key => typeof window.isDistrictUnrecovered === 'function' && window.isDistrictUnrecovered(key);
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s)) : String(s));
    const nameOf = key => districtNames.house?.[key] || key;
    const keysOf = id => Object.keys(vassalOf).filter(k => vassalOf[k] === id);
    const libKeysOf = id => Object.keys(liberatedOf).filter(k => liberatedOf[k] === id);
    const hex = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : null);
    const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
    const seatsOf = key => (districtMapMode !== 'svg' ? 1 : (districtSeatCounts[key]?.house || 0));

    function newId(prefix, list) {
        let n = 1;
        while (list.some(v => v.id === prefix + n)) n++;
        return prefix + n;
    }
    function freshParliament() {
        return { name: '의회', seats: 60, threshold: 5, parties: [], elections: 0, shares: {} };
    }
    function addVassal(name) {
        const id = newId('v', vassals.concat(liberated));
        const n = Number(id.slice(1));
        const v = { id, name: name || `종속국 ${n}`, color: PALETTE[(n - 1) % PALETTE.length], kind: defaultKind(), parliament: freshParliament() };
        vassals.push(v);
        return v;
    }
    function cleanParty(p, i) {
        return { id: String(p.id || 'p' + (i + 1)), name: String(p.name || `정당 ${i + 1}`), color: hex(p.color) || PALETTE[i % PALETTE.length], support: num(p.support, 0, 0, 100), seats: Math.round(num(p.seats, 0, 0, 9999)) };
    }
    function cleanParliament(pl) {
        const base = freshParliament();
        if (!pl || typeof pl !== 'object') return base;
        return {
            name: String(pl.name || base.name),
            seats: Math.round(num(pl.seats, base.seats, 1, 999)),
            threshold: num(pl.threshold, base.threshold, 0, 50),
            parties: Array.isArray(pl.parties) ? pl.parties.filter(Boolean).map(cleanParty) : [],
            elections: Math.round(num(pl.elections, 0, 0, 9999)),
            shares: pl.shares && typeof pl.shares === 'object' ? { ...pl.shares } : {},
        };
    }
    function loadTeaserState(s) {
        kinds = Array.isArray(s?.kinds) ? [...new Set(s.kinds.map(cleanKind).filter(Boolean))] : DEFAULT_KINDS.slice();
        kindEditFor = null;
        const list = (a, withParl) => (Array.isArray(a) ? a.filter(v => v && v.id).map((v, i) => ({
            id: String(v.id), name: String(v.name || v.id), color: hex(v.color) || PALETTE[i % PALETTE.length],
            kind: cleanKind(v.kind) || defaultKind(), ...(withParl ? { parliament: cleanParliament(v.parliament) } : {}),
        })) : []);
        vassals = list(s?.vassals, true);
        liberated = list(s?.liberated, false);
        const map = (m, byId) => { const out = {}; Object.entries(m && typeof m === 'object' ? m : {}).forEach(([k, id]) => { if (byId(String(id))) out[k] = String(id); }); return out; };
        vassalOf = map(s?.vassalOf, vassalById);
        liberatedOf = map(s?.liberatedOf, libById);
        brush = null;
    }

    // ---- 저장 · 불러오기: 세이브에 teaser68 칸으로 ----
    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') {
            st.teaser68 = {
                vassals: vassals.map(v => ({ ...v, parliament: { ...v.parliament, parties: v.parliament.parties.map(p => ({ ...p })), shares: { ...v.parliament.shares } } })),
                kinds: kinds.slice(), vassalOf: { ...vassalOf }, liberated: liberated.map(v => ({ ...v })), liberatedOf: { ...liberatedOf },
            };
        }
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        loadTeaserState(state && state.teaser68);
        refreshUI();
        return r;
    };

    // ---- 선거: 종속국 · 독립국 지역구는 본국 선거에서 개표하지 않고, 지역구 의석 수에서도 뺀다 ----
    const origSim = window.elecSimulateDistrictsSvg;
    window.elecSimulateDistrictsSvg = function () {
        return (origSim.apply(this, arguments) || []).filter(r => !isOut(r.key));
    };
    const origCount = window.districtActiveSeatCount;
    window.districtActiveSeatCount = function (chamber) {
        const total = origCount.apply(this, arguments);
        // 미수복 지역(1.6.7)으로도 칠한 곳은 거기서 이미 뺐으므로 두 번 빼지 않는다
        const lost = Object.keys(districtGrid[chamber] || {}).filter(k => isOut(k) && !unrecPrev(k))
            .reduce((sum, key) => sum + (districtMapMode !== 'svg' ? 1 : (districtSeatCounts[key]?.[chamber] || 0)), 0);
        return Math.max(0, total - lost);
    };

    // ---- 지도: 종속국은 그 나라 색 점무늬, 독립국은 옅은 단색 + 툴팁에 (종속국: 이름) · (독립국: 이름) ----
    // 점 간격은 화면 픽셀 기준 (1.6.7 빗금과 같은 방식) — 패턴 id는 그릴 때마다 새로 붙인다
    const DOT_PX = 6;
    let dotSeq = 0;
    function dotDefs(prefix) {
        const light = document.documentElement.getAttribute('data-theme-mode') === 'light';
        return vassals.map(v => `<pattern id="${prefix}${v.id}" data-vassal-dot="1" patternUnits="userSpaceOnUse" width="1" height="1">`
            + `<rect width="1" height="1" fill="color-mix(in srgb, ${v.color} ${light ? 22 : 18}%, ${light ? '#ffffff' : '#06070a'})"/>`
            + `<circle cx=".5" cy=".5" r=".28" fill="${v.color}"/></pattern>`).join('');
    }
    function fitDots(svg) {
        const pats = svg.querySelectorAll('pattern[data-vassal-dot]');
        if (!pats.length) return;
        const r = svg.getBoundingClientRect();
        const vb = String(svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number);
        const vw = vb[2] || 100, vh = vb[3] || 100;
        const unitsPerPx = r.width > 0 && r.height > 0 ? Math.max(vw / r.width, vh / r.height) : vw / 600;
        const size = DOT_PX * unitsPerPx;
        pats.forEach(p => p.setAttribute('patternTransform', `scale(${size})`));
    }
    const libFill = c => (document.documentElement.getAttribute('data-theme-mode') === 'light'
        ? `color-mix(in srgb, ${c} 30%, #e5e7eb)` : `color-mix(in srgb, ${c} 28%, #1f2229)`);
    const origRender = window.renderDistrictSvgInto;
    window.renderDistrictSvgInto = function (wrapEl, opts) {
        const o = { ...(opts || {}) };
        const active = Object.keys(vassalOf).some(isVassal) || Object.keys(liberatedOf).some(isLib);
        if (active) {
            const prefix = `hemiVassalDot${++dotSeq}_`;
            const g = o.getFill, t = o.title, b = o.seatBadges;
            o.defs = (o.defs || '') + dotDefs(prefix);
            o.getFill = key => (isVassal(key) ? `url(#${prefix}${vassalOf[key]})` : isLib(key) ? libFill(libOfKey(key).color) : (g ? g(key) : null));
            o.title = key => (isVassal(key) ? `${nameOf(key)} (종속국: ${vassalOfKey(key).name})`
                : isLib(key) ? `${nameOf(key)} (독립국: ${libOfKey(key).name})` : (t ? t(key) : nameOf(key)));
            if (b) o.seatBadges = key => (isOut(key) ? null : b(key));
        }
        if (!brush && onVassalTab() && wrapEl && wrapEl.id === 'districtSvgWrap' && o.clickable) {
            // 국가 › 종속국 탭에서는 지역구를 누르면 그 탭 안에서 종속국을 고르는 칸이 열린다
            o.onClickKey = key => { selectedDistrictKey = key; refreshUI(); };
        }
        if (brush && wrapEl && wrapEl.id === 'districtSvgWrap' && o.clickable) {
            o.onClickKey = key => paint(key);
            const t = o.title;
            o.title = key => (t ? t(key) : nameOf(key)) + (brush === 'erase' ? ' — 눌러서 지우기' : ` — 눌러서 "${vassalById(brush)?.name || ''}" 땅으로 칠하기`);
        }
        const r = origRender.call(this, wrapEl, o);
        const svg = active && wrapEl && wrapEl.querySelector('svg');
        if (svg) {
            fitDots(svg);
            new MutationObserver(() => fitDots(svg)).observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
            if (window.ResizeObserver) new ResizeObserver(() => fitDots(svg)).observe(svg);
        }
        return r;
    };

    // ---- 칠하기 도구 ----
    function paint(key) {
        if (brush === 'erase') delete vassalOf[key];
        else if (vassalById(brush)) {
            if (vassalOf[key] === brush) delete vassalOf[key];
            else { vassalOf[key] = brush; delete liberatedOf[key]; }
        }
        refreshUI();
    }
    function setBrush(b) {
        brush = brush === b ? null : b;
        refreshUI();
    }
    function setVassal(key, id) {
        if (id && vassalById(id)) { vassalOf[key] = id; delete liberatedOf[key]; } else delete vassalOf[key];
        refreshUI();
    }

    // ---- 이 지역구가 속한 종속국 고르기 (국가 › 지역구 지도의 편집 칸, 국가 › 종속국의 선택 칸 공용) ----
    function vassalSelectHtml(key) {
        const cur = isVassal(key) ? vassalOf[key] : '';
        return `<select class="t68-select">
                <option value="">— 아님 (본국 지역구) —</option>
                ${vassals.map(v => `<option value="${esc(v.id)}" ${v.id === cur ? 'selected' : ''}>${esc(v.name)} (${esc(v.kind)})</option>`).join('')}
                <option value="__new">+ 새 종속국</option>
            </select>`;
    }
    function bindVassalSelect(box, key) {
        box.querySelector('select').addEventListener('change', e => {
            const v = e.target.value;
            setVassal(key, v === '__new' ? addVassal().id : v);
        });
    }
    const origPanel = window.districtRenderNamePanel;
    window.districtRenderNamePanel = function () {
        const r = origPanel.apply(this, arguments);
        const panel = document.getElementById('districtNamePanel');
        const key = typeof selectedDistrictKey !== 'undefined' ? selectedDistrictKey : null;
        if (panel && key && panel.style.display !== 'none') {
            const box = document.createElement('label');
            box.className = 't68-toggle';
            box.innerHTML = isLib(key)
                ? `독립국 <b>${esc(libOfKey(key).name)}</b> <span class="t68-dim">— 해방되어 본국에서 떨어져 나간 땅 · 국가 › 종속국에서 관리</span>`
                : `종속국 ${vassalSelectHtml(key)}
                <span class="t68-dim">— 본국에 딸린 나라의 땅 (본국 선거 · 의석에서 빠짐) · 국가 › 종속국에서 관리</span>`;
            if (!isLib(key)) bindVassalSelect(box, key);
            panel.insertBefore(box, panel.children[1] || null);
        }
        return r;
    };

    // ---- 종속국 의회: 선거 (봉쇄조항 + 동트 방식) · 반원형 의석 그림 ----
    function runElection(v) {
        const P = v.parliament;
        const list = P.parties.filter(p => p.support > 0);
        if (!list.length) { showCustomAlert(`"${v.name}" ${P.name}에 지지율이 있는 정당이 없습니다. 정당을 추가하거나 "본국 정당 가져오기"를 눌러 주세요.`); return; }
        // 지지율에 ±15% 흔들림을 준 득표
        const votes = list.map(p => Math.max(0.0001, p.support * (1 + (Math.random() * 2 - 1) * 0.15)));
        const sum = votes.reduce((a, b) => a + b, 0);
        const shares = votes.map(x => x / sum);
        let pass = list.map((p, i) => shares[i] * 100 >= P.threshold);
        if (!pass.some(Boolean)) pass = list.map(() => true); // 아무도 못 넘으면 봉쇄조항 없이
        const seats = list.map(() => 0);
        for (let s = 0; s < P.seats; s++) {
            let best = -1, bestQ = -1;
            list.forEach((p, i) => { if (!pass[i]) return; const q = votes[i] / (seats[i] + 1); if (q > bestQ) { bestQ = q; best = i; } });
            seats[best]++;
        }
        P.parties.forEach(p => { p.seats = 0; });
        P.shares = {};
        list.forEach((p, i) => { p.seats = seats[i]; P.shares[p.id] = Math.round(shares[i] * 1000) / 10; });
        P.elections++;
        refreshUI();
    }
    function importHomeParties(v) {
        const P = v.parliament;
        const src = (typeof parties !== 'undefined' && Array.isArray(parties) ? parties : []).filter(p => (p.seatsHouse || 0) > 0);
        if (!src.length) { showCustomAlert('본국 하원에 의석이 있는 정당이 없습니다.'); return; }
        const total = src.reduce((a, p) => a + (p.seatsHouse || 0), 0) || 1;
        const go = () => {
            P.parties = src.map((p, i) => ({ id: 'p' + (i + 1), name: String(p.name || ''), color: hex(p.color) || PALETTE[i % PALETTE.length], support: Math.round((p.seatsHouse || 0) / total * 1000) / 10, seats: 0 }));
            P.shares = {};
            runElection(v);
        };
        if (P.parties.length) showCustomConfirm(`"${v.name}" ${P.name}의 정당 ${P.parties.length}개를 지우고 본국 하원 정당(지지율은 본국 의석 비율)으로 바꾼 뒤 선거를 치릅니다. 계속하시겠습니까?`, go);
        else go();
    }
    function hemicycleSvg(P) {
        const list = P.parties.filter(p => p.seats > 0);
        const N = list.reduce((a, p) => a + p.seats, 0);
        if (!N) return '<div class="t68-dim t68-small">아직 의석이 없습니다 — "선거 실시"를 누르거나 정당별 의석을 직접 적으세요.</div>';
        const rows = Math.max(1, Math.min(14, Math.round(Math.sqrt(N / 3.2))));
        const radii = Array.from({ length: rows }, (_, i) => (rows === 1 ? 1 : 0.42 + 0.58 * i / (rows - 1)));
        const rsum = radii.reduce((a, b) => a + b, 0);
        const per = radii.map(r => Math.max(1, Math.round(N * r / rsum)));
        per[rows - 1] += N - per.reduce((a, b) => a + b, 0);
        if (per[rows - 1] < 1) { per[rows - 1] = 1; } // 의석이 아주 적을 때
        const pts = [];
        per.forEach((n, i) => {
            for (let j = 0; j < n; j++) {
                const a = n === 1 ? Math.PI / 2 : Math.PI - Math.PI * j / (n - 1);
                pts.push({ x: Math.cos(a) * radii[i], y: -Math.sin(a) * radii[i], a });
            }
        });
        pts.sort((p, q) => q.a - p.a || p.y - q.y);
        const colors = [];
        list.forEach(p => { for (let k = 0; k < p.seats; k++) colors.push(p.color); });
        const outer = per[rows - 1];
        const dot = Math.min(0.58 / Math.max(rows, 1) * 0.42, (Math.PI / Math.max(outer - 1, 1)) * 0.42, 0.12);
        return `<svg class="t68-hemi" viewBox="-1.12 -1.12 2.24 1.2" role="img" aria-label="${esc(P.name)} 의석 ${N}석">`
            + pts.slice(0, colors.length).map((p, i) => `<circle cx="${p.x.toFixed(4)}" cy="${p.y.toFixed(4)}" r="${dot.toFixed(4)}" fill="${colors[i]}"/>`).join('')
            + `<text x="0" y="-0.08" text-anchor="middle" class="t68-hemi-n">${N}</text></svg>`;
    }

    // ---- 합병 · 해방 ----
    function dropVassal(id) {
        keysOf(id).forEach(k => delete vassalOf[k]);
        vassals = vassals.filter(v => v.id !== id);
        openParl.delete(id);
        if (brush === id) brush = null;
    }
    function annexVassal(id) {
        const v = vassalById(id);
        if (!v) return;
        const keys = keysOf(id);
        const seats = keys.reduce((a, k) => a + seatsOf(k), 0);
        showCustomConfirm(`"${v.name}"을(를) 본국에 합병합니다. 그 땅 ${keys.length}곳(지역구 의석 ${seats}석)은 일반 지역구가 되어 본국 선거 · 의석에 들어가고, ${v.parliament.name}는 해산됩니다. 계속하시겠습니까?`, () => {
            dropVassal(id);
            refreshUI();
        });
    }
    function liberateVassal(id) {
        const v = vassalById(id);
        if (!v) return;
        const keys = keysOf(id);
        showCustomConfirm(`"${v.name}"을(를) 해방합니다. 독립국이 되어 본국에서 떨어져 나가고, 그 땅 ${keys.length}곳은 계속 본국 선거에서 빠집니다.${window.T65 ? ' 세계 › 국가 순위에도 올라갑니다.' : ''} 계속하시겠습니까?`, () => {
            liberated.push({ id: v.id, name: v.name, color: v.color, kind: v.kind });
            keys.forEach(k => { liberatedOf[k] = v.id; });
            dropVassal(id);
            const rows = window.T65?.ranking?.rows;
            if (Array.isArray(rows) && !rows.some(r => r.name === v.name)) {
                rows.push({ id: 'v68' + v.id + Date.now().toString(36), name: v.name, flag: '', flagKey: '', flagImg: '', bloc: 'nonaligned', ideo: '', score: 20, prevRank: null, self: false });
            }
            refreshUI();
        });
    }
    function revassalize(id) {
        const l = libById(id);
        if (!l) return;
        const v = { id: l.id, name: l.name, color: l.color, kind: l.kind, parliament: freshParliament() };
        libKeysOf(id).forEach(k => { delete liberatedOf[k]; vassalOf[k] = v.id; });
        liberated = liberated.filter(x => x.id !== id);
        vassals.push(v);
        refreshUI();
    }
    // 독립국 땅을 본국 지역구에서 아예 뺀다 — 지도에는 지역구가 아닌 땅으로 남는다
    function detachLiberated(id) {
        const l = libById(id);
        if (!l) return;
        const keys = libKeysOf(id);
        showCustomConfirm(`독립국 "${l.name}"의 땅 ${keys.length}곳을 본국 지역구에서 아예 뺍니다 (지도에는 지역구가 아닌 땅으로 남음). 계속하시겠습니까?`, () => {
            ['house', 'senate', 'third'].forEach(ch => {
                const grid = districtGrid[ch];
                if (!grid) return;
                let changed = false;
                keys.forEach(k => { if (grid[k]) { delete grid[k]; changed = true; } });
                if (changed && typeof districtOrderSync === 'function') districtOrderSync(ch);
            });
            keys.forEach(k => delete liberatedOf[k]);
            liberated = liberated.filter(x => x.id !== id);
            refreshUI();
        });
    }
    function removeVassal(id) {
        const v = vassalById(id);
        if (!v) return;
        const n = keysOf(id).length;
        if (!n && !v.parliament.parties.length) { dropVassal(id); refreshUI(); return; }
        showCustomConfirm(`"${v.name}"을(를) 지웁니다. 칠한 땅 ${n}곳은 본국 지역구로 돌아가고 의회 정보도 사라집니다. 계속하시겠습니까?`, () => { dropVassal(id); refreshUI(); });
    }

    // ---- 국가 › 종속국 탭 신설 ----
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addVassalTab() {
        const nation = document.getElementById('mainContentNation');
        const nationBar = nation && nation.querySelector(':scope > .sub-tab-container');
        if (!nationBar) return;
        const settingsBtn = document.getElementById('subTabNationSettings');
        const settings = document.getElementById('contentNationSettings');
        nationBar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('nation','vassals')" id="subTabVassals">종속국</button>`), settingsBtn);
        nation.insertBefore(el(`<div id="contentVassals" class="sub-tab-content"></div>`), settings);
    })();
    const onTab = sub => typeof currentMainTab !== 'undefined' && currentMainTab === 'nation' && typeof currentSubTab !== 'undefined' && currentSubTab.nation === sub;
    function onVassalTab() { return onTab('vassals'); }
    function showDistrictMap() {
        if (typeof showTerritoryTab === 'function') { showTerritoryTab(); return; }
        const t = document.getElementById('dispTabDistrict');
        if (t) t.style.display = '';
        if (typeof switchDispTab === 'function') switchDispTab('district');
        if (typeof districtUpdateModeUI === 'function') districtUpdateModeUI();
        setTimeout(() => { if (typeof districtInitCanvas === 'function') districtInitCanvas(); }, 80);
    }
    const origSwitchSub = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitchSub.apply(this, arguments);
        if (main === 'nation' && sub === 'vassals') { showDistrictMap(); renderVassalTab(); }
        if (main === 'nation' && sub !== 'vassals' && brush) { brush = null; refreshUI(); }
        return r;
    };
    const origMain = window.switchMainTab;
    window.switchMainTab = function (main) {
        const r = origMain.apply(this, arguments);
        if (main !== 'nation' && brush) { brush = null; refreshUI(); }
        return r;
    };

    // ---- 국가 › 종속국: 종속국 목록 · 칠하기 · 의회 · 합병 · 해방 · 독립국 ----
    function parliamentHtml(v) {
        const P = v.parliament;
        const sum = P.parties.reduce((a, p) => a + p.seats, 0);
        const sup = P.parties.reduce((a, p) => a + p.support, 0);
        const major = Math.floor(P.seats / 2) + 1;
        const top = P.parties.slice().sort((a, b) => b.seats - a.seats)[0];
        return `<div class="t68-parl">
            <div class="t68-parl-grid">
                <label>의회 이름 <input type="text" class="t68-in" data-f="name" value="${esc(P.name)}" maxlength="30"></label>
                <label>의석 <input type="number" class="t68-in t68-num" data-f="seats" value="${P.seats}" min="1" max="999"></label>
                <label>봉쇄조항 <input type="number" class="t68-in t68-num" data-f="threshold" value="${P.threshold}" min="0" max="50" step="0.5">%</label>
            </div>
            <div class="t68-parties">
                <div class="t68-party t68-party-head"><span></span><span>정당</span><span>지지율 %</span><span>의석</span><span>득표</span><span></span></div>
                ${P.parties.map(p => `<div class="t68-party" data-pid="${esc(p.id)}">
                    <input type="color" class="t68-pcolor" value="${esc(p.color)}" title="정당 색">
                    <input type="text" class="t68-in" data-pf="name" value="${esc(p.name)}" maxlength="30">
                    <input type="number" class="t68-in t68-num" data-pf="support" value="${p.support}" min="0" max="100" step="0.1">
                    <input type="number" class="t68-in t68-num" data-pf="seats" value="${p.seats}" min="0" max="999">
                    <span class="t68-dim t68-share">${P.shares[p.id] != null ? P.shares[p.id] + '%' : '—'}</span>
                    <button type="button" class="t68-x" title="정당 지우기">×</button>
                </div>`).join('') || '<div class="t68-dim t68-small">정당이 없습니다.</div>'}
            </div>
            <div class="t68-row">
                <button type="button" class="t68-btn" data-act="addparty">+ 정당</button>
                <button type="button" class="t68-btn" data-act="import">본국 정당 가져오기</button>
                <button type="button" class="t68-btn t68-strong" data-act="elect">선거 실시</button>
            </div>
            <div class="t68-hemi-wrap">${hemicycleSvg(P)}</div>
            <div class="t68-dim t68-small">${P.elections ? `제${P.elections}대 ${esc(P.name)} · ` : ''}의석 ${sum}/${P.seats}석 · 과반 ${major}석${top && top.seats ? ` · 제1당 ${esc(top.name)} ${top.seats}석${top.seats >= major ? ' (과반)' : ''}` : ''}${sup && Math.abs(sup - 100) > 0.5 ? ` · 지지율 합 ${Math.round(sup * 10) / 10}% (비율로 나눔)` : ''}${sum !== P.seats && sum ? ' · 정당 의석 합이 의석 수와 다릅니다' : ''}</div>
            ${P.parties.filter(p => p.seats > 0).length ? `<div class="t68-legend">${P.parties.filter(p => p.seats > 0).map(p => `<span><i style="background:${esc(p.color)}"></i>${esc(p.name)} ${p.seats}</span>`).join('')}</div>` : ''}
        </div>`;
    }
    function renderVassalTab() {
        const host = document.getElementById('contentVassals');
        if (!host) return;
        const total = Object.keys(vassalOf).filter(isVassal).length;
        const LIMIT = 40;
        const cards = vassals.map(v => {
            const keys = keysOf(v.id);
            const seats = keys.reduce((a, k) => a + seatsOf(k), 0);
            const open = openParl.has(v.id);
            return `<div class="t68-card ${brush === v.id ? 'painting' : ''}" data-id="${esc(v.id)}">
                <div class="t68-head">
                    <input type="color" class="t68-color" value="${esc(v.color)}" title="점무늬 색">
                    <input type="text" class="t68-name" value="${esc(v.name)}" maxlength="40" title="나라 이름">
                    ${kindEditFor === v.id
                        ? `<input type="text" class="t68-in t68-kind t68-kind-new" maxlength="30" placeholder="새 형태 (예: 동군연합)" title="새 종속 형태 — Enter로 추가, Esc로 취소">`
                        : `<select class="t68-select t68-kind" title="종속 형태">${(kinds.includes(v.kind) ? kinds : kinds.concat(v.kind)).map(k => `<option value="${esc(k)}" ${k === v.kind ? 'selected' : ''}>${esc(k)}</option>`).join('')}<option value="__new">＋ 새 형태…</option></select>`}
                </div>
                <div class="t68-actions">
                    <span class="t68-dim">${keys.length}곳 · 지역구 의석 ${seats}석</span>
                    <button type="button" class="t68-btn ${brush === v.id ? 'active' : ''}" data-act="paint">${brush === v.id ? '칠하는 중' : '칠하기'}</button>
                    <button type="button" class="t68-btn ${open ? 'active' : ''}" data-act="parl">${esc(v.parliament.name)}</button>
                    <button type="button" class="t68-btn" data-act="annex">합병</button>
                    <button type="button" class="t68-btn" data-act="liberate">해방</button>
                    <button type="button" class="t68-btn" data-act="del">삭제</button>
                </div>
                ${keys.length ? `<div class="t68-chips">${keys.slice(0, LIMIT).map(k => `<span class="t68-chip" data-key="${esc(k)}">${esc(nameOf(k))}<button type="button" title="이 지역구 빼기">×</button></span>`).join('')}${keys.length > LIMIT ? `<span class="t68-dim t68-small">외 ${keys.length - LIMIT}곳</span>` : ''}</div>` : '<div class="t68-dim t68-small">아직 칠한 땅이 없습니다</div>'}
                ${open ? parliamentHtml(v) : ''}
            </div>`;
        }).join('');
        const libs = liberated.map(l => `<div class="t68-lib" data-lid="${esc(l.id)}">
                <i style="background:${esc(l.color)}"></i><b>${esc(l.name)}</b><span class="t68-dim">${libKeysOf(l.id).length}곳 · 독립국</span>
                <button type="button" class="t68-btn" data-act="revassal">다시 종속국으로</button>
                <button type="button" class="t68-btn" data-act="detach">지역구에서 빼기</button>
            </div>`).join('');
        const sel = typeof selectedDistrictKey !== 'undefined' ? selectedDistrictKey : null;
        host.innerHTML = `
            <div class="t68-summary">
                <div class="t68-row t68-between"><span class="t68-count">종속국 ${vassals.length}곳 · 땅 ${total}곳${liberated.length ? ` · 독립국 ${liberated.length}곳` : ''}</span></div>
                <div class="t68-dim t68-small">본국에 딸린 나라 — 지도에 그 나라 색 점무늬로 따로 보이고, 본국 선거 · 의석에서 빠집니다. 종속국마다 따로 의회(의석 · 정당 · 선거)가 있고, 본국에 합병하거나 해방(독립)시킬 수 있습니다.</div>
                <details class="t68-kinds" ${kindsOpen ? 'open' : ''}>
                    <summary>종속 형태 ${kinds.length}가지 <span class="t68-dim">— 직접 추가 · 이름 바꾸기 · 지우기</span></summary>
                    <div class="t68-chips">${kinds.map((k, i) => `<span class="t68-chip t68-kind-chip" data-i="${i}"><input type="text" value="${esc(k)}" maxlength="30" title="눌러서 이름 바꾸기" style="width:${kindChipWidth(k)}"><span class="t68-dim">${vassals.concat(liberated).filter(v => v.kind === k).length || ''}</span><button type="button" title="이 형태 지우기 (이 형태인 나라는 그대로)">×</button></span>`).join('')}</div>
                    <div class="t68-row">
                        <input type="text" class="t68-add-name t68-add-kind" maxlength="30" placeholder="새 형태 (예: 동군연합, 보호령, 번국, 조공국)">
                        <button type="button" class="t68-btn" data-act="addkind">+ 형태 추가</button>
                        <button type="button" class="t68-btn" data-act="resetkinds">기본 목록으로</button>
                    </div>
                </details>
                <div class="t68-row">
                    <input type="text" class="t68-add-name" maxlength="40" placeholder="새 종속국 이름 (예: 보헤미아-모라비아 보호령, 만주국, 그린란드)">
                    <button type="button" class="t68-btn" data-act="add">+ 종속국 추가</button>
                </div>
                ${cards}
                <div class="t68-row"><button type="button" class="t68-btn ${brush === 'erase' ? 'active' : ''}" data-act="erase" ${total ? '' : 'disabled'}>${brush === 'erase' ? '지우는 중' : '지우개'}</button></div>
                <div class="t68-dim t68-small">${brush
                    ? (brush === 'erase' ? '오른쪽 지도에서 종속국 땅을 눌러 본국 지역구로 돌립니다. 다시 "지우는 중"을 누르면 끝납니다.'
                        : `오른쪽 지도에서 지역구를 차례로 눌러 "${esc(vassalById(brush)?.name || '')}" 땅으로 칠합니다 (같은 나라로 칠한 곳을 다시 누르면 지움). 다시 "칠하는 중"을 누르면 끝납니다.`)
                    : (vassals.length ? '"칠하기"를 누른 뒤 오른쪽 지도에서 지역구를 차례로 눌러 그 나라 땅으로 정하세요. 칠하기 도구를 끈 채 지역구를 누르면 아래에서 종속국을 고를 수 있습니다.'
                        : '종속국을 추가하고 "칠하기"로 오른쪽 지도에서 그 나라 땅을 칠하세요.')}</div>
                ${sel && !brush && !isLib(sel) ? `<label class="t68-toggle t68-sel">선택한 지역구: <b>${esc(nameOf(sel))}</b> ${vassalSelectHtml(sel)}</label>` : ''}
                ${libs ? `<div class="t68-libs"><div class="t68-count">독립국 (해방된 나라)</div>${libs}</div>` : ''}
            </div>`;
        const kindsBox = host.querySelector('.t68-kinds');
        kindsBox.addEventListener('toggle', () => { kindsOpen = kindsBox.open; });
        const kindInput = host.querySelector('.t68-add-kind');
        const addK = () => { if (addKind(kindInput.value)) renderVassalTab(); };
        host.querySelector('[data-act="addkind"]').addEventListener('click', addK);
        kindInput.addEventListener('keydown', e => { if (e.key === 'Enter') addK(); });
        host.querySelector('[data-act="resetkinds"]').addEventListener('click', () => showCustomConfirm('종속 형태 목록을 기본 목록으로 되돌릴까요? (이미 정한 나라의 형태는 그대로)', () => { kinds = DEFAULT_KINDS.slice(); renderVassalTab(); }));
        host.querySelectorAll('.t68-kind-chip').forEach(chip => {
            const old = kinds[Number(chip.dataset.i)];
            const inp = chip.querySelector('input');
            inp.addEventListener('change', () => { renameKind(old, inp.value); refreshUI(); });
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); });
            inp.addEventListener('input', () => { inp.style.width = kindChipWidth(inp.value || ' '); });
            chip.querySelector('button').addEventListener('click', () => { kinds = kinds.filter(k => k !== old); renderVassalTab(); });
        });
        const nameInput = host.querySelector('.t68-add-name:not(.t68-add-kind)');
        const add = () => { const v = addVassal(nameInput.value.trim()); brush = v.id; refreshUI(); };
        host.querySelector('[data-act="add"]').addEventListener('click', add);
        nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        host.querySelector('[data-act="erase"]').addEventListener('click', () => setBrush('erase'));
        const selBox = host.querySelector('.t68-sel');
        if (selBox) bindVassalSelect(selBox, sel);
        host.querySelectorAll('.t68-card').forEach(card => {
            const id = card.dataset.id, v = vassalById(id), P = v.parliament;
            const act = (a, fn) => { const b = card.querySelector(`[data-act="${a}"]`); if (b) b.addEventListener('click', fn); };
            act('paint', () => setBrush(id));
            act('parl', () => { if (openParl.has(id)) openParl.delete(id); else openParl.add(id); renderVassalTab(); });
            act('annex', () => annexVassal(id));
            act('liberate', () => liberateVassal(id));
            act('del', () => removeVassal(id));
            act('addparty', () => { P.parties.push(cleanParty({ id: newId('p', P.parties), name: `정당 ${P.parties.length + 1}`, support: 10 }, P.parties.length)); renderVassalTab(); });
            act('import', () => importHomeParties(v));
            act('elect', () => runElection(v));
            card.querySelector('.t68-name').addEventListener('change', e => { v.name = e.target.value.trim() || v.name; refreshUI(); });
            card.querySelector('.t68-color').addEventListener('change', e => { v.color = e.target.value; refreshUI(); });
            const kindSel = card.querySelector('select.t68-kind');
            if (kindSel) kindSel.addEventListener('change', e => {
                if (e.target.value === '__new') { kindEditFor = id; renderVassalTab(); return; }
                v.kind = e.target.value; refreshUI();
            });
            const kindNew = card.querySelector('.t68-kind-new');
            if (kindNew) {
                let done = false;
                const finish = ok => {
                    if (done) return; done = true;
                    const k = ok ? addKind(kindNew.value) : '';
                    if (k) v.kind = k;
                    kindEditFor = null;
                    refreshUI();
                };
                kindNew.addEventListener('keydown', e => { if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
                kindNew.addEventListener('blur', () => finish(true));
                setTimeout(() => kindNew.focus(), 0);
            }
            card.querySelectorAll('.t68-chip button').forEach(b => b.addEventListener('click', () => setVassal(b.parentElement.dataset.key, null)));
            card.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('change', () => {
                const f = inp.dataset.f;
                if (f === 'name') P.name = inp.value.trim() || P.name;
                else if (f === 'seats') P.seats = Math.round(num(inp.value, P.seats, 1, 999));
                else P.threshold = num(inp.value, P.threshold, 0, 50);
                renderVassalTab();
            }));
            card.querySelectorAll('.t68-party[data-pid]').forEach(row => {
                const p = P.parties.find(x => x.id === row.dataset.pid);
                if (!p) return;
                row.querySelector('.t68-pcolor').addEventListener('change', e => { p.color = e.target.value; renderVassalTab(); });
                row.querySelectorAll('[data-pf]').forEach(inp => inp.addEventListener('change', () => {
                    const f = inp.dataset.pf;
                    if (f === 'name') p.name = inp.value.trim() || p.name;
                    else if (f === 'support') p.support = num(inp.value, p.support, 0, 100);
                    else p.seats = Math.round(num(inp.value, p.seats, 0, 999));
                    renderVassalTab();
                }));
                row.querySelector('.t68-x').addEventListener('click', () => { P.parties = P.parties.filter(x => x !== p); delete P.shares[p.id]; renderVassalTab(); });
            });
        });
        host.querySelectorAll('.t68-lib').forEach(row => {
            const id = row.dataset.lid;
            row.querySelector('[data-act="revassal"]').addEventListener('click', () => revassalize(id));
            row.querySelector('[data-act="detach"]').addEventListener('click', () => detachLiberated(id));
        });
    }

    function refreshUI() {
        renderVassalTab();
        try {
            if (typeof districtRedrawAllMaps === 'function') districtRedrawAllMaps();
            if (typeof renderDistrictListPanel === 'function') renderDistrictListPanel();
            if (typeof elecUpdateDistrictInfo === 'function') elecUpdateDistrictInfo();
            if (typeof selectedDistrictKey !== 'undefined' && selectedDistrictKey) window.districtRenderNamePanel();
        } catch (e) { /* 아직 화면이 덜 그려진 시점 */ }
    }
    window.T68 = {
        get vassals() { return vassals; }, get vassalOf() { return vassalOf; }, get liberated() { return liberated; }, get liberatedOf() { return liberatedOf; },
        add: name => { const v = addVassal(name); refreshUI(); return v; },
        assign: (key, id) => setVassal(key, id),
        get kinds() { return kinds; },
        addKind: k => { const r = addKind(k); refreshUI(); return r; },
        elect: id => { const v = vassalById(id); if (v) runElection(v); },
        openParliament: id => { const v = vassalById(id) || vassals[0]; if (v) { openParl.add(v.id); renderVassalTab(); } },
    };

    const style = document.createElement('style');
    style.textContent = `
        .t68-summary { margin-bottom: 10px; padding: 8px 10px; border: 1px dashed var(--tno-gold); background: rgba(255,215,0,.04); font-size: .85rem; color: #ccc; }
        .t68-count { font-weight: bold; }
        .t68-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .t68-between { justify-content: space-between; margin-top: 0; }
        .t68-dim { color: #777; }
        .t68-small { font-size: .75rem; margin-top: 4px; line-height: 1.5; }
        .t68-toggle { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 4px 0 8px; font-size: .85rem; color: var(--tno-gold); cursor: pointer; }
        .t68-toggle .t68-dim { flex-basis: 100%; font-size: .72rem; }
        .t68-select { font-family: inherit; font-size: .8rem; background: #111; color: inherit; border: 1px solid #444; padding: 2px 4px; max-width: 100%; }
        .t68-add-name { flex: 1 1 200px; min-width: 0; font-family: inherit; font-size: .8rem; background: transparent; color: inherit; border: 1px solid #444; padding: 4px 6px; }
        .t68-card { margin-top: 8px; padding: 8px; border: 1px solid rgba(255,255,255,.08); }
        .t68-card.painting { border-color: var(--tno-neon); box-shadow: 0 0 6px color-mix(in srgb, var(--tno-neon) 40%, transparent); }
        .t68-head { display: flex; align-items: center; gap: 6px; }
        .t68-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .t68-actions .t68-dim { margin-right: auto; }
        .t68-color, .t68-pcolor { flex: 0 0 auto; width: 26px; height: 22px; padding: 0; border: none; background: none; cursor: pointer; }
        .t68-name { flex: 1 1 auto; width: 100%; min-width: 0; box-sizing: border-box; font-family: inherit; font-size: .85rem; background: transparent; color: inherit; border: none; border-bottom: 1px solid #444; padding: 2px; }
        #contentVassals .t68-head .t68-name { flex: 1 1 auto; width: auto; min-width: 0; }
        #contentVassals .t68-head .t68-kind { flex: 0 0 auto; width: auto; max-width: 40%; }
        .t68-btn { cursor: pointer; font-family: inherit; font-size: .75rem; background: transparent; border: 1px solid #555; color: #bbb; padding: 3px 8px; white-space: nowrap; }
        .t68-btn.active, .t68-btn.t68-strong { border-color: var(--tno-neon); color: #000; background: var(--tno-neon); }
        .t68-btn:disabled { opacity: .4; cursor: default; }
        .t68-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .t68-chip { display: inline-flex; align-items: center; gap: 2px; font-size: .72rem; padding: 1px 2px 1px 6px; border: 1px solid #333; color: #aaa; }
        .t68-chip button, .t68-x { cursor: pointer; background: none; border: none; color: #777; font-family: inherit; font-size: .8rem; padding: 0 3px; }
        .t68-chip button:hover, .t68-x:hover { color: #f87171; }
        .t68-sel { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.08); }
        .t68-parl { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.08); }
        .t68-parl-grid { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: .78rem; }
        .t68-parl-grid label { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        #contentVassals .t68-parl-grid label:first-child { display: flex; flex: 1 1 100%; min-width: 0; }
        #contentVassals .t68-parl-grid label:first-child .t68-in { flex: 1 1 0; width: 0; min-width: 0; }
        .t68-in { font-family: inherit; font-size: .78rem; background: transparent; color: inherit; border: 1px solid #444; padding: 2px 4px; min-width: 0; box-sizing: border-box; }
        #contentVassals .t68-in { width: 100%; margin: 0; padding: 3px 5px; height: auto; }
        #contentVassals .t68-parl-grid .t68-num { width: 70px; }
        .t68-parties { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
        .t68-party { display: grid; grid-template-columns: 26px minmax(0,1fr) 64px 56px 44px 18px; align-items: center; gap: 4px; font-size: .75rem; }
        .t68-party-head { color: #777; font-size: .7rem; }
        .t68-share { text-align: right; font-size: .7rem; }
        .t68-hemi-wrap { margin-top: 8px; display: flex; justify-content: center; }
        .t68-hemi { width: 100%; max-width: 260px; height: auto; }
        .t68-hemi-n { font-size: .2px; fill: currentColor; font-weight: bold; }
        .t68-legend { display: flex; flex-wrap: wrap; gap: 4px 10px; margin-top: 4px; font-size: .72rem; }
        .t68-legend i, .t68-lib i { display: inline-block; width: 9px; height: 9px; margin-right: 4px; border-radius: 50%; vertical-align: middle; }
        .t68-kinds { margin-top: 8px; font-size: .8rem; }
        .t68-kinds > summary { cursor: pointer; font-weight: bold; }
        .t68-kinds > summary .t68-dim { font-weight: normal; font-size: .72rem; }
        .t68-kind-chip { padding: 1px 2px 1px 4px; }
        #contentVassals .t68-kind-chip input { min-width: 2em; max-width: 12em; font-family: inherit; font-size: .72rem; background: transparent !important; color: inherit; border: none !important; border-radius: 0; padding: 0 2px; margin: 0; height: auto; box-shadow: none !important; }
        #contentVassals .t68-kind-chip .t68-dim { font-size: .65rem; }
        #contentVassals .t68-head .t68-kind-new { flex: 0 0 auto; width: 9em; max-width: 40%; }
        .t68-libs { margin-top: 12px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.08); }
        .t68-lib { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 6px; font-size: .8rem; }
        .t68-lib .t68-dim { margin-right: auto; font-size: .72rem; }
        html[data-theme-family="modern"] .t68-summary { border: 1px dashed var(--m-border-strong); border-radius: 12px; background: var(--m-surface-2); color: var(--m-text); }
        html[data-theme-family="modern"] .t68-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .t68-toggle { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .t68-card { border: 1px solid var(--m-border); border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t68-card.painting { border-color: var(--m-accent); box-shadow: none; }
        html[data-theme-family="modern"] .t68-name { border-bottom-color: var(--m-border-strong); }
        html[data-theme-family="modern"] .t68-add-name, html[data-theme-family="modern"] .t68-in { border: 1px solid var(--m-border-strong); border-radius: 6px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t68-chip { border: 1px solid var(--m-border); border-radius: 999px; color: var(--m-text-2); background: var(--m-surface-2); }
        html[data-theme-family="modern"] .t68-sel, html[data-theme-family="modern"] .t68-parl, html[data-theme-family="modern"] .t68-libs { border-top-color: var(--m-border); }
        html[data-theme-family="modern"] .t68-btn { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text-2); }
        html[data-theme-family="modern"] .t68-btn.active, html[data-theme-family="modern"] .t68-btn.t68-strong { background: var(--m-accent); color: var(--m-on-accent); border-color: var(--m-accent); }
        html[data-theme-family="modern"] .t68-select { background: var(--m-surface); border: 1px solid var(--m-border-strong); border-radius: 6px; }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refreshUI, 0));
})();
