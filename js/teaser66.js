// ===== Hemicycle 티저 1.6.6 (teaser66 ~ 67) — "왕은 죽었다, 국왕 만세!" 미리보기 =====
// teaser66.html = main.html + js/teaserpodium.js + js/teaser61.js ~ js/teaser65.js(1.6.1 ~ 1.6.5) + 이 파일. 저장 공간은 따로 ('hemicycleTeaserV2-66:')
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
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') !== 'teaser' || !['66', '67'].includes(root.getAttribute('data-teaser'))) return;

    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s ?? '')) : String(s ?? ''));
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const uid = () => 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const partyById = id => parties.find(p => String(p.id) === String(id)) || null;
    const T62 = () => window.T62 || null;
    const isInd = p => p && p.ideologyId === 9999;
    const activeParty = p => p && p.status !== 'banned' && p.status !== 'dissolved' && !isInd(p);
    const support = pid => Math.max(0, Number(elecStore?.house?.[pid]?.prob) || 0);
    const isGovParty = p => !!p && (p.isRuling || coalitions.some(c => c.isRuling && (c.members || []).some(id => String(id) === String(p.id))));
    function seatShare(filter) {
        const key = seatKeyFor('house');
        const total = parties.reduce((a, p) => a + (p[key] || 0), 0);
        return total ? parties.filter(filter).reduce((a, p) => a + (p[key] || 0), 0) / total : 0;
    }
    const RULES = { salic: '남계만 (살리카법)', male: '남자 우선', equal: '성별 무관 (장자)' };
    const TITLES = ['국왕', '여왕', '황제', '여제', '대공', '술탄'];
    const PALETTE = ['#7a1f2b', '#1f3a7a', '#5b3a8a', '#2e6b4f', '#8a6a1f', '#444444'];
    const GOV_NAME = { parliamentary: '의원내각제', presidential: '대통령제', semi: '이원집정부제', collective: '집단지도체제', monarchy: '입헌군주제' };

    // ---- 상태 (세이브의 teaser66 칸) ----
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
        if (st && typeof st === 'object') st.teaser66 = JSON.parse(JSON.stringify(S));
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const src = state && state.teaser66;
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
    const claimantLabel = x => x ? `${x.c.name || '(이름 없음)'}${x.c.title ? ` (${x.c.title})` : ''} · ${x.d.name || '왕가'}` : '';
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
    const militaryLoyalty = () => { const m = T62() && T62().military; return m && m.length ? m.reduce((a, x) => a + (Number(x.loyalty) || 0), 0) / m.length : null; };

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
        if (T62()) { T62().declareMartialLaw(); return; }
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
        const t61 = T62();
        const fx = [];
        if (t61 && t61.junta) { t61.endJunta('revolution'); fx.push('군정 붕괴'); }
        S.monarchy = { kind, title: x.c.gender === 'f' ? '여왕' : '국왕', since: formatNationDate(), prevGovType: govType,
            prevPresident: { name: president.name || '', photo: president.photo || '', partyId: president.partyId ?? null },
            prevVeto: typeof vetoHolder !== 'undefined' ? vetoHolder : 'none',
            prevHolders: Object.fromEntries(Object.keys(emergencyPowers).map(k => [k, emergencyPowers[k].holder])), banned: [], prevNation: nationName() };
        const kn = kingdomName(nationName());
        if (kn && kn !== nationName()) { setNationName(kn); fx.push(`국호 변경: ${S.monarchy.prevNation} → ${kn}`); }
        seatMonarch(x);
        if (kind === 'absolute') makeAbsolute(); else makeConstitutional();
        S.dispute = null;
        return fx;
    }
    function endMonarchy(gov) {
        const prev = S.monarchy;
        S.monarchy = null; S.dispute = null;
        // 국호 — 왕정 전의 공화국 이름이 있으면 되돌리고, 없으면 "○○ 공화국"
        const rep = prev && prev.prevNation && !/(왕국|제국|대공국|공국)$/.test(prev.prevNation) ? prev.prevNation : (nationRoot(nationName()) ? `${nationRoot(nationName())} 공화국` : '');
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
        const revisions = prev ? [...(prev.revisions || []), { date: formatNationDate(), note: `"${prev.title}" 폐지 · "${c.title}" 제정` }] : [];
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
    const kingdomName = nm => nm && /(왕국|제국|대공국|공국)$/.test(nm) ? nm : (nationRoot(nm) ? `${nationRoot(nm)} 왕국` : '');
    function monarchyConstitution(x, kind) {
        const nm = nationName(), house = x.d.name || '왕가';
        return kind === 'absolute' ? { title: `${nm ? nm + ' ' : ''}기본법`,
            preamble: `${house}의 정통 군주가 하늘과 국민 앞에서 나라를 다스리며, 국민은 군주에게 충성하고 나라의 번영을 위하여 이 기본법을 받든다.`,
            articles: [
                { title: '군주', text: `${nm || '국가'}의 군주는 ${house}의 정통 계승자이며, 신성하여 침해할 수 없다.` },
                { title: '통치권', text: '군주는 국가의 원수로서 통치권을 총람하고, 총리와 각료를 임명하고 해임한다.' },
                { title: '입법', text: '의회는 군주의 협찬 기관이며, 법률은 군주의 재가로 효력을 가진다. 군주는 법률안을 거부할 수 있다.' },
                { title: '비상 대권', text: '군주는 국가 비상시 계엄을 선포하고 의회를 정회 또는 해산할 수 있다.' },
                { title: '왕위 계승', text: `왕위는 ${RULES[x.d.rule] || '정해진 규칙'}에 따라 ${house}에서 계승한다.` },
            ] } : { title: `${nm ? nm + ' ' : ''}헌법`,
            preamble: `${nm || '우리 나라'}는 ${house}의 군주를 국가의 상징으로 모시는 입헌군주국이며, 주권은 국민에게 있다.`,
            articles: [
                { title: '국체', text: `${nm || '국가'}는 입헌군주국이다. 군주는 국가와 국민 통합의 상징이며 국정에 관한 실권을 가지지 아니한다.` },
                { title: '국민주권', text: '주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.' },
                { title: '내각', text: '행정권은 내각에 속하며, 총리는 의회의 신임에 기초한다.' },
                { title: '왕위 계승', text: `왕위는 ${RULES[x.d.rule] || '정해진 규칙'}에 따라 ${house}에서 계승한다.` },
            ] };
    }
    function republicConstitution(gov) {
        const nm = nationName();
        return { title: `${nm ? nm + ' ' : ''}헌법`,
            preamble: '우리 국민은 군주제를 폐지하고, 국민 모두가 주권자인 공화국을 세우며 자유와 평등의 질서를 지키기 위하여 이 헌법을 제정한다.',
            articles: [
                { title: '국체', text: `${nm || '국가'}는 민주공화국이다.` },
                { title: '국민주권', text: '주권은 국민에게 있고, 모든 권력은 국민으로부터 나온다.' },
                { title: '군주제의 폐지', text: '군주제와 귀족 제도는 폐지되며, 어떠한 특권 계급도 인정되지 아니한다.' },
                { title: '정부 형태', text: `정부는 ${GOV_NAME[gov] || '공화정'}로 구성한다.` },
                { title: '선거', text: '국가원수와 의회 의원은 국민의 보통 · 평등 · 직접 · 비밀 선거로 뽑는다.' },
            ] };
    }
    function cutSupport(pid, factor) {
        if (T62()) { T62().cutSupport(pid, factor); return; }
        chamberList().forEach(ch => { const st = elecStore?.[ch]?.[pid]; if (st) st.prob = Math.round((Number(st.prob) || 0) * factor * 10) / 10; });
    }

    // ---- 확률 ----
    function restorationChance(x) {
        const f = [], add = (label, v) => f.push({ label, v: Math.round(v) });
        add('기본', 10);
        if (!x) return { factors: f, chance: 5 };
        const bs = backers(x.c);
        add(`지지 정당 지지율 (${Math.round(backingSupport(x.c))}%)`, backingSupport(x.c) * 0.4);
        add(`지지 정당 의석 (${Math.round(backingSeats(x.c) * 100)}%)`, backingSeats(x.c) * 25);
        const t61 = T62();
        if (t61 && t61.military && t61.military.length) {
            const aligned = t61.military.filter(m => bs.some(p => String(p.id) === String(m.partyId)));
            if (aligned.length) add(`가까운 장성 ${aligned.length}명`, Math.min(25, 8 * aligned.length));
            add('군 지휘부의 불만', 20 * t61.militaryDisloyalty());
        }
        if (t61 && t61.junta) add('군정에 대한 반감', 10);
        add('정부 · 여당의 의석', -20 * seatShare(p => isGovParty(p) && !bs.includes(p)));
        return { factors: f, chance: clamp(Math.round(f.reduce((a, y) => a + y.v, 0)), 5, 90) };
    }
    function selfCoupChance() {
        const f = [], add = (label, v) => f.push({ label, v: Math.round(v) });
        const x = monarchX();
        add('기본', 15);
        if (x) add(`왕당파 의석 (${Math.round(backingSeats(x.c) * 100)}%)`, backingSeats(x.c) * 35);
        const loyal = militaryLoyalty();
        if (loyal != null) add(`군의 충성 (평균 ${Math.round(loyal)})`, (loyal - 50) * 0.5);
        add('입헌 정부 · 여당의 의석', -15 * seatShare(p => isGovParty(p) && !(x && backers(x.c).includes(p))));
        return { factors: f, chance: clamp(Math.round(f.reduce((a, y) => a + y.v, 0)), 5, 90) };
    }
    function republicChance(pid) {
        const f = [], add = (label, v) => f.push({ label, v: Math.round(v) });
        const x = monarchX();
        add('기본', 10);
        if (S.monarchy && S.monarchy.kind === 'absolute') add('전제 왕권에 대한 반감', 20);
        if (emergencyPowers?.martialLaw?.active) add('계엄령', 10);
        const p = partyById(pid);
        if (p) add(`${p.name} 지지율 (${support(p.id)}%)`, support(p.id) * 0.4);
        if (x) add(`왕당파 지지율 (${Math.round(backingSupport(x.c))}%)`, -backingSupport(x.c) * 0.3);
        if (S.dispute) add('계승 분쟁으로 흔들리는 왕실', 10);
        const loyal = militaryLoyalty();
        if (loyal != null) add(`군의 충성 (평균 ${Math.round(loyal)})`, -(loyal - 50) * 0.4);
        return { factors: f, chance: clamp(Math.round(f.reduce((a, y) => a + y.v, 0)), 5, 90) };
    }

    // ---- 행동 ----
    function logIt(kind, who, chance, success, effects) {
        const e = { id: uid(), at: Date.now(), date: formatNationDate(), kind, who, chance, success, effects };
        S.log.unshift(e); ui.lastId = e.id;
    }
    function done() { rerenderGov(); if (T62()) T62().refresh(); refresh(); }
    function restore() {
        const x = findClaimant(ui.claimantId);
        if (!x) { showCustomAlert('왕위에 올릴 주장자를 고르세요 (위 "왕가와 왕위 주장자"에서 먼저 만듭니다).'); return; }
        if (window.T63 && window.T63.partyState) { showCustomAlert('당-국가 체제에서는 먼저 민주 혁명으로 체제를 무너뜨려야 합니다.'); return; }
        if (ui.method === 'parliament') {
            const share = backingSeats(x.c);
            if (share <= 0.5) { showCustomAlert(`의회 결의로 왕정을 되살리려면 ${x.c.name || '주장자'}을(를) 지지하는 정당이 하원 과반이어야 합니다 (지금 ${Math.round(share * 100)}%). 쿠데타로 해 보세요.`); return; }
            showCustomConfirm(`의회 결의로 ${claimantLabel(x)}을(를) 입헌군주로 모십니다 (지지 정당 의석 ${Math.round(share * 100)}%). 계속하시겠습니까?`, () => {
                const fx = startMonarchy(x, 'constitutional');
                setConstitution(monarchyConstitution(x, 'constitutional'));
                fx.push(`왕정복고 — 입헌군주제, ${S.monarchy.title} ${x.c.name}`, '국가원수 = 군주 (상징적), 실권은 총리', '새 헌법 (입법 › 법령) · 대통령 선거 중단');
                logIt('restore', claimantLabel(x), null, true, fx); done();
            });
            return;
        }
        const { chance } = restorationChance(x);
        const kindName = ui.kind === 'absolute' ? '전제군주정' : '입헌군주제';
        showCustomConfirm(`왕당파 쿠데타로 ${claimantLabel(x)}을(를) 왕위에 올립니다 (${kindName}), 성공 확률 ${chance}%. 계속하시겠습니까?`, () => {
            const success = Math.random() * 100 < chance;
            let fx = [];
            if (success) {
                fx = startMonarchy(x, ui.kind);
                setConstitution(monarchyConstitution(x, ui.kind));
                if (ui.kind === 'absolute') {
                    declareMartialLaw();
                    fx.push(`왕정복고 — 숨겨진 정부 형태: 전제군주정, ${S.monarchy.title} ${x.c.name}`, '왕이 총리 임명 · 거부권 · 비상 권한', '계엄령 선포 · 왕국 기본법');
                } else fx.push(`왕정복고 — 입헌군주제, ${S.monarchy.title} ${x.c.name}`, '새 헌법 (입법 › 법령) · 대통령 선거 중단');
            } else {
                backers(x.c).forEach(p => { p.status = 'banned'; cutSupport(p.id, 0.5); });
                fx.push('쿠데타 실패 — 왕당파 정당 활동 금지 · 지지율 절반', `${x.c.name || '주장자'} 망명`);
            }
            logIt('restoreCoup', claimantLabel(x), chance, success, fx); done();
        });
    }
    function selfCoup() {
        const x = monarchX();
        if (!S.monarchy || S.monarchy.kind !== 'constitutional' || !x) return;
        const { chance } = selfCoupChance();
        showCustomConfirm(`${S.monarchy.title} ${x.c.name}이(가) 친위 쿠데타로 의회를 누르고 전제군주정을 세웁니다, 성공 확률 ${chance}%. 계속하시겠습니까?`, () => {
            const success = Math.random() * 100 < chance;
            const fx = [];
            if (success) {
                makeAbsolute(); declareMartialLaw();
                setConstitution(monarchyConstitution(x, 'absolute'));
                // 왕을 지지하지 않는 정당은 활동 금지 (공화 혁명 · 입헌 개혁 때 복권)
                const keep = new Set(backers(x.c).map(p => String(p.id)));
                parties.forEach(p => { if (!keep.has(String(p.id)) && activeParty(p)) { p.status = 'banned'; S.monarchy.banned.push(p.id); } });
                fx.push('숨겨진 정부 형태: 전제군주정 — 왕이 총리 임명 · 거부권 · 비상 권한', '계엄령 선포 · 왕국 기본법', `반왕당 정당 ${S.monarchy.banned.length}곳 활동 금지`);
            } else {
                const next = succession(true);
                fx.push(`실패 — ${S.monarchy && x ? `${x.c.name} 퇴위` : '왕 퇴위'}`, ...(next ? [`${next}`] : ['계승자가 없어 왕위가 비었습니다']));
            }
            logIt('selfCoup', x.c.name, chance, success, fx); done();
        });
    }
    function reform() {
        if (!S.monarchy || S.monarchy.kind !== 'absolute') return;
        showCustomConfirm('입헌 개혁 — 왕이 실권을 내놓고 입헌군주제로 돌아갑니다 (계엄 해제 · 활동 금지 정당 복권 · 새 헌법). 계속하시겠습니까?', () => {
            const x = monarchX();
            makeConstitutional(); liftMartialLaw();
            (S.monarchy.banned || []).forEach(id => { const p = partyById(id); if (p && p.status === 'banned') p.status = 'active'; });
            S.monarchy.banned = [];
            if (x) setConstitution(monarchyConstitution(x, 'constitutional'));
            logIt('reform', x ? x.c.name : '', null, true, ['입헌군주제로 — 국왕은 상징, 실권은 총리', '계엄 해제 · 활동 금지 정당 복권 · 새 헌법']); done();
        });
    }
    function revolt() {
        if (!S.monarchy) return;
        const p = partyById(ui.repParty);
        const { chance } = republicChance(ui.repParty);
        showCustomConfirm(`공화 혁명을 일으킵니다${p ? ` — 혁명 정당: ${p.name}` : ''} (성공하면 ${GOV_NAME[ui.repGov]}), 성공 확률 ${chance}%. 계속하시겠습니까?`, () => {
            const success = Math.random() * 100 < chance;
            const x = monarchX();
            const fx = [];
            if (success) {
                const before = nationName();
                endMonarchy(ui.repGov);
                if (nationName() !== before) fx.push(`국호 변경: ${before} → ${nationName()}`);
                setConstitution(republicConstitution(ui.repGov));
                fx.push(`군주제 폐지 — ${GOV_NAME[ui.repGov]} 공화국`, `${x ? `${x.c.name}은(는) 왕위 주장자로 남음` : ''}`, '새 공화국 헌법 · 계엄 해제 · 활동 금지 정당 복권', `${effRoleLabel('president')} 공석 — 선거로 뽑으세요`);
                if (p) cutSupport(p.id, 1.2);
            } else {
                if (p) { p.status = 'banned'; cutSupport(p.id, 0.5); S.monarchy.banned.push(p.id); fx.push(`${p.name} 활동 금지 · 지지율 절반`); }
                declareMartialLaw(); fx.push('왕정이 계엄령 선포');
            }
            logIt('republic', p ? p.name : '시민 혁명', chance, success, fx.filter(Boolean)); done();
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
        return `${S.monarchy.title} ${next.name} 즉위 (${nd.name})${nd !== (x && x.d) ? ' — 왕가 교체' : ''}`;
    }
    function demise() {
        const x = monarchX();
        if (!S.monarchy || !x) return;
        showCustomConfirm(`${S.monarchy.title} ${x.c.name}의 서거 · 퇴위 — 계승 규칙(${RULES[x.d.rule] || ''})대로 다음 계승자가 즉위합니다. 계속하시겠습니까?`, () => {
            const msg = succession();
            logIt('succession', x.c.name, null, true, [`${x.c.name} 서거 · 퇴위`, msg || '계승자가 없어 왕위가 비었습니다']); done();
        });
    }
    function claimDispute() {
        const r = findClaimant(ui.rivalId), x = monarchX();
        if (!r || !x || r.c.id === x.c.id) { showCustomAlert('정통 왕위를 주장할 다른 주장자를 고르세요.'); return; }
        S.dispute = { rivalId: r.c.id, since: formatNationDate() };
        logIt('dispute', claimantLabel(r), null, true, [`${r.c.name}이(가) 정통 왕위를 주장 — 계승 분쟁 시작`, `지지: ${backers(r.c).map(p => p.name).join(', ') || '없음'}`]); done();
    }
    function resolveDispute(how) {
        const r = S.dispute && findClaimant(S.dispute.rivalId), x = monarchX();
        if (!r || !x) { S.dispute = null; refresh(); return; }
        const sx = strength(x.c), sr = strength(r.c);
        let rivalWins, chance = null;
        if (how === 'parliament') rivalWins = backingSeats(r.c) > backingSeats(x.c);
        else {
            let w = sr / Math.max(1, sx + sr);
            const t61 = T62();
            if (t61 && t61.military && t61.military.length) {
                const al = side => t61.military.filter(m => backers(side).some(p => String(p.id) === String(m.partyId))).length;
                w = clamp(w + (al(r.c) - al(x.c)) * 0.08, 0.05, 0.95);
            }
            chance = Math.round(w * 100);
            rivalWins = Math.random() < w;
        }
        const fx = [];
        if (rivalWins) {
            seatMonarch(r);
            backers(x.c).forEach(p => cutSupport(p.id, 0.8));
            fx.push(`${r.c.name} 승리 — ${S.monarchy.title} 즉위 (${r.d.name})`, `${x.c.name}의 지지 정당 지지율 하락`);
        } else {
            backers(r.c).forEach(p => cutSupport(p.id, 0.8));
            fx.push(`${x.c.name} 왕위 지킴`, `${r.c.name}의 지지 정당 지지율 하락`);
        }
        S.dispute = null;
        logIt(how === 'parliament' ? 'disputeVote' : 'disputeWar', `${x.c.name} vs ${r.c.name}`, chance, true, fx); done();
    }

    // ---- 직책 이름 · 대통령 선거 ----
    const origRole = window.effRoleLabel;
    window.effRoleLabel = function (key) {
        if (S.monarchy && key === 'president') return S.monarchy.title || '국왕';
        return origRole.apply(this, arguments);
    };
    if (typeof window.runPresidentialElection === 'function') {
        const origPres = window.runPresidentialElection;
        window.runPresidentialElection = function () {
            if (S.monarchy) { showCustomAlert(`군주제에서는 국가원수(${S.monarchy.title})를 선거로 뽑지 않습니다 — 내각 › 왕실에서 계승 · 공화 혁명을 다룹니다.`); return; }
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
        bar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('cabinet','royal')" id="subTabRoyal">왕실</button>`), before);
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
            let b = document.getElementById('t66Banner');
            const x = monarchX();
            if (S.monarchy) {
                if (!b) { b = el('<div id="t66Banner" class="t66-banner"></div>'); grid.parentElement.insertBefore(b, grid); }
                b.innerHTML = `👑 ${S.monarchy.kind === 'absolute' ? '전제군주정' : '입헌군주제'} — ${esc(S.monarchy.title)} <b>${esc(x ? x.c.name : '(공석)')}</b>${x ? ` · ${esc(x.d.name)}` : ''}${S.monarchy.since ? ` · ${esc(S.monarchy.since)}부터` : ''}${S.dispute ? ' · ⚔ 계승 분쟁 중' : ''}`;
                b.style.setProperty('--t66-c', (x && x.d.color) || '#7a1f2b');
            } else if (b) b.remove();
        }
        return r;
    };

    // ---- 화면 ----
    function chanceBox({ factors, chance }) {
        return `<div class="t66-chance"><div class="t66-chance-head"><span>성공 확률</span><b>${chance}%</b></div>
            <div class="t66-bar"><span style="width:${chance}%"></span></div>
            ${factors.map(f => `<div class="t66-factor"><span>${esc(f.label)}</span><span class="${f.v >= 0 ? 't66-plus' : 't66-minus'}">${f.v >= 0 ? '+' : ''}${f.v}%p</span></div>`).join('')}</div>`;
    }
    const KIND_NAME = { restore: '왕정복고 (의회 결의)', restoreCoup: '왕정복고 (쿠데타)', selfCoup: '친위 쿠데타', reform: '입헌 개혁', republic: '공화 혁명', succession: '계승', dispute: '계승 분쟁', disputeVote: '분쟁 — 의회 표결', disputeWar: '분쟁 — 내전' };
    function dynastiesHtml() {
        const mx = monarchX();
        return S.dynasties.map(d => {
            const line = lineOf(d, mx && mx.c.id);
            const rank = id => { const i = line.findIndex(c => c.id === id); return i < 0 ? null : i + 1; };
            return `<div class="t66-dyn" style="--t66-c:${esc(d.color)}" data-dyn="${esc(d.id)}">
                <div class="t66-row">
                    <input type="color" value="${esc(d.color)}" data-df="color" title="왕가 색">
                    <input type="text" value="${esc(d.name)}" data-df="name" placeholder="왕가 이름 (예: 호엔촐레른가)" class="t66-grow">
                    <button type="button" class="t66-x" data-dact="del" title="왕가 지우기">✕</button>
                </div>
                <div class="t66-row"><span class="t66-dim">계승 규칙</span><select data-df="rule" class="t66-grow">${Object.entries(RULES).map(([k, t]) => `<option value="${k}" ${d.rule === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
                <div id="t66Cl_${esc(d.id)}" class="t66-claimants">
                ${d.claimants.map(c => {
                    const isKing = mx && mx.c.id === c.id, r = rank(c.id);
                    return `<div class="t66-cl ${isKing ? 'king' : ''}" data-cl="${esc(c.id)}">
                        <span class="drag-handle t66-handle" title="끌어서 순서(출생 순) 바꾸기">⋮⋮</span>
                        <label class="leader-photo-box t66-photo" title="사진">${c.photo ? `<img src="${c.photo}" alt="">` : '<div class="photo-ph">👤</div>'}<input type="file" accept="image/*" data-cf="photo"></label>
                        <div class="t66-cl-main">
                            <div class="t66-row">
                                <span class="t66-rank">${isKing ? '👑' : r ? `${r}위` : '—'}</span>
                                <input type="text" value="${esc(c.name)}" data-cf="name" placeholder="이름" class="t66-grow">
                                <select data-cf="gender" title="성별"><option value="m" ${c.gender !== 'f' ? 'selected' : ''}>남</option><option value="f" ${c.gender === 'f' ? 'selected' : ''}>여</option></select>
                                <button type="button" class="t66-x" data-cact="del" title="빼기">✕</button>
                            </div>
                            <input type="text" value="${esc(c.title)}" data-cf="title" placeholder="칭호 (예: 프로이센 왕자)">
                            <div class="t66-chips">${(c.partyIds || []).map(pid => { const p = partyById(pid); return p ? `<span class="t66-chip" style="--pc:${esc(p.color)}">${esc(p.abbr || p.name)}<button type="button" data-unback="${esc(pid)}" title="지지 철회">×</button></span>` : ''; }).join('')}
                                <select data-cf="back" class="t66-back"><option value="">+ 지지 정당</option>${parties.filter(p => !isInd(p) && !(c.partyIds || []).map(String).includes(String(p.id))).map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
                </div>
                <button type="button" class="t66-add" data-dact="addcl">[+] 주장자 추가</button>
            </div>`;
        }).join('');
    }
    function render() {
        const box = document.getElementById('contentRoyal');
        if (!box) return;
        const mx = monarchX();
        const claimOpts = sel => allClaimants().map(({ c, d }) => `<option value="${esc(c.id)}" ${c.id === sel ? 'selected' : ''}>${esc(c.name || '(이름 없음)')} · ${esc(d.name)} · 지지 ${Math.round(backingSeats(c) * 100)}%</option>`).join('');
        if (!allClaimants().some(x => x.c.id === ui.claimantId)) ui.claimantId = (allClaimants().sort((a, b) => strength(b.c) - strength(a.c))[0] || { c: {} }).c.id || '';
        let action = '';
        if (!S.monarchy) {
            const x = findClaimant(ui.claimantId);
            action = `<div class="t66-card">
                <div class="t66-head">👑 왕정복고</div>
                <div class="t66-dim">공화정에서 군주제를 되살립니다. 주장자를 지지하는 정당이 하원 과반이면 의회 결의로, 아니면 왕당파 쿠데타로.</div>
                ${allClaimants().length ? `<select data-ui="claimantId">${claimOpts(ui.claimantId)}</select>` : '<div class="t66-dim">먼저 아래에서 왕가와 주장자를 만드세요.</div>'}
                <div class="system-radio-group"><button type="button" class="system-radio-btn ${ui.method === 'parliament' ? 'active' : ''}" data-method="parliament">의회 결의</button><button type="button" class="system-radio-btn ${ui.method === 'coup' ? 'active' : ''}" data-method="coup">쿠데타</button></div>
                ${ui.method === 'parliament' ? `<div class="t66-dim">지지 정당 의석: <b>${x ? Math.round(backingSeats(x.c) * 100) : 0}%</b> — 50%를 넘으면 주사위 없이 입헌군주제로</div>`
                    : `<div class="system-radio-group"><button type="button" class="system-radio-btn ${ui.kind === 'constitutional' ? 'active' : ''}" data-kind="constitutional">입헌군주제</button><button type="button" class="system-radio-btn ${ui.kind === 'absolute' ? 'active' : ''}" data-kind="absolute">전제군주정</button></div>${chanceBox(restorationChance(x))}`}
                <button type="button" class="t66-go" data-act="restore" ${allClaimants().length ? '' : 'disabled'}>👑 왕정복고</button>
            </div>`;
        } else {
            const abs = S.monarchy.kind === 'absolute';
            const rival = S.dispute && findClaimant(S.dispute.rivalId);
            const rivals = allClaimants().filter(y => !mx || y.c.id !== mx.c.id);
            if (!rivals.some(y => y.c.id === ui.rivalId)) ui.rivalId = (rivals[0] || { c: {} }).c.id || '';
            const repParties = parties.filter(activeParty);
            action = `<div class="t66-card t66-reign" style="--t66-c:${esc((mx && mx.d.color) || '#7a1f2b')}">
                <div class="t66-head">👑 ${abs ? '전제군주정' : '입헌군주제'}</div>
                <div class="t66-row"><span class="t66-dim">칭호</span><select data-ui="title">${[...new Set([S.monarchy.title, ...TITLES])].map(t => `<option ${t === S.monarchy.title ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>
                    <b class="t66-grow">${esc(mx ? mx.c.name : '(공석)')}</b><span class="t66-dim">${esc(mx ? mx.d.name : '')}${S.monarchy.since ? ` · ${esc(S.monarchy.since)}부터` : ''}</span></div>
                <div class="t66-dim">${abs ? '왕이 총리를 임명하고(내각 › 총리) 거부권 · 비상 권한을 모두 쥡니다. 의회는 협찬 기관입니다.' : '국왕은 상징적 국가원수이고 실권은 총리에게 있습니다 (의원내각제처럼).'}</div>
                <div class="t66-sub">계승</div>
                <div class="t66-dim">다음 계승자: <b>${(() => { const n = mx ? lineOf(mx.d, mx.c.id)[0] : null; return n ? esc(n.name || '(이름 없음)') : '없음 — 다른 왕가에서'; })()}</b> (${esc(mx ? RULES[mx.d.rule] || '' : '')})</div>
                <button type="button" class="t66-btn" data-act="demise">⚱ 서거 · 퇴위 → 다음 계승자 즉위</button>
                <div class="t66-sub">계승 분쟁</div>
                ${rival ? `<div class="t66-vs"><span>👑 ${esc(mx ? mx.c.name : '')}<small>지지 의석 ${mx ? Math.round(backingSeats(mx.c) * 100) : 0}%</small></span><b>vs</b><span>⚔ ${esc(rival.c.name)}<small>지지 의석 ${Math.round(backingSeats(rival.c) * 100)}%</small></span></div>
                    <div class="t66-row"><button type="button" class="t66-btn" data-act="vote">의회 표결로 결판</button><button type="button" class="t66-btn" data-act="war">내전으로 결판 (주사위)</button></div>`
                    : rivals.length ? `<div class="t66-row"><select data-ui="rivalId" class="t66-grow">${rivals.map(({ c, d }) => `<option value="${esc(c.id)}" ${c.id === ui.rivalId ? 'selected' : ''}>${esc(c.name || '(이름 없음)')} · ${esc(d.name)}</option>`).join('')}</select><button type="button" class="t66-btn" data-act="dispute">정통 왕위 주장</button></div>`
                    : '<div class="t66-dim">왕위를 다툴 다른 주장자가 없습니다.</div>'}
                <div class="t66-sub">${abs ? '입헌 개혁 · 공화 혁명' : '친위 쿠데타 · 공화 혁명'}</div>
                ${abs ? '<button type="button" class="t66-btn" data-act="reform">⚖ 입헌 개혁 (입헌군주제로)</button>'
                    : `${chanceBox(selfCoupChance())}<button type="button" class="t66-btn" data-act="selfcoup">⚔ 친위 쿠데타 (전제군주정으로)</button>`}
                <div class="t66-row"><select data-ui="repParty" class="t66-grow"><option value="">— 시민 혁명 (정당 없음) —</option>${repParties.map(p => `<option value="${esc(p.id)}" ${String(p.id) === String(ui.repParty) ? 'selected' : ''}>${esc(p.name)} · 지지율 ${support(p.id)}%</option>`).join('')}</select>
                    <select data-ui="repGov">${['parliamentary', 'presidential', 'semi'].map(g => `<option value="${g}" ${ui.repGov === g ? 'selected' : ''}>${GOV_NAME[g]}</option>`).join('')}</select></div>
                ${chanceBox(republicChance(ui.repParty))}
                <button type="button" class="t66-go" data-act="republic">✊ 공화 혁명</button>
            </div>`;
        }
        const last = S.log.find(x => x.id === ui.lastId);
        box.innerHTML = `<div class="t66-intro">왕가와 왕위 주장자를 정하고, 왕정복고 · 계승 · 계승 분쟁 · 친위 쿠데타 · 공화 혁명을 다룹니다. 주장자 순서(⋮⋮ 끌기)가 출생 순이고, 계승 규칙에 따라 계승 순위가 정해져요.</div>
            ${action}
            ${last ? `<div class="t66-result ${last.success ? 'ok' : 'fail'}"><div class="t66-head">${last.success ? '✔' : '✘'} ${esc(KIND_NAME[last.kind] || last.kind)}${last.chance != null ? ` <span class="t66-dim">(확률 ${last.chance}%)</span>` : ''}</div><ul>${(last.effects || []).map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
            <div class="t66-sub">왕가와 왕위 주장자</div>
            ${dynastiesHtml()}
            <div class="t66-row"><button type="button" class="t66-add" data-act="adddyn">[+] 왕가 추가</button>${S.dynasties.length ? '' : '<button type="button" class="t66-add" data-act="seed">[+] 예시 왕가 만들기</button>'}</div>
            ${S.log.length ? `<details class="t66-log"><summary>왕실 기록 (${S.log.length})</summary>${S.log.map(x => `<div class="t66-log-row"><span class="${x.success ? 't66-plus' : 't66-minus'}">${x.success ? '✔' : '✘'}</span><span>${esc(KIND_NAME[x.kind] || x.kind)} · ${esc(x.who || '')}${x.date ? ` · ${esc(x.date)}` : ''}${x.chance != null ? ` · ${x.chance}%` : ''}</span></div>`).join('')}</details>` : ''}`;
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
        on('[data-act="adddyn"]', () => { S.dynasties.push({ id: uid(), name: '새 왕가', color: PALETTE[S.dynasties.length % PALETTE.length], rule: 'male', claimants: [] }); render(); });
        on('[data-act="seed"]', seed);
        box.querySelectorAll('.t66-dyn').forEach(card => {
            const d = S.dynasties.find(x => x.id === card.dataset.dyn); if (!d) return;
            card.querySelectorAll('[data-df]').forEach(i => { i.onchange = () => { d[i.dataset.df] = i.value; render(); rerenderGov(); }; });
            card.querySelector('[data-dact="del"]').onclick = () => {
                if (S.monarchy && S.monarchy.dynastyId === d.id) { showCustomAlert('지금 왕위에 있는 왕가는 지울 수 없습니다.'); return; }
                showCustomConfirm(`"${d.name}" 왕가를 지울까요? 주장자 ${d.claimants.length}명도 함께 지워집니다.`, () => { S.dynasties = S.dynasties.filter(x => x !== d); render(); });
            };
            card.querySelector('[data-dact="addcl"]').onclick = () => { d.claimants.push({ id: uid(), name: '', title: '', gender: 'm', photo: '', partyIds: [] }); render(); };
            card.querySelectorAll('.t66-cl').forEach(row => {
                const c = d.claimants.find(x => x.id === row.dataset.cl); if (!c) return;
                row.querySelectorAll('[data-cf]').forEach(i => {
                    const f = i.dataset.cf;
                    if (f === 'photo') i.onchange = () => { const file = i.files && i.files[0]; if (!file) return; const rd = new FileReader(); rd.onload = e => { c.photo = e.target.result; if (monarchX() && monarchX().c === c) president.photo = c.photo; render(); rerenderGov(); }; rd.readAsDataURL(file); };
                    else if (f === 'back') i.onchange = () => { if (i.value) { c.partyIds = [...new Set([...(c.partyIds || []), i.value])]; render(); } };
                    else i.onchange = () => { c[f] = i.value; if (f === 'name' && monarchX() && monarchX().c === c) { president.name = c.name; rerenderGov(); } render(); };
                });
                row.querySelectorAll('[data-unback]').forEach(b => { b.onclick = () => { c.partyIds = c.partyIds.filter(x => String(x) !== String(b.dataset.unback)); render(); }; });
                row.querySelector('[data-cact="del"]').onclick = () => {
                    if (monarchX() && monarchX().c === c) { showCustomAlert('지금 왕위에 있는 사람은 뺄 수 없습니다 — "서거 · 퇴위"를 쓰세요.'); return; }
                    d.claimants = d.claimants.filter(x => x !== c); render();
                };
                const h = row.querySelector('.t66-handle');
                if (h && typeof startDragReorder === 'function') startDragReorder(h, `t66Cl_${d.id}`, '.t66-cl', d.claimants, render);
            });
        });
    }
    // 예시 왕가 — 독일이면 호엔촐레른 · 비텔스바흐 (1983년 무렵의 가주들), 아니면 일반 예시
    function seed() {
        const de = /독일|Germany/.test(nationName());
        const mk = (name, color, rule, list) => ({ id: uid(), name, color, rule, claimants: list.map(([n, t, g]) => ({ id: uid(), name: n, title: t, gender: g || 'm', photo: '', partyIds: [] })) });
        S.dynasties = de ? [
            mk('호엔촐레른가', '#3a3a3a', 'salic', [['루이 페르디난트', '프로이센 왕자 · 가주'], ['크리스티안지기스문트', '프로이센 왕자'], ['게오르크 프리드리히', '프로이센 왕자']]),
            mk('비텔스바흐가', '#1f6fb3', 'salic', [['알브레히트', '바이에른 공작 · 가주'], ['프란츠', '바이에른 공작'], ['막스', '바이에른 공작']]),
        ] : [
            mk('왕가 1', PALETTE[0], 'male', [['왕위 주장자', '왕세자'], ['둘째', '왕자'], ['셋째', '공주', 'f']]),
            mk('왕가 2', PALETTE[1], 'equal', [['다른 주장자', '대공']]),
        ];
        render();
    }

    window.T66 = { get monarchy() { return S.monarchy; }, get dispute() { return S.dispute; }, get log() { return S.log; }, get dynasties() { return S.dynasties; } };
    function refresh() {
        render();
        try { window.renderCabinetDisplay && window.renderCabinetDisplay(); } catch (e) { /* 화면 준비 전 */ }
    }

    const style = document.createElement('style');
    style.textContent = `
        .t66-intro { color: #777; font-size: .78rem; line-height: 1.6; margin: 8px 0 10px; }
        .t66-row { display: flex; align-items: center; gap: 6px; margin: 4px 0; flex-wrap: wrap; }
        .t66-grow { flex: 1; min-width: 0; }
        .t66-dim { color: #777; font-size: .8rem; }
        .t66-sub { color: #888; font-size: .78rem; margin: 12px 0 6px; letter-spacing: 1px; }
        .t66-card { border: 1px solid #333; padding: 10px; margin: 6px 0 12px; background: rgba(255,255,255,.02); display: flex; flex-direction: column; gap: 6px; }
        .t66-card select { width: 100%; box-sizing: border-box; }
        .t66-reign { border-color: var(--t66-c); box-shadow: inset 4px 0 0 var(--t66-c); }
        .t66-head { font-size: 1rem; color: #e0b030; letter-spacing: 1px; }
        .t66-chance { border: 1px solid #333; padding: 8px; background: rgba(255,255,255,.02); }
        .t66-chance-head { display: flex; justify-content: space-between; align-items: baseline; color: #aaa; }
        .t66-chance-head b { font-size: 1.4rem; color: #e0b030; }
        .t66-bar { height: 7px; background: #222; margin: 5px 0 6px; } .t66-bar span { display: block; height: 100%; background: #e0b030; }
        .t66-factor { display: flex; justify-content: space-between; gap: 8px; font-size: .76rem; color: #999; padding: 1px 0; }
        .t66-plus { color: #5fbf7f; } .t66-minus { color: #e06060; }
        .t66-go { width: 100%; cursor: pointer; font-family: inherit; font-size: 1rem; padding: 9px; background: transparent; border: 2px solid #e0b030; color: #e0b030; letter-spacing: 1px; }
        .t66-go:disabled { opacity: .4; cursor: default; }
        .t66-btn, .t66-add { cursor: pointer; font-family: inherit; font-size: .82rem; padding: 5px 10px; background: transparent; border: 1px solid #555; color: #ccc; }
        .t66-add { border-style: dashed; color: #888; }
        .t66-x { cursor: pointer; background: transparent; border: 1px solid #333; color: #777; font-family: inherit; padding: 2px 8px; }
        .t66-vs { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px; border: 1px dashed #555; }
        .t66-vs span { display: flex; flex-direction: column; } .t66-vs small { color: #888; font-size: .72rem; } .t66-vs b { color: #e06060; }
        .t66-dyn { border: 1px solid #333; border-left: 5px solid var(--t66-c); padding: 8px; margin-bottom: 10px; background: rgba(255,255,255,.02); }
        .t66-dyn input[type=color] { width: 34px; height: 28px; padding: 0; border: 1px solid #333; background: none; }
        .t66-claimants { display: flex; flex-direction: column; gap: 6px; margin: 6px 0; }
        .t66-cl { display: flex; gap: 8px; align-items: flex-start; padding: 6px; border: 1px solid #2a2a2a; background: rgba(0,0,0,.2); }
        .t66-cl.king { border-color: #e0b030; box-shadow: 0 0 8px rgba(224,176,48,.25); }
        .t66-handle { align-self: center; }
        .t66-photo { width: 44px; height: 56px; flex-shrink: 0; } .t66-photo img { width: 100%; height: 100%; object-fit: cover; }
        .t66-cl-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
        .t66-cl-main input[type=text] { min-width: 0; box-sizing: border-box; }
        .t66-cl-main > input[type=text] { width: 100%; }
        .t66-cl-main .t66-row { flex-wrap: nowrap; margin: 0; }
        .t66-cl-main .t66-row select { width: auto; flex: 0 0 auto; min-width: 0; padding-left: 4px; padding-right: 4px; }
        .t66-cl-main .t66-row .t66-x { flex: 0 0 auto; }
        .t66-chips select.t66-back { width: auto; }
        .t66-rank { min-width: 2.2em; font-size: .78rem; color: #e0b030; text-align: center; }
        .t66-chips { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
        .t66-chip { display: inline-flex; align-items: center; gap: 3px; font-size: .72rem; padding: 1px 4px 1px 6px; border: 1px solid var(--pc); color: #ddd; border-left-width: 4px; }
        .t66-chip button { cursor: pointer; background: none; border: none; color: #888; padding: 0 2px; font-family: inherit; }
        .t66-back { font-size: .74rem; max-width: 9.5em; }
        .t66-result { margin: 4px 0 10px; padding: 8px 10px; border: 1px solid #333; border-left: 4px solid #888; }
        .t66-result.ok { border-left-color: #5fbf7f; } .t66-result.fail { border-left-color: #e06060; }
        .t66-result ul { margin: 6px 0 0 18px; padding: 0; font-size: .8rem; color: #bbb; }
        .t66-log { margin-top: 12px; font-size: .82rem; } .t66-log summary { cursor: pointer; color: #999; }
        .t66-log-row { display: flex; gap: 6px; padding: 3px 0; color: #aaa; border-bottom: 1px solid #1c1c1c; }
        .t66-banner { margin: 0 0 10px; padding: 8px 12px; border: 1px solid var(--t66-c, #7a1f2b); border-left-width: 5px; color: #e0b030; font-size: .9rem; background: color-mix(in srgb, var(--t66-c, #7a1f2b) 18%, transparent); letter-spacing: 1px; }
        html[data-theme-family="modern"] .t66-intro, html[data-theme-family="modern"] .t66-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .t66-card, html[data-theme-family="modern"] .t66-dyn, html[data-theme-family="modern"] .t66-chance { border-color: var(--m-border); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .t66-reign { border-color: var(--t66-c); }
        html[data-theme-family="modern"] .t66-dyn { border-left: 5px solid var(--t66-c); }
        html[data-theme-family="modern"] .t66-cl { border-color: var(--m-border); background: var(--m-surface); border-radius: 8px; }
        html[data-theme-family="modern"] .t66-head, html[data-theme-family="modern"] .t66-chance-head b, html[data-theme-family="modern"] .t66-rank { color: #b07d10; }
        html[data-theme-family="modern"] .t66-bar { background: var(--m-border); border-radius: 4px; overflow: hidden; } html[data-theme-family="modern"] .t66-bar span { background: #c9971a; }
        html[data-theme-family="modern"] .t66-factor, html[data-theme-family="modern"] .t66-chance-head { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t66-go { border-color: #c9971a; color: #b07d10; border-radius: 12px; font-weight: 600; letter-spacing: 0; }
        html[data-theme-family="modern"] .t66-btn, html[data-theme-family="modern"] .t66-add, html[data-theme-family="modern"] .t66-x { border-color: var(--m-border-strong); color: var(--m-text); border-radius: 8px; }
        html[data-theme-family="modern"] .t66-chip { color: var(--m-text); border-radius: 6px; }
        html[data-theme-family="modern"] .t66-result { border-color: var(--m-border); border-radius: 10px; background: var(--m-surface); } html[data-theme-family="modern"] .t66-result ul { color: var(--m-text-2); }
        html[data-theme-family="modern"] .t66-log-row { color: var(--m-text-2); border-bottom-color: var(--m-border); }
        html[data-theme-family="modern"] .t66-banner { border-radius: 12px; color: #8a6200; background: color-mix(in srgb, var(--t66-c, #7a1f2b) 10%, var(--m-surface)); }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refresh, 0));
})();
