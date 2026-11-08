function mkBudgetAtlas(){
  const w={id:'budget_atlas',rev:1000,owner:{},pathRev:{},clock:{joy:'syn_clock',ms:1000,on:false},
    items:{},joys:{syn_clock:{id:'syn_clock',name:'Clock',value:0}},components:{},blueprints:{}};
  const MM=window.JAtlasModel; const now=new Date(); const month=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  const T=(MM.moneyCalendarTemplate||MM.calendarTemplate)(w,'Budget',month); const cid=r=>r.slice(5);
  const cal=w.components[cid(T.cal)], brd=w.components[cid(T.board)], pln=w.components[cid(T.plan)];
  cal.view.switch=false; cal.view.group=[]; cal.state.show=null; cal.sub=[];
  const th={tokens:{bg:'#ffffff',fg:'#1c2333',accent:'#1f4b7a'}};
  Object.values(w.components).forEach(c=>{ if(c.view) c.view.theme=th; });
  cal.name='Budget · Calendar'; brd.name='Budget · Board'; if(pln) pln.name='Budget · Plan';
  brd.view.item={show:['date','type','amount']}; brd.state=brd.state||{}; brd.state.budgetType='expense';
  w.joys.priority_pool={id:'priority_pool',name:'Priority pool',value:0,jtype:'ranking',rangeMin:0,rangeMax:100,inv:false};
  w.joys.attention_pool={id:'attention_pool',name:'Attention pool',value:0,jtype:'ranking',rangeMin:0,rangeMax:10,inv:false};
  // Plan tab roots deps layout on reqs (same as Exp7 demo)
  if(!w.components.reqs){
    w.components.reqs={id:'reqs',name:'Budget plan sequence',view:{layout:'deps',title:'Dependencies & sequence',theme:th,item:{show:[]},states:{}},items:[],blueprints:[],state:{},sub:[]};
  } else { w.components.reqs.view=w.components.reqs.view||{}; w.components.reqs.view.theme=th; }
  cal.items=[]; brd.items=[]; w.components.reqs.items=[];
  w.items.getthere={id:'getthere',name:'(internal ranking group)',values:{},state:{userPick:null},alts:{members:[],pref:null,unavail:[],method:'best'},factors:{},jreq:null,blueprint:null};
  w.meta={budget:1,label:'blank',note:'Blank Budget worksheet — not inferred personal finances.',calId:cal.id,boardId:brd.id,planId:pln&&pln.id};
  return w;
}
function harmonicSharesBudget(joy){
  const jid=joy.id, inv=!!joy.inv; const L=[];
  Object.keys(W.items).forEach((id,i)=>{ const it=W.items[id]; if(!it||(it.values||{}).kind==='resource') return;
    const r=(it.values&&it.values.ranks&&it.values.ranks[jid]); if(!r) return;
    if(r.onFactor===false||r.onFactor===0) return; const p=Number(r.pos)||0; if(!(p>0)) return; L.push({it,id,p,i}); });
  L.sort((a,b)=>(a.p-b.p)||(a.i-b.i)); const n=L.length, pool=(Number(joy.rangeMax)||0)-(Number(joy.rangeMin)||0);
  if(!n) return {list:[],shares:{},portions:{},pool,sumW:0,n:0,inv};
  let sumW=0; L.forEach((x,i)=>{ x.rank=i+1; x.w=1/(inv?Math.max(1,n-i):(i+1)); sumW+=x.w; });
  const shares={}, portions={}; L.forEach(x=>{ const s=sumW>0?x.w/sumW:0; shares[x.id]=s; portions[x.id]=s*pool; x.share=s; x.portion=s*pool; });
  return {list:L,shares,portions,pool,sumW,n,inv};
}
const BUDGET_DBN='budget-app-v1';
function budgetDb(){return new Promise((res,rej)=>{const q=indexedDB.open(BUDGET_DBN,1);q.onupgradeneeded=()=>{const d=q.result;if(!d.objectStoreNames.contains('kv'))d.createObjectStore('kv')};q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)})}
async function persistBudgetAtlas(){try{const d=await budgetDb(); await new Promise((res,rej)=>{const t=d.transaction('kv','readwrite'); const store=t.objectStore('kv');
  const payload={atlas:JSON.parse(JSON.stringify(W)),at:Date.now()};
  store.put(payload,'atlasState');
  // Only mirror into 'state' when it is missing or already atlas-shaped — never overwrite stub worksheet bytes.
  const g=store.get('state'); g.onsuccess=()=>{ const cur=g.result; if(!cur || cur.atlas) store.put(payload,'state'); };
  t.oncomplete=()=>res(); t.onerror=()=>rej(t.error);});}catch(e){}}
