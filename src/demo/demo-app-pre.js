/* ---------- codec ---------- */
let codec=null,codecErr='';
try{ if(window.AtlasCodec&&window.ATLAS_CODEC_WASM){codec=AtlasCodec.create(ATLAS_CODEC_WASM);X.setBinaryCodec(codec);} else codecErr='codec bundle not embedded'; }catch(e){codecErr=e.message;}
$('codecStat').textContent=codec?'binary atlas/1 codec: loaded (real)':'codec unavailable: codec required to write; sizes are estimates ('+codecErr+')';
$('codecStat').className='tag '+(codec?'g':'red');
/* ---------- synthetic atlas (invented ids and values) ---------- */
/* New-instance synthetic sample only. Not an import, migration, history generator or model algorithm. */
function addRichExample(w){
 const sample={"groups":[{"id":"stay","name":"Choose a home base","predecessor":"hotel","date":"2027-04-11","alternatives":[{"id":"stay_courtyard","name":"Courtyard guesthouse","cost":110,"comfort":7,"fun":7,"hours":1,"key":"sharedCourtyard"},{"id":"stay_harbor","name":"Harbor-view apartment","cost":185,"comfort":9,"fun":8,"hours":1,"key":"privateHarbor"},{"id":"stay_bunk","name":"Familiar budget bunk","cost":75,"comfort":3,"fun":2,"hours":1,"key":"sharedBunk"},{"id":"stay_farm","name":"Family farm stay","cost":95,"comfort":6,"fun":9,"hours":2,"key":"sharedFarm"},{"id":"stay_spa","name":"Quiet spa hotel","cost":260,"comfort":10,"fun":5,"hours":1,"key":"privateSpa"}]},{"id":"mobility","name":"Get around the town","predecessor":"stay","date":"2027-04-12","alternatives":[{"id":"mobility_tram","name":"Public tram day pass","cost":18,"comfort":7,"fun":7,"hours":1,"key":"publicTram"},{"id":"mobility_bus","name":"Coastal bus pass","cost":12,"comfort":5,"fun":6,"hours":2,"key":"publicBus"},{"id":"mobility_bike","name":"Riverside bicycle rental","cost":25,"comfort":4,"fun":9,"hours":3,"key":"activeBike"},{"id":"mobility_cab","name":"Door-to-door electric taxi","cost":85,"comfort":9,"fun":4,"hours":1,"key":"privateCab"},{"id":"mobility_walk","name":"Walk the old-town lanes","cost":0,"comfort":3,"fun":8,"hours":4,"key":"activeWalk"}]},{"id":"discovery","name":"Discover the historic district","predecessor":"mobility","date":"2027-04-13","alternatives":[{"id":"discovery_guide","name":"Local historian walking tour","cost":45,"comfort":6,"fun":9,"hours":3,"key":"guided"},{"id":"discovery_audio","name":"Self-paced audio trail","cost":10,"comfort":7,"fun":7,"hours":2,"key":"selfAudio"},{"id":"discovery_archive","name":"Town archive research visit","cost":5,"comfort":8,"fun":6,"hours":2,"key":"indoorArchive"},{"id":"discovery_ferry","name":"Historic harbor ferry loop","cost":30,"comfort":8,"fun":9,"hours":2,"key":"publicFerry","needs":["item:mobility#public"]},{"id":"discovery_sketch","name":"Sketch the old market square","cost":8,"comfort":5,"fun":8,"hours":3,"key":"selfSketch"}]},{"id":"food","name":"Choose the shared evening meal","predecessor":"discovery","date":"2027-04-14","alternatives":[{"id":"food_market","name":"Cook a market-produce supper","cost":35,"comfort":7,"fun":9,"hours":3,"key":"sharedCooking"},{"id":"food_seafood","name":"Harbor seafood restaurant","cost":90,"comfort":9,"fun":8,"hours":2,"key":"restaurantSeafood"},{"id":"food_picnic","name":"Lighthouse picnic basket","cost":25,"comfort":4,"fun":9,"hours":2,"key":"outdoorPicnic"},{"id":"food_bistro","name":"Neighborhood vegetarian bistro","cost":55,"comfort":8,"fun":7,"hours":2,"key":"restaurantVeg"},{"id":"food_tasting","name":"Small-plate tasting kitchen","cost":125,"comfort":9,"fun":10,"hours":3,"key":"restaurantTasting"}]},{"id":"learning","name":"Learn a local craft","predecessor":"stay","date":"2027-04-12","alternatives":[{"id":"learning_pottery","name":"Beginner pottery workshop","cost":65,"comfort":8,"fun":9,"hours":3,"key":"handsPottery"},{"id":"learning_bread","name":"Sourdough baking class","cost":55,"comfort":9,"fun":8,"hours":3,"key":"handsBread"},{"id":"learning_photo","name":"Dawn photography walk","cost":30,"comfort":4,"fun":9,"hours":2,"key":"fieldPhoto"},{"id":"learning_weaving","name":"Community weaving studio","cost":35,"comfort":7,"fun":8,"hours":2,"key":"handsWeaving"},{"id":"learning_talk","name":"Maritime history lecture","cost":12,"comfort":9,"fun":5,"hours":1,"key":"indoorTalk"}]},{"id":"coast","name":"Explore the outer coast","predecessor":"mobility","date":"2027-04-13","alternatives":[{"id":"coast_ferry","name":"Island nature-reserve ferry","cost":40,"comfort":7,"fun":10,"hours":4,"key":"publicIsland","needs":["item:mobility#public"]},{"id":"coast_cliff","name":"Signed clifftop nature trail","cost":0,"comfort":3,"fun":9,"hours":5,"key":"activeCliff"},{"id":"coast_sail","name":"Small-group sheltered sailing","cost":120,"comfort":7,"fun":10,"hours":4,"key":"guidedSail"},{"id":"coast_beach","name":"Accessible beach shuttle","cost":20,"comfort":9,"fun":7,"hours":2,"key":"publicBeach","needs":["item:mobility#public"]},{"id":"coast_hide","name":"Wetland birdwatching hide","cost":15,"comfort":6,"fun":8,"hours":3,"key":"quietBirds"}]},{"id":"evening","name":"Wind down after the workshops","predecessor":"learning","date":"2027-04-14","alternatives":[{"id":"evening_music","name":"Early acoustic set at the library","cost":15,"comfort":8,"fun":8,"hours":2,"key":"earlyMusic"},{"id":"evening_cinema","name":"Independent cinema matinee","cost":14,"comfort":9,"fun":7,"hours":2,"key":"earlyCinema"},{"id":"evening_stars","name":"Late observatory stargazing","cost":25,"comfort":4,"fun":10,"hours":4,"key":"lateStars"},{"id":"evening_stories","name":"Community storytelling circle","cost":5,"comfort":7,"fun":9,"hours":2,"key":"earlyStories"},{"id":"evening_rest","name":"Read and rest at the guesthouse","cost":0,"comfort":10,"fun":4,"hours":1,"key":"earlyRest"}]},{"id":"return_route","name":"Bring the branches together for departure","predecessor":"coast","date":"2027-04-15","alternatives":[{"id":"return_route_rail","name":"Morning through-train home","cost":95,"comfort":9,"fun":6,"hours":4,"key":"publicRail"},{"id":"return_route_coach","name":"Direct budget coach home","cost":45,"comfort":4,"fun":5,"hours":7,"key":"publicCoach"},{"id":"return_route_scenic","name":"Scenic rail-and-ferry connection","cost":110,"comfort":7,"fun":10,"hours":6,"key":"publicScenic","needs":["item:mobility#public","item:evening#early"]},{"id":"return_route_share","name":"Reserved electric car-share","cost":135,"comfort":8,"fun":7,"hours":4,"key":"privateShare"},{"id":"return_route_flight","name":"Late direct flight home","cost":210,"comfort":8,"fun":4,"hours":2,"key":"privateFlight"}]},{"id":"keepsakes","name":"Keep and share something learned","predecessor":"learning","date":"2027-04-13","alternatives":[{"id":"keepsakes_journal","name":"Make a hand-bound trip journal","cost":18,"comfort":8,"fun":8,"hours":2,"key":"handsJournal"},{"id":"keepsakes_print","name":"Print a small photo zine","cost":28,"comfort":7,"fun":9,"hours":2,"key":"handsPrint"},{"id":"keepsakes_recipe","name":"Exchange annotated local recipes","cost":8,"comfort":9,"fun":7,"hours":1,"key":"sharedRecipe"},{"id":"keepsakes_ceramic","name":"Collect the fired workshop bowl","cost":12,"comfort":8,"fun":9,"hours":1,"key":"handsCeramic","needs":["item:learning#hands"]},{"id":"keepsakes_postcard","name":"Send hand-drawn postcards","cost":10,"comfort":6,"fun":8,"hours":2,"key":"handsPostcard"}]}],"transportExtras":[["rail_day","Daytime rail with a coastal connection",195,7,8,7,"publicRail"],["car_share","Shared electric car with friends",240,6,8,5,"privateShare"]],"nestedItinerary":{"preparation":{"documents":{"identity":{"status":"checked","expires":"2030-08-31"},"tickets":{"outbound":{"reference":"SYNTHETIC-OUTBOUND","confirmed":true},"return":{"reference":"SYNTHETIC-RETURN","confirmed":false}}},"packing":{"day_bag":{"water_litres":2,"rain_layer":true},"workshop_kit":{"notebook_pages":80,"camera_batteries":2}}},"on_location":{"base":{"arrival":{"meeting_point":"Harbor station clock","local_hour":11},"room":{"quiet_requested":true,"key_pickup":"Courtyard reception"}},"branches":{"heritage":{"trail":{"meeting":"Old market fountain","distance_km":3.5}},"craft":{"studio":{"apron_required":true,"materials_budget":35}},"coast":{"island":{"weather_check":"Morning harbor bulletin","water_litres":2}}}},"departure":{"connections":{"shared":{"public_transport_required":true,"early_evening_required":true},"backup":{"coach_stop":"Central bus arcade","reserve_budget":45}},"handover":{"journal":{"recipient":"Trip group","copies":4}}}}};
 w.title='Synthetic Seaside discovery trip: connected choices';
 w.items.trip.name='Seaside discovery trip: connected choices';
 w.items.trip.values.itinerary=sample.nestedItinerary;
 w.items.trip.values.example={version:16,kind:'synthetic example state; not proposal history',branch_notes:'jreq is one prerequisite; values.needs can join multiple currently selected groups'};
 for(const a of sample.transportExtras){const [id,name,cost,comfort,fun,hours,key]=a;w.items[id]={id,name,values:{cost,comfort,fun,hours,key},state:{},jreq:'item:packing'};w.items.getthere.alts.members.push('item:'+id);}
 for(const g of sample.groups){
  const members=g.alternatives.map(a=>'item:'+a.id);
  w.items[g.id]={id:g.id,name:g.name,values:{date:g.date,from:'item:'+g.predecessor,plan:{schedule:{date:g.date,window:{start_hour:10,end_hour:18}},resources:{time:{reserve_hours:4},budget:{reserve_usd:150}},branch:{follows:'item:'+g.predecessor,purpose:g.name}}},state:{userPick:null},factors:{},jreq:'item:'+g.predecessor,alts:{members,pref:null,unavail:[],method:'best'}};
  for(const a of g.alternatives)w.items[a.id]={id:a.id,name:a.name,values:{cost:a.cost,comfort:a.comfort,fun:a.fun,hours:a.hours,key:a.key,...(a.needs?{needs:a.needs}:{}),logistics:{resources:{time:{hours:a.hours},budget:{usd:a.cost}},access:{reservation_required:a.cost>50,meeting_point:g.name}}},state:{},factors:{},jreq:'item:'+g.predecessor};
 }
 // These are declared sample choices, not claims about prior users or proposals.
 w.items.stay.state.userPick='item:stay_bunk';
 w.items.mobility.state.userPick='item:mobility_tram';
 w.items.learning.state.userPick='item:learning_pottery';
 w.items.evening.state.userPick='item:evening_music';
 w.items.food.alts.pref='item:food_market';
 w.items.return_route.values.needs=['item:mobility','item:evening'];
 w.items.coast.alts.unavail=['item:coast_sail']; // sample: no sailing places for this date; the other routes remain feasible.
 w.items.coast.values.plan.branch.capacity_note='Sailing is unavailable for this example date; choose another genuine alternative.';
 const refs=sample.groups.map(g=>'item:'+g.id);
 w.components.trip_calendar.items.push(...refs);
 w.components.trip_calendar_board.items.push(...refs);
 w.components.reqs.items.push(...refs);
 w.components.plan.items.push(...refs);
 return w;
}

