/* Exp7 views host impl — extracted from accepted Exp7 lean demo pipeline.
   Depends on: JAtlasModel, JAtlasEval, JA_RUNTIME_FACTORY, JRViews, $, esc, x7, RISK_*.
   Propose path: per-host window.__exp7ViewsPropose[id] if set, else global submit() when present. */
const JVS=window.JVS=window.JVS||{}, PAGEERR=window.PAGEERR=window.PAGEERR||[];
const JRO=window.JRO=(typeof ResizeObserver!=='undefined'?new ResizeObserver(es=>es.forEach(e=>{ const V=JVS[e.target.id], w=Math.round(e.contentRect.width); if(V&&V.sess&&V.html!=null&&w>0&&Math.abs(w-V.w)>8){ V.w=Math.max(1,w); requestAnimationFrame(()=>V.queue(V.sess,'resize')); } })):null);
if(!window.__exp7ViewsHostListeners){ window.__exp7ViewsHostListeners=1;
  window.addEventListener('error',e=>{ if(/^ResizeObserver loop/.test(String(e.message))) return; PAGEERR.push(String(e.message||e)+(e.lineno?' (line '+e.lineno+')':'')); if(PAGEERR.length>20) PAGEERR.shift(); });
  window.addEventListener('unhandledrejection',e=>{ PAGEERR.push('unhandled rejection: '+String(e.reason&&e.reason.message||e.reason)); });
}
function atlasRev(w){ return w.rev||0; } /* proposal checker: w.rev bumps once per accepted batch that wrote */
function activeAtlas(V){ return (V&&V.atlasW) || (typeof W!=='undefined'?W:null); }
function rootCompId(V){ const r=V&&V.root&&V.root[0]; return (r&&String(r).indexOf('comp:')===0)?String(r).slice(5):null; }
function rootComp(V){ const id=rootCompId(V), AW=activeAtlas(V); return (id&&AW&&AW.components&&AW.components[id])||null; }
function isCalRoot(V){ const c=rootComp(V); return !!(c&&c.view&&c.view.layout==='calendar'); }
function isBoardRoot(V){ const c=rootComp(V); return !!(c&&c.view&&c.view.layout==='board'); }
function calCompId(V){ if(isCalRoot(V)) return rootCompId(V); const AW=activeAtlas(V)||{}; if(AW.meta&&AW.meta.calId) return AW.meta.calId; if(AW.components&&AW.components.trip_calendar) return 'trip_calendar'; const id=rootCompId(V); return id||'trip_calendar'; }
function boardCompId(V){ if(isBoardRoot(V)) return rootCompId(V); const AW=activeAtlas(V)||{}; if(AW.meta&&AW.meta.boardId) return AW.meta.boardId; const cid=calCompId(V); if(AW.components&&AW.components[cid+'_board']) return cid+'_board'; if(AW.components&&AW.components.trip_calendar_board) return 'trip_calendar_board'; return cid+'_board'; }
function planCompId(V){ const AW=activeAtlas(V)||{}; if(AW.meta&&AW.meta.planId) return AW.meta.planId; if(AW.components&&AW.components.reqs) return 'reqs'; const cid=calCompId(V); if(AW.components&&AW.components[cid+'_plan']) return cid+'_plan'; return 'reqs'; }

function proposeOps(V, ops, proc, src){
  const id=V&&V.id; const hook=window.__exp7ViewsPropose&&id&&window.__exp7ViewsPropose[id];
  if(typeof hook==='function') return hook(ops, proc, src);
  if(typeof submit==='function') return submit(ops, proc||'ui:views', src);
  return null;
}
/* live runtime.js session on a snapshot */
function startRuntime(w,root,carry,onHtml,pins){ const s=JSON.parse(JSON.stringify(w)); s.root=root; if(s.clock) s.clock.on=false;
  if(pins) Object.keys(pins).forEach(k=>{ const it=s.items[k]; if(it&&it.alts&&pins[k]){ it.state=it.state||{}; if(!it.state.userPick) it.state.userPick=pins[k]; } });
  if(carry) Object.keys(carry).forEach(c=>{ if(s.components&&s.components[c]) s.components[c].state=JSON.parse(JSON.stringify(carry[c])); });
  const S={s,html:'',renders:0,errs:[],L:{},dead:false,settled:false,clicks:0}; let quiet=null, first; const timers=[]; S.ready=new Promise(r=>first=r);
  const fire=()=>{ if(S.dead) return; if(!S.settled){ S.settled=true; first(S); } else onHtml(S); };
  const bump=()=>{ clearTimeout(quiet); quiet=setTimeout(fire,40); };
  const app={ set innerHTML(v){ S.html=String(v); S.renders++; bump(); }, get innerHTML(){ return S.html; }, querySelector(){ return null; }, querySelectorAll(){ return []; } };
  const fd={ getElementById:id=>id==='ja-atlas'?{textContent:JSON.stringify(s)}:id==='app'?app:null, addEventListener(t,f){ (S.L[t]=S.L[t]||[]).push(f); }, querySelector(){ return null; }, querySelectorAll(){ return []; }, elementFromPoint(){ return null; } };
  const fw={ JAtlasModel:window.JAtlasModel, JAtlasEval:window.JAtlasEval };
  const st=(f,ms)=>{ const t=setTimeout(()=>{ if(S.dead) return; try{ f(); }catch(e){ S.errs.push(String(e&&e.message||e)); } bump(); },ms); timers.push(t); return t; };
  S.dispose=()=>{ S.dead=true; timers.forEach(clearTimeout); clearTimeout(quiet); };
  S.dispatch=(type,el)=>{ S.clicks++; const ev={type,target:el,clientX:0,clientY:0,button:0,preventDefault(){},stopPropagation(){}}; (S.L[type]||[]).forEach(f=>{ try{ f(ev); }catch(e){ S.errs.push(type+' handler: '+String(e&&e.message||e)); } }); bump(); };
  window.JA_RUNTIME_FACTORY(fw,fd,st,()=>0,undefined); S.J=fw.JAtlas;
  setTimeout(()=>{ if(!S.settled&&!S.dead){ S.errs.push('runtime passes did not settle within 4 s (rendered what it had)'); fire(); } },4000); bump(); return S; }
/* atlas paths a view action changed in its session snapshot -> proposal ops (view-local components/<id>/state excluded) */
const VROOTS=['items','components','joys'];
function pick(s){ const o={}; VROOTS.forEach(k=>o[k]=JSON.parse(JSON.stringify(s[k]||{}))); return o; }
function viewOps(a,b){ const ops=[]; const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
  const walk=(x,y,p)=>{ if(JSON.stringify(x)===JSON.stringify(y)) return; if(/^components\/[^/]+\/state$/.test(p)||/^items\/[^/]+\/state\/(pick|pickWhy)$/.test(p)) return; /* view-local state; eval.js-derived pick */
    if(x===undefined){ ops.push({path:p,op:'add',value:y}); return; } if(y===undefined) return;
    if(isObj(x)&&isObj(y)){ new Set(Object.keys(x).concat(Object.keys(y))).forEach(k=>walk(x[k],y[k],p+'/'+k)); return; }
    if(Array.isArray(x)&&Array.isArray(y)&&x.concat(y).every(v=>typeof v==='string')){ y.filter(v=>x.indexOf(v)<0).forEach(v=>ops.push({path:p,op:'add',value:v})); x.filter(v=>y.indexOf(v)<0).forEach(v=>ops.push({path:p,op:'remove',value:v})); return; }
    ops.push({path:p,op:/\/state\/userPick$/.test(p)?'ref':'set',value:y}); };
  VROOTS.forEach(r=>walk(a[r],b[r],r)); return ops; }
function jvStatus(id){ const V=JVS[id]; if(!V) return ''; if(V.err) return '<div class="bad" style="white-space:pre-wrap">JRender view not drawn: '+esc(V.err)+'</div><div class="muted" style="font-size:11px">no substitute drawing. Press "Copy diagnostics" for details.</div>';
  if(!V.n) return '<span class="muted">drawing with JRender…</span>';
  const po=V.lastOps; return `JRender scene #${V.handle} · ${V.nodes} nodes (${V.hits} hit) · ${V.glyphs} glyphs · ${V.items} item(s), ${V.rows} row(s) · content ${V.w}×${V.H} (view ${V.VH}${V.H>V.VH?', scrolls':''}) · ${V.ms.toFixed(1)} ms · full loads ${V.loads} · patches ${V.patches}${po?' (last: '+po.replace+' replace, '+po.insert+' insert, '+po.remove+' remove'+(po.grect?', resize':'')+')':''} · atlas rev ${V.rev} · runtime.js pass ${V.passes} (${esc(V.backend||'')}, ${esc(x7(V.engine||''))})${V.clicks?' · clicks '+V.clicks:''}${V.note?' · '+esc(V.note):''}${V.rerrs.length?' · <span class="bad">runtime errors: '+esc(V.rerrs.join(' | '))+'</span>':''}`; }
