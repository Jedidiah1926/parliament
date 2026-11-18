// ===== 정식 출시 설정 =====
// official: false — 지금(오픈 베타 · OBT): 지금처럼 그대로 플레이
// official: true  — 정식 출시(Steam): 이 판(웹 · GitHub 설치판)에서는 플레이만 막는다.
//     · 시작 화면 소식에 Steam 상점 링크(steamUrl)가 나온다
//     · "시작하기" 대신 "세이브 내보내기" — 브라우저에 남은 세이브를 골라 .hemi 또는 .json으로 받아 Steam 판으로 옮길 수 있다
//     · 게임 화면(main.html · Teaser)을 열면 Steam으로 안내하는 창이 덮는다 (맵 메이커 · 설정은 그대로)
//     · 번역 템플릿 받기(시작 화면 언어 메뉴)도 막는다 — data-official-block 버튼은 숨기고, 받기 함수도 막음
//     · Steam 판(electron/steam.json에 appId가 있는 데스크톱 앱)은 막지 않는다
// steamUrl: 나중에 채울 Steam 상점 주소 — 비어 있으면 링크 대신 "상점 페이지 준비 중"으로 보여 준다
// webMoved: true — 브라우저 판(웹사이트로 연 게임) 종료: 앱(릴리스)만 쓴다. 웹사이트로 열면 official처럼 플레이를 막고
//     "세이브 내보내기"와 앱 받기(releasesUrl)로 안내한다 — 브라우저에 남은 세이브를 앱으로 옮길 수 있게.
//     앱(데스크톱 · Steam), 파일로 직접 연 게임(file://), 이 컴퓨터의 테스트 서버(localhost · 127.0.0.1)는 막지 않는다.
window.HEMI_OFFICIAL = Object.freeze({
    official: false,
    steamUrl: '', // 예: 'https://store.steampowered.com/app/0000000/Hemicycle/'
    webMoved: true,
    releasesUrl: 'https://github.com/Jedidiah1926/parliament/releases',
});

