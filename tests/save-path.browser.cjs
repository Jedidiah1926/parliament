// 저장 경로 · 목록 지연 그리기 (v1.7.1 성능 작업) — 빨라진 길이 예전과 같은 결과를 남기는지.
//   python3 -m http.server 8000 & node tests/save-path.browser.cjs
const { chromium } = require('playwright'), assert = require('node:assert/strict');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:8000';
const KEY = 'dnoParliamentSaveSlots';
(async () => {
    const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', headless: true });
    try {
        const errors = [];
        const open = async (init) => {
            const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }), p = await ctx.newPage();
            p.setDefaultTimeout(30000);
            p.on('pageerror', e => errors.push(e.message));
            if (init) await ctx.addInitScript(init);
            await p.goto(base + '/main.html');
            await p.waitForFunction(() => typeof startFromPresetOnBoot === 'function');
            await p.evaluate(() => startFromPresetOnBoot('builtin:tutorial'));
            await p.waitForFunction(() => !!activeSlotId && saveSlotsChecked && parties.length > 3);
            await p.waitForTimeout(800);
            return { ctx, p };
        };
        const frame = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))));
        const strip = 'o => { const c = JSON.parse(JSON.stringify(o)); if (c.meta) c.meta.savedAt = ""; return JSON.stringify(c); }';

        // ---------- 1. 빠른 저장 == 예전 저장, 바뀐 게 없으면 쓰지 않음 ----------
        {
            const { ctx, p } = await open();
            const r = await p.evaluate(async (stripSrc) => {
                const strip = (0, eval)('(' + stripSrc + ')'), key = LS_PREFIX + SAVE_SLOTS_KEY, out = {};
                let writes = 0; const set = Storage.prototype.setItem;
                Storage.prototype.setItem = function (k, v) { if (String(k) === key) writes++; return set.call(this, k, v); };
                const inp = document.getElementById('nationNameInput'); (inp.value += ' ✓', inp.dispatchEvent(new Event('input', { bubbles: true })));
                out.saved = saveActiveNow(true); out.writes1 = writes;
                const mine = JSON.parse(localStorage.getItem(key)).find(s => s.id === activeSlotId);
                out.stateEqual = strip(mine.state) === strip(getAppState());
                out.metaKeys = Object.keys(mine).filter(k => k !== 'state').sort().join(',');
                // 예전 방식(목록 전체를 읽어 고쳐 쓰기)으로 같은 상태를 쓴 결과와 견준다
                const quick = localStorage.getItem(key);
                const slots = loadSaveSlots(); slots.find(s => s.id === activeSlotId).state = JSON.parse(JSON.stringify(mine.state)); persistSaveSlots(slots);
                out.sameAsLegacy = localStorage.getItem(key) === quick;
                // 바뀐 게 없으면 자동저장은 저장소에 쓰지 않는다 (저장 시각만 다른 것은 "바뀐 것"이 아니다)
                writes = 0; await new Promise(r => setTimeout(r, 30));
                out.idleOk = saveActiveNow() && saveActiveNow(); out.idleWrites = writes;
                (inp.value += '!', inp.dispatchEvent(new Event('input', { bubbles: true }))); out.changedOk = saveActiveNow(); out.changedWrites = writes;
                out.name = inp.value; out.dirty = saveDirty;
                Storage.prototype.setItem = set;
                return out;
            }, strip);
            assert.deepEqual([r.saved, r.writes1, r.stateEqual, r.sameAsLegacy], [true, 1, true, true]);
            assert.equal(r.metaKeys, 'createdAt,id,isAutosave,name,savedAt');
            assert.deepEqual([r.idleOk, r.idleWrites, r.changedOk, r.changedWrites, r.dirty], [true, 0, true, 1, false]);
            await p.reload(); await p.waitForFunction(() => !!activeSlotId && saveSlotsChecked); await p.waitForTimeout(500);
            assert.equal(await p.evaluate(() => document.getElementById('nationNameInput').value), r.name);
            assert.match(await p.locator('#saveTabBar').innerText(), /서독/);
            await ctx.close();
            console.log('PASS: single-save write equals the legacy whole-list write, restores after reload, and idle autosave no longer rewrites an unchanged save');
        }

        // ---------- 2. 곧 저장(묶음 저장) ----------
        {
            const { ctx, p } = await open();
            const r = await p.evaluate(async () => {
                const key = LS_PREFIX + SAVE_SLOTS_KEY, out = {}, inp = document.getElementById('nationNameInput');
                let writes = 0; const set = Storage.prototype.setItem;
                Storage.prototype.setItem = function (k, v) { if (String(k) === key) writes++; return set.call(this, k, v); };
                const stored = () => JSON.parse(localStorage.getItem(key)).find(s => s.id === activeSlotId).state.config.nationName;
                const wait = ms => new Promise(r => setTimeout(r, ms));
                // 연달아 다섯 번 → 한 번만 쓴다
                for (let i = 0; i < 5; i++) { (inp.value = '묶음 ' + i, inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveSoon(); await wait(20); }
                out.beforeDelay = [writes, saveSoonWaiting];
                await wait(900);
                out.afterDelay = [writes, saveSoonWaiting, stored()];
                // 기다리는 중에 떠나기 → 그 자리에서 마친다
                writes = 0; (inp.value = '떠나기 전', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveSoon();
                let went = false; confirmSaveBeforeLeaving('?', () => { went = true; });
                out.leave = [went, writes, saveSoonWaiting, stored()];
                await wait(900); out.leaveNoExtra = writes;
                // 기다리는 중에 바로 저장 → 묶음 저장은 취소되고 더 새 상태가 남는다
                writes = 0; (inp.value = '먼저', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveSoon(); (inp.value = '나중', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveNow(true);
                await wait(900); out.direct = [writes, stored()];
                // 압축을 기다리는 사이 새 요청 → 옛 상태로 덮지 않는다
                writes = 0; (inp.value = '옛', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveSoon(0); await wait(1); (inp.value = '새', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveSoon(0);
                await wait(900); out.race = [stored(), saveSoonWaiting];
                // 창을 가릴 때(pagehide) 기다리던 저장을 마친다
                writes = 0; (inp.value = '닫기 전', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveSoon(); window.dispatchEvent(new Event('pagehide'));
                out.hide = [writes, stored()];
                Storage.prototype.setItem = set;
                return out;
            });
            // 뒤에서 하는 압축(조각내어 넣기)은 무손실 — 조각 경계에 걸린 두 글자짜리 문자(이모지)도 그대로
            const zip = await p.evaluate(async () => {
                const step = 1 << 17, texts = ['', 'a', '가'.repeat(step - 1) + '😀' + 'b'.repeat(step - 2) + '🇰🇷' + '끝'.repeat(1000), 'x'.repeat(step - 1) + '😀'.repeat(step), JSON.stringify(getAppState()).repeat(3)];
                const out = [];
                for (const t of texts) out.push(HemiSlotStore.unzipText(await HemiSlotStore.zipText(t)) === t);
                return out;
            });
            assert.deepEqual(zip, [true, true, true, true, true]);
            assert.deepEqual(r.beforeDelay, [0, true]);
            assert.deepEqual(r.afterDelay, [1, false, '묶음 4']);
            assert.deepEqual(r.leave, [true, 1, false, '떠나기 전']); assert.equal(r.leaveNoExtra, 1);
            assert.deepEqual(r.direct, [1, '나중']);
            assert.deepEqual(r.race, ['새', false]);
            assert.deepEqual(r.hide, [1, '닫기 전']);
            await ctx.close();
            console.log('PASS: coalesced save writes once, finishes immediately when leaving/hiding, and never overwrites a newer state');
        }

        // ---------- 3. 데스크톱 세이브 폴더 다리 (가짜 앱) ----------
        {
            const fake = () => {
                const calls = []; let mode = 'ok';
                window.__desk = { calls, setMode: m => { mode = m; } };
                window.hemicycleDesktop = { saves: {
                    read: ns => ({ initialized: false, slots: [] }),
                    write: (ns, text) => { calls.push({ kind: 'write', ns, text }); return { ok: true, written: 1 }; },
                    writeSlot: (ns, meta, state) => { calls.push({ kind: 'slot', ns, meta, state }); return mode === 'ok' ? { ok: true, written: 1 } : mode === 'throw' ? (() => { throw new Error('x'); })() : { ok: false, fallback: true }; },
                    dir: () => '/fake'
                } };
            };
            const { ctx, p } = await open(fake);
            const r = await p.evaluate(() => {
                const key = LS_PREFIX + SAVE_SLOTS_KEY, calls = window.__desk.calls, out = {}, inp = document.getElementById('nationNameInput');
                const compose = c => JSON.stringify({ ...JSON.parse(c.state), __hemiSlot: JSON.parse(c.meta) });
                const fromList = () => { const { state, ...meta } = JSON.parse(localStorage.getItem(key)).find(s => s.id === activeSlotId); return JSON.stringify({ ...state, __hemiSlot: meta }); };
                calls.length = 0; (inp.value = '한 파일', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveNow(true);
                out.one = calls.map(c => c.kind).join(','); out.oneSame = compose(calls[0]) === fromList(); out.oneRaw = calls[0].state.slice(0, -1) + ',"__hemiSlot":' + calls[0].meta + '}' === fromList();
                // 앱이 못 한다고 답하면 목록 전체를 보낸다
                window.__desk.setMode('fallback'); calls.length = 0; (inp.value = '넘김', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveNow(true);
                out.fallback = calls.map(c => c.kind).join(','); out.fallbackText = calls[1].text === localStorage.getItem(key);
                window.__desk.setMode('throw'); calls.length = 0; (inp.value = '오류', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveNow(true);
                out.thrown = calls.map(c => c.kind).join(',');
                // 이름 바꾸기 · 새 세이브처럼 목록이 바뀌는 저장은 처음부터 전체 쓰기
                window.__desk.setMode('ok'); calls.length = 0; renameNamedSlot(activeSlotId, '새 이름');
                out.rename = [...new Set(calls.map(c => c.kind))].join(','); out.renameText = calls[calls.length - 1].text === localStorage.getItem(key);
                calls.length = 0; (inp.value = '이름 바꾼 뒤', inp.dispatchEvent(new Event('input', { bubbles: true }))); saveActiveNow(true);
                out.afterRename = calls.map(c => c.kind + ':' + JSON.parse(c.meta || '{}').name).join(',');
                out.error = HemiSaveFolder.lastError();
                return out;
            });
            assert.deepEqual([r.one, r.oneSame, r.oneRaw], ['slot', true, true]);
            assert.deepEqual([r.fallback, r.fallbackText, r.thrown], ['slot,write', true, 'slot,write']);
            assert.deepEqual([r.rename, r.renameText, r.afterRename, r.error], ['write', true, 'slot:새 이름', null]);
            await ctx.close();
            console.log('PASS: desktop bridge sends one save as one file with identical content, and falls back to the whole list on refusal, error or rename');
        }

        // ---------- 4. 안 보이는 목록은 보일 때 그린다 ----------
        {
            const { ctx, p } = await open();
            const html = id => p.evaluate(i => document.getElementById(i).innerHTML, id);
            const draw = { ideologyList: 'renderIdeologyList()', partyListHouse: "renderPartyList('house')", partyListSenate: "renderPartyList('senate')", coalitionList: 'renderCoalitions()', partyInfoList: 'renderPartyInfoList()', leaderList: 'renderLeaderList()' };
            const fresh = async id => { const before = await html(id); await p.evaluate(code => (0, eval)(code), draw[id]); await frame(p); return before === await html(id); };
            await p.evaluate(() => { switchSubTab('nation', 'symbol'); parties[3].name = '바뀐당'; ideologies[0].name = '바뀐이념'; refreshUI(); });
            await frame(p);
            assert.equal((await html('partyInfoList')).includes('바뀐당'), false); // 안 보이는 동안은 그리지 않는다
            await p.evaluate(() => document.getElementById('subTabParty').click()); await frame(p);
            assert.ok((await html('partyInfoList')).includes('바뀐당')); assert.ok(await fresh('partyInfoList'));
            await p.evaluate(() => document.getElementById('innerTabPartyLeader').click()); await frame(p);
            assert.ok((await html('leaderList')).includes('바뀐당')); assert.ok(await fresh('leaderList'));
            await p.evaluate(() => switchSubTab('setup', 'ideology')); await frame(p);
            assert.ok((await html('ideologyList')).includes('바뀐이념')); assert.ok(await fresh('ideologyList'));
            await p.evaluate(() => switchSubTab('setup', 'settings')); await frame(p);
            assert.ok((await html('partyListHouse')).includes('바뀐당')); assert.ok(await fresh('partyListHouse'));
            await p.evaluate(() => { parties[3].name = '또바뀐당'; refreshUI(); document.getElementById('innerTabSetupSenate').click(); }); await frame(p);
            assert.ok((await html('partyListHouse')).includes('또바뀐당')); // 보이는 목록은 바로
            assert.ok(await fresh('partyListSenate'));
            await p.evaluate(() => switchSubTab('setup', 'coalition')); await frame(p);
            assert.ok(await fresh('coalitionList'));
            await ctx.close();
            console.log('PASS: hidden party/leader/ideology/coalition lists are drawn when shown and match an immediate redraw');
        }
        assert.deepEqual(errors, []);
        console.log('PASS: no uncaught browser errors');
    } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
