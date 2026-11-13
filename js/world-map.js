// World > Map: territory painting is independent of the electoral district map.
(function(){
    'use strict';
    if(document.documentElement.getAttribute('data-app-mode')==='logo'||!document.getElementById('mainContentWorld'))return;
    const D=HemiWorldMapData,NS='http://www.w3.org/2000/svg',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const palette=['#437fa2','#c34e4e','#8f72ac','#b49c47','#5b986d','#bf8052','#599e9d','#a76c8e'];
    let S=null,revision=0,loadRequest=0,selected='',country='',tool='paint',camera=null,baseBox=null,pan=null,stroke=null,past=[],future=[],nodes=new Map();
    // 경제권(지도상의 경제 지역) — 국가 영토(S.owners)와 별도의 레이어. 같은 지도 · 같은 붓으로 칠하되 자료 · 실행 취소 기록 · 저장 칸(economicRegions)이 따로다.
    // layer: 지금 지도가 보여 주고 칠하는 레이어 ('owners' = 국가 영토, 'zones' = 경제권). 세계 › 지도 / 세계 › 경제권 탭을 따라간다
    let E=D.economic(null),layer='owners',zone='',zPast=[],zFuture=[];
    const zoneOf=key=>Object.hasOwn(E.regions,key)?E.regions[key]:'';
    const zoneById=id=>E.zones.find(z=>z.id===id);
    const zoneColor=z=>D.color(z.color)?z.color:palette[E.zones.indexOf(z)%palette.length];
    const zoneLabel=z=>z.name||z.abbr||z.id;
    const rows=()=>window.HemiHistory?.ranking?.rows||[];
    const name=r=>r.self?(document.getElementById('nationNameInput').value.trim()||'우리나라'):r.name||'이름 없는 국가';
    const snapshot=()=>rows().map(r=>({id:String(r.id),name:name(r),flag:r.flag||'🏳',self:!!r.self}));
    const countryOf=id=>rows().find(r=>String(r.id)===String(id));
    const colorOf=id=>{const i=rows().findIndex(r=>String(r.id)===String(id));return i<0?'#35404b':S?.colors[id]||palette[i%palette.length];};
    const ownerOf=key=>S&&Object.hasOwn(S.owners,key)?S.owners[key]:'';
    const regionName=key=>S?.preset.district.names?.house?.[key]||key;
    // 칠할 때마다 세이브 전체를 그 자리에서 쓰면 큰 세이브에서 붓질이 끊긴다 — 잠깐 모았다가 한 번에 저장한다 (떠나거나 닫을 때는 js/main.js가 바로 마친다)
    const save=()=>{try{if(window.saveActiveSoon)window.saveActiveSoon();else window.saveActiveNow?.(true);}catch(e){/* autosave retains the same state */}};
    const host=document.getElementById('mainContentWorld'),bar=host.querySelector('.sub-tab-container');
    const tab=document.createElement('button');tab.type='button';tab.className='sub-tab-btn';tab.id='subTabWorldmap';tab.textContent='지도';tab.onclick=()=>switchSubTab('world','worldmap');bar.insertBefore(tab,bar.firstChild);
    const controls=document.createElement('div');controls.id='contentWorldmap';controls.className='sub-tab-content';
    controls.innerHTML=`<section class="wm-controls"><h3>세계 지도</h3><p class="wm-dim">.hemimap의 구역을 국가 영토로 칠합니다. 국가 › 지역구 지도와 별도로 저장됩니다.</p>
    <div class="wm-row"><button type="button" class="wm-btn" id="wmOpen">지도 불러오기 (.hemimap)</button><button type="button" class="wm-btn" id="wmExport">내보내기</button><input type="file" id="wmFile" accept=".hemimap,.json,application/json" hidden></div>
    <p id="wmStatus" class="wm-dim" role="status">맵 메이커에서 만든 지도를 불러오세요.</p>
    <label for="wmCountry">칠할 국가</label><div class="wm-row"><select id="wmCountry" aria-label="칠할 국가"></select><input type="color" id="wmColor" aria-label="국가 영토 색"></div>
    <div class="wm-row wm-tools" role="group" aria-label="지도 도구"><button type="button" class="wm-btn" data-wm-tool="paint">영토 칠하기</button><button type="button" class="wm-btn" data-wm-tool="inspect">구역 확인</button><button type="button" class="wm-btn" data-wm-tool="erase">배정 지우기</button></div>
    <p class="wm-dim">국가를 고른 뒤 구역을 누르거나 끌어 칠합니다. 휠로 확대/축소하고 휠 버튼 또는 빈 바탕을 끌어 이동하세요.</p>
    <div class="wm-row"><button type="button" class="wm-btn" id="wmUndo">실행 취소</button><button type="button" class="wm-btn" id="wmRedo">다시 실행</button><button type="button" class="wm-btn" id="wmClear">모든 배정 지우기</button></div>
    <div class="wm-region" id="wmRegion" aria-live="polite">구역을 누르면 이름과 소속 국가를 확인할 수 있습니다.</div>
    <h4>국가별 영토</h4><div id="wmLegend"></div><div class="wm-row"><input type="text" id="wmNewName" placeholder="새 국가 이름" aria-label="새 국가 이름"><button type="button" class="wm-btn" id="wmAddCountry">국가 추가</button></div>
    <button type="button" class="wm-btn" id="wmRanking">국가 순위에서 국가 편집</button></section>`;
    host.appendChild(controls);
    // 세계 › 경제권 — 사이드 메뉴의 잠긴 칸(1.7.1) 자리에 실제 탭
    const ecoTab=document.createElement('button');ecoTab.type='button';ecoTab.className='sub-tab-btn';ecoTab.id='subTabEconblocs';ecoTab.textContent='경제권';ecoTab.onclick=()=>switchSubTab('world','econblocs');
    const blocsTab=document.getElementById('subTabBlocs');if(blocsTab&&blocsTab.parentElement===bar)bar.insertBefore(ecoTab,blocsTab.nextSibling);else bar.appendChild(ecoTab);
    const eco=document.createElement('div');eco.id='contentEconblocs';eco.className='sub-tab-content';
    eco.innerHTML=`<section class="wm-controls we-controls"><h3>경제권</h3><p class="wm-dim">세계 지도의 구역을 묶어 공업권 · 무역권 · 수도권 같은 경제 지역을 만듭니다. 국가 영토 · 선거 지역구와 따로 저장되고, 국경을 넘어도 됩니다.</p>
    <p id="weStatus" class="wm-dim" role="status"></p>
    <h4>경제권 목록</h4><div id="weLegend"></div>
    <div class="wm-row"><input type="text" id="weNewName" placeholder="새 경제권 이름 (예: 북부 공업권)" aria-label="새 경제권 이름" maxlength="80"><button type="button" class="wm-btn" id="weAdd">경제권 추가</button></div>
    <div id="weEdit"></div>
    <div class="wm-row wm-tools" role="group" aria-label="경제권 도구"><button type="button" class="wm-btn" data-we-tool="paint">경제권 칠하기</button><button type="button" class="wm-btn" data-we-tool="inspect">구역 확인</button><button type="button" class="wm-btn" data-we-tool="erase">배정 지우기</button></div>
    <p class="wm-dim">경제권을 고른 뒤 구역을 누르거나 끌어 배정합니다. 한 구역은 경제권 하나에만 속하고, 칠해도 국가 영토는 바뀌지 않습니다.</p>
    <div class="wm-row"><button type="button" class="wm-btn" id="weUndo">실행 취소</button><button type="button" class="wm-btn" id="weRedo">다시 실행</button><button type="button" class="wm-btn" id="weClear">모든 배정 지우기</button></div>
    <div class="wm-region" id="weRegion" aria-live="polite">구역을 누르면 이름 · 경제권 · 소속 국가를 확인할 수 있습니다.</div>
    <h4>구역 찾기</h4><div class="wm-row"><input type="search" id="weSearch" placeholder="구역 이름 · 키 검색" aria-label="구역 검색"><label class="we-check"><input type="checkbox" id="weOnlyFree">미배정만</label></div><div id="weFound"></div></section>`;
    host.appendChild(eco);
    const ref=document.getElementById('dispTabRanking')||document.getElementById('dispTabCabinet');
    const disp=document.createElement('button');disp.type='button';disp.className='disp-tab-btn';disp.id='dispTabWorldmap';disp.dataset.tab='worldmap';disp.style.display='none';
    disp.innerHTML='<span class="disp-tab-label">세계 지도</span><span class="disp-tab-close" role="button" tabindex="0" aria-label="세계 지도 탭 닫기">×</span>';
    disp.onclick=()=>switchDispTab('worldmap');
    const close=()=>window.closeDispTab('worldmap');disp.querySelector('.disp-tab-close').onclick=e=>{e.stopPropagation();close();};disp.querySelector('.disp-tab-close').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();close();}};
    ref.parentElement.insertBefore(disp,ref.nextSibling);
    const panel=document.createElement('div');panel.id='dispPanelWorldmap';panel.className='disp-panel';
    panel.innerHTML=`<section class="wm-board"><div class="wm-row wm-toolbar"><strong>세계 지도</strong><span class="wm-seg" role="group" aria-label="지도에 표시할 것"><button type="button" class="wm-btn" data-wm-layer="owners">국가 영토</button><button type="button" class="wm-btn" data-wm-layer="zones">경제권</button></span><span class="wm-grow"></span><button type="button" class="wm-btn" id="wmZoomOut" aria-label="지도 축소">−</button><span id="wmZoom">100%</span><button type="button" class="wm-btn" id="wmZoomIn" aria-label="지도 확대">+</button><button type="button" class="wm-btn" id="wmFit">전체 보기</button></div><div id="wmViewport" class="wm-viewport"><p class="wm-empty" id="wmEmpty">세계 › 지도에서 .hemimap 파일을 불러오세요.</p><svg id="wmSvg" xmlns="${NS}" role="group" aria-label="국가별 영토 지도 · 휠 확대/축소 · 휠 버튼 드래그 이동" tabindex="0" hidden></svg></div></section>`;
    const panelRef=document.getElementById('dispPanelRanking')||document.getElementById('dispPanelCabinet');panelRef.parentElement.insertBefore(panel,panelRef.nextSibling);
    const $=id=>document.getElementById(id),svg=$('wmSvg');
    function status(text){$('wmStatus').textContent=text;}
    function updateControls(){
        const list=rows();
        if(S)list.forEach((r,i)=>{const id=String(r.id);if(!D.color(S.colors[id]))S.colors[id]=palette[i%palette.length];});
        if(!countryOf(country))country=String((list.find(r=>r.self)||list[0])?.id||'');
        $('wmCountry').innerHTML=list.map(r=>`<option value="${esc(r.id)}">${esc(name(r))}</option>`).join('');$('wmCountry').value=country;
        $('wmColor').value=colorOf(country);$('wmColor').disabled=!S||!country;
        for(const id of ['wmZoomOut','wmZoomIn','wmFit'])$(id).disabled=!S;
        $('wmExport').disabled=!S;$('wmClear').disabled=!S;$('wmUndo').disabled=!past.length;$('wmRedo').disabled=!future.length;
        controls.querySelectorAll('[data-wm-tool]').forEach(b=>b.setAttribute('aria-pressed',String(tool===b.dataset.wmTool)));
        const counts=new Map();let assigned=0;
        if(S)Object.keys(S.owners).forEach(key=>{const id=ownerOf(key);if(countryOf(id)){counts.set(id,(counts.get(id)||0)+1);assigned++;}});
        $('wmLegend').innerHTML=list.map(r=>`<button type="button" class="wm-country ${String(r.id)===country?'on':''}" data-wm-country="${esc(r.id)}"><i style="background:${colorOf(r.id)}"></i><span>${esc(name(r))}</span><b>${counts.get(String(r.id))||0}</b></button>`).join('');
        $('wmLegend').querySelectorAll('[data-wm-country]').forEach(b=>b.onclick=()=>{country=b.dataset.wmCountry;tool='paint';updateControls();});
        if(S){const n=S.preset.district.svgMap.shapes.length;status(`${S.preset.meta?.name||'세계 지도'} · ${n}개 구역 · ${assigned}개 배정 · ${n-assigned}개 미배정`);}else status('맵 메이커에서 만든 지도를 불러오세요.');
        if(selected&&S){const id=ownerOf(selected),r=countryOf(id);$('wmRegion').textContent=`${regionName(selected)} · ${r?name(r):'미배정'}`;}
        else $('wmRegion').textContent='구역을 누르면 이름과 소속 국가를 확인할 수 있습니다.';
        panel.querySelectorAll('[data-wm-layer]').forEach(b=>{b.setAttribute('aria-pressed',String(layer===b.dataset.wmLayer));b.disabled=!S;});
        updateEcon();
    }
    // ----- 경제권 화면 (세계 › 경제권) -----
    function zoneCounts(){const counts=new Map();let assigned=0;if(S)for(const sh of S.preset.district.svgMap.shapes){const z=zoneById(zoneOf(sh.key));if(z){counts.set(z.id,(counts.get(z.id)||0)+1);assigned++;}}return {counts,assigned};}
    function updateEcon(){
        if(!zoneById(zone))zone=E.zones[0]?.id||'';
        const {counts,assigned}=zoneCounts(),n=S?S.preset.district.svgMap.shapes.length:0;
        $('weStatus').textContent=S?`${S.preset.meta?.name||'세계 지도'} · 경제권 ${E.zones.length}개 · ${n}개 구역 중 ${assigned}개 배정 · ${n-assigned}개 미배정`:'세계 › 지도에서 .hemimap 파일을 먼저 불러오세요. 경제권은 그 지도의 구역에 배정합니다.';
        $('weLegend').innerHTML=E.zones.length?E.zones.map(z=>`<button type="button" class="wm-country ${z.id===zone?'on':''}" data-we-zone="${esc(z.id)}"><i style="background:${zoneColor(z)}"></i><span>${esc(zoneLabel(z))}${z.abbr&&z.name?` <small>${esc(z.abbr)}</small>`:''}</span><b>${counts.get(z.id)||0}</b></button>`).join(''):'<p class="wm-dim">아직 경제권이 없습니다. 아래에서 이름을 적고 추가하세요.</p>';
        $('weLegend').querySelectorAll('[data-we-zone]').forEach(b=>b.onclick=()=>{zone=b.dataset.weZone;tool='paint';renderZoneEdit();updateControls();});
        eco.querySelectorAll('[data-we-tool]').forEach(b=>b.setAttribute('aria-pressed',String(tool===b.dataset.weTool)));
        $('weUndo').disabled=!zPast.length;$('weRedo').disabled=!zFuture.length;$('weClear').disabled=!S||!Object.keys(E.regions).length;$('weAdd').disabled=false;
        if(!$('weEdit').dataset.zone||$('weEdit').dataset.zone!==zone)renderZoneEdit();else renderZoneStats();
        if(selected&&S){const z=zoneById(zoneOf(selected)),r=countryOf(ownerOf(selected));$('weRegion').textContent=`${regionName(selected)} · 경제권: ${z?zoneLabel(z):'미배정'} · 국가: ${r?name(r):'미배정'}`;}
        else $('weRegion').textContent='구역을 누르면 이름 · 경제권 · 소속 국가를 확인할 수 있습니다.';
        renderFound();
    }
    // 고른 경제권의 통계 — 구역 수와 소유 국가 분포. 구역별 인구 · 생산 같은 지역 경제 자료는 게임에 아직 없으므로 "자료 없음"으로 적는다
    // (나라 전체 지표를 구역 수로 나눈 값을 지역 통계처럼 보여 주지 않는다)
    function renderZoneStats(){
        const box=$('weStats');if(!box)return;const z=zoneById(zone);if(!z){box.textContent='';return;}
        const by=new Map();let total=0;
        if(S)for(const sh of S.preset.district.svgMap.shapes){if(zoneOf(sh.key)!==z.id)continue;total++;const r=countryOf(ownerOf(sh.key)),label=r?name(r):'미배정';by.set(label,(by.get(label)||0)+1);}
        box.innerHTML=`<div><b>구역</b> ${total}개</div><div><b>소유 국가</b> ${total?[...by].sort((a,b)=>b[1]-a[1]).map(([label,c])=>`${esc(label)} ${c}`).join(' · '):'—'}</div><div><b>지역 경제 자료</b> 자료 없음 <span class="wm-dim">(구역별 인구 · 생산 · 산업 자료가 아직 없습니다)</span></div>`;
    }
    function renderZoneEdit(){
        const box=$('weEdit'),z=zoneById(zone);box.dataset.zone=z?z.id:'';
        if(!z){box.innerHTML='';return;}
        box.innerHTML=`<div class="we-edit"><div class="wm-row"><input type="text" id="weName" value="${esc(z.name)}" placeholder="이름" aria-label="경제권 이름" maxlength="80"><input type="text" id="weAbbr" value="${esc(z.abbr)}" placeholder="약칭" aria-label="경제권 약칭" maxlength="12"><input type="color" id="weColor" value="${zoneColor(z)}" aria-label="경제권 색"></div>
        <textarea id="weDesc" rows="2" placeholder="설명 (선택)" aria-label="경제권 설명" maxlength="2000">${esc(z.desc)}</textarea>
        <div class="wm-row"><label class="we-id">ID<input type="text" id="weId" value="${esc(z.id)}" aria-label="경제권 ID" maxlength="64"></label><span class="wm-dim">시나리오의 경제권 조건 · 효과가 이 ID를 씁니다.</span></div>
        <div id="weStats" class="we-stats"></div><div class="wm-row"><button type="button" class="wm-btn we-danger" id="weDelete">이 경제권 삭제</button></div></div>`;
        const legend=updateEcon; // 목록 · 통계만 다시 — 입력 중인 칸은 다시 만들지 않는다 (같은 경제권이면 updateEcon이 편집 칸을 건드리지 않음)
        $('weName').oninput=e=>{z.name=e.target.value.slice(0,80);legend();if(layer==='zones')retitle();save();};
        $('weAbbr').oninput=e=>{z.abbr=e.target.value.slice(0,12);legend();save();};
        $('weDesc').oninput=e=>{z.desc=e.target.value.slice(0,2000);save();};
        $('weColor').oninput=e=>{if(D.color(e.target.value)){z.color=e.target.value;if(layer==='zones')for(const k of nodes.keys())if(zoneOf(k)===z.id)styleRegion(k);legend();}};$('weColor').onchange=save;
        $('weId').onchange=e=>{const next=e.target.value.trim();if(next===z.id)return;if(!D.zoneId(next)||zoneById(next)){e.target.value=z.id;DnoUI.alert('경제권 ID는 영문·숫자·_ . -로, 다른 경제권과 겹치지 않게 입력하세요.');return;}
            for(const k of Object.keys(E.regions))if(E.regions[k]===z.id)E.regions[k]=next;z.id=next;zone=next;zPast=[];zFuture=[];renderZoneEdit();updateControls();save();notify('manual',null,'zones');};
        $('weDelete').onclick=async()=>{const token=revision,count=Object.values(E.regions).filter(id=>id===z.id).length;
            if(!await DnoUI.confirm(`경제권 "${zoneLabel(z)}"을(를) 삭제할까요?\n소속 구역 ${count}개는 미배정이 됩니다. 이 경제권(ID: ${z.id})을 쓰는 시나리오 조건 · 효과는 더 이상 맞지 않게 됩니다.`)||token!==revision)return;
            const keys=Object.keys(E.regions).filter(k=>E.regions[k]===z.id);for(const k of keys)delete E.regions[k];E.zones=E.zones.filter(x=>x!==z);zone='';zPast=[];zFuture=[];
            if(layer==='zones')keys.forEach(styleRegion);renderZoneEdit();updateControls();save();notify('manual',keys,'zones');};
        renderZoneStats();
    }
    function retitle(){for(const k of nodes.keys())if(zoneOf(k)===zone)styleRegion(k);}
    function renderFound(){
        const q=$('weSearch').value.trim().toLowerCase(),free=$('weOnlyFree').checked,box=$('weFound');
        if(!S||(!q&&!free)){box.innerHTML='';return;}
        const hits=S.preset.district.svgMap.shapes.filter(sh=>(!free||!zoneById(zoneOf(sh.key)))&&(!q||regionName(sh.key).toLowerCase().includes(q)||sh.key.toLowerCase().includes(q)));
        box.innerHTML=hits.length?`<div class="we-found">${hits.slice(0,60).map(sh=>{const z=zoneById(zoneOf(sh.key));return `<button type="button" class="wm-country ${sh.key===selected?'on':''}" data-we-find="${esc(sh.key)}"><i style="background:${z?zoneColor(z):'#35404b'}"></i><span>${esc(regionName(sh.key))}</span><b>${z?esc(zoneLabel(z)):'미배정'}</b></button>`;}).join('')}</div>${hits.length>60?`<p class="wm-dim">${hits.length}개 중 60개만 표시합니다. 검색어를 더 적어 보세요.</p>`:''}`:'<p class="wm-dim">맞는 구역이 없습니다.</p>';
        box.querySelectorAll('[data-we-find]').forEach(b=>b.onclick=()=>{const key=b.dataset.weFind,previous=selected;selected=key;styleRegion(previous);styleRegion(key);
            const node=nodes.get(key);if(node&&camera&&!node.hasAttribute('transform')){try{const bb=node.getBBox();camera.x=bb.x+bb.width/2;camera.y=bb.y+bb.height/2;setView();}catch(e){/* 보이지 않는 동안에는 위치를 알 수 없다 */}}
            updateControls();});
    }
    function setLayer(next){if(layer===next)return;if(stroke)finish();layer=next;for(const key of nodes.keys())styleRegion(key);}
    function styleRegion(key){
        const node=nodes.get(key);if(!node)return;node.classList.toggle('wm-selected',selected===key);
        if(layer==='zones'){const z=zoneById(zoneOf(key));node.setAttribute('fill',z?zoneColor(z):'#35404b');node.querySelector('title').textContent=`${regionName(key)} · ${z?zoneLabel(z):'미배정'}`;return;}
        const r=countryOf(ownerOf(key));node.setAttribute('fill',r?colorOf(r.id):'#35404b');node.querySelector('title').textContent=`${regionName(key)} · ${r?name(r):'미배정'}`;
    }
    function repaint(){for(const key of nodes.keys())styleRegion(key);updateControls();}
    function setView(){if(!S||!camera)return;const b=baseBox,w=b[2]/camera.zoom,h=b[3]/camera.zoom;svg.setAttribute('viewBox',`${camera.x-w/2} ${camera.y-h/2} ${w} ${h}`);$('wmZoom').textContent=Math.round(camera.zoom*100)+'%';}
    function fit(){if(!S)return;const b=baseBox;camera={x:b[0]+b[2]/2,y:b[1]+b[3]/2,zoom:1};setView();}
    function zoom(factor,point){if(!S||!camera)return;const old=camera.zoom,next=Math.max(.25,Math.min(32,old*factor));if(point){camera.x=point.x+(camera.x-point.x)*old/next;camera.y=point.y+(camera.y-point.y)*old/next;}camera.zoom=next;setView();}
    function draw(){
        const capture=stroke?.id??pan?.id;
        svg.replaceChildren();nodes.clear();selected='';pan=null;stroke=null;svg.classList.remove('wm-panning');
        if(capture!=null&&svg.hasPointerCapture(capture))svg.releasePointerCapture(capture);
        baseBox=S?D.geometry(S.preset).viewBox:null;
        svg.toggleAttribute('hidden',!S);$('wmEmpty').hidden=!!S;
        if(!S){camera=null;$('wmZoom').textContent='100%';}
        if(S){for(const sh of S.preset.district.svgMap.shapes){const n=document.createElementNS(NS,sh.tag);for(const [k,v]of Object.entries(sh.attrs))n.setAttribute(k,v);n.setAttribute('fill-rule',sh.attrs['fill-rule']||'evenodd');n.setAttribute('vector-effect','non-scaling-stroke');n.dataset.wmKey=sh.key;n.setAttribute('tabindex','0');n.setAttribute('role','button');const title=document.createElementNS(NS,'title');n.appendChild(title);svg.appendChild(n);nodes.set(sh.key,n);styleRegion(sh.key);}fit();}
        updateControls();
    }
    // 지도 소유권이 실제로 바뀐 뒤 한 번 알린다 — 스크립트(js/scriptmods.js)와 시나리오(js/campaign.js)가 "지도 변경 시" 조건을 다시 본다.
    // source: 'manual'(붓질 · 실행 취소 · 모두 지우기) · 'import'(지도 파일) · 'script'(시나리오 효과). 세이브를 여는 것은 알리지 않는다
    // layer: 'owners'(국가 영토) · 'zones'(경제권) — 경제권 배정이 바뀌어도 같은 알림으로 조건을 다시 본다
    const notify=(source,keys,changed='owners')=>window.dispatchEvent(new CustomEvent('hemi-world-map-changed',{detail:{source,keys:keys||null,layer:changed}}));
    const current=()=>layer==='zones'?E.regions:S.owners;
    const diffKeys=(a,b)=>[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>(a[k]||'')!==(b[k]||''));
    function remember(before){
        const keys=diffKeys(before,current());if(!keys.length)return;
        if(layer==='zones'){zPast.push(before);if(zPast.length>30)zPast.shift();zFuture=[];}else{past.push(before);if(past.length>30)past.shift();future=[];}
        updateControls();save();notify('manual',keys,layer);
    }
    // 경제권 배정을 시나리오 효과가 바꾸는 경계 — applyOwners와 같은 계약 (전부 검사된 changes만, 한 번에, 수동 실행 취소 기록 비움)
    function applyZones(changes,source='script'){
        if(!S||!Array.isArray(changes))return 0;
        const known=new Set(S.preset.district.svgMap.shapes.map(sh=>sh.key));
        if(changes.some(c=>!c||!known.has(c.key)||typeof c.to!=='string'||(c.to&&!zoneById(c.to))))return 0;
        const keys=[];
        for(const c of changes){if(zoneOf(c.key)===c.to)continue;if(c.to)E.regions[c.key]=c.to;else delete E.regions[c.key];keys.push(c.key);}
        if(!keys.length)return 0;
        if(stroke&&layer==='zones'){const id=stroke.id;stroke=null;if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);}
        zPast=[];zFuture=[];if(layer==='zones')keys.forEach(styleRegion);updateControls();save();notify(source,keys,'zones');
        return keys.length;
    }
    // 시나리오 효과가 소유권을 바꾸는 경계 — changes: [{ key, to }] ('' = 미배정). 부르는 쪽(js/world-rules.js planTransfer)이 구역 · 국가를 모두 검사한 뒤에만 부른다.
    // 한 번에 적용하고, 하던 붓질을 정리하고, 수동 실행 취소 기록을 비운다 (실행 취소로 이벤트 결과만 되돌리고 완료 기록이 남는 일을 막는다). 보던 위치 · 확대는 그대로
    function applyOwners(changes,source='script'){
        if(!S||!Array.isArray(changes))return 0;
        const known=new Set(S.preset.district.svgMap.shapes.map(sh=>sh.key));
        if(changes.some(c=>!c||!known.has(c.key)||typeof c.to!=='string'))return 0;
        const keys=[];
        for(const c of changes){if(ownerOf(c.key)===c.to)continue;if(c.to)S.owners[c.key]=c.to;else delete S.owners[c.key];keys.push(c.key);}
        if(!keys.length)return 0;
        if(stroke&&layer==='owners'){const id=stroke.id;stroke=null;if(svg.hasPointerCapture(id))svg.releasePointerCapture(id);}
        past=[];future=[];keys.forEach(styleRegion);updateControls();save();notify(source,keys);
        return keys.length;
    }
    // 스크립트 판정에 쓰는 지금 지도 상태 (지도가 없으면 keys: null)
    function context(){
        const rowIds=new Set(rows().map(r=>String(r.id)));
        const zones=new Set(E.zones.map(z=>z.id)),zoneName=id=>{const z=zoneById(id);return z?zoneLabel(z):id;};
        if(!S)return {keys:null,owners:{},rowIds,regionName:k=>k,zones,zoneOf:{},zoneName};
        return {keys:new Set(S.preset.district.svgMap.shapes.map(sh=>sh.key)),owners:S.owners,rowIds,regionName,zones,zoneOf:E.regions,zoneName};
    }
    function paint(key){
        const previous=selected;selected=key;styleRegion(previous);
        if(layer==='zones'){if(tool!=='inspect'&&S&&(tool==='erase'||zoneById(zone))){if(tool==='erase')delete E.regions[key];else E.regions[key]=zone;}}
        else if(tool!=='inspect'&&S&&(tool==='erase'||countryOf(country))){if(tool==='erase')delete S.owners[key];else S.owners[key]=country;}
        styleRegion(key);
    }
    svg.addEventListener('pointerdown',e=>{
        if(!S||e.button>1)return;const key=e.target.closest('[data-wm-key]')?.dataset.wmKey;
        if(e.button===1||!key){e.preventDefault();pan={id:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,scale:svg.getScreenCTM().a};svg.setPointerCapture(e.pointerId);svg.classList.add('wm-panning');}
        else {e.preventDefault();stroke={id:e.pointerId,before:D.clone(current())};paint(key);svg.setPointerCapture(e.pointerId);updateControls();}
    });
    svg.addEventListener('pointermove',e=>{
        if(pan?.id===e.pointerId){camera.x=pan.cx-(e.clientX-pan.x)/pan.scale;camera.y=pan.cy-(e.clientY-pan.y)/pan.scale;setView();}
        else if(stroke?.id===e.pointerId&&tool!=='inspect'){const n=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-wm-key]');if(n&&svg.contains(n))paint(n.dataset.wmKey);}
    });
    function finish(e){if(stroke&&(!e||e.pointerId===stroke.id)){const before=stroke.before;stroke=null;if(S)remember(before);}if(!e||pan?.id===e.pointerId){pan=null;svg.classList.remove('wm-panning');}if(e&&svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);updateControls();}
    svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);window.addEventListener('blur',()=>finish());
    svg.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
    svg.addEventListener('click',e=>{if(e.detail!==0)return;const key=e.target.closest('[data-wm-key]')?.dataset.wmKey;if(key&&S){const before=D.clone(current());paint(key);remember(before);updateControls();}});
    svg.addEventListener('wheel',e=>{if(!S)return;e.preventDefault();if(pan||stroke)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());zoom(Math.exp(-e.deltaY*(e.deltaMode===1?16:1)*.0015),point);},{passive:false});
    svg.addEventListener('keydown',e=>{if(!S||e.ctrlKey||e.metaKey||e.altKey)return;const key=e.target.closest('[data-wm-key]')?.dataset.wmKey;if((e.key==='Enter'||e.key===' ')&&key){e.preventDefault();const before=D.clone(current());paint(key);remember(before);updateControls();}else if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='0')fit();else if(e.key==='+'||e.key==='=')zoom(1.25);else if(e.key==='-')zoom(.8);else {const b=baseBox;camera.x+=(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)*b[2]/camera.zoom*.1;camera.y+=(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0)*b[3]/camera.zoom*.1;setView();}}});
    $('wmZoomIn').onclick=()=>zoom(1.25);$('wmZoomOut').onclick=()=>zoom(.8);$('wmFit').onclick=fit;
    $('wmCountry').onchange=e=>{country=e.target.value;updateControls();};
    $('wmColor').oninput=e=>{if(S&&country&&D.color(e.target.value)){S.colors[country]=e.target.value;repaint();}};$('wmColor').onchange=save;
    controls.querySelectorAll('[data-wm-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.wmTool;updateControls();});
    $('wmUndo').onclick=()=>{if(!S||!past.length)return;const was=D.clone(S.owners);future.push(was);S.owners=Object.assign(Object.create(null),past.pop());repaint();save();notify('manual',diffKeys(was,S.owners));};
    $('wmRedo').onclick=()=>{if(!S||!future.length)return;const was=D.clone(S.owners);past.push(was);S.owners=Object.assign(Object.create(null),future.pop());repaint();save();notify('manual',diffKeys(was,S.owners));};
    $('wmClear').onclick=async()=>{if(!S)return;const token=revision;if(!await DnoUI.confirm('세계지도의 모든 영토 배정을 지울까요? 지도 모양과 국가는 유지됩니다.')||token!==revision)return;const before=D.clone(S.owners),was=layer;S.owners=Object.create(null);layer='owners';remember(before);layer=was;repaint();};
    $('wmRanking').onclick=()=>switchSubTab('world','ranking');
    // 경제권 화면의 조작
    panel.querySelectorAll('[data-wm-layer]').forEach(b=>b.onclick=()=>switchSubTab('world',b.dataset.wmLayer==='zones'?'econblocs':'worldmap'));
    eco.querySelectorAll('[data-we-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.weTool;updateControls();});
    $('weAdd').onclick=()=>{
        const text=$('weNewName').value.trim();if(!text){$('weNewName').focus();return;}
        // ID는 이름이 영문이면 이름에서, 아니면 zone1 · zone2 … (나중에 고칠 수 있다)
        let base=text.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40),id=base,n=1;
        if(!base){do{id='zone'+n++;}while(zoneById(id));}else while(zoneById(id))id=`${base}_${++n}`;
        E.zones.push({id,name:text.slice(0,80),abbr:'',color:palette[E.zones.length%palette.length],desc:''});zone=id;tool='paint';$('weNewName').value='';renderZoneEdit();updateControls();save();notify('manual',null,'zones');
    };
    $('weNewName').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('weAdd').click();}};
    $('weUndo').onclick=()=>{if(!S||!zPast.length)return;const was=D.clone(E.regions);zFuture.push(was);E.regions=Object.assign(Object.create(null),zPast.pop());repaint();save();notify('manual',diffKeys(was,E.regions),'zones');};
    $('weRedo').onclick=()=>{if(!S||!zFuture.length)return;const was=D.clone(E.regions);zPast.push(was);E.regions=Object.assign(Object.create(null),zFuture.pop());repaint();save();notify('manual',diffKeys(was,E.regions),'zones');};
    $('weClear').onclick=async()=>{if(!S)return;const token=revision;if(!await DnoUI.confirm('모든 구역의 경제권 배정을 지울까요? 경제권 목록과 국가 영토는 유지됩니다.')||token!==revision)return;const before=D.clone(E.regions),was=layer;E.regions=Object.create(null);layer='zones';remember(before);layer=was;repaint();};
    $('weSearch').oninput=renderFound;$('weOnlyFree').onchange=renderFound;
    $('wmAddCountry').onclick=()=>{const text=$('wmNewName').value.trim();if(!text){$('wmNewName').focus();return;}const row={id:'wm_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:text,flag:'🏳',bloc:'',ideo:'',score:0,prevRank:null,self:false};rows().push(row);country=row.id;$('wmNewName').value='';updateControls();save();};
    function mergeCountries(data){
        const mapping=new Map(),existing=rows().slice(),used=new Set();
        for(const r of data.countries){
            let found=rows().find(x=>String(x.id)===r.id)||existing.find(x=>!used.has(String(x.id))&&name(x)===r.name);
            // "Self" is the exporter/player relationship, not a country identity.
            // A German player's territory must not become Japanese when imported by a Japanese player.
            if(!found&&r.self&&(!r.name||r.name==='우리나라'))found=existing.find(x=>x.self&&!used.has(String(x.id)));
            if(!found){found={...r,self:false,bloc:'',ideo:'',score:0,prevRank:null};rows().push(found);}
            mapping.set(r.id,String(found.id));used.add(String(found.id));
        }
        data.owners=Object.assign(Object.create(null),Object.fromEntries(Object.entries(data.owners).map(([k,id])=>[k,mapping.get(id)||id])));
        data.colors=Object.assign(Object.create(null),Object.fromEntries(Object.entries(data.colors).map(([id,c])=>[mapping.get(id)||id,c])));
        data.countries=snapshot();
    }
    // 지도 파일에 경제권이 들어 있으면 그것으로, 없으면 경제권 목록은 두고 배정만 비운다 — 새 지도의 구역에 옛 배정을 조용히 붙이지 않는다
    function importData(preset){const next=D.read(preset);loadRequest++;mergeCountries(next);E=next.economic||D.economic({zones:E.zones});delete next.economic;S=next;revision++;past=[];future=[];zPast=[];zFuture=[];$('weEdit').dataset.zone='';draw();save();notify('import');return true;}
    $('wmOpen').onclick=()=>$('wmFile').click();
    $('wmFile').onchange=async e=>{const file=e.target.files[0],token=revision,request=++loadRequest;e.target.value='';if(!file)return;try{const data=JSON.parse(await HemiFile.readText(file));D.read(data);if(token!==revision||request!==loadRequest)return;if(S&&!await DnoUI.confirm('세계지도와 영토 배정을 불러온 파일로 바꿀까요? 지역구 지도는 그대로 유지됩니다.'))return;if(token!==revision||request!==loadRequest)return;importData(data);show();}catch(err){if(token===revision&&request===loadRequest)DnoUI.alert('세계지도를 불러오지 못했습니다: '+err.message);}};
    $('wmExport').onclick=async()=>{if(!S)return;const out=D.write(S,snapshot(),E);const blob=await HemiFile.encode(out),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=String(out.meta?.name||'world-map').replace(/[\\/:*?"<>|]/g,'_')+'.hemimap';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
    function show(){disp.style.display='';switchDispTab('worldmap');}
    const origSub=window.switchSubTab;window.switchSubTab=function(main,sub){const r=origSub.apply(this,arguments);if(main==='world'&&sub==='worldmap'){setLayer('owners');repaint();show();}else if(main==='world'&&sub==='econblocs'){setLayer('zones');repaint();show();}return r;};
    const origDisp=window.switchDispTab;window.switchDispTab=function(id){const r=origDisp.apply(this,arguments);if(id==='worldmap')repaint();return r;};
    const origGet=window.getAppState;window.getAppState=function(){const state=origGet.apply(this,arguments);if(S)state.worldMap=D.clone({...S,countries:snapshot()});if(E.zones.length)state.economicRegions=D.clone(E);return state;};
    const origSet=window.setAppState;window.setAppState=function(state){const r=origSet.apply(this,arguments);revision++;loadRequest++;past=[];future=[];try{S=D.normalize(state?.worldMap);}catch(e){S=null;}
        // 경제권은 세계지도와 다른 칸(economicRegions) — 예전 세이브에는 없다. 지금 지도에 없는 구역의 배정은 버린다
        E=D.economic(state?.economicRegions,S?new Set(S.preset.district.svgMap.shapes.map(sh=>sh.key)):new Set());zone='';zPast=[];zFuture=[];$('weEdit').dataset.zone='';
        draw();return r;};
    window.HemiWorldMap={get state(){return S;},get economic(){return E;},get layer(){return layer;},importData,show,fit,applyOwners,applyZones,context};draw();
})();
