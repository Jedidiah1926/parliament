// ===== 1.6.3 — Vive la Révolution! "Vive la France!" (혁명 · 당-국가 체제 · 선거인단) =====
// 1.6.3 미리보기(예전 teaser63)에서 본 게임으로 옮겨 왔다 — 본 게임 · 모든 미리보기 화면에서 돈다.
// main.html은 js/coup.js 다음에 이 파일을 읽는다 (군정은 window.HemiCoup로 다룬다).
//
//   - 내각 › 혁명: 민중이 주체 — 주도 이념(민주 · 공산주의)과 혁명 정당을 고르면 성공 확률을 요인별로 보여 준다
//     (정부 불신 · 군정/당-국가/계엄 · 활동 금지 정당 · 혁명 정당 지지율 · 그 정당이 앞서는 지역의 인구 · 군의 충성)
//       공산주의 혁명 성공 → 숨겨진 정부 형태 "당-국가 체제": 혁명 정당 일당 집권, 다른 정당은 활동 금지 또는 우당(통일전선),
//         총서기 겸 국가주석 · 총리, 의회는 최고인민회의(의석은 혁명 정당 85% · 우당이 나머지 → 거의 만장일치), 선거는 단일 후보 찬반 투표
//       민주 혁명 성공 → 군정 · 당-국가 체제 · 계엄 붕괴, 막혔던 정당 복권, 새 헌법(법령 › 헌법), 새 총선 안내
//       혁명 연합(1.6.7): 여러 정당이 함께 일으키면 연합 정당의 지지율 · 지역도 성공 확률에 더한다. 공산주의 혁명이 성공하면
//         "당-국가 체제"(연합 정당은 우당) 또는 "평의회 체제"(연합 정당끼리 경쟁 선거로 정권이 바뀜, 연합 밖 정당은 활동 금지)를 고른다
//       둘 다: 혁명 뒤 국호 · 국기를 바꿀 수 있다 / 실패: 혁명 정당 활동 금지 · 지지율 절반, 정부가 계엄령 선포
//   - 선거인단 시스템 (선거 › 선거 제도에서 선거인단제를 고르면): 선거인 단위(권역 · 지역구), 선거인 수(인구 비례 · 의석 수 + 가산 · 직접 입력),
//     승자독식 · 비례 배분, 과반 기준과 과반 미달 시(의회 결정 · 최다 득표), 신의 없는 선거인(%), 결과 지도
/* global getAppState, setAppState, switchSubTab, parties, coalitions, president, pm, elecStore, emergencyPowers, seatKeyFor,
   chamberList, chamberDisplayName, renderEmergencyPowers, applyMartialLawEffects, simulate, refreshUI, showCustomAlert,
   showCustomConfirm, escapeHtmlText, formatNationDate, effRoleLabel, elecRun, elecRunByElection, regions, districtRegionMap,
   districtGrid, districtSeatCounts, districtPopulation, districtNames, districtTendencyFor, candidateUnionOf, nationFlag,
   renderNationConfig, updateNationIdBar, legisGetState, legisSetState, renderDistrictSvgInto, tendencyColorForPct,
   presElectionMode, ideologyName, findIdeology */
