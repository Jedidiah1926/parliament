// SAVE SELECT reads the makers' existing IndexedDB stores; running saves stay independent.
(function () {
    'use strict';
    const stores = {campaign:{db:'hemicycleCampaigns',last:'hemicycleCampaignLast',editor:'scenario.html',list:'campaignSelectList',name:'캠페인'},challenge:{db:'hemicycleScenarios',last:'hemicycleScenarioLast',editor:'challenge.html',list:'challengeSelectList',name:'챌린지'}};
    const esc = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const alertBox = msg => window.DnoUI?.alert ? DnoUI.alert(msg) : Promise.resolve(alert(msg));
    async function transaction(kind, mode, run) {
        const d = await new Promise((resolve,reject)=>{const r=indexedDB.open(stores[kind].db,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('items'))r.result.createObjectStore('items',{keyPath:'id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
        try {return await new Promise((resolve,reject)=>{const tx=d.transaction('items',mode);const q=run(tx.objectStore('items'));tx.oncomplete=()=>resolve(q.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('저장 작업이 취소되었습니다.'));});}finally{d.close();}
    }
    const list = kind => transaction(kind,'readonly',s=>s.getAll());
    async function remove(kind,id) {
        await transaction(kind,'readwrite',s=>s.delete(id));
        if(localStorage.getItem(stores[kind].last)===id)localStorage.removeItem(stores[kind].last);
    }
    async function handoff(kind,data,start) {
        const d=JSON.parse(JSON.stringify(data));
        if(kind==='campaign'){d.starts.forEach(s=>delete s.state);d._startId=start.id;}else d.start={kind:start.kind,preset:start.preset,name:start.name};
        const name=data.title||stores[kind].name, key=kind==='campaign'?'Campaign':'Challenge';
        // Remove stale boot instructions for either story type and either start source.
        for(const k of ['hemiBootCampaign','hemiBootCampaignPending','hemiBootChallenge','hemiBootChallengePending','dnoBootPresetId','dnoBootNewSaveName','dnoBootImportedStateJSON','dnoBootImportedName','dnoBootImportPending'])sessionStorage.removeItem(k);
        const text=JSON.stringify(d);
        try{sessionStorage.setItem('hemiBoot'+key,text);}catch(e){await HemiFile.stash('boot'+key,{text});sessionStorage.setItem('hemiBoot'+key+'Pending','1');}
        if(start.kind==='save'){
            if(!start.state)throw Error('시작 세이브 파일이 없습니다. 메이커에서 선택하세요.');
            const text=JSON.stringify(start.state);
            try{sessionStorage.setItem('dnoBootImportedStateJSON',text);sessionStorage.setItem('dnoBootImportedName',name);}catch(e){sessionStorage.removeItem('dnoBootImportedStateJSON');await HemiFile.stash('bootImport',{name,text});sessionStorage.setItem('dnoBootImportPending','1');}
        }else {sessionStorage.setItem('dnoBootPresetId',start.preset||'builtin:tutorial');sessionStorage.setItem('dnoBootNewSaveName',name);}
        location.href='main.html';
    }
    async function launch(kind,item,startId) {
        let d=item.data;
        if(kind==='campaign'){
            const bad=HemiCampaignTools.validate(d).filter(i=>i.level==='error');if(bad.length)throw Error(bad.map(i=>i.message).join('\n'));
            if(d.starts.length>1&&!startId)return chooseStart(item);
            return handoff(kind,d,d.starts.find(s=>s.id===startId)||d.starts[0]);
        }
        d=HemiChallengeData.compile(d);
        if(!['hemicycle-challenge@1','hemicycle-scenario@1'].includes(d.format))throw Error('챌린지 파일 형식이 아닙니다.');
        if([...d.goals,...d.failures].some(g=>g.condition==null))throw Error('조건을 읽을 수 없습니다. 챌린지 메이커에서 확인하세요.');
        return handoff(kind,d,d.start||{kind:'preset',preset:'builtin:tutorial'});
    }
    function chooseStart(item) {
        const box=document.createElement('div');box.className='story-start-overlay';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','시작 나라 선택');
        box.innerHTML=`<section class="story-start-dialog"><h2>어느 나라로 시작할까요?</h2>${item.data.starts.map((s,i)=>`<button type="button" data-start="${i}"><b>${esc(s.name||s.id)}</b><span>${esc(s.desc||'')}</span></button>`).join('')}<button type="button" data-cancel>취소</button></section>`;
        const before=document.activeElement;
        const close=()=>{box.remove();before?.focus();};
        box.querySelector('[data-cancel]').onclick=close;
        box.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const els=[...box.querySelectorAll('button')],i=els.indexOf(document.activeElement);e.preventDefault();els[(i+(e.shiftKey?-1:1)+els.length)%els.length].focus();}};
        box.querySelectorAll('[data-start]').forEach(b=>b.onclick=async()=>{try{await launch('campaign',item,item.data.starts[+b.dataset.start].id);}catch(e){alertBox(e.message);}});
        document.body.appendChild(box);box.querySelector('button').focus();
    }
    let epoch=0;
    async function render() {
        const turn=++epoch,query=(document.getElementById('storySearch')?.value||'').toLowerCase();
        await Promise.all(Object.entries(stores).map(async([kind,meta])=>{
            const container=document.getElementById(meta.list);if(!container)return;
            try{
                const all=(await list(kind)).sort((a,b)=>b.updatedAt-a.updatedAt);if(turn!==epoch)return;
                const rows=all.filter(it=>`${it.title} ${it.data?.description||''}`.toLowerCase().includes(query));
                container.innerHTML=rows.length?rows.map((it,i)=>`<article class="story-library-card"><div><b>${esc(it.title||'(제목 없음)')}</b><p>${esc(it.data?.description||'설명이 없습니다.')}</p><small>${esc(it.data?.author||'제작자 미지정')} · ${meta.name}</small></div><div class="story-actions"><button type="button" data-play="${i}">▶ 새 플레이</button><button type="button" data-edit="${i}">편집</button><button type="button" data-delete="${i}" aria-label="${esc(it.title)} 삭제">삭제</button></div></article>`).join(''):`<div class="save-select-empty">${all.length?'검색 결과가 없습니다.':`저장된 ${meta.name}${kind==='campaign'?'이':'가'} 없습니다. 메이커에서 만들거나 파일을 불러오세요.`}</div>`;
                container.querySelectorAll('[data-play]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await launch(kind,rows[+b.dataset.play]);}catch(e){await alertBox(e.message);}finally{b.disabled=false;}});
                container.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{localStorage.setItem(meta.last,rows[+b.dataset.edit].id);location.href=meta.editor;});
                container.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{
                    const it=rows[+b.dataset.delete],message=`“${it.title}” ${meta.name} 제작물을 삭제할까요? 이 작업은 되돌릴 수 없습니다. 진행 중인 플레이 세이브는 유지됩니다.`;
                    const ok=window.DnoUI?.confirm?await DnoUI.confirm(message):confirm(message);if(!ok)return;
                    try{await remove(kind,it.id);await render();}catch(e){alertBox('삭제하지 못했습니다: '+e.message);}
                });
            }catch(e){if(turn===epoch)container.textContent='목록을 읽지 못했습니다. 다시 탭을 열어 주세요.';}
        }));
    }
    document.getElementById('storySearch')?.addEventListener('input',render);
    window.HemiStoryLibrary={list,remove,launch,render};
})();
