// ===== 1.6.2 — 주사위는 던져졌다 "Alea iacta est" (군부 · 쿠데타 · 군정) =====
// 1.6.2 미리보기(예전 teaser62)에서 본 게임으로 옮겨 왔다 — 본 게임 · 모든 미리보기 화면에서 돈다.
//
//   - 내각 › 군부: 군 지휘부(국방부 장관 · 합동참모의장 · 육해공군 참모총장 · 장성 등)를 정해 둔다.
//     사람마다 정부에 대한 충성도(0~100)와 가까운 정당 — 쿠데타 성공 확률 · 주도 · 진압에 쓰인다
//   - 내각 › 쿠데타: 주도 세력(군부 · 정당 · 대통령 친위 쿠데타)과 지도자를 고르면 성공 확률을 요인별로 보여 주고,
//     일으키면 주사위를 굴린다
//       성공: 계엄령 선포(의회 정지) · 반대 정당 활동 금지(정당 · 친위) / 군부는 숨겨진 정부 형태 "군정"
//             — 주도 정당 없이 군사평의회가 집권, 의장이 대통령 · 총리를 겸하고 비상 권한을 모두 쥐며 선거가 멈춘다
//       실패: 주도 세력 처벌(지도자 숙청 · 정당 활동 금지 · 대통령 축출) · 역풍으로 지지율 하락
//   - 군정에서 벗어나기: 민정 이양(계엄 해제 · 선거 재개 · 쿠데타로 막힌 정당 복권) · 역쿠데타 (혁명은 1.6.3)
// main.js의 최상위 함수(getAppState · switchSubTab 등)는 전역에 이름으로 걸려 있어서 여기서 감싸 덮어쓴다
/* global getAppState, setAppState, switchSubTab, parties, coalitions, president, pm, elecStore, emergencyPowers,
   seatKeyFor, chamberList, renderEmergencyPowers, applyMartialLawEffects, renderPresidentSection, renderPmSection,
   renderCabinetDisplay, simulate, refreshUI, showCustomAlert, showCustomConfirm, escapeHtmlText, formatNationDate,
   effRoleLabel, elecRun, elecRunByElection, runPresidentialElection, currentMainTab, currentSubTab */
