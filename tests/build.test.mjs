import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('generator preserves dataset parity and renders every case without JavaScript', async () => {
  const output = await mkdtemp(join(tmpdir(), 'case-site-'));
  const fixture = resolve('tests/fixtures/cases.json');
  const result = spawnSync(process.execPath, ['scripts/build.mjs'], {
    cwd: resolve('.'),
    env: { ...process.env, CASES_INPUT: fixture, OUTPUT_DIR: output },
    encoding: 'utf8'
  });
  try {
    assert.equal(result.status, 0, result.stderr);
    const source = JSON.parse(await readFile(fixture, 'utf8'));
    const copied = JSON.parse(await readFile(join(output, 'data/cases.json'), 'utf8'));
    const html = await readFile(join(output, 'index.html'), 'utf8');
    const csv = await readFile(join(output, 'data/cases.csv'), 'utf8');
    assert.equal(copied.cases.length, source.cases.length);
    assert.deepEqual(copied, source);
    for (const item of source.cases) {
      assert.match(html, new RegExp(item.case_number));
      assert.match(html, new RegExp(item.fields.behavior.evidence[0].section));
    }
    assert.equal((html.match(/class="case-card"/g) || []).length, source.cases.length);
    assert.match(html, /本页全部案例无需 JavaScript 即可阅读/);
    assert.doesNotMatch(html, /公开网络犯罪案例/);
    assert.match(html, /两批最高人民法院公开刑事案例/);
    assert.match(html, />办案地域</);
    assert.match(html, />程序与罪名</);
    assert.match(html, />处理结果</);
    assert.match(html, /来源内案例序号：测试案号（2026）1号/);
    assert.doesNotMatch(html, /classList\.add\('js'\)/);
    assert.match(csv, /测试案号（2026）1号/);
    assert.match(csv, /^\uFEFFid,source_id,source_url,source_title,publisher,published_at,dataset_version,/);
    assert.match(csv, /c1,s1,https:\/\/example\.gov\.cn\/source-1,官方来源一,测试发布机关,2026-01-01,test,/);
    assert.match(csv, /c2,s2,https:\/\/example\.gov\.cn\/source-2,官方来源二,测试发布机关,2026-02-01,test,/);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
