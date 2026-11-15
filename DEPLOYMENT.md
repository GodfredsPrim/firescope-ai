# Run the complete application

## Public Firebase research demo

15 November 2026 update: NASA date-linked GIBS imagery and the Activity calendar’s 2024–2025 archive/burned-area comparison are deployed at https://firescope-flareforge.web.app/#calendar. The archive contains 549,208 deduplicated observations across 731 completed request days, packaged into 24 independently loadable months. Burned-area totals are available for 18 months; six incomplete source months are explicitly unavailable. The three supported rectangular scopes share the same comparison bounds. These saved files work on static hosting without enabling live private adapters or billing.

Validation: 58 tests across 12 files pass; the production build and credential scan (including JSON/CSV files) pass. Saved-source reconciliation, checksum checks and an independent raster spot check are recorded in `artifacts/history-verification.json`. Published index, app bundle, both manifests and a source-month package match local production hashes (`artifacts/history-live-verification.json`). Live browser checks passed for scope/year changes, unavailable months, CSV downloads, real January source loading and mobile page overflow. The UI finish review accepted the extension with no material issues. `HISTORY_METHOD.md` documents quality gates and interpretation limits.

Published 14 November 2026: https://firescope-flareforge.web.app (project `firescope-flareforge`). This deployment uses Firebase Hosting without enabling paid billing or Cloud Functions. Custom domain `firescopeai.study` is registered with Firebase; Porkbun's root A record is `199.36.158.100` and its root TXT is `hosting-site=firescope-flareforge`. DNS recognition and certificate issuance must complete before claiming HTTPS readiness for the custom domain. The existing wildcard parking record is unrelated to the root site; no www domain is configured.

Run `npm run build:firebase`, then `node scripts/verify-private-env.mjs`, then `firebase deploy --only hosting --project firescope-flareforge`. The build flag enables a visible research-demo notice and prevents calls to unhosted private services. `prepare-firebase-demo.mjs` packages the original NASA examples through the existing adapter, including study checksum verification. Hosting rewrites the two saved-study URLs to these generated JSON files.

Available: the 7,350-record dated snapshot, 75,823-record sampled study, maps, calendars, experimental sensor comparison, local CSV imports, browser analysis, guide and exports. Live NASA retrieval, weather, news and remote place search are not connected on this deployment. The full Node backend remains available locally. No credentials are embedded in the published files. Firebase's free Hosting quotas still apply.

`node scripts/firebase-domain.mjs` checks domain verification through the existing Firebase CLI login and saves key-free status under `artifacts/firebase-deployment/`. It does not modify Porkbun DNS. Do not print or publish the CLI's tokens.

Final preparation checks: 55 tests pass across 11 files, Firebase build and client secret scan pass. Both public resolvers tested (Google and Cloudflare) see the ownership TXT. The custom domain currently validates TLS but returns Firebase's temporary 404; Firebase reports `HOST_ACTIVE`, `OWNERSHIP_MISSING` and `CERT_PROPAGATING`. DNS configuration is saved; provider activation is still pending. Use the working web.app URL until the custom domain returns the FireScope page.

The app now has a standalone Node backend that serves the built frontend and private NASA/weather/news adapters. A static-only deployment still cannot provide those adapters.

## Local production demonstration

Use Node 22 or later. Run `npm install`, `npm run build`, then `npm start`. Open http://127.0.0.1:4173. This runs the production frontend and backend without Vite. The saved historical and five-year study examples need no upstream API request; basemap tiles, fresh news and current weather still require external service access.

The backend reads `.env.local` if present, or accepts environment variables. FIRMS_MAP_KEY and OPENWEATHERMAP_API_KEY stay private. Study data and checksums must be present under the two documented artifacts directories.

## Container deployment

Run `docker build -t firescope .`, then supply private credentials at runtime using your hosting provider's secret configuration or `docker run --env-file .env.local -p 8080:8080 firescope`. Environment files are excluded from the Docker build. The runtime image contains only the built frontend, server code and saved observational examples; it does not need Vite or npm dependencies.

HOST and PORT control the listener. Set HOST=0.0.0.0 for an external host; the container does this automatically. `/api/health` reports readiness of the HTTP service and whether keys are configured, without returning their values. It does not guarantee upstream provider availability.

The server limits API traffic to 60 requests per socket IP per minute, shares in-flight requests and uses the adapters' bounded caches/cooldowns. This is a single-instance prototype limit. A public multi-instance deployment should add platform-level quotas and trusted proxy configuration; the server deliberately does not trust client-supplied forwarded-IP headers. Use your hosting provider for HTTPS.

## Verification and status

`npm test` checks static serving, API routing and secret-file denial. `node scripts/verify-case-study.mjs` checks the full real-data study on port 4173; set BASE_URL to check another host. `node scripts/verify-private-env.mjs` scans built client files for configured credentials.

The standalone server is implemented and locally verified. No public hosting account, public URL or container deployment is claimed until deployed and checked. The Docker configuration is supplied but requires a Docker-capable environment to test.

## Google Cloud Run preparation — 14 November 2026

The local Google Cloud CLI is authenticated. All three visible billing accounts were closed when checked, so no service was deployed, billing activated or paid resource created. The project must have active billing before Cloud Run source deployment. Choose the FireScope project explicitly rather than reusing an unrelated default project.

The Docker build includes public report fonts. `.gcloudignore` excludes environment files, local dependencies and unrelated artifacts while retaining the two required NASA study folders. Verify the upload set with `gcloud meta list-files-for-upload` before deploying.

After activating billing, use Cloud Run source deployment with the existing Dockerfile. Configure FIRMS_MAP_KEY and OPENWEATHERMAP_API_KEY as Secret Manager references, never command-line literal values or client variables. Set minimum instances to zero and maximum instances to one for the prototype; the limit reduces resource exposure but is not a hard monetary cap. Verify `/api/health`, the historical and seasonal-study APIs, public report fonts, real NASA retrieval, and the browser study workflow before declaring the deployment complete.

No cloud trial credit was claimed automatically. Eligibility, account activation and billing terms require the account holder's action.
