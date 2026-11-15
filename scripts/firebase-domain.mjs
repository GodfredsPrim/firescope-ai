import { createRequire } from 'node:module';
import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const auth = require(join(process.env.APPDATA, 'npm/node_modules/firebase-tools/lib/auth.js'));
const account = auth.getGlobalDefaultAccount();
if (!account) throw new Error('Sign in with firebase login first.');
const tokens = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
const root = 'https://firebasehosting.googleapis.com/v1beta1/projects/firescope-flareforge/sites/firescope-flareforge/customDomains';
const domain = 'firescopeai.study';
const headers = { Authorization: `Bearer ${tokens.access_token}`, 'Content-Type': 'application/json' };
let response = await fetch(`${root}/${domain}`, { headers });
if (response.status === 404) {
  response = await fetch(`${root}?customDomainId=${domain}`, { method: 'POST', headers, body: '{}' });
  if (!response.ok) throw new Error(`Domain create failed: HTTP ${response.status}; ${(await response.json()).error?.message}`);
  console.log('Custom domain registration requested.');
  response = await fetch(`${root}/${domain}`, { headers });
}
if (!response.ok) throw new Error(`Domain status failed: HTTP ${response.status}; ${(await response.json()).error?.message}`);
const status = await response.json();
await mkdir('artifacts/firebase-deployment', { recursive: true });
await writeFile('artifacts/firebase-deployment/domain-status.json', JSON.stringify(status, null, 2));
console.log(JSON.stringify(status, null, 2));
