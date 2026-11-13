// 예제 "국경 협정" 파일 만들기 — 실제 게임에서 세계지도가 든 시작 세이브를 만들고, 제작기의 "내보내기"로 .hemicmp를 받는다.
//   python3 -m http.server 8000 & node tests/fixtures/build-border-example.cjs
//   → docs/example-scenario/border-agreement.hemicmp (시나리오) · border-map.hemimap (세 구역 지도)
const { chromium } = require('playwright'), fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib');
const F = require('./border-agreement.cjs');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000', out = path.join(__dirname, '..', '..', 'docs', 'example-scenario');
(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true }), p = await ctx.newPage();
        await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
        await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
        await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3 && !!window.HemiWorldMap); await p.waitForTimeout(600);
        const mapFile = { ...F.map(), worldMap: { version: 1, owners: F.worldMap().owners, colors: F.worldMap().colors, countries: F.countries() } };
        const state = await p.evaluate(map => {
            HemiWorldMap.importData(map);
            const st = getAppState(); delete st.campaign;
            st.meta.savedAt = '2026-11-12T00:00:00.000Z'; // 다시 만들어도 같은 파일이 나오게
            return st;
        }, mapFile);
        await p.goto(base + '/scenario.html'); await p.waitForFunction(() => !!window.HemiCampaignEditor);
        const d = F.scenario(); d.starts[0].state = state; d.starts[0].saveName = '국경 지대';
        const issues = await p.evaluate(data => { HemiCampaignEditor.data = data; return HemiCampaignEditor.check(); }, d);
        if (issues.length) throw new Error('예제에 오류가 있습니다: ' + issues.join(' / '));
        const [download] = await Promise.all([p.waitForEvent('download'), p.locator('#cpExport').click()]);
        fs.mkdirSync(out, { recursive: true });
        // 압축 결과가 환경마다 달라지지 않게 내용은 그대로 두고 다시 압축해 둔다 (게임은 gzip · 일반 JSON 모두 읽는다)
        const json = zlib.gunzipSync(fs.readFileSync(await download.path()));
        fs.writeFileSync(path.join(out, 'border-agreement.hemicmp'), zlib.gzipSync(json, { level: 9 }));
        fs.writeFileSync(path.join(out, 'border-map.hemimap'), zlib.gzipSync(Buffer.from(JSON.stringify(mapFile)), { level: 9 }));
        console.log('wrote', out, fs.readdirSync(out).map(f => `${f}:${fs.statSync(path.join(out, f)).size}`).join(' '));
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
