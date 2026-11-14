// ===== Hemicycle — 세로 탭 사이드바 =====
// 메인 탭(의회/국가/여론/내각)을 접을 수 있는 그룹으로, 그 아래 2단 탭을
// 항목으로 보여주는 세로 사이드바를 .controls 왼쪽에 만든다 (모든 테마 공통).
// 사이드바는 기존 탭 버튼을 그대로 복제·클릭하는 "리모컨"일 뿐이라 탭 전환 로직은 전혀 바꾸지 않으며,
// MutationObserver로 원래 버튼의 활성/표시/라벨(언어 전환 포함) 변화를 따라간다.
// 모양은 css/sidenav.css(네온 기본) + css/modern.css(라이트/다크).
// (접힌 상태 · 묶음 열림은 localStorage에 기억한다)
(function () {
    'use strict';

    const COLLAPSE_KEY = 'dnoSideNavCollapsed';
    const CLOSED_GROUPS_KEY = 'dnoSideNavClosedGroups';
    // Chrome 탭 그룹처럼 그룹마다 구분색 — 실제 색은 테마별 CSS가 data-tone에 맞춰 정한다
    const GROUP_TONES = { campaign: 'gold', setup: 'info', law: 'purple', nation: 'orange', vote: 'danger', election: 'gold', cabinet: 'success', help: 'muted', world: 'pink', economy: 'lime' };

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
            { key: 'world', icon: '🌐', label: '세계', ver: '1.6.5', after: 'economy', items: [['subTabWorldmap', '지도'], ['subTabRanking', '국가 순위'], ['subTabBlocs', '진영'], ['subTabEconblocs', '경제권']] },
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
            { main: 'election', id: 'elecSubTabArticles', label: '기사', ver: '1.7.0', after: 'elecSubTabMprob' },
            { main: 'world', id: 'subTabEconblocs', label: '경제권', ver: '1.7.1', after: 'subTabBlocs' },
            { main: 'nation', id: 'subTabVassals', label: '종속국', ver: '1.6.8', after: 'subTabUnrecovered' },
        ],
    };
    const LOCK_SVG = '<svg class="mn-lock" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><rect x="3" y="7" width="10" height="7.5" rx="1.5" fill="currentColor"/>'
        + '<path d="M5.2 7V5a2.8 2.8 0 0 1 5.6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
    // 잠긴 기능을 누르면 — 개발자 모드면 그 기능이 있는 Teaser 화면으로 갈지 묻고, 아니면 언제 열리는지 알려 준다
    function lockedInfo(label, ver) {
        const page = {}[ver]; // 미리보기 화면이 있는 버전 → 번호 (지금은 없음)
        const msg = `🔒 "${label}"은(는) ${ver} 업데이트에서 열리는 기능입니다.`;
        const dev = window.HemiDev && page && (window.HemiDev.canOpen ? window.HemiDev.canOpen(page) : window.HemiDev.isOn());
        if (dev) {
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
        it.title = label;
        it.dataset.dnoTipSub = `🔒 ${ver}에서 열림`;
        it.dataset.tipWhen = 'collapsed';
        it.innerHTML = `<span class="mn-dot" aria-hidden="true"></span><span class="mn-text">${LOCK_SVG}<span class="mn-locked-label"></span><span class="mn-lock-ver">${ver}</span></span>`;
        it.querySelector('.mn-locked-label').textContent = label;
        it.addEventListener('click', () => lockedInfo(label, ver));
        return it;
    }

    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* 저장 불가 환경 — 무시 */ } }
    // 묶음 열고 닫기 — 펼친 사이드바의 항목 목록과 접힌 사이드바의 점이 같은 상태를 쓴다. 높이를 부드럽게
    function toggleGroup(g, key) {
        const items = g.querySelector('.mn-items');
        const closing = !g.classList.contains('closed');
        const set = closedGroups();
        if (closing) set.add(key); else set.delete(key);
        safeSet(CLOSED_GROUPS_KEY, JSON.stringify(Array.from(set)));
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!items || reduce || typeof items.animate !== 'function') { g.classList.toggle('closed', closing); return; }
        if (items._anim) items._anim.cancel();
        const opts = { duration: 200, easing: 'cubic-bezier(.2, .8, .2, 1)' };
        if (closing) {
            const h = items.getBoundingClientRect().height;
            items.style.overflow = 'hidden';
            items._anim = items.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], opts);
            items._anim.onfinish = () => { g.classList.add('closed'); items.style.overflow = ''; items._anim = null; };
        } else {
            g.classList.remove('closed');
            const h = items.getBoundingClientRect().height;
            items.style.overflow = 'hidden';
            items._anim = items.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], opts);
            items._anim.onfinish = () => { items.style.overflow = ''; items._anim = null; };
        }
    }
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
        // 바깥 nav는 자리(끝 폭으로 한 번에)만 잡고, 보이는 판(.mn-panel)만 폭을 움직인다 — 접기 · 펴기 동안 본문을 매 프레임 다시 배치하지 않게
        nav.innerHTML = `<div class="mn-panel">
            <div class="mn-head">
                <div class="mn-brand">
                    <div class="mn-brand-title">Ministry of Interior</div>
                    <div class="mn-brand-sub" id="mnNationName"></div>
                </div>
                <button type="button" class="mn-collapse" id="mnCollapseBtn" title="사이드바 접기/펼치기" aria-label="사이드바 접기/펼치기">
                    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><rect x="2.5" y="3.5" width="15" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="7.5" y1="3.5" x2="7.5" y2="16.5" stroke="currentColor" stroke-width="1.5"/></svg>
                </button>
            </div>
            <div class="mn-search" role="search">
                <svg class="mn-search-icon" viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="12.6" y1="12.6" x2="17" y2="17" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
                <input type="search" id="mnSearchInput" placeholder="기능 검색 (예: 선거인단)" autocomplete="off" spellcheck="false" aria-label="기능 검색" aria-controls="mnSearchResults">
                <div class="mn-search-results" id="mnSearchResults" role="listbox" hidden></div>
            </div>
            <div class="mn-groups" id="mnGroups"></div></div>`;
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
                it.dataset.tipWhen = 'collapsed'; // 접혀서 점일 때만 이름표
                it.innerHTML = '<span class="mn-dot" aria-hidden="true"></span><span class="mn-text"></span>';
                it.addEventListener('click', () => {
                    if (!mainBtn.classList.contains('active')) mainBtn.click();
                    subBtn.click();
                });
                itemsEl.appendChild(it);
                return { el: it, src: subBtn };
            });
            head.dataset.tipWhen = 'collapsed'; // 접혔을 때만 묶음 이름
            head.addEventListener('click', () => {
                // 하위 항목이 없는 메뉴는 바로 이동. 나머지는 펼친 사이드바에선 목록을, 접힌 사이드바에선 점을 여닫는다 (같은 상태)
                if (!items.length) { mainBtn.click(); return; }
                toggleGroup(g, key);
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
            g.querySelector('.mn-group-head').dataset.tipWhen = 'collapsed';
            g.querySelector('.mn-group-head').addEventListener('click', e => {
                if (!fg.items || e.target.closest('.mn-lock-badge')) { lockedInfo(fg.label, fg.ver); return; }
                toggleGroup(g, fg.key);
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

        setupSearch(nav, groups);

        const nationSrc = document.getElementById('nationNameDisp');
        const nationDst = nav.querySelector('#mnNationName');

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
                    const tx = el.querySelector('.mn-text');
                    if (text.replace(/[\uFE0E\uFE0F]/g, '') === '⚠') {
                        if (el.dataset.icon !== 'warn') { tx.innerHTML = WARN_ICON; el.dataset.icon = 'warn'; }
                    } else {
                        if (tx.textContent !== text) tx.textContent = text;
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

        const collapseBtn = nav.querySelector('#mnCollapseBtn');
        const panel = nav.querySelector('.mn-panel');
        let navAnims = [];
        // 접기 · 펴기 — 본문은 끝 자리로 한 번만 배치하고(캔버스도 한 번만 다시 그림), 판의 폭과 본문의 위치만 같은 곡선으로 움직인다.
        // 접기: 글자가 먼저 사라지고(CSS) 폭이 줄어든다. 펴기: 폭이 먼저 늘고 글자가 나타난다(CSS)
        function applyCollapsed(on, animate) {
            const was = document.body.classList.contains('side-nav-collapsed');
            const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            animate = animate && was !== on && !reduce && nav.offsetParent !== null && typeof panel.animate === 'function';
            navAnims.forEach(a => a.cancel()); navAnims = [];
            let fromW = 0, movers = [], fromX = [];
            if (animate) {
                const nr = nav.getBoundingClientRect();
                fromW = panel.getBoundingClientRect().width;
                movers = Array.from(document.body.children).filter(el => el !== nav && el.offsetParent !== null && !/^(fixed|absolute|sticky)$/.test(getComputedStyle(el).position) && el.getBoundingClientRect().left >= nr.right - 1);
                fromX = movers.map(el => el.getBoundingClientRect().left);
            }
            // 움직이는 동안만: 펼칠 때 항목의 강조 상자 · 선도 글자와 함께(폭이 다 늘어난 뒤) 나타나게 (평소 마우스 반응은 늦추지 않음).
            // 상태를 바꾸기 전에 붙여야 그 지연이 이번 전환에 쓰인다
            if (animate) document.body.classList.add('side-nav-moving');
            document.body.classList.toggle('side-nav-collapsed', on);
            safeSet(COLLAPSE_KEY, on ? '1' : '0');
            if (!animate) return;
            const toW = nav.getBoundingClientRect().width; // 끝 폭 — 여기서 한 번 배치
            const timing = { duration: on ? 210 : 230, delay: on ? 60 : 0, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'backwards' };
            navAnims.push(panel.animate([{ width: fromW + 'px' }, { width: toW + 'px' }], timing));
            movers.forEach((el, i) => {
                const dx = fromX[i] - el.getBoundingClientRect().left;
                if (Math.abs(dx) > 0.5) navAnims.push(el.animate([{ transform: `translateX(${dx}px)` }, { transform: 'translateX(0)' }], timing));
            });
            const mine = navAnims[0];
            mine.finished.then(() => setTimeout(() => { if (navAnims[0] === mine) document.body.classList.remove('side-nav-moving'); }, 140)).catch(() => {});
        }
        collapseBtn.addEventListener('click', () => applyCollapsed(!document.body.classList.contains('side-nav-collapsed'), true));
        applyCollapsed(safeGet(COLLAPSE_KEY) === '1', false);
        // 접힌 상태에서 검색 아이콘을 누르면 펼치고 검색
        nav.querySelector('#mnSearchInput').addEventListener('mousedown', e => {
            if (!document.body.classList.contains('side-nav-collapsed')) return;
            e.preventDefault();
            applyCollapsed(false, true);
            setTimeout(() => nav.querySelector('#mnSearchInput').focus(), 240);
        });

        document.body.classList.add('has-side-nav');
        sync();
    }

    // ===== 기능 검색 — 사이드바 맨 위. 메뉴 이름 · 각 탭 안의 글자(제목 · 이름표 · 버튼) · 아래 동의어로 찾고, 고르면 그 탭을 열어 찾은 곳을 잠깐 표시 =====
    // 예: "선거인단" → 선거 › 선거 제도 (그 탭의 "선거인단제" 버튼). 잠긴(다음 업데이트) 기능은 🔒와 열리는 버전으로
    // 화면에 글자로 없는 기능 · 다른 이름으로 부르는 것 — 탭 버튼 id: [찾을 말 …]
    const SEARCH_ALIASES = {
        subTabAssembly: ['의회 설정', '의장석', '의장', '부의장', '의장단', '반원 중앙', '집권 세력 강조'], subTabIdeology: ['이념', '서브 이념', '정치 성향'],
        subTabParty: ['파벌', '합당', '분당', '신당', '당수', '창당', '해산', '활동 금지', '정당 로고', '원내대표'],
        subTabSettings: ['의회 구성', '원 구성', '의석 수', '반원', '좌석', '양원제', '삼원제', '단원제', '하원', '상원', '의회 이름'],
        subTabCoalition: ['연정', '여당', '야당', '집권', '각외협력', '공동교섭단체'], subTabMembers: ['지역구 의원', '당선자', '의원 이름'], subTabList: ['비례대표 명단', '비례 명단'],
        subTabTimeline: ['세력 변화', '타임라인', '정당 역사', '계보도', '당명 변경'], subTabWikibox: ['위키 틀', '나무위키', '원내 구성'],
        subTabBill: ['법안', '발의', '조항', '개정안'], subTabCommittee: ['상임위원회', '위원회 심사', '위원장'], subTabTable: ['상정', '직권상정', '안건'],
        subTabVote: ['표결', '본회의', '찬성', '반대', '기권'], subTabSiege: ['공성전', '봉쇄 돌파', '의장석 점거', '몸싸움', '국회선진화법', '경호권'],
        subTabArchive: ['표결 기록'], subTabLawbook: ['법령', '법률', '법령집'], subTabConstitution: ['헌법', '개헌', '헌법 개정'],
        elecSubTabOverview: ['여론 종합', '시민 이민자'], elecSubTabTendency: ['지역구 - 시민', '성향', '지역구 성향', '권역 성향'], elecSubTabProb: ['지지율 - 시민', '지지율', '봉쇄조항', '연동형', '병립형', '무당파', '오차', '비례대표 방식'],
        elecSubTabMtendency: ['이민자 성향'], elecSubTabMprob: ['이민자 지지율'],
        subTabElecPresidential: ['대선', '대통령 선거', '결선투표', '총리 직선'], subTabElecGeneral: ['총선', '개표', '보궐선거', '의회 반영'],
        subTabElecLocal: ['지선', '지방선거', '단체장', '시장', '도지사', '현직 단체장', '지방자치'], subTabReferendum: ['국민투표', '찬반 투표'],
        subTabElecSettings: ['선거인단', '선거 제도', '선거 방식', '방식', '결선투표', '이민자 투표권', '총리 직선', '기준 원'],
        subTabElecCandidates: ['후보', '후보 단일화', '단일화', '후보 설정', '대선 후보', '총리 후보'],
        subTabElecRecord: ['선거 기록', '지난 선거'], subTabFraud: ['부정선거', '선거 조작', '조작'],
        subTabSystem: ['내각 설정', '정부 형태', '대통령제', '의원내각제', '이원집정부제', '입헌군주제', '집단지도체제', '거부권 주체', '비상 권한 주체', '계엄령 권한', '숨겨진 정부 형태', '직책 이름'],
        subTabPresident: ['대통령', '국가원수', '계엄령 선포', '비상사태 선포', '의회 해산'], subTabPm: ['총리', '불신임', '부총리', '총리 임명'],
        subTabCabinetmembers: ['장관', '국무위원', '내각 구성원'], subTabSign: ['서명', '거부권 행사'], subTabCouncil: ['국무회의', '국무회의 의결'], subTabCouncilArchive: ['국무회의 기록'],
        subTabMilitary: ['군부', '군 지휘부', '장성', '참모총장', '국방부 장관', '군 소속', '육군', '해군', '공군', '해병대', '충성도'],
        subTabCoup: ['쿠데타', '군정', '민정 이양', '역쿠데타', '친위 쿠데타', '계엄'], subTabRevolution: ['혁명', '당-국가 체제', '공산주의 혁명', '민주 혁명', '국호 교체', '선거인단 설정'],
        subTabRoyal: ['왕실', '왕정복고', '전제군주정', '왕위 계승', '왕가', '공화 혁명'],
        subTabSymbol: ['국기', '국호', '국가 이름', '상징', '나라 이름'], subTabTerritory: ['지역', '지역구', '지도', '인구', '시민 수', '이민자 수', '맵 프리셋', '지도 올리기'],
        subTabRegions: ['권역', '권역 지도'], subTabNationSettings: ['날짜', '연호', '회기', '다음 회기', '지역구 이름 표시'], subTabPeople: ['사람', '인물', '후보', '지역구 후보'],
        subTabUnrecovered: ['미수복', '영토 통일'], subTabVassals: ['종속국', '합병', '해방'], subTabRanking: ['국가 순위', '냉전'], subTabBlocs: ['진영'],
        elecSubTabArticles: ['기사', '신문', '언론', '보도', '뉴스'],
        elecSubTabApproval: ['국정 지지율', '대통령 지지율', '총리 지지율', '내각 지지율', '여론 추이', '허니문'],
        subTabDecisions: ['결정', '이벤트', '모드', '스크립트 모드', '창작마당', '모딩', 'mod'],
    };
    // 탭이 아닌 곳 (위쪽 탭 바의 저장 · 설정 창)
    const SEARCH_ACTIONS = [
        { label: '저장', path: '저장 창', keys: ['저장', '세이브', '불러오기', '자동저장', '파일로 저장', '내보내기', '종합 프리셋', '지역구 프리셋', 'hemimap'], run: () => window.openSavePanel && window.openSavePanel() },
        { label: '설정', path: '설정 창', keys: ['설정', '테마', '다크 모드', '네온', '해상도', '전체 화면', '창 모드', '디버그 모드', '개발자 모드', '언어', '업데이트', '저장 위치'], run: () => window.openSettingsPanel && window.openSettingsPanel() },
    ];
    const norm = s => String(s || '').toLowerCase().replace(/[\s·\-–—_/()[\]{}:,.!?'"「」『』…]+/g, '');
    function contentOf(btn) {
        const m = /^(?:subTab|elecSubTab)(.+)$/.exec(btn.id || ''); if (!m) return null;
        const x = m[1];
        return document.getElementById('content' + x) || document.getElementById('elecSub' + x) || document.getElementById('elecSub' + x.replace(/^M(?=[A-Z])/, ''));
    }
    // 탭 안의 짧은 글자 (제목 · 이름표 · 버튼 · 표 머리 · 접는 칸 제목) — 검색할 때마다 새로 모은다 (내용이 바뀌는 탭이 있어서)
    const TEXT_SEL = 'label, legend, summary, h2, h3, h4, h5, th, button, .settings-label, [class*="card-h"], [class*="-title"], [class*="section-title"]';
    function buildIndex(groups) {
        const out = [];
        groups.forEach(grp => {
            const gLabel = splitIcon(grp.mainBtn.textContent).label;
            if (isHidden(grp.mainBtn)) return;
            // 하위 항목이 없는 메뉴(예: 잠긴 경제)는 메뉴 자체로
            if (!grp.items.some(({ src }) => !isHidden(src))) out.push({ kind: 'menu', text: gLabel, path: gLabel, go: () => grp.mainBtn.click(), w: 3 });
            const help = grp.key === 'help'; // 도움말 글은 실제 기능 탭보다 뒤로
            const seenPanel = new Set();
            grp.items.forEach(({ src }) => {
                if (isHidden(src)) return;
                const label = src.textContent.replace(/\s+/g, ' ').trim(); // ⚠(잠긴 부정선거)는 그대로 — 이름은 잠금을 풀어야 보임
                const path = `${gLabel} › ${label}`;
                const go = () => { if (!grp.mainBtn.classList.contains('active')) grp.mainBtn.click(); src.click(); };
                const panel = contentOf(src);
                out.push({ kind: 'menu', text: label, path, go, panel, w: help ? 1 : 3 });
                out.push({ kind: 'menu', text: gLabel, path, go, panel, w: 0.5 });
                (SEARCH_ALIASES[src.id] || []).forEach(k => out.push({ kind: 'alias', text: k, path, go, panel, w: 2 }));
                if (!panel || seenPanel.has(panel)) return;
                seenPanel.add(panel);
                const seen = new Set();
                panel.querySelectorAll(TEXT_SEL).forEach(el => {
                    if (el.closest('.sub-tab-container')) return;
                    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
                    if (t.length < 2 || t.length > 40 || seen.has(t)) return;
                    seen.add(t);
                    out.push({ kind: 'text', text: t, path, go, el, panel, w: help ? 0.2 : 1 });
                });
            });
        });
        // 다음 업데이트에서 열리는 기능 (잠긴 메뉴)
        document.querySelectorAll('#sideNav .mn-locked, #sideNav .mn-group-locked > .mn-group-head').forEach(l => {
            const label = (l.querySelector('.mn-locked-label, .mn-label') || l).textContent.trim();
            const ver = (l.querySelector('.mn-lock-ver') || {}).textContent || '';
            const id = l.dataset.lockedId;
            const path = `🔒 ${label} — ${ver}에서 열림`;
            const go = () => l.click();
            out.push({ kind: 'menu', text: label, path, go, w: 2, locked: true });
            (SEARCH_ALIASES[id] || []).forEach(k => out.push({ kind: 'alias', text: k, path, go, w: 1.5, locked: true }));
        });
        SEARCH_ACTIONS.forEach(a => a.keys.forEach(k => out.push({ kind: 'alias', text: k, path: a.path, go: a.run, w: 1.5 })));
        return out;
    }
    function searchIndex(index, q) {
        const nq = norm(q); if (!nq) return [];
        const best = new Map(); // 같은 곳(경로)은 가장 잘 맞는 것 하나만
        index.forEach(e => {
            const nt = norm(e.text); if (!nt) return;
            let s = 0;
            if (nt === nq) s = 100; else if (nt.startsWith(nq)) s = 70; else if (nt.includes(nq)) s = 45; else if (nq.length >= 2 && nq.includes(nt) && nt.length >= 2) s = 25;
            if (!s) return;
            s += e.w * 6 - Math.min(10, Math.max(0, nt.length - nq.length) * 0.3) - (e.locked ? 8 : 0);
            const prev = best.get(e.path);
            if (!prev || s > prev.s) best.set(e.path, { ...e, s });
        });
        return [...best.values()].sort((a, b) => b.s - a.s).slice(0, 8);
    }
    function flash(el) {
        if (!el || !el.isConnected) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('mn-search-flash');
        setTimeout(() => el.classList.remove('mn-search-flash'), 1800);
    }
    function setupSearch(nav, groups) {
        const input = nav.querySelector('#mnSearchInput');
        const box = nav.querySelector('#mnSearchResults');
        let index = null, results = [], sel = 0;
        const close = () => { box.hidden = true; box.innerHTML = ''; results = []; };
        const pick = r => {
            if (!r) return;
            const q = norm(input.value);
            input.value = ''; close(); input.blur();
            r.go();
            // 찾은 곳 표시 — 글자로 찾았으면 그 요소, 메뉴 · 동의어로 찾았으면 그 탭 안에서 찾는 말이 든 첫 요소 (없으면 표시 안 함)
            setTimeout(() => {
                let el = r.kind === 'text' ? r.el : null;
                if (!el && r.panel && q) el = [...r.panel.querySelectorAll(TEXT_SEL)].find(x => !x.closest('.sub-tab-container') && norm(x.textContent).includes(q) && norm(x.textContent).length <= q.length + 30);
                flash(el);
            }, 150);
        };
        const render = () => {
            if (!results.length) { box.innerHTML = input.value.trim() ? '<div class="mn-search-empty">찾는 기능이 없습니다</div>' : ''; box.hidden = !input.value.trim(); return; }
            box.hidden = false;
            box.innerHTML = '';
            results.forEach((r, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'mn-search-item' + (i === sel ? ' sel' : '') + (r.locked ? ' locked' : '');
                b.setAttribute('role', 'option');
                const p = document.createElement('span'); p.className = 'mn-search-path'; p.textContent = r.path;
                b.appendChild(p);
                if (norm(r.text) !== norm(r.path.split(' › ').pop())) { const m = document.createElement('span'); m.className = 'mn-search-match'; m.textContent = r.text; b.appendChild(m); }
                b.addEventListener('mousedown', e => { e.preventDefault(); pick(r); });
                box.appendChild(b);
            });
        };
        input.addEventListener('focus', () => { index = buildIndex(groups); if (input.value.trim()) { results = searchIndex(index, input.value); sel = 0; render(); } });
        input.addEventListener('input', () => { if (!index) index = buildIndex(groups); results = searchIndex(index, input.value); sel = 0; render(); });
        input.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); if (results.length) { sel = (sel + 1) % results.length; render(); } }
            else if (e.key === 'ArrowUp') { e.preventDefault(); if (results.length) { sel = (sel - 1 + results.length) % results.length; render(); } }
            else if (e.key === 'Enter') { e.preventDefault(); pick(results[sel]); }
            else if (e.key === 'Escape') { input.value = ''; close(); input.blur(); }
        });
        input.addEventListener('blur', () => setTimeout(close, 150));
        // Ctrl/⌘ + K — 어디서든 검색창으로 (사이드바를 접어 두었으면 펼침)
        document.addEventListener('keydown', e => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k' && document.body.classList.contains('has-side-nav')) {
                e.preventDefault();
                if (document.body.classList.contains('side-nav-collapsed')) nav.querySelector('#mnCollapseBtn').click();
                input.focus(); input.select();
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();
})();
