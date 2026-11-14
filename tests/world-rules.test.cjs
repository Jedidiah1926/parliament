// 세계지도 · 시나리오 규칙(js/world-rules.js)과 검사기의 중첩 조건 · 효과 · 세계지도 참조 검사(js/campaign-tools.js).
//   node --test tests/world-rules.test.cjs
const test = require('node:test'), assert = require('node:assert/strict');
const W = require('../js/world-rules.js'), T = require('../js/campaign-tools.js'), F = require('./fixtures/border-agreement.cjs');
const ctx = (over = {}) => ({ keys: new Set(['capital', 'riverbank', 'island']), owners: { capital: 'w_republic', riverbank: 'w_federation', island: 'w_federation' },
    declared: new Set(['republic', 'federation']), bindings: { republic: 'w_republic', federation: 'w_federation' }, rowIds: new Set(['w_republic', 'w_federation']),
    zones: new Set(['north']), zoneOf: { capital: 'north' }, ...over });
const rep = { key: 'republic' }, fed = { key: 'federation' }, none = { unassigned: true };
const errs = (d, level = 'error') => T.validate(d).filter(i => i.level === level);
const has = (list, path, re) => list.some(i => i.path === path && (!re || re.test(i.message)));

test('owns_regions — all · any · 미배정, 그리고 틀린 참조는 거짓이 아니라 실패', () => {
    assert.deepEqual(W.owns({ country: rep, regions: ['capital'] }, ctx()), { ok: true, value: true });
    assert.equal(W.owns({ country: rep, regions: ['capital', 'riverbank'] }, ctx()).value, false);
    assert.equal(W.owns({ country: rep, regions: ['capital', 'riverbank'], mode: 'any' }, ctx()).value, true);
    assert.equal(W.owns({ country: fed, regions: ['riverbank', 'island'], mode: 'all' }, ctx()).value, true);
    // 미배정 — 주인이 없거나, 주인으로 적힌 국가가 국가 순위에서 사라졌을 때
    assert.equal(W.owns({ country: none, regions: ['island'] }, ctx()).value, false);
    assert.equal(W.owns({ country: none, regions: ['island'] }, ctx({ owners: { capital: 'w_republic' } })).value, true);
    assert.equal(W.owns({ country: none, regions: ['island'] }, ctx({ owners: { island: 'gone' } })).value, true);
    // 지도 없음 · 없는 구역 · 없는 나라 · 연결 안 된 나라 · 연결한 국가가 사라짐 → 실패 (any에서도 없는 구역을 무시하지 않는다)
    for (const [spec, c, re] of [
        [{ country: rep, regions: ['capital'] }, ctx({ keys: null }), /세계지도가 없습니다/],
        [{ country: none, regions: ['capital'] }, ctx({ keys: null }), /세계지도가 없습니다/],
        [{ country: rep, regions: ['capital', 'nowhere'], mode: 'any' }, ctx(), /지도에 없는 구역: nowhere/],
        [{ country: { key: 'empire' }, regions: ['capital'] }, ctx(), /시나리오에 없는 나라/],
        [{ country: rep, regions: ['capital'] }, ctx({ bindings: {} }), /연결되지 않았습니다/],
        [{ country: rep, regions: ['capital'] }, ctx({ rowIds: new Set(['w_federation']) }), /국가 순위에 없습니다/],
    ]) { const r = W.owns(spec, c); assert.equal(r.ok, false); assert.match(r.error, re); }
    // 형식
    for (const spec of [null, {}, { country: rep }, { country: rep, regions: [] }, { country: rep, regions: ['a', 'a'] }, { country: rep, regions: [1] }, { country: { key: 'republic', unassigned: true }, regions: ['capital'] },
        { country: { unassigned: false }, regions: ['capital'] }, { country: 'republic', regions: ['capital'] }, { country: rep, regions: ['capital'], mode: 'some' }]) assert.equal(W.owns(spec, ctx()).ok, false, JSON.stringify(spec));
});
test('transfer_regions — 전부 검사한 뒤 바뀔 구역만, 하나라도 틀리면 아무것도', () => {
    assert.deepEqual(W.planTransfer({ regions: ['riverbank'], to: rep }, ctx()), { ok: true, changes: [{ key: 'riverbank', from: 'w_federation', to: 'w_republic' }], to: 'w_republic' });
    // 여러 구역 — 이미 그 나라 것은 변경 목록에 없다 (성공한 무변경)
    assert.deepEqual(W.planTransfer({ regions: ['capital', 'riverbank', 'island'], to: rep }, ctx()).changes.map(c => c.key), ['riverbank', 'island']);
    assert.deepEqual(W.planTransfer({ regions: ['capital'], to: rep }, ctx()), { ok: true, changes: [], to: 'w_republic' });
    // 미배정으로
    assert.deepEqual(W.planTransfer({ regions: ['capital', 'island'], to: none }, ctx({ owners: { capital: 'w_republic' } })).changes, [{ key: 'capital', from: 'w_republic', to: '' }]);
    // 하나라도 없는 구역이면 계획 자체가 없다
    const bad = W.planTransfer({ regions: ['riverbank', 'riverbank_old'], to: rep }, ctx());
    assert.equal(bad.ok, false); assert.equal(bad.changes, undefined); assert.match(bad.error, /riverbank_old/);
    assert.equal(W.planTransfer({ regions: ['riverbank'], to: { key: 'empire' } }, ctx()).ok, false);
    assert.equal(W.planTransfer({ regions: ['riverbank'], to: { key: 'republic', unassigned: true } }, ctx()).ok, false);
});
test('경제권 조건 · 배정 — 영토와 같은 계약', () => {
    assert.equal(W.inZone({ zone: { id: 'north' }, regions: ['capital'] }, ctx()).value, true);
    assert.equal(W.inZone({ zone: { id: 'north' }, regions: ['capital', 'island'] }, ctx()).value, false);
    assert.equal(W.inZone({ zone: none, regions: ['island'] }, ctx()).value, true);
    assert.match(W.inZone({ zone: { id: 'south' }, regions: ['capital'] }, ctx()).error, /없는 경제권/);
    assert.deepEqual(W.planAssign({ regions: ['capital', 'island'], to: { id: 'north' } }, ctx()).changes, [{ key: 'island', from: '', to: 'north' }]);
    assert.deepEqual(W.planAssign({ regions: ['capital'], to: none }, ctx()).changes, [{ key: 'capital', from: 'north', to: '' }]);
    assert.equal(W.planAssign({ regions: ['capital', 'x'], to: { id: 'north' } }, ctx()).ok, false);
});
test('사전 검사 — if · random_list 안쪽의 참조까지 보되 실행하지 않는다', () => {
    const ok = [{ set_flag: 'a' }, { if: { condition: { all: [{ flag: 'a' }, { not: { owns_regions: { country: rep, regions: ['capital'] } } }] }, then: [{ transfer_regions: { regions: ['riverbank'], to: rep } }], else: [{ random_list: [{ weight: 1, effects: [{ transfer_regions: { regions: ['island'], to: none } }] }] }] } }];
    assert.equal(W.precheck(ok, ctx()), null);
    assert.match(W.precheck([{ if: { condition: { flag: 'a' }, then: [], else: [{ random_list: [{ weight: 1, effects: [{ transfer_regions: { regions: ['atlantis'], to: rep } }] }] }] } }], ctx()), /atlantis/);
    assert.match(W.precheck([{ if: { condition: { not: { owns_regions: { country: { key: 'empire' }, regions: ['capital'] } } }, then: [] } }], ctx()), /시나리오에 없는 나라/);
    assert.match(W.precheck([{ transfer_regions: { regions: ['riverbank'], to: rep } }], ctx({ keys: null })), /세계지도가 없습니다/);
    assert.match(W.precheck([{ transfer_regions: { regions: ['riverbank'], to: rep } }], null), /세계지도가 없습니다/);
    assert.equal(W.precheck([{ set_flag: 'a' }, { add_var: { name: 'x', value: 1 } }], null), null); // 세계지도를 안 쓰는 효과는 그대로 통과
    assert.equal(W.uses([{ if: { condition: { owns_regions: {} }, then: [] } }]), true);
    assert.equal(W.uses({ any: [{ flag: 'a' }, { not: { owns_regions: {} } }] }, 'cond'), true);
    assert.equal(W.uses([{ set_flag: 'a' }]), false);
});

