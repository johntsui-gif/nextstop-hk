"""MTR identities/topology: official MTR open-data CSV. Locations: LandsD WFS REST.
No hand-entered coordinates. Unknown station mappings fail rather than guessing.
WFS may ignore maxFeatures: verify totalFeatures so a truncated response is fatal.
"""
import importlib.util,json,urllib.request,urllib.parse,csv,io,re
from pathlib import Path
spec=importlib.util.spec_from_file_location('directory',Path(__file__).with_name('build-directory.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base='https://mapapi.hkmapservice.gov.hk/ogc/wfs/indoor/'
def wfs(layer,extra={}):
 q={'service':'WFS','version':'1.1.0','request':'GetFeature','outputFormat':'application/json',**extra};j=m.get(base+layer+'?'+urllib.parse.urlencode(q))
 if int(j['totalFeatures'])!=len(j['features']):raise RuntimeError('Truncated WFS result: partition by venue_id before continuing')
 return j['features']
venues=wfs('mtr_venue_polygon');entries=wfs('mtr_amenity_point',{'cql_filter':"amenity_category='entry'"})
text=urllib.request.urlopen('https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv',timeout=30).read().decode('utf-8-sig');rows=list(csv.DictReader(io.StringIO(text)))
def normal(s):return re.sub(r'[^a-z0-9]','',s.lower().replace('station',''))
venueByName={normal(x['properties']['venue_name_en']):x for x in venues}
stops={};routes={}
for r in rows:
 code=r['Station Code'];line=r['Line Code'];direction=r['Direction'];name=r['English Name']
 if line not in ['AEL','TCL','TML','TKL','EAL','SIL','TWL','ISL','KTL','DRL']:continue
 if code not in stops:
  v=venueByName.get(normal(name))
  if not v:raise ValueError('Missing station '+name)
  p=v['properties'];b=p['bbox'];ee=[]
  for e in entries:
   ep=e['properties']
   if ep['venue_id']==p['venue_id']:
    c=e['geometry']['coordinates'];ee.append({'lng':c[0],'lat':c[1],'name':ep['amenity_name_en'] or 'Station access'})
  stops[code]={'id':code,'name':name,'tc':r['Chinese Name'],'op':'MTR','lat':(b[1]+b[3])/2,'lng':(b[0]+b[2])/2,'entrances':ee}
 key=line+'-'+direction
 route=routes.setdefault(key,{'id':key,'route':line,'dir':'UP' if direction.endswith('UT') else 'DOWN','op':'MTR','stops':[]})
 route['stops'].append((float(r['Sequence']),code))
for r in routes.values():
 r['stops']=[s[1] for s in sorted(r['stops'])];r['dest']=stops[r['stops'][-1]]['name'];r['destTc']=stops[r['stops'][-1]]['tc']
m.save('MTR',stops,list(routes.values()))
print('Stations without entry points:',[s['name'] for s in stops.values() if not s['entrances']])