(function () {
    'use strict';
    // 1.6.3 혁명(js/revolution.js)은 아래 window.HemiCoup로 군정 등을 다룬다

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const DEFAULT_ROSTER = [
        [i18n('sim.coup.1'), 55, 'mnd'], [i18n('sim.coup.2'), 60, 'jcs'], [i18n('sim.coup.3'), 60, 'army'], [i18n('sim.coup.4'), 65, 'navy'], [i18n('sim.coup.5'), 65, 'air'],
    ];
    // 군 소속(육군 · 해군 · 공군 …) 기본값 — 이름 · 색은 내각 › 군부에서 바꾸고 더할 수 있다. keys는 직책 이름으로 소속을 짐작할 때 쓴다
    const DEFAULT_BRANCHES = [
        { id: 'mnd', name: '국방부', color: '#5b6b7a', keys: ['국방'] },
        { id: 'jcs', name: '합동참모본부', color: '#8a6a1f', keys: ['합동참모', '합참'] },
        { id: 'army', name: '육군', color: '#6b7d4a', keys: ['육군'] },
        { id: 'navy', name: '해군', color: '#1f4e8c', keys: ['해군'] },
        { id: 'air', name: '공군', color: '#4a90c8', keys: ['공군'] },
        { id: 'marine', name: '해병대', color: '#b02a2a', keys: ['해병'] },
        { id: 'special', name: '특수부대', color: '#7a4a8a', keys: ['특수', '특전'] },
    ];
    const OFFICER_COLOR = '#6b7d4a'; // 소속이 없는 지휘관 카드 색
    const TYPE_LABEL = { military: i18n('sim.coup.6'), party: i18n('sim.coup.7'), self: i18n('sim.coup.8') };

    // ---- 상태 (세이브의 coup 칸 — 1.6.2 미리보기 세이브는 teaser62 칸) ----
    //   military: [{ id, role, name, photo, partyId, loyalty, branchId, cabinetId }]
    //     cabinetId: 내각 › 내각 구성원(main.js cabinetMembers)의 id — 연결하면 직책 · 이름 · 사진 · 당적을 그 자리에서 가져온다
    //   branches: [{ id, name, color }] — 군 소속 (예전 세이브에 없으면 기본값으로 채우고, 지휘관 소속은 직책 이름으로 짐작)
    //   junta: null | { chairId, chairName, chairRole, since, prevPresident, prevPm, prevRuling:{pid:bool}, banned:[pid] }
    //   coupBanned: [pid] — 쿠데타 성공으로 활동 금지된 정당 (민정 이양 · 복권 대상)
    //   log: [{ at, date, type, leader, target, chance, success, effects }]
    let T = fresh();
    function fresh() { return { military: [], branches: defaultBranches(), junta: null, coupBanned: [], log: [] }; }
    function defaultBranches() {
        const tr = k => (window.HemiLang && typeof HemiLang.t === 'function' ? HemiLang.t(k) : k);
        return DEFAULT_BRANCHES.map(b => ({ id: b.id, name: tr(b.name), color: b.color }));
    }
    function guessBranch(role) {
        const d = DEFAULT_BRANCHES.find(b => b.keys.some(k => String(role || '').includes(k)));
        return d && T.branches.some(b => b.id === d.id) ? d.id : '';
    }
    const branchById = id => T.branches.find(b => b.id === id) || null;
    const officerColor = m => (branchById(m.branchId) || {}).color || OFFICER_COLOR;

    // ---- 내각 연결 (예: 군부의 국방부 장관 ↔ 내각 › 내각 구성원의 국방부 장관) ----
    const cabinetList = () => (typeof cabinetMembers !== 'undefined' && Array.isArray(cabinetMembers) ? cabinetMembers : []);
    const cabinetById = id => (id ? cabinetList().find(c => c.id === id) || null : null);
    // 내각 자리의 실제 값 — 그 자리가 의원과 연결돼 있으면 의원 값 (main.js 내각 구성원 목록과 같은 규칙)
    function cabinetEffective(c) {
        const r = c.linkedSeat && typeof resolveLinkedSeat === 'function' ? resolveLinkedSeat(c.linkedSeat) : null;
        return { name: (r ? r.name : c.name) || '', photo: (r ? r.photo : c.photo) || '', partyId: r ? r.partyId : c.partyId, position: c.position || '' };
    }
    // 연결된 지휘관에 내각 자리 값을 옮겨 둔다 (쿠데타 계산 · 군정 의장 등은 지휘관 값을 그대로 쓰므로)
    function syncCabinetLinks() {
        T.military.forEach(m => {
            if (!m.cabinetId) return;
            const c = cabinetById(m.cabinetId);
            if (!c) { m.cabinetId = ''; return; } // 내각에서 그 자리를 지웠으면 연결만 풀고 값은 남김
            const e = cabinetEffective(c);
            if (e.position) m.role = e.position;
            m.name = e.name; m.photo = e.photo;
            m.partyId = e.partyId == null ? '' : String(e.partyId);
        });
    }
    const cabinetLinkLabel = c => `${c.position || i18n('sim.coup.9')}${cabinetEffective(c).name ? ` · ${cabinetEffective(c).name}` : ''}`;
    let ui = { type: 'military', leaderId: '', partyId: '', lastId: null };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.coup = JSON.parse(JSON.stringify(T));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && (state.coup || state.teaser62);
        T = { ...fresh(), ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        if (!Array.isArray(T.military)) T.military = [];
        if (!Array.isArray(T.branches)) T.branches = defaultBranches();
        T.military.forEach(m => { if (m.branchId === undefined) m.branchId = guessBranch(m.role); });
        if (!Array.isArray(T.log)) T.log = [];
        if (!Array.isArray(T.coupBanned)) T.coupBanned = [];
        refresh();
        return r;
    };

    // ---- 계산에 쓰는 값 ----
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    function seatShare(filter) {
        const key = seatKeyFor('house');
        const total = parties.reduce((a, p) => a + (p[key] || 0), 0);
        if (!total) return 0;
        return parties.filter(filter).reduce((a, p) => a + (p[key] || 0), 0) / total;
    }
    const support = pid => Math.max(0, Number(elecStore?.house?.[pid]?.prob) || 0); // 하원 지지율(%)
    const disloyal = m => (100 - clamp(Number(m.loyalty) || 0, 0, 100)) / 100;
    function militaryDisloyalty(exceptId) {
        const list = T.military.filter(m => m.id !== exceptId);
        if (!list.length) return 0.4; // 군 지휘부를 정하지 않았으면 중간쯤
        return list.reduce((a, m) => a + disloyal(m), 0) / list.length;
    }
    const isTopRole = m => /장관|의장|총장|사령관/.test(m.role || '');

    // 성공 확률 — 요인마다 몇 %p인지 함께 돌려준다 (화면에 그대로 보여 줌)
    function coupChance(type, opts) {
        syncCabinetLinks();
        const f = [];
        const add = (label, v) => { f.push({ label, v: Math.round(v) }); };
        const martial = emergencyPowers?.martialLaw?.active;
        if (type === 'military' || type === 'counter') {
            const leader = T.military.find(m => m.id === opts.leaderId);
            add(i18n('sim.coup.10'), type === 'counter' ? 20 : 15);
            if (leader) {
                add(i18n('sim.coup.11', { role: leader.name || leader.role, loyalty: leader.loyalty }), 25 * disloyal(leader));
                if (isTopRole(leader)) add(i18n('sim.coup.12', { role: leader.role }), 10);
            }
            add(i18n('sim.coup.13'), 40 * militaryDisloyalty(leader && leader.id));
            if (type === 'military') {
                add(i18n('sim.coup.14'), -25 * seatShare(isGovParty));
                if (martial) add(i18n('sim.coup.15'), -10);
            }
        } else if (type === 'party') {
            const p = partyById(opts.partyId);
            add(i18n('sim.coup.10'), 5);
            if (p) {
                add(i18n('sim.coup.16', { name: p.name, support: support(p.id) }), 0.5 * support(p.id));
                add(i18n('sim.coup.17', { name: p.name }), 20 * seatShare(x => x === p));
                const aligned = T.military.filter(m => String(m.partyId) === String(p.id));
                if (aligned.length) add(i18n('sim.coup.18', { aligned: aligned.length }), Math.min(25, 8 * aligned.length));
                if (isGovParty(p)) add(i18n('sim.coup.19'), 10);
            }
            add(i18n('sim.coup.20'), 20 * militaryDisloyalty());
            add(i18n('sim.coup.14'), -20 * seatShare(x => isGovParty(x) && (!p || x !== p)));
        } else if (type === 'self') {
            const pp = partyById(president.partyId);
            add(i18n('sim.coup.10'), 20);
            add(i18n('sim.coup.14'), 35 * seatShare(isGovParty));
            if (pp) add(i18n('sim.coup.21', { name: pp.name, pp: support(pp.id) }), 0.3 * support(pp.id));
            add(i18n('sim.coup.22'), 30 * (1 - militaryDisloyalty()));
            if (martial) add(i18n('sim.coup.23'), 10);
        }
        const total = clamp(Math.round(f.reduce((a, x) => a + x.v, 0)), 5, 95);
        return { factors: f, chance: total };
    }

    // ---- 쿠데타 일으키기 ----
    function snapshotPerson(o) { return { name: o.name || '', photo: o.photo || '', partyId: o.partyId ?? null, linkedSeat: o.linkedSeat || null }; }
    function declareMartialLaw() {
        emergencyPowers.martialLaw.holder = 'president';
        emergencyPowers.martialLaw.suspendParliament = true;
        emergencyPowers.martialLaw.active = true;
        if (typeof renderEmergencyPowers === 'function') renderEmergencyPowers();
        if (typeof applyMartialLawEffects === 'function') applyMartialLawEffects();
    }
    function banOpposition(keepIds) {
        const keep = new Set(keepIds.map(String));
        const banned = [];
        parties.forEach(p => {
            if (keep.has(String(p.id)) || p.status === 'banned' || p.status === 'dissolved') return;
            if (/무소속/.test(p.name) && p.ideologyId === 9999) return; // 무소속은 정당이 아니므로 그대로
            p.status = 'banned';
            banned.push(p.id);
        });
        T.coupBanned = [...new Set([...(T.coupBanned || []), ...banned])];
        return banned;
    }
    function cutSupport(pid, factor) {
        chamberList().forEach(ch => { const st = elecStore?.[ch]?.[pid]; if (st) st.prob = Math.round((Number(st.prob) || 0) * factor * 10) / 10; });
    }
    function rerenderGov() {
        ['renderPresidentSection', 'renderPmSection', 'renderCabinetDisplay'].forEach(fn => { try { window[fn] && window[fn](); } catch (e) { /* 화면 준비 전 */ } });
        try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
    }

    function attempt() {
        syncCabinetLinks();
        const type = ui.type;
        if (T.junta && type !== 'counter') { showCustomAlert(i18n('sim.coup.24')); return; }
        let leaderName = '', target = '';
        if (type === 'military' || type === 'counter') {
            const m = T.military.find(x => x.id === ui.leaderId);
            if (!m) { showCustomAlert(i18n('sim.coup.25')); return; }
            if (type === 'counter' && T.junta && m.id === T.junta.chairId) { showCustomAlert(i18n('sim.coup.26')); return; }
            leaderName = `${m.role} ${m.name || ''}`.trim();
            target = type === 'counter' ? i18n('sim.coup.27') : i18n('sim.coup.28');
        } else if (type === 'party') {
            const p = partyById(ui.partyId);
            if (!p || p.status === 'banned' || p.status === 'dissolved') { showCustomAlert(i18n('sim.coup.29')); return; }
            leaderName = p.name; target = i18n('sim.coup.28');
        } else {
            if (!president.name && president.partyId == null) { showCustomAlert(i18n('sim.coup.30', { president: effRoleLabel('president') })); return; }
            leaderName = `${effRoleLabel('president')} ${president.name || ''}`.trim(); target = i18n('sim.mainContentHelp.1');
        }
        const { chance } = coupChance(type, { leaderId: ui.leaderId, partyId: ui.partyId });
        showCustomConfirm(i18n('sim.coup.32', { type: TYPE_LABEL[type] || i18n('sim.coup.31'), leaderName, chance }), () => {
            const success = Math.random() * 100 < chance;
            const effects = success ? applySuccess(type) : applyFailure(type);
            const entry = { id: uid(), at: Date.now(), date: (typeof formatNationDate === 'function' ? formatNationDate() : ''), type: type === 'counter' ? 'counter' : type,
                leader: leaderName, target, chance, success, effects };
            T.log.unshift(entry);
            ui.lastId = entry.id;
            rerenderGov();
            refresh();
        });
    }

    function applySuccess(type) {
        const fx = [];
        if (type === 'military' || type === 'counter') {
            const m = T.military.find(x => x.id === ui.leaderId);
            if (!T.junta) {
                T.junta = { prevPresident: snapshotPerson(president), prevPm: snapshotPerson(pm),
                    prevRuling: Object.fromEntries(parties.map(p => [p.id, !!p.isRuling])), since: formatNationDate() };
                parties.forEach(p => { p.isRuling = false; });
                coalitions.forEach(c => { c._wasRuling = !!c.isRuling; c.isRuling = false; });
                fx.push(i18n('sim.coup.33'));
            } else fx.push(i18n('sim.coup.34', { chairName: T.junta.chairName, role: m.name || m.role }));
            T.junta.chairId = m.id; T.junta.chairName = m.name || m.role; T.junta.chairRole = m.role;
            // 의장이 대통령 · 총리를 겸하고, 비상 권한을 모두 쥔다
            Object.assign(president, { name: m.name || m.role, photo: m.photo || '', partyId: null, linkedSeat: null });
            Object.assign(pm, { name: m.name || m.role, photo: m.photo || '', partyId: null, linkedSeat: null });
            Object.keys(emergencyPowers).forEach(k => { emergencyPowers[k].holder = 'president'; });
            m.loyalty = 100;
            declareMartialLaw();
            fx.push(i18n('sim.coup.35'), i18n('sim.coup.36', { role: m.name || m.role }));
        } else if (type === 'party') {
            const p = partyById(ui.partyId);
            parties.forEach(x => { x.isRuling = x === p; });
            coalitions.forEach(c => { c.isRuling = false; });
            const leader = p.leaderName || i18n('sim.coup.37', { name: p.name }); // 당수 이름을 안 적은 정당은 "OO 대표"로
            Object.assign(president, { name: leader, photo: p.leaderPhoto || '', partyId: p.id, linkedSeat: null });
            declareMartialLaw();
            const banned = banOpposition([p.id]);
            fx.push(i18n('sim.coup.38', { name: p.name, president: effRoleLabel('president'), leader }), i18n('sim.coup.39'), i18n('sim.coup.40', { banned: banned.length }));
        } else {
            declareMartialLaw();
            const keep = parties.filter(isGovParty).map(p => p.id);
            if (president.partyId != null) keep.push(president.partyId);
            const banned = banOpposition(keep);
            fx.push(i18n('sim.coup.39'), i18n('sim.coup.40', { banned: banned.length }));
        }
        return fx;
    }

    function applyFailure(type) {
        const fx = [];
        if (type === 'military' || type === 'counter') {
            const m = T.military.find(x => x.id === ui.leaderId);
            T.military = T.military.filter(x => x !== m);
            T.military.forEach(x => { x.loyalty = clamp((Number(x.loyalty) || 0) + 10, 0, 100); }); // 숙청 뒤 남은 지휘부는 몸을 사린다
            fx.push(i18n('sim.coup.41', { role: m.role, name: m.name || '' }).trim(), i18n('sim.coup.42'));
        } else if (type === 'party') {
            const p = partyById(ui.partyId);
            p.status = 'banned';
            cutSupport(p.id, 0.5);
            fx.push(i18n('sim.coup.43', { name: p.name }));
        } else {
            const pp = partyById(president.partyId);
            const name = president.name;
            Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null });
            if (pp) { cutSupport(pp.id, 0.7); fx.push(i18n('sim.coup.44', { name: pp.name })); }
            fx.unshift(i18n('sim.coup.45', { president: effRoleLabel('president'), name: name || '' }).trim());
        }
        return fx;
    }

    // ---- 군정에서 벗어나기 ----
    function transferToCivilians() {
        if (!T.junta) return;
        showCustomConfirm(i18n('sim.coup.46'), () => endJunta('transfer'));
    }
    // 군정을 끝낸다 — 민정 이양(transfer)과 1.6.3 민주 혁명(revolution)이 함께 쓴다
    function endJunta(how) {
        if (!T.junta) return;
        {
            emergencyPowers.martialLaw.active = false;
            emergencyPowers.martialLaw.suspendParliament = false;
            if (typeof renderEmergencyPowers === 'function') renderEmergencyPowers();
            if (typeof applyMartialLawEffects === 'function') applyMartialLawEffects();
            restoreBanned();
            Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null });
            Object.assign(pm, { name: '', photo: '', partyId: null, linkedSeat: null });
            coalitions.forEach(c => { delete c._wasRuling; });
            if (how !== 'revolution') T.log.unshift({ id: uid(), at: Date.now(), date: formatNationDate(), type: 'transfer', leader: T.junta.chairName, target: '', chance: null, success: true,
                effects: [i18n('sim.coup.47'), i18n('sim.coup.48')] });
            T.junta = null;
            rerenderGov();
            refresh();
        }
    }
    function restoreBanned() {
        (T.coupBanned || []).forEach(id => { const p = partyById(id); if (p && p.status === 'banned') p.status = 'active'; });
        T.coupBanned = [];
    }

    // ---- 디버그 모드: 쿠데타 없이 바로 군정 (설정 › 기타 설정 › 숨겨진 정부 형태 보이기, js/devmode.js) ----
    function debugJunta() {
        syncCabinetLinks();
        if (T.junta) { showCustomAlert(i18n('sim.coup.49')); return; }
        const m = T.military.find(x => x.id === ui.leaderId) || T.military[0];
        if (!m) { showCustomAlert(i18n('sim.coup.50')); return; }
        const leaderName = `${m.role} ${m.name || ''}`.trim();
        showCustomConfirm(i18n('sim.coup.51', { leaderName }), () => {
            ui.leaderId = m.id;
            const effects = [i18n('sim.coup.52'), ...applySuccess('military')];
            const entry = { id: uid(), at: Date.now(), date: formatNationDate(), type: 'military', leader: leaderName, target: i18n('sim.coup.28'), chance: null, success: true, effects };
            T.log.unshift(entry);
            ui.lastId = entry.id;
            rerenderGov();
            refresh();
        });
    }
    if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.register({ id: 'junta', label: i18n('sim.coup.53'), version: '1.6.2', isActive: () => !!T.junta, enter: debugJunta });

    // ---- 군정: 직책 이름 · 선거 중단 ----
    const origRole = window.effRoleLabel;
    window.effRoleLabel = function (key) {
        if (T.junta && (key === 'president' || key === 'pm')) return i18n('sim.coup.54');
        return origRole.apply(this, arguments);
    };
    // 다수당 방식 총리 자동 반영을 끈다 — 군정에서는 의장이 총리를 겸하므로 다수당 대표 · 당적이 끼어들면 안 됨
    const origPmAuto = window.pmAutoSource;
    if (typeof origPmAuto === 'function') window.pmAutoSource = function () {
        if (T.junta && !pm.linkedSeat) return null;
        return origPmAuto.apply(this, arguments);
    };
    const origPmSection = window.renderPmSection;
    if (typeof origPmSection === 'function') window.renderPmSection = function () {
        const r = origPmSection.apply(this, arguments);
        const lock = document.getElementById('pmMajorityLockSection');
        if (lock && T.junta) lock.style.display = 'none'; // 군정에는 다수당이 없으니 "현재 총리로 고정"도 숨김
        return r;
    };
    const blockIfJunta = fn => function () {
        // 관제 선거를 허용했으면(1.6.9 — js/politics.js) 군정에서도 선거를 치른다
        const managed = window.HemiFraudRegime && window.HemiFraudRegime.managedElections && window.HemiFraudRegime.managedElections();
        if (T.junta && !managed) { showCustomAlert(i18n('sim.coup.55')); return; }
        return fn.apply(this, arguments);
    };
    ['elecRun', 'elecRunByElection', 'runPresidentialElection'].forEach(n => { if (typeof window[n] === 'function') window[n] = blockIfJunta(window[n]); });
    if (window.PopVote) ['runLocal', 'runRef'].forEach(n => { if (typeof window.PopVote[n] === 'function') window.PopVote[n] = blockIfJunta(window.PopVote[n]); });

    // ---- 탭: 내각 › 군부 · 쿠데타 (사이드바는 js/sidenav.js가 나중에 버튼을 보고 만든다) ----
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTabs() {
        const cab = document.getElementById('mainContentCabinet');
        const bar = cab && cab.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const before = document.getElementById('subTabCouncil');
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','military')" id="subTabMilitary">${esc(i18n('sim.coup.56'))}</button>`), before);
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','coup')" id="subTabCoup">${esc(i18n('sim.coup.57'))}</button>`), before);
        cab.appendChild(el(`<div id="contentMilitary" class="sub-tab-content"></div>`));
        cab.appendChild(el(`<div id="contentCoup" class="sub-tab-content"></div>`));
    })();
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'cabinet' && (sub === 'military' || sub === 'coup')) refresh();
        return r;
    };
    const origCab = window.renderCabinetDisplay;
    window.renderCabinetDisplay = function () {
        const r = origCab.apply(this, arguments);
        const grid = document.getElementById('cabinetDisplayGrid');
        if (grid) {
            let b = document.getElementById('coupJuntaBanner');
            if (T.junta) {
                if (!b) { b = el('<div id="coupJuntaBanner" class="coup-banner"></div>'); grid.parentElement.insertBefore(b, grid); }
                b.innerHTML = `${esc(i18n('sim.coup.58'))} <b>${esc(T.junta.chairRole || '')} ${esc(T.junta.chairName)}</b>${T.junta.since ? esc((" " + i18n('sim.coup.59', { since: (T.junta.since) }))) : ''}`;
            } else if (b) b.remove();
        }
        return r;
    };

    // ---- 화면: 군부 ----
    function renderMilitary() {
        const box = document.getElementById('contentMilitary');
        if (!box) return;
        syncCabinetLinks();
        const avg = T.military.length ? Math.round(T.military.reduce((a, m) => a + (Number(m.loyalty) || 0), 0) / T.military.length) : null;
        const partyOpts = sel => `<option value="">${esc(i18n('sim.coup.60'))}</option>` + parties.filter(p => p.status !== 'dissolved')
            .map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(sel) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
        const cabinetOpts = () => `<option value="">${esc(i18n('sim.coup.61'))}</option>` + cabinetList()
            .map(c => `<option value="${esc(c.id)}">${esc(cabinetLinkLabel(c))}</option>`).join('');
        const branchOpts = sel => `<option value="">${esc(i18n('sim.coup.62'))}</option>` + T.branches
            .map(b => `<option value="${esc(b.id)}" ${b.id === sel ? 'selected' : ''}>${esc(b.name || i18n('sim.core.7'))}</option>`).join('');
        box.innerHTML = `
            <div class="coup-intro">${esc(i18n('sim.coup.63'))}</div>
            <div class="coup-row coup-summary"><span>${esc(i18n('sim.coup.64', { count: T.military.length }))}${avg != null ? ` ${esc(i18n('sim.coup.66'))} <b>${avg}</b>` : ''}</span>
                ${T.junta ? `<span class="coup-tag">${esc(i18n('sim.coup.67'))} ${esc(T.junta.chairName)}</span>` : ''}</div>
            <details class="coup-branches" ${ui.branchesOpen ? 'open' : ''}>
                <summary>${esc(i18n('sim.coup.68'))}${T.branches.length})</summary>
                <div class="coup-dim coup-small">${esc(i18n('sim.coup.69'))}</div>
                ${T.branches.map(b => `
                    <div class="coup-row coup-branch-row" data-bid="${esc(b.id)}">
                        <input type="color" data-bf="color" value="${esc(b.color || OFFICER_COLOR)}" title="${esc(i18n('sim.main.25'))}">
                        <input type="text" data-bf="name" value="${esc(b.name)}" placeholder="${esc(i18n('sim.coup.70'))}">
                        <span class="coup-dim coup-small">${esc(i18n('sim.common.people', { count: T.military.filter(m => m.branchId === b.id).length }))}</span>
                        <button type="button" class="coup-x" data-bact="del" title="${esc(i18n('sim.coup.71'))}">✕</button>
                    </div>`).join('')}
                <div class="coup-row">
                    <button class="add-btn" data-bact="add" style="flex:1;">${esc(i18n('sim.coup.72'))}</button>
                    <button class="add-btn" data-bact="reset" style="flex:1;">${esc(i18n('sim.coup.73'))}</button>
                </div>
            </details>
            ${T.military.map(m => `
                <div class="card-item coup-officer ${T.junta && T.junta.chairId === m.id ? 'coup-chair' : ''}" data-id="${esc(m.id)}" style="--coup-branch:${esc(officerColor(m))}">
                    <div class="coup-photo-col">
                        <label class="leader-photo-box coup-photo" title="${esc(i18n('sim.coup.74'))}">${m.photo ? `<img src="${m.photo}" alt="">` : '<div class="photo-ph">🎖</div>'}<input type="file" accept="image/*" data-f="photo" ${m.cabinetId ? 'disabled' : ''}></label>
                        ${branchById(m.branchId) ? `<span class="coup-branch-tag">${esc(branchById(m.branchId).name)}</span>` : ''}
                    </div>
                    <div class="coup-officer-main">
                        <div class="coup-row">
                            <input type="text" data-f="role" value="${esc(m.role)}" placeholder="${esc(i18n('sim.coup.75'))}" class="coup-role" ${m.cabinetId ? 'disabled' : ''}>
                            <button type="button" class="coup-x" data-act="del" title="${esc(i18n('sim.coup.71'))}">✕</button>
                        </div>
                        <input type="text" data-f="name" value="${esc(m.name)}" placeholder="${esc(i18n('sim.contentDate.11'))}" ${m.cabinetId ? 'disabled' : ''}>
                        <div class="coup-row coup-field"><span>${esc(i18n('sim.coup.76'))}</span><select data-f="branchId">${branchOpts(m.branchId)}</select></div>
                        <div class="coup-row coup-field"><span>${esc(i18n('sim.mainContentSetup.2'))}</span><select data-f="partyId" ${m.cabinetId ? 'disabled' : ''}>${partyOpts(m.partyId)}</select></div>
                        ${m.cabinetId && cabinetById(m.cabinetId) ? `
                        <div class="coup-row coup-linked">${esc(i18n('sim.coup.77'))}${esc(cabinetById(m.cabinetId).position || esc(i18n('sim.coup.78')))}${esc(i18n('sim.coup.79'))}
                            <button type="button" class="coup-x" data-act="unlinkCab">${esc(i18n('sim.contentPresident.4'))}</button></div>`
                        : `<div class="coup-row coup-field"><span>${esc(i18n('sim.contentSystem.9'))}</span><select data-f="cabinetId">${cabinetOpts()}</select></div>`}
                        <div class="coup-row coup-loyal"><span>${esc(i18n('sim.coup.80'))}</span><input type="range" min="0" max="100" step="5" data-f="loyalty" value="${Number(m.loyalty) || 0}"><b>${Number(m.loyalty) || 0}</b></div>
                    </div>
                </div>`).join('')}
            <button class="add-btn" data-act="add">${esc(i18n('sim.coup.81'))}</button>
            ${T.military.length ? '' : `<button class="add-btn" data-act="seed">${esc(i18n('sim.coup.82'))}</button>`}`;
        box.querySelector('[data-act="add"]').onclick = () => { T.military.push({ id: uid(), role: i18n('sim.coup.83'), name: '', photo: '', partyId: '', loyalty: 60, branchId: '' }); renderMilitary(); };
        // 군 소속 · 색
        const det = box.querySelector('.coup-branches');
        det.ontoggle = () => { ui.branchesOpen = det.open; };
        det.querySelectorAll('.coup-branch-row').forEach(row => {
            const b = branchById(row.dataset.bid);
            row.querySelector('[data-bf="color"]').oninput = e => { b.color = e.target.value; box.querySelectorAll('.coup-officer').forEach(c => { const m = T.military.find(x => x.id === c.dataset.id); if (m) c.style.setProperty('--coup-branch', officerColor(m)); }); };
            row.querySelector('[data-bf="name"]').onchange = e => { b.name = e.target.value.trim(); renderMilitary(); };
            row.querySelector('[data-bact="del"]').onclick = () => {
                T.branches = T.branches.filter(x => x !== b);
                T.military.forEach(m => { if (m.branchId === b.id) m.branchId = ''; });
                renderMilitary();
            };
        });
        det.querySelector('[data-bact="add"]').onclick = () => { T.branches.push({ id: uid(), name: '', color: '#888888' }); renderMilitary(); };
        det.querySelector('[data-bact="reset"]').onclick = () => showCustomConfirm(i18n('sim.coup.84'), () => {
            T.branches = defaultBranches();
            T.military.forEach(m => { m.branchId = guessBranch(m.role); });
            renderMilitary();
        });
        const seed = box.querySelector('[data-act="seed"]');
        // 기본 직책 이름은 화면 언어로 (세이브에 든 이름은 번역하지 않으므로 만들 때 바꿔 둔다)
        const tr = k => (window.HemiLang && typeof HemiLang.t === 'function' ? HemiLang.t(k) : k);
        if (seed) seed.onclick = () => {
            // 내각에 국방 장관 자리가 있으면 기본 지휘부의 국방부 장관을 그 자리와 바로 연결
            const defense = cabinetList().find(c => /국방/.test(c.position || ''));
            DEFAULT_ROSTER.forEach(([role, loyalty, branchId]) => T.military.push({ id: uid(), role: tr(role), name: '', photo: '', partyId: '', loyalty, branchId: branchById(branchId) ? branchId : '',
                cabinetId: branchId === 'mnd' && defense ? defense.id : '' }));
            renderMilitary();
        };
        box.querySelectorAll('.coup-officer').forEach(card => {
            const m = T.military.find(x => x.id === card.dataset.id);
            card.querySelector('[data-act="del"]').onclick = () => { T.military = T.military.filter(x => x !== m); renderMilitary(); };
            const unlink = card.querySelector('[data-act="unlinkCab"]');
            if (unlink) unlink.onclick = () => { m.cabinetId = ''; renderMilitary(); }; // 값은 남기고 연결만 푼다
            card.querySelectorAll('[data-f]').forEach(inp => {
                const f = inp.dataset.f;
                if (f === 'photo') {
                    inp.onchange = () => { const file = inp.files && inp.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = e => { m.photo = e.target.result; renderMilitary(); }; rd.readAsDataURL(file); };
                } else if (f === 'loyalty') {
                    inp.oninput = () => { m.loyalty = +inp.value; inp.nextElementSibling.textContent = inp.value; };
                    inp.onchange = () => renderMilitary();
                } else {
                    inp.onchange = () => { m[f] = inp.value; if (f !== 'name' && f !== 'role') renderMilitary(); };
                }
            });
        });
    }

    // ---- 화면: 쿠데타 ----
    function renderCoup() {
        const box = document.getElementById('contentCoup');
        if (!box) return;
        const juntaHtml = T.junta ? `
            <div class="coup-junta">
                <div class="coup-junta-title">${esc(i18n('sim.coup.85'))}</div>
                <div class="coup-dim">${esc(i18n('sim.contentSystem.13'))} ${esc(T.junta.chairRole || '')} <b>${esc(T.junta.chairName)}</b>${T.junta.since ? esc((" " + i18n('sim.coup.59', { since: (T.junta.since) }))) : ''} ${esc(i18n('sim.coup.86'))}</div>
                <div class="coup-sub">${esc(i18n('sim.coup.87'))}</div>
                <div class="coup-row coup-wrap">
                    <button type="button" class="coup-btn" data-act="transfer">${esc(i18n('sim.coup.88'))}</button>
                    <button type="button" class="coup-btn" data-act="counter">${esc(i18n('sim.coup.89'))}</button>
                    <button type="button" class="coup-btn" onclick="switchSubTab('cabinet','revolution')">${esc(i18n('sim.coup.90'))}</button>
                </div>
            </div>` : '';
        if (T.junta && ui.type !== 'counter') ui.type = 'counter';
        if (!T.junta && ui.type === 'counter') ui.type = 'military';
        const type = ui.type;
        const officers = T.military.filter(m => !(T.junta && m.id === T.junta.chairId));
        if ((type === 'military' || type === 'counter') && !officers.some(m => m.id === ui.leaderId)) {
            const pick = officers.slice().sort((a, b) => (a.loyalty || 0) - (b.loyalty || 0))[0];
            ui.leaderId = pick ? pick.id : '';
        }
        const activeParties = parties.filter(p => p.status !== 'banned' && p.status !== 'dissolved' && !(p.ideologyId === 9999));
        if (type === 'party' && !activeParties.some(p => String(p.id) === String(ui.partyId))) {
            const pick = activeParties.filter(p => !isGovParty(p)).sort((a, b) => support(b.id) - support(a.id))[0] || activeParties[0];
            ui.partyId = pick ? pick.id : '';
        }
        const { factors, chance } = coupChance(type, { leaderId: ui.leaderId, partyId: ui.partyId });
        const last = T.log.find(x => x.id === ui.lastId);
        const typeBtn = (k, t) => `<button type="button" class="system-radio-btn ${type === k ? 'active' : ''}" data-type="${k}">${t}</button>`;
        box.innerHTML = `
            ${juntaHtml}
            ${T.junta ? `<div class="coup-sub">${esc(i18n('sim.coup.31'))}</div>` : `
            <div class="coup-intro">${esc(i18n('sim.coup.91'))}</div>
            <div class="system-radio-group">${typeBtn('military', esc(i18n('sim.coup.56')))}${typeBtn('party', esc(i18n('sim.mainContentSetup.2')))}${typeBtn('self', esc(i18n('sim.coup.92', { president: effRoleLabel('president') })))}</div>`}
            <div class="coup-pick">
                ${type === 'military' || type === 'counter' ? (officers.length ? `
                    <label class="coup-dim">${esc(i18n('sim.coup.93'))}</label>
                    <select data-pick="leader">${officers.map(m => `<option value="${esc(m.id)}" ${m.id === ui.leaderId ? 'selected' : ''}>${branchById(m.branchId) ? `[${esc(branchById(m.branchId).name)}] ` : ''}${esc(m.role)} ${esc(m.name || esc(i18n('sim.core.7')))} ${esc(i18n('sim.coup.94'))} ${m.loyalty}</option>`).join('')}</select>`
                    : `<div class="coup-dim">${esc(i18n('sim.coup.95'))}</div>`) : ''}
                ${type === 'party' ? `
                    <label class="coup-dim">${esc(i18n('sim.coup.96'))}</label>
                    <select data-pick="party">${activeParties.map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(ui.partyId) ? 'selected' : ''}>${esc(p.name)} ${esc(i18n('sim.coup.97'))} ${support(p.id)}%${isGovParty(p) ? esc((" " + i18n('sim.coup.98'))) : ''}</option>`).join('')}</select>` : ''}
                ${type === 'self' ? `<div class="coup-dim">${esc(i18n('sim.coup.99'))} ${esc(effRoleLabel('president'))} ${esc(president.name || esc(i18n('sim.export.18')))}${partyById(president.partyId) ? ` · ${esc(partyById(president.partyId).name)}` : ''} ${esc(i18n('sim.coup.100'))}</div>` : ''}
            </div>
            <div class="coup-chance">
                <div class="coup-chance-head"><span>${esc(i18n('sim.coup.101'))}</span><b>${chance}%</b></div>
                <div class="coup-bar"><span style="width:${chance}%"></span></div>
                ${factors.map(x => `<div class="coup-factor"><span>${esc(x.label)}</span><span class="${x.v >= 0 ? 'coup-plus' : 'coup-minus'}">${x.v >= 0 ? '+' : ''}${x.v}%p</span></div>`).join('')}
                <div class="coup-dim coup-small">${esc(i18n('sim.coup.102'))}</div>
            </div>
            <button type="button" class="coup-go" data-act="go">⚔ ${T.junta ? esc(i18n('sim.coup.31')) : TYPE_LABEL[type]} ${esc(i18n('sim.coup.103'))}</button>
            ${last ? resultCard(last) : ''}
            ${T.log.length ? `<details class="coup-log"><summary>${esc(i18n('sim.coup.104'))}${T.log.length})</summary>${T.log.map(logRow).join('')}</details>` : ''}`;
        box.querySelectorAll('[data-type]').forEach(b => { b.onclick = () => { ui.type = b.dataset.type; ui.lastId = null; renderCoup(); }; });
        const ls = box.querySelector('[data-pick="leader"]'); if (ls) ls.onchange = () => { ui.leaderId = ls.value; renderCoup(); };
        const ps = box.querySelector('[data-pick="party"]'); if (ps) ps.onchange = () => { ui.partyId = ps.value; renderCoup(); };
        box.querySelector('[data-act="go"]').onclick = attempt;
        const tr = box.querySelector('[data-act="transfer"]'); if (tr) tr.onclick = transferToCivilians;
        const ct = box.querySelector('[data-act="counter"]'); if (ct) ct.onclick = () => { box.querySelector('[data-act="go"]').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    }
    const typeName = t => ({ military: i18n('sim.coup.6'), party: i18n('sim.coup.7'), self: i18n('sim.coup.8'), counter: i18n('sim.coup.31'), transfer: i18n('sim.coup.88') }[t] || t);
    function resultCard(x) {
        return `<div class="coup-result ${x.success ? 'ok' : 'fail'}">
            <div class="coup-result-head">${x.type === 'transfer' ? esc(i18n('sim.coup.105')) : x.success ? esc(i18n('sim.coup.106')) : esc(i18n('sim.coup.107'))} — ${esc(typeName(x.type))}${x.chance != null ? ` <span class="coup-dim">${esc(i18n('sim.coup.108'))} ${x.chance}%)</span>` : ''}</div>
            <div class="coup-dim">${esc(i18n('sim.coup.99'))} ${esc(x.leader)}${x.date ? ` · ${esc(x.date)}` : ''}</div>
            <ul>${(x.effects || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>`;
    }
    function logRow(x) {
        return `<div class="coup-log-row"><span class="${x.type === 'transfer' ? '' : x.success ? 'coup-plus' : 'coup-minus'}">${x.type === 'transfer' ? '🕊' : x.success ? '✔' : '✘'}</span>
            <span>${esc(typeName(x.type))} · ${esc(x.leader)}${x.date ? ` · ${esc(x.date)}` : ''}${x.chance != null ? ` · ${x.chance}%` : ''}</span></div>`;
    }

    // 1.6.3 티저가 쓰는 창구
    window.HemiCoup = {
        get junta() { return T.junta; },
        get military() { return T.military; },
        get log() { return T.log; },
        endJunta, restoreBanned, declareMartialLaw, cutSupport, isGovParty, support, militaryDisloyalty,
        refresh: () => refresh(),
    };

    function refresh() {
        renderMilitary();
        renderCoup();
        if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.render();
        try { window.renderCabinetDisplay && window.renderCabinetDisplay(); } catch (e) { /* 화면 준비 전 */ }
    }

    const style = document.createElement('style');
    style.textContent = `
        .coup-intro { color: #777; font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .coup-row { display: flex; align-items: center; gap: 6px; }
        .coup-wrap { flex-wrap: wrap; }
        .coup-summary { justify-content: space-between; color: #aaa; font-size: .85rem; margin-bottom: 8px; }
        .coup-tag { font-size: .72rem; color: var(--tno-alert); border: 1px solid var(--tno-alert); padding: 1px 6px; }
        .coup-officer { display: flex; gap: 10px; align-items: flex-start; border-left-color: var(--coup-branch, #6b7d4a) !important; }
        .coup-officer .photo-ph { color: var(--coup-branch, #6b7d4a); }
        .coup-photo-col { display: flex; flex-direction: column; align-items: stretch; gap: 4px; flex-shrink: 0; width: 52px; }
        .coup-branch-tag { font-size: .68rem; text-align: center; padding: 1px 2px; color: #fff; background: var(--coup-branch, #6b7d4a); word-break: keep-all; overflow-wrap: anywhere; line-height: 1.3; }
        .coup-field span { color: #777; font-size: .78rem; flex-shrink: 0; width: 2.6em; }
        .coup-field select { flex: 1; min-width: 0; }
        .coup-linked { color: #6cf; font-size: .72rem; flex-wrap: wrap; }
        .coup-linked .coup-x { font-size: .7rem; padding: 1px 6px; }
        .coup-branches { border: 1px solid #2a2a2a; padding: 6px 10px; margin: 0 0 10px; }
        .coup-branches summary { cursor: pointer; color: #aaa; font-size: .85rem; }
        .coup-branches .add-btn { margin-top: 6px; }
        .coup-branch-row { margin: 5px 0; }
        .coup-branch-row input[type=color] { width: 34px; height: 28px; padding: 0; border: 1px solid #333; background: transparent; flex-shrink: 0; cursor: pointer; }
        .coup-branch-row input[type=text] { flex: 1; min-width: 0; }
        .coup-officer.coup-chair { border-left-color: var(--tno-alert) !important; box-shadow: 0 0 8px color-mix(in srgb, var(--tno-alert) 35%, transparent); }
        .coup-photo { width: 52px; height: 64px; flex-shrink: 0; }
        .coup-photo img { width: 100%; height: 100%; object-fit: cover; }
        .coup-officer-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .coup-officer-main input[type=text], .coup-officer-main select { width: 100%; box-sizing: border-box; }
        .coup-role { flex: 1; min-width: 0; font-weight: bold; }
        .coup-x { cursor: pointer; background: transparent; border: 1px solid #333; color: #777; font-family: inherit; padding: 2px 8px; }
        .coup-loyal span { color: #777; font-size: .78rem; flex-shrink: 0; }
        .coup-loyal input { flex: 1; }
        .coup-loyal b { width: 2.2em; text-align: right; font-size: .85rem; }
        .coup-pick { margin: 10px 0; display: flex; flex-direction: column; gap: 5px; }
        .coup-pick select { width: 100%; box-sizing: border-box; }
        .coup-dim { color: #777; font-size: .8rem; }
        .coup-small { font-size: .72rem; margin-top: 4px; }
        .coup-chance { border: 1px solid #333; padding: 10px; margin: 10px 0; background: rgba(255,255,255,.02); }
        .coup-chance-head { display: flex; justify-content: space-between; align-items: baseline; color: #aaa; }
        .coup-chance-head b { font-size: 1.6rem; color: var(--tno-alert); }
        .coup-bar { height: 8px; background: #222; margin: 6px 0 8px; }
        .coup-bar span { display: block; height: 100%; background: var(--tno-alert); }
        .coup-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: #999; padding: 2px 0; }
        .coup-plus { color: #5fbf7f; } .coup-minus { color: #e06060; }
        .coup-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 10px; background: transparent; border: 2px solid var(--tno-alert); color: var(--tno-alert); letter-spacing: 1px; }
        .coup-go:hover { background: color-mix(in srgb, var(--tno-alert) 15%, transparent); }
        .coup-result { margin-top: 12px; padding: 10px; border: 1px solid #333; border-left: 4px solid #888; }
        .coup-result.ok { border-left-color: #5fbf7f; } .coup-result.fail { border-left-color: #e06060; }
        .coup-result-head { font-size: 1rem; margin-bottom: 4px; }
        .coup-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .82rem; color: #bbb; }
        .coup-log { margin-top: 12px; font-size: .82rem; } .coup-log summary { cursor: pointer; color: #999; }
        .coup-log-row { display: flex; gap: 6px; padding: 3px 0; color: #aaa; border-bottom: 1px solid #1c1c1c; }
        .coup-junta { border: 1px solid var(--tno-alert); padding: 10px; margin: 8px 0 12px; background: rgba(60,0,0,.25); }
        .coup-junta-title { color: var(--tno-alert); font-size: 1rem; margin-bottom: 4px; letter-spacing: 1px; }
        .coup-sub { color: #888; font-size: .78rem; margin: 10px 0 6px; letter-spacing: 1px; }
        .coup-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 6px 12px; background: transparent; border: 1px solid #555; color: #ccc; }
        .coup-btn:disabled { opacity: .4; cursor: default; }
        .coup-banner { margin: 0 0 10px; padding: 8px 12px; border: 1px solid var(--tno-alert); color: var(--tno-alert); font-size: .9rem; background: rgba(60,0,0,.3); letter-spacing: 1px; }
        html[data-theme-family="modern"] .coup-branches { border-color: var(--m-border); border-radius: 10px; }
        html[data-theme-family="modern"] .coup-branch-tag { border-radius: 4px; }
        html[data-theme-family="modern"] .coup-intro, html[data-theme-family="modern"] .coup-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .coup-summary { color: var(--m-text-2); }
        html[data-theme-family="modern"] .coup-chance { border: 1px solid var(--m-border); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .coup-chance-head { color: var(--m-text-2); }
        html[data-theme-family="modern"] .coup-bar { background: var(--m-border); border-radius: 4px; overflow: hidden; }
        html[data-theme-family="modern"] .coup-factor { color: var(--m-text-2); }
        html[data-theme-family="modern"] .coup-go { border-radius: 12px; font-weight: 600; letter-spacing: 0; }
        html[data-theme-family="modern"] .coup-result { border: 1px solid var(--m-border); border-left-width: 4px; border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .coup-result ul { color: var(--m-text-2); }
        html[data-theme-family="modern"] .coup-junta, html[data-theme-family="modern"] .coup-banner { border-radius: 12px; background: color-mix(in srgb, var(--tno-alert) 8%, var(--m-surface)); }
        html[data-theme-family="modern"] .coup-btn, html[data-theme-family="modern"] .coup-x { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text); }
        html[data-theme-family="modern"] .coup-log-row { color: var(--m-text-2); border-bottom-color: var(--m-border); }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
