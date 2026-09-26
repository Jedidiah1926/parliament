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

  function place(group) {
    const thumb = group._segThumb;
    if (!thumb) return;
    // 버튼 묶음을 통째로 다시 그리면(innerHTML) 선택 표시가 사라지므로 다시 넣는다
    if (thumb.parentNode !== group) {
      group.insertBefore(thumb, group.firstChild);
      group._segReady = false;
    }
    const item = activeItem(group);
    // 묶음이 숨겨져 있으면(크기 0) 다음에 보일 때 애니메이션 없이 바로 자리 잡도록
    if (!item || !group.offsetWidth || !item.offsetWidth) {
      if (thumb.style.opacity !== '0') thumb.style.opacity = '0';
      group._segReady = false;
      return;
    }
    const x = item.offsetLeft;
    const y = item.offsetTop;
    const w = item.offsetWidth;
    const h = item.offsetHeight;
    const radius = getComputedStyle(item).borderTopLeftRadius;
    const key = `${x},${y},${w},${h}`;
    if (group._segReady && group._segKey === key) return;

    if (!group._segReady) thumb.classList.add('seg-thumb-instant');
    thumb.style.width = w + 'px';
    thumb.style.height = h + 'px';
    thumb.style.transform = `translate(${x}px, ${y}px)`;
    thumb.style.borderRadius = radius;
    thumb.style.opacity = '1';
    if (!group._segReady) {
      thumb.offsetWidth; // 즉시 적용한 뒤 다음 변화부터 애니메이션
      thumb.classList.remove('seg-thumb-instant');
    }
    group._segReady = true;
    group._segKey = key;
  }

  function attach(group) {
    if (tracked.has(group)) return;
    tracked.add(group);
    const thumb = document.createElement('span');
    thumb.className = 'seg-thumb';
    thumb.setAttribute('aria-hidden', 'true');
    group.insertBefore(thumb, group.firstChild);
    group._segThumb = thumb;
    group.classList.add('seg-anim');
    // 라디오 묶음은 클래스가 아니라 checked 속성이 바뀌므로 change도 지켜본다
    group.addEventListener('change', () => schedule());
    if (resizeObserver) {
      resizeObserver.observe(group);
      Array.from(group.children).forEach(child => resizeObserver.observe(child));
    }
    place(group);
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
      tracked.forEach(group => {
        if (!group.isConnected) { tracked.delete(group); return; }
        if (isModern()) place(group);
      });
    });
  }

  function init() {
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
