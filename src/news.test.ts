import { describe, expect, it } from 'vitest';
import { normalizeArticles, newsQuery } from './news';

describe('news provider boundary', () => {
  it('keeps searches scoped to Ghana and strips query operators', () => {
    expect(newsQuery('drought')).toBe('Ghana "drought" sourcelang:english');
    expect(newsQuery('fire" OR domain:example.org')).toBe('Ghana "fire OR domainexampleorg" sourcelang:english');
  });
  it('rejects a malformed response instead of reporting no news', () => {
    expect(() => normalizeArticles({ error: 'rate limit' })).toThrow();
    expect(normalizeArticles({ articles: [] })).toEqual([]);
  });
  it('discards unsafe links and deduplicates articles; preserves indexing provenance', () => {
    expect(normalizeArticles({ articles: [
      { title: 'Unsafe', url: 'javascript:alert(1)' },
      { title: 'Credential link', url: 'https://user:password@example.org/private' },
      { title: 'Test headline', url: 'https://example.org/story', seendate: '20261112T120000Z' },
      { title: 'Duplicate', url: 'https://example.org/story#top' },
      null,
    ] })).toEqual([{ title: 'Test headline', url: 'https://example.org/story', publisher: 'example.org', indexedAt: '2026-11-12T12:00:00Z' }]);
  });
});