/* draw a view: id = container element id (it holds one <canvas>); w = atlas; ro = read-only (replica: actions that write are not proposed) */
function setView(id,w,root,cb,ro){ const box=$(id); if(!box) return;
  const V=JVS[id]=JVS[id]||{id,n:0,err:'',view:new JRViews.View(),rerrs:[],loads:0,patches:0,clicks:0,chain:Promise.resolve()}; V.cb=cb; V.ro=!!ro; V.root=root; V.plan=root[0]==='comp:reqs'; V.open=V.open||{};
  if(V.wi&&V.wi.rev!==atlasRev(w)){ V.wi=null; V.note='what-if cleared: the live atlas changed'; }
  if(JRO&&V.obs!==box){ JRO.observe(box); V.obs=box; }
  V.w=Math.max(1,Math.round(box.clientWidth)||V.w||900);
  let cv=V.cv||box.querySelector('canvas'); if(!cv) cv=document.createElement('canvas'); if(cv.parentNode!==box){ box.querySelectorAll('canvas').forEach(c=>c!==cv&&c.remove()); box.appendChild(cv); } V.cv=cv; /* the same canvas (and its scene) follows the view when the panel is re-rendered */
  const rev=atlasRev(w), VA=V.sess&&(V.sess.J&&V.sess.J.atlas||V.sess.s), carry=VA?Object.fromEntries(Object.keys(VA.components||{}).filter(c=>VA.components[c].state).map(c=>[c,VA.components[c].state])):null;
  if(V.sess) V.sess.dispose();
  const fail=e=>{ V.err=String(e&&e.message||e)+(e&&e.code?' [code '+e.code+']':''); V.code=e&&e.code||null; cv.style.display='none'; const pe=box.querySelector('.jrerr')||box.appendChild(Object.assign(document.createElement('div'),{className:'jrerr bad'})); pe.textContent='JRender view not drawn: '+V.err; if(V.cb) V.cb(V); };
  V.queue=(S,why)=>{ V.chain=V.chain.then(async()=>{ if(isCalRoot(V)&&(await calStateOnlyAsync(V,why))) return; return draw(S,why); }).catch(fail); return V.chain; };
  const draw=async(S,why)=>{ if(V.sess!==S) return; const d=new DOMParser().parseFromString('<div id="app">'+S.html+'</div>','text/html').getElementById('app');
    hostDoc(d,V); if(V.plan) planDoc(V,d,S.J&&S.J.atlas||S.s);
    const r=await V.view.show(cv,d,V.w); if(V.sess!==S) return; if(V.form) attachFormFields(V); const J=S.J||{}, L=r.L, sum=d.querySelector('.ja-deps-sum'); V.html=S.html; V.doc=d; V.lastMode=r.mode; if(isCalRoot(V)) bindCalViewStates(V);
    Object.assign(V,{n:V.n+1,err:'',code:null,tboxes:L.tboxes.length,tlines:L.tboxes.reduce((s,t)=>s+t.count,0),tbl:L.tboxes,notdef:L.notdef,why,items:L.items,rows:L.rows,glyphs:L.glyphs,nodes:L.nodes.length,hits:L.hits,H:L.H,VH:r.VH,ms:r.ms,px:r.px,handle:r.handle,loads:V.view.loads,patches:V.view.patches,lastOps:r.mode==='patch'?r.ops:V.lastOps,mode:r.mode,rev,
      passes:J.passes,backend:J.backend,engine:J.engine,rerrs:S.errs.concat((J.last&&J.last.errors)||[]).map(String),conflicts:(J.conflicts||[]).length,cycles:(J.cycles||[]).length,deps:sum?sum.textContent:null,
      secs:[].map.call(d.querySelectorAll('.ja-section'),x=>x.dataset.rule+':'+x.dataset.n),days:d.querySelectorAll('.ja-day').length,
      dayItems:Object.fromEntries([].filter.call(d.querySelectorAll('.ja-day[data-day]'),x=>x.querySelector('.ja-chip')).map(x=>[x.dataset.day,[].map.call(x.querySelectorAll('.ja-chip'),c=>c.textContent)])),
      chips:d.querySelectorAll('.ja-chip').length,brows:d.querySelectorAll('.ja-brow').length,brownames:[].map.call(d.querySelectorAll('.ja-brow'),x=>x.textContent.replace(/\s+/g,' ').trim()),
      month:(d.querySelector('.ja-month')||{}).textContent||null,show:(d.querySelector('.ja-sw.on')||{}).textContent||null,detail:!!d.querySelector('.ja-detail'),
      flags:[].map.call(d.querySelectorAll('.ja-flag'),x=>x.textContent),text:d.textContent.replace(/\s+/g,' ').slice(0,4000),at:Date.now()});
    cv.style.display=''; const pe=box.querySelector('.jrerr'); if(pe) pe.remove(); cv.dataset.jrRev=rev; cv.dataset.jrDraw=V.n; if(V.cb) V.cb(V); };
  V.view.onact=(el,act,n,mods)=>{ const S=V.sess; if(!S) return; V.clicks++;
    if(act==='jv'){ blurTextFields(V); const a=el.getAttribute('data-jv-act')||''; if(a.startsWith('cal:')||a==='form:ok'||a==='form:cancel'||a.startsWith('pick:')||a.startsWith('use:')||a.startsWith('res:')||a.startsWith('alt:')){
      if(a.startsWith('cal:')) hostCalAct(V,a); else if(a.startsWith('use:')||a.startsWith('res:')||a.startsWith('alt:')) hostBoardAct(V,a); else hostFormAct(V,a); return; }
      planAct(V,a); return; }
    if(act==='reqrow'){ const it=el.getAttribute('data-dep-item'), AW=activeAtlas(V)||{}, x=(AW.items||{})[String(it).replace(/^item:/,'')]; V.sel=it; V.note='selected '+it+(x?' ('+x.name+', jreq '+(x.jreq||'none')+')':''); if(V.cb) V.cb(V); return; }
    if(act==='day'&&isCalRoot(V)){ hostDayClick(V,el.getAttribute('data-day'),mods||{}); return; }
    if(act==='act:new'&&isBoardRoot(V)){ V.form={kind:'newitem',name:'',jreq:'',comfort:'',fun:'',cost:'',hours:'',usesIds:{}}; V.formFocus='name'; return V.queue(S,'form'); }
    V.pending={before:pick(S.J&&S.J.atlas||S.s),act,label:el.textContent.replace(/\s+/g,' ').trim().slice(0,40)}; S.dispatch('click',el); };
  V.view.ondrag=(phase,n,mods,e)=>{ if(isCalRoot(V)) hostDayDrag(V,phase,n,mods||{},e); };
  const onHtml=S=>{ if(V.sess!==S) return; const P=V.pending; V.pending=null;
    if(P){ const ops=viewOps(P.before,pick(S.J&&S.J.atlas||S.s)); V.lastAct={act:P.act,label:P.label,ops};
      if(ops.length){ if(V.ro){ V.note='replica view: "'+P.label+'" would write '+ops.length+' path(s); replica views do not propose'; setView(id,w,root,cb,ro); return; }
        V.note='"'+P.label+'" → proposal ('+ops.length+' op(s))'; V.lastAct.ent=proposeOps(V,ops,'ui:views','view:'+id+' '+P.act); return; }
      V.note='"'+P.label+'" (view-local)'; }
    V.queue(S,P?'action':'runtime'); };
  let S; V.pins=V.plan?livePins(w):null; V.atlasW=w; try{ S=startRuntime(w,root,carry,onHtml,V.pins); }catch(e){ fail(e); return; }
  V.sess=S; S.ready.then(()=>V.queue(S,'atlas')); }

/* ---------- Exp7 host UX: calendar selection + board resources/forms (JRender-drawn) ----------
   Text entry: native JRender TextField (glue owns the hidden textarea). Drag-range via EV.DRAGSTART/DRAG/DRAGEND + NF.DRAG on days.
   Plan-risk highlighting (legacy easy228 system) drives calendar days + plan steps from the same planRisk() map. */
const MODS={shift:false,ctrl:false,meta:false}; window.exp7mods=MODS;
document.addEventListener('keydown',e=>{ if(e.key==='Shift') MODS.shift=true; if(e.key==='Control') MODS.ctrl=true; if(e.key==='Meta') MODS.meta=true; });
document.addEventListener('keyup',e=>{ if(e.key==='Shift') MODS.shift=false; if(e.key==='Control') MODS.ctrl=false; if(e.key==='Meta') MODS.meta=false; });
function planRisk(w){
  /* Port of ranking_ui easy228 rdCalStrip / path-health rules, computed from PLAN data:
     Legacy: headroom = min balance until next payday (1st/15th); CRITICAL if hr<hc OR fixed event that day;
     MODERATE if hr<hm OR fixed within ±3 days; LOW else. Path health GOOD/MARGINAL/BAD same palette.
     Plan feeds: dated reqs/calendar steps = fixed events; selected alt cost (Best()/userPick) → outflow;
     jreq slack (dayDiff), broken/conflict/cycle flags, resource stock pressure, what-if alt scores. */
  const ht=RISK_HT, CC=RISK_COL;
  const cal=(w.components&&(w.components[(w.meta&&w.meta.calId)||'trip_calendar']||w.components.trip_calendar))||{}, req=(w.components&&(w.components[(w.meta&&w.meta.planId)||'reqs']||w.components.reqs))||{};
  const ids=new Set([...(cal.items||[]),...(req.items||[])].map(r=>String(r).replace(/^item:/,'')));
  const steps=[]; ids.forEach(id=>{ const it=w.items[id]; if(!it) return; const v=it.values||{}, d=v.date;
    const F=(typeof E!=='undefined'&&E.itemFlags)?E.itemFlags(w,'item:'+id):{};
    let pick=null, cost=0, hours=0, allBad=false, winBad=false, slack=null;
    if(it.alts&&it.alts.members&&it.alts.members.length){
      let R=null; try{ R=rank(w,id); }catch(e){}
      const pk=(it.state&&(it.state.userPick||it.state.pick||it.state.simPick))||(R&&R.pick&&R.pick.pick)||it.alts.members[0];
      pick=pk; const o=w.items[String(pk).replace(/^item:/,'')]; if(o&&o.values){ cost=+o.values.cost||0; hours=+o.values.hours||0; }
      const scores=(R&&R.order)||[]; if(scores.length){ const worst=scores[scores.length-1]; winBad=pk===worst.ref; allBad=scores.every(x=>x.score!=null&&x.score<=0); }
    } else { cost=+(v.cost)||0; hours=+(v.hours)||0; }
    if(it.jreq&&d){ const j=w.items[String(it.jreq).replace(/^item:/,'')]; const jd=j&&j.values&&j.values.date; if(jd){ const a=new Date(d+'T00:00:00'), b=new Date(jd+'T00:00:00'); slack=Math.round((a-b)/86400000); } }
    const impact=Math.max(8, Math.round((cost||0)/10)||(hours?Math.round(hours*2):15));
    const fixed=!!(d&&/^\d{4}-\d{2}-\d{2}$/.test(d));
    steps.push({id,name:it.name,date:d||null,fixed,impact,cost,hours,pick,slack,broken:!!F.broken,conflict:!!F.conflict,cycle:false,allBad,winBad,jreq:it.jreq||null});
  });
  /* resource pressure: low stock raises outflow */
  let resPressure=0; resourcesOf(w).forEach(it=>{ const st=+((it.values||{}).stock); if(st===0) resPressure+=12; else if(st>0&&st<5) resPressure+=6; });
  /* build day series spanning calendar month ± a few days around dated steps */
  const month=(cal.view&&cal.view.month)||'2027-04';
  const y=+month.slice(0,4), mo=+month.slice(5,7);
  const start=new Date(y,mo-2,1), end=new Date(y,mo+1,0); /* prev month through current */
  const flat=[]; let b=ht.base;
  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    const yy=d.getFullYear(), mm=d.getMonth()+1, dd=d.getDate();
    const k=yy+'-'+(mm<10?'0':'')+mm+'-'+(dd<10?'0':'')+dd;
    const pay=(dd===1||dd===15)?ht.income/2:0;
    const evs=steps.filter(s=>s.date===k).map(s=>({lab:s.name,amt:-s.impact,fixed:true,id:s.id,bad:s.broken||s.conflict||s.allBad||s.winBad}));
    b+=pay; evs.forEach(q=>{ b+=q.amt; }); if(dd===1) b-=resPressure*0.25;
    flat.push({d:dd,k,b,evs,pay:pay>0,rent:false});
  }
  for(let i=flat.length-1, run=Infinity; i>=0; i--){ const D=flat[i], nx=flat[i+1]; if(!nx||nx.pay) run=Infinity; run=Math.min(run,D.b); D.hr=run;
    let j=i+1; while(flat[j]&&!flat[j].pay) j++; D.nextPay=flat[j]?flat[j].k:'—'; }
  const days={}; flat.forEach((D,i)=>{ const near=[]; for(let t=Math.max(0,i-3); t<=Math.min(flat.length-1,i+3); t++) flat[t].evs.forEach(q=>{ if(q.fixed) near.push(q.lab+' '+flat[t].k.slice(5)); });
    const today=D.evs.filter(q=>q.fixed&&(Math.abs(q.amt)>=8||q.bad)).length;
    const c=(D.hr<ht.hc||today)?'C':(D.hr<ht.hm||near.length)?'M':'L';
    const why='headroom '+Math.round(D.hr)+' until '+D.nextPay+' pay · bal '+Math.round(D.b)+(near.length?' · '+near.join('; '):'')+(D.pay?' · payday':'');
    days[D.k]={c,why,hr:D.hr,b:D.b}; });
  const stepRisk={}; steps.forEach(s=>{ let c='L', why='low plan risk';
    if(s.broken||s.conflict||s.allBad){ c='C'; why=s.broken?'broken jreq':(s.conflict?'jreq conflict':'every alternative is BAD'); }
    else if(s.date&&days[s.date]&&days[s.date].c==='C'){ c='C'; why='fixed-date step on CRITICAL day · '+days[s.date].why; }
    else if(s.winBad||(s.slack!=null&&s.slack<1)||(s.date&&days[s.date]&&days[s.date].c==='M')){ c='M'; why=s.winBad?'current pick is weakest alt':(s.slack!=null&&s.slack<1?'slack < 1 day to requirement':('on MODERATE day · '+(days[s.date]&&days[s.date].why||''))); }
    else if(s.date&&days[s.date]){ c=days[s.date].c; why=days[s.date].why; }
    stepRisk[s.id]={c,why,date:s.date,slack:s.slack,impact:s.impact,pick:s.pick}; });
  return {days,steps:stepRisk,list:steps,ht,legend:['C','M','L'].map(k=>({k,color:CC[k][0],bg:CC[k][2],label:CC[k][1]})),rules:[
    'CRITICAL: headroom (lowest cushion before next payday) < hc ('+ht.hc+'), or a fixed-date plan step that day',
    'MODERATE: headroom < hm ('+ht.hm+'), or a fixed-date plan step within ±3 days',
    'LOW otherwise',
    'Paydays 1st & 15th; cushion starts at '+ht.base+'; income '+ht.income+'/mo; outflows from Best()/selected alt cost÷10 (or hours)',
    'Step CRITICAL also if broken/conflict jreq or every alt BAD; MODERATE if weakest pick or slack<1 day',
    'Calendar day risk and Plan step risk share this map; both update live on plan/calendar edits']}; }
