// Shared event reader for gameplay and maker previews. Choice effects stay in the caller.
(function () {
    'use strict';
    const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const paragraphs=s=>String(s).split(/\n{2,}/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
    let current=null;
    function show(ev,options={}) {
        current?.close();
        const fill=options.fill||String, sup=!!ev.super, narrative=!sup&&ev.presentation==='narrative';
        const opts=options.choices||((ev.options||[]).map((o,i)=>({o,i})));
        const choices=opts.length?opts:[{o:{text:'확인'},i:-1}];
        const img=typeof ev.image==='string'&&/^(data:image\/|https?:\/\/|[\w./-]+\.(png|jpe?g|webp|gif|svg)$)/i.test(ev.image)?ev.image:'';
        const ov=document.createElement('div');ov.className='sm-overlay'+(sup?' sm-super-ov':'')+(narrative?' sm-narrative-ov':'');
        ov.innerHTML=`<article class="sm-event ${sup?'sm-super':''} ${narrative?'sm-narrative':''}" role="dialog" aria-modal="true" aria-labelledby="smEvTitle">
        ${options.preview?'<button type="button" class="ce-preview-close" aria-label="미리 보기 닫기">×</button><div class="ce-preview-note">미리 보기 · 선택 효과는 적용되지 않습니다</div>':''}
        ${!narrative&&img?`<img class="sm-ev-img" src="${esc(img)}" alt="">`:''}
        ${!narrative?`<div class="sm-ev-mod">${esc(ev.kicker||options.modName||'시나리오 이벤트')}</div>`:''}
        <h1 class="sm-ev-title" id="smEvTitle">${esc(fill(ev.title||ev.id||'이벤트'))}</h1>
        ${sup&&ev.quote?`<blockquote class="sm-ev-quote">${esc(fill(ev.quote))}${ev.quote_author?`<cite>— ${esc(ev.quote_author)}</cite>`:''}</blockquote>`:''}
        <div class="sm-ev-desc">${paragraphs(fill(ev.desc||ev.description||''))}</div>
        <footer class="ce-event-footer ${img?'ce-has-image':''}">${narrative&&img?`<img class="ce-portrait" src="${esc(img)}" alt="">`:''}<div class="sm-ev-opts">${choices.map(({o,i})=>`<button type="button" class="sm-ev-opt" data-i="${i}">${esc(fill(o.text||'확인'))}</button>`).join('')}</div></footer></article>`;
        const before=document.activeElement;let closed=false;
        function close(){if(closed)return;closed=true;ov.remove();document.removeEventListener('keydown',onKey,true);if(current?.element===ov)current=null;if(before?.isConnected)before.focus();}
        function onKey(e){
            e.stopPropagation();
            if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(options.preview)close();}
            if(e.key==='Tab'){
                const buttons=[...ov.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);
                e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();
            }
        }
        ov.querySelectorAll('.sm-ev-opt').forEach(b=>b.onclick=()=>{if(closed)return;const i=+b.dataset.i;close();if(!options.preview)options.onChoose?.(i);});
        ov.querySelector('.ce-preview-close')?.addEventListener('click',close);
        document.body.appendChild(ov);document.addEventListener('keydown',onKey,true);
        ov.querySelector('.sm-ev-opt').focus({preventScroll:true});
        current={element:ov,close};return current;
    }
    window.HemiCampaignEvents={show,dismiss:()=>current?.close()};
})();
