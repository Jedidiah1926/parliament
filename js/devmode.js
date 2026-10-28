// 개발자 모드 — 설정 › 기타 설정에서 개발자 코드를 넣으면 켜지고, 켜져 있어야 티저(teaser69) 화면을 열 수 있다.
// 코드는 원문 대신 해시로만 비교한다. 정적 페이지라 진짜 보안은 아니고, 미리보기를 일반 사용자에게 숨기는 용도.
// main.html(과 그 복사본인 티저 페이지)은 <head>에서 이 파일을 먼저 읽는다 — 티저 페이지(<html data-app-mode="teaser">)는 개발자 모드가 아니면 설정 화면으로 돌려보내고,
// 본 게임은 튜토리얼의 "미리보기" 과정(1.6.2 ~ 1.6.4) 잠금을 푸는 데 HemiDev.isOn()을 쓴다.
// 디버그 모드(설정 › 기타 설정) — "숨겨진 정부 형태 보이기"를 켜면 내각 › 정부 형태 · 권한의 정부 형태에
// 이벤트로만 들어가던 숨겨진 정부 형태(1.6.2 군정 · 1.6.3 당-국가 체제 · 1.6.6 전제군주정) 버튼이 나와 바로 바꿀 수 있다.
// 각 기능 파일(js/coup.js · js/revolution.js · js/royal.js)이 HemiDev.hiddenGov.register로 버튼을 등록한다.
(function () {
    'use strict';
    const KEY = 'hemicycleDevMode';
    const CODE_HASH = '22zsze7nlqm';
    // 경제 미리보기 코드 — 개발자 모드 전체가 아니라 Teaser 1.6.9(경제)만 연다. 1.6.9가 본 게임에 들어가면 쓸 일이 없어짐
    const ECON_HASH = 'wbfoh8bs26';
    const ECON_TEASERS = ['69'];
    const TEASERS = [
        { id: '69', file: 'teaser69.html', title: 'Teaser 1.6.9', note: '경제 시스템 — 통화 · 재정 · 지역구 경제 · 예산안 · 경제 그래프 · 후보 선출 방법 · 공동교섭단체' },
    ];

    // cyrb53 — 짧은 53비트 문자열 해시
    function hash(str, seed = 1926) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }
    function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
    function safeDel(k) { try { localStorage.removeItem(k); } catch (e) { /* 저장 공간을 쓸 수 없는 환경 */ } }

    // Steam 데모 빌드(tools/build-demo.js가 window.HEMI_BUILD.demo를 켬)에는 미리보기 화면이 없으므로 개발자 모드도 없음
    const DEMO = !!(window.HEMI_BUILD && window.HEMI_BUILD.demo);
    const isOn = () => !DEMO && safeGet(KEY) === CODE_HASH;
    // 'full'(개발자 모드) · 'economy'(경제 미리보기 코드) · null
    const access = () => (DEMO ? null : safeGet(KEY) === CODE_HASH ? 'full' : safeGet(KEY) === ECON_HASH ? 'economy' : null);
    const anyOn = () => !!access();
    const canOpen = id => access() === 'full' || (access() === 'economy' && ECON_TEASERS.includes(String(id)));
    // 코드가 맞으면 켜고 true — 대소문자 · 앞뒤 공백은 따지지 않는다 (휴대폰 자동 대문자 대비)
    function unlock(code) {
        if (DEMO) return false;
        const h = hash(String(code || '').trim().toLowerCase());
        if (h === CODE_HASH) return safeSet(KEY, CODE_HASH);
        if (h === ECON_HASH && access() !== 'full') return safeSet(KEY, ECON_HASH); // 이미 개발자 모드면 좁히지 않음
        return false;
    }
    function lock() { safeDel(KEY); }

    // ---- 디버그 모드: 숨겨진 정부 형태 보이기/숨기기 ----
    const DEBUG_HIDDEN_GOV_KEY = 'hemicycleDebugHiddenGov';
    const debug = {
        hiddenGov: () => safeGet(DEBUG_HIDDEN_GOV_KEY) === '1',
        setHiddenGov(on) { if (on) safeSet(DEBUG_HIDDEN_GOV_KEY, '1'); else safeDel(DEBUG_HIDDEN_GOV_KEY); renderHiddenGov(); },
    };
    //   def: { id, label, version, isActive: () => bool, enter: () => void } — version 순으로 정부 형태 버튼 아래에 붙는다
    const hiddenGovDefs = [];
    function renderHiddenGov() {
        const anchor = document.getElementById('govTypePresidentialBtn');
        const group = anchor && anchor.parentElement;
        if (!group) return;
        let box = document.getElementById('hiddenGovTypeBox');
        if (!debug.hiddenGov() || !hiddenGovDefs.length) { if (box) box.remove(); return; }
        if (!box) {
            box = document.createElement('div');
            box.id = 'hiddenGovTypeBox';
            box.style.marginTop = '10px';
            group.parentElement.insertBefore(box, group.nextSibling);
        }
        box.innerHTML = '<label style="color:#888;font-size:0.8rem;margin-bottom:6px;display:block;">숨겨진 정부 형태 (디버그 모드)</label>'
            + '<div class="system-radio-group" style="flex-direction:column;"></div>';
        const list = box.lastChild;
        hiddenGovDefs.slice().sort((a, b) => String(a.version).localeCompare(String(b.version), undefined, { numeric: true })).forEach(d => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'system-radio-btn';
            b.id = 'govTypeHidden-' + d.id;
            let active = false;
            try { active = !!d.isActive(); } catch (e) { /* 화면 준비 전 */ }
            b.classList.toggle('active', active);
            b.textContent = `${d.label} (${d.version})`;
            b.onclick = () => d.enter();
            list.appendChild(b);
        });
    }
    const hiddenGov = {
        register(def) {
            const i = hiddenGovDefs.findIndex(d => d.id === def.id);
            if (i >= 0) hiddenGovDefs[i] = def; else hiddenGovDefs.push(def);
            renderHiddenGov();
        },
        render: renderHiddenGov,
    };

    window.HemiDev = { isOn, anyOn, access, canOpen, unlock, lock, demo: DEMO, debug, hiddenGov,
        // 열 수 있는 티저만 (개발자 모드는 전부, 경제 미리보기 코드는 1.6.9만)
        get teasers() { return DEMO ? [] : TEASERS.filter(t => canOpen(t.id)); } };

    // 티저 페이지 잠금 — 개발자 모드가 아니면 설정 › 기타 설정으로
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'teaser' && !canOpen(root.getAttribute('data-teaser') || '69')) {
        const id = root.getAttribute('data-teaser') || '69';
        root.style.visibility = 'hidden';
        location.replace('settings.html?locked=' + encodeURIComponent(id) + '#etc');
    }
})();
