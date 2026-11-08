/* Exp7 views on JRender: layout of the runtime.js view HTML into draw lists, node-id patches, per-view renderers on one Core */
/* Exp7 views on JRender v3 (Artist build jrender-exp7: classic + full_small.wasm + dejavu[+bold].jrf).
   Host-side only: a layout pass that turns the REAL atlas/runtime.js view HTML (parsed off-screen with DOMParser, never inserted)
   into JRender draw lists (rects, rounded rects, borders, text runs, wasm-wrapped text boxes / richText, hit regions, one scroll group per view),
   with keyed node ids so later renders become patches. All views share ONE wasm Core (one scene handle per view) and ONE
   JRender.GPUContext (one device, one shader module, one pipeline). No fallback drawing of any kind.
   v3: TextField (glue owns hidden textarea), DRAG+MOD events, richText/RS mixed-style wraps, autoSize, bold font. */
(function(){
'use strict';
const {DL,Patch,Core,Renderer,GPUContext,NF,GF,EV,MOD,RS,rgba,embedded,TextField}=window.JRender;
let CORE=null, FONT=0, FONTB=0, GC=null, BOOT=null, INITERR=null; const GID=7;
async function core(){ if(!CORE){ if(typeof WebAssembly!=='object') throw new Error('WebAssembly not available'); CORE=await Core.create(embedded('jr-wasm')); FONT=CORE.font(embedded('jr-font')); try{ FONTB=CORE.font(embedded('jr-font-bold')); }catch(e){ FONTB=FONT; } } return CORE; }
/* one shared GPUContext; its errors are JRender's own plain Errors with .code (no-webgpu | no-adapter | no-device | no-canvas-context) */
function boot(){ if(BOOT) return BOOT; BOOT=(async()=>{ await core(); GC=await GPUContext.create();
  GC.dev.addEventListener('uncapturederror',e=>{ INITERR='WebGPU error: '+e.error.message; console.warn(INITERR); }); GC.dev.lost.then(i=>{ INITERR='WebGPU device lost: '+i.message; }); })(); return BOOT; }
/* text measure (wasm, cached) */
const MC=new Map(); function tw(t,sz,f){ const font=f==null?FONT:f; const k=font+'|'+sz+'|'+t; let v=MC.get(k); if(v===undefined){ v=CORE.measure(font,sz,t); if(!(v>=0)) v=t.length*sz*0.55; MC.set(k,v); } return v; }
/* colours: [r,g,b,a] arrays */
const U=c=>rgba(c[0],c[1],c[2],c[3]==null?255:c[3]);
function col(s,dflt){ if(!s) return dflt; s=s.trim(); let m=s.match(/^#([0-9a-f]{3,8})$/i); if(m){ let h=m[1]; if(h.length<=4) h=h.split('').map(c=>c+c).join(''); return [0,2,4,6].map(i=>i<h.length?parseInt(h.substr(i,2),16):255); }
  m=s.match(/rgba?\(([^)]+)\)/); if(m){ const p=m[1].split(',').map(parseFloat); return [p[0],p[1],p[2],p.length>3?Math.round(p[3]*255):255]; } return dflt; }
function over(fg,bg){ const a=fg[3]/255; return [0,1,2].map(i=>Math.round(fg[i]*a+bg[i]*(1-a))).concat(255); }
function dim(fg,bg,o){ return [0,1,2].map(i=>Math.round(fg[i]*o+bg[i]*(1-o))).concat(255); }
function styleOf(el){ const o={}; (el.getAttribute&&el.getAttribute('style')||'').split(';').forEach(d=>{ const i=d.indexOf(':'); if(i>0) o[d.slice(0,i).trim()]=d.slice(i+1).trim(); }); return o; }
const BLOCK=/^(div|section|header|h1|h2|h3|p|table|tbody|thead|tr|ul|ol|li|details|summary|footer|nav)$/i;
const ROW=['ja-top','ja-calnav','ja-bar','ja-calsel','ja-alts','ja-brow','ja-prow','ja-switch','ja-legend','ja-step'];
const BOXED={'ja-joy':1,'ja-alt':1,'ja-sw':1,'ja-lg':1,'ja-chip':1,'ja-tog':1};
const has=(el,c)=>el.classList&&el.classList.contains(c);
/* what the real runtime.js click handler acts on (document click listener, runtime.js line 287) + proposition rows (demo-local select) */
function actOf(el){ if(el.nodeType!==1) return null; if(el.hasAttribute('disabled')) return null;
  if(el.hasAttribute('data-jv-act')) return 'jv'; /* demo host Plan controls (alternatives toggle / what-if / clear) */
  if(el.hasAttribute('data-ja-act')) return 'act:'+el.getAttribute('data-ja-act'); if(el.hasAttribute('data-alt')) return 'alt';
  if(has(el,'ja-day')&&el.hasAttribute('data-day')) return 'day'; if(has(el,'ja-item')&&el.hasAttribute('data-item')) return 'item';
  if(el.tagName==='TR'&&el.hasAttribute('data-dep-item')) return 'reqrow'; return null; }
const KEYATTR=['data-item','data-day','data-dep-item','data-row','data-alt','data-plan-item','data-step-joy','data-comp','data-tf'];
function fnv(s){ let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193)>>>0; } return h; }
/* layout: returns {nodes:[{key,id,flags,items,hit,el,act}], H, items, rows, glyphs} */
function layout(root,width,opt){ opt=opt||{}; const ctx={bg:[255,255,255,255],fg:[28,35,51,255],ac:[117,81,15,255]}; let items=0, rows=0, glyphs=0;
  const FS=13, LH=19, nodes=[], NM=new Map(), KEY=new WeakMap(), used=new Set([0,GID]);
  function key(el){ if(KEY.has(el)) return KEY.get(el); const p=el.parentNode&&el.parentNode.nodeType===1?key(el.parentNode):'';
    let k=null; for(const a of KEYATTR) if(el.hasAttribute&&el.hasAttribute(a)){ k=el.tagName+'['+a+'='+el.getAttribute(a)+']'; break; }
    if(el.hasAttribute&&el.hasAttribute('data-ja-act')) k=el.tagName+'['+el.getAttribute('data-ja-act')+'|'+(el.getAttribute('data-v')||'')+']';
    if(el.hasAttribute&&el.hasAttribute('data-jv-act')) k=el.tagName+'[jv='+el.getAttribute('data-jv-act')+']';
    if(!k){ let i=0, s=el; while((s=s.previousElementSibling)) if(s.tagName===el.tagName) i++; k=el.tagName+i; }
    let full=p+'/'+k; if(KEY._seen&&KEY._seen.has(full)){ let j=2; while(KEY._seen.has(full+'#'+j)) j++; full+='#'+j; } (KEY._seen=KEY._seen||new Set()).add(full); KEY.set(el,full); return full; }
  function nd(k,el,act){ let n=NM.get(k); if(n) return n; let id=fnv(k)||1; const reserved=b=>b===0x1||b===0x2||b===0x4||b===0x5; /* TextField / glue id bands — jump whole nibble, never scan 256M ids */
    while(used.has(id)||id===0xffffffff||reserved(id>>>28)){ if(id===0xffffffff||reserved(id>>>28)) id=((id&0xf0000000)+0x10000000)>>>0||1; else id=(id+1)>>>0||1; } used.add(id);
    n={key:k,id,flags:0,items:[],hit:null,el:el||null,act:act||null}; NM.set(k,n); nodes.push(n); return n; }
  const R=(n,x,y,w,h,r,c)=>{ if(w>0&&h>0) n.items.push(r>0?['rrect',x,y,w,h,Math.min(r,w/2,h/2),U(c)]:['rect',x,y,w,h,U(c)]); };
  const B=(n,x,y,w,h,r,c)=>{ if(w>0&&h>0) n.items.push(['border',x,y,w,h,Math.min(r,w/2,h/2),1,U(c)]); };
  const T=(n,x,base,sz,c,t,maxw)=>{ const s=String(t).replace(/\s+$/,''); if(!s) return; glyphs+=s.replace(/\s/g,'').length; n.items.push(['text',x,base,sz,U(c),s,maxw||0]); };
  function cstyle(n,c){ const st=styleOf(n), o=Object.assign({},c); if(st['--bg']) o.cbg=col(st['--bg'],c.bg); if(st['--fg']) o.fg=col(st['--fg'],c.fg); if(st['--ac']) o.ac=col(st['--ac'],c.ac);
    if(st.color) o.fg=col(st.color,o.fg); o.boxbg=st.background?col(st.background,null):null; o.border=st['border-color']?col(st['border-color'],null):null;
    if(has(n,'ja-flag')||has(n,'bad')||has(n,'ja-broken')) o.fg=[140,54,0,255]; if(n.tagName==='H2'){ o.fg=o.ac; o.size=15; }
    if(has(n,'ja-meta')||has(n,'ja-dn')||has(n,'ja-dow')||has(n,'ja-why')||has(n,'ja-on')||has(n,'ja-deps-note')||has(n,'ja-deps-sum')||has(n,'ja-dim')) o.fg=[73,85,106,255];
    if(has(n,'ja-dn')||has(n,'ja-dow')||has(n,'ja-on')||has(n,'ja-meta')||has(n,'ja-alttag')||has(n,'ja-dl')) o.size=11; if(has(n,'ja-deps-note')||has(n,'ja-deps-sum')) o.size=10.5; if(n.tagName==='TH'){ o.size=11; o.fg=[73,85,106,255]; }
    if(/^(B|STRONG)$/i.test(n.tagName)||has(n,'ja-b')) o.bold=true; if(/^(I|EM)$/i.test(n.tagName)||has(n,'ja-i')) o.italic=true;
    if(n.hasAttribute('disabled')){o.fg=[73,85,106,255];o.boxbg=[244,246,250,255];} o.size=o.size||c.size||FS; return o; }
  function atoms(el,c,out){ el.childNodes.forEach(n=>{ if(n.nodeType===3){ const t=n.textContent.replace(/\s+/g,' '); if(t) t.split(/(?<= )/).forEach(w=>w&&out.push({t:w,fg:c.fg,size:c.size,bold:!!c.bold,italic:!!c.italic})); return; }
      if(n.nodeType!==1||/^(script|style)$/i.test(n.tagName)) return; const c2=cstyle(n,c); const L=out[out.length-1];
      if(L&&!L.box&&!L.tf&&!/ $/.test(L.t)&&n.textContent.trim()) out[out.length-1]=Object.assign({},L,{t:L.t+' '}); /* element boundary = word gap */
      /* TextField host boxes: empty .ja-tf must become layout nodes with hit+tf (ROW flow via atoms previously skipped them → 0 fields) */
      if(has(n,'ja-tf')){ out.push({t:'',el:n,tf:n.getAttribute('data-tf')||'f',ph:n.getAttribute('data-ph')||'',fg:c2.fg,size:c2.size||FS,box:true,tfBox:true,
        bg:c2.boxbg||[255,255,255,255],border:c2.border||[138,150,170,255],on:false,ac:c.ac,bold:false,italic:false}); return; }
      if(n.tagName==='BUTTON'||Object.keys(BOXED).some(k=>has(n,k))){ const t=n.textContent.replace(/\s+/g,' ').trim(); if(has(n,'ja-item')) items++;
        out.push({t,el:n,fg:c2.fg,size:c2.size,box:true,bg:c2.boxbg||over([36,88,166,10],c.bg),border:c2.border||[138,150,170,255],on:has(n,'on')||n.getAttribute('data-sm')==='selected',ac:c.ac,bold:!!c2.bold,italic:!!c2.italic}); return; }
      if(has(n,'ja-item')) items++; atoms(n,c2,out); }); return out; }
  /* flow atoms into lines inside [x, x+w]; text goes to the owner's text node; boxed atoms get their own fill (hit) / border / text nodes
     uniform style → DL.textBox; mixed style (bold/italic/color) without boxes → one DL.richText (v3, no JS wrap) */
  const TB=[];
  function plain(A){ if(!A.length||A.some(a=>a.box)) return false; return A.every(a=>a.fg.join()===A[0].fg.join()&&(a.size||FS)===(A[0].size||FS)&&!a.bold&&!a.italic&&!A[0].bold&&!A[0].italic); }
  function mixed(A){ return A.length&&!A.some(a=>a.box)&&(A.some(a=>a.bold||a.italic||a.fg.join()!==A[0].fg.join()||(a.size||FS)!==(A[0].size||FS))); }
  function flow(A,x,y,w,c,column,owner){
    if(!column&&plain(A)){ const str=A.map(a=>a.t).join('').replace(/\s+/g,' ').trim(); if(!str) return 0; const sz=A[0].size||FS, lh=Math.max(LH,sz*1.45);
      const wr=CORE.wrap(FONT,sz,str,w,{lineHeight:lh}); const tn=nd(key(owner)+':tx',owner); glyphs+=str.replace(/\s/g,'').length;
      tn.items.push(['tbox',x,y+lh*0.72,sz,U(A[0].fg),str,w,lh]); TB.push({key:tn.key,text:str,size:sz,maxw:w,lh,count:wr.count,height:wr.height,kind:'tbox'}); return wr.height; }
    if(!column&&mixed(A)){ const runs=[]; A.forEach(a=>{ const t=String(a.t); if(!t) return; const sz=a.size||FS; runs.push({text:t,size:sz,color:U(a.fg),bold:!!a.bold,italic:!!a.italic}); glyphs+=t.replace(/\s/g,'').length; });
      /* richText lineHeight is a FACTOR (default 1.25), unlike textBox/wrap which take absolute px — passing sz*1.45 made each line ~247px tall */
      if(!runs.length) return 0; const sz0=runs[0].size, lhf=1.45;
      const lay=CORE.richLayout(runs,{maxw:w,lineHeight:lhf,font:FONT,boldFont:FONTB}); const tn=nd(key(owner)+':rtx',owner);
      tn.items.push(['rich',x,y,runs,w,lhf]); TB.push({key:tn.key,text:runs.map(r=>r.text).join(''),size:sz0,maxw:w,lh:lhf,count:lay.count,height:lay.height,kind:'rich'}); return lay.height; }
    let cx=x, cy=y, lh=0; const nl=()=>{ cx=x; cy+=lh||LH; lh=0; }; const tn=nd(key(owner)+':tx',owner);
    A.forEach(a=>{ const sz=a.size||FS; const full=tw(a.t,sz,a.bold?FONTB:FONT);
      if(a.box){ if(a.tfBox){ const bw=Math.min(Math.max(180,w*0.55),Math.max(120,w-(cx-x))), bh=28; if(column&&cx>x) nl(); else if(cx>x&&cx+bw>x+w) nl();
        const k=key(a.el), fn=nd(k,a.el,null), bn=fn; R(fn,cx,cy,bw,bh,4,a.bg); B(bn,cx,cy,bw,bh,4,a.border);
        /* JS-side hit+tf only (no NF.HIT) so TextField's own frame receives clicks; coords drive attachFormFields */
        fn.hit=[cx,cy,bw,bh]; fn.tf=a.tf; cx+=bw+6; lh=Math.max(lh,bh); return; }
        const bw=Math.min(full+12,w), bh=sz+9; if(column&&cx>x) nl(); else if(cx>x&&cx+bw>x+w) nl();
        const k=key(a.el), act=actOf(a.el), fn=nd(k,a.el,act), bn=fn, xn=fn; /* one node: fill (item 0), border, text */
        R(fn,cx,cy+1,bw,bh-2,5,a.bg); if(act){ fn.flags=NF.HIT; fn.hit=[cx,cy+1,bw,bh-2]; fn.base=U(a.bg); fn.hov=U(over([36,88,166,18],a.bg)); }
        B(bn,cx,cy+1,bw,bh-2,5,a.on?a.ac:a.border); T(xn,cx+6,cy+1+(bh-2)/2+sz*0.36,sz,a.fg,a.t,full+12>w?w-12:0); cx+=bw+6; lh=Math.max(lh,bh); return; }
      const bh=Math.max(LH,sz*1.45); if(column&&cx>x) nl(); else if(cx>x&&cx+full>x+w) nl(); if(cx===x&&a.t===' ') return;
      T(tn,cx,cy+bh*0.72,sz,a.fg,a.t,full>x+w-cx?x+w-cx:0); cx+=Math.min(full,x+w-cx); lh=Math.max(lh,bh); });
    return (cx>x||lh?cy+(lh||0):cy)-y; }
  function block(el,x,y,w,c){ const c2=cstyle(el,c); let pad=0, bgc=null, brd=null, rad=6, minH=0;
    if(has(el,'ja-comp')){ pad=11; bgc=c2.cbg||[255,255,255,255]; brd=[138,150,170,255]; rad=10; }
    else if(has(el,'ja-day')){ pad=3; brd=c2.border||[138,150,170,255]; bgc=c2.boxbg||c.bg; minH=64;
      if(has(el,'ja-today')&&!has(el,'ja-sel')) brd=c2.ac;
      /* selection / drag-range: blue wash + ring (CSS outline is ignored by layout) */
      if(has(el,'ja-sel')||has(el,'ja-drag')){ bgc=over([150,180,230,55], bgc||c.bg); brd=[36,88,166,255]; }
      if(has(el,'ja-anchor')){ brd=[104,65,166,255]; }
      if(has(el,'ja-span')&&!has(el,'ja-sel')&&!has(el,'ja-drag')){ bgc=over([150,180,230,35], bgc||c.bg); }
    }
    else if(has(el,'ja-tf')){ pad=4; brd=[138,150,170,255]; bgc=c2.boxbg||[255,255,255,255]; minH=28; rad=4; }
    else if(has(el,'ja-brow')||has(el,'ja-prow')||has(el,'ja-section')||has(el,'ja-legend')||has(el,'ja-asof')||has(el,'ja-range')||has(el,'ja-detail')||has(el,'ja-rails')){ pad=5; brd=[138,150,170,255]; bgc=c2.boxbg||c.bg; rows++; }
    else if(has(el,'ja-deps')){ pad=8; brd=[138,150,170,255]; bgc=c.bg; rad=8; }
    else if(has(el,'ja-item')){ pad=8; brd=[138,150,170,255]; bgc=c2.boxbg||c.bg; rad=8; items++; }
    if(c2.boxbg&&!bgc) bgc=c2.boxbg; const inner=Object.assign({},c2,{bg:bgc||c.bg}); const act=actOf(el);
    const k=key(el), fn=(bgc||brd||act||has(el,'ja-tf'))?nd(k,el,act):null, bn=fn; let h; /* fill (item 0) + border in one node */
    if(has(el,'ja-cal')) h=grid(el,x,y,w,inner,7);
    else if(el.tagName==='TABLE') h=table(el,x,y,w,inner);
    else if(has(el,'ja-tf')){ h=Math.max(28,minH); }
    else if(ROW.some(q=>has(el,q))) h=flow(atoms(el,inner,[]),x+pad,y+pad,w-2*pad,inner,false,el)+2*pad;
    else h=children(el,x+pad,y+pad,w-2*pad,inner,has(el,'ja-day'))+2*pad;
    h=Math.max(h,minH); let fill=bgc||c.bg; if(fn){ R(fn,x,y,w,h,rad,fill); if(act){ fn.flags=NF.HIT|(act==='day'?NF.DRAG:0); fn.hit=[x,y,w,h]; fn.base=U(fill);
        /* day hover: stronger blue wash so pointer feedback is obvious on risk fills */
        fn.hov=U(over(act==='day'?[150,180,230,40]:[36,88,166,14],fill)); }
      else if(has(el,'ja-tf')){ fn.hit=[x,y,w,h]; fn.tf=el.getAttribute('data-tf'); } } if(bn&&brd) B(bn,x,y,w,h,rad,brd);
    /* inset rings for selection + anchor (outline/box-shadow never reach the canvas) */
    if(fn&&has(el,'ja-day')&&(has(el,'ja-sel')||has(el,'ja-drag'))) B(fn,x+2,y+2,w-4,h-4,Math.max(0,rad-2),[36,88,166,255]);
    if(fn&&has(el,'ja-day')&&has(el,'ja-anchor')) B(fn,x+4,y+4,w-8,h-8,Math.max(0,rad-3),[104,65,166,255]);
    if(fn&&has(el,'ja-day')&&has(el,'ja-span')){ /* span bar along the bottom edge */ R(fn,x+4,y+h-6,w-8,3,1,[36,88,166,220]); }
    return h; }
  function children(el,x,y,w,c,column){ let cy=y, run=[]; const gap=has(el,'ja-body')||el.id==='app'||has(el,'ja-blist')||has(el,'ja-plan')?7:has(el,'ja-comp')?4:2;
    const flush=()=>{ if(run.length){ const A=[]; run.forEach(n=>{ if(n.nodeType===3){ const t=n.textContent.replace(/\s+/g,' '); if(t.trim()) t.split(/(?<= )/).forEach(s=>A.push({t:s,fg:c.fg,size:c.size,bold:!!c.bold,italic:!!c.italic})); } else atoms({childNodes:[n]},c,A); });
        if(A.length){ cy+=flow(A,x,cy,w,c,column,el)+gap; } run=[]; } };
    el.childNodes.forEach(n=>{ if(n.nodeType===1&&/^(script|style)$/i.test(n.tagName)) return; if(n.nodeType===1&&BLOCK.test(n.tagName)&&!has(n,'ja-chip')){ flush(); cy+=block(n,x,cy,w,c)+gap; } else if(n.nodeType===3||n.nodeType===1) run.push(n); });
    flush(); return Math.max(0,cy-y-gap); }
  /* Month grids: every day/pad cell shares one fixed height so populated and empty days stay equal.
     Item text inside a day shrinks (down to 6px) to fit; chips are never dropped silently. */
  function grid(el,x,y,w,c,n){ const gap=4, cw=(w-gap*(n-1))/n; let cy=y, i=0, rowH=0;
    const cells=[...el.children]; const fixedDay=cells.some(ch=>has(ch,'ja-day'));
    const DAY_H=fixedDay?78:0;
    cells.forEach((ch,k)=>{ const cx=x+(i%n)*(cw+gap); let h;
      if(has(ch,'ja-dow')) h=flow(atoms(ch,cstyle(ch,c),[]),cx+cw/2-tw(ch.textContent,11)/2,cy,cw,c,false,ch);
      else if(has(ch,'ja-pad')) h=DAY_H||0;
      else if(DAY_H&&has(ch,'ja-day')) h=dayCell(ch,cx,cy,cw,DAY_H,c);
      else h=block(ch,cx,cy,cw,c);
      rowH=Math.max(rowH,h); i++; if(i%n===0||k===cells.length-1){ cy+=rowH+gap; rowH=0; } });
    return cy-y-gap; }
  function dayCell(el,x,y,w,H,c){ const c2=cstyle(el,c); const pad=3; let bgc=c2.boxbg||c.bg, brd=c2.border||[138,150,170,255], rad=6;
    if(has(el,'ja-today')&&!has(el,'ja-sel')) brd=c2.ac;
    if(has(el,'ja-sel')||has(el,'ja-drag')){ bgc=over([150,180,230,55], bgc||c.bg); brd=[36,88,166,255]; }
    if(has(el,'ja-anchor')){ brd=[104,65,166,255]; }
    if(has(el,'ja-span')&&!has(el,'ja-sel')&&!has(el,'ja-drag')){ bgc=over([150,180,230,35], bgc||c.bg); }
    const inner=Object.assign({},c2,{bg:bgc||c.bg}); const act=actOf(el); const k=key(el);
    const fn=nd(k,el,act); const fill=bgc||c.bg;
    R(fn,x,y,w,H,rad,fill); fn.flags=NF.HIT|NF.DRAG; fn.hit=[x,y,w,H]; fn.base=U(fill);
    fn.hov=U(over([150,180,230,40],fill));
    if(has(el,'ja-sel')||has(el,'ja-drag')) B(fn,x+2,y+2,w-4,H-4,Math.max(0,rad-2),[36,88,166,255]);
    if(has(el,'ja-anchor')) B(fn,x+4,y+4,w-8,H-8,Math.max(0,rad-3),[104,65,166,255]);
    if(has(el,'ja-span')) R(fn,x+4,y+H-6,w-8,3,1,[36,88,166,220]);
    /* Full labels always (selected/idle/drag/hover). Scale+wrap to fixed cell — never ellipsis/maxw-clip/substring. */
    const ix=x+pad, iy=y+pad, iw=Math.max(8,w-2*pad), ih=Math.max(8,H-2*pad);
    const entries=[];
    el.childNodes.forEach(n=>{
      if(n.nodeType===3){ const t=n.textContent.replace(/\s+/g,' ').trim(); if(t) entries.push({t,fg:inner.fg||[28,35,51,255],bold:false,dn:0}); }
      else if(n.nodeType===1){
        if(has(n,'ja-dn')){ const t=(n.textContent||'').trim(); if(t) entries.push({t,fg:inner.fg||[28,35,51,255],bold:1,dn:1}); }
        else if(has(n,'ja-dl')){ const t=(n.textContent||'').trim(); if(t) entries.push({t,fg:[73,85,106,255],bold:0,dn:0}); }
        else if(has(n,'ja-chip')||has(n,'ja-item')){ const t=(n.textContent||'').replace(/\s+/g,' ').trim(); if(t) entries.push({t,fg:cstyle(n,inner).fg||inner.fg||[28,35,51,255],bold:0,dn:0,chip:1}); }
        else if(n.tagName==='SPAN'||n.tagName==='I'||n.tagName==='B'){ const t=(n.textContent||'').replace(/\s+/g,' ').trim(); if(t) entries.push({t,fg:cstyle(n,inner).fg||[73,85,106,255],bold:!!has(n,'ja-dn'),dn:0}); }
      }
    });
    const wordOk=(sz,t)=>{ const words=String(t).split(/\s+/).filter(Boolean); if(!words.length) return true;
      for(let i=0;i<words.length;i++){ if(tw(words[i],sz)>(iw+0.5)) return false; } return true; };
    const blockH=(sz)=>{ let h=0; for(let i=0;i<entries.length;i++){ const e=entries[i], s=sz; const lh=Math.max(8,s*1.35);
      if(!wordOk(s,e.t)) return Infinity;
      const wr=CORE.wrap(FONT,s,e.t,iw,{lineHeight:lh,ellipsis:false}); h+=wr.height; }
      return h; };
    let size=11;
    for(; size>0.75; size-=0.25){ if(blockH(size)<=ih+0.5) break; }
    if(blockH(size)>ih+0.5){ /* still too tall: keep shrinking */
      for(; size>0.35; size-=0.1){ if(blockH(size)<=ih+0.5) break; }
    }
    let cy=iy;
    entries.forEach((e,i)=>{ const s=size; const lh=Math.max(8,s*1.35);
      const wr=CORE.wrap(FONT,s,e.t,iw,{lineHeight:lh,ellipsis:false});
      const tn=nd(k+':daytx:'+i,el); glyphs+=e.t.replace(/\s/g,'').length;
      /* textBox wraps; emit path does not pass ellipsis — full source label reaches glyphs */
      tn.items.push(['tbox',ix,cy+lh*0.72,s,U(e.fg),e.t,iw,lh]);
      TB.push({key:tn.key,text:e.t,size:s,maxw:iw,lh,count:wr.count,height:wr.height,kind:'tbox',day:1});
      cy+=wr.height; });
    return H; }
  function flowMeasure(A,w,c){ if(!A.length) return 0; let h=0; A.forEach(a=>{ const sz=a.size||c.size||12; h+=Math.max(LH,sz*1.45); }); return h; }

  function table(el,x,y,w,c){ const trs=[...el.querySelectorAll('tr')]; if(!trs.length) return 0; const nc=Math.max(...trs.map(r=>r.children.length)), P=12;
    const mn=new Array(nc).fill(P+8), pf=new Array(nc).fill(P+8);
    trs.forEach(r=>{ const cs=cstyle(r,c); [...r.children].forEach((td,i)=>{ if(+td.getAttribute('colspan')>1) return; const sz=cstyle(td,cs).size||FS, t=td.textContent.replace(/\s+/g,' ').trim();
      mn[i]=Math.max(mn[i],Math.min(160,Math.max(0,...t.split(' ').map(q=>tw(q,sz))))+P); pf[i]=Math.max(pf[i],tw(t,sz)+P); }); });
    const smn=mn.reduce((a,b)=>a+b,0), spf=pf.reduce((a,b)=>a+b,0); let cw;
    if(spf<=w) cw=pf.map(v=>v+(w-spf)*v/spf); else if(smn>=w) cw=mn.map(v=>v*w/smn); else cw=mn.map((v,i)=>v+(w-smn)*(pf[i]-v)/(spf-smn));
    let cy=y; trs.forEach(r=>{ let cx=x, rh=0; const isH=!!r.querySelector('th'); const rc=cstyle(r,c); if(r.hasAttribute('data-blocked')) rc.bg=over([239,68,68,26],c.bg);
      if(r.hasAttribute('data-risk')){ const rk=r.getAttribute('data-risk'); if(rk==='C') rc.bg=over([213,94,0,70],c.bg); else if(rk==='M') rc.bg=over([230,159,0,55],c.bg); else if(rk==='L') rc.bg=over([0,158,115,35],c.bg); }
      const k=key(r), act=actOf(r), fn=nd(k,r,act), ln=fn; /* row fill (item 0) + rule */
      [...r.children].forEach((td,i)=>{ const span=Math.max(1,+td.getAttribute('colspan')||1); let cwd=0; for(let j=i;j<Math.min(nc,i+span);j++) cwd+=cw[j]; if(i>=nc) return;
        const h=flow(atoms(td,cstyle(td,rc),[]),cx+P/2,cy+2,cwd-P,rc,false,td)+4; rh=Math.max(rh,h); cx+=cwd; });
      R(fn,x,cy,w,rh,0,rc.bg); if(act){ fn.flags=NF.HIT; fn.hit=[x,cy,w,rh]; fn.base=U(rc.bg); fn.hov=U(over([36,88,166,14],rc.bg)); }
      R(ln,x,cy+rh-1,w,1,0,isH?c.ac:over([36,88,166,32],c.bg)); cy+=rh; rows++; });
    return cy-y; }
  const bg=nd('root:bg',null); const H=Math.ceil(children(root,16,16,width-32,{bg:ctx.bg,fg:ctx.fg,ac:ctx.ac,size:FS},false)+32); /* transparent outer backdrop: retain root node/IDs, emit no fill */
  const miss=[...new Set([...root.textContent].filter(ch=>ch.codePointAt(0)>=32&&!/\s/.test(ch)&&!CORE.hasGlyph(FONT,ch.codePointAt(0))))];
  return {nodes,H:Math.max(40,H),items,rows,glyphs,hits:nodes.filter(n=>n.flags&NF.HIT).length,tboxes:TB,notdef:miss}; }
