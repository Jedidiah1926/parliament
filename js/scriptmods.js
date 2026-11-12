// ===== 스크립트 모드 — 이벤트 · 결정 · 국가 변수 · 플래그를 JSON으로 =====
// 모드는 코드를 넣지 않고 게임이 정한 형식(hemicycle-script@1)으로 "조건 → 효과"를 적는다 — 창작마당에 올려도 안전하고,
// 비개발자도 만들 수 있다. 형식 · 조건 · 효과 목록은 docs/MODDING.md.
//
//   - 이벤트: 날짜를 넘길 때(또는 총선 결과를 반영할 때) 조건을 보고 창을 띄운다. 선택지마다 효과
//   - 결정: 국가 › 결정 탭의 버튼 — 보이는 조건(visible) · 쓸 수 있는 조건(available) · 한 번만 / 재사용 대기
//   - 국가 변수 · 플래그: 모드마다 따로 (이름이 다른 모드와 겹치지 않음), 세이브의 scriptMods 칸에 저장
//
// 모드를 읽어 오는 곳
//   1) 데스크톱 앱: 모드 폴더 · 창작마당 구독 아이템 (electron/mods.js → window.hemicycleDesktop.modScripts)
//   2) 국가 › 결정 › 모드에서 "모드 파일 불러오기"로 넣은 .json (이 브라우저 · 앱에 저장 — 모든 세이브에 적용)
// 켜고 끄기는 이 기기 설정(모든 세이브 공통)이고, 변수 · 플래그 · 이미 일어난 이벤트는 세이브마다 따로다.
/* global getAppState, setAppState, switchSubTab, parties, coalitions, seatKeyFor, chamberList, elecStore, refreshUI, simulate,
   showCustomAlert, showCustomConfirm, showKbdToast, escapeHtmlText, currentMainTab, currentSubTab, updateDispInfoBar, IND_IDEOLOGY_ID */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;

    const FORMAT = 'hemicycle-script@1';
    const LS_IMPORTED = 'hemicycleScriptMods';     // [{ data, importedAt }] — 직접 불러온 모드
    const LS_OFF = 'hemicycleScriptModsOff';       // [모드 id] — 꺼 둔 모드
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
    const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
    const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
    const toast = t => { if (typeof showKbdToast === 'function') showKbdToast(t); };

    // ---------------------------------------------------------------
    // 모드 목록
    // ---------------------------------------------------------------
    // mod = { id, name, author, version, desc, source: 'workshop' | 'local' | 'imported', events: [], decisions: [], variables: {}, log: [] }
    let mods = [];
    function validate(data, source) {
        const log = [];
        if (!data || typeof data !== 'object') return { error: 'JSON 객체가 아닙니다' };
        if (data.format !== FORMAT) return { error: `"format": "${FORMAT}"이 아닙니다` };
        const id = String(data.id || '').trim();
        if (!/^[a-z0-9_.-]{1,64}$/i.test(id)) return { error: '"id"는 영문 · 숫자 · _ . - 로 된 64자 이하여야 합니다' };
        const list = (a, what) => (Array.isArray(a) ? a.filter((x, i) => {
            if (!x || typeof x !== 'object' || !x.id) { log.push(`${what} ${i + 1}번에 id가 없어 건너뜀`); return false; }
            return true;
        }) : []);
        const events = list(data.events, '이벤트').map(e => ({ ...e, id: String(e.id), options: Array.isArray(e.options) && e.options.length ? e.options : [{ text: '확인' }] }));
        const decisions = list(data.decisions, '결정').map(d => ({ ...d, id: String(d.id) }));
        const variables = data.variables && typeof data.variables === 'object' ? Object.fromEntries(Object.entries(data.variables).map(([k, v]) => [k, Number(v) || 0])) : {};
        return { mod: { id, name: String(data.name || id), author: String(data.author || ''), version: String(data.version || ''), desc: String(data.description || data.desc || ''),
            source, events, decisions, variables, log } };
    }
    function loadMods() {
        const out = [], seen = new Set(), errors = [];
        const add = (data, source, extra) => {
            const r = validate(data, source);
            if (r.error) { errors.push(`${extra?.title || data?.name || '?'}: ${r.error}`); return; }
            if (seen.has(r.mod.id)) { errors.push(`${r.mod.name}: 같은 id(${r.mod.id})의 모드가 이미 있어 건너뜀`); return; }
            seen.add(r.mod.id); out.push({ ...r.mod, ...(extra || {}) });
        };
        const desk = window.hemicycleDesktop && Array.isArray(window.hemicycleDesktop.modScripts) ? window.hemicycleDesktop.modScripts : [];
        desk.forEach(m => add(m.data, m.source === 'workshop' ? 'workshop' : 'local', { title: m.title, folder: m.folder }));
        lsGet(LS_IMPORTED, []).forEach(m => add(m && m.data, 'imported'));
        // 세이브에 딸린 모드 — 시나리오(js/campaign.js) · 챌린지(js/challenge.js)가 그 세이브에서만 켬 (끄기 목록과 상관없이 늘 켜짐)
        saveMods.forEach(d => add(d, 'scenario'));
        mods = out;
        loadErrors = errors;
    }
    let loadErrors = [];
    let saveMods = [];
    const offSet = () => new Set(lsGet(LS_OFF, []));
    const isOn = mod => mod.source === 'scenario' || !offSet().has(mod.id);
    const activeMods = () => mods.filter(isOn);

    // ---------------------------------------------------------------
    // 세이브 상태 (scriptMods 칸) — 모드 id마다 따로
    // ---------------------------------------------------------------
    let S = fresh();
    function fresh() { return { flags: {}, vars: {}, fired: {}, taken: {}, queue: [] }; }
    const ns = (bucket, mod) => (S[bucket][mod.id] || (S[bucket][mod.id] = {}));
    function initVars() {
        activeMods().forEach(mod => { const v = ns('vars', mod); Object.entries(mod.variables).forEach(([k, n]) => { if (!(k in v)) v[k] = n; }); });
    }
    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.scriptMods = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        window.HemiCampaignEvents?.dismiss();showing=false;
        const r = origSet.apply(this, arguments);
        const src = state && state.scriptMods;
        S = { ...fresh(), ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        ['flags', 'vars', 'fired', 'taken'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
        if (!Array.isArray(S.queue)) S.queue = [];
        initVars();
        refresh();
        if (S.queue.length) setTimeout(showNextEvent, 300);
        return r;
    };

    // ---------------------------------------------------------------
    // 게임 상태 읽기
    // ---------------------------------------------------------------
    // 게임 속 날짜 — 연 · 월 · 일 칸 (비어 있으면 null)
    function today(mod) {
        const campaign=window.HemiCampaign?.scriptDate?.(mod?.id);if(campaign)return campaign;
        const y = parseInt(document.getElementById('nationDateYear')?.value, 10);
        if (!Number.isFinite(y)) return null;
        const m = parseInt(document.getElementById('nationDateMonth')?.value, 10) || 1, d = parseInt(document.getElementById('nationDateDay')?.value, 10) || 1;
        return { y, m, d, key: y * 10000 + m * 100 + d };
    }
    const dateKey = v => {
        const t = String(v ?? '').trim();
        const m = /^(-?\d{1,5})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(t);
        return m ? +m[1] * 10000 + (+m[2] || 1) * 100 + (+m[3] || 1) : null;
    };
    const dayNum = k => { const y = Math.floor(k / 10000), m = Math.floor(k / 100) % 100, d = k % 100; const dt = new Date(2000, m - 1, d); dt.setFullYear(y, m - 1, d); return Math.round(dt.getTime() / 86400000); };
    const realParties = () => (typeof parties !== 'undefined' ? parties : []).filter(p => p.ideologyId !== (typeof IND_IDEOLOGY_ID !== 'undefined' ? IND_IDEOLOGY_ID : 9999));
    const chambersAll = () => { try { return chamberList(); } catch (e) { return ['house']; } };
    const seatsOf = (p, ch) => Number(p[typeof seatKeyFor === 'function' ? seatKeyFor(ch || 'house') : 'seatsHouse']) || 0;
    const isGov = p => !!p && (p.isRuling || (typeof coalitions !== 'undefined' ? coalitions : []).some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id) || String(id).startsWith(p.id + '__'))));
    const byHouse = (a, b) => seatsOf(b, 'house') - seatsOf(a, 'house');
    // 정당 가리키기 — 번호(id) · 이름 · 약칭 · "ruling"(집권 세력 최대 정당) · "largest"(하원 최대 정당) · "opposition"(야당 최대 정당)
    function partyRef(ref) {
        if (ref == null || ref === '') return null;
        const list = realParties();
        const r = String(ref);
        if (r === 'ruling') return list.filter(isGov).sort(byHouse)[0] || null;
        if (r === 'largest') return list.slice().sort(byHouse)[0] || null;
        if (r === 'opposition') return list.filter(p => !isGov(p) && p.status !== 'dissolved').sort(byHouse)[0] || null;
        return list.find(p => String(p.id) === r) || list.find(p => p.name === r) || list.find(p => p.abbr && p.abbr === r) || null;
    }
    const chamberTotal = ch => realParties().reduce((t, p) => t + seatsOf(p, ch), 0) + (typeof parties !== 'undefined' ? parties : []).filter(p => !realParties().includes(p)).reduce((t, p) => t + seatsOf(p, ch), 0);
    const supportOf = (p, ch) => Number(elecStore?.[ch || 'house']?.[p.id]?.prob) || 0;
    const econ = () => (window.HemiEconomy && window.HemiEconomy.state && window.HemiEconomy.state.nat) || null;
    const ECON_KEYS = ['growth', 'infl', 'unemp', 'rate', 'yield', 'debt', 'balance', 'mood', 'conf', 'cur'];

    // 비교 — { gt, gte, lt, lte, eq, ne } 중 적힌 것 모두 만족
    function cmp(v, spec) {
        if (typeof spec !== 'object' || spec == null) return v === spec || Number(v) === Number(spec);
        let ok = true;
        if ('gt' in spec) ok = ok && v > Number(spec.gt);
        if ('gte' in spec) ok = ok && v >= Number(spec.gte);
        if ('lt' in spec) ok = ok && v < Number(spec.lt);
        if ('lte' in spec) ok = ok && v <= Number(spec.lte);
        if ('eq' in spec) ok = ok && v === Number(spec.eq);
        if ('ne' in spec) ok = ok && v !== Number(spec.ne);
        return ok;
    }

    // ---------------------------------------------------------------
    // 조건 (trigger · visible · available)
    // ---------------------------------------------------------------
    // 조건 객체 하나에 열쇠가 여럿이면 모두 만족해야(AND). 배열도 AND. 모르는 열쇠는 거짓 + 모드 기록에 경고
    // 세계지도 조건(owns_regions · in_economic_region)이 든 조건식은 먼저 참조를 모두 검사한다 — 지도 · 나라 · 구역이 없으면
    // 바깥의 all · any · not까지 식 전체가 "평가 실패"(거짓)다. not이 틀린 참조를 참으로 뒤집거나 any가 없는 구역을 건너뛰지 않게.
    const Rules = window.HemiWorldRules;
    const usesWorld = new WeakMap(); // 조건 · 효과 객체 → 세계지도 규칙을 쓰는지 (매번 훑지 않게)
    const hasWorld = (v, kind) => { if (!Rules || !v || typeof v !== 'object') return false; let u = usesWorld.get(v); if (u == null) { u = Rules.uses(v, kind); usesWorld.set(v, u); } return u; };
    // 지금 지도 · 나라 연결 — 시나리오의 스크립트에서만 (일반 스크립트 모드는 나라 열쇠가 없다)
    const worldCtx = mod => { try { return (mod && window.HemiCampaign && window.HemiCampaign.worldContext && window.HemiCampaign.worldContext(mod.id)) || null; } catch (e) { return null; } };
    const NOT_SCENARIO = '세계지도 조건 · 효과는 시나리오에서만 쓸 수 있습니다.';
    function worldCondError(cond, mod) {
        const ctx = worldCtx(mod);
        if (!ctx) return NOT_SCENARIO;
        let error = null;
        Rules.walkCond(cond, (kind, k, v) => { if (error || (k !== 'owns_regions' && k !== 'in_economic_region')) return; const r = k === 'owns_regions' ? Rules.owns(v, ctx) : Rules.inZone(v, ctx); if (!r.ok) error = r.error; }, '');
        return error;
    }
    function test(cond, mod) {
        if (hasWorld(cond, 'cond')) { const why = worldCondError(cond, mod); if (why) { warn(mod, `조건을 평가하지 못함: ${why}`); return false; } }
        return evalCond(cond, mod);
    }
    function evalCond(cond, mod) {
        if (cond == null) return true;
        if (Array.isArray(cond)) return cond.every(c => evalCond(c, mod));
        if (typeof cond !== 'object') return !!cond;
        return Object.entries(cond).every(([k, v]) => testOne(k, v, mod));
    }
    function testOne(k, v, mod) {
        const t = today(mod);
        switch (k) {
            case 'all': return (Array.isArray(v) ? v : [v]).every(c => evalCond(c, mod));
            case 'any': return (Array.isArray(v) ? v : [v]).some(c => evalCond(c, mod));
            case 'not': return !evalCond(v, mod);
            // 구역 소유 — { "country": { "key": "republic" } | { "unassigned": true }, "regions": ["riverbank"], "mode": "all" | "any" }
            case 'owns_regions': { const ctx = worldCtx(mod), r = ctx && Rules ? Rules.owns(v, ctx) : null; if (!r || !r.ok) { warn(mod, `owns_regions: ${r ? r.error : NOT_SCENARIO}`); return false; } return r.value; }
            // 경제권 소속 — { "zone": { "id": "north" } | { "unassigned": true }, "regions": ["riverbank"], "mode": "all" | "any" }
            case 'in_economic_region': { const ctx = worldCtx(mod), r = ctx && Rules ? Rules.inZone(v, ctx) : null; if (!r || !r.ok) { warn(mod, `in_economic_region: ${r ? r.error : NOT_SCENARIO}`); return false; } return r.value; }
            case 'always': return !!v;
            case 'date_after': return !!t && t.key >= (dateKey(v) ?? Infinity);
            case 'date_before': return !!t && t.key < (dateKey(v) ?? -Infinity);
            case 'flag': case 'has_flag': return !!ns('flags', mod)[v];
            case 'not_flag': return !ns('flags', mod)[v];
            case 'var': return cmp(Number(ns('vars', mod)[v.name]) || 0, v);
            case 'chance': return Math.random() * 100 < Number(v);
            case 'event_fired': return !!ns('fired', mod)[v];
            case 'decision_taken': return ns('taken', mod)[v] != null;
            case 'party_exists': { const p = partyRef(v); return !!p && p.status !== 'dissolved'; }
            case 'ruling': return isGov(partyRef(v));
            case 'party_status': { const p = partyRef(v.party); return !!p && (p.status || 'active') === v.is; }
            case 'party_seats': {
                const p = partyRef(v.party); if (!p) return false;
                const ch = v.chamber || 'house', n = seatsOf(p, ch);
                return cmp(v.share ? n / (chamberTotal(ch) || 1) * 100 : n, v);
            }
            case 'party_support': { const p = partyRef(v.party); return !!p && cmp(supportOf(p, v.chamber), v); }
            case 'ruling_seats': { const ch = v.chamber || 'house', n = realParties().filter(isGov).reduce((t2, p) => t2 + seatsOf(p, ch), 0); return cmp(v.share ? n / (chamberTotal(ch) || 1) * 100 : n, v); }
            case 'economy': { const e = econ(); return !!e && ECON_KEYS.includes(v.indicator) && cmp(Number(e[v.indicator]) || 0, v); }
            // 국정 지지율 (여론 › 국정 지지율, js/news.js) — { "of": "cabinet" | "president" | "pm" | "chair", "lt": 30 }
            case 'approval': { const a = window.HemiNews && window.HemiNews.approval(v.of || 'cabinet'); return a != null && cmp(a, v); }
            default:
                warn(mod, `모르는 조건 "${k}"`);
                return false;
        }
    }

    // ---------------------------------------------------------------
    // 효과
    // ---------------------------------------------------------------
    function warn(mod, msg) {
        if (!mod) return;
        if (!mod.log.includes(msg)) mod.log.push(msg);
        if (mod.log.length > 50) mod.log.shift();
    }
    let dirty = false; // 정당 · 지지율이 바뀌어 다시 계산해야 함
    function run(effects, mod) {
        (Array.isArray(effects) ? effects : effects ? [effects] : []).forEach(e => {
            if (!e || typeof e !== 'object') return;
            Object.entries(e).forEach(([k, v]) => runOne(k, v, mod));
        });
    }
    function runOne(k, v, mod) {
        switch (k) {
            case 'set_flag': ns('flags', mod)[v] = true; return;
            case 'clear_flag': delete ns('flags', mod)[v]; return;
            case 'set_var': ns('vars', mod)[v.name] = Number(v.value) || 0; return;
            case 'add_var': { const vars = ns('vars', mod); vars[v.name] = (Number(vars[v.name]) || 0) + (Number(v.value) || 0); return; }
            case 'support': {
                // 지지율 — chamber를 안 적으면 모든 원. add는 더하기, set은 바꾸기 (0 ~ 100)
                const p = partyRef(v.party); if (!p) { warn(mod, `support: 정당 "${v.party}"을 찾지 못함`); return; }
                (v.chamber ? [v.chamber] : chambersAll()).forEach(ch => {
                    const st = elecStore?.[ch]; if (!st) return;
                    const cur = st[p.id] || (st[p.id] = { prob: 0, err: 0 });
                    cur.prob = Math.max(0, Math.min(100, 'set' in v ? Number(v.set) || 0 : (Number(cur.prob) || 0) + (Number(v.add) || 0)));
                });
                dirty = true; return;
            }
            case 'party_status': { const p = partyRef(v.party); if (!p) return warn(mod, `party_status: 정당 "${v.party}"을 찾지 못함`); if (['active', 'banned', 'dissolved'].includes(v.to)) { p.status = v.to; dirty = true; } return; }
            case 'rename_party': { const p = partyRef(v.party); if (!p) return warn(mod, `rename_party: 정당 "${v.party}"을 찾지 못함`); if (v.name) p.name = String(v.name).slice(0, 60); if (v.abbr != null) p.abbr = String(v.abbr).slice(0, 20); dirty = true; return; }
            case 'party_color': { const p = partyRef(v.party); if (p && /^#[0-9a-f]{6}$/i.test(v.color || '')) { p.color = v.color; dirty = true; } return; }
            case 'economy': {
                const e = econ(); if (!e) return warn(mod, 'economy: 경제가 아직 시작되지 않음');
                if (!ECON_KEYS.includes(v.indicator)) return warn(mod, `economy: 모르는 지표 "${v.indicator}"`);
                e[v.indicator] = 'set' in v ? Number(v.set) || 0 : (Number(e[v.indicator]) || 0) + (Number(v.add) || 0);
                try { window.HemiEconomy.refresh(); } catch (err) { /* 경제 화면 없음 */ }
                return;
            }
            case 'nation_name': { const el = document.getElementById('nationNameInput'); if (el) { el.value = String(v).slice(0, 80); if (typeof window.updateNationIdBar === 'function') window.updateNationIdBar(); } return; }
            case 'message': showCustomAlert(fill(typeof v === 'object' ? [v.title, v.text].filter(Boolean).join('\n\n') : v, mod)); return;
            case 'toast': toast(fill(v, mod)); return;
            // 국정 지지율 더하기 · 바꾸기 — { "of": "cabinet", "add": -5 } · { "of": "president", "set": 40 }
            case 'approval': {
                if (!window.HemiNews) return warn(mod, 'approval: 여론 기능이 없음');
                const k = v.of || 'cabinet';
                if (window.HemiNews.approval(k) == null) return warn(mod, `approval: 모르는 자리 "${k}"`);
                if ('set' in v) window.HemiNews.setApproval(k, v.set); else window.HemiNews.addApproval(k, v.add);
                return;
            }
            // 기사 발행 — { "title", "subtitle", "body", "outlet", "reporter", "type", "effects": [{ "party": "ruling", "add": -2 }, { "approval": "cabinet", "add": -3 }] }
            case 'article': {
                if (!window.HemiNews) return warn(mod, 'article: 여론 기능이 없음');
                const o = { ...v, title: fill(v.title || '', mod), subtitle: fill(v.subtitle || '', mod), body: fill(v.body || '', mod) };
                window.HemiNews.publishNew(o, partyRef);
                return;
            }
            case 'fire_event': queueEvent(mod, typeof v === 'object' ? v.id : v, true); return;
            // 영토 변경 — { "regions": ["riverbank"], "to": { "key": "republic" } | { "unassigned": true } }. 구역을 모두 검사한 뒤 한 번에 (일부만 바뀌지 않는다)
            // 경제권 배정 — { "regions": ["riverbank"], "to": { "id": "north" } | { "unassigned": true } }
            case 'transfer_regions': case 'assign_economic_region': {
                const ctx = worldCtx(mod), map = window.HemiWorldMap;
                if (!ctx || !Rules || !map) return warn(mod, `${k}: ${NOT_SCENARIO}`);
                const r = k === 'transfer_regions' ? Rules.planTransfer(v, ctx) : Rules.planAssign(v, ctx);
                if (!r.ok) return warn(mod, `${k}: ${r.error}`);
                if (r.changes.length) { if (k === 'transfer_regions') map.applyOwners(r.changes, 'script'); else if (map.applyZones) map.applyZones(r.changes, 'script'); }
                return;
            }
            case 'if': { if (test(v.condition ?? v.if, mod)) run(v.then, mod); else run(v.else, mod); return; }
            case 'random_list': {
                const list = Array.isArray(v) ? v : [];
                const total = list.reduce((t, o) => t + Math.max(0, Number(o.weight) || 0), 0);
                let r = Math.random() * total;
                for (const o of list) { r -= Math.max(0, Number(o.weight) || 0); if (r < 0) { run(o.effects, mod); break; } }
                return;
            }
            default: warn(mod, `모르는 효과 "${k}"`);
        }
    }
    // 글자 속 {var:이름} · {party:ruling} · {date} 바꾸기
    function fill(text, mod) {
        return String(text ?? '').replace(/\{(var|party|date)(?::([^}]+))?\}/g, (m, kind, arg) => {
            if (kind === 'var') return String(Math.round((Number(ns('vars', mod)[arg]) || 0) * 100) / 100);
            if (kind === 'party') return partyRef(arg)?.name || '?';
            if (kind === 'date') { try { return window.HemiCampaign?.scriptDateLabel?.(mod?.id)||window.formatNationDate(); } catch (e) { return ''; } }
            return m;
        });
    }
    // 효과 목록을 실행하기 전에 — 세계지도 참조(나라 연결 · 구역 · 경제권)가 지금 모두 유효한지. 문제없으면 null, 아니면 이유.
    // 방향성 완료 · 결정 · 이벤트 선택은 이 검사에 걸리면 실행하지 않고 완료 · 사용 기록도 남기지 않는다 (조건부 분기는 실행하지 않고 참조만 본다)
    function precheck(effects, mod) {
        if (!hasWorld(effects, 'effects')) return null;
        const ctx = worldCtx(mod);
        return ctx ? Rules.precheck(effects, ctx) : NOT_SCENARIO;
    }
    function afterEffects() {
        if (dirty) { dirty = false; try { simulate(); } catch (e) { /* 다시 계산 실패 */ } }
        try { refreshUI(); } catch (e) { /* 화면 갱신 실패 */ }
        refresh();
        window.dispatchEvent(new CustomEvent('hemi-script-effects-applied'));
    }

    // ---------------------------------------------------------------
    // 이벤트
    // ---------------------------------------------------------------
    const findEvent = (mod, id) => mod.events.find(e => e.id === String(id));
    function queueEvent(mod, id, force) {
        const ev = findEvent(mod, id);
        if (!ev) { warn(mod, `fire_event: 이벤트 "${id}"가 없음`); return; }
        if (!force && S.queue.some(q => q.mod === mod.id && q.ev === ev.id)) return;
        // 숨은 이벤트는 창 없이 바로 효과만
        if (ev.hidden) { if (worldChain) worldChainEvents.add(ev.id); ns('fired', mod)[ev.id] = (ns('fired', mod)[ev.id] || 0) + 1; run(ev.immediate, mod); run(ev.options[0].effects, mod); afterEffects(); return; }
        S.queue.push({ mod: mod.id, ev: ev.id });
    }
    // 지도가 바뀌면(시나리오 효과 · 수동 칠하기 · 지도 파일) 날짜를 넘기지 않고 "지도 변경 시"(check: "world") 이벤트를 다시 본다.
    // 효과 목록이 끝난 뒤 한 번 — 알림을 받으면 바로 검사하지 않고 다음 차례로 모은다. 숨은 이벤트가 서로 영토를 바꾸며 끝없이 이어지면 32번에서 멈춘다
    const WORLD_CHAIN_MAX = 32;
    let worldCheckT = 0, worldChain = 0;
    const worldChainEvents = new Set();
    window.addEventListener('hemi-world-map-changed', e => {
        if (!e.detail || e.detail.source !== 'script') { worldChain = 0; worldChainEvents.clear(); } // 사람이 바꾼 것은 새 행동
        if (worldCheckT) return;
        worldCheckT = setTimeout(runWorldCheck, 0);
    });
    function runWorldCheck() {
        worldCheckT = 0;
        if (++worldChain > WORLD_CHAIN_MAX) {
            const ids = [...worldChainEvents].join(', ');
            activeMods().forEach(mod => warn(mod, `지도 변경이 다시 지도를 바꾸는 일이 ${WORLD_CHAIN_MAX}번 넘게 이어져 멈춤${ids ? ` (이벤트: ${ids})` : ''}`));
            toast(`지도 변경 연쇄를 ${WORLD_CHAIN_MAX}번에서 멈췄습니다${ids ? ` — 이벤트: ${ids}` : ''}`);
            worldChain = 0; worldChainEvents.clear();
            return;
        }
        checkEvents('world');
        if (!worldCheckT) { worldChain = 0; worldChainEvents.clear(); } // 이 검사가 지도를 또 바꾸지 않았으면 연쇄 끝
    }
    // when: 'date' (날짜를 넘길 때) · 'election' (총선 결과를 의회에 반영할 때) · 'world' (지도가 바뀔 때). check: "any"는 셋 모두
    function checkEvents(when) {
        activeMods().forEach(mod => mod.events.forEach(ev => {
            const on = ev.check || 'date';
            if (on !== when && on !== 'any') return;
            if (ev.trigger_only) return; // fire_event로만
            const fired = ns('fired', mod)[ev.id] || 0;
            if (ev.once !== false && fired) return;
            if (S.queue.some(q => q.mod === mod.id && q.ev === ev.id)) return;
            if (!test(ev.trigger, mod)) return;
            if (ev.chance != null && Math.random() * 100 >= Number(ev.chance)) return;
            queueEvent(mod, ev.id);
        }));
        if (S.queue.length) showNextEvent();
    }
    let showing = false;
    function showNextEvent() {
        if (showing) return;
        const q = S.queue[0]; if (!q) return;
        const mod = mods.find(m => m.id === q.mod), ev = mod && findEvent(mod, q.ev);
        if (!mod || !ev || !isOn(mod)) { S.queue.shift(); showNextEvent(); return; }
        showing = true;
        if(!q.started){
            q.started=true;
            ns('fired',mod)[ev.id]=(ns('fired',mod)[ev.id]||0)+1;
            run(ev.immediate,mod);
        }
        const opts=ev.options.map((o,i)=>({o,i})).filter(({o})=>test(o.trigger,mod));
        HemiCampaignEvents.show(ev,{fill:t=>fill(t,mod),modName:mod.name,choices:opts,canChoose:i=>(i>=0?precheck(ev.options[i].effects,mod):null),onChoose:i=>{
            if(i>=0)run(ev.options[i].effects,mod);
            S.queue.shift();showing=false;afterEffects();
            try{window.saveActiveNow?.(true);}catch(e){/* autosave retries */}
            setTimeout(showNextEvent,60);
        }});

    }

    // 날짜를 넘기면 · 총선 결과를 반영하면 이벤트 검사
    const origAdvance = window.advanceNationDate;
    if (typeof origAdvance === 'function') window.advanceNationDate = function () {
        const before = today();
        const r = origAdvance.apply(this, arguments);
        const after = today();
        if (after && (!before || after.key !== before.key)) checkEvents('date');
        return r;
    };
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') window.elecApplyToParliament = function () {
        const r = origApply.apply(this, arguments);
        setTimeout(() => checkEvents('election'), 0);
        return r;
    };

    // ---------------------------------------------------------------
    // 결정
    // ---------------------------------------------------------------
    // 쓸 수 있으면 null, 아니면 이유
    function decisionBlock(mod, d) {
        const taken = ns('taken', mod)[d.id];
        if (taken != null && d.once !== false && !d.cooldown_days) return '이미 함';
        if (taken != null && d.cooldown_days) {
            const t = today(mod);
            if (t) { const left = Number(d.cooldown_days) - (dayNum(t.key) - dayNum(taken)); if (left > 0) return `${left}일 뒤 다시`; }
        }
        if (!test(d.available, mod)) return d.requirement_text ? fill(d.requirement_text, mod) : '조건 미충족';
        return null;
    }
    function takeDecision(mod, d) {
        if (decisionBlock(mod, d)) return;
        const why = precheck(d.effects, mod);
        if (why) { showCustomAlert(`결정 "${fill(d.title || d.id, mod)}"을(를) 실행할 수 없습니다.\n${why}`); return; } // 사용 기록을 남기지 않는다 — 고친 뒤 다시 할 수 있게
        const t = today(mod);
        ns('taken', mod)[d.id] = t ? t.key : 0;
        run(d.effects, mod);
        afterEffects();
        toast(`결정: ${fill(d.title || d.id, mod)}`);
        if (S.queue.length) showNextEvent();
    }

    // ---------------------------------------------------------------
    // 국가 › 결정 탭 (결정 · 모드 관리)
    // ---------------------------------------------------------------
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTab() {
        const nation = document.getElementById('mainContentNation');
        const bar = nation && nation.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const before = document.getElementById('subTabNationSettings');
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('nation','decisions')" id="subTabDecisions">결정</button>`), before);
        nation.insertBefore(el(`<div id="contentDecisions" class="sub-tab-content"></div>`), document.getElementById('contentNationSettings'));
    })();
    let ui = { tab: 'decisions', openMod: null };
    const origSwitchSub = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitchSub.apply(this, arguments);
        if (main === 'nation' && sub === 'decisions') render();
        return r;
    };
    const onTab = () => typeof currentMainTab !== 'undefined' && currentMainTab === 'nation' && typeof currentSubTab !== 'undefined' && currentSubTab.nation === 'decisions';
    function refresh() { if (onTab()) render(); }

    const SRC_LABEL = { workshop: '창작마당', local: '모드 폴더', imported: '불러온 파일', scenario: '시나리오 · 챌린지' };
    function render() {
        const host = document.getElementById('contentDecisions');
        if (!host) return;
        const act = activeMods();
        const seg = `<div class="sm-seg"><button type="button" data-tab="decisions" class="${ui.tab === 'decisions' ? 'on' : ''}">결정</button><button type="button" data-tab="mods" class="${ui.tab === 'mods' ? 'on' : ''}">모드 ${mods.length ? `<span class="sm-n">${act.length}/${mods.length}</span>` : ''}</button></div>`;
        host.innerHTML = `<div class="sm-wrap">${seg}${ui.tab === 'decisions' ? decisionsHtml(act) : modsHtml()}</div>`;
        host.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { ui.tab = b.dataset.tab; render(); }; });
        if (ui.tab === 'decisions') {
            host.querySelectorAll('[data-take]').forEach(b => { b.onclick = () => { const [mid, did] = b.dataset.take.split('\n'); const mod = mods.find(m => m.id === mid), d = mod && mod.decisions.find(x => x.id === did); if (d) takeDecision(mod, d); }; });
            host.querySelector('[data-go-mods]')?.addEventListener('click', () => { ui.tab = 'mods'; render(); });
        } else bindMods(host);
    }
    function decisionsHtml(act) {
        if (!act.length) return `<div class="sm-empty">켜 둔 모드가 없습니다. 결정 · 이벤트는 스크립트 모드가 넣습니다.<br><button type="button" class="sm-btn" data-go-mods>모드 보기 · 불러오기</button></div>`;
        const groups = new Map();
        act.forEach(mod => mod.decisions.forEach(d => {
            if (!test(d.visible, mod)) return;
            const cat = fill(d.category || mod.name, mod);
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat).push({ mod, d });
        }));
        if (!groups.size) return '<div class="sm-empty">지금 고를 수 있는 결정이 없습니다. 조건이 맞으면 여기에 나타납니다.</div>';
        return [...groups].map(([cat, list]) => `<div class="sm-cat"><div class="sm-cat-h">${esc(cat)}</div>${list.map(({ mod, d }) => {
            const block = decisionBlock(mod, d);
            return `<div class="sm-dec ${block ? 'off' : ''}">
                <div class="sm-dec-main"><div class="sm-dec-title">${esc(fill(d.title || d.id, mod))}</div>${d.desc || d.description ? `<div class="sm-dec-desc">${esc(fill(d.desc || d.description, mod)).replace(/\n/g, '<br>')}</div>` : ''}</div>
                <button type="button" class="sm-btn ${block ? '' : 'sm-primary'}" data-take="${esc(mod.id + '\n' + d.id)}" ${block ? 'disabled' : ''}>${esc(block || '결정하기')}</button></div>`;
        }).join('')}</div>`).join('');
    }
    function modsHtml() {
        const off = offSet();
        const cards = mods.map(mod => {
            const open = ui.openMod === mod.id;
            const vars = S.vars[mod.id] || {}, flags = Object.keys(S.flags[mod.id] || {}), fired = S.fired[mod.id] || {};
            return `<div class="sm-mod ${mod.source !== 'scenario' && off.has(mod.id) ? 'off' : ''}" data-mod="${esc(mod.id)}">
                <div class="sm-mod-head"><label class="sm-switch"><input type="checkbox" data-toggle ${mod.source === 'scenario' || !off.has(mod.id) ? 'checked' : ''} ${mod.source === 'scenario' ? 'disabled title="시나리오 모드는 이 세이브에서 늘 켜짐"' : ''}> <b>${esc(mod.name)}</b></label>
                    <span class="sm-tag">${esc(SRC_LABEL[mod.source] || mod.source)}</span>${mod.version ? `<span class="sm-dim">v${esc(mod.version)}</span>` : ''}</div>
                <div class="sm-dim">${mod.author ? `제작자: ${esc(mod.author)} · ` : ''}이벤트 ${mod.events.length} · 결정 ${mod.decisions.length}${Object.keys(mod.variables).length ? ` · 변수 ${Object.keys(mod.variables).length}` : ''}</div>
                ${mod.desc ? `<div class="sm-mod-desc">${esc(mod.desc)}</div>` : ''}
                ${mod.log.length ? `<div class="sm-warn">⚠ ${mod.log.map(esc).join('<br>⚠ ')}</div>` : ''}
                <div class="sm-row"><button type="button" class="sm-btn" data-open>${open ? '모더 도구 닫기' : '모더 도구'}</button>${mod.source === 'imported' ? '<button type="button" class="sm-btn" data-remove>지우기</button>' : ''}</div>
                ${open ? `<div class="sm-tools">
                    <div class="sm-dim">이 세이브의 상태 — 변수: ${Object.keys(vars).length ? Object.entries(vars).map(([k, v]) => `<code>${esc(k)} = ${esc(Math.round(v * 100) / 100)}</code>`).join(' ') : '없음'} · 플래그: ${flags.length ? flags.map(f => `<code>${esc(f)}</code>`).join(' ') : '없음'}</div>
                    <div class="sm-tool-list">${mod.events.map(ev => `<div class="sm-tool-row"><span>${esc(ev.id)}</span><span class="sm-dim">${fired[ev.id] ? `${fired[ev.id]}번 일어남` : (test(ev.trigger, mod) ? '조건 맞음' : '조건 안 맞음')}</span><button type="button" class="sm-btn" data-fire="${esc(ev.id)}">띄우기</button></div>`).join('') || '<span class="sm-dim">이벤트 없음</span>'}</div>
                    <div class="sm-row"><button type="button" class="sm-btn" data-reset>이 세이브에서 모드 상태 초기화</button></div></div>` : ''}
            </div>`;
        }).join('');
        const desk = !!window.hemicycleDesktop;
        return `<div class="sm-intro">스크립트 모드는 이벤트 · 결정 · 국가 변수를 더합니다 (코드 없이 JSON으로). 켜고 끄기는 이 기기의 모든 세이브에 적용되고, 변수 · 일어난 이벤트는 세이브마다 따로 저장됩니다. 만드는 법은 <code>docs/MODDING.md</code>.</div>
            ${loadErrors.length ? `<div class="sm-warn">불러오지 못한 모드:<br>${loadErrors.map(esc).join('<br>')}</div>` : ''}
            <div class="sm-row"><button type="button" class="sm-btn sm-primary" data-import>모드 파일 불러오기 (.json)</button><button type="button" class="sm-btn" data-example>예제 모드 넣기</button>${desk && window.hemicycleDesktop.openModsFolder ? '<button type="button" class="sm-btn" data-folder>모드 폴더 열기</button>' : ''}
                <input type="file" accept=".json,application/json" data-file hidden></div>
            ${cards || '<div class="sm-empty">모드가 없습니다.</div>'}`;
    }
    function bindMods(host) {
        const fileIn = host.querySelector('[data-file]');
        host.querySelector('[data-import]').onclick = () => fileIn.click();
        fileIn.onchange = async () => {
            const f = fileIn.files && fileIn.files[0]; fileIn.value = '';
            if (!f) return;
            let data; try { data = JSON.parse(await f.text()); } catch (e) { showCustomAlert('JSON 파일을 읽지 못했습니다.'); return; }
            importMod(data);
        };
        host.querySelector('[data-example]').onclick = () => importMod(JSON.parse(JSON.stringify(EXAMPLE)));
        host.querySelector('[data-folder]')?.addEventListener('click', () => window.hemicycleDesktop.openModsFolder());
        host.querySelectorAll('.sm-mod').forEach(card => {
            const mod = mods.find(m => m.id === card.dataset.mod); if (!mod) return;
            card.querySelector('[data-toggle]').onchange = e => {
                const s = offSet(); if (e.target.checked) s.delete(mod.id); else s.add(mod.id);
                lsSet(LS_OFF, [...s]); initVars(); render();
            };
            card.querySelector('[data-open]').onclick = () => { ui.openMod = ui.openMod === mod.id ? null : mod.id; render(); };
            card.querySelector('[data-remove]')?.addEventListener('click', () => showCustomConfirm(`"${mod.name}" 모드를 지울까요? (세이브에 남은 변수 · 플래그는 그대로)`, () => {
                lsSet(LS_IMPORTED, lsGet(LS_IMPORTED, []).filter(m => !(m && m.data && m.data.id === mod.id)));
                loadMods(); render();
            }));
            card.querySelectorAll('[data-fire]').forEach(b => { b.onclick = () => { queueEvent(mod, b.dataset.fire, true); showNextEvent(); }; });
            card.querySelector('[data-reset]')?.addEventListener('click', () => showCustomConfirm(`이 세이브에서 "${mod.name}"의 변수 · 플래그 · 일어난 이벤트 · 한 결정을 지울까요?`, () => {
                ['flags', 'vars', 'fired', 'taken'].forEach(k => delete S[k][mod.id]);
                S.queue = S.queue.filter(q => q.mod !== mod.id);
                initVars(); render();
            }));
        });
    }
    function importMod(data) {
        const r = validate(data, 'imported');
        if (r.error) { showCustomAlert(`스크립트 모드가 아닙니다: ${r.error}`); return; }
        const list = lsGet(LS_IMPORTED, []).filter(m => !(m && m.data && m.data.id === r.mod.id));
        list.push({ data, importedAt: Date.now() });
        if (!lsSet(LS_IMPORTED, list)) { showCustomAlert('저장 공간이 부족해 모드를 넣지 못했습니다.'); return; }
        loadMods(); initVars();
        toast(`모드 넣음: ${r.mod.name} · 이벤트 ${r.mod.events.length} · 결정 ${r.mod.decisions.length}`);
        render();
    }

    // 예제 모드 — docs/MODDING.md의 예제와 같은 내용 (docs/example-script-mod/script.json)
    const EXAMPLE = {
        format: FORMAT, id: 'example.coalition', name: '예제: 정국 흐름', author: 'Hemicycle', version: '1.0',
        description: '날짜를 넘기면 정국 안정도가 바뀌고, 여당이 과반을 잃으면 연정 위기 이벤트가 일어나는 예제 모드입니다.',
        variables: { stability: 50 },
        events: [
            { id: 'minority_crisis', title: '여소야대', desc: '{party:ruling}이(가) 하원 과반을 잃었습니다. 정국 안정도 {var:stability}.',
                trigger: { not: { ruling_seats: { share: true, gte: 50 } }, not_flag: 'crisis_done' },
                options: [
                    { text: '대연정을 제안한다', effects: [{ add_var: { name: 'stability', value: 10 } }, { support: { party: 'ruling', add: -2 } }, { set_flag: 'crisis_done' }] },
                    { text: '소수 정부로 버틴다', effects: [{ add_var: { name: 'stability', value: -15 } }, { set_flag: 'crisis_done' }] },
                ] },
            { id: 'unrest', title: '거리의 시위', desc: '정국이 불안해 시위가 번집니다.', once: false, chance: 30,
                trigger: { var: { name: 'stability', lt: 30 } },
                options: [{ text: '대화로 푼다', effects: [{ add_var: { name: 'stability', value: 8 } }] }, { text: '강경 대응', effects: [{ add_var: { name: 'stability', value: 3 } }, { support: { party: 'ruling', add: -3 } }] }] },
        ],
        decisions: [
            { id: 'reform', category: '정국 운영', title: '정치 개혁안 발표', desc: '정국 안정도 +15 · 여당 지지율 +1 (안정도 40 이상, 한 번만)',
                available: { var: { name: 'stability', gte: 40 } }, requirement_text: '안정도 40 이상 필요', effects: [{ add_var: { name: 'stability', value: 15 } }, { support: { party: 'ruling', add: 1 } }] },
            { id: 'rally', category: '정국 운영', title: '지지층 결집 집회', desc: '여당 지지율 +2, 안정도 -5 (180일마다)', cooldown_days: 180,
                effects: [{ support: { party: 'ruling', add: 2 } }, { add_var: { name: 'stability', value: -5 } }] },
        ],
    };

    // 다른 파일 · 시험용
    window.HemiScriptMods = {
        get mods() { return mods; }, get state() { return S; },
        reload: () => { loadMods(); initVars(); refresh(); }, importMod, checkEvents,
        // 세이브에 딸린 모드 바꾸기 (시나리오) — 데이터 배열, 빈 배열이면 없앰
        setSaveMods(list) { saveMods = Array.isArray(list) ? list.filter(Boolean) : []; loadMods(); initVars(); refresh(); },
        // 시나리오(js/campaign.js)이 쓰는 것 — 이벤트 띄우기 · 변수 · 플래그 · 결정 목록과 실행
        fire(id, evId) { const m = mods.find(x => x.id === id); if (m) { queueEvent(m, evId, true); showNextEvent(); } },
        vars: id => (S.vars[id] || {}), flags: id => (S.flags[id] || {}),
        decisions(id, filter) { const m = mods.find(x => x.id === id); if (!m) return []; return m.decisions.filter(d => (!filter || filter(d)) && test(d.visible, m)).map(d => ({ id: d.id, title: fill(d.title || d.id, m), desc: fill(d.desc || d.description || '', m), block: decisionBlock(m, d), category: d.category || '' })); },
        take(id, did) { const m = mods.find(x => x.id === id), d = m && m.decisions.find(x => x.id === did); if (d) takeDecision(m, d); },
        fill: (text, id) => fill(text, mods.find(m => m.id === id)), test: (cond, id) => test(cond, mods.find(m => m.id === id)),
        run: (eff, id) => { run(eff, mods.find(m => m.id === id)); afterEffects(); },
        precheck: (eff, id) => precheck(eff, mods.find(m => m.id === id)), example: () => JSON.parse(JSON.stringify(EXAMPLE)),
    };

    const style = document.createElement('style');
    style.textContent = `
        .sm-wrap { font-size: .85rem; }
        .sm-seg { display: flex; gap: 4px; margin-bottom: 10px; }
        .sm-seg button { flex: 1; cursor: pointer; font: inherit; padding: 6px 8px; background: transparent; border: 1px solid #333; color: #aaa; }
        .sm-seg button.on { border-color: var(--tno-neon); color: var(--tno-neon); }
        .sm-n { font-size: .7rem; opacity: .7; }
        .sm-intro { color: #888; font-size: .76rem; line-height: 1.6; margin-bottom: 8px; }
        .sm-intro code, .sm-tools code { font-size: .72rem; padding: 0 4px; background: rgba(255,255,255,.06); }
        .sm-empty { color: #777; padding: 16px 4px; line-height: 1.7; }
        .sm-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
        .sm-btn { cursor: pointer; font: inherit; font-size: .8rem; padding: 5px 10px; background: transparent; border: 1px solid #444; color: #ccc; }
        .sm-btn:disabled { opacity: .5; cursor: default; }
        .sm-btn.sm-primary { border-color: var(--tno-neon); color: var(--tno-neon); }
        .sm-cat { margin-bottom: 12px; }
        .sm-cat-h { color: var(--tno-gold, #ffd700); font-size: .8rem; letter-spacing: 1px; margin-bottom: 6px; }
        .sm-dec { display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid #2a2a2a; margin-bottom: 6px; }
        .sm-dec.off { opacity: .65; }
        .sm-dec-main { flex: 1; min-width: 0; }
        .sm-dec-title { color: #eee; }
        .sm-dec-desc { color: #888; font-size: .74rem; line-height: 1.5; margin-top: 2px; }
        .sm-mod { border: 1px solid #2a2a2a; padding: 8px; margin-bottom: 8px; }
        .sm-mod.off { opacity: .6; }
        .sm-mod-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .sm-switch { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
        .sm-tag { font-size: .66rem; border: 1px solid #444; color: #999; padding: 0 5px; }
        .sm-dim { color: #888; font-size: .74rem; }
        .sm-mod-desc { color: #aaa; font-size: .76rem; line-height: 1.5; margin: 4px 0; }
        .sm-warn { color: #f0b429; font-size: .74rem; line-height: 1.5; margin: 6px 0; }
        .sm-tools { border-top: 1px dashed #333; margin-top: 6px; padding-top: 6px; display: flex; flex-direction: column; gap: 6px; }
        .sm-tool-list { display: flex; flex-direction: column; gap: 4px; }
        .sm-tool-row { display: flex; align-items: center; gap: 8px; } .sm-tool-row > span:first-child { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
        html[data-theme-family="modern"] .sm-seg button { border-color: var(--m-border); color: var(--m-text-3); border-radius: 8px; }
        html[data-theme-family="modern"] .sm-seg button.on { border-color: var(--m-accent); color: var(--m-accent); }
        html[data-theme-family="modern"] .sm-btn { border-color: var(--m-border); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .sm-btn.sm-primary { border-color: var(--m-accent); color: var(--m-accent); }
        html[data-theme-family="modern"] .sm-dec, html[data-theme-family="modern"] .sm-mod { border-color: var(--m-border); border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .sm-dec-title { color: var(--m-text); }
        html[data-theme-family="modern"] .sm-cat-h { color: var(--m-text-2, var(--m-text)); font-weight: 700; letter-spacing: 0; }
        html[data-theme-family="modern"] .sm-intro code, html[data-theme-family="modern"] .sm-tools code { background: var(--m-surface-2); border-radius: 4px; }
    `;
    document.head.appendChild(style);

    loadMods();
    initVars();
})();