function riskOf(w){ return planRisk(w||W); }

function clearFormFields(V){ if(V&&V.view) V.view.clearFields(); V.tf={}; }
/* Library TextField owns Safari-safe opacity/z-index (jrender-exp7 v4). Host only keeps pointer-events off when blurred
   so canvas buttons under the shared textarea still receive hits (Create / Place). */
function guardTextFieldPointer(){ try{ const t=document.querySelector('textarea[data-jrender="textfield"]'); if(!t) return;
  const on=document.activeElement===t; t.style.pointerEvents=on?'auto':'none';
  if(!t._jrPeHook){ t._jrPeHook=1; t.addEventListener('focus',()=>{ t.style.pointerEvents='auto'; }); t.addEventListener('blur',()=>{ t.style.pointerEvents='none'; }); }
}catch(e){} }
function blurTextFields(V){ try{ if(V&&V.tf) Object.keys(V.tf).forEach(k=>{ try{ V.tf[k].blur&&V.tf[k].blur(); }catch(e){} }); const t=document.querySelector('textarea[data-jrender="textfield"]'); if(t){ t.blur(); t.style.pointerEvents='none'; } }catch(e){} }
function attachFormFields(V){ /* pull live values before tear-down so a re-layout mid-edit (use: chips, etc.) keeps what was typed */
  if(V&&V.tf&&V.form) Object.keys(V.tf).forEach(f=>{ try{ const v=V.tf[f]&&V.tf[f].value; if(v!=null) V.form[f]=v; }catch(e){} });
  const wantFocus=V&&V.formFocus; clearFormFields(V); if(!V||!V.form||!V.view||!V.view.L||!V.view.r) return;
  const font=JRViews.font(); const rgba=window.JRender.rgba; const fg=rgba(28,35,51), bg=rgba(255,255,255), bd=rgba(138,150,170), fb=rgba(36,88,166);
  let i=0; V.tf=V.tf||{};
  V.view.L.nodes.forEach(n=>{ if(!n.tf||!n.hit) return; const f=n.tf; const [x,y,w,h]=n.hit;
    const id=(0x50000000+(i++) )>>>0; /* keep away from TextField derived id XOR bands */
    const tf=V.view.textField({id,parent:JRViews.GID,x,y,w:Math.max(120,w),h:Math.max(28,h),font,size:13,color:fg,bg,border:bd,focusBorder:fb,caretColor:fg,placeholderColor:rgba(73,85,106),selColor:rgba(36,88,166,55),
      value:(V.form[f]!=null?String(V.form[f]):''),placeholder:n.el&&n.el.getAttribute('data-ph')||f,label:f,
      oninput:v=>{ V.form[f]=v; }, onsubmit:()=>hostFormAct(V,'form:ok'),
      onfocus:()=>{ V.formFocus=f; }, onblur:()=>{ /* keep formFocus for re-attach */ }});
    V.tf[f]=tf; });
  guardTextFieldPointer();
  /* Focus only the remembered field; clicking a field focuses synchronously inside TextField.ev (user gesture).
     Auto-focus after async queue is best-effort (Safari may ignore outside the gesture). */
  const focusKey=wantFocus&&V.tf[wantFocus]?wantFocus:Object.keys(V.tf)[0];
  if(focusKey&&V.tf[focusKey]) try{ V.tf[focusKey].focus(); guardTextFieldPointer(); }catch(e){} }

function mkTf(doc,f,ph){ const el=doc.createElement('div'); el.className='ja-tf'; el.setAttribute('data-tf',f); el.setAttribute('data-ph',ph||f); el.setAttribute('style','min-height:28px;min-width:180px'); return el; }

function slugId(n){ return String(n||'item').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,28)||('i'+Date.now().toString(36)); }
function uniqItemId(base,V){ const AW=activeAtlas(V)||{items:{}}; let id=slugId(base), n=2; while(AW.items[id]) id=slugId(base)+'_'+(n++); return id; }
function calSelOf(V){ return V.calSel=V.calSel||{selected:Object.create(null),anchor:null,repeatAllYears:false}; }
function sortedDays(sel){ return Object.keys(sel).filter(k=>sel[k]).sort(); }
function daysBetween(a,b){ const lo=a<b?a:b, hi=a<b?b:a, out=[]; let d=new Date(+lo.slice(0,4),+lo.slice(5,7)-1,+lo.slice(8));
  const end=new Date(+hi.slice(0,4),+hi.slice(5,7)-1,+hi.slice(8)); while(d<=end){ const y=d.getFullYear(),m=d.getMonth()+1,dd=d.getDate();
    out.push(y+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd); d.setDate(d.getDate()+1); } return out; }
function expandYears(sel){ const out=Object.create(null); Object.keys(sel).forEach(k=>{ if(!sel[k]) return; const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(k); if(!m) return;
    for(let y=2025;y<=2031;y++) out[y+'-'+m[2]+'-'+m[3]]=1; }); return out; }
/* Keep calendar items and plan (reqs) steps in lockstep for dated trip steps. */
function syncCalPlanOps(ops){ /* mutate ops list: mirror membership between trip_calendar and reqs for item: refs */
  const add={}, rem={}; ops.forEach(o=>{ if(o.path==='components/trip_calendar/items'||o.path==='components/reqs/items'){
      if(o.op==='add') add[o.value]=1; if(o.op==='remove') rem[o.value]=1; } });
  Object.keys(add).forEach(r=>{ if(!ops.some(o=>o.path==='components/reqs/items'&&o.op==='add'&&o.value===r)) ops.push({path:'components/reqs/items',op:'add',value:r});
    if(!ops.some(o=>o.path==='components/trip_calendar/items'&&o.op==='add'&&o.value===r)) ops.push({path:'components/budget/items',op:'add',value:r}); });
  Object.keys(rem).forEach(r=>{ if(!ops.some(o=>o.path==='components/reqs/items'&&o.op==='remove'&&o.value===r)) ops.push({path:'components/reqs/items',op:'remove',value:r});
    if(!ops.some(o=>o.path==='components/trip_calendar/items'&&o.op==='remove'&&o.value===r)) ops.push({path:'components/budget/items',op:'remove',value:r}); });
  return ops; }
function submitViews(ops,src,V){ const synced=syncCalPlanOps(ops.map(o=>Object.assign({},o))); return proposeOps(V||{id:src},synced,'ui:views',src); }
function mkItemRecord(id,name,extra){ return {id,name,values:Object.assign({},extra&&extra.values||{}),factors:{},state:{},alts:extra&&extra.alts||null,jreq:extra&&extra.jreq||null,blueprint:null}; }
function resourcesOf(w){ return ((w.components.resources||{}).items||[]).map(r=>w.items[r.slice(5)]).filter(Boolean); }
function boardPickList(w){ w=w||W; const out=[]; const seen={};
  const _bid=(w.meta&&w.meta.boardId)||'trip_calendar_board'; ((w.components[_bid]||w.components.trip_calendar_board||{}).items||[]).forEach(r=>{ const id=String(r).replace(/^item:/,''); if(seen[id]) return; const it=w.items[id]; if(!it) return;
    if(((it.values||{}).kind)==='resource') return; seen[id]=1;
    out.push({id,name:it.name||id,jreq:it.jreq||null,alts:((it.alts&&it.alts.members)||[]).map(m=>{ const aid=m.slice(5), a=w.items[aid]; return {id:aid,name:(a&&a.name)||aid}; })});
  }); return out; }
function boardItemsNonRes(w){ const R=new Set(((w.components.resources||{}).items)||[]); const bid=(w.meta&&w.meta.boardId)||'trip_calendar_board'; return ((w.components[bid]||w.components.trip_calendar_board||{}).items||[]).filter(r=>!R.has(r)&&!((w.items[r.slice(5)]||{}).values||{}).kind||((w.items[r.slice(5)]||{}).values||{}).kind!=='resource'); }

function calNavOf(V){ if(!V.calNav) V.calNav={level:'month', day:null, year:null, saved:{scroll:0, selected:null, anchor:null, month:null}}; return V.calNav; }
function calMonthOf(V){ const AW=activeAtlas(V)||{}; const cal=AW.components[calCompId(V)]||{}; return (cal.view&&cal.view.month)||'2027-04'; }
function itemsOnDay(w,day,V){ const cid=(V&&calCompId(V))||(w.meta&&w.meta.calId)||'trip_calendar'; const cal=w.components[cid]||w.components.trip_calendar||{}; const out=[];
  (cal.items||[]).forEach(r=>{ const id=r.slice(5), it=w.items[id]; if(!it) return; const v=it.values||{}, start=v.date; if(!start) return;
    const dur=Math.max(1, Number(v.days)||1); const cover=daysBetween(start, (()=>{ const ds=daysBetween(start,'2099-12-31'); return ds[Math.min(dur,ds.length)-1]; })()).slice(0,dur);
    if(cover.indexOf(day)>=0) out.push({id,name:it.name,r,start,days:dur,jreq:it.jreq}); }); return out; }

/* ---- ViewStates bridge (report §11): state-only visual updates without HTML→DL relayout ---- */
function packViewStates(map){ const hex=window.JRender.hex; const out={};
  Object.keys(map||{}).forEach(k=>{ const s=map[k]||{}; out[k]=Object.assign({},s);
    if(typeof s.bg==='string'&&s.bg[0]==='#') out[k].bg=hex(s.bg);
    if(typeof s.border==='string'&&s.border[0]==='#') out[k].border=hex(s.border); });
  return out; }
function riskStateName(c, sel, drag){ const base=c==='C'?'critical':c==='M'?'moderate':'low';
  if(drag) return 'drag'; if(sel) return base+'_sel'; return base; }
function syncDayNodeFill(n, packed){ if(!n||!n.items||!packed) return;
  for(let i=0;i<n.items.length;i++){ const it=n.items[i]; if(it[0]==='rrect'||it[0]==='rect'){ it[it.length-1]=packed; break; } }
  if(n.base!=null) n.base=packed; }
