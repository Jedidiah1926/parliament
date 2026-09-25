// ===== DATANET PARLIAMENT SIMULATION — 튜토리얼(조작법 안내) =====
// "튜토리얼 공화국" 프리셋으로 시작하면 자동으로 켜지는 단계별 안내. 짧은 과정(#1 · #2 · #3 …)으로 나뉘어 있고,
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

    const DONE_KEY = 'dnoTutorialDone';
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
    function resetProgress() { T.basePartyIds = null; T.newPartyId = null; T.billBase = null; T.execClicked = false; T.probBase = null; T.cabinetBase = null; T.totalBase = null; }
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

    const LESSONS = [
        {
            title: '화면 둘러보기',
            summary: '메뉴 이동 · 의석 화면 · 세이브',
            steps: [
                {
                    title: '튜토리얼 공화국에 오신 것을 환영합니다',
                    text: '가상의 나라 "튜토리얼 공화국"에서 기본 조작을 직접 해보며 배웁니다. 튜토리얼은 #1 ~ #5로 짧게 나뉘어 있고, 밝게 표시된 곳을 실제로 조작해야 다음 단계로 넘어가요. 이 나라는 복사본(새 세이브)이라 마음껏 바꿔도 괜찮습니다.',
                },
                {
                    // 일부러 다른 화면(국가 › 설정)을 띄워 두고 메뉴로 돌아오게 한다
                    before: [go('nation', 'config'), showPanel('controls')],
                    target: navTarget,
                    allow: () => isMobileLayout() ? ['#mobileNav', '.main-tab-content > .sub-tab-container'] : [navTarget()],
                    title: '메뉴 이동하기',
                    text: () => isMobileLayout()
                        ? '기능은 의회 · 국가 · 여론 · 내각 네 묶음으로 나뉘어 있고, 회색 "도움말"에는 모든 탭의 설명이 있어요. 화면 아래 탭 바에서 "의회"를 누르고, 위쪽 칩 줄에서 "정당"을 골라보세요.'
                        : '기능은 의회 · 국가 · 여론 · 내각 네 묶음으로 나뉘어 있고, 맨 아래 회색 "도움말"에는 모든 탭의 설명이 있어요. 왼쪽 메뉴에서 의회 › 정당을 눌러보세요.',
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
                    before: [call('closeSeatInfoCard'), showPanel('controls')],
                    target: '#saveTabBar',
                    title: '세이브',
                    text: '맨 위의 탭 하나하나가 세이브입니다. +로 새 세이브(또는 프리셋 복사본)를 만들고, 탭 이름을 더블클릭하면 이름을 바꿀 수 있어요. 진행 상황은 자동으로 저장됩니다.',
                },
            ],
        },
        {
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
                    text: () => `의회 › 구성의 "배정 합계"는 정당 의석을 모두 더한 값이고, 총 의석 수를 넘을 수 없습니다. 기존 정당들이 이미 ${T.totalBase}석을 다 차지하고 있으면 새 정당이 앉을 자리가 없어요. 총 의석 수를 늘리거나(예: ${T.totalBase + 20}) 다른 정당 의석을 줄여 빈자리를 만들어 보세요.`,
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
            title: '입법',
            summary: '법안 제출 · 상정과 표결',
            steps: [
                {
                    before: [go('nation', 'legislation'), call('switchLegislationInnerTab', 'bill'), showPanel('controls')],
                    enter: () => { if (T.billBase == null) T.billBase = billList().length; },
                    target: () => billForm(),
                    allow: () => { const f = billForm(); return f ? [f] : []; },
                    title: '법안 제출하기',
                    text: '국가 › 입법에서는 법안을 작성해 의회에 올리고 표결합니다. 법안 제목을 적고 "[+] 법안 등록"을 눌러보세요.',
                    task: () => billList().length > (T.billBase || 0),
                    done: '법안이 등록됐어요!',
                },
                {
                    before: [go('nation', 'legislation'), call('switchLegislationInnerTab', 'table'), showPanel('controls')],
                    target: '#innerTabLegTable',
                    title: '상정과 표결',
                    text: '등록한 법안은 상정 탭에서 의회(또는 국무회의)에 올리고, 표결 탭에서 정당별 · 의원별로 찬반 표를 던집니다. 가결 · 부결된 법안은 기록 탭에 남아요.',
                },
            ],
        },
        {
            title: '여론과 선거',
            summary: '지지율 입력 · 개표',
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
                    before: [go('nation', 'election'), call('switchElectionInnerTab', 'general'), showPanel('controls')],
                    target: '#elecRunBtn',
                    allow: ['#elecRunBtn', '#contentElection'],
                    title: '선거 치르기',
                    text: '국가 › 선거 › 총선에서 "개표 시작"을 누르면 지지율에 따라 개표가 진행됩니다. 지금 눌러보세요.',
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
                        + '결과대로 의석이 바뀌고, 결과는 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있어요. 개표 속도는 선거 설정에서 조절합니다.',
                },
            ],
        },
        {
            title: '내각',
            summary: '총리와 당수 · 국무위원 · 내각 화면',
            steps: [
                {
                    before: [go('cabinet', 'pm'), showPanel('controls')],
                    target: () => pmBlock(),
                    title: '총리는 누가 될까?',
                    text: '내각 › 설정에서 대통령제 · 이원집정부제 · 의원내각제 등 정부 형태를 고릅니다. 튜토리얼 공화국은 의원내각제라, 의석이 가장 많은 정당의 대표(당수)가 자동으로 총리가 돼요 (👑 표시).',
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
                    text: '내각 › 내각에서 장관 같은 국무위원을 추가합니다. "[+] 국무위원 추가"를 눌러보세요.',
                    task: () => cabinetList().length > (T.cabinetBase || 0),
                    done: '국무위원 자리가 생겼어요. 이름 · 직책 · 소속 정당을 채울 수 있어요.',
                },
                {
                    before: [call('switchDispTab', 'cabinet'), showPanel('display')],
                    target: '#dispPanelCabinet',
                    title: '내각 화면',
                    text: '의석 화면의 "내각" 탭에서 총리와 국무위원이 한눈에 보입니다. 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있어요.',
                },
                {
                    before: [go('setup', 'party'), call('switchDispTab', 'house'), showPanel('controls')],
                    title: '테마와 언어',
                    text: '메인 메뉴 › 설정에서 라이트 · 다크 · 네온 테마와 언어를 바꿀 수 있습니다. 이 튜토리얼은 시작 화면의 프리셋 목록에서 언제든 다시 할 수 있어요.',
                },
            ],
        },
    ];

    // ---- 마친 과정 기록 ----
    function doneSet() {
        try { return new Set(JSON.parse(localStorage.getItem(DONE_KEY) || '[]')); } catch (e) { return new Set(); }
    }
    function markDone(li) {
        const set = doneSet(); set.add(li);
        try { localStorage.setItem(DONE_KEY, JSON.stringify([...set])); } catch (e) { /* 저장 못 해도 진행엔 지장 없음 */ }
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
        if (target instanceof Element && target.closest('#customAlertOverlay, #customConfirmOverlay')) return true;
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
        renderHead('완료');
        const nextLesson = LESSONS[lessonIdx + 1];
        setBody({
            title: `#${lessonIdx + 1} ${LESSONS[lessonIdx].title} 완료!`,
            text: last
                ? '#1 ~ #5를 모두 마쳤습니다. 이제 이 나라를 마음대로 바꿔보거나, 시작 화면에서 새 세이브를 만들어 나만의 나라를 꾸려보세요.'
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
        setBody({ title: '무엇을 배워볼까요?', text: '하나하나 몇 단계로 짧게 끝납니다. 순서대로 하지 않고 골라서 해도 괜찮아요.', menu: true });
        const menuEl = q('.tut-menu');
        menuEl.innerHTML = LESSONS.map((l, i) => `
            <button type="button" class="tut-lesson-btn${done.has(i) ? ' done' : ''}${i === firstTodo ? ' next' : ''}" data-lesson="${i}">
                <span class="tut-lesson-no">#${i + 1}</span>
                <span class="tut-lesson-main"><span class="tut-lesson-title"></span><span class="tut-lesson-sum"></span></span>
                <span class="tut-lesson-mark">${done.has(i) ? '✓' : '›'}</span>
            </button>`).join('');
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
        isActive: () => active,
        lessons: LESSONS.map(l => ({ title: l.title, steps: l.steps.length })),
        state: () => ({ mode, lesson: lessonIdx, step: stepIdx, taskDone }),
    };
})();
