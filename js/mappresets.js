// ===== 맵 프리셋 — 국가 › 지역에서 지역구 지도를 고르는 창 (presets/maps.js, tools/build-map-presets.js가 만듦) =====
// 맵 메이커 없이 나라 지도 하나를 골라 바로 지역구 지도로 쓴다 (Steam 데모에서는 지도 올리기 대신 이것만).
// 지도 자료는 창을 처음 열 때 불러오고, 카드마다 지도 모양을 작게 그린다. 고르면 기존 지역구를 바꿀지 묻고(js/main.js
// districtConfirmReplaceMap) 지역구 이름 · 약칭을 함께 넣는다 (화면 언어가 영어면 영어 이름).
(function () {
    'use strict';
    const t = s => (window.DnoLang && typeof DnoLang.t === 'function' ? DnoLang.t(s) : s);
    const isEn = () => (typeof window.getLang === 'function' ? window.getLang() : 'kr') === 'en';
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    let loading = null, overlay = null;

    function load() {
        if (window.HemiMapPresets) return Promise.resolve(window.HemiMapPresets);
        if (!loading) loading = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'presets/maps.js';
            s.onload = () => (window.HemiMapPresets ? resolve(window.HemiMapPresets) : reject(new Error('maps.js')));
            s.onerror = () => { loading = null; reject(new Error('maps.js')); };
            document.head.appendChild(s);
        });
        return loading;
    }

    const css = `
.hemi-mp-overlay { position: fixed; inset: 0; z-index: 100000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.72); }
.hemi-mp { --c: var(--tno-neon, #00ffff); width: 920px; max-width: 100%; max-height: calc(100vh - 32px); display: flex; flex-direction: column; background: #0a0c10; color: #ddd; border: 1px solid var(--c); box-shadow: 0 0 18px color-mix(in srgb, var(--c) 30%, transparent); font-family: 'NeoDunggeunmo', 'VT323', monospace; }
.hemi-mp-head { display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px 10px; }
.hemi-mp-title { color: var(--c); font-size: 1.1rem; letter-spacing: 1px; }
.hemi-mp-sub { font-size: .8rem; color: #888; margin-top: 4px; line-height: 1.5; }
.hemi-mp-x { margin-left: auto; background: none; border: 1px solid #333; color: #aaa; width: 30px; height: 30px; cursor: pointer; font: inherit; flex: none; }
.hemi-mp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; padding: 6px 18px 18px; overflow-y: auto; }
.hemi-mp-card { display: flex; flex-direction: column; gap: 6px; text-align: left; padding: 8px; background: #05070a; border: 1px solid #262b33; color: inherit; cursor: pointer; font: inherit; }
.hemi-mp-card:hover, .hemi-mp-card:focus-visible { border-color: var(--c); outline: none; }
.hemi-mp-thumb { width: 100%; aspect-ratio: 1 / 1; display: block; }
.hemi-mp-thumb path { fill: color-mix(in srgb, var(--c) 22%, transparent); stroke: var(--c); stroke-width: .8; vector-effect: non-scaling-stroke; }
.hemi-mp-name { font-size: .95rem; color: #eee; }
.hemi-mp-desc { font-size: .72rem; color: #888; line-height: 1.4; }
.hemi-mp-foot { padding: 0 18px 14px; font-size: .7rem; color: #666; }
.hemi-mp-msg { padding: 30px 18px; color: #888; }
html[data-theme-family="modern"] .hemi-mp { --c: var(--m-accent, #2563eb); background: var(--m-surface, #fff); color: var(--m-text, #18181b); border: 1px solid var(--m-border, #e4e4e7); border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.25); font-family: var(--m-font, inherit); }
html[data-theme-family="modern"] .hemi-mp-title { color: var(--m-text, #18181b); font-weight: 700; letter-spacing: 0; }
html[data-theme-family="modern"] .hemi-mp-sub, html[data-theme-family="modern"] .hemi-mp-desc, html[data-theme-family="modern"] .hemi-mp-foot { color: var(--m-text-3, #71717a); }
html[data-theme-family="modern"] .hemi-mp-x { border-color: var(--m-border, #e4e4e7); color: var(--m-text-3, #71717a); border-radius: 8px; }
html[data-theme-family="modern"] .hemi-mp-card { background: var(--m-surface-2, #f4f4f5); border: 1px solid transparent; border-radius: 12px; }
html[data-theme-family="modern"] .hemi-mp-card:hover, html[data-theme-family="modern"] .hemi-mp-card:focus-visible { border-color: var(--c); }
html[data-theme-family="modern"] .hemi-mp-name { color: var(--m-text, #18181b); font-weight: 600; }
`;
    function injectStyle() {
        if (document.getElementById('hemiMapPresetStyle')) return;
        const st = document.createElement('style'); st.id = 'hemiMapPresetStyle'; st.textContent = css; document.head.appendChild(st);
    }

    function close() {
        if (overlay) { overlay.remove(); overlay = null; }
        document.removeEventListener('keydown', onKey, true);
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }

    async function open() {
        injectStyle();
        close();
        overlay = document.createElement('div');
        overlay.className = 'hemi-mp-overlay';
        overlay.innerHTML = `<div class="hemi-mp" role="dialog" aria-modal="true" aria-labelledby="hemiMpTitle">
            <div class="hemi-mp-head"><div><div class="hemi-mp-title" id="hemiMpTitle">${esc(t('맵 프리셋'))}</div>
                <div class="hemi-mp-sub">${esc(t('나라를 고르면 그 나라의 행정구역이 지역구 지도가 됩니다. 고른 뒤 지역구를 눌러 의석 수 · 인구 · 성향을 정하세요.'))}</div></div>
                <button type="button" class="hemi-mp-x" aria-label="${esc(t('닫기'))}">×</button></div>
            <div class="hemi-mp-grid"><div class="hemi-mp-msg">${esc(t('지도를 불러오는 중…'))}</div></div>
            <div class="hemi-mp-foot">${esc(t('지도 자료: Natural Earth (공개 도메인)'))}</div></div>`;
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelector('.hemi-mp-x').onclick = close;
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(overlay);
        const grid = overlay.querySelector('.hemi-mp-grid');
        let maps;
        try { maps = await load(); }
        catch (e) { grid.innerHTML = `<div class="hemi-mp-msg">${esc(t('지도를 불러오지 못했습니다.'))}</div>`; return; }
        if (!overlay) return;
        const en = isEn();
        grid.innerHTML = maps.map((m, i) => `<button type="button" class="hemi-mp-card" data-i="${i}">
            <svg class="hemi-mp-thumb" viewBox="${esc(m.viewBox)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${m.districts.map(d => `<path d="${d.d}"/>`).join('')}</svg>
            <span class="hemi-mp-name">${esc(en ? m.name.en : m.name.ko)}</span>
            <span class="hemi-mp-desc">${esc(en ? m.desc.en : m.desc.ko)} · ${m.count}${en ? '' : '개 지역구'}</span></button>`).join('');
        grid.querySelectorAll('.hemi-mp-card').forEach(b => { b.onclick = () => choose(maps[+b.dataset.i]); });
        const first = grid.querySelector('.hemi-mp-card'); if (first) first.focus();
    }

    function choose(map) {
        const apply = () => {
            const en = isEn();
            const shapes = map.districts.map(d => ({ key: d.key, tag: 'path', attrs: { d: d.d } }));
            const labels = Object.fromEntries(map.districts.map(d => [d.key, { name: en ? d.en : d.ko, abbr: d.abbr }]));
            close();
            if (typeof window.districtApplyMapData !== 'function') return;
            window.districtApplyMapData({ viewBox: map.viewBox, shapes }, labels);
            if (typeof window.showKbdToast === 'function') window.showKbdToast(`${en ? map.name.en : map.name.ko} · ${map.count}${en ? ' districts' : '개 지역구'}`);
        };
        if (typeof window.districtConfirmReplaceMap === 'function') window.districtConfirmReplaceMap(apply, () => {});
        else apply();
    }

    window.HemiMapPresetPicker = { open, close, load };
})();
