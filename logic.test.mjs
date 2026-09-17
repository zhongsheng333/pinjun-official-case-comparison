import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, toCsv } from '../scripts/lib.mjs';
import { CHARGE_CATEGORIES, matchesFilters, limitComparison } from '../public/core.mjs';

test('escapeHtml prevents hostile field content from creating markup', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)"> & \'quoted\''),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;quoted&#39;'
  );
});

test('toCsv quotes commas, straight quotes and embedded newlines', () => {
  const rows = [{ title: '甲,乙', outcome: '一审称"有罪"\n已生效' }];
  assert.equal(toCsv(rows, ['title', 'outcome']), '\uFEFFtitle,outcome\r\n"甲,乙","一审称""有罪""\n已生效"\r\n');
});

test('matchesFilters treats 未披露 as unknown rather than a negative match', () => {
  const unknown = { behavior_tags: [], fields: { charges: { value: '未披露' } } };
  const negative = { behavior_tags: ['其他'], fields: { charges: { value: '不构成帮助信息网络犯罪活动罪' } } };
  const positive = { behavior_tags: ['售卡'], fields: { charges: { value: '帮助信息网络犯罪活动罪' } } };
  assert.equal(matchesFilters(unknown, { behavior: '', charge: '帮助信息网络犯罪活动罪' }), false);
  assert.equal(matchesFilters(negative, { behavior: '', charge: '帮助信息网络犯罪活动罪' }), false);
  assert.equal(matchesFilters(positive, { behavior: '售卡', charge: '帮助信息网络犯罪活动罪' }), true);
});

test('charge categories include every named offense while matching procedure-stage labels', () => {
  assert.deepEqual(CHARGE_CATEGORIES, [
    '帮助信息网络犯罪活动罪',
    '掩饰、隐瞒犯罪所得罪',
    '诈骗罪',
    '侵犯公民个人信息罪',
    '非法拘禁罪'
  ]);
  const prosecuted = { behavior_tags: [], fields: { charges: { value: '移送审查起诉涉嫌罪名：掩饰、隐瞒犯罪所得罪；裁判罪名未披露。' } } };
  const changed = { behavior_tags: [], fields: { charges: { value: '一审罪名：帮助信息网络犯罪活动罪；抗诉后改判罪名：掩饰、隐瞒犯罪所得罪。' } } };
  assert.equal(matchesFilters(prosecuted, { charge: '掩饰、隐瞒犯罪所得罪' }), true);
  assert.equal(matchesFilters(changed, { charge: '帮助信息网络犯罪活动罪' }), true);
});

test('limitComparison keeps order and caps unique cases at three', () => {
  assert.deepEqual(limitComparison(['a', 'b', 'a', 'c', 'd']), ['a', 'b', 'c']);
});
