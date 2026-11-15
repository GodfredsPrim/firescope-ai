import { loadEnvFile } from 'node:process';

loadEnvFile('.env.local');
const key = process.env.FIRMS_MAP_KEY?.trim();
if (!key) {
  console.error('FIRMS_MAP_KEY is empty in .env.local.');
  process.exitCode = 1;
} else {
  try {
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(25000) });
    const body = await response.json();
    if (!response.ok || !Number.isFinite(Number(body.transaction_limit)) || Number(body.transaction_limit) <= 0) {
      console.error(`FIRMS key validation failed (HTTP ${response.status}). Check the saved FIRMS map key.`);
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ service: 'NASA FIRMS', valid: true, transactionLimit: body.transaction_limit, currentTransactions: body.current_transactions, interval: body.transaction_interval }));
      const dataResponse = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/data_availability/csv/${encodeURIComponent(key)}/ALL`, { signal: AbortSignal.timeout(25000) });
      const csv = await dataResponse.text();
      const lines = csv.trim().split(/\r?\n/);
      const valid = dataResponse.ok && lines[0]?.includes('data_id') && lines.length > 1;
      console.log(JSON.stringify({ service: 'FIRMS data availability', valid, httpStatus: dataResponse.status, products: valid ? lines.length - 1 : 0 }));
      if (!valid) process.exitCode = 1;
    }
  } catch {
    console.error('FIRMS check could not complete: network, timeout, or unexpected response. Credentials were not printed.');
    process.exitCode = 1;
  }
}

const weatherKey = process.env.OPENWEATHERMAP_API_KEY?.trim();
if (!weatherKey) {
  console.error('OPENWEATHERMAP_API_KEY is empty in .env.local.');
  process.exitCode = 1;
} else {
  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.search = new URLSearchParams({ lat: '5.6037', lon: '-0.1870', units: 'metric', appid: weatherKey }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    const body = await response.json();
    const valid = response.ok && Number(body.cod) === 200 && Number.isFinite(body.main?.temp);
    console.log(JSON.stringify({ service: 'OpenWeatherMap current weather', valid, httpStatus: response.status, ...(valid ? { location: body.name, temperatureC: body.main.temp, humidityPercent: body.main.humidity } : {}) }));
    if (!valid) {
      console.error('Weather check failed. Verify key activation and Current Weather API access.');
      process.exitCode = 1;
    }
  } catch {
    console.error('Weather check could not complete: network, timeout, or unexpected response. Credentials were not printed.');
    process.exitCode = 1;
  }
}