function addCollabExample(w){
 w.components.reqs.collab={allowed:['alice','bob'],lockedBy:null,order:w.components.reqs.items.map(r=>r.slice(5))};
 for(const ref of w.components.reqs.items){const id=ref.slice(5),it=w.items[id];it.values.collab={allowed:['alice','bob'],lockedBy:null,notes:'',label:''};}
 return w;
}

function mkAtlas(){ const w={ format:'jeditor-atlas',version:5,id:'syn_trip',title:'Synthetic weekend trip',rev:1000,root:[],blueprints:{},
  clock:{joy:'clock',ms:1000,on:true},
  joys:{comfort:{id:'comfort',name:'Comfort',value:6,jmax:10},fun:{id:'fun',name:'Fun',value:7,jmax:10},thrift:{id:'thrift',name:'Thrift',value:5,jmax:10},
    clock:{id:'clock',name:'Clock',value:0},motto:{id:'motto',name:'Motto (text joy)',value:'travel light'}},
  items:{ trip:{id:'trip',name:'Weekend in Seaside Town',values:{start:'2027-04-09',notes:['passport']},state:{},factors:{}},
    getthere:{id:'getthere',name:'Getting there',values:{date:'2027-04-09'},state:{userPick:null},alts:{members:['item:fl_direct','item:fl_layover','item:train_bus'],pref:null,unavail:[],method:'best'}},
    fl_direct:{id:'fl_direct',name:'Direct flight',values:{cost:420,comfort:8,fun:4,hours:2},state:{}},
    fl_layover:{id:'fl_layover',name:'Flight with layover',values:{cost:260,comfort:4,fun:5,hours:6},state:{}},
    train_bus:{id:'train_bus',name:'Night train + bus',values:{cost:150,comfort:5,fun:9,hours:11},state:{}},
    hotel:{id:'hotel',name:'Hotel check-in',values:{date:'2027-04-10'},jreq:'item:getthere',state:{}}},
  components:{plan:{id:'plan',name:'Plan',items:['item:getthere','item:hotel'],sub:[],view:{},state:{}}} };
  /* standard Exp7 calendar/board/plan: the REAL JAtlasModel.calendarTemplate (atlas/atlas.js, ADR 0091) creates the calendar,
     its Board and Plan components and their three blueprints (day workload, dependency conflict, drop onto day) */
  const it=(id,name,values,jreq)=>{ w.items[id]={id,name,values,factors:{},state:{},alts:null,jreq:jreq||null,blueprint:null}; };
  it('packing','Pack bags',{date:'2027-04-08'}); it('museum','Museum visit',{date:'2027-04-11'},'item:hotel');
  it('souvenirs','Buy souvenirs',{}); it('dinner','Seafood dinner',{});
  w.items.getthere.jreq='item:packing';
  const T=M.calendarTemplate(w,'Trip calendar','2027-04'), cid=r=>r.slice(5);
  const cal=w.components[cid(T.cal)], brd=w.components[cid(T.board)];
  /* Calendar view alone: no Board/Plan switch tabs (those stay as their own Exp7 demo tabs). */
  cal.view.switch=false; cal.view.group=[]; cal.state.show=null; cal.sub=[];
  /* Risk modes (legacy criticality C/M/L) — day styles painted host-side from planRisk(); workload count BP disabled */
  /* Real Exp7 view.states (ADR 0082/0089): CSS colors for runtime stateStyle; ViewStates.go packs them for DL patches. */
  cal.view.states={
    critical:{bg:RISK_COL.C[2],border:RISK_COL.C[0],sm:'invalid',anim:'shake',label:'CRITICAL'},
    moderate:{bg:RISK_COL.M[2],border:RISK_COL.M[0],sm:'idle',anim:'none',label:'MODERATE'},
    low:{bg:RISK_COL.L[2],border:RISK_COL.L[0],sm:'idle',anim:'none',label:'LOW'},
    selected:{bg:'#e7eefb',border:'#2458a6',sm:'idle',anim:'none',label:'SELECTED'},
    critical_sel:{bg:RISK_COL.C[2],border:'#2458a6',sm:'invalid',anim:'shake',label:'CRITICAL'},
    moderate_sel:{bg:RISK_COL.M[2],border:'#2458a6',sm:'idle',anim:'none',label:'MODERATE'},
    low_sel:{bg:RISK_COL.L[2],border:'#2458a6',sm:'selected',anim:'none',label:'LOW'},
    drag:{bg:'#dce8fb',border:'#2458a6',sm:'idle',anim:'none',label:'DRAG'}};
  const bwid=(cal.blueprints||[]).map(r=>r.slice(3)).find(id=>/_workload$/.test(id));
  if(bwid&&w.blueprints[bwid]){ w.blueprints[bwid]={id:bwid,name:cal.name+' · day risk (host)',nodes:[],wires:[]}; }
  cal.items=['item:packing','item:getthere','item:hotel','item:museum'];
  brd.items=['item:packing','item:getthere','item:hotel','item:museum','item:souvenirs','item:dinner'];
  /* Resources (board list): synthetic items with values.kind=resource */
  it('res_time','Time (hours)',{kind:'resource',unit:'h',stock:40});
  it('res_budget','Budget (USD)',{kind:'resource',unit:'$',stock:2000});
  it('res_energy','Energy',{kind:'resource',unit:'pts',stock:10});
  const th={tokens:{bg:'#ffffff',fg:'#1c2333',accent:'#75510f'}}, comp=(id,name,view,items)=>{ w.components[id]={id,name,view:Object.assign({theme:th,item:{show:[]},states:{}},view),items:items||[],blueprints:[],state:{},sub:[]}; };
  Object.values(w.components).forEach(c=>{if(c.view)c.view.theme=th;});
  comp('resources','Resources',{layout:'board',title:'Resources'},['item:res_time','item:res_budget','item:res_energy']);
  /* Plan steps driven by the same items as the calendar (two-way binding). */
  comp('reqs','Requirements (jreq)',{layout:'deps',title:'Dependencies & sequence (jreq)'},['item:packing','item:getthere','item:hotel','item:museum']);
  comp('disc_conflict','Discrepancies · dependency conflicts',{layout:'section',source:T.cal,rule:'flag',flag:'conflict'});
  comp('disc_broken','Discrepancies · broken jreq',{layout:'section',source:T.cal,rule:'flag',flag:'broken'});
  /* Plan joy rules (synthetic atlas data, evaluated by the REAL eval.js formula nodes, ADR 0103, on comp:reqs):
     th = travel hours of the step's selected alternative (state.pick for Best, state.simPick for SimulatedBest; only one is set); tired = travel hours carried from the step it follows (values.from);
     comfort / fun = the selected alternative's comfort / fun minus round(tired/3); thrift = -round(cost/100). */
  w.items.hotel.values.from='item:getthere'; w.items.museum.values.from='item:hotel';
  const fN=(id,out,expr,y)=>({id,type:'formula',p:{comp:'comp:reqs',expr,out,deep:'no'},x:20,y});
  w.blueprints.plan_joy={id:'plan_joy',name:'Plan · joy per step',nodes:[fN('f1','th',"(via('pick','hours')+via('simPick','hours'))",20),fN('f2','tired',"max(via('from','th'),via('from','tired'))",90),
    fN('f3','jcomfort',"(via('pick','comfort')+via('simPick','comfort'))-round(tired/3)",160),fN('f4','jfun',"(via('pick','fun')+via('simPick','fun'))-round(tired/3)",230),fN('f5','jthrift',"0-round((via('pick','cost')+via('simPick','cost'))/100)",300)],wires:[]};
  w.components.reqs.blueprints=['bp:plan_joy'];
  return addCollabExample(addRichExample(w)); }
