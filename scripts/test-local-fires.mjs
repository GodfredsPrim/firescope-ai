try {
  const response = await fetch('http://127.0.0.1:5173/api/fires/latest', { signal: AbortSignal.timeout(40000) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  console.log(JSON.stringify({ status: response.status, from: body.from, to: body.to, products: body.products.map(p => ({ name: p.product, rows: p.csv.trim().split(/\r?\n/).length - 1 })) }));
} catch (e) { console.error(e.message); process.exitCode = 1; }
