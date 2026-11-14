// 내장 프리셋별 레이턴시 — 같은 동작을 프리셋마다 재서 비교한다 (웹 · 헤드리스 Chromium, Electron 수치와 섞지 않음).
//   python3 -m http.server 8000 &   node tests/perf/presets.cjs [--label now] [--only builtin:japan,builtin:uk]
// 값은 ms. 동작 하나는 "동기 처리 + 다음 프레임"까지라 약 16.7ms가 바닥이다. 프리셋마다 새 페이지(새 저장소)에서 잰다.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const label = arg('--label') || 'now';
const stat = xs => { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(s.length * p))]; return { n: s.length, median: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1) }; };
const TABS = [['setup', 'party'], ['setup', 'settings'], ['law', 'vote'], ['vote', 'elecGeneral'], ['cabinet', 'cabinetmembers'], ['nation', 'people'], ['economy', 'overview'], ['world', 'ranking'], ['nation', 'decisions'], ['setup', 'members']];

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
    const out = { label, at: new Date().toISOString(), env: { viewport: '1440x900', note: 'headless Chromium (web)' }, presets: {} };
    try {
        const probe = await browser.newPage(); await probe.goto(base + '/main.html'); await probe.waitForFunction(() => window.HemiPresets || typeof startFromPresetOnBoot === 'function');
        let list = await probe.evaluate(async () => { const all = (window.HemiPresets && (await (HemiPresets.list ? HemiPresets.list() : HemiPresets.all)) ) || []; return (Array.isArray(all) ? all : []).filter(p => p && String(p.id).startsWith('builtin:') && !p.comingSoon).map(p => ({ id: p.id, title: p.title })); }).catch(() => []);
        out.env.ua = await probe.evaluate(() => navigator.userAgent);
        await probe.close();
        if (!list.length) list = ['tutorial', 'japan', 'usa', 'germany', 'korea', 'korea2024', 'uk'].map(k => ({ id: 'builtin:' + k, title: k }));
        const only = arg('--only'); if (only) list = list.filter(p => only.split(',').includes(p.id));
        for (const { id, title } of list) {
            const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
            await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
            await ctx.addInitScript(() => { window.__long = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) { /* 미지원 */ } });
            const page = await ctx.newPage(); page.setDefaultTimeout(180000);
            const errors = []; page.on('pageerror', e => errors.push(e.message));
            const timeIn = (fnSrc, n, argv) => page.evaluate(async ({ fnSrc, n, argv }) => {
                const fn = (0, eval)('(' + fnSrc + ')'); const xs = [];
                const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
                await fn(argv, -1); await frame();
                for (let i = 0; i < n; i++) { const t = performance.now(); await fn(argv, i); await frame(); xs.push(performance.now() - t); }
                return xs;
            }, { fnSrc: fnSrc.toString(), n, argv });
            const r = { title };
            await page.goto(base + '/main.html', { waitUntil: 'load' }); await page.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
            await page.evaluate(() => { window.__long.length = 0; });
            const t0 = Date.now();
            await page.evaluate(pid => startFromPresetOnBoot(pid), id);
            await page.waitForFunction(() => !document.body.classList.contains('no-open-tab') && typeof parties !== 'undefined' && parties.length > 2 && !!activeSlotId);
            r.openMs = Date.now() - t0; // 프리셋 파일 읽기 · 적용 · 세이브 만들기까지
            await page.waitForTimeout(1500);
            const size = await page.evaluate(() => { const s = getAppState(), j = JSON.stringify(s); const top = Object.entries(s).map(([k, v]) => [k, JSON.stringify(v ?? null).length]).sort((a, b) => b[1] - a[1]).slice(0, 4); return { mb: +(j.length / 1048576).toFixed(2), parties: parties.length, seats: (typeof chamberTotalSeats === 'function' ? chamberTotalSeats('house') : null), districts: Object.keys((s.election && s.election.district && s.election.district.names && s.election.district.names.house) || {}).length, top: top.map(([k, v]) => `${k} ${(v / 1048576).toFixed(2)}MB`) }; });
            Object.assign(r, size);
            r.getAppState = stat(await timeIn(() => { JSON.stringify(getAppState()); }, 8));
            r.save = stat(await timeIn(() => { saveActiveNow(true); }, 6));
            r.autosaveIdle = stat(await timeIn(() => { saveActiveNow(); }, 6));
            r.refreshUI = stat(await timeIn(() => { refreshUI(); }, 8));
            r.simulate = stat(await timeIn(() => { simulate(); }, 8));
            const perTab = {};
            const tabTimes = await timeIn((tabs, i) => { const [m, s] = tabs[(i + tabs.length) % tabs.length]; try { switchSubTab(m, s); } catch (e) { /* 없는 탭 */ } }, TABS.length * 2, TABS);
            tabTimes.forEach((ms, i) => { const k = TABS[i % TABS.length].join('/'); (perTab[k] = perTab[k] || []).push(ms); });
            r.tabSwitch = stat(tabTimes);
            r.slowestTabs = Object.entries(perTab).map(([k, xs]) => [k, +Math.max(...xs).toFixed(0)]).sort((a, b) => b[1] - a[1]).slice(0, 3);
            r.advanceDay = stat(await timeIn(() => { advanceNationDate(1, 'day'); }, 10));
            r.advanceMonth = stat(await timeIn(() => { advanceNationDate(1, 'month'); }, 6));
            // 사람이 ▶(하루)를 누를 때 — mousedown(실행 취소 기준점) + click + 다음 프레임. 누를 때마다 1초 쉰다 (실행 취소 묶음이 닫히도록)
            r.clickDay = stat(await page.evaluate(async () => {
                const btn = document.querySelector('.dib-play'); if (!btn) return [];
                const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
                const xs = [];
                for (let i = 0; i < 6; i++) {
                    const t = performance.now();
                    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); btn.click();
                    await frame(); xs.push(performance.now() - t);
                    if (typeof closeDatePanel === 'function') closeDatePanel(); // 날짜가 비어 있으면 ▶가 날짜 창을 연다
                    await new Promise(r => setTimeout(r, 1000));
                }
                return xs;
            }));
            const lt = await page.evaluate(() => window.__long.slice());
            r.longTasks = { count: lt.length, max: lt.length ? Math.max(...lt) : 0, total: lt.reduce((a, b) => a + b, 0) };
            r.errors = errors.slice(0, 3);
            out.presets[id] = r;
            console.log(id.padEnd(20), JSON.stringify({ mb: r.mb, open: r.openMs, save: r.save && r.save.median, tab: r.tabSwitch && r.tabSwitch.median, tabP95: r.tabSwitch && r.tabSwitch.p95, refresh: r.refreshUI && r.refreshUI.median, sim: r.simulate && r.simulate.median, day: r.advanceDay && r.advanceDay.median, clickDay: r.clickDay && r.clickDay.median, month: r.advanceMonth && r.advanceMonth.median }));
            await ctx.close();
        }
    } finally { await browser.close(); }
    const file = arg('--out') || path.join(__dirname, `presets-${label}.json`);
    fs.writeFileSync(file, JSON.stringify(out, null, 1));
    console.log('wrote', file);
})().catch(e => { console.error(e); process.exit(1); });
