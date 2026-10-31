(() => {
  'use strict';
  const provinces = window.AREA_PROVINCES, groups = window.AREA_GROUPS;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = {view:'memory',prefix:'all',province:44,query:''};
  const rowClass = r => r.code.startsWith('06') ? 'extra' : r.code.length===3 ? 'special' : '';
  const matches = (p,r) => (state.prefix==='all'||r.code.startsWith(state.prefix)) && (!state.query || (p.name+r.code+r.city).includes(state.query));
  const rowsFor = p => p.rows.filter(r=>matches(p,r)).sort((a,b)=>a.code.localeCompare(b.code));
  const visibleProvinces = () => provinces.filter(p=>rowsFor(p).length);
  const countCodes = ps => new Set(ps.flatMap(p=>rowsFor(p).map(r=>r.code))).size;
  const groupColor = id => `var(--g${id})`;
  function renderControls(){
    $('#prefixes').innerHTML = [['all','全部'],...groups.map(g=>[g.id,g.id])].map(([id,label])=>`<button data-prefix="${id}" aria-pressed="${state.prefix===id}" class="${id===state.prefix?'active ':''}${['06','07','08'].includes(id)?'important':''}">${label}</button>`).join('');
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
    ['memory','map','circles','table'].forEach(v=>$(`#${v}-view`).hidden=v!==state.view);
    $('#main').dataset.currentView=state.view;
    $('#main').dataset.memoryFiltered=state.prefix!=='all'||Boolean(state.query);
    const g=groups.find(g=>g.id===state.prefix), ps=visibleProvinces();
    $('#focus-band').innerHTML=`<span class="focus-number">${g?g.id:'0x'}</span><div class="focus-copy"><h2>${g?esc(g.title):'01—09 · 全国区号'}</h2><p>${state.query?`搜索「${esc(state.query)}」 · `:''}${g?esc(g.memory):'03 华北 · 04 东北 · 05 华东 · 07 中南 · 08 西南 · 09 西北'}</p></div><span class="focus-count">${ps.length} 省份 / ${countCodes(ps)} 区号</span>`;
  }
  const mapOverrides={11:[466,183],12:[501,220],13:[439,222],14:[414,254],31:[571,325],32:[507,290],34:[481,332],35:[510,399],36:[471,377],37:[488,255],50:[381,347],62:[321,242],64:[358,249],46:[408,501]};
  const extras=[
    [37,'威海','0631',[122.12,37.51],19,-15],[37,'枣庄','0632',[117.32,34.81],-36,23],[37,'日照','0633',[119.53,35.42],15,17],[37,'聊城','0635',[115.98,36.46],-43,-12],
    [44,'汕尾','0660',[115.36,22.78],12,16],[44,'阳江','0662',[111.98,21.86],-22,26],[44,'揭阳','0663',[116.37,23.55],22,-8],[44,'茂名','0668',[110.92,21.66],-42,7],
    [53,'西双版纳','0691',[100.8,22.01],0,22],[53,'德宏','0692',[98.58,24.43],-42,0]
  ];
  const specials=[
    [11,'北京','010',[116.4,39.9],-10,-8],[31,'上海','021',[121.47,31.23],10,3],[12,'天津','022',[117.2,39.12],12,1],[50,'重庆','023',[106.55,29.56],-15,18],
    [21,'沈阳等','024',[123.43,41.8],14,3],[32,'南京','025',[118.8,32.06],-10,-10],[42,'武汉','027',[114.3,30.59],20,-5],[51,'成都等','028',[104.07,30.67],-18,-10],[61,'西安等','029',[108.94,34.34],-18,-10],[44,'广州','020',[113.26,23.13],-8,-11]
  ];
  function project([lon,lat]){const p=window.AREA_MAP.projection,r=Math.PI/180,rho=Math.sqrt(p.c-2*p.n*Math.sin(lat*r))/p.n,theta=p.n*(lon-105)*r;return [(rho*Math.sin(theta)-p.minx)*p.scale+22,(p.maxy-(p.rho0-rho*Math.cos(theta)))*p.scale+15];}
  function renderMap(){
    const ids=new Set(visibleProvinces().map(p=>p.id));
    const paths=window.AREA_MAP.features.map(f=>{
      const p=provinces.find(p=>p.id===f.id), active=ids.has(f.id), pos=mapOverrides[f.id]||f.center;
      const label=p?p.name:f.name.replace(/省|特别行政区/g,'');
      const subtitle=p?(state.prefix==='06'?'06 + '+p.main:p.main):'';
      return `<g class="${active||!p?'':'faded'}"><path d="${f.path}" class="province-shape ${state.province===f.id?'selected':''}" style="fill:${p?groupColor(p.main):'var(--neutral)'}" ${p?`role="button" tabindex="0" data-province="${p.id}" aria-label="${esc(p.name)}，${esc(p.pattern)}"`:''}><title>${esc(label)} ${p?esc(p.pattern):'独立编号体系'}</title></path>${label&&f.id!==81&&f.id!==82&&(active||state.prefix==='all')?`${[11,12,31].includes(f.id)?`<line x1="${f.center[0]}" y1="${f.center[1]}" x2="${pos[0]}" y2="${pos[1]}" stroke="var(--muted)" stroke-width=".5"></line>`:''}<text x="${pos[0]}" y="${pos[1]}" class="province-label">${esc(label)}${subtitle?`<tspan x="${pos[0]}" dy="15">${subtitle}</tspan>`:''}</text>`:''}</g>`;
    }).join('');
    const markers=[...extras.map(d=>[...d,'extra']),...specials.map(d=>[...d,'special'])].filter(([id,city,code])=>(state.prefix==='all'||code.startsWith(state.prefix))&&(!state.query||(provinces.find(p=>p.id===id).name+city+code).includes(state.query))).map(([id,city,code,ll,dx,dy,type])=>{
      const [x,y]=project(ll),showLabel=state.prefix!=='all'||state.query;
      return `<g class="marker-group" role="button" tabindex="0" data-province="${id}" aria-label="${city} ${code}"><title>${city} ${code}</title><circle class="map-dot ${type==='special'?'special-dot':''}" cx="${x}" cy="${y}" r="${state.prefix==='06'?4.5:3.5}"></circle>${showLabel?`<text class="marker-label" x="${x+dx}" y="${y+dy}" text-anchor="middle">${code}</text>`:''}</g>`;
    }).join('');
    // Southern islands are shown in a separate inset using the same source geometry.
    $('#map-holder').innerHTML=`<svg class="china-map" viewBox="0 0 810 530" aria-label="中国电话区号分布地图"><g>${paths}</g>${markers}<g class="south-sea"><rect x="716" y="378" width="78" height="132" rx="2" fill="none" stroke="var(--line)"></rect><path d="${window.AREA_MAP.inset}" fill="var(--neutral)" stroke="var(--muted)" stroke-width=".5"></path><text x="755" y="522" class="province-label" style="font-size:9px">南海诸岛</text></g></svg>`;
  }
  function renderDetail(){
    const ps=visibleProvinces();
    if(!ps.length){$('#detail').innerHTML='<h2>没有匹配结果</h2><p class="detail-empty">换个城市、省份或区号试试。</p><button class="outline" data-reset="true">清除筛选</button>';return;}
    let p=ps.find(p=>p.id===state.province)||ps[0];state.province=p.id;
    const rows=rowsFor(p);
    const notes={37:'063 是山东的补充区号。原莱芜 0634 已并入济南 0531。',44:'广东同时有 020、07 和 06 三组。汕头 0754 ≠ 汕尾 0660。',53:'云南多数城市用 08；西双版纳 0691、德宏 0692 单独记。',42:'武汉用 027；鄂州主要用 0711，华容区有使用 027 的区域。',51:'成都、眉山、资阳共用 028；四川其余主要本地网以 08 开头。',52:'贵阳、遵义、安顺共用 0851。旧 0852、0853 已停用。',43:'长沙、株洲、湘潭共用 0731。旧 0732、0733 已停用。',21:'沈阳、抚顺、铁岭、本溪共用 024。',46:'海南全省统一使用 0898。',61:'西安、咸阳共用 029。'};
    $('#detail').innerHTML=`<span class="kicker">${state.prefix==='all'?'省份区号':state.prefix+' 开头'} / ${new Set(rows.map(r=>r.code)).size} 个区号</span><h2>${p.name}</h2><span class="pattern">${esc(p.pattern)}</span><div class="province-picker"><select id="province-select" aria-label="选择省份">${ps.map(q=>`<option value="${q.id}" ${p.id===q.id?'selected':''}>${q.name}</option>`).join('')}</select></div><div class="detail-rows">${rows.map(r=>`<div class="detail-row ${rowClass(r)}"><b>${r.code}</b><span>${esc(r.city)}</span></div>`).join('')}</div>${notes[p.id]?`<p class="small-note">${notes[p.id]}</p>`:''}`;
  }
  function renderCircles(){
    const gs=groups.filter(g=>state.prefix==='all'||state.prefix===g.id);
    $('#circle-grid').classList.toggle('single',state.prefix!=='all');
    $('#circle-grid').innerHTML=gs.map(g=>{
      const order={'06':[37,44,53],'07':[42,43,36,44,45],'08':[51,52,53,54,46]};
      const ps=provinces.map(p=>({...p,groupRows:p.rows.filter(r=>r.code.startsWith(g.id)&&(!state.query||(p.name+r.city+r.code).includes(state.query)))})).filter(p=>p.groupRows.length).sort((a,b)=>order[g.id]?order[g.id].indexOf(a.id)-order[g.id].indexOf(b.id):a.id-b.id);
      if(!ps.length)return '';
      const units=g.id==='02'?ps.flatMap(p=>p.groupRows.map(r=>({id:p.id,name:r.city.split('、')[0],codes:r.code}))):ps.map(p=>({id:p.id,name:p.name,codes:g.id==='01'?'010':p.groupRows.map(r=>r.code.slice(0,3)).filter((v,i,a)=>a.indexOf(v)===i).join(' / ')}));
      return `<article class="circle-set ${['06','07','08'].includes(g.id)?'priority':''}" style="--group-color:${groupColor(g.id)}"><div class="circle-enclosure ${units.length>6?'dense':''}" role="group" aria-label="${g.id} 开头，包含${units.map(u=>u.name).join('、')}"><div class="enclosure-content"><button class="enclosure-code" data-prefix="${g.id}" aria-label="筛选 ${g.id} 开头">${g.id}</button><div class="contained-provinces">${units.map(u=>`<button class="contained-province" data-open-province="${u.id}" data-group="${g.id}"><span>${esc(u.name)}</span><small>${esc(u.codes)}</small></button>`).join('')}</div></div></div><h2 class="circle-caption">${g.title}</h2><div class="circle-list">${g.id==='06'?ps.map(p=>`<p><b>${p.name}</b> ${p.groupRows.map(r=>`${r.city} ${r.code}`).join(' · ')}</p>`).join(''):`<p>${esc(g.memory)}</p>`}</div></article>`;
    }).join('')||'<p class="empty-state">没有匹配结果，换个关键词试试。</p>';
  }
  function renderTable(){
    $('#table-body').innerHTML=visibleProvinces().map(p=>`<tr><td>${p.name}</td><td>${esc(p.pattern)}</td><td><div class="table-cities">${rowsFor(p).map(r=>`<span class="${rowClass(r)}"><b>${r.code}</b>${esc(r.city)}</span>`).join('')}</div></td></tr>`).join('')||'<tr><td colspan="3" class="empty-state">没有匹配结果</td></tr>';
  }
  function updateUrl(){const q=new URLSearchParams();q.set('view',state.view);if(state.prefix!=='all')q.set('prefix',state.prefix);if(state.province!==44)q.set('province',state.province);if(state.query)q.set('q',state.query);history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));}
  function render(){renderControls();renderDetail();renderMap();renderCircles();renderTable();window.AREA_MEMORY.render(state);updateUrl();$('#announcement').textContent=`${visibleProvinces().length} 个省份，${countCodes(visibleProvinces())} 个区号`;}
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-view],[data-prefix],[data-province],[data-open-province],[data-reset]');if(!b)return;
    if(b.dataset.view)state.view=b.dataset.view;
    if(b.dataset.prefix)state.prefix=b.dataset.prefix;
    if(b.dataset.province){const id=Number(b.dataset.province);if(!visibleProvinces().some(p=>p.id===id)){state.prefix='all';state.query='';$('#search').value='';}state.province=id;}
    if(b.dataset.openProvince){state.province=Number(b.dataset.openProvince);state.prefix=b.dataset.group;state.view='map';}
    if(b.dataset.reset){state.prefix='all';state.query='';$('#search').value='';}
    render();
    if(b.dataset.openProvince)$('#map-view').scrollIntoView({block:'start',behavior:'smooth'});
  });
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(e.key==='/'&&!e.target.matches('input,textarea')){e.preventDefault();$('#search').focus();}});
  $('#search').addEventListener('input',e=>{state.query=e.target.value.trim();render();});
  document.addEventListener('change',e=>{if(e.target.id==='province-select'){state.province=Number(e.target.value);render();}});
  $('#print').addEventListener('click',()=>window.print());
  const q=new URLSearchParams(location.search);if(['memory','map','circles','table'].includes(q.get('view')))state.view=q.get('view');else if(q.has('province'))state.view='map';if(groups.some(g=>g.id===q.get('prefix')))state.prefix=q.get('prefix');if(provinces.some(p=>p.id===Number(q.get('province'))))state.province=Number(q.get('province'));state.query=q.get('q')||'';$('#search').value=state.query;
  render();
})();