let W=mkAtlas(); const LOG=[]; let pseq=0, T0=Date.now();
/* ---------- score: real pipeline ----------
   circuit `score NAME = expr` -> Exp7Circuit.toBlueprint (atlas/circuit_lang.js) -> JBlueprint graph -> JBlueprint.compile
   (builder/blueprint/jbp.js) -> compiled score(item, {max, joy}) ; ranking: JAtlasModel.pickAlt / exp6Order (atlas/atlas.js)
   -> Exp7 JGroup.Best() / SimulatedBest() from engine/vendor/JFactor_exp6.js. No demo-side evaluator. */
const JBP=window.JBlueprint;
const X6=(typeof JGroup!=='undefined'&&typeof JAction!=='undefined'&&typeof Joy!=='undefined')?{JGroup:JGroup,JAction:JAction,Joy:Joy}:null;
if(!X6) console.error('Exp7 engine core (file JFactor_exp6.js) did not load');
const DEFAULT_SRC=`# Exp7 circuit language v0, synthetic travel plan
score fit = jfactor(value(comfort), value(fun), boardmax(comfort), boardmax(fun)) * (joy(comfort) + joy(fun)) - value(cost) / boardmax(cost) * joy(thrift)
on pick(group, opt): ref items/{group}/state/userPick = opt
on rate(j, amt) when amt != 0: delta joys/{j}/value += amt
on unavailable(group, opt):
  add items/{group}/alts/unavail opt
on tick when @clock/on:
  delta joys/clock/value += 1
  add items/trip/values/notes "tick seen"
`;
let AST=L.parse(DEFAULT_SRC), scoreStmt=AST.find(s=>s.score);
/* compile the score for one atlas: fields = numeric values (+ factors flagged factor) of the group's members; joys = atlas joys */
function scorer(w,gid){ gid=gid||'getthere'; const g=w.items[gid], mem=g.alts.members.map(m=>M.get(w,m)).filter(Boolean);
  if(!scoreStmt) return {ok:false,errors:['no score statement'],fn:()=>0,graph:null};
  let graph; try{ graph=L.toBlueprint(scoreStmt); }catch(e){ return {ok:false,errors:[e.message],fn:()=>0,graph:null}; }
  const F={}; mem.forEach(it=>{ Object.keys(it.values||{}).forEach(k=>{ if(typeof it.values[k]==='number') F[k]=F[k]||{id:k}; }); Object.keys(it.factors||{}).forEach(k=>{ F[k]={id:k,factor:true}; }); });
  const c=JBP.compile(graph,Object.values(F),{joys:w.joys}); if(!c.ok) return {ok:false,errors:c.errors,fn:()=>0,graph};
  const row=it=>Object.assign({},it.factors||{},it.values||{}), max={};
  mem.forEach(it=>{ const r=row(it); Object.keys(F).forEach(k=>{ const v=Number(r[k]); if(isFinite(v)) max[k]=Math.max(max[k]||0,Math.abs(v)); }); });
  const ctx={max, joy:(j,which)=>{ const J=w.joys[j]; if(!J) return 0; return which==='jmax'?(J.jmax!=null?Number(J.jmax):1):Number(J.value)||0; }};
  return {ok:true,errors:[],graph,fields:Object.values(F),context:ctx,row,fn:ref=>{ const it=M.get(w,ref); return it?c.score(row(it),ctx):0; }}; }
/* Ranking helpers.
   Engine ADR: JAtlasModel.pickAlt prefers userPick > pref > Exp7 Best()/SimulatedBest() — that returns the *selected*
   alternative for eval/runtime (state.pick), NOT a redefinition of Best. Demo rule (Matthew): user choice never
   becomes Best. bestRank() always uses real exp6Order / Best() scores and ignores userPick. selectedAlt() is the
   user's choice when set, otherwise falls back to Best for display of "what the plan runs". */
function bestRank(w,gid){ gid=gid||'getthere'; const it=w.items[gid]; if(!it||!it.alts) return {sc:{ok:false,fn:()=>0,errors:['no alts']},pick:null,order:[],method:'best'};
  const sc=scorer(w,gid), A=it.alts, avail=(A.members||[]).filter(m=>getAvail(w,gid,m));
  const order=X6&&avail.length?M.exp6Order(X6,avail,sc.fn,A.method==='sim'):[];
  const pick=order.length?{pick:order[0].ref,why:A.method==='sim'?'exp6 SimulatedBest':'exp6 Best',score:order[0].score,order:order.map(o=>o.ref)}:null;
  return {sc,pick,order,method:A.method||'best'}; }
function getAvail(w,gid,m){ const A=w.items[gid].alts, un=A.unavail||[]; return !!M.get(w,m) && un.indexOf(m)<0; }
function selectedAlt(w,gid){ gid=gid||'getthere'; const it=w.items[gid]; if(!it||!it.alts) return null;
  const up=it.state&&it.state.userPick; if(up&&getAvail(w,gid,up)) return {ref:up,why:'user'};
  const B=bestRank(w,gid); return B.pick?{ref:B.pick.pick,why:B.pick.why,score:B.pick.score}:null; }
/* rank(): selected path via real pickAlt (engine semantics) + independent Best order for UI that must not conflate them */
function rank(w,gid){ gid=gid||'getthere'; const sc=scorer(w,gid), A=w.items[gid].alts, avail=A.members.filter(m=>A.unavail.indexOf(m)<0);
  const pick=M.pickAlt(w,gid,sc.fn,X6), order=X6&&avail.length?M.exp6Order(X6,avail,sc.fn,A.method==='sim'):[];
  const B=bestRank(w,gid);
  return {sc,pick,order,method:A.method,best:B.pick,bestOrder:B.order}; }
/* user-visible wording: the engine is Exp7; atlas.js/runtime.js (verbatim) still emit 'exp6 Best' / engine 'exp6' identifiers */
const x7=t=>String(t==null?'':t).replace(/\bexp6\b/gi,'Exp7');
const r2=x=>Math.round(x*100)/100;
/* ---------- proposals (real checker) ---------- */
function submit(ops,proc,src){ ops=syncCalPlanOps((ops||[]).map(o=>Object.assign({},o))); const p={id:'p_'+(++pseq).toString(36),proc,baseRev:W.rev||1000,t:Date.now()-T0,ops};
  const before=JSON.stringify(W), r=P.check(W,p), after=JSON.stringify(W);
  const ent={p,r,src,before:before.length,after:after.length,same:before===after,hb:h64(before),ha:h64(after)};
  if(r.ok) LOG.push({kind:'proposal',writer:proc,seg:{v:2,atlas:W.id,writer:proc,seq:pseq,ts:p.t,ops}});
  window.Exp7Audit.capture(W,p,r,before,{scope:'live',source:src,liveSeq:pseq}); notePaths(p,r); renderAtlas(); renderLog(); refreshPaths(); renderViews(); window.Exp7ExperimentalHooks?.changed('proposal'); return ent; }
function resultHTML(ent){ const r=ent.r, n=ent.p.ops.length;
  if(!r.ok){ const m=/ops\[(\d+)\]/.exec(r.reason||''); const idx=r.op>=0?r.op:(m?+m[1]:-1), path=r.path||(idx>=0&&ent.p.ops[idx]?ent.p.ops[idx].path:'');
    return `<div class="res bad"><b>Rejected</b> (${fmt(n)} ops, nothing applied). Failing op <b>#${idx<0?'(batch)':idx}</b> ${path?'at <span class="mono">'+esc(path)+'</span>':''} reason <b class="mono">${esc(r.reason)}</b><br>
     <span class="muted">atlas bytes ${ent.same?'identical':'CHANGED (bug)'} · hash ${ent.hb}</span></div>`; }
  return `<div class="res ok"><b>Accepted</b> ${fmt(n)} ops → rev ${r.rev}${r.owner?' · owner '+esc(r.owner):''}<br>
   ${r.changed.length?'changed: '+r.changed.slice(0,6).map(c=>`<span class="mono">${esc(c.path)}</span> (from ${esc(c.from||'none')})`).join(', ')+(r.changed.length>6?' …':''):'<b>no change</b>'}
   ${r.overwrote.length?'<br><span class="tag y">overwrote</span> '+r.overwrote.map(o=>esc(o.path)+' (prev owner '+esc(o.prevOwner)+')').join(', '):''}<br>
   <span class="muted">atlas bytes before ${fmt(ent.before)} / after ${fmt(ent.after)} · ${ent.same?'<b>identical bytes</b>':'hash '+ent.hb+' → '+ent.ha}</span></div>`; }
