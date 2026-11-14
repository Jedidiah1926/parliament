// 탭 전환 최적화가 화면 · 동작을 바꾸지 않았는지
//   - 모던 테마 [style*=...] 규칙 → 클래스 (js/modern-style-index.js): 켜고 끈 화면의 계산된 색 · 테두리가 같다
//   - "의원에서 불러오기" 목록은 열 때 채운다 (js/main.js memberPickerLazy*)
//   - 인물 목록은 나눠 그린다 (js/people.js PEOPLE_PAGE)
//   python3 -m http.server 8000 & node tests/tab-perf.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
const TABS = [['setup', 'party'], ['setup', 'members'], ['cabinet', 'cabinetmembers'], ['nation', 'people'], ['law', 'vote'], ['economy', 'overview']];
const PROPS = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'font-weight', 'border-top-left-radius'];

async function open(browser, { block = false, theme = 'light' } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } }), p = await ctx.newPage();
    const errors = []; p.on('pageerror', e => errors.push(e.message)); p.setDefaultTimeout(15000);
    await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
    if (block) await ctx.route('**/js/modern-style-index.js', r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
    await ctx.addInitScript(t => {
        try { localStorage.setItem('dnoThemeMode', t); } catch (e) { /* 저장 불가 */ }
        document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}'; document.head.appendChild(st); });
    }, theme);
    await p.goto(base + '/main.html'); await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
    await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial')); await p.waitForFunction(() => !!activeSlotId && parties.length > 3); await p.waitForTimeout(600);
    return { ctx, p, errors };
}
async function styles(p) {
    const out = {};
    for (const [m, s] of TABS) {
        await p.evaluate(([m, s]) => switchSubTab(m, s), [m, s]); await p.waitForTimeout(120);
        out[m + '/' + s] = await p.evaluate(PROPS => Array.from(document.querySelectorAll('body *')).filter(el => el.getClientRects().length)
            .map((el, i) => (el.id || el.tagName) + '#' + i + ' ' + PROPS.map(k => getComputedStyle(el).getPropertyValue(k)).join('|')), PROPS);
    }
    return out;
}

