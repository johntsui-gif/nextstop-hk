import {parseBus,parseMTR,parseGMB} from './core.js';
const BASE={KMB:'https://data.etabus.gov.hk/v1/transport/kmb',CTB:'https://rt.data.gov.hk/v2/transport/citybus',GMB:'https://data.etagmb.gov.hk'};
// data.gov.hk is a catalogue: call its LISTED producer URLs, not the catalogue HTML.
// Simple credential-free GETs avoid unnecessary preflights. Accept is CORS-safelisted.
// CORS must be allowed by the upstream server; mode:"no-cors" gives unreadable
// opaque responses. Never use a public CORS proxy. A host-controlled allowlisted
// relay is the appropriate fallback if a producer changes its CORS policy.
export async function json(url,signal) {
 const controller=new AbortController();
 const cancel=()=>controller.abort();
 if(signal?.aborted)controller.abort();
 signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(cancel,15000);
 try {
  const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'},credentials:'omit',cache:'no-store'});
  if(!response.ok)throw new Error(`Data service returned ${response.status}`);
  return await response.json();
 } finally { clearTimeout(timer);signal?.removeEventListener('abort',cancel); }
}
export async function mapLimit(items,limit,fn){let next=0;const out=new Array(items.length);
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(next<items.length){let i=next++;try{out[i]={status:'fulfilled',value:await fn(items[i])};}catch(reason){out[i]={status:'rejected',reason};}}}));return out;}
export async function arrivals(stop,db,signal) {
 if(stop.op==='KMB')return parseBus(await json(`${BASE.KMB}/stop-eta/${stop.id}`,signal),'KMB',stop.id,db.locale);
 if(stop.op==='GMB')return parseGMB(await json(`${BASE.GMB}/eta/stop/${stop.id}`,signal),stop.id,db.routes,db.locale);
 const patterns=db.routes.filter(r=>r.stops.includes(stop.id));
 const routes=[...new Set(patterns.map(r=>r.route))];
 const all=await mapLimit(routes,3,async route=>{
  if(stop.op==='CTB')return parseBus(await json(`${BASE.CTB}/eta/CTB/${stop.id}/${encodeURIComponent(route)}`,signal),'CTB',stop.id,db.locale);
  const j=await json(`https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=${route}&sta=${stop.id}&lang=EN`,signal);
  return parseMTR(j,stop.id,route,Object.fromEntries(db.stops.map(s=>[s.id,s.name])));
 });
 const failures=all.filter(r=>r.status==='rejected');
 if(failures.length===all.length&&all.length)throw failures[0].reason;
 const result=all.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
 result.partial=failures.length>0;return result;
}
export async function lookup(q,signal) {
 // ALS n limits candidates, it is not a page number. Present candidates for user
 // confirmation; the highest score is not proof of an exact address match.
 const j=await json(`https://www.als.gov.hk/lookup?q=${encodeURIComponent(q)}&n=8`,signal);
 return (j.SuggestedAddress||[]).map(x=>{
 const p=x.Address?.PremisesAddress||{},e=p.EngPremisesAddress||{},g=p.GeospatialInformation;
 const geo=Array.isArray(g)?g[0]:g; const c=p.ChiPremisesAddress||{}; const tc=[c.ChiDistrict?.DcDistrict,c.ChiStreet?.StreetName,c.ChiStreet?.BuildingNoFrom&&c.ChiStreet.BuildingNoFrom+'號',c.ChiEstate?.EstateName,c.BuildingName].filter(Boolean).join('');
 return {tc,name:[e.BuildingName,e.EngEstate?.EstateName,[e.EngStreet?.BuildingNoFrom,e.EngStreet?.StreetName].filter(Boolean).join(' '),e.EngDistrict?.DcDistrict].filter(Boolean).join(', '),lat:Number(geo?.Latitude),lng:Number(geo?.Longitude)};
 }).filter(x=>x.name&&x.lat>22&&x.lat<23&&x.lng>113&&x.lng<115);
}
