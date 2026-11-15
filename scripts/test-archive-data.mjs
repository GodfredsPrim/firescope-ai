try {
  const url = new URL('http://127.0.0.1:5173/api/fires/search');
  url.search = new URLSearchParams({ from: '2025-01-01', to: '2025-01-03', mode: 'archive', bounds: '-3.3,4.5,1.3,11.2' }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(75000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  console.log(JSON.stringify({ status: response.status, from: body.from, to: body.to, mode: body.mode, products: body.products.map(product => ({ name: product.product, rows: product.csv.trim().split(/\r?\n/).length - 1 })) }));
} catch (error) { console.error(error.message); process.exitCode = 1; }
