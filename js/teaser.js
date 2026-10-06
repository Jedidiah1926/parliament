// ===== Hemicycle 티저 (teaser.html 전용) — 다음 업데이트 기능 미리 써 보기 =====
// teaser.html은 main.html을 그대로 복사한 화면에 이 파일 하나를 더 불러 미리보기 기능을 얹는다.
// (저장 공간은 본 게임과 따로 — main.js의 LS_PREFIX 'hemicycleTeaser:')
//
// 1.6.6 "즉시, 지체 없이" 미리보기 — 미수복 지역 · 영토 통일
//   - 여론 › 지역구는 국가 › 지역으로 옮기고, 국가 › 미수복 탭을 새로 둔다
//   - 미수복 지역 종류를 여러 개 만들고(종류마다 이름 · 빗금 색 — 예: 오스트리아 · 동방영토 · 북방영토), "칠하기"로 지도에서
//     지역구를 차례로 눌러 칠하거나 지역구 편집 칸에서 종류를 고른다. 미수복 지역은 모든 지도에서 영토 색 빗금으로 따로 보이고,
//     지역구 선거 · 지방선거 · 국민투표에서 빠진다 (그 지역구 의석은 지역구 의석 수에서 빠짐)
//   - "통합"은 그 종류만, "영토 통일 (전체)"는 모든 미수복 지역을 되찾아 일반 지역구로 돌린다
// main.js의 최상위 함수(getAppState · renderDistrictSvgInto 등)는 전역에 이름으로 걸려 있어서 여기서 감싸 덮어쓴다
/* global getAppState, setAppState, renderDistrictSvgInto, districtRenderNamePanel, districtActiveSeatCount,
   elecSimulateDistrictsSvg, districtNames, districtSeatCounts, districtGrid, selectedDistrictKey,
   districtMapMode, districtRedrawAllMaps, renderDistrictListPanel, elecUpdateDistrictInfo, showCustomConfirm, escapeHtmlText,
   switchSubTab, switchMainTab, elecSwitchSub, switchDispTab, districtUpdateModeUI, districtInitCanvas, currentMainTab, currentSubTab */
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-app-mode') !== 'teaser') return;

    // 미수복 영토는 여러 개 — 영토마다 이름 · 색(빗금 색)이 있고, 지역구는 그중 하나에 속한다
    //   territories = [{ id, name, color }], unrecovered = { 지역구 키: 영토 id }
    const PALETTE = ['#9ca3af', '#f87171', '#fbbf24', '#60a5fa', '#a78bfa', '#34d399', '#f472b6', '#fb923c'];
    let territories = [];
    let unrecovered = {};
    let brush = null; // 칠하기 도구 — null(끔) | 영토 id | 'erase'
    const isUnrec = key => !!unrecovered[key] && !!territoryOf(key);
    const territoryById = id => territories.find(t => t.id === id) || null;
    const territoryOf = key => territoryById(unrecovered[key]);
    window.isDistrictUnrecovered = isUnrec; // 지방선거 · 국민투표(js/popvote.js)가 이걸 보고 뺀다
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s)) : String(s));
    const nameOf = key => districtNames.house?.[key] || key;
    const keysOf = id => Object.keys(unrecovered).filter(k => unrecovered[k] === id);

    function addTerritory(name) {
        let n = 1;
        while (territories.some(t => t.id === 't' + n)) n++;
        const t = { id: 't' + n, name: name || `미수복 지역 ${n}`, color: PALETTE[(n - 1) % PALETTE.length] };
        territories.push(t);
        return t;
    }
    // 세이브 읽기 — 예전 형식({ 키: true }, 영토 하나)도 첫 영토로 옮긴다
    function loadTeaserState(tz) {
        territories = Array.isArray(tz?.territories)
            ? tz.territories.filter(t => t && t.id).map(t => ({ id: String(t.id), name: String(t.name || t.id), color: /^#[0-9a-f]{6}$/i.test(t.color) ? t.color : PALETTE[0] }))
            : [];
        unrecovered = {};
        const u = tz && typeof tz.unrecovered === 'object' ? tz.unrecovered : {};
        Object.entries(u).forEach(([key, v]) => {
            let id = typeof v === 'string' ? v : null;
            if (!id || !territoryById(id)) id = (territories[0] || addTerritory('미수복 지역')).id;
            unrecovered[key] = id;
        });
        brush = null;
    }

    // ---- 저장 · 불러오기: 세이브에 teaser 칸으로 ----
    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.teaser = { unrecovered: { ...unrecovered }, territories: territories.map(t => ({ ...t })) };
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        loadTeaserState(state && state.teaser);
        refreshUI();
        return r;
    };

    // ---- 선거: 미수복 지역구는 개표하지 않고, 지역구 의석 수에서도 뺀다 ----
    const origSim = window.elecSimulateDistrictsSvg;
    window.elecSimulateDistrictsSvg = function () {
        return (origSim.apply(this, arguments) || []).filter(r => !isUnrec(r.key));
    };
    const origCount = window.districtActiveSeatCount;
    window.districtActiveSeatCount = function (chamber) {
        const total = origCount.apply(this, arguments);
        const lost = Object.keys(districtGrid[chamber] || {}).filter(isUnrec)
            .reduce((sum, key) => sum + (districtMapMode !== 'svg' ? 1 : (districtSeatCounts[key]?.[chamber] || 0)), 0);
        return Math.max(0, total - lost);
    };

    // ---- 지도: 미수복 지역구는 영토 색 빗금 + 툴팁에 (미수복: 영토 이름) ----
    // 빗금 굵기는 화면 픽셀 기준 — 지도 좌표 1단위가 화면에서 몇 픽셀인지 재서 패턴 크기를 정한다.
    // (저장된 viewBox가 실제 도형보다 훨씬 크거나 작은 지도에서도, 작게 그린 지도에서도 같은 굵기로 보이게)
    // 패턴 id는 그릴 때마다 새로 붙인다 — 같은 id가 여러 지도에 있으면 url(#id)가 다른 지도(다른 배율)의 패턴을 집어 온다
    const HATCH_PX = 7; // 빗금 한 주기(선 + 틈)의 화면 픽셀
    let hatchSeq = 0;
    function hatchDefs(prefix) {
        const light = document.documentElement.getAttribute('data-theme-mode') === 'light';
        const bg = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
        return territories.map(t => `<pattern id="${prefix}${t.id}" data-unrec-hatch="1" patternUnits="userSpaceOnUse" width="1" height="1" patternTransform="rotate(45)">`
            + `<rect width="1" height="1" fill="${bg}"/><rect width="0.4" height="1" fill="${t.color}" fill-opacity="${light ? 0.65 : 0.55}"/></pattern>`).join('');
    }
    function fitHatch(svg) {
        const pats = svg.querySelectorAll('pattern[data-unrec-hatch]');
        if (!pats.length) return;
        const r = svg.getBoundingClientRect();
        const vb = String(svg.getAttribute('viewBox') || '0 0 100 100').split(/[\s,]+/).map(Number);
        const vw = vb[2] || 100, vh = vb[3] || 100;
        // 보이지 않는 지도(숨은 탭)는 600px 너비로 가정해 두고, 보이게 되면 ResizeObserver가 다시 맞춘다
        const unitsPerPx = r.width > 0 && r.height > 0 ? Math.max(vw / r.width, vh / r.height) : vw / 600;
        const size = HATCH_PX * unitsPerPx;
        pats.forEach(p => p.setAttribute('patternTransform', `rotate(45) scale(${size})`));
    }
    const origRender = window.renderDistrictSvgInto;
    window.renderDistrictSvgInto = function (wrapEl, opts) {
        const o = { ...(opts || {}) };
        const active = Object.keys(unrecovered).some(isUnrec);
        if (active) {
            const prefix = `hemiUnrecHatch${++hatchSeq}_`;
            const g = o.getFill, t = o.title, b = o.seatBadges;
            o.defs = (o.defs || '') + hatchDefs(prefix);
            o.getFill = key => (isUnrec(key) ? `url(#${prefix}${unrecovered[key]})` : (g ? g(key) : null));
            o.title = key => (isUnrec(key) ? `${nameOf(key)} (미수복 지역: ${territoryOf(key).name})` : (t ? t(key) : nameOf(key)));
            if (b) o.seatBadges = key => (isUnrec(key) ? null : b(key));
        }
        // 칠하기 도구가 켜져 있으면 지역구 편집 지도에서 누르는 지역구를 바로 칠한다 (편집 칸을 열지 않음)
        if (!brush && onUnrecTab() && wrapEl && wrapEl.id === 'districtSvgWrap' && o.clickable) {
            // 국가 › 미수복 탭에서는 지역구를 누르면 그 탭 안에서 종류를 고르는 칸이 열린다
            o.onClickKey = key => { selectedDistrictKey = key; refreshUI(); };
        }
        if (brush && wrapEl && wrapEl.id === 'districtSvgWrap' && o.clickable) {
            o.onClickKey = key => paint(key);
            const t = o.title;
            o.title = key => (t ? t(key) : nameOf(key)) + (brush === 'erase' ? ' — 눌러서 지우기' : ` — 눌러서 "${territoryById(brush)?.name || ''}"로 칠하기`);
        }
        const r = origRender.call(this, wrapEl, o);
        const svg = active && wrapEl && wrapEl.querySelector('svg');
        if (svg) {
            fitHatch(svg);
            new MutationObserver(() => fitHatch(svg)).observe(svg, { attributes: true, attributeFilter: ['viewBox'] });
            if (window.ResizeObserver) new ResizeObserver(() => fitHatch(svg)).observe(svg);
        }
        return r;
    };

    // ---- 칠하기 도구: 영토를 고르고 지도에서 지역구를 차례로 눌러 칠한다 ----
    function paint(key) {
        if (brush === 'erase') delete unrecovered[key];
        else if (territoryById(brush)) {
            // 같은 영토로 이미 칠한 곳을 다시 누르면 지운다
            if (unrecovered[key] === brush) delete unrecovered[key]; else unrecovered[key] = brush;
        }
        refreshUI();
    }
    function setBrush(b) {
        brush = brush === b ? null : b;
        refreshUI();
    }

    // ---- 이 지역구가 속한 미수복 지역 종류 고르기 (국가 › 지역의 편집 칸, 국가 › 미수복의 선택 칸 공용) ----
    function kindSelectHtml(key) {
        const cur = isUnrec(key) ? unrecovered[key] : '';
        return `<select class="teaser-unrec-select">
                <option value="">— 아님 (일반 지역구) —</option>
                ${territories.map(t => `<option value="${esc(t.id)}" ${t.id === cur ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
                <option value="__new">+ 새 종류</option>
            </select>`;
    }
    function bindKindSelect(box, key) {
        box.querySelector('select').addEventListener('change', e => {
            const v = e.target.value;
            setUnrecovered(key, v === '__new' ? addTerritory().id : v);
        });
    }
    const origPanel = window.districtRenderNamePanel;
    window.districtRenderNamePanel = function () {
        const r = origPanel.apply(this, arguments);
        const panel = document.getElementById('districtNamePanel');
        const key = typeof selectedDistrictKey !== 'undefined' ? selectedDistrictKey : null;
        if (panel && key && panel.style.display !== 'none') {
            const box = document.createElement('label');
            box.className = 'teaser-unrec-toggle';
            box.innerHTML = `미수복 지역 ${kindSelectHtml(key)}
                <span class="teaser-dim">— 실제로 다스리지 못하는 지역구 (선거 · 의석에서 빠짐) · 종류는 국가 › 미수복에서 관리</span>`;
            bindKindSelect(box, key);
            panel.insertBefore(box, panel.children[1] || null);
        }
        return r;
    };

    function setUnrecovered(key, id) {
        if (id && territoryById(id)) unrecovered[key] = id; else delete unrecovered[key];
        refreshUI();
    }
    function dropTerritory(id) {
        keysOf(id).forEach(k => delete unrecovered[k]);
        territories = territories.filter(x => x.id !== id);
        if (brush === id) brush = null;
        refreshUI();
    }
    // 종류별 통합 — 그 종류의 미수복 지역만 되찾아 일반 지역구로 편입 (다른 종류는 그대로)
    function unifyTerritory(id) {
        const t = territoryById(id);
        if (!t) return;
        const n = keysOf(id).length;
        if (!n) { dropTerritory(id); return; }
        showCustomConfirm(`"${t.name}"의 미수복 지역 ${n}곳을 되찾아 본국에 통합합니다 (일반 지역구로 편입 · 다른 미수복 지역은 그대로). 계속하시겠습니까?`, () => dropTerritory(id));
    }
    function removeTerritory(id) {
        const t = territoryById(id);
        if (!t) return;
        const n = keysOf(id).length;
        if (!n) { dropTerritory(id); return; }
        showCustomConfirm(`"${t.name}" 종류를 지웁니다. 이 종류로 칠한 지역구 ${n}곳은 일반 지역구로 돌아갑니다. 계속하시겠습니까?`, () => dropTerritory(id));
    }
    function unifyAll() {
        const n = Object.keys(unrecovered).filter(isUnrec).length;
        if (!n) return;
        showCustomConfirm(`모든 종류의 미수복 지역 ${n}곳을 되찾아 일반 지역구로 편입합니다. 계속하시겠습니까?`, () => {
            unrecovered = {};
            territories = [];
            brush = null;
            refreshUI();
        });
    }

    // ---- 탭 옮기기: 여론 › 지역구 → 국가 › 지역, 국가 › 미수복 신설 ----
    // (사이드바 · 모바일 탭 바는 js/sidenav.js가 페이지가 다 읽힌 뒤 탭 버튼을 보고 만드므로, 그 전에 버튼 · 내용을 옮겨 둔다)
    function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
    (function moveTabs() {
        const nation = document.getElementById('mainContentNation');
        const nationBar = nation && nation.querySelector(':scope > .sub-tab-container');
        const districtContent = document.getElementById('elecSubDistrict');
        const namePanel = document.getElementById('districtNamePanel');
        if (!nationBar || !districtContent || !namePanel) return;
        const settingsBtn = document.getElementById('subTabNationSettings');
        nationBar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('nation','territory')" id="subTabTerritory">지역</button>`), settingsBtn);
        nationBar.insertBefore(el(`<button class="sub-tab-btn" onclick="switchSubTab('nation','unrecovered')" id="subTabUnrecovered">미수복</button>`), settingsBtn);
        const territory = el(`<div id="contentTerritory" class="sub-tab-content"></div>`);
        const unrec = el(`<div id="contentUnrecovered" class="sub-tab-content"></div>`);
        const settings = document.getElementById('contentNationSettings');
        nation.insertBefore(territory, settings);
        nation.insertBefore(unrec, settings);
        territory.appendChild(namePanel);
        territory.appendChild(districtContent);
        // 국가 탭 안에서는 늘 보이게 — 여론 탭의 하위 내용 표시 규칙(.sub-tab-content.active)에서 뺀다
        districtContent.classList.remove('sub-tab-content');
        districtContent.insertBefore(el(`<div id="teaserUnrecLink" class="teaser-unrec-link"></div>`), districtContent.firstChild);
        // 여론에서는 지역구를 빼고 성향을 첫 화면으로
        document.getElementById('elecSubTabDistrict')?.remove();
        document.getElementById('elecSubTabTendency')?.classList.add('active');
        document.getElementById('elecSubTendency')?.classList.add('active');
    })();
    const onTab = sub => typeof currentMainTab !== 'undefined' && currentMainTab === 'nation' && typeof currentSubTab !== 'undefined' && currentSubTab.nation === sub;
    function onUnrecTab() { return onTab('unrecovered'); }
    // 오른쪽 화면에 지역구 지도를 띄운다 (여론 › 지역구를 열 때와 같은 준비)
    function showDistrictMap() {
        const t = document.getElementById('dispTabDistrict');
        if (t) t.style.display = '';
        if (typeof switchDispTab === 'function') switchDispTab('district');
        if (typeof districtUpdateModeUI === 'function') districtUpdateModeUI();
        setTimeout(() => { if (typeof districtInitCanvas === 'function') districtInitCanvas(); }, 80);
    }
    const origSwitchSub = window.switchSubTab;
    window.switchSubTab = function (main, sub) {
        const r = origSwitchSub.apply(this, arguments);
        if (main === 'nation' && sub === 'territory') {
            showDistrictMap();
            if (typeof renderDistrictListPanel === 'function') renderDistrictListPanel();
            window.districtRenderNamePanel();
            renderUnrecLink();
        }
        if (main === 'nation' && sub === 'unrecovered') { showDistrictMap(); renderUnrecTab(); }
        if (main === 'nation' && sub !== 'unrecovered' && brush) { brush = null; refreshUI(); }
        return r;
    };
    // 예전 호출(도움말의 여론 › 지역구 바로가기 등)은 국가 › 지역으로
    const origElecSub = window.elecSwitchSub;
    window.elecSwitchSub = function (sub) {
        if (sub === 'district') { window.switchSubTab('nation', 'territory'); return; }
        return origElecSub.apply(this, arguments);
    };
    // 여론 탭을 열면 지금 고른 하위 탭(처음엔 성향)의 화면을 그린다 — 원래는 지역구가 첫 화면이라 따로 그릴 일이 없었다
    const origMain = window.switchMainTab;
    window.switchMainTab = function (main) {
        const r = origMain.apply(this, arguments);
        if (main === 'election') {
            const btn = document.querySelector('#mainContentElection > .sub-tab-container .sub-tab-btn.active');
            const sub = btn ? btn.id.replace(/^elecSubTab/, '').toLowerCase() : 'tendency';
            origElecSub(sub || 'tendency');
        }
        if (main !== 'nation' && brush) { brush = null; refreshUI(); }
        return r;
    };

    // ---- 국가 › 지역 위쪽: 미수복 요약 한 줄 ----
    function renderUnrecLink() {
        const box = document.getElementById('teaserUnrecLink');
        if (!box) return;
        const total = Object.keys(unrecovered).filter(isUnrec).length;
        box.innerHTML = `<span>미수복 지역 ${total}곳${territories.length ? ` (${territories.length}종류)` : ''}</span>
            <button type="button" class="teaser-btn">국가 › 미수복에서 관리</button>`;
        box.querySelector('button').addEventListener('click', () => window.switchSubTab('nation', 'unrecovered'));
    }

    // ---- 국가 › 미수복: 종류 목록 · 칠하기 도구 · 종류별 통합 · 영토 통일 ----
    function renderUnrecTab() {
        const host = document.getElementById('contentUnrecovered');
        if (!host) return;
        const total = Object.keys(unrecovered).filter(isUnrec).length;
        const LIMIT = 40;
        const cards = territories.map(t => {
            const keys = keysOf(t.id);
            return `<div class="teaser-terr ${brush === t.id ? 'painting' : ''}" data-id="${esc(t.id)}">
                <div class="teaser-terr-head">
                    <input type="color" class="teaser-terr-color" value="${esc(t.color)}" title="빗금 색">
                    <input type="text" class="teaser-terr-name" value="${esc(t.name)}" maxlength="40" title="종류 이름">
                </div>
                <div class="teaser-terr-actions">
                    <span class="teaser-dim">${keys.length}곳</span>
                    <button type="button" class="teaser-btn teaser-paint ${brush === t.id ? 'active' : ''}">${brush === t.id ? '칠하는 중' : '칠하기'}</button>
                    <button type="button" class="teaser-btn teaser-unify-one">통합</button>
                    <button type="button" class="teaser-btn teaser-del">삭제</button>
                </div>
                ${keys.length ? `<div class="teaser-chips">${keys.slice(0, LIMIT).map(k => `<span class="teaser-chip" data-key="${esc(k)}">${esc(nameOf(k))}<button type="button" title="이 지역구 빼기">×</button></span>`).join('')}${keys.length > LIMIT ? `<span class="teaser-dim teaser-small">외 ${keys.length - LIMIT}곳</span>` : ''}</div>` : '<div class="teaser-dim teaser-small">아직 칠한 지역구가 없습니다</div>'}
            </div>`;
        }).join('');
        const sel = typeof selectedDistrictKey !== 'undefined' ? selectedDistrictKey : null;
        host.innerHTML = `
            <div class="teaser-unrec-summary">
                <div class="teaser-unrec-row">
                    <span class="teaser-unrec-count">미수복 지역 ${territories.length}종류 · ${total}곳</span>
                    <button type="button" class="teaser-unify" ${total ? '' : 'disabled'}>영토 통일 (전체)</button>
                </div>
                <div class="teaser-dim teaser-small">실제로 다스리지 못하는 지역구 — 선거 · 의석에서 빠지고 지도에 종류별 빗금으로 표시됩니다. 종류마다 따로 본국에 통합할 수 있습니다.</div>
                <div class="teaser-add-row">
                    <input type="text" class="teaser-add-name" maxlength="40" placeholder="새 종류 이름 (예: 오스트리아, 알자스로렌-룩셈부르크, 동방영토, 북방영토)">
                    <button type="button" class="teaser-btn teaser-add">+ 종류 추가</button>
                </div>
                ${cards}
                <div class="teaser-tools">
                    <button type="button" class="teaser-btn teaser-erase ${brush === 'erase' ? 'active' : ''}" ${total ? '' : 'disabled'}>${brush === 'erase' ? '지우는 중' : '지우개'}</button>
                </div>
                <div class="teaser-dim teaser-small">${brush
                    ? (brush === 'erase' ? '오른쪽 지도에서 미수복 지역을 눌러 일반 지역구로 돌립니다. 다시 "지우는 중"을 누르면 끝납니다.'
                        : `오른쪽 지도에서 지역구를 차례로 눌러 "${esc(territoryById(brush)?.name || '')}"로 칠합니다 (같은 종류로 칠한 곳을 다시 누르면 지움). 다시 "칠하는 중"을 누르면 끝납니다.`)
                    : (territories.length ? '"칠하기"를 누른 뒤 오른쪽 지도에서 지역구를 차례로 눌러 여러 곳을 한 번에 칠하세요. 칠하기 도구를 끈 채 지역구를 누르면 아래에서 종류를 고를 수 있습니다.'
                        : '종류를 추가하고 "칠하기"로 오른쪽 지도에서 지역구를 칠하세요.')}</div>
                ${sel && !brush ? `<label class="teaser-unrec-toggle teaser-sel">선택한 지역구: <b>${esc(nameOf(sel))}</b> ${kindSelectHtml(sel)}</label>` : ''}
            </div>`;
        host.querySelector('.teaser-unify').addEventListener('click', unifyAll);
        const nameInput = host.querySelector('.teaser-add-name');
        const add = () => { brush = addTerritory(nameInput.value.trim()).id; refreshUI(); };
        host.querySelector('.teaser-add').addEventListener('click', add);
        nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
        host.querySelector('.teaser-erase').addEventListener('click', () => setBrush('erase'));
        const selBox = host.querySelector('.teaser-sel');
        if (selBox) bindKindSelect(selBox, sel);
        host.querySelectorAll('.teaser-terr').forEach(card => {
            const id = card.dataset.id, t = territoryById(id);
            card.querySelector('.teaser-paint').addEventListener('click', () => setBrush(id));
            card.querySelector('.teaser-unify-one').addEventListener('click', () => unifyTerritory(id));
            card.querySelector('.teaser-del').addEventListener('click', () => removeTerritory(id));
            card.querySelector('.teaser-terr-name').addEventListener('change', e => { t.name = e.target.value.trim() || t.name; refreshUI(); });
            card.querySelector('.teaser-terr-color').addEventListener('change', e => { t.color = e.target.value; refreshUI(); });
            card.querySelectorAll('.teaser-chip button').forEach(b => b.addEventListener('click', () => setUnrecovered(b.parentElement.dataset.key, null)));
        });
    }

    function refreshUI() {
        renderUnrecTab();
        renderUnrecLink();
        try {
            if (typeof districtRedrawAllMaps === 'function') districtRedrawAllMaps();
            if (typeof renderDistrictListPanel === 'function') renderDistrictListPanel();
            if (typeof elecUpdateDistrictInfo === 'function') elecUpdateDistrictInfo();
            if (typeof selectedDistrictKey !== 'undefined' && selectedDistrictKey) window.districtRenderNamePanel();
        } catch (e) { /* 아직 화면이 덜 그려진 시점 */ }
    }

    const style = document.createElement('style');
    style.textContent = `
        .teaser-unrec-summary { margin-bottom: 10px; padding: 8px 10px; border: 1px dashed var(--tno-gold); background: rgba(255,215,0,.04); font-size: .85rem; }
        .teaser-unrec-count { font-weight: bold; }
        .teaser-unrec-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; color: #ccc; }
        .teaser-unify { cursor: pointer; font-family: inherit; font-size: .8rem; background: transparent; border: 1px solid var(--tno-neon); color: var(--tno-neon); padding: 4px 10px; }
        .teaser-unify:disabled { opacity: .4; cursor: default; }
        .teaser-dim { color: #777; }
        .teaser-small { font-size: .75rem; margin-top: 4px; line-height: 1.5; }
        .teaser-unrec-toggle { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 4px 0 8px; font-size: .85rem; color: var(--tno-gold); cursor: pointer; }
        .teaser-unrec-toggle .teaser-dim { flex-basis: 100%; font-size: .72rem; }
        .teaser-unrec-select { font-family: inherit; font-size: .8rem; background: #111; color: inherit; border: 1px solid #444; padding: 2px 4px; max-width: 100%; }
        .teaser-unrec-link { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; padding: 6px 10px; border: 1px dashed var(--tno-gold); font-size: .8rem; color: #ccc; }
        .teaser-add-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
        .teaser-add-name { flex: 1 1 200px; min-width: 0; font-family: inherit; font-size: .8rem; background: transparent; color: inherit; border: 1px solid #444; padding: 4px 6px; }
        .teaser-terr { margin-top: 8px; padding: 8px; border: 1px solid rgba(255,255,255,.08); }
        .teaser-terr.painting { border-color: var(--tno-neon); box-shadow: 0 0 6px color-mix(in srgb, var(--tno-neon) 40%, transparent); }
        .teaser-terr-head { display: flex; align-items: center; gap: 6px; }
        .teaser-terr-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .teaser-terr-actions .teaser-dim { margin-right: auto; }
        .teaser-terr-color { flex: 0 0 auto; width: 26px; height: 22px; padding: 0; border: none; background: none; cursor: pointer; }
        .teaser-terr-name { flex: 1 1 auto; width: 100%; min-width: 0; box-sizing: border-box; font-family: inherit; font-size: .85rem; background: transparent; color: inherit; border: none; border-bottom: 1px solid #444; padding: 2px; }
        .teaser-btn { cursor: pointer; font-family: inherit; font-size: .75rem; background: transparent; border: 1px solid #555; color: #bbb; padding: 3px 8px; white-space: nowrap; }
        .teaser-btn.active { border-color: var(--tno-neon); color: #000; background: var(--tno-neon); }
        .teaser-btn:disabled { opacity: .4; cursor: default; }
        .teaser-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .teaser-chip { display: inline-flex; align-items: center; gap: 2px; font-size: .72rem; padding: 1px 2px 1px 6px; border: 1px solid #333; color: #aaa; }
        .teaser-chip button { cursor: pointer; background: none; border: none; color: #777; font-family: inherit; font-size: .8rem; padding: 0 3px; }
        .teaser-chip button:hover { color: #f87171; }
        .teaser-tools { display: flex; gap: 6px; margin-top: 8px; }
        .teaser-sel { margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,.08); }
        html[data-theme-family="modern"] .teaser-unrec-summary { border: 1px dashed var(--m-border-strong); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .teaser-unrec-row { color: var(--m-text); }
        html[data-theme-family="modern"] .teaser-unify { border: none; border-radius: 8px; background: var(--m-accent); color: var(--m-on-accent); font-weight: 600; }
        html[data-theme-family="modern"] .teaser-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .teaser-unrec-toggle { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .teaser-terr { border: 1px solid var(--m-border); border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .teaser-terr.painting { border-color: var(--m-accent); box-shadow: none; }
        html[data-theme-family="modern"] .teaser-terr-name { border-bottom-color: var(--m-border-strong); }
        html[data-theme-family="modern"] .teaser-unrec-link { border: 1px dashed var(--m-border-strong); border-radius: 10px; color: var(--m-text); }
        html[data-theme-family="modern"] .teaser-add-name { border: 1px solid var(--m-border-strong); border-radius: 8px; background: var(--m-surface); }
        html[data-theme-family="modern"] .teaser-chip { border: 1px solid var(--m-border); border-radius: 999px; color: var(--m-text-2); background: var(--m-surface-2); }
        html[data-theme-family="modern"] .teaser-sel { border-top-color: var(--m-border); }
        html[data-theme-family="modern"] .teaser-btn { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text-2); }
        html[data-theme-family="modern"] .teaser-btn.active { background: var(--m-accent); color: var(--m-on-accent); border-color: var(--m-accent); }
        html[data-theme-family="modern"] .teaser-unrec-select { background: var(--m-surface); border: 1px solid var(--m-border-strong); border-radius: 6px; }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refreshUI, 0));
})();
