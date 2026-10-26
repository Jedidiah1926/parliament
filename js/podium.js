// ===== 의장석 (1.6.1 — 본 게임 · 모든 미리보기 화면 공통, 로고 제작 화면만 빼고) =====
// 반원 가운데 빈 곳에 의장석(단상 + 의장)을 그릴지 정한다. 의회 › 의회 설정의 "반원 중앙 표시" 아래에 설정이 붙는다.
//   always — 반원 화면에 늘 그리고, 애니메이션(봉쇄 돌파 · 의장석 점거)에도 그림
//   anim   — 애니메이션에서만 (기본)
//   occupy — 의장석 점거 애니메이션에서만
// 저장은 세이브의 podium 칸 (예전 미리보기 세이브는 teaserPodium 칸).
// 위치는 반원 가운데 표시(의석 수 · 로고) 바로 위 — 국회공성전(js/siege.js)의 애니메이션도 TeaserPodium.geom()으로 같은 자리에 그린다.
/* global getAppState, setAppState, chamberCenterMode, chamberLogos, isModernTheme, redrawAll */
(function () {
    'use strict';
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'logo') return;
    // 봉쇄 돌파 · 의장석 점거 애니메이션 (1.6.4 국회공성전 — js/siege.js, 본 게임에 들어감)
    const hasAnim = () => true;

    const MODES = [['always', '항상 표시'], ['anim', '애니메이션에서만'], ['occupy', '의장석 점거 때만']];
    let mode = 'anim';

    const origGet = window.getAppState;
    window.getAppState = function () {
        const st = origGet.apply(this, arguments);
        if (st && typeof st === 'object') st.podium = { mode };
        return st;
    };
    const origSet = window.setAppState;
    window.setAppState = function (state) {
        const r = origSet.apply(this, arguments);
        const pd = state && (state.podium || state.teaserPodium), m = pd && pd.mode;
        mode = MODES.some(x => x[0] === m) ? m : 'anim';
        renderUI();
        return r;
    };

    // 의장석 자리: 반원 가운데 표시(의석 수 글씨 또는 로고) 바로 위
    function geom(CX, CY, width, chamber) {
        const ch = chamber || 'house';
        const minR = width * 0.15;
        let top = CY - 34; // 의석 수 글씨(30px)의 윗부분
        try {
            if (chamberCenterMode[ch] === 'logo' && chamberLogos[ch]) {
                const box = Math.max(34, Math.min(width * 0.132, 156));
                top = CY + 27 - box;
            }
        } catch (e) { /* 설정 없음 */ }
        const w = Math.max(24, minR * 0.55), h = Math.max(7, width * 0.011);
        const y = Math.max(CY - minR * 0.85, top - 8 - h / 2);
        return { x: CX, y, w, h, speakerY: y - h / 2 - Math.max(4, h * 0.7) };
    }
    function draw(ctx, pd, ch, opts = {}) {
        const modern = typeof isModernTheme === 'function' && isModernTheme();
        const wood = opts.wood || (modern ? '#c8a27a' : '#6b5233');
        ctx.save();
        ctx.fillStyle = wood; ctx.fillRect(pd.x - pd.w / 2, pd.y - pd.h / 2, pd.w, pd.h);
        ctx.strokeStyle = '#e0b030'; ctx.lineWidth = 1; ctx.strokeRect(pd.x - pd.w / 2, pd.y - pd.h / 2, pd.w, pd.h);
        if (opts.speaker !== false) {
            const r = Math.max(3, pd.h * 0.6);
            ctx.beginPath(); ctx.arc(pd.x, pd.speakerY, r, 0, Math.PI * 2); ctx.fillStyle = '#e0b030'; ctx.fill();
            ctx.strokeStyle = modern ? '#18181b' : '#000'; ctx.lineWidth = 1; ctx.stroke();
        }
        if (opts.label) {
            ctx.font = `10px ${modern ? 'Pretendard, system-ui, sans-serif' : "'NeoDunggeunmo', monospace"}`;
            ctx.textAlign = 'center'; ctx.fillStyle = opts.labelColor || '#888';
            ctx.fillText(opts.label, pd.x, pd.y + pd.h / 2 + 11);
        }
        ctx.restore();
    }

    // 반원 화면에 늘 그리기 — 가운데 표시를 그린 직후에 덧그린다 (처음 그릴 때 · 표결 등으로 다시 그릴 때 모두)
    const origCenter = window.drawChamberCenter;
    if (typeof origCenter === 'function') {
        window.drawChamberCenter = function (ctx, CX, CY, total, chamber, cvsId, width) {
            const r = origCenter.apply(this, arguments);
            if (mode === 'always' && /^(house|senate|third)Canvas$/.test(String(cvsId || ''))) {
                try { draw(ctx, geom(CX, CY, width, chamber), chamber); } catch (e) { /* 그리기 실패는 무시 */ }
            }
            return r;
        };
    }

    // ---- 설정 UI: 의회 › 의회 설정 › 반원 중앙 표시 아래 ----
    function renderUI() {
        const anchor = document.getElementById('chamberCenterThirdWrap');
        if (!anchor) return;
        let box = document.getElementById('teaserPodiumSetting');
        if (!box) {
            box = document.createElement('div');
            box.id = 'teaserPodiumSetting';
            box.style.marginTop = '16px';
            anchor.parentElement.insertBefore(box, anchor.nextSibling);
        }
        const modes = hasAnim() ? MODES : [['always', '항상 표시'], ['anim', '표시 안 함']];
        box.innerHTML = `<label style="color:#888;font-size:0.8rem;margin-bottom:6px;display:block;">의장석 표시</label>
            <div class="system-radio-group" style="margin-bottom:6px;">${modes.map(([k, t]) => `<button type="button" class="system-radio-btn ${mode === k || (k === 'anim' && !hasAnim() && mode === 'occupy') ? 'active' : ''}" data-podium="${k}">${t}</button>`).join('')}</div>
            <div style="color:#666;font-size:0.72rem;">${hasAnim() ? '반원 가운데에 의장석(단상과 의장)을 그립니다. "항상 표시"면 반원 화면에도 늘 보이고, 봉쇄 돌파 · 의장석 점거 애니메이션에도 나옵니다.' : '반원 가운데(의석 수 · 로고 위)에 의장석(단상과 의장)을 그립니다.'}</div>`;
        box.querySelectorAll('[data-podium]').forEach(b => {
            b.onclick = () => {
                mode = b.dataset.podium;
                renderUI();
                try { redrawAll(); } catch (e) { /* 화면 준비 전 */ }
            };
        });
    }

    window.TeaserPodium = window.HemiPodium = {
        mode: () => mode,
        // 애니메이션에서 의장석을 그릴지: kind = 'breakthrough' | 'occupy'
        showIn: kind => mode === 'always' || mode === 'anim' || (mode === 'occupy' && kind === 'occupy'),
        geom, draw,
    };
    renderUI();
    window.addEventListener('load', () => setTimeout(renderUI, 0));
})();
