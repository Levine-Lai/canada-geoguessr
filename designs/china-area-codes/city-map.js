(() => {
  'use strict';
  const FULL=[0,0,810,530], cache=new Map(), pending=new Map();
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let svg, national, cities, state, current=FULL.slice(), frame=0, request=0, lastKey='', restore, activeData;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phoneClass=code=>code.startsWith('06')?'city-extra':code.split(' / ').some(c=>c.length===3)?'city-special':'';
  const matches=c=>(state.prefix==='all'||c.code.split(' / ').some(code=>code.startsWith(state.prefix)))&&(!state.query||(c.name+c.label+c.code).includes(state.query));
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
    document.querySelector('.map-note').textContent=zoomed?'点击城市可高亮查看；共用区号分别标注。':'点击省份，平滑放大查看城市区号。';
    document.querySelector('#map-view').classList.toggle('city-mode',zoomed);
  }
  function layout(data,box){
    const width=Math.max(240,svg.getBoundingClientRect().width),factor=810/width,phone=width<540,fh=(phone?10:12)*factor,fc=(phone?12:16)*factor,H=810*box[3]/box[2];
    const nodes=data.cities.filter(c=>!c.inset).map(c=>({c,ax:(c.center[0]-box[0])/box[2]*810,ay:(c.center[1]-box[1])/box[2]*810,x:(c.center[0]-box[0])/box[2]*810,y:(c.center[1]-box[1])/box[2]*810,w:Math.max(60*factor,c.label.length*fh+14*factor,c.code.length*fc*.6+14*factor),h:(phone?32:38)*factor,fh,fc}));
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
    const box=fit(data.bounds),unit=box[2]/810,selected=Number(state.mapCity),hasMatch=data.cities.some(matches);
    cities.innerHTML=`<g class="city-regions">${data.cities.filter(c=>c.path).map(c=>`<path d="${c.path}" class="city-shape ${phoneClass(c.code)} ${selected===c.id?'city-selected':''} ${hasMatch&&!matches(c)?'city-filtered':''}" data-city="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)} ${c.code}"><title>${esc(c.name)} ${c.code}${c.note?'；'+esc(c.note):''}</title></path>`).join('')}</g><g class="city-label-layer">${layout(data,box).map(n=>{
      const x=box[0]+n.x*unit,y=box[1]+n.y*unit,ax=n.c.center[0],ay=n.c.center[1],offset=Math.hypot(n.x-n.ax,n.y-n.ay)>12;
      return `<g class="city-label ${phoneClass(n.c.code)} ${selected===n.c.id?'city-selected':''} ${hasMatch&&!matches(n.c)?'city-filtered':''}" data-city="${n.c.id}" role="button" tabindex="0" aria-label="${esc(n.c.name)} ${n.c.code}">${offset?`<line x1="${ax}" y1="${ay}" x2="${x}" y2="${y}" vector-effect="non-scaling-stroke"></line><circle cx="${ax}" cy="${ay}" r="${1.5*n.fh/12*unit}"></circle>`:''}<rect x="${x-n.w*unit/2}" y="${y-n.h*unit/2}" width="${n.w*unit}" height="${n.h*unit}" rx="${3*unit}"></rect><text x="${x}" y="${y-n.fh*.4*unit}" style="font-size:${n.fh*unit}px">${esc(n.c.label)}</text><text x="${x}" y="${y+n.fc*.8*unit}" class="city-phone" style="font-size:${n.fc*unit}px">${n.c.code}</text></g>`;
    }).join('')}</g>`;
    const extras=data.cities.filter(c=>c.inset),extraBox=document.querySelector('#city-map-extras');
    extraBox.hidden=!extras.length;extraBox.innerHTML=extras.length?`<span class="inset-heading">${data.id===46?'南海岛屿':'底图外补充城市'}</span>${extras.map(c=>`<button data-city="${c.id}" class="${selected===c.id?'active':''}"><span>${c.label}</span><b>${c.code}</b></button>`).join('')}`:'';
    svg.setAttribute('aria-label',`${data.name}城市电话区号地图`);
    renderDetail(state);
    return box;
  }
  function renderDetail(next){
    state=next;
    const detail=document.querySelector('#detail'),data=cache.get(state.province),p=window.AREA_PROVINCES.find(p=>p.id===state.province);
    detail.classList.add('city-detail');
    if(!data){detail.innerHTML=`<span class="kicker">省内地图</span><h2>${p.name}</h2><p class="detail-empty">正在载入城市区号…</p>`;return;}
    const selected=data.cities.find(c=>c.id===Number(state.mapCity)),municipal=[11,12,31,50].includes(p.id);
    const notes=selected?.note?[selected.note]:[...new Set(data.cities.filter(c=>c.note).map(c=>c.note))];
    detail.innerHTML=`<span class="kicker">${municipal?'区县':'城市 / 地区'}区号 · ${data.cities.length} 地区</span><h2>${p.name}</h2><span class="pattern">${esc(p.pattern)}</span><div class="province-picker"><select id="province-select" aria-label="选择省份">${window.AREA_PROVINCES.map(q=>`<option value="${q.id}" ${q.id===p.id?'selected':''}>${q.name}</option>`).join('')}</select></div>${selected?`<div class="city-selection"><span>${esc(selected.name)}</span><strong>${selected.code}</strong></div>`:''}${municipal?`<p class="city-shared">全市统一使用 ${data.cities[0].code}</p>`:''}<div class="city-index">${data.cities.slice().sort((a,b)=>a.code.localeCompare(b.code)||a.id-b.id).map(c=>`<button class="city-index-row ${phoneClass(c.code)} ${selected?.id===c.id?'active':''}" data-city="${c.id}" aria-pressed="${selected?.id===c.id}"><span>${esc(c.label)}</span><b>${c.code}</b></button>`).join('')}</div>${notes.length?`<p class="small-note">${notes.map(esc).join('<br>')}</p>`:''}`;
  }
  function render(next,markup){
    state=next;if(state.view!=='map')return;
    ensure();toolbar();
    national.innerHTML=markup.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
    const token=++request,zoomed=state.mapZoom==='province',key=zoomed?String(state.province):'country',status=document.querySelector('#map-load-status');
    svg.dataset.level=zoomed?'province':'country';
    if(!zoomed){
      document.querySelector('#city-map-extras').hidden=true;status.hidden=true;svg.setAttribute('aria-label','中国电话区号分布地图');
      if(lastKey!=='country')fly(FULL,()=>{if(state.mapZoom==='country')cities.innerHTML='';});
      lastKey=key;return;
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
