// Pure challenge condition compiler, shared by the maker and SAVE SELECT.
(function(){
'use strict';
    const OPS = [['gte', i18n('maker.challengeData.1')], ['lte', i18n('maker.challengeData.2')], ['gt', i18n('maker.challengeData.3')], ['lt', i18n('maker.challengeData.4')], ['eq', i18n('maker.challengeData.5')]];
    const ECON = [['growth', i18n('maker.challengeData.6')], ['infl', i18n('maker.challengeData.7')], ['unemp', i18n('maker.challengeData.8')], ['rate', i18n('maker.challengeData.9')], ['debt', i18n('maker.challengeData.10')], ['balance', i18n('maker.challengeData.11')], ['mood', i18n('maker.challengeData.12')]];
    const APPR = [['cabinet', i18n('sim.contentSystem.9')], ['president', i18n('sim.mainContentCabinet.2')], ['pm', i18n('sim.mainContentCabinet.3')], ['chair', i18n('maker.challengeData.13')]];
    const KINDS = [
        ['ruling', i18n('maker.challengeData.14')], ['not_ruling', i18n('maker.challengeData.15')], ['party_seats', i18n('maker.challengeData.16')], ['party_support', i18n('sim.news.grpParty')],
        ['ruling_seats', i18n('maker.challengeData.17')], ['approval', i18n('sim.news.11')], ['economy', i18n('maker.challengeData.18')], ['date_after', i18n('maker.challengeData.19')],
        ['party_status', i18n('maker.challengeData.20')], ['flag', i18n('maker.challengeData.21')], ['var', i18n('maker.challengeData.22')], ['custom', i18n('maker.challengeData.23')],
    ];
    const KIND_LABEL = Object.fromEntries(KINDS);
    const partyLabel = v => ({ ruling: i18n('maker.challengeData.24'), largest: i18n('maker.challengeData.25'), opposition: i18n('maker.challengeData.26') }[v] || v || '?');
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
        const unit = p.share || kind === 'ruling_seats' && p.share !== false ? '%' : i18n('sim.party.11');
        switch (kind) {
            case 'ruling': return i18n('maker.challengeData.27', { party: partyLabel(p.party) });
            case 'not_ruling': return i18n('maker.challengeData.28', { party: partyLabel(p.party) });
            case 'party_seats': return i18n('maker.challengeData.29', { party: partyLabel(p.party), senate: p.chamber && p.chamber !== 'house' ? (p.chamber === 'senate' ? (i18n('sim.contentSettings.6') + " ") : (i18n('sim.contentSettings.7') + " ")) : '', v: p.n || 0, unit, gte: opLabel(p.op || 'gte') });
            case 'party_support': return i18n('maker.challengeData.30', { party: partyLabel(p.party), v: p.n || 0, gte: opLabel(p.op || 'gte') });
            case 'ruling_seats': return i18n('maker.challengeData.31', { v: p.n || 0, share: p.share !== false ? '%' : i18n('sim.party.11'), gte: opLabel(p.op || 'gte') });
            case 'approval': return i18n('maker.challengeData.32', { cabinet: (APPR.find(a => a[0] === (p.of || 'cabinet')) || ['', i18n('sim.contentSystem.9')])[1], v: p.n || 0, gte: opLabel(p.op || 'gte') });
            case 'economy': return `${(ECON.find(e => e[0] === (p.indicator || 'growth')) || ['', '?'])[1]} ${p.n || 0} ${opLabel(p.op || 'gte')}`;
            case 'date_after': return i18n('maker.challengeData.33', { date: p.date || '?' });
            case 'party_status': return `${partyLabel(p.party)} ${{ banned: i18n('sim.vote.32'), dissolved: i18n('sim.export.3'), active: i18n('maker.challengeData.34') }[p.is || 'banned']}`;
            case 'flag': return i18n('maker.challengeData.35', { flag: p.flag || '?' });
            case 'var': return i18n('maker.challengeData.36', { name: p.name || '?', v: p.n || 0, gte: opLabel(p.op || 'gte') });
            default: return i18n('maker.challengeData.37');
        }
    }

window.HemiChallengeData={OPS,ECON,APPR,KINDS,KIND_LABEL,partyLabel,opLabel,toCond,autoText,compile(source){const d=JSON.parse(JSON.stringify(source));['goals','failures'].forEach(k=>{d[k]=(d[k]||[]).map(g=>({...g,condition:g.kind?toCond(g.kind,g.p):g.condition,text:g.text||autoText(g.kind,g.p)}));});return d;}};
})();
