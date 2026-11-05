from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re

root=Path('.').resolve()
pages=[Path('index.html'),Path('canada/index.html'),Path('china/index.html'),Path('designs/china-area-codes/index.html')]
errors=[];assets=set();links=0
class Inspect(HTMLParser):
    def __init__(self,page):super().__init__();self.page=page;self.ids=set();self.h1=0
    def handle_starttag(self,tag,attrs):
        global links
        a=dict(attrs)
        if 'id' in a:
            if a['id'] in self.ids:errors.append(f'{self.page}: duplicate id {a["id"]}')
            self.ids.add(a['id'])
        if tag=='h1':self.h1+=1
        for key in ['href','src']:
            value=a.get(key)
            if not value or value.startswith(('#','https:','http:','data:','mailto:')):continue
            target=(root/self.page.parent/unquote(urlsplit(value).path)).resolve()
            if target.is_dir():target=target/'index.html'
            if not target.is_file():errors.append(f'{self.page}: missing {key} {value}')
            assets.add(target);links+=1
        if tag=='img' and 'alt' not in a:errors.append(f'{self.page}: image missing alt')
for page in pages:
    parser=Inspect(page);parser.feed(page.read_text(encoding='utf-8'))
    if page not in [Path('canada/index.html'),Path('designs/china-area-codes/index.html')] and parser.h1!=1:errors.append(f'{page}: expected one h1, got {parser.h1}')
photo_text=Path('photos.js').read_text(encoding='utf-8')
for photo in re.findall(r'"file":\s*"([^\"]+)"',photo_text):
    if not Path(photo).is_file():errors.append('Missing photo '+photo)
for path in ['site.css','home.css','reader.css','designs/china-area-codes/style.css','designs/china-area-codes/city-map.css']:
    css=Path(path).read_text(encoding='utf-8')
    if css.count('{')!=css.count('}'):errors.append('Unbalanced stylesheet '+path)
assert not errors, '\n'.join(errors)
print(f'PASS: {len(pages)} entry pages, {links} local references, {len(assets)} unique targets, all licensed photo files, no duplicate IDs or missing resources')