/* emit one node into a DL / Patch builder */
function items(b,n){ for(const it of n.items){ const k=it[0];
    if(k==='path') b.path(it[1],it[2]); else if(k==='rect') b.rect(it[1],it[2],it[3],it[4],it[5]); else if(k==='rrect') b.rrect(it[1],it[2],it[3],it[4],it[5],it[6]);
    else if(k==='border') b.border(it[1],it[2],it[3],it[4],it[5],it[6],it[7]);
    else if(k==='text') b.text(it[1],it[2],it[3],it[4],FONT,it[5],it[6]?{maxw:it[6],ellipsis:true}:{});
    else if(k==='tbox') b.textBox(it[1],it[2],it[3],it[4],FONT,it[5],it[6],{lineHeight:it[7]});
    else if(k==='rich') b.richText(it[1],it[2],it[3],{maxw:it[4],lineHeight:it[5],font:FONT,boldFont:FONTB}); }
  if(n.hit&&(n.flags&NF.HIT)) b.hit(n.hit[0],n.hit[1],n.hit[2],n.hit[3]); }
const emit=(b,n)=>{ b.node(n.id,n.flags); items(b,n); };
const sig=n=>n.flags+'|'+JSON.stringify(n.items)+'|'+(n.hit||'');
function fullDL(L,W,VH){ const d=new DL(); d.group(GID,GF.SCROLL_Y,0,0,W,VH,W,L.H); L.nodes.forEach(n=>emit(d,n)); d.end(); return d; }
/* patch from old layout to new: keep nodes whose relative order is unchanged (LIS), replace changed ones, remove/insert the rest */
function diff(A,Bn,W,VH){ const old=new Map(A.nodes.map((n,i)=>[n.id,{n,i}])); const seq=[]; Bn.nodes.forEach((n,j)=>{ const o=old.get(n.id); if(o) seq.push([j,o.i]); });
  /* LIS over old positions */ const tails=[], prev=new Array(seq.length), ti=[]; seq.forEach((s,k)=>{ let lo=0, hi=tails.length; while(lo<hi){ const m=(lo+hi)>>1; if(tails[m]<s[1]) lo=m+1; else hi=m; } tails[lo]=s[1]; ti[lo]=k; prev[k]=lo?ti[lo-1]:-1; });
  const keep=new Set(); for(let k=ti[tails.length-1]; k!=null&&k>=0; k=prev[k]) keep.add(Bn.nodes[seq[k][0]].id);
  const p=new Patch(); let ops={replace:0,insert:0,remove:0,flags:0,grect:0};
  A.nodes.forEach(n=>{ if(!keep.has(n.id)){ p.remove(n.id); ops.remove++; } });
  if(A.H!==Bn.H||A.W!==W||A.VH!==VH){ p.grect(GID,0,0,W,VH,W,Bn.H); ops.grect++; }
  for(let j=Bn.nodes.length-1, next=0; j>=0; j--){ const n=Bn.nodes[j];
    if(keep.has(n.id)){ const o=old.get(n.id).n; const ch=JSON.stringify(o.items)+'|'+(o.hit||'')!==JSON.stringify(n.items)+'|'+(n.hit||''); if(ch){ if(o.flags!==n.flags){ p.replace(n.id,q=>items(q,n),n.flags); ops.flags++; } else p.replace(n.id,q=>items(q,n)); ops.replace++; } else if(o.flags!==n.flags){ p.flags(n.id,n.flags); ops.flags++; } /* REPLACE_F when flags change too */ next=n.id; }
    else { if(next) p.insert(next,q=>emit(q,n)); else p.append(GID,q=>emit(q,n)); ops.insert++; next=n.id; } }
  ops.n=ops.replace+ops.insert+ops.remove+ops.flags+ops.grect; return {p,ops}; }