/* ---------- tabs ---------- */
const TABS=[['atlas','1 · Atlas'],['console','2 · Proposal console'],['sync','3 · Two writers'],['storage','4 · Storage'],['circuit','5 · Circuit language'],['paths','6 · Paths'],['cal','7 · Calendar'],['brd','8 · Board'],['plan','9 · Plan'],['about','About']];
const BUDGET_TABS=[['cal','Calendar'],['brd','Board'],['plan','Plan']];
function paintTabs(){ const list=(window.__appMode==='budget'||(typeof __appMode!=='undefined'&&__appMode==='budget'))?BUDGET_TABS:TABS; $('tabs').innerHTML=list.map(t=>`<button data-t="${t[0]}">${t[1]}</button>`).join(''); }
$('tabs').innerHTML=TABS.map(t=>`<button data-t="${t[0]}">${t[1]}</button>`).join('');
function show(t){ const root=document.getElementById('appHost')||document; root.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t)); root.querySelectorAll('section').forEach(s=>s.classList.toggle('on',s.id==='t-'+t)); if(t==='storage') renderLog(); if(t==='sync') renderSync(); refreshPaths(); }
$('tabs').onclick=e=>{ if(e.target.dataset.t){ show(e.target.dataset.t); history.replaceState(null,'','#'+e.target.dataset.t);} };
window.exp7show=show;
/* ---------- 1 atlas ---------- */
function atlasSend(ops,label){ const ent=submit(ops,'ui:matthew','atlas'); $('atlasLast').innerHTML=`<div class="mono">${esc(label)}</div><pre>${esc(JSON.stringify(ent.p))}</pre>`+resultHTML(ent); }
function renderAtlas(){
  if(document.body.classList.contains('budget-mode') || (typeof __appMode!=='undefined' && __appMode==='budget')){
    // Trip atlas chrome is Exp7-only; Budget uses Cal/Board/Plan views.
    return;
  }
  const g=W.items.getthere, A=g.alts, R=rank(W), B=bestRank(W), scoreOf=m=>r2(R.sc.fn(m));
  const ranked=R.order.map(o=>({m:o.ref,s:r2(o.score)}));
  const bestRef=B.pick&&B.pick.pick, sel=selectedAlt(W);
  $('alts').innerHTML=A.members.map(m=>{const it=M.get(W,m),v=it.values,un=A.unavail.indexOf(m)>=0,best=bestRef===m,yours=g.state.userPick===m,rank=ranked.findIndex(r=>r.m===m);
    return `<div class="alt ${best?'best':''} ${un?'un':''}" data-m="${m}"><div><b>${esc(it.name)}</b> ${best?'<span class="tag g">Best ('+esc(x7(B.pick.why))+')</span>':''}${yours?'<span class="tag">Selected (your pick)</span>':''}${A.pref===m?'<span class="tag y">pref</span>':''}${un?'<span class="tag red">unavailable</span>':''}<br>
      <span class="muted">cost ${v.cost} · comfort ${v.comfort} · fun ${v.fun} · ${v.hours} h</span></div>
      <div style="text-align:right"><div class="big">${scoreOf(m)}</div><span class="muted">${rank>=0?'rank #'+(rank+1):'—'}</span><br><button class="b" data-pref="${m}">★</button><button class="b" data-un="${m}">⊘</button></div></div>`;}).join('');
  const bestLine=B.pick?`Best: <b>${esc(M.get(W,B.pick.pick).name)}</b> — <b>${esc(x7(B.pick.why))}</b>${B.pick.score!=null?' (score '+r2(B.pick.score)+')':''} (independent of userPick).`:'No available alternative.';
  const selLine=sel?`Selected: <b>${esc(M.get(W,sel.ref).name)}</b> — <b>${esc(x7(sel.why))}</b>${sel.ref!==bestRef?' · not Best':''}.`:'Selected: —';
  $('bestBox').innerHTML=(R.sc.ok?'':`<div class="bad">score did not compile (jbp.compile): ${esc(R.sc.errors.join('; '))}</div>`)+bestLine+`<br>`+selLine+`<br>Exp7 ${R.method==='sim'?'SimulatedBest()':'Best()'} order: ${ranked.map(r=>esc(M.get(W,r.m).name)+' '+r.s).join(' › ')||'—'} <button class="b" id="methodBtn">method: ${esc(A.method)} → ${A.method==='sim'?'best':'sim'}</button>`;
  $('bestBox').className='res '+(R.sc.ok?'ok':'bad');
  $('joys').innerHTML=['comfort','fun','thrift'].map(j=>`<div class="row"><span style="width:70px">${W.joys[j].name}</span><input type="range" min="0" max="10" step="1" value="${W.joys[j].value}" data-j="${j}" style="flex:1"><b style="width:30px">${W.joys[j].value}</b></div>`).join('')
   +`<div class="row muted">clock ${W.joys.clock.value} · motto “${esc(W.joys.motto.value)}” (text joy) · rev ${W.rev}</div>`;
  const fl=E.itemFlags(W,'item:hotel');
  $('dates').innerHTML=`<div class="row">Trip start <input type="date" id="dStart" value="${W.items.trip.values.start}"></div>
   <div class="row">Travel date <input type="date" id="dGo" value="${g.values.date}"> Hotel <input type="date" id="dHotel" value="${W.items.hotel.values.date}"></div>
   <div class="row">Hotel jreq → <span class="mono">${esc(W.items.hotel.jreq)}</span> chain: ${M.jreqChain(W,'hotel').map(esc).join(' → ')||'—'} ${fl.conflict?'<span class="tag red">conflict: travel is not before check-in</span>':fl.broken?'<span class="tag red">broken jreq</span>':'<span class="tag g">ok</span>'}</div>
   <div class="row muted">notes: ${esc(JSON.stringify(W.items.trip.values.notes))}</div>`;
  const ow=W.owner||{}; $('owners').innerHTML=Object.keys(ow).length?'<table><tr><th>path</th><th>owner</th><th>rev</th></tr>'+Object.keys(ow).sort().map(k=>`<tr><td class="mono">${esc(k)}</td><td>${esc(ow[k])}</td><td>${W.pathRev[k]}</td></tr>`).join('')+'</table>':'<span class="muted">none yet</span>';
  renderScores(); }
$('alts').onclick=e=>{ const b=e.target.closest('button'), c=e.target.closest('.alt');
  if(b&&b.dataset.pref){ const m=b.dataset.pref; atlasSend([{path:'items/getthere/alts/pref',op:'ref',value:W.items.getthere.alts.pref===m?null:m}],'★ pref '+m); return; }
  if(b&&b.dataset.un){ const m=b.dataset.un, has=W.items.getthere.alts.unavail.indexOf(m)>=0; atlasSend([{path:'items/getthere/alts/unavail',op:has?'remove':'add',value:m}],'⊘ unavailable '+m); return; }
  if(c) atlasSend([{path:'items/getthere/state/userPick',op:'ref',value:c.dataset.m}],'pick '+c.dataset.m); };
$('bestBox').onclick=e=>{ if(e.target.id==='methodBtn'){ const m=W.items.getthere.alts.method==='sim'?'best':'sim'; atlasSend([{path:'items/getthere/alts/method',op:'set',value:m}],'set alts method '+m); } };
$('clearPick').onclick=()=>atlasSend([{path:'items/getthere/state/userPick',op:'ref',value:null}],'clear pick');
$('joys').onchange=e=>{ const j=e.target.dataset.j; if(!j) return; const by=+e.target.value-W.joys[j].value; if(by) atlasSend([{path:'joys/'+j+'/value',op:'delta',value:by}],'joy '+j+' '+(by>0?'+':'')+by); };
$('joys').oninput=e=>{ if(e.target.dataset.j) e.target.nextElementSibling.textContent=e.target.value; };
$('dates').onchange=e=>{ const map={dStart:'items/trip/values/start',dGo:'items/getthere/values/date',dHotel:'items/hotel/values/date'}; const p=map[e.target.id]; if(p&&e.target.value) atlasSend([{path:p,op:'set',value:e.target.value}],'set '+p); };
/* ---------- 2 console ---------- */
let BATCH=[];
function parseVal(s){ try{ return JSON.parse(s); }catch(e){ return s; } }
function renderBatch(){ $('cCount').textContent=fmt(BATCH.length)+' ops in batch (limit 5000)'+(BATCH.length>5000?' — over the limit':''); $('cBatch').textContent=BATCH.slice(0,30).map((o,i)=>i+': '+JSON.stringify(o)).join('\n')+(BATCH.length>30?'\n… '+fmt(BATCH.length-30)+' more':''); }
$('cAdd').onclick=()=>{ BATCH.push({path:$('cPath').value.trim(),op:$('cOp').value,value:parseVal($('cVal').value)}); renderBatch(); };
$('cFill').onclick=()=>{ const n=Math.max(0,Math.min(6000,+$('cN').value||0)); BATCH=Array.from({length:n},()=>({path:'joys/clock/value',op:'delta',value:1})); renderBatch(); };
$('cClear').onclick=()=>{ BATCH=[]; renderBatch(); };
function runConsole(ops,label){ const ent=submit(ops,'ui:console','console'); $('cRes').innerHTML=(label?'<div class="muted" style="margin-top:8px">'+esc(label)+'</div>':'')+resultHTML(ent); return ent; }
$('cSubmit').onclick=()=>runConsole(BATCH.slice());
const EX=[['Missing path (op #1)',[{path:'joys/fun/value',op:'delta',value:1},{path:'items/trip/values/nope',op:'set',value:1}]],
 ['Missing parent',[{path:'items/ghost/name',op:'set',value:'x'}]],
 ['add on existing scalar',[{path:'items/trip/name',op:'add',value:'x'}]],
 ['String joy delta ("2")',[{path:'joys/comfort/value',op:'delta',value:'2'}]],
 ['delta on a text joy',[{path:'joys/fun/value',op:'delta',value:1},{path:'joys/fun/value',op:'delta',value:1},{path:'joys/motto/value',op:'delta',value:1}]],
 ['Type change (number → string)',[{path:'joys/comfort/value',op:'set',value:'high'}]],
 ['remove on a scalar',[{path:'items/trip/name',op:'remove',value:'x'}]],
 ['Bad ref value',[{path:'items/getthere/alts/pref',op:'ref',value:'not a ref'}]],
 ['5001 ops (over limit)',Array.from({length:5001},()=>({path:'joys/clock/value',op:'delta',value:1}))],
 ['No-change: empty batch',[]],
 ['No-op: add existing list member',[{path:'items/trip/values/notes',op:'add',value:'passport'}]],
 ['Valid: 3-op batch',[{path:'items/getthere/state/userPick',op:'ref',value:'item:train_bus'},{path:'joys/fun/value',op:'delta',value:1},{path:'items/trip/values/notes',op:'add',value:'snacks'}]],
 ['Valid: 5000 ops',Array.from({length:5000},()=>({path:'joys/clock/value',op:'delta',value:1}))]];
