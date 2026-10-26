// 개발자 모드 — 설정 › 기타 설정에서 개발자 코드를 넣으면 켜지고, 켜져 있어야 티저(teaser66 ~ teaser69) 화면을 열 수 있다.
// 코드는 원문 대신 해시로만 비교한다. 정적 페이지라 진짜 보안은 아니고, 미리보기를 일반 사용자에게 숨기는 용도.
// main.html(과 그 복사본인 티저 페이지)은 <head>에서 이 파일을 먼저 읽는다 — 티저 페이지(<html data-app-mode="teaser">)는 개발자 모드가 아니면 설정 화면으로 돌려보내고,
// 본 게임은 튜토리얼의 "미리보기" 과정(1.6.2 ~ 1.6.4) 잠금을 푸는 데 HemiDev.isOn()을 쓴다.
// 디버그 모드(설정 › 기타 설정) — "숨겨진 정부 형태 보이기"를 켜면 내각 › 내각 설정의 정부 형태에
// 이벤트로만 들어가던 숨겨진 정부 형태(1.6.2 군정 · 1.6.3 당-국가 체제 · 1.6.6 전제군주정) 버튼이 나와 바로 바꿀 수 있다.
// 각 기능 파일(js/coup.js · js/revolution.js · js/teaser66.js)이 HemiDev.hiddenGov.register로 버튼을 등록한다.
(function () {
    'use strict';
    const KEY = 'hemicycleDevMode';
    const CODE_HASH = '22zsze7nlqm';
    const TEASERS = [
        { id: '66', file: 'teaser66.html', title: 'Teaser 1.6.6', note: '왕정복고 · 전제군주정 · 왕위 계승 · 친위 쿠데타 · 공화 혁명' },
        { id: '67', file: 'teaser67.html', title: 'Teaser 1.6.7', note: '미수복 지역 · 영토 통일 (+1.6.6)' },
        { id: '68', file: 'teaser68.html', title: 'Teaser 1.6.8', note: '종속국 · 종속국 의회 · 합병 · 해방 (+1.6.6 ~ 1.6.7)' },
        { id: '69', file: 'teaser69.html', title: 'Teaser 1.6.9', note: '경제 시스템 — 통화 · 재정 · 지역구 경제 · 예산안 · 경제 그래프 (+1.6.6 ~ 1.6.8)' },
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
    // 코드가 맞으면 켜고 true — 대소문자 · 앞뒤 공백은 따지지 않는다 (휴대폰 자동 대문자 대비)
    function unlock(code) {
        if (DEMO || hash(String(code || '').trim().toLowerCase()) !== CODE_HASH) return false;
        return safeSet(KEY, CODE_HASH);
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

    window.HemiDev = { isOn, unlock, lock, demo: DEMO, teasers: DEMO ? [] : TEASERS.slice(), debug, hiddenGov };

    // 티저 페이지 잠금 — 개발자 모드가 아니면 설정 › 기타 설정으로
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'teaser' && !isOn()) {
        const id = root.getAttribute('data-teaser') || '67';
        root.style.visibility = 'hidden';
        location.replace('settings.html?locked=' + encodeURIComponent(id) + '#etc');
    }
})();
