// SAVE SELECT reads the makers' existing IndexedDB stores; running saves stay independent.
(function () {
    'use strict';
    const storage = window.HemiMakerStore;
    const stores = {campaign:storage.types.campaign,challenge:storage.types.challenge};
    const esc = x => String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const alertBox = msg => window.DnoUI?.alert ? DnoUI.alert(msg) : Promise.resolve(alert(msg));
    const list = storage.list, remove = storage.remove;
    const i18n = window.i18n || (key => key); // 키 번역 (js/lang.js, lang/kr.js)
    async function handoff(kind,data,start) {
        const d=JSON.parse(JSON.stringify(data));
        if(kind==='campaign'){d.starts.forEach(s=>delete s.state);d._startId=start.id;}else d.start={kind:start.kind,preset:start.preset,name:start.name};
        const name=data.title||stores[kind].name, key=kind==='campaign'?'Campaign':'Challenge';
        // Remove stale boot instructions for either story type and either start source.
        for(const k of ['hemiBootCampaign','hemiBootCampaignPending','hemiBootChallenge','hemiBootChallengePending','dnoBootPresetId','dnoBootNewSaveName','dnoBootImportedStateJSON','dnoBootImportedName','dnoBootImportPending'])sessionStorage.removeItem(k);
        const text=JSON.stringify(d);
        try{sessionStorage.setItem('hemiBoot'+key,text);}catch(e){await HemiFile.stash('boot'+key,{text});sessionStorage.setItem('hemiBoot'+key+'Pending','1');}
        if(start.kind==='save'){
            if(!start.state)throw Error(i18n('stories.err.noStartSave'));
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
        if(!['hemicycle-challenge@1','hemicycle-scenario@1'].includes(d.format))throw Error(i18n('stories.err.notChallenge'));
        if([...d.goals,...d.failures].some(g=>g.condition==null))throw Error(i18n('stories.err.badCondition'));
        return handoff(kind,d,d.start||{kind:'preset',preset:'builtin:tutorial'});
    }
    function chooseStart(item) {
        const box=document.createElement('div');box.className='story-start-overlay';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label',i18n('stories.chooseStart.label'));
        box.innerHTML=`<section class="story-start-dialog"><h2>${esc(i18n('stories.chooseStart.title'))}</h2>${item.data.starts.map((s,i)=>`<button type="button" data-start="${i}"><b>${esc(s.name||s.id)}</b><span>${esc(s.desc||'')}</span></button>`).join('')}<button type="button" data-cancel>${esc(i18n('common.cancel'))}</button></section>`;
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
                container.innerHTML=rows.length?rows.map((it,i)=>`<article class="story-library-card"><div><b>${esc(it.title||i18n('stories.untitled'))}</b><p>${esc(it.data?.description||i18n('stories.noDescription'))}</p><small>${esc(it.data?.author||i18n('stories.noAuthor'))} · ${esc(i18n('stories.kind.'+kind))}</small></div><div class="story-actions"><button type="button" data-play="${i}">${esc(i18n('stories.play'))}</button><button type="button" data-edit="${i}">${esc(i18n('common.edit'))}</button><button type="button" data-delete="${i}" aria-label="${esc(i18n('stories.deleteLabel',{title:it.title}))}">${esc(i18n('common.delete'))}</button></div></article>`).join(''):`<div class="save-select-empty">${esc(i18n(all.length?'common.noResults':'stories.empty.'+kind))}</div>`;
                container.querySelectorAll('[data-play]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await launch(kind,rows[+b.dataset.play]);}catch(e){await alertBox(e.message);}finally{b.disabled=false;}});
                container.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{localStorage.setItem(meta.last,rows[+b.dataset.edit].id);location.href=storage.url(kind,rows[+b.dataset.edit].id);});
                container.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{
                    const it=rows[+b.dataset.delete],message=i18n('stories.deleteConfirm.'+kind,{title:it.title});
                    const ok=window.DnoUI?.confirm?await DnoUI.confirm(message):confirm(message);if(!ok)return;
                    try{await remove(kind,it.id);await render();}catch(e){alertBox(i18n('stories.deleteFailed',{error:e.message}));}
                });
            }catch(e){if(turn===epoch)container.textContent=i18n('stories.listFailed');}
        }));
    }
    document.getElementById('storySearch')?.addEventListener('input',render);
    window.HemiStoryLibrary={list,remove,launch,render};
    if(document.querySelector('[data-ss-tab="stories"]')?.getAttribute('aria-selected')==='true')render();
})();
