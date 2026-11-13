// 시나리오 국가 운영 규칙 (js/ops-rules.js) — 자원 · 시설 · 기술 · 군사 · 무역의 하루 계산과 시작/취소.
//   node --test tests/ops-rules.test.cjs
const test = require('node:test'), assert = require('node:assert/strict'), O = require('../js/ops-rules.js');
const data = () => ({
    resources: [{ id: 'money', name: '국고', start: 100 }, { id: 'coal', name: '석탄', start: 10, max: 50 }, { id: 'steel', name: '철강', start: 0 }, { id: 'food', name: '식량', start: 20 }],
    facilities: [
        { id: 'mine', name: '탄광', cost: { money: 30 }, days: 3, produce: { coal: 5 }, upkeep: { money: 1 }, start: 1 },
        { id: 'mill', name: '제철소', cost: { money: 50, coal: 5 }, days: 5, consume: { coal: 4 }, produce: { steel: 2 }, requires: ['bessemer'], max: 2 },
    ],
    tech: [{ id: 'bessemer', title: '베세머 공법', days: 4, cost: { money: 20 } }, { id: 'open_hearth', title: '평로', prereq: ['bessemer'], days: 2, exclusive: ['crucible'] }, { id: 'crucible', title: '도가니', prereq: ['bessemer'], days: 2 }],
    units: [{ id: 'inf', name: '보병', cost: { money: 10, food: 5 }, days: 2, upkeep: { food: 3 }, strength: 4, start: 2 }],
    trades: [{ id: 'coal_for_food', title: '석탄 수출', partner: 'federation', give: { coal: 3 }, get: { food: 4, money: 2 }, days: 5 }],
});
test('처음 상태는 작성 자료의 시작 값, 예전 세이브에는 새 자원이 시작 값으로 붙는다', () => {
    const d = data(), s = O.normalize(null, d, 10);
    assert.deepEqual(s.stock, { money: 100, coal: 10, steel: 0, food: 20 });
    assert.deepEqual([s.facilities, s.units, s.day], [{ mine: 1 }, { inf: 2 }, 10]);
    d.resources.push({ id: 'oil', start: 7 });
    assert.equal(O.normalize(s, d, 10).stock.oil, 7);
    assert.equal(O.normalize(s, d, 10).stock.money, 100); // 있던 것은 그대로
    assert.equal(O.uses(d), true); assert.equal(O.uses({}), false);
});
test('하루 계산 — 시설 생산 · 유지비, 부대 유지비, 무역, 저장 한도', () => {
    const d = data(), s = O.normalize(null, d, 0);
    O.advance(s, d, 1);
    // 탄광 1: 국고 -1, 석탄 +5 / 보병 2: 식량 -6
    assert.deepEqual(s.stock, { money: 99, coal: 15, steel: 0, food: 14 });
    assert.equal(s.day, 1);
    assert.equal(O.advance(s, d, 1.9).days, 0); // 같은 날 안에서는 다시 계산하지 않는다 (실시간 시간 단위 틱)
    s.facilities.mine = 20; O.advance(s, d, 2);
    assert.equal(s.stock.coal, 50); // 한도
    assert.deepEqual(O.forecast(s, d), { money: -20, coal: 0, steel: 0, food: -6 });
});
test('투입이 모자라면 그 시설은 그날 통째로 멈추고, 부대는 보급 부족(전력 절반)', () => {
    const d = data(), s = O.normalize(null, d, 0);
    s.facilities.mill = 2; s.stock.coal = 5; // 제철소 2개는 석탄 8이 필요 — 탄광이 먼저 5를 만들어 10이 된 뒤 8을 쓴다
    O.advance(s, d, 1);
    assert.deepEqual([s.stock.coal, s.stock.steel], [2, 4]);
    O.advance(s, d, 2); // 탄광 +5 → 7, 제철소는 8이 필요해 멈춤
    assert.deepEqual([s.stock.coal, s.stock.steel, s.shortage.facilities], [7, 4, ['mill']]);
    assert.match(s.log.join('|'), /가동 중단\(투입 부족\): 제철소/);
    assert.equal(O.strength(s, d), 8);
    s.stock.food = 1; O.advance(s, d, 3);
    assert.deepEqual([s.shortage.units, s.stock.food, O.strength(s, d)], [['inf'], 1, 4]);
});
test('건설 · 연구 · 모집 — 비용은 시작 때 한 번, 기간이 차면 완료, 못 내면 아무것도 바뀌지 않는다', () => {
    const d = data(), s = O.normalize(null, d, 0);
    assert.match(O.whyNot('facility', s, d, 'mill'), /먼저 연구: 베세머 공법/);
    assert.equal(O.start('tech', s, d, 'bessemer', 0), null);
    assert.equal(s.stock.money, 80);
    assert.equal(O.whyNot('tech', s, d, 'open_hearth'), '선행 기술 필요');
    assert.equal(O.start('tech', s, d, 'crucible', 0), '선행 기술 필요');
    O.advance(s, d, 3.5); assert.equal(O.techDone(s, 'bessemer'), false);
    const r = O.advance(s, d, 4); assert.deepEqual(r.researched, ['bessemer']); assert.equal(O.techDone(s, 'bessemer'), true);
    // 배타 — 하나를 고르면 다른 쪽은 막힌다
    assert.equal(O.start('tech', s, d, 'open_hearth', 4), null);
    assert.equal(O.techState(s, d, d.tech[2]), 'blocked');
    // 건설 — 슬롯 하나, 최대 수
    s.stock.money = 10; const before = JSON.stringify(s);
    assert.match(O.start('facility', s, d, 'mill', 4), /국고 40 부족/);
    assert.equal(JSON.stringify(s), before); // 못 내면 아무것도 바뀌지 않는다
    s.stock.money = 76;
    assert.equal(O.start('facility', s, d, 'mill', 4), null);
    assert.equal(O.whyNot('facility', s, d, 'mine'), '건설 중인 시설이 있습니다');
    O.advance(s, d, 9); assert.equal(s.facilities.mill, 1);
    s.facilities.mill = 2; assert.equal(O.whyNot('facility', s, d, 'mill'), '최대 2개');
    // 모집 · 취소(비용은 돌려받지 않음) — 보병 유지비로 식량이 줄었으니 채워 둔다
    s.stock.food = 50;
    const m0 = s.stock.money; assert.equal(O.start('unit', s, d, 'inf', 9), null); assert.equal(s.stock.money, m0 - 10);
    assert.equal(O.cancel('unit', s, d, 'inf'), true); assert.equal(s.recruiting.length, 0); assert.equal(s.stock.money, m0 - 10);
});
test('무역 — 하루마다 내줄 것을 모두 낼 수 있을 때만 주고받고, 못 내면 이행 실패로 끝난다', () => {
    const d = data(), s = O.normalize(null, d, 0);
    assert.equal(O.start('trade', s, d, 'coal_for_food', 0), null);
    assert.deepEqual(s.trades.coal_for_food, { status: 'active', started: 0, ends: 5 });
    O.advance(s, d, 1); // 탄광 +5 → 15, 무역 -3 → 12 / 식량 20 - 6 + 4 = 18 / 국고 100 - 1 + 2
    assert.deepEqual([s.stock.coal, s.stock.food, s.stock.money], [12, 18, 101]);
    assert.equal(O.whyNot('trade', s, d, 'coal_for_food'), '진행 중');
    s.facilities.mine = 0; s.stock.coal = 2; O.advance(s, d, 2);
    assert.equal(s.trades.coal_for_food.status, 'failed'); assert.equal(s.stock.coal, 2); assert.equal(s.stock.food, 12); // 받지도 않는다
    assert.equal(O.whyNot('trade', s, d, 'coal_for_food'), '이미 맺었던 계약');
    d.trades[0].repeat = true; s.stock.coal = 30;
    assert.equal(O.start('trade', s, d, 'coal_for_food', 2), null);
    O.advance(s, d, 9); assert.equal(s.trades.coal_for_food.status, 'done'); // 기간이 끝남
});
test('조건 · 효과 — 형식 · 없는 항목은 실패, 효과는 한도 안에서', () => {
    const d = data(), s = O.normalize(null, d, 0);
    assert.deepEqual(O.testCond('resource', { id: 'money', gte: 100 }, s, d), { ok: true, value: true });
    assert.deepEqual(O.testCond('unit_count', { id: 'inf', gt: 2 }, s, d), { ok: true, value: false });
    assert.deepEqual(O.testCond('military_strength', { gte: 8 }, s, d), { ok: true, value: true });
    assert.deepEqual(O.testCond('tech_done', 'bessemer', s, d), { ok: true, value: false });
    assert.equal(O.testCond('resource', { id: 'gold', gte: 1 }, s, d).ok, false);
    assert.equal(O.testCond('resource', { id: 'money' }, s, d).ok, false);
    assert.equal(O.testCond('flag', 'x', s, d), null); // 운영 조건이 아님
    assert.equal(O.runEffect('add_resource', { id: 'coal', value: 100 }, s, d), null); assert.equal(s.stock.coal, 50);
    assert.equal(O.runEffect('add_resource', { id: 'coal', value: -999 }, s, d), null); assert.equal(s.stock.coal, 0);
    assert.equal(O.runEffect('add_facility', { id: 'mill', count: 5 }, s, d), null); assert.equal(s.facilities.mill, 2);
    assert.equal(O.runEffect('add_units', { id: 'inf', count: -5 }, s, d), null); assert.equal(s.units.inf, 0);
    assert.equal(O.runEffect('grant_tech', 'bessemer', s, d, 3), null); assert.equal(s.tech.done.bessemer, 3);
    assert.equal(O.runEffect('start_trade', 'coal_for_food', s, d, 3), null); assert.equal(s.trades.coal_for_food.status, 'active');
    assert.equal(O.runEffect('end_trade', 'coal_for_food', s, d), null); assert.equal(s.trades.coal_for_food.status, 'cancelled');
    const snap = JSON.stringify(s);
    assert.match(O.runEffect('add_resource', { id: 'gold', value: 1 }, s, d), /없는 항목/);
    assert.match(O.runEffect('add_units', { id: 'inf', count: 1.5 }, s, d), /형식/);
    assert.equal(JSON.stringify(s), snap);
});
test('오래 멈춘 세이브는 한 번에 366일까지만 계산한다', () => {
    const d = data(), s = O.normalize(null, d, 0);
    assert.equal(O.advance(s, d, 5000).days, 366); assert.equal(s.day, 5000);
});
const T = require('../js/campaign-tools.js'), IND = require('./fixtures/industrialization.cjs');
test('검사기 — 통합 예제는 통과, 운영 자료의 참조 · 숫자 · 순환 · 상대 · 조건/효과 오류를 짚는다', () => {
    assert.deepEqual(T.validate(IND.scenario()), []);
    assert.deepEqual(T.validate(IND.scenario('realtime')), []);
    const errs = d => T.validate(d).filter(i => i.level === 'error'), has = (l, p, re) => l.some(i => i.path === p && (!re || re.test(i.message)));
    let d = IND.scenario();
    d.facilities[3].consume.gold = 2; d.facilities[3].requires = ['bessemer', 'nope']; d.units[0].upkeep.food = -1; d.units[0].start = 1.5;
    d.tech[1].prereq = ['rifling']; d.tech[2].prereq = ['rail']; d.trades[0].partner = 'empire'; d.trades[1].give = 'money';
    d.decisions[0].cost = { gold: 5 }; d.decisions[1].effects = [{ add_units: { id: 'cavalry', count: 1 } }, { add_resource: { id: 'money' } }];
    d.articles[0].trigger = { all: [{ resource: { id: 'steel', gte: 'many' } }, { tech_done: 'telegraph' }] };
    let e = errs(d);
    for (const [p, re] of [['facilities.3.consume.gold', /없는 자원/], ['facilities.3.requires.1', /없는 기술: nope/], ['units.0.upkeep.food', /0 이상/], ['units.0.start', /정수/],
        ['tech.1', /도달할 수 없습니다/], ['tech.2', /도달할 수 없습니다/], ['trades.0.partner', /나라 목록에 없는 상대: empire/], ['trades.1.give', /자원 ID/],
        ['decisions.0.cost.gold', /없는 자원/], ['decisions.1.effects.0.add_units.id', /없는 부대: cavalry/], ['decisions.1.effects.1.add_resource', /형식/],
        ['articles.0.trigger.all.0.resource.gte', /숫자/], ['articles.0.trigger.all.1.tech_done', /없는 기술: telegraph/]]) assert.ok(has(e, p, re), p + ' ' + JSON.stringify(e.map(x => x.path)));
    assert.equal(T.describe(d, 'facilities.3.consume.gold'), '제철소 › 소비');
    // 운영을 쓰지 않는 예전 시나리오는 그대로
    assert.deepEqual(T.validate(T.starter('old')), []);
    // 중복 ID · 슬롯
    d = IND.scenario(); d.resources.push({ id: 'coal' }); d.buildSlots = 0;
    e = errs(d); assert.ok(has(e, 'resources.5.id', /중복/) && has(e, 'buildSlots'));
});
test('함께 싣는 예제 산업화와 국경 위기(.hemicmp)는 시험 원본과 같고 검사를 통과한다', () => {
    const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
    const d = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '..', 'docs', 'example-scenario', 'industrialization.hemicmp'))));
    assert.deepEqual(d, IND.scenario());
    assert.deepEqual(T.validate(d), []);
});