(function () {
    'use strict';

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const HemiCoup = () => window.HemiCoup || null;
    const isInd = p => p && p.ideologyId === 9999;
    const activeParty = p => p && p.status !== 'banned' && p.status !== 'dissolved' && !isInd(p);
    // 혁명은 활동 금지 · 해산된 정당도 일으킬 수 있다 (지하에서) — 성공하면 복권 · 재건
    const canRevolt = p => p && !isInd(p);
    const underground = p => p && (p.status === 'banned' || p.status === 'dissolved');
    const pname = p => (p ? (p.status === 'dissolved' ? (p._nameBeforeDissolution || p.name) : p.name) : '');
    const stateTag = p => (p.status === 'dissolved' ? (" " + i18n('sim.revolution.1')) : p.status === 'banned' ? (" " + i18n('sim.revolution.2')) : '');
    // 활동 금지 · 해산된 혁명 정당을 되살린다 (해산이면 원래 이름 · 약칭도 — main.js updatePartyStatus)
    function revive(p) {
        if (!underground(p)) return false;
        const i = parties.indexOf(p);
        if (typeof updatePartyStatus === 'function' && i >= 0) updatePartyStatus(i, 'active'); else p.status = 'active';
        S.revBanned = (S.revBanned || []).filter(id => String(id) !== String(p.id));
        return true;
    }
    const support = pid => Math.max(0, Number(elecStore?.house?.[pid]?.prob) || 0);
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    const DEFAULT_POP = 100000;

    // ---- 상태 (세이브의 revolution 칸 — 1.6.3 미리보기 세이브는 teaser63 칸) ----
    //   partyState: null | { partyId, mode:'vanguard'|'council', allies:[pid], bloc:[pid], banned:[pid], prevNames:{house,senate,third}, since }
    //     mode 'vanguard' = 당-국가 체제(일당 + 우당), 'council' = 평의회 체제(혁명 연합 bloc이 경쟁 선거) — 예전 세이브엔 mode가 없음(= vanguard)
    //   revBanned: [pid] — 혁명 뒤 활동 금지된 정당 (민주 혁명 때 복권)
    //   log: [{ id, at, date, kind, party, chance, success, effects }]
    //   ec: 선거인단 설정
    let S = fresh();
    function fresh() {
        return { partyState: null, revBanned: [], log: [],
            ec: { unit: 'region', electors: 'pop', total: 538, bonus: 2, manual: {}, alloc: 'wta', noMajority: 'parliament', faithless: 0 } };
    }
    let ui = { kind: 'democratic', partyId: '', allies: {}, coalition: {}, regime: 'vanguard', newName: '', newFlag: '', lastId: null };
    const isCouncil = () => !!(S.partyState && S.partyState.mode === 'council');
    // 혁명 연합 — 주도 정당과 함께 일으키는 정당 (고른 것 중 아직 활동 중인 정당만)
    function coalitionOf(leadId) {
        return Object.keys(ui.coalition).filter(id => ui.coalition[id] && String(id) !== String(leadId) && canRevolt(partyById(id))).map(partyById);
    }
    const namesOf = list => list.map(pname).join(' · ');

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.revolution = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && (state.revolution || state.teaser63);
        const base = fresh();
        S = { ...base, ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        S.ec = { ...base.ec, ...(S.ec || {}) };
        if (!Array.isArray(S.log)) S.log = [];
        if (!Array.isArray(S.revBanned)) S.revBanned = [];
        refresh();
        return r;
    };

    // ================= 혁명 =================
    function houseKeys() { return Object.keys(districtGrid.house || {}).filter(k => districtGrid.house[k]); }
    const popOf = k => Number(districtPopulation?.house?.[k]) || DEFAULT_POP;
    // 혁명 정당 · 연합(없으면 정부 · 여당이 아닌 정당 전체)이 성향 1위인 지역의 인구 비율 — "여론 · 인구와 연계"
    function popShareLed(partyIds) {
        const keys = houseKeys();
        if (!keys.length || typeof districtTendencyFor !== 'function') return null;
        let led = 0, all = 0;
        keys.forEach(k => {
            const pop = popOf(k); all += pop;
            const v = districtTendencyFor(k, 'house').values || {};
            const ranked = parties.filter(activeParty).map(p => [p, Number(v[p.id]) || 0]).sort((a, b) => b[1] - a[1]);
            if (!ranked.length || ranked[0][1] <= 0) return;
            const top = ranked[0][0];
            if (partyIds ? partyIds.some(id => String(top.id) === String(id)) : !isGovParty(top)) led += pop;
        });
        return all ? led / all : null;
    }
    function revChance(kind, partyId, partners) {
        partners = partners || [];
        const f = [];
        const add = (label, v) => f.push({ label, v: Math.round(v) });
        const coupApi = HemiCoup();
        const junta = coupApi && coupApi.junta;
        const martial = emergencyPowers?.martialLaw?.active;
        add(i18n('sim.revolution.3'), 10);
        if (junta) add(i18n('sim.revolution.4'), 20);
        else if (S.partyState && kind === 'democratic') add(isCouncil() ? i18n('sim.revolution.5') : i18n('sim.revolution.6'), 15);
        else {
            const gov = Math.min(100, parties.filter(isGovParty).reduce((a, p) => a + support(p.id), 0));
            add(i18n('sim.revolution.7', { gov: Math.round(gov) }), (100 - gov) * 0.3);
        }
        if (martial && !junta) add(i18n('sim.core.46'), 10);
        const bannedN = parties.filter(p => p.status === 'banned').length;
        if (bannedN) add(i18n('sim.revolution.8', { bannedN }), Math.min(20, bannedN * 4));
        const p = partyById(partyId);
        if (p) add(i18n('sim.revolution.9', { pname: pname(p), support: support(p.id) }), support(p.id) * 0.4);
        else if (kind === 'communist') add(i18n('sim.revolution.10'), -30);
        // 혁명 연합 — 함께 일으키는 정당의 지지율은 주도 정당보다 조금 덜 친다
        if (partners.length) {
            const s = partners.reduce((a, x) => a + support(x.id), 0);
            add(i18n('sim.revolution.11', { partners: namesOf(partners), s: Math.round(s * 10) / 10 }), s * 0.3);
        }
        const bloc = [p, ...partners].filter(Boolean);
        const share = popShareLed(bloc.length ? bloc.map(x => x.id) : null);
        const who = bloc.length > 1 ? i18n('sim.revolution.12') : p ? pname(p) + i18n('sim.revolution.13') : bloc.length ? pname(bloc[0]) + i18n('sim.revolution.13') : i18n('sim.revolution.14');
        if (share != null) add(i18n('sim.revolution.15', { who, share: Math.round(share * 100) }), share * 20);
        if (coupApi && coupApi.military && coupApi.military.length) {
            const loyal = coupApi.military.reduce((a, m) => a + (Number(m.loyalty) || 0), 0) / coupApi.military.length;
            add(i18n('sim.revolution.16', { loyal: Math.round(loyal) }), -(loyal - 50) * 0.4);
        }
        return { factors: f, chance: clamp(Math.round(f.reduce((a, x) => a + x.v, 0)), 5, 90) };
    }

    function liftMartialLaw() {
        emergencyPowers.martialLaw.active = false;
        emergencyPowers.martialLaw.suspendParliament = false;
        if (typeof renderEmergencyPowers === 'function') renderEmergencyPowers();
        if (typeof applyMartialLawEffects === 'function') applyMartialLawEffects();
    }
    function chamberNameInput(ch) { return document.getElementById(ch + 'NameInput'); }
    function setChamberName(ch, name) {
        const inp = chamberNameInput(ch);
        if (!inp) return;
        inp.value = name;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
    function applyNationIdentity() {
        if (ui.newName.trim()) { const inp = document.getElementById('nationNameInput'); if (inp) { inp.value = ui.newName.trim(); } }
        if (ui.newFlag) window.nationFlag = ui.newFlag; // main.js 전역 let — 같은 이름으로 바꾼다
        try { if (ui.newFlag) nationFlag = ui.newFlag; } catch (e) { /* 이름 접근 불가 */ } // eslint-disable-line no-global-assign
        try { renderNationConfig(); updateNationIdBar(); } catch (e) { /* 화면 준비 전 */ }
    }
    const nationName = () => document.getElementById('nationNameInput')?.value?.trim() || '';
    function setConstitution(c) {
        if (typeof legisGetState !== 'function') return;
        const cur = legisGetState();
        const prev = cur.constitution;
        const revisions = prev ? [...(prev.revisions || []), { date: formatNationDate(), note: i18n('sim.revolution.17', { title: prev.title, title2: c.title }) }] : [];
        legisSetState({ ...cur, constitution: { ...c, revisions } });
    }
    function democraticConstitution() {
        const nm = nationName();
        return { title: i18n('sim.revolution.18', { nm: nm ? nm + ' ' : '' }),
            preamble: i18n('sim.revolution.19'),
            articles: [
                { title: i18n('sim.revolution.20'), text: i18n('sim.revolution.21') },
                { title: i18n('sim.revolution.22'), text: i18n('sim.revolution.23') },
                { title: i18n('sim.revolution.24'), text: i18n('sim.revolution.25') },
                { title: i18n('sim.mainContentHelp.4'), text: i18n('sim.revolution.26') },
                { title: i18n('sim.revolution.27'), text: i18n('sim.revolution.28') },
                { title: i18n('sim.revolution.29'), text: i18n('sim.revolution.30') },
            ] };
    }
    function partyStateConstitution(p) {
        const nm = nationName();
        return { title: i18n('sim.revolution.31', { nm: nm ? nm + ' ' : '' }),
            preamble: i18n('sim.revolution.33', { nm: nm || i18n('sim.revolution.32'), name: p.name }),
            articles: [
                { title: i18n('sim.revolution.34'), text: i18n('sim.revolution.35', { nm: nm || i18n('sim.mainContentHelp.5') }) },
                { title: i18n('sim.revolution.36'), text: i18n('sim.revolution.37', { name: p.name }) },
                { title: i18n('sim.revolution.38'), text: i18n('sim.revolution.39') },
                { title: i18n('sim.revolution.40'), text: i18n('sim.revolution.41') },
                { title: i18n('sim.revolution.42'), text: i18n('sim.revolution.43') },
                { title: i18n('sim.mainContentHelp.4'), text: i18n('sim.revolution.44') },
            ] };
    }
    function councilConstitution(p, partners) {
        const nm = nationName();
        const names = namesOf([p, ...partners]);
        return { title: i18n('sim.revolution.45', { nm: nm ? nm + ' ' : '' }),
            preamble: i18n('sim.revolution.46', { nm: nm || i18n('sim.revolution.32'), names }),
            articles: [
                { title: i18n('sim.revolution.34'), text: i18n('sim.revolution.47', { nm: nm || i18n('sim.mainContentHelp.5') }) },
                { title: i18n('sim.revolution.48'), text: i18n('sim.revolution.49', { names }) },
                { title: i18n('sim.revolution.50'), text: i18n('sim.revolution.51') },
                { title: i18n('sim.revolution.52'), text: i18n('sim.revolution.53') },
                { title: i18n('sim.revolution.54'), text: i18n('sim.revolution.55') },
            ] };
    }
    // 평의회 체제의 의석: 혁명 연합 정당끼리 지지율 비율로 나눔 (원마다 총 의석은 그대로)
    function councilSeats(bloc) {
        const list = bloc.map(partyById).filter(Boolean);
        if (!list.length) return;
        chamberList().forEach(ch => {
            const key = seatKeyFor(ch);
            const total = parties.reduce((a, x) => a + (x[key] || 0), 0);
            if (!total) return;
            parties.forEach(x => { x[key] = 0; });
            const n = largestRemainder(list.map(x => Math.max(1, support(x.id))), total);
            list.forEach((x, i) => { x[key] = n[i]; (x.factions || []).forEach(f => { f[key] = 0; }); });
        });
    }
    // 당-국가 체제의 의석: 혁명 정당 85% · 우당이 지지율 비율로 나머지 (원마다 총 의석은 그대로)
    function partyStateSeats(p, allies) {
        chamberList().forEach(ch => {
            const key = seatKeyFor(ch);
            const total = parties.reduce((a, x) => a + (x[key] || 0), 0);
            if (!total) return;
            const allyList = allies.map(partyById).filter(Boolean);
            const allyTotal = allyList.length ? Math.round(total * 0.15) : 0;
            parties.forEach(x => { x[key] = 0; });
            p[key] = total - allyTotal;
            const w = allyList.map(a => Math.max(1, support(a.id)));
            const sw = w.reduce((a, b) => a + b, 0) || 1;
            let given = 0;
            allyList.forEach((a, i) => { const n = i === allyList.length - 1 ? allyTotal - given : Math.round(allyTotal * w[i] / sw); a[key] = n; given += n; });
            (p.factions || []).forEach(f => { f[key] = 0; });
        });
    }
    function endPartyState() {
        if (!S.partyState) return;
        const prev = S.partyState.prevNames || {};
        Object.keys(prev).forEach(ch => { if (prev[ch] != null) setChamberName(ch, prev[ch]); });
        S.partyState = null;
    }
    function restoreRevBanned() {
        (S.revBanned || []).forEach(id => { const p = partyById(id); if (p && p.status === 'banned') p.status = 'active'; });
        S.revBanned = [];
    }

    function revolt() {
        const kind = ui.kind;
        const p = partyById(ui.partyId);
        const partners = coalitionOf(ui.partyId);
        if (kind === 'communist' && !canRevolt(p)) { showCustomAlert(i18n('sim.revolution.56')); return; }
        if (kind === 'communist' && S.partyState) { showCustomAlert(isCouncil() ? i18n('sim.revolution.57') : i18n('sim.revolution.58')); return; }
        const { chance } = revChance(kind, ui.partyId, partners);
        const label = kind === 'communist' ? i18n('sim.revolution.59') : i18n('sim.revolution.60');
        const who = [p ? i18n('sim.revolution.61', { pname: pname(p) }) : '', partners.length ? i18n('sim.revolution.62', { partners: namesOf(partners) }) : ''].filter(Boolean).join(' · ');
        showCustomConfirm(i18n('sim.revolution.63', { label, who: who ? ` — ${who}` : '', chance }), () => {
            const success = Math.random() * 100 < chance;
            const effects = success ? (kind === 'communist' ? communistWin(p, partners) : democraticWin(p, partners)) : revFail(p, partners);
            const entry = { id: uid(), at: Date.now(), date: formatNationDate(), kind, party: namesOf([p, ...partners].filter(Boolean)), chance, success, effects };
            S.log.unshift(entry);
            ui.lastId = entry.id;
            ui.newName = ''; ui.newFlag = ''; ui.coalition = {};
            try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
            if (HemiCoup()) HemiCoup().refresh();
            refresh();
        });
    }
    function communistWin(p, partners) {
        partners = partners || [];
        const fx = [];
        const coupApi = HemiCoup();
        if (coupApi && coupApi.junta) { coupApi.endJunta('revolution'); fx.push(i18n('sim.revolution.64')); }
        liftMartialLaw();
        const revived = [p, ...partners].filter(revive);
        if (revived.length) fx.push(i18n('sim.revolution.65', { revived: namesOf(revived) }));
        // 평의회 체제는 혁명 연합이 있어야 — 연합 정당은 bloc으로 남아 경쟁, 당-국가 체제면 연합 정당은 우당이 된다
        const council = ui.regime === 'council' && partners.length > 0;
        const bloc = council ? [String(p.id), ...partners.map(x => String(x.id))] : [];
        const allies = council ? [] : [...new Set([
            ...Object.keys(ui.allies).filter(id => ui.allies[id] && String(id) !== String(p.id) && activeParty(partyById(id))),
            ...partners.map(x => String(x.id)),
        ])];
        const banned = [];
        parties.forEach(x => {
            if (x === p || allies.includes(String(x.id)) || bloc.includes(String(x.id)) || isInd(x) || x.status === 'banned' || x.status === 'dissolved') return;
            x.status = 'banned'; banned.push(x.id);
        });
        S.revBanned = [...new Set([...(S.revBanned || []), ...banned])];
        parties.forEach(x => { x.isRuling = x === p; });
        coalitions.forEach(c => { c.isRuling = false; });
        const prevNames = {};
        chamberList().forEach(ch => { prevNames[ch] = chamberNameInput(ch)?.value ?? null; });
        S.partyState = { partyId: p.id, mode: council ? 'council' : 'vanguard', allies, bloc, banned, prevNames, since: formatNationDate() };
        applyNationIdentity();
        if (council) {
            setChamberName('house', i18n('sim.revolution.50'));
            councilSeats(bloc);
            const leader = p.leaderName || i18n('sim.revolution.66', { name: p.name });
            Object.assign(president, { name: leader, photo: p.leaderPhoto || '', partyId: p.id, linkedSeat: null });
            setConstitution(councilConstitution(p, partners));
            fx.push(i18n('sim.revolution.67', { partners: namesOf([p, ...partners]) }), i18n('sim.revolution.68', { leader, name: p.name }),
                i18n('sim.revolution.69', { banned: banned.length }), i18n('sim.revolution.70'),
                i18n('sim.revolution.71'));
            if (ui.newName.trim()) fx.push(i18n('sim.revolution.72', { trim: ui.newName.trim() }));
            if (ui.newFlag) fx.push(i18n('sim.revolution.73'));
            return fx;
        }
        setChamberName('house', i18n('sim.revolution.74'));
        partyStateSeats(p, allies);
        const leader = p.leaderName || i18n('sim.revolution.75', { name: p.name });
        Object.assign(president, { name: leader, photo: p.leaderPhoto || '', partyId: p.id, linkedSeat: null });
        setConstitution(partyStateConstitution(p));
        if (partners.length) fx.push(i18n('sim.revolution.76', { partners: namesOf(partners) }));
        fx.push(i18n('sim.revolution.77', { name: p.name }), i18n('sim.revolution.78', { leader }),
            allies.length ? i18n('sim.revolution.79', { allies: allies.length, banned: banned.length }) : i18n('sim.revolution.80', { banned: banned.length }),
            i18n('sim.revolution.81'), i18n('sim.revolution.82'));
        if (ui.newName.trim()) fx.push(i18n('sim.revolution.72', { trim: ui.newName.trim() }));
        if (ui.newFlag) fx.push(i18n('sim.revolution.73'));
        return fx;
    }
    function democraticWin(p, partners) {
        partners = partners || [];
        const fx = [];
        const revived = [p, ...partners].filter(revive);
        if (revived.length) fx.push(i18n('sim.revolution.65', { revived: namesOf(revived) }));
        const coupApi = HemiCoup();
        if (coupApi && coupApi.junta) { coupApi.endJunta('revolution'); fx.push(i18n('sim.revolution.64')); }
        if (S.partyState) { const was = isCouncil() ? i18n('sim.revolution.83') : i18n('sim.revolution.84'); endPartyState(); fx.push(i18n('sim.revolution.85', { was })); }
        if (emergencyPowers?.martialLaw?.active) { liftMartialLaw(); fx.push(i18n('sim.revolution.86')); }
        const bannedBefore = parties.filter(x => x.status === 'banned').length;
        restoreRevBanned();
        if (coupApi) coupApi.restoreBanned();
        const restored = bannedBefore - parties.filter(x => x.status === 'banned').length;
        if (restored > 0) fx.push(i18n('sim.revolution.87', { restored }));
        Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null });
        Object.assign(pm, { name: '', photo: '', partyId: null, linkedSeat: null });
        parties.forEach(x => { x.isRuling = false; });
        coalitions.forEach(c => { c.isRuling = false; });
        applyNationIdentity();
        setConstitution(democraticConstitution());
        fx.push(i18n('sim.revolution.88'), i18n('sim.revolution.89'), i18n('sim.revolution.90'));
        if (p) fx.push(i18n('sim.revolution.91', { name: p.name })), cutSupport(p.id, 1.2);
        if (partners.length) { fx.push(i18n('sim.revolution.92', { partners: namesOf(partners) })); partners.forEach(x => cutSupport(x.id, 1.1)); }
        if (ui.newName.trim()) fx.push(i18n('sim.revolution.72', { trim: ui.newName.trim() }));
        if (ui.newFlag) fx.push(i18n('sim.revolution.73'));
        return fx;
    }
    function cutSupport(pid, factor) {
        chamberList().forEach(ch => { const st = elecStore?.[ch]?.[pid]; if (st) st.prob = Math.round(Math.min(100, (Number(st.prob) || 0) * factor) * 10) / 10; });
    }
    function revFail(p, partners) {
        partners = partners || [];
        const fx = [];
        // 해산된 정당은 해산된 채로 (활동 금지로 바꾸면 "*해산됨*" 이름이 남는다)
        if (p) {
            const was = p.status;
            if (was !== 'dissolved') p.status = 'banned';
            cutSupport(p.id, 0.5);
            fx.push(was === 'dissolved' ? i18n('sim.revolution.93', { pname: pname(p) }) : i18n('sim.revolution.94', { pname: pname(p) }));
        }
        if (partners.length) {
            partners.forEach(x => { if (x.status !== 'dissolved') x.status = 'banned'; cutSupport(x.id, 0.7); });
            fx.push(i18n('sim.revolution.95', { partners: namesOf(partners) }));
        }
        if (!(HemiCoup() && HemiCoup().junta) && !S.partyState && !emergencyPowers?.martialLaw?.active) {
            emergencyPowers.martialLaw.holder = 'president';
            emergencyPowers.martialLaw.suspendParliament = false;
            emergencyPowers.martialLaw.active = true;
            if (typeof renderEmergencyPowers === 'function') renderEmergencyPowers();
            if (typeof applyMartialLawEffects === 'function') applyMartialLawEffects();
            fx.push(i18n('sim.revolution.96'));
        } else fx.push(i18n('sim.revolution.97'));
        return fx;
    }
    // 당-국가 체제의 선거: 단일 후보 찬반 투표 (의석은 그대로 다시 나눔)
    function yesNoElection() {
        if (!S.partyState || isCouncil()) return;
        const p = partyById(S.partyState.partyId);
        const turnout = 99 + Math.random() * 0.9;
        const yes = 97 + Math.random() * 2.9;
        partyStateSeats(p, S.partyState.allies || []);
        S.log.unshift({ id: uid(), at: Date.now(), date: formatNationDate(), kind: 'yesno', party: p ? p.name : '', chance: null, success: true,
            effects: [i18n('sim.revolution.98'), i18n('sim.revolution.99', { turnout: turnout.toFixed(2), yes: yes.toFixed(2) }), i18n('sim.revolution.100')] });
        ui.lastId = S.log[0].id;
        try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
        refresh();
    }

    // 디버그 모드: 혁명 없이 바로 당-국가 체제 (설정 › 기타 설정 › 숨겨진 정부 형태 보이기, js/devmode.js)
    function debugPartyState() {
        if (S.partyState) { showCustomAlert(i18n('sim.revolution.101')); return; }
        const cands = parties.filter(activeParty);
        const p = cands.find(x => String(x.id) === String(ui.partyId)) || cands.slice().sort((a, b) => support(b.id) - support(a.id))[0];
        if (!p) { showCustomAlert(i18n('sim.revolution.102')); return; }
        showCustomConfirm(i18n('sim.revolution.103', { name: p.name }), () => {
            ui.partyId = p.id;
            const regime = ui.regime; ui.regime = 'vanguard';
            const effects = [i18n('sim.revolution.104'), ...communistWin(p, [])];
            ui.regime = regime;
            const entry = { id: uid(), at: Date.now(), date: formatNationDate(), kind: 'communist', party: p.name, chance: null, success: true, effects };
            S.log.unshift(entry);
            ui.lastId = entry.id;
            ui.newName = ''; ui.newFlag = '';
            try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
            if (HemiCoup()) HemiCoup().refresh();
            refresh();
        });
    }
    if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.register({ id: 'partyState', label: i18n('sim.revolution.84'), version: '1.6.3', isActive: () => !!S.partyState, enter: debugPartyState });

    // 당-국가 체제: 직책 이름 · 선거
    const origRole = window.effRoleLabel;
    window.effRoleLabel = function (key) {
        if (S.partyState && key === 'president') return isCouncil() ? i18n('sim.revolution.52') : i18n('sim.revolution.42');
        return origRole.apply(this, arguments);
    };
    const blockIfPartyState = fn => function () {
        // 평의회 체제는 혁명 연합 정당끼리 경쟁 선거 (연합 밖 정당은 활동 금지라 선거에서 빠진다)
        if (S.partyState && !isCouncil()) { showCustomAlert(i18n('sim.revolution.105')); return; }
        return fn.apply(this, arguments);
    };
    ['elecRun', 'elecRunByElection'].forEach(n => { if (typeof window[n] === 'function') window[n] = blockIfPartyState(window[n]); });

    // ================= 선거인단 =================
    // 선거인 단위 — 권역(기준 원의 권역, 권역에 안 든 지역구는 따로 한 단위) 또는 지역구
    function ecUnits(ch) {
        const keys = Object.keys(districtGrid[ch] || {}).filter(k => districtGrid[ch][k]);
        const name = k => districtNames?.[ch]?.[k] || districtNames?.house?.[k] || k;
        if (S.ec.unit === 'region' && (regions[ch] || []).length) {
            const units = (regions[ch] || []).map(r => ({ id: 'r:' + r.id, name: r.name, keys: keys.filter(k => String(districtRegionMap[ch]?.[k]) === String(r.id)) })).filter(u => u.keys.length);
            const inR = new Set(units.flatMap(u => u.keys));
            keys.filter(k => !inR.has(k)).forEach(k => units.push({ id: 'd:' + k, name: name(k), keys: [k] }));
            return units;
        }
        return keys.map(k => ({ id: 'd:' + k, name: name(k), keys: [k] }));
    }
    function largestRemainder(weights, total) {
        const sum = weights.reduce((a, b) => a + b, 0);
        if (!sum || total <= 0) return weights.map(() => 0);
        const raw = weights.map(w => w / sum * total);
        const out = raw.map(Math.floor);
        let left = total - out.reduce((a, b) => a + b, 0);
        raw.map((r, i) => [r - out[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
        return out;
    }
    function ecElectorCounts(ch, units) {
        const e = S.ec;
        if (e.electors === 'manual') return units.map(u => Math.max(0, Math.round(Number(e.manual[u.id]) || 3)));
        if (e.electors === 'seats') return units.map(u => u.keys.reduce((a, k) => a + (districtSeatCounts[k]?.[ch] || 0), 0) + Math.max(0, Number(e.bonus) || 0));
        // 인구 비례: 총 선거인 수를 인구로 나누되 단위마다 최소 1명
        const total = Math.max(units.length, Math.round(Number(e.total) || 538));
        const pops = units.map(u => u.keys.reduce((a, k) => a + popOf(k), 0));
        const base = units.map(() => 1);
        const extra = largestRemainder(pops, total - units.length);
        return base.map((b, i) => b + extra[i]);
    }
    function ecResult(candidates, ch) {
        const units = ecUnits(ch);
        if (!units.length) return null;
        const counts = ecElectorCounts(ch, units);
        const cid = pid => {
            const u = typeof candidateUnionOf === 'function' ? candidateUnionOf(pid, 'pres') : null;
            if (u) { const c = candidates.find(c => u.partyIds.some(id => String(id) === String(c.id))); if (c) return c.id; }
            return pid;
        };
        const ids = candidates.map(c => c.id);
        const popTotals = Object.fromEntries(ids.map(id => [id, 0]));
        const electors = Object.fromEntries(ids.map(id => [id, 0]));
        const unitRows = units.map((u, ui) => {
            const votes = Object.fromEntries(ids.map(id => [id, 0]));
            u.keys.forEach(k => {
                const t = typeof districtTendencyFor === 'function' ? districtTendencyFor(k, ch).values : {};
                const has = Object.values(t || {}).some(v => Number(v) > 0);
                parties.forEach(p => {
                    const c = cid(p.id);
                    if (!ids.includes(c)) return;
                    const base = has ? (Number(t[p.id]) || 0) : (Number(elecStore?.[ch]?.[p.id]?.prob) || 0);
                    if (base <= 0) return;
                    votes[c] += Math.max(0, base + (Math.random() * 10 - 5)) * popOf(k);
                });
            });
            const vsum = Object.values(votes).reduce((a, b) => a + b, 0) || 1;
            ids.forEach(id => { popTotals[id] += votes[id]; });
            const n = counts[ui];
            let alloc;
            if (S.ec.alloc === 'prop') alloc = largestRemainder(ids.map(id => votes[id]), n);
            else { const win = ids.slice().sort((a, b) => votes[b] - votes[a])[0]; alloc = ids.map(id => (id === win ? n : 0)); }
            // 신의 없는 선거인: 선거인마다 확률만큼 다른 후보에게
            let faithless = 0;
            const fp = clamp(Number(S.ec.faithless) || 0, 0, 100) / 100;
            if (fp > 0 && ids.length > 1) {
                const moved = ids.map(() => 0);
                alloc.forEach((cnt, i) => { for (let j = 0; j < cnt; j++) if (Math.random() < fp) { moved[i]--; let to = Math.floor(Math.random() * (ids.length - 1)); if (to >= i) to++; moved[to]++; faithless++; } });
                alloc = alloc.map((c, i) => c + moved[i]);
            }
            ids.forEach((id, i) => { electors[id] += alloc[i]; });
            const winner = ids.slice().sort((a, b) => votes[b] - votes[a])[0];
            return { id: u.id, name: u.name, keys: u.keys, electors: n, alloc: Object.fromEntries(ids.map((id, i) => [id, alloc[i]])), share: votes[winner] / vsum * 100, winner, faithless };
        });
        const totalE = counts.reduce((a, b) => a + b, 0);
        const need = Math.floor(totalE / 2) + 1;
        const popSum = Object.values(popTotals).reduce((a, b) => a + b, 0) || 1;
        const round1 = ids.map(id => ({ partyId: id, electors: electors[id], pct: totalE ? electors[id] / totalE * 100 : 0, popPct: popTotals[id] / popSum * 100 })).sort((a, b) => b.electors - a.electors);
        let winnerPartyId = round1[0] ? round1[0].partyId : null, contingent = null;
        if (round1[0] && round1[0].electors < need) {
            if (S.ec.noMajority === 'parliament') {
                // 과반 미달 — 의회가 상위 3명 중에서 정한다 (기준 원 의석이 가장 많은 쪽, 단일화면 참여 정당 의석 합)
                const key = seatKeyFor(ch);
                const seatsFor = id => { const u = typeof candidateUnionOf === 'function' ? candidateUnionOf(id, 'pres') : null; const members = u ? u.partyIds : [id]; return members.reduce((a, m) => a + (partyById(m)?.[key] || 0), 0); };
                const top3 = round1.slice(0, 3);
                const pick = top3.slice().sort((a, b) => seatsFor(b.partyId) - seatsFor(a.partyId))[0];
                winnerPartyId = pick.partyId;
                contingent = { how: 'parliament', top3: top3.map(x => ({ partyId: x.partyId, seats: seatsFor(x.partyId) })) };
            } else contingent = { how: 'plurality' };
        }
        return { round1, winnerPartyId, units: unitRows, totalE, need, contingent, chamber: ch, unitMode: S.ec.unit };
    }
    let lastEC = null;
    const origRounds = window.computeElectionRounds;
    window.computeElectionRounds = function (mode, chamberBasis, candidates) {
        if (mode === 'electoral') {
            const r = ecResult(candidates, chamberBasis);
            if (r) { lastEC = r; return { round1: r.round1, round2: null, winnerPartyId: r.winnerPartyId }; }
        }
        return origRounds.apply(this, arguments);
    };
    function ecDetailsHtml(r) {
        const name = id => { const p = partyById(id); return p ? p.name : '?'; };
        const color = id => partyById(id)?.color || '#888';
        const winner = r.round1.find(x => x.partyId === r.winnerPartyId);
        const faithless = r.units.reduce((a, u) => a + u.faithless, 0);
        return `
            <div class="rev-ec">
                <div class="rev-ec-head">${esc(i18n('sim.revolution.ecHead', { total: r.totalE, need: r.need }))} ${S.ec.alloc === 'prop' ? esc(i18n('sim.revolution.109')) : esc(i18n('sim.revolution.110'))}${faithless ? esc((" " + i18n('sim.revolution.111', { faithless }))) : ''}</div>
                <div class="rev-ec-bar">${r.round1.filter(x => x.electors > 0).map(x => `<span style="width:${x.pct}%;background:${color(x.partyId)}" title="${esc(name(x.partyId))} ${esc(i18n('sim.revolution.electorsTip', { count: x.electors }))}"></span>`).join('')}<i style="left:${r.need / r.totalE * 100}%"></i></div>
                ${r.round1.map(x => `<div class="rev-ec-row"><span><span class="rev-dot" style="background:${color(x.partyId)}"></span>${esc(name(x.partyId))}</span><span>${esc(i18n('sim.revolution.112'))} <b>${x.electors}</b> ${esc(i18n('sim.revolution.113'))} ${x.popPct.toFixed(1)}%</span></div>`).join('')}
                ${r.contingent ? `<div class="rev-ec-note">${esc(i18n('sim.revolution.ecShort', { need: r.need }))} ${r.contingent.how === 'parliament'
                    ? `${esc(i18n('sim.revolution.116'))} ${r.contingent.top3.length}${esc(i18n('sim.revolution.117'))}${esc(chamberDisplayName(r.chamber))} ${esc(i18n('sim.history.13'))} ${r.contingent.top3.map(x => i18n('sim.revolution.118', { partyId: esc(name(x.partyId)), seats: x.seats })).join(' · ')}) → <b>${esc(name(r.winnerPartyId))}</b>`
                    : `${esc(i18n('sim.revolution.119'))} <b>${esc(name(r.winnerPartyId))}</b> ${esc(i18n('sim.revolution.120'))}`}</div>` : (winner ? `<div class="rev-ec-note">${esc(name(winner.partyId))} ${esc(i18n('sim.revolution.121'))}${winner.electors}${esc(i18n('sim.revolution.122'))}</div>` : '')}
                <div class="rev-ec-map" data-ec-map></div>
                <details class="rev-ec-units"><summary>${r.unitMode === 'region' ? esc(i18n('sim.mainContentNation.3')) : esc(i18n('sim.contentTerritory.1'))}${esc(i18n('sim.revolution.123'))}${r.units.length})</summary>
                    ${r.units.map(u => `<div class="rev-ec-unit" style="border-left-color:${color(u.winner)}"><b>${esc(u.name)}</b> <span class="rev-dim">${esc(i18n('sim.revolution.112'))} ${u.electors}${esc(i18n('sim.revolution.124'))}</span>
                        <div class="rev-dim">${Object.entries(u.alloc).filter(([, n]) => n > 0).map(([id, n]) => `${esc(name(id))} ${n}`).join(' · ')}${u.faithless ? esc((" " + i18n('sim.revolution.125', { faithless: u.faithless }))) : ''}</div></div>`).join('')}
                </details>
            </div>`;
    }
    function appendEcDetails(panelId, result) {
        const panel = document.getElementById(panelId);
        if (!panel || !result || result.mode !== 'electoral' || !lastEC || lastEC.round1 !== result.round1) return;
        const wrap = document.createElement('div');
        wrap.innerHTML = ecDetailsHtml(lastEC);
        const firstBtn = panel.querySelector('button');
        panel.insertBefore(wrap.firstElementChild, firstBtn || null);
        const mapEl = panel.querySelector('[data-ec-map]');
        if (mapEl && typeof renderDistrictSvgInto === 'function') {
            const byKey = {};
            lastEC.units.forEach(u => u.keys.forEach(k => { byKey[k] = u; }));
            mapEl.style.aspectRatio = '3 / 2';
            renderDistrictSvgInto(mapEl, {
                chamber: lastEC.chamber, zoomKey: 'coup:ec:' + panelId,
                getFill: k => { const u = byKey[k]; const p = u && partyById(u.winner); return p ? tendencyColorForPct(p.color, 45 + Math.min(55, u.share * 0.55)) : 'transparent'; },
                title: k => { const u = byKey[k]; return u ? i18n('sim.revolution.126', { name: u.name, electors: u.electors, name2: Object.entries(u.alloc).filter(([, n]) => n > 0).map(([id, n]) => `${partyById(id)?.name || '?'} ${n}`).join(' · ') }) : k; },
                groupOf: lastEC.unitMode === 'region' ? k => byKey[k]?.id ?? null : undefined,
            });
        }
    }
    const origPres = window.renderPresElecResultPanel;
    window.renderPresElecResultPanel = function () { const r = origPres.apply(this, arguments); appendEcDetails('presElecResultPanel', window.presElectionLastResult || safeGet(() => presElectionLastResult)); return r; };
    const origPm = window.renderPmElecResultPanel;
    if (origPm) window.renderPmElecResultPanel = function () { const r = origPm.apply(this, arguments); appendEcDetails('pmElecResultPanel', safeGet(() => pmElectionLastResult)); return r; };
    function safeGet(fn) { try { return fn(); } catch (e) { return null; } }

    // 선거인단 설정 칸 — 선거 › 선거 제도의 선거 방식 버튼 아래 (선거인단제일 때만)
    function renderEcPanel() {
        let box = document.getElementById('revEcPanel');
        const hint = document.getElementById('presElecModeHint');
        if (!hint) return;
        if (!box) { box = document.createElement('div'); box.id = 'revEcPanel'; hint.parentElement.insertBefore(box, hint.nextSibling); }
        const mode = safeGet(() => presElectionMode);
        box.style.display = mode === 'electoral' ? '' : 'none';
        if (mode !== 'electoral') return;
        const e = S.ec;
        const ch = safeGet(() => window.presElectionChamberBasis) || safeGet(() => presElectionChamberBasis) || 'house';
        const units = ecUnits(ch);
        const counts = ecElectorCounts(ch, units);
        const totalE = counts.reduce((a, b) => a + b, 0);
        const radio = (field, v, t) => `<button type="button" class="system-radio-btn ${e[field] === v ? 'active' : ''}" data-f="${field}" data-v="${v}">${t}</button>`;
        box.innerHTML = `
            <div class="rev-ecset">
                <div class="rev-ecset-title">${esc(i18n('sim.revolution.127'))} <span class="rev-dim">— ${units.length}${esc(i18n('sim.revolution.128'))} ${totalE}${esc(i18n('sim.revolution.107'))} ${Math.floor(totalE / 2) + 1}${esc(i18n('sim.revolution.124'))}</span></div>
                <label class="rev-dim">${esc(i18n('sim.revolution.129'))}</label>
                <div class="system-radio-group">${radio('unit', 'region', esc(i18n('sim.revolution.130')))}${radio('unit', 'district', esc(i18n('sim.revolution.131')))}</div>
                ${e.unit === 'region' && !(regions[ch] || []).length ? `<div class="rev-dim rev-small">${esc(i18n('sim.revolution.132'))}</div>` : ''}
                <label class="rev-dim">${esc(i18n('sim.revolution.133'))}</label>
                <div class="system-radio-group">${radio('electors', 'pop', esc(i18n('sim.revolution.134')))}${radio('electors', 'seats', esc(i18n('sim.revolution.135')))}${radio('electors', 'manual', esc(i18n('sim.revolution.136')))}</div>
                ${e.electors === 'pop' ? `<div class="rev-row"><span class="rev-dim">${esc(i18n('sim.revolution.137'))}</span><input type="number" min="1" data-n="total" value="${e.total}"></div><div class="rev-dim rev-small">${esc(i18n('sim.revolution.138'))} ${DEFAULT_POP.toLocaleString()}${esc(i18n('sim.revolution.139'))}</div>` : ''}
                ${e.electors === 'seats' ? `<div class="rev-row"><span class="rev-dim">${esc(i18n('sim.revolution.140'))}</span><input type="number" min="0" data-n="bonus" value="${e.bonus}"></div><div class="rev-dim rev-small">${esc(i18n('sim.revolution.141'))} ${esc(chamberDisplayName(ch))} ${esc(i18n('sim.revolution.142'))}</div>` : ''}
                ${e.electors === 'manual' ? `<details class="rev-manual" open><summary class="rev-dim">${esc(i18n('sim.revolution.143'))}</summary>${units.map((u, i) => `<div class="rev-row"><span>${esc(u.name)}</span><input type="number" min="0" data-u="${esc(u.id)}" value="${counts[i]}"></div>`).join('')}</details>` : ''}
                <label class="rev-dim">${esc(i18n('sim.revolution.144'))}</label>
                <div class="system-radio-group">${radio('alloc', 'wta', esc(i18n('sim.revolution.110')))}${radio('alloc', 'prop', esc(i18n('sim.revolution.109')))}</div>
                <label class="rev-dim">${esc(i18n('sim.revolution.145'))}</label>
                <div class="system-radio-group">${radio('noMajority', 'parliament', esc(i18n('sim.revolution.146')))}${radio('noMajority', 'plurality', esc(i18n('sim.revolution.147')))}</div>
                <div class="rev-row"><span class="rev-dim">${esc(i18n('sim.revolution.148'))}</span><input type="number" min="0" max="100" step="0.5" data-n="faithless" value="${e.faithless}"><span class="rev-dim">%</span></div>
            </div>`;
        box.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => { S.ec[b.dataset.f] = b.dataset.v; renderEcPanel(); }; });
        box.querySelectorAll('[data-n]').forEach(i => { i.onchange = () => { S.ec[i.dataset.n] = Number(i.value) || 0; renderEcPanel(); }; });
        box.querySelectorAll('[data-u]').forEach(i => { i.onchange = () => { S.ec.manual[i.dataset.u] = Math.max(0, Number(i.value) || 0); renderEcPanel(); }; });
    }
    ['setPresElectionMode', 'setPresElectionChamberBasis'].forEach(n => {
        const o = window[n];
        if (typeof o === 'function') window[n] = function () { const r = o.apply(this, arguments); renderEcPanel(); return r; };
    });

    // ================= 화면: 내각 › 혁명 =================
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTabs() {
        const cab = document.getElementById('mainContentCabinet');
        const bar = cab && cab.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const after = document.getElementById('subTabCoup');
        const btn = el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','revolution')" id="subTabRevolution">${esc(i18n('sim.revolution.149'))}</button>`);
        if (after && after.nextSibling) bar.insertBefore(btn, after.nextSibling); else bar.appendChild(btn);
        cab.appendChild(el(`<div id="contentRevolution" class="sub-tab-content"></div>`));
    })();
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'cabinet' && sub === 'revolution') renderRevolution();
        if (main === 'vote' && sub === 'elecSettings') renderEcPanel();
        return r;
    };
    const origCab = window.renderCabinetDisplay;
    window.renderCabinetDisplay = function () {
        const r = origCab.apply(this, arguments);
        const grid = document.getElementById('cabinetDisplayGrid');
        if (grid) {
            let b = document.getElementById('revPartyStateBanner');
            const p = S.partyState && partyById(S.partyState.partyId);
            if (p) {
                if (!b) { b = el('<div id="revPartyStateBanner" class="rev-banner"></div>'); grid.parentElement.insertBefore(b, grid); }
                b.innerHTML = isCouncil()
                    ? `${esc(i18n('sim.revolution.150'))} ${esc(namesOf((S.partyState.bloc || []).map(partyById).filter(Boolean)))} ${esc(i18n('sim.revolution.151'))} <b>${esc(president.name || '')}</b>${S.partyState.since ? esc((" " + i18n('sim.revolution.152', { since: esc(S.partyState.since) }))) : ''}`
                    : `${esc(i18n('sim.revolution.153'))} ${esc(p.name)} ${esc(i18n('sim.revolution.154'))} <b>${esc(president.name || '')}</b>${S.partyState.since ? esc((" " + i18n('sim.revolution.152', { since: esc(S.partyState.since) }))) : ''}`;
            } else if (b) b.remove();
        }
        return r;
    };

    const kindName = k => ({ democratic: i18n('sim.revolution.60'), communist: i18n('sim.revolution.59'), yesno: i18n('sim.revolution.155') }[k] || k);
    function renderRevolution() {
        const box = document.getElementById('contentRevolution');
        if (!box) return;
        const coupApi = HemiCoup();
        const junta = coupApi && coupApi.junta;
        const ps = S.partyState && partyById(S.partyState.partyId);
        if (ps && ui.kind === 'communist') ui.kind = 'democratic'; // 당-국가 체제는 민주 혁명으로만 무너뜨린다
        const kind = ui.kind;
        const cands = parties.filter(canRevolt).filter(p => !(ps && p === ps));
        if (ui.partyId && !cands.some(p => String(p.id) === String(ui.partyId))) ui.partyId = '';
        if (kind === 'communist' && !ui.partyId) {
            const left = cands.filter(p => /사회|공산|혁명|노동/.test((typeof ideologyName === 'function' ? ideologyName(p.ideologyId) : '') + p.name));
            ui.partyId = (left[0] || cands.slice().sort((a, b) => support(b.id) - support(a.id))[0] || {}).id || '';
        }
        const p = partyById(ui.partyId);
        const partners = coalitionOf(ui.partyId);
        const { factors, chance } = revChance(kind, ui.partyId, partners);
        const last = S.log.find(x => x.id === ui.lastId);
        const council = isCouncil();
        const blocList = council ? (S.partyState.bloc || []).map(partyById).filter(Boolean) : [];
        const status = junta ? i18n('sim.revolution.156', { chairName: esc(junta.chairName) }) : ps ? (council ? i18n('sim.revolution.157', { blocList: esc(namesOf(blocList)) }) : i18n('sim.revolution.158', { name: esc(ps.name) })) : emergencyPowers?.martialLaw?.active ? i18n('sim.revolution.159') : i18n('sim.revolution.160');
        const partnerPick = cands.filter(x => x !== p);
        box.innerHTML = `
            <div class="rev-intro">${esc(i18n('sim.revolution.161'))}</div>
            <div class="rev-status">${esc(i18n('sim.revolution.162'))} <b>${status}</b></div>
            ${ps && council ? `<div class="rev-ps">
                <div class="rev-ps-title">${esc(i18n('sim.revolution.163'))}</div>
                <div class="rev-dim">${esc(i18n('sim.revolution.48'))} ${esc(namesOf(blocList))} ${esc(i18n('sim.revolution.151'))} ${esc(president.name || '')} ${esc(i18n('sim.revolution.164'))}</div>
                <div class="rev-dim rev-small">${esc(i18n('sim.revolution.165'))}</div>
            </div>` : ps ? `<div class="rev-ps">
                <div class="rev-ps-title">${esc(i18n('sim.revolution.166'))}</div>
                <div class="rev-dim">${esc(ps.name)} ${esc(i18n('sim.revolution.154'))} ${esc(president.name || '')} ${esc(i18n('sim.revolution.167'))}${(S.partyState.allies || []).length ? esc((" " + i18n('sim.revolution.168', { name: S.partyState.allies.map(id => esc(partyById(id)?.name || '?')).join(' · ') }))) : ''}</div>
                <button type="button" class="rev-btn" data-act="yesno">${esc(i18n('sim.revolution.169'))}</button>
                <div class="rev-dim rev-small">${esc(i18n('sim.revolution.170'))}</div>
            </div>` : ''}
            <label class="rev-dim">${esc(i18n('sim.revolution.171'))}</label>
            <div class="system-radio-group">
                <button type="button" class="system-radio-btn ${kind === 'democratic' ? 'active' : ''}" data-kind="democratic">${esc(i18n('sim.revolution.60'))}</button>
                <button type="button" class="system-radio-btn ${kind === 'communist' ? 'active' : ''}" data-kind="communist" ${ps ? 'disabled' : ''}>${esc(i18n('sim.revolution.59'))}</button>
            </div>
            <label class="rev-dim">${esc(i18n('sim.revolution.172'))} ${kind === 'democratic' ? esc(i18n('sim.revolution.173')) : ''}</label>
            <select data-pick="party">
                ${kind === 'democratic' ? `<option value="">${esc(i18n('sim.revolution.174'))}</option>` : ''}
                ${cands.map(x => `<option value="${esc(x.id)}" ${String(x.id) === String(ui.partyId) ? 'selected' : ''}>${esc(pname(x) + stateTag(x))} · ${esc(typeof ideologyName === 'function' ? (ideologyName(x.ideologyId) || '') : '')} ${esc(i18n('sim.revolution.175'))} ${support(x.id)}%${isGovParty(x) ? esc((" " + i18n('sim.revolution.176'))) : ''}</option>`).join('')}
            </select>
            ${partnerPick.length ? `<details class="rev-allies rev-coalition" ${partners.length ? 'open' : ''}><summary class="rev-dim">${esc(i18n('sim.revolution.177'))}${partners.length ? esc((" " + i18n('sim.revolution.178', { partners: partners.length }))) : ''})</summary>
                ${partnerPick.map(x => `<label class="rev-row"><input type="checkbox" data-coal="${esc(x.id)}" ${ui.coalition[x.id] ? 'checked' : ''}> ${esc(pname(x) + stateTag(x))} <span class="rev-dim rev-small">${esc(i18n('sim.revolution.179'))} ${support(x.id)}%</span></label>`).join('')}
                <div class="rev-dim rev-small">${esc(i18n('sim.revolution.180'))}</div>
            </details>` : ''}
            ${kind === 'communist' && p ? `<label class="rev-dim">${esc(i18n('sim.revolution.181'))}</label>
            <div class="system-radio-group">
                <button type="button" class="system-radio-btn ${ui.regime !== 'council' ? 'active' : ''}" data-regime="vanguard">${esc(i18n('sim.revolution.182'))}</button>
                <button type="button" class="system-radio-btn ${ui.regime === 'council' ? 'active' : ''}" data-regime="council" ${partners.length ? '' : 'disabled'}>${esc(i18n('sim.revolution.183'))}</button>
            </div>
            <div class="rev-dim rev-small">${ui.regime === 'council' && partners.length ? esc(i18n('sim.revolution.184')) : partners.length ? esc(i18n('sim.revolution.185')) : esc(i18n('sim.revolution.186'))}</div>
            ${ui.regime !== 'council' || !partners.length ? `<details class="rev-allies" open><summary class="rev-dim">${esc(i18n('sim.revolution.187'))}${partners.length ? esc((" " + i18n('sim.revolution.188'))) : ''}</summary>
                ${partnerPick.filter(x => !partners.includes(x) && activeParty(x)).map(x => `<label class="rev-row"><input type="checkbox" data-ally="${esc(x.id)}" ${ui.allies[x.id] ? 'checked' : ''}> ${esc(x.name)}</label>`).join('') || `<div class="rev-dim">${esc(i18n('sim.revolution.189'))}</div>`}
            </details>` : ''}` : ''}
            <details class="rev-identity"><summary class="rev-dim">${esc(i18n('sim.revolution.191'))}</summary>
                <div class="rev-row"><input type="text" data-id="name" placeholder="${esc(i18n('sim.revolution.190'))}" value="${esc(ui.newName)}"></div>
                <div class="rev-row"><label class="leader-photo-box rev-flag" title="${esc(i18n('sim.revolution.192'))}">${ui.newFlag ? `<img src="${ui.newFlag}" alt="">` : '<span class="photo-ph">🏳️</span>'}<input type="file" accept="image/*" data-id="flag"></label>
                    ${ui.newFlag ? `<button type="button" class="rev-btn" data-act="noflag">${esc(i18n('sim.revolution.193'))}</button>` : `<span class="rev-dim rev-small">${esc(i18n('sim.revolution.194'))}</span>`}</div>
            </details>
            <div class="rev-chance">
                <div class="rev-chance-head"><span>${esc(i18n('sim.revolution.195'))}</span><b>${chance}%</b></div>
                <div class="rev-bar"><span style="width:${chance}%"></span></div>
                ${factors.map(x => `<div class="rev-factor"><span>${esc(x.label)}</span><span class="${x.v >= 0 ? 'rev-plus' : 'rev-minus'}">${x.v >= 0 ? '+' : ''}${x.v}%p</span></div>`).join('')}
                <div class="rev-dim rev-small">${esc(i18n('sim.revolution.196'))}</div>
            </div>
            <button type="button" class="rev-go" data-act="go">✊ ${kind === 'communist' ? esc(i18n('sim.revolution.59')) : esc(i18n('sim.revolution.60'))} ${esc(i18n('sim.revolution.197'))}</button>
            ${last ? `<div class="rev-result ${last.success ? 'ok' : 'fail'}">
                <div class="rev-result-head">${last.kind === 'yesno' ? esc(i18n('sim.revolution.198')) : last.success ? esc(i18n('sim.revolution.199')) : esc(i18n('sim.revolution.200'))} — ${esc(kindName(last.kind))}${last.chance != null ? ` <span class="rev-dim">${esc(i18n('sim.revolution.201'))} ${last.chance}%)</span>` : ''}</div>
                <div class="rev-dim">${last.party ? esc((i18n('sim.revolution.202', { party: esc(last.party) }) + " ")) : ''}${esc(last.date || '')}</div>
                <ul>${(last.effects || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
            ${S.log.length ? `<details class="rev-log"><summary>${esc(i18n('sim.revolution.203'))}${S.log.length})</summary>${S.log.map(x => `<div class="rev-log-row"><span class="${x.kind === 'yesno' ? '' : x.success ? 'rev-plus' : 'rev-minus'}">${x.kind === 'yesno' ? '🗳' : x.success ? '✔' : '✘'}</span><span>${esc(kindName(x.kind))}${x.party ? ` · ${esc(x.party)}` : ''}${x.date ? ` · ${esc(x.date)}` : ''}${x.chance != null ? ` · ${x.chance}%` : ''}</span></div>`).join('')}</details>` : ''}`;
        box.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { ui.kind = b.dataset.kind; ui.partyId = ''; ui.lastId = null; renderRevolution(); }; });
        const sel = box.querySelector('[data-pick="party"]'); if (sel) sel.onchange = () => { ui.partyId = sel.value; renderRevolution(); };
        box.querySelectorAll('[data-ally]').forEach(c => { c.onchange = () => { ui.allies[c.dataset.ally] = c.checked; }; });
        box.querySelectorAll('[data-coal]').forEach(c => { c.onchange = () => { ui.coalition[c.dataset.coal] = c.checked; renderRevolution(); }; });
        box.querySelectorAll('[data-regime]').forEach(b => { b.onclick = () => { ui.regime = b.dataset.regime; renderRevolution(); }; });
        const nm = box.querySelector('[data-id="name"]'); if (nm) nm.oninput = () => { ui.newName = nm.value; };
        const fl = box.querySelector('[data-id="flag"]'); if (fl) fl.onchange = () => { const f = fl.files && fl.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = ev => { ui.newFlag = ev.target.result; renderRevolution(); box.querySelector('.rev-identity').open = true; }; rd.readAsDataURL(f); };
        const nf = box.querySelector('[data-act="noflag"]'); if (nf) nf.onclick = () => { ui.newFlag = ''; renderRevolution(); };
        box.querySelector('[data-act="go"]').onclick = revolt;
        const yn = box.querySelector('[data-act="yesno"]'); if (yn) yn.onclick = yesNoElection;
    }

    function refresh() {
        renderRevolution();
        renderEcPanel();
        if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.render();
        try { window.renderCabinetDisplay && window.renderCabinetDisplay(); } catch (e) { /* 화면 준비 전 */ }
    }

    const style = document.createElement('style');
    style.textContent = `
        .rev-intro { color: #777; font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .rev-status { font-size: .85rem; color: #aaa; margin-bottom: 10px; }
        .rev-row { display: flex; align-items: center; gap: 6px; margin: 4px 0; }
        .rev-row input[type=text] { flex: 1; min-width: 0; }
        .rev-row input[type=number] { width: 6em; }
        .rev-dim { color: #777; font-size: .8rem; }
        .rev-small { font-size: .72rem; }
        #contentRevolution > label.rev-dim { display: block; margin: 10px 0 4px; }
        #contentRevolution select { width: 100%; box-sizing: border-box; }
        .rev-allies, .rev-identity, .rev-manual { margin: 8px 0; font-size: .85rem; }
        .rev-allies summary, .rev-identity summary, .rev-manual summary { cursor: pointer; }
        .rev-flag { width: 72px; height: 48px; flex-shrink: 0; }
        .rev-flag img { width: 100%; height: 100%; object-fit: cover; }
        .rev-chance { border: 1px solid #333; padding: 10px; margin: 10px 0; background: rgba(255,255,255,.02); }
        .rev-chance-head { display: flex; justify-content: space-between; align-items: baseline; color: #aaa; }
        .rev-chance-head b { font-size: 1.6rem; color: #ff6b3d; }
        .rev-bar { height: 8px; background: #222; margin: 6px 0 8px; }
        .rev-bar span { display: block; height: 100%; background: #ff6b3d; }
        .rev-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .78rem; color: #999; padding: 2px 0; }
        .rev-plus { color: #5fbf7f; } .rev-minus { color: #e06060; }
        .rev-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 10px; background: transparent; border: 2px solid #ff6b3d; color: #ff6b3d; letter-spacing: 1px; }
        .rev-btn { cursor: pointer; font-family: inherit; font-size: .85rem; padding: 6px 12px; background: transparent; border: 1px solid #555; color: #ccc; margin-top: 6px; }
        .rev-result { margin-top: 12px; padding: 10px; border: 1px solid #333; border-left: 4px solid #888; }
        .rev-result.ok { border-left-color: #5fbf7f; } .rev-result.fail { border-left-color: #e06060; }
        .rev-result-head { font-size: 1rem; margin-bottom: 4px; }
        .rev-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .82rem; color: #bbb; }
        .rev-log { margin-top: 12px; font-size: .82rem; } .rev-log summary { cursor: pointer; color: #999; }
        .rev-log-row { display: flex; gap: 6px; padding: 3px 0; color: #aaa; border-bottom: 1px solid #1c1c1c; }
        .rev-ps { border: 1px solid #c0392b; padding: 10px; margin: 0 0 12px; background: rgba(80,0,0,.2); }
        .rev-ps-title { color: #e74c3c; font-size: 1rem; margin-bottom: 4px; letter-spacing: 1px; }
        .rev-banner { margin: 0 0 10px; padding: 8px 12px; border: 1px solid #c0392b; color: #e74c3c; font-size: .9rem; background: rgba(80,0,0,.3); letter-spacing: 1px; }
        .rev-ecset { margin-top: 10px; padding: 10px; border: 1px dashed #444; }
        .rev-ecset > label.rev-dim { display: block; margin: 8px 0 4px; }
        .rev-ecset-title { color: var(--tno-neon); font-size: .9rem; }
        .rev-ec { margin: 10px 0; padding: 10px; border: 1px solid #333; }
        .rev-ec-head { color: #aaa; font-size: .82rem; margin-bottom: 6px; }
        .rev-ec-bar { position: relative; display: flex; height: 14px; background: #222; margin-bottom: 6px; }
        .rev-ec-bar span { height: 100%; }
        .rev-ec-bar i { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #fff; }
        .rev-ec-row { display: flex; justify-content: space-between; font-size: .82rem; color: #bbb; padding: 2px 0; }
        .rev-dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 6px; }
        .rev-ec-note { margin: 6px 0; font-size: .82rem; color: #ddd; }
        .rev-ec-map { width: 100%; margin: 8px 0; }
        .rev-ec-units summary { cursor: pointer; color: #999; font-size: .82rem; }
        .rev-ec-unit { border-left: 3px solid #888; padding: 3px 8px; margin: 4px 0; font-size: .82rem; color: #ccc; }
        html[data-theme-family="modern"] .rev-intro, html[data-theme-family="modern"] .rev-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .rev-status, html[data-theme-family="modern"] .rev-chance-head, html[data-theme-family="modern"] .rev-factor { color: var(--m-text-2); }
        html[data-theme-family="modern"] .rev-chance, html[data-theme-family="modern"] .rev-ec, html[data-theme-family="modern"] .rev-ecset { border: 1px solid var(--m-border); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .rev-bar, html[data-theme-family="modern"] .rev-ec-bar { background: var(--m-border); border-radius: 4px; overflow: hidden; }
        html[data-theme-family="modern"] .rev-go { border-radius: 12px; font-weight: 600; letter-spacing: 0; }
        html[data-theme-family="modern"] .rev-btn { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text); }
        html[data-theme-family="modern"] .rev-result { border: 1px solid var(--m-border); border-left-width: 4px; border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .rev-result ul, html[data-theme-family="modern"] .rev-ec-row, html[data-theme-family="modern"] .rev-ec-unit, html[data-theme-family="modern"] .rev-ec-note { color: var(--m-text-2); }
        html[data-theme-family="modern"] .rev-ps, html[data-theme-family="modern"] .rev-banner { border-radius: 12px; background: color-mix(in srgb, #c0392b 8%, var(--m-surface)); }
        html[data-theme-family="modern"] .rev-ecset-title { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .rev-log-row { color: var(--m-text-2); border-bottom-color: var(--m-border); }
    `;
    document.head.appendChild(style);
    // 튜토리얼(미리보기 과정)이 진행 상황을 읽는 창구
    window.HemiRevolution = { get log() { return S.log; }, get partyState() { return S.partyState; } };
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
