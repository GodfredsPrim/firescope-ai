import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
try { loadEnvFile('.env.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const keys = ['FIRMS_MAP_KEY', 'OPENWEATHERMAP_API_KEY'].map(k => process.env[k]).filter(Boolean);
const files = [...new Set(execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean))];
let bytes = 0;
const issues = [];
for (const file of files) {
  const size = statSync(file).size;
  bytes += size;
  if (size > 95 * 1024 * 1024) issues.push(`${file}: oversized`);
  const content = readFileSync(file);
  if (keys.some(key => content.includes(Buffer.from(key)))) issues.push(`${file}: configured credential found (value omitted)`);
}
console.log(JSON.stringify({ files: files.length, megabytes: Math.round(bytes / 1048576), configuredCredentialsChecked: keys.length, issues }, null, 2));
if (issues.length) process.exitCode = 1;
