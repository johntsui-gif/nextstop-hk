import {chinese} from './i18n.js';
export const OPS = {KMB:{name:'KMB',color:'#e65450'},CTB:{name:'Citybus',color:'#cd950d'},MTR:{name:'MTR',color:'#965bc0'},GMB:{name:'Minibus',color:'#1b947b'}};
export const rad = n => n * Math.PI / 180;
// Great-circle distance in metres; distances are NOT pedestrian route lengths.
export function haversine(a,b) {
 const p=rad(b.lat-a.lat),q=rad(b.lng-a.lng);
 const h=Math.sin(p/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(q/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));
}
export function bearing(a,b) {
 const d=rad(b.lng-a.lng), x=Math.sin(d)*Math.cos(rad(b.lat));
 const y=Math.cos(rad(a.lat))*Math.sin(rad(b.lat))-Math.sin(rad(a.lat))*Math.cos(rad(b.lat))*Math.cos(d);
 return (Math.atan2(x,y)*180/Math.PI+360)%360;
}
export const compass = angle => ['N','NE','E','SE','S','SW','W','NW'][Math.round(angle/45)%8];
export const walk = m => Math.max(1,Math.ceil(m/70));
export function hkTime(s) {
 if(!s) return NaN;
 // MTR sends HKT without a timezone. Do not interpret it as the phone's timezone.
 return Date.parse(/[Zz]|[+-]\d\d:\d\d$/.test(s)?s:s.replace(' ','T')+'+08:00');
}
export function nearby(stops,pos,radius=400) {
 return stops.filter(s=>s.enabled!==false&&Number.isFinite(s.lat)&&Number.isFinite(s.lng))
 .map(s=>({...s,distance:haversine(pos,s)})).filter(s=>s.distance<=radius).sort((a,b)=>a.distance-b.distance);
}
export function parseBus(j,op,stop,locale='en') {
 return (j.data||[]).map(e=>({op,stop,route:e.route,dir:e.dir,seq:Number(e.seq),service:String(e.service_type||''),dest:locale==='en'?(e.dest_en||''):chinese(e.dest_tc||e.dest_en||'',locale),time:hkTime(e.eta),note:locale==='en'?(e.rmk_en||''):chinese(e.rmk_tc||e.rmk_en||'',locale),generated:hkTime(e.data_timestamp||j.generated_timestamp)}));
}
export function parseMTR(j,stop,line,names={}) {
 if(Number(j.status)!==1) throw new Error(j.message||'Train information unavailable');
 const d=j.data?.[`${line}-${stop}`]; if(!d) return [];
 return ['UP','DOWN'].flatMap(dir=>(d[dir]||[]).filter(e=>e.valid!=='N').map(e=>({op:'MTR',stop,route:line,dir,dest:names[e.dest]||e.dest,destCode:e.dest,time:hkTime(e.time),note:[e.plat&&`Platform ${e.plat}`,j.isdelay==='Y'&&'Service delay'].filter(Boolean).join(' · '),generated:hkTime(d.sys_time||j.sys_time)})));
}
export function parseGMB(j,stop,routes,locale='en') {
 return (j.data||[]).flatMap(group=>{
 const r=routes.find(r=>Number(r.routeId)===Number(group.route_id)&&Number(r.dir)===Number(group.route_seq));
 const base={op:'GMB',stop,route:r?.route||String(group.route_id),dir:group.route_seq,seq:Number(group.stop_seq),dest:r?.dest||'',generated:hkTime(j.generated_timestamp)};
 return group.enabled===false?[{...base,time:NaN,note:locale==='en'?(group.description_en||'ETA unavailable'):chinese(group.description_tc||group.description_en||'暫無到站預報',locale)}]:(group.eta||[]).map(e=>({...base,time:hkTime(e.timestamp),note:locale==='en'?(e.remarks_en||''):chinese(e.remarks_tc||e.remarks_en||'',locale)}));
 });
}
export function usable(e,now=Date.now()) {return Number.isFinite(e.time)&&e.time>=now-15000&&Number.isFinite(e.generated)&&now-e.generated<120000&&e.generated<=now+60000;}
// Only recommend a DIRECT service if the alighting occurrence is downstream.
// A stop can occur twice on a circular route: never collapse sequence occurrences.
export function directTrips(near,destination,directories) {
 const trips=[];
 for(const s of near){const db=directories[s.op];if(!db)continue;
 for(const r of db.routes){
  for(let i=0;i<r.stops.length;i++) {if(r.stops[i]!==s.id)continue;
   let best=null;
   for(let k=i+1;k<r.stops.length;k++) {let end=db.byId[r.stops[k]];if(!end)continue;if(end.entrances?.length){const ent=[...end.entrances].sort((a,b)=>haversine(a,destination)-haversine(b,destination))[0];end={...end,lat:ent.lat,lng:ent.lng,entrance:ent.name};}const d=haversine(end,destination);
    if(d<=400&&(!best||d<best.endDistance))best={end,endDistance:d,hops:k-i};}
   if(best)trips.push({start:s,route:r,boardSeq:i+1,...best});
  }
 }}
 return trips.sort((a,b)=>a.start.distance+a.endDistance-b.start.distance-b.endDistance);
}

