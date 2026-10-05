const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'blog-vendor-quotes.html'), 'utf8');

test('vendor guide keeps its canonical and has truthful matching revision dates', () => {
  assert.match(html, /rel="canonical" href="https:\/\/freeweddingbudget.com\/blog-vendor-quotes"/);
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const article = scripts.map(match => JSON.parse(match[1])).find(value => value['@type'] === 'Article');
  assert.equal(article.datePublished, '2026-06-18');
  assert.equal(article.dateModified, '2026-10-01');
  assert.match(html, /<time datetime="2026-10-01">October 1, 2026<\/time>/);
});

test('checklist, worked example and planner action precede optional details', () => {
  const markers = ['id="quoteChecklist"', 'id="quoteExample"', 'id="compareYourQuotes"', '<details'];
  const positions = markers.map(marker => html.indexOf(marker));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal((html.match(/<details\b/g) || []).length, 6);
  assert.equal((html.match(/<\/details>/g) || []).length, 6);
  assert.ok(!html.includes('What was tested in Planner 2.0'));
});

test('local navigation targets exist and the action opens Vendors', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith('#')) assert.ok(ids.includes(href.slice(1)), href);
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const target = href.split(/[?#]/)[0];
    const filename = target === '/' ? 'index.html' : target.slice(1) + (path.extname(target) ? '' : '.html');
    assert.ok(fs.existsSync(path.join(root, filename)), href);
  }
  assert.match(html, /href="\/\?guide=vendors#vendors">Compare my vendor quotes/);
});

test('worked example matches the existing downloadable fixture', () => {
  const rows = fs.readFileSync(path.join(root, 'vendor-true-cost-example.csv'), 'utf8').trim().split(/\r?\n/).slice(1).map(row => row.split(','));
  const totals = rows.map(row => {
    const subtotal = row.slice(2, 7).reduce((sum, value) => sum + Number(value), 0);
    const tax = subtotal * Number(row[7]) / 100;
    assert.equal(tax, Number(row[8]));
    assert.equal(subtotal + tax, Number(row[9]));
    assert.ok(html.includes('$' + Number(row[9]).toLocaleString('en-US')));
    return Number(row[9]);
  });
  assert.deepEqual(totals, [4374, 4266]);
  assert.equal(totals[0] - totals[1], 108);
  assert.match(html, /fictional photography quotes/);
  assert.match(html, /If you set a \$4,000 Photography limit/);
  assert.match(html, /tax-rate field, not a separate tax-amount field/);
});
