# NextStop — Hong Kong transit PWA

A self-contained React + vanilla JavaScript app with compiled Tailwind CSS. No advertising, analytics, third-party runtime CDN, API keys, accounts or backend required on an ordinary static host.

## Run immediately

The `dist/` directory is the complete, ready-to-host application. Serve it rather than opening `index.html` with `file://`:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. Deploy the contents of `dist/` to any HTTPS static host. HTTPS is required for browser GPS, service workers and installation (localhost is an exception). Phone access via an ordinary LAN HTTP address does NOT qualify as localhost. Relative asset URLs support subdirectory hosting.

- iOS/iPadOS: open the HTTPS URL in Safari → Share → Add to Home Screen → Add.
- Android: open in Chrome → Install app, or Chrome menu → Install app/Add to Home screen. The in-app install button uses `beforeinstallprompt` where available and supplies manual instructions otherwise.
- On the private hosted preview, sign in with the owner account first. An ordinary static HTTPS deployment avoids that host-level sign-in layer.

## Source and files

| File | Purpose |
| --- | --- |
| `dist/index.html` | HTML shell, metadata, manifest, Apple icon |
| `src/app.jsx` | React interface, GPS, filters, saved stops, destination guidance, refresh lifecycle |
| `src/api.js` | Credential-free REST calls, timeouts, bounded concurrency, operator adapters |
| `src/i18n.js` | UI translations, persistent locale context and local Chinese script conversion |
| `src/core.js` | Haversine, HKT time conversion, freshness and direct-route matching |
| `src/style.css` | Tailwind directives and custom responsive styling |
| `dist/app.js`, `dist/styles.css` | Compiled JavaScript and CSS; no build step needed to run |
| `dist/manifest.json` | Standalone PWA identity, scope and install icons |
| `dist/sw.js` | Offline app/directory cache; live API responses are never cached |
| `dist/icons/` | PNG icons, Apple touch icon and maskable icon |
| `dist/data/*.json` | Timestamped stop/route indexes generated exclusively from official sources below |
| `scripts/build-directory.py` | Resumable KMB/Citybus/GMB directory generator (Python standard library) |
| `scripts/build-mtr.py` | MTR route identities and Lands Department station access matching |
| `tests/core.test.js` | Distance, timezone, parser, freshness and directional routing tests |

This is a lightweight static app, not literally one file. A genuine PWA needs its manifest and a separately served same-origin service worker. React JSX is compiled at build time; visitors do not download Babel or Tailwind's browser compiler.

## Develop

Node.js 20+ and npm:

```sh
npm ci
npm test
npm run build
```

Refresh the static stop directories periodically (for example, before deployment and weekly). Python 3.10+ is used only for developer-side directory generation, not by the app:

```sh
python3 scripts/build-directory.py KMB CTB GMB
python3 scripts/build-mtr.py
npm test
npm run build
```

The generator caches successful responses in `.data-cache/` for 24 hours and retries transient failures with backoff. It fails on missing data rather than publishing an incomplete directory. Citybus requires many small requests; allow time for a full refresh. Do not run concurrent copies of the same generator. A failed run can resume from the cache. Bump `VERSION` in `dist/sw.js` when publishing updated assets or data. Close existing app windows to allow a waiting worker to activate.

## Languages

The header selector offers English, 繁體中文 and 简体中文. The preference is saved locally and updates the document language for assistive technology. Interface copy, installation help, errors, available Chinese address fields and operator stop/destination names switch together. Traditional Chinese operator fields are retained; Simplified Chinese conversion uses bundled OpenCC locally, with no translation API or tracking. Route numbers and station IDs remain unchanged.

## What the app does

