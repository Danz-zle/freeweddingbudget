const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the actual private helpers/handlers, without exporting production test hooks.
// Browser smoke tests additionally cover HTML wiring, render and persistence.
const source = fs.readFileSync(path.join(__dirname, '..', 'planner2.js'), 'utf8');
function section(start, end) {
  const a = source.indexOf(start);
  const b = source.indexOf(end, a + start.length);
  assert.ok(a >= 0 && b > a, `Source section exists: ${start}`);
  return source.slice(a, b);
}
function harness() {
  const handlers = {};
  const context = vm.createContext({
    Date, Math, Number, Object, Boolean, String, Set,
    document: { getElementById: id => ({ addEventListener: (event, fn) => { handlers[`${id}:${event}`] = fn; } }) },
    FormData: class { constructor(form) { return Object.entries(form.data); } },
    save() {}, render() {}, trackPlannerAction() {},
    showView(view) { context.view = view; }
  });
  vm.runInContext([
    section('  const STORAGE_KEY', '  const parseState'),
    'let state = emptyState();',
    section('  const guestTotalFor', '  const nextPlanningView'),
    section('  const nextPlanningView', '  const trackedTotal'),
    section('  const paymentStatus', '  const setOverviewCardState'),
    section('  document.getElementById("p2BudgetInput").addEventListener', '  document.getElementById("p2Currency").addEventListener'),
    section('  document.getElementById("p2QuickStartForm").addEventListener', '  const resetExpenseForm'),
    'globalThis.api = { paymentStatus, suggestedCategories, normalizeState, nextPlanningView, getState: () => state, setState: value => { state = value; } };'
  ].join('\n'), context);
  return { ...context.api, context, handlers };
}
const plain = object => JSON.parse(JSON.stringify(object));
function setup(h, budget = '30000', guests = '80') {
  h.handlers['p2QuickStartForm:submit']({ preventDefault() {}, currentTarget: { data: { budget, guests, cateringRate: '100' }, reportValidity() {} } });
}

for (const zone of ['Asia/Taipei', 'America/Los_Angeles', 'Europe/London', 'Pacific/Auckland']) {
  test(`calendar payment boundaries in ${zone}`, () => {
    const previous = process.env.TZ;
    process.env.TZ = zone;
    try {
      const { paymentStatus } = harness();
      for (const time of ['00:00:00', '12:00:00', '23:59:59']) {
        const now = new Date(`2026-09-30T${time}`);
        for (const [date, expected] of [['2026-09-28', 'overdue'], ['2026-09-29', 'overdue'], ['2026-09-30', 'due-soon'], ['2026-10-14', 'due-soon'], ['2026-10-15', 'scheduled']]) {
          assert.equal(paymentStatus({ dueDate: date, paid: false }, now), expected, `${date} at ${time}`);
          assert.equal(paymentStatus({ dueDate: date, paid: true }, now), 'paid');
        }
      }
      for (const [now, date, expected] of [
        ['2026-03-08T23:59:59', '2026-03-07', 'overdue'],
        ['2026-03-08T00:00:00', '2026-03-22', 'due-soon'],
        ['2026-11-01T23:59:59', '2026-10-31', 'overdue'],
        ['2026-11-01T00:00:00', '2026-11-15', 'due-soon'],
        ['2027-01-01T00:00:00', '2026-12-31', 'overdue'],
        ['2028-03-01T12:00:00', '2028-02-29', 'overdue']
      ]) assert.equal(paymentStatus({ dueDate: date }, new Date(now)), expected);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
}
test('add-payment message shares the status function used by UI and exports', () => {
  const paymentHandler = section('  document.getElementById("p2PaymentForm").addEventListener', '  const applyVendorSelection');
  assert.match(paymentHandler, /const isPastDue = paymentStatus\(payment\) === "overdue"/);
  assert.ok((source.match(/paymentStatus\(payment\)/g) || []).length >= 6);
});
test('allocation fits totals exactly to cents, including small and awkward totals', () => {
  const { suggestedCategories } = harness();
  for (const total of [0, 0.01, 1, 99, 12345.67, 27500, 30000, 40000, 1000000]) {
    const categories = suggestedCategories(total);
    assert.equal(Object.values(categories).reduce((sum, n) => sum + Math.round(n * 100), 0), Math.round(total * 100));
    assert.ok(Object.values(categories).every(n => n >= 0));
    assert.equal(categories.Other, 0);
  }
});
test('fresh quick setup scales categories but does not claim review completed', () => {
  const h = harness(); setup(h);
  const state = h.getState();
  assert.equal(state.budget.total, 30000);
  assert.equal(state.budget.categories.Venue, 8250);
  assert.equal(state.budget.categories.Catering, 9750);
  assert.equal(state.guests.current.Others, 80);
  assert.equal(state.progress.quickStarted, true);
  assert.equal(state.progress.budgetReviewed, false);
  assert.equal(h.context.view, 'budget');
  h.handlers['p2ReviewBudget:click']();
  assert.equal(state.progress.budgetReviewed, true);
});
test('review cannot be confirmed over budget; editing reopens review', () => {
  const h = harness(); setup(h);
  h.handlers['p2ReviewBudget:click']();
  h.handlers['p2BudgetInput:input']({ target: { value: '20000' } });
  assert.equal(h.getState().progress.budgetReviewed, false);
  h.handlers['p2ReviewBudget:click']();
  assert.equal(h.getState().progress.budgetReviewed, false);
  h.handlers['p2BudgetInput:input']({ target: { value: '40000' } });
  h.handlers['p2ReviewBudget:click']();
  assert.equal(h.getState().progress.budgetReviewed, true);
  h.handlers['p2BudgetRows:input']({ target: { value: '8500', dataset: { budgetCategory: 'Venue' } } });
  assert.equal(h.getState().progress.budgetReviewed, false);
});
test('repeated quick setup cannot overwrite a started plan', () => {
  const h = harness(); setup(h);
  const before = plain(h.getState());
  setup(h, '50000', '200');
  assert.deepEqual(plain(h.getState()), before);
});
test('custom and restored category amounts are not rescaled', () => {
  const h = harness();
  h.getState().budget.categories.Venue = 7000;
  h.getState().budget.categories.Custom = 600;
  const before = plain(h.getState().budget.categories);
  setup(h);
  assert.deepEqual(plain(h.getState().budget.categories), before);
  const restored = h.normalizeState(plain(h.getState()));
  assert.deepEqual(plain(restored), plain(h.getState()));
  h.setState(restored);
  setup(h, '90000');
  assert.deepEqual(plain(h.getState()), plain(restored));
});
test('invalid empty setup leaves the planner unchanged', () => {
  const h = harness(); const before = plain(h.getState());
  setup(h, '0'); setup(h, '30000', '0');
  assert.deepEqual(plain(h.getState()), before);
});
test('editing an imported plan also requires review without changing its category limits', () => {
  const h = harness();
  h.getState().budget.importedAt = '2026-08-14T00:00:00Z';
  h.getState().progress.budgetReviewed = true;
  const categories = plain(h.getState().budget.categories);
  h.handlers['p2BudgetInput:input']({ target: { value: '45000' } });
  assert.equal(h.nextPlanningView(), 'budget');
  assert.deepEqual(plain(h.getState().budget.categories), categories);
  h.handlers['p2ReviewBudget:click']();
  assert.equal(h.nextPlanningView(), 'vendors');
  assert.doesNotMatch(source, /budgetReviewed \|\| Boolean\([^)]*importedAt\)/);
});
