import { spawnSync } from 'node:child_process';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const build = spawnSync(npm, ['run', 'build'], { stdio: 'inherit', env: { ...process.env, VITE_STATIC_HOSTING: 'true' }, shell: process.platform === 'win32' });
if (build.status !== 0) process.exit(build.status ?? 1);
await import('./prepare-firebase-demo.mjs');