- Explicit location button uses `navigator.geolocation.watchPosition`; no permission prompt on initial load. GPS errors offer a starting-address fallback. Updates more than 20 m apart recalculate the nearby-stop list. An accuracy warning appears above 100 m.
- Haversine calculates the true great-circle distance; nearby matches use an inclusive **400 m radius**, sorted nearest first. No fabricated stops or live arrival values.
- MTR distances use the nearest mapped access point where available. These can be indoor exits/access points, not guaranteed accessible street entrances. Lok Ma Chau uses a labelled station bounding-box centre because an access point was absent in the source. No step-free routing is claimed.
- Live requests run for the displayed stops only (initially 8). Load more to expand. Per-stop arrivals are grouped by route, direction, service and stop occurrence. Circular routes keep distinct occurrences.
- Refresh every 30 seconds while visible; pause polling in hidden tabs. Abort superseded requests. One failed operator does not remove other operators' results. Partial line/route failures are flagged.
- Predictions older than 120 seconds, invalid MTR predictions, null ETAs and departures already more than 15 seconds past are not shown as live. Stale feed times are distinct from local fetch times. Offline mode never claims live arrivals.
- The highlighted “soonest” departure is the first live prediction after a straight-line walking estimate from the displayed stops, **not the fastest end-to-end journey or a boarding guarantee**.
- Saved stop IDs stay in browser local storage. They can be viewed even outside the 400 m nearby radius. GPS coordinates are not stored or sent by the app. The provider still receives requested stop IDs and ordinary network metadata. Addresses typed into search are sent to the government ALS service.

## Destination guidance — deliberately bounded

Search an address, **select the correct candidate**, and choose a transport preference. The app finds direct route patterns with a boarding stop within 400 m of the origin and a downstream alighting stop within 400 m of the destination. Suggestions sort by total straight-line walking distance, not train/bus travel time. If no direct pattern is found, it says so and offers the nearest stop of the preferred mode. The stop dialog provides a north-up bearing and coordinates.

This is NOT a multimodal trip planner: no transfers, fares, service-calendar validation, traffic prediction, street-level walking network, turn-by-turn instructions or step-free routing. Static direct connections may be special/night services and might not be operating now. Check live arrivals and the operator. Walking estimates use 70 m/min and do not include station access, roads, hills, barriers or crossings. A direct train pattern does not guarantee that a short-turn departure reaches the suggested destination. Always check the displayed train destination.

## Official data and API details

DATA.GOV.HK is a catalogue. The data itself is served from listed producer domains; requiring every request to have the literal hostname `data.gov.hk` would exclude the official KMB and GMB feeds.

| Service | Official endpoint / source | Handling |
| --- | --- | --- |
| KMB/LWB | `https://data.etabus.gov.hk/v1/transport/kmb/stop`, `/route`, `/route-stop`, `/stop-eta/{stop_id}` | Bulk unpaginated directory lists; preserve bound, service_type and stop sequence. Null ETA is not zero minutes. |
| Citybus | `https://rt.data.gov.hk/v2/transport/citybus/route/CTB`, `/route-stop/CTB/{route}/{inbound\|outbound}`, `/stop/{id}`, `/eta/CTB/{stop}/{route}` | Use V2 and CTB, including former NWFB routes. No bulk all-stop endpoint or page parameter; enumerate route/direction patterns then deduplicate stop IDs. Direction is retained in ETA rows. |
| Green minibuses | `https://data.etagmb.gov.hk/eta/stop/{stop_id}` | Route codes are not globally unique. Keep numeric route IDs and direction; use WGS84 coordinates, not HK80. Absolute ETA timestamp avoids cumulative countdown drift. Respect disabled ETA flags. |
| GMB stop/route directory | `https://static.data.gov.hk/td/routes-fares-geojson/JSON_GMB.json` | One unpaginated GeoJSON response, including intermediate stops; numeric stop/route IDs match the ETA API. Validate complete stop sequences. Decode the optional UTF-8 BOM. |
| MTR Next Train | `https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php?line=TWL&sta=CEN&lang=EN` | Parse `data[LINE-STATION].UP/DOWN`; treat timestamps without a timezone as Hong Kong UTC+08:00, never the phone's timezone. Preserve platform, valid and delay indicators. |
| MTR identities/topology | `https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv` | Official CSV used only at build time for line/station identity and route order. Station coordinates and live arrivals come from REST endpoints. |
| MTR locations | Lands Department WFS REST: `https://mapapi.hkmapservice.gov.hk/ogc/wfs/indoor/mtr_venue_polygon` and `mtr_amenity_point` | GeoJSON station geometry/access points; entry-category filter. Assert returned count against `totalFeatures`; fail on truncation. Exact normalized station-name join, no fuzzy coordinate guesses. |
| Address lookup | `https://www.als.gov.hk/lookup?q={address}&n=8` with `Accept: application/json` | Parse `SuggestedAddress[].Address.PremisesAddress.GeospatialInformation`. Present candidate choices. `n` limits suggestions; it is not a page index. |

