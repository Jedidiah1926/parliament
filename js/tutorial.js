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
    // ---- 잠긴 과정 (다음 업데이트 미리보기 기능) ----
    // locked: '1.6.x' — 개발자 모드(설정 › 기타 설정)를 켜야 열리고, 그 기능이 있는 Teaser 화면에서 진행한다
    // (1.6.x → Teaser 1.6.x — 각 Teaser 화면은 1.6.1부터 그 버전까지의 기능을 담는다).
    // 그 화면이 아니면 해당 teaser 화면으로 옮겨 서독 튜토리얼로 시작한 뒤 그 과정을 바로 연다.
    /* global emergencyPowers, presElectionMode */
    const devOn = () => !!(window.HemiDev && window.HemiDev.isOn());
    const DEMO_BUILD = () => !!(window.HEMI_BUILD && window.HEMI_BUILD.demo); // Steam 데모 빌드 (맵 메이커 대신 맵 프리셋)
    // 미리보기 화면마다 담긴 기능 버전 (teaser6N은 1.6.1 ~ 1.6.N)
    const PAGE_HAS = { '62': ['1.6.1', '1.6.2'], '63': ['1.6.1', '1.6.2', '1.6.3'], '64': ['1.6.1', '1.6.2', '1.6.3', '1.6.4'], '65': ['1.6.1', '1.6.2', '1.6.3', '1.6.4', '1.6.5'], '66': ['1.6.1', '1.6.2', '1.6.3', '1.6.4', '1.6.5', '1.6.6'], '67': ['1.6.1', '1.6.2', '1.6.3', '1.6.4', '1.6.5', '1.6.6', '1.6.7'], '68': ['1.6.1', '1.6.2', '1.6.3', '1.6.4', '1.6.5', '1.6.6', '1.6.7', '1.6.8'], '69': ['1.6.1', '1.6.2', '1.6.3', '1.6.4', '1.6.5', '1.6.6', '1.6.7', '1.6.8', '1.6.9'] };
    const PREVIEW_PAGES = Object.keys(PAGE_HAS);
    const previewPageFor = l => (l && /^1\.6\.[1-9]$/.test(l.locked) ? '6' + l.locked.slice(-1) : '69'); // 그 기능이 처음 들어간 버전의 Teaser 화면
    const curPage = () => document.documentElement.getAttribute('data-teaser');
    // 지금 화면이 미리보기 화면인지 — 과정을 주면 그 과정의 기능이 있는 화면인지
    const onPreviewPage = l => PREVIEW_PAGES.includes(curPage()) && (!l || !l.locked || (PAGE_HAS[curPage()] || []).includes(l.locked));
    const previewName = l => `Teaser 1.6.${previewPageFor(l).slice(-1)}`;
    const unrecLeft = () => { try { return typeof window.isDistrictUnrecovered === 'function' && Object.keys(districtGrid.house || {}).some(k => window.isDistrictUnrecovered(k)); } catch (e) { return false; } };
    const t64 = () => window.T65 || null;
    const t68 = () => window.T68 || null;
    const t69 = () => window.T69 || null;
    const citCount = () => { const c = window.T61 && window.T61.citizens; return c ? Object.values(c).reduce((n, o) => n + Object.keys(o || {}).length, 0) : 0; };
    const migSig = () => (window.T61 ? JSON.stringify(window.T61.migrantVote) : '');
    const firstCitCard = () => { const c = document.querySelector('#districtListPanel .t61-cit'); return c ? (c.closest('.drag-card-district') || c) : null; };
    const ecoTurn = () => { const t = t69(); return t ? t.state.turn : 0; };
    const showEco = view => () => { const t = t69(); if (t) { t.ensureInit(); t.showDisp(view); } };
    const firstVassalCard = () => document.querySelector('#contentVassals .t68-card');
    const rankSig = () => { const t = t64(); return t && t.ranking ? t.ranking.rows.map(r => `${r.id}:${r.score}`).join(',') : ''; };
    const logLen = k => { const o = window[k]; return o && Array.isArray(o.log) ? o.log.length : 0; };
    const byId = (id, up) => () => { const el = document.getElementById(id); return el ? ((up && el.closest(up)) || el) : null; };
    const helpTarget = () => isMobileLayout() ? navTarget() : (document.querySelector('#sideNav .mn-group[data-tone="muted"]') ? '#sideNav .mn-group[data-tone="muted"]' : navTarget());

    // ---- 후보 단일화 · 부정선거 과정용 도우미 ----
    /* global candidateUnions */
    const unionList = () => (typeof candidateUnions !== 'undefined' && Array.isArray(candidateUnions)) ? candidateUnions : [];
    const unionSection = () => { const el = document.getElementById('candidateUnionList'); return el ? el.parentElement : '#contentElecSettings'; };
    const lastUnionCard = () => { const cards = document.querySelectorAll('#candidateUnionList .cand-union'); return cards.length ? cards[cards.length - 1] : null; };
    const fraudCheckbox = () => document.querySelector('#fraudPartyList input[onchange^="toggleFraudAttempt"]');
    const fraudBlock = () => { const on = document.querySelector('#fraudPartyList input[onchange^="toggleFraudAttempt"]:checked'); return on ? on.closest('div[style*="border:1px solid"]') || on.closest('label') : null; };

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
                    title: '서독에 오신 것을 환영합니다',
                    text: '1983년 3월, 총선을 막 치른 서독(독일연방공화국)에서 직접 조작해 보며 배웁니다. 연방의회에는 기민·기사연합 · 사회민주당 · 자유민주당 · 녹색당이 있고, 기민·기사연합과 자유민주당이 연정을 꾸려 집권하고 있어요. 튜토리얼은 두 가지예요 — 기본 튜토리얼(#1 ~ #6)은 처음 쓰는 분을 위한 핵심 흐름이고, 세부 튜토리얼은 이념 · 파벌 · 지도 · 선거 방식 · 정부 권한 같은 기능을 필요한 것만 골라 배웁니다. 밝게 표시된 곳을 실제로 조작해야 넘어가는 단계도 있어요. 이 나라는 복사본(새 세이브)이라 마음껏 바꿔도 괜찮습니다.',
                },
                {
                    // 일부러 다른 화면(국가 › 상징)을 띄워 두고 메뉴로 돌아오게 한다
                    before: [closePanels, go('nation', 'symbol'), showPanel('controls')],
                    target: navTarget,
                    allow: () => isMobileLayout() ? ['#mobileNav', '.main-tab-content > .sub-tab-container'] : [navTarget()],
                    title: '메뉴 이동하기',
                    text: () => isMobileLayout()
                        ? '기능은 의회 · 입법 · 여론 · 선거 · 내각 · 국가 여섯 묶음으로 나뉘어 있고, 회색 "도움말"에는 모든 탭의 설명이 있어요. 화면 아래 탭 바에서 "의회"를 누르고, 위쪽 칩 줄에서 "정당"을 골라보세요.'
                        : '기능은 의회 · 입법 · 여론 · 선거 · 내각 · 국가 여섯 묶음으로 나뉘어 있고, 맨 아래 회색 "도움말"에는 모든 탭의 설명이 있어요. 왼쪽 메뉴에서 의회 › 정당을 눌러보세요.',
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
                    text: '맨 위의 탭 하나하나가 세이브(나라 하나)입니다. 누르면 그 나라로 바로 바뀌고, 진행 상황은 그 세이브에 그대로 자동저장돼요. 이름 옆에 ●가 보이면 아직 저장하지 않은 변경사항이 있다는 뜻이에요. +는 새 탭(새로 만들기 · 프리셋 · 닫은 탭 다시 열기), 탭 이름을 더블클릭하면 이름 바꾸기, ×는 탭만 닫기(세이브는 남아요)입니다. 맨 왼쪽 ⌂는 저장하고 메인 화면으로 돌아갑니다.',
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
            summary: '법안 제출 · 위원회 · 상정 · 표결 · 표결 기록 · 법령',
            steps: [
                {
                    before: [go('law', 'bill'), showPanel('controls')],
                    enter: () => { if (T.billBase == null) T.billBase = billList().length; },
                    target: () => billForm(),
                    allow: () => { const f = billForm(); return f ? [f] : []; },
                    title: '법안 제출하기',
                    text: '입법 › 제출에서 법안을 작성합니다. 법안 제목을 적고 "[+] 법안 등록"을 눌러보세요. (조문 · 태그 · 가결 기준은 비워 둬도 돼요 — 조문은 제1조 · 제2조처럼 조 단위로 씁니다)',
                    task: () => billList().length > (T.billBase || 0),
                    done: '법안이 등록됐어요!',
                },
                {
                    before: [go('law', 'committee'), showPanel('controls')],
                    target: '#contentCommittee',
                    title: '상임위원회',
                    text: '입법 › 위원회에서 상임위원회를 만들면, 법안이 본회의 전에 소관 위원회 심사를 먼저 거칩니다. 위원은 정당 의석 비율대로 배정되고, 위원 과반이 찬성해야 본회의로 넘어가요. 위원회가 없으면 법안은 바로 본회의로 갑니다.',
                },
                {
                    before: [go('law', 'table'), showPanel('controls')],
                    target: '#billList',
                    title: '상정하기',
                    text: '입법 › 상정에는 등록된 법안이 모입니다. 법안마다 의회에 올릴지 국무회의에 올릴지, 소관 위원회를 어디로 할지 고르고, "심의 선택"을 누르면 표결로 넘어가요. 검색과 태그로 찾을 수 있습니다.',
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
                {
                    before: [go('law', 'lawbook'), showPanel('controls')],
                    target: '#contentLawbook',
                    title: '법령',
                    text: '입법 › 법령에는 헌법과 가결된 법률이 조문 그대로 모입니다. 헌법을 제정하고, 헌법 개정안(가결 기준 2/3)을 통과시키면 헌법이 바뀌고 개정 이력이 남아요.',
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
                    text: '내각 › 내각 설정에서 대통령제 · 이원집정부제 · 의원내각제 등 정부 형태를 고릅니다. 서독은 의원내각제라, 의석이 가장 많은 정당의 대표(당수)가 자동으로 총리가 돼요 (👑 표시). 서독에서는 이 자리를 "연방총리"라고 불러요 — 직책 이름은 나라마다 정할 수 있습니다.',
                },
                {
                    before: [go('setup', 'party'), call('switchPartyGroupInnerTab', 'leader'), showPanel('controls')],
                    target: () => leaderInput(),
                    allow: () => { const el = leaderInput(); return el ? [el.closest('.card-item')] : []; },
                    title: '다수당 대표 정하기',
                    text: () => `의회 › 정당 › 당수에서 정당 대표를 정합니다. 다수당${majorityParty() ? ` "${majorityParty().name}"` : ''}의 당수 이름을 적어보세요. (1983년의 연방총리는 헬무트 콜이었어요)`,
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
                    text: '맨 위는 지금 세이브와 "지금 저장"(Ctrl+S와 같음), 그 아래는 자동저장과 저장 주기입니다. 세이브 목록에서 ★로 즐겨찾기 · 이름 바꾸기 · 삭제를 하고, "다른 이름으로 저장"으로 지금 상태를 새 세이브로 복사해요. 파일(.hemi)로 저장해 두면 다른 기기에서도 불러올 수 있습니다.',
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
                    text: '⌂를 누르면 저장한 뒤 메인 화면으로 갑니다. 메인 화면에서는 시작하기(세이브 고르기 · 프리셋 · 파일 불러오기), 맵 메이커, 로드맵, 설정(라이트 · 다크 · 네온 테마, 데스크톱 · 모바일 화면 모드)을 고르고, 🌐로 언어를 바꿉니다. 이 튜토리얼은 시작하기 › 프리셋의 "서독"으로 언제든 다시 할 수 있어요.',
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
                    text: '정당 안에 파벌(계파)을 만들 수 있어요. 파벌마다 이름 · 색 · 의석을 정하면 반원에서 한 정당 안의 파벌이 색으로 나뉘어 보이고, 표결 때 파벌별로 표를 던질 수 있습니다. 총선 결과를 반영할 때 파벌을 나눠서(선거 전 몫대로 · 지역 기반 파벌은 그 지역구 득표만큼) 반영할지, 정당 몫으로 합쳐서 반영할지도 고릅니다.',
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
            id: 'history', group: 'detail', locked: '1.6.5',
            title: '세력 변화',
            summary: '의석 기록 · 의석 변화 도표 · 당 변화 · 정당 승계',
            steps: [
                {
                    before: [closePanels, go('setup', 'timeline'), showPanel('controls')],
                    enter: () => { T.histBase = t64() ? t64().timeline.length : 0; },
                    target: () => document.querySelector('#contentTimeline .t65-actions') || '#contentTimeline',
                    allow: ['#contentTimeline'],
                    title: '의석 기록하기',
                    text: '의회 › 세력 변화는 시점마다 정당 의석을 기록해 두는 곳이에요. 총선 결과를 의회에 반영하면 저절로 기록되고, "📸 지금 의석 기록하기"로 언제든 남길 수 있어요. 지금 눌러보세요.',
                    task: () => !t64() || t64().timeline.length > (T.histBase || 0),
                    done: '지금 의석이 기록됐어요.',
                },
                {
                    before: [go('setup', 'timeline'), () => { const b = document.querySelector('#dispPanelTimeline [data-hview="seats"]'); if (b) b.click(); }, showPanel('display')],
                    target: () => document.querySelector('#dispPanelTimeline .chamber-box') || '#dispPanelTimeline',
                    title: '의석 변화',
                    text: '오른쪽 시각 화면 "세력 변화" 탭에 기록이 아래로 쌓여요. "의석 변화"는 기록마다 정당 의석을 막대로 그리고(점유율 · 의석 수), ▲▼로 앞 기록과 비교해요. 집권 세력은 ★, 가운데 점선은 과반이에요.',
                },
                {
                    before: [go('setup', 'timeline'), () => { const b = document.querySelector('#dispPanelTimeline [data-hview="lineage"]'); if (b) b.click(); }, showPanel('display')],
                    target: () => document.querySelector('#dispPanelTimeline .chamber-box') || '#dispPanelTimeline',
                    title: '당 변화',
                    text: '"당 변화"로 바꾸면 정당이 언제 생기고, 이름을 바꾸고, 사라졌는지 세로 선으로 이어 보여요. 다른 정당을 이어받은 정당은 곡선으로 합쳐지고, 없어진 정당은 ✕로 끝나요.',
                },
                {
                    before: [go('setup', 'timeline'), () => { const d = document.querySelector('#contentTimeline [data-fold="openSucc"]'); if (d) d.open = true; }, showPanel('controls')],
                    target: () => document.querySelector('#contentTimeline [data-fold="openSucc"]') || '#contentTimeline',
                    title: '정당 승계',
                    text: '🔁 정당 승계에서 당명 · 색을 바꾸면(예: 한나라당 → 새누리당) 같은 정당이 이어진 것으로 기록돼요. 서로 다른 두 정당은 "승계 관계 잇기"로 이어 합당 · 후신 관계를 그리고, 이은 관계는 다음 기록부터 도표에 합쳐져요.',
                },
                {
                    before: [go('setup', 'timeline'), () => { const b = document.querySelector('#dispPanelTimeline [data-hview="seats"]'); if (b) b.click(); }, showPanel('controls')],
                    target: () => document.querySelector('#contentTimeline .t65-table') || '#contentTimeline',
                    title: '기록 표',
                    text: '표에서는 기록끼리 정당 의석을 나란히 비교해요. 아래 "기록 N개"에서 기록 이름을 바꾸거나 지우고, 선거 › 선거 기록이 있으면 "선거 기록에서 가져오기"로 한꺼번에 들여옵니다.',
                },
            ],
        },
        {
            id: 'wiki', group: 'detail', locked: '1.6.5',
            title: '위키 틀',
            summary: '원내 구성 틀 · 양원 의석 · 내각 · 교섭단체 · 위키 문법 복사',
            steps: [
                {
                    before: [closePanels, go('setup', 'wikibox'), showPanel('display')],
                    target: () => document.querySelector('#dispPanelWiki .nbx2') || '#dispPanelWiki',
                    title: '원내 구성 틀',
                    text: '의회 › 위키 틀은 위키 문서의 "원내 구성" 틀처럼 여당 · 야당 정당과 의석을 한 장에 모아요. 정당 · 집권 연정 · 의석에서 저절로 채워지고, 정당 로고(의회 › 정당 › 로고)가 있으면 이름 위에 들어가요. 미리보기는 오른쪽 "위키 틀" 탭에 보여요.',
                },
                {
                    before: [go('setup', 'wikibox'), showPanel('controls')],
                    target: () => document.querySelector('#contentWikibox .t65-tabs') || '#contentWikibox',
                    allow: ['#contentWikibox .t65-tabs'],
                    title: '양원 함께 적기',
                    text: () => document.querySelector('#contentWikibox [data-wch="both"]')
                        ? '틀에 담을 원을 고릅니다. "양원"을 고르면 정당마다 [상원 | 하원] 의석을 한 칸에 나란히 적어요. 지금 "양원"을 눌러보세요.'
                        : '틀에 담을 원을 고릅니다. 양원제면 "양원"을 골라 정당마다 [상원 | 하원] 의석을 한 칸에 나란히 적을 수 있어요.',
                    task: () => !document.querySelector('#contentWikibox [data-wch="both"]') || !!document.querySelector('#contentWikibox [data-wch="both"].active'),
                    done: '정당마다 두 원의 의석이 나란히 보여요.',
                },
                {
                    before: [go('setup', 'wikibox'), showPanel('controls')],
                    target: () => document.querySelector('#contentWikibox .t65-wk-form') || '#contentWikibox',
                    title: '틀 꾸미기',
                    text: '틀 머리(제목 · 색), 내각 이름과 기간(비우면 "현재"), 교섭단체 기준(이보다 의석이 적은 정당은 비교섭단체로 묶임), 직접 쓰는 각주를 정해요. 파벌이 둘 이상인 정당(예: 기민·기사연합)은 각주에 공동교섭단체로 적혀요.',
                },
                {
                    before: [go('setup', 'wikibox'), showPanel('controls')],
                    target: () => document.querySelector('#contentWikibox [data-act="copy"]') || '#contentWikibox',
                    title: '위키 문법 복사',
                    text: '"위키 문법 복사"를 누르면 나무위키 표 문법이 복사돼요. 로고가 있는 정당은 [[파일:정당 이름 로고.png]]로 들어가니, 위키에 그 이름으로 로고 그림을 올리면 그대로 보여요. "반원 그림 저장"으로 의석 반원 그림도 받을 수 있어요.',
                },
            ],
        },
        {
            id: 'map', group: 'detail',
            title: '지역구와 지도',
            summary: '맵 메이커 · 지도 올리기 · 원별 지도 · 지역구 편집 · 당선 정당 지정 · 성향 · 권역',
            steps: [
                {
                    before: [closePanels, showPanel('controls')],
                    title: () => (DEMO_BUILD() ? '맵 프리셋으로 지도 고르기' : '맵 메이커로 지도 만들기'),
                    text: () => (DEMO_BUILD() ? '지역구는 실제 지도 모양으로 만듭니다. 체험판에서는 국가 › 지역의 "맵 프리셋에서 고르기"로 대한민국 · 일본 · 미국 · 독일 · 프랑스 · 영국 · 이탈리아 · 스페인 · 캐나다 · 브라질 중 한 나라의 행정구역 지도를 골라 바로 지역구로 씁니다. (직접 그린 지도를 쓰는 맵 메이커는 정식판에서)' : '지역구는 실제 지도 모양으로 만듭니다. 메인 화면 › 맵 메이커에서 SVG 지도 파일을 열면 도형이 선 · 면 · 사각형 · 원으로 나뉘어 보이고, 지역구로 쓸 도형(보통 "면")을 골라 이름을 붙인 뒤 지역구 지도 파일(.jsx)로 내보냅니다. 미리보기는 스크롤로 확대 · 축소, 휠 클릭 드래그로 이동해요.'),
                },
                {
                    before: [go('nation', 'territory'), showPanel('controls')],
                    target: '#districtSvgEditUI',
                    title: () => (DEMO_BUILD() ? '맵 프리셋 고르기' : '지역구 지도 올리기'),
                    text: () => (DEMO_BUILD() ? '국가 › 지역의 "🗺 맵 프리셋에서 고르기"를 누르면 나라 지도 카드가 나와요. 고르면 행정구역 하나하나가 지역구가 되고(이름 · 약칭도 함께), 기본으로는 하원 · 상원 · 삼원이 같은 지도를 함께 씁니다. (새 지도를 고르면 기존 지역구 정보는 새 지도로 바뀌어요)' : '국가 › 지역에서 맵 메이커로 만든 .jsx 파일을 올리거나, "🗺 맵 프리셋에서 고르기"로 나라 지도(대한민국 · 일본 · 미국 · 독일 등 10개)를 바로 고릅니다. 올리면 도형 하나하나가 지역구가 되고, 기본으로는 하원 · 상원 · 삼원이 같은 지도를 함께 씁니다. (새 지도를 올리면 기존 지역구 정보는 새 지도로 바뀌어요)'),
                },
                {
                    before: [go('nation', 'territory'), showPanel('controls')],
                    target: () => { const r = document.getElementById('districtChamberSelectRow'); return r && r.offsetParent ? r : '#districtSvgEditUI'; },
                    title: '원마다 다른 지도',
                    text: '원이 둘 이상이면 위쪽에서 원을 고를 수 있습니다. 상원 · 삼원을 고르면 "하원 지도 공유 / 따로 쓰기"가 나와요. 따로 쓰기를 누르면 지금 지도를 복사해 그대로 이어 쓰고(의석 · 당선자 · 성향 유지), 그 원만의 지도를 새로 올릴 수 있습니다. 다시 공유로 돌리면 하원 지도에 있는 지역구의 값만 되돌아와요.',
                },
                {
                    before: [go('nation', 'territory'), showPanel('controls')],
                    target: '#districtListPanel',
                    title: '지역구 편집',
                    text: '지도나 목록에서 지역구를 누르면 편집 칸이 열립니다. 이름 · 약칭 · 인구, 그리고 원마다 몇 석을 뽑을지(0석이면 그 원엔 없는 지역구) 정해요. 지도는 휠 클릭 드래그로 이동, Shift+스크롤로 확대하고 ↺로 되돌립니다.',
                },
                {
                    before: [go('nation', 'territory'), showPanel('controls')],
                    target: () => { const el = document.getElementById('districtNamePanel'); return el && el.offsetParent ? el : '#districtListPanel'; },
                    title: '당선 정당 직접 지정',
                    text: '선거를 돌리지 않고 지역구 결과를 정할 수도 있어요. 지역구 편집 칸의 "당선 정당 직접 지정"에서 의석마다 정당을 고르면, 정당 의석 수 · 지역구 의원 · 지도 색이 함께 바뀝니다. 나중에 선거를 돌리면 선거 결과로 덮어써져요.',
                },
                {
                    before: [go('nation', 'nationSettings'), showPanel('controls')],
                    target: byId('districtSeatBadgesChk', 'label'),
                    title: '의석 숫자 박스',
                    text: '여러 석을 뽑는 지역구를 여러 정당이 나눠 가지면, 지도 위에 정당별 의석 수 숫자 박스가 뜹니다(한 정당이 다 가져가면 색만 칠해요). 국가 › 국가 설정에서 박스를 켜고 끌 수 있어요.',
                },
                {
                    before: [call('switchMainTab', 'election'), call('elecSwitchSub', 'tendency'), showPanel('controls')],
                    target: '#elecSubTendency',
                    title: '성향',
                    text: '여론 › 성향에서 지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 누가 이길지가 여기서 갈려요. 시각 화면에는 종합 지도와 정당별 지도가 함께 보입니다.',
                },
                {
                    before: [go('nation', 'regions'), showPanel('controls')],
                    target: '#elecSubRegion',
                    title: '권역',
                    text: '권역형 비례대표를 쓸 때는 국가 › 권역에서 지역구를 권역으로 묶습니다. 권역을 고른 뒤 지도에서 지역구를 눌러(끌어서 여러 개) 칠해요. 권역 득표율은 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다.',
                },
                {
                    before: [go('nation', 'regions'), showPanel('controls')],
                    target: () => { const el = document.getElementById('regionSeatPanel'); return el && el.offsetParent && el.children.length ? el : '#elecSubRegion'; },
                    title: '권역 의석 지정',
                    text: '권역 자체에 의석을 줄 수도 있어요(예: 여러 지역구를 묶어 한꺼번에 뽑는 선거구). 권역마다 의석 수와 정당별 당선 수를 정하면, 그 의석은 비례 의석에서 빠지고 선거를 돌려도 그대로 남습니다.',
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
            id: 'unrecovered', group: 'detail', locked: '1.6.7',
            title: '미수복 지역과 영토 통일',
            summary: '미수복 지역 종류 · 칠하기 · 선거에서 빠짐 · 종류별 통합 · 영토 통일',
            steps: [
                {
                    before: [closePanels, go('nation', 'unrecovered'), showPanel('controls')],
                    target: () => document.querySelector('#contentUnrecovered .teaser-unrec-summary') || '#contentUnrecovered',
                    title: '미수복 지역',
                    text: '국가 › 미수복에서는 나라가 영유권을 주장하지만 실제로 다스리지 못하는 땅(미수복 지역)을 정해요. 서독 튜토리얼에는 동독 주들이 "동독" 미수복 지역으로 들어 있어요.',
                },
                {
                    before: [go('nation', 'unrecovered'), call('switchDispTab', 'house'), call('chamberSetView', 'house', 'district'), showPanel('display')],
                    target: () => document.querySelector('#houseViewDistrictWrap') || '#dispPanelHouse',
                    title: '지도와 선거에서',
                    text: '미수복 지역은 모든 지도에서 종류 색 빗금으로 따로 보이고, 총선 지역구 · 지방선거 · 국민투표에서 빠져요. 그 지역구의 의석도 지역구 의석 수에서 빠집니다.',
                },
                {
                    before: [go('nation', 'unrecovered'), call('chamberSetView', 'house', 'arc'), showPanel('controls')],
                    target: () => document.querySelector('#contentUnrecovered .teaser-terr') || document.querySelector('#contentUnrecovered .teaser-add-row') || '#contentUnrecovered',
                    title: '종류와 칠하기',
                    text: '미수복 지역 종류는 여러 개 둘 수 있어요(예: 오스트리아 · 동방영토 · 북방영토). 종류마다 이름 · 빗금 색을 정하고, "칠하기"를 켠 채 지도에서 지역구를 차례로 눌러 칠해요. 지우개로 다시 일반 지역구로 돌립니다.',
                },
                {
                    before: [go('nation', 'unrecovered'), showPanel('controls')],
                    target: () => document.querySelector('#contentUnrecovered .teaser-unify') || '#contentUnrecovered',
                    allow: ['#contentUnrecovered'],
                    title: '영토 통일',
                    text: () => unrecLeft()
                        ? '"통합"은 그 종류만, "영토 통일 (전체)"는 모든 미수복 지역을 되찾아 일반 지역구로 돌려요. 지금 "영토 통일 (전체)"를 눌러 독일을 통일해 보세요.'
                        : '"통합"은 그 종류만, "영토 통일 (전체)"는 모든 미수복 지역을 되찾아 일반 지역구로 돌려요. 지금은 미수복 지역이 없어요 — 다음으로 넘어가세요.',
                    task: () => !unrecLeft(),
                    done: '통일됐어요! 되찾은 지역구는 이제 일반 지역구예요.',
                },
                {
                    before: [go('nation', 'territory'), showPanel('controls')],
                    target: () => document.getElementById('contentTerritory') || '#mainContentNation',
                    title: '통일 뒤에는',
                    text: '되찾은 지역구는 다음 총선부터 의석을 뽑아요 (서독이면 연방의회 지역구가 259석에서 331석으로 늘어요). 의회 › 의회 구성에서 총 의석도 맞춰 늘리고, 여론 › 성향에서 새 지역의 정당 성향을 정해 보세요.',
                },
            ],
        },
        {
            id: 'economy', group: 'detail', locked: '1.6.9',
            title: '경제',
            summary: '날짜를 따라 도는 경제 · 신용등급과 경고 신호 · 계기판과 금액 · 추이 · 통화 · 재정과 예산안 · 이벤트 · 전문가 분석 · 지역 · 시나리오',
            steps: [
                {
                    before: [closePanels, go('economy', 'overview'), showPanel('controls')],
                    target: () => document.querySelector('#contentEcoOverview .t69-top') || '#contentEcoOverview',
                    title: '보이지 않는 손',
                    text: '메뉴 › 경제에서는 나라 경제를 움직여요. 서독 튜토리얼은 1983년 서독 경제(성장 1.6% · 인플레 3.3% · 실업 약 9%)로 시작합니다. 왼쪽 위 배지는 신용등급(AAA ~ D)이에요.',
                },
                {
                    before: [go('economy', 'overview'), showPanel('controls')],
                    enter: () => { T.ecoTurn0 = ecoTurn(); },
                    target: () => document.querySelector('#contentEcoOverview .t69-next') || '#contentEcoOverview',
                    allow: ['#contentEcoOverview'],
                    title: '날짜를 따라 계산',
                    text: '경제는 게임 날짜를 따라 계산돼요 — 날짜가 다음 분기로 넘어가면 지난 분기만큼 돌아갑니다 (계산 단위는 1개월 · 1분기 · 1년 중에 고름). 오른쪽 위 날짜 ▶로 넘기든 국가 › 날짜 칸을 직접 고치든 똑같고, 날짜를 되돌리면 경제는 그대로 두고 그 날짜부터 이어서 계산해요. "▶ 다음 1분기"를 눌러 보세요 — 날짜가 3개월 넘어갑니다.',
                    task: () => ecoTurn() > (T.ecoTurn0 || 0),
                    done: '한 분기가 지났어요! 날짜도 함께 넘어갔어요.',
                },
                {
                    before: [go('economy', 'overview'), showEco('overview'), showPanel('display')],
                    target: () => document.querySelector('#dispPanelEconomy .t69-toprow') || '#dispPanelEconomy',
                    title: '신용등급과 경고 신호',
                    text: '오른쪽 경제 화면 첫 줄에는 신용등급과 경제 경고 신호가 있어요 — 실질 마이너스 성장 · 과도한 적자 · 금융 위기부터 국가 부도 · 하이퍼인플레이션 · 대공황 · 자본 도피 · 경제 붕괴까지. 위기 기준(경제 › 시나리오에서 정함)에 가까워지면 ◆ 위험, 넘으면 ✖ 위기로 켜지고, 꺼진 신호는 흐리게 보여요.',
                },
                {
                    before: [go('economy', 'overview'), showEco('overview'), showPanel('display')],
                    target: () => document.querySelector('#dispPanelEconomy .t69-gauges') || '#dispPanelEconomy',
                    title: '계기판과 금액',
                    text: '둘째 줄 반원 계기는 지표마다 안전 · 경고 · 위험 · 위기 구간을 보여 주고, 아래 작은 선은 최근 8기간의 흐름 · ▲▼는 지난 기간보다 오르내린 만큼이에요 (날짜를 넘겨야 생겨요). 계기를 누르면 그 지표를 움직이는 탭으로 가요. 셋째 줄에는 GDP · 국가부채 · 국고 · 세입 · 세출 · 재정수지 · 국채 이자가 화폐 단위로 나오고, 성장률은 통계처럼 전년 대비예요.',
                },
                {
                    before: [go('economy', 'overview'), showEco('overview'), showPanel('display')],
                    target: () => { const c = document.querySelector('#dispPanelEconomy .t69-chips'); return (c && c.parentElement) || '#dispPanelEconomy'; },
                    title: '추이 그래프',
                    text: '큰 그래프는 칩을 눌러 지표를 겹쳐 보고, 점선은 앞으로의 예측이에요. 칸 너비는 실제 시간 길이대로라 1개월 · 1분기 · 1년 칸이 섞여도 시간축이 맞고, 위쪽 10년 · 5년 · 2년으로 기간을 좁혀요. 깃발은 위기 · 총선 · 예산안 · 이벤트, 회색 띠는 경기 침체예요. 오른쪽 클릭으로 그림을 내보낼 수 있어요.',
                },
                {
                    before: [go('economy', 'monetary'), showPanel('controls')],
                    target: () => document.querySelector('#contentEcoMonetary .t69-card') || '#contentEcoMonetary',
                    title: '통화',
                    text: '기준금리 · 화폐발행률 · 양적완화 같은 통화정책은 중앙은행 몫이라 바로 반영돼요. 금리를 올리면 인플레가 잡히지만 실업이 늘고, 돈을 찍으면 당장은 좋아도 물가와 통화가치가 무너집니다. 아래 막대가 "이대로면 다음 분기"예요.',
                },
                {
                    before: [go('economy', 'fiscal'), showPanel('controls')],
                    target: () => document.querySelector('#contentEcoFiscal .t69-budgetbox') || '#contentEcoFiscal',
                    title: '재정과 예산안',
                    text: '지출(GDP 대비 %)과 세율을 고치면 예산안 초안에 모였다가, "예산안 제출"로 입법 › 제출에 올라가요. 의회에서 가결돼야 반영되고, 그 전까지는 지난 예산(준예산)대로 집행돼요. 정당별 예상 표결을 보고 한 번에 넣을 수도 있어요. 지출 · 세수 · 의무지출 · 국고 · 국가부채는 비율 옆에 금액도 함께 나와요.',
                },
                {
                    before: [go('economy', 'events'), showPanel('controls')],
                    enter: () => { T.evBase = (t69() && (t69().state.sched || []).length) || 0; },
                    target: () => document.querySelector('#contentEcoEvents .t69-card') || '#contentEcoEvents',
                    allow: ['#contentEcoEvents'],
                    title: '이벤트',
                    text: '경제 › 이벤트에서는 정한 날짜에 대공황 · 금융 위기 · 오일 쇼크 · 하이퍼인플레이션 · 국가 부도 · 경제 붕괴 · 재해 · 호황을 일으켜요 ("직접 설정"으로 이름 · 효과를 정한 사건도). 종류를 고르고 시작 연 · 월, 기간(개월), 세기를 정해 "+ 이벤트 추가"를 눌러 보세요.',
                    task: () => !!t69() && (t69().state.sched || []).length > (T.evBase || 0),
                    done: '이벤트가 예약됐어요! 날짜가 그 달에 닿으면 신뢰도 · 통화가치가 한 번 꺾이고, 기간 동안 성장 · 인플레 · 실업이 움직여요. 일어나기 전에는 아래 목록에서 날짜 · 기간 · 세기를 고치거나 지울 수 있어요.',
                },
                {
                    before: [go('economy', 'analysis'), showEco('analysis'), showPanel('controls')],
                    target: () => document.querySelector('#contentEcoAnalysis .t69-presets') || '#contentEcoAnalysis',
                    title: '전문가 분석',
                    text: '깊게 보고 싶으면 분석에서 경기 순환 · 인플레 · 재정 건전성 · 지역 격차 · 정책 실험을 골라요. 오른쪽에 같은 십자선을 쓰는 연동 패널, 성장 기여도 분해(이벤트 몫 포함), 부채 동학(r − g), 예산 흐름도, 정책 민감도가 그려집니다. "크게 보기"로 화면 전체에 펼칠 수 있어요.',
                },
                {
                    before: [go('economy', 'region'), showPanel('controls')],
                    target: () => document.querySelector('#contentEcoRegion .t69-dlist') || '#contentEcoRegion',
                    title: '지역 · 시나리오 · 항목',
                    text: '지역에서 주마다 산업구조 · 연령구조 · 소득등급을 정하면 같은 정책도 지역마다 다르게 작용해요 (금리 인상은 제조업, 복지 삭감은 저소득 지역에 크게). 시나리오에서는 "값 + 기간" 규칙과 프리셋 · 위기 기준을, 항목에서는 나만의 지출 항목 · 세목 · 자산을 만들 수 있어요.',
                },
            ],
        },
        {
            id: 'vassals', group: 'detail', locked: '1.6.8',
            title: '종속국',
            summary: '종속국 만들기 · 칠하기 · 종속국 의회와 선거 · 합병 · 해방',
            steps: [
                {
                    before: [closePanels, go('nation', 'vassals'), showPanel('controls')],
                    target: () => document.querySelector('#contentVassals .t68-summary') || '#contentVassals',
                    title: '종속국',
                    text: '국가 › 종속국에서는 본국에 딸린 나라(보호국 · 괴뢰국 · 자치령 …)를 정해요. 종속국 땅은 본국 영토처럼 지도에 있지만, 본국 선거 · 의석에서는 빠지고 따로 의회를 둡니다.',
                },
                {
                    before: [go('nation', 'vassals'), showPanel('controls')],
                    target: () => firstVassalCard() || document.querySelector('#contentVassals [data-act="add"]') || '#contentVassals',
                    allow: ['#contentVassals'],
                    title: '종속국 만들기',
                    text: () => (t68() && t68().vassals.length
                        ? '종속국이 있어요. 카드에서 이름 · 점무늬 색 · 종속 형태(보호국 · 보호령 · 동군연합 …)를 고칠 수 있어요. 형태는 "＋ 새 형태…"나 위쪽 "종속 형태" 목록에서 원하는 대로 추가해요.'
                        : '이름을 적고 "+ 종속국 추가"를 눌러 종속국을 하나 만들어 보세요 (예: 서베를린).'),
                    task: () => !!(t68() && t68().vassals.length),
                    done: '종속국이 생겼어요!',
                },
                {
                    before: [go('nation', 'vassals'), call('switchDispTab', 'house'), call('chamberSetView', 'house', 'district'), showPanel('display')],
                    target: () => document.querySelector('#houseViewDistrictWrap') || '#dispPanelHouse',
                    title: '칠하기와 지도',
                    text: '"칠하기"를 켠 채 국가 › 종속국 오른쪽 지도에서 지역구를 차례로 눌러 그 나라 땅으로 정해요. 종속국 땅은 모든 지도에서 그 나라 색 점무늬로 보이고(미수복 지역의 빗금과 달라요), 본국 총선 · 지방선거 · 국민투표에서 빠집니다.',
                },
                {
                    before: [go('nation', 'vassals'), call('chamberSetView', 'house', 'arc'), () => { if (t68()) t68().openParliament(); }, showPanel('controls')],
                    target: () => document.querySelector('#contentVassals .t68-parl') || firstVassalCard() || '#contentVassals',
                    allow: ['#contentVassals'],
                    title: '종속국 의회',
                    text: () => (t68() && t68().vassals.some(v => v.parliament.elections)
                        ? '종속국마다 따로 의회가 있어요 — 의회 이름 · 의석 수 · 봉쇄조항 · 정당(지지율 · 의석)을 정하고 "선거 실시"로 의석을 다시 나눕니다.'
                        : '종속국마다 따로 의회가 있어요 — 의회 이름 · 의석 수 · 봉쇄조항 · 정당(지지율 · 의석)을 정해요. "본국 정당 가져오기"나 "+ 정당"으로 정당을 넣고 "선거 실시"를 눌러 보세요.'),
                    task: () => !!(t68() && t68().vassals.some(v => v.parliament.elections)),
                    done: '선거를 치렀어요! 반원형 그림이 새 의석이에요.',
                },
                {
                    before: [go('nation', 'vassals'), showPanel('controls')],
                    target: () => document.querySelector('#contentVassals .t68-actions') || '#contentVassals',
                    title: '합병과 해방',
                    text: '"합병"은 종속국을 본국에 합쳐 그 땅을 일반 지역구로 돌려요 (본국 선거 · 의석에 들어가고, 종속국 의회는 해산). "해방"은 종속국을 독립시켜 본국에서 떼어 내요 — 독립국으로 지도에 따로 보이고 선거에서 계속 빠지며, 세계 › 국가 순위에도 올라갑니다.',
                },
            ],
        },
        {
            id: 'people', group: 'detail',
            title: '사람',
            summary: '인물 만들기 · 의석 · 당직 · 내각 자리 배정 · 지역구 후보 · 자리가 사라져도 남는 인물',
            steps: [
                {
                    before: [closePanels, go('nation', 'people'), showPanel('controls')],
                    target: '#contentPeople',
                    title: '사람',
                    text: '국가 › 사람에서는 인물을 미리 만들어 둡니다 — 이름 · 사진 · 이념 · 소속 정당 · 파벌. 의석마다 이름 · 사진을 따로 적는 대신, 여기 인물을 자리에 배정해요.',
                },
                {
                    before: [go('nation', 'people'), showPanel('controls')],
                    enter: () => { T.peopleBase = (window.T61 && T61.people.length) || 0; },
                    target: () => document.querySelector('#contentPeople [data-act="import"]') || '#contentPeople',
                    allow: ['#contentPeople'],
                    title: '인물 만들기',
                    text: '"의원 · 내각에서 가져오기"를 누르면 지금 의원 · 당수 · 내각 자리에 적힌 이름으로 인물을 만들고 연결합니다 (같은 이름은 한 사람). "＋ 사람 추가"로 직접 만들어도 돼요.',
                    task: () => !!window.T61 && T61.people.length > (T.peopleBase || 0),
                    done: '인물이 생겼어요. 카드의 ▾를 누르면 이념 · 정당 · 파벌을 고치고 자리를 배정할 수 있습니다.',
                },
                {
                    before: [go('nation', 'people'), showPanel('controls')],
                    target: '#contentPeople',
                    title: '자리 배정 · 지역구 후보',
                    text: '"＋ 자리 배정"으로 지역구 · 비례 의석, 당수 · 원내대표, 대통령 · 총리 · 내각 자리에 앉힙니다 — 의원이 아닌 사람도 장관이 될 수 있어요. 이름 · 사진을 고치면 배정된 모든 자리에 반영됩니다. "＋ 지역구 후보로"로 내세우면 총선 · 보궐선거에서 그 정당이 이긴 의석에 바로 배정돼요.',
                },
                {
                    before: [go('nation', 'people'), showPanel('controls')],
                    target: '#contentPeople',
                    title: '자리가 사라져도',
                    text: '선거에서 지거나 당적 변경 · 궐석으로 의석이 사라져도 인물은 사람 탭에 남습니다 ("자리 없음"으로 걸러 보기). 다음 선거에 다시 후보로 내세우거나 다른 자리에 배정하세요.',
                },
            ],
        },
        {
            id: 'citizens', group: 'detail',
            title: '시민 · 이민자',
            summary: '지역구 시민 / 인구 · 선거마다 이민자 투표권 · 이민자 성향',
            steps: [
                {
                    before: [closePanels, go('nation', 'territory'), showPanel('controls')],
                    target: () => firstCitCard() || '#districtListPanel',
                    title: '시민과 이민자',
                    text: '국가 › 지역의 지역구 목록에는 인구 칸 앞에 "시민" 칸이 있어요 — "시민 / 인구"로 적으면 나머지가 이민자입니다. 비워 두면 그 지역구 인구 전체가 시민이에요.',
                },
                {
                    before: [go('nation', 'territory'), showPanel('controls')],
                    enter: () => { T.citBase = citCount(); },
                    target: () => firstCitCard() || '#districtListPanel',
                    allow: ['#districtListPanel'],
                    title: '시민 수 적기',
                    text: '아무 지역구나 "시민" 칸에 인구보다 작은 수를 적어 보세요 (예: 인구 100만이면 90만). 인구가 비어 있으면 인구부터 적어요.',
                    task: () => citCount() > (T.citBase || 0),
                    done: '그 지역구에 이민자가 생겼어요. 목록 위 합계 줄과 국가 › 사람 위쪽에 시민 · 인구 · 이민자 수가 나와요.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    enter: () => { T.migBase = migSig(); },
                    target: () => document.getElementById('t61MigrantCard') || '#contentElecSettings',
                    allow: ['#t61MigrantCard'],
                    title: '이민자 투표권',
                    text: '시민은 모든 선거에서 투표해요. 이민자는 선거마다 — 대선 · 총리 직선 / 총선 / 지방선거 / 국민투표 — 투표권을 줄지 선거 › 방식 아래쪽에서 정합니다. 하나를 켜 보세요.',
                    task: () => migSig() !== T.migBase,
                    done: '바뀌었어요. 켠 선거에서는 시민과 이민자가 함께 투표해요.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    target: () => document.querySelector('#t61MigrantCard .t61-mig-leanon') || document.getElementById('t61MigrantCard') || '#contentElecSettings',
                    title: '이민자 성향',
                    text: '"이민자 성향 따로 정하기"를 켜면 정당마다 이민자 지지율을 정해요. 이민자가 투표하는 선거에서는 지역구마다 시민 · 이민자 수만큼 섞어 개표하고(총선 비례 · 대선은 전국 수로), 지방선거 · 국민투표는 유권자 수도 바뀝니다. 끄면 이민자도 그 지역 시민과 같은 성향으로 투표해요.',
                },
            ],
        },
        {
            id: 'world', group: 'detail', locked: '1.6.5',
            title: '세계',
            summary: '국가 순위 · 순위표 · 점수 · 국기 · 진영과 하위 이념',
            steps: [
                {
                    before: [closePanels, go('world', 'ranking'), showPanel('controls')],
                    target: () => (!isMobileLayout() && document.querySelector('#sideNav .mn-group[data-main="world"]')) || navTarget(),
                    title: '세계 메뉴',
                    text: () => `국가 아래 🌐 세계 메뉴에는 국가 순위와 진영이 있어요 (꾸밈용 — 게임 기능에는 영향 없음). 바로 위 💹 경제는 ${t69() ? '1.6.9 경제 시스템이에요 (튜토리얼 "경제" 과정).' : '1.6.9 업데이트(경제 시스템)에서 열리는 잠긴 메뉴예요.'}`,
                },
                {
                    before: [go('world', 'ranking'), showPanel('display')],
                    target: () => document.querySelector('#dispPanelRanking .t65-rk') || '#dispPanelRanking',
                    title: '순위표',
                    text: '오른쪽 시각 화면 "국가 순위" 탭에 순위표가 크게 보여요. 진영 색 띠 · 국기 · 점수 막대로 나라를 줄 세우고, 우리나라 줄은 밝게 강조돼요 — 이름 · 국기는 국가 › 상징의 것을 그대로 써요.',
                },
                {
                    before: [go('world', 'ranking'), showPanel('controls')],
                    enter: () => { T.rankBase = rankSig(); },
                    target: () => document.querySelector('#contentRanking .t65-re-list') || '#contentRanking',
                    allow: ['#contentRanking'],
                    title: '점수 바꾸기',
                    text: '왼쪽 목록에서 아무 나라의 점수를 ± 버튼이나 직접 입력으로 바꿔보세요. 오른쪽 순위표가 바로 바뀌고, 손을 떼면 왼쪽 목록도 순위대로 다시 줄 서요.',
                    task: () => !t64() || rankSig() !== T.rankBase,
                    done: '순위표가 바뀌었어요.',
                },
                {
                    before: [go('world', 'ranking'), showPanel('controls')],
                    target: () => document.querySelector('#contentRanking .t65-re-row') || '#contentRanking',
                    title: '국기 · 진영 · 하위 이념',
                    text: '국기 칸을 누르면 그림을 올려요(주요 나라는 기본 국기가 들어 있어요). 아래 두 칸에서 진영과 하위 이념을 고르고, "순위 기준 저장"을 누른 뒤 점수를 바꾸면 순위표에 ▲▼ 변동이 보여요.',
                },
                {
                    before: [go('world', 'blocs'), showPanel('controls')],
                    target: '#contentBlocs',
                    title: '진영',
                    text: '세계 › 진영에서 진영을 추가 · 삭제하고 색 · 설명 · 하위 이념(예: 서방 진영 › 기독교 민주주의)을 정해요. 진영을 지우면 그 나라들은 미분류가 되고, 위쪽 막대로 진영 구도를 한눈에 봐요.',
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
            id: 'electoral', group: 'detail', locked: '1.6.3',
            title: '선거인단',
            summary: '선거인단제 · 선거인 수 · 승자독식과 비례 · 과반 미달',
            steps: [
                {
                    before: [closePanels, go('vote', 'elecSettings'), showPanel('controls')],
                    target: '#presElecModeElectoralBtn',
                    allow: ['#presElecModeElectoralBtn'],
                    title: '선거인단제 고르기',
                    text: '대선을 국민 득표가 아니라 선거인단으로 치를 수 있어요. 선거 › 방식의 대선 방식에서 "선거인단제"를 눌러보세요.',
                    task: () => typeof presElectionMode !== 'undefined' && presElectionMode === 'electoral',
                    done: '선거인단제가 됐어요. 바로 아래에 선거인단 설정이 나타납니다.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    target: () => document.getElementById('t63EcPanel') || '#contentElecSettings',
                    title: '선거인단 설정',
                    text: '선거인을 권역마다 또는 지역구마다 뽑습니다. 선거인 수는 인구 비례 · 의석 수 + 가산(미국식은 하원 의석 + 2) · 직접 입력 중에 고르고, 그 단위에서 1위가 선거인을 모두 가져가는 승자독식이나 득표대로 나누는 비례 배분을 고릅니다. 신의 없는 선거인 비율도 정할 수 있어요.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    target: () => document.getElementById('t63EcPanel') || '#contentElecSettings',
                    title: '과반과 의회 결정',
                    text: '선거인 과반을 얻어야 당선입니다. 아무도 과반이 안 되면 의회가 상위 3명 중에서 고르거나(미국식) 선거인을 가장 많이 얻은 후보가 당선되게 할 수 있어요. 서독은 북독일 · 서독일 · 남독일 세 권역으로 나뉘어 있어, 권역마다 선거인을 뽑습니다.',
                },
                {
                    before: [go('vote', 'elecPresidential'), showPanel('controls')],
                    target: '#presElecRunBtn',
                    allow: ['#presElecRunBtn', '#presElecResultPanel'],
                    title: '선거인단으로 대선 치르기',
                    text: '선거 › 대선에서 선거를 치러보세요. 권역마다 성향대로 표가 나오고, 그 권역의 선거인이 정해집니다.',
                    task: () => !!document.querySelector('#presElecResultPanel .t63-ec'),
                    done: '개표가 끝났어요.',
                },
                {
                    before: [go('vote', 'elecPresidential'), showPanel('controls')],
                    target: () => document.querySelector('#presElecResultPanel .t63-ec') || '#contentElecPresidential',
                    title: '득표와 선거인',
                    text: '후보마다 선거인 수와 득표율이 함께 나오고, 이긴 후보 색으로 칠한 지도와 권역별 선거인 목록이 붙어요. 승자독식에서는 득표율이 높아도 이긴 권역이 없으면 선거인이 0명일 수 있어요 — 득표에서 지고도 선거인으로 이기는 일도 생깁니다.',
                },
            ],
        },
        {
            id: 'union', group: 'detail',
            title: '후보 단일화',
            summary: '여러 정당이 후보 한 명으로 · 대선과 지역구에 따로 적용',
            steps: [
                {
                    before: [closePanels, go('vote', 'elecSettings'), showPanel('controls')],
                    enter: () => { T.unionBase = unionList().length; },
                    target: unionSection,
                    title: '후보 단일화란?',
                    text: '선거 전에 여러 정당이 후보를 한 명으로 합치는 기능입니다. 참여 정당 중 지지가 가장 높은 정당이 후보를 내고, 나머지 정당의 지지를 모두 합쳐 받아요. 비례대표 투표는 단일화와 상관없이 각 정당이 따로 받습니다.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    target: () => document.querySelector('#contentElecSettings button[onclick^="addCandidateUnion"]'),
                    allow: ['#contentElecSettings button[onclick^="addCandidateUnion"]'],
                    title: '단일화 만들기',
                    text: '"+ 단일화 추가"를 눌러 보세요.',
                    task: () => unionList().length > (T.unionBase || 0),
                    done: '빈 단일화가 생겼어요.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    target: () => lastUnionCard() || unionSection(),
                    allow: () => [lastUnionCard() || '#candidateUnionList'],
                    title: '참여 정당 고르기',
                    text: '단일화에 참여할 정당을 두 개 이상 체크해 보세요. 한 정당은 단일화 하나에만 들어갈 수 있고, 이름은 비워 두면 정당 이름을 이어 붙여 써요.',
                    task: () => { const u = unionList()[unionList().length - 1]; return !u || (u.partyIds || []).length >= 2; },
                    done: '단일화가 적용됐어요.',
                },
                {
                    before: [go('vote', 'elecSettings'), showPanel('controls')],
                    target: () => lastUnionCard() || unionSection(),
                    title: '어디에 적용할까',
                    text: '"대선 · 총리 선거"를 켜면 기준 원 지지율이 가장 높은 정당이 단일 후보로 나서고, 결과에 "(A당 · B당 단일 후보)"로 표시돼요. "총선 지역구"를 켜면 지역구마다 성향이 가장 높은 참여 정당이 후보를 냅니다. 필요 없어지면 "단일화 해제"를 누르세요.',
                    leave: closePanels,
                },
            ],
        },
        {
            id: 'fraud', group: 'detail',
            title: '부정선거',
            summary: '시도 켜기 · 부풀리기와 지역구 조작 · 발각 확률 · 결과',
            steps: [
                {
                    before: [closePanels, go('vote', 'fraud'), showPanel('controls')],
                    target: '#contentFraud',
                    title: '부정선거 (⚠)',
                    text: '선거 › ⚠에서는 정당별로 부정선거를 꾸밀 수 있습니다. 시도는 다음 총선 개표 한 번에만 적용되고, 들키면 큰 대가를 치러요.',
                },
                {
                    before: [go('vote', 'fraud'), showPanel('controls')],
                    target: () => fraudCheckbox() ? fraudCheckbox().closest('label') : '#fraudPartyList',
                    allow: ['#fraudPartyList'],
                    title: '시도 켜기',
                    text: '아무 정당이나 "⚠ 부정선거 시도"를 체크해 보세요. 설정 칸이 열립니다.',
                    task: () => partyList().some(p => p.fraudAttempt),
                    done: '부정선거 계획이 세워졌어요.',
                },
                {
                    before: [go('vote', 'fraud'), showPanel('controls')],
                    target: () => fraudBlock() || '#fraudPartyList',
                    allow: ['#fraudPartyList'],
                    title: '무엇을 조작할까',
                    text: '대상 의원실을 고르고, 비례 득표율을 몇 %p 부풀릴지 정합니다. 지역구 개표 조작에서 고른 지역구는 실제 결과와 상관없이 이 정당이 이겨요(지역구 지도가 있을 때). 발각 확률은 조작 규모에 따라 자동으로 계산되고, "수동"을 켜면 직접 정할 수 있습니다.',
                },
                {
                    before: [go('vote', 'fraud'), showPanel('controls')],
                    target: () => fraudBlock() || '#fraudPartyList',
                    allow: ['#fraudPartyList'],
                    title: '들키면 어떻게 될까',
                    text: '들킬지는 개표 도중에 드러납니다. 들키지 않으면 조작이 결과에 그대로 반영되고, 들키면 개표 중간(무작위 시점)에 개표가 멈추며 그 정당은 활동 금지 처분을 받고(알림이 뜹니다) 조작 표를 무효로 해 처음부터 다시 개표해요. 어느 쪽이든 시도는 개표 한 번으로 사라집니다. 그만두려면 체크를 풀면 돼요.',
                    leave: closePanels,
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
            id: 'coup', group: 'detail', locked: '1.6.2',
            title: '군부와 쿠데타',
            summary: '군 지휘부 · 충성도 · 쿠데타 · 군정 · 민정 이양',
            steps: [
                {
                    before: [closePanels, go('cabinet', 'military'), showPanel('controls')],
                    target: '#contentMilitary',
                    title: '군부',
                    text: '내각 › 군부에서 국방부 장관 · 합참의장 · 육해공군 참모총장 같은 군 지휘부를 정합니다. 지휘관마다 정부에 대한 충성도(0~100)가 있고, 충성도가 낮을수록 군부 쿠데타가 성공하기 쉬워요.',
                },
                {
                    before: [go('cabinet', 'military'), showPanel('controls')],
                    target: () => document.querySelector('#contentMilitary [data-act="seed"]') || '#contentMilitary',
                    allow: ['#contentMilitary'],
                    title: '군 지휘부 만들기',
                    text: '"기본 군 지휘부 만들기"를 눌러 지휘부를 채워 보세요. (이미 있으면 그대로 넘어가요)',
                    task: () => !!(window.T62 && window.T62.military && window.T62.military.length),
                    done: '군 지휘부가 생겼어요. 이름 · 직책 · 충성도는 언제든 고칠 수 있어요.',
                },
                {
                    before: [go('cabinet', 'coup'), showPanel('controls')],
                    target: '#contentCoup',
                    title: '쿠데타',
                    text: '내각 › 쿠데타에서 주도 세력을 고릅니다 — 군부(군 지휘관이 주도) · 정당(야당이 군과 손잡고) · 친위 쿠데타(대통령이 스스로 권력 강화). 성공 확률은 여당 의석 · 지지율 · 계엄 여부 · 군의 충성도로 정해지고 요인별로 보여요.',
                },
                {
                    before: [go('cabinet', 'coup'), showPanel('controls')],
                    enter: () => { T.coupBase = logLen('T62'); },
                    target: () => document.querySelector('#contentCoup [data-act="go"]') || '#contentCoup',
                    allow: ['#contentCoup'],
                    title: '쿠데타 일으키기',
                    text: '쿠데타를 일으켜 보세요. 성공하든 실패하든 괜찮아요 — 이 나라는 복사본입니다.',
                    task: () => logLen('T62') > (T.coupBase || 0),
                    done: '결과가 나왔어요. 성공하면 계엄 · 의회 정지 · 반대 정당 활동 금지가, 실패하면 주도 세력 처벌과 지지율 하락이 따릅니다.',
                },
                {
                    before: [go('cabinet', 'coup'), showPanel('controls')],
                    target: '#contentCoup',
                    title: '군정과 그 뒤',
                    text: '군부 쿠데타가 성공하면 숨겨진 정부 형태 "군정"이 됩니다 — 군사평의회 의장이 대통령 · 총리를 겸하고 선거가 멈춰요. 군정은 민정 이양(선거 재개) · 역쿠데타 · 혁명으로 끝낼 수 있습니다.',
                },
            ],
        },
        {
            id: 'revolution', group: 'detail', locked: '1.6.3',
            title: '혁명',
            summary: '민주 · 공산주의 혁명 · 당-국가 체제 · 새 헌법 · 국호 교체',
            steps: [
                {
                    before: [closePanels, go('cabinet', 'revolution'), showPanel('controls')],
                    target: '#contentRevolution',
                    title: '혁명',
                    text: '내각 › 혁명은 민중이 일으킵니다. 정부 불신 · 군정이나 계엄 · 활동 금지된 정당 · 혁명 정당의 지지율과 그 정당이 앞서는 지역의 인구가 성공 확률을 정해요.',
                },
                {
                    before: [go('cabinet', 'revolution'), showPanel('controls')],
                    target: () => { const b = document.querySelector('#contentRevolution [data-kind]'); return b ? b.parentElement : '#contentRevolution'; },
                    title: '주도 이념',
                    text: '민주 혁명이 성공하면 독재 · 군정이 무너지고 일반 정부 형태로 돌아가 새 헌법을 세웁니다. 공산주의 혁명이 성공하면 숨겨진 정부 형태 "당-국가 체제"가 돼요 — 혁명 정당이 혼자 집권하고, 의회는 최고인민회의, 선거는 단일 후보 찬반 투표가 됩니다.',
                },
                {
                    before: [go('cabinet', 'revolution'), showPanel('controls')],
                    enter: () => { T.revBase = logLen('T63'); },
                    target: () => document.querySelector('#contentRevolution [data-act="go"]') || '#contentRevolution',
                    allow: ['#contentRevolution'],
                    title: '혁명 일으키기',
                    text: '이념과 혁명 정당을 고르고 혁명을 일으켜 보세요. 혁명 뒤 새 국호 · 국기도 미리 정해 둘 수 있어요.',
                    task: () => logLen('T63') > (T.revBase || 0),
                    done: '결과가 나왔어요. 실패하면 혁명 정당이 활동 금지되고 정부가 계엄령을 선포합니다.',
                },
                {
                    before: [go('cabinet', 'revolution'), showPanel('controls')],
                    target: '#contentRevolution',
                    title: '혁명 뒤',
                    text: '당-국가 체제에서는 "찬반 선거 치르기"로 최고인민회의 대의원을 뽑고, 다시 민주 혁명을 일으켜야 무너집니다. 혁명이 끝나면 새 총선을 치르세요.',
                },
            ],
        },
        {
            id: 'royal', group: 'detail', locked: '1.6.6',
            title: '왕실 · 왕정복고',
            summary: '왕가와 왕위 주장자 · 계승 규칙 · 왕정복고 · 전제군주정 · 계승 분쟁 · 친위 쿠데타 · 공화 혁명',
            steps: [
                {
                    before: [closePanels, go('cabinet', 'royal'), showPanel('controls')],
                    target: '#contentRoyal',
                    title: '왕실',
                    text: '내각 › 왕실에서는 군주제를 다룹니다. 공화국에 왕을 되살리는 왕정복고, 왕이 실권을 쥐는 숨겨진 정부 형태 "전제군주정", 왕위 계승과 그 분쟁, 군주제를 없애는 공화 혁명까지요.',
                },
                {
                    before: [go('cabinet', 'royal'), showPanel('controls')],
                    enter: () => { T.royalDyn = (window.T66 && T66.dynasties.length) || 0; },
                    target: () => document.querySelector('#contentRoyal [data-act="seed"]') || document.querySelector('#contentRoyal .t66-dyn') || '#contentRoyal',
                    allow: ['#contentRoyal'],
                    title: '왕가와 왕위 주장자',
                    text: '왕가마다 계승 규칙(남계만 · 남자 우선 · 성별 무관)과 왕위 주장자를 정합니다. 주장자 순서(⋮⋮ 끌기)가 출생 순이고, 정당마다 지지하는 주장자를 고를 수 있어요. "예시 왕가 만들기"를 누르거나 왕가를 직접 추가해 보세요.',
                    task: () => !!window.T66 && T66.dynasties.length > 0,
                    done: '서독이라면 호엔촐레른가 · 비텔스바흐가가 만들어져요. 지지 정당이 많은 주장자일수록 왕정복고 · 계승 분쟁에 유리합니다.',
                },
                {
                    before: [go('cabinet', 'royal'), showPanel('controls')],
                    enter: () => { T.royalBase = logLen('T66'); },
                    target: () => document.querySelector('#contentRoyal [data-act="restore"]') || '#contentRoyal',
                    allow: ['#contentRoyal'],
                    title: '왕정복고',
                    text: '주장자를 지지하는 정당이 하원 과반이면 의회 결의로 입헌군주제를 세우고, 아니면 왕당파 쿠데타로 — 쿠데타는 입헌군주제나 전제군주정을 고를 수 있어요. 성공하면 국호가 "○○ 왕국"으로 바뀌고 새 헌법이 생깁니다.',
                    task: () => logLen('T66') > (T.royalBase || 0),
                    done: '결과가 나왔어요. 쿠데타가 실패하면 왕당파 정당이 활동 금지되고 주장자는 망명합니다.',
                },
                {
                    before: [go('cabinet', 'royal'), showPanel('controls')],
                    target: '#contentRoyal',
                    title: '왕정에서',
                    text: '전제군주정에서는 왕이 총리를 임명하고 거부권 · 비상 권한을 쥐며, 입헌 개혁으로 입헌군주제로 돌아갈 수 있어요. 입헌군주제에서는 친위 쿠데타로 전제군주정을 노릴 수 있습니다. 왕이 서거 · 퇴위하면 계승 규칙대로 다음 계승자가 즉위하고, 다른 주장자가 정통성을 내세우면 계승 분쟁(카를로스파처럼)이 벌어져요. 공화 혁명이 성공하면 군주제가 폐지됩니다.',
                },
            ],
        },
        {
            id: 'siege', group: 'detail', locked: '1.6.4',
            title: '국회공성전',
            summary: '계엄 중 봉쇄 돌파 · 의장석 점거 · 부상 결석 · 국회선진화법',
            steps: [
                {
                    before: [closePanels, go('law', 'siege'), showPanel('controls')],
                    target: () => document.querySelector('#contentSiege .t64-modes') || '#contentSiege',
                    title: '국회공성전',
                    text: '입법 › 공성전에는 두 가지가 있어요 — 계엄군의 봉쇄를 뚫고 본회의장에 들어가 계엄을 해제하는 "봉쇄 돌파"와, 반대 법안의 표결을 막으려 의장석을 점거하는 "의장석 점거"입니다.',
                },
                {
                    before: [go('law', 'siege'), () => window.T64 && window.T64.setMode('break'), showPanel('controls')],
                    target: () => document.querySelector('#contentSiege .t64-panel') || '#contentSiege',
                    allow: ['#contentSiege'],
                    title: '계엄령 선포',
                    text: () => (typeof emergencyPowers !== 'undefined' && emergencyPowers.martialLaw.active)
                        ? '봉쇄 돌파는 계엄 중에만 할 수 있어요. 지금은 이미 계엄령이 선포돼 있으니 바로 다음으로 넘어가세요.'
                        : '봉쇄 돌파는 계엄 중에만 할 수 있어요. "계엄령 선포 (의회 정지, 시험용)"을 눌러보세요.',
                    task: () => typeof emergencyPowers !== 'undefined' && !!emergencyPowers.martialLaw.active,
                    done: '계엄령이 선포된 상태예요.',
                },
                {
                    before: [go('law', 'siege'), () => window.T64 && window.T64.setMode('break'), showPanel('controls')],
                    target: () => document.querySelector('#contentSiege .t64-meter-box') || '#contentSiege',
                    title: '누가 들어갈까?',
                    text: '정당마다 참여율을 정하면 의원 한 명씩 봉쇄를 뚫는지 정해집니다. 봉쇄 강도(군 지휘부 충성도) · 시민 지원 · 정당 결속도가 입장 확률을 바꿔요. 들어간 의원만 표결하지만 가결 기준은 재적 과반이라, 야당만으로 모자라면 여당 의원도 들어와야 합니다. 표결을 막으려는 정당은 "입구 저지"로 본회의장 입구를 몸으로 막을 수도 있어요.',
                },
                {
                    before: [go('law', 'siege'), () => window.T64 && window.T64.setMode('break'), showPanel('controls')],
                    enter: () => { T.siegeBase = logLen('T64'); },
                    target: () => document.querySelector('#contentSiege [data-act="break"]') || '#contentSiege',
                    allow: ['#contentSiege', '#dispPanelHouse'],
                    title: '봉쇄 돌파',
                    text: '"봉쇄 돌파 · 계엄 해제 표결"을 눌러보세요. 옆 반원 화면에서 의원들이 봉쇄선 → 입구 → 통로를 따라 자리로 들어가요. 과반에 못 미치면 계엄군이 다시 끌어냅니다 (누르면 건너뜀, 속도는 0.5× ~ 4×).',
                    task: () => logLen('T64') > (T.siegeBase || 0),
                    done: '표결이 끝났어요. 과반이 들어갔으면 계엄이 해제됩니다.',
                },
                {
                    before: [go('law', 'siege'), () => window.T64 && window.T64.setMode('obstruct'), showPanel('controls')],
                    target: () => document.querySelector('#contentSiege .t64-panel') || '#contentSiege',
                    title: '의장석 점거',
                    text: '계엄과 상관없이, 표결을 기다리는 법안을 골라 의장석을 점거할 수 있어요. 참여 의원 수 · 상대 진영 · 결속도 · 의장 경호권 · 직권상정이 성공 확률을 정하고, 성공하면 표결이 무산됩니다. 옆 반원 화면에서는 점거 의원들이 의장석으로 몰려가고, 경호권을 쓰면 경위들이 들어와 맞붙어요.',
                },
                {
                    before: [go('law', 'siege'), showPanel('controls')],
                    target: () => document.querySelector('#contentSiege .t64-fold') || '#contentSiege',
                    title: '폭력의 대가',
                    text: '점거한 정당은 지지율이 떨어지고, 다친 의원은 다음 표결 몇 번을 결석합니다(표결에서 빠지고 좌석 정보에 표시). "국회선진화법"을 켜면 직권상정이 막히고 페널티가 두 배가 돼요.',
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
                    text: () => `반원 · 지도 · 선거 결과 · 내각 화면에서 오른쪽 클릭(모바일은 길게 누르기) → "내보내기..."를 고르면 PNG · JPG · SVG 이미지로 저장합니다. 정당 통계와 국기 · 국가명 · 날짜 머리를 함께 넣을 수 있어요.${onPreviewPage() ? ` 미리보기 화면의 위키 틀 · 국가 순위 · 세력 변화${t69() ? ' · 경제 그래프' : ''}도 같은 방법으로 내보내요.` : ''}`,
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
        q('.tut-lesson').textContent = mode === 'menu' ? '튜토리얼 목차' : `#${noOf(lessonIdx)} · ${lesson.title}${lesson.locked ? ` (${lesson.locked} 미리보기)` : ''}`;
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
        setBody({ title: stepText(step, 'title'), text: stepText(step, 'text') });
        const prevBtn = q('.tut-prev');
        prevBtn.style.display = '';
        prevBtn.disabled = i === 0;
        q('.tut-toc').style.display = '';
        q('.tut-skip').textContent = '그만하기';
        q('.tut-next').style.display = '';
        q('.tut-next').textContent = i === steps.length - 1 ? `#${noOf(lessonIdx)} 마치기` : '다음';
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
    const PENDING_KEY = 'dnoTutorialStartLesson';
    function launchPreview(l) {
        try {
            sessionStorage.setItem('dnoBootPresetId', 'builtin:tutorial');
            sessionStorage.setItem('dnoBootNewSaveName', `서독 (${l.locked} 미리보기)`);
            sessionStorage.setItem(PENDING_KEY, l.id);
        } catch (e) { /* sessionStorage 없음 — 그냥 화면만 옮긴다 */ }
        stop();
        location.href = `teaser${previewPageFor(l)}.html`;
    }

    function showComplete() {
        leaveCurrent();
        layer.classList.remove('tut-nodim', 'tut-compact');
        markDone(lessonIdx);
        setMode('complete');
        layer.classList.remove('tut-is-task');
        taskDone = false;
        const nIdx = nextAvail(lessonIdx);
        const last = nIdx < 0;
        const basicDone = LESSONS[lessonIdx].group === 'basic' && lessonIdx === basicCount - 1;
        renderHead('완료');
        const nextLesson = LESSONS[nIdx];
        const nextNo = nIdx >= 0 ? noOf(nIdx) : '';
        setBody({
            title: `#${noOf(lessonIdx)} ${LESSONS[lessonIdx].title} 완료!`,
            text: last
                ? '세부 튜토리얼까지 모두 마쳤습니다. 이제 이 나라를 마음대로 바꿔보거나, 시작 화면에서 새 세이브를 만들어 나만의 나라를 꾸려보세요. 궁금한 기능은 메뉴 맨 아래 "도움말"에서 찾을 수 있어요.'
                : basicDone
                    ? `기본 튜토리얼(#1 ~ #${basicCount})을 모두 마쳤습니다! 이제 기본 흐름은 다 알아요. 이어서 세부 튜토리얼 #${nextNo} "${nextLesson.title}"부터 해보거나, 목차에서 필요한 기능만 골라 배우세요.`
                    : `다음은 #${nextNo} "${nextLesson.title}" (${nextLesson.summary})입니다.${nextLesson.locked && !onPreviewPage(nextLesson) ? ` 미리보기 기능이라 ${previewName(nextLesson)} 화면으로 옮겨 진행해요.` : ''} 바로 이어서 하거나, 나중에 목차에서 골라 할 수 있어요.`,
        });
        q('.tut-prev').style.display = 'none';
        q('.tut-toc').style.display = '';
        q('.tut-next').style.display = '';
        q('.tut-next').textContent = last ? '끝내기' : `#${nextNo} 시작 →`;
        q('.tut-skip').textContent = last ? '닫기' : '나중에';
        renderTaskState();
        requestAnimationFrame(place);
    }

    // 목차: 전체 진행 막대 · "이어서 하기" · 기본/세부 탭 · 과정 카드 (세부는 넓은 화면에서 두 줄)
    let menuTab = null; // 'basic' | 'detail' — 목차를 다시 열어도 보던 탭 유지
    function showMenu() {
        leaveCurrent();
        layer.classList.remove('tut-nodim', 'tut-compact');
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
        renderHead(`${done.size} / ${avail.length} 완료`);
        setBody({
            title: allDone ? '모든 과정을 마쳤어요' : done.size ? '이어서 배워볼까요?' : '무엇을 배워볼까요?',
            text: allDone
                ? '다시 보고 싶은 과정을 골라 언제든 복습할 수 있어요.'
                : '처음이라면 기본 튜토리얼을 순서대로 하고, 그다음 필요한 세부 튜토리얼만 골라 하세요. 과정마다 몇 단계로 짧게 끝납니다.',
            menu: true,
        });
        const menuEl = q('.tut-menu');
        const TAB_INFO = {
            basic: ['기본 튜토리얼', '처음 쓰는 분을 위한 핵심 흐름 — 순서대로 추천'],
            detail: ['세부 튜토리얼', '기능별 자세한 설명 — 필요한 것만 골라서'],
        };
        const pct = Math.round(done.size / Math.max(1, avail.length) * 100);
        menuEl.innerHTML = `
            <div class="tut-menu-bar" aria-hidden="true"><span style="width:${pct}%"></span></div>
            ${!allDone && done.size > 0 ? `<button type="button" class="tut-continue" data-lesson="${firstTodo}"><span class="tut-continue-label">이어서 하기</span><span class="tut-continue-title"></span><span class="tut-lesson-mark">›</span></button>` : ''}
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
                <button type="button" class="tut-lesson-btn tut-lesson-locked" data-lesson="${i}" aria-disabled="true" title="${LESSONS[i].locked} 업데이트에서 열립니다">
                    <span class="tut-lesson-no">🔒</span>
                    <span class="tut-lesson-main"><span class="tut-lesson-title"></span><span class="tut-lesson-sum"></span></span>
                    <span class="tut-lesson-mark"></span>
                </button>`).join('')}
            </div>`;
        menuEl.querySelectorAll('.tut-lesson-btn').forEach(btn => {
            const l = LESSONS[+btn.dataset.lesson];
            btn.querySelector('.tut-lesson-title').textContent = l.title;
            if (btn.classList.contains('tut-lesson-locked')) {
                btn.querySelector('.tut-lesson-sum').textContent = `${l.locked} 업데이트에서 열립니다`;
                return;
            }
            btn.querySelector('.tut-lesson-sum').textContent = `${l.summary} · ${l.steps.length}단계${l.locked ? ` · ${l.locked} 미리보기` : ''}`;
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
        // 본 게임에서 잠긴(미리보기) 과정을 골라 Teaser 1.6.4으로 넘어온 경우 — 그 과정을 바로 연다
        let pending = null;
        try { pending = sessionStorage.getItem(PENDING_KEY); sessionStorage.removeItem(PENDING_KEY); } catch (e) { /* 없음 */ }
        const pendingIdx = pending ? LESSONS.findIndex(l => l.id === pending) : -1;
        if (typeof lesson !== 'number' && pendingIdx >= 0 && isAvail(pendingIdx) && onPreviewPage(LESSONS[pendingIdx])) lesson = pendingIdx;
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