function bindCalViewStates(V){ if(!V||!V.view||!V.view.s||!V.view.L) return null;
  if(typeof window.JRender.ViewStates!=='function') return null;
  const Nav=calNavOf(V); if(Nav.level!=='month'){ V._vs=null; V._dayNodes=null; return null; }
  const cal=((V.atlasW||W).components||{})[calCompId(V)]||{};
  const packed=packViewStates((cal.view&&cal.view.states)||{});
  const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!V._vs) V._vs=new window.JRender.ViewStates(V.view.s,{states:packed,reduced,edgeMs:120});
  else { V._vs.scene=V.view.s; V._vs.setStates(packed); V._vs.reduced=!!reduced; V._vs.nodes.clear(); }
  V._dayNodes=Object.create(null);
  (V.view.L.nodes||[]).forEach(n=>{ if(n.act!=='day'||!n.hit||!n.el) return; const day=n.el.getAttribute('data-day'); if(!day) return;
    const h=n.hit, cx=h[0]+h[2]/2, cy=h[1]+h[3]/2;
    /* baseBg=0 so accidental go/tick without intentional color keeps scene unless go sets it */
    V._vs.register(n.id,{cx,cy,bgId:n.id,borderId:0,xfId:n.id,bg:0,border:0});
    V._dayNodes[day]=n.id; });
  /* Registration only — never setReduced/_applyAll here (that paints stale nodes onto the fresh scene). */
  return V._vs; }
function syncDayDomChrome(V){ if(!V||!V.doc) return; const CS=calSelOf(V);
  const dragSet=Object.create(null); if(V.drag&&V.drag.from) daysBetween(V.drag.from,V.drag.to||V.drag.from).forEach(k=>{ dragSet[k]=1; });
  V.doc.querySelectorAll('.ja-day[data-day]').forEach(el=>{ const k=el.getAttribute('data-day');
    el.classList.toggle('ja-sel', !!CS.selected[k]);
    el.classList.toggle('ja-drag', !!dragSet[k]);
    el.classList.toggle('ja-anchor', CS.anchor===k);
  }); }
function applyCalViewStates(V,tMs,boot){ if(!V||!V._vs||!V._dayNodes) return false;
  const CS=calSelOf(V); const R=V.risk||riskOf(V.atlasW||W); const t=tMs!=null?tMs:performance.now();
  const dragSet=Object.create(null); if(V.drag&&V.drag.from){ daysBetween(V.drag.from,V.drag.to||V.drag.from).forEach(k=>{ dragSet[k]=1; }); }
  syncDayDomChrome(V);
  Object.keys(V._dayNodes).forEach(day=>{ const id=V._dayNodes[day]; const rk=R.days&&R.days[day]; const c=rk?rk.c:'L';
    const name=riskStateName(c,!!CS.selected[day],!!dragSet[day]);
    V._vs.go(id,name,t);
    const st=V._vs.states[name]; if(st&&st.bg){ const n=V.view.byId&&V.view.byId.get(id); syncDayNodeFill(n,st.bg); }
  });
  /* Snap poses to identity for idle calendar fills so verify(L) matches (selection is color-only; critical shake still kicks briefly). */
  V._vs.tick(t);
  try{ const Patch=window.JRender.Patch; const p=new Patch(); let n=0;
    Object.keys(V._dayNodes).forEach(day=>{ const id=V._dayNodes[day]; const node=V._vs.nodes.get(id);
      if(node&&node.anim==='none'){ p.xform(id,[1,0,0,1,0,0]); n++; } });
    if(n) V.view.s.patch(p); }catch(e){}
  if(V.view.r) V.view.r.draw();
  calVsKick(V); return true; }
function calVsKick(V){if(!V||!V._vs)return;V._motionKick=()=>calVsKick(V);if(V._vsRaf||V._vs.hidden||V._vs.reduced||typeof document!=='undefined'&&document.hidden||!V._vs.needsFrame())return;const step=()=>{V._vsRaf=0;if(!V._vs||!V.view||!V.view.r||V._vs.hidden||V._vs.reduced||typeof document!=='undefined'&&document.hidden)return;const dirty=V._vs.tick(performance.now());if(dirty)V.view.r.draw();if(V._vs.needsFrame())V._vsRaf=requestAnimationFrame(step);};V._vsRaf=requestAnimationFrame(step);}
async function calStateOnlyAsync(V,why){ const Nav=calNavOf(V);
  if(!V||!V.view||!V.doc||!V.cv||Nav.level!=='month'||V.form) return false;
  if(why!=='sel'&&why!=='drag') return false;
  /* No runtime HTML rebuild: sync selection/drag classes on the live doc, then HTML→DL patch via show().
     ViewStates remains bound afterward for view.states anims (critical shake) without an idle loop. */
  paintCalDayChrome(V);
  const r=await V.view.show(V.cv,V.doc,V.w);
  V.lastMode='state'; V.stateOnlyN=(V.stateOnlyN||0)+1; V.mode=r.mode; V.patches=V.view.patches; V.loads=V.view.loads;
  bindCalViewStates(V);
  return true; }
function calStateOnly(){ return false; } /* sync predicate unused; queue uses async path */

function paintCalDayChrome(V){ if(!V||!V.doc) return; const CS=calSelOf(V); const R=V.risk||riskOf(V.atlasW||W); V.risk=R;
  const dragSet=Object.create(null); if(V.drag&&V.drag.from) daysBetween(V.drag.from,V.drag.to||V.drag.from).forEach(k=>{ dragSet[k]=1; });
  /* Toggle selection/drag classes + optional ✓ mark only. Do not strip risk badges or ja-span (calDoc owns those). */
  V.doc.querySelectorAll('.ja-day[data-day]').forEach(el=>{ const k=el.getAttribute('data-day');
    el.classList.toggle('ja-sel', !!CS.selected[k]);
    el.classList.toggle('ja-drag', !!dragSet[k]);
    el.classList.toggle('ja-anchor', CS.anchor===k);
    el.querySelectorAll('[data-chrome="sel"]').forEach(x=>x.remove());
    const rk=R.days[k];
    if(CS.selected[k]||dragSet[k]) el.style.borderColor='#2458a6';
    else if(CS.anchor===k) el.style.borderColor='#6841a6';
    else if(rk) el.style.borderColor=RISK_COL[rk.c][0];
    if(CS.selected[k]){ const mark=V.doc.ownerDocument.createElement('span'); mark.setAttribute('data-chrome','sel');
      mark.setAttribute('style','color:#2458a6;font-size:11px;font-weight:700'); mark.textContent=' ✓'; el.appendChild(mark); }
  });
  V.calSelCount=sortedDays(CS.selected).length; }

