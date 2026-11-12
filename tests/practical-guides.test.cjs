const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const guides = {
  "blog-create-budget": {
    "published": "2026-05-01",
    "href": "/planner#budget",
    "download": "/wedding-budget-starter-example.csv"
  },
  "blog-hidden-costs": {
    "published": "2026-05-01",
    "href": "/planner?guide=hidden#vendors",
    "download": "/wedding-hidden-cost-audit.csv"
  },
  "blog-50-vs-100-guests": {
    "published": "2026-06-18",
    "href": "/planner?guide=guest-count#guests",
    "download": "/guest-count-scenario-example.csv"
  },
  "blog-catering-budget-guide": {
    "published": "2026-06-18",
    "href": "/planner?guide=catering#vendors",
    "download": "/wedding-catering-invoice-example.csv"
  },
  "blog-venue-cost-checklist": {
    "published": "2026-06-18",
    "href": "/planner?guide=venue#vendors",
    "download": "/venue-same-scope-comparison.csv"
  },
  "blog-spend-vs-save": {
    "published": "2026-05-01",
    "href": "/planner#budget",
    "download": "/wedding-upgrade-tradeoff-example.csv"
  },
  "blog-planning-timeline": {
    "published": "2026-05-01",
    "href": "/planner#payments",
    "download": "/wedding-payment-calendar-example.csv"
  },
  "blog-diy-decor": {
    "published": "2026-04-15",
    "href": "/planner#budget",
    "download": "/diy-decor-option-comparison.csv"
  },
  "blog-average-cost-2026": {
    "published": "2026-05-01",
    "href": "/planner#budget",
    "download": "/average-wedding-cost-source-check.csv"
  }
};
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
// Guides that received a cited public-sources section on 2026-11-06 carry that modified date.
const revisedNov6 = new Set(['blog-hidden-costs', 'blog-catering-budget-guide', 'blog-venue-cost-checklist', 'blog-average-cost-2026', 'blog-planning-timeline', 'blog-create-budget', 'blog-50-vs-100-guests', 'blog-spend-vs-save', 'blog-diy-decor']);
const revisedNov8 = new Set(['blog-average-cost-2026', 'blog-50-vs-100-guests', 'blog-create-budget', 'blog-diy-decor', 'blog-spend-vs-save']);
const modifiedIso = slug => revisedNov8.has(slug) ? '2026-11-08' : revisedNov6.has(slug) ? '2026-11-06' : '2026-10-04';
const modifiedText = slug => revisedNov8.has(slug) ? 'November 8, 2026' : revisedNov6.has(slug) ? 'November 6, 2026' : 'October 4, 2026';
for (const [slug, fixture] of Object.entries(guides)) {
  const html = read(slug + '.html');
  test(slug + ': revision metadata and original canonical', () => {
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
    const article = schemas.find(s => s['@type'] === 'Article');
    assert.equal(article.datePublished, fixture.published);
    assert.equal(article.dateModified, modifiedIso(slug));
    assert.equal(article.url, 'https://freeweddingbudget.com/' + slug);
    assert.ok(html.includes('rel="canonical" href="' + article.url + '"'));
    assert.ok(html.includes('<time datetime="' + modifiedIso(slug) + '">' + modifiedText(slug) + '</time>'));
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
  assert.match(html, /11,500/);
});
test('public-sources sections cite dated external documents', () => {
  for (const slug of ['blog-hidden-costs', 'blog-catering-budget-guide', 'blog-venue-cost-checklist', 'blog-planning-timeline', 'blog-vendor-quotes', 'blog-create-budget', 'blog-50-vs-100-guests', 'blog-spend-vs-save', 'blog-diy-decor']) {
    const html = read(slug + '.html');
    const section = html.match(/<section aria-labelledby="guideSources">([\s\S]*?)<\/section>/);
    assert.ok(section, slug + ' has a guideSources section');
    assert.ok((section[1].match(/href="https:\/\//g) || []).length >= 2, slug + ' cites at least two external sources');
    assert.match(section[1], /November 6, 2026/);
    assert.match(html, /href="#guideSources"/);
  }
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
  assert.equal((hub.match(/Checklist and worked example • Updated October 4, 2026/g) || []).length, 9 - revisedNov6.size);
  // blog-vendor-quotes is outside the nine-guide fixture but shares the hub and was also revised on 2026-11-06.
  assert.equal((hub.match(/Checklist and worked example • Updated November 6, 2026/g) || []).length, revisedNov6.size + 1 - revisedNov8.size);
  assert.equal((hub.match(/Checklist and worked example • Updated November 8, 2026/g) || []).length, revisedNov8.size);
  assert.ok(!hub.includes('Updated October 1, 2026'));
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

test('sitemap lastmod dates match the November restructure', () => {
  const sitemap = read('sitemap.xml');
  const expectedDates = {
    '': '2026-11-08',
    planner: '2026-11-06',
    blog: '2026-11-06',
    author: '2026-11-08',
    'blog-vendor-quotes': '2026-11-06',
    ...Object.fromEntries(Object.keys(guides).map(slug => [slug, revisedNov8.has(slug) ? '2026-11-08' : '2026-11-06']))
  };
  for (const [slug, date] of Object.entries(expectedDates)) {
    const url = 'https://freeweddingbudget.com/' + slug;
    assert.ok(sitemap.includes(`<loc>${url}</loc><lastmod>${date}</lastmod>`), slug || 'homepage');
  }
});

test('per-table vs per-guest pricing guide matches its worksheet and cites dated sources', () => {
  const slug = 'blog-per-table-vs-per-guest-pricing';
  const html = read(slug + '.html');
  assert.match(html, /"datePublished":"2026-11-06"/);
  assert.match(html, /Written by <a href="\/author">Dan Liu<\/a>/);
  assert.match(html, /<section aria-labelledby="guideSources">/);
  assert.ok((html.match(/href="https:\/\//g) || []).length >= 4);
  assert.ok(html.includes('November 6, 2026'));
  assert.ok((html.match(/href="\/planner/g) || []).length <= 2);
  const words = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 1200, 'guide length ' + words);
  const hub = read('blog.html');
  assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  assert.ok(hub.includes('Price comparison and downloadable worksheet'));
  assert.ok(read('author.html').includes('href="/' + slug + '"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://freeweddingbudget.com/' + slug + '</loc><lastmod>2026-11-06</lastmod>'));
  const { rows } = csv('banquet-pricing-format-comparison.csv');
  assert.equal(rows.length, 13);
  for (const r of rows) {
    const [, , , guests, , , main, fee, subtotal, pct, total, perGuest] = r;
    assert.equal(+main + +fee, +subtotal);
    assert.equal(+total, Math.round(+subtotal * (1 + (+pct || 0) / 100) * 100) / 100);
    assert.equal((+total / +guests).toFixed(2), perGuest);
  }
  for (const figure of ['NT$19,800', 'NT$217,800', 'NT$239,580', 'S$41,536', '£147.86', '$182.50']) assert.ok(html.includes(figure), figure);
});

test('courthouse wedding costs guide matches its worksheet and cites dated sources', () => {
  const slug = 'blog-courthouse-wedding-costs';
  const html = read(slug + '.html');
  assert.match(html, /"datePublished":"2026-11-06"/);
  assert.match(html, /Written by <a href="\/author">Dan Liu<\/a>/);
  assert.match(html, /<section aria-labelledby="guideSources">/);
  assert.ok((html.match(/href="https:\/\//g) || []).length >= 7);
  assert.ok(html.includes('November 6, 2026'));
  assert.ok((html.match(/href="\/planner/g) || []).length <= 2);
  const words = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 1200, 'guide length ' + words);
  const hub = read('blog.html');
  assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  assert.ok(read('author.html').includes('href="/' + slug + '"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://freeweddingbudget.com/' + slug + '</loc><lastmod>2026-11-06</lastmod>'));
  const { rows } = csv('courthouse-wedding-fee-comparison.csv');
  assert.equal(rows.length, 7);
  for (const r of rows) {
    const [, , license, , ceremony, witness, other, total, withWitness] = r;
    assert.equal(+license + (+ceremony || 0) + (+other || 0), +total);
    if (witness) assert.equal(+total + +witness, +withWitness); else assert.equal(withWitness, '');
  }
  for (const figure of ['$171', '$207', '$146', '$173', '$123', '$153', '$125', '$110', '$80']) assert.ok(html.includes(figure), figure);
});

test('Taiwan banquet guide matches its worksheet and cites dated sources', () => {
  const slug = 'blog-taiwan-wedding-banquet-costs';
  const html = read(slug + '.html');
  assert.match(html, /"datePublished":"2026-11-06"/);
  assert.match(html, /Written by <a href="\/author">Dan Liu<\/a>/);
  assert.match(html, /<section aria-labelledby="guideSources">/);
  assert.ok((html.match(/href="https:\/\//g) || []).length >= 6);
  assert.ok(html.includes('November 6, 2026'));
  assert.ok((html.match(/href="\/planner/g) || []).length <= 2);
  const article = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
  const words = article.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 2000, 'guide length ' + words);
  const hub = read('blog.html');
  assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  assert.ok(read('author.html').includes('href="/' + slug + '"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://freeweddingbudget.com/' + slug + '</loc><lastmod>2026-11-06</lastmod>'));
  const { rows } = csv('taiwan-banquet-price-comparison.csv');
  assert.equal(rows.length, 9);
  for (const r of rows) {
    const [, , , price, tables, subtotal, pct, total, perGuest] = r;
    assert.equal(+price * +tables, +subtotal);
    assert.equal(Math.round(+subtotal * (1 + +pct / 100) * 100) / 100, +total);
    assert.equal((+total / (+tables * 10)).toFixed(2), perGuest);
    const fmt = n => 'NT$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
    assert.ok(html.includes(fmt(total)), fmt(total));
  }
});

test('Singapore banquet guide matches its worksheet and cites dated sources', () => {
  const slug = 'blog-singapore-wedding-banquet-costs';
  const html = read(slug + '.html');
  assert.match(html, /"datePublished":"2026-11-06"/);
  assert.match(html, /Written by <a href="\/author">Dan Liu<\/a>/);
  assert.match(html, /<section aria-labelledby="guideSources">/);
  assert.ok((html.match(/href="https:\/\//g) || []).length >= 8);
  assert.ok(html.includes('November 6, 2026'));
  assert.ok((html.match(/href="\/planner/g) || []).length <= 2);
  assert.ok(!html.includes('NEW OFH'), 'mislabelled document name');
  const article = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
  const words = article.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 2000, 'guide length ' + words);
  const hub = read('blog.html');
  assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  assert.ok(read('author.html').includes('href="/' + slug + '"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://freeweddingbudget.com/' + slug + '</loc><lastmod>2026-11-06</lastmod>'));
  const { rows } = csv('singapore-banquet-price-comparison.csv');
  assert.equal(rows.length, 13);
  for (const r of rows) {
    const [, , , price, units, guests, subtotal, charges, total, perGuest] = r;
    assert.equal(Math.round(+price * +units * 100) / 100, +subtotal);
    const factor = charges.startsWith('10%') ? 1.1 * 1.09 : 1;
    assert.ok(Math.abs(+subtotal * factor - +total) < 0.006, 'total ' + total);
    assert.equal((+total / +guests).toFixed(2), perGuest);
  }
  for (const figure of ['S$2,263.71', 'S$375.71', 'S$39,279.24', 'S$41,677.24', 'S$45,274.24', 'S$47,672.24', 'S$54,866.24', 'S$66,741.14', 'S$82,299.36', 'S$61,868.40', 'S$54,674.40']) assert.ok(html.includes(figure), figure);
});

test('average-cost category comparison recomputes and cites both dated pages', () => {
  const { rows } = csv('average-wedding-cost-category-comparison.csv');
  assert.equal(rows.length, 7);
  for (const r of rows) assert.equal(+r[4] - +r[2], +r[5]);
  const html = read('blog-average-cost-2026.html');
  assert.match(html, /average-wedding-vendor-costs/);
  assert.match(html, /what-weddings-really-cost/);
  assert.match(html, /November 8, 2026/);
  assert.equal(90 * 80 + 2800 + 2000, 12000);
  assert.match(html, /\$12,000/);
});

test('50-vs-100 guests Knot catering and band arithmetic', () => {
  assert.equal(100 * 80 - 50 * 80, 4000);
  assert.equal(Math.round((43300 / 27200 - 1) * 100), 59);
  const html = read('blog-50-vs-100-guests.html');
  assert.match(html, /average-wedding-vendor-costs/);
  assert.match(html, /\$4,000 difference/);
  assert.match(html, /about 59% above/);
});

test('create-budget outside-the-total costs add up and cite dated pages', () => {
  assert.equal(2800 + 4600 + 5500, 12900);
  const html = read('blog-create-budget.html');
  assert.match(html, /Added together, that is \$12,900/);
  assert.match(html, /78% of surveyed couples/);
  assert.match(html, /48% increased their budget/);
  assert.match(html, /October 16, 2026/);
});

test('diy-decor Knot decor lines add up and differ from Zola by 355', () => {
  assert.equal(2800 + 1900 + 2000, 6700);
  assert.equal(6700 - 6345, 355);
  const html = read('blog-diy-decor.html');
  assert.match(html, /\$6,700/);
  assert.match(html, /\$355 more/);
});

test('spend-vs-save Knot extras exceed the fictional reserve by 800', () => {
  assert.equal(2300 + 1500, 3800);
  assert.equal(3800 - 3000, 800);
  const html = read('blog-spend-vs-save.html');
  assert.match(html, /\$3,800, which is \$800 more/);
});

test('about and author no longer promise unfinished interviews and disclose ads', () => {
  for (const f of ['about.html', 'author.html']) {
    const html = read(f);
    assert.ok(!/interviews with couples/.test(html), f);
    assert.ok(!/couple interviews/.test(read('index.html')));
    assert.ok(!/I plan to add/.test(html), f);
    assert.match(html, /Several guides now/);
  }
  assert.match(read('about.html'), /may show Google advertising/);
});

test('two-currency guide recomputes from its worksheet and is listed everywhere', () => {
  const slug = 'blog-two-currency-wedding-budget';
  const html = read(slug + '.html');
  assert.match(html, /"datePublished":"2026-11-08"/);
  assert.match(html, /Written by <a href="\/author">Dan Liu<\/a>/);
  assert.match(html, /<section aria-labelledby="guideSources">/);
  assert.ok((html.match(/href="https:\/\//g) || []).length >= 4);
  assert.ok(html.includes('November 8, 2026'));
  const article = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
  const words = article.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 1200, 'guide length ' + words);
  const { rows } = csv('two-currency-banquet-conversion.csv');
  assert.equal(rows.length, 6);
  const rates = { 'NT$': 32.59, 'S$': 1.2776 };
  const r2 = n => Math.round(n * 100 + 1e-6) / 100;
  for (const r of rows) {
    const rate = rates[r[3]], total = +r[4];
    assert.equal(+r[5], rate);
    assert.equal(+r[6], r2(total / rate));
    assert.equal(+r[8], r2(total / (rate * 1.05)));
    assert.equal(+r[10], r2(total / (rate * 0.95)));
    assert.equal(+r[11], r2(r2(total / (rate * 0.95)) - r2(total / (rate * 1.05))));
    assert.ok(html.includes(Number(r[6]).toLocaleString('en-US', { minimumFractionDigits: 2 })), r[0]);
  }
  for (const figure of ['13,366.06', '35,436.94', '1,339.96', '3,552.58', '13,047.82']) assert.ok(html.includes(figure), figure);
  assert.equal(r2(217800 / 32.59) + r2(217800 / (32.59 * 1.05)), 13047.82);
  assert.match(html, /1% to 3%/);
  assert.match(html, /2% to 5%/);
  assert.match(html, /32\.59/);
  assert.match(html, /1\.2776/);
  const hub = read('blog.html');
  assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  assert.equal((hub.match(/"@type":"ListItem"/g) || []).length, 16);
  const imgs = [...hub.matchAll(/class="premium-blog-card"[^>]*>\s*<img src="([^"?]+)/g)].map(m => m[1]);
  assert.equal(imgs.length, 16);
  assert.equal(new Set(imgs).size, 16);
  assert.ok(read('author.html').includes('href="/' + slug + '"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://freeweddingbudget.com/' + slug + '</loc><lastmod>2026-11-08</lastmod>'));
});

test('Taiwan and Singapore guides link to the two-currency guide', () => {
  for (const slug of ['blog-taiwan-wedding-banquet-costs', 'blog-singapore-wedding-banquet-costs']) {
    const html = read(slug + '.html');
    assert.equal((html.match(/href="\/blog-two-currency-wedding-budget"/g) || []).length, 2, slug);
  }
});

test('real-couple-budgets guide recomputes every sum from its CSV and is listed everywhere', () => {
  const slug = 'blog-real-couple-budgets';
  const html = read(slug + '.html');
  assert.match(html, /"datePublished":"2026-11-08"/);
  assert.match(html, /Written by <a href="\/author">Dan Liu<\/a>/);
  assert.match(html, /<section aria-labelledby="guideSources">/);
  assert.ok((html.match(/href="https:\/\//g) || []).length >= 9);
  assert.ok((html.match(/href="\/planner/g) || []).length <= 2);
  assert.ok(html.includes('November 8, 2026'));
  const article = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
  const words = article.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words >= 1200, 'guide length ' + words);
  const { rows } = csv('real-couple-budget-category-lines.csv');
  const bySource = {};
  for (const r of rows) { (bySource[r[0]] ||= { cents: 0, total: +r[7] }).cents += Math.round(+r[5] * 100); }
  assert.equal(Object.keys(bySource).length, 9);
  const gaps = Object.fromEntries(Object.entries(bySource).map(([k, v]) => [k, Math.round(v.total * 100 - v.cents) / 100]));
  assert.deepEqual(gaps, { 'CA-80': 0.86, 'FL-90': 14017, 'NE-200': -2200, 'NH-NA': 5120, 'LA-150': 0.5, 'CA-110': 16125, 'IN-NA': 16911, 'PA-NA': -1650, 'UK-65': 1200 });
  assert.equal(Object.values(gaps).filter(g => Math.abs(g) <= 1).length, 2);
  assert.equal(Object.values(gaps).filter(g => g > 1).length, 5);
  assert.equal(Object.values(gaps).filter(g => g < -1).length, 2);
  const pct = (a, b) => Math.round((a - b) / b * 1000) / 10;
  assert.equal(pct(31175, 45000), -30.7);
  assert.equal(pct(36195, 40000), -9.5);
  assert.equal(pct(53724, 42000), 27.9);
  assert.equal(pct(50000, 35000), 42.9);
  assert.equal(pct(25000, 15000), 66.7);
  assert.equal(Math.round(31175 / 80 * 100) / 100, 389.69);
  assert.equal(Math.round(53724 / 150 * 100) / 100, 358.16);
  assert.equal(Math.round(60000 / 110 * 100) / 100, 545.45);
  assert.equal(Math.round(21400 / 65 * 100) / 100, 329.23);
  for (const f of ['16,911', '31,174.14', '53,723.50', '389.69', '545.45', '358.16', '329.23']) assert.ok(html.includes(f), f);
  const hub = read('blog.html');
  assert.ok(hub.includes('href="/' + slug + '" class="premium-blog-card"'));
  assert.ok(read('author.html').includes('href="/' + slug + '"'));
  assert.ok(read('sitemap.xml').includes('<loc>https://freeweddingbudget.com/' + slug + '</loc><lastmod>2026-11-08</lastmod>'));
});
