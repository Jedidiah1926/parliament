// Pure challenge condition compiler, shared by the maker and SAVE SELECT.
(function(){
'use strict';
    const OPS = [['gte', '이상'], ['lte', '이하'], ['gt', '초과'], ['lt', '미만'], ['eq', '같음']];
    const ECON = [['growth', '성장률'], ['infl', '인플레이션'], ['unemp', '실업률'], ['rate', '기준금리'], ['debt', '부채비율'], ['balance', '재정수지'], ['mood', '민심']];
    const APPR = [['cabinet', '내각'], ['president', '대통령'], ['pm', '총리'], ['chair', '의장(집단지도체제)']];
    const KINDS = [
        ['ruling', '정당이 집권'], ['not_ruling', '정당이 집권하지 않음'], ['party_seats', '정당 의석'], ['party_support', '정당 지지율'],
        ['ruling_seats', '집권 세력 의석'], ['approval', '국정 지지율'], ['economy', '경제 지표'], ['date_after', '날짜가 되면'],
        ['party_status', '정당 상태'], ['flag', '플래그(이벤트 · 결정이 켬)'], ['var', '챌린지 변수'], ['custom', '직접 쓰기 (JSON)'],
    ];
    const KIND_LABEL = Object.fromEntries(KINDS);
    const partyLabel = v => ({ ruling: '집권 세력 최대 정당', largest: '하원 최대 정당', opposition: '야당 최대 정당' }[v] || v || '?');
    const opLabel = o => (OPS.find(x => x[0] === o) || ['', ''])[1];
    function toCond(kind, p) {
        p = p || {};
        const n = Number(p.n) || 0, op = p.op || 'gte';
        switch (kind) {
            case 'ruling': return { ruling: p.party || 'ruling' };
            case 'not_ruling': return { not: { ruling: p.party || '' } };
            case 'party_seats': return { party_seats: { party: p.party || 'ruling', chamber: p.chamber || 'house', ...(p.share ? { share: true } : {}), [op]: n } };
            case 'party_support': return { party_support: { party: p.party || 'ruling', [op]: n } };
            case 'ruling_seats': return { ruling_seats: { ...(p.share !== false ? { share: true } : {}), [op]: n } };
            case 'approval': return { approval: { of: p.of || 'cabinet', [op]: n } };
            case 'economy': return { economy: { indicator: p.indicator || 'growth', [op]: n } };
            case 'date_after': return { date_after: p.date || '' };
            case 'party_status': return { party_status: { party: p.party || '', is: p.is || 'banned' } };
            case 'flag': return { flag: p.flag || '' };
            case 'var': return { var: { name: p.name || '', [op]: n } };
            default: { try { return JSON.parse(p.json || '{}'); } catch (e) { return null; } }
        }
    }
    function autoText(kind, p) {
        p = p || {};
        const unit = p.share || kind === 'ruling_seats' && p.share !== false ? '%' : '석';
        switch (kind) {
            case 'ruling': return `${partyLabel(p.party)} 집권`;
            case 'not_ruling': return `${partyLabel(p.party)}이(가) 집권하지 않음`;
            case 'party_seats': return `${partyLabel(p.party)} ${p.chamber && p.chamber !== 'house' ? (p.chamber === 'senate' ? '상원 ' : '삼원 ') : ''}의석 ${p.n || 0}${unit} ${opLabel(p.op || 'gte')}`;
            case 'party_support': return `${partyLabel(p.party)} 지지율 ${p.n || 0}% ${opLabel(p.op || 'gte')}`;
            case 'ruling_seats': return `집권 세력 의석 ${p.n || 0}${p.share !== false ? '%' : '석'} ${opLabel(p.op || 'gte')}`;
            case 'approval': return `${(APPR.find(a => a[0] === (p.of || 'cabinet')) || ['', '내각'])[1]} 국정 지지율 ${p.n || 0}% ${opLabel(p.op || 'gte')}`;
            case 'economy': return `${(ECON.find(e => e[0] === (p.indicator || 'growth')) || ['', '?'])[1]} ${p.n || 0} ${opLabel(p.op || 'gte')}`;
            case 'date_after': return `${p.date || '?'}이 되면`;
            case 'party_status': return `${partyLabel(p.party)} ${{ banned: '활동 금지', dissolved: '해산', active: '활동 중' }[p.is || 'banned']}`;
            case 'flag': return `플래그 "${p.flag || '?'}"`;
            case 'var': return `변수 ${p.name || '?'} ${p.n || 0} ${opLabel(p.op || 'gte')}`;
            default: return '사용자 조건';
        }
    }

window.HemiChallengeData={OPS,ECON,APPR,KINDS,KIND_LABEL,partyLabel,opLabel,toCond,autoText,compile(source){const d=JSON.parse(JSON.stringify(source));['goals','failures'].forEach(k=>{d[k]=(d[k]||[]).map(g=>({...g,condition:g.kind?toCond(g.kind,g.p):g.condition,text:g.text||autoText(g.kind,g.p)}));});return d;}};
})();
