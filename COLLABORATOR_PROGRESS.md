# Collaborator implementation progress — 14 November 2026

## Firebase alternative selected

The user selected free Firebase Hosting after Google billing remained closed. Created the dedicated project `firescope-flareforge` without enabling billing and published https://firescope-flareforge.web.app. Both NASA study endpoints and public report fonts returned HTTP 200; the live browser loaded 7,350 snapshot records and 75,823 sampled-study records and displayed the held-out sensor-comparison results. The hosting build explicitly marks private live services disconnected and keeps the full backend available locally.

Registered `firescopeai.study` with Firebase and changed Porkbun's root ALIAS parking record to A `199.36.158.100`; added root TXT `hosting-site=firescope-flareforge`. The saved DNS values were visually verified in Porkbun. Cloudflare and Google public resolvers both return the correct root TXT; the A record resolves to Firebase. At the last check Firebase still reported ownership recognition pending and certificate propagation; HTTPS validation succeeded but returned a temporary 404. Do not claim the custom domain is serving the app until a subsequent HTTP check succeeds. The Firebase URL is usable meanwhile. No nameserver, email or paid-service changes were made.

Impeccable hardening and UX Writing informed the visible availability notice and service-specific recovery messages; the light research layout was preserved. Mechanical detector returned no findings for the changed UI targets. The notes below record the earlier Cloud Run assessment.

- Google Cloud: authenticated CLI and projects inspected. All three visible billing accounts are closed. Deployment is waiting for account-holder billing activation and an explicitly selected FireScope project. No public deployment or credit redemption is claimed.
- Packaging: Docker now copies public report fonts; Cloud Build upload exclusions omit local environment files and unrelated artifacts, retaining both required NASA study datasets. Docker execution is not verified locally because Docker is unavailable.
- Existing science: regenerated the checksum-verified 75,823-record evaluation. Test MAE remains 266.1 raw, 70.9214 adjusted, 76.8733 training-only seasonal baseline. These are sensor-agreement errors on ten sampled test days, not fire-detection accuracy. See SCIENCE_EXPANSION.md for the proposed next experiment; expanded retrieval and independent validation remain pending.
- Planetary Computer: the public STAC probe returned five Sentinel-2 scenes for a bounded Ghana January 2025 query. Reproduce with `node scripts/probe-planetary-computer.mjs`; key-free metadata is in artifacts/collaborator-feasibility/planetary-computer.json. This establishes catalog discovery only, not imagery inspection or a completed app integration.
- Meteomatics: the official NASA participant page requires signup and agreement to terms, then emails an account. The offer is time-limited to the challenge. Historical permissions and active access must be verified before implementing weather comparisons. Signup: https://www.meteomatics.com/en/meteomatics-and-nasa-space-apps-challenge/ . No offer was claimed or account terms accepted automatically.
- Verification: 52 tests passed across ten files; production build passed. Public upload listing was checked for both study folders and fonts, with environment files excluded.

No UI changes were needed for this preparation. Existing light map-first research design and scientific limitations are preserved.
