// 시나리오 국가 운영 (v1.7.1 · 시나리오 0.3.2) — 통합 예제 "산업화와 국경 위기"를 실제 게임에서 처음부터 결말까지.
//   python3 -m http.server 8000 & node tests/ops-scenario.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const IND = require('./fixtures/industrialization.cjs');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const open = async mode => {
            const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage();
            p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
            await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
            await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3); await p.waitForTimeout(500);
            await p.evaluate(d => HemiCampaign.attach(d, 's1'), IND.scenario(mode)); await p.locator('.cp-overlay .cp-primary').click();
            await p.waitForTimeout(200);
            return p;
        };
        const stock = p => p.evaluate(() => ({ ...HemiCampaign.state.ops.stock }));
        const ops = p => p.evaluate(() => JSON.parse(JSON.stringify(HemiCampaign.state.ops)));
        const turn = async (p, k = 1) => { for (let i = 0; i < k; i++) { await p.evaluate(() => HemiCampaign.nextTurn()); await p.waitForTimeout(40); while (await p.locator('.ca-overlay').count()) { await p.locator('.ca-close').click(); await p.waitForTimeout(40); } } };
        const tabOps = async (p, v) => { await p.evaluate(() => switchSubTab('campaign', 'campops')); if (v) await p.locator(`[data-ops-view="${v}"]`).click(); };
        const btn = (p, kind, id, a = 'start') => p.locator(`#contentCampops [data-ops="${kind}|${id}|${a}"]`);

        const p = await open('turn');
        // 운영 탭이 보이고 시작 값이 들어 있다
        assert.equal(await p.evaluate(() => document.getElementById('subTabCampops').style.display), '');
        await p.waitForTimeout(150);
        assert.equal(await p.locator('#sideNav .mn-item').filter({ hasText: /^\s*운영\s*$/ }).first().isVisible(), true); // 사이드 메뉴에 운영 항목
        await tabOps(p);
        assert.deepEqual(await stock(p), { money: 120, coal: 20, iron: 10, steel: 0, food: 60 });
        assert.match(await p.locator('#contentCampops .cp-table').innerText(), /국고[\s\S]*120[\s\S]*석탄/);
        assert.deepEqual((await ops(p)).facilities, { farm: 2, mine: 1 });
        // 제철소는 기술이 먼저 — 버튼이 꺼져 있고 이유가 적혀 있다
        assert.match(await btn(p, 'facility', 'steel_mill').innerText(), /먼저 연구: 베세머 공법/);
        assert.equal(await btn(p, 'facility', 'steel_mill').isDisabled(), true);
        // 방향성 "산업화 선언" → 국고 +30
        await p.evaluate(() => HemiCampaign.startFocus('industrialize')); await turn(p);
        // 하루: 농장 +10 식량, 탄광 +6 석탄 -1 국고, 보병 2 -4 식량, 방향성 +30
        assert.deepEqual(await stock(p), { money: 149, coal: 26, iron: 10, steel: 0, food: 66 });
        // 기술 트리 — 베세머 공법을 눌러 연구 (비용 국고 30)
        await tabOps(p, 'tech');
        await p.locator('#contentCampops .cp-tech-available:not(.cp-tech-wait)').filter({ hasText: '베세머' }).click();
        assert.equal((await stock(p)).money, 119);
        assert.match(await p.locator('#contentCampops .cp-focus-cur').innerText(), /베세머 공법[\s\S]*3턴 남음/);
        await turn(p, 3);
        assert.ok((await ops(p)).tech.done.bessemer != null);
        // 건설 — 철광산과 제철소 (슬롯 하나라 차례로)
        await tabOps(p, 'res');
        await btn(p, 'facility', 'iron_mine').click();
        assert.match(await btn(p, 'facility', 'steel_mill').innerText(), /건설 중인 시설이 있습니다/);
        await turn(p, 2);
        await tabOps(p, 'res'); await btn(p, 'facility', 'steel_mill').click();
        await turn(p, 3);
        let o = await ops(p);
        assert.deepEqual([o.facilities.iron_mine, o.facilities.steel_mill], [1, 1]);
        const before = await stock(p); await turn(p);
        const after = await stock(p);
        assert.equal(after.steel - before.steel, 2); // 제철소: 석탄 4 · 철광석 2 → 철강 2
        assert.equal(after.coal - before.coal, 6 - 4); assert.equal(after.iron - before.iron, 4 - 2);
        // 조건 기사 (철강 2 이상)는 한 번 발행된다
        assert.ok(await p.evaluate(() => !!HemiCampaign.state.articles.published.steel_news));
        // 결정 — 국가 › 결정의 "산업 투자" (국고 50 → 탄광 +1), 비용이 표시되고 재사용 대기
        await p.evaluate(() => { HemiCampaign.state.ops.stock.money = 150; switchSubTab('nation', 'decisions'); }); await p.waitForTimeout(100); // 건설로 쓴 국고를 채워 둔다 (시간이 흐른 셈)
        const dec = p.locator('#contentDecisions .sm-dec').filter({ hasText: '산업 투자' });
        assert.match(await dec.innerText(), /비용: 💰\uFE0E? 국고 50/);
        const m0 = (await stock(p)).money, mines0 = (await ops(p)).facilities.mine;
        await dec.locator('button').click(); await p.waitForTimeout(100);
        assert.equal((await stock(p)).money, m0 - 50); assert.equal((await ops(p)).facilities.mine, mines0 + 1);
        assert.match(await p.locator('#contentDecisions .sm-dec').filter({ hasText: '산업 투자' }).innerText(), /뒤 다시/);
        // 국고가 모자라면 결정을 쓸 수 없다 (사용 기록도 없음)
        await p.evaluate(() => { HemiCampaign.state.ops.stock.food = 5; }); await p.evaluate(() => switchSubTab('nation', 'decisions')); await p.waitForTimeout(100);
        assert.match(await p.locator('#contentDecisions .sm-dec').filter({ hasText: '총동원' }).innerText(), /식량 25 부족/);
        await p.evaluate(() => { HemiCampaign.state.ops.stock.food = 120; });
        // 무역 — 철강 수출 (하루 철강 2 → 국고 12)
        await tabOps(p, 'trade');
        await btn(p, 'trade', 'steel_export').click();
        const t0 = await stock(p); await turn(p); const t1 = await stock(p);
        assert.equal(t1.steel - t0.steel, 2 - 2); // 생산 2 · 수출 2
        assert.ok(t1.money - t0.money >= 12 - 3);
        // 저장 → 복원 — 운영 상태가 그대로, 같은 날을 다시 계산하지 않는다
        const saved = await ops(p);
        await p.evaluate(() => setAppState(JSON.parse(JSON.stringify(getAppState())))); await p.waitForTimeout(400);
        assert.deepEqual(await ops(p), saved);
        await p.evaluate(() => HemiCampaign.tick()); assert.deepEqual((await ops(p)).stock, saved.stock);
        console.log('PASS: ops tab — research via tech tree, build queue, production with inputs, condition article, decision cost/cooldown, trade, save/restore without double counting');

        // 군사 — 강선 포 연구 → 포병 편성 → 전력 20 → 방향성 "국경 방위 계획" → 국경 위기 → 결말
        await p.evaluate(() => { HemiCampaign.state.ops.stock.steel = 40; HemiCampaign.state.ops.stock.money = 200; });
        await tabOps(p, 'tech'); await p.locator('#contentCampops .cp-tech').filter({ hasText: '강선 포' }).click();
        assert.equal(await p.locator('#contentCampops .cp-tech').filter({ hasText: '철도' }).locator('.cp-tech-s').innerText(), '다른 기술을 연구 중입니다');
        await turn(p, 2);
        await tabOps(p, 'mil');
        assert.match(await p.locator('#contentCampops .cp-big').innerText(), /전력 6/);
        assert.equal(await p.evaluate(() => { const before = HemiCampaign.state.focus.cur; HemiCampaign.startFocus('defense_plan'); return HemiCampaign.state.focus.cur === before; }), true); // 전력 20 미만이라 못 시작
        await btn(p, 'unit', 'artillery').click(); await turn(p, 3);
        await tabOps(p, 'mil'); await btn(p, 'unit', 'artillery').click(); await turn(p, 3);
        o = await ops(p); assert.equal(o.units.artillery, 2);
        assert.equal(await p.evaluate(() => HemiOps.strength(HemiCampaign.state.ops, HemiCampaign.state.data)), 22);
        await p.evaluate(() => HemiCampaign.startFocus('defense_plan')); assert.equal(await p.evaluate(() => HemiCampaign.state.focus.cur?.id), 'defense_plan');
        await turn(p, 2); await p.waitForSelector('.sm-narrative');
        assert.equal(await p.locator('.sm-ev-opt').count(), 1); // "협상 테이블로"는 철도를 연구해야 보인다
        await p.locator('.sm-ev-opt').click(); await turn(p); // 결말은 다음 진행 때 확인된다
        await p.waitForSelector('.cp-overlay .cp-super-title'); assert.equal(await p.locator('.cp-overlay .cp-super-title').innerText(), '무장한 평화');
        // 잠금(정당 · 의석)은 이 시나리오에도 적용된다
        assert.match(await p.evaluate(() => HemiCampaign.lockReason('parties')), /정당/);
        await p.context().close();
        console.log('PASS: military — tech-gated recruiting, strength condition gates focus, crisis event options by tech, ending');

        // 실시간 — 하루에 한 번만 계산 (시간 단위 진행에서 중복 없음), 보급 부족
        const q = await open('realtime');
        const day0 = await q.evaluate(() => HemiCampaign.state.clock.day), s0 = await stock(q);
        await q.evaluate(() => { HemiCampaign.setSpeed(5); HemiCampaign.play(); });
        await q.waitForFunction(d => HemiCampaign.state.clock.day >= d + 3, day0, { timeout: 20000 });
        await q.evaluate(() => HemiCampaign.pause());
        const days = await q.evaluate(d => HemiCampaign.state.ops.day - Math.floor(d), day0), s1 = await stock(q);
        assert.equal(await q.evaluate(() => HemiCampaign.state.ops.day), await q.evaluate(() => HemiCampaign.state.clock.day));
        assert.equal(s1.coal - s0.coal, 6 * days); assert.equal(s1.food - s0.food, 6 * days); // 농장 +10 · 보병 -4
        await q.evaluate(() => { HemiCampaign.state.ops.stock.food = 0; HemiCampaign.state.ops.facilities.farm = 0; });
        await q.evaluate(() => HemiCampaign.nextTurn ? 0 : 0); await q.evaluate(() => { HemiCampaign.play(); });
        await q.waitForFunction(() => HemiCampaign.state.ops.shortage.units.includes('infantry'), null, { timeout: 20000 });
        await q.evaluate(() => HemiCampaign.pause());
        await tabOps(q, 'mil'); assert.match(await q.locator('#contentCampops').innerText(), /보급 부족 — 전력 절반/);
        assert.deepEqual(errors, []);
        console.log('PASS: realtime — production once per in-game day, supply shortage halves strength; no browser errors');
        await q.context().close();
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
