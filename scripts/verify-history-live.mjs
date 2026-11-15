import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = 'https://firescope-flareforge.web.app';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const verified = [];
for (const path of ['/index.html', '/data/history/manifest.json', '/data/burned-area/manifest.json', '/data/history/2025-06.json']) {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(45000), cache: 'no-store' });
  assert.equal(response.status, 200, path);
  const bytes = Buffer.from(await response.arrayBuffer()), local = await readFile(`dist${path}`);
  assert.equal(hash(bytes), hash(local), `Published bytes differ for ${path}`);
  if (path.endsWith('.json')) assert(response.headers.get('content-type').includes('json'));
  verified.push({ url: base + path, sha256: hash(bytes), bytes: bytes.length });
}
const index = await readFile('dist/index.html', 'utf8');
const bundle = index.match(/src="(\/assets\/[^\"]+\.js)"/)[1];
const response = await fetch(base + bundle, { signal: AbortSignal.timeout(45000) }); assert.equal(response.status, 200);
assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(await readFile(`dist${bundle}`)));
const report = { verifiedAt: new Date().toISOString(), base, bundle, verified, result: 'Published app bundle and research files match the verified production build.' };
await writeFile('artifacts/history-live-verification.json', JSON.stringify(report, null, 2));
console.log(report.result);
console.log(`Verified ${verified.length} public pages/data files and ${bundle}`);
