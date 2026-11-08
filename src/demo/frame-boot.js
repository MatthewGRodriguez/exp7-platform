(function(){window.__exp7FrameBoot={t0:performance.now()};
function pub(msg){const p=Object.assign({source:'exp7-app',v:1},msg);try{parent.postMessage(p,'*')}catch(e){}try{window.dispatchEvent(new CustomEvent('exp7-app-signal',{detail:p}))}catch(e){}
 if(p.type==='exp7-app-error'){const bs=document.getElementById('bootStatus'); if(bs){bs.hidden=false; bs.textContent='Exp7 boot error: '+String(p.error||'unknown');}}
}
window.__exp7Pub=pub;
window.addEventListener('error',function(e){pub({type:'exp7-app-error',early:true,error:String((e&&e.message)||e)});});
window.addEventListener('unhandledrejection',function(e){pub({type:'exp7-app-error',early:true,error:'unhandled rejection: '+String((e&&e.reason&&e.reason.message)||(e&&e.reason)||e)});});
})();