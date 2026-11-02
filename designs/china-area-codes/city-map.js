(() => {
  'use strict';
  const FULL=[0,0,810,530], cache=new Map(), pending=new Map(), plates=window.AREA_PLATES;
  const plate=c=>plates.city(c.id)?.plate||'';
  const plateNote=c=>plates.city(c.id)?.note||'';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let svg, national, cities, state, current=FULL.slice(), frame=0, request=0, lastKey='', restore, activeData;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phoneClass=code=>code.startsWith('06')?'city-extra':code.split(' / ').some(c=>c.length===3)?'city-special':'';
  const matches=c=>(state.prefix==='all'||c.code.split(' / ').some(code=>code.startsWith(state.prefix)))&&plates.matchesCity({...c,plate:plate(c),note:plateNote(c)},state.query,state.province);
  function fit(bounds){
    let w=(bounds[2]-bounds[0])*1.38,h=(bounds[3]-bounds[1])*1.38;
    const rect=svg?.getBoundingClientRect(),aspect=rect?.width&&rect?.height?rect.width/rect.height:810/530;
    if(w/h>aspect)h=w/aspect;else w=h*aspect;
    return [(bounds[0]+bounds[2]-w)/2,(bounds[1]+bounds[3]-h)/2,w,h];
  }
  function fly(target,done){
    cancelAnimationFrame(frame);
    const start=current.slice(),began=performance.now(),duration=reduced()?0:780;
    svg.dataset.animating='true';
    function tick(now){
      const t=duration?Math.min(1,(now-began)/duration):1,e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      const w=start[2]*Math.pow(target[2]/start[2],e),h=start[3]*Math.pow(target[3]/start[3],e);
      const cx=(start[0]+start[2]/2)*(1-e)+(target[0]+target[2]/2)*e,cy=(start[1]+start[3]/2)*(1-e)+(target[1]+target[3]/2)*e;
      current=[cx-w/2,cy-h/2,w,h];svg.setAttribute('viewBox',current.join(' '));
      if(t<1)frame=requestAnimationFrame(tick);else{current=target.slice();svg.setAttribute('viewBox',current.join(' '));svg.dataset.animating='false';if(done)done();}
    }
    frame=requestAnimationFrame(tick);
  }
  function load(id){
    if(cache.has(id))return Promise.resolve(cache.get(id));
    if(!pending.has(id))pending.set(id,fetch(`cities/${id}.json?v=city-1`).then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(data=>{cache.set(id,data);pending.delete(id);return data;}).catch(error=>{pending.delete(id);throw error;}));
    return pending.get(id);
  }
  function ensure(){
    if(svg&&svg.isConnected)return;
    const holder=document.querySelector('#map-holder');
    holder.innerHTML='<svg class="china-map city-capable-map" viewBox="0 0 810 530" aria-label="中国电话区号分布地图"><g id="national-layer"></g><g id="city-layer"></g></svg><div id="city-map-extras" hidden></div><div id="map-load-status" role="status" hidden></div>';
    svg=holder.querySelector('svg');national=svg.querySelector('#national-layer');cities=svg.querySelector('#city-layer');
    document.querySelector('.map-panel').classList.add('city-map-panel');
    let resizeTimer;
    new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(state?.view==='map'&&state.mapZoom==='province'&&cache.has(state.province)){const box=paint(cache.get(state.province));fly(box);}},100);}).observe(holder);
  }
  function toolbar(){
    const p=window.AREA_PROVINCES.find(p=>p.id===state.province),zoomed=state.mapZoom==='province';
    document.querySelector('.map-panel .panel-top').innerHTML=`<div class="map-breadcrumb">${zoomed?'<button data-map-back="true">← 全国</button><span>/</span>':''}<strong>${zoomed?p.name:'全国区号'}</strong></div><div class="map-tools"><button data-map-expand="true" aria-label="${document.querySelector('#map-dialog')?.open?'收起地图':'展开地图'}">${document.querySelector('#map-dialog')?.open?'收起 ↙':'展开 ↗'}</button></div>`;
    document.querySelector('.map-note').textContent=zoomed?'城市 · 电话区号 · 车牌':'点选省份查看城市';
    document.querySelector('#map-view').classList.toggle('city-mode',zoomed);
  }
  function layout(data,box){
    const width=Math.max(240,svg.getBoundingClientRect().width),factor=810/width,phone=width<540,fh=(phone?10:12)*factor,fc=(phone?12:16)*factor,H=810*box[3]/box[2];
    const nodes=data.cities.filter(c=>!c.inset).map(c=>({c,ax:(c.center[0]-box[0])/box[2]*810,ay:(c.center[1]-box[1])/box[2]*810,x:(c.center[0]-box[0])/box[2]*810,y:(c.center[1]-box[1])/box[2]*810,w:Math.max(60*factor,c.label.length*fh+14*factor,c.code.length*fc*.6+14*factor,plate(c).length*fh*.85+14*factor),h:(phone?46:54)*factor,fh,fc}));
    for(let step=0;step<220;step++){
      for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,ox=(a.w+b.w)/2+5-Math.abs(dx),oy=(a.h+b.h)/2+5-Math.abs(dy);
        if(ox>0&&oy>0){if(ox<oy){const push=(dx>=0?1:-1)*ox*.53;a.x+=push;b.x-=push;}else{const push=(dy>=0?1:-1)*oy*.53;a.y+=push;b.y-=push;}}
      }
      nodes.forEach(n=>{n.x+=(n.ax-n.x)*.01;n.y+=(n.ay-n.y)*.01;n.x=Math.max(n.w/2+10,Math.min(800-n.w/2,n.x));n.y=Math.max(n.h/2+10,Math.min(H-n.h/2-10,n.y));if(data.cities.some(c=>c.inset)&&n.x+n.w/2>810-155*factor&&n.y-n.h/2<130*factor)n.y=Math.max(n.y,130*factor+n.h/2);});
    }
    return nodes;
  }
  function paint(data){
    activeData=data;
    const box=fit(data.bounds),unit=box[2]/810,selected=focusedCity(data)?.id,hasMatch=data.cities.some(matches);
    cities.innerHTML=`<g class="city-regions">${data.cities.filter(c=>c.path).map(c=>`<path d="${c.path}" class="city-shape ${phoneClass(c.code)} ${selected===c.id?'city-selected':''} ${hasMatch&&!matches(c)?'city-filtered':''}" data-city="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)} ${c.code} ${esc(plate(c))}"><title>${esc(c.name)} ${c.code} ${esc(plate(c))}${c.note?'；'+esc(c.note):''}${plateNote(c)?'；'+esc(plateNote(c)):''}</title></path>`).join('')}</g><g class="city-label-layer">${layout(data,box).map(n=>{
      const x=box[0]+n.x*unit,y=box[1]+n.y*unit,ax=n.c.center[0],ay=n.c.center[1],offset=Math.hypot(n.x-n.ax,n.y-n.ay)>12;
      return `<g class="city-label ${phoneClass(n.c.code)} ${selected===n.c.id?'city-selected':''} ${hasMatch&&!matches(n.c)?'city-filtered':''}" data-city="${n.c.id}" role="button" tabindex="0" aria-label="${esc(n.c.name)} ${n.c.code} ${esc(plate(n.c))}">${offset?`<line x1="${ax}" y1="${ay}" x2="${x}" y2="${y}" vector-effect="non-scaling-stroke"></line><circle cx="${ax}" cy="${ay}" r="${1.5*n.fh/12*unit}"></circle>`:''}<rect x="${x-n.w*unit/2}" y="${y-n.h*unit/2}" width="${n.w*unit}" height="${n.h*unit}" rx="${n.fh*unit}"></rect><text x="${x}" y="${y-n.fh*1.2*unit}" style="font-size:${n.fh*unit}px">${esc(n.c.label)}</text><text x="${x}" y="${y+n.fc*.35*unit}" class="city-phone" style="font-size:${n.fc*unit}px">${n.c.code}</text><text x="${x}" y="${y+n.fh*1.85*unit}" class="city-plate" style="font-size:${n.fh*unit}px">${esc(plate(n.c))}</text></g>`;
    }).join('')}</g>`;
    const extras=data.cities.filter(c=>c.inset),extraBox=document.querySelector('#city-map-extras');
    extraBox.hidden=!extras.length;extraBox.innerHTML=extras.length?`<span class="inset-heading">${data.id===46?'南海岛屿':'底图外补充城市'}</span>${extras.map(c=>`<button data-city="${c.id}" class="${selected===c.id?'active':''}"><span>${c.label}</span><b>${c.code}</b><em class="plate-badge">${esc(plate(c))}</em></button>`).join('')}`:'';
    svg.setAttribute('aria-label',`${data.name}城市电话区号地图`);
    renderDetail(state);
    return box;
  }
  const visibleCities=data=>data.cities.filter(matches).slice().sort((a,b)=>a.code.localeCompare(b.code)||a.id-b.id);
  const focusedCity=data=>visibleCities(data).find(c=>c.id===Number(state.mapCity))||visibleCities(data)[0];
  function renderDetail(next){
    state=next;
    const detail=document.querySelector('#detail'),data=cache.get(state.province),p=window.AREA_PROVINCES.find(p=>p.id===state.province);
    const oldScroll=detail.dataset.province===String(p.id)?detail.querySelector('.city-index')?.scrollTop||0:0;
    detail.dataset.province=p.id;
    detail.classList.add('city-detail');
    const options=window.AREA_PROVINCES.map(q=>`<option value="${q.id}" ${q.id===p.id?'selected':''}>${q.name}</option>`).join('');
    const header=count=>`<div class="detail-head"><div class="detail-title"><div><span class="kicker">${count}</span><h2>${p.name}</h2></div><span class="province-seal" aria-label="车牌简称${plates.abbreviation(p.id)}">${plates.abbreviation(p.id)}</span></div><div class="province-picker"><select id="province-select" aria-label="选择省份">${options}</select><span class="pattern">${esc(p.pattern)}</span></div></div>`;
    if(!data){detail.innerHTML=header('城市 / 地区')+'<p class="detail-empty" role="status">正在载入城市…</p>';return;}
    const entries=visibleCities(data),selected=focusedCity(data),municipal=[11,12,31,50].includes(p.id);
    const notes=selected?[selected.note,plateNote(selected)].filter(Boolean):[];
    const values=code=>code.split(' / ').map(part=>`<span>${esc(part)}</span>`).join('');
    detail.innerHTML=header(`${entries.length} 个${municipal?'区县':'城市 / 地区'}`)+
      (selected?`<section class="city-selection" aria-label="${esc(selected.name)}区号与车牌"><h3>${esc(selected.name)}</h3><div class="selection-values"><div class="code-orb"><span class="orb-label">电话区号</span><strong class="orb-value">${values(selected.code)}</strong></div><div class="code-orb plate-orb"><span class="orb-label">车牌</span><strong class="orb-value">${values(plate(selected))}</strong></div></div></section>`:'')+
      (municipal?`<p class="city-shared">全市 ${data.cities[0].code} · ${plates.abbreviation(p.id)}牌字母不与区县一一对应</p>`:'')+
      `<div class="city-index" aria-label="${p.name}城市列表">${entries.map(c=>`<button class="city-index-row ${phoneClass(c.code)} ${selected?.id===c.id?'active':''}" data-city="${c.id}" aria-pressed="${selected?.id===c.id}"><span class="city-name">${esc(c.label)}</span><b>${esc(c.code)}</b><em class="plate-badge">${esc(plate(c))}</em></button>`).join('')}</div>`+
      (!entries.length?'<div class="detail-empty">没有匹配的城市<button class="outline" data-reset="true">清除筛选</button></div>':'')+
      (notes.length?`<p class="small-note">${notes.map(esc).join('<br>')}</p>`:'');
    const index=detail.querySelector('.city-index'),active=index?.querySelector('.active');
    if(index){index.scrollTop=oldScroll;if(active&&state.mapCity){const row=active.getBoundingClientRect(),list=index.getBoundingClientRect();if(row.top<list.top)index.scrollTop-=list.top-row.top;else if(row.bottom>list.bottom)index.scrollTop+=row.bottom-list.bottom;}}
  }
  function render(next,markup){
    state=next;if(state.view!=='map')return;
    ensure();toolbar();renderDetail(state);
    national.innerHTML=markup.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
    const token=++request,zoomed=state.mapZoom==='province',key=zoomed?String(state.province):'country',status=document.querySelector('#map-load-status');
    svg.dataset.level=zoomed?'province':'country';
    if(!zoomed){
      document.querySelector('#city-map-extras').hidden=true;status.hidden=true;svg.setAttribute('aria-label','中国电话区号分布地图');
      if(lastKey!=='country')fly(FULL,()=>{if(state.mapZoom==='country')cities.innerHTML='';});
      lastKey=key;
      if(!cache.has(state.province))load(state.province).then(()=>{if(token===request&&state.view==='map'&&state.mapZoom==='country')renderDetail(state);}).catch(()=>{if(token===request)document.querySelector('#detail').innerHTML='<h2>'+esc(pName())+'</h2><p class="detail-empty">城市信息暂未载入</p><button class="outline" data-map-retry="true">重试</button>';});
      return;
    }
    const moving=lastKey!==key;
    if(moving){
      cities.innerHTML='';document.querySelector('#city-map-extras').hidden=true;
      const shape=national.querySelector(`[data-province="${state.province}"]`);
      if(shape){const b=shape.getBBox();fly(fit([b.x,b.y,b.x+b.width,b.y+b.height]));}
    }
    lastKey=key;
    if(cache.has(state.province)){const box=paint(cache.get(state.province));if(moving)fly(box);status.hidden=true;return;}
    status.hidden=false;status.textContent='载入城市地图…';
    load(state.province).then(data=>{
      if(token!==request||state.mapZoom!=='province'||state.view!=='map'||data.id!==state.province)return;
      const box=paint(data);status.hidden=true;fly(box);
    }).catch(()=>{
      if(token!==request)return;
      status.innerHTML='城市地图暂未载入 <button data-map-retry="true">重试</button>';
      document.querySelector('#detail').innerHTML=`<h2>${pName()}</h2><p class="detail-empty">城市地图暂未载入。</p><button class="outline" data-map-retry="true">重试</button>`;
    });
  }
  const pName=()=>window.AREA_PROVINCES.find(p=>p.id===state.province).name;
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-map-expand]');if(!button)return;
    let dialog=document.querySelector('#map-dialog');
    if(dialog?.open){dialog.close();return;}
    if(!dialog){dialog=document.createElement('dialog');dialog.id='map-dialog';dialog.setAttribute('aria-label','放大的电话区号地图');document.body.append(dialog);dialog.addEventListener('close',()=>{const view=document.querySelector('#map-view');restore.parent.insertBefore(view,restore.next);document.body.classList.remove('map-dialog-open');toolbar();});}
    const view=document.querySelector('#map-view');restore={parent:view.parentNode,next:view.nextSibling};dialog.append(view);document.body.classList.add('map-dialog-open');dialog.showModal();toolbar();
  });
  window.AREA_CITY_MAP={render,renderDetail,load,getData:id=>cache.get(id)};
})();
