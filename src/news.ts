import { staticHosting, hostingMessage } from './hosting';
export type NewsArticle = { title: string; url: string; publisher: string; indexedAt: string | null };
export type NewsFeed = { articles: NewsArticle[]; fetchedAt: string; stale: boolean };
export const NEWS_QUERY = 'Ghana (bushfire OR wildfire OR "forest fire" OR "bush burning") sourcelang:english';
export const NEWS_REFRESH_MS = 15 * 60 * 1000;
const cache = new Map<string, NewsFeed>();
const requests = new Map<string, Promise<NewsFeed>>();
let retryAfter = 0;
let nextRequestAt = 0;

export function newsQuery(search: string) {
  const phrase = search.replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, ' ').slice(0, 80);
  return phrase ? `Ghana "${phrase}" sourcelang:english` : NEWS_QUERY;
}

export function normalizeArticles(value: unknown): NewsArticle[] {
  if (!value || typeof value !== 'object' || !('articles' in value) || !Array.isArray(value.articles)) {
    throw new Error('Unexpected news response');
  }
  const seen = new Set<string>();
  return value.articles.flatMap((item: unknown): NewsArticle[] => {
    if (!item || typeof item !== 'object') return [];
    const row = item as Record<string, unknown>;
    if (typeof row.url !== 'string' || typeof row.title !== 'string' || !row.title.trim()) return [];
    let url: URL;
    try { url = new URL(row.url); } catch { return []; }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return [];
    url.hash = '';
    if (seen.has(url.href)) return [];
    seen.add(url.href);
    const stamp = typeof row.seendate === 'string' ? row.seendate : '';
    const iso = /^\d{8}T\d{6}Z$/.test(stamp)
      ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}Z` : '';
    return [{ title: row.title.trim(), url: url.href, publisher: url.hostname.replace(/^www\./, ''), indexedAt: iso && Number.isFinite(Date.parse(iso)) ? iso : null }];
  }).slice(0, 12);
}

export function loadNews(search = ''): Promise<NewsFeed> {
  if (staticHosting) return Promise.reject(new Error(hostingMessage));
  const query = newsQuery(search);
  const cached = cache.get(query);
  if (cached && Date.now() - Date.parse(cached.fetchedAt) < NEWS_REFRESH_MS) return Promise.resolve(cached);
  const pending = requests.get(query);
  if (pending) return pending;
  if (Date.now() < retryAfter) return Promise.reject(new Error('Please wait a minute before retrying.'));
  const delay = Math.max(0, nextRequestAt - Date.now());
  nextRequestAt = Date.now() + delay + 6000;
  const request = (async () => {
    try {
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      const response = await fetch(`/api/news?search=${encodeURIComponent(search)}`, { signal: AbortSignal.timeout(35000) });
      if (!response.ok) throw new Error('News provider unavailable');
      const body = await response.json();
      const articles = normalizeArticles(body);
      const feed = { articles, fetchedAt: typeof body.fetchedAt === 'string' && Number.isFinite(Date.parse(body.fetchedAt)) ? body.fetchedAt : new Date().toISOString(), stale: body.stale === true };
      if (cache.size >= 10) cache.delete(cache.keys().next().value!);
      cache.set(query, feed);
      return feed;
    } catch {
      retryAfter = Date.now() + 60000;
      if (cached && Date.now() - Date.parse(cached.fetchedAt) < 86400000) return { ...cached, stale: true };
      throw new Error('Could not reach GDELT. Check your connection and try again in a minute.');
    } finally { requests.delete(query); }
  })();
  requests.set(query, request);
  return request;
}
