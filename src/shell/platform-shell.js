const TEST="exp7-platform-lean",DBN="exp7-platform-app-v1",BOUNDARY="shell 1.6.2: app-first direct mount (no iframe). Apps: Exp7 + Budget (Budget = direct HTML calHtml/boardHtml/plan views, own slot). Reserved top bar (back+avatar) with layout space; Exp7 proposal-op sync under exp7-app-v1/ only; Budget local IDB only. PAT closure-local. Last app id persisted (non-secret).";
"use strict";
const API="https://api.github.com",RN=/^[A-Za-z0-9._-]{1,100}$/,ON=/^[A-Za-z0-9-]{1,39}$/;
const DEFAULT_APP_ID="exp7";
const $=id=>document.getElementById(id);
let gen=0,ctrl=null,deb=null,busy=false,DB=null,NS="unscoped",syncTimer=null,readyTimer=null;
const S={token:null,login:null,avatarUrl:null,cfg:null,wctrl:null};
const R={test:TEST,v:2,boundary:BOUNDARY,steps:[]};
const M={appMount:null,update:{},sync:{published:0,fetched:0,applied:0,pending:0,conflicts:0},builtinDigestOK:false};
let UI={appsOpen:false,accountOpen:false,mountedAppId:null,mounting:false,handoffConsumed:false,slots:{exp7:{mounted:false,ready:false},budget:{mounted:false,ready:false}}};

function dbOpen(){if(DB)return Promise.resolve(DB);return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error("no indexedDB"));const q=indexedDB.open(DBN,1);q.onupgradeneeded=()=>{const d=q.result;["kv","outbox","seen","log"].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n,n==="outbox"||n==="seen"?{keyPath:"opId"}:n==="log"?{autoIncrement:true}:undefined)})};q.onsuccess=()=>res(DB=q.result);q.onerror=()=>rej(q.error)})}
async function tx(stores,mode,fn){const d=await dbOpen();return new Promise((res,rej)=>{const t=d.transaction(stores,mode);const o={};fn(n=>t.objectStore(n),o);t.oncomplete=()=>res(o);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error||new Error("abort"))})}
const kvGet=k=>tx(["kv"],"readonly",(s,o)=>{const q=s("kv").get(k);q.onsuccess=()=>o.v=q.result}).then(o=>o.v);
const kvPut=(k,v)=>tx(["kv"],"readwrite",s=>s("kv").put(v,k));
const all=n=>tx([n],"readonly",(s,o)=>{const q=s(n).getAll();q.onsuccess=()=>o.v=q.result}).then(o=>o.v||[]);

