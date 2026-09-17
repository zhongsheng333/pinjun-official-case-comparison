import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { escapeHtml as h, toCsv } from './lib.mjs';
import { CHARGE_CATEGORIES } from '../public/core.mjs';

const root = resolve('.');
const input = resolve(process.env.CASES_INPUT || join(root, 'data/cases.json'));
const output = resolve(process.env.OUTPUT_DIR || join(root, 'dist/research/cybercrime-cases'));
const dataset = JSON.parse(await readFile(input, 'utf8'));

if (dataset.schema_version !== 'pinjun-public-cases/v1') throw new Error('Unsupported case dataset schema');
if (!Array.isArray(dataset.cases) || !Array.isArray(dataset.sources)) throw new Error('Invalid case dataset');

const sourceById = new Map(dataset.sources.map(source => [source.id, source]));
const fieldNames = { region: '办案地域', behavior: '涉案行为', charges: '程序与罪名', outcome: '处理结果' };
const evidenceText = evidence => `${evidence.section} · ${evidence.paragraph}`;

function renderEvidence(field, source) {
  if (!field.evidence?.length) return '<span class="not-disclosed">证据定位：未披露</span>';
  return field.evidence.map(entry => `<a class="evidence" href="${h(source.url)}" rel="noopener" target="_blank">${h(evidenceText(entry))}<span class="sr-only">（官方来源）</span></a>`).join('');
}

function renderCase(item, index) {
  const source = sourceById.get(item.source_id);
  if (!source) throw new Error(`Unknown source_id: ${item.source_id}`);
  const fields = Object.entries(fieldNames).map(([key, label]) => {
    const field = item.fields[key];
    if (!field) throw new Error(`Missing ${key} in ${item.id}`);
    return `<div class="fact"><dt>${label}</dt><dd><span class="fact-value">${h(field.value || '未披露')}</span><span class="locators">${renderEvidence(field, source)}</span></dd></div>`;
  }).join('');
  return `<article class="case-card" id="case-${h(item.id)}" data-case-id="${h(item.id)}" data-behaviors="${h(item.behavior_tags.join('|'))}" data-charge="${h(item.fields.charges.value)}">
    <header><span class="case-index">案例 ${String(index + 1).padStart(2, '0')}</span><label class="compare-control js-only"><input type="checkbox" data-compare="${h(item.id)}"> 加入比较</label></header>
    <h2>${h(item.title)}</h2><p class="case-number">来源内案例序号：${h(item.case_number)}</p>
    <dl>${fields}</dl>
    <footer>来源：<a href="${h(source.url)}" rel="noopener" target="_blank">${h(source.title)}</a></footer>
  </article>`;
}

