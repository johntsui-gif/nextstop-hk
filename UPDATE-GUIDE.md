# Mobile reminder update (draft)

Apply all files together using the pull request. Do not paste JSX into dist/index.html.

Source: src/app.jsx, src/ArrivalReminder.jsx, src/reminders.js, src/i18n.js and src/style.css. Deployable output: dist/app.js, dist/app.js.map, dist/styles.css and dist/sw.js. Deploy all of dist together.

The existing GitHub Pages workflow publishes dist directly. This update includes compiled files; editing source alone does not rebuild the deployed app. Run npm ci, npm test, npm run build before committing future source edits.

## Implemented
- Search-first bus page with automatic GPS and nearby route suggestions.
- Separate results and route detail screens; direction changes replace the current route.
- KMB and Citybus in one search; separate green minibus and Light Rail views.
- Material-inspired drawer, large touch targets, surfaces, expandable stops, saved routes and radius settings.
- Official Light Rail routes/stops directory and live platform arrivals.
- Transport Department published full fares for matching bus routes, with source date and section-fare caveat.
- Official timetable links; long-press or button to arm a foreground stop reminder.
- Configurable proximity reminders, screen wake lock, session-enabled audio/test control, optional foreground-triggered phone notifications, persistent reminder recovery and explicit GPS/platform status. New labels support both Chinese locales.

## Limits / review before release
- GPS reminders need field testing on iOS/Android. They require the app to remain visible and unlocked. A wake-lock request can fail or be released by the OS; audio must be enabled with a tap for the session and remains subject to volume/browser settings. Optional notifications do not enable background GPS.
- Reminders now fire inside the selected straight-line radius (300 m / 500 m / 1 km), without requiring intermediate stop matches. If armed inside the radius, they wait for departure beyond the radius plus 150 m and a return. Routes passing close to their destination early can still trigger early. A saved reminder requires explicit resumption after reopening and expires after four hours. See README for the native background-location work needed for locked-screen alerts.
- Light Rail lacks coordinates in its official route CSV: manual stop selection only, no distance or stop reminders. Live arrivals show all matching route platforms with destinations; verify the platform.
- Circular routes with no published reverse direction show an explanation instead of inventing reverse stops. Opposite-number circular services are not automatically paired.
- Fares are full-route fares, not boarding-specific section fares; multiple matching published fares are displayed. Minibus and Light Rail fares are linked, not calculated.
- KMB and Citybus share a UI; joint-service ETAs are not deduplicated across operator stop IDs. Other bus operators are not added.
- Interface and reminder labels support English, Traditional Chinese and Simplified Chinese. Existing saved stops remain in browser storage but the Saved screen stores routes separately.
- No real-device GPS or background notification validation was possible here.

## Sources
https://opendata.mtr.com.hk/data/light_rail_routes_and_stops.csv
https://opendata.mtr.com.hk/doc/LR_Next_Train_API_Spec_v1.1.pdf
https://static.data.gov.hk/td/routes-fares-xml/ROUTE_BUS.xml

## Applying in GitHub
Open the pull request, review Files changed, then mark Ready for review and Merge pull request. The main-branch Pages workflow deploys dist. Wait for a green Actions run. Close all existing NextStop windows and reopen to activate the new service-worker cache.
