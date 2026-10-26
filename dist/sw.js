/* Bump VERSION when any shell asset or bundled directory changes.
 * Cache only this app's assets. NEVER cache live ETAs: an old prediction must
 * not appear live after losing connectivity. No third-party CDN dependencies.
 */
const VERSION='nextstop-material-v9';
const SHELL=['./','./index.html','./app.js','./styles.css','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./data/KMB.json','./data/CTB.json','./data/LR.json','./data/fares.json','./data/GMB.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('nextstop-')&&k!==VERSION)await caches.delete(k);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 const base=new URL('./',self.location.href).pathname;
 if(!url.pathname.startsWith(base))return;
 const relative='./'+url.pathname.slice(base.length);
 if(!SHELL.includes(relative)&&!/^\.\/data\/(KMB|CTB|MTR|GMB)\.json$/.test(relative)&&event.request.mode!=='navigate')return;
 event.respondWith((async()=>{
  const cache=await caches.open(VERSION);
  // Network-first documents/data; cache-first immutable shell within a version.
  const old=await cache.match(event.request);
  if(old&&event.request.mode!=='navigate'&&!relative.startsWith('./data/'))return old;
  try{const r=await fetch(event.request);if(r.ok&&r.type==='basic'&&!r.redirected)await cache.put(event.request,r.clone());return r;}
  catch{if(old)return old;if(event.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();return Response.error();}
 })());
});
