// ===== 시나리오 › 운영 — 자원 · 시설 · 기술 · 군사 · 무역 화면 (v1.7.1 · 시나리오 0.3.2) =====
// 규칙은 js/ops-rules.js, 계산 시점(하루마다)과 행동 처리는 js/campaign.js(HemiCampaign.opsAct). 이 파일은 보여 주고 누르게만 한다.
// 국가 운영을 쓰는 시나리오(자원 · 시설 · 기술 · 부대 · 무역 중 하나라도 있음)에서만 탭이 보인다.
/* global switchSubTab, currentMainTab, currentSubTab, showKbdToast, showCustomAlert */
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-app-mode') === 'logo') return;
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
    tab.className = 'sub-tab-btn'; tab.id = 'subTabCampops'; tab.textContent = '운영'; tab.style.display = 'none';
    tab.setAttribute('onclick', "switchSubTab('campaign','campops')");
    bar.insertBefore(tab, document.getElementById('subTabCamparticles'));
    const box = document.createElement('div'); box.id = 'contentCampops'; box.className = 'sub-tab-content';
    host0.appendChild(box);
    let view = 'res';

    const res = (d, id) => O.byId(d, 'resources', id);
    const resLabel = (d, id) => { const r = res(d, id); return r ? `${r.icon ? r.icon + ' ' : ''}${r.name || id}` : id; };
    const amountText = (d, m, sign = '') => O.amounts(m).map(([k, v]) => `${resLabel(d, k)} ${sign}${r1(v)}`).join(' · ');
    const period = days => (C() && C().clock && C().clock.mode === 'turn' ? `${Math.max(0, Math.ceil(days - 1e-9))}턴` : `${Math.max(0, Math.ceil(days - 1e-9))}일`);
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
        if (!on) { box.innerHTML = '<div class="cp-empty">이 시나리오에는 국가 운영(자원 · 시설 · 기술 · 군사 · 무역)이 없습니다.</div>'; return; }
        const d = R.data, s = R.ops;
        const has = k => O.list(d, k).length > 0;
        const views = [['res', '자원 · 시설', has('resources') || has('facilities')], ['tech', '기술', has('tech')], ['mil', '군사', has('units')], ['trade', '무역', has('trades')]].filter(v => v[2]);
        if (!views.some(v => v[0] === view)) view = views[0][0];
        const seg = `<div class="cp-row cp-ops-seg" role="tablist">${views.map(([k, l]) => `<button type="button" class="cp-btn ${k === view ? 'cp-primary' : ''}" data-ops-view="${k}" role="tab" aria-selected="${k === view}">${l}</button>`).join('')}</div>`;
        const body = view === 'res' ? resHtml(d, s) : view === 'tech' ? techHtml(d, s) : view === 'mil' ? milHtml(d, s) : tradeHtml(d, s);
        const log = s.log.length ? `<details class="cp-card"><summary class="cp-h">최근 일 ${s.log.length}</summary>${s.log.slice().reverse().slice(0, 12).map(t => `<div class="cp-dim">${esc(t)}</div>`).join('')}</details>` : '';
        box.innerHTML = `<div class="cp-wrap cp-ops">${seg}${body}${log}</div>`;
        box.querySelectorAll('[data-ops-view]').forEach(b => { b.onclick = () => { view = b.dataset.opsView; render(); }; });
        box.querySelectorAll('[data-ops]').forEach(b => { b.onclick = () => { const [kind, id, a] = b.dataset.ops.split('|'); act(kind, id, a); }; });
    }
    function resHtml(d, s) {
        const fc = O.forecast(s, d);
        const rows = O.list(d, 'resources').map(r => { const v = n(s.stock[r.id]), f = fc[r.id] || 0; return `<tr><td>${esc(resLabel(d, r.id))}</td><td class="cp-num">${r1(v)}${r.unit ? ` <span class="cp-dim">${esc(r.unit)}</span>` : ''}${r.max != null ? ` <span class="cp-dim">/ ${n(r.max)}</span>` : ''}</td><td class="cp-num ${f > 0 ? 'cp-up' : f < 0 ? 'cp-down' : ''}">${f > 0 ? '+' : ''}${r1(f)}</td></tr>`; }).join('');
        const fac = O.list(d, 'facilities').map(f => {
            const cnt = Math.floor(n(s.facilities[f.id])), job = s.building.find(j => j.id === f.id), why = O.whyNot('facility', s, d, f.id, testCond), short = s.shortage.facilities.includes(f.id);
            return `<div class="cp-dec ${why && !job ? 'off' : ''}"><div class="cp-grow"><b>${esc(`${f.icon ? f.icon + ' ' : ''}${f.name || f.id}`)}</b> <span class="cp-dim">× ${cnt}${f.max != null ? ` / ${n(f.max)}` : ''}</span>${short ? ' <span class="cp-down">⚠ 투입 부족으로 멈춤</span>' : ''}
                ${f.desc ? `<div class="cp-dim">${esc(f.desc)}</div>` : ''}
                <div class="cp-dim">${[O.amounts(f.produce).length ? `생산 ${amountText(d, f.produce, '+')}/일` : '', O.amounts(f.consume).length ? `소비 ${amountText(d, f.consume, '-')}/일` : '', O.amounts(f.upkeep).length ? `유지 ${amountText(d, f.upkeep, '-')}/일` : ''].filter(Boolean).join(' · ') || '생산 · 소비 없음'}</div>
                <div class="cp-dim">${f.buildable === false ? '플레이어가 지을 수 없는 시설' : `건설: ${amountText(d, f.cost) || '비용 없음'} · ${period(n(f.days))}`}${(f.requires || []).length ? ` · 필요 기술: ${(f.requires || []).map(id => esc((O.byId(d, 'tech', id) || {}).title || id)).join(', ')}` : ''}</div>
                ${job ? `<div class="cp-bar"><i style="width:${pct(job)}%"></i></div><div class="cp-dim">건설 중 · ${period(left(job))} 남음</div>` : ''}</div>
                ${job ? `<button type="button" class="cp-btn" data-ops="facility|${esc(f.id)}|cancel">건설 취소</button>` : f.buildable === false ? '' : `<button type="button" class="cp-btn ${why ? '' : 'cp-primary'}" data-ops="facility|${esc(f.id)}|start" ${why ? 'disabled' : ''}>${esc(why || '건설')}</button>`}</div>`;
        }).join('');
        return `${rows ? `<div class="cp-card"><div class="cp-h">자원</div><table class="cp-table"><thead><tr><th>자원</th><th>재고</th><th>하루 변화(예상)</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}
            ${fac ? `<div class="cp-card"><div class="cp-h">시설</div><div class="cp-dim">하루마다 목록 순서대로 가동합니다. 투입 · 유지비를 다 낼 수 없는 시설은 그날 멈춥니다.</div>${fac}</div>` : ''}`;
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
            return `<button type="button" class="cp-tech cp-tech-${st} ${why ? 'cp-tech-wait' : ''}" style="left:${p.x}px;top:${p.y}px;width:${W}px;height:${H}px" ${st === 'available' && !why ? `data-ops="tech|${esc(t.id)}|start"` : ''} title="${esc([t.desc, amountText(d, t.cost) && `비용: ${amountText(d, t.cost)}`, `${period(n(t.days))}`, why].filter(Boolean).join('\n'))}">
                <span class="cp-tech-t">${esc(`${t.icon ? t.icon + ' ' : ''}${t.title || t.id}`)}</span><span class="cp-tech-s">${st === 'done' ? '✔ 완료' : st === 'current' ? `연구 중 · ${period(left(cur))}` : st === 'blocked' ? '다른 길' : st === 'locked' ? '선행 필요' : why ? esc(why) : `연구 · ${period(n(t.days))}`}</span></button>`;
        }).join('');
        return `<div class="cp-card"><div class="cp-h">연구</div>${curT ? `<div class="cp-focus-cur"><b>${esc(curT.title || curT.id)}</b><span class="cp-grow"></span><span class="cp-days">${period(left(cur))} 남음</span><button type="button" class="cp-btn" data-ops="tech|${esc(cur.id)}|cancel">연구 취소</button></div><div class="cp-bar"><i style="width:${pct(cur)}%"></i></div><div class="cp-dim">취소하면 낸 비용과 진행은 돌아오지 않습니다.</div>` : '<div class="cp-dim">진행 중인 연구가 없습니다. 아래 트리에서 고르세요.</div>'}
            <div class="cp-dim">끝낸 기술 ${Object.keys(s.tech.done).length} / ${list.length}</div></div>
            <div class="cp-tech-wrap"><div class="cp-tech-board" style="width:${wpx}px;height:${hpx}px"><svg class="cp-tech-svg" width="${wpx}" height="${hpx}" aria-hidden="true">${lines}</svg>${nodes}</div></div>`;
    }
    function milHtml(d, s) {
        const total = O.strength(s, d);
        const units = O.list(d, 'units').map(u => {
            const cnt = Math.floor(n(s.units[u.id])), job = s.recruiting.find(j => j.id === u.id), why = O.whyNot('unit', s, d, u.id, testCond), short = s.shortage.units.includes(u.id);
            return `<div class="cp-dec ${why && !job ? 'off' : ''}"><div class="cp-grow"><b>${esc(`${u.icon ? u.icon + ' ' : ''}${u.name || u.id}`)}</b> <span class="cp-dim">${esc(u.branch || '')} × ${cnt}${u.max != null ? ` / ${n(u.max)}` : ''} · 전력 ${r1(cnt * n(u.strength) * (short ? 0.5 : 1))}</span>${short ? ' <span class="cp-down">⚠ 보급 부족 — 전력 절반</span>' : ''}
                ${u.desc ? `<div class="cp-dim">${esc(u.desc)}</div>` : ''}
                <div class="cp-dim">편성: ${amountText(d, u.cost) || '비용 없음'} · ${period(n(u.days))}${O.amounts(u.upkeep).length ? ` · 유지 ${amountText(d, u.upkeep, '-')}/일` : ''}${(u.requires || []).length ? ` · 필요 기술: ${(u.requires || []).map(id => esc((O.byId(d, 'tech', id) || {}).title || id)).join(', ')}` : ''}</div>
                ${job ? `<div class="cp-bar"><i style="width:${pct(job)}%"></i></div><div class="cp-dim">편성 중 · ${period(left(job))} 남음</div>` : ''}</div>
                ${job ? `<button type="button" class="cp-btn" data-ops="unit|${esc(u.id)}|cancel">편성 취소</button>` : u.recruitable === false ? '' : `<button type="button" class="cp-btn ${why ? '' : 'cp-primary'}" data-ops="unit|${esc(u.id)}|start" ${why ? 'disabled' : ''}>${esc(why || '편성')}</button>`}</div>`;
        }).join('');
        return `<div class="cp-card"><div class="cp-h">군사력</div><div class="cp-big">전력 ${r1(total)}</div><div class="cp-dim">부대 수 × 부대 전력. 유지비를 못 낸 날은 그 부대의 전력이 절반입니다.</div></div><div class="cp-card"><div class="cp-h">부대</div>${units}</div>`;
    }
    function tradeHtml(d, s) {
        const names = new Map((d.world && Array.isArray(d.world.countries) ? d.world.countries : []).map(c => [c.key, c.name || c.key]));
        const row = t => {
            const st = s.trades[t.id], why = O.whyNot('trade', s, d, t.id, testCond), active = st && st.status === 'active';
            const left2 = active && st.ends != null ? Math.max(0, st.ends - n(s.day)) : null;
            const label = !st ? '' : { active: left2 != null ? `진행 중 · ${period(left2)} 남음` : '진행 중 · 기한 없음', done: '기간 만료', failed: '이행 실패', cancelled: '중단함' }[st.status] || st.status;
            return `<div class="cp-dec ${!active && why ? 'off' : ''}"><div class="cp-grow"><b>${esc(t.title || t.id)}</b> <span class="cp-dim">상대: ${esc(names.get(t.partner) || t.partner || '—')}</span>${label ? ` <span class="cp-dim">· ${esc(label)}</span>` : ''}
                ${t.desc ? `<div class="cp-dim">${esc(t.desc)}</div>` : ''}<div class="cp-dim">하루마다 내줌: ${amountText(d, t.give) || '없음'} → 받음: ${amountText(d, t.get) || '없음'}${n(t.days) > 0 ? ` · ${period(n(t.days))}` : ' · 기한 없음'}</div></div>
                ${active ? `<button type="button" class="cp-btn" data-ops="trade|${esc(t.id)}|cancel">계약 중단</button>` : `<button type="button" class="cp-btn ${why ? '' : 'cp-primary'}" data-ops="trade|${esc(t.id)}|start" ${why ? 'disabled' : ''}>${esc(why || '계약 체결')}</button>`}</div>`;
        };
        const visible = O.list(d, 'trades').filter(t => s.trades[t.id] || testCond(t.visible));
        return `<div class="cp-card"><div class="cp-h">무역 계약</div><div class="cp-dim">하루마다 내줄 것을 모두 낼 수 있을 때만 주고받습니다. 내줄 것이 모자라면 그날 계약이 이행 실패로 끝납니다. 상대국의 재고는 계산하지 않습니다.</div>${visible.map(row).join('') || '<div class="cp-dim">지금 맺을 수 있는 계약이 없습니다.</div>'}</div>`;
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