$('cEx').innerHTML=EX.map((x,i)=>`<button class="b ${/Valid|No-/.test(x[0])?'':'r'}" data-ex="${i}">${esc(x[0])}</button>`).join('');
$('cEx').onclick=e=>{ const i=e.target.dataset.ex; if(i==null) return; BATCH=EX[i][1].map(o=>Object.assign({},o)); renderBatch(); runConsole(BATCH.slice(),'example: '+EX[i][0]); };
const st=P.selftest(); $('selftest').innerHTML=`<span class="${st.bad.length?'bad':'ok'}">${st.ok.length}/${st.ok.length+st.bad.length} checks pass</span> on a scratch synthetic atlas: ${st.ok.slice(0,4).map(esc).join('; ')} …`;
/* ---------- 3 sync: two replicas, each a real atlas ----------
   Each writer's segments are binary atlas/1 files (Exp7Sync.encodeSegment). A replica = mkAtlas() + every segment it knows, in
   Exp7Sync.cmpOrder (ts, writer, seq) order, applied through the real proposal checker (Exp7Proposals.check), so ownership,
   changed and overwrote come from the same engine as tabs 1/2/5, and ranking per replica is the real jbp + Exp7 Best(). */
let NET=true, WR, clockMs; const TS0=1793000000000;
function resetSync(){ window.Exp7Audit.epoch++; WR={alice:{id:'alice',seq:0,files:{},notices:[]},bob:{id:'bob',seq:0,files:{},notices:[]}}; clockMs=TS0; LOG.splice(0,LOG.length,...LOG.filter(l=>l.kind!=='segment')); renderSync(); }
function edit(w,ops){ const me=WR[w]; me.seq++; clockMs+=1000; const seg={v:2,atlas:'syn_trip',writer:w,seq:me.seq,ts:clockMs,ops};
  const bytes=X.encodeSegment(seg), name='log/'+w+'/'+String(me.seq).padStart(6,'0')+X.extOf(bytes); me.files[name]={bytes,repo:w+'/atlas-sync-log'};
  LOG.push({kind:'segment',writer:w,seg,bytes}); if(NET&&$('autoSync').checked) sync(true); else renderSync(); }
function entriesOf(w){ return Object.keys(WR[w].files).map(f=>{ const x=WR[w].files[f], seg=X.decodeSegment(x.bytes); return {seg,repo:x.repo,path:f,order:[seg.ts,seg.writer,+seg.seq,x.repo]}; }); }
function replica(w){ const A=mkAtlas(), res=[]; entriesOf(w).sort(X.cmpOrder).forEach(e=>{ const sg=e.seg;
    const p={id:'p_'+sg.writer+sg.seq,proc:'sync:'+sg.writer,baseRev:1000,t:sg.ts-TS0,ops:sg.ops}; const before=JSON.stringify(A),r=P.check(A,p); res.push({e,r}); window.Exp7Audit.capture(A,p,r,before,{scope:'replica:'+w,source:'actual segment replay observation',segmentTimestamp:sg.ts}); });
  return {A,res}; }
function sync(quiet){ if(!NET){ if(!quiet) ['alice','bob'].forEach(w=>WR[w].notices.unshift({c:'bad',t:'offline: nothing exchanged'})); renderSync(); return; }
  let n=0; [['alice','bob'],['bob','alice']].forEach(([a,b])=>Object.keys(WR[b].files).forEach(f=>{ if(!WR[a].files[f]&&f.startsWith('log/'+b+'/')){ WR[a].files[f]=WR[b].files[f]; n++; } }));
  if(!quiet) ['alice','bob'].forEach(w=>WR[w].notices.unshift({c:'g',t:'synced: pulled '+n+' segment(s) total'})); renderSync(); }
function renderSync(){ if(!WR) return; const D={}, RR={};
  const openRep={}; ['alice','bob'].forEach(w=>{ const d=document.querySelector('.writer[data-w="'+w+'"] details'); if(d) openRep[w]=d.open; });
  $('writers').innerHTML=['alice','bob'].map(w=>{ const R=replica(w), A=R.A, dg=JSON.stringify(A); D[w]=dg; RR[w]=R; const mine=Object.keys(WR[w].files), K=rank(A);
    const ev=[]; R.res.forEach(({e,r})=>{ const sg=e.seg; if(!r.ok){ ev.push({c:'red',t:`rejected: ${sg.writer}#${sg.seq} op ${r.op} ${r.reason}`}); return; }
      if(sg.writer===w) return; r.overwrote.forEach(o=>{ if(o.prevOwner==='sync:'+w) ev.push({c:'y',t:`overwrote: your ${o.path} was overwritten by ${sg.writer}#${sg.seq}`}); });
      r.changed.forEach(c=>ev.push({c:'',t:`changed: ${c.path} by ${sg.writer}#${sg.seq} (owner was ${c.from||'none'})`})); });
    const notes=WR[w].notices.concat(ev.reverse()), rows=[['items/trip/name',A.items.trip.name],['items/trip/values/notes',A.items.trip.values.notes],['items/getthere/state/userPick',A.items.getthere.state.userPick],['joys/comfort/value',A.joys.comfort.value]];
    return `<div class="card writer" data-w="${w}"><h3><span>${w==='alice'?'Alice':'Bob'} <span class="muted">repo ${w}/atlas-sync-log · ${mine.filter(f=>f.startsWith('log/'+w+'/')).length} own segs, ${mine.length} known · atlas rev ${A.rev}</span></span><span class="hash">${h64(dg)}</span></h3>
     <div class="row"><button class="b" data-a="pick" data-v="item:fl_direct">pick Direct</button><button class="b" data-a="pick" data-v="item:train_bus">pick Train</button><button class="b" data-a="comfort">comfort +1</button><button class="b" data-a="note">add note</button><button class="b" data-a="late">travel → 04-12 (conflict)</button><button class="b" data-a="ontime">travel → 04-09</button></div>
     <div class="row"><input size="22" placeholder="trip name" class="nm" value="${w==='alice'?'Alice weekend':'Bob road trip'}"><button class="b" data-a="name">set name</button></div>
     <table>${rows.map(([k,v])=>`<tr><td class="mono">${esc(k)}</td><td>${esc(JSON.stringify(v))}</td><td class="muted">${A.owner&&A.owner[k]?'owner '+esc(A.owner[k])+' · rev '+A.pathRev[k]:''}</td></tr>`).join('')}</table>
     <div class="res ok" style="margin-top:6px">Best on this replica: <b>${(bestRank(A).pick)?esc(A.items[bestRank(A).pick.pick.slice(5)].name):'—'}</b> (${(bestRank(A).pick)?esc(x7(bestRank(A).pick.why)):''}) · Selected: <b>${(selectedAlt(A)||{}).ref?esc(A.items[selectedAlt(A).ref.slice(5)].name):'—'}</b> · Exp7 order ${K.order.map(o=>esc(o.ref.slice(5))+' '+r2(o.score)).join(' › ')}</div>
     <details style="margin-top:6px"${openRep[w]||w==='alice'?' open':''}><summary>Standard views on this replica (real runtime.js: Plan + Board)</summary><div class="jrv" id="rv-${w}"></div><div id="rvi-${w}" style="font-size:12px"></div></details>
     <div style="margin-top:6px;max-height:120px;overflow:auto">${notes.slice(0,8).map(n=>`<div><span class="tag ${n.c}">${esc(n.t.split(':')[0])}</span> <span class="muted">${esc(n.t.slice(n.t.indexOf(':')+1))}</span></div>`).join('')||'<span class="muted">no notices</span>'}</div></div>`; }).join('');
  const same=D.alice===D.bob; $('conv').innerHTML=same?`<span class="tag g">converged: identical atlas bytes, hash ${h64(D.alice)}</span>`:`<span class="tag red">diverged: ${h64(D.alice)} ≠ ${h64(D.bob)}</span>`;
  const all=entriesOf('alice').concat(entriesOf('bob').filter(e=>!WR.alice.files[e.path])).sort(X.cmpOrder);
  $('order').innerHTML=all.length?all.map((e,i)=>`${i+1}. [ts ${e.seg.ts-TS0}, ${e.seg.writer}, ${e.seg.seq}] ${esc(JSON.stringify(e.seg.ops))}`).join('<br>'):'<span class="muted">no segments yet</span>';
  ['alice','bob'].forEach(w=>{ const det=document.querySelector('.writer[data-w="'+w+'"] details'); if(det&&(openRep[w]||(openRep[w]===undefined&&w==='alice'))) det.open=true;
    setView('rv-'+w,RR[w].A,['comp:reqs',BRD],V=>{ const x=$('rvi-'+w); if(x) x.innerHTML=jvStatus('rv-'+w)+(V.n&&!V.err?' · deps '+esc(V.deps||'—')+(V.secs.length?' · sections '+esc(V.secs.join(', ')):''):''); },true); });
  renderSyncDiff(RR); renderInspector('insSync');
  $('net').textContent='network: '+(NET?'online':'offline'); $('net').className='toggle '+(NET?'on-line':'off-line'); }
