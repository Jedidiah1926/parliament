// World > Map: territory painting is independent of the electoral district map.
(function(){
    'use strict';
    if(document.documentElement.getAttribute('data-app-mode')==='logo'||!document.getElementById('mainContentWorld'))return;
    const D=HemiWorldMapData,NS='http://www.w3.org/2000/svg',esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const palette=['#437fa2','#c34e4e','#8f72ac','#b49c47','#5b986d','#bf8052','#599e9d','#a76c8e'];
    let S=null,revision=0,loadRequest=0,selected='',country='',tool='paint',camera=null,baseBox=null,pan=null,stroke=null,past=[],future=[],nodes=new Map();
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
    const ref=document.getElementById('dispTabRanking')||document.getElementById('dispTabCabinet');
    const disp=document.createElement('button');disp.type='button';disp.className='disp-tab-btn';disp.id='dispTabWorldmap';disp.dataset.tab='worldmap';disp.style.display='none';
    disp.innerHTML='<span class="disp-tab-label">세계 지도</span><span class="disp-tab-close" role="button" tabindex="0" aria-label="세계 지도 탭 닫기">×</span>';
    disp.onclick=()=>switchDispTab('worldmap');
    const close=()=>window.closeDispTab('worldmap');disp.querySelector('.disp-tab-close').onclick=e=>{e.stopPropagation();close();};disp.querySelector('.disp-tab-close').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();close();}};
    ref.parentElement.insertBefore(disp,ref.nextSibling);
    const panel=document.createElement('div');panel.id='dispPanelWorldmap';panel.className='disp-panel';
    panel.innerHTML=`<section class="wm-board"><div class="wm-row wm-toolbar"><strong>세계 지도</strong><span class="wm-grow"></span><button type="button" class="wm-btn" id="wmZoomOut" aria-label="지도 축소">−</button><span id="wmZoom">100%</span><button type="button" class="wm-btn" id="wmZoomIn" aria-label="지도 확대">+</button><button type="button" class="wm-btn" id="wmFit">전체 보기</button></div><div id="wmViewport" class="wm-viewport"><p class="wm-empty" id="wmEmpty">세계 › 지도에서 .hemimap 파일을 불러오세요.</p><svg id="wmSvg" xmlns="${NS}" role="group" aria-label="국가별 영토 지도 · 휠 확대/축소 · 휠 버튼 드래그 이동" tabindex="0" hidden></svg></div></section>`;
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
    }
    function styleRegion(key){const node=nodes.get(key);if(!node)return;const r=countryOf(ownerOf(key));node.setAttribute('fill',r?colorOf(r.id):'#35404b');node.classList.toggle('wm-selected',selected===key);node.querySelector('title').textContent=`${regionName(key)} · ${r?name(r):'미배정'}`;}
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
    function remember(before){if(JSON.stringify(before)===JSON.stringify(S.owners))return;past.push(before);if(past.length>30)past.shift();future=[];updateControls();save();}
    function paint(key){
        const previous=selected;selected=key;styleRegion(previous);
        if(tool!=='inspect'&&S&&(tool==='erase'||countryOf(country))){if(tool==='erase')delete S.owners[key];else S.owners[key]=country;}
        styleRegion(key);
    }
    svg.addEventListener('pointerdown',e=>{
        if(!S||e.button>1)return;const key=e.target.closest('[data-wm-key]')?.dataset.wmKey;
        if(e.button===1||!key){e.preventDefault();pan={id:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,scale:svg.getScreenCTM().a};svg.setPointerCapture(e.pointerId);svg.classList.add('wm-panning');}
        else {e.preventDefault();stroke={id:e.pointerId,before:D.clone(S.owners)};paint(key);svg.setPointerCapture(e.pointerId);updateControls();}
    });
    svg.addEventListener('pointermove',e=>{
        if(pan?.id===e.pointerId){camera.x=pan.cx-(e.clientX-pan.x)/pan.scale;camera.y=pan.cy-(e.clientY-pan.y)/pan.scale;setView();}
        else if(stroke?.id===e.pointerId&&tool!=='inspect'){const n=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-wm-key]');if(n&&svg.contains(n))paint(n.dataset.wmKey);}
    });
    function finish(e){if(stroke&&(!e||e.pointerId===stroke.id)){const before=stroke.before;stroke=null;if(S)remember(before);}if(!e||pan?.id===e.pointerId){pan=null;svg.classList.remove('wm-panning');}if(e&&svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);updateControls();}
    svg.addEventListener('pointerup',finish);svg.addEventListener('pointercancel',finish);svg.addEventListener('lostpointercapture',finish);window.addEventListener('blur',()=>finish());
    svg.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
    svg.addEventListener('click',e=>{if(e.detail!==0)return;const key=e.target.closest('[data-wm-key]')?.dataset.wmKey;if(key&&S){const before=D.clone(S.owners);paint(key);remember(before);updateControls();}});
    svg.addEventListener('wheel',e=>{if(!S)return;e.preventDefault();if(pan||stroke)return;const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());zoom(Math.exp(-e.deltaY*(e.deltaMode===1?16:1)*.0015),point);},{passive:false});
    svg.addEventListener('keydown',e=>{if(!S||e.ctrlKey||e.metaKey||e.altKey)return;const key=e.target.closest('[data-wm-key]')?.dataset.wmKey;if((e.key==='Enter'||e.key===' ')&&key){e.preventDefault();const before=D.clone(S.owners);paint(key);remember(before);updateControls();}else if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='0')fit();else if(e.key==='+'||e.key==='=')zoom(1.25);else if(e.key==='-')zoom(.8);else {const b=baseBox;camera.x+=(e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0)*b[2]/camera.zoom*.1;camera.y+=(e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0)*b[3]/camera.zoom*.1;setView();}}});
    $('wmZoomIn').onclick=()=>zoom(1.25);$('wmZoomOut').onclick=()=>zoom(.8);$('wmFit').onclick=fit;
    $('wmCountry').onchange=e=>{country=e.target.value;updateControls();};
    $('wmColor').oninput=e=>{if(S&&country&&D.color(e.target.value)){S.colors[country]=e.target.value;repaint();}};$('wmColor').onchange=save;
    controls.querySelectorAll('[data-wm-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.wmTool;updateControls();});
    $('wmUndo').onclick=()=>{if(!S||!past.length)return;future.push(D.clone(S.owners));S.owners=Object.assign(Object.create(null),past.pop());repaint();save();};
    $('wmRedo').onclick=()=>{if(!S||!future.length)return;past.push(D.clone(S.owners));S.owners=Object.assign(Object.create(null),future.pop());repaint();save();};
    $('wmClear').onclick=async()=>{if(!S)return;const token=revision;if(!await DnoUI.confirm('세계지도의 모든 영토 배정을 지울까요? 지도 모양과 국가는 유지됩니다.')||token!==revision)return;const before=D.clone(S.owners);S.owners=Object.create(null);remember(before);repaint();};
    $('wmRanking').onclick=()=>switchSubTab('world','ranking');
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
    function importData(preset){const next=D.read(preset);loadRequest++;mergeCountries(next);S=next;revision++;past=[];future=[];draw();save();return true;}
    $('wmOpen').onclick=()=>$('wmFile').click();
    $('wmFile').onchange=async e=>{const file=e.target.files[0],token=revision,request=++loadRequest;e.target.value='';if(!file)return;try{const data=JSON.parse(await HemiFile.readText(file));D.read(data);if(token!==revision||request!==loadRequest)return;if(S&&!await DnoUI.confirm('세계지도와 영토 배정을 불러온 파일로 바꿀까요? 지역구 지도는 그대로 유지됩니다.'))return;if(token!==revision||request!==loadRequest)return;importData(data);show();}catch(err){if(token===revision&&request===loadRequest)DnoUI.alert('세계지도를 불러오지 못했습니다: '+err.message);}};
    $('wmExport').onclick=async()=>{if(!S)return;const out=D.write(S,snapshot());const blob=await HemiFile.encode(out),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=String(out.meta?.name||'world-map').replace(/[\\/:*?"<>|]/g,'_')+'.hemimap';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);};
    function show(){disp.style.display='';switchDispTab('worldmap');}
    const origSub=window.switchSubTab;window.switchSubTab=function(main,sub){const r=origSub.apply(this,arguments);if(main==='world'&&sub==='worldmap'){repaint();show();}return r;};
    const origDisp=window.switchDispTab;window.switchDispTab=function(id){const r=origDisp.apply(this,arguments);if(id==='worldmap')repaint();return r;};
    const origGet=window.getAppState;window.getAppState=function(){const state=origGet.apply(this,arguments);if(S)state.worldMap=D.clone({...S,countries:snapshot()});return state;};
    const origSet=window.setAppState;window.setAppState=function(state){const r=origSet.apply(this,arguments);revision++;loadRequest++;past=[];future=[];try{S=D.normalize(state?.worldMap);}catch(e){S=null;}draw();return r;};
    window.HemiWorldMap={get state(){return S;},importData,show,fit};draw();
})();
