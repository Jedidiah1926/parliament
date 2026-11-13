// 첫 예제 "국경 협정" (docs/design/SCENARIO_WORLD_INTEGRATION.md 10장) — 시험과 예제 파일(examples/)이 함께 쓰는 원본.
//   예제 파일(docs/example-scenario/)은 tests/fixtures/build-border-example.cjs 가 실제 게임 · 제작기를 거쳐 만든다
const rect = (key, x) => ({ key, tag: 'rect', attrs: { x: String(x), y: '10', width: '80', height: '80' } });
// 세 구역짜리 작은 지도 (.hemimap과 같은 형식)
const map = () => ({ format: 'hemicycle-districts', version: 1, meta: { name: '국경 지대' },
    district: { mapMode: 'svg', names: { house: { capital: '수도', riverbank: '강변', island: '섬' } }, svgMap: { viewBox: '0 0 300 100', shapes: [rect('capital', 10), rect('riverbank', 110), rect('island', 210)] } } });
const countries = () => [{ id: 'w_republic', name: '공화국', flag: '🏳', self: true }, { id: 'w_federation', name: '연방', flag: '🏴', self: false }];
// 시작 세이브에 들어가는 세계지도 · 국가 순위 조각 — 수도는 공화국, 강변 · 섬은 연방
const worldMap = () => ({ preset: map(), owners: { capital: 'w_republic', riverbank: 'w_federation', island: 'w_federation' }, colors: { w_republic: '#437fa2', w_federation: '#c34e4e' }, countries: countries() });
const ranking = () => ({ title: '국가 순위', rows: countries().map((c, i) => ({ ...c, bloc: '', ideo: '', score: 100 - i * 10, prevRank: null })) });
// 검사기용 최소 시작 세이브 (게임에서는 실제 세이브 상태에 worldMap · history.ranking을 넣어 쓴다)
const startState = () => ({ parliament: { parties: [] }, worldMap: worldMap(), history: { ranking: ranking() } });
const rep = () => ({ key: 'republic' }); // 쓰는 곳마다 새 객체 — 한 곳을 고쳐도 다른 곳이 따라 바뀌지 않게
function scenario(mode = 'turn') {
    const f = (id, title, icon, x, y, extra = {}) => ({ id, title, icon, x, y, days: 2, desc: '', prereq: [], any: [], exclusive: [], effects: [], ...extra });
    return {
        format: 'hemicycle-campaign@1', id: 'border_agreement', title: '국경 협정', author: 'Hemicycle', version: '1.0',
        description: '강변을 둘러싼 협상 — 협정을 받아들이면 지도가 바뀌고, 바뀐 국경이 다음 이야기를 엽니다.',
        lore: '공화국과 연방은 오랫동안 강변을 두고 맞서 왔습니다.\n\n협상을 열면 연방이 협정안을 내놓습니다. 받아들일지는 당신의 선택입니다.',
        world: { countries: [{ key: 'republic', name: '공화국' }, { key: 'federation', name: '연방' }] },
        starts: [{ id: 's1', name: '공화국', kind: 'save', desc: '수도만 가진 공화국에서 시작합니다.', worldBindings: { republic: 'w_republic', federation: 'w_federation' }, state: startState() }],
        time: { mode, startDate: '1990-01-01', startHour: 0, defaultSpeed: 1 },
        variables: {},
        focus: [
            f('open_talks', '국경 협상 개시', '🤝', 2, 0, { desc: '연방과 협상 자리를 엽니다. 이틀 뒤 협정안이 도착합니다.', event: 'border_talks' }),
            f('integrate_riverbank', '강변 통합', '🌉', 0, 1, { prereq: ['open_talks'], exclusive: ['fortify_border'], desc: '새로 얻은 강변을 공화국에 통합합니다.', days: 1,
                available: { all: [{ flag: 'border_agreement_accepted' }, { owns_regions: { country: rep(), regions: ['riverbank'] } }] } }),
            f('fortify_border', '국경 요새화', '🛡', 4, 1, { prereq: ['open_talks'], exclusive: ['integrate_riverbank'], desc: '협정을 거절하고 옛 국경을 지킵니다.', days: 1, available: { flag: 'border_agreement_rejected' } }),
        ],
        articles: [{ id: 'new_border_news', title: '강변, 공화국 품으로', subtitle: '협정 발효 — 국경선이 다시 그려졌다', source: '공화국 통신', when: 'condition',
            trigger: { all: [{ flag: 'border_agreement_accepted' }, { owns_regions: { country: rep(), regions: ['riverbank'] } }] },
            body: '협정에 따라 강변이 공화국의 영토가 되었습니다.\n\n수도와 섬의 경계는 그대로입니다.' }],
        events: [
            { id: 'border_talks', title: '국경 협상', desc: '연방 대표단이 협정안을 내밀었습니다. 강변을 넘기는 대신 오랜 분쟁을 끝내자는 제안입니다.', presentation: 'narrative', trigger_only: true,
                options: [
                    { text: '협정을 수락한다', effects: [{ transfer_regions: { regions: ['riverbank'], to: rep() } }, { set_flag: 'border_agreement_accepted' }] },
                    { text: '협정을 거절한다', effects: [{ set_flag: 'border_agreement_rejected' }] },
                ] },
            { id: 'border_news_event', title: '새로운 국경', desc: '지도 위의 선이 바뀌었습니다. 강변에 공화국의 깃발이 올랐습니다.', presentation: 'narrative', check: 'world',
                trigger: { owns_regions: { country: rep(), regions: ['riverbank'] } }, options: [{ text: '변화를 지켜보자', effects: [] }] },
        ],
        decisions: [], crises: [],
        endings: [
            { id: 'peace', title: '강 건너의 평화', text: '강변은 공화국의 땅이 되었고, 두 나라는 새 국경을 받아들였습니다.', condition: { flag: 'focus_integrate_riverbank' } },
            { id: 'standoff', title: '지켜 낸 옛 국경', text: '협정은 없었습니다. 국경은 그대로지만 긴장도 그대로입니다.', condition: { flag: 'focus_fortify_border' } },
        ],
    };
}
module.exports = { map, countries, worldMap, ranking, startState, scenario };