function calDoc(V,d){ /* strip Board/Plan switch + subs; inject selection UX; paint plan-risk */
  d.querySelectorAll('.ja-switch').forEach(x=>x.remove());
  d.querySelectorAll('.ja-comp').forEach(sec=>{ const id=sec.getAttribute('data-comp')||''; if(/_board$|_plan$/.test(id)&&id!==calCompId(V)) sec.remove(); });
  const CS=calSelOf(V); const nav=d.querySelector('.ja-calnav');
  const R=riskOf(V.atlasW||W); V.risk=R;
  /* minimal risk legend (colors); long help text removed — details live in About */
  const leg=d.querySelector('.ja-legend')||(()=>{ const x=d.ownerDocument.createElement('div'); x.className='ja-legend'; return x; })();
  leg.innerHTML=''; R.legend.forEach(L=>{ const sp=d.ownerDocument.createElement('span'); sp.className='ja-lg'; sp.setAttribute('data-legend',L.k); sp.setAttribute('data-risk',L.k);
    sp.textContent=L.k+' '+L.label; sp.style.borderColor=L.color; sp.style.color=RISK_TEXT[L.k]; sp.style.background=L.bg; leg.appendChild(sp); });
  const Nav=calNavOf(V); const mk=(act,label,on)=>{ const b=d.ownerDocument.createElement('button'); b.setAttribute('data-jv-act',act); b.textContent=label; if(on) b.className='on'; return b; };
  /* Year overview: 12 months; drill into a month restores month level */
  if(Nav.level==='year'){ const y=Nav.year||(+calMonthOf(V).slice(0,4));
    [...d.children].forEach(c=>c.remove());
    const head=d.ownerDocument.createElement('div'); head.className='ja-bar'; head.appendChild(mk('cal:back','← Back'));
    const t=d.ownerDocument.createElement('b'); t.textContent=' Year '+y+' · pick a month'; head.appendChild(t); d.appendChild(head);
    const grid=d.ownerDocument.createElement('div'); grid.className='ja-detail';
    for(let m=1;m<=12;m++){ const mo=y+'-'+(m<10?'0':'')+m; const bt=mk('cal:goto:'+mo, mo); bt.style.display='inline-block'; bt.style.margin='4px'; grid.appendChild(bt); }
    d.appendChild(grid); V.calSelCount=sortedDays(CS.selected).length; return; }
  /* Day detail: items on focus day; Back restores exact month scroll+selection */
  if(Nav.level==='day'&&Nav.day){ const day=Nav.day; const w=V.atlasW||W; const its=itemsOnDay(w,day); const R=riskOf(w); const rk=R.days[day];
    [...d.children].forEach(c=>c.remove());
    const head=d.ownerDocument.createElement('div'); head.className='ja-bar'; head.appendChild(mk('cal:back','← Back to month'));
    const t=d.ownerDocument.createElement('b'); t.textContent=' Day '+day+(rk?' · '+rk.c+' '+RISK_COL[rk.c][1]:''); head.appendChild(t); d.appendChild(head);
    const box=d.ownerDocument.createElement('div'); box.className='ja-detail';
    if(!its.length){ const i=d.ownerDocument.createElement('i'); i.textContent='No steps on this day.'; box.appendChild(i); }
    its.forEach(it=>{ const row=d.ownerDocument.createElement('div'); row.className='ja-prow'; row.textContent=it.name+(it.days>1?' · '+it.days+'d from '+it.start:'')+(it.jreq?' · requires '+String(it.jreq).replace(/^item:/,''):''); box.appendChild(row); });
    d.appendChild(box); V.calSelCount=1; return; }
  /* selection chrome (month) */
  const bar=d.ownerDocument.createElement('div'); bar.className='ja-bar ja-calsel';
  const n=sortedDays(CS.selected).length;
  bar.appendChild(mk('cal:back','← Year'));
  bar.appendChild(mk('cal:openday','Open day'));
  bar.appendChild(mk('cal:clear','Clear selection'));
  bar.appendChild(mk('cal:repeat',CS.repeatAllYears?'✓ Repeat over all years':'Repeat over all years',CS.repeatAllYears));
  bar.appendChild(mk('cal:expand','Select same days across years'));
  bar.appendChild(mk('cal:add','Add step on selection'));
  bar.appendChild(mk('cal:remove','Remove selected steps'));
  bar.appendChild(mk('cal:span','Span item across selection'));
  const tip=d.ownerDocument.createElement('i'); tip.textContent=' '+n+' day(s) selected · click · drag range · Shift+click range · Ctrl+click add'; tip.className='ja-dim'; bar.appendChild(tip);
  if(nav&&nav.parentNode) nav.parentNode.insertBefore(bar,nav.nextSibling); else d.insertBefore(bar,d.firstChild);
  /* form panel ABOVE the grid (was appended at end → below the fold / looked like a no-op) */
  let formWrap=null;
  if(V.form&&(V.form.kind==='caladd'||V.form.kind==='span')){ formWrap=d.ownerDocument.createElement('div'); formWrap.className='ja-detail'; formWrap.setAttribute('data-exp7-form',V.form.kind);
    const title=d.ownerDocument.createElement('b'); title.textContent=V.form.kind==='span'?'Span a Board item across selected days':'Add a Board item as a step on selected days'; formWrap.appendChild(title);
    const hint=d.ownerDocument.createElement('div'); hint.className='ja-dim'; hint.textContent='Pick an item from the Board. Requires / resources / Selected item / Joy come from that item (and its alternatives).'; formWrap.appendChild(hint);
    const picks=boardPickList(V.atlasW||W);
    if(!picks.length){ const miss=d.ownerDocument.createElement('div'); miss.className='ja-flag'; miss.textContent='No Board items to place — add one on the Board first.'; formWrap.appendChild(miss); }
    picks.forEach(P=>{ const row=d.ownerDocument.createElement('div'); row.className='ja-brow';
      const bt=d.ownerDocument.createElement('button'); bt.setAttribute('data-jv-act','pick:'+P.id); bt.className=(V.form.itemId===P.id)?'on':'';
      const jr=P.jreq?String(P.jreq).replace(/^item:/,''):'—';
      bt.textContent=((V.form.itemId===P.id)?'✓ ':'')+P.name+' · requires '+jr+(P.alts.length?' · '+P.alts.length+' alt(s)':'');
      row.appendChild(bt); formWrap.appendChild(row); });
    const reqRow=d.ownerDocument.createElement('div'); reqRow.className='ja-brow';
    const it=V.form.itemId&&(V.atlasW||W).items[V.form.itemId]; const jrLab=it&&it.jreq?String(it.jreq).replace(/^item:/,''):'—';
    reqRow.textContent='Requires (from item): '+jrLab+(it?' · '+it.name:' · pick an item'); formWrap.appendChild(reqRow);
    const ok=d.ownerDocument.createElement('button'); ok.setAttribute('data-jv-act','form:ok'); ok.textContent=V.form.kind==='span'?'Span on selection':'Place on selection'; formWrap.appendChild(ok);
    const cx=d.ownerDocument.createElement('button'); cx.setAttribute('data-jv-act','form:cancel'); cx.textContent='Cancel'; formWrap.appendChild(cx);
    if(bar.parentNode) bar.parentNode.insertBefore(formWrap,bar.nextSibling); else d.insertBefore(formWrap,d.firstChild); }
  /* multi-day spans already on the calendar → mark covered days */
  const spanCover=Object.create(null);
  ((((V.atlasW||W).components||{})[calCompId(V)]||{}).items||[]).forEach(r=>{ const it=(V.atlasW||W).items[String(r).replace(/^item:/,'')]; if(!it) return;
    const v=it.values||{}, start=v.date; const dur=Math.max(1, Number(v.days)||1); if(!start||dur<2) return;
    const end=daysBetween(start,start).length? (()=>{ const ds=daysBetween(start,'2099-12-31'); return ds[Math.min(dur,ds.length)-1]; })():start;
    daysBetween(start,end).slice(0,dur).forEach(k=>{ spanCover[k]=it.name||r; }); });
  /* paint day risk + selection / drag / anchor / span (classes that jrv turns into canvas rings) */
  d.querySelectorAll('.ja-day[data-day]').forEach(day=>{ const k=day.getAttribute('data-day'); const rk=R.days[k];
    if(rk){ const col=RISK_COL[rk.c]; day.setAttribute('data-risk',rk.c); day.setAttribute('title',k+' · '+col[1]+' · '+rk.why);
      day.style.background=col[2]; day.style.borderColor=col[0]; day.style.setProperty('--bg',col[2]);
      const badge=d.ownerDocument.createElement('span'); badge.className='ja-dim'; badge.setAttribute('style','color:'+RISK_TEXT[rk.c]+';font-size:10px'); badge.textContent=' '+rk.c; day.appendChild(badge); }
    if(spanCover[k]){ day.classList.add('ja-span'); day.setAttribute('data-span',spanCover[k]); }
    if(CS.selected[k]){ day.classList.add('ja-sel'); day.style.borderColor='#2458a6';
      const mark=d.ownerDocument.createElement('span'); mark.setAttribute('style','color:#2458a6;font-size:11px;font-weight:700'); mark.textContent=' ✓'; day.appendChild(mark); }
    if(V.drag&&V.drag.from){ const inDrag=daysBetween(V.drag.from,V.drag.to||V.drag.from).indexOf(k)>=0; if(inDrag) day.classList.add('ja-drag'); }
    if(CS.anchor===k){ day.classList.add('ja-anchor'); day.style.borderColor='#6841a6'; }
  });
  /* legend after the month grid */
  const cal=d.querySelector('.ja-cal'); if(cal&&cal.parentNode) cal.parentNode.insertBefore(leg,cal.nextSibling); else if(bar.parentNode) bar.parentNode.appendChild(leg);
  V.calSelCount=n; V.calRisk=R; V.riskDays=Object.fromEntries(Object.keys(R.days).map(k=>[k,R.days[k].c]));
  if(V._restoreScroll!=null){ const sy=V._restoreScroll; V._restoreScroll=null; setTimeout(()=>{ try{ if(V.view&&V.view.s) V.view.s.scroll(JRViews.GID,0,sy); V.view.redraw&&V.view.redraw(); }catch(e){} },0); }

  V.calHasSwitch=!!d.querySelector('.ja-switch'); V.calTabs=[]; V.hasOldModeText=new RegExp('\\bB'+'usy\\b|\\bOver'+'load\\b').test(d.textContent); V.hasCalHelp=!!d.querySelector('.ja-calhelp'); }


function boardDoc(V,d){ /* remove Trip calendar button/text; resources; alts; forms */
  d.querySelectorAll('button[data-ja-act="tocal"]').forEach(x=>x.remove());
  d.querySelectorAll('.ja-on').forEach(x=>x.remove());
  const tw=d.ownerDocument.createTreeWalker(d,NodeFilter.SHOW_TEXT); let n; while((n=tw.nextNode())) if(/on Trip calendar|→ Trip calendar/i.test(n.nodeValue)) n.nodeValue=n.nodeValue.replace(/→?\s*Trip calendar/gi,'').replace(/\bon\s+/gi,m=>m);
  const bar=d.querySelector('.ja-bar');
  const resBox=d.ownerDocument.createElement('div'); resBox.className='ja-section'; resBox.setAttribute('data-exp7','resources');
  const rh=d.ownerDocument.createElement('b'); rh.textContent='Resources'; resBox.appendChild(rh);
  resourcesOf(V.atlasW||W).forEach(it=>{ const row=d.ownerDocument.createElement('div'); row.className='ja-srow'; row.textContent=it.name+' · '+(it.values.stock!=null?it.values.stock:'')+(it.values.unit||''); resBox.appendChild(row); });
  const addR=d.ownerDocument.createElement('button'); addR.setAttribute('data-jv-act','res:add'); addR.textContent='+ Add resource'; resBox.appendChild(addR);
  if(bar&&bar.parentNode) bar.parentNode.insertBefore(resBox,bar.nextSibling); else d.insertBefore(resBox,d.firstChild);
  d.querySelectorAll('.ja-brow').forEach(row=>{ const chip=row.querySelector('.ja-item[data-item]'); if(!chip) return; const id=chip.getAttribute('data-item'); const it=(V.atlasW||W).items[id]; if(!it) return;
    if(((it.values||{}).kind)==='resource') return;
    const open=!!(V.open&&V.open[id]);
    const tg=d.ownerDocument.createElement('button'); tg.setAttribute('data-jv-act','alt:tog:'+id); tg.textContent=(open?'▾':'▸')+' Alternatives ('+((it.alts&&it.alts.members)||[]).length+')'; row.appendChild(tg);
    const ad=d.ownerDocument.createElement('button'); ad.setAttribute('data-jv-act','alt:add:'+id); ad.textContent='+ Add alternative'; row.appendChild(ad);
    if(open&&it.alts){ (it.alts.members||[]).forEach(m=>{ const o=(V.atlasW||W).items[m.slice(5)]||{}; const sp=d.ownerDocument.createElement('span'); sp.className='ja-chip'; sp.textContent=o.name||m; row.appendChild(sp); }); }
  });
  if(V.form&&V.form.kind){ const wrap=d.ownerDocument.createElement('div'); wrap.className='ja-detail'; wrap.setAttribute('data-exp7-form',V.form.kind);
    const titles={newitem:'New item',resource:'Add resource',alt:'Add alternative'}; const title=d.ownerDocument.createElement('b'); title.textContent=titles[V.form.kind]||'Form'; wrap.appendChild(title);
    const fields=V.form.kind==='resource'?[['name','Name'],['unit','Unit'],['stock','Stock']]:[['name','Name'],['uses','Resources used (comma ids)'],['jreq','Requirement (item id)'],['comfort','Comfort'],['fun','Fun'],['cost','Cost'],['hours','Hours']];
    fields.forEach(([f,lab])=>{ const row=d.ownerDocument.createElement('div'); row.className='ja-brow';
      const sp=d.ownerDocument.createElement('span'); sp.textContent=lab+': '; row.appendChild(sp);
      row.appendChild(mkTf(d.ownerDocument,f,lab)); wrap.appendChild(row); });
    if(V.form.kind!=='resource'){ resourcesOf(V.atlasW||W).forEach(it=>{ const bt=d.ownerDocument.createElement('button'); const on=(V.form.usesIds||{})[it.id];
      bt.setAttribute('data-jv-act','use:'+it.id); bt.className=on?'on':''; bt.textContent=(on?'✓ ':'')+it.name; wrap.appendChild(bt); }); }
    const ok=d.ownerDocument.createElement('button'); ok.setAttribute('data-jv-act','form:ok'); ok.textContent='Create'; wrap.appendChild(ok);
    const cx=d.ownerDocument.createElement('button'); cx.setAttribute('data-jv-act','form:cancel'); cx.textContent='Cancel'; wrap.appendChild(cx);
    d.appendChild(wrap); }
  V.boardHasTrip=/\bTrip calendar\b/i.test(d.textContent); V.boardRes=resourcesOf(V.atlasW||W).map(x=>x.name); }