function scrub(s){return s.replace(/(github_pat_|gh[pousr]_)[A-Za-z0-9_]+/g,"[redacted]").replace(/Bearer [^"\s]*/g,"[redacted]")}
function rec(step,status,detail){const e={step,status,at:new Date().toISOString()};if(detail!==undefined)e.detail=detail;R.steps.push(e);
 tx(["log"],"readwrite",s=>s("log").add(JSON.parse(scrub(JSON.stringify({...e,ns:NS}))))).catch(()=>{});
 const out=$("out"); if(out){const p=document.createElement("p");p.className=status==="pass"?"ok":(status==="fail"||status==="rejected")?"bad":"na";p.textContent=`${step}: ${status}${detail!==undefined?" — "+JSON.stringify(detail):""}`;out.appendChild(p)}}
function rate(h){const o={};for(const k of["x-ratelimit-limit","x-ratelimit-remaining","x-ratelimit-reset"]){const v=h.get(k);if(v!==null)o[k.slice(12)]=v}return Object.keys(o).length?o:"not exposed"}
function classify(st){return({401:"unauthorized",403:"forbidden or rate-limited",404:"not found or no access",409:"conflict",422:"rejected",429:"rate-limited"})[st]||(st>=500?"GitHub server error":"HTTP "+st)}
async function gh(path,{method="GET",tok=null,signal=null,body=null,raw=false}={}){
 if(!path.startsWith("/"))throw new Error("bad path");
 const h={"Accept":raw?"application/vnd.github.raw+json":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
 if(tok)h.Authorization="Bearer "+tok;if(body)h["Content-Type"]="application/json";
 let r;try{r=await fetch(API+path,{signal:signal||undefined,method,headers:h,body:body?JSON.stringify(body):undefined,redirect:"error",cache:"no-store",credentials:"omit",referrerPolicy:"no-referrer"})}
 catch(e){if(e&&e.name==="AbortError")return{ok:false,status:0,aborted:true,cat:"aborted"};return{ok:false,status:0,network:true,cat:"network/CORS failure"}}
 const t=await r.text();let data=null;try{data=raw?t:JSON.parse(t)}catch{data=null}
 return{ok:r.ok,status:r.status,data,rate:rate(r.headers),cat:r.ok?"ok":classify(r.status),sha:(!raw&&data&&data.sha)||null}}
function b64(s){return btoa(unescape(encodeURIComponent(s)))}
function hex(n){return Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,"0")).join("")}
async function sha256(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join("")}
const TOP_IDS=new Set(["btnBack","btnAvatar"]);
const CTL=()=>[...document.querySelectorAll("button,input,textarea:not([readonly])")].filter(el=>!TOP_IDS.has(el.id));
function lock(f){return async()=>{if(busy)return;busy=true;CTL().forEach(b=>b.disabled=true);try{await f()}catch(e){rec("internal","fail",String(e&&e.message||e))}finally{busy=false;CTL().forEach(b=>b.disabled=false);await renderUI()}}}

function invalidate(){S.cfg=null;setSyncStatus("Not ready.")}
async function validate(){if(busy)return;invalidate();if(ctrl)ctrl.abort();const c=ctrl=new AbortController();const my=++gen,stale=()=>my!==gen||c.signal.aborted;
 const t=$("tok").value.trim()||S.token||"",repo=$("tgt").value.trim()||"exp7-app-data";
 if(t&&!/^\S{20,}$/.test(t)){$("kstat").textContent="That doesn't look like a complete key yet.";return}
 if(!t)return;if(!RN.test(repo))return rec("target_input","fail","invalid repo name");
 $("kstat").textContent="Checking (read-only)…";$("tok").value="";if(t!==S.token)S.token=null;
 const u=await gh("/user",{tok:t,signal:c.signal});if(stale()||u.aborted)return;
 if(!u.ok){S.token=null;S.login=null;S.avatarUrl=null;setAvatar(null,null);$("kstat").textContent=u.status===401?"Key not accepted.":u.status===0?"Could not reach GitHub.":"Key check failed ("+u.status+").";return rec("key_check","fail",{status:u.status})}
 S.token=t;const login=S.login=u.data.login;S.avatarUrl=(typeof u.data.avatar_url==="string"&&u.data.avatar_url.startsWith("https://"))?u.data.avatar_url:null;
 setAvatar(S.avatarUrl,login);rec("key_check","pass",{signedIn:true});
 $("keyArea").hidden=true;$("after").hidden=false;$("kstat").textContent="";$("who").textContent="Signed in as "+login+".";$("tstat").textContent="Checking data repo…";
 const r=await gh("/repos/"+login+"/"+repo,{tok:t,signal:c.signal});if(stale()||r.aborted||S.token!==t)return;
 if(!r.ok){$("tstat").textContent="Repo not found. Create public "+login+"/"+repo+" on GitHub (this page never creates repos).";return rec("target_check","fail",{status:r.status})}
 if(!(r.data.owner&&r.data.owner.login===login)||r.data.private){$("tstat").textContent="Repo must be yours and public.";return rec("target_check","fail","not own public repo")}
 const src={owner:login,repo:r.data.name,branch:r.data.default_branch};const res=await enterScope(src,true);if(stale()||S.token!==t)return;
 if(res&&res.ok){S.cfg=Object.freeze({gen:my,tok:t,...src});$("tstat").textContent="Ready. Proposal-op sync to "+login+"/"+src.repo+".";rec("target_check","pass",{public:true});startAutoSync();await rememberAppForUser(UI.mountedAppId||DEFAULT_APP_ID)}
 else{$("tstat").textContent=res&&res.msg||"Not ready.";rec("target_check","fail",res&&res.msg)};await renderUI()}
function leaseOk(L,wc){return !!L&&!!L.tok&&!wc.signal.aborted&&S.cfg===L&&gen===L.gen&&S.token===L.tok&&($("tgt").value.trim()||"exp7-app-data")===L.repo}

async function putWrite(L,wc,path,text,label){
 const P="/repos/"+L.owner+"/"+L.repo+"/contents/"+path;
 const meta=await gh(P+"?ref="+encodeURIComponent(L.branch),{tok:L.tok,signal:wc.signal});
 if(!leaseOk(L,wc))return{state:"suppressed"};
 if(meta.ok){const raw=await gh(P+"?ref="+encodeURIComponent(L.branch),{tok:L.tok,signal:wc.signal,raw:true});if(!leaseOk(L,wc))return{state:"suppressed"};if(raw.ok&&raw.data===text)return{state:"exists-identical"};}
 const body={message:"exp7 "+label,content:b64(text),branch:L.branch};if(meta.ok&&meta.sha)body.sha=meta.sha;
 const w=await gh(P,{method:"PUT",tok:L.tok,body,signal:wc.signal});
 if(w.ok)return{state:meta.ok?"updated":"created"};
 if(w.status===0||w.status>=500)return{state:"unknown"};
 return{state:"error",detail:{status:w.status,reason:w.cat}}}
async function putCreate(L,wc,path,text,label){
 const P="/repos/"+L.owner+"/"+L.repo+"/contents/"+path;
 const pre=await gh(P+"?ref="+encodeURIComponent(L.branch),{tok:L.tok,signal:wc.signal,raw:true});
 if(!leaseOk(L,wc))return{state:"suppressed"};
 if(pre.ok)return pre.data===text?{state:"exists-identical"}:{state:"conflict"};
 if(pre.status!==404)return{state:"error",detail:{status:pre.status,reason:pre.cat}};
 const w=await gh(P,{method:"PUT",tok:L.tok,body:{message:"exp7 "+label,content:b64(text),branch:L.branch},signal:wc.signal});
 if(w.ok)return{state:"created"};if(w.status===0||w.status>=500||w.status===422)return{state:"unknown"};return{state:"error",detail:{status:w.status,reason:w.cat}}}

/* Sign out: clear in-memory key/auth, stop account sync. Does NOT delete IDB outbox/snapshots/lastApp. Handoff already one-shot. */
function wipeAuth(){stopAutoSync();clearTimeout(deb);if(ctrl)ctrl.abort();if(S.wctrl)S.wctrl.abort();gen++;S.token=null;S.login=null;S.avatarUrl=null;S.cfg=null;$("tok").value="";if(RELEASE){RELEASE();RELEASE=null}NS="unscoped";SESS=null;HANDLE=null;CLOCK=0;setAvatar(null,null)}
function signOut(){if(busy)return;UI.handoffConsumed=true;wipeAuth();$("after").hidden=true;$("keyArea").hidden=false;$("kstat").textContent="";$("who").textContent="";$("tstat").textContent="";$("shareStat").textContent="";invalidate();setSyncStatus("Signed out. Local unsynced proposal ops kept.");rec("session_cleared","info","key removed; outbox preserved; handoff disabled");renderUI();closeAccountMenu()}
function sched(ms){if(busy)return;clearTimeout(deb);invalidate();deb=setTimeout(()=>{if($("tok").value.trim()||S.token)validate()},ms)}
function wireCommon(){$("clr").onclick=signOut;$("tgt").oninput=()=>{if(S.token)sched(900);else invalidate()};
 $("tok").addEventListener("input",()=>{S.token=null;sched(900)});$("tok").addEventListener("paste",()=>sched(150));
 $("tok").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();sched(0)}});$("tok").addEventListener("blur",()=>{if($("tok").value.trim())sched(0)});
 addEventListener("pagehide",()=>{wipeAuth()})}

