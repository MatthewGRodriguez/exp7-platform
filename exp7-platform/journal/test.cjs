'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const shell=fs.readFileSync(path.join(__dirname,'../exp7-platform-lean.html'),'utf8');
const blocks=[...shell.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
const byName=new Map(blocks.filter(x=>/data-exp7-shared="/.test(x[1])).map(x=>[/data-exp7-shared="([^"]*)"/.exec(x[1])[1],x[2]]));
const byID=new Map(blocks.filter(x=>/\bid="/.test(x[1])).map(x=>[/\bid="([^"]*)"/.exec(x[1])[1],{textContent:x[2],getAttribute(k){return k==='data-enc'?(/data-enc="([^"]*)"/.exec(x[1])||[])[1]:null;}}]));
const dom={querySelector(){return null;},querySelectorAll(){return [];},getElementById(id){return byID.get(id)||null;},addEventListener(){},createElement(){return {style:{},addEventListener(){},setAttribute(){},appendChild(){},classList:{contains(){return false;}}};},body:{classList:{contains(){return false;}}}};
const c={console,performance,WebAssembly,TextDecoder,TextEncoder,Uint8Array,Uint32Array,Int32Array,Float32Array,Float64Array,Int16Array,DataView,ArrayBuffer,Buffer,structuredClone,setTimeout,clearTimeout,setInterval,clearInterval,AbortController,document:dom,addEventListener(){},dispatchEvent(){},navigator:{},requestAnimationFrame(){return 0;},cancelAnimationFrame(){},atob:s=>Buffer.from(s,'base64').toString('binary'),btoa:s=>Buffer.from(s,'binary').toString('base64'),esc:s=>String(s),x7:s=>String(s)};c.window=c;c.globalThis=c;c.self=c;vm.createContext(c);
for(const n of ['jfactor','jf-engine','exp7-rank','jbp','atlas','eval','runtime-factory','jrender','view-store','jrviews','exp7-vm','exp7-views','views-host','journal-views']){try{vm.runInContext(byName.get(n),c,{filename:n+'.js'});}catch(e){console.error('loading',n);throw e;}}
(async()=>{
const out={base:'08315726b9a3f5c4da20ecc16d63b9f714116853',checks:[],renderer:'actual shipping JRender Wasm; CPU/DL/input only, no GPU claim'};
function check(name,f){f();out.checks.push(name);}
const core=await c.JRViews.core();c.JRViews.__core=()=>core;
const EV=c.Exp7Views,J=c.JRender,T=c.Exp7Journal;
const A=EV.blankMoneyAtlas();EV.normalizeDemoViews(A);EV.ensureBudgetBoards(A);A.meta.budget=1;
console.log('blank roots',EV.rootsFor(A));
c.__budgetUi={month:'2026-11',day:'2026-11-10',tab:'home',boardTab:'expense'};
const R=EV.rootsFor(A);A.components[R.calId].view.month='2026-11';
const p=A.components[R.planId];p.view.order='given';p.state=p.state||{};p.state.currentStep='first';
function item(id,name,values,more={}){A.items[id]=Object.assign({id,name,values,factors:{},state:{},alts:null,jreq:null,blueprint:null},more);return 'item:'+id;}
item('cover_basic','Basic cover',{amount:128,date:'2026-11-15',type:'expense',category:'Insurance'});
item('cover_full','Full cover',{amount:166,date:'2026-11-18',type:'expense',category:'Insurance'});
item('cover_blocked','Unavailable cover',{amount:200,date:'2026-11-19',type:'expense'});
item('first','Earlier step',{date:'2026-11-02',amount:15,type:'expense'});
item('insurance','Car insurance',{date:'2026-11-15',amount:128,type:'expense'},{alts:{members:['item:cover_basic','item:cover_full','item:cover_blocked'],pref:'item:cover_basic',unavail:['item:cover_blocked'],method:'best'},state:{userPick:'item:cover_basic'},jreq:'item:first'});
item('groceries','Groceries',{date:'2026-11-10',amount:90,type:'expense',category:'Food',time:'12:30'});
item('renewal','Review renewal',{date:'2026-11-10',amount:0,type:'expense'});
item('subscription','Monthly subscription',{date:'2026-10-10',repeat:'monthly',amount:12,type:'expense'});
item('undated','Undated repair',{amount:25,type:'expense'});
A.blueprints.reverse_link={id:'reverse_link',name:'Earlier derived requirement from later chosen item',nodes:[{id:'read',type:'item',p:{item:'item:insurance',field:'amount'}},{id:'write',type:'item',p:{item:'item:first',field:'reqText'}}],wires:[{from:['read','value'],to:['write','set']}]};
const refs=['item:first','item:insurance','item:groceries','item:renewal','item:subscription','item:undated'];
p.items=refs.slice();A.components[R.calId].items=refs.filter(r=>r!=='item:undated');A.components[A.meta.boardIds.expense].items=refs.slice();
function context(root){return {id:'test-home',atlasW:A,root,plan:root[0]===R.plan[0],open:{},vmInfo:{},journalDay:'2026-11-10',journalMonth:'2026-11'};}
let S=c.startRuntime(A,[...R.calendar,...R.plan,'comp:'+A.meta.boardIds.expense],null,()=>{},c.livePins(A));await S.ready;
console.log('runtime errors',S.errs);check('actual runtime settles without errors',()=>assert.equal(S.errs.length,0));
const models={calendar:T.model(context(R.calendar),S,'calendar'),agenda:T.model(context(R.calendar),S,'agenda'),plan:T.model(context(R.plan),S,'plan'),ledger:T.model(context(['comp:'+A.meta.boardIds.expense]),S,'ledger')};
function journal(m){return m.kids.find(n=>n.t==='journal');}
check('universal builders select compact journal presentations',()=>Object.entries(models).forEach(([k,m])=>assert.equal(journal(m).kind,k)));
const layouts={};
for(const [k,m] of Object.entries(models)){const L=c.Exp7VM.layout(m,400);layouts[k]=L;const bytes=c.JRViews.fullDL(L,400,L.H).bytes(),sc=core.createScene(400,L.H,1);sc.load(bytes);check(k+' JRDL loads actual Wasm and creates geometry',()=>assert(sc.buf(0).length>0));sc.free();}
check('recurring item occurs in current mini-month and agenda',()=>{assert(journal(models.calendar).by['2026-11-10'].some(e=>e.id==='subscription'));assert(journal(models.agenda).entries.some(e=>e.id==='subscription'));});
check('agenda does not invent times for undated-time entries',()=>{assert(layouts.agenda.texts.some(t=>t.text==='No time set'));assert(journal(models.agenda).entries.find(e=>e.id==='renewal').values.time==null);});
check('ledger amounts share a right-aligned column',()=>assert(layouts.ledger.texts.filter(t=>t.right!=null).every(t=>t.right===400)));
check('past due date is not represented as proof of payment',()=>assert(!layouts.ledger.texts.some(t=>/paid/i.test(t.text))));
check('unavailable alternatives are excluded',()=>assert.equal(journal(models.plan).rows.find(r=>r.id==='insurance').choices.length,2));
check('selected option is idempotent, not a toggle',()=>assert.equal(T.selectionOps(A,'insurance','item:cover_basic').length,0));
check('blocked/foreign alternatives cannot be proposed',()=>{assert.throws(()=>T.selectionOps(A,'insurance','item:cover_blocked'));assert.throws(()=>T.selectionOps(A,'insurance','item:first'));});
const earlierBefore=journal(models.plan).rows.find(r=>r.id==='first').req; assert.equal(earlierBefore,128);
const before=JSON.parse(JSON.stringify(A));const ops=T.selectionOps(A,'insurance','item:cover_full');
check('selection writes only userPick, not Best/current/financial history',()=>{assert.equal(ops.length,1);assert.equal(ops[0].path,'items/insurance/state/userPick');assert.equal(ops[0].op,'ref');assert.equal(p.state.currentStep,'first');assert.deepEqual(A,before);});
A.items.insurance.state.userPick='item:cover_full';A.rev=(A.rev||0)+1;S.dispose();S=c.startRuntime(A,[...R.calendar,...R.plan,'comp:'+A.meta.boardIds.expense],null,()=>{},c.livePins(A));await S.ready;
const updated={calendar:T.model(context(R.calendar),S,'calendar'),plan:T.model(context(R.plan),S,'plan'),ledger:T.model(context(['comp:'+A.meta.boardIds.expense]),S,'ledger')};
check('actual runtime re-evaluates selected date and amount across views',()=>{const cm=journal(updated.calendar);assert((cm.by['2026-11-18']||[]).some(e=>e.id==='insurance'));assert(!(cm.by['2026-11-15']||[]).some(e=>e.id==='insurance'));assert.equal(journal(updated.ledger).rows.find(r=>r.id==='insurance').amount,166);assert.equal(journal(updated.plan).rows.find(r=>r.id==='insurance').when,'2026-11-18');});
check('later selection recomputes an EARLIER derived row and keeps current context',()=>{assert.equal(journal(updated.plan).rows.find(r=>r.id==='first').req,166);assert.notEqual(journal(updated.plan).rows.find(r=>r.id==='first').req,earlierBefore);assert.equal(journal(updated.plan).rows.length,refs.length);assert(journal(updated.plan).rows.find(r=>r.id==='first').current);assert.equal(A.items.first.values.amount,15);assert.equal(p.state.currentStep,'first');});
const empty=T.overlay(1200,1000,null,core),os=core.createScene(1200,1000,1);os.load(empty.dl);
check('empty native overlay really falls through (hit and scroll)',()=>{assert.equal(os.hit(20,20),null);assert.equal(os.scrollAt(20,20),null);});
const popup={rect:[100,200,230],choices:journal(updated.plan).rows.find(r=>r.id==='insurance').choices,selected:'item:cover_full',active:1};
const ov=T.overlay(1200,1000,popup,core);os.load(ov.dl);console.log('overlay probes',os.hit(110,215),os.hit(210,415),os.hit(110,245));
check('popup native hits stay inside the menu, not double-translated',()=>{assert.equal(os.hit(110,215),1000);assert.equal(os.hit(110,245),1001);assert.equal(os.hit(20,20),null);assert.equal(os.hit(210,415),null);});
check('popup outside area remains non-scrollable',()=>assert.equal(os.scrollAt(20,20),null));
os.free();S.dispose();
// These are real controller/Renderer input + Wasm tests. ONLY the GPU transport and DOM are test doubles.
function element(tag){const listeners=new Map();return {tagName:tag,style:{},children:[],clientWidth:1600,tabIndex:0,attrs:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]},appendChild(n){n.parent=this;this.children.push(n);return n;},remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);},querySelector(q){return this.children.find(n=>q==='.'+n.className)||null;},addEventListener(k,f,o={}){let a=listeners.get(k)||[];a.push({f,capture:!!o.capture,signal:o.signal});listeners.set(k,a);},removeEventListener(k,f){listeners.set(k,(listeners.get(k)||[]).filter(q=>q.f!==f));},dispatchEvent(e){e.target=this;e.preventDefault=()=>e.defaultPrevented=true;e.stopImmediatePropagation=()=>e.stopped=true;for(const v of [...(listeners.get(e.type)||[])].sort((a,b)=>b.capture-a.capture)){if(!v.signal?.aborted)v.f(e);if(e.stopped)break;}return !e.defaultPrevented;},getBoundingClientRect(){return {left:0,top:0,width:parseFloat(this.style.width)||1600,height:parseFloat(this.style.height)||1000};},focus(){this.focused=true;}};}
dom.createElement=element;dom.addEventListener=element('document').addEventListener;dom.removeEventListener=()=>{};
c.Event=class{constructor(type){this.type=type;}};c.CustomEvent=class extends c.Event{};
c.ResizeObserver=class{constructor(cb){this.cb=cb;}observe(el){this.el=el;}disconnect(){this.disconnected=true;}};
c.JRViews.boot=async()=>{};c.JRViews.gc=()=>null;
J.Renderer.init=async function(o){const r=new J.Renderer();Object.assign(r,{c:o.canvas,core:o.core,entries:[],fields:[],raf:0,bud:{ms:0},dpr:1,transportDraws:0});r.gpuScene=s=>{s.gpu={r,free(){}};};r.createScene=(w,h)=>{const s=core.createScene(w,h,r.dpr);r.gpuScene(s);return s;};r.resize=function(w,h,d){this.cw=w;this.chh=h;this.dpr=d;for(const q of this.entries)q.scene.resize(q.w,q.h,d);};r.request=()=>{};r.draw=()=>++r.transportDraws;r.destroy=function(){if(this.attached)this.attached();this.entries=[];this.destroyed=true;};return r;};
let proposals=0,navigations=[];
const host=element('host');host.id='journal-e2e';
const h=T.mount({host,atlas:A,onNavigate:(...args)=>navigations.push(args),onPropose:async ops=>{proposals++;for(const op of ops){const ps=op.path.split('/');let v=A;for(const k of ps.slice(0,-1))v=v[k]||(v[k]={});v[ps.at(-1)]=op.value;}A.rev=(A.rev||0)+1;return {ok:true};}});
await h.ready;
if(h.error)throw Error(h.error);
check('actual Home controller composes six real native store scenes',()=>{assert.equal(h.r.entries.length,6);assert.equal(h.r.entries.at(-1).hit,'fallthrough');assert(h.painted);assert.equal(h.store.catalog.resources.fonts.length,2);});
const fonts=h.store.catalog.resources.fonts.map(f=>f.slot);
function click(x,y){for(const type of ['pointerdown','pointerup'])h.cv.dispatchEvent({type,clientX:x,clientY:y,buttons:type==='pointerdown'?1:0,pointerId:1,pointerType:'mouse'});}
const picker=h.targets.find(t=>t.node.vm.act==='picker:insurance');
click(picker.rect[0]+8,picker.rect[1]+10);
check('real Renderer pointer dispatch opens selector without full Plan navigation',()=>{assert(h.popup);assert.equal(navigations.length,0);assert.equal(h.r.pick(h.popup.rect[0]+10,h.popup.rect[1]+15)[0],h.views.selector.scene);});
const pr=h.popup.rect;
click(pr[0]+10,pr[1]+15); // switch full cover back to basic
await new Promise(resolve=>setImmediate(resolve));await h.chain;
check('actual native menu selection commits once, closes and refreshes all models',()=>{assert.equal(proposals,1);assert.equal(A.items.insurance.state.userPick,'item:cover_basic');assert.equal(h.popup,null);assert.equal(navigations.length,0);assert.equal(journal(h.models.ledger).rows.find(r=>r.id==='insurance').amount,128);assert.equal(journal(h.models.plan).rows.find(r=>r.id==='first').req,128);assert.equal(A.components[R.planId].state.currentStep,'first');});
click(picker.rect[0]+8,picker.rect[1]+10);
const ledgerNav=h.targets.find(t=>t.node.vm.act==='nav:ledger');
click(ledgerNav.rect[0]+10,ledgerNav.rect[1]+10);
check('outside click dismisses menu without leaking through to full-view navigation',()=>{assert.equal(h.popup,null);assert.equal(navigations.length,0);assert.equal(proposals,1);});
for(const kind of ['calendar','plan','agenda','ledger']){const t=h.targets.find(t=>t.node.vm.act==='nav:'+kind);click(t.rect[0]+10,t.rect[1]+(kind==='calendar'?t.rect[3]-4:10));}
check('four mini-view headings dispatch their own full-view navigation',()=>assert.deepEqual(navigations.map(n=>n[0]),['calendar','plan','agenda','ledger']));
h.focusKey=null;function key(k,shift=false){const e={key:k,shiftKey:shift,preventDefault(){this.prevented=true;}};h.key(e);return e;}
check('Tab creates a real native focus outline and Escape dismisses without selection',()=>{assert(key('Tab').prevented);assert(h.focusKey);h.focusKey=picker.key;key('Enter');assert(h.popup);assert(key('ArrowDown').prevented);key('Escape');assert.equal(h.popup,null);assert.equal(proposals,1);});
// Cost model checks: charges, not a naive repeated full amount.
item('split','Split payment',{date:'2026-11-01',repeat:'monthdays',on:'01,15',amount:100,type:'expense'});
item('final','Final instalment',{date:'2026-10-01',repeat:'monthly',until:'2026-11-01',amount:100,lastAmount:40,type:'expense'});
item('income','Salary',{date:'2026-11-04',amount:2800,type:'income',flow:'in'});
A.components[A.meta.boardIds.expense].items.push('item:split','item:final');A.components[A.meta.boardIds.income].items=['item:income'];
await h.update();const lm=journal(h.models.ledger);
check('ledger uses actual charge allocation/final-payment rules and real income board',()=>{const ss=lm.rows.filter(r=>r.id==='split');assert.equal(ss.length,2);assert.equal(ss.reduce((n,r)=>n+r.amount,0),100);assert.equal(lm.rows.find(r=>r.id==='final').amount,40);assert.equal(lm.rows.find(r=>r.id==='income').type,'income');});
// Journal full-view and shared picker extension tests.
function scan(n,fn){if(!n||typeof n!=='object')return;fn(n);for(const k of ['kids','rows','cells'])for(const q of n[k]||[])scan(q,fn);if(n.sub)scan(n.sub,fn);}
function contract(m){let a=[];scan(m,n=>{if(n.act||n.rt||n.tf)a.push(JSON.stringify({act:n.act,rt:n.rt,tf:n.tf,disabled:n.disabled}));});return a;}
function saveFull(label,L,w=1200){const sc=core.createScene(w,L.H,1);sc.load(c.JRViews.fullDL(L,w,L.H));assert(sc.buf(0).length);const dir=path.join(__dirname,'qa-mesh',label);fs.mkdirSync(dir,{recursive:true});for(const i of [0,1,3])fs.writeFileSync(path.join(dir,'0-'+i+'.bin'),sc.buf(i));fs.writeFileSync(path.join(dir,'slots.json'),JSON.stringify({width:w,height:L.H,slots:[{name:label,x:0,y:0,w,h:L.H}]},null,2));sc.free();}
const cases=[['calendar-month',context(R.calendar)],['calendar-day',context(R.calendar)],['calendar-year',context(R.calendar)],['calendar-form',context(R.calendar)],['board-expense-expanded',Object.assign(context(['comp:'+A.meta.boardIds.expense]),{open:{insurance:true}})],['board-expense-values',Object.assign(context(['comp:'+A.meta.boardIds.expense]),{form:{kind:'values',item:'groceries'}})],['plan-full',context(R.plan)],...['expense','income','debt','asset'].map(t=>['board-'+t,context(['comp:'+A.meta.boardIds[t]])])];
c.calNavOf(cases[1][1]).level='day';c.calNavOf(cases[1][1]).day='2026-11-10';c.calNavOf(cases[2][1]).level='year';c.calNavOf(cases[2][1]).year=2026;cases[3][1].form={kind:'caladd',itemId:'groceries'};
const fullViews={};
for(const [label,V]of cases){c.__budgetUi.tab=label.startsWith('calendar')?'cal':label.startsWith('board')?'brd':'plan';c.__budgetUi.boardTab=label.replace('board-','');let decorate=T.fullModel;T.fullModel=m=>m;let original;try{original=c.buildModel(V,h.session);}finally{T.fullModel=decorate;}
  const m=c.buildModel(V,h.session),L=c.Exp7VM.layout(m,1200),before=contract(original),after=contract(m);
  check(label+' keeps all original native action/field/runtime contracts',()=>{for(const q of before)assert(after.includes(q),label+' missing '+q);assert(m.journalFull);assert.equal(m.tokens.journal,1);});
  check(label+' emits native geometry without slab/shadow nodes or KPI strip',()=>{assert(!L.nodes.some(n=>n.slabKind));assert(!L.nodes.some(n=>/\/f:(surplus|ddi|net income|living cost|net worth)/.test(n.key)));assert(L.nodes.filter(n=>/:sh$/.test(n.key)).every(n=>!n.items.length));assert(L.nodes.every(n=>!n.mo||n.mo==='cell'));saveFull(label,L);});fullViews[label]={V,m,L};
}
check('full-view button labels use glyphs present in the actual native font slots',()=>{let missing=[];for(const [label,{L}]of Object.entries(fullViews))for(const n of L.nodes){if(n.vm?.t!=='btn')continue;let font=n.vm.on||n.vm.kind==='primary'?c.JRViews.fontBold():c.JRViews.font();for(const ch of n.vm.label)if(!core.hasGlyph(font,ch.codePointAt(0)))missing.push([label,n.key,ch]);}assert.deepEqual(missing,[]);});
check('journal skin leaves non-journal native controls unchanged',()=>{const m={__vm:true,kids:[c.Exp7VM.btn('plain','Outside Budget','noop')],tokens:{}};const L=c.Exp7VM.layout(m,300);assert(L.nodes.some(n=>n.items.some(it=>it[0]==='rrect')));});
c.__budgetUi.tab='home';c.__budgetUi.boardTab='expense';
check('full expense amounts form one right-aligned native column',()=>{const L=fullViews['board-expense'].L;const amounts=L.nodes.filter(n=>n.vm&&n.vm.k==='journal-amount');assert(amounts.length>=6);const right=amounts.map(n=>n.items.map(i=>i[0]==='rich'?i[1]+core.richLayout(i[3],{font:c.JRViews.font(),boldFont:c.JRViews.fontBold(),maxw:i[4],lineHeight:i[5]}).width:0).find(Boolean));assert(right.every(x=>Math.abs(x-right[0])<1));});
// Run the exact embedded app's date action handler, with only the DOM redraw
// boundary replaced; stampBudgetMonth itself is the real app function.
const consumer=fs.readFileSync(path.join(__dirname,'budget-consumer.html'),'utf8');
function extractBlock(start){let p=consumer.indexOf(start),i=consumer.indexOf('{',p),depth=0,j=i;for(;j<consumer.length;j++){if(consumer[j]==='{')depth++;if(consumer[j]==='}'&&!--depth)break;}return consumer.slice(p,j+1);}
const stamps=extractBlock('  function stampBudgetMonth(month)');let liveFull=null,redraws=0;
c.__testAtlas=A;c.__testRedraw=()=>{redraws++;if(liveFull){const {v,V}=liveFull;v.journalDocument=c.buildModel(V,h.session);v.L=c.Exp7VM.layout(v.journalDocument,1200);v.L.W=1200;v.L.VH=Math.min(620,v.L.H);v.s.load(c.JRViews.fullDL(v.L,1200,v.L.VH));v.byId=new Map(v.L.nodes.map(n=>[n.id,n]));}h.update();};
vm.runInContext('(function(){var W=__testAtlas;'+stamps+';function redrawChromeViews(){__testRedraw();}'+extractBlock('  window.__budgetChromeAct = function (a)')+';})();',c);
function move(x,y){h.cv.dispatchEvent({type:'pointermove',clientX:x,clientY:y,buttons:0,pointerId:1,pointerType:'mouse'});}
const dates=h.targets.filter(t=>t.node.vm.hoverDate);
check('Home and mini-month have two distinct native picker targets',()=>assert.equal(dates.length,2));
for(const t of dates){move(t.rect[0]+6,t.rect[1]+8);check(t.kind+' heading hover opens the shared native calendar tree',()=>{assert.equal(h.popup.kind,'date');assert.equal(h.popup.anchorKey,t.key);assert.equal(navigations.length,4);assert(h.overlayNodes.some(n=>n.vm?.act==='budget:pick:today'));assert(h.overlayNodes.some(n=>n.vm?.act==='budget:pickday:2026-11-10'));});
  const r=h.popup.rect;move(r[0]+12,r[1]-2);await new Promise(r=>setTimeout(r,250));check(t.kind+' pointer bridge keeps picker reachable',()=>assert.equal(h.popup?.kind,'date'));
  move(r[0]+80,r[1]+80);await new Promise(r=>setTimeout(r,250));check(t.kind+' menu remains open during pointer transfer',()=>assert.equal(h.popup?.kind,'date'));h.close();move(h.W-2,h.H-2);
}
let t=dates[0];move(t.rect[0]+6,t.rect[1]+8);let r=h.popup.rect;
const on=h.overlayNodes.find(n=>n.vm?.act==='budget:pick:1');click(r[0]+on.hit[0]+on.hit[2]/2,r[1]+on.hit[1]+10);await h.chain;
check('picker next month browses without changing selected date or Plan',()=>{assert.equal(h.popup.month,'2026-12');assert.equal(c.__budgetUi.month,'2026-11');assert.equal(c.__budgetUi.day,'2026-11-10');assert.equal(p.state.currentStep,'first');assert.equal(proposals,1);});
r=h.popup.rect;const dec=h.overlayNodes.find(n=>n.vm?.act==='budget:pickday:2026-12-05');click(r[0]+dec.hit[0]+5,r[1]+dec.hit[1]+10);await h.chain;
check('actual native date click uses real app handler, stamps all calendar/boards and closes',()=>{assert.equal(c.__budgetUi.day,'2026-12-05');assert.equal(c.__budgetUi.pick,'');assert.equal(h.popup,null);assert.equal(journal(h.models.calendar).month,'2026-12');for(const id of [R.calId,...Object.values(A.meta.boardIds)])assert.equal(A.components[id].view.month,'2026-12');assert.equal(navigations.length,4);assert.equal(proposals,1);});
t=h.targets.find(t=>t.node.vm.hoverDate);move(t.rect[0]+6,t.rect[1]+8);move(h.W-2,h.H-2);await new Promise(r=>setTimeout(r,260));check('hover menu closes after pointer leaves trigger/menu',()=>{assert.equal(h.popup,null);assert.equal(h.closeTimer,null);});
t=h.targets.find(t=>t.node.vm.hoverDate);h.focusKey=t.key;key('Enter');await key('PageUp');await h.chain;check('keyboard can open picker and browse months without committing',()=>{assert.equal(h.popup.month,'2026-11');assert.equal(c.__budgetUi.day,'2026-12-05');});key('Home');key('ArrowDown');await key('Enter');await h.chain;
check('keyboard day selection commits once through shared app date actions',()=>{assert.equal(c.__budgetUi.day,'2026-11-08');assert.equal(h.popup,null);});
t=h.targets.find(t=>t.node.vm.hoverDate);click(t.rect[0]+6,t.rect[1]+8);check('click/touch pins the picker after hover instead of toggling it away',()=>{assert.equal(h.popup.kind,'date');assert.equal(h.popup.hover,false);});move(h.W-2,h.H-2);await new Promise(r=>setTimeout(r,260));check('pinned picker remains open away from pointer',()=>assert(h.popup));key('Escape');check('Escape clears picker and shared open state',()=>{assert.equal(h.popup,null);assert.equal(c.__budgetUi.pick,'');});
t=h.targets.find(t=>t.node.vm.hoverDate);await h.act('journal:date',t.kind,t.node);const navBefore=navigations.length;click(ledgerNav.rect[0]+20,ledgerNav.rect[1]+20);check('date outside click dismisses without leaking to full view',()=>{assert.equal(h.popup,null);assert.equal(navigations.length,navBefore);});
// Full-view interaction uses actual native layout/hits with the real Renderer
// pointer forwarding (GPU transport double), not a second calendar controller.
c.__budgetUi.tab='cal';const V=fullViews['calendar-month'].V,cv=element('canvas'),v=new c.JRViews.View();v.c=cv;v.L=fullViews['calendar-month'].L;v.L.W=1200;v.L.VH=Math.min(v.L.H,620);cv.style.width='1200px';cv.style.height=v.L.VH+'px';v.byId=new Map(v.L.nodes.map(n=>[n.id,n]));v.r=await J.Renderer.init({canvas:cv,core});v.s=v.r.createScene(1200,v.L.VH);v.s.load(c.JRViews.fullDL(v.L,1200,v.L.VH));v.r.layout([{scene:v.s,x:0,y:0,w:1200,h:v.L.VH}]);v.onact=(_el,_a,n)=>c.__budgetChromeAct(n.vm.act);v.wire();v.r.attach();T.bindFullDate(v,fullViews['calendar-month'].m);liveFull={v,V};v.journalRedraw=c.__testRedraw;
function fullEvent(type,x,y,buttons=0){cv.dispatchEvent({type,clientX:x,clientY:y,buttons,pointerId:2,pointerType:'mouse'});}
function fullClick(n){const r=n.hit,x=r[0]+Math.min(10,r[2]/2),y=r[1]+10;fullEvent('pointerdown',x,y,1);fullEvent('pointerup',x,y,0);}
const early=v.L.nodes.find(n=>n.vm?.hoverDate);fullEvent('pointermove',early.hit[0]+3,early.hit[1]+8);cv.dispatchEvent({type:'pointerleave'});await new Promise(r=>setTimeout(r,130));check('leaving full heading before hover delay cancels pending opening',()=>assert(!c.__budgetUi.pick));
for(const actionKey of ['budget/figs/facts/date','cal:'+R.calId+'/nav/month']){const n=v.L.nodes.find(n=>n.key===actionKey);assert(n);fullEvent('pointermove',n.hit[0]+4,n.hit[1]+8);await new Promise(r=>setTimeout(r,120));await h.chain;
  check(actionKey+' full-view heading opens native hover picker at its anchor',()=>{assert(c.__budgetUi.pick);assert.equal(V.journalPickAnchor,actionKey);assert(v.L.nodes.some(n=>n.pop&&n.vm?.act==='budget:pick:today'));});saveFull('calendar-date-picker',v.L);
  fullClick(v.L.nodes.find(n=>n.key===actionKey));check('full-view hover picker click pins without closing',()=>assert(c.__budgetUi.pick));
  const popupNode=v.L.nodes.find(n=>n.pop&&n.vm?.act==='budget:pickday:2026-11-12');fullClick(popupNode);await h.chain;check('full native day hit commits date and clears shared picker',()=>{assert.equal(c.__budgetUi.day,'2026-11-12');assert.equal(c.__budgetUi.pick,'');});
}
cv.dispatchEvent({type:'keydown',key:'Tab',shiftKey:false});cv.dispatchEvent({type:'keydown',key:'Enter'});await h.chain;check('full-view keyboard opens shared date picker',()=>assert(c.__budgetUi.pick));cv.dispatchEvent({type:'keydown',key:'ArrowRight'});cv.dispatchEvent({type:'keydown',key:'Enter'});await h.chain;check('full-view keyboard selects day through existing app handler',()=>assert.equal(c.__budgetUi.day,'2026-11-13'));
cv.dispatchEvent({type:'keydown',key:'Enter'});await h.chain;cv.dispatchEvent({type:'keydown',key:'Escape'});check('full-view Escape closes without changing selected day',()=>{assert.equal(c.__budgetUi.pick,'');assert.equal(c.__budgetUi.day,'2026-11-13');});
// All cleanup belongs to renderer/host teardown, with no orphan hover timers.
liveFull=null;c.__budgetUi.tab='home';v.s.free();v.r.destroy();check('full-view teardown aborts listeners and hover timers',()=>assert(v.journalAbort.signal.aborted));
c.__budgetChromeAct('budget:pickday:2026-11-10');await h.chain;const todayTarget=h.targets.find(t=>t.node.vm.hoverDate);await h.act('journal:date',todayTarget.kind,todayTarget.node);await h.dateAct('budget:pick:today');check('Today uses real app clock, updates shared date and closes',()=>{assert.equal(c.__budgetUi.day,c.budgetTodayKey());assert.equal(h.popup,null);});c.__budgetChromeAct('budget:pickday:2026-11-10');await h.chain;

// Preserve the user's current step when long plans need a compact window.
for(let i=0;i<80;i++){const id='long'+i;item(id,'Additional step '+i,{date:'2026-11-20',amount:1,type:'expense'});p.items.push('item:'+id);A.components[A.meta.boardIds.expense].items.push('item:'+id);}
p.state.currentStep='long70';await h.update();
check('large mini views remain bounded and include the actual current step',()=>{assert(h.H<1800);assert(h.layouts.plan.texts.some(t=>t.text.includes('Additional step 70')));assert(h.layouts.ledger.texts.some(t=>t.text.includes('more in full expenses')));assert(h.layouts.plan.texts.some(t=>t.text.includes('earlier steps')));});
host.clientWidth=1000;await h.update();
check('resize and repeated updates retain scenes, font slots and valid native targets',()=>{assert.equal(h.W,1000);assert.equal(h.r.entries.length,6);assert.deepEqual(h.store.catalog.resources.fonts.map(f=>f.slot),fonts);assert(h.targets.every(t=>t.rect.every(Number.isFinite)));assert.equal(h.error,'');});
// Export copies of actual native buffers for a labelled CPU geometry preview, not a GPU screenshot.
function saveMeshes(label){const outdir=path.join(__dirname,'qa-mesh',label);fs.mkdirSync(outdir,{recursive:true});const slots=[];for(const [i,e]of h.r.entries.entries()){const q={name:Object.keys(h.views).find(k=>h.views[k].scene===e.scene),x:e.x,y:e.y,w:e.w,h:e.h};for(const n of [0,1,3])fs.writeFileSync(path.join(outdir,`${i}-${n}.bin`),e.scene.buf(n));slots.push(q);}fs.writeFileSync(path.join(outdir,'slots.json'),JSON.stringify({width:h.W,height:h.H,slots},null,2));}
// Restore small illustrative fixture for previews; never embed it in the actual consumer.
p.items=refs.slice();A.components[A.meta.boardIds.expense].items=refs.slice();A.components[A.meta.boardIds.income].items=['item:income'];p.state.currentStep='first';host.clientWidth=1600;await h.update();saveMeshes('closed');const pt=h.targets.find(t=>t.node.vm.act==='picker:insurance');await h.act(pt.node.vm.act,pt.kind,pt.node);saveMeshes('open');h.close();const dt=h.targets.find(t=>t.node.vm.hoverDate);h.focusKey=null;h.openDate(dt.node,true);saveMeshes('home-date-picker');h.close();
const E=EV.blankMoneyAtlas();EV.normalizeDemoViews(E);EV.ensureBudgetBoards(E);E.meta.budget=1;await h.update(E);check('empty real Budget atlas draws explicit empty states without invented finances',()=>{assert(h.layouts.plan.texts.some(t=>t.text==='No plan steps yet.'));assert.equal(journal(h.models.ledger).rows.length,0);assert(h.painted&&!h.error);});
check('updated shipping scripts and embedded Budget consumer parse as JavaScript',()=>{for(const b of blocks.filter(b=>/data-exp7-shared=/.test(b[1])&&!/\btype="(?!text\/javascript|application\/javascript)[^"]+"/.test(b[1])))new vm.Script(b[2],{filename:/data-exp7-shared="([^"]*)"/.exec(b[1])[1]});const html=fs.readFileSync(path.join(__dirname,'budget-consumer.html'),'utf8');for(const [i,b]of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries()){if(!/type=/.test(b[1]))new vm.Script(b[2],{filename:'budget-consumer-'+i});}assert.equal(typeof c.calNavOf,'function');assert.equal(typeof c.calSelOf,'function');});
const sceneHandles=Object.values(h.views).map(v=>v.scene);const cleanupDate=h.targets.find(t=>t.node.vm.hoverDate);h.openDate(cleanupDate.node,true);h.deferClose();assert(h.closeTimer);h.dispose();
check('dispose frees all six native scenes, observers and proposal hook',()=>{assert(sceneHandles.every(s=>!s.h));assert(h.resize.disconnected);assert(h.r.destroyed);assert.equal(h.closeTimer,null);assert.equal(c.__budgetUi.pick,'');assert(!c.__exp7ViewsPropose[host.id]);});

fs.writeFileSync(path.join(__dirname,'test-results.json'),JSON.stringify(out,null,2));fs.writeFileSync(path.join(__dirname,'fixture-models.json'),JSON.stringify(models,null,2));
console.log(JSON.stringify(out,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
