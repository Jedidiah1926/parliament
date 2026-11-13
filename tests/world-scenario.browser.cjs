// 세계지도 · 시나리오 연동 (v1.7.1 3단계) — 첫 예제 "국경 협정"을 제작기 → 시험 플레이로 실제로 돌려 본다.
//   python3 -m http.server 8000 & node tests/world-scenario.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const F = require('./fixtures/border-agreement.cjs');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const newPage = async () => { const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage(); p.setDefaultTimeout(20000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort()); return p; };
        const settle = p => p.evaluate(() => new Promise(r => setTimeout(r, 150)));
        const START = { capital: 'w_republic', riverbank: 'w_federation', island: 'w_federation' }, START_OWNERS = START;

        // 시작 세이브 — 실제 게임에서 세계지도를 불러와 만든 상태 (공화국: 수도 / 연방: 강변 · 섬)
        let p = await newPage();
        await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
        await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3 && !!window.HemiWorldMap); await p.waitForTimeout(600);
        const startState = await p.evaluate(({ map, wm }) => { HemiWorldMap.importData({ ...map, worldMap: { owners: wm.owners, colors: wm.colors, countries: wm.countries } }); const st = getAppState(); delete st.campaign; return st; }, { map: F.map(), wm: F.worldMap() });
        assert.deepEqual(startState.worldMap.owners, { capital: 'w_republic', riverbank: 'w_federation', island: 'w_federation' });
        assert.ok(['w_republic', 'w_federation'].every(id => startState.history.ranking.rows.some(r => r.id === id)));
        const electoral = JSON.stringify(startState.election.district);
        await p.context().close();

        // ---------- 제작기: 세계지도 연결 · 가이드 입력 · 검사 결과 이동 · JSON/파일 왕복 ----------
        {
            p = await newPage();
            await p.addInitScript(() => { try { localStorage.setItem('hemicycleCampaignDetailMode', 'form'); } catch (e) { /* 무시 */ } });
            await p.goto(base + '/scenario.html'); await p.waitForFunction(() => !!window.HemiCampaignEditor);
            const d = F.scenario(); d.id = 'border_editor'; d.starts[0].state = startState;
            await p.evaluate(data => { HemiCampaignEditor.data = data; HemiCampaignEditor.setTab('starts'); }, d);
            const data = () => p.evaluate(() => { const c = JSON.parse(JSON.stringify(HemiCampaignEditor.data)); c.starts.forEach(s => delete s.state); return c; });
            const original = JSON.stringify(await data());
            // 시작 나라 › 세계지도 연결 — 나라 둘, 시작 세이브의 실제 국가 목록에서 고른다
            assert.equal(await p.locator('[data-world-card] [data-wc]').count(), 2);
            assert.match(await p.locator('[data-wb="0"]').innerText(), /지도 구역 3개/);
            assert.equal(await p.locator('[data-wbkey="republic"]').inputValue(), 'w_republic');
            assert.ok((await p.locator('[data-wbkey="federation"] option').allInnerTexts()).some(t => t === '연방'));
            await p.locator('[data-wbkey="federation"]').selectOption(''); assert.equal((await data()).starts[0].worldBindings.federation, undefined);
            await p.locator('[data-wbkey="federation"]').selectOption('w_federation');
            // 나라 열쇠를 바꾸면 연결 · 조건 · 효과 속 참조가 함께 바뀐다 (겹치는 열쇠는 거절)
            await p.locator('[data-wc="0"] [data-wckey]').fill('rep'); await p.locator('[data-wc="0"] [data-wckey]').blur();
            let cur = await data();
            assert.deepEqual([cur.world.countries[0].key, cur.starts[0].worldBindings.rep, cur.events[0].options[0].effects[0].transfer_regions.to.key, cur.articles[0].trigger.all[1].owns_regions.country.key, cur.focus[1].available.all[1].owns_regions.country.key], ['rep', 'w_republic', 'rep', 'rep', 'rep']);
            assert.deepEqual(await p.evaluate(() => HemiCampaignEditor.check()), []);
            await p.locator('[data-wc="0"] [data-wckey]').fill('federation'); await p.locator('[data-wc="0"] [data-wckey]').blur();
            assert.match(await p.locator('.dno-dialog-msg').innerText(), /겹치지 않게/); await p.locator('.dno-dialog-btn:not(.cancel)').click();
            assert.equal((await data()).world.countries[0].key, 'rep');
            await p.locator('[data-wc="0"] [data-wckey]').fill('republic'); await p.locator('[data-wc="0"] [data-wckey]').blur();
            assert.equal(JSON.stringify(await data()), original);
            // 이벤트 — 가이드 입력의 영토 변경 효과 · 구역 소유 조건 · 지도 변경 시
            await p.evaluate(() => HemiCampaignEditor.setTab('events'));
            const eff = p.locator('[data-guide="events.0.options.0.effects"] [data-gr="0"]');
            assert.equal(await eff.locator('[data-gf="type"]').inputValue(), 'transfer_regions');
            assert.equal(await eff.locator('[data-gf="ref"]').inputValue(), 'republic');
            assert.match(await eff.locator('.cpg-regions summary').innerText(), /구역 1개[\s\S]*강변/);
            await eff.locator('.cpg-regions summary').click();
            await eff.locator('[data-gregion-search]').fill('섬'); assert.equal(await eff.locator('.cpg-region-list > label:visible').count(), 1);
            await eff.locator('[data-gregion="island"]').check();
            assert.deepEqual((await data()).events[0].options[0].effects[0].transfer_regions.regions, ['riverbank', 'island']);
            assert.match(await eff.locator('.cpg-regions summary').innerText(), /구역 2개/);
            assert.equal(await eff.locator('.cpg-regions').evaluate(el => el.open), true); // 고르는 동안 목록이 닫히지 않는다
            await eff.locator('[data-gregion="island"]').uncheck();
            await eff.locator('[data-gf="ref"]').selectOption({ label: '미배정' }); assert.deepEqual((await data()).events[0].options[0].effects[0].transfer_regions.to, { unassigned: true });
            await eff.locator('[data-gf="ref"]').selectOption('republic');
            const trig = p.locator('[data-guide="events.1.trigger"] [data-gr="0"]');
            assert.equal(await trig.locator('[data-gf="type"]').inputValue(), 'owns_regions');
            await trig.locator('[data-gf="mode"]').selectOption('any'); assert.equal((await data()).events[1].trigger.owns_regions.mode, 'any');
            await trig.locator('[data-gf="mode"]').selectOption('all'); assert.equal((await data()).events[1].trigger.owns_regions.mode, undefined);
            assert.equal(await p.locator('[data-script-field="events.1.check"]').inputValue(), 'world');
            assert.ok((await p.locator('[data-script-field="events.1.check"] option').allInnerTexts()).includes('지도 변경 시'));
            await p.locator('[data-script-field="events.1.check"]').selectOption('any'); assert.equal((await data()).events[1].check, 'any');
            await p.locator('[data-script-field="events.1.check"]').selectOption('world');
            assert.equal(JSON.stringify(await data()), original);
            // 새 규칙을 가이드로 추가 — 조건은 구역 소유, 효과는 영토 변경을 고를 수 있다
            await p.locator('[data-guide="events.0.options.1.effects"] [data-gr-add]').click();
            await p.locator('[data-guide="events.0.options.1.effects"] [data-gr="1"] [data-gf="type"]').selectOption('transfer_regions');
            assert.deepEqual((await data()).events[0].options[1].effects[1], { transfer_regions: { to: { key: 'republic' }, regions: [] } });
            // 검사 — 빈 구역 목록은 오류. 결과에 사람이 읽는 위치가 나오고, 누르면 그 항목으로 간다
            await p.evaluate(() => HemiCampaignEditor.setTab('info'));
            await p.locator('#cpValidate').click();
            assert.match(await p.locator('#cpIssues').innerText(), /오류 1건/);
            assert.match(await p.locator('.cpe-issue-error').innerText(), /국경 협상 › 협정을 거절한다 › 영토 변경[\s\S]*구역을 하나 이상[\s\S]*events\.0\.options\.1\.effects\.1\.transfer_regions/);
            await p.locator('.cpe-issue-error').click();
            assert.equal(await p.locator('.cpe-tab.on').getAttribute('data-tab'), 'events');
            assert.equal(await p.locator('[data-guide="events.0.options.1.effects"].cpe-issue-target').count(), 1);
            await p.locator('[data-guide="events.0.options.1.effects"] [data-gr="1"] [data-gr-remove]').click();
            await p.locator('#cpValidate').click(); assert.match(await p.locator('#cpIssues').innerText(), /구조 검사 통과/);
            assert.equal(JSON.stringify(await data()), original);
            // 경고 · 확인 필요는 오류와 따로 세고 시험 플레이를 막지 않는다
            await p.evaluate(() => { const d2 = HemiCampaignEditor.data; d2.events[0].options[1].effects.push({ transfer_regions: { regions: ['capital'], to: { key: 'republic' } } }); d2.events[1].trigger = { all: [d2.events[1].trigger, { flag: 'nobody_sets_this' }] }; HemiCampaignEditor.data = d2; });
            await p.locator('#cpValidate').click();
            assert.match(await p.locator('#cpIssues').innerText(), /구조 검사 통과 · 경고 1건 · 확인 필요 1건/);
            assert.deepEqual(await p.evaluate(() => HemiCampaignEditor.check()), []);
            await p.evaluate(o => { const d2 = JSON.parse(o); d2.starts[0].state = HemiCampaignEditor.data.starts[0].state; HemiCampaignEditor.data = d2; }, original);
            // 기본 탭의 플레이 규칙 — 잠금을 켜면 playRules.locks에, 모두 끄면 칸 자체를 없앤다 (쓰지 않는 파일은 예전과 같게)
            await p.evaluate(() => HemiCampaignEditor.setTab('info'));
            await p.locator('[data-lock="worldMap"]').check(); await p.locator('[data-lock="economicRegions"]').check();
            assert.deepEqual((await data()).playRules, { locks: { worldMap: true, economicRegions: true } });
            assert.deepEqual(await p.evaluate(() => HemiCampaignEditor.check()), []);
            await p.locator('[data-lock="worldMap"]').uncheck(); await p.locator('[data-lock="economicRegions"]').uncheck();
            assert.equal(JSON.stringify(await data()), original);
            // 프로(JSON) 모드로 바꿨다 돌아와도, 파일로 내보냈다 불러와도 같은 자료
            await p.evaluate(() => HemiCampaignEditor.setTab('events'));
            await p.locator('#cpStudioBar [data-mode="json"]').click();
            assert.match(await p.locator('[data-json="events"]').inputValue(), /"transfer_regions"[\s\S]*"check": "world"/);
            await p.locator('#cpStudioBar [data-mode="form"]').click();
            assert.equal(JSON.stringify(await data()), original);
            const [download] = await Promise.all([p.waitForEvent('download'), p.locator('#cpExport').click()]);
            const file = await download.path(), fs = require('node:fs');
            await p.evaluate(() => { const d2 = HemiCampaignEditor.data; d2.world = { countries: [] }; d2.events = []; HemiCampaignEditor.data = d2; });
            await p.evaluate(bytes => { HemiCampaignEditor.importFile(new File([new Uint8Array(bytes)], 'border.hemicmp')); }, [...fs.readFileSync(file)]);
            await p.locator('.dno-dialog-btn:not(.cancel)').click(); // 같은 시나리오가 이미 있음 → 덮어쓰기
            await p.waitForFunction(() => HemiCampaignEditor.data.events.length === 2);
            const back = await data(); back.id = 'border_editor';
            assert.equal(JSON.stringify(back), original);
            assert.deepEqual(await p.evaluate(() => HemiCampaignEditor.data.starts[0].state.worldMap.owners), START_OWNERS);
            await p.context().close();
            console.log('PASS: maker — country bindings, key rename, guided territory rules, map-change timing, issue list navigation, JSON and file round trip');
        }

        // 제작기에 예제를 넣고 "시험 플레이"로 시작한다 (mutate로 변형)
        const launch = async (mode, mutate) => {
            const page = await newPage();
            await page.goto(base + '/scenario.html'); await page.waitForFunction(() => !!window.HemiCampaignEditor);
            const d = F.scenario(mode); d.id = 'border_' + mode + '_' + Math.random().toString(36).slice(2, 7); d.starts[0].state = startState; if (mutate) mutate(d);
            const issues = await page.evaluate(data => { HemiCampaignEditor.data = data; return HemiCampaignEditor.check(); }, d);
            assert.deepEqual(issues, []);
            await page.evaluate(() => { HemiCampaignEditor.play(); });
            await page.waitForURL('**/main.html'); await page.waitForFunction(() => !!window.HemiCampaign?.state && !!window.HemiWorldMap?.state);
            await page.locator('.cp-overlay .cp-primary').click(); await settle(page);
            return page;
        };
        const owners = page => page.evaluate(() => ({ ...HemiWorldMap.state.owners }));
        const flags = page => page.evaluate(() => Object.keys(HemiScriptMods.flags('campaign.' + HemiCampaign.state.data.id)).sort());
        const day = page => page.evaluate(() => HemiCampaign.state.clock.day);
        const title = page => page.locator('.sm-ev-title').innerText();
        const toTalks = async (page, mode) => {
            await page.evaluate(() => HemiCampaign.startFocus('open_talks'));
            if (mode === 'turn') { assert.equal(await page.evaluate(() => HemiCampaign.nextTurn()), true); await settle(page); assert.equal(await page.locator('.sm-overlay').count(), 0); assert.equal(await page.evaluate(() => HemiCampaign.nextTurn()), true); }
            else { const d0 = await day(page); await page.evaluate(() => { HemiCampaign.setSpeed(5); HemiCampaign.play(); }); await page.waitForSelector('.sm-narrative'); assert.equal(await day(page) - d0, 2); assert.equal(await page.evaluate(() => HemiCampaign.state.clock.paused), true); } // 48시간 뒤, 창이 뜨면 멈춘다
            await page.waitForSelector('.sm-narrative'); assert.equal(await title(page), '국경 협상');
        };
        const finish = async (page, mode, focus) => { // 후속 방향성(1일) → 결말
            await page.evaluate(id => HemiCampaign.startFocus(id), focus);
            if (mode === 'turn') await page.evaluate(() => HemiCampaign.nextTurn()); else await page.evaluate(() => { HemiCampaign.setSpeed(5); HemiCampaign.play(); });
            await page.waitForSelector('.cp-overlay .cp-super-title');
            return page.locator('.cp-overlay .cp-super-title').innerText();
        };

        for (const mode of ['turn', 'realtime']) {
            // ---------- 수락 ----------
            p = await launch(mode);
            assert.deepEqual(await p.evaluate(() => HemiCampaign.state.worldBindings), { republic: 'w_republic', federation: 'w_federation' });
            assert.deepEqual(await p.evaluate(() => ['integrate_riverbank', 'fortify_border'].map(id => document.querySelector(`[data-focus="${id}"]`)?.className || '')).then(() => owners(p)), START);
            await toTalks(p, mode);
            const dayAtChoice = await day(p);
            await p.locator('.sm-ev-opt').nth(0).click();
            // 영토는 선택한 즉시, 대상 구역만 바뀐다 — 수도 · 섬은 그대로, 색은 공화국의 기존 색
            assert.deepEqual(await owners(p), { capital: 'w_republic', riverbank: 'w_republic', island: 'w_federation' });
            assert.equal(await p.evaluate(() => document.querySelector('[data-wm-key="riverbank"]').getAttribute('fill')), '#437fa2');
            assert.equal(await p.evaluate(() => document.querySelector('[data-wm-key="island"]').getAttribute('fill')), '#c34e4e');
            assert.match(await p.locator('#wmLegend').innerText(), /공화국\s*2/);
            assert.equal(await p.locator('#wmUndo').isDisabled(), true); // 자동 결과는 수동 실행 취소로 되돌릴 수 없다
            // 날짜를 넘기지 않고 "지도 변경 시" 이벤트가 이어서 열리고, 그 뒤 조건 기사가 한 번 발행된다
            await p.waitForFunction(() => document.querySelector('.sm-ev-title')?.textContent === '새로운 국경');
            assert.equal(await day(p), dayAtChoice);
            await p.locator('.sm-ev-opt').click();
            await p.waitForSelector('.ca-overlay'); assert.match(await p.locator('.ca-overlay').innerText(), /강변, 공화국 품으로/);
            assert.equal(await day(p), dayAtChoice);
            await p.locator('.ca-close').click(); await settle(p);
            assert.deepEqual(await flags(p), ['border_agreement_accepted', 'focus_open_talks']);
            assert.equal(JSON.stringify(await p.evaluate(() => getAppState().election.district)), electoral); // 선거용 지역구 지도는 그대로
            // 저장 → 복원: 영토 · 나라 연결이 그대로고, 끝난 이벤트 · 기사 · 효과가 다시 실행되지 않는다
            const fired = await p.evaluate(() => JSON.stringify(HemiScriptMods.state.fired));
            await p.evaluate(() => setAppState(JSON.parse(JSON.stringify(getAppState())))); await p.waitForTimeout(500);
            assert.deepEqual(await owners(p), { capital: 'w_republic', riverbank: 'w_republic', island: 'w_federation' });
            assert.deepEqual(await p.evaluate(() => HemiCampaign.state.worldBindings), { republic: 'w_republic', federation: 'w_federation' });
            assert.equal(await p.evaluate(() => JSON.stringify(HemiScriptMods.state.fired)), fired);
            assert.equal(await p.locator('.sm-overlay, .ca-overlay').count(), 0);
            // 나라 연결이 없는 예전 세이브는 시작 나라의 선언에서 되살린다
            await p.evaluate(() => { const st = JSON.parse(JSON.stringify(getAppState())); delete st.campaign.worldBindings; setAppState(st); }); await p.waitForTimeout(300);
            assert.deepEqual(await p.evaluate(() => HemiCampaign.state.worldBindings), { republic: 'w_republic', federation: 'w_federation' });
            // 수락 경로의 방향성만 열리고, 끝까지 가면 그 결말
            assert.deepEqual(await p.evaluate(() => { const st = id => { const before = HemiCampaign.state.focus.cur; HemiCampaign.startFocus(id); const on = HemiCampaign.state.focus.cur?.id === id; HemiCampaign.state.focus.cur = before; return on; }; return [st('fortify_border'), st('integrate_riverbank')]; }), [false, true]);
            assert.equal(await finish(p, mode, 'integrate_riverbank'), '강 건너의 평화');
            await p.context().close();

            // ---------- 거절 ----------
            p = await launch(mode);
            await toTalks(p, mode);
            await p.locator('.sm-ev-opt').nth(1).click(); await settle(p); await p.waitForTimeout(300);
            assert.deepEqual(await owners(p), START);
            assert.equal(await p.locator('.sm-overlay, .ca-overlay').count(), 0); // 지도 변경 이벤트 · 기사 없음
            assert.deepEqual(await flags(p), ['border_agreement_rejected', 'focus_open_talks']);
            assert.deepEqual(await p.evaluate(() => Object.keys(HemiCampaign.state.articles.published)), []);
            assert.equal(await finish(p, mode, 'fortify_border'), '지켜 낸 옛 국경');
            await p.context().close();
            console.log(`PASS: border agreement ${mode} — accept (territory, map-change event, one article, save/restore, ending) and reject (map kept, other ending)`);
        }

        // ---------- 실패 계약 · 수동 편집 · 연쇄 상한 ----------
        p = await launch('turn', d => {
            d.decisions = [{ id: 'cede_island', title: '섬 반환 요구', once: false, effects: [{ transfer_regions: { regions: ['island'], to: { key: 'republic' } } }, { set_flag: 'island_taken' }] }];
            d.focus.push({ id: 'survey', title: '국경 측량', icon: '📐', x: 6, y: 0, days: 1, desc: '', prereq: [], any: [], exclusive: [], effects: [{ transfer_regions: { regions: ['capital'], to: { key: 'republic' } } }, { set_flag: 'surveyed' }] });
        });
        const mod = await p.evaluate(() => 'campaign.' + HemiCampaign.state.data.id);
        const dropRepublic = () => p.evaluate(() => { const rows = HemiHistory.ranking.rows, i = rows.findIndex(r => r.id === 'w_republic'); window.__row = rows.splice(i, 1)[0]; window.__at = i; });
        const restoreRepublic = () => p.evaluate(() => HemiHistory.ranking.rows.splice(window.__at, 0, window.__row));
        // 조건 — 없는 구역 · 끊긴 연결은 not · any 안에서도 식 전체가 거짓
        assert.deepEqual(await p.evaluate(id => { const t = c => HemiScriptMods.test(c, id), rep = { key: 'republic' }; return [
            t({ owns_regions: { country: rep, regions: ['capital'] } }), t({ not: { owns_regions: { country: rep, regions: ['riverbank'] } } }),
            t({ not: { owns_regions: { country: rep, regions: ['nowhere'] } } }), t({ any: [{ always: true }, { owns_regions: { country: rep, regions: ['nowhere'] } }] }),
            t({ any: [{ always: true }, { not: { owns_regions: { country: { key: 'empire' }, regions: ['capital'] } } }] }),
            t({ owns_regions: { country: { unassigned: true }, regions: ['capital'] } }), t({ owns_regions: { country: { key: 'federation' }, regions: ['riverbank', 'capital'], mode: 'any' } }) ]; }, mod), [true, true, false, false, false, false, true]);
        // 결정 — 연결한 국가가 사라지면 실행하지 않고 사용 기록 · 플래그도 남기지 않는다. 고치면 다시 할 수 있다
        await dropRepublic();
        await p.evaluate(id => HemiScriptMods.take(id, 'cede_island'), mod);
        assert.match(await p.locator('.dno-dialog-overlay, .custom-alert, #customAlertOverlay').last().innerText(), /실행할 수 없습니다[\s\S]*국가 순위에 없습니다/);
        await p.keyboard.press('Enter'); await settle(p);
        assert.deepEqual(await p.evaluate(id => [HemiScriptMods.state.taken[id]?.cede_island ?? null, !!HemiScriptMods.flags(id).island_taken, HemiWorldMap.state.owners.island], mod), [null, false, 'w_federation']);
        // 방향성 — 완료 효과가 틀리면 완료로 기록하지 않는다
        await p.evaluate(() => HemiCampaign.startFocus('survey')); await p.evaluate(() => HemiCampaign.nextTurn()); await settle(p);
        assert.match(await p.locator('.dno-dialog-overlay, .custom-alert, #customAlertOverlay').last().innerText(), /완료할 수 없습니다/);
        await p.keyboard.press('Enter'); await settle(p);
        assert.deepEqual(await p.evaluate(id => [HemiCampaign.state.focus.cur?.id, !!HemiCampaign.state.focus.done.survey, !!HemiScriptMods.flags(id).focus_survey, !!HemiScriptMods.flags(id).surveyed], mod), ['survey', false, false, false]);
        await restoreRepublic();
        await p.evaluate(() => HemiCampaign.tick()); await settle(p);
        assert.deepEqual(await p.evaluate(id => [HemiCampaign.state.focus.cur, !!HemiCampaign.state.focus.done.survey, !!HemiScriptMods.flags(id).surveyed], mod), [null, true, true]);
        await p.evaluate(id => HemiScriptMods.take(id, 'cede_island'), mod); await settle(p);
        assert.deepEqual(await p.evaluate(id => [HemiScriptMods.state.taken[id]?.cede_island != null, !!HemiScriptMods.flags(id).island_taken, HemiWorldMap.state.owners.island], mod), [true, true, 'w_republic']);
        // 반복 결정의 다음 실행은 막지 않는다 (이미 그 나라 것 — 성공한 무변경, 지도 변경 알림 없음)
        const notes = await p.evaluate(id => { let n = 0; const on = () => n++; window.addEventListener('hemi-world-map-changed', on); HemiScriptMods.take(id, 'cede_island'); window.removeEventListener('hemi-world-map-changed', on); return n; }, mod);
        assert.equal(notes, 0);
        // 이벤트 선택 — 사전 검사에 걸리면 창과 선택지를 그대로 두고 이유를 보여 준다. 고친 뒤 같은 창에서 다시 고를 수 있다
        await p.evaluate(() => HemiCampaign.startFocus('open_talks')); await p.evaluate(() => HemiCampaign.nextTurn()); await settle(p); await p.evaluate(() => HemiCampaign.nextTurn());
        await p.waitForSelector('.sm-narrative');
        const firedBefore = await p.evaluate(id => HemiScriptMods.state.fired[id].border_talks, mod);
        await dropRepublic();
        await p.locator('.sm-ev-opt').nth(0).click();
        assert.equal(await p.locator('.sm-overlay').count(), 1); assert.equal(await p.locator('.sm-ev-opt').count(), 2);
        assert.match(await p.locator('.sm-ev-error').innerText(), /국가 순위에 없습니다/);
        assert.deepEqual(await p.evaluate(id => [HemiWorldMap.state.owners.riverbank, !!HemiScriptMods.flags(id).border_agreement_accepted, HemiScriptMods.state.queue.length, HemiScriptMods.state.fired[id].border_talks], mod), ['w_federation', false, 1, firedBefore]);
        await restoreRepublic();
        await p.locator('.sm-ev-opt').nth(0).click();
        assert.equal(await p.evaluate(() => HemiWorldMap.state.owners.riverbank), 'w_republic');
        await p.waitForFunction(() => document.querySelector('.sm-ev-title')?.textContent === '새로운 국경'); await p.locator('.sm-ev-opt').click();
        await p.waitForSelector('.ca-overlay'); await p.locator('.ca-close').click(); await settle(p);
        // 사전 검사를 거치지 않는 길(직접 실행)에서도 한 효과의 구역은 전부 아니면 전무
        assert.deepEqual(await p.evaluate(id => { const before = JSON.stringify(HemiWorldMap.state.owners); HemiScriptMods.run([{ transfer_regions: { regions: ['capital', 'atlantis'], to: { key: 'federation' } } }], id); return [JSON.stringify(HemiWorldMap.state.owners) === before, HemiScriptMods.mods.find(m => m.id === id).log.some(l => /transfer_regions: .*atlantis/.test(l))]; }, mod), [true, true]);
        // 여러 구역을 한 번에 — 알림은 한 번
        assert.deepEqual(await p.evaluate(id => { let n = 0, keys = null; const on = e => { n++; keys = e.detail.keys; }; window.addEventListener('hemi-world-map-changed', on); HemiScriptMods.run([{ transfer_regions: { regions: ['capital', 'riverbank', 'island'], to: { unassigned: true } } }], id); window.removeEventListener('hemi-world-map-changed', on); return [n, keys.sort(), Object.keys(HemiWorldMap.state.owners).length]; }, mod), [1, ['capital', 'island', 'riverbank'], 0]);
        await p.context().close();
        console.log('PASS: failed references leave no partial territory, completion flag or decision record; the event stays open and can be retried');

        // 수동 칠하기도 붓질이 끝나면 한 번 검사한다 (날짜는 그대로). 자동 효과 뒤에는 옛 실행 취소 기록이 없다
        p = await launch('turn');
        const d0 = await day(p);
        await p.evaluate(() => { switchSubTab('world', 'worldmap'); });
        await p.locator('#wmCountry').selectOption('w_republic');
        await p.locator('[data-wm-key="island"]').click();
        assert.equal(await p.locator('#wmUndo').isDisabled(), false); await settle(p);
        assert.equal(await p.locator('.sm-overlay').count(), 0); // 섬은 조건(강변)이 아니다
        await p.locator('[data-wm-key="riverbank"]').click();
        await p.waitForFunction(() => document.querySelector('.sm-ev-title')?.textContent === '새로운 국경');
        assert.equal(await day(p), d0);
        await p.locator('.sm-ev-opt').click(); await settle(p);
        assert.deepEqual(await p.evaluate(() => Object.keys(HemiCampaign.state.articles.published)), []); // 기사는 수락 플래그도 필요
        await p.evaluate(id => HemiScriptMods.run([{ transfer_regions: { regions: ['island'], to: { key: 'federation' } } }], id), await p.evaluate(() => 'campaign.' + HemiCampaign.state.data.id));
        assert.equal(await p.locator('#wmUndo').isDisabled(), true);
        await p.context().close();

        // 숨은 이벤트 둘이 서로 영토를 되돌리는 순환 — 32번에서 멈추고 알려 준다
        p = await launch('turn', d => {
            d.events.push({ id: 'ping', hidden: true, once: false, check: 'world', trigger: { owns_regions: { country: { key: 'republic' }, regions: ['island'] } }, options: [{ text: 'x', effects: [{ transfer_regions: { regions: ['island'], to: { key: 'federation' } } }] }] },
                { id: 'pong', hidden: true, once: false, check: 'world', trigger: { owns_regions: { country: { key: 'federation' }, regions: ['island'] } }, options: [{ text: 'x', effects: [{ transfer_regions: { regions: ['island'], to: { key: 'republic' } } }] }] });
        });
        const modC = await p.evaluate(() => 'campaign.' + HemiCampaign.state.data.id);
        await p.evaluate(() => { switchSubTab('world', 'worldmap'); }); await p.locator('#wmCountry').selectOption('w_republic'); await p.locator('[data-wm-key="island"]').click();
        await p.waitForFunction(id => HemiScriptMods.mods.find(m => m.id === id).log.some(l => /32번 넘게 이어져 멈춤/.test(l)), modC);
        const chain = await p.evaluate(id => { const f = HemiScriptMods.state.fired[id]; return [(f.ping || 0) + (f.pong || 0), HemiScriptMods.mods.find(m => m.id === id).log.find(l => /32번/.test(l))]; }, modC);
        assert.ok(chain[0] >= 32 && chain[0] <= 66, String(chain[0])); // 검사 32번 — 한 번 검사에 두 이벤트가 함께 일어날 수 있다 assert.match(chain[1], /ping/); assert.match(chain[1], /pong/);
        await p.waitForTimeout(400);
        assert.equal(await p.evaluate(id => { const f = HemiScriptMods.state.fired[id]; return (f.ping || 0) + (f.pong || 0); }, modC), chain[0]); // 멈춘 뒤 더 돌지 않는다
        await p.context().close();
        console.log('PASS: manual painting rechecks map-change events once without advancing time; scripted changes clear manual undo; runaway hidden chains stop at 32');

        // ---------- 플레이 규칙: 세계지도 · 경제권 직접 수정 잠금 ----------
        p = await launch('turn', d => { d.playRules = { locks: { worldMap: true, economicRegions: true } }; });
        assert.deepEqual(await p.evaluate(() => getAppState().campaign.playRules), { locks: { worldMap: true, economicRegions: true } }); // 적용한 정책을 세이브에 보관
        await p.evaluate(() => switchSubTab('world', 'worldmap')); await settle(p);
        assert.match(await p.locator('#wmLock').innerText(), /영토를 직접 수정할 수 없습니다[\s\S]*방향성 · 이벤트 · 결정/);
        for (const id of ['wmOpen', 'wmUndo', 'wmRedo', 'wmClear', 'wmAddCountry', 'wmColor']) assert.equal(await p.locator('#' + id).isDisabled(), true, id);
        assert.equal(await p.locator('[data-wm-tool="paint"]').isDisabled(), true); assert.equal(await p.locator('[data-wm-tool="inspect"]').isDisabled(), false);
        assert.equal(await p.locator('#wmExport').isDisabled(), false); assert.equal(await p.locator('#wmZoomIn').isDisabled(), false); // 보기 · 내보내기는 그대로
        // 누르기 · 끌기 · 키보드 · 꺼진 버튼을 스크립트로 눌러도 바뀌지 않는다 — 구역 확인은 된다
        await p.locator('[data-wm-key="island"]').click();
        const bb = async key => p.locator(`[data-wm-key="${key}"]`).boundingBox(), r1 = await bb('riverbank'), r2 = await bb('island');
        await p.mouse.move(r1.x + 20, r1.y + 20); await p.mouse.down(); await p.mouse.move(r2.x + 20, r2.y + 20, { steps: 4 }); await p.mouse.up();
        await p.locator('[data-wm-key="riverbank"]').focus(); await p.keyboard.press('Enter');
        await p.evaluate(() => { for (const id of ['wmClear', 'wmUndo', 'wmRedo', 'wmAddCountry']) { const b2 = document.getElementById(id); b2.disabled = false; b2.click(); } const t = document.querySelector('[data-wm-tool="erase"]'); t.disabled = false; t.click(); document.querySelector('[data-wm-key="capital"]').dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); });
        await settle(p);
        assert.deepEqual(await owners(p), START);
        assert.equal(await p.locator('.dno-dialog-overlay').count(), 0); // 지우기 확인 창도 뜨지 않는다
        assert.match(await p.locator('#wmRegion').innerText(), /수도 · /);
        const rowsBefore = await p.evaluate(() => HemiHistory.ranking.rows.length);
        await p.locator('#wmFile').setInputFiles({ name: 'other.hemimap', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(F.map())) });
        assert.match(await p.locator('.dno-dialog-msg').innerText(), /영토를 직접 수정할 수 없습니다/); await p.locator('.dno-dialog-btn:not(.cancel)').click();
        assert.deepEqual(await owners(p), START); assert.equal(await p.evaluate(() => HemiHistory.ranking.rows.length), rowsBefore);
        // 국가 순위에서 영토가 있는 국가를 지워 미배정으로 만드는 길도 막힌다
        await p.evaluate(() => switchSubTab('world', 'ranking')); await settle(p);
        await p.locator('[data-rdel="w_federation"]').click();
        assert.match(await p.locator('.dno-dialog-msg').innerText(), /영토를 직접 수정할 수 없습니다[\s\S]*영토가 있습니다/); await p.locator('.dno-dialog-btn:not(.cancel)').click(); await settle(p);
        assert.ok(await p.evaluate(() => HemiHistory.ranking.rows.some(r => r.id === 'w_federation')));
        // 경제권도 같다
        await p.evaluate(() => switchSubTab('world', 'econblocs')); await settle(p);
        assert.match(await p.locator('#weLock').innerText(), /경제권을 직접 수정할 수 없습니다/);
        assert.equal(await p.locator('#weAdd').isDisabled(), true);
        await p.evaluate(() => { const i = document.getElementById('weNewName'); i.disabled = false; i.value = '몰래'; const b2 = document.getElementById('weAdd'); b2.disabled = false; b2.click(); });
        assert.equal(await p.evaluate(() => HemiWorldMap.economic.zones.length), 0);
        // 잠가도 시나리오의 효과로는 바뀐다 — 수락하면 강변이 넘어온다. 저장 → 복원 뒤에도 잠금 유지
        await toTalks(p, 'turn'); await p.locator('.sm-ev-opt').nth(0).click();
        assert.deepEqual(await owners(p), { ...START, riverbank: 'w_republic' });
        await p.waitForFunction(() => document.querySelector('.sm-ev-title')?.textContent === '새로운 국경'); await p.locator('.sm-ev-opt').click();
        await p.waitForSelector('.ca-overlay'); await p.locator('.ca-close').click(); await settle(p);
        await p.evaluate(() => setAppState(JSON.parse(JSON.stringify(getAppState())))); await p.waitForTimeout(400);
        await p.evaluate(() => switchSubTab('world', 'worldmap')); await settle(p);
        assert.equal(await p.locator('#wmLock').isVisible(), true); await p.locator('[data-wm-key="island"]').click();
        assert.deepEqual(await owners(p), { ...START, riverbank: 'w_republic' });
        // 적용한 정책 칸이 빠진 진행 세이브는 시나리오의 선언에서 되살린다 (조용히 풀리지 않는다)
        await p.evaluate(() => { const st = JSON.parse(JSON.stringify(getAppState())); delete st.campaign.playRules; setAppState(st); }); await p.waitForTimeout(400);
        assert.match(await p.evaluate(() => HemiCampaign.lockReason('worldMap')), /직접 수정할 수 없습니다/);
        // 시나리오가 없는 다른 세이브를 열면 잠금이 없다
        await p.evaluate(() => { const st = JSON.parse(JSON.stringify(getAppState())); delete st.campaign; setAppState(st); }); await p.waitForTimeout(400);
        await p.evaluate(() => switchSubTab('world', 'worldmap')); await settle(p);
        assert.equal(await p.locator('#wmLock').isVisible(), false); assert.equal(await p.evaluate(() => HemiCampaign.lockReason('worldMap')), null);
        await p.locator('#wmCountry').selectOption('w_federation'); await p.locator('[data-wm-tool="paint"]').click(); await p.locator('[data-wm-key="capital"]').click();
        assert.equal((await owners(p)).capital, 'w_federation');
        await p.context().close();
        console.log('PASS: play rules — locked map/economic regions cannot be edited by click, drag, keyboard, forced buttons or file import; scenario effects still apply; lock survives save/restore');

        assert.deepEqual(errors, []);
        console.log('PASS: no uncaught browser errors');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
