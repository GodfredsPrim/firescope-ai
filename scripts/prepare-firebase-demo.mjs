import { createAppServer } from '../server/start.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const server = createAppServer({ env: {} });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  await mkdir('dist/data', { recursive: true });
  for (const name of ['historical', 'seasonal-study']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/demo/${name}`);
    if (!response.ok) throw new Error(`Saved NASA ${name} integrity/availability check failed`);
    const body = await response.json();
    if (!Array.isArray(body.products) || !body.products.every(p => typeof p.csv === 'string')) throw new Error('Invalid saved study');
    await writeFile(`dist/data/${name}.json`, JSON.stringify(body));
    console.log(`Packaged ${name}: ${body.products.length} original NASA product files`);
  }
  await writeFile('dist/data/unavailable.json', JSON.stringify({ error: 'Live services are not connected in this public research demo.' }));
} finally { await new Promise(resolve => server.close(resolve)); }
