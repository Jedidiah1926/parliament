// 경제권 — 지도상의 경제 지역 (v1.7.1 4단계). 세계 › 경제권에서 만들고 칠하고, 국가 영토와 따로 저장 · 왕복되는지.
//   python3 -m http.server 8000 & node tests/economic-regions.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict'), fs = require('node:fs'), zlib = require('node:zlib');
const F = require('./fixtures/border-agreement.cjs');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage();
        p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
        const settle = () => p.evaluate(() => new Promise(r => setTimeout(r, 120)));
        const eco = () => p.evaluate(() => JSON.parse(JSON.stringify({ zones: HemiWorldMap.economic.zones, regions: { ...HemiWorldMap.economic.regions } })));
        const owners = () => p.evaluate(() => ({ ...HemiWorldMap.state.owners }));
        const fill = key => p.evaluate(k => document.querySelector(`[data-wm-key="${k}"]`).getAttribute('fill'), key);
        const OWN = { capital: 'w_republic', riverbank: 'w_federation', island: 'w_federation' };
        const confirmOk = () => p.locator('.dno-dialog-btn:not(.cancel)').click();

        await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
        await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3 && !!window.HemiWorldMap); await p.waitForTimeout(600);
        // 지도가 없을 때 — 탭은 열리고, 지도를 먼저 불러오라고 안내한다
        assert.equal(await p.locator('#sideNav .mn-locked', { hasText: '경제권' }).count(), 0); // 사이드 메뉴의 잠긴 칸이 실제 메뉴로
        assert.ok(await p.locator('#sideNav .mn-item', { hasText: '경제권' }).count() >= 1);
        await p.evaluate(() => switchSubTab('world', 'econblocs'));
        assert.equal(await p.locator('#contentEconblocs').isVisible(), true);
        assert.match(await p.locator('#weStatus').innerText(), /\.hemimap 파일을 먼저 불러오세요/);
        assert.equal(await p.evaluate(() => 'economicRegions' in getAppState()), false); // 쓰지 않으면 세이브에 칸을 만들지 않는다
        await p.evaluate(({ map, wm }) => HemiWorldMap.importData({ ...map, worldMap: { owners: wm.owners, colors: wm.colors, countries: wm.countries } }), { map: F.map(), wm: F.worldMap() });
        await p.evaluate(() => switchSubTab('world', 'econblocs')); await settle();
        assert.equal(await p.evaluate(() => HemiWorldMap.layer), 'zones');
        assert.equal(await p.locator('[data-wm-layer="zones"]').getAttribute('aria-pressed'), 'true');
        assert.match(await p.locator('#weStatus').innerText(), /경제권 0개 · 3개 구역 중 0개 배정 · 3개 미배정/);
        assert.equal(await fill('capital'), '#35404b'); // 경제권 표시에서는 미배정 색 — 국가 색이 아니다

        // 만들기 · 편집 — 입력하는 동안 칸이 다시 만들어지지 않는다 (포커스 유지)
        await p.locator('#weNewName').fill('북부 공업권'); await p.locator('#weAdd').click();
        await p.locator('#weNewName').fill('Coastal Trade'); await p.keyboard.press('Enter');
        assert.deepEqual((await eco()).zones.map(z => [z.id, z.name]), [['zone1', '북부 공업권'], ['coastal_trade', 'Coastal Trade']]);
        await p.locator('[data-we-zone="zone1"]').click();
        await p.locator('#weName').click(); await p.keyboard.press('End'); await p.keyboard.type(' A');
        assert.equal(await p.evaluate(() => document.activeElement.id), 'weName');
        await p.locator('#weAbbr').fill('북공'); await p.locator('#weDesc').fill('철강과 기계');
        await p.locator('#weColor').fill('#123456'); await p.locator('#weColor').dispatchEvent('change');
        assert.deepEqual((await eco()).zones[0], { id: 'zone1', name: '북부 공업권 A', abbr: '북공', color: '#123456', desc: '철강과 기계' });
        assert.match(await p.locator('[data-we-zone="zone1"]').innerText(), /북부 공업권 A[\s\S]*북공/);

        // 칠하기 — 국가 영토는 그대로, 한 구역은 경제권 하나
        await p.locator('[data-wm-key="capital"]').click();
        const box = async key => p.locator(`[data-wm-key="${key}"]`).boundingBox();
        const a = await box('riverbank'), b2 = await box('island');
        await p.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await p.mouse.down(); await p.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2, { steps: 6 }); await p.mouse.up(); await settle();
        assert.deepEqual((await eco()).regions, { capital: 'zone1', riverbank: 'zone1', island: 'zone1' });
        assert.deepEqual(await owners(), OWN);
        assert.equal(await fill('island'), '#123456');
        assert.match(await p.locator('#weStats').innerText(), /구역\s*3개[\s\S]*소유 국가[\s\S]*연방 2 · 공화국 1[\s\S]*지역 경제 자료\s*자료 없음/);
        await p.locator('[data-we-zone="coastal_trade"]').click(); await p.locator('[data-wm-key="island"]').click();
        assert.deepEqual((await eco()).regions, { capital: 'zone1', riverbank: 'zone1', island: 'coastal_trade' });
        assert.match(await p.locator('#weRegion').innerText(), /섬 · 경제권: Coastal Trade · 국가: 연방/);
        // 지우기 · 실행 취소 / 다시 실행 (국가 영토의 실행 취소 기록과 따로)
        await p.locator('[data-we-tool="erase"]').click(); await p.locator('[data-wm-key="riverbank"]').click();
        assert.deepEqual((await eco()).regions, { capital: 'zone1', island: 'coastal_trade' });
        await p.locator('#weUndo').click(); assert.equal((await eco()).regions.riverbank, 'zone1');
        await p.locator('#weRedo').click(); assert.equal((await eco()).regions.riverbank, undefined);
        await p.locator('#weUndo').click();
        assert.equal(await p.evaluate(() => document.getElementById('wmUndo').disabled), true); // 영토 쪽 기록은 건드리지 않았다
        // 구역 확인 도구는 칠하지 않는다
        await p.locator('[data-we-tool="inspect"]').click(); await p.locator('[data-wm-key="capital"]').click();
        assert.equal((await eco()).regions.capital, 'zone1');
        // 구역 찾기 · 미배정 확인
        await p.locator('#weSearch').fill('섬'); assert.deepEqual(await p.locator('#weFound [data-we-find]').allInnerTexts().then(t => t.map(x => x.replace(/\s+/g, ' '))), ['섬 Coastal Trade']);
        await p.locator('#weSearch').fill(''); await p.locator('[data-we-tool="erase"]').click(); await p.locator('[data-wm-key="riverbank"]').click();
        await p.locator('#weOnlyFree').check(); assert.deepEqual(await p.locator('#weFound [data-we-find]').evaluateAll(els => els.map(e => e.dataset.weFind)), ['riverbank']);
        await p.locator('#weFound [data-we-find="riverbank"]').click(); assert.match(await p.locator('#weRegion').innerText(), /강변 · 경제권: 미배정/);
        await p.locator('#weOnlyFree').uncheck(); await p.locator('[data-we-tool="paint"]').click(); await p.locator('[data-we-zone="zone1"]').click(); await p.locator('[data-wm-key="riverbank"]').click();

        // 표시 전환 — 국가 영토 / 경제권. 서로의 자료는 그대로
        await p.locator('[data-wm-layer="owners"]').click(); await settle();
        assert.equal(await p.evaluate(() => HemiWorldMap.layer), 'owners'); assert.equal(await p.locator('#contentWorldmap').isVisible(), true);
        assert.equal(await fill('capital'), '#437fa2'); assert.equal(await fill('island'), '#c34e4e');
        await p.locator('#wmCountry').selectOption('w_republic'); await p.locator('[data-wm-key="island"]').click();
        assert.deepEqual(await owners(), { ...OWN, island: 'w_republic' });
        assert.deepEqual((await eco()).regions, { capital: 'zone1', riverbank: 'zone1', island: 'coastal_trade' }); // 영토를 칠해도 경제권은 그대로
        await p.locator('#wmUndo').click(); assert.deepEqual(await owners(), OWN);
        await p.locator('[data-wm-layer="zones"]').click(); await settle();
        assert.equal(await p.locator('#contentEconblocs').isVisible(), true); assert.equal(await fill('island'), await p.evaluate(() => getComputedStyle(document.querySelector('[data-we-zone="coastal_trade"] i')).backgroundColor.replace(/rgb\((\d+), (\d+), (\d+)\)/, (m, r, g, b) => '#' + [r, g, b].map(x => (+x).toString(16).padStart(2, '0')).join(''))));
        console.log('PASS: World > Economic regions — create/edit, paint/drag/erase, undo/redo, inspect, search/unassigned, layer toggle with independent territory data');

        // ID 바꾸기 (시나리오가 쓰는 이름) — 배정이 따라가고, 겹치는 ID는 거절
        await p.locator('[data-we-zone="zone1"]').click(); await p.locator('#weId').fill('north'); await p.locator('#weId').blur();
        assert.deepEqual((await eco()).regions, { capital: 'north', riverbank: 'north', island: 'coastal_trade' });
        await p.locator('#weId').fill('coastal_trade'); await p.locator('#weId').blur();
        assert.match(await p.locator('.dno-dialog-msg').innerText(), /겹치지 않게/); await confirmOk();
        assert.equal((await eco()).zones[0].id, 'north');
        // 저장 → 복원: economicRegions 칸에 따로, 세계지도 칸에는 섞이지 않는다
        const saved = await p.evaluate(() => getAppState());
        assert.deepEqual(saved.economicRegions.regions, { capital: 'north', riverbank: 'north', island: 'coastal_trade' });
        assert.deepEqual(Object.keys(saved.worldMap).sort(), ['colors', 'countries', 'owners', 'preset']); assert.equal(saved.worldMap.preset.economicRegions, undefined);
        await p.evaluate(st => setAppState(st), saved); await settle();
        assert.deepEqual((await eco()).regions, saved.economicRegions.regions); assert.deepEqual(await owners(), OWN);
        // 예전 세이브(경제권 칸 없음) · 다른 세이브로 새지 않는다
        await p.evaluate(st => { const old = JSON.parse(JSON.stringify(st)); delete old.economicRegions; setAppState(old); }, saved); await settle();
        assert.deepEqual(await eco(), { zones: [], regions: {} }); assert.deepEqual(await owners(), OWN);
        await p.evaluate(st => setAppState(st), saved); await settle();
        // 지도 파일 왕복 — 내보낸 .hemimap에 경제권이 들어 있고, 다시 불러오면 그대로
        await p.evaluate(() => switchSubTab('world', 'worldmap'));
        const [download] = await Promise.all([p.waitForEvent('download'), p.locator('#wmExport').click()]);
        const file = await download.path(), exported = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8'));
        assert.deepEqual(exported.economicRegions.regions, saved.economicRegions.regions); assert.equal(exported.economicRegions.zones.length, 2); assert.equal(exported.worldMap.owners.capital, 'w_republic');
        await p.evaluate(() => switchSubTab('world', 'econblocs')); await p.locator('#weClear').click(); await confirmOk(); await settle();
        assert.deepEqual((await eco()).regions, {}); assert.deepEqual(await owners(), OWN);
        await p.locator('#weUndo').click(); assert.deepEqual((await eco()).regions, saved.economicRegions.regions);
        await p.locator('[data-we-zone="north"]').click(); await p.locator('#weDelete').click();
        assert.match(await p.locator('.dno-dialog-msg').innerText(), /소속 구역 2개는 미배정/); await confirmOk(); await settle();
        assert.deepEqual(await eco().then(e => [e.zones.map(z => z.id), e.regions]), [['coastal_trade'], { island: 'coastal_trade' }]);
        assert.equal(await fill('capital'), '#35404b');
        await p.evaluate(() => switchSubTab('world', 'worldmap'));
        await p.locator('#wmFile').setInputFiles({ name: 'eco.hemimap', mimeType: 'application/octet-stream', buffer: fs.readFileSync(file) }); await confirmOk();
        await p.waitForFunction(() => HemiWorldMap.economic.zones.length === 2);
        assert.deepEqual((await eco()).regions, saved.economicRegions.regions); assert.deepEqual(await owners(), OWN);
        // 경제권이 없는 지도 파일로 바꾸면 — 목록은 두고 배정만 비운다 (새 지도의 구역에 옛 배정을 붙이지 않는다)
        const plain = { ...exported }; delete plain.economicRegions;
        await p.locator('#wmFile').setInputFiles({ name: 'plain.hemimap', mimeType: 'application/octet-stream', buffer: zlib.gzipSync(JSON.stringify(plain)) }); await confirmOk();
        await p.waitForFunction(() => Object.keys(HemiWorldMap.economic.regions).length === 0);
        assert.deepEqual((await eco()).zones.map(z => z.id), ['north', 'coastal_trade']);
        await p.evaluate(st => setAppState(st), saved); await settle();
        console.log('PASS: zone id rename, delete, clear, save/restore in a separate state key, old saves, compressed .hemimap round trip');

        // 시나리오 연결 — 경제권 소속 조건 · 배정 효과 (영토와 같은 실패 계약)
        await p.evaluate(d => HemiCampaign.attach(d, 's1'), (() => { const d = F.scenario(); d.id = 'eco_rules'; d.events.push({ id: 'zone_news', title: '경제권 개편', check: 'world', trigger: { in_economic_region: { zone: { id: 'coastal_trade' }, regions: ['riverbank'] } }, options: [{ text: '확인', effects: [] }] }); return d; })());
        await p.locator('.cp-overlay .cp-primary').click(); await settle();
        const mod = 'campaign.eco_rules';
        assert.deepEqual(await p.evaluate(id => { const t = c => HemiScriptMods.test(c, id); return [
            t({ in_economic_region: { zone: { id: 'north' }, regions: ['capital', 'riverbank'] } }), t({ in_economic_region: { zone: { id: 'north' }, regions: ['capital', 'island'] } }),
            t({ in_economic_region: { zone: { id: 'north' }, regions: ['capital', 'island'], mode: 'any' } }), t({ in_economic_region: { zone: { unassigned: true }, regions: ['island'] } }),
            t({ not: { in_economic_region: { zone: { id: 'ghost' }, regions: ['capital'] } } }), t({ not: { in_economic_region: { zone: { id: 'north' }, regions: ['nowhere'] } } }) ]; }, mod), [true, false, true, false, false, false]);
        assert.match(await p.evaluate(id => HemiScriptMods.precheck([{ assign_economic_region: { regions: ['riverbank'], to: { id: 'ghost' } } }], id), mod), /없는 경제권/);
        const day0 = await p.evaluate(() => HemiCampaign.state.clock.day);
        const res = await p.evaluate(id => { const seen = []; const on = e => seen.push([e.detail.source, e.detail.layer, e.detail.keys]); window.addEventListener('hemi-world-map-changed', on);
            HemiScriptMods.run([{ assign_economic_region: { regions: ['riverbank', 'atlantis'], to: { id: 'coastal_trade' } } }], id); const untouched = HemiWorldMap.economic.regions.riverbank;
            HemiScriptMods.run([{ assign_economic_region: { regions: ['riverbank', 'island'], to: { id: 'coastal_trade' } } }], id);
            window.removeEventListener('hemi-world-map-changed', on); return { untouched, seen, regions: { ...HemiWorldMap.economic.regions }, owners: { ...HemiWorldMap.state.owners }, undo: document.getElementById('weUndo').disabled }; }, mod);
        assert.equal(res.untouched, 'north'); // 없는 구역이 하나라도 있으면 아무것도 바꾸지 않는다
        assert.deepEqual(res.seen, [['script', 'zones', ['riverbank']]]); // 이미 그 경제권인 섬은 변경 목록에 없다 · 알림은 한 번
        assert.deepEqual(res.regions, { capital: 'north', riverbank: 'coastal_trade', island: 'coastal_trade' }); assert.deepEqual(res.owners, OWN); assert.equal(res.undo, true);
        await p.waitForFunction(() => document.querySelector('.sm-ev-title')?.textContent === '경제권 개편'); // 배정이 바뀌면 날짜를 넘기지 않고 "지도 변경 시" 이벤트
        assert.equal(await p.evaluate(() => HemiCampaign.state.clock.day), day0);
        await p.locator('.sm-ev-opt').click(); await settle();
        // 영토를 넘겨도 경제권 경계는 그대로, 경제권의 소유 국가 집계만 바뀐다
        await p.evaluate(id => HemiScriptMods.run([{ transfer_regions: { regions: ['riverbank', 'island'], to: { key: 'republic' } } }], id), mod); await settle();
        if (await p.locator('.sm-overlay').count()) { await p.locator('.sm-ev-opt').click(); await settle(); }
        assert.deepEqual((await eco()).regions, { capital: 'north', riverbank: 'coastal_trade', island: 'coastal_trade' });
        await p.evaluate(() => switchSubTab('world', 'econblocs')); await p.locator('[data-we-zone="coastal_trade"]').click();
        assert.match(await p.locator('#weStats').innerText(), /구역\s*2개[\s\S]*공화국 2/);
        console.log('PASS: scenario condition/effect for economic regions — atomic, prechecked, one notification, map-change events, territory transfer keeps zone borders');

        // 지도 제작기를 거쳐도 경제권이 남는다
        const p2 = await ctx.newPage(); p2.on('pageerror', e => errors.push(e.message));
        await p2.goto(base + '/map.html'); await p2.locator('#fileInput').setInputFiles({ name: 'eco.hemimap', mimeType: 'application/octet-stream', buffer: fs.readFileSync(file) });
        await p2.waitForFunction(() => document.querySelectorAll('#elementsList .item').length === 3);
        const made = await p2.evaluate(() => buildPresetData());
        assert.deepEqual(made.economicRegions.regions, saved.economicRegions.regions); assert.equal(made.worldMap.owners.capital, 'w_republic');
        await p2.close();

        // 경제 화면의 "경제권" 버튼은 이 탭으로, 세 테마 · 좁은 화면에서도 깨지지 않는다
        await p.evaluate(() => { try { switchSubTab('economy', 'overview'); } catch (e) { /* 경제 탭 없음 */ } }); await settle();
        if (await p.locator('[data-econ-zones]').count()) { await p.locator('[data-econ-zones]').first().click(); await settle(); assert.equal(await p.locator('#contentEconblocs').isVisible(), true); assert.equal(await p.locator('[data-locked-view]').count(), 0); }
        for (const [family, theme] of [['tno', 'neon'], ['modern', 'light'], ['modern', 'dark']]) {
            await p.evaluate(([f, t]) => { document.documentElement.setAttribute('data-theme-family', f); document.documentElement.setAttribute('data-theme', t); }, [family, theme]);
            await p.evaluate(() => switchSubTab('world', 'econblocs')); await settle();
            const m = await p.evaluate(() => { const c = document.getElementById('contentEconblocs'), r = c.getBoundingClientRect(); return { w: r.width, overflow: c.scrollWidth - c.clientWidth, legend: document.querySelectorAll('#weLegend [data-we-zone]').length }; });
            assert.ok(m.w > 200 && m.overflow <= 2 && m.legend === 2, JSON.stringify([theme, m]));
        }
        await p.setViewportSize({ width: 390, height: 800 }); await settle();
        // 좁은 화면 — 경제권 탭이 기존 지도 탭보다 더 넘치지 않는다 (좁은 화면에서 사이드 메뉴가 펼쳐진 배치의 넘침은 기존 화면도 같다)
        const widths = await p.evaluate(() => { const w = sub => { switchSubTab('world', sub); return document.documentElement.scrollWidth; }; return [w('worldmap'), w('econblocs')]; });
        assert.ok(widths[1] <= widths[0] + 2, JSON.stringify(widths));
        assert.deepEqual(errors, []);
        console.log('PASS: map maker keeps economic regions; economy toolbar link; three themes and a narrow screen; no browser errors');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