(function () {
    'use strict';
    const cfg = window.HEMI_OFFICIAL || {};
    const isSteamBuild = () => !!(window.hemicycleDesktop && window.hemicycleDesktop.isSteamBuild);
    const isOfficial = () => !!cfg.official;
    const isDemoBuild = () => !!(window.HEMI_BUILD && window.HEMI_BUILD.demo); // Steam 데모 빌드
    // 웹사이트로 연 게임인지 — 앱(window.hemicycleDesktop)도 아니고 file://도 아니고 이 컴퓨터의 테스트 서버도 아닌 http(s)
    const isWebSite = () => !window.hemicycleDesktop && /^https?:$/.test(location.protocol)
        && !/^(localhost|127(?:\.\d+){3}|\[::1\]|0\.0\.0\.0)$/.test(location.hostname);
    const webMoved = () => !!cfg.webMoved && isWebSite();
    const playBlocked = () => (isOfficial() && !isSteamBuild() && !isDemoBuild()) || webMoved();
    const releasesUrl = () => String(cfg.releasesUrl || '');
    const steamUrl = () => String(cfg.steamUrl || '');
    const SAVE_SLOTS_KEY = 'hemiParliamentSaveSlots'; // js/main.js와 같은 키 (본 게임 저장 공간)
    const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // ---- 세이브 내보내기 — 브라우저에 남은 세이브를 골라 .hemi / .json 파일로 ----
    function savedSlots() {
        try {
            const slots = JSON.parse(localStorage.getItem(SAVE_SLOTS_KEY) || '[]');
            return (Array.isArray(slots) ? slots : []).filter(s => s && s.state && typeof s.state === 'object')
                .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
        } catch (e) { return []; }
    }
    const slotName = s => s.name || (s.isAutosave ? i18n('sim.contentSave.1') : (s.state.config && s.state.config.nationName) || i18n('sim.official.1'));
    function fileName(s, ext) {
        const base = String(slotName(s)).replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/\s+/g, '_').slice(0, 40) || 'save';
        const d = new Date(s.savedAt || Date.now());
        const stamp = isNaN(d) ? '' : `-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        return `hemicycle-${base}${stamp}${ext}`;
    }
    function download(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = name;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    async function exportSlots(ids, fmt) {
        const list = savedSlots().filter(s => ids.includes(s.id));
        const used = new Set();
        for (const s of list) {
            const ext = fmt === 'json' ? '.json' : '.hemi';
            let name = fileName(s, ext);
            for (let i = 2; used.has(name); i++) name = fileName(s, `-${i}${ext}`);
            used.add(name);
            let blob;
            if (fmt === 'json' || !(window.HemiFile && window.HemiFile.compressed)) blob = new Blob([JSON.stringify(s.state)], { type: fmt === 'json' ? 'application/json' : 'application/octet-stream' });
            else blob = await window.HemiFile.encode(s.state);
            download(blob, name);
            await new Promise(r => setTimeout(r, 350)); // 여러 파일을 한꺼번에 받을 때 브라우저가 놓치지 않게
        }
        return list.length;
    }
    function openExport() {
        let ov = document.getElementById('hemiExportModal');
        if (ov) ov.remove();
        const slots = savedSlots();
        const canHemi = !!(window.HemiFile && window.HemiFile.compressed);
        ov = document.createElement('div');
        ov.id = 'hemiExportModal';
        ov.className = 'hemi-off-overlay';
        ov.innerHTML = `<div class="hemi-off-box" role="dialog" aria-label="${esc(i18n('sim.official.2'))}">
            <div class="hemi-off-title">${esc(i18n('sim.official.2'))}</div>
            <div class="hemi-off-desc">${esc(i18n('sim.official.3'))}</div>
            ${slots.length ? `<label class="hemi-off-all"><input type="checkbox" data-x="all" checked> ${esc(i18n('sim.official.4'))} <span class="hemi-off-dim">(${slots.length}${esc(i18n('sim.official.5'))}</span></label>
            <div class="hemi-off-list">${slots.map(s => `<label class="hemi-off-item"><input type="checkbox" data-id="${esc(s.id)}" checked><span class="hemi-off-name">${esc(slotName(s))}</span><span class="hemi-off-dim">${s.savedAt ? esc(new Date(s.savedAt).toLocaleString()) : ''}</span></label>`).join('')}</div>
            <div class="hemi-off-fmt"><span>${esc(i18n('sim.main.14'))}</span>
                <label><input type="radio" name="hemiExportFmt" value="hemi" ${canHemi ? 'checked' : 'disabled'}> ${esc(i18n('sim.official.6'))}</label>
                <label><input type="radio" name="hemiExportFmt" value="json" ${canHemi ? '' : 'checked'}> .json</label></div>`
            : `<div class="hemi-off-empty">${esc(i18n('sim.official.7'))}</div>`}
            <div class="hemi-off-btns">${slots.length ? `<button type="button" class="hemi-off-btn primary" data-x="go">${esc(i18n('sim.official.8'))}</button>` : ''}<button type="button" class="hemi-off-btn" data-x="close">${esc(i18n('sim.main.2'))}</button></div>
        </div>`;
        document.body.appendChild(ov);
        const q = s => ov.querySelector(s);
        const boxes = () => Array.from(ov.querySelectorAll('input[data-id]'));
        const all = q('[data-x="all"]');
        if (all) all.onchange = () => boxes().forEach(b => { b.checked = all.checked; });
        boxes().forEach(b => { b.onchange = () => { if (all) all.checked = boxes().every(x => x.checked); }; });
        q('[data-x="close"]').onclick = () => ov.remove();
        ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
        const go = q('[data-x="go"]');
        if (go) go.onclick = async () => {
            const ids = boxes().filter(b => b.checked).map(b => b.dataset.id);
            if (!ids.length) { go.textContent = i18n('sim.official.9'); setTimeout(() => { go.textContent = i18n('sim.official.8'); }, 1500); return; }
            const fmt = (ov.querySelector('input[name="hemiExportFmt"]:checked') || {}).value || 'json';
            go.disabled = true; go.textContent = i18n('sim.official.10');
            const n = await exportSlots(ids, fmt);
            go.disabled = false; go.textContent = i18n('sim.official.11', { v: n });
        };
    }

    // ---- 게임 화면을 막는 안내 (정식 출시 후 웹 · GitHub 판) ----
    function blockGame(closable) {
        if (document.getElementById('hemiOfficialGate')) return;
        const g = document.createElement('div');
        g.id = 'hemiOfficialGate';
        g.className = 'hemi-off-overlay hemi-off-gate';
        const url = steamUrl();
        // 브라우저 판 종료(webMoved)면 앱(릴리스) 받기로, 정식 출시(official)면 Steam 상점으로
        const web = webMoved() && !(isOfficial() && url);
        const getApp = web
            ? (releasesUrl() ? `<a class="hemi-off-btn primary" href="${esc(releasesUrl())}" target="_blank" rel="noopener noreferrer">${esc(i18n('sim.official.webGetApp'))}</a>` : '')
            : (url ? `<a class="hemi-off-btn primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(i18n('sim.official.14'))}</a>` : `<span class="hemi-off-btn disabled">${esc(i18n('sim.official.15'))}</span>`);
        g.innerHTML = `<div class="hemi-off-box" role="alertdialog">
            <div class="hemi-off-title">${esc(i18n(web ? 'sim.official.webTitle' : 'sim.official.12'))}</div>
            <div class="hemi-off-desc">${esc(i18n(web ? 'sim.official.webDesc' : 'sim.official.13'))}</div>
            <div class="hemi-off-btns">
                ${getApp}
                <button type="button" class="hemi-off-btn" data-x="export">${esc(i18n('sim.official.16'))}</button>
                ${closable ? `<button type="button" class="hemi-off-btn" data-x="close">${esc(i18n('sim.main.2'))}</button>` : `<a class="hemi-off-btn" href="index.html">${esc(i18n('sim.official.17'))}</a>`}
            </div></div>`;
        document.body.appendChild(g);
        g.querySelector('[data-x="export"]').onclick = openExport;
        if (closable) { g.querySelector('[data-x="close"]').onclick = () => g.remove(); return; }
        // 막힌 화면 뒤의 단축키(Ctrl+S 등)도 먹지 않게
        window.addEventListener('keydown', e => { if (!document.getElementById('hemiExportModal')) { e.stopImmediatePropagation(); } }, true);
    }

    window.HemiOfficial = { isOfficial, webMoved, playBlocked, steamUrl, releasesUrl, openExport, exportSlots, savedSlots };

    function decorate() {
        const on = isOfficial();
        document.querySelectorAll('[data-official-only]').forEach(el => { el.hidden = !on; });
        // 시작 화면: Steam 상점 링크
        const steam = document.getElementById('homeSteamLink');
        if (steam) {
            steam.hidden = !on;
            if (on && steamUrl()) steam.href = steamUrl();
            else if (on) {
                steam.removeAttribute('href');
                steam.classList.add('home-news-soon');
                const d = steam.querySelector('.home-news-desc');
                if (d) d.textContent = i18n('sim.official.18');
            }
        }
        // 정식 출시 뒤 막는 판에서는 번역 템플릿 받기 같은 버튼(data-official-block)을 숨긴다
        document.querySelectorAll('[data-official-block]').forEach(el => { el.hidden = playBlocked(); });
        if (!playBlocked()) return;
        const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (page === '' || page === 'index.html') {
            // "시작하기" → "세이브 내보내기"
            const start = document.querySelector('.home-menu-primary');
            if (start) {
                start.removeAttribute('onclick');
                start.onclick = e => { e.preventDefault(); openExport(); };
                const l = start.querySelector('.home-menu-label'), d = start.querySelector('.home-menu-desc');
                if (l) l.textContent = i18n('sim.official.2');
                if (d) d.textContent = i18n(webMoved() && !isOfficial() ? 'sim.official.webStartDesc' : 'sim.official.19');
            }
            // 브라우저 판 종료: 시작 화면에 들어오면 안내 창을 먼저 띄운다 (닫고 메인 화면을 볼 수 있음)
            if (webMoved() && !isOfficial()) blockGame(true);
            if (/[?&#]export\b/.test(location.search + location.hash)) openExport();
        } else if (/^(main|teaser\d*|logo)\.html$/.test(page)) {
            blockGame();
        }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate);
    else decorate();

    // 막는 창 · 내보내기 창 모양 (테마와 상관없이 읽기 쉬운 어두운 상자)
    const css = document.createElement('style');
    css.textContent = `
        .hemi-off-overlay { position: fixed; inset: 0; z-index: 2147483000; background: rgba(8,10,14,.82) !important; display: flex; align-items: center; justify-content: center; padding: 16px; font-family: system-ui, "Malgun Gothic", sans-serif; }
        .hemi-off-gate { background: rgba(8,10,14,.94) !important; }
        .hemi-off-box { width: 100%; max-width: 480px; max-height: calc(100vh - 32px); display: flex; flex-direction: column; gap: 10px; background: #14171d !important; color: #e8eaed !important; border: 1px solid #2f3540 !important; border-radius: 12px; padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,.5); box-sizing: border-box; }
        .hemi-off-title { font-size: 18px; font-weight: 700; }
        .hemi-off-desc { font-size: 13.5px; line-height: 1.6; color: #c4c9d1 !important; }
        #hemiExportModal label, #hemiExportModal .hemi-off-name, #hemiExportModal .hemi-off-fmt span { color: #e8eaed !important; opacity: 1 !important; }
        .hemi-off-box input { accent-color: #3b82f6; }
        .hemi-off-dim { color: #8a93a0 !important; font-size: 12px; }
        .hemi-off-all { font-size: 13px; display: flex; align-items: center; gap: 6px; }
        .hemi-off-list { overflow: auto; border: 1px solid #2a2f38 !important; border-radius: 8px; min-height: 60px; }
        .hemi-off-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-bottom: 1px solid #22262e !important; font-size: 13.5px; cursor: pointer; }
        .hemi-off-item:last-child { border-bottom: 0 !important; }
        .hemi-off-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .hemi-off-fmt { display: flex; align-items: center; gap: 12px; font-size: 13px; flex-wrap: wrap; }
        .hemi-off-fmt label { display: inline-flex; align-items: center; gap: 4px; cursor: pointer; }
        .hemi-off-empty { font-size: 13px; color: #8a93a0 !important; padding: 12px 0; }
        .hemi-off-btns { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; margin-top: 4px; }
        .hemi-off-btn { cursor: pointer; font: inherit; font-size: 13px; padding: 8px 14px; border-radius: 8px; border: 1px solid #3a414d !important; background: transparent !important; color: #e8eaed !important; text-decoration: none; display: inline-flex; align-items: center; }
        .hemi-off-btn.primary { background: #3b82f6 !important; border-color: #3b82f6 !important; color: #fff !important; }
        .hemi-off-btn.disabled { opacity: .55; cursor: default; }
        .hemi-off-btn:disabled { opacity: .6; cursor: default; }
        .home-news-steam svg { filter: drop-shadow(0 0 1px rgba(0,0,0,.35)); }
        .home-news-item.home-news-soon { cursor: default; opacity: .75; }`;
    (document.head || document.documentElement).appendChild(css);
})();
