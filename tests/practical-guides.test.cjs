const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const guides = {
  "blog-create-budget": {
    "published": "2026-05-01",
    "href": "/#budget",
    "download": "/wedding-budget-starter-example.csv"
  },
  "blog-hidden-costs": {
    "published": "2026-05-01",
    "href": "/?guide=hidden#vendors",
    "download": "/wedding-hidden-cost-audit.csv"
  },
  "blog-50-vs-100-guests": {
    "published": "2026-06-18",
    "href": "/?guide=guest-count#guests",
    "download": "/guest-count-scenario-example.csv"
  },
  "blog-catering-budget-guide": {
    "published": "2026-06-18",
    "href": "/?guide=catering#vendors",
    "download": "/wedding-catering-invoice-example.csv"
  },
  "blog-venue-cost-checklist": {
    "published": "2026-06-18",
    "href": "/?guide=venue#vendors",
    "download": "/venue-same-scope-comparison.csv"
  },
  "blog-spend-vs-save": {
    "published": "2026-05-01",
    "href": "/#budget",
    "download": "/wedding-upgrade-tradeoff-example.csv"
  },
  "blog-planning-timeline": {
    "published": "2026-05-01",
    "href": "/#payments",
    "download": "/wedding-payment-calendar-example.csv"
  },
  "blog-diy-decor": {
    "published": "2026-04-15",
    "href": "/#budget",
    "download": "/diy-decor-option-comparison.csv"
  },
  "blog-average-cost-2026": {
    "published": "2026-05-01",
    "href": "/#budget",
    "download": "/average-wedding-cost-source-check.csv"
  }
};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
for (const [slug, fixture] of Object.entries(guides)) {
  const html = read(slug + '.html');
  test(slug + ': revision metadata and original canonical', () => {
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const article = schemas.find(s => s['@type'] === 'Article');
    assert.equal(article.datePublished, fixture.published);
    assert.equal(article.dateModified, '2026-10-04');
    assert.equal(article.url, 'https://freeweddingbudget.com/' + slug);
    assert.ok(html.includes('rel="canonical" href="' + article.url + '"'));
    assert.match(html, /<time datetime="2026-10-04">October 4, 2026<\/time>/);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
    assert.ok(!schemas.some(s => s['@type'] === 'FAQPage'), 'no outdated FAQ schema');
  });
  test(slug + ': checklist, example and action precede expandable detail', () => {
    const positions = ['id="guideChecklist"', 'id="guideExample"', 'id="guideAction"', 'id="guideDetails"', '<details'].map(s => html.indexOf(s));
    assert.ok(positions.every(p => p >= 0));
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
    assert.equal((html.match(/<details\b/g) || []).length, (html.match(/<\/details>/g) || []).length);
    assert.ok((html.match(/<details\b/g) || []).length >= 4);
    assert.ok(!html.includes('[[table:'));
    assert.ok(!/[—–]/.test(html.match(/<article[\s\S]*?<\/article>/)[0]), 'no em or en dashes in rewritten prose');
    for (const [, table] of html.matchAll(/(<table[\s\S]*?<\/table>)/g)) assert.ok(table.includes('scope="col"'));
  });
  test(slug + ': page anchors, worksheet and planner destination resolve', () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      if (href.startsWith('#')) assert.ok(ids.includes(href.slice(1)), href);
      if (!href.startsWith('/') || href.startsWith('//')) continue;
      const target = href.split(/[?#]/)[0];
      const file = target === '/' ? 'index.html' : target.slice(1) + (path.extname(target) ? '' : '.html');
      assert.ok(fs.existsSync(path.join(root, file)), href);
    }
    assert.ok(html.includes('href="' + fixture.href + '"'));
    assert.ok(html.includes('href="' + fixture.download + '" download'));
    assert.match(html, /reference worksheet, not a Planner backup/);
  });
}
// Parse the actual CSV fixtures, including quoted cells and escaped quotes.
function csv(file) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (const char of read(file).replace(/\r/g, '')) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if (char === '\n' && !quoted) { row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift();
  assert.ok(rows.every(r => r.length === header.length), file + ' has consistent columns');
  return { header, rows };
}
test('budget worksheet columns each total $40,000; reserve alternative contains $5,000', () => {
  const { rows } = csv('wedding-budget-starter-example.csv');
  for (const col of [1, 2]) assert.equal(rows.slice(0, -1).reduce((s, r) => s + Number(r[col]), 0), Number(rows.at(-1)[col]));
  assert.equal(Number(rows.at(-1)[1]), 40000);
  assert.equal(Number(rows.find(r => r[0] === 'Other')[2]), 5000);
});
test('guest worksheet calculations and $8,000 difference', () => {
  const { rows } = csv('guest-count-scenario-example.csv');
  for (const r of rows) {
    assert.equal(+r[2] + +r[3] + +r[4], +r[5]);
    for (let c = 2; c <= 4; c++) assert.equal(+r[1] * +r[c], +r[c + 4]);
    assert.equal(+r[1] * +r[5], +r[9]);
    assert.equal(+r[9] - 8000, +r[10]);
  }
  assert.match(read('blog-50-vs-100-guests.html'), /excludes planned categories/);
});
test('catering example subtotal remains $10,410 with unconfirmed additions', () => {
  const { rows } = csv('wedding-catering-invoice-example.csv');
  assert.ok(rows.some(r => r.includes('10410')));
  assert.equal(100 * 85 + 8500 * .2 + 6 * 35, 10410);
  assert.match(read('blog-catering-budget-guide.html'), /subtotal, not a final invoice/);
});
test('venue worksheet subtotals match components, with security still unconfirmed for A', () => {
  const { header, rows } = csv('venue-same-scope-comparison.csv');
  assert.equal(header[5], 'Listed Subtotal Before Unconfirmed Items');
  for (const r of rows) assert.equal(r.slice(1, 5).reduce((s, x) => s + +x, 0), +r[5]);
  assert.match(rows[0][7], /Security/);
  assert.match(read('blog-venue-cost-checklist.html'), /security unconfirmed/);
});
test('upgrade worksheet calculates per-guest costs and reserve use', () => {
  const { rows } = csv('wedding-upgrade-tradeoff-example.csv');
  for (const r of rows) {
    assert.equal(+r[2] + +r[1] * +r[3], +r[4]);
    assert.equal(+r[5] - +r[4], +r[6]);
    assert.equal(+r[4], +r[7]);
  }
});
test('payment calendar has 12 payments totaling $35,000 and $7,875 at booking', () => {
  const { header, rows } = csv('wedding-payment-calendar-example.csv');
  assert.equal(header[4], 'Cumulative If Paid');
  assert.equal(rows.length, 12);
  assert.equal(rows.reduce((s, r) => s + +r[3], 0), 35000);
  assert.equal(rows.filter(r => r[1] === 'Booking payment').reduce((s, r) => s + +r[3], 0), 7875);
  for (const contract of new Set(rows.map(r => r[0]))) {
    const group = rows.filter(r => r[0] === contract), total = group.reduce((s,r) => s + +r[3], 0);
    let cumulative = 0;
    for (const r of group) { cumulative += +r[3]; assert.equal(cumulative, +r[4]); assert.equal(total - cumulative, +r[5]); }
  }
});
test('DIY worksheet does not price helper time; all component costs match', () => {
  const { rows } = csv('diy-decor-option-comparison.csv');
  assert.equal(rows[0].slice(1, 6).reduce((s, x) => s + Number(x), 0), 1200);
  assert.equal(Number(rows[0][6]), 1200);
  assert.match(rows[0][7], /Helper time is not priced/);
});
test('source worksheet remains available; averages are not presented as universal 2026 prices', () => {
  csv('average-wedding-cost-source-check.csv');
  const html = read('blog-average-cost-2026.html');
  assert.match(html, /Neither figure is a universal price for weddings held in 2026/);
  assert.match(html, /10,474/);
  assert.match(html, /51,500/);
});
test('hidden-cost example totals $14,020 and states the tax-base limitation', () => {
  csv('wedding-hidden-cost-audit.csv');
  assert.equal(10000 + 2000 + 12000 * .08 + 210 + 850, 14020);
  assert.match(read('blog-hidden-costs.html'), /entire entered subtotal/);
});
test('guide hub titles, links and dates match the reviewed guides', () => {
  const hub = read('blog.html');
  for (const slug of Object.keys(guides)) {
    const h1 = read(slug + '.html').match(/<h1>(.*?)<\/h1>/)[1];
    assert.ok(hub.includes(h1.replace(/&/g, '&amp;')));
    assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  }
  assert.equal((hub.match(/Checklist and worked example • Updated October 4, 2026/g) || []).length, 9);
  assert.ok(hub.includes('Checklist and worked example • Updated October 1, 2026'));
});

test('every monetized guide carries the AdSense publisher code', () => {
  const monetizedGuides = [...Object.keys(guides), 'blog-vendor-quotes'];
  for (const slug of monetizedGuides) {
    assert.match(
      read(slug + '.html'),
      /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-4504023199353060/,
      slug
    );
  }
});

test('sitemap lastmod dates match the substantive October revisions', () => {
  const sitemap = read('sitemap.xml');
  const expectedDates = {
    '': '2026-10-01',
    blog: '2026-10-04',
    'blog-vendor-quotes': '2026-10-01',
    ...Object.fromEntries(Object.keys(guides).map(slug => [slug, '2026-10-04']))
  };
  for (const [slug, date] of Object.entries(expectedDates)) {
    const url = 'https://freeweddingbudget.com/' + slug;
    assert.ok(sitemap.includes(`<loc>${url}</loc><lastmod>${date}</lastmod>`), slug || 'homepage');
  }
});
