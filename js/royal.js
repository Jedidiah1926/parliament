// ===== 1.6.6 — 왕은 죽었다, 국왕 만세! "Le roi est mort, vive le roi!" (왕실 · 왕정복고 · 전제군주정) =====
// 1.6.6 미리보기(예전 teaser66)에서 본 게임으로 옮겨 왔다 — 본 게임 · 모든 미리보기 화면에서 돈다.
// main.html은 js/history.js 다음에 이 파일을 읽는다.
//
//   - 내각 › 왕실: 왕가와 왕위 주장자를 정해 둔다
//       왕가마다 이름 · 색 · 계승 규칙(남계만 · 남자 우선 · 성별 무관), 주장자마다 이름 · 칭호 · 성별 · 사진 · 지지 정당
//       주장자 순서(⋮⋮ 끌기)가 곧 출생 순 — 계승 규칙에 따라 계승 순위가 정해진다
//   - 왕정복고: 공화정에서 군주제를 되살린다
//       의회 결의 — 주장자를 지지하는 정당이 하원 과반이면 주사위 없이 입헌군주제로
//       쿠데타 — 지지 정당이 무력으로 (확률은 지지율 · 의석 · 가까운 장성 · 군의 불만 · 정부 의석) → 입헌군주제 또는 전제군주정
//   - 숨겨진 정부 형태 "전제군주정": 왕이 총리를 임명하고 거부권 · 비상 권한을 모두 쥔다 (대통령제 틀 위에 왕을 앉힘)
//     입헌군주제는 본 게임의 정부 형태(국왕은 상징적 국가원수, 실권은 총리)를 그대로 쓴다
//   - 친위 쿠데타: 입헌군주제의 왕이 의회를 누르고 전제군주정으로 / 실패하면 왕이 물러나고 다음 계승자가 즉위
//   - 입헌 개혁: 전제군주정의 왕이 실권을 내놓고 입헌군주제로 (주사위 없음)
//   - 공화 혁명: 군주제 폐지 — 고른 정부 형태(의원내각제 · 대통령제 · 이원집정부제)로, 새 공화국 헌법
//   - 계승: 왕이 서거 · 퇴위하면 계승 규칙대로 다음 계승자가 즉위 (같은 왕가에 없으면 다른 왕가에서)
//   - 계승 분쟁: 카를로스파처럼 다른 주장자가 정통 왕위를 주장 — 의회 표결(지지 정당 의석) 또는 내전(주사위)으로 결판
//   - 군주제 동안 대통령 선거는 멈추고, 국가원수 직책 이름은 군주 칭호(국왕 · 황제 · 여왕 …)가 된다
/* global getAppState, setAppState, switchSubTab, parties, coalitions, president, pm, elecStore, emergencyPowers, seatKeyFor,
   chamberList, govType, setGovType, vetoHolder, setVetoHolder, setEmergencyHolder, renderEmergencyPowers, applyMartialLawEffects,
   simulate, refreshUI, showCustomAlert, showCustomConfirm, escapeHtmlText, formatNationDate, effRoleLabel, legisGetState,
   legisSetState, startDragReorder, updatePresidentRoleLabels, updatePmRoleLabels, runPresidentialElection */
