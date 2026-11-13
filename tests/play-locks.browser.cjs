// 플레이 규칙 — 정당 · 의석 · 선거제도 · 정부 · 여론 · 경제 직접 수정 잠금 (js/play-locks.js). 실제 마우스 · 키보드 입력으로 확인한다.
//   python3 -m http.server 8000 & node tests/play-locks.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const T = require('../js/campaign-tools.js');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage();
        p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
        const settle = (ms = 120) => p.evaluate(m => new Promise(r => setTimeout(r, m)), ms);
        await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
        await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3); await p.waitForTimeout(600);
        assert.ok(await p.evaluate(() => HemiPlayLocks.wrapped.length) > 120); // 목록의 함수가 실제로 있다
        const missing = await p.evaluate(() => Object.values(HemiPlayLocks.LOCKS).flatMap(d => d.fns).filter(n => !HemiPlayLocks.wrapped.includes(n)));
        assert.deepEqual(missing, []);
        const st = () => p.evaluate(() => ({ name: parties[0].name, color: parties[0].color, count: parties.length, seats: parties[0].seatsHouse, gov: govType, ideo: ideologies.length }));
        const nameInput = () => p.locator('#partyInfoList input[onchange^="updateParty(0,\'name\'"]');

        // ---------- 잠금 없는 일반 게임 — 그대로 고칠 수 있다 ----------
        await p.evaluate(() => switchSubTab('setup', 'party')); await settle();
        await nameInput().fill('자유롭게'); await nameInput().press('Tab'); await settle();
        assert.equal((await st()).name, '자유롭게');
        assert.equal(await p.locator('.hemi-lock-note').count(), 0);

        // ---------- 모두 잠근 시나리오 ----------
        const d = T.starter('locks_all'); d.playRules = { locks: Object.fromEntries(T.LOCKS.map(k => [k, true])) };
        d.events.push({ id: 'rename', title: '개명', trigger_only: true, options: [{ text: '바꾼다', effects: [{ rename_party: { party: '자유롭게', name: '효과로 바뀜' } }, { support: { party: '효과로 바뀜', add: 3 } }] }] });
        await p.evaluate(data => HemiCampaign.attach(data, 's1'), d); await p.locator('.cp-overlay .cp-primary').click(); await settle(300);
        const before = await st();
        // 정당 — 이름 입력 · 정당 추가 · 순서 끌기
        await p.evaluate(() => switchSubTab('setup', 'party')); await settle();
        assert.match(await p.locator('#contentParty > .hemi-lock-note').innerText(), /정당 · 이념을 직접 수정할 수 없습니다/);
        await nameInput().fill('몰래 바꾸기'); await nameInput().press('Tab'); await settle();
        assert.equal((await st()).name, before.name);
        assert.equal(await nameInput().inputValue(), before.name); // 화면도 원래 값으로
        assert.match(await p.locator('#kbdToast').innerText(), /정당 · 이념을 직접 수정할 수 없습니다/);
        await p.locator('#contentParty button.add-btn').first().click(); await settle();
        assert.equal((await st()).count, before.count);
        const handle = p.locator('#partyInfoList .drag-handle').first();
        assert.ok(await handle.count(), 'handle exists'); { const b = await handle.boundingBox(); await p.mouse.move(b.x + 3, b.y + 3); await p.mouse.down(); await p.mouse.move(b.x + 3, b.y + 220, { steps: 6 }); await p.mouse.up(); await settle(); assert.equal(await p.evaluate(() => parties[0].name), before.name); }
        // 이념
        await p.evaluate(() => switchSubTab('setup', 'ideology')); await settle();
        assert.equal(await p.locator('#contentIdeology > .hemi-lock-note').count(), 1);
        const addIdeo = p.locator('#contentIdeology button[onclick^="addIdeology"]').first();
        assert.ok(await addIdeo.count(), 'addIdeo exists'); { await addIdeo.click(); await settle(); assert.equal((await st()).ideo, before.ideo); }
        // 의석
        await p.evaluate(() => switchSubTab('setup', 'settings')); await settle();
        // 의석이 있는 정당의 칸 — 의석은 남은 자리까지만 늘릴 수 있어 줄여 보는 것으로 확인
        const seatIdxAll = await p.evaluate(() => [...document.querySelectorAll('#partyListHouse input[onchange^="setPartySeats("]')].map(el => Number(el.getAttribute('onchange').match(/setPartySeats\((\d+)/)[1])).find(i => parties[i].seatsHouse > 3));
        const seat = p.locator(`#partyListHouse input[onchange^="setPartySeats(${seatIdxAll},"]`);
        const seatIdx = Number((await seat.getAttribute('onchange')).match(/setPartySeats\((\d+)/)[1]);
        const seatsOf = () => p.evaluate(i => parties[i].seatsHouse, seatIdx);
        const seat0 = await seatsOf();
        await seat.fill(String(seat0 - 2)); await seat.press('Tab'); await settle();
        assert.equal(await seatsOf(), seat0);
        assert.equal(Number(await seat.inputValue()), seat0);
        assert.match(await p.locator('#contentSettings > .hemi-lock-note').innerText(), /의석 · 의원/);
        // 정부 형태
        await p.evaluate(() => switchSubTab('cabinet', 'system')); await settle();
        const other = before.gov === 'presidential' ? 'semi' : 'presidential';
        await p.locator(`button[onclick="setGovType('${other}')"]`).click(); await settle();
        assert.equal((await st()).gov, before.gov);
        // 선거 제도
        await p.evaluate(() => switchSubTab('vote', 'elecSettings')); await settle();
        const mode0 = await p.evaluate(() => getAppState().election.presElectionMode);
        const otherMode = mode0 === 'runoff' ? 'plurality' : 'runoff';
        await p.locator(`#contentElecSettings [onclick="setPresElectionMode('${otherMode}')"]`).click(); await settle();
        assert.equal(await p.evaluate(() => getAppState().election.presElectionMode), mode0);
        assert.match(await p.locator('#contentElecSettings > .hemi-lock-note').innerText(), /선거제도/);
        // 여론 — 국정 지지율 칸은 꺼져 있다, 정당 지지율 입력은 막힌다
        await p.evaluate(() => { switchMainTab('election'); elecSwitchSub('approval'); }); await settle(200);
        const appr = p.locator('#elecSubApproval [data-appr] [data-num]').first();
        assert.ok(await appr.count(), 'appr exists'); { assert.equal(await appr.isDisabled(), true); assert.equal(await p.locator('#elecSubApproval [data-auto]').isDisabled(), true); assert.equal(await p.locator('#elecSubApproval [data-trend]').isDisabled(), false); }
        await p.evaluate(() => elecSwitchSub('prob')); await settle(200);
        const prob = p.locator('#elecSubProb input[oninput^="elecSetProb"]').first();
        assert.ok(await prob.count(), 'prob exists'); { const sv = await p.evaluate(() => JSON.stringify(elecStore)); await prob.fill('77'); await settle(); assert.equal(await p.evaluate(() => JSON.stringify(elecStore)), sv); }
        // 경제 편집 화면 — 입력 칸이 꺼져 있다 (정책 화면은 그대로)
        await p.evaluate(() => { try { switchSubTab('economy', 'scenario'); } catch (e) { /* 경제 탭 없음 */ } }); await settle(200);
        const ecoInputs = await p.evaluate(() => { const c = document.getElementById('contentEcoScenario'); return c ? [...c.querySelectorAll('input,select,textarea,button:not(.sub-tab-btn)')].map(x => x.disabled) : null; });
        assert.ok(ecoInputs && ecoInputs.length, 'economy editor inputs exist'); assert.ok(ecoInputs.every(Boolean), JSON.stringify(ecoInputs));
        console.log('PASS: locked parties/ideologies/seats/government/elections/opinion/economy cannot be edited by typing, clicking or dragging; notes and reverted inputs shown');

        // ---------- 게임 진행 · 효과로는 바뀐다 ----------
        const mod = await p.evaluate(() => 'campaign.' + HemiCampaign.state.data.id);
        await p.evaluate(id => HemiScriptMods.fire(id, 'rename'), mod); await p.waitForSelector('.sm-ev-opt'); await p.locator('.sm-ev-opt').click(); await settle();
        assert.equal((await st()).name, '효과로 바뀜');
        // 게임 진행 화면 안의 조작이 편집 함수를 불러도 통과 (선거 반영 · 표결 · 왕실 전환처럼)
        await p.evaluate(() => { switchSubTab('campaign', 'campaign'); const b = document.createElement('button'); b.id = 'tPlay'; b.textContent = 'x'; b.onclick = () => setPartySeats ? updateParty(0, 'seatsHouse', parties[0].seatsHouse + 1) : 0; document.getElementById('mainContentCampaign').appendChild(b); });
        await p.locator('#tPlay').click(); await settle();
        assert.equal((await st()).seats, before.seats + 1);
        // 입력 없이 부른 것(불러오기 · 내부 정리)은 통과
        await p.evaluate(() => updateParty(0, 'color', '#123456')); assert.equal((await st()).color, '#123456');
        console.log('PASS: scenario effects, play surfaces and internal calls still change locked areas');

        // ---------- 실행 취소 ----------
        await p.evaluate(() => switchSubTab('nation', 'symbol')); await settle();
        const nation = p.locator('#nationNameInput'), nameBefore = await nation.inputValue();
        await nation.click(); await nation.fill(nameBefore + ' 2'); await p.locator('body').click({ position: { x: 5, y: 5 } }); await settle(700);
        await p.keyboard.press('Control+z'); await settle(400);
        assert.equal(await p.evaluate(() => document.getElementById('nationNameInput').value), nameBefore); // 잠긴 항목을 건드리지 않는 실행 취소는 된다
        for (let i = 0; i < 6; i++) { await p.keyboard.press('Control+z'); await settle(150); }
        assert.equal((await st()).name, '효과로 바뀜'); // 효과로 바뀐 정당 이름은 실행 취소로 되돌아가지 않는다
        assert.equal((await st()).color, '#123456');
        // 저장 → 복원 뒤에도 잠금
        await p.evaluate(() => setAppState(JSON.parse(JSON.stringify(getAppState())))); await settle(400);
        await p.evaluate(() => switchSubTab('setup', 'party')); await settle();
        await nameInput().fill('또 몰래'); await nameInput().press('Tab'); await settle();
        assert.equal((await st()).name, '효과로 바뀜');
        console.log('PASS: undo cannot revert locked areas (other undo still works); locks survive save/restore');

        // ---------- 일부만 잠근 시나리오 ----------
        const d2 = T.starter('locks_some'); d2.playRules = { locks: { seats: true } };
        await p.evaluate(data => { const s = JSON.parse(JSON.stringify(getAppState())); delete s.campaign; setAppState(s); HemiCampaign.attach(data, 's1'); }, d2); await p.locator('.cp-overlay .cp-primary').click(); await settle(300);
        await p.evaluate(() => switchSubTab('setup', 'party')); await settle();
        assert.equal(await p.locator('#contentParty > .hemi-lock-note').count(), 0);
        await nameInput().fill('정당은 풀림'); await nameInput().press('Tab'); await settle();
        assert.equal((await st()).name, '정당은 풀림');
        await p.evaluate(() => switchSubTab('setup', 'settings')); await settle();
        const s0 = await seatsOf(); await seat.fill(String(s0 - 1)); await seat.press('Tab'); await settle();
        assert.equal(await seatsOf(), s0);
        // 시나리오가 없는 세이브로 돌아가면 다시 자유
        await p.evaluate(() => { const s = JSON.parse(JSON.stringify(getAppState())); delete s.campaign; setAppState(s); }); await settle(300);
        await p.evaluate(() => switchSubTab('setup', 'settings')); await settle();
        await seat.fill(String(s0 - 1)); await seat.press('Tab'); await settle();
        assert.equal(await seatsOf(), s0 - 1);
        assert.equal(await p.locator('.hemi-lock-note').count(), 0);
        assert.deepEqual(errors, []);
        console.log('PASS: per-item locks (seats only), unlocked again without a scenario; no browser errors');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
