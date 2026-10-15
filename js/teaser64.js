// ===== Hemicycle 티저 1.6.4 (teaser64.html 전용) — "How the mighty have fallen" 미리보기 =====
// teaser64.html = main.html + js/teaserpodium.js + js/teaser61.js · 62 · 63 (1.6.1 ~ 1.6.3) + 이 파일. 저장 공간은 따로 ('hemicycleTeaser64:')
//
//   - 의회 › 세력 변화: 정당 의석을 시점마다 기록하고, 오른쪽 시각 화면 "세력 변화" 탭에 정당 역사 도표로 그린다
//     의석 변화(기록마다 의석 띠 · 점유율/의석 수 · ▲▼, 정당별 흐름 띠)와 당 변화(창당 · 당명 변경 · 승계 · 소멸 계보도) — 아래로 스크롤.
//     정당 승계: 같은 정당의 당명 · 색 바꾸기(한나라당 → 새누리당), 서로 다른 정당을 앞 → 뒤로 잇기(후신 · 합당 · 분당). 왼쪽에는 기록 버튼 · 변화 표.
//     총선 결과를 의회에 반영할 때 자동으로 기록되고, "지금 기록하기"로 직접 남기거나 선거 기록에서 가져올 수 있다.
//   - 의회 › 위키 틀: 위키 문서의 "원내 구성" 틀처럼 여당 · 야당 정당을 의석과 함께 모은 틀 (가장 큰 정당은 넓은 칸, 나머지는 세 칸씩),
//     나무위키 문법으로 복사 · 반원 그림 저장
//   - 세계(국가 아래 새 메뉴) › 국가 순위: 냉전 국가 순위 — 꾸밈용 (게임 기능에 영향 없음). 국기(그림) · 진영 · 하위 이념 · 점수 · 순위 변동.
//     세계 › 진영: 진영 추가 · 삭제, 색 · 설명, 하위 이념 추가 · 삭제, 진영 구도 막대
/* global getAppState, setAppState, switchSubTab, parties, coalitions, chamberList, chamberDisplayName, seatKeyFor, chamberLeaders,
   president, pm, govType, nationFlag, chamberLogos, elecRecords, formatNationDate, escapeHtmlText, showCustomAlert, showCustomConfirm,
   effRoleLabel, dotCache, hasSenateChamber, hasThirdChamber, updateParty, currentSubTab */
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
    //   succession: [{ id, from, to }] — 정당 승계 관계
    //   wiki: { termStart, termEnd, frame } — 원내 구성 틀
    //   ranking: { title, rows:[{ id, name, flag, flagKey, flagImg, bloc, ideo, score, prevRank, self }] }
    //   blocs: [{ id, name, color, desc, ideologies:[{ id, name }] }] — 세계 › 진영
    let S = fresh();
    function fresh() { return { timeline: [], succession: [], blocs: defaultBlocs(), wiki: { termStart: '', termEnd: '', frame: '#2b3a67' }, ranking: defaultRanking() }; }
    let ui = { tlChamber: 'house', wikiChamber: 'house', histView: 'seats', seatMode: 'share', rbPid: null, openSucc: false };

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
        if (!Array.isArray(S.succession)) S.succession = [];
        S.wiki = { ...base.wiki, ...(S.wiki || {}) };
        // 저장된 순위가 없으면 (새 세이브 · 프리셋) 우리나라 이름을 보고 처음 목록을 만든다
        if (!src || !src.ranking || !Array.isArray(S.ranking && S.ranking.rows)) S.ranking = defaultRanking(nationName());
        if (!Array.isArray(S.blocs) || !S.blocs.length && !(src && Array.isArray(src.blocs))) S.blocs = base.blocs;
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

    // ---- 정당 승계 ----
    //   S.succession: [{ id, from, to }] — 앞 정당(from)이 뒤 정당(to)으로 이어짐 (해산 뒤 후신 · 합당 · 분당 등)
    //   당명 · 색만 바꾸는 승계(한나라당 → 새누리당 같은)는 같은 정당을 그대로 고치고 그 시점을 기록해, 기록마다 남은 옛 이름으로 보인다.
    const sameId = (a, b) => String(a) === String(b);
    const succOf = id => (S.succession || []).filter(l => sameId(l.from, id)).map(l => l.to);
    // 승계가 일어난 자리: 잇기를 누른 시각(at) 바로 앞의 기록 i → 그다음 기록 i+1에서 합쳐진다 (i+1이 아직 없으면 -1: 다음 기록에서)
    // 예전 방식(at 없음)은 앞 정당이 사라지고 뒤 정당이 이어받는 첫 자리
    function linkStep(l, list, alive) {
        if (l.at != null) {
            let i = -1;
            list.forEach((x, k) => { if (x.at <= l.at) i = k; });
            return i >= 0 && i < list.length - 1 ? i : -1;
        }
        for (let i = 0; i < list.length - 1; i++) if (alive(list[i], l.from) && !alive(list[i + 1], l.from) && alive(list[i + 1], l.to)) return i;
        return -1;
    }
    const predOf = id => (S.succession || []).filter(l => sameId(l.to, id)).map(l => l.from);
    // 기록 · 지금 정당에서 알려진 모든 정당 (가장 최근 이름 · 색)
    function knownParties() {
        const m = new Map();
        S.timeline.slice().sort((a, b) => a.at - b.at).forEach(sn => sn.parties.forEach(p => m.set(String(p.id), { id: p.id, name: p.name, color: p.color })));
        parties.forEach(p => { if (p.ideologyId !== 9999) m.set(String(p.id), { id: p.id, name: p.name, color: p.color }); });
        return [...m.values()];
    }
    function rebrand(pid, name, color) {
        const idx = parties.findIndex(p => sameId(p.id, pid));
        if (idx < 0) return false;
        const old = parties[idx].name;
        if (!S.timeline.length) record('', 'manual', false); // 바꾸기 전 모습도 남겨 둠
        try { updateParty(idx, 'name', name); if (color) updateParty(idx, 'color', color); }
        catch (e) { parties[idx].name = name; if (color) parties[idx].color = color; }
        record(`${old} → ${name}`, 'succession', false);
        return true;
    }

    // ---- 정당 역사 도표 (오른쪽 시각 화면, 아래로 흐름) ----
    // 의석 변화: 기록 하나가 가로 띠 하나(폭 = 의석 비율 또는 의석 수), 시간은 위에서 아래로. 이웃한 기록 사이는 정당마다 흐르는 띠로 이어
    //   정당이 생기고 · 커지고 · 줄고 · 사라지는 모습을 보여 준다. 승계는 앞 정당 띠가 뒤 정당으로 이어져 흐름. 집권 세력은 금색 테두리.
    // 당 변화: 정당마다 창당부터 소멸까지 세로줄, 당명이 바뀐 자리 · 승계(→) · 소멸(✕)을 표시하는 계보도
    function partyOrder(snaps) {
        const ids = [];
        const idx = id => { const k = parties.findIndex(p => sameId(p.id, id)); return k < 0 ? 1e6 : k; };
        snaps.forEach(sn => sn.parties.forEach(p => { if (!ids.some(x => sameId(x, p.id))) ids.push(p.id); }));
        const first = id => snaps.findIndex(sn => sn.parties.some(p => sameId(p.id, id)));
        ids.sort((a, b) => (idx(a) - idx(b)) || (first(a) - first(b)));
        // 승계한 정당은 앞 정당 바로 옆에
        (S.succession || []).forEach(l => {
            const fi = ids.findIndex(x => sameId(x, l.from)), ti = ids.findIndex(x => sameId(x, l.to));
            if (fi < 0 || ti < 0 || ti === fi + 1) return;
            const [t] = ids.splice(ti, 1);
            ids.splice(ids.findIndex(x => sameId(x, l.from)) + 1, 0, t);
        });
        return ids;
    }
    let gradSeq = 0;
    const gradient = (c1, c2, defs) => { const id = `t64g${++gradSeq}`; defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${esc(c1)}"/><stop offset="1" stop-color="${esc(c2)}"/></linearGradient>`); return `url(#${id})`; };

    function seatsChart(snaps, width) {
        const W = Math.max(320, Math.round(width || 600));
        const LW = Math.min(132, Math.round(W * 0.26)), X0 = LW + 10, X1 = W - 10, CW = X1 - X0;
        const BAR = 26, FLOW = 56, TOP = 8;
        const ids = partyOrder(snaps);
        const at = (sn, id) => sn.parties.find(x => sameId(x.id, id)) || null;
        const info = id => { for (let i = snaps.length - 1; i >= 0; i--) { const p = at(snaps[i], id); if (p) return p; } const k = knownParties().find(x => sameId(x.id, id)); return k || { name: '?', color: '#888' }; };
        const seat = (sn, id) => (at(sn, id) || {}).seats || 0;
        const count = ui.seatMode === 'count';
        const maxTotal = Math.max(1, ...snaps.map(sn => sn.total));
        // 기록마다 정당별 [시작 x, 끝 x] — 의석이 0인 정당도 제자리에 폭 0으로 두어 흐름이 자연스럽게 생기고 사라진다
        const spans = snaps.map(sn => {
            let x = X0; const m = {};
            const denom = count ? maxTotal : (sn.total || 1);
            ids.forEach(id => { const w = seat(sn, id) / denom * CW; m[id] = [x, x + w]; x += w; });
            return m;
        });
        const yOf = i => TOP + i * (BAR + FLOW);
        const H = yOf(snaps.length - 1) + BAR + 14;
        const defs = [];
        let flows = '', notes = '', bars = '', labels = '';
        for (let i = 0; i < snaps.length - 1; i++) {
            const yb = yOf(i) + BAR, yt = yOf(i + 1), ym = (yb + yt) / 2;
            const ribbon = (a0, a1, c0, c1, fill, tip) => { flows += `<path d="M${a0},${yb} L${a1},${yb} C${a1},${ym} ${c1},${ym} ${c1},${yt} L${c0},${yt} C${c0},${ym} ${a0},${ym} ${a0},${yb} Z" fill="${fill}" fill-opacity=".45"><title>${esc(tip)}</title></path>`; };
            ids.forEach(id => {
                const [a0, a1] = spans[i][id], [c0, c1] = spans[i + 1][id];
                if (a1 - a0 < 0.2 && c1 - c0 < 0.2) return;
                const pa = at(snaps[i], id), pc = at(snaps[i + 1], id), p = pc || pa || info(id);
                const fill = pa && pc && pa.color !== pc.color ? gradient(pa.color, pc.color, defs) : esc(p.color);
                ribbon(a0, a1, c0, c1, fill, `${p.name}: ${seat(snaps[i], id)} → ${seat(snaps[i + 1], id)}석`);
                // 같은 정당이 당명을 바꿈 → 흐름 가운데에 새 이름
                if (pa && pc && pa.name !== pc.name) notes += `<text x="${(a0 + a1 + c0 + c1) / 4}" y="${ym + 4}" class="t64-h-note" text-anchor="middle">→ ${esc(pc.name)}</text>`;
            });
            // 승계: 잇기를 누른 다음 기록에서 앞 정당 띠가 뒤 정당 띠로 합쳐짐
            (S.succession || []).forEach(l => {
                if (linkStep(l, snaps, (sn, id) => seat(sn, id) > 0) !== i) return;
                const fa = seat(snaps[i], l.from), tb = seat(snaps[i + 1], l.to);
                if (!(fa > 0 && tb > 0)) return;
                const [a0, a1] = spans[i][l.from] || [0, 0], [c0, c1] = spans[i + 1][l.to] || [0, 0];
                const pf = info(l.from), pt = info(l.to);
                ribbon(a0, a1, c0, c1, gradient(pf.color, pt.color, defs), `${pf.name} → ${pt.name} (승계)`);
                notes += `<text x="${(a0 + a1 + c0 + c1) / 4}" y="${ym + 4}" class="t64-h-note" text-anchor="middle">→ ${esc(pt.name)}</text>`;
            });
        }
        snaps.forEach((sn, i) => {
            const y = yOf(i);
            const ruling = new Set((sn.ruling || []).map(String));
            ids.forEach(id => {
                const [x0, x1] = spans[i][id], w = x1 - x0, n = seat(sn, id);
                if (n <= 0) return;
                const p = at(sn, id);
                const gov = ruling.has(String(id));
                const prev = i ? seat(snaps[i - 1], id) : null;
                // 승계로 이어받은 정당은 앞 정당 의석과 비교
                const preds = (S.succession || []).filter(l => sameId(l.to, id) && i && linkStep(l, snaps, (x, pid) => seat(x, pid) > 0) === i - 1 && seat(snaps[i - 1], l.from) > 0 && !seat(sn, l.from)).map(l => l.from);
                const base = prev == null ? null : prev + preds.reduce((a2, pid) => a2 + seat(snaps[i - 1], pid), 0);
                const d = base == null || (base === 0 && !preds.length) ? null : n - base;
                bars += `<rect x="${x0}" y="${y}" width="${w}" height="${BAR}" fill="${esc(p.color)}"${gov ? ' class="t64-h-gov"' : ''}><title>${esc(`${p.name} ${n}석 (${Math.round(n / sn.total * 100)}%)${d ? ` ${d > 0 ? '▲' : '▼'}${Math.abs(d)}` : ''}${gov ? ' · 집권' : ''} — ${sn.label || sn.date}`)}</title></rect>`;
                const dTxt = d ? ` ${d > 0 ? '▲' : '▼'}${Math.abs(d)}` : '';
                const opts = [`${p.name} ${n}${dTxt}`, `${p.name} ${n}`, `${n}${dTxt}`, String(n)];
                const txt = opts.find(t => t.length * 6.6 + 8 < w) || '';
                if (txt) bars += `<text x="${x0 + w / 2}" y="${y + BAR / 2 + 4}" class="t64-h-seg" text-anchor="middle">${esc(txt)}</text>`;
            });
            const govNames = sn.parties.filter(p => ruling.has(String(p.id))).map(p => p.name);
            const dTot = i ? sn.total - snaps[i - 1].total : 0;
            labels += `<text x="${LW}" y="${y + 11}" class="t64-h-lab" text-anchor="end">${esc((sn.label || sn.date || `#${i + 1}`).slice(0, 16))}</text>`;
            labels += `<text x="${LW}" y="${y + 24}" class="t64-h-sub" text-anchor="end">${esc([sn.label ? sn.date : '', `${sn.total}석${dTot ? ` (${dTot > 0 ? '+' : ''}${dTot})` : ''}`].filter(Boolean).join(' · ').slice(0, 24))}</text>`;
            if (govNames.length) labels += `<text x="${LW}" y="${y + BAR + 11}" class="t64-h-gov-lab" text-anchor="end">★ ${esc(govNames.join('·').slice(0, 18))}</text>`;
        });
        const half = count ? `<line x1="${X0 + CW / 2}" x2="${X0 + CW / 2}" y1="0" y2="${H}" class="t64-h-half"/>` : `<line x1="${X0 + CW / 2}" x2="${X0 + CW / 2}" y1="0" y2="${H}" class="t64-h-half"/>`;
        const legend = ids.map(id => { const p = info(id); return `<span>${dotHtml(p.color)}${esc(p.name)}</span>`; }).join('');
        return `<div class="t64-legend t64-h-legend">${legend}<span class="t64-dim">★ 집권 · ┆ ${count ? `최대 의석(${maxTotal})의 절반` : '과반'} · ▲▼ 앞 기록 대비</span></div>
            <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="t64-hist" role="img" aria-label="의석 변화"><defs>${defs.join('')}</defs>${flows}${half}${bars}${notes}${labels}</svg>`;
    }

    // 당 변화 — 정당 계보도
    function lineageChart(width) {
        // 시점: 모든 원의 기록을 시간순으로, 같은 순간(3초 안)에 남긴 기록은 하나로
        const all = S.timeline.slice().sort((a, b) => a.at - b.at);
        const points = [];
        all.forEach(sn => {
            const last = points[points.length - 1];
            if (last && sn.at - last.at < 3000) { last.snaps.push(sn); if (!last.label && sn.label) last.label = sn.label; }
            else points.push({ at: sn.at, label: sn.label, date: sn.date, snaps: [sn] });
        });
        if (!points.length) return '';
        // 시점마다 살아 있는 정당 (어느 원에든 의석이 있으면) · 그때 이름 · 색 · 의석(하원 우선)
        points.forEach(pt => {
            pt.alive = new Map();
            pt.snaps.slice().sort((a, b) => (a.chamber === 'house' ? -1 : 1) - (b.chamber === 'house' ? -1 : 1)).reverse().forEach(sn => sn.parties.forEach(p => pt.alive.set(String(p.id), { ...p })));
            const h = pt.snaps.find(sn => sn.chamber === 'house');
            if (h) h.parties.forEach(p => { const e = pt.alive.get(String(p.id)); if (e) e.seats = p.seats; });
        });
        const ids = [];
        points.forEach(pt => pt.alive.forEach((_, id) => { if (!ids.includes(id)) ids.push(id); }));
        const life = {};
        ids.forEach(id => { const ks = points.map((pt, k) => (pt.alive.has(id) ? k : -1)).filter(k => k >= 0); life[id] = { first: ks[0], last: ks[ks.length - 1] }; });
        // 승계마다 합쳐지는 자리: k0(앞 정당) → k1 = k0 + 1(뒤 정당). k1이 아직 없으면 다음 기록에서
        const linkK = l => {
            if (l.at != null) { let k = -1; points.forEach((pt, j) => { if (pt.at <= l.at) k = j; }); return k; }
            const f = life[String(l.from)], t = life[String(l.to)];
            if (!f || !t) return -1;
            return t.first > f.last ? f.last : Math.max(f.first, t.first - 1);
        };
        // 줄(lane) 배정 — 승계한 정당은 앞 정당이 끝난 줄을 이어 씀
        const lanes = [];
        const free = (lane, a, b) => lanes[lane].every(([x, y]) => b < x || a > y);
        const laneOf = {};
        const order = ids.slice().sort((a, b) => life[a].first - life[b].first || (parties.findIndex(p => sameId(p.id, a)) - parties.findIndex(p => sameId(p.id, b))));
        order.forEach(id => {
            const { first, last } = life[id];
            let lane = -1;
            predOf(id).map(String).forEach(pid => { const l = laneOf[pid]; if (lane < 0 && l != null && life[pid] && life[pid].last < first && free(l, first, last)) lane = l; });
            if (lane < 0) { lane = lanes.findIndex((_, l) => free(l, first, last)); if (lane < 0) { lanes.push([]); lane = lanes.length - 1; } }
            lanes[lane].push([first, last]); laneOf[id] = lane;
        });
        const W0 = Math.max(320, Math.round(width || 600));
        const LW = Math.min(120, Math.round(W0 * 0.22)), X0 = LW + 14;
        const laneW = Math.max(74, Math.min(130, (W0 - X0 - 10) / Math.max(1, lanes.length)));
        const W = Math.max(W0, X0 + laneW * lanes.length + 10);
        const ROW = 70, TOP = 26, BW = 10;
        const xOf = id => X0 + laneOf[id] * laneW + 14;
        const yOf = k => TOP + k * ROW;
        const pending = (S.succession || []).some(l => life[String(l.from)] && life[String(l.to)] && linkK(l) >= points.length - 1);
        const H = yOf(points.length - 1) + (pending ? ROW + 10 : 40);
        const defs = [];
        let rows = '', lines = '', links = '', nodes = '';
        points.forEach((pt, k) => {
            rows += `<line x1="${LW + 4}" x2="${W - 6}" y1="${yOf(k)}" y2="${yOf(k)}" class="t64-l-row"/>`;
            rows += `<text x="${LW}" y="${yOf(k) + 4}" class="t64-h-lab" text-anchor="end">${esc((pt.label || pt.date || `#${k + 1}`).slice(0, 14))}</text>`;
            if (pt.label && pt.date) rows += `<text x="${LW}" y="${yOf(k) + 17}" class="t64-h-sub" text-anchor="end">${esc(String(pt.date).slice(0, 16))}</text>`;
        });
        ids.forEach(id => {
            const { first, last } = life[id], x = xOf(id);
            for (let k = first; k < last; k++) {
                const a = points[k].alive.get(id), b = points[k + 1].alive.get(id);
                if (!a || !b) { lines += `<line x1="${x}" x2="${x}" y1="${yOf(k)}" y2="${yOf(k + 1)}" stroke="${esc((a || b || {}).color || '#888')}" stroke-width="2" stroke-dasharray="3 4"/>`; continue; }
                const fill = a.color !== b.color ? gradient(a.color, b.color, defs) : esc(b.color);
                lines += `<rect x="${x - BW / 2}" y="${yOf(k)}" width="${BW}" height="${ROW}" fill="${fill}"><title>${esc(`${b.name} ${b.seats || 0}석`)}</title></rect>`;
            }
            // 이름표: 창당한 자리 · 당명이 바뀐 자리
            for (let k = first; k <= last; k++) {
                const p = points[k].alive.get(id); if (!p) continue;
                const prev = k > first ? points[k - 1].alive.get(id) : null;
                const isStart = k === first, renamed = prev && prev.name !== p.name;
                if (!isStart && !renamed) continue;
                nodes += `<circle cx="${x}" cy="${yOf(k)}" r="${isStart ? 7 : 6}" fill="${esc(p.color)}" class="t64-l-node"/>`;
                const sub = isStart ? ((S.succession || []).some(l => sameId(l.to, id) && linkK(l) + 1 === k) ? '승계' : '창당') : `← ${prev.name}`;
                nodes += `<text x="${x + 11}" y="${yOf(k) - 2}" class="t64-l-name">${esc(p.name)}</text><text x="${x + 11}" y="${yOf(k) + 11}" class="t64-h-sub">${esc(sub)}${p.seats ? ` · ${p.seats}석` : ''}</text>`;
            }
            // 끝: 승계로 합쳐지거나, 마지막 기록 전에 사라졌으면 소멸
            const outs = (S.succession || []).filter(l => sameId(l.from, id) && life[String(l.to)]);
            outs.forEach(l => {
                const t = String(l.to), k0 = Math.max(first, Math.min(linkK(l), last)), k1 = k0 + 1, x2 = xOf(t);
                const pf = points[k0].alive.get(id), y1 = yOf(k0);
                if (k1 >= points.length) {
                    // 아직 다음 기록이 없음 — 다음 기록에서 합쳐질 예정
                    links += `<path d="M${x},${y1} C${x},${y1 + ROW * 0.45} ${x2},${y1 + ROW * 0.35} ${x2},${y1 + ROW * 0.8}" fill="none" stroke="${esc(pf ? pf.color : '#888')}" stroke-width="3" stroke-dasharray="5 4" opacity=".7"/>`;
                    nodes += `<text x="${(x + x2) / 2}" y="${y1 + ROW * 0.62}" class="t64-h-sub" text-anchor="middle">다음 기록에서 합쳐짐</text>`;
                    return;
                }
                const pt2 = points[k1].alive.get(t), y2 = yOf(k1);
                const gid = `t64lg${++gradSeq}`;
                defs.push(`<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${x}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${esc(pf ? pf.color : '#888')}"/><stop offset="1" stop-color="${esc(pt2 ? pt2.color : (pf ? pf.color : '#888'))}"/></linearGradient>`);
                links += `<path d="M${x},${y1} C${x},${y1 + ROW * 0.55} ${x2},${y2 - ROW * 0.55} ${x2},${y2}" fill="none" stroke="url(#${gid})" stroke-width="${BW}"><title>${esc(`${pf ? pf.name : ''} → ${pt2 ? pt2.name : ''} (승계)`)}</title></path>`;
            });
            if (!outs.some(l => linkK(l) >= last) && last < points.length - 1) {
                nodes += `<text x="${x}" y="${yOf(last) + 18}" class="t64-l-end" text-anchor="middle">✕</text><text x="${x + 11}" y="${yOf(last) + 24}" class="t64-h-sub">소멸</text>`;
            }
        });
        return `<div class="t64-legend t64-h-legend"><span class="t64-dim">● 창당 · 당명 변경 / 곡선으로 합쳐짐 = 승계 / ✕ 소멸 · 마우스를 올리면 의석</span></div>
            <div class="t64-l-scroll"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="t64-hist" role="img" aria-label="당 변화"><defs>${defs.join('')}</defs>${rows}${links}${lines}${nodes}</svg></div>`;
    }

    function renderHistory() {
        const wrap = document.getElementById('t64HistWrap');
        if (!wrap) return;
        const chs = chambers();
        if (!chs.includes(ui.tlChamber)) ui.tlChamber = chs[0];
        const snaps = S.timeline.filter(x => x.chamber === ui.tlChamber).sort((a, b) => a.at - b.at);
        const lineage = ui.histView === 'lineage';
        const title = document.getElementById('t64HistTitle');
        if (title) title.textContent = lineage ? '당 변화' : `${chName(ui.tlChamber)} 의석 변화`;
        const panel = document.getElementById('dispPanelTimeline');
        const width = (wrap.clientWidth || (panel && panel.clientWidth) || 600) - 4;
        const seg = (items, cur, attr) => `<div class="t64-seg">${items.map(([k, t]) => `<button type="button" class="${cur === k ? 'on' : ''}" data-${attr}="${k}">${esc(t)}</button>`).join('')}</div>`;
        const controls = `<div class="t64-h-controls">${seg([['seats', '의석 변화'], ['lineage', '당 변화']], ui.histView, 'hview')}
            ${lineage ? '' : seg([['share', '점유율'], ['count', '의석 수']], ui.seatMode, 'hmode')}
            ${!lineage && chs.length > 1 ? seg(chs.map(c => [c, chName(c)]), ui.tlChamber, 'hch') : ''}</div>`;
        const empty = '<div class="t64-empty"><div class="t64-empty-icon">📈</div>아직 기록이 없습니다.<br>왼쪽 의회 › 세력 변화에서 "지금 의석 기록하기"를 누르거나, 총선을 치러 의회에 반영하면 여기에 아래로 쌓여요.</div>';
        wrap.innerHTML = controls + (lineage ? (S.timeline.length ? lineageChart(width) : empty) : (snaps.length ? seatsChart(snaps, width) : empty));
        wrap.querySelectorAll('[data-hch]').forEach(b => { b.onclick = () => { ui.tlChamber = b.dataset.hch; renderTimeline(); }; });
        wrap.querySelectorAll('[data-hview]').forEach(b => { b.onclick = () => { ui.histView = b.dataset.hview; renderHistory(); }; });
        wrap.querySelectorAll('[data-hmode]').forEach(b => { b.onclick = () => { ui.seatMode = b.dataset.hmode; renderHistory(); }; });
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
        show.forEach(sn => sn.parties.forEach(p => { if (!ids.some(x => sameId(x, p.id))) ids.push(p.id); }));
        const seat = (sn, id) => (sn.parties.find(x => sameId(x.id, id)) || {}).seats || 0;
        const info = id => { for (let i = show.length - 1; i >= 0; i--) { const p = show[i].parties.find(x => sameId(x.id, id)); if (p) return p; } return { name: '?', color: '#888' }; };
        ids.sort((a, b) => seat(show[show.length - 1], b) - seat(show[show.length - 1], a));
        return `<div class="t64-tablewrap"><table class="t64-table"><thead><tr><th>정당</th>${show.map(sn => `<th title="${esc(sn.date)}">${esc((sn.label || sn.date || '').slice(0, 10))}</th>`).join('')}</tr></thead>
            <tbody>${ids.map(id => { const p = info(id); return `<tr><td>${dotHtml(p.color)}${esc(p.name)}</td>${show.map((sn, i) => {
                const v = seat(sn, id), prev = i ? seat(show[i - 1], id) : null, d = prev == null ? 0 : v - prev;
                const gov = (sn.ruling || []).some(x => sameId(x, id));
                return `<td class="${gov ? 't64-gov' : ''}">${v || '—'}${d ? `<small class="${d > 0 ? 't64-up' : 't64-down'}">${d > 0 ? '▲' : '▼'}${Math.abs(d)}</small>` : ''}</td>`;
            }).join('')}</tr>`; }).join('')}</tbody></table></div>
            <div class="t64-dim t64-small">굵은 칸은 그 시점의 집권 세력 · ▲▼는 바로 앞 기록과의 차이 (최근 8개)</div>`;
    }

    function successionPanel() {
        const known = knownParties();
        const cur = parties.filter(p => p.ideologyId !== 9999 && p.status !== 'dissolved');
        const nameOf = id => (known.find(k => sameId(k.id, id)) || { name: '?' }).name;
        const colorOf = id => (known.find(k => sameId(k.id, id)) || { color: '#888' }).color;
        if (ui.rbPid == null || !cur.some(p => sameId(p.id, ui.rbPid))) ui.rbPid = cur[0] ? cur[0].id : null;
        const rbParty = cur.find(p => sameId(p.id, ui.rbPid));
        return `<details class="t64-fold" ${ui.openSucc ? 'open' : ''} data-fold="openSucc"><summary>🔁 정당 승계</summary>
            <div class="t64-sub-title">당명 · 색 바꾸기 (승계)</div>
            <div class="t64-dim t64-small" style="margin:0 0 6px">한나라당 → 새누리당처럼 같은 정당이 이름 · 색을 바꿉니다. 의석 · 의원 · 연정은 그대로 이어지고, 그 시점이 기록돼 "당 변화"에 표시돼요.</div>
            <div class="t64-field"><span>정당</span><select data-rb="pid">${cur.map(p => `<option value="${esc(p.id)}" ${sameId(p.id, ui.rbPid) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></div>
            <div class="t64-field"><span>새 이름</span><input type="text" data-rb="name" placeholder="${esc(rbParty ? rbParty.name : '')}"></div>
            <div class="t64-field"><span>새 색</span><input type="color" data-rb="color" value="${esc(rbParty && /^#[0-9a-f]{6}$/i.test(rbParty.color) ? rbParty.color : '#888888')}"></div>
            <button type="button" class="t64-btn primary" data-act="rebrand">승계</button>
            <div class="t64-sub-title" style="margin-top:14px">승계 관계 잇기</div>
            <div class="t64-dim t64-small" style="margin:0 0 6px">서로 다른 정당을 앞 정당 → 뒤 정당으로 잇습니다 (해산 뒤 후신 · 합당 · 분당). 지금까지의 기록 바로 다음 기록에서 앞 정당 줄이 뒤 정당 줄로 합쳐져요 — 합당이면 앞 정당은 해산하거나 의석을 0으로 두세요.</div>
            <div class="t64-succ-row"><select data-sl="from">${known.map(k => `<option value="${esc(k.id)}">${esc(k.name)}</option>`).join('')}</select><span>→</span>
                <select data-sl="to">${known.map((k, i) => `<option value="${esc(k.id)}" ${i === 1 ? 'selected' : ''}>${esc(k.name)}</option>`).join('')}</select>
                <button type="button" class="t64-btn" data-act="link">잇기</button></div>
            ${(S.succession || []).map(l => `<div class="t64-snap">${dotHtml(colorOf(l.from))}<span>${esc(nameOf(l.from))}</span><span class="t64-dim">→</span>${dotHtml(colorOf(l.to))}<span style="flex:1">${esc(nameOf(l.to))}</span><button type="button" class="t64-x" data-unlink="${l.id}" title="끊기">×</button></div>`).join('')}
        </details>`;
    }

    function renderTimeline() {
        const box = document.getElementById('contentTimeline');
        if (!box) return;
        const chs = chambers();
        if (!chs.includes(ui.tlChamber)) ui.tlChamber = chs[0];
        const snaps = S.timeline.filter(x => x.chamber === ui.tlChamber).sort((a, b) => a.at - b.at);
        const recCount = (typeof elecRecords !== 'undefined' ? elecRecords : []).filter(r => r && r.chamberType && !S.timeline.some(x => x.source === 'rec:' + r.id)).length;
        box.innerHTML = `<div class="t64-intro">정당 의석을 시점마다 기록해 세력이 어떻게 오르내렸는지(의석 변화), 정당이 어떻게 생기고 바뀌고 이어졌는지(당 변화) 봅니다. 총선 결과를 의회에 반영하면 자동으로 기록돼요.</div>
            ${chs.length > 1 ? `<div class="system-radio-group t64-tabs">${chs.map(c => `<button type="button" class="system-radio-btn ${ui.tlChamber === c ? 'active' : ''}" data-tlch="${c}">${esc(chName(c))}</button>`).join('')}</div>` : ''}
            <div class="t64-actions">
                <button type="button" class="t64-btn primary" data-act="snap">📸 지금 의석 기록하기</button>
                <button type="button" class="t64-btn" data-act="import" ${recCount ? '' : 'disabled'}>선거 기록에서 가져오기${recCount ? ` (${recCount})` : ''}</button>
            </div>
            <div class="t64-card t64-histnote"><span>📊 오른쪽 시각 화면 "세력 변화" 탭에서 의석 변화 · 당 변화 도표를 아래로 스크롤하며 봐요.</span><button type="button" class="t64-btn" data-act="showhist">오른쪽에서 보기</button></div>
            ${snaps.length ? `<div class="t64-card">${changeTable(snaps)}</div>` : ''}
            ${successionPanel()}
            ${snaps.length ? `<details class="t64-fold"><summary>기록 ${snaps.length}개 — 이름 바꾸기 · 지우기</summary>
                ${snaps.slice().reverse().map(sn => `<div class="t64-snap"><input type="text" value="${esc(sn.label)}" placeholder="${esc(sn.date || '이름 없음')}" data-label="${sn.id}"><span class="t64-dim">${esc(sn.date)} · ${sn.total}석${sn.source === 'election' ? ' · 선거' : sn.source === 'succession' ? ' · 승계' : String(sn.source).startsWith('rec:') ? ' · 선거 기록' : ''}</span><button type="button" class="t64-x" data-del="${sn.id}" title="지우기">×</button></div>`).join('')}
            </details>` : `<div class="t64-empty"><div class="t64-empty-icon">📈</div>아직 기록이 없습니다.<br>"지금 의석 기록하기"를 누르거나, 총선을 치러 의회에 반영하면 쌓여요.</div>`}`;
        box.querySelectorAll('[data-tlch]').forEach(b => { b.onclick = () => { ui.tlChamber = b.dataset.tlch; renderTimeline(); }; });
        box.querySelector('[data-act="showhist"]').onclick = showHistoryTab;
        box.querySelector('[data-act="snap"]').onclick = () => {
            const n = record('', 'manual', false);
            if (!n) showCustomAlert('기록할 의석이 없습니다.');
            renderTimeline();
        };
        const imp = box.querySelector('[data-act="import"]');
        if (imp) imp.onclick = () => { const n = importRecords(); showCustomAlert(n ? `선거 기록 ${n}개를 가져왔습니다.` : '가져올 선거 기록이 없습니다.'); renderTimeline(); };
        box.querySelectorAll('[data-label]').forEach(i => { i.onchange = () => { const sn = S.timeline.find(x => x.id === i.dataset.label); if (sn) sn.label = i.value.trim(); renderTimeline(); }; });
        box.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => { S.timeline = S.timeline.filter(x => x.id !== b.dataset.del); renderTimeline(); }; });
        box.querySelectorAll('[data-fold]').forEach(d => d.addEventListener('toggle', () => { ui[d.dataset.fold] = d.open; }));
        const rbSel = box.querySelector('[data-rb="pid"]');
        if (rbSel) rbSel.onchange = () => { ui.rbPid = rbSel.value; renderTimeline(); };
        const rb = box.querySelector('[data-act="rebrand"]');
        if (rb) rb.onclick = () => {
            const name = box.querySelector('[data-rb="name"]').value.trim();
            const color = box.querySelector('[data-rb="color"]').value;
            const p = parties.find(x => sameId(x.id, ui.rbPid));
            if (!p) { showCustomAlert('승계할 정당을 고르세요.'); return; }
            if (!name) { showCustomAlert('새 이름을 적으세요.'); return; }
            showCustomConfirm(`${p.name} → ${name}\n같은 정당이 이름${color && color !== p.color ? ' · 색' : ''}을 바꿉니다. 이 시점이 기록됩니다. 계속하시겠습니까?`, () => {
                rebrand(p.id, name, color);
                renderTimeline();
            });
        };
        const lk = box.querySelector('[data-act="link"]');
        if (lk) lk.onclick = () => {
            const from = box.querySelector('[data-sl="from"]').value, to = box.querySelector('[data-sl="to"]').value;
            if (!from || !to || from === to) { showCustomAlert('서로 다른 두 정당을 고르세요.'); return; }
            if ((S.succession || []).some(l => sameId(l.from, from) && sameId(l.to, to))) { showCustomAlert('이미 이어져 있습니다.'); return; }
            const toNum = v => (/^\d+$/.test(v) ? Number(v) : v);
            S.succession = (S.succession || []).concat([{ id: uid(), from: toNum(from), to: toNum(to), at: Date.now() }]);
            renderTimeline();
        };
        box.querySelectorAll('[data-unlink]').forEach(b => { b.onclick = () => { S.succession = (S.succession || []).filter(l => l.id !== b.dataset.unlink); renderTimeline(); }; });
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
    const IND_ID = 9999;
    // 틀에 담을 의회: 'house' · 'senate' · 'third' 하나, 또는 'both'(상원 | 하원 의석을 한 칸에 나란히 — 예: 참의원 | 중의원)
    const wikiModes = () => { const chs = chambers(); return chs.includes('senate') ? [...chs, 'both'] : chs; };
    const wikiChs = mode => (mode === 'both' ? ['senate', 'house'] : [mode]);
    const wikiModeName = mode => (mode === 'both' ? `양원 (${chName('senate')} | ${chName('house')})` : chName(mode));
    function pmName() {
        try { const r = pmAutoSource(); if (r && r.name) return r.name; } catch (e) { /* main.js 없음 */ }
        try { return (pm && pm.name) || ''; } catch (e) { return ''; }
    }
    function wikiData(mode) {
        const chs = wikiChs(mode);
        const main = chs[chs.length - 1]; // 정렬 · 교섭단체 기준이 되는 원 (양원이면 하원)
        const seats = p => chs.map(ch => seatsOf(p, ch));
        const tot = p => seats(p).reduce((a, b) => a + b, 0);
        const ps = parties.filter(p => tot(p) > 0 && p.status !== 'dissolved')
            .sort((a, b) => (seatsOf(b, main) - seatsOf(a, main)) || (tot(b) - tot(a)));
        const ind = ps.filter(p => p.ideologyId === IND_ID);
        const min = Math.max(0, Number(S.wiki.groupMin) || 0);
        const minor = ps.filter(p => p.ideologyId !== IND_ID && min > 0 && seatsOf(p, main) < min);
        const named = ps.filter(p => p.ideologyId !== IND_ID && !minor.includes(p));
        const quotaOf = ch => { const el = document.getElementById(ch === 'senate' ? 'senateTotal' : ch === 'third' ? 'thirdTotal' : 'houseTotal'); return el ? (parseInt(el.value, 10) || 0) : 0; };
        const pmn = pmName();
        const start = (S.wiki.termStart || '').trim(), end = (S.wiki.termEnd || '').trim();
        return {
            mode, chs, main, seats,
            title: (S.wiki.title || '').trim() || [nationName(), mode === 'both' ? '의회' : chName(mode)].filter(Boolean).join(' '),
            govName: (S.wiki.govName || '').trim() || (pmn ? `${pmn} 내각` : ''),
            period: start || end ? `(${start}${start ? ' ' : ''}~ ${end || '현재'})` : '',
            gov: named.filter(isGovParty), opp: named.filter(p => !isGovParty(p)), minor, ind,
            totals: chs.map(ch => ps.reduce((a, p) => a + seatsOf(p, ch), 0)), quotas: chs.map(quotaOf),
            emblem: (typeof chamberLogos !== 'undefined' && chamberLogos[main]) || (typeof nationFlag !== 'undefined' && nationFlag) || '',
        };
    }
    // 글자색: 바탕이 밝으면 검정, 어두우면 흰색
    function fgFor(hex) {
        const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
        if (!m) return '#fff';
        const n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, bl = n & 255;
        return (0.299 * r + 0.587 * g + 0.114 * bl) > 165 ? '#1a1a1a' : '#fff';
    }
    const emblemSvg = c => `<svg viewBox="0 0 64 40" width="64" height="40" aria-hidden="true"><path d="M8 16 Q32 -4 56 16Z" fill="${c}"/><rect x="6" y="16" width="52" height="3" fill="${c}"/>${[10, 16, 22, 28, 34, 40, 46, 52].map(x => `<rect x="${x}" y="20" width="3" height="14" fill="${c}"/>`).join('')}<rect x="4" y="34" width="56" height="3" fill="${c}"/></svg>`;
    // 한 줄에 몇 칸씩: 3개까지는 한 줄, 그보다 많으면 세 칸씩 — 남는 수는 위쪽 줄을 두 칸으로 (예: 11개 → 2 · 3 · 3 · 3, 7개 → 2 · 2 · 3)
    function rowSizes(n) {
        if (n <= 3) return n ? [n] : [];
        const r = n % 3;
        const head = r === 2 ? [2] : r === 1 ? [2, 2] : [];
        const rest = n - head.reduce((a, b) => a + b, 0);
        return [...head, ...Array(rest / 3).fill(3)];
    }
    const splitRows = arr => { const out = []; let i = 0; rowSizes(arr.length).forEach(k => { out.push(arr.slice(i, i + k)); i += k; }); return out; };
    // 받침이 있으면 "이라는", 없으면 "라는" (기민·기사연합이라는 · 사회민주당이라는 · 자민당이라는 …)
    const raneun = w => { const c = String(w || '').trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? '이라는' : '라는'; };
    // 각주 — 파벌이 둘 이상인 정당은 "공동교섭단체", 비교섭단체(기준 미달 · 무소속) 목록, 직접 쓴 각주
    function wikiNotes(d) {
        const notes = [], mark = new Map();
        const where = d.mode === 'both' ? '의회' : chName(d.mode);
        const seatTxt = arr => (d.chs.length > 1 ? arr.map((n, i) => `${chName(d.chs[i])} ${n}석`).join(' · ') : `${arr[0]}석`);
        [...d.gov, ...d.opp].forEach(p => {
            const fs = (p.factions || []).map(f => ({ f, s: d.chs.map(ch => seatsOf(f, ch)) })).filter(x => x.s.some(Boolean));
            if (fs.length < 2) return;
            const list = fs.map(x => `${x.f.name}(${seatTxt(x.s)})`);
            notes.push(`${list.slice(0, -1).join(', ')}과 ${list[list.length - 1]}은 ${where}에서 ${p.name}${raneun(p.name)} 공동교섭단체로 활동함.`);
            mark.set(p.id, notes.length);
        });
        const small = [...d.minor, ...d.ind];
        let smallMark = 0;
        if (d.minor.length) {
            notes.push(small.map(p => `${p.name} ${seatTxt(d.seats(p))}`).join(', ') + '.');
            smallMark = notes.length;
        }
        return { notes, mark, smallMark };
    }
    // 의석 표시: 한 원이면 "N석", 양원이면 [상원 N석 | 하원 M석]
    function seatBadge(arr, color) {
        // (회색은 #3d3d3d · #5c5c5c처럼 흔하지 않은 값으로 — 라이트 · 다크 테마가 #333 · #555 같은 인라인 회색을 테마 색으로 바꿔 버림)
        const c = color || '#5c5c5c', light = fgFor(c) !== '#fff';
        const ink = light ? '#3d3d3d' : c;
        if (arr.length < 2) return `<span class="nb-seat" style="color:${esc(ink)}">${arr[0]}석</span>`;
        return `<span class="nb-seat split"><span class="a" style="background:${esc(light ? '#5c5c5c' : c)}">${arr[0]}석</span><span class="b" style="color:${esc(ink)}">${arr[1]}석</span></span>`;
    }
    function namuBox(d) {
        const frame = S.wiki.frame || '#2b3a67', ffg = fgFor(frame);
        const { notes, mark, smallMark } = wikiNotes(d);
        const block = (p, k) => {
            const c = p.color || '#888', fg = fgFor(c);
            const sup = mark.get(p.id) ? `<sup>${mark.get(p.id)}</sup>` : '';
            return `<div class="nb-party k${k}" style="background:${esc(c)};color:${fg}" title="${esc(p.name)} ${d.seats(p).join(' | ')}석">
                ${p.logoPhoto ? (p.logoBg === 'white' ? `<span class="nb-logo-card"><img class="nb-logo" src="${esc(p.logoPhoto)}" alt=""></span>` : `<img class="nb-logo" src="${esc(p.logoPhoto)}" alt="">`) : ''}
                <div class="nb-pname">${esc(p.name)}${sup}</div>${seatBadge(d.seats(p), c)}</div>`;
        };
        const rows = arr => splitRows(arr).map(row => `<div class="nb-row" style="grid-template-columns:repeat(${row.length},1fr)">${row.map(p => block(p, row.length)).join('')}</div>`).join('');
        const group = (label, arr) => (arr.length ? `<div class="nb-sec">${label}</div>${rows(arr)}` : '');
        const small = [...d.minor, ...d.ind];
        const smallSeats = d.chs.map((ch, i) => small.reduce((a, p) => a + d.seats(p)[i], 0));
        const smallLabel = d.minor.length ? '비교섭단체' : '무소속';
        const vac = d.quotas.map((q, i) => (q && q > d.totals[i] ? q - d.totals[i] : 0));
        const legend = d.chs.length > 1 ? `<div class="nb-legend"><span class="nb-seat split"><span class="a" style="background:#6b6b6b">${esc(chName(d.chs[0]))} 의석</span><span class="b" style="color:#6b6b6b">${esc(chName(d.chs[1]))} 의석</span></span></div>` : '';
        const custom = (S.wiki.note || '').trim();
        const showNotes = notes.length || custom || legend;
        return `<div class="nbx2" style="--nb-frame:${esc(frame)};--nb-ffg:${ffg}">
            <div class="nb-head">
                <div class="nb-emblem">${d.emblem ? `<img src="${esc(d.emblem)}" alt="">` : emblemSvg(ffg)}</div><i class="nb-sep"></i>
                <div><div class="nb-nation">${esc(d.title)}</div><div class="nb-title">원내 구성</div></div>
            </div>
            <details class="nb-body" open><summary>[ 펼치기 · 접기 ]</summary>
                ${d.govName || d.period ? `<div class="nb-cab">${d.govName ? `<b>${esc(d.govName)}</b>` : ''}${d.period ? `<small>${esc(d.period)}</small>` : ''}</div>` : ''}
                ${d.gov.length ? group(d.gov.length > 1 ? '연립여당' : '여당', d.gov) + group('야당', d.opp) : group('원내 정당', d.opp)}
                ${small.length ? `<div class="nb-small">${smallLabel}${smallMark ? `<sup>${smallMark}</sup>` : ''} ${seatBadge(smallSeats, '#7f7f7f')}</div>` : ''}
                <div class="nb-total">재적 ${seatBadge(d.totals, frame)}${vac.some(Boolean) ? ` <small>(궐석 ${vac.join(' | ')})</small>` : ''}</div>
                ${showNotes ? `<div class="nb-notes">${notes.map((t, i) => `<div>${i + 1}. ${esc(t)}</div>`).join('')}${custom ? `<div>※ ${esc(custom)}</div>` : ''}${legend}</div>` : ''}
            </details>
            ${S.wiki.footer === false ? '' : '<div class="nb-foot">정당 구분 (<b>원내</b> · 원외)</div>'}
        </div>`;
    }
    // 나무위키 표 문법 — 6칸(2와 3의 공배수)을 기준으로 두 칸 줄은 <-3>, 세 칸 줄은 <-2>
    function namuMarkup(d) {
        const frame = S.wiki.frame || '#2b3a67', ffg = fgFor(frame);
        const B = "'''";
        const { notes, mark, smallMark } = wikiNotes(d);
        const chip = (bg, fg, txt) => `{{{#!wiki style="display:inline-block; background:${bg}; color:${fg}; padding:0 6px; border-radius:4px"\n${B}${txt}${B}}}}`;
        const badge = (arr, c) => {
            const light = fgFor(c) !== '#fff', ink = light ? '#333' : c;
            return arr.length < 2 ? chip('#fff', ink, `${arr[0]}석`) : chip(light ? '#555' : c, '#fff', `${arr[0]}석`) + chip('#fff', ink, `${arr[1]}석`);
        };
        const full = (bg, body) => `||<-6><bgcolor=${bg}> ${body} ||`;
        const lines = [];
        lines.push(`||<tablewidth=100%><tablebordercolor=${frame}><-6><bgcolor=${frame}> {{{${ffg} ${B}${d.title}${B}[br]{{{+2 ${B}원내 구성${B}}}}}}} ||`);
        if (d.govName || d.period) lines.push(full('#dddddd', `${d.govName ? `${B}${d.govName}${B}` : ''}${d.govName && d.period ? '[br]' : ''}${d.period ? `{{{-1 ${d.period}}}}` : ''}`));
        const group = (label, arr) => {
            if (!arr.length) return;
            lines.push(full('#dee5e5', `${B}${label}${B}`));
            splitRows(arr).forEach(row => {
                lines.push(row.map(p => {
                    const c = p.color || '#888', fg = fgFor(c);
                    const sup = mark.get(p.id) ? `[* ${notes[mark.get(p.id) - 1]}]` : '';
                    // 로고가 있으면 위키에 "정당 이름 로고.png"로 올린 그림을 쓴다
                    const file = `[[파일:${p.name} 로고.png|height=40]]`;
                    const logo = p.logoPhoto ? (p.logoBg === 'white' ? `{{{#!wiki style="display:inline-block; background:#fff; padding:4px 10px; border-radius:6px"\n${file}}}}[br]` : `${file}[br]`) : '';
                    return `||<-${6 / row.length}><bgcolor=${c}> ${logo}{{{${fg} {{{+1 ${B}${p.name}${B}}}}}}}${sup}[br]${badge(d.seats(p), c)} `;
                }).join('') + '||');
            });
        };
        if (d.gov.length) { group(d.gov.length > 1 ? '연립여당' : '여당', d.gov); group('야당', d.opp); } else group('원내 정당', d.opp);
        const small = [...d.minor, ...d.ind];
        if (small.length) {
            const smallSeats = d.chs.map((ch, i) => small.reduce((a, p) => a + d.seats(p)[i], 0));
            lines.push(full('#808080', `{{{#fff ${B}${d.minor.length ? '비교섭단체' : '무소속'}${B}}}}${smallMark ? `[* ${notes[smallMark - 1]}]` : ''} ${badge(smallSeats, '#808080')}`));
        }
        lines.push(full(frame, `{{{${ffg} ${B}재적${B}}}} ${badge(d.totals, frame)}`));
        const custom = (S.wiki.note || '').trim();
        if (custom || d.chs.length > 1) lines.push(full('#f2f2f2', `{{{-1 ${[custom ? `※ ${custom}` : '', d.chs.length > 1 ? chip('#666', '#fff', `${chName(d.chs[0])} 의석`) + chip('#fff', '#666', `${chName(d.chs[1])} 의석`) : ''].filter(Boolean).join('[br]')}}}}`));
        if (S.wiki.footer !== false) lines.push(full('#ffffff', `정당 구분 (${B}원내${B} · 원외)`));
        return lines.join('\n');
    }
    // 오른쪽 시각 화면 "위키 틀" 탭 — 틀 미리보기
    function renderWikiPreview() {
        const wrap = document.getElementById('t64WikiWrap');
        if (!wrap) return;
        if (!wikiModes().includes(ui.wikiChamber)) ui.wikiChamber = wikiModes()[0];
        wrap.innerHTML = `<div class="t64-wikiwrap">${namuBox(wikiData(ui.wikiChamber))}</div>`;
    }
    function showWikiTab() {
        const btn = document.getElementById('dispTabWiki');
        if (btn) btn.style.display = '';
        try { switchDispTab('wiki'); } catch (e) { /* 시각 화면 없음 */ }
        renderWikiPreview();
    }
    // 왼쪽 의회 › 위키 틀 — 설정 · 문법 복사. 고친 내용은 오른쪽 "위키 틀" 탭에 바로 보인다
    function renderWikibox() {
        const box = document.getElementById('contentWikibox');
        renderWikiPreview();
        if (!box) return;
        const modes = wikiModes();
        if (!modes.includes(ui.wikiChamber)) ui.wikiChamber = modes[0];
        const d = wikiData(ui.wikiChamber);
        const auto = (() => { const pmn = pmName(); return pmn ? `${pmn} 내각` : '예: 콜 내각'; })();
        box.innerHTML = `<div class="t64-intro">위키 문서의 "원내 구성" 틀을 만듭니다. 정당 · 연정(집권) · 의석에서 자동으로 채워지고, 미리보기는 오른쪽 시각 화면 "위키 틀" 탭에 바로 보여요.</div>
            ${modes.length > 1 ? `<div class="system-radio-group t64-tabs">${modes.map(c => `<button type="button" class="system-radio-btn ${ui.wikiChamber === c ? 'active' : ''}" data-wch="${c}">${esc(c === 'both' ? '양원' : chName(c))}</button>`).join('')}</div>` : ''}
            ${ui.wikiChamber === 'both' ? `<div class="t64-dim t64-small" style="margin:-4px 0 8px">정당마다 [${esc(chName('senate'))} | ${esc(chName('house'))}] 의석을 나란히 적어요.</div>` : ''}
            <div class="t64-actions">
                <button type="button" class="t64-btn primary" data-act="copy">📋 위키 문법 복사</button>
                <button type="button" class="t64-btn" data-act="showwiki">오른쪽에서 보기</button>
                <button type="button" class="t64-btn" data-act="img">🖼 반원 그림 저장</button>
            </div>
            <div class="t64-card t64-wk-form">
                <div class="t64-card-head"><b>틀 머리</b></div>
                <div class="t64-field"><span>제목</span><input type="text" data-w="title" value="${esc(S.wiki.title || '')}" placeholder="${esc(d.title)}"></div>
                <div class="t64-field"><span>머리 색</span><input type="color" data-w="frame" value="${esc(S.wiki.frame || '#2b3a67')}"><button type="button" class="t64-btn" data-frame="#ffffff">흰색</button><button type="button" class="t64-btn" data-frame="#2b3a67">남색</button></div>
                <div class="t64-card-head" style="margin-top:10px"><b>내각</b></div>
                <div class="t64-field"><span>이름</span><input type="text" data-w="govName" value="${esc(S.wiki.govName || '')}" placeholder="${esc(auto)}"></div>
                <div class="t64-field"><span>기간</span><input type="text" data-w="termStart" value="${esc(S.wiki.termStart || '')}" placeholder="시작 예: 1982.10.01"><span>~</span><input type="text" data-w="termEnd" value="${esc(S.wiki.termEnd || '')}" placeholder="비우면 현재"></div>
                <div class="t64-card-head" style="margin-top:10px"><b>정당 구분</b></div>
                <div class="t64-field"><span>교섭단체 기준</span><input type="number" min="0" data-w="groupMin" value="${Number(S.wiki.groupMin) || 0}" style="width:5em"><span class="t64-dim">석 미만은 비교섭단체 (0이면 무소속만)</span></div>
                <div class="t64-field"><span>각주</span><input type="text" data-w="note" value="${esc(S.wiki.note || '')}" placeholder="직접 쓰는 설명 (※로 붙음)"></div>
                <label class="t64-field" style="cursor:pointer"><input type="checkbox" data-w="footer" ${S.wiki.footer === false ? '' : 'checked'}><span>맨 아래 "정당 구분 (원내 · 원외)" 줄</span></label>
                <div class="t64-dim t64-small">엠블럼은 의회 › 의회 설정의 로고(없으면 국기), 정당 로고는 의회 › 정당 › 로고에서 정해요. 파벌이 둘 이상인 정당은 각주에 공동교섭단체로 적혀요.</div>
            </div>
            <details class="t64-fold"><summary>위키 문법 보기</summary><textarea class="t64-markup" readonly>${esc(namuMarkup(d))}</textarea><div class="t64-dim t64-small">로고가 있는 정당은 [[파일:정당 이름 로고.png]]로 들어가요 — 위키에 그 이름으로 로고 그림을 올리면 그대로 보여요.</div></details>`;
        box.querySelectorAll('[data-wch]').forEach(b => { b.onclick = () => { ui.wikiChamber = b.dataset.wch; renderWikibox(); showWikiTab(); }; });
        box.querySelectorAll('[data-w]').forEach(i => {
            const k = i.dataset.w;
            const apply = () => { S.wiki[k] = i.type === 'checkbox' ? i.checked : k === 'groupMin' ? Math.max(0, Number(i.value) || 0) : i.value.trim(); };
            if (i.type === 'text' || i.type === 'color') i.oninput = () => { apply(); renderWikiPreview(); };
            i.onchange = () => { apply(); renderWikibox(); };
        });
        box.querySelectorAll('[data-frame]').forEach(b => { b.onclick = () => { S.wiki.frame = b.dataset.frame; renderWikibox(); }; });
        box.querySelector('[data-act="showwiki"]').onclick = showWikiTab;
        box.querySelector('[data-act="copy"]').onclick = async () => {
            const text = namuMarkup(wikiData(ui.wikiChamber));
            try { await navigator.clipboard.writeText(text); showCustomAlert('위키 문법을 복사했습니다.'); }
            catch (e) { const ta = box.querySelector('.t64-markup'); if (ta) { ta.closest('details').open = true; ta.select(); } showCustomAlert('복사하지 못했습니다 — "위키 문법 보기"에서 직접 복사하세요.'); }
        };
        box.querySelector('[data-act="img"]').onclick = () => {
            const url = hemicycleImage(d.main, 600);
            if (!url) { showCustomAlert('반원 그림을 만들 수 없습니다.'); return; }
            const a = document.createElement('a');
            a.href = url; a.download = `${(d.title || 'hemicycle').replace(/[\\/:*?"<>|]/g, '_')}.png`;
            document.body.appendChild(a); a.click(); a.remove();
        };
    }

    // ================= 세계 › 진영 =================
    //   S.blocs: [{ id, name, color, desc, ideologies:[{ id, name }] }] — 국가 순위의 국가마다 진영 · 하위 이념을 고른다
    function defaultBlocs() {
        const mk = (id, name, color, desc, ideos) => ({ id, name, color, desc, ideologies: ideos.map(n => ({ id: uid(), name: n })) });
        return [
            mk('west', '서방 진영', '#3b82f6', '자유 시장 · 의회 민주주의 · 북대서양 동맹', ['자유민주주의', '보수주의', '사회민주주의', '기독교 민주주의']),
            mk('east', '동구권', '#dc2626', '계획 경제 · 일당 체제 · 바르샤바 조약', ['마르크스-레닌주의', '스탈린주의', '마오쩌둥 사상', '주체사상']),
            mk('nonaligned', '비동맹', '#a3a3a3', '어느 진영에도 속하지 않는 제3세계', ['티토주의', '아랍 사회주의', '제3세계주의']),
            mk('other', '기타', '#a16207', '', []),
        ];
    }
    const blocOf = k => S.blocs.find(b => b.id === k) || { id: '', name: '미분류', color: '#777', ideologies: [] };
    const ideoOf = (b, id) => (b.ideologies || []).find(x => x.id === id) || null;
    function renderBlocs() {
        const box = document.getElementById('contentBlocs');
        if (!box) return;
        const rows = S.ranking.rows;
        const total = Math.max(1, rows.length);
        const members = b => rows.filter(r => r.bloc === b.id);
        const unassigned = rows.filter(r => !S.blocs.some(b => b.id === r.bloc));
        box.innerHTML = `<div class="t64-intro">진영을 만들고 색 · 설명 · 하위 이념을 정합니다. 세계 › 국가 순위에서 나라마다 진영과 하위 이념을 고를 수 있어요. (꾸밈용 — 게임 기능에는 영향 없음)</div>
            <div class="t64-card">
                <div class="t64-card-head"><b>진영 구도</b><span class="t64-dim">국가 ${rows.length}개</span></div>
                <div class="t64-bloc-bar">${S.blocs.map(b => { const n = members(b).length; return n ? `<span style="width:${n / total * 100}%;background:${esc(b.color)}" title="${esc(b.name)} ${n}개국"></span>` : ''; }).join('')}${unassigned.length ? `<span style="width:${unassigned.length / total * 100}%;background:#777" title="미분류 ${unassigned.length}개국"></span>` : ''}</div>
                <div class="t64-legend">${S.blocs.map(b => `<span>${dotHtml(b.color)}${esc(b.name)} ${members(b).length}</span>`).join('')}${unassigned.length ? `<span>${dotHtml('#777')}미분류 ${unassigned.length}</span>` : ''}</div>
            </div>
            ${S.blocs.map(b => {
                const ms = members(b).slice().sort((x, y) => (Number(y.score) || 0) - (Number(x.score) || 0));
                return `<div class="t64-bloc" style="--bloc:${esc(b.color)}">
                    <div class="t64-bloc-head">
                        <input type="color" value="${esc(/^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '#888888')}" data-bc="${esc(b.id)}" title="진영 색">
                        <input type="text" class="t64-bloc-name" value="${esc(b.name)}" data-bn="${esc(b.id)}" placeholder="진영 이름">
                        <button type="button" class="t64-x" data-bdel="${esc(b.id)}" title="진영 지우기">×</button>
                    </div>
                    <input type="text" class="t64-bloc-desc" value="${esc(b.desc || '')}" data-bd="${esc(b.id)}" placeholder="설명 (예: 계획 경제 · 일당 체제)">
                    <div class="t64-sub-title">하위 이념</div>
                    <div class="t64-chips">${(b.ideologies || []).map(x => `<span class="t64-ichip">${esc(x.name)} <small>${rows.filter(r => r.bloc === b.id && r.ideo === x.id).length || ''}</small><button type="button" data-idel="${esc(b.id)}|${esc(x.id)}" title="지우기">×</button></span>`).join('') || '<span class="t64-dim">없음</span>'}</div>
                    <div class="t64-succ-row"><input type="text" placeholder="하위 이념 추가" data-iadd="${esc(b.id)}"><button type="button" class="t64-btn" data-iaddbtn="${esc(b.id)}">추가</button></div>
                    <div class="t64-dim t64-small">소속 국가: ${ms.length ? ms.map(r => esc(rowName(r))).join(', ') : '없음'}</div>
                </div>`;
            }).join('')}
            <div class="t64-actions"><button type="button" class="t64-btn primary" data-act="addbloc">+ 진영 추가</button><button type="button" class="t64-btn" data-act="resetblocs">처음 진영으로</button></div>`;
        const B = id => S.blocs.find(b => b.id === id);
        box.querySelectorAll('[data-bc]').forEach(i => { i.onchange = () => { const b = B(i.dataset.bc); if (b) { b.color = i.value; renderBlocs(); renderRanking(); } }; });
        box.querySelectorAll('[data-bn]').forEach(i => { i.onchange = () => { const b = B(i.dataset.bn); if (b) { b.name = i.value.trim() || b.name; renderBlocs(); renderRanking(); } }; });
        box.querySelectorAll('[data-bd]').forEach(i => { i.onchange = () => { const b = B(i.dataset.bd); if (b) b.desc = i.value.trim(); }; });
        box.querySelectorAll('[data-bdel]').forEach(btn => {
            btn.onclick = () => {
                const b = B(btn.dataset.bdel); if (!b) return;
                const n = members(b).length;
                showCustomConfirm(`"${b.name}" 진영을 지울까요?${n ? `\n소속 국가 ${n}개는 미분류가 됩니다.` : ''}`, () => {
                    S.blocs = S.blocs.filter(x => x !== b);
                    S.ranking.rows.forEach(r => { if (r.bloc === b.id) { r.bloc = ''; r.ideo = ''; } });
                    renderBlocs(); renderRanking();
                });
            };
        });
        const addIdeo = id => {
            const inp = box.querySelector(`[data-iadd="${CSS.escape(id)}"]`), b = B(id);
            const name = inp ? inp.value.trim() : '';
            if (!b || !name) return;
            (b.ideologies = b.ideologies || []).push({ id: uid(), name });
            renderBlocs(); renderRanking();
        };
        box.querySelectorAll('[data-iaddbtn]').forEach(btn => { btn.onclick = () => addIdeo(btn.dataset.iaddbtn); });
        box.querySelectorAll('[data-iadd]').forEach(inp => { inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addIdeo(inp.dataset.iadd); } }; });
        box.querySelectorAll('[data-idel]').forEach(btn => {
            btn.onclick = () => {
                const [bid, iid] = btn.dataset.idel.split('|'); const b = B(bid); if (!b) return;
                b.ideologies = (b.ideologies || []).filter(x => x.id !== iid);
                S.ranking.rows.forEach(r => { if (r.bloc === bid && r.ideo === iid) r.ideo = ''; });
                renderBlocs(); renderRanking();
            };
        });
        box.querySelector('[data-act="addbloc"]').onclick = () => {
            const palette = ['#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'];
            S.blocs.push({ id: uid(), name: `새 진영 ${S.blocs.length + 1}`, color: palette[S.blocs.length % palette.length], desc: '', ideologies: [] });
            renderBlocs(); renderRanking();
        };
        box.querySelector('[data-act="resetblocs"]').onclick = () => showCustomConfirm('진영을 처음 목록(서방 · 동구권 · 비동맹 · 기타)으로 되돌릴까요?\n고친 진영과 하위 이념은 사라지고, 없는 진영의 국가는 미분류가 됩니다.', () => {
            S.blocs = defaultBlocs();
            S.ranking.rows.forEach(r => { if (!S.blocs.some(b => b.id === r.bloc)) r.bloc = ''; r.ideo = ''; });
            renderBlocs(); renderRanking();
        });
    }

    // ================= 세계 › 국가 순위 — 냉전 국가 순위 (꾸밈용) =================
    // selfName: 우리나라 이름 — 목록에 있는 나라(예: 서독 튜토리얼의 "독일연방공화국")면 그 줄을 우리나라 줄이 대신한다 (같은 나라가 두 번 나오지 않게)
    // (처음 읽힐 때 fresh()가 이름 없이 부르므로, 이름이 있을 때만 아래쪽 FLAG_BY_NAME을 쓴다)
    function defaultRanking(selfName) {
        const rows = [
            ['미합중국', '🇺🇸', 'west', 100], ['소비에트 연방', '☭', 'east', 96], ['서독', '🇩🇪', 'west', 74], ['일본', '🇯🇵', 'west', 72], ['영국', '🇬🇧', 'west', 70],
            ['프랑스', '🇫🇷', 'west', 68], ['중화인민공화국', '🇨🇳', 'east', 62], ['동독', '⚒', 'east', 52], ['인도', '🇮🇳', 'nonaligned', 46], ['유고슬라비아', '★', 'nonaligned', 40],
        ].map(([name, flag, bloc, score]) => ({ id: uid(), name, flag, flagKey: '', flagImg: '', bloc, ideo: '', score, prevRank: null, self: false }));
        const selfKey = selfName ? FLAG_BY_NAME[selfName] : null;
        const twin = selfKey ? rows.find(r => FLAG_BY_NAME[r.name] === selfKey) : null;
        if (twin) rows.splice(rows.indexOf(twin), 1);
        rows.push({ id: uid(), name: '', flag: '', bloc: twin ? twin.bloc : 'west', score: twin ? twin.score : 50, prevRank: null, self: true });
        return { title: '냉전 국가 순위', rows };
    }
    const rowName = r => (r.self ? (nationName() || '우리나라') : r.name);
    const ranked = () => S.ranking.rows.slice().sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
    // 기본 국기 — 간단히 그린 SVG (이모지 국기는 Windows에서 글자로만 보여서). 직접 올린 그림(flagImg)이 있으면 그쪽을 쓴다
    const star = (cx, cy, r, fill, rot = -90) => `<polygon fill="${fill}" points="${Array.from({ length: 10 }, (_, i) => { const a = (rot + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.4 : r; return `${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`; }).join(' ')}"/>`;
    const hband = cols => cols.map((c, i) => `<rect y="${i * 20 / cols.length}" width="30" height="${20 / cols.length + 0.05}" fill="${c}"/>`).join('');
    const vband = cols => cols.map((c, i) => `<rect x="${i * 10}" width="10.05" height="20" fill="${c}"/>`).join('');
    const FLAG_SVG = {
        us: () => `${Array.from({ length: 13 }, (_, i) => `<rect y="${i * 20 / 13}" width="30" height="${20 / 13 + 0.05}" fill="${i % 2 ? '#fff' : '#b22234'}"/>`).join('')}<rect width="12" height="10.77" fill="#3c3b6e"/>${Array.from({ length: 20 }, (_, i) => `<circle cx="${1.2 + (i % 5) * 2.4 + (Math.floor(i / 5) % 2) * 1.2}" cy="${1.3 + Math.floor(i / 5) * 2.6}" r=".45" fill="#fff"/>`).join('')}`,
        su: () => `<rect width="30" height="20" fill="#cc0000"/>${star(5.5, 2.6, 1.1, 'none')}<polygon points="5.5,1.4 5.85,2.3 6.8,2.3 6.05,2.85 6.35,3.75 5.5,3.2 4.65,3.75 4.95,2.85 4.2,2.3 5.15,2.3" fill="none" stroke="#ffd700" stroke-width=".3"/><path d="M4.2 7.6 A2.2 2.2 0 1 0 7.4 4.6" fill="none" stroke="#ffd700" stroke-width=".8"/><path d="M4 4.6 L7.6 8.2" stroke="#ffd700" stroke-width=".8"/><rect x="3.4" y="4" width="1.6" height=".8" fill="#ffd700" transform="rotate(45 4.2 4.4)"/>`,
        de: () => hband(['#000', '#dd0000', '#ffce00']),
        jp: () => `<rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#bc002d"/>`,
        gb: () => `<rect width="30" height="20" fill="#012169"/><path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0 L30 20 M30 0 L0 20" stroke="#c8102e" stroke-width="1.4"/><path d="M15 0 V20 M0 10 H30" stroke="#fff" stroke-width="6"/><path d="M15 0 V20 M0 10 H30" stroke="#c8102e" stroke-width="3.4"/>`,
        fr: () => vband(['#002395', '#fff', '#ed2939']),
        cn: () => `<rect width="30" height="20" fill="#de2910"/>${star(5, 5, 3, '#ffde00')}${star(10, 2, 1, '#ffde00', -60)}${star(12, 4, 1, '#ffde00', -75)}${star(12, 7, 1, '#ffde00', -100)}${star(10, 9, 1, '#ffde00', -120)}`,
        dd: () => `${hband(['#000', '#dd0000', '#ffce00'])}<circle cx="15" cy="10" r="3.6" fill="#ffce00" stroke="#7a4b00" stroke-width=".4"/><path d="M13.2 10.6 L15 8 L16.8 10.6 M15 8 V12" stroke="#000" stroke-width=".7" fill="none"/>`,
        in: () => `${hband(['#ff9933', '#fff', '#138808'])}<circle cx="15" cy="10" r="2.3" fill="none" stroke="#000080" stroke-width=".5"/><circle cx="15" cy="10" r=".5" fill="#000080"/>`,
        yu: () => `${hband(['#003893', '#fff', '#de0000'])}${star(15, 10, 4.6, '#fcd116')}${star(15, 10, 4, '#de0000')}`,
    };
    const FLAG_BY_NAME = { '미합중국': 'us', '미국': 'us', '소비에트 연방': 'su', '소련': 'su', '서독': 'de', '독일': 'de', '독일연방공화국': 'de', 'West Germany': 'de', 'Federal Republic of Germany': 'de', '일본': 'jp', '영국': 'gb', '프랑스': 'fr', '중화인민공화국': 'cn', '중국': 'cn', '동독': 'dd', '인도': 'in', '유고슬라비아': 'yu' };
    const flagCache = {};
    const builtinFlag = key => {
        if (!FLAG_SVG[key]) return '';
        if (!flagCache[key]) flagCache[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="30" height="20">${FLAG_SVG[key]()}</svg>`);
        return flagCache[key];
    };
    function flagSrc(r) {
        if (r.self) return (typeof nationFlag !== 'undefined' && nationFlag) || '';
        return r.flagImg || builtinFlag(r.flagKey || FLAG_BY_NAME[String(r.name || '').trim()]);
    }
    function flagHtml(r) {
        const src = flagSrc(r);
        if (src) return `<img class="t64-rk-flagimg" src="${esc(src)}" alt="">`;
        return `<span class="t64-rk-flag">${esc(r.flag || '🏳')}</span>`;
    }
    // 올린 그림은 90×60 안으로 줄여 저장 (세이브가 커지지 않게)
    function shrinkImage(file, done) {
        const rd = new FileReader();
        rd.onload = ev => {
            const img = new Image();
            img.onload = () => {
                const k = Math.min(1, 90 / img.width, 60 / img.height);
                const c = document.createElement('canvas');
                c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
                c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
                try { done(c.toDataURL('image/png')); } catch (e) { done(ev.target.result); }
            };
            img.onerror = () => done(ev.target.result);
            img.src = ev.target.result;
        };
        rd.readAsDataURL(file);
    }
    // 오른쪽 시각 화면 "국가 순위" 탭 — 보는 화면 (꾸밈용 순위표)
    function renderRankBoard() {
        const wrap = document.getElementById('t64RankWrap');
        if (!wrap) return;
        const list = ranked();
        const counts = S.blocs.map(b => [b, S.ranking.rows.filter(r => r.bloc === b.id).length]);
        const title = document.getElementById('t64RankTitle');
        if (title) title.textContent = S.ranking.title || '냉전 국가 순위';
        wrap.innerHTML = list.length ? `<div class="t64-rk">
                <div class="t64-rk-title">${esc(S.ranking.title || '냉전 국가 순위')}</div>
                <div class="t64-rk-blocs">${counts.map(([b, n]) => (n ? `<span><i style="background:${esc(b.color)}"></i>${esc(b.name)} ${n}</span>` : '')).join('')}</div>
                ${list.map((r, i) => {
                    const rank = i + 1, b = blocOf(r.bloc);
                    const mv = r.prevRank ? r.prevRank - rank : 0;
                    const ideo = ideoOf(b, r.ideo);
                    return `<div class="t64-rk-row${r.self ? ' self' : ''}" style="--bloc:${esc(b.color)}" title="${esc(b.name)}${ideo ? ' · ' + esc(ideo.name) : ''}">
                        <span class="t64-rk-no">${rank}</span>${flagHtml(r)}
                        <span class="t64-rk-name">${esc(rowName(r))}${ideo ? `<small class="t64-rk-ideo">${esc(ideo.name)}</small>` : ''}</span>
                        <span class="t64-rk-bar"><span style="width:${Math.max(2, Math.min(100, Number(r.score) || 0))}%"></span></span>
                        <span class="t64-rk-score">${Number(r.score) || 0}</span>
                        <span class="t64-rk-mv ${mv > 0 ? 'up' : mv < 0 ? 'down' : ''}">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : r.prevRank ? '–' : ''}</span>
                    </div>`;
                }).join('')}
            </div>` : '<div class="t64-empty"><div class="t64-empty-icon">🌐</div>순위에 나라가 없습니다.<br>왼쪽 세계 › 국가 순위에서 "+ 국가 추가"를 눌러 보세요.</div>';
    }
    function showRankTab() {
        const btn = document.getElementById('dispTabRanking');
        if (btn) btn.style.display = '';
        try { switchDispTab('ranking'); } catch (e) { /* 시각 화면 없음 */ }
        renderRankBoard();
    }
    // 왼쪽 세계 › 국가 순위 — 고치는 화면. 입력하는 동안은 오른쪽 순위표만 바로 다시 그리고,
    // 왼쪽 목록은 입력을 마쳤을 때(또는 ± 연타가 멈췄을 때) 순위대로 다시 줄 세운다 (쓰는 중에 줄이 움직이지 않게)
    let rankResort = 0;
    function renderRanking() {
        const box = document.getElementById('contentRanking');
        renderRankBoard();
        if (!box) return;
        clearTimeout(rankResort);
        const list = ranked();
        const blocOpts = r => `${S.blocs.map(b => `<option value="${esc(b.id)}" ${r.bloc === b.id ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}<option value="" ${S.blocs.some(b => b.id === r.bloc) ? '' : 'selected'}>미분류</option>`;
        const ideoOpts = r => `<option value="">하위 이념 —</option>${blocOf(r.bloc).ideologies.map(x => `<option value="${esc(x.id)}" ${r.ideo === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}`;
        box.innerHTML = `<div class="t64-intro">꾸밈용 화면입니다 — 게임 기능에는 영향이 없어요. 고친 내용은 오른쪽 시각 화면 "국가 순위" 탭에 바로 보여요.</div>
            <div class="t64-card t64-re-head">
                <div class="t64-field"><span>제목</span><input type="text" data-rt="title" value="${esc(S.ranking.title)}" placeholder="냉전 국가 순위"></div>
                <div class="t64-actions">
                    <button type="button" class="t64-btn primary" data-act="addrow">+ 국가 추가</button>
                    <button type="button" class="t64-btn" data-act="mark" title="지금 순위를 기준으로 저장 — 점수를 바꾸면 순위표에 ▲▼로 변동이 보여요">순위 기준 저장</button>
                    <button type="button" class="t64-btn" data-act="showrank">오른쪽에서 보기</button>
                    <button type="button" class="t64-btn" data-act="reset">처음 목록으로</button>
                </div>
            </div>
            <div class="t64-re-hint">국기 칸을 누르면 그림을 올려요 · 점수는 ± 또는 직접 입력 · 진영을 바꾸면 하위 이념이 비워져요</div>
            <div class="t64-re-list">
            ${list.map((r, i) => {
                const b = blocOf(r.bloc);
                return `<div class="t64-re-row${r.self ? ' self' : ''}" style="--bloc:${esc(b.color)}" data-row="${r.id}">
                    <span class="t64-re-no">${i + 1}</span>
                    ${r.self ? `<span class="t64-re-flag self" title="국가 › 상징의 국기">${flagHtml(r)}</span>` : `<label class="t64-re-flag" title="눌러서 국기 그림 고르기">${flagHtml(r)}<input type="file" accept="image/*" data-rflag="${r.id}" hidden>${r.flagImg ? `<button type="button" class="t64-re-unflag" data-unflag="${r.id}" title="올린 국기 빼기">×</button>` : ''}</label>`}
                    <input type="text" class="t64-re-name" data-rf="name" data-id="${r.id}" value="${esc(r.self ? rowName(r) : r.name)}" ${r.self ? 'disabled title="국가 › 상징의 국가명 — 우리나라"' : 'placeholder="국가 이름"'}>
                    <span class="t64-re-score"><button type="button" data-step="-1" data-id="${r.id}" title="1점 내리기">−</button><input type="number" data-rf="score" data-id="${r.id}" value="${Number(r.score) || 0}" min="0" max="999"><button type="button" data-step="1" data-id="${r.id}" title="1점 올리기">+</button></span>
                    ${r.self ? '<span class="t64-re-me" title="우리나라 — 이름 · 국기는 국가 › 상징에서 바꿔요">★</span>' : `<button type="button" class="t64-x" data-rdel="${r.id}" title="지우기">×</button>`}
                    <span class="t64-re-meta">
                        <select data-rf="bloc" data-id="${r.id}" title="진영">${blocOpts(r)}</select>
                        <select data-rf="ideo" data-id="${r.id}" title="하위 이념" ${b.ideologies.length ? '' : 'disabled'}>${ideoOpts(r)}</select>
                    </span>
                </div>`;
            }).join('')}
            </div>`;
        const at = id => S.ranking.rows.find(x => x.id === id);
        const resortSoon = () => { clearTimeout(rankResort); rankResort = setTimeout(renderRanking, 900); };
        box.querySelectorAll('[data-rf]').forEach(i => {
            const f = i.dataset.rf;
            const apply = () => {
                const r = at(i.dataset.id); if (!r) return false;
                if (f === 'name' && !r.flagKey && FLAG_BY_NAME[r.name]) r.flagKey = FLAG_BY_NAME[r.name]; // 이름을 바꿔도 기본 국기는 그대로
                r[f] = f === 'score' ? Math.max(0, Math.min(999, Number(i.value) || 0)) : i.value.trim();
                return r;
            };
            // 이름 · 점수는 치는 대로 오른쪽 순위표에 반영
            if (f === 'name' || f === 'score') i.oninput = () => { if (apply()) renderRankBoard(); };
            i.onchange = () => {
                const r = apply(); if (!r) return;
                if (f === 'bloc') r.ideo = '';
                renderRanking();
                if (f === 'bloc') renderBlocs();
            };
        });
        box.querySelectorAll('[data-step]').forEach(b => {
            b.onclick = () => {
                const r = at(b.dataset.id); if (!r) return;
                r.score = Math.max(0, Math.min(999, (Number(r.score) || 0) + Number(b.dataset.step)));
                const inp = box.querySelector(`input[data-rf="score"][data-id="${r.id}"]`);
                if (inp) inp.value = r.score;
                renderRankBoard();
                resortSoon();
            };
        });
        box.querySelectorAll('[data-rflag]').forEach(i => {
            i.onchange = () => { const f = i.files && i.files[0]; const r = at(i.dataset.rflag); if (!f || !r) return; shrinkImage(f, url => { r.flagImg = url; renderRanking(); }); };
        });
        box.querySelectorAll('[data-unflag]').forEach(b => { b.onclick = e => { e.preventDefault(); e.stopPropagation(); const r = at(b.dataset.unflag); if (r) { r.flagImg = ''; renderRanking(); } }; });
        const titleIn = box.querySelector('[data-rt="title"]');
        titleIn.oninput = () => { S.ranking.title = titleIn.value.trim(); renderRankBoard(); };
        box.querySelectorAll('[data-rdel]').forEach(b => {
            b.onclick = () => {
                const r = at(b.dataset.rdel); if (!r) return;
                showCustomConfirm(`"${rowName(r)}"을(를) 순위에서 지울까요?`, () => { S.ranking.rows = S.ranking.rows.filter(x => x.id !== r.id); renderRanking(); renderBlocs(); });
            };
        });
        box.querySelector('[data-act="addrow"]').onclick = () => {
            const r = { id: uid(), name: '새 국가', flag: '🏳', flagKey: '', flagImg: '', bloc: (S.blocs[S.blocs.length - 1] || {}).id || '', ideo: '', score: 30, prevRank: null, self: false };
            S.ranking.rows.push(r);
            renderRanking(); renderBlocs();
            const inp = box.querySelector(`input[data-rf="name"][data-id="${r.id}"]`);
            if (inp) { inp.focus(); inp.select(); inp.scrollIntoView({ block: 'nearest' }); }
        };
        box.querySelector('[data-act="mark"]').onclick = () => { ranked().forEach((r, i) => { r.prevRank = i + 1; }); renderRanking(); };
        box.querySelector('[data-act="showrank"]').onclick = showRankTab;
        box.querySelector('[data-act="reset"]').onclick = () => showCustomConfirm('국가 순위를 처음 목록으로 되돌릴까요?', () => { S.ranking = defaultRanking(nationName()); renderRanking(); renderBlocs(); });
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
    // 오른쪽 시각 화면 탭 "국가 순위" — 세계 › 국가 순위에서 고친 순위표를 크게 본다
    (function addRankDispTab() {
        const after = document.getElementById('dispTabTimeline') || document.getElementById('dispTabCabinet');
        if (!after) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabRanking" data-tab="ranking" onclick="switchDispTab('ranking')" style="display:none;"><span class="disp-tab-label">국가 순위</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('ranking')">×</span></button>`), after.nextSibling);
        const ref = document.getElementById('dispPanelTimeline') || document.getElementById('dispPanelCabinet');
        if (!ref) return;
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelRanking"><div class="chamber-box t64-rank-box">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><h3 style="margin:0;border:none;padding:0;"><span class="tno-prompt">&gt; </span><span id="t64RankTitle">국가 순위</span></h3></div>
            <div id="t64RankWrap"></div></div></div>`), ref.nextSibling);
    })();
    // 오른쪽 시각 화면 탭 "위키 틀" — 원내 구성 틀 미리보기
    (function addWikiDispTab() {
        const after = document.getElementById('dispTabTimeline') || document.getElementById('dispTabCabinet');
        if (!after) return;
        after.parentElement.insertBefore(el(`<button class="disp-tab-btn" id="dispTabWiki" data-tab="wiki" onclick="switchDispTab('wiki')" style="display:none;"><span class="disp-tab-label">위키 틀</span><span class="disp-tab-close" onclick="event.stopPropagation();closeDispTab('wiki')">×</span></button>`), after.nextSibling);
        const ref = document.getElementById('dispPanelTimeline') || document.getElementById('dispPanelCabinet');
        if (!ref) return;
        ref.parentElement.insertBefore(el(`<div class="disp-panel" id="dispPanelWiki"><div class="chamber-box">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;"><h3 style="margin:0;border:none;padding:0;"><span class="tno-prompt">&gt; </span>위키 틀</h3></div>
            <div id="t64WikiWrap"></div></div></div>`), ref.nextSibling);
    })();
    addTab('mainContentSetup', 'subTabTimeline', 'setup', 'wikibox', 'Wikibox', '위키 틀');
    // 세계 (1.6.4) — 국가 아래 새 메인 메뉴: 국가 순위 · 진영
    (function addWorldMain() {
        const nationBtn = document.getElementById('mainTabNation'), nationContent = document.getElementById('mainContentNation');
        if (!nationBtn || !nationContent) return;
        // 경제 — 자리 · 색만 잡아 둔 잠긴 메뉴 (국가 다음, 세계 앞). 누르면 안내만 뜬다
        const eco = el(`<button class="main-tab-btn" onclick="t64EconomyLocked()" id="mainTabEconomy" title="경제 — 1.6.9 업데이트에서 열립니다">💹 경제 🔒</button>`);
        nationBtn.parentElement.insertBefore(eco, nationBtn.nextSibling);
        nationBtn.parentElement.insertBefore(el(`<button class="main-tab-btn" onclick="switchMainTab('world')" id="mainTabWorld">🌐 세계</button>`), eco.nextSibling);
        nationContent.parentElement.insertBefore(el(`<div id="mainContentWorld" class="main-tab-content"><div class="sub-tab-container"></div></div>`), nationContent.nextSibling);
        try { if (!currentSubTab.world) currentSubTab.world = 'ranking'; } catch (e) { /* main.js 없음 */ }
    })();
    const origSetLogoBg = window.setLogoBg;
    if (typeof origSetLogoBg === 'function') window.setLogoBg = function () { const r = origSetLogoBg.apply(this, arguments); try { renderWikiPreview(); } catch (e) { /* 아직 없음 */ } return r; };
    window.t64EconomyLocked = () => { try { showCustomAlert('🔒 경제 메뉴는 아직 잠겨 있어요 — 1.6.9 "보이지 않는 손" 업데이트에서 경제 시스템과 함께 열립니다.'); } catch (e) { /* 알림 없음 */ } };
    addTab('mainContentWorld', null, 'world', 'ranking', 'Ranking', '국가 순위');
    addTab('mainContentWorld', 'subTabRanking', 'world', 'blocs', 'Blocs', '진영');
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'setup' && sub === 'timeline') { renderTimeline(); showHistoryTab(); }
        if (main === 'setup' && sub === 'wikibox') { renderWikibox(); showWikiTab(); }
        if (main === 'world' && sub === 'ranking') { renderRanking(); showRankTab(); }
        if (main === 'world' && sub === 'blocs') { renderBlocs(); showRankTab(); }
        return r;
    };
    const origDisp = window.switchDispTab;
    window.switchDispTab = function (tab) {
        const r = origDisp.apply(this, arguments);
        if (tab === 'timeline') setTimeout(renderHistory, 30);
        if (tab === 'ranking') renderRankBoard();
        if (tab === 'wiki') renderWikiPreview();
        return r;
    };
    let resizeTimer = 0;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (document.getElementById('dispPanelTimeline')?.classList.contains('active')) renderHistory(); }, 150); });
    function refresh() { renderTimeline(); renderWikibox(); renderRanking(); renderBlocs(); }
    // ================= 우클릭 내보내기 (세력 변화 도표 · 위키 틀 · 국가 순위) =================
    // 본 화면의 우클릭 "내보내기..." 메뉴 · 옵션 창(PNG · JPG · SVG, 해상도)을 그대로 쓰고, 그림은 여기서 그린다.
    // 위키 틀 · 국가 순위는 HTML이라 <foreignObject>로 담으면 Chromium이 캔버스를 오염시켜 PNG로 못 뽑으므로,
    // 같은 모양을 SVG 도형으로 다시 그린다 (국기 · 로고는 data: 그림이라 SVG 안에서도 그려짐)
    const X = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const FONT = "Pretendard, 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
    const measureCtx = document.createElement('canvas').getContext('2d');
    const textW = (t, size, weight = 400) => { measureCtx.font = `${weight} ${size}px ${FONT}`; return measureCtx.measureText(String(t)).width; };
    // 글자를 폭에 맞춰 여러 줄로 (한글은 글자 단위로 끊어도 자연스러움)
    function wrapText(t, size, maxW, weight = 400) {
        const out = []; let line = '';
        for (const ch of String(t)) {
            if (textW(line + ch, size, weight) > maxW && line) { out.push(line); line = ch.trim() ? ch : ''; } else line += ch;
        }
        if (line) out.push(line);
        return out;
    }
    const clip = (t, size, maxW, weight = 400) => { let s = String(t); if (textW(s, size, weight) <= maxW) return s; while (s && textW(s + '…', size, weight) > maxW) s = s.slice(0, -1); return s + '…'; };
    const cssVar = (el, name, fb) => { try { return (getComputedStyle(el).getPropertyValue(name) || '').trim() || fb; } catch (e) { return fb; } };

    // ---- 위키 틀 ----
    function wikiSvg(d) {
        const W = 640, frame = S.wiki.frame || '#2b3a67', ffg = fgFor(frame);
        const { notes, mark, smallMark } = wikiNotes(d);
        let y = 0; const parts = [];
        // 머리: 엠블럼 | 제목 · 원내 구성
        const headH = 92;
        parts.push(`<rect x="0" y="0" width="${W}" height="${headH}" fill="${X(frame)}"/>`);
        const tw = Math.max(textW(d.title, 16, 700), textW('원내 구성', 24, 800));
        const emW = 90, gap = 16, total = emW + gap * 2 + 1 + tw, x0 = (W - total) / 2;
        parts.push(d.emblem ? `<image href="${X(d.emblem)}" x="${x0}" y="16" width="${emW}" height="60" preserveAspectRatio="xMidYMid meet"/>` : `<g transform="translate(${x0 + 13},26)">${emblemSvg(ffg)}</g>`);
        parts.push(`<rect x="${x0 + emW + gap}" y="14" width="1" height="64" fill="${ffg}" opacity=".35"/>`);
        parts.push(`<text x="${x0 + emW + gap * 2 + 1}" y="40" font-size="16" font-weight="700" fill="${ffg}">${X(d.title)}</text>`);
        parts.push(`<text x="${x0 + emW + gap * 2 + 1}" y="70" font-size="24" font-weight="800" fill="${ffg}">원내 구성</text>`);
        y = headH;
        const band = (h, fill, inner) => { parts.push(`<rect x="0" y="${y}" width="${W}" height="${h}" fill="${fill}"/>` + inner(y)); y += h; };
        const ctext = (cy, t, size, weight, fill) => `<text x="${W / 2}" y="${cy}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle">${X(t)}</text>`;
        if (d.govName || d.period) {
            const h = d.govName && d.period ? 58 : 38;
            band(h, '#dedede', yy => (d.govName ? ctext(yy + (d.period ? 24 : 25), d.govName, 16, 800, '#222') : '') + (d.period ? ctext(yy + (d.govName ? 46 : 25), d.period, 13, 700, '#222') : ''));
        }
        // 의석 표시 (한 원 · 양원)
        const badge = (cx, cy, arr, color, size = 15) => {
            const c = color || '#5c5c5c', light = fgFor(c) !== '#fff', ink = light ? '#3d3d3d' : c;
            if (arr.length < 2) {
                const t = `${arr[0]}석`, w = textW(t, size, 800) + 14, h = size + 8;
                return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="5" fill="#fff"/><text x="${cx}" y="${cy + size * 0.36}" font-size="${size}" font-weight="800" fill="${ink}" text-anchor="middle">${t}</text>`;
            }
            const ta = `${arr[0]}석`, tb = `${arr[1]}석`, wa = textW(ta, size, 800) + 16, wb = textW(tb, size, 800) + 12, h = size + 8, x = cx - (wa + wb) / 2;
            return `<rect x="${x - 1.5}" y="${cy - h / 2 - 1.5}" width="${wa + wb + 3}" height="${h + 3}" rx="6" fill="#fff"/>`
                + `<path d="M${x} ${cy - h / 2} h${wa} l-5 ${h} h-${wa - 5} z" fill="${light ? '#5c5c5c' : X(c)}"/>`
                + `<text x="${x + (wa - 3) / 2}" y="${cy + size * 0.36}" font-size="${size}" font-weight="800" fill="#fff" text-anchor="middle">${ta}</text>`
                + `<text x="${x + wa + wb / 2 - 2}" y="${cy + size * 0.36}" font-size="${size}" font-weight="800" fill="${ink}" text-anchor="middle">${tb}</text>`;
        };
        const badgeW = (arr, size = 15) => (arr.length < 2 ? textW(`${arr[0]}석`, size, 800) + 14 : textW(`${arr[0]}석`, size, 800) + 16 + textW(`${arr[1]}석`, size, 800) + 12 + 3);
        // 글자 + 의석 표시를 한 덩어리로 가운데 정렬 (재적 · 비교섭단체 띠)
        const labelBadge = (cy, label, fill, arr, color) => {
            const lw = textW(label, 17, 800), bw = badgeW(arr), x0 = (W - (lw + 10 + bw)) / 2;
            return `<text x="${x0}" y="${cy + 6}" font-size="17" font-weight="800" fill="${fill}">${X(label)}</text>` + badge(x0 + lw + 10 + bw / 2, cy, arr, color);
        };
        const sec = label => band(40, '#dee5e5', yy => ctext(yy + 26, label, 17, 800, '#222'));
        const rowsOf = arr => splitRows(arr).forEach(row => {
            const k = row.length, cw = W / k, big = k <= 2;
            const anyLogo = row.some(p => p.logoPhoto);
            const h = (big ? 132 : 108) + (anyLogo ? 8 : 0);
            row.forEach((p, i) => {
                const c = p.color || '#888', fg = fgFor(c), x = i * cw;
                const nameSize = big ? 20 : 17;
                const logoH = p.logoPhoto ? (big ? 54 : 44) : 0;
                const sup = mark.get(p.id) ? String(mark.get(p.id)) : '';
                const contentH = logoH + (logoH ? 8 : 0) + nameSize + 8 + 23;
                let cy = y + (h - contentH) / 2;
                let g = `<rect x="${x}" y="${y}" width="${cw - (i < k - 1 ? 1 : 0)}" height="${h}" fill="${X(c)}"/>`;
                if (logoH) {
                    if (p.logoBg === 'white') g += `<rect x="${x + cw * 0.18}" y="${cy - 5}" width="${cw * 0.64}" height="${logoH + 10}" rx="6" fill="#fff"/><image href="${X(p.logoPhoto)}" x="${x + cw * 0.22}" y="${cy}" width="${cw * 0.56}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`;
                    else g += `<image href="${X(p.logoPhoto)}" x="${x + cw * 0.1}" y="${cy}" width="${cw * 0.8}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`;
                    cy += logoH + 8;
                }
                const nm = clip(p.name, nameSize, cw - 24, 800);
                const nw = textW(nm, nameSize, 800);
                g += `<text x="${x + cw / 2 - (sup ? 4 : 0)}" y="${cy + nameSize * 0.85}" font-size="${nameSize}" font-weight="800" fill="${fg}" text-anchor="middle">${X(nm)}</text>`;
                if (sup) g += `<text x="${x + cw / 2 + nw / 2 - 2}" y="${cy + nameSize * 0.35}" font-size="${Math.round(nameSize * 0.6)}" font-weight="800" fill="${fg}">${sup}</text>`;
                cy += nameSize + 8;
                g += badge(x + cw / 2, cy + 11, d.seats(p), c);
                parts.push(g);
            });
            parts.push(`<rect x="0" y="${y + h}" width="${W}" height="1" fill="#fff" opacity=".75"/>`);
            y += h + 1;
        });
        if (d.gov.length) { sec(d.gov.length > 1 ? '연립여당' : '여당'); rowsOf(d.gov); if (d.opp.length) { sec('야당'); rowsOf(d.opp); } } else if (d.opp.length) { sec('원내 정당'); rowsOf(d.opp); }
        const small = [...d.minor, ...d.ind];
        if (small.length) {
            const smallSeats = d.chs.map((ch, i) => small.reduce((a, p) => a + d.seats(p)[i], 0));
            const label = (d.minor.length ? '비교섭단체' : '무소속') + (smallMark ? ` ${smallMark})` : '');
            band(44, '#808080', yy => labelBadge(yy + 22, label, '#fff', smallSeats, '#7f7f7f'));
        }
        band(46, frame, yy => labelBadge(yy + 23, '재적', ffg, d.totals, frame));
        const custom = (S.wiki.note || '').trim();
        const noteLines = [];
        notes.forEach((t, i) => wrapText(`${i + 1}. ${t}`, 13, W - 40).forEach(l => noteLines.push(l)));
        if (custom) wrapText(`※ ${custom}`, 13, W - 40).forEach(l => noteLines.push(l));
        const legend = d.chs.length > 1;
        if (noteLines.length || legend) {
            const h = 14 + noteLines.length * 22 + (legend ? 32 : 0) + 6;
            band(h, '#f2f2f2', yy => noteLines.map((l, i) => ctext(yy + 28 + i * 22, l, 13, 400, '#333')).join('')
                + (legend ? badge(W / 2, yy + 18 + noteLines.length * 22 + 14, [`${chName(d.chs[0])} 의석`.replace(/석$/, ''), `${chName(d.chs[1])} 의석`.replace(/석$/, '')], '#6b6b6b', 12) : ''));
        }
        if (S.wiki.footer !== false) band(44, '#ffffff', yy => `<rect x="0" y="${yy}" width="${W}" height="1" fill="#ddd"/>` + ctext(yy + 28, '정당 구분 (원내 · 원외)', 15, 700, '#222'));
        const H = y;
        return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W + 6}" height="${H + 6}" viewBox="-3 -3 ${W + 6} ${H + 6}" font-family="${X(FONT)}">`
            + `<rect x="-3" y="-3" width="${W + 6}" height="${H + 6}" fill="${X(frame)}"/><rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>${parts.join('')}</svg>`;
    }

    // ---- 국가 순위 ----
    function rankSvg() {
        const panel = document.getElementById('dispPanelRanking') || document.body;
        const bg = cssVar(panel, '--m-surface', '') || (isModernTheme() ? '#fff' : '#0a0c10');
        const text = cssVar(panel, '--t64-text', '#ddd'), dim = cssVar(panel, '--t64-dim', '#888'), line = cssVar(panel, '--t64-line', '#333'), acc = cssVar(panel, '--t64-acc', '#00ffff');
        const list = ranked();
        const W = 720, padX = 24, rowH = 46;
        const counts = S.blocs.map(b => [b, S.ranking.rows.filter(r => r.bloc === b.id).length]).filter(([, n]) => n);
        const parts = [];
        parts.push(`<text x="${W / 2}" y="44" font-size="26" font-weight="800" fill="${X(text)}" text-anchor="middle" letter-spacing="2">${X(S.ranking.title || '냉전 국가 순위')}</text>`);
        // 진영 범례 (가운데 정렬)
        const items = counts.map(([b, n]) => ({ b, t: `${b.name} ${n}`, w: 14 + textW(`${b.name} ${n}`, 13) + 16 }));
        let lx = (W - items.reduce((a, it) => a + it.w, 0)) / 2;
        items.forEach(it => { parts.push(`<rect x="${lx}" y="62" width="10" height="10" fill="${X(it.b.color)}"/><text x="${lx + 14}" y="71.5" font-size="13" fill="${X(dim)}">${X(it.t)}</text>`); lx += it.w; });
        let y = 92;
        const barX = W - padX - 250, barW = 160;
        list.forEach((r, i) => {
            const rank = i + 1, b = blocOf(r.bloc), ideo = ideoOf(b, r.ideo);
            const mv = r.prevRank ? r.prevRank - rank : 0;
            let g = '';
            if (r.self) g += `<rect x="${padX}" y="${y}" width="${W - padX * 2}" height="${rowH}" fill="${X(acc)}" opacity=".12"/>`;
            g += `<rect x="${padX}" y="${y}" width="5" height="${rowH}" fill="${X(b.color)}"/>`;
            g += `<text x="${padX + 30}" y="${y + rowH / 2 + 6}" font-size="18" fill="${rank <= 5 ? '#e0b030' : X(dim)}" text-anchor="middle">${rank}</text>`;
            const src = flagSrc(r);
            if (src) g += `<image href="${X(src)}" x="${padX + 52}" y="${y + rowH / 2 - 12}" width="36" height="24" preserveAspectRatio="xMidYMid slice"/><rect x="${padX + 52}" y="${y + rowH / 2 - 12}" width="36" height="24" fill="none" stroke="#7f7f7f" stroke-opacity=".35"/>`;
            else g += `<text x="${padX + 70}" y="${y + rowH / 2 + 7}" font-size="20" text-anchor="middle">${X(r.flag || '🏳')}</text>`;
            const nameX = padX + 102, nameMax = barX - nameX - 16;
            const nm = clip(rowName(r), 17, nameMax);
            g += `<text x="${nameX}" y="${y + (ideo ? 21 : rowH / 2 + 6)}" font-size="17" fill="${X(text)}">${X(nm)}</text>`;
            if (ideo) g += `<text x="${nameX}" y="${y + 38}" font-size="11.5" fill="${X(dim)}">${X(clip(ideo.name, 11.5, nameMax))}</text>`;
            const pct = Math.max(2, Math.min(100, Number(r.score) || 0));
            g += `<rect x="${barX}" y="${y + rowH / 2 - 4.5}" width="${barW}" height="9" fill="#7f7f7f" opacity=".2"/><rect x="${barX}" y="${y + rowH / 2 - 4.5}" width="${barW * pct / 100}" height="9" fill="${X(b.color)}"/>`;
            g += `<text x="${barX + barW + 46}" y="${y + rowH / 2 + 6}" font-size="17" fill="${X(text)}" text-anchor="end">${Number(r.score) || 0}</text>`;
            if (mv || r.prevRank) g += `<text x="${W - padX - 6}" y="${y + rowH / 2 + 5}" font-size="13" fill="${mv > 0 ? '#3fbf7f' : mv < 0 ? '#e05555' : X(dim)}" text-anchor="end">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + (-mv) : '–'}</text>`;
            g += `<rect x="${padX}" y="${y + rowH}" width="${W - padX * 2}" height="1" fill="${X(line)}"/>`;
            parts.push(g);
            y += rowH + 1;
        });
        const H = y + 24;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${X(FONT)}"><rect width="${W}" height="${H}" fill="${X(bg)}"/>${parts.join('')}</svg>`;
    }

    // ---- 세력 변화 도표: 화면의 SVG에 계산된 스타일을 박아 넣어 홀로 서게 ----
    function histSvg(svgEl) {
        const panel = document.getElementById('dispPanelTimeline') || document.body;
        const bg = cssVar(panel, '--m-surface', '') || (isModernTheme() ? '#fff' : '#0a0c10');
        const text = cssVar(panel, '--t64-text', '#ddd');
        const clone = svgEl.cloneNode(true);
        const PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'opacity', 'font-size', 'font-weight', 'paint-order', 'text-anchor', 'dominant-baseline', 'letter-spacing'];
        const src = [svgEl, ...svgEl.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
        src.forEach((el, i) => {
            const t = dst[i]; if (!t || el.tagName === 'defs' || el.closest('defs')) return;
            const cs = getComputedStyle(el);
            const st = PROPS.map(p => { const v = cs.getPropertyValue(p); return v ? `${p}:${v}` : ''; }).filter(Boolean).join(';');
            t.setAttribute('style', st + ';font-family:' + FONT.replace(/"/g, "'"));
            t.removeAttribute('class');
        });
        const w = Number(svgEl.getAttribute('width')) || svgEl.getBoundingClientRect().width, h = Number(svgEl.getAttribute('height')) || svgEl.getBoundingClientRect().height;
        const title = document.getElementById('t64HistTitle')?.textContent || '세력 변화';
        const head = 44;
        clone.setAttribute('x', 0); clone.setAttribute('y', head); clone.setAttribute('width', w); clone.setAttribute('height', h);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 24}" height="${h + head + 16}" viewBox="-12 0 ${w + 24} ${h + head + 16}" font-family="${X(FONT)}"><rect x="-12" width="${w + 24}" height="${h + head + 16}" fill="${X(bg)}"/>`
            + `<text x="0" y="28" font-size="18" font-weight="800" fill="${X(text)}">${X([nationName(), title].filter(Boolean).join(' · '))}</text>${new XMLSerializer().serializeToString(clone)}</svg>`;
    }

    function t64ExportMarkup(el) {
        const kind = el && el.dataset.exportKind;
        if (kind === 't64wiki') return { svg: wikiSvg(wikiData(ui.wikiChamber)), name: 'wikibox' };
        if (kind === 't64rank') return { svg: rankSvg(), name: 'ranking' };
        if (kind === 't64hist') return { svg: histSvg(el), name: ui.histView === 'lineage' ? 'party_lineage' : 'seat_history' };
        return null;
    }
    function dl(href, filename) { const a = document.createElement('a'); a.href = href; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }
    async function t64Export(el, format) {
        const m = t64ExportMarkup(el); if (!m) return;
        const stamp = (typeof formatKstTimestampCompact === 'function') ? formatKstTimestampCompact() : Date.now();
        const base = `${m.name}_${stamp}`;
        if (format === 'svg') {
            const url = URL.createObjectURL(new Blob([m.svg], { type: 'image/svg+xml;charset=utf-8' }));
            dl(url, `${base}.svg`); setTimeout(() => URL.revokeObjectURL(url), 2000);
            return;
        }
        const scale = (typeof exportScale !== 'undefined' && [1, 2, 3].includes(exportScale)) ? exportScale : 2;
        const img = new Image();
        await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('그림을 만들지 못했습니다')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(m.svg); });
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        const ctx = c.getContext('2d');
        if (format === 'jpg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        dl(c.toDataURL(format === 'jpg' ? 'image/jpeg' : 'image/png', 0.95), `${base}.${format}`);
    }
    // 우클릭: 이 세 화면이면 본 화면의 "내보내기..." 메뉴를 띄우되 대상을 우리 것으로 (본 화면의 svg 우클릭 처리보다 먼저)
    document.addEventListener('contextmenu', e => {
        const t = e.target;
        let el = null, kind = '';
        if (t.closest && t.closest('#t64WikiWrap .nbx2')) { el = t.closest('#t64WikiWrap .nbx2'); kind = 't64wiki'; }
        else if (t.closest && t.closest('#t64RankWrap .t64-rk')) { el = t.closest('#t64RankWrap .t64-rk'); kind = 't64rank'; }
        else if (t.closest && t.closest('#t64HistWrap')) { el = document.querySelector('#t64HistWrap svg.t64-hist'); kind = 't64hist'; }
        if (!el) return;
        e.preventDefault(); e.stopPropagation();
        el.dataset.exportKind = kind;
        try { canvasExportTarget = el; } catch (err) { return; }
        const menu = document.getElementById('canvasExportMenu');
        if (!menu) return;
        menu.style.display = 'block';
        try { positionFloatingBox(menu, e.clientX, e.clientY); } catch (err) { menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; }
    }, true);
    // 옵션 창: 머리(국기 · 국가명 · 날짜) · 통계 칸은 이 그림들에 맞지 않아 숨김 (내각 카드와 같은 방식)
    const origOpenExport = window.openExportDialog;
    if (typeof origOpenExport === 'function') {
        window.openExportDialog = function () {
            const r = origOpenExport.apply(this, arguments);
            try { if (String(canvasExportTarget?.dataset?.exportKind || '').startsWith('t64')) { const sec = document.getElementById('exportHeaderStatsSection'); if (sec) sec.style.display = 'none'; } } catch (e) { /* 없음 */ }
            return r;
        };
    }
    const origExportAt = window.exportVisualElementAt;
    if (typeof origExportAt === 'function') {
        window.exportVisualElementAt = function (target, includeStats, format) {
            if (String(target?.dataset?.exportKind || '').startsWith('t64')) return t64Export(target, format);
            return origExportAt.apply(this, arguments);
        };
    }

    window.T64 = { get timeline() { return S.timeline; }, get ranking() { return S.ranking; }, record: (label) => { const n = record(label || '', 'manual', false); renderTimeline(); return n; } };

    const style = document.createElement('style');
    style.textContent = `
        #contentTimeline, #contentWikibox, #contentRanking, #contentBlocs { --t64-line: #333; --t64-soft: rgba(255,255,255,.03); --t64-dim: #888; --t64-text: #ddd; --t64-acc: var(--tno-neon); }
        html[data-theme-family="modern"] #contentTimeline, html[data-theme-family="modern"] #contentWikibox, html[data-theme-family="modern"] #contentRanking, html[data-theme-family="modern"] #contentBlocs { --t64-line: var(--m-border); --t64-soft: var(--m-surface-2); --t64-dim: var(--m-text-3); --t64-text: var(--m-text); --t64-acc: var(--m-accent); }
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
        #dispPanelTimeline, #dispPanelRanking { --t64-line: #333; --t64-soft: rgba(255,255,255,.03); --t64-dim: #888; --t64-text: #ddd; --t64-acc: var(--tno-neon); }
        html[data-theme-family="modern"] #dispPanelTimeline, html[data-theme-family="modern"] #dispPanelRanking { --t64-line: var(--m-border); --t64-soft: var(--m-surface-2); --t64-dim: var(--m-text-3); --t64-text: var(--m-text); --t64-acc: var(--m-accent); }
        /* 오른쪽 순위표 — 넓은 화면에 맞춰 크게 */
        #dispPanelRanking .t64-rk { padding: 18px 20px; }
        #dispPanelRanking .t64-rk-title { font-size: 1.5rem; margin-bottom: 8px; }
        #dispPanelRanking .t64-rk-blocs { font-size: .85rem; margin-bottom: 14px; }
        #dispPanelRanking .t64-rk-row { grid-template-columns: 2.2em 2.4em minmax(0, 1fr) minmax(60px, 34%) 3em 2.8em; gap: 12px; padding: 10px 8px 10px 12px; font-size: 1.05rem; border-left-width: 5px; }
        #dispPanelRanking .t64-rk-no { font-size: 1.2rem; }
        #dispPanelRanking .t64-rk-flagimg { width: 2.2em; height: 1.47em; }
        #dispPanelRanking .t64-rk-flag { font-size: 1.5rem; }
        #dispPanelRanking .t64-rk-bar { height: 9px; }
        #dispPanelRanking .t64-rk-ideo { font-size: .75rem; }
        #dispPanelRanking .t64-rk-mv { font-size: .8rem; }
        /* 왼쪽 국가 순위 편집 */
        .t64-re-head .t64-actions { margin: 8px 0 0; }
        .t64-re-hint { font-size: .72rem; color: var(--t64-dim); margin: 0 0 6px; }
        .t64-re-list { border-top: 1px solid var(--t64-line); }
        .t64-re-row { display: grid; grid-template-columns: 1.6em 2.8em minmax(0, 1fr) auto 1.9em; grid-template-areas: "no flag name score del" "no flag meta meta meta"; gap: 5px 6px; align-items: center; padding: 7px 4px 7px 6px; border-left: 4px solid var(--bloc); border-bottom: 1px solid var(--t64-line); }
        .t64-re-row.self { background: color-mix(in srgb, var(--t64-acc) 8%, transparent); }
        .t64-re-row:hover { background: color-mix(in srgb, var(--bloc) 7%, transparent); }
        .t64-re-no { grid-area: no; align-self: start; padding-top: 6px; text-align: center; font-size: .85rem; color: var(--t64-dim); }
        .t64-re-row:nth-child(-n+5) .t64-re-no { color: #e0b030; }
        .t64-re-flag { grid-area: flag; position: relative; display: flex; align-items: center; justify-content: center; align-self: stretch; min-height: 30px; border: 1px dashed var(--t64-line); cursor: pointer; }
        .t64-re-flag:hover { border-color: var(--t64-acc); }
        .t64-re-flag.self { cursor: default; border-style: solid; opacity: .75; }
        .t64-re-flag .t64-rk-flagimg { width: 30px; height: 20px; }
        .t64-re-unflag { position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; line-height: 14px; padding: 0; font-size: 11px; border-radius: 50%; border: 1px solid var(--t64-line); background: var(--t64-soft, #111); color: var(--t64-text); cursor: pointer; }
        .t64-re-name { grid-area: name; min-width: 0; box-sizing: border-box; }
        .t64-re-score { grid-area: score; display: inline-flex; align-items: stretch; border: 1px solid var(--t64-line); }
        .t64-re-score button { cursor: pointer; width: 22px; padding: 0; background: transparent; border: none; color: var(--t64-dim); font-family: inherit; font-size: .9rem; }
        .t64-re-score button:hover { color: var(--t64-acc); }
        .t64-re-score input { width: 3.2em; min-width: 0; text-align: center; border: none !important; border-left: 1px solid var(--t64-line) !important; border-right: 1px solid var(--t64-line) !important; -moz-appearance: textfield; }
        .t64-re-score input::-webkit-inner-spin-button, .t64-re-score input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .t64-re-row > .t64-x { grid-area: del; justify-self: end; }
        .t64-re-me { grid-area: del; justify-self: center; font-size: .9rem; color: var(--t64-acc); cursor: help; }
        .t64-re-meta { grid-area: meta; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px; }
        .t64-re-meta select { min-width: 0; box-sizing: border-box; font-size: .8rem; }
        html[data-theme-family="modern"] .t64-re-score { border-radius: 8px; overflow: hidden; }
        html[data-theme-family="modern"] .t64-re-flag { border-radius: 6px; }
        .t64-hist { display: block; }
        .t64-h-controls { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .t64-h-note { font-size: 10.5px; fill: var(--t64-text); paint-order: stroke; stroke: var(--t64-bg, rgba(0,0,0,.55)); stroke-width: 3px; font-weight: bold; }
        html[data-theme-family="modern"] .t64-h-note { stroke: rgba(255,255,255,.85); }
        .t64-l-scroll { overflow-x: auto; }
        .t64-l-row { stroke: var(--t64-line); stroke-dasharray: 2 4; }
        .t64-l-name { font-size: 12px; fill: var(--t64-text); font-weight: bold; paint-order: stroke; stroke: rgba(0,0,0,.4); stroke-width: 2px; }
        html[data-theme-family="modern"] .t64-l-name { stroke: rgba(255,255,255,.9); stroke-width: 3px; }
        .t64-l-node { stroke: #fff; stroke-width: 2; }
        .t64-l-end { font-size: 14px; fill: #e05555; font-weight: bold; }
        .t64-sub-title { font-size: .8rem; color: var(--t64-text); margin: 6px 0 4px; }
        .t64-succ-row { display: flex; align-items: center; gap: 6px; margin: 4px 0 8px; }
        .t64-succ-row select { flex: 1; min-width: 0; }
        .t64-succ-row input[type="text"] { flex: 1; min-width: 0; }
        .t64-succ-row .t64-btn { flex: none; white-space: nowrap; }
        .t64-field select { flex: 1; min-width: 0; }
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
        /* 원내 구성 틀 — 위키 문서 모양을 따라 늘 밝은 바탕 */
        .t64-wikiwrap { display: flex; justify-content: center; }
        .nbx2 { width: 100%; max-width: 640px; background: #fff; border: 3px solid color-mix(in srgb, var(--nb-frame) 100%, #bbb); color: #222; font-family: 'Pretendard', 'Noto Sans KR', 'Malgun Gothic', sans-serif; box-sizing: border-box; text-align: center; }
        .nbx2 .nb-head { background: var(--nb-frame); color: var(--nb-ffg); display: flex; align-items: center; justify-content: center; gap: 16px; padding: 14px 20px; text-align: left; border-bottom: 1px solid rgba(0,0,0,.12); }
        .nbx2 .nb-emblem img { max-height: 60px; max-width: 96px; display: block; }
        .nbx2 .nb-sep { align-self: stretch; width: 1px; background: currentColor; opacity: .35; }
        .nbx2 .nb-nation { font-weight: 700; font-size: 16px; }
        .nbx2 .nb-title { font-weight: 800; font-size: 24px; }
        .nbx2 .nb-body > summary { list-style: none; cursor: pointer; font-weight: 700; padding: 9px 0; background: #fff; }
        .nbx2 .nb-body > summary::-webkit-details-marker { display: none; }
        .nbx2 .nb-cab { background: #dedede; padding: 10px; display: flex; flex-direction: column; gap: 4px; }
        .nbx2 .nb-cab b { font-size: 16px; } .nbx2 .nb-cab small { font-size: 13px; font-weight: 700; }
        .nbx2 .nb-sec { background: #dee5e5; font-weight: 800; font-size: 17px; padding: 8px; }
        .nbx2 .nb-row { display: grid; gap: 1px; background: rgba(255,255,255,.75); }
        .nbx2 .nb-party { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 8px; min-height: 96px; }
        .nbx2 .nb-party.k1, .nbx2 .nb-party.k2 { min-height: 128px; }
        .nbx2 .nb-logo { max-height: 46px; max-width: 80%; display: block; }
        .nbx2 .nb-logo-card { display: flex; justify-content: center; background: #fff; border-radius: 6px; padding: 5px 10px; max-width: 80%; box-sizing: border-box; }
        .nbx2 .nb-logo-card .nb-logo { max-width: 100%; }
        .nbx2 .nb-party.k1 .nb-logo, .nbx2 .nb-party.k2 .nb-logo { max-height: 58px; }
        .nbx2 .nb-pname { font-weight: 800; font-size: 17px; line-height: 1.2; word-break: keep-all; }
        .nbx2 .nb-party.k1 .nb-pname, .nbx2 .nb-party.k2 .nb-pname { font-size: 20px; }
        .nbx2 sup { font-size: .6em; margin-left: 1px; }
        .nbx2 .nb-seat { display: inline-block; background: #fff; border-radius: 5px; padding: 1px 7px; font-weight: 800; font-size: 15px; line-height: 1.45; white-space: nowrap; }
        .nbx2 .nb-seat.split { padding: 0; display: inline-flex; overflow: hidden; border: 1.5px solid #fff; background: #fff; }
        .nbx2 .nb-seat.split > span { padding: 1px 6px; }
        .nbx2 .nb-seat.split .a { color: #fff; clip-path: polygon(0 0, 100% 0, calc(100% - 5px) 100%, 0 100%); padding-right: 9px; }
        .nbx2 .nb-small { background: #808080; color: #fff; font-weight: 800; font-size: 17px; padding: 9px; }
        .nbx2 .nb-total { background: var(--nb-frame); color: var(--nb-ffg); font-weight: 800; font-size: 17px; padding: 9px; border-top: 1px solid rgba(0,0,0,.08); }
        .nbx2 .nb-total small { font-weight: 500; opacity: .8; font-size: 12px; }
        .nbx2 .nb-notes { background: #f2f2f2; font-size: 13px; line-height: 1.75; padding: 10px 14px; color: #333; }
        .nbx2 .nb-legend { margin-top: 6px; } .nbx2 .nb-legend .nb-seat { font-size: 12px; border-color: #999; }
        .nbx2 .nb-foot { font-size: 15px; font-weight: 700; padding: 10px; border-top: 1px solid #ddd; }
        .nbx2 .nb-foot b { font-weight: 900; }
        #dispPanelWiki .t64-wikiwrap { padding: 4px 0 10px; }
        .t64-wk-form .t64-field > span:first-child { min-width: 5.2em; }
        .t64-wk-form .t64-field input[type=text] { flex: 1; min-width: 0; }
        .t64-wk-form .t64-field input[type=checkbox] { flex: none; width: 16px; height: 16px; margin: 0; }
        #sideNav .mn-group[data-main="economy"] .mn-group-head { opacity: .55; }
        @media (max-width: 520px) { .nbx2 .nb-pname { font-size: 15px; } .nbx2 .nb-party.k1 .nb-pname, .nbx2 .nb-party.k2 .nb-pname { font-size: 17px; } .nbx2 .nb-title { font-size: 20px; } }
        /* 냉전 국가 순위 */
        .t64-rk { border: 1px solid var(--t64-line); background: var(--t64-soft); padding: 12px; }
        .t64-rk-title { font-size: 1.15rem; text-align: center; color: var(--t64-text); letter-spacing: 2px; margin-bottom: 6px; }
        .t64-rk-blocs { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 12px; font-size: .74rem; color: var(--t64-dim); margin-bottom: 10px; }
        .t64-rk-blocs i { display: inline-block; width: 10px; height: 10px; margin-right: 4px; vertical-align: middle; }
        .t64-rk-row { display: grid; grid-template-columns: 1.8em 1.7em minmax(0, 1fr) minmax(36px, 70px) 2.4em 2.4em; align-items: center; gap: 6px; padding: 6px 4px 6px 8px; border-left: 4px solid var(--bloc); border-bottom: 1px solid var(--t64-line); font-size: .85rem; color: var(--t64-text); }
        .t64-rk-row.self { background: color-mix(in srgb, var(--t64-acc) 10%, transparent); }
        .t64-rk-no { font-size: 1rem; color: var(--t64-dim); text-align: center; }
        .t64-rk-row:nth-child(-n+5) .t64-rk-no { color: #e0b030; }
        .t64-rk-flag { font-size: 1.1rem; text-align: center; } .t64-rk-flagimg { width: 1.6em; height: 1.07em; object-fit: cover; display: block; box-shadow: 0 0 0 1px rgba(127,127,127,.35); }
        .t64-rk-e-flag { position: relative; display: flex; align-items: center; justify-content: center; height: 30px; border: 1px dashed var(--t64-line); cursor: pointer; }
        .t64-rk-e-flag.self { cursor: default; border-style: solid; opacity: .7; }
        .t64-rk-e-flag .t64-rk-flagimg { width: 30px; height: 20px; }
        .t64-rk-e-unflag { position: absolute; top: -6px; right: -6px; width: 16px; height: 16px; line-height: 14px; padding: 0; font-size: 11px; border-radius: 50%; border: 1px solid var(--t64-line); background: var(--t64-soft, #111); color: var(--t64-text); cursor: pointer; }
        .t64-rk-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .t64-rk-name em { font-style: normal; font-size: .68rem; color: var(--t64-acc); border: 1px solid var(--t64-acc); padding: 0 4px; margin-left: 4px; }
        .t64-rk-bloc { font-size: .7rem; color: var(--t64-dim); }
        .t64-rk-bar { height: 6px; background: rgba(127,127,127,.2); } .t64-rk-bar span { display: block; height: 100%; background: var(--bloc); }
        .t64-rk-score { text-align: right; }
        .t64-rk-mv { font-size: .72rem; text-align: right; color: var(--t64-dim); } .t64-rk-mv.up { color: #3fbf7f; } .t64-rk-mv.down { color: #e05555; }
        .t64-rk-ideo { display: block; font-size: .66rem; color: var(--t64-dim); overflow: hidden; text-overflow: ellipsis; }
        .t64-bloc-bar { display: flex; height: 14px; gap: 1px; margin: 6px 0; background: rgba(127,127,127,.15); }
        .t64-bloc-bar span { display: block; height: 100%; }
        .t64-bloc { border: 1px solid var(--t64-line); border-left: 5px solid var(--bloc); padding: 10px; margin-bottom: 10px; background: var(--t64-soft); }
        .t64-bloc-head { display: flex; align-items: center; gap: 6px; }
        .t64-bloc-head input[type=color] { width: 34px; height: 30px; padding: 0; border: none; background: none; cursor: pointer; flex-shrink: 0; }
        .t64-bloc-name { flex: 1; min-width: 0; font-size: .95rem; }
        .t64-bloc-desc { width: 100%; box-sizing: border-box; margin: 6px 0 2px; font-size: .8rem; }
        .t64-ichip { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; padding: 3px 4px 3px 9px; border: 1px solid var(--bloc); color: var(--t64-text); }
        .t64-ichip small { color: var(--t64-dim); }
        .t64-ichip button { cursor: pointer; border: none; background: transparent; color: var(--t64-dim); font-family: inherit; padding: 0 3px; }
        html[data-theme-family="modern"] .t64-bloc { border-radius: 12px; }
        html[data-theme-family="modern"] .t64-ichip { border-radius: 999px; }
        .t64-rk-edit { display: grid; grid-template-columns: 3em minmax(0, 1fr) minmax(0, 1fr) 3.8em; grid-template-areas: "flag name name del" "flag bloc ideo score"; gap: 5px 6px; align-items: center; padding: 6px 0; border-bottom: 1px dashed var(--t64-line); }
        .t64-rk-edit > .t64-rk-e-flag { grid-area: flag; height: 100%; min-height: 30px; }
        .t64-rk-edit > .t64-rk-e-name { grid-area: name; }
        .t64-rk-edit > .t64-rk-e-bloc { grid-area: bloc; }
        .t64-rk-edit > .t64-rk-e-ideo { grid-area: ideo; }
        .t64-rk-edit > .t64-rk-e-score { grid-area: score; }
        .t64-rk-edit > .t64-x, .t64-rk-edit > .t64-x-ph { grid-area: del; justify-self: end; }
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