function hostFormAct(V,a){ const W=activeAtlas(V)||{items:{},components:{}}; if(a.startsWith('pick:')){ const id=a.slice(5); if(!V.form) return; V.form.itemId=id; const it=W.items[id]; V.note='picked '+(it&&it.name||id)+' · requires '+((it&&it.jreq)?String(it.jreq).replace(/^item:/,''):'—'); return V.sess&&V.queue(V.sess,'form'); }
  if(a==='form:cancel'){ clearFormFields(V); V.form=null; V.formFocus=null; V.note='form cancelled'; return V.sess&&V.queue(V.sess,'form'); }
  if(a==='form:ok'){ /* pull live TextField values (keep non-empty form values if field still empty) */ if(V.tf) Object.keys(V.tf).forEach(f=>{ try{ const v=V.tf[f].value; if(v!=null&&String(v).length) V.form[f]=v; }catch(e){} });
    const F=V.form||{}; if(F.kind==='resource'){ const id=uniqItemId(F.name||'resource',V); const name=(F.name||'').trim()||('Resource '+id);
      const ops=[{path:'items/'+id,op:'add',value:mkItemRecord(id,name,{values:{kind:'resource',unit:(F.unit||'').trim()||'u',stock:Number(F.stock)||0}})},
        {path:'components/resources/items',op:'add',value:'item:'+id}];
      clearFormFields(V); V.form=null; V.note='added resource '+name; submitViews(ops,'board:resource',V); return; }
    if(F.kind==='newitem'||F.kind==='alt'){ const id=uniqItemId(F.name||'item',V); const name=(F.name||'').trim()||('Item '+id);
      const uses=Object.keys(F.usesIds||{}).filter(k=>F.usesIds[k]).map(k=>'item:'+k);
      const vals={}; if(F.comfort!==''&&F.comfort!=null) vals.comfort=+F.comfort; if(F.fun!==''&&F.fun!=null) vals.fun=+F.fun;
      if(F.cost!==''&&F.cost!=null) vals.cost=+F.cost; if(F.hours!==''&&F.hours!=null) vals.hours=+F.hours; if(uses.length) vals.uses=uses;
      const jreq=(F.jreq||'').trim(); const jref=jreq?(jreq.indexOf('item:')===0?jreq:'item:'+jreq):null;
      const rec=mkItemRecord(id,name,{values:vals,jreq:jref});
      const ops=[{path:'items/'+id,op:'add',value:rec},{path:'components/budget_board/items',op:'add',value:'item:'+id}];
      if(F.kind==='alt'&&F.parent){ const p=W.items[F.parent]; if(p){ if(!p.alts) ops.push({path:'items/'+F.parent+'/alts',op:'set',value:{members:['item:'+id],pref:null,unavail:[],method:'best'}});
          else ops.push({path:'items/'+F.parent+'/alts/members',op:'add',value:'item:'+id}); }
        V.open=V.open||{}; V.open[F.parent]=true; }
      clearFormFields(V); V.form=null; V.note=(F.kind==='alt'?'added alternative ':'added item ')+name; submitViews(ops,'board:'+F.kind,V); return; }
    if(F.kind==='caladd'||F.kind==='span'){ const CS=calSelOf(V); let days=sortedDays(CS.selected); if(!days.length){ V.note='select days first'; return V.sess&&V.queue(V.sess,'form'); }
      const id=F.itemId; const it=id&&W.items[id]; if(!it){ V.note='pick a Board item first'; return V.sess&&V.queue(V.sess,'form'); }
      if(CS.repeatAllYears){ const exp=expandYears(CS.selected); days=sortedDays(exp); }
      const start=days[0], end=days[days.length-1]; const dur=daysBetween(start,end).length;
      const ref='item:'+id; const ops=[];
      /* place the existing Board item on the selection; requirement stays the item's own jreq */
      const hasDate=it.values&&it.values.date!=null; ops.push({path:'items/'+id+'/values/date',op:hasDate?'set':'add',value:start});
      if(F.kind==='span'||dur>1){ const hasD=it.values&&it.values.days!=null; ops.push({path:'items/'+id+'/values/days',op:hasD?'set':'add',value:dur}); }
      else if(it.values&&it.values.days!=null) ops.push({path:'items/'+id+'/values/days',op:'set',value:1});
      const _cid=calCompId(V), _pid=planCompId(V); const cal=(W.components[_cid]||{}).items||[]; if(cal.indexOf(ref)<0) ops.push({path:'components/'+_cid+'/items',op:'add',value:ref});
      const reqs=(W.components[_pid]||{}).items||[]; if(reqs.indexOf(ref)<0) ops.push({path:'components/'+_pid+'/items',op:'add',value:ref});
      clearFormFields(V); V.form=null;
      const jr=it.jreq?String(it.jreq).replace(/^item:/,''):'—';
      V.note='placed '+it.name+' on '+start+(dur>1?'…'+end:'')+' · requires '+jr+' (risk flags unsatisfied reqs)';
      submitViews(ops,'cal:add',V); return; }
  }
}
function hostCalAct(V,a){ V._dragJust=false; V.drag=null; const W=activeAtlas(V)||{items:{},components:{}}; const CS=calSelOf(V); const S=V.sess; const Nav=calNavOf(V);
  if(a==='cal:back'){ if(Nav.level==='day'){ Nav.level='month'; Nav.day=null;
      if(Nav.saved){ if(Nav.saved.selected) CS.selected=Object.assign(Object.create(null),Nav.saved.selected); CS.anchor=Nav.saved.anchor||null;
        if(Nav.saved.month){ const cur=calMonthOf(V); if(Nav.saved.month!==cur){ submitViews([{path:'components/'+calCompId(V)+'/view/month',op:'set',value:Nav.saved.month}],'cal:back-month',V); } }
        V._restoreScroll=Nav.saved.scroll||0; }
      V.note='back to month'; return S&&V.queue(S,'nav'); }
    Nav.level='year'; Nav.year=+(calMonthOf(V).slice(0,4)); Nav.saved={scroll:(V.view&&V.view.s&&V.view.s.scrollPos(JRViews.GID)||[0,0])[1], selected:Object.assign({},CS.selected), anchor:CS.anchor, month:calMonthOf(V)};
    V.note='year overview '+Nav.year; return S&&V.queue(S,'nav'); }
  if(a==='cal:openday'){ const days=sortedDays(CS.selected); if(!days.length){ V.note='select a day first, then Open day'; return S&&V.queue(S,'sel'); }
    const day=days.length===1?days[0]:(CS.anchor&&CS.selected[CS.anchor]?CS.anchor:days[0]);
    Nav.saved={scroll:(V.view&&V.view.s&&V.view.s.scrollPos(JRViews.GID)||[0,0])[1], selected:Object.assign({},CS.selected), anchor:CS.anchor, month:calMonthOf(V)};
    Nav.level='day'; Nav.day=day; V.note='day view '+day; return S&&V.queue(S,'nav'); }
  if(a.startsWith('cal:goto:')){ const mo=a.slice(9); Nav.level='month'; Nav.year=null; Nav.day=null;
    submitViews([{path:'components/'+calCompId(V)+'/view/month',op:'set',value:mo}],'cal:goto',V); V.note='month '+mo; return; }
  if(a==='cal:clear'){ CS.selected=Object.create(null); CS.anchor=null; CS.repeatAllYears=false; V.note='selection cleared'; return S&&V.queue(S,'sel'); }
  if(a==='cal:repeat'){ CS.repeatAllYears=!CS.repeatAllYears; V.note='repeat over all years: '+CS.repeatAllYears; return S&&V.queue(S,'sel'); }
  if(a==='cal:expand'){ CS.selected=expandYears(CS.selected); V.note='expanded selection across years ('+sortedDays(CS.selected).length+' days)'; return S&&V.queue(S,'sel'); }
  if(a==='cal:add'||a==='cal:span'){ const days=sortedDays(CS.selected);
    if(!days.length){ V.note='select days first (click / drag), then '+a.slice(4); return S&&V.queue(S,'sel'); }
    V.form={kind:a==='cal:span'?'span':'caladd', itemId:null}; V.formFocus=null;
    V.note=(a==='cal:span'?'span':'add')+' form open — pick a Board item, then Place'; return S&&V.queue(S,'form'); }
  if(a==='cal:remove'){ const days=new Set(sortedDays(CS.selected)); if(!days.size){ V.note='select days first, then Remove'; return S&&V.queue(S,'sel'); }
    const ops=[]; const seen={}; const _cid=calCompId(V), _pid=planCompId(V); const cal=(W.components[_cid]||{}).items||[];
    cal.forEach(r=>{ const id=r.slice(5), it=W.items[id]; if(!it||seen[r]) return; const v=it.values||{}, start=v.date; if(!start) return;
      const dur=Math.max(1, Number(v.days)||1); const cover=daysBetween(start, (()=>{ const ds=daysBetween(start,'2099-12-31'); return ds[Math.min(dur,ds.length)-1]; })()).slice(0,dur);
      if(!cover.some(k=>days.has(k))) return; seen[r]=1;
      ops.push({path:'components/'+_cid+'/items',op:'remove',value:r});
      ops.push({path:'components/'+_pid+'/items',op:'remove',value:r});
      /* keep Board membership — Remove only unschedules from calendar+plan */
    });
    if(!ops.length){ V.note='no steps on the '+days.size+' selected day(s)'; return S&&V.queue(S,'sel'); }
    const n=Object.keys(seen).length; V.note='removed '+n+' step(s) from calendar+plan'; submitViews(ops,'cal:remove',V); return; }
}
function hostDayClick(V,day,mods){ if(!day||!/^\d{4}-\d{2}-\d{2}$/.test(day)) return; if(V._dragJust||V.drag){ V._dragJust=false; return; } const CS=calSelOf(V); const m=mods||{}; mods={shift:!!(MODS.shift||m.shift),ctrl:!!(MODS.ctrl||m.ctrl),meta:!!(MODS.meta||m.meta),alt:!!(MODS.alt||m.alt)};
  const add=mods.ctrl||mods.meta;
  if(mods.shift&&CS.anchor){ daysBetween(CS.anchor,day).forEach(k=>{ CS.selected[k]=1; }); V.note='range '+CS.anchor+' → '+day; }
  else if(add){ if(CS.selected[day]) delete CS.selected[day]; else CS.selected[day]=1; CS.anchor=day; V.note=(CS.selected[day]?'added ':'removed ')+day; }
  else { const on=!CS.selected[day]||Object.keys(CS.selected).filter(k=>CS.selected[k]).length!==1||!CS.selected[day]; CS.selected=Object.create(null); if(on) CS.selected[day]=1; CS.anchor=day; V.note=(on?'selected ':'deselected ')+day; }
  if(V.sess) V.queue(V.sess,'sel'); }
function hostDayDrag(V,phase,n,mods,e){ if(!n||n.act!=='day'||!n.el) return;
  /* v3: DRAG* events keep the pressed node id; resolve the day under the pointer via scene hit. */
  let day=n.el.getAttribute('data-day');
  if(e&&V.view&&V.view.s&&(phase==='move'||phase==='end')){
    const x=e.sx!=null?e.sx:e.x, y=e.sy!=null?e.sy:e.y;
    if(x!=null&&y!=null){ const hid=V.view.s.hit(x,y); const hn=hid!=null&&V.view.byId&&V.view.byId.get(hid);
      if(hn&&hn.act==='day'&&hn.el) day=hn.el.getAttribute('data-day')||day; }
  }
  if(!day) return;
  const CS=calSelOf(V); const m=mods||{}; mods={shift:!!(MODS.shift||m.shift),ctrl:!!(MODS.ctrl||m.ctrl),meta:!!(MODS.meta||m.meta),alt:!!(MODS.alt||m.alt)};
  if(phase==='start'){ V.drag={from:day, to:day, mods:mods, base:Object.assign(Object.create(null),CS.selected)}; CS.anchor=day;
    if(!(mods.shift||mods.ctrl||mods.meta)){ CS.selected=Object.create(null); CS.selected[day]=1; }
    else CS.selected[day]=1;
    V.note='drag start '+day; return; }
  if(phase==='move'&&V.drag){ V.drag.to=day;
    if(!(V.drag.mods&&(V.drag.mods.ctrl||V.drag.mods.meta))) CS.selected=Object.create(null);
    else CS.selected=Object.assign(Object.create(null),V.drag.base||{});
    daysBetween(V.drag.from,day).forEach(k=>{ CS.selected[k]=1; }); V.note='drag '+V.drag.from+' → '+day;
    /* live range highlight: redraw while dragging (throttle to one frame) */
    if(!V._dragRaf){ V._dragRaf=1; requestAnimationFrame(()=>{ V._dragRaf=0; if(V.drag&&V.sess) V.queue(V.sess,'drag'); }); }
    return; }
  if(phase==='end'){ if(V.drag){ const to=day||V.drag.to||V.drag.from;
      if(!(V.drag.mods&&(V.drag.mods.ctrl||V.drag.mods.meta))) CS.selected=Object.create(null);
      else CS.selected=Object.assign(Object.create(null),V.drag.base||{});
      daysBetween(V.drag.from,to).forEach(k=>{ CS.selected[k]=1; });
      V.note='drag range '+V.drag.from+' → '+to+' ('+sortedDays(CS.selected).length+' days)';
      /* always suppress the CLICK JRender may emit after DRAGEND (same-day micro-drag would toggle off; cross-day would double-fire). Cleared on the next day click or any cal chrome action. */
      V._dragJust=true; }
    V.drag=null; return V.sess&&V.queue(V.sess,'sel'); }
}
function hostBoardAct(V,a){ if(a==='res:add'){ V.form={kind:'resource',name:'',unit:'',stock:''}; V.formFocus='name'; return V.sess&&V.queue(V.sess,'form'); }
  if(a.startsWith('alt:tog:')){ const id=a.slice(8); V.open=V.open||{}; V.open[id]=!V.open[id]; V.note=(V.open[id]?'opened':'closed')+' alternatives of '+id; return V.sess&&V.queue(V.sess,'alt'); }
  if(a.startsWith('alt:add:')){ const id=a.slice(8); V.form={kind:'alt',parent:id,name:'',jreq:'',comfort:'',fun:'',cost:'',hours:'',usesIds:{}}; V.formFocus='name'; return V.sess&&V.queue(V.sess,'form'); }
  if(a.startsWith('use:')){ const id=a.slice(4); V.form=V.form||{}; V.form.usesIds=V.form.usesIds||{}; V.form.usesIds[id]=!V.form.usesIds[id]; return V.sess&&V.queue(V.sess,'form'); }
}

