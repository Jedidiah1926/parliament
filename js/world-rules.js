// ===== 세계지도 · 시나리오 규칙 (자료만 — 화면 없음) =====
// 시나리오의 영토 조건(owns_regions) · 영토 변경 효과(transfer_regions)와 경제권 조건(in_economic_region) · 배정 효과(assign_economic_region)의
// 형식 검사 · 판정 · 변경 계획. 게임(js/scriptmods.js)과 제작기 검사(js/campaign-tools.js)가 같은 규칙을 쓴다. 형식은 docs/CAMPAIGN.md.
//
//   나라 가리키기      { "key": "republic" }  |  { "unassigned": true }      — key는 시나리오의 world.countries[].key
//   경제권 가리키기    { "id": "north" }      |  { "unassigned": true }      — id는 지도의 경제권 id
//   ctx(판정에 쓰는 지금 상태) = {
//     keys: Set<구역 키> | null(지도 없음),  owners: { 구역 키: 실제 국가 id },  regionName?: 키 → 이름,
//     declared: Set<나라 열쇠>,  bindings: { 나라 열쇠: 실제 국가 id },  rowIds: Set<실제 국가 id>,  countryName?: 열쇠 → 이름,
//     zones: Set<경제권 id>,  zoneOf: { 구역 키: 경제권 id },  zoneName?: id → 이름 }
// 판정 결과는 { ok: true, … } 또는 { ok: false, error: '사람이 읽을 이유' } — 잘못된 참조를 조용히 거짓 · 무시로 넘기지 않는다.
(function (root) {
    'use strict';
    const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
    const idOK = id => typeof id === 'string' && /^[a-zA-Z0-9_.-]+$/.test(id);
    const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

    // ---------- 형식 (지금 상태와 상관없이 틀린 것) ----------
    function refShape(ref, idField, what) {
        if (!object(ref)) return `${what}는 { "${idField}": "…" } 또는 { "unassigned": true }로 적습니다.`;
        const byId = has(ref, idField), none = has(ref, 'unassigned');
        if (byId && none) return `${what}에 "${idField}"와 "unassigned"를 함께 쓸 수 없습니다.`;
        if (none) return ref.unassigned === true ? null : '"unassigned"는 true만 쓸 수 있습니다.';
        if (!byId) return `${what}는 { "${idField}": "…" } 또는 { "unassigned": true }로 적습니다.`;
        return idOK(ref[idField]) ? null : `${what}의 "${idField}"는 영문·숫자·_ . -로 적습니다.`;
    }
    function regionsShape(list) {
        if (!Array.isArray(list) || !list.length) return '구역 목록(regions)에 구역을 하나 이상 넣으세요.';
        if (list.some(k => typeof k !== 'string' || !k)) return '구역 목록(regions)은 구역 키 문자열 배열입니다.';
        if (new Set(list).size !== list.length) return '구역 목록(regions)에 같은 구역이 두 번 들어 있습니다.';
        return null;
    }
    const modeShape = m => (m == null || m === 'all' || m === 'any' ? null : '"mode"는 "all"(모두) 또는 "any"(하나 이상)입니다.');
    const ownsShape = v => (!object(v) ? '구역 소유 조건은 { "country", "regions", "mode" } 객체입니다.' : refShape(v.country, 'key', '나라(country)') || regionsShape(v.regions) || modeShape(v.mode));
    const transferShape = v => (!object(v) ? '영토 변경 효과는 { "regions", "to" } 객체입니다.' : regionsShape(v.regions) || refShape(v.to, 'key', '받을 나라(to)'));
    const inZoneShape = v => (!object(v) ? '경제권 소속 조건은 { "zone", "regions", "mode" } 객체입니다.' : refShape(v.zone, 'id', '경제권(zone)') || regionsShape(v.regions) || modeShape(v.mode));
    const assignShape = v => (!object(v) ? '경제권 배정 효과는 { "regions", "to" } 객체입니다.' : regionsShape(v.regions) || refShape(v.to, 'id', '배정할 경제권(to)'));

    // ---------- 지금 상태에 비춰 본 참조 ----------
    const rname = (ctx, key) => (ctx.regionName ? ctx.regionName(key) : key);
    function regionsExist(list, ctx) {
        if (!ctx || !ctx.keys) return '세계지도가 없습니다. 세계 › 지도에서 지도를 불러온 세이브로 시작하세요.';
        const missing = list.filter(k => !ctx.keys.has(k));
        return missing.length ? `지도에 없는 구역: ${missing.join(', ')}. 시작 지도를 확인하세요.` : null;
    }
    // 나라 열쇠 → 실제 국가 id ('' = 미배정)
    function resolveCountry(ref, ctx) {
        if (ref.unassigned) return { ok: true, id: '' };
        const key = ref.key, label = (ctx.countryName && ctx.countryName(key)) || key;
        if (!ctx.declared || !ctx.declared.has(key)) return { ok: false, error: `시나리오에 없는 나라 "${key}"입니다. 세계지도 연결에서 나라를 추가하세요.` };
        const id = ctx.bindings && has(ctx.bindings, key) ? ctx.bindings[key] : null;
        if (typeof id !== 'string' || !id) return { ok: false, error: `나라 "${label}"가 이 시작 나라의 국가에 연결되지 않았습니다. 세계지도 연결을 확인하세요.` };
        if (!ctx.rowIds || !ctx.rowIds.has(id)) return { ok: false, error: `나라 "${label}"에 연결한 국가가 국가 순위에 없습니다. 세계지도 연결을 확인하세요.` };
        return { ok: true, id };
    }
    function resolveZone(ref, ctx) {
        if (ref.unassigned) return { ok: true, id: '' };
        if (!ctx.zones || !ctx.zones.has(ref.id)) return { ok: false, error: `지도에 없는 경제권 "${ref.id}"입니다. 세계 › 경제권에서 확인하세요.` };
        return { ok: true, id: ref.id };
    }
    // 구역의 지금 주인 — 주인으로 적힌 국가가 국가 순위에서 사라졌으면 미배정으로 본다 (지도 화면의 표시와 같게)
    const ownerNow = (ctx, key) => { const id = ctx.owners && has(ctx.owners, key) ? ctx.owners[key] : ''; return id && ctx.rowIds && ctx.rowIds.has(id) ? id : ''; };
    const zoneNow = (ctx, key) => { const id = ctx.zoneOf && has(ctx.zoneOf, key) ? ctx.zoneOf[key] : ''; return id && ctx.zones && ctx.zones.has(id) ? id : ''; };

    // 구역 소유 조건 — { ok, value }
    function owns(spec, ctx) {
        const shape = ownsShape(spec); if (shape) return { ok: false, error: shape };
        const miss = regionsExist(spec.regions, ctx); if (miss) return { ok: false, error: miss };
        const c = resolveCountry(spec.country, ctx); if (!c.ok) return c;
        const hit = k => ownerNow(ctx, k) === c.id;
        return { ok: true, value: spec.mode === 'any' ? spec.regions.some(hit) : spec.regions.every(hit) };
    }
    // 영토 변경 계획 — 전부 검사한 뒤 실제로 바뀔 구역만 { key, from, to } ('' = 미배정). 하나라도 틀리면 아무것도 바꾸지 않는다
    function planTransfer(spec, ctx) {
        const shape = transferShape(spec); if (shape) return { ok: false, error: shape };
        const miss = regionsExist(spec.regions, ctx); if (miss) return { ok: false, error: miss };
        const c = resolveCountry(spec.to, ctx); if (!c.ok) return c;
        const changes = [];
        spec.regions.forEach(key => { const from = ctx.owners && has(ctx.owners, key) ? ctx.owners[key] : ''; if (ownerNow(ctx, key) !== c.id || (c.id === '' && from)) changes.push({ key, from, to: c.id }); });
        return { ok: true, changes, to: c.id };
    }
    // 경제권 소속 조건 · 배정 계획 — 영토와 같은 계약 (전부 검사 뒤 한 번에)
    function inZone(spec, ctx) {
        const shape = inZoneShape(spec); if (shape) return { ok: false, error: shape };
        const miss = regionsExist(spec.regions, ctx); if (miss) return { ok: false, error: miss };
        const z = resolveZone(spec.zone, ctx); if (!z.ok) return z;
        const hit = k => zoneNow(ctx, k) === z.id;
        return { ok: true, value: spec.mode === 'any' ? spec.regions.some(hit) : spec.regions.every(hit) };
    }
    function planAssign(spec, ctx) {
        const shape = assignShape(spec); if (shape) return { ok: false, error: shape };
        const miss = regionsExist(spec.regions, ctx); if (miss) return { ok: false, error: miss };
        const z = resolveZone(spec.to, ctx); if (!z.ok) return z;
        const changes = [];
        spec.regions.forEach(key => { const from = ctx.zoneOf && has(ctx.zoneOf, key) ? ctx.zoneOf[key] : ''; if (zoneNow(ctx, key) !== z.id || (z.id === '' && from)) changes.push({ key, from, to: z.id }); });
        return { ok: true, changes, to: z.id };
    }

    // ---------- 조건 · 효과 안을 훑기 (실행하지 않고 참조만 모은다) ----------
    // visit(kind, key, value, path) — kind: 'cond' | 'effect'. 조건의 all · any · not, 효과의 if(then · else) · random_list 안쪽까지
    function walkCond(cond, visit, path) {
        if (cond == null || typeof cond !== 'object') return;
        if (Array.isArray(cond)) { cond.forEach((c, i) => walkCond(c, visit, `${path}.${i}`)); return; }
        Object.entries(cond).forEach(([k, v]) => {
            const p = `${path}.${k}`;
            if (k === 'all' || k === 'any') (Array.isArray(v) ? v : [v]).forEach((c, i) => walkCond(c, visit, Array.isArray(v) ? `${p}.${i}` : p));
            else if (k === 'not') walkCond(v, visit, p);
            else visit('cond', k, v, p);
        });
    }
    function walkEffects(effects, visit, path) {
        (Array.isArray(effects) ? effects : effects ? [effects] : []).forEach((e, i) => {
            if (!object(e)) return;
            Object.entries(e).forEach(([k, v]) => {
                const p = `${path}.${i}.${k}`;
                visit('effect', k, v, p);
                if (k === 'if' && object(v)) {
                    walkCond(v.condition ?? v.if, visit, p + (has(v, 'condition') ? '.condition' : '.if'));
                    walkEffects(v.then, visit, p + '.then'); walkEffects(v.else, visit, p + '.else');
                } else if (k === 'random_list' && Array.isArray(v)) v.forEach((o, j) => { if (object(o)) walkEffects(o.effects, visit, `${p}.${j}.effects`); });
            });
        });
    }
    const WORLD_KEYS = new Set(['owns_regions', 'transfer_regions', 'in_economic_region', 'assign_economic_region']);
    // 효과 목록을 실행하기 전에 — 지도 · 나라 · 구역 · 경제권 참조가 지금 상태에서 모두 유효한지. 문제없으면 null, 있으면 첫 이유
    function precheck(effects, ctx) {
        let error = null;
        walkEffects(effects, (kind, k, v) => {
            if (error || !WORLD_KEYS.has(k)) return;
            const r = k === 'transfer_regions' ? planTransfer(v, ctx || {}) : k === 'owns_regions' ? owns(v, ctx || {}) : k === 'assign_economic_region' ? planAssign(v, ctx || {}) : inZone(v, ctx || {});
            if (!r.ok) error = r.error;
        }, 'effects');
        return error;
    }
    // 이 조건 · 효과가 세계지도 규칙을 쓰는지
    function uses(condOrEffects, kind) {
        let found = false;
        const visit = (t, k) => { if (WORLD_KEYS.has(k)) found = true; };
        if (kind === 'cond') walkCond(condOrEffects, visit, ''); else walkEffects(condOrEffects, visit, '');
        return found;
    }

    const api = { ownsShape, transferShape, inZoneShape, assignShape, owns, planTransfer, inZone, planAssign, precheck, walkCond, walkEffects, uses, resolveCountry, resolveZone, idOK, WORLD_KEYS };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.HemiWorldRules = api;
})(typeof window === 'undefined' ? globalThis : window);
