"use strict";

// Provider lookups use different coordinate systems. Map markers stay in WGS84.
function toGcj02([lat, lng]) {
  const x = lng - 105;
  const y = lat - 35;
  const sin = Math.sin;
  const pi = Math.PI;
  const common = (20 * sin(6*x*pi) + 20 * sin(2*x*pi)) * 2/3;
  const latitude = -100 + 2*x + 3*y + 0.2*y*y + 0.1*x*y + 0.2*Math.sqrt(Math.abs(x)) + common
    + (20*sin(y*pi) + 40*sin(y*pi/3) + 160*sin(y*pi/12) + 320*sin(y*pi/30)) * 2/3;
  const longitude = 300 + x + 2*y + 0.1*x*x + 0.1*x*y + 0.1*Math.sqrt(Math.abs(x)) + common
    + (20*sin(x*pi) + 40*sin(x*pi/3) + 150*sin(x*pi/12) + 300*sin(x*pi/30)) * 2/3;
  const radians = lat * pi/180;
  const a = 6378245;
  const eccentricity = 0.006693421622965943;
  const magic = 1 - eccentricity * sin(radians)**2;
  return [
    lat + latitude*180 / ((a*(1-eccentricity) / magic**1.5) * pi),
    lng + longitude*180 / (a / Math.sqrt(magic) * Math.cos(radians) * pi)
  ];
}

function toBaiduMeters([lat, lng]) {
  const angleScale = Math.PI * 3000 / 180;
  const length = Math.hypot(lng,lat) + 0.00002 * Math.sin(lat * angleScale);
  const angle = Math.atan2(lat,lng) + 0.000003 * Math.cos(lng * angleScale);
  const bdLng = length * Math.cos(angle) + 0.0065;
  const bdLat = length * Math.sin(angle) + 0.006;
  // Baidu Mercator polynomial coefficients for latitude bands 15–60°N.
  const coefficients = bdLat >= 45
    ? [0.00337398766765,111320.7020202162,4481351.045890365,-23393751.19931662,79682215.47186455,-115964993.2797253,97236711.15602145,-43661946.33752821,8477230.501135234,52.5]
    : bdLat >= 30
    ? [0.00220636496208,111320.7020209128,51751.86112841131,3796837.749470245,992013.7397791013,-1221952.21711287,1340652.697009075,-620943.6990984312,144416.9293806241,37.5]
    : [-0.0003441963504368392,111320.7020576856,278.2353980772752,2485758.690035394,6070.750963243378,54821.18345352118,9540.606633304236,-2710.55326746645,1405.483844121726,22.5];
  const ratio = bdLat / coefficients[9];
  const y = coefficients.slice(2,9).reduceRight((total, coefficient) => total*ratio + coefficient,0);
  return [Math.round(coefficients[0] + coefficients[1]*bdLng), Math.round(y)];
}

async function panoramaData(base, params, signal) {
  const response = await fetch(base + "?" + new URLSearchParams(params), {
    signal, credentials:"omit", referrerPolicy:"no-referrer"
  });
  if (!response.ok) throw new Error("街景服务暂不可用");
  return response.json();
}

async function baiduPanorama(gcj, signal) {
  const [x,y] = toBaiduMeters(gcj);
  const response = await panoramaData("https://mapsv0.bdimg.com/", {qt:"qsdata",x,y,radius:250}, signal);
  const pano = response.content;
  if (!pano || !/^[\w-]+$/.test(pano.id ?? "")) return null;
  const params = new URLSearchParams({panoid:pano.id,panotype:"street",newmap:"1",shareurl:"1",pid:pano.id});
  return { label:"打开百度全景 ↗", url:"https://map.baidu.com/#" + params };
}

async function tencentPanorama([lat,lng], signal) {
  const response = await panoramaData("https://sv.map.qq.com/xf", {lat,lng,r:250,output:"json"}, signal);
  const id = response.detail?.svid;
  if (typeof id !== "string" || !/^\d+$/.test(id)) return null;
  const params = new URLSearchParams({x:0,y:0,from:"html5",level:0,svid:id});
  return { label:"打开腾讯街景全景图 ↗", url:"https://sv4.map.qq.com/thumb?" + params, preview:true };
}

window.GuessStreet = {
  search: (point, signal) => {
    const gcj = toGcj02(point);
    return Promise.allSettled([baiduPanorama(gcj,signal), tencentPanorama(gcj,signal)]);
  },
  inChinaArea: ([lat,lng]) => lat >= 17 && lat <= 55 && lng >= 72 && lng <= 137
};