$('writers').onclick=e=>{ const b=e.target.closest('button'); if(!b) return; const w=e.target.closest('.writer').dataset.w, a=b.dataset.a;
  if(a==='pick') edit(w,[{op:'ref',path:'items/getthere/state/userPick',value:b.dataset.v}]);
  if(a==='late') edit(w,[{op:'set',path:'items/getthere/values/date',value:'2027-04-12'}]);
  if(a==='ontime') edit(w,[{op:'set',path:'items/getthere/values/date',value:'2027-04-09'}]);
  if(a==='comfort') edit(w,[{op:'delta',path:'joys/comfort/value',value:1}]);
  if(a==='note') edit(w,[{op:'add',path:'items/trip/values/notes',value:'note from '+w+' #'+(WR[w].seq+1)}]);
  if(a==='name') edit(w,[{op:'set',path:'items/trip/name',value:e.target.closest('.writer').querySelector('.nm').value}]); };
$('net').onclick=()=>{ NET=!NET; renderSync(); }; $('syncBtn').onclick=()=>sync(false); $('resetSync').onclick=resetSync;
$('scenario').onclick=()=>{ resetSync(); NET=true; edit('alice',[{op:'set',path:'items/trip/name',value:'Alice weekend'}]); sync(true); NET=false;
  edit('bob',[{op:'set',path:'items/trip/name',value:'Bob road trip'},{op:'delta',path:'joys/comfort/value',value:2}]); edit('alice',[{op:'ref',path:'items/getthere/state/userPick',value:'item:fl_direct'}]);
  edit('bob',[{op:'ref',path:'items/getthere/state/userPick',value:'item:train_bus'}]); NET=true; sync(false); };
window.exp7=Object.assign(window.exp7||{},{edit,sync,replica,rank,bestRank,selectedAlt,scorer,setNet:v=>{NET=v;renderSync();},WR:()=>WR});
/* ---------- 4 storage ---------- */
function jsonB(seg){ return te.encode(JSON.stringify(seg,null,1)).length; }
function binB(seg){ if(!codec) return null; try{ return codec.encode(te.encode(JSON.stringify(seg))).length; }catch(e){ return null; } }
function renderLog(){ let tj=0,tb=0; const rows=LOG.map((l,i)=>{ const j=jsonB(l.seg), b=binB(l.seg); tj+=j; tb+=b||Math.round(j*0.06); return `<tr><td>${i+1}</td><td>${l.kind}</td><td>${esc(l.writer)}</td><td>${l.seg.ops.length}</td><td class="mono">${esc(JSON.stringify(l.seg.ops).slice(0,70))}</td><td>${fmt(j)}</td><td>${b==null?'~'+fmt(Math.round(j*0.06))+' (est.)':fmt(b)}</td></tr>`; });
  $('logT').innerHTML='<tr><th>#</th><th>kind</th><th>writer</th><th>ops</th><th>ops (head)</th><th>JSON B (comparison only)</th><th>atlas/1 B (written)</th></tr>'+rows.join('');
  renderPathStats(); $('logSum').innerHTML=LOG.length?`<p><b>${LOG.length}</b> accepted batches this session · JSON interchange form (comparison only, never written) <b>${fmt(tj)} B</b> vs ${codec?'binary atlas/1 (real codec)':'estimated binary'} <b>${fmt(tb)} B</b> (${(tj/Math.max(1,tb)).toFixed(1)}× smaller)</p>`:'<p class="muted">Empty: make edits in tabs 1, 2, 3 or 5. Every accepted proposal and every writer segment appears here.</p>'; }
$('gen5k').onclick=()=>{ const t=performance.now(), seg={v:2,atlas:'demo',writer:'alice',seq:8,ts:124,ops:Array.from({length:5000},(_,i)=>({op:'set',path:'items/i'+(i%50)+'/values/v'+i,value:i}))};
  const jb=te.encode(JSON.stringify(seg,null,1)).length; let out=`<p>JSON interchange form (comparison only, never written): <span class="big">${fmt(jb)} B</span></p>`;
  if(codec){ const b=X.encodeSegment(seg), ms=(performance.now()-t).toFixed(0), rt=JSON.stringify(X.decodeSegment(b))===JSON.stringify(seg);
    out+=`<p>Binary atlas/1 (${esc(X.extOf(b))}, magic ${String.fromCharCode(b[0],b[1],b[2],b[3])}): <span class="big">${fmt(b.length)} B</span> — ${(jb/b.length).toFixed(1)}× smaller, under the 256 KB soft limit</p><p class="${rt?'ok':'bad'}">decode round-trip ${rt?'identical':'MISMATCH'} · ${ms} ms</p>`; }
  else out+=`<p class="bad">Codec not loaded: codec required to write; binary size unavailable here (documented: 9,721 B).</p>`;
  $('g5k').innerHTML=out+`<p class="muted">Reference from rest-sync-notes.md: 391,865 B JSON vs 9,721 B binary.</p>`; };
/* ---------- 5 circuit ---------- */
$('src').value=DEFAULT_SRC; let RULES=[];
const ARGS={pick:{group:'getthere',opt:'item:fl_layover'},rate:{j:'comfort',amt:2},unavailable:{group:'getthere',opt:'item:fl_direct'},tick:{}};
function getPath(p){ let o=W; for(const s of p.split('/')){ if(o==null||typeof o!=='object') return undefined; o=o[s]; } return o; }
function onSrc(){ const s=$('src').value; try{ const ast=L.parse(s), pr=L.print(ast), rt=L.print(L.parse(pr))===pr && JSON.stringify(L.strip(L.parse(pr)))===JSON.stringify(L.strip(ast));
    AST=ast; scoreStmt=ast.find(x=>x.score)||null; RULES=ast.filter(x=>x.on);
    $('parseRes').innerHTML=`<div class="res ok">Parsed ${ast.length} statements (${ast.filter(x=>x.score).length} score, ${RULES.length} on)</div>`; $('printed').textContent=pr;
    $('rt').innerHTML=`<span class="${rt?'ok':'bad'}">round-trip: print(parse(print(x))) ${rt?'== print(x), AST equal':'differs'}</span>`;
    const cur=$('evSel').value; $('evSel').innerHTML=RULES.map((r,i)=>`<option value="${i}">${esc(r.on)}(${r.params.join(', ')})${r.when?' when …':''}</option>`).join(''); const k=RULES.findIndex(r=>String(RULES.indexOf(r))===cur); if(k>=0) $('evSel').value=cur; setArgs();
    renderAtlas(); }
  catch(e){ $('parseRes').innerHTML=`<div class="res bad"><b>Error</b> ${e.line?'on line '+e.line+': ':''}${esc(String(e.message).replace(/^line \d+: /,''))}</div>`; } }
function setArgs(){ const r=RULES[+$('evSel').value]; if(!r) return; const a={}; r.params.forEach(p=>a[p]=(ARGS[r.on]||{})[p]??''); $('evArgs').value=JSON.stringify(a); }
function renderScores(){ if(!$('scoreInfo')) return; if(!scoreStmt){ $('scoreInfo').innerHTML='No score statement: every member scores 0 and Exp7 keeps member order.'; return; }
  const R=rank(W); $('scoreInfo').innerHTML=R.sc.ok?`<span class="mono">score ${esc(scoreStmt.score)}</span> → JBlueprint graph of <b>${R.sc.graph.nodes.length}</b> nodes / ${R.sc.graph.edges.length} wires, accepted by <span class="mono">jbp.compile</span>. Scores: `+W.items.getthere.alts.members.map(m=>esc(W.items[m.slice(5)].name)+' = <b>'+r2(R.sc.fn(m))+'</b>').join(', ')+`. Exp7 ${R.method==='sim'?'SimulatedBest()':'Best()'} Best: <b>${(bestRank(W).pick)?esc(bestRank(W).pick.pick):'—'}</b> (${(B=>{const x=bestRank(W).pick;return x?esc(x7(x.why)):'';})()}). Selected: <b>${(selectedAlt(W)||{}).ref||'—'}</b>. Edit the formula and tab 1 re-ranks live.<details><summary>graph</summary><pre>${esc(JSON.stringify(R.sc.graph))}</pre></details>`
   :`<span class="bad">score ${esc(scoreStmt.score)} rejected: ${esc(R.sc.errors.join('; '))}</span>`; }
function fire(ix,args){ const r=RULES[ix]; if(!r) return null; let ops;
  try{ ops=L.toOps(r,{args,get:getPath}); }catch(e){ return `<div class="res bad">${esc(r.on)}: ${esc(e.message)}</div>`; }
  if(!ops) return `<div class="res ok"><b>${esc(r.on)}</b>: when-condition false → no proposal</div>`;
  const pops=ops, ent=submit(pops,'circuit:'+r.on,'circuit');
  return `<div class="mono" style="margin-top:6px">${esc(r.on)}(${esc(JSON.stringify(args))}) → ${esc(JSON.stringify(pops))}</div>`+resultHTML(ent); }
