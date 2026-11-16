// ===== Hemicycle — 메인 화면 반원 배경 =====
// 메인 화면 빈 공간에 의석 반원을 옅게 깔고, 의석이 천천히 켜졌다 꺼지게 한다.
//  - 색은 현재 강조색(--tno-neon)을 따라감. 테마 색·모드를 바꾸면 같이 바뀜
//  - 가끔 표결하듯 왼쪽부터 오른쪽으로 불이 쓸고 지나감
//  - '동작 줄이기' 설정을 켠 사용자에게는 움직이지 않는 정지 화면
//  - 탭이 안 보일 때는 그리기를 멈춤
// 사용법: index.html 맨 아래, </body> 바로 앞에 <script src="js/hemi-bg.js"></script>
(function () {
    'use strict';

    // ---- 조절값 ----
    const CFG = {
        centerX: 0.36,     // 반원 중심의 가로 위치 (화면 폭 대비)
        baseY: 1.04,       // 반원 밑변의 세로 위치 (화면 높이 대비, 1보다 크면 아래가 잘림)
        radius: 0.66,      // 바깥 반지름 (화면 높이 대비)
        innerRatio: 0.38,  // 안쪽 반지름 / 바깥 반지름
        rows: 10,          // 줄 수
        seatsPerRow: 0.8,  // 줄 길이 대비 의석 밀도 (클수록 촘촘)
        baseAlpha: 0.05,   // 꺼진 의석 밝기
        litAlpha: 0.38,    // 켜진 의석 밝기
        lightAlpha: 0.45,  // 라이트 모드에서 밝기 배율 (밝은 배경에선 더 옅게)
        blinkPerSec: 6,    // 초당 새로 켜지는 의석 수
        waveEvery: 14,     // 표결 물결 간격(초)
        fps: 30
    };

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');

    // ---- 캔버스 붙이기 ----
    const host = document.querySelector('.home') || document.body;
    const cv = document.createElement('canvas');
    cv.id = 'hemiBg';
    cv.setAttribute('aria-hidden', 'true');
    Object.assign(cv.style, {
        position: host === document.body ? 'fixed' : 'absolute',
        inset: '0', width: '100%', height: '100%',
        zIndex: '-1', pointerEvents: 'none', display: 'block'
    });
    if (host !== document.body) {
        // .home 안에서만 뒤로 깔리도록 쌓임 맥락을 만든다 (다른 요소 위치는 그대로)
        host.style.isolation = 'isolate';
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    }
    host.insertBefore(cv, host.firstChild);
    const ctx = cv.getContext('2d');

    // ---- 색 ----
    function toRgb(color) {
        const c = document.createElement('canvas').getContext('2d');
        c.fillStyle = '#00ffff'; c.fillStyle = color;
        const v = c.fillStyle;
        if (v[0] === '#') return [1, 3, 5].map(i => parseInt(v.slice(i, i + 2), 16));
        const m = v.match(/[\d.]+/g);
        return m ? m.slice(0, 3).map(Number) : [0, 255, 255];
    }
    function luminance([r, g, b]) {
        const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }
    function readTheme() {
        const cs = getComputedStyle(document.documentElement);
        let accent = cs.getPropertyValue('--tno-neon').trim() || (window.getThemeColor && window.getThemeColor()) || '#00ffff';
        let bg = cs.getPropertyValue('--tno-bg').trim() || getComputedStyle(document.body).backgroundColor || '#05070a';
        return { accent: toRgb(accent), lightBg: luminance(toRgb(bg)) > 0.4 };
    }

    // 의석 하나 모양을 미리 그려 두고 찍어서 쓴다 (빛번짐 포함)
    let sprite = null, spriteR = 0, theme = readTheme(), themeKey = '';
    function buildSprite(r) {
        const pad = theme.lightBg ? 1 : Math.ceil(r * 1.4), size = Math.ceil((r + pad) * 2);
        const s = document.createElement('canvas'); s.width = s.height = size;
        const g = s.getContext('2d'), c = size / 2;
        const [R, G, B] = theme.accent;
        const glow = g.createRadialGradient(c, c, r * 0.6, c, c, r + pad);
        glow.addColorStop(0, `rgba(${R},${G},${B},0.22)`);
        glow.addColorStop(1, `rgba(${R},${G},${B},0)`);
        if (!theme.lightBg) { g.fillStyle = glow; g.fillRect(0, 0, size, size); }
        g.fillStyle = `rgb(${R},${G},${B})`;
        g.beginPath(); g.arc(c, c, r, 0, Math.PI * 2); g.fill();
        sprite = s; spriteR = size / 2;
    }

    // ---- 의석 배치 ----
    let W = 0, H = 0, dpr = 1, seats = [], dotR = 2;
    function layout() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        const rect = cv.getBoundingClientRect();
        W = Math.max(1, rect.width); H = Math.max(1, rect.height);
        cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);

        const R1 = CFG.radius * H, R0 = R1 * CFG.innerRatio;
        const cx = CFG.centerX * W, cy = CFG.baseY * H;
        const gapRow = (R1 - R0) / (CFG.rows - 1);
        dotR = Math.max(2, gapRow * 0.24);
        seats = [];
        for (let i = 0; i < CFG.rows; i++) {
            const r = R0 + gapRow * i;
            const n = Math.max(6, Math.round((Math.PI * r) / (gapRow / CFG.seatsPerRow)));
            for (let j = 0; j < n; j++) {
                const th = Math.PI - Math.PI * j / (n - 1);
                const x = cx + r * Math.cos(th), y = cy - r * Math.sin(th);
                if (y < -dotR * 3 || y > H + dotR * 3 || x < -dotR * 3 || x > W + dotR * 3) continue;
                seats.push({ x, y, th, lit: 0, target: 0, until: 0 });
            }
        }
        buildSprite(dotR);
    }

    // ---- 애니메이션 ----
    let last = 0, acc = 0, waveStart = -1, nextWave = 4, raf = 0, running = false;
    function step(t, dt) {
        // 새로 켜질 의석 고르기
        acc += CFG.blinkPerSec * dt;
        while (acc >= 1 && seats.length) {
            acc -= 1;
            const s = seats[(Math.random() * seats.length) | 0];
            s.target = 0.55 + Math.random() * 0.45;
            s.until = t + 1 + Math.random() * 2.5;
        }
        // 표결 물결
        if (t >= nextWave && waveStart < 0) { waveStart = t; }
        let wavePos = -1;
        if (waveStart >= 0) {
            wavePos = (t - waveStart) / 2.4;          // 0 → 1 동안 왼쪽에서 오른쪽으로
            if (wavePos > 1.3) { waveStart = -1; nextWave = t + CFG.waveEvery * (0.7 + Math.random() * 0.6); wavePos = -1; }
        }
        const k = Math.min(1, dt * 2.2);              // 켜지고 꺼지는 속도
        for (const s of seats) {
            if (s.until && t > s.until) { s.target = 0; s.until = 0; }
            let goal = s.target;
            if (wavePos >= 0) {
                const p = 1 - s.th / Math.PI;           // 왼쪽 0 → 오른쪽 1
                const d = wavePos - p;
                if (d > 0 && d < 0.25) goal = Math.max(goal, 0.7 * (1 - d / 0.25));
            }
            s.lit += (goal - s.lit) * k;
        }
    }
    function draw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        if (!sprite) return;
        const m = theme.lightBg ? CFG.lightAlpha : 1;
        const size = spriteR * 2;
        for (const s of seats) {
            ctx.globalAlpha = (CFG.baseAlpha + (CFG.litAlpha - CFG.baseAlpha) * s.lit) * m;
            ctx.drawImage(sprite, s.x - spriteR, s.y - spriteR, size, size);
        }
        ctx.globalAlpha = 1;
    }
    function frame(now) {
        raf = 0;
        if (!running) return;
        const t = now / 1000;
        const dt = last ? Math.min(0.1, t - last) : 0;
        if (!last || t - last >= 1 / CFG.fps - 0.002) {
            step(t, dt); draw(); last = t;
        }
        raf = requestAnimationFrame(frame);
    }
    function staticFrame() {
        // 동작 줄이기: 일부 의석만 켜 둔 정지 화면
        for (let i = 0; i < seats.length; i++) seats[i].lit = ((i * 2654435761) >>> 0) % 7 === 0 ? 0.8 : 0;
        draw();
    }
    function start() {
        if (reduceMotion && reduceMotion.matches) { running = false; staticFrame(); return; }
        if (running) return;
        running = true; last = 0;
        if (!raf) raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    // ---- 테마 변경 ----
    function refreshTheme(force) {
        const next = readTheme();
        const key = next.accent.join(',') + (next.lightBg ? 'L' : 'D');
        if (key === themeKey && !force) return;
        theme = next; themeKey = key;
        buildSprite(dotR);
        if (!running) (reduceMotion && reduceMotion.matches) ? staticFrame() : draw();
    }
    const later = () => requestAnimationFrame(() => refreshTheme(false));
    window.addEventListener('hemi-theme-color', later);
    try {
        new MutationObserver(later).observe(document.documentElement,
            { attributes: true, attributeFilter: ['data-theme-mode', 'data-theme-mod', 'data-ui-mode', 'style', 'class'] });
    } catch (e) {}

    // ---- 크기 · 보이기 ----
    let resizeT = 0;
    window.addEventListener('resize', () => {
        clearTimeout(resizeT);
        resizeT = setTimeout(() => { layout(); if (!running) (reduceMotion && reduceMotion.matches) ? staticFrame() : draw(); }, 120);
    });
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
    if (reduceMotion && reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', () => { stop(); start(); });
    }

    themeKey = theme.accent.join(',') + (theme.lightBg ? 'L' : 'D');
    layout();
    if (!document.hidden) start(); else draw();

    window.HemiBackground = { start, stop, refresh: () => { layout(); refreshTheme(true); }, config: CFG };
})();