const lc=x=>String(x).toLowerCase();const same=(a,b)=>lc(a.owner)===lc(b.owner)&&lc(a.repo)===lc(b.repo);
const K=k=>NS+"|"+k;const scoped=()=>NS!=="unscoped"&&SESS;
let SESS=null,CLOCK=0,HANDLE=null,EXCL=false,RELEASE=null,RELP=null,RELP_CAND=null;
const APP_ROOT="exp7-app-v1";
const sessDir=()=>APP_ROOT+"/"+(SESS&&SESS.session);
const opPath=(owner,op)=>sessDir()+"/ops/"+lc(owner)+"/"+String(op.lamport).padStart(6,"0")+"-"+op.opId+".json";
const metaPath=()=>sessDir()+"/meta.json";
function opText(op){return JSON.stringify({format:"exp7-app-op/1",session:op.session,opId:op.opId,lamport:op.lamport,owner:op.owner,atlasId:op.atlasId||"syn_trip",proposal:op.proposal})+"\n"}

async function acquire(base){if(!(navigator.locks&&navigator.locks.request))return{handle:"c1",exclusive:false};
 for(let n=1;n<=5;n++){const got=await new Promise(res=>{const pr=navigator.locks.request("exp7app:"+base+"#c"+n,{ifAvailable:true},lock=>{if(!lock){res(false);return}return new Promise(r=>{RELEASE=r;res(true)})});pr.catch(()=>res(false));RELP_CAND=pr});if(got){RELP=RELP_CAND.catch(()=>{});return{handle:"c"+n,exclusive:true}}}return null}
async function addProfile(v){const p=(await kvGet("global|profiles"))||[];if(!p.some(x=>same(x,v))){p.push({owner:v.owner,repo:v.repo,branch:v.branch});await kvPut("global|profiles",p.slice(-5))}showProfiles()}
async function showProfiles(){const p=(await kvGet("global|profiles"))||[],d=$("profiles");if(!d)return;d.innerHTML="";p.forEach(v=>{const b=document.createElement("button");b.type="button";b.textContent="Open offline: "+v.owner+"/"+v.repo;b.onclick=lock(async()=>{if(S.cfg)return;await enterScope(v,false)});d.appendChild(b)})}
async function saveSess(){await kvPut(K("sess"),SESS)}
async function enterScope(v,viaKey){const base=lc(v.owner)+"/"+lc(v.repo);
 if(NS!=="unscoped"&&NS.startsWith(base+"#")&&SESS){SESS.self=v;await saveSess();if(viaKey)$("offinfo").textContent="";await renderUI();return{ok:true,src:v}}
 if(RELEASE){RELEASE();RELEASE=null}NS="unscoped";SESS=null;await RELP;const a=await acquire(base);
 if(!a)return{ok:false,msg:"Too many windows open for this account; close one and retry."};
 HANDLE=a.handle;EXCL=a.exclusive;NS=base+"#"+HANDLE;
 SESS=await kvGet(K("sess"))||null;
 if(!SESS||!SESS.session){SESS={session:"s"+hex(6),self:v,members:[{login:lc(v.owner),repo:v.repo,branch:v.branch}],singleAccount:false}}
 else{SESS.self=v;const me=SESS.members.find(m=>lc(m.login)===lc(v.owner));if(me){me.repo=v.repo;me.branch=v.branch}else SESS.members.push({login:lc(v.owner),repo:v.repo,branch:v.branch})}
 CLOCK=await kvGet(K("clock"))||0;await saveSess();if(viaKey)await addProfile(v);
 if(!viaKey)$("offinfo").textContent="Offline: "+v.owner+"/"+v.repo+". Local edits kept; paste key to sync.";
 rec("client_scope","pass",{session:SESS.session,via:viaKey?"key":"offline"});return{ok:true,src:v}}

function setSyncStatus(t){for(const id of["syncstat","syncstatBar"]){const el=$(id);if(el)el.textContent=t}}
function inviteJSON(){if(!SESS)return"";return JSON.stringify({exp7Invite:1,session:SESS.session,from:{login:SESS.self.owner,repo:SESS.self.repo,branch:SESS.self.branch},members:SESS.members.map(m=>({login:m.login,repo:m.repo,branch:m.branch}))})}
async function renderUI(){const ul=$("members");if(ul){ul.innerHTML="";if(SESS)SESS.members.forEach(m=>{const li=document.createElement("li");li.textContent=m.login+" · "+m.login+"/"+m.repo+(lc(m.login)===lc(SESS.self.owner)?" (you)":"");ul.appendChild(li)})}
 const so=$("shareOut");if(so&&document.activeElement!==so)so.value=inviteJSON();
 const pend=(await all("outbox")).filter(o=>o.ns===NS).length;M.sync.pending=pend;
 if(scoped())setSyncStatus(`Session ${SESS.session} · pending ${pend} · published ${M.sync.published} · applied ${M.sync.applied}`);
 try{await pkgStatus()}catch{}
 renderAppButtons()}

async function addUser(){if(!scoped())return rec("add_user","fail","validate key first");
 const raw=($("userIn").value||"").trim();if(!raw)return rec("add_user","fail","enter a GitHub username or invite JSON");
 if(raw.startsWith("{")){let j;try{j=JSON.parse(raw)}catch{return rec("add_user","fail","invite JSON invalid")}
  if(!j||j.exp7Invite!==1||!/^s[0-9a-f]{12}$/.test(j.session||"")||!j.from||!ON.test(j.from.login||""))return rec("add_user","fail","invite malformed");
  if(SESS.session!==j.session&&(await all("outbox")).some(o=>o.ns===NS))return rec("add_user","fail","unpublished local edits; sync or stay on current session");
  SESS.session=j.session;const seen=new Set(SESS.members.map(m=>lc(m.login)));
  (j.members||[j.from]).forEach(m=>{if(!m||!ON.test(m.login))return;const login=lc(m.login);if(seen.has(login))return;seen.add(login);SESS.members.push({login,repo:RN.test(m.repo||"")?m.repo:"exp7-app-data",branch:RN.test(m.branch||"")?m.branch:"main"})});
  if(lc(j.from.login)===lc(SESS.self.owner))SESS.singleAccount=true;
  await saveSess();$("userIn").value="";await publishMeta();await renderUI();rec("add_user","pass",{via:"invite",session:SESS.session,members:SESS.members.length});return}
 const login=raw.replace(/^@/,"");if(!ON.test(login))return rec("add_user","fail","invalid GitHub username");
 const u=await gh("/users/"+login,{tok:S.token||null});if(!u.ok)return rec("add_user","fail",{status:u.status,reason:"GitHub user not found"});
 const theirLogin=lc(u.data.login);if(SESS.members.some(m=>lc(m.login)===theirLogin))return rec("add_user","info","already a member");
 if(SESS.members.length>=8)return rec("add_user","fail","max 8 members");
 const repo=$("tgt").value.trim()||"exp7-app-data";
 SESS.members.push({login:theirLogin,repo,branch:SESS.self.branch||"main"});
 if(theirLogin===lc(SESS.self.owner))SESS.singleAccount=true;
 await saveSess();$("userIn").value="";await publishMeta();await renderUI();rec("add_user","pass",{login:theirLogin,note:"added by public identity; their key never collected"})}
