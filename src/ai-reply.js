'use strict';

// Illustrative AI reply layer, on synthetic data only. No network calls.
// Principle: the model drafts the words; prices and report times come only from the rules engine.

// Redaction, as applied before a suggestion request (phone numbers and emails).
function redact(s) {
  return String(s || '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(/(?:\+?\d[\s-]?){9,}\d/g, '[phone]');  // ends on a digit, so the space after a number is kept
}

// Every "Rs <amount>" in a draft must be a number the rules engine produced for this chat.
function priceClaims(text) {
  return [...String(text).matchAll(/Rs\.?\s?([\d,]+)/gi)].map(m => Number(m[1].replace(/,/g, '')));
}

// quote: { total, individualTotal?, saving?, lines: [{ price }] }
function guardReply(reply, quote) {
  const allowed = new Set([quote.total, quote.individualTotal, quote.saving, ...quote.lines.map(l => l.price)]
    .filter(v => v !== undefined && v !== null).map(Number));
  const unsupported = priceClaims(reply).filter(p => !allowed.has(p));
  if (unsupported.length) return { ok: false, unsupported, text: null };
  return { ok: true, unsupported: [], text: reply };
}

const SYSTEM_RULES = [
  'You draft the next message from a customer-support agent to a customer.',
  'Prices and report times come ONLY from the LIVE PRICES section. Never invent a price or a test name.',
  'Follow the booking stage. Always end with the next booking step.',
  'Never include phone numbers or emails; use [phone] or [email] if they appear.'
].join('\n');

// stage, facts, quote (from the rules engine) and transcript are plain values from the chat.
function buildPrompt({ stage, facts, quote, transcript }) {
  const prices = quote.lines.map(l => `- ${l.name} - Rs ${l.price}`).join('\n');
  const user = [
    `BOOKING STAGE: ${stage}`,
    `CHAT FACTS: ${Object.entries(facts).map(([k, v]) => `${k}=${v}`).join(', ')}`,
    `LIVE PRICES:\n${prices}`,
    `TOTAL: Rs ${quote.total}`,
    `TRANSCRIPT:\n${redact(transcript)}`,
    'Draft the agent\'s next message.'
  ].join('\n\n');
  return [
    { role: 'system', content: SYSTEM_RULES },
    { role: 'user', content: user }
  ];
}

// Request body for an OpenAI-compatible chat endpoint. The key is passed in at run time
// (environment variable or local config), never written into the source.
function buildChatRequest({ apiKey, model, messages }) {
  if (!apiKey) throw new Error('No API key configured');
  return {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: { model, messages, temperature: 0.7, max_tokens: 500 }
  };
}

module.exports = { redact, priceClaims, guardReply, buildPrompt, buildChatRequest };