async function restoreBudgetAtlas(){try{const d=await budgetDb();
  const get=k=>new Promise((res,rej)=>{const g=d.transaction('kv','readonly').objectStore('kv').get(k); g.onsuccess=()=>res(g.result||null); g.onerror=()=>rej(g.error);});
  // Prefer atlasState so a prior stub worksheet under key 'state' is never clobbered/destroyed.
  let st=await get('atlasState'); if(st&&st.atlas) return st;
  st=await get('state');
  if(st&&st.atlas) return st; // prior shared-engine format
  // leftover stub {items,joys,version} — leave intact; start blank Budget atlas
  return null;
}catch(e){return null}}
let __plannerAtlasSnap=null; let __appMode='exp7'; window.__appMode=__appMode;

const __exp7ViewRoots={CAL:'comp:trip_calendar',BRD:'comp:trip_calendar_board',PLN:'comp:trip_calendar_plan'};
function applyBudgetViewRoots(){
  // Retarget Exp7 host VIEWS to money/budget component ids from live atlas
  const calId=(W.meta&&W.meta.calId)||'budget';
  const brdId=(W.meta&&W.meta.boardId)||'budget_board';
  try{
    // CAL/BRD are const bindings in this scope — mutate VIEWS object instead
    VIEWS.cal={root:['comp:'+calId],pre:['items/','components/'+calId+'/']};
    VIEWS.brd={root:['comp:'+brdId],pre:['components/'+brdId+'/','items/']};
    VIEWS.plan={root:['comp:reqs'],pre:['items/','components/reqs/']};
  }catch(e){ console.warn('applyBudgetViewRoots',e); }
}
function applyExp7ViewRoots(){
  try{
    VIEWS.cal={root:[__exp7ViewRoots.CAL],pre:['items/','components/trip_calendar/']};
    VIEWS.brd={root:[__exp7ViewRoots.BRD],pre:['components/trip_calendar_board/','items/']};
    VIEWS.plan={root:['comp:reqs'],pre:['items/','components/reqs/']};
  }catch(e){}
}
function __modeHost(){ return document.getElementById('appSlot-exp7') || document.body; }
async function enterBudgetMode(){
  if(__appMode==='budget'){ applyBudgetViewRoots(); paintTabs(); show('cal'); try{renderViews()}catch(e){} return {ok:true,reused:true}; }
  if(__appMode==='exp7') __plannerAtlasSnap=JSON.parse(JSON.stringify(W));
  let st=await restoreBudgetAtlas(); replaceW((st&&st.atlas)||mkBudgetAtlas()); applyBudgetViewRoots();
  document.body.classList.add('budget-mode');
  const host=__modeHost(); if(host) host.setAttribute('data-app-mode','budget');
  __appMode='budget'; window.__appMode=__appMode; paintTabs();
  show('cal'); try{renderViews()}catch(e){}
  try{ window.dispatchEvent(new CustomEvent('budget-app-signal',{detail:{source:'budget-app',type:'budget-app-ready',renderReady:true,mode:'budget'}})); }catch(e){}
  if(window.__budgetPub) __budgetPub({source:'budget-app',type:'budget-app-ready',renderReady:true,mode:'budget'});
  return {ok:true};
}
async function enterExp7Mode(){
  if(__appMode==='exp7' && !document.body.classList.contains('budget-mode')){ try{renderViews()}catch(e){} return {ok:true,reused:true}; }
  if(__appMode==='budget') await persistBudgetAtlas();
  if(__plannerAtlasSnap) replaceW(__plannerAtlasSnap); applyExp7ViewRoots();
  document.body.classList.remove('budget-mode');
  const host=__modeHost(); if(host) host.removeAttribute('data-app-mode');
  __appMode='exp7'; window.__appMode=__appMode; paintTabs();
  show((location.hash||'#atlas').slice(1).replace(/[^a-z]/g,'')||'atlas');
  try{renderViews()}catch(e){}
  try{ window.dispatchEvent(new CustomEvent('exp7-app-signal',{detail:{source:'exp7-app',type:'exp7-app-ready',renderReady:true,mode:'exp7'}})); }catch(e){}
  return {ok:true};
}
function budgetBoardId(){ return (W.meta&&W.meta.boardId)||'budget_board'; }
function budgetCalId(){ return (W.meta&&W.meta.calId)||'budget'; }
function boardTypeBar(){
  if(!document.body.classList.contains('budget-mode')) return '';
  const st=((W.components[budgetBoardId()]||{}).state)||{}; const cur=st.budgetType||'expense';
  const types=[['expense','Expenses'],['income','Income'],['debt','Debt'],['asset','Assets'],['all','All']];
  return '<div id="budgetTypeBar">'+types.map(([id,lab])=>'<button type="button" data-budget-type="'+id+'" class="'+(cur===id?'on':'')+'">'+lab+'</button>').join('')+
    ' <button type="button" id="budgetLoadExamples">Load labeled examples</button> <button type="button" id="budgetResetBlank">Reset blank</button></div>'+
    '<p class="muted">Real <span class="mono">boardHtml</span> with Budget type filter via <span class="mono">state.budgetType</span>.</p>';
}
function budgetRankPanel(){
  if(!document.body.classList.contains('budget-mode')) return '';
  const joys=Object.values(W.joys||{}).filter(j=>j&&(j.jtype==='ranking'||j.type==='ranking'));
  let h='<div id="budgetRankPanel"><b>Ranking joys</b> <span class="muted">(harmonic 1/r shares × pool; not dollars)</span>';
  joys.forEach(j=>{ const hs=harmonicSharesBudget(j);
    h+='<div style="margin-top:8px"><b>'+esc(j.name)+'</b> <span class="muted">'+esc(j.rangeMin)+'…'+esc(j.rangeMax)+' · n='+hs.n+'</span>';
    if(!hs.n) h+='<div class="muted">Zero on-factor → shares 0.</div>';
    else h+='<div class="muted">'+hs.list.map(x=>esc(x.it.name)+' '+(x.share*100).toFixed(1)+'% → '+x.portion.toFixed(2)).join(' · ')+'</div>';
    h+='</div>'; });
  return h+'</div>';
}
const _boardRank = null;
function boardRank(){
  if(document.body.classList.contains('budget-mode')) return boardTypeBar()+budgetRankPanel();
  const R=rank(W), B=bestRank(W), sel=selectedAlt(W);
  return '<b>Alternatives ranking (real jbp score + Exp7 '+(R.method==='sim'?'SimulatedBest':'Best')+')</b>: '+R.order.map((o,i)=>`#${i+1} ${esc(W.items[o.ref.slice(5)].name)} <span class="muted">${r2(o.score)}</span>`).join(' › ')
    +(B.pick?` · Best <b>${esc(W.items[B.pick.pick.slice(5)].name)}</b> (${esc(x7(B.pick.why))})`:'')
    +(sel?` · Selected <b>${esc(W.items[sel.ref.slice(5)].name)}</b> (${esc(x7(sel.why))})`:''); }