/* one view = one canvas + one Renderer (shared Core/device) + one DL scene handle */
const MAXVH=620;
function modsOf(e){ const m=e&&e.mods||0; return {shift:!!(m&MOD.SHIFT),ctrl:!!(m&MOD.CTRL),alt:!!(m&MOD.ALT),meta:!!(m&MOD.META),raw:m}; }
function View(){ this.r=null; this.s=null; this.L=null; this.c=null; this.loads=0; this.patches=0; this.patchOps=null; this.hov=null; this.onact=null; this.ondrag=null; this.fields=[]; this._auto=null; }
View.prototype.clearFields=function(){ (this.fields||[]).slice().forEach(f=>{ try{ f.remove(); }catch(e){} }); this.fields=[]; };
View.prototype.show=async function(canvas,root,W,opt){ await boot(); if(INITERR) throw new Error(INITERR); opt=opt||{};
  this.clearFields();
  const t0=performance.now(), L=layout(root,W), VH=Math.min(L.H,MAXVH); L.W=W; L.VH=VH;
  if(this.c!==canvas){ if(this.s) this.s.free(); this.r=null; this.s=null; this.L=null; this.c=canvas; if(this._auto){ try{ this._auto(); }catch(e){} this._auto=null; } }
  if(!this.r){ this.r=await Renderer.init({canvas,core:CORE,context:GC,clear:[0,0,0,0],readback:true}); }
  /* actual CSS size = layout size (no 560 clamp, no maxWidth shrink). Host ResizeObserver + V.w drives re-layout; backing = css×dpr via resize(). */
  canvas.style.width=W+'px'; canvas.style.height=VH+'px'; canvas.style.maxWidth=''; canvas.style.display='block';
  const dpr=Math.min(devicePixelRatio||1,3);
  let mode;
  if(!this.s||opt.rebuild){ if(this.s){ this.s.free(); } this.r.resize(W,VH,dpr); this.s=this.r.createScene(W,VH); this.s.dragThreshold(4); this.s.load(fullDL(L,W,VH)); this.r.layout([{scene:this.s,x:0,y:0,w:W,h:VH}]); this.r.attach(); /* idempotent; cursor and touch-action handled by JRender */ this.wire(); this.loads++; mode='load'; this.patchOps=null; }
  else { if(this.hov){ const hp=new Patch(); hp.colorItem(this.hov.id,0,this.hov.base); this.s.patch(hp); } /* restore the hovered fill so the diff starts from the drawn base state */ const keepScroll=this.s.scrollPos(GID); const {p,ops}=diff(this.L,L,W,VH); if(this.L.VH!==VH||this.L.W!==W){ this.r.resize(W,VH,dpr); this.r.layout([{scene:this.s,x:0,y:0,w:W,h:VH}]); }
    if(ops.n) this.s.patch(p); this.s.scroll(GID,keepScroll[0],keepScroll[1]); this.patches++; this.patchOps=ops; mode='patch'; }
  const hid=this.hov&&this.hov.id; this.hov=null; this.L=L; this.byId=new Map(L.nodes.map(n=>[n.id,n])); const hn=hid&&this.byId.get(hid); if(hn&&hn.hov!=null) this.setHover(hn); /* pointer still over the same id: keep its hover */ this.r.draw(); this.ms=performance.now()-t0;
  return {ms:this.ms,mode,px:[canvas.width,canvas.height],L,VH,ops:this.patchOps,handle:this.s.h}; };
