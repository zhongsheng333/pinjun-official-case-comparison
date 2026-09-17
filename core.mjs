export const CHARGE_CATEGORIES = Object.freeze([
  '帮助信息网络犯罪活动罪',
  '掩饰、隐瞒犯罪所得罪',
  '诈骗罪',
  '侵犯公民个人信息罪',
  '非法拘禁罪'
]);

export function matchesFilters(item, filters = {}) {
  const behaviorMatch = !filters.behavior || item.behavior_tags?.includes(filters.behavior);
  const charge = item.fields?.charges?.value || '未披露';
  const chargeMatch = !filters.charge || (
    charge !== '未披露' &&
    !charge.startsWith(`不构成${filters.charge}`) &&
    charge.includes(filters.charge)
  );
  return Boolean(behaviorMatch && chargeMatch);
}

export function limitComparison(ids, max = 3) {
  return [...new Set(ids)].slice(0, max);
}
