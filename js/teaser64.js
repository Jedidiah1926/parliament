// ===== Hemicycle 티저 1.6.4 (teaser64.html 전용) — "How the mighty have fallen" 미리보기 =====
// teaser64.html = main.html + js/teaserpodium.js + js/teaser61.js · 62 · 63 (1.6.1 ~ 1.6.3) + 이 파일. 저장 공간은 따로 ('hemicycleTeaser64:')
//
//   - 의회 › 세력 변화: 정당 의석을 시점마다 기록하고, 오른쪽 시각 화면 "세력 변화" 탭에 정당 역사 도표로 그린다
//     (시간은 위 → 아래, 기록마다 의석 비율 띠, 기록 사이는 정당별로 흐르는 띠 — 아래로 스크롤). 왼쪽에는 기록 버튼 · 변화 표.
//     총선 결과를 의회에 반영할 때 자동으로 기록되고, "지금 기록하기"로 직접 남기거나 선거 기록에서 가져올 수 있다.
//   - 의회 › 위키 틀: 위키백과 의회 정보상자처럼 의석 배치 · 정당별 의석 · 집권 세력(정부 / 야당) · 지도부를 한눈에 보여 주는 틀,
//     위키 문법(Infobox legislature)으로 복사 · 반원 그림 저장
//   - 국가 › 국가 순위: 냉전 국가 순위 — 꾸밈용 (게임 기능에 영향 없음). 진영 · 점수 · 순위 변동을 직접 꾸민다.
/* global getAppState, setAppState, switchSubTab, parties, coalitions, chamberList, chamberDisplayName, seatKeyFor, chamberLeaders,
   president, pm, govType, nationFlag, chamberLogos, elecRecords, formatNationDate, escapeHtmlText, showCustomAlert, showCustomConfirm,
   effRoleLabel, dotCache, hasSenateChamber, hasThirdChamber */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') !== 'teaser' || root.getAttribute('data-teaser') !== '64') return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const uid = () => 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const nowDate = () => { try { return formatNationDate(); } catch (e) { return ''; } };
    const chName = ch => { try { return chamberDisplayName(ch); } catch (e) { return ch; } };
    const chambers = () => { try { return chamberList(); } catch (e) { return ['house']; } };
    const nationName = () => (document.getElementById('nationNameInput')?.value || '').trim();
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id) || String(id).startsWith(p.id + '__'))));
    const seatsOf = (p, ch) => Number(p[seatKeyFor(ch)]) || 0;

    // ---- 상태 (세이브의 teaser64 칸) ----
    //   timeline: [{ id, at, date, label, source, chamber, total, parties:[{id,name,color,seats}], ruling:[id] }]
    //   wiki: { place, founded, nextElection, system }
    //   ranking: { title, rows:[{ id, name, flag, bloc, score, prevRank, self }] }
    let S = fresh();
    function fresh() { return { timeline: [], wiki: { place: '', founded: '', nextElection: '', system: '' }, ranking: defaultRanking() }; }
    let ui = { tlChamber: 'house', wikiChamber: 'house' };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.teaser64 = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && state.teaser64;
        const base = fresh();
        S = { ...base, ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        if (!Array.isArray(S.timeline)) S.timeline = [];
        S.wiki = { ...base.wiki, ...(S.wiki || {}) };
        if (!S.ranking || !Array.isArray(S.ranking.rows)) S.ranking = base.ranking;
        refresh();
        return r;
    };

    // ================= 세력 변화 타임라인 =================
    function snapshot(ch, label, source, at) {
        const ps = parties.filter(p => seatsOf(p, ch) > 0);
        return {
            id: uid(), at: at || Date.now(), date: nowDate(), label: label || '', source, chamber: ch,
            total: ps.reduce((a, p) => a + seatsOf(p, ch), 0),
            parties: ps.map(p => ({ id: p.id, name: p.name, color: p.color, seats: seatsOf(p, ch) })),
            ruling: ps.filter(isGovParty).map(p => p.id),
        };
    }
    const sameSeats = (a, b) => a && b && a.parties.length === b.parties.length && a.parties.every(x => (b.parties.find(y => String(y.id) === String(x.id)) || {}).seats === x.seats);
    const lastOf = ch => S.timeline.filter(x => x.chamber === ch).sort((a, b) => a.at - b.at).pop();
    function record(label, source, onlyIfChanged) {
        let n = 0;
        chambers().forEach(ch => {
            const snap = snapshot(ch, label, source);
            if (!snap.total) return;
            if (onlyIfChanged && sameSeats(snap, lastOf(ch))) return;
            S.timeline.push(snap); n++;
        });
        return n;
    }
    // 총선 결과를 의회에 반영하면 자동으로 기록
    const origApply = window.elecApplyToParliament;
    if (typeof origApply === 'function') {
        window.elecApplyToParliament = function () {
            const r = origApply.apply(this, arguments);
            setTimeout(() => {
                const rec = (typeof elecRecords !== 'undefined' && elecRecords[0]) || null;
                const fresh = rec && Date.now() - new Date(rec.savedAt).getTime() < 60000;
                record(fresh ? `${rec.title}${rec.year && rec.year !== '?' ? ` (${rec.year})` : ''}` : '선거 반영', 'election', true);
                renderTimeline();
            }, 0);
            return r;
        };
    }
    // 선거 기록(총선)에서 가져오기 — 이미 가져온 기록은 건너뜀
    function importRecords() {
        const recs = (typeof elecRecords !== 'undefined' ? elecRecords : []).filter(r => r && Array.isArray(r.parties) && r.chamberType);
        let n = 0;
        recs.slice().reverse().forEach(r => {
            const key = 'rec:' + r.id;
            if (S.timeline.some(x => x.source === key)) return;
            const ps = r.parties.filter(p => (p.seats || 0) > 0);
            if (!ps.length) return;
            S.timeline.push({
                id: uid(), at: new Date(r.savedAt).getTime() || Date.now(), date: r.year && r.year !== '?' ? String(r.year) : '', label: r.title || '선거',
                source: key, chamber: r.chamberType, total: ps.reduce((a, p) => a + p.seats, 0),
                parties: ps.map(p => ({ id: p.id, name: p.name, color: p.color, seats: p.seats })), ruling: [],
            });
            n++;
        });
        return n;
    }

    // ---- 정당 역사 도표 (오른쪽 시각 화면, 아래로 흐름) ----
    // 기록 하나가 가로 띠 하나(폭 = 의석 비율), 시간은 위에서 아래로. 이웃한 기록 사이는 정당마다 흐르는 띠로 이어
    // 정당이 생기고 · 커지고 · 줄고 · 사라지는 모습을 보여 준다. 집권 세력은 금색 테두리, 가운데 점선은 과반.
    function partyOrder(snaps) {
        const ids = [];
        const idx = id => { const k = parties.findIndex(p => String(p.id) === String(id)); return k < 0 ? 1e6 : k; };
        snaps.forEach(s => s.parties.forEach(p => { if (!ids.some(x => String(x) === String(p.id))) ids.push(p.id); }));
        const first = id => snaps.findIndex(s => s.parties.some(p => String(p.id) === String(id)));
        return ids.sort((a, b) => (idx(a) - idx(b)) || (first(a) - first(b)));
    }
    function historyChart(snaps, width) {
        const W = Math.max(320, Math.round(width || 600));
        const LW = Math.min(132, Math.round(W * 0.26)), X0 = LW + 10, X1 = W - 10, CW = X1 - X0;
        const BAR = 26, FLOW = 52, TOP = 8;
        const ids = partyOrder(snaps);
        const info = id => { for (let i = snaps.length - 1; i >= 0; i--) { const p = snaps[i].parties.find(x => String(x.id) === String(id)); if (p) return p; } return { name: '?', color: '#888' }; };
        const seat = (s, id) => (s.parties.find(x => String(x.id) === String(id)) || {}).seats || 0;
        // 기록마다 정당별 [시작 x, 끝 x] — 의석이 0인 정당도 제자리에 폭 0으로 두어 흐름이 자연스럽게 생기고 사라진다
        const spans = snaps.map(s => {
            let x = X0; const m = {};
            ids.forEach(id => { const w = s.total ? seat(s, id) / s.total * CW : 0; m[id] = [x, x + w]; x += w; });
            return m;
        });
        const yOf = i => TOP + i * (BAR + FLOW);
        const H = yOf(snaps.length - 1) + BAR + 14;
        let flows = '', bars = '', labels = '';
        for (let i = 0; i < snaps.length - 1; i++) {
            const yb = yOf(i) + BAR, yt = yOf(i + 1), ym = (yb + yt) / 2;
            ids.forEach(id => {
                const [a0, a1] = spans[i][id], [c0, c1] = spans[i + 1][id];
                if (a1 - a0 < 0.2 && c1 - c0 < 0.2) return;
                const p = info(id);
                flows += `<path d="M${a0},${yb} L${a1},${yb} C${a1},${ym} ${c1},${ym} ${c1},${yt} L${c0},${yt} C${c0},${ym} ${a0},${ym} ${a0},${yb} Z" fill="${esc(p.color)}" fill-opacity=".42"><title>${esc(`${p.name}: ${seat(snaps[i], id)} → ${seat(snaps[i + 1], id)}석`)}</title></path>`;
            });
        }
        snaps.forEach((s, i) => {
            const y = yOf(i);
            const ruling = new Set((s.ruling || []).map(String));
            ids.forEach(id => {
                const [x0, x1] = spans[i][id], w = x1 - x0, n = seat(s, id);
                if (n <= 0) return;
                const p = info(id);
                const gov = ruling.has(String(id));
                bars += `<rect x="${x0}" y="${y}" width="${w}" height="${BAR}" fill="${esc(p.color)}"${gov ? ' class="t64-h-gov"' : ''}><title>${esc(`${p.name} ${n}석 (${Math.round(n / s.total * 100)}%)${gov ? ' · 집권' : ''} — ${s.label || s.date}`)}</title></rect>`;
                const txt = w > 88 ? `${p.name} ${n}` : w > 26 ? String(n) : '';
                if (txt) bars += `<text x="${x0 + w / 2}" y="${y + BAR / 2 + 4}" class="t64-h-seg" text-anchor="middle">${esc(txt.length * 7 > w ? String(n) : txt)}</text>`;
            });
            const govNames = s.parties.filter(p => ruling.has(String(p.id))).map(p => p.name);
            labels += `<text x="${LW}" y="${y + 11}" class="t64-h-lab" text-anchor="end">${esc((s.label || s.date || `#${i + 1}`).slice(0, 16))}</text>`;
            labels += `<text x="${LW}" y="${y + 24}" class="t64-h-sub" text-anchor="end">${esc([s.label ? s.date : '', `${s.total}석`].filter(Boolean).join(' · ').slice(0, 22))}</text>`;
            if (govNames.length) labels += `<text x="${LW}" y="${y + BAR + 11}" class="t64-h-gov-lab" text-anchor="end">★ ${esc(govNames.join('·').slice(0, 18))}</text>`;
        });
        const half = `<line x1="${X0 + CW / 2}" x2="${X0 + CW / 2}" y1="0" y2="${H}" class="t64-h-half"/>`;
        const legend = ids.map(id => { const p = info(id); return `<span>${dotHtml(p.color)}${esc(p.name)}</span>`; }).join('');
        return `<div class="t64-legend t64-h-legend">${legend}<span class="t64-dim">★ 집권 · ┆ 과반</span></div>
            <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="t64-hist" role="img" aria-label="정당 역사 도표">${flows}${half}${bars}${labels}</svg>`;
    }
    function renderHistory() {
        const wrap = document.getElementById('t64HistWrap');
        if (!wrap) return;
        const chs = chambers();
        if (!chs.includes(ui.tlChamber)) ui.tlChamber = chs[0];
        const snaps = S.timeline.filter(x => x.chamber === ui.tlChamber).sort((a, b) => a.at - b.at);
        const title = document.getElementById('t64HistTitle');
        if (title) title.textContent = `${chName(ui.tlChamber)} 세력 변화`;
        const panel = document.getElementById('dispPanelTimeline');
        const width = (wrap.clientWidth || (panel && panel.clientWidth) || 600) - 4;
        wrap.innerHTML = `${chs.length > 1 ? `<div class="t64-seg t64-h-chs">${chs.map(c => `<button type="button" class="${ui.tlChamber === c ? 'on' : ''}" data-hch="${c}">${esc(chName(c))}</button>`).join('')}</div>` : ''}
            ${snaps.length ? historyChart(snaps, width) : '<div class="t64-empty"><div class="t64-empty-icon">📈</div>아직 기록이 없습니다.<br>왼쪽 의회 › 세력 변화에서 "지금 의석 기록하기"를 누르거나, 총선을 치러 의회에 반영하면 여기에 아래로 쌓여요.</div>'}`;
        wrap.querySelectorAll('[data-hch]').forEach(b => { b.onclick = () => { ui.tlChamber = b.dataset.hch; renderTimeline(); }; });
    }
    function showHistoryTab() {
        const btn = document.getElementById('dispTabTimeline');
        if (btn) btn.style.display = '';
        try { switchDispTab('timeline'); } catch (e) { /* 시각 화면 없음 */ }
        setTimeout(renderHistory, 60);
    }
    const dotHtml = c => `<i class="t64-dot" style="background:${esc(c)}"></i>`;
    function changeTable(snaps) {
        const show = snaps.slice(-8);
        const ids = [];
        show.forEach(s => s.parties.forEach(p => { if (!ids.some(x => String(x) === String(p.id))) ids.push(p.id); }));
        const seat = (s, id) => (s.parties.find(x => String(x.id) === String(id)) || {}).seats || 0;
        const info = id => { for (let i = show.length - 1; i >= 0; i--) { const p = show[i].parties.find(x => String(x.id) === String(id)); if (p) return p; } return { name: '?', color: '#888' }; };
        ids.sort((a, b) => seat(show[show.length - 1], b) - seat(show[show.length - 1], a));
        return `<div class="t64-tablewrap"><table class="t64-table"><thead><tr><th>정당</th>${show.map(s => `<th title="${esc(s.date)}">${esc((s.label || s.date || '').slice(0, 10))}</th>`).join('')}</tr></thead>
            <tbody>${ids.map(id => { const p = info(id); return `<tr><td>${dotHtml(p.color)}${esc(p.name)}</td>${show.map((s, i) => {
                const v = seat(s, id), prev = i ? seat(show[i - 1], id) : null, d = prev == null ? 0 : v - prev;
                const gov = (s.ruling || []).some(x => String(x) === String(id));
                return `<td class="${gov ? 't64-gov' : ''}">${v || '—'}${d ? `<small class="${d > 0 ? 't64-up' : 't64-down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</small>` : ''}</td>`;
            }).join('')}</tr>`; }).join('')}</tbody></table></div>
            <div class="t64-dim t64-small">굵은 칸은 그 시점의 집권 세력 · ▲▼는 바로 앞 기록과의 차이 (최근 8개)</div>`;
    }

    function renderTimeline() {
        const box = document.getElementById('contentTimeline');
        if (!box) return;
        const chs = chambers();
        if (!chs.includes(ui.tlChamber)) ui.tlChamber = chs[0];
        const snaps = S.timeline.filter(x => x.chamber === ui.tlChamber).sort((a, b) => a.at - b.at);
        const recCount = (typeof elecRecords !== 'undefined' ? elecRecords : []).filter(r => r && r.chamberType && !S.timeline.some(x => x.source === 'rec:' + r.id)).length;
        box.innerHTML = `<div class="t64-intro">정당 의석을 시점마다 기록해 세력이 어떻게 오르내렸는지 봅니다. 총선 결과를 의회에 반영하면 자동으로 기록돼요.</div>
            ${chs.length > 1 ? `<div class="system-radio-group t64-tabs">${chs.map(c => `<button type="button" class="system-radio-btn ${ui.tlChamber === c ? 'active' : ''}" data-tlch="${c}">${esc(chName(c))}</button>`).join('')}</div>` : ''}
            <div class="t64-actions">
                <button type="button" class="t64-btn primary" data-act="snap">📸 지금 의석 기록하기</button>
                <button type="button" class="t64-btn" data-act="import" ${recCount ? '' : 'disabled'}>선거 기록에서 가져오기${recCount ? ` (${recCount})` : ''}</button>
            </div>
            ${snaps.length ? `<div class="t64-card t64-histnote"><span>📊 정당 역사 도표는 오른쪽 시각 화면 "세력 변화" 탭에 아래로 흐르며 그려져요.</span><button type="button" class="t64-btn" data-act="showhist">오른쪽에서 보기</button></div>
            <div class="t64-card">${changeTable(snaps)}</div>
            <details class="t64-fold"><summary>기록 ${snaps.length}개 — 이름 바꾸기 · 지우기</summary>
                ${snaps.slice().reverse().map(s => `<div class="t64-snap"><input type="text" value="${esc(s.label)}" placeholder="${esc(s.date || '이름 없음')}" data-label="${s.id}"><span class="t64-dim">${esc(s.date)} · ${s.total}석${s.source === 'election' ? ' · 선거' : String(s.source).startsWith('rec:') ? ' · 선거 기록' : ''}</span><button type="button" class="t64-x" data-del="${s.id}" title="지우기">×</button></div>`).join('')}
            </details>` : `<div class="t64-empty"><div class="t64-empty-icon">📈</div>아직 기록이 없습니다.<br>"지금 의석 기록하기"를 누르거나, 총선을 치러 의회에 반영하면 쌓여요.</div>`}`;
        box.querySelectorAll('[data-tlch]').forEach(b => { b.onclick = () => { ui.tlChamber = b.dataset.tlch; renderTimeline(); }; });
        const sh = box.querySelector('[data-act="showhist"]'); if (sh) sh.onclick = showHistoryTab;
        box.querySelector('[data-act="snap"]').onclick = () => {
            const n = record('', 'manual', false);
            if (!n) showCustomAlert('기록할 의석이 없습니다.');
            renderTimeline();
        };
        const imp = box.querySelector('[data-act="import"]');
        if (imp) imp.onclick = () => { const n = importRecords(); showCustomAlert(n ? `선거 기록 ${n}개를 가져왔습니다.` : '가져올 선거 기록이 없습니다.'); renderTimeline(); };
        box.querySelectorAll('[data-label]').forEach(i => { i.onchange = () => { const s = S.timeline.find(x => x.id === i.dataset.label); if (s) s.label = i.value.trim(); renderTimeline(); }; });
        box.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => { S.timeline = S.timeline.filter(x => x.id !== b.dataset.del); renderTimeline(); }; });
        renderHistory();
    }

    // ================= 위키식 의회 틀 =================
    function hemicycleImage(ch, size = 240) {
        const dots = (typeof dotCache !== 'undefined' && dotCache[ch]) || [];
        const real = dots.filter(d => d.partyName !== 'Vacant' || true);
        if (!real.length) return '';
        const xs = real.map(d => d.x), ys = real.map(d => d.y), r = real[0].r;
        const minX = Math.min(...xs) - r, maxX = Math.max(...xs) + r, minY = Math.min(...ys) - r, maxY = Math.max(...ys) + r;
        const k = size / (maxX - minX);
        const c = document.createElement('canvas');
        const dpr = 2;
        c.width = size * dpr; c.height = Math.ceil((maxY - minY) * k * dpr);
        const ctx = c.getContext('2d');
        ctx.scale(dpr, dpr);
        real.forEach(d => { ctx.beginPath(); ctx.arc((d.x - minX) * k, (d.y - minY) * k, Math.max(0.6, r * k * 0.92), 0, Math.PI * 2); ctx.fillStyle = d.partyName === 'Vacant' ? '#d0d0d0' : d.color; ctx.fill(); });
        try { return c.toDataURL('image/png'); } catch (e) { return ''; }
    }
    function wikiData(ch) {
        const ps = parties.filter(p => seatsOf(p, ch) > 0 && p.status !== 'dissolved').sort((a, b) => seatsOf(b, ch) - seatsOf(a, ch));
        const gov = ps.filter(isGovParty), opp = ps.filter(p => !isGovParty(p));
        const total = ps.reduce((a, p) => a + seatsOf(p, ch), 0);
        const lead = (typeof chamberLeaders !== 'undefined' && chamberLeaders[ch]) || { speaker: {}, deputies: [] };
        const recs = (typeof elecRecords !== 'undefined' ? elecRecords : []).filter(r => r.chamberType === ch);
        const last = recs[0];
        const chs = chambers();
        const term = (document.getElementById('nationSessionTerm')?.value || '').trim();
        const nm = nationName();
        const execs = [];
        try {
            if (president && president.name && govType !== 'parliamentary') execs.push([effRoleLabel('president'), president.name]);
            if (pm && pm.name && govType !== 'presidential') execs.push([effRoleLabel('pm'), pm.name]);
        } catch (e) { /* 내각 없음 */ }
        return {
            ch, title: `${nm ? nm + ' ' : ''}${chName(ch)}`, term: term ? `제${term}대` : '', gov, opp, total,
            type: chs.length === 1 ? '단원제' : chs.length === 2 ? '양원제' : '삼원제', houses: chs.map(chName),
            speaker: lead.speaker && lead.speaker.name, deputies: (lead.deputies || []).map(d => d && d.name).filter(Boolean),
            execs, last: last ? `${last.title}${last.year && last.year !== '?' ? ` (${last.year})` : ''}` : '', logo: (typeof chamberLogos !== 'undefined' && chamberLogos[ch]) || (typeof nationFlag !== 'undefined' && nationFlag) || '',
        };
    }
    function infoboxHtml(d) {
        const sum = arr => arr.reduce((a, p) => a + seatsOf(p, d.ch), 0);
        const group = (label, arr) => arr.length ? `<div class="wbx-group"><b>${label} (${sum(arr)})</b>${arr.map(p => `<div class="wbx-party"><i style="background:${esc(p.color)}"></i>${esc(p.name)}: ${seatsOf(p, d.ch)}석</div>`).join('')}</div>` : '';
        const row = (k, v) => (v ? `<tr><th>${k}</th><td>${v}</td></tr>` : '');
        const img = hemicycleImage(d.ch);
        return `<div class="wbx">
            <div class="wbx-title">${esc(d.title)}</div>
            ${d.term ? `<div class="wbx-sub">${esc(d.term)} ${esc(chName(d.ch))}</div>` : ''}
            ${d.logo ? `<div class="wbx-logo"><img src="${esc(d.logo)}" alt=""></div>` : ''}
            <table>
                <tr><td colspan="2" class="wbx-band">개요</td></tr>
                ${row('유형', esc(d.type))}
                ${d.houses.length > 1 ? row('구성', esc(d.houses.join(' · '))) : ''}
                ${row('설립', esc(S.wiki.founded))}
                <tr><td colspan="2" class="wbx-band">지도부</td></tr>
                ${row('의장', esc(d.speaker || '—'))}
                ${d.deputies.length ? row('부의장', esc(d.deputies.join(', '))) : ''}
                ${d.execs.map(([k, v]) => row(esc(k), esc(v))).join('')}
                <tr><td colspan="2" class="wbx-band">구조</td></tr>
                ${row('의석', `${d.total}석`)}
                ${img ? `<tr><td colspan="2" class="wbx-img"><img src="${img}" alt="의석 배치"></td></tr>` : ''}
                <tr><td colspan="2" class="wbx-groups">${group('정부', d.gov)}${group('야당', d.opp)}</td></tr>
                <tr><td colspan="2" class="wbx-band">선거</td></tr>
                ${row('선거 제도', esc(S.wiki.system))}
                ${row('최근 선거', esc(d.last || '—'))}
                ${row('다음 선거', esc(S.wiki.nextElection))}
                ${S.wiki.place ? `<tr><td colspan="2" class="wbx-band">회의장</td></tr><tr><td colspan="2" class="wbx-center">${esc(S.wiki.place)}</td></tr>` : ''}
            </table>
        </div>`;
    }
    function wikiMarkup(d) {
        const sum = arr => arr.reduce((a, p) => a + seatsOf(p, d.ch), 0);
        const legend = arr => arr.map(p => `* {{legend|${p.color}|${p.name}: ${seatsOf(p, d.ch)}석}}`).join('\n');
        const lines = ['{{Infobox legislature', `| name = ${d.title}`, `| legislature = ${d.term}`, `| house_type = ${d.type}`];
        if (d.houses.length > 1) lines.push(`| houses = ${d.houses.join(', ')}`);
        if (S.wiki.founded) lines.push(`| established = ${S.wiki.founded}`);
        lines.push('| leader1_type = 의장', `| leader1 = ${d.speaker || ''}`);
        d.execs.forEach(([k, v], i) => lines.push(`| leader${i + 2}_type = ${k}`, `| leader${i + 2} = ${v}`));
        lines.push(`| members = ${d.total}`, '| structure1 = ', '| structure1_res = 250px');
        let groups = '';
        if (d.gov.length) groups += `'''정부 (${sum(d.gov)})'''\n${legend(d.gov)}\n`;
        if (d.opp.length) groups += `'''야당 (${sum(d.opp)})'''\n${legend(d.opp)}`;
        lines.push(`| political_groups1 = ${groups.trim()}`);
        if (S.wiki.system) lines.push(`| voting_system1 = ${S.wiki.system}`);
        if (d.last) lines.push(`| last_election1 = ${d.last}`);
        if (S.wiki.nextElection) lines.push(`| next_election1 = ${S.wiki.nextElection}`);
        if (S.wiki.place) lines.push(`| meeting_place = ${S.wiki.place}`);
        lines.push('}}');
        return lines.join('\n');
    }
    function renderWikibox() {
        const box = document.getElementById('contentWikibox');
        if (!box) return;
        const chs = chambers();
        if (!chs.includes(ui.wikiChamber)) ui.wikiChamber = chs[0];
        const d = wikiData(ui.wikiChamber);
        box.innerHTML = `<div class="t64-intro">위키백과 의회 정보상자처럼 의석 배치 · 정당별 의석 · 집권 세력을 한 장에 모읍니다. 정당 · 연정 · 의장단 · 선거 기록에서 자동으로 채워져요.</div>
            ${chs.length > 1 ? `<div class="system-radio-group t64-tabs">${chs.map(c => `<button type="button" class="system-radio-btn ${ui.wikiChamber === c ? 'active' : ''}" data-wch="${c}">${esc(chName(c))}</button>`).join('')}</div>` : ''}
            <div class="t64-wikiwrap">${infoboxHtml(d)}</div>
            <div class="t64-actions">
                <button type="button" class="t64-btn primary" data-act="copy">📋 위키 문법 복사</button>
                <button type="button" class="t64-btn" data-act="img">🖼 반원 그림 저장</button>
            </div>
            <details class="t64-fold"><summary>틀에 넣을 정보 (직접 입력)</summary>
                <div class="t64-field"><span>설립</span><input type="text" data-w="founded" value="${esc(S.wiki.founded)}" placeholder="예: 1948년 5월 31일"></div>
                <div class="t64-field"><span>선거 제도</span><input type="text" data-w="system" value="${esc(S.wiki.system)}" placeholder="예: 혼합형 비례대표제"></div>
                <div class="t64-field"><span>다음 선거</span><input type="text" data-w="nextElection" value="${esc(S.wiki.nextElection)}" placeholder="예: 2030년 4월"></div>
                <div class="t64-field"><span>회의장</span><input type="text" data-w="place" value="${esc(S.wiki.place)}" placeholder="예: 국회의사당 본회의장"></div>
            </details>
            <details class="t64-fold"><summary>위키 문법 보기</summary><textarea class="t64-markup" readonly>${esc(wikiMarkup(d))}</textarea></details>`;
        box.querySelectorAll('[data-wch]').forEach(b => { b.onclick = () => { ui.wikiChamber = b.dataset.wch; renderWikibox(); }; });
        box.querySelectorAll('[data-w]').forEach(i => { i.onchange = () => { S.wiki[i.dataset.w] = i.value.trim(); renderWikibox(); }; });
        box.querySelector('[data-act="copy"]').onclick = async () => {
            const text = wikiMarkup(d);
            try { await navigator.clipboard.writeText(text); showCustomAlert('위키 문법을 복사했습니다.'); }
            catch (e) { const ta = box.querySelector('.t64-markup'); if (ta) { ta.closest('details').open = true; ta.select(); } showCustomAlert('복사하지 못했습니다 — "위키 문법 보기"에서 직접 복사하세요.'); }
        };
        box.querySelector('[data-act="img"]').onclick = () => {
            const url = hemicycleImage(ui.wikiChamber, 600);
            if (!url) { showCustomAlert('반원 그림을 만들 수 없습니다.'); return; }
            const a = document.createElement('a');
            a.href = url; a.download = `${(d.title || 'hemicycle').replace(/[\\/:*?"<>|]/g, '_')}.png`;
            document.body.appendChild(a); a.click(); a.remove();
        };
    }

    // ================= 냉전 국가 순위 (꾸밈용) =================
    const BLOCS = [['west', '서방 진영', '#3b82f6'], ['east', '동구권', '#dc2626'], ['nonaligned', '비동맹', '#a3a3a3'], ['other', '기타', '#a16207']];
    const blocOf = k => BLOCS.find(b => b[0] === k) || BLOCS[3];
    function defaultRanking() {
        const rows = [
            ['미합중국', '🇺🇸', 'west', 100], ['소비에트 연방', '☭', 'east', 96], ['서독', '🇩🇪', 'west', 74], ['일본', '🇯🇵', 'west', 72], ['영국', '🇬🇧', 'west', 70],
            ['프랑스', '🇫🇷', 'west', 68], ['중화인민공화국', '🇨🇳', 'east', 62], ['동독', '⚒', 'east', 52], ['인도', '🇮🇳', 'nonaligned', 46], ['유고슬라비아', '★', 'nonaligned', 40],
        ].map(([name, flag, bloc, score]) => ({ id: uid(), name, flag, bloc, score, prevRank: null, self: false }));
        rows.push({ id: uid(), name: '', flag: '', bloc: 'west', score: 50, prevRank: null, self: true });
        return { title: '냉전 국가 순위', rows };
    }
    const rowName = r => (r.self ? (nationName() || '우리나라') : r.name);
    const ranked = () => S.ranking.rows.slice().sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    function flagHtml(r) {
        if (r.self && typeof nationFlag !== 'undefined' && nationFlag) return `<img class="t64-rk-flagimg" src="${esc(nationFlag)}" alt="">`;
        return `<span class="t64-rk-flag">${esc(r.flag || '🏳')}</span>`;
    }
    function renderRanking() {
        const box = document.getElementById('contentRanking');
        if (!box) return;
        const list = ranked();
        const counts = BLOCS.map(b => [b, S.ranking.rows.filter(r => r.bloc === b[0]).length]);
        box.innerHTML = `<div class="t64-intro">꾸밈용 화면입니다 — 게임 기능에는 영향이 없어요. 국가 · 진영 · 점수를 마음대로 꾸며 보세요.</div>
            <div class="t64-rk">
                <div class="t64-rk-title">${esc(S.ranking.title || '냉전 국가 순위')}</div>
                <div class="t64-rk-blocs">${counts.map(([b, n]) => (n ? `<span><i style="background:${b[2]}"></i>${b[1]} ${n}</span>` : '')).join('')}</div>
                ${list.map((r, i) => {
                    const rank = i + 1, b = blocOf(r.bloc);
                    const mv = r.prevRank ? r.prevRank - rank : 0;
                    return `<div class="t64-rk-row${r.self ? ' self' : ''}" style="--bloc:${b[2]}" title="${esc(b[1])}">
                        <span class="t64-rk-no">${rank}</span>${flagHtml(r)}
                        <span class="t64-rk-name">${esc(rowName(r))}${r.self ? ' <em>우리나라</em>' : ''}</span>
                        <span class="t64-rk-bar"><span style="width:${Math.max(2, Math.min(100, Number(r.score) || 0))}%"></span></span>
                        <span class="t64-rk-score">${Number(r.score) || 0}</span>
                        <span class="t64-rk-mv ${mv > 0 ? 'up' : mv < 0 ? 'down' : ''}">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : r.prevRank ? '–' : ''}</span>
                    </div>`;
                }).join('')}
            </div>
            <div class="t64-actions">
                <button type="button" class="t64-btn primary" data-act="addrow">+ 국가 추가</button>
                <button type="button" class="t64-btn" data-act="mark" title="지금 순위를 기준으로 저장 — 점수를 바꾸면 ▲▼로 변동이 보여요">순위 기준 저장</button>
                <button type="button" class="t64-btn" data-act="reset">처음 목록으로</button>
            </div>
            <details class="t64-fold" open><summary>편집</summary>
                <div class="t64-field"><span>제목</span><input type="text" data-rt="title" value="${esc(S.ranking.title)}"></div>
                ${list.map(r => `<div class="t64-rk-edit">
                    <input type="text" class="t64-rk-e-flag" data-rf="flag" data-id="${r.id}" value="${esc(r.flag)}" ${r.self ? 'disabled placeholder="국기"' : 'placeholder="🏳"'} maxlength="8">
                    <input type="text" class="t64-rk-e-name" data-rf="name" data-id="${r.id}" value="${esc(r.self ? rowName(r) : r.name)}" ${r.self ? 'disabled title="국가 › 상징의 국가명"' : ''}>
                    <select data-rf="bloc" data-id="${r.id}">${BLOCS.map(b => `<option value="${b[0]}" ${r.bloc === b[0] ? 'selected' : ''}>${b[1]}</option>`).join('')}</select>
                    <input type="number" class="t64-rk-e-score" data-rf="score" data-id="${r.id}" value="${Number(r.score) || 0}" min="0" max="100">
                    ${r.self ? '<span class="t64-x-ph"></span>' : `<button type="button" class="t64-x" data-rdel="${r.id}" title="지우기">×</button>`}
                </div>`).join('')}
            </details>`;
        const at = id => S.ranking.rows.find(x => x.id === id);
        box.querySelectorAll('[data-rf]').forEach(i => {
            i.onchange = () => { const r = at(i.dataset.id); if (!r) return; r[i.dataset.rf] = i.dataset.rf === 'score' ? Math.max(0, Math.min(999, Number(i.value) || 0)) : i.value.trim(); renderRanking(); };
        });
        box.querySelector('[data-rt="title"]').onchange = e => { S.ranking.title = e.target.value.trim(); renderRanking(); };
        box.querySelectorAll('[data-rdel]').forEach(b => { b.onclick = () => { S.ranking.rows = S.ranking.rows.filter(x => x.id !== b.dataset.rdel); renderRanking(); }; });
        box.querySelector('[data-act="addrow"]').onclick = () => { S.ranking.rows.push({ id: uid(), name: '새 국가', flag: '🏳', bloc: 'other', score: 30, prevRank: null, self: false }); renderRanking(); };
        box.querySelector('[data-act="mark"]').onclick = () => { ranked().forEach((r, i) => { r.prevRank = i + 1; }); renderRanking(); };
        box.querySelector('[data-act="reset"]').onclick = () => showCustomConfirm('국가 순위를 처음 목록으로 되돌릴까요?', () => { S.ranking = defaultRanking(); renderRanking(); });
    }

    // ================= 탭 =================
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    function addTab(mainId, afterId, main, sub, id, label) {
        const host = document.getElementById(mainId);
        const bar = host && host.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const btn = el(`<button class="sub-tab-btn" onclick="switchSubTab('${main}','${sub}')" id="subTab${id}">${label}</button>`);
        const after = afterId && document.getElementById(afterId);
        if (after && after.nextSibling) bar.insertBefore(btn, after.nextSibling); else bar.appendChild(btn);
        host.appendChild(el(`<div id="content${id}" class="sub-tab-content"></div>`));
    }
    addTab('mainContentSetup', 'subTabList', 'setup', 'timeline', 'Timeline', '세력 변화');
    // 오른쪽 시각 화면 탭 "세력 변화" — 정당 역사 도표 (아래로 스크롤)
    (function addDispTab() {
        const after = document.getElementById('dispTabRegion') || document.getElementById('dispTabCabinet');
        if (!after) return;
        const btn = el(`<button class="disp-tab-btn" id="dispTabTimeline" data-tab="timeline" onclick="switchDispTab('timeline')" style="display:none;"><span class="disp-tab-label">세력 변화</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('timeline')">×</span></button>`);
        after.parentElement.insertBefore(btn, after.nextSibling);
        const ref = document.getElementById('dispPanelRegion') || document.getElementById('dispPanelCabinet');
        if (!ref) return;
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelTimeline"><div class="chamber-box t64-hist-box">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><h3 style="margin:0;border:none;padding:0;"><span class="tno-prompt">&gt; </span><span id="t64HistTitle">세력 변화</span></h3></div>
            <div id="t64HistWrap"></div></div></div>`), ref.nextSibling);
    })();
    addTab('mainContentSetup', 'subTabTimeline', 'setup', 'wikibox', 'Wikibox', '위키 틀');
    addTab('mainContentNation', 'subTabNationSettings', 'nation', 'ranking', 'Ranking', '국가 순위');
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'setup' && sub === 'timeline') { renderTimeline(); showHistoryTab(); }
        if (main === 'setup' && sub === 'wikibox') renderWikibox();
        if (main === 'nation' && sub === 'ranking') renderRanking();
        return r;
    };
    const origDisp = window.switchDispTab;
    window.switchDispTab = function (tab) {
        const r = origDisp.apply(this, arguments);
        if (tab === 'timeline') setTimeout(renderHistory, 30);
        return r;
    };
    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (document.getElementById('dispPanelTimeline')?.classList.contains('active')) renderHistory(); }, 150); });
    function refresh() { renderTimeline(); renderWikibox(); renderRanking(); }
    window.T64 = { get timeline() { return S.timeline; }, record: (label) => { const n = record(label || '', 'manual', false); renderTimeline(); return n; } };

    const style = document.createElement('style');
    style.textContent = `
        #contentTimeline, #contentWikibox, #contentRanking { --t64-line: #333; --t64-soft: rgba(255,255,255,.03); --t64-dim: #888; --t64-text: #ddd; --t64-acc: var(--tno-neon); }
        html[data-theme-family="modern"] #contentTimeline, html[data-theme-family="modern"] #contentWikibox, html[data-theme-family="modern"] #contentRanking { --t64-line: var(--m-border); --t64-soft: var(--m-surface-2); --t64-dim: var(--m-text-3); --t64-text: var(--m-text); --t64-acc: var(--m-accent); }
        .t64-intro { color: var(--t64-dim); font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .t64-dim { color: var(--t64-dim); font-size: .8rem; } .t64-small { font-size: .72rem; margin-top: 6px; }
        .t64-tabs { margin-bottom: 10px; }
        .t64-actions { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }
        .t64-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 8px 12px; background: transparent; border: 1px solid var(--t64-line); color: var(--t64-text); }
        .t64-btn.primary { border-color: var(--t64-acc); color: var(--t64-acc); }
        .t64-btn:disabled { opacity: .4; cursor: default; }
        .t64-card { border: 1px solid var(--t64-line); padding: 10px; margin-bottom: 10px; background: var(--t64-soft); }
        .t64-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; color: var(--t64-text); font-size: .9rem; }
        .t64-card-head b { font-weight: normal; }
        .t64-seg { display: inline-flex; border: 1px solid var(--t64-line); }
        .t64-seg button { cursor: pointer; font-family: inherit; font-size: .75rem; padding: 3px 10px; background: transparent; border: none; color: var(--t64-dim); }
        .t64-seg button.on { background: var(--t64-acc); color: #000; }
        .t64-chart { width: 100%; height: auto; display: block; }
        .t64-ax { font-size: 10px; fill: var(--t64-dim); } .t64-ax-dim { opacity: .7; }
        .t64-half { stroke: var(--t64-text); stroke-dasharray: 3 3; opacity: .5; }
        .t64-histnote { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: .82rem; color: var(--t64-text); }
        #dispPanelTimeline { --t64-line: #333; --t64-dim: #888; --t64-text: #ddd; --t64-acc: var(--tno-neon); }
        html[data-theme-family="modern"] #dispPanelTimeline { --t64-line: var(--m-border); --t64-dim: var(--m-text-3); --t64-text: var(--m-text); --t64-acc: var(--m-accent); }
        .t64-hist { display: block; }
        .t64-h-legend { margin: 0 0 10px; position: sticky; top: 0; background: inherit; z-index: 1; padding: 4px 0; }
        .t64-h-chs { margin-bottom: 8px; }
        .t64-h-seg { font-size: 11px; fill: #fff; paint-order: stroke; stroke: rgba(0,0,0,.45); stroke-width: 2px; pointer-events: none; }
        .t64-h-lab { font-size: 11.5px; fill: var(--t64-text); }
        .t64-h-sub { font-size: 10px; fill: var(--t64-dim); }
        .t64-h-gov-lab { font-size: 9.5px; fill: #e0b030; }
        .t64-h-gov { stroke: #e0b030; stroke-width: 2; }
        .t64-h-half { stroke: var(--t64-text); stroke-dasharray: 3 4; opacity: .45; }
        .t64-legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: .75rem; color: var(--t64-dim); margin-top: 4px; }
        .t64-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
        .t64-tablewrap { overflow-x: auto; }
        .t64-table { border-collapse: collapse; width: 100%; font-size: .78rem; color: var(--t64-text); }
        .t64-table th, .t64-table td { padding: 4px 6px; border-bottom: 1px solid var(--t64-line); text-align: right; white-space: nowrap; }
        .t64-table th:first-child, .t64-table td:first-child { text-align: left; }
        .t64-table th { color: var(--t64-dim); font-weight: normal; }
        .t64-table td.t64-gov { font-weight: bold; }
        .t64-table small { margin-left: 3px; font-size: .68rem; } .t64-up { color: #3fbf7f; } .t64-down { color: #e05555; }
        .t64-fold { border: 1px solid var(--t64-line); padding: 0 10px; margin-bottom: 8px; }
        .t64-fold > summary { cursor: pointer; padding: 8px 0; font-size: .85rem; color: var(--t64-text); }
        .t64-fold[open] { padding-bottom: 10px; }
        .t64-snap { display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid var(--t64-line); }
        .t64-snap input { flex: 1; min-width: 0; }
        .t64-snap .t64-dim { font-size: .72rem; white-space: nowrap; }
        .t64-x { cursor: pointer; background: transparent; border: 1px solid var(--t64-line); color: var(--t64-dim); font-family: inherit; padding: 1px 7px; }
        .t64-x-ph { width: 26px; }
        .t64-empty { text-align: center; padding: 26px 10px; color: var(--t64-dim); font-size: .85rem; line-height: 1.7; border: 1px dashed var(--t64-line); }
        .t64-empty-icon { font-size: 1.8rem; }
        .t64-field { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: .82rem; color: var(--t64-dim); }
        .t64-field span { min-width: 5em; } .t64-field input { flex: 1; min-width: 0; }
        .t64-markup { width: 100%; box-sizing: border-box; min-height: 180px; font-family: monospace; font-size: .75rem; }
        /* 위키 정보상자 — 위키백과 모양을 따라 늘 밝은 바탕 */
        .t64-wikiwrap { display: flex; justify-content: center; }
        .wbx { width: 100%; max-width: 340px; background: #f8f9fa; border: 1px solid #a2a9b1; color: #202122; font-family: 'Noto Sans KR', 'Malgun Gothic', sans-serif; font-size: 12.5px; line-height: 1.5; padding: 4px; box-sizing: border-box; }
        .wbx-title { background: #c5d4f1; text-align: center; font-weight: bold; font-size: 15px; padding: 6px 4px; }
        .wbx-sub { text-align: center; font-size: 12px; padding: 3px 0; background: #dfe7f8; }
        .wbx-logo { text-align: center; padding: 8px 0 2px; } .wbx-logo img { max-width: 90px; max-height: 90px; }
        .wbx table { width: 100%; border-collapse: collapse; }
        .wbx th { text-align: left; vertical-align: top; padding: 3px 6px; width: 38%; font-weight: bold; }
        .wbx td { padding: 3px 6px; vertical-align: top; }
        .wbx-band { background: #c5d4f1; text-align: center; font-weight: bold; padding: 3px; }
        .wbx-img { text-align: center; padding: 8px 4px; } .wbx-img img { max-width: 100%; }
        .wbx-center { text-align: center; }
        .wbx-groups { padding: 4px 8px 8px; }
        .wbx-group { margin-top: 6px; } .wbx-group b { display: block; margin-bottom: 2px; }
        .wbx-party { display: flex; align-items: center; gap: 6px; } .wbx-party i { display: inline-block; width: 11px; height: 11px; border: 1px solid #72777d; flex-shrink: 0; }
        /* 냉전 국가 순위 */
        .t64-rk { border: 1px solid var(--t64-line); background: var(--t64-soft); padding: 12px; }
        .t64-rk-title { font-size: 1.15rem; text-align: center; color: var(--t64-text); letter-spacing: 2px; margin-bottom: 6px; }
        .t64-rk-blocs { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 12px; font-size: .74rem; color: var(--t64-dim); margin-bottom: 10px; }
        .t64-rk-blocs i { display: inline-block; width: 10px; height: 10px; margin-right: 4px; vertical-align: middle; }
        .t64-rk-row { display: grid; grid-template-columns: 1.8em 1.7em minmax(0, 1fr) minmax(36px, 70px) 2.4em 2.4em; align-items: center; gap: 6px; padding: 6px 4px 6px 8px; border-left: 4px solid var(--bloc); border-bottom: 1px solid var(--t64-line); font-size: .85rem; color: var(--t64-text); }
        .t64-rk-row.self { background: color-mix(in srgb, var(--t64-acc) 10%, transparent); }
        .t64-rk-no { font-size: 1rem; color: var(--t64-dim); text-align: center; }
        .t64-rk-row:nth-child(-n+5) .t64-rk-no { color: #e0b030; }
        .t64-rk-flag { font-size: 1.1rem; text-align: center; } .t64-rk-flagimg { width: 1.6em; height: 1.1em; object-fit: cover; }
        .t64-rk-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .t64-rk-name em { font-style: normal; font-size: .68rem; color: var(--t64-acc); border: 1px solid var(--t64-acc); padding: 0 4px; margin-left: 4px; }
        .t64-rk-bloc { font-size: .7rem; color: var(--t64-dim); }
        .t64-rk-bar { height: 6px; background: rgba(127,127,127,.2); } .t64-rk-bar span { display: block; height: 100%; background: var(--bloc); }
        .t64-rk-score { text-align: right; }
        .t64-rk-mv { font-size: .72rem; text-align: right; color: var(--t64-dim); } .t64-rk-mv.up { color: #3fbf7f; } .t64-rk-mv.down { color: #e05555; }
        .t64-rk-edit { display: grid; grid-template-columns: 2.8em minmax(0, 1fr) 5.8em 3.8em 2em; gap: 6px; align-items: center; margin: 5px 0; }
        .t64-rk-edit input, .t64-rk-edit select { min-width: 0; box-sizing: border-box; }
        html[data-theme-family="modern"] .t64-btn, html[data-theme-family="modern"] .t64-x { border-radius: 8px; }
        html[data-theme-family="modern"] .t64-btn.primary { background: var(--m-accent); color: var(--m-on-accent); border-color: var(--m-accent); }
        html[data-theme-family="modern"] .t64-card, html[data-theme-family="modern"] .t64-fold, html[data-theme-family="modern"] .t64-rk, html[data-theme-family="modern"] .t64-empty { border-radius: 12px; }
        html[data-theme-family="modern"] .t64-seg { border-radius: 999px; overflow: hidden; }
        html[data-theme-family="modern"] .t64-seg button.on { color: var(--m-on-accent); }
        html[data-theme-family="modern"] .t64-rk-name em { border-radius: 999px; }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
