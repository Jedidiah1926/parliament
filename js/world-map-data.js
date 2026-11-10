// Data-only .hemimap compatibility and safe SVG geometry for the world map.
(function(root){
    'use strict';
    const clone=x=>JSON.parse(JSON.stringify(x));
    const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
    const tags=new Set(['path','polygon','polyline','rect','circle','ellipse']);
    const attrs=new Set(['d','points','cx','cy','r','x','y','width','height','rx','ry','transform','fill-rule']);
    const color=x=>typeof x==='string'&&/^#[\da-f]{6}$/i.test(x);
    function geometry(preset){
        const source=preset?.format==='hemicycle-districts'&&preset.district?.svgMap;
        if(!object(source)||!Array.isArray(source.shapes)||!source.shapes.length)throw Error('SVG 구역 모양이 든 .hemimap 파일을 선택하세요.');
        const box=String(source.viewBox||'').trim().split(/[\s,]+/).map(Number);
        if(box.length!==4||!box.every(Number.isFinite)||box[2]<=0||box[3]<=0)throw Error('지도의 viewBox가 올바르지 않습니다.');
        const keys=new Set();
        const shapes=source.shapes.map(sh=>{
            if(!object(sh)||typeof sh.key!=='string'||!sh.key.trim()||keys.has(sh.key)||!tags.has(sh.tag||'path')||!object(sh.attrs))throw Error('구역의 키·모양이 잘못되었거나 중복됩니다.');
            keys.add(sh.key);
            const clean=Object.fromEntries(Object.entries(sh.attrs).filter(([k,v])=>attrs.has(k)&&['string','number'].includes(typeof v)).map(([k,v])=>[k,String(v)]));
            if((sh.tag||'path')==='path'&&!clean.d)throw Error('구역 경로가 비어 있습니다.');
            return {key:sh.key,tag:sh.tag||'path',attrs:clean};
        });
        return {viewBox:box,shapes};
    }
    function extension(value,keys){
        const v=object(value)?value:{};
        const countries=[];const ids=new Set();
        for(const r of Array.isArray(v.countries)?v.countries:[]){
            if(!object(r)||typeof r.id!=='string'||!r.id||ids.has(r.id)||typeof r.name!=='string')continue;
            ids.add(r.id);countries.push({id:r.id,name:r.name,flag:typeof r.flag==='string'?r.flag:'🏳',self:!!r.self});
        }
        return {version:1,countries,
            owners:Object.assign(Object.create(null),Object.fromEntries(Object.entries(object(v.owners)?v.owners:{}).filter(([key,id])=>keys.has(key)&&typeof id==='string'&&id))),
            colors:Object.assign(Object.create(null),Object.fromEntries(Object.entries(object(v.colors)?v.colors:{}).filter(([,hex])=>color(hex))))};
    }
    function read(preset){
        const map=geometry(preset),data=clone(preset);
        // Rebuild geometry rather than carrying untrusted SVG event/style attributes into the renderer.
        data.district.svgMap={...data.district.svgMap,viewBox:map.viewBox.join(' '),shapes:map.shapes};
        const ext=extension(data.worldMap,new Set(map.shapes.map(sh=>sh.key)));delete data.worldMap;
        return {preset:data,owners:ext.owners,colors:ext.colors,countries:ext.countries};
    }
    function normalize(saved){if(!saved?.preset)return null;return read({...clone(saved.preset),worldMap:{owners:saved.owners,colors:saved.colors,countries:saved.countries}});}
    function write(state,countries){
        const out=clone(state.preset),keys=new Set(geometry(out).shapes.map(sh=>sh.key));
        out.worldMap=extension({owners:state.owners,colors:state.colors,countries:countries||state.countries},keys);
        return out;
    }
    const api={geometry,extension,read,normalize,write,color,clone};
    if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.HemiWorldMapData=api;
})(typeof window==='undefined'?globalThis:window);
