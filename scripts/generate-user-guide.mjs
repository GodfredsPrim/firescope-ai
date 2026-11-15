import { readFile, writeFile } from 'node:fs/promises';
const guide = JSON.parse(await readFile('src/user-guide.json', 'utf8'));
const escape = value => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const parts = [`# ${guide.title}`, guide.intro, '## Contents', guide.sections.map(section => `- [${section.title}](#${section.title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replaceAll(' ', '-')})`).join('\n')];
for (const section of guide.sections) {
  parts.push(`## ${section.title}`);
  for (const paragraph of section.paragraphs || []) parts.push(paragraph);
  if (section.steps) parts.push(section.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'));
  if (section.table) parts.push([`| ${section.table.headers.map(escape).join(' | ')} |`, `| ${section.table.headers.map(() => '---').join(' | ')} |`, ...section.table.rows.map(row => `| ${row.map(escape).join(' | ')} |`)].join('\n'));
  if (section.note) parts.push(`**Remember:** ${section.note}`);
}
await writeFile('USER_GUIDE.md', `${parts.join('\n\n')}\n`);
console.log('Generated USER_GUIDE.md from the in-app guide content.');
