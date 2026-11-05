(() => {
  'use strict';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=s=>String(s).replace(/\s/g,'').toUpperCase();
  const input=document.querySelector('#kb-search'),panel=document.querySelector('#knowledge-results');
  const provinceNames=new Map(AREA_PROVINCES.map(p=>[p.id,p.name]));
  const municipalIds=[11,12,31,50];
  const records=[...REGIONS.map(r=>({title:r.name,detail:'加拿大 · '+r.group+' · '+r.en,code:r.id,text:r.name+r.en+r.id+r.group+r.tag,url:KB.url('canada/#study/'+r.id+'/panorama')})),...municipalIds.map(id=>{const c=AREA_PLATE_DATA.cities.find(c=>c.province===id),name=provinceNames.get(id);return {title:name,detail:'中国 · '+c.plate,code:c.code,text:name+c.code+c.plate,municipal:AREA_PLATE_DATA.abbreviations[id],url:KB.url('china/?view=map&province='+id)};}),...AREA_PLATE_DATA.cities.map(c=>({title:c.label,detail:'中国 · '+provinceNames.get(c.province)+' · '+c.plate,code:c.code,text:provinceNames.get(c.province)+c.name+c.label+c.code+c.plate+c.note,url:KB.url('china/?view=map&province='+c.province+'&city='+c.id)}))];
  document.querySelector('#province-directory').innerHTML=REGIONS.map(r=>`<a href="${KB.url('canada/#study/'+r.id+'/panorama')}"><span class="link-code">${r.id}</span>${esc(r.name)}</a>`).join('');
  function render(){
    const q=normalize(input.value);panel.hidden=!q;if(!q){panel.innerHTML='';return;}
    const matches=records.filter(r=>normalize(r.text).includes(q)||(r.municipal&&new RegExp('^'+r.municipal+'[A-HJ-NP-Z]$').test(q)));
    panel.innerHTML=`<div class="search-summary"><span role="status">${matches.length>12?'前 12 条 / ':''}${matches.length} 条结果</span><button id="clear-knowledge-search">清除</button></div>`+(matches.length?matches.slice(0,12).map(r=>`<a class="search-result" href="${r.url}"><span><strong>${esc(r.title)}</strong><small>${esc(r.detail)}</small></span><span class="search-result-code">${esc(r.code)}</span></a>`).join(''):'<p class="search-empty">没有匹配结果</p>');
    document.querySelector('#clear-knowledge-search').addEventListener('click',()=>{input.value='';render();input.focus();});
  }
  input.addEventListener('input',render);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=panel.querySelector('.search-result');if(first)location.href=first.href;}if(e.key==='Escape'){input.value='';render();}});
  document.addEventListener('keydown',e=>{if(e.key==='/'&&!e.target.matches('input,textarea,select')){e.preventDefault();input.focus();}});
  // Old Canada chapter links continue to open the same chapter after the homepage split.
  if(/^#(study\/|courses$|atlas$|scenes$|meta$|reading$|sources$)/.test(location.hash))location.replace(KB.url('canada/'+location.hash));
})();