/* ---------- host-side document edits before JRender layout (runtime.js output itself is untouched) ---------- */
/* every view: no header line (title, joys, pass/backend/engine meta); user-visible "exp6" -> "Exp7" */
function hostDoc(d,V){ d.querySelectorAll('header.ja-top').forEach(h=>h.remove());
  const tw=d.ownerDocument.createTreeWalker(d,NodeFilter.SHOW_TEXT); let n; while((n=tw.nextNode())) if(/exp6/i.test(n.nodeValue)) n.nodeValue=x7(n.nodeValue);
  if(!V) return;
  if(isCalRoot(V)) calDoc(V,d);
  if(isBoardRoot(V)) boardDoc(V,d); }
/* Plan session pins: when the live atlas has no userPick, pin true Best() so eval.js pickAlts resolves the same alternative
   the Plan shows as Selected(=Best). Never write these pins to the live atlas. userPick on the live atlas stays the user's
   Selected and never rewrites Best (bestRank ignores userPick). */
function livePins(w){ const P={}; Object.keys(w.items).forEach(id=>{ const it=w.items[id]; if(it.alts&&!(it.state&&it.state.userPick)){ const B=bestRank(w,id); if(B.pick) P[id]=B.pick.pick; } }); return P; }
const sg=v=>v==null||v===''?'—':(v>0?'+':v<0?'−':'')+Math.abs(v);
function planCells(A,id,pins,wiPick){ const it=A.items[id]; if(!it) return ['—','—']; const st=it.state||{};
  let sel; if(it.alts){ const B=bestRank(A,id); const bestRef=B.pick&&B.pick.pick; const bestName=bestRef&&A.items[bestRef.slice(5)]?A.items[bestRef.slice(5)].name:'—';
    /* wiPick is a boolean (this row is the what-if step); Selected ref is still state.userPick / pick */
    const up=(it.state&&it.state.userPick)||null;
    const runRef=up||(st.pick||st.simPick)||bestRef; const runIt=runRef&&A.items[String(runRef).slice(5)];
    if(wiPick){ sel=(runIt?runIt.name:'—')+' (what-if Selected)'; if(bestRef&&bestRef!==runRef) sel+=' · Best: '+bestName; }
    else if(up){ const un=A.items[up.slice(5)]; sel=(un?un.name:'—')+' (Selected)'; if(bestRef&&bestRef!==up) sel+=' · Best: '+bestName; else sel+=' · also Best'; }
    else { sel=(runIt?runIt.name:bestName)+' (Exp7 Best())'; }
  } else sel=it.name+' (no alternatives)';
  const has=['jcomfort','jfun','jthrift'].some(k=>typeof st[k]==='number');
  const joy=has?'Comfort '+sg(st.jcomfort)+' · Fun '+sg(st.jfun)+' · Thrift '+sg(st.jthrift)+(st.tired?' · after '+st.tired+' h travel':''):'not computed';
  return [sel,joy]; }
function planDoc(V,d,A){ const dep=d.querySelector('.ja-deps'); if(!dep) return; const doc=d.ownerDocument;
  let top=dep; while(top.parentNode&&top.parentNode!==d) top=top.parentNode; if(top!==dep) top.replaceWith(dep);
  if(!V.ro) [...d.children].forEach(c=>c!==dep&&c.remove());
  dep.querySelectorAll('.ja-deps-note').forEach(x=>x.remove()); const b=dep.querySelector('.ja-deps-h b'); if(b) b.textContent='Dependencies & sequence';
  dep.querySelectorAll('.ja-flag[data-flag="broken"],.ja-flag[data-flag="conflict"]').forEach(x=>x.remove());
  const hr=dep.querySelector('thead tr'), nb=hr.lastElementChild; const thr=doc.createElement('th'); thr.textContent='Risk'; hr.insertBefore(thr,hr.firstChild);
  ['Selected item','Joy (this step)'].forEach(t=>{ const th=doc.createElement('th'); th.textContent=t; hr.insertBefore(th,nb); });
  const NC=hr.children.length, rows=[...dep.querySelectorAll('tr.ja-dep')], W2=V.wi&&V.wi.A, wd=V.wi&&V.wi.doc;
  const si=V.wi?rows.findIndex(r=>r.getAttribute('data-dep-item')===V.wi.step):-1; V.planRows=[];
  const RR=riskOf(V.atlasW||W); V.risk=RR; V.riskSteps={}; V.riskDays=Object.fromEntries(Object.keys(RR.days).map(k=>[k,RR.days[k].c]));
  rows.forEach((r,i)=>{ const id=r.getAttribute('data-dep-item'); r.querySelectorAll('.ja-flag[data-flag="broken"],.ja-flag[data-flag="conflict"]').forEach(x=>x.remove());
    const rid=String(id).replace(/^item:/,''); const rk=RR.steps[rid]||RR.steps[id]; if(rk){ r.setAttribute('data-risk',rk.c); V.riskSteps[rid]=rk.c; const col=RISK_COL[rk.c]; r.style.background=col[2]; }
    const live=planCells(A,id,V.pins), td=t=>{ const e=doc.createElement('td'); e.textContent=t; return e; }; const last=r.lastElementChild;
    if(rk){ const bd=td(rk.c); bd.setAttribute('style','color:'+RISK_TEXT[rk.c]+';font-weight:700'); bd.title=rk.why; r.insertBefore(bd,r.firstChild); } else r.insertBefore(td('L'),r.firstChild);
    r.insertBefore(td(live[0]),last); r.insertBefore(td(live[1]),last);
    const rec={id,sel:live[0],joy:live[1],changed:[]};
    if(W2&&si>=0&&i>=si){ const wr=wd&&wd.querySelector('tr.ja-dep[data-dep-item="'+id+'"]'), wc=planCells(W2,id,null,id===V.wi.step);
      const lc=[...r.children]; const wcells=wr?[...wr.children]:null;
      lc.forEach((c,k)=>{ let nt=null; if(c===lc[lc.length-3]) nt=wc[0]; else if(c===lc[lc.length-2]) nt=wc[1]; else if(wcells){ const kk=k<lc.length-3?k:k-2; nt=wcells[kk]?wcells[kk].textContent:null; }
        if(nt!=null&&nt!==c.textContent){ rec.changed.push(hr.children[k]?hr.children[k].textContent:String(k)); const was=c.textContent; c.innerHTML=''; const sp=doc.createElement('span'); sp.setAttribute('style','color:#75510f'); sp.textContent='* '+nt+' (was: '+was+')'; c.appendChild(sp); } });
      rec.wsel=wc[0]; rec.wjoy=wc[1]; rec.whatif=true; }
    V.planRows.push(rec);
    /* alternatives dropdown under every step */
    const ar=doc.createElement('tr'); ar.className='ja-altrow'; ar.setAttribute('data-alt-of',id); const c=doc.createElement('td'); c.setAttribute('colspan',String(NC)); ar.appendChild(c);
    const it=(V.atlasW.items||{})[id], mem=it&&it.alts?it.alts.members.filter(m=>it.alts.unavail.indexOf(m)<0):[], open=!!V.open[id];
    const tg=doc.createElement('button'); tg.setAttribute('data-jv-act','tog:'+id); tg.textContent=(open?'▾':'▸')+' Alternatives for '+(it?it.name:id)+' ('+mem.length+')'; c.appendChild(tg);
    if(open){ if(!mem.length){ const sp=doc.createElement('span'); sp.className='ja-dim'; sp.textContent='  no alternatives for this step in the atlas'; c.appendChild(sp); }
      mem.forEach(m=>{ const o=V.atlasW.items[m.slice(5)]||{}, v=o.values||{}, bt=doc.createElement('button'); bt.setAttribute('data-jv-act','wi:'+id+':'+m);
        const cur=V.wi&&V.wi.step===id&&V.wi.alt===m; if(cur) bt.className='on'; bt.textContent=(cur?'● ':'')+(o.name||m)+' · comfort '+v.comfort+' · fun '+v.fun+' · cost '+v.cost+' · '+v.hours+' h'; c.appendChild(doc.createTextNode(' ')); c.appendChild(bt); }); }
    r.after(ar); });
  const sum=dep.querySelector('.ja-deps-sum'); if(sum){ sum.textContent=rows.length+' steps'+(V.wi?' · what-if: '+((V.atlasW.items[V.wi.step]||{}).name||V.wi.step)+' → '+((V.atlasW.items[V.wi.alt.slice(5)]||{}).name||V.wi.alt)+' (not committed; '+V.planRows.filter(r=>r.changed.length).length+' row(s) changed)':'');
    if(V.wi){ const cb=doc.createElement('button'); cb.setAttribute('data-jv-act','clear'); cb.textContent='Clear what-if'; const wrap=doc.createElement('div'); wrap.appendChild(cb); sum.after(wrap); } } }
/* what-if: clone the live atlas, pin the clicked alternative as userPick on the clone, run the REAL runtime.js session on it
   (eval.js passes: pickAlts + formula nodes; depsHtml), read its atlas + plan, dispose it. The live atlas W is never written. */