let RANKHIST=[];
const VIEWS={cal:{root:[CAL],pre:['items/','components/trip_calendar/']},brd:{root:[BRD],pre:['components/trip_calendar_board/','items/']},plan:{root:['comp:reqs'],pre:['items/','components/reqs/']}};
function renderViews(){ Object.keys(VIEWS).forEach(k=>{ const V=VIEWS[k]; if(!$('vf-'+k)) return;
  setView('vf-'+k,W,V.root,J=>{ $('vi-'+k).innerHTML=jvStatus('vf-'+k)+(k==='plan'&&J.n&&!J.err?' · '+esc(J.deps||'—'):''); if(k==='plan') $('vd-plan').innerHTML=planSide('vf-plan'); });
  $('vl-'+k).innerHTML=lastHTML(true); $('vd-'+k).innerHTML=k==='brd'?boardRank()+(RANKHIST.length>1?'<div class="muted">ranking history: '+RANKHIST.slice(-4).map(esc).join(' ⟶ ')+'</div>':''):k==='plan'?planSide('vf-plan'):discHTML(W);
  const rows=flatten(W).filter(x=>(LASTP&&LASTP.paths.indexOf(x.path)>=0)||V.pre.some(p=>x.path.startsWith(p))&&/date|jreq|items$|view\/(sort|filter|month)|state\/(userPick)|joys/.test(x.path));
  $('vp-'+k).innerHTML=ghost(rows)+'<table>'+HEAD(true)+rows.sort((a,b)=>(hlClass(a.path)?0:1)-(hlClass(b.path)?0:1)).map(x=>rowHTML(x,W,true)).join('')+'</table>'; });
  const o=rank(W).order.map(x=>x.ref.slice(5)).join(' › '); if(RANKHIST[RANKHIST.length-1]!==o) RANKHIST.push(o); }
