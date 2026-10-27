// ===== Hemicycle — 도움말 그룹 =====
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
            intro: '의회 자체의 설정과 의회를 이루는 이념 · 정당 · 의석 · 집권 세력 · 의원을 다룹니다.',
            tabs: [
                {
                    btn: 'subTabAssembly', open: go('setup', 'assembly'),
                    desc: '의장단(의장 · 부의장), 원별 반원 가운데 표시(의석 수 · 의회 로고 · 의장석), 집권 세력 강조. 단원제 · 양원제 · 삼원제는 의석 · 원 구성에서 골라요.',
                },
                {
                    btn: 'subTabIdeology', open: go('setup', 'ideology'),
                    desc: '정당이 속할 이념을 추가하고 순서를 정합니다. 자동 정렬일 때 정당은 이 순서대로 반원에 앉아요.',
                    inner: [['무소속 "사용"', '끄면 무소속이 모든 원에서 빠집니다 (선거 · 지지율 · 의석에 나오지 않음). 다시 켜면 끄기 전대로 돌아와요. 무소속 의석이 남아 있으면 먼저 0으로 만들어야 끌 수 있습니다.']],
                },
                {
                    btn: 'subTabParty', open: go('setup', 'party'),
                    desc: '나라의 정당을 만들고 꾸밉니다.',
                    inner: [
                        ['정보', '정당 추가 · 복제 · 삭제, 이름 · 약칭 · 색 · 이념 · 상태, 소속 의회, 파벌, 합당(흡수합당 · 신설합당).'],
                        ['당수', '정당 대표와 파벌 대표의 이름 · 사진. 의원내각제에선 다수당 당수가 자동으로 총리가 됩니다.'],
                        ['로고', '정당 · 파벌 로고를 올리고 지웁니다 (정사각형 권장). 의석 · 원 구성 카드의 로고는 보기만 하고, 누르면 여기로 와요. 통계 카드에 로고를 쓸지는 정보 탭의 "통계 표시"에서 고릅니다.'],
                    ],
                },
                {
                    btn: 'subTabSettings', open: go('setup', 'settings'),
                    desc: '원 구성(단원제 · 양원제 · 삼원제)과 의회별 이름 · 총 의석 수, 정당마다 몇 석인지 정합니다. "배정 합계"는 총 의석 수를 넘을 수 없어요.',
                    inner: [['하원 · 상원 · 삼원', '원마다 따로 정합니다. 상원 · 삼원은 이 탭 위쪽 원 구성에서 양원제 · 삼원제를 골랐을 때 나타나요.']],
                },
                {
                    btn: 'subTabCoalition', open: go('setup', 'coalition'),
                    desc: '정당들을 묶어 연립정부를 만듭니다. 집권 연정(★) · 대표당 · 각외협력 정당을 정하고, 단독 집권이나 무집권 상태로 둘 수도 있어요. 집권 세력은 반원에서 금색 테두리로 표시됩니다.',
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
                    btn: 'subTabTimeline', open: go('setup', 'timeline'),
                    desc: '세력 변화 — 정당 의석을 시점마다 기록해 오른쪽 "세력 변화" 시각 탭에 정당 역사 도표로 그립니다 (의석 띠 · 점유율 · ▲▼ · 정당별 흐름, 창당 · 당명 변경 · 합당 · 분당 계보도). 총선을 의회에 반영하면 자동으로 기록되고, "지금 기록하기"로 직접 남기거나 선거 기록에서 가져올 수 있어요.',
                    inner: [['정당 승계', '같은 정당의 당명 · 색 바꾸기(예: 한나라당 → 새누리당), 서로 다른 정당을 앞 → 뒤로 잇기(후신 · 합당 · 분당).']],
                },
                {
                    btn: 'subTabWikibox', open: go('setup', 'wikibox'),
                    desc: '위키 틀 — 위키 문서의 "원내 구성" 틀처럼 여당 · 야당 정당을 의석과 함께 모은 틀을 오른쪽 시각 화면에 그립니다. 원내 · 원외 전환, 나무위키 문법으로 복사, 반원 그림 저장.',
                },
            ],
        },
        law: {
            intro: '법안을 만들고 통과시키는 과정입니다. 메뉴 위의 단계 막대(제출 › 위원회 › 본회의 › 서명 › 기록 › 법령)에 단계마다 법안 수가 보이고, 누르면 그 탭으로 갑니다 (서명은 내각 › 서명).',
            tabs: [
                {
                    btn: 'subTabBill', open: go('law', 'bill'),
                    desc: '새 법안 작성 — 종류(법률안 · 헌법 개정안), 제목, 조문(제1조 · 제2조 … 조 단위로 쓰고 순서를 바꿈), 태그, 가결 기준. 기존 법안 수정과 개정안도 여기서.',
                    inner: [['헌법 개정안', '고르면 지금 헌법 조문이 채워지고 가결 기준이 2/3로 바뀝니다. 가결되면 그 조문이 새 헌법이 돼요.']],
                },
                {
                    btn: 'subTabCommittee', open: go('law', 'committee'),
                    desc: '상임위원회 — 법안을 본회의 전에 먼저 심사합니다. 위원은 그 원의 정당 의석 비율대로 배정되고, 정당마다 찬성 · 반대 · 기권을 골라 "심사 확정"을 누르면 위원 과반 찬성일 때 본회의로, 부결이면 폐기돼요.',
                    inner: [
                        ['기본 위원회', '법제사법 · 기획재정 · 외교통일 · 국방 · 행정안전 · 교육 · 보건복지 · 환경노동 8개를 한 번에 만듭니다.'],
                        ['소관 태그', '법안 태그가 위원회 소관 태그와 겹치면 그 위원회로 자동 지정됩니다 (상정 탭에서 바꾸거나 "없음"으로 바로 본회의).'],
                    ],
                },
                {
                    btn: 'subTabTable', open: go('law', 'table'),
                    desc: '법안을 의회 또는 국무회의에 올리고, 의회로 올릴 법안은 소관 위원회를 고릅니다. 위원회 심사가 끝나야 "심의 선택"이 열려요. 검색 · 태그로 찾을 수 있습니다.',
                },
                {
                    btn: 'subTabVote', open: go('law', 'vote'),
                    desc: '정당별 · 의원별 찬반 표결. 의회를 통과한 법안의 서명 · 거부권 행사는 내각 › 서명에서 합니다.',
                },
                {
                    btn: 'subTabSiege', open: go('law', 'siege'),
                    desc: '국회공성전 — 의원들이 몸으로 표결을 지키거나 막는 상황입니다. 결과마다 오른쪽 하원 반원 위에서 의원들이 움직이는 애니메이션이 나와요 (켜고 끄기 · 0.5× ~ 4× 속도).',
                    inner: [
                        ['계엄 중 봉쇄 돌파', '계엄군 · 경찰이 국회를 막은 동안, 정당마다 참여율을 정하면 의원 한 명씩 봉쇄를 뚫는지 굴려 봅니다. 들어간 의원만 계엄 해제 결의안을 표결하고(재적 과반이면 해제), 반대 정당은 입구를 막을 수 있어요.'],
                        ['물리적 의사 방해', '반대하는 법안의 표결을 막으려 의장석을 점거합니다. 참여 의원 수 · 결속도 · 의장 경호권 · 직권상정 · 국회선진화법으로 성공 확률이 정해지고, 성공하면 표결이 무산돼요. 폭력을 쓴 정당은 지지율이 깎이고 다친 의원은 몇 번 결석합니다.'],
                    ],
                },
                {
                    btn: 'subTabArchive', open: go('law', 'archive'),
                    desc: '가결 · 부결 · 거부된 법안 보관함입니다 (상태별로 걸러 보기). 위쪽 칩에서 원(하원 · 상원 …)이나 위원회를 고르면 그곳의 본회의 표결 · 위원회 심사 기록을 하나씩 봅니다. 선거 기록은 선거 › 선거 기록에 있어요.',
                },
                {
                    btn: 'subTabLawbook', open: go('law', 'lawbook'),
                    desc: '법령집 — 가결된 법률을 조문 그대로 모아 봅니다. 법률은 개정 계보마다 가장 최근 판이 보이고(제정 · 개정 횟수), 여기서 개정안을 낼 수 있어요.',
                },
                {
                    btn: 'subTabConstitution', open: go('law', 'constitution'),
                    desc: '헌법 — "헌법 제정하기"로 처음 만들고, "직접 편집"(표결 없이 바로) 또는 "개정안 발의"(표결을 거쳐, 가결 기준 2/3)로 고칩니다. 개정 이력이 남아요.',
                },
            ],
        },
        nation: {
            intro: '나라의 기본 틀 — 상징 · 지역(지역구) · 권역을 정합니다.',
            tabs: [
                {
                    btn: 'subTabSymbol', open: go('nation', 'symbol'),
                    desc: '국가명과 국기.',
                },
                {
                    btn: 'subTabTerritory', open: go('nation', 'territory'),
                    desc: '지역구를 만들고 원별 의석 수 · 인구를 정합니다. 맵 메이커에서 만든 지도(.jsx)를 올리면 실제 지도 모양의 지역구를 쓸 수 있어요. (1.5.9까지는 여론 › 지역구)',
                },
                {
                    btn: 'subTabRegions', open: go('nation', 'regions'),
                    desc: '지역구를 권역으로 묶습니다 — 권역형 비례대표 · 지방선거 권역 단체장의 단위. 권역 득표율은 지역구 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다. (1.5.9까지는 여론 › 권역)',
                },
                {
                    btn: 'subTabPeople', open: go('nation', 'people'),
                    desc: '사람 — 인물(이름 · 사진 · 이념 · 정당 · 파벌 · 메모)을 미리 만들어 두고 자리에 배정합니다. 이름 · 사진을 고치면 배정된 모든 자리에 반영되고, 선거 · 당적 변경으로 자리가 사라져도 인물은 남아요.',
                    inner: [
                        ['모든 자리에서 가져오기', '의원 · 당수 · 원내대표 · 파벌 대표 · 의장단 · 대통령(국왕) · 내각 · 지방 단체장 · 왕가 주장자처럼 이름이 적힌 자리에서 인물을 만들고 연결합니다 (같은 이름은 한 사람).'],
                        ['지역구 후보', '선거 전에 인물을 지역구 후보로 내세우면, 총선 · 보궐선거에서 그 정당이 이긴 의석에 바로 배정돼요.'],
                        ['시민 · 이민자', '지역구 인구를 시민과 이민자로 나눕니다 (국가 › 지역의 "시민 / 인구"). 이민자 투표권은 선거 › 방식, 이민자 성향은 여론 › 종합.'],
                    ],
                },
                {
                    btn: 'dispDateSettingsBtn', title: '날짜 · 회기 설정', open: () => { showPanel('display'); if(typeof openDatePanel === 'function') openDatePanel(); },
                    path: '시각',
                    desc: '날짜 줄의 ⚙로 여는 창. 연호(선택) · 연 · 월 · 일, 회기의 대수 · 이름 · 회기 번호 · 지금 회기 종류, 그리고 자동 진행(정기회 시작일이 지나면 정기회로 · 하원 총선 반영 시 대수 +1).',
                },
                {
                    btn: 'subTabNationSettings', open: go('nation', 'nationSettings'),
                    desc: '지도 위 글씨 · 배지 크기.',
                },
                {
                    btn: 'saveTabSaveBtn', title: '저장', open: () => { if(typeof openSavePanel === 'function') openSavePanel(); },
                    path: '맨 위',
                    desc: '탭 바 오른쪽 끝 "저장" 버튼으로 여는 창. 지금 저장(Ctrl+S), 자동저장과 주기, 세이브 목록(즐겨찾기 · 이름 바꾸기 · 삭제), 다른 이름으로 저장(사본), 파일(.hemi)로 저장 · 불러오기(새 탭으로 열림). 자동저장을 끄면 저장하지 않은 변경사항을 ↺로 되돌릴 수 있어요.',
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
                    desc: '의회 선거 — 비례 · 지역구 · 혼합 방식, 자동 · 선택 개표, 궐석 지역구만 다시 뽑는 보궐선거, 개표 속도. 개표가 끝나면 "✔ 의회에 반영"을 눌러야 의석이 바뀝니다.',
                },
                {
                    btn: 'subTabElecSettings', open: go('vote', 'elecSettings'),
                    desc: '대선 · 총리 선거 방식(단순 다수 · 결선투표 · 선거인단)과 지지율을 가져올 기준 원, 이민자 투표권. 선거인단제를 고르면 선거인단 설정이 나와요.',
                },
                {
                    btn: 'subTabElecCandidates', open: go('vote', 'elecCandidates'),
                    desc: '후보 단일화(여러 정당이 후보 한 명으로)와 대선 · 총리 선거 후보(기본은 당수 — 의원 연결이나 직접 입력으로 바꿈).',
                },
                {
                    btn: 'subTabElecLocal', open: go('vote', 'elecLocal'),
                    desc: '지방선거 — 권역 단체장(예: 지사)과 지역구 단체장(예: 시장)을 뽑습니다. 지역구 인구 × 투표율로 실제 득표수를 계산하고, 당선자를 현직 단체장으로 반영하면 오른쪽에 지방자치 현황 지도가 나와요. 직책 이름은 권역 · 지역구마다 따로 정할 수 있습니다.',
                },
                {
                    btn: 'subTabReferendum', open: go('vote', 'referendum'),
                    desc: '국민투표 — 정당마다 찬성 · 중립 · 반대 입장을 정하면 지역구마다 그 정당 지지층이 입장대로 찬반을 나눠 득표가 나옵니다. 투표율 기준(예: 50%)을 켜면 그 아래일 때는 결과와 상관없이 부결.',
                },
                {
                    btn: 'subTabElecRecord', open: go('vote', 'elecRecord'),
                    desc: '지난 선거 결과 — 총선 · 대선(총리 선거) · 지방선거 · 국민투표 기록을 최근 순으로, 종류 칩 · 검색으로 걸러 봅니다.',
                },
                {
                    btn: 'subTabFraud', open: go('vote', 'fraud'), suffix: ' (부정선거)',
                    desc: '정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각은 개표 도중 무작위 시점에 드러나며, 그 순간 개표가 멈추고 조작된 표를 무효로 해 처음부터 다시 개표합니다. 발각된 정당은 활동 금지 처분을 받아요.',
                },
            ],
        },
        election: {
            intro: '선거 결과를 좌우하는 성향 · 지지율을 정합니다 (지역구 · 권역은 국가 묶음). 여기서 정한 값으로 선거 탭에서 개표해요.',
            tabs: [
                {
                    btn: 'elecSubTabOverview', open: goElec('overview'),
                    desc: '종합 — "시민 / 이민자 성향 따로 정하기"(기본 켬)와 시민 · 인구 · 이민자 수, 원마다 정당별 지지율(시민 · 이민자 · 합산)을 한눈에 봅니다. 끄면 이민자 탭이 시민 탭과 묶여(동기화) 이민자도 시민과 같은 성향으로 투표해요 (시민 · 인구 수는 따로).',
                },
                {
                    btn: 'elecSubTabTendency', open: goElec('tendency'),
                    desc: '지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 어느 정당이 이길지가 여기서 갈려요.',
                },
                {
                    btn: 'elecSubTabMtendency', open: goElec('mtendency'),
                    desc: '이민자 성향 — 시민 성향과 같은 화면으로 이민자의 지역구 · 권역 성향을 정합니다. 이민자가 투표하는 선거에서 지역구마다 시민 · 이민자 수만큼 섞어 개표해요 (지역구 성향이 없으면 권역 성향 → 이민자 지지율).',
                },
                {
                    btn: 'elecSubTabMprob', open: goElec('mprob'),
                    desc: '이민자 지지율 — 시민 지지율과 같은 화면으로 이민자의 정당별 지지율을 정합니다. 이민자가 투표하는 총선 비례 · 대선은 전국 시민 · 이민자 수만큼 섞어 개표해요.',
                },
                {
                    title: '기사 (🔒 1.7.0)',
                    desc: '신문 · 방송 기사를 직접 작성하는 기능(언론사 · 제목 · 부제 · 날짜 · 본문 · 사진, 날짜순 기사 목록) — 1.7.0에서 열립니다.',
                },
                {
                    btn: 'elecSubTabProb', open: goElec('prob'),
                    desc: '정당별 지지율(%)과 오차 범위를 정합니다. 비례대표 의석과 대선 결과의 바탕이 되고, 선거를 치르려면 꼭 필요해요. 전국형 · 권역형 비례를 고를 수 있습니다.',
                    inner: [
                        ['무당파', '개표 때마다 무당파 표를 정당에 나눠 비례대표 의석 배분에 더합니다.\n'
                            + 'S = max(0, 무당파 지지율 ± 오차),  r = 0~1 난수 (선거마다)\n'
                            + '① 무작위 몫 S·r — 정당마다 난수 u(0~1) → 정당 i의 몫 = S·r · uᵢ / Σu  (지지율과 무관)\n'
                            + '② 지지율 몫 S·(1−r) — 정당 지지율 wᵢ(오차 반영) × 친화도 aᵢ(0.5~1.5 난수) → 몫 = S·(1−r) · wᵢaᵢ / Σwa\n'
                            + '최종 가중치 = wᵢ + ①몫 + ②몫 → 이 비율로 비례 의석을 배분. 활동 금지 정당은 받지 않고, 지역구 결과는 성향(%)으로 따로 정해져요.'],
                        ['무소속 포함하기', '무당파 칸 바로 아래. 켜면 무소속도 무당파 표를 받습니다 — ①은 지지율과 무관해서 무소속 지지율이 0이어도 의석을 얻을 수 있어요. 끄면(기본) 무소속은 ① · ② 모두에서 빠집니다.'],
                    ],
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
                    btn: 'subTabMilitary', open: go('cabinet', 'military'),
                    desc: '군부 — 군 지휘부(국방부 장관 · 합참의장 · 육해공군 참모총장 등)를 정합니다. 지휘관마다 소속 · 정부에 대한 충성도(0~100) · 가까운 정당이 있고, 쿠데타 성공 확률 · 국회공성전 봉쇄 강도에 쓰여요.',
                },
                {
                    btn: 'subTabCoup', open: go('cabinet', 'coup'),
                    desc: '쿠데타 — 주도 세력(군부 · 정당 · 대통령 친위)과 지도자를 고르면 성공 확률을 요인별로 보여 주고, 일으키면 주사위를 굴립니다.',
                    inner: [
                        ['성공', '계엄령 선포 · 의회 정지 · 반대 정당 활동 금지. 군부가 성공하면 숨겨진 정부 형태 "군정" — 군사평의회 의장이 대통령 · 총리를 겸하고 선거가 멈춥니다.'],
                        ['실패', '주도 세력 처벌(지도자 숙청 · 정당 활동 금지 · 대통령 축출)과 역풍으로 지지율 하락.'],
                        ['군정에서 벗어나기', '민정 이양(계엄 해제 · 선거 재개 · 막힌 정당 복권) · 역쿠데타 · 혁명.'],
                    ],
                },
                {
                    btn: 'subTabRevolution', open: go('cabinet', 'revolution'),
                    desc: '혁명 — 민중이 주체입니다. 주도 이념(민주 · 공산주의)과 혁명 정당을 고르면 성공 확률을 요인별로 보여 줘요 (정부 불신 · 군정 · 계엄 · 활동 금지 정당 · 혁명 정당 지지율 · 군의 충성).',
                    inner: [
                        ['공산주의 혁명', '성공하면 숨겨진 정부 형태 "당-국가 체제" — 혁명 정당 일당 집권, 다른 정당은 활동 금지 또는 우당, 의회는 최고인민회의, 선거는 단일 후보 찬반 투표.'],
                        ['민주 혁명', '성공하면 군정 · 당-국가 체제 · 계엄이 무너지고 막혔던 정당이 복권, 새 헌법과 새 총선.'],
                    ],
                },
                {
                    btn: 'subTabRoyal', open: go('cabinet', 'royal'),
                    desc: '왕실 — 왕가와 왕위 주장자(이름 · 칭호 · 성별 · 사진 · 지지 정당)를 정하고 계승 규칙(남계만 · 남자 우선 · 성별 무관)을 고릅니다. 주장자 순서(⋮⋮ 끌기)가 출생 순이에요.',
                    inner: [
                        ['왕정복고', '공화정에서 군주제를 되살립니다 — 지지 정당이 하원 과반이면 의회 결의로 입헌군주제, 아니면 왕당파 쿠데타(입헌군주제 · 전제군주정).'],
                        ['군주제에서', '서거 · 퇴위하면 계승 규칙대로 다음 계승자가 즉위하고, 다른 주장자가 정통 왕위를 주장하면 계승 분쟁(의회 표결 · 내전). 입헌군주제는 친위 쿠데타로 전제군주정, 전제군주정은 입헌 개혁으로 돌아가고, 공화 혁명으로 군주제를 없앨 수 있어요.'],
                    ],
                },
                {
                    btn: 'subTabSign', open: go('cabinet', 'sign'),
                    desc: '서명 — 의회를 통과해 거부권 주체(대통령 · 총리 · 내각)의 서명을 기다리는 법안입니다. 서명하면 가결되고, 거부권을 행사하면 최종 부결돼요. 거부권 주체가 없으면(정부 형태 · 권한) 이 단계 없이 바로 가결됩니다.',
                },
                {
                    btn: 'subTabCouncil', open: go('cabinet', 'council'),
                    desc: '내각이 의결하는 법안의 표결과 의결 정족수. 계엄령으로 의회가 정지된 동안에는 여기서 법안을 통과시킵니다.',
                },
                {
                    btn: 'subTabCouncilArchive', open: go('cabinet', 'councilArchive'),
                    desc: '국무회의에서 가결 · 부결된 법안 보관함입니다 (상태별로 걸러 보기). 의회가 의결한 법안은 입법 › 표결 기록에 있어요.',
                },
            ],
        },
        world: {
            intro: '나라 바깥 — 세계 여러 나라와 진영입니다. 꾸밈용이라 게임 계산에는 영향을 주지 않아요.',
            tabs: [
                {
                    btn: 'subTabRanking', open: go('world', 'ranking'),
                    desc: '국가 순위 — 냉전 국가 순위처럼 나라마다 국기(그림) · 진영 · 하위 이념 · 점수를 정하면 오른쪽 "국가 순위" 시각 탭에 순위표와 순위 변동이 나옵니다.',
                },
                {
                    btn: 'subTabBlocs', open: go('world', 'blocs'),
                    desc: '진영 — 진영 추가 · 삭제, 색 · 설명, 하위 이념 추가 · 삭제, 진영 구도 막대.',
                },
                {
                    title: '경제권 (🔒 1.7.1)',
                    desc: '여러 나라를 묶어 경제권(관세 동맹 · 공동시장 · 통화 동맹 …)을 정하고 경제에 반영하는 기능 — 1.7.1에서 열립니다.',
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
                    desc: '탭 하나하나가 세이브(나라 하나)입니다. 누르면 그 세이브로 바로 바뀌고, 진행 상황은 그 세이브에 그대로 자동저장돼요. 프리셋으로 시작하면 프리셋 제목으로 탭이 생깁니다.',
                    inner: [
                        ['●', '탭 이름 옆의 점 — 아직 저장하지 않은 변경사항이 있다는 뜻. 자동저장이 켜져 있으면 곧 저장되고, 꺼져 있으면 탭을 옮기거나 닫을 때 저장할지 물어요.'],
                        ['이름 바꾸기', '탭 이름을 더블클릭 (또는 저장 창의 ✎).'],
                        ['×', '탭만 닫기 — 세이브는 지워지지 않아요. 탭을 모두 닫으면 아래 화면이 빕니다. 세이브 삭제는 저장 창의 세이브 목록이나 시작 화면의 🗑에서.'],
                    ],
                },
                {
                    path: '맨 위', title: '+ 새 세이브',
                    desc: '새 세이브를 만듭니다.',
                    inner: [
                        ['새로 생성', '아무것도 없는 기본 상태에서 새로 시작 — 지금 화면은 복사되지 않아요.'],
                        ['프리셋에서 생성', '서독 튜토리얼처럼 미리 준비된 나라의 복사본으로 시작.'],
                        ['닫은 탭 다시 열기', '×로 닫아 둔 세이브를 다시 탭으로 띄웁니다.'],
                    ],
                },
                {
                    path: '맨 위', title: '저장 버튼',
                    desc: '탭 바 오른쪽 끝. 저장 창(지금 저장 · 자동저장 · 세이브 목록 · 다른 이름으로 저장 · 파일)을 엽니다. 국가 › 저장에 있던 것이 모두 여기로 옮겨졌어요.',
                },
                {
                    path: '왼쪽', title: '메뉴 묶음과 항목',
                    desc: '의회 · 입법 · 여론 · 선거 · 내각 · 국가 · 도움말 일곱 묶음과 그 안의 항목. 항목을 누르면 그 기능 화면이 열리고, 묶음 제목을 누르면 접히거나 펼쳐집니다 (다음에 열어도 그대로 기억).',
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
                    desc: '설정을 바꾸면 시각 화면이 알아서 새로 그려집니다. "PROTOCOL EXECUTE"(실행) 버튼은 기본으로 숨겨져 있고 설정 › 화면에서 켤 수 있어요 — 숨겨도 Enter로 다시 그릴 수 있습니다.',
                    inner: [
                        ['Enter', '입력 칸 밖에서 누르면 실행.'],
                        ['Ctrl+S', '바로 저장.'],
                        ['Ctrl+Z', '되돌리기 (Ctrl+Shift+Z로 다시 실행).'],
                        ['Esc', '열려 있는 확인 · 안내 · 내보내기 · 저장 · 날짜 창 닫기.'],
                    ],
                },
                {
                    path: '메인 화면', title: '테마 · 언어 · 튜토리얼',
                    desc: '⌂로 메인 화면에 가면 설정(라이트 · 다크 · 네온 테마, 모바일 · 데스크톱 화면)과 🌐 언어(언어 팩 불러오기 포함)를 바꿀 수 있어요. 튜토리얼은 시작하기 › 프리셋의 "서독"으로 언제든 다시 할 수 있고, 기본 튜토리얼(핵심 흐름)과 세부 튜토리얼(기능별)로 나뉘어 있습니다.',
                },
                {
                    path: '모바일', title: '모바일 화면 모드',
                    desc: '메인 화면 › 설정의 화면(모바일 · 데스크톱)에서 모바일을 고르면 사이드바 대신 화면 아래 탭 바(묶음 + 의석)와 떠 있는 실행 버튼을 씁니다. 세부 항목은 위쪽 칩 줄에서 고르고, "의석"을 누르면 시각 화면으로 넘어가요.',
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
                    btn: 'dispTabDistrict', open: () => { go('nation', 'territory')(); showPanel('display'); }, openWhenHidden: true,
                    desc: '지역구 지도. 국가 › 지역구 지도를 열면 나타나고, 지역구를 눌러 편집할 수 있어요. 탭의 ×로 닫습니다.',
                },
                {
                    btn: 'dispTabTendency', open: () => { goElec('tendency')(); showPanel('display'); }, openWhenHidden: true,
                    desc: '정당별 성향 지도. 여론 › 시민 성향을 열면 나타나며, 지역구마다 어느 정당 쪽인지 색으로 보여요.',
                },
                {
                    btn: 'dispTabRegion', open: () => { go('nation', 'regions')(); showPanel('display'); }, openWhenHidden: true,
                    desc: '권역 지도. 국가 › 권역을 열면 나타나고, 지역구를 칠해 권역으로 묶습니다.',
                },
                {
                    btn: 'dispTabTimeline', open: () => { go('setup', 'timeline')(); showPanel('display'); },
                    desc: '세력 변화 — 의회 › 세력 변화의 기록을 정당 역사 도표로 (의석 변화 · 당 변화 계보도, 아래로 스크롤). 우클릭으로 PNG · SVG 내보내기.',
                },
                {
                    btn: 'dispTabWiki', open: () => { go('setup', 'wikibox')(); showPanel('display'); },
                    desc: '위키 틀 — 원내 구성 틀 (정당 로고 · 의석 · 여야 구분). 우클릭으로 PNG · SVG 내보내기.',
                },
                {
                    btn: 'dispTabRanking', open: () => { go('world', 'ranking')(); showPanel('display'); },
                    desc: '국가 순위 — 세계 › 국가 순위의 순위표 (국기 · 진영 · 점수 · 순위 변동).',
                },
                {
                    btn: 'dispTabElecResultHouse', title: '선거결과', open: disp('elecResultHouse'), hiddenNote: '총선을 개표하면 원마다 생겨요',
                    desc: '총선 개표 화면과 결과. 개표가 진행되는 모습, 정당별 득표와 직전 대비 의석 변동(▲/▼)을 보여주고, 결과를 확인한 뒤 선거 › 총선의 "✔ 의회에 반영"을 누르면 그 결과대로 의석이 바뀝니다.',
                },
                {
                    title: '날짜 · 회기', open: () => { showPanel('display'); if(typeof openDatePanel === 'function') openDatePanel(); },
                    desc: '시각 화면 맨 위 줄의 현재 날짜와 회기. ▶ · ▶▶ · ▶▶▶로 하루 · 일주일 · 한 달씩 넘기고, "다음: 정기회 / 임시회"로 다음 회기 종류를 골라(지금 회기는 그대로) "다음 회기"로 넘깁니다. ⚙로 날짜 · 회기 설정 창을 엽니다.',
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
            // suffix는 이름이 기호뿐일 때만 (⚠ → "⚠ (부정선거)", 잠금을 풀어 "부정선거"가 되면 붙이지 않음)
            card.querySelector('.help-card-title').textContent = (tab.title || srcLabel || tab.btn) + (tab.suffix && !/[\p{L}]/u.test(srcLabel || '') ? tab.suffix : '');
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
                    const dd = document.createElement('dd'); dd.textContent = text; dd.style.whiteSpace = 'pre-line'; // 수식처럼 줄을 나눈 설명
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
