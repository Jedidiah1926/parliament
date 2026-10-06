// ===== Hemicycle 티저 (teaser.html 전용) — 다음 업데이트 기능 미리 써 보기 =====
// teaser.html은 main.html을 그대로 복사한 화면에 이 파일 하나를 더 불러 미리보기 기능을 얹는다.
// (저장 공간은 본 게임과 따로 — main.js의 LS_PREFIX 'hemicycleTeaser:')
//
// 1.6.6 "즉시, 지체 없이" 미리보기 — 미수복 지역 · 영토 통일
//   - 미수복 영토를 여러 개 만들고(영토마다 이름 · 빗금 색), "칠하기"로 지도에서 지역구를 차례로 눌러 칠하거나
//     지역구 편집 칸에서 영토를 고른다. 미수복 지역은 모든 지도에서 영토 색 빗금으로 따로 보이고,
//     지역구 선거 · 지방선거 · 국민투표에서 빠진다 (그 지역구 의석은 지역구 의석 수에서 빠짐)
//   - "통일"은 영토 하나를, "영토 통일 (전체)"는 모든 미수복 지역을 되찾아 일반 지역구로 돌린다
// main.js의 최상위 함수(getAppState · renderDistrictSvgInto 등)는 전역에 이름으로 걸려 있어서 여기서 감싸 덮어쓴다
/* global getAppState, setAppState, renderDistrictSvgInto, districtRenderNamePanel, districtActiveSeatCount,
   elecSimulateDistrictsSvg, districtNames, districtSeatCounts, districtGrid, selectedDistrictKey,
   districtMapMode, districtRedrawAllMaps, renderDistrictListPanel, elecUpdateDistrictInfo, showCustomConfirm, escapeHtmlText */
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
        const t = { id: 't' + n, name: name || `미수복 영토 ${n}`, color: PALETTE[(n - 1) % PALETTE.length] };
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
            o.title = key => (isUnrec(key) ? `${nameOf(key)} (미수복: ${territoryOf(key).name})` : (t ? t(key) : nameOf(key)));
            if (b) o.seatBadges = key => (isUnrec(key) ? null : b(key));
        }
        // 칠하기 도구가 켜져 있으면 지역구 편집 지도에서 누르는 지역구를 바로 칠한다 (편집 칸을 열지 않음)
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

    // ---- 지역구 편집 칸: 이 지역구가 속한 미수복 영토 고르기 ----
    const origPanel = window.districtRenderNamePanel;
    window.districtRenderNamePanel = function () {
        const r = origPanel.apply(this, arguments);
        const panel = document.getElementById('districtNamePanel');
        const key = typeof selectedDistrictKey !== 'undefined' ? selectedDistrictKey : null;
        if (panel && key && panel.style.display !== 'none') {
            const cur = isUnrec(key) ? unrecovered[key] : '';
            const box = document.createElement('label');
            box.className = 'teaser-unrec-toggle';
            box.innerHTML = `미수복 영토 <select class="teaser-unrec-select">
                    <option value="">— 아님 (일반 지역구) —</option>
                    ${territories.map(t => `<option value="${esc(t.id)}" ${t.id === cur ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
                    <option value="__new">+ 새 미수복 영토</option>
                </select>
                <span class="teaser-dim">— 실제로 다스리지 못하는 지역구 (선거 · 의석에서 빠짐)</span>`;
            box.querySelector('select').addEventListener('change', e => {
                const v = e.target.value;
                setUnrecovered(key, v === '__new' ? addTerritory().id : v);
            });
            panel.insertBefore(box, panel.children[1] || null);
        }
        return r;
    };

    function setUnrecovered(key, id) {
        if (id && territoryById(id)) unrecovered[key] = id; else delete unrecovered[key];
        refreshUI();
    }
    function unifyTerritory(id) {
        const t = territoryById(id);
        const n = keysOf(id).length;
        if (!t) return;
        const done = () => {
            keysOf(id).forEach(k => delete unrecovered[k]);
            territories = territories.filter(x => x.id !== id);
            if (brush === id) brush = null;
            refreshUI();
        };
        if (!n) { done(); return; }
        showCustomConfirm(`"${t.name}"의 미수복 지역 ${n}곳을 되찾아 일반 지역구로 편입합니다. 계속하시겠습니까?`, done);
    }
    function removeTerritory(id) {
        const t = territoryById(id);
        if (!t) return;
        const n = keysOf(id).length;
        const done = () => {
            keysOf(id).forEach(k => delete unrecovered[k]);
            territories = territories.filter(x => x.id !== id);
            if (brush === id) brush = null;
            refreshUI();
        };
        if (!n) { done(); return; }
        showCustomConfirm(`"${t.name}" 영토를 지웁니다. 칠해 둔 지역구 ${n}곳은 일반 지역구로 돌아갑니다. 계속하시겠습니까?`, done);
    }
    function unifyAll() {
        const n = Object.keys(unrecovered).filter(isUnrec).length;
        if (!n) return;
        showCustomConfirm(`미수복 지역 ${n}곳을 모두 되찾아 일반 지역구로 편입합니다. 계속하시겠습니까?`, () => {
            unrecovered = {};
            territories = [];
            brush = null;
            refreshUI();
        });
    }

    // ---- 지역구 탭 위쪽: 미수복 영토 목록 · 칠하기 도구 · 영토 통일 ----
    function renderSummary() {
        const host = document.getElementById('districtSvgEditUI');
        if (!host) return;
        let el = document.getElementById('teaserUnrecSummary');
        if (!el) {
            el = document.createElement('div');
            el.id = 'teaserUnrecSummary';
            el.className = 'teaser-unrec-summary';
            host.insertBefore(el, host.firstChild);
        }
        const total = Object.keys(unrecovered).filter(isUnrec).length;
        const rows = territories.map(t => {
            const keys = keysOf(t.id);
            return `<div class="teaser-terr ${brush === t.id ? 'painting' : ''}" data-id="${esc(t.id)}">
                <div class="teaser-unrec-row">
                    <input type="color" class="teaser-terr-color" value="${esc(t.color)}" title="빗금 색">
                    <input type="text" class="teaser-terr-name" value="${esc(t.name)}" maxlength="40">
                    <span class="teaser-dim">${keys.length}곳</span>
                    <button type="button" class="teaser-btn teaser-paint ${brush === t.id ? 'active' : ''}">${brush === t.id ? '칠하는 중' : '칠하기'}</button>
                    <button type="button" class="teaser-btn teaser-unify-one">통일</button>
                    <button type="button" class="teaser-btn teaser-del" title="영토 지우기">✕</button>
                </div>
                ${keys.length ? `<div class="teaser-dim teaser-small">${keys.slice(0, 12).map(k => esc(nameOf(k))).join(' · ')}${keys.length > 12 ? ` 외 ${keys.length - 12}곳` : ''}</div>` : ''}
            </div>`;
        }).join('');
        el.innerHTML = `
            <div class="teaser-unrec-row">
                <span class="teaser-unrec-count">미수복 영토 ${territories.length}개 · 지역 ${total}곳</span>
                <button type="button" class="teaser-unify" ${total ? '' : 'disabled'}>영토 통일 (전체)</button>
            </div>
            ${rows}
            <div class="teaser-unrec-row teaser-tools">
                <button type="button" class="teaser-btn teaser-add">+ 미수복 영토 추가</button>
                <button type="button" class="teaser-btn teaser-erase ${brush === 'erase' ? 'active' : ''}" ${total ? '' : 'disabled'}>${brush === 'erase' ? '지우는 중' : '지우개'}</button>
            </div>
            <div class="teaser-dim teaser-small">${brush
                ? (brush === 'erase' ? '지도에서 미수복 지역을 눌러 일반 지역구로 돌립니다. 다시 "지우는 중"을 누르면 끝납니다.'
                    : `지도에서 지역구를 차례로 눌러 "${esc(territoryById(brush)?.name || '')}"로 칠합니다 (같은 영토로 칠한 곳을 다시 누르면 지움). 다시 "칠하는 중"을 누르면 끝납니다.`)
                : (territories.length ? '"칠하기"를 누른 뒤 지도에서 지역구를 차례로 눌러 여러 곳을 한 번에 칠하세요. 지역구 편집 칸에서도 고를 수 있습니다.'
                    : '"+ 미수복 영토 추가"로 영토를 만들고 "칠하기"로 지도에서 지역구를 칠하세요.')}</div>`;
        el.querySelector('.teaser-unify').addEventListener('click', unifyAll);
        el.querySelector('.teaser-add').addEventListener('click', () => { brush = addTerritory().id; refreshUI(); });
        el.querySelector('.teaser-erase').addEventListener('click', () => setBrush('erase'));
        el.querySelectorAll('.teaser-terr').forEach(row => {
            const id = row.dataset.id, t = territoryById(id);
            row.querySelector('.teaser-paint').addEventListener('click', () => setBrush(id));
            row.querySelector('.teaser-unify-one').addEventListener('click', () => unifyTerritory(id));
            row.querySelector('.teaser-del').addEventListener('click', () => removeTerritory(id));
            row.querySelector('.teaser-terr-name').addEventListener('change', e => { t.name = e.target.value.trim() || t.name; refreshUI(); });
            row.querySelector('.teaser-terr-color').addEventListener('change', e => { t.color = e.target.value; refreshUI(); });
        });
    }

    function refreshUI() {
        renderSummary();
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
        .teaser-unrec-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #ccc; }
        .teaser-unify { cursor: pointer; font-family: inherit; font-size: .8rem; background: transparent; border: 1px solid var(--tno-neon); color: var(--tno-neon); padding: 4px 10px; }
        .teaser-unify:disabled { opacity: .4; cursor: default; }
        .teaser-dim { color: #777; }
        .teaser-small { font-size: .75rem; margin-top: 4px; line-height: 1.5; }
        .teaser-unrec-toggle { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 4px 0 8px; font-size: .85rem; color: var(--tno-gold); cursor: pointer; }
        .teaser-unrec-toggle .teaser-dim { flex-basis: 100%; font-size: .72rem; }
        .teaser-unrec-select { font-family: inherit; font-size: .8rem; background: #111; color: inherit; border: 1px solid #444; padding: 2px 4px; }
        .teaser-terr { margin-top: 8px; padding: 6px 8px; border: 1px solid rgba(255,255,255,.08); }
        .teaser-terr.painting { border-color: var(--tno-neon); box-shadow: 0 0 6px color-mix(in srgb, var(--tno-neon) 40%, transparent); }
        .teaser-terr .teaser-unrec-row { justify-content: flex-start; flex-wrap: wrap; }
        .teaser-terr-color { width: 26px; height: 22px; padding: 0; border: none; background: none; cursor: pointer; }
        .teaser-terr-name { flex: 1; min-width: 90px; font-family: inherit; font-size: .82rem; background: transparent; color: inherit; border: none; border-bottom: 1px solid #444; padding: 2px 2px; }
        .teaser-btn { cursor: pointer; font-family: inherit; font-size: .75rem; background: transparent; border: 1px solid #555; color: #bbb; padding: 3px 8px; }
        .teaser-btn.active { border-color: var(--tno-neon); color: #000; background: var(--tno-neon); }
        .teaser-btn:disabled { opacity: .4; cursor: default; }
        .teaser-tools { justify-content: flex-start; margin-top: 8px; }
        html[data-theme-family="modern"] .teaser-unrec-summary { border: 1px dashed var(--m-border-strong); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .teaser-unrec-row { color: var(--m-text); }
        html[data-theme-family="modern"] .teaser-unify { border: none; border-radius: 8px; background: var(--m-accent); color: var(--m-on-accent); font-weight: 600; }
        html[data-theme-family="modern"] .teaser-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .teaser-unrec-toggle { color: var(--m-text); font-weight: 600; }
        html[data-theme-family="modern"] .teaser-terr { border: 1px solid var(--m-border); border-radius: 10px; background: var(--m-surface); }
        html[data-theme-family="modern"] .teaser-terr.painting { border-color: var(--m-accent); box-shadow: none; }
        html[data-theme-family="modern"] .teaser-terr-name { border-bottom-color: var(--m-border-strong); }
        html[data-theme-family="modern"] .teaser-btn { border: 1px solid var(--m-border-strong); border-radius: 8px; color: var(--m-text-2); }
        html[data-theme-family="modern"] .teaser-btn.active { background: var(--m-accent); color: var(--m-on-accent); border-color: var(--m-accent); }
        html[data-theme-family="modern"] .teaser-unrec-select { background: var(--m-surface); border: 1px solid var(--m-border-strong); border-radius: 6px; }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refreshUI, 0));
})();
