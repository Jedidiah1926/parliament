// 앱 전반 성능 기준 측정 (docs/design/V1_7_1_PLAN.md §4).
//   python3 -m http.server 8000   (저장소 루트)
//   node tests/perf/measure.cjs [--label before] [--out file.json]
// 같은 PC · 같은 화면 크기 · 같은 자료로 변경 전후를 비교한다. 웹(헤드리스 Chromium) 수치이며 Electron 배포판 수치와 섞지 않는다.
// 각 동작은 예열 1회 뒤 N번 반복해 중앙값 · p95 · 최댓값(ms)을 남긴다.
const { chromium } = require('playwright');
const fs = require('node:fs');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const label = arg('--label') || 'run';
const stat = xs => { if (!xs.length) return null; const s = xs.slice().sort((a, b) => a - b), q = p => s[Math.min(s.length - 1, Math.floor(s.length * p))]; return { n: s.length, median: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), max: +s[s.length - 1].toFixed(1) }; };

// 고정 자료 — 지도 구역 · 국가 · 방향성 · 이벤트 수는 계획서의 초기 후보(5,000구역 · 100개 국가 · 방향성 500 · 이벤트 500)
function bigMap(n, cols) {
    const shapes = [], names = {};
    for (let i = 0; i < n; i++) { const key = 'z' + i; shapes.push({ key, tag: 'rect', attrs: { x: (i % cols) * 10, y: Math.floor(i / cols) * 10, width: 9, height: 9 } }); names[key] = '구역 ' + i; }
    return { format: 'hemicycle-districts', version: 1, meta: { name: `perf-${n}` }, district: { mapMode: 'svg', names: { house: names }, svgMap: { viewBox: `0 0 ${cols * 10} ${Math.ceil(n / cols) * 10}`, shapes } } };
}
function bigScenario(nFocus, nEvents) {
    const focus = [], events = [];
    for (let i = 0; i < nFocus; i++) focus.push({ id: 'f' + i, title: '방향성 ' + i, icon: '🏛', x: (i % 25) * 2, y: Math.floor(i / 25), days: 10, desc: '설명 '.repeat(8), prereq: i >= 25 ? ['f' + (i - 25)] : [], any: [], exclusive: [], effects: [{ add_var: { name: 'tension', value: 1 } }] });
    for (let i = 0; i < nEvents; i++) events.push({ id: 'e' + i, title: '이벤트 ' + i, desc: '본문 '.repeat(20), trigger: { all: [{ flag: 'focus_f' + (i % nFocus) }, { var: { name: 'tension', gte: i } }] }, options: [{ text: '수락', effects: [{ add_var: { name: 'tension', value: -1 } }] }, { text: '거절', effects: [{ set_flag: 'no_' + i }] }] });
    return { format: 'hemicycle-campaign@1', id: 'perf_big', title: '성능 측정용', author: '', version: '1.0', description: '', lore: '', starts: [{ id: 's1', name: '시작', kind: 'preset', preset: 'builtin:tutorial' }], time: { mode: 'turn', startDate: '', startHour: 0, defaultSpeed: 1 }, variables: { tension: 0 }, focus, events, decisions: [], crises: [], endings: [], articles: [] };
}

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
    const out = { label, at: new Date().toISOString(), env: { ua: null, viewport: '1440x900', note: 'headless Chromium (web) — Electron 배포판과 별도' }, results: {} };
    const R = out.results;
    try {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
        await ctx.addInitScript(() => {
            window.__long = [];
            try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] }); } catch (e) { /* 미지원 */ }
        });
        const page = await ctx.newPage(); page.setDefaultTimeout(120000);
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        out.env.ua = await page.evaluate(() => navigator.userAgent);
        // 한 동작을 페이지 안에서 n번 돌려 걸린 시간(ms) 목록 — 동기 구간 + 다음 프레임까지
        const timeIn = (fnSrc, n, argv) => page.evaluate(async ({ fnSrc, n, argv }) => {
            const fn = (0, eval)('(' + fnSrc + ')'); const xs = [];
            const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
            await fn(argv, -1); await frame(); // 예열
            for (let i = 0; i < n; i++) { const t = performance.now(); await fn(argv, i); await frame(); xs.push(performance.now() - t); }
            return xs;
        }, { fnSrc: fnSrc.toString(), n, argv });
        const longs = async () => { const v = await page.evaluate(() => { const x = window.__long.slice(); window.__long.length = 0; return x; }); return { count: v.length, over50: v.filter(x => x >= 50).length, max: v.length ? Math.max(...v) : 0, total: v.reduce((a, b) => a + b, 0) }; };

        // ── 시작 화면 · SAVE SELECT ──
        const nav = async url => { const t = Date.now(); await page.goto(base + url, { waitUntil: 'load' }); const ms = Date.now() - t; const p = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; }); return { wall: ms, ...p }; };
        const navs = async (url, n) => { const xs = []; await nav(url); for (let i = 0; i < n; i++) xs.push((await nav(url)).load); return stat(xs); };
        R['index.html load'] = await navs('/index.html', 5);
        R['main.html load (SAVE SELECT)'] = await navs('/main.html', 5);
        R['scenario.html load'] = await navs('/scenario.html', 5);

        // ── 게임 화면: 실제 큰 세이브(대한민국 2024, 사진 포함 약 6MB) ──
        for (const [name, preset] of [['small (서독 튜토리얼)', 'builtin:tutorial'], ['large (대한민국 2024)', 'builtin:korea2024']]) {
            await page.goto(base + '/main.html', { waitUntil: 'load' }); await page.evaluate(() => { window.__long.length = 0; });
            const t0 = Date.now(); await page.evaluate(id => startFromPresetOnBoot(id), preset);
            await page.waitForFunction(() => !document.body.classList.contains('no-open-tab') && typeof parties !== 'undefined' && parties.length > 2); await page.waitForTimeout(1500);
            const g = `game ${name}`;
            R[`${g} · open preset (ms, 1회)`] = Date.now() - t0 - 1500;
            R[`${g} · state size (MB)`] = +(await page.evaluate(() => JSON.stringify(getAppState()).length / 1048576)).toFixed(2);
            R[`${g} · getAppState()`] = stat(await timeIn(() => { getAppState(); }, 10));
            R[`${g} · JSON.stringify(getAppState())`] = stat(await timeIn(() => { JSON.stringify(getAppState()); }, 10));
            R[`${g} · refreshUI()`] = stat(await timeIn(() => { refreshUI(); }, 10));
            R[`${g} · simulate()`] = stat(await timeIn(() => { simulate(); }, 10));
            R[`${g} · saveActiveNow(true)`] = stat(await timeIn(() => { saveActiveNow(true); }, 8));
            // 바뀐 게 없을 때의 자동저장 (v1.7.1 전에는 저장 시각 때문에 매번 전체를 다시 썼다)
            R[`${g} · autosave, nothing changed (saveActiveNow())`] = stat(await timeIn(() => { saveActiveNow(); }, 8));
            // 묶음 저장 한 번 동안 화면이 가장 길게 멈춘 시간 (프레임 간격 최댓값) — 지도 칠하기 · 실시간 시계가 쓰는 길
            R[`${g} · saveActiveSoon — longest frame gap`] = stat(await page.evaluate(async () => {
                if (typeof saveActiveSoon !== 'function') return [];
                const xs = [];
                for (let i = 0; i < 6; i++) {
                    let max = 0, last = performance.now(), on = true;
                    const loop = () => { const t = performance.now(); max = Math.max(max, t - last); last = t; if (on) requestAnimationFrame(loop); };
                    requestAnimationFrame(loop);
                    document.getElementById('nationNameInput').value = 'perf ' + i;
                    saveActiveSoon(0);
                    while (saveSoonWaiting) await new Promise(r => setTimeout(r, 10));
                    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                    on = false; if (i) xs.push(max);
                }
                return xs;
            }));
            const tabs = [['setup', 'partyinfo'], ['setup', 'seats'], ['law', 'vote'], ['vote', 'elecGeneral'], ['cabinet', 'cabinetmembers'], ['nation', 'people'], ['economy', 'overview'], ['world', 'ranking'], ['nation', 'decisions'], ['setup', 'settings']];
            R[`${g} · tab switch (10 tabs)`] = stat(await timeIn((tabs, i) => { const [m, s] = tabs[(i + tabs.length) % tabs.length]; try { switchSubTab(m, s); } catch (e) { /* 없는 탭 */ } }, 30, tabs));
            R[`${g} · advance 1 day`] = stat(await timeIn(() => { advanceNationDate(1, 'day'); }, 30));
            R[`${g} · advance 1 month`] = stat(await timeIn(() => { advanceNationDate(1, 'month'); }, 12));
            R[`${g} · script effect (run + afterEffects)`] = stat(await timeIn(() => { HemiScriptMods.importMod && 0; const m = HemiScriptMods.mods[0]; if (m) HemiScriptMods.run([{ add_var: { name: '__perf', value: 1 } }], m.id); else { try { refreshUI(); } catch (e) { /* */ } } }, 10));
            R[`${g} · long tasks`] = await longs();
        }

        // ── 세계지도: 5,000구역 · 100개 국가 ──
        await page.evaluate(() => { switchMainTab('world'); switchSubTab('world', 'worldmap'); const rows = HemiHistory.ranking.rows; for (let i = rows.length; i < 100; i++) rows.push({ id: 'pc' + i, name: '국가 ' + i, flag: '🏳', bloc: '', ideo: '', score: 0, prevRank: null, self: false }); window.__long.length = 0; });
        for (const [n, cols] of [[500, 25], [5000, 100]]) {
            const map = bigMap(n, cols), w = `world map ${n} regions`;
            R[`${w} · import + draw`] = stat(await timeIn((m) => { HemiWorldMap.importData(JSON.parse(JSON.stringify(m))); }, 3, map));
            await page.evaluate(() => { const S = HemiWorldMap.state, rows = HemiHistory.ranking.rows; Object.keys(S.preset.district.names.house).forEach((k, i) => { S.owners[k] = String(rows[i % rows.length].id); }); switchDispTab('worldmap'); });
            R[`${w} · repaint (switchDispTab)`] = stat(await timeIn(() => { switchDispTab('worldmap'); }, 8));
            R[`${w} · color change`] = stat(await timeIn((a, i) => { const el = document.getElementById('wmColor'); el.value = '#' + ((i + 2) * 123457 % 0xffffff).toString(16).padStart(6, '0'); el.dispatchEvent(new Event('input')); }, 8));
            R[`${w} · paint one region (click)`] = stat(await timeIn((a, i) => { const k = 'z' + ((i + 7) * 13 % 400); document.querySelector(`[data-wm-key="${k}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 0 })); }, 15));
            // 붓질: pointerdown → 40구역 pointermove → pointerup
            const box = await page.locator('#wmSvg').boundingBox();
            const strokes = [];
            for (let s = 0; s < 6; s++) { const y = box.y + box.height * (0.3 + s * 0.05); const t = Date.now(); await page.mouse.move(box.x + box.width * 0.3, y); await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.7, y, { steps: 40 }); await page.mouse.up(); strokes.push(Date.now() - t); }
            R[`${w} · brush stroke 40 steps (wall, 입력 포함)`] = stat(strokes.slice(1));
            R[`${w} · getAppState()`] = stat(await timeIn(() => { getAppState(); }, 8));
            R[`${w} · saveActiveNow(true)`] = stat(await timeIn(() => { saveActiveNow(true); }, 5));
            R[`${w} · long tasks`] = await longs();
        }

        // ── 시나리오 메이커: 방향성 500 · 이벤트 500 ──
        await page.goto(base + '/scenario.html', { waitUntil: 'load' }); await page.waitForFunction(() => !!window.HemiCampaignEditor);
        for (const [nf, ne] of [[6, 1], [500, 500]]) {
            const sc = nf === 6 ? null : bigScenario(nf, ne), e = `editor ${nf} focus / ${ne} events`;
            if (sc) await page.evaluate(d => { HemiCampaignEditor.data = d; HemiCampaignEditor.setTab('focus'); }, sc); else { await page.locator('[data-starter]').first().click(); }
            await page.waitForSelector('[data-node]'); await page.evaluate(() => { window.__long.length = 0; });
            R[`${e} · validate`] = stat(await timeIn(() => { HemiCampaignTools.validate(HemiCampaignEditor.data); }, 8));
            R[`${e} · JSON.stringify(scenario)`] = stat(await timeIn(() => { JSON.stringify(HemiCampaignEditor.data); }, 8));
            const tabs = ['info', 'focus', 'events', 'crises', 'articles', 'adv', 'focus'];
            const sw = []; for (let i = 0; i < 14; i++) { const t = await page.evaluate(async k => { const t0 = performance.now(); document.querySelector(`[data-tab="${k}"]`).click(); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); return performance.now() - t0; }, tabs[i % tabs.length]); sw.push(t); }
            R[`${e} · tab switch`] = stat(sw);
            await page.locator('[data-tab="focus"]').click(); await page.locator('[data-node]').first().click();
            R[`${e} · select node (render)`] = stat(await timeIn((a, i) => { const ns = document.querySelectorAll('[data-node]'); ns[(i + 3) % Math.min(ns.length, 20)].click(); }, 10));
            // 타이핑: 제목 칸에 한 글자씩 (input 이벤트마다 touch)
            const field = page.locator('#cpBody input[type="text"], #cpBody input:not([type])').first();
            await field.click(); const typed = [];
            for (let i = 0; i < 25; i++) { typed.push(await page.evaluate(async () => { const el = document.activeElement; const t0 = performance.now(); el.value += 'a'; el.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); return performance.now() - t0; })); }
            R[`${e} · typing (per key)`] = stat(typed);
            R[`${e} · undo`] = stat(await timeIn(() => { document.querySelector('[data-history="undo"]')?.click(); }, 8));
            R[`${e} · long tasks`] = await longs();
        }
        out.errors = errors.slice(0, 10);
    } finally { await browser.close(); }
    const file = arg('--out') || `tests/perf/results-${label}.json`;
    fs.writeFileSync(file, JSON.stringify(out, null, 1));
    const pad = (s, n) => String(s).padEnd(n);
    console.log(`# ${label} — ${out.at}`);
    for (const [k, v] of Object.entries(out.results)) console.log(pad(k, 62), typeof v === 'object' ? JSON.stringify(v) : v);
    if (out.errors?.length) console.log('page errors:', out.errors);
})().catch(e => { console.error(e); process.exit(1); });
