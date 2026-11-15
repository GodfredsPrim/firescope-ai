import { ArrowDownToLine, Printer } from 'lucide-react';
import guide from './user-guide.json';
import markdown from '../USER_GUIDE.md?raw';
import { saveFile } from './AnalysisPanel';

export default function UserGuide() {
  return <div className="user-guide">
    <div className="guide-actions"><p>Read online, download an offline copy or print it for the team.</p><div><button className="secondary" onClick={() => saveFile(markdown, 'FireScope-user-guide.md', 'text/markdown;charset=utf-8')}><ArrowDownToLine size={16} />Download guide</button><button className="secondary" onClick={() => window.print()}><Printer size={16} />Print guide</button></div></div>
    <div className="guide-layout"><nav className="guide-contents" aria-label="User guide contents"><h2>In this guide</h2>{guide.sections.map(section => <a key={section.id} href="#guide" onClick={event => { event.preventDefault(); const heading = document.getElementById(`guide-${section.id}`); heading?.focus({ preventScroll: true }); heading?.scrollIntoView({ block: 'start' }); }}>{section.title}</a>)}</nav>
      <article className="guide-article" aria-label={guide.title}><p className="guide-introduction">{guide.intro}</p>{guide.sections.map(section => <section key={section.id} aria-labelledby={`guide-${section.id}`}><h2 id={`guide-${section.id}`} tabIndex={-1}>{section.title}</h2>{section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.steps && <ol>{section.steps.map(step => <li key={step}>{step}</li>)}</ol>}{section.table && <div className="guide-table" role="region" aria-label={`${section.title}: reference table`} tabIndex={0}><table><thead><tr>{section.table.headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}><th scope="row">{row[0]}</th>{row.slice(1).map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}{section.note && <p className="guide-note"><strong>Remember: </strong>{section.note}</p>}</section>)}</article>
    </div>
  </div>;
}
