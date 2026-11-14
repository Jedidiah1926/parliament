// 사이드바 접기 · 펴기 (js/sidenav.js · css/sidenav.css)
//  - 아이콘 · 접기 버튼 · 검색 돋보기 · 점이 두 상태에서 같은 x (아이콘 열이 움직이지 않음)
//  - 본문은 끝 자리로 한 번에 놓이고, 판의 폭과 본문 위치만 같은 곡선으로 움직인다 (D1)
//  - 접힌 사이드바: 하위 항목은 점, 점 클릭 = 그 화면, 점 위 이름표가 따라옴, 아이콘 클릭 = 점 열고 닫기(펼친 목록과 같은 상태)
//   python3 -m http.server 8000 & node tests/sidenav.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        for (const theme of ['tno', 'light', 'dark']) {
            const errors = [];
            const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage();
            p.setDefaultTimeout(15000); p.on('pageerror', e => errors.push(e.message)); await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
            await ctx.addInitScript(t => { localStorage.setItem('dnoThemeMode', t); localStorage.removeItem('dnoSideNavCollapsed'); localStorage.removeItem('dnoSideNavClosedGroups'); }, theme);
            await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
            await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3); await p.waitForTimeout(600);
            const geo = () => p.evaluate(() => {
                const cx = el => { const r = el.getBoundingClientRect(); return Math.round(r.left + r.width / 2); };
                const nav = document.getElementById('sideNav');
                const vis = sel => [...nav.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().width > 0);
                return {
                    panel: Math.round(nav.querySelector('.mn-panel').getBoundingClientRect().width),
                    icons: [...new Set(vis('.mn-group-head .mn-icon').map(cx))],
                    dots: [...new Set(vis('.mn-group.active .mn-dot').map(cx))],
                    btn: cx(nav.querySelector('#mnCollapseBtn')), search: cx(nav.querySelector('.mn-search-icon')),
                    content: Math.round(document.querySelector('.controls').getBoundingClientRect().left), navRight: Math.round(nav.getBoundingClientRect().right),
                };
            });
            const open = await geo();
            assert.equal(open.icons.length, 1, `${theme}: 펼친 상태의 아이콘 열이 한 줄`);
            assert.equal(open.search, open.icons[0], `${theme}: 검색 돋보기가 아이콘 열에`);

            // ---- 접기: 움직이는 동안 본문은 이미 끝 자리 + 미끄러짐, 판은 폭이 줄어드는 중 ----
            await p.click('#mnCollapseBtn');
            await p.waitForTimeout(110);
            const mid = await p.evaluate(() => ({
                panel: document.querySelector('#sideNav .mn-panel').getBoundingClientRect().width,
                navW: document.getElementById('sideNav').getBoundingClientRect().width,
                slide: document.querySelector('.controls').getAnimations().some(a => a.effect && a.effect.getKeyframes().some(k => /translateX/.test(k.transform || ''))),
                textOpacity: +getComputedStyle(document.querySelector('#sideNav .mn-group.active .mn-text')).opacity,
            }));
            assert.ok(mid.navW < 70, `${theme}: nav 자리는 끝 폭으로 한 번에 (${mid.navW})`);
            assert.ok(mid.panel > mid.navW + 20, `${theme}: 판은 아직 줄어드는 중 (${mid.panel})`);
            assert.ok(mid.slide, `${theme}: 본문이 사이드바 가장자리를 따라 미끄러진다`);
            assert.ok(mid.textOpacity < 0.5, `${theme}: 글자가 먼저 사라진다`);
            await p.waitForTimeout(500);
            const closed = await geo();
            assert.deepEqual(closed.icons, open.icons, `${theme}: 접어도 아이콘이 움직이지 않는다`);
            assert.equal(closed.btn, open.icons[0], `${theme}: 접힌 상태의 접기 버튼이 아이콘 열에`);
            assert.equal(closed.search, open.icons[0]);
            assert.equal(closed.dots.length, 1); assert.ok(Math.abs(closed.dots[0] - open.icons[0]) <= 1, `${theme}: 점이 아이콘 열에`);
            assert.ok(Math.abs(closed.content - (closed.navRight + 12)) <= 1, `${theme}: 본문은 사이드바 바로 옆`);
            assert.ok(closed.panel <= 58);

            // ---- 점: 이름표가 따라오고, 누르면 그 화면 ----
            const dots = p.locator('#sideNav .mn-group.active .mn-item');
            await dots.nth(0).hover(); await p.waitForTimeout(420);
            const t1 = await p.evaluate(() => document.getElementById('dnoTip').textContent);
            await dots.nth(1).hover(); await p.waitForTimeout(30);
            const t2 = await p.evaluate(() => ({ text: document.getElementById('dnoTip').textContent, moving: document.getElementById('dnoTip').classList.contains('moving'), side: document.getElementById('dnoTip').dataset.side }));
            assert.notEqual(t1, t2.text); assert.ok(t2.moving, `${theme}: 옆 점으로 옮기면 기다리지 않고 따라감`); assert.equal(t2.side, 'right');
            const label = (await dots.nth(1).getAttribute('data-dno-tip')).trim();
            await dots.nth(1).click(); await p.waitForTimeout(250);
            assert.equal(await p.evaluate(() => document.querySelector('#sideNav .mn-group.active .mn-item.active').getAttribute('data-dno-tip')), label, `${theme}: 점을 누르면 그 화면`);

            // ---- 아이콘: 점 열고 닫기 (이동하지 않음), 펼친 목록과 같은 상태 ----
            const key = await p.evaluate(() => [...document.querySelectorAll('#sideNav .mn-group')].find(g => !g.classList.contains('active') && g.querySelector('.mn-item') && g.offsetParent).dataset.main);
            const mainBefore = await p.evaluate(() => currentMainTab);
            await p.click(`#sideNav .mn-group[data-main="${key}"] .mn-group-head`); await p.waitForTimeout(300);
            assert.equal(await p.evaluate(k => document.querySelector(`#sideNav .mn-group[data-main="${k}"]`).classList.contains('closed'), key), true, `${theme}: 아이콘을 누르면 점이 닫힌다`);
            assert.equal(await p.evaluate(() => currentMainTab), mainBefore, '이동하지 않는다');
            await p.click('#mnCollapseBtn'); await p.waitForTimeout(500);
            assert.equal(await p.locator(`#sideNav .mn-group[data-main="${key}"] .mn-items`).isVisible(), false, `${theme}: 펼쳐도 닫힌 채 (같은 상태)`);
            await p.click(`#sideNav .mn-group[data-main="${key}"] .mn-group-head`); await p.waitForTimeout(300);
            assert.equal(await p.locator(`#sideNav .mn-group[data-main="${key}"] .mn-items`).isVisible(), true);
            const reopened = await geo();
            assert.deepEqual(reopened.icons, open.icons, `${theme}: 다시 펼쳐도 아이콘 그대로`);

            // ---- 접힌 상태의 검색 아이콘을 누르면 펼치고 검색 ----
            await p.click('#mnCollapseBtn'); await p.waitForTimeout(500);
            await p.click('#mnSearchInput'); await p.waitForTimeout(500);
            assert.equal(await p.evaluate(() => document.body.classList.contains('side-nav-collapsed')), false, `${theme}: 검색을 누르면 펼친다`);
            assert.equal(await p.evaluate(() => document.activeElement && document.activeElement.id), 'mnSearchInput');

            assert.deepEqual(errors, []);
            await ctx.close();
        }
        console.log('sidenav: ok');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