View.prototype.wire=function(){ const s=this.s; if(!s) return; s.dragThreshold(4);
  s.onevent=e=>{ const n=e.id!=null&&this.byId&&this.byId.get(e.id); if(!n) return;
    if(e.kind===EV.ENTER&&n.hov!=null){ this.setHover(n); } else if(e.kind===EV.LEAVE&&this.hov===n){ this.setHover(null); }
    else if(e.kind===EV.CLICK&&n.act&&this.onact){ this.onact(n.el,n.act,n,modsOf(e),e); }
    else if((e.kind===EV.DRAGSTART||e.kind===EV.DRAG||e.kind===EV.DRAGEND)&&this.ondrag){ this.ondrag(e.kind===EV.DRAGSTART?'start':e.kind===EV.DRAGEND?'end':'move',n,modsOf(e),e); }
  }; };
View.prototype.setHover=function(n){ const p=new Patch(); if(this.hov&&this.byId.get(this.hov.id)===this.hov) p.colorItem(this.hov.id,0,this.hov.base); if(n) p.colorItem(n.id,0,n.hov); /* item 0 = the fill; border/text keep their colours */ this.hov=n; this.s.patch(p); this.r.draw(); };
View.prototype.textField=function(o){ if(!this.r||!this.s) return null; const f=this.r.textField(this.s,o); this.fields.push(f); return f; };
/* test helpers: pixels and hit ids of the live (patched) scene vs a fresh full load of the same layout */
View.prototype.verify=async function(){ const W=this.L.W, VH=this.L.VH, sp=this.s.scrollPos(GID), hv=this.hov; if(hv) this.setHover(null);
  const a=await this.r.read(); const cv=document.createElement('canvas'); cv.style.cssText='position:fixed;left:-9999px;top:0;width:'+W+'px;height:'+VH+'px'; document.body.appendChild(cv);
  const r2=await Renderer.init({canvas:cv,core:CORE,context:GC,clear:[0,0,0,0],readback:true}); r2.resize(W,VH,this.r.dpr); const s2=r2.createScene(W,VH); s2.load(fullDL(this.L,W,VH)); r2.layout([{scene:s2,x:0,y:0,w:W,h:VH}]); s2.scroll(GID,sp[0],sp[1]);
  const b=await r2.read(); let diffPx=0, ink=0; for(let i=0;i<a.length;i+=4){ if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]) diffPx++; if(a[i]>40||a[i+1]>40||a[i+2]>40) ink++; }
  let hitDiff=0, hits=0; this.hd=[]; for(let y=2;y<VH;y+=7) for(let x=2;x<W;x+=9){ const h1=this.s.hit(x,y), h2=s2.hit(x,y); if(h1!==h2){ hitDiff++; if(hitDiff<6) (this.hd=this.hd||[]).push([x,y,h1,h2]); } if(h1!=null) hits++; }
  if(window.JR_KEEP_VERIFY){ window.JR_VA=a; window.JR_VB=b; window.JR_VW=[cv.width,cv.height]; } s2.free(); r2.destroy(); cv.remove(); if(hv) this.setHover(hv); return {diffPx,ink,px:a.length/4,hitDiff,hits,scroll:sp,hitSamples:this.hd.map(([x,y,h1,h2])=>{ const f=h=>{ const n=h!=null&&this.byId.get(h); return h==null?null:(n?n.key:'id '+h+' (not in layout)'); }; return [x,y,f(h1),f(h2)]; })}; };
