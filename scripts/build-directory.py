"""Build an offline stop index ONLY from government-listed REST APIs.
Run periodically (not on every phone). Resumable HTTP cache, bounded workers.
Operator lists have no page parameter. ArcGIS must page using resultOffset
and exceededTransferLimit; otherwise routes beyond the server cap disappear.
"""
import urllib.request,urllib.parse,json,concurrent.futures,time,hashlib,pathlib,os,csv,io
ROOT=pathlib.Path(__file__).resolve().parent.parent
CACHE=ROOT/'.data-cache';CACHE.mkdir(exist_ok=True)
K='https://data.etabus.gov.hk/v1/transport/kmb'
C='https://rt.data.gov.hk/v2/transport/citybus'
G='https://data.etagmb.gov.hk'
A='https://portal.csdi.gov.hk/server/rest/services/common/'
def get(url):
 p=CACHE/(hashlib.sha256(url.encode()).hexdigest()+'.json')
 if p.exists() and time.time()-p.stat().st_mtime<86400:return json.loads(p.read_text())
 for n in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers={'Accept':'application/json'}),timeout=30) as r: j=json.load(r)
   if 'error' in j:raise ValueError(j['error'])
   p.write_text(json.dumps(j));return j
  except Exception:
   if n==2:raise
   time.sleep(2**n)
def pool(fn,items):
 with concurrent.futures.ThreadPoolExecutor(max_workers=16) as e:return list(e.map(fn,items))
def pages(service):
 out=[]
 while True:
  q=urllib.parse.urlencode({'returnGeometry':'false','where':'1=1','outFields':'*','outSR':4326,'f':'json','resultOffset':len(out),'resultRecordCount':1000,'orderByFields':'OBJECTID'})
  j=get(A+service+'/MapServer/0/query?'+q);out+=j['features']
  if not j.get('exceededTransferLimit'):return out
  if not j['features']:raise ValueError('Empty truncated page')
def save(op,stops,routes,excluded=None):
 out={'updated':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'stops':list(stops.values()),'routes':routes,'incompletePatterns':excluded or []}
 p=ROOT/'dist/data';p.mkdir(exist_ok=True);(p/(op+'.json')).write_text(json.dumps(out,separators=(',',':'),ensure_ascii=False));print(op,len(stops),'stops',len(routes),'patterns',flush=True)
def kmb():
 stops={s['stop']:{'id':s['stop'],'name':s['name_en'],'tc':s['name_tc'],'lat':float(s['lat']),'lng':float(s['long']),'op':'KMB'} for s in get(K+'/stop')['data']}
 routes={}
 meta={f"{r['route']}-{r['bound']}-{r['service_type']}":r for r in get(K+'/route')['data']}
 for s in get(K+'/route-stop')['data']:
  key=f"{s['route']}-{s['bound']}-{s['service_type']}";m=meta.get(key,{})
  r=routes.setdefault(key,{'id':key,'route':s['route'],'dir':s['bound'],'service':s['service_type'],'dest':m.get('dest_en',''),'destTc':m.get('dest_tc',''),'op':'KMB','stops':[]})
  r['stops'].append([int(s['seq']),s['stop']])
 for r in routes.values():r['stops']=[x[1] for x in sorted(r['stops'])]
 # The bulk route feed can reference retired stops absent from the stop API.
 # Keep live stop ETAs, but omit these incomplete patterns from trip guidance.
 excluded=[{'id':r['id'],'missing':[i for i in r['stops'] if i not in stops]} for r in routes.values() if any(i not in stops for i in r['stops'])]
 save('KMB',stops,[r for r in routes.values() if all(i in stops for i in r['stops'])],excluded)
def city():
 rr=get(C+'/route/CTB')['data'];print('Citybus routes',len(rr),flush=True)
 def pattern(t):
  r,d=t;rows=get(C+'/route-stop/CTB/'+urllib.parse.quote(r['route'])+'/'+d)['data']
  return {'id':r['route']+'-'+d,'route':r['route'],'dir':d[0].upper(),'dest':r['dest_en'] if d=='outbound' else r['orig_en'],'destTc':r['dest_tc'] if d=='outbound' else r['orig_tc'],'op':'CTB','stops':[s['stop'] for s in sorted(rows,key=lambda s:int(s['seq']))]}
 routes=pool(pattern,[(r,d) for r in rr for d in ['outbound','inbound']]);ids=set(s for r in routes for s in r['stops']);print('Citybus stop coordinates',len(ids),flush=True)
 def stop(i):
  s=get(C+'/stop/'+i)['data'];return i,{'id':i,'name':s['name_en'],'tc':s['name_tc'],'lat':float(s['lat']),'lng':float(s['long']),'op':'CTB'}
 save('CTB',dict(pool(stop,sorted(ids))),[r for r in routes if r['stops']])
def gmb():
 # TD's current GeoJSON includes intermediate stops, not just termini. Stop IDs
 # and numeric route IDs match the GMB ETA API. One bulk unpaginated response
 # replaces thousands of stop requests. Never infer coordinates from route lines.
 url='https://static.data.gov.hk/td/routes-fares-geojson/JSON_GMB.json'
 # The official file can include a UTF-8 BOM.
 with urllib.request.urlopen(url,timeout=60) as r:j=json.loads(r.read().decode('utf-8-sig'))
 stops={};routes={}
 for f in j['features']:
  p=f['properties'];lng,lat=f['geometry']['coordinates'][:2];sid=str(p['stopId'])
  stops[sid]={'id':sid,'name':p['stopNameE'],'tc':p['stopNameC'],'lat':lat,'lng':lng,'op':'GMB'}
  key=str(p['routeId'])+'-'+str(p['routeSeq'])
  r=routes.setdefault(key,{'id':key,'routeId':p['routeId'],'route':p['routeNameE'],'dir':p['routeSeq'],'dest':p['locEndNameE'],'destTc':p['locEndNameC'],'op':'GMB','region':p['district'],'stops':[]})
  r['stops'].append((int(p['stopSeq']),sid))
 for r in routes.values():
  seqs=sorted(set(r['stops']))
  if [x[0] for x in seqs]!=list(range(1,len(seqs)+1)):raise ValueError('Incomplete GMB pattern '+r['id'])
  r['stops']=[x[1] for x in seqs]
 save('GMB',stops,list(routes.values()))
if __name__=='__main__':
 import sys
 for op in sys.argv[1:] or ['KMB','CTB','GMB']: {'KMB':kmb,'CTB':city,'GMB':gmb}[op]()
