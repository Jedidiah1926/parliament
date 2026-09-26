// ===== Hemicycle — 세로 탭 사이드바 =====
// 데스크톱 화면에서 메인 탭(의회/국가/여론/내각)을 접을 수 있는 그룹으로, 그 아래 2단 탭을
// 항목으로 보여주는 세로 사이드바를 .controls 왼쪽에 만든다 (모든 테마 공통).
// 사이드바는 기존 탭 버튼을 그대로 복제·클릭하는 "리모컨"일 뿐이라 탭 전환 로직은 전혀 바꾸지 않으며,
// MutationObserver로 원래 버튼의 활성/표시/라벨(언어 전환 포함) 변화를 따라간다.
// 모양은 css/sidenav.css(네온 기본) + css/modern.css(라이트/다크).
// 모바일 화면 모드에서는 사이드바 대신 같은 묶음을 화면 아래 탭 바(+ "의석" 화면 전환)로 보여주고,
// 실행(PROTOCOL EXECUTE) 버튼을 엄지가 닿는 곳에 떠 있는 버튼으로 둔다.
(function () {
    'use strict';

    const COLLAPSE_KEY = 'dnoSideNavCollapsed';
    const CLOSED_GROUPS_KEY = 'dnoSideNavClosedGroups';
    // Chrome 탭 그룹처럼 그룹마다 구분색 — 실제 색은 테마별 CSS가 data-tone에 맞춰 정한다
    const GROUP_TONES = { setup: 'info', law: 'purple', nation: 'orange', vote: 'danger', election: 'gold', cabinet: 'success', help: 'muted' };

    const WARN_ICON = '<span class="mn-item-icon"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">'
        + '<path d="M10 2.8 18.2 17H1.8Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
        + '<line x1="10" y1="8" x2="10" y2="12.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
        + '<circle cx="10" cy="14.6" r="1" fill="currentColor"/></svg></span>';

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 — 무시 */ } }
    function closedGroups() {
        try { return new Set(JSON.parse(safeGet(CLOSED_GROUPS_KEY) || '[]')); } catch (e) { return new Set(); }
    }

    // "⚙ 의회" → { icon: '⚙', label: '의회' } — 첫 토큰이 글자(한글/영문/숫자)가 아니면 아이콘으로 본다
    function splitIcon(text) {
        const t = text.replace(/\s+/g, ' ').trim();
        const m = t.match(/^(\S+)\s+(.+)$/);
        if (m && !/[\p{L}\p{N}]/u.test(m[1])) return { icon: m[1], label: m[2] };
        return { icon: t.charAt(0), label: t };
    }

    function isHidden(btn) {
        return btn.hidden || getComputedStyle(btn).display === 'none';
    }

    function mainKeyOf(btn) {
        const m = (btn.getAttribute('onclick') || '').match(/switchMainTab\('([^']+)'\)/);
        return m ? m[1] : btn.id.replace(/^mainTab/, '').toLowerCase();
    }

    function build() {
        const controls = document.querySelector('body > .controls');
        const mainBtns = Array.from(document.querySelectorAll('.main-tab-container .main-tab-btn'));
        if (!controls || !mainBtns.length) return;

        const nav = document.createElement('nav');
        nav.className = 'side-nav';
        nav.id = 'sideNav';
        nav.setAttribute('aria-label', '메뉴');
        nav.innerHTML = `
            <div class="mn-head">
                <div class="mn-brand">
                    <div class="mn-brand-title">Ministry of Interior</div>
                    <div class="mn-brand-sub" id="mnNationName"></div>
                </div>
                <button type="button" class="mn-collapse" id="mnCollapseBtn" title="사이드바 접기/펼치기" aria-label="사이드바 접기/펼치기">
                    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7.5" y1="3.5" x2="7.5" y2="16.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
            </div>
            <div class="mn-groups" id="mnGroups"></div>`;
        document.body.insertBefore(nav, controls);

        const title = document.createElement('div');
        title.className = 'mn-section-title';
        title.id = 'mnSectionTitle';
        controls.insertBefore(title, controls.firstChild);

        const groupsEl = nav.querySelector('#mnGroups');
        const closed = closedGroups();
        const groups = mainBtns.map(mainBtn => {
            const key = mainKeyOf(mainBtn);
            const content = document.getElementById('mainContent' + key.charAt(0).toUpperCase() + key.slice(1));
            const subContainer = content ? content.querySelector(':scope > .sub-tab-container') : null;
            const subBtns = subContainer ? Array.from(subContainer.querySelectorAll('.sub-tab-btn')) : [];

            const g = document.createElement('div');
            g.className = 'mn-group' + (closed.has(key) ? ' closed' : '');
            g.dataset.main = key;
            g.dataset.tone = GROUP_TONES[key] || 'info';
            g.innerHTML = `
                <button type="button" class="mn-group-head">
                    <span class="mn-icon"></span><span class="mn-label"></span>
                    <svg class="mn-chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 7.5 6 4.5 9 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <div class="mn-items"></div>`;
            const head = g.querySelector('.mn-group-head');
            const itemsEl = g.querySelector('.mn-items');
            const items = subBtns.map(subBtn => {
                const it = document.createElement('button');
                it.type = 'button';
                it.className = 'mn-item';
                it.addEventListener('click', () => {
                    if (!mainBtn.classList.contains('active')) mainBtn.click();
                    subBtn.click();
                });
                itemsEl.appendChild(it);
                return { el: it, src: subBtn };
            });
            head.addEventListener('click', () => {
                // 접힌 사이드바(아이콘만)에서는 그룹을 여닫지 않고 그 메뉴로 바로 이동
                if (document.body.classList.contains('side-nav-collapsed') || !items.length) {
                    mainBtn.click();
                    return;
                }
                g.classList.toggle('closed');
                const set = closedGroups();
                if (g.classList.contains('closed')) set.add(key); else set.delete(key);
                safeSet(CLOSED_GROUPS_KEY, JSON.stringify(Array.from(set)));
            });
            groupsEl.appendChild(g);
            return { key, g, head, mainBtn, items };
        });

        const nationSrc = document.getElementById('nationNameDisp');
        const nationDst = nav.querySelector('#mnNationName');

        // ---- 모바일: 아래 탭 바(묶음 4개 + 의석 화면) + 떠 있는 실행 버튼 ----
        const panelNow = () => document.documentElement.getAttribute('data-mobile-panel') || 'controls';
        const setPanel = p => { if (typeof window.setMobilePanel === 'function') window.setMobilePanel(p); };
        const mobileNav = document.createElement('nav');
        mobileNav.className = 'mobile-nav';
        mobileNav.id = 'mobileNav';
        mobileNav.setAttribute('aria-label', '메뉴');
        const mobileItems = groups.map(grp => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mobile-nav-btn';
            b.dataset.tone = GROUP_TONES[grp.key] || 'info';
            b.innerHTML = '<span class="mnb-icon"></span><span class="mnb-label"></span>';
            b.addEventListener('click', () => {
                const wasHere = panelNow() === 'controls' && grp.mainBtn.classList.contains('active');
                setPanel('controls');
                if (!grp.mainBtn.classList.contains('active')) grp.mainBtn.click();
                if (!wasHere || window.scrollY > 0) window.scrollTo({ top: 0, behavior: wasHere ? 'smooth' : 'auto' });
            });
            mobileNav.appendChild(b);
            return { b, grp };
        });
        const seatsBtn = document.createElement('button');
        seatsBtn.type = 'button';
        seatsBtn.className = 'mobile-nav-btn mobile-nav-seats';
        seatsBtn.dataset.tone = 'seats';
        // 의석 아이콘: 글꼴마다 기호 모양이 달라 반원형 의석 모양을 직접 그림
        seatsBtn.innerHTML = '<span class="mnb-icon"><svg width="20" height="12" viewBox="0 0 20 12" aria-hidden="true" fill="currentColor">'
            + '<circle cx="2" cy="10.5" r="1.6"/><circle cx="3.6" cy="5.6" r="1.6"/><circle cx="7.2" cy="2.3" r="1.6"/><circle cx="12.8" cy="2.3" r="1.6"/>'
            + '<circle cx="16.4" cy="5.6" r="1.6"/><circle cx="18" cy="10.5" r="1.6"/><circle cx="6.8" cy="8" r="1.6"/><circle cx="13.2" cy="8" r="1.6"/><circle cx="10" cy="6" r="1.6"/>'
            + '</svg></span><span class="mnb-label">의석</span>';
        seatsBtn.addEventListener('click', () => { setPanel('display'); window.scrollTo({ top: 0 }); });
        mobileNav.appendChild(seatsBtn);
        document.body.appendChild(mobileNav);

        const execSrc = document.querySelector('.simulate-btn');
        const fab = document.createElement('button');
        fab.type = 'button';
        fab.className = 'mobile-exec-fab';
        fab.id = 'mobileExecFab';
        fab.title = '다시 계산 (PROTOCOL EXECUTE)';
        // 네온은 원래 실행 막대 문구 그대로, 라이트/다크는 "▶ 실행" (CSS가 테마별로 하나만 보여줌)
        fab.innerHTML = '<span class="fab-neon">&gt;&gt; PROTOCOL EXECUTE &lt;&lt;</span><span class="fab-icon">▶</span><span class="fab-label">실행</span>';
        fab.addEventListener('click', () => { if (execSrc) execSrc.click(); });
        if (execSrc) document.body.appendChild(fab);

        function sync() {
            let activeGroup = null, activeItem = null;
            groups.forEach(grp => {
                const { icon, label } = splitIcon(grp.mainBtn.textContent);
                grp.head.querySelector('.mn-icon').textContent = icon;
                grp.head.querySelector('.mn-label').textContent = label;
                grp.head.title = label;
                const isActive = grp.mainBtn.classList.contains('active');
                grp.g.classList.toggle('active', isActive);
                grp.g.style.display = isHidden(grp.mainBtn) ? 'none' : '';
                if (isActive) activeGroup = label;
                grp.items.forEach(({ el, src }) => {
                    const text = src.textContent.replace(/\s+/g, ' ').trim();
                    // ⚠(부정선거)는 글꼴마다 기호 위치가 달라 위로 뜨므로, 글자 대신 가운데 맞춘 경고 아이콘을 그린다
                    if (text.replace(/[\uFE0E\uFE0F]/g, '') === '⚠') {
                        if (el.dataset.icon !== 'warn') { el.innerHTML = WARN_ICON; el.dataset.icon = 'warn'; }
                    } else {
                        el.textContent = text;
                        delete el.dataset.icon;
                    }
                    el.title = text;
                    el.style.display = isHidden(src) ? 'none' : '';
                    el.disabled = src.disabled;
                    el.classList.toggle('danger', src.classList.contains('sub-tab-btn-danger'));
                    const on = isActive && src.classList.contains('active');
                    el.classList.toggle('active', on);
                    if (on) activeItem = text;
                });
            });
            title.innerHTML = '';
            if (activeGroup) {
                const a = document.createElement('span'); a.className = 'mn-crumb'; a.textContent = activeGroup;
                title.appendChild(a);
                if (activeItem) {
                    const sep = document.createElement('span'); sep.className = 'mn-crumb-sep'; sep.textContent = '›';
                    const b = document.createElement('span'); b.className = 'mn-crumb-current'; b.textContent = activeItem;
                    title.append(sep, b);
                }
            }
            if (nationSrc) nationDst.textContent = nationSrc.textContent.trim();
            const onDisplay = panelNow() === 'display';
            mobileItems.forEach(({ b, grp }) => {
                const { icon, label } = splitIcon(grp.mainBtn.textContent);
                b.querySelector('.mnb-icon').textContent = icon;
                b.querySelector('.mnb-label').textContent = label;
                b.style.display = isHidden(grp.mainBtn) ? 'none' : '';
                const on = !onDisplay && grp.mainBtn.classList.contains('active');
                b.classList.toggle('active', on);
                b.setAttribute('aria-current', on ? 'page' : 'false');
            });
            seatsBtn.classList.toggle('active', onDisplay);
            seatsBtn.setAttribute('aria-current', onDisplay ? 'page' : 'false');
        }

        let scheduled = false;
        function scheduleSync() {
            if (scheduled) return;
            scheduled = true;
            requestAnimationFrame(() => { scheduled = false; sync(); });
        }
        const observer = new MutationObserver(scheduleSync);
        const opts = { attributes: true, attributeFilter: ['class', 'style', 'hidden', 'disabled'], childList: true, characterData: true, subtree: true };
        observer.observe(document.querySelector('.main-tab-container'), opts);
        groups.forEach(grp => grp.items[0] && observer.observe(grp.items[0].src.parentElement, opts));
        if (nationSrc) observer.observe(nationSrc, { childList: true, characterData: true, subtree: true });
        new MutationObserver(scheduleSync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mobile-panel', 'data-ui-mode'] });

        const collapseBtn = nav.querySelector('#mnCollapseBtn');
        function applyCollapsed(on) {
            document.body.classList.toggle('side-nav-collapsed', on);
            // 폭이 바뀌면 캔버스들이 ResizeObserver로 다시 그려진다 — 여기선 상태만 저장
            safeSet(COLLAPSE_KEY, on ? '1' : '0');
        }
        collapseBtn.addEventListener('click', () => applyCollapsed(!document.body.classList.contains('side-nav-collapsed')));
        applyCollapsed(safeGet(COLLAPSE_KEY) === '1');

        document.body.classList.add('has-side-nav');
        sync();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
})();
