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
        title: '1.1',
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
        title: '1.2',
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
        title: '1.3',
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
          },
          {
            status: 'current',
            title: '1.5.0 - 지역구/비례 시스템 개편',
            desc: `2026.08.29
              <br>- 설정에 데스크톱(가로형)/모바일(세로형) UI 모드 추가, 모바일 전용 레이아웃 및 좌우 패널 전환 버튼 신설
              <br>- 의회 > 구성 정당 카드 UI 개편 (로고 + 이름·상태 / 이념·의석 2행 레이아웃)
              <br>- 활동 금지된 정당은 표결·과반 계산에서 제외되고, 좌석 클릭 및 일괄 투표가 차단되도록 수정
              <br>- 각외협력을 다른 연정 소속 정당도 설정할 수 있도록 개선
              <br>- 순서 변경(⋮⋮) 핸들이 모바일 터치 드래그로도 동작하도록 수정
              <br>- 의회 > 의원 탭을 지역구 당선자 전용으로 분리하고, 의회 > 비례 탭을 신설해 정당별 비례 의석을 개별 명단으로 관리 (무소속의 비례 당선도 지원)
              <br>- 의회 > 의원 / 비례 탭에 검색(이름·#좌석번호) 및 정당·이념 다중 선택 필터 팝업 추가, 좌석 번호 표시
              <br>- 지역구 맵 미리보기 크기를 편집 화면과 동일하게 확대
              <br>- 파일명 체계 정리 (main/dno/roadmap/settings/teaser) 및 저장 파일 버전 v1.1로 업데이트
              <br>- 버그 수정 (정당 정보 재정렬 시 초기화 문제, 파벌 당수 이름 미반영 문제 등)`
          }
        ]
      },

      '1.5': {
        title: '1.5: We shall fight on the MAPS',
        cards: [
          {
            status: 'future',
            title: '1.5.0 - 모바일 환경 구현',
            desc: `2026.09.XX
              <br>- 모바일 환경에서도 구동 가능하도록 비율 또는 UI 수정
              <br>- 버그 수정`
          },
          {
            status: 'future',
            title: '1.5.1 - 지도 시스템',
            desc: `2026.09.XX
              <br>- 1차 개발`
          },
          {
            status: 'future',
            title: '1.5.2 - 지도 개발',
            desc: `2026.09.XX
              <br>- 2차 개발`
          },
          {
            status: 'future',
            title: '1.5.X - 프로그램 출시',
            desc: `2026.11.XX
              <br>- Windows 환경에서 Microsoft Store를 통해 사용할 수 있도록 최적화
              <br>- Android 환경에서 Google Play Store를 통해 사용할 수 있도록 최적화`
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

    window.addEventListener('load', () => renderRoadmap('1.4'));
    window.addEventListener('resize', syncRoadmapSize);

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(syncRoadmapSize);
      observer.observe(document.getElementById('roadmapViewport'));
      observer.observe(document.getElementById('roadmapTrack'));
    }
  
