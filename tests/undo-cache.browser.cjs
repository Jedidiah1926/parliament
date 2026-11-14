// 실행 취소 기준점 캐시 (js/main.js currentStateJSON) — 클릭마다 전체 상태를 JSON으로 바꾸지 않으면서도 실행 취소가 맞게 되는지.
//   python3 -m http.server 8000 & node tests/undo-cache.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage();
        p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
        await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
        await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3); await p.waitForTimeout(800);
        // 실행 취소 묶음이 확정될 때까지 (600ms 뒤 한가할 때)
        const settle = () => p.waitForFunction(() => pendingUndoSnapshot === null && !undoBatchTimer, null, { timeout: 5000 }).then(() => p.waitForTimeout(50));
        await p.evaluate(() => { window.__builds = 0; const o = appStateJSON; window.appStateJSON = function () { window.__builds++; return o(); }; });
        const date = () => p.evaluate(() => [nationDateYear.value, nationDateMonth.value, nationDateDay.value].join('-'));
        const nation = () => p.evaluate(() => document.getElementById('nationNameInput').value);
        await p.evaluate(() => { nationDateYear.value = '2000'; nationDateMonth.value = '1'; nationDateDay.value = '1'; updateDispInfoBar(); });
        const play = p.locator('.dib-play').first();

        // 1) 날짜 ▶ — 첫 클릭 뒤 확정되면 다음 클릭은 상태를 새로 만들지 않는다
        await play.click(); await settle();
        const undo0 = await p.evaluate(() => undoStack.length);
        await p.evaluate(() => { window.__builds = 0; });
        await play.click();
        assert.equal(await p.evaluate(() => window.__builds), 0, '확정 뒤 화면이 그대로면 클릭 때 상태를 다시 만들지 않는다');
        await settle();
        assert.equal(await date(), '2000-1-3');
        assert.equal(await p.evaluate(() => undoStack.length), undo0 + 1);
        await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
        assert.equal(await date(), '2000-1-2');
        await p.keyboard.press('Control+Shift+z'); await p.waitForTimeout(200);
        assert.equal(await date(), '2000-1-3');
        await settle();

        // 2) 입력 없이(타이머 · 스크립트로) 상태가 바뀐 뒤 — 캐시를 쓰면 안 된다
        await p.evaluate(() => advanceNationDate(5, 'day')); // 사용자 클릭이 아님 → 실행 취소 기록 없음
        assert.equal(await date(), '2000-1-8');
        await p.evaluate(() => { window.__builds = 0; });
        await p.evaluate(() => switchMainTab('nation')).catch(() => {});
        await p.evaluate(() => { const i = document.getElementById('nationNameInput'); i.closest('[style*="display: none"]') && i.scrollIntoView(); });
        const name0 = await nation();
        await p.evaluate(() => { const i = document.getElementById('nationNameInput'); i.focus(); i.value = '캐시시험국'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); i.blur(); });
        await settle();
        assert.ok(await p.evaluate(() => window.__builds) >= 1, '화면이 바뀐 뒤에는 상태를 새로 만든다');
        await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
        assert.equal(await nation(), name0, '나라 이름만 되돌린다');
        assert.equal(await date(), '2000-1-8', '스크립트로 바뀐 날짜는 그대로 (예전 상태로 되감기지 않음)');

        // 2-1) 입력 칸에 쓰다가 바로 ▶ — 이름과 날짜가 따로따로 되돌려진다
        await settle();
        await p.evaluate(() => { const i = document.getElementById('nationNameInput'); i.focus(); i.value = '둘째이름'; i.dispatchEvent(new Event('input', { bubbles: true })); });
        await play.click(); await settle();
        assert.equal(await nation(), '둘째이름'); assert.equal(await date(), '2000-1-9');
        await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
        assert.equal(await date(), '2000-1-8', '먼저 날짜만');
        assert.equal(await nation(), '둘째이름');
        await p.keyboard.press('Control+z'); await p.waitForTimeout(200);
        assert.equal(await nation(), name0, '그다음 이름');
        await settle();

        // 3) 빈 곳 클릭 — 실행 취소 기록 · "바뀜" 표시가 생기지 않는다 (savedAt만 다른 상태는 같은 상태)
        await p.evaluate(() => saveActiveNow(true)); await p.waitForTimeout(100);
        const n3 = await p.evaluate(() => undoStack.length);
        await p.mouse.click(5, 990); await settle();
        await p.mouse.click(5, 990); await settle();
        assert.equal(await p.evaluate(() => undoStack.length), n3);
        assert.equal(await p.evaluate(() => saveDirty), false);

        // 4) 저장 — 바뀐 게 없으면 상태를 다시 만들지 않는다
        await p.evaluate(() => { window.__builds = 0; saveActiveNow(); saveActiveNow(); });
        assert.equal(await p.evaluate(() => window.__builds), 0);

        assert.deepEqual(errors, []);
        console.log('undo-cache: ok');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
