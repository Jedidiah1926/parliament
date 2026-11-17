// ===== 1.6.9 — 보이지 않는 손 "Invisible hand" — 경제 시스템 =====
// 1.6.9 미리보기(예전 teaser69)에서 본 게임으로 옮겨 왔다.
// main.html은 js/vassals.js 다음에 그래프(js/economycharts.js)와 이 파일을 읽는다. 세이브 칸은 economy (1.6.9 미리보기 세이브는 teaser69 칸)
//
// 샌드박스 원칙 — 경제는 결과를 강제하지 않고 계산 · 표시 · 제안한다. 모든 수치는 직접 고칠 수 있고, 계산은 날짜가 넘어갈 때만 돈다.
//   - 메뉴 › 경제: 개요 · 분석 · 통화 · 재정 · 지역 · 시나리오 · 이벤트 · 항목, 오른쪽 시각 탭 "경제"(개요: 반원 계기 + 큰 그래프 / 분석: 전문가 그래프)
//   - 턴: 기본 1분기(1개월 · 1년도) — 게임 날짜를 따라간다. 날짜가 분기 경계를 지나면(▶ · 날짜 칸 직접 수정 모두) 지난 만큼 계산,
//     날짜를 되돌리면 경제는 그대로 두고 지금 날짜부터 이어서 센다. 날짜를 안 쓰는 세이브만 턴 번호로
//   - 금액은 비율(GDP 대비 %)로 계산하고 화면에만 화폐 단위로 보여 준다
//   - 예산 · 세율 바꾸기는 기본으로 예산안(법안)을 거친다 (설정에서 끄면 바로 반영), 통화정책은 중앙은행 몫이라 바로
//   - 경제 성과가 지지율 · 지역구 성향을 조금씩 움직인다 (설정)
// 계산식은 아래 턴 계산의 단계 순서(1. … 6. 자산 …)를 따른다 (계수는 연 단위, 턴 길이만큼 나눠 씀)
/* global parties, coalitions, elecStore, districtGrid, districtPopulation, districtNames, districtSvgTendency, districtSortedKeys,
   bills, getBillOverallStatus, renderBillList, syncBillSelect, selectBillForVote, applyPartyVote, ideologies,
   showCustomAlert, showCustomConfirm, escapeHtmlText, switchSubTab, switchMainTab, switchDispTab, renderDistrictSvgInto,
   currentSubTab, advanceNationDate, chamberList, chamberDisplayName, formatNationDate, findIdeology, HemiEconCharts */