async function shareInvite(){const t=inviteJSON();$("shareOut").value=t;try{await navigator.clipboard.writeText(t);$("shareStat").textContent="Invite copied (no secrets)."}catch{$("shareOut").focus();$("shareOut").select();$("shareStat").textContent="Select invite text and copy (Cmd/Ctrl+C)."}rec("share","pass",{session:SESS&&SESS.session})}
async function publishMeta(){const L=S.cfg;if(!L||!SESS)return;const wc=S.wctrl=new AbortController();
 const text=JSON.stringify({format:"exp7-app-meta/1",session:SESS.session,members:SESS.members},null,0)+"\n";
 const r=await putWrite(L,wc,metaPath(),text,"app meta "+SESS.session);rec("meta_publish",r.state==="created"||r.state==="updated"||r.state==="exists-identical"?"pass":"info",r)}

async function queueAppOp(ent){if(!scoped()||!ent||!ent.p||!ent.r||!ent.r.ok)return;
 const owner=lc(SESS.self.owner);const ck=K("clock");
 const op={opId:hex(8),ns:NS,session:SESS.session,owner,atlasId:(window.exp7&&window.exp7.W&&window.exp7.W().id)||"syn_trip",proposal:{id:ent.p.id,proc:ent.p.proc,baseRev:ent.p.baseRev,t:ent.p.t,ops:ent.p.ops},status:"pending"};
 await tx(["kv","outbox"],"readwrite",s=>{const q=s("kv").get(ck);q.onsuccess=()=>{op.lamport=Math.max(q.result||0,CLOCK)+1;CLOCK=op.lamport;s("kv").put(CLOCK,ck);s("outbox").put(op)}});
 try{const snap=window.exp7&&window.exp7.snapshot&&window.exp7.snapshot();if(snap)await kvPut(K("atlasSnap"),{session:SESS.session,at:Date.now(),atlas:snap})}catch{}
 M.sync.pending++;rec("app_edit_queued","pass",{lamport:op.lamport,ops:ent.p.ops.length})}

async function publishOutbox(){const L=S.cfg,wc=S.wctrl=new AbortController();if(!leaseOk(L,wc)||!scoped())return;
 const ns=NS,owner=lc(L.owner);const ops=(await all("outbox")).filter(o=>o.ns===ns&&o.owner===owner&&o.status!=="conflict").sort((a,b)=>a.lamport-b.lamport);
 for(const op of ops){if(!leaseOk(L,wc)||NS!==ns)return;op.status="inflight";await tx(["outbox"],"readwrite",s=>s("outbox").put(op));
  const r=await putCreate(L,wc,opPath(owner,op),opText(op),"app op "+op.lamport);
  if(r.state==="suppressed"||NS!==ns){op.status="pending";await tx(["outbox"],"readwrite",s=>s("outbox").put(op));return}
  if(r.state==="conflict"){op.status="conflict";M.sync.conflicts++;await tx(["outbox"],"readwrite",s=>s("outbox").put(op));continue}
  if(r.state==="unknown"||r.state==="error"){op.status="pending";await tx(["outbox"],"readwrite",s=>s("outbox").put(op));setSyncStatus("Publish deferred ("+r.state+"). Local edits kept.");return}
  await tx(["outbox","seen"],"readwrite",s=>{s("outbox").delete(op.opId);s("seen").put({opId:op.opId,ns,owner,lamport:op.lamport,session:op.session})});
  M.sync.published++;}
 await publishMeta()}

async function fetchAndApplyRemote(){if(!scoped())return;if(!window.exp7||!window.exp7.applyCheckedProposal){setSyncStatus("App mount needed for merge apply.");return}
 const pending=(await all("outbox")).filter(o=>o.ns===NS);const ns=NS;const seen=new Map((await all("seen")).filter(s=>s.ns===ns).map(s=>[s.owner+"|"+s.opId,s]));
 const remote=[];
 const tok=S.token||null;
 for(const m of SESS.members){const list=await gh("/repos/"+m.login+"/"+m.repo+"/contents/"+sessDir()+"/ops/"+lc(m.login)+"?ref="+encodeURIComponent(m.branch||"main"),{tok});
  if(NS!==ns)return;if(list.status===404)continue;if(!list.ok||!Array.isArray(list.data))continue;
  let budget=40;for(const f of list.data){if(budget--<=0)break;const mm=/^(\d+)-([0-9a-f]{16})\.json$/.exec(f.name||"");if(!mm)continue;
   const key=lc(m.login)+"|"+mm[2];if(seen.has(key))continue;if(pending.some(p=>p.opId===mm[2]&&lc(p.owner)===lc(m.login)))continue;
   const raw=await gh("/repos/"+m.login+"/"+m.repo+"/contents/"+sessDir()+"/ops/"+lc(m.login)+"/"+f.name+"?ref="+encodeURIComponent(m.branch||"main"),{tok,raw:true});
   if(NS!==ns)return;if(!raw.ok)continue;let o;try{o=JSON.parse(raw.data)}catch{continue}
   if(!o||o.format!=="exp7-app-op/1"||o.session!==SESS.session||o.opId!==mm[2]||+mm[1]!==o.lamport||!o.proposal||!Array.isArray(o.proposal.ops))continue;
   remote.push(o)}}
 remote.sort((a,b)=>a.lamport-b.lamport||(a.owner<b.owner?-1:1)||(a.opId<b.opId?-1:1));
 for(const o of remote){if(NS!==ns)return;
  const ent=window.exp7.applyCheckedProposal(o.proposal);
  if(ent&&ent.r&&ent.r.ok){await tx(["seen"],"readwrite",s=>s("seen").put({opId:o.opId,ns,owner:lc(o.owner),lamport:o.lamport,session:o.session}));M.sync.applied++;M.sync.fetched++;if(o.lamport>CLOCK){CLOCK=o.lamport;await kvPut(K("clock"),CLOCK)}
   try{const snap=window.exp7.snapshot();await kvPut(K("atlasSnap"),{session:SESS.session,at:Date.now(),atlas:snap})}catch{}}
  else{rec("app_merge","info",{opId:o.opId,reason:ent&&ent.r&&ent.r.reason||"rejected"});M.sync.conflicts++}}
}

