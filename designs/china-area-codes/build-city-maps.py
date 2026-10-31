"""Build static city map files from cached DataV geometry and the existing code table.

Run from the repository root. Requires Python and Node; source boundaries are
downloaded to .research/city-boundaries/ when not already cached.
"""
import json
import math
import pathlib
import re
import subprocess
import urllib.request

root = pathlib.Path(__file__).parent
export = "const fs=require('fs');global.window={};for(const file of ['data.js','map.js'])eval(fs.readFileSync(process.argv[1]+'/'+file,'utf8'));process.stdout.write(JSON.stringify({provinces:window.AREA_PROVINCES,projection:window.AREA_MAP.projection}));"
reference = json.loads(subprocess.check_output(['node','-e',export,str(root.resolve())],text=True,encoding='utf8'))
projection = reference['projection']
special = {659001:'0993',659002:'0997',659003:'0998',659004:'0994',659005:'0906',659006:'0996',659007:'0909',659008:'0999',659009:'0903',659010:'0992'}
notes = {
    632800: ('0977 / 0979', '海西州：德令哈等用 0977，格尔木用 0979。'),
    650200: ('0990 / 0992', '克拉玛依主要用 0990；独山子区用 0992。'),
    654000: ('0999 / 0992', '伊犁州主要用 0999；奎屯用 0992。'),
    654200: ('0901 / 0992', '塔城地区主要用 0901；乌苏用 0992。'),
    420700: ('0711 / 027', '鄂州主要用 0711；华容区有使用 027 的区域。')
}

def project(point):
    lon, lat = point
    r = math.pi / 180
    rho = math.sqrt(projection['c']-2*projection['n']*math.sin(lat*r))/projection['n']
    theta = projection['n']*(lon-105)*r
    return [(rho*math.sin(theta)-projection['minx'])*projection['scale']+22,
            (projection['maxy']-(projection['rho0']-rho*math.cos(theta)))*projection['scale']+15]

def simplify(points, tolerance=.018):
    if len(points) < 4:
        return points
    a, b = points[0], points[-1]
    dx, dy = b[0]-a[0], b[1]-a[1]
    length = dx*dx+dy*dy
    best, index = 0, 0
    for i, p in enumerate(points[1:-1], 1):
        t = max(0, min(1, ((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)) if length else 0
        d = (p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
        if d > best:
            best, index = d, i
    if best <= tolerance*tolerance:
        return [a, b]
    return simplify(points[:index+1], tolerance)[:-1]+simplify(points[index:], tolerance)

def label(name):
    for ending in ['土家族苗族自治州','布依族苗族自治州','苗族侗族自治州','壮族苗族自治州','傣族景颇族自治州','哈尼族彝族自治州','蒙古族藏族自治州','柯尔克孜自治州','哈萨克自治州','蒙古自治州','藏族羌族自治州','朝鲜族自治州','傣族自治州','白族自治州','彝族自治州','藏族自治州','回族自治州','傈僳族自治州','土家族苗族自治州']:
        if name.endswith(ending):
            return name[:-len(ending)]+'州'
    return re.sub(r'(黎族苗族|黎族)自治县$', '', name).removesuffix('市').removesuffix('地区')

manifest = []
for p in reference['provinces']:
    cached = pathlib.Path(f".research/city-boundaries/{p['id']}.json")
    if not cached.exists():
        cached.parent.mkdir(parents=True,exist_ok=True)
        url = f"https://geo.datav.aliyun.com/areas_v3/bound/{p['id']}0000_full.json"
        with urllib.request.urlopen(url,timeout=30) as response:
            cached.write_text(json.dumps(json.loads(response.read()),ensure_ascii=False),encoding='utf8')
    source = json.loads(cached.read_text(encoding='utf8'))
    cities, extent = [], []
    for f in source['features']:
        props = f['properties']
        code, name = props['adcode'], props['name']
        aliases = []
        for row in p['rows']:
            for part in row['city'].split('、'):
                alias = re.split('[（(]', part)[0].removesuffix('州')
                if name.startswith(alias) or alias.startswith(name.removesuffix('市')):
                    aliases.append(row['code'])
        if p['id'] in [11, 12, 31, 50, 46]:
            aliases = [p['rows'][0]['code']]
        if code in special:
            aliases = [special[code]]
        if not aliases:
            raise ValueError(f'Unmapped {code} {name}')
        phone = ' / '.join(dict.fromkeys(aliases))
        note = ''
        if code in notes:
            phone, note = notes[code]
        geometry = f['geometry']
        polygons = geometry['coordinates'] if geometry['type']=='MultiPolygon' else [geometry['coordinates']]
        paths = []
        for polygon in polygons:
            if code == 460300:
                continue
            if p['id']==46 and max(pt[1] for ring in polygon for pt in ring)<18:
                continue
            for ring in polygon:
                points = [project(pt) for pt in ring]
                extent.extend(points)
                points = simplify(points)
                if len(points)>2:
                    paths.append('M'+'L'.join(f'{x:.3f},{y:.3f}' for x,y in points)+'Z')
        cities.append({'id':code,'name':name,'label':label(name),'code':phone,'center':project(props.get('centroid') or props.get('center') or polygons[0][0][0]),'path':''.join(paths),'note':note,'inset':code==460300})
    if p['id']==65:
        # Current municipalities absent from the older DataV boundary snapshot.
        # They remain visible in a clearly labelled supplemental list, without invented borders.
        for code, name, phone in [(659011,'新星市','0902'),(659012,'白杨市','0901'),(659013,'草湖市','0998')]:
            cities.append({'id':code,'name':name,'label':name[:-1],'code':phone,'center':[0,0],'path':'','note':'边界底图尚未收录；区号按现用公开联系方式补充。','inset':True})
    bounds = [min(pt[0] for pt in extent),min(pt[1] for pt in extent),max(pt[0] for pt in extent),max(pt[1] for pt in extent)]
    result = {'id':p['id'],'name':p['name'],'bounds':bounds,'cities':cities,'source':f"https://geo.datav.aliyun.com/areas_v3/bound/{p['id']}0000_full.json",'checked':'2026-10-31'}
    output = root/'cities'/f"{p['id']}.json"
    output.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf8')
    manifest.append({'id':p['id'],'cities':len(cities),'bytes':output.stat().st_size})
(root/'cities'/'manifest.json').write_text(json.dumps(manifest,separators=(',',':')),encoding='utf8')
print(json.dumps({'provinces':len(manifest),'cities':sum(p['cities'] for p in manifest),'bytes':sum(p['bytes'] for p in manifest)}))
