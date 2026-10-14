// ===== Hemicycle 티저 1.6.3 (teaser63.html 전용) — "De l'audace!" 국회공성전 미리보기 =====
// teaser63.html = main.html + js/teaser61.js(1.6.1) + js/teaser62.js(1.6.2) + 이 파일. 저장 공간은 따로 ('hemicycleTeaser63:')
//
//   입법 › 공성전
//   - 계엄 중 봉쇄 돌파: 계엄군 · 경찰이 국회를 막은 상태에서 의원들이 본회의장에 들어가야 계엄 해제 결의안을 표결할 수 있다.
//     정당마다 참여율을 정하면 의원 한 명 한 명이 봉쇄를 뚫는지 굴려 보고, 들어간 의원만 표결한다 (가결 기준은 재적 과반 — 못 들어온 의원은 표결 제외).
//     봉쇄 강도(군 지휘부 충성도가 기본값) · 시민 지원 · 정당 결속도가 입장 확률에 들어간다. 가결되면 계엄 해제.
//     옆 시각 화면(하원 반원) 위에서 의원들이 봉쇄선을 뚫고 자기 좌석으로 들어가는 애니메이션 (누르면 건너뜀).
//   - 물리적 의사 방해: 계엄과 무관하게, 반대하는 법안의 표결을 막으려 의장석을 점거하고 몸싸움을 벌인다.
//     성공 확률 = 참여 의원 수 · 상대 진영 크기 · 정당 결속도 · 의장 경호권 발동 · 직권상정 · 국회선진화법. 성공하면 표결 무산.
//   - 폭력의 대가: 점거한 정당은 지지율 페널티(경호권으로 몸싸움이 나면 의장 쪽 여당도 조금), 다친 의원은 다음 표결 몇 번을 결석.
//     "국회선진화법"을 켜면 직권상정이 막히고 폭력 페널티가 두 배 (국회회의방해죄 고발).
/* global getAppState, setAppState, switchSubTab, parties, coalitions, elecStore, emergencyPowers, chamberList, chamberDisplayName,
   renderEmergencyPowers, applyMartialLawEffects, showCustomAlert, showCustomConfirm, escapeHtmlText, formatNationDate, bills,
   dotCache, voteState, seatAssignments, seatMemberInfo, requiredSeatsFor, getBillOverallStatus, hasSenateChamber, hasThirdChamber,
   renderBillList, renderArchiveList, syncBillSelect, selectBillForVote, updateVoteResults, updateConfirmButtons, redrawAll,
   chamberLeaders, simulate, refreshUI, switchDispTab, chamberSetView */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') !== 'teaser' || root.getAttribute('data-teaser') !== '63') return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const partyByName = n => parties.find(p => p.name === n) || null;
    const T61 = () => window.T61 || null;
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    const nowDate = () => { try { return formatNationDate(); } catch (e) { return ''; } };
    const houseName = () => { try { return chamberDisplayName('house'); } catch (e) { return '하원'; } };
    const speakerName = () => (typeof chamberLeaders !== 'undefined' && chamberLeaders?.house?.speaker?.name) || '';

    // ---- 상태 (세이브의 teaser63 칸) ----
    //   advancedAct: 국회선진화법 · cohesion: { pid: 0~100 } 정당 결속도 (기본 70)
    //   injured: [{ id, ch, key, name, party, left }] — 다음 표결 left번 결석 (key = 좌석 배정 키라 의석 순서가 바뀌어도 같은 의원)
    //   log: [{ id, date, kind, title, chance, success, effects }]
    let S = fresh();
    function fresh() { return { advancedAct: false, cohesion: {}, injured: [], log: [] }; }
    let ui = { anim: true, blockade: null, citizens: true, rate: {}, billId: '', obstructors: {}, share: 60, guard: false, direct: false, last: null };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.teaser63 = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && state.teaser63;
        S = { ...fresh(), ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        ['injured', 'log'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
        if (!S.cohesion || typeof S.cohesion !== 'object') S.cohesion = {};
        ui.last = null;
        refresh();
        return r;
    };

    // ---- 의석 ----
    const cohesionOf = p => clamp(Number(S.cohesion[p.id] ?? 70), 0, 100);
    // 하원 좌석 목록: [{ i, party, key, name }] — 공석 · 활동 금지 정당은 뺀다
    function houseSeats() {
        const dots = (typeof dotCache !== 'undefined' && dotCache.house) || [];
        let bySeat = [];
        try { bySeat = seatAssignments('house').bySeat || []; } catch (e) { /* 배정 전 */ }
        return dots.map((d, i) => ({ i, d, party: partyByName(d.partyName), key: bySeat[i] || `#${i}` }))
            .filter(s => s.d.partyName !== 'Vacant' && s.d.partyStatus !== 'banned' && s.party);
    }
    function seatName(s) {
        let nm = '';
        try { nm = (seatMemberInfo('house', s.i) || {}).name || ''; } catch (e) { /* 이름 없음 */ }
        return nm || `${s.party.name} #${s.i + 1}`;
    }
    const seatParties = seats => [...new Set(seats.map(s => s.party))];
    const injuredKeys = ch => new Set(S.injured.filter(x => x.ch === ch).map(x => x.key));

    function cutSupport(p, factor) {
        chamberList().forEach(ch => { const st = elecStore?.[ch]?.[p.id]; if (st) st.prob = Math.round((Number(st.prob) || 0) * factor * 10) / 10; });
    }
    function injure(pool, n) {
        const picked = [];
        const cand = pool.slice();
        while (picked.length < n && cand.length) {
            const s = cand.splice(Math.floor(Math.random() * cand.length), 1)[0];
            if (S.injured.some(x => x.ch === 'house' && x.key === s.key)) continue;
            const left = 1 + Math.floor(Math.random() * 3);
            S.injured.push({ id: uid(), ch: 'house', key: s.key, name: seatName(s), party: s.party.name, left });
            picked.push(`${seatName(s)} (${s.party.name}, ${left}번)`);
        }
        return picked;
    }
    function addLog(kind, title, chance, success, effects) {
        const entry = { id: uid(), date: nowDate(), kind, title, chance, success, effects };
        S.log.unshift(entry);
        S.log = S.log.slice(0, 40);
        ui.last = entry.id;
        return entry;
    }
    function rerender() {
        try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
        try { renderBillList(); renderArchiveList(); syncBillSelect(); updateConfirmButtons(); } catch (e) { /* 입법 화면 준비 전 */ }
        renderSiege();
    }

    // ================= 계엄 중 봉쇄 돌파 =================
    function defaultBlockade() {
        const mil = T61() && T61().military;
        if (mil && mil.length) return Math.round(mil.reduce((a, o) => a + (Number(o.loyalty) || 0), 0) / mil.length);
        return 60;
    }
    const blockade = () => ui.blockade ?? defaultBlockade();
    // 정당 참여율 기본값: 정부 · 여당 10%, 나머지 100%
    const rateOf = p => clamp(Number(ui.rate[p.id] ?? (isGovParty(p) ? 10 : 100)), 0, 100);
    // 봉쇄를 뚫고 들어갈 확률 (의원 한 명)
    const entryProb = p => clamp(0.95 - blockade() * 0.005 + (cohesionOf(p) - 50) * 0.004 + (ui.citizens ? 0.1 : 0), 0.05, 0.97);

    function breakthroughOdds() {
        const seats = houseSeats();
        const need = requiredSeatsFor(seats.length, 0.5);
        const hurt = injuredKeys('house');
        const groups = seatParties(seats).map(p => {
            const n = seats.filter(s => s.party === p && !hurt.has(s.key)).length;
            return { p, n, try: Math.round(n * rateOf(p) / 100), prob: entryProb(p) };
        });
        const expected = groups.reduce((a, g) => a + g.try * g.prob, 0);
        // 성공 확률은 몬테카를로로 어림 (400번)
        let ok = 0;
        for (let k = 0; k < 400; k++) {
            let inn = 0;
            groups.forEach(g => { for (let j = 0; j < g.try; j++) if (Math.random() < g.prob) inn++; });
            if (inn >= need) ok++;
        }
        return { seats, need, groups, expected, chance: Math.round(ok / 4) };
    }

    function breakthrough() {
        if (!emergencyPowers.martialLaw.active) { showCustomAlert('계엄령이 선포된 상태에서만 할 수 있습니다.'); return; }
        if (T61() && T61().junta) { showCustomAlert('군정에서는 의회가 해산돼 있습니다 — 내각 › 쿠데타 · 혁명으로 군정을 끝내세요.'); return; }
        const odds = breakthroughOdds();
        showCustomConfirm(`계엄군 봉쇄를 뚫고 ${houseName()} 본회의장에 들어가 계엄 해제 결의안을 표결합니다.\n가결 기준: 재적 ${odds.seats.length}명의 과반 ${odds.need}명 · 예상 성공 확률 ${odds.chance}%\n계속하시겠습니까?`, () => {
            const hurt = injuredKeys('house');
            const entered = [], blocked = [];
            seatParties(odds.seats).forEach(p => {
                const mine = odds.seats.filter(s => s.party === p && !hurt.has(s.key));
                const tryN = Math.round(mine.length * rateOf(p) / 100);
                mine.slice().sort(() => Math.random() - 0.5).slice(0, tryN).forEach(s => (Math.random() < entryProb(p) ? entered : blocked).push(s));
            });
            const yea = entered.length;
            const success = yea >= odds.need;
            // 계엄군과의 몸싸움 — 막힌 의원 일부가 다침 (애니메이션에서 표시하려고 미리 고름)
            const hurtN = Math.round(blocked.length * (0.02 + Math.random() * 0.04));
            const hurtSeats = blocked.slice().sort(() => Math.random() - 0.5).slice(0, hurtN);
            playBreakthrough({ entered, blocked, hurtSeats, need: odds.need, success }, () => applyBreakthrough(odds, entered, blocked, hurtSeats, success));
        });
    }
    function applyBreakthrough(odds, entered, blocked, hurtSeats, success) {
        const yea = entered.length;
        const byParty = seatParties(entered).map(p => `${p.name} ${entered.filter(s => s.party === p).length}`).join(' · ') || '없음';
        const effects = [`본회의장 입장 ${yea}명 (${byParty}) · 봉쇄에 막힘 ${blocked.length}명`, `계엄 해제 결의안 — 찬성 ${yea} / 필요 ${odds.need} (재적 ${odds.seats.length})`];
        const hurtList = hurtSeats.length ? injure(hurtSeats, hurtSeats.length) : [];
        if (hurtList.length) effects.push(`부상 결석: ${hurtList.join(', ')}`);
        // 결의안 기록 — 상정된 해제 결의안이 있으면 그것을, 없으면 새로
        let bill = bills.find(b => b.isMartialLawLift && getBillOverallStatus(b) === 'pending');
        if (!bill) {
            bill = { id: 'b' + Date.now(), title: '계엄 해제 결의안', content: '', threshold: 0.5, numer: null, denom: null, tags: ['계엄해제'],
                houseStatus: 'pending', senateStatus: 'pending', thirdStatus: 'pending', houseVote: null, senateVote: null, thirdVote: null,
                version: 1, parentBillId: null, isAmendment: false, voteHistory: [], isMartialLawLift: true, martialLawLiftApplied: false };
            bills.push(bill);
        }
        const res = success ? 'pass' : 'fail';
        bill.houseStatus = res;
        if (hasSenateChamber()) bill.senateStatus = success ? 'pass' : 'skip';
        if (hasThirdChamber()) bill.thirdStatus = success ? 'pass' : 'skip';
        bill.houseVote = { yea, nay: 0, abs: 0, total: odds.seats.length, required: odds.need };
        bill.voteDate = bill.voteDate || nowDate();
        (bill.voteHistory = bill.voteHistory || []).push({ chamber: 'house', result: res, date: bill.voteDate, yea, nay: 0, abs: 0, total: odds.seats.length, required: odds.need, threshold: 0.5, at: new Date().toISOString() });
        bill.t63Breakthrough = { entered: yea, blocked: blocked.length };
        if (success) {
            bill.martialLawLiftApplied = true;
            bill.vetoStatus = 'signed'; // 계엄 해제 결의안은 거부권 대상이 아님
            emergencyPowers.martialLaw.active = false;
            emergencyPowers.martialLaw.suspendParliament = false;
            try { renderEmergencyPowers(); applyMartialLawEffects(); } catch (e) { /* 화면 준비 전 */ }
            effects.push('가결 — 계엄령 해제');
        } else {
            effects.push('부결 — 계엄 유지 (결의안은 부결로 기록, 다시 시도하려면 새 결의안으로)');
        }
        addLog('breakthrough', '계엄 중 봉쇄 돌파', odds.chance, success, effects);
        rerender();
    }

    // ---- 봉쇄 돌파 애니메이션 — 옆 시각 화면(하원 반원) 위에 겹쳐 그린다 ----
    // 의원들이 아래에서 올라와 봉쇄선에 닿고, 뚫은 의원은 자기 좌석으로 들어가 불이 켜지고, 막힌 의원은 물러난다.
    // 하원 반원이 보이지 않거나(모바일 · 다른 탭) 움직임 줄이기 설정이면 건너뛰고 바로 결과. 화면을 누르면 끝으로 건너뜀.
    function houseCanvasReady() {
        const cvs = document.getElementById('houseCanvas');
        return cvs && cvs.offsetParent !== null && cvs.clientWidth > 50 && (dotCache.house || []).length ? cvs : null;
    }
    function playBreakthrough(r, done) {
        let finished = false;
        const finish = () => { if (finished) return; finished = true; done(); };
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!ui.anim || reduce) { finish(); return; }
        // 데스크톱이면 하원 반원 화면을 앞으로
        try {
            if (document.getElementById('dispTabHouse')?.style.display !== 'none' && !document.getElementById('dispPanelHouse')?.classList.contains('active')) switchDispTab('house');
            if (document.getElementById('houseViewArcWrap')?.style.display === 'none') chamberSetView('house', 'arc');
        } catch (e) { /* 시각 화면 없음 */ }
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const cvs = houseCanvasReady();
            if (!cvs) { finish(); return; }
            runBreakthroughAnim(cvs, r, finish);
        }));
    }
    function runBreakthroughAnim(cvs, r, finish) {
        const wrap = cvs.parentElement;
        wrap.style.position = 'relative';
        document.getElementById('t63Anim')?.remove();
        const W = cvs.clientWidth, H = cvs.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        const ov = document.createElement('canvas');
        ov.id = 't63Anim';
        ov.className = 't63-anim';
        ov.width = W * dpr; ov.height = H * dpr;
        ov.style.cssText = `position:absolute;left:${cvs.offsetLeft}px;top:${cvs.offsetTop}px;width:${W}px;height:${H}px;z-index:60;cursor:pointer;`;
        ov.title = '눌러서 건너뛰기';
        wrap.appendChild(ov);
        const shade = document.querySelector('#dispPanelHouse .martial-law-shade');
        if (shade) shade.style.opacity = '0.35';
        const ctx = ov.getContext('2d');
        ctx.scale(dpr, dpr);
        const modern = root.getAttribute('data-theme-family') === 'modern';
        const dark = root.getAttribute('data-theme-mode') === 'dark';
        const C = modern ? { bg: dark ? 'rgba(10,10,12,.88)' : 'rgba(255,255,255,.9)', seat: dark ? '#3f3f46' : '#d4d4d8', text: dark ? '#fafafa' : '#18181b', dim: dark ? '#a1a1aa' : '#71717a', font: 'Pretendard, system-ui, sans-serif' }
            : { bg: 'rgba(5,7,10,.9)', seat: '#333', text: '#e6e6e6', dim: '#888', font: "'NeoDunggeunmo', monospace" };
        const ALERT = '#e05555', OK = '#3fbf7f';
        const dots = dotCache.house;
        const cy = dots[0] ? dots[0].cy : H - 60;
        const barrierY = Math.min(H - 22, cy + 26);
        const dotR = dots[0] ? dots[0].r : 4;
        const hurtSet = new Set(r.hurtSeats.map(s => s.i));
        // 의원(움직이는 점) — 들어가는 순서는 무작위, 1.8초에 걸쳐 차례로 출발
        const movers = r.entered.map(s => ({ s, ok: true })).concat(r.blocked.map(s => ({ s, ok: false }))).sort(() => Math.random() - 0.5);
        const SPREAD = 1800, WALK = 650, ENTER = 700, BOUNCE = 700;
        movers.forEach((m, k) => {
            const d = dots[m.s.i];
            m.color = (d && d.color) || m.s.party.color || '#888';
            m.sx = 12 + Math.random() * (W - 24);
            m.bx = m.sx + (Math.random() - 0.5) * 30;
            m.start = (k / Math.max(1, movers.length)) * SPREAD + Math.random() * 120;
            m.tx = d ? d.x : m.bx; m.ty = d ? d.y : cy;
            m.hurt = hurtSet.has(m.s.i);
        });
        const total = SPREAD + 120 + WALK + Math.max(ENTER, BOUNCE) + 200;
        const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        let t0 = null, raf = 0, holdTimer = 0, ended = false;

        function frame(now) {
            if (t0 == null) t0 = now;
            const t = ended ? total + 1 : now - t0;
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
            // 빈 좌석
            ctx.lineWidth = 1;
            dots.forEach(d => { if (d.partyName === 'Vacant') return; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.strokeStyle = C.seat; ctx.stroke(); });
            // 봉쇄선
            ctx.save();
            ctx.strokeStyle = ALERT; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
            ctx.beginPath(); ctx.moveTo(6, barrierY); ctx.lineTo(W - 6, barrierY); ctx.stroke();
            ctx.restore();
            let arrived = 0;
            movers.forEach(m => {
                const lt = t - m.start;
                if (lt < 0) return;
                let x, y, alpha = 1;
                if (lt < WALK) { const k = ease(lt / WALK); x = m.sx + (m.bx - m.sx) * k; y = H + 8 + (barrierY - H - 8) * k; }
                else if (m.ok) {
                    const k = ease(Math.min(1, (lt - WALK) / ENTER));
                    x = m.bx + (m.tx - m.bx) * k; y = barrierY + (m.ty - barrierY) * k;
                    if (k >= 1) arrived++;
                } else {
                    const k = Math.min(1, (lt - WALK) / BOUNCE);
                    x = m.bx + Math.sin(k * Math.PI * 6) * 3 * (1 - k); y = barrierY + 4 + k * 40; alpha = 1 - k;
                }
                if (alpha <= 0) return;
                ctx.globalAlpha = alpha;
                ctx.beginPath(); ctx.arc(x, y, dotR, 0, Math.PI * 2); ctx.fillStyle = m.color; ctx.fill();
                if (!m.ok && m.hurt && lt >= WALK) { ctx.strokeStyle = ALERT; ctx.lineWidth = 2; ctx.stroke(); }
                ctx.globalAlpha = 1;
            });
            // 봉쇄선 이름 — 움직이는 의원 위에
            ctx.font = `11px ${C.font}`; ctx.textAlign = 'left';
            const lw = ctx.measureText('계엄군 봉쇄선').width;
            ctx.fillStyle = C.bg; ctx.fillRect(4, barrierY + 4, lw + 8, 15);
            ctx.fillStyle = ALERT; ctx.fillText('계엄군 봉쇄선', 8, barrierY + 15);
            // 막힌 의원 수 (봉쇄선에 닿은 뒤)
            const stopped = movers.filter(m => !m.ok && t - m.start >= WALK).length;
            // 집계
            const passNow = arrived >= r.need;
            ctx.textAlign = 'center';
            ctx.font = `bold 15px ${C.font}`;
            ctx.fillStyle = passNow ? OK : C.text;
            ctx.fillText(`입장 ${arrived} / 필요 ${r.need}`, W / 2, 20);
            ctx.font = `11px ${C.font}`; ctx.fillStyle = C.dim;
            ctx.fillText(`봉쇄에 막힘 ${stopped}${r.hurtSeats.length ? ` · 부상 ${r.hurtSeats.length}` : ''}`, W / 2, 36);
            if (t >= total) {
                ctx.font = `bold 18px ${C.font}`;
                ctx.fillStyle = r.success ? OK : ALERT;
                ctx.fillText(r.success ? '가결 — 계엄 해제' : '부결 — 계엄 유지', W / 2, cy - (dots[0] ? Math.hypot(dots[0].x - dots[0].cx, dots[0].y - dots[0].cy) : 60) * 0.35);
                if (!holdTimer) holdTimer = setTimeout(close, 2200);
                finish();
                return;
            }
            raf = requestAnimationFrame(frame);
        }
        function close() {
            cancelAnimationFrame(raf); clearTimeout(holdTimer);
            ov.style.transition = 'opacity .5s'; ov.style.opacity = '0';
            setTimeout(() => ov.remove(), 520);
            if (shade) shade.style.opacity = '';
        }
        ov.addEventListener('click', () => {
            if (!ended && !holding()) { ended = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
            else close();
        });
        const holding = () => holdTimer !== 0;
        raf = requestAnimationFrame(frame);
    }

    // ================= 물리적 의사 방해 (의장석 점거) =================
    function pendingBills() {
        return (typeof bills !== 'undefined' ? bills : []).filter(b => !b.isMartialLawLift && (b.tabledTo || 'parliament') !== 'council'
            && getBillOverallStatus(b) === 'pending' && b.houseStatus === 'pending');
    }
    function obstructorParties() {
        const ids = Object.keys(ui.obstructors).filter(k => ui.obstructors[k]);
        return ids.map(partyById).filter(Boolean);
    }
    function obstructOdds() {
        const seats = houseSeats();
        const hurt = injuredKeys('house');
        const obs = obstructorParties();
        const obsSeats = seats.filter(s => obs.includes(s.party) && !hurt.has(s.key));
        const n = Math.round(obsSeats.length * ui.share / 100);
        const total = Math.max(1, seats.length);
        const others = seats.filter(s => !obs.includes(s.party)).length;
        const coh = obsSeats.length ? obsSeats.reduce((a, s) => a + cohesionOf(s.party), 0) / obsSeats.length : 50;
        const f = [];
        const add = (label, v) => f.push({ label, v: Math.round(v) });
        add('기본', 15);
        add(`점거에 나선 의원 ${n}명 (의석의 ${Math.round(n / total * 100)}%)`, Math.min(40, n / total * 100 * 1.2));
        add(`상대 진영 ${others}명 (의석의 ${Math.round(others / total * 100)}%)`, -(others / total * 100 - 50) * 0.4);
        add(`정당 결속도 (평균 ${Math.round(coh)})`, (coh - 50) * 0.4);
        if (ui.guard) add(`의장${speakerName() ? ' ' + speakerName() : ''} 경호권 발동`, -20);
        if (ui.direct && !S.advancedAct) add('직권상정', -10);
        if (S.advancedAct) add('국회선진화법 (위법 부담)', -10);
        const raw = f.reduce((a, x) => a + x.v, 0);
        return { f, n, obsSeats, seats, chance: clamp(Math.round(raw), 5, 90) };
    }

    function obstruct() {
        const bill = bills.find(b => b.id === ui.billId);
        if (!bill) { showCustomAlert('막을 법안을 고르세요.'); return; }
        const obs = obstructorParties();
        if (!obs.length) { showCustomAlert('의장석을 점거할 정당을 고르세요.'); return; }
        const odds = obstructOdds();
        if (!odds.n) { showCustomAlert('점거에 나설 의원이 없습니다.'); return; }
        showCustomConfirm(`『${bill.title}』 표결을 막으려 ${obs.map(p => p.name).join(' · ')} 의원 ${odds.n}명이 의장석을 점거합니다. 성공 확률 ${odds.chance}%.\n계속하시겠습니까?`, () => {
            const success = Math.random() * 100 < odds.chance;
            const mult = S.advancedAct ? 2 : 1;
            const effects = [];
            if (ui.direct && !S.advancedAct && bill.committeeStatus === 'pending') { bill.committeeStatus = 'pass'; bill.t63DirectTabled = true; effects.push('의장 직권상정 — 상임위원회 심사를 건너뜀'); }
            if (success) {
                bill.t63Obstructed = (bill.t63Obstructed || 0) + 1;
                effects.push(`표결 무산 — 『${bill.title}』은(는) 계속 계류 (지금까지 ${bill.t63Obstructed}번 무산)`);
            } else {
                effects.push('점거 해산 — 표결은 그대로 진행됩니다 (입법 › 표결)');
            }
            // 지지율 페널티
            const pen = (success ? 0.05 : 0.08) * mult;
            obs.forEach(p => cutSupport(p, 1 - pen));
            effects.push(`${obs.map(p => p.name).join(' · ')} 지지율 ${Math.round(pen * 100)}% 하락 (폭력 사용)${S.advancedAct ? ' — 국회선진화법: 국회회의방해죄 고발로 페널티 두 배' : ''}`);
            if (ui.guard) {
                const gov = parties.filter(p => isGovParty(p) && !obs.includes(p));
                if (gov.length) { gov.forEach(p => cutSupport(p, 1 - 0.02 * mult)); effects.push(`경호권 몸싸움 — ${gov.map(p => p.name).join(' · ')} 지지율 ${2 * mult}% 하락`); }
            }
            // 부상 — 점거 의원 위주, 경호권이면 더 많이
            const part = odds.obsSeats.slice().sort(() => Math.random() - 0.5).slice(0, odds.n);
            const hurtN = Math.max(ui.guard ? 1 : 0, Math.round(odds.n * (0.02 + Math.random() * 0.04) * (ui.guard ? 1.6 : 1)));
            const pool = part.concat(odds.seats.filter(s => !obs.includes(s.party)).sort(() => Math.random() - 0.5).slice(0, Math.ceil(hurtN / 4)));
            const hurtList = injure(pool, hurtN);
            if (hurtList.length) effects.push(`부상 결석: ${hurtList.join(', ')}`);
            addLog('obstruct', `의장석 점거 — 『${bill.title}』`, odds.chance, success, effects);
            ui.lastBillId = bill.id;
            rerender();
        });
    }

    // ---- 부상 결석: 표결에서 빼고, 표결을 확정할 때마다 하나씩 회복 ----
    function injuredIndexes(ch) {
        let bySeat = [];
        try { bySeat = seatAssignments(ch).bySeat || []; } catch (e) { return []; }
        const keys = injuredKeys(ch);
        return bySeat.map((k, i) => (keys.has(k) ? i : -1)).filter(i => i >= 0);
    }
    function clearInjuredVotes(ch) {
        if (typeof voteState === 'undefined' || !voteState[ch]) return 0;
        let n = 0;
        injuredIndexes(ch).forEach(i => { if (voteState[ch][i]) { delete voteState[ch][i]; n++; } });
        return n;
    }
    const origConfirm = window.confirmChamberVote;
    window.confirmChamberVote = function (chamber) {
        clearInjuredVotes(chamber);
        const before = (typeof bills !== 'undefined' && bills.find(b => b.id === activeBillIdSafe())) || null;
        const hist = before ? (before.voteHistory || []).length : 0;
        const r = origConfirm.apply(this, arguments);
        // 표결이 실제로 확정됐을 때만 회복이 한 번 진행
        if (before && (before.voteHistory || []).length > hist) {
            S.injured.forEach(x => { if (x.ch === chamber) x.left -= 1; });
            S.injured = S.injured.filter(x => x.left > 0);
            renderSiege();
        }
        return r;
    };
    function activeBillIdSafe() { try { return activeBillId; } catch (e) { return null; } } // eslint-disable-line no-undef
    ['applyPartyVote', 'applyFactionVote'].forEach(fn => {
        const orig = window[fn];
        if (typeof orig !== 'function') return;
        window[fn] = function () {
            const r = orig.apply(this, arguments);
            let n = 0;
            chamberList().forEach(ch => { n += clearInjuredVotes(ch); });
            if (n) { try { redrawAll(); updateVoteResults(); } catch (e) { /* 화면 준비 전 */ } }
            return r;
        };
    });
    const origSeatCard = window.showSeatInfoCard;
    window.showSeatInfoCard = function (chamber, hit) {
        const r = origSeatCard.apply(this, arguments);
        let key = null;
        try { key = (seatAssignments(chamber).bySeat || [])[hit]; } catch (e) { /* 배정 전 */ }
        const x = key && S.injured.find(y => y.ch === chamber && y.key === key);
        const body = document.getElementById('seatInfoCardBody');
        if (x && body) body.insertAdjacentHTML('beforeend', `<div class="t63-hurt-row">🩹 부상 결석 — 다음 표결 ${x.left}번 불참</div>`);
        return r;
    };

    // ================= 화면: 입법 › 공성전 =================
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTab() {
        const law = document.getElementById('mainContentLaw');
        const bar = law && law.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const after = document.getElementById('subTabVote');
        const btn = el(`<button class="sub-tab-btn" onclick="switchSubTab('law','siege')" id="subTabSiege">공성전</button>`);
        if (after && after.nextSibling) bar.insertBefore(btn, after.nextSibling); else bar.appendChild(btn);
        law.appendChild(el(`<div id="contentSiege" class="sub-tab-content"></div>`));
    })();
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'law' && sub === 'siege') renderSiege();
        return r;
    };

    const factorRow = x => `<div class="t63-factor"><span>${esc(x.label)}</span><span class="${x.v >= 0 ? 't63-plus' : 't63-minus'}">${x.v >= 0 ? '+' : ''}${x.v}%p</span></div>`;
    const resultCard = e => e ? `<div class="t63-result ${e.success ? 'ok' : 'fail'}">
            <div class="t63-result-head"><span class="t63-badge ${e.success ? 'ok' : 'fail'}">${e.success ? '✔ 성공' : '✘ 실패'}</span><span>${esc(e.title)}</span></div>
            <div class="t63-dim t63-small">${esc(e.date)} · 성공 확률 ${e.chance}%</div>
            <ul>${e.effects.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            ${e.kind === 'obstruct' && !e.success && ui.lastBillId ? '<button type="button" class="t63-btn" data-act="tovote">입법 › 표결로 가기 →</button>' : ''}
        </div>` : '';
    const chip = (text, cls) => `<span class="t63-stat ${cls || ''}">${text}</span>`;
    const dot = c => `<i class="t63-dot" style="background:${esc(c)}"></i>`;
    const blockadeWord = v => (v >= 80 ? '철통' : v >= 60 ? '강함' : v >= 35 ? '보통' : '느슨함');
    const emptyState = (icon, text, extra) => `<div class="t63-empty"><div class="t63-empty-icon">${icon}</div><div>${text}</div>${extra || ''}</div>`;
    // 확률 게이지 — 큰 숫자 + 막대
    const gauge = (label, chance, sub) => `<div class="t63-gauge"><div class="t63-gauge-head"><span>${label}</span><b class="${chance >= 50 ? 'hi' : chance >= 25 ? 'mid' : 'lo'}">${chance}%</b></div>
        <div class="t63-bar"><span style="width:${chance}%"></span></div>${sub ? `<div class="t63-dim t63-small">${sub}</div>` : ''}</div>`;

    function renderBreakPanel(seats, last) {
        const res = last && last.kind === 'breakthrough' ? resultCard(last) : '';
        const ml = emergencyPowers.martialLaw;
        if (!ml.active) return res + emptyState('🚧', '계엄령이 선포돼 있지 않습니다.<br>대통령 · 총리 탭의 비상 권한으로 계엄령을 선포하면 열립니다.',
            '<button type="button" class="t63-btn" data-act="martial">계엄령 선포 (의회 정지, 시험용)</button>');
        if (T61() && T61().junta) return res + emptyState('🎖', '군정에서는 의회가 해산돼 있습니다.<br>내각 › 쿠데타 · 혁명으로 군정을 끝내세요.');
        const o = breakthroughOdds();
        const total = Math.max(1, o.seats.length);
        const needPct = o.need / total * 100;
        const segs = o.groups.map(g => ({ g, v: g.try * g.prob })).filter(x => x.v > 0.5);
        let html = `<div class="t63-meter-box">
                <div class="t63-meter-head"><span>예상 입장 <b>${Math.round(o.expected)}</b>명</span><span class="t63-dim">재적 ${o.seats.length} · 과반 ${o.need}</span></div>
                <div class="t63-meter">${segs.map(x => `<span style="width:${x.v / total * 100}%;background:${esc(x.g.p.color)}" title="${esc(x.g.p.name)} 약 ${Math.round(x.v)}명"></span>`).join('')}
                    <em style="left:${needPct}%"></em></div>
                <div class="t63-meter-legend">${segs.map(x => `<span>${dot(x.g.p.color)}${esc(x.g.p.name)} ${Math.round(x.v)}</span>`).join('')}<span class="t63-need">┃ 과반 ${o.need}</span></div>
            </div>
            ${gauge('계엄 해제 성공 확률', o.chance, '들어간 의원만 표결 — 가결 기준은 들어간 인원이 아니라 재적 과반')}
            <div class="t63-group"><div class="t63-group-title">봉쇄</div>
                <div class="t63-row"><span class="t63-lbl">봉쇄 강도</span><input type="range" min="0" max="100" value="${blockade()}" data-in="blockade" data-live="blockadeVal"><b id="blockadeVal">${blockade()} · ${blockadeWord(blockade())}</b></div>
                <div class="t63-dim t63-small">기본값은 군 지휘부의 평균 충성도 (내각 › 군부)</div>
                <label class="t63-toggle"><input type="checkbox" data-in="citizens" ${ui.citizens ? 'checked' : ''}><span>시민들이 국회 앞에 모여 길을 엶 <em>입장 확률 +10%p</em></span></label>
            </div>
            <div class="t63-group"><div class="t63-group-title">정당별 참여</div>
                ${o.groups.map(g => `<div class="t63-prow">
                    <div class="t63-prow-head">${dot(g.p.color)}<b>${esc(g.p.name)}</b>${isGovParty(g.p) ? '<span class="t63-tag">여당</span>' : ''}<span class="t63-dim">${g.n}석</span>
                        <span class="t63-prow-exp">입장 ${Math.round(g.prob * 100)}% · 예상 <b>${Math.round(g.try * g.prob)}</b></span></div>
                    <div class="t63-row"><span class="t63-lbl">참여율</span><input type="range" min="0" max="100" step="5" value="${rateOf(g.p)}" data-rate="${esc(g.p.id)}" data-live="rate_${esc(g.p.id)}"><b id="rate_${esc(g.p.id)}">${rateOf(g.p)}%</b></div>
                </div>`).join('')}
            </div>
            <label class="t63-toggle"><input type="checkbox" data-in="anim" ${ui.anim ? 'checked' : ''}><span>옆 반원 화면에 돌파 애니메이션 보기</span></label>
            <button type="button" class="t63-go" data-act="break">🚪 봉쇄 돌파 · 계엄 해제 표결</button>`;
        return html + res;
    }

    function renderObstructPanel(seats, ps, last) {
        const pb = pendingBills();
        if (ui.billId && !pb.some(b => b.id === ui.billId)) ui.billId = '';
        if (!ui.billId && pb.length) ui.billId = pb[0].id;
        if (!obstructorParties().length && ps.length) {
            const opp = ps.filter(p => !isGovParty(p)).sort((a, b) => seats.filter(s => s.party === b).length - seats.filter(s => s.party === a).length)[0];
            if (opp) ui.obstructors[opp.id] = true;
        }
        if (!pb.length) return emptyState('📜', '표결을 기다리는 법안이 없습니다.<br>입법 › 제출에서 법안을 올리세요.');
        const o = obstructOdds();
        const obs = obstructorParties();
        const total = Math.max(1, o.seats.length);
        const others = o.seats.filter(s => !obs.includes(s.party));
        const otherParties = seatParties(others);
        let html = `<div class="t63-group"><div class="t63-group-title">막을 법안</div>
                <select data-in="bill">${pb.map(b => `<option value="${esc(b.id)}" ${b.id === ui.billId ? 'selected' : ''}>${esc(b.title)}${b.committeeStatus === 'pending' ? ' (상임위 심사 중)' : ''}${b.t63Obstructed ? ` · 무산 ${b.t63Obstructed}번` : ''}</option>`).join('')}</select>
            </div>
            <div class="t63-group"><div class="t63-group-title">점거하는 정당</div>
                <div class="t63-chips">${ps.map(p => `<label class="t63-chip ${ui.obstructors[p.id] ? 'on' : ''}"><input type="checkbox" data-obs="${esc(p.id)}" ${ui.obstructors[p.id] ? 'checked' : ''}>${dot(p.color)}${esc(p.name)}</label>`).join('')}</div>
                <div class="t63-row"><span class="t63-lbl">참여 의원</span><input type="range" min="5" max="100" step="5" value="${ui.share}" data-in="share" data-live="shareVal"><b id="shareVal">${ui.share}%</b></div>
            </div>
            <div class="t63-vs">
                <div class="t63-vs-head"><span>점거 <b>${o.n}</b>명</span><span>상대 진영 <b>${others.length}</b>명</span></div>
                <div class="t63-vs-bar">${obs.map(p => { const n = Math.round(o.obsSeats.filter(s => s.party === p).length * ui.share / 100); return n ? `<span style="width:${n / total * 100}%;background:${esc(p.color)}"></span>` : ''; }).join('')}
                    <span class="t63-vs-gap" style="flex:1"></span>
                    ${otherParties.map(p => `<span class="t63-vs-opp" style="width:${others.filter(s => s.party === p).length / total * 100}%;background:${esc(p.color)}"></span>`).join('')}</div>
            </div>
            <div class="t63-group"><div class="t63-group-title">의장 쪽 대응</div>
                <label class="t63-toggle"><input type="checkbox" data-in="guard" ${ui.guard ? 'checked' : ''}><span>의장${speakerName() ? ' ' + esc(speakerName()) : ''} 경호권 발동 <em>경위 · 경찰 투입, 몸싸움 · 부상 늘어남</em></span></label>
                <label class="t63-toggle ${S.advancedAct ? 't63-off' : ''}"><input type="checkbox" data-in="direct" ${ui.direct && !S.advancedAct ? 'checked' : ''} ${S.advancedAct ? 'disabled' : ''}><span>직권상정 <em>${S.advancedAct ? '국회선진화법으로 막힘' : '의장이 바로 본회의에 올림'}</em></span></label>
            </div>
            ${gauge('점거 성공 확률', o.chance, '')}
            <details class="t63-factors"><summary class="t63-dim">확률 계산 보기</summary>${o.f.map(factorRow).join('')}<div class="t63-dim t63-small">합계는 5~90% 사이로 맞춥니다.</div></details>
            <button type="button" class="t63-go" data-act="obstruct">✊ 의장석 점거</button>`;
        if (last && last.kind === 'obstruct') html += resultCard(last);
        return html;
    }

    function renderSiege() {
        const box = document.getElementById('contentSiege');
        if (!box) return;
        const ml = emergencyPowers.martialLaw;
        const seats = houseSeats();
        const ps = seatParties(seats);
        const last = S.log.find(x => x.id === ui.last);
        if (!ui.mode) ui.mode = ml.active ? 'break' : 'obstruct';
        const pbN = pendingBills().length;
        let html = `<div class="t63-head">
                <div class="t63-intro">계엄군의 봉쇄를 뚫고 본회의장에 들어가 계엄을 해제하거나, 의장석을 점거해 반대 법안의 표결을 막습니다. 폭력에는 지지율 페널티와 부상이 따릅니다.</div>
                <div class="t63-stats">
                    ${ml.active ? chip(`⚠ 계엄 선포 중${ml.suspendParliament ? ' · 의회 정지' : ''}`, 'alert') : chip('계엄 없음')}
                    ${chip(`국회선진화법 ${S.advancedAct ? '켜짐' : '꺼짐'}`, S.advancedAct ? 'on' : '')}
                    ${chip(`🩹 부상 결석 ${S.injured.length}`, S.injured.length ? 'warn' : '')}
                    ${chip(`📜 계류 법안 ${pbN}`)}
                </div>
            </div>`;
        if (!seats.length) html += emptyState('🏛', '의석이 없습니다 — 먼저 의회를 구성하세요.');
        html += `<div class="t63-modes">
                <button type="button" class="t63-mode ${ui.mode === 'break' ? 'active' : ''}" data-mode="break"><b>🚧 봉쇄 돌파</b><span>계엄 해제 표결</span>${ml.active ? '<i class="t63-live"></i>' : ''}</button>
                <button type="button" class="t63-mode ${ui.mode === 'obstruct' ? 'active' : ''}" data-mode="obstruct"><b>🪑 의장석 점거</b><span>표결 막기</span></button>
            </div>
            <div class="t63-panel">${ui.mode === 'break' ? renderBreakPanel(seats, last) : renderObstructPanel(seats, ps, last)}</div>`;

        // --- 설정 · 부상 · 기록 (접어 둠) ---
        html += `<details class="t63-fold" ${ui.openSet ? 'open' : ''} data-fold="openSet"><summary>⚖ 설정 · 정당 결속도</summary>
                <label class="t63-toggle"><input type="checkbox" data-in="act" ${S.advancedAct ? 'checked' : ''}><span>국회선진화법 <em>직권상정 제한, 폭력 페널티 두 배 (국회회의방해죄)</em></span></label>
                <div class="t63-dim t63-small" style="margin:8px 0 2px">정당 결속도 — 봉쇄 돌파 입장 확률 · 점거 성공 확률에 반영</div>
                ${ps.map(p => `<div class="t63-row"><span class="t63-lbl">${dot(p.color)}${esc(p.name)}</span><input type="range" min="0" max="100" step="5" value="${cohesionOf(p)}" data-coh="${esc(p.id)}" data-live="coh_${esc(p.id)}"><b id="coh_${esc(p.id)}">${cohesionOf(p)}</b></div>`).join('') || '<div class="t63-dim">정당 없음</div>'}
            </details>
            <details class="t63-fold" ${ui.openHurt ? 'open' : ''} data-fold="openHurt"><summary>🩹 부상 결석 (${S.injured.length})</summary>
                ${S.injured.length ? S.injured.map(x => `<div class="t63-hurt"><span>${esc(x.name)} <span class="t63-dim">${esc(x.party)}</span></span><span class="t63-dim">다음 표결 ${x.left}번 불참</span><button type="button" class="t63-btn t63-mini" data-heal="${esc(x.id)}">회복</button></div>`).join('')
                    : '<div class="t63-dim">다친 의원이 없습니다. 다친 의원은 표결에서 빠지고, 표결을 확정할 때마다 하나씩 회복합니다.</div>'}
            </details>
            <details class="t63-fold" ${ui.openLog ? 'open' : ''} data-fold="openLog"><summary>📋 공성전 기록 (${S.log.length})</summary>
                ${S.log.length ? S.log.map(e => `<div class="t63-log-row"><span class="${e.success ? 't63-plus' : 't63-minus'}">${e.success ? '✔' : '✘'}</span><span class="t63-dim">${esc(e.date)}</span><span>${esc(e.title)}</span><span class="t63-dim">${e.chance}%</span></div>`).join('') : '<div class="t63-dim">아직 기록이 없습니다.</div>'}
            </details>`;
        box.innerHTML = html;

        const on = (sel, ev, fn) => box.querySelectorAll(sel).forEach(n => n.addEventListener(ev, () => fn(n)));
        // 슬라이더는 끌 때 숫자만 바꾸고, 놓으면 다시 계산
        on('[data-live]', 'input', n => {
            const out = document.getElementById(n.dataset.live);
            if (!out) return;
            const v = Number(n.value);
            out.textContent = n.dataset.in === 'blockade' ? `${v} · ${blockadeWord(v)}` : n.dataset.rate || n.dataset.in === 'share' ? `${v}%` : String(v);
        });
        on('[data-mode]', 'click', n => { ui.mode = n.dataset.mode; renderSiege(); });
        on('[data-fold]', 'toggle', n => { ui[n.dataset.fold] = n.open; });
        on('[data-in="blockade"]', 'change', n => { ui.blockade = Number(n.value); renderSiege(); });
        on('[data-in="anim"]', 'change', n => { ui.anim = n.checked; });
        on('[data-in="citizens"]', 'change', n => { ui.citizens = n.checked; renderSiege(); });
        on('[data-rate]', 'change', n => { ui.rate[n.dataset.rate] = clamp(Number(n.value) || 0, 0, 100); renderSiege(); });
        on('[data-in="bill"]', 'change', n => { ui.billId = n.value; renderSiege(); });
        on('[data-obs]', 'change', n => { ui.obstructors[n.dataset.obs] = n.checked; renderSiege(); });
        on('[data-in="share"]', 'change', n => { ui.share = Number(n.value); renderSiege(); });
        on('[data-in="guard"]', 'change', n => { ui.guard = n.checked; renderSiege(); });
        on('[data-in="direct"]', 'change', n => { ui.direct = n.checked; renderSiege(); });
        on('[data-in="act"]', 'change', n => { S.advancedAct = n.checked; renderSiege(); });
        on('[data-coh]', 'change', n => { S.cohesion[n.dataset.coh] = Number(n.value); renderSiege(); });
        on('[data-heal]', 'click', n => { S.injured = S.injured.filter(x => x.id !== n.dataset.heal); renderSiege(); });
        on('[data-act="break"]', 'click', breakthrough);
        on('[data-act="obstruct"]', 'click', obstruct);
        on('[data-act="martial"]', 'click', () => {
            emergencyPowers.martialLaw.holder = emergencyPowers.martialLaw.holder === 'none' ? 'president' : emergencyPowers.martialLaw.holder;
            emergencyPowers.martialLaw.suspendParliament = true;
            emergencyPowers.martialLaw.active = true;
            try { renderEmergencyPowers(); applyMartialLawEffects(); } catch (e) { /* 화면 준비 전 */ }
            renderSiege();
        });
        on('[data-act="tovote"]', 'click', () => { try { selectBillForVote(ui.lastBillId); } catch (e) { /* 법안 없음 */ } switchSubTab('law', 'vote'); });
    }

    function refresh() { renderSiege(); }

    const style = document.createElement('style');
    style.textContent = `
        #contentSiege { --t63-acc: #f0a030; --t63-alert: #e05555; --t63-ok: #3fbf7f; --t63-line: #333; --t63-soft: rgba(255,255,255,.03); --t63-dim: #888; --t63-text: #ddd; }
        html[data-theme-family="modern"] #contentSiege { --t63-acc: #d97706; --t63-alert: var(--m-danger, #dc2626); --t63-ok: var(--m-success, #16a34a); --t63-line: var(--m-border); --t63-soft: var(--m-surface-2); --t63-dim: var(--m-text-3); --t63-text: var(--m-text); }
        .t63-head { margin: 6px 0 10px; }
        .t63-intro { color: var(--t63-dim); font-size: .78rem; line-height: 1.6; margin-bottom: 8px; }
        .t63-stats { display: flex; flex-wrap: wrap; gap: 6px; }
        .t63-stat { font-size: .74rem; padding: 3px 8px; border: 1px solid var(--t63-line); color: var(--t63-dim); white-space: nowrap; }
        .t63-stat.alert { color: var(--t63-alert); border-color: var(--t63-alert); }
        .t63-stat.warn { color: var(--t63-acc); border-color: var(--t63-acc); }
        .t63-stat.on { color: var(--t63-text); border-color: var(--t63-text); }
        .t63-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
        .t63-mode { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 12px; cursor: pointer; font-family: inherit; text-align: left; background: transparent; border: 1px solid var(--t63-line); color: var(--t63-dim); }
        .t63-mode b { font-size: .95rem; font-weight: normal; color: var(--t63-text); }
        .t63-mode span { font-size: .72rem; }
        .t63-mode.active { border-color: var(--t63-acc); box-shadow: inset 0 -3px 0 var(--t63-acc); }
        .t63-mode.active b { color: var(--t63-acc); }
        .t63-live { position: absolute; top: 9px; right: 10px; width: 8px; height: 8px; border-radius: 50%; background: var(--t63-alert); animation: t63pulse 1.2s infinite; }
        @keyframes t63pulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
        .t63-panel { border: 1px solid var(--t63-line); padding: 12px; margin-bottom: 10px; background: var(--t63-soft); }
        .t63-group { margin: 0 0 12px; }
        .t63-group-title { font-size: .72rem; color: var(--t63-dim); letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
        .t63-panel select { width: 100%; box-sizing: border-box; }
        .t63-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: .85rem; }
        .t63-row input[type=range] { flex: 1; min-width: 0; accent-color: var(--t63-acc); }
        .t63-row b { min-width: 3.2em; text-align: right; font-weight: normal; color: var(--t63-text); white-space: nowrap; }
        .t63-lbl { min-width: 5.5em; color: var(--t63-dim); font-size: .78rem; display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .t63-dim { color: var(--t63-dim); font-size: .8rem; } .t63-small { font-size: .72rem; }
        .t63-off { opacity: .5; }
        .t63-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-right: 4px; vertical-align: middle; }
        .t63-toggle { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; font-size: .85rem; color: var(--t63-text); cursor: pointer; }
        .t63-toggle input { margin-top: 3px; accent-color: var(--t63-acc); }
        .t63-toggle em { display: block; font-style: normal; font-size: .72rem; color: var(--t63-dim); }
        .t63-meter-box { margin-bottom: 10px; }
        .t63-meter-head { display: flex; justify-content: space-between; align-items: baseline; font-size: .85rem; color: var(--t63-text); margin-bottom: 6px; }
        .t63-meter-head b { font-size: 1.3rem; font-weight: normal; color: var(--t63-acc); }
        .t63-meter { position: relative; display: flex; height: 16px; background: rgba(127,127,127,.15); overflow: visible; }
        .t63-meter span { display: block; height: 100%; }
        .t63-meter em { position: absolute; top: -4px; bottom: -4px; width: 2px; margin-left: -1px; background: var(--t63-text); }
        .t63-meter-legend { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: .72rem; color: var(--t63-dim); margin-top: 6px; }
        .t63-need { color: var(--t63-text); }
        .t63-gauge { border: 1px solid var(--t63-line); padding: 10px; margin: 0 0 12px; }
        .t63-gauge-head { display: flex; justify-content: space-between; align-items: baseline; font-size: .85rem; color: var(--t63-text); }
        .t63-gauge-head b { font-size: 1.7rem; font-weight: normal; }
        .t63-gauge-head b.hi { color: var(--t63-ok); } .t63-gauge-head b.mid { color: var(--t63-acc); } .t63-gauge-head b.lo { color: var(--t63-alert); }
        .t63-bar { height: 8px; background: rgba(127,127,127,.2); margin: 6px 0; }
        .t63-bar span { display: block; height: 100%; background: var(--t63-acc); }
        .t63-prow { padding: 8px 0; border-bottom: 1px solid var(--t63-line); }
        .t63-prow:last-child { border-bottom: none; }
        .t63-prow-head { display: flex; align-items: center; gap: 6px; font-size: .85rem; flex-wrap: wrap; }
        .t63-prow-head b { font-weight: normal; color: var(--t63-text); }
        .t63-prow-exp { margin-left: auto; font-size: .74rem; color: var(--t63-dim); }
        .t63-prow-exp b { color: var(--t63-acc); }
        .t63-tag { font-size: .66rem; padding: 0 5px; border: 1px solid var(--t63-acc); color: var(--t63-acc); }
        .t63-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .t63-chip { display: inline-flex; align-items: center; gap: 2px; font-size: .82rem; border: 1px solid var(--t63-line); padding: 5px 10px; cursor: pointer; color: var(--t63-dim); }
        .t63-chip input { display: none; }
        .t63-chip.on { border-color: var(--t63-acc); color: var(--t63-text); background: color-mix(in srgb, var(--t63-acc) 12%, transparent); }
        .t63-vs { margin: 0 0 12px; }
        .t63-vs-head { display: flex; justify-content: space-between; font-size: .8rem; color: var(--t63-dim); margin-bottom: 5px; }
        .t63-vs-head b { color: var(--t63-text); font-weight: normal; font-size: 1rem; }
        .t63-vs-bar { display: flex; height: 14px; gap: 1px; background: rgba(127,127,127,.12); }
        .t63-vs-bar span { display: block; height: 100%; }
        .t63-vs-opp { opacity: .45; }
        .t63-factors { margin: -6px 0 12px; font-size: .8rem; } .t63-factors summary { cursor: pointer; }
        .t63-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: var(--t63-dim); padding: 2px 0; }
        .t63-plus { color: var(--t63-ok); } .t63-minus { color: var(--t63-alert); }
        .t63-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 12px; background: transparent; border: 2px solid var(--t63-acc); color: var(--t63-acc); letter-spacing: 1px; margin-top: 4px; }
        .t63-go:hover { background: color-mix(in srgb, var(--t63-acc) 14%, transparent); }
        .t63-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 6px 12px; background: transparent; border: 1px solid var(--t63-line); color: var(--t63-text); margin-top: 8px; }
        .t63-mini { margin: 0; padding: 2px 8px; font-size: .75rem; }
        .t63-empty { text-align: center; padding: 22px 10px; color: var(--t63-dim); font-size: .85rem; line-height: 1.7; }
        .t63-empty-icon { font-size: 1.8rem; margin-bottom: 4px; }
        .t63-panel > .t63-result:first-child { margin: 0 0 4px; }
        .t63-result { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--t63-line); border-left: 4px solid var(--t63-dim); }
        .t63-result.ok { border-left-color: var(--t63-ok); } .t63-result.fail { border-left-color: var(--t63-alert); }
        .t63-result-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: .92rem; color: var(--t63-text); margin-bottom: 2px; }
        .t63-badge { font-size: .74rem; padding: 1px 7px; border: 1px solid currentColor; }
        .t63-badge.ok { color: var(--t63-ok); } .t63-badge.fail { color: var(--t63-alert); }
        .t63-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .8rem; color: var(--t63-dim); line-height: 1.6; }
        .t63-fold { border: 1px solid var(--t63-line); padding: 0 12px; margin-bottom: 8px; }
        .t63-fold > summary { cursor: pointer; padding: 9px 0; font-size: .85rem; color: var(--t63-text); }
        .t63-fold[open] { padding-bottom: 10px; }
        .t63-hurt { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--t63-line); font-size: .82rem; color: var(--t63-text); }
        .t63-hurt-row { color: #f0a030; }
        .t63-log-row { display: grid; grid-template-columns: 1.2em auto 1fr auto; gap: 8px; padding: 4px 0; font-size: .8rem; color: var(--t63-text); border-bottom: 1px solid var(--t63-line); }
        html[data-theme-family="modern"] .t63-stat { border-radius: 999px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t63-mode { border-radius: 12px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t63-mode b { font-weight: 600; }
        html[data-theme-family="modern"] .t63-mode.active { box-shadow: inset 0 0 0 1px var(--t63-acc); background: color-mix(in srgb, var(--t63-acc) 7%, var(--m-surface)); }
        html[data-theme-family="modern"] .t63-panel, html[data-theme-family="modern"] .t63-fold { border-radius: 14px; }
        html[data-theme-family="modern"] .t63-fold { background: var(--m-surface); }
        html[data-theme-family="modern"] .t63-gauge, html[data-theme-family="modern"] .t63-result { border-radius: 12px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t63-result { border-left-width: 4px; }
        html[data-theme-family="modern"] .t63-meter, html[data-theme-family="modern"] .t63-vs-bar, html[data-theme-family="modern"] .t63-bar { border-radius: 6px; overflow: hidden; }
        html[data-theme-family="modern"] .t63-meter { overflow: visible; }
        html[data-theme-family="modern"] .t63-meter span:first-child { border-radius: 6px 0 0 6px; }
        html[data-theme-family="modern"] .t63-chip, html[data-theme-family="modern"] .t63-tag, html[data-theme-family="modern"] .t63-badge { border-radius: 999px; }
        html[data-theme-family="modern"] .t63-go { border-radius: 12px; font-weight: 600; letter-spacing: 0; border: none; background: var(--t63-acc); color: #fff; }
        html[data-theme-family="modern"] .t63-go:hover { filter: brightness(1.08); }
        html[data-theme-family="modern"] .t63-btn { border-radius: 8px; border-color: var(--m-border-strong); }
        html[data-theme-family="modern"] .t63-group-title { text-transform: none; letter-spacing: 0; font-weight: 600; }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
