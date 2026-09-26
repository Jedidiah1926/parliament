// ===== Hemicycle — 튜토리얼(조작법 안내) =====
// "튜토리얼 공화국" 프리셋으로 시작하면 자동으로 켜지는 단계별 안내. 짧은 과정(#1 · #2 · #3 …)으로 나뉘어 있고,
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

    const DONE_KEY = 'dnoTutorialDone';          // 예전 기록(과정 순서 번호)
    const DONE_IDS_KEY = 'dnoTutorialDoneIds';   // 지금 기록(과정 id)
    const isMobileLayout = () => document.documentElement.getAttribute('data-ui-mode') === 'mobile';
    const hasEl = id => !!document.getElementById(id);
    // 메뉴: 데스크톱은 세로 사이드바, 모바일은 아래 탭 바 (없으면 원래 가로 탭 줄)
    const navTarget = () => isMobileLayout()
        ? (hasEl('mobileNav') ? '#mobileNav' : '.main-tab-container')
        : (hasEl('sideNav') ? '#sideNav' : '.main-tab-container');
    const execTarget = () => (isMobileLayout() && hasEl('mobileExecFab')) ? '#mobileExecFab' : '.simulate-btn';
    const call = (name, ...args) => () => { if (typeof window[name] === 'function') window[name](...args); };
    const go = (main, sub) => call('switchSubTab', main, sub);
    // 모바일 화면 모드에선 편집 패널/좌석 화면 중 하나만 보이므로 필요한 쪽으로 전환
    const showPanel = which => () => { if (isMobileLayout() && typeof setMobilePanel === 'function') setMobilePanel(which); };

    // ---- 앱 상태 읽기 (dno.js/teaser.js의 최상위 let 변수는 window 속성이 아니라 이름으로만 보인다) ----
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
    // 의원내각제 자동 총리: 다수당 대표 (dno.js의 pmAutoSource()가 정한 정당)
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
    // 개표 화면: 보이는 선거결과 패널 (모바일은 좁으니 반원 부분만 비춰 말풍선이 결과를 덜 가리게)
    const resultTarget = () => {
        const panel = ['House', 'Senate', 'Third'].map(c => document.getElementById('dispPanelElecResult' + c)).find(el => el && el.offsetParent !== null);
        if (!panel) return '.display-area';
        return isMobileLayout() ? (panel.querySelector('[id^="elecViewArc"]') || panel) : (panel.querySelector('.chamber-box') || panel);
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
    const byId = (id, up) => () => { const el = document.getElementById(id); return el ? ((up && el.closest(up)) || el) : null; };
    const helpTarget = () => isMobileLayout() ? navTarget() : (document.querySelector('#sideNav .mn-group[data-tone="muted"]') ? '#sideNav .mn-group[data-tone="muted"]' : navTarget());

    // group: 'basic'(기본 — 처음이라면 순서대로) · 'detail'(세부 — 필요한 기능만 골라서)
    // id: 마친 과정 기록용 고유 이름 (순서가 바뀌거나 과정이 늘어도 ✓ 표시가 어긋나지 않게)
    const LESSONS = [
        // ===================== 기본 튜토리얼 =====================
        {
            id: 'tour', group: 'basic',
            title: '화면 둘러보기',
            summary: '메뉴 이동 · 의석 화면 · 날짜 줄 · 세이브 탭',
            steps: [
                {
                    title: '튜토리얼 공화국에 오신 것을 환영합니다',
                    text: '가상의 나라 "튜토리얼 공화국"에서 직접 조작해 보며 배웁니다. 튜토리얼은 두 가지예요 — 기본 튜토리얼(#1 ~ #6)은 처음 쓰는 분을 위한 핵심 흐름이고, 세부 튜토리얼은 이념 · 파벌 · 지도 · 선거 방식 · 정부 권한 같은 기능을 필요한 것만 골라 배웁니다. 밝게 표시된 곳을 실제로 조작해야 넘어가는 단계도 있어요. 이 나라는 복사본(새 세이브)이라 마음껏 바꿔도 괜찮습니다.',
                },
                {
                    // 일부러 다른 화면(국가 › 상징)을 띄워 두고 메뉴로 돌아오게 한다
                    before: [closePanels, go('nation', 'symbol'), showPanel('controls')],
                    target: navTarget,
                    allow: () => isMobileLayout() ? ['#mobileNav', '.main-tab-content > .sub-tab-container'] : [navTarget()],
                    title: '메뉴 이동하기',
                    text: () => isMobileLayout()
                        ? '기능은 의회 · 입법 · 국가 · 선거 · 여론 · 내각 여섯 묶음으로 나뉘어 있고, 회색 "도움말"에는 모든 탭의 설명이 있어요. 화면 아래 탭 바에서 "의회"를 누르고, 위쪽 칩 줄에서 "정당"을 골라보세요.'
                        : '기능은 의회 · 입법 · 국가 · 선거 · 여론 · 내각 여섯 묶음으로 나뉘어 있고, 맨 아래 회색 "도움말"에는 모든 탭의 설명이 있어요. 왼쪽 메뉴에서 의회 › 정당을 눌러보세요.',
                    task: () => isActive('mainTabSetup') && isActive('subTabParty'),
                    done: '정당 화면이 열렸어요.',
                },
                {
                    before: [call('switchDispTab', 'house'), call('closeSeatInfoCard')],
                    target: () => (isMobileLayout() && document.documentElement.getAttribute('data-mobile-panel') !== 'display')
                        ? '#mobileNav .mobile-nav-seats' : '#houseCanvas',
                    allow: ['#mobileNav', '#houseCanvas', '#seatInfoCard'],
                    title: '의석 살펴보기',
                    text: () => isMobileLayout()
                        ? '의석은 반원 모양으로 그려집니다. 아래 탭 바의 "의석"을 눌러 의석 화면으로 간 뒤, 좌석(점) 하나를 눌러보세요.'
                        : '의석은 반원 모양으로 그려집니다. 좌석(점) 하나를 눌러보세요.',
                    task: seatCardOpen,
                    done: '그 자리의 정당 · 의원 정보가 떴어요. 좌석을 오른쪽 클릭(길게 누르기)하면 이미지로 내보낼 수도 있어요.',
                },
                {
                    before: [call('closeSeatInfoCard'), showPanel('display')],
                    target: '#dispInfoBar',
                    title: '날짜와 회기',
                    text: '시각 화면 맨 위 줄에는 나라의 현재 날짜와 회기가 보입니다. ▶ · ▶▶ · ▶▶▶로 하루 · 일주일 · 한 달씩 넘기고, "다음 회기"로 회기를 올려요. ⚙를 누르면 날짜 · 회기 설정 창이 뜹니다. (자세한 건 세부 튜토리얼 "날짜와 회기")',
                },
                {
                    before: [showPanel('controls')],
                    target: '#saveTabBar',
                    title: '세이브 탭',
                    text: '맨 위의 탭 하나하나가 세이브(나라 하나)입니다. 누르면 그 나라로 바로 바뀌고, 진행 상황은 세이브마다 따로 자동저장돼요. +는 새 탭(새로 만들기 · 프리셋 · 닫은 탭 다시 열기), 탭 이름을 더블클릭하면 이름 바꾸기, ×는 탭만 닫기(세이브는 남아요)입니다. 맨 왼쪽 ⌂는 저장하고 메인 화면으로 돌아갑니다.',
                },
            ],
        },
        {
            id: 'parties', group: 'basic',
            title: '정당과 의석',
            summary: '정당 만들기 · 이름 짓기 · 의석 배정 · 다시 계산',
            steps: [
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info'), showPanel('controls')],
                    enter: () => { if (!T.basePartyIds) T.basePartyIds = new Set(partyList().map(p => p.id)); },
                    target: '#innerContentPartyInfo > button.add-btn[onclick^="addParty"]',
                    allow: ['#innerContentPartyInfo > button.add-btn[onclick^="addParty"]'],
                    title: '정당 만들기',
                    text: '의회 › 정당 › 정보에서는 정당을 추가하고 이름 · 색 · 이념을 정합니다. "[+] 정당 추가"를 눌러 새 정당을 만들어 보세요.',
                    task: () => {
                        if (tutParty()) return true;
                        const added = partyList().filter(p => T.basePartyIds && !T.basePartyIds.has(p.id));
                        if (added.length) T.newPartyId = added[added.length - 1].id;
                        return !!tutParty();
                    },
                    done: '새 정당 "신당"이 목록에 생겼어요.',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info'), showPanel('controls')],
                    target: () => nameInput(),
                    allow: () => { const el = nameInput(); return el ? [el.closest('.card-item')] : []; },
                    title: '정당 이름 짓기',
                    text: '방금 만든 정당의 이름 칸에 원하는 이름을 입력해 보세요. 옆의 색 칸으로 정당 색도 바꿀 수 있어요.',
                    task: () => {
                        const p = tutParty();
                        if (!p) return true; // 정당이 지워졌으면 이 단계는 건너뜀
                        const el = nameInput();
                        const typed = el ? el.value.trim() : p.name;
                        return (!!typed && typed !== '신당') || (!!p.name && p.name !== '신당');
                    },
                    done: '멋진 이름이네요!',
                    leave: () => { const el = nameInput(); if (el && document.activeElement === el) el.blur(); }, // onchange로 이름 확정
                },
                {
                    before: [go('setup', 'settings'), call('switchSetupInnerTab', 'house'), showPanel('controls')],
                    target: () => { const t = document.getElementById('houseTotal'); return t ? t.closest('div[style*="grid"]') || t : null; },
                    allow: ['#houseTotal', '#partyListHouse'],
                    title: '빈자리 만들기',
                    enter: () => { if (T.totalBase == null) T.totalBase = houseTotal(); },
                    text: () => `의회 › 의회 구성의 "배정 합계"는 정당 의석을 모두 더한 값이고, 총 의석 수를 넘을 수 없습니다. 기존 정당들이 이미 ${T.totalBase}석을 다 차지하고 있으면 새 정당이 앉을 자리가 없어요. 총 의석 수를 늘리거나(예: ${T.totalBase + 20}) 다른 정당 의석을 줄여 빈자리를 만들어 보세요.`,
                    task: () => !tutParty() || freeHouseSeats() > 0 || (tutParty().seatsHouse || 0) > 0,
                    done: () => `${freeHouseSeats()}석이 비었어요.`,
                },
                {
                    before: [go('setup', 'settings'), call('switchSetupInnerTab', 'house'), showPanel('controls')],
                    target: () => seatInput(),
                    allow: () => { const el = seatInput(); return el ? [el.closest('.card-item'), '#houseTotal'] : ['#houseTotal']; },
                    title: '의석 나눠주기',
                    text: () => `이제 ${tutParty() ? `"${tutParty().name}"` : '새 정당'}의 의석 칸에 숫자를 넣어보세요. 남은 자리(${freeHouseSeats() + ((tutParty() && tutParty().seatsHouse) || 0)}석)까지만 넣을 수 있어요.`,
                    task: () => {
                        const p = tutParty();
                        if (!p) return true;
                        const el = seatInput();
                        return (p.seatsHouse || 0) > 0 || (!!el && parseInt(el.value, 10) > 0);
                    },
                    done: '의석이 배정됐어요.',
                    leave: () => { const el = seatInput(); if (el && document.activeElement === el) el.blur(); },
                },
                {
                    before: [showPanel('controls')],
                    enter: () => { T.execClicked = false; },
                    target: execTarget,
                    allow: () => [execTarget()],
                    title: '다시 계산하기',
                    text: () => isMobileLayout()
                        ? '설정을 바꾼 뒤에는 실행 버튼을 눌러 의석 화면을 새로 그립니다. 지금 눌러보세요. 아래 탭 바의 "의석"에서 새 정당의 자리를 확인할 수 있어요.'
                        : '설정을 바꾼 뒤에는 이 버튼을 눌러 의석 화면을 새로 그립니다. 지금 눌러보세요. (입력 칸 밖에서 Enter 키를 눌러도 같아요)',
                    task: () => T.execClicked,
                    done: '의석 화면이 새로 그려졌어요. 새 정당의 자리도 생겼을 거예요.',
                },
            ],
        },
        {
            id: 'law', group: 'basic',
            title: '입법',
            summary: '법안 제출 · 상정 · 표결 · 표결 기록',
            steps: [
                {
                    before: [go('law', 'bill'), showPanel('controls')],
                    enter: () => { if (T.billBase == null) T.billBase = billList().length; },
                    target: () => billForm(),
                    allow: () => { const f = billForm(); return f ? [f] : []; },
                    title: '법안 제출하기',
                    text: '입법 › 제출에서 법안을 작성합니다. 법안 제목을 적고 "[+] 법안 등록"을 눌러보세요. (내용 · 태그 · 가결 기준은 비워 둬도 돼요)',
                    task: () => billList().length > (T.billBase || 0),
                    done: '법안이 등록됐어요!',
                },
                {
                    before: [go('law', 'table'), showPanel('controls')],
                    target: '#billList',
                    title: '상정하기',
                    text: '입법 › 상정에는 등록된 법안이 모입니다. 법안마다 의회에 올릴지 국무회의에 올릴지 고르고, 법안을 누르면 표결로 넘어가요. 검색과 태그로 찾을 수 있습니다.',
                },
                {
                    before: [go('law', 'vote'), showPanel('controls')],
                    target: '#contentVote',
                    title: '표결하기',
                    text: '입법 › 표결에서 심의할 법안을 고른 뒤, 찬성 · 반대 · 기권을 골라 반원의 좌석을 누르거나 정당별로 한 번에 표를 던집니다. 원마다 "표결 확정"을 누르면 가결 · 부결이 정해지고, 양원제면 하원을 통과한 뒤 상원 표결로 넘어가요.',
                },
                {
                    before: [go('law', 'archive'), showPanel('controls')],
                    target: '#contentArchive',
                    title: '표결 기록',
                    text: '입법 › 표결 기록에는 가결 · 부결 · 거부된 법안이 남습니다. 상태 · 태그로 걸러 보고, 가결된 법안에서 개정안을 낼 수 있어요.',
                },
            ],
        },
        {
            id: 'election', group: 'basic',
            title: '여론과 선거',
            summary: '지지율 입력 · 개표 · 의회에 반영',
            steps: [
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'prob'), call('switchElecProbChamber', 'house'), showPanel('controls')],
                    enter: () => { T.probBase = probInputs().map(el => el.value); },
                    target: '#elecInputList',
                    allow: ['#elecInputList'],
                    title: '지지율 정하기',
                    text: '여론 › 지지율에서 정당마다 예상 지지율(%)을 정합니다. 선거는 이 숫자를 바탕으로 치러져요. 한 정당 이상에 지지율을 입력해 보세요 (예: 40).',
                    task: () => {
                        const vals = probInputs().map(el => el.value);
                        return vals.some((v, i) => v !== (T.probBase || [])[i]) && vals.some(v => parseFloat(v) > 0);
                    },
                    done: '지지율이 입력됐어요.',
                    leave: () => { const el = document.activeElement; if (el && el.closest && el.closest('#elecInputList')) el.blur(); },
                },
                {
                    before: [go('vote', 'elecGeneral'), showPanel('controls')],
                    target: '#elecRunBtn',
                    allow: ['#elecRunBtn', '#contentElecGeneral'],
                    title: '선거 치르기',
                    text: '선거 › 총선에서 "개표 시작"을 누르면 지지율에 따라 개표가 진행됩니다. 지금 눌러보세요.',
                    task: electionStarted,
                    done: '개표가 시작됐어요!',
                    autoNext: true, // 개표가 시작되면 바로 결과 화면을 보여주는 다음 단계로
                },
                {
                    before: [showPanel('display')],
                    target: () => resultTarget(),
                    noDim: true, // 개표가 진행되는 모습을 가리지 않게 어둡게 하지 않는다
                    title: '개표 지켜보기',
                    text: () => (electionRunning()
                        ? '개표가 진행 중입니다. 반원에 의석이 하나씩 채워지는 모습을 지켜보세요. '
                        : '개표가 끝났어요. ')
                        + '결과를 확인한 뒤 선거 › 총선의 "✔ 의회에 반영"을 누르면 그 결과대로 의석이 바뀌어요. 결과는 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있고, 개표 속도는 선거 설정에서 조절합니다.',
                },
                {
                    before: [go('vote', 'elecGeneral'), showPanel('controls')],
                    target: () => document.getElementById('elecPostBtns') && document.getElementById('elecPostBtns').offsetParent ? '#elecPostBtns' : '#elecRunBtn',
                    allow: ['#elecPostBtns', '#contentElecGeneral'],
                    title: '의회에 반영하기',
                    text: '개표만으로는 의회가 바뀌지 않습니다. 개표가 끝나면 "✔ 의회에 반영"을 눌러 결과대로 의석을 바꿔보세요. (마음에 안 들면 "재개표"로 다시 셀 수 있어요)',
                    task: elecApplied,
                    done: '새 의회가 구성됐어요! 의석 화면의 반원이 선거 결과대로 바뀌었습니다.',
                },
            ],
        },
        {
            id: 'cabinet', group: 'basic',
            title: '내각',
            summary: '총리와 당수 · 국무위원 · 내각 화면',
            steps: [
                {
                    before: [go('cabinet', 'pm'), showPanel('controls')],
                    target: () => pmBlock(),
                    title: '총리는 누가 될까?',
                    text: '내각 › 내각 설정에서 대통령제 · 이원집정부제 · 의원내각제 등 정부 형태를 고릅니다. 튜토리얼 공화국은 의원내각제라, 의석이 가장 많은 정당의 대표(당수)가 자동으로 총리가 돼요 (👑 표시).',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'leader'), showPanel('controls')],
                    target: () => leaderInput(),
                    allow: () => { const el = leaderInput(); return el ? [el.closest('.card-item')] : []; },
                    title: '다수당 대표 정하기',
                    text: () => `의회 › 정당 › 당수에서 정당 대표를 정합니다. 다수당${majorityParty() ? ` "${majorityParty().name}"` : ''}의 당수 이름을 적어보세요.`,
                    task: () => {
                        const p = majorityParty();
                        if (!p) return true; // 자동 총리를 쓰지 않는 나라면 이 단계는 건너뜀
                        const el = leaderInput();
                        return !!(p.leaderName || '').trim() || (!!el && el.value.trim() !== '');
                    },
                    done: '당수가 정해졌어요. 이제 내각 › 총리에도 이 사람이 총리로 표시됩니다.',
                    leave: () => { const el = leaderInput(); if (el && document.activeElement === el) el.blur(); }, // onchange로 확정
                },
                {
                    before: [go('cabinet', 'cabinetmembers'), showPanel('controls')],
                    enter: () => { if (T.cabinetBase == null) T.cabinetBase = cabinetList().length; },
                    target: '#addCabinetMemberBtn',
                    allow: ['#addCabinetMemberBtn'],
                    title: '국무위원 추가하기',
                    text: '내각 › 내각 구성원에서 장관 같은 국무위원을 추가합니다. "[+] 국무위원 추가"를 눌러보세요.',
                    task: () => cabinetList().length > (T.cabinetBase || 0),
                    done: '국무위원 자리가 생겼어요. 이름 · 직책 · 소속 정당을 채울 수 있어요.',
                },
                {
                    before: [call('switchDispTab', 'cabinet'), showPanel('display')],
                    target: '#dispPanelCabinet',
                    title: '내각 화면',
                    text: '의석 화면의 "내각" 탭에서 총리와 국무위원이 한눈에 보입니다. 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있어요.',
                },
            ],
        },
        {
            id: 'save', group: 'basic',
            title: '저장과 메인 화면',
            summary: '저장 창 · 탭 닫기와 다시 열기 · 도움말 · 메인 화면',
            steps: [
                {
                    before: [closePanels, call('switchDispTab', 'house'), showPanel('controls')],
                    target: '#saveTabSaveBtn',
                    allow: ['#saveTabSaveBtn', '#savePanelLayer'],
                    title: '저장 창 열기',
                    text: '맨 위 탭 바 오른쪽 끝의 "저장" 버튼을 눌러보세요. 저장과 관련된 것이 모두 이 창에 모여 있어요.',
                    task: savePanelOpen,
                    done: '저장 창이 열렸어요.',
                },
                {
                    before: [call('openSavePanel')],
                    target: '#savePanelLayer .save-panel',
                    title: '저장 창 둘러보기',
                    text: '맨 위는 지금 세이브와 "지금 저장"(Ctrl+S와 같음), 그 아래는 자동저장과 저장 주기입니다. 세이브 목록에서 ★로 즐겨찾기 · 이름 바꾸기 · 삭제를 하고, "다른 이름으로 저장"으로 지금 상태를 새 세이브로 복사해요. 파일(.json)로 저장해 두면 다른 기기에서도 불러올 수 있습니다.',
                },
                {
                    before: [closePanels, showPanel('controls')],
                    target: () => document.getElementById('saveTabNewBtn') ? '#saveTabNewBtn' : '#saveTabBar',
                    title: '탭 닫기와 다시 열기',
                    text: '탭의 ×는 세이브를 지우지 않고 탭만 닫습니다. 탭을 모두 닫으면 아래 화면이 비어요. 닫은 탭은 + › "닫은 탭 다시 열기"로 다시 띄웁니다. 세이브를 정말 지우려면 저장 창의 세이브 목록이나 시작 화면의 🗑를 쓰세요.',
                },
                {
                    before: [showPanel('controls')],
                    target: helpTarget,
                    title: '도움말',
                    text: '메뉴 맨 아래 회색 "도움말" 묶음에는 모든 탭이 무슨 일을 하는지 카드로 정리돼 있고, "열기 →"로 그 탭에 바로 갈 수 있어요. 헷갈릴 때 먼저 찾아보세요.',
                },
                {
                    before: [showPanel('controls')],
                    target: '#saveTabBar .save-tab-home',
                    title: '메인 화면',
                    text: '⌂를 누르면 저장한 뒤 메인 화면으로 갑니다. 메인 화면에서는 시작하기(세이브 고르기 · 프리셋 · 파일 불러오기), 맵 메이커, 로드맵, 설정(라이트 · 다크 · 네온 테마, 데스크톱 · 모바일 화면 모드)을 고르고, 🌐로 언어를 바꿉니다. 이 튜토리얼은 시작하기 › 프리셋의 "튜토리얼 공화국"으로 언제든 다시 할 수 있어요.',
                },
            ],
        },

        // ===================== 세부 튜토리얼 =====================
        {
            id: 'ideology', group: 'detail',
            title: '이념과 서브 이념',
            summary: '이념 추가 · 하위 이념 · 좌석 순서',
            steps: [
                {
                    before: [closePanels, go('setup', 'ideology'), showPanel('controls')],
                    target: '#contentIdeology',
                    title: '이념 목록',
                    text: '의회 › 이념에서 정당이 속할 이념을 만듭니다. 위에서 아래 순서가 반원의 왼쪽 → 오른쪽 순서예요. 순서를 바꾸면 "자동 정렬"을 켠 정당들의 자리도 따라 바뀝니다.',
                },
                {
                    before: [go('setup', 'ideology'), showPanel('controls')],
                    target: () => document.querySelector('#contentIdeology button[onclick="addIdeology()"]') || '#contentIdeology',
                    title: '이념 · 서브 이념 추가',
                    text: '"이념 추가"로 새 이념을 만들고, 이념 옆의 하위 이념 버튼으로 서브 이념(예: 보수주의 › 온건 보수)을 만들 수 있어요. 정당의 이념 칸에서 서브 이념까지 골라 더 세밀하게 자리를 정합니다.',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info'), showPanel('controls')],
                    target: () => document.querySelector('#innerContentPartyInfo button[onclick="autoSortParties()"]') || '#innerContentPartyInfo',
                    title: '정당 자리 정렬',
                    text: '정당 목록의 순서가 반원의 자리 순서입니다. 자동 정렬을 누르면 이념 순서대로 정당을 다시 줄 세워요. 직접 끌거나 순서 버튼으로 옮길 수도 있습니다.',
                },
            ],
        },
        {
            id: 'party-adv', group: 'detail',
            title: '정당 심화',
            summary: '복제 · 상태 · 파벌 · 합당 · 당수와 원내대표',
            steps: [
                {
                    before: [closePanels, go('setup', 'party'), call('switchPartyGroupInnerTab', 'info'), showPanel('controls')],
                    target: '#partyInfoList',
                    title: '정당 카드',
                    text: '정당 카드에서 이름 · 약칭 · 색 · 이념 · 로고를 정하고, 어느 원(하원 · 상원 · 삼원)에 속하는지 고릅니다. 상태를 "활동 금지"로 바꾸면 그 정당은 표결 · 선거에서 빠져요. 복제 버튼은 정당을 그대로 복사합니다.',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info'), showPanel('controls')],
                    target: () => { const b = document.querySelector('#partyInfoList button[onclick^="addFaction"]'); return b ? (b.closest('.card-item') || b) : '#partyInfoList'; },
                    title: '파벌',
                    text: '정당 안에 파벌(계파)을 만들 수 있어요. 파벌마다 이름 · 색 · 의석을 정하면 반원에서 한 정당 안의 파벌이 색으로 나뉘어 보이고, 표결 때 파벌별로 표를 던질 수 있습니다.',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'info'), showPanel('controls')],
                    target: () => document.querySelector('button[onclick="openPartyMergeDialog()"]') || '#innerContentPartyInfo',
                    title: '합당',
                    text: '합당 창에서 여러 정당을 하나로 합칩니다. 흡수합당은 한 정당이 나머지를 흡수하고, 신설합당은 새 이름 · 이념의 정당을 만들어요. 합쳐지는 정당을 새 정당의 파벌로 남길 수도 있고, 정당의 파벌도 골라 합칠 수 있습니다.',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'leader'), showPanel('controls')],
                    target: '#innerContentPartyLeader',
                    title: '당수와 원내대표',
                    text: '정당 › 당수에서 정당 대표와 파벌 대표의 이름 · 사진을 정합니다. 원내대표도 따로 둘 수 있고, "의석 선택 → 붙여넣기"로 반원에서 고른 의원의 이름 · 사진을 그대로 가져올 수 있어요.',
                },
            ],
        },
        {
            id: 'assembly', group: 'detail',
            title: '의회 설정과 연정',
            summary: '단원제 · 양원제 · 삼원제 · 의장단 · 반원 가운데 · 연립정부',
            steps: [
                {
                    before: [closePanels, go('setup', 'assembly'), showPanel('controls')],
                    target: () => { const r = document.querySelector('input[name="systemType"]'); return r ? r.closest('div') : '#contentAssembly'; },
                    title: '원 구성',
                    text: '의회 › 의회 설정에서 단원제 · 양원제 · 삼원제를 고릅니다. 원이 늘어나면 의회 구성 · 표결 · 선거 · 시각 화면에 그 원이 함께 나타나요. 원 이름(예: 국회 · 원로원)은 의회 › 의회 구성에서 바꿉니다.',
                },
                {
                    before: [go('setup', 'assembly'), showPanel('controls')],
                    target: '#chamberLeadersList',
                    title: '의장단',
                    text: '원마다 의장과 부의장의 이름 · 사진을 정합니다. 부의장은 여러 명 둘 수 있고, 의장단은 시각 화면의 원 현황 아래에 표시돼요.',
                },
                {
                    before: [go('setup', 'assembly'), showPanel('controls')],
                    target: byId('chamberCenterLabelHouse', 'div'),
                    title: '반원 가운데 표시',
                    text: '반원 가운데에 총 의석 수를 보여줄지, 그 원의 로고 이미지를 보여줄지 원마다 고릅니다. 로고 칸을 눌러 이미지를 올린 뒤 "로고"를 고르세요.',
                },
                {
                    before: [go('setup', 'coalition'), showPanel('controls')],
                    target: '#contentCoalition',
                    title: '집권과 연정',
                    text: '의회 › 집권과 연정에서 정당들을 묶어 연립정부를 만듭니다. 집권 연정(★)과 대표당, 연정 밖에서 지지하는 각외협력 정당을 정하고, 단독 집권이나 무집권으로 둘 수도 있어요. 집권 세력은 반원에서 금색 테두리로 표시됩니다(의회 설정의 "집권 세력 강조").',
                },
                {
                    before: [go('setup', 'members'), showPanel('controls')],
                    target: '#contentMembers',
                    title: '지역구 의원 · 비례대표',
                    text: '의회 › 지역구 의원과 비례대표에서 의원 한 명 한 명의 이름 · 사진을 채웁니다. 지역구 의원을 궐석(빈자리)으로 처리하면 선거 › 총선에서 보궐선거로 그 자리만 다시 뽑을 수 있어요.',
                },
            ],
        },
        {
            id: 'map', group: 'detail',
            title: '지역구와 지도',
            summary: '맵 메이커 · 지도 올리기 · 지역구 편집 · 성향 · 권역',
            steps: [
                {
                    before: [closePanels, showPanel('controls')],
                    title: '맵 메이커로 지도 만들기',
                    text: '지역구는 실제 지도 모양으로 만듭니다. 메인 화면 › 맵 메이커에서 SVG 지도 파일을 열면 도형이 선 · 면 · 사각형 · 원으로 나뉘어 보이고, 지역구로 쓸 도형(보통 "면")을 골라 이름을 붙인 뒤 지역구 지도 파일(.jsx)로 내보냅니다. 미리보기는 스크롤로 확대 · 축소, 휠 클릭 드래그로 이동해요.',
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'district'), showPanel('controls')],
                    target: '#districtSvgEditUI',
                    title: '지역구 지도 올리기',
                    text: '여론 › 지역구에서 맵 메이커로 만든 .jsx 파일을 올립니다. 올리면 도형 하나하나가 지역구가 되고, 하원 · 상원 · 삼원이 같은 지도를 함께 씁니다. (새 지도를 올리면 기존 지역구 정보는 새 지도로 바뀌어요)',
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'district'), showPanel('controls')],
                    target: '#districtListPanel',
                    title: '지역구 편집',
                    text: '지도나 목록에서 지역구를 누르면 편집 칸이 열립니다. 이름 · 약칭 · 인구, 그리고 원마다 몇 석을 뽑을지(0석이면 그 원엔 없는 지역구) 정해요. 지도는 휠 클릭 드래그로 이동, Shift+스크롤로 확대하고 ↺로 되돌립니다.',
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'tendency'), showPanel('controls')],
                    target: '#elecSubTendency',
                    title: '성향',
                    text: '여론 › 성향에서 지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 누가 이길지가 여기서 갈려요. 시각 화면에는 종합 지도와 정당별 지도가 함께 보입니다.',
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'region'), showPanel('controls')],
                    target: '#elecSubRegion',
                    title: '권역',
                    text: '권역형 비례대표를 쓸 때는 여론 › 권역에서 지역구를 권역으로 묶습니다. 권역을 고른 뒤 지도에서 지역구를 눌러(끌어서 여러 개) 칠해요. 권역 득표율은 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다.',
                },
                {
                    before: [go('nation', 'nationSettings'), showPanel('controls')],
                    target: '#contentNationSettings',
                    title: '지도 글씨 크기',
                    text: '국가 › 국가 설정에서 지도 위 약칭 글씨와 의석 배지의 크기를 한꺼번에 조절합니다.',
                },
            ],
        },
        {
            id: 'election-adv', group: 'detail',
            title: '선거 심화',
            summary: '선거 방식 · 비례 배분 · 선택 개표 · 보궐선거 · 대선 · 선거 기록',
            steps: [
                {
                    before: [closePanels, go('vote', 'elecGeneral'), showPanel('controls')],
                    target: byId('elecModeProportional', 'div'),
                    title: '총선 방식',
                    text: '선거 › 총선에서 뽑을 원과 방식을 고릅니다. 비례만 · 지역구만 · 둘 다(혼합)를 고를 수 있고, 지역구는 여론 › 성향, 비례는 여론 › 지지율을 바탕으로 정해져요.',
                },
                {
                    before: [go('vote', 'elecGeneral'), showPanel('controls')],
                    target: () => { const r = document.getElementById('elecCountModeRow'); return r && r.offsetParent ? r : '#elecRunBtn'; },
                    title: '자동 개표와 선택 개표',
                    text: '지역구 지도가 있는 선거는 개표 방식을 고릅니다(지도를 올리면 나타나요). 자동 개표는 지역구가 무작위 순서로 하나씩 열리고, 선택 개표는 결과 지도에서 지역구를 직접 눌러 하나씩 엽니다. 아래 막대로 개표 속도도 바꿀 수 있어요.',
                },
                {
                    before: [go('vote', 'elecGeneral'), showPanel('controls')],
                    target: byId('elecModeByElection', 'label'),
                    title: '보궐선거',
                    text: '"보궐"을 켜고 개표하면 궐석 처리된 지역구만 다시 뽑아 바로 반영합니다. 궐석은 의회 › 지역구 의원에서 처리해요.',
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'prob'), showPanel('controls')],
                    target: '#elecSystemSettings',
                    title: '비례 배분 방식',
                    text: '여론 › 지지율에서 원마다 비례대표를 어떻게 나눌지 정합니다. 전국 단위(전국형)로 나눌지, 권역마다 나눌지(권역형)를 고르고, 지지율마다 오차 범위를 줄 수 있어요.',
                },
                {
                    before: [go('vote', 'elecPresidential'), showPanel('controls')],
                    target: '#contentElecPresidential',
                    title: '대선',
                    text: '선거 › 대선에서 대통령(총리직선제면 총리) 선거를 개표합니다. 방식(단순 다수 · 결선투표 · 선거인단)과 후보는 선거 › 방식에서 정해요.',
                },
                {
                    before: [go('vote', 'elecRecord'), showPanel('controls')],
                    target: '#contentElecRecord',
                    title: '선거 기록',
                    text: '치른 선거는 선거 › 선거 기록에 남고, 누르면 그때의 결과 화면을 다시 볼 수 있어요.',
                },
            ],
        },
        {
            id: 'law-adv', group: 'detail',
            title: '입법 심화',
            summary: '가결 기준 · 태그 · 개정안 · 거부권 · 국무회의',
            steps: [
                {
                    before: [closePanels, go('law', 'bill'), showPanel('controls')],
                    target: byId('newBillThreshold', 'div'),
                    title: '가결 기준',
                    text: '법안마다 가결 기준을 정합니다. 과반 · 3/5 · 2/3 같은 정해진 기준이나 직접 분수를 넣을 수 있어요. 태그를 달아 두면 상정 · 기록에서 걸러 보기 쉽습니다.',
                },
                {
                    before: [go('law', 'archive'), showPanel('controls')],
                    target: '#contentArchive',
                    title: '개정안',
                    text: '가결된 법안의 "개정안 발의"를 누르면 그 법안을 바탕으로 개정안(제2판 · 제3판 …)을 새로 제출합니다. 기록에는 몇 판째인지 함께 남아요.',
                },
                {
                    before: [go('cabinet', 'system'), showPanel('controls')],
                    target: byId('vetoHolderPresidentBtn', 'div'),
                    title: '거부권',
                    text: '내각 › 내각 설정에서 법안 거부권을 누가 가질지(대통령 · 총리 · 내각 · 없음) 정합니다. 거부권이 있으면 입법 › 표결에서 통과된 법안을 거부할 수 있어요.',
                },
                {
                    before: [go('cabinet', 'council'), showPanel('controls')],
                    target: '#contentCouncil',
                    title: '국무회의',
                    text: '상정에서 "국무회의"로 올린 법안은 내각 › 국무회의에서 국무위원들이 표결합니다. 의결 정족수를 정할 수 있고, 계엄령으로 의회가 정지된 동안에는 여기서 법안을 통과시켜요. 결과는 내각 › 국무회의 기록에 남습니다.',
                },
            ],
        },
        {
            id: 'government', group: 'detail',
            title: '정부 형태와 권한',
            summary: '정부 형태 · 직책 이름 · 비상 권한 · 의회 해산 · 불신임',
            steps: [
                {
                    before: [closePanels, go('cabinet', 'system'), showPanel('controls')],
                    target: byId('govTypePresidentialBtn', 'div'),
                    title: '정부 형태',
                    text: '대통령제 · 이원집정부제 · 의원내각제 · 입헌군주제 · 집단지도체제 중에서 고릅니다. 형태에 따라 대통령 · 총리 · 의장 탭이 나타나거나 숨고, 직책 이름(대통령 → 국왕 등)도 바꿀 수 있어요.',
                },
                {
                    before: [go('cabinet', 'system'), showPanel('controls')],
                    target: '#dissolutionHolderGroup',
                    title: '비상 권한과 의회 해산',
                    text: '비상사태 · 의회 해산 · 계엄령 권한을 누가 가질지 정하고, 가진 사람의 탭에서 선포합니다. 해산은 의회 전체나 한 원만 할 수 있고, 해산된 원은 다음 총선을 의회에 반영할 때 풀려요. 계엄령으로 의회를 정지하면 법안은 국무회의에서만 통과됩니다.',
                },
                {
                    before: [go('cabinet', 'pm'), showPanel('controls')],
                    target: () => document.getElementById('noConfidenceSection') && document.getElementById('noConfidenceSection').offsetParent ? '#noConfidenceSection' : '#contentPm',
                    title: '총리와 불신임',
                    text: '내각 › 총리에서 총리 선출 방식(다수당 대표 자동 · 총리직선제)을 고르고, 지금 총리를 고정하거나 부총리를 둡니다. 내각 불신임안을 발의할 수 있고, 건설적 불신임제(독일 · 이스라엘식)를 켜면 불신임안에 후임 총리를 함께 지명해요.',
                },
                {
                    before: [go('cabinet', 'president'), showPanel('controls')],
                    target: '#contentPresident',
                    title: '대통령',
                    text: '내각 › 대통령에서 이름 · 사진 · 소속 정당을 정합니다. 반원의 의원에서 불러오면 그 의원 정보와 연결돼 함께 바뀌어요.',
                },
            ],
        },
        {
            id: 'date', group: 'detail',
            title: '날짜와 회기',
            summary: '날짜 넘기기 · 다음 회기 · 설정 창 · 자동 진행',
            steps: [
                {
                    before: [closePanels, call('switchDispTab', 'house'), showPanel('display')],
                    target: '#dispInfoBar',
                    title: '날짜 넘기기',
                    text: '날짜 줄의 ▶는 하루, ▶▶는 일주일, ▶▶▶는 한 달을 넘깁니다. 월말 · 윤년도 달력대로 계산해요. 지금 한 번 눌러보세요.',
                    enter: () => { T.dateBase = (document.getElementById('dispInfoDate') || {}).textContent; },
                    allow: ['#dispInfoBar'],
                    task: () => { const el = document.getElementById('dispInfoDate'); return !el || el.textContent !== T.dateBase; },
                    done: '날짜가 넘어갔어요.',
                },
                {
                    before: [closePanels, showPanel('display')],
                    target: () => document.getElementById('dispNextSessionTypeBtn') ? '#dispNextSessionTypeBtn' : '#dispInfoBar',
                    title: '다음 회기',
                    text: '"다음: 정기회 / 다음: 임시회" 버튼으로 다음 회기를 어떤 종류로 열지 고르고(지금 회기는 그대로), "다음 회기"를 누르면 회기 번호가 1 올라가면서 고른 종류가 적용됩니다.',
                },
                {
                    before: [showPanel('display'), call('openDatePanel')],
                    target: '#datePanel',
                    title: '날짜 · 회기 설정 창',
                    text: '⚙를 누르면 이 창이 뜹니다. 날짜는 연 · 월 · 일로 정하고, 앞에 연호(예: 레이와 → "레이와 1년 4월 20일")를 붙일 수 있어요 — 비워 두면 연도만 보입니다. 회기는 대수 · 이름 · 회기 번호와 지금 회기 종류를 정합니다.',
                },
                {
                    before: [showPanel('display'), call('openDatePanel')],
                    target: () => { const el = document.getElementById('nationAutoRegularSession'); return el ? el.closest('div[style*="margin-top"]') || el : '#datePanel'; },
                    title: '자동 진행',
                    text: '"자동 진행"을 켜면 날짜를 넘기다 정기회 시작일(기본 9월 1일)을 지날 때 다음 회기가 정기회로 열리고, 하원 총선 결과를 의회에 반영하면 대수가 1 올라갑니다. 둘 다 켜고 끌 수 있어요.',
                    leave: closePanels,
                },
            ],
        },
        {
            id: 'fraud', group: 'detail',
            title: '부정선거',
            summary: '부정선거 시도와 발각',
            steps: [
                {
                    before: [closePanels, go('vote', 'fraud'), showPanel('controls')],
                    target: '#contentFraud',
                    title: '부정선거 (⚠)',
                    text: '선거 › ⚠에서 정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 성공하면 표가 그 정당 쪽으로 옮겨지지만, 발각되면 그 정당은 활동 금지 처분을 받아요.',
                },
            ],
        },
        {
            id: 'view', group: 'detail',
            title: '화면 다루기와 내보내기',
            summary: '시각 탭 · 이미지 내보내기 · 사이드바 · 폭 조절 · 단축키',
            steps: [
                {
                    before: [closePanels, call('switchDispTab', 'house'), showPanel('display')],
                    target: '.disp-tab-bar',
                    title: '시각 탭',
                    text: '시각 화면 위의 탭으로 하원 · 상원 · 내각을 오가고, 여론의 지역구 · 성향 · 권역을 열거나 총선을 개표하면 그 지도와 선거결과 탭이 생깁니다(× 로 닫기). 원 화면 오른쪽 위의 "반원 / 지역구"로 지역구 지도 보기로 바꿀 수 있어요.',
                },
                {
                    before: [call('switchDispTab', 'house'), showPanel('display')],
                    target: '#houseCanvas',
                    title: '이미지로 내보내기',
                    text: '반원 · 지도 · 선거 결과 · 내각 화면에서 오른쪽 클릭(모바일은 길게 누르기) → "내보내기..."를 고르면 PNG · JPG · SVG 이미지로 저장합니다. 정당 통계와 국기 · 국가명 · 날짜 머리를 함께 넣을 수 있어요.',
                },
                {
                    before: [showPanel('controls')],
                    target: () => isMobileLayout() ? navTarget() : (document.getElementById('mnCollapseBtn') ? '#mnCollapseBtn' : navTarget()),
                    title: '사이드바와 폭 조절',
                    text: () => isMobileLayout()
                        ? '모바일에서는 아래 탭 바로 묶음을 고르고, 위쪽 칩 줄에서 세부 항목을 고릅니다. 떠 있는 실행 버튼으로 다시 계산해요.'
                        : '사이드바 머리의 접기 버튼으로 아이콘만 남겨 편집 화면을 넓게 쓸 수 있어요. 편집 패널과 시각 화면 사이 경계를 끌면 폭을 바꾸고, 더블클릭하면 원래 폭으로 돌아갑니다.',
                },
                {
                    before: [showPanel('controls')],
                    title: '단축키',
                    text: 'Enter(입력 칸 밖) — 다시 계산 · Ctrl+S — 바로 저장 · Ctrl+Z — 되돌리기 · Ctrl+Shift+Z — 다시 실행 · Esc — 열린 창 닫기. 튜토리얼에서는 ← · → 로 단계를 오가고 Esc로 그만둡니다.',
                },
            ],
        },
    ];
    const basicCount = LESSONS.filter(l => l.group === 'basic').length;

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
                    <button type="button" class="tut-toc">목차</button>
                    <button type="button" class="tut-skip">그만하기</button>
                    <span class="tut-spacer"></span>
                    <button type="button" class="tut-prev">이전</button>
                    <button type="button" class="tut-next">다음</button>
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
            if (lessonIdx < LESSONS.length - 1) startLesson(lessonIdx + 1); else stop();
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
        if (target instanceof Element && target.closest('.dno-dialog-overlay, #customAlertOverlay, #customConfirmOverlay')) return true;
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
        const step = curStep();
        if (step && step.noDim && isMobileLayout()) {
            // 모바일에서 지켜보는 단계: 말풍선을 작게 줄여 아래 탭 바 바로 위에 붙인다 (보여줄 화면을 가리지 않게)
            const nav = document.getElementById('mobileNav');
            const floor = nav && getComputedStyle(nav).display !== 'none' ? nav.getBoundingClientRect().top : vh; // fixed 요소라 offsetParent로는 판별 불가
            left = (vw - bw) / 2;
            top = floor - bh - 8;
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
        q('.tut-task-text').textContent = taskDone ? stepText(step, 'done') : '직접 해보세요 — 해내면 "다음"이 열립니다';
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
        q('.tut-lesson').textContent = mode === 'menu' ? '튜토리얼 목차' : `#${lessonIdx + 1} · ${lesson.title}`;
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
        layer.classList.toggle('tut-compact', !!step.noDim && isMobileLayout());
        renderHead(`${i + 1} / ${steps.length}${step.task ? ' · 실습' : ''}`);
        setBody({ title: step.title, text: stepText(step, 'text') });
        const prevBtn = q('.tut-prev');
        prevBtn.style.display = '';
        prevBtn.disabled = i === 0;
        q('.tut-toc').style.display = '';
        q('.tut-skip').textContent = '그만하기';
        q('.tut-next').style.display = '';
        q('.tut-next').textContent = i === steps.length - 1 ? `#${lessonIdx + 1} 마치기` : '다음';
        renderTaskState();
        // 탭 전환 직후 레이아웃(목록·캔버스 다시 그리기 등)이 끝난 뒤 대상으로 스크롤하고 위치를 잡는다
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const el = resolveTarget(step);
            if (el && el.scrollIntoView) el.scrollIntoView({ block: step.task ? 'center' : 'nearest' });
            place();
        }));
    }

    function startLesson(li) {
        lessonIdx = Math.max(0, Math.min(LESSONS.length - 1, li));
        showStep(0);
    }

    function showComplete() {
        leaveCurrent();
        layer.classList.remove('tut-nodim', 'tut-compact');
        markDone(lessonIdx);
        setMode('complete');
        layer.classList.remove('tut-is-task');
        taskDone = false;
        const last = lessonIdx >= LESSONS.length - 1;
        const basicDone = LESSONS[lessonIdx].group === 'basic' && lessonIdx === basicCount - 1;
        renderHead('완료');
        const nextLesson = LESSONS[lessonIdx + 1];
        setBody({
            title: `#${lessonIdx + 1} ${LESSONS[lessonIdx].title} 완료!`,
            text: last
                ? '세부 튜토리얼까지 모두 마쳤습니다. 이제 이 나라를 마음대로 바꿔보거나, 시작 화면에서 새 세이브를 만들어 나만의 나라를 꾸려보세요. 궁금한 기능은 메뉴 맨 아래 "도움말"에서 찾을 수 있어요.'
                : basicDone
                    ? `기본 튜토리얼(#1 ~ #${basicCount})을 모두 마쳤습니다! 이제 기본 흐름은 다 알아요. 이어서 세부 튜토리얼 #${lessonIdx + 2} "${nextLesson.title}"부터 해보거나, 목차에서 필요한 기능만 골라 배우세요.`
                    : `다음은 #${lessonIdx + 2} "${nextLesson.title}" (${nextLesson.summary})입니다. 바로 이어서 하거나, 나중에 목차에서 골라 할 수 있어요.`,
        });
        q('.tut-prev').style.display = 'none';
        q('.tut-toc').style.display = '';
        q('.tut-next').style.display = '';
        q('.tut-next').textContent = last ? '끝내기' : `#${lessonIdx + 2} 시작 →`;
        q('.tut-skip').textContent = last ? '닫기' : '나중에';
        renderTaskState();
        requestAnimationFrame(place);
    }

    function showMenu() {
        leaveCurrent();
        layer.classList.remove('tut-nodim', 'tut-compact');
        setMode('menu');
        layer.classList.remove('tut-is-task');
        taskDone = false;
        const done = doneSet();
        const firstTodo = LESSONS.findIndex((_, i) => !done.has(i));
        renderHead(`${done.size} / ${LESSONS.length} 완료`);
        setBody({ title: '무엇을 배워볼까요?', text: '처음이라면 기본 튜토리얼을 순서대로, 그다음 필요한 세부 튜토리얼만 골라 하세요. 하나하나 몇 단계로 짧게 끝납니다.', menu: true });
        const menuEl = q('.tut-menu');
        const GROUPS = [
            ['basic', '기본 튜토리얼', '처음 쓰는 분을 위한 핵심 흐름 — 순서대로 추천'],
            ['detail', '세부 튜토리얼', '기능별 자세한 설명 — 필요한 것만 골라서'],
        ];
        menuEl.innerHTML = GROUPS.map(([g, name, sub]) => `
            <div class="tut-group-head"><span class="tut-group-name">${name}</span><span class="tut-group-sub">${sub}</span></div>`
            + LESSONS.map((l, i) => l.group !== g ? '' : `
            <button type="button" class="tut-lesson-btn${done.has(i) ? ' done' : ''}${i === firstTodo ? ' next' : ''}" data-lesson="${i}">
                <span class="tut-lesson-no">#${i + 1}</span>
                <span class="tut-lesson-main"><span class="tut-lesson-title"></span><span class="tut-lesson-sum"></span></span>
                <span class="tut-lesson-mark">${done.has(i) ? '✓' : '›'}</span>
            </button>`).join('')).join('');
        menuEl.querySelectorAll('.tut-lesson-btn').forEach(btn => {
            const l = LESSONS[+btn.dataset.lesson];
            btn.querySelector('.tut-lesson-title').textContent = l.title;
            btn.querySelector('.tut-lesson-sum').textContent = `${l.summary} · ${l.steps.length}단계`;
            btn.addEventListener('click', () => startLesson(+btn.dataset.lesson));
        });
        q('.tut-prev').style.display = 'none';
        q('.tut-toc').style.display = 'none';
        q('.tut-next').style.display = 'none';
        q('.tut-skip').textContent = '닫기';
        renderTaskState();
        requestAnimationFrame(place);
    }

    const isEditable = el => el instanceof Element && (el.matches('input, textarea, select') || el.isContentEditable);
    function onKey(e) {
        if (!active) return;
        if (isEditable(e.target)) return; // 입력 칸에서의 Enter/화살표/Esc는 그대로 입력 칸 몫
        if (document.querySelector('.dno-dialog-overlay')) return; // 앱의 알림 · 확인창이 떠 있으면 그 창이 키를 처리
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
        q('.tut-skip').textContent = '그만하기';
        window.addEventListener('resize', schedulePlace);
        window.addEventListener('scroll', schedulePlace, true);
        window.addEventListener('keydown', onKey, true);
        GUARDED.forEach(t => window.addEventListener(t, guard, true));
        tickId = setInterval(tick, 250);
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

    window.DnoTutorial = {
        start, stop, next, showMenu,
        // goto(과정, 단계) — 튜토리얼이 켜져 있을 때 특정 단계로 바로 이동 (0부터)
        goto: (li, si = 0) => { if (!active || !LESSONS[li]) return; lessonIdx = li; showStep(Math.max(0, Math.min(si, LESSONS[li].steps.length - 1))); },
        lessonGroups: () => LESSONS.map(l => ({ id: l.id, group: l.group, title: l.title, steps: l.steps.length, targets: l.steps.map(st => !!st.target) })),
        isActive: () => active,
        lessons: LESSONS.map(l => ({ title: l.title, steps: l.steps.length })),
        state: () => ({ mode, lesson: lessonIdx, step: stepIdx, taskDone }),
    };
})();
