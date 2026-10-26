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
    const GROUP_TONES = { setup: 'info', law: 'purple', nation: 'orange', vote: 'danger', election: 'gold', cabinet: 'success', help: 'muted', world: 'pink', economy: 'teal' };

    const WARN_ICON = '<span class="mn-item-icon"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">'
        + '<path d="M10 2.8 18.2 17H1.8Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
        + '<line x1="10" y1="8" x2="10" y2="12.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
        + '<circle cx="10" cy="14.6" r="1" fill="currentColor"/></svg></span>';

    // ── 최신 Teaser(1.6.9) 기준 전체 메뉴 — 이 화면(본 게임 · 각 Teaser)에 아직 없는 기능도 제자리에 🔒로 보여 준다 ──
    // 실제 탭 버튼이 있으면 그대로 쓰고, 없을 때만 잠긴 항목을 끼워 넣는다 (그래서 버전마다 따로 적을 필요가 없음).
    // after: 전체 메뉴에서 바로 앞에 오는 항목(탭 버튼 id) / 그룹(메인 탭 키)
    const FULL_MENU = {
        groups: [
            { key: 'economy', icon: '💹', label: '경제', ver: '1.6.9', after: 'nation' },
            { key: 'world', icon: '🌐', label: '세계', ver: '1.6.5', after: 'economy', items: [['subTabRanking', '국가 순위'], ['subTabBlocs', '진영']] },
        ],
        items: [
            { main: 'setup', id: 'subTabTimeline', label: '세력 변화', ver: '1.6.5', after: 'subTabList' },
            { main: 'setup', id: 'subTabWikibox', label: '위키 틀', ver: '1.6.5', after: 'subTabTimeline' },
            { main: 'law', id: 'subTabSiege', label: '공성전', ver: '1.6.4', after: 'subTabVote' },
            { main: 'cabinet', id: 'subTabMilitary', label: '군부', ver: '1.6.2', after: 'subTabCabinetmembers' },
            { main: 'cabinet', id: 'subTabCoup', label: '쿠데타', ver: '1.6.2', after: 'subTabMilitary' },
            { main: 'cabinet', id: 'subTabRevolution', label: '혁명', ver: '1.6.3', after: 'subTabCoup' },
            { main: 'cabinet', id: 'subTabRoyal', label: '왕실', ver: '1.6.6', after: 'subTabRevolution' },
            { main: 'nation', id: 'subTabPeople', label: '사람', ver: '1.6.1', after: 'subTabRegions' },
            { main: 'nation', id: 'subTabUnrecovered', label: '미수복', ver: '1.6.7', after: 'subTabPeople' },
            { main: 'nation', id: 'subTabVassals', label: '종속국', ver: '1.6.8', after: 'subTabUnrecovered' },
        ],
    };
    const LOCK_SVG = '<svg class="mn-lock" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="currentColor"/>'
        + '<path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    // 잠긴 기능을 누르면 — 개발자 모드면 그 기능이 있는 Teaser 화면으로 갈지 묻고, 아니면 언제 열리는지 알려 준다
    function lockedInfo(label, ver) {
        const page = { '1.6.5': '65', '1.6.6': '66', '1.6.7': '67', '1.6.8': '68', '1.6.9': '69' }[ver];
        const msg = `🔒 "${label}"은(는) ${ver} 업데이트에서 열리는 기능입니다.`;
        const dev = window.HemiDev && window.HemiDev.isOn && window.HemiDev.isOn();
        if (dev && page) {
            const go = () => { location.href = `teaser${page}.html`; };
            const q = `${msg}\n\nTeaser ${ver} 미리보기 화면으로 갈까요? (미리보기 화면의 저장 공간은 따로입니다)`;
            if (window.DnoUI && window.DnoUI.confirm) window.DnoUI.confirm(q).then(ok => { if (ok) go(); });
            else if (confirm(q)) go();
            return;
        }
        if (window.DnoUI && window.DnoUI.alert) window.DnoUI.alert(msg); else alert(msg);
    }
    function lockedItem(label, ver) {
        const it = document.createElement('button');
        it.type = 'button';
        it.className = 'mn-item mn-locked';
        it.title = `${label} — ${ver}에서 열림`;
        it.innerHTML = `${LOCK_SVG}<span class="mn-locked-label"></span><span class="mn-lock-ver">${ver}</span>`;
        it.querySelector('.mn-locked-label').textContent = label;
        it.addEventListener('click', () => lockedInfo(label, ver));
        return it;
    }

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

        // ── 이 화면에 없는 1.6.9 기능을 제자리에 잠긴 항목 · 그룹으로 ──
        const hasBtn = id => !!document.getElementById(id);
        const placeAfter = (parent, el, ref) => { if (ref && ref.parentElement === parent) parent.insertBefore(el, ref.nextSibling); else parent.appendChild(el); };
        FULL_MENU.groups.forEach(fg => {
            if (groups.some(grp => grp.key === fg.key)) return;
            const g = document.createElement('div');
            g.className = 'mn-group mn-group-locked' + (!fg.items || closed.has(fg.key) ? ' closed' : '');
            g.dataset.main = fg.key;
            g.dataset.tone = GROUP_TONES[fg.key] || 'info';
            g.innerHTML = `
                <button type="button" class="mn-group-head" title="${fg.label} — ${fg.ver}에서 열림">
                    <span class="mn-icon"></span><span class="mn-label"></span><span class="mn-lock-badge" title="언제 열리나요?">${LOCK_SVG}<span class="mn-lock-ver">${fg.ver}</span></span>${fg.items ? '<svg class="mn-chev" viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M3 7.5 6 4.5 9 7.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
                </button>
                <div class="mn-items"></div>`;
            g.querySelector('.mn-icon').textContent = fg.icon;
            g.querySelector('.mn-label').textContent = fg.label;
            // 항목이 있는 잠긴 그룹(세계)은 다른 그룹처럼 머리를 눌러 접고 펴고, 🔒 버전 표시를 누르면 안내 — 항목이 없으면(경제) 머리를 누르면 안내
            g.querySelector('.mn-group-head').addEventListener('click', e => {
                if (!fg.items || e.target.closest('.mn-lock-badge') || document.body.classList.contains('side-nav-collapsed')) { lockedInfo(fg.label, fg.ver); return; }
                g.classList.toggle('closed');
                const set = closedGroups();
                if (g.classList.contains('closed')) set.add(fg.key); else set.delete(fg.key);
                safeSet(CLOSED_GROUPS_KEY, JSON.stringify(Array.from(set)));
            });
            (fg.items || []).forEach(([id, label]) => { const it = lockedItem(label, fg.ver); it.dataset.lockedId = id; g.querySelector('.mn-items').appendChild(it); });
            const ref = groupsEl.querySelector(`:scope > .mn-group[data-main="${fg.after}"]`);
            placeAfter(groupsEl, g, ref);
        });
        FULL_MENU.items.forEach(fi => {
            if (hasBtn(fi.id)) return;
            const grp = groups.find(x => x.key === fi.main);
            if (!grp) return;
            const itemsEl = grp.g.querySelector('.mn-items');
            const it = lockedItem(fi.label, fi.ver);
            it.dataset.lockedId = fi.id;
            const real = grp.items.find(x => x.src.id === fi.after);
            placeAfter(itemsEl, it, real ? real.el : itemsEl.querySelector(`[data-locked-id="${fi.after}"]`));
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
            // 라이트/다크에서 사이드바를 접으면 머리의 국가명이 안 보이므로, 경로 맨 앞에 국가명을 붙인다 (CSS로 그때만 표시)
            const nationName = nationSrc ? nationSrc.textContent.trim() : '';
            if (nationName && activeGroup) {
                const n = document.createElement('span'); n.className = 'mn-crumb mn-crumb-nation'; n.textContent = nationName;
                const sep0 = document.createElement('span'); sep0.className = 'mn-crumb-sep mn-crumb-nation'; sep0.textContent = '›';
                title.append(n, sep0);
            }
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
