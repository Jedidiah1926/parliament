// ===== Hemicycle 티저 1.6.4 (teaser64 ~ 67) — "De l'audace!" 국회공성전 미리보기 =====
// teaser64.html = main.html + js/teaserpodium.js + js/teaser61.js ~ js/teaser63.js(1.6.1 ~ 1.6.3) + 이 파일. 저장 공간은 따로 ('hemicycleTeaserV2-64:')
//
//   입법 › 공성전
//   - 계엄 중 봉쇄 돌파: 계엄군 · 경찰이 국회를 막은 상태에서 의원들이 본회의장에 들어가야 계엄 해제 결의안을 표결할 수 있다.
//     정당마다 참여율을 정하면 의원 한 명 한 명이 봉쇄를 뚫는지 굴려 보고, 들어간 의원만 표결한다 (가결 기준은 재적 과반 — 못 들어온 의원은 표결 제외).
//     봉쇄 강도(군 지휘부 충성도가 기본값) · 시민 지원 · 정당 결속도가 입장 확률에 들어간다. 가결되면 계엄 해제.
//     입구 저지: 표결을 막으려는 정당이 본회의장 입구를 몸으로 막을 수 있다 (봉쇄선을 뚫은 의원도 막힘, 막은 정당 지지율 하락).
//     과반에 못 미치면 들어간 의원들도 계엄군에게 봉쇄선 밖으로 끌려 나간다.
//     옆 시각 화면(하원 반원) 위에서 의원들이 봉쇄선 → 입구 → 통로 → 자기 줄을 따라 자리로 걸어가는 애니메이션 (누르면 건너뜀).
//   - 물리적 의사 방해: 계엄과 무관하게, 반대하는 법안의 표결을 막으려 의장석을 점거하고 몸싸움을 벌인다.
//     성공 확률 = 참여 의원 수 · 상대 진영 크기 · 정당 결속도 · 의장 경호권 발동 · 직권상정 · 국회선진화법. 성공하면 표결 무산.
//     옆 반원 화면에서 점거 의원들이 자리 → 통로 → 의장석으로 몰려가 둘러싸고, 경호권이면 경위가 입구로 들어와 맞붙는 애니메이션.
//     (애니메이션은 켜고 끌 수 있고 0.5× · 1× · 2× · 4× 속도로 볼 수 있다)
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
    if (root.getAttribute('data-app-mode') !== 'teaser' || !['64', '65', '66', '67', '68'].includes(root.getAttribute('data-teaser'))) return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const partyByName = n => parties.find(p => p.name === n) || null;
    const T62 = () => window.T62 || null;
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    const nowDate = () => { try { return formatNationDate(); } catch (e) { return ''; } };
    const houseName = () => { try { return chamberDisplayName('house'); } catch (e) { return '하원'; } };
    const speakerName = () => (typeof chamberLeaders !== 'undefined' && chamberLeaders?.house?.speaker?.name) || '';

    // ---- 상태 (세이브의 teaser64 칸) ----
    //   advancedAct: 국회선진화법 · cohesion: { pid: 0~100 } 정당 결속도 (기본 70)
    //   injured: [{ id, ch, key, name, party, left }] — 다음 표결 left번 결석 (key = 좌석 배정 키라 의석 순서가 바뀌어도 같은 의원)
    //   log: [{ id, date, kind, title, chance, success, effects }]
    let S = fresh();
    function fresh() { return { advancedAct: false, cohesion: {}, injured: [], log: [] }; }
    let ui = { anim: true, animSpeed: 1, blockade: null, citizens: true, rate: {}, blockers: {}, blockShare: 60, billId: '', obstructors: {}, share: 60, guard: false, direct: false, last: null };

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
        const mil = T62() && T62().military;
        if (mil && mil.length) return Math.round(mil.reduce((a, o) => a + (Number(o.loyalty) || 0), 0) / mil.length);
        return 60;
    }
    const blockade = () => ui.blockade ?? defaultBlockade();
    // 저지: 다른 정당(대개 여당)이 본회의장 입구를 몸으로 막아 해제 결의안 표결을 막으려 한다
    const blockerParties = () => Object.keys(ui.blockers).filter(k => ui.blockers[k]).map(partyById).filter(Boolean);
    const isBlocker = p => blockerParties().includes(p);
    // 정당 참여율 기본값: 정부 · 여당 10%, 나머지 100% (저지하는 정당은 들어가지 않음)
    const rateOf = p => (isBlocker(p) ? 0 : clamp(Number(ui.rate[p.id] ?? (isGovParty(p) ? 10 : 100)), 0, 100));
    // 계엄군 봉쇄선을 뚫을 확률 (의원 한 명)
    const entryProb = p => clamp(0.95 - blockade() * 0.005 + (cohesionOf(p) - 50) * 0.004 + (ui.citizens ? 0.1 : 0), 0.05, 0.97);
    // 입구를 막는 인원과 그 벽에 막힐 확률
    function wallInfo(seats) {
        const hurt = injuredKeys('house');
        const bl = blockerParties();
        const pool = seats.filter(s => bl.includes(s.party) && !hurt.has(s.key));
        const n = Math.round(pool.length * ui.blockShare / 100);
        const coh = pool.length ? pool.reduce((a, s) => a + cohesionOf(s.party), 0) / pool.length : 50;
        const stop = n ? clamp(n / Math.max(1, seats.length) * 1.4 * (0.7 + coh / 166), 0.03, 0.6) : 0;
        return { pool, n, stop };
    }
    const passProb = (p, wall) => entryProb(p) * (1 - wall.stop);

    function breakthroughOdds() {
        const seats = houseSeats();
        const need = requiredSeatsFor(seats.length, 0.5);
        const hurt = injuredKeys('house');
        const wall = wallInfo(seats);
        const groups = seatParties(seats).map(p => {
            const n = seats.filter(s => s.party === p && !hurt.has(s.key)).length;
            return { p, n, try: Math.round(n * rateOf(p) / 100), prob: passProb(p, wall), blocker: isBlocker(p) };
        });
        const expected = groups.reduce((a, g) => a + g.try * g.prob, 0);
        // 성공 확률은 몬테카를로로 어림 (400번)
        let ok = 0;
        for (let k = 0; k < 400; k++) {
            let inn = 0;
            groups.forEach(g => { for (let j = 0; j < g.try; j++) if (Math.random() < g.prob) inn++; });
            if (inn >= need) ok++;
        }
        return { seats, need, groups, expected, wall, chance: Math.round(ok / 4) };
    }

    function breakthrough() {
        if (!emergencyPowers.martialLaw.active) { showCustomAlert('계엄령이 선포된 상태에서만 할 수 있습니다.'); return; }
        if (T62() && T62().junta) { showCustomAlert('군정에서는 의회가 해산돼 있습니다 — 내각 › 쿠데타 · 혁명으로 군정을 끝내세요.'); return; }
        const odds = breakthroughOdds();
        showCustomConfirm(`계엄군 봉쇄를 뚫고 ${houseName()} 본회의장에 들어가 계엄 해제 결의안을 표결합니다.${odds.wall.n ? `\n${blockerParties().map(p => p.name).join(' · ')} 의원 ${odds.wall.n}명이 입구를 막고 있습니다.` : ''}\n가결 기준: 재적 ${odds.seats.length}명의 과반 ${odds.need}명 · 예상 성공 확률 ${odds.chance}%\n계속하시겠습니까?`, () => {
            const hurt = injuredKeys('house');
            const entered = [], blocked = [], walled = [];
            seatParties(odds.seats).forEach(p => {
                const mine = odds.seats.filter(s => s.party === p && !hurt.has(s.key));
                const tryN = Math.round(mine.length * rateOf(p) / 100);
                mine.slice().sort(() => Math.random() - 0.5).slice(0, tryN).forEach(s => {
                    if (Math.random() >= entryProb(p)) blocked.push(s);           // 계엄군 봉쇄선에서 막힘
                    else if (Math.random() < odds.wall.stop) walled.push(s);      // 입구의 저지 인원에게 막힘
                    else entered.push(s);
                });
            });
            const wallSeats = odds.wall.pool.slice().sort(() => Math.random() - 0.5).slice(0, odds.wall.n);
            const success = entered.length >= odds.need;
            // 몸싸움 부상 — 막힌 의원 일부, 실패하면 끌려 나간 의원 일부, 저지와 부딪혔으면 저지 인원 일부 (애니메이션에 표시하려고 미리 고름)
            const pick = (arr, rate) => arr.slice().sort(() => Math.random() - 0.5).slice(0, Math.round(arr.length * rate));
            const hurtSeats = pick(blocked.concat(walled), 0.02 + Math.random() * 0.04)
                .concat(success ? [] : pick(entered, 0.01 + Math.random() * 0.02))
                .concat(walled.length ? pick(wallSeats, 0.02 + Math.random() * 0.03) : []);
            playBreakthrough({ entered, blocked, walled, wallSeats, hurtSeats, need: odds.need, success },
                () => applyBreakthrough(odds, entered, blocked, walled, wallSeats, hurtSeats, success));
        });
    }
    function applyBreakthrough(odds, entered, blocked, walled, wallSeats, hurtSeats, success) {
        const yea = entered.length;
        const byParty = seatParties(entered).map(p => `${p.name} ${entered.filter(s => s.party === p).length}`).join(' · ') || '없음';
        const effects = [`본회의장 입장 ${yea}명 (${byParty}) · 봉쇄선에 막힘 ${blocked.length}명${walled.length ? ` · 입구 저지에 막힘 ${walled.length}명` : ''}`,
            `계엄 해제 결의안 — 찬성 ${yea} / 필요 ${odds.need} (재적 ${odds.seats.length})`];
        if (wallSeats.length) {
            const bl = blockerParties();
            const mult = S.advancedAct ? 2 : 1;
            bl.forEach(p => cutSupport(p, 1 - 0.05 * mult));
            effects.push(`${bl.map(p => p.name).join(' · ')} 의원 ${wallSeats.length}명이 입구를 막음 — 지지율 ${5 * mult}% 하락${S.advancedAct ? ' (국회선진화법)' : ''}`);
        }
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
        bill.t64Breakthrough = { entered: yea, blocked: blocked.length, walled: walled.length };
        if (success) {
            bill.martialLawLiftApplied = true;
            bill.vetoStatus = 'signed'; // 계엄 해제 결의안은 거부권 대상이 아님
            emergencyPowers.martialLaw.active = false;
            emergencyPowers.martialLaw.suspendParliament = false;
            try { renderEmergencyPowers(); applyMartialLawEffects(); } catch (e) { /* 화면 준비 전 */ }
            effects.push('가결 — 계엄령 해제');
        } else {
            effects.push('부결 — 과반에 못 미쳐 계엄군이 들어간 의원들을 봉쇄선 밖으로 끌어냄, 계엄 유지');
        }
        addLog('breakthrough', '계엄 중 봉쇄 돌파', odds.chance, success, effects);
        rerender();
    }

    // ---- 봉쇄 돌파 애니메이션 — 옆 시각 화면(하원 반원) 위에 겹쳐 그린다 ----
    // 의원들이 아래에서 올라와 계엄군 봉쇄선을 지나, 본회의장 입구 → 통로 → 자기 줄을 따라 걸어 자리에 앉는다.
    // 봉쇄선이나 입구 저지 인원에게 막히면 물러나고, 과반에 못 미치면 들어간 의원들도 봉쇄선 밖으로 끌려 나간다.
    // 하원 반원이 보이지 않거나(모바일 · 다른 탭) 움직임 줄이기 설정이면 건너뛰고 바로 결과. 화면을 누르면 끝으로 건너뜀.
    function houseCanvasReady() {
        const cvs = document.getElementById('houseCanvas');
        return cvs && cvs.offsetParent !== null && cvs.clientWidth > 50 && (dotCache.house || []).length ? cvs : null;
    }
    // 애니메이션을 틀 수 있으면 하원 반원을 앞으로 띄우고 run(cvs), 아니면 바로 finish()
    function playAnim(run, done) {
        let finished = false;
        const finish = () => { if (finished) return; finished = true; done(); };
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!ui.anim || reduce) { finish(); return; }
        try {
            if (document.getElementById('dispTabHouse')?.style.display !== 'none' && !document.getElementById('dispPanelHouse')?.classList.contains('active')) switchDispTab('house');
            if (document.getElementById('houseViewArcWrap')?.style.display === 'none') chamberSetView('house', 'arc');
        } catch (e) { /* 시각 화면 없음 */ }
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const cvs = houseCanvasReady();
            if (!cvs) { finish(); return; }
            run(cvs, finish);
        }));
    }
    const playBreakthrough = (r, done) => playAnim((cvs, finish) => runBreakthroughAnim(cvs, r, finish), done);
    const playObstruct = (r, done) => playAnim((cvs, finish) => runObstructAnim(cvs, r, finish), done);

    // 점 목록(꺾은선)을 따라 거리 d만큼 간 위치
    function polyAt(pts, d) {
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
            const seg = Math.hypot(x1 - x0, y1 - y0);
            if (d <= seg) { const k = seg ? d / seg : 1; return [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]; }
            d -= seg;
        }
        return pts[pts.length - 1];
    }
    const polyLen = pts => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);
    const ANIM_SPEEDS = [0.5, 1, 2, 4];

    // ---- 애니메이션 공통 무대: 하원 반원 위에 겹친 캔버스 + 본회의장 구조 ----
    // 아래쪽 계엄군 봉쇄선 → 본회의장 입구(가운데 아래) → 안쪽 둘레(가운데 빈 곳에 의장석) → 방사형 통로 → 자기 줄(호)
    function animScene(cvs) {
        const wrap = cvs.parentElement;
        wrap.style.position = 'relative';
        document.getElementById('t64Anim')?.remove();
        const W = cvs.clientWidth, H = cvs.clientHeight;
        const dpr = window.devicePixelRatio || 1;
        const ov = document.createElement('canvas');
        ov.id = 't64Anim';
        ov.className = 't64-anim';
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
        const C = modern ? { bg: dark ? 'rgba(10,10,12,.88)' : 'rgba(255,255,255,.9)', seat: dark ? '#3f3f46' : '#d4d4d8', text: dark ? '#fafafa' : '#18181b', dim: dark ? '#a1a1aa' : '#71717a', wood: dark ? '#5b4636' : '#c8a27a', font: 'Pretendard, system-ui, sans-serif' }
            : { bg: 'rgba(5,7,10,.9)', seat: '#333', text: '#e6e6e6', dim: '#888', wood: '#6b5233', font: "'NeoDunggeunmo', monospace" };
        const dots = dotCache.house;
        const d0 = dots[0] || { cx: W / 2, cy: H - 60, r: 4 };
        const CX = d0.cx, CY = d0.cy, dotR = d0.r;
        const seatR = d => Math.hypot(d.x - CX, CY - d.y);
        const rIn = Math.max(12, Math.min(...dots.filter(d => d.partyName !== 'Vacant').map(seatR)) - dotR * 1.6);
        const g = {
            ov, ctx, C, W, H, CX, CY, dotR, dots, rIn, modern,
            ALERT: '#e05555', OK: '#3fbf7f', GOLD: '#e0b030',
            barrierY: Math.min(H - 14, CY + 42), gateY: CY + 14, gateHalf: Math.max(14, rIn * 0.75),
            AISLES: [0.08, 0.3, 0.5, 0.7, 0.92].map(k => k * Math.PI),
            V: Math.max(0.25, W / 1700),
        };
        g.pol = (rad, a) => [CX + rad * Math.cos(a), CY - rad * Math.sin(a)];
        // 의장석: 가운데 빈 곳, 의석을 바라보는 단상 — 반원 화면과 같은 자리 (js/teaserpodium.js)
        const TP = window.TeaserPodium;
        g.podium = TP ? TP.geom(CX, CY, W, 'house') : { x: CX, y: CY - rIn * 0.42, w: Math.max(26, rIn * 0.62), h: Math.max(9, dotR * 1.8) };
        if (g.podium.speakerY == null) g.podium.speakerY = g.podium.y - g.podium.h;
        g.showPodium = kind => (TP ? TP.showIn(kind) : true);
        // 자리 → 자기 줄을 따라 가까운 통로 → 통로를 따라 안쪽 둘레까지
        g.seatToFoot = d => {
            const rad = seatR(d), th = Math.atan2(CY - d.y, d.x - CX);
            const al = g.AISLES.reduce((b, a) => (Math.abs(a - th) < Math.abs(b - th) ? a : b), g.AISLES[0]);
            const pts = [[d.x, d.y]];
            const steps = Math.max(1, Math.ceil(Math.abs(th - al) / 0.05));
            for (let i = 1; i <= steps; i++) pts.push(g.pol(rad, th + (al - th) * i / steps));
            pts.push(g.pol(rIn, al));
            return pts;
        };
        // 입구 → 통로 → 자기 자리
        g.seatPath = (d, gx) => [[gx, g.gateY]].concat(g.seatToFoot(d).reverse());
        g.dot = (x, y, color, alpha = 1, ring = null, r = dotR) => {
            ctx.globalAlpha = alpha;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
            if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 2; ctx.stroke(); }
            ctx.globalAlpha = 1;
        };
        g.label = (text, x, y, color, align = 'left') => {
            ctx.font = `11px ${C.font}`; ctx.textAlign = align;
            const w = ctx.measureText(text).width;
            const lx = align === 'center' ? x - w / 2 : x;
            ctx.fillStyle = C.bg; ctx.fillRect(lx - 4, y - 11, w + 8, 15);
            ctx.fillStyle = color; ctx.fillText(text, x, y);
        };
        g.title = (text, sub, color) => {
            ctx.textAlign = 'center';
            ctx.font = `bold 15px ${C.font}`; ctx.fillStyle = color || C.text; ctx.fillText(text, W / 2, 20);
            if (sub) { ctx.font = `11px ${C.font}`; ctx.fillStyle = C.dim; ctx.fillText(sub, W / 2, 36); }
        };
        g.bannerY = CY - Math.max(30, Math.min(CY * 0.35, rIn * 0.4 + 30)) - rIn * 0.25;
        g.banner = (text, color, size = 18) => {
            ctx.textAlign = 'center'; ctx.font = `bold ${size}px ${C.font}`;
            const w = ctx.measureText(text).width;
            ctx.fillStyle = C.bg; ctx.fillRect(W / 2 - w / 2 - 10, g.bannerY - size - 4, w + 20, size + 12);
            ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(W / 2 - w / 2 - 10, g.bannerY - size - 4, w + 20, size + 12);
            ctx.fillStyle = color; ctx.fillText(text, W / 2, g.bannerY);
        };
        // 바탕: 좌석(filled면 의원이 앉아 있는 모습, 그 밖은 빈 좌석) · 통로 · 의장석(설정에 따라, speaker면 의장도)
        g.base = (filled, kind, speaker = true) => {
            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
            ctx.lineWidth = 1;
            dots.forEach((d, i) => {
                if (d.partyName === 'Vacant') return;
                if (filled && filled(i)) g.dot(d.x, d.y, d.color, 0.35);
                else { ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.strokeStyle = C.seat; ctx.stroke(); }
            });
            ctx.save();
            ctx.strokeStyle = C.seat; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
            g.AISLES.forEach(a => { const [x0, y0] = g.pol(rIn, a), [x1, y1] = g.pol(Math.hypot(W / 2, CY), a); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); });
            ctx.beginPath(); ctx.arc(CX, CY, rIn, Math.PI, 0); ctx.stroke();
            ctx.restore();
            if (!g.showPodium(kind)) return;
            const pd = g.podium;
            if (TP) TP.draw(ctx, pd, 'house', { wood: C.wood, speaker, label: '의장석', labelColor: C.dim });
            else {
                ctx.fillStyle = C.wood; ctx.fillRect(pd.x - pd.w / 2, pd.y - pd.h / 2, pd.w, pd.h);
                ctx.strokeStyle = g.GOLD; ctx.lineWidth = 1; ctx.strokeRect(pd.x - pd.w / 2, pd.y - pd.h / 2, pd.w, pd.h);
                ctx.font = `10px ${C.font}`; ctx.textAlign = 'center'; ctx.fillStyle = C.dim;
                ctx.fillText('의장석', pd.x, pd.y + pd.h / 2 + 11);
            }
        };
        // 재생: frame(t)가 true를 돌려주면 끝. 속도(ui.animSpeed)만큼 빨리, 누르면 끝으로, 끝나면 잠깐 두었다 사라짐
        g.run = (frame, total, finish) => {
            const speed = ui.animSpeed || 1;
            let t0 = null, raf = 0, holdTimer = 0, skipped = false;
            const close = () => {
                cancelAnimationFrame(raf); clearTimeout(holdTimer);
                ov.style.transition = 'opacity .5s'; ov.style.opacity = '0';
                setTimeout(() => ov.remove(), 520);
                if (shade) shade.style.opacity = '';
            };
            const step = now => {
                if (t0 == null) t0 = now;
                const t = skipped ? total + 1 : (now - t0) * speed;
                frame(Math.min(t, total + 1));
                if (t >= total) { if (!holdTimer) holdTimer = setTimeout(close, 2200); finish(); return; }
                raf = requestAnimationFrame(step);
            };
            ov.addEventListener('click', () => {
                if (!skipped && !holdTimer) { skipped = true; cancelAnimationFrame(raf); raf = requestAnimationFrame(step); }
                else close();
            });
            raf = requestAnimationFrame(step);
        };
        return g;
    }
    const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    // ---- 봉쇄 돌파 애니메이션 ----
    // 의원들이 아래에서 올라와 계엄군 봉쇄선을 지나, 입구 → 통로 → 자기 줄을 따라 걸어 자리에 앉는다.
    // 봉쇄선이나 입구 저지 인원에게 막히면 물러나고, 과반에 못 미치면 들어간 의원들도 봉쇄선 밖으로 끌려 나간다.
    function runBreakthroughAnim(cvs, r, finish) {
        const g = animScene(cvs);
        const { ctx, C, W, H, CX, dotR, dots, V, barrierY, gateY, gateHalf, ALERT, OK } = g;
        const hurtSet = new Set(r.hurtSeats.map(s => s.i));
        const SPREAD = 1800, WALK = 650, BOUNCE = 700, HOLD = 500;
        // 입구를 막는 저지 인원 — 입구 앞에 여러 줄로 미리 서 있다 (넘치는 인원은 숫자로만)
        const sp = dotR * 1.9;
        const cols = Math.max(1, Math.floor((2 * gateHalf) / sp));
        const rowOff = [0, -1, 1, -2].map(k => k * sp * 0.9);
        const wallers = r.wallSeats.slice(0, cols * rowOff.length).map((s, k) => {
            const d = dots[s.i];
            const row = Math.floor(k / cols), col = k % cols;
            return { color: (d && d.color) || s.party.color, x: CX - gateHalf + sp / 2 + col * sp + (row % 2 ? sp / 2 : 0), y: gateY + 4 + rowOff[row], hurt: hurtSet.has(s.i) };
        });
        const wallFront = wallers.length ? Math.max(...wallers.map(w => w.y)) + dotR * 1.6 : gateY;
        const movers = r.entered.map(s => ({ s, kind: 'in' })).concat(r.blocked.map(s => ({ s, kind: 'troops' })), r.walled.map(s => ({ s, kind: 'wall' }))).sort(() => Math.random() - 0.5);
        let lastArrive = 0;
        movers.forEach((m, k) => {
            const d = dots[m.s.i];
            m.color = (d && d.color) || m.s.party.color || '#888';
            m.sx = 12 + Math.random() * (W - 24);
            m.bx = CX + (m.sx - CX) * 0.6 + (Math.random() - 0.5) * 20;
            m.start = (k / Math.max(1, movers.length)) * SPREAD + Math.random() * 120;
            m.hurt = hurtSet.has(m.s.i);
            m.gx = CX + (Math.random() * 2 - 1) * gateHalf;
            if (m.kind === 'in') {
                m.path = [[m.bx, barrierY]].concat(d ? g.seatPath(d, m.gx) : [[m.gx, gateY]]);
                m.len = polyLen(m.path);
                lastArrive = Math.max(lastArrive, m.start + WALK + m.len / V);
            } else if (m.kind === 'wall') {
                m.path = [[m.bx, barrierY], [m.gx, Math.min(barrierY - 4, wallFront)]];
                m.len = polyLen(m.path);
                m.end = m.start + WALK + m.len / V + HOLD + BOUNCE;
            } else m.end = m.start + WALK + BOUNCE;
        });
        // 과반 미달이면 다 들어간 뒤 계엄군이 의원들을 봉쇄선 밖으로 끌어낸다 (자리 → 통로 → 입구 → 봉쇄선 밖)
        const expelAt = lastArrive + 700;
        let expelEnd = expelAt;
        if (!r.success) movers.filter(m => m.kind === 'in').forEach(m => {
            m.back = m.path.slice().reverse().concat([[m.bx, H + 24]]);
            m.backLen = polyLen(m.back);
            m.expelStart = expelAt + Math.random() * 600;
            expelEnd = Math.max(expelEnd, m.expelStart + m.backLen / (V * 1.5));
        });
        const total = Math.max(SPREAD + 120 + WALK + BOUNCE + HOLD, r.success ? lastArrive : expelEnd, ...movers.map(m => m.end || 0)) + 250;

        g.run(t => {
            g.base(null, 'breakthrough');
            // 계엄군 봉쇄선
            ctx.save();
            ctx.strokeStyle = ALERT; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
            ctx.beginPath(); ctx.moveTo(6, barrierY); ctx.lineTo(W - 6, barrierY); ctx.stroke();
            ctx.restore();
            wallers.forEach(w => g.dot(w.x, w.y, w.color, 1, w.hurt && t > SPREAD ? ALERT : (g.modern ? '#00000055' : '#ffffff55')));
            let stopped = 0, walledNow = 0, inCount = 0;
            movers.forEach(m => {
                const lt = t - m.start;
                if (lt < 0) return;
                let x, y, alpha = 1, ring = null;
                if (lt < WALK) { const k = ease(lt / WALK); x = m.sx + (m.bx - m.sx) * k; y = H + 8 + (barrierY - H - 8) * k; }
                else if (m.kind === 'troops') {
                    stopped++;
                    const k = Math.min(1, (lt - WALK) / BOUNCE);
                    x = m.bx + Math.sin(k * Math.PI * 6) * 3 * (1 - k); y = barrierY + 4 + k * 40; alpha = 1 - k;
                    if (m.hurt) ring = ALERT;
                } else if (m.kind === 'wall') {
                    const d = (lt - WALK) * V;
                    if (d < m.len) [x, y] = polyAt(m.path, d);
                    else {
                        walledNow++;
                        const k = Math.min(1, (lt - WALK - m.len / V - HOLD) / BOUNCE);
                        const [ex, ey] = m.path[m.path.length - 1];
                        if (k <= 0) { x = ex + Math.sin(lt / 30) * 2; y = ey; }
                        else { x = ex + (m.bx - ex) * k; y = ey + (barrierY + 40 - ey) * k; alpha = 1 - k; }
                        if (m.hurt) ring = ALERT;
                    }
                } else {
                    const d = (lt - WALK) * V;
                    if (d >= m.len) inCount++;
                    if (m.back && t >= m.expelStart) {
                        const bd = (t - m.expelStart) * V * 1.5;   // 끌려 나감
                        if (bd >= m.backLen) return;
                        [x, y] = polyAt(m.back, bd);
                        ring = ALERT;
                        if (y > barrierY) alpha = Math.max(0, 1 - (y - barrierY) / 24);
                    } else if (d < m.len) [x, y] = polyAt(m.path, d);
                    else [x, y] = m.path[m.path.length - 1];
                }
                if (alpha <= 0) return;
                g.dot(x, y, m.color, alpha, ring);
            });
            g.label('계엄군 봉쇄선', 8, barrierY + 15, ALERT);
            if (r.wallSeats.length) g.label(`입구 저지 ${r.wallSeats.length}명`, CX + gateHalf + 10, gateY + 4, C.dim);
            g.title(`입장 ${inCount} / 필요 ${r.need}`,
                `봉쇄선에 막힘 ${stopped}${r.walled.length ? ` · 입구 저지에 막힘 ${walledNow}` : ''}${r.hurtSeats.length ? ` · 부상 ${r.hurtSeats.length}` : ''}`,
                inCount >= r.need ? OK : (!r.success && t >= expelAt ? ALERT : null));
            if (t > total) g.banner(r.success ? '가결 — 계엄 해제' : '부결 — 계엄 유지', r.success ? OK : ALERT);
            else if (!r.success && t >= expelAt) g.banner('과반 미달 — 계엄군이 의원들을 끌어냅니다', ALERT, 14);
        }, total, finish);
    }

    // ---- 의장석 점거 애니메이션 ----
    // 점거하는 의원들이 자리에서 일어나 자기 줄 → 통로 → 의장석으로 몰려가 둘러싼다. 경호권을 발동하면 경위들이 입구로 들어와 맞붙는다.
    // 성공하면 의장이 의장석을 떠나고 점거가 이어지며, 실패하면 점거 의원들이 밀려나 자리로 돌아간다.
    function runObstructAnim(cvs, r, finish) {
        const g = animScene(cvs);
        const { ctx, C, CX, dotR, dots, V, gateY, ALERT, OK, GOLD, podium } = g;
        const hurtSet = new Set(r.hurtSeats.map(s => s.i));
        const partSet = new Set(r.part.map(s => s.i));
        // 의장석 둘레 자리 (안쪽부터 차례로 채움) — 원 모양으로 겹겹이
        const slots = [];
        for (let layer = 0; slots.length < r.part.length + 60; layer++) {
            const rad = podium.w * 0.55 + dotR * 1.3 + layer * dotR * 2.05;
            const cap = Math.max(6, Math.floor(2 * Math.PI * rad / (dotR * 2.1)));
            for (let k = 0; k < cap; k++) { const a = (k + (layer % 2) * 0.5) / cap * Math.PI * 2; slots.push([podium.x + rad * Math.cos(a), podium.y + rad * Math.sin(a) * 0.8]); }
        }
        const RUSH = 1300, CLASH = 1500;
        const movers = r.part.map((s, k) => {
            const d = dots[s.i];
            const path = d ? g.seatToFoot(d).concat([slots[k]]) : [slots[k], slots[k]];
            return { s, color: (d && d.color) || s.party.color, path, len: polyLen(path), start: Math.random() * RUSH, hurt: hurtSet.has(s.i) };
        });
        // 일찍 출발한 순서대로 안쪽 자리를 차지하도록 정렬해 다시 배정
        movers.sort((a, b) => a.start - b.start).forEach((m, k) => { const d = dots[m.s.i]; m.path = d ? g.seatToFoot(d).concat([slots[k]]) : [slots[k], slots[k]]; m.len = polyLen(m.path); });
        const guardN = r.guard ? Math.min(40, Math.max(6, Math.round(r.part.length * 0.35))) : 0;
        const guards = Array.from({ length: guardN }, (_, k) => {
            const target = slots[Math.min(slots.length - 1, r.part.length + k)];
            const gx = CX + (Math.random() * 2 - 1) * g.gateHalf;
            const path = [[gx, g.H + 10], [gx, gateY], target];
            return { path, len: polyLen(path), start: RUSH * 0.6 + Math.random() * 600 };
        });
        const arriveAll = Math.max(RUSH, ...movers.map(m => m.start + m.len / V), ...guards.map(m => m.start + m.len / V));
        const clashEnd = arriveAll + CLASH;
        // 결과: 실패하면 점거 의원들이 밀려나 자리로, 성공하면 의장이 의장석을 떠난다
        let total = clashEnd + 900;
        if (!r.success) movers.forEach(m => { m.back = m.path.slice().reverse(); m.backLen = polyLen(m.back); m.backStart = clashEnd + Math.random() * 400; total = Math.max(total, m.backStart + m.backLen / V + 200); });
        const speakerPath = [[podium.x, podium.speakerY], [podium.x, podium.speakerY - 6], [CX + g.gateHalf * 0.4, gateY], [CX + g.gateHalf * 0.4, g.H + 12]];
        const speakerLen = polyLen(speakerPath);
        if (r.success) total = Math.max(total, clashEnd + speakerLen / V + 300);

        g.run(t => {
            g.base(i => !partSet.has(i) || !movers.some(m => m.s.i === i && t >= m.start), 'occupy', false);
            // 의장
            let sx = podium.x, sy = podium.speakerY, salpha = 1;
            if (r.success && t > clashEnd) { [sx, sy] = polyAt(speakerPath, (t - clashEnd) * V); if (sy > gateY) salpha = Math.max(0, 1 - (sy - gateY) / 30); }
            g.dot(sx, sy, GOLD, salpha, C.text, dotR * 1.1);
            const clashing = t >= arriveAll * 0.7 && t < clashEnd;
            const jit = () => (clashing ? (Math.random() - 0.5) * 3 : 0);
            guards.forEach(m => {
                const lt = t - m.start;
                if (lt < 0) return;
                const [x, y] = polyAt(m.path, lt * V);
                g.dot(x + jit(), y + jit(), g.modern ? '#52525b' : '#9aa0a6', 1, null, dotR * 0.95);
            });
            let atPodium = 0;
            movers.forEach(m => {
                const lt = t - m.start;
                if (lt < 0) return;
                let x, y;
                if (m.back && t >= m.backStart) {
                    const bd = (t - m.backStart) * V;
                    [x, y] = polyAt(m.back, bd);
                } else {
                    const d = lt * V;
                    [x, y] = polyAt(m.path, d);
                    if (d >= m.len) atPodium++;
                }
                g.dot(x + jit(), y + jit(), m.color, 1, m.hurt && t > arriveAll ? ALERT : null);
            });
            g.title(`의장석 점거 ${atPodium} / ${r.part.length}명${guardN ? ` · 경위 ${guardN}명` : ''}`, `『${r.billTitle}』${r.direct ? ' · 직권상정' : ''}${r.hurtSeats.length ? ` · 부상 ${r.hurtSeats.length}` : ''}`, null);
            if (t > total) g.banner(r.success ? '표결 무산 — 의장석 점거 성공' : '점거 해산 — 표결 진행', r.success ? OK : ALERT);
            else if (t >= clashEnd) g.banner(r.success ? '의장이 의장석을 떠납니다' : '점거 의원들이 밀려납니다', r.success ? OK : ALERT, 14);
            else if (clashing) g.banner('몸싸움', ALERT, 14);
        }, total, finish);
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
            // 점거 인원과 부상자는 미리 정해 애니메이션에 보여 준 뒤 그대로 반영
            const part = odds.obsSeats.slice().sort(() => Math.random() - 0.5).slice(0, odds.n);
            const hurtN = Math.max(ui.guard ? 1 : 0, Math.round(odds.n * (0.02 + Math.random() * 0.04) * (ui.guard ? 1.6 : 1)));
            const pool = part.slice().sort(() => Math.random() - 0.5).concat(odds.seats.filter(s => !obs.includes(s.party)).sort(() => Math.random() - 0.5).slice(0, Math.ceil(hurtN / 4)));
            const hurtSeats = pool.filter(s => !S.injured.some(x => x.ch === 'house' && x.key === s.key)).slice(0, hurtN);
            const direct = ui.direct && !S.advancedAct, guard = ui.guard;
            playObstruct({ part, hurtSeats, success, guard, direct, billTitle: bill.title },
                () => applyObstruct(bill, obs, odds, success, hurtSeats, guard, direct));
        });
    }
    function applyObstruct(bill, obs, odds, success, hurtSeats, guard, direct) {
        const mult = S.advancedAct ? 2 : 1;
        const effects = [];
        if (direct && bill.committeeStatus === 'pending') { bill.committeeStatus = 'pass'; bill.t64DirectTabled = true; effects.push('의장 직권상정 — 상임위원회 심사를 건너뜀'); }
        if (success) {
            bill.t64Obstructed = (bill.t64Obstructed || 0) + 1;
            effects.push(`표결 무산 — 『${bill.title}』은(는) 계속 계류 (지금까지 ${bill.t64Obstructed}번 무산)`);
        } else {
            effects.push('점거 해산 — 표결은 그대로 진행됩니다 (입법 › 표결)');
        }
        // 지지율 페널티
        const pen = (success ? 0.05 : 0.08) * mult;
        obs.forEach(p => cutSupport(p, 1 - pen));
        effects.push(`${obs.map(p => p.name).join(' · ')} 지지율 ${Math.round(pen * 100)}% 하락 (폭력 사용)${S.advancedAct ? ' — 국회선진화법: 국회회의방해죄 고발로 페널티 두 배' : ''}`);
        if (guard) {
            const gov = parties.filter(p => isGovParty(p) && !obs.includes(p));
            if (gov.length) { gov.forEach(p => cutSupport(p, 1 - 0.02 * mult)); effects.push(`경호권 몸싸움 — ${gov.map(p => p.name).join(' · ')} 지지율 ${2 * mult}% 하락`); }
        }
        // 부상 — 점거 의원 위주, 경호권이면 더 많이
        const hurtList = hurtSeats.length ? injure(hurtSeats, hurtSeats.length) : [];
        if (hurtList.length) effects.push(`부상 결석: ${hurtList.join(', ')}`);
        addLog('obstruct', `의장석 점거 — 『${bill.title}』`, odds.chance, success, effects);
        ui.lastBillId = bill.id;
        rerender();
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
        if (x && body) body.insertAdjacentHTML('beforeend', `<div class="t64-hurt-row">🩹 부상 결석 — 다음 표결 ${x.left}번 불참</div>`);
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

    const factorRow = x => `<div class="t64-factor"><span>${esc(x.label)}</span><span class="${x.v >= 0 ? 't64-plus' : 't64-minus'}">${x.v >= 0 ? '+' : ''}${x.v}%p</span></div>`;
    const resultCard = e => e ? `<div class="t64-result ${e.success ? 'ok' : 'fail'}">
            <div class="t64-result-head"><span class="t64-badge ${e.success ? 'ok' : 'fail'}">${e.success ? '✔ 성공' : '✘ 실패'}</span><span>${esc(e.title)}</span></div>
            <div class="t64-dim t64-small">${esc(e.date)} · 성공 확률 ${e.chance}%</div>
            <ul>${e.effects.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            ${e.kind === 'obstruct' && !e.success && ui.lastBillId ? '<button type="button" class="t64-btn" data-act="tovote">입법 › 표결로 가기 →</button>' : ''}
        </div>` : '';
    const chip = (text, cls) => `<span class="t64-stat ${cls || ''}">${text}</span>`;
    const dot = c => `<i class="t64-dot" style="background:${esc(c)}"></i>`;
    const animControls = () => `<div class="t64-animrow">
            <label class="t64-toggle"><input type="checkbox" data-in="anim" ${ui.anim ? 'checked' : ''}><span>옆 반원 화면에 애니메이션 보기</span></label>
            <div class="t64-speed ${ui.anim ? '' : 't64-off'}"><span class="t64-dim">속도</span>${ANIM_SPEEDS.map(v => `<button type="button" class="${(ui.animSpeed || 1) === v ? 'on' : ''}" data-speed="${v}">${v}×</button>`).join('')}</div>
        </div>`;
    const blockadeWord = v => (v >= 80 ? '철통' : v >= 60 ? '강함' : v >= 35 ? '보통' : '느슨함');
    const emptyState = (icon, text, extra) => `<div class="t64-empty"><div class="t64-empty-icon">${icon}</div><div>${text}</div>${extra || ''}</div>`;
    // 확률 게이지 — 큰 숫자 + 막대
    const gauge = (label, chance, sub) => `<div class="t64-gauge"><div class="t64-gauge-head"><span>${label}</span><b class="${chance >= 50 ? 'hi' : chance >= 25 ? 'mid' : 'lo'}">${chance}%</b></div>
        <div class="t64-bar"><span style="width:${chance}%"></span></div>${sub ? `<div class="t64-dim t64-small">${sub}</div>` : ''}</div>`;

    function renderBreakPanel(seats, last) {
        const res = last && last.kind === 'breakthrough' ? resultCard(last) : '';
        const ml = emergencyPowers.martialLaw;
        if (!ml.active) return res + emptyState('🚧', '계엄령이 선포돼 있지 않습니다.<br>대통령 · 총리 탭의 비상 권한으로 계엄령을 선포하면 열립니다.',
            '<button type="button" class="t64-btn" data-act="martial">계엄령 선포 (의회 정지, 시험용)</button>');
        if (T62() && T62().junta) return res + emptyState('🎖', '군정에서는 의회가 해산돼 있습니다.<br>내각 › 쿠데타 · 혁명으로 군정을 끝내세요.');
        const o = breakthroughOdds();
        const total = Math.max(1, o.seats.length);
        const needPct = o.need / total * 100;
        const segs = o.groups.map(g => ({ g, v: g.try * g.prob })).filter(x => x.v > 0.5);
        let html = `<div class="t64-meter-box">
                <div class="t64-meter-head"><span>예상 입장 <b>${Math.round(o.expected)}</b>명</span><span class="t64-dim">재적 ${o.seats.length} · 과반 ${o.need}</span></div>
                <div class="t64-meter">${segs.map(x => `<span style="width:${x.v / total * 100}%;background:${esc(x.g.p.color)}" title="${esc(x.g.p.name)} 약 ${Math.round(x.v)}명"></span>`).join('')}
                    <em style="left:${needPct}%"></em></div>
                <div class="t64-meter-legend">${segs.map(x => `<span>${dot(x.g.p.color)}${esc(x.g.p.name)} ${Math.round(x.v)}</span>`).join('')}<span class="t64-need">┃ 과반 ${o.need}</span></div>
            </div>
            ${gauge('계엄 해제 성공 확률', o.chance, '들어간 의원만 표결 — 가결 기준은 들어간 인원이 아니라 재적 과반')}
            <div class="t64-group"><div class="t64-group-title">봉쇄</div>
                <div class="t64-row"><span class="t64-lbl">봉쇄 강도</span><input type="range" min="0" max="100" value="${blockade()}" data-in="blockade" data-live="blockadeVal"><b id="blockadeVal">${blockade()} · ${blockadeWord(blockade())}</b></div>
                <div class="t64-dim t64-small">기본값은 군 지휘부의 평균 충성도 (내각 › 군부)</div>
                <label class="t64-toggle"><input type="checkbox" data-in="citizens" ${ui.citizens ? 'checked' : ''}><span>시민들이 국회 앞에 모여 길을 엶 <em>입장 확률 +10%p</em></span></label>
            </div>
            <div class="t64-group"><div class="t64-group-title">입구 저지</div>
                <div class="t64-dim t64-small" style="margin-bottom:6px">표결을 막으려는 정당이 본회의장 입구를 몸으로 막습니다 — 봉쇄선을 뚫은 의원도 여기서 막힐 수 있어요. 막은 정당은 지지율이 떨어지고, 그 의원들은 들어가지 않습니다.</div>
                <div class="t64-chips">${seatParties(o.seats).map(p => `<label class="t64-chip ${ui.blockers[p.id] ? 'on' : ''}"><input type="checkbox" data-blk="${esc(p.id)}" ${ui.blockers[p.id] ? 'checked' : ''}>${dot(p.color)}${esc(p.name)}</label>`).join('')}</div>
                ${o.wall.pool.length ? `<div class="t64-row"><span class="t64-lbl">저지 인원</span><input type="range" min="5" max="100" step="5" value="${ui.blockShare}" data-in="blockShare" data-live="blockShareVal"><b id="blockShareVal">${ui.blockShare}%</b></div>
                <div class="t64-dim t64-small">입구에 ${o.wall.n}명 — 봉쇄선을 뚫은 의원이 입구에서 막힐 확률 ${Math.round(o.wall.stop * 100)}%</div>` : ''}
            </div>
            <div class="t64-group"><div class="t64-group-title">정당별 참여</div>
                ${o.groups.map(g => `<div class="t64-prow${g.blocker ? ' t64-off' : ''}">
                    <div class="t64-prow-head">${dot(g.p.color)}<b>${esc(g.p.name)}</b>${isGovParty(g.p) ? '<span class="t64-tag">여당</span>' : ''}<span class="t64-dim">${g.n}석</span>
                        <span class="t64-prow-exp">${g.blocker ? '입구 저지 중' : `입장 ${Math.round(g.prob * 100)}% · 예상 <b>${Math.round(g.try * g.prob)}</b>`}</span></div>
                    ${g.blocker ? '' : `<div class="t64-row"><span class="t64-lbl">참여율</span><input type="range" min="0" max="100" step="5" value="${rateOf(g.p)}" data-rate="${esc(g.p.id)}" data-live="rate_${esc(g.p.id)}"><b id="rate_${esc(g.p.id)}">${rateOf(g.p)}%</b></div>`}
                </div>`).join('')}
            </div>
            ${animControls()}
            <button type="button" class="t64-go" data-act="break">🚪 봉쇄 돌파 · 계엄 해제 표결</button>`;
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
        let html = `<div class="t64-group"><div class="t64-group-title">막을 법안</div>
                <select data-in="bill">${pb.map(b => `<option value="${esc(b.id)}" ${b.id === ui.billId ? 'selected' : ''}>${esc(b.title)}${b.committeeStatus === 'pending' ? ' (상임위 심사 중)' : ''}${b.t64Obstructed ? ` · 무산 ${b.t64Obstructed}번` : ''}</option>`).join('')}</select>
            </div>
            <div class="t64-group"><div class="t64-group-title">점거하는 정당</div>
                <div class="t64-chips">${ps.map(p => `<label class="t64-chip ${ui.obstructors[p.id] ? 'on' : ''}"><input type="checkbox" data-obs="${esc(p.id)}" ${ui.obstructors[p.id] ? 'checked' : ''}>${dot(p.color)}${esc(p.name)}</label>`).join('')}</div>
                <div class="t64-row"><span class="t64-lbl">참여 의원</span><input type="range" min="5" max="100" step="5" value="${ui.share}" data-in="share" data-live="shareVal"><b id="shareVal">${ui.share}%</b></div>
            </div>
            <div class="t64-vs">
                <div class="t64-vs-head"><span>점거 <b>${o.n}</b>명</span><span>상대 진영 <b>${others.length}</b>명</span></div>
                <div class="t64-vs-bar">${obs.map(p => { const n = Math.round(o.obsSeats.filter(s => s.party === p).length * ui.share / 100); return n ? `<span style="width:${n / total * 100}%;background:${esc(p.color)}"></span>` : ''; }).join('')}
                    <span class="t64-vs-gap" style="flex:1"></span>
                    ${otherParties.map(p => `<span class="t64-vs-opp" style="width:${others.filter(s => s.party === p).length / total * 100}%;background:${esc(p.color)}"></span>`).join('')}</div>
            </div>
            <div class="t64-group"><div class="t64-group-title">의장 쪽 대응</div>
                <label class="t64-toggle"><input type="checkbox" data-in="guard" ${ui.guard ? 'checked' : ''}><span>의장${speakerName() ? ' ' + esc(speakerName()) : ''} 경호권 발동 <em>경위 · 경찰 투입, 몸싸움 · 부상 늘어남</em></span></label>
                <label class="t64-toggle ${S.advancedAct ? 't64-off' : ''}"><input type="checkbox" data-in="direct" ${ui.direct && !S.advancedAct ? 'checked' : ''} ${S.advancedAct ? 'disabled' : ''}><span>직권상정 <em>${S.advancedAct ? '국회선진화법으로 막힘' : '의장이 바로 본회의에 올림'}</em></span></label>
            </div>
            ${gauge('점거 성공 확률', o.chance, '')}
            <details class="t64-factors"><summary class="t64-dim">확률 계산 보기</summary>${o.f.map(factorRow).join('')}<div class="t64-dim t64-small">합계는 5~90% 사이로 맞춥니다.</div></details>
            ${animControls()}
            <button type="button" class="t64-go" data-act="obstruct">✊ 의장석 점거</button>`;
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
        let html = `<div class="t64-head">
                <div class="t64-intro">계엄군의 봉쇄를 뚫고 본회의장에 들어가 계엄을 해제하거나, 의장석을 점거해 반대 법안의 표결을 막습니다. 폭력에는 지지율 페널티와 부상이 따릅니다.</div>
                <div class="t64-stats">
                    ${ml.active ? chip(`⚠ 계엄 선포 중${ml.suspendParliament ? ' · 의회 정지' : ''}`, 'alert') : chip('계엄 없음')}
                    ${chip(`국회선진화법 ${S.advancedAct ? '켜짐' : '꺼짐'}`, S.advancedAct ? 'on' : '')}
                    ${chip(`🩹 부상 결석 ${S.injured.length}`, S.injured.length ? 'warn' : '')}
                    ${chip(`📜 계류 법안 ${pbN}`)}
                </div>
            </div>`;
        if (!seats.length) html += emptyState('🏛', '의석이 없습니다 — 먼저 의회를 구성하세요.');
        html += `<div class="t64-modes">
                <button type="button" class="t64-mode ${ui.mode === 'break' ? 'active' : ''}" data-mode="break"><b>🚧 봉쇄 돌파</b><span>계엄 해제 표결</span>${ml.active ? '<i class="t64-live"></i>' : ''}</button>
                <button type="button" class="t64-mode ${ui.mode === 'obstruct' ? 'active' : ''}" data-mode="obstruct"><b>🪑 의장석 점거</b><span>표결 막기</span></button>
            </div>
            <div class="t64-panel">${ui.mode === 'break' ? renderBreakPanel(seats, last) : renderObstructPanel(seats, ps, last)}</div>`;

        // --- 설정 · 부상 · 기록 (접어 둠) ---
        html += `<details class="t64-fold" ${ui.openSet ? 'open' : ''} data-fold="openSet"><summary>⚖ 설정 · 정당 결속도</summary>
                <label class="t64-toggle"><input type="checkbox" data-in="act" ${S.advancedAct ? 'checked' : ''}><span>국회선진화법 <em>직권상정 제한, 폭력 페널티 두 배 (국회회의방해죄)</em></span></label>
                <div class="t64-dim t64-small" style="margin:8px 0 2px">정당 결속도 — 봉쇄 돌파 입장 확률 · 점거 성공 확률에 반영</div>
                ${ps.map(p => `<div class="t64-row"><span class="t64-lbl">${dot(p.color)}${esc(p.name)}</span><input type="range" min="0" max="100" step="5" value="${cohesionOf(p)}" data-coh="${esc(p.id)}" data-live="coh_${esc(p.id)}"><b id="coh_${esc(p.id)}">${cohesionOf(p)}</b></div>`).join('') || '<div class="t64-dim">정당 없음</div>'}
            </details>
            <details class="t64-fold" ${ui.openHurt ? 'open' : ''} data-fold="openHurt"><summary>🩹 부상 결석 (${S.injured.length})</summary>
                ${S.injured.length ? S.injured.map(x => `<div class="t64-hurt"><span>${esc(x.name)} <span class="t64-dim">${esc(x.party)}</span></span><span class="t64-dim">다음 표결 ${x.left}번 불참</span><button type="button" class="t64-btn t64-mini" data-heal="${esc(x.id)}">회복</button></div>`).join('')
                    : '<div class="t64-dim">다친 의원이 없습니다. 다친 의원은 표결에서 빠지고, 표결을 확정할 때마다 하나씩 회복합니다.</div>'}
            </details>
            <details class="t64-fold" ${ui.openLog ? 'open' : ''} data-fold="openLog"><summary>📋 공성전 기록 (${S.log.length})</summary>
                ${S.log.length ? S.log.map(e => `<div class="t64-log-row"><span class="${e.success ? 't64-plus' : 't64-minus'}">${e.success ? '✔' : '✘'}</span><span class="t64-dim">${esc(e.date)}</span><span>${esc(e.title)}</span><span class="t64-dim">${e.chance}%</span></div>`).join('') : '<div class="t64-dim">아직 기록이 없습니다.</div>'}
            </details>`;
        box.innerHTML = html;

        const on = (sel, ev, fn) => box.querySelectorAll(sel).forEach(n => n.addEventListener(ev, () => fn(n)));
        // 슬라이더는 끌 때 숫자만 바꾸고, 놓으면 다시 계산
        on('[data-live]', 'input', n => {
            const out = document.getElementById(n.dataset.live);
            if (!out) return;
            const v = Number(n.value);
            out.textContent = n.dataset.in === 'blockade' ? `${v} · ${blockadeWord(v)}` : n.dataset.rate || n.dataset.in === 'share' || n.dataset.in === 'blockShare' ? `${v}%` : String(v);
        });
        on('[data-mode]', 'click', n => { ui.mode = n.dataset.mode; renderSiege(); });
        on('[data-fold]', 'toggle', n => { ui[n.dataset.fold] = n.open; });
        on('[data-in="blockade"]', 'change', n => { ui.blockade = Number(n.value); renderSiege(); });
        on('[data-in="anim"]', 'change', n => { ui.anim = n.checked; renderSiege(); });
        on('[data-speed]', 'click', n => { ui.animSpeed = Number(n.dataset.speed) || 1; renderSiege(); });
        on('[data-blk]', 'change', n => { ui.blockers[n.dataset.blk] = n.checked; renderSiege(); });
        on('[data-in="blockShare"]', 'change', n => { ui.blockShare = Number(n.value); renderSiege(); });
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
        #contentSiege { --t64-acc: #f0a030; --t64-alert: #e05555; --t64-ok: #3fbf7f; --t64-line: #333; --t64-soft: rgba(255,255,255,.03); --t64-dim: #888; --t64-text: #ddd; }
        html[data-theme-family="modern"] #contentSiege { --t64-acc: #d97706; --t64-alert: var(--m-danger, #dc2626); --t64-ok: var(--m-success, #16a34a); --t64-line: var(--m-border); --t64-soft: var(--m-surface-2); --t64-dim: var(--m-text-3); --t64-text: var(--m-text); }
        .t64-head { margin: 6px 0 10px; }
        .t64-intro { color: var(--t64-dim); font-size: .78rem; line-height: 1.6; margin-bottom: 8px; }
        .t64-stats { display: flex; flex-wrap: wrap; gap: 6px; }
        .t64-stat { font-size: .74rem; padding: 3px 8px; border: 1px solid var(--t64-line); color: var(--t64-dim); white-space: nowrap; }
        .t64-stat.alert { color: var(--t64-alert); border-color: var(--t64-alert); }
        .t64-stat.warn { color: var(--t64-acc); border-color: var(--t64-acc); }
        .t64-stat.on { color: var(--t64-text); border-color: var(--t64-text); }
        .t64-modes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
        .t64-mode { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 12px; cursor: pointer; font-family: inherit; text-align: left; background: transparent; border: 1px solid var(--t64-line); color: var(--t64-dim); }
        .t64-mode b { font-size: .95rem; font-weight: normal; color: var(--t64-text); }
        .t64-mode span { font-size: .72rem; }
        .t64-mode.active { border-color: var(--t64-acc); box-shadow: inset 0 -3px 0 var(--t64-acc); }
        .t64-mode.active b { color: var(--t64-acc); }
        .t64-live { position: absolute; top: 9px; right: 10px; width: 8px; height: 8px; border-radius: 50%; background: var(--t64-alert); animation: t64pulse 1.2s infinite; }
        @keyframes t64pulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
        .t64-panel { border: 1px solid var(--t64-line); padding: 12px; margin-bottom: 10px; background: var(--t64-soft); }
        .t64-group { margin: 0 0 12px; }
        .t64-group-title { font-size: .72rem; color: var(--t64-dim); letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
        .t64-panel select { width: 100%; box-sizing: border-box; }
        .t64-row { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: .85rem; }
        .t64-row input[type=range] { flex: 1; min-width: 0; accent-color: var(--t64-acc); }
        .t64-row b { min-width: 3.2em; text-align: right; font-weight: normal; color: var(--t64-text); white-space: nowrap; }
        .t64-lbl { min-width: 5.5em; color: var(--t64-dim); font-size: .78rem; display: flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .t64-dim { color: var(--t64-dim); font-size: .8rem; } .t64-small { font-size: .72rem; }
        .t64-off { opacity: .5; }
        .t64-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-right: 4px; vertical-align: middle; }
        .t64-toggle { display: flex; align-items: flex-start; gap: 8px; padding: 7px 0; font-size: .85rem; color: var(--t64-text); cursor: pointer; }
        .t64-toggle input { margin-top: 3px; accent-color: var(--t64-acc); }
        .t64-toggle em { display: block; font-style: normal; font-size: .72rem; color: var(--t64-dim); }
        .t64-meter-box { margin-bottom: 10px; }
        .t64-meter-head { display: flex; justify-content: space-between; align-items: baseline; font-size: .85rem; color: var(--t64-text); margin-bottom: 6px; }
        .t64-meter-head b { font-size: 1.3rem; font-weight: normal; color: var(--t64-acc); }
        .t64-meter { position: relative; display: flex; height: 16px; background: rgba(127,127,127,.15); overflow: visible; }
        .t64-meter span { display: block; height: 100%; }
        .t64-meter em { position: absolute; top: -4px; bottom: -4px; width: 2px; margin-left: -1px; background: var(--t64-text); }
        .t64-meter-legend { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: .72rem; color: var(--t64-dim); margin-top: 6px; }
        .t64-need { color: var(--t64-text); }
        .t64-gauge { border: 1px solid var(--t64-line); padding: 10px; margin: 0 0 12px; }
        .t64-gauge-head { display: flex; justify-content: space-between; align-items: baseline; font-size: .85rem; color: var(--t64-text); }
        .t64-gauge-head b { font-size: 1.7rem; font-weight: normal; }
        .t64-gauge-head b.hi { color: var(--t64-ok); } .t64-gauge-head b.mid { color: var(--t64-acc); } .t64-gauge-head b.lo { color: var(--t64-alert); }
        .t64-bar { height: 8px; background: rgba(127,127,127,.2); margin: 6px 0; }
        .t64-bar span { display: block; height: 100%; background: var(--t64-acc); }
        .t64-prow { padding: 8px 0; border-bottom: 1px solid var(--t64-line); }
        .t64-prow:last-child { border-bottom: none; }
        .t64-prow-head { display: flex; align-items: center; gap: 6px; font-size: .85rem; flex-wrap: wrap; }
        .t64-prow-head b { font-weight: normal; color: var(--t64-text); }
        .t64-prow-exp { margin-left: auto; font-size: .74rem; color: var(--t64-dim); }
        .t64-prow-exp b { color: var(--t64-acc); }
        .t64-tag { font-size: .66rem; padding: 0 5px; border: 1px solid var(--t64-acc); color: var(--t64-acc); }
        .t64-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .t64-chip { display: inline-flex; align-items: center; gap: 2px; font-size: .82rem; border: 1px solid var(--t64-line); padding: 5px 10px; cursor: pointer; color: var(--t64-dim); }
        .t64-chip input { display: none; }
        .t64-chip.on { border-color: var(--t64-acc); color: var(--t64-text); background: color-mix(in srgb, var(--t64-acc) 12%, transparent); }
        .t64-vs { margin: 0 0 12px; }
        .t64-vs-head { display: flex; justify-content: space-between; font-size: .8rem; color: var(--t64-dim); margin-bottom: 5px; }
        .t64-vs-head b { color: var(--t64-text); font-weight: normal; font-size: 1rem; }
        .t64-vs-bar { display: flex; height: 14px; gap: 1px; background: rgba(127,127,127,.12); }
        .t64-vs-bar span { display: block; height: 100%; }
        .t64-vs-opp { opacity: .45; }
        .t64-factors { margin: -6px 0 12px; font-size: .8rem; } .t64-factors summary { cursor: pointer; }
        .t64-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: var(--t64-dim); padding: 2px 0; }
        .t64-plus { color: var(--t64-ok); } .t64-minus { color: var(--t64-alert); }
        .t64-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 12px; background: transparent; border: 2px solid var(--t64-acc); color: var(--t64-acc); letter-spacing: 1px; margin-top: 4px; }
        .t64-go:hover { background: color-mix(in srgb, var(--t64-acc) 14%, transparent); }
        .t64-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 6px 12px; background: transparent; border: 1px solid var(--t64-line); color: var(--t64-text); margin-top: 8px; }
        .t64-mini { margin: 0; padding: 2px 8px; font-size: .75rem; }
        .t64-animrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
        .t64-speed { display: inline-flex; align-items: center; gap: 4px; }
        .t64-speed button { cursor: pointer; font-family: inherit; font-size: .75rem; padding: 3px 8px; background: transparent; border: 1px solid var(--t64-line); color: var(--t64-dim); }
        .t64-speed button.on { border-color: var(--t64-acc); color: var(--t64-acc); }
        html[data-theme-family="modern"] .t64-speed button { border-radius: 999px; }
        .t64-empty { text-align: center; padding: 22px 10px; color: var(--t64-dim); font-size: .85rem; line-height: 1.7; }
        .t64-empty-icon { font-size: 1.8rem; margin-bottom: 4px; }
        .t64-panel > .t64-result:first-child { margin: 0 0 4px; }
        .t64-result { margin-top: 12px; padding: 10px 12px; border: 1px solid var(--t64-line); border-left: 4px solid var(--t64-dim); }
        .t64-result.ok { border-left-color: var(--t64-ok); } .t64-result.fail { border-left-color: var(--t64-alert); }
        .t64-result-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: .92rem; color: var(--t64-text); margin-bottom: 2px; }
        .t64-badge { font-size: .74rem; padding: 1px 7px; border: 1px solid currentColor; }
        .t64-badge.ok { color: var(--t64-ok); } .t64-badge.fail { color: var(--t64-alert); }
        .t64-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .8rem; color: var(--t64-dim); line-height: 1.6; }
        .t64-fold { border: 1px solid var(--t64-line); padding: 0 12px; margin-bottom: 8px; }
        .t64-fold > summary { cursor: pointer; padding: 9px 0; font-size: .85rem; color: var(--t64-text); }
        .t64-fold[open] { padding-bottom: 10px; }
        .t64-hurt { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 5px 0; border-bottom: 1px solid var(--t64-line); font-size: .82rem; color: var(--t64-text); }
        .t64-hurt-row { color: #f0a030; }
        .t64-log-row { display: grid; grid-template-columns: 1.2em auto 1fr auto; gap: 8px; padding: 4px 0; font-size: .8rem; color: var(--t64-text); border-bottom: 1px solid var(--t64-line); }
        html[data-theme-family="modern"] .t64-stat { border-radius: 999px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t64-mode { border-radius: 12px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t64-mode b { font-weight: 600; }
        html[data-theme-family="modern"] .t64-mode.active { box-shadow: inset 0 0 0 1px var(--t64-acc); background: color-mix(in srgb, var(--t64-acc) 7%, var(--m-surface)); }
        html[data-theme-family="modern"] .t64-panel, html[data-theme-family="modern"] .t64-fold { border-radius: 14px; }
        html[data-theme-family="modern"] .t64-fold { background: var(--m-surface); }
        html[data-theme-family="modern"] .t64-gauge, html[data-theme-family="modern"] .t64-result { border-radius: 12px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t64-result { border-left-width: 4px; }
        html[data-theme-family="modern"] .t64-meter, html[data-theme-family="modern"] .t64-vs-bar, html[data-theme-family="modern"] .t64-bar { border-radius: 6px; overflow: hidden; }
        html[data-theme-family="modern"] .t64-meter { overflow: visible; }
        html[data-theme-family="modern"] .t64-meter span:first-child { border-radius: 6px 0 0 6px; }
        html[data-theme-family="modern"] .t64-chip, html[data-theme-family="modern"] .t64-tag, html[data-theme-family="modern"] .t64-badge { border-radius: 999px; }
        html[data-theme-family="modern"] .t64-go { border-radius: 12px; font-weight: 600; letter-spacing: 0; border: none; background: var(--t64-acc); color: #fff; }
        html[data-theme-family="modern"] .t64-go:hover { filter: brightness(1.08); }
        html[data-theme-family="modern"] .t64-btn { border-radius: 8px; border-color: var(--m-border-strong); }
        html[data-theme-family="modern"] .t64-group-title { text-transform: none; letter-spacing: 0; font-weight: 600; }
    `;
    document.head.appendChild(style);
    // 튜토리얼(미리보기 과정)이 진행 상황을 읽고 모드를 바꾸는 창구
    window.T64 = { get log() { return S.log; }, setMode(m) { ui.mode = m; renderSiege(); } };
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
