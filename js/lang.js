// ===== DATANET PARLIAMENT SIMULATION — 언어 전환 모듈 =====
// dno.html / roadmap.js를 건드리지 않고, 렌더링된 DOM 텍스트를 사전 기반으로
// 실시간 치환하는 방식으로 영어 표시를 지원한다. 언어 설정은 settings.html에서
// 바꾸며, localStorage에 저장된 설정을 각 페이지가 로드 시점에 읽어 적용한다.
(function () {
    'use strict';

    const LANG_KEY = 'dnoLang';

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }

    function getLang() {
        return safeGet(LANG_KEY) === 'en' ? 'en' : 'kr';
    }
    function setLang(lang) {
        if (lang !== 'kr' && lang !== 'en') return; // 세 번째 자리(🔒︎)는 아직 잠김 — 유효한 값이 아니면 무시
        safeSet(LANG_KEY, lang);
    }
    window.getLang = getLang;
    window.setLang = setLang;

    if (getLang() !== 'en') return; // 기본값(한국어)일 때는 아무 것도 하지 않는다

    // ===== 서수 변환 (1 -> 1st, 2 -> 2nd, ...) =====
    function ordinal(nStr) {
        const n = parseInt(nStr, 10);
        if (isNaN(n)) return nStr;
        const suf = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (suf[(v - 20) % 10] || suf[v] || suf[0]);
    }

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // ===== 동적으로 조합되는 문구(날짜/회기/의석 수 등)를 위한 패턴 규칙 =====
    // 사전 치환보다 먼저 적용되어, 숫자와 결합된 한국어 카운터를 자연스러운 영어로 바꾼다.
    const PATTERN_RULES = [
        // "1952년 3월 15일" / "?년 ?월 ?일" -> "March 15, 1952"
        [/(\d+|\?)년\s*(\d+|\?)월\s*(\d+|\?)일/g, (_, y, m, d) => {
            const mi = parseInt(m, 10);
            const mName = (!isNaN(mi) && mi >= 1 && mi <= 12) ? MONTH_NAMES[mi - 1] : m;
            return `${mName} ${d}, ${y}`;
        }],
        // "제21대 국회 제1회 정기회" -> "21st National Assembly, 1st Regular Session"
        [/제(\d+|\?)대\s+(.+?)\s+제(\d+|\?)회\s+(정기회|임시회)/g, (_, term, org, num, type) => {
            const typeEn = type === '정기회' ? 'Regular Session' : 'Extraordinary Session';
            const termOrd = term === '?' ? '?' : ordinal(term);
            const numOrd = num === '?' ? '?' : ordinal(num);
            return `${termOrd} ${org}, ${numOrd} ${typeEn}`;
        }],
        [/(\d+)석/g, '$1 seats'],
        [/(\d+)칸/g, '$1 cells'],
        [/(\d+)판/g, '$1 round'],
    ];

    // ===== 번역 사전 — [한국어, English] =====
    const DICT = [
        // ── 메인 탭 / 상단 헤더 ──
        ['⚙ 의회', '⚙ Parliament'], ['🏛 국가', '🏛 Nation'], ['🗳 여론', '🗳 Opinion'], ['💾︎ 저장', '💾︎ Save'],
        ['국가명 미설정', 'Nation name not set'], ['날짜 미설정', 'Date not set'], ['회기 미설정', 'Session not set'],
        ['클릭하여 국기 업로드', 'Click to upload flag'], ['✕ 국기 제거', '✕ Remove Flag'],
        ['현재 날짜', 'Current Date'], ['국가명', 'Nation Name'], ['국기', 'Flag'], ['국가', 'Nation'],

        // ── 상단 시스템 선택 ──
        ['단원제', 'Unicameral'], ['양원제', 'Bicameral'], ['삼원제', 'Tricameral'],

        // ── 의회 > 정당/구성 ──
        ['[+] 정당 추가', '[+] Add Party'], ['[+] 연정 구성', '[+] Form Coalition'], ['[+] 이념 추가', '[+] Add Ideology'],
        ['+ 파벌 추가', '+ Add Faction'], ['↗ 신당으로 분리', '↗ Split into New Party'], ['↺ 자동정렬', '↺ Auto-sort'],
        [' 당수 사진', ' Leader Photo'], [' 당 로고', ' Party Logo'], [' 정당 색 사용', ' Use Party Color'],
        ['정당 색 사용 중', 'Using Party Color'],
        ['당에 대한 설명을 입력하세요...', 'Enter a description for the party...'],
        ['placeholder="약칭"', 'placeholder="Abbr."'],
        ['정당 약자 표기 (예: SPD)', 'Party abbreviation (e.g. SPD)'],
        ['파벌명', 'Faction name'], ['파벌 당수 이름', 'Faction leader name'],
        ['정당명', 'Party name'], ['(이름 없음)', '(no name)'],
        ['새 이념', 'New Ideology'], ['새 파벌', 'New Faction'], ['새 연정', 'New Coalition'], ['신당', 'New Party'],
        ['각외협력', 'External Support'],
        ['명칭 커스터마이징 (예: 신임과 보완, 보완과 신임 등)', 'Customize the label (e.g. Confidence & Supply)'],
        ['연정 없음 — 연정 탭에서 먼저 연정을 만드세요', 'No coalition — create one first in the Coalition tab'],
        ['단독 집권 (SINGLE PARTY RULE)', 'Single-Party Rule (SINGLE PARTY RULE)'],
        ['[✕] 무집권 상태', '[✕] No Ruling Power'],
        ['" 파벌을 신당으로 분리하시겠습니까?', '" — split this faction into a new party?'],
        ['신당:', 'New party:'],
        ['[배정된 정당 없음]', '[No parties assigned]'],
        ['[무소속 이념/정당이 설정되어 있지 않습니다]', '[The independent ideology/party is not set up]'],
        ['정당이 안 생성되는 버그 수정', 'fixed a bug where parties failed to be created'],
        ['원외정당 (', 'Out-of-Parliament ('],
        ['이념 미지정', 'Ideology not set'],
        ['[여소야대]', '[Divided Government]'], ['[소수 MIN]', '[Minority MIN]'], ['[과반 MAJ]', '[Majority MAJ]'], ['[여당 GOV]', '[Ruling GOV]'],
        ['상태:  활동 금지', 'Status:  Banned'], ['상태:  해산', 'Status:  Dissolved'],
        ['>활동 금지', '>Banned'], ['>활동중', '>Active'], ['>해산', '>Dissolved'],
        ['활동 금지', 'Banned'], ['*해산됨*', '*Dissolved*'], ['해산', 'Dissolved'],
        ['국가재건당', 'National Reconstruction Party'], ['개혁그룹', 'Reform Group'],
        ['민주당', 'Democratic Party'], ['사회당', 'Socialist Party'], ['국민전선', 'National Front'],
        ['혁명적 사회주의', 'Revolutionary Socialism'], ['국가사회주의', 'National Socialism'],
        ['사회주의', 'Socialism'], ['진보주의', 'Progressivism'], ['자유주의', 'Liberalism'],
        ['보수주의', 'Conservatism'], ['권위주의', 'Authoritarianism'],
        ['무당파', 'Unaffiliated'], ['여당', 'Ruling Party'], ['야당', 'Opposition'],
        ['삼원✔', 'Third✔'], ['삼원✘', 'Third✘'], ['하원✔', 'House✔'], ['하원✘', 'House✘'], ['상원✔', 'Senate✔'], ['상원✘', 'Senate✘'],
        ['· 상원', '· Senate'], ['· 삼원', '· Third'], ['석, 상원', ' seats, Senate'],
        ['기준:', 'Threshold:'], ['파벌:', 'Faction:'], ['연정:', 'Coalition:'], ['이념:', 'Ideology:'], ['정당:', 'Party:'],
        ['▌ 멤버 (', '▌ Members ('], ["' 멤버 없음 '", "' No members '"],
        [')가 자동으로 대상에 포함됩니다.', ') is automatically included as the target.'],
        ['▌ 명칭', '▌ Name'], ['▌ 종합', '▌ Overview'], ['종합', 'Overview'],
        ['▌ 파벌', '▌ Factions'], ['합계', 'Total'], [';">합계', '>Total'],
        ['로고', 'Logo'], ['— 궐석', '— Vacant'],
        ['국가재건특별법 제1조', 'National Reconstruction Special Act, Article 1'],
        ['국가 재건을 위해 필요한 모든 조치를 취할 수 있다.', 'All measures necessary for national reconstruction may be taken.'],
        ['집행부는 의회의 동의 없이 긴급 법령을 발동할 수 있다.', 'The executive may issue emergency decrees without the consent of Parliament.'],
        ['긴급', 'Emergency'], ['재건', 'Reconstruction'],

        // ── 의회 > 구성/설정 ──
        ['의회 명칭', 'Parliament Name'], ['총 의석 수', 'Total Seats'],
        ['지정...', 'Set...'],

        // ── 의회 > 의원(지역구/무소속) ──
        ['궐석 처리된 지역구만 대상으로 다시 개표', 'Recount only vacated districts'],
        ['이 지역구를 궐석 처리하시겠습니까?', 'Vacate this district\'s seat?'],
        ['(보궐선거로 다시 채울 때까지 소속 정당 의석에서 1석 감소합니다)', '(Its party\'s seat count is reduced by 1 until refilled by a by-election)'],
        ['[이 의원실에는 무소속 의석이 없습니다 — 의회>설정 탭에서 무소속 정당의 의석 수를 설정하세요]', '[This chamber has no independent seats — set the independent party\'s seat count in the Parliament > Settings tab]'],
        ['궐석 처리된 지역구가 없습니다.', 'No vacated districts.'],
        ['의회 > 의원 탭에서 궐석 처리를 먼저 진행하세요.', 'Vacate a district first in the Parliament > Members tab.'],
        ['의회>의원 탭에서 당선자 이름을 입력해 주세요.', 'Enter the winner\'s name in the Parliament > Members tab.'],
        ['의원 이름', 'Member name'],
        ['[지역구 당선 의원이 없습니다 — 지역구+비례 방식으로 선거를 진행하고 의회에 반영하면 여기 표시됩니다]',
            '[No elected district members — run an election in District+Proportional mode and apply it to Parliament to see them here]'],
        ['↻ 의회 반영', '↻ Apply to Parliament'], ['✔ 의회에 반영', '✔ Apply to Parliament'],
        ['👁 보기', '👁 View'], ['🔍 정보 보기', '🔍 View Info'], ['통계 표시', 'Show Stats'],
        ['— 의석', '— seats'], ['— 기권 (회색)', '— Abstain (gray)'],
        ['↺ 재개표', '↺ Recount'], ['↩ 개정:', '↩ Amendment:'],
        ['좌석 정보', 'Seat Info'], ['(이름 미지정)', '(name not set)'],
        ['#', '#'],

        // ── 의회 > 연정 ──
        ['- 연정 멤버/각외협력 목록에서 개별 무소속 의원을 이름(또는 좌석번호)으로 표시하도록 개선',
            '- Coalition members/External Support lists now show individual independent members by name (or seat number)'],

        // ── 국가 > 설정 ──
        ['예: 대게르만국', 'e.g. Greater Germania'],
        ['수동 진행형', 'Manual Progression'], ['단순형', 'Simple'], ['개별형', 'Individual'],
        ['정기회', 'Regular Session'], ['임시회', 'Extraordinary Session'],
        ['예: 1952년 3월 15일', 'e.g. March 15, 1952'],
        ['예: 제21대 국회 제1회 임시회', 'e.g. 21st National Assembly, 1st Extraordinary Session'],
        ['▶ 다음 회기', '▶ Next Session'],
        ['+1개월', '+1mo'], ['+7일', '+7d'], ['+1일', '+1d'],
        ['국회', 'National Assembly'],

        // ── 국가 > 입법 ──
        ['새 법안 작성 (NEW BILL)', 'Draft New Bill (NEW BILL)'],
        ['기존 법안 수정 (EDIT BILL)', 'Edit Existing Bill (EDIT BILL)'],
        ['태그 (쉼표로 구분, 예: 경제, 안보)', 'Tags (comma-separated, e.g. Economy, Security)'],
        ['법안 검색...', 'Search bills...'], ['기록 검색...', 'Search records...'], ['법안 제목...', 'Bill title...'],
        ['법안 내용을 입력하세요...', 'Enter the bill\'s content...'],
        ['-- 수정할 법안 선택 --', '-- Select a bill to edit --'], ['-- 법안 선택 --', '-- Select Bill --'],
        ['법안을 선택하세요...', 'Select a bill...'],
        ['[+] 법안 등록', '[+] Register Bill'], ['[✔] 수정 저장', '[✔] Save Changes'],
        ['심의 법안 선택 (SELECT BILL)', 'Select Bill for Review (SELECT BILL)'],
        ['정당 일괄 투표 (PARTY BULK)', 'Bulk Party Vote (PARTY BULK)'],
        ['-- 표결 대기 중 --', '-- Awaiting Vote --'],
        ['[ 삼원 표결 결과 ]', '[ Third Vote Result ]'], ['[ 상원 표결 결과 ]', '[ Senate Vote Result ]'], ['[ 하원 표결 결과 ]', '[ House Vote Result ]'],
        ['▶ 삼원 표결 확정', '▶ Confirm Third Vote'], ['▶ 하원 표결 확정', '▶ Confirm House Vote'], ['▶ 상원 표결 확정', '▶ Confirm Senate Vote'],
        ['특별다수 (2/3 이상)', 'Supermajority (2/3 or more)'], ['과반 (재적 과반수)', 'Majority (over half of members)'],
        ['전원 일치', 'Unanimous'], ['전원일치', 'Unanimous'], ['특별다수(2/3)', 'Supermajority (2/3)'],
        ['가결 기준', 'Passage Threshold'], ['분자', 'Numerator'], ['분모', 'Denominator'],
        ['▲ 찬성 (초록)', '▲ Yea (green)'], ['▼ 반대 (빨강)', '▼ Nay (red)'],
        ['▲ 찬성', '▲ Yea'], ['▼ 반대', '▼ Nay'], ['▲찬', '▲Yea'], ['▼반', '▼Nay'],
        ['(찬', '(Yea'], ['/반', '/Nay'], ['/기', '/Abs'],
        ['✔ 최종 가결', '✔ Finally Passed'], ['✘ 최종 부결', '✘ Finally Rejected'],
        ['✔ 가결 (', '✔ Passed ('], ['✘ 부결 (', '✘ Rejected ('], ['부결 —', 'Rejected —'],
        ['가결 확정됨', 'Passage Confirmed'], ['부결 확정됨', 'Rejection Confirmed'], ['결과 확정', 'Result Confirmed'],
        ['표결 확정', 'Vote Confirmed'], ['표결 기록 없음', 'No vote record'],
        ['📝 개정 대상:', '📝 Amending:'], ['개정안 (', 'Amendment ('], ['개정안', 'Amendment'],
        ['▾ 세부 기록 (총', '▾ Detailed Records (Total'], ['▾ 세부 기록', '▾ Detailed Records'],
        ['가결된 법안만 개정안을 발의할 수 있습니다.', 'Only passed bills can have amendments proposed.'],
        ['법안이 수정되었습니다.', 'The bill has been updated.'],
        ['법안 제목을 입력하세요.', 'Enter a bill title.'],
        ['심의할 법안을 먼저 선택하세요.', 'Select a bill to review first.'],
        ['표결을 먼저 확정하세요.', 'Confirm the vote first.'],
        ['대기 중인 법안이 없습니다', 'No pending bills'], ['완료된 법안이 없습니다', 'No completed bills'],
        ['검색 결과가 없습니다', 'No search results'],
        ['에서 부결된 법안은', ' — a bill rejected here'],
        ['에 상정되지 않습니다.', ' is not brought to the floor.'],
        ['석 부족)', ' seats short)'], ['석 필요', ' seats needed'], ['석 = 실질', ' seats = effective'],
        ['석 + 비례', ' seats + proportional'], ['석 · 득표율', ' seats · vote share'], ['석 (', ' seats ('], ['석)', ' seats)'],
        ['— 의석', '— seats'],
        ['미상정', 'Not Tabled'], ['대기 중', 'Pending'], ['제출', 'Submit'], ['상정', 'Floor'], ['표결', 'Vote'],
        ['취소', 'Cancel'], ['법안', 'Bill'],

        // ── 국가 > 기록 ──
        ['0.2.0 - 다중언어 프로젝트 시작', '0.2.0 - Multilingual Project Begins'],

        // ── 여론(선거) ──
        ['성향 탭에서 설정한 지지도를 기반으로 각 지역구의 당선자를 결정합니다.', 'Determines each district\'s winner based on the support levels set in the Tendency tab.'],
        ['의원실마다 정당 구성이 다를 수 있어 지지율을 독립적으로 설정합니다.', 'Each chamber can have a different party makeup, so support rates are set independently.'],
        ['지역구는 성향 탭의 지지도로 결정, 비례는 아래 지지율로 결정', 'Districts are decided by the Tendency tab\'s support levels; proportional seats by the support rate below'],
        ['성향 데이터가 없는 지역구는 무작위로 배정됩니다.', 'Districts without tendency data are assigned randomly.'],
        ['성향 맵은 우측 패널에서 확인 및 편집하세요', 'Check and edit the tendency map in the right panel'],
        ['각 지역구 결과에 추가되는 랜덤 변동', 'Random variation added to each district\'s result'],
        ['지역구 이름 (예: 종로구)', 'District name (e.g. Jongno)'],
        ['보궐 (궐석 지역구만 재선거)', 'By-election (re-vote vacated districts only)'],
        ['예: 1952년 3월 5일', 'e.g. March 5, 1952'], ['예: 제1회 총선거', 'e.g. 1st General Election'],
        ['선택 해제 (이동/확대만)', 'Deselect (pan/zoom only)'],
        ['하원 0칸 · 상원 0칸', 'House 0 cells · Senate 0 cells'],
        ['0석 (활성 지역구 수)', '0 seats (active districts)'],
        ['상원 선거결과', 'Senate Election Results'], ['하원 선거결과', 'House Election Results'], ['삼원 선거결과', 'Third Election Results'],
        ['선택한 지역구', 'Selected district'], ['⏩ 즉시 완료', '⏩ Finish Instantly'],
        ['전체에 반영', 'Apply to All'], ['지역구 설정', 'District Settings'],
        ['⏸ 일시정지', '⏸ Pause'], ['전체 초기화', 'Reset All'], ['지역구 의석', 'District Seats'],
        ['선거 결과', 'Election Results'], ['편집 모드', 'Edit Mode'], ['선거 제목', 'Election Title'],
        ['선거 방식', 'Election Method'], ['개표 속도', 'Count Speed'], ['지역구 맵', 'District Map'],
        ['개표 시작', 'Start Count'], ['불러오기', 'Load'],
        ['지지율', 'Support Rate'], ['지지율 분포', 'Support Rate Distribution'],
        // 원문 HTML의 &nbsp;는 파싱 후 실제 non-breaking space 문자가 되어 사전의 리터럴 "&nbsp;" 문자열과
        // 매칭되지 않으므로, nbsp/구분자를 사이에 두지 않는 조각 단위로 나눠서 등록한다.
        ['모드 선택 후 캔버스 의원 원 클릭 (정보 보기 모드는 투표를 바꾸지 않음)',
            'Select a mode, then click a seat dot on the canvas (Info mode does not change the vote)'],
        ['클릭/드래그로 칸 편집 (이름 모드는 클릭만)', 'Click/drag to edit cells (Name mode: click only)'],
        ['휠: 확대/축소', 'Wheel: zoom'], ['휠클릭+드래그: 이동', 'Wheel-click+drag: pan'],
        ['투표 입력 모드', 'Vote Input Mode'], ['노이즈 (±%)', 'Noise (±%)'],
        ['지역구 탭에서 활성화된 지역구가 없습니다.', 'No districts are active in the District tab.'],
        ['지역구를 먼저 추가하거나 비례 모드를 선택하세요.', 'Add a district first, or switch to Proportional mode.'],
        ['지역구 선거 기록이 없어 배경만 표시됩니다', 'No district election record — showing background only'],
        ['선거 탭 > 지역구 체크박스에서 "보궐"을 선택하고 개표하면이 지역구(',
            'Selecting "By-election" in the district checkbox under the Election tab and running the count will fill this district ('],
        ['지지율을 입력해 주세요.', 'Please enter support rates.'],
        ['각 정당의 지지율(%) 칸에 숫자를 입력하세요.', 'Enter a number in each party\'s support rate (%) field.'],
        ['[활성화된 지역구가 없습니다]', '[No active districts]'],
        ['저장된 선거 기록이 없습니다', 'No saved election records'],
        ['시뮬레이션을 먼저 실행하세요', 'Run the simulation first'],
        ['설정된 지역구가 없습니다', 'No districts set'],
        ['정당별 세부 데이터 없음', 'No per-party detail data'],
        ['지역구를 먼저 설정하세요', 'Set up districts first'],
        ['>> 개표 중... <<', '>> Counting... <<'], ['>> 개표 시작 <<', '>> Start Count <<'],
        ['>-- 소속 없음 --', '>-- No Affiliation --'],
        ['보궐선거 결과 (', 'By-election Result ('], ['개표 중... (', 'Counting... ('], ['개표 중...', 'Counting...'],
        ['무제 선거', 'Untitled Election'],
        ['정당명  지지율(%)  오차(±%)', 'Party  Support Rate(%)  Margin(±%)'],
        ['▌ 지역구 목록', '▌ District List'], ['성향 맵', 'Tendency Map'], ['성향', 'Tendency'], ['강도', 'Strength'],
        ['비례', 'Proportional'], ['미투표', 'Not Voted'], ['반원', 'Arc'],
        ['꺼짐', 'Off'],

        // ── 저장 탭 / 자동저장 ──
        ['✕ 저장 데이터 초기화', '✕ Reset Saved Data'], ['파일로 저장', 'Save to File'],
        ['💾︎ 저장', '💾︎ Save'], ['자동저장', 'Autosave'], ['자동저장됨', 'Autosaved'], ['자동저장된 데이터 없음', 'No autosaved data'],
        ['이 환경에서는 자동저장을 사용할 수 없음', 'Autosave is not available in this environment'],
        ['이 브라우저/환경에서는 자동저장(localStorage)을 사용할 수 없습니다.', 'Autosave (localStorage) is not available in this browser/environment.'],
        ['(예: 파일을 직접 열었거나, 브라우저의 저장소 차단 설정)', '(e.g. the file was opened directly, or the browser blocks storage)'],
        ['저장된 데이터를 모두 삭제하고 처음 상태로 되돌리시겠습니까?', 'Delete all saved data and return to the initial state?'],
        ['(파일로 저장한 .json 파일에는 영향이 없습니다)', '(Files you saved to disk are not affected)'],
        ['마지막 저장:', 'Last saved:'],
        ['불러오기 실패: 저장 파일이 깨졌거나 형식이 다릅니다.', 'Load failed: the save file is corrupted or in an unrecognized format.'],
        ['초기화', 'Reset'],

        // ── 로드맵 버전 타이틀 ──
        ['1.5.0 - 지역구/비례 시스템 개편', '1.5.0 - District/Proportional System Overhaul'],
        ['1.4.9 - 저장 리워크', '1.4.9 - Save Rework'],
        ['1.4.8 - 의회 리워크 Part.II', '1.4.8 - Parliament Rework Part II'],
        ['1.4.7 - 정당 리워크 Part.II', '1.4.7 - Party Rework Part II'],
        ['1.4.6 - 기록 리워크', '1.4.6 - Records Rework'],
        ['1.4.5 - 핫픽스', '1.4.5 - Hotfix'],
        ['1.4.4 - 지역구 리워크', '1.4.4 - District Rework'],
        ['1.4.3 - 정당 리워크 Part.I', '1.4.3 - Party Rework Part I'],
        ['1.4.2 - 의회 리워크 Part.I', '1.4.2 - Parliament Rework Part I'],
        ['1.4.1 - 연정 리워크', '1.4.1 - Coalition Rework'],
        ['1.4.0 - 선거 리워크', '1.4.0 - Election Rework'],
        ['1.3.4 - 선거 일부 리워크', '1.3.4 - Partial Election Rework'],
        ['1.3.3 - 정당 탭 신설', '1.3.3 - Party Tab Added'],
        ['1.3.2 - 버그 수정', '1.3.2 - Bug Fixes'],
        ['1.3.1 - UI 리워크', '1.3.1 - UI Rework'],
        ['1.3.0 - 선거 추가', '1.3.0 - Election Added'],
        ['1.2.1 - 법안 보완', '1.2.1 - Bill Improvements'],
        ['1.2.0 - 법안 추가', '1.2.0 - Bills Added'],
        ['1.1.1 - 버그 수정', '1.1.1 - Bug Fixes'],
        ['1.1.0 - 저장 추가', '1.1.0 - Save Added'],
        ['1.0.0 - 프로젝트 시작', '1.0.0 - Project Begins'],
        ['1.5.1 - 영어버전 출시', '1.5.1 - English Version Release'],
        ['1.5.0 - 모바일 출시', '1.5.0 - Mobile Release'],
        ['0.2.0 - 다중언어 프로젝트 시작', '0.2.0 - Multilingual Project Begins'],
        ['0.1.4 - 프리릴리스 삭제', '0.1.4 - Pre-release Removed'],
        ['0.1.3 - 버그 수정', '0.1.3 - Bug Fixes'],
        ['0.1.2 - 선거 추가', '0.1.2 - Election Added'],
        ['0.1.1 - 선거 삭제', '0.1.1 - Election Removed'],
        ['0.1.0 - 선거 개발', '0.1.0 - Election Development'],
        ['0.0.2 - TNO 테마', '0.0.2 - TNO Theme'],
        ['0.0.1 - 일반 테마', '0.0.1 - General Theme'],
        ['0.0.0 - 비공개 개발', '0.0.0 - Private Development'],
        ['2027 출시', '2027 Release'],

        // ── 로드맵 변경 로그 (버전별) ──
        ['- 저장 버전명 체계 변경 (v1.0부터 시작, 파일명도 dno-save-v1.0-... 형식으로 변경, KST 기준 타임스탬프)',
            '- Changed the save version naming scheme (starting from v1.0; filenames now use the dno-save-v1.0-... format with a KST timestamp)'],
        ['- 날짜/회기 설정 추가 (회기 이름도 국회 외 다른 명칭으로 커스터마이즈 가능), 우측 디스플레이 패널 상단에 상시 표시',
            '- Added date/session settings (the session name can now be customized beyond just "National Assembly"), always shown at the top of the right display panel'],
        ['- 선거 시스템 리워크 II (선거 > 지지율 탭 신설, "전체에 반영" 체크박스로 여러 원의 지지율 일괄 설정 지원)',
            '- Election system rework II (added Election > Support Rate tab; the "Apply to All" checkbox lets you batch-set support rates across chambers)'],
        ['- 의회 시스템 리워크 III (원외정당 시스템 추가, 의원실별로 정확히 판정하도록 개선)',
            '- Parliament system rework III (added the out-of-parliament party system, now judged correctly per chamber)'],
        ['- 좌석 정보 카드 추가 (호버 대신 클릭으로 확인, 무소속 이름·파벌·집권 세력 표기)',
            '- Added a seat info card (click instead of hover; shows independent name, faction, and ruling power)'],
        ['- 저장 탭 신설 (자동저장 켜기/끄기, 저장 데이터 초기화, 파일로 저장/불러오기)',
            '- Added a Save tab (autosave on/off, reset saved data, save/load to file)'],
        ['- 지지율 탭의 하원·상원·삼원 표기가 사용자 설정 명칭을 실시간으로 따르도록 수정',
            '- The Support Rate tab\'s House/Senate/Third labels now follow user-set chamber names live'],
        ['- "저장 시 사진 포함" 체크박스 제거 (항상 사진을 포함하여 저장하도록 변경)',
            '- Removed the "include photos when saving" checkbox (photos are now always included)'],
        ['- 입법기록 리워크 (개정안 발의, 법안 버전 표기, 표결 세부 타임라인 추가)',
            '- Legislative record rework (amendment proposals, bill version labels, detailed vote timeline)'],
        ['- 실행 취소(Ctrl+Z) 및 다시 실행(Ctrl+Shift+Z) 기능 추가', '- Added undo (Ctrl+Z) and redo (Ctrl+Shift+Z)'],
        ['- 국가 > 설정 신설에 맞춰 시작 화면 기본 탭을 국가 > 설정으로 변경',
            '- Changed the default landing tab to Nation > Settings, to match the new Nation > Settings tab'],
        ['- 자동저장 기능 추가 (localStorage 기반, 새로고침해도 유지)', '- Added autosave (localStorage-based, persists across refreshes)'],
        ['- 입법 시스템 리워크 (제출과 상정을 분리, 법안 수정 가능)', '- Legislation system rework (split Submit and Floor, bills can now be edited)'],
        ['- 시작 화면 리워크 (점검 안내/자동 리디렉션 페이지로 전환)', '- Landing screen rework (switched to a maintenance-notice/auto-redirect page)'],
        ['- 국가명·국기 설정 추가 (국가 > 설정, 헤더에 상시 표시)', '- Added nation name/flag settings (Nation > Settings, always shown in the header)'],
        ['- 선거기록 리워크 (정당별 세부 기록, 저장 시각 표기 추가)', '- Election record rework (per-party detail records, saved-time labels)'],
        ['- 최근 추가된 기능들이 저장/불러오기에 정확히 반영되도록 점검', '- Audited recently added features to ensure they\'re correctly saved/loaded'],
        ['- 점검 기간 자동화 (자동으로 점검 안내 표시 및 리디렉션)', '- Automated maintenance windows (auto-shows the notice and redirects)'],
        ['- 입법/표결 시스템 보완 (기준선, 비율 설정, 태그 추가)', '- Legislation/voting system improvements (thresholds, ratio settings, tags)'],
        ['- 순서 시스템 리워크 (기존 화살표에서 슬라이딩 방식으로)', '- Reorder system rework (switched from arrows to drag-to-reorder)'],
        ['- 정당 시스템 리워크 II (정당 해산/금지 표기 추가)', '- Party system rework II (added dissolved/banned party labels)'],
        ['- 로드맵 카드 업데이트 로그가 길어지면 스크롤되도록 개선', '- Roadmap cards now scroll when their changelog gets long'],
        ['- 기존 SAVE/LOAD 버튼 제거 (저장 탭으로 통합)', '- Removed the old SAVE/LOAD buttons (merged into the Save tab)'],
        ['- 선거 시스템 리워크 I (지역구/지지율 시스템 추가)', '- Election system rework I (added district/support-rate systems)'],
        ['- 선거 시스템 수정 (지역구 시스템 beta 추가)', '- Election system update (added district system beta)'],
        ['- 정당/연정 카드 리워크 (카드 접기 기능 추가)', '- Party/coalition card rework (added card collapsing)'],
        ['- 지역구 시스템 리워크 (지역구 이름 설정 추가)', '- District system rework (added district naming)'],
        ['- 정당 시스템 리워크 I (무소속 로직 리워크)', '- Party system rework I (reworked independent logic)'],
        ['- 툴팁이 화면 밖으로 벗어나지 않도록 위치 보정', '- Fixed tooltip positioning so it stays on-screen'],
        ['- 의회 시스템 리워크 II (의석 번호 추가)', '- Parliament system rework II (added seat numbers)'],
        ['- 입법 리워크 (개정안 및 법안에 버전 부여)', '- Legislation rework (versioning for amendments and bills)'],
        ['- UI 리워크 (정당 순서 자동/수동 설정)', '- UI rework (auto/manual party ordering)'],
        ['- 연정 시스템 리워크 (신임과 보완 추가)', '- Coalition system rework (added Confidence & Supply)'],
        ['- 좌석 정보 카드에서 투표 상태 표기 제거', '- Removed vote-status labels from the seat info card'],
        ['- 의회 시스템 리워크 I (삼원제 추가)', '- Parliament system rework I (added the tricameral system)'],
        ['- 파벌 시스템 추가 (당 내 파벌 추가)', '- Added the faction system (factions within a party)'],
        ['- 선거 기록에서 저장 시각 표기 제거', '- Removed the saved-time label from election records'],
        ['- 좌석 호버 시 흰색 고리 표시 추가', '- Added a white ring on seat hover'],
        ['- 정당이 안 생성되는 버그 수정', '- Fixed a bug where parties failed to be created'],
        ['- 정당 탭 신설 및 기능 재편', '- Added a Party tab and reorganized its features'],
        ['- 선거 시스템 개발 시도 II', '- Election System Development Attempt II'],
        ['- 중위·하위 탭 디자인 정리', '- Cleaned up mid/lower tab design'],
        ['- 선거 시스템 개발 시도 I', '- Election System Development Attempt I'],
        ['- 저장/불러오기 시스템 추가', '- Added save/load system'],
        ['- 당수 사진 및 이름 추가', '- Added leader photo and name'],
        ['- 선거 시스템 개발 실패', '- Election System Development Failed'],
        ['- 입법/표결 시스템 추가', '- Added legislation/voting system'],
        ['- 선거 시스템 개발 완료', '- Election System Development Complete'],
        ['- 시뮬레이션 개발 시작', '- Simulation Development Begins'],
        ['- 버그 수정', '- Bug Fixes'],
        ['- TNO 테마 추가', '- Added TNO theme'],
        ['- 일반 테마 삭제', '- General Theme Removed'],
        ['- 프리릴리스 시작', '- Pre-release Begins'],
        ['- 사진 비율 조정', '- Adjusted photo aspect ratio'],
        ['- 일반 테마 추가', '- Added general theme'],
        ['- 정당 로고 추가', '- Added party logo'],
        ['- 영어 번역 작업', '- English translation work'],
        ['- 영어 추가', '- Added English'],
        ['- 프리릴리스 중단', '- Pre-release Discontinued'],
        ['- 프로젝트 공개', '- Project Made Public'],
        ['- 프로젝트 시작', '- Project Begins'],
        ['- 베타 생성', '- Beta Created'],
        ['- 베타 삭제', '- Beta Removed'],
        ['- 모바일 내에서도 구동 가능하도록 수정', '- Fixed to also run properly on mobile'],
        ['- 로드맵 리워크 및 메인 화면 리워크', '- Roadmap rework and main screen rework'],
        ['- 저장 시스템 버전 업데이트 (v13)', '- Save system version update (v13)'],
        ['- 저장 시스템 버전 업데이트 (v12)', '- Save system version update (v12)'],
        ['- 저장 시스템 버전 업데이트 (v11)', '- Save system version update (v11)'],
        ['- 저장 시스템 버전 업데이트 (v10)', '- Save system version update (v10)'],
        ['- 저장 시스템 버전 업데이트 (v9)', '- Save system version update (v9)'],
        ['- 저장 시스템 버전 업데이트 (v8)', '- Save system version update (v8)'],
        ['- 저장 시스템 버전 업데이트 (v7)', '- Save system version update (v7)'],
        ['- 저장 시스템 버전 업데이트 (v6)', '- Save system version update (v6)'],
        ['- 저장 시스템 버전 업데이트 (v5)', '- Save system version update (v5)'],
        ['- 저장 시스템 버전 업데이트 (v4)', '- Save system version update (v4)'],
        ['- 저장 시스템 버전 업데이트 (v3)', '- Save system version update (v3)'],
        ['- 저장 시스템 버전 업데이트 (v2)', '- Save system version update (v2)'],
        ['- 저장 시스템 버전 업데이트 (v1)', '- Save system version update (v1)'],

        // ── 공용 단어 (다른 항목에서 이미 소비되지 않은 나머지에 적용되는 일반 대응) ──
        ['제거', 'Remove'], ['추가', 'Add'], ['삭제', 'Delete'], ['닫기', 'Close'], ['설정', 'Settings'],
        ['구성', 'Setup'], ['정보', 'Info'], ['이름', 'Name'], ['연도', 'Year'], ['기록', 'Record'],
        ['입법', 'Legislation'], ['전체', 'All'], ['없음', 'None'], ['연정', 'Coalition'],
        ['하원', 'House'], ['상원', 'Senate'], ['삼원', 'Third'], ['정당', 'Party'], ['의원', 'Members'],
        ['이념', 'Ideology'], ['당수', 'Leader'], ['기권', 'Abstain'], ['찬성', 'Yea'], ['반대', 'Nay'],
        ['의석', 'Seats'], ['지역구', 'District'], ['선거', 'Election'], ['무소속', 'Independent'], ['비례', 'Proportional'], ['필터', 'Filter'],
        ['개표', 'Counting'], ['국회', 'National Assembly'], ['회기', 'Session'], ['국가명', 'Nation Name'],
        ['현재:', 'Current:'], ['✕ 제거', '✕ Remove'], ['▶ 재개', '▶ Resume'],
        ['사진 업로드', 'Upload Photo'], ['가결 후 열림', 'Opens After Passage'],
        ['에서 부결된 법안은', ' — a bill rejected here'],

        // ── 보강: 최초 초안에서 누락되었던 항목들 (감사 결과 추가) ──
        // 날짜/회기 패턴 규칙이 "예: 1952년 3월 15일" 같은 문구 중 숫자 부분을 먼저 소비해버려서
        // 전체 문구용 사전 항목이 더 이상 매칭되지 않는 경우가 있으므로, 접두사만 별도로 대응.
        ['예: ', 'e.g. '],
        ['오후', 'PM'], ['오전', 'AM'], // toLocaleString('ko-KR')로 표시되는 마지막 저장 시각용
        ['집권 세력 강조 (HIGHLIGHT GOV)', 'Highlight Ruling Power (HIGHLIGHT GOV)'],
        ['표결일', 'Vote Date'], ['대수', 'Term'],
        ['선거 결과가 반영되었습니다.', 'Election results have been applied.'],
        ['파벌이 있는 정당의 파벌별 의석은 선거 전 분포가 무효화되어 0으로 초기화되었습니다.',
            'Faction-level seats for parties with factions have been invalidated and reset to 0, since the pre-election distribution no longer applies.'],
        ['정당 탭에서 파벌 의석을 다시 배분해 주세요.', 'Please redistribute faction seats in the Party tab.'],
        [' 개별 정보 없음 ', ' No individual info '],
        ['의석 수가 0입니다.', 'Seat count is 0.'],
        ['의회 설정에서 의석 수를 확인하세요.', 'Check the seat count in Parliament Settings.'],
        ['에서 부결된 법안은 삼원에 상정되지 않습니다.', ' — a bill rejected here is not brought to the Third floor.'],
        ['—기', '—Abs'],
        ['- 선거 시스템 추가', '- Added election system'],
        ['- UI 리워크', '- UI Rework'],
        ['선거결과', 'Election Results'],
        ['건)', ' items)'],
        ['과반', 'Majority'],
    ];

    // ===== 사전 치환 엔진 =====
    // 긴 문구가 짧은 부분 문자열보다 먼저 매칭되도록 길이 내림차순으로 정렬한 뒤
    // 하나의 정규식 alternation으로 합쳐 한 번에 치환한다 (겹치는 후보 중 먼저 오는 것이 우선됨).
    function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    const sortedDict = DICT.slice().sort((a, b) => b[0].length - a[0].length);
    const dictMap = new Map(sortedDict);
    const dictRegex = sortedDict.length
        ? new RegExp(sortedDict.map(p => escapeRe(p[0])).join('|'), 'g')
        : null;

    function translateString(s) {
        if (!s) return s;
        for (const [re, rep] of PATTERN_RULES) s = s.replace(re, rep);
        if (dictRegex) s = s.replace(dictRegex, m => dictMap.get(m) ?? m);
        return s;
    }

    function translateAttrs(el) {
        ['placeholder', 'title', 'alt'].forEach(attr => {
            if (el.hasAttribute && el.hasAttribute(attr)) {
                const v = el.getAttribute(attr);
                const t = translateString(v);
                if (t !== v) el.setAttribute(attr, t);
            }
        });
    }

    function translateNodeDeep(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const t = translateString(node.nodeValue);
            if (t !== node.nodeValue) node.nodeValue = t;
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return;
        translateAttrs(node);
        if (tag === 'TEXTAREA') return; // 텍스트에어리어 내용은 사용자가 입력한 법안 본문 — 번역하지 않음
        for (const child of Array.from(node.childNodes)) translateNodeDeep(child);
    }

    // 초기 화면 로드 시점에 한 번만 번역한다 (언어 설정은 localStorage에 있으므로,
    // 이후 새로 생성되는 동적 콘텐츠는 다음 새로고침 때 다시 이 시점에 맞춰 번역됨).
    // dno.js/roadmap.js의 자체 초기 렌더링(window.onload)이 끝난 뒤에 실행되도록
    // DOMContentLoaded가 아닌 load 이벤트에서 실행 — 두 스크립트 모두 lang.js보다 먼저
    // <script> 태그로 로드되므로 그쪽 onload 핸들러가 먼저 등록되어 항상 먼저 실행된다.
    function boot() {
        translateNodeDeep(document.documentElement);
    }

    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot);

    // alert()/confirm()도 번역 사전을 거치도록 감싼다 (동적으로 생성되는 메시지 문자열용)
    const _alert = window.alert, _confirm = window.confirm;
    window.alert = function (msg) { return _alert.call(window, translateString(String(msg))); };
    window.confirm = function (msg) { return _confirm.call(window, translateString(String(msg))); };
})();