(function () {
    'use strict';
    const root = document.documentElement;
    const C = window.HemiEconCharts;
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
    // 태그 · 묶음 · 규모 단위 · 기본 화폐 이름은 세이브에 그대로 남는 데이터(한국어)라 바꾸지 않고, 화면에 보일 때만 그 언어로 (키 번역 0.2.4)
    const TAG_KEY = { '안보': 'security', '복지': 'welfare', '과학': 'science', '교육': 'education', '산업': 'industry', '농업': 'agriculture', '환경': 'environment', '국가위신': 'prestige' };
    const GROUP_KEY = { '국방': 'defense', '민간': 'civil', '복지': 'welfare' };
    const SCALE_KEY = { '만': 'man', '억': 'eok', '조': 'jo' };
    const CURRENCY_KEY = { '달러': 'dollar', '마르크': 'mark' };
    const tagLabel = t => (TAG_KEY[t] ? i18n('econ.tag.' + TAG_KEY[t]) : String(t));
    const groupLabel = g => (GROUP_KEY[g] ? i18n('econ.group.' + GROUP_KEY[g]) : String(g));
    const scaleLabel = s => (SCALE_KEY[s] ? i18n('econ.scale.' + SCALE_KEY[s]) : String(s || ''));
    const TAGS = ['안보', '복지', '과학', '교육', '산업', '농업', '환경', '국가위신'];
    // 지출 항목: s0 기준 지출(GDP 대비 %) · max 상한 · jobs 기준보다 1%p 더 쓸 때 실업률 변화(%p, 음수 = 줄어듦) · mood 민심 · eff 수확체감 · asset 쌓는 자산
    const BUILTIN_ITEMS = [
        { id: 'army', name: i18n('econ.def.1'), group: '국방', tags: ['안보'], s0: 1.4, max: 8, jobs: -0.25, mood: 0, eff: 0.6, asset: 'military', ind: [0, 1.2, 0.2] },
        { id: 'navy', name: i18n('econ.def.2'), group: '국방', tags: ['안보', '국가위신'], s0: 1.0, max: 8, jobs: -0.2, mood: 0, eff: 0.6, asset: 'military', ind: [0, 1.4, 0.1] },
        { id: 'science', name: i18n('econ.def.3'), group: '민간', tags: ['과학', '산업'], s0: 1.0, max: 6, jobs: -0.1, mood: 0.2, eff: 0.6, asset: 'tech' },
        { id: 'education', name: i18n('econ.def.4'), group: '민간', tags: ['교육'], s0: 4.5, max: 10, jobs: -0.15, mood: 0.6, eff: 0.6, asset: 'human' },
        { id: 'infra', name: i18n('econ.def.5'), group: '민간', tags: ['산업'], s0: 2.5, max: 10, jobs: -0.4, mood: 0.3, eff: 0.6, asset: 'infra', ind: [0.2, 1.0, 0.4] },
        { id: 'admin', name: i18n('econ.def.6'), group: '민간', tags: [], s0: 3.0, max: 8, jobs: -0.1, mood: 0, eff: 0.6, asset: null },
        { id: 'police', name: i18n('econ.def.7'), group: '민간', tags: ['안보'], s0: 1.2, max: 5, jobs: -0.05, mood: 0.3, eff: 0.6, asset: 'order' },
        { id: 'agri', name: i18n('econ.def.8'), group: '민간', tags: ['농업'], s0: 0.5, max: 4, jobs: -0.1, mood: 0.4, eff: 0.6, asset: null, ind: [1.5, 0.1, 0] },
        { id: 'welfare', name: i18n('econ.def.9'), group: '복지', tags: ['복지'], s0: 7.0, max: 20, jobs: -0.05, mood: 1.2, eff: 0.6, asset: null, welfare: true },
        { id: 'health', name: i18n('econ.def.10'), group: '복지', tags: ['복지'], s0: 5.0, max: 14, jobs: -0.1, mood: 0.8, eff: 0.6, asset: 'health', welfare: true },
        { id: 'royal', name: i18n('econ.def.11'), group: '민간', tags: ['국가위신'], s0: 0.1, max: 2, jobs: 0, mood: 0, eff: 0.6, asset: null, cond: 'monarchy' },
    ];
    // 자산: decay 해마다 줄어드는 비율 · effects 기준(50)보다 1점 높을 때의 효과
    const BUILTIN_ASSETS = [
        { id: 'tech', name: i18n('econ.def.12'), decay: 0.04, effects: { growth: 0.03 } },
        { id: 'human', name: i18n('econ.def.13'), decay: 0.05, effects: { growth: 0.02, unemp: -0.03 } },
        { id: 'infra', name: i18n('econ.def.5'), decay: 0.06, effects: { growth: 0.02 } },
        { id: 'military', name: i18n('econ.def.14'), decay: 0.10, effects: {} },
        { id: 'health', name: i18n('econ.def.15'), decay: 0.07, effects: { mood: 0.05 } },
        { id: 'order', name: i18n('econ.def.16'), decay: 0.08, effects: { mood: 0.03, conf: 0.03 } },
    ];
    // 세목: rate0 기본 세율 · base 과세 기반(GDP 대비 비율) · L 세수가 0이 되는 세율(래퍼 곡선) · weight 지역 부담 · side 기본 세율보다 1%p 높을 때 부작용
    const BUILTIN_TAXES = [
        { id: 'income', name: i18n('econ.def.17'), rate0: 25, base: 0.5, L: 100, max: 90, weight: 'income', side: { growth: -0.03, moodHigh: -0.4 } },
        { id: 'corp', name: i18n('econ.def.18'), rate0: 25, base: 0.14, L: 100, max: 90, weight: 'industry', side: { growth: -0.05 } },
        { id: 'vat', name: i18n('econ.def.19'), rate0: 15, base: 0.5, L: 80, max: 60, weight: 'flat', side: { growth: -0.03, infl: 0.05, moodLow: -0.5 } },
        { id: 'social', name: i18n('econ.def.20'), rate0: 15, base: 0.5, L: 90, max: 60, weight: 'flat', side: { growth: -0.02, moodLow: -0.2 } },
        { id: 'tariff', name: i18n('econ.def.21'), rate0: 4, base: 0.05, L: 120, max: 100, weight: 'imports', side: { infl: 0.03, growth: -0.01 } },
        { id: 'property', name: i18n('econ.def.22'), rate0: 1.5, base: 2.5, L: 20, max: 10, weight: 'wealth', side: { moodHigh: -1.5 } },
    ];
    // 효과를 줄 수 있는 대상 (화이트리스트 — 이 밖의 대상은 무시하고 경고). 자산 id는 자동으로 더해진다
    // 인플레이션 안전 범위는 성장률에 따라 넓어진다 — 빨리 크는 경제는 물가가 더 올라도 버틴다 (예: 고도성장기 한국, 성장 10% · 물가 10%+).
    // 기준은 이번 칸 성장률이 아니라 최근 약 3년의 성장 흐름(nat.gTrend) — 한 분기 반짝 성장으로 범위가 출렁이지 않게.
    // 성장 흐름 2%를 넘는 1%p마다 안전 상한 +1.25%p (최대 +12%p — 성장 흐름 11.6%), 마이너스 · 저성장은 기본 범위
    function inflSafeExtra(growth) { return 1.25 * Math.max(0, Math.min(9.6, (Number(growth) || 0) - 2)); }
    const growthTrend = N => (Number.isFinite(N.gTrend) ? N.gTrend : N.growth);
    let keepDisp = false; // 다음 경제 탭 전환 한 번은 오른쪽 시각 화면을 바꾸지 않음 (개요 계기 클릭)
    const EFFECT_TARGETS = { growth: i18n('econ.def.23'), unemp: i18n('econ.def.24'), infl: i18n('econ.def.25'), mood: i18n('econ.def.26'), conf: i18n('econ.def.27') };
    const DT = { month: 1 / 12, quarter: 1 / 4, year: 1 };
    const UNIT_NAME = { month: i18n('econ.def.28'), quarter: i18n('econ.def.29'), year: i18n('econ.def.30') };
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
        const monarchy = !!(window.HemiRoyal && window.HemiRoyal.monarchy);
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
            if (d.asset && !ids.has(d.asset)) { warnings.push(i18n('econ.state.1', { name: d.name, asset: d.asset })); d.asset = null; }
        });
        E.defs.taxes.forEach(t => {
            if (has(t, 'rate0')) t.rate0 = num(t.rate0, 5, 0, 100);
            if (has(t, 'base')) t.base = num(t.base, 0.1, 0, 5);
            if (has(t, 'L')) t.L = num(t.L, 100, 5, 300);
            if (has(t, 'max')) t.max = num(t.max, 50, 1, 100);
            if (has(t, 'weight') && !['income', 'industry', 'flat', 'wealth', 'imports', 'manufacturing'].includes(t.weight)) t.weight = 'flat';
            if (!has(t, 'side')) return;
            const side = t.side || {}; t.side = {};
            Object.keys(side).forEach(k => { if (['growth', 'infl', 'moodLow', 'moodHigh', 'conf'].includes(k)) t.side[k] = num(side[k], 0, -3, 3); else warnings.push(i18n('econ.state.2', { name: t.name, v: k })); });
        });
        E.defs.assets.forEach(a => {
            if (has(a, 'decay')) a.decay = num(a.decay, 0.05, 0, 0.5);
            if (!has(a, 'effects')) return;
            const eff = a.effects || {}; a.effects = {};
            Object.keys(eff).forEach(k => { if (EFFECT_TARGETS[k] || ids.has(k)) a.effects[k] = num(eff[k], 0, -1, 1); else warnings.push(i18n('econ.state.3', { name: a.name, v: k })); });
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
        if (cyc.size) warnings.push(i18n('econ.state.4', { name: [...cyc].map(id => assets.find(a => a.id === id)?.name || id).join(' → ') }));
        E._cyc = [...cyc];
    }

    // ================= 지역구 =================
    const excludedKey = k => (typeof window.isDistrictUnrecovered === 'function' && window.isDistrictUnrecovered(k))
        || (typeof window.isDistrictVassalLand === 'function' ? window.isDistrictVassalLand(k) : (typeof window.isDistrictVassal === 'function' && window.isDistrictVassal(k)));
    function activeKeys() {
        let keys = [];
        try { keys = Object.keys(districtGrid.house || {}).filter(k => districtGrid.house[k] && !excludedKey(k)); } catch (e) { keys = []; }
        return keys;
    }
    const popOf = k => { const v = districtPopulation?.house?.[k]; return Number.isFinite(v) && v > 0 ? v : null; };
    const nameOf = k => (k === '__nation' ? i18n('econ.region.1') : (districtNames?.house?.[k] || k));
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
                addEvent('unify', i18n.ref('econ.region.3', { nameOf: fresh2.map(nameOf).slice(0, 3).join(' · '), fresh2: fresh2.length > 3 ? (" " + i18n('econ.region.2')) : '', cost }));
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
            name: i18n('econ.preset.1'), desc: i18n('econ.preset.2'), apply(S2) {
                Object.assign(S2.nat, { gdp: 16700, growth: 1.6, infl: 3.3, inflE: 3, unemp: 9.1, rate: 4, print: 1.2, cur: 100, conf: 84, debt: 39, mood: 48 });
                Object.assign(S2.settings, { currency: '마르크', scale: '억' });
                S2.sys = 0.7; S2.spend.army = 2.0; S2.spend.navy = 1.3;
                Object.keys(WG_LAND).forEach(k => { S2.dist[k] = { ...defaultDist(k), ...deep(WG_LAND[k]), age: [0.19, 0.66, 0.15], mood: 50, gdp: 0 }; });
            },
        },
        stable: { name: i18n('econ.preset.3'), desc: i18n('econ.preset.4'), apply(S2) { Object.assign(S2.nat, { infl: 2, inflE: 2, unemp: 4, debt: 50, conf: 75 }); } },
        postwar: {
            name: i18n('econ.preset.5'), desc: i18n('econ.preset.6'), apply(S2) {
                Object.assign(S2.nat, { infl: 40, debt: 180, conf: 20, unemp: 14, mood: 35 });
                S2.rules = { 'nat.infl': { mode: 'locked', value: 40, period: 4 } };
            },
        },
        bailout: {
            name: i18n('econ.preset.7'), desc: i18n('econ.preset.8'), apply(S2) {
                Object.assign(S2.nat, { rate: 15, debt: 120, conf: 30 });
                S2.rules = { 'nat.rate': { mode: 'locked', value: 15, period: 8 }, 'taxes.income': { mode: 'transition', from: 20, to: 35, period: 4 } };
            },
        },
        war: {
            name: i18n('econ.preset.9'), desc: i18n('econ.preset.10'), apply(S2) {
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
        if (path === 'nat.rate' && E.settings.indep) return i18n('econ.rule.1');
        const rule = E.rules[path];
        if (!rule || typeof rule !== 'object' || rule.mode === 'fixed') return null;
        const left = ruleLeft(rule, ruleK(E) + 1);
        return left > 0 ? i18n('econ.rule.2', { left: spanLabel(left) }) : null;
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
    // 한 번 훑으며 모두 더한다 (예전엔 합마다 배열을 새로 만들어 10번 훑었다 — 더하는 순서는 같아 값도 같다)
    function nationalFromDist(S2, keys) {
        let L = 0, P = 0, gdp = 0, un = 0, mood = 0, old = 0, manuf = 0, agri = 0, income = 0;
        for (const k of keys) {
            const d = S2.dist[k]; if (!d) continue;
            const lab = labor(d);
            L += lab; P += d.pop; gdp += d.gdp; un += d.unemp * lab; mood += d.mood * d.pop;
            old += (d.age?.[2] ?? 0.17) * d.pop; manuf += d.ind[1] * d.gdp; agri += d.ind[0] * d.gdp; income += d.income * d.pop;
        }
        L = L || 1; P = P || 1;
        return { gdp, unemp: un / L, mood: mood / P, old: old / P, manuf: manuf / (gdp || 1), agri: agri / (gdp || 1), income: income / P };
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
        if (window.HemiVassals && (window.HemiVassals.vassals || []).length) {
            const vp = sum(Object.keys(window.HemiVassals.vassalOf || {}).map(k => popOf(k) || 0));
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
    //      기간 동안 (연율, 그 기간에 걸친 만큼): g(성장 %/년) · i(인플레이션 %p) · u(실업 %p, 자연실업률) · cs(신뢰도가 돌아갈 곳)
    const EVENT_TYPES = {
        depression: { name: i18n('econ.event.1'), icon: '📉', dur: 36, fx: { g: -9, i: -4, u: 5, conf: -25, cs: -15 } },
        financial: { name: i18n('econ.event.2'), icon: '🏦', dur: 18, fx: { g: -5, i: -1, u: 2, conf: -20, cs: -10, cur: -10 } },
        oil: { name: i18n('econ.event.3'), icon: '🛢️', dur: 12, fx: { g: -2.5, i: 7, u: 0.5, conf: -5 } },
        hyper: { name: i18n('econ.event.4'), icon: '💸', dur: 12, fx: { i: 150, conf: -25, cs: -15, cur: -40 } },
        default: { name: i18n('econ.event.5'), icon: '⚠️', dur: 12, fx: { g: -6, i: 12, u: 2, conf: -35, cs: -20, cur: -35, debtCut: 30 } },
        collapse: { name: i18n('econ.event.6'), icon: '💥', dur: 24, fx: { g: -15, i: 30, u: 8, conf: -40, cs: -25, cur: -30 } },
        disaster: { name: i18n('econ.event.7'), icon: '🌋', dur: 6, fx: { lvl: -4, g: -2, i: 3, u: 1, conf: -8 } },
        boom: { name: i18n('econ.event.8'), icon: '🚀', dur: 24, fx: { g: 4, i: 1.5, u: -1.5, conf: 10, cs: 8 } },
        custom: { name: i18n('econ.event.9'), icon: '✏️', dur: 12, fx: {} },
    };
    const EV_POWERS = [[0.5, i18n('econ.event.10')], [1, i18n('econ.event.11')], [1.5, i18n('econ.event.12')], [2, i18n('econ.event.13')]];
    const evFx = e => (e.type === 'custom' ? e.fx || {} : (EVENT_TYPES[e.type] || EVENT_TYPES.custom).fx);
    const evName = e => (e.type === 'custom' && e.name ? e.name : (EVENT_TYPES[e.type] || EVENT_TYPES.custom).name);
    const evBad = e => { const f = evFx(e); return (f.g || 0) + (f.lvl || 0) < 0 || (f.conf || 0) < 0; };
    function fxText(fx, pw = 1) {
        const sg = v => (v > 0 ? '+' : '') + r2(v * pw);
        return [fx.g && i18n('econ.event.14', { fx: sg(fx.g) }), fx.lvl && i18n('econ.event.15', { lvl: sg(fx.lvl) }), fx.i && i18n('econ.event.16', { fx: sg(fx.i) }), fx.u && i18n('econ.event.17', { u: sg(fx.u) }), fx.conf && i18n('econ.event.18', { conf: sg(fx.conf) }), fx.cur && i18n('econ.event.19', { cur: sg(fx.cur) }), fx.debtCut && i18n('econ.event.20', { pw: r2(fx.debtCut * pw) })].filter(Boolean).join(' · ') || i18n('econ.event.21');
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
        // 성장 흐름 — 최근 약 3년 성장률의 지수 평균 (인플레이션 안전 범위 · 변동성의 기준)
        N.gTrend = Number.isFinite(N.gTrend) ? N.gTrend + (N.growth - N.gTrend) * (1 - Math.exp(-dt / 3)) : N.growth;
        const N2 = nationalFromDist(S2, keys);
        N.unemp = N2.unemp; N.gdp = after;
        // 3. 인플레이션 — 기대(신뢰도가 높으면 목표 2%에 고정) + 과열 + 과잉 통화 + 수입물가
        const w = clamp(N.conf / 100 + (S2.settings.indep ? 0.15 : 0), 0, 1);
        // 신뢰가 무너지면 지난 인플레이션를 따라가되, 통화 증가가 멈추면 기대도 꺾인다 (하이퍼인플레이션가 끝날 수 있게)
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
        // 인플레이션 변동 — 고성장 · 과열일수록 물가가 크게 출렁인다 (저성장 안정기에는 거의 없음). 흔들림 없는 예측(r 없음)에는 안 들어감
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
        const safeX = inflSafeExtra(growthTrend(N)); // 인플레이션 안전 범위의 성장 흐름 가산
        const Cstar = 77 - 0.25 * Math.max(0, N.debt - 60) - 1.2 * Math.max(0, N.infl - 4 - safeX) - 1.5 * Math.max(0, -balance - 3) + 0.12 * (N.mood - 50) - 0.6 * Math.max(0, m - 10) + (S2.settings.indep ? 5 : 0) + assetEffect(S2, 'conf') - (shutdown ? 10 : 0) + ev.cs;
        N.conf = clamp(N.conf + (Cstar - N.conf) * (1 - Math.exp(-1.4 * dt)), 0, 100);
        N.yield = Math.max(0, rate + Math.max(0, (65 - N.conf) / 6) + Math.max(0, (N.debt - 90) / 20) + premAdj);
        // 8. 지역구 민심 · 소득등급
        const welfareGap = sum(itemDefs().filter(d => d.welfare).map(d => (spend[d.id] ?? d.s0) - d.s0));
        const moodItems = sum(itemDefs().filter(d => !d.welfare).map(d => ((spend[d.id] ?? d.s0) - d.s0) * (d.mood || 0)));
        const moodWelfare = sum(itemDefs().filter(d => d.welfare).map(d => ((spend[d.id] ?? d.s0) - d.s0) * (d.mood || 0)));
        const assetMood = assetEffect(S2, 'mood');
        const taxList = taxDefs(); // 지역구마다 새로 만들지 않게 (지역구가 수백 개)
        keys.forEach(kk => {
            const d = S2.dist[kk];
            const gA = dlnBy[kk] / dt;
            const incW = 1 + 0.25 * (3 - d.income);
            let tax = 0;
            taxList.forEach(t => {
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
    const GRADES = [[85, 'AAA', i18n('econ.rating.1')], [75, 'AA', i18n('econ.rating.2')], [65, 'A', i18n('econ.rating.3')], [55, 'BBB', i18n('econ.rating.4')], [45, 'BB', i18n('econ.rating.5')], [35, 'B', i18n('econ.rating.5')], [20, 'CCC', i18n('econ.rating.6')], [-1, 'D', i18n('econ.rating.7')]];
    function ratingOf(S2) {
        const s = S2.nat.conf - Math.max(0, S2.nat.debt - 100) * 0.15;
        return (GRADES.find(g => s >= g[0]) || GRADES[GRADES.length - 1]).slice(1);
    }
    function bandsOf(key) {
        const t = E.thresholds;
        switch (key) {
            case 'infl': {
                // 안전(good) 상한 5% · 경고 상한 15%가 성장률에 따라 늘어난다 (inflSafeExtra) — 하이퍼인플레이션 기준은 그대로
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
        add('negative', i18n('econ.rating.8'), N.growth < -1 ? 'serious' : 'warning', N.growth < 0);
        add('deficit', i18n('econ.rating.9'), N.balance < -9 ? 'serious' : 'warning', N.balance < -6);
        add('reserves', i18n('econ.rating.10'), 'warning', N.reserves > 15);
        add('financial', i18n('econ.event.2'), 'critical', N.conf < 30 && N.yield - N.rate > 4);
        add('printing', i18n('econ.rating.11'), N.print >= S2.thresholds.collapse ? 'critical' : 'serious', N.print > 10);
        if (S2.ceiling != null) add('ceiling', i18n('econ.rating.12'), N.debt >= S2.ceiling ? 'critical' : 'warning', N.debt > S2.ceiling - 5);
        // 위기 단계 — 위기 기준(설정)을 넘으면 '위기', 가까워지면 '위험'
        const t = S2.thresholds;
        const dflt = N.debt > t.default || (N.conf < t.flight && N.yield - N.rate > 8);
        add('default', i18n('econ.rating.13'), dflt ? 'critical' : 'serious', dflt || N.debt > t.default * 0.85);
        add('hyper', i18n('econ.event.4'), N.infl > t.hyper ? 'critical' : 'serious', N.infl > t.hyper * 0.5);
        add('depression', i18n('econ.event.1'), N.unemp > t.depression ? 'critical' : 'serious', N.unemp > t.depression * 0.7);
        add('flight', i18n('econ.rating.14'), N.conf < t.flight ? 'critical' : 'serious', N.conf < t.flight + 10);
        // 경제 붕괴 — 성장률 -10% 아래로 추락하거나 위기가 두 개 이상 겹칠 때
        const crises = out.filter(s => s.on && s.status === 'critical' && s.id !== 'ceiling').length;
        add('collapse', i18n('econ.event.6'), 'critical', N.growth < -10 || crises >= 2);
        return out;
    }
    const PRINT_BANDS = [[-99, i18n('econ.rating.15')], [0, i18n('econ.rating.16')], [0.5, i18n('econ.event.11')], [3, i18n('econ.rating.17')], [10, i18n('econ.rating.18')], [30, i18n('econ.rating.11')]];
    const printBand = p => PRINT_BANDS.filter(b => p >= b[0]).pop()[1];

    // ================= 기록 =================
    function turnLabel(S2, t) {
        const base = S2.dateBase;
        if (base) {
            const keyNow = base.key + t;
            if (S2.unit === 'year') return `${keyNow}`;
            if (S2.unit === 'quarter') return i18n('econ.log.1', { keyNow: Math.floor(keyNow / 4), keyNow2: keyNow % 4 + 1 });
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
    // label: 글자 또는 i18n.ref(키, 변수) — 키로 남긴 기록은 보여 줄 때 그때 언어로 (evText), label에는 한국어 글을 함께 둔다 (예전 앱 · 검색용)
    function addEvent(kind, label) {
        const ref = label && typeof label === 'object' ? label : null;
        const ev = { t: E.turn, kind, label: ref ? (window.DnoLang && DnoLang.source ? DnoLang.source(ref.key, ref.vars) : ref.key) : label };
        if (ref) { ev.key = ref.key; if (ref.vars) ev.vars = ref.vars; }
        E.events.push(ev);
        if (E.events.length > 300) E.events.splice(0, E.events.length - 300);
        if (E._pendingEv) E._pendingEv.push(ev);
        return ev;
    }

    const BUDGET_PASSED_KEY = 'econ.budget.passed'; // 예산안 가결 기록 (그래프 깃발은 가결만)
    const evText = e => (e && e.key && typeof window.i18n === 'function' ? i18n(e.key, e.vars) : String((e && e.label) || ''));
    // ================= 턴 진행 =================
    function crisisCheck(prev) {
        const N = E.nat, t = E.thresholds, out = [];
        const cross = (now, before, label, kind) => { if (now && !before) out.push(addEvent(kind, label)); };
        cross(N.infl > t.hyper, prev.infl > t.hyper, i18n.ref('econ.turn.1', { infl: pct(N.infl) }), 'crisis');
        cross(N.debt > t.default, prev.debt > t.default, i18n.ref('econ.turn.2', { debt: pct(N.debt, 0) }), 'crisis');
        cross(N.unemp > t.depression, prev.unemp > t.depression, i18n.ref('econ.turn.3', { unemp: pct(N.unemp) }), 'crisis');
        if (N.conf < t.flight && !(prev.conf < t.flight)) { N.cur *= 0.85; out.push(addEvent('crisis', i18n.ref('econ.turn.4', { conf: N.conf.toFixed(0) }))); }
        cross(N.print > t.collapse, prev.print > t.collapse, i18n.ref('econ.turn.5', { print: pct(N.print) }), 'crisis');
        cross(N.mood < t.revolt, prev.mood < t.revolt, i18n.ref('econ.turn.6', { mood: N.mood.toFixed(0) }), 'revolt');
        const rt = ratingOf(E);
        if (E.rating && rt[0] !== E.rating[0]) out.push(addEvent('rating', i18n.ref('econ.turn.7', { rating: E.rating[0], rt: rt[0], rt2: rt[1] })));
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
                if (e.ended === E.turn && e.fired !== E.turn && !e.toldEnd) { e.toldEnd = true; addEvent('policy', i18n.ref('econ.turn.8', { evName: evName(e) })); }
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
            const rows = window.HemiHistory && window.HemiHistory.ranking && window.HemiHistory.ranking.rows;
            const self = rows && rows.find(r => r.self);
            if (self && E.settings.rankFollow) {
                if (!E.rankBase) E.rankBase = { score: Number(self.score) || 50, gdp: E.hist[0]?.n.gdp || E.nat.gdp };
                self.score = Math.round(clamp(E.rankBase.score * Math.sqrt(E.nat.gdp / E.rankBase.gdp), 1, 100));
            }
            // 위기 · 신용등급 변화는 세력 변화(1.6.5) 기록에도
            if (window.HemiHistory && typeof window.HemiHistory.record === 'function') evs.filter(e => e.kind === 'crisis' || e.kind === 'unify').forEach(e => window.HemiHistory.record(i18n('econ.turn.9', { label: evText(e) })));
        } catch (e) { /* 1.6.5 없음 */ }
        refreshAll();
        const big = evs.filter(e => e.kind === 'crisis' || e.kind === 'revolt' || e.kind === 'unify' || e.kind === 'shutdown');
        if (big.length) {
            showCustomAlert((i18n('econ.turn.10') + "\n\n") + big.map(e => '• ' + evText(e)).join('\n') + (big.some(e => e.kind === 'revolt') ? ("\n\n" + i18n('econ.turn.11')) : ''));
            if (E.settings.autoEvents && big.some(e => e.kind === 'revolt')) goRevolt();
        } else if (evs.length && typeof window.showKbdToast === 'function') window.showKbdToast(evs.map(evText).join(' · '));
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
            if (typeof window.showKbdToast === 'function') window.showKbdToast(i18n('econ.date.1'));
            return;
        }
        // 너무 길면 앞부분은 건너뛰고 (기준만 옮김) 지금 날짜까지 RUN_MAX만큼만 계산
        const run = () => { const n = Math.min(gap, RUN_MAX); E.dateBase.key += gap - n; runTurns(n); };
        if (gap <= AUTO_MAX[E.unit]) { run(); return; }
        asking = true;
        showCustomConfirm(i18n('econ.date.3', { gap: spanLabel(gap), RUN_MAX: gap > RUN_MAX ? ("\n" + i18n('econ.date.2', { RUN_MAX: spanLabel(RUN_MAX) })) : '' }),
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
    // 기간 글자 — 영어 등은 복수형(1 year · 2 years)이 맞게 count 변수로 (lang/en.js의 복수형 키)
    function spanLabel(n) {
        n = Math.round(n);
        if (E.unit === 'year') return i18n('econ.span.years', { count: n });
        const per = E.unit === 'quarter' ? 4 : 12, part = c => i18n(E.unit === 'quarter' ? 'econ.span.quarters' : 'econ.span.months', { count: c });
        if (n % per === 0) return i18n('econ.span.years', { count: n / per });
        return n > per ? i18n('econ.span.yearsAnd', { years: i18n('econ.span.years', { count: Math.floor(n / per) }), rest: part(n % per) }) : part(n);
    }
    // 단위 한 칸의 이름 ("다음 분기" · "next quarter")
    const UNIT_WORD = { month: i18n('econ.unit.month'), quarter: i18n('econ.unit.quarter'), year: i18n('econ.unit.year') };

    // ================= 예측 · 민감도 =================
    // 예측은 아직 안 일어난 이벤트를 모른다 (진행 중인 것만 이어감)
    // 계산용 복사본 — 글자로 한 번 바꿔 두고(simBase) 여러 번 되살린다 (예측은 같은 상태를 32~48번 복사한다)
    const simBase = () => JSON.stringify({ ...E, hist: [], events: [], ui: null, sched: (E.sched || []).filter(e => e.fired != null && e.ended == null) });
    const simFrom = base => { const c = JSON.parse(base); c._cyc = E._cyc; return c; };
    const simClone = () => simFrom(simBase());
    function withDraft(S2) { if (E.draft) { S2.spend = { ...E.draft.spend }; S2.taxes = { ...E.draft.taxes }; } return S2; }
    const VAR = {
        growth: { label: i18n('econ.forecast.1'), unit: '%', get: s => s.nat.growth, color: 'var(--s1)' },
        infl: { label: i18n('econ.def.25'), unit: '%', get: s => s.nat.infl, color: 'var(--s2)' },
        unemp: { label: i18n('econ.forecast.2'), unit: '%', get: s => s.nat.unemp, color: 'var(--s3)' },
        rate: { label: i18n('econ.forecast.3'), unit: '%', get: s => s.nat.rate, color: 'var(--s4)' },
        yield: { label: i18n('econ.forecast.4'), unit: '%', get: s => s.nat.yield, color: 'var(--s7)' },
        debt: { label: i18n('econ.forecast.5'), unit: '%', get: s => s.nat.debt, color: 'var(--s8)' },
        balance: { label: i18n('econ.forecast.6'), unit: '%', get: s => s.nat.balance, color: 'var(--s6)' },
        mood: { label: i18n('econ.def.26'), unit: '', get: s => s.nat.mood, color: 'var(--s5)' },
        conf: { label: i18n('econ.def.27'), unit: '', get: s => s.nat.conf, color: 'var(--s6)' },
        cur: { label: i18n('econ.forecast.7'), unit: '', get: s => s.nat.cur, color: 'var(--s7)' },
    };
    // 예측 부채꼴 — 지금 정책을 유지할 때 H턴 앞까지, 흔들림을 바꿔 여러 번 돌린 분위수
    // 같은 상태 · 같은 질문이면 지난 결과를 그대로 (탭을 오갈 때마다 수십 번 시뮬레이션을 다시 돌리지 않게). 결과는 읽기만 한다
    const forecastMemo = new Map();
    function forecast(vars, H = 8, runs = 48, useDraft = false) {
        const keys = distList(), base = simBase();
        const memoKey = [base, vars.join(','), H, runs, useDraft ? JSON.stringify(E.draft || null) : '', keys.join(','), JSON.stringify(E._cyc || null), !!(window.HemiRoyal && window.HemiRoyal.monarchy)].join('\u0001');
        const memo = forecastMemo.get(memoKey);
        if (memo) { forecastMemo.delete(memoKey); forecastMemo.set(memoKey, memo); return memo; }
        const out = Object.fromEntries(vars.map(v => [v, Array.from({ length: H }, () => [])]));
        for (let r = 0; r < runs; r++) {
            const S2 = simFrom(base); if (useDraft) withDraft(S2);
            const rr = rng(1000 + r * 7919);
            for (let h = 0; h < H; h++) { step(S2, rr, { keys }); S2.turn++; applyRules(S2, ruleK(S2)); vars.forEach(v => out[v][h].push(VAR[v].get(S2))); }
        }
        const q = (a, p) => { const s = a.slice().sort((x, y) => x - y); const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
        const res = {};
        vars.forEach(v => { res[v] = { mean: out[v].map(a => q(a, 0.5)), lo50: out[v].map(a => q(a, 0.25)), hi50: out[v].map(a => q(a, 0.75)), lo90: out[v].map(a => q(a, 0.05)), hi90: out[v].map(a => q(a, 0.95)) }; });
        forecastMemo.set(memoKey, res);
        if (forecastMemo.size > 12) forecastMemo.delete(forecastMemo.keys().next().value);
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
        tryLever(i18n('econ.forecast.8'), s => { s.nat.rate += 1; s.settings.indep = false; });
        tryLever(i18n('econ.forecast.9'), s => { s.nat.print += 1; });
        itemDefs().forEach(d => tryLever(`${d.name} +0.5%p`, s => { s.spend[d.id] = (s.spend[d.id] ?? d.s0) + 0.5; }, i18n('econ.forecast.10')));
        taxDefs().forEach(t => tryLever(`${t.name} +2%p`, s => { s.taxes[t.id] = (s.taxes[t.id] ?? t.rate0) + 2; }, i18n('econ.forecast.11')));
        tryLever(i18n('econ.forecast.12'), s => { s.temps.push({ type: 'qe', left: 4 }); });
        tryLever(i18n('econ.forecast.13'), s => { s.nat.cur *= 0.88; s.nat.conf -= 5; });
        return rows.filter(r => Math.abs(r.value) > 1e-4);
    }

    // ================= 예산안 · 세법 (의회 연동) =================
    const regimeBypass = () => !!(window.HemiCoup && window.HemiCoup.junta) || !!(window.HemiRevolution && window.HemiRevolution.partyState);
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
        (E.draft.temps || []).forEach(tp => out.push({ kind: 'temp', id: tp.type, label: TEMP_NAME[tp.type], from: 0, to: tp.left }));
        return out;
    }
    const TEMP_NAME = { qe: i18n('econ.forecast.12'), qt: i18n('econ.budget.1'), taxcut: i18n('econ.budget.2'), taxhike: i18n('econ.budget.3') };
    function yearLabel() { const d = readDate(); return d ? i18n('econ.budget.4', { y: d.y }) : i18n('econ.budget.5', { turn: E.turn }); }
    function submitBudget() {
        if (budgetPending()) { showCustomAlert(i18n('econ.budget.6')); return; }
        const ch = draftChanges();
        if (!ch.length) { showCustomAlert(i18n('econ.budget.7')); return; }
        const taxChanged = ch.some(c => c.kind === 'tax' || c.kind === 'temp' && /^tax/.test(c.id)); // 한시적 감세 · 증세
        const lines = ch.map((c, i) => i18n('econ.budget.10', { v: i + 1, label: c.label, GDP: c.kind === 'temp' ? i18n('econ.budget.8', { to: spanLabel(c.to) }) : `${r2(c.from)}% → ${r2(c.to)}%${c.kind === 'spend' ? (" " + i18n('econ.budget.9')) : ''}` }));
        const bill = {
            id: 'b' + Date.now(), title: i18n('econ.budget.12', { yearLabel: yearLabel(), budgetNo: E.budgetNo + 1, taxChanged: taxChanged ? (" " + i18n('econ.budget.11')) : '' }), content: lines.join('\n'),
            threshold: 0.5, numer: null, denom: null, tags: [i18n('econ.budget.13')].concat(taxChanged ? [i18n('econ.budget.14')] : []),
            houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
            version: 1, parentBillId: null, isAmendment: false, voteHistory: [], econBudget: true,
        };
        try { bills.push(bill); renderBillList(); if (typeof syncBillSelect === 'function') syncBillSelect(); } catch (e) { showCustomAlert(i18n('econ.budget.15')); return; }
        E.budgetBill = { id: bill.id, status: 'pending', draft: deep(E.draft), title: bill.title };
        addEvent('budget', i18n.ref('econ.budget.16', { title: bill.title }));
        refreshAll();
        showCustomAlert(i18n('econ.budget.17', { title: bill.title, unit: UNIT_WORD[E.unit] }));
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
            addEvent('budget', i18n.ref('econ.budget.passed', { title: bb.title }));
            try { if (window.HemiHistory && typeof window.HemiHistory.record === 'function') window.HemiHistory.record(i18n('econ.budget.19', { title: bb.title })); } catch (e) { /* 없음 */ }
            refreshAll();
        } else if (st === 'failed' || st === 'vetoed') {
            bb.status = 'failed';
            addEvent('budget', i18n.ref('econ.budget.22', { title: bb.title, vetoed: st === 'vetoed' ? i18n('econ.budget.20') : i18n('econ.budget.21') }));
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
        if (!bb || bb.status !== 'pending') { showCustomAlert(i18n('econ.budget.23')); return; }
        const preds = predictVotes(bb.draft);
        try {
            switchSubTab('law', 'vote');
            if (typeof selectBillForVote === 'function') selectBillForVote(bb.id);
            preds.forEach(x => applyPartyVote(x.p.name, x.vote));
            showCustomAlert(i18n('econ.budget.24'));
        } catch (e) { showCustomAlert(i18n('econ.budget.25')); }
    }

    // ================= 화면 — 메뉴 › 경제 =================
    // 예전 버그로 화폐 단위가 숫자(NaN)로 저장된 세이브는 빈 칸으로
    const CUR = () => (typeof E.settings.currency === 'string' ? E.settings.currency : '');
    // 화면에 보일 화폐 이름 · 규모 — 기본값(달러 · 마르크, 만 · 억 · 조)은 그 언어로, 직접 적은 화폐 이름은 그대로
    const curText = () => { const c = CUR(); return CURRENCY_KEY[c] ? i18n('econ.currency.' + CURRENCY_KEY[c]) : c; };
    const unitText = () => i18n('econ.unit', { scale: scaleLabel(E.settings.scale), cur: curText() }).trim(); // 한국어 "억마르크" · 영어 "×100M marks"
    // 금액 글자 — 한국어는 "16,700억 마르크"처럼 규모 단위로, 그 밖의 언어는 실제 금액을 줄여서("1.67T marks")
    const SCALE_FACTOR = { '': 1, '만': 1e4, '억': 1e8, '조': 1e12 };
    function amountText(v) {
        const lang = (window.DnoLang && DnoLang.lang) || 'kr';
        if (lang === 'kr') return `${Math.round(v).toLocaleString()}${scaleLabel(E.settings.scale)}`;
        const n = v * (SCALE_FACTOR[E.settings.scale || ''] || 1);
        try { return new Intl.NumberFormat({ jp: 'ja' }[lang] || lang, { notation: 'compact', maximumFractionDigits: 2 }).format(n); }
        catch (e) { return Math.round(n).toLocaleString(); }
    }
    const money = pctGdp => `${amountText(pctGdp * E.nat.gdp / 100)} ${curText()}`.trim();
    const gdpText = () => `${amountText(E.nat.gdp)} ${curText()}`.trim();
    const STATUS_WORD = { good: i18n('econ.ui.1'), warning: i18n('econ.ui.2'), serious: i18n('econ.ui.3'), critical: i18n('econ.ui.4') };
    const stDot = st => `<span class="econ-st econ-st-${st}" title="${STATUS_WORD[st]}">${C.STATUS[st].icon}<em>${STATUS_WORD[st]}</em></span>`;
    (function addEconomyMenu() {
        let btn = document.getElementById('mainTabEconomy');
        const nationBtn = document.getElementById('mainTabNation'), nationContent = document.getElementById('mainContentNation');
        if (!nationBtn || !nationContent) return;
        if (!btn) { btn = el(`<button class="main-tab-btn" id="mainTabEconomy"></button>`); nationBtn.parentElement.insertBefore(btn, nationBtn.nextSibling); }
        btn.setAttribute('onclick', "switchMainTab('economy')");
        btn.removeAttribute('title');
        btn.textContent = i18n('econ.ui.5');
        const host = el(`<div id="mainContentEconomy" class="main-tab-content"><div class="sub-tab-container"></div></div>`);
        const world = document.getElementById('mainContentWorld');
        nationContent.parentElement.insertBefore(host, world || nationContent.nextSibling);
        const bar = host.querySelector('.sub-tab-container');
        [['overview', 'EcoOverview', i18n('econ.ui.6')], ['analysis', 'EcoAnalysis', i18n('econ.ui.7')], ['monetary', 'EcoMonetary', i18n('econ.ui.8')], ['fiscal', 'EcoFiscal', i18n('econ.ui.9')], ['region', 'EcoRegion', i18n('econ.ui.10')], ['scenario', 'EcoScenario', i18n('econ.ui.11')], ['events', 'EcoEvents', i18n('econ.ui.12')], ['items', 'EcoItems', i18n('econ.ui.13')]].forEach(([sub, id, label], i) => {
            bar.appendChild(el(`<button class="sub-tab-btn${i ? '' : ' active'}" onclick="switchSubTab('economy','${sub}')" id="subTab${id.charAt(0).toUpperCase() + id.slice(1)}">${label}</button>`));
            host.appendChild(el(`<div id="content${id.charAt(0).toUpperCase() + id.slice(1)}" class="sub-tab-content econ-content${i ? '' : ' active'}"></div>`));
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
                // 글자 칸(화폐 단위 등)은 글자 그대로 — 숫자로 바꾸면 NaN이 되었다
                const v = inp.type === 'checkbox' ? inp.checked : (inp.tagName === 'SELECT' || inp.type === 'text') ? inp.value : Number(inp.value);
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
        document.querySelectorAll('.econ-preview').forEach(p => renderPreview(p));
    }
    function outText(path) {
        const [a, b] = path.split('.');
        if (a === 'spend') { const v = fiscalView().spend[b]; return `${r2(v)}% · ${money(v)}`; }
        if (a === 'taxes') return `${r2(fiscalView().taxes[b])}%`;
        if (path === 'nat.print') return i18n('econ.ui.14', { print: r2(E.nat.print), print2: printBand(E.nat.print) });
        if (path === 'nat.rate') return `${r2(E.nat.rate)}%`;
        if (path === 'sys') return sysText();
        return '';
    }
    const sysText = () => { const s = E.sys; return s < 0.25 ? i18n('econ.ui.15') : s < 0.45 ? i18n('econ.ui.16') : s < 0.6 ? i18n('econ.ui.17') : s < 0.8 ? i18n('econ.ui.18') : i18n('econ.ui.19'); };
    // 이대로면 다음 턴 — 지금 값과 흔들림 없는 다음 턴 예측
    function renderPreview(box) {
        const useDraft = box.dataset.draft === '1';
        const nx = project(null, 1, useDraft);
        const rows = [['growth', i18n('econ.forecast.1'), '%'], ['infl', i18n('econ.def.25'), '%'], ['unemp', i18n('econ.forecast.2'), '%'], ['balance', i18n('econ.forecast.6'), '%'], ['mood', i18n('econ.def.26'), '']];
        box.innerHTML = `<div class="econ-pv-h">${esc(i18n('econ.ui.20'))} ${UNIT_NAME[E.unit]}</div>` + rows.map(([k, l, u]) => {
            const a = VAR[k].get(E), b = VAR[k].get(nx), m = Math.max(Math.abs(a), Math.abs(b), k === 'mood' ? 100 : 1);
            const w = v => `${clamp(Math.abs(v) / m * 100, 1, 100).toFixed(0)}%`;
            return `<div class="econ-pv-r"><span>${l}</span><div class="econ-pv-bars"><i style="width:${w(a)}" class="${a < 0 ? 'neg' : ''}" title="${esc(i18n('econ.ui.21'))}"></i><i style="width:${w(b)}" class="nx ${b < 0 ? 'neg' : ''}" title="${esc(i18n('econ.ui.22'))}"></i></div><b>${a.toFixed(1)}${u} → ${b.toFixed(1)}${u}</b></div>`;
        }).join('') + `<div class="econ-pv-legend"><i></i>${esc(i18n('econ.ui.21'))} <i class="nx"></i>${esc(i18n('econ.ui.22'))} ${UNIT_WORD[E.unit]} ${esc(i18n('econ.ui.23'))}</div>`;
    }

    // ---- 개요 ----
    function renderOverview() {
        const box = contentOf('overview'); if (!box) return;
        const N = E.nat, rt = E.rating || ratingOf(E), last = E.hist[E.hist.length - 2];
        const kp = [['growth', i18n('econ.ui.24'), N.growth, '%', 'analysis'], ['infl', i18n('econ.def.25'), N.infl, '%', 'monetary'], ['unemp', i18n('econ.forecast.2'), N.unemp, '%', 'region'], ['debt', i18n('econ.ui.25'), N.debt, '%', 'fiscal'], ['mood', i18n('econ.def.26'), N.mood, '', 'region'], ['conf', i18n('econ.def.27'), N.conf, '', 'monetary']];
        const sig = signals(E).filter(s => s.on);
        const revolt = N.mood < E.thresholds.revolt;
        const nx = project(null, 1);
        box.innerHTML = `
            <div class="econ-intro">${esc(i18n('econ.ui.26'))} ${UNIT_WORD[E.unit]}${esc(i18n('econ.ui.27'))}</div>
            <div class="econ-top">
                <div class="econ-rating econ-grade-${rt[0].replace(/[^A-Z]/g, '').length > 2 ? 'top' : rt[0].startsWith('A') ? 'a' : rt[0].startsWith('B') ? 'b' : 'c'}" title="${esc(i18n('econ.ui.28'))}"><b>${rt[0]}</b><span>${rt[1]}</span></div>
                <div class="econ-turninfo"><div class="econ-turn-now">${esc(turnLabel(E, E.turn))}</div><div class="econ-dim">${readDate() ? i18n('econ.ui.31', { label: E.turn ? i18n('econ.ui.29', { label: esc(E.hist[0].label) }) : esc(i18n('econ.ui.30')) }) : esc(i18n('econ.ui.32', { turn: spanLabel(E.turn) }))} · GDP ${esc(gdpText())}</div>
                    <label class="econ-dim">${esc(i18n('econ.ui.33'))} <select data-act="unit">${Object.entries(UNIT_NAME).map(([k, v]) => `<option value="${k}" ${E.unit === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
                <button type="button" class="econ-btn econ-primary econ-next" data-act="next">${esc(i18n('econ.ui.34'))} ${UNIT_NAME[E.unit]}</button>
            </div>
            <div class="econ-sys"><span>${esc(i18n('econ.ui.35'))}</span><input type="range" min="0" max="1" step="0.05" value="${E.sys}" data-path="sys" aria-label="${esc(i18n('econ.ui.36'))}"><span>${esc(i18n('econ.ui.37'))}</span><b data-out="sys">${sysText()}</b></div>
            <div class="econ-dim econ-small">${esc(i18n('econ.ui.38'))}</div>
            ${revolt ? `<div class="econ-alert"><b>${C.STATUS.critical.icon} ${esc(i18n('econ.ui.39'))}${N.mood.toFixed(0)})</b> ${esc(i18n('econ.ui.40'))}
                ${document.getElementById('subTabCoup') ? `<button type="button" class="econ-btn" data-act="go-coup">${esc(i18n('econ.ui.41'))}</button>` : ''}${document.getElementById('subTabRevolution') ? `<button type="button" class="econ-btn" data-act="go-rev">${esc(i18n('econ.ui.42'))}</button>` : ''}</div>` : ''}
            <div class="econ-kpis">${kp.map(([k, l, v, u, go]) => {
                const st = statusOf(k, v), prev = last ? last.n[k] : null, dv = prev != null ? v - prev : null;
                return `<button type="button" class="econ-kpi" data-go="${go}"><span class="econ-kpi-l">${l}</span><b>${v.toFixed(1)}${u}</b><span class="econ-kpi-d">${dv == null ? '' : (dv > 0 ? '▲' : dv < 0 ? '▼' : '–') + Math.abs(dv).toFixed(1)}</span>${stDot(st)}</button>`;
            }).join('')}</div>
            <div class="econ-signals">${sig.length ? sig.map(s => `<span class="econ-signal">${stDot(s.status)} ${esc(s.label)}</span>`).join('') : `<span class="econ-dim">${esc(i18n('econ.ui.43'))}</span>`}</div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.22'))} ${UNIT_NAME[E.unit]} ${esc(i18n('econ.ui.44'))} <span class="econ-dim">${esc(i18n('econ.ui.45'))}</span></div>
                <div class="econ-fc">${[['growth', esc(i18n('econ.forecast.1'))], ['infl', esc(i18n('econ.def.25'))], ['unemp', esc(i18n('econ.forecast.2'))], ['debt', esc(i18n('econ.ui.46'))], ['mood', esc(i18n('econ.def.26'))]].map(([k, l]) => `<span>${l} <b>${VAR[k].get(E).toFixed(1)} → ${VAR[k].get(nx).toFixed(1)}</b></span>`).join('')}</div></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.47'))} <span class="econ-dim">${billsOn() ? esc(i18n('econ.ui.48')) : esc(i18n('econ.ui.49'))}</span></div>
                <div class="econ-dim">${budgetStatusText()}</div></div>
            <details class="econ-card econ-settings"><summary>${esc(i18n('econ.ui.50'))}</summary>
                <label class="econ-check"><input type="checkbox" data-path="settings.bills" ${E.settings.bills ? 'checked' : ''}> ${esc(i18n('econ.ui.51'))} ${regimeBypass() ? `<span class="econ-dim">${esc(i18n('econ.ui.52'))}</span>` : ''}</label>
                <label class="econ-check"><input type="checkbox" data-path="settings.opinion" ${E.settings.opinion ? 'checked' : ''}> ${esc(i18n('econ.ui.53'))}</label>
                <label class="econ-check"><input type="checkbox" data-path="settings.autoEvents" ${E.settings.autoEvents ? 'checked' : ''}> ${esc(i18n('econ.ui.54'))}</label>
                <label class="econ-check"><input type="checkbox" data-path="settings.rankFollow" ${E.settings.rankFollow ? 'checked' : ''}> ${esc(i18n('econ.ui.55'))}</label>
                <label class="econ-row">${UNIT_NAME[E.unit]}${esc(i18n('econ.ui.56'))} <input type="number" min="1" max="9" value="${E.settings.pkgLimit}" data-path="settings.pkgLimit" class="econ-num">${esc(i18n('econ.ui.57'))}</label>
                <label class="econ-row">${esc(i18n('econ.ui.58'))} <select data-path="settings.budgetView"><option value="hemi" ${E.settings.budgetView === 'hemi' ? 'selected' : ''}>${esc(i18n('econ.ui.59'))}</option><option value="bars" ${E.settings.budgetView === 'bars' ? 'selected' : ''}>${esc(i18n('econ.ui.60'))}</option></select></label>
            </details>
            <div class="econ-actions"><button type="button" class="econ-btn" data-act="disp">${esc(i18n('econ.ui.61'))}</button><button type="button" class="econ-btn" data-act="analysis">${esc(i18n('econ.ui.62'))}</button></div>`;
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
        if (bb && bb.status === 'pending') return i18n('econ.ui.63', { title: esc(bb.title) });
        if (bb && bb.status === 'failed') return i18n('econ.ui.64', { title: esc(bb.title) });
        if (E.draft && draftChanges().length) return i18n('econ.ui.65', { draftChanges: draftChanges().length });
        return i18n('econ.ui.66', { budgetNo: E.budgetNo, rev: pct(E.nat.rev), spend: pct(E.nat.spend) });
    }

    // ---- 분석 (왼쪽: 무엇을 볼지 고르기) ----
    const MODULES = {
        cycleP: i18n('econ.ui.67'), decompG: i18n('econ.ui.68'), inflP: i18n('econ.ui.69'), decompP: i18n('econ.ui.70'),
        traj: i18n('econ.ui.71'), debt: i18n('econ.ui.72'), rates: i18n('econ.ui.73'), sankey: i18n('econ.ui.74'),
        spendStack: i18n('econ.ui.75'), scatter: i18n('econ.ui.76'), map: i18n('econ.ui.77'), tornado: i18n('econ.ui.78'), fan: i18n('econ.ui.79'), assets: i18n('econ.ui.80'), table: i18n('econ.ui.81'),
    };
    const PRESET_MODS = {
        cycle: { name: i18n('econ.ui.82'), mods: ['cycleP', 'decompG'] }, infl: { name: i18n('econ.ui.83'), mods: ['inflP', 'decompP', 'traj'] },
        fiscal: { name: i18n('econ.ui.84'), mods: ['debt', 'rates', 'sankey', 'spendStack'] }, region: { name: i18n('econ.ui.85'), mods: ['scatter', 'map'] },
        policy: { name: i18n('econ.ui.86'), mods: ['tornado', 'fan'] }, assets: { name: i18n('econ.ui.87'), mods: ['assets'] }, table: { name: i18n('econ.ui.81'), mods: ['table'] },
    };
    const currentMods = () => (E.ui.preset === 'custom' ? (E.ui.layout || ['cycleP']) : (PRESET_MODS[E.ui.preset] || PRESET_MODS.cycle).mods);
    function renderAnalysis() {
        const box = contentOf('analysis'); if (!box) return;
        const mods = currentMods();
        box.innerHTML = `
            <div class="econ-intro">${esc(i18n('econ.ui.88'))}</div>
            <div class="econ-presets">${Object.entries(PRESET_MODS).map(([id, p]) => `<button type="button" class="econ-preset ${E.ui.preset === id ? 'on' : ''}" data-preset="${id}"><b>${p.name}</b><span>${p.mods.map(m => MODULES[m].split(' (')[0]).join(' · ')}</span></button>`).join('')}
                <button type="button" class="econ-preset ${E.ui.preset === 'custom' ? 'on' : ''}" data-preset="custom"><b>${esc(i18n('econ.ui.89'))}</b><span>${esc(i18n('econ.ui.90'))}</span></button></div>
            ${E.ui.preset === 'custom' ? `<div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.91'))}</div>${Object.entries(MODULES).map(([id, l]) => `<label class="econ-check"><input type="checkbox" data-mod="${id}" ${mods.includes(id) ? 'checked' : ''}> ${l}</label>`).join('')}</div>` : ''}
            <div class="econ-card">
                <div class="econ-row">${esc(i18n('econ.ui.92'))} <span class="econ-seg">${RANGES.map(([k, l]) => `<button type="button" data-range="${k}" class="${String(E.ui.range) === k ? 'on' : ''}">${l}</button>`).join('')}</span></div>
                <label class="econ-check"><input type="checkbox" data-path="ui.log" ${E.ui.log ? 'checked' : ''}> ${esc(i18n('econ.ui.93'))}</label>
                <label class="econ-row">${esc(i18n('econ.ui.94'))} <select data-path="ui.target">${Object.entries(VAR).map(([k, v]) => `<option value="${k}" ${E.ui.target === k ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
                <label class="econ-row">${esc(i18n('econ.ui.95'))} <select data-path="ui.horizon">${[1, 4, 8].map(n => [n, spanLabel(n)]).map(([k, l]) => `<option value="${k}" ${Number(E.ui.horizon) === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
            </div>
            <div class="econ-actions"><button type="button" class="econ-btn econ-primary" data-act="full">${esc(i18n('econ.ui.96'))}</button><button type="button" class="econ-btn" data-act="csv">${esc(i18n('econ.ui.97'))}</button></div>
            <div class="econ-dim econ-small">${esc(i18n('econ.ui.98'))}</div>`;
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
            <div class="econ-intro">${esc(i18n('econ.ui.99'))}</div>
            <div class="econ-card">
                <div class="econ-card-h">${esc(i18n('econ.forecast.3'))} <b data-out="nat.rate">${r2(N.rate)}%</b></div>
                <input type="range" min="0" max="40" step="0.25" value="${N.rate}" data-path="nat.rate" ${lr ? 'disabled' : ''} aria-label="${esc(i18n('econ.forecast.3'))}">
                ${lr ? `<div class="econ-lock">🔒 ${esc(lr)}</div>` : ''}
                <div class="econ-dim econ-small">${esc(i18n('econ.ui.100'))} ${(N.rate - N.inflE).toFixed(1)}${esc(i18n('econ.ui.101'))} ${N.inflE.toFixed(1)}${esc(i18n('econ.ui.102'))} ${N.yield.toFixed(1)}%</div>
                <label class="econ-check"><input type="checkbox" data-path="settings.indep" ${E.settings.indep ? 'checked' : ''}> ${esc(i18n('econ.ui.103'))}</label>
            </div>
            <div class="econ-card">
                <div class="econ-card-h">${esc(i18n('econ.ui.104'))} <b data-out="nat.print">${r2(N.print)}${esc(i18n('econ.ui.105'))} ${printBand(N.print)}</b></div>
                <input type="range" min="-5" max="50" step="0.5" value="${N.print}" data-path="nat.print" ${lp ? 'disabled' : ''} aria-label="${esc(i18n('econ.ui.104'))}" class="econ-print">
                <div class="econ-bands">${PRINT_BANDS.slice(1).map(b => `<span>${b[0]}~ ${b[1]}</span>`).join('')}</div>
                ${lp ? `<div class="econ-lock">🔒 ${esc(lp)}</div>` : ''}
                <div class="econ-dim econ-small">${esc(i18n('econ.ui.106'))} ${(N.print * 4).toFixed(0)}${esc(i18n('econ.ui.107'))}</div>
            </div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.108'))} <span class="econ-dim">${esc(i18n('econ.ui.109'))} ${UNIT_WORD[E.unit]} ${used}/${lim}</span></div>
                <div class="econ-pkgs">
                    <button type="button" class="econ-pkg" data-pkg="qe" ${used >= lim ? 'disabled' : ''}><b>${esc(i18n('econ.forecast.12'))}</b><span>${spanLabel(4)} ${esc(i18n('econ.ui.110'))}</span></button>
                    <button type="button" class="econ-pkg" data-pkg="qt" ${used >= lim ? 'disabled' : ''}><b>${esc(i18n('econ.budget.1'))}</b><span>${spanLabel(4)} ${esc(i18n('econ.ui.111'))}</span></button>
                    <button type="button" class="econ-pkg" data-pkg="devalue" ${used >= lim ? 'disabled' : ''}><b>${esc(i18n('econ.forecast.13'))}</b><span>${esc(i18n('econ.ui.112'))}</span></button>
                </div>
                ${(E.temps || []).length ? `<div class="econ-dim econ-small">${esc(i18n('econ.ui.113'))} ${E.temps.map(tp => esc(i18n('econ.ui.114', { type: TEMP_NAME[tp.type], left: spanLabel(tp.left) }))).join(' · ')}</div>` : ''}
            </div>
            <div class="econ-preview econ-card" data-draft="0"></div>`;
        bindInputs(box);
        box.querySelectorAll('[data-pkg]').forEach(b => { b.onclick = () => usePackage(b.dataset.pkg); });
        box.querySelectorAll('.econ-preview').forEach(renderPreview);
    }
    function usePackage(type) {
        if ((E.pkgUsed || 0) >= E.settings.pkgLimit) { showCustomAlert(i18n('econ.ui.115', { unit: UNIT_WORD[E.unit], pkgLimit: E.settings.pkgLimit })); return; }
        if (type === 'devalue') { E.nat.cur *= 0.88; E.nat.conf = Math.max(0, E.nat.conf - 5); addEvent('policy', i18n.ref('econ.ui.116')); }
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
        const V = fiscalView(), defs = itemDefs(), groupsSeen = [...new Set(defs.map(d => d.group || i18n('econ.ui.117')))];
        const b = budgetOf(E, E.nat, distList());
        const bv = budgetOf({ ...E, spend: V.spend, taxes: V.taxes, temps: E.temps }, E.nat, distList());
        const changes = draftChanges(), bb = E.budgetBill, pending = budgetPending();
        const preds = (E.draft && changes.length) || pending ? predictVotes(pending ? bb.draft : E.draft) : [];
        const yea = sum(preds.filter(x => x.vote === 'yea').map(x => x.p.seatsHouse || 0)), nay = sum(preds.filter(x => x.vote === 'nay').map(x => x.p.seatsHouse || 0));
        box.innerHTML = `
            <div class="econ-intro">${esc(i18n('econ.ui.118'))} ${billsOn() ? `${esc(i18n('econ.ui.119'))} <b>${esc(i18n('econ.ui.120'))}</b>${esc(i18n('econ.ui.121'))}` : esc(i18n('econ.ui.122'))}</div>
            <div class="econ-card econ-budgetbox">
                <div class="econ-deficit ${E.nat.balance < 0 ? 'neg' : 'pos'}"><span>${E.nat.balance < 0 ? esc(i18n('econ.ui.123')) : esc(i18n('econ.ui.124'))}</span><b>${pct(Math.abs(E.nat.balance))}</b><span class="econ-dim">${esc(i18n('econ.ui.125'))} ${money(Math.abs(E.nat.balance))}</span></div>
                <div class="econ-dim econ-small">${esc(i18n('econ.ui.126'))} ${pct(b.totalRev)} ${esc(i18n('econ.ui.127'))} ${pct(b.totalSpend)} ${esc(i18n('econ.ui.128'))} ${pct(sum(Object.values(b.mand)))})${E.draft && changes.length ? esc((" " + i18n('econ.ui.129', { totalSpend: sgn(bv.totalRev - bv.totalSpend) }))) : ''}</div>
                <div class="econ-dim econ-small">${budgetStatusText()}</div>
                ${billsOn() ? `<div class="econ-actions">
                    <button type="button" class="econ-btn econ-primary" data-act="submit" ${pending || !changes.length ? 'disabled' : ''}>${esc(i18n('econ.ui.130'))}${changes.length ? esc((" " + i18n('econ.ui.131', { changes: changes.length }))) : ''}</button>
                    ${E.draft ? `<button type="button" class="econ-btn" data-act="discard">${esc(i18n('econ.ui.132'))}</button>` : ''}
                    ${pending ? `<button type="button" class="econ-btn" data-act="fill">${esc(i18n('econ.ui.133'))}</button>` : ''}</div>` : ''}
                ${preds.length ? `<details class="econ-pred" open><summary>${esc(i18n('econ.ui.134'))} <span class="econ-dim">${esc(i18n('econ.ui.135'))} ${yea}${esc(i18n('econ.ui.136'))} ${nay}${esc(i18n('econ.ui.137'))}</span></summary>
                    <table class="econ-mini"><thead><tr><th>${esc(i18n('econ.ui.138'))}</th><th>${esc(i18n('econ.ui.139'))}</th><th>${esc(i18n('econ.ui.140'))}</th><th>${esc(i18n('econ.ui.141'))}</th></tr></thead><tbody>
                    ${preds.map(x => `<tr><td><i class="econ-pdot" style="background:${esc(x.p.color)}"></i>${esc(x.p.name)}</td><td class="econ-v-${x.vote}">${{ yea: esc(i18n('econ.ui.142')), nay: esc(i18n('econ.ui.143')), abs: esc(i18n('econ.ui.144')) }[x.vote]}</td><td title="${esc(i18n('econ.budget.voteTip', { gov: sgn(x.gov), tag: sgn(x.tag, 2), tax: sgn(x.tax, 2) }))}">${sgn(x.score, 2)}</td><td>${x.members ? esc(i18n('econ.ui.147', { defect: x.defect, members: x.members })) : '—'}</td></tr>`).join('')}
                    </tbody></table><div class="econ-dim econ-small">${esc(i18n('econ.ui.148'))}</div></details>` : ''}
            </div>
            ${groupsSeen.map(g => {
                const items = defs.filter(d => (d.group || i18n('econ.ui.117')) === g), gs = sum(items.map(d => V.spend[d.id] ?? d.s0));
                return `<div class="econ-card"><div class="econ-card-h">${esc(groupLabel(g))} <b>${pct(gs)}</b><span class="econ-dim">${money(gs)}</span>
                    <button type="button" class="econ-btn econ-sm" data-austerity="${esc(g)}" title="${esc(i18n('econ.ui.149'))}">${esc(i18n('econ.ui.150'))}</button></div>
                    ${items.map(d => { const lk = lockOf('spend.' + d.id); const v = V.spend[d.id] ?? d.s0; return `<div class="econ-slider">
                        <div class="econ-slider-h"><span>${esc(d.name)}${d.asset ? ` <em class="econ-dim">→ ${esc(assetDefs().find(a => a.id === d.asset)?.name || '')} ${(E.assets[d.asset] ?? 50).toFixed(0)}</em>` : ''}</span><b data-out="spend.${d.id}">${r2(v)}% · ${money(v)}</b></div>
                        <input type="range" min="0" max="${d.max}" step="0.05" value="${v}" data-path="spend.${d.id}" ${lk ? 'disabled' : ''} aria-label="${esc(d.name)}">
                        ${Math.abs(v - (E.spend[d.id] ?? d.s0)) > 1e-6 ? `<div class="econ-dim econ-small">${esc(i18n('econ.ui.151'))} ${r2(E.spend[d.id] ?? d.s0)}${esc(i18n('econ.ui.152'))} ${r2(v)}%</div>` : ''}${lk ? `<div class="econ-lock">🔒 ${esc(lk)}</div>` : ''}</div>`; }).join('')}</div>`;
            }).join('')}
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.153'))} <span class="econ-dim">${esc(i18n('econ.ui.154'))}</span></div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.155'))}</span><b>${pct(b.mand.interest)} · ${money(b.mand.interest)}</b></div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.156'))}</span><b>${pct(b.mand.pension)} · ${money(b.mand.pension)}</b></div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.157'))}</span><b>${pct(b.mand.unemp)} · ${money(b.mand.unemp)}</b></div></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.forecast.11'))} <span class="econ-dim">${esc(i18n('econ.ui.158'))}</span></div>
                ${taxDefs().map(t => { const lk = lockOf('taxes.' + t.id); const v = V.taxes[t.id] ?? t.rate0; return `<div class="econ-slider">
                    <div class="econ-slider-h"><span>${esc(t.name)} <em class="econ-dim">${esc(i18n('econ.ui.159'))} ${pct(taxRevenue(t, v))} · ${money(taxRevenue(t, v))}</em></span><b data-out="taxes.${t.id}">${r2(v)}%</b></div>
                    <input type="range" min="0" max="${t.max}" step="0.5" value="${v}" data-path="taxes.${t.id}" ${lk ? 'disabled' : ''} aria-label="${esc(t.name)}">${lk ? `<div class="econ-lock">🔒 ${esc(lk)}</div>` : ''}</div>`; }).join('')}
                <div class="econ-actions"><button type="button" class="econ-btn" data-pkg="taxcut">${esc(i18n('econ.ui.160'))}${spanLabel(4)})</button><button type="button" class="econ-btn" data-pkg="taxhike">${esc(i18n('econ.ui.161'))}${spanLabel(4)})</button></div>
                ${window.HemiVassals && (window.HemiVassals.vassals || []).length ? `<label class="econ-row">${esc(i18n('econ.ui.162'))} <input type="number" class="econ-num" min="0" max="50" step="1" value="${E.tribute}" data-path="root.tribute">% <span class="econ-dim">${esc(i18n('econ.ui.126'))} ${pct(b.rev._tribute || 0, 2)}</span></label>` : ''}
            </div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.163'))}</div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.164'))}</span><b>${money(E.nat.reserves)} ${esc(i18n('econ.ui.165'))} ${pct(E.nat.reserves)}</b></div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.166'))}</span><b>${money(E.nat.debt)} ${esc(i18n('econ.ui.165'))} ${pct(E.nat.debt)}</b></div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.167'))}</span><b>${E.nat.balance < 0 ? esc((i18n('econ.ui.168') + " ")) : esc((i18n('econ.ui.169') + " "))}${money(Math.abs(E.nat.balance))} ${esc(i18n('econ.ui.165'))} ${pct(Math.abs(E.nat.balance))}</b></div>
                <div class="econ-actions"><button type="button" class="econ-btn" data-act="repay" ${E.nat.reserves > 0 ? '' : 'disabled'}>${esc(i18n('econ.ui.170'))}</button><button type="button" class="econ-btn" data-act="invest" ${E.nat.reserves > 0 ? '' : 'disabled'}>${esc(i18n('econ.ui.171'))}</button>
                    <label class="econ-check"><input type="checkbox" data-path="root.autoRepay" ${E.autoRepay ? 'checked' : ''}> ${esc(i18n('econ.ui.172'))}</label></div>
                <div class="econ-kv"><span>${esc(i18n('econ.ui.166'))}</span><b>${pct(E.nat.debt)} · ${money(E.nat.debt)}</b></div>
                <label class="econ-row">${esc(i18n('econ.ui.173'))} <input type="number" class="econ-num" min="0" max="500" step="5" value="${E.ceiling ?? ''}" placeholder="${esc(i18n('econ.ui.174'))}" data-act="ceiling">% <span class="econ-dim">${esc(i18n('econ.ui.175'))}</span></label>
            </div>
            <div class="econ-preview econ-card" data-draft="1"></div>`;
        bindInputs(box);
        box.querySelectorAll('[data-pkg]').forEach(bt => { bt.onclick = () => usePackage(bt.dataset.pkg); });
        box.querySelectorAll('[data-austerity]').forEach(bt => { bt.onclick = () => {
            const g = bt.dataset.austerity, tgt = fiscalTarget();
            itemDefs().filter(d => (d.group || i18n('econ.ui.117')) === g && !lockOf('spend.' + d.id)).forEach(d => { tgt.spend[d.id] = r2((tgt.spend[d.id] ?? d.s0) * 0.85); });
            if (tgt === E) addEvent('policy', i18n.ref('econ.ui.176', { v: g }));
            recomputeBudget(E); refreshAll();
        }; });
        box.querySelector('[data-act="submit"]')?.addEventListener('click', submitBudget);
        box.querySelector('[data-act="discard"]')?.addEventListener('click', () => { E.draft = null; refreshAll(); });
        box.querySelector('[data-act="fill"]')?.addEventListener('click', fillPredicted);
        box.querySelector('[data-act="repay"]')?.addEventListener('click', () => { const x = Math.min(E.nat.reserves, E.nat.debt); E.nat.debt -= x; E.nat.reserves -= x; addEvent('policy', i18n.ref('econ.ui.177', { v: x.toFixed(1) })); recomputeBudget(E); refreshAll(); });
        box.querySelector('[data-act="invest"]')?.addEventListener('click', () => { const x = E.nat.reserves; E.assets.infra = (E.assets.infra ?? 50) + x * 2; E.nat.reserves = 0; addEvent('policy', i18n.ref('econ.ui.178', { v: x.toFixed(1) })); refreshAll(); });
        box.querySelector('[data-act="ceiling"]')?.addEventListener('change', e => { const v = e.target.value.trim(); E.ceiling = v === '' ? null : num(v, null, 0, 500); refreshAll(); });
        box.querySelectorAll('.econ-preview').forEach(renderPreview);
    }

    // ---- 지역 ----
    const MAP_BY = { gdppc: i18n('econ.ui.179'), unemp: i18n('econ.forecast.2'), mood: i18n('econ.def.26'), income: i18n('econ.ui.180'), industry: i18n('econ.ui.181') };
    function renderRegion() {
        const box = contentOf('region'); if (!box) return;
        const keys = distList();
        const P = sum(keys.map(k => E.dist[k].pop)) || 1, G = E.nat.gdp;
        box.innerHTML = `
            <div class="econ-intro">${esc(i18n('econ.ui.182'))}</div>
            <label class="econ-row">${esc(i18n('econ.ui.183'))} <select data-path="ui.mapBy">${Object.entries(MAP_BY).map(([k, v]) => `<option value="${k}" ${E.ui.mapBy === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
            ${keys[0] === '__nation' ? `<div class="econ-dim">${esc(i18n('econ.ui.184'))}</div>` : ''}
            <div class="econ-dlist">${keys.map(k => { const d = E.dist[k], pc = d.gdp / G / (d.pop / P) * 100; return `<details class="econ-dist" data-key="${esc(k)}">
                <summary><span class="econ-dname">${esc(nameOf(k))}</span><span>${esc(i18n('econ.ui.185'))} ${pc.toFixed(0)} ${esc(i18n('econ.ui.186'))} ${d.unemp.toFixed(1)}${esc(i18n('econ.ui.187'))} ${d.mood.toFixed(0)} ${esc(i18n('econ.ui.188'))} ${d.income.toFixed(1)}</span></summary>
                <div class="econ-dgrid">
                    <label>${esc(i18n('econ.ui.189'))} <input type="number" step="0.01" min="0" max="1" value="${d.ind[0]}" data-ind="0"></label><label>${esc(i18n('econ.ui.190'))} <input type="number" step="0.01" min="0" max="1" value="${d.ind[1]}" data-ind="1"></label><label>${esc(i18n('econ.ui.191'))} <input type="number" step="0.01" min="0" max="1" value="${d.ind[2]}" data-ind="2"></label>
                    <label>${esc(i18n('econ.ui.192'))} <input type="number" step="0.01" min="0" max="1" value="${d.age[0]}" data-age="0"></label><label>${esc(i18n('econ.ui.193'))} <input type="number" step="0.01" min="0" max="1" value="${d.age[1]}" data-age="1"></label><label>${esc(i18n('econ.ui.194'))} <input type="number" step="0.01" min="0" max="1" value="${d.age[2]}" data-age="2"></label>
                    <label>${esc(i18n('econ.ui.180'))} <input type="number" step="0.1" min="1" max="5" value="${r1(d.income)}" data-path="dist.${esc(k)}.income"></label><label>${esc(i18n('econ.ui.195'))} <input type="number" step="0.1" min="0" max="60" value="${r1(d.unemp)}" data-path="dist.${esc(k)}.unemp"></label><label>${esc(i18n('econ.def.26'))} <input type="number" step="1" min="0" max="100" value="${Math.round(d.mood)}" data-path="dist.${esc(k)}.mood"></label>
                </div><div class="econ-dim econ-small">${esc(i18n('econ.ui.196'))}</div></details>`; }).join('')}</div>`;
        bindInputs(box);
        box.querySelectorAll('.econ-dist').forEach(det => {
            const k = det.dataset.key, d = E.dist[k];
            const norm = (arr, i, v) => { const out = arr.slice(); out[i] = clamp(v, 0, 1); const rest = sum(out) - out[i]; const others = out.map((x, j) => j); others.forEach(j => { if (j !== i) out[j] = rest > 0 ? out[j] / rest * (1 - out[i]) : (1 - out[i]) / 2; }); return out.map(r2); };
            det.querySelectorAll('[data-ind]').forEach(inp => inp.addEventListener('change', () => { d.ind = norm(d.ind, +inp.dataset.ind, +inp.value); refreshAll(); }));
            det.querySelectorAll('[data-age]').forEach(inp => inp.addEventListener('change', () => { d.age = norm(d.age, +inp.dataset.age, +inp.value); refreshAll(); }));
        });
        const openKey = E.ui.openDist; if (openKey) box.querySelector(`.econ-dist[data-key="${CSS.escape(openKey)}"]`)?.setAttribute('open', '');
        box.querySelectorAll('.econ-dist').forEach(det => det.addEventListener('toggle', () => { if (det.open) E.ui.openDist = det.dataset.key; }));
    }

    // ---- 시나리오 ----
    const RULE_VARS = () => [['nat.infl', i18n('econ.def.25')], ['nat.unemp', i18n('econ.forecast.2')], ['nat.rate', i18n('econ.forecast.3')], ['nat.print', i18n('econ.ui.104')], ['nat.debt', i18n('econ.ui.166')], ['nat.conf', i18n('econ.def.27')], ['nat.mood', i18n('econ.def.26')], ['nat.cur', i18n('econ.forecast.7')]]
        .concat(itemDefs().map(d => [`spend.${d.id}`, i18n('econ.ui.197', { name: d.name })])).concat(taxDefs().map(t => [`taxes.${t.id}`, i18n('econ.ui.198', { name: t.name })]));
    function renderScenario() {
        const box = contentOf('scenario'); if (!box) return;
        const k = ruleK(E) + 1;
        box.innerHTML = `
            <div class="econ-intro">${esc(i18n('econ.ui.199'))} ${UNIT_WORD[E.unit]}${esc(i18n('econ.ui.200'))}</div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.201'))} <span class="econ-dim">${esc(i18n('econ.ui.202'))}</span></div>
                <div class="econ-presets">${Object.entries(PRESETS).map(([id, p]) => `<button type="button" class="econ-preset ${E.preset === id ? 'on' : ''}" data-ps="${id}"><b>${esc(p.name)}</b><span>${esc(p.desc.replace(/(\d+)턴/g, (m, n) => spanLabel(+n)))}</span></button>`).join('')}
                <button type="button" class="econ-preset" data-ps=""><b>${esc(i18n('econ.ui.203'))}</b><span>${esc(i18n('econ.ui.204'))}</span></button></div></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.205'))} <span class="econ-dim">${esc(i18n('econ.rule.nowAt', { n: k, unit: UNIT_WORD[E.unit] }))}</span></div>
                ${Object.entries(E.rules).map(([path, rule]) => `<div class="econ-rule" data-rpath="${esc(path)}">
                    <b>${esc((RULE_VARS().find(v => v[0] === path) || [path, path])[1])}</b>
                    <select data-rf="mode">${['locked', 'transition', 'schedule', 'fixed'].map(m => `<option value="${m}" ${rule.mode === m ? 'selected' : ''}>${{ locked: esc(i18n('econ.ui.208')), transition: esc(i18n('econ.ui.209')), schedule: esc(i18n('econ.ui.210')), fixed: esc(i18n('econ.ui.211')) }[m]}</option>`).join('')}</select>
                    ${rule.mode === 'transition' ? `<input type="number" data-rf="from" value="${rule.from ?? 0}" class="econ-num" title="${esc(i18n('econ.ui.30'))}">→<input type="number" data-rf="to" value="${rule.to ?? 0}" class="econ-num" title="${esc(i18n('econ.ui.212'))}">`
                        : rule.mode === 'schedule' ? `<input type="text" data-rf="segs" value="${esc((rule.segs || []).map(s => `${s.from}-${s.to}:${s.value}`).join(', '))}" placeholder="1-4:25, 5-8:30" title="${esc(i18n('econ.rule.segsTip', { unit: UNIT_WORD[E.unit] }))}" class="econ-segs">`
                        : `<input type="number" data-rf="value" value="${rule.value ?? 0}" class="econ-num">`}
                    ${rule.mode !== 'fixed' && rule.mode !== 'schedule' ? `<input type="number" data-rf="period" value="${rule.period ?? 4}" min="1" class="econ-num" title="${esc(i18n('econ.rule.periodTip', { unit: UNIT_WORD[E.unit] }))}">${UNIT_WORD[E.unit]}` : ''}
                    <span class="econ-dim">${ruleLeft(rule, k) ? esc(i18n('econ.ui.213', { rule: spanLabel(ruleLeft(rule, k)) })) : esc(i18n('econ.ui.214'))}</span>
                    <button type="button" class="econ-x" data-rdel title="${esc(i18n('econ.ui.215'))}">×</button></div>`).join('') || `<div class="econ-dim">${esc(i18n('econ.ui.216'))}</div>`}
                <div class="econ-row"><select data-act="rvar">${RULE_VARS().map(([p, l]) => `<option value="${p}">${esc(l)}</option>`).join('')}</select><button type="button" class="econ-btn" data-act="radd">${esc(i18n('econ.ui.218'))}</button>
                    <button type="button" class="econ-btn" data-act="rrestart" title="${esc(i18n('econ.ui.217'))}">${esc(i18n('econ.ui.219'))}</button></div></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.220'))}</div>
                ${[['hyper', esc(i18n('econ.ui.221'))], ['default', esc(i18n('econ.ui.222'))], ['depression', esc(i18n('econ.ui.223'))], ['flight', esc(i18n('econ.ui.224'))], ['collapse', esc(i18n('econ.ui.225'))], ['revolt', esc(i18n('econ.ui.226'))]].map(([k2, l]) => `<label class="econ-row">${l} <input type="number" class="econ-num" value="${E.thresholds[k2]}" data-th="${k2}"></label>`).join('')}</div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.227'))}</div>
                <label class="econ-row">${esc(i18n('econ.ui.228'))} <input type="text" value="${esc(CUR())}" data-path="settings.currency" maxlength="8" class="econ-num"></label>
                <label class="econ-row">${esc(i18n('econ.ui.229'))} <select data-path="settings.scale">${['', '만', '억', '조'].map(s => `<option value="${s}" ${E.settings.scale === s ? 'selected' : ''}>${s ? esc(scaleLabel(s)) : esc(i18n('econ.ui.230'))}</option>`).join('')}</select></label>
                <label class="econ-row">GDP <input type="number" value="${Math.round(E.nat.gdp)}" data-act="gdp" class="econ-num"> <span class="econ-dim">${esc(i18n('econ.ui.231'))}</span></label></div>
            <div class="econ-actions"><button type="button" class="econ-btn" data-act="reset">${esc(i18n('econ.ui.232'))}</button></div>`;
        bindInputs(box);
        box.querySelectorAll('[data-ps]').forEach(b => { b.onclick = () => showCustomConfirm(i18n('econ.ui.233', { v: b.querySelector('b').textContent }), () => { newEconomy(b.dataset.ps || 'none'); if (!b.dataset.ps) E.preset = ''; refreshAll(); }); });
        box.querySelectorAll('.econ-rule').forEach(row => {
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
        box.querySelector('[data-act="reset"]').onclick = () => showCustomConfirm(i18n('econ.ui.234'), () => { newEconomy(E.preset || ''); refreshAll(); });
    }

    // ---- 이벤트 — 정한 날짜에 대공황 · 금융 위기 · 호황 같은 일을 일으킴 ----
    const ymText = mi => `${Math.floor(mi / 12)}.${String(mi % 12 + 1).padStart(2, '0')}`;
    function evStatus(e, nowM) {
        if (e.ended != null) return ['done', i18n('econ.ui.214')];
        if (e.fired != null) return ['on', i18n('econ.ui.235')];
        if (e.missed) return ['missed', i18n('econ.ui.236')];
        const left = e.y * 12 + e.m - 1 - (nowM ?? 0);
        return ['wait', nowM == null ? i18n('econ.ui.237') : left <= 0 ? i18n('econ.ui.238') : i18n('econ.ui.241', { left: left >= 12 ? (i18n('econ.ui.239', { left: Math.floor(left / 12) }) + " ") : '', left2: left % 12 ? (i18n('econ.ui.240', { left: left % 12 }) + " ") : '' })];
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
            <div class="econ-intro">${esc(i18n('econ.ui.242'))}</div>
            ${d ? '' : `<div class="econ-alert">${esc(i18n('econ.ui.243'))}</div>`}
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.244'))}</div>
                <div class="econ-evtypes">${Object.entries(EVENT_TYPES).map(([k, t]) => `<button type="button" class="econ-evtype ${f.type === k ? 'on' : ''}" data-evt="${k}" aria-pressed="${f.type === k}"><b>${t.icon} ${t.name}</b><span>${k === 'custom' ? esc(i18n('econ.ui.245')) : esc(fxText(t.fx))}</span></button>`).join('')}</div>
                ${f.type === 'custom' ? `<div class="econ-evcustom">
                    <label class="econ-row">${esc(i18n('econ.ui.246'))} <input type="text" data-cn value="${esc(f.name || '')}" placeholder="${esc(i18n('econ.ui.247'))}" maxlength="24"></label>
                    ${[['g', esc(i18n('econ.ui.248'))], ['i', esc(i18n('econ.ui.249'))], ['u', esc(i18n('econ.ui.250'))], ['conf', esc(i18n('econ.ui.251'))], ['cur', esc(i18n('econ.ui.252'))]].map(([k, l]) => `<label class="econ-row">${l} <input type="number" step="0.5" data-cf="${k}" value="${cf[k] ?? 0}" class="econ-num"></label>`).join('')}</div>` : ''}
                <div class="econ-evwhen">
                    <span class="econ-evf">${esc(i18n('econ.ui.30'))} <input type="number" data-ef="y" value="${next.y}" class="econ-num econ-yr" aria-label="${esc(i18n('econ.ui.253'))}">${esc(i18n('econ.date.9'))} <input type="number" data-ef="m" min="1" max="12" value="${next.m}" class="econ-num econ-mo" aria-label="${esc(i18n('econ.ui.254'))}">${esc(i18n('econ.ui.255'))}</span>
                    <span class="econ-evf">${esc(i18n('econ.ui.92'))} <input type="number" data-ef="dur" min="1" max="240" value="${T.dur}" class="econ-num econ-mo" aria-label="${esc(i18n('econ.ui.256'))}">${esc(i18n('econ.date.6'))}</span>
                    <span class="econ-evf">${esc(i18n('econ.ui.257'))} <select data-ef="power" aria-label="${esc(i18n('econ.ui.257'))}">${EV_POWERS.map(([v, l]) => `<option value="${v}" ${v === 1 ? 'selected' : ''}>${l}</option>`).join('')}</select></span></div>
                <div class="econ-actions"><button type="button" class="econ-btn econ-primary" data-act="evadd" ${d ? '' : 'disabled'}>${esc(i18n('econ.ui.258'))}</button>
                    <button type="button" class="econ-btn" data-act="evnow" ${pm ? '' : 'disabled'} title="${esc(i18n('econ.event.nowTip', { unit: UNIT_WORD[E.unit] }))}">${esc(i18n('econ.ui.22'))} ${UNIT_WORD[E.unit]}${esc(i18n('econ.ui.259'))}</button></div>
            </div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.260'))} <span class="econ-dim">${esc(i18n('econ.ui.261'))}</span></div>
                ${list.map(e => {
                    const [st, stl] = evStatus(e, nowM), ms = e.y * 12 + e.m - 1, edit = e.fired == null && !e.missed;
                    return `<div class="econ-evrow econ-ev-${st}" data-eid="${esc(e.id)}">
                        <span class="econ-evst">${stl}</span>
                        <b>${(EVENT_TYPES[e.type] || EVENT_TYPES.custom).icon} ${esc(evName(e))}</b>
                        ${edit ? `<span class="econ-evedit"><input type="number" data-er="y" value="${e.y}" class="econ-num econ-yr" aria-label="${esc(i18n('econ.ui.253'))}">.<input type="number" data-er="m" min="1" max="12" value="${e.m}" class="econ-num econ-mo" aria-label="${esc(i18n('econ.ui.254'))}"> · <input type="number" data-er="dur" min="1" max="240" value="${e.dur}" class="econ-num econ-mo" aria-label="${esc(i18n('econ.ui.256'))}">${esc(i18n('econ.date.6'))}
                            <select data-er="power" aria-label="${esc(i18n('econ.ui.257'))}">${EV_POWERS.map(([v, l]) => `<option value="${v}" ${v === (e.power ?? 1) ? 'selected' : ''}>${l}</option>`).join('')}</select></span>`
                            : `<span class="econ-dim">${ymText(ms)} ~ ${ymText(ms + e.dur - 1)} · ${(EV_POWERS.find(p => p[0] === (e.power ?? 1)) || [0, esc(i18n('econ.event.11'))])[1]}</span>`}
                        <span class="econ-dim econ-small econ-evfx">${esc(fxText(evFx(e), e.power ?? 1))}</span>
                        <button type="button" class="econ-x" data-evdel title="${st === 'on' ? esc(i18n('econ.ui.262')) : esc(i18n('econ.ui.263'))}">×</button></div>`;
                }).join('') || `<div class="econ-dim">${esc(i18n('econ.ui.264'))}</div>`}
            </div>`;
        box.querySelectorAll('[data-evt]').forEach(b => { b.onclick = () => { f.type = b.dataset.evt; renderEvents(); }; });
        box.querySelector('[data-cn]')?.addEventListener('input', e => { f.name = e.target.value; });
        box.querySelectorAll('[data-cf]').forEach(inp => inp.addEventListener('change', () => { cf[inp.dataset.cf] = Number(inp.value) || 0; }));
        const val = k => box.querySelector(`[data-ef="${k}"]`).value;
        const add = (y, m) => {
            const ev = { id: 'ev' + Date.now().toString(36) + Math.floor(Math.random() * 1e4), type: f.type, y: Math.round(num(y, next.y, -9999, 99999)), m: Math.round(num(m, 1, 1, 12)), dur: Math.round(num(val('dur'), T.dur, 1, 240)), power: Number(val('power')) || 1 };
            if (f.type === 'custom') { ev.name = (f.name || '').trim() || i18n('econ.ui.265'); ev.fx = { ...cf }; }
            if (nowM != null && ev.y * 12 + ev.m - 1 < (pm ? pm[0] : nowM)) { showCustomAlert(i18n('econ.ui.266')); return; }
            E.sched.push(ev);
            refreshAll();
        };
        box.querySelector('[data-act="evadd"]').onclick = () => add(val('y'), val('m'));
        box.querySelector('[data-act="evnow"]').onclick = () => add(next.y, next.m);
        box.querySelectorAll('.econ-evrow').forEach(row => {
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
    const DEF_WORD = { item: i18n('econ.ui.267'), tax: i18n('econ.ui.268'), asset: i18n('econ.ui.87') };
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
        showCustomConfirm(i18n('econ.ui.270', { kind: DEF_WORD[kind], name, kind2: isBuiltinDef(kind, id) ? (" " + i18n('econ.ui.269')) : '' }), () => {
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
    const TAX_WEIGHTS = [['manufacturing', i18n('econ.ui.271')], ['industry', i18n('econ.ui.272')], ['income', i18n('econ.ui.273')], ['wealth', i18n('econ.ui.274')], ['flat', i18n('econ.ui.275')], ['imports', i18n('econ.ui.276')]];
    const opt = (v, cur, label) => `<option value="${esc(v)}" ${String(v) === String(cur ?? '') ? 'selected' : ''}>${esc(label)}</option>`;
    function defEditForm(kind, d, assets, targets) {
        const f = (k, label, v, extra = '') => `<label>${label} <input ${extra} data-e="${k}" value="${esc(v ?? '')}"></label>`;
        let body = '';
        if (kind === 'item') body = `<div class="econ-dgrid">
            ${f('name', esc(i18n('econ.ui.246')), d.name, 'type="text" maxlength="20"')}${f('group', esc(i18n('econ.ui.277')), d.group, 'type="text" maxlength="12" list="econGroups"')}${f('tags', esc(i18n('econ.ui.278')), (d.tags || []).join(', '), 'type="text"')}
            ${f('s0', esc(i18n('econ.ui.279')), d.s0, 'type="number" step="0.1" min="0"')}${f('max', esc(i18n('econ.ui.280')), d.max, 'type="number" step="0.5" min="0.1"')}${f('jobs', esc(i18n('econ.ui.281')), d.jobs, 'type="number" step="0.05"')}
            ${f('mood', esc(i18n('econ.ui.282')), d.mood, 'type="number" step="0.1"')}${f('eff', esc(i18n('econ.ui.283')), d.eff, 'type="number" step="0.05" min="0.2" max="1"')}
            <label>${esc(i18n('econ.ui.284'))} <select data-e="asset">${opt('', d.asset, esc(i18n('econ.ui.174')))}${assets.map(a => opt(a.id, d.asset, a.name)).join('')}</select></label></div>`;
        if (kind === 'tax') body = `<div class="econ-dgrid">
            ${f('name', esc(i18n('econ.ui.246')), d.name, 'type="text" maxlength="20"')}${f('rate0', esc(i18n('econ.ui.285')), d.rate0, 'type="number" step="0.5" min="0"')}${f('base', esc(i18n('econ.ui.286')), d.base, 'type="number" step="0.01" min="0"')}
            <label>${esc(i18n('econ.ui.287'))} <select data-e="weight">${TAX_WEIGHTS.map(([k, l]) => opt(k, d.weight, l)).join('')}</select></label>
            ${f('growth', esc(i18n('econ.ui.288')), d.side?.growth ?? 0, 'type="number" step="0.01"')}${f('infl', esc(i18n('econ.ui.289')), d.side?.infl ?? 0, 'type="number" step="0.01"')}</div>`;
        if (kind === 'asset') {
            const eff = Object.entries(d.effects || {});
            const row = ([k, v]) => `<div class="econ-effrow"><select data-eff="k">${targets.filter(([tk]) => tk !== d.id).map(([tk, tl]) => opt(tk, k, tl)).join('')}</select><input type="number" data-eff="v" value="${esc(v)}" step="0.01" min="-1" max="1"><button type="button" class="econ-x" data-eff-del title="${esc(i18n('econ.ui.290'))}">×</button></div>`;
            body = `<div class="econ-dgrid">${f('name', esc(i18n('econ.ui.246')), d.name, 'type="text" maxlength="16"')}${f('decay', esc(i18n('econ.ui.291')), d.decay, 'type="number" step="0.01" min="0" max="0.5"')}</div>
                <div class="econ-effs"><div class="econ-dim">${esc(i18n('econ.ui.292'))}</div>${eff.map(row).join('')}<template>${row([targets[0] ? targets[0][0] : '', 0.02])}</template>
                <button type="button" class="econ-btn" data-eff-add>${esc(i18n('econ.ui.293'))}</button></div>`;
        }
        const reset = isBuiltinDef(kind, d.id) && overrideOf(kind, d.id) ? `<button type="button" class="econ-btn" data-def-reset>${esc(i18n('econ.ui.294'))}</button>` : '';
        return `<div class="econ-defedit">${body}<div class="econ-row econ-defedit-btns"><button type="button" class="econ-btn econ-primary" data-def-save>${esc(i18n('econ.ui.295'))}</button><button type="button" class="econ-btn" data-def-cancel>${esc(i18n('econ.ui.296'))}</button>${reset}</div></div>`;
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
        form.querySelectorAll('.econ-effs > .econ-effrow').forEach(r => { const k = r.querySelector('[data-eff="k"]').value; if (k) effects[k] = num(r.querySelector('[data-eff="v"]').value, 0, -1, 1); });
        return { name, decay: n('decay', 0, 0.5), effects };
    }
    function defRowHtml(kind, d, desc, assets, targets) {
        const editing = editingDef && editingDef.kind === kind && editingDef.id === d.id;
        const edited = isBuiltinDef(kind, d.id) && overrideOf(kind, d.id) ? `<span class="econ-dim econ-edited">${esc(i18n('econ.ui.297'))}</span>` : '';
        return `<div class="econ-def ${d.builtin ? 'builtin' : ''}" data-def-kind="${kind}" data-def-id="${esc(d.id)}" data-def-name="${esc(d.name)}">
            <div class="econ-def-h"><b>${esc(d.name)}</b>${edited}<span class="econ-dim">${desc}</span>
                <span class="econ-def-acts"><button type="button" class="econ-x" data-def-edit title="${esc(i18n('econ.ui.298'))}">✎</button><button type="button" class="econ-x" data-def-del title="${esc(i18n('econ.ui.263'))}">×</button></span></div>
            ${editing ? defEditForm(kind, d, assets, targets) : ''}</div>`;
    }
    function hiddenDefsHtml(kind) {
        const hidden = DEF_BUILTIN[kind].filter(b => overrideOf(kind, b.id)?.disabled);
        if (!hidden.length) return '';
        return `<div class="econ-hidden-defs"><span class="econ-dim">${esc(i18n('econ.ui.299'))}</span>${hidden.map(b => `<button type="button" class="econ-btn" data-def-restore="${kind}:${esc(b.id)}" title="${esc(i18n('econ.ui.300'))}">${esc(overrideOf(kind, b.id)?.name || b.name)} ↺</button>`).join('')}</div>`;
    }

    function renderItems() {
        const box = contentOf('items'); if (!box) return;
        validateDefs();
        const assets = assetDefs();
        const targets = Object.entries(EFFECT_TARGETS).concat(assets.map(a => [a.id, a.name]));
        const plist = (parties || []).filter(p => p.status !== 'banned');
        box.innerHTML = `
            <div class="econ-intro">${esc(i18n('econ.ui.301'))} <b>${esc(i18n('econ.ui.278'))}</b>${esc(i18n('econ.ui.302'))}</div>
            ${warnings.length ? `<div class="econ-alert">${warnings.map(w => `<div>⚠ ${esc(w)}</div>`).join('')}</div>` : ''}
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.267'))}</div>
                ${itemDefs().map(d => defRowHtml('item', d, i18n('econ.ui.304', { group: esc(groupLabel(d.group || '')), tags: (d.tags || []).map(t => esc(tagLabel(t))).join(' · ') || esc(i18n('econ.ui.303')), s0: d.s0, asset: d.asset ? ` → ${esc(assets.find(a => a.id === d.asset)?.name || d.asset)}` : '' }), assets, targets)).join('')}
                ${hiddenDefsHtml('item')}
                <details class="econ-newdef"><summary>${esc(i18n('econ.ui.308'))}</summary>
                    <div class="econ-dgrid">
                        <label>${esc(i18n('econ.ui.246'))} <input type="text" data-n="name" maxlength="20" placeholder="${esc(i18n('econ.ui.305'))}"></label>
                        <label>${esc(i18n('econ.ui.277'))} <input type="text" data-n="group" maxlength="12" placeholder="${esc(i18n('econ.ui.306'))}" list="econGroups"></label>
                        <label>${esc(i18n('econ.ui.278'))} <input type="text" data-n="tags" placeholder="${esc(i18n('econ.ui.307'))}" title="${esc(i18n('econ.ui.tagsTip', { tags: TAGS.map(tagLabel).join(', ') }))}"></label>
                        <label>${esc(i18n('econ.ui.279'))} <input type="number" data-n="s0" value="0.5" step="0.1" min="0"></label>
                        <label>${esc(i18n('econ.ui.280'))} <input type="number" data-n="max" value="5" step="0.5" min="0.1"></label>
                        <label>${esc(i18n('econ.ui.281'))} <input type="number" data-n="jobs" value="-0.1" step="0.05" title="${esc(i18n('econ.ui.309'))}"></label>
                        <label>${esc(i18n('econ.ui.282'))} <input type="number" data-n="mood" value="0.1" step="0.1"></label>
                        <label>${esc(i18n('econ.ui.283'))} <input type="number" data-n="eff" value="0.6" step="0.05" min="0.2" max="1"></label>
                        <label>${esc(i18n('econ.ui.284'))} <select data-n="asset"><option value="">${esc(i18n('econ.ui.174'))}</option>${assets.map(a => `<option value="${esc(a.id)}">${esc(a.name)}</option>`).join('')}<option value="__new">${esc(i18n('econ.ui.311'))}</option></select></label>
                    </div>
                    <div class="econ-dgrid econ-newasset" hidden>
                        <label>${esc(i18n('econ.ui.312'))} <input type="text" data-n="aname" maxlength="16" placeholder="${esc(i18n('econ.ui.310'))}"></label>
                        <label>${esc(i18n('econ.ui.291'))} <input type="number" data-n="adecay" value="0.03" step="0.01" min="0" max="0.5"></label>
                        <label>${esc(i18n('econ.ui.313'))} <select data-n="atarget">${targets.map(([k, l]) => `<option value="${esc(k)}">${esc(l)}</option>`).join('')}</select></label>
                        <label>${esc(i18n('econ.ui.315'))} <input type="number" data-n="acoef" value="0.02" step="0.01" min="-1" max="1" title="${esc(i18n('econ.ui.314'))}"></label>
                    </div>
                    <datalist id="econGroups">${[...new Set(itemDefs().map(d => d.group))].map(g => `<option value="${esc(g)}">`).join('')}</datalist>
                    <button type="button" class="econ-btn econ-primary" data-act="add-item">${esc(i18n('econ.ui.316'))}</button></details></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.268'))}</div>
                ${taxDefs().map(t => defRowHtml('tax', t, i18n('econ.ui.317', { rate0: t.rate0, base: Math.round(t.base * 100), weight: { income: esc(i18n('econ.ui.273')), industry: esc(i18n('econ.ui.272')), flat: esc(i18n('econ.ui.275')), wealth: esc(i18n('econ.ui.274')), imports: esc(i18n('econ.ui.276')), manufacturing: esc(i18n('econ.ui.190')) }[t.weight] || '' }), assets, targets)).join('')}
                ${hiddenDefsHtml('tax')}
                <details class="econ-newdef"><summary>${esc(i18n('econ.ui.319'))}</summary><div class="econ-dgrid">
                    <label>${esc(i18n('econ.ui.246'))} <input type="text" data-t="name" maxlength="20" placeholder="${esc(i18n('econ.ui.318'))}"></label>
                    <label>${esc(i18n('econ.ui.285'))} <input type="number" data-t="rate0" value="5" step="0.5" min="0"></label>
                    <label>${esc(i18n('econ.ui.286'))} <input type="number" data-t="base" value="0.1" step="0.01" min="0"></label>
                    <label>${esc(i18n('econ.ui.287'))} <select data-t="weight"><option value="manufacturing">${esc(i18n('econ.ui.271'))}</option><option value="industry">${esc(i18n('econ.ui.272'))}</option><option value="income">${esc(i18n('econ.ui.273'))}</option><option value="wealth">${esc(i18n('econ.ui.274'))}</option><option value="flat">${esc(i18n('econ.ui.275'))}</option><option value="imports">${esc(i18n('econ.ui.276'))}</option></select></label>
                    <label>${esc(i18n('econ.ui.288'))} <input type="number" data-t="growth" value="-0.02" step="0.01"></label>
                    <label>${esc(i18n('econ.ui.289'))} <input type="number" data-t="infl" value="0.01" step="0.01"></label>
                </div><button type="button" class="econ-btn econ-primary" data-act="add-tax">${esc(i18n('econ.ui.320'))}</button></details></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.87'))}</div>
                ${assets.map(a => defRowHtml('asset', a, i18n('econ.ui.321', { assets: (E.assets[a.id] ?? 50).toFixed(0), decay: Math.round(a.decay * 100), name: Object.entries(a.effects || {}).map(([k, v]) => `${esc(EFFECT_TARGETS[k] || assets.find(x => x.id === k)?.name || k)} ${sgn(v, 2)}`).join(' · ') || esc(i18n('econ.event.21')) }), assets, targets)).join('')}
                ${hiddenDefsHtml('asset')}
                <details class="econ-newdef econ-newasset-def"><summary>${esc(i18n('econ.ui.311'))}</summary>
                    <div class="econ-dgrid">
                        <label>${esc(i18n('econ.ui.246'))} <input type="text" data-a="name" maxlength="16" placeholder="${esc(i18n('econ.ui.310'))}"></label>
                        <label>${esc(i18n('econ.ui.291'))} <input type="number" data-a="decay" value="0.03" step="0.01" min="0" max="0.5"></label>
                        <label>${esc(i18n('econ.ui.323'))} <input type="number" data-a="start" value="50" step="1" min="0" max="100" title="${esc(i18n('econ.ui.322'))}"></label>
                        <label>${esc(i18n('econ.ui.324'))} <select data-a="item"><option value="">${esc(i18n('econ.ui.174'))}</option>${itemDefs().map(d => `<option value="${esc(d.id)}">${esc(d.name)}${d.asset ? esc((" " + i18n('econ.ui.325', { asset: esc(assets.find(a => a.id === d.asset)?.name || d.asset) }))) : ''}</option>`).join('')}</select></label>
                    </div>
                    <div class="econ-effs"><div class="econ-dim">${esc(i18n('econ.ui.292'))}</div>
                        <template><div class="econ-effrow"><select data-eff="k">${targets.map(([tk, tl]) => `<option value="${esc(tk)}">${esc(tl)}</option>`).join('')}</select><input type="number" data-eff="v" value="0.02" step="0.01" min="-1" max="1"><button type="button" class="econ-x" data-eff-del title="${esc(i18n('econ.ui.290'))}">×</button></div></template>
                        <button type="button" class="econ-btn" data-eff-add>${esc(i18n('econ.ui.293'))}</button></div>
                    <button type="button" class="econ-btn econ-primary" data-act="add-asset">${esc(i18n('econ.ui.326'))}</button></details></div>
            <div class="econ-card"><div class="econ-card-h">${esc(i18n('econ.ui.327'))}</div>
                <div class="econ-dim">${esc(i18n('econ.ui.328'))}${TAGS.map(t => esc(tagLabel(t))).join(' · ')}${esc(i18n('econ.ui.329'))}</div>
                <button type="button" class="econ-btn econ-primary" data-act="open-tagprefs" style="margin-top:6px;">${esc(i18n('econ.ui.330'))}</button></div>`;
        const nd = box.querySelector('.econ-newdef');
        nd.querySelector('[data-n="asset"]').onchange = e => { box.querySelector('.econ-newasset').hidden = e.target.value !== '__new'; };
        box.querySelector('[data-act="add-item"]').onclick = () => {
            const g = k => nd.querySelector(`[data-n="${k}"]`).value;
            const name = g('name').trim(); if (!name) { showCustomAlert(i18n('econ.ui.331')); return; }
            let asset = g('asset') || null;
            if (asset === '__new') {
                const an = g('aname').trim() || i18n('econ.ui.332', { name });
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
        // 새 자산 — 효과 줄 · 쌓을 지출 항목(기본 항목이면 override로 연결)
        const na = box.querySelector('.econ-newasset-def');
        const naEffAdd = na.querySelector('[data-eff-add]');
        const naBindDel = () => na.querySelectorAll('[data-eff-del]').forEach(b => { b.onclick = () => b.closest('.econ-effrow').remove(); });
        naEffAdd.onclick = () => { naEffAdd.before(na.querySelector('.econ-effs > template').content.cloneNode(true)); naBindDel(); };
        naEffAdd.click(); // 효과 한 줄로 시작
        box.querySelector('[data-act="add-asset"]').onclick = () => {
            const g = k => na.querySelector(`[data-a="${k}"]`).value;
            const name = g('name').trim(); if (!name) { showCustomAlert(i18n('econ.ui.333')); return; }
            const effects = {};
            na.querySelectorAll('.econ-effs > .econ-effrow').forEach(r => { const k = r.querySelector('[data-eff="k"]').value; if (k) effects[k] = num(r.querySelector('[data-eff="v"]').value, 0, -1, 1); });
            const id = 'a' + Date.now().toString(36);
            E.defs.assets.push({ id, name, decay: num(g('decay'), 0.03, 0, 0.5), effects });
            E.assets[id] = num(g('start'), 50, 0, 100);
            const itemId = g('item');
            if (itemId) {
                if (isBuiltinDef('item', itemId)) {
                    let o = overrideOf('item', itemId);
                    if (!o) { o = { id: itemId, override: true }; E.defs.items.push(o); }
                    o.asset = id;
                } else {
                    const d = E.defs.items.find(x => x.id === itemId && !x.override);
                    if (d) d.asset = id;
                }
            }
            validateDefs(); recomputeBudget(E); refreshAll();
        };
        box.querySelector('[data-act="add-tax"]').onclick = () => {
            const tn = box.querySelectorAll('.econ-newdef')[1], g = k => tn.querySelector(`[data-t="${k}"]`).value;
            const name = g('name').trim(); if (!name) { showCustomAlert(i18n('econ.ui.334')); return; }
            const id = 't' + Date.now().toString(36);
            E.defs.taxes.push({ id, name, rate0: Number(g('rate0')), base: Number(g('base')), L: 100, max: 60, weight: g('weight'), side: { growth: Number(g('growth')), infl: Number(g('infl')) } });
            validateDefs();
            E.taxes[id] = E.defs.taxes[E.defs.taxes.length - 1].rate0; if (E.draft) E.draft.taxes[id] = E.taxes[id];
            recomputeBudget(E); refreshAll();
        };
        box.querySelectorAll('.econ-def[data-def-kind]').forEach(row => {
            const kind = row.dataset.defKind, id = row.dataset.defId, name = row.dataset.defName;
            row.querySelector('[data-def-edit]').onclick = () => { editingDef = editingDef && editingDef.kind === kind && editingDef.id === id ? null : { kind, id }; renderItems(); };
            row.querySelector('[data-def-del]').onclick = () => removeDef(kind, id, name);
            const form = row.querySelector('.econ-defedit');
            if (!form) return;
            form.querySelector('[data-def-save]').onclick = () => {
                const fields = readDefEdit(kind, form);
                if (!fields) { showCustomAlert(i18n('econ.ui.335')); return; }
                saveDef(kind, id, fields);
            };
            form.querySelector('[data-def-cancel]').onclick = () => { editingDef = null; renderItems(); };
            const rs = form.querySelector('[data-def-reset]');
            if (rs) rs.onclick = () => restoreDef(kind, id, true);
            const add = form.querySelector('[data-eff-add]');
            if (add) add.onclick = () => { const t = form.querySelector('.econ-effs > template'); add.before(t.content.cloneNode(true)); bindEffDel(); };
            const bindEffDel = () => form.querySelectorAll('[data-eff-del]').forEach(b => { b.onclick = () => b.closest('.econ-effrow').remove(); });
            bindEffDel();
        });
        box.querySelectorAll('[data-def-restore]').forEach(b => { b.onclick = () => { const [kind, ...rest] = b.dataset.defRestore.split(':'); restoreDef(kind, rest.join(':'), false); }; });
        box.querySelector('[data-act="open-tagprefs"]').onclick = showTagPrefs;
    }

    // ================= 오른쪽 시각 화면 "경제" =================
    (function addDisp() {
        const after = document.getElementById('dispTabRanking') || document.getElementById('dispTabTimeline') || document.getElementById('dispTabCabinet');
        if (!after) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabEconomy" data-tab="economy" onclick="switchDispTab('economy')" style="display:none;"><span class="disp-tab-label">${esc(i18n('econ.disp.1'))}</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('economy')">×</span></button>`), after.nextSibling);
        const ref = document.getElementById('dispPanelRanking') || document.getElementById('dispPanelTimeline') || document.getElementById('dispPanelCabinet');
        if (!ref) return;
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelEconomy"><div class="chamber-box econ-dispbox econ-viz">
            <div class="econ-toolbar" id="econToolbar"></div><div id="econDisp"></div></div></div>`), ref.nextSibling);
    })();
    // ---- 오른쪽 시각 화면 "태그 선호" — 정당 × 태그 표 (가로로 넓어서 왼쪽 항목 탭 대신 여기서 고친다) ----
    (function addTagPrefsDisp() {
        const after = document.getElementById('dispTabEconomy');
        const ref = document.getElementById('dispPanelEconomy');
        if (!after || !ref) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabTagprefs" data-tab="tagprefs" onclick="switchDispTab('tagprefs')" style="display:none;"><span class="disp-tab-label">${esc(i18n('econ.disp.2'))}</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('tagprefs')">×</span></button>`), after.nextSibling);
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelTagprefs"><div class="chamber-box econ-dispbox econ-viz"><div id="econTagPrefs"></div></div></div>`), ref.nextSibling);
    })();
    function showTagPrefs() {
        const btn = document.getElementById('dispTabTagprefs');
        if (btn) btn.style.display = '';
        try { switchDispTab('tagprefs'); } catch (e) { /* 시각 화면 없음 */ }
        renderTagPrefs();
    }
    const prefColor = v => (v > 0 ? `color-mix(in srgb, var(--success, #2ecc71) ${Math.round(Math.min(1, v / 2) * 55)}%, transparent)` : v < 0 ? `color-mix(in srgb, var(--critical, #e74c3c) ${Math.round(Math.min(1, -v / 2) * 55)}%, transparent)` : 'transparent');
    function renderTagPrefs(focus) {
        const box = document.getElementById('econTagPrefs');
        if (!box) return;
        const plist = (parties || []).filter(p => p.status !== 'banned' && p.ideologyId !== 9999);
        box.innerHTML = `
            <div class="econ-tp-head"><b>${esc(i18n('econ.ui.327'))}</b><span class="econ-dim">${esc(i18n('econ.disp.3'))}</span></div>
            <div class="econ-tp-wrap"><table class="econ-tp"><thead><tr><th>${esc(i18n('econ.ui.138'))}</th>${TAGS.map(t => `<th>${esc(tagLabel(t))}</th>`).join('')}<th></th></tr></thead><tbody>
            ${plist.map(p => { const pr = partyPrefs(p), own = E.tagPrefs[p.id] || {}; return `<tr data-pid="${esc(p.id)}"><td class="econ-tp-name"><i class="econ-pdot" style="background:${esc(p.color)}"></i>${esc(p.name)}</td>${TAGS.map(t => {
                const v = pr[t], set = own[t] != null;
                return `<td style="background:${prefColor(v)}"><input type="number" step="0.1" min="-2" max="2" data-tag="${esc(t)}" value="${set ? own[t] : ''}" placeholder="${v.toFixed(1)}" class="econ-tagin${set ? ' set' : ''}"></td>`;
            }).join('')}<td>${Object.keys(own).length ? `<button type="button" class="econ-x" data-tp-reset title="${esc(i18n('econ.disp.4'))}">↺</button>` : ''}</td></tr>`; }).join('')}
            </tbody></table></div>`;
        box.querySelectorAll('tr[data-pid] .econ-tagin').forEach(inp => inp.addEventListener('change', () => {
            const pid = inp.closest('tr').dataset.pid, t = inp.dataset.tag, raw = inp.value.trim();
            const key = (parties.find(p => String(p.id) === pid) || {}).id ?? pid;
            E.tagPrefs[key] = E.tagPrefs[key] || {};
            if (raw === '') delete E.tagPrefs[key][t]; else E.tagPrefs[key][t] = num(raw, 0, -2, 2);
            if (!Object.keys(E.tagPrefs[key]).length) delete E.tagPrefs[key];
            renderTagPrefs(`${pid}|${t}`); renderTab('fiscal');
        }));
        box.querySelectorAll('[data-tp-reset]').forEach(b => { b.onclick = () => { const pid = b.closest('tr').dataset.pid; const key = (parties.find(p => String(p.id) === pid) || {}).id ?? pid; delete E.tagPrefs[key]; renderTagPrefs(); renderTab('fiscal'); }; });
        // 값을 바꾼 뒤 Tab으로 다음 칸에 갈 수 있게 다음 칸에 포커스
        if (focus) {
            const [pid, t] = focus.split('|');
            const inputs = [...box.querySelectorAll('.econ-tagin')];
            const i = inputs.findIndex(x => x.closest('tr').dataset.pid === pid && x.dataset.tag === t);
            if (i >= 0 && document.activeElement === document.body && inputs[i + 1]) inputs[i + 1].focus();
        }
    }
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
        if (tab === 'tagprefs') setTimeout(() => renderTagPrefs(), 20);
        return r;
    };
    function toggleFull(on) {
        E.ui.full = on == null ? !E.ui.full : on;
        document.body.classList.toggle('econ-full', !!E.ui.full);
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
    const RANGES = [['all', i18n('econ.disp.5')], ['y10', i18n('econ.disp.6')], ['y5', i18n('econ.disp.7')], ['y2', i18n('econ.disp.8')]];
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
        return E.events.filter(e => at.has(e.t) && ['crisis', 'revolt', 'election', 'budget', 'policy', 'unify'].includes(e.kind) && !(e.kind === 'budget' && !(e.key ? e.key === BUDGET_PASSED_KEY : /가결/.test(e.label)))) // 예산 기록은 가결만
            .map(e => ({ i: at.get(e.t), label: evText(e), kind: e.kind === 'revolt' || e.kind === 'unify' ? 'crisis' : e.kind }));
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
        const tb = document.getElementById('econToolbar'); if (!tb) return;
        // 경제권은 세계 › 경제권(지도상의 경제 지역, js/world-map.js) — 여기서는 그 화면으로 가는 버튼
        tb.innerHTML = `<span class="econ-seg">${[['overview', esc(i18n('econ.ui.6'))], ['analysis', esc(i18n('econ.ui.7'))], ['region', esc(i18n('econ.ui.10'))]].map(([k, l]) => `<button type="button" data-view="${k}" class="${E.ui.view === k ? 'on' : ''}">${l}</button>`).join('')}<button type="button" class="econ-link" data-econ-zones title="${esc(i18n('econ.disp.9'))}">${esc(i18n('econ.disp.10'))}</button></span>
            ${E.ui.view === 'analysis' ? `<span class="econ-dim">${esc(E.ui.preset === 'custom' ? esc(i18n('econ.disp.11')) : PRESET_MODS[E.ui.preset]?.name || '')}</span>` : ''}
            <span class="econ-seg">${RANGES.map(([k, l]) => `<button type="button" data-range="${k}" class="${String(E.ui.range) === k && !E.ui.zoom ? 'on' : ''}">${l}</button>`).join('')}</span>
            ${E.ui.zoom ? `<button type="button" class="econ-btn econ-sm" data-act="unzoom">${esc(i18n('econ.disp.12'))}</button>` : ''}
            <span class="econ-grow"></span>
            <button type="button" class="econ-btn econ-sm" data-act="photo" title="${esc(i18n('econ.disp.13'))}">${esc(i18n('econ.disp.16'))}</button>
            <button type="button" class="econ-btn econ-sm" data-act="csv" title="${esc(i18n('econ.disp.14'))}">CSV</button>
            <button type="button" class="econ-btn econ-sm" data-act="full" title="${esc(i18n('econ.disp.15'))}">${E.ui.full ? esc(i18n('econ.disp.17')) : esc(i18n('econ.disp.18'))}</button>`;
        tb.querySelectorAll('[data-view]').forEach(b => { b.onclick = () => { E.ui.view = b.dataset.view; renderDisp(); }; });
        tb.querySelector('[data-econ-zones]').onclick = () => { try { switchSubTab('world', 'econblocs'); } catch (e) { /* 세계 탭 없음 */ } };
        tb.querySelectorAll('[data-range]').forEach(b => { b.onclick = () => { E.ui.range = b.dataset.range; E.ui.zoom = null; renderDisp(); if (curSub() === 'analysis') renderTab('analysis'); }; });
        tb.querySelector('[data-act="unzoom"]')?.addEventListener('click', () => { E.ui.zoom = null; renderDisp(); });
        tb.querySelector('[data-act="csv"]').onclick = () => C.csv(tableSpec());
        tb.querySelector('[data-act="photo"]').onclick = () => exportDispPhoto();
        tb.querySelector('[data-act="full"]').onclick = () => toggleFull();
    }
    function renderDisp() {
        if (!dispActive()) return;
        ensureInit();
        renderToolbar();
        const box = document.getElementById('econDisp'); if (!box) return;
        box.textContent = '';
        try {
            if (E.ui.view === 'analysis') renderAnalysisDisp(box);
            else if (E.ui.view === 'region') renderRegionDisp(box);
            else if (E.ui.view === 'metric' && METRICS[E.ui.metric]) renderMetricDisp(box);
            else renderOverviewDisp(box);
        } catch (e) { console.error(e); box.textContent = (i18n('econ.disp.19') + " ") + e.message; }
    }
    const section = (box, title, sub) => {
        const s = document.createElement('section'); s.className = 'econ-sec';
        if (title) { const h = document.createElement('h4'); h.textContent = title; if (sub) { const sp = document.createElement('span'); sp.className = 'econ-dim'; sp.textContent = ' ' + sub; h.appendChild(sp); } s.appendChild(h); }
        const body = document.createElement('div'); s.appendChild(body); box.appendChild(s);
        return body;
    };
    function renderOverviewDisp(box) {
        const N = E.nat, last = E.hist[E.hist.length - 2];
        const spark = k => E.hist.slice(-8).map(h => h.n[k]);
        // 첫 줄: 신용등급 + 경제 경고 신호 (켜진 신호는 상태색 · 꺼진 신호는 흐리게) / 둘째 줄: 계기 6개
        const rt = E.rating || ratingOf(E);
        const sigAll = signals(E);
        const top = el(`<div class="econ-toprow">
            <div class="econ-rating econ-rating-row econ-grade-${rt[0].startsWith('A') ? 'a' : rt[0].startsWith('B') ? 'b' : 'c'}" title="${esc(i18n('econ.ui.28'))}"><b>${rt[0]}</b><div><span>${rt[1]}</span><em>${esc(turnLabel(E, E.turn))} · GDP ${esc(gdpText())}</em></div></div>
            <div class="econ-warnsigns"><div class="econ-warn-h">${esc(i18n('econ.disp.20'))}</div><div class="econ-warn-list">${sigAll.map(s => `<span class="econ-warn ${s.on ? 'on econ-warn-' + s.status : ''}" title="${s.on ? STATUS_WORD[s.status] : esc(i18n('econ.disp.21'))}">${s.on ? `<i class="econ-wi econ-st-${s.status}">${C.STATUS[s.status].icon}</i>` : '○'} ${esc(s.label)}</span>`).join('')}</div></div>
        </div>`);
        box.appendChild(top);
        const gs = document.createElement('div'); gs.className = 'econ-gauges'; box.appendChild(gs);
        [['infl', i18n('econ.def.25'), -5, 60, 'monetary'], ['growth', i18n('econ.forecast.1'), -10, 10, 'fiscal'], ['unemp', i18n('econ.forecast.2'), 0, 40, 'region'], ['debt', i18n('econ.forecast.5'), 0, 250, 'fiscal'], ['mood', i18n('econ.def.26'), 0, 100, 'region'], ['conf', i18n('econ.def.27'), 0, 100, 'monetary']].forEach(([k, l, mn, mx, go]) => {
            const g = document.createElement('div'); gs.appendChild(g);
            const v = VAR[k].get(E);
            C.gauge(g, { label: l, value: v, unit: VAR[k].unit === '%' ? '%' : '', min: mn, max: mx, maxPlus: k === 'infl' || k === 'debt', bands: bandsOf(k), status: statusOf(k, v), spark: spark(k), delta: last ? v - last.n[k] : null, decimals: 1,
                // 누르면 예전처럼 왼쪽 탭만, Shift + 클릭(Shift + Enter)이면 오른쪽에 그 지표의 세부 정보
                title: i18n('econ.disp.22', { go: ({ monetary: i18n('econ.ui.8'), fiscal: i18n('econ.ui.9'), region: i18n('econ.ui.10') })[go], v: l }),
                onClick: e => { if (e && e.shiftKey) showMetric(k); else { keepDisp = true; switchSubTab('economy', go); } } });
        });
        box.appendChild(el(`<div class="econ-dim econ-small">${esc(i18n('econ.disp.23'))} <b>${esc(i18n('econ.disp.24'))}</b>${esc(i18n('econ.disp.25'))}</div>`));
        // 셋째 줄: 금액 — 비율(GDP 대비)만으로는 실제 규모를 알 수 없으니 화폐 단위로 (세입 · 세출 · 이자는 연간)
        const bq = budgetOf(E, N, distList()), prevN = last ? last.n : null;
        const chg = (now, before) => (before == null || !Number.isFinite(before) ? '' : `<em class="${now >= before ? 'up' : 'down'}">${now >= before ? '▲' : '▼'} ${Math.round(Math.abs(now - before)).toLocaleString()}</em>`);
        const amt = pctGdp => pctGdp * N.gdp / 100, amtThen = (k) => (prevN && Number.isFinite(prevN[k]) ? prevN[k] * prevN.gdp / 100 : null);
        const fin = [
            ['GDP', gdpText(), i18n('econ.disp.26', { growth: pct(N.growth) }), chg(N.gdp, prevN?.gdp)],
            [i18n('econ.ui.166'), money(N.debt), i18n('econ.disp.27', { debt: pct(N.debt, 0) }), chg(amt(N.debt), amtThen('debt')), N.debt > E.thresholds.default ? 'critical' : N.debt > 90 ? 'serious' : ''],
            [i18n('econ.ui.164'), money(N.reserves), N.reserves > 0 ? i18n('econ.disp.28', { reserves: pct(N.reserves) }) : i18n('econ.disp.29'), chg(amt(N.reserves), amtThen('reserves'))],
            [i18n('econ.disp.30'), money(N.rev), i18n('econ.disp.31', { rev: pct(N.rev) }), ''],
            [i18n('econ.disp.32'), money(N.spend), i18n('econ.disp.33', { spend: pct(N.spend) }), ''],
            [N.balance < 0 ? i18n('econ.disp.34') : i18n('econ.disp.35'), money(Math.abs(N.balance)), i18n('econ.disp.36', { balance: pct(Math.abs(N.balance)) }), '', N.balance < -6 ? 'serious' : ''],
            [i18n('econ.disp.37'), money(bq.mand.interest), i18n('econ.disp.38', { yield: pct(N.yield) }), ''],
        ];
        box.appendChild(el(`<div class="econ-fin" aria-label="${esc(i18n('econ.disp.39'))}">${fin.map(([l, v, sub, d, st]) => `<div class="econ-fin-i ${st ? 'econ-fin-' + st : ''}"><span>${l}</span><b>${esc(v)}</b><small>${esc(sub)} ${d}</small></div>`).join('')}</div>`));
        // 이대로면 다음 칸 — 재정 금액 줄 다음에, 왼쪽 개요의 미리보기를 크게 (지금 · 흔들림 없는 다음 칸 예측)
        const pv = el('<div class="econ-preview econ-preview-big econ-card"></div>');
        box.appendChild(pv); renderPreview(pv);
        // 큰 그래프 — 같은 단위(%)인 지표만 겹쳐 봄 (두 눈금 겹치지 않게)
        const body = section(box, i18n('econ.disp.40'), i18n('econ.disp.41'));
        const chips = el(`<div class="econ-chips">${CHIP_VARS.map(k => `<button type="button" data-chip="${k}" class="econ-chip ${E.ui.chips.includes(k) ? 'on' : ''}" aria-pressed="${E.ui.chips.includes(k)}"><i style="background:${VAR[k].color}"></i>${VAR[k].label}</button>`).join('')}</div>`);
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
            ser.push({ id: k + '_f', label: i18n('econ.disp.42', { label: VAR[k].label }), color: VAR[k].color, dash: true, width: 1.5, values: Array(n - 1).fill(null).concat([VAR[k].get(E)], fc[k].mean) });
        });
        const [i0] = rangeIdx(n);
        C.lines(chart, { x: xs, t: ts, series: ser, unit: '%', height: 260, zero: true, markers: markersOf(H), shade: recessions(H), fan: sel.length ? [fanFor(sel[0], n, h, fc[sel[0]])] : [], range: [i0, xs.length - 1] });
        // 예산
        const bb = section(box, i18n('econ.disp.43', { unit: unitText() }), E.settings.budgetView === 'hemi' ? i18n('econ.disp.44') : i18n('econ.disp.45'));
        const sp = budgetPies();
        const opt = { spend: sp.spend, rev: sp.rev, unit: '', center: [`${N.balance < 0 ? i18n('econ.ui.168') : i18n('econ.ui.169')} ${Math.abs(N.balance).toFixed(1)}%`, i18n('econ.disp.46')] };
        if (E.settings.budgetView === 'bars') C.budgetBars(bb, opt); else C.budgetHemi(bb, opt);
        const sw = el(`<div class="econ-dim econ-small" style="margin-top:4px"><button type="button" class="econ-btn econ-sm" data-act="bview">${E.settings.budgetView === 'bars' ? i18n('econ.disp.47') : i18n('econ.disp.48')}</button></div>`);
        bb.appendChild(sw);
        sw.querySelector('button').onclick = () => { E.settings.budgetView = E.settings.budgetView === 'bars' ? 'hemi' : 'bars'; renderDisp(); };
    }
    // ===== 지표 하나 보기 — 개요의 계기를 누르면 시각 화면이 그 지표 중심으로 바뀐다 =====
    // 이대로면 다음 칸 · 1년 뒤(예측 중앙값과 50% 범위) · 지금과 비교, 그 지표와 관련된 경고 신호만, 무엇이 움직이는지(정책 민감도),
    // 그 지표에 듣는 패키지 정책(1년 뒤 예상과 함께 바로 쓰기)
    const METRICS = {
        infl: { label: i18n('econ.def.25'), min: -5, max: 60, go: 'monetary', goLabel: i18n('econ.ui.8'), signals: ['hyper', 'printing', 'collapse'], pkgs: ['qt', 'qe', 'devalue'],
            note: () => { const g = growthTrend(E.nat); return i18n('econ.disp.49', { v: pct(g), hyper: pct(Math.min(5 + inflSafeExtra(g), E.thresholds.hyper)) }); } },
        growth: { label: i18n('econ.forecast.1'), min: -10, max: 10, go: 'fiscal', goLabel: i18n('econ.ui.9'), signals: ['negative', 'collapse', 'financial'], pkgs: ['qe', 'taxcut', 'devalue'] },
        unemp: { label: i18n('econ.forecast.2'), min: 0, max: 40, go: 'region', goLabel: i18n('econ.ui.10'), signals: ['depression', 'negative', 'collapse'], pkgs: ['qe', 'taxcut'] },
        debt: { label: i18n('econ.forecast.5'), min: 0, max: 250, go: 'fiscal', goLabel: i18n('econ.ui.9'), signals: ['default', 'deficit', 'ceiling', 'reserves', 'financial'], pkgs: ['taxhike', 'qt'] },
        mood: { label: i18n('econ.def.26'), min: 0, max: 100, go: 'region', goLabel: i18n('econ.ui.10'), signals: ['negative', 'depression', 'hyper', 'collapse'], pkgs: ['taxcut', 'qe'] },
        conf: { label: i18n('econ.def.27'), min: 0, max: 100, go: 'monetary', goLabel: i18n('econ.ui.8'), signals: ['flight', 'financial', 'default', 'printing'], pkgs: ['qt', 'taxhike'] },
    };
    const PKG_INFO = {
        qe: { name: i18n('econ.forecast.12'), mut: s => { s.temps.push({ type: 'qe', left: 4 }); } },
        qt: { name: i18n('econ.budget.1'), mut: s => { s.temps.push({ type: 'qt', left: 4 }); } },
        devalue: { name: i18n('econ.forecast.13'), mut: s => { s.nat.cur *= 0.88; s.nat.conf = Math.max(0, s.nat.conf - 5); } },
        taxcut: { name: i18n('econ.budget.2'), mut: s => { s.temps.push({ type: 'taxcut', left: 4 }); } },
        taxhike: { name: i18n('econ.budget.3'), mut: s => { s.temps.push({ type: 'taxhike', left: 4 }); } },
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
        box.appendChild(el(`<div class="econ-mhead">
            <button type="button" class="econ-btn econ-sm" data-act="back">${esc(i18n('econ.disp.50'))}</button>
            <span class="econ-chips">${Object.keys(METRICS).map(m => `<button type="button" class="econ-chip ${m === k ? 'on' : ''}" data-metric="${m}"><i style="background:${VAR[m].color}"></i>${METRICS[m].label}</button>`).join('')}</span>
        </div>`));
        // 지금 · 다음 칸 · 1년 뒤
        const card = (title, val, sub, s) => `<div class="econ-mcard econ-mcard-${s}"><span>${title}</span><b>${esc(val)}</b><small>${sub}</small><em class="econ-st-${s}">${STATUS_WORD[s]}</em></div>`;
        box.appendChild(el(`<div class="econ-mcards">
            ${card(i18n('econ.disp.51', { label: esc(M.label) }), fmt(v), esc(turnLabel(E, E.turn)), st)}
            ${card(i18n('econ.disp.52', { unit: UNIT_WORD[E.unit] }), fmt(next), i18n('econ.disp.53', { next: arrow(next - v), next2: dtxt(next - v), dunit, nextLo: fmt(nextLo), nextHi: fmt(nextHi) }), stN)}
            ${yr > 1 ? card(i18n('econ.disp.54', { yr: spanLabel(yr) }), fmt(yv), i18n('econ.disp.58', { yv: arrow(yv - v), yv2: dtxt(yv - v), dunit, yv3: flat(yv - v) ? i18n('econ.disp.55') : yv > v ? i18n('econ.disp.56') : i18n('econ.disp.57') }), stY) : ''}
        </div>`));
        if (M.note) box.appendChild(el(`<div class="econ-dim econ-small">${esc(M.note())}</div>`));
        // 추이 + 예측
        const body = section(box, i18n('econ.disp.59', { label: M.label }), i18n('econ.disp.60'));
        const chart = document.createElement('div'); body.appendChild(chart);
        const { H, n, x, t, col } = series(), h = Math.max(4, yr);
        const fc2 = h === yr ? fc : forecast([k], h, 32);
        const xs = withForecast(x, h), ts = withForecastT(t, h);
        const [i0] = rangeIdx(n);
        C.lines(chart, { x: xs, t: ts, unit, height: 200, zero: k === 'growth' || k === 'infl', markers: markersOf(H), shade: recessions(H), range: [i0, xs.length - 1],
            fan: [fanFor(k, n, h, fc2[k])],
            series: [{ id: k, label: M.label, color: VAR[k].color, values: col(hh => hh.n[k]).concat(Array(h).fill(null)) },
                { id: k + '_f', label: i18n('econ.disp.42', { label: M.label }), color: VAR[k].color, dash: true, width: 1.5, values: Array(n - 1).fill(null).concat([v], fc2[k].mean) }] });
        // 관련 경고 신호
        const sig = signals(E).filter(s => M.signals.includes(s.id));
        const sb = section(box, i18n('econ.disp.61', { label: M.label }));
        sb.appendChild(el(sig.length ? `<div class="econ-warn-list">${sig.map(s => `<span class="econ-warn ${s.on ? 'on econ-warn-' + s.status : ''}" title="${esc(s.on ? STATUS_WORD[s.status] : i18n('econ.disp.21'))}">${s.on ? `<i class="econ-wi econ-st-${s.status}">${C.STATUS[s.status].icon}</i>` : '○'} ${esc(s.label)}</span>`).join('')}</div>`
            : `<div class="econ-dim econ-small">${esc(i18n('econ.disp.62'))}</div>`));
        // 무엇이 움직이나 — 정책을 하나씩 바꿨을 때 1년 뒤 이 지표의 변화 (큰 순서)
        const lev = sensitivity(k, yr).sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, 6);
        const lb = section(box, i18n('econ.disp.63'), i18n('econ.disp.64', { yr: spanLabel(yr), label: M.label }));
        const mx = Math.max(1e-6, ...lev.map(r => Math.abs(r.value)));
        lb.appendChild(el(lev.length ? `<div class="econ-levers">${lev.map(r => `<div class="econ-lever"><span>${esc(r.label)}${r.sub ? ` <em class="econ-dim">${esc(r.sub)}</em>` : ''}</span>
            <i class="econ-lever-bar"><b class="${r.value >= 0 ? 'pos' : 'neg'}" style="width:${(Math.abs(r.value) / mx * 50).toFixed(1)}%;${r.value >= 0 ? 'left:50%' : `right:50%`}"></b></i><em>${sgn(r.value, 2)}${dunit}</em></div>`).join('')}</div>`
            : `<div class="econ-dim econ-small">${esc(i18n('econ.disp.65'))}</div>`));
        // 패키지 정책 — 이 지표에 듣는 것만, 1년 뒤 예상과 함께
        const used = E.pkgUsed || 0, lim = E.settings.pkgLimit;
        const base = VAR[k].get(project(null, yr));
        const pb = section(box, i18n('econ.ui.108'), i18n('econ.disp.66', { unit: UNIT_WORD[E.unit], used, lim, yr: spanLabel(yr), label: M.label, base: fmt(base) }));
        pb.appendChild(el(`<div class="econ-pkgs">${M.pkgs.map(id => {
            const after = VAR[k].get(project(PKG_INFO[id].mut, yr)), d = after - base;
            return `<button type="button" class="econ-pkg" data-pkg="${id}" ${used >= lim ? 'disabled' : ''}><b>${PKG_INFO[id].name}</b><span>${spanLabel(yr)} ${esc(i18n('econ.disp.67'))} ${esc(M.label)} ${fmt(after)} <em class="${d >= 0 ? 'up' : 'down'}">(${sgn(d, 2)}${dunit})</em> · ${STATUS_WORD[statusOf(k, after)]}</span></button>`;
        }).join('')}</div>`));
        pb.appendChild(el(`<div class="econ-actions"><button type="button" class="econ-btn econ-sm" data-act="go">${esc(M.goLabel)} ${esc(i18n('econ.disp.68'))}</button></div>`));
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
        itemDefs().forEach(d => { const g = d.group || i18n('econ.ui.117'); groups[g] = (groups[g] || 0) + (b.spend[d.id] || 0); });
        const spend = Object.entries(groups).map(([g, v]) => ({ label: groupLabel(g), value: v * G }));
        spend.push({ label: i18n('econ.disp.69'), value: b.mand.interest * G }, { label: i18n('econ.disp.70'), value: (b.mand.pension + b.mand.unemp) * G });
        spend.forEach((s, i) => { s.color = SLOT(i); });
        const tnames = Object.fromEntries(taxDefs().map(t => [t.id, t.name]));
        let rev = Object.entries(b.rev).map(([id, v]) => ({ label: tnames[id] || (id === '_tribute' ? i18n('econ.ui.162') : i18n('econ.disp.71')), value: v * G })).sort((a, b2) => b2.value - a.value);
        if (rev.length > 6) { const rest = rev.slice(5); rev = rev.slice(0, 5).concat([{ label: i18n('econ.ui.117'), value: sum(rest.map(r => r.value)) }]); }
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
        const fmean = k => (fc[k] ? [{ id: k + 'f', label: i18n('econ.disp.72', { label: VAR[k].label }), color: VAR[k].color, dash: true, width: 1.5, values: Array(n - 1).fill(null).concat([VAR[k].get(E)], fc[k].mean) }] : []);
        mods.forEach(m => {
            if (m === 'cycleP') {
                const b = section(box, i18n('econ.ui.82'), i18n('econ.disp.73'));
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, overview: { series: S1('growth') }, panels: [
                    { title: i18n('econ.disp.74'), unit: '%', zero: true, series: [S1('growth')].concat(fmean('growth')), fan: fanOf('growth') },
                    { title: i18n('econ.disp.75'), unit: '%', series: [S1('unemp')] },
                    { title: i18n('econ.disp.76'), unit: '%', series: [S1('infl')], log: E.ui.log },
                    { title: i18n('econ.disp.77'), unit: '%', series: [S1('rate'), S1('yield')] },
                ] });
            }
            if (m === 'decompG') {
                const b = section(box, i18n('econ.ui.68'), i18n('econ.disp.78', { unit: UNIT_WORD[E.unit] }));
                const g = k => padF(H.map(hh => (hh.dec ? hh.dec.g[k] : null)));
                C.stackBars(b, { x: xs, t: ts, range: [range[0], range[1]], unit: '%p', net: { label: i18n('econ.disp.79'), values: padF(col(hh => hh.n.gq ?? hh.n.growth)) }, parts: [
                    { id: 'pot', label: i18n('econ.disp.80'), color: 'var(--s1)', values: g('pot') }, { id: 'fiscal', label: i18n('econ.disp.81'), color: 'var(--s2)', values: g('fiscal') },
                    { id: 'monetary', label: i18n('econ.disp.82'), color: 'var(--s3)', values: g('monetary') }, { id: 'money', label: i18n('econ.disp.83'), color: 'var(--s4)', values: g('money') },
                    { id: 'fx', label: i18n('econ.disp.84'), color: 'var(--s5)', values: g('fx') }, { id: 'tax', label: i18n('econ.disp.85'), color: 'var(--s6)', values: g('tax') }, { id: 'noise', label: i18n('econ.disp.86'), color: 'var(--s7)', values: g('noise') }, { id: 'event', label: i18n('econ.disp.87'), color: 'var(--s8)', values: g('event') },
                ] });
            }
            if (m === 'inflP') {
                const b = section(box, i18n('econ.def.25'), i18n('econ.disp.88'));
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, overview: { series: S1('infl') }, panels: [
                    { title: i18n('econ.disp.76'), unit: '%', series: [S1('infl')].concat(fmean('infl')), fan: fanOf('infl'), log: E.ui.log },
                    { title: i18n('econ.disp.89'), unit: '%', series: [{ id: 'm', label: i18n('econ.disp.90'), color: 'var(--s4)', values: padF(col(hh => hh.n.print * 4)) }], log: E.ui.log },
                    { title: i18n('econ.disp.91'), unit: '', series: [S1('cur')] },
                ] });
            }
            if (m === 'decompP') {
                const b = section(box, i18n('econ.ui.70'), i18n('econ.disp.92'));
                const g = k => padF(H.map(hh => (hh.dec ? hh.dec.p[k] : null)));
                C.stackBars(b, { x: xs, t: ts, range: [range[0], range[1]], unit: '%p', net: { label: i18n('econ.def.25'), values: padF(col(hh => hh.n.infl)) }, parts: [
                    { id: 'exp', label: i18n('econ.disp.93'), color: 'var(--s1)', values: g('exp') }, { id: 'gap', label: i18n('econ.disp.94'), color: 'var(--s2)', values: g('gap') },
                    { id: 'money', label: i18n('econ.disp.95'), color: 'var(--s3)', values: g('money') }, { id: 'imp', label: i18n('econ.disp.96'), color: 'var(--s4)', values: g('imp') },
                    { id: 'other', label: i18n('econ.disp.97'), color: 'var(--s5)', values: g('other') }, { id: 'adj', label: i18n('econ.disp.98'), color: 'var(--s7)', values: g('adj') },
                ] });
            }
            if (m === 'traj') {
                const b = section(box, i18n('econ.disp.99'), i18n('econ.disp.100', { unit: UNIT_WORD[E.unit] }));
                C.trajectory(b, { points: H.map(hh => ({ x: hh.n.unemp, y: hh.n.infl, label: hh.label })), xLabel: i18n('econ.disp.75'), yLabel: i18n('econ.disp.76'), range });
            }
            if (m === 'debt') {
                const b = section(box, i18n('econ.disp.101'), i18n('econ.disp.102'));
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, overview: { series: S1('debt') }, panels: [
                    { title: i18n('econ.disp.103'), unit: '%', series: [S1('debt')].concat(fmean('debt')), fan: fanOf('debt') },
                    { title: i18n('econ.disp.104'), unit: '%p', zero: true, series: [{ id: 'rg', label: 'r − g', color: 'var(--s7)', values: padF(col(hh => hh.n.yield - (hh.n.growth + hh.n.infl))) }] },
                    { title: i18n('econ.disp.105'), unit: '%', zero: true, series: [{ id: 'pb', label: i18n('econ.disp.106'), color: 'var(--s6)', values: padF(col(hh => hh.n.balance + (hh.bud?.mand?.interest || 0))) }] },
                ] });
            }
            if (m === 'rates') {
                const b = section(box, i18n('econ.disp.107'), i18n('econ.disp.108'));
                C.panels(b, { x: xs, t: ts, range: rng2, markers, shade, onRange, panels: [
                    { title: i18n('econ.disp.77'), unit: '%', series: [S1('rate'), S1('yield')] },
                    { title: i18n('econ.disp.109'), unit: '%p', zero: true, series: [{ id: 'prem', label: i18n('econ.disp.110'), color: 'var(--s8)', values: padF(col(hh => hh.n.yield - hh.n.rate)) }] },
                ] });
            }
            if (m === 'sankey') {
                const b = section(box, i18n('econ.disp.111', { unit: unitText() }), i18n('econ.disp.112'));
                C.sankey(b, sankeySpec());
            }
            if (m === 'spendStack') {
                const b = section(box, i18n('econ.ui.75'), i18n('econ.disp.113'));
                const groups = [...new Set(itemDefs().map(d => d.group || i18n('econ.ui.117')))];
                const parts = groups.map((g, i) => ({ id: g, label: groupLabel(g), color: SLOT(i), values: padF(H.map(hh => sum(itemDefs().filter(d => (d.group || i18n('econ.ui.117')) === g).map(d => hh.bud?.spend?.[d.id] || 0)))) }));
                parts.push({ id: 'mand', label: i18n('econ.ui.153'), color: SLOT(groups.length), values: padF(H.map(hh => sum(Object.values(hh.bud?.mand || {})))) });
                C.stackBars(b, { x: xs, t: ts, range: [range[0], range[1]], unit: '%', net: { label: i18n('econ.ui.126'), values: padF(col(hh => hh.n.rev)) }, parts: parts.slice(0, 8) });
            }
            if (m === 'scatter') renderScatterTo(section(box, i18n('econ.ui.76'), i18n('econ.disp.114')));
            if (m === 'map') renderMapTo(section(box, i18n('econ.disp.115', { mapBy: MAP_BY[E.ui.mapBy] })));
            if (m === 'tornado') {
                const v = E.ui.target, hz = Number(E.ui.horizon) || 4;
                const b = section(box, i18n('econ.disp.116', { label: VAR[v].label }), i18n('econ.disp.117', { hz: spanLabel(hz), label: VAR[v].label }));
                C.tornado(b, { rows: sensitivity(v, hz), unit: VAR[v].unit === '%' ? '%p' : '', decimals: 2 });
            }
            if (m === 'fan') {
                const v = E.ui.target, b = section(box, i18n('econ.disp.118', { label: VAR[v].label }), i18n('econ.disp.119'));
                C.lines(b, { x: xs, t: ts, series: [S1(v)].concat(fmean(v)), fan: fanOf(v), unit: VAR[v].unit, zero: v === 'growth' || v === 'balance', markers, shade, range: rng2, height: 240 });
            }
            if (m === 'assets') {
                const b = section(box, i18n('econ.ui.80'), i18n('econ.disp.120'));
                const ad = assetDefs().slice(0, 8);
                C.lines(b, { x, t, series: ad.map((a, i) => ({ id: a.id, label: a.name, color: SLOT(i), values: col(hh => hh.a?.[a.id]) })), unit: '', range, markers, height: 240 });
                C.legend(b, ad.map((a, i) => ({ label: a.name, color: SLOT(i) })));
            }
            if (m === 'table') {
                const b = section(box, i18n('econ.ui.81'), i18n('econ.disp.121'));
                const spec = tableSpec(); spec.rows = spec.rows.slice().reverse();
                C.table(b, spec);
            }
        });
        if (!mods.length) box.appendChild(el(`<div class="econ-dim">${esc(i18n('econ.disp.122'))}</div>`));
    }
    function sankeySpec() {
        const { b } = budgetPies(), G = E.nat.gdp / 100;
        const tnames = Object.fromEntries(taxDefs().map(t => [t.id, t.name]));
        const col0 = Object.entries(b.rev).filter(([, v]) => v > 0).sort((a, b2) => b2[1] - a[1]).map(([id, v], i) => ({ id: 'r_' + id, label: tnames[id] || (id === '_tribute' ? i18n('econ.ui.162') : i18n('econ.disp.71')), value: v * G, color: REV(i) }));
        const deficit = Math.max(0, -E.nat.balance) * G, surplus = Math.max(0, E.nat.balance) * G;
        if (deficit > 0) col0.push({ id: 'r_debt', label: i18n('econ.disp.123'), value: deficit, color: 'var(--critical)' });
        const total = sum(col0.map(n => n.value));
        const col1 = [{ id: 'treasury', label: i18n('econ.disp.124'), value: total, color: 'var(--econ-ink2)' }];
        const groups = {};
        itemDefs().forEach(d => { const g = d.group || i18n('econ.ui.117'); (groups[g] = groups[g] || []).push(d); });
        const gEntries = Object.entries(groups);
        const col2 = gEntries.map(([g, ds], i) => ({ id: 'g_' + g, label: groupLabel(g), value: sum(ds.map(d => (b.spend[d.id] || 0) * G)), color: SLOT(i) }));
        col2.push({ id: 'g_mand', label: i18n('econ.ui.153'), value: sum(Object.values(b.mand)) * G, color: SLOT(gEntries.length) });
        if (surplus > 0) col2.push({ id: 'g_res', label: i18n('econ.disp.125'), value: surplus, color: 'var(--good)' });
        const col3 = [];
        gEntries.forEach(([g, ds], i) => ds.forEach(d => { const v = (b.spend[d.id] || 0) * G; if (v > 0) col3.push({ id: 'i_' + d.id, label: d.name, value: v, color: SLOT(i), g: 'g_' + g }); }));
        [['interest', i18n('econ.disp.69')], ['pension', i18n('econ.disp.126')], ['unemp', i18n('econ.disp.127')]].forEach(([k, l]) => { const v = (b.mand[k] || 0) * G; if (v > 0) col3.push({ id: 'm_' + k, label: l, value: v, color: SLOT(gEntries.length), g: 'g_mand' }); });
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
        const wrap = document.createElement('div'); wrap.className = 'econ-map'; wrap.id = 'econMapWrap'; body.appendChild(wrap);
        if (distList()[0] === '__nation' || typeof renderDistrictSvgInto !== 'function') { wrap.textContent = i18n('econ.disp.128'); return; }
        const fmt = k => { const v = regionMetric(k); return E.ui.mapBy === 'industry' ? [i18n('econ.ui.189'), i18n('econ.ui.190'), i18n('econ.ui.191')][v] : E.ui.mapBy === 'gdppc' ? i18n('econ.disp.129', { v: v.toFixed(0) }) : E.ui.mapBy === 'income' ? i18n('econ.disp.130', { v: v.toFixed(1) }) : `${MAP_BY[E.ui.mapBy]} ${v.toFixed(1)}`; };
        renderDistrictSvgInto(wrap, { chamber: 'house', getFill: k => (E.dist[k] && !excludedKey(k) ? regionFill(k) : null), title: k => (E.dist[k] && !excludedKey(k) ? `${nameOf(k)} — ${fmt(k)}` : nameOf(k)), clickable: false, noZoom: true });
        const lg = E.ui.mapBy === 'industry' ? [[i18n('econ.ui.189'), 'var(--s6)'], [i18n('econ.ui.190'), 'var(--s1)'], [i18n('econ.ui.191'), 'var(--s2)']] : E.ui.mapBy === 'mood' ? [[i18n('econ.disp.131'), DIV[0]], [i18n('econ.event.11'), DIV[3]], [i18n('econ.disp.132'), DIV[6]]] : [[i18n('econ.disp.57'), RAMP[0]], ['', RAMP[3]], [i18n('econ.disp.56'), RAMP[6]]];
        C.legend(body, lg.map(([l, c]) => ({ label: l, color: c })));
    }
    function renderScatterTo(body) {
        const keys = distList().filter(k => k !== '__nation');
        if (!keys.length) { body.textContent = i18n('econ.disp.133'); return; }
        const P = sum(keys.map(k => E.dist[k].pop)) || 1;
        C.scatter(body, {
            xLabel: i18n('econ.ui.179'), xUnit: i18n('econ.disp.134'), yLabel: i18n('econ.forecast.2'), yUnit: '%', height: 320,
            points: keys.map(k => { const d = E.dist[k]; return { id: k, x: d.gdp / E.nat.gdp / (d.pop / P) * 100, y: d.unemp, size: d.pop, color: moodColor(d.mood), label: nameOf(k), extra: [{ value: d.mood.toFixed(0), label: i18n('econ.def.26') }, { value: d.income.toFixed(1), label: i18n('econ.ui.180') }, { value: (d.pop).toLocaleString(), label: i18n('econ.disp.135') }] }; }),
            legendItems: [{ label: i18n('econ.disp.136'), color: DIV[0] }, { label: i18n('econ.event.11'), color: DIV[3] }, { label: i18n('econ.disp.132'), color: DIV[6] }],
            onClick: k => { E.ui.openDist = k; switchSubTab('economy', 'region'); },
        });
    }
    function renderRegionDisp(box) {
        renderMapTo(section(box, i18n('econ.disp.115', { mapBy: MAP_BY[E.ui.mapBy] }), i18n('econ.disp.137')));
        renderScatterTo(section(box, i18n('econ.ui.76'), i18n('econ.disp.138')));
        const keys = distList().filter(k => k !== '__nation');
        if (keys.length) {
            const P = sum(keys.map(k => E.dist[k].pop)) || 1;
            const b = section(box, i18n('econ.disp.139'));
            C.table(b, { cols: [{ key: 'name', label: i18n('econ.disp.140') }, { key: 'pc', label: i18n('econ.ui.179'), fmt: v => v.toFixed(0) }, { key: 'u', label: i18n('econ.forecast.2'), fmt: v => v.toFixed(1) + '%' }, { key: 'm', label: i18n('econ.def.26'), fmt: v => v.toFixed(0) }, { key: 'inc', label: i18n('econ.disp.141'), fmt: v => v.toFixed(1) }, { key: 'ind', label: i18n('econ.disp.142') }],
                rows: keys.map(k => { const d = E.dist[k]; return { name: nameOf(k), pc: d.gdp / E.nat.gdp / (d.pop / P) * 100, u: d.unemp, m: d.mood, inc: d.income, ind: d.ind.map(v => Math.round(v * 100)).join(' · ') }; }).sort((a, b2) => b2.pc - a.pc) });
        }
    }
    function tableSpec() {
        const f = d => v => (Number.isFinite(v) ? v.toFixed(d) : '');
        return {
            filename: `economy_${(E.hist[0]?.label || 'T0').replace(/\s+/g, '')}-${(E.hist[E.hist.length - 1]?.label || '').replace(/\s+/g, '')}.csv`,
            cols: [{ key: 'label', label: i18n('econ.disp.143') }, { key: 'gdp', label: `GDP(${unitText()})`, fmt: f(0), raw: v => Math.round(v) }, { key: 'growth', label: i18n('econ.disp.144'), fmt: f(2), raw: r2 }, { key: 'infl', label: i18n('econ.disp.145'), fmt: f(2), raw: r2 },
                { key: 'unemp', label: i18n('econ.disp.146'), fmt: f(2), raw: r2 }, { key: 'rate', label: i18n('econ.disp.147'), fmt: f(2), raw: r2 }, { key: 'yield', label: i18n('econ.disp.148'), fmt: f(2), raw: r2 }, { key: 'debt', label: i18n('econ.disp.149'), fmt: f(1), raw: r2 },
                { key: 'balance', label: i18n('econ.disp.150'), fmt: f(2), raw: r2 }, { key: 'cur', label: i18n('econ.forecast.7'), fmt: f(1), raw: r2 }, { key: 'conf', label: i18n('econ.def.27'), fmt: f(1), raw: r2 }, { key: 'mood', label: i18n('econ.def.26'), fmt: f(1), raw: r2 }, { key: 'ev', label: i18n('econ.ui.265') }],
            rows: E.hist.map(h => ({ label: h.label, ...h.n, ev: (h.ev || []).map(evText).join(' / ') })),
        };
    }

    // ================= 우클릭 내보내기 (경제 그래프 · 경제 시각 탭 전체) =================
    // 그래프 위에서 우클릭하면 그 그래프만, 그 밖(계기 · 금액 카드 · 경고 신호 · 빈 곳)에서 우클릭하면 지금 보이는 경제 화면 전체
    document.addEventListener('contextmenu', e => {
        const disp = e.target.closest && e.target.closest('#econDisp');
        if (!disp) return;
        const svg = e.target.closest('svg.econ-svg');
        const target = svg || disp;
        e.preventDefault(); e.stopPropagation();
        target.dataset.exportKind = svg ? 'econchart' : 'econpanel';
        try { canvasExportTarget = target; } catch (err) { return; } // eslint-disable-line no-undef
        const menu = document.getElementById('canvasExportMenu');
        if (!menu) return;
        menu.style.display = 'block';
        try { positionFloatingBox(menu, e.clientX, e.clientY); } catch (err) { menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; } // eslint-disable-line no-undef
    }, true);
    // 툴바 "📷 사진" — 빈 곳 우클릭과 같은 경제 시각 화면 전체 내보내기를 바로 연다
    function exportDispPhoto() {
        const disp = document.getElementById('econDisp'); if (!disp) return;
        disp.dataset.exportKind = 'econpanel';
        try { canvasExportTarget = disp; } catch (e) { return; } // eslint-disable-line no-undef
        if (typeof window.openExportDialog === 'function') window.openExportDialog();
    }
    const origOpenExport = window.openExportDialog;
    if (typeof origOpenExport === 'function') {
        window.openExportDialog = function () {
            const r = origOpenExport.apply(this, arguments);
            try { if (String(canvasExportTarget?.dataset?.exportKind || '').startsWith('econ')) { const sec = document.getElementById('exportHeaderStatsSection'); if (sec) sec.style.display = 'none'; } } catch (e) { /* 없음 */ } // eslint-disable-line no-undef
            return r;
        };
    }
    const origExportAt = window.exportVisualElementAt;
    if (typeof origExportAt === 'function') {
        window.exportVisualElementAt = function (target, includeStats, format) {
            if (String(target?.dataset?.exportKind || '').startsWith('econ')) return econExport(target, format);
            return origExportAt.apply(this, arguments);
        };
    }
    function dl(href, name) { const a = document.createElement('a'); a.href = href; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
    const surfaceOf = el => {
        for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const bg = getComputedStyle(e).backgroundColor; if (bg && !isClear(bg)) return bg; }
        return getComputedStyle(el.closest('.econ-viz') || document.body).getPropertyValue('--econ-surface').trim() || '#fff';
    };
    const isClear = c => !c || c === 'transparent' || /^rgba\(.*,\s*0\)$/.test(c);
    const attr = v => String(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    // 그래프 하나를 자리(x · y · 폭 · 높이)에 맞춘 <svg>로 — 색은 실제 값으로 (C.exportSvgString)
    function placedSvg(svg, x, y, w, h, op) {
        const node = new DOMParser().parseFromString(C.exportSvgString(svg), 'image/svg+xml').documentElement;
        if (!node.getAttribute('viewBox')) node.setAttribute('viewBox', `0 0 ${svg.clientWidth || w} ${svg.clientHeight || h}`);
        node.setAttribute('x', x); node.setAttribute('y', y); node.setAttribute('width', w); node.setAttribute('height', h);
        if (op < 1) node.setAttribute('opacity', op);
        node.removeAttribute('style');
        return new XMLSerializer().serializeToString(node);
    }
    // 경제 시각 탭 전체를 SVG 한 장으로 — 계기 · 카드 · 막대처럼 HTML로 그린 부분은 상자(배경 · 테두리)와 글자로 옮기고, 그래프는 그대로 끼워 넣는다.
    // 스크롤로 가려진 아래쪽까지 전부 담는다 (안쪽 스크롤 칸 — 표 등 — 은 보이는 만큼만)
    function panelSvg(root) {
        const R = root.getBoundingClientRect();
        const ox = R.left - root.scrollLeft, oy = R.top - root.scrollTop;
        const W = Math.ceil(root.scrollWidth), H = Math.ceil(root.scrollHeight);
        const out = [`<rect x="0" y="0" width="${W}" height="${H}" fill="${attr(surfaceOf(root))}"/>`];
        const range = document.createRange();
        // 안쪽 스크롤 칸 밖으로 밀려 안 보이는 것은 뺀다
        const clipOf = el => { for (let e = el.parentElement; e && e !== root; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible') return e.getBoundingClientRect(); } return null; };
        const inside = (r, c) => !c || (r.right > c.left && r.left < c.right && r.bottom > c.top && r.top < c.bottom);
        const box = (r, cs, op) => {
            const x = r.left - ox, y = r.top - oy, rx = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.width / 2, r.height / 2);
            const sides = ['Top', 'Right', 'Bottom', 'Left'].map(s => ({ w: parseFloat(cs[`border${s}Width`]) || 0, c: cs[`border${s}Color`], st: cs[`border${s}Style`] }))
                .map(b => (b.w > 0 && b.st !== 'none' && b.st !== 'hidden' && !isClear(b.c) ? b : null));
            const uniform = sides.every(b => b && b.w === sides[0].w && b.c === sides[0].c);
            const bg = cs.backgroundColor, fill = isClear(bg) ? 'none' : bg;
            const dash = b => (b && b.st === 'dashed' ? ` stroke-dasharray="${b.w * 3} ${b.w * 2}"` : b && b.st === 'dotted' ? ` stroke-dasharray="${b.w} ${b.w * 1.5}"` : '');
            const o = op < 1 ? ` opacity="${op}"` : '';
            if (fill !== 'none' || uniform) {
                const b = uniform ? sides[0] : null, inset = b ? b.w / 2 : 0;
                out.push(`<rect x="${x + inset}" y="${y + inset}" width="${Math.max(0, r.width - inset * 2)}" height="${Math.max(0, r.height - inset * 2)}" rx="${rx}" fill="${attr(fill)}"${b ? ` stroke="${attr(b.c)}" stroke-width="${b.w}"${dash(b)}` : ''}${o}/>`);
            }
            if (!uniform) {
                const [t, rt, bt, lt] = sides, line = (b, x1, y1, x2, y2) => b && out.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${attr(b.c)}" stroke-width="${b.w}"${dash(b)}${o}/>`);
                line(t, x, y + (t?.w || 0) / 2, x + r.width, y + (t?.w || 0) / 2);
                line(bt, x, y + r.height - (bt?.w || 0) / 2, x + r.width, y + r.height - (bt?.w || 0) / 2);
                line(lt, x + (lt?.w || 0) / 2, y, x + (lt?.w || 0) / 2, y + r.height);
                line(rt, x + r.width - (rt?.w || 0) / 2, y, x + r.width - (rt?.w || 0) / 2, y + r.height);
            }
        };
        const text = (n, cs, op, clip, first) => {
            const raw = n.nodeValue;
            // ::first-letter 색(계기 아래 "● 안전"의 점처럼) — 첫 글자만 따로 그 색으로
            if (first) {
                const i = raw.search(/\S/);
                range.setStart(n, i); range.setEnd(n, i + 1);
                const fr = range.getClientRects()[0];
                if (fr && inside(fr, clip)) out.push(`<text x="${fr.left - ox}" y="${fr.top + fr.height / 2 + (parseFloat(cs.fontSize) || 12) * 0.36 - oy}" font-size="${parseFloat(cs.fontSize) || 12}" font-weight="${attr(cs.fontWeight)}" fill="${attr(first)}"${op < 1 ? ` fill-opacity="${op}"` : ''}>${attr(raw[i])}</text>`);
                const rest = raw.slice(i + 1);
                if (!rest.trim()) return;
                range.setStart(n, i + 1); range.setEnd(n, raw.length);
                const rr = [...range.getClientRects()].filter(r => r.width > 0);
                if (rr.length === 1) { const r = rr[0], size = parseFloat(cs.fontSize) || 12; if (inside(r, clip)) out.push(`<text x="${r.left - ox + (rest.length - rest.trimStart().length ? size * 0.28 : 0)}" y="${r.top + r.height / 2 + size * 0.36 - oy}" font-size="${size}" font-weight="${attr(cs.fontWeight)}" fill="${attr(cs.color)}"${op < 1 ? ` fill-opacity="${op}"` : ''}>${attr(rest.trim())}</text>`); return; }
            }
            range.selectNodeContents(n);
            const rects = [...range.getClientRects()].filter(r => r.width > 0);
            if (!rects.length) return;
            // 한 줄이면 통째로, 여러 줄로 감겼으면 글자마다 자리를 재서 줄별로 나눈다
            let lines;
            if (rects.length === 1) {
                // 앞쪽 공백은 빼고 첫 글자 자리에서 시작 (공백 폭만큼 왼쪽으로 붙지 않게)
                const i = raw.search(/\S/);
                range.setStart(n, i); range.setEnd(n, raw.length);
                const fr = [...range.getClientRects()].filter(r => r.width > 0)[0] || rects[0];
                lines = [{ r: fr, t: raw.replace(/\s+/g, ' ').trim() }];
            }
            else {
                lines = [];
                for (let i = 0; i < raw.length; i++) {
                    range.setStart(n, i); range.setEnd(n, i + 1);
                    const cr = range.getClientRects()[0];
                    if (!cr) continue;
                    const last = lines[lines.length - 1];
                    if (last && Math.abs(cr.top - last.r.top) < 2) last.t += raw[i];
                    else lines.push({ r: cr, t: raw[i] });
                }
                lines.forEach(l => { l.t = l.t.replace(/\s+/g, ' ').trim(); });
            }
            const size = parseFloat(cs.fontSize) || 12;
            lines.forEach(l => {
                if (!l.t || !inside(l.r, clip)) return;
                const y = l.r.top + l.r.height / 2 + size * 0.36 - oy;
                out.push(`<text x="${l.r.left - ox}" y="${y}" font-size="${size}" font-weight="${attr(cs.fontWeight)}" fill="${attr(cs.color)}"${op < 1 ? ` fill-opacity="${op}"` : ''}${parseFloat(cs.letterSpacing) ? ` letter-spacing="${parseFloat(cs.letterSpacing)}"` : ''}>${attr(l.t)}</text>`);
            });
        };
        const walk = (el, opIn) => {
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden') return;
            const op = opIn * (parseFloat(cs.opacity) || (cs.opacity === '0' ? 0 : 1));
            if (op <= 0) return;
            const r = el.getBoundingClientRect(), clip = clipOf(el);
            if (!inside(r, clip) && r.width > 0) return;
            if (el.tagName.toLowerCase() === 'svg') { if (r.width > 0 && r.height > 0) out.push(placedSvg(el, r.left - ox, r.top - oy, r.width, r.height, op)); return; }
            if (el !== root && r.width > 0 && r.height > 0) box(r, cs, op);
            const fl = getComputedStyle(el, '::first-letter').color;
            let firstColor = fl && fl !== cs.color ? fl : null;
            el.childNodes.forEach(n => {
                if (n.nodeType === 3 && n.nodeValue.trim()) { text(n, cs, op, clip, firstColor); firstColor = null; }
                else if (n.nodeType === 1) walk(n, op);
            });
        };
        walk(root, 1);
        const P = 16, bg = out.shift(); // 가장자리에 여백
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W + P * 2}" height="${H + P * 2}" viewBox="0 0 ${W + P * 2} ${H + P * 2}" font-family="${attr((window.HemiExportKit && HemiExportKit.font) || 'sans-serif')}">`
            + `${bg.replace(`width="${W}" height="${H}"`, `width="${W + P * 2}" height="${H + P * 2}"`)}<g transform="translate(${P},${P})">${out.join('')}</g></svg>`;
    }
    async function econExport(target, format) {
        const kit = window.HemiExportKit;
        if (kit) await kit.prepareFont();
        const panel = target.dataset.exportKind === 'econpanel';
        let text;
        if (panel) text = panelSvg(target);
        else {
            // 그래프 하나 — 바탕색을 깔아 그 자리 크기 그대로
            const r = target.getBoundingClientRect(), w = Math.ceil(r.width) || 600, h = Math.ceil(r.height) || 300;
            text = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${attr((kit && kit.font) || 'sans-serif')}"><rect width="${w}" height="${h}" fill="${attr(surfaceOf(target))}"/>${placedSvg(target, 0, 0, w, h, 1)}</svg>`;
        }
        const stamp = (typeof formatKstTimestampCompact === 'function') ? formatKstTimestampCompact() : Date.now().toString(36); // eslint-disable-line no-undef
        const name = panel ? `economy_${E.ui.view || 'overview'}_${stamp}` : `economy_chart_${stamp}`;
        if (format === 'svg') { const url = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml;charset=utf-8' })); dl(url, `${name}.svg`); setTimeout(() => URL.revokeObjectURL(url), 2000); return; }
        const scale = (typeof exportScale !== 'undefined' && [1, 2, 3].includes(exportScale)) ? exportScale : 2; // eslint-disable-line no-undef
        let c;
        if (kit) c = await kit.rasterize(text, scale, format === 'jpg');
        else {
            const img = new Image();
            img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
            await img.decode();
            const doc = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
            c = document.createElement('canvas'); c.width = Number(doc.getAttribute('width')) * scale; c.height = Number(doc.getAttribute('height')) * scale;
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        }
        dl(c.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95), `${name}.${format}`);
    }

    // ================= 총선 표시 (그래프 깃발) =================
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') {
        window.elecApplyToParliament = function () {
            const r = origApply.apply(this, arguments);
            if (inited) { const ev = addEvent('election', i18n.ref('econ.elect.1')); if (E.hist.length) E.hist[E.hist.length - 1].ev.push({ ...ev }); }
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
            st.economy = c;
        }
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        loadState(state && (state.economy || state.teaser69));
        document.body.classList.remove('econ-full');
        try { if (typeof currentMainTab !== 'undefined' && currentMainTab === 'economy') renderTab(curSub()); } catch (e) { /* 없음 */ } // eslint-disable-line no-undef
        renderDisp();
        return r;
    };

    window.HemiEconomy = {
        get state() { return E; }, ensureInit, runTurns, nextTurn, step, forecast, sensitivity, predictVotes, submitBudget, checkBudgetBill, fillPredicted,
        newEconomy: id => { newEconomy(id); inited = true; refreshAll(); }, usePackage, ratingOf: () => ratingOf(E), statusOf, signals: () => signals(E), budget: () => budgetOf(E, E.nat, distList()),
        setValue, showDisp, toggleFull, refresh: refreshAll,
    };

    // ================= 모양 =================
    const style = document.createElement('style');
    style.textContent = `
        .econ-content { --econ-line: #333; --econ-soft: rgba(255,255,255,.03); --econ-dim2: #888; --econ-text: #ddd; --econ-acc: var(--tno-neon); --econ-acc-ink: #000;
            --good: #0ca30c; --warning: #fab219; --serious: #ec835a; --critical: #d03b3b; --pos: #3987e5; --neg: #e66767; }
        html[data-theme-family="modern"] .econ-content { --econ-line: var(--m-border); --econ-soft: var(--m-surface-2); --econ-dim2: var(--m-text-3); --econ-text: var(--m-text); --econ-acc: var(--m-accent); --econ-acc-ink: var(--m-on-accent, #fff); }
        .econ-intro { color: var(--econ-dim2); font-size: .78rem; line-height: 1.6; margin: 6px 0 10px; }
        .econ-dim { color: var(--econ-dim2); } .econ-small { font-size: .72rem; line-height: 1.5; margin-top: 4px; }
        .econ-card { border: 1px solid var(--econ-line); background: var(--econ-soft); padding: 10px; margin-bottom: 10px; }
        html[data-theme-family="modern"] .econ-card { border-radius: 12px; }
        .econ-card-h { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; color: var(--econ-text); font-size: .88rem; margin-bottom: 8px; }
        .econ-card-h b { margin-left: auto; font-variant-numeric: tabular-nums; }
        .econ-btn { cursor: pointer; font-family: inherit; font-size: .82rem; padding: 7px 11px; background: transparent; border: 1px solid var(--econ-line); color: var(--econ-text); }
        html[data-theme-family="modern"] .econ-btn { border-radius: 8px; }
        .econ-btn:hover:not(:disabled) { border-color: var(--econ-acc); color: var(--econ-acc); }
        .econ-btn.econ-primary { border-color: var(--econ-acc); color: var(--econ-acc); }
        html[data-theme-family="modern"] .econ-btn.econ-primary { background: var(--econ-acc); color: var(--econ-acc-ink); }
        .econ-btn:disabled { opacity: .4; cursor: default; }
        .econ-btn.econ-sm { font-size: .72rem; padding: 3px 8px; }
        .econ-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; align-items: center; }
        .econ-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: .8rem; color: var(--econ-text); margin: 6px 0; }
        .econ-check { display: flex; align-items: flex-start; gap: 6px; font-size: .8rem; color: var(--econ-text); margin: 6px 0; line-height: 1.45; cursor: pointer; }
        .econ-check input { margin-top: 3px; }
        .econ-num { width: 72px; } .econ-segs { width: 150px; }
        .econ-content input[type="range"] { width: 100%; }
        .econ-top { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 10px; align-items: center; margin-bottom: 10px; }
        .econ-rating { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 64px; padding: 6px 8px; border: 2px solid currentColor; color: var(--good); }
        html[data-theme-family="modern"] .econ-rating { border-radius: 12px; }
        .econ-rating b { font-size: 1.35rem; letter-spacing: 1px; line-height: 1.1; } .econ-rating span { font-size: .62rem; opacity: .9; white-space: nowrap; }
        .econ-rating em { font-style: normal; font-size: .62rem; opacity: .75; margin-top: 2px; }
        .econ-grade-b { color: var(--warning); } .econ-grade-c { color: var(--critical); }
        .econ-turn-now { font-size: 1rem; color: var(--econ-text); font-weight: 600; }
        .econ-turninfo .econ-dim { font-size: .74rem; } #contentEcoOverview .econ-turninfo select { font-size: .74rem; width: auto; min-width: 0; padding: 2px 6px; height: auto; display: inline-block; }
        .econ-next { white-space: nowrap; font-size: .9rem; padding: 10px 12px; }
        .econ-sys { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 6px 8px; align-items: center; font-size: .78rem; color: var(--econ-dim2); }
        .econ-sys b { grid-column: 1 / -1; text-align: center; color: var(--econ-text); font-weight: 600; font-size: .82rem; }
        .econ-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 10px 0; }
        .econ-kpi { display: grid; grid-template-columns: minmax(0,1fr) auto; grid-template-rows: auto auto; gap: 0 6px; text-align: left; cursor: pointer; font-family: inherit; padding: 8px 9px; border: 1px solid var(--econ-line); background: var(--econ-soft); color: var(--econ-text); }
        html[data-theme-family="modern"] .econ-kpi { border-radius: 10px; }
        .econ-kpi:hover { border-color: var(--econ-acc); }
        .econ-kpi-l { font-size: .7rem; color: var(--econ-dim2); grid-column: 1 / -1; }
        .econ-kpi b { font-size: 1.05rem; font-variant-numeric: tabular-nums; } .econ-kpi-d { font-size: .68rem; color: var(--econ-dim2); align-self: center; }
        .econ-kpi .econ-st { grid-column: 1 / -1; }
        .econ-st { font-size: .66rem; display: inline-flex; align-items: center; gap: 3px; color: var(--econ-dim2); font-style: normal; } .econ-st em { font-style: normal; }
        .econ-st-good { color: var(--good); } .econ-st-warning { color: var(--warning); } .econ-st-serious { color: var(--serious); } .econ-st-critical { color: var(--critical); }
        .econ-st em { color: var(--econ-dim2); }
        .econ-signals, .econ-sigrow { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 10px; font-size: .76rem; }
        .econ-signal { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border: 1px solid var(--econ-line, var(--econ-grid)); color: var(--econ-text, var(--econ-ink)); }
        html[data-theme-family="modern"] .econ-signal { border-radius: 999px; }
        .econ-alert { border: 1px solid var(--critical); background: color-mix(in srgb, var(--critical) 10%, transparent); color: var(--econ-text); padding: 8px 10px; margin: 8px 0; font-size: .8rem; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; line-height: 1.5; }
        html[data-theme-family="modern"] .econ-alert { border-radius: 10px; }
        .econ-alert > div { flex-basis: 100%; }
        .econ-fc { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .78rem; color: var(--econ-dim2); } .econ-fc b { color: var(--econ-text); font-variant-numeric: tabular-nums; }
        .econ-settings summary, .econ-content details > summary { cursor: pointer; color: var(--econ-text); font-size: .85rem; }
        .econ-lock { font-size: .72rem; color: var(--warning); margin-top: 4px; }
        .econ-bands { display: flex; justify-content: space-between; gap: 4px; font-size: .62rem; color: var(--econ-dim2); flex-wrap: wrap; }
        .econ-pkgs { display: grid; gap: 6px; }
        .econ-mhead { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .econ-mcards { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px; margin-bottom: 6px; }
        .econ-mcard { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--econ-line); border-left: 4px solid var(--good); padding: 8px 10px; background: var(--econ-soft); }
        .econ-mcard-warning { border-left-color: var(--warning); } .econ-mcard-serious { border-left-color: var(--serious); } .econ-mcard-critical { border-left-color: var(--critical); }
        .econ-mcard span { font-size: .75rem; color: var(--econ-dim2); } .econ-mcard b { font-size: 1.4rem; color: var(--econ-text); } .econ-mcard small { font-size: .72rem; color: var(--econ-dim2); } .econ-mcard em { font-style: normal; font-size: .72rem; }
        html[data-theme-family="modern"] .econ-mcard { border-radius: 0 10px 10px 0; }
        .econ-levers { display: flex; flex-direction: column; gap: 4px; }
        .econ-lever { display: grid; grid-template-columns: minmax(0, 1.4fr) 1fr 4.5em; gap: 8px; align-items: center; font-size: .8rem; color: var(--econ-text); }
        .econ-lever > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .econ-lever > em { font-style: normal; text-align: right; }
        .econ-lever-bar { position: relative; height: 10px; background: var(--econ-soft); border-left: 1px solid transparent; }
        .econ-lever-bar::after { content: ''; position: absolute; left: 50%; top: -2px; bottom: -2px; width: 1px; background: var(--econ-line); }
        .econ-lever-bar b { position: absolute; top: 0; bottom: 0; } .econ-lever-bar b.pos { background: var(--pos); } .econ-lever-bar b.neg { background: var(--neg); }
        .econ-pkg em.up { color: var(--pos); font-style: normal; } .econ-pkg em.down { color: var(--neg); font-style: normal; }
        .econ-pkg { display: flex; flex-direction: column; gap: 2px; text-align: left; cursor: pointer; font-family: inherit; padding: 8px 10px; border: 1px solid var(--econ-line); background: transparent; color: var(--econ-text); }
        html[data-theme-family="modern"] .econ-pkg { border-radius: 10px; }
        .econ-pkg:hover:not(:disabled) { border-color: var(--econ-acc); } .econ-pkg:disabled { opacity: .4; cursor: default; }
        .econ-pkg span { font-size: .72rem; color: var(--econ-dim2); }
        .econ-slider { margin: 8px 0; } .econ-slider-h { display: flex; justify-content: space-between; gap: 6px; font-size: .78rem; color: var(--econ-text); }
        .econ-slider-h b { font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; } .econ-slider-h em { font-style: normal; font-size: .7rem; }
        .econ-kv { display: flex; justify-content: space-between; gap: 8px; font-size: .8rem; color: var(--econ-text); padding: 3px 0; } .econ-kv b { font-weight: 500; font-variant-numeric: tabular-nums; }
        .econ-deficit { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; color: var(--econ-text); }
        .econ-deficit b { font-size: 1.5rem; } .econ-deficit.neg b { color: var(--critical); } .econ-deficit.pos b { color: var(--good); }
        .econ-pred summary { margin-top: 8px; }
        .econ-mini { width: 100%; border-collapse: collapse; font-size: .74rem; margin-top: 6px; font-variant-numeric: tabular-nums; }
        .econ-mini th, .econ-mini td { padding: 4px 5px; border-bottom: 1px solid var(--econ-line); text-align: left; color: var(--econ-text); white-space: nowrap; }
        .econ-mini th { color: var(--econ-dim2); font-weight: 500; }
        .econ-pdot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
        .econ-v-yea { color: var(--good); } .econ-v-nay { color: var(--critical); } .econ-v-abs { color: var(--econ-dim2); }
        .econ-preview { font-size: .76rem; }
        .econ-pv-h { color: var(--econ-text); margin-bottom: 6px; }
        .econ-pv-r { display: grid; grid-template-columns: 4.5em minmax(0,1fr) auto; gap: 8px; align-items: center; margin: 4px 0; color: var(--econ-dim2); }
        .econ-pv-r b { color: var(--econ-text); font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .econ-pv-bars { display: flex; flex-direction: column; gap: 2px; }
        .econ-pv-bars i, .econ-pv-legend i { display: block; height: 5px; background: var(--econ-dim2); border-radius: 3px; min-width: 2px; }
        .econ-pv-bars i.nx, .econ-pv-legend i.nx { background: var(--pos); } .econ-pv-bars i.neg { background: var(--neg); opacity: .7; } .econ-pv-bars i.nx.neg { opacity: 1; }
        .econ-preview-big { margin: 10px 0; padding: 12px 14px; }
        .econ-preview-big .econ-pv-h { font-size: 1.05rem; margin-bottom: 10px; }
        .econ-preview-big .econ-pv-r { grid-template-columns: 6em minmax(0,1fr) auto; margin: 8px 0; font-size: .95rem; }
        .econ-preview-big .econ-pv-r b { font-size: 1.05rem; }
        .econ-preview-big .econ-pv-bars { gap: 3px; } .econ-preview-big .econ-pv-bars i { height: 9px; border-radius: 5px; }
        .econ-preview-big .econ-pv-legend { font-size: .78rem; } .econ-preview-big .econ-pv-legend i { height: 7px; }
        .econ-pv-legend { display: flex; align-items: center; gap: 6px; color: var(--econ-dim2); font-size: .68rem; margin-top: 6px; } .econ-pv-legend i { width: 14px; display: inline-block; }
        .econ-presets { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; margin-bottom: 10px; }
        .econ-preset { display: flex; flex-direction: column; gap: 3px; text-align: left; cursor: pointer; font-family: inherit; padding: 8px 10px; border: 1px solid var(--econ-line); background: var(--econ-soft); color: var(--econ-text); }
        html[data-theme-family="modern"] .econ-preset { border-radius: 10px; }
        .econ-preset span { font-size: .68rem; color: var(--econ-dim2); line-height: 1.4; }
        .econ-preset.on { border-color: var(--econ-acc); box-shadow: inset 0 0 0 1px var(--econ-acc); }
        .econ-seg { display: inline-flex; border: 1px solid var(--econ-line, var(--econ-axis)); }
        html[data-theme-family="modern"] .econ-seg { border-radius: 8px; overflow: hidden; }
        .econ-seg button { cursor: pointer; font-family: inherit; font-size: .74rem; padding: 4px 10px; background: transparent; border: none; color: var(--econ-dim2, var(--econ-muted)); }
        .econ-seg button.on { background: var(--econ-acc, var(--s1)); color: var(--econ-acc-ink, #fff); }
        .econ-seg button.econ-link { border-left: 1px dashed var(--econ-line, var(--econ-axis)); }
        .econ-dlist { display: flex; flex-direction: column; gap: 4px; }
        .econ-dist { border: 1px solid var(--econ-line); padding: 6px 8px; }
        html[data-theme-family="modern"] .econ-dist { border-radius: 8px; }
        .econ-dist summary { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2px 10px; font-size: .78rem; color: var(--econ-dim2); }
        .econ-dname { color: var(--econ-text); font-weight: 600; }
        .econ-dgrid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 6px; margin-top: 8px; }
        .econ-dgrid label { display: flex; flex-direction: column; gap: 2px; font-size: .7rem; color: var(--econ-dim2); }
        .econ-dgrid input, .econ-dgrid select { width: 100%; box-sizing: border-box; min-width: 0; }
        .econ-rule { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; font-size: .78rem; color: var(--econ-text); padding: 6px 0; border-bottom: 1px solid var(--econ-line); }
        .econ-x { cursor: pointer; background: transparent; border: none; color: var(--econ-dim2); font-size: 1rem; margin-left: auto; }
        .econ-x:hover { color: var(--critical); }
        .econ-def { padding: 6px 0; border-bottom: 1px solid var(--econ-line); } .econ-def-h { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px; font-size: .8rem; color: var(--econ-text); }
        .econ-def-h span { font-size: .7rem; } .econ-def.builtin b::after { content: ' 기본'; font-size: .62rem; color: var(--econ-dim2); font-weight: normal; }
        .econ-newdef { margin-top: 8px; } .econ-newdef .econ-btn { margin-top: 8px; }
        .econ-def-acts { margin-left: auto; display: inline-flex; gap: 2px; } .econ-def-acts .econ-x { margin-left: 0; }
        .econ-edited { font-size: .62rem; border: 1px solid var(--econ-line); padding: 0 4px; }
        .econ-defedit { margin: 6px 0 4px; padding: 8px; border: 1px dashed var(--econ-line); }
        .econ-defedit .econ-dgrid { margin-top: 0; } .econ-defedit-btns { margin-top: 8px; gap: 6px; }
        .econ-effs { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; font-size: .72rem; }
        .econ-effrow { display: flex; gap: 6px; align-items: center; } .econ-effrow select { flex: 1; min-width: 0; } .econ-effrow input { width: 80px; } .econ-effrow .econ-x { margin-left: 0; }
        .econ-effs > .econ-btn { align-self: flex-start; }
        .econ-tp-head { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; font-size: .85rem; color: var(--econ-text); }
        .econ-tp-head .econ-dim { font-size: .72rem; line-height: 1.5; }
        .econ-tp-wrap { overflow-x: auto; }
        .econ-tp { width: 100%; border-collapse: collapse; font-size: .78rem; }
        .econ-tp th { font-weight: normal; color: var(--econ-dim2); padding: 4px; text-align: center; white-space: nowrap; }
        .econ-tp td { padding: 3px; border-top: 1px solid var(--econ-line); text-align: center; }
        .econ-tp .econ-tp-name { text-align: left; white-space: nowrap; color: var(--econ-text); padding-right: 8px; }
        .econ-tp .econ-tagin { width: 100%; min-width: 46px; max-width: 64px; box-sizing: border-box; text-align: center; background: transparent; border: 1px solid var(--econ-line); color: var(--econ-text); font-family: inherit; padding: 4px 2px; }
        .econ-tp .econ-tagin.set { font-weight: bold; border-color: var(--econ-acc); }
        .econ-tp .econ-tagin::placeholder { color: var(--econ-dim2); opacity: .8; }
        .econ-hidden-defs { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 8px; font-size: .72rem; }
        .econ-tablewrap2 { overflow-x: auto; } .econ-tagin { width: 48px; }
        /* 오른쪽 시각 화면 */
        #dispPanelEconomy .econ-dispbox { display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        /* 네온: 시각 화면 바탕을 그래프와 같은 짙은 회색 하나로 (테두리만 남기고) · 모서리는 각지게 */
        html[data-theme-mode="tno"] .econ-dispbox { background: var(--econ-surface) !important; }
        html[data-theme-mode="tno"] .econ-dispbox *:not(svg):not(svg *) { border-radius: 0 !important; }
        #econDisp { flex: 1 1 auto; min-height: 0; overflow: auto; padding-right: 4px; }
        .econ-toolbar { flex: none; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; padding: 4px 0 8px; border-bottom: 1px solid var(--econ-grid); }
        .econ-toolbar .econ-btn { color: var(--econ-ink2); border-color: var(--econ-axis); }
        .econ-toolbar .econ-seg button.on { background: var(--s1); color: #fff; }
        .econ-grow { flex: 1; }
        #econDisp { --econ-line: var(--econ-grid); --econ-text: var(--econ-ink); --econ-dim2: var(--econ-muted); }
        .econ-toprow { display: flex; flex-wrap: wrap; gap: 10px; align-items: stretch; margin-bottom: 8px; }
        .econ-rating-row { flex-direction: row; gap: 10px; justify-content: flex-start; border-radius: 12px; padding: 6px 14px; }
        .econ-rating-row b { font-size: 1.8rem; } .econ-rating-row > div { display: flex; flex-direction: column; }
        .econ-rating-row span { font-size: .8rem; } .econ-rating-row em { font-size: .7rem; color: var(--econ-muted); opacity: 1; }
        .econ-warnsigns { flex: 1 1 260px; min-width: 0; border: 1px solid var(--econ-grid); border-radius: 12px; padding: 6px 10px; }
        .econ-warn-h { font-size: .72rem; color: var(--econ-muted); margin-bottom: 4px; }
        .econ-warn-list { display: flex; flex-wrap: wrap; gap: 4px 6px; }
        .econ-warn { font-size: .74rem; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--econ-grid); color: var(--econ-muted); opacity: .6; }
        .econ-warn.on { opacity: 1; color: var(--econ-ink); font-weight: 600; }
        .econ-warn-warning { border-color: var(--warning); } .econ-warn-serious { border-color: var(--serious); } .econ-warn-critical { border-color: var(--critical); background: color-mix(in srgb, var(--critical) 14%, transparent); }
        .econ-evtypes { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px; margin-bottom: 8px; }
        .econ-evtype { text-align: left; border: 1px solid var(--econ-line); border-radius: 10px; padding: 6px 8px; background: transparent; color: inherit; cursor: pointer; font: inherit; }
        .econ-evtype b { display: block; font-size: .82rem; } .econ-evtype span { display: block; font-size: .68rem; color: var(--econ-dim2); margin-top: 2px; }
        .econ-evtype.on { border-color: var(--econ-acc); box-shadow: inset 0 0 0 1px var(--econ-acc); }
        .econ-evcustom { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2px 12px; margin-bottom: 6px; }
        .econ-evwhen { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; margin: 4px 0 8px; }
        .econ-evf { display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; }
        .econ-evf select { width: auto; }
        .econ-content input.econ-yr { width: 76px; } .econ-content input.econ-mo { width: 54px; }
        .econ-evrow { display: grid; grid-template-columns: 64px minmax(110px, auto) 1fr auto; align-items: center; gap: 4px 10px; padding: 6px 0; border-top: 1px solid var(--econ-line); }
        .econ-evrow .econ-evfx { grid-column: 2 / 4; }
        .econ-evedit { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; } .econ-evedit select { width: auto; }
        .econ-evst { font-size: .7rem; text-align: center; border-radius: 999px; padding: 1px 6px; border: 1px solid var(--econ-line); color: var(--econ-dim2); }
        .econ-ev-on .econ-evst { border-color: var(--econ-acc); color: var(--econ-text); font-weight: 600; }
        .econ-ev-done, .econ-ev-missed { opacity: .6; }
        .econ-fin { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 6px; margin: 2px 0 10px; }
        .econ-fin-i { border: 1px solid var(--econ-grid); border-radius: 10px; padding: 6px 10px; min-width: 0; }
        .econ-fin-i span { display: block; font-size: .72rem; color: var(--econ-muted); }
        .econ-fin-i b { display: block; font-size: 1rem; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .econ-fin-i small { display: block; font-size: .7rem; color: var(--econ-muted); }
        .econ-fin-i small em { font-style: normal; margin-left: 4px; color: var(--econ-ink2); }
        .econ-fin-serious { border-color: var(--serious); } .econ-fin-critical { border-color: var(--critical); background: color-mix(in srgb, var(--critical) 12%, transparent); }
        .econ-gauges { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 4px; align-items: start; margin-bottom: 6px; }
        @media (max-width: 760px) { .econ-gauges { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .econ-sec { margin-top: 14px; }
        .econ-sec > h4 { margin: 0 0 6px; font-size: .9rem; color: var(--econ-ink); font-weight: 600; }
        .econ-sec > h4 .econ-dim { font-weight: normal; font-size: .74rem; }
        .econ-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .econ-chip { cursor: pointer; font-family: inherit; font-size: .74rem; padding: 3px 10px; border: 1px solid var(--econ-axis); background: transparent; color: var(--econ-muted); border-radius: 999px; display: inline-flex; align-items: center; gap: 5px; }
        .econ-chip i { width: 12px; height: 2px; display: inline-block; opacity: .4; }
        .econ-chip.on { color: var(--econ-ink); border-color: var(--econ-ink2); } .econ-chip.on i { opacity: 1; }
        .econ-map { width: 100%; height: 360px; } .econ-map svg { max-height: 360px; }
        /* 크게 보기 */
        body.econ-full #sideNav, body.econ-full > .controls { display: none !important; }
        body.econ-full .display-area { flex: 1 1 100%; max-width: 100%; }
        @media (max-width: 760px) { .econ-dgrid { grid-template-columns: repeat(2, minmax(0,1fr)); } .econ-top { grid-template-columns: auto minmax(0,1fr); } .econ-next { grid-column: 1 / -1; } }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(() => { try { if (typeof currentMainTab !== 'undefined' && currentMainTab === 'economy') renderTab(curSub()); } catch (e) { /* 없음 */ } }, 0)); // eslint-disable-line no-undef
})();
