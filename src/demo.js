'use strict';
// Quotes a sample basket from the synthetic CSVs in data/.
const fs = require('fs');
const path = require('path');
const { quoteBasket, DEFAULT_THRESHOLD } = require('./quote');

const dir = path.join(__dirname, '..', 'data');
const priceTable = {}, bigPrices = {};
for (const row of fs.readFileSync(path.join(dir, 'sample-prices.csv'), 'utf8').trim().split('\n').slice(1)) {
  const [type, name, price] = row.split(',');
  priceTable[name] = Number(price);
  if (type === 'panel') bigPrices[name] = Number(price);
}
const packages = fs.readFileSync(path.join(dir, 'sample-packages.csv'), 'utf8').trim().split('\n').slice(1).map(row => {
  const [name, price, tests] = row.split(',');
  return { name, price: Number(price), tests: tests.split('|') };
});

const basket = process.argv.slice(2).length ? process.argv.slice(2) : ['Complete Blood Count', 'Vitamin D', 'Thyroid Profile'];
const q = quoteBasket(basket, priceTable, bigPrices, packages, 1000);
console.log('Basket: ' + basket.join(', ') + '  (illustrative threshold ' + 1000 + ')');
for (const l of q.lines) console.log('  ' + l.kind.padEnd(8) + l.name.padEnd(28) + 'Rs ' + l.price);
console.log('  Total: Rs ' + q.total + (q.optimised ? '  (package option, saving Rs ' + q.saving + ' against Rs ' + q.individualTotal + ')' : '  (individual tests)'));
if (q.unavailable.length) console.log('  Price unavailable: ' + q.unavailable.join(', '));
