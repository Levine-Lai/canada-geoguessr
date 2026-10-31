(() => {
  'use strict';
  const provinces=window.AREA_PROVINCES;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const zones=[
    {id:'09',name:'西北',place:'nw',ids:[65,63,62,64,61],line:'陕甘宁青新',hint:'091 陕 · 093/094 甘 · 095 宁 · 097 青 · 090/099 新'},
    {id:'03',name:'华北 · 河南',place:'north',ids:[13,14,41],line:'冀晋豫',hint:'031/033 冀 · 034/035 晋 · 037/039 豫'},
    {id:'04',name:'东北 · 内蒙古',place:'ne',ids:[15,23,22,21],line:'东北三省 + 内蒙古',hint:'041/042 辽 · 043 吉 · 045/046 黑 · 047/048 蒙'},
    {id:'08',name:'西南 · 海南',place:'sw',ids:[54,51,53,52,46],line:'川黔滇藏琼',hint:'081—083 川 · 085 黔 · 087/088 滇 · 089 藏琼'},
    {id:'07',name:'中南',place:'south',ids:[42,43,36,45,44],line:'两湖、江西、两广',hint:'071/072 鄂 · 073/074 湘 · 075/076 粤 · 077 桂 · 079/070 赣'},
    {id:'05',name:'华东五省',place:'east',ids:[37,32,34,33,35],line:'苏浙皖闽鲁',hint:'051/052 苏 · 053/054 鲁 · 055/056 皖 · 057/058 浙 · 059 闽'}
  ];
  const supplements=[{id:37,base:'05',code:'063',short:'鲁'},{id:44,base:'07',code:'066',short:'粤'},{id:53,base:'08',code:'069',short:'滇'}];
  const shortCities=[['020','广州',44],['021','上海',31],['022','天津',12],['023','重庆',50],['024','沈阳等',21],['025','南京',32],['027','武汉',42],['028','成都等',51],['029','西安等',61]];
  const exceptions={'09':'西安、咸阳 029','04':'沈阳等 024','08':'成都、眉山、资阳 028','07':'武汉 027 · 广州 020','05':'南京 025'};
  let current,recall=false;
  const revealed=new Set();
  const province=id=>provinces.find(p=>p.id===id);
  const match=(p,prefix)=>p.rows.some(r=>(current.prefix==='all'||r.code.startsWith(prefix))&&(!current.query||(p.name+r.code+r.city).includes(current.query)));
  const activeZone=z=>current.prefix==='all'||current.prefix===z.id||(current.prefix==='06'&&z.ids.some(id=>supplements.some(s=>s.id===id)));
  function render(state){
    current=state;
    const board=zones.map(z=>{
      const muted=!activeZone(z)||(state.query&&!z.ids.some(id=>match(province(id),state.prefix==='06'?'06':z.id)));
      const hidden=recall&&!revealed.has(z.id);
      return `<article class="memory-zone ${muted?'zone-muted':''} ${hidden?'names-covered':''}" style="--zone-color:var(--g${z.id})" data-zone="${z.id}"><div class="zone-circle"><div class="zone-heading"><button class="zone-prefix" data-prefix="${z.id}" aria-label="学习 ${z.id} 开头">${z.id}</button><h2>${z.name}</h2></div><div class="zone-members">${z.ids.map(id=>{
        const p=province(id),extra=supplements.find(s=>s.id===id),matchesQuery=!state.query||match(p,state.prefix==='06'?'06':z.id);
        return `<button class="zone-province ${extra?'has-supplement':''} ${matchesQuery?'':'member-muted'}" ${hidden?`data-reveal-zone="${z.id}" aria-label="揭晓 ${z.id} 的省份"`:`data-open-province="${id}" data-group="${z.id}"`}><span class="province-answer">${p.name}</span><span class="province-mask" aria-hidden="true">?</span>${extra?`<small class="supplement-tag">另有 ${extra.code}</small>`:''}</button>`;
      }).join('')}</div>${hidden?`<button class="reveal-zone" data-reveal-zone="${z.id}">揭晓省名</button>`:`<span class="zone-mnemonic">${z.line}</span>`}</div><p class="zone-hint">${z.hint}${exceptions[z.id]?`<span class="zone-exception">另记 ${exceptions[z.id]}</span>`:''}</p></article>`;
    }).join('');
    document.querySelector('#memory-view').innerHTML=`
      <div class="memory-heading"><div><h2>六个区域，按方位记</h2><p>北方 09 → 03 → 04；南方 08 → 07 → 05</p></div><button class="outline recall-toggle" data-recall-toggle="true" aria-pressed="${recall}">${recall?'显示全部省名':'遮住省名'}</button></div>
      <div class="memory-geography" aria-label="按大致方位排列的六个区号分区"><span class="orientation">北 ↑ <small>方位示意</small></span>${board}<span class="orientation-south">南 ↓</span></div>
      <section class="supplement-section ${state.prefix!=='all'&&state.prefix!=='06'?'section-muted':''}" aria-labelledby="supplement-title"><div class="memory-section-head"><button class="exception-number" data-prefix="06">06</button><div><h2 id="supplement-title">补充区号，只记「鲁粤滇」</h2><p>这三个省份同时出现在原分区和 06 组里</p></div></div><div class="supplement-branches">${supplements.map(s=>{
        const p=province(s.id),rows=p.rows.filter(r=>r.code.startsWith('06'));
        return `<article class="supplement-branch"><div class="branch-origin"><b>${s.base}</b><span>→</span><button data-open-province="${s.id}" data-group="06">${p.name}<small>${s.short}</small></button><span>+</span><strong>${s.code}</strong></div><div class="branch-cities">${rows.map(r=>`<span>${r.city.replace('州','')} <b>${r.code}</b></span>`).join('')}</div></article>`;
      }).join('')}</div></section>
      <section class="short-code-section ${state.prefix!=='all'&&!['01','02'].includes(state.prefix)?'section-muted':''}" aria-labelledby="short-code-title"><div class="memory-section-head"><span class="exception-number short-number">01<br>02</span><div><h2 id="short-code-title">北京 010；02 记城市</h2><p>020—029，跳过未启用的 026</p></div></div><div class="short-code-strip"><button class="beijing-code" data-open-province="11" data-group="01"><b>010</b><span>北京</span></button>${shortCities.map(([code,city,id])=>`<button data-open-province="${id}" data-group="02"><b>${code}</b><span>${city}</span></button>`).join('')}</div><p class="shared-code-note">024：沈阳、抚顺、铁岭、本溪　·　028：成都、眉山、资阳　·　029：西安、咸阳</p></section>`;
  }
  document.addEventListener('click',e=>{
    const toggle=e.target.closest('[data-recall-toggle]'),reveal=e.target.closest('[data-reveal-zone]');
    if(toggle){recall=!recall;revealed.clear();render(current);}
    else if(reveal){revealed.add(reveal.dataset.revealZone);render(current);}
  });
  window.AREA_MEMORY={render};
})();