(async () => {
    const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        // ---------- 1) 모던 테마: 규칙을 클래스로 바꿔도 화면이 같다 (라이트 · 다크) ----------
        for (const theme of ['light', 'dark']) {
            const A = await open(browser, { block: true, theme }), B = await open(browser, { theme });
            assert.equal(await A.p.evaluate(() => !!window.HemiModernStyleIndex), false);
            assert.ok(await B.p.evaluate(() => HemiModernStyleIndex.rules) > 300, '규칙 대부분이 클래스로 바뀐다');
            const a = await styles(A.p), b = await styles(B.p);
            for (const k of Object.keys(a)) {
                assert.equal(b[k].length, a[k].length, `${theme} ${k} 요소 수`);
                const diff = a[k].findIndex((x, i) => x !== b[k][i]);
                assert.equal(diff, -1, `${theme} ${k}: ${a[k][diff]} ≠ ${b[k] && b[k][diff]}`);
            }
            assert.deepEqual(A.errors, []); assert.deepEqual(B.errors, []);
            await A.ctx.close(); await B.ctx.close();
        }

        // 네온(TNO) 테마에서는 아무것도 하지 않다가, 모던으로 바꾸는 순간 시작한다 (페이지를 여는 비용 0)
        {
            const T = await open(browser, { theme: 'tno' });
            assert.equal(await T.p.evaluate(() => HemiModernStyleIndex.ready), false);
            await T.p.evaluate(() => document.documentElement.setAttribute('data-theme-family', 'modern'));
            await T.p.waitForFunction(() => HemiModernStyleIndex.ready && HemiModernStyleIndex.rules > 300);
            assert.deepEqual(T.errors, []); await T.ctx.close();
        }
        const { ctx, p, errors } = await open(browser);
        // 모던에서는 페이지를 다 연 뒤(로드 이후) 시작한다
        assert.ok(await p.evaluate(() => HemiModernStyleIndex.ready), '프리셋을 여는 동안 이미 준비됨');
        // 나중에 style이 바뀐 요소도 따라간다
        const cls = await p.evaluate(async () => {
            const d = document.createElement('div'); d.setAttribute('style', 'color:#888;'); document.body.appendChild(d);
            await new Promise(r => setTimeout(r, 0));
            const first = [...d.classList].filter(c => /^hs\d+$/.test(c)).length;
            d.setAttribute('style', 'padding:1px;');
            await new Promise(r => setTimeout(r, 0));
            const after = [...d.classList].filter(c => /^hs\d+$/.test(c)).length;
            d.remove(); return [first, after];
        });
        assert.ok(cls[0] > 0, 'style="color:#888"에 테마 클래스가 붙는다'); assert.equal(cls[1], 0, 'style이 바뀌면 클래스도 빠진다');

        // ---------- 2) 의원에서 불러오기 — 처음엔 한 줄, 열면 채워지고 고르면 연결된다 ----------
        await p.evaluate(() => { if (!cabinetMembers.length) addCabinetMember(); switchSubTab('cabinet', 'cabinetmembers'); });
        await p.waitForTimeout(150);
        const picker = p.locator('#cabinetMembersList select[data-member-picker]').first();
        assert.equal(await picker.locator('option').count(), 1, '열기 전에는 빈 줄만');
        await picker.focus();
        const n = await p.locator('#cabinetMembersList select[onchange^="linkCabinetMemberToSeat"]').first().locator('option').count();
        assert.ok(n > 10, `포커스하면 의원 목록이 채워진다 (${n})`);
        const val = await p.locator('#cabinetMembersList select[onchange^="linkCabinetMemberToSeat"]').first().locator('option').nth(1).getAttribute('value');
        await p.locator('#cabinetMembersList select[onchange^="linkCabinetMemberToSeat"]').first().selectOption(val);
        await p.waitForTimeout(100);
        assert.ok(await p.evaluate(() => !!cabinetMembers[0].linkedSeat), '고른 의원과 연결된다');
        // 대통령 · 총리 칸도 같은 방식
        assert.ok(await p.evaluate(() => { const s = document.getElementById('presidentMemberPicker'); return s ? s.options.length : 0; }) <= 1);

        // ---------- 3) 인물 목록 — 나눠 그리고, 더 보기로 이어 붙인다 ----------
        await p.evaluate(() => switchSubTab('nation', 'people')); await p.waitForTimeout(150);
        await p.locator('#contentPeople [data-act="import"]').click(); await p.waitForTimeout(300);
        if (await p.locator('.dno-dialog-overlay button').count()) { await p.locator('.dno-dialog-overlay button').first().click(); await p.waitForTimeout(150); } // 가져오기 결과 알림
        // 사람을 150명 넘게 만들어 나눠 그리기를 확인 (튜토리얼은 자리가 적다)
        await p.evaluate(() => { for (let i = 0; i < 150; i++) HemiPeople.people.push({ id: 'tp' + i, name: '시험인물' + i, photo: '', ideologyId: null, partyId: null, factionId: null, bio: '' }); switchSubTab('setup', 'party'); switchSubTab('nation', 'people'); });
        await p.waitForTimeout(200);
        const total = await p.evaluate(() => HemiPeople.people.length);
        assert.ok(total > 150);
        const cards = () => p.locator('#peopleList .people-card').count();
        const first = await cards();
        if (total > 60) {
            assert.equal(first, 60, '처음 60명만');
            await p.locator('.people-list-more').evaluate(b => b.click()); await p.waitForTimeout(100);
            assert.equal(await cards(), Math.min(120, total));
            // 덧붙인 카드도 동작한다 — 펼치기
            await p.locator('#peopleList .people-card').nth(70 < total ? 70 : total - 1).locator('[data-act="toggle"]').click(); await p.waitForTimeout(100);
            assert.equal(await p.locator('#peopleList .people-card.open').count(), 1);
            assert.ok(await cards() >= 71, '다시 그려도 보던 만큼은 남는다');
            // 목록 끝이 보이면 저절로 이어 붙인다
            await p.locator('.people-list-more').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
            assert.equal(await cards(), total);
            assert.equal(await p.locator('.people-list-more').count(), 0);
        } else {
            assert.equal(first, total);
            assert.equal(await p.locator('.people-list-more').count(), 0);
        }
        assert.deepEqual(errors, []);
        await ctx.close();
        console.log('tab-perf: ok');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