document.addEventListener('click',e=>{ const b=e.target.closest('[data-vp]'); if(!b) return; const k=b.closest('section').id.slice(2), x=VP[k][+b.dataset.vp]; const ent=submit(x[1].map(o=>Object.assign({},o)),'ui:views',k); $('vr-'+k).innerHTML='<div class="muted">'+esc(x[0])+'</div>'+resultHTML(ent); });
Object.keys(VP).forEach(k=>{ if($('vb-'+k)) $('vb-'+k).innerHTML=vbtns(VP[k]); });

function dayTextAudit(id){ const V=JVS[id]; if(!V||!V.view||!V.view.L) return {ok:false,why:'no view'};
  const days=(V.view.L.nodes||[]).filter(n=>n.act==='day'&&n.hit&&n.el);
  const allDrawn=[]; (V.view.L.nodes||[]).forEach(m=>{(m.items||[]).forEach(it=>{ if(it[0]==='tbox'||it[0]==='text') allDrawn.push({key:m.key,kind:it[0],text:String(it[5]||''),size:+it[3]||0,maxw:+(it[6]||0)}); });});
  const corpus=allDrawn.map(t=>t.text).join('\n');
  let bad=0; const sample=[];
  days.forEach(n=>{ const labels=[...n.el.querySelectorAll('.ja-chip,.ja-item')].map(c=>(c.textContent||'').replace(/\s+/g,' ').trim()).filter(Boolean);
    const missing=labels.filter(l=>corpus.indexOf(l)<0);
    const dayDrawn=allDrawn.filter(t=>labels.some(l=>t.text===l||t.text.indexOf(l)>=0));
    const usedTextEllipsis=dayDrawn.some(t=>t.kind==='text'&&t.maxw>0);
    const ellipChars=dayDrawn.some(t=>/\u2026|\.\.\./.test(t.text));
    if(missing.length||usedTextEllipsis||ellipChars) bad++;
    if(labels.length) sample.push({day:n.el.getAttribute('data-day'),labels,missing,usedTextEllipsis,ellipChars,sizes:dayDrawn.map(t=>t.size),h:n.hit[3]});
  });
  const hs=days.map(n=>Math.round(n.hit[3]*10)/10); const uniq=[...new Set(hs)];
  return {ok:bad===0,bad,n:days.length,uniq,sample:sample.slice(0,12),ellipsisInCorpus:/\u2026|\.\.\./.test(corpus)}; }

window.exp7views={dayTextAudit,flagsOf,calStateOnly,bindCalViewStates,applyCalViewStates,JVS,diagText,DEFAULT_SRC,startRuntime,viewOps,where,whereDay,verify:id=>JVS[id].view.verify(),RISK_COL,RISK_HT,planRisk,riskOf,calSel:id=>(JVS[id]&&JVS[id].calSel)||null,formOf:id=>(JVS[id]&&JVS[id].form)||null,calNav:id=>(JVS[id]&&JVS[id].calNav)||null,riskSnap:id=>{ const V=JVS[id]; return V?{days:V.riskDays||{},steps:V.riskSteps||{},hasOldMode:!!V.hasOldModeText}:null; }};

