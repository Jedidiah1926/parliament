// ===== 1.6.2 — 주사위는 던져졌다 "Alea iacta est" (군부 · 쿠데타 · 군정) =====
// 1.6.2 미리보기(예전 teaser62)에서 본 게임으로 옮겨 왔다 — 본 게임 · 모든 미리보기 화면에서 돈다 (로고 제작 화면만 빼고).
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
    const root = document.documentElement;
    // 1.6.3 혁명(js/revolution.js)은 아래 window.T62로 군정 등을 다룬다
    if (root.getAttribute('data-app-mode') === 'logo') return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const DEFAULT_ROSTER = [
        ['국방부 장관', 55, 'mnd'], ['합동참모의장', 60, 'jcs'], ['육군참모총장', 60, 'army'], ['해군참모총장', 65, 'navy'], ['공군참모총장', 65, 'air'],
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
    const TYPE_LABEL = { military: '군부 쿠데타', party: '정당 쿠데타', self: '친위 쿠데타' };

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
        const tr = k => (window.DnoLang && typeof DnoLang.t === 'function' ? DnoLang.t(k) : k);
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
    const cabinetLinkLabel = c => `${c.position || '(직책 없음)'}${cabinetEffective(c).name ? ` · ${cabinetEffective(c).name}` : ''}`;
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
            add('기본', type === 'counter' ? 20 : 15);
            if (leader) {
                add(`지도자 ${leader.name || leader.role}의 불만 (충성도 ${leader.loyalty})`, 25 * disloyal(leader));
                if (isTopRole(leader)) add(`지휘 계통 장악 (${leader.role})`, 10);
            }
            add('군 지휘부 전체의 불만', 40 * militaryDisloyalty(leader && leader.id));
            if (type === 'military') {
                add('정부 · 여당의 의석', -25 * seatShare(isGovParty));
                if (martial) add('이미 선포된 계엄령 (정부가 군을 쥐고 있음)', -10);
            }
        } else if (type === 'party') {
            const p = partyById(opts.partyId);
            add('기본', 5);
            if (p) {
                add(`${p.name} 지지율 (${support(p.id)}%)`, 0.5 * support(p.id));
                add(`${p.name} 의석`, 20 * seatShare(x => x === p));
                const aligned = T.military.filter(m => String(m.partyId) === String(p.id));
                if (aligned.length) add(`가까운 장성 ${aligned.length}명`, Math.min(25, 8 * aligned.length));
                if (isGovParty(p)) add('이미 정부 · 여당 (반대 세력 없이 굳히기)', 10);
            }
            add('군 지휘부의 불만', 20 * militaryDisloyalty());
            add('정부 · 여당의 의석', -20 * seatShare(x => isGovParty(x) && (!p || x !== p)));
        } else if (type === 'self') {
            const pp = partyById(president.partyId);
            add('기본', 20);
            add('정부 · 여당의 의석', 35 * seatShare(isGovParty));
            if (pp) add(`${pp.name} 지지율 (${support(pp.id)}%)`, 0.3 * support(pp.id));
            add('군 지휘부의 충성', 30 * (1 - militaryDisloyalty()));
            if (martial) add('이미 선포된 계엄령', 10);
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
        if (T.junta && type !== 'counter') { showCustomAlert('군정 중입니다 — 아래 "군정에서 벗어나기"의 역쿠데타를 쓰세요.'); return; }
        let leaderName = '', target = '';
        if (type === 'military' || type === 'counter') {
            const m = T.military.find(x => x.id === ui.leaderId);
            if (!m) { showCustomAlert('주도할 군 지휘관을 고르세요 (내각 › 군부에서 군 지휘부를 먼저 정합니다).'); return; }
            if (type === 'counter' && T.junta && m.id === T.junta.chairId) { showCustomAlert('지금 군사평의회 의장은 역쿠데타를 일으킬 수 없습니다.'); return; }
            leaderName = `${m.role} ${m.name || ''}`.trim();
            target = type === 'counter' ? '군사평의회' : '정부';
        } else if (type === 'party') {
            const p = partyById(ui.partyId);
            if (!p || p.status === 'banned' || p.status === 'dissolved') { showCustomAlert('주도할 정당을 고르세요 (활동 금지 · 해산된 정당은 안 됨).'); return; }
            leaderName = p.name; target = '정부';
        } else {
            if (!president.name && president.partyId == null) { showCustomAlert(`${effRoleLabel('president')}이(가) 없어 친위 쿠데타를 일으킬 수 없습니다.`); return; }
            leaderName = `${effRoleLabel('president')} ${president.name || ''}`.trim(); target = '의회';
        }
        const { chance } = coupChance(type, { leaderId: ui.leaderId, partyId: ui.partyId });
        showCustomConfirm(`${TYPE_LABEL[type] || '역쿠데타'}를 일으킵니다 — 주도: ${leaderName}, 성공 확률 ${chance}%. 계속하시겠습니까?`, () => {
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
                fx.push('주도 정당 없이 군사평의회 집권 (숨겨진 정부 형태: 군정)');
            } else fx.push(`군사평의회 의장 교체 (${T.junta.chairName} → ${m.name || m.role})`);
            T.junta.chairId = m.id; T.junta.chairName = m.name || m.role; T.junta.chairRole = m.role;
            // 의장이 대통령 · 총리를 겸하고, 비상 권한을 모두 쥔다
            Object.assign(president, { name: m.name || m.role, photo: m.photo || '', partyId: null, linkedSeat: null });
            Object.assign(pm, { name: m.name || m.role, photo: m.photo || '', partyId: null, linkedSeat: null });
            Object.keys(emergencyPowers).forEach(k => { emergencyPowers[k].holder = 'president'; });
            m.loyalty = 100;
            declareMartialLaw();
            fx.push('계엄령 선포 · 의회 정지 · 선거 중단', `의장 ${m.name || m.role}이(가) 대통령 · 총리를 겸함`);
        } else if (type === 'party') {
            const p = partyById(ui.partyId);
            parties.forEach(x => { x.isRuling = x === p; });
            coalitions.forEach(c => { c.isRuling = false; });
            const leader = p.leaderName || `${p.name} 대표`; // 당수 이름을 안 적은 정당은 "OO 대표"로
            Object.assign(president, { name: leader, photo: p.leaderPhoto || '', partyId: p.id, linkedSeat: null });
            declareMartialLaw();
            const banned = banOpposition([p.id]);
            fx.push(`${p.name} 집권 · ${effRoleLabel('president')}: ${leader}`, '계엄령 선포 · 의회 정지', `반대 정당 ${banned.length}곳 활동 금지`);
        } else {
            declareMartialLaw();
            const keep = parties.filter(isGovParty).map(p => p.id);
            if (president.partyId != null) keep.push(president.partyId);
            const banned = banOpposition(keep);
            fx.push('계엄령 선포 · 의회 정지', `반대 정당 ${banned.length}곳 활동 금지`);
        }
        return fx;
    }

    function applyFailure(type) {
        const fx = [];
        if (type === 'military' || type === 'counter') {
            const m = T.military.find(x => x.id === ui.leaderId);
            T.military = T.military.filter(x => x !== m);
            T.military.forEach(x => { x.loyalty = clamp((Number(x.loyalty) || 0) + 10, 0, 100); }); // 숙청 뒤 남은 지휘부는 몸을 사린다
            fx.push(`${m.role} ${m.name || ''} 숙청 (군 지휘부에서 빠짐)`.trim(), '남은 지휘부 충성도 +10');
        } else if (type === 'party') {
            const p = partyById(ui.partyId);
            p.status = 'banned';
            cutSupport(p.id, 0.5);
            fx.push(`${p.name} 활동 금지 · 지지율 절반으로`);
        } else {
            const pp = partyById(president.partyId);
            const name = president.name;
            Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null });
            if (pp) { cutSupport(pp.id, 0.7); fx.push(`${pp.name} 지지율 30% 하락`); }
            fx.unshift(`${effRoleLabel('president')} ${name || ''} 축출 (공석)`.trim());
        }
        return fx;
    }

    // ---- 군정에서 벗어나기 ----
    function transferToCivilians() {
        if (!T.junta) return;
        showCustomConfirm('민정 이양 — 계엄령을 해제하고 의회 · 선거를 되살립니다. 쿠데타로 활동 금지된 정당은 복권되고, 대통령 · 총리는 다음 선거까지 공석입니다. 계속하시겠습니까?', () => endJunta('transfer'));
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
                effects: ['계엄령 해제 · 의회 활동 재개 · 선거 재개', '대통령 · 총리 공석 (선거로 뽑음)'] });
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
        if (T.junta) { showCustomAlert('이미 군정입니다 — 내각 › 쿠데타의 "민정 이양"으로 벗어날 수 있어요.'); return; }
        const m = T.military.find(x => x.id === ui.leaderId) || T.military[0];
        if (!m) { showCustomAlert('군사평의회 의장이 될 군 지휘관이 없습니다 — 내각 › 군부에서 군 지휘부를 먼저 정하세요.'); return; }
        const leaderName = `${m.role} ${m.name || ''}`.trim();
        showCustomConfirm(`디버그 — 쿠데타 없이 바로 군정으로 바꿉니다 (의장: ${leaderName}). 계속하시겠습니까?`, () => {
            ui.leaderId = m.id;
            const effects = ['디버그 모드로 바로 바꿈', ...applySuccess('military')];
            const entry = { id: uid(), at: Date.now(), date: formatNationDate(), type: 'military', leader: leaderName, target: '정부', chance: null, success: true, effects };
            T.log.unshift(entry);
            ui.lastId = entry.id;
            rerenderGov();
            refresh();
        });
    }
    if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.register({ id: 'junta', label: '군정', version: '1.6.2', isActive: () => !!T.junta, enter: debugJunta });

    // ---- 군정: 직책 이름 · 선거 중단 ----
    const origRole = window.effRoleLabel;
    window.effRoleLabel = function (key) {
        if (T.junta && (key === 'president' || key === 'pm')) return '군사평의회 의장';
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
        // 관제 선거를 허용했으면(1.6.9 미리보기 — js/teaser69pol.js) 군정에서도 선거를 치른다
        const managed = window.HemiFraudRegime && window.HemiFraudRegime.managedElections && window.HemiFraudRegime.managedElections();
        if (T.junta && !managed) { showCustomAlert('군정 중에는 선거가 중단됩니다 — 내각 › 쿠데타의 "민정 이양" 뒤에 치를 수 있어요.'); return; }
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
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','military')" id="subTabMilitary">군부</button>`), before);
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','coup')" id="subTabCoup">쿠데타</button>`), before);
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
            let b = document.getElementById('t62JuntaBanner');
            if (T.junta) {
                if (!b) { b = el('<div id="t62JuntaBanner" class="t62-banner"></div>'); grid.parentElement.insertBefore(b, grid); }
                b.innerHTML = `⚔ 군정 — 군사평의회 집권 중 · 의장 <b>${esc(T.junta.chairRole || '')} ${esc(T.junta.chairName)}</b>${T.junta.since ? ` · ${esc(T.junta.since)}부터` : ''}`;
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
        const partyOpts = sel => `<option value="">— 가까운 정당 없음 —</option>` + parties.filter(p => p.status !== 'dissolved')
            .map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(sel) ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
        const cabinetOpts = () => `<option value="">— 연결 안 함 —</option>` + cabinetList()
            .map(c => `<option value="${esc(c.id)}">${esc(cabinetLinkLabel(c))}</option>`).join('');
        const branchOpts = sel => `<option value="">— 소속 없음 —</option>` + T.branches
            .map(b => `<option value="${esc(b.id)}" ${b.id === sel ? 'selected' : ''}>${esc(b.name || '(이름 없음)')}</option>`).join('');
        box.innerHTML = `
            <div class="t62-intro">군 지휘부를 정해 둡니다. 충성도는 지금 정부에 대한 충성(0~100)으로, 낮을수록 군부 쿠데타가 잘 되고 높을수록 친위 쿠데타를 돕습니다. 가까운 정당은 그 정당이 쿠데타를 일으킬 때 힘을 보탭니다.</div>
            <div class="t62-row t62-summary"><span>군 지휘부 ${T.military.length}명${avg != null ? ` · 평균 충성도 <b>${avg}</b>` : ''}</span>
                ${T.junta ? `<span class="t62-tag">군정 — 의장 ${esc(T.junta.chairName)}</span>` : ''}</div>
            <details class="t62-branches" ${ui.branchesOpen ? 'open' : ''}>
                <summary>군 소속 · 색 (${T.branches.length})</summary>
                <div class="t62-dim t62-small">지휘관마다 소속을 고르면 카드가 그 색으로 표시됩니다. 이름 · 색을 바꾸거나 소속을 더할 수 있어요.</div>
                ${T.branches.map(b => `
                    <div class="t62-row t62-branch-row" data-bid="${esc(b.id)}">
                        <input type="color" data-bf="color" value="${esc(b.color || OFFICER_COLOR)}" title="색">
                        <input type="text" data-bf="name" value="${esc(b.name)}" placeholder="소속 이름 (예: 해병대)">
                        <span class="t62-dim t62-small">${T.military.filter(m => m.branchId === b.id).length}명</span>
                        <button type="button" class="t62-x" data-bact="del" title="빼기">✕</button>
                    </div>`).join('')}
                <div class="t62-row">
                    <button class="add-btn" data-bact="add" style="flex:1;">[+] 소속 추가</button>
                    <button class="add-btn" data-bact="reset" style="flex:1;">기본 소속으로</button>
                </div>
            </details>
            ${T.military.map(m => `
                <div class="card-item t62-officer ${T.junta && T.junta.chairId === m.id ? 't62-chair' : ''}" data-id="${esc(m.id)}" style="--t62-branch:${esc(officerColor(m))}">
                    <div class="t62-photo-col">
                        <label class="leader-photo-box t62-photo" title="사진">${m.photo ? `<img src="${m.photo}" alt="">` : '<div class="photo-ph">🎖</div>'}<input type="file" accept="image/*" data-f="photo" ${m.cabinetId ? 'disabled' : ''}></label>
                        ${branchById(m.branchId) ? `<span class="t62-branch-tag">${esc(branchById(m.branchId).name)}</span>` : ''}
                    </div>
                    <div class="t62-officer-main">
                        <div class="t62-row">
                            <input type="text" data-f="role" value="${esc(m.role)}" placeholder="직책 (예: 육군참모총장)" class="t62-role" ${m.cabinetId ? 'disabled' : ''}>
                            <button type="button" class="t62-x" data-act="del" title="빼기">✕</button>
                        </div>
                        <input type="text" data-f="name" value="${esc(m.name)}" placeholder="이름" ${m.cabinetId ? 'disabled' : ''}>
                        <div class="t62-row t62-field"><span>소속</span><select data-f="branchId">${branchOpts(m.branchId)}</select></div>
                        <div class="t62-row t62-field"><span>정당</span><select data-f="partyId" ${m.cabinetId ? 'disabled' : ''}>${partyOpts(m.partyId)}</select></div>
                        ${m.cabinetId && cabinetById(m.cabinetId) ? `
                        <div class="t62-row t62-linked">🔗 내각(${esc(cabinetById(m.cabinetId).position || '직책 없음')})과 연결됨 — 직책 · 이름 · 사진 · 당적 자동 반영
                            <button type="button" class="t62-x" data-act="unlinkCab">연결 해제</button></div>`
                        : `<div class="t62-row t62-field"><span>내각</span><select data-f="cabinetId">${cabinetOpts()}</select></div>`}
                        <div class="t62-row t62-loyal"><span>충성도</span><input type="range" min="0" max="100" step="5" data-f="loyalty" value="${Number(m.loyalty) || 0}"><b>${Number(m.loyalty) || 0}</b></div>
                    </div>
                </div>`).join('')}
            <button class="add-btn" data-act="add">[+] 군 지휘관 추가</button>
            ${T.military.length ? '' : '<button class="add-btn" data-act="seed">[+] 기본 군 지휘부 만들기 (국방부 장관 · 합참의장 · 육해공군 참모총장)</button>'}`;
        box.querySelector('[data-act="add"]').onclick = () => { T.military.push({ id: uid(), role: '장성', name: '', photo: '', partyId: '', loyalty: 60, branchId: '' }); renderMilitary(); };
        // 군 소속 · 색
        const det = box.querySelector('.t62-branches');
        det.ontoggle = () => { ui.branchesOpen = det.open; };
        det.querySelectorAll('.t62-branch-row').forEach(row => {
            const b = branchById(row.dataset.bid);
            row.querySelector('[data-bf="color"]').oninput = e => { b.color = e.target.value; box.querySelectorAll('.t62-officer').forEach(c => { const m = T.military.find(x => x.id === c.dataset.id); if (m) c.style.setProperty('--t62-branch', officerColor(m)); }); };
            row.querySelector('[data-bf="name"]').onchange = e => { b.name = e.target.value.trim(); renderMilitary(); };
            row.querySelector('[data-bact="del"]').onclick = () => {
                T.branches = T.branches.filter(x => x !== b);
                T.military.forEach(m => { if (m.branchId === b.id) m.branchId = ''; });
                renderMilitary();
            };
        });
        det.querySelector('[data-bact="add"]').onclick = () => { T.branches.push({ id: uid(), name: '', color: '#888888' }); renderMilitary(); };
        det.querySelector('[data-bact="reset"]').onclick = () => showCustomConfirm('군 소속을 기본값(국방부 · 합동참모본부 · 육군 · 해군 · 공군 · 해병대 · 특수부대)으로 되돌립니다. 직접 더한 소속은 빠지고, 지휘관 소속은 직책 이름으로 다시 짐작합니다. 계속하시겠습니까?', () => {
            T.branches = defaultBranches();
            T.military.forEach(m => { m.branchId = guessBranch(m.role); });
            renderMilitary();
        });
        const seed = box.querySelector('[data-act="seed"]');
        // 기본 직책 이름은 화면 언어로 (세이브에 든 이름은 번역하지 않으므로 만들 때 바꿔 둔다)
        const tr = k => (window.DnoLang && typeof DnoLang.t === 'function' ? DnoLang.t(k) : k);
        if (seed) seed.onclick = () => {
            // 내각에 국방 장관 자리가 있으면 기본 지휘부의 국방부 장관을 그 자리와 바로 연결
            const defense = cabinetList().find(c => /국방/.test(c.position || ''));
            DEFAULT_ROSTER.forEach(([role, loyalty, branchId]) => T.military.push({ id: uid(), role: tr(role), name: '', photo: '', partyId: '', loyalty, branchId: branchById(branchId) ? branchId : '',
                cabinetId: branchId === 'mnd' && defense ? defense.id : '' }));
            renderMilitary();
        };
        box.querySelectorAll('.t62-officer').forEach(card => {
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
            <div class="t62-junta">
                <div class="t62-junta-title">⚔ 군정 — 군사평의회 집권 중</div>
                <div class="t62-dim">의장 ${esc(T.junta.chairRole || '')} <b>${esc(T.junta.chairName)}</b>${T.junta.since ? ` · ${esc(T.junta.since)}부터` : ''} · 대통령 · 총리 겸임, 비상 권한 독점, 의회 정지 · 선거 중단</div>
                <div class="t62-sub">군정에서 벗어나기</div>
                <div class="t62-row t62-wrap">
                    <button type="button" class="t62-btn" data-act="transfer">민정 이양</button>
                    <button type="button" class="t62-btn" data-act="counter">역쿠데타 준비</button>
                    <button type="button" class="t62-btn" onclick="switchSubTab('cabinet','revolution')">혁명 →</button>
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
            ${T.junta ? '<div class="t62-sub">역쿠데타</div>' : `
            <div class="t62-intro">주도 세력을 고르면 성공 확률을 요인별로 보여 줍니다. 성공하면 계엄령이 선포되고 의회가 멈추며, 실패하면 주도 세력이 처벌받습니다.</div>
            <div class="system-radio-group">${typeBtn('military', '군부')}${typeBtn('party', '정당')}${typeBtn('self', `${effRoleLabel('president')} (친위)`)}</div>`}
            <div class="t62-pick">
                ${type === 'military' || type === 'counter' ? (officers.length ? `
                    <label class="t62-dim">주도할 군 지휘관</label>
                    <select data-pick="leader">${officers.map(m => `<option value="${esc(m.id)}" ${m.id === ui.leaderId ? 'selected' : ''}>${branchById(m.branchId) ? `[${esc(branchById(m.branchId).name)}] ` : ''}${esc(m.role)} ${esc(m.name || '(이름 없음)')} · 충성도 ${m.loyalty}</option>`).join('')}</select>`
                    : '<div class="t62-dim">군 지휘부가 없습니다 — 내각 › 군부에서 먼저 정하세요.</div>') : ''}
                ${type === 'party' ? `
                    <label class="t62-dim">주도할 정당</label>
                    <select data-pick="party">${activeParties.map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(ui.partyId) ? 'selected' : ''}>${esc(p.name)} · 지지율 ${support(p.id)}%${isGovParty(p) ? ' · 여당' : ''}</option>`).join('')}</select>` : ''}
                ${type === 'self' ? `<div class="t62-dim">주도: ${esc(effRoleLabel('president'))} ${esc(president.name || '(공석)')}${partyById(president.partyId) ? ` · ${esc(partyById(president.partyId).name)}` : ''} — 의회를 멈추고 반대 정당을 막습니다</div>` : ''}
            </div>
            <div class="t62-chance">
                <div class="t62-chance-head"><span>성공 확률</span><b>${chance}%</b></div>
                <div class="t62-bar"><span style="width:${chance}%"></span></div>
                ${factors.map(x => `<div class="t62-factor"><span>${esc(x.label)}</span><span class="${x.v >= 0 ? 't62-plus' : 't62-minus'}">${x.v >= 0 ? '+' : ''}${x.v}%p</span></div>`).join('')}
                <div class="t62-dim t62-small">합계는 5~95% 사이로 맞춥니다.</div>
            </div>
            <button type="button" class="t62-go" data-act="go">⚔ ${T.junta ? '역쿠데타' : TYPE_LABEL[type]} 일으키기</button>
            ${last ? resultCard(last) : ''}
            ${T.log.length ? `<details class="t62-log"><summary>쿠데타 기록 (${T.log.length})</summary>${T.log.map(logRow).join('')}</details>` : ''}`;
        box.querySelectorAll('[data-type]').forEach(b => { b.onclick = () => { ui.type = b.dataset.type; ui.lastId = null; renderCoup(); }; });
        const ls = box.querySelector('[data-pick="leader"]'); if (ls) ls.onchange = () => { ui.leaderId = ls.value; renderCoup(); };
        const ps = box.querySelector('[data-pick="party"]'); if (ps) ps.onchange = () => { ui.partyId = ps.value; renderCoup(); };
        box.querySelector('[data-act="go"]').onclick = attempt;
        const tr = box.querySelector('[data-act="transfer"]'); if (tr) tr.onclick = transferToCivilians;
        const ct = box.querySelector('[data-act="counter"]'); if (ct) ct.onclick = () => { box.querySelector('[data-act="go"]').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
    }
    const typeName = t => ({ military: '군부 쿠데타', party: '정당 쿠데타', self: '친위 쿠데타', counter: '역쿠데타', transfer: '민정 이양' }[t] || t);
    function resultCard(x) {
        return `<div class="t62-result ${x.success ? 'ok' : 'fail'}">
            <div class="t62-result-head">${x.type === 'transfer' ? '🕊 민정 이양' : x.success ? '✔ 성공' : '✘ 실패'} — ${esc(typeName(x.type))}${x.chance != null ? ` <span class="t62-dim">(확률 ${x.chance}%)</span>` : ''}</div>
            <div class="t62-dim">주도: ${esc(x.leader)}${x.date ? ` · ${esc(x.date)}` : ''}</div>
            <ul>${(x.effects || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
        </div>`;
    }
    function logRow(x) {
        return `<div class="t62-log-row"><span class="${x.type === 'transfer' ? '' : x.success ? 't62-plus' : 't62-minus'}">${x.type === 'transfer' ? '🕊' : x.success ? '✔' : '✘'}</span>
            <span>${esc(typeName(x.type))} · ${esc(x.leader)}${x.date ? ` · ${esc(x.date)}` : ''}${x.chance != null ? ` · ${x.chance}%` : ''}</span></div>`;
    }

    // 1.6.3 티저가 쓰는 창구
    window.T62 = {
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
        .t62-intro { color: #777; font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .t62-row { display: flex; align-items: center; gap: 6px; }
        .t62-wrap { flex-wrap: wrap; }
        .t62-summary { justify-content: space-between; color: #aaa; font-size: .85rem; margin-bottom: 8px; }
        .t62-tag { font-size: .72rem; color: var(--tno-alert); border: 1px solid var(--tno-alert); padding: 1px 6px; }
        .t62-officer { display: flex; gap: 10px; align-items: flex-start; border-left-color: var(--t62-branch, #6b7d4a) !important; }
        .t62-officer .photo-ph { color: var(--t62-branch, #6b7d4a); }
        .t62-photo-col { display: flex; flex-direction: column; align-items: stretch; gap: 4px; flex-shrink: 0; width: 52px; }
        .t62-branch-tag { font-size: .68rem; text-align: center; padding: 1px 2px; color: #fff; background: var(--t62-branch, #6b7d4a); word-break: keep-all; overflow-wrap: anywhere; line-height: 1.3; }
        .t62-field span { color: #777; font-size: .78rem; flex-shrink: 0; width: 2.6em; }
        .t62-field select { flex: 1; min-width: 0; }
        .t62-linked { color: #6cf; font-size: .72rem; flex-wrap: wrap; }
        .t62-linked .t62-x { font-size: .7rem; padding: 1px 6px; }
        .t62-branches { border: 1px solid #2a2a2a; padding: 6px 10px; margin: 0 0 10px; }
        .t62-branches summary { cursor: pointer; color: #aaa; font-size: .85rem; }
        .t62-branches .add-btn { margin-top: 6px; }
        .t62-branch-row { margin: 5px 0; }
        .t62-branch-row input[type=color] { width: 34px; height: 28px; padding: 0; border: 1px solid #333; background: transparent; flex-shrink: 0; cursor: pointer; }
        .t62-branch-row input[type=text] { flex: 1; min-width: 0; }
        .t62-officer.t62-chair { border-left-color: var(--tno-alert) !important; box-shadow: 0 0 8px color-mix(in srgb, var(--tno-alert) 35%, transparent); }
        .t62-photo { width: 52px; height: 64px; flex-shrink: 0; }
        .t62-photo img { width: 100%; height: 100%; object-fit: cover; }
        .t62-officer-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .t62-officer-main input[type=text], .t62-officer-main select { width: 100%; box-sizing: border-box; }
        .t62-role { flex: 1; min-width: 0; font-weight: bold; }
        .t62-x { cursor: pointer; background: transparent; border: 1px solid #333; color: #777; font-family: inherit; padding: 2px 8px; }
        .t62-loyal span { color: #777; font-size: .78rem; flex-shrink: 0; }
        .t62-loyal input { flex: 1; }
        .t62-loyal b { width: 2.2em; text-align: right; font-size: .85rem; }
        .t62-pick { margin: 10px 0; display: flex; flex-direction: column; gap: 5px; }
        .t62-pick select { width: 100%; box-sizing: border-box; }
        .t62-dim { color: #777; font-size: .8rem; }
        .t62-small { font-size: .72rem; margin-top: 4px; }
        .t62-chance { border: 1px solid #333; padding: 10px; margin: 10px 0; background: rgba(255,255,255,.02); }
        .t62-chance-head { display: flex; justify-content: space-between; align-items: baseline; color: #aaa; }
        .t62-chance-head b { font-size: 1.6rem; color: var(--tno-alert); }
        .t62-bar { height: 8px; background: #222; margin: 6px 0 8px; }
        .t62-bar span { display: block; height: 100%; background: var(--tno-alert); }
        .t62-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: #999; padding: 2px 0; }
        .t62-plus { color: #5fbf7f; } .t62-minus { color: #e06060; }
        .t62-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 10px; background: transparent; border: 2px solid var(--tno-alert); color: var(--tno-alert); letter-spacing: 1px; }
        .t62-go:hover { background: color-mix(in srgb, var(--tno-alert) 15%, transparent); }
        .t62-result { margin-top: 12px; padding: 10px; border: 1px solid #333; border-left: 4px solid #888; }
        .t62-result.ok { border-left-color: #5fbf7f; } .t62-result.fail { border-left-color: #e06060; }
        .t62-result-head { font-size: 1rem; margin-bottom: 4px; }
        .t62-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .82rem; color: #bbb; }
        .t62-log { margin-top: 12px; font-size: .82rem; } .t62-log summary { cursor: pointer; color: #999; }
        .t62-log-row { display: flex; gap: 6px; padding: 3px 0; color: #aaa; border-bottom: 1px solid #1c1c1c; }
        .t62-junta { border: 1px solid var(--tno-alert); padding: 10px; margin: 8px 0 12px; background: rgba(60,0,0,.25); }
        .t62-junta-title { color: var(--tno-alert); font-size: 1rem; margin-bottom: 4px; letter-spacing: 1px; }
        .t62-sub { color: #888; font-size: .78rem; margin: 10px 0 6px; letter-spacing: 1px; }
        .t62-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 6px 12px; background: transparent; border: 1px solid #555; color: #ccc; }
        .t62-btn:disabled { opacity: .4; cursor: default; }
        .t62-banner { margin: 0 0 10px; padding: 8px 12px; border: 1px solid var(--tno-alert); color: var(--tno-alert); font-size: .9rem; background: rgba(60,0,0,.3); letter-spacing: 1px; }
        html[data-theme-family="modern"] .t62-branches { border-color: var(--m-border); border-radius: 10px; }
        html[data-theme-family="modern"] .t62-branch-tag { border-radius: 4px; }
        html[data-theme-family="modern"] .t62-intro, html[data-theme-family="modern"] .t62-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .t62-summary { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t62-chance { border: 1px solid var(--m-border); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .t62-chance-head { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t62-bar { background: var(--m-border); border-radius: 4px; overflow: hidden; }
        html[data-theme-family="modern"] .t62-factor { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t62-go { border-radius: 12px; font-weight: 600; letter-spacing: 0; }
        html[data-theme-family="modern"] .t62-result { border: 1px solid var(--m-border); border-left-width: 4px; border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .t62-result ul { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t62-junta, html[data-theme-family="modern"] .t62-banner { border-radius: 12px; background: color-mix(in srgb, var(--tno-alert) 8%, var(--m-surface)); }
        html[data-theme-family="modern"] .t62-btn, html[data-theme-family="modern"] .t62-x { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text); }
        html[data-theme-family="modern"] .t62-log-row { color: var(--m-text-2); border-bottom-color: var(--m-border); }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