async function autoSync(){if(!S.cfg||!scoped())return;try{setSyncStatus("Syncing…");await publishOutbox();await fetchAndApplyRemote();await renderUI();setSyncStatus(`Synced · pending ${M.sync.pending} · published ${M.sync.published} · applied ${M.sync.applied}`)}catch(e){setSyncStatus("Sync error (local edits kept): "+(e&&e.message||e));rec("auto_sync","fail",String(e&&e.message||e))}}
function startAutoSync(){stopAutoSync();syncTimer=setInterval(()=>{if(!busy)autoSync()},8000);autoSync()}
function stopAutoSync(){if(syncTimer){clearInterval(syncTimer);syncTimer=null}}

function wireAppSyncHooks(){const e=window.exp7;if(!e||e.__platSyncWired)return;e.__platSyncWired=true;
 const orig=e.submit;e.submit=function(ops,proc,src){const ent=orig.call(this,ops,proc,src);if(ent&&ent.r&&ent.r.ok)queueAppOp(ent).then(()=>autoSync());return ent};
 rec("app_sync_hook","pass",{note:"submit() hooked for automatic app-op outbox"})}
async function restoreAtlasIfAny(){if(!window.exp7||!window.exp7.replaceW)return;const snap=await kvGet(K("atlasSnap"));if(!snap||!snap.atlas||!SESS||snap.session!==SESS.session)return;
 window.exp7.replaceW(snap.atlas);rec("app_restore","pass",{session:SESS.session,note:"restored durable local atlas snapshot (pending stay in outbox for publish)"})}

// ===== avatar / menus / apps =====
function setAvatar(url,login){
 /* Exactly one representation: loaded image XOR fallback disc. Never both (half-avatar defect). */
 const img=$("avatarImg"),fb=$("avatarFallback");
 function showImg(on){ if(!img)return; img.classList.toggle("is-on",!!on); img.hidden=!on; if(!on){ /* keep src only while attempting load */ } }
 function showFb(on){ if(!fb)return; fb.classList.toggle("is-on",!!on); fb.hidden=!on; fb.textContent=on?initials(login):""; }
 if(img){
  img.onload=()=>{ if(!img.getAttribute("src")){ showImg(false); showFb(true); return; } showImg(true); showFb(false); };
  img.onerror=()=>{ img.removeAttribute("src"); showImg(false); showFb(true); };
  if(url){ img.alt=login?("Avatar for "+login):"GitHub avatar"; showImg(false); showFb(false); /* pending: neither until load/error */ img.src=url; }
  else { img.removeAttribute("src"); img.alt=""; showImg(false); showFb(true); }
 } else showFb(true);
}
function initials(login){if(!login)return"?";const s=String(login).replace(/[^A-Za-z0-9]/g,"");return(s.slice(0,2)||"?").toUpperCase()}

function availableApps(){
 // Only real apps shipped in this shell — Exp7 (embedded lean) and Budget.
 return[
  {id:"exp7",label:"Exp7",hint:"Planner / atlas (lean v17)"},
  {id:"budget",label:"Budget",hint:"HTML Calendar/Board/Plan views (local)"}
 ]}
function lastAppKey(){return S.login?"user|"+lc(S.login)+"|lastAppId":"global|lastAppId"}
async function rememberAppForUser(appId){if(!appId||!availableApps().some(a=>a.id===appId))return;
 await kvPut("global|lastAppId",appId);if(S.login)await kvPut("user|"+lc(S.login)+"|lastAppId",appId)}
async function resolveLastAppId(){
 let id=null;
 if(S.login)id=await kvGet("user|"+lc(S.login)+"|lastAppId");
 if(!id)id=await kvGet("global|lastAppId");
 if(typeof id!=="string"||!availableApps().some(a=>a.id===id)){rec("last_app","info",{fallback:DEFAULT_APP_ID,saved:id||null});return DEFAULT_APP_ID}
 return id}

function renderAppButtons(){const box=$("appButtons");if(!box)return;box.innerHTML="";
 availableApps().forEach(a=>{const b=document.createElement("button");b.type="button";b.className="appPick";b.dataset.appId=a.id;b.setAttribute("aria-current",UI.mountedAppId===a.id&&!UI.appsOpen?"true":"false");
  b.innerHTML=`<b>${a.label}</b><br><span class="na">${a.hint||""}</span>`;
  b.onclick=()=>openApp(a.id,{fromPicker:true});box.appendChild(b)})}

function showAppsOverlay(){UI.appsOpen=true;const o=$("appsOverlay");if(o)o.hidden=false;$("appShell").style.visibility="hidden";closeAccountMenu();renderAppButtons();rec("apps_overlay","info","shown (app kept mounted)");$("btnBack").focus()}
function hideAppsOverlay(){UI.appsOpen=false;const o=$("appsOverlay");if(o)o.hidden=true;$("appShell").style.visibility="";}

function openAccountMenu(){UI.accountOpen=true;const m=$("accountMenu"),s=$("accountScrim");if(m)m.hidden=false;if(s)s.hidden=false;$("btnAvatar").setAttribute("aria-expanded","true");
 const focusable=m.querySelector("input:not([disabled]),button:not([disabled]),textarea:not([disabled]),a[href]");if(focusable)focusable.focus()}
