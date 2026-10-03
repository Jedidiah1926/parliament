// ===== Hemicycle 티저 (teaser.html 전용) — 다음 업데이트 기능 미리 써 보기 =====
// teaser.html은 main.html을 그대로 복사한 화면에 이 파일 하나를 더 불러 미리보기 기능을 얹는다.
// (저장 공간은 본 게임과 따로 — main.js의 LS_PREFIX 'hemicycleTeaser:')
//
// 1.6.6 "즉시, 지체 없이" 미리보기 — 미수복 지역 · 영토 통일
//   - 지역구 편집 칸에서 지역구를 "미수복 지역"으로 지정하면 모든 지도에서 빗금으로 따로 보이고,
//     지역구 선거 · 지방선거 · 국민투표에서 빠진다 (그 지역구 의석은 지역구 의석 수에서 빠짐)
//   - "영토 통일"을 누르면 미수복 지역을 모두 되찾아 일반 지역구로 돌린다
// main.js의 최상위 함수(getAppState · renderDistrictSvgInto 등)는 전역에 이름으로 걸려 있어서 여기서 감싸 덮어쓴다
/* global getAppState, setAppState, renderDistrictSvgInto, districtRenderNamePanel, districtActiveSeatCount,
   elecSimulateDistrictsSvg, districtSvgMapFor, districtNames, districtSeatCounts, districtGrid, selectedDistrictKey,
   districtMapMode, districtRedrawAllMaps, renderDistrictListPanel, elecUpdateDistrictInfo, showCustomConfirm, escapeHtmlText */
