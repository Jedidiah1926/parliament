// 시나리오 메이커 › 국가 운영 · 결정 탭 (v1.7.1 · 시나리오 0.3.2) — 칸으로 만든 자료가 JSON과 같고, 시험 플레이에서 운영 탭에 나오는지.
//   python3 -m http.server 8000 & node tests/ops-maker.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage();
        p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
        await ctx.addInitScript(() => { try { localStorage.setItem('hemicycleCampaignDetailMode', 'form'); } catch (e) { /* 무시 */ } });
        await p.goto(base + '/scenario.html'); await p.waitForFunction(() => !!window.HemiCampaignEditor && !!window.HemiCampaignOpsEditor);
        const data = () => p.evaluate(() => JSON.parse(JSON.stringify(HemiCampaignEditor.data)));
        const tab = t => p.locator(`#cpTabs [data-tab="${t}"]`).click();
        const sec = s => p.locator(`[data-ops-section="${s}"]`).click();
        assert.match(await p.locator('#cpTabs').innerText(), /결정[\s\S]*국가 운영/);
        // 시작 나라에 나라(무역 상대) 하나
        await p.evaluate(() => { const d = HemiCampaignEditor.data; d.world = { countries: [{ key: 'federation', name: '연방' }] }; HemiCampaignEditor.data = d; });
        await tab('ops');
        // 자원 둘
        await p.locator('[data-ops-add="resources"]').click(); await p.locator('[data-ops-add="resources"]').click();
        const res = i => p.locator(`[data-ops-item="resources.${i}"]`);
        await res(0).locator('[data-ops-field$=".name"]').fill('국고'); await res(0).locator('[data-ops-field$=".id"]').fill('money'); await res(0).locator('[data-ops-field$=".id"]').press('Tab');
        await res(0).locator('[data-ops-field$=".start"]').fill('100');
        await res(1).locator('[data-ops-field$=".name"]').fill('석탄'); await res(1).locator('[data-ops-field$=".id"]').fill('coal'); await res(1).locator('[data-ops-field$=".id"]').press('Tab');
        await res(1).locator('[data-ops-field$=".max"]').fill('50');
        let d = await data();
        assert.deepEqual(d.resources.map(r => [r.id, r.name, r.start, r.max]), [['money', '국고', 100, undefined], ['coal', '석탄', 0, 50]]);
        // 기술 둘 — 둘째는 첫째가 필수 선행
        await sec('tech'); await p.locator('[data-ops-add="tech"]').click(); await p.locator('[data-ops-add="tech"]').click();
        const tech = i => p.locator(`[data-ops-item="tech.${i}"]`);
        await tech(0).locator('[data-ops-field$=".id"]').fill('steam'); await tech(0).locator('[data-ops-field$=".id"]').press('Tab');
        await tech(0).locator('[data-ops-field$=".title"]').fill('증기 기관');
        await tech(0).locator('[data-amount$=".cost"] [data-amount-add]').click();
        await tech(0).locator('[data-amount$=".cost"] [data-amount-val]').fill('20');
        await tech(1).locator('[data-ops-field$=".id"]').fill('rail'); await tech(1).locator('[data-ops-field$=".id"]').press('Tab');
        await tech(1).locator('[data-ops-pick$=".prereq"] input[value="steam"]').check();
        d = await data();
        assert.deepEqual([d.tech[0].cost, d.tech[1].prereq], [{ money: 20 }, ['steam']]);
        // 시설 — 비용 · 생산 · 필요 기술
        await sec('facilities'); await p.locator('[data-ops-add="facilities"]').click();
        const fac = p.locator('[data-ops-item="facilities.0"]');
        await fac.locator('[data-ops-field$=".id"]').fill('mine'); await fac.locator('[data-ops-field$=".id"]').press('Tab');
        await fac.locator('[data-amount$=".cost"] [data-amount-add]').click(); await fac.locator('[data-amount$=".cost"] [data-amount-val]').fill('30');
        await fac.locator('[data-amount$=".produce"] [data-amount-add]').click(); await fac.locator('[data-amount$=".produce"] [data-amount-key]').selectOption('coal'); await fac.locator('[data-amount$=".produce"] [data-amount-val]').fill('5');
        await fac.locator('[data-ops-pick$=".requires"] input[value="steam"]').check();
        await fac.locator('[data-ops-field$=".days"]').fill('2');
        d = await data();
        assert.deepEqual([d.facilities[0].cost, d.facilities[0].produce, d.facilities[0].requires, d.facilities[0].days], [{ money: 30 }, { coal: 5 }, ['steam'], 2]);
        // 부대 · 무역
        await sec('units'); await p.locator('[data-ops-add="units"]').click();
        await p.locator('[data-ops-item="units.0"] [data-ops-field$=".strength"]').fill('4');
        await sec('trades'); await p.locator('[data-ops-add="trades"]').click();
        const tr = p.locator('[data-ops-item="trades.0"]');
        assert.equal(await tr.locator('[data-ops-field$=".partner"]').inputValue(), 'federation');
        await tr.locator('[data-amount$=".give"] [data-amount-add]').click(); await tr.locator('[data-amount$=".give"] [data-amount-key]').selectOption('coal'); await tr.locator('[data-amount$=".give"] [data-amount-val]').fill('2');
        await tr.locator('[data-amount$=".get"] [data-amount-add]').click(); await tr.locator('[data-amount$=".get"] [data-amount-val]').fill('9');
        // 자원 ID를 바꾸면 비용 · 생산 · 무역의 자원도 함께
        await sec('resources'); await res(1).locator('[data-ops-field$=".id"]').fill('coal2'); await res(1).locator('[data-ops-field$=".id"]').press('Tab');
        d = await data();
        assert.deepEqual([d.facilities[0].produce, d.trades[0].give], [{ coal2: 5 }, { coal2: 2 }]);
        // 결정 탭 — 분류 · 비용 · 한 번만/반복, 가이드 조건에 운영 조건
        await tab('decisions'); await p.locator('[data-script-add="decisions"]').click();
        await p.locator('[data-script-field="decisions.0.category"]').fill('경제');
        await p.locator('[data-amount="decisions.0.cost"] [data-amount-add]').click(); await p.locator('[data-amount="decisions.0.cost"] [data-amount-val]').fill('15');
        await p.locator('[data-script-bool="decisions.0.once"]').uncheck();
        await p.locator('[data-guide="decisions.0.available"] [data-gr-add]').click();
        await p.locator('[data-guide="decisions.0.available"] [data-gr="0"] [data-gf="type"]').selectOption('tech_done');
        await p.locator('[data-guide="decisions.0.available"] [data-gr="0"] [data-gf="opsid"]').selectOption('rail');
        await p.locator('[data-guide="decisions.0.effects"] [data-gr-add]').click();
        await p.locator('[data-guide="decisions.0.effects"] [data-gr="0"] [data-gf="type"]').selectOption('add_facility');
        await p.locator('[data-guide="decisions.0.effects"] [data-gr="0"] [data-gf="number"]').fill('2');
        d = await data();
        assert.deepEqual([d.decisions[0].category, d.decisions[0].cost, d.decisions[0].once, d.decisions[0].available, d.decisions[0].effects], ['경제', { money: 15 }, false, { tech_done: 'rail' }, [{ add_facility: { id: 'mine', count: 2 } }]]);
        // 검사 통과(경고만) → 오류를 만들면 짚고, 눌러 국가 운영 탭의 그 항목으로
        assert.deepEqual(await p.evaluate(() => HemiCampaignEditor.check()), []);
        await p.evaluate(() => { const x = HemiCampaignEditor.data; x.units[0].upkeep = { gold: 1 }; HemiCampaignEditor.data = x; });
        await p.locator('#cpValidate').click();
        await p.locator('.cpe-issue-error').filter({ hasText: '없는 자원: gold' }).click();
        assert.equal(await p.locator('.cpe-tab.on').getAttribute('data-tab'), 'ops');
        assert.equal(await p.locator('[data-ops-section="units"]').getAttribute('class'), 'on');
        await p.evaluate(() => { const x = HemiCampaignEditor.data; x.units[0].upkeep = {}; HemiCampaignEditor.data = x; });
        // 프로(JSON) 모드로 바꿔도 같은 자료
        const formData = JSON.stringify(await data());
        await p.locator('#cpStudioBar [data-mode="json"]').click(); await sec('trades');
        assert.match(await p.locator('[data-json="trades"]').inputValue(), /"partner": "federation"/);
        await p.locator('#cpStudioBar [data-mode="form"]').click();
        assert.equal(JSON.stringify(await data()), formData);
        console.log('PASS: maker — resources, tech prerequisites, facilities, units, trades, id rename, decisions tab with cost/once/guided ops rules, issue navigation, JSON parity');
        // 시험 플레이 — 운영 탭에 만든 것이 나온다
        await p.evaluate(() => HemiCampaignEditor.play());
        await p.waitForURL('**/main.html'); await p.waitForFunction(() => !!window.HemiCampaign?.state?.ops);
        await p.locator('.cp-overlay .cp-primary').click();
        await p.evaluate(() => switchSubTab('campaign', 'campops')); await p.waitForTimeout(200);
        assert.match(await p.locator('#contentCampops').innerText(), /국고[\s\S]*100/);
        assert.deepEqual(await p.evaluate(() => HemiCampaign.state.ops.stock), { money: 100, coal2: 0 });
        assert.deepEqual(errors, []);
        console.log('PASS: play test shows the authored operations; no browser errors');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
