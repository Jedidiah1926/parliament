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
            desc: `2026.07.09
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
            status: 'current',
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
            status: 'future',
            title: '1.4.8 - 의회 리워크 Part.II',
            desc: `2026 하반기 출시
              <br>- 의회 시스템 리워크 III (원외정당 시스템 추가, 날짜/회기 설정)
              <br>- 국가명·국기 설정 추가
              <br>- 저장 시스템 버전 업데이트 (v14)
              <br>- 버그 수정`
          },
          {
            status: 'future',
            title: '1.4.9 - 저장 리워크',
            desc: `2026 하반기 출시
              <br>- 저장/불러오기 시스템 최적화 및 안정화
              <br>- 저장 버전명 체계 도입 (v1.0부터 시작)
              <br>- 최근 추가된 기능들이 저장/불러오기에 정확히 반영되도록 개선
              <br>- 실행 취소 및 되돌리기 기능 추가
              <br>- 버그 수정`
          }
        ]
      },

      '1.5': {
        title: '1.5: TBA',
        cards: [
          {
            status: 'future',
            title: '1.5.0 - 모바일 출시',
            desc: `2027 출시
              <br>- 모바일 내에서도 구동 가능하도록 수정
              <br>- 버그 수정`
          },
          {
            status: 'future',
            title: '1.5.1 - 영어버전 출시',
            desc: `2027 출시
              <br>- 영어 번역 작업
              <br>- 버그 수정`
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
  
