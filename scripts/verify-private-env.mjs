import { loadEnvFile } from 'node:process';
import { readdir, readFile } from 'node:fs/promises';
loadEnvFile('.env.local');
const keys = ['FIRMS_MAP_KEY', 'OPENWEATHERMAP_API_KEY'].map(name => ({ name, value: process.env[name]?.trim() })).filter(key => key.value);
const files = (await readdir('dist', { recursive: true })).filter(file => /\.(js|css|html|json|csv|map)$/.test(file));
for (const file of files) {
  const content = await readFile(`dist/${file}`, 'utf8');
  for (const key of keys) if (content.includes(key.value)) throw new Error(`Private credential found in client output: ${key.name}. Value omitted.`);
}
console.log(`Private environment check passed: ${keys.length} configured credentials absent from ${files.length} client files.`);
