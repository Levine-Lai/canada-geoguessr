(() => {
  'use strict';
  const provinces = window.AREA_PROVINCES, groups = window.AREA_GROUPS, plates=window.AREA_PLATES;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = {view:'map',prefix:'all',province:44,query:'',mapZoom:'country',mapCity:null};
  const rowClass = r => r.code.startsWith('06') ? 'extra' : r.code.length===3 ? 'special' : '';
  const matches = (p,r) => (state.prefix==='all'||r.code.startsWith(state.prefix)) && plates.matches(p,r,state.query);
  const rowsFor = p => p.rows.filter(r=>matches(p,r)).sort((a,b)=>a.code.localeCompare(b.code));
  const visibleProvinces = () => provinces.filter(p=>rowsFor(p).length);
  const countCodes = ps => new Set(ps.flatMap(p=>rowsFor(p).map(r=>r.code))).size;
  const groupColor = id => `var(--g${id})`;
  function renderControls(){
    $('#prefixes').innerHTML = [['all','全部'],...groups.map(g=>[g.id,g.id])].map(([id,label])=>`<button data-prefix="${id}" aria-pressed="${state.prefix===id}" class="${id===state.prefix?'active ':''}${['06','07','08'].includes(id)?'important':''}">${label}</button>`).join('');
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===state.view));
    ['map','table'].forEach(v=>$(`#${v}-view`).hidden=v!==state.view);
    $('#main').dataset.currentView=state.view;
    const g=groups.find(g=>g.id===state.prefix), ps=visibleProvinces();
    $('#focus-band').innerHTML=`<span class="focus-number">${g?g.id:'全'}</span><div class="focus-copy"><h2>${g?esc(g.title):'全国区号'}</h2>${g||state.query?`<p>${state.query?'搜索「'+esc(state.query)+'」':''}${g?(state.query?' · ':'')+esc(g.memory):''}</p>`:''}</div><span class="focus-count">${ps.length} 省份 / ${countCodes(ps)} 区号</span>`;
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
    const compact=matchMedia('(max-width:600px)').matches;
    const ids=new Set(visibleProvinces().map(p=>p.id));
    const paths=window.AREA_MAP.features.map(f=>{
      const p=provinces.find(p=>p.id===f.id), active=ids.has(f.id), pos=mapOverrides[f.id]||f.center;
      const label=p?(compact?plates.abbreviation(p.id):p.name):f.name.replace(/省|特别行政区/g,'');
      const subtitle=p&&!compact?(state.prefix==='06'?'06 + '+p.main:p.main):'';
      return `<g class="${active||!p?'':'faded'}"><path d="${f.path}" class="province-shape ${state.province===f.id?'selected':''}" style="fill:${p?groupColor(p.main):'var(--neutral)'}" ${p?`role="button" tabindex="0" data-province="${p.id}" aria-label="${esc(p.name)}，${esc(p.pattern)}"`:''}><title>${esc(label)} ${p?esc(p.pattern):'独立编号体系'}</title></path>${label&&f.id!==81&&f.id!==82&&(active||state.prefix==='all')?`${[11,12,31].includes(f.id)?`<line x1="${f.center[0]}" y1="${f.center[1]}" x2="${pos[0]}" y2="${pos[1]}" stroke="var(--muted)" stroke-width=".5"></line>`:''}<text x="${pos[0]}" y="${pos[1]}" class="province-label" style="font-size:${compact?30:14}px" ${p?`data-province="${p.id}" role="button" tabindex="-1" aria-label="放大${esc(p.name)}"`:''}>${esc(label)}${subtitle?`<tspan x="${pos[0]}" dy="15">${subtitle}</tspan>`:''}</text>`:''}</g>`;
    }).join('');
    const markers=[...extras.map(d=>[...d,'extra']),...specials.map(d=>[...d,'special'])].filter(([id,city,code])=>(state.prefix==='all'||code.startsWith(state.prefix))&&plates.matches(provinces.find(p=>p.id===id),{city,code},state.query)).map(([id,city,code,ll,dx,dy,type])=>{
      const [x,y]=project(ll),showLabel=state.prefix!=='all'||state.query;
      return `<g class="marker-group" role="button" tabindex="0" data-province="${id}" aria-label="${city} ${code}"><title>${city} ${code}</title><circle class="map-dot ${type==='special'?'special-dot':''}" cx="${x}" cy="${y}" r="${state.prefix==='06'?4.5:3.5}"></circle>${showLabel?`<text class="marker-label" x="${x+dx}" y="${y+dy}" text-anchor="middle">${code}</text>`:''}</g>`;
    }).join('');
    // Southern islands are shown in a separate inset using the same source geometry.
    window.AREA_CITY_MAP.render(state,`<svg class="china-map" viewBox="0 0 810 530" aria-label="中国电话区号分布地图"><g>${paths}</g>${markers}<g class="south-sea"><rect x="716" y="378" width="78" height="132" rx="2" fill="none" stroke="var(--line)"></rect><path d="${window.AREA_MAP.inset}" fill="var(--neutral)" stroke="var(--muted)" stroke-width=".5"></path><text x="755" y="522" class="province-label" style="font-size:9px">南海诸岛</text></g></svg>`);
  }
  function renderTable(){
    $('#table-body').innerHTML=visibleProvinces().map(p=>{
      const entries=rowsFor(p).flatMap(r=>plates.rows(p.id,r).filter(c=>plates.search(p.name+plates.abbreviation(p.id)+r.code,state.query)||plates.matchesCity({...c,code:r.code},state.query,p.id)).map(c=>({...c,code:r.code})));
      return entries.map((c,i)=>`<tr>${i===0?`<th class="table-province" scope="rowgroup" rowspan="${entries.length}"><button data-province="${p.id}" aria-label="在地图查看${p.name}"><span class="province-abbr">${plates.abbreviation(p.id)}</span><span>${p.name}</span></button><small>${esc(p.pattern)}</small></th>`:''}<td class="table-city">${esc(c.label)}</td><td class="table-phone ${rowClass(c)}"><b>${c.code}</b></td><td>${c.plate.split(' / ').map(code=>`<em class="plate-badge" title="${esc(c.note||'区域车牌前缀')}">${esc(code)}</em>`).join(' ')}</td></tr>`).join('');
    }).join('')||'<tr><td colspan="4" class="empty-state">没有匹配结果<button class="outline" data-reset="true">清除筛选</button></td></tr>';
  }
  function updateUrl(){const q=new URLSearchParams();q.set('view',state.view);if(state.prefix!=='all')q.set('prefix',state.prefix);if(state.province!==44||(state.view==='map'&&state.mapZoom==='province'))q.set('province',state.province);if(state.view==='map')q.set('zoom',state.mapZoom);if(state.mapCity&&state.view==='map')q.set('city',state.mapCity);if(state.query)q.set('q',state.query);history.replaceState(null,'',location.pathname+(q.size?'?'+q:''));}
  function render(){
    if(state.prefix!=='all'||state.query){const ps=visibleProvinces();if(ps.length&&!ps.some(p=>p.id===state.province)){state.province=ps[0].id;state.mapCity=null;}}
    renderControls();
    if(state.view==='map')renderMap();else renderTable();
    updateUrl();$('#announcement').textContent=`${visibleProvinces().length} 个省份，${countCodes(visibleProvinces())} 个区号`;
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-view],[data-prefix],[data-province],[data-reset],[data-map-back],[data-map-retry],[data-city]');if(!b)return;
    if(b.dataset.view)state.view=b.dataset.view;
    if(b.dataset.prefix)state.prefix=b.dataset.prefix;
    if(b.dataset.province){state.view='map';const id=Number(b.dataset.province);if(!visibleProvinces().some(p=>p.id===id)){state.prefix='all';state.query='';$('#search').value='';}state.province=id;state.mapZoom='province';state.mapCity=null;}
    if(b.dataset.city){state.mapCity=Number(b.dataset.city);state.mapZoom='province';}
    if(b.dataset.mapBack){state.mapZoom='country';state.mapCity=null;}
    if(b.dataset.reset){state.prefix='all';state.query='';$('#search').value='';}
    render();
  });
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [role="button"]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}if(e.key==='/'&&!e.target.matches('input,textarea')){e.preventDefault();$('#search').focus();}});
  $('#search').addEventListener('input',e=>{state.query=e.target.value.trim();render();});
  document.addEventListener('change',e=>{if(['province-select','map-province-select'].includes(e.target.id)&&e.target.value){state.province=Number(e.target.value);state.mapZoom='province';state.mapCity=null;if(!visibleProvinces().some(p=>p.id===state.province)){state.prefix='all';state.query='';$('#search').value='';}render();}});
  matchMedia('(max-width:600px)').addEventListener('change',()=>{if(state.view==='map')renderMap();});
  $('#print').addEventListener('click',()=>window.print());
  const q=new URLSearchParams(location.search);if(['map','table'].includes(q.get('view')))state.view=q.get('view');else if(q.has('province'))state.view='map';if(groups.some(g=>g.id===q.get('prefix')))state.prefix=q.get('prefix');if(provinces.some(p=>p.id===Number(q.get('province'))))state.province=Number(q.get('province'));state.query=q.get('q')||'';$('#search').value=state.query;
  if(state.view==='map')state.mapZoom=['country','province'].includes(q.get('zoom'))?q.get('zoom'):q.has('province')?'province':'country';
  if(/^\d{6}$/.test(q.get('city')||''))state.mapCity=Number(q.get('city'));
  render();
})();
