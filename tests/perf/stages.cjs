// 단계별 레이턴시 비교 — 여러 버전(커밋)을 같은 PC · 같은 방법으로 번갈아 잰다 (docs/perf/LATENCY_1.7.md).
//   각 커밋을 따로 띄운다:  git worktree add /tmp/s0 c317328 && python3 -m http.server 8100 --directory /tmp/s0 & ...
//   node tests/perf/stages.cjs --stages "S0=8100,S1=8101,..." [--only builtin:korea2024] [--out file.json]
// 사람이 하는 조작에 가깝게 잰다 — 누르기(mousedown, 실행 취소 기준점을 잡는 순간)부터 다음 프레임까지, 조작 사이는 0.8 ~ 1.1초 쉰다.
// 값은 ms (웹 · 헤드리스 Chromium). 프리셋마다 단계를 번갈아 재서 PC 상태 변화가 한 단계에만 몰리지 않게 한다.
const { chromium } = require('playwright');
const fs = require('node:fs'), path = require('node:path');
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const stages = (arg('--stages') || '').split(',').filter(Boolean).map(s => { const [label, port] = s.split('='); return { label, base: `http://127.0.0.1:${port}` }; });
const PRESETS = (arg('--only') || 'builtin:tutorial,builtin:germany,builtin:usa,builtin:uk,builtin:korea,builtin:korea2024,builtin:japan').split(',');
const TABS = [['setup', 'party'], ['setup', 'settings'], ['law', 'vote'], ['vote', 'elecGeneral'], ['cabinet', 'cabinetmembers'], ['nation', 'people'], ['economy', 'overview'], ['world', 'ranking'], ['nation', 'decisions'], ['setup', 'members']];
const stat = xs => { if (!xs || !xs.length) return null; const s = xs.slice().sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(s.length * p))]; return { n: s.length, median: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1) }; };

async function measure(browser, base, preset) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
    await ctx.addInitScript(() => { window.__long = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push([e.startTime, e.duration]))).observe({ entryTypes: ['longtask'] }); } catch (e) { /* 미지원 */ } });
    const page = await ctx.newPage(); page.setDefaultTimeout(180000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    const r = {};
    await page.goto(base + '/main.html', { waitUntil: 'load' }); await page.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
    const t0 = Date.now();
    await page.evaluate(id => startFromPresetOnBoot(id), preset);
    await page.waitForFunction(() => !document.body.classList.contains('no-open-tab') && typeof parties !== 'undefined' && parties.length > 2 && !!activeSlotId);
    r.open = Date.now() - t0;
    await page.waitForTimeout(2500);
    r.mb = await page.evaluate(() => +(JSON.stringify(getAppState()).length / 1048576).toFixed(2));
    r.dateEmpty = await page.evaluate(() => !document.getElementById('nationDateYear').value);

    // 1) 날짜 ▶(하루) 누르기 — 날짜가 비어 있으면 날짜 창이 열린다(닫고 다음으로)
    r.clickDay = stat(await page.evaluate(async () => {
        const btn = document.querySelector('.dib-play'); if (!btn) return [];
        const frame = () => new Promise(res => requestAnimationFrame(() => setTimeout(res, 0)));
        const xs = [];
        for (let i = 0; i < 6; i++) {
            const t = performance.now();
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); btn.click();
            await frame(); xs.push(performance.now() - t);
            await new Promise(res => setTimeout(res, 300));
            if (typeof closeDatePanel === 'function') closeDatePanel();
            await new Promise(res => setTimeout(res, 800));
        }
        return xs;
    }));

    // 2) 탭 전환 — 누르기 + switchSubTab + 다음 프레임, 탭 10개 × 2바퀴
    const tabs = await page.evaluate(async TABS => {
        const frame = () => new Promise(res => requestAnimationFrame(() => setTimeout(res, 0)));
        const out = [];
        for (let rep = 0; rep < 2; rep++) for (const [m, s] of TABS) {
            const t = performance.now();
            document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            try { switchSubTab(m, s); } catch (e) { /* 그 버전에 없는 탭 */ }
            document.body.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
            await frame(); out.push([m + '/' + s, performance.now() - t]);
            await new Promise(res => setTimeout(res, 800));
        }
        return out;
    }, TABS);
    r.tab = stat(tabs.map(x => x[1]));
    const per = {}; tabs.forEach(([k, v]) => { per[k] = Math.max(per[k] || 0, v); });
    r.tabMax = Object.fromEntries(Object.entries(per).map(([k, v]) => [k, +v.toFixed(0)]));

    // 3) 지금 저장(강제, Ctrl+S와 같은 길)
    r.save = stat(await page.evaluate(async () => {
        const frame = () => new Promise(res => requestAnimationFrame(() => setTimeout(res, 0)));
        const xs = [];
        for (let i = 0; i < 4; i++) { const t = performance.now(); saveActiveNow(true); await frame(); xs.push(performance.now() - t); await new Promise(res => setTimeout(res, 500)); }
        return xs;
    }));

    // 4) 자동저장 주기 — 바뀐 게 있을 때 / 없을 때, 그 주기 동안 가장 긴 멈춤(긴 작업 또는 동기 처리)
    const auto = await page.evaluate(async () => {
        const tick = typeof autosaveTick === 'function' ? autosaveTick : autosaveNow;
        const run = async () => {
            const t = performance.now(); tick(); const sync = performance.now() - t;
            await new Promise(res => setTimeout(res, 2500));
            const long = window.__long.filter(([s]) => s >= t - 1).map(([, d]) => d);
            return Math.max(sync, ...long);
        };
        const changed = [], same = [];
        for (let i = 0; i < 3; i++) {
            const inp = document.getElementById('nationNameInput');
            inp.value = (inp.value || '') + '·'; inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(res => setTimeout(res, 1500));
            changed.push(await run());
            same.push(await run());
        }
        return { changed, same };
    });
    r.autosaveChanged = stat(auto.changed);
    r.autosaveSame = stat(auto.same);
    r.errors = errors.slice(0, 3);
    await ctx.close();
    return r;
}

(async () => {
    if (!stages.length) { console.error('--stages "S0=8100,S1=8101" 필요'); process.exit(1); }
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
    const out = { at: new Date().toISOString(), stages: stages.map(s => s.label), presets: {} };
    try {
        for (const preset of PRESETS) {
            out.presets[preset] = {};
            for (const s of stages) {
                const r = await measure(browser, s.base, preset);
                out.presets[preset][s.label] = r;
                console.log(preset.padEnd(18), s.label.padEnd(4), JSON.stringify({ open: r.open, day: r.clickDay && r.clickDay.median, tab: r.tab && r.tab.median, tabP95: r.tab && r.tab.p95, save: r.save && r.save.median, autoChanged: r.autosaveChanged && r.autosaveChanged.median, autoSame: r.autosaveSame && r.autosaveSame.median, err: r.errors.length }));
            }
        }
    } finally { await browser.close(); }
    const file = arg('--out') || path.join(__dirname, 'stages.json');
    fs.writeFileSync(file, JSON.stringify(out, null, 1));
    console.log('wrote', file);
})().catch(e => { console.error(e); process.exit(1); });