async function planAct(V,a){ if(!a) return; const S=V.sess;
  if(a.startsWith('tog:')){ const id=a.slice(4); V.open[id]=!V.open[id]; V.note=(V.open[id]?'opened':'closed')+' alternatives of '+id; return V.queue(S,'action'); }
  if(a==='clear'){ V.wi=null; V.note='what-if cleared'; return V.queue(S,'action'); }
  if(a.startsWith('wi:')){ const q=a.split(':'), step=q[1], alt=q.slice(2).join(':'), w=V.atlasW, before=JSON.stringify(w), rev0=atlasRev(w);
    const pins=Object.assign({},V.pins); pins[step]=alt; const c=JSON.parse(before); if(c.items[step]&&c.items[step].state) c.items[step].state.userPick=null;
    const S2=startRuntime(c,V.root,null,()=>{},pins); await S2.ready; const A2=JSON.parse(JSON.stringify(S2.J&&S2.J.atlas||S2.s)), html=S2.html; S2.dispose();
    const d2=new DOMParser().parseFromString('<div>'+html+'</div>','text/html').body.firstChild; hostDoc(d2); d2.querySelectorAll('.ja-flag[data-flag="broken"],.ja-flag[data-flag="conflict"]').forEach(x=>x.remove());
    V.wi={step,alt,A:A2,doc:d2,rev:rev0,liveUnchanged:JSON.stringify(w)===before&&atlasRev(w)===rev0,errs:S2.errs.slice()};
    V.note='what-if '+step+' → '+alt+' (live atlas unchanged: '+V.wi.liveUnchanged+')'; if(V.sess===S) return V.queue(S,'whatif'); } }
function diagText(){ const m=JRViews.metrics(); const L=['Exp7 demo diagnostics '+new Date().toISOString(),'userAgent: '+navigator.userAgent,'location.protocol: '+location.protocol+' · isSecureContext: '+window.isSecureContext,
  'WebAssembly: '+(typeof WebAssembly)+' · navigator.gpu: '+!!navigator.gpu+' · devicePixelRatio: '+devicePixelRatio,
  'JRender v3: jrender.classic.js + jrender_full_small.wasm '+JR_WASM_BYTES+' B · one Core for all views · font dejavu.jrf '+JR_FONT_BYTES+' B · bold '+(typeof JR_FONT_BOLD_BYTES!=='undefined'?JR_FONT_BOLD_BYTES:'?')+' B, '+(m?m.glyphs+' glyphs, upm '+m.upm:'not loaded')+' · wasm memory '+JRViews.mem()+' B · shared GPUContext: '+(JRViews.gc()?'pipelines built '+(JRViews.gc().builds||0)+', renderers '+JRViews.gc().users:'none')];
  Object.keys(JVS).forEach(id=>{ const V=JVS[id]; L.push(id+': '+(V.err?'ERROR '+V.err:V.n?'drawn '+V.n+'x · scene handle '+V.handle+' · nodes '+V.nodes+' (hit '+V.hits+') · glyphs '+V.glyphs+(V.notdef&&V.notdef.length?' (notdef for '+V.notdef.join('')+')':'')+' · text boxes '+V.tboxes+' ('+V.tlines+' lines) · items '+V.items+' · rows '+V.rows+' · content '+V.w+'x'+V.H+' view '+V.VH+' · px '+V.px.join('x')+' · last '+V.mode+' '+V.ms.toFixed(1)+' ms · full loads '+V.loads+' · patches '+V.patches+(V.lastOps?' (last '+JSON.stringify(V.lastOps)+')':'')+' · clicks '+V.clicks+' · atlas rev '+V.rev+' · runtime pass '+V.passes+' '+V.backend+' '+x7(V.engine)+' (runtime.js engine id "'+V.engine+'")'+' · runtime errors '+(V.rerrs.join(' | ')||'none'):'not drawn yet')); });
  L.push('page errors: '+(PAGEERR.length?PAGEERR.join(' | '):'none')); return L.join('\n'); }
window.exp7diag=diagText;
/* test hook: CSS-px position (relative to the view canvas, after scroll) of the first hit node matching act / text */
function where(id,act,text){ const V=JVS[id]; if(!V||!V.view.L) return null; const s=V.view.s, sp=s.scrollPos(JRViews.GID); const n=V.view.L.nodes.find(n=>n.act===act&&n.hit&&(!text||(n.el&&n.el.textContent.indexOf(text)>=0)));
  if(!n) return null; return {x:n.hit[0]+n.hit[2]/2,y:n.hit[1]+n.hit[3]/2-sp[1],cy:n.hit[1]+n.hit[3]/2,scroll:sp[1],VH:V.VH,H:V.H,id:n.id,dep:n.el&&n.el.getAttribute&&n.el.getAttribute('data-dep-item')}; }
function whereDay(id,day){ const V=JVS[id]; if(!V||!V.view.L) return null; const s=V.view.s, sp=s.scrollPos(JRViews.GID); const n=V.view.L.nodes.find(n=>n.act==='day'&&n.hit&&n.el&&n.el.getAttribute('data-day')===day);
  if(!n) return null; /* aim at day-number corner so chips do not steal the click */ return {x:n.hit[0]+14,y:n.hit[1]+12-sp[1],cy:n.hit[1]+12,scroll:sp[1],VH:V.VH,H:V.H,id:n.id,day}; }

/* real per-item flags (eval.js itemFlags / sequence) over the same atlas */
function flagsOf(w){ return Object.keys(w.items).map(id=>{ const F=E.itemFlags(w,'item:'+id), it=w.items[id], seq=it.jreq?E.sequence(w,id):[]; return {id,name:it.name,date:(it.values||{}).date||'',jreq:it.jreq,broken:F.broken,conflict:F.conflict,cycle:seq.indexOf('item:'+id)>=0,seq}; }); }
function discHTML(w){ const L=flagsOf(w).filter(x=>x.broken||x.conflict||x.cycle);
  return L.length?'<table><tr><th>item</th><th>date</th><th>jreq</th><th>discrepancy</th><th>path to fix</th></tr>'+L.map(x=>{ const j=x.jreq&&w.items[x.jreq.slice(5)];
    return `<tr class="hlf"><td>${esc(x.name)}</td><td>${esc(x.date||'—')}</td><td class="mono">${esc(x.jreq)}</td><td>${x.broken?'<span class="tag red">broken jreq</span>':''}${x.conflict?`<span class="tag red">conflict</span> ${esc(j.name)} (${esc((j.values||{}).date)}) is not dated before`:''}${x.cycle?'<span class="tag red">cycle</span>':''}</td><td class="mono">items/${esc(x.id)}/values/date · items/${esc(x.id)}/jreq</td></tr>`; }).join('')+'</table>'
   :'<p class="ok">No discrepancies: every jreq resolves and every required item is dated earlier.</p>'; }
function planSide(id){ const V=JVS[id]; if(!V||!V.wi) return '<p class="muted">No what-if. Open a step\'s Alternatives (under the step) and click one: the real runtime.js / eval.js run on a clone of the atlas with that pick, and the steps from that step on show the result (* = changed, with the live value). The live atlas is not written.</p>';
  return '<p><b>What-if</b> '+esc(V.wi.step)+' → '+esc(V.wi.alt)+' · not committed · live atlas unchanged: <b>'+V.wi.liveUnchanged+'</b>'+(V.wi.errs.length?' · <span class="bad">'+esc(V.wi.errs.join(' | '))+'</span>':'')+'</p><table><tr><th>step</th><th>selected (what-if)</th><th>joy (what-if)</th><th>changed</th></tr>'+(V.planRows||[]).filter(r=>r.whatif).map(r=>`<tr${r.changed.length?' class="hlf"':''}><td>${esc(r.id)}</td><td>${esc(r.wsel)}</td><td>${esc(r.wjoy)}</td><td>${esc(r.changed.join(', ')||'—')}</td></tr>`).join('')+'</table>'; }
function vbtns(list){ return list.map((x,i)=>`<button class="b ${x[2]||''}" data-vp="${i}">${esc(x[0])}</button>`).join(''); }
const VP={
 cal:[['Move travel to 2027-04-12 (after hotel → conflict)',[{path:'items/getthere/values/date',op:'set',value:'2027-04-12'}],'r'],
      ['Move travel back to 2027-04-09',[{path:'items/getthere/values/date',op:'set',value:'2027-04-09'}]],
      ['Move museum to 2027-04-10 (same day as hotel → conflict)',[{path:'items/museum/values/date',op:'set',value:'2027-04-10'}],'r'],
      ['Museum back to 2027-04-11',[{path:'items/museum/values/date',op:'set',value:'2027-04-11'}]],
      ['Put souvenirs on 2027-04-11 (date + onto calendar)',[{path:'items/souvenirs/values/date',op:'add',value:'2027-04-11'},{path:'components/budget/items',op:'add',value:'item:souvenirs'}]],
      ['Calendar month → 2027-05',[{path:'components/trip_calendar/view/month',op:'set',value:'2027-05'}]],['month → 2027-04',[{path:'components/trip_calendar/view/month',op:'set',value:'2027-04'}]]],
 brd:[['Board sort → date',[{path:'components/trip_calendar_board/view/sort',op:'set',value:'date'}]],['Board sort → name',[{path:'components/trip_calendar_board/view/sort',op:'set',value:'name'}]],
      ['Schedule dinner 2027-04-10',[{path:'items/dinner/values/date',op:'add',value:'2027-04-10'}]],['Move dinner to 2027-04-07',[{path:'items/dinner/values/date',op:'set',value:'2027-04-07'}]],
      ['Board filter → unscheduled',[{path:'components/trip_calendar_board/view/filter',op:'set',value:'unscheduled'}]],['filter → all',[{path:'components/trip_calendar_board/view/filter',op:'set',value:'all'}]],
      ['Thrift +4 (re-ranks alternatives)',[{path:'joys/thrift/value',op:'delta',value:4}]],['Thrift −4',[{path:'joys/thrift/value',op:'delta',value:-4}]],['Comfort +4',[{path:'joys/comfort/value',op:'delta',value:4}]],['Comfort −4',[{path:'joys/comfort/value',op:'delta',value:-4}]]],
 req:[['Hotel requires museum (cycle)',[{path:'items/hotel/jreq',op:'ref',value:'item:museum'}],'r'],['Hotel requires travel (restore)',[{path:'items/hotel/jreq',op:'ref',value:'item:getthere'}]],
      ['Museum requires item:ghost (broken jreq)',[{path:'items/museum/jreq',op:'ref',value:'item:ghost'}],'r'],['Museum requires hotel (restore)',[{path:'items/museum/jreq',op:'ref',value:'item:hotel'}]],
      ['Dinner requires museum (new requirement)',[{path:'items/dinner/jreq',op:'ref',value:'item:museum'},{path:'components/reqs/items',op:'add',value:'item:dinner'}]],
      ['Rejected: jreq on missing item',[{path:'items/ghost/jreq',op:'ref',value:'item:hotel'}],'r']]};
VP.plan=[VP.req[4],['Dinner off the plan (restore)',[{path:'components/reqs/items',op:'remove',value:'item:dinner'}]],VP.brd[6],VP.brd[7],VP.brd[8],VP.brd[9]];

/* publish host entry points for demo consumer + Exp7Views */
window.setView = setView;
window.startRuntime = startRuntime;
window.jvStatus = jvStatus;
window.planRisk = planRisk;
window.riskOf = riskOf;
window.hostDoc = hostDoc;
window.viewOps = viewOps;
window.livePins = livePins;
window.atlasRev = atlasRev;
window.submitViews = submitViews;
window.calDoc = calDoc;
window.boardDoc = boardDoc;
window.planDoc = planDoc;
window.diagText = typeof diagText==='function' ? diagText : window.diagText;
window.flagsOf = typeof flagsOf==='function' ? flagsOf : window.flagsOf;
window.where = typeof where==='function' ? where : window.where;
window.whereDay = typeof whereDay==='function' ? whereDay : window.whereDay;
window.planSide = typeof planSide==='function' ? planSide : window.planSide;
window.vbtns = typeof vbtns==='function' ? vbtns : window.vbtns;
window.discHTML = typeof discHTML==='function' ? discHTML : window.discHTML;
