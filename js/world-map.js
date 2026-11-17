// World > Map: territory painting is independent of the electoral district map.
(function(){
    'use strict';
    if(!document.getElementById('mainContentWorld'))return;
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
    // 시나리오의 플레이 규칙이 직접 수정을 잠갔는지 (js/campaign.js lockReason) — 잠겼으면 이유(글자), 아니면 ''. 시나리오 효과(applyOwners · applyZones)는 잠금과 상관없다
    const lockWhy=which=>{try{return window.HemiCampaign?.lockReason?.(which)||'';}catch(e){return '';}};
    const lockedNow=()=>lockWhy(layer==='zones'?'economicRegions':'worldMap');
    const rows=()=>window.HemiHistory?.ranking?.rows||[];
    const name=r=>r.self?(document.getElementById('nationNameInput').value.trim()||i18n('sim.history.173')):r.name||i18n('sim.worldMap.1');
    const snapshot=()=>rows().map(r=>({id:String(r.id),name:name(r),flag:r.flag||'🏳',self:!!r.self}));
    const countryOf=id=>rows().find(r=>String(r.id)===String(id));
    const colorOf=id=>{const i=rows().findIndex(r=>String(r.id)===String(id));return i<0?'#35404b':S?.colors[id]||palette[i%palette.length];};
    const ownerOf=key=>S&&Object.hasOwn(S.owners,key)?S.owners[key]:'';
    const regionName=key=>S?.preset.district.names?.house?.[key]||key;
    // 칠할 때마다 세이브 전체를 그 자리에서 쓰면 큰 세이브에서 붓질이 끊긴다 — 잠깐 모았다가 한 번에 저장한다 (떠나거나 닫을 때는 js/main.js가 바로 마친다)
    const save=()=>{try{if(window.saveActiveSoon)window.saveActiveSoon();else window.saveActiveNow?.(true);}catch(e){/* autosave retains the same state */}};
    const host=document.getElementById('mainContentWorld'),bar=host.querySelector('.sub-tab-container');
    const tab=document.createElement('button');tab.type='button';tab.className='sub-tab-btn';tab.id='subTabWorldmap';tab.textContent=i18n('sim.popvote.51');tab.onclick=()=>switchSubTab('world','worldmap');bar.insertBefore(tab,bar.firstChild);
    const controls=document.createElement('div');controls.id='contentWorldmap';controls.className='sub-tab-content';
    controls.innerHTML=`<section class="wm-controls"><h3>${esc(i18n('sim.worldMap.6'))}</h3><p class="wm-dim">${esc(i18n('sim.worldMap.7'))}</p>
    <div class="wm-row"><button type="button" class="wm-btn" id="wmOpen">${esc(i18n('sim.worldMap.8'))}</button><button type="button" class="wm-btn" id="wmExport">${esc(i18n('sim.main.16'))}</button><input type="file" id="wmFile" accept=".hemimap,.json,application/json" hidden></div>
    <p id="wmStatus" class="wm-dim" role="status">${esc(i18n('sim.worldMap.9'))}</p><p id="wmLock" class="wm-lock" role="status" hidden></p>
    <label for="wmCountry">${esc(i18n('sim.worldMap.2'))}</label><div class="wm-row"><select id="wmCountry" aria-label="${esc(i18n('sim.worldMap.2'))}"></select><input type="color" id="wmColor" aria-label="${esc(i18n('sim.worldMap.3'))}"></div>
    <div class="wm-row wm-tools" role="group" aria-label="${esc(i18n('sim.worldMap.4'))}"><button type="button" class="wm-btn" data-wm-tool="paint">${esc(i18n('sim.worldMap.10'))}</button><button type="button" class="wm-btn" data-wm-tool="inspect">${esc(i18n('sim.worldMap.11'))}</button><button type="button" class="wm-btn" data-wm-tool="erase">${esc(i18n('sim.worldMap.12'))}</button></div>
    <p class="wm-dim">${esc(i18n('sim.worldMap.13'))}</p>
    <div class="wm-row"><button type="button" class="wm-btn" id="wmUndo">${esc(i18n('sim.worldMap.14'))}</button><button type="button" class="wm-btn" id="wmRedo">${esc(i18n('sim.worldMap.15'))}</button><button type="button" class="wm-btn" id="wmClear">${esc(i18n('sim.worldMap.16'))}</button></div>
    <div class="wm-region" id="wmRegion" aria-live="polite">${esc(i18n('sim.worldMap.17'))}</div>
    <h4>${esc(i18n('sim.worldMap.18'))}</h4><div id="wmLegend"></div><div class="wm-row"><input type="text" id="wmNewName" placeholder="${esc(i18n('sim.worldMap.5'))}" aria-label="${esc(i18n('sim.worldMap.5'))}"><button type="button" class="wm-btn" id="wmAddCountry">${esc(i18n('sim.worldMap.19'))}</button></div>
    <button type="button" class="wm-btn" id="wmRanking">${esc(i18n('sim.worldMap.20'))}</button></section>`;
    host.appendChild(controls);
    // 세계 › 경제권 — 사이드 메뉴의 잠긴 칸(1.7.1) 자리에 실제 탭
    const ecoTab=document.createElement('button');ecoTab.type='button';ecoTab.className='sub-tab-btn';ecoTab.id='subTabEconblocs';ecoTab.textContent=i18n('sim.sidenav.2');ecoTab.onclick=()=>switchSubTab('world','econblocs');
    const blocsTab=document.getElementById('subTabBlocs');if(blocsTab&&blocsTab.parentElement===bar)bar.insertBefore(ecoTab,blocsTab.nextSibling);else bar.appendChild(ecoTab);
    const eco=document.createElement('div');eco.id='contentEconblocs';eco.className='sub-tab-content';
    eco.innerHTML=`<section class="wm-controls we-controls"><h3>${esc(i18n('sim.sidenav.2'))}</h3><p class="wm-dim">${esc(i18n('sim.worldMap.26'))}</p>
    <p id="weStatus" class="wm-dim" role="status"></p><p id="weLock" class="wm-lock" role="status" hidden></p>
    <h4>${esc(i18n('sim.worldMap.27'))}</h4><div id="weLegend"></div>
    <div class="wm-row"><input type="text" id="weNewName" placeholder="${esc(i18n('sim.worldMap.21'))}" aria-label="${esc(i18n('sim.worldMap.22'))}" maxlength="80"><button type="button" class="wm-btn" id="weAdd">${esc(i18n('sim.worldMap.28'))}</button></div>
    <div id="weEdit"></div>
    <div class="wm-row wm-tools" role="group" aria-label="${esc(i18n('sim.worldMap.23'))}"><button type="button" class="wm-btn" data-we-tool="paint">${esc(i18n('sim.worldMap.29'))}</button><button type="button" class="wm-btn" data-we-tool="inspect">${esc(i18n('sim.worldMap.11'))}</button><button type="button" class="wm-btn" data-we-tool="erase">${esc(i18n('sim.worldMap.12'))}</button></div>
    <p class="wm-dim">${esc(i18n('sim.worldMap.30'))}</p>
    <div class="wm-row"><button type="button" class="wm-btn" id="weUndo">${esc(i18n('sim.worldMap.14'))}</button><button type="button" class="wm-btn" id="weRedo">${esc(i18n('sim.worldMap.15'))}</button><button type="button" class="wm-btn" id="weClear">${esc(i18n('sim.worldMap.16'))}</button></div>
    <div class="wm-region" id="weRegion" aria-live="polite">${esc(i18n('sim.worldMap.31'))}</div>
    <h4>${esc(i18n('sim.worldMap.32'))}</h4><div class="wm-row"><input type="search" id="weSearch" placeholder="${esc(i18n('sim.worldMap.24'))}" aria-label="${esc(i18n('sim.worldMap.25'))}"><label class="we-check"><input type="checkbox" id="weOnlyFree">${esc(i18n('sim.worldMap.33'))}</label></div><div id="weFound"></div></section>`;
    host.appendChild(eco);
    const ref=document.getElementById('dispTabRanking')||document.getElementById('dispTabCabinet');
    const disp=document.createElement('button');disp.type='button';disp.className='disp-tab-btn';disp.id='dispTabWorldmap';disp.dataset.tab='worldmap';disp.style.display='none';
    disp.innerHTML=`<span class="disp-tab-label">${esc(i18n('sim.worldMap.6'))}</span><span class="disp-tab-close" role="button" tabindex="0" aria-label="${esc(i18n('sim.worldMap.34'))}">×</span>`;
    disp.onclick=()=>switchDispTab('worldmap');
    const close=()=>window.closeDispTab('worldmap');disp.querySelector('.disp-tab-close').onclick=e=>{e.stopPropagation();close();};disp.querySelector('.disp-tab-close').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();close();}};
    ref.parentElement.insertBefore(disp,ref.nextSibling);
    const panel=document.createElement('div');panel.id='dispPanelWorldmap';panel.className='disp-panel';
    panel.innerHTML=`<section class="wm-board"><div class="wm-row wm-toolbar"><strong>${esc(i18n('sim.worldMap.6'))}</strong><span class="wm-seg" role="group" aria-label="${esc(i18n('sim.worldMap.35'))}"><button type="button" class="wm-btn" data-wm-layer="owners">${esc(i18n('sim.worldMap.38'))}</button><button type="button" class="wm-btn" data-wm-layer="zones">${esc(i18n('sim.sidenav.2'))}</button></span><span class="wm-grow"></span><button type="button" class="wm-btn" id="wmZoomOut" aria-label="${esc(i18n('sim.worldMap.36'))}">−</button><span id="wmZoom">100%</span><button type="button" class="wm-btn" id="wmZoomIn" aria-label="${esc(i18n('sim.worldMap.37'))}">+</button><button type="button" class="wm-btn" id="wmFit">${esc(i18n('sim.worldMap.39'))}</button></div><div id="wmViewport" class="wm-viewport"><p class="wm-empty" id="wmEmpty">${esc(i18n('sim.worldMap.40'))}</p><svg id="wmSvg" xmlns="${NS}" role="group" aria-label="${esc(i18n('sim.worldMap.41'))}" tabindex="0" hidden></svg></div></section>`;
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
        if(S){const n=S.preset.district.svgMap.shapes.length;status(i18n('sim.worldMap.42', { name: S.preset.meta?.name||i18n('sim.worldMap.6'), v: n, assigned, assigned2: n-assigned }));}else status(i18n('sim.worldMap.9'));
        if(selected&&S){const id=ownerOf(selected),r=countryOf(id);$('wmRegion').textContent=`${regionName(selected)} · ${r?name(r):i18n('sim.worldMap.43')}`;}
        else $('wmRegion').textContent=i18n('sim.worldMap.17');
        panel.querySelectorAll('[data-wm-layer]').forEach(b=>{b.setAttribute('aria-pressed',String(layer===b.dataset.wmLayer));b.disabled=!S;});
        // 직접 수정이 잠긴 시나리오 — 이유를 보여 주고 바꾸는 조작을 끈다 (구역 확인 · 확대/이동 · 내보내기는 그대로)
        const lw=lockWhy('worldMap');$('wmLock').hidden=!lw;$('wmLock').textContent=lw?'🔒 '+lw:'';
        if(lw){for(const id of ['wmOpen','wmClear','wmUndo','wmRedo','wmAddCountry','wmNewName','wmColor'])$(id).disabled=true;controls.querySelectorAll('[data-wm-tool]').forEach(b=>{b.disabled=b.dataset.wmTool!=='inspect';b.setAttribute('aria-pressed',String(b.dataset.wmTool==='inspect'));});}
        else {for(const id of ['wmOpen','wmAddCountry','wmNewName'])$(id).disabled=false;controls.querySelectorAll('[data-wm-tool]').forEach(b=>{b.disabled=false;});}
        updateEcon();
    }
    // ----- 경제권 화면 (세계 › 경제권) -----
    function zoneCounts(){const counts=new Map();let assigned=0;if(S)for(const sh of S.preset.district.svgMap.shapes){const z=zoneById(zoneOf(sh.key));if(z){counts.set(z.id,(counts.get(z.id)||0)+1);assigned++;}}return {counts,assigned};}
    function updateEcon(){
        if(!zoneById(zone))zone=E.zones[0]?.id||'';
        const {counts,assigned}=zoneCounts(),n=S?S.preset.district.svgMap.shapes.length:0;
        $('weStatus').textContent=S?i18n('sim.worldMap.44', { name: S.preset.meta?.name||i18n('sim.worldMap.6'), zones: E.zones.length, v: n, assigned, assigned2: n-assigned }):i18n('sim.worldMap.45');
        $('weLegend').innerHTML=E.zones.length?E.zones.map(z=>`<button type="button" class="wm-country ${z.id===zone?'on':''}" data-we-zone="${esc(z.id)}"><i style="background:${zoneColor(z)}"></i><span>${esc(zoneLabel(z))}${z.abbr&&z.name?` <small>${esc(z.abbr)}</small>`:''}</span><b>${counts.get(z.id)||0}</b></button>`).join(''):`<p class="wm-dim">${esc(i18n('sim.worldMap.46'))}</p>`;
        $('weLegend').querySelectorAll('[data-we-zone]').forEach(b=>b.onclick=()=>{zone=b.dataset.weZone;tool='paint';renderZoneEdit();updateControls();});
        eco.querySelectorAll('[data-we-tool]').forEach(b=>b.setAttribute('aria-pressed',String(tool===b.dataset.weTool)));
        $('weUndo').disabled=!zPast.length;$('weRedo').disabled=!zFuture.length;$('weClear').disabled=!S||!Object.keys(E.regions).length;$('weAdd').disabled=false;
        const zw=lockWhy('economicRegions');$('weLock').hidden=!zw;$('weLock').textContent=zw?'🔒 '+zw:'';
        if(zw){for(const id of ['weAdd','weNewName','weUndo','weRedo','weClear'])$(id).disabled=true;eco.querySelectorAll('[data-we-tool]').forEach(b=>{b.disabled=b.dataset.weTool!=='inspect';b.setAttribute('aria-pressed',String(b.dataset.weTool==='inspect'));});}
        else {$('weNewName').disabled=false;eco.querySelectorAll('[data-we-tool]').forEach(b=>{b.disabled=false;});}
        if(!$('weEdit').dataset.zone||$('weEdit').dataset.zone!==zone||$('weEdit').dataset.locked!==String(!!zw))renderZoneEdit();else renderZoneStats();
        if(selected&&S){const z=zoneById(zoneOf(selected)),r=countryOf(ownerOf(selected));$('weRegion').textContent=i18n('sim.worldMap.47', { selected: regionName(selected), z: z?zoneLabel(z):i18n('sim.worldMap.43'), r: r?name(r):i18n('sim.worldMap.43') });}
        else $('weRegion').textContent=i18n('sim.worldMap.31');
        renderFound();
    }
    // 고른 경제권의 통계 — 구역 수와 소유 국가 분포. 구역별 인구 · 생산 같은 지역 경제 자료는 게임에 아직 없으므로 "자료 없음"으로 적는다
    // (나라 전체 지표를 구역 수로 나눈 값을 지역 통계처럼 보여 주지 않는다)
    function renderZoneStats(){
        const box=$('weStats');if(!box)return;const z=zoneById(zone);if(!z){box.textContent='';return;}
        const by=new Map();let total=0;
        if(S)for(const sh of S.preset.district.svgMap.shapes){if(zoneOf(sh.key)!==z.id)continue;total++;const r=countryOf(ownerOf(sh.key)),label=r?name(r):i18n('sim.worldMap.43');by.set(label,(by.get(label)||0)+1);}
        box.innerHTML=`<div><b>${esc(i18n('sim.worldMap.48'))}</b> ${total}${esc(i18n('sim.worldMap.49'))}</div><div><b>${esc(i18n('sim.worldMap.50'))}</b> ${total?[...by].sort((a,b)=>b[1]-a[1]).map(([label,c])=>`${esc(label)} ${c}`).join(' · '):'—'}</div><div><b>${esc(i18n('sim.worldMap.51'))}</b> ${esc(i18n('sim.worldMap.52'))} <span class="wm-dim">${esc(i18n('sim.worldMap.53'))}</span></div>`;
    }
    function renderZoneEdit(){
        const box=$('weEdit'),z=zoneById(zone),zw=lockWhy('economicRegions');box.dataset.zone=z?z.id:'';box.dataset.locked=String(!!zw);
        if(!z){box.innerHTML='';return;}
        box.innerHTML=`<div class="we-edit"><div class="wm-row"><input type="text" id="weName" value="${esc(z.name)}" placeholder="${esc(i18n('sim.contentDate.11'))}" aria-label="${esc(i18n('sim.worldMap.54'))}" maxlength="80"><input type="text" id="weAbbr" value="${esc(z.abbr)}" placeholder="${esc(i18n('sim.main.23'))}" aria-label="${esc(i18n('sim.worldMap.55'))}" maxlength="12"><input type="color" id="weColor" value="${zoneColor(z)}" aria-label="${esc(i18n('sim.worldMap.56'))}"></div>
        <textarea id="weDesc" rows="2" placeholder="${esc(i18n('sim.worldMap.57'))}" aria-label="${esc(i18n('sim.worldMap.58'))}" maxlength="2000">${esc(z.desc)}</textarea>
        <div class="wm-row"><label class="we-id">ID<input type="text" id="weId" value="${esc(z.id)}" aria-label="${esc(i18n('sim.worldMap.59'))}" maxlength="64"></label><span class="wm-dim">${esc(i18n('sim.worldMap.60'))}</span></div>
        <div id="weStats" class="we-stats"></div><div class="wm-row"><button type="button" class="wm-btn we-danger" id="weDelete">${esc(i18n('sim.worldMap.61'))}</button></div></div>`;
        if(zw){box.querySelectorAll('input,textarea,button').forEach(el=>{el.disabled=true;});renderZoneStats();return;} // 잠긴 시나리오 — 보기만
        const legend=updateEcon; // 목록 · 통계만 다시 — 입력 중인 칸은 다시 만들지 않는다 (같은 경제권이면 updateEcon이 편집 칸을 건드리지 않음)
        $('weName').oninput=e=>{z.name=e.target.value.slice(0,80);legend();if(layer==='zones')retitle();save();};
        $('weAbbr').oninput=e=>{z.abbr=e.target.value.slice(0,12);legend();save();};
        $('weDesc').oninput=e=>{z.desc=e.target.value.slice(0,2000);save();};
        $('weColor').oninput=e=>{if(D.color(e.target.value)){z.color=e.target.value;if(layer==='zones')for(const k of nodes.keys())if(zoneOf(k)===z.id)styleRegion(k);legend();}};$('weColor').onchange=save;
        $('weId').onchange=e=>{const next=e.target.value.trim();if(next===z.id)return;if(!D.zoneId(next)||zoneById(next)){e.target.value=z.id;HemiUI.alert(i18n('sim.worldMap.62'));return;}
            for(const k of Object.keys(E.regions))if(E.regions[k]===z.id)E.regions[k]=next;z.id=next;zone=next;zPast=[];zFuture=[];renderZoneEdit();updateControls();save();notify('manual',null,'zones');};
        $('weDelete').onclick=async()=>{const token=revision,count=Object.values(E.regions).filter(id=>id===z.id).length;
            if(!await HemiUI.confirm(i18n('sim.worldMap.63', { z: zoneLabel(z), count, z2: z.id }))||token!==revision)return;
            const keys=Object.keys(E.regions).filter(k=>E.regions[k]===z.id);for(const k of keys)delete E.regions[k];E.zones=E.zones.filter(x=>x!==z);zone='';zPast=[];zFuture=[];
            if(layer==='zones')keys.forEach(styleRegion);renderZoneEdit();updateControls();save();notify('manual',keys,'zones');};
        renderZoneStats();
    }
    function retitle(){for(const k of nodes.keys())if(zoneOf(k)===zone)styleRegion(k);}
    function renderFound(){
        const q=$('weSearch').value.trim().toLowerCase(),free=$('weOnlyFree').checked,box=$('weFound');
        if(!S||(!q&&!free)){box.innerHTML='';return;}
        const hits=S.preset.district.svgMap.shapes.filter(sh=>(!free||!zoneById(zoneOf(sh.key)))&&(!q||regionName(sh.key).toLowerCase().includes(q)||sh.key.toLowerCase().includes(q)));
        box.innerHTML=hits.length?`<div class="we-found">${hits.slice(0,60).map(sh=>{const z=zoneById(zoneOf(sh.key));return `<button type="button" class="wm-country ${sh.key===selected?'on':''}" data-we-find="${esc(sh.key)}"><i style="background:${z?zoneColor(z):'#35404b'}"></i><span>${esc(regionName(sh.key))}</span><b>${z?esc(zoneLabel(z)):i18n('sim.worldMap.43')}</b></button>`;}).join('')}</div>${hits.length>60?`<p class="wm-dim">${esc(i18n('sim.worldMap.64', { count: hits.length }))}</p>`:''}`:`<p class="wm-dim">${esc(i18n('sim.worldMap.65'))}</p>`;
        box.querySelectorAll('[data-we-find]').forEach(b=>b.onclick=()=>{const key=b.dataset.weFind,previous=selected;selected=key;styleRegion(previous);styleRegion(key);
            const node=nodes.get(key);if(node&&camera&&!node.hasAttribute('transform')){try{const bb=node.getBBox();camera.x=bb.x+bb.width/2;camera.y=bb.y+bb.height/2;setView();}catch(e){/* 보이지 않는 동안에는 위치를 알 수 없다 */}}
            updateControls();});
    }
    function setLayer(next){if(layer===next)return;if(stroke)finish();layer=next;for(const key of nodes.keys())styleRegion(key);}
    function styleRegion(key){
        const node=nodes.get(key);if(!node)return;node.classList.toggle('wm-selected',selected===key);
        if(layer==='zones'){const z=zoneById(zoneOf(key));node.setAttribute('fill',z?zoneColor(z):'#35404b');node.querySelector('title').textContent=`${regionName(key)} · ${z?zoneLabel(z):i18n('sim.worldMap.43')}`;return;}
        const r=countryOf(ownerOf(key));node.setAttribute('fill',r?colorOf(r.id):'#35404b');node.querySelector('title').textContent=`${regionName(key)} · ${r?name(r):i18n('sim.worldMap.43')}`;
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
        if(lockedNow()){styleRegion(key);return;} // 잠긴 시나리오에서는 어떤 도구든 구역 확인만 (버튼 · 드래그 · 키보드 모두 이 자리를 지난다)
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
    $('wmColor').oninput=e=>{if(lockWhy('worldMap'))return;if(S&&country&&D.color(e.target.value)){S.colors[country]=e.target.value;repaint();}};$('wmColor').onchange=save;
    controls.querySelectorAll('[data-wm-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.wmTool;updateControls();});
    $('wmUndo').onclick=()=>{if(!S||!past.length||lockWhy('worldMap'))return;const was=D.clone(S.owners);future.push(was);S.owners=Object.assign(Object.create(null),past.pop());repaint();save();notify('manual',diffKeys(was,S.owners));};
    $('wmRedo').onclick=()=>{if(!S||!future.length||lockWhy('worldMap'))return;const was=D.clone(S.owners);past.push(was);S.owners=Object.assign(Object.create(null),future.pop());repaint();save();notify('manual',diffKeys(was,S.owners));};
    $('wmClear').onclick=async()=>{if(!S||lockWhy('worldMap'))return;const token=revision;if(!await HemiUI.confirm(i18n('sim.worldMap.66'))||token!==revision)return;const before=D.clone(S.owners),was=layer;S.owners=Object.create(null);layer='owners';remember(before);layer=was;repaint();};
    $('wmRanking').onclick=()=>switchSubTab('world','ranking');
    // 경제권 화면의 조작
    panel.querySelectorAll('[data-wm-layer]').forEach(b=>b.onclick=()=>switchSubTab('world',b.dataset.wmLayer==='zones'?'econblocs':'worldmap'));
    eco.querySelectorAll('[data-we-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.weTool;updateControls();});
    $('weAdd').onclick=()=>{
        if(lockWhy('economicRegions'))return;
        const text=$('weNewName').value.trim();if(!text){$('weNewName').focus();return;}
        // ID는 이름이 영문이면 이름에서, 아니면 zone1 · zone2 … (나중에 고칠 수 있다)
        let base=text.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40),id=base,n=1;
        if(!base){do{id='zone'+n++;}while(zoneById(id));}else while(zoneById(id))id=`${base}_${++n}`;
        E.zones.push({id,name:text.slice(0,80),abbr:'',color:palette[E.zones.length%palette.length],desc:''});zone=id;tool='paint';$('weNewName').value='';renderZoneEdit();updateControls();save();notify('manual',null,'zones');
    };
    $('weNewName').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('weAdd').click();}};
    $('weUndo').onclick=()=>{if(!S||!zPast.length||lockWhy('economicRegions'))return;const was=D.clone(E.regions);zFuture.push(was);E.regions=Object.assign(Object.create(null),zPast.pop());repaint();save();notify('manual',diffKeys(was,E.regions),'zones');};
    $('weRedo').onclick=()=>{if(!S||!zFuture.length||lockWhy('economicRegions'))return;const was=D.clone(E.regions);zPast.push(was);E.regions=Object.assign(Object.create(null),zFuture.pop());repaint();save();notify('manual',diffKeys(was,E.regions),'zones');};
    $('weClear').onclick=async()=>{if(!S||lockWhy('economicRegions'))return;const token=revision;if(!await HemiUI.confirm(i18n('sim.worldMap.67'))||token!==revision)return;const before=D.clone(E.regions),was=layer;E.regions=Object.create(null);layer='zones';remember(before);layer=was;repaint();};
    $('weSearch').oninput=renderFound;$('weOnlyFree').onchange=renderFound;
    $('wmAddCountry').onclick=()=>{if(lockWhy('worldMap'))return;const text=$('wmNewName').value.trim();if(!text){$('wmNewName').focus();return;}const row={id:'wm_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:text,flag:'🏳',bloc:'',ideo:'',score:0,prevRank:null,self:false};rows().push(row);country=row.id;$('wmNewName').value='';updateControls();save();};
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
    $('wmFile').onchange=async e=>{const file=e.target.files[0],token=revision,request=++loadRequest;e.target.value='';if(!file)return;if(lockWhy('worldMap')){HemiUI.alert(lockWhy('worldMap'));return;}try{const data=JSON.parse(await HemiFile.readText(file));D.read(data);if(token!==revision||request!==loadRequest)return;if(S&&!await HemiUI.confirm(i18n('sim.worldMap.68')))return;if(token!==revision||request!==loadRequest)return;importData(data);show();}catch(err){if(token===revision&&request===loadRequest)HemiUI.alert((i18n('sim.worldMap.69') + " ")+err.message);}};
    $('wmExport').onclick=async()=>{if(!S)return;const out=D.write(S,snapshot(),E);const blob=await HemiFile.encode(out),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=String(out.meta?.name||'world-map').replace(/[\\/:*?"<>|]/g,'_')+'.hemimap';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
    function show(){disp.style.display='';switchDispTab('worldmap');}
    const origSub=window.switchSubTab;window.switchSubTab=function(main,sub){const r=origSub.apply(this,arguments);if(main==='world'&&sub==='worldmap'){setLayer('owners');repaint();show();}else if(main==='world'&&sub==='econblocs'){setLayer('zones');repaint();show();}return r;};
    const origDisp=window.switchDispTab;window.switchDispTab=function(id){const r=origDisp.apply(this,arguments);if(id==='worldmap')repaint();return r;};
    const origGet=window.getAppState;window.getAppState=function(){const state=origGet.apply(this,arguments);if(S)state.worldMap=D.clone({...S,countries:snapshot()});if(E.zones.length)state.economicRegions=D.clone(E);return state;};
    const origSet=window.setAppState;window.setAppState=function(state){const r=origSet.apply(this,arguments);revision++;loadRequest++;past=[];future=[];try{S=D.normalize(state?.worldMap);}catch(e){S=null;}
        // 경제권은 세계지도와 다른 칸(economicRegions) — 예전 세이브에는 없다. 지금 지도에 없는 구역의 배정은 버린다
        E=D.economic(state?.economicRegions,S?new Set(S.preset.district.svgMap.shapes.map(sh=>sh.key)):new Set());zone='';zPast=[];zFuture=[];$('weEdit').dataset.zone='';
        draw();return r;};
    // 시나리오가 붙거나 바뀌면 잠금 표시를 다시 맞춘다
    window.addEventListener('hemi-campaign-changed',()=>setTimeout(updateControls,0));
    window.HemiWorldMap={get state(){return S;},get economic(){return E;},get layer(){return layer;},importData,show,fit,applyOwners,applyZones,context};draw();
})();
