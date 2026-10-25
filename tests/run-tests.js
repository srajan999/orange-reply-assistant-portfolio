'use strict';
const assert = require('assert');
const { rollUpParts, optimise, quoteBasket, covered } = require('../src/quote');
const ai = require('../src/ai-reply');

const bigPrices = { 'Kidney Function Panel': 800, 'Liver Function Panel': 900 };
const packages = [
  { name: 'Essential Checkup', price: 900, tests: ['Complete Blood Count with ESR', 'Vitamin D'] },
  { name: 'Basic Blood Count', price: 400, tests: ['Complete Blood Count with ESR'] },
  { name: 'Kidney and Liver Checkup', price: 1500, tests: ['Kidney Function Panel', 'Liver Function Panel'] }
];
const priceTable = { Sodium: 100, Potassium: 100, Chloride: 100, Calcium: 120, 'Complete Blood Count': 250,
                     'Vitamin D': 900, 'Thyroid Profile': 800 };

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

test('T1 two parts roll up into the bigger test at its price', () => {
  const out = rollUpParts([{ name: 'Sodium', price: 100 }, { name: 'Potassium', price: 100 }], bigPrices);
  assert.deepStrictEqual(out, [{ name: 'Kidney Function Panel', price: 800, covers: ['Sodium', 'Potassium'] }]);
});
test('T2 a single part is not rolled up', () => {
  const out = rollUpParts([{ name: 'Sodium', price: 100 }], bigPrices);
  assert.deepStrictEqual(out, [{ name: 'Sodium', price: 100 }]);
});
test('T3 bigger test already requested: parts are dropped, bigger test kept', () => {
  const out = rollUpParts([{ name: 'Kidney Function Panel', price: 800 }, { name: 'Sodium', price: 100 }, { name: 'Potassium', price: 100 }], bigPrices);
  assert.deepStrictEqual(out, [{ name: 'Kidney Function Panel', price: 800 }]);
});
test('T4 bigger test has no price: parts are kept', () => {
  const out = rollUpParts([{ name: 'Sodium', price: 100 }, { name: 'Potassium', price: 100 }], {});
  assert.strictEqual(out.length, 2);
});
test('T5 CBC is covered by CBC with ESR', () => {
  assert.strictEqual(covered('complete blood count', ['complete blood count with esr']), true);
});
test('T6 optimiser picks the cheaper package and adds the uncovered test', () => {
  const lines = [{ name: 'Complete Blood Count', price: 250 }, { name: 'Vitamin D', price: 900 }, { name: 'Thyroid Profile', price: 800 }];
  const opt = optimise(lines, packages);
  assert.strictEqual(opt.total, 1700);
  assert.strictEqual(opt.saving, 250);
  assert.deepStrictEqual(opt.lines.map(l => l.name), ['Essential Checkup', 'Thyroid Profile']);
});
test('T7 basket at or below threshold is not optimised', () => {
  assert.strictEqual(optimise([{ name: 'Sodium', price: 100 }, { name: 'Calcium', price: 120 }], packages), null);
});
test('T8 no option cheaper than individual tests: individual quote kept', () => {
  const lines = [{ name: 'Vitamin D', price: 900 }, { name: 'Thyroid Profile', price: 800 }];
  assert.strictEqual(optimise(lines, packages), null); // 900 + 800 = 1700, Essential Checkup + Thyroid = 1700
});
test('T9 unknown price is reported as unavailable, never guessed', () => {
  const q = quoteBasket(['Vitamin D', 'Unknown Test'], priceTable, bigPrices, packages);
  assert.deepStrictEqual(q.unavailable, ['Unknown Test']);
  assert.strictEqual(q.total, 900);
});
test('T10 end to end: rolled-up panel is quoted and packages are compared', () => {
  const q = quoteBasket(['Sodium', 'Potassium', 'Vitamin D', 'Thyroid Profile'], priceTable, bigPrices, packages);
  // Kidney panel 800 + Vitamin D 900 + Thyroid 800 = 2500. Essential Checkup covers only Vitamin D, so no option is cheaper.
  assert.strictEqual(q.optimised, false);
  assert.strictEqual(q.total, 2500);
  assert.deepStrictEqual(q.lines.map(l => l.name).sort(), ['Kidney Function Panel', 'Thyroid Profile', 'Vitamin D']);
});

test('T11 AI guard accepts a draft whose prices all come from the quote', () => {
  const quote = { total: 1700, individualTotal: 1950, saving: 250, lines: [{ price: 900 }, { price: 800 }] };
  const r = ai.guardReply('Your total is Rs 1,700, a saving of Rs 250 against individual tests.', quote);
  assert.strictEqual(r.ok, true);
});
test('T12 AI guard rejects a draft with a price the engine did not produce', () => {
  const quote = { total: 1700, individualTotal: 1950, saving: 250, lines: [{ price: 900 }, { price: 800 }] };
  const r = ai.guardReply('Your total is Rs 1,650.', quote);
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.unsupported, [1650]);
});
test('T13 chat request needs a key and never contains one in the source', () => {
  assert.throws(() => ai.buildChatRequest({ apiKey: '', model: 'm', messages: [] }), /No API key/);
  const req = ai.buildChatRequest({ apiKey: 'test-key-123', model: 'm', messages: [] });
  assert.strictEqual(req.headers.Authorization, 'Bearer test-key-123');
  assert.strictEqual(JSON.stringify(req.body).includes('test-key-123'), false);
});
test('T14 prompt carries only the engine prices and tells the model not to invent any', () => {
  const quote = { total: 1700, lines: [{ name: 'Essential Checkup', price: 900 }, { name: 'Thyroid Profile', price: 800 }] };
  const msgs = ai.buildPrompt({ stage: 'quote', facts: { city: 'Pune' }, quote, transcript: 'Customer: hi' });
  assert.ok(msgs[1].content.includes('- Essential Checkup - Rs 900'));
  assert.ok(msgs[0].content.includes('Never invent a price'));
});
test('T15 phone numbers and emails are redacted before the transcript is sent', () => {
  assert.strictEqual(ai.redact('call 98765 43210 or a.b@example.com'), 'call [phone] or [email]');
});

let failed = 0;
for (const c of cases) {
  try { c.fn(); console.log('PASS  ' + c.name); }
  catch (e) { failed++; console.log('FAIL  ' + c.name + '\n      ' + e.message.split('\n')[0]); }
}
console.log('\n' + (cases.length - failed) + ' passed, ' + failed + ' failed');
process.exitCode = failed ? 1 : 0;
