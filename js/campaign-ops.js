// ===== 시나리오 › 운영 — 자원 · 시설 · 기술 · 군사 · 무역 화면 (v1.7.1 · 시나리오 0.3.2) =====
// 규칙은 js/ops-rules.js, 계산 시점(하루마다)과 행동 처리는 js/campaign.js(HemiCampaign.opsAct). 이 파일은 보여 주고 누르게만 한다.
// 국가 운영을 쓰는 시나리오(자원 · 시설 · 기술 · 부대 · 무역 중 하나라도 있음)에서만 탭이 보인다.
/* global switchSubTab, currentMainTab, currentSubTab, showKbdToast, showCustomAlert */
(function () {
    'use strict';
    const O = window.HemiOps;
    const host0 = document.getElementById('mainContentCampaign');
    if (!O || !host0) return;
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const C = () => window.HemiCampaign && window.HemiCampaign.state;
    const toast = t => { if (typeof showKbdToast === 'function') showKbdToast(t); };
    const n = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const r1 = v => Math.round(v * 10) / 10;

    // 탭
    const bar = host0.querySelector('.sub-tab-container');
    const tab = document.createElement('button');
    tab.className = 'sub-tab-btn'; tab.id = 'subTabCampops'; tab.textContent = i18n('sim.campaignOps.1'); tab.style.display = 'none';
    tab.setAttribute('onclick', "switchSubTab('campaign','campops')");
    bar.insertBefore(tab, document.getElementById('subTabCamparticles'));
    const box = document.createElement('div'); box.id = 'contentCampops'; box.className = 'sub-tab-content';
    host0.appendChild(box);
    let view = 'res';

    const res = (d, id) => O.byId(d, 'resources', id);
    const resLabel = (d, id) => { const r = res(d, id); return r ? `${r.icon ? r.icon + ' ' : ''}${r.name || id}` : id; };
    const amountText = (d, m, sign = '') => O.amounts(m).map(([k, v]) => `${resLabel(d, k)} ${sign}${r1(v)}`).join(' · ');
    const period = days => (C() && C().clock && C().clock.mode === 'turn' ? i18n('sim.campaignOps.2', { days: Math.max(0, Math.ceil(days - 1e-9)) }) : i18n('sim.campaignOps.3', { days: Math.max(0, Math.ceil(days - 1e-9)) }));
    const left = j => Math.max(0, n(j.days) - (n(window.HemiCampaign.nowDay()) - n(j.started)));
    const pct = j => (n(j.days) ? Math.max(0, Math.min(100, (1 - left(j) / n(j.days)) * 100)) : 100);
    const testCond = cond => (cond == null ? true : !!window.HemiCampaign.test(cond));

    function act(kind, id, a) {
        const why = window.HemiCampaign.opsAct(kind, id, a);
        if (why) toast('⛔ ' + why);
        render();
    }
    function render() {
        const R = C();
        const on = !!(R && R.ops && O.uses(R.data));
        tab.style.display = on ? '' : 'none';
        if (!on) { box.innerHTML = `<div class="cp-empty">${esc(i18n('sim.campaignOps.4'))}</div>`; return; }
        const d = R.data, s = R.ops;
        const has = k => O.list(d, k).length > 0;
        const views = [['res', i18n('sim.campaignOps.5'), has('resources') || has('facilities')], ['tech', i18n('sim.campaignOps.6'), has('tech')], ['mil', i18n('sim.campaignOps.7'), has('units')], ['trade', i18n('sim.campaignOps.8'), has('trades')]].filter(v => v[2]);
        if (!views.some(v => v[0] === view)) view = views[0][0];
        const seg = `<div class="cp-row cp-ops-seg" role="tablist">${views.map(([k, l]) => `<button type="button" class="cp-btn ${k === view ? 'cp-primary' : ''}" data-ops-view="${k}" role="tab" aria-selected="${k === view}">${l}</button>`).join('')}</div>`;
        const body = view === 'res' ? resHtml(d, s) : view === 'tech' ? techHtml(d, s) : view === 'mil' ? milHtml(d, s) : tradeHtml(d, s);
        const log = s.log.length ? `<details class="cp-card"><summary class="cp-h">${esc(i18n('sim.campaignOps.9'))} ${s.log.length}</summary>${s.log.slice().reverse().slice(0, 12).map(t => `<div class="cp-dim">${esc(t)}</div>`).join('')}</details>` : '';
        box.innerHTML = `<div class="cp-wrap cp-ops">${seg}${body}${log}</div>`;
        box.querySelectorAll('[data-ops-view]').forEach(b => { b.onclick = () => { view = b.dataset.opsView; render(); }; });
        box.querySelectorAll('[data-ops]').forEach(b => { b.onclick = () => { const [kind, id, a] = b.dataset.ops.split('|'); act(kind, id, a); }; });
    }
    function resHtml(d, s) {
        const fc = O.forecast(s, d);
        const rows = O.list(d, 'resources').map(r => { const v = n(s.stock[r.id]), f = fc[r.id] || 0; return `<tr><td>${esc(resLabel(d, r.id))}</td><td class="cp-num">${r1(v)}${r.unit ? ` <span class="cp-dim">${esc(r.unit)}</span>` : ''}${r.max != null ? ` <span class="cp-dim">/ ${n(r.max)}</span>` : ''}</td><td class="cp-num ${f > 0 ? 'cp-up' : f < 0 ? 'cp-down' : ''}">${f > 0 ? '+' : ''}${r1(f)}</td></tr>`; }).join('');
        const fac = O.list(d, 'facilities').map(f => {
            const cnt = Math.floor(n(s.facilities[f.id])), job = s.building.find(j => j.id === f.id), why = O.whyNot('facility', s, d, f.id, testCond), short = s.shortage.facilities.includes(f.id);
            return `<div class="cp-dec ${why && !job ? 'off' : ''}"><div class="cp-grow"><b>${esc(`${f.icon ? f.icon + ' ' : ''}${f.name || f.id}`)}</b> <span class="cp-dim">× ${cnt}${f.max != null ? ` / ${n(f.max)}` : ''}</span>${short ? ` <span class="cp-down">${esc(i18n('sim.campaignOps.10'))}</span>` : ''}
                ${f.desc ? `<div class="cp-dim">${esc(f.desc)}</div>` : ''}
                <div class="cp-dim">${[O.amounts(f.produce).length ? i18n('sim.campaignOps.11', { produce: amountText(d, f.produce, '+') }) : '', O.amounts(f.consume).length ? i18n('sim.campaignOps.12', { consume: amountText(d, f.consume, '-') }) : '', O.amounts(f.upkeep).length ? i18n('sim.campaignOps.13', { upkeep: amountText(d, f.upkeep, '-') }) : ''].filter(Boolean).join(' · ') || i18n('sim.campaignOps.14')}</div>
                <div class="cp-dim">${f.buildable === false ? i18n('sim.campaignOps.15') : i18n('sim.campaignOps.17', { cost: amountText(d, f.cost) || i18n('sim.campaignOps.16'), days: period(n(f.days)) })}${(f.requires || []).length ? (" " + i18n('sim.campaignOps.18', { title: (f.requires || []).map(id => esc((O.byId(d, 'tech', id) || {}).title || id)).join(', ') })) : ''}</div>
                ${job ? `<div class="cp-bar"><i style="width:${pct(job)}%"></i></div><div class="cp-dim">${esc(i18n('sim.campaignOps.19'))} ${period(left(job))} ${esc(i18n('sim.campaignOps.20'))}</div>` : ''}</div>
                ${job ? `<button type="button" class="cp-btn" data-ops="facility|${esc(f.id)}|cancel">${esc(i18n('sim.campaignOps.21'))}</button>` : f.buildable === false ? '' : `<button type="button" class="cp-btn ${why ? '' : 'cp-primary'}" data-ops="facility|${esc(f.id)}|start" ${why ? 'disabled' : ''}>${esc(why || i18n('sim.campaignOps.22'))}</button>`}</div>`;
        }).join('');
        return `${rows ? `<div class="cp-card"><div class="cp-h">${esc(i18n('sim.campaignOps.23'))}</div><table class="cp-table"><thead><tr><th>${esc(i18n('sim.campaignOps.23'))}</th><th>${esc(i18n('sim.campaignOps.24'))}</th><th>${esc(i18n('sim.campaignOps.25'))}</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
            ${fac ? `<div class="cp-card"><div class="cp-h">${esc(i18n('sim.campaignOps.26'))}</div><div class="cp-dim">${esc(i18n('sim.campaignOps.27'))}</div>${fac}</div>` : ''}`;
    }
    // 기술 트리 — 기술마다 x · y 칸 (방향성 트리와 같은 칸 배치), 선은 선행 → 이 기술
    function techHtml(d, s) {
        const list = O.list(d, 'tech'), W = 150, H = 64, GX = 26, GY = 34, P = 14;
        const pos = t => ({ x: P + n(t.x) * (W + GX) / 2, y: P + n(t.y) * (H + GY) });
        const cols = Math.max(1, ...list.map(t => n(t.x) + 2)), rows = Math.max(1, ...list.map(t => n(t.y) + 1));
        const wpx = P * 2 + cols * (W + GX) / 2 + W / 2, hpx = P * 2 + rows * (H + GY);
        const lines = list.flatMap(t => [...(t.prereq || []).map(id => [id, 'req']), ...(t.any || []).map(id => [id, 'any'])].map(([id, kind]) => { const a = O.byId(d, 'tech', id); if (!a) return ''; const p1 = pos(a), p2 = pos(t); return `<path d="M${p1.x + W / 2} ${p1.y + H} V${(p1.y + H + p2.y) / 2} H${p2.x + W / 2} V${p2.y}" class="cp-tech-line ${kind === 'any' ? 'any' : ''} ${O.techDone(s, id) ? 'done' : ''}"/>`; })).join('');
        const cur = s.tech.cur, curT = cur && O.byId(d, 'tech', cur.id);
        const nodes = list.map(t => {
            const st = O.techState(s, d, t), p = pos(t), why = st === 'available' ? O.whyNot('tech', s, d, t.id, testCond) : null;
            return `<button type="button" class="cp-tech cp-tech-${st} ${why ? 'cp-tech-wait' : ''}" style="left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px" ${st === 'available' && !why ? `data-ops="tech|${esc(t.id)}|start"` : ''} title="${esc([t.desc, amountText(d, t.cost) && i18n('sim.campaignOps.28', { cost: amountText(d, t.cost) }), `${period(n(t.days))}`, why].filter(Boolean).join('\n'))}">
                <span class="cp-tech-t">${esc(`${t.icon ? t.icon + ' ' : ''}${t.title || t.id}`)}</span><span class="cp-tech-s">${st === 'done' ? i18n('sim.campaignOps.29') : st === 'current' ? i18n('sim.campaignOps.30', { cur: period(left(cur)) }) : st === 'blocked' ? i18n('sim.campaignOps.31') : st === 'locked' ? i18n('sim.campaignOps.32') : why ? esc(why) : i18n('sim.campaignOps.33', { days: period(n(t.days)) })}</span></button>`;
        }).join('');
        return `<div class="cp-card"><div class="cp-h">${esc(i18n('sim.campaignOps.34'))}</div>${curT ? `<div class="cp-focus-cur"><b>${esc(curT.title || curT.id)}</b><span class="cp-grow"></span><span class="cp-days">${period(left(cur))} ${esc(i18n('sim.campaignOps.20'))}</span><button type="button" class="cp-btn" data-ops="tech|${esc(cur.id)}|cancel">${esc(i18n('sim.campaignOps.35'))}</button></div><div class="cp-bar"><i style="width:${pct(cur)}%"></i></div><div class="cp-dim">${esc(i18n('sim.campaignOps.36'))}</div>` : `<div class="cp-dim">${esc(i18n('sim.campaignOps.37'))}</div>`}
            <div class="cp-dim">${esc(i18n('sim.campaignOps.38'))} ${Object.keys(s.tech.done).length} / ${list.length}</div></div>
            <div class="cp-tech-wrap"><div class="cp-tech-board" style="width:${wpx}px;height:${hpx}px"><svg class="cp-tech-svg" width="${wpx}" height="${hpx}" aria-hidden="true">${lines}</svg>${nodes}</div></div>`;
    }
    function milHtml(d, s) {
        const total = O.strength(s, d);
        const units = O.list(d, 'units').map(u => {
            const cnt = Math.floor(n(s.units[u.id])), job = s.recruiting.find(j => j.id === u.id), why = O.whyNot('unit', s, d, u.id, testCond), short = s.shortage.units.includes(u.id);
            return `<div class="cp-dec ${why && !job ? 'off' : ''}"><div class="cp-grow"><b>${esc(`${u.icon ? u.icon + ' ' : ''}${u.name || u.id}`)}</b> <span class="cp-dim">${esc(u.branch || '')} × ${cnt}${u.max != null ? ` / ${n(u.max)}` : ''} ${esc(i18n('sim.campaignOps.39'))} ${r1(cnt * n(u.strength) * (short ? 0.5 : 1))}</span>${short ? ` <span class="cp-down">${esc(i18n('sim.campaignOps.40'))}</span>` : ''}
                ${u.desc ? `<div class="cp-dim">${esc(u.desc)}</div>` : ''}
                <div class="cp-dim">${esc(i18n('sim.campaignOps.41'))} ${amountText(d, u.cost) || esc(i18n('sim.campaignOps.16'))} · ${period(n(u.days))}${O.amounts(u.upkeep).length ? esc((" " + i18n('sim.campaignOps.42', { upkeep: amountText(d, u.upkeep, '-') }))) : ''}${(u.requires || []).length ? esc((" " + i18n('sim.campaignOps.18', { title: (u.requires || []).map(id => esc((O.byId(d, 'tech', id) || {}).title || id)).join(', ') }))) : ''}</div>
                ${job ? `<div class="cp-bar"><i style="width:${pct(job)}%"></i></div><div class="cp-dim">${esc(i18n('sim.campaignOps.43'))} ${period(left(job))} ${esc(i18n('sim.campaignOps.20'))}</div>` : ''}</div>
                ${job ? `<button type="button" class="cp-btn" data-ops="unit|${esc(u.id)}|cancel">${esc(i18n('sim.campaignOps.44'))}</button>` : u.recruitable === false ? '' : `<button type="button" class="cp-btn ${why ? '' : 'cp-primary'}" data-ops="unit|${esc(u.id)}|start" ${why ? 'disabled' : ''}>${esc(why || esc(i18n('sim.campaignOps.45')))}</button>`}</div>`;
        }).join('');
        return `<div class="cp-card"><div class="cp-h">${esc(i18n('sim.campaignOps.46'))}</div><div class="cp-big">${esc(i18n('sim.campaignOps.47'))} ${r1(total)}</div><div class="cp-dim">${esc(i18n('sim.campaignOps.48'))}</div></div><div class="cp-card"><div class="cp-h">${esc(i18n('sim.campaignOps.49'))}</div>${units}</div>`;
    }
    function tradeHtml(d, s) {
        const names = new Map((d.world && Array.isArray(d.world.countries) ? d.world.countries : []).map(c => [c.key, c.name || c.key]));
        const row = t => {
            const st = s.trades[t.id], why = O.whyNot('trade', s, d, t.id, testCond), active = st && st.status === 'active';
            const left2 = active && st.ends != null ? Math.max(0, st.ends - n(s.day)) : null;
            const label = !st ? '' : { active: left2 != null ? i18n('sim.campaignOps.50', { left2: period(left2) }) : i18n('sim.campaignOps.51'), done: i18n('sim.campaignOps.52'), failed: i18n('sim.campaignOps.53'), cancelled: i18n('sim.campaignOps.54') }[st.status] || st.status;
            return `<div class="cp-dec ${!active && why ? 'off' : ''}"><div class="cp-grow"><b>${esc(t.title || t.id)}</b> <span class="cp-dim">${esc(i18n('sim.campaignOps.55'))} ${esc(names.get(t.partner) || t.partner || '—')}</span>${label ? ` <span class="cp-dim">· ${esc(label)}</span>` : ''}
                ${t.desc ? `<div class="cp-dim">${esc(t.desc)}</div>` : ''}<div class="cp-dim">${esc(i18n('sim.campaignOps.56'))} ${amountText(d, t.give) || esc(i18n('sim.contentVote.16'))} ${esc(i18n('sim.campaignOps.57'))} ${amountText(d, t.get) || esc(i18n('sim.contentVote.16'))}${n(t.days) > 0 ? ` · ${period(n(t.days))}` : esc((" " + i18n('sim.campaignOps.58')))}</div></div>
                ${active ? `<button type="button" class="cp-btn" data-ops="trade|${esc(t.id)}|cancel">${esc(i18n('sim.campaignOps.59'))}</button>` : `<button type="button" class="cp-btn ${why ? '' : 'cp-primary'}" data-ops="trade|${esc(t.id)}|start" ${why ? 'disabled' : ''}>${esc(why || esc(i18n('sim.campaignOps.60')))}</button>`}</div>`;
        };
        const visible = O.list(d, 'trades').filter(t => s.trades[t.id] || testCond(t.visible));
        return `<div class="cp-card"><div class="cp-h">${esc(i18n('sim.campaignOps.61'))}</div><div class="cp-dim">${esc(i18n('sim.campaignOps.62'))}</div>${visible.map(row).join('') || `<div class="cp-dim">${esc(i18n('sim.campaignOps.63'))}</div>`}</div>`;
    }

    const onTab = () => typeof currentMainTab !== 'undefined' && currentMainTab === 'campaign' && currentSubTab && currentSubTab.campaign === 'campops';
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) { const r = origSwitch.apply(this, arguments); if (main === 'campaign' && sub === 'campops') render(); return r; };
    window.addEventListener('hemi-campaign-changed', () => setTimeout(() => { render(); if (tab.style.display === 'none' && onTab()) switchSubTab('campaign', 'campaign'); }, 0));
    window.addEventListener('hemi-campaign-ticked', () => { if (onTab()) render(); else { const R = C(); tab.style.display = R && R.ops ? '' : 'none'; } });
    window.addEventListener('hemi-script-effects-applied', () => { if (onTab()) render(); });

    const css = document.createElement('style');
    css.textContent = `
        .cp-ops-seg { margin-bottom: 4px; }
        .cp-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
        .cp-table th, .cp-table td { padding: 5px 6px; border-bottom: 1px solid #2a3138; text-align: left; }
        .cp-table th { color: #8a94a3; font-weight: normal; font-size: .74rem; }
        .cp-num { text-align: right !important; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .cp-up { color: #6fd38a; } .cp-down { color: #ff8a8a; }
        .cp-big { font-size: 1.4rem; color: var(--tno-gold, #ffd700); margin: 4px 0; }
        .cp-tech-wrap { overflow: auto; max-height: 60vh; border: 1px solid #2a3138; }
        .cp-tech-board { position: relative; }
        .cp-tech-svg { position: absolute; inset: 0; pointer-events: none; }
        .cp-tech-line { fill: none; stroke: #3a4552; stroke-width: 2; } .cp-tech-line.any { stroke-dasharray: 5 4; } .cp-tech-line.done { stroke: var(--tno-neon, #0ff); }
        .cp-tech { position: absolute; display: flex; flex-direction: column; justify-content: center; gap: 3px; padding: 6px 8px; font: inherit; font-size: .78rem; text-align: left; cursor: default;
            background: #0d1117; color: #ccc; border: 1px solid #3a4552; overflow: hidden; }
        .cp-tech-t { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #eee; } .cp-tech-s { font-size: .7rem; color: #8a94a3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cp-tech-available:not(.cp-tech-wait) { border-color: var(--tno-neon, #0ff); cursor: pointer; } .cp-tech-available:not(.cp-tech-wait):hover { background: rgba(0,255,255,.08); }
        .cp-tech-current { border-color: var(--tno-gold, #ffd700); } .cp-tech-done { border-color: #2f6b45; background: rgba(47,107,69,.18); } .cp-tech-locked, .cp-tech-blocked { opacity: .5; }
        html[data-theme-family="modern"] .cp-tech { background: var(--m-surface); color: var(--m-text); border-color: var(--m-border); border-radius: 8px; }
        html[data-theme-family="modern"] .cp-tech-t { color: var(--m-text); } html[data-theme-family="modern"] .cp-tech-available:not(.cp-tech-wait) { border-color: var(--m-accent); }
        html[data-theme-family="modern"] .cp-tech-line { stroke: var(--m-border); } html[data-theme-family="modern"] .cp-tech-line.done { stroke: var(--m-accent); }
        html[data-theme-family="modern"] .cp-tech-wrap, html[data-theme-family="modern"] .cp-table th, html[data-theme-family="modern"] .cp-table td { border-color: var(--m-border); }
        html[data-theme-family="modern"] .cp-big { color: var(--m-text); }
    `;
    document.head.appendChild(css);
    window.HemiCampaignOps = { render, get view() { return view; }, set view(v) { view = v; render(); } };
    setTimeout(render, 0);
})();