function option(value) { return `<option value="${h(value)}">${h(value)}</option>`; }
const behaviors = [...new Set(dataset.cases.flatMap(item => item.behavior_tags))].sort();
const charges = CHARGE_CATEGORIES;
const cards = dataset.cases.map(renderCase).join('\n');
const sourceRows = dataset.sources.map(source => `<tr><td>${h(source.publisher)}</td><td><a href="${h(source.url)}" rel="noopener" target="_blank">${h(source.title)}</a></td><td>${h(source.published_at)}</td><td>${h(source.case_count)}</td></tr>`).join('');

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="两批最高人民法院公开刑事案例的结构化检索与比较。"><title>${h(dataset.title)}</title><link rel="stylesheet" href="style.css"><script type="module" src="app.js"></script></head><body>
<a class="skip-link" href="#cases">跳到案例</a><header class="site-header"><div class="wrap masthead"><a class="brand" href="/">品珺研究</a><nav aria-label="本页导航"><a href="#cases">案例</a><a href="#sources">来源</a><a href="methodology.html">方法</a><a href="data/cases.json" download>JSON</a><a href="data/cases.csv" download>CSV</a></nav></div></header>
<main class="wrap"><section class="intro" aria-labelledby="page-title"><p class="eyebrow">公开资料研究工具 · 数据版本 ${h(dataset.version)}</p><h1 id="page-title">${h(dataset.title)}</h1><p>基于两批最高人民法院公开刑事案例整理的 ${dataset.cases.length} 个入选案例。材料既包括网络犯罪相关案件，也包括钢板、海砂等非网络案件。可按行为与程序中出现的罪名筛选，并选择至多 3 个案例并排核对。案例数量仅描述本专题所选材料，不代表总体统计。</p><p class="notice"><strong>阅读提示：</strong>本页全部案例无需 JavaScript 即可阅读。启用 JavaScript 后可使用筛选和比较功能。</p></section>
<section class="toolbar js-only" aria-label="案例筛选"><label>行为<select id="behavior-filter"><option value="">全部行为</option>${behaviors.map(option).join('')}</select></label><label>程序中出现的罪名<select id="charge-filter"><option value="">全部罪名</option>${charges.map(option).join('')}</select></label><p class="filter-note">罪名匹配涵盖移送审查起诉、一审及改判前等程序表述，不表示最终被判构成该罪。</p><button type="button" id="reset">清除筛选 <kbd>Esc</kbd></button><span id="result-count" aria-live="polite">${dataset.cases.length} 个案例</span></section>
<section class="compare-panel js-only" id="compare-panel" hidden aria-labelledby="compare-title"><div class="section-heading"><h2 id="compare-title">案例比较</h2><button type="button" id="clear-compare">清空</button></div><p class="compare-help">最多选择 3 个；窄屏可在此区域横向滚动。</p><div class="compare-grid" id="compare-grid"></div></section>
<section id="cases" aria-labelledby="cases-title"><div class="section-heading"><h2 id="cases-title">案例索引</h2><span>更新于 ${h(dataset.updated_at)}</span></div><div class="case-grid">${cards}</div><p id="empty-state" hidden>没有符合当前条件的案例。</p></section>
<section id="sources" class="sources" aria-labelledby="sources-title"><div class="section-heading"><h2 id="sources-title">官方来源索引</h2></div><div class="table-scroll"><table><thead><tr><th>发布机关</th><th>材料</th><th>发布日期</th><th>入选案例数</th></tr></thead><tbody>${sourceRows}</tbody></table></div></section>
<section id="about" class="about"><h2>资料说明</h2><p>广东品珺律师事务所（资料整理与技术维护）。本专题为 AI 辅助的公开来源资料整理，不构成律师审阅或法律意见。</p><p>人物资料：<a href="https://www.gdpj.top/lawyers/wang-dewei/">王德威律师个人简介</a>。该链接仅供了解律师事务所人员信息，不表示其参与本专题案例的代理、审阅或撰写。</p><p><a href="methodology.html">查看整理方法与更新记录</a></p></section></main>
<footer class="site-footer"><div class="wrap">© 广东品珺律师事务所 · 公开资料研究</div></footer></body></html>`;

const csvColumns = ['id','source_id','source_url','source_title','publisher','published_at','dataset_version','case_number','title','behavior_tags','region','region_evidence','behavior','behavior_evidence','charges','charges_evidence','outcome','outcome_evidence'];
const csvRows = dataset.cases.map(item => {
  const source = sourceById.get(item.source_id);
  const row = { id:item.id, source_id:item.source_id, source_url:source.url, source_title:source.title, publisher:source.publisher, published_at:source.published_at, dataset_version:dataset.version, case_number:item.case_number, title:item.title, behavior_tags:item.behavior_tags.join('|') };
  for (const key of Object.keys(fieldNames)) {
    row[key] = item.fields[key].value;
    row[`${key}_evidence`] = item.fields[key].evidence.map(evidenceText).join(' | ');
  }
  return row;
});

await mkdir(join(output, 'data'), { recursive: true });
await Promise.all([
  writeFile(join(output, 'index.html'), html),
  writeFile(join(output, 'data/cases.json'), `${JSON.stringify(dataset, null, 2)}\n`),
  writeFile(join(output, 'data/cases.csv'), toCsv(csvRows, csvColumns)),
  copyFile(join(root, 'public/app.js'), join(output, 'app.js')),
  copyFile(join(root, 'public/core.mjs'), join(output, 'core.mjs')),
  copyFile(join(root, 'public/style.css'), join(output, 'style.css')),
  copyFile(join(root, 'public/methodology.html'), join(output, 'methodology.html'))
]);
console.log(`Built ${dataset.cases.length} cases at ${output}`);
