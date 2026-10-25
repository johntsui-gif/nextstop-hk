import React,{createContext} from 'react';
import * as OpenCC from 'opencc-js/t2cn';
export const LanguageContext=createContext('en');
// OpenCC runs locally. No translation service receives addresses or location.
const toSimplified=OpenCC.Converter({from:'hk',to:'cn'});
export const chinese=(s,locale)=>locale==='zh-Hans'?toSimplified(s||'').replaceAll('应用程式','应用程序'):(s||'');
const traditional={
'Standard route':'一般路線','Alternative service':'其他服務班次','Different starting stop':'不同起點班次','Alternative stopping pattern':'不同停站安排','Starts at':'起點','Ends at':'終點','Also serves':'另經','Does not serve':'不停靠','Operating days and times: check official timetable.':'服務日期及時間：請查閱官方時間表。','Official timetable ↗':'官方時間表 ↗','Timetable times are departures from the starting terminus. Live arrivals below are for your selected stop.':'時間表列出起點總站的開車時間；下方即時預報則為所選車站的到站時間。','No live predictions available. Check the official timetable for operating hours.':'暫無即時到站預報，請查閱官方時間表了解服務時間。',

'Search route':'搜尋路線',
'Closest boarding stop selected ·':'已選擇最近上車站 ·','Finding your nearest boarding stop…':'正在尋找最近的上車站…','Allow location to select the nearest stop automatically, or choose a direction and stop.':'允許定位即可自動選擇最近車站，或自行選擇方向及車站。',
'Routes':'路線','Journey':'行程','Find your bus':'搜尋巴士路線','Bus route number':'巴士路線號碼','e.g. 1A, 960, A21':'例如：1A、960、A21','KMB / LWB and Citybus · Search by route number':'九巴／龍運及城巴 · 按路線號碼搜尋','No matching routes':'找不到符合的路線','Change direction':'更改方向','Boarding stop':'上車站','Choose your stop':'選擇車站','Next arrivals':'接下來的班次','Service':'服務','Search options':'搜尋選項','Live feeds refresh every 30 seconds while this page is visible.':'頁面開啟時每30秒更新即時到站時間。',
'Install':'安裝','stops':'個車站','directory:':'資料更新：','N':'北','NE':'東北','E':'東','SE':'東南','S':'南','SW':'西南','W':'西','NW':'西北','Install app':'安裝應用程式','Less waiting. More Hong Kong.':'少等一會，多看香港。','Your city.':'你的城市。','Your next ride.':'你的下一程。',
'Live arrivals, just around the corner. No ads. No noise.':'附近交通的即時到站時間。沒有廣告，簡單清晰。','Connected':'已連線','Offline':'離線','Hong Kong ·':'香港 ·',
'YOUR STARTING POINT':'出發地點','Find what’s near you':'尋找附近交通','Your current location':'你的目前位置','Locating…':'定位中…','Locate':'重新定位','Use location':'使用定位',
'GPS coordinates stay on this device':'GPS 座標只在此裝置處理','Enter starting address':'輸入出發地址','Starting address':'出發地址','e.g. 100 Nathan Road':'例如：彌敦道100號',
'GPS is approximate. Stops near the 400 m boundary may be missed.':'GPS 位置不夠準確，可能遺漏400米範圍邊緣的車站。',
'This browser does not support location. Enter a starting address instead.':'此瀏覽器不支援定位，請輸入出發地址。',
'Location permission is off. Enable it in browser settings, or enter a starting address.':'定位權限已關閉。請在瀏覽器設定中開啟，或輸入出發地址。',
'Could not get a GPS fix. Try outdoors or use a starting address.':'未能取得 GPS 位置。請到室外再試，或輸入出發地址。',
'All transport':'全部交通','Any transport':'不限交通方式','KMB':'九巴','Citybus':'城巴','MTR':'港鐵','Minibus':'小巴',
'Soonest after estimated walk':'預計步行後最早可乘搭','From':'由','to':'往','· boarding not guaranteed':'· 不保證能趕上班次','Due':'即將到站','min':'分鐘','m away':'米外',
'Nearby stops':'附近車站','Saved':'已收藏','Refresh':'重新整理','Refresh arrivals':'更新到站時間','Find this stop':'尋找此車站','Show more stops':'顯示更多車站',
'Destination not supplied':'未提供目的地','Operator arrival estimate':'營辦商預計到站時間','Getting live arrivals…':'正在取得即時到站時間…','Refreshing…':'更新中…','Updates every 30s':'每30秒更新',
'Offline — live arrivals unavailable':'目前離線，無法取得即時到站時間','Live feed unavailable':'暫時未能取得即時資料','Feed is stale — waiting for an update':'資料已過時，正等待更新',
'No current arrival predictions. The service may not be running.':'暫無到站預報，路線可能未在營運。','Some services could not be refreshed.':'部分路線未能更新。',
'Loading the stop directory…':'正在載入車站資料…','Your regular stops, one tap away':'常用車站，一按即達','A better way to wait':'等車，從此更輕鬆','No matching stops within 400 m':'400米範圍內沒有符合的車站',
'Tap the star on a stop to keep it here.':'點選車站旁的星號，即可收藏於此。','Use your location or enter a starting address to see real arrival times for nearby buses, trains and minibuses.':'使用定位或輸入出發地址，即可查看附近巴士、港鐵及小巴的即時到站時間。',
'Try another transport mode or starting address. The search radius is a straight-line distance.':'請選擇其他交通方式或出發地址。搜尋範圍以直線距離計算。','Find nearby transport →':'尋找附近交通 →',
'Nearest first · 400 m straight-line radius · Live feeds refresh every 30 seconds while this page is visible. “Soonest” compares the stops currently displayed, not total journey time.':'按距離排列 · 400米直線範圍 · 頁面開啟時每30秒更新。「最早」只比較目前顯示車站的班次，並非整段行程所需時間。',
'You’re offline. Saved stop information is available; live arrivals and address search need a connection.':'你目前離線，仍可查看已儲存的車站資料。即時到站時間及地址搜尋需要網絡連線。',
'Where to?':'想去哪裏？','Destination address':'目的地地址','Building name or street address':'大廈名稱或街道地址','Preferred transport':'偏好交通方式','Going to':'前往','Clear destination':'清除目的地',
'Set your starting point to find a boarding stop.':'請先設定出發地點，以尋找上車站。','Direct connections · least walking':'直達路線 · 步行最少優先','Route patterns only. Check the live destination and operating hours.':'僅按路線資料配對。請核對實際班次的目的地及服務時間。',
'Board at':'上車站：','Alight at':'下車站：','min walk*':'分鐘步行*','m from destination':'米至目的地',
'No direct connection found with boarding and alighting stops within 400 m. Transfers are not calculated.':'未找到上、下車站均在400米內的直達路線。本程式不計算轉乘。',
'Find a nearby boarding stop with a direct connection to your destination. Confirm the address before travelling.':'尋找可直達目的地的附近上車站。出發前請確認地址。',
'*Walking times assume 70 m/min in a straight line. Streets, hills, crossings and station access can take longer. No turn-by-turn or transfer routing.':'*步行時間以每分鐘70米直線距離估算。街道、斜坡、過路及進出車站可能需時較長。不提供逐步導航或轉乘規劃。',
'Around you':'附近一覽','400 M RADIUS':'400米範圍','400 m':'400米','N ↑':'北 ↑','Your next journey starts here':'下一程，從這裏開始','North-up distance diagram · not a street map':'上方為北的距離示意圖，並非街道地圖',
'Public data. Personal journeys.':'公共數據，你的旅程。','No advertising or analytics. Saved stops stay in this browser. Address searches go to the government’s Address Lookup Service. Green minibuses only; no red minibus predictions.':'沒有廣告或分析追蹤。收藏車站只儲存於此瀏覽器。地址搜尋由政府「地址搜尋服務」處理。僅支援綠色專線小巴，不提供紅色小巴到站預報。',
'Data sources & coverage':'數據來源及涵蓋範圍','KMB/LWB, Citybus V2, MTR Next Train and Transport Department GMB feeds listed on':'九巴／龍運、城巴 V2、港鐵 Next Train 及運輸署專線小巴資料，均刊載於',
'. Station locations: Lands Department. Operator estimates may change. This app is not affiliated with the operators.':'。車站位置由地政總署提供。營辦商的預報可能改變。本程式與交通營辦商並無隸屬關係。',
'Built for the journey, not the scroll.':'專為出行而設，簡單清晰。','Close':'關閉','Find stop':'尋找車站','Station reference point ·':'車站參考位置 ·',
'Set your starting point to calculate distance.':'請先設定出發地點，以計算距離。','North-up bearing, not your phone’s heading. Follow safe public footpaths and check the correct side of the road. This is not a walking route.':'方位以上方為北，並非手機朝向。請沿安全公共行人路前往，並確認車站所在的道路一側。此處並非步行路線導航。',
'Save this stop':'收藏此車站','Remove from saved stops':'取消收藏此車站','Your pocket departure board.':'隨身到站資訊。','Add NextStop to your home screen for a standalone app experience.':'將 NextStop 加至主畫面，享用獨立應用程式體驗。',
'Install NextStop':'安裝 NextStop','iPhone / iPad':'iPhone / iPad','Open in Safari → Share → Add to Home Screen → Add.':'在 Safari 開啟 → 分享 → 加入主畫面 → 新增。','Android':'Android','Open in Chrome → menu ⋮ → Install app or Add to Home screen.':'在 Chrome 開啟 → 選單 ⋮ → 安裝應用程式或加至主畫面。',
'Offline mode keeps the app and stop directory available after the first successful load. Live arrivals require internet.':'首次成功載入後，可離線開啟程式及車站資料。即時到站時間需要網絡連線。','Got it':'知道了',
'No address found. Try a building name or a street number.':'找不到地址，請嘗試輸入大廈名稱或街道門牌號碼。','Address service unavailable. Check your connection and try again.':'地址搜尋服務暫時無法使用，請檢查網絡後再試。','Choose the correct address':'請選擇正確地址','Search':'搜尋','Plan a journey':'規劃行程','· destination selected':'· 已選擇目的地','ETA unavailable':'暫無到站預報','Scheduled':'預定班次','Service delay':'服務延誤',
'North-up diagram of nearby stops; straight-line distances, not a street map':'上方為北的附近車站直線距離示意圖，並非街道地圖','Transport filter':'交通方式篩選','incomplete route patterns excluded from destination matching':'條資料不完整的路線已從目的地配對中排除'
};
const cache=new Map();
export function tr(text,locale='en'){
 if(locale==='en'||typeof text!=='string')return text;
 const key=locale+'|'+text;if(cache.has(key))return cache.get(key);
 const trimmed=text.trim();let out=traditional[trimmed];
 if(out===undefined){
  out=trimmed
   .replace(/^GPS accuracy ±(\d+) m$/,'GPS 精確度 ±$1米')
   .replace(/^Fetched (\d+)s ago$/,'$1秒前取得資料')
   .replace(/^Platform ([^ ·]+)(.*)$/,'$1號月台$2')
   .replace(/^Exit (.+)$/,'$1出口')
   .replace(/· next (\d+) min$/,'· 下班$1分鐘')
   .replace(/^(\d+) min straight-line estimate$/,'約$1分鐘（直線估算）')
   .replace(/^Stop directory unavailable: (.+)\. Reload when connected\.$/,'未能載入車站資料：$1。連線後請重新載入。')
   .replace(/^Find nearest (.+) stop: /,'尋找最近的$1車站：')
   .replace(/^Find nearest stop: /,'尋找最近車站：')
   .replace(/^Search (.+)$/,'搜尋$1')
   .replace(/^Unsave (.+)$/,'取消收藏$1')
   .replace(/^Save (.+)$/,'收藏$1');
  // Composed labels retain dynamic values, while fixed UI fragments are translated.
  for(const [en,zh] of Object.entries(traditional).sort((a,b)=>b[0].length-a[0].length)){
   if(en.length>3&&out.includes(en))out=out.split(en).join(zh);
  }
 }
 const result=chinese(text.replace(trimmed,out),locale);if(cache.size>5000)cache.clear();cache.set(key,result);return result;
}
// Localize React text/accessible labels before rendering; no DOM rewriting and
// no runtime HTML injection. Custom components localize their own render tree.
export function localizedTree(node,locale){
 if(typeof node==='string')return tr(node,locale);
 if(Array.isArray(node))return node.map(n=>localizedTree(n,locale));
 if(!React.isValidElement(node))return node;
 if(node.type==='option'&&['en','zh-Hant','zh-Hans'].includes(node.props.value))return node;
 const props={};for(const key of ['placeholder','aria-label','title'])if(typeof node.props[key]==='string')props[key]=tr(node.props[key],locale);
 if(node.props.children!==undefined)props.children=localizedTree(node.props.children,locale);
 return React.cloneElement(node,props);
}
export function localizeDirectory(raw,locale){return Object.fromEntries(Object.entries(raw).map(([op,d])=>{
 const stops=d.stops.map(s=>({...s,name:locale==='en'?s.name:chinese(s.tc||s.name,locale),entrances:s.entrances?.map(e=>({...e,name:tr(e.name,locale)}))}));
 const byId=Object.fromEntries(stops.map(s=>[s.id,s]));
 const routes=d.routes.map(r=>({...r,dest:locale==='en'?r.dest:chinese(r.destTc||byId[r.stops.at(-1)]?.name||r.dest,locale)}));
 return [op,{...d,stops,byId,routes,locale}];
}));}