// Show one standard pattern per operator/direction before special variants.
export function searchRoutes(db,query) {
 const q=query.trim().toUpperCase();if(!q)return [];
 const rows=['KMB','CTB'].flatMap(op=>(db[op]?.routes||[]).map(r=>({...r,op}))).filter(r=>r.route.toUpperCase().startsWith(q));
 rows.sort((a,b)=>(Number(a.service||1)-Number(b.service||1))||a.id.localeCompare(b.id));
 const seen=new Set();const ranked=rows.map(r=>{const key=[r.op,r.route,r.dir].join(':');const primary=!seen.has(key);seen.add(key);return {...r,primary};});
 return ranked.sort((a,b)=>(a.route.toUpperCase()===q?0:1)-(b.route.toUpperCase()===q?0:1)||a.route.localeCompare(b.route,undefined,{numeric:true})||Number(b.primary)-Number(a.primary)||a.op.localeCompare(b.op)||Number(a.service||1)-Number(b.service||1)||a.dir.localeCompare(b.dir));
}

// Exclude the final terminus: it is normally an alighting-only stop.
export function nearestBoarding(routes,db,pos) {
 if(!pos)return null;
 let best=null;
 for(const route of routes)for(let index=0;index<route.stops.length-1;index++){
  const stop=db[route.op]?.byId[route.stops[index]];
  if(!stop||stop.enabled===false||!Number.isFinite(stop.lat)||!Number.isFinite(stop.lng))continue;
  const distance=haversine(pos,stop);
  if(!best||distance<best.distance)best={route,index,stop,distance};
 }
 return best;
}

// Describe only differences confirmed by the stop directory, never infer hours
// or weekday restrictions from KMB's numeric service_type identifier.
export function routeVariant(route,db) {
 if(!route.service||route.service==='1')return {kind:'Standard route',details:[]};
 const base=db.routes.find(r=>r.route===route.route&&r.dir===route.dir&&r.service==='1');
 const name=id=>db.byId[id]?.name||id;
 if(!base)return {kind:'Alternative service',details:[]};
 const details=[];
 if(route.stops[0]!==base.stops[0])details.push({label:'Starts at',value:name(route.stops[0])});
 if(route.stops.at(-1)!==base.stops.at(-1))details.push({label:'Ends at',value:name(route.stops.at(-1))});
 const added=route.stops.filter(id=>!base.stops.includes(id));
 const skipped=base.stops.filter(id=>!route.stops.includes(id));
 if(added.length)details.push({label:'Also serves',value:added.slice(0,3).map(name).join(' · ')+(added.length>3?' …':'')});
 if(skipped.length)details.push({label:'Does not serve',value:skipped.slice(0,3).map(name).join(' · ')+(skipped.length>3?' …':'')});
 const changed=JSON.stringify(route.stops)!==JSON.stringify(base.stops);
 return {kind:route.stops[0]!==base.stops[0]?'Different starting stop':changed?'Alternative stopping pattern':'Alternative service',details};
}