/* ---------- about ---------- */
$('about').innerHTML=`<p><b>Real engine code (inlined verbatim from JEditor Lore rev 98 unless noted, runs live in every tab):</b></p><ul>
<li><span class="mono">atlas/circuit_lang.js</span> (Exp7Circuit): parser, canonical printer, <span class="mono">toBlueprint</span> (score → JBlueprint graph) and <span class="mono">toOps</span> (rule → proposal ops; delta carries <span class="mono">value</span>, fixed in rev 98).</li>
<li><span class="mono">builder/blueprint/jbp.js</span> (JBlueprint.compile): type-checks and compiles every score graph; its compiled <span class="mono">score(item, {max, joy})</span> is the only score function used (tabs 1, 3, 5). jfactor() compiles to <span class="mono">jfactor.call</span> (Exp7 jmethod 2).</li>
<li><span class="mono">engine/vendor/JFactor_exp6.js</span> (Exp7 engine core: JGroup / JAction / Joy; the vendored file keeps its name, md5 d1ab03b3…): <span class="mono">Best()</span> and <span class="mono">SimulatedBest()</span> rank the alternatives (toggle the method in tab 1).</li>
<li><span class="mono">atlas/atlas.js</span> (JAtlasModel): <span class="mono">pickAlt</span> (userPick &gt; pref &gt; Exp7 order), <span class="mono">exp6Order</span>, jreqChain.</li>
<li><span class="mono">atlas/eval.js</span> (JAtlasEval.itemFlags: jreq conflict).</li>
<li>Proposal checker from <span class="mono">tools/gen_synthetic_proposals.js</span> (shape, spec 42 §3.7 rules, all-or-nothing, ownership by acting, changed/overwrote; selftest runs on load). Node CLI/I/O lines removed, logic verbatim.</li>
<li>atlas-sync-test <span class="mono">clients/exp7-sync-core.js</span> (segment encode/decode, merge order cmpOrder) and the binary atlas/1 codec (<span class="mono">clients/atlas_codec.bundle.js</span>, WASM, embedded). Binary atlas/1 is the only write format; JSON appears only as a labelled size comparison in tab 4.</li></ul>
<p><b>Paths view (tab 6) and path inspectors (tabs 1, 2, 3):</b> the live atlas flattened into the exact slash paths the proposal checker walks (<span class="mono">applyOp</span> splits <span class="mono">op.path</span> on “/” and walks the atlas object; <span class="mono">shape()</span> only admits roots items | joys | components | blueprints | clock), e.g. <span class="mono">items/getthere/alts/pref</span>, <span class="mono">items/getthere/alts/unavail</span>, <span class="mono">items/getthere/state/userPick</span>, <span class="mono">items/hotel/jreq</span>, <span class="mono">joys/fun/value</span>, <span class="mono">clock/on</span>. Each path shows value, type, revision (<span class="mono">w.pathRev</span>), owner (<span class="mono">w.owner</span>, last accepted writer) and last change; tree or flat list, prefix filter, search, copy. Clicking a path pre-fills the console with an op valid for its type. Every submitted proposal highlights the paths it touched (rejections: the failing op index and path). Tab 3 diffs the two replicas path by path with merge winners/losers; tab 4 counts log ops and bytes per path.</p>
<p><b>Standard views (tabs 7–10), real vs simulated:</b></p><ul>
<li><b>Calendar (real):</b> the atlas contains the component, Board, Plan and three blueprints created by the real <span class="mono">JAtlasModel.calendarTemplate</span> (atlas/atlas.js, ADR 0091); it is drawn by the real <span class="mono">atlas/runtime.js</span> <span class="mono">calHtml</span>, with day risk painted host-side from planRisk() (workload count blueprint disabled) in a real <span class="mono">eval.js</span> pass. Every view is drawn by <b>JRender</b> (the Artist's renderer: jrender.wasm + WebGPU, inlined). The real <span class="mono">runtime.js</span> (taken from the page <span class="mono">atlas/build_atlas.js build()</span> generates) runs in this page against the live atlas; its view HTML is laid out (text measured and word-wrapped by the wasm) into a JRender v3 draw list: rects, rounded rects, text runs, wrapped text boxes, hit regions and a scroll group. All views share one wasm instance (one scene handle each) and one JRender GPUContext (one device, one pipeline). After the first load every change is a patch (diffed node by node), never a full rebuild. Clicks, drag-range and modifier keys go through JRender hit ids (v3 DRAG/MOD) to the host calendar selection and the real runtime.js handlers: month nav, day selection, board sort, resources / new-item / alternatives forms (native TextField — glue owns the hidden textarea), alternative picks and requirement rows. <b>Plan-risk highlighting</b> (replaces former item-count day modes): the ranking_ui easy228 cash-criticality <i>system</i> is ported — CRITICAL / MODERATE / LOW from headroom until next payday (1st &amp; 15th), fixed-date plan steps, ±3-day near-fixed, jreq slack, broken/conflict flags, and Best()/selected-alt cost outflows; the same risk map paints calendar days and Plan steps and updates live on edits. Calendar ↔ Plan steps stay in lockstep via atlas proposals. Atlas-writing actions become proposals under owner ui:views. Long views scroll with the wheel. No iframes, no DOM fallback: without WebGPU each view shows a plain error, and "Copy diagnostics" lists the reason.</li>
<li><b>Plan-risk rules ported from legacy ranking_ui (easy228) + plan-data feeds:</b>
<ul>
<li>CRITICAL day: headroom (lowest cushion before next payday) &lt; hc, or a fixed-date plan step that day. Feeds: dated calendar/reqs steps; cushion from Best()/userPick alt cost÷10 (or hours); income split 1st/15th.</li>
<li>MODERATE day: headroom &lt; hm, or a fixed-date plan step within ±3 days. Same feeds.</li>
<li>LOW otherwise. Legend colors C=#D55E00 / M=#E69F00 / L=#009E73 (Okabe–Ito), same as legacy.</li>
<li>Step CRITICAL: broken/conflict jreq (eval.js itemFlags), every alt BAD, or step date is a CRITICAL day. Step MODERATE: weakest Best() pick, slack &lt; 1 day to jreq, or MODERATE day.</li>
<li>What-if alt picks and resource stock pressure also feed the cushion / path-health side of the same map.</li>
</ul></li>
<li><b>Board (real):</b> <span class="mono">boardHtml</span> (spec 42 §4.3: unscheduled / scheduled, sort and filter read from <span class="mono">components/trip_calendar_board/view/*</span>). The atlas board has no ranking of its own. The "ranking" panel is the demo's real jbp score + Exp7 Best() over the alternatives group (the same as tab 1). The level-system <span class="mono">RankBoard</span> (builder/components, jdata/jboards runtime, money data) is <b>not</b> included: it is not the Exp7 atlas standard view.</li>
<li><b>Plan (real, tab 9):</b> the real <span class="mono">depsHtml</span> "Dependencies &amp; sequence" table only (component heading, note and the broken-jreq / conflict flags removed host-side; order and cycle flags stay). Host-side columns: <b>Selected item</b> = atlas <span class="mono">state.userPick</span> when set, otherwise Exp7 Best(); <b>Best</b> is always independent <span class="mono">exp6Order</span>/Best() over jbp scores (userPick never becomes Best). When no userPick, Best is pinned as userPick on the Plan session snapshot only so eval.js resolves the same alternative; <b>Joy (this step)</b> = state written by the real eval.js formula nodes of the synthetic blueprint <span class="mono">bp:plan_joy</span> (comfort/fun of the selected alternative minus fatigue round(tired/3), thrift −round(cost/100), tired = travel hours carried along values.from). The engine has no running joy total, so none is shown. Under each step an Alternatives dropdown; clicking one runs a what-if: the real runtime.js session on a JSON clone of the atlas with that pick, never written to the live atlas; rows from that step on show the result with Δ marks, earlier rows stay; "Clear what-if" restores.</li>
<li><b>Simulated or limited:</b> views are read-only renderings (spec 42 §5: views never write; events→circuits→proposals is not wired here). JRender views are pictures: clicks, hover, scrolling and per-item hit testing are not available yet (listed as JRender additions). The calendar's as-of is unset, so "today" is the box date. The runtime's own alternative pick uses <span class="mono">eval.js scoreItem</span> (atlas blueprints); these items have no item blueprint, so inside the views the pick falls back to userPick &gt; pref &gt; member order. The demo's jbp score is used only in tabs 1, 3, 5 and the Board ranking panel. In tab 3, each replica has a JRender view (Requirements + Discrepancies + Board) drawn from that replica's own atlas.</li></ul>
<p><b>One atlas model everywhere:</b> tabs 1, 2, 5 edit one atlas through the checker; in tab 3 each writer's replica is a fresh copy of the same synthetic atlas with every known segment applied in merge order through the same checker, and its Best is the same jbp + Exp7 ranking.</p>
<p><b>Still simulated:</b> GitHub transport is in-memory: the two writers' "repos" are file maps in this page and Sync copies segment bytes between them; the network toggle just gates that copy; segment timestamps come from a demo clock (+1 s per edit). The trip atlas and all values are invented. Not in scope: <span class="mono">@path</span> reads inside a <span class="mono">score</span> (the real compiler refuses them by design, doc 45: rules only, where they work here); <span class="mono">best_async.js</span> is not used (doc 48: sync below ~250 alternative items; this atlas has 1 group); the eval.js blueprint pass (atlas-format blueprints) is not run, scores come from circuit-language JBlueprint graphs only.</p>
<p><b>GitHub sync approach</b></p><ol><li>Each writer owns a <b>public repo</b> <span class="mono">&lt;login&gt;/atlas-sync-log</span> and only ever writes there (log/&lt;writer&gt;/&lt;seq&gt;.bin).</li>
<li>Writes use a <b>fine-grained personal access token</b> scoped to that one repo, held in tab memory only (never localStorage, never logged).</li>
<li>Peers' repos are read anonymously; no backend, no proxy.</li>
<li>All segments merge deterministically by (timestamp, writer id, seq), last write wins; overwrites raise changed/overwrote events.</li>
<li><b>Binary atlas/1 is the only write format</b> (no JSON writes, no JSON fallback: without the codec a batch stays queued, nothing lost). Old .json segments are still readable (legacy, read-only).</li></ol>`;

