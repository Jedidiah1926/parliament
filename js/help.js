// ===== Hemicycle — 도움말 그룹 =====
// 메뉴 맨 아래 회색 "도움말" 묶음(의회 · 국가 · 선거 · 여론 · 내각)의 내용을 채운다.
// 각 탭이 무슨 역할을 하는지 카드로 보여주고, "열기 →"로 그 탭에 바로 간다.
// 탭 이름은 원래 버튼에서 그대로 읽어오므로 직책 이름 바꾸기(대통령 → 국왕 등)나 언어 전환도 따라간다.
(function () {
    'use strict';

    const go = (main, sub) => () => { if (typeof switchSubTab === 'function') switchSubTab(main, sub); };
    const goElec = sub => () => {
        if (typeof switchMainTab === 'function') switchMainTab('election');
        if (typeof elecSwitchSub === 'function') elecSwitchSub(sub);
    };
    // 시각(오른쪽 화면) 탭 열기
    const disp = (tab, before) => () => {
        if (before) before();
        if (typeof switchDispTab === 'function') switchDispTab(tab);
    };

    // btn: 원래 탭 버튼 id (이름·숨김 여부를 여기서 읽음) — 없으면 title을 그대로 씀
    // suffix: 이름 뒤에 붙일 설명, inner: [안쪽 탭 이름, 설명], open: "열기 →"로 할 일 (없으면 버튼 숨김)
    // path: 카드 머리의 위치 표시 (없으면 페이지의 path, 그것도 없으면 메뉴 묶음 이름)
    // hiddenNote: 원래 탭이 지금 숨겨져 있을 때 붙일 안내, openWhenHidden: 숨겨져 있어도 "열기"로 나타나게 할 수 있음
    const PAGES = {
        setup: {
            intro: i18n('sim.help.1'),
            tabs: [
                {
                    btn: 'subTabAssembly', open: go('setup', 'assembly'),
                    desc: i18n('sim.help.2'),
                },
                {
                    btn: 'subTabIdeology', open: go('setup', 'ideology'),
                    desc: i18n('sim.help.3'),
                    inner: [[i18n('sim.help.4'), i18n('sim.help.5')]],
                },
                {
                    btn: 'subTabParty', open: go('setup', 'party'),
                    desc: i18n('sim.help.6'),
                    inner: [
                        [i18n('sim.contentParty.1'), i18n('sim.help.7')],
                        [i18n('sim.contentParty.2'), i18n('sim.help.8')],
                        [i18n('sim.contentParty.3'), i18n('sim.help.9')],
                    ],
                },
                {
                    btn: 'subTabSettings', open: go('setup', 'settings'),
                    desc: i18n('sim.help.10'),
                    inner: [[i18n('sim.help.11'), i18n('sim.help.12')]],
                },
                {
                    btn: 'subTabCoalition', open: go('setup', 'coalition'),
                    desc: i18n('sim.help.13'),
                    inner: [[i18n('sim.help.14'), i18n('sim.help.15')]],
                },
                {
                    btn: 'subTabMembers', open: go('setup', 'members'),
                    desc: i18n('sim.help.16'),
                },
                {
                    btn: 'subTabList', open: go('setup', 'list'),
                    desc: i18n('sim.help.17'),
                },
                {
                    btn: 'subTabTimeline', open: go('setup', 'timeline'),
                    desc: i18n('sim.help.18'),
                    inner: [[i18n('sim.help.19'), i18n('sim.help.20')]],
                },
                {
                    btn: 'subTabWikibox', open: go('setup', 'wikibox'),
                    desc: i18n('sim.help.21'),
                },
            ],
        },
        law: {
            intro: i18n('sim.help.22'),
            tabs: [
                {
                    btn: 'subTabBill', open: go('law', 'bill'),
                    desc: i18n('sim.help.23'),
                    inner: [[i18n('sim.contentBill.3'), i18n('sim.help.24')]],
                },
                {
                    btn: 'subTabCommittee', open: go('law', 'committee'),
                    desc: i18n('sim.help.25'),
                    inner: [
                        [i18n('sim.help.26'), i18n('sim.help.27')],
                        [i18n('sim.legis.57'), i18n('sim.help.28')],
                        [i18n('sim.legis.61'), i18n('sim.help.29')],
                    ],
                },
                {
                    btn: 'subTabTable', open: go('law', 'table'),
                    desc: i18n('sim.help.30'),
                },
                {
                    btn: 'subTabVote', open: go('law', 'vote'),
                    desc: i18n('sim.help.31'),
                },
                {
                    btn: 'subTabSiege', open: go('law', 'siege'),
                    desc: i18n('sim.help.32'),
                    inner: [
                        [i18n('sim.siege.14'), i18n('sim.help.33')],
                        [i18n('sim.help.34'), i18n('sim.help.35')],
                    ],
                },
                {
                    btn: 'subTabArchive', open: go('law', 'archive'),
                    desc: i18n('sim.help.36'),
                },
                {
                    btn: 'subTabLawbook', open: go('law', 'lawbook'),
                    desc: i18n('sim.help.37'),
                },
                {
                    btn: 'subTabConstitution', open: go('law', 'constitution'),
                    desc: i18n('sim.help.38'),
                },
            ],
        },
        nation: {
            intro: i18n('sim.help.39'),
            tabs: [
                {
                    btn: 'subTabSymbol', open: go('nation', 'symbol'),
                    desc: i18n('sim.help.40'),
                },
                {
                    btn: 'subTabTerritory', open: go('nation', 'territory'),
                    desc: i18n('sim.help.41'),
                },
                {
                    btn: 'subTabRegions', open: go('nation', 'regions'),
                    desc: i18n('sim.help.42'),
                },
                {
                    btn: 'subTabPeople', open: go('nation', 'people'),
                    desc: i18n('sim.help.43'),
                    inner: [
                        [i18n('sim.help.44'), i18n('sim.help.45')],
                        [i18n('sim.help.46'), i18n('sim.help.47')],
                        [i18n('sim.help.48'), i18n('sim.help.49')],
                    ],
                },
                {
                    btn: 'subTabUnrecovered', open: go('nation', 'unrecovered'),
                    desc: i18n('sim.help.50'),
                    inner: [
                        [i18n('sim.help.51'), i18n('sim.help.52')],
                        [i18n('sim.help.53'), i18n('sim.help.54')],
                    ],
                },
                {
                    btn: 'subTabVassals', open: go('nation', 'vassals'),
                    desc: i18n('sim.help.55'),
                    inner: [
                        [i18n('sim.help.56'), i18n('sim.help.57')],
                        [i18n('sim.help.58'), i18n('sim.help.59')],
                        [i18n('sim.help.60'), i18n('sim.help.61')],
                    ],
                },
                {
                    btn: 'subTabDecisions', open: go('nation', 'decisions'),
                    desc: i18n('sim.help.62'),
                    inner: [
                        [i18n('sim.help.63'), i18n('sim.help.64')],
                        [i18n('sim.help.65'), i18n('sim.help.66')],
                    ],
                },
                {
                    btn: 'dispDateSettingsBtn', title: i18n('sim.main.1'), open: () => { if(typeof openDatePanel === 'function') openDatePanel(); },
                    path: i18n('sim.mainContentHelp.9'),
                    desc: i18n('sim.help.67'),
                },
                {
                    btn: 'subTabNationSettings', open: go('nation', 'nationSettings'),
                    desc: i18n('sim.help.68'),
                },
                {
                    btn: 'saveTabSaveBtn', title: i18n('sim.main.3'), open: () => { if(typeof openSavePanel === 'function') openSavePanel(); },
                    path: i18n('sim.help.69'),
                    desc: i18n('sim.help.70'),
                },
            ],
        },
        vote: {
            intro: i18n('sim.help.71'),
            tabs: [
                {
                    btn: 'subTabElecPresidential', open: go('vote', 'elecPresidential'),
                    desc: i18n('sim.help.72'),
                },
                {
                    btn: 'subTabElecGeneral', open: go('vote', 'elecGeneral'),
                    desc: i18n('sim.help.73'),
                },
                {
                    btn: 'subTabElecSettings', open: go('vote', 'elecSettings'),
                    desc: i18n('sim.help.74'),
                },
                {
                    btn: 'subTabElecCandidates', open: go('vote', 'elecCandidates'),
                    desc: i18n('sim.help.75'),
                    inner: [
                        [i18n('sim.union.25'), i18n('sim.help.76')],
                        [i18n('sim.union.27'), i18n('sim.help.77')],
                    ],
                },
                {
                    btn: 'subTabElecLocal', open: go('vote', 'elecLocal'),
                    desc: i18n('sim.help.78'),
                    inner: [
                        [i18n('sim.help.79'), i18n('sim.help.80')],
                    ],
                },
                {
                    btn: 'subTabReferendum', open: go('vote', 'referendum'),
                    desc: i18n('sim.help.81'),
                },
                {
                    btn: 'subTabElecRecord', open: go('vote', 'elecRecord'),
                    desc: i18n('sim.help.82'),
                },
                {
                    btn: 'subTabFraud', open: go('vote', 'fraud'), suffix: (" " + i18n('sim.help.83')),
                    desc: i18n('sim.help.84'),
                    inner: [[i18n('sim.help.85'), i18n('sim.help.86')]],
                },
            ],
        },
        election: {
            intro: i18n('sim.help.87'),
            tabs: [
                {
                    btn: 'elecSubTabOverview', open: goElec('overview'),
                    desc: i18n('sim.help.88'),
                },
                {
                    btn: 'elecSubTabTendency', open: goElec('tendency'),
                    desc: i18n('sim.help.89'),
                    inner: [[i18n('sim.district.49'), i18n('sim.help.90')]],
                },
                {
                    btn: 'elecSubTabMtendency', open: goElec('mtendency'),
                    desc: i18n('sim.help.91'),
                },
                {
                    btn: 'elecSubTabMprob', open: goElec('mprob'),
                    desc: i18n('sim.help.92'),
                },
                {
                    title: i18n('sim.help.93'),
                    desc: i18n('sim.help.94'),
                },
                {
                    btn: 'elecSubTabProb', open: goElec('prob'),
                    desc: i18n('sim.help.95'),
                    inner: [
                        [i18n('sim.district.66'), (i18n('sim.help.96') + "\n")
                            + (i18n('sim.help.97') + "\n")
                            + (i18n('sim.help.98') + "\n")
                            + (i18n('sim.help.99') + "\n")
                            + i18n('sim.help.100')],
                        [i18n('sim.district.88'), i18n('sim.help.101')],
                        [i18n('sim.district.95'), i18n('sim.help.102')],
                    ],
                },
            ],
        },
        cabinet: {
            intro: i18n('sim.help.103'),
            tabs: [
                {
                    btn: 'subTabSystem', open: go('cabinet', 'system'),
                    desc: i18n('sim.help.104'),
                },
                {
                    btn: 'subTabPresident', open: go('cabinet', 'president'),
                    desc: i18n('sim.help.105'),
                },
                {
                    btn: 'subTabPm', open: go('cabinet', 'pm'),
                    desc: i18n('sim.help.106'),
                },
                {
                    btn: 'subTabCabinetmembers', open: go('cabinet', 'cabinetmembers'),
                    desc: i18n('sim.help.107'),
                },
                {
                    btn: 'subTabMilitary', open: go('cabinet', 'military'),
                    desc: i18n('sim.help.108'),
                },
                {
                    btn: 'subTabCoup', open: go('cabinet', 'coup'),
                    desc: i18n('sim.help.109'),
                    inner: [
                        [i18n('sim.help.110'), i18n('sim.help.111')],
                        [i18n('sim.help.112'), i18n('sim.help.113')],
                        [i18n('sim.coup.87'), i18n('sim.help.114')],
                    ],
                },
                {
                    btn: 'subTabRevolution', open: go('cabinet', 'revolution'),
                    desc: i18n('sim.help.115'),
                    inner: [
                        [i18n('sim.revolution.59'), i18n('sim.help.116')],
                        [i18n('sim.revolution.60'), i18n('sim.help.117')],
                        [i18n('sim.revolution.48'), i18n('sim.help.118')],
                        [i18n('sim.revolution.83'), i18n('sim.help.119')],
                    ],
                },
                {
                    btn: 'subTabRoyal', open: go('cabinet', 'royal'),
                    desc: i18n('sim.help.120'),
                    inner: [
                        [i18n('sim.help.121'), i18n('sim.help.122')],
                        [i18n('sim.help.123'), i18n('sim.help.124')],
                    ],
                },
                {
                    btn: 'subTabSign', open: go('cabinet', 'sign'),
                    desc: i18n('sim.help.125'),
                },
                {
                    btn: 'subTabCouncil', open: go('cabinet', 'council'),
                    desc: i18n('sim.help.126'),
                },
                {
                    btn: 'subTabCouncilArchive', open: go('cabinet', 'councilArchive'),
                    desc: i18n('sim.help.127'),
                },
            ],
        },
        economy: {
            intro: i18n('sim.help.128'),
            tabs: [
                { btn: 'subTabEcoOverview', open: go('economy', 'overview'), desc: i18n('sim.help.129') },
                { btn: 'subTabEcoAnalysis', open: go('economy', 'analysis'), desc: i18n('sim.help.130') },
                { btn: 'subTabEcoMonetary', open: go('economy', 'monetary'), desc: i18n('sim.help.131') },
                { btn: 'subTabEcoFiscal', open: go('economy', 'fiscal'), desc: i18n('sim.help.132') },
                { btn: 'subTabEcoRegion', open: go('economy', 'region'), desc: i18n('sim.help.133') },
                { btn: 'subTabEcoScenario', open: go('economy', 'scenario'), desc: i18n('sim.help.134') },
                { btn: 'subTabEcoEvents', open: go('economy', 'events'), desc: i18n('sim.help.135') },
                { btn: 'subTabEcoItems', open: go('economy', 'items'), desc: i18n('sim.help.136') },
            ],
        },
        world: {
            intro: i18n('sim.help.137'),
            tabs: [
                {
                    btn: 'subTabWorldmap', open: go('world', 'worldmap'),
                    desc: i18n('sim.help.138'),
                },
                {
                    btn: 'subTabRanking', open: go('world', 'ranking'),
                    desc: i18n('sim.help.139'),
                },
                {
                    btn: 'subTabBlocs', open: go('world', 'blocs'),
                    desc: i18n('sim.help.140'),
                },
                {
                    btn: 'subTabEconblocs', open: go('world', 'econblocs'),
                    desc: i18n('sim.help.141'),
                },
            ],
        },
        layout: {
            intro: i18n('sim.help.142'),
            tabs: [
                {
                    path: i18n('sim.help.69'), title: i18n('sim.help.143'),
                    desc: i18n('sim.help.144'),
                },
                {
                    path: i18n('sim.help.69'), title: i18n('sim.help.145'),
                    desc: i18n('sim.help.146'),
                    inner: [
                        ['●', i18n('sim.help.147')],
                        [i18n('sim.help.148'), i18n('sim.help.149')],
                        ['×', i18n('sim.help.150')],
                    ],
                },
                {
                    path: i18n('sim.help.69'), title: i18n('sim.contentSave.10'),
                    desc: i18n('sim.help.151'),
                    inner: [
                        [i18n('sim.help.152'), i18n('sim.help.153')],
                        [i18n('sim.help.154'), i18n('sim.help.155')],
                        [i18n('sim.help.156'), i18n('sim.help.157')],
                    ],
                },
                {
                    path: i18n('sim.help.69'), title: i18n('sim.help.158'),
                    desc: i18n('sim.help.159'),
                },
                {
                    path: i18n('sim.help.160'), title: i18n('sim.help.161'),
                    desc: i18n('sim.help.162'),
                },
                {
                    path: i18n('sim.help.160'), title: i18n('sim.help.163'),
                    desc: i18n('sim.help.164'),
                },
                {
                    path: i18n('sim.help.165'), title: i18n('sim.help.166'),
                    desc: i18n('sim.help.167'),
                },
                {
                    path: i18n('sim.help.168'), title: i18n('sim.help.169'),
                    desc: i18n('sim.help.170'),
                    inner: [
                        ['Enter', i18n('sim.help.171')],
                        ['Ctrl+S', i18n('sim.help.172')],
                        ['Ctrl+Z', i18n('sim.help.173')],
                        ['Esc', i18n('sim.help.174')],
                    ],
                },
                {
                    path: i18n('sim.help.175'), title: i18n('sim.help.176'),
                    desc: i18n('sim.help.177'),
                },
            ],
        },
        visual: {
            intro: i18n('sim.help.178'),
            path: i18n('sim.mainContentHelp.9'),
            tabs: [
                {
                    btn: 'dispTabHouse', open: disp('house'),
                    desc: i18n('sim.help.179'),
                },
                {
                    btn: 'dispTabSenate', open: disp('senate'), hiddenNote: i18n('sim.help.180'),
                    desc: i18n('sim.help.181'),
                },
                {
                    btn: 'dispTabThird', open: disp('third'), hiddenNote: i18n('sim.help.182'),
                    desc: i18n('sim.help.183'),
                },
                {
                    btn: 'dispTabCabinet', open: disp('cabinet'),
                    desc: i18n('sim.help.184'),
                },
                {
                    btn: 'dispTabDistrict', open: go('nation', 'territory'), openWhenHidden: true,
                    desc: i18n('sim.help.185'),
                },
                {
                    btn: 'dispTabTendency', open: goElec('tendency'), openWhenHidden: true,
                    desc: i18n('sim.help.186'),
                },
                {
                    btn: 'dispTabRegion', open: go('nation', 'regions'), openWhenHidden: true,
                    desc: i18n('sim.help.187'),
                },
                {
                    btn: 'dispTabTimeline', open: go('setup', 'timeline'),
                    desc: i18n('sim.help.188'),
                },
                {
                    btn: 'dispTabWiki', open: go('setup', 'wikibox'),
                    desc: i18n('sim.help.189'),
                },
                {
                    btn: 'dispTabRanking', open: go('world', 'ranking'),
                    desc: i18n('sim.help.190'),
                },
                {
                    btn: 'dispTabElecResultHouse', title: i18n('sim.help.191'), open: disp('elecResultHouse'), hiddenNote: i18n('sim.help.192'),
                    desc: i18n('sim.help.193'),
                },
                {
                    title: i18n('sim.help.194'), open: () => { if(typeof openDatePanel === 'function') openDatePanel(); },
                    desc: i18n('sim.help.195'),
                },
                {
                    title: i18n('sim.help.196'),
                    desc: i18n('sim.help.197'),
                },
            ],
        },
    };

    const isHidden = el => !el || el.hidden || getComputedStyle(el).display === 'none';
    const groupLabel = key => {
        const b = document.getElementById('mainTab' + key.charAt(0).toUpperCase() + key.slice(1));
        return b ? b.textContent.replace(/\s+/g, ' ').trim() : key;
    };

    function render(key) {
        const host = document.querySelector(`.help-page[data-help="${key}"]`);
        const page = PAGES[key];
        if (!host || !page) return;
        host.innerHTML = '';
        const intro = document.createElement('p');
        intro.className = 'help-intro';
        intro.textContent = page.intro;
        host.appendChild(intro);
        page.tabs.forEach(tab => {
            const src = tab.btn ? document.getElementById(tab.btn) : null;
            const hidden = !!tab.btn && isHidden(src);
            const card = document.createElement('div');
            card.className = 'help-card' + (hidden && !tab.openWhenHidden ? ' is-hidden' : '');
            card.innerHTML = `
                <div class="help-card-head">
                    <span class="help-card-path"></span>
                    <span class="help-card-title"></span>
                    <button type="button" class="help-open">${escapeHtmlText(i18n('sim.help.198'))}</button>
                </div>
                <p class="help-desc"></p>`;
            card.querySelector('.help-card-path').textContent = (tab.path || page.path || groupLabel(key).replace(/^\S+\s+/, '')) + ' ›';
            const srcLabel = src ? (src.querySelector('.disp-tab-label') || src).textContent.trim() : '';
            // suffix는 이름이 기호뿐일 때만 (⚠ → "⚠ (부정선거)", 잠금을 풀어 "부정선거"가 되면 붙이지 않음)
            card.querySelector('.help-card-title').textContent = (tab.title || srcLabel || tab.btn) + (tab.suffix && !/[\p{L}]/u.test(srcLabel || '') ? tab.suffix : '');
            card.querySelector('.help-desc').textContent = tab.desc + (hidden && !tab.openWhenHidden ? ` (${tab.hiddenNote || i18n('sim.help.199')})` : '');
            const openBtn = card.querySelector('.help-open');
            if (!tab.open) openBtn.style.display = 'none';
            openBtn.disabled = hidden && !tab.openWhenHidden;
            openBtn.addEventListener('click', () => {
                if (!tab.open) return;
                tab.open();
                window.scrollTo({ top: 0 });
            });
            if (tab.inner && tab.inner.length) {
                const dl = document.createElement('dl');
                dl.className = 'help-inner';
                tab.inner.forEach(([name, text]) => {
                    const dt = document.createElement('dt'); dt.textContent = name;
                    const dd = document.createElement('dd'); dd.textContent = text; dd.style.whiteSpace = 'pre-line'; // 수식처럼 줄을 나눈 설명
                    dl.append(dt, dd);
                });
                card.appendChild(dl);
            }
            host.appendChild(card);
        });
    }

    function renderActive() {
        const active = document.querySelector('.help-page.active');
        if (active) render(active.dataset.help);
    }

    function init() {
        const pages = document.querySelectorAll('.help-page');
        if (!pages.length) return;
        Object.keys(PAGES).forEach(render);
        // 도움말 페이지가 열릴 때마다 다시 그려 탭 이름(직책 이름 바꾸기 · 언어 전환)과 숨김 상태를 따라간다
        const mo = new MutationObserver(renderActive);
        pages.forEach(p => mo.observe(p, { attributes: true, attributeFilter: ['class'] }));
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();

    window.HemiHelp = { render, pages: Object.keys(PAGES) };
})();
