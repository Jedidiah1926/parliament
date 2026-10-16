// 개발자 모드 — 설정 › 기타 설정에서 개발자 코드를 넣으면 켜지고, 켜져 있어야 티저(teaser61 · 62 · 63 · 64 · 66) 화면을 열 수 있다.
// 코드는 원문 대신 해시로만 비교한다. 정적 페이지라 진짜 보안은 아니고, 미리보기를 일반 사용자에게 숨기는 용도.
// main.html(과 그 복사본인 티저 페이지)은 <head>에서 이 파일을 먼저 읽는다 — 티저 페이지(<html data-app-mode="teaser">)는 개발자 모드가 아니면 설정 화면으로 돌려보내고,
// 본 게임은 튜토리얼의 "미리보기" 과정(1.6.1 ~ 1.6.3) 잠금을 푸는 데 HemiDev.isOn()을 쓴다.
(function () {
    'use strict';
    const KEY = 'hemicycleDevMode';
    const CODE_HASH = '22zsze7nlqm';
    const TEASERS = [
        { id: '61', file: 'teaser61.html', title: 'Teaser 1.6.1', note: '쿠데타 · 군정 · 군부 설정' },
        { id: '62', file: 'teaser62.html', title: 'Teaser 1.6.2', note: '혁명 · 당-국가 체제 · 선거인단 (+1.6.1)' },
        { id: '63', file: 'teaser63.html', title: 'Teaser 1.6.3', note: '국회공성전 — 봉쇄 돌파 · 의장석 점거 (+1.6.1 · 1.6.2)' },
        { id: '64', file: 'teaser64.html', title: 'Teaser 1.6.4', note: '세력 변화 타임라인 · 위키 틀 · 냉전 국가 순위 (+1.6.1 ~ 1.6.3)' },
        { id: '65', file: 'teaser65.html', title: 'Teaser 1.6.5', note: '왕정복고 · 전제군주정 · 왕위 계승 · 친위 쿠데타 · 공화 혁명 (+1.6.1 ~ 1.6.4)' },
        { id: '66', file: 'teaser66.html', title: 'Teaser 1.6.6', note: '미수복 지역 · 영토 통일 (+1.6.1 ~ 1.6.5)' },
        { id: '67', file: 'teaser67.html', title: 'Teaser 1.6.7', note: '국가 › 사람 — 인물 · 자리 배정 · 지역구 후보 (+1.6.1 ~ 1.6.6)' },
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

    const isOn = () => safeGet(KEY) === CODE_HASH;
    // 코드가 맞으면 켜고 true — 대소문자 · 앞뒤 공백은 따지지 않는다 (휴대폰 자동 대문자 대비)
    function unlock(code) {
        if (hash(String(code || '').trim().toLowerCase()) !== CODE_HASH) return false;
        return safeSet(KEY, CODE_HASH);
    }
    function lock() { safeDel(KEY); }

    window.HemiDev = { isOn, unlock, lock, teasers: TEASERS.slice() };

    // 티저 페이지 잠금 — 개발자 모드가 아니면 설정 › 기타 설정으로
    const root = document.documentElement;
    if (root.getAttribute('data-app-mode') === 'teaser' && !isOn()) {
        const id = root.getAttribute('data-teaser') || '66';
        root.style.visibility = 'hidden';
        location.replace('settings.html?locked=' + encodeURIComponent(id) + '#etc');
    }
})();
