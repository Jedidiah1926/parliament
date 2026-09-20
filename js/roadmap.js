    const roadmapData = {
      '0.0': {
        title: '0.0 : Beta',
        cards: [
          {
            status: 'done',
            title: '0.0.0 - 비공개 개발',
            desc: `2025.12.02
              <br>- 시뮬레이션 개발 시작
              <br>- 베타 생성`
          },
          {
            status: 'done',
            title: '0.0.1 - 일반 테마',
            desc: `2025.12.03
              <br>- 일반 테마 추가`
          },
          {
            status: 'done',
            title: '0.0.2 - TNO 테마',
            desc: `2025.12.30
              <br>- TNO 테마 추가
              <br>- 일반 테마 삭제
              <br>- 베타 삭제`
          }
        ]
      },
      '0.1': {
        title: '0.1 : Prerelease',
        cards: [
          {
            status: 'done',
            title: '0.1.0 - 선거 개발',
            desc: `2026.02.09
              <br>- 선거 시스템 개발 시도 I
              <br>- 프리릴리스 시작`
          },
          {
            status: 'done',
            title: '0.1.1 - 선거 삭제',
            desc: `2026.02.09
              <br>- 선거 시스템 개발 실패`
          },
          {
            status: 'done',
            title: '0.1.2 - 선거 추가',
            desc: `2026.03.09
              <br>- 선거 시스템 개발 시도 II`
          },
          {
            status: 'done',
            title: '0.1.3 - 버그 수정',
            desc: `2026.03.10
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '0.1.4 - 프리릴리스 삭제',
            desc: `2026.04.28
              <br>- 선거 시스템 개발 완료
              <br>- 프리릴리스 중단`
          }
        ]
      },
      '0.2': {
        title: '0.2 : Multi-lingual',
        cards: [
          {
            status: 'done',
            title: '0.2.0 - 다중언어 프로젝트 시작',
            desc: `2026.08.27
              <br>- 영어 추가
              <br>- 프로젝트 시작`
          },
          {
            status: 'current',
            title: '0.2.1 - 영어 개발 시작',
            desc: `2026.08.29
              <br>- 언어 설정 추가
              <br>- 초기 개발 성공`
          }
        ]
      },
      '1.0': {
        title: '1.0',
        cards: [
          {
            status: 'done',
            title: '1.0.0 - 프로젝트 시작',
            desc: `2026.01.11
              <br>- 프로젝트 공개`
          }
        ]
      },

      '1.1': {
        title: '1.1 : Saves',
        cards: [
          {
            status: 'done',
            title: '1.1.0 - 저장 추가',
            desc: `2026.01.11
              <br>- 저장/불러오기 시스템 추가
              <br>- 저장 시스템 버전 업데이트 (v1)`
          },
          {
            status: 'done',
            title: '1.1.1 - 버그 수정',
            desc: `2026.03.10
              <br>- 버그 수정`
          }
        ]
      },

      '1.2': {
        title: '1.2 : Laws',
        cards: [
          {
            status: 'done',
            title: '1.2.0 - 법안 추가',
            desc: `2026.04.25
              <br>- 입법/표결 시스템 추가
              <br>- UI 리워크 (정당 순서 자동/수동 설정)
              <br>- 저장 시스템 버전 업데이트 (v2)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.2.1 - 법안 보완',
            desc: `2026.04.28
              <br>- 입법/표결 시스템 보완 (기준선, 비율 설정, 태그 추가)
              <br>- 저장 시스템 버전 업데이트 (v3)
              <br>- 버그 수정`
          }
        ]
      },

      '1.3': {
        title: '1.3 : Elections',
        cards: [
          {
            status: 'done',
            title: '1.3.0 - 선거 추가',
            desc: `2026.04.29
              <br>- 선거 시스템 추가
              <br>- 저장 시스템 버전 업데이트 (v4)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.3.1 - UI 리워크',
            desc: `2026.04.30
              <br>- UI 리워크
              <br>- 당수 사진 및 이름 추가
              <br>- 저장 시스템 버전 업데이트 (v5)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.3.2 - 버그 수정',
            desc: `2026.05.01
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.3.3 - 정당 탭 신설',
            desc: `2026.05.03
              <br>- 정당 탭 신설 및 기능 재편
              <br>- 정당 로고 추가
              <br>- 저장 시스템 버전 업데이트 (v6)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.3.4 - 선거 일부 리워크',
            desc: `2026.05.06
              <br>- 선거 시스템 수정 (지역구 시스템 beta 추가)
              <br>- 저장 시스템 버전 업데이트 (v7)
              <br>- 버그 수정`
          }
        ]
      },

      '1.4': {
        title: '1.4 : The Great Reform',
        cards: [
          {
            status: 'done',
            title: '1.4.0 - 선거 리워크',
            desc: `2026.07.06
              <br>- 선거 시스템 리워크 I (지역구/지지율 시스템 추가)
              <br>- 파벌 시스템 추가 (당 내 파벌 추가)
              <br>- 사진 비율 조정
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.1 - 연정 리워크',
            desc: `2026.07.08
              <br>- 연정 시스템 리워크 (신임과 보완 추가)
              <br>- 저장 시스템 버전 업데이트 (v8)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.2 - 의회 리워크 Part.I',
            desc: `2026.07.08
              <br>- 의회 시스템 리워크 I (삼원제 추가)
              <br>- 저장 시스템 버전 업데이트 (v9)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.3 - 정당 리워크 Part.I',
            desc: `2026.07.09
              <br>- 정당 시스템 리워크 I (무소속 로직 리워크)
              <br>- 의회 시스템 리워크 II (의석 번호 추가)
              <br>- 저장 시스템 버전 업데이트 (v10)
              <br>- 로드맵 리워크 및 메인 화면 리워크
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.4 - 지역구 리워크',
            desc: `2026.07.10
              <br>- 지역구 시스템 리워크 (지역구 이름 설정 추가)
              <br>- 순서 시스템 리워크 (기존 화살표에서 슬라이딩 방식으로)
              <br>- 정당/연정 카드 리워크 (카드 접기 기능 추가) 
              <br>- 입법 시스템 리워크 (제출과 상정을 분리, 법안 수정 가능)
              <br>- 저장 시스템 버전 업데이트 (v11)
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.5 - 핫픽스',
            desc: `2026.07.13
              <br>- 정당이 안 생성되는 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.6 - 기록 리워크',
            desc: `2026.08.26
              <br>- 입법기록 리워크 (개정안 발의, 법안 버전 표기, 표결 세부 타임라인 추가)
              <br>- 선거기록 리워크 (정당별 세부 기록, 저장 시각 표기 추가)
              <br>- 입법 리워크 (개정안 및 법안에 버전 부여)
              <br>- 저장 시스템 버전 업데이트 (v12)
              <br>- 좌석 정보 카드 추가 (호버 대신 클릭으로 확인, 무소속 이름·파벌·집권 세력 표기)
              <br>- 좌석 호버 시 흰색 고리 표시 추가
              <br>- 연정 멤버/각외협력 목록에서 개별 무소속 의원을 이름(또는 좌석번호)으로 표시하도록 개선
              <br>- 툴팁이 화면 밖으로 벗어나지 않도록 위치 보정
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.7 - 정당 리워크 Part.II',
            desc: `2026.08.27
              <br>- 정당 시스템 리워크 II (정당 해산/금지 표기 추가)
              <br>- 저장 시스템 버전 업데이트 (v13)
              <br>- 시작 화면 리워크 (점검 안내/자동 리디렉션 페이지로 전환)
              <br>- 점검 기간 자동화 (자동으로 점검 안내 표시 및 리디렉션)
              <br>- 로드맵 카드 업데이트 로그가 길어지면 스크롤되도록 개선
              <br>- 선거 시스템 리워크 II (선거 > 지지율 탭 신설, "전체에 반영" 체크박스로 여러 원의 지지율 일괄 설정 지원)
              <br>- 지지율 탭의 하원·상원·삼원 표기가 사용자 설정 명칭을 실시간으로 따르도록 수정
              <br>- 선거 기록에서 저장 시각 표기 제거
              <br>- 좌석 정보 카드에서 투표 상태 표기 제거
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.8 - 의회 리워크 Part.II',
            desc: `2026.08.28
              <br>- 국가명·국기 설정 추가 (국가 > 설정, 헤더에 상시 표시)
              <br>- 의회 시스템 리워크 III (원외정당 시스템 추가, 의원실별로 정확히 판정하도록 개선)
              <br>- 날짜/회기 설정 추가 (회기 이름도 국회 외 다른 명칭으로 커스터마이즈 가능), 우측 디스플레이 패널 상단에 상시 표시
              <br>- "저장 시 사진 포함" 체크박스 제거 (항상 사진을 포함하여 저장하도록 변경)
              <br>- 국가 > 설정 신설에 맞춰 시작 화면 기본 탭을 국가 > 설정으로 변경
              <br>- 중위·하위 탭 디자인 정리
              <br>- 버그 수정`
          },
          {
            status: 'done',
            title: '1.4.9 - 저장 리워크',
            desc: `2026.08.29
              <br>- 자동저장 기능 추가 (localStorage 기반, 새로고침해도 유지)
              <br>- 저장 탭 신설 (자동저장 켜기/끄기, 저장 데이터 초기화, 파일로 저장/불러오기)
              <br>- 기존 SAVE/LOAD 버튼 제거 (저장 탭으로 통합)
              <br>- 실행 취소(Ctrl+Z) 및 다시 실행(Ctrl+Shift+Z) 기능 추가
              <br>- 저장 버전명 체계 변경 (v1.0부터 시작, KST 기준 타임스탬프)
              <br>- 최근 추가된 기능들이 저장/불러오기에 정확히 반영되도록 점검
              <br>- 버그 수정`
          }
        ]
      },

      '1.5': {
        title: '1.5: We shall fight on the MAPS',
        cards: [
          {
            status: 'done',
            title: '1.5.0 - 지역구/비례 시스템 개편',
            desc: `2026.08.30
              <br>- 설정에 데스크톱(가로형)/모바일(세로형) UI 모드 추가, 모바일 전용 레이아웃 및 좌우 패널 전환 버튼 신설
              <br>- 의회 > 구성 정당 카드 UI 개편 (로고 + 이름·상태 / 이념·의석 2행 레이아웃)
              <br>- 활동 금지된 정당은 표결·과반 계산에서 제외되고, 좌석 클릭 및 일괄 투표가 차단되도록 수정
              <br>- 각외협력을 다른 연정 소속 정당도 설정할 수 있도록 개선
              <br>- 순서 변경(⋮⋮) 핸들이 모바일 터치 드래그로도 동작하도록 수정
              <br>- 의회 > 의원 탭을 지역구 당선자 전용으로 분리하고, 의회 > 비례 탭을 신설해 정당별 비례 의석을 개별 명단으로 관리 (무소속의 비례 당선도 지원)
              <br>- 의회 > 의원 / 비례 탭에 검색(이름·#좌석번호) 및 정당·이념 다중 선택 필터 팝업 추가, 좌석 번호 표시
              <br>- 지역구 맵 미리보기 크기를 편집 화면과 동일하게 확대
              <br>- 파일명 체계 정리 (main/dno/roadmap/settings/teaser) 및 저장 파일 버전 v1.1로 업데이트
              <br>- 지역구/비례 의원 카드에도 (무소속이 아니어도) 사진을 등록할 수 있도록 개선
              <br>- 디스플레이 탭 바 구분선을 모바일 화면에서만 표시하도록 수정하고, 탭 버튼과 구분선이 붙어 보이도록 여백 제거
              <br>- 반원 중앙에 의석 수 대신 각 원(하원/상원/삼원)의 로고를 표시하는 기능 추가, 국가 > 설정에서 의석 수/로고 전환 버튼과 로고 업로드란 신설 (의석 수 입력은 기존대로 의회 > 구성에 유지)
              <br>- 로고 업로드란 클릭 시 파일 선택창이 뜨지 않던 문제, 로고 표시 크기 및 위치(반원 중앙 하단 정렬) 조정
              <br>- 로드맵 페이지 접속 시 항상 1.4 항목이 열리던 문제 수정 (진행 중인 최신 버전이 자동으로 열리도록 개선)
              <br>- 여러 의원실을 한 번에 개표한 뒤 "의회 반영"을 눌러도 마지막 의원실만 지역구 당선자 정보가 반영되고 나머지 의원실은 당선자가 표시되지 않던 문제 수정
              <br>- 버그 수정 (정당 정보 재정렬 시 초기화 문제, 파벌 당수 이름 미반영 문제, 의회 구성 변경 시 비례 탭 내부 탭이 갱신되지 않던 문제 등)`
          },
          {
            status: 'done',
            title: '1.5.M - Maps',
            desc: `2026.09.09
              <br>- 맵 메이커(구 맵 메이커, MINISTRY OF TRANSPORT)에서 만든 실제 지도 모양의 지역구를 .jsx로 내보내고, 지역구 탭에서 업로드해 하원·상원·삼원이 하나의 지도를 공유하는 "지도" 지역구 시스템 추가
              <br>- 지역구별로 원별 의석 수를 따로 지정할 수 있고, 도형을 클릭하면 이름·약칭·의석 수를 편집 가능 (약칭을 지정하면 지도 위 도형 가운데에 표시)
              <br>- 정당별 성향(%)은 지역구 탭이 아닌 성향 탭에서 지도를 직접 클릭해 편집하도록 이동, 육각형 방식과 달리 원(하원/상원/삼원)별로 독립된 성향 데이터를 가짐
              <br>- 국가 > 설정에 "지역구 시스템" 전환 토글 추가 (기본값 육각형, 지도로 전환 시 기존 구 지역구 탭이 지도 편집용으로 대체됨)
              <br>- 지도 지역구의 의석이 여러 개면 더 이상 한 정당이 전부 가져가지 않고, 비례 의석과 같은 최대잔여법으로 지역구 안에서도 여러 정당이 나눠 가지도록 개표 방식 개편, 개표 결과 지도에 정당별 획득 의석 수 배지 표시
              <br>- 성향 종합 지도와 개표 결과 지도 모두, 1위가 여러 정당으로 동률(경합)이면 빗금 무늬로 표시하고, 단독 1위는 득표율이 높을수록 정당 고유색에 가깝게, 낮을수록 흰색에 가깝게 표시
              <br>- 지도 업로드 시 배경/틀로 잘못 포함된 거대한 도형이 지역구들을 한쪽에 몰아넣던 문제, 도형 좌표 규모가 저장된 값과 달라 지역구가 안 보이던 문제 수정 (자동 경계상자 보정 + 이상치 도형 제외), 잘못 섞인 도형을 지도에서 직접 삭제하는 기능 추가
              <br>- 지도 지역구 테두리 색을 자유롭게 지정하고, 설정에서 고른 테마 색과 동기화하는 기능 추가
              <br>- 설정에 테마 색(강조색) 선택 기능 신설 (HEX 직접 입력, 기본값 초기화, 다른 탭에도 실시간 반영), 그동안 특정 화면에서만 고정 청록색으로 하드코딩돼 있던 옅은 배경/그림자 색상들도 모두 테마 색을 따라가도록 수정
              <br>- 정당·이념·연정·지역구 목록의 순서 변경(⋮⋮) 드래그가 카드를 포인터 위치까지 끌고 가다가 갑자기 맨 위로 튕기던 문제, 정당 목록을 드래그로 옮겨도 이념순 자동정렬이 되돌리던 문제 수정`
          },
          {
            status: 'done',
            title: '1.5.A - Assets',
            desc: `2026.09.14
              <br>- 캔버스/SVG 우클릭 시 뜨는 "내보내기..." 메뉴 신설 — 반원·지역구 지도 등 모든 시각화를 PNG/JPG/SVG 형식으로 다운로드 가능
              <br>- 내보내기 창에 "아래 의석 수 등 통계 포함" 체크박스 추가, 실제 화면과 동일한 카드 디자인(색상 띠·이름·의석·%·상태 태그·범례)으로 재현 (SVG는 실제 DOM을 그대로 담아 픽셀 단위로 동일, PNG/JPG는 캔버스 도형으로 재구성)
              <br>- 통계 포함 내보내기에 "무소속 펼치기"(개별 의원 명단 표시), "원외정당 포함하기"(의석 0석 정당도 포함), "당수/로고 사진 포함" 세부 옵션 추가 — 모두 화면 실제 접힘 상태에는 영향 없이 내보내기에만 반영
              <br>- 내보내기 창에 "최상단에 포함" 옵션(국기/국가 이름/날짜/회기) 추가 — 체크한 항목만 레터헤드 형태로 이미지 맨 위에 표시
              <br>- 모든 체크박스를 브라우저 기본 모양 대신 네온 테두리의 박스형 체크로 교체
              <br>- 의석 현황 화면 우측 상단 날짜/회기 표시를 두 줄로 나누고 날짜를 회기보다 밝게 표시하도록 변경 (내보내기 헤더와 동일한 스타일)
              <br>- 반원 중앙에 로고를 표시할 때 직사각형 로고까지 정사각형으로 늘려 원형으로 잘라내던 문제 수정 — 정사각형/원형 로고는 기존과 동일하게, 그 외 비율은 원본 비율을 유지한 채 표시
              <br>- 좌석 클릭 시 뜨는 정보 창에 각외협력 관계가 전혀 표시되지 않던 문제 수정
              <br>- 무소속 의원 개개인에게 활동중/활동 금지 상태 지정 기능 추가 — 과반 계산·좌석 정보 창·통계 카드에 정당과 동일하게 반영
              <br>- 지역구 시스템 기본값을 육각형에서 지도로 변경, "육각형"을 "그리드"로 이름 변경 및 선택 버튼 순서를 지도·그리드 순으로 조정
              <br>- 활동 금지된 정당은 지지율 탭에서 입력이 비활성화되고 살짝 흐리게 표시되며 이름 옆에 네온 스타일 "활동 금지" 배지가 붙음 (수치는 저장은 되지만) — 지지율 분포 및 차기 선거 의석 배분 계산에서는 실제로 반영되지 않도록 수정
              <br>- 상위 탭의 "저장"을 없애고 국가 > 설정 최하단으로 이동, 그 자리에 "내각" 탭 신설 (Coming Soon)`
          },
          {
            status: 'done',
            title: '1.5.P - Powers',
            desc: `2026.09.15
              <br>- 지역구 지도(SVG)에도 육각형 지도와 동일하게 이동/확대 기능 추가 — 휠클릭 드래그로 이동, Shift+스크롤로 확대/축소, 위치 초기화 버튼
              <br>- 상단 고정바에 있던 단원제/양원제/삼원제 선택 버튼을 국가 > 설정으로 이동
              <br>- 국가 > 설정을 의회/상징/날짜/저장 4개 내부 탭으로 분리하고 기존 설정 항목들을 재배치, 의회 탭에 각 원(하원/상원/삼원)의 의장·부의장 사진·이름 설정 기능 신설
              <br>- "내각" 탭 신설 (설정/대통령/총리/내각 4개 하위 탭)
              <br>&nbsp;&nbsp;· 설정: 정부 형태(대통령제/이원집정부제/의원내각제) 지정
              <br>&nbsp;&nbsp;· 설정: 법안 거부권 주체(없음/대통령/총리) 지정 및 표결 시스템에 통합 — 모든 원을 통과한 법안은 거부권자의 서명을 거쳐야 최종 가결되며, 거부 시 별도로 부결 처리 (서명 대기/거부됨 상태 및 기록 탭 액션 버튼 추가)
              <br>&nbsp;&nbsp;· 설정: 국가 비상사태(노랑)·의회 해산(주황)·계엄령(빨강) 각각 권한 주체 지정 및 선포/해제 기능, 선포 시 네온 스타일 "! OO !" 경고 배지 표시
              <br>&nbsp;&nbsp;· 대통령/총리: 사진·이름 설정 (정당 지도자와 동일한 카드 UI)
              <br>&nbsp;&nbsp;· 내각: 국무위원(사진·이름·직책) 추가/수정/삭제
              <br>- "전체에 반영" 동기화 체크박스의 배경·테두리가 하드코딩된 청록색 대신 테마 색을 따라가도록 수정
              <br>- 시작 화면의 점검 안내/자동 리디렉션 페이지(index.html)에도 설정에서 고른 테마 색이 반영되도록 수정 (그동안 테마 색 모듈이 로드되지 않아 항상 기본 청록색으로 고정돼 있던 문제)
              <br>- 위 신규 상태(정부 형태, 대통령, 총리, 내각 구성원, 거부권 주체, 비상사태 권한/상태, 의장단)를 저장/불러오기에 모두 반영
              <br>- 대통령/총리/국무위원에 당적(소속 정당) 표시 기능 추가, 대통령제에서는 총리 탭·라벨이 자동으로 "국무총리"로 전환
              <br>- 비상 권한 선포/해제 버튼이 항상 해당 색(노랑/주황/빨강)과 "! 라벨 !" 문구를 갖도록 수정, 실제 선포 버튼은 권한 주체로 지정된 대통령/총리(또는 집단지도체제일 땐 내각) 탭에 표시
              <br>- 정부 형태에 따라 거부권·비상 권한 주체로 고를 수 있는 대상 제한 (대통령제: 대통령만, 의원내각제: 총리만, 이원집정부제: 둘 다, 집단지도체제: 내각만)
              <br>- 우측 디스플레이 패널에 하원/상원/삼원처럼 항상 표시되는 "내각" 탭 신설 — 대통령/총리(또는 의장)·국무위원을 사진·이름·당적 카드로 표시
              <br>- 대통령·총리·국무위원을 실제 의원(지역구 당선자/비례 의원/무소속)과 연결해 이름·사진·당적을 자동으로 불러오고 계속 동기화하는 기능 추가 (수동 입력으로 언제든 되돌리기 가능)
              <br>- 국가 > 선거 > 선거를 대선/총선/설정 3개 내부 탭으로 분리, "대선(대통령 선거)" 신설 — 단순 다수 대표제/결선투표제/선거인단제 중 방식을 고르고, 후보별 득표율(또는 선거인단)을 계산해 당선자를 대통령에 자동 반영
              <br>- 각 정당의 선거 후보를 기본값(당수) 대신 의원 연결 또는 직접 입력으로 재지정할 수 있는 "후보 설정" 추가 (대선/총리 선거 공용)
              <br>- 총리 선출 과정 구현: 대통령제는 대통령이 후보를 지명하면 의회 심의(임명동의안 자동 발의)를 거쳐 확정, 의원내각제/이원집정부제는 기준 원의 다수당 대표가 자동으로 총리가 됨(총리직선제 체크박스로 총선 탭에서 직접선거로 전환 가능)
              <br>- 의원내각제/이원집정부제에서 내각(총리) 불신임안을 발의하고, 가결 시 현재 총리가 해임되는 기능 추가
              <br>- "집단지도체제" 정부 형태 신설 — 대통령/총리 탭이 사라지고 의장 1인 + 장관 여러 명이 모두 "내각" 탭으로 통합, 거부권·비상 권한 주체도 "내각"으로 지정 가능
              <br>- 집권 세력 강조(HIGHLIGHT GOV) 체크박스를 국가 > 설정 > 상징에서 의회 탭으로 이동
              <br>- 국무위원(장관) 목록에 순서 변경(⋮⋮) 드래그 추가
              <br>- 우측 디스플레이 패널의 "내각" 탭도 우클릭 → 내보내기로 PNG/JPG/SVG 다운로드 가능
              <br>- 비례 의원을 내각 직책에 연결할 때 사진이 반영되지 않던 문제 수정
              <br>- 대선/총리 직선에 무소속 후보도 출마할 수 있도록 개선
              <br>- 선거 후보 설정에서 의원 불러오기 목록이 해당 정당 소속 의원으로만 제한되도록 수정 (다른 정당 의원이 함께 뜨던 문제)
              <br>- 각 원(하원/상원/삼원)의 부의장을 여러 명 추가/삭제할 수 있도록 개선 (기존 1명 고정 → 기본 0명)
              <br>- 지역구 지도(SVG) 기본 배색을 밝은 단색 채우기 대신 어두운 톤 + 정당·성향 색의 네온 광원으로 변경, 도형 전체를 칠하는 대신 경계 안쪽에서 은은하게 빛나도록 표시
              <br>- SVG 지도 안내 문구 오타 수정 ("뉴 지역구 탭" → "지역구 탭")
              <br>- 단순 다수 대표제/이원집정부제/집단지도체제 버튼 및 대선·총리 선거 요약 문구의 줄바꿈 위치 정리
              <br>- 입법 > 상정 탭의 국회/국무회의 버튼에서 실제 선택된 쪽을 구분하기 어렵던 문제 수정 (선택된 쪽만 색이 채워지고 ✔ 표시)
              <br>- 저장 파일 버전 v1.2로 업데이트`
          },
          {
            status: 'done',
            title: '1.5.S - Scandals',
            desc: `2026.09.16
              <br>- 부정선거 추가
              <br>- 부정선거 탭 잠금 해제 (정식 공개)
              <br>- 의석 현황 화면 우측 상단 날짜/회기 글씨 크기 확대
              <br>- 사진 포함 내보내기 최상단 헤더의 국기·국가 이름·날짜·회기 글씨 크기 확대`
          },
          {
            status: 'current',
            title: '1.5.5 - Saves',
            desc: `2026.09.20
              <br>- 정당/파벌 옆에 복제(사본) 버튼 추가
              <br>- 선거 결과 카드에 직전 대비 의석 증감(▲/▼) 표시
              <br>- 조작 탭과 화면 탭 사이 경계를 드래그로 리사이즈 가능, 더블클릭으로 기본 폭 복원, 리사이즈 시 반원 캔버스가 찌그러지던 문제 수정
              <br>- 키보드 단축키 추가: Ctrl+S(즉시 저장 + "저장됨" 토스트), Enter(입력 중이 아닐 때 프로토콜 실행), Esc(열려 있는 확인/알림/내보내기 창 닫기)
              <br>- 입법 > 기록 탭에 가결/부결(거부권 포함)/서명 대기 상태 필터 추가
              <br>- 저장 시스템 전면 개편: 자동저장을 별도 메커니즘이 아니라 "자동저장"이라는 이름의 슬롯 하나로 통합, 이름 붙인 저장을 여러 개 만들고 인게임 저장 탭에서 자유롭게 전환 가능
              <br>- 자동저장 주기를 15초/30초/1분/3분/5분/10분 중 설정 > 저장 탭에서 선택 가능
              <br>- 메인 화면 "프로토콜 실행" 버튼을 누르면 새 세이브를 만들거나 기존 세이브(자동저장 포함)를 골라 이어할 수 있는 온보딩 창 신설
              <br>- 이전 버전에서 쓰던 구 방식 자동저장 데이터를 새 저장 슬롯 형식으로 자동 이관 — 업데이트 후 세이브가 사라진 것처럼 보이는 문제 방지
              <br>- 남아있던 브라우저 기본 알림/확인 팝업을 모두 앱 자체 스타일 알림/확인 창으로 교체
              <br>- 무소속 통계 카드에서 당수 이름/사진이 표시되지 않도록 수정, 개별 의원 목록의 스크롤 높이 제한 제거
              <br>- 의장단/내각 표시 카드의 이름 잘림 폭 확대
              <br>- 내보내기 헤더 국가 이름 볼드체 제거
              <br>- 부정선거 시도 카드 내부 체크박스 등 폼 요소 색을 경고색(빨강)으로 통일
              <br>- JS/CSS 파일을 js/, css/ 폴더로 정리 (내부 구조 변경, HTML 진입점 경로는 그대로 유지)`
          },
          {
            status: 'future',
            title: '1.5.6 - ?',
            desc: `2026.09.XX
              <br>- ???`
          },
          {
            status: 'future',
            title: '1.5.7 - ?',
            desc: `2026.10.XX
              <br>- ???`
          },
          {
            status: 'future',
            title: '1.5.8 - ?',
            desc: `2026.10.XX
              <br>- ???`
          },
          {
            status: 'future',
            title: '1.5.9 - 프로그램 출시',
            desc: `2026.11.XX
              <br>- Steam 서비스 준비
              <br>- Steam 개발자 계정을 위한 펀딩 시작`
          }
        ]
      },
      '1.6': {
        title: '1.6',
        cards: [
          {
            status: 'future',
            title: '1.6.0 - ?',
            desc: `2026.XX.XX
              <br>- ?`
          }
        ]
      },
      '1.7': {
        title: '1.7',
        cards: [
          {
            status: 'future',
            title: '1.7.0 - ?',
            desc: `2026.XX.XX
              <br>- ?`
          }
        ]
      },
      '2.0': {
        title: '2.0',
        cards: [
          {
            status: 'future',
            title: '2.0.0 - ?',
            desc: `202X.XX.XX
              <br>- ?`
          }
        ]
      }
    };

    function escapeHTML(value) {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }


    function renderRoadmap(versionKey) {
      const data = roadmapData[versionKey];
      const titleEl = document.getElementById('roadmapVersionTitle');
      const track = document.getElementById('roadmapTrack');
      const line = document.getElementById('roadmapLine');

      if (!data || !titleEl || !track || !line) return;

      titleEl.textContent = data.title;

      track.querySelectorAll('.rd-card').forEach(card => card.remove());

      data.cards.forEach(item => {
        const article = document.createElement('article');
        article.className = `rd-card ${item.status || 'future'}`;

        article.innerHTML = `
          <h2 class="rd-title">${escapeHTML(item.title)}</h2>
          <p class="rd-desc">${item.desc}</p>
        `;

        track.appendChild(article);
      });

      document.querySelectorAll('.rd-version-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.version === versionKey);
      });

      requestAnimationFrame(syncRoadmapSize);
    }

    function syncRoadmapSize() {
      const viewport = document.getElementById('roadmapViewport');
      const track = document.getElementById('roadmapTrack');
      const line = document.getElementById('roadmapLine');
      const cards = Array.from(track.querySelectorAll('.rd-card'));

      if (!viewport || !track || !line || cards.length === 0) return;

      const gapText = getComputedStyle(track).gap || '14px';
      const gap = parseFloat(gapText) || 14;

      const viewportWidth = viewport.clientWidth;
      const visibleCards = 5;

      const minCardWidth = viewportWidth <= 880
        ? Math.min(260, Math.max(160, viewportWidth * 0.72))
        : 220;

      const naturalCardWidth = (viewportWidth - gap * (visibleCards - 1)) / visibleCards;
      const cardWidth = Math.max(minCardWidth, naturalCardWidth);

      const totalWidth = cards.length * cardWidth + Math.max(0, cards.length - 1) * gap;
      const trackWidth = Math.max(viewportWidth, totalWidth);

      track.style.width = trackWidth + 'px';

      cards.forEach(card => {
        card.style.flexBasis = cardWidth + 'px';
      });

      line.style.left = '0px';
      line.style.width = trackWidth + 'px';
    }

    document.querySelectorAll('.rd-version-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        renderRoadmap(btn.dataset.version);
      });
    });

    // 새 버전 섹션이 추가될 때마다 이 값을 손으로 고쳐야 했던 문제 방지 —
    // 가장 마지막에 등장하는 "현재 진행 중"(status:'current') 카드가 속한 섹션을 자동으로 기본 화면으로 선택
    function getDefaultVersionKey() {
      const keys = Object.keys(roadmapData);
      for (let i = keys.length - 1; i >= 0; i--) {
        if (roadmapData[keys[i]].cards.some(card => card.status === 'current')) return keys[i];
      }
      return keys[keys.length - 1];
    }

    window.addEventListener('load', () => renderRoadmap(getDefaultVersionKey()));
    window.addEventListener('resize', syncRoadmapSize);

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(syncRoadmapSize);
      observer.observe(document.getElementById('roadmapViewport'));
      observer.observe(document.getElementById('roadmapTrack'));
    }
  