document.addEventListener('click',function(e){
  const tb=e.target.closest('[data-budget-type]');
  if(tb){ e.preventDefault(); const t=tb.getAttribute('data-budget-type');
    const bid=budgetBoardId(); const br=W.components[bid]; const has=br&&br.state&&('budgetType' in br.state);
    submitViews([{path:'components/'+bid+'/state/budgetType',op:has?'set':'add',value:t}],'budget:type'); return; }
  if(e.target&&e.target.id==='budgetLoadExamples'){ e.preventDefault(); loadBudgetExamples(); return; }
  if(e.target&&e.target.id==='budgetResetBlank'){ e.preventDefault(); replaceW(mkBudgetAtlas()); try{renderViews()}catch(x){} persistBudgetAtlas(); return; }
});
function loadBudgetExamples(){
  const ops=[]; const day=(n)=>{ const d=new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
  const bid=budgetBoardId(), cid=budgetCalId();
  const add=(id,name,type,amount,date,ranks)=>{
    const rec={id,name,values:{type,amount,ranks:ranks||{},note:'Labeled EXAMPLE only — not personal data'},factors:{},state:{},alts:null,jreq:null,blueprint:null};
    if(date) rec.values.date=date; ops.push({path:'items/'+id,op:'add',value:rec});
    ops.push({path:'components/'+bid+'/items',op:'add',value:'item:'+id});
    if(date) ops.push({path:'components/'+cid+'/items',op:'add',value:'item:'+id});
    ops.push({path:'components/reqs/items',op:'add',value:'item:'+id});
  };
  add('ex_rent','EXAMPLE Rent','expense',1200,day(-2),{priority_pool:{onFactor:true,pos:1}});
  add('ex_groc','EXAMPLE Groceries','expense',80,day(0),{priority_pool:{onFactor:true,pos:2},attention_pool:{onFactor:true,pos:1}});
  add('ex_pay','EXAMPLE Paycheck','income',2000,day(5),{});
  add('ex_card','EXAMPLE Card balance','debt',400,null,{priority_pool:{onFactor:true,pos:3}});
  add('ex_sav','EXAMPLE Savings','asset',500,null,{});
  try{ const ent=submit(ops,'ui:budget','examples'); if(!(ent&&ent.r&&ent.r.ok)) console.warn('budget examples',ent&&ent.r); }
  catch(e){ console.warn('budget examples failed',e); }
  try{renderViews()}catch(e){}
  persistBudgetAtlas();
}
const __submitBudget=submit; submit=function(ops,proc,src){ const ent=__submitBudget(ops,proc,src); if(ent&&ent.r&&ent.r.ok&&document.body.classList.contains('budget-mode')) persistBudgetAtlas(); return ent; };

/* ---------- boot ---------- */
const bootErrs=[];
function bootStep(name,fn){ try{ fn(); }catch(e){ bootErrs.push(name+': '+((e&&e.message)||e)); console.error('Exp7 boot step failed',name,e); } }
bootStep('resetSync',resetSync); bootStep('onSrc',onSrc); bootStep('renderBatch',renderBatch); bootStep('renderAtlas',renderAtlas);
bootStep('renderLog',renderLog); bootStep('refreshPaths',refreshPaths); bootStep('renderViews',renderViews);
let shown=null; bootStep('show',()=>{ shown=(location.hash||'#atlas').slice(1).replace(/[^a-z]/g,'')||'atlas'; show(shown); });
function snapshot(){ return JSON.parse(JSON.stringify(W)); }
function replaceW(atlas){ const next=typeof atlas==='string'?JSON.parse(atlas):JSON.parse(JSON.stringify(atlas));
  // Replace live atlas in place so closures keep the same W binding.
  for(const k of Object.keys(W)) delete W[k]; Object.assign(W,next);
  try{renderAtlas()}catch(e){} try{renderLog()}catch(e){} try{refreshPaths()}catch(e){} try{renderViews()}catch(e){} return W; }
function applyCheckedProposal(proposal){ if(!proposal||!Array.isArray(proposal.ops)) return {p:proposal,r:{ok:false,reason:'invalid-proposal'},src:'remote-sync'};
  const p={id:String(proposal.id||('p_r_'+Date.now().toString(36))),proc:String(proposal.proc||'remote'),baseRev:proposal.baseRev|0,t:proposal.t|0,ops:proposal.ops.map(o=>Object.assign({},o))};
  if('note' in proposal) p.note=proposal.note;
  const before=JSON.stringify(W), r=P.check(W,p), after=JSON.stringify(W);
  const ent={p,r,src:'remote-sync',before:before.length,after:after.length,same:before===after,hb:h64(before),ha:h64(after)};
  if(r.ok){ LOG.push({kind:'proposal',writer:p.proc,seg:{v:2,atlas:W.id,writer:p.proc,seq:pseq,ts:p.t,ops:p.ops}}); try{window.Exp7Audit&&Exp7Audit.capture(W,p,r,before,{scope:'remote-sync',source:'platform-sync'});}catch(e){} try{renderAtlas()}catch(e){} try{renderLog()}catch(e){} try{refreshPaths()}catch(e){} try{renderViews()}catch(e){} }
  return ent; }
window.exp7=Object.assign(window.exp7||{},{W:()=>W,submit,LOG,bootErrs,snapshot,replaceW,applyCheckedProposal,enterBudgetMode,enterExp7Mode,mode:()=>__appMode});
window.budget=Object.assign(window.budget||{},{W:()=>W,submit,snapshot,replaceW,harmonicShares:harmonicSharesBudget,persist:persistBudgetAtlas,enter:enterBudgetMode,mode:()=>__appMode});
window.Exp7ExperimentalBridge={scorer,bestRank,rank,selectedAlt,startRuntime,planRisk,flagsOf,scoreSource:()=>L.print(AST),scoreStatement:()=>scoreStmt,engine:X6};
window.exp7Diagnostics={
  text:function(){ try{ return diagText(); }catch(e){ return 'diagText failed: '+((e&&e.message)||e)+'\nbootErrs: '+bootErrs.join(' | '); } },
  show:function(t){ const p=$('diagPanel'), o=$('diagOut'); if(!p||!o) return; o.value=String(t); p.hidden=false; try{ o.focus(); o.select(); }catch(e){} },
  copy:function(t){ try{ return copyText(t); }catch(e){ return false; } }
};
(function(){ const bs=$('bootStatus'); const tabs=document.querySelectorAll('#tabs button').length; const sectionOn=shown?('t-'+shown):((document.querySelector('section.on')||{}).id||null);
  const proof={tabs:tabs,sectionOn:sectionOn,hasExp7:!!window.exp7,bootErrs:bootErrs.slice(),bootMs:Math.round(performance.now()-((window.__exp7FrameBoot&&__exp7FrameBoot.t0)||performance.now()))};
  if(bootErrs.length){ if(bs) bs.textContent='Exp7 boot problems: '+bootErrs.join(' · ')+(shown?' (UI partially shown)':' (main UI incomplete)'); if(window.__exp7Pub) __exp7Pub(Object.assign({type:'exp7-app-error',error:bootErrs.join(' | '),renderReady:false},proof)); }
  else { if(bs) bs.hidden=true; if(window.__exp7Pub) __exp7Pub(Object.assign({type:'exp7-app-ready',renderReady:true},proof)); }
})();
}catch(e){
  const msg=String((e&&e.stack)||(e&&e.message)||e); console.error('Exp7 boot failed',e);
  const bs=document.getElementById('bootStatus'); if(bs) bs.textContent='Exp7 boot failed before UI init: '+((e&&e.message)||e);
  const p=document.getElementById('diagPanel'), o=document.getElementById('diagOut'); if(p&&o){ o.value=msg; p.hidden=false; }
  window.exp7Diagnostics={text:function(){return msg;},show:function(t){const p=document.getElementById('diagPanel'),o=document.getElementById('diagOut'); if(p&&o){o.value=String(t);p.hidden=false;}},copy:function(){return false;}};
  window.exp7=Object.assign(window.exp7||{},{bootErrs:['fatal: '+((e&&e.message)||e)]});
  try{ if(window.__exp7Pub) __exp7Pub({type:'exp7-app-error',error:String((e&&e.message)||e),renderReady:false,tabs:document.querySelectorAll('#tabs button').length,sectionOn:null}); }catch(x){}
}
})();

document.addEventListener('click',e=>{ const b=e.target.closest('#copyDiag'); if(!b) return;
  const D=window.exp7Diagnostics; let t;
  try{ t=(D&&D.text)?D.text():('diagnostics unavailable; bootErrs='+JSON.stringify((window.exp7&&window.exp7.bootErrs)||[])); }
  catch(err){ t='diagnostics threw: '+((err&&err.message)||err); }
  window.exp7lastDiag=t;
  if(D&&D.show) D.show(t); else { let o=document.getElementById('diagOut'); if(!o){ o=document.createElement('textarea'); o.id='diagOut'; o.readOnly=true; o.rows=12; o.style.width='95%'; o.style.margin='8px'; document.body.insertBefore(o, document.body.firstChild); } o.value=t; try{o.focus();o.select();}catch(x){} }
  let ok=false; try{ ok=!!(D&&D.copy&&D.copy(t)); }catch(err){}
  b.textContent=ok?'Copied ✓ — plaintext also shown below':'Plaintext shown below (clipboard unavailable in this frame)';
  setTimeout(()=>{ b.textContent='Copy diagnostics'; },2500);
});