/* test hooks (drive.py) */
async function selfTest(){ await boot(); const out={};
  /* stale hit: the 6 cases of Ash's t2.mjs, patched scene vs fresh load */
  const mk=(f,h)=>{ const d=new DL(); d.node(5,f); d.rect(10,10,50,20,rgba(255,0,0)); if(h) d.hit(10,10,50,20); return d; }; out.stale=[];
  for(const [nm,f,fl] of [['flags0',p=>p.flags(5,0),0],['replaceNoHit+flags0',p=>{ p.replace(5,q=>q.rect(10,10,50,20,rgba(255,0,0))); p.flags(5,0); },0],['replaceNoHit',p=>p.replace(5,q=>q.rect(10,10,50,20,rgba(255,0,0))),NF.HIT],['replaceF0',p=>p.replace(5,q=>q.rect(10,10,50,20,rgba(255,0,0)),0),0]])
    for(const h of [true,false]){ const s1=CORE.createScene(100,40,1); s1.load(mk(NF.HIT,h)); const p=new Patch(); f(p); s1.patch(p); const s2=CORE.createScene(100,40,1); s2.load(mk(fl,false)); out.stale.push({case:nm,explicitHit:h,patched:s1.hit(20,15),fresh:s2.hit(20,15)}); s1.free(); s2.free(); }
  /* notdef: a character outside the font coverage draws a box (ink) and measures 0.6 em */
  const ch='\u7F8E', sz=20; out.notdef={ch,cp:ch.codePointAt(0),has:CORE.hasGlyph(FONT,ch.codePointAt(0)),coverage:CORE.coverage(FONT).length,adv:CORE.measure(FONT,sz,ch),em06:0.6*sz};
  const cv=document.createElement('canvas'); cv.style.cssText='position:fixed;left:-9999px;top:0;width:60px;height:40px'; document.body.appendChild(cv);
  const r=await Renderer.init({canvas:cv,core:CORE,context:GC,clear:[0,0,0,1],readback:true}); r.resize(60,40,1); const s=r.createScene(60,40); r.layout([{scene:s,x:0,y:0,w:60,h:40}]);
  const ink=async t=>{ const d=new DL(); d.node(1,0); d.text(10,28,sz,rgba(255,255,255),FONT,t); s.load(d); r.draw(); const a=await r.read(); let n=0; for(let i=0;i<a.length;i+=4) if(a[i]>60) n++; return n; };
  out.notdef.inkMissing=await ink(ch); out.notdef.inkSpace=await ink(' '); s.free(); r.destroy(); cv.remove();
  /* wrapped text: a paragraph laid out narrow becomes one DL.textBox; its line count is core.wrap's, and the drawn ink has that many line bands */
  const d0=new DOMParser().parseFromString('<div id="app"><p>Getting there by night train and bus, then hotel check-in, museum visit and a seafood dinner before packing bags.</p></div>','text/html').getElementById('app');
  const L=layout(d0,220), tb=L.tboxes[0], cw=CORE.wrap(FONT,tb.size,tb.text,tb.maxw,{lineHeight:tb.lh});
  const cv2=document.createElement('canvas'); cv2.style.cssText='position:fixed;left:-9999px;top:0;width:220px;height:'+L.H+'px'; document.body.appendChild(cv2);
  const r2=await Renderer.init({canvas:cv2,core:CORE,context:GC,clear:[0,0,0,1],readback:true}); r2.resize(220,L.H,1); const s2=r2.createScene(220,L.H); s2.load(fullDL(L,220,L.H)); r2.layout([{scene:s2,x:0,y:0,w:220,h:L.H}]); r2.draw();
  const px=await r2.read(), Wd=cv2.width; let bands=0, inb=false; for(let y=0;y<cv2.height;y++){ let k=0; for(let x=0;x<Wd;x++){ if(px[(y*Wd+x)*4]>120) k++; } const on=k>0; if(on&&!inb) bands++; inb=on; }
  s2.free(); r2.destroy(); cv2.remove();
  out.wrap={boxes:L.tboxes.length,count:tb.count,coreWrap:cw.count,height:tb.height,coreHeight:cw.height,lines:cw.lines.map(l=>l.text),inkBands:bands,H:L.H};
  /* mixed-style richText paragraph */
  const d1=new DOMParser().parseFromString('<div id="app"><p>Plan risk: <b>CRITICAL</b> days and <i>MODERATE</i> slack use the same legend.</p></div>','text/html').getElementById('app');
  const Lr=layout(d1,220); const rb=Lr.tboxes.find(t=>t.kind==='rich'); const rLay=rb?CORE.richLayout([{text:'Plan risk: ',size:rb.size,color:0xffffffff},{text:'CRITICAL',size:rb.size,color:0xffffffff,bold:true},{text:' days and ',size:rb.size,color:0xffffffff},{text:'MODERATE',size:rb.size,color:0xffffffff,italic:true},{text:' slack use the same legend.',size:rb.size,color:0xffffffff}],{maxw:rb.maxw,lineHeight:rb.lh,font:FONT,boldFont:FONTB}):null;
  out.rich={boxes:Lr.tboxes.length,kinds:Lr.tboxes.map(t=>t.kind),hasRich:!!rb,height:rb&&rb.height,count:rb&&rb.count,lh:rb&&rb.lh,coreHeight:rLay&&rLay.height,sane:!!(rb&&rb.lh<=3&&rb.height<=rb.size*rb.lh*rb.count+2&&rb.height<80)};
  out.pipelines=GC.builds||0; out.users=GC.users; out.boldFont=FONTB; out.MOD=!!MOD; out.RS=!!RS; out.TextField=typeof TextField==='function'; return out; }
window.JRViews={layout,View,boot,core,fullDL,diff,GID,selfTest,gc:()=>GC,font:()=>FONT,fontBold:()=>FONTB,metrics:()=>CORE?CORE.metrics(FONT):null,mem:()=>CORE?CORE.wasmBytes():0,MOD,RS,ViewStates:()=>window.JRender&&window.JRender.ViewStates,ID_BANDS:{textFieldHigh:[0x1,0x2,0x4,0x5],hostFields:0x50000000,tfXor:{group:0x40000000,content:0x20000000,caret:0x10000000}}};
})();

