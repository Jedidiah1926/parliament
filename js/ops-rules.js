// ===== 시나리오 국가 운영 규칙 — 자원 · 시설/생산 · 기술 · 군사 · 무역 (자료만, 화면 없음) =====
// 시나리오 작성 자료(resources · facilities · tech · units · trades)와 진행 상태(campaign.ops)를 다룬다. 게임(js/campaign-ops.js)과
// 제작기 검사(js/campaign-tools.js) · 시험(tests/ops-rules.test.cjs)이 같은 규칙을 쓴다. 형식은 docs/CAMPAIGN.md "국가 운영".
//
// 계산 규칙 (모두 시나리오의 하루 단위 — 턴제 1턴 = 1일, 실시간은 날짜가 바뀔 때 한 번)
//   1) 시설: 목록 순서대로, 종류마다 (소비 + 유지비) × 수량을 낼 수 있으면 내고 생산 × 수량을 얻는다. 못 내면 그 종류는 그날 통째로 멈춘다(부족 시 중단)
//   2) 부대: 종류마다 유지비 × 수량을 낼 수 있으면 낸다. 못 내면 그날 "보급 부족" — 그 종류의 전력이 절반으로 계산된다
//   3) 무역: 계약 순서대로, 내줄 것(give)을 모두 낼 수 있으면 내고 받을 것(get)을 받는다(한꺼번에). 못 내면 계약이 "이행 실패"로 끝난다
//   4) 저장 한도(max)를 넘는 몫은 버린다. 재고는 0 아래로 내려가지 않는다 — 내야 할 것을 못 내면 그 행동 자체를 하지 않는다
//   건설 · 연구 · 모집은 시작할 때 비용을 한 번에 내고(못 내면 시작하지 않음), 기간이 지나면 끝난다. 취소하면 낸 비용은 돌려받지 않는다
//   상대국의 재고 · 경제는 시뮬레이션하지 않는다 — 무역 상대는 시나리오의 나라(world.countries) 이름표다
(function (root) {
    'use strict';
    const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const list = (d, k) => (d && Array.isArray(d[k]) ? d[k].filter(object) : []);
    const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const r3 = v => Math.round(v * 1000) / 1000;
    const byId = (d, k, id) => list(d, k).find(x => x.id === id) || null;
    const KINDS = ['resources', 'facilities', 'tech', 'units', 'trades'];
    const uses = d => KINDS.some(k => list(d, k).length);
    const amounts = m => (object(m) ? Object.entries(m).filter(([, v]) => Number.isFinite(Number(v)) && Number(v) !== 0).map(([k, v]) => [k, Number(v)]) : []);
    const scale = (m, n) => Object.fromEntries(amounts(m).map(([k, v]) => [k, v * n]));
    const add = (a, b) => { const o = { ...a }; Object.entries(b).forEach(([k, v]) => { o[k] = (o[k] || 0) + v; }); return o; };

    // ---------- 진행 상태 ----------
    // ops = { stock: {자원: 수량}, facilities: {시설: 수}, units: {부대: 수}, tech: {done: {기술: 날}, cur: {id, started, days} | null},
    //         building: [{ id, started, days }], recruiting: [{ id, started, days }], trades: {계약: { status, started, ends }}, day: 마지막으로 계산한 날,
    //         shortage: { facilities: [..], units: [..] }, log: [최근 일 문장] }
    function normalize(ops, d, day) {
        const o = object(ops) ? JSON.parse(JSON.stringify(ops)) : null;
        const fresh = !o;
        const s = o || {};
        s.stock = object(s.stock) ? s.stock : {};
        s.facilities = object(s.facilities) ? s.facilities : {};
        s.units = object(s.units) ? s.units : {};
        s.tech = object(s.tech) ? s.tech : {};
        s.tech.done = object(s.tech.done) ? s.tech.done : {};
        if (!object(s.tech.cur)) s.tech.cur = null;
        s.building = Array.isArray(s.building) ? s.building.filter(object) : [];
        s.recruiting = Array.isArray(s.recruiting) ? s.recruiting.filter(object) : [];
        s.trades = object(s.trades) ? s.trades : {};
        s.shortage = object(s.shortage) ? s.shortage : { facilities: [], units: [] };
        s.log = Array.isArray(s.log) ? s.log.slice(-30) : [];
        if (fresh) {
            // 처음 시작 — 작성 자료의 시작 값
            list(d, 'resources').forEach(r => { s.stock[r.id] = clampStock(d, r.id, num(r.start)); });
            list(d, 'facilities').forEach(f => { if (num(f.start) > 0) s.facilities[f.id] = Math.floor(num(f.start)); });
            list(d, 'units').forEach(u => { if (num(u.start) > 0) s.units[u.id] = Math.floor(num(u.start)); });
            list(d, 'tech').forEach(t => { if (t.start === true) s.tech.done[t.id] = 0; });
        }
        // 작성 자료에 새로 생긴 자원은 시작 값으로 (예전 세이브)
        list(d, 'resources').forEach(r => { if (!(r.id in s.stock)) s.stock[r.id] = clampStock(d, r.id, num(r.start)); });
        if (!Number.isFinite(s.day)) s.day = Number.isFinite(day) ? Math.floor(day) : 0;
        return s;
    }
    function clampStock(d, id, v) { const r = byId(d, 'resources', id), max = r && r.max != null && Number.isFinite(Number(r.max)) ? Number(r.max) : Infinity; return r3(Math.max(0, Math.min(max, v))); }
    const canPay = (s, cost) => amounts(cost).every(([k, v]) => v <= 0 || num(s.stock[k]) + 1e-9 >= v);
    const lacking = (s, cost, d) => amounts(cost).filter(([k, v]) => v > 0 && num(s.stock[k]) + 1e-9 < v).map(([k, v]) => `${nameOf(d, 'resources', k)} ${fmt(v - num(s.stock[k]))} 부족`);
    function pay(s, cost, d) { amounts(cost).forEach(([k, v]) => { s.stock[k] = clampStock(d, k, num(s.stock[k]) - v); }); }
    function gain(s, got, d) { amounts(got).forEach(([k, v]) => { s.stock[k] = clampStock(d, k, num(s.stock[k]) + v); }); }
    const fmt = v => String(r3(v));
    const nameOf = (d, k, id) => { const x = byId(d, k, id); return (x && (x.name || x.title)) || id; };
    const note = (s, text) => { s.log.push(text); if (s.log.length > 30) s.log.shift(); };

    // ---------- 하루 계산 ----------
    function dailyStep(s, d, dayNo) {
        const shortF = [], shortU = [];
        list(d, 'facilities').forEach(f => {
            const n = Math.floor(num(s.facilities[f.id])); if (n <= 0) return;
            const need = add(scale(f.consume, n), scale(f.upkeep, n));
            if (!canPay(s, need)) { shortF.push(f.id); return; }
            pay(s, need, d); gain(s, scale(f.produce, n), d);
        });
        list(d, 'units').forEach(u => {
            const n = Math.floor(num(s.units[u.id])); if (n <= 0) return;
            const need = scale(u.upkeep, n);
            if (!canPay(s, need)) { shortU.push(u.id); return; }
            pay(s, need, d);
        });
        list(d, 'trades').forEach(t => {
            const st = s.trades[t.id]; if (!st || st.status !== 'active') return;
            if (st.ends != null && dayNo > st.ends) { st.status = 'done'; note(s, `무역 완료: ${t.title || t.id}`); return; }
            if (!canPay(s, t.give)) { st.status = 'failed'; st.ended = dayNo; note(s, `무역 이행 실패: ${t.title || t.id} (${lacking(s, t.give, d).join(', ')})`); return; }
            pay(s, t.give, d); gain(s, t.get, d);
        });
        const newly = shortF.filter(id => !s.shortage.facilities.includes(id)).map(id => nameOf(d, 'facilities', id));
        if (newly.length) note(s, `가동 중단(투입 부족): ${newly.join(', ')}`);
        s.shortage = { facilities: shortF, units: shortU };
    }
    // 지금 날(소수 = 시간)까지 — 지난 날마다 하루 계산, 기간이 찬 건설 · 연구 · 모집을 끝낸다. 끝난 것 목록을 돌려준다
    function advance(s, d, now) {
        const out = { built: [], researched: [], recruited: [], days: 0 };
        if (!Number.isFinite(now)) return out;
        const today = Math.floor(now + 1e-9);
        // 오래 멈춰 있던 세이브라도 한 번에 너무 많이 돌지 않게 (366일까지 차례로, 그보다 많으면 마지막 366일만)
        if (today - s.day > 366) s.day = today - 366;
        while (s.day < today) { s.day++; dailyStep(s, d, s.day); out.days++; }
        const due = j => now - num(j.started) + 1e-9 >= num(j.days);
        s.building = s.building.filter(j => { if (!due(j)) return true; const f = byId(d, 'facilities', j.id); if (f) { s.facilities[j.id] = Math.floor(num(s.facilities[j.id])) + 1; out.built.push(j.id); note(s, `건설 완료: ${f.name || f.id}`); } return false; });
        s.recruiting = s.recruiting.filter(j => { if (!due(j)) return true; const u = byId(d, 'units', j.id); if (u) { s.units[j.id] = Math.floor(num(s.units[j.id])) + 1; out.recruited.push(j.id); note(s, `편성 완료: ${u.name || u.id}`); } return false; });
        const cur = s.tech.cur;
        if (cur && due(cur)) { s.tech.cur = null; s.tech.done[cur.id] = today; out.researched.push(cur.id); note(s, `연구 완료: ${nameOf(d, 'tech', cur.id)}`); }
        return out;
    }

    // ---------- 시작할 수 있나 · 시작하기 ----------
    const techDone = (s, id) => Object.prototype.hasOwnProperty.call(s.tech.done, id);
    const missingTech = (s, req) => (Array.isArray(req) ? req : []).filter(id => !techDone(s, id));
    function techState(s, d, t) {
        if (techDone(s, t.id)) return 'done';
        if (s.tech.cur && s.tech.cur.id === t.id) return 'current';
        const taken = id => techDone(s, id) || (s.tech.cur && s.tech.cur.id === id);
        if ((t.exclusive || []).some(taken) || list(d, 'tech').some(g => g.id !== t.id && taken(g.id) && (g.exclusive || []).includes(t.id))) return 'blocked';
        if ((t.prereq || []).some(id => !techDone(s, id))) return 'locked';
        if ((t.any || []).length && !(t.any || []).some(id => techDone(s, id))) return 'locked';
        return 'available';
    }
    // 이유(글자) 또는 null. test(cond)는 조건 판정 (없으면 조건 없음으로 봄)
    function whyNot(kind, s, d, id, test) {
        const slots = k => Math.max(1, Math.floor(num(d[k]) || 1));
        if (kind === 'facility') {
            const f = byId(d, 'facilities', id); if (!f) return '없는 시설';
            if (f.buildable === false) return '지을 수 없는 시설';
            const miss = missingTech(s, f.requires); if (miss.length) return `먼저 연구: ${miss.map(x => nameOf(d, 'tech', x)).join(', ')}`;
            const have = Math.floor(num(s.facilities[id])) + s.building.filter(j => j.id === id).length;
            if (f.max != null && have >= num(f.max)) return `최대 ${num(f.max)}개`;
            if (s.building.length >= slots('buildSlots')) return '건설 중인 시설이 있습니다';
            if (f.available && test && !test(f.available)) return f.requirement_text || '조건 미충족';
            if (!canPay(s, f.cost)) return lacking(s, f.cost, d).join(', ');
            return null;
        }
        if (kind === 'unit') {
            const u = byId(d, 'units', id); if (!u) return '없는 부대';
            if (u.recruitable === false) return '편성할 수 없는 부대';
            const miss = missingTech(s, u.requires); if (miss.length) return `먼저 연구: ${miss.map(x => nameOf(d, 'tech', x)).join(', ')}`;
            const have = Math.floor(num(s.units[id])) + s.recruiting.filter(j => j.id === id).length;
            if (u.max != null && have >= num(u.max)) return `최대 ${num(u.max)}개`;
            if (s.recruiting.length >= slots('recruitSlots')) return '편성 중인 부대가 있습니다';
            if (u.available && test && !test(u.available)) return u.requirement_text || '조건 미충족';
            if (!canPay(s, u.cost)) return lacking(s, u.cost, d).join(', ');
            return null;
        }
        if (kind === 'tech') {
            const t = byId(d, 'tech', id); if (!t) return '없는 기술';
            const st = techState(s, d, t);
            if (st === 'done') return '이미 연구함'; if (st === 'current') return '연구 중'; if (st === 'blocked') return '다른 길을 골랐습니다'; if (st === 'locked') return '선행 기술 필요';
            if (s.tech.cur) return '다른 기술을 연구 중입니다';
            if (t.available && test && !test(t.available)) return t.requirement_text || '조건 미충족';
            if (!canPay(s, t.cost)) return lacking(s, t.cost, d).join(', ');
            return null;
        }
        if (kind === 'trade') {
            const t = byId(d, 'trades', id); if (!t) return '없는 계약';
            const st = s.trades[id];
            if (st && st.status === 'active') return '진행 중';
            if (st && t.repeat !== true) return '이미 맺었던 계약';
            if (t.available && test && !test(t.available)) return t.requirement_text || '조건 미충족';
            if (!canPay(s, t.give)) return lacking(s, t.give, d).join(', ');
            return null;
        }
        return '알 수 없는 행동';
    }
    // 시작 — 검사 → 비용 → 상태. 성공하면 null, 아니면 이유 (아무것도 바꾸지 않음)
    function start(kind, s, d, id, now, test) {
        const why = whyNot(kind, s, d, id, test); if (why) return why;
        const day = Number.isFinite(now) ? now : s.day;
        if (kind === 'facility') { const f = byId(d, 'facilities', id); pay(s, f.cost, d); s.building.push({ id, started: day, days: Math.max(0, num(f.days)) }); }
        if (kind === 'unit') { const u = byId(d, 'units', id); pay(s, u.cost, d); s.recruiting.push({ id, started: day, days: Math.max(0, num(u.days)) }); }
        if (kind === 'tech') { const t = byId(d, 'tech', id); pay(s, t.cost, d); s.tech.cur = { id, started: day, days: Math.max(0, num(t.days)) }; }
        if (kind === 'trade') { const t = byId(d, 'trades', id); s.trades[id] = { status: 'active', started: Math.floor(day), ends: num(t.days) > 0 ? Math.floor(day) + Math.floor(num(t.days)) : null }; note(s, `무역 체결: ${t.title || t.id}`); }
        return null;
    }
    function cancel(kind, s, d, id) {
        if (kind === 'tech') { if (s.tech.cur && s.tech.cur.id === id) { s.tech.cur = null; return true; } return false; }
        if (kind === 'facility') { const i = s.building.findIndex(j => j.id === id); if (i < 0) return false; s.building.splice(i, 1); return true; }
        if (kind === 'unit') { const i = s.recruiting.findIndex(j => j.id === id); if (i < 0) return false; s.recruiting.splice(i, 1); return true; }
        if (kind === 'trade') { const st = s.trades[id]; if (!st || st.status !== 'active') return false; st.status = 'cancelled'; st.ended = s.day; note(s, `무역 중단: ${nameOf(d, 'trades', id)}`); return true; }
        return false;
    }

    // ---------- 보여 줄 값 ----------
    // 오늘 계산을 한 번 더 한다면 자원마다 얼마나 바뀌나 (예상 — 부족으로 멈출 시설 · 실패할 계약도 반영)
    function forecast(s, d) {
        const copy = JSON.parse(JSON.stringify(s)), before = { ...copy.stock };
        dailyStep(copy, d, copy.day + 1);
        return Object.fromEntries(list(d, 'resources').map(r => [r.id, r3(num(copy.stock[r.id]) - num(before[r.id]))]));
    }
    function strength(s, d) {
        return r3(list(d, 'units').reduce((t, u) => t + Math.floor(num(s.units[u.id])) * num(u.strength) * (s.shortage.units.includes(u.id) ? 0.5 : 1), 0));
    }

    // ---------- 스크립트 조건 · 효과 ----------
    const CMP = ['gt', 'gte', 'lt', 'lte', 'eq', 'ne'];
    function cmp(v, spec) {
        let ok = true;
        if ('gt' in spec) ok = ok && v > Number(spec.gt);
        if ('gte' in spec) ok = ok && v >= Number(spec.gte);
        if ('lt' in spec) ok = ok && v < Number(spec.lt);
        if ('lte' in spec) ok = ok && v <= Number(spec.lte);
        if ('eq' in spec) ok = ok && v === Number(spec.eq);
        if ('ne' in spec) ok = ok && v !== Number(spec.ne);
        return ok;
    }
    const COND = {
        resource: { kind: 'resources', check: v => object(v) && typeof v.id === 'string' && CMP.some(k => k in v), read: (s, v) => num(s.stock[v.id]) },
        facility_count: { kind: 'facilities', check: v => object(v) && typeof v.id === 'string' && CMP.some(k => k in v), read: (s, v) => Math.floor(num(s.facilities[v.id])) },
        unit_count: { kind: 'units', check: v => object(v) && typeof v.id === 'string' && CMP.some(k => k in v), read: (s, v) => Math.floor(num(s.units[v.id])) },
        military_strength: { kind: null, check: v => object(v) && CMP.some(k => k in v), read: (s, v, d) => strength(s, d) },
        tech_done: { kind: 'tech', check: v => typeof v === 'string' && !!v, bool: (s, v) => techDone(s, v) },
        trade_active: { kind: 'trades', check: v => typeof v === 'string' && !!v, bool: (s, v) => !!(s.trades[v] && s.trades[v].status === 'active') },
    };
    const EFF = {
        add_resource: { kind: 'resources', check: v => object(v) && typeof v.id === 'string' && Number.isFinite(Number(v.value)) },
        set_resource: { kind: 'resources', check: v => object(v) && typeof v.id === 'string' && Number.isFinite(Number(v.value)) },
        add_facility: { kind: 'facilities', check: v => object(v) && typeof v.id === 'string' && Number.isInteger(Number(v.count)) },
        add_units: { kind: 'units', check: v => object(v) && typeof v.id === 'string' && Number.isInteger(Number(v.count)) },
        grant_tech: { kind: 'tech', check: v => typeof v === 'string' && !!v },
        start_trade: { kind: 'trades', check: v => typeof v === 'string' && !!v },
        end_trade: { kind: 'trades', check: v => typeof v === 'string' && !!v },
    };
    const refId = v => (typeof v === 'string' ? v : v && v.id);
    // 조건 판정 — { ok, value } 또는 { ok: false, error }
    function testCond(k, v, s, d) {
        const c = COND[k]; if (!c) return null;
        if (!c.check(v)) return { ok: false, error: `${k}: 형식이 틀렸습니다` };
        if (c.kind && !byId(d, c.kind, refId(v))) return { ok: false, error: `${k}: 없는 항목 "${refId(v)}"` };
        return { ok: true, value: c.bool ? c.bool(s, v) : cmp(c.read(s, v, d), v) };
    }
    // 효과 적용 — null(성공) 또는 이유. 틀린 효과는 아무것도 바꾸지 않는다
    function runEffect(k, v, s, d, now) {
        const e = EFF[k]; if (!e) return `${k}: 모르는 효과`;
        if (!e.check(v)) return `${k}: 형식이 틀렸습니다`;
        const id = refId(v);
        if (!byId(d, e.kind, id)) return `${k}: 없는 항목 "${id}"`;
        if (k === 'add_resource') s.stock[id] = clampStock(d, id, num(s.stock[id]) + Number(v.value));
        if (k === 'set_resource') s.stock[id] = clampStock(d, id, Number(v.value));
        if (k === 'add_facility') { const f = byId(d, 'facilities', id), max = f.max != null ? num(f.max) : Infinity; s.facilities[id] = Math.max(0, Math.min(max, Math.floor(num(s.facilities[id])) + Number(v.count))); }
        if (k === 'add_units') { const u = byId(d, 'units', id), max = u.max != null ? num(u.max) : Infinity; s.units[id] = Math.max(0, Math.min(max, Math.floor(num(s.units[id])) + Number(v.count))); }
        if (k === 'grant_tech') { if (!techDone(s, id)) { if (s.tech.cur && s.tech.cur.id === id) s.tech.cur = null; s.tech.done[id] = Math.floor(Number.isFinite(now) ? now : s.day); } }
        if (k === 'start_trade') { const t = byId(d, 'trades', id); if (!(s.trades[id] && s.trades[id].status === 'active')) { const day = Math.floor(Number.isFinite(now) ? now : s.day); s.trades[id] = { status: 'active', started: day, ends: num(t.days) > 0 ? day + Math.floor(num(t.days)) : null }; note(s, `무역 체결: ${t.title || t.id}`); } }
        if (k === 'end_trade') { const st = s.trades[id]; if (st && st.status === 'active') { st.status = 'cancelled'; st.ended = s.day; } }
        return null;
    }

    const api = { KINDS, uses, normalize, advance, dailyStep, whyNot, start, cancel, forecast, strength, techState, techDone, canPay, lacking, pay, COND, EFF, testCond, runEffect, amounts, byId, list, CMP };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiOps = api;
})(typeof window === 'undefined' ? globalThis : window);