(function () {
    'use strict';

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const HemiCoup = () => window.HemiCoup || null;
    const isInd = p => p && p.ideologyId === 9999;
    const activeParty = p => p && p.status !== 'banned' && p.status !== 'dissolved' && !isInd(p);
    const support = pid => Math.max(0, Number(elecStore?.house?.[pid]?.prob) || 0);
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    function seatShare(filter) {
        const key = seatKeyFor('house');
        const total = parties.reduce((a, p) => a + (p[key] || 0), 0);
        return total ? parties.filter(filter).reduce((a, p) => a + (p[key] || 0), 0) / total : 0;
    }
    const RULES = { salic: i18n('sim.royal.1'), male: i18n('sim.royal.2'), equal: i18n('sim.royal.3') };
    const TITLES = ['국왕', '여왕', '황제', '여제', '대공', '술탄'];
    const PALETTE = ['#7a1f2b', '#1f3a7a', '#5b3a8a', '#2e6b4f', '#8a6a1f', '#444444'];
    const GOV_NAME = { parliamentary: i18n('sim.contentSystem.4'), presidential: i18n('sim.contentSystem.2'), semi: i18n('sim.contentSystem.3'), collective: i18n('sim.contentSystem.6'), monarchy: i18n('sim.contentSystem.5') };

    // ---- 상태 (세이브의 royal 칸 — 1.6.6 미리보기 세이브는 teaser66 칸) ----
    //   dynasties: [{ id, name, color, rule, claimants: [{ id, name, title, gender:'m'|'f', photo, partyIds:[pid] }] }]
    //   monarchy: null | { kind:'constitutional'|'absolute', claimantId, dynastyId, title, since,
    //                      prevGovType, prevPresident, prevVeto, prevHolders:{key:holder}, banned:[pid] }
    //   dispute: null | { rivalId, since }
    //   log: [{ id, at, date, kind, who, chance, success, effects }]
    let S = fresh();
    function fresh() { return { dynasties: [], monarchy: null, dispute: null, log: [] }; }
    let ui = { method: 'parliament', claimantId: '', kind: 'constitutional', repParty: '', repGov: 'parliamentary', rivalId: '', lastId: null };

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.royal = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && (state.royal || state.teaser66);
        S = { ...fresh(), ...(src && typeof src === 'object' ? JSON.parse(JSON.stringify(src)) : {}) };
        if (!Array.isArray(S.dynasties)) S.dynasties = [];
        if (!Array.isArray(S.log)) S.log = [];
        S.dynasties.forEach(d => { if (!Array.isArray(d.claimants)) d.claimants = []; d.claimants.forEach(c => { if (!Array.isArray(c.partyIds)) c.partyIds = []; }); });
        refresh();
        return r;
    };

    // ---- 주장자 · 계승 ----
    const allClaimants = () => S.dynasties.flatMap(d => d.claimants.map(c => ({ c, d })));
    const findClaimant = id => allClaimants().find(x => x.c.id === id) || null;
    const claimantLabel = x => x ? `${x.c.name || i18n('sim.core.7')}${x.c.title ? ` (${x.c.title})` : ''} · ${x.d.name || i18n('sim.royal.4')}` : '';
    // 계승 순위 — 왕가 안 순서(출생 순)를 계승 규칙대로 거른다
    function lineOf(d, excludeId) {
        const list = d.claimants.filter(c => c.id !== excludeId);
        if (d.rule === 'salic') return list.filter(c => c.gender !== 'f');
        if (d.rule === 'male') return [...list.filter(c => c.gender !== 'f'), ...list.filter(c => c.gender === 'f')];
        return list;
    }
    // 주장자를 미는 힘 — 지지 정당의 하원 의석 비율 · 지지율
    const backers = c => (c.partyIds || []).map(partyById).filter(activeParty);
    const backingSeats = c => seatShare(p => backers(c).includes(p));
    const backingSupport = c => backers(c).reduce((a, p) => a + support(p.id), 0);
    const strength = c => backingSeats(c) * 100 + backingSupport(c) * 0.5;
    const monarchX = () => S.monarchy ? findClaimant(S.monarchy.claimantId) : null;
    const militaryLoyalty = () => { const m = HemiCoup() && HemiCoup().military; return m && m.length ? m.reduce((a, x) => a + (Number(x.loyalty) || 0), 0) / m.length : null; };

    // ---- 정부 형태 바꾸기 ----
    function rerenderGov() {
        ['updatePresidentRoleLabels', 'updatePmRoleLabels', 'renderPresidentSection', 'renderPmSection', 'renderCabinetDisplay', 'renderEmergencyPowers'].forEach(fn => { try { window[fn] && window[fn](); } catch (e) { /* 화면 준비 전 */ } });
        try { simulate(); refreshUI(); } catch (e) { /* 화면 준비 전 */ }
    }
    function seatMonarch(x) {
        Object.assign(president, { name: x.c.name || '', photo: x.c.photo || '', partyId: null, linkedSeat: null });
        S.monarchy.claimantId = x.c.id;
        S.monarchy.dynastyId = x.d.id;
        if (x.c.gender === 'f' && S.monarchy.title === '국왕') S.monarchy.title = '여왕';
        if (x.c.gender !== 'f' && S.monarchy.title === '여왕') S.monarchy.title = '국왕';
    }
    function setHolders(holder) { Object.keys(emergencyPowers).forEach(k => { try { setEmergencyHolder(k, holder); } catch (e) { emergencyPowers[k].holder = holder; } }); }
    function declareMartialLaw() {
        if (HemiCoup()) { HemiCoup().declareMartialLaw(); return; }
        emergencyPowers.martialLaw.holder = 'president'; emergencyPowers.martialLaw.suspendParliament = true; emergencyPowers.martialLaw.active = true;
        try { renderEmergencyPowers(); applyMartialLawEffects(); } catch (e) { /* 화면 준비 전 */ }
    }
    function liftMartialLaw() {
        emergencyPowers.martialLaw.active = false; emergencyPowers.martialLaw.suspendParliament = false;
        try { renderEmergencyPowers(); applyMartialLawEffects(); } catch (e) { /* 화면 준비 전 */ }
    }
    // 전제군주정: 대통령제 틀 위에 왕을 앉힌다 — 왕이 총리 임명 · 거부권 · 비상 권한
    function makeAbsolute() {
        S.monarchy.kind = 'absolute';
        setGovType('presidential');
        try { setVetoHolder('president'); } catch (e) { /* 없음 */ }
        setHolders('president');
    }
    function makeConstitutional() {
        S.monarchy.kind = 'constitutional';
        setGovType('monarchy');
        try { setVetoHolder('none'); } catch (e) { /* 없음 */ }
    }
    function startMonarchy(x, kind) {
        const coupApi = HemiCoup();
        const fx = [];
        if (coupApi && coupApi.junta) { coupApi.endJunta('revolution'); fx.push(i18n('sim.royal.5')); }
        S.monarchy = { kind, title: x.c.gender === 'f' ? i18n('sim.royal.6') : i18n('sim.core.3'), since: formatNationDate(), prevGovType: govType,
            prevPresident: { name: president.name || '', photo: president.photo || '', partyId: president.partyId ?? null },
            prevVeto: typeof vetoHolder !== 'undefined' ? vetoHolder : 'none',
            prevHolders: Object.fromEntries(Object.keys(emergencyPowers).map(k => [k, emergencyPowers[k].holder])), banned: [], prevNation: nationName() };
        const kn = kingdomName(nationName());
        if (kn && kn !== nationName()) { setNationName(kn); fx.push(i18n('sim.royal.7', { prevNation: S.monarchy.prevNation, kn })); }
        seatMonarch(x);
        if (kind === 'absolute') makeAbsolute(); else makeConstitutional();
        S.dispute = null;
        return fx;
    }
    function endMonarchy(gov) {
        const prev = S.monarchy;
        S.monarchy = null; S.dispute = null;
        // 국호 — 왕정 전의 공화국 이름이 있으면 되돌리고, 없으면 "○○ 공화국"
        const rep = prev && prev.prevNation && !/(왕국|제국|대공국|공국)$/.test(prev.prevNation) ? prev.prevNation : (nationRoot(nationName()) ? i18n('sim.royal.8', { nationName: nationRoot(nationName()) }) : '');
        if (rep && rep !== nationName()) setNationName(rep);
        setGovType(gov || (prev && prev.prevGovType && prev.prevGovType !== 'monarchy' ? prev.prevGovType : 'parliamentary'));
        Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null });
        if (prev) {
            try { setVetoHolder(prev.prevVeto && prev.prevVeto !== 'president' ? prev.prevVeto : 'none'); } catch (e) { /* 없음 */ }
            (prev.banned || []).forEach(id => { const p = partyById(id); if (p && p.status === 'banned') p.status = 'active'; });
        }
        liftMartialLaw();
    }
    function setConstitution(c) {
        if (typeof legisGetState !== 'function') return;
        const cur = legisGetState();
        const prev = cur.constitution;
        const revisions = prev ? [...(prev.revisions || []), { date: formatNationDate(), note: i18n('sim.royal.9', { title: prev.title, title2: c.title }) }] : [];
        legisSetState({ ...cur, constitution: { ...c, revisions } });
    }
    const nationName = () => document.getElementById('nationNameInput')?.value?.trim() || '';
    function setNationName(nm) {
        const inp = document.getElementById('nationNameInput');
        if (!inp || !nm) return;
        inp.value = nm;
        try { updateNationIdBar(); } catch (e) { /* 화면 준비 전 */ }
    }
    // 나라 이름에서 공화국 꼬리를 떼어 낸 뿌리 (독일연방공화국 → 독일) — 왕정복고 · 공화 혁명 때 국호를 바꾸는 데 씀
    const nationRoot = nm => (nm || '').replace(/\s*(연방|인민|민주|사회주의|자유|민주주의)*\s*공화국$/, '').replace(/\s*(왕국|제국|대공국|공국)$/, '').trim() || nm || '';
    const kingdomName = nm => nm && /(왕국|제국|대공국|공국)$/.test(nm) ? nm : (nationRoot(nm) ? i18n('sim.royal.10', { nm: nationRoot(nm) }) : '');
    function monarchyConstitution(x, kind) {
        const nm = nationName(), house = x.d.name || i18n('sim.royal.4');
        return kind === 'absolute' ? { title: i18n('sim.royal.11', { nm: nm ? nm + ' ' : '' }),
            preamble: i18n('sim.royal.12', { house }),
            articles: [
                { title: i18n('sim.royal.13'), text: i18n('sim.royal.14', { nm: nm || i18n('sim.mainContentHelp.5'), house }) },
                { title: i18n('sim.royal.15'), text: i18n('sim.royal.16') },
                { title: i18n('sim.mainContentHelp.2'), text: i18n('sim.royal.17') },
                { title: i18n('sim.royal.18'), text: i18n('sim.royal.19') },
                { title: i18n('sim.royal.20'), text: i18n('sim.royal.22', { rule: RULES[x.d.rule] || i18n('sim.royal.21'), house }) },
            ] } : { title: i18n('sim.royal.23', { nm: nm ? nm + ' ' : '' }),
            preamble: i18n('sim.royal.25', { nm: nm || i18n('sim.royal.24'), house }),
            articles: [
                { title: i18n('sim.royal.26'), text: i18n('sim.royal.27', { nm: nm || i18n('sim.mainContentHelp.5') }) },
                { title: i18n('sim.royal.28'), text: i18n('sim.royal.29') },
                { title: i18n('sim.contentSystem.9'), text: i18n('sim.royal.30') },
                { title: i18n('sim.royal.20'), text: i18n('sim.royal.22', { rule: RULES[x.d.rule] || i18n('sim.royal.21'), house }) },
            ] };
    }
    function republicConstitution(gov) {
        const nm = nationName();
        return { title: i18n('sim.royal.23', { nm: nm ? nm + ' ' : '' }),
            preamble: i18n('sim.royal.31'),
            articles: [
                { title: i18n('sim.royal.26'), text: i18n('sim.royal.32', { nm: nm || i18n('sim.mainContentHelp.5') }) },
                { title: i18n('sim.royal.28'), text: i18n('sim.royal.29') },
                { title: i18n('sim.royal.33'), text: i18n('sim.royal.34') },
                { title: i18n('sim.contentSystem.1'), text: i18n('sim.royal.36', { gov: GOV_NAME[gov] || i18n('sim.royal.35') }) },
                { title: i18n('sim.mainContentHelp.4'), text: i18n('sim.royal.37') },
            ] };
    }
    function cutSupport(pid, factor) {
        if (HemiCoup()) { HemiCoup().cutSupport(pid, factor); return; }
        chamberList().forEach(ch => { const st = elecStore?.[ch]?.[pid]; if (st) st.prob = Math.round((Number(st.prob) || 0) * factor * 10) / 10; });
    }

    // ---- 확률 ----
    function restorationChance(x) {
        const f = [], add = (label, v) => f.push({ label, v: Math.round(v) });
        add(i18n('sim.royal.38'), 10);
        if (!x) return { factors: f, chance: 5 };
        const bs = backers(x.c);
        add(i18n('sim.royal.39', { backingSupport: Math.round(backingSupport(x.c)) }), backingSupport(x.c) * 0.4);
        add(i18n('sim.royal.40', { backingSeats: Math.round(backingSeats(x.c) * 100) }), backingSeats(x.c) * 25);
        const coupApi = HemiCoup();
        if (coupApi && coupApi.military && coupApi.military.length) {
            const aligned = coupApi.military.filter(m => bs.some(p => String(p.id) === String(m.partyId)));
            if (aligned.length) add(i18n('sim.royal.41', { aligned: aligned.length }), Math.min(25, 8 * aligned.length));
            add(i18n('sim.royal.42'), 20 * coupApi.militaryDisloyalty());
        }
        if (coupApi && coupApi.junta) add(i18n('sim.royal.43'), 10);
        add(i18n('sim.royal.44'), -20 * seatShare(p => isGovParty(p) && !bs.includes(p)));
        return { factors: f, chance: clamp(Math.round(f.reduce((a, y) => a + y.v, 0)), 5, 90) };
    }
    function selfCoupChance() {
        const f = [], add = (label, v) => f.push({ label, v: Math.round(v) });
        const x = monarchX();
        add(i18n('sim.royal.38'), 15);
        if (x) add(i18n('sim.royal.45', { backingSeats: Math.round(backingSeats(x.c) * 100) }), backingSeats(x.c) * 35);
        const loyal = militaryLoyalty();
        if (loyal != null) add(i18n('sim.royal.46', { loyal: Math.round(loyal) }), (loyal - 50) * 0.5);
        add(i18n('sim.royal.47'), -15 * seatShare(p => isGovParty(p) && !(x && backers(x.c).includes(p))));
        return { factors: f, chance: clamp(Math.round(f.reduce((a, y) => a + y.v, 0)), 5, 90) };
    }
    function republicChance(pid) {
        const f = [], add = (label, v) => f.push({ label, v: Math.round(v) });
        const x = monarchX();
        add(i18n('sim.royal.38'), 10);
        if (S.monarchy && S.monarchy.kind === 'absolute') add(i18n('sim.royal.48'), 20);
        if (emergencyPowers?.martialLaw?.active) add(i18n('sim.core.46'), 10);
        const p = partyById(pid);
        if (p) add(i18n('sim.royal.49', { name: p.name, support: support(p.id) }), support(p.id) * 0.4);
        if (x) add(i18n('sim.royal.50', { backingSupport: Math.round(backingSupport(x.c)) }), -backingSupport(x.c) * 0.3);
        if (S.dispute) add(i18n('sim.royal.51'), 10);
        const loyal = militaryLoyalty();
        if (loyal != null) add(i18n('sim.royal.46', { loyal: Math.round(loyal) }), -(loyal - 50) * 0.4);
        return { factors: f, chance: clamp(Math.round(f.reduce((a, y) => a + y.v, 0)), 5, 90) };
    }

    // ---- 행동 ----
    function logIt(kind, who, chance, success, effects) {
        const e = { id: uid(), at: Date.now(), date: formatNationDate(), kind, who, chance, success, effects };
        S.log.unshift(e); ui.lastId = e.id;
    }
    function done() { rerenderGov(); if (HemiCoup()) HemiCoup().refresh(); refresh(); }
    function restore() {
        const x = findClaimant(ui.claimantId);
        if (!x) { showCustomAlert(i18n('sim.royal.52')); return; }
        if (window.HemiRevolution && window.HemiRevolution.partyState) { showCustomAlert(i18n('sim.royal.53')); return; }
        if (ui.method === 'parliament') {
            const share = backingSeats(x.c);
            if (share <= 0.5) { showCustomAlert(i18n('sim.royal.55', { name: x.c.name || i18n('sim.royal.54'), share: Math.round(share * 100) })); return; }
            showCustomConfirm(i18n('sim.royal.56', { claimantLabel: claimantLabel(x), share: Math.round(share * 100) }), () => {
                const fx = startMonarchy(x, 'constitutional');
                setConstitution(monarchyConstitution(x, 'constitutional'));
                fx.push(i18n('sim.royal.57', { title: S.monarchy.title, name: x.c.name }), i18n('sim.royal.58'), i18n('sim.royal.59'));
                logIt('restore', claimantLabel(x), null, true, fx); done();
            });
            return;
        }
        const { chance } = restorationChance(x);
        const kindName = ui.kind === 'absolute' ? i18n('sim.royal.60') : i18n('sim.contentSystem.5');
        showCustomConfirm(i18n('sim.royal.61', { claimantLabel: claimantLabel(x), kindName, chance }), () => {
            const success = Math.random() * 100 < chance;
            let fx = [];
            if (success) {
                fx = startMonarchy(x, ui.kind);
                setConstitution(monarchyConstitution(x, ui.kind));
                if (ui.kind === 'absolute') {
                    declareMartialLaw();
                    fx.push(i18n('sim.royal.62', { title: S.monarchy.title, name: x.c.name }), i18n('sim.royal.63'), i18n('sim.royal.64'));
                } else fx.push(i18n('sim.royal.57', { title: S.monarchy.title, name: x.c.name }), i18n('sim.royal.59'));
            } else {
                backers(x.c).forEach(p => { p.status = 'banned'; cutSupport(p.id, 0.5); });
                fx.push(i18n('sim.royal.65'), i18n('sim.royal.66', { name: x.c.name || i18n('sim.royal.54') }));
            }
            logIt('restoreCoup', claimantLabel(x), chance, success, fx); done();
        });
    }
    // 디버그 모드: 왕정복고 · 친위 쿠데타 없이 바로 전제군주정 (설정 › 기타 설정 › 숨겨진 정부 형태 보이기, js/devmode.js)
    function debugAbsolute() {
        if (S.monarchy && S.monarchy.kind === 'absolute') { showCustomAlert(i18n('sim.royal.67')); return; }
        if (window.HemiRevolution && window.HemiRevolution.partyState) { showCustomAlert(i18n('sim.royal.53')); return; }
        const x = S.monarchy ? monarchX() : (findClaimant(ui.claimantId) || allClaimants()[0] || null);
        if (!x) { showCustomAlert(i18n('sim.royal.68')); return; }
        showCustomConfirm(i18n('sim.royal.69', { claimantLabel: S.monarchy ? `${S.monarchy.title} ${x.c.name}` : claimantLabel(x) }), () => {
            const fx = [i18n('sim.royal.70')];
            const kind = S.monarchy ? 'selfCoup' : 'restoreCoup';
            if (S.monarchy) makeAbsolute(); else fx.push(...startMonarchy(x, 'absolute'));
            declareMartialLaw();
            setConstitution(monarchyConstitution(x, 'absolute'));
            fx.push(i18n('sim.royal.71', { title: S.monarchy.title, name: x.c.name }), i18n('sim.royal.63'), i18n('sim.royal.64'));
            logIt(kind, claimantLabel(x), null, true, fx); done();
        });
    }
    if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.register({ id: 'absolute', label: i18n('sim.royal.60'), version: '1.6.6', isActive: () => !!S.monarchy && S.monarchy.kind === 'absolute', enter: debugAbsolute });

    function selfCoup() {
        const x = monarchX();
        if (!S.monarchy || S.monarchy.kind !== 'constitutional' || !x) return;
        const { chance } = selfCoupChance();
        showCustomConfirm(i18n('sim.royal.72', { title: S.monarchy.title, name: x.c.name, chance }), () => {
            const success = Math.random() * 100 < chance;
            const fx = [];
            if (success) {
                makeAbsolute(); declareMartialLaw();
                setConstitution(monarchyConstitution(x, 'absolute'));
                // 왕을 지지하지 않는 정당은 활동 금지 (공화 혁명 · 입헌 개혁 때 복권)
                const keep = new Set(backers(x.c).map(p => String(p.id)));
                parties.forEach(p => { if (!keep.has(String(p.id)) && activeParty(p)) { p.status = 'banned'; S.monarchy.banned.push(p.id); } });
                fx.push(i18n('sim.royal.73'), i18n('sim.royal.64'), i18n('sim.royal.74', { banned: S.monarchy.banned.length }));
            } else {
                const next = succession(true);
                fx.push(i18n('sim.royal.77', { name: S.monarchy && x ? i18n('sim.royal.75', { name: x.c.name }) : i18n('sim.royal.76') }), ...(next ? [`${next}`] : [i18n('sim.royal.78')]));
            }
            logIt('selfCoup', x.c.name, chance, success, fx); done();
        });
    }
    function reform() {
        if (!S.monarchy || S.monarchy.kind !== 'absolute') return;
        showCustomConfirm(i18n('sim.royal.79'), () => {
            const x = monarchX();
            makeConstitutional(); liftMartialLaw();
            (S.monarchy.banned || []).forEach(id => { const p = partyById(id); if (p && p.status === 'banned') p.status = 'active'; });
            S.monarchy.banned = [];
            if (x) setConstitution(monarchyConstitution(x, 'constitutional'));
            logIt('reform', x ? x.c.name : '', null, true, [i18n('sim.royal.80'), i18n('sim.royal.81')]); done();
        });
    }
    function revolt() {
        if (!S.monarchy) return;
        const p = partyById(ui.repParty);
        const { chance } = republicChance(ui.repParty);
        showCustomConfirm(i18n('sim.royal.83', { name: p ? (" " + i18n('sim.royal.82', { name: p.name })) : '', repGov: GOV_NAME[ui.repGov], chance }), () => {
            const success = Math.random() * 100 < chance;
            const x = monarchX();
            const fx = [];
            if (success) {
                const before = nationName();
                endMonarchy(ui.repGov);
                if (nationName() !== before) fx.push(i18n('sim.royal.84', { before, nationName: nationName() }));
                setConstitution(republicConstitution(ui.repGov));
                fx.push(i18n('sim.royal.85', { repGov: GOV_NAME[ui.repGov] }), `${x ? i18n('sim.royal.86', { name: x.c.name }) : ''}`, i18n('sim.royal.87'), i18n('sim.royal.88', { president: effRoleLabel('president') }));
                if (p) cutSupport(p.id, 1.2);
            } else {
                if (p) { p.status = 'banned'; cutSupport(p.id, 0.5); S.monarchy.banned.push(p.id); fx.push(i18n('sim.royal.89', { name: p.name })); }
                declareMartialLaw(); fx.push(i18n('sim.royal.90'));
            }
            logIt('republic', p ? p.name : i18n('sim.royal.91'), chance, success, fx.filter(Boolean)); done();
        });
    }
    // 계승 — 왕이 서거 · 퇴위하면 다음 계승자 (같은 왕가 → 없으면 지지가 가장 센 다른 왕가 주장자). 돌려주는 값: 설명 문구
    function succession(silent) {
        const x = monarchX();
        if (!S.monarchy) return null;
        let next = x ? lineOf(x.d, x.c.id)[0] : null;
        let nd = x ? x.d : null;
        if (!next) {
            const others = allClaimants().filter(y => !x || y.c.id !== x.c.id).sort((a, b) => strength(b.c) - strength(a.c));
            if (others[0]) { next = others[0].c; nd = others[0].d; }
        }
        if (x && x.d) x.d.claimants = x.d.claimants.filter(c => c.id !== x.c.id); // 물러난 왕은 주장자 목록에서 빠짐
        if (!next) { Object.assign(president, { name: '', photo: '', partyId: null, linkedSeat: null }); S.monarchy.claimantId = null; return null; }
        seatMonarch({ c: next, d: nd });
        if (S.dispute && S.dispute.rivalId === next.id) S.dispute = null;
        rerenderGov();
        return i18n('sim.royal.93', { title: S.monarchy.title, name: next.name, name2: nd.name, nd: nd !== (x && x.d) ? (" " + i18n('sim.royal.92')) : '' });
    }
    function demise() {
        const x = monarchX();
        if (!S.monarchy || !x) return;
        showCustomConfirm(i18n('sim.royal.94', { title: S.monarchy.title, name: x.c.name, rule: RULES[x.d.rule] || '' }), () => {
            const msg = succession();
            logIt('succession', x.c.name, null, true, [i18n('sim.royal.95', { name: x.c.name }), msg || i18n('sim.royal.78')]); done();
        });
    }
    function claimDispute() {
        const r = findClaimant(ui.rivalId), x = monarchX();
        if (!r || !x || r.c.id === x.c.id) { showCustomAlert(i18n('sim.royal.96')); return; }
        S.dispute = { rivalId: r.c.id, since: formatNationDate() };
        logIt('dispute', claimantLabel(r), null, true, [i18n('sim.royal.97', { name: r.c.name }), i18n('sim.royal.98', { name: backers(r.c).map(p => p.name).join(', ') || i18n('sim.contentVote.16') })]); done();
    }
    function resolveDispute(how) {
        const r = S.dispute && findClaimant(S.dispute.rivalId), x = monarchX();
        if (!r || !x) { S.dispute = null; refresh(); return; }
        const sx = strength(x.c), sr = strength(r.c);
        let rivalWins, chance = null;
        if (how === 'parliament') rivalWins = backingSeats(r.c) > backingSeats(x.c);
        else {
            let w = sr / Math.max(1, sx + sr);
            const coupApi = HemiCoup();
            if (coupApi && coupApi.military && coupApi.military.length) {
                const al = side => coupApi.military.filter(m => backers(side).some(p => String(p.id) === String(m.partyId))).length;
                w = clamp(w + (al(r.c) - al(x.c)) * 0.08, 0.05, 0.95);
            }
            chance = Math.round(w * 100);
            rivalWins = Math.random() < w;
        }
        const fx = [];
        if (rivalWins) {
            seatMonarch(r);
            backers(x.c).forEach(p => cutSupport(p.id, 0.8));
            fx.push(i18n('sim.royal.99', { name: r.c.name, title: S.monarchy.title, name2: r.d.name }), i18n('sim.royal.100', { name: x.c.name }));
        } else {
            backers(r.c).forEach(p => cutSupport(p.id, 0.8));
            fx.push(i18n('sim.royal.101', { name: x.c.name }), i18n('sim.royal.100', { name: r.c.name }));
        }
        S.dispute = null;
        logIt(how === 'parliament' ? 'disputeVote' : 'disputeWar', `${x.c.name} vs ${r.c.name}`, chance, true, fx); done();
    }

    // ---- 직책 이름 · 대통령 선거 ----
    const origRole = window.effRoleLabel;
    window.effRoleLabel = function (key) {
        if (S.monarchy && key === 'president') return S.monarchy.title || i18n('sim.core.3');
        return origRole.apply(this, arguments);
    };
    if (typeof window.runPresidentialElection === 'function') {
        const origPres = window.runPresidentialElection;
        window.runPresidentialElection = function () {
            if (S.monarchy) { showCustomAlert(i18n('sim.royal.102', { title: S.monarchy.title })); return; }
            return origPres.apply(this, arguments);
        };
    }

    // ---- 탭: 내각 › 왕실 ----
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function addTab() {
        const cab = document.getElementById('mainContentCabinet');
        const bar = cab && cab.querySelector(':scope > .sub-tab-container');
        if (!bar) return;
        const before = document.getElementById('subTabCouncil');
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','royal')" id="subTabRoyal">${esc(i18n('sim.royal.103'))}</button>`), before);
        cab.appendChild(el(`<div id="contentRoyal" class="sub-tab-content"></div>`));
    })();
    const origSwitch = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitch.apply(this, arguments);
        if (main === 'cabinet' && sub === 'royal') refresh();
        return r;
    };
    const origCab = window.renderCabinetDisplay;
    window.renderCabinetDisplay = function () {
        const r = origCab.apply(this, arguments);
        const grid = document.getElementById('cabinetDisplayGrid');
        if (grid) {
            let b = document.getElementById('royalBanner');
            const x = monarchX();
            if (S.monarchy) {
                if (!b) { b = el('<div id="royalBanner" class="royal-banner"></div>'); grid.parentElement.insertBefore(b, grid); }
                b.innerHTML = `👑 ${S.monarchy.kind === 'absolute' ? i18n('sim.royal.60') : i18n('sim.contentSystem.5')} — ${esc(S.monarchy.title)} <b>${esc(x ? x.c.name : i18n('sim.export.18'))}</b>${x ? ` · ${esc(x.d.name)}` : ''}${S.monarchy.since ? (" " + i18n('sim.royal.104', { since: esc(S.monarchy.since) })) : ''}${S.dispute ? (" " + i18n('sim.royal.105')) : ''}`;
                b.style.setProperty('--royal-c', (x && x.d.color) || '#7a1f2b');
            } else if (b) b.remove();
        }
        return r;
    };

    // ---- 화면 ----
    function chanceBox({ factors, chance }) {
        return `<div class="royal-chance"><div class="royal-chance-head"><span>${esc(i18n('sim.royal.106'))}</span><b>${chance}%</b></div>
            <div class="royal-bar"><span style="width:${chance}%"></span></div>
            ${factors.map(f => `<div class="royal-factor"><span>${esc(f.label)}</span><span class="${f.v >= 0 ? 'royal-plus' : 'royal-minus'}">${f.v >= 0 ? '+' : ''}${f.v}%p</span></div>`).join('')}</div>`;
    }
    const KIND_NAME = { restore: i18n('sim.royal.107'), restoreCoup: i18n('sim.royal.108'), selfCoup: i18n('sim.royal.109'), reform: i18n('sim.royal.110'), republic: i18n('sim.royal.111'), succession: i18n('sim.royal.112'), dispute: i18n('sim.royal.113'), disputeVote: i18n('sim.royal.114'), disputeWar: i18n('sim.royal.115') };
    function dynastiesHtml() {
        const mx = monarchX();
        return S.dynasties.map(d => {
            const line = lineOf(d, mx && mx.c.id);
            const rank = id => { const i = line.findIndex(c => c.id === id); return i < 0 ? null : i + 1; };
            return `<div class="royal-dyn" style="--royal-c:${esc(d.color)}" data-dyn="${esc(d.id)}">
                <div class="royal-row">
                    <input type="color" value="${esc(d.color)}" data-df="color" title="${esc(i18n('sim.royal.116'))}">
                    <input type="text" value="${esc(d.name)}" data-df="name" placeholder="${esc(i18n('sim.royal.117'))}" class="royal-grow">
                    <button type="button" class="royal-x" data-dact="del" title="${esc(i18n('sim.royal.118'))}">✕</button>
                </div>
                <div class="royal-row"><span class="royal-dim">${esc(i18n('sim.royal.119'))}</span><select data-df="rule" class="royal-grow">${Object.entries(RULES).map(([k, t]) => `<option value="${k}" ${d.rule === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                <div id="royalCl_${esc(d.id)}" class="royal-claimants">
                ${d.claimants.map(c => {
                    const isKing = mx && mx.c.id === c.id, r = rank(c.id);
                    return `<div class="royal-cl ${isKing ? 'king' : ''}" data-cl="${esc(c.id)}">
                        <span class="drag-handle royal-handle" title="${esc(i18n('sim.royal.120'))}">⋮⋮</span>
                        <label class="leader-photo-box royal-photo" title="${esc(i18n('sim.royal.121'))}">${c.photo ? `<img src="${c.photo}" alt="">` : '<div class="photo-ph">👤</div>'}<input type="file" accept="image/*" data-cf="photo"></label>
                        <div class="royal-cl-main">
                            <div class="royal-row">
                                <span class="royal-rank">${isKing ? '👑' : r ? esc(i18n('sim.royal.122', { r })) : '—'}</span>
                                <input type="text" value="${esc(c.name)}" data-cf="name" placeholder="${esc(i18n('sim.contentDate.11'))}" class="royal-grow">
                                <select data-cf="gender" title="${esc(i18n('sim.royal.123'))}"><option value="m" ${c.gender !== 'f' ? 'selected' : ''}>${esc(i18n('sim.royal.124'))}</option><option value="f" ${c.gender === 'f' ? 'selected' : ''}>${esc(i18n('sim.royal.126'))}</option></select>
                                <button type="button" class="royal-x" data-cact="del" title="${esc(i18n('sim.royal.125'))}">✕</button>
                            </div>
                            <input type="text" value="${esc(c.title)}" data-cf="title" placeholder="${esc(i18n('sim.royal.127'))}">
                            <div class="royal-chips">${(c.partyIds || []).map(pid => { const p = partyById(pid); return p ? `<span class="royal-chip" style="--pc:${esc(p.color)}">${esc(p.abbr || p.name)}<button type="button" data-unback="${esc(pid)}" title="${esc(i18n('sim.royal.128'))}">×</button></span>` : ''; }).join('')}
                                <select data-cf="back" class="royal-back"><option value="">${esc(i18n('sim.royal.129'))}</option>${parties.filter(p => !isInd(p) && !(c.partyIds || []).map(String).includes(String(p.id))).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
                </div>
                <button type="button" class="royal-add" data-dact="addcl">${esc(i18n('sim.royal.130'))}</button>
            </div>`;
        }).join('');
    }
    function render() {
        const box = document.getElementById('contentRoyal');
        if (!box) return;
        const mx = monarchX();
        const claimOpts = sel => allClaimants().map(({ c, d }) => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${esc(c.name || esc(i18n('sim.core.7')))} · ${esc(d.name)} ${esc(i18n('sim.royal.131'))} ${Math.round(backingSeats(c) * 100)}%</option>`).join('');
        if (!allClaimants().some(x => x.c.id === ui.claimantId)) ui.claimantId = (allClaimants().sort((a, b) => strength(b.c) - strength(a.c))[0] || { c: {} }).c.id || '';
        let action = '';
        if (!S.monarchy) {
            const x = findClaimant(ui.claimantId);
            action = `<div class="royal-card">
                <div class="royal-head">${esc(i18n('sim.royal.132'))}</div>
                <div class="royal-dim">${esc(i18n('sim.royal.133'))}</div>
                ${allClaimants().length ? `<select data-ui="claimantId">${claimOpts(ui.claimantId)}</select>` : `<div class="royal-dim">${esc(i18n('sim.royal.134'))}</div>`}
                <div class="system-radio-group"><button type="button" class="system-radio-btn ${ui.method === 'parliament' ? 'active' : ''}" data-method="parliament">${esc(i18n('sim.royal.135'))}</button><button type="button" class="system-radio-btn ${ui.method === 'coup' ? 'active' : ''}" data-method="coup">${esc(i18n('sim.royal.136'))}</button></div>
                ${ui.method === 'parliament' ? `<div class="royal-dim">${esc(i18n('sim.royal.137'))} <b>${x ? Math.round(backingSeats(x.c) * 100) : 0}%</b> ${esc(i18n('sim.royal.138'))}</div>`
                    : `<div class="system-radio-group"><button type="button" class="system-radio-btn ${ui.kind === 'constitutional' ? 'active' : ''}" data-kind="constitutional">${esc(i18n('sim.contentSystem.5'))}</button><button type="button" class="system-radio-btn ${ui.kind === 'absolute' ? 'active' : ''}" data-kind="absolute">${esc(i18n('sim.royal.60'))}</button></div>${chanceBox(restorationChance(x))}`}
                <button type="button" class="royal-go" data-act="restore" ${allClaimants().length ? '' : 'disabled'}>${esc(i18n('sim.royal.132'))}</button>
            </div>`;
        } else {
            const abs = S.monarchy.kind === 'absolute';
            const rival = S.dispute && findClaimant(S.dispute.rivalId);
            const rivals = allClaimants().filter(y => !mx || y.c.id !== mx.c.id);
            if (!rivals.some(y => y.c.id === ui.rivalId)) ui.rivalId = (rivals[0] || { c: {} }).c.id || '';
            const repParties = parties.filter(activeParty);
            action = `<div class="royal-card royal-reign" style="--royal-c:${esc((mx && mx.d.color) || '#7a1f2b')}">
                <div class="royal-head">👑 ${abs ? esc(i18n('sim.royal.60')) : esc(i18n('sim.contentSystem.5'))}</div>
                <div class="royal-row"><span class="royal-dim">${esc(i18n('sim.royal.139'))}</span><select data-ui="title">${[...new Set([S.monarchy.title, ...TITLES])].map(t => `<option ${t === S.monarchy.title ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
                    <b class="royal-grow">${esc(mx ? mx.c.name : esc(i18n('sim.export.18')))}</b><span class="royal-dim">${esc(mx ? mx.d.name : '')}${S.monarchy.since ? esc((" " + i18n('sim.royal.104', { since: esc(S.monarchy.since) }))) : ''}</span></div>
                <div class="royal-dim">${abs ? esc(i18n('sim.royal.140')) : esc(i18n('sim.royal.141'))}</div>
                <div class="royal-sub">${esc(i18n('sim.royal.112'))}</div>
                <div class="royal-dim">${esc(i18n('sim.royal.142'))} <b>${(() => { const n = mx ? lineOf(mx.d, mx.c.id)[0] : null; return n ? esc(n.name || esc(i18n('sim.core.7'))) : esc(i18n('sim.royal.143')); })()}</b> (${esc(mx ? RULES[mx.d.rule] || '' : '')})</div>
                <button type="button" class="royal-btn" data-act="demise">${esc(i18n('sim.royal.144'))}</button>
                <div class="royal-sub">${esc(i18n('sim.royal.113'))}</div>
                ${rival ? `<div class="royal-vs"><span>👑 ${esc(mx ? mx.c.name : '')}<small>${esc(i18n('sim.royal.145'))} ${mx ? Math.round(backingSeats(mx.c) * 100) : 0}%</small></span><b>vs</b><span>⚔ ${esc(rival.c.name)}<small>${esc(i18n('sim.royal.145'))} ${Math.round(backingSeats(rival.c) * 100)}%</small></span></div>
                    <div class="royal-row"><button type="button" class="royal-btn" data-act="vote">${esc(i18n('sim.royal.146'))}</button><button type="button" class="royal-btn" data-act="war">${esc(i18n('sim.royal.147'))}</button></div>`
                    : rivals.length ? `<div class="royal-row"><select data-ui="rivalId" class="royal-grow">${rivals.map(({ c, d }) => `<option value="${esc(c.id)}" ${c.id === ui.rivalId ? 'selected' : ''}>${esc(c.name || esc(i18n('sim.core.7')))} · ${esc(d.name)}</option>`).join('')}</select><button type="button" class="royal-btn" data-act="dispute">${esc(i18n('sim.royal.148'))}</button></div>`
                    : `<div class="royal-dim">${esc(i18n('sim.royal.149'))}</div>`}
                <div class="royal-sub">${abs ? esc(i18n('sim.royal.150')) : esc(i18n('sim.royal.151'))}</div>
                ${abs ? `<button type="button" class="royal-btn" data-act="reform">${esc(i18n('sim.royal.152'))}</button>`
                    : `${chanceBox(selfCoupChance())}<button type="button" class="royal-btn" data-act="selfcoup">${esc(i18n('sim.royal.153'))}</button>`}
                <div class="royal-row"><select data-ui="repParty" class="royal-grow"><option value="">${esc(i18n('sim.royal.154'))}</option>${repParties.map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(ui.repParty) ? 'selected' : ''}>${esc(p.name)} ${esc(i18n('sim.royal.155'))} ${support(p.id)}%</option>`).join('')}</select>
                    <select data-ui="repGov">${['parliamentary', 'presidential', 'semi'].map(g => `<option value="${g}" ${ui.repGov === g ? 'selected' : ''}>${GOV_NAME[g]}</option>`).join('')}</select></div>
                ${chanceBox(republicChance(ui.repParty))}
                <button type="button" class="royal-go" data-act="republic">${esc(i18n('sim.royal.156'))}</button>
            </div>`;
        }
        const last = S.log.find(x => x.id === ui.lastId);
        box.innerHTML = `<div class="royal-intro">${esc(i18n('sim.royal.157'))}</div>
            ${action}
            ${last ? `<div class="royal-result ${last.success ? 'ok' : 'fail'}"><div class="royal-head">${last.success ? '✔' : '✘'} ${esc(KIND_NAME[last.kind] || last.kind)}${last.chance != null ? ` <span class="royal-dim">${esc(i18n('sim.royal.158'))} ${last.chance}%)</span>` : ''}</div><ul>${(last.effects || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
            <div class="royal-sub">${esc(i18n('sim.royal.159'))}</div>
            ${dynastiesHtml()}
            <div class="royal-row"><button type="button" class="royal-add" data-act="adddyn">${esc(i18n('sim.royal.160'))}</button>${S.dynasties.length ? '' : `<button type="button" class="royal-add" data-act="seed">${esc(i18n('sim.royal.161'))}</button>`}</div>
            ${S.log.length ? `<details class="royal-log"><summary>${esc(i18n('sim.royal.162'))}${S.log.length})</summary>${S.log.map(x => `<div class="royal-log-row"><span class="${x.success ? 'royal-plus' : 'royal-minus'}">${x.success ? '✔' : '✘'}</span><span>${esc(KIND_NAME[x.kind] || x.kind)} · ${esc(x.who || '')}${x.date ? ` · ${esc(x.date)}` : ''}${x.chance != null ? ` · ${x.chance}%` : ''}</span></div>`).join('')}</details>` : ''}`;
        bind(box);
    }
    function bind(box) {
        const q = s => box.querySelector(s);
        box.querySelectorAll('[data-ui]').forEach(s => { s.onchange = () => { if (s.dataset.ui === 'title') { S.monarchy.title = s.value; rerenderGov(); } else ui[s.dataset.ui] = s.value; render(); }; });
        box.querySelectorAll('[data-method]').forEach(b => { b.onclick = () => { ui.method = b.dataset.method; render(); }; });
        box.querySelectorAll('[data-kind]').forEach(b => { b.onclick = () => { ui.kind = b.dataset.kind; render(); }; });
        const on = (sel, fn) => { const b = q(sel); if (b) b.onclick = fn; };
        on('[data-act="restore"]', restore); on('[data-act="selfcoup"]', selfCoup); on('[data-act="reform"]', reform); on('[data-act="republic"]', revolt);
        on('[data-act="demise"]', demise); on('[data-act="dispute"]', claimDispute); on('[data-act="vote"]', () => resolveDispute('parliament')); on('[data-act="war"]', () => resolveDispute('war'));
        on('[data-act="adddyn"]', () => { S.dynasties.push({ id: uid(), name: i18n('sim.royal.163'), color: PALETTE[S.dynasties.length % PALETTE.length], rule: 'male', claimants: [] }); render(); });
        on('[data-act="seed"]', seed);
        box.querySelectorAll('.royal-dyn').forEach(card => {
            const d = S.dynasties.find(x => x.id === card.dataset.dyn); if (!d) return;
            card.querySelectorAll('[data-df]').forEach(i => { i.onchange = () => { d[i.dataset.df] = i.value; render(); rerenderGov(); }; });
            card.querySelector('[data-dact="del"]').onclick = () => {
                if (S.monarchy && S.monarchy.dynastyId === d.id) { showCustomAlert(i18n('sim.royal.164')); return; }
                showCustomConfirm(i18n('sim.royal.165', { name: d.name, claimants: d.claimants.length }), () => { S.dynasties = S.dynasties.filter(x => x !== d); render(); });
            };
            card.querySelector('[data-dact="addcl"]').onclick = () => { d.claimants.push({ id: uid(), name: '', title: '', gender: 'm', photo: '', partyIds: [] }); render(); };
            card.querySelectorAll('.royal-cl').forEach(row => {
                const c = d.claimants.find(x => x.id === row.dataset.cl); if (!c) return;
                row.querySelectorAll('[data-cf]').forEach(i => {
                    const f = i.dataset.cf;
                    if (f === 'photo') i.onchange = () => { const file = i.files && i.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = e => { c.photo = e.target.result; if (monarchX() && monarchX().c === c) president.photo = c.photo; render(); rerenderGov(); }; rd.readAsDataURL(file); };
                    else if (f === 'back') i.onchange = () => { if (i.value) { c.partyIds = [...new Set([...(c.partyIds || []), i.value])]; render(); } };
                    else i.onchange = () => { c[f] = i.value; if (f === 'name' && monarchX() && monarchX().c === c) { president.name = c.name; rerenderGov(); } render(); };
                });
                row.querySelectorAll('[data-unback]').forEach(b => { b.onclick = () => { c.partyIds = c.partyIds.filter(x => String(x) !== String(b.dataset.unback)); render(); }; });
                row.querySelector('[data-cact="del"]').onclick = () => {
                    if (monarchX() && monarchX().c === c) { showCustomAlert(i18n('sim.royal.166')); return; }
                    d.claimants = d.claimants.filter(x => x !== c); render();
                };
                const h = row.querySelector('.royal-handle');
                if (h && typeof startDragReorder === 'function') startDragReorder(h, `royalCl_${d.id}`, '.royal-cl', d.claimants, render);
            });
        });
    }
    // 예시 왕가 — 독일이면 호엔촐레른 · 비텔스바흐 (1983년 무렵의 가주들), 아니면 일반 예시
    function seed() {
        const de = /독일|Germany/.test(nationName());
        const mk = (name, color, rule, list) => ({ id: uid(), name, color, rule, claimants: list.map(([n, t, g]) => ({ id: uid(), name: n, title: t, gender: g || 'm', photo: '', partyIds: [] })) });
        // 세이브에 든 이름은 번역하지 않으므로, 영어 화면이면 예시도 영어 이름으로 만든다
        const en = typeof window.getLang === 'function' && window.getLang() === 'en';
        if (en) {
            S.dynasties = de ? [
                mk('House of Hohenzollern', '#3a3a3a', 'salic', [['Louis Ferdinand', 'Prince of Prussia · head of house'], ['Christian-Sigismund', 'Prince of Prussia'], ['Georg Friedrich', 'Prince of Prussia']]),
                mk('House of Wittelsbach', '#1f6fb3', 'salic', [['Albrecht', 'Duke of Bavaria · head of house'], ['Franz', 'Duke of Bavaria'], ['Max', 'Duke of Bavaria']]),
            ] : [
                mk('Royal House 1', PALETTE[0], 'male', [['Claimant', 'Crown Prince'], ['Second child', 'Prince'], ['Third child', 'Princess', 'f']]),
                mk('Royal House 2', PALETTE[1], 'equal', [['Rival claimant', 'Grand Duke']]),
            ];
            render();
            return;
        }
        S.dynasties = de ? [
            mk(i18n('sim.royal.167'), '#3a3a3a', 'salic', [[i18n('sim.royal.168'), i18n('sim.royal.169')], [i18n('sim.royal.170'), i18n('sim.royal.171')], [i18n('sim.royal.172'), i18n('sim.royal.171')]]),
            mk(i18n('sim.royal.173'), '#1f6fb3', 'salic', [[i18n('sim.royal.174'), i18n('sim.royal.175')], [i18n('sim.royal.176'), i18n('sim.royal.177')], [i18n('sim.royal.178'), i18n('sim.royal.177')]]),
        ] : [
            mk(i18n('sim.royal.179'), PALETTE[0], 'male', [[i18n('sim.royal.180'), i18n('sim.royal.181')], [i18n('sim.royal.182'), i18n('sim.royal.183')], [i18n('sim.royal.184'), i18n('sim.royal.185'), 'f']]),
            mk(i18n('sim.royal.186'), PALETTE[1], 'equal', [[i18n('sim.royal.187'), i18n('sim.royal.188')]]),
        ];
        render();
    }

    window.HemiRoyal = { get monarchy() { return S.monarchy; }, get dispute() { return S.dispute; }, get log() { return S.log; }, get dynasties() { return S.dynasties; } };
    function refresh() {
        render();
        if (window.HemiDev && HemiDev.hiddenGov) HemiDev.hiddenGov.render();
        try { window.renderCabinetDisplay && window.renderCabinetDisplay(); } catch (e) { /* 화면 준비 전 */ }
    }
    // 국가 › 사람(js/people.js)에 왕가 사람(주장자)도 자리로 — 인물을 배정하거나 "모든 자리에서 가져오기"로 인물을 만든다
    (window.HemiPeopleSeats = window.HemiPeopleSeats || []).push({
        seats: () => allClaimants().map(({ c, d }) => ({ key: `rc:${c.id}`, group: i18n('sim.royal.103'), label: `${d.name || i18n('sim.royal.4')} · ${c.title || i18n('sim.royal.189')}`, obj: c })),
        refresh,
    });

    const style = document.createElement('style');
    style.textContent = `
        .royal-intro { color: #777; font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .royal-row { display: flex; align-items: center; gap: 6px; margin: 4px 0; flex-wrap: wrap; }
        .royal-grow { flex: 1; min-width: 0; }
        .royal-dim { color: #777; font-size: .8rem; }
        .royal-sub { color: #888; font-size: .78rem; margin: 12px 0 6px; letter-spacing: 1px; }
        .royal-card { border: 1px solid #333; padding: 10px; margin: 6px 0 12px; background: rgba(255,255,255,.02); display: flex; flex-direction: column; gap: 6px; }
        .royal-card select { width: 100%; box-sizing: border-box; }
        .royal-reign { border-color: var(--royal-c); box-shadow: inset 4px 0 0 var(--royal-c); }
        .royal-head { font-size: 1rem; color: #e0b030; letter-spacing: 1px; }
        .royal-chance { border: 1px solid #333; padding: 8px; background: rgba(255,255,255,.02); }
        .royal-chance-head { display: flex; justify-content: space-between; align-items: baseline; color: #aaa; }
        .royal-chance-head b { font-size: 1.4rem; color: #e0b030; }
        .royal-bar { height: 7px; background: #222; margin: 5px 0 6px; } .royal-bar span { display: block; height: 100%; background: #e0b030; }
        .royal-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .76rem; color: #999; padding: 1px 0; }
        .royal-plus { color: #5fbf7f; } .royal-minus { color: #e06060; }
        .royal-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 9px; background: transparent; border: 2px solid #e0b030; color: #e0b030; letter-spacing: 1px; }
        .royal-go:disabled { opacity: .4; cursor: default; }
        .royal-btn, .royal-add { cursor: pointer; font-family: inherit; font-size: .82rem; padding: 5px 10px; background: transparent; border: 1px solid #555; color: #ccc; }
        .royal-add { border-style: dashed; color: #888; }
        .royal-x { cursor: pointer; background: transparent; border: 1px solid #333; color: #777; font-family: inherit; padding: 2px 8px; }
        .royal-vs { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border: 1px dashed #555; }
        .royal-vs span { display: flex; flex-direction: column; } .royal-vs small { color: #888; font-size: .72rem; } .royal-vs b { color: #e06060; }
        .royal-dyn { border: 1px solid #333; border-left: 5px solid var(--royal-c); padding: 8px; margin-bottom: 10px; background: rgba(255,255,255,.02); }
        .royal-dyn input[type=color] { width: 34px; height: 28px; padding: 0; border: 1px solid #333; background: none; }
        .royal-claimants { display: flex; flex-direction: column; gap: 6px; margin: 6px 0; }
        .royal-cl { display: flex; gap: 8px; align-items: flex-start; padding: 6px; border: 1px solid #2a2a2a; background: rgba(0,0,0,.2); }
        .royal-cl.king { border-color: #e0b030; box-shadow: 0 0 8px rgba(224,176,48,.25); }
        .royal-handle { align-self: center; }
        .royal-photo { width: 44px; height: 56px; flex-shrink: 0; } .royal-photo img { width: 100%; height: 100%; object-fit: cover; }
        .royal-cl-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .royal-cl-main input[type=text] { min-width: 0; box-sizing: border-box; }
        .royal-cl-main > input[type=text] { width: 100%; }
        .royal-cl-main .royal-row { flex-wrap: nowrap; margin: 0; }
        .royal-cl-main .royal-row select { width: auto; flex: 0 0 auto; min-width: 0; padding-left: 4px; padding-right: 4px; }
        .royal-cl-main .royal-row .royal-x { flex: 0 0 auto; }
        .royal-chips select.royal-back { width: auto; }
        .royal-rank { min-width: 2.2em; font-size: .78rem; color: #e0b030; text-align: center; }
        .royal-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
        .royal-chip { display: inline-flex; align-items: center; gap: 3px; font-size: .72rem; padding: 1px 4px 1px 6px; border: 1px solid var(--pc); color: #ddd; border-left-width: 4px; }
        .royal-chip button { cursor: pointer; background: none; border: none; color: #888; padding: 0 2px; font-family: inherit; }
        .royal-back { font-size: .74rem; max-width: 9.5em; }
        .royal-result { margin: 4px 0 10px; padding: 8px 10px; border: 1px solid #333; border-left: 4px solid #888; }
        .royal-result.ok { border-left-color: #5fbf7f; } .royal-result.fail { border-left-color: #e06060; }
        .royal-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .8rem; color: #bbb; }
        .royal-log { margin-top: 12px; font-size: .82rem; } .royal-log summary { cursor: pointer; color: #999; }
        .royal-log-row { display: flex; gap: 6px; padding: 3px 0; color: #aaa; border-bottom: 1px solid #1c1c1c; }
        .royal-banner { margin: 0 0 10px; padding: 8px 12px; border: 1px solid var(--royal-c, #7a1f2b); border-left-width: 5px; color: #e0b030; font-size: .9rem; background: color-mix(in srgb, var(--royal-c, #7a1f2b) 18%, transparent); letter-spacing: 1px; }
        html[data-theme-family="modern"] .royal-intro, html[data-theme-family="modern"] .royal-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .royal-card, html[data-theme-family="modern"] .royal-dyn, html[data-theme-family="modern"] .royal-chance { border-color: var(--m-border); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .royal-reign { border-color: var(--royal-c); }
        html[data-theme-family="modern"] .royal-dyn { border-left: 5px solid var(--royal-c); }
        html[data-theme-family="modern"] .royal-cl { border-color: var(--m-border); background: var(--m-surface); border-radius: 8px; }
        html[data-theme-family="modern"] .royal-head, html[data-theme-family="modern"] .royal-chance-head b, html[data-theme-family="modern"] .royal-rank { color: #b07d10; }
        html[data-theme-family="modern"] .royal-bar { background: var(--m-border); border-radius: 4px; overflow: hidden; } html[data-theme-family="modern"] .royal-bar span { background: #c9971a; }
        html[data-theme-family="modern"] .royal-factor, html[data-theme-family="modern"] .royal-chance-head { color: var(--m-text-2); }
        html[data-theme-family="modern"] .royal-go { border-color: #c9971a; color: #b07d10; border-radius: 12px; font-weight: 600; letter-spacing: 0; }
        html[data-theme-family="modern"] .royal-btn, html[data-theme-family="modern"] .royal-add, html[data-theme-family="modern"] .royal-x { border-color: var(--m-border-strong); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .royal-chip { color: var(--m-text); border-radius: 6px; }
        html[data-theme-family="modern"] .royal-result { border-color: var(--m-border); border-radius: 10px; background: var(--m-surface); } html[data-theme-family="modern"] .royal-result ul { color: var(--m-text-2); }
        html[data-theme-family="modern"] .royal-log-row { color: var(--m-text-2); border-bottom-color: var(--m-border); }
        html[data-theme-family="modern"] .royal-banner { border-radius: 12px; color: #8a6200; background: color-mix(in srgb, var(--royal-c, #7a1f2b) 10%, var(--m-surface)); }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
