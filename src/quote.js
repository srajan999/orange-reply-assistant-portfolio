'use strict';

// Illustrative re-implementation of the quotation rules used in the case study.
// Works on SYNTHETIC data only. The production system is not included.

// Small tests that are parts of a bigger test. Two or more requested parts roll up into the bigger test.
const PARTS_OF = [
  { big: 'Kidney Function Panel', parts: ['Sodium', 'Potassium', 'Chloride', 'Calcium', 'Uric Acid', 'Urea', 'Creatinine'] },
  { big: 'Liver Function Panel', parts: ['ALT', 'AST', 'GGT', 'Total Bilirubin', 'Albumin'] }
];
const ROLLUP_MIN = 2;

// A requested test is covered by a package test that contains it, or by a listed alternative.
const COVERS = { 'complete blood count': ['complete blood count with esr'] };

// Illustrative threshold for the package check (the real value is a business setting, not shown here).
const DEFAULT_THRESHOLD = 1000;

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function covered(reqKey, packageKeys) {
  if (packageKeys.includes(reqKey)) return true;
  return (COVERS[reqKey] || []).some(k => packageKeys.includes(k));
}

// lines: [{ name, price }]. bigPrices: { 'Kidney Function Panel': 800, ... }.
// Returns the lines with the parts replaced by the bigger test when at least ROLLUP_MIN parts are requested.
function rollUpParts(lines, bigPrices, groups = PARTS_OF) {
  let out = lines.slice();
  for (const g of groups) {
    const partKeys = g.parts.map(norm);
    const hit = out.filter(l => partKeys.includes(norm(l.name)));
    if (hit.length < ROLLUP_MIN) continue;
    out = out.filter(l => !hit.includes(l));
    if (out.some(l => norm(l.name) === norm(g.big))) continue; // bigger test already requested
    const price = bigPrices[g.big];
    if (price === undefined) { out = out.concat(hit); continue; } // no price: keep the individual lines
    out.push({ name: g.big, price, covers: hit.map(l => l.name) });
  }
  return out;
}

// Cheapest way to cover the requested lines with one or two packages (+ uncovered tests at their own price).
// Returns null when the basket is at or below the threshold, or when no option is cheaper.
function optimise(lines, packages, threshold = DEFAULT_THRESHOLD) {
  const priced = lines.filter(l => l.price != null);
  const total = priced.reduce((s, l) => s + l.price, 0);
  if (total <= threshold) return null;

  const req = priced.map(l => ({ line: l, key: norm(l.name) }));
  const candidates = packages
    .map(p => {
      const keys = p.tests.map(norm);
      return { p, keys, covers: req.filter(r => covered(r.key, keys)).map(r => r.key) };
    })
    .filter(c => c.covers.length > 0);
  if (!candidates.length) return null;

  const evaluate = combo => {
    const cov = new Set();
    combo.forEach(c => c.covers.forEach(k => cov.add(k)));
    const addons = req.filter(r => !cov.has(r.key));
    const cost = combo.reduce((s, c) => s + c.p.price, 0) + addons.reduce((s, a) => s + a.line.price, 0);
    return { cost, combo, addons };
  };
  let best = null;
  const consider = combo => { const r = evaluate(combo); if (!best || r.cost < best.cost) best = r; };
  candidates.forEach(c => consider([c]));
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) consider([candidates[i], candidates[j]]);
  }
  if (!best || best.cost >= total) return null;

  return {
    total: best.cost,
    individualTotal: total,
    saving: total - best.cost,
    lines: best.combo
      .map(c => ({ name: c.p.name, price: c.p.price, kind: 'package',
                   covers: req.filter(r => c.covers.includes(r.key)).map(r => r.line.name) }))
      .concat(best.addons.map(a => ({ name: a.line.name, price: a.line.price, kind: 'addon', covers: [] })))
  };
}

// Full basket: unknown prices are reported, never guessed.
function quoteBasket(requestedNames, priceTable, bigPrices, packages, threshold = DEFAULT_THRESHOLD) {
  const lines = requestedNames.map(name => ({ name, price: priceTable[name] ?? null }));
  const unavailable = lines.filter(l => l.price == null).map(l => l.name);
  const rolled = rollUpParts(lines.filter(l => l.price != null), bigPrices);
  const opt = optimise(rolled, packages, threshold);
  if (opt) return { optimised: true, lines: opt.lines, total: opt.total, individualTotal: opt.individualTotal, saving: opt.saving, unavailable };
  const total = rolled.reduce((s, l) => s + l.price, 0);
  return { optimised: false, lines: rolled.map(l => ({ name: l.name, price: l.price, kind: 'test', covers: l.covers || [] })), total, unavailable };
}

module.exports = { PARTS_OF, ROLLUP_MIN, COVERS, DEFAULT_THRESHOLD, norm, covered, rollUpParts, optimise, quoteBasket };
