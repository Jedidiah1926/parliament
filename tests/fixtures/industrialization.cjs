// 통합 예제 "산업화와 국경 위기" (docs/design/SCENARIO_MAKER_EXPANSION.md 5장) — 방향성 → 기술 연구 → 투자 결정 → 자원 생산 → 무역 → 군사력 → 협상/결말.
// 시험(tests/ops-scenario.browser.cjs)과 예제 파일(docs/example-scenario/industrialization.hemicmp)이 같은 원본을 쓴다.
function scenario(mode = 'turn') {
    const f = (id, title, icon, x, y, extra = {}) => ({ id, title, icon, x, y, days: 1, desc: '', prereq: [], any: [], exclusive: [], effects: [], ...extra });
    return {
        format: 'hemicycle-campaign@1', id: 'industrialization', title: '산업화와 국경 위기', author: 'Hemicycle', version: '1.0',
        description: '탄광과 제철소를 세우고, 철강을 팔아 군대를 기르세요. 국경의 긴장은 힘의 균형에 달려 있습니다.',
        lore: '농업국 공화국은 이웃 연방의 압박 속에 산업화를 결심했습니다.\n\n국고는 넉넉하지 않습니다. 무엇을 먼저 세우고 무엇을 팔지 정하세요.',
        playRules: { locks: { parties: true, seats: true } },
        world: { countries: [{ key: 'federation', name: '연방' }] },
        starts: [{ id: 's1', name: '공화국', kind: 'preset', preset: 'builtin:tutorial', desc: '작은 농업국에서 시작합니다.' }],
        time: { mode, startDate: '1890-01-01', startHour: 0, defaultSpeed: 1 },
        variables: {},
        resources: [
            { id: 'money', name: '국고', icon: '💰', unit: '만', start: 120 },
            { id: 'coal', name: '석탄', icon: '⚫', unit: 't', start: 20, max: 300 },
            { id: 'iron', name: '철광석', icon: '🪨', unit: 't', start: 10, max: 300 },
            { id: 'steel', name: '철강', icon: '🔩', unit: 't', start: 0, max: 200 },
            { id: 'food', name: '식량', icon: '🌾', unit: 't', start: 60, max: 200 },
        ],
        buildSlots: 1, recruitSlots: 1,
        facilities: [
            { id: 'farm', name: '농장', icon: '🌾', produce: { food: 5 }, start: 2, buildable: false },
            { id: 'mine', name: '탄광', icon: '⛏', desc: '석탄을 캡니다.', cost: { money: 40 }, days: 2, produce: { coal: 6 }, upkeep: { money: 1 }, start: 1 },
            { id: 'iron_mine', name: '철광산', icon: '🪨', cost: { money: 40 }, days: 2, produce: { iron: 4 }, upkeep: { money: 1 } },
            { id: 'steel_mill', name: '제철소', icon: '🏭', desc: '석탄과 철광석으로 철강을 만듭니다.', cost: { money: 60, coal: 10 }, days: 3, consume: { coal: 4, iron: 2 }, produce: { steel: 2 }, requires: ['bessemer'], max: 3 },
        ],
        tech: [
            { id: 'bessemer', title: '베세머 공법', icon: '🔥', x: 2, y: 0, days: 3, cost: { money: 30 }, desc: '값싼 철강을 만드는 길' },
            { id: 'rail', title: '철도', icon: '🚂', x: 0, y: 1, prereq: ['bessemer'], days: 2, cost: { steel: 4 }, effects: [{ add_resource: { id: 'money', value: 40 } }] },
            { id: 'rifling', title: '강선 포', icon: '🎯', x: 4, y: 1, prereq: ['bessemer'], days: 2, cost: { steel: 4 } },
        ],
        units: [
            { id: 'infantry', name: '보병 사단', icon: '🪖', branch: '육군', cost: { money: 15, food: 10 }, days: 2, upkeep: { food: 2 }, strength: 3, start: 2 },
            { id: 'artillery', name: '포병 여단', icon: '💥', branch: '육군', cost: { money: 20, steel: 6 }, days: 3, upkeep: { food: 1, money: 1 }, strength: 8, requires: ['rifling'] },
        ],
        trades: [
            { id: 'steel_export', title: '철강 수출', partner: 'federation', desc: '연방이 철강을 삽니다.', give: { steel: 2 }, get: { money: 12 }, days: 10 },
            { id: 'grain_import', title: '곡물 수입', partner: 'federation', give: { money: 4 }, get: { food: 6 }, repeat: true },
        ],
        focus: [
            f('industrialize', '산업화 선언', '🏭', 2, 0, { desc: '국고를 모아 산업화를 시작합니다.', effects: [{ add_resource: { id: 'money', value: 30 } }] }),
            f('defense_plan', '국경 방위 계획', '🛡', 2, 1, { prereq: ['industrialize'], days: 2, available: { military_strength: { gte: 20 } }, desc: '전력 20 이상이 필요합니다.', event: 'border_crisis' }),
        ],
        decisions: [
            { id: 'invest', title: '산업 투자', desc: '국고로 탄광을 하나 더 짓습니다.', cost: { money: 50 }, cooldown_days: 3, effects: [{ add_facility: { id: 'mine', count: 1 } }] },
            { id: 'mobilize', title: '총동원', desc: '식량을 풀어 보병 2개 사단을 편성합니다.', cost: { food: 30 }, once: true, available: { flag: 'focus_industrialize' }, effects: [{ add_units: { id: 'infantry', count: 2 } }] },
        ],
        articles: [{ id: 'steel_news', title: '첫 철강 생산', subtitle: '제철소의 불이 켜졌다', source: '공화국 통신', when: 'condition', trigger: { resource: { id: 'steel', gte: 2 } }, body: '공화국 최초의 제철소에서 철강이 나왔습니다.' }],
        events: [{ id: 'border_crisis', title: '국경 위기', desc: '연방군이 국경에 집결했습니다. 우리의 군대는 준비되어 있습니다.', presentation: 'narrative', trigger_only: true,
            options: [{ text: '협상 테이블로', trigger: { tech_done: 'rail' }, effects: [{ set_flag: 'talks_peace' }, { end_trade: 'steel_export' }] }, { text: '대치한다', effects: [{ set_flag: 'talks_standoff' }] }] }],
        crises: [],
        endings: [
            { id: 'peace', title: '철도 위의 평화', text: '철도로 이어진 두 나라는 협상으로 국경을 지켰습니다.', condition: { flag: 'talks_peace' } },
            { id: 'standoff', title: '무장한 평화', text: '포성은 없었지만, 국경의 긴장은 계속됩니다.', condition: { flag: 'talks_standoff' } },
        ],
    };
}
module.exports = { scenario };
