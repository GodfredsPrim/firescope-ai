import ts from 'typescript';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import Papa from 'papaparse';

const folder = 'artifacts/ghana-seasonal-study', compiled = 'artifacts/.evaluation-cache';
await mkdir(compiled, { recursive: true });
for (const name of ['data', 'calibration']) {
  const source = await readFile(`src/${name}.ts`, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace("from './data'", "from './data.mjs'");
  await writeFile(`${compiled}/${name}.mjs`, output);
}
try {
  const { parseCSV, mergeRecords } = await import(pathToFileURL(resolve(`${compiled}/data.mjs`)));
  const { buildCalibration } = await import(pathToFileURL(resolve(`${compiled}/calibration.mjs`)));
  const manifest = JSON.parse(await readFile(`${folder}/manifest.json`, 'utf8'));
  let records = [], rejected = 0, duplicates = 0;
  for (const window of manifest.windows) for (const product of window.products) {
    const csv = await readFile(`${folder}/${product.file}`, 'utf8');
    if (createHash('sha256').update(csv).digest('hex') !== product.sha256) throw new Error('Source checksum mismatch');
    if (product.rows === 0) continue;
    const parsed = parseCSV(csv, `NASA FIRMS ${product.product}; ${window.from}; retrieved ${product.fetchedAt}`);
    const merged = mergeRecords(records, parsed.records); records = merged.records;
    rejected += parsed.rejected; duplicates += parsed.duplicates + merged.duplicates;
  }
  if (rejected || duplicates) throw new Error(`Study ingestion needs review: ${rejected} rejected, ${duplicates} duplicate rows.`);
  const report = buildCalibration(records, manifest);
  const sensitivity = [0.05, 0.1, 0.25].map(grid => {
    const run = buildCalibration(records, manifest, grid);
    return { grid_degrees: grid, factor: run.factor, test: run.metrics.test };
  });
  const result = { generatedAt: new Date().toISOString(), sourceRows: records.length, manifest, report, gridSensitivity: sensitivity, validationStatus: 'Held-out cross-sensor agreement on sampled days; not independent fire-truth validation.' };
  await writeFile(`${folder}/evaluation.json`, JSON.stringify(result, null, 2));
  await writeFile(`${folder}/daily-comparison.csv`, Papa.unparse(report.days));
  console.log(JSON.stringify({ sourceRows: records.length, factor: report.factor, factorSensitivity: report.sensitivityRange, excludedRecords: report.excludedRecords, metrics: report.metrics, gridSensitivity: sensitivity }, null, 2));
} finally {
  await Promise.all(['data', 'calibration'].map(name => unlink(`${compiled}/${name}.mjs`)));
}
