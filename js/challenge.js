// ===== 챌린지 플레이 (0.3.0) — 목표 · 실패 조건이 있는 짧은 도전 (challenge.html에서 만듦) =====
// challenge.html에서 만든 챌린지(hemicycle-challenge@1)를 게임에서 플레이한다. (시나리오 · 격변은 js/campaign.js)
//   챌린지 = 시작(프리셋 또는 세이브) + 브리핑 + 목표 · 실패 조건 · 마감일 + 이벤트 · 결정 · 변수(스크립트 모드 형식)
// - 시작: challenge.html의 "시험 플레이"가 sessionStorage(hemiBootChallenge, 크면 IndexedDB)에 챌린지를 맡기고
//   시작 프리셋/세이브로 main.html을 연다 → 새 세이브가 만들어지면 여기서 챌린지를 그 세이브에 붙인다.
// - 세이브의 scenario 칸에 저장 (그 세이브에서만). 이벤트 · 결정은 js/scriptmods.js의 세이브 모드로 돈다.
// - 날짜를 넘길 때 · 총선 결과를 반영할 때 목표 · 실패 조건을 검사하고, 다 이루면 승리 · 실패 조건이나 마감일이면 패배.
/* global getAppState, setAppState, showCustomAlert, showCustomConfirm, showKbdToast */
(function () {
    'use strict';

    const FORMAT = 'hemicycle-challenge@1';
    const OLD_FORMAT = 'hemicycle-scenario@1';
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const toast = t => { if (typeof showKbdToast === 'function') showKbdToast(t); };
    const el = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };

    // 세이브에 붙은 챌린지 — { data(시작 상태는 뺀 챌린지), status: 'playing'|'won'|'lost', done: { 목표 id: 날짜 }, result }
    let SC = null;
    let open = false;

    const modId = d => 'challenge.' + String(d.id || 'untitled').replace(/[^a-z0-9_.-]/gi, '_').slice(0, 50);
    function toMod(d) {
        return { format: 'hemicycle-script@1', id: modId(d), name: d.title || i18n('sim.challenge.1'), author: d.author || '', version: d.version || '',
            description: d.description || '', variables: d.variables || {}, events: d.events || [], decisions: d.decisions || [] };
    }
    function bindMod() { if (window.HemiScriptMods && window.HemiScriptMods.setSaveMods) window.HemiScriptMods.setSaveMods(SC ? [toMod(SC.data)] : []); }

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object' && SC) st.challenge = JSON.parse(JSON.stringify(SC));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && (state.challenge || state.scenario); // scenario: 0.3.0 처음 판 세이브
        SC = src && typeof src === 'object' && src.data ? JSON.parse(JSON.stringify(src)) : null;
        if (SC) { SC.done = SC.done || {}; SC.status = SC.status || 'playing'; }
        bindMod();
        render();
        return r;
    };

    function today() {
        const y = parseInt(document.getElementById('nationDateYear')?.value, 10);
        if (!Number.isFinite(y)) return null;
        const m = parseInt(document.getElementById('nationDateMonth')?.value, 10) || 1, d = parseInt(document.getElementById('nationDateDay')?.value, 10) || 1;
        return y * 10000 + m * 100 + d;
    }
    const keyOf = s => { const m = /^(-?\d{1,5})(?:-(\d{1,2}))?(?:-(\d{1,2}))?$/.exec(String(s ?? '').trim()); return m ? +m[1] * 10000 + (+m[2] || 1) * 100 + (+m[3] || 1) : null; };
    const labelOf = k => (k == null ? '' : i18n('sim.challenge.2', { v: Math.floor(k / 10000), v2: Math.floor(k / 100) % 100, v3: k % 100 }));
    const test = cond => { try { return !!(window.HemiScriptMods && window.HemiScriptMods.test(cond, modId(SC.data))); } catch (e) { return false; } };

    // ---------------------------------------------------------------
    // 검사
    // ---------------------------------------------------------------
    function check(quiet) {
        if (!SC || SC.status !== 'playing') { render(); return; }
        const d = SC.data, t = today();
        const goals = Array.isArray(d.goals) ? d.goals : [];
        goals.forEach(g => {
            if (!g || !g.id) return;
            const ok = test(g.condition);
            if (ok && !SC.done[g.id]) { SC.done[g.id] = t || 1; if (!quiet) toast(i18n('sim.challenge.3', { text: g.text || g.id })); }
            else if (!ok && g.hold && SC.done[g.id]) delete SC.done[g.id]; // "끝까지 유지" 목표는 다시 깨질 수 있음
        });
        const fail = (Array.isArray(d.failures) ? d.failures : []).find(f => f && test(f.condition));
        const required = goals.filter(g => g && g.id && g.required !== false);
        const allDone = required.length > 0 && required.every(g => SC.done[g.id]);
        const dl = keyOf(d.deadline);
        if (fail) finish('lost', fail.text || i18n('sim.challenge.4'));
        else if (allDone && !d.surviveToDeadline) finish('won');
        else if (dl != null && t != null && t >= dl) {
            if (allDone) finish('won');
            else finish('lost', i18n('sim.challenge.5', { dl: labelOf(dl) }));
        }
        render();
    }
    function finish(status, reason) {
        SC.status = status;
        SC.result = { at: today(), reason: reason || '' };
        render();
        setTimeout(showResult, 200);
    }

    const origAdvance = window.advanceNationDate;
    if (typeof origAdvance === 'function') window.advanceNationDate = function () {
        const b = today();
        const r = origAdvance.apply(this, arguments);
        if (SC && today() !== b) setTimeout(() => check(false), 0); // 스크립트 모드 이벤트가 먼저 돌고 나서
        return r;
    };
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') window.elecApplyToParliament = function () {
        const r = origApply.apply(this, arguments);
        if (SC) setTimeout(() => check(false), 10);
        return r;
    };

    // ---------------------------------------------------------------
    // 화면: 오른쪽 아래 목표 카드 · 브리핑 · 결과
    // ---------------------------------------------------------------
    const box = el('<div id="scTracker" class="sc-tracker" style="display:none;"></div>');
    document.body.appendChild(box);
    function render() {
        if (!SC) { box.style.display = 'none'; return; }
        const d = SC.data;
        const goals = (Array.isArray(d.goals) ? d.goals : []).filter(g => g && g.id);
        const req = goals.filter(g => g.required !== false);
        const n = req.filter(g => SC.done[g.id]).length;
        const dl = keyOf(d.deadline);
        const st = SC.status;
        box.style.display = '';
        box.className = `sc-tracker ${st} ${open ? 'open' : ''}`;
        box.innerHTML = `
            <button type="button" class="sc-pill" data-toggle title="${esc(i18n('sim.challenge.6'))}">
                <span class="sc-ico">${st === 'won' ? '🏆' : st === 'lost' ? '✖' : '🎯'}</span>
                <span class="sc-pill-t">${esc(d.title || esc(i18n('sim.challenge.1')))}</span>
                <span class="sc-pill-n">${st === 'playing' ? `${n}/${req.length}` : st === 'won' ? esc(i18n('sim.challenge.7')) : esc(i18n('sim.challenge.8'))}</span>
            </button>
            ${open ? `<div class="sc-panel">
                ${d.author ? `<div class="sc-dim">${esc(i18n('sim.challenge.9'))} ${esc(d.author)}</div>` : ''}
                ${dl != null ? `<div class="sc-dim">${esc(i18n('sim.challenge.10'))} ${esc(labelOf(dl))}${d.surviveToDeadline ? esc((" " + i18n('sim.challenge.11'))) : ''}</div>` : ''}
                <div class="sc-h">${esc(i18n('sim.challenge.12'))}</div>
                <ul class="sc-list">${goals.map(g => `<li class="${SC.done[g.id] ? 'done' : ''}"><span class="sc-chk">${SC.done[g.id] ? '✔' : '○'}</span><span>${esc(g.text || g.id)}${g.required === false ? ` <span class="sc-dim">${esc(i18n('sim.news.38'))}</span>` : ''}${g.hold ? ` <span class="sc-dim">${esc(i18n('sim.challenge.13'))}</span>` : ''}</span></li>`).join('') || `<li class="sc-dim">${esc(i18n('sim.challenge.14'))}</li>`}</ul>
                ${(d.failures || []).length ? `<div class="sc-h">${esc(i18n('sim.challenge.15'))}</div><ul class="sc-list fail">${d.failures.map(f => `<li><span class="sc-chk">!</span><span>${esc(f.text || esc(i18n('sim.challenge.4')))}</span></li>`).join('')}</ul>` : ''}
                ${st !== 'playing' ? `<div class="sc-result ${st}">${st === 'won' ? esc(i18n('sim.challenge.16')) : esc(i18n('sim.challenge.17'))}${SC.result && SC.result.reason ? ` — ${esc(SC.result.reason)}` : ''}</div>` : ''}
                <div class="sc-row">
                    <button type="button" class="sc-btn" data-brief>${esc(i18n('sim.challenge.18'))}</button>
                    ${st === 'playing' ? `<button type="button" class="sc-btn" data-check>${esc(i18n('sim.challenge.19'))}</button>` : `<button type="button" class="sc-btn" data-result>${esc(i18n('sim.challenge.20'))}</button>`}
                    <a class="sc-btn" href="challenge.html">${esc(i18n('sim.challenge.22'))}</a>
                    <button type="button" class="sc-btn sc-x" data-quit title="${esc(i18n('sim.challenge.21'))}">${esc(i18n('sim.challenge.23'))}</button>
                </div>
            </div>` : ''}`;
        box.querySelector('[data-toggle]').onclick = () => { open = !open; if (open && SC.status === 'playing') check(true); else render(); };
        box.querySelector('[data-brief]')?.addEventListener('click', showBrief);
        box.querySelector('[data-check]')?.addEventListener('click', () => { check(false); toast(i18n('sim.challenge.24')); });
        box.querySelector('[data-result]')?.addEventListener('click', showResult);
        box.querySelector('[data-quit]')?.addEventListener('click', () => showCustomConfirm(i18n('sim.challenge.25'), () => { SC = null; bindMod(); render(); }));
    }

    function modal(html, buttons) {
        const ov = el(`<div class="sc-overlay"><div class="sc-modal" role="dialog" aria-modal="true">${html}<div class="sc-row sc-end">${buttons.map((b, i) => `<button type="button" class="sc-btn ${b.primary ? 'sc-primary' : ''}" data-i="${i}">${esc(b.text)}</button>`).join('')}</div></div></div>`);
        const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
        const onKey = e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
        ov.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => { close(); const f = buttons[+b.dataset.i].on; if (f) f(); }; });
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(ov);
        ov.querySelector('.sc-primary, [data-i]')?.focus();
    }
    const paras = t => esc(t || '').split(/\n{2,}/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    function showBrief() {
        if (!SC) return;
        const d = SC.data, dl = keyOf(d.deadline);
        modal(`<div class="sc-kicker">${esc(i18n('sim.challenge.1'))}${d.author ? esc((" " + i18n('sim.challenge.26', { author: (d.author) }))) : ''}</div><h2 class="sc-title">${esc(d.title || esc(i18n('sim.challenge.1')))}</h2>
            <div class="sc-body">${paras(d.briefing || d.description || '')}</div>
            <div class="sc-h">${esc(i18n('sim.challenge.12'))}</div><ul class="sc-list">${(d.goals || []).filter(g => g && g.id).map(g => `<li><span class="sc-chk">○</span><span>${esc(g.text || g.id)}${g.required === false ? ` <span class="sc-dim">${esc(i18n('sim.news.38'))}</span>` : ''}</span></li>`).join('') || `<li class="sc-dim">${esc(i18n('sim.challenge.27'))}</li>`}</ul>
            ${dl != null ? `<div class="sc-dim">${esc(i18n('sim.challenge.28'))} ${esc(labelOf(dl))}</div>` : ''}`, [{ text: i18n('sim.challenge.29'), primary: true }]);
    }
    function showResult() {
        if (!SC || SC.status === 'playing') return;
        const d = SC.data, won = SC.status === 'won';
        const goals = (d.goals || []).filter(g => g && g.id);
        modal(`<div class="sc-kicker">${esc(d.title || i18n('sim.challenge.1'))}</div><h2 class="sc-title ${won ? 'won' : 'lost'}">${won ? i18n('sim.challenge.16') : i18n('sim.challenge.17')}</h2>
            <div class="sc-body">${paras(won ? (d.winText || i18n('sim.challenge.30')) : (d.loseText || ''))}${!won && SC.result && SC.result.reason ? `<p class="sc-dim">${esc(SC.result.reason)}</p>` : ''}</div>
            <ul class="sc-list">${goals.map(g => `<li class="${SC.done[g.id] ? 'done' : ''}"><span class="sc-chk">${SC.done[g.id] ? '✔' : '○'}</span><span>${esc(g.text || g.id)}${SC.done[g.id] && SC.done[g.id] > 1 ? ` <span class="sc-dim">${esc(labelOf(SC.done[g.id]))}</span>` : ''}</span></li>`).join('')}</ul>
            ${SC.result && SC.result.at ? `<div class="sc-dim">${esc(labelOf(SC.result.at))}</div>` : ''}`,
        [{ text: i18n('sim.challenge.31'), on: () => { location.href = 'challenge.html'; } }, { text: i18n('sim.challenge.32'), primary: true }]);
    }

    // ---------------------------------------------------------------
    // 시작: challenge.html이 맡긴 챌린지를 새 세이브에 붙이기
    // ---------------------------------------------------------------
    // 화면을 열 때(main.js의 부팅보다 먼저) 맡겨 둔 챌린지가 있는지 본다 — 시작 세이브가 만들어지는 순간(createNamedSlotFromCurrentState)에 붙임
    let pendingRaw = null, pendingStash = false;
    try {
        pendingRaw = sessionStorage.getItem('hemiBootChallenge'); sessionStorage.removeItem('hemiBootChallenge');
        pendingStash = !!sessionStorage.getItem('hemiBootChallengePending'); sessionStorage.removeItem('hemiBootChallengePending');
    } catch (e) { /* sessionStorage 없음 */ }
    async function takePending() {
        let raw = pendingRaw;
        pendingRaw = null;
        if (!raw && pendingStash) { pendingStash = false; try { const v = await window.HemiFile.take('bootChallenge'); raw = v && v.text; } catch (e) { raw = null; } }
        if (!raw) return null;
        try { const d = JSON.parse(raw); return d && (d.format === FORMAT || d.format === OLD_FORMAT) ? d : null; } catch (e) { return null; }
    }
    function attach(d) {
        const data = JSON.parse(JSON.stringify(d));
        delete data.start; // 시작 상태(세이브 전체)는 세이브에 다시 넣지 않는다
        SC = { data, status: 'playing', done: {}, result: null, startedAt: today() };
        bindMod();
        open = true;
        check(true);
        render();
        showBrief();
        try { if (typeof window.saveActiveNow === 'function') window.saveActiveNow(true); } catch (e) { /* 저장은 자동저장에 맡김 */ }
    }
    if (pendingRaw || pendingStash) {
        const origCreate = window.createNamedSlotFromCurrentState;
        if (typeof origCreate === 'function') window.createNamedSlotFromCurrentState = function () {
            const r = origCreate.apply(this, arguments);
            window.createNamedSlotFromCurrentState = origCreate; // 한 번만
            takePending().then(d => { if (d) setTimeout(() => attach(d), 200); });
            return r;
        };
    }

    window.HemiChallenge = { get state() { return SC; }, check: () => check(false), attach, showBrief, showResult, FORMAT };

    const css = document.createElement('style');
    css.textContent = `
        .sc-tracker { position: fixed; right: 16px; bottom: 16px; z-index: 9000; max-width: min(360px, calc(100vw - 32px)); display: flex; flex-direction: column-reverse; align-items: flex-end; gap: 6px; font-size: .84rem; }
        .sc-pill { cursor: pointer; font: inherit; display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px; background: #0d0f14; color: #ddd; border: 1px solid var(--tno-gold, #ffd700); box-shadow: 0 0 12px rgba(255,215,0,.2); max-width: 100%; }
        .sc-pill-t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
        .sc-pill-n { color: var(--tno-gold, #ffd700); flex: 0 0 auto; }
        .sc-tracker.won .sc-pill { border-color: #3ecf8e; } .sc-tracker.won .sc-pill-n { color: #3ecf8e; }
        .sc-tracker.lost .sc-pill { border-color: #ef6461; } .sc-tracker.lost .sc-pill-n { color: #ef6461; }
        .sc-panel { width: 340px; max-width: 100%; max-height: 60vh; overflow: auto; background: #0d0f14; color: #ddd; border: 1px solid #333; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.5); }
        .sc-h { color: var(--tno-gold, #ffd700); font-size: .76rem; letter-spacing: 1px; margin-top: 4px; }
        .sc-dim { color: #8a94a3; font-size: .74rem; }
        .sc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
        .sc-list li { display: flex; gap: 7px; line-height: 1.45; } .sc-list li.done { color: #3ecf8e; }
        .sc-list.fail li { color: #e7a0a0; }
        .sc-chk { flex: 0 0 14px; text-align: center; }
        .sc-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; } .sc-end { justify-content: flex-end; margin-top: 12px; }
        .sc-btn { cursor: pointer; font: inherit; font-size: .78rem; padding: 5px 10px; background: transparent; border: 1px solid #444; color: #ccc; text-decoration: none; display: inline-flex; align-items: center; }
        .sc-btn:hover { border-color: var(--tno-neon); color: var(--tno-neon); }
        .sc-btn.sc-primary { border-color: var(--tno-gold, #ffd700); color: var(--tno-gold, #ffd700); }
        .sc-btn.sc-x:hover { border-color: #ef6461; color: #ef6461; }
        .sc-result { padding: 6px 8px; border: 1px solid; } .sc-result.won { color: #3ecf8e; } .sc-result.lost { color: #ef6461; }
        .sc-overlay { position: fixed; inset: 0; z-index: 100002; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.7); }
        .sc-modal { width: 520px; max-width: 100%; max-height: calc(100vh - 32px); overflow: auto; background: #0d0f14; color: #ddd; border: 1px solid var(--tno-gold, #ffd700); padding: 20px 22px; box-shadow: 0 0 30px rgba(255,215,0,.15); }
        .sc-kicker { color: #8a94a3; font-size: .74rem; letter-spacing: 1px; }
        .sc-title { margin: 4px 0 10px; font-size: 1.4rem; font-weight: normal; color: var(--tno-gold, #ffd700); } .sc-title.won { color: #3ecf8e; } .sc-title.lost { color: #ef6461; }
        .sc-body { line-height: 1.75; font-size: .9rem; } .sc-body p { margin: 0 0 10px; }
        html[data-theme-family="modern"] .sc-pill { background: var(--m-surface); color: var(--m-text); border: 1px solid var(--m-border); border-radius: 999px; box-shadow: var(--m-shadow); font-weight: 600; }
        html[data-theme-family="modern"] .sc-pill-n { color: var(--m-text-2); }
        html[data-theme-family="modern"] .sc-tracker.won .sc-pill-n { color: var(--m-success); } html[data-theme-family="modern"] .sc-tracker.lost .sc-pill-n { color: var(--m-danger); }
        html[data-theme-family="modern"] .sc-panel, html[data-theme-family="modern"] .sc-modal { background: var(--m-surface); color: var(--m-text); border: 1px solid var(--m-border); border-radius: 14px; box-shadow: var(--m-shadow-lg); }
        html[data-theme-family="modern"] .sc-h { color: var(--m-text); font-weight: 700; letter-spacing: 0; }
        html[data-theme-family="modern"] .sc-dim, html[data-theme-family="modern"] .sc-kicker { color: var(--m-text-3); }
        html[data-theme-family="modern"] .sc-list li.done { color: var(--m-success); } html[data-theme-family="modern"] .sc-list.fail li { color: var(--m-danger); }
        html[data-theme-family="modern"] .sc-btn { border-color: var(--m-border); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .sc-btn.sc-primary { background: var(--m-accent); border-color: var(--m-accent); color: var(--m-on-accent, #fff); }
        html[data-theme-family="modern"] .sc-title { color: var(--m-text); font-weight: 800; }
        html[data-theme-family="modern"] .sc-title.won { color: var(--m-success); } html[data-theme-family="modern"] .sc-title.lost { color: var(--m-danger); }
        html[data-theme-family="modern"] .sc-result { border-radius: 8px; }
    `;
    document.head.appendChild(css);
})();