test('국경 협정 예제는 오류 · 경고 없이 통과하고, 이전 시나리오(새 항목 없음)도 그대로 통과', () => {
    assert.deepEqual(T.validate(F.scenario()), []);
    assert.deepEqual(T.validate(F.scenario('realtime')), []);
    assert.deepEqual(T.validate(T.starter('old')), []);
});
test('세계지도 참조 — 시작 나라마다 나라 연결 · 구역 · 지도를 검사', () => {
    // 없는 구역 → 위치와 사람이 읽는 위치
    let d = F.scenario(); d.events[0].options[0].effects[0].transfer_regions.regions = ['riverbank', 'riverbank_old'];
    let e = errs(d);
    assert.ok(has(e, 'events.0.options.0.effects.0.transfer_regions.regions.1', /없는 구역: riverbank_old/));
    assert.equal(T.describe(d, 'events.0.options.0.effects.0.transfer_regions.regions.1'), '국경 협상 › 협정을 수락한다 › 영토 변경');
    // 나라 목록에 없는 나라
    d = F.scenario(); d.articles[0].trigger.all[1].owns_regions.country = { key: 'empire' };
    assert.ok(has(errs(d), 'articles.0.trigger.all.1.owns_regions.country.key', /나라 목록에 없는 나라: empire/));
    // 연결이 빠진 시작 나라 · 국가 순위에 없는 국가 · 두 나라가 같은 국가 · 목록에 없는 열쇠 · 중복 열쇠
    d = F.scenario(); delete d.starts[0].worldBindings.republic;
    assert.ok(has(errs(d), 'starts.0.worldBindings', /공화국.*연결하세요/));
    d = F.scenario(); d.starts[0].worldBindings.republic = 'w_gone';
    assert.ok(has(errs(d), 'starts.0.worldBindings.republic', /국가 순위에 없습니다/));
    d = F.scenario(); d.starts[0].worldBindings.federation = 'w_republic';
    assert.ok(has(errs(d), 'starts.0.worldBindings.federation', /같은 국가/));
    d = F.scenario(); d.starts[0].worldBindings.empire = 'w_federation';
    assert.ok(has(errs(d), 'starts.0.worldBindings.empire', /없는 열쇠/));
    d = F.scenario(); d.world.countries.push({ key: 'republic', name: '또 공화국' });
    assert.ok(has(errs(d), 'world.countries.2.key', /중복/));
    // 지도 없는 시작 나라(프리셋 · 지도 없는 세이브) — 어느 시작 나라인지 알려 준다
    d = F.scenario(); d.starts.push({ id: 's2', name: '프리셋 나라', kind: 'preset', preset: 'builtin:tutorial' });
    assert.ok(has(errs(d), 'starts.1', /프리셋 나라.*세계지도가 든 세이브/));
    d = F.scenario(); delete d.starts[0].state.worldMap;
    assert.ok(has(errs(d), 'starts.0', /세계지도가 든 세이브/));
    // 시작 나라마다 구역 키가 다르면 그 시작 나라를 짚는다
    d = F.scenario(); const s2 = JSON.parse(JSON.stringify(d.starts[0])); s2.id = 's2'; s2.name = '연방'; s2.state.worldMap.preset.district.svgMap.shapes[1].key = 'riverside'; d.starts.push(s2);
    e = errs(d);
    assert.ok(e.some(i => /시작 나라 “연방”의 지도에 없는 구역: riverbank/.test(i.message)));
    assert.ok(!e.some(i => /시작 나라 “공화국”의 지도에 없는 구역/.test(i.message)));
    // 형식 오류 — 빈 구역 목록 · 잘못된 mode · key와 unassigned를 함께
    d = F.scenario(); d.events[1].trigger.owns_regions = { country: { key: 'republic', unassigned: true }, regions: [], mode: 'some' };
    assert.ok(has(errs(d), 'events.1.trigger.owns_regions'));
    // 처음부터 자기 영토인 구역을 넘기는 효과는 경고
    d = F.scenario(); d.events[0].options[1].effects.push({ transfer_regions: { regions: ['capital'], to: { key: 'republic' } } });
    assert.deepEqual(errs(d), []);
    assert.ok(has(errs(d, 'warning'), 'events.0.options.1.effects.1.transfer_regions', /변화가 없을 수 있습니다/));
    // 검사 시점
    d = F.scenario(); d.events[1].check = 'map';
    assert.ok(has(errs(d), 'events.1.check'));
    for (const c of ['date', 'election', 'world', 'any']) { d = F.scenario(); d.events[1].check = c; assert.deepEqual(errs(d), []); }
});
test('중첩 조건 · 효과 — 아는 연산자의 틀린 인수는 오류, 모르는 연산자는 경고로 보존', () => {
    const base = () => { const d = T.starter('deep'); d.events.push({ id: 'e2', title: '둘째', trigger_only: true, options: [{ text: '확인', effects: [] }] }); return d; };
    let d = base();
    d.events[1].trigger = { all: [{ any: [{ not: { var: { name: 'tension' } } }, { date_after: 'soon' }] }, { chance: 'half' }, { event_fired: 'nope' }, { decision_taken: 'nope' }, { economy: { indicator: 'gold', gte: 1 } }, { approval: { of: 'king', lt: 30 } }, { party_status: { party: 'ruling', is: 'gone' } }, { flag: 7 }] };
    d.events[1].options[0].effects = [{ add_var: { name: 'tension', value: 'x' } }, { support: { party: 'ruling' } }, { fire_event: 'missing' }, { if: { condition: { var: { name: 'tension', gte: 'a' } }, then: [{ set_var: { value: 1 } }], else: [{ random_list: [{ weight: -1, effects: [{ party_color: { party: 'ruling', color: 'red' } }] }] }] } }, { economy: { indicator: 'growth' } }, { toast: 3 }];
    const e = errs(d), p = 'events.1.trigger.all';
    for (const path of [`${p}.0.any.0.not.var`, `${p}.0.any.1.date_after`, `${p}.1.chance`, `${p}.2.event_fired`, `${p}.3.decision_taken`, `${p}.4.economy`, `${p}.5.approval`, `${p}.6.party_status`, `${p}.7.flag`]) assert.ok(has(e, path), path);
    const q = 'events.1.options.0.effects';
    for (const path of [`${q}.0.add_var.value`, `${q}.1.support`, `${q}.2.fire_event`, `${q}.3.if.condition.var.gte`, `${q}.3.if.then.0.set_var`, `${q}.3.if.else.0.random_list.0.weight`, `${q}.3.if.else.0.random_list.0.effects.0.party_color`, `${q}.4.economy`, `${q}.5.toast`]) assert.ok(has(e, path), path);
    // 모르는 연산자 — 경고, 오류 아님, 자료는 그대로
    d = base(); d.events[1].trigger = { any: [{ my_extension: { x: 1 } }] }; d.events[1].options[0].effects = [{ my_effect: true }];
    const before = JSON.stringify(d);
    assert.deepEqual(errs(d), []);
    assert.ok(has(errs(d, 'warning'), 'events.1.trigger.any.0.my_extension') && has(errs(d, 'warning'), 'events.1.options.0.effects.0.my_effect'));
    assert.equal(JSON.stringify(d), before);
    // 확인 필요 — 켜는 곳이 없는 플래그 · 선언하지 않은 변수 (오류가 아니다)
    d = base(); d.events[1].trigger = { all: [{ flag: 'never_set' }, { var: { name: 'undeclared', gte: 1 } }, { flag: 'focus_opening' }, { flag: 'crisis_unrest_done' }] };
    assert.deepEqual(errs(d), []); assert.deepEqual(errs(d, 'warning'), []);
    assert.deepEqual(errs(d, 'check').map(i => i.path).sort(), ['events.1.trigger.all.0.flag', 'events.1.trigger.all.1.var']);
    d = base(); d.events[1].trigger = { flag: 'focus_no_such_focus' };
    assert.ok(has(errs(d, 'warning'), 'events.1.trigger.flag', /해당하는 방향성이 없습니다/));
    // 검사기는 잘못된 입력 하나 때문에 멈추지 않는다
    d = base(); d.events[1].trigger = 'oops'; d.events[1].options[0].effects = 'nope'; d.decisions = [{ id: 'd1', effects: [{ set_flag: 'x' }], available: { flag: 'x' } }];
    assert.ok(has(errs(d), 'events.1.trigger') && has(errs(d), 'events.1.options.0.effects'));
});
test('이벤트 — 조건 없는 반복, 서로 부르는 숨은 이벤트, 격변과 겹치는 ID', () => {
    const d = T.starter('ev');
    d.events.push({ id: 'spam', title: '매일', once: false, options: [{ text: '확인' }] });
    assert.ok(has(errs(d), 'events.1', /조건 없이 반복/));
    d.events[1].trigger = { flag: 'focus_opening' };
    assert.deepEqual(errs(d), []);
    d.events.push({ id: 'h1', hidden: true, trigger_only: true, options: [{ text: 'x', effects: [{ fire_event: 'h2' }] }] }, { id: 'h2', hidden: true, trigger_only: true, immediate: [{ fire_event: 'h1' }], options: [{ text: 'x' }] });
    assert.ok(errs(d).some(i => /서로를 다시 부릅니다: h1 → h2 → h1.*끝나지 않습니다/.test(i.message)));
    d.events[3].hidden = false;
    assert.deepEqual(errs(d), []);
    assert.ok(errs(d, 'check').some(i => /되풀이될 수 있습니다/.test(i.message)));
    d.crises[0].events.push({ id: 'new_dawn', title: '겹침', options: [{ text: 'x' }] });
    assert.ok(has(errs(d), 'crises.0.events.0.id', /겹칩니다/));
});
test('경제권 참조 — 시작 세이브의 economicRegions와 대조, 나라 열쇠 바꾸기 · 구역 목록', () => {
    const withZones = () => { const d = F.scenario(); d.starts[0].state.economicRegions = { version: 1, zones: [{ id: 'north', name: '북부 공업권' }], regions: { capital: 'north' } }; return d; };
    let d = withZones();
    d.events[1].trigger = { in_economic_region: { zone: { id: 'north' }, regions: ['capital'] } };
    d.events[0].options[1].effects.push({ assign_economic_region: { regions: ['riverbank'], to: { id: 'north' } } });
    assert.deepEqual(T.validate(d), []);
    d = withZones(); d.events[1].trigger = { in_economic_region: { zone: { id: 'south' }, regions: ['capital', 'moon'] } };
    let e = errs(d);
    assert.ok(has(e, 'events.1.trigger.in_economic_region.zone.id', /없는 경제권: south/) && has(e, 'events.1.trigger.in_economic_region.regions.1', /없는 구역: moon/));
    d = withZones(); d.events[0].options[1].effects.push({ assign_economic_region: { regions: ['capital'], to: { id: 'north' } } }, { assign_economic_region: { regions: ['island'], to: { unassigned: true } } });
    assert.deepEqual(errs(d), []);
    assert.equal(errs(d, 'warning').filter(i => /변화가 없을 수 있습니다/.test(i.message)).length, 2); // 처음부터 그 경제권 · 처음부터 미배정
    d = withZones(); d.events[0].options[1].effects.push({ assign_economic_region: { regions: [], to: { id: 'north', unassigned: true } } });
    assert.ok(has(errs(d), 'events.0.options.1.effects.1.assign_economic_region'));
    // 경제권만 쓰는 시나리오도 지도가 든 시작 세이브가 필요하다
    d = T.starter('eco'); d.events[0].options[0].effects = [{ assign_economic_region: { regions: ['a'], to: { unassigned: true } } }];
    assert.ok(has(errs(d), 'starts.0', /경제권 조건·효과/));
    assert.equal(T.describe(withZones(), 'events.1.trigger.in_economic_region.zone.id'), '새로운 국경 › 발생 조건 › 경제권 소속');

    // 나라 열쇠 바꾸기 — 목록 · 연결 · 조건/효과 속 참조. 시작 세이브 속과 이야기 글은 건드리지 않는다
    d = F.scenario(); d.lore = 'republic의 이야기'; d.starts[0].state.note = { owns_regions: { country: { key: 'republic' } } };
    assert.equal(T.renameCountry(d, 'republic', 'rep'), true);
    assert.deepEqual([d.world.countries[0].key, d.starts[0].worldBindings.rep, d.starts[0].worldBindings.republic, d.events[0].options[0].effects[0].transfer_regions.to.key, d.events[1].trigger.owns_regions.country.key, d.focus[1].available.all[1].owns_regions.country.key, d.lore, d.starts[0].state.note.owns_regions.country.key],
        ['rep', 'w_republic', undefined, 'rep', 'rep', 'rep', 'republic의 이야기', 'republic']);
    assert.deepEqual(Object.keys(d.starts[0].worldBindings), ['rep', 'federation']); // 순서 유지
    assert.deepEqual(T.validate(d), []);
    for (const [from, to] of [['rep', 'federation'], ['rep', 'bad key'], ['nope', 'x'], ['rep', 'rep']]) assert.equal(T.renameCountry(d, from, to), false);
    // 가이드 입력이 쓰는 목록 — 지도가 든 첫 시작 나라의 구역 · 국가 · 경제권
    const cat = T.worldCatalog(withZones());
    assert.deepEqual(cat.regions, [{ key: 'capital', name: '수도' }, { key: 'riverbank', name: '강변' }, { key: 'island', name: '섬' }]);
    assert.deepEqual(cat.zones, [{ id: 'north', name: '북부 공업권' }]);
    assert.deepEqual(cat.starts[0].rows.map(r => r.id), ['w_republic', 'w_federation']);
    assert.deepEqual(T.worldCatalog(T.starter('none')), { regions: [], zones: [], starts: [{ index: 0, hasState: false, hasMap: false, regions: [], rows: [], zones: [] }] });
});
test('함께 싣는 예제 파일(docs/example-scenario)은 실제 세이브를 담고 검사를 통과한다', () => {
    const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), dir = path.join(__dirname, '..', 'docs', 'example-scenario');
    const d = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, 'border-agreement.hemicmp'))));
    assert.deepEqual(T.validate(d), []);
    assert.ok(Array.isArray(d.starts[0].state.parliament.parties) && d.starts[0].state.parliament.parties.length > 3); // 실제로 플레이할 수 있는 시작 세이브
    assert.deepEqual(d.starts[0].state.worldMap.owners, F.worldMap().owners);
    const fixture = F.scenario();
    for (const k of ['world', 'events', 'focus', 'articles', 'endings', 'time', 'decisions', 'crises']) assert.deepEqual(d[k], fixture[k], k); // 이야기 부분은 시험이 돌리는 원본과 같다 (제작기가 기본 칸만 더한다)
    assert.deepEqual(d.starts[0].worldBindings, fixture.starts[0].worldBindings);
    const map = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(dir, 'border-map.hemimap'))));
    assert.deepEqual({ ...require('../js/world-map-data.js').read(map).owners }, F.worldMap().owners);
});
test('플레이 규칙 — 지원하는 잠금만 조용히 통과, 모르는 잠금은 경고(적용되지 않음), 형식 오류', () => {
    let d = F.scenario(); d.playRules = { locks: { worldMap: true, economicRegions: false } };
    assert.deepEqual(T.validate(d), []);
    d.playRules.locks.parties = true; d.playRules.locks.time = true;
    assert.deepEqual(errs(d), []);
    assert.ok(!has(errs(d, 'warning'), 'playRules.locks.parties'));
    assert.ok(has(errs(d, 'warning'), 'playRules.locks.time', /아직 지원하지 않습니다/));
    d = F.scenario(); d.playRules = { locks: { worldMap: 'yes' } }; assert.ok(has(errs(d), 'playRules.locks.worldMap'));
    d = F.scenario(); d.playRules = { locks: [] }; assert.ok(has(errs(d), 'playRules.locks'));
    d = F.scenario(); d.playRules = 'strict'; assert.ok(has(errs(d), 'playRules'));
    assert.deepEqual(T.LOCKS, ['parties', 'seats', 'elections', 'government', 'opinion', 'economy', 'worldMap', 'economicRegions']);
});
