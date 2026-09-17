import { matchesFilters, limitComparison } from './core.mjs';

const cards = [...document.querySelectorAll('.case-card')];
const behaviorFilter = document.querySelector('#behavior-filter');
const chargeFilter = document.querySelector('#charge-filter');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const comparePanel = document.querySelector('#compare-panel');
const compareGrid = document.querySelector('#compare-grid');
const selected = [];

function applyFilters() {
  let visible = 0;
  for (const card of cards) {
    const item = {
      behavior_tags: card.dataset.behaviors.split('|'),
      fields: { charges: { value: card.dataset.charge } }
    };
    const show = matchesFilters(item, { behavior: behaviorFilter.value, charge: chargeFilter.value });
    card.hidden = !show;
    if (show) visible += 1;
  }
  resultCount.textContent = `${visible} 个案例`;
  emptyState.hidden = visible !== 0;
}

function renderComparison() {
  compareGrid.replaceChildren();
  for (const id of selected) {
    const source = document.querySelector(`[data-case-id="${CSS.escape(id)}"]`);
    const copy = source.cloneNode(true);
    copy.querySelector('.compare-control')?.remove();
    copy.removeAttribute('id');
    copy.hidden = false;
    compareGrid.append(copy);
  }
  comparePanel.hidden = selected.length === 0;
  document.querySelectorAll('[data-compare]').forEach(box => {
    box.disabled = selected.length >= 3 && !box.checked;
  });
}

behaviorFilter.addEventListener('change', applyFilters);
chargeFilter.addEventListener('change', applyFilters);
document.querySelector('#reset').addEventListener('click', () => { behaviorFilter.value = ''; chargeFilter.value = ''; applyFilters(); behaviorFilter.focus(); });
document.querySelector('#clear-compare').addEventListener('click', () => { selected.splice(0); document.querySelectorAll('[data-compare]').forEach(box => { box.checked = false; }); renderComparison(); });
document.querySelectorAll('[data-compare]').forEach(box => box.addEventListener('change', () => {
  const requested = box.checked ? [...selected, box.dataset.compare] : selected.filter(id => id !== box.dataset.compare);
  selected.splice(0, selected.length, ...limitComparison(requested));
  box.checked = selected.includes(box.dataset.compare);
  renderComparison();
}));
document.addEventListener('keydown', event => {
  if (event.key === '/' && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) { event.preventDefault(); behaviorFilter.focus(); }
  if (event.key === 'Escape') document.querySelector('#reset').click();
});
document.documentElement.classList.add('js');
