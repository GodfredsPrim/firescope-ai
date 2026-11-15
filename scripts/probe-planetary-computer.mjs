import { mkdir, writeFile } from 'node:fs/promises';

// A bounded discovery request, not an imagery download or fire validation.
const endpoint = 'https://planetarycomputer.microsoft.com/api/stac/v1/search';
const query = {
  collections: ['sentinel-2-l2a'],
  bbox: [-1.8, 8.8, -1.6, 9.0],
  datetime: '2025-01-01T00:00:00Z/2025-01-31T23:59:59Z',
  limit: 5,
};
const response = await fetch(endpoint, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(query), signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`Planetary Computer returned HTTP ${response.status}`);
const result = await response.json();
if (result.type !== 'FeatureCollection' || !Array.isArray(result.features)) throw new Error('Unexpected STAC response');
const scenes = result.features.map(scene => ({
  id: scene.id, collection: scene.collection, datetime: scene.properties?.datetime,
  cloudCoverPercent: scene.properties?.['eo:cloud_cover'], bbox: scene.bbox,
  assetNames: Object.keys(scene.assets ?? {}),
  source: scene.links?.find(link => link.rel === 'self')?.href,
}));
const evidence = {
  retrievedAt: new Date().toISOString(), endpoint, query, scenes,
  limitations: [
    'Discovery metadata only; imagery has not been downloaded or inspected.',
    'Scene cloud percentage does not establish cloud-free coverage at a hotspot.',
    'Scenes are environmental context, not independent fire truth.',
    'This bounded Ghana search does not establish catalog availability for all study dates.',
  ],
};
await mkdir('artifacts/collaborator-feasibility', { recursive: true });
await writeFile('artifacts/collaborator-feasibility/planetary-computer.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(`Saved live STAC discovery evidence: ${scenes.length} Sentinel-2 scenes. No account or Azure deployment required.`);
