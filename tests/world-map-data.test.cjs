const {test}=require('node:test'),assert=require('node:assert/strict'),D=require('../js/world-map-data.js');
const preset=()=>({format:'hemicycle-districts',version:1,meta:{name:'World',custom:'kept'},district:{mapMode:'svg',names:{house:{a:'Alpha'}},seatCounts:{a:{house:7}},svgMap:{viewBox:'-10 0 200 100',shapes:[{key:'a',tag:'path',attrs:{d:'M0 0H100V100H0Z','fill-rule':'evenodd',onload:'bad()',style:'fill:url(x)'}}]}},regions:{custom:'kept'}});
test('uses the same district geometry while preserving electoral metadata and unknown extension fields',()=>{const p=preset(),s=D.read(p);assert.deepEqual(s.preset.meta,p.meta);assert.deepEqual(s.preset.regions,p.regions);assert.deepEqual(s.preset.district.seatCounts,p.district.seatCounts);assert.equal(s.preset.district.svgMap.shapes[0].attrs.onload,undefined);assert.equal(s.preset.district.svgMap.shapes[0].attrs.style,undefined);assert.equal(s.preset.district.svgMap.shapes[0].attrs['fill-rule'],'evenodd');assert.equal(p.district.svgMap.shapes[0].attrs.onload,'bad()');});
test('world ownership/color extension round trips without mutating the source map',()=>{const p=preset(),s=D.read(p);s.owners.a='country-a';s.colors['country-a']='#1234ab';const out=D.write(s,[{id:'country-a',name:'Country A',self:false}]);assert.equal(out.format,'hemicycle-districts');assert.equal(out.worldMap.owners.a,'country-a');const again=D.read(JSON.parse(JSON.stringify(out)));assert.equal(again.owners.a,'country-a');assert.equal(again.colors['country-a'],'#1234ab');assert.equal(again.countries[0].name,'Country A');assert.equal(p.worldMap,undefined);});
test('invalid geometry fails atomically; absent map state and old .hemimap files remain supported',()=>{assert.equal(D.normalize(undefined),null);for(const alter of [p=>p.format='x',p=>p.district.svgMap.viewBox='0 0 0 0',p=>p.district.svgMap.shapes.push(p.district.svgMap.shapes[0]),p=>p.district.svgMap.shapes[0].tag='script']){const p=preset();alter(p);assert.throws(()=>D.read(p));}assert.deepEqual(Object.keys(D.read(preset()).owners),[]);});
test('filters ownership of deleted regions and rejects injected colors while safely retaining unusual keys',()=>{const p=preset();p.worldMap={owners:{a:'c',deleted:'c'},colors:{c:'url(x)',good:'#aabbcc'},countries:[{id:'c',name:'C'},{id:'c',name:'duplicate'}]};const s=D.read(p);assert.deepEqual(Object.keys(s.owners),['a']);assert.equal(s.colors.c,undefined);assert.equal(s.colors.good,'#aabbcc');assert.equal(s.countries.length,1);});
// ---- 경제권 (v1.7.1) — 국가 소유권과 분리된 레이어 ----
const twoKeys=()=>new Set(D.geometry(preset()).shapes.map(sh=>sh.key));
test('economic regions are sanitized: unknown regions/zones dropped, ids and colors validated, never remapped',()=>{
    const keys=twoKeys(),first=[...keys][0];
    const e=D.economic({zones:[{id:'north',name:'북부 공업권',abbr:'북공',color:'#112233',desc:'설명'},{id:'north',name:'중복'},{id:'bad id',name:'x'},{id:'south',name:5,color:'url(x)'},null,'x'],
        regions:{[first]:'north',deleted:'north',[[...keys][1]||'zzz']:'ghost'}},keys);
    assert.deepEqual(e.zones,[{id:'north',name:'북부 공업권',abbr:'북공',color:'#112233',desc:'설명'},{id:'south',name:'',abbr:'',color:'',desc:''}]);
    assert.deepEqual({...e.regions},{[first]:'north'});
    assert.equal(e.version,1);
    assert.deepEqual(D.economic(undefined,keys),{version:1,zones:[],regions:Object.create(null)});
    assert.deepEqual({...D.economic({zones:[{id:'z'}],regions:{anything:'z'}}).regions},{anything:'z'}); // keys를 안 주면 구역은 거르지 않는다
});
test('economic regions round trip through .hemimap separately from ownership; old files have none',()=>{
    const p=preset(),s=D.read(p),first=s.preset.district.svgMap.shapes[0].key;
    assert.equal(s.economic,null); // 예전 파일 — 경제권 없음
    s.owners[first]='country-a';
    const eco={version:1,zones:[{id:'coast',name:'연안 무역권',abbr:'',color:'#abcdef',desc:''}],regions:{[first]:'coast',gone:'coast'}};
    const out=D.write(s,[{id:'country-a',name:'A',self:false}],eco);
    assert.deepEqual(out.economicRegions.zones,eco.zones); assert.deepEqual({...out.economicRegions.regions},{[first]:'coast'});
    assert.equal(out.worldMap.owners[first],'country-a'); assert.equal(out.worldMap.zones,undefined); // 소유권 확장과 섞이지 않는다
    const back=D.read(out);
    assert.deepEqual({...back.economic.regions},{[first]:'coast'}); assert.equal(back.owners[first],'country-a');
    assert.equal(back.preset.economicRegions,undefined); assert.equal(back.preset.worldMap,undefined);
    // 경제권이 없으면 파일에 칸을 만들지 않는다 (기존 파일과 글자까지 같은 출력)
    assert.equal(D.write(s,[],{version:1,zones:[],regions:{}}).economicRegions,undefined);
    assert.deepEqual(D.write(s,[]),D.write(s,[],null));
    // 소유권을 바꿔도 경제권 배정은 그대로
    back.owners[first]='other'; assert.deepEqual({...D.read(D.write(back,[],back.economic)).economic.regions},{[first]:'coast'});
});
