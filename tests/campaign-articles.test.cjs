const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('../js/campaign-articles.js'),T=require('../js/campaign-tools.js');
const state=()=>({focus:{done:{}},articles:{published:{},queue:[]}});
const article=(id,when,extra={})=>({id,when,title:id,body:'News',...extra});
test('campaign articles have independent start, direction, date and conditional triggers',()=>{
 const data={articles:[article('start','start'),article('direction','focus',{focus:'f1'}),article('date','date',{date:'2000-01-02'}),article('condition','condition',{trigger:{flag:'news'}}),article('manual','manual')]},s=state();
 assert.deepEqual(A.due(data,s,()=>false,20000101).map(a=>a.id),['start']);
 s.focus.done.f1=20000101;
 assert.deepEqual(A.due(data,s,()=>true,20000102).map(a=>a.id),['start','direction','date','condition']);
 data.articles[0].trigger={flag:'not-ready'};assert.equal(A.due(data,s,()=>false,20000101).some(a=>a.id==='start'),false);
});
test('one-time publication and unread queue survive save round trips',()=>{
 const s=state(),a=article('one','start');assert.equal(A.publish(s,a,20000101),true);assert.equal(A.publish(s,a,20000101),false);
 const restored=JSON.parse(JSON.stringify(s));assert.deepEqual(restored.articles.queue,['one']);assert.equal(restored.articles.published.one.read,false);
 assert.deepEqual(A.due({articles:[a]},restored,()=>true,20000102),[]);
 restored.articles.published.one.read=true;restored.articles.queue=[];assert.equal(A.publish(restored,a,20000103),false);
});
test('articles are optional for old campaigns; invalid refs and gameplay effects are rejected',()=>{
 const d=T.starter('test');delete d.articles;assert.deepEqual(T.validate(d).filter(i=>i.level==='error'),[]);
 d.articles=[article('story','focus',{focus:'opening'})];assert.deepEqual(T.validate(d).filter(i=>i.level==='error'),[]);
 d.focus[0].article='missing';assert.ok(T.validate(d).some(i=>i.path==='focus.0.article'));delete d.focus[0].article;
 d.articles[0].effects=[{set_flag:'not-allowed'}];assert.ok(T.validate(d).some(i=>i.path==='articles.0.effects'));delete d.articles[0].effects;
 d.articles[0].focus='missing';assert.ok(T.validate(d).some(i=>i.path==='articles.0.focus'));
});
test('direction ID rename also updates article completion trigger',()=>{
 const d=T.starter('test');T.renameFocus(d,'opening','intro');assert.equal(d.articles[0].focus,'intro');assert.deepEqual(T.validate(d).filter(i=>i.level==='error'),[]);
});
