// 기본 제공 언어 팩: English — 형식은 커뮤니티 언어 팩(.json)과 똑같고, 데스크톱 앱(file://)에서도
// fetch 없이 읽을 수 있도록 JS로 감싸 두었다. 형식 설명은 README의 "번역(언어 팩) 만들기" 참고.
window.DnoLangPacks = window.DnoLangPacks || {};
window.DnoLangPacks.en = {
 "format": "dno-lang-pack@1",
 "code": "en",
 "name": "English",
 "author": "DATANET",
 "months": [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
 ],
 "ordinal": "en",
 "patterns": [
  {
   "re": "\"(.+?)\" 슬롯을 삭제할까요\\?\\n\\(연결된 \"(.+?) 자동저장\"도 함께 삭제됩니다\\)",
   "to": "Delete the save \"$1\"?\n(Its linked \"$2 Autosave\" will be deleted too)"
  },
  {
   "re": "\"(.+?)\" 슬롯이 이미 있습니다\\. 덮어쓸까요\\?",
   "to": "A save named \"$1\" already exists. Overwrite it?"
  },
  {
   "re": "\"(.+?)\" 슬롯을 불러올까요\\?\\n현재 화면의 저장하지 않은 변경사항은 사라집니다\\.",
   "to": "Load the save \"$1\"?\nUnsaved changes on the current screen will be lost."
  },
  {
   "re": "\"(.+?)\" 슬롯을 불러왔습니다\\.",
   "to": "Loaded the save \"$1\"."
  },
  {
   "re": "\"(.+?)\"은\\(는\\) 예약된 이름입니다\\. 다른 이름을 입력하세요\\.",
   "to": "\"$1\" is a reserved name. Please enter a different name."
  },
  {
   "re": "\"(.+?)\" 세이브가 이미 있습니다\\. 다른 이름을 입력하세요\\.",
   "to": "A save named \"$1\" already exists. Please enter a different name."
  },
  {
   "re": "\"(.+?)\" 언어 팩을 삭제할까요\\?",
   "to": "Delete the language pack \"$1\"?"
  },
  {
   "re": "\"(.+?)\" 언어 팩을 불러왔습니다\\. 지금 이 언어로 바꿀까요\\?",
   "to": "Loaded the language pack \"$1\". Switch to this language now?"
  },
  {
   "re": "\"(.+?)\" 도형을 지도에서 완전히 삭제합니다\\.\\n\\(배경/틀처럼 잘못 포함된 도형을 뺄 때 사용\\) 계속하시겠습니까\\?",
   "to": "The shape \"$1\" will be permanently removed from the map.\n(Use this to drop shapes such as backgrounds or frames that were included by mistake.) Continue?"
  },
  {
   "re": "선거 탭 > 지역구 체크박스에서 \"보궐\"을 선택하고 개표하면\\n이 지역구\\((.+?)\\)가 자동으로 대상에 포함됩니다\\.",
   "to": "Select \"By-election\" in the district checkboxes on the Election tab and run the count —\nthis district ($1) will be included automatically."
  },
  {
   "re": "^이 지역구를 궐석 처리하시겠습니까\\?\\n\\(보궐선거로 다시 채울 때까지 소속 정당 의석에서 1석 감소합니다\\)$",
   "to": "Vacate this district's seat?\n(The party loses 1 seat until it is refilled by a by-election)"
  },
  {
   "re": "^보궐선거 결과 \\((.+?)\\)\\n\\n",
   "to": "By-election results ($1)\n\n"
  },
  {
   "re": "\\n\\n의회>의원 탭에서 당선자 이름을 입력해 주세요\\.$",
   "to": "\n\nEnter the winners' names in Parliament > Members."
  },
  {
   "re": "^(.+?)에 대한 (.+?) 임명동의안이 국가 > 입법 탭에 상정되었습니다\\.$",
   "to": "A confirmation motion for $1 as {{map:$2|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}} has been placed on the floor in Nation > Legislation."
  },
  {
   "re": "^건설적 불신임안이 가결되어 (.+?)이\\(가\\) 새 (.+?)가 되었습니다\\.\\n기존 내각은 물러났으니 내각 > 내각에서 새 국무위원을 채워 주세요\\.$",
   "to": "The constructive no-confidence motion passed and $1 is the new {{map:$2|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}}.\nThe previous cabinet has stepped down — fill in new ministers in Cabinet > Cabinet."
  },
  {
   "re": "^(.+?)이\\(가\\) (.+?)으로 취임했습니다\\.$",
   "to": "$1 took office as {{map:$2|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}}."
  },
  {
   "re": "^(.+?)은 스스로 해제할 수 없습니다\\.\\n국가 > 선거 > 총선에서 새 선거를 반영해야 해제됩니다\\.$",
   "to": "{{map:$1|국가 비상사태=A State of Emergency;의회 해산=The Dissolution of Parliament;상원 해산=The Dissolution of the Senate;하원 해산=The Dissolution of the House;계엄령=Martial Law}} cannot be lifted by itself.\nIt is lifted once a new general election is applied in Nation > Election > General."
  },
  {
   "re": "^(.+?)을\\(를\\) 선포합니다\\. 계속하시겠습니까\\?$",
   "to": "Declare {{map:$1|국가 비상사태=a State of Emergency;의회 해산=the Dissolution of Parliament;상원 해산=the Dissolution of the Senate;하원 해산=the Dissolution of the House;계엄령=Martial Law}}. Continue?"
  },
  {
   "re": "^국무회의 표결 결과 — 찬성 (\\d+) · 반대 (\\d+) · 기권 (\\d+) \\(총 (\\d+)인\\)\\n\\n『(.+?)』이\\(가\\) (가결|부결)됩니다\\. 확정하시겠습니까\\?$",
   "to": "Cabinet vote — Yea $1 · Nay $2 · Abstain $3 (total $4)\n\n\"$5\" will be {{map:$6|가결=passed;부결=rejected}}. Confirm?"
  },
  {
   "re": "^『(.+?)』이\\(가\\) 국무회의 의결로 (가결|부결)되었습니다\\.$",
   "to": "\"$1\" was {{map:$2|가결=passed;부결=rejected}} by cabinet resolution."
  },
  {
   "re": "^(.+?)의 거부권을 행사해 이 법안을 최종 부결시킵니다\\. 계속하시겠습니까\\?$",
   "to": "Use the {{map:$1|총리=PM;국무총리=Premier;대통령=President;국왕=Monarch;내각=Cabinet}}'s veto to finally reject this bill. Continue?"
  },
  {
   "re": "^(.+?) 표결을 먼저 확정하세요\\.$",
   "to": "Finalize the $1 vote first."
  },
  {
   "re": "^(.+?)에서 부결된 법안은 (.+?)에 상정되지 않습니다\\.$",
   "to": "A bill rejected in the $1 is not sent to the $2."
  },
  {
   "re": "^새 총선이 반영되어 상원·하원 해산 상태가 모두 해제되었습니다\\.$",
   "to": "The new general election was applied — the dissolution of both the Senate and the House has been lifted."
  },
  {
   "re": "^새 총선이 반영되어 (.+?) 상태가 해제되었습니다\\.$",
   "to": "The new general election was applied — {{map:$1|국가 비상사태=a State of Emergency;의회 해산=the Dissolution of Parliament;상원 해산=the Dissolution of the Senate;하원 해산=the Dissolution of the House;계엄령=Martial Law}} has been lifted."
  },
  {
   "re": "^\\s*완료\\s*$",
   "to": "Done"
  },
  {
   "re": "^\\s*날짜\\s*$",
   "to": "Date"
  },
  {
   "re": "^\\s*저장\\s*$",
   "to": "Save"
  },
  {
   "re": "개\\s*\\|\\s*지역구를 클릭하면 의석 수·성향을 편집할 수 있습니다",
   "to": " | click a district to edit its seats and leanings"
  },
  {
   "re": "(#\\d+) · 내각\\s*$",
   "to": "$1 · Cabinet"
  },
  {
   "re": "^\\s*연\\s*$",
   "to": "Year"
  },
  {
   "re": "^\\s*월\\s*$",
   "to": "Month"
  },
  {
   "re": "^\\s*일\\s*$",
   "to": "Day"
  },
  {
   "re": "^\\s*색\\s*$",
   "to": "Color"
  },
  {
   "re": "^\\s*석\\s*$",
   "to": "seats"
  },
  {
   "re": "^\\s*(국회|하원|상원|삼원)만\\s*$",
   "to": "$1 only"
  },
  {
   "re": "(\\d{4})\\. (\\d{1,2})\\. (\\d{1,2})\\. (오전|오후) (\\d{1,2}):(\\d{2}):(\\d{2})",
   "to": "$1-$2-$3 $5:$6:$7 {{map:$4|오전=AM;오후=PM}}"
  },
  {
   "re": "마지막 저장\\((.+?)\\):",
   "to": "Last saved ($1):"
  },
  {
   "re": "기준: (.+?), (\\d+)석 필요",
   "to": "Threshold: $1, $2 seats needed"
  },
  {
   "re": "👑 다수당\\((.+?)\\) 대표 자동 반영",
   "to": "👑 Majority party ($1) leader applied automatically"
  },
  {
   "re": "현재 선출 방식: 다수당 방식 — 기준 원\\((.+?)\\)의 다수당 대표가 자동으로 (.+?)이 됩니다",
   "to": "Current method: majority — the majority party leader of the base chamber ($1) automatically becomes {{map:$2|총리=PM;국무총리=Premier}}"
  },
  {
   "re": "현재 선출 방식: 대통령 임명제 — 대통령이 후보를 지명하면 의회 심의를 거쳐 (.+?)으로 확정됩니다",
   "to": "Current method: presidential appointment — the president nominates a candidate and parliament confirms them as {{map:$2|총리=PM;국무총리=Premier}}"
  },
  {
   "re": "! (.+?) 선포됨 \\(총선으로만 해제\\) !",
   "to": "! $1 declared (lifted only by a general election) !"
  },
  {
   "re": "! (.+?) (선포|해제) !",
   "to": "! {{map:$2|선포=Declare;해제=Lift}}: $1 !"
  },
  {
   "re": "(\\d+)개 지역구 \\(SVG\\)",
   "to": "$1 districts (SVG)"
  },
  {
   "re": "(\\d+)석 초과 — 초과분은 화면에 안 보임",
   "to": "$1 seats over — the excess isn't shown"
  },
  {
   "re": "(\\d+)석 남음",
   "to": "$1 seats left"
  },
  {
   "re": "(\\d+)석이 비었어요\\.",
   "to": "$1 seats are now free."
  },
  {
   "re": "(\\d+)단계",
   "to": "$1 steps"
  },
  {
   "re": "이제 \"(.+?)\"의 의석 칸에 숫자를 넣어보세요\\. 남은 자리\\((\\d+)석\\)까지만 넣을 수 있어요\\.",
   "to": "Now enter a number in \"$1\"'s seat box. You can enter up to the free seats ($2)."
  },
  {
   "re": "이제 새 정당의 의석 칸에 숫자를 넣어보세요\\. 남은 자리\\((\\d+)석\\)까지만 넣을 수 있어요\\.",
   "to": "Now enter a number in the new party's seat box. You can enter up to the free seats ($1)."
  },
  {
   "re": "의회 › 구성의 \"배정 합계\"는 정당 의석을 모두 더한 값이고, 총 의석 수를 넘을 수 없습니다\\. 기존 정당들이 이미 (\\d+)석을 다 차지하고 있으면 새 정당이 앉을 자리가 없어요\\. 총 의석 수를 늘리거나\\(예: (\\d+)\\) 다른 정당 의석을 줄여 빈자리를 만들어 보세요\\.",
   "to": "\"Assigned total\" in Parliament › Composition is the sum of all party seats, and it can't exceed the total. If the existing parties already fill all $1 seats, there's no room for a new party. Raise the total (e.g. $2) or cut another party's seats to make room."
  },
  {
   "re": "의회 › 정당 › 당수에서 정당 대표를 정합니다\\. 다수당 \"(.+?)\"의 당수 이름을 적어보세요\\.",
   "to": "Party leaders are set in Parliament › Parties › Leaders. Enter a leader name for the majority party \"$1\"."
  },
  {
   "re": "의회 › 정당 › 당수에서 정당 대표를 정합니다\\. 다수당의 당수 이름을 적어보세요\\.",
   "to": "Party leaders are set in Parliament › Parties › Leaders. Enter a leader name for the majority party."
  },
  {
   "re": "다음은 (#\\d+) \"(.+?)\" \\((.+?)\\)입니다\\. 바로 이어서 하거나, 나중에 목차에서 골라 할 수 있어요\\.",
   "to": "Next up is $1 \"$2\" ($3). Continue right away, or pick it later from the lesson list."
  },
  {
   "re": "(#\\d+) 시작 →",
   "to": "Start $1 →"
  },
  {
   "re": "(#\\d+) 마치기",
   "to": "Finish $1"
  },
  {
   "re": "(#\\d+) (.+) 완료!",
   "to": "$1 $2 complete!"
  },
  {
   "re": "(\\d+) / (\\d+) 완료",
   "to": "$1 / $2 done"
  },
  {
   "re": "^\\s*도움말\\s*$",
   "to": "Help"
  },
  {
   "re": "^\\s*시각\\s*$",
   "to": "Visuals"
  },
  {
   "re": "^\\s*형식\\s*$",
   "to": "Format"
  },
  {
   "re": "^\\s*내보내기\\s*$",
   "to": "Export"
  },
  {
   "re": "^\\s*확인\\s*$",
   "to": "OK"
  },
  {
   "re": "^\\s*약칭\\s*$",
   "to": "Abbr."
  },
  {
   "re": "^\\s*선택\\s*$",
   "to": "Select"
  },
  {
   "re": "^\\s*활동중\\s*$",
   "to": "Active"
  },
  {
   "re": "^\\s*붙여넣기\\s*$",
   "to": "Paste"
  },
  {
   "re": "^\\s*상징\\s*$",
   "to": "Symbols"
  },
  {
   "re": "^\\s*의장단\\s*$",
   "to": "Presiding officers"
  },
  {
   "re": "^\\s*그리드\\s*$",
   "to": "Grid"
  },
  {
   "re": "^\\s*의결일\\s*$",
   "to": "Resolution date"
  },
  {
   "re": "^\\s*국무회의\\s*$",
   "to": "Cabinet Council"
  },
  {
   "re": "^\\s*대선\\s*$",
   "to": "Presidential"
  },
  {
   "re": "^\\s*총선\\s*$",
   "to": "General"
  },
  {
   "re": "^\\s*자동\\s*$",
   "to": "Auto"
  },
  {
   "re": "^\\s*대표제\\s*$",
   "to": "the-post"
  },
  {
   "re": "^\\s*됩니다\\.\\s*$",
   "to": "."
  },
  {
   "re": "^\\s*전국형\\s*$",
   "to": "National"
  },
  {
   "re": "^\\s*권역형\\s*$",
   "to": "Regional"
  },
  {
   "re": "^\\s*권역\\s*$",
   "to": "Regions"
  },
  {
   "re": "^\\s*여론\\s*$",
   "to": "Opinion"
  },
  {
   "re": "^\\s*대통령제\\s*$",
   "to": "Presidential"
  },
  {
   "re": "^\\s*이원\\s*$",
   "to": "Semi-"
  },
  {
   "re": "^\\s*집정부제\\s*$",
   "to": "presidential"
  },
  {
   "re": "^\\s*입헌\\s*$",
   "to": "Constitutional"
  },
  {
   "re": "^\\s*군주제\\s*$",
   "to": "monarchy"
  },
  {
   "re": "^\\s*집단\\s*$",
   "to": "Collective"
  },
  {
   "re": "^\\s*지도체제\\s*$",
   "to": "leadership"
  },
  {
   "re": "^\\s*국무총리\\s*$",
   "to": "Premier"
  },
  {
   "re": "^\\s*국무위원\\s*$",
   "to": "Cabinet member"
  },
  {
   "re": "^\\s*부총리\\s*$",
   "to": "Deputy PM"
  },
  {
   "re": "^\\s*장관\\s*$",
   "to": "Minister"
  },
  {
   "re": "^\\s*의회\\s*$",
   "to": "Parliament"
  },
  {
   "re": "^\\s*내각\\s*$",
   "to": "Cabinet"
  },
  {
   "re": "^\\s*대통령\\s*$",
   "to": "President"
  },
  {
   "re": "^\\s*총리\\s*$",
   "to": "PM"
  },
  {
   "re": "^\\s*지도\\s*$",
   "to": "Map"
  },
  {
   "re": "^\\s*의장\\s*$",
   "to": "Speaker"
  },
  {
   "re": "^\\s*남음\\s*$",
   "to": "left"
  },
  {
   "re": "^\\s*그만하기\\s*$",
   "to": "Quit"
  },
  {
   "re": "^\\s*끝내기\\s*$",
   "to": "Finish"
  },
  {
   "re": "^\\s*나중에\\s*$",
   "to": "Later"
  },
  {
   "re": "^\\s*목차\\s*$",
   "to": "Lessons"
  },
  {
   "re": "^\\s*이전\\s*$",
   "to": "Back"
  },
  {
   "re": "^\\s*다음\\s*$",
   "to": "Next"
  },
  {
   "re": "^\\s*건너뛰기\\s*$",
   "to": "Skip"
  },
  {
   "re": "^\\s*실행\\s*$",
   "to": "Run"
  },
  {
   "re": "^\\s*신당\\s*$",
   "to": "New Party"
  },
  {
   "re": "^\\s*세이브\\s*$",
   "to": "Save"
  },
  {
   "re": "^\\s*메뉴\\s*$",
   "to": "Menu"
  },
  {
   "re": "^\\s*왼쪽\\s*$",
   "to": "Left"
  },
  {
   "re": "^\\s*가운데\\s*$",
   "to": "Center"
  },
  {
   "re": "^\\s*공통\\s*$",
   "to": "General"
  },
  {
   "re": "^\\s*모바일\\s*$",
   "to": "Mobile"
  },
  {
   "re": "^\\s*됩니다\\.\\s*$",
   "to": "."
  },
  {
   "re": "^\\s*부의장\\s*$",
   "to": "Deputy speaker"
  },
  {
   "re": "(\\d+|\\?)년\\s*(\\d+|\\?)월\\s*(\\d+|\\?)일",
   "to": "{{month:$2}} $3, $1"
  },
  {
   "re": "제(\\d+|\\?)대\\s+(.+?)\\s+제(\\d+|\\?)회\\s+(정기회|임시회)",
   "to": "{{ordinal:$1}} $2, {{ordinal:$3}} {{map:$4|정기회=Regular Session;임시회=Extraordinary Session}}"
  },
  {
   "re": "(\\d+)석",
   "to": "$1 seats"
  },
  {
   "re": "(\\d+)칸",
   "to": "$1 cells"
  },
  {
   "re": "(\\d+)판",
   "to": "$1 round"
  },
  {
   "re": "예정된 점검: (.+?) ~ (.+?) \\(KST\\)",
   "to": "Scheduled maintenance: $1 – $2 (KST)"
  },
  {
   "re": "예정된 점검: (.+?) \\(KST\\)부터",
   "to": "Scheduled maintenance from $1 (KST)"
  },
  {
   "re": "저장 슬롯은 최대 (\\d+)개까지 만들 수 있습니다\\. 기존 (?:세이브를|슬롯을) 삭제한 뒤 다시 시도하세요\\.",
   "to": "You can have up to $1 saves. Delete an existing save and try again."
  }
 ],
 "dict": [
  [
   "국왕",
   "Monarch"
  ],
  [
   "계엄령",
   "Martial law"
  ],
  [
   "국가 비상사태",
   "State of Emergency"
  ],
  [
   "내보내기 중 오류가 발생했습니다: ",
   "An error occurred while exporting: "
  ],
  [
   "언어 팩을 불러오지 못했습니다: ",
   "Could not load the language pack: "
  ],
  [
   "먼저 총리 후보(이름 또는 의원 연결)를 지정하세요.",
   "Choose a PM nominee first (a name or a linked member)."
  ],
  [
   "건설적 불신임제에서는 후임 총리를 함께 지명해야 합니다.\n후임 총리 이름을 입력하세요.",
   "Under a constructive vote of no confidence, a successor PM must be named.\nEnter the successor PM's name."
  ],
  [
   "이미 선포된 해산의 대상은 바꿀 수 없습니다.\n총선을 반영해 해제한 뒤 다시 고르세요.",
   "The target of a dissolution already declared cannot be changed.\nApply a general election to lift it, then choose again."
  ],
  [
   "먼저 권한 주체를 지정하세요.",
   "Choose who holds this power first."
  ],
  [
   "의회 전체가 이미 해산된 상태에서는 해산권을 분할할 수 없습니다.\n총선을 반영해 해제한 뒤 다시 시도하세요.",
   "The dissolution power cannot be split while the whole parliament is dissolved.\nApply a general election to lift it and try again."
  ],
  [
   "상원 또는 하원이 이미 해산된 상태에서는 해산권 분할을 끌 수 없습니다.\n총선을 반영해 해제한 뒤 다시 시도하세요.",
   "Splitting the dissolution power cannot be turned off while the Senate or the House is dissolved.\nApply a general election to lift it and try again."
  ],
  [
   "계엄 해제 결의안이 국가 > 입법 탭에 자동으로 상정되었습니다.\n의회가 가결하면 계엄령이 해제됩니다.",
   "A resolution to lift martial law was automatically placed on the floor in Nation > Legislation.\nMartial law is lifted if parliament passes it."
  ],
  [
   "의회가 정지된 계엄령 상태에서만 사용할 수 있습니다.",
   "Only available under martial law while parliament is suspended."
  ],
  [
   "국무회의에 참여할 인원이 없습니다 (모든 자리가 공석입니다).",
   "There is no one to take part in the cabinet meeting (all positions are vacant)."
  ],
  [
   "표결한 국무위원이 없습니다.\n내각 디스플레이에서 각 인물의 찬성·반대·기권을 먼저 표시하세요.",
   "No cabinet member has voted.\nMark each person's Yea · Nay · Abstain in the cabinet display first."
  ],
  [
   "계엄령으로 의회가 정지된 상태에서는 표결을 진행할 수 없습니다.\n법안은 국무회의를 통해 통과시킬 수 있습니다.",
   "Votes cannot be held while parliament is suspended under martial law.\nBills can be passed through the cabinet meeting instead."
  ],
  [
   "계엄령으로 의회가 정지된 상태에서는 국회로 상정할 수 없습니다.",
   "Bills cannot be sent to parliament while it is suspended under martial law."
  ],
  [
   "프리셋을 불러오지 못했습니다.",
   "Could not load the preset."
  ],
  [
   "프리셋 데이터 형식이 올바르지 않습니다.",
   "The preset data format is invalid."
  ],
  [
   "새 세이브를 만들지 못했습니다.",
   "Could not create a new save."
  ],
  [
   "이 브라우저/환경에서는 자동저장(localStorage)을 사용할 수 없습니다.\n(예: 파일을 직접 열었거나, 브라우저의 저장소 차단 설정)",
   "Autosave (localStorage) is not available in this browser/environment.\n(e.g. the file was opened directly, or the browser blocks storage)"
  ],
  [
   "현재 자동저장 데이터를 삭제하고 처음 상태로 되돌리시겠습니까?\n(이름 붙여 저장한 슬롯과 다른 세이브의 자동저장에는 영향이 없습니다)",
   "Delete the current autosave data and reset to the initial state?\n(Named saves and other saves' autosaves are not affected)"
  ],
  [
   "이 브라우저/환경에서는 저장 슬롯(localStorage)을 사용할 수 없습니다.",
   "Save slots (localStorage) are not available in this browser/environment."
  ],
  [
   "저장할 이름을 입력하세요.",
   "Enter a name for the save."
  ],
  [
   "저장에 실패했습니다. (브라우저 저장 공간이 부족할 수 있습니다)",
   "Saving failed. (The browser may be out of storage space)"
  ],
  [
   "이름을 바꾸지 못했습니다. (브라우저 저장 공간이 부족할 수 있습니다)",
   "Could not rename. (The browser may be out of storage space)"
  ],
  [
   "세이브를 불러오지 못했습니다.",
   "Could not load the save."
  ],
  [
   "합당하려면 정당이 2개 이상 있어야 합니다.",
   "You need at least 2 parties to merge."
  ],
  [
   "기준 원에 참여 중인 정당이 없습니다. 정당 탭 또는 선거 > 설정 탭에서 기준 원을 확인하세요.",
   "No party takes part in the base chamber. Check the base chamber in the Party tab or Election > Settings."
  ],
  [
   "기존 지역구 데이터가 모두 새 지도로 대체됩니다.\n(이름·의석 수·성향·당선자 정보 포함) 계속하시겠습니까?",
   "All existing district data will be replaced by the new map.\n(Including names, seat counts, tendencies and winners) Continue?"
  ],
  [
   "맵 메이커에서 내보낸 .jsx 파일에서 지역구로 쓸 도형을 찾을 수 없습니다.",
   "No shapes usable as districts were found in the .jsx file exported from Map Maker."
  ],
  [
   "구 지역구(그리드) 방식으로 되돌립니다.\nSVG 지도로 만든 지역구/의석/성향/당선자 데이터가 모두 삭제됩니다. 계속하시겠습니까?",
   "Revert to the old (grid) districts.\nAll districts/seats/tendencies/winners made with the SVG map will be deleted. Continue?"
  ],
  [
   "모든 지역구의 이름을 초기화하시겠습니까? (지도 도형·의석 수·성향은 유지됩니다)",
   "Reset the names of all districts? (Map shapes, seat counts and tendencies are kept)"
  ],
  [
   "권역별 득표율이 없습니다.\n여론 > 권역 탭에서 권역을 만들고 지역구를 배정하거나(자동 집계), 득표율을 직접 입력하세요.",
   "There are no regional vote shares.\nCreate regions in Opinion > Regions and assign districts (automatic), or enter vote shares directly."
  ],
  [
   "언어 팩을 읽을 수 없습니다. (올바른 JSON 파일이 아닙니다)",
   "Could not read the language pack. (Not a valid JSON file)"
  ],
  [
   "번역 템플릿을 만들지 못했습니다.",
   "Could not create the translation template."
  ],
  [
   "원내대표 이름",
   "Floor leader name"
  ],
  [
   "원내대표",
   "Floor leader"
  ],
  [
   "예: 150000",
   "e.g. 150000"
  ],
  [
   "인구",
   "Population"
  ],
  [
   "총 인구",
   "Total population"
  ],
  [
   "⚙ 의회",
   "⚙ Parliament"
  ],
  [
   "🏛 국가",
   "🏛 Nation"
  ],
  [
   "🗳 여론",
   "🗳 Opinion"
  ],
  [
   "💾︎ 저장",
   "💾︎ Save"
  ],
  [
   "국가명 미설정",
   "Nation name not set"
  ],
  [
   "날짜 미설정",
   "Date not set"
  ],
  [
   "회기 미설정",
   "Session not set"
  ],
  [
   "클릭하여 국기 업로드",
   "Click to upload flag"
  ],
  [
   "✕ 국기 제거",
   "✕ Remove Flag"
  ],
  [
   "현재 날짜",
   "Current Date"
  ],
  [
   "국가명",
   "Nation Name"
  ],
  [
   "국기",
   "Flag"
  ],
  [
   "국가",
   "Nation"
  ],
  [
   "단원제",
   "Unicameral"
  ],
  [
   "양원제",
   "Bicameral"
  ],
  [
   "삼원제",
   "Tricameral"
  ],
  [
   "[+] 정당 추가",
   "[+] Add Party"
  ],
  [
   "[+] 연정 구성",
   "[+] Form Coalition"
  ],
  [
   "[+] 이념 추가",
   "[+] Add Ideology"
  ],
  [
   "+ 파벌 추가",
   "+ Add Faction"
  ],
  [
   "↗ 신당으로 분리",
   "↗ Split into New Party"
  ],
  [
   "↺ 자동정렬",
   "↺ Auto-sort"
  ],
  [
   " 당수 사진",
   " Leader Photo"
  ],
  [
   " 당 로고",
   " Party Logo"
  ],
  [
   " 정당 색 사용",
   " Use Party Color"
  ],
  [
   "정당 색 사용 중",
   "Using Party Color"
  ],
  [
   "당에 대한 설명을 입력하세요...",
   "Enter a description for the party..."
  ],
  [
   "placeholder=\"약칭\"",
   "placeholder=\"Abbr.\""
  ],
  [
   "정당 약자 표기 (예: SPD)",
   "Party abbreviation (e.g. SPD)"
  ],
  [
   "파벌명",
   "Faction name"
  ],
  [
   "파벌 당수 이름",
   "Faction leader name"
  ],
  [
   "정당명",
   "Party name"
  ],
  [
   "(이름 없음)",
   "(no name)"
  ],
  [
   "새 이념",
   "New Ideology"
  ],
  [
   "새 파벌",
   "New Faction"
  ],
  [
   "새 연정",
   "New Coalition"
  ],
  [
   "신당",
   "New Party"
  ],
  [
   "각외협력",
   "External Support"
  ],
  [
   "명칭 커스터마이징 (예: 신임과 보완, 보완과 신임 등)",
   "Customize the label (e.g. Confidence & Supply)"
  ],
  [
   "연정 없음 — 연정 탭에서 먼저 연정을 만드세요",
   "No coalition — create one first in the Coalition tab"
  ],
  [
   "단독 집권 (SINGLE PARTY RULE)",
   "Single-Party Rule (SINGLE PARTY RULE)"
  ],
  [
   "[✕] 무집권 상태",
   "[✕] No Ruling Power"
  ],
  [
   "\" 파벌을 신당으로 분리하시겠습니까?",
   "\" — split this faction into a new party?"
  ],
  [
   "신당:",
   "New party:"
  ],
  [
   "[배정된 정당 없음]",
   "[No parties assigned]"
  ],
  [
   "[무소속 이념/정당이 설정되어 있지 않습니다]",
   "[The independent ideology/party is not set up]"
  ],
  [
   "정당이 안 생성되는 버그 수정",
   "fixed a bug where parties failed to be created"
  ],
  [
   "원외정당 (",
   "Out-of-Parliament ("
  ],
  [
   "이념 미지정",
   "Ideology not set"
  ],
  [
   "[여소야대]",
   "[Divided Government]"
  ],
  [
   "[소수 MIN]",
   "[Minority MIN]"
  ],
  [
   "[과반 MAJ]",
   "[Majority MAJ]"
  ],
  [
   "[여당 GOV]",
   "[Ruling GOV]"
  ],
  [
   "상태:  활동 금지",
   "Status:  Banned"
  ],
  [
   "상태:  해산",
   "Status:  Dissolved"
  ],
  [
   ">활동 금지",
   ">Banned"
  ],
  [
   ">활동중",
   ">Active"
  ],
  [
   ">해산",
   ">Dissolved"
  ],
  [
   "활동 금지",
   "Banned"
  ],
  [
   "*해산됨*",
   "*Dissolved*"
  ],
  [
   "해산",
   "Dissolved"
  ],
  [
   "국가재건당",
   "National Reconstruction Party"
  ],
  [
   "개혁그룹",
   "Reform Group"
  ],
  [
   "민주당",
   "Democratic Party"
  ],
  [
   "사회당",
   "Socialist Party"
  ],
  [
   "국민전선",
   "National Front"
  ],
  [
   "혁명적 사회주의",
   "Revolutionary Socialism"
  ],
  [
   "국가사회주의",
   "National Socialism"
  ],
  [
   "사회주의",
   "Socialism"
  ],
  [
   "진보주의",
   "Progressivism"
  ],
  [
   "자유주의",
   "Liberalism"
  ],
  [
   "보수주의",
   "Conservatism"
  ],
  [
   "권위주의",
   "Authoritarianism"
  ],
  [
   "무당파",
   "Unaffiliated"
  ],
  [
   "여당",
   "Ruling Party"
  ],
  [
   "야당",
   "Opposition"
  ],
  [
   "삼원✔",
   "Third✔"
  ],
  [
   "삼원✘",
   "Third✘"
  ],
  [
   "하원✔",
   "House✔"
  ],
  [
   "하원✘",
   "House✘"
  ],
  [
   "상원✔",
   "Senate✔"
  ],
  [
   "상원✘",
   "Senate✘"
  ],
  [
   "· 상원",
   "· Senate"
  ],
  [
   "· 삼원",
   "· Third"
  ],
  [
   "석, 상원",
   " seats, Senate"
  ],
  [
   "기준:",
   "Threshold:"
  ],
  [
   "파벌:",
   "Faction:"
  ],
  [
   "연정:",
   "Coalition:"
  ],
  [
   "이념:",
   "Ideology:"
  ],
  [
   "정당:",
   "Party:"
  ],
  [
   "▌ 멤버 (",
   "▌ Members ("
  ],
  [
   "' 멤버 없음 '",
   "' No members '"
  ],
  [
   ")가 자동으로 대상에 포함됩니다.",
   ") is automatically included as the target."
  ],
  [
   "▌ 명칭",
   "▌ Name"
  ],
  [
   "▌ 종합",
   "▌ Overview"
  ],
  [
   "종합",
   "Overview"
  ],
  [
   "▌ 파벌",
   "▌ Factions"
  ],
  [
   "합계",
   "Total"
  ],
  [
   ";\">합계",
   ">Total"
  ],
  [
   "로고",
   "Logo"
  ],
  [
   "— 궐석",
   "— Vacant"
  ],
  [
   "국가재건특별법 제1조",
   "National Reconstruction Special Act, Article 1"
  ],
  [
   "국가 재건을 위해 필요한 모든 조치를 취할 수 있다.",
   "All measures necessary for national reconstruction may be taken."
  ],
  [
   "집행부는 의회의 동의 없이 긴급 법령을 발동할 수 있다.",
   "The executive may issue emergency decrees without the consent of Parliament."
  ],
  [
   "긴급",
   "Emergency"
  ],
  [
   "재건",
   "Reconstruction"
  ],
  [
   "의회 명칭",
   "Parliament Name"
  ],
  [
   "총 의석 수",
   "Total Seats"
  ],
  [
   "지정...",
   "Set..."
  ],
  [
   "궐석 처리된 지역구만 대상으로 다시 개표",
   "Recount only vacated districts"
  ],
  [
   "이 지역구를 궐석 처리하시겠습니까?",
   "Vacate this district's seat?"
  ],
  [
   "(보궐선거로 다시 채울 때까지 소속 정당 의석에서 1석 감소합니다)",
   "(Its party's seat count is reduced by 1 until refilled by a by-election)"
  ],
  [
   "[이 의원실에는 무소속 의석이 없습니다 — 의회>설정 탭에서 무소속 정당의 의석 수를 설정하세요]",
   "[This chamber has no independent seats — set the independent party's seat count in the Parliament > Settings tab]"
  ],
  [
   "궐석 처리된 지역구가 없습니다.",
   "No vacated districts."
  ],
  [
   "의회 > 의원 탭에서 궐석 처리를 먼저 진행하세요.",
   "Vacate a district first in the Parliament > Members tab."
  ],
  [
   "의회>의원 탭에서 당선자 이름을 입력해 주세요.",
   "Enter the winner's name in the Parliament > Members tab."
  ],
  [
   "의원 이름",
   "Member name"
  ],
  [
   "[지역구 당선 의원이 없습니다 — 지역구+비례 방식으로 선거를 진행하고 의회에 반영하면 여기 표시됩니다]",
   "[No elected district members — run an election in District+Proportional mode and apply it to Parliament to see them here]"
  ],
  [
   "↻ 의회 반영",
   "↻ Apply to Parliament"
  ],
  [
   "✔ 의회에 반영",
   "✔ Apply to Parliament"
  ],
  [
   "👁 보기",
   "👁 View"
  ],
  [
   "🔍 정보 보기",
   "🔍 View Info"
  ],
  [
   "통계 표시",
   "Show Stats"
  ],
  [
   "— 의석",
   "— seats"
  ],
  [
   "— 기권 (회색)",
   "— Abstain (gray)"
  ],
  [
   "↺ 재개표",
   "↺ Recount"
  ],
  [
   "↩ 개정:",
   "↩ Amendment:"
  ],
  [
   "좌석 정보",
   "Seat Info"
  ],
  [
   "(이름 미지정)",
   "(name not set)"
  ],
  [
   "#",
   "#"
  ],
  [
   "- 연정 멤버/각외협력 목록에서 개별 무소속 의원을 이름(또는 좌석번호)으로 표시하도록 개선",
   "- Coalition members/External Support lists now show individual independent members by name (or seat number)"
  ],
  [
   "예: 대게르만국",
   "e.g. Greater Germania"
  ],
  [
   "수동 진행형",
   "Manual Progression"
  ],
  [
   "단순형",
   "Simple"
  ],
  [
   "개별형",
   "Individual"
  ],
  [
   "정기회",
   "Regular Session"
  ],
  [
   "임시회",
   "Extraordinary Session"
  ],
  [
   "예: 1952년 3월 15일",
   "e.g. March 15, 1952"
  ],
  [
   "예: 제21대 국회 제1회 임시회",
   "e.g. 21st National Assembly, 1st Extraordinary Session"
  ],
  [
   "▶ 다음 회기",
   "▶ Next Session"
  ],
  [
   "+1개월",
   "+1mo"
  ],
  [
   "+7일",
   "+7d"
  ],
  [
   "+1일",
   "+1d"
  ],
  [
   "국회",
   "National Assembly"
  ],
  [
   "새 법안 작성 (NEW BILL)",
   "Draft New Bill (NEW BILL)"
  ],
  [
   "기존 법안 수정 (EDIT BILL)",
   "Edit Existing Bill (EDIT BILL)"
  ],
  [
   "태그 (쉼표로 구분, 예: 경제, 안보)",
   "Tags (comma-separated, e.g. Economy, Security)"
  ],
  [
   "법안 검색...",
   "Search bills..."
  ],
  [
   "기록 검색...",
   "Search records..."
  ],
  [
   "법안 제목...",
   "Bill title..."
  ],
  [
   "법안 내용을 입력하세요...",
   "Enter the bill's content..."
  ],
  [
   "-- 수정할 법안 선택 --",
   "-- Select a bill to edit --"
  ],
  [
   "-- 법안 선택 --",
   "-- Select Bill --"
  ],
  [
   "법안을 선택하세요...",
   "Select a bill..."
  ],
  [
   "[+] 법안 등록",
   "[+] Register Bill"
  ],
  [
   "[✔] 수정 저장",
   "[✔] Save Changes"
  ],
  [
   "심의 법안 선택 (SELECT BILL)",
   "Select Bill for Review (SELECT BILL)"
  ],
  [
   "정당 일괄 투표 (PARTY BULK)",
   "Bulk Party Vote (PARTY BULK)"
  ],
  [
   "-- 표결 대기 중 --",
   "-- Awaiting Vote --"
  ],
  [
   "[ 삼원 표결 결과 ]",
   "[ Third Vote Result ]"
  ],
  [
   "[ 상원 표결 결과 ]",
   "[ Senate Vote Result ]"
  ],
  [
   "[ 하원 표결 결과 ]",
   "[ House Vote Result ]"
  ],
  [
   "▶ 삼원 표결 확정",
   "▶ Confirm Third Vote"
  ],
  [
   "▶ 하원 표결 확정",
   "▶ Confirm House Vote"
  ],
  [
   "▶ 상원 표결 확정",
   "▶ Confirm Senate Vote"
  ],
  [
   "특별다수 (2/3 이상)",
   "Supermajority (2/3 or more)"
  ],
  [
   "과반 (재적 과반수)",
   "Majority (over half of members)"
  ],
  [
   "전원 일치",
   "Unanimous"
  ],
  [
   "전원일치",
   "Unanimous"
  ],
  [
   "특별다수(2/3)",
   "Supermajority (2/3)"
  ],
  [
   "가결 기준",
   "Passage Threshold"
  ],
  [
   "분자",
   "Numerator"
  ],
  [
   "분모",
   "Denominator"
  ],
  [
   "▲ 찬성 (초록)",
   "▲ Yea (green)"
  ],
  [
   "▼ 반대 (빨강)",
   "▼ Nay (red)"
  ],
  [
   "▲ 찬성",
   "▲ Yea"
  ],
  [
   "▼ 반대",
   "▼ Nay"
  ],
  [
   "▲찬",
   "▲Yea"
  ],
  [
   "▼반",
   "▼Nay"
  ],
  [
   "(찬",
   "(Yea"
  ],
  [
   "/반",
   "/Nay"
  ],
  [
   "/기",
   "/Abs"
  ],
  [
   "✔ 최종 가결",
   "✔ Finally Passed"
  ],
  [
   "✘ 최종 부결",
   "✘ Finally Rejected"
  ],
  [
   "✔ 가결 (",
   "✔ Passed ("
  ],
  [
   "✘ 부결 (",
   "✘ Rejected ("
  ],
  [
   "부결 —",
   "Rejected —"
  ],
  [
   "가결 확정됨",
   "Passage Confirmed"
  ],
  [
   "부결 확정됨",
   "Rejection Confirmed"
  ],
  [
   "결과 확정",
   "Result Confirmed"
  ],
  [
   "표결 확정",
   "Vote Confirmed"
  ],
  [
   "표결 기록 없음",
   "No vote record"
  ],
  [
   "📝 개정 대상:",
   "📝 Amending:"
  ],
  [
   "개정안 (",
   "Amendment ("
  ],
  [
   "개정안",
   "Amendment"
  ],
  [
   "▾ 세부 기록 (총",
   "▾ Detailed Records (Total"
  ],
  [
   "▾ 세부 기록",
   "▾ Detailed Records"
  ],
  [
   "가결된 법안만 개정안을 발의할 수 있습니다.",
   "Only passed bills can have amendments proposed."
  ],
  [
   "법안이 수정되었습니다.",
   "The bill has been updated."
  ],
  [
   "법안 제목을 입력하세요.",
   "Enter a bill title."
  ],
  [
   "심의할 법안을 먼저 선택하세요.",
   "Select a bill to review first."
  ],
  [
   "표결을 먼저 확정하세요.",
   "Confirm the vote first."
  ],
  [
   "대기 중인 법안이 없습니다",
   "No pending bills"
  ],
  [
   "완료된 법안이 없습니다",
   "No completed bills"
  ],
  [
   "검색 결과가 없습니다",
   "No search results"
  ],
  [
   "에서 부결된 법안은",
   " — a bill rejected here"
  ],
  [
   "에 상정되지 않습니다.",
   " is not brought to the floor."
  ],
  [
   "석 부족)",
   " seats short)"
  ],
  [
   "석 필요",
   " seats needed"
  ],
  [
   "석 = 실질",
   " seats = effective"
  ],
  [
   "석 + 비례",
   " seats + proportional"
  ],
  [
   "석 · 득표율",
   " seats · vote share"
  ],
  [
   "석 (",
   " seats ("
  ],
  [
   "석)",
   " seats)"
  ],
  [
   "— 의석",
   "— seats"
  ],
  [
   "미상정",
   "Not Tabled"
  ],
  [
   "대기 중",
   "Pending"
  ],
  [
   "제출",
   "Submit"
  ],
  [
   "상정",
   "Floor"
  ],
  [
   "표결",
   "Vote"
  ],
  [
   "취소",
   "Cancel"
  ],
  [
   "법안",
   "Bill"
  ],
  [
   "0.2.0 - 다중언어 프로젝트 시작",
   "0.2.0 - Multilingual Project Begins"
  ],
  [
   "성향 탭에서 설정한 지지도를 기반으로 각 지역구의 당선자를 결정합니다.",
   "Determines each district's winner based on the support levels set in the Tendency tab."
  ],
  [
   "의원실마다 정당 구성이 다를 수 있어 지지율을 독립적으로 설정합니다.",
   "Each chamber can have a different party makeup, so support rates are set independently."
  ],
  [
   "지역구는 성향 탭의 지지도로 결정, 비례는 아래 지지율로 결정",
   "Districts are decided by the Tendency tab's support levels; proportional seats by the support rate below"
  ],
  [
   "성향 데이터가 없는 지역구는 무작위로 배정됩니다.",
   "Districts without tendency data are assigned randomly."
  ],
  [
   "성향 맵은 우측 패널에서 확인 및 편집하세요",
   "Check and edit the tendency map in the right panel"
  ],
  [
   "각 지역구 결과에 추가되는 랜덤 변동",
   "Random variation added to each district's result"
  ],
  [
   "지역구 이름 (예: 종로구)",
   "District name (e.g. Jongno)"
  ],
  [
   "보궐 (궐석 지역구만 재선거)",
   "By-election (re-vote vacated districts only)"
  ],
  [
   "예: 1952년 3월 5일",
   "e.g. March 5, 1952"
  ],
  [
   "예: 제1회 총선거",
   "e.g. 1st General Election"
  ],
  [
   "선택 해제 (이동/확대만)",
   "Deselect (pan/zoom only)"
  ],
  [
   "하원 0칸 · 상원 0칸",
   "House 0 cells · Senate 0 cells"
  ],
  [
   "0석 (활성 지역구 수)",
   "0 seats (active districts)"
  ],
  [
   "상원 선거결과",
   "Senate Election Results"
  ],
  [
   "하원 선거결과",
   "House Election Results"
  ],
  [
   "삼원 선거결과",
   "Third Election Results"
  ],
  [
   "선택한 지역구",
   "Selected district"
  ],
  [
   "⏩ 즉시 완료",
   "⏩ Finish Instantly"
  ],
  [
   "전체에 반영",
   "Apply to All"
  ],
  [
   "지역구 설정",
   "District Settings"
  ],
  [
   "⏸ 일시정지",
   "⏸ Pause"
  ],
  [
   "전체 초기화",
   "Reset All"
  ],
  [
   "지역구 의석",
   "District Seats"
  ],
  [
   "선거 결과",
   "Election Results"
  ],
  [
   "편집 모드",
   "Edit Mode"
  ],
  [
   "선거 제목",
   "Election Title"
  ],
  [
   "선거 방식",
   "Election Method"
  ],
  [
   "개표 속도",
   "Count Speed"
  ],
  [
   "지역구 맵",
   "District Map"
  ],
  [
   "개표 시작",
   "Start Count"
  ],
  [
   "불러오기",
   "Load"
  ],
  [
   "지지율",
   "Support Rate"
  ],
  [
   "지지율 분포",
   "Support Rate Distribution"
  ],
  [
   "모드 선택 후 캔버스 의원 원 클릭 (정보 보기 모드는 투표를 바꾸지 않음)",
   "Select a mode, then click a seat dot on the canvas (Info mode does not change the vote)"
  ],
  [
   "클릭/드래그로 칸 편집 (이름 모드는 클릭만)",
   "Click/drag to edit cells (Name mode: click only)"
  ],
  [
   "휠: 확대/축소",
   "Wheel: zoom"
  ],
  [
   "휠클릭+드래그: 이동",
   "Wheel-click+drag: pan"
  ],
  [
   "투표 입력 모드",
   "Vote Input Mode"
  ],
  [
   "노이즈 (±%)",
   "Noise (±%)"
  ],
  [
   "지역구 탭에서 활성화된 지역구가 없습니다.",
   "No districts are active in the District tab."
  ],
  [
   "지역구를 먼저 추가하거나 비례 모드를 선택하세요.",
   "Add a district first, or switch to Proportional mode."
  ],
  [
   "지역구 선거 기록이 없어 배경만 표시됩니다",
   "No district election record — showing background only"
  ],
  [
   "선거 탭 > 지역구 체크박스에서 \"보궐\"을 선택하고 개표하면이 지역구(",
   "Selecting \"By-election\" in the district checkbox under the Election tab and running the count will fill this district ("
  ],
  [
   "지지율을 입력해 주세요.",
   "Please enter support rates."
  ],
  [
   "각 정당의 지지율(%) 칸에 숫자를 입력하세요.",
   "Enter a number in each party's support rate (%) field."
  ],
  [
   "[활성화된 지역구가 없습니다]",
   "[No active districts]"
  ],
  [
   "저장된 선거 기록이 없습니다",
   "No saved election records"
  ],
  [
   "시뮬레이션을 먼저 실행하세요",
   "Run the simulation first"
  ],
  [
   "설정된 지역구가 없습니다",
   "No districts set"
  ],
  [
   "정당별 세부 데이터 없음",
   "No per-party detail data"
  ],
  [
   "지역구를 먼저 설정하세요",
   "Set up districts first"
  ],
  [
   ">> 개표 중... <<",
   ">> Counting... <<"
  ],
  [
   ">> 개표 시작 <<",
   ">> Start Count <<"
  ],
  [
   ">-- 소속 없음 --",
   ">-- No Affiliation --"
  ],
  [
   "보궐선거 결과 (",
   "By-election Result ("
  ],
  [
   "개표 중... (",
   "Counting... ("
  ],
  [
   "개표 중...",
   "Counting..."
  ],
  [
   "무제 선거",
   "Untitled Election"
  ],
  [
   "정당명  지지율(%)  오차(±%)",
   "Party  Support Rate(%)  Margin(±%)"
  ],
  [
   "▌ 지역구 목록",
   "▌ District List"
  ],
  [
   "성향 맵",
   "Tendency Map"
  ],
  [
   "성향",
   "Tendency"
  ],
  [
   "강도",
   "Strength"
  ],
  [
   "비례",
   "Proportional"
  ],
  [
   "미투표",
   "Not Voted"
  ],
  [
   "반원",
   "Arc"
  ],
  [
   "꺼짐",
   "Off"
  ],
  [
   "✕ 저장 데이터 초기화",
   "✕ Reset Saved Data"
  ],
  [
   "파일로 저장",
   "Save to File"
  ],
  [
   "💾︎ 저장",
   "💾︎ Save"
  ],
  [
   "자동저장",
   "Autosave"
  ],
  [
   "자동저장됨",
   "Autosaved"
  ],
  [
   "자동저장된 데이터 없음",
   "No autosaved data"
  ],
  [
   "이 환경에서는 자동저장을 사용할 수 없음",
   "Autosave is not available in this environment"
  ],
  [
   "이 브라우저/환경에서는 자동저장(localStorage)을 사용할 수 없습니다.",
   "Autosave (localStorage) is not available in this browser/environment."
  ],
  [
   "(예: 파일을 직접 열었거나, 브라우저의 저장소 차단 설정)",
   "(e.g. the file was opened directly, or the browser blocks storage)"
  ],
  [
   "저장된 데이터를 모두 삭제하고 처음 상태로 되돌리시겠습니까?",
   "Delete all saved data and return to the initial state?"
  ],
  [
   "(파일로 저장한 .json 파일에는 영향이 없습니다)",
   "(Files you saved to disk are not affected)"
  ],
  [
   "마지막 저장:",
   "Last saved:"
  ],
  [
   "불러오기 실패: 저장 파일이 깨졌거나 형식이 다릅니다.",
   "Load failed: the save file is corrupted or in an unrecognized format."
  ],
  [
   "초기화",
   "Reset"
  ],
  [
   "1.5.0 - 지역구/비례 시스템 개편",
   "1.5.0 - District/Proportional System Overhaul"
  ],
  [
   "1.4.9 - 저장 리워크",
   "1.4.9 - Save Rework"
  ],
  [
   "1.4.8 - 의회 리워크 Part.II",
   "1.4.8 - Parliament Rework Part II"
  ],
  [
   "1.4.7 - 정당 리워크 Part.II",
   "1.4.7 - Party Rework Part II"
  ],
  [
   "1.4.6 - 기록 리워크",
   "1.4.6 - Records Rework"
  ],
  [
   "1.4.5 - 핫픽스",
   "1.4.5 - Hotfix"
  ],
  [
   "1.4.4 - 지역구 리워크",
   "1.4.4 - District Rework"
  ],
  [
   "1.4.3 - 정당 리워크 Part.I",
   "1.4.3 - Party Rework Part I"
  ],
  [
   "1.4.2 - 의회 리워크 Part.I",
   "1.4.2 - Parliament Rework Part I"
  ],
  [
   "1.4.1 - 연정 리워크",
   "1.4.1 - Coalition Rework"
  ],
  [
   "1.4.0 - 선거 리워크",
   "1.4.0 - Election Rework"
  ],
  [
   "1.3.4 - 선거 일부 리워크",
   "1.3.4 - Partial Election Rework"
  ],
  [
   "1.3.3 - 정당 탭 신설",
   "1.3.3 - Party Tab Added"
  ],
  [
   "1.3.2 - 버그 수정",
   "1.3.2 - Bug Fixes"
  ],
  [
   "1.3.1 - UI 리워크",
   "1.3.1 - UI Rework"
  ],
  [
   "1.3.0 - 선거 추가",
   "1.3.0 - Election Added"
  ],
  [
   "1.2.1 - 법안 보완",
   "1.2.1 - Bill Improvements"
  ],
  [
   "1.2.0 - 법안 추가",
   "1.2.0 - Bills Added"
  ],
  [
   "1.1.1 - 버그 수정",
   "1.1.1 - Bug Fixes"
  ],
  [
   "1.1.0 - 저장 추가",
   "1.1.0 - Save Added"
  ],
  [
   "1.0.0 - 프로젝트 시작",
   "1.0.0 - Project Begins"
  ],
  [
   "1.5.1 - 영어버전 출시",
   "1.5.1 - English Version Release"
  ],
  [
   "1.5.0 - 모바일 출시",
   "1.5.0 - Mobile Release"
  ],
  [
   "0.2.0 - 다중언어 프로젝트 시작",
   "0.2.0 - Multilingual Project Begins"
  ],
  [
   "0.1.4 - 프리릴리스 삭제",
   "0.1.4 - Pre-release Removed"
  ],
  [
   "0.1.3 - 버그 수정",
   "0.1.3 - Bug Fixes"
  ],
  [
   "0.1.2 - 선거 추가",
   "0.1.2 - Election Added"
  ],
  [
   "0.1.1 - 선거 삭제",
   "0.1.1 - Election Removed"
  ],
  [
   "0.1.0 - 선거 개발",
   "0.1.0 - Election Development"
  ],
  [
   "0.0.2 - TNO 테마",
   "0.0.2 - TNO Theme"
  ],
  [
   "0.0.1 - 일반 테마",
   "0.0.1 - General Theme"
  ],
  [
   "0.0.0 - 비공개 개발",
   "0.0.0 - Private Development"
  ],
  [
   "2027 출시",
   "2027 Release"
  ],
  [
   "- 저장 버전명 체계 변경 (v1.0부터 시작, 파일명도 dno-save-v1.0-... 형식으로 변경, KST 기준 타임스탬프)",
   "- Changed the save version naming scheme (starting from v1.0; filenames now use the dno-save-v1.0-... format with a KST timestamp)"
  ],
  [
   "- 날짜/회기 설정 추가 (회기 이름도 국회 외 다른 명칭으로 커스터마이즈 가능), 우측 디스플레이 패널 상단에 상시 표시",
   "- Added date/session settings (the session name can now be customized beyond just \"National Assembly\"), always shown at the top of the right display panel"
  ],
  [
   "- 선거 시스템 리워크 II (선거 > 지지율 탭 신설, \"전체에 반영\" 체크박스로 여러 원의 지지율 일괄 설정 지원)",
   "- Election system rework II (added Election > Support Rate tab; the \"Apply to All\" checkbox lets you batch-set support rates across chambers)"
  ],
  [
   "- 의회 시스템 리워크 III (원외정당 시스템 추가, 의원실별로 정확히 판정하도록 개선)",
   "- Parliament system rework III (added the out-of-parliament party system, now judged correctly per chamber)"
  ],
  [
   "- 좌석 정보 카드 추가 (호버 대신 클릭으로 확인, 무소속 이름·파벌·집권 세력 표기)",
   "- Added a seat info card (click instead of hover; shows independent name, faction, and ruling power)"
  ],
  [
   "- 저장 탭 신설 (자동저장 켜기/끄기, 저장 데이터 초기화, 파일로 저장/불러오기)",
   "- Added a Save tab (autosave on/off, reset saved data, save/load to file)"
  ],
  [
   "- 지지율 탭의 하원·상원·삼원 표기가 사용자 설정 명칭을 실시간으로 따르도록 수정",
   "- The Support Rate tab's House/Senate/Third labels now follow user-set chamber names live"
  ],
  [
   "- \"저장 시 사진 포함\" 체크박스 제거 (항상 사진을 포함하여 저장하도록 변경)",
   "- Removed the \"include photos when saving\" checkbox (photos are now always included)"
  ],
  [
   "- 입법기록 리워크 (개정안 발의, 법안 버전 표기, 표결 세부 타임라인 추가)",
   "- Legislative record rework (amendment proposals, bill version labels, detailed vote timeline)"
  ],
  [
   "- 실행 취소(Ctrl+Z) 및 다시 실행(Ctrl+Shift+Z) 기능 추가",
   "- Added undo (Ctrl+Z) and redo (Ctrl+Shift+Z)"
  ],
  [
   "- 국가 > 설정 신설에 맞춰 시작 화면 기본 탭을 국가 > 설정으로 변경",
   "- Changed the default landing tab to Nation > Settings, to match the new Nation > Settings tab"
  ],
  [
   "- 자동저장 기능 추가 (localStorage 기반, 새로고침해도 유지)",
   "- Added autosave (localStorage-based, persists across refreshes)"
  ],
  [
   "- 입법 시스템 리워크 (제출과 상정을 분리, 법안 수정 가능)",
   "- Legislation system rework (split Submit and Floor, bills can now be edited)"
  ],
  [
   "- 시작 화면 리워크 (점검 안내/자동 리디렉션 페이지로 전환)",
   "- Landing screen rework (switched to a maintenance-notice/auto-redirect page)"
  ],
  [
   "- 국가명·국기 설정 추가 (국가 > 설정, 헤더에 상시 표시)",
   "- Added nation name/flag settings (Nation > Settings, always shown in the header)"
  ],
  [
   "- 선거기록 리워크 (정당별 세부 기록, 저장 시각 표기 추가)",
   "- Election record rework (per-party detail records, saved-time labels)"
  ],
  [
   "- 최근 추가된 기능들이 저장/불러오기에 정확히 반영되도록 점검",
   "- Audited recently added features to ensure they're correctly saved/loaded"
  ],
  [
   "- 점검 기간 자동화 (자동으로 점검 안내 표시 및 리디렉션)",
   "- Automated maintenance windows (auto-shows the notice and redirects)"
  ],
  [
   "- 입법/표결 시스템 보완 (기준선, 비율 설정, 태그 추가)",
   "- Legislation/voting system improvements (thresholds, ratio settings, tags)"
  ],
  [
   "- 순서 시스템 리워크 (기존 화살표에서 슬라이딩 방식으로)",
   "- Reorder system rework (switched from arrows to drag-to-reorder)"
  ],
  [
   "- 정당 시스템 리워크 II (정당 해산/금지 표기 추가)",
   "- Party system rework II (added dissolved/banned party labels)"
  ],
  [
   "- 로드맵 카드 업데이트 로그가 길어지면 스크롤되도록 개선",
   "- Roadmap cards now scroll when their changelog gets long"
  ],
  [
   "- 기존 SAVE/LOAD 버튼 제거 (저장 탭으로 통합)",
   "- Removed the old SAVE/LOAD buttons (merged into the Save tab)"
  ],
  [
   "- 선거 시스템 리워크 I (지역구/지지율 시스템 추가)",
   "- Election system rework I (added district/support-rate systems)"
  ],
  [
   "- 선거 시스템 수정 (지역구 시스템 beta 추가)",
   "- Election system update (added district system beta)"
  ],
  [
   "- 정당/연정 카드 리워크 (카드 접기 기능 추가)",
   "- Party/coalition card rework (added card collapsing)"
  ],
  [
   "- 지역구 시스템 리워크 (지역구 이름 설정 추가)",
   "- District system rework (added district naming)"
  ],
  [
   "- 정당 시스템 리워크 I (무소속 로직 리워크)",
   "- Party system rework I (reworked independent logic)"
  ],
  [
   "- 툴팁이 화면 밖으로 벗어나지 않도록 위치 보정",
   "- Fixed tooltip positioning so it stays on-screen"
  ],
  [
   "- 의회 시스템 리워크 II (의석 번호 추가)",
   "- Parliament system rework II (added seat numbers)"
  ],
  [
   "- 입법 리워크 (개정안 및 법안에 버전 부여)",
   "- Legislation rework (versioning for amendments and bills)"
  ],
  [
   "- UI 리워크 (정당 순서 자동/수동 설정)",
   "- UI rework (auto/manual party ordering)"
  ],
  [
   "- 연정 시스템 리워크 (신임과 보완 추가)",
   "- Coalition system rework (added Confidence & Supply)"
  ],
  [
   "- 좌석 정보 카드에서 투표 상태 표기 제거",
   "- Removed vote-status labels from the seat info card"
  ],
  [
   "- 의회 시스템 리워크 I (삼원제 추가)",
   "- Parliament system rework I (added the tricameral system)"
  ],
  [
   "- 파벌 시스템 추가 (당 내 파벌 추가)",
   "- Added the faction system (factions within a party)"
  ],
  [
   "- 선거 기록에서 저장 시각 표기 제거",
   "- Removed the saved-time label from election records"
  ],
  [
   "- 좌석 호버 시 흰색 고리 표시 추가",
   "- Added a white ring on seat hover"
  ],
  [
   "- 정당이 안 생성되는 버그 수정",
   "- Fixed a bug where parties failed to be created"
  ],
  [
   "- 정당 탭 신설 및 기능 재편",
   "- Added a Party tab and reorganized its features"
  ],
  [
   "- 선거 시스템 개발 시도 II",
   "- Election System Development Attempt II"
  ],
  [
   "- 중위·하위 탭 디자인 정리",
   "- Cleaned up mid/lower tab design"
  ],
  [
   "- 선거 시스템 개발 시도 I",
   "- Election System Development Attempt I"
  ],
  [
   "- 저장/불러오기 시스템 추가",
   "- Added save/load system"
  ],
  [
   "- 당수 사진 및 이름 추가",
   "- Added leader photo and name"
  ],
  [
   "- 선거 시스템 개발 실패",
   "- Election System Development Failed"
  ],
  [
   "- 입법/표결 시스템 추가",
   "- Added legislation/voting system"
  ],
  [
   "- 선거 시스템 개발 완료",
   "- Election System Development Complete"
  ],
  [
   "- 시뮬레이션 개발 시작",
   "- Simulation Development Begins"
  ],
  [
   "- 버그 수정",
   "- Bug Fixes"
  ],
  [
   "- TNO 테마 추가",
   "- Added TNO theme"
  ],
  [
   "- 일반 테마 삭제",
   "- General Theme Removed"
  ],
  [
   "- 프리릴리스 시작",
   "- Pre-release Begins"
  ],
  [
   "- 사진 비율 조정",
   "- Adjusted photo aspect ratio"
  ],
  [
   "- 일반 테마 추가",
   "- Added general theme"
  ],
  [
   "- 정당 로고 추가",
   "- Added party logo"
  ],
  [
   "- 영어 번역 작업",
   "- English translation work"
  ],
  [
   "- 영어 추가",
   "- Added English"
  ],
  [
   "- 프리릴리스 중단",
   "- Pre-release Discontinued"
  ],
  [
   "- 프로젝트 공개",
   "- Project Made Public"
  ],
  [
   "- 프로젝트 시작",
   "- Project Begins"
  ],
  [
   "- 베타 생성",
   "- Beta Created"
  ],
  [
   "- 베타 삭제",
   "- Beta Removed"
  ],
  [
   "- 모바일 내에서도 구동 가능하도록 수정",
   "- Fixed to also run properly on mobile"
  ],
  [
   "- 로드맵 리워크 및 메인 화면 리워크",
   "- Roadmap rework and main screen rework"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v13)",
   "- Save system version update (v13)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v12)",
   "- Save system version update (v12)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v11)",
   "- Save system version update (v11)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v10)",
   "- Save system version update (v10)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v9)",
   "- Save system version update (v9)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v8)",
   "- Save system version update (v8)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v7)",
   "- Save system version update (v7)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v6)",
   "- Save system version update (v6)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v5)",
   "- Save system version update (v5)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v4)",
   "- Save system version update (v4)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v3)",
   "- Save system version update (v3)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v2)",
   "- Save system version update (v2)"
  ],
  [
   "- 저장 시스템 버전 업데이트 (v1)",
   "- Save system version update (v1)"
  ],
  [
   "제거",
   "Remove"
  ],
  [
   "추가",
   "Add"
  ],
  [
   "삭제",
   "Delete"
  ],
  [
   "닫기",
   "Close"
  ],
  [
   "설정",
   "Settings"
  ],
  [
   "구성",
   "Setup"
  ],
  [
   "정보",
   "Info"
  ],
  [
   "이름",
   "Name"
  ],
  [
   "연도",
   "Year"
  ],
  [
   "기록",
   "Record"
  ],
  [
   "입법",
   "Legislation"
  ],
  [
   "전체",
   "All"
  ],
  [
   "없음",
   "None"
  ],
  [
   "연정",
   "Coalition"
  ],
  [
   "하원",
   "House"
  ],
  [
   "상원",
   "Senate"
  ],
  [
   "삼원",
   "Third"
  ],
  [
   "정당",
   "Party"
  ],
  [
   "의원",
   "Members"
  ],
  [
   "이념",
   "Ideology"
  ],
  [
   "당수",
   "Leader"
  ],
  [
   "기권",
   "Abstain"
  ],
  [
   "찬성",
   "Yea"
  ],
  [
   "반대",
   "Nay"
  ],
  [
   "의석",
   "Seats"
  ],
  [
   "실행",
   "Run"
  ],
  [
   "ⓘ 도움말",
   "ⓘ Help"
  ],
  [
   "열기 →",
   "Open →"
  ],
  [
   "지역구",
   "District"
  ],
  [
   "선거",
   "Election"
  ],
  [
   "무소속",
   "Independent"
  ],
  [
   "비례",
   "Proportional"
  ],
  [
   "필터",
   "Filter"
  ],
  [
   "개표",
   "Counting"
  ],
  [
   "국회",
   "National Assembly"
  ],
  [
   "회기",
   "Session"
  ],
  [
   "국가명",
   "Nation Name"
  ],
  [
   "현재:",
   "Current:"
  ],
  [
   "✕ 제거",
   "✕ Remove"
  ],
  [
   "▶ 재개",
   "▶ Resume"
  ],
  [
   "사진 업로드",
   "Upload Photo"
  ],
  [
   "가결 후 열림",
   "Opens After Passage"
  ],
  [
   "에서 부결된 법안은",
   " — a bill rejected here"
  ],
  [
   "예: ",
   "e.g. "
  ],
  [
   "오후",
   "PM"
  ],
  [
   "오전",
   "AM"
  ],
  [
   "집권 세력 강조 (HIGHLIGHT GOV)",
   "Highlight Ruling Power (HIGHLIGHT GOV)"
  ],
  [
   "표결일",
   "Vote Date"
  ],
  [
   "대수",
   "Term"
  ],
  [
   "선거 결과가 반영되었습니다.",
   "Election results have been applied."
  ],
  [
   "파벌이 있는 정당의 파벌별 의석은 선거 전 분포가 무효화되어 0으로 초기화되었습니다.",
   "Faction-level seats for parties with factions have been invalidated and reset to 0, since the pre-election distribution no longer applies."
  ],
  [
   "정당 탭에서 파벌 의석을 다시 배분해 주세요.",
   "Please redistribute faction seats in the Party tab."
  ],
  [
   " 개별 정보 없음 ",
   " No individual info "
  ],
  [
   "의석 수가 0입니다.",
   "Seat count is 0."
  ],
  [
   "의회 설정에서 의석 수를 확인하세요.",
   "Check the seat count in Parliament Settings."
  ],
  [
   "에서 부결된 법안은 삼원에 상정되지 않습니다.",
   " — a bill rejected here is not brought to the Third floor."
  ],
  [
   "—기",
   "—Abs"
  ],
  [
   "- 선거 시스템 추가",
   "- Added election system"
  ],
  [
   "- UI 리워크",
   "- UI Rework"
  ],
  [
   "선거결과",
   "Election Results"
  ],
  [
   "건)",
   " items)"
  ],
  [
   "과반",
   "Majority"
  ],
  [
   "언어 팩 불러오기 (.json)",
   "Import Language Pack (.json)"
  ],
  [
   "번역 템플릿 받기",
   "Download Translation Template"
  ],
  [
   "바꾼 언어는 각 화면을 다시 열 때 적용됩니다. 다른 사람이 만든 언어 팩(.json)을 불러와 쓸 수 있고, 번역 템플릿으로 새 언어를 만들 수 있습니다.",
   "A new language applies when each screen is reopened. You can import language packs (.json) made by others, or create a new language from the translation template."
  ],
  [
   "언어 팩 삭제",
   "Delete language pack"
  ],
  [
   "[⇄] 합당 (흡수합당 · 신설합당)",
   "[⇄] Merge Parties (Absorption · New Party)"
  ],
  [
   "신설합당 (새 정당 창당)",
   "New-Party Merger"
  ],
  [
   "흡수합당",
   "Absorption Merger"
  ],
  [
   "존속 정당",
   "Surviving Party"
  ],
  [
   "흡수될 정당",
   "Parties to Absorb"
  ],
  [
   "새 정당 이름",
   "New Party Name"
  ],
  [
   "흡수되는 정당을 계파로 남기기",
   "Keep absorbed parties as factions"
  ],
  [
   "합당",
   "Merge"
  ],
  [
   "프로토콜 실행",
   "Execute Protocol"
  ],
  [
   "로드맵 및 업데이트 내역 보기",
   "View Roadmap & Update History"
  ],
  [
   "새로 시작",
   "Start New"
  ],
  [
   "빈 세이브",
   "Blank Save"
  ],
  [
   "예: 2차 총선 직후",
   "e.g. Right after the 2nd general election"
  ],
  [
   "생성 후 시작",
   "Create & Start"
  ],
  [
   "프리셋 — 고르면 복사본이 새 세이브로 만들어집니다",
   "Presets — picking one creates a copy as a new save"
  ],
  [
   "튜토리얼 공화국",
   "Tutorial Republic"
  ],
  [
   "튜토리얼",
   "Tutorial"
  ],
  [
   "처음이라면 여기서 시작하세요 — 가상의 나라에서 짧은 과정(#1~#5)으로 나눠 화면 구성과 기본 조작을 직접 해보며 배웁니다.",
   "New here? Start here — learn the layout and basic controls hands-on in a fictional country, in short lessons (#1–#5)."
  ],
  [
   "이어하기",
   "Continue"
  ],
  [
   "세이브 검색",
   "Search saves"
  ],
  [
   "저장된 세이브가 없습니다. 왼쪽에서 새로 시작하세요.",
   "No saves yet. Start a new one on the left."
  ],
  [
   "저장 파일(.json) 불러오기",
   "Load save file (.json)"
  ],
  [
   "검색 결과가 없습니다.",
   "No results."
  ],
  [
   "등록된 프리셋이 없습니다.",
   "No presets available."
  ],
  [
   "불러오는 중...",
   "Loading..."
  ],
  [
   "새 의회 (1)",
   "New Parliament (1)"
  ],
  [
   "즐겨찾기 해제",
   "Remove from favorites"
  ],
  [
   "즐겨찾기",
   "Favorite"
  ],
  [
   "세이브 이름을 입력하세요.",
   "Enter a save name."
  ],
  [
   "세이브가 이미 있습니다. 다른 이름을 입력하세요.",
   "save already exists. Please enter a different name."
  ],
  [
   "은(는) 예약된 이름입니다. 다른 이름을 입력하세요.",
   " is a reserved name. Please enter a different name."
  ],
  [
   "저장 파일을 불러올 수 없습니다. (형식이 올바르지 않거나 손상된 파일)",
   "Couldn't load the save file. (Invalid format or corrupted file)"
  ],
  [
   "- 설정에 데스크톱(가로형)/모바일(세로형) UI 모드 추가, 모바일 전용 레이아웃 및 좌우 패널 전환 버튼 신설",
   "- Added Desktop (landscape) / Mobile (portrait) UI modes to Settings, with a mobile-only layout and buttons to switch between the left and right panels"
  ],
  [
   "- 의회 > 구성 정당 카드 UI 개편 (로고 + 이름·상태 / 이념·의석 2행 레이아웃)",
   "- Redesigned the party cards in Parliament > Composition (logo + name/status / ideology/seats two-row layout)"
  ],
  [
   "- 활동 금지된 정당은 표결·과반 계산에서 제외되고, 좌석 클릭 및 일괄 투표가 차단되도록 수정",
   "- Banned parties are now excluded from votes and majority calculations, and seat clicks and bulk voting are blocked for them"
  ],
  [
   "- 각외협력을 다른 연정 소속 정당도 설정할 수 있도록 개선",
   "- Parties belonging to another coalition can now also be set as confidence-and-supply partners"
  ],
  [
   "- 순서 변경(⋮⋮) 핸들이 모바일 터치 드래그로도 동작하도록 수정",
   "- The reorder (⋮⋮) handle now works with touch dragging on mobile"
  ],
  [
   "- 의회 > 의원 탭을 지역구 당선자 전용으로 분리하고, 의회 > 비례 탭을 신설해 정당별 비례 의석을 개별 명단으로 관리 (무소속의 비례 당선도 지원)",
   "- Split Parliament > Members into a district-winners-only tab and added a new Parliament > List tab to manage each party's proportional seats as an individual roster (independents can also win list seats)"
  ],
  [
   "- 의회 > 의원 / 비례 탭에 검색(이름·#좌석번호) 및 정당·이념 다중 선택 필터 팝업 추가, 좌석 번호 표시",
   "- Added search (name / #seat number) and a multi-select party/ideology filter popup to the Members / List tabs, and show seat numbers"
  ],
  [
   "- 지역구 맵 미리보기 크기를 편집 화면과 동일하게 확대",
   "- Enlarged the district map preview to match the editing screen"
  ],
  [
   "- 파일명 체계 정리 (main/dno/roadmap/settings/teaser) 및 저장 파일 버전 v1.1로 업데이트",
   "- Cleaned up file names (main/dno/roadmap/settings/teaser) and updated the save file version to v1.1"
  ],
  [
   "- 지역구/비례 의원 카드에도 (무소속이 아니어도) 사진을 등록할 수 있도록 개선",
   "- District and list member cards can now have photos too (not only independents)"
  ],
  [
   "- 디스플레이 탭 바 구분선을 모바일 화면에서만 표시하도록 수정하고, 탭 버튼과 구분선이 붙어 보이도록 여백 제거",
   "- The display tab bar divider now shows only on mobile, and removed the gap so tab buttons sit flush against it"
  ],
  [
   "- 반원 중앙에 의석 수 대신 각 원(하원/상원/삼원)의 로고를 표시하는 기능 추가, 국가 > 설정에서 의석 수/로고 전환 버튼과 로고 업로드란 신설 (의석 수 입력은 기존대로 의회 > 구성에 유지)",
   "- Added the option to show each chamber's logo (House/Senate/Third) in the middle of the hemicycle instead of the seat count, with a seat-count/logo toggle and logo upload in Nation > Settings (seat counts are still entered in Parliament > Composition)"
  ],
  [
   "- 로고 업로드란 클릭 시 파일 선택창이 뜨지 않던 문제, 로고 표시 크기 및 위치(반원 중앙 하단 정렬) 조정",
   "- Fixed the logo upload box not opening the file picker, and adjusted the logo's size and position (bottom-centered in the hemicycle)"
  ],
  [
   "- 로드맵 페이지 접속 시 항상 1.4 항목이 열리던 문제 수정 (진행 중인 최신 버전이 자동으로 열리도록 개선)",
   "- Fixed the roadmap always opening on 1.4 (it now opens the latest version in progress)"
  ],
  [
   "- 여러 의원실을 한 번에 개표한 뒤 \"의회 반영\"을 눌러도 마지막 의원실만 지역구 당선자 정보가 반영되고 나머지 의원실은 당선자가 표시되지 않던 문제 수정",
   "- Fixed an issue where, after counting several chambers at once, \"Apply to Parliament\" only applied district winners to the last chamber and left the others without winners"
  ],
  [
   "- 버그 수정 (정당 정보 재정렬 시 초기화 문제, 파벌 당수 이름 미반영 문제, 의회 구성 변경 시 비례 탭 내부 탭이 갱신되지 않던 문제 등)",
   "- Bug fixes (party info resetting when reordered, faction leader names not applying, List tab's inner tabs not updating when the chamber setup changed, and more)"
  ],
  [
   "- 맵 메이커(구 맵 메이커, MINISTRY OF TRANSPORT)에서 만든 실제 지도 모양의 지역구를 .jsx로 내보내고, 지역구 탭에서 업로드해 하원·상원·삼원이 하나의 지도를 공유하는 \"지도\" 지역구 시스템 추가",
   "- Added the \"Map\" district system: export real map-shaped districts from the Map Maker (formerly MINISTRY OF TRANSPORT) as .jsx and upload them in the District tab, with the House, Senate and Third chamber sharing one map"
  ],
  [
   "- 지역구별로 원별 의석 수를 따로 지정할 수 있고, 도형을 클릭하면 이름·약칭·의석 수를 편집 가능 (약칭을 지정하면 지도 위 도형 가운데에 표시)",
   "- Each district can have its own seat count per chamber, and clicking a shape lets you edit its name, abbreviation and seats (the abbreviation is shown in the middle of the shape)"
  ],
  [
   "- 정당별 성향(%)은 지역구 탭이 아닌 성향 탭에서 지도를 직접 클릭해 편집하도록 이동, 육각형 방식과 달리 원(하원/상원/삼원)별로 독립된 성향 데이터를 가짐",
   "- Party leanings (%) are now edited by clicking the map in the Tendency tab instead of the District tab, and unlike the hex system each chamber (House/Senate/Third) has its own leaning data"
  ],
  [
   "- 국가 > 설정에 \"지역구 시스템\" 전환 토글 추가 (기본값 육각형, 지도로 전환 시 기존 구 지역구 탭이 지도 편집용으로 대체됨)",
   "- Added a \"District system\" toggle to Nation > Settings (default hex; switching to Map replaces the old District tab with map editing)"
  ],
  [
   "- 지도 지역구의 의석이 여러 개면 더 이상 한 정당이 전부 가져가지 않고, 비례 의석과 같은 최대잔여법으로 지역구 안에서도 여러 정당이 나눠 가지도록 개표 방식 개편, 개표 결과 지도에 정당별 획득 의석 수 배지 표시",
   "- Multi-seat map districts no longer go entirely to one party — seats are split among parties within the district using the largest remainder method (like list seats), and the result map shows each party's seats as badges"
  ],
  [
   "- 성향 종합 지도와 개표 결과 지도 모두, 1위가 여러 정당으로 동률(경합)이면 빗금 무늬로 표시하고, 단독 1위는 득표율이 높을수록 정당 고유색에 가깝게, 낮을수록 흰색에 가깝게 표시",
   "- On both the overall tendency map and the result map, ties for first place are shown with hatching, and a sole leader is shown closer to the party color the higher its share (closer to white when lower)"
  ],
  [
   "- 지도 업로드 시 배경/틀로 잘못 포함된 거대한 도형이 지역구들을 한쪽에 몰아넣던 문제, 도형 좌표 규모가 저장된 값과 달라 지역구가 안 보이던 문제 수정 (자동 경계상자 보정 + 이상치 도형 제외), 잘못 섞인 도형을 지도에서 직접 삭제하는 기능 추가",
   "- Fixed huge background/frame shapes squeezing districts into a corner on upload, and districts disappearing when shape coordinates didn't match the saved scale (automatic bounding-box correction + outlier exclusion); added deleting stray shapes directly on the map"
  ],
  [
   "- 지도 지역구 테두리 색을 자유롭게 지정하고, 설정에서 고른 테마 색과 동기화하는 기능 추가",
   "- Map district border colors can be set freely or synced with the theme color chosen in Settings"
  ],
  [
   "- 설정에 테마 색(강조색) 선택 기능 신설 (HEX 직접 입력, 기본값 초기화, 다른 탭에도 실시간 반영), 그동안 특정 화면에서만 고정 청록색으로 하드코딩돼 있던 옅은 배경/그림자 색상들도 모두 테마 색을 따라가도록 수정",
   "- Added a theme (accent) color picker to Settings (direct HEX input, reset to default, applied live across tabs), and faint backgrounds/shadows that were hard-coded cyan on some screens now follow the theme color"
  ],
  [
   "- 정당·이념·연정·지역구 목록의 순서 변경(⋮⋮) 드래그가 카드를 포인터 위치까지 끌고 가다가 갑자기 맨 위로 튕기던 문제, 정당 목록을 드래그로 옮겨도 이념순 자동정렬이 되돌리던 문제 수정",
   "- Fixed reorder (⋮⋮) dragging in party/ideology/coalition/district lists suddenly jumping to the top, and ideology auto-sort undoing manual party reordering"
  ],
  [
   "- 캔버스/SVG 우클릭 시 뜨는 \"내보내기...\" 메뉴 신설 — 반원·지역구 지도 등 모든 시각화를 PNG/JPG/SVG 형식으로 다운로드 가능",
   "- Added an \"Export...\" menu on right-clicking any canvas/SVG — download every visualization (hemicycle, district maps, etc.) as PNG/JPG/SVG"
  ],
  [
   "- 내보내기 창에 \"아래 의석 수 등 통계 포함\" 체크박스 추가, 실제 화면과 동일한 카드 디자인(색상 띠·이름·의석·%·상태 태그·범례)으로 재현 (SVG는 실제 DOM을 그대로 담아 픽셀 단위로 동일, PNG/JPG는 캔버스 도형으로 재구성)",
   "- Added an \"Include stats below (seat counts, etc.)\" checkbox to the export dialog, reproducing the on-screen card design (color strip, name, seats, %, status tags, legend) — SVG embeds the real DOM pixel-for-pixel, PNG/JPG are rebuilt as canvas shapes"
  ],
  [
   "- 통계 포함 내보내기에 \"무소속 펼치기\"(개별 의원 명단 표시), \"원외정당 포함하기\"(의석 0 seats 정당도 포함), \"당수/로고 사진 포함\" 세부 옵션 추가 — 모두 화면 실제 접힘 상태에는 영향 없이 내보내기에만 반영",
   "- Added detail options to exports with stats: \"Expand independents\" (list individual members), \"Include extra-parliamentary parties\" (parties with 0 seats) and \"Include leader/logo photos\" — these only affect the export, not the on-screen collapsed state"
  ],
  [
   "- 내보내기 창에 \"최상단에 포함\" 옵션(국기/국가 이름/날짜/회기) 추가 — 체크한 항목만 레터헤드 형태로 이미지 맨 위에 표시",
   "- Added \"Include at top\" options to the export dialog (flag / nation name / date / session) — checked items appear as a letterhead at the top of the image"
  ],
  [
   "- 모든 체크박스를 브라우저 기본 모양 대신 네온 테두리의 박스형 체크로 교체",
   "- Replaced all checkboxes with neon-bordered box checks instead of the browser default"
  ],
  [
   "- 의석 현황 화면 우측 상단 날짜/회기 표시를 두 줄로 나누고 날짜를 회기보다 밝게 표시하도록 변경 (내보내기 헤더와 동일한 스타일)",
   "- Split the date/session display at the top right of the seat screen into two lines with the date brighter than the session (same style as the export header)"
  ],
  [
   "- 반원 중앙에 로고를 표시할 때 직사각형 로고까지 정사각형으로 늘려 원형으로 잘라내던 문제 수정 — 정사각형/원형 로고는 기존과 동일하게, 그 외 비율은 원본 비율을 유지한 채 표시",
   "- Fixed rectangular logos being stretched square and cropped into a circle in the middle of the hemicycle — square/round logos look the same as before, other shapes keep their original aspect ratio"
  ],
  [
   "- 좌석 클릭 시 뜨는 정보 창에 각외협력 관계가 전혀 표시되지 않던 문제 수정",
   "- Fixed confidence-and-supply relationships never showing in the seat info window"
  ],
  [
   "- 무소속 의원 개개인에게 활동중/활동 금지 상태 지정 기능 추가 — 과반 계산·좌석 정보 창·통계 카드에 정당과 동일하게 반영",
   "- Individual independent members can now be set Active/Banned — reflected in majority calculations, the seat info window and stat cards just like parties"
  ],
  [
   "- 지역구 시스템 기본값을 육각형에서 지도로 변경, \"육각형\"을 \"그리드\"로 이름 변경 및 선택 버튼 순서를 지도·그리드 순으로 조정",
   "- Changed the default district system from hex to Map, renamed \"Hex\" to \"Grid\", and reordered the buttons to Map, Grid"
  ],
  [
   "- 활동 금지된 정당은 지지율 탭에서 입력이 비활성화되고 살짝 흐리게 표시되며 이름 옆에 네온 스타일 \"활동 금지\" 배지가 붙음 (수치는 저장은 되지만) — 지지율 분포 및 차기 선거 의석 배분 계산에서는 실제로 반영되지 않도록 수정",
   "- Banned parties have their inputs disabled and slightly dimmed in the Support tab with a neon \"Banned\" badge next to the name (values are still saved) — they are no longer counted in the support distribution or next-election seat allocation"
  ],
  [
   "- 상위 탭의 \"저장\"을 없애고 국가 > 설정 최하단으로 이동, 그 자리에 \"내각\" 탭 신설 (Coming Soon)",
   "- Removed \"Save\" from the top tabs and moved it to the bottom of Nation > Settings; added a \"Cabinet\" tab in its place (Coming Soon)"
  ],
  [
   "- 지역구 지도(SVG)에도 육각형 지도와 동일하게 이동/확대 기능 추가 — 휠클릭 드래그로 이동, Shift+스크롤로 확대/축소, 위치 초기화 버튼",
   "- Added pan/zoom to the district map (SVG) like the hex map — middle-click drag to pan, Shift+scroll to zoom, and a reset-position button"
  ],
  [
   "- 상단 고정바에 있던 단원제/양원제/삼원제 선택 버튼을 국가 > 설정으로 이동",
   "- Moved the unicameral/bicameral/tricameral buttons from the fixed top bar to Nation > Settings"
  ],
  [
   "- 국가 > 설정을 의회/상징/날짜/저장 4개 내부 탭으로 분리하고 기존 설정 항목들을 재배치, 의회 탭에 각 원(하원/상원/삼원)의 의장·부의장 사진·이름 설정 기능 신설",
   "- Split Nation > Settings into four inner tabs (Parliament / Symbols / Date / Save), rearranged the existing options, and added speaker and deputy speaker photos/names for each chamber in the Parliament tab"
  ],
  [
   "- \"내각\" 탭 신설 (설정/대통령/총리/내각 4개 하위 탭)",
   "- Added the \"Cabinet\" tab (four sub-tabs: Settings / President / Prime Minister / Cabinet)"
  ],
  [
   "· 설정: 정부 형태(대통령제/이원집정부제/의원내각제) 지정",
   "· Settings: choose the form of government (presidential / semi-presidential / parliamentary)"
  ],
  [
   "· 설정: 법안 거부권 주체(없음/대통령/총리) 지정 및 표결 시스템에 통합 — 모든 원을 통과한 법안은 거부권자의 서명을 거쳐야 최종 가결되며, 거부 시 별도로 부결 처리 (서명 대기/거부됨 상태 및 기록 탭 액션 버튼 추가)",
   "· Settings: choose who holds the bill veto (none / president / PM), integrated into voting — bills that pass every chamber need the veto holder's signature to finally pass and are rejected separately if vetoed (added Awaiting signature / Vetoed states and action buttons in the Records tab)"
  ],
  [
   "· 설정: 국가 비상사태(노랑)·의회 해산(주황)·계엄령(빨강) 각각 권한 주체 지정 및 선포/해제 기능, 선포 시 네온 스타일 \"! OO !\" 경고 배지 표시",
   "· Settings: assign who holds the state of emergency (yellow), dissolution (orange) and martial law (red) powers, with declare/lift actions and a neon \"! XX !\" warning badge when declared"
  ],
  [
   "· 대통령/총리: 사진·이름 설정 (정당 지도자와 동일한 카드 UI)",
   "· President / PM: set photo and name (same card UI as party leaders)"
  ],
  [
   "· 내각: 국무위원(사진·이름·직책) 추가/수정/삭제",
   "· Cabinet: add/edit/remove ministers (photo, name, position)"
  ],
  [
   "- \"전체에 반영\" 동기화 체크박스의 배경·테두리가 하드코딩된 청록색 대신 테마 색을 따라가도록 수정",
   "- The \"Apply to all\" sync checkbox's background and border now follow the theme color instead of hard-coded cyan"
  ],
  [
   "- 시작 화면의 점검 안내/자동 리디렉션 페이지(index.html)에도 설정에서 고른 테마 색이 반영되도록 수정 (그동안 테마 색 모듈이 로드되지 않아 항상 기본 청록색으로 고정돼 있던 문제)",
   "- The maintenance notice / auto-redirect start page (index.html) now uses the theme color chosen in Settings (the theme color module wasn't loaded, so it was always the default cyan)"
  ],
  [
   "- 위 신규 상태(정부 형태, 대통령, 총리, 내각 구성원, 거부권 주체, 비상사태 권한/상태, 의장단)를 저장/불러오기에 모두 반영",
   "- All of the new state above (form of government, president, PM, cabinet members, veto holder, emergency powers/status, speakers) is saved and loaded"
  ],
  [
   "- 대통령/총리/국무위원에 당적(소속 정당) 표시 기능 추가, 대통령제에서는 총리 탭·라벨이 자동으로 \"국무총리\"로 전환",
   "- Added party affiliation to the president, PM and ministers; under a presidential system the PM tab and label automatically switch to \"Prime Minister (appointed)\""
  ],
  [
   "- 비상 권한 선포/해제 버튼이 항상 해당 색(노랑/주황/빨강)과 \"! 라벨 !\" 문구를 갖도록 수정, 실제 선포 버튼은 권한 주체로 지정된 대통령/총리(또는 집단지도체제일 땐 내각) 탭에 표시",
   "- Emergency power declare/lift buttons now always use their color (yellow/orange/red) and \"! label !\" text, and the actual declare button appears in the tab of the assigned holder (president/PM, or the cabinet under collective leadership)"
  ],
  [
   "- 정부 형태에 따라 거부권·비상 권한 주체로 고를 수 있는 대상 제한 (대통령제: 대통령만, 의원내각제: 총리만, 이원집정부제: 둘 다, 집단지도체제: 내각만)",
   "- Limited who can hold the veto and emergency powers by form of government (presidential: president only, parliamentary: PM only, semi-presidential: both, collective leadership: cabinet only)"
  ],
  [
   "- 우측 디스플레이 패널에 하원/상원/삼원처럼 항상 표시되는 \"내각\" 탭 신설 — 대통령/총리(또는 의장)·국무위원을 사진·이름·당적 카드로 표시",
   "- Added an always-visible \"Cabinet\" tab to the right display panel, like House/Senate/Third — shows the president/PM (or chair) and ministers as cards with photo, name and party"
  ],
  [
   "- 대통령·총리·국무위원을 실제 의원(지역구 당선자/비례 의원/무소속)과 연결해 이름·사진·당적을 자동으로 불러오고 계속 동기화하는 기능 추가 (수동 입력으로 언제든 되돌리기 가능)",
   "- The president, PM and ministers can be linked to actual members (district winners / list members / independents) to pull in and keep syncing name, photo and party (switch back to manual input at any time)"
  ],
  [
   "- 국가 > 선거 > 선거를 대선/총선/설정 3개 내부 탭으로 분리, \"대선(대통령 선거)\" 신설 — 단순 다수 대표제/결선투표제/선거인단제 중 방식을 고르고, 후보별 득표율(또는 선거인단)을 계산해 당선자를 대통령에 자동 반영",
   "- Split Nation > Elections into three inner tabs (Presidential / General / Settings) and added presidential elections — choose plurality, runoff or electoral college, and the winner is calculated from vote shares (or electors) and set as president automatically"
  ],
  [
   "- 각 정당의 선거 후보를 기본값(당수) 대신 의원 연결 또는 직접 입력으로 재지정할 수 있는 \"후보 설정\" 추가 (대선/총리 선거 공용)",
   "- Added \"Candidate settings\" to replace each party's default candidate (its leader) with a linked member or manual entry (shared by presidential and PM elections)"
  ],
  [
   "- 총리 선출 과정 구현: 대통령제는 대통령이 후보를 지명하면 의회 심의(임명동의안 자동 발의)를 거쳐 확정, 의원내각제/이원집정부제는 기준 원의 다수당 대표가 자동으로 총리가 됨(총리직선제 체크박스로 총선 탭에서 직접선거로 전환 가능)",
   "- Implemented PM selection: under a presidential system the president nominates and parliament confirms (a consent motion is filed automatically); under parliamentary/semi-presidential systems the majority party leader of the base chamber becomes PM automatically (a direct PM election can be enabled with a checkbox in the General tab)"
  ],
  [
   "- 의원내각제/이원집정부제에서 내각(총리) 불신임안을 발의하고, 가결 시 현재 총리가 해임되는 기능 추가",
   "- Under parliamentary/semi-presidential systems, a motion of no confidence in the cabinet (PM) can be filed, removing the current PM if it passes"
  ],
  [
   "- \"집단지도체제\" 정부 형태 신설 — 대통령/총리 탭이 사라지고 의장 1인 + 장관 여러 명이 모두 \"내각\" 탭으로 통합, 거부권·비상 권한 주체도 \"내각\"으로 지정 가능",
   "- Added the \"collective leadership\" form of government — the president/PM tabs disappear and a single chair plus ministers are all managed in the \"Cabinet\" tab, which can also hold the veto and emergency powers"
  ],
  [
   "- 집권 세력 강조(HIGHLIGHT GOV) 체크박스를 국가 > 설정 > 상징에서 의회 탭으로 이동",
   "- Moved the HIGHLIGHT GOV checkbox from Nation > Settings > Symbols to the Parliament tab"
  ],
  [
   "- 국무위원(장관) 목록에 순서 변경(⋮⋮) 드래그 추가",
   "- Added reorder (⋮⋮) dragging to the minister list"
  ],
  [
   "- 우측 디스플레이 패널의 \"내각\" 탭도 우클릭 → 내보내기로 PNG/JPG/SVG 다운로드 가능",
   "- The \"Cabinet\" tab in the right display panel can also be exported as PNG/JPG/SVG via right-click → Export"
  ],
  [
   "- 비례 의원을 내각 직책에 연결할 때 사진이 반영되지 않던 문제 수정",
   "- Fixed photos not carrying over when linking a list member to a cabinet position"
  ],
  [
   "- 대선/총리 직선에 무소속 후보도 출마할 수 있도록 개선",
   "- Independent candidates can now run in presidential and direct PM elections"
  ],
  [
   "- 선거 후보 설정에서 의원 불러오기 목록이 해당 정당 소속 의원으로만 제한되도록 수정 (다른 정당 의원이 함께 뜨던 문제)",
   "- The member picker in candidate settings now only lists that party's members (other parties' members used to appear too)"
  ],
  [
   "- 각 원(하원/상원/삼원)의 부의장을 여러 명 추가/삭제할 수 있도록 개선 (기존 1명 고정 → 기본 0명)",
   "- Each chamber (House/Senate/Third) can now have any number of deputy speakers (previously fixed at 1; now 0 by default)"
  ],
  [
   "- 지역구 지도(SVG) 기본 배색을 밝은 단색 채우기 대신 어두운 톤 + 정당·성향 색의 네온 광원으로 변경, 도형 전체를 칠하는 대신 경계 안쪽에서 은은하게 빛나도록 표시",
   "- Changed the district map (SVG) default colors from bright solid fills to a dark tone with neon glows in party/tendency colors, softly glowing inside the borders instead of filling whole shapes"
  ],
  [
   "- SVG 지도 안내 문구 오타 수정 (\"뉴 지역구 탭\" → \"지역구 탭\")",
   "- Fixed a typo in the SVG map hint (\"New District tab\" → \"District tab\")"
  ],
  [
   "- 단순 다수 대표제/이원집정부제/집단지도체제 버튼 및 대선·총리 선거 요약 문구의 줄바꿈 위치 정리",
   "- Tidied line breaks in the plurality / semi-presidential / collective leadership buttons and the presidential/PM election summaries"
  ],
  [
   "- 입법 > 상정 탭의 국회/국무회의 버튼에서 실제 선택된 쪽을 구분하기 어렵던 문제 수정 (선택된 쪽만 색이 채워지고 ✔ 표시)",
   "- Made the selected option clear on the Parliament / Cabinet Council buttons in Legislation > Table (only the selected one is filled and marked ✔)"
  ],
  [
   "- 저장 파일 버전 v1.2로 업데이트",
   "- Updated the save file version to v1.2"
  ],
  [
   "- 부정선거 추가",
   "- Added election fraud"
  ],
  [
   "- 부정선거 탭 잠금 해제 (정식 공개)",
   "- Unlocked the election fraud tab (official release)"
  ],
  [
   "- 의석 현황 화면 우측 상단 날짜/회기 글씨 크기 확대",
   "- Enlarged the date/session text at the top right of the seat screen"
  ],
  [
   "- 사진 포함 내보내기 최상단 헤더의 국기·국가 이름·날짜·회기 글씨 크기 확대",
   "- Enlarged the flag, nation name, date and session in the header of exports with photos"
  ],
  [
   "- 정당/파벌 옆에 복제(사본) 버튼 추가",
   "- Added a duplicate (copy) button next to parties/factions"
  ],
  [
   "- 선거 결과 카드에 직전 대비 의석 증감(▲/▼) 표시",
   "- Election result cards show seat changes from the previous election (▲/▼)"
  ],
  [
   "- 조작 탭과 화면 탭 사이 경계를 드래그로 리사이즈 가능, 더블클릭으로 기본 폭 복원, 리사이즈 시 반원 캔버스가 찌그러지던 문제 수정",
   "- The border between the control and display panels can be dragged to resize (double-click restores the default width); fixed the hemicycle canvas distorting on resize"
  ],
  [
   "- 키보드 단축키 추가: Ctrl+S(즉시 저장 + \"저장됨\" 토스트), Enter(입력 중이 아닐 때 프로토콜 실행), Esc(열려 있는 확인/알림/내보내기 창 닫기)",
   "- Added keyboard shortcuts: Ctrl+S (save now + \"Saved\" toast), Enter (execute protocol when not typing), Esc (close open confirm/alert/export windows)"
  ],
  [
   "- 입법 > 기록 탭에 가결/부결(거부권 포함)/서명 대기 상태 필터 추가",
   "- Added Passed / Rejected (incl. vetoed) / Awaiting signature status filters to Legislation > Records"
  ],
  [
   "- 저장 시스템 전면 개편: 자동저장을 이름 붙인 세이브마다 전용 자동저장(\"OO 자동저장\")을 따로 갖도록 개편, 세이브 전환/삭제 시에도 서로 진행 상황이 섞이지 않음. 특정 세이브에 속하지 않는 기본 자동저장 슬롯은 \"기존 저장\"으로 이름 구분",
   "- Overhauled the save system: each named save now has its own autosave (\"XX Autosave\"), so progress never mixes when switching or deleting saves. The default autosave slot that belongs to no save is labeled separately (formerly \"Existing Save\")"
  ],
  [
   "- 자동저장 주기를 15초/30초/1분/3분/5분/10분 중 설정 > 저장 탭에서 선택 가능",
   "- The autosave interval can be set to 15s / 30s / 1m / 3m / 5m / 10m in Settings > Save"
  ],
  [
   "- 메인 화면 \"프로토콜 실행\" 버튼을 누르면 새 세이브를 만들거나 기존 세이브(자동저장 포함)를 골라 이어할 수 있는 온보딩 창 신설, 저장 파일(.json) 업로드로 바로 이어하기도 가능",
   "- Pressing \"Execute Protocol\" on the main screen now opens an onboarding window to create a new save or continue an existing one (including autosaves), or continue straight from an uploaded save file (.json)"
  ],
  [
   "- 이전 버전에서 쓰던 구 방식 자동저장 데이터를 새 저장 슬롯 형식으로 자동 이관 — 업데이트 후 세이브가 사라진 것처럼 보이는 문제 방지",
   "- Old-style autosave data from earlier versions is migrated to the new save slot format automatically — so saves don't seem to vanish after updating"
  ],
  [
   "- 화면 최상단에 크롬 탭 스타일의 세이브 탭 바 신설 — 클릭 한 번으로 확인창 없이 세이브 사이를 즉시 전환, \"+\"로 새 세이브를 새로 만들거나 미리 등록해둔 프리셋에서 시작 가능 (presets/ 폴더 + index.json으로 시나리오 배포·공유)",
   "- Added a Chrome-style save tab bar at the very top — switch between saves instantly with one click, no confirmation, and use \"+\" to create a new save or start from a registered preset (distribute/share scenarios via the presets/ folder + index.json)"
  ],
  [
   "- Electron 기반 Windows 데스크톱 앱(.exe) 패키징 지원 추가 (npm run build:win)",
   "- Added packaging as an Electron-based Windows desktop app (.exe) (npm run build:win)"
  ],
  [
   "- 남아있던 브라우저 기본 알림/확인 팝업을 모두 앱 자체 스타일 알림/확인 창으로 교체",
   "- Replaced all remaining browser alert/confirm popups with the app's own styled dialogs"
  ],
  [
   "- 무소속 통계 카드에서 당수 이름/사진이 표시되지 않도록 수정, 개별 의원 목록의 스크롤 높이 제한 제거",
   "- Independent stat cards no longer show a leader name/photo, and removed the scroll height limit on the individual member list"
  ],
  [
   "- 의장단/내각 표시 카드의 이름 잘림 폭 확대",
   "- Widened the name area on speaker/cabinet display cards so names are truncated less"
  ],
  [
   "- 내보내기 헤더 국가 이름 볼드체 제거",
   "- Removed bold from the nation name in export headers"
  ],
  [
   "- 부정선거 시도 카드 내부 체크박스 등 폼 요소 색을 경고색(빨강)으로 통일",
   "- Unified checkboxes and other controls inside the election fraud card to the warning color (red)"
  ],
  [
   "- JS/CSS 파일을 js/, css/ 폴더로 정리 (내부 구조 변경, HTML 진입점 경로는 그대로 유지)",
   "- Organized JS/CSS files into js/ and css/ folders (internal change; HTML entry paths unchanged)"
  ],
  [
   "- 저장 파일 버전 v1.3으로 업데이트",
   "- Updated the save file version to v1.3"
  ],
  [
   "- 테마 모드 3종(라이트/다크/네온) 추가 — 기존 TNO 스타일은 \"네온\"으로 이름 변경",
   "- Added three theme modes (Light / Dark / Neon) — the original TNO style is now called \"Neon\""
  ],
  [
   "- 라이트/다크 모드 UI 대대적 개편: 전용 스타일시트(css/modern.css) 분리, 테두리 없는 모노톤 버튼 등 현대적인 디자인",
   "- Major Light/Dark UI overhaul: a dedicated stylesheet (css/modern.css) and a modern design with borderless monotone buttons"
  ],
  [
   "- 접고 펼 수 있는 세로 탭 사이드바 신설(라이트/다크/네온 공통), 라이트/다크는 패널 머리에 현재 위치(그룹 › 항목) 표시, 네온은 \"MINISTRY OF INTERIOR\" 띠 유지",
   "- Added a collapsible vertical tab sidebar (all themes); Light/Dark show the current location (group › item) in the panel header, Neon keeps the \"MINISTRY OF INTERIOR\" strip"
  ],
  [
   "- 최상단 세이브 탭 바 높이가 맞지 않아 생기던 스크롤바 제거",
   "- Removed the scrollbar caused by the top save tab bar's height mismatch"
  ],
  [
   "- 선거 결과 내보내기에서 의석 변동 텍스트를 화면과 같은 빨강/초록으로 표시",
   "- Seat change text in exported election results now uses the same red/green as on screen"
  ],
  [
   "- 창 크기 조절 시 선거 결과 · 지역구 지도 등 캔버스가 찌그러지던 문제 수정",
   "- Fixed election results, district maps and other canvases distorting when resizing the window"
  ],
  [
   "- 시작 화면 개편: 창을 키워 왼쪽엔 프리셋, 오른쪽엔 세이브 — 세이브 검색 · ★ 즐겨찾기, 프리셋을 고르면 그 설정의 복사본이 새 세이브로 생성",
   "- Redesigned the start screen: a larger window with presets on the left and saves on the right — save search and ★ favorites; picking a preset creates a copy as a new save"
  ],
  [
   "- \"튜토리얼 공화국\" 프리셋과 조작법 튜토리얼 추가",
   "- Added the \"Tutorial Republic\" preset and a controls tutorial"
  ],
  [
   "- 세이브 이름 변경 (탭 더블클릭 또는 설정 > 저장 목록의 ✎)",
   "- Rename saves (double-click the tab, or ✎ in the Settings > Save list)"
  ],
  [
   "- 합당 기능 추가: 흡수합당(존속 정당이 흡수) · 신설합당(새 정당 창당) — 의석 · 의원 · 파벌 · 연정 · 지지율 · 내각 소속을 함께 이전, 합쳐지는 정당을 계파로 남기기 가능",
   "- Added party mergers: absorption (a surviving party absorbs others) and new-party mergers — seats, members, factions, coalitions, support and cabinet affiliations move over, and merged parties can be kept as factions"
  ],
  [
   "- 언어 전환을 언어별 파일(언어 팩) 구조로 개편, 커뮤니티 번역(.json) 불러오기/삭제 및 번역 템플릿 내려받기 지원",
   "- Reworked language switching into per-language files (language packs), with loading/removing community translations (.json) and downloading a translation template"
  ],
  [
   "- 모바일 UI 개편: 화면 아래 탭 바(의회 · 국가 · 여론 · 내각 · 의석), 떠 있는 실행 버튼, 위에 붙어 따라오는 하위 탭 칩 줄, 누르기 쉬운 버튼 크기 · 노치 여백 · iOS 입력칸 확대 방지",
   "- Mobile UI overhaul: a bottom tab bar (Parliament · Nation · Opinion · Cabinet · Seats), a floating execute button, a sticky sub-tab chip row, larger touch targets, notch-safe spacing and no iOS zoom on inputs"
  ],
  [
   "- 모바일 실행 버튼을 편집 패널과 같은 폭으로 (네온은 \">> PROTOCOL EXECUTE <<\" 문구 유지)",
   "- The mobile execute button now matches the edit panel's width (Neon keeps the \">> PROTOCOL EXECUTE <<\" text)"
  ],
  [
   "- 튜토리얼을 직접 해보는 실습형으로 개편 — 표시된 곳을 실제로 조작해야 다음 단계로 넘어감, #1 화면 둘러보기 · #2 정당과 의석 · #3 입법 · #4 여론과 선거 · #5 내각 과정으로 나누고 목차 · 과정 완료 카드 추가",
   "- Reworked the tutorial into a hands-on one — you must actually use the highlighted control to move on; split into #1 Tour · #2 Parties & Seats · #3 Legislation · #4 Opinion & Elections · #5 Cabinet, with a lesson list and completion cards"
  ],
  [
   "- 튜토리얼 개표 단계가 개표 장면을 가리지 않도록 화면을 어둡게 하지 않고 말풍선을 옆(모바일은 아래)으로",
   "- The tutorial's vote-count step no longer dims the screen and moves its bubble aside (below on mobile) so the count stays visible"
  ],
  [
   "- 네온 모드의 국가명을 사이드바 머리가 아닌 원래 자리(헤더 아래 짙은 회색 줄)에 표시",
   "- In Neon mode the nation name is back in its original place (the dark gray bar under the header) instead of the sidebar header"
  ],
  [
   "- 의회 > 구성에 원별 \"배정 합계\" 표시, 정당 의석은 총 의석 수를 넘겨 입력할 수 없도록 제한 (넘친 의석이 반원에 보이지 않던 문제 방지)",
   "- Parliament > Composition shows an \"Assigned total\" per chamber, and party seats can no longer exceed the total (seats over the limit used to be invisible in the hemicycle)"
  ],
  [
   "- 메뉴 맨 아래에 회색 \"도움말\" 묶음 추가 — 의회 · 국가 · 여론 · 내각의 모든 탭이 무슨 역할인지 설명하고 해당 탭으로 바로 이동",
   "- Added a gray \"Help\" group at the bottom of the menu — explains what every tab in Parliament, Nation, Opinion and Cabinet does, with shortcuts to open them"
  ],
  [
   "- 건설적 불신임제(독일 · 이스라엘식) 추가 — 불신임안에 후임을 함께 지명하고, 가결되면 공석 없이 그 후임이 바로 총리가 됨",
   "- Added the constructive vote of no confidence (German/Israeli style) — the motion names a successor, who becomes PM immediately if it passes, leaving no vacancy"
  ],
  [
   "- 의회 해산 시 의회 전체 또는 한 원(예: 하원)만 해산 가능 — 그 원의 총선을 반영해야 해제",
   "- Dissolution can now target the whole parliament or a single chamber (e.g. the lower house) — lifted once that chamber's general election is applied"
  ],
  [
   "- 부정선거 탭 표기를 ⚠로 통일하고 다른 탭과 높이를 맞춤",
   "- The election fraud tab is now consistently labeled ⚠ and matches the other tabs' height"
  ],
  [
   "- 최상단 세이브 탭 바 맨 왼쪽에 메인 화면으로 돌아가는 집 아이콘 추가 (누르면 바로 저장 후 이동)",
   "- Added a home icon at the far left of the save tab bar to return to the main screen (saves first)"
  ],
  [
   "- old2.html 추가 — UI 개편 전 화면을 체험할 수 있는 페이지 (세이브는 따로 보관)",
   "- Added old2.html — a page to try the pre-overhaul UI (saves are kept separately)"
  ],
  [
   "- 데스크톱 앱에 영어 언어 팩이 빠져 있던 문제 수정",
   "- Fixed the English language pack missing from the desktop app"
  ],
  [
   "1.5.9 - 프로그램 출시",
   "1.5.9 - Program Release"
  ],
  [
   "- Steam 서비스 준비",
   "- Preparing for Steam release"
  ],
  [
   "- Steam 개발자 계정을 위한 펀딩 시작",
   "- Starting funding for a Steam developer account"
  ],
  [
   "0.2.1 - 영어 개발 시작",
   "0.2.1 - English Development Begins"
  ],
  [
   "- 언어 설정 추가",
   "- Added language settings"
  ],
  [
   "- 초기 개발 성공",
   "- Initial development succeeded"
  ],
  [
   "- 저장 버전명 체계 변경 (v1.0부터 시작, KST 기준 타임스탬프)",
   "- Changed the save version naming scheme (starting at v1.0, KST timestamps)"
  ],
  [
   "설정 / SETTINGS",
   "SETTINGS"
  ],
  [
   "메인 화면으로",
   "Back to main screen"
  ],
  [
   "새 세이브 이름",
   "New save name"
  ],
  [
   "새 세이브",
   "New save"
  ],
  [
   "🆕 새로 생성",
   "🆕 Create new"
  ],
  [
   "📦 프리셋에서 생성",
   "📦 Create from preset"
  ],
  [
   "◀ 컨트롤",
   "◀ Controls"
  ],
  [
   "의석 현황 ▶",
   "Seats ▶"
  ],
  [
   "사이드바 접기/펼치기",
   "Collapse/expand sidebar"
  ],
  [
   "사이드바 · 상단 바",
   "Sidebar · Top Bar"
  ],
  [
   "💼︎ 내각",
   "💼︎ Cabinet"
  ],
  [
   "드래그하여 폭 조절 (더블클릭: 기본값으로 초기화)",
   "Drag to resize (double-click: reset to default)"
  ],
  [
   "다시 계산 (PROTOCOL EXECUTE)",
   "Recalculate (PROTOCOL EXECUTE)"
  ],
  [
   "⬇ 내보내기...",
   "⬇ Export..."
  ],
  [
   "▌ 내보내기",
   "▌ Export"
  ],
  [
   "최상단에 포함",
   "Include at top"
  ],
  [
   "아래 의석 수 등 통계 포함",
   "Include stats below (seat counts, etc.)"
  ],
  [
   "당수/로고 사진 포함",
   "Include leader/logo photos"
  ],
  [
   "무소속 펼치기",
   "Expand independents"
  ],
  [
   "원외정당 포함하기",
   "Include extra-parliamentary parties"
  ],
  [
   "예: 통합민주당",
   "e.g. United Democratic Party"
  ],
  [
   "✦ 이념 순 자동정렬",
   "✦ Auto-sorted by ideology"
  ],
  [
   "정당 복제",
   "Duplicate party"
  ],
  [
   "당수 사진",
   "Leader photo"
  ],
  [
   "당 로고 업로드",
   "Upload party logo"
  ],
  [
   "당 로고",
   "Party logo"
  ],
  [
   "클릭하여 사진 업로드",
   "Click to upload a photo"
  ],
  [
   "-- 의석 선택 (붙여넣기 대상) --",
   "-- Select a seat (paste target) --"
  ],
  [
   "◆ 위에서 의석을 고르고 \"붙여넣기\"를 누르면 현재 당수 이름·사진이 그 의석에 복사됩니다",
   "◆ Pick a seat above and press \"Paste\" to copy the current leader's name and photo to that seat"
  ],
  [
   "배정 합계",
   "Assigned total"
  ],
  [
   "드래그로 순서 변경",
   "Drag to reorder"
  ],
  [
   "-- 대표당 미지정 --",
   "-- No lead party --"
  ],
  [
   "★ 집권",
   "★ Ruling"
  ],
  [
   "연정에 정식 참여하지 않지만 신임투표·예산안 등에서 정부를 지지하는 정당",
   "Parties that don't formally join the coalition but support the government in confidence votes, budgets, etc."
  ],
  [
   "검색 (이름 / #좌석번호)",
   "Search (name / #seat number)"
  ],
  [
   "좌석 번호",
   "Seat number"
  ],
  [
   "👑 당수로 지정",
   "👑 Make leader"
  ],
  [
   "-- 소속 없음 --",
   "-- No affiliation --"
  ],
  [
   "— 정식 참여",
   "— full member"
  ],
  [
   "이름 미지정",
   "Unnamed"
  ],
  [
   "원 구성",
   "Chambers"
  ],
  [
   "의장 이름",
   "Speaker name"
  ],
  [
   "[+] 부의장 추가",
   "[+] Add deputy speaker"
  ],
  [
   "지역구 시스템 (기본: 지도)",
   "District system (default: Map)"
  ],
  [
   "지도 모드로 바꾸면 선거 > 지역구 탭에서 SVG 지도를 업로드할 수 있습니다",
   "In Map mode you can upload an SVG map in Elections > Districts"
  ],
  [
   "지도 글씨·배지 크기",
   "Map text/badge size"
  ],
  [
   "국회 반원 중앙 표시",
   "House hemicycle center"
  ],
  [
   "상원 반원 중앙 표시",
   "Senate hemicycle center"
  ],
  [
   "삼원 반원 중앙 표시",
   "Third chamber hemicycle center"
  ],
  [
   "클릭하여 로고 업로드",
   "Click to upload a logo"
  ],
  [
   "클릭해서 로고를 올리고, [로고]를 선택하면 반원 중앙에 표시됩니다",
   "Click to upload a logo, then choose [Logo] to show it in the middle of the hemicycle"
  ],
  [
   "반원 중앙에 표시할 로고",
   "Logo shown in the hemicycle center"
  ],
  [
   "저장 주기",
   "Autosave interval"
  ],
  [
   "15초",
   "15s"
  ],
  [
   "30초",
   "30s"
  ],
  [
   "1분",
   "1m"
  ],
  [
   "3분",
   "3m"
  ],
  [
   "5분",
   "5m"
  ],
  [
   "10분",
   "10m"
  ],
  [
   "이름 붙여 저장 (브라우저에 보관)",
   "Save with a name (kept in the browser)"
  ],
  [
   "심의 선택",
   "Select for deliberation"
  ],
  [
   "[ 국회 표결 결과 ]",
   "[ Parliament vote result ]"
  ],
  [
   "심의 법안 선택 (COUNCIL BILL)",
   "Select bill (COUNCIL BILL)"
  ],
  [
   "국무회의 의결 정족수",
   "Cabinet Council quorum"
  ],
  [
   "! 계엄령 중 — 국무회의로 법안 통과",
   "! Martial law — bills pass through the Cabinet Council"
  ],
  [
   "의회 표결이 정지된 동안, 내각 디스플레이(우측 \"내각\" 탭)에서 국무위원별로 찬성·반대·기권을 표시하세요. 아래에 실시간 집계가 표시됩니다.",
   "While parliamentary voting is suspended, mark each minister's yea/nay/abstain in the cabinet display (the \"Cabinet\" tab on the right). The live tally appears below."
  ],
  [
   "[ 국무회의 표결 결과 ]",
   "[ Cabinet Council vote result ]"
  ],
  [
   "▶ 국무회의로 의결",
   "▶ Resolve in the Cabinet Council"
  ],
  [
   "! 국무회의 표결 중",
   "! Cabinet Council voting"
  ],
  [
   "전원 찬성",
   "All yea"
  ],
  [
   "전원 반대",
   "All nay"
  ],
  [
   "예: 제1회 대통령 선거",
   "e.g. 1st Presidential Election"
  ],
  [
   "예: 제1회 총리 선거",
   "e.g. 1st Prime Minister Election"
  ],
  [
   "단순 다수 대표제",
   "First-past-the-post"
  ],
  [
   "기준 원:",
   "Base chamber:"
  ],
  [
   "(설정 탭에서 변경)",
   "(change in the Settings tab)"
  ],
  [
   "총리 선거",
   "PM election"
  ],
  [
   "개표 방식",
   "Counting method"
  ],
  [
   "지도에서 지역구를 하나씩 클릭해 직접 개표합니다",
   "Click districts on the map one by one to count them yourself"
  ],
  [
   "(활성 지역구 수)",
   "(active districts)"
  ],
  [
   "(선거 > 설정 탭에서 변경 — 대선과 방식을 공유합니다)",
   "(change in Elections > Settings — shared with the presidential election)"
  ],
  [
   "대선·총리 선거 방식",
   "Presidential / PM election method"
  ],
  [
   "— 총리직선제일 때 총리 선거에도 그대로 적용됩니다",
   "— also used for PM elections when the PM is directly elected"
  ],
  [
   "단순 다수",
   "First-past-"
  ],
  [
   "결선투표제",
   "Two-round"
  ],
  [
   "선거인단제",
   "Electoral college"
  ],
  [
   "1위 후보가 과반이 아니어도 최다 득표로 당선됩니다",
   "The top candidate wins with the most votes even without a majority"
  ],
  [
   "기준 원",
   "Base chamber"
  ],
  [
   "— 지지율(선거인단제는 지역구 결과)을 가져올 원",
   "— the chamber whose support (district results for the electoral college) is used"
  ],
  [
   "후보 설정",
   "Candidates"
  ],
  [
   "— 기본값은 당수, 의원 연결 또는 직접 입력으로 다른 인물을 세울 수 있습니다 (대선/총리 선거 공용)",
   "— defaults to the party leader; link a member or type a name to field someone else (shared by presidential/PM elections)"
  ],
  [
   "후보 이름 (비우면 당수)",
   "Candidate name (blank = leader)"
  ],
  [
   "후보 이름 (비우면 대표)",
   "Candidate name (blank = leader)"
  ],
  [
   "-- 의원에서 불러오기 --",
   "-- Load from a member --"
  ],
  [
   "정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각되면 활동 금지 처분을 받습니다.",
   "Each party can attempt election fraud once, in the next general election count. If caught, the party is banned."
  ],
  [
   "⚠ 부정선거 시도",
   "⚠ Attempt election fraud"
  ],
  [
   "(다음 총선 개표 1회에 적용)",
   "(applies to the next general election count only)"
  ],
  [
   "맵 메이커",
   "Map Maker"
  ],
  [
   "에서 내보낸 .jsx 파일을 업로드하면, 그리드 대신 실제 지도 모양으로 지역구를 만들 수 있습니다.",
   " — upload a .jsx file exported from it to use real map-shaped districts instead of the grid."
  ],
  [
   "하나의 지도를 하원·상원·삼원이 함께 쓰며, 지역구를 클릭하면 원별 의석 수와 정당별 성향(%)을 지정할 수 있습니다.",
   "The House, Senate and Third chamber share one map; click a district to set its seats per chamber and party leanings (%)."
  ],
  [
   "업로드하면",
   "Uploading"
  ],
  [
   "기존 지역구 데이터가 새 지도로 대체",
   "replaces the existing district data with the new map"
  ],
  [
   "⬆ 지역구 지도 업로드 (.jsx)",
   "⬆ Upload district map (.jsx)"
  ],
  [
   "파일 없음",
   "No file"
  ],
  [
   "테두리 색",
   "Border color"
  ],
  [
   "테마 색과 동기화",
   "Sync with theme color"
  ],
  [
   "채우기는 항상 투명입니다",
   "Fill is always transparent"
  ],
  [
   "글씨 테두리 색",
   "Text outline color"
  ],
  [
   "지역구 약칭 글씨의 테두리 색입니다",
   "Outline color for district abbreviations"
  ],
  [
   "지도 안 지역구 수:",
   "Districts on map:"
  ],
  [
   "개 | 지역구를 클릭하면 의석 수·성향을 편집할 수 있습니다",
   " | click a district to edit its seats and leanings"
  ],
  [
   "권역형 비례대표에서 지역구를 묶는 단위입니다. 원별로 독립적으로 설정합니다. (전국형을 쓸 경우 설정하지 않아도 됩니다)",
   "Regions group districts for regional list PR. Set them separately per chamber. (Not needed if you use national lists.)"
  ],
  [
   "▌ 권역 목록 (칠하기 대상을 선택하세요)",
   "▌ Regions (choose one to paint)"
  ],
  [
   "[+] 권역 추가",
   "[+] Add region"
  ],
  [
   "▌ 권역별 득표율",
   "▌ Vote share by region"
  ],
  [
   "자동 집계",
   "Automatic"
  ],
  [
   "수동 입력",
   "Manual"
  ],
  [
   "자동 집계: 권역에 속한 지역구들의 성향(%)을 평균해 득표율로 사용합니다. 수동 입력: 권역마다 직접 지지율을 입력합니다.",
   "Automatic: averages the leanings (%) of the region's districts as its vote share. Manual: enter support for each region yourself."
  ],
  [
   "완전연동형(100%)",
   "Fully compensatory (100%)"
  ],
  [
   "병립형(0%)",
   "Parallel (0%)"
  ],
  [
   "완전연동형",
   "Fully compensatory"
  ],
  [
   "연동 비율(%)",
   "Compensation (%)"
  ],
  [
   "0% = 병립형(지역구·비례 독립 배분) · 100% = 완전연동형(전체 의석을 득표율에 맞춤) · 그 사이는 준연동형처럼 절충 · 권역형은",
   "0% = parallel (districts and lists allocated independently) · 100% = fully compensatory (all seats match vote share) · in between is a semi-compensatory mix · regional lists need"
  ],
  [
   "0% = 병립형(지역구·비례 독립 배분) · 100% = 완전연동형(전체 의석을 득표율에 맞춤) · 그 사이는 준연동형처럼 절충",
   "0% = parallel (districts and lists allocated independently) · 100% = fully compensatory (all seats match vote share) · in between is a semi-compensatory mix"
  ],
  [
   "비례대표 방식 (국회) —",
   "List PR method (House) —"
  ],
  [
   "비례대표 방식 (상원) —",
   "List PR method (Senate) —"
  ],
  [
   "여론 > 권역",
   "Opinion > Regions"
  ],
  [
   "탭에서 권역을 먼저 설정하세요",
   "regions to be set up first"
  ],
  [
   "오차(±%)",
   "Margin (±%)"
  ],
  [
   "↺ 위치 초기화",
   "↺ Reset view"
  ],
  [
   "· Shift+스크롤: 확대/축소 · 휠클릭 드래그: 이동",
   "· Shift+scroll: zoom · middle-click drag: pan"
  ],
  [
   "권역 배정 맵",
   "Region assignment map"
  ],
  [
   "아래에서 \"칠하기\" 권역을 고른 뒤, 지도(또는 그리드)의 지역구를 클릭해 그 권역에 배정/해제하세요.",
   "Choose a region to \"paint\" below, then click districts on the map (or grid) to add/remove them."
  ],
  [
   "SVG 지도가 없습니다 — 지역구 탭에서 업로드하세요",
   "No SVG map — upload one in the District tab"
  ],
  [
   "지역구 탭에서 지도를 먼저 업로드하세요",
   "Upload a map in the District tab first"
  ],
  [
   "아직 권역이 없습니다. 아래 [+] 버튼으로 추가하세요.",
   "No regions yet. Add one with the [+] button below."
  ],
  [
   "권역을 먼저 추가하세요.",
   "Add a region first."
  ],
  [
   "정부 형태",
   "Form of government"
  ],
  [
   "의원내각제",
   "Parliamentary"
  ],
  [
   "직책 이름 (내각 디스플레이에 표시될 이름을 직접 바꿀 수 있습니다 — 비워두면 기본값 사용)",
   "Position titles (rename them as shown in the cabinet display — leave blank for defaults)"
  ],
  [
   "총리 / 국무총리",
   "Prime Minister / Premier"
  ],
  [
   "의장 (집단지도체제)",
   "Chair (collective leadership)"
  ],
  [
   "장관 / 국무위원",
   "Minister / Cabinet member"
  ],
  [
   "법안 거부권(veto) 주체",
   "Bill veto holder"
  ],
  [
   "거부권이 있으면, 표결 통과된 법안을 국가 > 입법 탭에서 거부할 수 있습니다",
   "With a veto, bills that pass a vote can be vetoed in Nation > Legislation"
  ],
  [
   "국가 비상사태 권한 주체",
   "State of emergency power holder"
  ],
  [
   "의회 해산 권한 주체",
   "Dissolution power holder"
  ],
  [
   "해산권 분할 —",
   "Split dissolution —"
  ],
  [
   "해산: 대통령 /",
   "dissolution: President /"
  ],
  [
   "해산: 총리",
   "dissolution: PM"
  ],
  [
   "계엄령 권한 주체",
   "Martial law power holder"
  ],
  [
   "대통령 이름",
   "President name"
  ],
  [
   "🔗 의원과 연결됨 — 이름·사진·당적 자동 반영",
   "🔗 Linked to a member — name, photo and party applied automatically"
  ],
  [
   "연결 해제",
   "Unlink"
  ],
  [
   "✕ 사진 제거",
   "✕ Remove photo"
  ],
  [
   "총리직선제",
   "Direct PM election"
  ],
  [
   "국무총리 이름",
   "Premier name"
  ],
  [
   "총리 이름",
   "PM name"
  ],
  [
   "🔒 현재 총리로 고정 (의석 변동에 영향받지 않음)",
   "🔒 Lock the current PM (unaffected by seat changes)"
  ],
  [
   "🔓 고정 해제 (다시 다수당 대표를 실시간 반영)",
   "🔓 Unlock (follow the majority party leader again)"
  ],
  [
   "🔒 내각 불신임으로 총리가 공석입니다 — 직접 지정하거나, 아래 \"고정 해제\"로 현재 다수당 대표를 새 총리로 반영하세요.",
   "🔒 The PM post is vacant after a no-confidence vote — set one directly, or use \"Unlock\" below to make the current majority party leader PM."
  ],
  [
   "🔒 총리가 고정되어 있습니다 — 다수당이 바뀌어도 총리는 유지되며, 내각 불신임이 가결되면 공석이 됩니다.",
   "🔒 The PM is locked — they stay in office even if the majority changes, and the post becomes vacant if a no-confidence vote passes."
  ],
  [
   "[+] 부총리 추가",
   "[+] Add deputy PM"
  ],
  [
   "총리 후보 지명 (대통령 임명제)",
   "Nominate PM (presidential appointment)"
  ],
  [
   "총리 후보",
   "PM nominee"
  ],
  [
   "후보 이름",
   "Candidate name"
  ],
  [
   "지명 → 의회 심의 상정",
   "Nominate → send to parliament"
  ],
  [
   "내각 불신임",
   "No confidence"
  ],
  [
   "건설적 불신임제 (독일 · 이스라엘식) — 불신임안에 후임을 함께 지명",
   "Constructive vote of no confidence (German/Israeli style) — name a successor in the motion"
  ],
  [
   "-- 후임 총리 소속 정당 --",
   "-- Successor PM's party --"
  ],
  [
   "후임 총리 이름",
   "Successor PM name"
  ],
  [
   "건설적 불신임안",
   "Constructive no-confidence motion"
  ],
  [
   "내각 불신임안",
   "No-confidence motion"
  ],
  [
   "발의 !",
   "file !"
  ],
  [
   "가결되면 국가 > 입법 탭에서 확인할 수 있으며, 통과 시 현재 총리가 해임됩니다",
   "Shown in Nation > Legislation once filed; if it passes, the current PM is dismissed"
  ],
  [
   "가결되면 지명한 후임이 곧바로 새 총리가 되고, 기존 내각(부총리·국무위원)은 물러납니다 — 공석이 생기지 않습니다",
   "If it passes, the named successor becomes PM right away and the old cabinet (deputy PMs, ministers) steps down — no vacancy"
  ],
  [
   "[+] 국무위원 추가",
   "[+] Add cabinet member"
  ],
  [
   "[+] 장관 추가",
   "[+] Add minister"
  ],
  [
   "▌ 비상 권한",
   "▌ Emergency powers"
  ],
  [
   "해산 대상",
   "Dissolve"
  ],
  [
   "의회 전체",
   "Whole parliament"
  ],
  [
   "한 원만 해산하면 그 원의 의석만 비워지고, 그 원의 총선을 반영하면 해제됩니다.",
   "Dissolving one chamber empties only its seats; it's lifted once that chamber's general election is applied."
  ],
  [
   "의회 해산",
   "Dissolution"
  ],
  [
   "존속 정당이 이름·색·당수를 유지한 채 다른 정당들을 흡수합니다. 흡수된 정당의 의석·의원·연정·지지율이 존속 정당으로 옮겨집니다.",
   "The surviving party keeps its name, color and leader and absorbs the others. The absorbed parties' seats, members, coalitions and support move to it."
  ],
  [
   "흡수될 정당을 1개 이상 고르세요.",
   "Pick at least one party to absorb."
  ],
  [
   "고른 정당들이 모두 해산하고 새 정당으로 합쳐집니다. 의석·의원·연정·지지율이 새 정당으로 옮겨집니다.",
   "All selected parties dissolve and merge into a new party. Seats, members, coalitions and support move to the new party."
  ],
  [
   "합칠 정당 (2개 이상)",
   "Parties to merge (2 or more)"
  ],
  [
   "합쳐지는 정당들을 새 정당의 계파로 남기기",
   "Keep merged parties as factions of the new party"
  ],
  [
   "합칠 정당을 2개 이상 고르세요.",
   "Pick at least two parties to merge."
  ],
  [
   "의석 수",
   "Seat count"
  ],
  [
   "지금 설정에선 숨겨져 있어요",
   "hidden with the current settings"
  ],
  [
   "의회 ›",
   "Parliament ›"
  ],
  [
   "여론 ›",
   "Opinion ›"
  ],
  [
   "내각 ›",
   "Cabinet ›"
  ],
  [
   "시각 ›",
   "Visuals ›"
  ],
  [
   "맨 위 ›",
   "Top ›"
  ],
  [
   "왼쪽 ›",
   "Left ›"
  ],
  [
   "가운데 ›",
   "Center ›"
  ],
  [
   "공통 ›",
   "General ›"
  ],
  [
   "모바일 ›",
   "Mobile ›"
  ],
  [
   "⚠ (부정선거)",
   "⚠ (Election fraud)"
  ],
  [
   " (부정선거)",
   " (Election fraud)"
  ],
  [
   "의회를 이루는 정당 · 의석 · 의원 · 연정을 다룹니다.",
   "Parties, seats, members and coalitions that make up parliament."
  ],
  [
   "나라의 정당을 만들고 꾸밉니다.",
   "Create and customize your nation's parties."
  ],
  [
   "정당이 속할 이념을 추가하고 순서를 정합니다. 자동 정렬일 때 정당은 이 순서대로 반원에 앉아요.",
   "Add ideologies and set their order. With auto-sort, parties sit in the hemicycle in this order."
  ],
  [
   "정당 추가 · 복제 · 삭제, 이름 · 약칭 · 색 · 이념 · 상태, 소속 의회, 파벌, 합당(흡수합당 · 신설합당).",
   "Add, duplicate and delete parties; name, abbreviation, color, ideology, status, chambers, factions, and mergers (absorption / new party)."
  ],
  [
   "정당 대표와 파벌 대표의 이름 · 사진. 의원내각제에선 다수당 당수가 자동으로 총리가 됩니다.",
   "Names and photos of party and faction leaders. Under a parliamentary system, the majority party leader automatically becomes PM."
  ],
  [
   "의회별 이름과 총 의석 수, 정당마다 몇 석인지 정합니다. \"배정 합계\"는 총 의석 수를 넘을 수 없어요.",
   "Set each chamber's name and total seats, and how many seats each party has. The \"Assigned total\" can't exceed the total."
  ],
  [
   "원마다 따로 정합니다. 상원 · 삼원은 국가 › 설정에서 양원제 · 삼원제를 골랐을 때 나타나요.",
   "Set separately per chamber. The Senate and Third chamber appear when you choose bicameral/tricameral in Nation › Settings."
  ],
  [
   "지역구에서 당선된 의원 명단입니다. 이름 · 사진을 채우고, 궐석(빈자리)으로 처리하면 보궐선거를 치를 수 있어요. 지역구 선거를 치른 뒤에 채워집니다.",
   "The roster of district winners. Fill in names and photos, and mark seats vacant to hold by-elections. Filled after a district election."
  ],
  [
   "비례대표 의원 명단입니다. 자리마다 소속 정당 · 이름 · 사진을 정하고, 그 의원을 당수로 지정할 수 있어요.",
   "The list (PR) member roster. Set each seat's party, name and photo, and make a member party leader."
  ],
  [
   "정당들을 묶어 연립정부를 만듭니다. 집권 연정(★) · 대표당 · 각외협력 정당을 정하고, 단독 집권이나 무집권 상태로 둘 수도 있어요. 집권 세력은 반원에서 금색 테두리로 표시됩니다.",
   "Group parties into coalition governments. Set the ruling coalition (★), lead party and confidence-and-supply parties, or leave single-party or no government. The governing side gets a gold outline in the hemicycle."
  ],
  [
   "나라 전체의 설정과 입법 · 선거 · 기록을 다룹니다.",
   "Nation-wide settings, legislation, elections and records."
  ],
  [
   "나라의 기본 틀을 정합니다.",
   "Set up the basics of your nation."
  ],
  [
   "단원제 · 양원제 · 삼원제, 의장단(의장 · 부의장), 지역구 표시 방식(지도 · 그리드), 집권 세력 강조.",
   "Unicameral/bicameral/tricameral, presiding officers (speaker, deputies), district display (map/grid), highlight government."
  ],
  [
   "국가명 · 국기, 반원 가운데에 의석 수 또는 의회 로고 표시.",
   "Nation name and flag, and whether the hemicycle center shows the seat count or a chamber logo."
  ],
  [
   "화면 오른쪽 위에 보이는 현재 날짜와 회기, 표시 방식.",
   "The current date and session shown at the top right, and how they're displayed."
  ],
  [
   "자동저장 주기, 이름 붙여 저장 · 불러오기, 파일(.json)로 저장 · 불러오기, 초기화.",
   "Autosave interval, named saves and loading, saving/loading files (.json), and reset."
  ],
  [
   "법안을 만들고 통과시키는 과정입니다.",
   "Drafting bills and getting them passed."
  ],
  [
   "새 법안 작성(제목 · 내용 · 태그 · 가결 기준), 기존 법안 수정과 개정안.",
   "Write new bills (title, text, tags, passing threshold), edit existing bills and amendments."
  ],
  [
   "법안을 의회 또는 국무회의에 올립니다. 검색 · 태그로 찾을 수 있어요.",
   "Table bills in parliament or the Cabinet Council. Find them by search or tags."
  ],
  [
   "정당별 · 의원별 찬반 표결. 거부권이 있으면 통과된 법안을 거부할 수 있습니다.",
   "Vote yea/nay by party or by member. With a veto, passed bills can be vetoed."
  ],
  [
   "내각이 의결하는 법안의 표결과 의결 정족수.",
   "Votes on bills decided by the cabinet, and the quorum."
  ],
  [
   "선거를 치르고 개표합니다. 결과는 여론 탭의 지지율 · 성향을 바탕으로 정해져요.",
   "Hold elections and count votes. Results are based on support and leanings from the Opinion tabs."
  ],
  [
   "대통령(총리직선제면 총리) 선거 개표.",
   "Count presidential elections (or PM elections under direct PM election)."
  ],
  [
   "의회 선거 — 비례 · 지역구 · 전체 방식, 궐석 지역구만 다시 뽑는 보궐선거, 개표 속도.",
   "Parliamentary elections — list, district or both, by-elections for vacant districts only, and counting speed."
  ],
  [
   "대선 방식(단순 다수 · 결선투표 · 선거인단), 지지율을 가져올 기준 원, 후보.",
   "Presidential method (first-past-the-post / two-round / electoral college), the base chamber for support, and candidates."
  ],
  [
   "지나간 일을 모아 둡니다.",
   "A record of what has happened."
  ],
  [
   "가결 · 부결 · 거부된 법안 보관함 (상태별로 걸러 보기).",
   "Archive of passed, rejected and vetoed bills (filter by status)."
  ],
  [
   "지난 선거 결과.",
   "Past election results."
  ],
  [
   "정당별로 다음 총선 개표 1회에 한해 부정선거를 시도할 수 있습니다. 발각되면 그 정당은 활동 금지 처분을 받아요.",
   "Each party can attempt election fraud once, in the next general election count. If caught, the party is banned."
  ],
  [
   "선거 결과를 좌우하는 지역구 · 성향 · 지지율을 정합니다. 여기서 정한 값으로 국가 › 선거에서 개표해요.",
   "Set the districts, leanings and support that decide elections. Nation › Elections counts votes using these values."
  ],
  [
   "지역구를 만들고 원별 의석 수를 정합니다. 맵 메이커에서 만든 지도(.jsx)를 올리면 실제 지도 모양의 지역구를 쓸 수 있어요.",
   "Create districts and set their seats per chamber. Upload a map (.jsx) made in the Map Maker to use real map-shaped districts."
  ],
  [
   "지역구마다 정당별 성향(%)을 정합니다. 지역구 선거에서 어느 정당이 이길지가 여기서 갈려요.",
   "Set each party's leaning (%) per district. This decides who wins district elections."
  ],
  [
   "권역형 비례대표를 쓸 때 지역구를 권역으로 묶습니다. 권역 득표율은 지역구 성향을 평균하는 자동 집계나 직접 입력 중에서 고릅니다.",
   "Group districts into regions for regional list PR. Region vote shares are either averaged from district leanings or entered by hand."
  ],
  [
   "정당별 지지율(%)과 오차 범위를 정합니다. 비례대표 의석과 대선 결과의 바탕이 되고, 선거를 치르려면 꼭 필요해요. 전국형 · 권역형 비례를 고를 수 있습니다.",
   "Set each party's support (%) and margin of error. It drives list seats and presidential results and is required to hold an election. Choose national or regional lists."
  ],
  [
   "정부를 이끄는 사람들과 그 권한을 다룹니다. 의석 화면의 \"내각\" 탭에 한눈에 보여요.",
   "The people who lead the government and their powers. See them at a glance in the \"Cabinet\" tab of the seat screen."
  ],
  [
   "정부 형태(대통령제 · 이원집정부제 · 의원내각제 · 입헌군주제 · 집단지도체제)와 직책 이름, 그리고 법안 거부권 · 비상사태 · 의회 해산 · 계엄령 권한을 누가 가질지 정합니다. 의회 해산은 의회 전체 또는 한 원(예: 하원)만 고를 수 있어요.",
   "Choose the form of government (presidential / semi-presidential / parliamentary / constitutional monarchy / collective leadership), position titles, and who holds the veto, state of emergency, dissolution and martial law powers. Dissolution can target the whole parliament or one chamber (e.g. the lower house)."
  ],
  [
   "대통령의 이름 · 사진 · 소속 정당. 의원에서 불러오면 그 의원 정보와 연결돼 함께 바뀝니다.",
   "The president's name, photo and party. Load from a member to link them so they stay in sync."
  ],
  [
   "총리 선출 방식(다수당 대표 자동 · 총리직선제), 현재 총리 고정, 부총리, 내각 불신임안 발의. 건설적 불신임제(독일 · 이스라엘식)를 켜면 불신임안에 후임을 함께 지명하고, 가결되면 그 후임이 바로 총리가 됩니다.",
   "How the PM is chosen (majority leader automatically / direct election), locking the current PM, deputy PMs, and filing no-confidence motions. With the constructive vote of no confidence (German/Israeli style), the motion names a successor who becomes PM immediately if it passes."
  ],
  [
   "장관 · 국무위원을 추가하고 직책 · 이름 · 사진 · 소속 정당을 정합니다.",
   "Add ministers and cabinet members and set their positions, names, photos and parties."
  ],
  [
   "화면 맨 위의 세이브 탭 바와 왼쪽 메뉴(사이드바) 쓰는 법입니다.",
   "How to use the save tab bar at the top and the menu (sidebar) on the left."
  ],
  [
   "⌂ 집 아이콘",
   "⌂ Home icon"
  ],
  [
   "탭 바 맨 왼쪽. 누르면 지금 상태를 바로 저장한 뒤 메인 화면(시작 화면)으로 돌아갑니다.",
   "At the far left of the tab bar. Saves right away, then returns to the main (start) screen."
  ],
  [
   "세이브 탭",
   "Save tabs"
  ],
  [
   "탭 하나하나가 세이브(나라 하나)입니다. 누르면 확인창 없이 그 세이브로 바로 바뀌고, 진행 상황은 세이브마다 따로 자동저장돼요.",
   "Each tab is a save (one nation). Click to switch to it instantly with no confirmation; progress is autosaved separately for each save."
  ],
  [
   "맨 앞의 기본 자동저장 — 어느 세이브에도 속하지 않은 작업을 담아 두어 기존 데이터가 사라지지 않게 합니다.",
   "The default autosave at the front — holds work that doesn't belong to any save so existing data is never lost."
  ],
  [
   "이름 바꾸기",
   "Rename"
  ],
  [
   "탭 이름을 더블클릭 (또는 국가 › 설정 › 저장의 ✎).",
   "Double-click the tab name (or ✎ in Nation › Settings › Save)."
  ],
  [
   "그 세이브 삭제 (확인 후).",
   "Delete that save (after confirming)."
  ],
  [
   "+ 새 세이브",
   "+ New save"
  ],
  [
   "새 세이브를 만듭니다.",
   "Creates a new save."
  ],
  [
   "새로 생성",
   "Create new"
  ],
  [
   "아무것도 없는 기본 상태에서 새로 시작 — 지금 화면은 복사되지 않아요.",
   "Start fresh from the default state — the current screen isn't copied."
  ],
  [
   "프리셋에서 생성",
   "Create from preset"
  ],
  [
   "튜토리얼 공화국처럼 미리 준비된 나라의 복사본으로 시작.",
   "Start from a copy of a ready-made nation, like the Tutorial Republic."
  ],
  [
   "메뉴 묶음과 항목",
   "Menu groups and items"
  ],
  [
   "의회 · 국가 · 여론 · 내각 · 도움말 다섯 묶음과 그 안의 항목. 항목을 누르면 그 기능 화면이 열리고, 묶음 제목을 누르면 접히거나 펼쳐집니다 (다음에 열어도 그대로 기억).",
   "Five groups — Parliament, Nation, Opinion, Cabinet, Help — and their items. Click an item to open that screen; click a group title to collapse or expand it (remembered next time)."
  ],
  [
   "사이드바 접기",
   "Collapse sidebar"
  ],
  [
   "사이드바 머리 오른쪽의 접기 버튼으로 아이콘만 남기고 접어 편집 화면을 넓게 쓸 수 있어요. 접힌 상태에선 아이콘을 누르면 그 묶음으로 바로 이동합니다.",
   "Use the collapse button at the right of the sidebar header to shrink it to icons and widen the edit area. When collapsed, click an icon to jump to that group."
  ],
  [
   "편집 패널 머리 · 폭 조절",
   "Edit panel header · resizing"
  ],
  [
   "편집 패널 맨 위에는 라이트/다크에선 지금 위치(묶음 › 항목), 네온에선 \"MINISTRY OF INTERIOR\" 띠와 국가명이 보입니다. 편집 패널과 시각 화면 사이 경계를 끌면 폭을 바꿀 수 있고, 더블클릭하면 기본 폭으로 돌아가요.",
   "The top of the edit panel shows your location (group › item) in Light/Dark, or the \"MINISTRY OF INTERIOR\" strip and nation name in Neon. Drag the border between the edit panel and visuals to resize; double-click to reset."
  ],
  [
   "실행 버튼과 단축키",
   "Execute button and shortcuts"
  ],
  [
   "설정을 바꾼 뒤 \"PROTOCOL EXECUTE\"(실행)를 누르면 시각 화면이 새로 그려집니다.",
   "After changing settings, press \"PROTOCOL EXECUTE\" to redraw the visuals."
  ],
  [
   "입력 칸 밖에서 누르면 실행.",
   "Execute (when not typing in a field)."
  ],
  [
   "바로 저장.",
   "Save now."
  ],
  [
   "되돌리기 (Ctrl+Shift+Z로 다시 실행).",
   "Undo (Ctrl+Shift+Z to redo)."
  ],
  [
   "열려 있는 확인 · 안내 · 내보내기 창 닫기.",
   "Close open confirm, notice or export windows."
  ],
  [
   "모바일 화면 모드",
   "Mobile UI mode"
  ],
  [
   "메인 메뉴 › 설정의 화면 모드(UI MODE)에서 모바일을 고르면 사이드바 대신 화면 아래 탭 바(묶음 + 의석)와 떠 있는 실행 버튼을 씁니다. 세부 항목은 위쪽 칩 줄에서 고르고, \"의석\"을 누르면 시각 화면으로 넘어가요.",
   "Choose Mobile under UI MODE in Main menu › Settings to use a bottom tab bar (groups + Seats) and a floating execute button instead of the sidebar. Pick items from the chip row at the top; tap \"Seats\" for the visuals."
  ],
  [
   "화면 오른쪽(모바일은 \"의석\")의 시각 탭 — 설정한 내용이 그림으로 보이는 곳입니다.",
   "The visual tabs on the right (\"Seats\" on mobile) — where your settings are drawn."
  ],
  [
   "하원(첫 번째 의회)의 의석을 반원으로 보여줍니다. 위쪽 \"반원 / 지역구\"로 지역구 지도 보기로 바꿀 수 있고, 아래에는 여당 · 야당별 정당 카드(의석 수 · 비율 · 파벌)와 원외정당, 의장단이 나와요.",
   "Shows the House (first chamber) seats as a hemicycle. Switch to the district map with \"Hemicycle / District\" at the top; below are party cards for government and opposition (seats, share, factions), extra-parliamentary parties and presiding officers."
  ],
  [
   "상원(두 번째 의회)의 의석. 보는 법은 하원과 같습니다.",
   "Senate (second chamber) seats. Works the same as the House."
  ],
  [
   "삼원(세 번째 의회)의 의석.",
   "Third chamber seats."
  ],
  [
   "대통령 · 총리 · 부총리 · 국무위원 등 정부 구성원을 카드로 한눈에 보여줍니다. 내각 묶음에서 정한 내용이 여기 반영돼요.",
   "Shows the president, PM, deputy PMs, ministers and other government members as cards. Reflects what you set in the Cabinet group."
  ],
  [
   "지역구 지도. 여론 › 지역구를 열면 나타나고, 지역구를 눌러 편집할 수 있어요. 탭의 ×로 닫습니다.",
   "District map. Appears when you open Opinion › Districts; click a district to edit it. Close with the × on the tab."
  ],
  [
   "정당별 성향 지도. 여론 › 성향을 열면 나타나며, 지역구마다 어느 정당 쪽인지 색으로 보여요.",
   "Party leaning map. Appears when you open Opinion › Tendency and colors each district by which party it leans toward."
  ],
  [
   "권역 지도. 여론 › 권역을 열면 나타나고, 지역구를 칠해 권역으로 묶습니다.",
   "Region map. Appears when you open Opinion › Regions; paint districts to group them into regions."
  ],
  [
   "총선 개표 화면과 결과. 개표가 진행되는 모습, 정당별 득표와 직전 대비 의석 변동(▲/▼)을 보여주고, 결과를 확인한 뒤 국가 › 선거의 \"✔ 의회에 반영\"을 누르면 그 결과대로 의석이 바뀝니다.",
   "General election count and results. Shows the count in progress, votes by party and seat changes (▲/▼); after checking, press \"✔ Apply to Parliament\" in Nation › Elections to update the seats."
  ],
  [
   "총선을 개표하면 원마다 생겨요",
   "appears per chamber after a general election count"
  ],
  [
   "양원제 · 삼원제일 때 나타나요",
   "appears with bicameral/tricameral"
  ],
  [
   "삼원제일 때 나타나요",
   "appears with tricameral"
  ],
  [
   "날짜 · 회기",
   "Date · Session"
  ],
  [
   "시각 화면 오른쪽 위에 보이는 현재 날짜와 회기. 국가 › 설정 › 날짜에서 정합니다 (\"열기\"로 이동).",
   "The current date and session at the top right of the visuals. Set them in Nation › Settings › Date (\"Open\" takes you there)."
  ],
  [
   "좌석 정보 · 이미지 내보내기",
   "Seat info · image export"
  ],
  [
   "좌석(점)을 누르면 그 자리의 정당 · 의원 정보 카드가 뜹니다. 반원 · 지도 · 선거 결과 · 내각 화면에서 오른쪽 클릭(모바일은 길게 누르기) → \"내보내기...\"를 고르면 이미지로 저장할 수 있어요.",
   "Click a seat (dot) to see that seat's party and member info. Right-click (long-press on mobile) the hemicycle, maps, election results or cabinet view and choose \"Export...\" to save an image."
  ],
  [
   "화면 둘러보기",
   "Screen Tour"
  ],
  [
   "메뉴 이동 · 의석 화면 · 세이브",
   "Menus · seat screen · saves"
  ],
  [
   "튜토리얼 공화국에 오신 것을 환영합니다",
   "Welcome to the Tutorial Republic"
  ],
  [
   "가상의 나라 \"튜토리얼 공화국\"에서 기본 조작을 직접 해보며 배웁니다. 튜토리얼은 #1 ~ #5로 짧게 나뉘어 있고, 밝게 표시된 곳을 실제로 조작해야 다음 단계로 넘어가요. 이 나라는 복사본(새 세이브)이라 마음껏 바꿔도 괜찮습니다.",
   "Learn the basics hands-on in the fictional \"Tutorial Republic\". The tutorial is split into short lessons #1–#5, and you move on by actually using the highlighted control. This nation is a copy (a new save), so feel free to change anything."
  ],
  [
   "메뉴 이동하기",
   "Using the menu"
  ],
  [
   "기능은 의회 · 국가 · 여론 · 내각 네 묶음으로 나뉘어 있고, 회색 \"도움말\"에는 모든 탭의 설명이 있어요. 화면 아래 탭 바에서 \"의회\"를 누르고, 위쪽 칩 줄에서 \"정당\"을 골라보세요.",
   "Features are grouped into Parliament, Nation, Opinion and Cabinet, and the gray \"Help\" explains every tab. Tap \"Parliament\" in the bottom tab bar, then pick \"Parties\" in the chip row at the top."
  ],
  [
   "기능은 의회 · 국가 · 여론 · 내각 네 묶음으로 나뉘어 있고, 맨 아래 회색 \"도움말\"에는 모든 탭의 설명이 있어요. 왼쪽 메뉴에서 의회 › 정당을 눌러보세요.",
   "Features are grouped into Parliament, Nation, Opinion and Cabinet, and the gray \"Help\" at the bottom explains every tab. Click Parliament › Parties in the left menu."
  ],
  [
   "정당 화면이 열렸어요.",
   "The Parties screen is open."
  ],
  [
   "의석 살펴보기",
   "Exploring the seats"
  ],
  [
   "의석은 반원 모양으로 그려집니다. 아래 탭 바의 \"의석\"을 눌러 의석 화면으로 간 뒤, 좌석(점) 하나를 눌러보세요.",
   "Seats are drawn as a hemicycle. Tap \"Seats\" in the bottom tab bar to go to the seat screen, then tap a seat (dot)."
  ],
  [
   "의석은 반원 모양으로 그려집니다. 좌석(점) 하나를 눌러보세요.",
   "Seats are drawn as a hemicycle. Click a seat (dot)."
  ],
  [
   "그 자리의 정당 · 의원 정보가 떴어요. 좌석을 오른쪽 클릭(길게 누르기)하면 이미지로 내보낼 수도 있어요.",
   "That seat's party and member info appeared. Right-click (long-press) a seat to export an image."
  ],
  [
   "맨 위의 탭 하나하나가 세이브입니다. +로 새 세이브(또는 프리셋 복사본)를 만들고, 탭 이름을 더블클릭하면 이름을 바꿀 수 있어요. 진행 상황은 자동으로 저장됩니다.",
   "Each tab at the top is a save. Use + to create a new save (or a preset copy), and double-click a tab name to rename it. Progress is saved automatically."
  ],
  [
   "정당과 의석",
   "Parties & Seats"
  ],
  [
   "정당 만들기 · 이름 짓기 · 의석 배정 · 다시 계산",
   "Create a party · name it · assign seats · recalculate"
  ],
  [
   "정당 만들기",
   "Creating a party"
  ],
  [
   "의회 › 정당 › 정보에서는 정당을 추가하고 이름 · 색 · 이념을 정합니다. \"[+] 정당 추가\"를 눌러 새 정당을 만들어 보세요.",
   "Parliament › Parties › Info is where you add parties and set their name, color and ideology. Press \"[+] Add party\" to create a new one."
  ],
  [
   "새 정당 \"신당\"이 목록에 생겼어요.",
   "The new party \"New Party\" appeared in the list."
  ],
  [
   "정당 이름 짓기",
   "Naming the party"
  ],
  [
   "방금 만든 정당의 이름 칸에 원하는 이름을 입력해 보세요. 옆의 색 칸으로 정당 색도 바꿀 수 있어요.",
   "Type a name in the new party's name box. You can also change its color with the color box next to it."
  ],
  [
   "멋진 이름이네요!",
   "Nice name!"
  ],
  [
   "빈자리 만들기",
   "Making room"
  ],
  [
   "의석 나눠주기",
   "Assigning seats"
  ],
  [
   "의석이 배정됐어요.",
   "Seats assigned."
  ],
  [
   "다시 계산하기",
   "Recalculating"
  ],
  [
   "설정을 바꾼 뒤에는 실행 버튼을 눌러 의석 화면을 새로 그립니다. 지금 눌러보세요. 아래 탭 바의 \"의석\"에서 새 정당의 자리를 확인할 수 있어요.",
   "After changing settings, press the execute button to redraw the seat screen. Press it now. You can see the new party's seats under \"Seats\" in the bottom tab bar."
  ],
  [
   "설정을 바꾼 뒤에는 이 버튼을 눌러 의석 화면을 새로 그립니다. 지금 눌러보세요. (입력 칸 밖에서 Enter 키를 눌러도 같아요)",
   "After changing settings, press this button to redraw the seat screen. Press it now. (Pressing Enter outside a text field does the same.)"
  ],
  [
   "의석 화면이 새로 그려졌어요. 새 정당의 자리도 생겼을 거예요.",
   "The seat screen was redrawn. The new party should have seats now."
  ],
  [
   "법안 제출 · 상정과 표결",
   "Submitting · tabling and voting"
  ],
  [
   "법안 제출하기",
   "Submitting a bill"
  ],
  [
   "국가 › 입법에서는 법안을 작성해 의회에 올리고 표결합니다. 법안 제목을 적고 \"[+] 법안 등록\"을 눌러보세요.",
   "Nation › Legislation is where you write bills, table them in parliament and vote. Enter a bill title and press \"[+] Register bill\"."
  ],
  [
   "법안이 등록됐어요!",
   "Bill registered!"
  ],
  [
   "상정과 표결",
   "Tabling and voting"
  ],
  [
   "등록한 법안은 상정 탭에서 의회(또는 국무회의)에 올리고, 표결 탭에서 정당별 · 의원별로 찬반 표를 던집니다. 가결 · 부결된 법안은 기록 탭에 남아요.",
   "Registered bills are tabled in parliament (or the Cabinet Council) from the Table tab, and voted on by party or member in the Vote tab. Passed and rejected bills stay in the Records tab."
  ],
  [
   "여론과 선거",
   "Opinion & Elections"
  ],
  [
   "지지율 입력 · 개표",
   "Entering support · counting votes"
  ],
  [
   "지지율 정하기",
   "Setting support"
  ],
  [
   "여론 › 지지율에서 정당마다 예상 지지율(%)을 정합니다. 선거는 이 숫자를 바탕으로 치러져요. 한 정당 이상에 지지율을 입력해 보세요 (예: 40).",
   "Opinion › Support is where you set each party's expected support (%). Elections are based on these numbers. Enter support for at least one party (e.g. 40)."
  ],
  [
   "지지율이 입력됐어요.",
   "Support entered."
  ],
  [
   "선거 치르기",
   "Holding an election"
  ],
  [
   "국가 › 선거 › 총선에서 \"개표 시작\"을 누르면 지지율에 따라 개표가 진행됩니다. 지금 눌러보세요.",
   "In Nation › Elections › General, press \"Start count\" to count votes based on support. Press it now."
  ],
  [
   "개표가 시작됐어요!",
   "The count has started!"
  ],
  [
   "개표 지켜보기",
   "Watching the count"
  ],
  [
   "개표가 진행 중입니다. 반원에 의석이 하나씩 채워지는 모습을 지켜보세요. ",
   "The count is in progress. Watch the hemicycle fill up seat by seat. "
  ],
  [
   "개표가 끝났어요. ",
   "The count is finished. "
  ],
  [
   "결과대로 의석이 바뀌고, 결과는 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있어요. 개표 속도는 선거 설정에서 조절합니다.",
   "Seats change to match the result, and you can export it as an image with right-click (long-press). Adjust the counting speed in the election settings."
  ],
  [
   "총리와 당수 · 국무위원 · 내각 화면",
   "PM and leaders · cabinet members · cabinet view"
  ],
  [
   "총리는 누가 될까?",
   "Who becomes PM?"
  ],
  [
   "내각 › 설정에서 대통령제 · 이원집정부제 · 의원내각제 등 정부 형태를 고릅니다. 튜토리얼 공화국은 의원내각제라, 의석이 가장 많은 정당의 대표(당수)가 자동으로 총리가 돼요 (👑 표시).",
   "Cabinet › Settings is where you choose the form of government (presidential, semi-presidential, parliamentary, ...). The Tutorial Republic is parliamentary, so the leader of the party with the most seats automatically becomes PM (marked 👑)."
  ],
  [
   "다수당 대표 정하기",
   "Choosing the majority leader"
  ],
  [
   "당수가 정해졌어요. 이제 내각 › 총리에도 이 사람이 총리로 표시됩니다.",
   "Leader set. They now appear as PM in Cabinet › PM too."
  ],
  [
   "국무위원 추가하기",
   "Adding a cabinet member"
  ],
  [
   "내각 › 내각에서 장관 같은 국무위원을 추가합니다. \"[+] 국무위원 추가\"를 눌러보세요.",
   "Cabinet › Cabinet is where you add ministers and other cabinet members. Press \"[+] Add cabinet member\"."
  ],
  [
   "국무위원 자리가 생겼어요. 이름 · 직책 · 소속 정당을 채울 수 있어요.",
   "A cabinet seat was added. You can fill in the name, position and party."
  ],
  [
   "내각 화면",
   "Cabinet view"
  ],
  [
   "의석 화면의 \"내각\" 탭에서 총리와 국무위원이 한눈에 보입니다. 오른쪽 클릭(길게 누르기)으로 이미지로 내보낼 수 있어요.",
   "The \"Cabinet\" tab of the seat screen shows the PM and cabinet at a glance. Export it as an image with right-click (long-press)."
  ],
  [
   "테마와 언어",
   "Theme & Language"
  ],
  [
   "메인 메뉴 › 설정에서 라이트 · 다크 · 네온 테마와 언어를 바꿀 수 있습니다. 이 튜토리얼은 시작 화면의 프리셋 목록에서 언제든 다시 할 수 있어요.",
   "Change the Light / Dark / Neon theme and the language in Main menu › Settings. You can redo this tutorial any time from the preset list on the start screen."
  ],
  [
   "직접 해보세요 — 해내면 \"다음\"이 열립니다",
   "Try it yourself — \"Next\" unlocks when you do"
  ],
  [
   "튜토리얼 목차",
   "Tutorial lessons"
  ],
  [
   " · 실습",
   " · Hands-on"
  ],
  [
   "#1 ~ #5를 모두 마쳤습니다. 이제 이 나라를 마음대로 바꿔보거나, 시작 화면에서 새 세이브를 만들어 나만의 나라를 꾸려보세요.",
   "You've finished #1–#5. Now change this nation however you like, or create a new save from the start screen and build your own."
  ],
  [
   "무엇을 배워볼까요?",
   "What would you like to learn?"
  ],
  [
   "하나하나 몇 단계로 짧게 끝납니다. 순서대로 하지 않고 골라서 해도 괜찮아요.",
   "Each one takes just a few steps. You can do them in any order."
  ],
  [
   "새 정당",
   "New Party"
  ],
  [
   "맨 위",
   "Top"
  ]
 ]
};
