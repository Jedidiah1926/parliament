// ===== DATANET PARLIAMENT SIMULATION — 도움말 그룹 =====
// 메뉴 맨 아래 회색 "도움말" 묶음(의회 · 국가 · 여론 · 내각)의 내용을 채운다.
// 각 탭이 무슨 역할을 하는지 카드로 보여주고, "열기 →"로 그 탭에 바로 간다.
// 탭 이름은 원래 버튼에서 그대로 읽어오므로 직책 이름 바꾸기(대통령 → 국왕 등)나 언어 전환도 따라간다.
(function () {
    'use strict';

    const go = (main, sub) => () => { if (typeof switchSubTab === 'function') switchSubTab(main, sub); };
    const goElec = sub => () => {
        if (typeof switchMainTab === 'function') switchMainTab('election');
        if (typeof elecSwitchSub === 'function') elecSwitchSub(sub);
    };

    // btn: 원래 탭 버튼 id (이름·숨김 여부를 여기서 읽음), suffix: 이름 뒤에 붙일 설명, inner: [안쪽 탭 이름, 설명]
    const PAGES = {
        setup: {
            intro: '의회를 이루는 정당 · 의석 · 의원 · 연정을 다룹니다.',
            tabs: [
                {
                    btn: 'subTabParty', open: go('setup', 'party'),
                    desc: '나라의 정당을 만들고 꾸밉니다.',
                    inner: [
                        ['이념', '정당이 속할 이념을 추가하고 순서를 정합니다. 자동 정렬일 때 정당은 이 순서대로 반원에 앉아요.'],
                        ['정보', '정당 추가 · 복제 · 삭제, 이름 · 약칭 · 색 · 이념 · 상태, 소속 의회, 파벌, 합당(흡수합당 · 신설합당).'],
                        ['당수', '정당 대표와 파벌 대표의 이름 · 사진. 의원내각제에선 다수당 당수가 자동으로 총리가 됩니다.'],
                    ],
                },
                {
                    btn: 'subTabSettings', open: go('setup', 'settings'),
                    desc: '의회별 이름과 총 의석 수, 정당마다 몇 석인지 정합니다. "배정 합계"는 총 의석 수를 넘을 수 없어요.',
                    inner: [['하원 · 상원 · 삼원', '원마다 따로 정합니다. 상원 · 삼원은 국가 › 설정에서 양원제 · 삼원제를 골랐을 때 나타나요.']],
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
            ],
        },
        nation: {
            intro: '나라 전체의 설정과 입법 · 선거 · 기록을 다룹니다.',
            tabs: [
                {
                    btn: 'subTabConfig', open: go('nation', 'config'),
                    desc: '나라의 기본 틀을 정합니다.',
                    inner: [
                        ['의회', '단원제 · 양원제 · 삼원제, 의장단(의장 · 부의장), 지역구 표시 방식(지도 · 그리드), 집권 세력 강조.'],
                        ['상징', '국가명 · 국기, 반원 가운데에 의석 수 또는 의회 로고 표시.'],
                        ['날짜', '화면 오른쪽 위에 보이는 현재 날짜와 회기, 표시 방식.'],
                        ['저장', '자동저장 주기, 이름 붙여 저장 · 불러오기, 파일(.json)로 저장 · 불러오기, 초기화.'],
                    ],
                },
                {
                    btn: 'subTabLegislation', open: go('nation', 'legislation'),
                    desc: '법안을 만들고 통과시키는 과정입니다.',
                    inner: [
                        ['제출', '새 법안 작성(제목 · 내용 · 태그 · 가결 기준), 기존 법안 수정과 개정안.'],
                        ['상정', '법안을 의회 또는 국무회의에 올립니다. 검색 · 태그로 찾을 수 있어요.'],
                        ['표결', '정당별 · 의원별 찬반 표결. 거부권이 있으면 통과된 법안을 거부할 수 있습니다.'],
                        ['국무회의', '내각이 의결하는 법안의 표결과 의결 정족수.'],
                    ],
                },
                {
                    btn: 'subTabElection', open: go('nation', 'election'),
                    desc: '선거를 치르고 개표합니다. 결과는 여론 탭의 지지율 · 성향을 바탕으로 정해져요.',
                    inner: [
                        ['대선', '대통령(총리직선제면 총리) 선거 개표.'],
                        ['총선', '의회 선거 — 비례 · 지역구 · 전체 방식, 궐석 지역구만 다시 뽑는 보궐선거, 개표 속도.'],
                        ['설정', '대선 방식(단순 다수 · 결선투표 · 선거인단), 지지율을 가져올 기준 원, 후보.'],
                    ],
                },
                {
                    btn: 'subTabRecord', open: go('nation', 'record'),
                    desc: '지나간 일을 모아 둡니다.',
                    inner: [
                        ['입법', '가결 · 부결 · 거부된 법안 보관함 (상태별로 걸러 보기).'],
                        ['선거', '지난 선거 결과.'],
                    ],
                },
                {
                    btn: 'subTabFraud', open: go('nation', 'fraud'), suffix: ' (부정선거)',
                    desc: '정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각되면 그 정당은 활동 금지 처분을 받아요.',
                },
            ],
        },
        election: {
            intro: '선거 결과를 좌우하는 지역구 · 성향 · 지지율을 정합니다. 여기서 정한 값으로 국가 › 선거에서 개표해요.',
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
            const src = document.getElementById(tab.btn);
            const hidden = isHidden(src);
            const card = document.createElement('div');
            card.className = 'help-card' + (hidden ? ' is-hidden' : '');
            card.innerHTML = `
                <div class="help-card-head">
                    <span class="help-card-path"></span>
                    <span class="help-card-title"></span>
                    <button type="button" class="help-open">열기 →</button>
                </div>
                <p class="help-desc"></p>`;
            card.querySelector('.help-card-path').textContent = groupLabel(key).replace(/^\S+\s+/, '') + ' ›';
            card.querySelector('.help-card-title').textContent = (src ? src.textContent.trim() : tab.btn) + (tab.suffix || '');
            card.querySelector('.help-desc').textContent = tab.desc + (hidden ? ' (지금 설정에선 숨겨져 있어요)' : '');
            const openBtn = card.querySelector('.help-open');
            openBtn.disabled = hidden;
            openBtn.addEventListener('click', () => {
                tab.open();
                if (typeof setMobilePanel === 'function' && document.documentElement.getAttribute('data-ui-mode') === 'mobile') setMobilePanel('controls');
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
