#!/usr/bin/env python3
"""Rebuild the review artifact from its explicitly pinned, unchanged release base."""
from pathlib import Path
import base64,re,subprocess
ROOT=Path(__file__).resolve().parents[2]
TARGET='exp7-platform/exp7-platform-lean.html'
BASE='08315726b9a3f5c4da20ecc16d63b9f714116853'
s=subprocess.check_output(['git','show',BASE+':'+TARGET],cwd=ROOT).decode()
def swap(a,b):
 global s
 assert s.count(a)==1,(a[:90],s.count(a))
 s=s.replace(a,b,1)
swap("if(AW&&AW.meta&&AW.meta.budget) kids.push(budgetChromeVM(V,AW,O));", "if(AW&&AW.meta&&AW.meta.budget&&(O.budget.facts||O.budget.tabs)) kids.push(budgetChromeVM(V,AW,O));")
for fn,arg,pred,call in [
 ('calVM','o=O.calendar','o.presentation===\'mini\'||o.presentation===\'agenda\'','calendarModel(V,A,c,O)'),
 ('boardVM','o=O.board',"o.presentation==='ledger'",'ledgerModel(V,A,c,O)'),
 ('planVM','o=O.plan',"o.presentation==='compact'",'planModel(V,A,c,O)')]:
 pattern=r'(function '+fn+r'\(V,A,c,O\)\{[^\n]*\n)'
 m=re.search(pattern,s);assert m
 s=s[:m.end()]+"  if(window.Exp7Journal&&("+pred+")) return window.Exp7Journal."+call+";\n"+s[m.end():]
swap('var inset = 14 * D, H = 0, cy = inset;', 'var inset = (model.inset == null ? 14 : +model.inset) * D, H = 0, cy = inset;')
swap('L.forEach(function (a) { atom(a.c, key + \'/\' + a.c.k, ax, cy, a.w, lh, owner); ax += a.w + gap; });', 'L.forEach(function (a,ai) { if(nm.alignLast===\'end\'&&ai===L.length-1) ax=Math.max(ax,x+w-a.w); atom(a.c, key + \'/\' + a.c.k, ax, cy, a.w, lh, owner); ax += a.w + gap; });')
# Keep one item emitter and one picker model for both composed and full views.
swap('window.JRViews={layout,View,boot,core,','window.JRViews={layout,items,View,boot,core,')
swap('return {__vm:true,tokens:vmTokens(V,first),kids}; }',
     'const model={__vm:true,tokens:vmTokens(V,first),kids}; return AW&&AW.meta&&AW.meta.budget&&window.Exp7Journal?window.Exp7Journal.fullModel(model,V):model; }')
a=s.index('    if(pick){ const y=+pick.slice(0,4)',s.index('function budgetChromeVM'))
z=s.index('  if(o.tabs)',a)
s=s[:a]+"    if(pick) kids.push(window.Exp7Journal.datePicker(pick,date)); }\n"+s[z:]
swap("[['cal','Calendar'],['brd','Board'],['plan','Plan']]", "[['home','Home'],['cal','Calendar'],['brd','Board'],['plan','Plan']]")
anchor='<script>\n/* PlatformChromeJR profile-photo consumer'
module=Path(__file__).with_name('journal-views.js').read_text()
swap(anchor,'<script data-exp7-shared="journal-views">\n'+module+'\n</script>\n'+anchor)
m=re.search(r'(<script[^>]*id="budgetpkg"[^>]*>)([\s\S]*?)(</script>)',s);assert m
b=base64.b64decode(m[2]).decode()
def bswap(a,z):
 global b
 assert b.count(a)==1,(a[:90],b.count(a))
 b=b.replace(a,z,1)
bswap('  var TAB = \'cal\';',"  var TAB = 'home';")
bswap('  var surface = null;','  var surface = null;\n  var home = null;')
bswap('  <button data-t="cal" class="on">Calendar</button>','  <button data-t="home" class="on">Home</button>\n  <button data-t="cal">Calendar</button>')
bswap('<section id="budget-t-cal" class="on">','<section id="budget-t-home" class="on"><div id="budget-vf-home" class="jrv"></div></section>\n<section id="budget-t-cal">')
bswap('  function disposeViews() {','  function disposeViews() {\n    if (home) { home.dispose(); home = null; }')
bswap('    syncBudgetUi();\n    showTab(TAB);','''    syncBudgetUi();
    if (home) home.update(W);
    else {
      home = window.Exp7Views.journal.mount({host:$('budget-vf-home'), atlas:W,
        onPropose:onPropose, onNavigate:navigateFromHome,
        onError:function(e){ setBootStatus('Budget Home: '+String(e.message||e),false); },
        onUpdate:function(){ scheduleChromeMode(); }});
      home.ready.catch(function(e){setBootStatus('Budget Home: '+String(e.message||e),false);});
    }
    showTab(TAB);''')
bswap('  function showTab(t) {','''  function navigateFromHome(kind,day) {
    if (day) window.__budgetUi=Object.assign({},window.__budgetUi||{},{day:day,month:day.slice(0,7)});
    if (kind==='calendar'||kind==='agenda') {
      showTab('cal');
      var v=window.JVS&&window.JVS['budget-vf-cal'];
      if(v){ var nav=window.calNavOf(v); nav.level=kind==='agenda'?'day':'month';nav.day=kind==='agenda'?day:null;
        var sel=window.calSelOf(v); sel.selected={};if(day)sel.selected[day]=1;sel.anchor=day;
        if(v.sess&&v.queue)v.queue(v.sess,'home-navigation'); }
    } else if(kind==='ledger'){showTab('brd');showBoardTab('expense');}
    else if(kind==='plan')showTab('plan');
    redrawChromeViews();
  }
  function showTab(t) {
    if (['home','cal','brd','plan'].indexOf(t)<0) t='home';
    if (home && t!=='home') home.close();''')
bswap("    ['cal', 'brd', 'plan'].forEach(function (k) {", "    ['home', 'cal', 'brd', 'plan'].forEach(function (k) {")
bswap("    if (t === 'brd') showBoardTab(BOARD_TAB);", "    if (t === 'home' && home) home.update(W);\n    if (t === 'brd') showBoardTab(BOARD_TAB);")
bswap('  function refreshChromeMode() {','''  function refreshChromeMode() {
    if(TAB==='home'){
      ['budgetTabs','boardTypeTabs','budgetFacts'].forEach(function(id){var el=$(id);if(el)el.style.setProperty('display','none','important');});
      return;
    }''')
bswap("      showTab('cal');\n      window.budget =", "      showTab('home');\n      window.budget =")
bswap('        persist: persist,','        persist: persist,\n        home: function(){return home;},\n        navigateHome: function(){showTab(\'home\');},')
bswap('      setBootStatus(null, true);',"      await home.ready;\n      await home.chain;\n      if(!home.painted||home.error)throw new Error(home.error||'Home has not drawn');\n      setBootStatus(null, true);")
bswap("tabs: 3, boards: 4, sectionOn: 't-cal'", "tabs: 4, boards: 4, sectionOn: 't-home'")
bswap("    refreshChromeMode();\n    try { if (window.Exp7Slabs", "    if (home) home.update(W);\n    refreshChromeMode();\n    try { if (window.Exp7Slabs")
# Keep a readable source alongside the packaged version. No user atlas is embedded.
Path(__file__).with_name('budget-consumer.html').write_text(b)
s=s[:m.start(2)]+base64.b64encode(b.encode()).decode()+s[m.end(2):]
(ROOT/TARGET).write_text(s)
print('Built actual release shell with journal presentations and embedded Budget consumer:',ROOT/TARGET)