function closeAccountMenu(){UI.accountOpen=false;const m=$("accountMenu"),s=$("accountScrim");if(m)m.hidden=true;if(s)s.hidden=true;$("btnAvatar").setAttribute("aria-expanded","false")}
function toggleAccountMenu(){if(UI.accountOpen)closeAccountMenu();else openAccountMenu()}

function wireChrome(){
 $("btnBack").onclick=()=>{if(UI.accountOpen){closeAccountMenu();return}if(UI.appsOpen){if(UI.mountedAppId)hideAppsOverlay();return}showAppsOverlay()};
 $("btnAvatar").onclick=()=>toggleAccountMenu();
 $("accountScrim").onclick=()=>closeAccountMenu();
 addEventListener("keydown",e=>{
  if(e.key==="Escape"){if(UI.accountOpen){e.preventDefault();closeAccountMenu();$("btnAvatar").focus();return}
   if(UI.appsOpen&&UI.mountedAppId){e.preventDefault();hideAppsOverlay();$("btnBack").focus()}}
 });
 wireReservedBarLayout();
}
/** Keep app shell / overlays strictly below the solid reserved bar; expose hit-test proof. */
function barHeightPx(){ const c=$("topChrome"); if(!c) return 44; const r=c.getBoundingClientRect(); return Math.max(44, Math.round(r.height)); }
function layoutReservedChrome(){
 const h=barHeightPx();
 document.documentElement.style.setProperty("--bar-h", h+"px");
 const shell=$("appShell"), ov=$("appsOverlay"), scrim=$("accountScrim");
 [shell,ov,scrim].forEach(el=>{ if(!el) return; el.style.top=h+"px"; });
 // Defensive: never let shell cover the reserved bar region
 if(shell){ const sr=shell.getBoundingClientRect(); if(sr.top+0.5 < h) shell.style.top=h+"px"; }
}
function chromeHitProbe(clientX, clientY){
 const chrome=$("topChrome"), shell=$("appShell");
 const cr=chrome?chrome.getBoundingClientRect():null, sr=shell?shell.getBoundingClientRect():null;
 const inChrome=!!(cr&&clientX>=cr.left&&clientX<=cr.right&&clientY>=cr.top&&clientY<=cr.bottom);
 const inShell=!!(sr&&clientX>=sr.left&&clientX<=sr.right&&clientY>=sr.top&&clientY<=sr.bottom);
 const el=document.elementFromPoint(clientX, clientY);
 const id=el&&(el.id||(el.closest&&el.closest("#btnBack,#btnAvatar,#topChrome,#appShell")&&(el.closest("#btnBack,#btnAvatar,#topChrome,#appShell").id)));
 return {inChrome,inShell,overlap:inChrome&&inShell, elementId:id||(el&&el.tagName)||null, barH:barHeightPx()};
}
function wireReservedBarLayout(){
 layoutReservedChrome();
 const run=()=>layoutReservedChrome();
 addEventListener("resize", run);
 addEventListener("scroll", run, {passive:true, capture:true});
 if(window.visualViewport){ visualViewport.addEventListener("resize", run); visualViewport.addEventListener("scroll", run); }
 try{ window.__chromeHitProbe=chromeHitProbe; window.__layoutReservedChrome=layoutReservedChrome; }catch(e){}
}

// ===== packages / direct mount =====
const SHELL_VERSION="1.6.2",SHELL_MAJOR=1;let BUILTIN_SHA="",BUILTIN_TEXT=null,STAGED=null;
function builtinText(){if(BUILTIN_TEXT===null){const b=atob(document.getElementById("apppkg").textContent.trim()),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);BUILTIN_TEXT=new TextDecoder().decode(u)}return BUILTIN_TEXT}
async function sha256bytes(b64){const b=atob(b64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);const d=await crypto.subtle.digest("SHA-256",u);return Array.from(new Uint8Array(d),x=>x.toString(16).padStart(2,"0")).join("")}
async function pkgState(){return(await kvGet("global|pkg"))||{active:{kind:"builtin",sha:BUILTIN_SHA,label:"Exp7 lean (built-in)"},previous:null,trial:false}}
async function pkgText(p){if(p.kind==="builtin")return builtinText();return await kvGet("global|pkgdata:"+p.sha)}
function setMountStatus(t){for(const id of["appmount","appmountBar"]){const el=$(id);if(el)el.textContent=t}}
function slotEl(appId){return document.getElementById("appSlot-"+appId)}
function showOnlySlot(appId){["exp7","budget"].forEach(id=>{const el=slotEl(id); if(!el)return; el.hidden=(id!==appId)})}
function clearSlot(appId){const host=slotEl(appId); if(!host)return;
 if(window._appMountAbort && window._appMountAbort[appId])try{window._appMountAbort[appId].abort()}catch(e){}
 if(window._readyTimer && window._readyTimer[appId]){clearTimeout(window._readyTimer[appId]); window._readyTimer[appId]=null}
 host.querySelectorAll("style[data-exp7],script[data-exp7]").forEach(n=>n.remove());
 document.querySelectorAll('[data-app-assets="'+appId+'"]').forEach(n=>n.remove());
 host.innerHTML=""; host.removeAttribute("data-app-mode");
 if(appId==="exp7"){try{delete window.exp7}catch(e){window.exp7=undefined}try{delete window.exp7Diagnostics}catch(e){window.exp7Diagnostics=undefined}try{delete window.exp7show}catch(e){window.exp7show=undefined}try{delete window.__exp7Pub}catch(e){window.__exp7Pub=undefined}}
 if(appId==="budget"){try{delete window.budget}catch(e){window.budget=undefined}try{delete window.__budgetPub}catch(e){window.__budgetPub=undefined}}
 UI.slots[appId]={mounted:false,ready:false};
 if(UI.mountedAppId===appId)UI.mountedAppId=null}