$('src').oninput=onSrc; $('evSel').onchange=setArgs;
$('fire').onclick=()=>{ let a; try{ a=JSON.parse($('evArgs').value||'{}'); }catch(e){ $('fireRes').innerHTML='<div class="res bad">args must be JSON</div>'; return; } $('fireRes').innerHTML=fire(+$('evSel').value,a); };
$('fireAll').onclick=()=>{ const out=[]; RULES.forEach((r,i)=>out.push(fire(i,Object.assign({},ARGS[r.on]||{})))); $('fireRes').innerHTML=out.join(''); };
/* ---------- 6 paths: real flattened atlas paths ----------
   A path is exactly what Exp7Proposals.check / applyOp addresses: op.path.split('/') walked from the atlas object, roots limited to
   the shape() regex (items|joys|components|blueprints|clock), segments [A-Za-z0-9_]+. Objects are interior nodes; every scalar and
   every array is a leaf (arrays take add/remove as a whole path). Empty objects are listed as leaves (add creates a child). */
const PROOTS=['items','joys','components','blueprints','clock'], SEG=/^[A-Za-z0-9_]+$/;
const ptype=v=>Array.isArray(v)?'array':v===null?'null':typeof v;
function flatten(w){ const out=[]; (function walk(v,p){ if(v&&typeof v==='object'&&!Array.isArray(v)){ const ks=Object.keys(v).filter(k=>SEG.test(k)); if(!ks.length&&p.indexOf('/')>0){ out.push({path:p,v,t:'object'}); return; } ks.forEach(k=>walk(v[k],p?p+'/'+k:k)); } else if(p.indexOf('/')>0) out.push({path:p,v,t:ptype(v)}); })(PROOTS.reduce((o,r)=>{ if(w[r]!=null) o[r]=w[r]; return o; },{}),''); return out; }
/* op choices valid under the real checker's rules for the current type */
function opsFor(t,v){ if(t==='number') return ['delta','set']; if(t==='array') return ['add','remove']; if(t==='null') return ['ref','set'];
  if(t==='string') return /^[a-z]+:[A-Za-z0-9_]+(#[A-Za-z0-9]+)?$/.test(v)?['ref','set']:['set','ref']; if(t==='object') return ['add']; return ['set']; }
const LASTCH={}; let LASTP=null;
function notePaths(p,r){ const paths=[...new Set(p.ops.map(o=>o.path))], wrote=r.ok?r.changed.map(c=>c.path):[];
  if(r.ok) r.changed.forEach(c=>{ const o=p.ops.filter(x=>x.path===c.path).pop(); LASTCH[c.path]={pid:p.id,proc:p.proc,op:o.op,value:o.value,t:p.t,rev:r.rev,from:c.from}; });
  const m=/ops\[(\d+)\]/.exec(r.reason||''); const fi=r.ok?-1:(r.op>=0?r.op:(m?+m[1]:-1));
  LASTP={id:p.id,proc:p.proc,ok:r.ok,n:p.ops.length,paths,wrote,overwrote:r.ok?r.overwrote.map(o=>o.path):[],fi,fpath:fi>=0&&p.ops[fi]?p.ops[fi].path:(r.path||''),reason:r.reason||''}; }
function hlClass(path){ if(!LASTP) return ''; if(!LASTP.ok) return path===LASTP.fpath?'hlf':LASTP.paths.indexOf(path)>=0?'hlb':''; return LASTP.wrote.indexOf(path)>=0?'hl':LASTP.paths.indexOf(path)>=0?'hlb':''; }
function lastHTML(compact){ if(!LASTP) return '<div class="muted">No proposal yet. Submit one (any tab) and the touched paths light up here.</div>';
  const L=LASTP; if(!L.ok) return `<div class="res bad"><b>${esc(L.id)}</b> by ${esc(L.proc)} <b>rejected</b> (${fmt(L.n)} ops): failing op <b>#${L.fi<0?'(batch)':L.fi}</b>${L.fpath?' at <span class="mono">'+esc(L.fpath)+'</span>':''} · <span class="mono">${esc(L.reason)}</span>${compact?'':'<br><span class="muted">red = failing path, amber = other paths in the batch (nothing applied)</span>'}</div>`;
  return `<div class="res ok"><b>${esc(L.id)}</b> by ${esc(L.proc)} <b>accepted</b> (${fmt(L.n)} ops) · touched ${L.paths.length} path(s): ${L.paths.slice(0,8).map(p=>'<span class="mono">'+esc(p)+'</span>'+(L.wrote.indexOf(p)>=0?' <span class="tag g">changed</span>':' <span class="tag">no-op</span>')+(L.overwrote.indexOf(p)>=0?' <span class="tag y">overwrote</span>':'')).join(', ')}${L.paths.length>8?' …':''}</div>`; }
const vs=v=>{ const s=JSON.stringify(v); return s.length>60?s.slice(0,57)+'…':s; };
function rowHTML(x,w,compact){ const ow=(w.owner||{})[x.path], rv=(w.pathRev||{})[x.path], lc=w===W?LASTCH[x.path]:null;
  return `<tr class="prow ${w===W?hlClass(x.path):''}"><td><span class="pp mono" data-pclick="${esc(x.path)}" title="pre-fill console">${esc(x.path)}</span><button class="cp" data-copy="${esc(x.path)}" title="copy path">copy</button></td><td class="mono">${esc(vs(x.v))}</td><td>${x.t}</td>${compact?'':`<td>${rv||'—'}</td>`}<td>${ow?esc(ow):'<span class="muted">—</span>'}</td>${compact?'':`<td class="muted">${lc?esc(lc.pid+' '+lc.op+' '+vs(lc.value)+' @'+lc.t+'ms rev '+lc.rev):'—'}</td>`}</tr>`; }
const HEAD=c=>`<tr><th>path</th><th>value</th><th>type</th>${c?'':'<th>rev</th>'}<th>owner</th>${c?'':'<th>last change</th>'}</tr>`;
function filt(rows,pre,q){ pre=(pre||'').trim(); q=(q||'').trim().toLowerCase(); return rows.filter(x=>(!pre||x.path.startsWith(pre))&&(!q||x.path.toLowerCase().indexOf(q)>=0||JSON.stringify(x.v).toLowerCase().indexOf(q)>=0)); }
let PMODE='tree'; const CLOSED=new Set();
function treeHTML(rows){ const root={k:{},rows:[]}; rows.forEach(x=>{ const s=x.path.split('/'); let n=root; s.slice(0,-1).forEach(k=>{ n=n.k[k]=n.k[k]||{k:{},rows:[]}; }); n.rows.push(x); });
  const anc=p=>{ if(!LASTP) return ''; const pre=p+'/'; if(!LASTP.ok) return LASTP.fpath.startsWith(pre)?'ancf':''; return LASTP.wrote.some(x=>x.startsWith(pre))?'anc':''; };
  const rec=(n,p)=>Object.keys(n.k).map(k=>{ const q=p?p+'/'+k:k, c=n.k[k]; return `<details ${CLOSED.has(q)?'':'open'} class="${anc(q)}" data-node="${esc(q)}"><summary>${esc(k)}/ <span class="muted">${countLeaves(c)}</span></summary>${rec(c,q)}${c.rows.length?'<table style="margin-left:14px;width:calc(100% - 14px)">'+c.rows.map(x=>rowHTML(x,W)).join('')+'</table>':''}</details>`; }).join('');
  return '<div class="ptree" style="margin-left:-14px">'+rec(root,'')+'</div>'; }
function countLeaves(n){ return n.rows.length+Object.values(n.k).reduce((s,c)=>s+countLeaves(c),0); }
function ghost(rows){ return (LASTP&&!LASTP.ok&&LASTP.fpath&&!rows.some(x=>x.path===LASTP.fpath))?`<div class="res bad mono" style="margin:4px 0">${esc(LASTP.fpath)} — not in atlas (${esc(LASTP.reason)})</div>`:''; }
function renderPaths(){ const all=flatten(W), rows=filt(all,$('pPre').value,$('pQ').value);
  $('pCount').textContent=rows.length+' / '+all.length+' paths · atlas rev '+W.rev; $('pLast').innerHTML=lastHTML(false)+ghost(rows);
  $('pvTree').classList.toggle('p',PMODE==='tree'); $('pvFlat').classList.toggle('p',PMODE==='flat');
  $('pBody').innerHTML=PMODE==='tree'?treeHTML(rows):'<table>'+HEAD(false)+rows.map(x=>rowHTML(x,W)).join('')+'</table>'; }
function renderInspector(id){ const el=$(id); if(!el) return; const rows=filt(flatten(W),'',$(id+'F').value); const hot=r=>hlClass(r.path)?0:1;
  el.innerHTML=lastHTML(true)+ghost(rows)+'<table>'+HEAD(true)+rows.slice().sort((a,b)=>hot(a)-hot(b)).map(x=>rowHTML(x,W,true)).join('')+'</table>'; }
const PATH_REFRESH_CACHE=new Map();
function refreshPaths(){ if(!$('pBody')) return; const run=(id,filters,render)=>{const el=$(id);if(!el?.closest('section')?.classList.contains('on'))return;const stamp=JSON.stringify([W.rev,LASTP&&LASTP.id,...filters]);if(PATH_REFRESH_CACHE.get(id)===stamp)return;render();PATH_REFRESH_CACHE.set(id,stamp);};run('pBody',[PMODE,$('pPre').value,$('pQ').value],renderPaths);['insAtlas','insConsole','insSync'].forEach(id=>run(id,[$(id+'F').value],()=>renderInspector(id))); }
$('pvTree').onclick=()=>{PMODE='tree';renderPaths();}; $('pvFlat').onclick=()=>{PMODE='flat';renderPaths();};
$('pPre').oninput=$('pQ').oninput=renderPaths; ['insAtlas','insConsole','insSync'].forEach(i=>$(i+'F').oninput=()=>renderInspector(i));
$('pOpen').onclick=()=>{CLOSED.clear();renderPaths();}; $('pClose').onclick=()=>{ document.querySelectorAll('#pBody details').forEach(d=>CLOSED.add(d.dataset.node)); renderPaths(); };
$('pBody').addEventListener('toggle',e=>{ const d=e.target; if(d.dataset&&d.dataset.node){ d.open?CLOSED.delete(d.dataset.node):CLOSED.add(d.dataset.node); } },true);
function prefill(path){ const x=flatten(W).find(r=>r.path===path); if(!x) return; const ops=opsFor(x.t,x.v), op=ops[0];
  $('cOp').innerHTML=ops.map(o=>`<option>${o}</option>`).join(''); $('cOp').value=op; $('cOp').dataset.path=path;
  const val=o=>o==='delta'?'1':o==='add'?(x.t==='object'?'"x"':/\/unavail$/.test(path)?JSON.stringify((getPath(path.replace(/\/unavail$/,'/members'))||[])[0]||'new'):'"new"'):o==='remove'?JSON.stringify((x.v||[])[0]??''):o==='ref'?JSON.stringify(x.t==='string'?x.v:null):JSON.stringify(x.v);
  $('cPath').value=x.t==='object'?path+'/new_field':path; $('cVal').value=val(op); $('cOp').onchange=()=>{ if($('cOp').dataset.path===path) $('cVal').value=val($('cOp').value); };
  show('console'); $('cRes').innerHTML=`<div class="muted" style="margin-top:8px">pre-filled from path <span class="mono">${esc(path)}</span> (${x.t}; valid ops: ${ops.join(', ')}). Press “+ add op” then Submit.</div>`; }
const ALLOPS='<option>set</option><option>delta</option><option>add</option><option>remove</option><option>ref</option>';
$('cPath').addEventListener('input',()=>{ $('cOp').innerHTML=ALLOPS; delete $('cOp').dataset.path; });
function copyText(s){ try{ if(navigator.clipboard&&window.isSecureContext){ navigator.clipboard.writeText(s).catch(()=>{}); return true; } }catch(e){}
  const t=document.createElement('textarea'); t.value=s; document.body.appendChild(t); t.select(); let ok=false; try{ ok=document.execCommand('copy'); }catch(e){} t.remove(); return ok; }
document.addEventListener('click',e=>{ const c=e.target.closest('[data-copy]'); if(c){ copyText(c.dataset.copy); c.textContent='✓'; setTimeout(()=>{c.textContent='copy';},900); window.exp7lastCopy=c.dataset.copy; return; }
  const p=e.target.closest('[data-pclick]'); if(p) prefill(p.dataset.pclick); });
/* tab 3: per-replica diff + merge winners from the real check() results (changed / overwrote) */
function renderSyncDiff(RR){ if(!$('syncDiff')) return; const fa=flatten(RR.alice.A), fb=flatten(RR.bob.A), ma={}, mb={}; fa.forEach(x=>ma[x.path]=x); fb.forEach(x=>mb[x.path]=x);
  const keys=[...new Set(Object.keys(ma).concat(Object.keys(mb)))].sort(), diff=keys.filter(k=>JSON.stringify((ma[k]||{}).v)!==JSON.stringify((mb[k]||{}).v)||(RR.alice.A.owner||{})[k]!==(RR.bob.A.owner||{})[k]);
  const own=(A,k)=>{ const o=(A.owner||{})[k]; return o?esc(o)+' · rev '+A.pathRev[k]:'—'; };
  let h=diff.length?`<p><b>${diff.length}</b> path(s) differ between replicas (value or owner):</p><table><tr><th>path</th><th>Alice value</th><th>Alice owner</th><th>Bob value</th><th>Bob owner</th></tr>`+diff.map(k=>`<tr class="hlf"><td class="mono">${esc(k)}</td><td class="mono">${ma[k]?esc(vs(ma[k].v)):'(absent)'}</td><td>${own(RR.alice.A,k)}</td><td class="mono">${mb[k]?esc(vs(mb[k].v)):'(absent)'}</td><td>${own(RR.bob.A,k)}</td></tr>`).join('')+'</table>'
   :`<p class="ok">No path differs: all ${keys.length} flattened paths identical on both replicas (values and owners).</p>`;
  ['alice','bob'].forEach(w=>{ const W2=[]; RR[w].res.forEach(({e,r})=>{ const sg=e.seg; if(!r.ok){ W2.push(`<tr class="hlf"><td>${sg.writer}#${sg.seq}</td><td class="mono">${esc(r.path||'')}</td><td><span class="tag red">rejected</span> op ${r.op} ${esc(r.reason)}</td></tr>`); return; }
      r.changed.forEach(c=>{ const ov=r.overwrote.find(o=>o.path===c.path); W2.push(`<tr><td>${sg.writer}#${sg.seq}</td><td class="mono">${esc(c.path)}</td><td><span class="tag g">changed</span> ${c.from?'from owner '+esc(c.from):'(no prior owner)'}${ov?' <span class="tag y">overwrote</span> loser '+esc(ov.prevOwner):''}</td></tr>`); }); });
    const fin={}; RR[w].res.forEach(({e,r})=>{ if(r.ok) r.changed.forEach(c=>{ (fin[c.path]=fin[c.path]||[]).push(e.seg.writer+'#'+e.seg.seq); }); });
    const contested=Object.keys(fin).filter(k=>new Set(fin[k].map(s=>s.split('#')[0])).size>1);
    h+=`<details ${w==='alice'?'open':''}><summary><b>${w==='alice'?'Alice':'Bob'} replica</b>: path writes in merge order (${W2.length}) · contested paths: ${contested.length?contested.map(k=>'<span class="mono">'+esc(k)+'</span> winner <b>'+esc(fin[k][fin[k].length-1])+'</b>, losers '+esc(fin[k].slice(0,-1).join(', '))).join('; '):'none'}</summary><table>${W2.join('')||'<tr><td class="muted">no segments</td></tr>'}</table></details>`; });
  $('syncDiff').innerHTML=h; }
/* tab 4: per-path counts and bytes of the session log (op JSON bytes; atlas/1 per-path bytes are not separable inside a segment) */
function renderPathStats(){ if(!$('pathStats')) return; const S={}; LOG.forEach(l=>l.seg.ops.forEach(o=>{ const s=S[o.path]=S[o.path]||{n:0,b:0,ops:{},w:new Set()}; s.n++; s.b+=te.encode(JSON.stringify(o)).length; s.ops[o.op]=(s.ops[o.op]||0)+1; s.w.add(l.writer); }));
  const ks=Object.keys(S).sort((a,b)=>S[b].n-S[a].n); $('pathStats').innerHTML=ks.length?'<p class="muted">Counts every op in every logged batch/segment by path; bytes = JSON bytes of each op (comparison only). Per-path binary bytes are not separable inside an atlas/1 segment, so they are not shown.</p><table><tr><th>path</th><th>ops</th><th>by op</th><th>writers</th><th>op JSON B</th></tr>'+ks.map(k=>`<tr><td class="mono">${esc(k)}</td><td>${fmt(S[k].n)}</td><td>${Object.entries(S[k].ops).map(([o,n])=>o+'×'+n).join(' ')}</td><td>${esc([...S[k].w].join(', '))}</td><td>${fmt(S[k].b)}</td></tr>`).join('')+'</table>':'<span class="muted">log empty</span>'; }
window.exp7paths={flatten,opsFor,LAST:()=>LASTP};

/* ---------- standard Exp7 views: calendar / board / plan (dependencies & sequence) ----------
   Every view is the REAL runtime.js output (calHtml / boardHtml / planHtml / depsHtml / sectionHtml, eval.js passes, atlas.js
   model, Exp7 engine) for a JSON snapshot of the SAME atlas the proposal checker writes, drawn by JRender. Views are read-only
   (spec 42 §5) and take no input yet (JRender has no per-item hit ids). The snapshot sets root and clock.on=false only. */
const CAL='comp:trip_calendar', BRD='comp:trip_calendar_board', PLN='comp:trip_calendar_plan';
/* Views are drawn by JRender (Artist build jrender-exp7, embedded unchanged: jrender.js glue + jrender_full_small.wasm + JRF font).
   Pipeline per view:
   1. a live session of the REAL atlas/runtime.js (exactly as atlas/build_atlas.js embeds it) runs in this page through a factory
      scope with its own window/document/timer objects on a JSON snapshot of the live atlas (real eval.js passes, main thread) and
      renders calHtml / boardHtml / planHtml / depsHtml / sectionHtml into a string (never inserted into the page). The session keeps
      the document listeners runtime.js registers, so a click on a JRender hit id is delivered to runtime.js's own click handler
      with the parsed element as target (compAct / pickAlt / dayClick / item event).
   2. the HTML is parsed off-screen (DOMParser) and laid out by JRViews.layout into JRender draw-list nodes with stable ids
      (rects, rounded rects, borders, vector text measured and ellipsised in wasm, hit regions, one scroll/clip group).
   3. first draw = jrd_load; every later render (atlas batch, replica sync, view action, width change) = a JRDP patch computed by
      node id (replace / insert / remove / grect). All views share ONE wasm Core (one scene handle each) and one GPUDevice.
   A view action that changes atlas paths becomes a proposal through the real checker (proc ui:views); view-local state
   (components/<id>/state: sort, filter, show, detail) stays in the view session and is carried over to the next snapshot.
   No substitute drawing: if WebGPU or the wasm is unavailable the view shows the error text and diagnostics. */
