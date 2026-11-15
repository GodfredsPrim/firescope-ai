const url = new URL('https://api.gdeltproject.org/api/v2/doc/doc');
url.search = new URLSearchParams({ query: 'Ghana (bushfire OR wildfire OR "forest fire" OR "bush burning") sourcelang:english', mode: 'artlist', format: 'json', maxrecords: '12', timespan: '30d', sort: 'datedesc' }).toString();
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
  const body = await response.json();
  if (!response.ok || !Array.isArray(body.articles)) throw new Error('Unexpected response');
  console.log(JSON.stringify({ service: 'GDELT', status: response.status, articles: body.articles.length, browserAccess: response.headers.get('access-control-allow-origin') }));
} catch {
  console.error('GDELT live check failed: unavailable, timed out, or invalid response.');
  process.exitCode = 1;
}
