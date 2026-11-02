(() => {
  'use strict';
  const data=window.AREA_PLATE_DATA, cities=new Map(data.cities.map(c=>[c.id,c]));
  const norm=s=>String(s).replace(/\s/g,'').toUpperCase();
  const search=(text,query)=>!query||norm(text).includes(norm(query));
  const abbreviation=id=>data.abbreviations[id]||'';
  const city=id=>cities.get(Number(id));
  const municipal=id=>[11,12,31,50].includes(id);
  const matchesCity=(c,query,id=c.province)=>search((c.name||'')+c.label+(c.code||'')+c.plate+(c.note||'')+abbreviation(id),query)||(municipal(id)&&new RegExp('^'+abbreviation(id)+'[A-HJ-NP-Z]$').test(norm(query)));
  const rows=(id,row)=>{
    const entries=data.cities.filter(c=>c.province===id&&c.code.split(' / ').includes(row.code));
    if(municipal(id))return [{province:id,label:row.city,plate:abbreviation(id)+'A等',note:'全市车牌字母不与区县一一对应。'}];
    return entries;
  };
  const forName=(id,name)=>{
    if([11,12,31,50].includes(id))return abbreviation(id)+'A等';
    const label=name.replace(/等$/,'');
    return data.cities.find(c=>c.province===id&&(c.label===label||c.name===label||c.name.startsWith(label)))?.plate||'';
  };
  const matches=(p,r,q)=>search(p.name+abbreviation(p.id)+r.city+r.code,q)||rows(p.id,r).some(c=>matchesCity({...c,code:r.code},q,p.id));
  window.AREA_PLATES={abbreviation,city,rows,forName,matches,matchesCity,search,checked:data.checked};
})();
