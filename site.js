(() => {
  'use strict';
  const root=new URL('.',document.currentScript.src);
  window.KB={root:root.href,url:path=>new URL(path,root).href};
  const toggle=document.querySelector('.kb-menu-toggle'),scrim=document.querySelector('.kb-scrim'),sidebar=document.querySelector('.kb-sidebar'),content=document.querySelector('.kb-content');
  function setMenu(open){
    document.body.classList.toggle('kb-nav-open',open);toggle?.setAttribute('aria-expanded',String(open));toggle?.setAttribute('aria-label',open?'关闭导航':'打开导航');
    if(content)content.inert=open;
    if(open){sidebar.setAttribute('role','dialog');sidebar.setAttribute('aria-modal','true');sidebar.setAttribute('aria-label','站点导航');sidebar.querySelector('.kb-nav [aria-current="page"]')?.focus();}
    else{sidebar?.removeAttribute('role');sidebar?.removeAttribute('aria-modal');sidebar?.removeAttribute('aria-label');toggle?.focus({preventScroll:true});}
  }
  toggle?.addEventListener('click',()=>setMenu(!document.body.classList.contains('kb-nav-open')));
  scrim?.addEventListener('click',()=>setMenu(false));
  document.addEventListener('keydown',e=>{
    if(!document.body.classList.contains('kb-nav-open'))return;
    if(e.key==='Escape')setMenu(false);
    if(e.key==='Tab'){const links=[...sidebar.querySelectorAll('a')],first=links[0],last=links[links.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  document.querySelector('.kb-skip')?.addEventListener('click',e=>{e.preventDefault();const main=document.querySelector('main');main.tabIndex=-1;main.focus();main.scrollIntoView({block:'start'});});
  window.addEventListener('resize',()=>{if(innerWidth>900&&document.body.classList.contains('kb-nav-open'))setMenu(false);});
})();
