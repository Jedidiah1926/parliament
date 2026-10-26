// ===== Hemicycle 티저 1.6.9 (teaser69) — 보이지 않는 손 "Invisible hand" — 경제 시스템 =====
// teaser69.html은 main.html에 1.6.1 ~ 1.6.8 미리보기와 이 파일(+ 그래프 js/teaser69charts.js)을 얹는다.
// (저장 공간은 본 게임과 따로 — main.js의 LS_PREFIX 'hemicycleTeaserV2-69:')
//
// 샌드박스 원칙 — 경제는 결과를 강제하지 않고 계산 · 표시 · 제안한다. 모든 수치는 직접 고칠 수 있고, 계산은 날짜가 넘어갈 때만 돈다.
//   - 메뉴 › 경제: 개요 · 분석 · 통화 · 재정 · 지역 · 시나리오 · 이벤트 · 항목, 오른쪽 시각 탭 "경제"(개요: 반원 계기 + 큰 그래프 / 분석: 전문가 그래프)
//   - 턴: 기본 1분기(1개월 · 1년도) — 게임 날짜를 따라간다. 날짜가 분기 경계를 지나면(▶ · 날짜 칸 직접 수정 모두) 지난 만큼 계산,
//     날짜를 되돌리면 경제는 그대로 두고 지금 날짜부터 이어서 센다. 날짜를 안 쓰는 세이브만 턴 번호로
//   - 금액은 비율(GDP 대비 %)로 계산하고 화면에만 화폐 단위로 보여 준다
//   - 예산 · 세율 바꾸기는 기본으로 예산안(법안)을 거친다 (설정에서 끄면 바로 반영), 통화정책은 중앙은행 몫이라 바로
//   - 경제 성과가 지지율 · 지역구 성향을 조금씩 움직인다 (설정)
// 계산식은 TODO.md "1.6.9 경제 시스템 설계"의 턴 계산 순서를 따른다 (계수는 연 단위, 턴 길이만큼 나눠 씀)
/* global parties, coalitions, elecStore, districtGrid, districtPopulation, districtNames, districtSvgTendency, districtSortedKeys,
   bills, getBillOverallStatus, renderBillList, syncBillSelect, selectBillForVote, applyPartyVote, ideologies,
   showCustomAlert, showCustomConfirm, escapeHtmlText, switchSubTab, switchMainTab, switchDispTab, renderDistrictSvgInto,
   currentSubTab, advanceNationDate, chamberList, chamberDisplayName, formatNationDate, findIdeology, T69C */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') !== 'teaser' || !['69'].includes(root.getAttribute('data-teaser') || '69')) return;
    const C = window.T69C;
    if (!C) return;

    // ================= 도우미 =================
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const num = (v, d = 0, lo = -Infinity, hi = Infinity) => { const n = Number(v); return Number.isFinite(n) ? clamp(n, lo, hi) : d; };
    const r1 = v => Math.round(v * 10) / 10, r2 = v => Math.round(v * 100) / 100;
    const sum = a => a.reduce((t, x) => t + x, 0);
    const deep = o => JSON.parse(JSON.stringify(o));
    const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };
    const pct = (v, d = 1) => `${Number.isFinite(v) ? v.toFixed(d) : '—'}%`;
    const sgn = (v, d = 1) => `${v > 0 ? '+' : ''}${Number.isFinite(v) ? v.toFixed(d) : '—'}`;
    // 같은 씨앗이면 같은 흔들림 (예측 · 민감도 비교용)
    function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
    const gauss = r => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

    // ================= 기본 정의 (기본팩 — 사용자 정의 항목도 같은 모양) =================
    const TAGS = ['안보', '복지', '과학', '교육', '산업', '농업', '환경', '국가위신'];
    // 지출 항목: s0 기준 지출(GDP 대비 %) · max 상한 · jobs 기준보다 1%p 더 쓸 때 실업률 변화(%p, 음수 = 줄어듦) · mood 민심 · eff 수확체감 · asset 쌓는 자산
    const BUILTIN_ITEMS = [
        { id: 'army', name: '육군', group: '국방', tags: ['안보'], s0: 1.4, max: 8, jobs: -0.25, mood: 0, eff: 0.6, asset: 'military', ind: [0, 1.2, 0.2] },
        { id: 'navy', name: '해군 · 공군', group: '국방', tags: ['안보', '국가위신'], s0: 1.0, max: 8, jobs: -0.2, mood: 0, eff: 0.6, asset: 'military', ind: [0, 1.4, 0.1] },
        { id: 'science', name: '과학', group: '민간', tags: ['과학', '산업'], s0: 1.0, max: 6, jobs: -0.1, mood: 0.2, eff: 0.6, asset: 'tech' },
        { id: 'education', name: '교육', group: '민간', tags: ['교육'], s0: 4.5, max: 10, jobs: -0.15, mood: 0.6, eff: 0.6, asset: 'human' },
        { id: 'infra', name: '인프라', group: '민간', tags: ['산업'], s0: 2.5, max: 10, jobs: -0.4, mood: 0.3, eff: 0.6, asset: 'infra', ind: [0.2, 1.0, 0.4] },
        { id: 'admin', name: '행정', group: '민간', tags: [], s0: 3.0, max: 8, jobs: -0.1, mood: 0, eff: 0.6, asset: null },
        { id: 'police', name: '치안', group: '민간', tags: ['안보'], s0: 1.2, max: 5, jobs: -0.05, mood: 0.3, eff: 0.6, asset: 'order' },
        { id: 'agri', name: '농업보조', group: '민간', tags: ['농업'], s0: 0.5, max: 4, jobs: -0.1, mood: 0.4, eff: 0.6, asset: null, ind: [1.5, 0.1, 0] },
        { id: 'welfare', name: '복지', group: '복지', tags: ['복지'], s0: 7.0, max: 20, jobs: -0.05, mood: 1.2, eff: 0.6, asset: null, welfare: true },
        { id: 'health', name: '의료', group: '복지', tags: ['복지'], s0: 5.0, max: 14, jobs: -0.1, mood: 0.8, eff: 0.6, asset: 'health', welfare: true },
        { id: 'royal', name: '왕실 예산', group: '민간', tags: ['국가위신'], s0: 0.1, max: 2, jobs: 0, mood: 0, eff: 0.6, asset: null, cond: 'monarchy' },
    ];
    // 자산: decay 해마다 줄어드는 비율 · effects 기준(50)보다 1점 높을 때의 효과
    const BUILTIN_ASSETS = [
        { id: 'tech', name: '기술수준', decay: 0.04, effects: { growth: 0.03 } },
        { id: 'human', name: '인적자본', decay: 0.05, effects: { growth: 0.02, unemp: -0.03 } },
        { id: 'infra', name: '인프라', decay: 0.06, effects: { growth: 0.02 } },
        { id: 'military', name: '군사력', decay: 0.10, effects: {} },
        { id: 'health', name: '보건수준', decay: 0.07, effects: { mood: 0.05 } },
        { id: 'order', name: '질서', decay: 0.08, effects: { mood: 0.03, conf: 0.03 } },
    ];
    // 세목: rate0 기본 세율 · base 과세 기반(GDP 대비 비율) · L 세수가 0이 되는 세율(래퍼 곡선) · weight 지역 부담 · side 기본 세율보다 1%p 높을 때 부작용
    const BUILTIN_TAXES = [
        { id: 'income', name: '소득세', rate0: 25, base: 0.5, L: 100, max: 90, weight: 'income', side: { growth: -0.03, moodHigh: -0.4 } },
        { id: 'corp', name: '법인세', rate0: 25, base: 0.14, L: 100, max: 90, weight: 'industry', side: { growth: -0.05 } },
        { id: 'vat', name: '부가세', rate0: 15, base: 0.5, L: 80, max: 60, weight: 'flat', side: { growth: -0.03, infl: 0.05, moodLow: -0.5 } },
        { id: 'social', name: '사회보험료', rate0: 15, base: 0.5, L: 90, max: 60, weight: 'flat', side: { growth: -0.02, moodLow: -0.2 } },
        { id: 'tariff', name: '관세', rate0: 4, base: 0.05, L: 120, max: 100, weight: 'imports', side: { infl: 0.03, growth: -0.01 } },
        { id: 'property', name: '재산세', rate0: 1.5, base: 2.5, L: 20, max: 10, weight: 'wealth', side: { moodHigh: -1.5 } },
    ];
    // 효과를 줄 수 있는 대상 (화이트리스트 — 이 밖의 대상은 무시하고 경고). 자산 id는 자동으로 더해진다
    // 인플레 안전 범위는 성장률에 따라 넓어진다 — 빨리 크는 경제는 물가가 더 올라도 버틴다 (예: 고도성장기 한국, 성장 10% · 물가 10%+).
    // 기준은 이번 칸 성장률이 아니라 최근 약 3년의 성장 흐름(nat.gTrend) — 한 분기 반짝 성장으로 범위가 출렁이지 않게.
    // 성장 흐름 2%를 넘는 1%p마다 안전 상한 +1.25%p (최대 +12%p — 성장 흐름 11.6%), 마이너스 · 저성장은 기본 범위
    function inflSafeExtra(growth) { return 1.25 * Math.max(0, Math.min(9.6, (Number(growth) || 0) - 2)); }
    const growthTrend = N => (Number.isFinite(N.gTrend) ? N.gTrend : N.growth);
    let keepDisp = false; // 다음 경제 탭 전환 한 번은 오른쪽 시각 화면을 바꾸지 않음 (개요 계기 클릭)
    const EFFECT_TARGETS = { growth: '잠재성장', unemp: '자연실업률', infl: '인플레', mood: '민심', conf: '신뢰도' };
    const DT = { month: 1 / 12, quarter: 1 / 4, year: 1 };
    const UNIT_NAME = { month: '1개월', quarter: '1분기', year: '1년' };
    const IND_PROD = [0.6, 1.2, 1.0]; // 1인당 생산(농 · 제 · 서)
    const RATE_SENS = [0.3, 0.9, 0.6], FX_SENS = [0.4, 1.2, 0.5];

    // ================= 상태 =================
    const DEFAULT_THRESHOLDS = { hyper: 50, default: 150, depression: 25, flight: 20, collapse: 30, revolt: 15 };
    function fresh() {
        return {
            v: 1, turn: 0, unit: 'quarter',
            settings: { bills: true, opinion: true, autoEvents: false, pkgLimit: 3, budgetView: 'hemi', currency: '달러', scale: '억', rankFollow: true, indep: false },
            sys: 0.65,
            nat: { gdp: 10000, growth: 2, infl: 2.5, inflE: 2.5, unemp: 6, rate: 3.5, print: 1.5, cur: 100, conf: 65, debt: 50, balance: 0, yield: 4.5, reserves: 0, mood: 50, gap: 0, rev: 0, spend: 0 },
            spend: Object.fromEntries(BUILTIN_ITEMS.map(i => [i.id, i.s0])),
            taxes: Object.fromEntries(BUILTIN_TAXES.map(t => [t.id, t.rate0])),
            assets: Object.fromEntries(BUILTIN_ASSETS.map(a => [a.id, 50])),
            temps: [], pkgUsed: 0, prevG: null, prevRev: null, prevCur: 100,
            draft: null, budgetBill: null, budgetNo: 0,
            dist: {}, tribute: 10,
            defs: { items: [], assets: [], taxes: [] }, tagPrefs: {},
            rules: {}, ruleStart: 0, thresholds: { ...DEFAULT_THRESHOLDS },
            ceiling: null, autoRepay: false, rankBase: null, rating: null,
            hist: [], events: [], sched: [], preset: '',
            ui: { view: 'overview', range: 'all', chips: ['growth', 'infl', 'unemp', 'rate'], preset: 'cycle', layout: null, log: false, target: 'infl', horizon: 4, mapBy: 'gdppc', full: false },
        };
    }
    let E = fresh();
    let warnings = []; // 정의 검증 경고

    // 정의 = 기본 + 사용자 정의 (같은 id는 사용자 쪽이 숫자만 덮어씀)
    function itemDefs() {
        const out = BUILTIN_ITEMS.map(b => ({ ...b, builtin: true, ...(E.defs.items.find(x => x.id === b.id && x.override) || {}), id: b.id, builtin: true }));
        E.defs.items.filter(x => !x.override).forEach(x => out.push(x));
        const monarchy = !!(window.T66 && window.T66.monarchy);
        return out.filter(d => !d.disabled && (!d.cond || (d.cond === 'monarchy' && monarchy)));
    }
    function assetDefs() {
        const out = BUILTIN_ASSETS.map(b => ({ ...b, builtin: true, ...(E.defs.assets.find(x => x.id === b.id && x.override) || {}), id: b.id, builtin: true }));
        E.defs.assets.filter(x => !x.override).forEach(x => out.push(x));
        return out.filter(a => !a.disabled);
    }
    function taxDefs() {
        const out = BUILTIN_TAXES.map(b => ({ ...b, builtin: true, ...(E.defs.taxes.find(x => x.id === b.id && x.override) || {}), id: b.id, builtin: true }));
        E.defs.taxes.filter(x => !x.override).forEach(x => out.push(x));
        return out.filter(t => !t.disabled);
    }
    // 정의 검증 — 범위 밖 숫자는 자르고, 모르는 효과 대상은 빼고, 자산끼리 돌고 도는 효과는 끈다 (문제 항목만 끄고 경고)
    function validateDefs() {
        warnings = [];
        const assets = assetDefs(), ids = new Set(assets.map(a => a.id));
        // 기본 항목을 고친 칸(override)은 적힌 값만 검사한다 — 없는 값을 기본 숫자로 채우면 그 값이 기본 항목을 덮어써 버린다
        const has = (x, k) => !x.override || x[k] != null;
        E.defs.items.forEach(d => {
            if (has(d, 's0')) d.s0 = num(d.s0, 1, 0, 50);
            if (has(d, 'max')) d.max = num(d.max, 10, 0.1, 60);
            if (has(d, 'eff')) d.eff = num(d.eff, 0.6, 0.2, 1);
            if (has(d, 'jobs')) d.jobs = num(d.jobs, 0, -2, 2);
            if (has(d, 'mood')) d.mood = num(d.mood, 0, -3, 3);
            if (has(d, 'tags')) d.tags = (Array.isArray(d.tags) ? d.tags : []).map(String).slice(0, 6);
            if (d.asset && !ids.has(d.asset)) { warnings.push(`지출 "${d.name}": 없는 자산(${d.asset})이라 자산 축적을 껐습니다`); d.asset = null; }
        });
        E.defs.taxes.forEach(t => {
            if (has(t, 'rate0')) t.rate0 = num(t.rate0, 5, 0, 100);
            if (has(t, 'base')) t.base = num(t.base, 0.1, 0, 5);
            if (has(t, 'L')) t.L = num(t.L, 100, 5, 300);
            if (has(t, 'max')) t.max = num(t.max, 50, 1, 100);
            if (has(t, 'weight') && !['income', 'industry', 'flat', 'wealth', 'imports', 'manufacturing'].includes(t.weight)) t.weight = 'flat';
            if (!has(t, 'side')) return;
            const side = t.side || {}; t.side = {};
            Object.keys(side).forEach(k => { if (['growth', 'infl', 'moodLow', 'moodHigh', 'conf'].includes(k)) t.side[k] = num(side[k], 0, -3, 3); else warnings.push(`세목 "${t.name}": 모르는 부작용(${k})은 무시했습니다`); });
        });
        E.defs.assets.forEach(a => {
            if (has(a, 'decay')) a.decay = num(a.decay, 0.05, 0, 0.5);
            if (!has(a, 'effects')) return;
            const eff = a.effects || {}; a.effects = {};
            Object.keys(eff).forEach(k => { if (EFFECT_TARGETS[k] || ids.has(k)) a.effects[k] = num(eff[k], 0, -1, 1); else warnings.push(`자산 "${a.name}": 모르는 효과 대상(${k})은 무시했습니다`); });
        });
        // 자산 → 자산 순환 찾기
        const g = new Map(assets.map(a => [a.id, Object.keys(a.effects || {}).filter(k => ids.has(k))]));
        const state = new Map(), cyc = new Set();
        const visit = (id, path) => {
            if (state.get(id) === 1) { path.slice(path.indexOf(id)).forEach(x => cyc.add(x)); return; }
            if (state.get(id) === 2) return;
            state.set(id, 1); (g.get(id) || []).forEach(n => visit(n, path.concat(n))); state.set(id, 2);
        };
        assets.forEach(a => visit(a.id, [a.id]));
        if (cyc.size) warnings.push(`자산 순환 참조(${[...cyc].map(id => assets.find(a => a.id === id)?.name || id).join(' → ')}) — 이 자산들끼리의 효과는 끔`);
        E._cyc = [...cyc];
    }

    // ================= 지역구 =================
    const excludedKey = k => (typeof window.isDistrictUnrecovered === 'function' && window.isDistrictUnrecovered(k))
        || (typeof window.isDistrictVassal === 'function' && window.isDistrictVassal(k));
    function activeKeys() {
        let keys = [];
        try { keys = Object.keys(districtGrid.house || {}).filter(k => districtGrid.house[k] && !excludedKey(k)); } catch (e) { keys = []; }
        return keys;
    }
    const popOf = k => { const v = districtPopulation?.house?.[k]; return Number.isFinite(v) && v > 0 ? v : null; };
    const nameOf = k => (k === '__nation' ? '전국' : (districtNames?.house?.[k] || k));
    function defaultDist(k) {
        const h = hash(k);
        const a = 0.03 + (h % 7) / 100, m = 0.28 + ((h >> 3) % 20) / 100;
        return { ind: [r2(a), r2(m), r2(1 - a - m)], age: [0.17, 0.66, 0.17], income: r1(2.6 + ((h >> 8) % 12) / 10), unemp: E.nat.unemp, mood: 50, gdp: 0 };
    }
    const prodOf = d => (d.ind[0] * IND_PROD[0] + d.ind[1] * IND_PROD[1] + d.ind[2] * IND_PROD[2]) * (0.7 + 0.15 * d.income);
    // 지역구 목록을 지금 지도와 맞춘다 — 새로 들어온 땅(통일 · 합병)은 기본값으로, 빠진 땅은 남겨 두되 집계에서 뺀다
    function syncDistricts(allowEvents) {
        const keys = activeKeys();
        const list = keys.length ? keys : ['__nation'];
        const pops = list.map(k => (k === '__nation' ? 1 : popOf(k) || 1));
        const totalPop = sum(pops);
        // 처음 들어온 땅 = 기록이 없거나, 미리 값만 적어 두고 아직 집계된 적이 없는 땅 (예: 서독 프리셋의 동독 주)
        const fresh2 = list.filter(k => !E.dist[k] || !(E.dist[k].gdp > 0));
        const existing = list.filter(k => E.dist[k] && E.dist[k].gdp > 0);
        list.forEach(k => { if (!E.dist[k]) E.dist[k] = defaultDist(k); E.dist[k].pop = k === '__nation' ? 1 : popOf(k) || 1; });
        if (!existing.length) {
            // 처음 — 전국 GDP를 인구 × 1인당 생산 비율로 나눈다
            const w = list.map(k => E.dist[k].pop * prodOf(E.dist[k])), tw = sum(w) || 1;
            list.forEach((k, i) => { E.dist[k].gdp = E.nat.gdp * w[i] / tw; });
        } else if (fresh2.length) {
            // 새로 들어온 땅 — 기존 지역 1인당 GDP 평균 × 그 땅 생산 비율
            const pc = sum(existing.map(k => E.dist[k].gdp)) / sum(existing.map(k => E.dist[k].pop * prodOf(E.dist[k])));
            fresh2.forEach(k => { E.dist[k].gdp = pc * E.dist[k].pop * prodOf(E.dist[k]); });
            const share = sum(fresh2.map(k => E.dist[k].pop)) / totalPop;
            if (allowEvents && E.turn > 0 && share > 0.02) {
                const cost = r1(share * 30);
                E.nat.debt += cost;
                fresh2.forEach(k => { E.dist[k].income = Math.min(E.dist[k].income, 2); E.dist[k].unemp = Math.max(E.dist[k].unemp, 12); });
                addEvent('unify', `새 영토 편입(${fresh2.map(nameOf).slice(0, 3).join(' · ')}${fresh2.length > 3 ? ' 외' : ''}) — 통일 비용으로 국가부채 +${cost}%p`);
            }
        }
        if (keys.length && E.dist.__nation) delete E.dist.__nation;
        E.nat.gdp = sum(list.map(k => E.dist[k].gdp));
        // 지역마다 구조적 실업 차이(처음 실업률 − 전국 평균) — 경기가 좋아져도 지역 격차가 남게
        const L0 = sum(list.map(k => labor(E.dist[k]))) || 1, u0 = sum(list.map(k => E.dist[k].unemp * labor(E.dist[k]))) / L0;
        list.forEach(k => { if (E.dist[k].uBase == null) E.dist[k].uBase = r1(clamp(E.dist[k].unemp - u0, -6, 12)); });
        return list;
    }
    const distList = () => (activeKeys().length ? activeKeys() : ['__nation']).filter(k => E.dist[k]);

    // ================= 프리셋 (시나리오) =================
    const WG_LAND = {
        'Schleswig-Holstein': { ind: [0.07, 0.30, 0.63], income: 3.0, unemp: 9.5 }, 'Hamburg': { ind: [0.01, 0.27, 0.72], income: 4.5, unemp: 10.5 },
        'Niedersachsen': { ind: [0.07, 0.38, 0.55], income: 3.0, unemp: 10.4 }, 'Bremen': { ind: [0.01, 0.33, 0.66], income: 3.3, unemp: 12.6 },
        'Nordrhein-Westfalen': { ind: [0.02, 0.45, 0.53], income: 3.2, unemp: 10.6 }, 'Hessen': { ind: [0.03, 0.38, 0.59], income: 4.0, unemp: 6.9 },
        'Rheinland-Pfalz': { ind: [0.05, 0.42, 0.53], income: 3.0, unemp: 8.0 }, 'Baden-Württemberg': { ind: [0.04, 0.50, 0.46], income: 4.0, unemp: 5.4 },
        'Bayern': { ind: [0.08, 0.43, 0.49], income: 3.5, unemp: 7.1 }, 'Saarland': { ind: [0.02, 0.45, 0.53], income: 2.8, unemp: 12.3 },
        'West-Berlin': { ind: [0.005, 0.32, 0.675], income: 3.2, unemp: 10.0 },
        // 동독 주 — 미수복(1.6.7)일 때는 집계에서 빠지고, 통일하면 이 값으로 들어온다
        'Mecklenburg-Vorpommern': { ind: [0.18, 0.40, 0.42], income: 1.8, unemp: 15 }, 'Brandenburg': { ind: [0.14, 0.45, 0.41], income: 1.8, unemp: 15 },
        'Ost-Berlin': { ind: [0.01, 0.38, 0.61], income: 2.2, unemp: 13 }, 'Sachsen-Anhalt': { ind: [0.10, 0.50, 0.40], income: 1.8, unemp: 16 },
        'Thüringen': { ind: [0.10, 0.50, 0.40], income: 1.8, unemp: 15 }, 'Sachsen': { ind: [0.07, 0.53, 0.40], income: 1.9, unemp: 15 },
    };
    const PRESETS = {
        wg1983: {
            name: '서독 1983', desc: '1983년 독일연방공화국 — 성장 1.6%, 인플레 3.3%, 실업 약 9%, 공정할인율 4%, 국가부채 약 39%, 사회적 시장경제', apply(S2) {
                Object.assign(S2.nat, { gdp: 16700, growth: 1.6, infl: 3.3, inflE: 3, unemp: 9.1, rate: 4, print: 1.2, cur: 100, conf: 84, debt: 39, mood: 48 });
                Object.assign(S2.settings, { currency: '마르크', scale: '억' });
                S2.sys = 0.7; S2.spend.army = 2.0; S2.spend.navy = 1.3;
                Object.keys(WG_LAND).forEach(k => { S2.dist[k] = { ...defaultDist(k), ...deep(WG_LAND[k]), age: [0.19, 0.66, 0.15], mood: 50, gdp: 0 }; });
            },
        },
        stable: { name: '안정기', desc: '인플레 2% · 실업 4% · 부채 50%', apply(S2) { Object.assign(S2.nat, { infl: 2, inflE: 2, unemp: 4, debt: 50, conf: 75 }); } },
        postwar: {
            name: '전후 재건', desc: '인플레 40%를 4턴 고정, 부채 180%, 신뢰도 20', apply(S2) {
                Object.assign(S2.nat, { infl: 40, debt: 180, conf: 20, unemp: 14, mood: 35 });
                S2.rules = { 'nat.infl': { mode: 'locked', value: 40, period: 4 } };
            },
        },
        bailout: {
            name: '구제금융', desc: '기준금리 15%를 8턴 고정, 소득세 20% → 35%(4턴)', apply(S2) {
                Object.assign(S2.nat, { rate: 15, debt: 120, conf: 30 });
                S2.rules = { 'nat.rate': { mode: 'locked', value: 15, period: 8 }, 'taxes.income': { mode: 'transition', from: 20, to: 35, period: 4 } };
            },
        },
        war: {
            name: '전시 체제', desc: '국방(육군) 지출 8%를 6턴 고정', apply(S2) {
                S2.rules = { 'spend.army': { mode: 'locked', value: 8, period: 6 } }; S2.spend.army = 8; S2.sys = 0.35;
            },
        },
    };
    // 집권당 이념으로 경제 체제 기본값 (계획 0 ~ 시장 1)
    function leanOf(p) {
        const ide = p && typeof findIdeology === 'function' ? findIdeology(p.ideologyId) : null;
        const n = String((ide && (ide.parentName || ide.name)) || '') + ' ' + String((ide && ide.name) || '');
        if (/혁명적|공산|마르크스|레닌/.test(n)) return 1;
        if (/사회주의|노동|사민|사회민주/.test(n)) return 0.6;
        if (/녹색|생태|진보/.test(n)) return 0.4;
        if (/자유/.test(n)) return -0.4;
        if (/보수|기독|민족|국가|권위|파시|왕당/.test(n)) return -0.6;
        return 0;
    }
    const rulingParties = () => (Array.isArray(parties) ? parties.filter(p => p.isRuling && p.status !== 'banned') : []);
    function defaultSys() {
        const rp = rulingParties(); if (!rp.length) return 0.65;
        const l = sum(rp.map(leanOf)) / rp.length;
        return r2(clamp(0.65 - l * 0.4, 0.05, 0.95));
    }
    function newEconomy(presetId) {
        const S2 = fresh();
        S2.ui = E.ui || S2.ui;
        S2.sys = defaultSys();
        E = S2;
        const tut = activeKeys().some(k => WG_LAND[k]) && !presetId;
        const id = presetId || (tut ? 'wg1983' : '');
        if (id && PRESETS[id]) { PRESETS[id].apply(E); E.preset = id; }
        E.nat.inflE = E.nat.inflE ?? E.nat.infl;
        E.ruleStart = 0;
        const d0 = readDate(); if (d0) E.dateBase = { key: dateKey(d0, E.unit) };
        syncDistricts(false);
        recomputeBudget(E);
        E.rating = ratingOf(E);
        pushHist(E, null, null, []);
    }

    // ================= 초기값 규칙 (fixed · locked · transition · schedule) =================
    function ruleValue(rule, k) {
        if (rule == null) return null;
        if (typeof rule === 'number') return k === 1 ? rule : null;
        switch (rule.mode) {
            case 'fixed': return k === 1 ? rule.value : null;
            case 'locked': return k <= (rule.period || 1) ? rule.value : null;
            case 'transition': { const p = Math.max(1, rule.period || 1); if (k > p) return null; const t = (k - 1) / Math.max(p - 1, 1); return rule.from + (rule.to - rule.from) * t; }
            case 'schedule': { const g = (rule.segs || []).find(s => k >= s.from && k <= s.to); return g ? g.value : null; }
        }
        return null;
    }
    const ruleK = S2 => S2.turn - S2.ruleStart + 1;
    function ruleLeft(rule, k) {
        if (!rule || typeof rule !== 'object') return 0;
        if (rule.mode === 'locked' || rule.mode === 'transition') return Math.max(0, (rule.period || 1) - k + 1);
        if (rule.mode === 'schedule') return Math.max(0, Math.max(0, ...(rule.segs || []).map(s => s.to)) - k + 1);
        return 0;
    }
    // 그 칸이 지금 시나리오 규칙으로 잠겼는지 — 잠겼으면 이유와 남은 턴
    function lockOf(path) {
        if (path === 'nat.rate' && E.settings.indep) return '중앙은행 독립 — 금리는 테일러 준칙으로 자동 결정';
        const rule = E.rules[path];
        if (!rule || typeof rule !== 'object' || rule.mode === 'fixed') return null;
        const left = ruleLeft(rule, ruleK(E) + 1);
        return left > 0 ? `시나리오 규칙으로 고정 — ${spanLabel(left)} 남음` : null;
    }
    function getPath(S2, path) { const [a, b] = path.split('.'); if (a === 'dist') return null; return S2[a]?.[b]; }
    function setPath(S2, path, v) {
        const parts = path.split('.');
        if (parts[0] === 'dist') { const d = S2.dist[parts[1]]; if (d) d[parts[2]] = v; return; }
        if (S2[parts[0]]) S2[parts[0]][parts[1]] = v;
    }
    function applyRules(S2, k) {
        Object.entries(S2.rules || {}).forEach(([path, rule]) => {
            const v = ruleValue(rule, k);
            if (v == null) return;
            if (path === 'nat.unemp') { const cur = S2.nat.unemp || 1; distList().forEach(dk => { const d = S2.dist[dk]; if (d) d.unemp = d.unemp * v / cur; }); }
            setPath(S2, path, v);
        });
    }

    // ================= 계산 =================
    const labor = d => d.pop * (d.age?.[1] ?? 0.66);
    function nationalFromDist(S2, keys) {
        const ds = keys.map(k => S2.dist[k]).filter(Boolean);
        const L = sum(ds.map(labor)) || 1, P = sum(ds.map(d => d.pop)) || 1;
        return {
            gdp: sum(ds.map(d => d.gdp)),
            unemp: sum(ds.map(d => d.unemp * labor(d))) / L,
            mood: sum(ds.map(d => d.mood * d.pop)) / P,
            old: sum(ds.map(d => (d.age?.[2] ?? 0.17) * d.pop)) / P,
            manuf: sum(ds.map(d => d.ind[1] * d.gdp)) / (sum(ds.map(d => d.gdp)) || 1),
            agri: sum(ds.map(d => d.ind[0] * d.gdp)) / (sum(ds.map(d => d.gdp)) || 1),
            income: sum(ds.map(d => d.income * d.pop)) / P,
        };
    }
    // 세율 효과(래퍼 곡선): 세수 = 기반 × 세율 × (1 − (세율/L)²)
    const taxRevenue = (t, rate) => Math.max(0, t.base * rate * (1 - Math.pow(rate / t.L, 2)));
    function effTaxes(S2) {
        const out = { ...S2.taxes };
        (S2.temps || []).forEach(tp => {
            if (tp.type === 'taxcut') { out.income = (out.income || 0) - 3; out.vat = (out.vat || 0) - 2; }
            if (tp.type === 'taxhike') { out.income = (out.income || 0) + 3; out.vat = (out.vat || 0) + 2; }
        });
        Object.keys(out).forEach(k => { out[k] = Math.max(0, out[k]); });
        return out;
    }
    function effSpend(S2) {
        const out = {};
        itemDefs().forEach(d => { out[d.id] = Math.max(0, S2.spend[d.id] ?? d.s0); });
        return out;
    }
    // 이번 턴의 세입 · 세출(연간, GDP 대비 %) — 화면 표시와 계산이 같은 식을 쓴다
    function budgetOf(S2, nat, keys) {
        const taxes = effTaxes(S2), spend = effSpend(S2), defs = taxDefs();
        const rev = {};
        defs.forEach(t => { rev[t.id] = taxRevenue(t, taxes[t.id] ?? t.rate0); });
        rev._other = 1.0;
        if (window.T68 && (window.T68.vassals || []).length) {
            const vp = sum(Object.keys(window.T68.vassalOf || {}).map(k => popOf(k) || 0));
            const hp = sum(keys.map(k => S2.dist[k]?.pop || 0)) || 1;
            rev._tribute = Math.min(5, (S2.tribute || 0) / 100 * (vp / hp) * 30);
        }
        const N = nationalFromDist(S2, keys);
        const mand = { interest: S2.nat.debt * S2.nat.yield / 100, pension: N.old * 25, unemp: nat.unemp * 0.15 };
        return { rev, spend, mand, totalRev: sum(Object.values(rev)), totalSpend: sum(Object.values(spend)) + sum(Object.values(mand)) };
    }
    function recomputeBudget(S2) {
        const keys = distList();
        const b = budgetOf(S2, S2.nat, keys);
        S2.nat.rev = b.totalRev; S2.nat.spend = b.totalSpend; S2.nat.balance = b.totalRev - b.totalSpend;
        if (S2.prevG == null) S2.prevG = sum(Object.values(b.spend));
        if (S2.prevRev == null) S2.prevRev = b.totalRev;
        return b;
    }
    function assetEffect(S2, target) {
        const cyc = new Set(S2._cyc || []);
        return sum(assetDefs().map(a => {
            const c = (a.effects || {})[target]; if (!c) return 0;
            if (cyc.has(target) && cyc.has(a.id)) return 0;
            return ((S2.assets[a.id] ?? 50) - 50) * c;
        }));
    }
    // ================= 이벤트 (정한 날짜에 위기 · 호황) =================
    // fx — 시작할 때 한 번: conf(신뢰도) · cur(통화가치 %) · debtCut(부채 탕감 %) · lvl(GDP 수준 %)
    //      기간 동안 (연율, 그 기간에 걸친 만큼): g(성장 %/년) · i(인플레 %p) · u(실업 %p, 자연실업률) · cs(신뢰도가 돌아갈 곳)
    const EVENT_TYPES = {
        depression: { name: '대공황', icon: '📉', dur: 36, fx: { g: -9, i: -4, u: 5, conf: -25, cs: -15 } },
        financial: { name: '금융 위기', icon: '🏦', dur: 18, fx: { g: -5, i: -1, u: 2, conf: -20, cs: -10, cur: -10 } },
        oil: { name: '오일 쇼크', icon: '🛢️', dur: 12, fx: { g: -2.5, i: 7, u: 0.5, conf: -5 } },
        hyper: { name: '하이퍼인플레이션', icon: '💸', dur: 12, fx: { i: 150, conf: -25, cs: -15, cur: -40 } },
        default: { name: '국가 부도 (디폴트)', icon: '⚠️', dur: 12, fx: { g: -6, i: 12, u: 2, conf: -35, cs: -20, cur: -35, debtCut: 30 } },
        collapse: { name: '경제 붕괴', icon: '💥', dur: 24, fx: { g: -15, i: 30, u: 8, conf: -40, cs: -25, cur: -30 } },
        disaster: { name: '재해 · 전쟁 피해', icon: '🌋', dur: 6, fx: { lvl: -4, g: -2, i: 3, u: 1, conf: -8 } },
        boom: { name: '호황', icon: '🚀', dur: 24, fx: { g: 4, i: 1.5, u: -1.5, conf: 10, cs: 8 } },
        custom: { name: '직접 설정', icon: '✏️', dur: 12, fx: {} },
    };
    const EV_POWERS = [[0.5, '약함'], [1, '보통'], [1.5, '강함'], [2, '극심']];
    const evFx = e => (e.type === 'custom' ? e.fx || {} : (EVENT_TYPES[e.type] || EVENT_TYPES.custom).fx);
    const evName = e => (e.type === 'custom' && e.name ? e.name : (EVENT_TYPES[e.type] || EVENT_TYPES.custom).name);
    const evBad = e => { const f = evFx(e); return (f.g || 0) + (f.lvl || 0) < 0 || (f.conf || 0) < 0; };
    function fxText(fx, pw = 1) {
        const sg = v => (v > 0 ? '+' : '') + r2(v * pw);
        return [fx.g && `성장 ${sg(fx.g)}%/년`, fx.lvl && `GDP ${sg(fx.lvl)}% 즉시`, fx.i && `인플레 ${sg(fx.i)}%p`, fx.u && `실업 ${sg(fx.u)}%p`, fx.conf && `신뢰도 ${sg(fx.conf)}`, fx.cur && `통화가치 ${sg(fx.cur)}%`, fx.debtCut && `부채 ${r2(fx.debtCut * pw)}% 탕감`].filter(Boolean).join(' · ') || '효과 없음';
    }
    // 다음에 계산할 기간의 달 범위 [시작, 끝) — 달 번호 = 년 × 12 + 월 − 1
    const UNIT_MONTHS = { month: 1, quarter: 3, year: 12 };
    function periodMonths(S2) { if (!S2.dateBase) return null; const per = UNIT_MONTHS[S2.unit] || 3, k = S2.dateBase.key + S2.turn + 1; return [k * per, k * per + per]; }
    // 이번 기간에 걸친 이벤트 효과 — 시작 달이 이 기간 안이면 일어남(fired), 끝 달을 지나면 끝남(ended), 시작 달을 건너뛰었으면 지나감(missed)
    function schedEffects(S2) {
        const out = { g: 0, i: 0, u: 0, cs: 0, lvl: 0, conf: 0, cur: 0, debtCut: 0 };
        const pm = periodMonths(S2);
        if (!pm || !(S2.sched || []).length) return out;
        const [p0, p1] = pm, len = p1 - p0;
        S2.sched.forEach(e => {
            if (e.ended != null || e.missed) return;
            const fx = evFx(e), pw = e.power ?? 1, ms = e.y * 12 + e.m - 1, me = ms + Math.max(1, e.dur || 1);
            if (e.fired == null) {
                if (ms >= p1) return;
                if (ms < p0) { e.missed = true; return; }
                e.fired = S2.turn + 1;
                ['conf', 'cur', 'debtCut', 'lvl'].forEach(k => { out[k] += (fx[k] || 0) * pw; });
            }
            const ov = Math.max(0, Math.min(p1, me) - Math.max(p0, ms)) / len;
            ['g', 'i', 'u', 'cs'].forEach(k => { out[k] += (fx[k] || 0) * pw * ov; });
            if (me <= p1) e.ended = S2.turn + 1;
        });
        return out;
    }

    // 한 턴 — S2를 바꾼다 (예측 · 민감도는 복사본에서). 반환: 분해 · 예산 기록
    function step(S2, r, opts) {
        const o = opts || {};
        const dt = DT[S2.unit] || 0.25, N = S2.nat;
        const keys = o.keys || distList();
        // 이벤트 — 시작할 때 한 번 (신뢰도 · 통화가치 · 부채 탕감)
        const ev = schedEffects(S2);
        if (ev.conf) N.conf = clamp(N.conf + ev.conf, 0, 100);
        if (ev.cur) N.cur = clamp(N.cur * (1 + ev.cur / 100), 2, 400);
        if (ev.debtCut) N.debt = Math.max(0, N.debt * (1 - Math.min(100, ev.debtCut) / 100));
        const evG = ev.g * dt + ev.lvl;
        // 0. 진행 중인 패키지 정책
        let print = N.print, rateAdj = 0, premAdj = 0, qeDemand = 0;
        (S2.temps || []).forEach(tp => {
            if (tp.type === 'qe') { print += 3; rateAdj -= 0.5; premAdj -= 1; qeDemand += 0.3; }
            if (tp.type === 'qt') { print -= 2; rateAdj += 0.5; }
        });
        const sys = S2.sys ?? 0.65;
        // 중앙은행 독립 — 테일러 준칙
        if (S2.settings.indep && !(S2.rules['nat.rate'] && ruleValue(S2.rules['nat.rate'], ruleK(S2) + 1) != null)) N.rate = r2(clamp(2 + N.infl + 0.5 * (N.infl - 2) + 0.5 * N.gap, 0, 40));
        const rate = N.rate + rateAdj;
        const NN = nationalFromDist(S2, keys);
        const spend = effSpend(S2), G = sum(Object.values(spend));
        const b0 = budgetOf(S2, N, keys);
        // 1. 잠재성장
        const pot = 1.6 + assetEffect(S2, 'growth') + 0.8 * (sys - 0.5) - (N.conf < 25 ? 1 : 0);
        // 2. 수요 충격 (그 턴 GDP 수준 변화 %)
        const mult = 0.9 * (0.5 + N.conf / 100);
        const fiscal = (G - (S2.prevG ?? G)) * mult - (b0.totalRev - (S2.prevRev ?? b0.totalRev)) * 0.5;
        const realRate = rate - N.inflE;
        const monetary = (clamp(-0.5 * (realRate - 2), -6, 6) + qeDemand) * dt;
        // 하이퍼인플레이션은 경제를 무너뜨린다 (거래 · 저축 · 투자 마비)
        const hyperDrag = -Math.min(15, 0.04 * Math.max(0, N.infl - 30)) * dt;
        const m = print * 4; // 연간 통화 증가율
        const money = clamp(0.08 * (m - (pot + 2)), -3, 6) * dt;
        const fx = -0.06 * (N.cur - (S2.prevCur ?? N.cur)) * NN.manuf * 2;
        const taxes = effTaxes(S2);
        const taxSide = sum(taxDefs().map(t => ((taxes[t.id] ?? t.rate0) - t.rate0) * ((t.side || {}).growth || 0))) * dt;
        const noise = r ? gauss(r) * (0.5 + 0.8 * sys) * Math.sqrt(dt) : 0;
        // 지역구마다
        const jobsBy = {};
        itemDefs().forEach(d => { jobsBy[d.id] = ((spend[d.id] ?? d.s0) - d.s0) * (d.jobs || 0); });
        const jobs = sum(Object.values(jobsBy));
        const agriJobs = jobsBy.agri || 0;
        const un = 3 + 4 * sys + assetEffect(S2, 'unemp');
        const before = sum(keys.map(k => S2.dist[k].gdp));
        const dlnBy = {};
        keys.forEach(k => {
            const d = S2.dist[k];
            const rs = (d.ind[0] * RATE_SENS[0] + d.ind[1] * RATE_SENS[1] + d.ind[2] * RATE_SENS[2]) / 0.65;
            const fs = (d.ind[0] * FX_SENS[0] + d.ind[1] * FX_SENS[1] + d.ind[2] * FX_SENS[2]) / 0.7;
            const fis = 1 + 0.1 * (3 - d.income);
            const local = r ? gauss(r) * 0.15 * Math.sqrt(dt) : 0;
            const dln = pot * dt + fiscal * fis + monetary * rs + money + fx * fs + taxSide + noise + local + hyperDrag + evG;
            dlnBy[k] = dln;
            d.gdp *= Math.exp(dln / 100);
            // 실업 — 오쿤의 법칙 + 자연실업률로 수렴 (농업보조는 농업 지역 일자리에 더 크게)
            const unK = un + jobs - agriJobs + agriJobs * d.ind[0] * 8 + (d.uBase || 0) * 0.8 + ev.u;
            d.unemp = clamp(d.unemp - 0.4 * (dln - pot * dt) + (unK - d.unemp) * (1 - Math.exp(-0.8 * dt)), 0.5, 60);
        });
        const after = sum(keys.map(k => S2.dist[k].gdp));
        const dlnNat = Math.log(after / before) * 100;
        // 성장률은 전년 대비 (통계처럼) — 한 기간 변화를 연율로 늘리면 1개월 · 1분기 흔들림이 12배 · 4배로 커져 미친 듯이 오르내린다.
        // 누적 로그 지수(같은 지역구끼리 잰 변화만 — 통일로 늘어난 지역구는 성장이 아님)를 1년 전과 비교
        N.growthQ = dlnNat / dt;
        const c0 = S2.clock || 0, buf = S2.gbuf && S2.gbuf.length ? S2.gbuf : (S2.gbuf = [{ y: c0 - 1, L: -(N.growth || 0) }, { y: c0, L: 0 }]);
        S2.clock = c0 + dt;
        const Lnow = buf[buf.length - 1].L + dlnNat;
        buf.push({ y: S2.clock, L: Lnow });
        const yAgo = S2.clock - 1;
        while (buf.length > 2 && buf[1].y <= yAgo + 1e-9) buf.shift();
        const [p0, p1] = buf, Lthen = p0.y >= yAgo - 1e-9 || p1.y === p0.y ? p0.L : p0.L + (p1.L - p0.L) * (yAgo - p0.y) / (p1.y - p0.y);
        N.growth = p0.y > yAgo + 1e-9 ? (Lnow - p0.L) / (S2.clock - p0.y) : Lnow - Lthen;
        N.gap = clamp(N.gap * Math.exp(-1.2 * dt) + (dlnNat - pot * dt), -15, 15);
        // 성장 흐름 — 최근 약 3년 성장률의 지수 평균 (인플레 안전 범위 · 변동성의 기준)
        N.gTrend = Number.isFinite(N.gTrend) ? N.gTrend + (N.growth - N.gTrend) * (1 - Math.exp(-dt / 3)) : N.growth;
        const N2 = nationalFromDist(S2, keys);
        N.unemp = N2.unemp; N.gdp = after;
        // 3. 인플레 — 기대(신뢰도가 높으면 목표 2%에 고정) + 과열 + 과잉 통화 + 수입물가
        const w = clamp(N.conf / 100 + (S2.settings.indep ? 0.15 : 0), 0, 1);
        // 신뢰가 무너지면 지난 인플레를 따라가되, 통화 증가가 멈추면 기대도 꺾인다 (하이퍼인플레가 끝날 수 있게)
        const inflE = w * 2 + (1 - w) * (0.6 * N.infl + 0.4 * Math.max(-2, m - pot));
        const dCur = N.cur - (S2.prevCur ?? N.cur);
        // 수요 견인(총수요) — 산출 갭(경기 과열)이 클수록 더 가파르게: 과열 쪽은 볼록 (총수요가 공급 능력을 넘으면 물가가 급히 오름)
        const pGap = 0.35 * N.gap + 0.06 * Math.max(0, N.gap) ** 2, pMoney = 0.45 * (m - pot - 2), pImport = clamp(-0.3 * dCur / dt * 0.25, -10, 30);
        const pTax = sum(taxDefs().map(t => ((taxes[t.id] ?? t.rate0) - t.rate0) * ((t.side || {}).infl || 0))) + assetEffect(S2, 'infl');
        let target = inflE + pGap + pMoney + pImport + pTax + ev.i;
        if (m > 40) target *= 1 + (m - 40) / 40;
        const k = 1 - Math.exp(-2.5 * dt);
        const inflPrev = N.infl;
        N.infl = clamp(N.infl + (target - N.infl) * k, -15, 5000);
        // 인플레 변동 — 고성장 · 과열일수록 물가가 크게 출렁인다 (저성장 안정기에는 거의 없음). 흔들림 없는 예측(r 없음)에는 안 들어감
        if (r) N.infl = clamp(N.infl + gauss(r) * (0.3 + 0.35 * Math.max(0, growthTrend(N) - 3) + 0.15 * Math.max(0, N.gap)) * Math.sqrt(dt), -15, 5000);
        N.inflE = inflE;
        // 4. 통화가치
        S2.prevCur = N.cur;
        const dcur = (0.5 * (rate - N.infl - 1) - 0.35 * (N.infl - 2.5) + 0.05 * (N.conf - 60) - 0.25 * Math.max(0, m - 8)) * dt;
        N.cur = clamp(N.cur * (1 + dcur / 100), 2, 400);
        // 5. 재정
        const b = budgetOf(S2, N, keys);
        let disc = sum(Object.values(b.spend)), mand = sum(Object.values(b.mand)), rev = b.totalRev;
        let balance = rev - disc - mand, shutdown = false;
        if (S2.ceiling != null && N.debt >= S2.ceiling && balance < 0) { disc = Math.max(0, disc + balance); balance = rev - disc - mand; if (balance < 0) balance = 0; shutdown = true; }
        const nominal = (N.growth + N.infl) / 100;
        if (balance > 0) { if (S2.autoRepay) N.debt = Math.max(0, N.debt - balance * dt); else N.reserves += balance * dt; }
        else N.debt += -balance * dt;
        N.debt = Math.max(0, N.debt / (1 + nominal * dt));
        N.reserves = Math.max(0, N.reserves / (1 + nominal * dt));
        N.balance = balance; N.rev = rev; N.spend = disc + mand;
        S2.prevG = G; S2.prevRev = rev;
        // 6. 자산 — 축적 · 감가상각 · 수확체감 (+ 자산끼리 효과)
        const ad = assetDefs(), cyc = new Set(S2._cyc || []);
        ad.forEach(a => {
            const items = itemDefs().filter(d => d.asset === a.id);
            let gain = 0;
            items.forEach(d => { const c = 50 * a.decay / Math.pow(Math.max(d.s0, 0.1), d.eff || 0.6) / Math.max(1, items.length); gain += c * Math.pow(Math.max(0, spend[d.id] ?? d.s0), d.eff || 0.6); });
            const cross = sum(ad.filter(x => x.id !== a.id && (x.effects || {})[a.id] && !(cyc.has(x.id) && cyc.has(a.id))).map(x => ((S2.assets[x.id] ?? 50) - 50) * x.effects[a.id]));
            const A = S2.assets[a.id] ?? 50;
            S2.assets[a.id] = clamp(A * (1 - a.decay * dt) + (items.length ? gain : a.decay * 50) * dt + cross * dt, 0, 200);
        });
        // 7. 신뢰도 · 국채금리
        const safeX = inflSafeExtra(growthTrend(N)); // 인플레 안전 범위의 성장 흐름 가산
        const Cstar = 77 - 0.25 * Math.max(0, N.debt - 60) - 1.2 * Math.max(0, N.infl - 4 - safeX) - 1.5 * Math.max(0, -balance - 3) + 0.12 * (N.mood - 50) - 0.6 * Math.max(0, m - 10) + (S2.settings.indep ? 5 : 0) + assetEffect(S2, 'conf') - (shutdown ? 10 : 0) + ev.cs;
        N.conf = clamp(N.conf + (Cstar - N.conf) * (1 - Math.exp(-1.4 * dt)), 0, 100);
        N.yield = Math.max(0, rate + Math.max(0, (65 - N.conf) / 6) + Math.max(0, (N.debt - 90) / 20) + premAdj);
        // 8. 지역구 민심 · 소득등급
        const welfareGap = sum(itemDefs().filter(d => d.welfare).map(d => (spend[d.id] ?? d.s0) - d.s0));
        const moodItems = sum(itemDefs().filter(d => !d.welfare).map(d => ((spend[d.id] ?? d.s0) - d.s0) * (d.mood || 0)));
        const moodWelfare = sum(itemDefs().filter(d => d.welfare).map(d => ((spend[d.id] ?? d.s0) - d.s0) * (d.mood || 0)));
        const assetMood = assetEffect(S2, 'mood');
        keys.forEach(kk => {
            const d = S2.dist[kk];
            const gA = dlnBy[kk] / dt;
            const incW = 1 + 0.25 * (3 - d.income);
            let tax = 0;
            taxDefs().forEach(t => {
                const dlt = (taxes[t.id] ?? t.rate0) - t.rate0, s = t.side || {};
                if (s.moodHigh) tax += dlt * s.moodHigh * Math.max(0, (d.income - 2.5) / 2);
                if (s.moodLow) tax += dlt * s.moodLow * Math.max(0, (3.5 - d.income) / 2);
            });
            const Mstar = 55 - 1.5 * (d.unemp - 5) - 0.8 * Math.max(0, N.infl - 3 - safeX) - 0.1 * Math.max(0, N.infl - 15 - 2 * safeX) + 0.8 * clamp(gA, -10, 10)
                + moodItems + moodWelfare * incW + assetMood + tax - (shutdown ? 5 : 0);
            d.mood = clamp(d.mood + (clamp(Mstar, 0, 100) - d.mood) * (1 - Math.exp(-1.6 * dt)), 0, 100);
            d.income = clamp(d.income + (0.03 * (gA - 1.5) - 0.02 * Math.max(0, d.unemp - 7) + (welfareGap > 0 ? 0.01 * welfareGap : 0)) * dt, 1, 5);
        });
        N.mood = nationalFromDist(S2, keys).mood;
        // 9. 패키지 정책 남은 턴
        S2.temps = (S2.temps || []).map(tp => ({ ...tp, left: tp.left - 1 })).filter(tp => tp.left > 0);
        S2.pkgUsed = 0;
        return {
            dec: {
                g: { pot: pot + hyperDrag / dt, fiscal: fiscal / dt, monetary: monetary / dt, money: money / dt, fx: fx / dt, tax: taxSide / dt, noise: (noise) / dt, event: evG / dt },
                p: { exp: inflE, gap: pGap, money: pMoney, imp: pImport, other: pTax + ev.i, adj: N.infl - target, prev: inflPrev },
            },
            bud: { rev: b.rev, spend: b.spend, mand: b.mand, disc, shutdown },
            realRate, m, dlnBy,
        };
    }

    // ================= 신용등급 · 상태 · 경고 =================
    const GRADES = [[85, 'AAA', '최우량'], [75, 'AA', '우량'], [65, 'A', '투자 적격'], [55, 'BBB', '투자 적격(하한)'], [45, 'BB', '투기 등급'], [35, 'B', '투기 등급'], [20, 'CCC', '부도 위험'], [-1, 'D', '부도']];
    function ratingOf(S2) {
        const s = S2.nat.conf - Math.max(0, S2.nat.debt - 100) * 0.15;
        return (GRADES.find(g => s >= g[0]) || GRADES[GRADES.length - 1]).slice(1);
    }
    function bandsOf(key) {
        const t = E.thresholds;
        switch (key) {
            case 'infl': {
                // 안전(good) 상한 5% · 경고 상한 15%가 성장률에 따라 늘어난다 (inflSafeExtra) — 하이퍼인플레 기준은 그대로
                const x = inflSafeExtra(growthTrend(E.nat));
                const good = Math.min(5 + x, t.hyper), warn = Math.min(Math.max(15 + 2 * x, good), t.hyper);
                return [{ from: -5, to: 0, status: 'warning' }, { from: 0, to: good, status: 'good' }, { from: good, to: warn, status: 'warning' }, { from: warn, to: t.hyper, status: 'serious' }, { from: t.hyper, to: 1e9, status: 'critical' }];
            }
            case 'growth': return [{ from: -1e9, to: -3, status: 'critical' }, { from: -3, to: -1, status: 'serious' }, { from: -1, to: 0.5, status: 'warning' }, { from: 0.5, to: 6, status: 'good' }, { from: 6, to: 1e9, status: 'warning' }];
            case 'unemp': return [{ from: 0, to: 6, status: 'good' }, { from: 6, to: 10, status: 'warning' }, { from: 10, to: t.depression, status: 'serious' }, { from: t.depression, to: 1e9, status: 'critical' }];
            case 'debt': return [{ from: 0, to: 60, status: 'good' }, { from: 60, to: 90, status: 'warning' }, { from: 90, to: t.default, status: 'serious' }, { from: t.default, to: 1e9, status: 'critical' }];
            case 'mood': return [{ from: 0, to: t.revolt, status: 'critical' }, { from: t.revolt, to: 30, status: 'serious' }, { from: 30, to: 45, status: 'warning' }, { from: 45, to: 101, status: 'good' }];
            case 'conf': return [{ from: 0, to: t.flight, status: 'critical' }, { from: t.flight, to: 40, status: 'serious' }, { from: 40, to: 55, status: 'warning' }, { from: 55, to: 101, status: 'good' }];
        }
        return [];
    }
    const statusOf = (key, v) => (bandsOf(key).find(b => v >= b.from && v < b.to) || { status: 'good' }).status;
    function signals(S2) {
        const N = S2.nat, out = [];
        const add = (id, label, st, on) => out.push({ id, label, status: st, on });
        add('negative', '실질 마이너스 성장', N.growth < -1 ? 'serious' : 'warning', N.growth < 0);
        add('deficit', '과도한 적자', N.balance < -9 ? 'serious' : 'warning', N.balance < -6);
        add('reserves', '국고 과잉', 'warning', N.reserves > 15);
        add('financial', '금융 위기', 'critical', N.conf < 30 && N.yield - N.rate > 4);
        add('printing', '통화 붕괴 위험', N.print >= S2.thresholds.collapse ? 'critical' : 'serious', N.print > 10);
        if (S2.ceiling != null) add('ceiling', '부채 한도 근접', N.debt >= S2.ceiling ? 'critical' : 'warning', N.debt > S2.ceiling - 5);
        // 위기 단계 — 위기 기준(설정)을 넘으면 '위기', 가까워지면 '위험'
        const t = S2.thresholds;
        const dflt = N.debt > t.default || (N.conf < t.flight && N.yield - N.rate > 8);
        add('default', '국가 부도', dflt ? 'critical' : 'serious', dflt || N.debt > t.default * 0.85);
        add('hyper', '하이퍼인플레이션', N.infl > t.hyper ? 'critical' : 'serious', N.infl > t.hyper * 0.5);
        add('depression', '대공황', N.unemp > t.depression ? 'critical' : 'serious', N.unemp > t.depression * 0.7);
        add('flight', '자본 도피', N.conf < t.flight ? 'critical' : 'serious', N.conf < t.flight + 10);
        // 경제 붕괴 — 성장률 -10% 아래로 추락하거나 위기가 두 개 이상 겹칠 때
        const crises = out.filter(s => s.on && s.status === 'critical' && s.id !== 'ceiling').length;
        add('collapse', '경제 붕괴', 'critical', N.growth < -10 || crises >= 2);
        return out;
    }
    const PRINT_BANDS = [[-99, '통화 회수'], [0, '발행 거의 없음'], [0.5, '보통'], [3, '많음'], [10, '매우 많음'], [30, '통화 붕괴 위험']];
    const printBand = p => PRINT_BANDS.filter(b => p >= b[0]).pop()[1];

    // ================= 기록 =================
    function turnLabel(S2, t) {
        const base = S2.dateBase;
        if (base) {
            const keyNow = base.key + t;
            if (S2.unit === 'year') return `${keyNow}`;
            if (S2.unit === 'quarter') return `${Math.floor(keyNow / 4)} ${keyNow % 4 + 1}분기`;
            return `${Math.floor(keyNow / 12)}.${String(keyNow % 12 + 1).padStart(2, '0')}`;
        }
        return `T${t}`;
    }
    function pushHist(S2, rec, label, ev) {
        const N = S2.nat;
        S2.hist.push({
            t: S2.turn, label: label || turnLabel(S2, S2.turn),
            yr: S2.clock || 0, n: { gdp: N.gdp, growth: N.growth, gq: N.growthQ, infl: N.infl, unemp: N.unemp, rate: N.rate, yield: N.yield, debt: N.debt, balance: N.balance, cur: N.cur, conf: N.conf, mood: N.mood, print: N.print, reserves: N.reserves, rev: N.rev, spend: N.spend, gap: N.gap },
            dec: rec ? rec.dec : null, bud: rec ? { rev: rec.bud.rev, spend: rec.bud.spend, mand: rec.bud.mand } : budgetSnap(S2),
            a: { ...S2.assets }, ev: ev || [],
        });
        if (S2.hist.length > 600) S2.hist.splice(0, S2.hist.length - 600);
    }
    function budgetSnap(S2) { const b = budgetOf(S2, S2.nat, distList()); return { rev: b.rev, spend: b.spend, mand: b.mand }; }
    function addEvent(kind, label) {
        const ev = { t: E.turn, kind, label };
        E.events.push(ev);
        if (E.events.length > 300) E.events.splice(0, E.events.length - 300);
        if (E._pendingEv) E._pendingEv.push(ev);
        return ev;
    }

    // ================= 턴 진행 =================
    function crisisCheck(prev) {
        const N = E.nat, t = E.thresholds, out = [];
        const cross = (now, before, label, kind) => { if (now && !before) out.push(addEvent(kind, label)); };
        cross(N.infl > t.hyper, prev.infl > t.hyper, `하이퍼인플레이션 — 인플레 ${pct(N.infl)}`, 'crisis');
        cross(N.debt > t.default, prev.debt > t.default, `국가부도 위기 — 부채 ${pct(N.debt, 0)} (GDP 대비)`, 'crisis');
        cross(N.unemp > t.depression, prev.unemp > t.depression, `대공황 — 실업률 ${pct(N.unemp)}`, 'crisis');
        if (N.conf < t.flight && !(prev.conf < t.flight)) { N.cur *= 0.85; out.push(addEvent('crisis', `자본 도피 — 신뢰도 ${N.conf.toFixed(0)}, 통화가치 15% 폭락`)); }
        cross(N.print > t.collapse, prev.print > t.collapse, `통화 붕괴 — 화폐발행률 ${pct(N.print)}/분기`, 'crisis');
        cross(N.mood < t.revolt, prev.mood < t.revolt, `민심 붕괴(${N.mood.toFixed(0)}) — 쿠데타 · 혁명 위험`, 'revolt');
        const rt = ratingOf(E);
        if (E.rating && rt[0] !== E.rating[0]) out.push(addEvent('rating', `신용등급 ${E.rating[0]} → ${rt[0]} (${rt[1]})`));
        E.rating = rt;
        return out;
    }
    // 여론 반영 — 민심 변화만큼 집권당 지지율 · 지역구 성향을 조금씩 (같은 방향으로 계속 흘러가지 않게 "변화량"만)
    function opinionFeedback(prevMood, prevDistMood) {
        if (!E.settings.opinion) return;
        const rp = rulingParties(); if (!rp.length) return;
        const rid = new Set(rp.map(p => String(p.id)));
        const dM = E.nat.mood - prevMood;
        try {
            (typeof chamberList === 'function' ? chamberList() : ['house']).forEach(ch => {
                const st = elecStore && elecStore[ch]; if (!st) return;
                const ids = Object.keys(st).filter(id => (st[id]?.prob || 0) > 0);
                const rIds = ids.filter(id => rid.has(String(id))), oIds = ids.filter(id => !rid.has(String(id)));
                if (!rIds.length || !oIds.length) return;
                const move = clamp(dM * 0.3, -3, 3);
                const rT = sum(rIds.map(id => st[id].prob)), oT = sum(oIds.map(id => st[id].prob));
                rIds.forEach(id => { st[id].prob = r1(Math.max(0, st[id].prob + move * st[id].prob / rT)); });
                oIds.forEach(id => { st[id].prob = r1(Math.max(0, st[id].prob - move * st[id].prob / oT)); });
            });
            if (typeof districtSvgTendency === 'object' && districtSvgTendency) {
                distList().forEach(k => {
                    const d = E.dist[k]; if (!d || prevDistMood[k] == null) return;
                    const dm = d.mood - prevDistMood[k];
                    Object.values(districtSvgTendency[k] || {}).forEach(vals => {
                        if (!vals || typeof vals !== 'object') return;
                        Object.keys(vals).forEach(pid => { if (rid.has(String(pid)) && vals[pid] > 0) vals[pid] = r1(clamp(vals[pid] + dm * 0.4, 0, 100)); });
                    });
                });
            }
        } catch (e) { /* 여론 화면 없음 */ }
    }
    function runTurns(n) {
        n = clamp(Math.floor(n), 0, 120);
        if (!n) return;
        const evAll = [];
        for (let i = 0; i < n; i++) {
            E._pendingEv = [];
            syncDistricts(true);
            const prev = { ...E.nat }, prevDist = Object.fromEntries(distList().map(k => [k, E.dist[k].mood]));
            const seed = hash(`${E.turn}:${E.nat.gdp.toFixed(3)}:${Date.now()}`);
            const rec = step(E, rng(seed));
            E.turn++;
            (E.sched || []).forEach(e => {
                if (e.fired === E.turn && !e.told) { e.told = true; addEvent(evBad(e) ? 'crisis' : 'policy', `${evName(e)} — ${fxText(evFx(e), e.power ?? 1)}`); }
                if (e.ended === E.turn && e.fired !== E.turn && !e.toldEnd) { e.toldEnd = true; addEvent('policy', `${evName(e)} 끝남`); }
            });
            applyRules(E, ruleK(E));
            E.nat.unemp = nationalFromDist(E, distList()).unemp;
            crisisCheck(prev);
            opinionFeedback(prev.mood, prevDist);
            pushHist(E, rec, null, E._pendingEv.slice());
            evAll.push(...E._pendingEv);
            E._pendingEv = null;
        }
        afterTurns(evAll);
    }
    function afterTurns(evs) {
        checkBudgetBill();
        // 1.6.5 국가 순위 — 우리나라 점수가 GDP를 따라감
        try {
            const rows = window.T65 && window.T65.ranking && window.T65.ranking.rows;
            const self = rows && rows.find(r => r.self);
            if (self && E.settings.rankFollow) {
                if (!E.rankBase) E.rankBase = { score: Number(self.score) || 50, gdp: E.hist[0]?.n.gdp || E.nat.gdp };
                self.score = Math.round(clamp(E.rankBase.score * Math.sqrt(E.nat.gdp / E.rankBase.gdp), 1, 100));
            }
            // 위기 · 신용등급 변화는 세력 변화(1.6.5) 기록에도
            if (window.T65 && typeof window.T65.record === 'function') evs.filter(e => e.kind === 'crisis' || e.kind === 'unify').forEach(e => window.T65.record(`[경제] ${e.label}`));
        } catch (e) { /* 1.6.5 없음 */ }
        refreshAll();
        const big = evs.filter(e => e.kind === 'crisis' || e.kind === 'revolt' || e.kind === 'unify' || e.kind === 'shutdown');
        if (big.length) {
            showCustomAlert('경제 소식\n\n' + big.map(e => '• ' + e.label).join('\n') + (big.some(e => e.kind === 'revolt') ? '\n\n민심이 무너지면 쿠데타 · 혁명이 일어날 수 있습니다 (경제 › 개요의 경고에서 바로 갈 수 있음).' : ''));
            if (E.settings.autoEvents && big.some(e => e.kind === 'revolt')) goRevolt();
        } else if (evs.length && typeof window.showKbdToast === 'function') window.showKbdToast(evs.map(e => e.label).join(' · '));
    }
    function goRevolt() {
        if (document.getElementById('subTabRevolution')) switchSubTab('cabinet', 'revolution');
        else if (document.getElementById('subTabCoup')) switchSubTab('cabinet', 'coup');
    }

    // ================= 날짜 연동 =================
    // 경제는 게임 날짜를 따라간다 — 계산을 마친 시점(dateBase.key + turn)과 지금 날짜의 분기(개월 · 년)를 견줘
    // 날짜가 앞서 있으면 그만큼 계산하고, 날짜를 되돌렸으면 경제는 그대로 두고 지금 날짜부터 이어서 센다
    function readDate() {
        const y = parseInt(document.getElementById('nationDateYear')?.value, 10), m = parseInt(document.getElementById('nationDateMonth')?.value, 10) || 1;
        return Number.isFinite(y) ? { y, m } : null;
    }
    const dateKey = (d, unit) => (unit === 'year' ? d.y : unit === 'quarter' ? d.y * 4 + Math.floor((d.m - 1) / 3) : d.y * 12 + d.m - 1);
    const keyNow = () => { const d = readDate(); return d ? dateKey(d, E.unit) : null; };
    function ensureDateBase(at) {
        const d = at || readDate();
        if (d && !E.dateBase) E.dateBase = { key: dateKey(d, E.unit) - E.turn };
        if (E.hist.length && E.dateBase) E.hist.forEach(h => { if (/^T\d+$/.test(h.label)) h.label = turnLabel(E, h.t); });
    }
    // 지금 날짜를 계산을 마친 시점으로 (계산 없이)
    function reanchor() { const k = keyNow(); if (k != null) E.dateBase = { key: k - E.turn }; }
    // 한 번에 묻지 않고 계산하는 최대 길이 (넘으면 확인) · 한 번에 계산하는 최대 길이
    const AUTO_MAX = { month: 36, quarter: 20, year: 10 }, RUN_MAX = 120;
    let asking = false;
    function syncDate() {
        const k = keyNow();
        if (k == null || asking || !inited || !E.hist.length) return;
        ensureDateBase();
        const gap = k - (E.dateBase.key + E.turn);
        if (!gap) return;
        if (gap < 0) {
            reanchor(); refreshAll();
            if (typeof window.showKbdToast === 'function') window.showKbdToast('날짜를 되돌려도 경제 기록은 그대로 — 지금 날짜부터 이어서 계산합니다');
            return;
        }
        // 너무 길면 앞부분은 건너뛰고 (기준만 옮김) 지금 날짜까지 RUN_MAX만큼만 계산
        const run = () => { const n = Math.min(gap, RUN_MAX); E.dateBase.key += gap - n; runTurns(n); };
        if (gap <= AUTO_MAX[E.unit]) { run(); return; }
        asking = true;
        showCustomConfirm(`날짜가 ${spanLabel(gap)} 앞으로 갔습니다. 그동안의 경제를 계산할까요?${gap > RUN_MAX ? `\n(한 번에 최근 ${spanLabel(RUN_MAX)}까지만 계산하고 그 앞은 건너뜁니다)` : ''}\n\n취소하면 경제는 그대로 두고 지금 날짜부터 이어서 계산합니다.`,
            () => { asking = false; run(); }, () => { asking = false; reanchor(); refreshAll(); });
    }
    const origAdvance = window.advanceNationDate;
    if (typeof origAdvance === 'function') {
        window.advanceNationDate = function () {
            const b = readDate();
            const r = origAdvance.apply(this, arguments);
            const a = readDate();
            // 경제를 아직 안 열었으면 넘기기 전 날짜에서 시작한 것으로
            if (b && a && !(inited && E.hist.length) && dateKey(a, E.unit) > dateKey(b, E.unit)) {
                ensureInit();
                E.dateBase = { key: dateKey(b, E.unit) - E.turn };
                E.hist.forEach(h => { h.label = turnLabel(E, h.t); });
            }
            syncDate();
            return r;
        };
    }
    // 국가 › 날짜 칸을 직접 고쳐도 (입력을 마쳤을 때)
    document.addEventListener('change', e => { const id = e.target && e.target.id; if (id === 'nationDateYear' || id === 'nationDateMonth') syncDate(); });
    // 다음 분기(개월 · 년) — 날짜가 있으면 날짜를 넘기고, 경제는 날짜를 따라 계산
    function nextTurn(n = 1) {
        if (readDate() && typeof window.advanceNationDate === 'function') { window.advanceNationDate(n * (E.unit === 'year' ? 12 : E.unit === 'quarter' ? 3 : 1), 'month'); return; }
        runTurns(n);
    }
    // 기간 글자 — 분기 4개 = 1년처럼 날짜 단위로
    function spanLabel(n) {
        n = Math.round(n);
        if (E.unit === 'year') return `${n}년`;
        const per = E.unit === 'quarter' ? 4 : 12, word = E.unit === 'quarter' ? '분기' : '개월';
        return n % per === 0 ? `${n / per}년` : n > per ? `${Math.floor(n / per)}년 ${n % per}${word}` : `${n}${word}`;
    }
    const UNIT_WORD = { month: '개월', quarter: '분기', year: '년' };

    // ================= 예측 · 민감도 =================
    // 예측은 아직 안 일어난 이벤트를 모른다 (진행 중인 것만 이어감)
    const simClone = () => { const c = deep({ ...E, hist: [], events: [], ui: null, sched: (E.sched || []).filter(e => e.fired != null && e.ended == null) }); c._cyc = E._cyc; return c; };
    function withDraft(S2) { if (E.draft) { S2.spend = { ...E.draft.spend }; S2.taxes = { ...E.draft.taxes }; } return S2; }
    const VAR = {
        growth: { label: '성장률', unit: '%', get: s => s.nat.growth, color: 'var(--s1)' },
        infl: { label: '인플레', unit: '%', get: s => s.nat.infl, color: 'var(--s2)' },
        unemp: { label: '실업률', unit: '%', get: s => s.nat.unemp, color: 'var(--s3)' },
        rate: { label: '기준금리', unit: '%', get: s => s.nat.rate, color: 'var(--s4)' },
        yield: { label: '국채금리', unit: '%', get: s => s.nat.yield, color: 'var(--s7)' },
        debt: { label: '부채비율', unit: '%', get: s => s.nat.debt, color: 'var(--s8)' },
        balance: { label: '재정수지', unit: '%', get: s => s.nat.balance, color: 'var(--s6)' },
        mood: { label: '민심', unit: '', get: s => s.nat.mood, color: 'var(--s5)' },
        conf: { label: '신뢰도', unit: '', get: s => s.nat.conf, color: 'var(--s6)' },
        cur: { label: '통화가치', unit: '', get: s => s.nat.cur, color: 'var(--s7)' },
    };
    // 예측 부채꼴 — 지금 정책을 유지할 때 H턴 앞까지, 흔들림을 바꿔 여러 번 돌린 분위수
    function forecast(vars, H = 8, runs = 48, useDraft = false) {
        const keys = distList();
        const out = Object.fromEntries(vars.map(v => [v, Array.from({ length: H }, () => [])]));
        for (let r = 0; r < runs; r++) {
            const S2 = simClone(); if (useDraft) withDraft(S2);
            const rr = rng(1000 + r * 7919);
            for (let h = 0; h < H; h++) { step(S2, rr, { keys }); S2.turn++; applyRules(S2, ruleK(S2)); vars.forEach(v => out[v][h].push(VAR[v].get(S2))); }
        }
        const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
        const res = {};
        vars.forEach(v => { res[v] = { mean: out[v].map(a => q(a, 0.5)), lo50: out[v].map(a => q(a, 0.25)), hi50: out[v].map(a => q(a, 0.75)), lo90: out[v].map(a => q(a, 0.05)), hi90: out[v].map(a => q(a, 0.95)) }; });
        return res;
    }
    // 흔들림 없이 n턴 뒤 (바꾸기 전 · 후 비교용)
    function project(mutate, n = 1, useDraft = false) {
        const S2 = simClone(); if (useDraft) withDraft(S2); if (mutate) mutate(S2);
        const keys = distList();
        for (let i = 0; i < n; i++) { step(S2, null, { keys }); S2.turn++; applyRules(S2, ruleK(S2)); }
        return S2;
    }
    function sensitivity(target, n) {
        const base = VAR[target].get(project(null, n));
        const rows = [];
        const tryLever = (label, mut, sub) => { const v = VAR[target].get(project(mut, n)) - base; rows.push({ label, value: v, sub }); };
        tryLever('기준금리 +1%p', s => { s.nat.rate += 1; s.settings.indep = false; });
        tryLever('화폐발행률 +1%p', s => { s.nat.print += 1; });
        itemDefs().forEach(d => tryLever(`${d.name} +0.5%p`, s => { s.spend[d.id] = (s.spend[d.id] ?? d.s0) + 0.5; }, 'GDP 대비 지출'));
        taxDefs().forEach(t => tryLever(`${t.name} +2%p`, s => { s.taxes[t.id] = (s.taxes[t.id] ?? t.rate0) + 2; }, '세율'));
        tryLever('양적완화', s => { s.temps.push({ type: 'qe', left: 4 }); });
        tryLever('평가절하', s => { s.nat.cur *= 0.88; s.nat.conf -= 5; });
        return rows.filter(r => Math.abs(r.value) > 1e-4);
    }

    // ================= 예산안 · 세법 (의회 연동) =================
    const regimeBypass = () => !!(window.T62 && window.T62.junta) || !!(window.T63 && window.T63.partyState);
    const billsOn = () => E.settings.bills && !regimeBypass();
    // 지출 · 세율을 고칠 곳 — 법안 방식이면 "예산안 초안", 아니면 바로
    function fiscalTarget() {
        if (!billsOn()) return E;
        if (!E.draft) E.draft = { spend: { ...E.spend }, taxes: { ...E.taxes }, temps: [] };
        return E.draft;
    }
    const fiscalView = () => (billsOn() && E.draft ? E.draft : E);
    const budgetPending = () => !!(E.budgetBill && E.budgetBill.status === 'pending');
    function draftChanges() {
        if (!E.draft) return [];
        const out = [];
        itemDefs().forEach(d => { const a = E.spend[d.id] ?? d.s0, b = E.draft.spend[d.id] ?? a; if (Math.abs(a - b) > 1e-6) out.push({ kind: 'spend', id: d.id, label: d.name, from: a, to: b }); });
        taxDefs().forEach(t => { const a = E.taxes[t.id] ?? t.rate0, b = E.draft.taxes[t.id] ?? a; if (Math.abs(a - b) > 1e-6) out.push({ kind: 'tax', id: t.id, label: t.name, from: a, to: b }); });
        (E.draft.temps || []).forEach(tp => out.push({ kind: 'temp', label: TEMP_NAME[tp.type], from: 0, to: tp.left }));
        return out;
    }
    const TEMP_NAME = { qe: '양적완화', qt: '양적긴축', taxcut: '한시적 감세', taxhike: '한시적 증세' };
    function yearLabel() { const d = readDate(); return d ? `${d.y}년도` : `제${E.turn}턴`; }
    function submitBudget() {
        if (budgetPending()) { showCustomAlert('아직 표결 중인 예산안이 있습니다 — 입법 › 표결에서 처리한 뒤 다시 내세요.'); return; }
        const ch = draftChanges();
        if (!ch.length) { showCustomAlert('바뀐 것이 없습니다 — 재정 탭에서 지출 · 세율을 고친 뒤 예산안을 내세요.'); return; }
        const taxChanged = ch.some(c => c.kind === 'tax' || c.kind === 'temp' && /세/.test(c.label));
        const lines = ch.map((c, i) => `제${i + 1}조 ${c.label}: ${c.kind === 'temp' ? `${spanLabel(c.to)} 동안 실시` : `${r2(c.from)}% → ${r2(c.to)}%${c.kind === 'spend' ? ' (GDP 대비)' : ''}`}`);
        const bill = {
            id: 'b' + Date.now(), title: `${yearLabel()} 예산안 (제${E.budgetNo + 1}차)${taxChanged ? ' · 세법 개정' : ''}`, content: lines.join('\n'),
            threshold: 0.5, numer: null, denom: null, tags: ['예산안'].concat(taxChanged ? ['세법'] : []),
            houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
            version: 1, parentBillId: null, isAmendment: false, voteHistory: [], econBudget: true,
        };
        try { bills.push(bill); renderBillList(); if (typeof syncBillSelect === 'function') syncBillSelect(); } catch (e) { showCustomAlert('입법 화면이 없어 예산안을 올리지 못했습니다.'); return; }
        E.budgetBill = { id: bill.id, status: 'pending', draft: deep(E.draft), title: bill.title };
        addEvent('budget', `${bill.title} 제출`);
        refreshAll();
        showCustomAlert(`『${bill.title}』을(를) 입법 › 제출에 올렸습니다. 가결되면 다음 ${UNIT_WORD[E.unit]}부터 반영되고, 그 전까지는 지난 예산(준예산)대로 집행됩니다.\n\n재정 탭의 "예상 표결"로 정당별 예상 찬반을 보고 한 번에 넣을 수 있어요.`);
    }
    function checkBudgetBill() {
        const bb = E.budgetBill;
        if (!bb || bb.status !== 'pending') return;
        let bill = null;
        try { bill = (bills || []).find(b => b.id === bb.id); } catch (e) { return; }
        if (!bill) { E.budgetBill = null; return; }
        const st = getBillOverallStatus(bill);
        if (st === 'passed') {
            E.spend = { ...E.spend, ...bb.draft.spend }; E.taxes = { ...E.taxes, ...bb.draft.taxes };
            (bb.draft.temps || []).forEach(tp => E.temps.push({ ...tp }));
            bb.status = 'passed'; E.budgetNo++;
            E.draft = null;
            addEvent('budget', `${bb.title} 가결 — 새 예산 집행`);
            try { if (window.T65 && typeof window.T65.record === 'function') window.T65.record(`[경제] ${bb.title} 가결`); } catch (e) { /* 없음 */ }
            refreshAll();
        } else if (st === 'failed' || st === 'vetoed') {
            bb.status = 'failed';
            addEvent('budget', `${bb.title} ${st === 'vetoed' ? '거부' : '부결'} — 준예산(지난 예산) 집행`);
            refreshAll();
        }
    }
    const origRenderBills = window.renderBillList;
    if (typeof origRenderBills === 'function') {
        let inCheck = false;
        window.renderBillList = function () {
            const r = origRenderBills.apply(this, arguments);
            if (!inCheck) { inCheck = true; try { checkBudgetBill(); } finally { inCheck = false; } }
            return r;
        };
    }
    // ---- 예상 표결 — 정당 태그 선호 + 집권 여부 + 세 부담, 지역구 의원은 지역 이해관계로 이탈할 수 있음 ----
    function partyPrefs(p) {
        const L = leanOf(p);
        const ide = typeof findIdeology === 'function' ? findIdeology(p.ideologyId) : null;
        const green = /녹색|생태/.test(String(ide?.name || '') + p.name);
        const base = { 복지: 0.8 * L, 안보: -0.6 * L, 교육: 0.3 + 0.3 * L, 과학: 0.3, 산업: 0.2 - 0.2 * L, 농업: 0.2, 환경: 0.4 * L + (green ? 1 : 0), 국가위신: -0.5 * L };
        return { ...base, ...(E.tagPrefs[p.id] || {}) };
    }
    function govStance(p) {
        if (p.isRuling) return 1;
        try { if ((coalitions || []).some(c => c.isRuling && (c.externalSupporters || []).some(id => String(id) === String(p.id)))) return 0.6; } catch (e) { /* 없음 */ }
        return -0.5;
    }
    function districtInterest(k, draft) {
        const d = E.dist[k]; if (!d) return 0;
        let s = 0;
        itemDefs().forEach(it => {
            const dl = (draft.spend[it.id] ?? E.spend[it.id] ?? it.s0) - (E.spend[it.id] ?? it.s0); if (!dl) return;
            if (it.welfare) s += dl * 0.5 * (3.5 - d.income) / 2;
            if (it.group === '국방') s += dl * d.ind[1] * 0.6;
            if (it.id === 'agri') s += dl * d.ind[0] * 2;
            if (it.id === 'infra') s += dl * 0.2;
        });
        taxDefs().forEach(t => {
            const dl = (draft.taxes[t.id] ?? E.taxes[t.id] ?? t.rate0) - (E.taxes[t.id] ?? t.rate0); if (!dl) return;
            if (t.side?.moodHigh) s -= dl * 0.15 * Math.max(0, d.income - 2.5) / 2;
            if (t.side?.moodLow) s -= dl * 0.1 * Math.max(0, 3.5 - d.income) / 2;
        });
        return s;
    }
    function predictVotes(draft) {
        const dr = draft || E.draft || E.budgetBill?.draft; if (!dr) return [];
        const list = (parties || []).filter(p => p.status !== 'banned' && ((p.seatsHouse || 0) + (p.seatsSenate || 0) + (p.seatsThird || 0)) > 0);
        return list.map(p => {
            const prefs = partyPrefs(p), L = leanOf(p);
            let tag = 0;
            itemDefs().forEach(it => {
                const dl = (dr.spend[it.id] ?? E.spend[it.id] ?? it.s0) - (E.spend[it.id] ?? it.s0); if (!dl) return;
                const tags = it.tags && it.tags.length ? it.tags : [];
                tag += dl * (tags.length ? sum(tags.map(tg => prefs[tg] ?? 0)) / tags.length : 0) * 0.6;
            });
            let tax = 0;
            taxDefs().forEach(t => {
                const dl = (dr.taxes[t.id] ?? E.taxes[t.id] ?? t.rate0) - (E.taxes[t.id] ?? t.rate0); if (!dl) return;
                const coef = t.weight === 'income' || t.weight === 'wealth' ? 0.15 * L : t.weight === 'industry' ? 0.12 * L : -0.08;
                tax += dl * coef;
            });
            const score = govStance(p) + tag + tax;
            const vote = score > 0.25 ? 'yea' : score < -0.25 ? 'nay' : 'abs';
            // 지역구 의원 이탈 예상
            let defect = 0, members = 0;
            try {
                Object.entries(districtMembers.house || {}).forEach(([key, m]) => {
                    if (!m || String(m.partyId) !== String(p.id)) return;
                    const base = typeof districtBaseKey === 'function' ? districtBaseKey('house', key) : key;
                    members++;
                    const ps = 0.7 * score + 0.3 * districtInterest(base, dr) * 2;
                    const pv = ps > 0.25 ? 'yea' : ps < -0.25 ? 'nay' : 'abs';
                    if (pv !== vote) defect++;
                });
            } catch (e) { /* 지역구 없음 */ }
            return { p, score, vote, tag, tax, gov: govStance(p), defect, members };
        });
    }
    function fillPredicted() {
        const bb = E.budgetBill;
        if (!bb || bb.status !== 'pending') { showCustomAlert('표결 중인 예산안이 없습니다 — 먼저 예산안을 내세요.'); return; }
        const preds = predictVotes(bb.draft);
        try {
            switchSubTab('law', 'vote');
            if (typeof selectBillForVote === 'function') selectBillForVote(bb.id);
            preds.forEach(x => applyPartyVote(x.p.name, x.vote));
            showCustomAlert('예상 표결대로 정당별 찬반을 넣었습니다. 바꿀 정당은 직접 고치고 표결을 확정하세요.');
        } catch (e) { showCustomAlert('표결 화면에 넣지 못했습니다 — 입법 › 표결에서 직접 넣어 주세요.'); }
    }

    // ================= 화면 — 메뉴 › 경제 =================
    const CUR = () => E.settings.currency || '';
    const money = pctGdp => { const v = pctGdp * E.nat.gdp / 100; return `${Math.round(v).toLocaleString()}${E.settings.scale || ''} ${CUR()}`.trim(); };
    const gdpText = () => `${Math.round(E.nat.gdp).toLocaleString()}${E.settings.scale || ''} ${CUR()}`.trim();
    const STATUS_WORD = { good: '안전', warning: '경고', serious: '위험', critical: '위기' };
    const stDot = st => `<span class="t69-st t69-st-${st}" title="${STATUS_WORD[st]}">${C.STATUS[st].icon}<em>${STATUS_WORD[st]}</em></span>`;
    (function addEconomyMenu() {
        let btn = document.getElementById('mainTabEconomy');
        const nationBtn = document.getElementById('mainTabNation'), nationContent = document.getElementById('mainContentNation');
        if (!nationBtn || !nationContent) return;
        if (!btn) { btn = el(`<button class="main-tab-btn" id="mainTabEconomy"></button>`); nationBtn.parentElement.insertBefore(btn, nationBtn.nextSibling); }
        btn.setAttribute('onclick', "switchMainTab('economy')");
        btn.removeAttribute('title');
        btn.textContent = '💹 경제';
        const host = el(`<div id="mainContentEconomy" class="main-tab-content"><div class="sub-tab-container"></div></div>`);
        const world = document.getElementById('mainContentWorld');
        nationContent.parentElement.insertBefore(host, world || nationContent.nextSibling);
        const bar = host.querySelector('.sub-tab-container');
        [['overview', 'EcoOverview', '개요'], ['analysis', 'EcoAnalysis', '분석'], ['monetary', 'EcoMonetary', '통화'], ['fiscal', 'EcoFiscal', '재정'], ['region', 'EcoRegion', '지역'], ['scenario', 'EcoScenario', '시나리오'], ['events', 'EcoEvents', '이벤트'], ['items', 'EcoItems', '항목']].forEach(([sub, id, label], i) => {
            bar.appendChild(el(`<button class="sub-tab-btn${i ? '' : ' active'}" onclick="switchSubTab('economy','${sub}')" id="subTab${id.charAt(0).toUpperCase() + id.slice(1)}">${label}</button>`));
            host.appendChild(el(`<div id="content${id.charAt(0).toUpperCase() + id.slice(1)}" class="sub-tab-content t69-content${i ? '' : ' active'}"></div>`));
        });
        try { if (!currentSubTab.economy) currentSubTab.economy = 'overview'; } catch (e) { /* main.js 없음 */ }
    })();
    // 경제 탭 이름 ↔ 하위 탭 id
    const SUB_ID = { overview: 'EcoOverview', analysis: 'EcoAnalysis', monetary: 'EcoMonetary', fiscal: 'EcoFiscal', region: 'EcoRegion', scenario: 'EcoScenario', events: 'EcoEvents', items: 'EcoItems' };
    // switchSubTab('economy', 'overview') → id subTabEcoOverview 를 찾게 sub 이름을 바꿔 준다
    const origSwitchSub = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        // 경제 메뉴를 처음 열 때(저장된 하위 탭이 없으면 본 화면이 'symbol'을 넘김) · 'ecoOverview' 꼴 이름도 경제 탭 이름으로
        if (main === 'economy' && !SUB_ID[sub]) sub = Object.keys(SUB_ID).find(k => SUB_ID[k].toLowerCase() === String(sub).toLowerCase()) || 'overview';
        if (main === 'economy' && SUB_ID[sub]) {
            const r = origSwitchSub.call(this, main, SUB_ID[sub].charAt(0).toLowerCase() + SUB_ID[sub].slice(1), ...[].slice.call(arguments, 2));
            try { currentSubTab.economy = sub; } catch (e) { /* 없음 */ }
            renderTab(sub);
            // keepDisp: 개요 계기를 눌러 왼쪽 탭만 바꿀 때는 오른쪽 시각 화면(개요)을 그대로 둔다 — 실업률 · 민심이 지역 지도로 넘어가지 않게
            if (keepDisp) { keepDisp = false; renderDisp(); }
            else if (sub === 'region') showDisp('region'); else if (sub === 'analysis') showDisp('analysis'); else showDisp(null);
            return r;
        }
        return origSwitchSub.apply(this, arguments);
    };
    const curSub = () => { try { return currentSubTab.economy || 'overview'; } catch (e) { return 'overview'; } };
    const contentOf = sub => document.getElementById('content' + SUB_ID[sub]);
    function renderTab(sub) {
        ensureInit();
        ({ overview: renderOverview, analysis: renderAnalysis, monetary: renderMonetary, fiscal: renderFiscal, region: renderRegion, scenario: renderScenario, events: renderEvents, items: renderItems })[sub]?.();
    }
    function refreshAll() {
        try { renderTab(curSub()); } catch (e) { console.error(e); }
        renderDisp();
    }
    // 입력 칸 묶음 바인딩 — data-path 칸이 바뀌면 setValue
    function bindInputs(box) {
        box.querySelectorAll('[data-path]').forEach(inp => {
            const ev = inp.type === 'range' ? 'input' : 'change';
            inp.addEventListener(ev, () => {
                const v = inp.type === 'checkbox' ? inp.checked : inp.tagName === 'SELECT' ? inp.value : Number(inp.value);
                setValue(inp.dataset.path, v, inp.type === 'range');
            });
            if (inp.type === 'range') inp.addEventListener('change', () => refreshAll());
        });
    }
    function setValue(path, v, live) {
        const [a, b, c] = path.split('.');
        if (lockOf(path)) { showCustomAlert(`🔒 ${lockOf(path)}`); refreshAll(); return; }
        if (a === 'spend' || a === 'taxes') { const tgt = fiscalTarget(); tgt[a][b] = Number(v); }
        else if (a === 'nat') E.nat[b] = Number(v);
        else if (a === 'settings') { E.settings[b] = v; if (b === 'bills' && !v && E.draft) { E.spend = { ...E.draft.spend }; E.taxes = { ...E.draft.taxes }; E.draft = null; } }
        else if (a === 'sys') E.sys = Number(v);
        else if (a === 'dist') { const d = E.dist[b]; if (d) d[c] = Number(v); }
        else if (a === 'ui') E.ui[b] = v;
        else if (a === 'root') E[b] = v;
        if (live) { liveUpdate(path); return; }
        recomputeBudget(E);
        refreshAll();
    }
    // 슬라이더를 끄는 동안은 숫자 · 미리보기만 (전체 다시 그리기는 손을 뗄 때)
    function liveUpdate(path) {
        document.querySelectorAll(`[data-out="${path}"]`).forEach(o => { o.textContent = outText(path); });
        recomputeBudget(E);
        document.querySelectorAll('.t69-preview').forEach(p => renderPreview(p));
    }
    function outText(path) {
        const [a, b] = path.split('.');
        if (a === 'spend') { const v = fiscalView().spend[b]; return `${r2(v)}% · ${money(v)}`; }
        if (a === 'taxes') return `${r2(fiscalView().taxes[b])}%`;
        if (path === 'nat.print') return `${r2(E.nat.print)}%/분기 · ${printBand(E.nat.print)}`;
        if (path === 'nat.rate') return `${r2(E.nat.rate)}%`;
        if (path === 'sys') return sysText();
        return '';
    }
    const sysText = () => { const s = E.sys; return s < 0.25 ? '계획경제' : s < 0.45 ? '혼합(계획 쪽)' : s < 0.6 ? '혼합경제' : s < 0.8 ? '사회적 시장경제' : '자유시장경제'; };
    // 이대로면 다음 턴 — 지금 값과 흔들림 없는 다음 턴 예측
    function renderPreview(box) {
        const useDraft = box.dataset.draft === '1';
        const nx = project(null, 1, useDraft);
        const rows = [['growth', '성장률', '%'], ['infl', '인플레', '%'], ['unemp', '실업률', '%'], ['balance', '재정수지', '%'], ['mood', '민심', '']];
        box.innerHTML = `<div class="t69-pv-h">이대로면 다음 ${UNIT_NAME[E.unit]}</div>` + rows.map(([k, l, u]) => {
            const a = VAR[k].get(E), b = VAR[k].get(nx), m = Math.max(Math.abs(a), Math.abs(b), k === 'mood' ? 100 : 1);
            const w = v => `${clamp(Math.abs(v) / m * 100, 1, 100).toFixed(0)}%`;
            return `<div class="t69-pv-r"><span>${l}</span><div class="t69-pv-bars"><i style="width:${w(a)}" class="${a < 0 ? 'neg' : ''}" title="지금"></i><i style="width:${w(b)}" class="nx ${b < 0 ? 'neg' : ''}" title="다음"></i></div><b>${a.toFixed(1)}${u} → ${b.toFixed(1)}${u}</b></div>`;
        }).join('') + `<div class="t69-pv-legend"><i></i>지금 <i class="nx"></i>다음 ${UNIT_WORD[E.unit]} 예측 (흔들림 없이)</div>`;
    }

    // ---- 개요 ----
    function renderOverview() {
        const box = contentOf('overview'); if (!box) return;
        const N = E.nat, rt = E.rating || ratingOf(E), last = E.hist[E.hist.length - 2];
        const kp = [['growth', '성장률 (전년 대비)', N.growth, '%', 'analysis'], ['infl', '인플레', N.infl, '%', 'monetary'], ['unemp', '실업률', N.unemp, '%', 'region'], ['debt', '국가부채 (GDP 대비)', N.debt, '%', 'fiscal'], ['mood', '민심', N.mood, '', 'region'], ['conf', '신뢰도', N.conf, '', 'monetary']];
        const sig = signals(E).filter(s => s.on);
        const revolt = N.mood < E.thresholds.revolt;
        const nx = project(null, 1);
        box.innerHTML = `
            <div class="t69-intro">보이지 않는 손 — 통화 · 재정 정책이 지역구마다 다르게 작용하고, 그 결과가 민심과 의회로 돌아옵니다. 수치는 모두 직접 고칠 수 있고, 계산은 날짜(국가 › 날짜)가 다음 ${UNIT_WORD[E.unit]}로 넘어갈 때만 돕니다.</div>
            <div class="t69-top">
                <div class="t69-rating t69-grade-${rt[0].replace(/[^A-Z]/g, '').length > 2 ? 'top' : rt[0].startsWith('A') ? 'a' : rt[0].startsWith('B') ? 'b' : 'c'}" title="신용등급 — 신뢰도와 국가부채로 정해짐"><b>${rt[0]}</b><span>${rt[1]}</span></div>
                <div class="t69-turninfo"><div class="t69-turn-now">${esc(turnLabel(E, E.turn))}</div><div class="t69-dim">${readDate() ? `${E.turn ? `${esc(E.hist[0].label)}부터 기록` : '시작'} · 날짜를 따라 계산` : `${spanLabel(E.turn)} 진행 · 날짜를 정하면 날짜를 따라 계산`} · GDP ${esc(gdpText())}</div>
                    <label class="t69-dim">계산 단위 <select data-act="unit">${Object.entries(UNIT_NAME).map(([k, v]) => `<option value="${k}" ${E.unit === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
                <button type="button" class="t69-btn t69-primary t69-next" data-act="next">▶ 다음 ${UNIT_NAME[E.unit]}</button>
            </div>
            <div class="t69-sys"><span>계획</span><input type="range" min="0" max="1" step="0.05" value="${E.sys}" data-path="sys" aria-label="경제 체제"><span>시장</span><b data-out="sys">${sysText()}</b></div>
            <div class="t69-dim t69-small">경제 체제 — 계획 쪽은 실업이 낮고 성장 · 효율이 낮으며, 시장 쪽은 성장이 높고 경기 변동이 큽니다 (집권당 이념에서 기본값).</div>
            ${revolt ? `<div class="t69-alert"><b>${C.STATUS.critical.icon} 민심 붕괴 (${N.mood.toFixed(0)})</b> — 쿠데타 · 혁명이 일어날 수 있습니다.
                ${document.getElementById('subTabCoup') ? '<button type="button" class="t69-btn" data-act="go-coup">쿠데타 탭</button>' : ''}${document.getElementById('subTabRevolution') ? '<button type="button" class="t69-btn" data-act="go-rev">혁명 탭</button>' : ''}</div>` : ''}
            <div class="t69-kpis">${kp.map(([k, l, v, u, go]) => {
                const st = statusOf(k, v), prev = last ? last.n[k] : null, dv = prev != null ? v - prev : null;
                return `<button type="button" class="t69-kpi" data-go="${go}"><span class="t69-kpi-l">${l}</span><b>${v.toFixed(1)}${u}</b><span class="t69-kpi-d">${dv == null ? '' : (dv > 0 ? '▲' : dv < 0 ? '▼' : '–') + Math.abs(dv).toFixed(1)}</span>${stDot(st)}</button>`;
            }).join('')}</div>
            <div class="t69-signals">${sig.length ? sig.map(s => `<span class="t69-signal">${stDot(s.status)} ${esc(s.label)}</span>`).join('') : '<span class="t69-dim">경고 신호 없음</span>'}</div>
            <div class="t69-card"><div class="t69-card-h">다음 ${UNIT_NAME[E.unit]} 예측 <span class="t69-dim">(흔들림 없이)</span></div>
                <div class="t69-fc">${[['growth', '성장률'], ['infl', '인플레'], ['unemp', '실업률'], ['debt', '부채'], ['mood', '민심']].map(([k, l]) => `<span>${l} <b>${VAR[k].get(E).toFixed(1)} → ${VAR[k].get(nx).toFixed(1)}</b></span>`).join('')}</div></div>
            <div class="t69-card"><div class="t69-card-h">예산 <span class="t69-dim">${billsOn() ? '— 예산안(법안)으로 반영' : '— 바로 반영'}</span></div>
                <div class="t69-dim">${budgetStatusText()}</div></div>
            <details class="t69-card t69-settings"><summary>설정</summary>
                <label class="t69-check"><input type="checkbox" data-path="settings.bills" ${E.settings.bills ? 'checked' : ''}> 예산 · 세율 바꾸기는 예산안(법안)으로 ${regimeBypass() ? '<span class="t69-dim">— 지금은 군정 · 당-국가 체제라 바로 반영</span>' : ''}</label>
                <label class="t69-check"><input type="checkbox" data-path="settings.opinion" ${E.settings.opinion ? 'checked' : ''}> 경제 성과를 지지율 · 지역구 성향에 반영</label>
                <label class="t69-check"><input type="checkbox" data-path="settings.autoEvents" ${E.settings.autoEvents ? 'checked' : ''}> 민심이 무너지면 쿠데타 · 혁명 탭을 바로 열기</label>
                <label class="t69-check"><input type="checkbox" data-path="settings.rankFollow" ${E.settings.rankFollow ? 'checked' : ''}> 세계 › 국가 순위의 우리나라 점수가 GDP를 따라감</label>
                <label class="t69-row">${UNIT_NAME[E.unit]}당 패키지 정책 <input type="number" min="1" max="9" value="${E.settings.pkgLimit}" data-path="settings.pkgLimit" class="t69-num">개</label>
                <label class="t69-row">예산 모양 <select data-path="settings.budgetView"><option value="hemi" ${E.settings.budgetView === 'hemi' ? 'selected' : ''}>예산 반원</option><option value="bars" ${E.settings.budgetView === 'bars' ? 'selected' : ''}>가로 막대 두 줄</option></select></label>
            </details>
            <div class="t69-actions"><button type="button" class="t69-btn" data-act="disp">📈 경제 화면 크게 보기</button><button type="button" class="t69-btn" data-act="analysis">분석 열기</button></div>`;
        bindInputs(box);
        box.querySelector('[data-act="next"]').onclick = () => nextTurn();
        box.querySelector('[data-act="unit"]').onchange = e => { E.unit = e.target.value; E.dateBase = null; ensureDateBase(); refreshAll(); };
        box.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => switchSubTab('economy', b.dataset.go); });
        box.querySelector('[data-act="disp"]').onclick = () => { showDisp('overview'); toggleFull(true); };
        box.querySelector('[data-act="analysis"]').onclick = () => switchSubTab('economy', 'analysis');
        box.querySelector('[data-act="go-coup"]')?.addEventListener('click', () => switchSubTab('cabinet', 'coup'));
        box.querySelector('[data-act="go-rev"]')?.addEventListener('click', () => switchSubTab('cabinet', 'revolution'));
    }
    function budgetStatusText() {
        const bb = E.budgetBill;
        if (bb && bb.status === 'pending') return `『${esc(bb.title)}』 의회 표결 중 — 가결 전까지 지난 예산(준예산) 집행`;
        if (bb && bb.status === 'failed') return `『${esc(bb.title)}』 부결 — 준예산(지난 예산) 집행 중. 재정 탭에서 고쳐 다시 낼 수 있어요`;
        if (E.draft && draftChanges().length) return `고친 예산안 초안 ${draftChanges().length}건 — 재정 탭에서 "예산안 제출"`;
        return `제${E.budgetNo}차 예산 집행 중 · 세입 ${pct(E.nat.rev)} · 세출 ${pct(E.nat.spend)} (GDP 대비)`;
    }

    // ---- 분석 (왼쪽: 무엇을 볼지 고르기) ----
    const MODULES = {
        cycleP: '경기 순환 패널 (성장 · 실업 · 인플레 · 금리)', decompG: '성장 기여도 분해', inflP: '인플레 패널 (인플레 · 통화 증가 · 통화가치)', decompP: '인플레 분해',
        traj: '경제 궤적 (실업 × 인플레)', debt: '부채 동학 (부채 · r − g · 기초재정수지)', rates: '금리 차 (기준 · 국채 · 위험 프리미엄)', sankey: '예산 흐름도',
        spendStack: '예산 구성 변화', scatter: '지역 산점도', map: '지역구 지도', tornado: '정책 민감도', fan: '예측 부채꼴 (고른 지표)', assets: '자산 추이', table: '데이터 표',
    };
    const PRESET_MODS = {
        cycle: { name: '경기 순환', mods: ['cycleP', 'decompG'] }, infl: { name: '인플레 분석', mods: ['inflP', 'decompP', 'traj'] },
        fiscal: { name: '재정 건전성', mods: ['debt', 'rates', 'sankey', 'spendStack'] }, region: { name: '지역 격차', mods: ['scatter', 'map'] },
        policy: { name: '정책 실험', mods: ['tornado', 'fan'] }, assets: { name: '자산', mods: ['assets'] }, table: { name: '데이터 표', mods: ['table'] },
    };
    const currentMods = () => (E.ui.preset === 'custom' ? (E.ui.layout || ['cycleP']) : (PRESET_MODS[E.ui.preset] || PRESET_MODS.cycle).mods);
    function renderAnalysis() {
        const box = contentOf('analysis'); if (!box) return;
        const mods = currentMods();
        box.innerHTML = `
            <div class="t69-intro">전문가 분석 — 오른쪽 시각 화면에 크게 그립니다. 모든 그래프는 같은 기간 · 같은 십자선을 쓰고, 마우스를 올리면 그 시점 값이, 미니맵을 끌면 기간 확대가 됩니다. 우클릭으로 그림 내보내기.</div>
            <div class="t69-presets">${Object.entries(PRESET_MODS).map(([id, p]) => `<button type="button" class="t69-preset ${E.ui.preset === id ? 'on' : ''}" data-preset="${id}"><b>${p.name}</b><span>${p.mods.map(m => MODULES[m].split(' (')[0]).join(' · ')}</span></button>`).join('')}
                <button type="button" class="t69-preset ${E.ui.preset === 'custom' ? 'on' : ''}" data-preset="custom"><b>직접 고르기</b><span>아래에서 그래프를 골라 배치</span></button></div>
            ${E.ui.preset === 'custom' ? `<div class="t69-card"><div class="t69-card-h">그래프 고르기</div>${Object.entries(MODULES).map(([id, l]) => `<label class="t69-check"><input type="checkbox" data-mod="${id}" ${mods.includes(id) ? 'checked' : ''}> ${l}</label>`).join('')}</div>` : ''}
            <div class="t69-card">
                <div class="t69-row">기간 <span class="t69-seg">${RANGES.map(([k, l]) => `<button type="button" data-range="${k}" class="${String(E.ui.range) === k ? 'on' : ''}">${l}</button>`).join('')}</span></div>
                <label class="t69-check"><input type="checkbox" data-path="ui.log" ${E.ui.log ? 'checked' : ''}> 인플레 · 통화 증가 로그 눈금 (하이퍼인플레용)</label>
                <label class="t69-row">민감도 · 예측 지표 <select data-path="ui.target">${Object.entries(VAR).map(([k, v]) => `<option value="${k}" ${E.ui.target === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
                <label class="t69-row">민감도 기간 <select data-path="ui.horizon">${[1, 4, 8].map(n => [n, spanLabel(n)]).map(([k, l]) => `<option value="${k}" ${Number(E.ui.horizon) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            </div>
            <div class="t69-actions"><button type="button" class="t69-btn t69-primary" data-act="full">⛶ 크게 보기</button><button type="button" class="t69-btn" data-act="csv">CSV 내보내기</button></div>
            <div class="t69-dim t69-small">용어 — r − g: 국채금리 − 명목성장률(양수면 부채가 저절로 불어남) · 위험 프리미엄: 국채금리 − 기준금리 · 기초재정수지: 이자를 뺀 재정수지 · 실질금리: 기준금리 − 기대 인플레</div>`;
        box.querySelectorAll('[data-preset]').forEach(b => { b.onclick = () => { E.ui.preset = b.dataset.preset; if (E.ui.preset === 'custom' && !E.ui.layout) E.ui.layout = ['cycleP', 'debt']; refreshAll(); }; });
        box.querySelectorAll('[data-mod]').forEach(c => { c.onchange = () => { const s = new Set(E.ui.layout || []); if (c.checked) s.add(c.dataset.mod); else s.delete(c.dataset.mod); E.ui.layout = Object.keys(MODULES).filter(m => s.has(m)); refreshAll(); }; });
        box.querySelectorAll('[data-range]').forEach(b => { b.onclick = () => { E.ui.range = b.dataset.range; E.ui.zoom = null; refreshAll(); }; });
        bindInputs(box);
        box.querySelector('[data-act="full"]').onclick = () => { showDisp('analysis'); toggleFull(true); };
        box.querySelector('[data-act="csv"]').onclick = () => C.csv(tableSpec());
    }

    // ---- 통화 ----
    function renderMonetary() {
        const box = contentOf('monetary'); if (!box) return;
        const N = E.nat, lr = lockOf('nat.rate'), lp = lockOf('nat.print');
        const used = E.pkgUsed || 0, lim = E.settings.pkgLimit;
        box.innerHTML = `
            <div class="t69-intro">통화정책은 중앙은행 몫이라 법안 없이 바로 반영됩니다. 금리를 올리면 인플레가 잡히지만 투자 · 고용이 줄고, 화폐를 많이 발행하면 당장은 경기가 살지만 물가와 통화가치가 무너집니다.</div>
            <div class="t69-card">
                <div class="t69-card-h">기준금리 <b data-out="nat.rate">${r2(N.rate)}%</b></div>
                <input type="range" min="0" max="40" step="0.25" value="${N.rate}" data-path="nat.rate" ${lr ? 'disabled' : ''} aria-label="기준금리">
                ${lr ? `<div class="t69-lock">🔒 ${esc(lr)}</div>` : ''}
                <div class="t69-dim t69-small">실질금리 ${(N.rate - N.inflE).toFixed(1)}% (기대 인플레 ${N.inflE.toFixed(1)}%) · 국채금리 ${N.yield.toFixed(1)}%</div>
                <label class="t69-check"><input type="checkbox" data-path="settings.indep" ${E.settings.indep ? 'checked' : ''}> 중앙은행 독립 — 금리를 테일러 준칙(2 + 인플레 + ½(인플레 − 2) + ½ 산출갭)으로 자동 결정, 신뢰도 ↑</label>
            </div>
            <div class="t69-card">
                <div class="t69-card-h">화폐발행률 <b data-out="nat.print">${r2(N.print)}%/분기 · ${printBand(N.print)}</b></div>
                <input type="range" min="-5" max="50" step="0.5" value="${N.print}" data-path="nat.print" ${lp ? 'disabled' : ''} aria-label="화폐발행률" class="t69-print">
                <div class="t69-bands">${PRINT_BANDS.slice(1).map(b => `<span>${b[0]}~ ${b[1]}</span>`).join('')}</div>
                ${lp ? `<div class="t69-lock">🔒 ${esc(lp)}</div>` : ''}
                <div class="t69-dim t69-small">연간 통화 증가 ${(N.print * 4).toFixed(0)}% · 30%/분기를 넘기면 통화 붕괴 위기</div>
            </div>
            <div class="t69-card"><div class="t69-card-h">패키지 정책 <span class="t69-dim">이번 ${UNIT_WORD[E.unit]} ${used}/${lim}</span></div>
                <div class="t69-pkgs">
                    <button type="button" class="t69-pkg" data-pkg="qe" ${used >= lim ? 'disabled' : ''}><b>양적완화</b><span>${spanLabel(4)} 동안 발행 +3%p, 금리 · 국채금리 ↓</span></button>
                    <button type="button" class="t69-pkg" data-pkg="qt" ${used >= lim ? 'disabled' : ''}><b>양적긴축</b><span>${spanLabel(4)} 동안 발행 −2%p, 금리 ↑</span></button>
                    <button type="button" class="t69-pkg" data-pkg="devalue" ${used >= lim ? 'disabled' : ''}><b>평가절하</b><span>통화가치 −12%, 수출(제조업 지역) ↑ · 수입물가 ↑ · 신뢰도 ↓</span></button>
                </div>
                ${(E.temps || []).length ? `<div class="t69-dim t69-small">진행 중: ${E.temps.map(tp => `${TEMP_NAME[tp.type]} (${spanLabel(tp.left)} 남음)`).join(' · ')}</div>` : ''}
            </div>
            <div class="t69-preview t69-card" data-draft="0"></div>`;
        bindInputs(box);
        box.querySelectorAll('[data-pkg]').forEach(b => { b.onclick = () => usePackage(b.dataset.pkg); });
        box.querySelectorAll('.t69-preview').forEach(renderPreview);
    }
    function usePackage(type) {
        if ((E.pkgUsed || 0) >= E.settings.pkgLimit) { showCustomAlert(`이번 ${UNIT_WORD[E.unit]}에는 패키지 정책을 ${E.settings.pkgLimit}개까지 쓸 수 있습니다.`); return; }
        if (type === 'devalue') { E.nat.cur *= 0.88; E.nat.conf = Math.max(0, E.nat.conf - 5); addEvent('policy', '평가절하 — 통화가치 −12%'); }
        else if (type === 'taxcut' || type === 'taxhike') {
            const tgt = fiscalTarget();
            if (tgt === E) { E.temps.push({ type, left: 4 }); addEvent('policy', `${TEMP_NAME[type]} (${spanLabel(4)})`); }
            else { tgt.temps = tgt.temps || []; tgt.temps.push({ type, left: 4 }); }
        } else { E.temps.push({ type, left: 4 }); addEvent('policy', `${TEMP_NAME[type]} (${spanLabel(4)})`); }
        E.pkgUsed = (E.pkgUsed || 0) + 1;
        recomputeBudget(E);
        refreshAll();
    }

    // ---- 재정 ----
    function renderFiscal() {
        const box = contentOf('fiscal'); if (!box) return;
        const V = fiscalView(), defs = itemDefs(), groupsSeen = [...new Set(defs.map(d => d.group || '기타'))];
        const b = budgetOf(E, E.nat, distList());
        const bv = budgetOf({ ...E, spend: V.spend, taxes: V.taxes, temps: E.temps }, E.nat, distList());
        const changes = draftChanges(), bb = E.budgetBill, pending = budgetPending();
        const preds = (E.draft && changes.length) || pending ? predictVotes(pending ? bb.draft : E.draft) : [];
        const yea = sum(preds.filter(x => x.vote === 'yea').map(x => x.p.seatsHouse || 0)), nay = sum(preds.filter(x => x.vote === 'nay').map(x => x.p.seatsHouse || 0));
        box.innerHTML = `
            <div class="t69-intro">지출은 GDP 대비 %로 정합니다. ${billsOn() ? '고친 값은 <b>예산안 초안</b>에 모였다가, 예산안이 의회에서 가결되면 반영됩니다 (그 전까지는 지난 예산).' : '고친 값은 바로 반영됩니다 (설정에서 예산안 방식으로 바꿀 수 있음).'}</div>
            <div class="t69-card t69-budgetbox">
                <div class="t69-deficit ${E.nat.balance < 0 ? 'neg' : 'pos'}"><span>${E.nat.balance < 0 ? '재정 적자' : '재정 흑자'}</span><b>${pct(Math.abs(E.nat.balance))}</b><span class="t69-dim">GDP 대비 · ${money(Math.abs(E.nat.balance))}</span></div>
                <div class="t69-dim t69-small">세입 ${pct(b.totalRev)} · 세출 ${pct(b.totalSpend)} (의무지출 ${pct(sum(Object.values(b.mand)))})${E.draft && changes.length ? ` · 초안대로면 수지 ${sgn(bv.totalRev - bv.totalSpend)}%` : ''}</div>
                <div class="t69-dim t69-small">${budgetStatusText()}</div>
                ${billsOn() ? `<div class="t69-actions">
                    <button type="button" class="t69-btn t69-primary" data-act="submit" ${pending || !changes.length ? 'disabled' : ''}>예산안 제출${changes.length ? ` (${changes.length}건)` : ''}</button>
                    ${E.draft ? '<button type="button" class="t69-btn" data-act="discard">초안 버리기</button>' : ''}
                    ${pending ? '<button type="button" class="t69-btn" data-act="fill">입법 › 표결에 예상대로 넣기</button>' : ''}</div>` : ''}
                ${preds.length ? `<details class="t69-pred" open><summary>예상 표결 <span class="t69-dim">— 하원 찬성 약 ${yea}석 · 반대 약 ${nay}석</span></summary>
                    <table class="t69-mini"><thead><tr><th>정당</th><th>예상</th><th>점수</th><th>이탈 예상</th></tr></thead><tbody>
                    ${preds.map(x => `<tr><td><i class="t69-pdot" style="background:${esc(x.p.color)}"></i>${esc(x.p.name)}</td><td class="t69-v-${x.vote}">${{ yea: '찬성', nay: '반대', abs: '기권' }[x.vote]}</td><td title="집권 ${sgn(x.gov)} · 지출 선호 ${sgn(x.tag, 2)} · 세 부담 ${sgn(x.tax, 2)}">${sgn(x.score, 2)}</td><td>${x.members ? `${x.defect}/${x.members}명` : '—'}</td></tr>`).join('')}
                    </tbody></table><div class="t69-dim t69-small">점수 = 집권 여부(여당 +1 · 각외협력 +0.6 · 야당 −0.5) + 지출 태그 선호 + 세 부담. 지역구 의원은 지역 이해관계(산업 · 소득)로 당론에서 이탈할 수 있어요. 선호는 항목 탭에서 고침.</div></details>` : ''}
            </div>
            ${groupsSeen.map(g => {
                const items = defs.filter(d => (d.group || '기타') === g), gs = sum(items.map(d => V.spend[d.id] ?? d.s0));
                return `<div class="t69-card"><div class="t69-card-h">${esc(g)} <b>${pct(gs)}</b><span class="t69-dim">${money(gs)}</span>
                    <button type="button" class="t69-btn t69-sm" data-austerity="${esc(g)}" title="이 묶음 지출을 15% 줄임">긴축 −15%</button></div>
                    ${items.map(d => { const lk = lockOf('spend.' + d.id); const v = V.spend[d.id] ?? d.s0; return `<div class="t69-slider">
                        <div class="t69-slider-h"><span>${esc(d.name)}${d.asset ? ` <em class="t69-dim">→ ${esc(assetDefs().find(a => a.id === d.asset)?.name || '')} ${(E.assets[d.asset] ?? 50).toFixed(0)}</em>` : ''}</span><b data-out="spend.${d.id}">${r2(v)}% · ${money(v)}</b></div>
                        <input type="range" min="0" max="${d.max}" step="0.05" value="${v}" data-path="spend.${d.id}" ${lk ? 'disabled' : ''} aria-label="${esc(d.name)}">
                        ${Math.abs(v - (E.spend[d.id] ?? d.s0)) > 1e-6 ? `<div class="t69-dim t69-small">집행 중 ${r2(E.spend[d.id] ?? d.s0)}% → 초안 ${r2(v)}%</div>` : ''}${lk ? `<div class="t69-lock">🔒 ${esc(lk)}</div>` : ''}</div>`; }).join('')}</div>`;
            }).join('')}
            <div class="t69-card"><div class="t69-card-h">의무지출 <span class="t69-dim">자동 계산 · 법으로만 기준 변경</span></div>
                <div class="t69-kv"><span>국채 이자 (부채 × 국채금리)</span><b>${pct(b.mand.interest)} · ${money(b.mand.interest)}</b></div>
                <div class="t69-kv"><span>연금 (노인 인구)</span><b>${pct(b.mand.pension)} · ${money(b.mand.pension)}</b></div>
                <div class="t69-kv"><span>실업급여 (실업자)</span><b>${pct(b.mand.unemp)} · ${money(b.mand.unemp)}</b></div></div>
            <div class="t69-card"><div class="t69-card-h">세율 <span class="t69-dim">너무 높으면 세수가 오히려 줄어듦 (래퍼 곡선)</span></div>
                ${taxDefs().map(t => { const lk = lockOf('taxes.' + t.id); const v = V.taxes[t.id] ?? t.rate0; return `<div class="t69-slider">
                    <div class="t69-slider-h"><span>${esc(t.name)} <em class="t69-dim">세수 ${pct(taxRevenue(t, v))} · ${money(taxRevenue(t, v))}</em></span><b data-out="taxes.${t.id}">${r2(v)}%</b></div>
                    <input type="range" min="0" max="${t.max}" step="0.5" value="${v}" data-path="taxes.${t.id}" ${lk ? 'disabled' : ''} aria-label="${esc(t.name)}">${lk ? `<div class="t69-lock">🔒 ${esc(lk)}</div>` : ''}</div>`; }).join('')}
                <div class="t69-actions"><button type="button" class="t69-btn" data-pkg="taxcut">한시적 감세 (${spanLabel(4)})</button><button type="button" class="t69-btn" data-pkg="taxhike">한시적 증세 (${spanLabel(4)})</button></div>
                ${window.T68 && (window.T68.vassals || []).length ? `<label class="t69-row">종속국 공납 <input type="number" class="t69-num" min="0" max="50" step="1" value="${E.tribute}" data-path="root.tribute">% <span class="t69-dim">세입 ${pct(b.rev._tribute || 0, 2)}</span></label>` : ''}
            </div>
            <div class="t69-card"><div class="t69-card-h">국고 · 부채</div>
                <div class="t69-kv"><span>국고 (예비비)</span><b>${money(E.nat.reserves)} · GDP의 ${pct(E.nat.reserves)}</b></div>
                <div class="t69-kv"><span>국가부채</span><b>${money(E.nat.debt)} · GDP의 ${pct(E.nat.debt)}</b></div>
                <div class="t69-kv"><span>재정수지 (연간)</span><b>${E.nat.balance < 0 ? '적자 ' : '흑자 '}${money(Math.abs(E.nat.balance))} · GDP의 ${pct(Math.abs(E.nat.balance))}</b></div>
                <div class="t69-actions"><button type="button" class="t69-btn" data-act="repay" ${E.nat.reserves > 0 ? '' : 'disabled'}>부채 상환</button><button type="button" class="t69-btn" data-act="invest" ${E.nat.reserves > 0 ? '' : 'disabled'}>인프라에 투자</button>
                    <label class="t69-check"><input type="checkbox" data-path="root.autoRepay" ${E.autoRepay ? 'checked' : ''}> 흑자는 자동 상환</label></div>
                <div class="t69-kv"><span>국가부채</span><b>${pct(E.nat.debt)} · ${money(E.nat.debt)}</b></div>
                <label class="t69-row">부채 한도 <input type="number" class="t69-num" min="0" max="500" step="5" value="${E.ceiling ?? ''}" placeholder="없음" data-act="ceiling">% <span class="t69-dim">넘으면 국채 발행이 막혀 강제 긴축 · 셧다운</span></label>
            </div>
            <div class="t69-preview t69-card" data-draft="1"></div>`;
        bindInputs(box);
        box.querySelectorAll('[data-pkg]').forEach(bt => { bt.onclick = () => usePackage(bt.dataset.pkg); });
        box.querySelectorAll('[data-austerity]').forEach(bt => { bt.onclick = () => {
            const g = bt.dataset.austerity, tgt = fiscalTarget();
            itemDefs().filter(d => (d.group || '기타') === g && !lockOf('spend.' + d.id)).forEach(d => { tgt.spend[d.id] = r2((tgt.spend[d.id] ?? d.s0) * 0.85); });
            if (tgt === E) addEvent('policy', `${g} 긴축 −15%`);
            recomputeBudget(E); refreshAll();
        }; });
        box.querySelector('[data-act="submit"]')?.addEventListener('click', submitBudget);
        box.querySelector('[data-act="discard"]')?.addEventListener('click', () => { E.draft = null; refreshAll(); });
        box.querySelector('[data-act="fill"]')?.addEventListener('click', fillPredicted);
        box.querySelector('[data-act="repay"]')?.addEventListener('click', () => { const x = Math.min(E.nat.reserves, E.nat.debt); E.nat.debt -= x; E.nat.reserves -= x; addEvent('policy', `국고로 부채 ${x.toFixed(1)}%p 상환`); recomputeBudget(E); refreshAll(); });
        box.querySelector('[data-act="invest"]')?.addEventListener('click', () => { const x = E.nat.reserves; E.assets.infra = (E.assets.infra ?? 50) + x * 2; E.nat.reserves = 0; addEvent('policy', `국고 ${x.toFixed(1)}%p를 인프라에 투자`); refreshAll(); });
        box.querySelector('[data-act="ceiling"]')?.addEventListener('change', e => { const v = e.target.value.trim(); E.ceiling = v === '' ? null : num(v, null, 0, 500); refreshAll(); });
        box.querySelectorAll('.t69-preview').forEach(renderPreview);
    }

    // ---- 지역 ----
    const MAP_BY = { gdppc: '1인당 GDP', unemp: '실업률', mood: '민심', income: '소득등급', industry: '주력 산업' };
    function renderRegion() {
        const box = contentOf('region'); if (!box) return;
        const keys = distList();
        const P = sum(keys.map(k => E.dist[k].pop)) || 1, G = E.nat.gdp;
        box.innerHTML = `
            <div class="t69-intro">지역구마다 산업구조 · 연령구조 · 소득등급이 달라 같은 정책도 다르게 작용합니다 (금리 인상은 제조업, 복지 삭감은 저소득, 평가절하는 수출 제조업 지역에 크게). 미수복 지역 · 종속국 땅은 전국 집계에서 빠집니다.</div>
            <label class="t69-row">지도 색칠 <select data-path="ui.mapBy">${Object.entries(MAP_BY).map(([k, v]) => `<option value="${k}" ${E.ui.mapBy === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            ${keys[0] === '__nation' ? '<div class="t69-dim">지역구가 없어 전국 하나로 계산합니다 — 국가 › 지역구 지도에서 지도를 올리면 지역구마다 계산해요.</div>' : ''}
            <div class="t69-dlist">${keys.map(k => { const d = E.dist[k], pc = d.gdp / G / (d.pop / P) * 100; return `<details class="t69-dist" data-key="${esc(k)}">
                <summary><span class="t69-dname">${esc(nameOf(k))}</span><span>1인당 ${pc.toFixed(0)} · 실업 ${d.unemp.toFixed(1)}% · 민심 ${d.mood.toFixed(0)} · 소득 ${d.income.toFixed(1)}</span></summary>
                <div class="t69-dgrid">
                    <label>농업 <input type="number" step="0.01" min="0" max="1" value="${d.ind[0]}" data-ind="0"></label><label>제조업 <input type="number" step="0.01" min="0" max="1" value="${d.ind[1]}" data-ind="1"></label><label>서비스업 <input type="number" step="0.01" min="0" max="1" value="${d.ind[2]}" data-ind="2"></label>
                    <label>청소년 <input type="number" step="0.01" min="0" max="1" value="${d.age[0]}" data-age="0"></label><label>생산가능 <input type="number" step="0.01" min="0" max="1" value="${d.age[1]}" data-age="1"></label><label>노인 <input type="number" step="0.01" min="0" max="1" value="${d.age[2]}" data-age="2"></label>
                    <label>소득등급 <input type="number" step="0.1" min="1" max="5" value="${r1(d.income)}" data-path="dist.${esc(k)}.income"></label><label>실업률 % <input type="number" step="0.1" min="0" max="60" value="${r1(d.unemp)}" data-path="dist.${esc(k)}.unemp"></label><label>민심 <input type="number" step="1" min="0" max="100" value="${Math.round(d.mood)}" data-path="dist.${esc(k)}.mood"></label>
                </div><div class="t69-dim t69-small">산업 · 연령 비율은 합이 1이 되게 저절로 맞춥니다 · 인구는 국가 › 지역구 지도의 "시민 / 인구"</div></details>`; }).join('')}</div>`;
        bindInputs(box);
        box.querySelectorAll('.t69-dist').forEach(det => {
            const k = det.dataset.key, d = E.dist[k];
            const norm = (arr, i, v) => { const out = arr.slice(); out[i] = clamp(v, 0, 1); const rest = sum(out) - out[i]; const others = out.map((x, j) => j); others.forEach(j => { if (j !== i) out[j] = rest > 0 ? out[j] / rest * (1 - out[i]) : (1 - out[i]) / 2; }); return out.map(r2); };
            det.querySelectorAll('[data-ind]').forEach(inp => inp.addEventListener('change', () => { d.ind = norm(d.ind, +inp.dataset.ind, +inp.value); refreshAll(); }));
            det.querySelectorAll('[data-age]').forEach(inp => inp.addEventListener('change', () => { d.age = norm(d.age, +inp.dataset.age, +inp.value); refreshAll(); }));
        });
        const openKey = E.ui.openDist; if (openKey) box.querySelector(`.t69-dist[data-key="${CSS.escape(openKey)}"]`)?.setAttribute('open', '');
        box.querySelectorAll('.t69-dist').forEach(det => det.addEventListener('toggle', () => { if (det.open) E.ui.openDist = det.dataset.key; }));
    }

    // ---- 시나리오 ----
    const RULE_VARS = () => [['nat.infl', '인플레'], ['nat.unemp', '실업률'], ['nat.rate', '기준금리'], ['nat.print', '화폐발행률'], ['nat.debt', '국가부채'], ['nat.conf', '신뢰도'], ['nat.mood', '민심'], ['nat.cur', '통화가치']]
        .concat(itemDefs().map(d => [`spend.${d.id}`, `지출 · ${d.name}`])).concat(taxDefs().map(t => [`taxes.${t.id}`, `세율 · ${t.name}`]));
    function renderScenario() {
        const box = contentOf('scenario'); if (!box) return;
        const k = ruleK(E) + 1;
        box.innerHTML = `
            <div class="t69-intro">시작 값만이 아니라 "값 + 기간"을 정해 시나리오를 만듭니다 — 고정(locked)은 기간 동안 그 값, 전환(transition)은 A → B로 서서히, 구간(schedule)은 ${UNIT_WORD[E.unit]}마다 다른 값. 기간이 끝나면 다시 계산값으로 돌아갑니다. 고정된 값과 관련된 정책은 잠겨요.</div>
            <div class="t69-card"><div class="t69-card-h">프리셋 <span class="t69-dim">고르면 경제를 처음부터 다시 시작</span></div>
                <div class="t69-presets">${Object.entries(PRESETS).map(([id, p]) => `<button type="button" class="t69-preset ${E.preset === id ? 'on' : ''}" data-ps="${id}"><b>${esc(p.name)}</b><span>${esc(p.desc.replace(/(\d+)턴/g, (m, n) => spanLabel(+n)))}</span></button>`).join('')}
                <button type="button" class="t69-preset" data-ps=""><b>기본값</b><span>규칙 없이 기본 경제로</span></button></div></div>
            <div class="t69-card"><div class="t69-card-h">규칙 <span class="t69-dim">지금 규칙 기준 ${k}${UNIT_WORD[E.unit]}째</span></div>
                ${Object.entries(E.rules).map(([path, rule]) => `<div class="t69-rule" data-rpath="${esc(path)}">
                    <b>${esc((RULE_VARS().find(v => v[0] === path) || [path, path])[1])}</b>
                    <select data-rf="mode">${['locked', 'transition', 'schedule', 'fixed'].map(m => `<option value="${m}" ${rule.mode === m ? 'selected' : ''}>${{ locked: '고정', transition: '전환', schedule: '구간', fixed: '시작값만' }[m]}</option>`).join('')}</select>
                    ${rule.mode === 'transition' ? `<input type="number" data-rf="from" value="${rule.from ?? 0}" class="t69-num" title="시작">→<input type="number" data-rf="to" value="${rule.to ?? 0}" class="t69-num" title="끝">`
                        : rule.mode === 'schedule' ? `<input type="text" data-rf="segs" value="${esc((rule.segs || []).map(s => `${s.from}-${s.to}:${s.value}`).join(', '))}" placeholder="1-4:25, 5-8:30" title="${UNIT_WORD[E.unit]} 구간:값, 쉼표로" class="t69-segs">`
                        : `<input type="number" data-rf="value" value="${rule.value ?? 0}" class="t69-num">`}
                    ${rule.mode !== 'fixed' && rule.mode !== 'schedule' ? `<input type="number" data-rf="period" value="${rule.period ?? 4}" min="1" class="t69-num" title="기간(${UNIT_WORD[E.unit]})">${UNIT_WORD[E.unit]}` : ''}
                    <span class="t69-dim">${ruleLeft(rule, k) ? `${spanLabel(ruleLeft(rule, k))} 남음` : '끝남'}</span>
                    <button type="button" class="t69-x" data-rdel title="규칙 지우기">×</button></div>`).join('') || '<div class="t69-dim">규칙이 없습니다.</div>'}
                <div class="t69-row"><select data-act="rvar">${RULE_VARS().map(([p, l]) => `<option value="${p}">${esc(l)}</option>`).join('')}</select><button type="button" class="t69-btn" data-act="radd">+ 규칙 추가</button>
                    <button type="button" class="t69-btn" data-act="rrestart" title="규칙의 기간을 지금부터 다시 셈">지금부터 다시 세기</button></div></div>
            <div class="t69-card"><div class="t69-card-h">위기 임계값</div>
                ${[['hyper', '하이퍼인플레 (인플레 %/년 초과)'], ['default', '국가부도 위기 (부채 % 초과)'], ['depression', '대공황 (실업률 % 초과)'], ['flight', '자본 도피 (신뢰도 미만)'], ['collapse', '통화 붕괴 (발행률 %/분기 초과)'], ['revolt', '쿠데타 · 혁명 위험 (민심 미만)']].map(([k2, l]) => `<label class="t69-row">${l} <input type="number" class="t69-num" value="${E.thresholds[k2]}" data-th="${k2}"></label>`).join('')}</div>
            <div class="t69-card"><div class="t69-card-h">화면 표시</div>
                <label class="t69-row">화폐 단위 <input type="text" value="${esc(E.settings.currency)}" data-path="settings.currency" maxlength="8" class="t69-num"></label>
                <label class="t69-row">규모 <select data-path="settings.scale">${['', '만', '억', '조'].map(s => `<option value="${s}" ${E.settings.scale === s ? 'selected' : ''}>${s || '(없음)'}</option>`).join('')}</select></label>
                <label class="t69-row">GDP <input type="number" value="${Math.round(E.nat.gdp)}" data-act="gdp" class="t69-num"> <span class="t69-dim">바꾸면 지역구 GDP도 같은 비율로</span></label></div>
            <div class="t69-actions"><button type="button" class="t69-btn" data-act="reset">경제 처음부터 (기록 지움)</button></div>`;
        bindInputs(box);
        box.querySelectorAll('[data-ps]').forEach(b => { b.onclick = () => showCustomConfirm(`경제를 "${b.querySelector('b').textContent}"로 처음부터 다시 시작합니다. 경제 기록이 지워집니다. 계속하시겠습니까?`, () => { newEconomy(b.dataset.ps || 'none'); if (!b.dataset.ps) E.preset = ''; refreshAll(); }); });
        box.querySelectorAll('.t69-rule').forEach(row => {
            const path = row.dataset.rpath, rule = E.rules[path];
            row.querySelectorAll('[data-rf]').forEach(inp => inp.addEventListener('change', () => {
                const f = inp.dataset.rf;
                if (f === 'mode') { rule.mode = inp.value; if (rule.mode === 'transition') { rule.from = rule.from ?? getPath(E, path) ?? 0; rule.to = rule.to ?? rule.from; } if (rule.mode === 'schedule' && !rule.segs) rule.segs = [{ from: 1, to: 4, value: getPath(E, path) ?? 0 }]; }
                else if (f === 'segs') rule.segs = inp.value.split(',').map(s => s.trim().match(/^(\d+)\s*-\s*(\d+)\s*:\s*(-?[\d.]+)$/)).filter(Boolean).map(m => ({ from: +m[1], to: +m[2], value: +m[3] }));
                else rule[f] = Number(inp.value);
                refreshAll();
            }));
            row.querySelector('[data-rdel]').onclick = () => { delete E.rules[path]; refreshAll(); };
        });
        box.querySelector('[data-act="radd"]').onclick = () => { const p = box.querySelector('[data-act="rvar"]').value; E.rules[p] = { mode: 'locked', value: r2(getPath(E, p) ?? 0), period: 4 }; if (!Object.keys(E.rules).length || E.ruleStart > E.turn) E.ruleStart = E.turn; refreshAll(); };
        box.querySelector('[data-act="rrestart"]').onclick = () => { E.ruleStart = E.turn; refreshAll(); };
        box.querySelectorAll('[data-th]').forEach(inp => inp.addEventListener('change', () => { E.thresholds[inp.dataset.th] = Number(inp.value); refreshAll(); }));
        box.querySelector('[data-act="gdp"]').addEventListener('change', e => { const v = num(e.target.value, E.nat.gdp, 1, 1e12), f = v / (E.nat.gdp || 1); Object.values(E.dist).forEach(d => { d.gdp *= f; }); E.nat.gdp = v; E.hist.forEach(h => { h.n.gdp *= f; }); refreshAll(); });
        box.querySelector('[data-act="reset"]').onclick = () => showCustomConfirm('경제 기록을 모두 지우고 처음부터 시작합니다. 계속하시겠습니까?', () => { newEconomy(E.preset || ''); refreshAll(); });
    }

    // ---- 이벤트 — 정한 날짜에 대공황 · 금융 위기 · 호황 같은 일을 일으킴 ----
    const ymText = mi => `${Math.floor(mi / 12)}.${String(mi % 12 + 1).padStart(2, '0')}`;
    function evStatus(e, nowM) {
        if (e.ended != null) return ['done', '끝남'];
        if (e.fired != null) return ['on', '진행 중'];
        if (e.missed) return ['missed', '지나감'];
        const left = e.y * 12 + e.m - 1 - (nowM ?? 0);
        return ['wait', nowM == null ? '예정' : left <= 0 ? '이번에' : `${left >= 12 ? `${Math.floor(left / 12)}년 ` : ''}${left % 12 ? `${left % 12}개월 ` : ''}뒤`];
    }
    function renderEvents() {
        const box = contentOf('events'); if (!box) return;
        E.sched = E.sched || [];
        const d = readDate(), pm = periodMonths(E), nowM = d ? d.y * 12 + d.m - 1 : null;
        const next = pm ? { y: Math.floor(pm[0] / 12), m: pm[0] % 12 + 1 } : { y: d ? d.y : 2000, m: 1 };
        const f = E.ui.evForm || (E.ui.evForm = { type: 'depression' });
        const T = EVENT_TYPES[f.type] || EVENT_TYPES.depression;
        const cf = f.fx || (f.fx = { g: -3, i: 0, u: 1, conf: -10, cur: 0 });
        const list = E.sched.slice().sort((a, b) => (a.y * 12 + a.m) - (b.y * 12 + b.m));
        box.innerHTML = `
            <div class="t69-intro">정한 날짜가 되면 경제 위기나 호황이 일어납니다 — 날짜(국가 › 날짜)가 그 달을 지날 때 계산에 들어가고, 정한 기간 동안 이어집니다. 시작할 때 신뢰도 · 통화가치가 한 번 꺾이고, 기간 동안 성장 · 인플레 · 실업을 밀어냅니다. (위기 임계값을 넘어 저절로 오는 위기와는 따로)</div>
            ${d ? '' : '<div class="t69-alert">국가 › 날짜를 먼저 정해 주세요 — 이벤트는 날짜를 기준으로 일어납니다.</div>'}
            <div class="t69-card"><div class="t69-card-h">새 이벤트</div>
                <div class="t69-evtypes">${Object.entries(EVENT_TYPES).map(([k, t]) => `<button type="button" class="t69-evtype ${f.type === k ? 'on' : ''}" data-evt="${k}" aria-pressed="${f.type === k}"><b>${t.icon} ${t.name}</b><span>${k === 'custom' ? '이름과 효과를 직접' : esc(fxText(t.fx))}</span></button>`).join('')}</div>
                ${f.type === 'custom' ? `<div class="t69-evcustom">
                    <label class="t69-row">이름 <input type="text" data-cn value="${esc(f.name || '')}" placeholder="예: 대기근" maxlength="24"></label>
                    ${[['g', '성장 (%/년, 기간 동안)'], ['i', '인플레 (%p, 기간 동안)'], ['u', '실업 (%p, 기간 동안)'], ['conf', '신뢰도 (시작할 때)'], ['cur', '통화가치 (%, 시작할 때)']].map(([k, l]) => `<label class="t69-row">${l} <input type="number" step="0.5" data-cf="${k}" value="${cf[k] ?? 0}" class="t69-num"></label>`).join('')}</div>` : ''}
                <div class="t69-evwhen">
                    <span class="t69-evf">시작 <input type="number" data-ef="y" value="${next.y}" class="t69-num t69-yr" aria-label="시작 연도">년 <input type="number" data-ef="m" min="1" max="12" value="${next.m}" class="t69-num t69-mo" aria-label="시작 월">월</span>
                    <span class="t69-evf">기간 <input type="number" data-ef="dur" min="1" max="240" value="${T.dur}" class="t69-num t69-mo" aria-label="기간(개월)">개월</span>
                    <span class="t69-evf">세기 <select data-ef="power" aria-label="세기">${EV_POWERS.map(([v, l]) => `<option value="${v}" ${v === 1 ? 'selected' : ''}>${l}</option>`).join('')}</select></span></div>
                <div class="t69-actions"><button type="button" class="t69-btn t69-primary" data-act="evadd" ${d ? '' : 'disabled'}>+ 이벤트 추가</button>
                    <button type="button" class="t69-btn" data-act="evnow" ${pm ? '' : 'disabled'} title="날짜와 상관없이 다음 ${UNIT_WORD[E.unit]} 계산에서 바로 시작">다음 ${UNIT_WORD[E.unit]}에 바로</button></div>
            </div>
            <div class="t69-card"><div class="t69-card-h">이벤트 목록 <span class="t69-dim">날짜 순 · 일어나기 전에는 날짜 · 기간 · 세기를 고칠 수 있음</span></div>
                ${list.map(e => {
                    const [st, stl] = evStatus(e, nowM), ms = e.y * 12 + e.m - 1, edit = e.fired == null && !e.missed;
                    return `<div class="t69-evrow t69-ev-${st}" data-eid="${esc(e.id)}">
                        <span class="t69-evst">${stl}</span>
                        <b>${(EVENT_TYPES[e.type] || EVENT_TYPES.custom).icon} ${esc(evName(e))}</b>
                        ${edit ? `<span class="t69-evedit"><input type="number" data-er="y" value="${e.y}" class="t69-num t69-yr" aria-label="시작 연도">.<input type="number" data-er="m" min="1" max="12" value="${e.m}" class="t69-num t69-mo" aria-label="시작 월"> · <input type="number" data-er="dur" min="1" max="240" value="${e.dur}" class="t69-num t69-mo" aria-label="기간(개월)">개월
                            <select data-er="power" aria-label="세기">${EV_POWERS.map(([v, l]) => `<option value="${v}" ${v === (e.power ?? 1) ? 'selected' : ''}>${l}</option>`).join('')}</select></span>`
                            : `<span class="t69-dim">${ymText(ms)} ~ ${ymText(ms + e.dur - 1)} · ${(EV_POWERS.find(p => p[0] === (e.power ?? 1)) || [0, '보통'])[1]}</span>`}
                        <span class="t69-dim t69-small t69-evfx">${esc(fxText(evFx(e), e.power ?? 1))}</span>
                        <button type="button" class="t69-x" data-evdel title="${st === 'on' ? '지우기 — 진행 중이면 여기서 멈춤' : '지우기'}">×</button></div>`;
                }).join('') || '<div class="t69-dim">아직 이벤트가 없습니다.</div>'}
            </div>`;
        box.querySelectorAll('[data-evt]').forEach(b => { b.onclick = () => { f.type = b.dataset.evt; renderEvents(); }; });
        box.querySelector('[data-cn]')?.addEventListener('input', e => { f.name = e.target.value; });
        box.querySelectorAll('[data-cf]').forEach(inp => inp.addEventListener('change', () => { cf[inp.dataset.cf] = Number(inp.value) || 0; }));
        const val = k => box.querySelector(`[data-ef="${k}"]`).value;
        const add = (y, m) => {
            const ev = { id: 'ev' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), type: f.type, y: Math.round(num(y, next.y, -9999, 99999)), m: Math.round(num(m, 1, 1, 12)), dur: Math.round(num(val('dur'), T.dur, 1, 240)), power: Number(val('power')) || 1 };
            if (f.type === 'custom') { ev.name = (f.name || '').trim() || '사건'; ev.fx = { ...cf }; }
            if (nowM != null && ev.y * 12 + ev.m - 1 < (pm ? pm[0] : nowM)) { showCustomAlert('이미 지난 날짜입니다 — 다음 계산 기간 이후로 정해 주세요. (바로 일으키려면 "다음에 바로")'); return; }
            E.sched.push(ev);
            refreshAll();
        };
        box.querySelector('[data-act="evadd"]').onclick = () => add(val('y'), val('m'));
        box.querySelector('[data-act="evnow"]').onclick = () => add(next.y, next.m);
        box.querySelectorAll('.t69-evrow').forEach(row => {
            const e = E.sched.find(x => x.id === row.dataset.eid); if (!e) return;
            row.querySelectorAll('[data-er]').forEach(inp => inp.addEventListener('change', () => {
                const k = inp.dataset.er;
                if (k === 'power') e.power = Number(inp.value) || 1;
                else if (k === 'dur') e.dur = Math.round(num(inp.value, e.dur, 1, 240));
                else if (k === 'm') e.m = Math.round(num(inp.value, e.m, 1, 12));
                else e.y = Math.round(num(inp.value, e.y, -9999, 99999));
                refreshAll();
            }));
            row.querySelector('[data-evdel]').onclick = () => { E.sched = E.sched.filter(x => x !== e); refreshAll(); };
        });
    }

    // ---- 항목 (사용자 정의) ----
    // 기본 항목 · 직접 만든 항목 모두 고치고(✎) 지울(×) 수 있다. 기본 항목을 고치면 E.defs의 override 칸에 바뀐 값만 두고,
    // 지우면 override { disabled: true }로 숨긴다 — "숨긴 기본 항목"에서 되살리고, "기본값으로"로 고친 값을 되돌린다.
    let editingDef = null; // { kind: 'item' | 'tax' | 'asset', id }
    const DEF_LIST = { item: () => E.defs.items, tax: () => E.defs.taxes, asset: () => E.defs.assets };
    const DEF_BUILTIN = { item: BUILTIN_ITEMS, tax: BUILTIN_TAXES, asset: BUILTIN_ASSETS };
    const DEF_WORD = { item: '지출 항목', tax: '세목', asset: '자산' };
    const isBuiltinDef = (kind, id) => DEF_BUILTIN[kind].some(b => b.id === id);
    const overrideOf = (kind, id) => DEF_LIST[kind]().find(x => x.id === id && x.override) || null;
    function saveDef(kind, id, fields) {
        const list = DEF_LIST[kind]();
        if (isBuiltinDef(kind, id)) {
            let o = overrideOf(kind, id);
            if (!o) { o = { id, override: true }; list.push(o); }
            Object.assign(o, fields);
        } else {
            const o = list.find(x => x.id === id && !x.override);
            if (o) Object.assign(o, fields);
        }
        editingDef = null;
        validateDefs(); recomputeBudget(E); refreshAll();
    }
    function forgetValues(kind, id) {
        if (kind === 'item') { delete E.spend[id]; if (E.draft) delete E.draft.spend[id]; }
        if (kind === 'tax') { delete E.taxes[id]; if (E.draft) delete E.draft.taxes[id]; }
        if (kind === 'asset') { delete E.assets[id]; E.defs.items.forEach(d => { if (d.asset === id) d.asset = null; }); }
    }
    function removeDef(kind, id, name) {
        showCustomConfirm(`${DEF_WORD[kind]} "${name}"을(를) 지울까요?${isBuiltinDef(kind, id) ? ' 기본 항목은 숨겨지고, 아래 "숨긴 기본 항목"에서 되살릴 수 있어요.' : ''}`, () => {
            const list = DEF_LIST[kind]();
            if (isBuiltinDef(kind, id)) {
                let o = overrideOf(kind, id);
                if (!o) { o = { id, override: true }; list.push(o); }
                o.disabled = true;
            } else {
                const i = list.findIndex(x => x.id === id && !x.override);
                if (i >= 0) list.splice(i, 1);
            }
            forgetValues(kind, id);
            if (editingDef && editingDef.id === id) editingDef = null;
            validateDefs(); recomputeBudget(E); refreshAll();
        });
    }
    // 숨긴 기본 항목 되살리기 / 고친 기본 항목을 기본값으로
    function restoreDef(kind, id, reset) {
        const list = DEF_LIST[kind](), o = overrideOf(kind, id);
        if (o) {
            if (reset) list.splice(list.indexOf(o), 1);
            else { delete o.disabled; if (Object.keys(o).every(k => k === 'id' || k === 'override')) list.splice(list.indexOf(o), 1); }
        }
        const b = DEF_BUILTIN[kind].find(x => x.id === id), cur = { ...b, ...(overrideOf(kind, id) || {}) };
        if (kind === 'item' && E.spend[id] == null) { E.spend[id] = cur.s0; if (E.draft) E.draft.spend[id] = cur.s0; }
        if (kind === 'tax' && E.taxes[id] == null) { E.taxes[id] = cur.rate0; if (E.draft) E.draft.taxes[id] = cur.rate0; }
        if (kind === 'asset' && E.assets[id] == null) E.assets[id] = 50;
        editingDef = null;
        validateDefs(); recomputeBudget(E); refreshAll();
    }
    const TAX_WEIGHTS = [['manufacturing', '제조업 지역'], ['industry', '산업 지역'], ['income', '소득 높은 지역'], ['wealth', '부유층'], ['flat', '전 지역 균등'], ['imports', '수입']];
    const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur ?? '') ? 'selected' : ''}>${esc(label)}</option>`;
    function defEditForm(kind, d, assets, targets) {
        const f = (k, label, v, extra = '') => `<label>${label} <input ${extra} data-e="${k}" value="${esc(v ?? '')}"></label>`;
        let body = '';
        if (kind === 'item') body = `<div class="t69-dgrid">
            ${f('name', '이름', d.name, 'type="text" maxlength="20"')}${f('group', '묶음', d.group, 'type="text" maxlength="12" list="t69Groups"')}${f('tags', '태그', (d.tags || []).join(', '), 'type="text"')}
            ${f('s0', '기준 지출 %', d.s0, 'type="number" step="0.1" min="0"')}${f('max', '상한 %', d.max, 'type="number" step="0.5" min="0.1"')}${f('jobs', '실업률 효과', d.jobs, 'type="number" step="0.05"')}
            ${f('mood', '민심 효과', d.mood, 'type="number" step="0.1"')}${f('eff', '수확체감', d.eff, 'type="number" step="0.05" min="0.2" max="1"')}
            <label>쌓는 자산 <select data-e="asset">${opt('', d.asset, '없음')}${assets.map(a => opt(a.id, d.asset, a.name)).join('')}</select></label></div>`;
        if (kind === 'tax') body = `<div class="t69-dgrid">
            ${f('name', '이름', d.name, 'type="text" maxlength="20"')}${f('rate0', '기본 세율 %', d.rate0, 'type="number" step="0.5" min="0"')}${f('base', '과세 기반 (GDP 비율)', d.base, 'type="number" step="0.01" min="0"')}
            <label>지역 부담 <select data-e="weight">${TAX_WEIGHTS.map(([k, l]) => opt(k, d.weight, l)).join('')}</select></label>
            ${f('growth', '성장 부작용 /%p', d.side?.growth ?? 0, 'type="number" step="0.01"')}${f('infl', '인플레 /%p', d.side?.infl ?? 0, 'type="number" step="0.01"')}</div>`;
        if (kind === 'asset') {
            const eff = Object.entries(d.effects || {});
            const row = ([k, v]) => `<div class="t69-effrow"><select data-eff="k">${targets.filter(([tk]) => tk !== d.id).map(([tk, tl]) => opt(tk, k, tl)).join('')}</select><input type="number" data-eff="v" value="${esc(v)}" step="0.01" min="-1" max="1"><button type="button" class="t69-x" data-eff-del title="효과 지우기">×</button></div>`;
            body = `<div class="t69-dgrid">${f('name', '이름', d.name, 'type="text" maxlength="16"')}${f('decay', '감가상각 /년', d.decay, 'type="number" step="0.01" min="0" max="0.5"')}</div>
                <div class="t69-effs"><div class="t69-dim">효과 (자산이 기준 50보다 1점 높을 때)</div>${eff.map(row).join('')}<template>${row([targets[0] ? targets[0][0] : '', 0.02])}</template>
                <button type="button" class="t69-btn" data-eff-add>+ 효과</button></div>`;
        }
        const reset = isBuiltinDef(kind, d.id) && overrideOf(kind, d.id) ? '<button type="button" class="t69-btn" data-def-reset>기본값으로</button>' : '';
        return `<div class="t69-defedit">${body}<div class="t69-row t69-defedit-btns"><button type="button" class="t69-btn t69-primary" data-def-save>저장</button><button type="button" class="t69-btn" data-def-cancel>취소</button>${reset}</div></div>`;
    }
    function readDefEdit(kind, form) {
        const g = k => form.querySelector(`[data-e="${k}"]`)?.value ?? '';
        const n = (k, lo, hi) => num(g(k), 0, lo, hi);
        if (kind === 'item') {
            const name = g('name').trim();
            if (!name) return null;
            return { name, group: g('group').trim() || '민간', tags: g('tags').split(',').map(x => x.trim()).filter(Boolean), s0: n('s0', 0, 100), max: n('max', 0.1, 100), jobs: n('jobs', -5, 5), mood: n('mood', -5, 5), eff: n('eff', 0.2, 1), asset: g('asset') || null };
        }
        if (kind === 'tax') {
            const name = g('name').trim();
            if (!name) return null;
            return { name, rate0: n('rate0', 0, 100), base: n('base', 0, 5), weight: g('weight'), side: { growth: n('growth', -3, 3), infl: n('infl', -3, 3) } };
        }
        const name = g('name').trim();
        if (!name) return null;
        const effects = {};
        form.querySelectorAll('.t69-effs > .t69-effrow').forEach(r => { const k = r.querySelector('[data-eff="k"]').value; if (k) effects[k] = num(r.querySelector('[data-eff="v"]').value, 0, -1, 1); });
        return { name, decay: n('decay', 0, 0.5), effects };
    }
    function defRowHtml(kind, d, desc, assets, targets) {
        const editing = editingDef && editingDef.kind === kind && editingDef.id === d.id;
        const edited = isBuiltinDef(kind, d.id) && overrideOf(kind, d.id) ? '<span class="t69-dim t69-edited">고침</span>' : '';
        return `<div class="t69-def ${d.builtin ? 'builtin' : ''}" data-def-kind="${kind}" data-def-id="${esc(d.id)}" data-def-name="${esc(d.name)}">
            <div class="t69-def-h"><b>${esc(d.name)}</b>${edited}<span class="t69-dim">${desc}</span>
                <span class="t69-def-acts"><button type="button" class="t69-x" data-def-edit title="고치기">✎</button><button type="button" class="t69-x" data-def-del title="지우기">×</button></span></div>
            ${editing ? defEditForm(kind, d, assets, targets) : ''}</div>`;
    }
    function hiddenDefsHtml(kind) {
        const hidden = DEF_BUILTIN[kind].filter(b => overrideOf(kind, b.id)?.disabled);
        if (!hidden.length) return '';
        return `<div class="t69-hidden-defs"><span class="t69-dim">숨긴 기본 항목</span>${hidden.map(b => `<button type="button" class="t69-btn" data-def-restore="${kind}:${esc(b.id)}" title="되살리기">${esc(overrideOf(kind, b.id)?.name || b.name)} ↺</button>`).join('')}</div>`;
    }

    function renderItems() {
        const box = contentOf('items'); if (!box) return;
        validateDefs();
        const assets = assetDefs();
        const targets = Object.entries(EFFECT_TARGETS).concat(assets.map(a => [a.id, a.name]));
        const plist = (parties || []).filter(p => p.status !== 'banned');
        box.innerHTML = `
            <div class="t69-intro">지출 항목 · 세목 · 자산을 직접 만들 수 있습니다. 기본 항목과 같은 규칙으로 계산되고(수확체감 · 감가상각), 정의는 세이브에 함께 저장돼요. 의원은 항목 이름이 아니라 <b>태그</b>로 반응합니다.</div>
            ${warnings.length ? `<div class="t69-alert">${warnings.map(w => `<div>⚠ ${esc(w)}</div>`).join('')}</div>` : ''}
            <div class="t69-card"><div class="t69-card-h">지출 항목</div>
                ${itemDefs().map(d => defRowHtml('item', d, `${esc(d.group || '')} · ${(d.tags || []).map(esc).join(' · ') || '태그 없음'} · 기준 ${d.s0}%${d.asset ? ` → ${esc(assets.find(a => a.id === d.asset)?.name || d.asset)}` : ''}`, assets, targets)).join('')}
                ${hiddenDefsHtml('item')}
                <details class="t69-newdef"><summary>+ 새 지출 항목</summary>
                    <div class="t69-dgrid">
                        <label>이름 <input type="text" data-n="name" maxlength="20" placeholder="우주개발"></label>
                        <label>묶음 <input type="text" data-n="group" maxlength="12" placeholder="민간" list="t69Groups"></label>
                        <label>태그 <input type="text" data-n="tags" placeholder="과학, 국가위신" title="쉼표로 — 기본 태그: ${TAGS.join(', ')}"></label>
                        <label>기준 지출 % <input type="number" data-n="s0" value="0.5" step="0.1" min="0"></label>
                        <label>상한 % <input type="number" data-n="max" value="5" step="0.5" min="0.1"></label>
                        <label>실업률 효과 <input type="number" data-n="jobs" value="-0.1" step="0.05" title="기준보다 1%p 더 쓸 때 실업률 %p (음수 = 줄어듦)"></label>
                        <label>민심 효과 <input type="number" data-n="mood" value="0.1" step="0.1"></label>
                        <label>수확체감 <input type="number" data-n="eff" value="0.6" step="0.05" min="0.2" max="1"></label>
                        <label>쌓는 자산 <select data-n="asset"><option value="">없음</option>${assets.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('')}<option value="__new">+ 새 자산</option></select></label>
                    </div>
                    <div class="t69-dgrid t69-newasset" hidden>
                        <label>새 자산 이름 <input type="text" data-n="aname" maxlength="16" placeholder="우주기술"></label>
                        <label>감가상각 /년 <input type="number" data-n="adecay" value="0.03" step="0.01" min="0" max="0.5"></label>
                        <label>효과 대상 <select data-n="atarget">${targets.map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join('')}</select></label>
                        <label>효과 계수 <input type="number" data-n="acoef" value="0.02" step="0.01" min="-1" max="1" title="자산이 기준(50)보다 1점 높을 때"></label>
                    </div>
                    <datalist id="t69Groups">${[...new Set(itemDefs().map(d => d.group))].map(g => `<option value="${esc(g)}">`).join('')}</datalist>
                    <button type="button" class="t69-btn t69-primary" data-act="add-item">항목 추가</button></details></div>
            <div class="t69-card"><div class="t69-card-h">세목</div>
                ${taxDefs().map(t => defRowHtml('tax', t, `기본 ${t.rate0}% · 기반 GDP의 ${Math.round(t.base * 100)}% · ${{ income: '소득 높은 지역', industry: '산업 지역', flat: '전 지역 균등', wealth: '부유층', imports: '수입', manufacturing: '제조업' }[t.weight] || ''}`, assets, targets)).join('')}
                ${hiddenDefsHtml('tax')}
                <details class="t69-newdef"><summary>+ 새 세목</summary><div class="t69-dgrid">
                    <label>이름 <input type="text" data-t="name" maxlength="20" placeholder="탄소세"></label>
                    <label>기본 세율 % <input type="number" data-t="rate0" value="5" step="0.5" min="0"></label>
                    <label>과세 기반 (GDP 비율) <input type="number" data-t="base" value="0.1" step="0.01" min="0"></label>
                    <label>지역 부담 <select data-t="weight"><option value="manufacturing">제조업 지역</option><option value="industry">산업 지역</option><option value="income">소득 높은 지역</option><option value="wealth">부유층</option><option value="flat">전 지역 균등</option><option value="imports">수입</option></select></label>
                    <label>성장 부작용 /%p <input type="number" data-t="growth" value="-0.02" step="0.01"></label>
                    <label>인플레 /%p <input type="number" data-t="infl" value="0.01" step="0.01"></label>
                </div><button type="button" class="t69-btn t69-primary" data-act="add-tax">세목 추가</button></details></div>
            <div class="t69-card"><div class="t69-card-h">자산</div>
                ${assets.map(a => defRowHtml('asset', a, `${(E.assets[a.id] ?? 50).toFixed(0)}점 · 감가 ${Math.round(a.decay * 100)}%/년 · ${Object.entries(a.effects || {}).map(([k, v]) => `${esc(EFFECT_TARGETS[k] || assets.find(x => x.id === k)?.name || k)} ${sgn(v, 2)}`).join(' · ') || '효과 없음'}`, assets, targets)).join('')}
                ${hiddenDefsHtml('asset')}</div>
            <details class="t69-card"><summary>정당 태그 선호 <span class="t69-dim">— 예상 표결에 쓰임 (비우면 이념에서 자동)</span></summary>
                <div class="t69-tablewrap2"><table class="t69-mini"><thead><tr><th>정당</th>${TAGS.map(t => `<th>${t}</th>`).join('')}</tr></thead><tbody>
                ${plist.map(p => { const pr = partyPrefs(p), own = E.tagPrefs[p.id] || {}; return `<tr data-pid="${esc(p.id)}"><td><i class="t69-pdot" style="background:${esc(p.color)}"></i>${esc(p.name)}</td>${TAGS.map(t => `<td><input type="number" step="0.1" min="-2" max="2" data-tag="${t}" value="${own[t] != null ? own[t] : ''}" placeholder="${pr[t].toFixed(1)}" class="t69-tagin"></td>`).join('')}</tr>`; }).join('')}
                </tbody></table></div></details>`;
        const nd = box.querySelector('.t69-newdef');
        nd.querySelector('[data-n="asset"]').onchange = e => { box.querySelector('.t69-newasset').hidden = e.target.value !== '__new'; };
        box.querySelector('[data-act="add-item"]').onclick = () => {
            const g = k => nd.querySelector(`[data-n="${k}"]`).value;
            const name = g('name').trim(); if (!name) { showCustomAlert('항목 이름을 적어 주세요.'); return; }
            let asset = g('asset') || null;
            if (asset === '__new') {
                const an = g('aname').trim() || `${name} 자산`;
                asset = 'a' + Date.now().toString(36);
                E.defs.assets.push({ id: asset, name: an, decay: Number(g('adecay')), effects: { [g('atarget')]: Number(g('acoef')) } });
            }
            const id = 'i' + Date.now().toString(36);
            E.defs.items.push({ id, name, group: g('group').trim() || '민간', tags: g('tags').split(',').map(s => s.trim()).filter(Boolean), s0: Number(g('s0')), max: Number(g('max')), jobs: Number(g('jobs')), mood: Number(g('mood')), eff: Number(g('eff')), asset });
            validateDefs();
            const d = E.defs.items[E.defs.items.length - 1];
            E.spend[id] = d.s0; if (E.draft) E.draft.spend[id] = d.s0;
            if (asset) E.assets[asset] = E.assets[asset] ?? 50;
            recomputeBudget(E); refreshAll();
        };
        box.querySelector('[data-act="add-tax"]').onclick = () => {
            const tn = box.querySelectorAll('.t69-newdef')[1], g = k => tn.querySelector(`[data-t="${k}"]`).value;
            const name = g('name').trim(); if (!name) { showCustomAlert('세목 이름을 적어 주세요.'); return; }
            const id = 't' + Date.now().toString(36);
            E.defs.taxes.push({ id, name, rate0: Number(g('rate0')), base: Number(g('base')), L: 100, max: 60, weight: g('weight'), side: { growth: Number(g('growth')), infl: Number(g('infl')) } });
            validateDefs();
            E.taxes[id] = E.defs.taxes[E.defs.taxes.length - 1].rate0; if (E.draft) E.draft.taxes[id] = E.taxes[id];
            recomputeBudget(E); refreshAll();
        };
        box.querySelectorAll('.t69-def[data-def-kind]').forEach(row => {
            const kind = row.dataset.defKind, id = row.dataset.defId, name = row.dataset.defName;
            row.querySelector('[data-def-edit]').onclick = () => { editingDef = editingDef && editingDef.kind === kind && editingDef.id === id ? null : { kind, id }; renderItems(); };
            row.querySelector('[data-def-del]').onclick = () => removeDef(kind, id, name);
            const form = row.querySelector('.t69-defedit');
            if (!form) return;
            form.querySelector('[data-def-save]').onclick = () => {
                const fields = readDefEdit(kind, form);
                if (!fields) { showCustomAlert('이름을 적어 주세요.'); return; }
                saveDef(kind, id, fields);
            };
            form.querySelector('[data-def-cancel]').onclick = () => { editingDef = null; renderItems(); };
            const rs = form.querySelector('[data-def-reset]');
            if (rs) rs.onclick = () => restoreDef(kind, id, true);
            const add = form.querySelector('[data-eff-add]');
            if (add) add.onclick = () => { const t = form.querySelector('.t69-effs > template'); add.before(t.content.cloneNode(true)); bindEffDel(); };
            const bindEffDel = () => form.querySelectorAll('[data-eff-del]').forEach(b => { b.onclick = () => b.closest('.t69-effrow').remove(); });
            bindEffDel();
        });
        box.querySelectorAll('[data-def-restore]').forEach(b => { b.onclick = () => { const [kind, ...rest] = b.dataset.defRestore.split(':'); restoreDef(kind, rest.join(':'), false); }; });
        box.querySelectorAll('tr[data-pid] .t69-tagin').forEach(inp => inp.addEventListener('change', () => {
            const pid = inp.closest('tr').dataset.pid, t = inp.dataset.tag, raw = inp.value.trim();
            const key = (parties.find(p => String(p.id) === pid) || {}).id ?? pid;
            E.tagPrefs[key] = E.tagPrefs[key] || {};
            if (raw === '') delete E.tagPrefs[key][t]; else E.tagPrefs[key][t] = num(raw, 0, -2, 2);
            renderTab('fiscal');
        }));
    }

    // ================= 오른쪽 시각 화면 "경제" =================
    (function addDisp() {
        const after = document.getElementById('dispTabRanking') || document.getElementById('dispTabTimeline') || document.getElementById('dispTabCabinet');
        if (!after) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabEconomy" data-tab="economy" onclick="switchDispTab('economy')" style="display:none;"><span class="disp-tab-label">경제</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('economy')">×</span></button>`), after.nextSibling);
        const ref = document.getElementById('dispPanelRanking') || document.getElementById('dispPanelTimeline') || document.getElementById('dispPanelCabinet');
        if (!ref) return;
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelEconomy"><div class="chamber-box t69-dispbox t69-viz">
            <div class="t69-toolbar" id="t69Toolbar"></div><div id="t69Disp"></div></div></div>`), ref.nextSibling);
    })();
    const dispActive = () => !!document.getElementById('dispPanelEconomy')?.classList.contains('active');
    function showDisp(view) {
        if (view) E.ui.view = view;
        else if (E.ui.view !== 'overview' && !['analysis', 'region'].includes(curSub())) E.ui.view = 'overview';
        const btn = document.getElementById('dispTabEconomy');
        if (btn) btn.style.display = '';
        try { if (!dispActive()) switchDispTab('economy'); else renderDisp(); } catch (e) { /* 시각 화면 없음 */ }
    }
    const origDisp = window.switchDispTab;
    window.switchDispTab = function (tab) {
        const r = origDisp.apply(this, arguments);
        if (tab === 'economy') setTimeout(renderDisp, 20);
        return r;
    };
    function toggleFull(on) {
        E.ui.full = on == null ? !E.ui.full : on;
        document.body.classList.toggle('t69-full', !!E.ui.full);
        setTimeout(renderDisp, 60);
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && E.ui.full) toggleFull(false); });

    // 기록 → 그래프 자료
    function series() {
        const H = E.hist, n = H.length;
        const x = H.map(h => h.label), t = histT();
        const col = f => H.map(h => { const v = f(h); return Number.isFinite(v) ? v : null; });
        return { H, n, x, t, col };
    }
    const RANGES = [['all', '전체'], ['y10', '10년'], ['y5', '5년'], ['y2', '2년']];
    // 'y10' = 10년 · 예전 세이브의 칸 수('40')는 분기로 보고 년으로
    const rangeYears = r => (r === 'all' || r == null ? 0 : /^y\d+$/.test(r) ? Number(r.slice(1)) : (Number(r) || 0) / 4);
    function rangeIdx(n) {
        if (E.ui.zoom && E.ui.zoom[1] < n) return E.ui.zoom;
        // 기간은 시간(년)으로 — 칸 수로 세면 1개월 · 1분기 · 1년 칸이 섞일 때 길이가 제각각
        const yrs = rangeYears(E.ui.range);
        if (!yrs) return [0, Math.max(0, n - 1)];
        const t = histT(), from = t[t.length - 1] - yrs + 1e-9;
        let i = n - 1; while (i > 0 && t[i - 1] >= from) i--;
        return [i, Math.max(0, n - 1)];
    }
    function markersOf(H) {
        const at = new Map(H.map((h, i) => [h.t, i]));
        return E.events.filter(e => at.has(e.t) && ['crisis', 'revolt', 'election', 'budget', 'policy', 'unify'].includes(e.kind) && !(e.kind === 'budget' && !/가결/.test(e.label)))
            .map(e => ({ i: at.get(e.t), label: e.label, kind: e.kind === 'revolt' || e.kind === 'unify' ? 'crisis' : e.kind }));
    }
    function recessions(H) {
        const out = []; let s = null;
        H.forEach((h, i) => { if (h.n.growth < 0) { if (s == null) s = i; } else { if (s != null && i - s >= 2) out.push([s, i - 1]); s = null; } });
        if (s != null && H.length - s >= 2) out.push([s, H.length - 1]);
        return out;
    }
    // 예측을 붙인 x축 (지금 + h턴)
    // 기록마다 시간 위치(년) — 1개월 · 1분기 · 1년 칸이 실제 길이대로 (예전 세이브는 지금 단위로 채움)
    function histT() {
        let prev = null;
        return E.hist.map(h => { const v = Number.isFinite(h.yr) && (prev == null || h.yr >= prev) ? h.yr : (prev == null ? 0 : prev + DT[E.unit]); prev = v; return v; });
    }
    const withForecastT = (t, h) => t.concat(Array.from({ length: h }, (_, i) => (t.length ? t[t.length - 1] : 0) + (i + 1) * DT[E.unit]));
    function withForecast(xs, h) { return xs.concat(Array.from({ length: h }, (_, i) => turnLabel(E, E.turn + i + 1))); }
    function fanFor(v, base, h, fc) {
        const pad = Array(base - 1).fill(null), cur = VAR[v].get(E);
        return { color: VAR[v].color, start: base - 1, lo50: pad.concat([cur], fc.lo50), hi50: pad.concat([cur], fc.hi50), lo90: pad.concat([cur], fc.lo90), hi90: pad.concat([cur], fc.hi90), mean: pad.concat([cur], fc.mean) };
    }
    const CHIP_VARS = ['growth', 'infl', 'unemp', 'rate', 'yield'];
    function renderToolbar() {
        const tb = document.getElementById('t69Toolbar'); if (!tb) return;
        tb.innerHTML = `<span class="t69-seg">${[['overview', '개요'], ['analysis', '분석'], ['region', '지역']].map(([k, l]) => `<button type="button" data-view="${k}" class="${E.ui.view === k ? 'on' : ''}">${l}</button>`).join('')}</span>
            ${E.ui.view === 'analysis' ? `<span class="t69-dim">${esc(E.ui.preset === 'custom' ? '직접 고른 배치' : PRESET_MODS[E.ui.preset]?.name || '')}</span>` : ''}
            <span class="t69-seg">${RANGES.map(([k, l]) => `<button type="button" data-range="${k}" class="${String(E.ui.range) === k && !E.ui.zoom ? 'on' : ''}">${l}</button>`).join('')}</span>
            ${E.ui.zoom ? '<button type="button" class="t69-btn t69-sm" data-act="unzoom">확대 해제</button>' : ''}
            <span class="t69-grow"></span>
            <button type="button" class="t69-btn t69-sm" data-act="csv" title="모든 시점 · 지표 표를 CSV로">CSV</button>
            <button type="button" class="t69-btn t69-sm" data-act="full" title="크게 보기 (Esc로 복귀)">${E.ui.full ? '⤡ 작게' : '⛶ 크게'}</button>`;
        tb.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { E.ui.view = b.dataset.view; renderDisp(); }; });
        tb.querySelectorAll('[data-range]').forEach(b => { b.onclick = () => { E.ui.range = b.dataset.range; E.ui.zoom = null; renderDisp(); if (curSub() === 'analysis') renderTab('analysis'); }; });
        tb.querySelector('[data-act="unzoom"]')?.addEventListener('click', () => { E.ui.zoom = null; renderDisp(); });
        tb.querySelector('[data-act="csv"]').onclick = () => C.csv(tableSpec());
        tb.querySelector('[data-act="full"]').onclick = () => toggleFull();
    }
    function renderDisp() {
        if (!dispActive()) return;
        ensureInit();
        renderToolbar();
        const box = document.getElementById('t69Disp'); if (!box) return;
        box.textContent = '';
        try {
            if (E.ui.view === 'analysis') renderAnalysisDisp(box);
            else if (E.ui.view === 'region') renderRegionDisp(box);
            else if (E.ui.view === 'metric' && METRICS[E.ui.metric]) renderMetricDisp(box);
            else renderOverviewDisp(box);
        } catch (e) { console.error(e); box.textContent = '그래프를 그리지 못했습니다: ' + e.message; }
    }
    const section = (box, title, sub) => {
        const s = document.createElement('section'); s.className = 't69-sec';
        if (title) { const h = document.createElement('h4'); h.textContent = title; if (sub) { const sp = document.createElement('span'); sp.className = 't69-dim'; sp.textContent = ' ' + sub; h.appendChild(sp); } s.appendChild(h); }
        const body = document.createElement('div'); s.appendChild(body); box.appendChild(s);
        return body;
    };
    function renderOverviewDisp(box) {
        const N = E.nat, last = E.hist[E.hist.length - 2];
        const spark = k => E.hist.slice(-8).map(h => h.n[k]);
        // 첫 줄: 신용등급 + 경제 경고 신호 (켜진 신호는 상태색 · 꺼진 신호는 흐리게) / 둘째 줄: 계기 6개
        const rt = E.rating || ratingOf(E);
        const sigAll = signals(E);
        const top = el(`<div class="t69-toprow">
            <div class="t69-rating t69-rating-row t69-grade-${rt[0].startsWith('A') ? 'a' : rt[0].startsWith('B') ? 'b' : 'c'}" title="신용등급 — 신뢰도와 국가부채로 정해짐"><b>${rt[0]}</b><div><span>${rt[1]}</span><em>${esc(turnLabel(E, E.turn))} · GDP ${esc(gdpText())}</em></div></div>
            <div class="t69-warnsigns"><div class="t69-warn-h">경제 경고 신호</div><div class="t69-warn-list">${sigAll.map(s => `<span class="t69-warn ${s.on ? 'on t69-warn-' + s.status : ''}" title="${s.on ? STATUS_WORD[s.status] : '꺼짐'}">${s.on ? `<i class="t69-wi t69-st-${s.status}">${C.STATUS[s.status].icon}</i>` : '○'} ${esc(s.label)}</span>`).join('')}</div></div>
        </div>`);
        box.appendChild(top);
        const gs = document.createElement('div'); gs.className = 't69-gauges'; box.appendChild(gs);
        [['infl', '인플레', -5, 60, 'monetary'], ['growth', '성장률', -10, 10, 'fiscal'], ['unemp', '실업률', 0, 40, 'region'], ['debt', '부채비율', 0, 250, 'fiscal'], ['mood', '민심', 0, 100, 'region'], ['conf', '신뢰도', 0, 100, 'monetary']].forEach(([k, l, mn, mx, go]) => {
            const g = document.createElement('div'); gs.appendChild(g);
            const v = VAR[k].get(E);
            C.gauge(g, { label: l, value: v, unit: VAR[k].unit === '%' ? '%' : '', min: mn, max: mx, maxPlus: k === 'infl' || k === 'debt', bands: bandsOf(k), status: statusOf(k, v), spark: spark(k), delta: last ? v - last.n[k] : null, decimals: 1,
                // 누르면 예전처럼 왼쪽 탭만, Shift + 클릭(Shift + Enter)이면 오른쪽에 그 지표의 세부 정보
                title: `누르면 왼쪽 ${({ monetary: '통화', fiscal: '재정', region: '지역' })[go]} 탭 · Shift + 클릭하면 ${l} 세부 정보`,
                onClick: e => { if (e && e.shiftKey) showMetric(k); else { keepDisp = true; switchSubTab('economy', go); } } });
        });
        box.appendChild(el('<div class="t69-dim t69-small">계기를 누르면 왼쪽 탭으로 · <b>Shift + 클릭</b>하면 그 지표의 세부 정보(예측 · 관련 경고 · 패키지 정책)</div>'));
        // 셋째 줄: 금액 — 비율(GDP 대비)만으로는 실제 규모를 알 수 없으니 화폐 단위로 (세입 · 세출 · 이자는 연간)
        const bq = budgetOf(E, N, distList()), prevN = last ? last.n : null;
        const chg = (now, before) => (before == null || !Number.isFinite(before) ? '' : `<em class="${now >= before ? 'up' : 'down'}">${now >= before ? '▲' : '▼'} ${Math.round(Math.abs(now - before)).toLocaleString()}</em>`);
        const amt = pctGdp => pctGdp * N.gdp / 100, amtThen = (k) => (prevN && Number.isFinite(prevN[k]) ? prevN[k] * prevN.gdp / 100 : null);
        const fin = [
            ['GDP', gdpText(), `성장률 ${pct(N.growth)} (전년 대비)`, chg(N.gdp, prevN?.gdp)],
            ['국가부채', money(N.debt), `GDP의 ${pct(N.debt, 0)}`, chg(amt(N.debt), amtThen('debt')), N.debt > E.thresholds.default ? 'critical' : N.debt > 90 ? 'serious' : ''],
            ['국고 (예비비)', money(N.reserves), N.reserves > 0 ? `GDP의 ${pct(N.reserves)}` : '비어 있음', chg(amt(N.reserves), amtThen('reserves'))],
            ['세입 (연간)', money(N.rev), `GDP의 ${pct(N.rev)}`, ''],
            ['세출 (연간)', money(N.spend), `GDP의 ${pct(N.spend)}`, ''],
            [N.balance < 0 ? '재정 적자 (연간)' : '재정 흑자 (연간)', money(Math.abs(N.balance)), `GDP의 ${pct(Math.abs(N.balance))}`, '', N.balance < -6 ? 'serious' : ''],
            ['국채 이자 (연간)', money(bq.mand.interest), `국채금리 ${pct(N.yield)}`, ''],
        ];
        box.appendChild(el(`<div class="t69-fin" aria-label="재정 금액">${fin.map(([l, v, sub, d, st]) => `<div class="t69-fin-i ${st ? 't69-fin-' + st : ''}"><span>${l}</span><b>${esc(v)}</b><small>${esc(sub)} ${d}</small></div>`).join('')}</div>`));
        // 이대로면 다음 칸 — 재정 금액 줄 다음에, 왼쪽 개요의 미리보기를 크게 (지금 · 흔들림 없는 다음 칸 예측)
        const pv = el('<div class="t69-preview t69-preview-big t69-card"></div>');
        box.appendChild(pv); renderPreview(pv);
        // 큰 그래프 — 같은 단위(%)인 지표만 겹쳐 봄 (두 눈금 겹치지 않게)
        const body = section(box, '추이', '— 칩을 눌러 겹쳐 볼 지표를 고르세요 (같은 % 눈금) · 점선은 예측');
        const chips = el(`<div class="t69-chips">${CHIP_VARS.map(k => `<button type="button" data-chip="${k}" class="t69-chip ${E.ui.chips.includes(k) ? 'on' : ''}" aria-pressed="${E.ui.chips.includes(k)}"><i style="background:${VAR[k].color}"></i>${VAR[k].label}</button>`).join('')}</div>`);
        body.appendChild(chips);
        chips.querySelectorAll('[data-chip]').forEach(b => { b.onclick = () => { const s = new Set(E.ui.chips); if (s.has(b.dataset.chip)) { if (s.size > 1) s.delete(b.dataset.chip); } else s.add(b.dataset.chip); E.ui.chips = CHIP_VARS.filter(k => s.has(k)); renderDisp(); }; });
        const chart = document.createElement('div'); body.appendChild(chart);
        const { H, n, x, t, col } = series(), h = 4;
        const sel = E.ui.chips.filter(k => CHIP_VARS.includes(k));
        const fc = forecast(sel, h, 32);
        const xs = withForecast(x, h), ts = withForecastT(t, h);
        const ser = [];
        sel.forEach(k => {
            ser.push({ id: k, label: VAR[k].label, color: VAR[k].color, values: col(hh => hh.n[k]).concat(Array(h).fill(null)) });
            ser.push({ id: k + '_f', label: `${VAR[k].label} 예측`, color: VAR[k].color, dash: true, width: 1.5, values: Array(n - 1).fill(null).concat([VAR[k].get(E)], fc[k].mean) });
        });
        const [i0] = rangeIdx(n);
        C.lines(chart, { x: xs, t: ts, series: ser, unit: '%', height: 260, zero: true, markers: markersOf(H), shade: recessions(H), fan: sel.length ? [fanFor(sel[0], n, h, fc[sel[0]])] : [], range: [i0, xs.length - 1] });
        // 예산
        const bb = section(box, `예산 (연간 · ${E.settings.scale}${CUR()})`, E.settings.budgetView === 'hemi' ? '— 위 세출 · 아래 세입, 넓이 = 금액' : '— 같은 축의 세출 · 세입');
        const sp = budgetPies();
        const opt = { spend: sp.spend, rev: sp.rev, unit: '', center: [`${N.balance < 0 ? '적자' : '흑자'} ${Math.abs(N.balance).toFixed(1)}%`, 'GDP 대비'] };
        if (E.settings.budgetView === 'bars') C.budgetBars(bb, opt); else C.budgetHemi(bb, opt);
        const sw = el(`<div class="t69-dim t69-small" style="margin-top:4px"><button type="button" class="t69-btn t69-sm" data-act="bview">${E.settings.budgetView === 'bars' ? '예산 반원으로 보기' : '가로 막대로 보기'}</button></div>`);
        bb.appendChild(sw);
        sw.querySelector('button').onclick = () => { E.settings.budgetView = E.settings.budgetView === 'bars' ? 'hemi' : 'bars'; renderDisp(); };
    }
    // ===== 지표 하나 보기 — 개요의 계기를 누르면 시각 화면이 그 지표 중심으로 바뀐다 =====
    // 이대로면 다음 칸 · 1년 뒤(예측 중앙값과 50% 범위) · 지금과 비교, 그 지표와 관련된 경고 신호만, 무엇이 움직이는지(정책 민감도),
    // 그 지표에 듣는 패키지 정책(1년 뒤 예상과 함께 바로 쓰기)
    const METRICS = {
        infl: { label: '인플레', min: -5, max: 60, go: 'monetary', goLabel: '통화', signals: ['hyper', 'printing', 'collapse'], pkgs: ['qt', 'qe', 'devalue'],
            note: () => { const g = growthTrend(E.nat); return `안전 범위는 성장 흐름(최근 약 3년)에 따라 넓어지고, 고성장 · 과열일수록 물가가 크게 출렁입니다 — 지금 성장 흐름 ${pct(g)}면 안전 상한 ${pct(Math.min(5 + inflSafeExtra(g), E.thresholds.hyper))}`; } },
        growth: { label: '성장률', min: -10, max: 10, go: 'fiscal', goLabel: '재정', signals: ['negative', 'collapse', 'financial'], pkgs: ['qe', 'taxcut', 'devalue'] },
        unemp: { label: '실업률', min: 0, max: 40, go: 'region', goLabel: '지역', signals: ['depression', 'negative', 'collapse'], pkgs: ['qe', 'taxcut'] },
        debt: { label: '부채비율', min: 0, max: 250, go: 'fiscal', goLabel: '재정', signals: ['default', 'deficit', 'ceiling', 'reserves', 'financial'], pkgs: ['taxhike', 'qt'] },
        mood: { label: '민심', min: 0, max: 100, go: 'region', goLabel: '지역', signals: ['negative', 'depression', 'hyper', 'collapse'], pkgs: ['taxcut', 'qe'] },
        conf: { label: '신뢰도', min: 0, max: 100, go: 'monetary', goLabel: '통화', signals: ['flight', 'financial', 'default', 'printing'], pkgs: ['qt', 'taxhike'] },
    };
    const PKG_INFO = {
        qe: { name: '양적완화', mut: s => { s.temps.push({ type: 'qe', left: 4 }); } },
        qt: { name: '양적긴축', mut: s => { s.temps.push({ type: 'qt', left: 4 }); } },
        devalue: { name: '평가절하', mut: s => { s.nat.cur *= 0.88; s.nat.conf = Math.max(0, s.nat.conf - 5); } },
        taxcut: { name: '한시적 감세', mut: s => { s.temps.push({ type: 'taxcut', left: 4 }); } },
        taxhike: { name: '한시적 증세', mut: s => { s.temps.push({ type: 'taxhike', left: 4 }); } },
    };
    function showMetric(k) { E.ui.metric = k; showDisp('metric'); }
    function renderMetricDisp(box) {
        const k = E.ui.metric, M = METRICS[k], v = VAR[k].get(E), unit = VAR[k].unit === '%' ? '%' : '';
        const fmt = x => (Number.isFinite(x) ? x.toFixed(1) : '—') + unit;
        const dunit = unit === '%' ? '%p' : ''; // 변화량은 %p
        const yr = Math.max(1, Math.round(1 / DT[E.unit]));
        const fc = forecast([k], yr, 32);
        const next = fc[k].mean[0], nextLo = fc[k].lo50[0], nextHi = fc[k].hi50[0], yv = fc[k].mean[yr - 1];
        const st = statusOf(k, v), stN = statusOf(k, next), stY = statusOf(k, yv);
        const flat = d => Math.abs(d) < 0.05; // 0.05 미만은 변화 없음으로
        const arrow = d => (flat(d) ? '→' : d > 0 ? '▲' : '▼');
        const dtxt = d => (flat(d) ? '0.0' : sgn(d));
        // 머리: 지표 바꾸기 · 개요로
        box.appendChild(el(`<div class="t69-mhead">
            <button type="button" class="t69-btn t69-sm" data-act="back">← 개요</button>
            <span class="t69-chips">${Object.keys(METRICS).map(m => `<button type="button" class="t69-chip ${m === k ? 'on' : ''}" data-metric="${m}"><i style="background:${VAR[m].color}"></i>${METRICS[m].label}</button>`).join('')}</span>
        </div>`));
        // 지금 · 다음 칸 · 1년 뒤
        const card = (title, val, sub, s) => `<div class="t69-mcard t69-mcard-${s}"><span>${title}</span><b>${esc(val)}</b><small>${sub}</small><em class="t69-st-${s}">${STATUS_WORD[s]}</em></div>`;
        box.appendChild(el(`<div class="t69-mcards">
            ${card(`지금 ${esc(M.label)}`, fmt(v), esc(turnLabel(E, E.turn)), st)}
            ${card(`이대로면 다음 1${UNIT_WORD[E.unit]}`, fmt(next), `${arrow(next - v)} ${dtxt(next - v)}${dunit} · 50% 범위 ${fmt(nextLo)} ~ ${fmt(nextHi)}`, stN)}
            ${yr > 1 ? card(`이대로면 ${spanLabel(yr)} 뒤`, fmt(yv), `${arrow(yv - v)} ${dtxt(yv - v)}${dunit} · 지금보다 ${flat(yv - v) ? '그대로' : yv > v ? '높음' : '낮음'}`, stY) : ''}
        </div>`));
        if (M.note) box.appendChild(el(`<div class="t69-dim t69-small">${esc(M.note())}</div>`));
        // 추이 + 예측
        const body = section(box, `${M.label} 추이`, '— 점선은 지금 정책을 유지할 때의 예측 (진한 띠 50% · 옅은 띠 90%)');
        const chart = document.createElement('div'); body.appendChild(chart);
        const { H, n, x, t, col } = series(), h = Math.max(4, yr);
        const fc2 = h === yr ? fc : forecast([k], h, 32);
        const xs = withForecast(x, h), ts = withForecastT(t, h);
        const [i0] = rangeIdx(n);
        C.lines(chart, { x: xs, t: ts, unit, height: 200, zero: k === 'growth' || k === 'infl', markers: markersOf(H), shade: recessions(H), range: [i0, xs.length - 1],
            fan: [fanFor(k, n, h, fc2[k])],
            series: [{ id: k, label: M.label, color: VAR[k].color, values: col(hh => hh.n[k]).concat(Array(h).fill(null)) },
                { id: k + '_f', label: `${M.label} 예측`, color: VAR[k].color, dash: true, width: 1.5, values: Array(n - 1).fill(null).concat([v], fc2[k].mean) }] });
        // 관련 경고 신호
        const sig = signals(E).filter(s => M.signals.includes(s.id));
        const sb = section(box, `${M.label} 관련 경고 신호`);
        sb.appendChild(el(sig.length ? `<div class="t69-warn-list">${sig.map(s => `<span class="t69-warn ${s.on ? 'on t69-warn-' + s.status : ''}" title="${s.on ? STATUS_WORD[s.status] : '꺼짐'}">${s.on ? `<i class="t69-wi t69-st-${s.status}">${C.STATUS[s.status].icon}</i>` : '○'} ${esc(s.label)}</span>`).join('')}</div>`
            : '<div class="t69-dim t69-small">관련 경고 신호가 없습니다.</div>'));
        // 무엇이 움직이나 — 정책을 하나씩 바꿨을 때 1년 뒤 이 지표의 변화 (큰 순서)
        const lev = sensitivity(k, yr).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 6);
        const lb = section(box, '무엇이 움직이나', `— 하나씩 바꿨을 때 ${spanLabel(yr)} 뒤 ${M.label}의 변화`);
        const mx = Math.max(1e-6, ...lev.map(r => Math.abs(r.value)));
        lb.appendChild(el(lev.length ? `<div class="t69-levers">${lev.map(r => `<div class="t69-lever"><span>${esc(r.label)}${r.sub ? ` <em class="t69-dim">${esc(r.sub)}</em>` : ''}</span>
            <i class="t69-lever-bar"><b class="${r.value >= 0 ? 'pos' : 'neg'}" style="width:${(Math.abs(r.value) / mx * 50).toFixed(1)}%;${r.value >= 0 ? 'left:50%' : `right:50%`}"></b></i><em>${sgn(r.value, 2)}${dunit}</em></div>`).join('')}</div>`
            : '<div class="t69-dim t69-small">눈에 띄게 움직이는 정책이 없습니다.</div>'));
        // 패키지 정책 — 이 지표에 듣는 것만, 1년 뒤 예상과 함께
        const used = E.pkgUsed || 0, lim = E.settings.pkgLimit;
        const base = VAR[k].get(project(null, yr));
        const pb = section(box, '패키지 정책', `— 이번 ${UNIT_WORD[E.unit]} ${used}/${lim} · 숫자는 ${spanLabel(yr)} 뒤 ${M.label} (안 쓰면 ${fmt(base)})`);
        pb.appendChild(el(`<div class="t69-pkgs">${M.pkgs.map(id => {
            const after = VAR[k].get(project(PKG_INFO[id].mut, yr)), d = after - base;
            return `<button type="button" class="t69-pkg" data-pkg="${id}" ${used >= lim ? 'disabled' : ''}><b>${PKG_INFO[id].name}</b><span>${spanLabel(yr)} 뒤 ${esc(M.label)} ${fmt(after)} <em class="${d >= 0 ? 'up' : 'down'}">(${sgn(d, 2)}${dunit})</em> · ${STATUS_WORD[statusOf(k, after)]}</span></button>`;
        }).join('')}</div>`));
        pb.appendChild(el(`<div class="t69-actions"><button type="button" class="t69-btn t69-sm" data-act="go">${esc(M.goLabel)} 탭에서 직접 조정 →</button></div>`));
        box.querySelector('[data-act="back"]').onclick = () => showDisp('overview');
        box.querySelectorAll('[data-metric]').forEach(b => { b.onclick = () => showMetric(b.dataset.metric); });
        box.querySelectorAll('[data-pkg]').forEach(b => { b.onclick = () => usePackage(b.dataset.pkg); });
        box.querySelector('[data-act="go"]').onclick = () => { switchSubTab('economy', M.go); showMetric(k); };
    }
    // 예산 구성 — 세출은 묶음 + 의무지출, 세입은 세목 (큰 순서 5개 + 기타로 접음 — 색 8개 안에서)
    const SLOT = i => `var(--s${(i % 8) + 1})`;
    function budgetPies() {
        const b = budgetOf(E, E.nat, distList()), G = E.nat.gdp / 100;
        const groups = {};
        itemDefs().forEach(d => { const g = d.group || '기타'; groups[g] = (groups[g] || 0) + (b.spend[d.id] || 0); });
        const spend = Object.entries(groups).map(([g, v]) => ({ label: g, value: v * G }));
        spend.push({ label: '국채 이자', value: b.mand.interest * G }, { label: '연금 · 실업급여', value: (b.mand.pension + b.mand.unemp) * G });
        spend.forEach((s, i) => { s.color = SLOT(i); });
        const tnames = Object.fromEntries(taxDefs().map(t => [t.id, t.name]));
        let rev = Object.entries(b.rev).map(([id, v]) => ({ label: tnames[id] || (id === '_tribute' ? '종속국 공납' : '기타 수입'), value: v * G })).sort((a, b2) => b2.value - a.value);
        if (rev.length > 6) { const rest = rev.slice(5); rev = rev.slice(0, 5).concat([{ label: '기타', value: sum(rest.map(r => r.value)) }]); }
        // 세입은 세출과 다른 색 계열(보라 한 가지 색의 진하기 — 큰 세목일수록 진하게)로 — 위아래 반원에 같은 색이 다른 뜻으로 나오지 않게
        rev.forEach((r, i) => { r.color = REV(i); });
        return { spend, rev, b };
    }
    const REV = i => `var(--rv${Math.min(i, 5) + 1})`;
    function renderAnalysisDisp(box) {
        const { H, n, x, t, col } = series();
        const range = rangeIdx(n), markers = markersOf(H), shade = recessions(H);
        const onRange = (a, b) => { E.ui.zoom = [a, b]; renderDisp(); };
        const mods = currentMods();
        const need = new Set();
        if (mods.includes('cycleP')) need.add('growth');
        if (mods.includes('inflP')) need.add('infl');
        if (mods.includes('debt')) need.add('debt');
        if (mods.includes('fan')) need.add(E.ui.target);
        const h = 8, fc = need.size ? forecast([...need], h, 48) : {};
        const xs = withForecast(x, h), ts = withForecastT(t, h), padF = arr => arr.concat(Array(h).fill(null));
        const rng2 = [range[0], E.ui.zoom ? range[1] : xs.length - 1];
        const fanOf = v => (fc[v] ? [fanFor(v, n, h, fc[v])] : []);
        const S1 = (k, extra) => ({ id: k, label: VAR[k].label, color: VAR[k].color, values: padF(col(hh => hh.n[k])), ...(extra || {}) });
        const fmean = k => (fc[k] ? [{ id: k + 'f', label: `${VAR[k].label} 예측(중앙)`, color: VAR[k].color, dash: true, width: 1.5, values: Array(n - 1).fill(null).concat([VAR[k].get(E)], fc[k].mean) }] : []);
        mods.forEach(m => {
            if (m === 'cycleP') {
                const b = section(box, '경기 순환', `— 같은 십자선 · 회색 = 경기 침체(마이너스 성장이 이어진 기간) · 아래 미니맵을 끌어 기간 확대`);
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, overview: { series: S1('growth') }, panels: [
                    { title: '성장률 (전년 대비, %)', unit: '%', zero: true, series: [S1('growth')].concat(fmean('growth')), fan: fanOf('growth') },
                    { title: '실업률 (%)', unit: '%', series: [S1('unemp')] },
                    { title: '인플레 (%)', unit: '%', series: [S1('infl')], log: E.ui.log },
                    { title: '기준금리 · 국채금리 (%)', unit: '%', series: [S1('rate'), S1('yield')] },
                ] });
            }
            if (m === 'decompG') {
                const b = section(box, '성장 기여도 분해', `— ${UNIT_WORD[E.unit]}마다 그 기간 성장(연율로 환산)을 원인별로 나눔 · 선 = 그 기간 성장률`);
                const g = k => padF(H.map(hh => (hh.dec ? hh.dec.g[k] : null)));
                C.stackBars(b, { x: xs, t: ts, range: [range[0], range[1]], unit: '%p', net: { label: '그 기간 성장률 (연율)', values: padF(col(hh => hh.n.gq ?? hh.n.growth)) }, parts: [
                    { id: 'pot', label: '잠재성장 (기술 · 인적자본 · 인프라)', color: 'var(--s1)', values: g('pot') }, { id: 'fiscal', label: '재정 (지출 · 세금 변화)', color: 'var(--s2)', values: g('fiscal') },
                    { id: 'monetary', label: '통화 (실질금리 · 양적완화)', color: 'var(--s3)', values: g('monetary') }, { id: 'money', label: '통화량', color: 'var(--s4)', values: g('money') },
                    { id: 'fx', label: '환율 (수출)', color: 'var(--s5)', values: g('fx') }, { id: 'tax', label: '세율 부작용', color: 'var(--s6)', values: g('tax') }, { id: 'noise', label: '예상 밖 충격', color: 'var(--s7)', values: g('noise') }, { id: 'event', label: '이벤트 (위기 · 호황)', color: 'var(--s8)', values: g('event') },
                ] });
            }
            if (m === 'inflP') {
                const b = section(box, '인플레', '— 로그 눈금은 분석 탭에서');
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, overview: { series: S1('infl') }, panels: [
                    { title: '인플레 (%)', unit: '%', series: [S1('infl')].concat(fmean('infl')), fan: fanOf('infl'), log: E.ui.log },
                    { title: '연간 통화 증가 (%)', unit: '%', series: [{ id: 'm', label: '통화 증가', color: 'var(--s4)', values: padF(col(hh => hh.n.print * 4)) }], log: E.ui.log },
                    { title: '통화가치 (지수, 처음 100)', unit: '', series: [S1('cur')] },
                ] });
            }
            if (m === 'decompP') {
                const b = section(box, '인플레 분해', '— 기대 + 과열 + 통화 + 수입물가 + 세금 · 기타 + 조정 지연 = 실제 인플레');
                const g = k => padF(H.map(hh => (hh.dec ? hh.dec.p[k] : null)));
                C.stackBars(b, { x: xs, t: ts, range: [range[0], range[1]], unit: '%p', net: { label: '인플레', values: padF(col(hh => hh.n.infl)) }, parts: [
                    { id: 'exp', label: '기대 인플레', color: 'var(--s1)', values: g('exp') }, { id: 'gap', label: '수요 견인 (총수요)', color: 'var(--s2)', values: g('gap') },
                    { id: 'money', label: '과잉 통화', color: 'var(--s3)', values: g('money') }, { id: 'imp', label: '수입물가 (통화가치)', color: 'var(--s4)', values: g('imp') },
                    { id: 'other', label: '세금 · 기타', color: 'var(--s5)', values: g('other') }, { id: 'adj', label: '조정 지연', color: 'var(--s7)', values: g('adj') },
                ] });
            }
            if (m === 'traj') {
                const b = section(box, '경제 궤적', `— ${UNIT_WORD[E.unit]}마다 실업률 × 인플레 점을 이은 길 (오른쪽 위 = 스태그플레이션)`);
                C.trajectory(b, { points: H.map(hh => ({ x: hh.n.unemp, y: hh.n.infl, label: hh.label })), xLabel: '실업률 (%)', yLabel: '인플레 (%)', range });
            }
            if (m === 'debt') {
                const b = section(box, '부채 동학', '— r − g가 양수면 기초재정수지가 0이어도 부채비율이 불어남');
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, overview: { series: S1('debt') }, panels: [
                    { title: '국가부채 (GDP 대비 %)', unit: '%', series: [S1('debt')].concat(fmean('debt')), fan: fanOf('debt') },
                    { title: 'r − g (국채금리 − 명목성장률, %p)', unit: '%p', zero: true, series: [{ id: 'rg', label: 'r − g', color: 'var(--s7)', values: padF(col(hh => hh.n.yield - (hh.n.growth + hh.n.infl))) }] },
                    { title: '기초재정수지 (이자 제외, GDP 대비 %)', unit: '%', zero: true, series: [{ id: 'pb', label: '기초재정수지', color: 'var(--s6)', values: padF(col(hh => hh.n.balance + (hh.bud?.mand?.interest || 0))) }] },
                ] });
            }
            if (m === 'rates') {
                const b = section(box, '금리 차', '— 위험 프리미엄이 커지면 시장이 국채를 믿지 않는다는 뜻');
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, panels: [
                    { title: '기준금리 · 국채금리 (%)', unit: '%', series: [S1('rate'), S1('yield')] },
                    { title: '위험 프리미엄 (국채 − 기준, %p)', unit: '%p', zero: true, series: [{ id: 'prem', label: '위험 프리미엄', color: 'var(--s8)', values: padF(col(hh => hh.n.yield - hh.n.rate)) }] },
                ] });
            }
            if (m === 'sankey') {
                const b = section(box, `예산 흐름도 (연간 · ${E.settings.scale}${CUR()})`, '— 세목 → 국고 → 지출 묶음 → 항목 · 굵기 = 금액');
                C.sankey(b, sankeySpec());
            }
            if (m === 'spendStack') {
                const b = section(box, '예산 구성 변화', '— 세출(GDP 대비 %) 묶음별 · 선 = 세입');
                const groups = [...new Set(itemDefs().map(d => d.group || '기타'))];
                const parts = groups.map((g, i) => ({ id: g, label: g, color: SLOT(i), values: padF(H.map(hh => sum(itemDefs().filter(d => (d.group || '기타') === g).map(d => hh.bud?.spend?.[d.id] || 0)))) }));
                parts.push({ id: 'mand', label: '의무지출', color: SLOT(groups.length), values: padF(H.map(hh => sum(Object.values(hh.bud?.mand || {})))) });
                C.stackBars(b, { x: xs, t: ts, range: [range[0], range[1]], unit: '%', net: { label: '세입', values: padF(col(hh => hh.n.rev)) }, parts: parts.slice(0, 8) });
            }
            if (m === 'scatter') renderScatterTo(section(box, '지역 산점도', '— 원 하나 = 지역구 · 크기 = 인구 · 색 = 민심(파랑 좋음 · 빨강 나쁨) · 지도와 연동'));
            if (m === 'map') renderMapTo(section(box, `지역구 지도 — ${MAP_BY[E.ui.mapBy]}`));
            if (m === 'tornado') {
                const v = E.ui.target, hz = Number(E.ui.horizon) || 4;
                const b = section(box, `정책 민감도 — ${VAR[v].label}`, `— 조작 하나를 바꿨을 때 ${spanLabel(hz)} 뒤 ${VAR[v].label} 변화 (흔들림 없이 비교)`);
                C.tornado(b, { rows: sensitivity(v, hz), unit: VAR[v].unit === '%' ? '%p' : '', decimals: 2 });
            }
            if (m === 'fan') {
                const v = E.ui.target, b = section(box, `예측 부채꼴 — ${VAR[v].label}`, '— 지금 정책을 유지할 때, 진한 띠 50% · 옅은 띠 90% 범위');
                C.lines(b, { x: xs, t: ts, series: [S1(v)].concat(fmean(v)), fan: fanOf(v), unit: VAR[v].unit, zero: v === 'growth' || v === 'balance', markers, shade, range: rng2, height: 240 });
            }
            if (m === 'assets') {
                const b = section(box, '자산 추이', '— 기준 50 · 지출로 쌓이고 해마다 줄어듦');
                const ad = assetDefs().slice(0, 8);
                C.lines(b, { x, t, series: ad.map((a, i) => ({ id: a.id, label: a.name, color: SLOT(i), values: col(hh => hh.a?.[a.id]) })), unit: '', range, markers, height: 240 });
                C.legend(b, ad.map((a, i) => ({ label: a.name, color: SLOT(i) })));
            }
            if (m === 'table') {
                const b = section(box, '데이터 표', '— 모든 시점 · 지표 (CSV는 위 버튼)');
                const spec = tableSpec(); spec.rows = spec.rows.slice().reverse();
                C.table(b, spec);
            }
        });
        if (!mods.length) box.appendChild(el('<div class="t69-dim">왼쪽 경제 › 분석에서 볼 그래프를 고르세요.</div>'));
    }
    function sankeySpec() {
        const { b } = budgetPies(), G = E.nat.gdp / 100;
        const tnames = Object.fromEntries(taxDefs().map(t => [t.id, t.name]));
        const col0 = Object.entries(b.rev).filter(([, v]) => v > 0).sort((a, b2) => b2[1] - a[1]).map(([id, v], i) => ({ id: 'r_' + id, label: tnames[id] || (id === '_tribute' ? '종속국 공납' : '기타 수입'), value: v * G, color: REV(i) }));
        const deficit = Math.max(0, -E.nat.balance) * G, surplus = Math.max(0, E.nat.balance) * G;
        if (deficit > 0) col0.push({ id: 'r_debt', label: '국채 발행', value: deficit, color: 'var(--critical)' });
        const total = sum(col0.map(n => n.value));
        const col1 = [{ id: 'treasury', label: '국고', value: total, color: 'var(--t69-ink2)' }];
        const groups = {};
        itemDefs().forEach(d => { const g = d.group || '기타'; (groups[g] = groups[g] || []).push(d); });
        const gEntries = Object.entries(groups);
        const col2 = gEntries.map(([g, ds], i) => ({ id: 'g_' + g, label: g, value: sum(ds.map(d => (b.spend[d.id] || 0) * G)), color: SLOT(i) }));
        col2.push({ id: 'g_mand', label: '의무지출', value: sum(Object.values(b.mand)) * G, color: SLOT(gEntries.length) });
        if (surplus > 0) col2.push({ id: 'g_res', label: '국고 적립', value: surplus, color: 'var(--good)' });
        const col3 = [];
        gEntries.forEach(([g, ds], i) => ds.forEach(d => { const v = (b.spend[d.id] || 0) * G; if (v > 0) col3.push({ id: 'i_' + d.id, label: d.name, value: v, color: SLOT(i), g: 'g_' + g }); }));
        [['interest', '국채 이자'], ['pension', '연금'], ['unemp', '실업급여']].forEach(([k, l]) => { const v = (b.mand[k] || 0) * G; if (v > 0) col3.push({ id: 'm_' + k, label: l, value: v, color: SLOT(gEntries.length), g: 'g_mand' }); });
        const links = col0.map(n => ({ from: n.id, to: 'treasury', value: n.value, color: n.color }))
            .concat(col2.map(n => ({ from: 'treasury', to: n.id, value: n.value, color: n.color })))
            .concat(col3.map(n => ({ from: n.g, to: n.id, value: n.value, color: n.color })));
        return { cols: [col0, col1, col2, col3], links, unit: '' };
    }
    // ---- 지역 (산점도 · 지도) ----
    const RAMP = ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'];
    const DIV = ['#e34948', '#ef8584', '#f5bcbb', '#c9c8c2', '#9ec5f4', '#5598e7', '#2a78d6'];
    const rampAt = (t, arr) => arr[clamp(Math.floor(t * arr.length), 0, arr.length - 1)];
    function regionMetric(k) {
        const d = E.dist[k]; if (!d) return null;
        const keys = distList(), P = sum(keys.map(x => E.dist[x].pop)) || 1;
        switch (E.ui.mapBy) {
            case 'gdppc': return d.gdp / E.nat.gdp / (d.pop / P) * 100;
            case 'unemp': return d.unemp;
            case 'mood': return d.mood;
            case 'income': return d.income;
            case 'industry': return d.ind.indexOf(Math.max(...d.ind));
        }
        return null;
    }
    // 민심 색 — 50(보통)을 회색으로, ±15 안에서 빨강(나쁨) ↔ 파랑(좋음)
    const moodColor = m => rampAt(clamp(0.5 + (m - 50) / 30, 0, 0.999), DIV);
    function regionFill(k) {
        const v = regionMetric(k); if (v == null) return null;
        if (E.ui.mapBy === 'industry') return ['var(--s6)', 'var(--s1)', 'var(--s2)'][v];
        if (E.ui.mapBy === 'mood') return moodColor(v);
        const vals = distList().map(regionMetric).filter(Number.isFinite), lo = Math.min(...vals), hi = Math.max(...vals);
        return rampAt(hi > lo ? (v - lo) / (hi - lo) : 0.5, RAMP);
    }
    function renderMapTo(body) {
        const wrap = document.createElement('div'); wrap.className = 't69-map'; wrap.id = 't69MapWrap'; body.appendChild(wrap);
        if (distList()[0] === '__nation' || typeof renderDistrictSvgInto !== 'function') { wrap.textContent = '지역구 지도가 없습니다 — 국가 › 지역구 지도에서 지도를 올리세요.'; return; }
        const fmt = k => { const v = regionMetric(k); return E.ui.mapBy === 'industry' ? ['농업', '제조업', '서비스업'][v] : E.ui.mapBy === 'gdppc' ? `1인당 GDP ${v.toFixed(0)} (전국 100)` : E.ui.mapBy === 'income' ? `소득등급 ${v.toFixed(1)}` : `${MAP_BY[E.ui.mapBy]} ${v.toFixed(1)}`; };
        renderDistrictSvgInto(wrap, { chamber: 'house', getFill: k => (E.dist[k] && !excludedKey(k) ? regionFill(k) : null), title: k => (E.dist[k] && !excludedKey(k) ? `${nameOf(k)} — ${fmt(k)}` : nameOf(k)), clickable: false, noZoom: true });
        const lg = E.ui.mapBy === 'industry' ? [['농업', 'var(--s6)'], ['제조업', 'var(--s1)'], ['서비스업', 'var(--s2)']] : E.ui.mapBy === 'mood' ? [['나쁨', DIV[0]], ['보통', DIV[3]], ['좋음', DIV[6]]] : [['낮음', RAMP[0]], ['', RAMP[3]], ['높음', RAMP[6]]];
        C.legend(body, lg.map(([l, c]) => ({ label: l, color: c })));
    }
    function renderScatterTo(body) {
        const keys = distList().filter(k => k !== '__nation');
        if (!keys.length) { body.textContent = '지역구가 없습니다.'; return; }
        const P = sum(keys.map(k => E.dist[k].pop)) || 1;
        C.scatter(body, {
            xLabel: '1인당 GDP', xUnit: '전국 100', yLabel: '실업률', yUnit: '%', height: 320,
            points: keys.map(k => { const d = E.dist[k]; return { id: k, x: d.gdp / E.nat.gdp / (d.pop / P) * 100, y: d.unemp, size: d.pop, color: moodColor(d.mood), label: nameOf(k), extra: [{ value: d.mood.toFixed(0), label: '민심' }, { value: d.income.toFixed(1), label: '소득등급' }, { value: (d.pop).toLocaleString(), label: '인구' }] }; }),
            legendItems: [{ label: '민심 나쁨', color: DIV[0] }, { label: '보통', color: DIV[3] }, { label: '좋음', color: DIV[6] }],
            onClick: k => { E.ui.openDist = k; switchSubTab('economy', 'region'); },
        });
    }
    function renderRegionDisp(box) {
        renderMapTo(section(box, `지역구 지도 — ${MAP_BY[E.ui.mapBy]}`, '— 색칠 기준은 경제 › 지역에서'));
        renderScatterTo(section(box, '지역 산점도', '— 원을 누르면 그 지역구 편집'));
        const keys = distList().filter(k => k !== '__nation');
        if (keys.length) {
            const P = sum(keys.map(k => E.dist[k].pop)) || 1;
            const b = section(box, '지역구 표');
            C.table(b, { cols: [{ key: 'name', label: '지역구' }, { key: 'pc', label: '1인당 GDP', fmt: v => v.toFixed(0) }, { key: 'u', label: '실업률', fmt: v => v.toFixed(1) + '%' }, { key: 'm', label: '민심', fmt: v => v.toFixed(0) }, { key: 'inc', label: '소득', fmt: v => v.toFixed(1) }, { key: 'ind', label: '농 · 제 · 서' }],
                rows: keys.map(k => { const d = E.dist[k]; return { name: nameOf(k), pc: d.gdp / E.nat.gdp / (d.pop / P) * 100, u: d.unemp, m: d.mood, inc: d.income, ind: d.ind.map(v => Math.round(v * 100)).join(' · ') }; }).sort((a, b2) => b2.pc - a.pc) });
        }
    }
    function tableSpec() {
        const f = d => v => (Number.isFinite(v) ? v.toFixed(d) : '');
        return {
            filename: `economy_${(E.hist[0]?.label || 'T0').replace(/\s+/g, '')}-${(E.hist[E.hist.length - 1]?.label || '').replace(/\s+/g, '')}.csv`,
            cols: [{ key: 'label', label: '시점' }, { key: 'gdp', label: `GDP(${E.settings.scale}${CUR()})`, fmt: f(0), raw: v => Math.round(v) }, { key: 'growth', label: '성장률%', fmt: f(2), raw: r2 }, { key: 'infl', label: '인플레%', fmt: f(2), raw: r2 },
                { key: 'unemp', label: '실업률%', fmt: f(2), raw: r2 }, { key: 'rate', label: '기준금리%', fmt: f(2), raw: r2 }, { key: 'yield', label: '국채금리%', fmt: f(2), raw: r2 }, { key: 'debt', label: '부채%', fmt: f(1), raw: r2 },
                { key: 'balance', label: '재정수지%', fmt: f(2), raw: r2 }, { key: 'cur', label: '통화가치', fmt: f(1), raw: r2 }, { key: 'conf', label: '신뢰도', fmt: f(1), raw: r2 }, { key: 'mood', label: '민심', fmt: f(1), raw: r2 }, { key: 'ev', label: '사건' }],
            rows: E.hist.map(h => ({ label: h.label, ...h.n, ev: (h.ev || []).map(e => e.label).join(' / ') })),
        };
    }

    // ================= 우클릭 내보내기 (경제 그래프) =================
    document.addEventListener('contextmenu', e => {
        const svg = e.target.closest && e.target.closest('#t69Disp svg.t69-svg');
        if (!svg) return;
        e.preventDefault(); e.stopPropagation();
        svg.dataset.exportKind = 't69chart';
        try { canvasExportTarget = svg; } catch (err) { return; } // eslint-disable-line no-undef
        const menu = document.getElementById('canvasExportMenu');
        if (!menu) return;
        menu.style.display = 'block';
        try { positionFloatingBox(menu, e.clientX, e.clientY); } catch (err) { menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; } // eslint-disable-line no-undef
    }, true);
    const origOpenExport = window.openExportDialog;
    if (typeof origOpenExport === 'function') {
        window.openExportDialog = function () {
            const r = origOpenExport.apply(this, arguments);
            try { if (String(canvasExportTarget?.dataset?.exportKind || '').startsWith('t69')) { const sec = document.getElementById('exportHeaderStatsSection'); if (sec) sec.style.display = 'none'; } } catch (e) { /* 없음 */ } // eslint-disable-line no-undef
            return r;
        };
    }
    const origExportAt = window.exportVisualElementAt;
    if (typeof origExportAt === 'function') {
        window.exportVisualElementAt = function (target, includeStats, format) {
            if (String(target?.dataset?.exportKind || '').startsWith('t69')) return t69Export(target, format);
            return origExportAt.apply(this, arguments);
        };
    }
    function dl(href, name) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    async function t69Export(svg, format) {
        const text = C.exportSvgString(svg), stamp = Date.now().toString(36);
        if (format === 'svg') { dl(URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' })), `economy_${stamp}.svg`); return; }
        const vb = (svg.getAttribute('viewBox') || '0 0 600 300').split(/\s+/).map(Number), sc = 2;
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
        await img.decode();
        const c = document.createElement('canvas'); c.width = vb[2] * sc; c.height = vb[3] * sc;
        const ctx = c.getContext('2d');
        ctx.fillStyle = getComputedStyle(svg.closest('.t69-viz') || document.body).getPropertyValue('--t69-surface') || '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        dl(c.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95), `economy_${stamp}.${format}`);
    }

    // ================= 총선 표시 (그래프 깃발) =================
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') {
        window.elecApplyToParliament = function () {
            const r = origApply.apply(this, arguments);
            if (inited) { addEvent('election', '총선 결과 반영'); if (E.hist.length) E.hist[E.hist.length - 1].ev.push({ t: E.turn, kind: 'election', label: '총선 결과 반영' }); }
            return r;
        };
    }

    // ================= 저장 · 불러오기 =================
    let inited = false;
    function ensureInit() {
        if (inited && E.hist.length) return;
        newEconomy();
        validateDefs();
        inited = true;
    }
    function loadState(src) {
        if (!src || typeof src !== 'object' || !Array.isArray(src.hist) || !src.hist.length) { const ui = E.ui; E = fresh(); E.ui = { ...E.ui, ...ui, full: false }; inited = false; return; }
        const base = fresh();
        E = { ...base, ...deep(src) };
        E.settings = { ...base.settings, ...(src.settings || {}) };
        E.nat = { ...base.nat, ...(src.nat || {}) };
        E.thresholds = { ...base.thresholds, ...(src.thresholds || {}) };
        E.ui = { ...base.ui, ...(src.ui || {}), full: false, zoom: null };
        E.defs = { items: [], assets: [], taxes: [], ...(src.defs || {}) };
        E.spend = { ...base.spend, ...(src.spend || {}) };
        E.taxes = { ...base.taxes, ...(src.taxes || {}) };
        E.assets = { ...base.assets, ...(src.assets || {}) };
        if (/^\d+$/.test(String(E.ui.range))) E.ui.range = 'y' + Math.max(1, Math.round(Number(E.ui.range) / 4)); // 예전 칸 수 → 년
        if (!Number.isFinite(E.clock)) { const t = histT(); E.clock = t[t.length - 1] || 0; }
        validateDefs();
        inited = true;
        reanchor(); // 세이브의 날짜를 계산을 마친 시점으로
    }
    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object' && inited && E.hist.length) {
            // 기록 숫자는 소수 셋째 자리까지 (세이브가 너무 커지지 않게)
            const c = JSON.parse(JSON.stringify({ ...E, _pendingEv: undefined, _cyc: undefined }, (k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1000) / 1000 : v)));
            c.ui = { ...E.ui, full: false, zoom: null };
            st.teaser69 = c;
        }
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        loadState(state && state.teaser69);
        document.body.classList.remove('t69-full');
        try { if (typeof currentMainTab !== 'undefined' && currentMainTab === 'economy') renderTab(curSub()); } catch (e) { /* 없음 */ } // eslint-disable-line no-undef
        renderDisp();
        return r;
    };

    window.T69 = {
        get state() { return E; }, ensureInit, runTurns, nextTurn, step, forecast, sensitivity, predictVotes, submitBudget, checkBudgetBill, fillPredicted,
        newEconomy: id => { newEconomy(id); inited = true; refreshAll(); }, usePackage, ratingOf: () => ratingOf(E), statusOf, signals: () => signals(E), budget: () => budgetOf(E, E.nat, distList()),
        setValue, showDisp, toggleFull, refresh: refreshAll,
    };

    // ================= 모양 =================
    const style = document.createElement('style');
    style.textContent = `
        .t69-content { --t69-line: #333; --t69-soft: rgba(255,255,255,.03); --t69-dim2: #888; --t69-text: #ddd; --t69-acc: var(--tno-neon); --t69-acc-ink: #000;
            --good: #0ca30c; --warning: #fab219; --serious: #ec835a; --critical: #d03b3b; --pos: #3987e5; --neg: #e66767; }
        html[data-theme-family="modern"] .t69-content { --t69-line: var(--m-border); --t69-soft: var(--m-surface-2); --t69-dim2: var(--m-text-3); --t69-text: var(--m-text); --t69-acc: var(--m-accent); --t69-acc-ink: var(--m-on-accent, #fff); }
        .t69-intro { color: var(--t69-dim2); font-size: .78rem; line-height: 1.6; margin: 6px 0 10px; }
        .t69-dim { color: var(--t69-dim2); } .t69-small { font-size: .72rem; line-height: 1.5; margin-top: 4px; }
        .t69-card { border: 1px solid var(--t69-line); background: var(--t69-soft); padding: 10px; margin-bottom: 10px; }
        html[data-theme-family="modern"] .t69-card { border-radius: 12px; }
        .t69-card-h { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; color: var(--t69-text); font-size: .88rem; margin-bottom: 8px; }
        .t69-card-h b { margin-left: auto; font-variant-numeric: tabular-nums; }
        .t69-btn { cursor: pointer; font-family: inherit; font-size: .82rem; padding: 7px 11px; background: transparent; border: 1px solid var(--t69-line); color: var(--t69-text); }
        html[data-theme-family="modern"] .t69-btn { border-radius: 8px; }
        .t69-btn:hover:not(:disabled) { border-color: var(--t69-acc); color: var(--t69-acc); }
        .t69-btn.t69-primary { border-color: var(--t69-acc); color: var(--t69-acc); }
        html[data-theme-family="modern"] .t69-btn.t69-primary { background: var(--t69-acc); color: var(--t69-acc-ink); }
        .t69-btn:disabled { opacity: .4; cursor: default; }
        .t69-btn.t69-sm { font-size: .72rem; padding: 3px 8px; }
        .t69-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }
        .t69-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: .8rem; color: var(--t69-text); margin: 6px 0; }
        .t69-check { display: flex; align-items: flex-start; gap: 6px; font-size: .8rem; color: var(--t69-text); margin: 6px 0; line-height: 1.45; cursor: pointer; }
        .t69-check input { margin-top: 3px; }
        .t69-num { width: 72px; } .t69-segs { width: 150px; }
        .t69-content input[type="range"] { width: 100%; }
        .t69-top { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 10px; align-items: center; margin-bottom: 10px; }
        .t69-rating { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 64px; padding: 6px 8px; border: 2px solid currentColor; color: var(--good); }
        html[data-theme-family="modern"] .t69-rating { border-radius: 12px; }
        .t69-rating b { font-size: 1.35rem; letter-spacing: 1px; line-height: 1.1; } .t69-rating span { font-size: .62rem; opacity: .9; white-space: nowrap; }
        .t69-rating em { font-style: normal; font-size: .62rem; opacity: .75; margin-top: 2px; }
        .t69-grade-b { color: var(--warning); } .t69-grade-c { color: var(--critical); }
        .t69-turn-now { font-size: 1rem; color: var(--t69-text); font-weight: 600; }
        .t69-turninfo .t69-dim { font-size: .74rem; } #contentEcoOverview .t69-turninfo select { font-size: .74rem; width: auto; min-width: 0; padding: 2px 6px; height: auto; display: inline-block; }
        .t69-next { white-space: nowrap; font-size: .9rem; padding: 10px 12px; }
        .t69-sys { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 6px 8px; align-items: center; font-size: .78rem; color: var(--t69-dim2); }
        .t69-sys b { grid-column: 1 / -1; text-align: center; color: var(--t69-text); font-weight: 600; font-size: .82rem; }
        .t69-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 10px 0; }
        .t69-kpi { display: grid; grid-template-columns: minmax(0,1fr) auto; grid-template-rows: auto auto; gap: 0 6px; text-align: left; cursor: pointer; font-family: inherit; padding: 8px 9px; border: 1px solid var(--t69-line); background: var(--t69-soft); color: var(--t69-text); }
        html[data-theme-family="modern"] .t69-kpi { border-radius: 10px; }
        .t69-kpi:hover { border-color: var(--t69-acc); }
        .t69-kpi-l { font-size: .7rem; color: var(--t69-dim2); grid-column: 1 / -1; }
        .t69-kpi b { font-size: 1.05rem; font-variant-numeric: tabular-nums; } .t69-kpi-d { font-size: .68rem; color: var(--t69-dim2); align-self: center; }
        .t69-kpi .t69-st { grid-column: 1 / -1; }
        .t69-st { font-size: .66rem; display: inline-flex; align-items: center; gap: 3px; color: var(--t69-dim2); font-style: normal; } .t69-st em { font-style: normal; }
        .t69-st-good { color: var(--good); } .t69-st-warning { color: var(--warning); } .t69-st-serious { color: var(--serious); } .t69-st-critical { color: var(--critical); }
        .t69-st em { color: var(--t69-dim2); }
        .t69-signals, .t69-sigrow { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; font-size: .76rem; }
        .t69-signal { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border: 1px solid var(--t69-line, var(--t69-grid)); color: var(--t69-text, var(--t69-ink)); }
        html[data-theme-family="modern"] .t69-signal { border-radius: 999px; }
        .t69-alert { border: 1px solid var(--critical); background: color-mix(in srgb, var(--critical) 10%, transparent); color: var(--t69-text); padding: 8px 10px; margin: 8px 0; font-size: .8rem; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; line-height: 1.5; }
        html[data-theme-family="modern"] .t69-alert { border-radius: 10px; }
        .t69-alert > div { flex-basis: 100%; }
        .t69-fc { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .78rem; color: var(--t69-dim2); } .t69-fc b { color: var(--t69-text); font-variant-numeric: tabular-nums; }
        .t69-settings summary, .t69-content details > summary { cursor: pointer; color: var(--t69-text); font-size: .85rem; }
        .t69-lock { font-size: .72rem; color: var(--warning); margin-top: 4px; }
        .t69-bands { display: flex; justify-content: space-between; gap: 4px; font-size: .62rem; color: var(--t69-dim2); flex-wrap: wrap; }
        .t69-pkgs { display: grid; gap: 6px; }
        .t69-mhead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .t69-mcards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; margin-bottom: 6px; }
        .t69-mcard { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--t69-line); border-left: 4px solid var(--good); padding: 8px 10px; background: var(--t69-soft); }
        .t69-mcard-warning { border-left-color: var(--warning); } .t69-mcard-serious { border-left-color: var(--serious); } .t69-mcard-critical { border-left-color: var(--critical); }
        .t69-mcard span { font-size: .75rem; color: var(--t69-dim2); } .t69-mcard b { font-size: 1.4rem; color: var(--t69-text); } .t69-mcard small { font-size: .72rem; color: var(--t69-dim2); } .t69-mcard em { font-style: normal; font-size: .72rem; }
        html[data-theme-family="modern"] .t69-mcard { border-radius: 0 10px 10px 0; }
        .t69-levers { display: flex; flex-direction: column; gap: 4px; }
        .t69-lever { display: grid; grid-template-columns: minmax(0, 1.4fr) 1fr 4.5em; gap: 8px; align-items: center; font-size: .8rem; color: var(--t69-text); }
        .t69-lever > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .t69-lever > em { font-style: normal; text-align: right; }
        .t69-lever-bar { position: relative; height: 10px; background: var(--t69-soft); border-left: 1px solid transparent; }
        .t69-lever-bar::after { content: ''; position: absolute; left: 50%; top: -2px; bottom: -2px; width: 1px; background: var(--t69-line); }
        .t69-lever-bar b { position: absolute; top: 0; bottom: 0; } .t69-lever-bar b.pos { background: var(--pos); } .t69-lever-bar b.neg { background: var(--neg); }
        .t69-pkg em.up { color: var(--pos); font-style: normal; } .t69-pkg em.down { color: var(--neg); font-style: normal; }
        .t69-pkg { display: flex; flex-direction: column; gap: 2px; text-align: left; cursor: pointer; font-family: inherit; padding: 8px 10px; border: 1px solid var(--t69-line); background: transparent; color: var(--t69-text); }
        html[data-theme-family="modern"] .t69-pkg { border-radius: 10px; }
        .t69-pkg:hover:not(:disabled) { border-color: var(--t69-acc); } .t69-pkg:disabled { opacity: .4; cursor: default; }
        .t69-pkg span { font-size: .72rem; color: var(--t69-dim2); }
        .t69-slider { margin: 8px 0; } .t69-slider-h { display: flex; justify-content: space-between; gap: 6px; font-size: .78rem; color: var(--t69-text); }
        .t69-slider-h b { font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; } .t69-slider-h em { font-style: normal; font-size: .7rem; }
        .t69-kv { display: flex; justify-content: space-between; gap: 8px; font-size: .8rem; color: var(--t69-text); padding: 3px 0; } .t69-kv b { font-weight: 500; font-variant-numeric: tabular-nums; }
        .t69-deficit { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; color: var(--t69-text); }
        .t69-deficit b { font-size: 1.5rem; } .t69-deficit.neg b { color: var(--critical); } .t69-deficit.pos b { color: var(--good); }
        .t69-pred summary { margin-top: 8px; }
        .t69-mini { width: 100%; border-collapse: collapse; font-size: .74rem; margin-top: 6px; font-variant-numeric: tabular-nums; }
        .t69-mini th, .t69-mini td { padding: 4px 5px; border-bottom: 1px solid var(--t69-line); text-align: left; color: var(--t69-text); white-space: nowrap; }
        .t69-mini th { color: var(--t69-dim2); font-weight: 500; }
        .t69-pdot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
        .t69-v-yea { color: var(--good); } .t69-v-nay { color: var(--critical); } .t69-v-abs { color: var(--t69-dim2); }
        .t69-preview { font-size: .76rem; }
        .t69-pv-h { color: var(--t69-text); margin-bottom: 6px; }
        .t69-pv-r { display: grid; grid-template-columns: 4.5em minmax(0,1fr) auto; gap: 8px; align-items: center; margin: 4px 0; color: var(--t69-dim2); }
        .t69-pv-r b { color: var(--t69-text); font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .t69-pv-bars { display: flex; flex-direction: column; gap: 2px; }
        .t69-pv-bars i, .t69-pv-legend i { display: block; height: 5px; background: var(--t69-dim2); border-radius: 3px; min-width: 2px; }
        .t69-pv-bars i.nx, .t69-pv-legend i.nx { background: var(--pos); } .t69-pv-bars i.neg { background: var(--neg); opacity: .7; } .t69-pv-bars i.nx.neg { opacity: 1; }
        .t69-preview-big { margin: 10px 0; padding: 12px 14px; }
        .t69-preview-big .t69-pv-h { font-size: 1.05rem; margin-bottom: 10px; }
        .t69-preview-big .t69-pv-r { grid-template-columns: 6em minmax(0,1fr) auto; margin: 8px 0; font-size: .95rem; }
        .t69-preview-big .t69-pv-r b { font-size: 1.05rem; }
        .t69-preview-big .t69-pv-bars { gap: 3px; } .t69-preview-big .t69-pv-bars i { height: 9px; border-radius: 5px; }
        .t69-preview-big .t69-pv-legend { font-size: .78rem; } .t69-preview-big .t69-pv-legend i { height: 7px; }
        .t69-pv-legend { display: flex; align-items: center; gap: 6px; color: var(--t69-dim2); font-size: .68rem; margin-top: 6px; } .t69-pv-legend i { width: 14px; display: inline-block; }
        .t69-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; margin-bottom: 10px; }
        .t69-preset { display: flex; flex-direction: column; gap: 3px; text-align: left; cursor: pointer; font-family: inherit; padding: 8px 10px; border: 1px solid var(--t69-line); background: var(--t69-soft); color: var(--t69-text); }
        html[data-theme-family="modern"] .t69-preset { border-radius: 10px; }
        .t69-preset span { font-size: .68rem; color: var(--t69-dim2); line-height: 1.4; }
        .t69-preset.on { border-color: var(--t69-acc); box-shadow: inset 0 0 0 1px var(--t69-acc); }
        .t69-seg { display: inline-flex; border: 1px solid var(--t69-line, var(--t69-axis)); }
        html[data-theme-family="modern"] .t69-seg { border-radius: 8px; overflow: hidden; }
        .t69-seg button { cursor: pointer; font-family: inherit; font-size: .74rem; padding: 4px 10px; background: transparent; border: none; color: var(--t69-dim2, var(--t69-muted)); }
        .t69-seg button.on { background: var(--t69-acc, var(--s1)); color: var(--t69-acc-ink, #fff); }
        .t69-dlist { display: flex; flex-direction: column; gap: 4px; }
        .t69-dist { border: 1px solid var(--t69-line); padding: 6px 8px; }
        html[data-theme-family="modern"] .t69-dist { border-radius: 8px; }
        .t69-dist summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 10px; font-size: .78rem; color: var(--t69-dim2); }
        .t69-dname { color: var(--t69-text); font-weight: 600; }
        .t69-dgrid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 8px; }
        .t69-dgrid label { display: flex; flex-direction: column; gap: 2px; font-size: .7rem; color: var(--t69-dim2); }
        .t69-dgrid input, .t69-dgrid select { width: 100%; box-sizing: border-box; min-width: 0; }
        .t69-rule { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: .78rem; color: var(--t69-text); padding: 6px 0; border-bottom: 1px solid var(--t69-line); }
        .t69-x { cursor: pointer; background: transparent; border: none; color: var(--t69-dim2); font-size: 1rem; margin-left: auto; }
        .t69-x:hover { color: var(--critical); }
        .t69-def { padding: 6px 0; border-bottom: 1px solid var(--t69-line); } .t69-def-h { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; font-size: .8rem; color: var(--t69-text); }
        .t69-def-h span { font-size: .7rem; } .t69-def.builtin b::after { content: ' 기본'; font-size: .62rem; color: var(--t69-dim2); font-weight: normal; }
        .t69-newdef { margin-top: 8px; } .t69-newdef .t69-btn { margin-top: 8px; }
        .t69-def-acts { margin-left: auto; display: inline-flex; gap: 2px; } .t69-def-acts .t69-x { margin-left: 0; }
        .t69-edited { font-size: .62rem; border: 1px solid var(--t69-line); padding: 0 4px; }
        .t69-defedit { margin: 6px 0 4px; padding: 8px; border: 1px dashed var(--t69-line); }
        .t69-defedit .t69-dgrid { margin-top: 0; } .t69-defedit-btns { margin-top: 8px; gap: 6px; }
        .t69-effs { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; font-size: .72rem; }
        .t69-effrow { display: flex; gap: 6px; align-items: center; } .t69-effrow select { flex: 1; min-width: 0; } .t69-effrow input { width: 80px; } .t69-effrow .t69-x { margin-left: 0; }
        .t69-effs > .t69-btn { align-self: flex-start; }
        .t69-hidden-defs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; font-size: .72rem; }
        .t69-tablewrap2 { overflow-x: auto; } .t69-tagin { width: 48px; }
        /* 오른쪽 시각 화면 */
        #dispPanelEconomy .t69-dispbox { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        #t69Disp { flex: 1 1 auto; min-height: 0; overflow: auto; padding-right: 4px; }
        .t69-toolbar { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; padding: 4px 0 8px; border-bottom: 1px solid var(--t69-grid); }
        .t69-toolbar .t69-btn { color: var(--t69-ink2); border-color: var(--t69-axis); }
        .t69-toolbar .t69-seg button.on { background: var(--s1); color: #fff; }
        .t69-grow { flex: 1; }
        #t69Disp { --t69-line: var(--t69-grid); --t69-text: var(--t69-ink); --t69-dim2: var(--t69-muted); }
        .t69-toprow { display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch; margin-bottom: 8px; }
        .t69-rating-row { flex-direction: row; gap: 10px; justify-content: flex-start; border-radius: 12px; padding: 6px 14px; }
        .t69-rating-row b { font-size: 1.8rem; } .t69-rating-row > div { display: flex; flex-direction: column; }
        .t69-rating-row span { font-size: .8rem; } .t69-rating-row em { font-size: .7rem; color: var(--t69-muted); opacity: 1; }
        .t69-warnsigns { flex: 1 1 260px; min-width: 0; border: 1px solid var(--t69-grid); border-radius: 12px; padding: 6px 10px; }
        .t69-warn-h { font-size: .72rem; color: var(--t69-muted); margin-bottom: 4px; }
        .t69-warn-list { display: flex; flex-wrap: wrap; gap: 4px 6px; }
        .t69-warn { font-size: .74rem; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--t69-grid); color: var(--t69-muted); opacity: .6; }
        .t69-warn.on { opacity: 1; color: var(--t69-ink); font-weight: 600; }
        .t69-warn-warning { border-color: var(--warning); } .t69-warn-serious { border-color: var(--serious); } .t69-warn-critical { border-color: var(--critical); background: color-mix(in srgb, var(--critical) 14%, transparent); }
        .t69-evtypes { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; margin-bottom: 8px; }
        .t69-evtype { text-align: left; border: 1px solid var(--t69-line); border-radius: 10px; padding: 6px 8px; background: transparent; color: inherit; cursor: pointer; font: inherit; }
        .t69-evtype b { display: block; font-size: .82rem; } .t69-evtype span { display: block; font-size: .68rem; color: var(--t69-dim2); margin-top: 2px; }
        .t69-evtype.on { border-color: var(--t69-acc); box-shadow: inset 0 0 0 1px var(--t69-acc); }
        .t69-evcustom { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2px 12px; margin-bottom: 6px; }
        .t69-evwhen { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin: 4px 0 8px; }
        .t69-evf { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .t69-evf select { width: auto; }
        .t69-content input.t69-yr { width: 76px; } .t69-content input.t69-mo { width: 54px; }
        .t69-evrow { display: grid; grid-template-columns: 64px minmax(110px, auto) 1fr auto; align-items: center; gap: 4px 10px; padding: 6px 0; border-top: 1px solid var(--t69-line); }
        .t69-evrow .t69-evfx { grid-column: 2 / 4; }
        .t69-evedit { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; } .t69-evedit select { width: auto; }
        .t69-evst { font-size: .7rem; text-align: center; border-radius: 999px; padding: 1px 6px; border: 1px solid var(--t69-line); color: var(--t69-dim2); }
        .t69-ev-on .t69-evst { border-color: var(--t69-acc); color: var(--t69-text); font-weight: 600; }
        .t69-ev-done, .t69-ev-missed { opacity: .6; }
        .t69-fin { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px; margin: 2px 0 10px; }
        .t69-fin-i { border: 1px solid var(--t69-grid); border-radius: 10px; padding: 6px 10px; min-width: 0; }
        .t69-fin-i span { display: block; font-size: .72rem; color: var(--t69-muted); }
        .t69-fin-i b { display: block; font-size: 1rem; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .t69-fin-i small { display: block; font-size: .7rem; color: var(--t69-muted); }
        .t69-fin-i small em { font-style: normal; margin-left: 4px; color: var(--t69-ink2); }
        .t69-fin-serious { border-color: var(--serious); } .t69-fin-critical { border-color: var(--critical); background: color-mix(in srgb, var(--critical) 12%, transparent); }
        .t69-gauges { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; align-items: start; margin-bottom: 6px; }
        @media (max-width: 760px) { .t69-gauges { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .t69-sec { margin-top: 14px; }
        .t69-sec > h4 { margin: 0 0 6px; font-size: .9rem; color: var(--t69-ink); font-weight: 600; }
        .t69-sec > h4 .t69-dim { font-weight: normal; font-size: .74rem; }
        .t69-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .t69-chip { cursor: pointer; font-family: inherit; font-size: .74rem; padding: 3px 10px; border: 1px solid var(--t69-axis); background: transparent; color: var(--t69-muted); border-radius: 999px; display: inline-flex; align-items: center; gap: 5px; }
        .t69-chip i { width: 12px; height: 2px; display: inline-block; opacity: .4; }
        .t69-chip.on { color: var(--t69-ink); border-color: var(--t69-ink2); } .t69-chip.on i { opacity: 1; }
        .t69-map { width: 100%; height: 360px; } .t69-map svg { max-height: 360px; }
        /* 크게 보기 */
        body.t69-full #sideNav, body.t69-full > .controls { display: none !important; }
        body.t69-full .display-area { flex: 1 1 100%; max-width: 100%; }
        @media (max-width: 760px) { .t69-dgrid { grid-template-columns: repeat(2, minmax(0,1fr)); } .t69-top { grid-template-columns: auto minmax(0,1fr); } .t69-next { grid-column: 1 / -1; } }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(() => { try { if (typeof currentMainTab !== 'undefined' && currentMainTab === 'economy') renderTab(curSub()); } catch (e) { /* 없음 */ } }, 0)); // eslint-disable-line no-undef
})();
