// ===== DATANET PARLIAMENT SIMULATION — 튜토리얼(조작법 안내) =====
// "튜토리얼 공화국" 프리셋으로 시작하면 자동으로 켜지는 단계별 안내. 각 단계마다 화면의 한 곳을
// 밝게 비추고(나머지는 어둡게) 옆에 설명 말풍선을 띄운다. 필요한 탭은 단계에 들어갈 때 알아서 연다.
// 튜토리얼 중에는 아래 화면을 누를 수 없고(실수로 설정이 바뀌지 않게), 말풍선 버튼 또는 ←/→/Esc로 조작한다.
(function () {
    'use strict';

    const isMobileLayout = () => document.documentElement.getAttribute('data-ui-mode') === 'mobile';
    const hasEl = id => !!document.getElementById(id);
    // 메뉴: 데스크톱은 세로 사이드바, 모바일은 아래 탭 바 (없으면 원래 가로 탭 줄)
    const navTarget = () => isMobileLayout()
        ? (hasEl('mobileNav') ? '#mobileNav' : '.main-tab-container')
        : (hasEl('sideNav') ? '#sideNav' : '.main-tab-container');
    const execTarget = () => (isMobileLayout() && hasEl('mobileExecFab')) ? '#mobileExecFab' : '.simulate-btn';
    const go = (main, sub) => () => { if (typeof switchSubTab === 'function') switchSubTab(main, sub); };
    // 모바일 화면 모드에선 편집 패널/좌석 화면 중 하나만 보이므로 필요한 쪽으로 전환
    const showPanel = which => () => { if (isMobileLayout() && typeof setMobilePanel === 'function') setMobilePanel(which); };

    const STEPS = [
        {
            title: '튜토리얼 공화국에 오신 것을 환영합니다',
            text: '가상의 나라 "튜토리얼 공화국"에서 기본 조작을 차근차근 알려드릴게요. 튜토리얼은 이 나라의 복사본(새 세이브)에서 진행되니 마음껏 바꿔봐도 괜찮습니다.',
        },
        {
            target: navTarget,
            title: '메뉴',
            text: () => isMobileLayout()
                ? '화면 아래 탭 바에서 의회 · 국가 · 여론 · 내각 묶음을 고르고, 위쪽 칩 줄에서 세부 항목을 고릅니다. 맨 오른쪽 "의석"을 누르면 의석 화면으로 넘어가요.'
                : '의회 · 국가 · 여론 · 내각 네 묶음으로 기능이 나뉘어 있습니다. 묶음 제목을 누르면 접히고, 맨 위 버튼으로 메뉴 전체를 아이콘만 남기고 접을 수 있어요.',
        },
        {
            before: [go('setup', 'party'), showPanel('controls')],
            target: '#contentParty',
            title: '정당',
            text: '의회 › 정당에서 정당을 추가하고 이름 · 색 · 이념 · 당수 사진을 정합니다. 목록의 순서 손잡이(⋮⋮)를 끌어 순서를 바꿀 수 있어요.',
        },
        {
            before: [go('setup', 'settings'), showPanel('controls')],
            target: '#contentSettings',
            title: '의석 구성',
            text: '의회 › 구성에서 의회 이름과 총 의석 수, 정당별 의석 수를 입력합니다. 단원제/양원제/삼원제는 국가 › 설정에서 고를 수 있어요.',
        },
        {
            before: [showPanel('display')],
            target: '#houseCanvas',
            title: '의석 화면',
            text: '의석이 반원 모양으로 그려집니다. 좌석을 누르면 그 의원의 정보가, 오른쪽 클릭하면 이미지로 내보내기 메뉴가 뜹니다. 위쪽 "지역구" 버튼으로 지역구 지도 보기로 바꿀 수도 있어요.',
        },
        {
            before: [showPanel('controls')],
            target: execTarget,
            title: '다시 계산',
            text: () => isMobileLayout()
                ? '설정을 바꾼 뒤 떠 있는 "실행" 버튼을 누르면 의석 화면이 새로 그려집니다.'
                : '설정을 바꾼 뒤 이 버튼을 누르면 의석 화면이 새로 그려집니다. 입력 칸 밖에서 Enter 키를 눌러도 같습니다.',
        },
        {
            before: [go('nation', 'legislation'), showPanel('controls')],
            target: '#contentLegislation',
            title: '입법',
            text: '국가 › 입법에서 법안을 작성하고(제출) 의회나 국무회의에 올린 뒤(상정), 표결 탭에서 정당별 · 의원별로 표를 던집니다.',
        },
        {
            before: [go('nation', 'election'), showPanel('controls')],
            target: '#contentElection',
            title: '선거',
            text: '국가 › 선거에서 총선 · 대선을 치릅니다. 여론 › 지지율에서 정당 지지율을 정해두고 "개표 시작"을 누르면 개표가 진행돼요.',
        },
        {
            target: '#saveTabBar',
            title: '세이브',
            text: '맨 위의 탭 하나하나가 세이브입니다. +로 새 세이브(또는 프리셋 복사본)를 만들고, 탭 이름을 더블클릭하면 이름을 바꿀 수 있어요. 진행 상황은 자동으로 저장됩니다.',
        },
        {
            before: [go('setup', 'party'), showPanel('controls')],
            title: '준비 완료!',
            text: '메인 메뉴 › 설정에서 라이트 · 다크 · 네온 테마와 언어를 바꿀 수 있습니다. 이 튜토리얼은 시작 화면의 프리셋 목록에서 언제든 다시 볼 수 있어요.',
        },
    ];

    let layer = null, spot = null, bubble = null, index = 0, active = false, rafId = 0;

    function build() {
        layer = document.createElement('div');
        layer.className = 'tut-layer';
        layer.innerHTML = `
            <div class="tut-catcher"></div>
            <div class="tut-spot"></div>
            <div class="tut-bubble" role="dialog" aria-live="polite">
                <div class="tut-step"></div>
                <div class="tut-title"></div>
                <div class="tut-text"></div>
                <div class="tut-actions">
                    <button type="button" class="tut-skip">건너뛰기</button>
                    <span class="tut-spacer"></span>
                    <button type="button" class="tut-prev">이전</button>
                    <button type="button" class="tut-next">다음</button>
                </div>
            </div>`;
        document.body.appendChild(layer);
        spot = layer.querySelector('.tut-spot');
        bubble = layer.querySelector('.tut-bubble');
        layer.querySelector('.tut-skip').addEventListener('click', stop);
        layer.querySelector('.tut-prev').addEventListener('click', () => show(index - 1));
        layer.querySelector('.tut-next').addEventListener('click', () => (index >= STEPS.length - 1 ? stop() : show(index + 1)));
    }

    function resolveTarget(step) {
        if (!step.target) return null;
        const sel = typeof step.target === 'function' ? step.target() : step.target;
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return (r.width > 0 && r.height > 0) ? el : null;
    }

    function place() {
        if (!active) return;
        const step = STEPS[index];
        const el = resolveTarget(step);
        const vw = window.innerWidth, vh = window.innerHeight, pad = 8, gap = 14;
        const bw = bubble.offsetWidth, bh = bubble.offsetHeight;
        if (!el) {
            layer.classList.add('tut-no-target');
            bubble.style.left = Math.round((vw - bw) / 2) + 'px';
            bubble.style.top = Math.round((vh - bh) / 2) + 'px';
            return;
        }
        layer.classList.remove('tut-no-target');
        const r = el.getBoundingClientRect();
        const box = {
            left: Math.max(4, r.left - pad), top: Math.max(4, r.top - pad),
            right: Math.min(vw - 4, r.right + pad), bottom: Math.min(vh - 4, r.bottom + pad),
        };
        Object.assign(spot.style, { left: box.left + 'px', top: box.top + 'px', width: (box.right - box.left) + 'px', height: (box.bottom - box.top) + 'px' });
        // 말풍선: 오른쪽 → 왼쪽 → 아래 → 위 순서로 들어갈 자리를 찾는다
        let left, top;
        const clampY = y => Math.min(Math.max(12, y), vh - bh - 12);
        const clampX = x => Math.min(Math.max(12, x), vw - bw - 12);
        if (box.right + gap + bw <= vw - 12) { left = box.right + gap; top = clampY(box.top); }
        else if (box.left - gap - bw >= 12) { left = box.left - gap - bw; top = clampY(box.top); }
        else if (box.bottom + gap + bh <= vh - 12) { top = box.bottom + gap; left = clampX(box.left); }
        else if (box.top - gap - bh >= 12) { top = box.top - gap - bh; left = clampX(box.left); }
        else { left = clampX((vw - bw) / 2); top = clampY(vh - bh - 24); }
        bubble.style.left = Math.round(left) + 'px';
        bubble.style.top = Math.round(top) + 'px';
    }

    function schedulePlace() {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(place);
    }

    function show(i) {
        if (i < 0 || i >= STEPS.length) return;
        index = i;
        const step = STEPS[index];
        (step.before || []).forEach(fn => { try { fn(); } catch (e) { /* 탭 전환 실패는 안내만 계속 */ } });
        layer.querySelector('.tut-step').textContent = `${index + 1} / ${STEPS.length}`;
        layer.querySelector('.tut-title').textContent = step.title;
        layer.querySelector('.tut-text').textContent = typeof step.text === 'function' ? step.text() : step.text;
        layer.querySelector('.tut-prev').disabled = index === 0;
        layer.querySelector('.tut-next').textContent = index === STEPS.length - 1 ? '시작하기' : '다음';
        const el = resolveTarget(step);
        if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
        // 탭 전환 직후 레이아웃(캔버스 다시 그리기 등)이 끝난 뒤 위치를 잡는다
        requestAnimationFrame(() => requestAnimationFrame(place));
    }

    function onKey(e) {
        if (!active) return;
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); stop(); }
        else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); index >= STEPS.length - 1 ? stop() : show(index + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); show(index - 1); }
    }

    function start() {
        if (active) return;
        if (!layer) build();
        active = true;
        layer.style.display = '';
        window.addEventListener('resize', schedulePlace);
        window.addEventListener('keydown', onKey, true);
        show(0);
    }

    function stop() {
        if (!active) return;
        active = false;
        layer.style.display = 'none';
        window.removeEventListener('resize', schedulePlace);
        window.removeEventListener('keydown', onKey, true);
    }

    window.DnoTutorial = { start, stop, isActive: () => active, steps: STEPS.length };
})();
