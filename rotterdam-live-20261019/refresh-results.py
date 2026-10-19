from pathlib import Path
from lxml import html
import json,re,unicodedata
from datetime import datetime
from zoneinfo import ZoneInfo

import argparse,urllib.request,concurrent.futures
p=argparse.ArgumentParser(description='Refresh the six official Rotterdam qualification tables in the maintained renderer.')
p.add_argument('--checked-at',required=True,help='Verified real ISO timestamp, with timezone; do not use an unverified executor clock.')
p.add_argument('--source',default='wm-gold-release.js')
p.add_argument('--output',default='wm-gold-release-current.js')
p.add_argument('--completed',type=int,default=None,help='Only pass 10 after the official final qualification standings are confirmed.')
args=p.parse_args()
source=Path(args.source).read_text()
decoder=json.JSONDecoder()
base=decoder.raw_decode(source[source.index('const data=')+11:])[0]
def norm(s):
    s=unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower().replace('oe','o').replace('ae','a').replace('ue','u')
    return ' '.join(sorted(re.findall('[a-z]+',s)))
names={norm(r[1]):r[1] for k,v in base['tables'].items() if k!='team' for r in v['rows']}
countries={r[2]:r[1] for r in base['tables']['team']['rows']}
def text(el):return ' '.join(el.itertext()).strip() if el is not None else ''
def cell(row,cls):
    return row.xpath('./td[contains(concat(" ",normalize-space(@class)," ")," '+cls+' ")]')
def value(el):
    return (el.text or '').strip() or '—'
def download(item):
    key,table=item
    with urllib.request.urlopen(table['source'],timeout=45) as response: content=response.read()
    Path(key+'.html').write_bytes(content)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    list(pool.map(download,base['tables'].items()))
tables={}
for key,old in base['tables'].items():
    doc=html.fromstring(Path(key+'.html').read_bytes())
    rows=doc.xpath('//tr[@class="team"]') if key=='team' else doc.xpath('//tr[contains(concat(" ",normalize-space(@class)," ")," mix ")]')
    data=[]
    for row in rows:
        rank=text(cell(row,'rank')[0]);noc=cell(row,'noc')[0].xpath('.//img/@alt')[0]
        namecell=cell(row,'name')[0]
        full=namecell.xpath('.//*[@class="fulldescription"]')
        raw=text(full[0]) if full else text(namecell)
        if key=='team':name=countries.get(noc,raw)
        else:
            name=names.get(norm(raw))
            if not name:
                parts=raw.split();split=next((i for i,p in enumerate(parts) if not p.isupper()),len(parts))
                name=' '.join(parts[split:]+[p.title() for p in parts[:split]])
        if key=='vault':
            scores=row.xpath('.//table[contains(@class,"multipleScoring")]/tr')
            jumps=[text(r.xpath('./td[@class="points"]')[0]) for r in scores[:2]]
            avg=[text(c) for c in scores[-1].xpath('./td')]
            bonus=next((x.split(':',1)[1].strip() for x in avg if x.startswith('Bonus:')),'—')
            total=next(x.split(':',1)[1].strip() for x in avg if x.startswith('Average:'))
            vals=[*jumps,bonus,total]
        else:
            vals=[value(x) for x in cell(row,'score')]+[text(cell(row,'total')[0]) or '—']
        data.append([rank or '—',name,noc,*vals])
    assert len(data)>=len(old['rows']), (key,len(data),len(old['rows']))
    expected=8 if key in ['team','allaround'] else 7
    assert all(len(r)==expected for r in data),(key,[r for r in data if len(r)!=expected][:2])
    tables[key]={'source':old['source'],'rows':data}
teamMembers=[]
currentNoc=None
for row in html.fromstring(Path('team.html').read_bytes()).xpath('//tr'):
    if row.get('class')=='team':
        currentNoc=cell(row,'noc')[0].xpath('.//img/@alt')[0]
    elif 'member' in (row.get('class') or '').split():
        raw=text(cell(row,'name')[0])
        name=names.get(norm(raw))
        if not name:
            parts=raw.split()
            split=next((i for i,p in enumerate(parts) if not p.isupper()),len(parts))
            name=' '.join(parts[split:]+[p.title() for p in parts[:split]])
        values=[value(c) for c in cell(row,'score')]
        assert len(values)==4
        teamMembers.append({'name':name,'noc':currentNoc,'values':values})

now=datetime.fromisoformat(args.checked_at)
assert now.tzinfo is not None
now=now.astimezone(ZoneInfo('Europe/Amsterdam'))
status=f'Zwischenstand der laufenden Frauenqualifikation. Geprüft am 19.10.2026 um {now:%H:%M} Uhr. Alle Platzierungen sind vorläufig; die Qualifikation endet heute voraussichtlich gegen 22:30 Uhr.'
updated={'completed':args.completed,'status':status,'date':'2026-10-19','checkedAt':now.isoformat(),'tables':tables,'teamMembers':teamMembers}
replacements=[]
for m in re.finditer(r'const data=',source):
    try:d,end=decoder.raw_decode(source[m.end():])
    except ValueError:continue
    if isinstance(d,dict) and 'tables' in d:replacements.append((m.end(),m.end()+end,updated))
prefix='const dayEndData=(()=>{const d='
start=source.index(prefix)+len(prefix);d,end=decoder.raw_decode(source[start:]);replacements.append((start,start+end,updated))
for start,end,d in sorted(replacements,reverse=True):source=source[:start]+json.dumps(d,ensure_ascii=False,separators=(',',':'))+source[end:]
assert len(replacements)==3
source=source.replace(base['status'],status)
def find(key,name):return next(r for r in tables[key]['rows'] if r[2]=='GER' and name in r[1])
highlights=[]
for key,name,label,detail in [('team','Deutschland','Turnteam Deutschland','Mannschaft'),('bars','Kevric','Helen Kevric','Barren'),('vault','Karina','Karina Schönmaier','zwei Sprünge'),('allaround','Quaas','Lea Marie Quaas','Mehrkampf')]:
    row=find(key,name);highlights.append([row[0],label,row[-1].replace('.',',')+' Punkte · '+detail])
source=re.sub(r'for\(const \[rank,label,detail\] of \[\[.*?\]\]\)\{',lambda m:'for(const [rank,label,detail] of '+json.dumps(highlights,ensure_ascii=False)+'){',source,count=1)
source=re.sub(r'\s*Bereitgestellt von Matthias (?:Wellmer|Wämer)\.?','',source)
if args.completed==10:
    final_status=f'Offizieller Abschlussstand der Frauenqualifikation. Geprüft am 19.10.2026 um {now:%H:%M} Uhr.'
    source=source.replace(status,final_status)
    updated['status']=final_status
    source=source.replace('Die Frauenqualifikation läuft. Hier steht unser Turnteam aktuell.','Die Frauenqualifikation ist beendet. Hier steht unser Turnteam im offiziellen Abschlussstand.')
    source=source.replace('Aktuelle offizielle Ranglisten. Die Qualifikation läuft; alle Platzierungen sind vorläufig.','Offizielle Ranglisten nach Abschluss der Frauenqualifikation.')
Path(args.output).write_text(source)
Path('results-current.json').write_text(json.dumps(updated,ensure_ascii=False,indent=2))
print(json.dumps({'counts':{k:len(v['rows']) for k,v in tables.items()},'highlights':highlights,'replacedDatasets':len(replacements)},ensure_ascii=False))
