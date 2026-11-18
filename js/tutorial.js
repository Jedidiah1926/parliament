// ===== Hemicycle — 튜토리얼(조작법 안내) =====
// "서독"(1983년 독일연방공화국) 튜토리얼 프리셋으로 시작하면 자동으로 켜지는 단계별 안내. 짧은 과정(#1 · #2 · #3 …)으로 나뉘어 있고,
// 과정은 기본 튜토리얼(핵심 흐름, 순서대로)과 세부 튜토리얼(기능별, 골라서)로 나뉜다.
// 각 단계마다 화면의 한 곳을 밝게 비추고(나머지는 어둡게) 옆에 설명 말풍선을 띄운다.
// 필요한 탭은 단계에 들어갈 때 알아서 연다.
//
// 단계는 두 종류다:
//   - 설명 단계: 읽고 "다음"으로 넘어간다. 아래 화면은 누를 수 없다(실수로 설정이 바뀌지 않게).
//   - 실습 단계(task): 비춘 곳을 직접 조작해 실제로 값이 바뀌어야 "다음"이 열린다.
//     이때는 allow로 정한 영역(과 말풍선·확인창)만 누를 수 있고 나머지는 막는다.
// 과정을 마치면 완료 카드(다음 과정 시작 / 나중에)가 뜨고, 마친 과정은 localStorage에 기록돼 목차에 ✓로 표시된다.
// 말풍선 버튼 또는 ←/→/Esc로 조작한다 (입력 칸에 글자를 치는 중에는 키를 가로채지 않음).
(function () {
    'use strict';

    const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); // innerHTML에 넣는 글자
    const DONE_KEY = 'hemiTutorialDone';          // 예전 기록(과정 순서 번호)
    const DONE_IDS_KEY = 'hemiTutorialDoneIds';   // 지금 기록(과정 id)
    const hasEl = id => !!document.getElementById(id);
    // 메뉴: 세로 사이드바 (없으면 원래 가로 탭 줄)
    const navTarget = () => (hasEl('sideNav') ? '#sideNav' : '.main-tab-container');
    const execOn = () => document.documentElement.getAttribute('data-exec-btn') === 'on';
    const execTarget = () => '.simulate-btn';
    const call = (name, ...args) => () => { if (typeof window[name] === 'function') window[name](...args); };
    const go = (main, sub) => call('switchSubTab', main, sub);

    // ---- 앱 상태 읽기 (main.js의 최상위 let 변수는 window 속성이 아니라 이름으로만 보인다) ----
    /* global parties, bills */
    const partyList = () => (typeof parties !== 'undefined' && Array.isArray(parties)) ? parties : [];
    const billList = () => (typeof bills !== 'undefined' && Array.isArray(bills)) ? bills : [];
    const isActive = id => { const el = document.getElementById(id); return !!el && el.classList.contains('active'); };

    // 실습 중 만든 것들을 단계 사이에 이어 쓰기 위한 기록
    const T = {};
    function resetProgress() { T.basePartyIds = null; T.newPartyId = null; T.billBase = null; T.execClicked = false; T.probBase = null; T.cabinetBase = null; T.totalBase = null; T.dateBase = null; }
    const tutParty = () => partyList().find(p => p.id === T.newPartyId) || null;
    const tutPartyIdx = () => partyList().findIndex(p => p.id === T.newPartyId);
    // 정당 › 정보 목록에서 새 정당의 이름 칸 / 구성 › 하원 목록에서 새 정당의 의석 칸
    const nameInput = () => {
        const idx = tutPartyIdx();
        if (idx < 0) return null;
        return [...document.querySelectorAll('#partyInfoList input[type="text"]')]
            .find(el => (el.getAttribute('onchange') || '').startsWith(`updateParty(${idx},'name'`)) || null;
    };
    const seatInput = () => {
        const card = T.newPartyId != null && document.querySelector(`#partyListHouse [data-pid="${T.newPartyId}"]`);
        return card ? card.querySelector('input[type="number"]') : null;
    };
    const billForm = () => { const t = document.getElementById('newBillTitle'); return t ? t.closest('.vote-panel') : null; };
    /* global cabinetMembers, elecRunning */
    const cabinetList = () => (typeof cabinetMembers !== 'undefined' && Array.isArray(cabinetMembers)) ? cabinetMembers : [];
    const visible = sel => { const el = document.querySelector(sel); return !!el && el.offsetParent !== null && getComputedStyle(el).display !== 'none'; };
    const probInputs = () => [...document.querySelectorAll('#elecInputList input[type="number"]')]
        .filter(el => /^elecSetProb\(/.test(el.getAttribute('oninput') || el.getAttribute('onchange') || ''));
    const electionStarted = () => (typeof elecRunning !== 'undefined' && elecRunning === true)
        || ['dispTabElecResultHouse', 'dispTabElecResultSenate', 'dispTabElecResultThird'].some(id => { const el = document.getElementById(id); return !!el && el.style.display !== 'none'; });
    // 의원내각제 자동 총리: 다수당 대표 (main.js의 pmAutoSource()가 정한 정당)
    /* global pmAutoSource */
    const majorityParty = () => {
        const src = typeof pmAutoSource === 'function' ? pmAutoSource() : null;
        return src && src.partyId != null ? partyList().find(p => p.id === src.partyId) || null : null;
    };
    const leaderInput = () => {
        const p = majorityParty();
        return p ? document.querySelector(`#leaderList input[onchange^="updateLeaderField(${p.id},'leaderName'"]`) : null;
    };
    const houseTotal = () => { const t = document.getElementById('houseTotal'); return t ? (parseInt(t.value, 10) || 0) : 0; };
    const freeHouseSeats = () => houseTotal() - partyList().reduce((sum, p) => sum + (p.inHouse ? (p.seatsHouse || 0) : 0), 0);
    const electionRunning = () => typeof elecRunning !== 'undefined' && elecRunning === true;
    // 개표 화면: 보이는 선거결과 패널
    const resultTarget = () => {
        const panel = ['House', 'Senate', 'Third'].map(c => document.getElementById('dispPanelElecResult' + c)).find(el => el && el.offsetParent !== null);
        if (!panel) return '.display-area';
        return panel.querySelector('.chamber-box') || panel;
    };
    const pmBlock = () => { const n = document.getElementById('pmNameInput'); return n ? n.parentElement.parentElement : null; };
    const seatCardOpen = () => { const c = document.getElementById('seatInfoCard'); return !!c && c.style.display === 'block'; };

    // ---- 1.5.7에서 추가된 화면(저장 창 · 날짜 줄 · 날짜/회기 창 · 개표 반영)용 도우미 ----
    /* global isSavePanelOpen, isDatePanelOpen, elecLastResult */
    const savePanelOpen = () => typeof isSavePanelOpen === 'function' && isSavePanelOpen();
    const datePanelOpen = () => typeof isDatePanelOpen === 'function' && isDatePanelOpen();
    const closePanels = () => { call('closeSavePanel')(); call('closeDatePanel')(); };
    // 개표 결과를 의회에 반영했는지 (개표를 안 했으면 이 단계는 건너뜀)
    const elecApplied = () => (typeof elecLastResult === 'undefined' || !elecLastResult) ? true : !!elecLastResult.applied;
    // id로 찾은 요소를 감싸는 가까운 블록 (없으면 그 요소 자체)
    // ---- 잠긴 과정 (다음 업데이트 미리보기 기능) ----
    // locked: '1.6.x' — 개발자 모드(설정 › 기타 설정)를 켜야 열리고, 그 기능이 있는 Teaser 화면에서 진행한다
    // (1.6.x → Teaser 1.6.x — 각 Teaser 화면은 1.6.1부터 그 버전까지의 기능을 담는다).
    // 그 화면이 아니면 해당 teaser 화면으로 옮겨 서독 튜토리얼로 시작한 뒤 그 과정을 바로 연다.
    /* global emergencyPowers, presElectionMode */
    const devOn = () => !!(window.HemiDev && window.HemiDev.isOn());
    const DEMO_BUILD = () => !!(window.HEMI_BUILD && window.HEMI_BUILD.demo); // Steam 데모 빌드 (맵 메이커 대신 맵 프리셋)
    // 미리보기 화면마다 담긴 기능 버전 (teaser6N은 1.6.1 ~ 1.6.N)
    const PAGE_HAS = {}; // 지금은 미리보기 화면이 없다 (1.6.9까지 본 게임에 들어감)
    const PREVIEW_PAGES = Object.keys(PAGE_HAS);
    const previewPageFor = l => (l && /^1\.6\.[1-9]$/.test(l.locked) ? '6' + l.locked.slice(-1) : '69'); // 그 기능이 처음 들어간 버전의 Teaser 화면
    const curPage = () => document.documentElement.getAttribute('data-teaser');
    // 지금 화면이 미리보기 화면인지 — 과정을 주면 그 과정의 기능이 있는 화면인지
    const onPreviewPage = l => PREVIEW_PAGES.includes(curPage()) && (!l || !l.locked || (PAGE_HAS[curPage()] || []).includes(l.locked));
    const previewName = l => `Teaser 1.6.${previewPageFor(l).slice(-1)}`;
    const unrecLeft = () => { try { return typeof window.isDistrictUnrecovered === 'function' && Object.keys(districtGrid.house || {}).some(k => window.isDistrictUnrecovered(k)); } catch (e) { return false; } };
    const histApi = () => window.HemiHistory || null;
    const vassalApi = () => window.HemiVassals || null;
    const econApi = () => window.HemiEconomy || null;
    const citCount = () => { const c = window.HemiPeople && window.HemiPeople.citizens; return c ? Object.values(c).reduce((n, o) => n + Object.keys(o || {}).length, 0) : 0; };
    const migSig = () => (window.HemiPeople ? JSON.stringify(window.HemiPeople.migrantVote) : '');
    const firstCitCard = () => { const c = document.querySelector('#districtListPanel .people-cit'); return c ? (c.closest('.drag-card-district') || c) : null; };
    const ecoTurn = () => { const t = econApi(); return t ? t.state.turn : 0; };
    const showEco = view => () => { const t = econApi(); if (t) { t.ensureInit(); t.showDisp(view); } };
    const firstVassalCard = () => document.querySelector('#contentVassals .vassal-card');
    const rankSig = () => { const t = histApi(); return t && t.ranking ? t.ranking.rows.map(r => `${r.id}:${r.score}`).join(',') : ''; };
    // 계엄령 권한 주체의 탭과 그 탭의 비상 권한 칸 (공성전 과정)
    const martialTab = () => ({ pm: ['pm', 'pmEmergencyPowers'], cabinet: ['cabinetmembers', 'cabinetEmergencyPowers'] })[typeof emergencyPowers !== 'undefined' && emergencyPowers.martialLaw.holder] || ['president', 'presidentEmergencyPowers'];
    const logLen = k => { const o = window[k]; return o && Array.isArray(o.log) ? o.log.length : 0; };
    const byId = (id, up) => () => { const el = document.getElementById(id); return el ? ((up && el.closest(up)) || el) : null; };
    const helpTarget = () => (document.querySelector('#sideNav .mn-group[data-tone="muted"]') ? '#sideNav .mn-group[data-tone="muted"]' : navTarget());

    // ---- 후보 단일화 · 부정선거 과정용 도우미 ----
    /* global candidateUnions */
    const unionList = () => (typeof candidateUnions !== 'undefined' && Array.isArray(candidateUnions)) ? candidateUnions : [];
    const unionSection = () => { const el = document.getElementById('candidateUnionList'); return el ? el.parentElement : '#contentElecCandidates'; };
    const lastUnionCard = () => { const cards = document.querySelectorAll('#candidateUnionList .cand-union'); return cards.length ? cards[cards.length - 1] : null; };
    const fraudCheckbox = () => document.querySelector('#fraudPartyList input[onchange^="toggleFraudAttempt"]');
    const fraudBlock = () => { const on = document.querySelector('#fraudPartyList input[onchange^="toggleFraudAttempt"]:checked'); return on ? on.closest('div[style*="border:1px solid"]') || on.closest('label') : null; };

    // group: 'basic'(기본 — 처음이라면 순서대로) · 'detail'(세부 — 필요한 기능만 골라서)
    // id: 마친 과정 기록용 고유 이름 (순서가 바뀌거나 과정이 늘어도 ✓ 표시가 어긋나지 않게)
    const LESSONS = [
        // ===================== 기본 튜토리얼 =====================
        {
            id: 'tour', group: 'basic',
            title: i18n('tut.tour.1'),
            summary: i18n('tut.tour.2'),
            steps: [
                {
                    title: i18n('tut.tour.3'),
                    text: i18n('tut.tour.4'),
                },
                {
                    // 일부러 다른 화면(국가 › 상징)을 띄워 두고 메뉴로 돌아오게 한다
                    before: [closePanels, go('nation', 'symbol')],
                    target: navTarget,
                    allow: () => [navTarget()],
                    title: i18n('tut.tour.5'),
                    text: i18n('tut.tour.6'),
                    task: () => isActive('mainTabSetup') && isActive('subTabParty'),
                    done: i18n('tut.tour.7'),
                },
                {
                    before: [call('switchDispTab', 'house'), call('closeSeatInfoCard')],
                    target: '#houseCanvas',
                    allow: ['#houseCanvas', '#seatInfoCard'],
                    title: i18n('tut.tour.8'),
                    text: i18n('tut.tour.9'),
                    task: seatCardOpen,
                    done: i18n('tut.tour.10'),
                },
                {
                    before: [call('closeSeatInfoCard')],
                    target: '#dispInfoBar',
                    title: i18n('tut.tour.11'),
                    text: i18n('tut.tour.12'),
                },
                {
                    target: '#saveTabBar',
                    title: i18n('tut.tour.13'),
                    text: i18n('tut.tour.14'),
                },
            ],
        },
        {
            id: 'parties', group: 'basic',
            title: i18n('tut.parties.1'),
            summary: i18n('tut.parties.2'),
            steps: [
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info')],
                    enter: () => { if (!T.basePartyIds) T.basePartyIds = new Set(partyList().map(p => p.id)); },
                    target: '#innerContentPartyInfo > button.add-btn[onclick^="addParty"]',
                    allow: ['#innerContentPartyInfo > button.add-btn[onclick^="addParty"]'],
                    title: i18n('tut.parties.3'),
                    text: i18n('tut.parties.4'),
                    task: () => {
                        if (tutParty()) return true;
                        const added = partyList().filter(p => T.basePartyIds && !T.basePartyIds.has(p.id));
                        if (added.length) T.newPartyId = added[added.length - 1].id;
                        return !!tutParty();
                    },
                    done: i18n('tut.parties.5'),
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info')],
                    target: () => nameInput(),
                    allow: () => { const el = nameInput(); return el ? [el.closest('.card-item')] : []; },
                    title: i18n('tut.parties.6'),
                    text: i18n('tut.parties.7'),
                    task: () => {
                        const p = tutParty();
                        if (!p) return true; // 정당이 지워졌으면 이 단계는 건너뜀
                        const el = nameInput();
                        const typed = el ? el.value.trim() : p.name;
                        const fresh = n => n === '신당' || n === i18n('sim.party.41'); // 새 정당 기본 이름 (언어에 따라 다름)
                        return (!!typed && !fresh(typed)) || (!!p.name && !fresh(p.name));
                    },
                    done: i18n('tut.parties.8'),
                    leave: () => { const el = nameInput(); if (el && document.activeElement === el) el.blur(); }, // onchange로 이름 확정
                },
                {
                    before: [go('setup', 'settings'), call('switchSetupInnerTab', 'house')],
                    target: () => { const t = document.getElementById('houseTotal'); return t ? t.closest('div[style*="grid"]') || t : null; },
                    allow: ['#houseTotal', '#partyListHouse'],
                    title: i18n('tut.parties.9'),
                    enter: () => { if (T.totalBase == null) T.totalBase = houseTotal(); },
                    text: () => i18n('tut.parties.10', { totalBase: T.totalBase, totalBase2: T.totalBase + 20 }),
                    task: () => !tutParty() || freeHouseSeats() > 0 || (tutParty().seatsHouse || 0) > 0,
                    done: () => i18n('tut.parties.11', { freeHouseSeats: freeHouseSeats() }),
                },
                {
                    before: [go('setup', 'settings'), call('switchSetupInnerTab', 'house')],
                    target: () => seatInput(),
                    allow: () => { const el = seatInput(); return el ? [el.closest('.card-item'), '#houseTotal'] : ['#houseTotal']; },
                    title: i18n('tut.parties.12'),
                    text: () => i18n('tut.parties.14', { name: tutParty() ? `"${tutParty().name}"` : i18n('tut.parties.13'), seatsHouse: freeHouseSeats() + ((tutParty() && tutParty().seatsHouse) || 0) }),
                    task: () => {
                        const p = tutParty();
                        if (!p) return true;
                        const el = seatInput();
                        return (p.seatsHouse || 0) > 0 || (!!el && parseInt(el.value, 10) > 0);
                    },
                    done: i18n('tut.parties.15'),
                    leave: () => { const el = seatInput(); if (el && document.activeElement === el) el.blur(); },
                },
                {
                    enter: () => { T.execClicked = false; },
                    // 실행 버튼은 설정 › 화면에서 켤 때만 보인다 (기본 숨김) — 숨겨져 있으면 자동으로 다시 그려진다는 안내만
                    target: () => (execOn() ? execTarget() : '#houseCanvas'),
                    allow: () => (execOn() ? [execTarget()] : []),
                    title: () => (execOn() ? i18n('tut.parties.16') : i18n('tut.parties.17')),
                    text: () => !execOn()
                        ? i18n('tut.parties.18')
                        : i18n('tut.parties.19'),
                    task: () => !execOn() || T.execClicked,
                    done: i18n('tut.parties.20'),
                },
            ],
        },
        {
            id: 'law', group: 'basic',
            title: i18n('tut.law.1'),
            summary: i18n('tut.law.2'),
            steps: [
                {
                    before: [go('law', 'bill')],
                    enter: () => { if (T.billBase == null) T.billBase = billList().length; },
                    target: () => billForm(),
                    allow: () => { const f = billForm(); return f ? [f] : []; },
                    title: i18n('tut.law.3'),
                    text: i18n('tut.law.4'),
                    task: () => billList().length > (T.billBase || 0),
                    done: i18n('tut.law.5'),
                },
                {
                    before: [go('law', 'committee')],
                    target: '#contentCommittee',
                    title: i18n('tut.law.6'),
                    text: i18n('tut.law.7'),
                },
                {
                    before: [go('law', 'table')],
                    target: '#billList',
                    title: i18n('tut.law.8'),
                    text: i18n('tut.law.9'),
                },
                {
                    before: [go('law', 'vote')],
                    target: '#contentVote',
                    title: i18n('tut.law.10'),
                    text: i18n('tut.law.11'),
                },
                {
                    before: [go('law', 'archive')],
                    target: '#contentArchive',
                    title: i18n('tut.law.12'),
                    text: i18n('tut.law.13'),
                },
                {
                    before: [go('law', 'lawbook')],
                    target: '#contentLawbook',
                    title: i18n('tut.law.14'),
                    text: i18n('tut.law.15'),
                },
                {
                    before: [go('law', 'constitution')],
                    target: '#contentConstitution',
                    title: i18n('tut.law.16'),
                    text: i18n('tut.law.17'),
                },
            ],
        },
        {
            id: 'election', group: 'basic',
            title: i18n('tut.election.1'),
            summary: i18n('tut.election.2'),
            steps: [
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'prob'), call('switchElecProbChamber', 'house')],
                    enter: () => { T.probBase = probInputs().map(el => el.value); },
                    target: '#elecInputList',
                    allow: ['#elecInputList'],
                    title: i18n('tut.election.3'),
                    text: i18n('tut.election.4'),
                    task: () => {
                        const vals = probInputs().map(el => el.value);
                        return vals.some((v, i) => v !== (T.probBase || [])[i]) && vals.some(v => parseFloat(v) > 0);
                    },
                    done: i18n('tut.election.5'),
                    leave: () => { const el = document.activeElement; if (el && el.closest && el.closest('#elecInputList')) el.blur(); },
                },
                {
                    before: [go('vote', 'elecGeneral')],
                    target: '#elecRunBtn',
                    allow: ['#elecRunBtn', '#contentElecGeneral'],
                    title: i18n('tut.election.6'),
                    text: i18n('tut.election.7'),
                    task: electionStarted,
                    done: i18n('tut.election.8'),
                    autoNext: true, // 개표가 시작되면 바로 결과 화면을 보여주는 다음 단계로
                },
                {
                    target: () => resultTarget(),
                    noDim: true, // 개표가 진행되는 모습을 가리지 않게 어둡게 하지 않는다
                    title: i18n('tut.election.9'),
                    text: () => (electionRunning()
                        ? (i18n('tut.election.10') + " ")
                        : (i18n('tut.election.11') + " "))
                        + i18n('tut.election.12'),
                },
                {
                    before: [go('vote', 'elecGeneral')],
                    target: () => document.getElementById('elecPostBtns') && document.getElementById('elecPostBtns').offsetParent ? '#elecPostBtns' : '#elecRunBtn',
                    allow: ['#elecPostBtns', '#contentElecGeneral'],
                    title: i18n('tut.election.13'),
                    text: i18n('tut.election.14'),
                    task: elecApplied,
                    done: i18n('tut.election.15'),
                },
            ],
        },
        {
            id: 'cabinet', group: 'basic',
            title: i18n('tut.cabinet.1'),
            summary: i18n('tut.cabinet.2'),
            steps: [
                {
                    before: [go('cabinet', 'pm')],
                    target: () => pmBlock(),
                    title: i18n('tut.cabinet.3'),
                    text: i18n('tut.cabinet.4'),
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'leader')],
                    target: () => leaderInput(),
                    allow: () => { const el = leaderInput(); return el ? [el.closest('.card-item')] : []; },
                    title: i18n('tut.cabinet.5'),
                    text: () => i18n('tut.cabinet.6', { name: majorityParty() ? ` "${majorityParty().name}"` : '' }),
                    task: () => {
                        const p = majorityParty();
                        if (!p) return true; // 자동 총리를 쓰지 않는 나라면 이 단계는 건너뜀
                        const el = leaderInput();
                        return !!(p.leaderName || '').trim() || (!!el && el.value.trim() !== '');
                    },
                    done: i18n('tut.cabinet.7'),
                    leave: () => { const el = leaderInput(); if (el && document.activeElement === el) el.blur(); }, // onchange로 확정
                },
                {
                    before: [go('cabinet', 'cabinetmembers')],
                    enter: () => { if (T.cabinetBase == null) T.cabinetBase = cabinetList().length; },
                    target: '#addCabinetMemberBtn',
                    allow: ['#addCabinetMemberBtn'],
                    title: i18n('tut.cabinet.8'),
                    text: i18n('tut.cabinet.9'),
                    task: () => cabinetList().length > (T.cabinetBase || 0),
                    done: i18n('tut.cabinet.10'),
                },
                {
                    before: [call('switchDispTab', 'cabinet')],
                    target: '#dispPanelCabinet',
                    title: i18n('tut.cabinet.11'),
                    text: i18n('tut.cabinet.12'),
                },
            ],
        },
        {
            id: 'save', group: 'basic',
            title: i18n('tut.save.1'),
            summary: i18n('tut.save.2'),
            steps: [
                {
                    before: [closePanels, call('switchDispTab', 'house')],
                    target: '#saveTabSaveBtn',
                    allow: ['#saveTabSaveBtn', '#savePanelLayer'],
                    title: i18n('tut.save.3'),
                    text: i18n('tut.save.4'),
                    task: savePanelOpen,
                    done: i18n('tut.save.5'),
                },
                {
                    before: [call('openSavePanel')],
                    target: '#savePanelLayer .save-panel',
                    title: i18n('tut.save.6'),
                    text: i18n('tut.save.7'),
                },
                {
                    before: [closePanels],
                    target: () => document.getElementById('saveTabNewBtn') ? '#saveTabNewBtn' : '#saveTabBar',
                    title: i18n('tut.save.8'),
                    text: i18n('tut.save.9'),
                },
                {
                    target: helpTarget,
                    title: i18n('tut.save.10'),
                    text: i18n('tut.save.11'),
                },
                {
                    target: '#saveTabBar .save-tab-home',
                    title: i18n('tut.save.12'),
                    text: i18n('tut.save.13'),
                },
            ],
        },

        // ===================== 세부 튜토리얼 =====================
        {
            id: 'ideology', group: 'detail',
            title: i18n('tut.ideology.1'),
            summary: i18n('tut.ideology.2'),
            steps: [
                {
                    before: [closePanels, go('setup', 'ideology')],
                    target: '#contentIdeology',
                    title: i18n('tut.ideology.3'),
                    text: i18n('tut.ideology.4'),
                },
                {
                    before: [go('setup', 'ideology')],
                    target: () => document.querySelector('#contentIdeology button[onclick="addIdeology()"]') || '#contentIdeology',
                    title: i18n('tut.ideology.5'),
                    text: i18n('tut.ideology.6'),
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info')],
                    target: () => document.querySelector('#innerContentPartyInfo button[onclick="autoSortParties()"]') || '#innerContentPartyInfo',
                    title: i18n('tut.ideology.7'),
                    text: i18n('tut.ideology.8'),
                },
            ],
        },
        {
            id: 'party-adv', group: 'detail',
            title: i18n('tut.partyAdv.1'),
            summary: i18n('tut.partyAdv.2'),
            steps: [
                {
                    before: [closePanels, go('setup', 'party'), call('switchPartyGroupInnerTab', 'info')],
                    target: '#partyInfoList',
                    title: i18n('tut.partyAdv.3'),
                    text: i18n('tut.partyAdv.4'),
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info')],
                    target: () => { const b = document.querySelector('#partyInfoList button[onclick^="addFaction"]'); return b ? (b.closest('.card-item') || b) : '#partyInfoList'; },
                    title: i18n('tut.partyAdv.5'),
                    text: i18n('tut.partyAdv.6'),
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info')],
                    target: () => document.querySelector('button[onclick="openPartyMergeDialog()"]') || '#innerContentPartyInfo',
                    title: i18n('tut.partyAdv.7'),
                    text: i18n('tut.partyAdv.8'),
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'leader')],
                    target: '#innerContentPartyLeader',
                    title: i18n('tut.partyAdv.9'),
                    text: i18n('tut.partyAdv.10'),
                },
            ],
        },
        {
            id: 'assembly', group: 'detail',
            title: i18n('tut.assembly.1'),
            summary: i18n('tut.assembly.2'),
            steps: [
                {
                    before: [closePanels, go('setup', 'settings')],
                    target: () => { const r = document.querySelector('input[name="systemType"]'); return r ? r.closest('div') : '#contentSettings'; },
                    title: i18n('tut.assembly.3'),
                    text: i18n('tut.assembly.4'),
                },
                {
                    before: [go('setup', 'assembly')],
                    target: '#chamberLeadersList',
                    title: i18n('tut.assembly.5'),
                    text: i18n('tut.assembly.6'),
                },
                {
                    before: [go('setup', 'assembly')],
                    target: byId('chamberCenterLabelHouse', 'div'),
                    title: i18n('tut.assembly.7'),
                    text: i18n('tut.assembly.8'),
                },
                {
                    before: [go('setup', 'coalition')],
                    target: '#contentCoalition',
                    title: i18n('tut.assembly.9'),
                    text: i18n('tut.assembly.10'),
                },
                {
                    before: [go('setup', 'members')],
                    target: '#contentMembers',
                    title: i18n('tut.assembly.11'),
                    text: i18n('tut.assembly.12'),
                },
            ],
        },
        {
            id: 'history', group: 'detail',
            title: i18n('tut.history.1'),
            summary: i18n('tut.history.2'),
            steps: [
                {
                    before: [closePanels, go('setup', 'timeline')],
                    enter: () => { T.histBase = histApi() ? histApi().timeline.length : 0; },
                    target: () => document.querySelector('#contentTimeline .hist-actions') || '#contentTimeline',
                    allow: ['#contentTimeline'],
                    title: i18n('tut.history.3'),
                    text: i18n('tut.history.4'),
                    task: () => !histApi() || histApi().timeline.length > (T.histBase || 0),
                    done: i18n('tut.history.5'),
                },
                {
                    before: [go('setup', 'timeline'), () => { const b = document.querySelector('#dispPanelTimeline [data-hview="seats"]'); if (b) b.click(); }],
                    target: () => document.querySelector('#dispPanelTimeline .chamber-box') || '#dispPanelTimeline',
                    title: i18n('tut.history.6'),
                    text: i18n('tut.history.7'),
                },
                {
                    before: [go('setup', 'timeline'), () => { const b = document.querySelector('#dispPanelTimeline [data-hview="lineage"]'); if (b) b.click(); }],
                    target: () => document.querySelector('#dispPanelTimeline .chamber-box') || '#dispPanelTimeline',
                    title: i18n('tut.history.8'),
                    text: i18n('tut.history.9'),
                },
                {
                    before: [go('setup', 'timeline'), () => { const d = document.querySelector('#contentTimeline [data-fold="openSucc"]'); if (d) d.open = true; }],
                    target: () => document.querySelector('#contentTimeline [data-fold="openSucc"]') || '#contentTimeline',
                    title: i18n('tut.history.10'),
                    text: i18n('tut.history.11'),
                },
                {
                    before: [go('setup', 'timeline'), () => { const b = document.querySelector('#dispPanelTimeline [data-hview="seats"]'); if (b) b.click(); }],
                    target: () => document.querySelector('#contentTimeline .hist-table') || '#contentTimeline',
                    title: i18n('tut.history.12'),
                    text: i18n('tut.history.13'),
                },
            ],
        },
        {
            id: 'wiki', group: 'detail',
            title: i18n('tut.wiki.1'),
            summary: i18n('tut.wiki.2'),
            steps: [
                {
                    before: [closePanels, go('setup', 'wikibox')],
                    target: () => document.querySelector('#dispPanelWiki .nbx2') || '#dispPanelWiki',
                    title: i18n('tut.wiki.3'),
                    text: i18n('tut.wiki.4'),
                },
                {
                    before: [go('setup', 'wikibox')],
                    target: () => document.querySelector('#contentWikibox .hist-tabs') || '#contentWikibox',
                    allow: ['#contentWikibox .hist-tabs'],
                    title: i18n('tut.wiki.5'),
                    text: () => document.querySelector('#contentWikibox [data-wch="both"]')
                        ? i18n('tut.wiki.6')
                        : i18n('tut.wiki.7'),
                    task: () => !document.querySelector('#contentWikibox [data-wch="both"]') || !!document.querySelector('#contentWikibox [data-wch="both"].active'),
                    done: i18n('tut.wiki.8'),
                },
                {
                    before: [go('setup', 'wikibox')],
                    target: () => document.querySelector('#contentWikibox .hist-wk-form') || '#contentWikibox',
                    title: i18n('tut.wiki.9'),
                    text: i18n('tut.wiki.10'),
                },
                {
                    before: [go('setup', 'wikibox')],
                    target: () => document.querySelector('#contentWikibox [data-act="copy"]') || '#contentWikibox',
                    title: i18n('tut.wiki.11'),
                    text: i18n('tut.wiki.12'),
                },
            ],
        },
        {
            id: 'map', group: 'detail',
            title: i18n('tut.map.1'),
            summary: i18n('tut.map.2'),
            steps: [
                {
                    before: [closePanels],
                    title: () => (DEMO_BUILD() ? i18n('tut.map.3') : i18n('tut.map.4')),
                    text: () => (DEMO_BUILD() ? i18n('tut.map.5') : i18n('tut.map.6')),
                },
                {
                    before: [go('nation', 'territory')],
                    target: '#districtSvgEditUI',
                    title: () => (DEMO_BUILD() ? i18n('tut.map.7') : i18n('tut.map.8')),
                    text: () => (DEMO_BUILD() ? i18n('tut.map.9') : i18n('tut.map.10')),
                },
                {
                    before: [go('nation', 'territory')],
                    target: () => { const r = document.getElementById('districtChamberSelectRow'); return r && r.offsetParent ? r : '#districtSvgEditUI'; },
                    title: i18n('tut.map.11'),
                    text: i18n('tut.map.12'),
                },
                {
                    before: [go('nation', 'territory')],
                    target: '#districtListPanel',
                    title: i18n('tut.map.13'),
                    text: i18n('tut.map.14'),
                },
                {
                    before: [go('nation', 'territory')],
                    target: () => { const el = document.getElementById('districtNamePanel'); return el && el.offsetParent ? el : '#districtListPanel'; },
                    title: i18n('tut.map.15'),
                    text: i18n('tut.map.16'),
                },
                {
                    before: [go('nation', 'nationSettings')],
                    target: byId('districtSeatBadgesChk', 'label'),
                    title: i18n('tut.map.17'),
                    text: i18n('tut.map.18'),
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'tendency')],
                    target: '#elecSubTendency',
                    title: i18n('tut.map.19'),
                    text: i18n('tut.map.20'),
                },
                {
                    before: [go('nation', 'regions')],
                    target: '#elecSubRegion',
                    title: i18n('tut.map.21'),
                    text: i18n('tut.map.22'),
                },
                {
                    before: [go('nation', 'regions')],
                    target: () => { const el = document.getElementById('regionSeatPanel'); return el && el.offsetParent && el.children.length ? el : '#elecSubRegion'; },
                    title: i18n('tut.map.23'),
                    text: i18n('tut.map.24'),
                },
                {
                    before: [go('nation', 'nationSettings')],
                    target: '#contentNationSettings',
                    title: i18n('tut.map.25'),
                    text: i18n('tut.map.26'),
                },
            ],
        },
        {
            id: 'unrecovered', group: 'detail',
            title: i18n('tut.unrecovered.1'),
            summary: i18n('tut.unrecovered.2'),
            steps: [
                {
                    before: [closePanels, go('nation', 'unrecovered')],
                    target: () => document.querySelector('#contentUnrecovered .teaser-unrec-summary') || '#contentUnrecovered',
                    title: i18n('tut.unrecovered.3'),
                    text: i18n('tut.unrecovered.4'),
                },
                {
                    before: [go('nation', 'unrecovered'), call('switchDispTab', 'house'), call('chamberSetView', 'house', 'district')],
                    target: () => document.querySelector('#houseViewDistrictWrap') || '#dispPanelHouse',
                    title: i18n('tut.unrecovered.5'),
                    text: i18n('tut.unrecovered.6'),
                },
                {
                    before: [go('nation', 'unrecovered'), call('chamberSetView', 'house', 'arc')],
                    target: () => document.querySelector('#contentUnrecovered .teaser-terr') || document.querySelector('#contentUnrecovered .teaser-add-row') || '#contentUnrecovered',
                    title: i18n('tut.unrecovered.7'),
                    text: i18n('tut.unrecovered.8'),
                },
                {
                    before: [go('nation', 'unrecovered')],
                    target: () => document.querySelector('#contentUnrecovered .teaser-unify') || '#contentUnrecovered',
                    allow: ['#contentUnrecovered'],
                    title: i18n('tut.unrecovered.9'),
                    text: () => unrecLeft()
                        ? i18n('tut.unrecovered.10')
                        : i18n('tut.unrecovered.11'),
                    task: () => !unrecLeft(),
                    done: i18n('tut.unrecovered.12'),
                },
                {
                    before: [go('nation', 'territory')],
                    target: () => document.getElementById('contentTerritory') || '#mainContentNation',
                    title: i18n('tut.unrecovered.13'),
                    text: i18n('tut.unrecovered.14'),
                },
            ],
        },
        {
            id: 'economy', group: 'detail',
            title: i18n('tut.economy.1'),
            summary: i18n('tut.economy.2'),
            steps: [
                {
                    before: [closePanels, go('economy', 'overview')],
                    target: () => document.querySelector('#contentEcoOverview .econ-top') || '#contentEcoOverview',
                    title: i18n('tut.economy.3'),
                    text: i18n('tut.economy.4'),
                },
                {
                    before: [go('economy', 'overview')],
                    enter: () => { T.ecoTurn0 = ecoTurn(); },
                    target: () => document.querySelector('#contentEcoOverview .econ-next') || '#contentEcoOverview',
                    allow: ['#contentEcoOverview'],
                    title: i18n('tut.economy.5'),
                    text: i18n('tut.economy.6'),
                    task: () => ecoTurn() > (T.ecoTurn0 || 0),
                    done: i18n('tut.economy.7'),
                },
                {
                    before: [go('economy', 'overview'), showEco('overview')],
                    target: () => document.querySelector('#dispPanelEconomy .econ-toprow') || '#dispPanelEconomy',
                    title: i18n('tut.economy.8'),
                    text: i18n('tut.economy.9'),
                },
                {
                    before: [go('economy', 'overview'), showEco('overview')],
                    target: () => document.querySelector('#dispPanelEconomy .econ-gauges') || '#dispPanelEconomy',
                    title: i18n('tut.economy.10'),
                    text: i18n('tut.economy.11'),
                },
                {
                    before: [go('economy', 'overview'), showEco('overview')],
                    target: () => { const c = document.querySelector('#dispPanelEconomy .econ-chips'); return (c && c.parentElement) || '#dispPanelEconomy'; },
                    title: i18n('tut.economy.12'),
                    text: i18n('tut.economy.13'),
                },
                {
                    before: [go('economy', 'monetary')],
                    target: () => document.querySelector('#contentEcoMonetary .econ-card') || '#contentEcoMonetary',
                    title: i18n('tut.economy.14'),
                    text: i18n('tut.economy.15'),
                },
                {
                    before: [go('economy', 'fiscal')],
                    target: () => document.querySelector('#contentEcoFiscal .econ-budgetbox') || '#contentEcoFiscal',
                    title: i18n('tut.economy.16'),
                    text: i18n('tut.economy.17'),
                },
                {
                    before: [go('economy', 'events')],
                    enter: () => { T.evBase = (econApi() && (econApi().state.sched || []).length) || 0; },
                    target: () => document.querySelector('#contentEcoEvents .econ-card') || '#contentEcoEvents',
                    allow: ['#contentEcoEvents'],
                    title: i18n('tut.economy.18'),
                    text: i18n('tut.economy.19'),
                    task: () => !!econApi() && (econApi().state.sched || []).length > (T.evBase || 0),
                    done: i18n('tut.economy.20'),
                },
                {
                    before: [go('economy', 'analysis'), showEco('analysis')],
                    target: () => document.querySelector('#contentEcoAnalysis .econ-presets') || '#contentEcoAnalysis',
                    title: i18n('tut.economy.21'),
                    text: i18n('tut.economy.22'),
                },
                {
                    before: [go('economy', 'region')],
                    target: () => document.querySelector('#contentEcoRegion .econ-dlist') || '#contentEcoRegion',
                    title: i18n('tut.economy.23'),
                    text: i18n('tut.economy.24'),
                },
            ],
        },
        {
            id: 'vassals', group: 'detail',
            title: i18n('tut.vassals.1'),
            summary: i18n('tut.vassals.2'),
            steps: [
                {
                    before: [closePanels, go('nation', 'vassals')],
                    target: () => document.querySelector('#contentVassals .vassal-summary') || '#contentVassals',
                    title: i18n('tut.vassals.1'),
                    text: i18n('tut.vassals.3'),
                },
                {
                    before: [go('nation', 'vassals')],
                    target: () => firstVassalCard() || document.querySelector('#contentVassals [data-act="add"]') || '#contentVassals',
                    allow: ['#contentVassals'],
                    title: i18n('tut.vassals.4'),
                    text: () => (vassalApi() && vassalApi().vassals.length
                        ? i18n('tut.vassals.5')
                        : i18n('tut.vassals.6')),
                    task: () => !!(vassalApi() && vassalApi().vassals.length),
                    done: i18n('tut.vassals.7'),
                },
                {
                    before: [go('nation', 'vassals'), call('switchDispTab', 'house'), call('chamberSetView', 'house', 'district')],
                    target: () => document.querySelector('#houseViewDistrictWrap') || '#dispPanelHouse',
                    title: i18n('tut.vassals.8'),
                    text: i18n('tut.vassals.9'),
                },
                {
                    before: [go('nation', 'vassals'), call('chamberSetView', 'house', 'arc'), () => { if (vassalApi()) vassalApi().openParliament(); }],
                    target: () => document.querySelector('#contentVassals .vassal-parl') || firstVassalCard() || '#contentVassals',
                    allow: ['#contentVassals'],
                    title: i18n('tut.vassals.10'),
                    text: () => (vassalApi() && vassalApi().vassals.some(v => v.parliament.elections)
                        ? i18n('tut.vassals.11')
                        : i18n('tut.vassals.12')),
                    task: () => !!(vassalApi() && vassalApi().vassals.some(v => v.parliament.elections)),
                    done: i18n('tut.vassals.13'),
                },
                {
                    before: [go('nation', 'vassals')],
                    target: () => document.querySelector('#contentVassals .vassal-actions') || '#contentVassals',
                    title: i18n('tut.vassals.14'),
                    text: i18n('tut.vassals.15'),
                },
            ],
        },
        {
            id: 'people', group: 'detail',
            title: i18n('tut.people.1'),
            summary: i18n('tut.people.2'),
            steps: [
                {
                    before: [closePanels, go('nation', 'people')],
                    target: '#contentPeople',
                    title: i18n('tut.people.1'),
                    text: i18n('tut.people.3'),
                },
                {
                    before: [go('nation', 'people')],
                    enter: () => { T.peopleBase = (window.HemiPeople && HemiPeople.people.length) || 0; },
                    target: () => document.querySelector('#contentPeople [data-act="import"]') || '#contentPeople',
                    allow: ['#contentPeople'],
                    title: i18n('tut.people.4'),
                    text: i18n('tut.people.5'),
                    task: () => !!window.HemiPeople && HemiPeople.people.length > (T.peopleBase || 0),
                    done: i18n('tut.people.6'),
                },
                {
                    before: [go('nation', 'people')],
                    target: '#contentPeople',
                    title: i18n('tut.people.7'),
                    text: i18n('tut.people.8'),
                },
                {
                    before: [go('nation', 'people')],
                    target: '#contentPeople',
                    title: i18n('tut.people.9'),
                    text: i18n('tut.people.10'),
                },
            ],
        },
        {
            id: 'citizens', group: 'detail',
            title: i18n('tut.citizens.1'),
            summary: i18n('tut.citizens.2'),
            steps: [
                {
                    before: [closePanels, go('nation', 'territory')],
                    target: () => firstCitCard() || '#districtListPanel',
                    title: i18n('tut.citizens.3'),
                    text: i18n('tut.citizens.4'),
                },
                {
                    before: [go('nation', 'territory')],
                    enter: () => { T.citBase = citCount(); },
                    target: () => firstCitCard() || '#districtListPanel',
                    allow: ['#districtListPanel'],
                    title: i18n('tut.citizens.5'),
                    text: i18n('tut.citizens.6'),
                    task: () => citCount() > (T.citBase || 0),
                    done: i18n('tut.citizens.7'),
                },
                {
                    before: [go('vote', 'elecSettings')],
                    enter: () => { T.migBase = migSig(); },
                    target: () => document.getElementById('peopleMigrantCard') || '#contentElecSettings',
                    allow: ['#peopleMigrantCard'],
                    title: i18n('tut.citizens.8'),
                    text: i18n('tut.citizens.9'),
                    task: () => migSig() !== T.migBase,
                    done: i18n('tut.citizens.10'),
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'overview')],
                    target: () => document.querySelector('#elecSubOverview .op-card') || '#elecSubOverview',
                    title: i18n('tut.citizens.11'),
                    text: i18n('tut.citizens.12'),
                },
            ],
        },
        {
            id: 'world', group: 'detail',
            title: i18n('tut.world.1'),
            summary: i18n('tut.world.2'),
            steps: [
                {
                    before: [closePanels, go('world', 'ranking')],
                    target: () => document.querySelector('#sideNav .mn-group[data-main="world"]') || navTarget(),
                    title: i18n('tut.world.3'),
                    text: () => i18n('tut.world.6', { econApi: econApi() ? i18n('tut.world.4') : i18n('tut.world.5') }),
                },
                {
                    before: [go('world', 'ranking')],
                    target: () => document.querySelector('#dispPanelRanking .hist-rk') || '#dispPanelRanking',
                    title: i18n('tut.world.7'),
                    text: i18n('tut.world.8'),
                },
                {
                    before: [go('world', 'ranking')],
                    enter: () => { T.rankBase = rankSig(); },
                    target: () => document.querySelector('#contentRanking .hist-re-list') || '#contentRanking',
                    allow: ['#contentRanking'],
                    title: i18n('tut.world.9'),
                    text: i18n('tut.world.10'),
                    task: () => !histApi() || rankSig() !== T.rankBase,
                    done: i18n('tut.world.11'),
                },
                {
                    before: [go('world', 'ranking')],
                    target: () => document.querySelector('#contentRanking .hist-re-row') || '#contentRanking',
                    title: i18n('tut.world.12'),
                    text: i18n('tut.world.13'),
                },
                {
                    before: [go('world', 'blocs')],
                    target: '#contentBlocs',
                    title: i18n('tut.world.14'),
                    text: i18n('tut.world.15'),
                },
            ],
        },
        {
            id: 'election-adv', group: 'detail',
            title: i18n('tut.electionAdv.1'),
            summary: i18n('tut.electionAdv.2'),
            steps: [
                {
                    before: [closePanels, go('vote', 'elecGeneral')],
                    target: byId('elecModeProportional', 'div'),
                    title: i18n('tut.electionAdv.3'),
                    text: i18n('tut.electionAdv.4'),
                },
                {
                    before: [go('vote', 'elecGeneral')],
                    target: () => { const r = document.getElementById('elecCountModeRow'); return r && r.offsetParent ? r : '#elecRunBtn'; },
                    title: i18n('tut.electionAdv.5'),
                    text: i18n('tut.electionAdv.6'),
                },
                {
                    before: [go('vote', 'elecGeneral')],
                    target: byId('elecModeByElection', 'label'),
                    title: i18n('tut.electionAdv.7'),
                    text: i18n('tut.electionAdv.8'),
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'prob')],
                    target: '#elecSystemSettings',
                    title: i18n('tut.electionAdv.9'),
                    text: i18n('tut.electionAdv.10'),
                },
                {
                    before: [go('vote', 'elecPresidential')],
                    target: '#contentElecPresidential',
                    title: i18n('tut.electionAdv.11'),
                    text: i18n('tut.electionAdv.12'),
                },
                {
                    before: [go('vote', 'elecRecord')],
                    target: '#contentElecRecord',
                    title: i18n('tut.electionAdv.13'),
                    text: i18n('tut.electionAdv.14'),
                },
            ],
        },
        {
            id: 'electoral', group: 'detail',
            title: i18n('tut.electoral.1'),
            summary: i18n('tut.electoral.2'),
            steps: [
                {
                    before: [closePanels, go('vote', 'elecSettings')],
                    target: '#presElecModeElectoralBtn',
                    allow: ['#presElecModeElectoralBtn'],
                    title: i18n('tut.electoral.3'),
                    text: i18n('tut.electoral.4'),
                    task: () => typeof presElectionMode !== 'undefined' && presElectionMode === 'electoral',
                    done: i18n('tut.electoral.5'),
                },
                {
                    before: [go('vote', 'elecSettings')],
                    target: () => document.getElementById('revEcPanel') || '#contentElecSettings',
                    title: i18n('tut.electoral.6'),
                    text: i18n('tut.electoral.7'),
                },
                {
                    before: [go('vote', 'elecSettings')],
                    target: () => document.getElementById('revEcPanel') || '#contentElecSettings',
                    title: i18n('tut.electoral.8'),
                    text: i18n('tut.electoral.9'),
                },
                {
                    before: [go('vote', 'elecPresidential')],
                    target: '#presElecRunBtn',
                    allow: ['#presElecRunBtn', '#presElecResultPanel'],
                    title: i18n('tut.electoral.10'),
                    text: i18n('tut.electoral.11'),
                    task: () => !!document.querySelector('#presElecResultPanel .rev-ec'),
                    done: i18n('tut.election.11'),
                },
                {
                    before: [go('vote', 'elecPresidential')],
                    target: () => document.querySelector('#presElecResultPanel .rev-ec') || '#contentElecPresidential',
                    title: i18n('tut.electoral.12'),
                    text: i18n('tut.electoral.13'),
                },
            ],
        },
        {
            id: 'union', group: 'detail',
            title: i18n('tut.union.1'),
            summary: i18n('tut.union.2'),
            steps: [
                {
                    before: [closePanels, go('vote', 'elecCandidates')],
                    enter: () => { T.unionBase = unionList().length; },
                    target: unionSection,
                    title: i18n('tut.union.3'),
                    text: i18n('tut.union.4'),
                },
                {
                    before: [go('vote', 'elecCandidates')],
                    target: () => document.querySelector('#contentElecCandidates button[onclick^="addCandidateUnion"]'),
                    allow: ['#contentElecCandidates button[onclick^="addCandidateUnion"]'],
                    title: i18n('tut.union.5'),
                    text: i18n('tut.union.6'),
                    task: () => unionList().length > (T.unionBase || 0),
                    done: i18n('tut.union.7'),
                },
                {
                    before: [go('vote', 'elecCandidates')],
                    target: () => lastUnionCard() || unionSection(),
                    allow: () => [lastUnionCard() || '#candidateUnionList'],
                    title: i18n('tut.union.8'),
                    text: i18n('tut.union.9'),
                    task: () => { const u = unionList()[unionList().length - 1]; return !u || (u.partyIds || []).length >= 2; },
                    done: i18n('tut.union.10'),
                },
                {
                    before: [go('vote', 'elecCandidates')],
                    target: () => lastUnionCard() || unionSection(),
                    title: i18n('tut.union.11'),
                    text: i18n('tut.union.12'),
                    leave: closePanels,
                },
            ],
        },
        {
            id: 'fraud', group: 'detail',
            title: i18n('tut.fraud.1'),
            summary: i18n('tut.fraud.2'),
            steps: [
                {
                    before: [closePanels, go('vote', 'fraud')],
                    target: '#contentFraud',
                    title: i18n('tut.fraud.3'),
                    text: i18n('tut.fraud.4'),
                },
                {
                    before: [go('vote', 'fraud')],
                    target: () => fraudCheckbox() ? fraudCheckbox().closest('label') : '#fraudPartyList',
                    allow: ['#fraudPartyList'],
                    title: i18n('tut.fraud.5'),
                    text: i18n('tut.fraud.6'),
                    task: () => partyList().some(p => p.fraudAttempt),
                    done: i18n('tut.fraud.7'),
                },
                {
                    before: [go('vote', 'fraud')],
                    target: () => fraudBlock() || '#fraudPartyList',
                    allow: ['#fraudPartyList'],
                    title: i18n('tut.fraud.8'),
                    text: i18n('tut.fraud.9'),
                },
                {
                    before: [go('vote', 'fraud')],
                    target: () => fraudBlock() || '#fraudPartyList',
                    allow: ['#fraudPartyList'],
                    title: i18n('tut.fraud.10'),
                    text: i18n('tut.fraud.11'),
                    leave: closePanels,
                },
            ],
        },
        {
            id: 'law-adv', group: 'detail',
            title: i18n('tut.lawAdv.1'),
            summary: i18n('tut.lawAdv.2'),
            steps: [
                {
                    before: [closePanels, go('law', 'bill')],
                    target: byId('newBillThreshold', 'div'),
                    title: i18n('tut.lawAdv.3'),
                    text: i18n('tut.lawAdv.4'),
                },
                {
                    before: [go('law', 'archive')],
                    target: '#contentArchive',
                    title: i18n('tut.lawAdv.5'),
                    text: i18n('tut.lawAdv.6'),
                },
                {
                    before: [go('cabinet', 'system')],
                    target: byId('vetoHolderPresidentBtn', 'div'),
                    title: i18n('tut.lawAdv.7'),
                    text: i18n('tut.lawAdv.8'),
                },
                {
                    before: [go('cabinet', 'council')],
                    target: '#contentCouncil',
                    title: i18n('tut.lawAdv.9'),
                    text: i18n('tut.lawAdv.10'),
                },
            ],
        },
        {
            id: 'government', group: 'detail',
            title: i18n('tut.government.1'),
            summary: i18n('tut.government.2'),
            steps: [
                {
                    before: [closePanels, go('cabinet', 'system')],
                    target: byId('govTypePresidentialBtn', 'div'),
                    title: i18n('tut.government.3'),
                    text: i18n('tut.government.4'),
                },
                {
                    before: [go('cabinet', 'system')],
                    target: '#dissolutionHolderGroup',
                    title: i18n('tut.government.5'),
                    text: i18n('tut.government.6'),
                },
                {
                    before: [go('cabinet', 'pm')],
                    target: () => document.getElementById('noConfidenceSection') && document.getElementById('noConfidenceSection').offsetParent ? '#noConfidenceSection' : '#contentPm',
                    title: i18n('tut.government.7'),
                    text: i18n('tut.government.8'),
                },
                {
                    before: [go('cabinet', 'president')],
                    target: '#contentPresident',
                    title: i18n('tut.government.9'),
                    text: i18n('tut.government.10'),
                },
            ],
        },
        {
            id: 'coup', group: 'detail',
            title: i18n('tut.coup.1'),
            summary: i18n('tut.coup.2'),
            steps: [
                {
                    before: [closePanels, go('cabinet', 'military')],
                    target: '#contentMilitary',
                    title: i18n('tut.coup.3'),
                    text: i18n('tut.coup.4'),
                },
                {
                    before: [go('cabinet', 'military')],
                    target: () => document.querySelector('#contentMilitary [data-act="seed"]') || '#contentMilitary',
                    allow: ['#contentMilitary'],
                    title: i18n('tut.coup.5'),
                    text: i18n('tut.coup.6'),
                    task: () => !!(window.HemiCoup && window.HemiCoup.military && window.HemiCoup.military.length),
                    done: i18n('tut.coup.7'),
                },
                {
                    before: [go('cabinet', 'coup')],
                    target: '#contentCoup',
                    title: i18n('tut.coup.8'),
                    text: i18n('tut.coup.9'),
                },
                {
                    before: [go('cabinet', 'coup')],
                    enter: () => { T.coupBase = logLen('HemiCoup'); },
                    target: () => document.querySelector('#contentCoup [data-act="go"]') || '#contentCoup',
                    allow: ['#contentCoup'],
                    title: i18n('tut.coup.10'),
                    text: i18n('tut.coup.11'),
                    task: () => logLen('HemiCoup') > (T.coupBase || 0),
                    done: i18n('tut.coup.12'),
                },
                {
                    before: [go('cabinet', 'coup')],
                    target: '#contentCoup',
                    title: i18n('tut.coup.13'),
                    text: i18n('tut.coup.14'),
                },
            ],
        },
        {
            id: 'revolution', group: 'detail',
            title: i18n('tut.revolution.1'),
            summary: i18n('tut.revolution.2'),
            steps: [
                {
                    before: [closePanels, go('cabinet', 'revolution')],
                    target: '#contentRevolution',
                    title: i18n('tut.revolution.1'),
                    text: i18n('tut.revolution.3'),
                },
                {
                    before: [go('cabinet', 'revolution')],
                    target: () => { const b = document.querySelector('#contentRevolution [data-kind]'); return b ? b.parentElement : '#contentRevolution'; },
                    title: i18n('tut.revolution.4'),
                    text: i18n('tut.revolution.5'),
                },
                {
                    before: [go('cabinet', 'revolution')],
                    enter: () => { T.revBase = logLen('HemiRevolution'); },
                    target: () => document.querySelector('#contentRevolution [data-act="go"]') || '#contentRevolution',
                    allow: ['#contentRevolution'],
                    title: i18n('tut.revolution.6'),
                    text: i18n('tut.revolution.7'),
                    task: () => logLen('HemiRevolution') > (T.revBase || 0),
                    done: i18n('tut.revolution.8'),
                },
                {
                    before: [go('cabinet', 'revolution')],
                    target: '#contentRevolution',
                    title: i18n('tut.revolution.9'),
                    text: i18n('tut.revolution.10'),
                },
            ],
        },
        {
            id: 'royal', group: 'detail',
            title: i18n('tut.royal.1'),
            summary: i18n('tut.royal.2'),
            steps: [
                {
                    before: [closePanels, go('cabinet', 'royal')],
                    target: '#contentRoyal',
                    title: i18n('tut.royal.3'),
                    text: i18n('tut.royal.4'),
                },
                {
                    before: [go('cabinet', 'royal')],
                    enter: () => { T.royalDyn = (window.HemiRoyal && HemiRoyal.dynasties.length) || 0; },
                    target: () => document.querySelector('#contentRoyal [data-act="seed"]') || document.querySelector('#contentRoyal .royal-dyn') || '#contentRoyal',
                    allow: ['#contentRoyal'],
                    title: i18n('tut.royal.5'),
                    text: i18n('tut.royal.6'),
                    task: () => !!window.HemiRoyal && HemiRoyal.dynasties.length > 0,
                    done: i18n('tut.royal.7'),
                },
                {
                    before: [go('cabinet', 'royal')],
                    enter: () => { T.royalBase = logLen('HemiRoyal'); },
                    target: () => document.querySelector('#contentRoyal [data-act="restore"]') || '#contentRoyal',
                    allow: ['#contentRoyal'],
                    title: i18n('tut.royal.8'),
                    text: i18n('tut.royal.9'),
                    task: () => logLen('HemiRoyal') > (T.royalBase || 0),
                    done: i18n('tut.royal.10'),
                },
                {
                    before: [go('cabinet', 'royal')],
                    target: '#contentRoyal',
                    title: i18n('tut.royal.11'),
                    text: i18n('tut.royal.12'),
                },
            ],
        },
        {
            id: 'siege', group: 'detail',
            title: i18n('tut.siege.1'),
            summary: i18n('tut.siege.2'),
            steps: [
                {
                    before: [closePanels, go('law', 'siege')],
                    target: () => document.querySelector('#contentSiege .siege-modes') || '#contentSiege',
                    title: i18n('tut.siege.1'),
                    text: i18n('tut.siege.3'),
                },
                {
                    // 계엄령은 권한 주체의 탭(비상 권한)에서 선포한다 — 권한 주체가 없으면 대통령으로 정해 두고, 의회 정지도 켜 둔다
                    before: [() => {
                        if (typeof emergencyPowers === 'undefined' || emergencyPowers.martialLaw.active) return;
                        if (emergencyPowers.martialLaw.holder === 'none') call('setEmergencyHolder', 'martialLaw', 'president')();
                        call('setMartialLawSuspendParliament', true)();
                    }, () => go('cabinet', martialTab()[0])()],
                    target: () => document.getElementById(martialTab()[1]) || '#mainContentCabinet',
                    allow: () => ['#' + martialTab()[1]],
                    title: i18n('tut.siege.4'),
                    text: () => (typeof emergencyPowers !== 'undefined' && emergencyPowers.martialLaw.active)
                        ? i18n('tut.siege.5')
                        : i18n('tut.siege.6'),
                    task: () => typeof emergencyPowers !== 'undefined' && !!emergencyPowers.martialLaw.active,
                    done: i18n('tut.siege.7'),
                },
                {
                    before: [go('law', 'siege'), () => window.HemiSiege && window.HemiSiege.setMode('break')],
                    target: () => document.querySelector('#contentSiege .siege-meter-box') || '#contentSiege',
                    title: i18n('tut.siege.8'),
                    text: i18n('tut.siege.9'),
                },
                {
                    before: [go('law', 'siege'), () => window.HemiSiege && window.HemiSiege.setMode('break')],
                    enter: () => { T.siegeBase = logLen('HemiSiege'); },
                    target: () => document.querySelector('#contentSiege [data-act="break"]') || '#contentSiege',
                    allow: ['#contentSiege', '#dispPanelHouse'],
                    title: i18n('tut.siege.10'),
                    text: i18n('tut.siege.11'),
                    task: () => logLen('HemiSiege') > (T.siegeBase || 0),
                    done: i18n('tut.siege.12'),
                },
                {
                    before: [go('law', 'siege'), () => window.HemiSiege && window.HemiSiege.setMode('obstruct')],
                    target: () => document.querySelector('#contentSiege .siege-panel') || '#contentSiege',
                    title: i18n('tut.siege.13'),
                    text: i18n('tut.siege.14'),
                },
                {
                    before: [go('law', 'siege')],
                    target: () => document.querySelector('#contentSiege .siege-fold') || '#contentSiege',
                    title: i18n('tut.siege.15'),
                    text: i18n('tut.siege.16'),
                },
            ],
        },
        {
            id: 'date', group: 'detail',
            title: i18n('tut.tour.11'),
            summary: i18n('tut.date.1'),
            steps: [
                {
                    before: [closePanels, call('switchDispTab', 'house')],
                    target: '#dispInfoBar',
                    title: i18n('tut.date.2'),
                    text: i18n('tut.date.3'),
                    enter: () => { T.dateBase = (document.getElementById('dispInfoDate') || {}).textContent; },
                    allow: ['#dispInfoBar'],
                    task: () => { const el = document.getElementById('dispInfoDate'); return !el || el.textContent !== T.dateBase; },
                    done: i18n('tut.date.4'),
                },
                {
                    before: [closePanels],
                    target: () => document.getElementById('dispNextSessionTypeBtn') ? '#dispNextSessionTypeBtn' : '#dispInfoBar',
                    title: i18n('tut.date.5'),
                    text: i18n('tut.date.6'),
                },
                {
                    before: [call('openDatePanel')],
                    target: '#datePanel',
                    title: i18n('tut.date.7'),
                    text: i18n('tut.date.8'),
                },
                {
                    before: [call('openDatePanel')],
                    target: () => { const el = document.getElementById('nationAutoRegularSession'); return el ? el.closest('div[style*="margin-top"]') || el : '#datePanel'; },
                    title: i18n('tut.date.9'),
                    text: i18n('tut.date.10'),
                    leave: closePanels,
                },
            ],
        },
        {
            id: 'view', group: 'detail',
            title: i18n('tut.view.1'),
            summary: i18n('tut.view.2'),
            steps: [
                {
                    before: [closePanels, call('switchDispTab', 'house')],
                    target: '.disp-tab-bar',
                    title: i18n('tut.view.3'),
                    text: i18n('tut.view.4'),
                },
                {
                    before: [call('switchDispTab', 'house')],
                    target: '#houseCanvas',
                    title: i18n('tut.view.5'),
                    text: () => i18n('tut.view.8', { econApi: onPreviewPage() ? (" " + i18n('tut.view.7', { econApi: econApi() ? (" " + i18n('tut.view.6')) : '' })) : '' }),
                },
                {
                    target: () => (document.getElementById('mnCollapseBtn') ? '#mnCollapseBtn' : navTarget()),
                    title: i18n('tut.view.9'),
                    text: i18n('tut.view.10'),
                },
                {
                    title: i18n('tut.view.11'),
                    text: i18n('tut.view.12'),
                },
            ],
        },
    ];
    const basicCount = LESSONS.filter(l => l.group === 'basic').length;
    // 잠긴 과정은 개발자 모드가 꺼져 있으면 목차에 🔒로만 보이고, 진행 수 · "다음 과정"에서 빠진다
    // 번호는 잠긴 과정 자리도 그대로 세어 건너뛴다 (#11 → 🔒 → #13)
    const isAvail = i => !!LESSONS[i] && (!LESSONS[i].locked || devOn());
    const availIdx = () => LESSONS.map((_, i) => i).filter(isAvail);
    const noOf = i => i + 1;
    const nextAvail = i => { for (let j = i + 1; j < LESSONS.length; j++) if (isAvail(j)) return j; return -1; };

    // ---- 마친 과정 기록 ----
    // 과정 id로 기록 (예전엔 순서 번호로 기록 — 예전 #1 ~ #5는 지금의 같은 과정 id로 옮겨 온다)
    const LEGACY_IDS = ['tour', 'parties', 'law', 'election', 'cabinet'];
    function doneIds() {
        let ids = null;
        try { ids = JSON.parse(localStorage.getItem(DONE_IDS_KEY) || 'null'); } catch (e) { ids = null; }
        if (!Array.isArray(ids)) {
            ids = [];
            try { (JSON.parse(localStorage.getItem(DONE_KEY) || '[]') || []).forEach(i => { if (LEGACY_IDS[i]) ids.push(LEGACY_IDS[i]); }); } catch (e) { /* 무시 */ }
        }
        return new Set(ids);
    }
    function doneSet() { const ids = doneIds(); return new Set(LESSONS.map((l, i) => ids.has(l.id) ? i : -1).filter(i => i >= 0)); }
    function markDone(li) {
        const ids = doneIds(); ids.add(LESSONS[li].id);
        try { localStorage.setItem(DONE_IDS_KEY, JSON.stringify([...ids])); } catch (e) { /* 저장 못 해도 진행엔 지장 없음 */ }
    }

    // mode: 'step'(과정 진행 중) · 'complete'(과정 완료 카드) · 'menu'(목차)
    let layer = null, spot = null, bubble = null, active = false, rafId = 0, tickId = 0, taskDone = false;
    let mode = 'step', lessonIdx = 0, stepIdx = 0;
    const curStep = () => (mode === 'step' ? LESSONS[lessonIdx].steps[stepIdx] : null);
    const stepText = (step, key) => (typeof step[key] === 'function' ? step[key]() : step[key]) || '';
    const q = sel => layer.querySelector(sel);

    function build() {
        layer = document.createElement('div');
        layer.className = 'tut-layer';
        layer.innerHTML = `
            <div class="tut-catcher"></div>
            <div class="tut-spot"></div>
            <div class="tut-bubble" role="dialog" aria-live="polite">
                <div class="tut-step"><span class="tut-lesson"></span><span class="tut-count"></span></div>
                <div class="tut-progress"></div>
                <div class="tut-title"></div>
                <div class="tut-text"></div>
                <div class="tut-menu"></div>
                <div class="tut-task"><span class="tut-task-icon"></span><span class="tut-task-text"></span></div>
                <div class="tut-actions">
                    <button type="button" class="tut-toc">${esc(i18n('tut.ui.1'))}</button>
                    <button type="button" class="tut-skip">${esc(i18n('tut.ui.2'))}</button>
                    <span class="tut-spacer"></span>
                    <button type="button" class="tut-prev">${esc(i18n('tut.ui.3'))}</button>
                    <button type="button" class="tut-next">${esc(i18n('tut.ui.4'))}</button>
                </div>
            </div>`;
        document.body.appendChild(layer);
        spot = q('.tut-spot');
        bubble = q('.tut-bubble');
        q('.tut-skip').addEventListener('click', stop);
        q('.tut-toc').addEventListener('click', showMenu);
        q('.tut-prev').addEventListener('click', prev);
        q('.tut-next').addEventListener('click', next);
    }

    function next() {
        if (mode === 'menu') return;
        if (mode === 'complete') {
            const n = nextAvail(lessonIdx);
            if (n >= 0) startLesson(n); else stop();
            return;
        }
        const step = curStep();
        if (step.task && !taskDone) return;
        if (stepIdx >= LESSONS[lessonIdx].steps.length - 1) showComplete();
        else showStep(stepIdx + 1);
    }
    function prev() {
        if (mode === 'step' && stepIdx > 0) showStep(stepIdx - 1);
    }

    function toElement(ref) {
        if (!ref) return null;
        if (ref instanceof Element) return ref;
        try { return document.querySelector(ref); } catch (e) { return null; }
    }

    function resolveTarget(step) {
        if (!step || !step.target) return null;
        const el = toElement(typeof step.target === 'function' ? step.target() : step.target);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return (r.width > 0 && r.height > 0) ? el : null;
    }

    // ---- 실습 단계: 허용한 영역만 누를 수 있게 ----
    function allowedEls(step) {
        const list = typeof step.allow === 'function' ? step.allow() : (step.allow || []);
        return list.map(toElement).filter(Boolean);
    }
    function isAllowed(target) {
        if (!(target instanceof Node)) return false;
        if (bubble && bubble.contains(target)) return true;
        // 앱 자체 확인/안내창은 언제나 누를 수 있어야 한다 (예: 법안 제목 없이 등록 → 안내창)
        if (target instanceof Element && target.closest('.hemi-dialog-overlay, #customAlertOverlay, #customConfirmOverlay')) return true;
        const step = curStep();
        return !!step && allowedEls(step).some(el => el === target || el.contains(target));
    }
    function guard(e) {
        const step = curStep();
        if (!active || !step || !step.task) return;
        // 스크립트가 보낸 클릭(사이드바·아래 탭 바·실행 버튼이 원래 탭 버튼을 대신 누르는 것)은 막지 않는다
        if (!e.isTrusted) return;
        if (isAllowed(e.target)) {
            if (e.type === 'click' && e.target instanceof Element && e.target.closest(execTarget())) T.execClicked = true;
            return;
        }
        e.preventDefault();
        e.stopPropagation();
    }
    const GUARDED = ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'contextmenu', 'auxclick'];

    function place() {
        if (!active) return;
        const el = resolveTarget(curStep());
        const vw = window.innerWidth, vh = window.innerHeight, pad = 8, gap = 14;
        const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
        if (!el) {
            layer.classList.add('tut-no-target');
            bubble.style.left = Math.round((vw - bw) / 2) + 'px';
            bubble.style.top = Math.round((vh - bh) / 2) + 'px';
            return;
        }
        const r = el.getBoundingClientRect();
        // 대상이 화면 밖(스크롤했거나 목록이 다시 그려져 밀려남)이면 비춤 없이 말풍선만 그쪽 가장자리에 둔다
        if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) {
            layer.classList.add('tut-no-target');
            bubble.style.left = Math.round(Math.min(Math.max(12, (vw - bw) / 2), vw - bw - 12)) + 'px';
            bubble.style.top = Math.round(r.top >= vh ? Math.max(12, vh - bh - 12) : 12) + 'px';
            return;
        }
        layer.classList.remove('tut-no-target');
        const box = {
            left: Math.max(4, r.left - pad), top: Math.max(4, r.top - pad),
            right: Math.min(vw - 4, r.right + pad), bottom: Math.min(vh - 4, r.bottom + pad),
        };
        Object.assign(spot.style, { left: box.left + 'px', top: box.top + 'px', width: Math.max(0, box.right - box.left) + 'px', height: Math.max(0, box.bottom - box.top) + 'px' });
        // 말풍선: 오른쪽 → 왼쪽 → 아래 → 위 순서로 들어갈 자리를 찾는다
        let left, top;
        const clampY = y => Math.min(Math.max(12, y), vh - bh - 12);
        const clampX = x => Math.min(Math.max(12, x), vw - bw - 12);
        if (box.right + gap + bw <= vw - 12) { left = box.right + gap; top = clampY(box.top); }
        else if (box.left - gap - bw >= 12) { left = box.left - gap - bw; top = clampY(box.top); }
        else if (box.bottom + gap + bh <= vh - 12) { top = box.bottom + gap; left = clampX(box.left); }
        else if (box.top - gap - bh >= 12) { top = box.top - gap - bh; left = clampX(box.left); }
        else {
            // 자리가 없으면 화면 위/아래 중 비춘 곳을 덜 가리는 쪽으로 (실습 중 조작할 곳을 덮지 않게)
            left = clampX((vw - bw) / 2);
            const overlap = y => Math.max(0, Math.min(y + bh, box.bottom) - Math.max(y, box.top));
            const upper = clampY(12), lower = clampY(vh - bh - 12);
            top = overlap(upper) <= overlap(lower) ? upper : lower;
        }
        bubble.style.left = Math.round(clampX(left)) + 'px';
        bubble.style.top = Math.round(clampY(top)) + 'px';
    }

    function schedulePlace() {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(place);
    }

    function renderTaskState() {
        const step = curStep();
        const taskEl = q('.tut-task');
        const nextBtn = q('.tut-next');
        if (!step || !step.task) {
            taskEl.style.display = 'none';
            nextBtn.disabled = false;
            nextBtn.classList.toggle('tut-ready', mode === 'complete');
            return;
        }
        taskEl.style.display = '';
        taskEl.classList.toggle('done', taskDone);
        q('.tut-task-icon').textContent = taskDone ? '✓' : '●';
        q('.tut-task-text').textContent = taskDone ? stepText(step, 'done') : i18n('tut.ui.5');
        nextBtn.disabled = !taskDone;
        nextBtn.classList.toggle('tut-ready', taskDone);
    }

    // 실습 완료 여부 확인 + 비춘 곳 따라가기 (탭 전환·목록 다시 그리기로 위치가 바뀌므로 주기적으로)
    function tick() {
        if (!active) return;
        const step = curStep();
        if (step) {
            if (step.task && !taskDone) {
                let ok = false;
                try { ok = !!step.task(); } catch (e) { ok = false; }
                if (ok) {
                    taskDone = true;
                    renderTaskState();
                    if (step.autoNext) {
                        const at = [lessonIdx, stepIdx];
                        setTimeout(() => { if (active && mode === 'step' && lessonIdx === at[0] && stepIdx === at[1]) next(); }, 700);
                    }
                }
            }
            if (typeof step.text === 'function') {
                const t = stepText(step, 'text');
                const textEl = q('.tut-text');
                if (textEl.textContent !== t) textEl.textContent = t;
            }
        }
        place();
    }

    function leaveCurrent() {
        const step = curStep();
        if (step && step.leave) { try { step.leave(); } catch (e) { /* 무시 */ } }
    }

    // 말풍선 머리: "#2 · 정당과 의석" + "3 / 4 · 실습" + 진행 점
    function renderHead(countText) {
        const lesson = LESSONS[lessonIdx];
        q('.tut-lesson').textContent = mode === 'menu' ? i18n('tut.ui.6') : `#${noOf(lessonIdx)} · ${lesson.title}${lesson.locked ? (" " + i18n('tut.ui.7', { locked: lesson.locked })) : ''}`;
        q('.tut-count').textContent = countText || '';
        const prog = q('.tut-progress');
        if (mode === 'step') {
            prog.style.display = '';
            prog.innerHTML = lesson.steps.map((_, i) => `<span class="${i < stepIdx ? 'past' : i === stepIdx ? 'now' : ''}"></span>`).join('');
        } else {
            prog.style.display = 'none';
        }
    }

    function setBody({ title, text, menu }) {
        q('.tut-title').textContent = title || '';
        q('.tut-text').textContent = text || '';
        q('.tut-text').style.display = text ? '' : 'none';
        const menuEl = q('.tut-menu');
        menuEl.style.display = menu ? '' : 'none';
        if (!menu) menuEl.innerHTML = '';
    }

    function setMode(m) {
        mode = m;
        layer.classList.toggle('tut-mode-menu', m === 'menu');
        layer.classList.toggle('tut-mode-complete', m === 'complete');
    }

    function showStep(i) {
        const steps = LESSONS[lessonIdx].steps;
        if (i < 0 || i >= steps.length) return;
        leaveCurrent();
        setMode('step');
        stepIdx = i;
        const step = steps[i];
        (step.before || []).forEach(fn => { try { fn(); } catch (e) { /* 탭 전환 실패는 안내만 계속 */ } });
        if (step.enter) { try { step.enter(); } catch (e) { /* 무시 */ } }
        taskDone = false;
        if (step.task) { try { taskDone = !!step.task(); } catch (e) { taskDone = false; } }
        layer.classList.toggle('tut-is-task', !!step.task);
        layer.classList.toggle('tut-nodim', !!step.noDim);
        renderHead(`${i + 1} / ${steps.length}${step.task ? (" " + i18n('tut.ui.8')) : ''}`);
        setBody({ title: stepText(step, 'title'), text: stepText(step, 'text') });
        const prevBtn = q('.tut-prev');
        prevBtn.style.display = '';
        prevBtn.disabled = i === 0;
        q('.tut-toc').style.display = '';
        q('.tut-skip').textContent = i18n('tut.ui.2');
        q('.tut-next').style.display = '';
        q('.tut-next').textContent = i === steps.length - 1 ? i18n('tut.ui.9', { lessonIdx: noOf(lessonIdx) }) : i18n('tut.ui.4');
        renderTaskState();
        // 탭 전환 직후 레이아웃(목록·캔버스 다시 그리기 등)이 끝난 뒤 대상으로 스크롤하고 위치를 잡는다
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const el = resolveTarget(step);
            if (el && el.scrollIntoView) el.scrollIntoView({ block: step.task ? 'center' : 'nearest' });
            place();
        }));
    }

    function startLesson(li) {
        li = Math.max(0, Math.min(LESSONS.length - 1, li));
        const l = LESSONS[li];
        if (l.locked && !devOn()) { showMenu(); return; }
        // 미리보기 기능은 Teaser 화면에만 있다 — 그 화면으로 옮겨 서독 튜토리얼로 시작한 뒤 이 과정을 연다
        if (l.locked && !onPreviewPage(l)) { launchPreview(l); return; }
        lessonIdx = li;
        showStep(0);
    }
    const PENDING_KEY = 'hemiTutorialStartLesson';
    function launchPreview(l) {
        try {
            sessionStorage.setItem('hemiBootPresetId', 'builtin:tutorial');
            sessionStorage.setItem('hemiBootNewSaveName', i18n('tut.ui.10', { locked: l.locked }));
            sessionStorage.setItem(PENDING_KEY, l.id);
        } catch (e) { /* sessionStorage 없음 — 그냥 화면만 옮긴다 */ }
        stop();
        location.href = `teaser${previewPageFor(l)}.html`;
    }

    function showComplete() {
        leaveCurrent();
        layer.classList.remove('tut-nodim');
        markDone(lessonIdx);
        setMode('complete');
        layer.classList.remove('tut-is-task');
        taskDone = false;
        const nIdx = nextAvail(lessonIdx);
        const last = nIdx < 0;
        const basicDone = LESSONS[lessonIdx].group === 'basic' && lessonIdx === basicCount - 1;
        renderHead(i18n('tut.ui.11'));
        const nextLesson = LESSONS[nIdx];
        const nextNo = nIdx >= 0 ? noOf(nIdx) : '';
        setBody({
            title: i18n('tut.ui.12', { lessonIdx: noOf(lessonIdx), title: LESSONS[lessonIdx].title }),
            text: last
                ? i18n('tut.ui.13')
                : basicDone
                    ? i18n('tut.ui.14', { basicCount, nextNo, title: nextLesson.title })
                    : i18n('tut.ui.16', { nextNo, title: nextLesson.title, summary: nextLesson.summary, nextLesson: nextLesson.locked && !onPreviewPage(nextLesson) ? (" " + i18n('tut.ui.15', { nextLesson: previewName(nextLesson) })) : '' }),
        });
        q('.tut-prev').style.display = 'none';
        q('.tut-toc').style.display = '';
        q('.tut-next').style.display = '';
        q('.tut-next').textContent = last ? i18n('tut.ui.17') : i18n('tut.ui.18', { nextNo });
        q('.tut-skip').textContent = last ? i18n('tut.ui.19') : i18n('tut.ui.20');
        renderTaskState();
        requestAnimationFrame(place);
    }

    // 목차: 전체 진행 막대 · "이어서 하기" · 기본/세부 탭 · 과정 카드 (세부는 넓은 화면에서 두 줄)
    let menuTab = null; // 'basic' | 'detail' — 목차를 다시 열어도 보던 탭 유지
    function showMenu() {
        leaveCurrent();
        layer.classList.remove('tut-nodim');
        setMode('menu');
        layer.classList.remove('tut-is-task');
        taskDone = false;
        const avail = availIdx();
        const done = new Set([...doneSet()].filter(isAvail));
        const idxOf = g => LESSONS.map((l, i) => (l.group === g ? i : -1)).filter(i => i >= 0);
        const tabs = { basic: idxOf('basic'), detail: idxOf('detail') };
        const doneIn = g => tabs[g].filter(i => done.has(i)).length;
        const countIn = g => tabs[g].filter(isAvail).length;
        const firstTodo = avail.find(i => !done.has(i)) ?? -1;
        if (!menuTab) menuTab = doneIn('basic') < tabs.basic.length ? 'basic' : 'detail';
        const allDone = done.size === avail.length;
        renderHead(i18n('tut.ui.21', { size: done.size, avail: avail.length }));
        setBody({
            title: allDone ? i18n('tut.ui.22') : done.size ? i18n('tut.ui.23') : i18n('tut.ui.24'),
            text: allDone
                ? i18n('tut.ui.25')
                : i18n('tut.ui.26'),
            menu: true,
        });
        const menuEl = q('.tut-menu');
        const TAB_INFO = {
            basic: [i18n('tut.ui.27'), i18n('tut.ui.28')],
            detail: [i18n('tut.ui.29'), i18n('tut.ui.30')],
        };
        const pct = Math.round(done.size / Math.max(1, avail.length) * 100);
        menuEl.innerHTML = `
            <div class="tut-menu-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
            ${!allDone && done.size > 0 ? `<button type="button" class="tut-continue" data-lesson="${firstTodo}"><span class="tut-continue-label">${esc(i18n('tut.ui.31'))}</span><span class="tut-continue-title"></span><span class="tut-lesson-mark">›</span></button>` : ''}
            <div class="tut-tabs" role="tablist">
                ${['basic', 'detail'].map(g => `
                <button type="button" role="tab" class="tut-tab${menuTab === g ? ' active' : ''}" data-tab="${g}" aria-selected="${menuTab === g}">
                    ${TAB_INFO[g][0]} <span class="tut-tab-count">${doneIn(g)}/${countIn(g)}</span>
                </button>`).join('')}
            </div>
            <div class="tut-tab-sub">${TAB_INFO[menuTab][1]}</div>
            <div class="tut-lesson-list tut-list-${menuTab}">
                ${tabs[menuTab].map(i => isAvail(i) ? `
                <button type="button" class="tut-lesson-btn${done.has(i) ? ' done' : ''}${i === firstTodo ? ' next' : ''}" data-lesson="${i}">
                    <span class="tut-lesson-no">#${noOf(i)}</span>
                    <span class="tut-lesson-main"><span class="tut-lesson-title"></span><span class="tut-lesson-sum"></span></span>
                    <span class="tut-lesson-mark">${done.has(i) ? '✓' : '›'}</span>
                </button>` : `
                <button type="button" class="tut-lesson-btn tut-lesson-locked" data-lesson="${i}" aria-disabled="true" title="${esc(i18n('tut.ui.32', { locked: LESSONS[i].locked }))}">
                    <span class="tut-lesson-no">🔒</span>
                    <span class="tut-lesson-main"><span class="tut-lesson-title"></span><span class="tut-lesson-sum"></span></span>
                    <span class="tut-lesson-mark"></span>
                </button>`).join('')}
            </div>`;
        menuEl.querySelectorAll('.tut-lesson-btn').forEach(btn => {
            const l = LESSONS[+btn.dataset.lesson];
            btn.querySelector('.tut-lesson-title').textContent = l.title;
            if (btn.classList.contains('tut-lesson-locked')) {
                btn.querySelector('.tut-lesson-sum').textContent = i18n('tut.ui.32', { locked: l.locked });
                return;
            }
            btn.querySelector('.tut-lesson-sum').textContent = i18n('tut.ui.34', { summary: l.summary, steps: l.steps.length, locked: l.locked ? (" " + i18n('tut.ui.33', { locked: l.locked })) : '' });
            btn.addEventListener('click', () => startLesson(+btn.dataset.lesson));
        });
        const cont = menuEl.querySelector('.tut-continue');
        if (cont) {
            cont.querySelector('.tut-continue-title').textContent = `#${noOf(firstTodo)} ${LESSONS[firstTodo].title}`;
            cont.addEventListener('click', () => startLesson(firstTodo));
        }
        menuEl.querySelectorAll('.tut-tab').forEach(btn => btn.addEventListener('click', () => {
            if (menuTab === btn.dataset.tab) return;
            menuTab = btn.dataset.tab;
            showMenu();
        }));
        q('.tut-prev').style.display = 'none';
        q('.tut-toc').style.display = 'none';
        q('.tut-next').style.display = 'none';
        q('.tut-skip').textContent = i18n('tut.ui.19');
        renderTaskState();
        requestAnimationFrame(place);
    }

    const isEditable = el => el instanceof Element && (el.matches('input, textarea, select') || el.isContentEditable);
    function onKey(e) {
        if (!active) return;
        if (isEditable(e.target)) return; // 입력 칸에서의 Enter/화살표/Esc는 그대로 입력 칸 몫
        if (document.querySelector('.hemi-dialog-overlay')) return; // 앱의 알림 · 확인창이 떠 있으면 그 창이 키를 처리
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(); }
        else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            // 실습 단계에선 누를 수 있게 허용한 버튼 위의 Enter는 그대로 둔다
            const step = curStep();
            if (step && step.task && e.key === 'Enter' && isAllowed(e.target)) return;
            e.preventDefault(); e.stopPropagation(); next();
        }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); prev(); }
    }

    // start() — 처음이면 #1부터, 이미 마친 과정이 있으면 목차부터. start(n) — n번째 과정(0부터)을 바로 시작
    function start(lesson) {
        if (active) return;
        if (!layer) build();
        resetProgress();
        active = true;
        layer.style.display = '';
        q('.tut-skip').textContent = i18n('tut.ui.2');
        window.addEventListener('resize', schedulePlace);
        window.addEventListener('scroll', schedulePlace, true);
        window.addEventListener('keydown', onKey, true);
        GUARDED.forEach(t => window.addEventListener(t, guard, true));
        tickId = setInterval(tick, 250);
        // 시작 화면의 튜토리얼 탭에서 과정을 골랐거나, 잠긴(미리보기) 과정을 골라 Teaser 화면으로 넘어온 경우 — 그 과정을 바로 연다
        let pending = null;
        try { pending = sessionStorage.getItem(PENDING_KEY); sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* 없음 */ }
        const pendingIdx = pending ? LESSONS.findIndex(l => l.id === pending) : -1;
        if (typeof lesson !== 'number' && pendingIdx >= 0 && isAvail(pendingIdx) && (!LESSONS[pendingIdx].locked || onPreviewPage(LESSONS[pendingIdx]))) lesson = pendingIdx;
        if (typeof lesson === 'number') startLesson(lesson);
        else if (doneSet().size > 0) showMenu();
        else startLesson(0);
    }

    function stop() {
        if (!active) return;
        leaveCurrent();
        active = false;
        layer.style.display = 'none';
        clearInterval(tickId);
        window.removeEventListener('resize', schedulePlace);
        window.removeEventListener('scroll', schedulePlace, true);
        window.removeEventListener('keydown', onKey, true);
        GUARDED.forEach(t => window.removeEventListener(t, guard, true));
    }

    window.HemiTutorial = {
        start, stop, next, showMenu,
        // goto(과정, 단계) — 튜토리얼이 켜져 있을 때 특정 단계로 바로 이동 (0부터)
        goto: (li, si = 0) => { if (!active || !LESSONS[li]) return; lessonIdx = li; showStep(Math.max(0, Math.min(si, LESSONS[li].steps.length - 1))); },
        // 시작 화면(index.html) 튜토리얼 탭용 목록 — 번호 · 제목 · 요약 · 마침 여부 · 열 수 있는지
        catalog: () => { const done = doneIds(); return LESSONS.map((l, i) => ({ id: l.id, group: l.group, no: noOf(i), title: typeof l.title === 'function' ? l.title() : l.title, summary: typeof l.summary === 'function' ? l.summary() : (l.summary || ''), locked: !!l.locked, avail: isAvail(i), done: done.has(l.id) })); },
        lessonGroups: () => LESSONS.map(l => ({ id: l.id, group: l.group, title: l.title, steps: l.steps.length, targets: l.steps.map(st => !!st.target) })),
        isActive: () => active,
        lessons: LESSONS.map(l => ({ title: l.title, steps: l.steps.length })),
        state: () => ({ mode, lesson: lessonIdx, step: stepIdx, taskDone }),
    };
})();