function clearExp7Assets(){clearSlot("exp7")}
function scopeAppCss(css,hostSel){return String(css).replace(/(^|})(\s*)([^{}@][^{]*)\{/g,function(_,br,ws,sel){const out=sel.split(",").map(function(s){s=s.trim();if(!s)return s;if(s==="html"||s==="body"||s===":root")return hostSel;if(s.charAt(0)==="*")return hostSel+" "+s;return hostSel+" "+s}).join(",");return br+ws+out+"{";})}
function isExecScript(type){if(!type)return true;type=String(type).toLowerCase();return type==="text/javascript"||type==="application/javascript"||type==="module"||type==="text/ecmascript"||type==="application/ecmascript"}
async function injectAppDirect(html,appId){const host=slotEl(appId);if(!host)throw new Error("slot missing "+appId);const hostSel="#appSlot-"+appId;
 const doc=new DOMParser().parseFromString(html,"text/html");host.innerHTML="";
 document.querySelectorAll('[data-app-assets="'+appId+'"]').forEach(n=>n.remove());
 doc.querySelectorAll("style").forEach(function(st){const s=document.createElement("style");s.setAttribute("data-app-assets",appId);s.textContent=scopeAppCss(st.textContent||"",hostSel);document.head.appendChild(s)});
 const ordered=[...doc.querySelectorAll("script")];
 for(const node of [...doc.body.childNodes]){if(node.nodeName==="SCRIPT")continue;host.appendChild(document.importNode(node,true))}
 for(const old of ordered){const type=old.getAttribute("type");
  if(!isExecScript(type)){const s=document.createElement("script");s.setAttribute("data-app-assets",appId);for(const a of old.attributes)s.setAttribute(a.name,a.value);s.textContent=old.textContent||"";host.appendChild(s);continue}
  if(old.src){await new Promise(function(res,rej){const s=document.createElement("script");s.setAttribute("data-app-assets",appId);if(type)s.type=type;s.src=old.src;s.onload=()=>res();s.onerror=()=>rej(new Error("script src failed"));document.head.appendChild(s)});continue}
  const s=document.createElement("script");s.setAttribute("data-app-assets",appId);if(type)s.type=type;s.textContent=old.textContent||"";document.head.appendChild(s)}}
function bindAppSignals(t0,st,appId){window._appMountAbort=window._appMountAbort||{};window._readyTimer=window._readyTimer||{};
 if(window._appMountAbort[appId])try{window._appMountAbort[appId].abort()}catch(e){}
 if(window._readyTimer[appId]){clearTimeout(window._readyTimer[appId]);window._readyTimer[appId]=null}
 window._appMountAbort[appId]=new AbortController();const sig=window._appMountAbort[appId].signal;
 function handle(p){if(!p)return;
  const okSrc=(appId==="exp7"&&p.source==="exp7-app")||(appId==="budget"&&p.source==="budget-app");
  if(!okSrc)return;
  if(p.type==="exp7-app-ready"||p.type==="budget-app-ready"){if(window._readyTimer[appId]){clearTimeout(window._readyTimer[appId]);window._readyTimer[appId]=null}
   UI.slots[appId]={mounted:true,ready:true};M.appMount.renderReady=true;M.appMount.readyMs=Math.round(performance.now()-t0);M.appMount.proof={tabs:p.tabs,sectionOn:p.sectionOn,mode:p.mode||"direct",appId,proof:p.proof||null};
   rec("app_mount","pass",{appId,package:st&&st.active&&st.active.label||appId,readyMs:M.appMount.readyMs,proof:M.appMount.proof,note:"render-ready after direct inject"});setMountStatus(`App render-ready in ${M.appMount.readyMs} ms`);
   if(appId==="exp7"){wireAppSyncHooks();restoreAtlasIfAny().then(()=>autoSync())}}
  else if(p.type==="exp7-app-error"||p.type==="budget-app-error"){if(M.appMount.renderReady&&UI.mountedAppId===appId)return;if(window._readyTimer[appId]){clearTimeout(window._readyTimer[appId]);window._readyTimer[appId]=null}
   M.appMount.error=String(p.error||"boot failed").slice(0,500);rec("app_mount","fail",{appId,error:M.appMount.error});setMountStatus("App boot failed: "+M.appMount.error)}}
 addEventListener("message",e=>{if(e.source!==window)return;handle(e.data)},{signal:sig});
 addEventListener("exp7-app-signal",e=>handle(e.detail),{signal:sig});
 addEventListener("budget-app-signal",e=>handle(e.detail),{signal:sig});
 window._readyTimer[appId]=setTimeout(()=>{if(UI.slots[appId]&&UI.slots[appId].ready)return;if(M.appMount&&M.appMount.renderReady&&UI.mountedAppId===appId)return;M.appMount.error="render-ready timeout";rec("app_mount","fail",{appId,error:M.appMount.error});setMountStatus("Inject finished but app did not report render-ready.")},12000)}

function appHtml(appId){if(appId==="budget"){const b=atob(document.getElementById("budgetpkg").textContent.trim()),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new TextDecoder().decode(u)}
 return null}
async function mountAppFresh(appId){if(UI.mounting)return;UI.mounting=true;
 try{let t=null,st=null;
  if(appId==="budget"){t=appHtml("budget");st={active:{label:"Budget"}}}
  else{st=await pkgState();t=await pkgText(st.active);if(t==null){rec("app_mount","fail","package data missing");return}}
  clearSlot(appId);
  const t0=performance.now();M.appMount={loadEvent:false,renderReady:false,error:null,loadEventMs:null,readyMs:null,proof:null,package:st.active.label,mode:"direct",appId};
  setMountStatus("Mounting "+appId+"…");hideAppsOverlay();$("appShell").style.visibility="";showOnlySlot(appId);
  bindAppSignals(t0,st,appId);
  try{await injectAppDirect(t,appId);UI.slots[appId]={mounted:true,ready:false};UI.mountedAppId=appId;M.appMount.loadEvent=true;M.appMount.loadEventMs=Math.round(performance.now()-t0);rec("app_mount","info",{appId,loadEventMs:M.appMount.loadEventMs,note:"direct inject finished — waiting for render-ready"});if(!M.appMount.renderReady&&!M.appMount.error)setMountStatus(`direct inject ${M.appMount.loadEventMs} ms — waiting…`); await rememberAppForUser(appId); try{layoutReservedChrome();window.dispatchEvent(new Event("resize"))}catch(e){}}
  catch(e){M.appMount.error=String(e&&e.message||e).slice(0,500);UI.slots[appId]={mounted:false,ready:false};rec("app_mount","fail",{appId,error:M.appMount.error});setMountStatus("Direct inject failed: "+M.appMount.error)}}
 finally{UI.mounting=false}}
async function persistLiveApp(appId){if(appId==="budget"&&window.budget&&window.budget.persist){try{await window.budget.persist()}catch(e){}}}
async function openApp(appId,opts){opts=opts||{};
 if(!availableApps().some(a=>a.id===appId)){appId=DEFAULT_APP_ID;rec("open_app","info",{fallback:DEFAULT_APP_ID})}
 if(UI.slots[appId]&&UI.slots[appId].mounted){hideAppsOverlay();$("appShell").style.visibility="";showOnlySlot(appId);UI.mountedAppId=appId;await rememberAppForUser(appId);try{layoutReservedChrome();window.dispatchEvent(new Event("resize"))}catch(e){}rec("open_app","pass",{appId,reused:true,ready:!!UI.slots[appId].ready});return}
 if(UI.mountedAppId&&UI.mountedAppId!==appId){await persistLiveApp(UI.mountedAppId)}
 await mountAppFresh(appId);
}

async function importPkg(){const file=$("pkgfile").files&&$("pkgfile").files[0];if(!file)return rec("update_stage","fail","choose package");if(file.size>30e6)return rec("update_stage","rejected","too large");let man=null;const mf=$("pkgman").files&&$("pkgman").files[0];if(mf){try{man=JSON.parse(await mf.text())}catch{return rec("update_stage","rejected","manifest not JSON")}}return stage(await file.text(),file.name,$("pkgsha").value.trim().toLowerCase(),man)}
async function stage(t,name,exp,man){if(!/<html|<!doctype html/i.test(t.slice(0,4096))){rec("update_stage","rejected","not HTML");return false}
 const sha=await sha256(t);
 if(man){if(man.format!=="exp7-release/1"||!/^\d+\.\d+\.\d+$/.test(man.version||"")||!/^[0-9a-f]{64}$/.test(man.appSha256||"")){rec("update_stage","rejected","manifest invalid");return false}
  if(+man.minShellMajor>SHELL_MAJOR){rec("update_stage","rejected","needs newer shell");return false}if(exp&&exp!==man.appSha256){rec("update_stage","rejected","SHA mismatch");return false}exp=man.appSha256}
 if(exp&&exp!==sha){rec("update_stage","rejected","SHA-256 differs");return false}
 STAGED={sha,label:man?"Exp7 "+man.version:String(name).replace(/[^\w.-]/g,"_").slice(0,60),text:t};
 $("staged").textContent=`Staged ${STAGED.label} · ${sha.slice(0,16)}…`;rec("update_stage","pass",{sha256:sha});return true}
async function activateTrial(){if(!STAGED)return rec("update_activate","fail","stage first");const st=await pkgState();if(st.trial)return rec("update_activate","fail","finish current trial");
 await tx(["kv"],"readwrite",s=>{s("kv").put(STAGED.text,"global|pkgdata:"+STAGED.sha);s("kv").put({active:{kind:"imported",sha:STAGED.sha,label:STAGED.label},previous:st.active,trial:true},"global|pkg")});
 STAGED=null;$("staged").textContent="";rec("update_activate","pass",{trial:true});clearSlot("exp7");await mountAppFresh("exp7")}
async function keep(){const st=await pkgState();if(!st.trial)return;st.trial=false;await kvPut("global|pkg",st);rec("update_keep","pass",{})}
async function revert(reason){const st=await pkgState();if(!st.previous)return;await kvPut("global|pkg",{active:st.previous,previous:null,trial:false});rec("update_revert","pass",{reason:reason||"user"});if(UI.mountedAppId==="exp7"||(UI.slots.exp7&&UI.slots.exp7.mounted)){clearSlot("exp7");await mountAppFresh("exp7")} if(UI.mountedAppId==="budget"||(UI.slots.budget&&UI.slots.budget.mounted)){clearSlot("budget");await mountAppFresh("budget")}}
async function pkgStatus(){const st=await pkgState();const bsha=await sha256bytes(document.getElementById("apppkg").textContent.trim());M.builtinDigestOK=bsha===BUILTIN_SHA;
 const el=$("pkginfo");if(el)el.textContent=`Active: ${st.active.label}${st.trial?" (TRIAL)":""} · fingerprint ${M.builtinDigestOK?"ok":"MISMATCH"}`;return st}

wireCommon();wireChrome();
$("btnAdd").onclick=lock(addUser);$("btnShare").onclick=lock(shareInvite);
$("imp").onclick=lock(importPkg);$("act").onclick=lock(activateTrial);$("keep").onclick=lock(keep);$("rev").onclick=lock(async()=>{await revert("user");await pkgStatus()});

(async()=>{try{
 BUILTIN_SHA=await sha256bytes(document.getElementById("apppkg").textContent.trim());
 await dbOpen();let st=await pkgState();if(st.trial){await revert("trial was not kept");st=await pkgState()}
 setAvatar(null,null);await pkgStatus();await showProfiles();await renderUI();
 const appId=await resolveLastAppId();
 await openApp(appId,{auto:true});
 rec("startup","info",{shellVersion:SHELL_VERSION,builtinFingerprintOK:M.builtinDigestOK,lastAppId:appId,syncScope:"exp7 proposal-ops only; budget local-IDB only"})}
 catch(e){rec("startup","fail",String(e&&e.message||e));showAppsOverlay()}})();

/* launcher handoff (shell 1.6.2): same-window key only; never stored beyond session memory. One-shot — sign-out cannot silently reauth from a stale handoff. */
(function(){let used=false;const t0=Date.now();addEventListener("message",function h(e){if(used||UI.handoffConsumed||e.source!==window||!e.data||e.data.type!=="exp7-launcher-handoff")return;used=true;UI.handoffConsumed=true;removeEventListener("message",h);if(Date.now()-t0>15000)return;const k=typeof e.data.key==="string"?e.data.key:"";if(!k)return;S.token=k;rec("launcher_handoff","pass",{fromLauncher:true,release:String(e.data.release||"").slice(0,16)});validate()})})();