Catalogue / specification links:

- KMB: https://data.etabus.gov.hk/datagovhk/kmb_eta_api_specification.pdf
- Citybus V2: https://www.citybus.com.hk/datagovhk/bus_eta_api_specifications.pdf
- GMB: https://data.gov.hk/en-data/dataset/hk-td-sm_7-real-time-arrival-data-of-gmb
- GMB bulk directory: https://data.gov.hk/en-data/dataset/hk-td-tis_23-routes-fares-geojson
- GMB specification: https://data.etagmb.gov.hk/static/GMB_ETA_API_Specification.pdf
- MTR Next Train: https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data
- MTR topology: https://data.gov.hk/en-data/dataset/mtr-data-routes-fares-barrier-free-facilities
- 3D Indoor Map: https://data.gov.hk/en-data/dataset/hk-landsd-openmap-3d-indoor-map
- MTR access REST specification: https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-indoor-mtr-station-map
- ALS: https://data.gov.hk/en-data/dataset/hk-dpo-als_01-als

### CORS

Live fetches are simple GETs with `credentials: 'omit'` and a safelisted `Accept` header. Do not send `Content-Type: application/json` on a GET. Do not add `Access-Control-Allow-Origin` to request headers: only the server can grant CORS. `mode: 'no-cors'` makes the response opaque and cannot fix JSON access. The app reports errors if the provider blocks the deployed origin.

KMB, Citybus, GMB, MTR and ALS CORS support should be checked against your actual production origin. If a producer changes policy, use a relay you control on the same origin, restricted to explicit known endpoints, with timeouts, rate limits and no arbitrary URL forwarding. Never route precise locations or addresses through a public CORS proxy. The delivered static app does not depend on a relay.

### PWA and offline limitations

The service worker precaches the local app shell, icons and four stop directories; it handles same-origin app resources only. Live ETAs and address results are not persisted. First use needs connectivity and a successful service worker install. A browser or OS may evict storage. iOS does not support Android's install prompt API. Actual home-screen installation requires final testing on physical iOS and Android devices.

## Coverage

The current official KMB route feed references two stop IDs that are absent from both its bulk and single-stop APIs. Three affected route patterns are excluded from destination matching and recorded under `incompletePatterns`; live ETAs at known stops remain available. No coordinates are guessed.

KMB/LWB, Citybus, ten MTR Next Train lines and green minibuses. No red minibuses, Light Rail, MTR feeder buses, ferries or trams. MTR station access geometry and operator service coverage may change. No claim of complete pedestrian accessibility.

## Validation

Automated tests cover distance thresholds, HK timestamps, bus/MTR/GMB parsing, stale predictions, upstream rejection and repeated circular-route stops. Browser QA verified government address lookup, nearby stop matching, live KMB/MTR/Citybus arrivals, mode filtering, saving a stop, Chinese language switching and mobile layout. GMB live feed access and parsing were checked separately. Direct destination matching is covered by automated tests; a complete browser journey test was not completed. Physical-device GPS accuracy and native home-screen installation are not simulated by these tests.
