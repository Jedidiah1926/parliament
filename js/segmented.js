// 라이트/다크 모드 전용: 붙어 있는 버튼 묶음(세그먼트 컨트롤)의 선택 표시가
// 버튼 사이를 딱 끊겨 바뀌지 않고 미끄러지듯 옮겨 가도록 하는 공용 애니메이션.
// 묶음마다 선택 표시 역할을 하는 .seg-thumb 하나를 깔고, 선택된 버튼 자리로 옮긴다.
// (선택 상태를 바꾸는 코드는 그대로 두고 .active / 체크된 라디오만 지켜본다.)
(function () {
  const GROUPS = [
    '.main-tab-container',
    '.sub-tab-container-3',
    '.system-radio-group',
    '.rd-version-nav',
    '.settings-nav'
  ].join(',');

  // 스타일은 여기서 직접 넣는다 — 스크립트만 새로 받고 CSS는 예전 캐시가 쓰이면
  // 선택 표시가 버튼처럼 자리를 차지해 버튼이 밀리고 떨리던 문제 방지
  const STYLE = `
.seg-thumb { display: none; }
html[data-theme-family="modern"] .seg-anim { position: relative; }
html[data-theme-family="modern"] .seg-anim > .seg-thumb {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 0;
    pointer-events: none;
    background: var(--m-surface);
    box-shadow: var(--m-shadow-sm);
    transition: transform .28s cubic-bezier(.3, .9, .3, 1), width .28s cubic-bezier(.3, .9, .3, 1), height .28s cubic-bezier(.3, .9, .3, 1), opacity .15s ease;
    will-change: transform;
}
html[data-theme-family="modern"] .settings-nav.seg-anim > .seg-thumb { box-shadow: var(--m-shadow-sm), inset 0 0 0 1px var(--m-border); }
html[data-theme-family="modern"] .seg-anim > .seg-thumb.seg-thumb-instant { transition: none; }
html[data-theme-family="modern"] .seg-anim > :not(.seg-thumb) {
    position: relative;
    z-index: 1;
    transition: color .2s ease, background-color .2s ease;
}
html[data-theme-family="modern"] .seg-anim > .active:not(.seg-thumb),
html[data-theme-family="modern"] .seg-anim > .system-radio-btn:has(input:checked) {
    background: transparent !important;
    box-shadow: none !important;
}
@media (prefers-reduced-motion: reduce) {
    html[data-theme-family="modern"] .seg-anim > .seg-thumb { transition: none; }
}
`;
  function injectStyle() {
    if (document.getElementById('segAnimStyle')) return;
    const style = document.createElement('style');
    style.id = 'segAnimStyle';
    style.textContent = STYLE;
    (document.head || document.documentElement).appendChild(style);
  }

  const isModern = () => document.documentElement.getAttribute('data-theme-family') === 'modern';
  const tracked = new Set();
  let resizeObserver = null;

  function activeItem(group) {
    for (const el of group.children) {
      if (el.classList.contains('seg-thumb')) continue;
      if (el.classList.contains('active')) return el;
      const input = el.querySelector && el.querySelector('input[type="radio"]');
      if (input && input.checked) return el;
    }
    return null;
  }

  // 자리 잡기는 세 단계 — (1) 빠진 선택 표시 다시 넣기(쓰기) (2) 모든 묶음의 크기 · 위치 읽기 (3) 한꺼번에 쓰기.
  // 묶음마다 읽고 쓰기를 번갈아 하면 묶음 수만큼 레이아웃을 다시 계산해, 버튼 묶음이 많은 탭(시민 등)을 열 때 0.1~0.2초씩 멈췄다
  function reattach(group) {
    const thumb = group._segThumb;
    if (thumb && thumb.parentNode !== group) {
      // 버튼 묶음을 통째로 다시 그리면(innerHTML) 선택 표시가 사라지므로 다시 넣는다
      group.insertBefore(thumb, group.firstChild);
      group._segReady = false;
    }
  }
  function measure(group) {
    const thumb = group._segThumb;
    if (!thumb) return null;
    const item = activeItem(group);
    // 묶음이 숨겨져 있으면(크기 0) 다음에 보일 때 애니메이션 없이 바로 자리 잡도록
    if (!item || !group.offsetWidth || !item.offsetWidth) return { group, thumb, hidden: true };
    const x = item.offsetLeft, y = item.offsetTop, w = item.offsetWidth, h = item.offsetHeight;
    return { group, thumb, x, y, w, h, radius: getComputedStyle(item).borderTopLeftRadius, key: `${x},${y},${w},${h}` };
  }
  function write(m) {
    const { group, thumb } = m;
    if (m.hidden) {
      if (thumb.style.opacity !== '0') thumb.style.opacity = '0';
      group._segReady = false;
      return false;
    }
    if (group._segReady && group._segKey === m.key) return false;
    const instant = !group._segReady;
    if (instant) thumb.classList.add('seg-thumb-instant');
    thumb.style.width = m.w + 'px';
    thumb.style.height = m.h + 'px';
    thumb.style.transform = `translate(${m.x}px, ${m.y}px)`;
    thumb.style.borderRadius = m.radius;
    thumb.style.opacity = '1';
    group._segReady = true;
    group._segKey = m.key;
    return instant;
  }
  function placeAll(groups) {
    groups.forEach(reattach);
    const plans = groups.map(measure).filter(Boolean);
    const instant = plans.filter(write);
    if (instant.length) {
      instant[0].thumb.offsetWidth; // 즉시 적용한 뒤 다음 변화부터 애니메이션 (한 번만)
      instant.forEach(m => m.thumb.classList.remove('seg-thumb-instant'));
    }
  }
  function place(group) { placeAll([group]); }

  function attach(group) {
    if (tracked.has(group)) return;
    tracked.add(group);
    const thumb = document.createElement('span');
    thumb.className = 'seg-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    // 어떤 경우에도 버튼 줄의 자리를 차지하지 않도록 위치 지정은 인라인으로도 고정
    thumb.style.position = 'absolute';
    thumb.style.top = '0';
    thumb.style.left = '0';
    thumb.style.margin = '0';
    thumb.style.pointerEvents = 'none';
    group.insertBefore(thumb, group.firstChild);
    group._segThumb = thumb;
    group.classList.add('seg-anim');
    // 라디오 묶음은 클래스가 아니라 checked 속성이 바뀌므로 change도 지켜본다
    group.addEventListener('change', () => schedule());
    if (resizeObserver) {
      resizeObserver.observe(group);
      Array.from(group.children).forEach(child => resizeObserver.observe(child));
    }
    schedule(); // 다음 프레임에 다른 묶음과 함께 (그 자리에서 재면 묶음마다 레이아웃을 다시 계산)
  }

  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches(GROUPS)) attach(root);
    if (root.querySelectorAll) root.querySelectorAll(GROUPS).forEach(attach);
  }

  let pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const live = [];
      tracked.forEach(group => { if (!group.isConnected) tracked.delete(group); else live.push(group); });
      if (isModern()) placeAll(live);
    });
  }

  function init() {
    injectStyle();
    if ('ResizeObserver' in window) resizeObserver = new ResizeObserver(schedule);
    scan(document.body);
    new MutationObserver(mutations => {
      let relevant = false;
      for (const m of mutations) {
        if (m.target.classList && m.target.classList.contains('seg-thumb')) continue;
        relevant = true;
        if (m.type === 'childList') m.addedNodes.forEach(scan);
      }
      if (relevant) schedule();
    }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
    // 테마를 바꿨을 때(네온 ↔ 라이트/다크) 다시 자리 잡기
    new MutationObserver(() => {
      tracked.forEach(group => { group._segReady = false; });
      schedule();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme-family', 'data-theme-mode'] });
    window.addEventListener('resize', schedule);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
