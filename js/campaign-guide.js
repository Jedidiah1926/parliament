// Form authoring for the existing script JSON, with lossless fallback for custom logic.
(function () {
    'use strict';
    const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const select = (key, opts, value) => `<select class="scn-in" data-gf="${key}" aria-label="${key}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${String(value) === v ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`;
    const input = (key, value, label, type = 'text') => `<label class="cpg-field"><span>${label}</span><input class="scn-in" data-gf="${key}" type="${type}" value="${esc(value)}"></label>`;
    const CONDITIONS = [['flag','플래그가 켜짐'],['not_flag','플래그가 꺼짐'],['date_after','날짜 이후'],['date_before','날짜 이전'],['var','변수 비교'],['approval','내각 지지율 비교'],['ruling_seats','집권 세력 의석 % 비교']];
    const EFFECTS = [['add_var','변수 더하기'],['set_var','변수 설정'],['approval','내각 지지율 더하기'],['support','정당 지지율 더하기'],['set_flag','플래그 켜기'],['clear_flag','플래그 끄기'],['fire_event','이벤트 실행'],['toast','짧은 알림']];
    const OPS = [['gte','이상 ≥'],['lte','이하 ≤'],['gt','초과 >'],['lt','미만 <'],['eq','같음 ='],['ne','다름 ≠']];
    const defaults = (key, kind) => {
        if (key === 'var') return { name: 'tension', gte: 50 };
        if (key === 'ruling_seats') return { share: true, gte: 50 };
        if (key === 'approval') return kind === 'cond' ? { of: 'cabinet', gte: 50 } : { of: 'cabinet', add: 5 };
        if (key === 'support') return { party: 'ruling', add: 5 };
        if (key === 'add_var' || key === 'set_var') return { name: 'tension', value: 5 };
        if (key.startsWith('date_')) return '1990-01-01';
        return key === 'toast' ? '새로운 변화가 시작되었습니다.' : 'my_flag';
    };
    function simpleRule(rule, kind) {
        if (!rule || typeof rule !== 'object' || Array.isArray(rule) || Object.keys(rule).length !== 1) return false;
        const key = Object.keys(rule)[0], v = rule[key];
        if (!(kind === 'cond' ? CONDITIONS : EFFECTS).some(([k]) => k === key)) return false;
        if (['var','approval','ruling_seats','support','add_var','set_var'].includes(key)) {
            if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
            const allowed = kind === 'cond' ? (key === 'var' ? ['name',...OPS.map(x=>x[0])] : key === 'approval' ? ['of',...OPS.map(x=>x[0])] : ['share',...OPS.map(x=>x[0])]) : key === 'approval' ? ['of','add'] : key === 'support' ? ['party','add'] : ['name','value'];
            if (Object.keys(v).some(k => !allowed.includes(k))) return false;
            if (kind === 'cond' && OPS.filter(([k]) => k in v).length !== 1) return false;
            if (key === 'approval' && v.of && v.of !== 'cabinet') return false;
            if (key === 'ruling_seats' && v.share !== true) return false;
            if (kind !== 'cond' && ['approval','support'].includes(key) && !Number.isFinite(v.add)) return false;
            return true;
        }
        return typeof v === 'string';
    }
    function rows(v, kind) {
        if (kind === 'cond') {
            if (v == null || (typeof v === 'object' && !Object.keys(v).length)) return { items: [], join: 'all' };
            if (Array.isArray(v)) return { items: v, join: 'all' };
            if (Object.keys(v).length === 1 && (Array.isArray(v.all) || Array.isArray(v.any))) return { items: v.all || v.any, join: v.any ? 'any' : 'all' };
            return { items: [v], join: 'all' };
        }
        return { items: Array.isArray(v) ? v : v ? [v] : [], join: 'all' };
    }
    function rules(path, label, kind, value, data) {
        const { items, join } = rows(value, kind);
        const html = items.map((rule, i) => {
            const key = rule && Object.keys(rule)[0], v = rule && rule[key];
            let fields = '';
            if (simpleRule(rule, kind)) {
                fields = select('type', kind === 'cond' ? CONDITIONS : EFFECTS, key);
                if (typeof v === 'string') {
                    fields += input('text', v, key.startsWith('date_') ? '날짜 (YYYY-MM-DD)' : key === 'toast' ? '알림 내용' : key === 'fire_event' ? '이벤트 ID' : '플래그 이름');
                    if (kind === 'cond' && key === 'flag') fields += select('focus', [['','방향성 완료로 채우기'],...(data.focus || []).map(f => ['focus_' + f.id, f.title || f.id])], '');
                } else {
                    if (key === 'var' || key === 'add_var' || key === 'set_var') fields += input('name', v.name, '변수 이름');
                    if (key === 'support') fields += input('party', v.party, '정당 (ruling = 여당)');
                    if (kind === 'cond') { const op = OPS.find(([k]) => k in v)?.[0] || 'gte'; fields += select('op', OPS, op) + input('number', v[op], '기준 값', 'number'); }
                    else fields += input('number', v.value ?? v.add, '변경 값', 'number');
                }
            } else fields = `<div class="cpg-custom"><b>사용자 정의 규칙 · 그대로 유지됨</b><code>${esc(JSON.stringify(rule))}</code><small>복합 규칙은 프로 모드에서 편집할 수 있습니다.</small></div>`;
            return `<div class="cpg-rule" data-gr="${i}">${fields}<button type="button" class="scn-x" data-gr-remove aria-label="규칙 삭제">×</button></div>`;
        }).join('');
        return `<section class="cpg-rules" data-guide="${esc(path)}" data-gkind="${kind}"><div class="scn-row"><b>${esc(label)}</b><span class="scn-grow"></span>${kind === 'cond' ? select('join',[['all','모든 조건 충족'],['any','하나 이상 충족']],join) : ''}</div>${html || `<p class="scn-dim">${kind === 'cond' ? '추가 조건 없음 · 연결한 선행 방향성만 확인합니다.' : '추가 효과 없음 · 방향성 완료는 자동으로 기록됩니다.'}</p>`}<button type="button" class="scn-btn" data-gr-add>+ ${kind === 'cond' ? '조건' : '효과'} 추가</button></section>`;
    }
    function bind(body, api) {
        body.querySelectorAll('[data-guide]').forEach(box => {
            const path = box.dataset.guide, kind = box.dataset.gkind;
            const get = () => rows(api.get(path), kind);
            const put = (items, join, redraw = false) => { api.set(path, kind === 'cond' ? !items.length ? null : items.length === 1 ? items[0] : { [join]: items } : items); api.touch(); if (redraw) api.render(); };
            box.querySelector('[data-gf="join"]')?.addEventListener('change', e => { const r = get(); put(r.items, e.target.value); });
            box.querySelector('[data-gr-add]').onclick = () => { const r = get(); const key = kind === 'cond' ? 'flag' : 'add_var'; put([...r.items,{[key]:defaults(key,kind)}],r.join,true); };
            box.querySelectorAll('[data-gr]').forEach(row => {
                const i = +row.dataset.gr;
                row.querySelector('[data-gr-remove]').onclick = () => { const r = get(); r.items.splice(i,1); put(r.items,r.join,true); };
                row.querySelectorAll('[data-gf]').forEach(el => {
                    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
                        const r = get(), rule = r.items[i], key = Object.keys(rule)[0], v = rule[key], field = el.dataset.gf;
                        if (field === 'type') { r.items[i] = {[el.value]:defaults(el.value,kind)}; put(r.items,r.join,true); return; }
                        if (field === 'focus') { if (el.value) { rule[key] = el.value; put(r.items,r.join,true); } return; }
                        if (field === 'text') rule[key] = el.value;
                        else if (field === 'name' || field === 'party') v[field] = el.value;
                        else if (field === 'op') { const old = OPS.find(([k])=>k in v)?.[0], n = v[old]; OPS.forEach(([k])=>delete v[k]); v[el.value] = n; }
                        else if (field === 'number') { if (!el.value || !Number.isFinite(+el.value)) return; const k = kind === 'cond' ? OPS.find(([k])=>k in v)[0] : 'value' in v ? 'value' : 'add'; v[k] = +el.value; }
                        put(r.items,r.join);
                    });
                });
            });
        });
    }
    window.HemiCampaignGuide = { rules, bind };
})();
