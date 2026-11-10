/* Reusable journal presentations of the existing Exp7 Calendar, Plan and Board.
 * Emits the same JRViews layout / JRDL used by the standard views. No alternate renderer.
 * App atlas -> real runtime -> universal view model -> JRender store -> one Renderer. */
(function (root) {
  'use strict';
  var J = root.JRender, JV = root.JRViews, X = root.Exp7VM;
  var C = { ink:'#282735', muted:'#595768', line:'#e2e0eb', strong:'#b4b0c1', soft:'#efedf5', selected:'#d1cce2', accent:'#756b92', income:'#dcefe7', expense:'#e6e1f0', white:'#ffffff' };
  /* Budget-only skin. Other apps keep the stock skin; all model actions,
   * fields, risk labels and selection/drag semantics remain native Exp7. */
  var journalTokens={journal:1,page:C.white,surface:C.white,ink:C.ink,muted:C.muted,
    line:C.line,lineStrong:C.strong,accent:C.accent,accentSoft:C.soft,select:C.accent,
    anchor:C.accent,ok:'#356e59',riskL:'#356e59',riskLBg:C.income,riskMBg:C.soft,
    riskCBg:C.expense,radius:0,ctlRadius:0,shadow:0,text:13,density:1};
  function rgba(s){return J.hex(s);}
  var stockParts=Object.assign({},X.skin.parts), jp={};
  ['container','button','chip','day','row'].forEach(function(part){jp[part]=function(){var a=[].slice.call(arguments),T=a[a.length-1];if(!T.journal)return stockParts[part].apply(null,a);
    var role=part==='container'||part==='button'?a.shift():null,st=a[0],x=a[1],y=a[2],w=a[3],h=a[4],fill=C.white,ink=C.ink,face=[],hov=null;
    if(part==='container'){
      face.push(['rect',x,y,w,h,rgba(C.white)]);
      if(role==='pop')face.push(['border',x,y,w,h,0,1,rgba(C.strong)]);
      else if(role==='row'||role==='section'||role==='detail')face.push(['rect',x,y+h-1,w,0.8,rgba(C.line)]);
      if(st.bar)face.push(['rect',x+2,y+6,2,Math.max(1,h-12),rgba(C.accent)]);
    }else if(part==='day'){
      fill=st.sel||st.drag?C.selected:st.span?C.expense:C.soft;
      face.push(['rect',x,y,w,h,rgba(fill)],['border',x,y,w,h,0,0.7,rgba(C.line)]);
      if(st.today||st.sel||st.drag||st.anchor)face.push(['border',x+1,y+1,w-2,h-2,0,st.sel||st.drag?1.5:1,rgba(C.accent)]);
      if(st.risk)face.push(['rect',x+2,y+4,2,h-8,rgba(st.risk==='L'?'#52947f':C.accent)]);
      hov=X.hex(C.expense);
    }else if(part==='row'){
      fill=st.sel?C.soft:C.white;face.push(['rect',x,y,w,h,rgba(fill)],['rect',x,y+h-1,w,0.8,rgba(st.header?C.strong:C.line)]);
      hov=st.header?null:X.hex(C.soft);
    }else{
      fill=st.on?C.soft:part==='chip'?(st.tone==='ok'?C.income:C.expense):C.white;
      face.push(['rect',x,y,w,h,rgba(fill)]);
      if(st.on)face.push(['rect',x,y+h-1,w,1,rgba(C.accent)]);
      if(st.invalid)face.push(['border',x,y,w,h,0,1,rgba('#a40000')]);
      ink=st.disabled||st.dim?C.muted:C.ink;hov=st.disabled?null:X.hex(C.soft);
    }
    return {sh:[],face:face,hov:hov,ink:X.hex(ink),bold:!!st.on||role==='primary'};
  };});X.skin.use(jp);
  /* One shared month/day/Today menu tree, used both by the full view and the
   * Home overlay. Browsing does not commit a date. Existing budget actions do. */
  function datePicker(month,date,anchor){
    var y=+month.slice(0,4),m=+month.slice(5),days=root.JAtlasEval.monthDays(month),first=new Date(y,m-1,1).getDay(),cells=[];
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function(t,i){cells.push({t:'dow',k:'w'+i,text:t});});
    for(var i=0;i<first;i++)cells.push({t:'pad',k:'p'+i});
    days.forEach(function(d){cells.push(X.btn('d'+d,String(+d.slice(8)),'budget:pickday:'+d,{on:d===date,minW:30}));});
    return {t:'pop',k:'datepick',anchor:anchor||'budget/figs/facts/date',w:290,kids:[
      X.row('head',[X.btn('prev','<','budget:pick:-1',{kind:'icon'}),X.text('m',monthTitle(month),'h'),X.btn('next','>','budget:pick:1',{kind:'icon'}),X.btn('today','Today','budget:pick:today')],{gap:5}),
      {t:'grid',k:'days',cols:7,gap:3,cellH:30,kids:cells}]};
  }
  function fullModel(m,V){
    if((m.kids||[]).some(function(n){return n&&n.t==='journal';}))return m;
    m.tokens=X.tokens(m.tokens,journalTokens);m.journalFull=true;m.journalContext=V;
    /* Keep the real Board editor, but give every visible item its actual
     * monthly/undated amount in one aligned ledger column. Never manufacture
     * a payment status or use the full amount for every repeated charge. */
    var A=activeAtlas(V)||V.atlasW;
    (m.kids||[]).forEach(function(view){if(!view||!/^brd:/.test(view.k))return;
      var c=A.components[view.k.slice(4)];if(!c)return;
      var lm=ledgerModel(V,A,c,{board:{ledgerSources:[]}}),by={};lm.rows.forEach(function(r){(by[r.id]=by[r.id]||[]).push(r);});
      var ix=view.kids.findIndex(function(n){return /^c:/.test(n.k);});
      if(ix>=0)view.kids.splice(ix,0,X.row('journal-columns',[X.text('item',monthTitle(lm.month)+' - items','small'),X.text('amount','Amount','small',{bold:true})],{alignLast:'end'}));
      view.kids.forEach(function(n){if(!/^c:/.test(n.k))return;var rs=by[n.k.slice(2)]||[],head=n.kids&&n.kids.find(function(q){return q.k==='head';});if(!head)return;
        var sum=rs.reduce(function(t,r){return t+r.amount;},0),dates=rs.filter(function(r){return r.date;}).map(function(r){return r.date;});
        var label=!rs.length?'No charges this month':!dates.length?'No date set':dates.length===1?BUDGET_MONTHS[+dates[0].slice(5,7)-1].slice(0,3)+' '+(+dates[0].slice(8)):dates.length+' dates this month';
        head.alignLast='end';head.kids.push(X.text('journal-dates',label,'muted'),X.text('journal-amount',money(sum),'body',{bold:true}));
      });
    });
    function walk(n,key){if(!n||typeof n!=='object')return;
      delete n.slab;delete n.enter;
      if(n.k==='figs'){n.role=null;n.pad=0;}
      if(key==='budget/figs/facts')n.kids=n.kids.filter(function(q){return q.k==='date';});
      if(n.t==='text'&&n.k==='month'&&/\/nav\/month$/.test(key)){n.t='btn';n.label=monthTitle(n.text);n.act='budget:date';delete n.text;}
      if(n.t==='btn'){n.label=String(n.label).replace(/^\u25be\s*/,'Hide ').replace(/^\u25b8\s*/,'Show ');if(n.act&&n.act.indexOf('alt:pref:')===0)n.label=n.on?'Best':'Prefer';}
      if(n.t==='btn'&&n.act==='budget:date'){n.hoverDate=true;n.label=String(n.label).replace(/\s*[\u25be\u25bc]$/,'')+'  ';}
      if(n.t==='pop'&&n.k==='datepick'&&V.journalPickAnchor)n.anchor=V.journalPickAnchor;
      if(n.t==='day')n.anim=null;
      (n.kids||[]).forEach(function(q){walk(q,key+'/'+q.k);});
      (n.rows||[]).forEach(function(r){if(r.sub)walk(r.sub,key+'/sub');});
    }
    (m.kids||[]).forEach(function(n){walk(n,n.k);});return m;
  }
  function color(x) { return J.hex(x); }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function plain(x) { return String(x == null ? '' : x).replace(/[\u2012-\u2015\u2212]/g,'-').replace(/\u2192/g,' / ').replace(/\u2014/g,'-'); }
  function monthTitle(m) { return BUDGET_MONTHS[+m.slice(5,7)-1]+' '+m.slice(0,4); }
  function dayTitle(d) { var x = new Date(d+'T12:00:00'); return x.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}); }
  function money(n) { return Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function avail(A,id) { var it=A.items[id], un=((it&&it.alts&&it.alts.unavail)||[]).map(memberRef); return catMembers(it).filter(function(r){return A.items[r.slice(5)]&&un.indexOf(r)<0;}); }
  function base(V,A,c,kind) { return {t:'journal',k:'journal:'+kind+':'+c.id,kind:kind,component:c.id,day:V.journalDay||budgetDateKey(),month:V.journalMonth||window.JAtlasEval.monthOf(c),title:c.name||c.id}; }
  function calendarModel(V,A,c,O) {
    var m=base(V,A,c,O.calendar.presentation==='agenda'?'agenda':'calendar'), E=root.JAtlasEval, AW=activeAtlas(V)||A;
    m.month=V.journalMonth||E.monthOf(c); m.days=E.monthDays(m.month); m.by={};
    (c.items||[]).forEach(function(r){var id=r.replace(/^item:/,''), it=effItem(A,id); if(!it)return;
      E.occurrences(it,m.month).forEach(function(d){(m.by[d]=m.by[d]||[]).push({id:id,name:it.name,values:copy(it.values||{}),selected:selectedRef(AW,id)});}); });
    m.entries=(m.by[m.day]||[]).slice(); return m;
  }
  function planModel(V,A,c) {
    var m=base(V,A,c,'plan'), AW=activeAtlas(V)||A, D=depsRows(A,c);
    m.current=(c.state&&c.state.currentStep)||null; m.rows=D.rows.map(function(r){
      var it=AW.items[r.id], ref=it&&selectedRef(AW,r.id), item=ref&&AW.items[ref.slice(5)];
      return Object.assign({},r,{name:r.step||(it&&it.name)||r.id,selected:ref,selectedName:item?item.name:(it&&it.alts?'No available item':'No alternative'),choices:it?avail(AW,r.id).map(function(q){return {ref:q,name:AW.items[q.slice(5)].name};}):[],current:m.current===r.id||m.current==='item:'+r.id}); });
    return m;
  }
  function ledgerModel(V,A,c,O) {
    var m=base(V,A,c,'ledger'), month=V.journalMonth||budgetMonthKey(), E=root.JAtlasEval;
    var owners=catOwners(A), seen={};m.month=month;m.rows=[];
    var sources=[{component:c,role:'expense'}].concat(((O.board||{}).ledgerSources||[]).map(function(q){return {component:A.components[String(q.root).replace(/^comp:/,'')],role:q.role};}));
    sources.forEach(function(src){if(!src.component)return;boardRows(A,src.component).L.forEach(function(r){var id=r.replace(/^item:/,''),it=effItem(A,id);if(!it||(owners[r]&&owners[r]!==id)||seen[id]||(it.values||{}).kind==='resource')return;seen[id]=1;
      var v=it.values||{},charges=v.date?E.charges(it,month):{'':budgetAmount(it)};
      Object.keys(charges).forEach(function(d){m.rows.push({id:id,date:d,name:it.name,category:v.category||'',type:src.role,amount:src.role==='income'?charges[d]:Math.abs(charges[d]),scheduled:!!d&&d>m.day,undated:!d,paid:v.paid===true||v.status==='paid'});});
    });});
    m.rows.sort(function(a,b){return (a.date||'9999').localeCompare(b.date||'9999')||a.name.localeCompare(b.name);});return m;
  }
  /* Same selection semantics as Board: only state.userPick is proposed. Do not
   * toggle a checked option off and do not alter pref/Best or the current step. */
  function selectionOps(A,id,ref) {
    if(!A.items[id]||avail(A,id).indexOf(ref)<0)throw Error('Unavailable Plan alternative');
    var st=A.items[id].state;
    if(st&&st.userPick===ref)return [];
    return !st||typeof st!=='object'?[{path:'items/'+id+'/state',op:'add',value:{userPick:ref}}]:[{path:'items/'+id+'/state/userPick',op:Object.prototype.hasOwnProperty.call(st,'userPick')?'ref':'add',value:ref}];
  }
  function model(V,S,kind) {
    var A=sessAtlas(V,S), O=X.options({budget:{facts:false,tabs:false},calendar:{presentation:kind==='agenda'?'agenda':'mini'},plan:{presentation:'compact'},board:{presentation:'ledger',ledgerSources:V.journalSources||[]}});
    var old=V.opts; V.opts=O;
    try { return buildModel(V,S); } finally { V.opts=old; }
  }
  /* Journal layout adds a reusable presentation, not another paint path. The
   * result is JRViews' native node/item contract; fullDL owns tessellation. */
  function layout(m,W,core) {
    if(m.__vm)m=(m.kids||[]).find(function(n){return n&&n.t==='journal';});
    if(!m)throw Error('Missing journal model');
    core=core||JV.__core&&JV.__core(); if(!core)throw Error('JRender core not ready');
    var ns=[], used=new Set([0,JV.GID]), fonts=[JV.font(),JV.fontBold?JV.fontBold():JV.font()], cursor=0, rows=0, texts=[];
    function node(k,vm) {var s=m.k+':'+k,h=2166136261; for(var i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619)>>>0; while(!h||used.has(h)||h===0xffffffff)h=(h+1)>>>0; used.add(h);
      var n={key:s,id:h,flags:0,items:[],hit:null,vm:vm||null,act:null,mo:'cell'}; ns.push(n);return n;}
    function rect(n,x,y,w,h,c){n.items.push(['rect',x,y,w,h,color(c)]);}
    function rule(k,y,x,w,c){var n=node(k);rect(n,x||0,y,w==null?W:w,0.8,c||C.line);}
    function text(n,s,x,y,size,c,bold,w,align){s=plain(s);var z=core.measure(fonts[bold?1:0],size,s), px=align==='right'?x-z:x;
      if(bold)n.items.push(['rich',px,y-size*.92,[{text:s,size:size,color:color(c||C.ink),bold:true}],w||0,1.25]);else n.items.push(['text',px,y,size,color(c||C.ink),s,w||0]);
      texts.push({text:s,x:px,y:y,size:size,width:Math.min(z,w||Infinity),right:align==='right'?x:null});return z;}
    function hit(n,x,y,w,h,act,label){n.flags=J.NF.HIT;n.hit=[x,y,w,h];n.act='vm';n.vm=Object.assign(n.vm||{},{act:act,label:label||act});}
    function click(k,label,x,y,w,h,act,bold,size){var n=node(k);rect(n,x,y,w,h,C.white);n.base=color(C.white);n.hov=color(C.soft);hit(n,x,y,w,h,act,label);text(n,label,x+3,y+h/2+(size||13)*.34,size||13,C.ink,bold,w-6);return n;}
    function head(label,act,right){var n=node('navigation');hit(n,0,0,W,m.height||900,act,label);var t=node('heading');text(t,label,0,19,14,C.ink,true,m.kind==='calendar'?W-64:W-4);if(right)text(t,right,W,19,11,C.muted,false,0,'right');rule('heading-rule',30);cursor=47;}
    if(m.kind==='calendar') {
      head(monthTitle(m.month),'nav:calendar');
      var mh=click('month-heading',monthTitle(m.month),0,0,W-67,28,'journal:date',true,14);mh.vm.hoverDate=true;
      click('previous','<',W-60,1,26,25,'month:-1',false,14);click('next','>',W-28,1,26,25,'month:1',false,14);
      var start=new Date(m.month+'-01T12:00:00').getDay(), gap=3,cw=(W-6*gap)/7,ch=32,top=68;
      var names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']; names.forEach(function(s,i){var n=node('dow'+i);rect(n,i*(cw+gap),43,cw,22,C.expense);text(n,s,i*(cw+gap)+5,58,10,C.muted,true,cw-6);});
      m.days.forEach(function(d,i){var ix=start+i,x=(ix%7)*(cw+gap),y=top+Math.floor(ix/7)*(ch+gap),n=node('day:'+d),bg=d===m.day?C.selected:C.soft;
        rect(n,x,y,cw,ch,bg);n.base=color(bg);n.hov=color(C.expense);text(n,String(+d.slice(8)),x+9,y+20,12,C.ink,d===m.day);hit(n,x,y,cw,ch,'date:'+d,d);
        var es=m.by[d]||[]; if(es.length){var inc=es.some(function(q){return q.values.type==='income';}),ex=es.some(function(q){return q.values.type!=='income';}); if(inc)rect(n,x+cw-7,y+4,3,3,'#52947f');if(ex)rect(n,x+cw-7,y+10,3,3,C.accent);}
      });
      cursor=top+Math.ceil((start+m.days.length)/7)*(ch+gap)+4;
      var legend=node('legend');text(legend,'Income',10,cursor+13,10,C.muted);rect(legend,1,cursor+6,3,3,'#52947f');text(legend,'Scheduled item',89,cursor+13,10,C.muted);rect(legend,80,cursor+6,3,3,C.accent);cursor+=28;
    } else if(m.kind==='plan') {
      head('Plan','nav:plan');var hint=node('hint');text(hint,'Sequence and dependencies',W,19,10,C.muted,false,0,'right');
      if(!m.rows.length){text(node('empty'),'No plan steps yet.',0,cursor+16,12,C.muted);cursor+=44;}
      var from=0,limit=7,ci=m.rows.findIndex(function(r){return r.current;});if(ci>=limit)from=Math.max(0,ci-3);var shown=m.rows.slice(from,from+limit);if(from){text(node('earlier-count'),from+' earlier steps in full Plan',0,cursor+12,10,C.muted);cursor+=26;}shown.forEach(function(r,i){var y=cursor, n=node('step:'+r.id),num=String(r.seq||i+1), nm=plain(r.name), fs=12;
        var labelMax=Math.max(64,W*.43-28), z=core.measure(fonts[0],fs,nm), labelW=Math.min(z,labelMax), sx=32+labelW+13, sw=W-sx-4;
        n.items.push(['rrect',0,y+3,18,18,9,color(r.current?C.selected:C.white)],['border',0,y+3,18,18,9,0.9,color(r.current?C.accent:C.strong)]);text(n,num,9-core.measure(fonts[r.current?1:0],11,num)/2,y+17,11,r.current?C.ink:C.muted,r.current);text(n,nm,28,y+17,fs,C.ink,false,labelMax);text(n,'|',sx-9,y+17,fs,C.muted);
        if(r.choices.length) {var a=node('item:'+r.id), selected=plain(r.selectedName), aw=Math.min(sw,core.measure(fonts[1],fs,selected)+22);rect(a,sx-2,y,aw,28,C.white);a.base=color(C.white);a.hov=color(C.soft);text(a,selected,sx,y+17,fs,C.ink,true,Math.max(8,aw-20));var cx=sx+aw-12;
          a.items.push(['stroke',[['M',cx,y+12],['L',cx+3,y+15],['L',cx+6,y+12]],color(C.muted),{width:1}]);hit(a,sx-2,y,aw,28,'picker:'+r.id,r.name+' | '+selected);a.vm.step=r.id;
        } else text(n,r.selectedName,sx,y+17,11,C.muted,false,sw);
        var d=node('detail:'+r.id), req=plain(r.req||'');var sub=(r.when&&r.when!=='\u2014'?plain(r.when):'No date')+(r.current?' - current step':'');
        text(d,sub,28,y+36,10,C.muted,false,W-32);if(req&&req!=='-')text(d,'Requires '+req,28,y+52,10,C.muted,false,W-32);
        if(i<shown.length-1)rect(d,8,y+22,1,57,C.line);rule('step-rule:'+r.id,y+65,28,W-28);cursor+=76;rows++;
      });if(from+shown.length<m.rows.length){text(node('more-steps'),(m.rows.length-from-shown.length)+' more steps in full Plan',28,cursor+14,11,C.muted);cursor+=32;}
    } else if(m.kind==='agenda') {
      var hl=m.day===budgetTodayKey()?'Today':'Schedule';head(hl,'nav:agenda');var date=node('date');text(date,budgetDateLabel(m.day),Math.round(core.measure(fonts[1],14,hl))+12,19,11,C.muted);
      var untimed=[],timed={}; m.entries.forEach(function(e){var v=e.values||{}, t=String(v.time||''), match=/^(\d{1,2}):(\d{2})$/.exec(t);if(match&&+match[1]<24&&+match[2]<60){var h=+match[1];(timed[h]=timed[h]||[]).push(e);}else untimed.push(e);});
      var extraHours=Object.keys(timed).map(Number),first=Math.min.apply(null,[7].concat(extraHours)),last=Math.max.apply(null,[21].concat(extraHours));
      if(untimed.length){text(node('untimed-title'),'No time set',0,cursor+12,10,C.muted);cursor+=26;untimed.slice(0,4).forEach(function(e){var n=node('untimed:'+e.id);text(n,e.name,35,cursor+13,12,C.ink,true,W-40);rect(n,25,cursor,2,20,C.accent);cursor+=30;});if(untimed.length>4){text(node('more-untimed'),(untimed.length-4)+' more in the full day',35,cursor+13,11,C.muted);cursor+=26;}rule('untimed-rule',cursor);cursor+=17;}
      if(!m.entries.length){text(node('empty'),'No scheduled items on this day.',35,cursor+12,12,C.muted,false,W-40);cursor+=36;}
      for(var h=first;h<=last;h++) {var allEvents=timed[h]||[],evs=allEvents.slice(0,3),hh=Math.max(46,evs.length*29+17);text(node('hour'+h),String(h%12||12)+(h<12?' AM':' PM'),0,cursor+11,10,C.muted);rule('hour-rule'+h,cursor,36,W-36);rule('half'+h,cursor+hh/2,36,W-36,'#f1eff5');
        evs.forEach(function(e,i){var n=node('event:'+e.id);rect(n,43,cursor+9+i*29,2,22,C.accent);text(n,e.name,53,cursor+24+i*29,12,C.ink,true,W-57);});if(allEvents.length>3){text(node('more-hour'+h),'+'+(allEvents.length-3)+' in full day',53,cursor+hh-3,10,C.muted);}cursor+=hh;
      }
    } else if(m.kind==='ledger') {
      head(monthTitle(m.month)+' expenses','nav:ledger');var n=node('columns');text(n,'Date',0,48,10,C.muted,true);text(n,'Item',65,48,10,C.muted,true);if(W>=360)text(n,'Category',W-190,48,10,C.muted,true);text(n,'Amount',W,48,10,C.muted,true,0,'right');rule('column-rule',55,0,W,C.strong);cursor=76;
      /* The atlas has dates and amounts, not proof of payment. A past date is
       * called 'dated through today', never fabricated into 'paid'. */
      var groups=[['Income dated through today',m.rows.filter(function(r){return r.type==='income'&&!r.undated&&!r.scheduled;})],['Expenses dated through today',m.rows.filter(function(r){return r.type!=='income'&&!r.undated&&!r.scheduled;})],['Scheduled this month',m.rows.filter(function(r){return r.scheduled;})],['No date set',m.rows.filter(function(r){return r.undated;})]];
      var remaining=26;groups.forEach(function(g,gi){if(!g[1].length)return;text(node('section'+gi),g[0],0,cursor,11,C.muted,true,W);cursor+=14;var total=0;
        var list=g[1].slice(0,remaining);remaining-=list.length;list.forEach(function(r,i){var n=node('row:'+gi+':'+i);text(n,r.date?BUDGET_MONTHS[+r.date.slice(5,7)-1].slice(0,3)+' '+(+r.date.slice(8)):'-',0,cursor+13,11,C.muted);var a=money(r.amount), aw=core.measure(fonts[0],12,a);var catX=W>=360?W-190:null;var nameEnd=catX==null?W-aw-18:catX-12;text(n,r.name,65,cursor+13,12,C.ink,false,Math.max(20,nameEnd-65));var category=r.category||(r.type==='income'?'Income':'');if(catX!=null&&category){var tagW=Math.min(86,core.measure(fonts[0],10,String(category))+10);rect(n,catX,cursor+1,tagW,17,r.type==='income'?C.income:C.expense);text(n,String(category),catX+5,cursor+13,10,C.muted,false,tagW-10);}text(n,a,W,cursor+13,12,C.ink,false,0,'right');rule('ledger-rule:'+gi+':'+i,cursor+23);total+=r.amount;cursor+=25;rows++;});
        if(list.length<g[1].length){text(node('more-ledger'+gi),(g[1].length-list.length)+' more in full expenses',0,cursor+12,10,C.muted);cursor+=25;}total=g[1].reduce(function(t,r){return t+r.amount;},0);var t=node('total'+gi);text(t,gi===3?'Undated total':'Subtotal',0,cursor+16,11,C.muted,true);text(t,money(total),W,cursor+16,12,C.ink,true,0,'right');cursor+=48;
      });
      if(!m.rows.length){text(node('empty'),'No monthly expenses yet.',0,cursor+16,12,C.muted);cursor+=42;}else {var dated=m.rows.filter(function(r){return !r.undated&&!r.scheduled;}),all=m.rows.filter(function(r){return !r.undated;});function balance(rs){return rs.reduce(function(t,r){return t+(r.type==='income'?r.amount:-r.amount);},0);}rule('summary-rule',cursor-7,0,W,C.strong);text(node('dated-balance'),'Dated income less expenses',0,cursor+16,10,C.muted);text(node('dated-net'),money(balance(dated)),W,cursor+16,12,C.ink,true,0,'right');cursor+=27;text(node('scheduled-balance'),'Including scheduled entries',0,cursor+16,10,C.muted);text(node('scheduled-net'),money(balance(all)),W,cursor+16,12,C.ink,true,0,'right');cursor+=37;}
    } else if(m.kind==='page') {
      var bg=node('paper');rect(bg,0,0,W,m.height,C.white);text(bg,'Budget Home',0,24,20,C.ink,true);var dx=core.measure(fonts[1],20,'Budget Home')+24;var dh=click('date-heading',dayTitle(m.day),dx-3,6,Math.min(W-dx,core.measure(fonts[0],12,dayTitle(m.day))+12),30,'journal:date',false,12);dh.vm.hoverDate=true;rule('page-rule',46);
      var b1=node('divider1');(m.dividers||[]).forEach(function(x){rect(b1,x,70,1,m.height-75,C.line);});cursor=m.height;
    }
    var H=Math.max(40,Math.ceil(cursor+8)); if(ns[0]&&ns[0].vm&&/^nav:/.test(ns[0].vm.act))ns[0].hit[3]=H;
    return {nodes:ns,H:H,W:W,items:rows,rows:rows,glyphs:texts.reduce(function(s,t){return s+t.text.length;},0),hits:ns.filter(function(n){return n.flags&J.NF.HIT;}).length,tboxes:[],notdef:[],vm:true,enter:[],journal:m,texts:texts};
  }
  function overlay(W,H,popup,core,focusRect) {
    var d=new J.DL(), nodes=[], G=0x7abc0100;d.group(G,0,0,0,W,H,W,H);
    function hit(id,r,act,label,draw){d.node(id,J.NF.HIT);draw(d);d.hit.apply(d,r);nodes.push({id:id,hit:r,vm:{act:act,label:label},act:'vm'});}
    if(popup&&popup.kind==='date'){
      var pm=datePicker(popup.month,budgetDateKey()),L=X.layout({__vm:true,inset:0,tokens:journalTokens,kids:[X.col('shared-date-menu',pm.kids,{role:'pop',pad:10})]},290),x=popup.rect[0],y=popup.rect[1];
      popup.rect[3]=L.H;popup.menuNodes=L.nodes;
      d.group(G+1,0,x,y,290,L.H,290,L.H);
      L.nodes.forEach(function(n){d.node(n.id,n.flags);JV.items(d,n);nodes.push(n);
        if(n.vm&&n.vm.act==='budget:pickday:'+popup.cursor&&n.hit){var r=n.hit;d.node(108).border(r[0]+1,r[1]+1,r[2]-2,r[3]-2,0,1.2,color(C.accent));}
      });d.end();
    }else if(popup){var q=popup.rect, p=popup, allH=p.choices.length*30, vh=Math.min(allH,240),x=q[0],y=q[1],w=q[2];
      d.node(101).rect(x,y,w,vh+2,color(C.white)).border(x,y,w,vh+2,0,1,color(C.strong));
      /* A scroll group exists ONLY over the menu, never over the whole overlay. */
      d.group(G+1,allH>vh?J.GF.SCROLL_Y:0,x,y,w,vh,w,allH);
      p.choices.forEach(function(a,i){var ry=i*30,chosen=a.ref===p.selected,active=i===p.active;
        hit(1000+i,[0,ry,w,30],'choose:'+a.ref,a.name,function(b){b.rect(1,ry,w-2,30,color(active?C.expense:chosen?C.soft:C.white));b.text(11,ry+20,12,color(C.ink),JV.font(),plain(a.name),{maxw:w-40,ellipsis:true});if(chosen)b.stroke([['M',w-21,ry+14],['L',w-17,ry+18],['L',w-10,ry+10]],color(C.accent),{width:1.4});});
      });d.end();
    }
    if(focusRect){var r=focusRect;d.node(109).border(r[0]-2,r[1]-2,r[2]+4,r[3]+4,0,1.5,color(C.accent));}
    d.end();return {dl:d,nodes:nodes};
  }
  var oldLayout=X.layout;
  X.layout=function(m,w){var z=m&&m.__vm&&(m.kids||[]).filter(function(n){return n&&n.t==='journal';});if(z&&z.length===1)return layout(z[0],w);var L=oldLayout(m,w);if(m&&m.journalFull){L.enter=[];L.nodes.forEach(function(n){n.mo='cell';if(n.hit&&n.vm&&n.vm.hoverDate){var cx=n.hit[0]+n.hit[2]-11,cy=n.hit[1]+n.hit[3]/2;n.items.push(['stroke',[['M',cx,cy-1],['L',cx+3,cy+2],['L',cx+6,cy-1]],color(C.muted),{width:1}]);}if(n.hit&&m.journalContext&&(n.key===m.journalContext.journalDateFocusKey||n.pop&&n.vm&&n.vm.act==='budget:pickday:'+m.journalContext.journalCursor))n.items.push(['border',n.hit[0]+1,n.hit[1]+1,n.hit[2]-2,n.hit[3]-2,0,1.2,color(C.accent)]);});}return L;};
  /* Full views use their own existing native pop layout, with the same picker
   * model/actions as Home. Only the active canvas owns outside dismissal. */
  var fullOwner=null;
  function bindFullDate(v,m){
    v.journalDocument=m;if(v.journalBoundCanvas===v.c)return;v.journalBoundCanvas=v.c;
    if(v.journalAbort)v.journalAbort.abort();var ac=v.journalAbort=new AbortController(),cv=v.c,V=m.journalContext,openTimer=null,openKey=null,closeTimer=null,hover=false;
    function cancel(){if(openTimer)clearTimeout(openTimer);if(closeTimer)clearTimeout(closeTimer);openTimer=closeTimer=null;}
    function ui(){return root.__budgetUi||{};}
    function act(a){if(root.__budgetChromeAct)root.__budgetChromeAct(a);}
    function redraw(){var q=v.journalDocument.journalContext;if(q.queue&&q.sess)q.queue(q.sess,'journal-date-key');else if(v.journalRedraw)v.journalRedraw();}
    function close(){cancel();hover=false;if(fullOwner===v)fullOwner=null;if(ui().pick)act('budget:date');}
    function xy(e){var r=cv.getBoundingClientRect(),sp=v.s&&v.s.scrollPos(JV.GID)||[0,0];return [(e.clientX-r.left)*v.L.W/r.width+sp[0],(e.clientY-r.top)*v.L.VH/r.height+sp[1]];}
    function inside(p,r){return r&&p[0]>=r[0]&&p[0]<r[0]+r[2]&&p[1]>=r[1]&&p[1]<r[1]+r[3];}
    function target(p){return v.L.nodes.find(function(n){return n.vm&&n.vm.hoverDate&&inside(p,n.hit);});}
    function inMenu(p){return v.L.nodes.some(function(n){return n.pop&&inside(p,n.hit);});}
    function defer(){if(fullOwner!==v||!hover||!ui().pick||closeTimer)return;closeTimer=setTimeout(close,220);}
    cv.tabIndex=0;cv.setAttribute('aria-label','Budget journal view. Tab focuses date headings. Enter opens date picker; arrow keys choose a day; Page Up and Page Down browse months; Escape closes.');
    cv.addEventListener('pointermove',function(e){if(e.buttons)return;var p=xy(e),n=target(p);
      if(n){if(closeTimer){clearTimeout(closeTimer);closeTimer=null;}
        if(openTimer&&openKey!==n.key){clearTimeout(openTimer);openTimer=null;}openKey=n.key;if(!ui().pick&&!openTimer)openTimer=setTimeout(function(){openTimer=null;if(ac.signal.aborted||!v.s||!v.s.h)return;fullOwner=v;hover=true;var ctx=v.journalDocument.journalContext;ctx.journalPickAnchor=n.key;ctx.journalCursor=budgetDateKey();act('budget:date');},100);
      }else{if(openTimer){clearTimeout(openTimer);openTimer=null;}var anchor=v.L.nodes.find(function(n){return n.key===v.journalDocument.journalContext.journalPickAnchor;}),bridge=anchor&&[anchor.hit[0],anchor.hit[1],Math.max(290,anchor.hit[2]),anchor.hit[3]+16];
        if(inMenu(p)||inside(p,bridge)){if(closeTimer)clearTimeout(closeTimer);closeTimer=null;}else defer();}
    },{capture:true,signal:ac.signal});
    cv.addEventListener('pointerleave',function(){if(openTimer){clearTimeout(openTimer);openTimer=null;}defer();},{signal:ac.signal});
    cv.addEventListener('pointerdown',function(e){var p=xy(e),n=target(p);if(openTimer){clearTimeout(openTimer);openTimer=null;}
      if(n){fullOwner=v;var ctx=v.journalDocument.journalContext;ctx.journalPickAnchor=n.key;ctx.journalCursor=budgetDateKey();if(ui().pick&&hover)v.journalSuppressClick=true;hover=false;if(closeTimer)clearTimeout(closeTimer);closeTimer=null;}
      else if(fullOwner===v&&ui().pick){if(inMenu(p)){hover=false;if(closeTimer)clearTimeout(closeTimer);closeTimer=null;}else{close();e.preventDefault();e.stopImmediatePropagation();}}
    },{capture:true,signal:ac.signal});
    document.addEventListener('pointerdown',function(e){if(fullOwner===v&&e.target!==cv)close();},{capture:true,signal:ac.signal});
    cv.addEventListener('keydown',function(e){if(e.target!==cv)return;var ctx=v.journalDocument.journalContext,dates=v.L.nodes.filter(function(n){return n.vm&&n.vm.hoverDate;});
      if(fullOwner===v&&ui().pick){
        if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();close();return;}
        hover=false;cancel();var inc={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
        if(inc||e.key==='Home'||e.key==='End'){e.preventDefault();var d=new Date((ctx.journalCursor||budgetDateKey())+'T12:00:00'),mo=ui().pick;
          if(inc)d.setDate(d.getDate()+inc);else d=new Date(mo+'-01T12:00:00');
          ctx.journalCursor=e.key==='End'?root.JAtlasEval.monthDays(mo).slice(-1)[0]:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');root.__budgetUi.pick=ctx.journalCursor.slice(0,7);redraw();return;}
        if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();act('budget:pick:'+(e.key==='PageUp'?-1:1));ctx.journalCursor=ui().pick+'-01';return;}
        if(e.key==='Enter'||e.key===' '){e.preventDefault();act('budget:pickday:'+(ctx.journalCursor||budgetDateKey()));return;}
      }else if(e.key==='Tab'){
        var index=dates.findIndex(function(n){return n.key===ctx.journalDateFocusKey;})+(e.shiftKey?-1:1);if(index<0||index>=dates.length){ctx.journalDateFocusKey=null;redraw();return;}
        e.preventDefault();ctx.journalDateFocusKey=dates[index].key;redraw();
      }else if(e.key==='Enter'||e.key===' '){var n=dates.find(function(n){return n.key===ctx.journalDateFocusKey;});if(n){e.preventDefault();fullOwner=v;hover=false;ctx.journalPickAnchor=n.key;ctx.journalCursor=budgetDateKey();act('budget:date');}}
    },{signal:ac.signal});
    v.journalRelease=function(){cancel();hover=false;if(fullOwner===v)fullOwner=null;};
    v.journalCleanup=function(){var owned=fullOwner===v;v.journalRelease();ac.abort();if(owned&&root.__budgetUi)root.__budgetUi.pick='';};
    if(v.r&&!v.r.journalDestroy){var destroy=v.r.destroy;v.r.journalDestroy=true;v.r.destroy=function(){if(v.journalCleanup)v.journalCleanup();return destroy.apply(this,arguments);};}
  }
  var fullShow=JV.View.prototype.show,fullWire=JV.View.prototype.wire;
  JV.View.prototype.show=async function(cv,m,w,opt){var r=await fullShow.call(this,cv,m,w,opt);if(m&&m.journalFull&&this.s&&!(opt&&opt.displayListOnly))bindFullDate(this,m);return r;};
  JV.View.prototype.wire=function(){fullWire.call(this);var self=this,prev=this.s&&this.s.onevent;if(!this.s)return;this.s.onevent=function(e){var n=self.byId&&self.byId.get(e.id);if(e.kind===J.EV.CLICK&&n&&n.vm&&n.vm.hoverDate&&self.journalSuppressClick){self.journalSuppressClick=false;return;}if(prev)prev(e);};};
  function Home(opts) { this.o=opts;this.host=opts.host;this.atlas=opts.atlas;this.id=this.host.id;this.views={};this.popup=null;this.closeTimer=null;this.focusKey=null;this.chain=Promise.resolve();this.dead=false;this.serial=0;this.abort=new AbortController(); }
  Home.prototype.init=async function(){var self=this;await JV.boot();if(this.dead)return;
    this.core=await JV.core();var cv=this.cv=document.createElement('canvas');cv.tabIndex=0;cv.setAttribute('aria-label','Budget Home. Tab moves between date pickers, sections and Plan items. Enter opens. Arrow keys browse an open date picker; Page Up and Page Down browse months. Escape closes.');this.host.appendChild(cv);
    this.r=await J.Renderer.init({canvas:cv,core:this.core,context:JV.gc(),clear:[1,1,1,1],readback:true});if(this.dead){this.r.destroy();return;}
    this.r.ondevicelost=function(e){self.error=String(e.message||e);if(self.o.onError)self.o.onError(e);};this.r.attach();this.status=document.createElement('div');this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');this.status.style.cssText='position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)';this.host.appendChild(this.status);
    window.__exp7ViewsPropose=window.__exp7ViewsPropose||{};this.proposalHook=this.o.onPropose;window.__exp7ViewsPropose[this.id]=this.proposalHook;
    cv.addEventListener('keydown',function(e){self.key(e);},{signal:this.abort.signal});
    cv.addEventListener('pointermove',function(e){self.pointer(e);},{capture:true,signal:this.abort.signal});
    cv.addEventListener('pointerleave',function(){self.deferClose();},{signal:this.abort.signal});
    cv.addEventListener('pointerdown',function(e){if(!self.popup)return;var xy=self.point(e),p=self.popup,q=p.rect;
      var inside=self.inside(xy,q),anchor=p.kind==='date'&&self.targets.find(function(t){return t.key===p.anchorKey;});
      if(anchor&&self.inside(xy,anchor.rect)){p.hover=false;self.cancelClose();return;}
      if(inside){p.hover=false;self.cancelClose();return;}
      self.close();e.preventDefault();e.stopImmediatePropagation();}, {capture:true,signal:this.abort.signal});
    document.addEventListener('pointerdown',function(e){if(self.popup&&e.target!==cv)self.close();},{capture:true,signal:this.abort.signal});
    this.resize=new ResizeObserver(function(es){var w=Math.round(es[0].contentRect.width);if(w>0&&w!==self.measured){self.measured=w;self.update();}});this.resize.observe(this.host);
    return this.update(); };
  Home.prototype.update=function(A){if(A)this.atlas=A;var self=this,serial=++this.serial;
    this.chain=this.chain.catch(function(){}).then(async function(){if(self.dead||!self.r||serial!==self.serial)return;
      var A=self.atlas,R=root.Exp7Views.rootsFor(A),roots={calendar:R.calendar,agenda:R.calendar,plan:R.plan,ledger:['comp:'+(((A.meta||{}).boardIds||{}).expense||R.boardId)]},old=self.session;
      if(old)old.dispose();var V=self.context={id:self.id,atlasW:A,root:R.plan,plan:true,open:{},vmInfo:{},journalDay:budgetDateKey(),journalMonth:budgetMonthKey()};
      var S=self.session=startRuntime(A,[].concat(R.calendar,R.plan,roots.ledger),null,function(){},livePins(A));await S.ready;
      if(self.dead||serial!==self.serial){S.dispose();return;}if(S.errs.length)throw Error('Atlas evaluation: '+S.errs.join('; '));var models={};Object.keys(roots).forEach(function(k){var v=Object.assign({},V,{root:roots[k],plan:k==='plan',vmInfo:{},journalSources:k==='ledger'&&A.meta.boardIds&&A.meta.boardIds.income?[{root:'comp:'+A.meta.boardIds.income,role:'income'}]:[]});models[k]=model(v,S,k);});
      self.models=models;self.render();if(self.o.onUpdate)self.o.onUpdate(self);return self;
    }).catch(function(e){if(self.dead)return;self.error=String(e&&e.message||e);if(self.o.onError)self.o.onError(e);var err=self.host.querySelector('.jrerr')||self.host.appendChild(document.createElement('div'));err.className='jrerr';err.setAttribute('role','alert');err.textContent='JRender composition not drawn: '+self.error;});return this.chain;};
  Home.prototype.render=function(){if(this.dead||!this.models)return;
    var self=this,W=Math.max(320,Math.round(this.host.clientWidth)||1200),narrow=W<900,pad=narrow?16:30,gap=38,available=W-2*pad-2*gap,left=narrow?W-2*pad:Math.round(available*.29),mid=narrow?left:Math.round(available*.32),right=narrow?left:available-left-mid;
    this.W=W;var Ls={calendar:layout(this.models.calendar,left,this.core),plan:layout(this.models.plan,left,this.core),agenda:layout(this.models.agenda,mid,this.core),ledger:layout(this.models.ledger,right,this.core)};
    var py=88+Ls.calendar.H+24,H,positions;
    if(narrow){ /* one column: calendar, plan, the day, the month's ledger */
      var ay=py+Ls.plan.H+32, ly=ay+Ls.agenda.H+32; H=ly+Ls.ledger.H+35;
      positions={calendar:[pad,88,left,Ls.calendar.H],plan:[pad,py,left,Ls.plan.H],agenda:[pad,ay,mid,Ls.agenda.H],ledger:[pad,ly,right,Ls.ledger.H]};
    } else { H=Math.max(900,py+Ls.plan.H+35,88+Ls.agenda.H+25,88+Ls.ledger.H+25);
      positions={calendar:[pad,88,left,Ls.calendar.H],plan:[pad,py,left,Ls.plan.H],agenda:[pad+left+gap,88,mid,Ls.agenda.H],ledger:[pad+left+gap+mid+gap,88,right,Ls.ledger.H]}; }
    this.H=H;
    Ls.page=layout({t:'journal',k:'home-page',kind:'page',day:budgetDateKey(),height:H-24,dividers:narrow?[]:[left+gap/2,left+mid+gap*1.5]},W-2*pad,this.core);positions.page=[pad,12,W-2*pad,H-24];
    this.cv.style.width=W+'px';this.cv.style.height=H+'px';this.cv.style.maxWidth='none';this.host.style.overflowX='auto';this.r.resize(W,H,Math.min(root.devicePixelRatio||1,3));
    var order=['page','calendar','plan','agenda','ledger','selector'],blobs={},cat={format:'exp7-view-store/1',resources:{fonts:[{rid:'regular',slot:JV.font()},{rid:'bold',slot:JV.fontBold()}]},views:[]};
    order.forEach(function(k){var p=positions[k]||[0,0,W,H],record={format:'exp7-view-record/1',id:'exp7.journal.'+k,version:1,role:k==='selector'?'overlay':'slot',hit:k==='selector'?'fallthrough':'capture',canvas:{w:p[2],h:p[3]},states:{idle:{},open:{},selected:{}},edgeMs:0,resources:{fonts:['regular','bold']},dl:{file:k},paint:{ops:['rect','text','stroke','border'],gaps:[]}};
      cat.views.push({id:record.id,role:record.role,record:record});if(k!=='selector')blobs[k]=JV.fullDL(Ls[k],p[2],p[3]).bytes();});
    this.positions=positions;this.layouts=Ls;this.planDraw=Ls.plan;this.targets=[];Object.keys(Ls).forEach(function(k){var p=positions[k];Ls[k].nodes.forEach(function(n){if(n.flags&J.NF.HIT)self.targets.push({key:n.key,node:n,kind:k,rect:[p[0]+n.hit[0],p[1]+n.hit[1],n.hit[2],n.hit[3]]});});});
    var focus=this.targets.find(function(t){return t.key===self.focusKey;}),ov=overlay(W,H,this.popup,this.core,focus&&focus.rect);blobs.selector=ov.dl.bytes();this.overlayNodes=ov.nodes;
    this.store=new root.Exp7ViewStore.Store(cat,function(rec){return blobs[rec.dl.file];},J);this.store.bindResources(this.core,{regular:JV.font(),bold:JV.fontBold()});this.blobs=blobs;
    var list=[];order.forEach(function(k){var rec=self.store.record('exp7.journal.'+k),v=self.views[k];if(!v){v=self.store.create(rec.id,{renderer:self.r});self.views[k]=v;}else{v.record=rec;v.scene.load(self.store.dl(rec.id));}
      var p=positions[k]||[0,0,W,H];v.scene.onevent=function(e){var nodes=k==='selector'?self.overlayNodes:Ls[k].nodes,n=nodes.find(function(q){return q.id===e.id;});if(!n)return;
        if((e.kind===J.EV.ENTER||e.kind===J.EV.LEAVE)&&n.hov!=null){v.scene.patch(new J.Patch().colorItem(n.id,0,e.kind===J.EV.ENTER?n.hov:n.base));self.r.draw();}if(k==='selector'&&e.kind===J.EV.ENTER&&self.popup&&self.popup.kind!=='date'&&n.id>=1000){self.popup.active=n.id-1000;var hp=new J.Patch();self.popup.choices.forEach(function(a,i){hp.colorItem(1000+i,0,color(i===self.popup.active?C.expense:a.ref===self.popup.selected?C.soft:C.white));});v.scene.patch(hp);self.r.draw();}if(e.kind===J.EV.ENTER&&n.vm&&n.vm.hoverDate&&!self.pointerDown)self.openDate(n,true);if(e.kind===J.EV.CLICK&&n.vm)Promise.resolve(self.act(n.vm.act,k,n)).catch(function(err){self.status.textContent='Selection failed: '+String(err.message||err);});
      };list.push([v,p[0],p[1],p[2],p[3]]);});
    this.entries=this.store.compose(this.r,list);this.r.draw();this.painted=true;this.error='';var err=this.host.querySelector('.jrerr');if(err)err.remove();
  };
  Home.prototype.paintOverlay=function(){if(this.dead||!this.r||!this.layouts)return;var next=Object.assign({},this.layouts.plan,{nodes:this.layouts.plan.nodes.map(function(n){if(!this.popup||!n.vm||n.vm.step!==this.popup.step)return n;var v=Object.assign({},n,{items:copy(n.items)}),stroke=v.items.find(function(i){return i[0]==='stroke';});if(stroke){stroke[1].forEach(function(p){p[2]=n.hit[1]+27-p[2]+n.hit[1];});}v.items.push(['rect',n.hit[0]+2,n.hit[1]+25,n.hit[2]-4,1,color(C.accent)]);return v;},this)});this.views.plan.scene.patch(JV.diff(this.planDraw,next,this.positions.plan[2],this.positions.plan[3]).p);this.planDraw=next;var self=this,focus=this.targets.find(function(t){return t.key===self.focusKey;}),ov=overlay(this.W,this.H,this.popup,this.core,focus&&focus.rect);this.overlayNodes=ov.nodes;this.blobs.selector=ov.dl.bytes();this.views.selector.scene.load(ov.dl);
    if(this.popup&&this.popup.active>=8)this.views.selector.scene.scroll(0x7abc0101,0,(this.popup.active-7)*30);this.r.draw();};
  Home.prototype.point=function(e){var r=this.cv.getBoundingClientRect();return [(e.clientX-r.left)*this.W/r.width,(e.clientY-r.top)*this.H/r.height];};
  Home.prototype.inside=function(p,r){return !!r&&p[0]>=r[0]&&p[0]<r[0]+r[2]&&p[1]>=r[1]&&p[1]<r[1]+(r[3]||Math.min(240,this.popup.choices.length*30));};
  Home.prototype.cancelClose=function(){if(this.closeTimer){clearTimeout(this.closeTimer);this.closeTimer=null;}};
  Home.prototype.deferClose=function(){if(!this.popup||this.popup.kind!=='date'||!this.popup.hover||this.closeTimer)return;var self=this;this.closeTimer=setTimeout(function(){self.closeTimer=null;if(!self.dead&&self.popup&&self.popup.kind==='date'&&self.popup.hover)self.close();},220);};
  Home.prototype.pointer=function(e){this.pointerDown=!!e.buttons;var p=this.popup;if(!p||p.kind!=='date'||!p.hover)return;var xy=this.point(e),t=this.targets.find(function(t){return t.key===p.anchorKey;});
    var bridge=t?[Math.min(t.rect[0],p.rect[0]),t.rect[1],Math.max(t.rect[0]+t.rect[2],p.rect[0]+p.rect[2])-Math.min(t.rect[0],p.rect[0]),p.rect[1]+4-t.rect[1]]:null;
    if(this.inside(xy,p.rect)||this.inside(xy,bridge))this.cancelClose();else this.deferClose();};
  Home.prototype.openDate=function(n,hover){var t=this.targets.find(function(t){return t.node===n;});if(!t)return;this.cancelClose();if(fullOwner&&fullOwner.journalRelease)fullOwner.journalRelease();
    if(this.popup&&this.popup.kind==='date'&&this.popup.anchorKey===t.key){if(!hover)this.popup.hover=false;return;}
    var month=budgetMonthKey();if(!hover)this.focusKey=t.key;this.popup={kind:'date',anchorKey:t.key,hover:!!hover,month:month,cursor:budgetDateKey(),rect:[Math.max(4,Math.min(this.W-294,t.rect[0])),t.rect[1]+t.rect[3]+4,290,280]};
    root.__budgetUi=Object.assign({},root.__budgetUi||{},{pick:month});this.paintOverlay();this.status.textContent='Choose a date. '+monthTitle(month);};
  Home.prototype.close=function(){this.cancelClose();if(this.popup&&this.popup.kind==='date'&&root.__budgetUi)root.__budgetUi.pick='';this.popup=null;this.paintOverlay();};
  Home.prototype.dateAct=async function(a){var p=this.popup;if(!p||p.kind!=='date')return;
    if(/^budget:pick:-?1$/.test(a)){var old=p.month;p.month=budgetShiftMonth(old,+a.split(':').pop());p.cursor=p.month+'-01';root.__budgetUi=Object.assign({},root.__budgetUi||{},{pick:old});
      if(root.__budgetChromeAct)root.__budgetChromeAct(a);else root.__budgetUi.pick=p.month;this.paintOverlay();this.status.textContent=monthTitle(p.month);return;}
    var d=a==='budget:pick:today'?budgetTodayKey():a.slice('budget:pickday:'.length);if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;
    this.close();if(root.__budgetChromeAct){root.__budgetChromeAct(a);await this.chain;}
    else {root.__budgetUi=Object.assign({},root.__budgetUi||{},{month:d.slice(0,7),day:d,pick:''});await this.update();}
    this.status.textContent='Selected '+dayTitle(d);
  };
  Home.prototype.act=async function(a,kind,n){if(!a||this.dead)return;
    if(a==='journal:date'){this.openDate(n,false);return;}
    if(a.indexOf('budget:pick')===0)return this.dateAct(a);
    if(a.indexOf('picker:')===0){var id=a.slice(7),pm=this.models.plan.kids.find(function(q){return q.t==='journal';}),r=pm.rows.find(function(q){return q.id===id;});if(!r||!r.choices.length)return;var t=this.targets.find(function(q){return q.node===n;});this.close();this.focusKey=t.key;this.popup={step:id,choices:r.choices,selected:r.selected,active:Math.max(0,r.choices.findIndex(function(c){return c.ref===r.selected;})),rect:[Math.max(this.positions.plan[0],Math.min(this.positions.plan[0]+this.positions.plan[2]-Math.min(250,this.positions.plan[2]),t.rect[0])),t.rect[1]+t.rect[3]+4,Math.min(250,this.positions.plan[2])]};this.paintOverlay();this.status.textContent='Alternatives for '+r.name;return;}
    if(a.indexOf('choose:')===0&&this.popup){if(this.selecting)return;this.selecting=true;try {var p=this.popup,ref=a.slice(7),ops=selectionOps(this.atlas,p.step,ref);if(!ops.length){this.close();return;}var ent=await submitViews(ops,'plan:select',this.context);if(!ent||ent.ok===false||(ent.r&&ent.r.ok===false)){this.status.textContent='Selection was not accepted.';return;}this.close();await this.update();this.status.textContent='Plan updated. Current step preserved.';return;}finally{this.selecting=false;}}
    if(this.popup){this.close();return;}
    if(a.indexOf('nav:')===0){if(this.o.onNavigate)this.o.onNavigate(a.slice(4),budgetDateKey());return;}
    if(a.indexOf('date:')===0){root.__budgetUi=Object.assign({},root.__budgetUi||{},{day:a.slice(5),month:a.slice(5,12)});if(this.o.onNavigate)this.o.onNavigate('calendar',a.slice(5));return;}
    if(a.indexOf('month:')===0){var old=budgetMonthKey(),next=budgetShiftMonth(old,+a.slice(6));root.__budgetUi=Object.assign({},root.__budgetUi||{},{month:next,day:next+'-01'});var cid=this.atlas.meta.calId,ops=[{path:'components/'+cid+'/view/month',op:'set',value:next}];await submitViews(ops,'calendar:month',this.context);return this.update();}
  };
  Home.prototype.key=function(e){if(!this.targets)return;var p=this.popup;
    if(p&&p.kind==='date'){
      if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();this.close();return;}
      p.hover=false;this.cancelClose();
      if(e.key==='PageUp'||e.key==='PageDown'){e.preventDefault();return this.dateAct('budget:pick:'+(e.key==='PageUp'?-1:1));}
      var inc={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7}[e.key];
      if(inc||e.key==='Home'||e.key==='End'){e.preventDefault();var d=new Date(p.cursor+'T12:00:00');if(inc)d.setDate(d.getDate()+inc);else d=new Date(p.month+'-01T12:00:00');
        p.cursor=e.key==='End'?root.JAtlasEval.monthDays(p.month).slice(-1)[0]:d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');p.month=p.cursor.slice(0,7);root.__budgetUi.pick=p.month;this.paintOverlay();this.status.textContent=dayTitle(p.cursor);return;}
      if(e.key==='Enter'||e.key===' '){e.preventDefault();return this.dateAct('budget:pickday:'+p.cursor);}return;
    }
    if(p){if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();this.close();return;}if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Home'||e.key==='End'){e.preventDefault();p.active=e.key==='Home'?0:e.key==='End'?p.choices.length-1:(p.active+(e.key==='ArrowDown'?1:-1)+p.choices.length)%p.choices.length;this.status.textContent=p.choices[p.active].name;this.paintOverlay();return;}if(e.key==='Enter'||e.key===' '){e.preventDefault();return this.act('choose:'+p.choices[p.active].ref,'selector');}return;}
    if(e.key==='Tab'){var i=this.targets.findIndex(function(t){return t.key===this.focusKey;},this),next=i+(e.shiftKey?-1:1);if(next<0||next>=this.targets.length){this.focusKey=null;this.paintOverlay();return;}e.preventDefault();this.focusKey=this.targets[next].key;this.status.textContent=this.targets[next].node.vm.label;this.paintOverlay();}
    else if(e.key==='Enter'||e.key===' '){var t=this.targets.find(function(t){return t.key===this.focusKey;},this);if(t){e.preventDefault();this.act(t.node.vm.act,t.kind,t.node);}}
  };
  Home.prototype.dispose=function(){this.dead=true;this.cancelClose();if(this.popup&&this.popup.kind==='date'&&root.__budgetUi)root.__budgetUi.pick='';this.popup=null;this.serial++;if(this.session)this.session.dispose();if(this.resize)this.resize.disconnect();this.abort.abort();if(root.__exp7ViewsPropose&&root.__exp7ViewsPropose[this.id]===this.proposalHook)delete root.__exp7ViewsPropose[this.id];Object.keys(this.views).forEach(function(k){var v=this.views[k];if(v.scene&&v.scene.h)v.scene.free();},this);if(this.r)this.r.destroy();if(this.cv)this.cv.remove();if(this.status)this.status.remove();};
  var api={bindFullDate:bindFullDate,tokens:journalTokens,fullModel:fullModel,datePicker:datePicker,calendarModel:calendarModel,planModel:planModel,ledgerModel:ledgerModel,selectionOps:selectionOps,layout:layout,overlay:overlay,model:model,Home:Home,colors:C,mount:function(o){var h=new Home(o);h.ready=h.init();return h;}};
  root.Exp7Journal=api;root.Exp7Views.journal=api;
})(typeof window!=='undefined'?window:globalThis);