(function () {
    'use strict';
    if (document.documentElement.getAttribute('data-app-mode') !== 'teaser') return;

    let unrecovered = {}; // { 지역구 키: true }
    const isUnrec = key => !!unrecovered[key];
    window.isDistrictUnrecovered = isUnrec; // 지방선거 · 국민투표(js/popvote.js)가 이걸 보고 뺀다
    const esc = s => (typeof escapeHtmlText === 'function' ? escapeHtmlText(String(s)) : String(s));
    const nameOf = key => districtNames.house?.[key] || key;

    // ---- 저장 · 불러오기: 세이브에 teaser 칸으로 ----
    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.teaser = { unrecovered: { ...unrecovered } };
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const u = state && state.teaser && state.teaser.unrecovered;
        unrecovered = u && typeof u === 'object' ? { ...u } : {};
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

    // ---- 지도: 미수복 지역구는 빗금 + 툴팁에 (미수복) ----
    function hatchDefs(chamber) {
        const map = typeof districtSvgMapFor === 'function' ? districtSvgMapFor(chamber || 'house') : null;
        const vb = String(map && map.viewBox || '0 0 100 100').split(/[\s,]+/).map(Number);
        const step = Math.max((vb[2] || 100), (vb[3] || 100)) / 120;
        const light = document.documentElement.getAttribute('data-theme-mode') === 'light';
        const line = light ? '#9ca3af' : '#6b7280';
        const bg = light ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
        return `<pattern id="hemiUnrecHatch" patternUnits="userSpaceOnUse" width="${step}" height="${step}" patternTransform="rotate(45)">`
            + `<rect width="${step}" height="${step}" fill="${bg}"/><rect width="${step * 0.35}" height="${step}" fill="${line}"/></pattern>`;
    }
    const origRender = window.renderDistrictSvgInto;
    window.renderDistrictSvgInto = function (wrapEl, opts) {
        const o = { ...(opts || {}) };
        if (Object.keys(unrecovered).length) {
            const g = o.getFill, t = o.title, b = o.seatBadges;
            o.defs = (o.defs || '') + hatchDefs(o.chamber);
            o.getFill = key => (isUnrec(key) ? 'url(#hemiUnrecHatch)' : (g ? g(key) : null));
            o.title = key => (isUnrec(key) ? `${nameOf(key)} (미수복 지역)` : (t ? t(key) : nameOf(key)));
            if (b) o.seatBadges = key => (isUnrec(key) ? null : b(key));
        }
        return origRender.call(this, wrapEl, o);
    };

    // ---- 지역구 편집 칸: "미수복 지역" 체크 ----
    const origPanel = window.districtRenderNamePanel;
    window.districtRenderNamePanel = function () {
        const r = origPanel.apply(this, arguments);
        const panel = document.getElementById('districtNamePanel');
        const key = typeof selectedDistrictKey !== 'undefined' ? selectedDistrictKey : null;
        if (panel && key && panel.style.display !== 'none') {
            const box = document.createElement('label');
            box.className = 'teaser-unrec-toggle';
            box.innerHTML = `<input type="checkbox" ${isUnrec(key) ? 'checked' : ''}> 미수복 지역 <span class="teaser-dim">— 실제로 다스리지 못하는 지역구 (선거 · 의석에서 빠짐)</span>`;
            box.querySelector('input').addEventListener('change', e => setUnrecovered(key, e.target.checked));
            panel.insertBefore(box, panel.children[1] || null);
        }
        return r;
    };

    function setUnrecovered(key, on) {
        if (on) unrecovered[key] = true; else delete unrecovered[key];
        refreshUI();
    }
    function unifyAll() {
        const n = Object.keys(unrecovered).length;
        if (!n) return;
        showCustomConfirm(`미수복 지역 ${n}곳을 모두 되찾아 일반 지역구로 편입합니다. 계속하시겠습니까?`, () => {
            unrecovered = {};
            refreshUI();
        });
    }

    // ---- 지역구 탭 위쪽 요약 줄 (미수복 n곳 · 영토 통일) ----
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
        const keys = Object.keys(unrecovered);
        el.innerHTML = `
            <div class="teaser-badge">1.6.6 미리보기</div>
            <div class="teaser-unrec-row">
                <span>미수복 지역 <b>${keys.length}</b>곳</span>
                <button type="button" class="teaser-unify" ${keys.length ? '' : 'disabled'}>영토 통일</button>
            </div>
            ${keys.length ? `<div class="teaser-dim teaser-small">${keys.slice(0, 12).map(k => esc(nameOf(k))).join(' · ')}${keys.length > 12 ? ` 외 ${keys.length - 12}곳` : ''}</div>` : '<div class="teaser-dim teaser-small">지역구를 눌러 편집 칸에서 "미수복 지역"을 체크하세요</div>'}`;
        el.querySelector('.teaser-unify').addEventListener('click', unifyAll);
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
        .teaser-badge { display: inline-block; font-size: .7rem; color: var(--tno-gold); border: 1px solid var(--tno-gold); padding: 0 6px; margin-bottom: 6px; letter-spacing: 1px; }
        .teaser-unrec-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #ccc; }
        .teaser-unify { cursor: pointer; font-family: inherit; font-size: .8rem; background: transparent; border: 1px solid var(--tno-neon); color: var(--tno-neon); padding: 4px 10px; }
        .teaser-unify:disabled { opacity: .4; cursor: default; }
        .teaser-dim { color: #777; }
        .teaser-small { font-size: .75rem; margin-top: 4px; line-height: 1.5; }
        .teaser-unrec-toggle { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 4px 0 8px; font-size: .85rem; color: var(--tno-gold); cursor: pointer; }
        .teaser-unrec-toggle .teaser-dim { flex-basis: 100%; font-size: .72rem; }
        html[data-theme-family="modern"] .teaser-unrec-summary { border: 1px dashed var(--m-border-strong); border-radius: 12px; background: var(--m-surface-2); }
        html[data-theme-family="modern"] .teaser-badge { color: var(--m-gold); border-color: var(--m-gold); border-radius: 6px; font-weight: 700; }
        html[data-theme-family="modern"] .teaser-unrec-row { color: var(--m-text); }
        html[data-theme-family="modern"] .teaser-unify { border: none; border-radius: 8px; background: var(--m-accent); color: var(--m-on-accent); font-weight: 600; }
        html[data-theme-family="modern"] .teaser-dim { color: var(--m-text-3); }
        html[data-theme-family="modern"] .teaser-unrec-toggle { color: var(--m-text); font-weight: 600; }
    `;
    document.head.appendChild(style);
    window.addEventListener('load', () => setTimeout(refreshUI, 0));
})();
