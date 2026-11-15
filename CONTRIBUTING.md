# Contributing

Use Node.js 22 or later and npm. Install the locked dependencies with `npm ci`.
Copy `.env.example` to `.env.local` if you need private upstream services, then
run `npm run dev`. Saved studies and CSV imports require no credentials.

Before opening a pull request, run:

```sh
npm test
npm run build
npm run build:firebase
```

Describe the problem, resulting behavior, and checks performed. For interface
changes, include desktop and mobile screenshots. Preserve scientific limitations
and label synthetic fixtures clearly. Changes to study methods should update the
relevant method document and retain data provenance and checksum validation.

Never commit environment files, credentials, provider tokens, temporary downloads,
or generated browser reports. Keep the saved studies under `artifacts/` that the
server needs. Public history packages live under `public/data/`.

See [USER_GUIDE.md](USER_GUIDE.md), [SCIENCE_METHOD.md](SCIENCE_METHOD.md),
[HISTORY_METHOD.md](HISTORY_METHOD.md), and [DEPLOYMENT.md](DEPLOYMENT.md).
