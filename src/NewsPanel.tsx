import { useEffect, useState } from 'react';
import { ArrowUpRight, Newspaper, RefreshCw, Search, Radio, Clock3 } from 'lucide-react';
import { loadNews, NEWS_REFRESH_MS, type NewsFeed } from './news';
import { utc } from './WorkspaceContext';

const topics = [{ label: 'Fire reports', query: '' }, { label: 'Bushfire', query: 'bushfire' }, { label: 'Drought', query: 'drought' }, { label: 'Climate', query: 'climate' }];
export default function News() {
  const [feed, setFeed] = useState<NewsFeed>();
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [request, setRequest] = useState(0), [search, setSearch] = useState(''), [submitted, setSubmitted] = useState('');
  useEffect(() => {
    let active = true, running = false;
    async function update() {
      if (document.hidden || running) return;
      running = true; setLoading(true); setError('');
      try { const next = await loadNews(submitted); if (active) setFeed(next); }
      catch (e) { if (active) setError(e instanceof Error ? e.message : 'News unavailable. Try again.'); }
      finally { running = false; if (active) setLoading(false); }
    }
    void update();
    const timer = window.setInterval(() => void update(), NEWS_REFRESH_MS);
    document.addEventListener('visibilitychange', update);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [request, submitted]);
  const choose = (query: string) => {
    if (loading) return;
    if (submitted !== query) setFeed(undefined);
    setSearch(query); setSubmitted(query); setRequest(n => n + 1);
  };
  return <div className="news-workspace">
    <section className="news-panel" aria-labelledby="news-heading" aria-busy={loading}>
      <div className="panel-heading"><div><h2 id="news-heading">Ghana news desk</h2><p>Publisher reports on fire, climate and the environment.</p></div><span className="news-provider"><Radio size={14} />GDELT feed</span></div>
      <form className="news-search" onSubmit={event => { event.preventDefault(); choose(search.trim()); }}>
        <label htmlFor="news-search">Search Ghana news</label><div><span className="news-input"><Search size={18} /><input id="news-search" type="search" value={search} onChange={e => setSearch(e.target.value)} maxLength={80} placeholder="Search a keyword or phrase" aria-describedby="news-search-hint" /></span><button className="primary" type="submit" disabled={loading}>Search news</button></div><p id="news-search-hint">English-language matches indexed in the last 30 days. Map filters do not apply.</p>
      </form>
      <div className="news-controls"><div className="news-topics" aria-label="News topics">{topics.map(topic => <button key={topic.label} aria-pressed={submitted === topic.query} disabled={loading} onClick={() => choose(topic.query)}>{topic.label}</button>)}</div><button className="news-refresh" disabled={loading} onClick={() => setRequest(n => n + 1)} aria-label="Check news updates"><RefreshCw size={15} className={loading ? 'news-spinning' : ''} />{loading ? 'Checking' : 'Check updates'}</button></div>
      <div className={`news-status ${error || feed?.stale ? 'news-status-warning' : ''}`} role="status">{error || (feed?.stale ? 'Showing saved headlines. The provider could not be refreshed; retrieval time is shown below.' : loading ? 'Checking GDELT. The provider can take up to 30 seconds.' : feed ? `${feed.articles.length} ${feed.articles.length === 1 ? 'headline' : 'headlines'} · ${submitted ? `“${submitted}”` : 'Fire reports'} · Retrieved ${utc(feed.fetchedAt)}` : '')}</div>
      {loading && !feed && <div className="news-skeletons" aria-hidden="true">{[0, 1, 2].map(i => <div key={i}><span className="skeleton" /><span className="skeleton" /><span className="skeleton" /></div>)}</div>}
      {!loading && !feed && error && <div className="news-unavailable"><Newspaper size={30} /><h3>Headlines are temporarily unavailable</h3><p>You can keep exploring satellite observations. Retry in a minute when the news provider is available.</p><button className="secondary" onClick={() => setRequest(n => n + 1)}><RefreshCw size={15} />Retry news</button></div>}
      {feed && !loading && !feed.articles.length && <div className="news-unavailable"><Search size={28} /><h3>No matching headlines</h3><p>Try a broader keyword or choose another topic. No returned reports does not mean no fires occurred.</p><button className="secondary" onClick={() => choose('')}>Show fire reports</button></div>}
      {!!feed?.articles.length && <ul className="news-list">{feed.articles.map(article => <li key={article.url}><div className="news-meta"><span>{article.publisher}</span><span>Publisher report</span></div><h3><a href={article.url} target="_blank" rel="noopener noreferrer">{article.title}<ArrowUpRight size={20} aria-hidden="true" /></a></h3><div className="news-article-footer"><span><Clock3 size={13} />{article.indexedAt ? `Indexed ${utc(article.indexedAt)}` : 'Indexing date not supplied'}</span><span>Read at publisher <ArrowUpRight size={13} /></span></div></li>)}</ul>}
      {feed?.stale && <p className="news-note">Saved headlines retrieved {utc(feed.fetchedAt)}. They may be out of date.</p>}
    </section>
    <aside className="news-context"><div className="news-context-icon"><Newspaper size={26} /></div><h2>Reporting adds context.</h2><p>Satellite records show where thermal activity was observed. News can help you explore what was reported on the ground.</p><h3>Keep the evidence distinct</h3><p>Headlines are keyword matches, not independently verified incidents. No article is automatically linked to a map detection.</p><dl><div><dt>Geographic scope</dt><dd>Ghana keyword matches</dd></div><div><dt>Publication date</dt><dd>Not supplied by this feed</dd></div><div><dt>Reported location</dt><dd>Not independently verified</dd></div><div><dt>Refresh interval</dt><dd>15 minutes while open</dd></div></dl><a className="text-action" href="https://www.gdeltproject.org/" target="_blank" rel="noreferrer">About GDELT <ArrowUpRight size={15} /></a></aside>
  </div>;
}
