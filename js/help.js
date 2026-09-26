// ===== DATANET PARLIAMENT SIMULATION — 도움말 그룹 =====
// 메뉴 맨 아래 회색 "도움말" 묶음(의회 · 국가 · 선거 · 여론 · 내각)의 내용을 채운다.
// 각 탭이 무슨 역할을 하는지 카드로 보여주고, "열기 →"로 그 탭에 바로 간다.
// 탭 이름은 원래 버튼에서 그대로 읽어오므로 직책 이름 바꾸기(대통령 → 국왕 등)나 언어 전환도 따라간다.
(function () {
    'use strict';

    const go = (main, sub) => () => { if (typeof switchSubTab === 'function') switchSubTab(main, sub); };
    const goElec = sub => () => {
        if (typeof switchMainTab === 'function') switchMainTab('election');
        if (typeof elecSwitchSub === 'function') elecSwitchSub(sub);
    };
    const isMobile = () => document.documentElement.getAttribute('data-ui-mode') === 'mobile';
    const showPanel = which => { if (isMobile() && typeof setMobilePanel === 'function') setMobilePanel(which); };
    // 시각(오른쪽 화면) 탭 열기 — 모바일에선 의석 화면으로 넘어간다
    const disp = (tab, before) => () => {
        if (before) before();
        if (typeof switchDispTab === 'function') switchDispTab(tab);
        showPanel('display');
    };

    // btn: 원래 탭 버튼 id (이름·숨김 여부를 여기서 읽음) — 없으면 title을 그대로 씀
    // suffix: 이름 뒤에 붙일 설명, inner: [안쪽 탭 이름, 설명], open: "열기 →"로 할 일 (없으면 버튼 숨김)
    // path: 카드 머리의 위치 표시 (없으면 페이지의 path, 그것도 없으면 메뉴 묶음 이름)
    // hiddenNote: 원래 탭이 지금 숨겨져 있을 때 붙일 안내, openWhenHidden: 숨겨져 있어도 "열기"로 나타나게 할 수 있음
    const PAGES = {
        setup: {
            intro: '의회를 이루는 이념 · 정당 · 의석 · 의원 · 집권 세력과 의회 자체의 설정을 다룹니다.',
            tabs: [
                {
                    btn: 'subTabIdeology', open: go('setup', 'ideology'),
                    desc: '정당이 속할 이념을 추가하고 순서를 정합니다. 자동 정렬일 때 정당은 이 순서대로 반원에 앉아요.',
                },
                {
                    btn: 'subTabParty', open: go('setup', 'party'),
                    desc: '나라의 정당을 만들고 꾸밉니다.',
                    inner: [
                        ['정보', '정당 추가 · 복제 · 삭제, 이름 · 약칭 · 색 · 이념 · 상태, 소속 의회, 파벌, 합당(흡수합당 · 신설합당).'],
                        ['당수', '정당 대표와 파벌 대표의 이름 · 사진. 의원내각제에선 다수당 당수가 자동으로 총리가 됩니다.'],
                    ],
                },
                {
                    btn: 'subTabSettings', open: go('setup', 'settings'),
                    desc: '의회별 이름과 총 의석 수, 정당마다 몇 석인지 정합니다. "배정 합계"는 총 의석 수를 넘을 수 없어요.',
                    inner: [['하원 · 상원 · 삼원', '원마다 따로 정합니다. 상원 · 삼원은 의회 › 의회 설정에서 양원제 · 삼원제를 골랐을 때 나타나요.']],
                },
                {
                    btn: 'subTabMembers', open: go('setup', 'members'),
                    desc: '지역구에서 당선된 의원 명단입니다. 이름 · 사진을 채우고, 궐석(빈자리)으로 처리하면 보궐선거를 치를 수 있어요. 지역구 선거를 치른 뒤에 채워집니다.',
                },
                {
                    btn: 'subTabList', open: go('setup', 'list'),
                    desc: '비례대표 의원 명단입니다. 자리마다 소속 정당 · 이름 · 사진을 정하고, 그 의원을 당수로 지정할 수 있어요.',
                },
                {
                    btn: 'subTabCoalition', open: go('setup', 'coalition'),
                    desc: '정당들을 묶어 연립정부를 만듭니다. 집권 연정(★) · 대표당 · 각외협력 정당을 정하고, 단독 집권이나 무집권 상태로 둘 수도 있어요. 집권 세력은 반원에서 금색 테두리로 표시됩니다.',
                },
                {
                    btn: 'subTabAssembly', open: go('setup', 'assembly'),
                    desc: '단원제 · 양원제 · 삼원제, 의장단(의장 · 부의장), 지역구 표시 방식(지도 · 그리드), 집권 세력 강조.',
                },
            ],
        },
        law: {
            intro: '법안을 만들고 통과시키는 과정입니다.',
            tabs: [
                {
                    btn: 'subTabBill', open: go('law', 'bill'),
                    desc: '새 법안 작성(제목 · 내용 · 태그 · 가결 기준), 기존 법안 수정과 개정안.',
                },
                {
                    btn: 'subTabTable', open: go('law', 'table'),
                    desc: '법안을 의회 또는 국무회의에 올립니다. 검색 · 태그로 찾을 수 있어요.',
                },
                {
                    btn: 'subTabVote', open: go('law', 'vote'),
                    desc: '정당별 · 의원별 찬반 표결. 거부권이 있으면 통과된 법안을 거부할 수 있습니다.',
                },
                {
                    btn: 'subTabArchive', open: go('law', 'archive'),
                    desc: '가결 · 부결 · 거부된 법안 보관함입니다 (상태별로 걸러 보기). 선거 기록은 선거 › 기록에 있어요.',
                },
            ],
        },
        nation: {
            intro: '나라의 기본 틀을 정합니다.',
            tabs: [
                {
                    btn: 'subTabSymbol', open: go('nation', 'symbol'),
                    desc: '국가명 · 국기, 반원 가운데에 의석 수 또는 의회 로고 표시.',
                },
                {
                    btn: 'subTabDate', open: go('nation', 'date'),
                    desc: '화면 오른쪽 위에 보이는 현재 날짜와 회기, 표시 방식.',
                },
                {
                    btn: 'subTabSave', open: go('nation', 'save'),
                    desc: '자동저장 주기, 이름 붙여 저장 · 불러오기, 파일(.json)로 저장 · 불러오기, 초기화.',
                },
            ],
        },
        vote: {
            intro: '선거를 치르고 개표합니다. 결과는 여론 탭의 지지율 · 성향을 바탕으로 정해져요.',
            tabs: [
                {
                    btn: 'subTabElecPresidential', open: go('vote', 'elecPresidential'),
                    desc: '대통령(총리직선제면 총리) 선거 개표.',
                },
                {
                    btn: 'subTabElecGeneral', open: go('vote', 'elecGeneral'),
                    desc: '의회 선거 — 비례 · 지역구 · 전체 방식, 궐석 지역구만 다시 뽑는 보궐선거, 개표 속도.',
                },
                {
                    btn: 'subTabElecSettings', open: go('vote', 'elecSettings'),
                    desc: '대선 방식(단순 다수 · 결선투표 · 선거인단), 지지율을 가져올 기준 원, 후보.',
                },
                {
                    btn: 'subTabElecRecord', open: go('vote', 'elecRecord'),
                    desc: '지난 선거 결과.',
                },
                {
                    btn: 'subTabFraud', open: go('vote', 'fraud'), suffix: ' (부정선거)',
                    desc: '정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각되면 그 정당은 활동 금지 처분을 받아요.',
                },
            ],
        },
        election: {
            intro: '선거 결과를 좌우하는 지역구 · 성향 · 지지율을 정합니다. 여기서 정한 값으로 선거 탭에서 개표해요.',
            tabs: [
                {
                    btn: 'elecSubTabDistrict', open: goElec('district'),
                    desc: '지역구를 만들고 원별 의석 수를 정합니다. 맵 메이커에서 만든 지도(.jsx)를 올리면 실제 지도 모양의 지역구를 쓸 수 있어요.',
                },
                {
                    btn: 'elecSubTabTendency', open: goElec('tendency'),
                    desc: '지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 어느 정당이 이길지가 여기서 갈려요.',
                },
                {
                    btn: 'elecSubTabRegion', open: goElec('region'),
                    desc: '권역형 비례대표를 쓸 때 지역구를 권역으로 묶습니다. 권역 득표율은 지역구 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다.',
                },
                {
                    btn: 'elecSubTabProb', open: goElec('prob'),
                    desc: '정당별 지지율(%)과 오차 범위를 정합니다. 비례대표 의석과 대선 결과의 바탕이 되고, 선거를 치르려면 꼭 필요해요. 전국형 · 권역형 비례를 고를 수 있습니다.',
                },
            ],
        },
        cabinet: {
            intro: '정부를 이끄는 사람들과 그 권한을 다룹니다. 의석 화면의 "내각" 탭에 한눈에 보여요.',
            tabs: [
                {
                    btn: 'subTabSystem', open: go('cabinet', 'system'),
                    desc: '정부 형태(대통령제 · 이원집정부제 · 의원내각제 · 입헌군주제 · 집단지도체제)와 직책 이름, 그리고 법안 거부권 · 비상사태 · 의회 해산 · 계엄령 권한을 누가 가질지 정합니다. 의회 해산은 의회 전체 또는 한 원(예: 하원)만 고를 수 있어요.',
                },
                {
                    btn: 'subTabPresident', open: go('cabinet', 'president'),
                    desc: '대통령의 이름 · 사진 · 소속 정당. 의원에서 불러오면 그 의원 정보와 연결돼 함께 바뀝니다.',
                },
                {
                    btn: 'subTabPm', open: go('cabinet', 'pm'),
                    desc: '총리 선출 방식(다수당 대표 자동 · 총리직선제), 현재 총리 고정, 부총리, 내각 불신임안 발의. 건설적 불신임제(독일 · 이스라엘식)를 켜면 불신임안에 후임을 함께 지명하고, 가결되면 그 후임이 바로 총리가 됩니다.',
                },
                {
                    btn: 'subTabCabinetmembers', open: go('cabinet', 'cabinetmembers'),
                    desc: '장관 · 국무위원을 추가하고 직책 · 이름 · 사진 · 소속 정당을 정합니다.',
                },
                {
                    btn: 'subTabCouncil', open: go('cabinet', 'council'),
                    desc: '내각이 의결하는 법안의 표결과 의결 정족수. 계엄령으로 의회가 정지된 동안에는 여기서 법안을 통과시킵니다.',
                },
            ],
        },
        layout: {
            intro: '화면 맨 위의 세이브 탭 바와 왼쪽 메뉴(사이드바) 쓰는 법입니다.',
            tabs: [
                {
                    path: '맨 위', title: '⌂ 집 아이콘',
                    desc: '탭 바 맨 왼쪽. 누르면 지금 상태를 바로 저장한 뒤 메인 화면(시작 화면)으로 돌아갑니다.',
                },
                {
                    path: '맨 위', title: '세이브 탭',
                    desc: '탭 하나하나가 세이브(나라 하나)입니다. 누르면 확인창 없이 그 세이브로 바로 바뀌고, 진행 상황은 세이브마다 따로 자동저장돼요.',
                    inner: [
                        ['새 의회 (1)', '맨 앞의 기본 자동저장 — 어느 세이브에도 속하지 않은 작업을 담아 두어 기존 데이터가 사라지지 않게 합니다.'],
                        ['이름 바꾸기', '탭 이름을 더블클릭 (또는 국가 › 저장의 ✎).'],
                        ['×', '그 세이브 삭제 (확인 후).'],
                    ],
                },
                {
                    path: '맨 위', title: '+ 새 세이브',
                    desc: '새 세이브를 만듭니다.',
                    inner: [
                        ['새로 생성', '아무것도 없는 기본 상태에서 새로 시작 — 지금 화면은 복사되지 않아요.'],
                        ['프리셋에서 생성', '튜토리얼 공화국처럼 미리 준비된 나라의 복사본으로 시작.'],
                    ],
                },
                {
                    path: '왼쪽', title: '메뉴 묶음과 항목',
                    desc: '의회 · 입법 · 국가 · 선거 · 여론 · 내각 · 도움말 일곱 묶음과 그 안의 항목. 항목을 누르면 그 기능 화면이 열리고, 묶음 제목을 누르면 접히거나 펼쳐집니다 (다음에 열어도 그대로 기억).',
                },
                {
                    path: '왼쪽', title: '사이드바 접기',
                    desc: '사이드바 머리 오른쪽의 접기 버튼으로 아이콘만 남기고 접어 편집 화면을 넓게 쓸 수 있어요. 접힌 상태에선 아이콘을 누르면 그 묶음으로 바로 이동합니다.',
                },
                {
                    path: '가운데', title: '편집 패널 머리 · 폭 조절',
                    desc: '편집 패널 맨 위에는 라이트/다크에선 지금 위치(묶음 › 항목), 네온에선 "MINISTRY OF INTERIOR" 띠와 국가명이 보입니다. 편집 패널과 시각 화면 사이 경계를 끌면 폭을 바꿀 수 있고, 더블클릭하면 기본 폭으로 돌아가요.',
                },
                {
                    path: '공통', title: '실행 버튼과 단축키',
                    desc: '설정을 바꾼 뒤 "PROTOCOL EXECUTE"(실행)를 누르면 시각 화면이 새로 그려집니다.',
                    inner: [
                        ['Enter', '입력 칸 밖에서 누르면 실행.'],
                        ['Ctrl+S', '바로 저장.'],
                        ['Ctrl+Z', '되돌리기 (Ctrl+Shift+Z로 다시 실행).'],
                        ['Esc', '열려 있는 확인 · 안내 · 내보내기 창 닫기.'],
                    ],
                },
                {
                    path: '모바일', title: '모바일 화면 모드',
                    desc: '메인 메뉴 › 설정의 화면 모드(UI MODE)에서 모바일을 고르면 사이드바 대신 화면 아래 탭 바(묶음 + 의석)와 떠 있는 실행 버튼을 씁니다. 세부 항목은 위쪽 칩 줄에서 고르고, "의석"을 누르면 시각 화면으로 넘어가요.',
                },
            ],
        },
        visual: {
            intro: '화면 오른쪽(모바일은 "의석")의 시각 탭 — 설정한 내용이 그림으로 보이는 곳입니다.',
            path: '시각',
            tabs: [
                {
                    btn: 'dispTabHouse', open: disp('house'),
                    desc: '하원(첫 번째 의회)의 의석을 반원으로 보여줍니다. 위쪽 "반원 / 지역구"로 지역구 지도 보기로 바꿀 수 있고, 아래에는 여당 · 야당별 정당 카드(의석 수 · 비율 · 파벌)와 원외정당, 의장단이 나와요.',
                },
                {
                    btn: 'dispTabSenate', open: disp('senate'), hiddenNote: '양원제 · 삼원제일 때 나타나요',
                    desc: '상원(두 번째 의회)의 의석. 보는 법은 하원과 같습니다.',
                },
                {
                    btn: 'dispTabThird', open: disp('third'), hiddenNote: '삼원제일 때 나타나요',
                    desc: '삼원(세 번째 의회)의 의석.',
                },
                {
                    btn: 'dispTabCabinet', open: disp('cabinet'),
                    desc: '대통령 · 총리 · 부총리 · 국무위원 등 정부 구성원을 카드로 한눈에 보여줍니다. 내각 묶음에서 정한 내용이 여기 반영돼요.',
                },
                {
                    btn: 'dispTabDistrict', open: () => { goElec('district')(); showPanel('display'); }, openWhenHidden: true,
                    desc: '지역구 지도. 여론 › 지역구를 열면 나타나고, 지역구를 눌러 편집할 수 있어요. 탭의 ×로 닫습니다.',
                },
                {
                    btn: 'dispTabTendency', open: () => { goElec('tendency')(); showPanel('display'); }, openWhenHidden: true,
                    desc: '정당별 성향 지도. 여론 › 성향을 열면 나타나며, 지역구마다 어느 정당 쪽인지 색으로 보여요.',
                },
                {
                    btn: 'dispTabRegion', open: () => { goElec('region')(); showPanel('display'); }, openWhenHidden: true,
                    desc: '권역 지도. 여론 › 권역을 열면 나타나고, 지역구를 칠해 권역으로 묶습니다.',
                },
                {
                    btn: 'dispTabElecResultHouse', title: '선거결과', open: disp('elecResultHouse'), hiddenNote: '총선을 개표하면 원마다 생겨요',
                    desc: '총선 개표 화면과 결과. 개표가 진행되는 모습, 정당별 득표와 직전 대비 의석 변동(▲/▼)을 보여주고, 결과를 확인한 뒤 선거 › 총선의 "✔ 의회에 반영"을 누르면 그 결과대로 의석이 바뀝니다.',
                },
                {
                    title: '날짜 · 회기', open: () => { go('nation', 'date')(); showPanel('controls'); },
                    desc: '시각 화면 오른쪽 위에 보이는 현재 날짜와 회기. 국가 › 날짜에서 정합니다 ("열기"로 이동).',
                },
                {
                    title: '좌석 정보 · 이미지 내보내기',
                    desc: '좌석(점)을 누르면 그 자리의 정당 · 의원 정보 카드가 뜹니다. 반원 · 지도 · 선거 결과 · 내각 화면에서 오른쪽 클릭(모바일은 길게 누르기) → "내보내기..."를 고르면 이미지로 저장할 수 있어요.',
                },
            ],
        },
    };

    const isHidden = el => !el || el.hidden || getComputedStyle(el).display === 'none';
    const groupLabel = key => {
        const b = document.getElementById('mainTab' + key.charAt(0).toUpperCase() + key.slice(1));
        return b ? b.textContent.replace(/\s+/g, ' ').trim() : key;
    };

    function render(key) {
        const host = document.querySelector(`.help-page[data-help="${key}"]`);
        const page = PAGES[key];
        if (!host || !page) return;
        host.innerHTML = '';
        const intro = document.createElement('p');
        intro.className = 'help-intro';
        intro.textContent = page.intro;
        host.appendChild(intro);
        page.tabs.forEach(tab => {
            const src = tab.btn ? document.getElementById(tab.btn) : null;
            const hidden = !!tab.btn && isHidden(src);
            const card = document.createElement('div');
            card.className = 'help-card' + (hidden && !tab.openWhenHidden ? ' is-hidden' : '');
            card.innerHTML = `
                <div class="help-card-head">
                    <span class="help-card-path"></span>
                    <span class="help-card-title"></span>
                    <button type="button" class="help-open">열기 →</button>
                </div>
                <p class="help-desc"></p>`;
            card.querySelector('.help-card-path').textContent = (tab.path || page.path || groupLabel(key).replace(/^\S+\s+/, '')) + ' ›';
            const srcLabel = src ? (src.querySelector('.disp-tab-label') || src).textContent.trim() : '';
            card.querySelector('.help-card-title').textContent = (tab.title || srcLabel || tab.btn) + (tab.suffix || '');
            card.querySelector('.help-desc').textContent = tab.desc + (hidden && !tab.openWhenHidden ? ` (${tab.hiddenNote || '지금 설정에선 숨겨져 있어요'})` : '');
            const openBtn = card.querySelector('.help-open');
            if (!tab.open) openBtn.style.display = 'none';
            openBtn.disabled = hidden && !tab.openWhenHidden;
            openBtn.addEventListener('click', () => {
                if (!tab.open) return;
                showPanel('controls'); // 편집 화면 쪽 탭이 기본 — 시각 탭은 open 안에서 의석 화면으로 넘어간다
                tab.open();
                window.scrollTo({ top: 0 });
            });
            if (tab.inner && tab.inner.length) {
                const dl = document.createElement('dl');
                dl.className = 'help-inner';
                tab.inner.forEach(([name, text]) => {
                    const dt = document.createElement('dt'); dt.textContent = name;
                    const dd = document.createElement('dd'); dd.textContent = text;
                    dl.append(dt, dd);
                });
                card.appendChild(dl);
            }
            host.appendChild(card);
        });
    }

    function renderActive() {
        const active = document.querySelector('.help-page.active');
        if (active) render(active.dataset.help);
    }

    function init() {
        const pages = document.querySelectorAll('.help-page');
        if (!pages.length) return;
        Object.keys(PAGES).forEach(render);
        // 도움말 페이지가 열릴 때마다 다시 그려 탭 이름(직책 이름 바꾸기 · 언어 전환)과 숨김 상태를 따라간다
        const mo = new MutationObserver(renderActive);
        pages.forEach(p => mo.observe(p, { attributes: true, attributeFilter: ['class'] }));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.DnoHelp = { render, pages: Object.keys(PAGES) };
})();
