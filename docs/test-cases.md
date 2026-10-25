# Test cases

These tests run against the synthetic rules in `src/quote.js` and the reply guard in `src/ai-reply.js`. The results below are the output of `npm test` when this file was written. Re-run with `npm test` to confirm.

| ID | Scenario | Expected | Actual | Status |
|---|---|---|---|---|
| T1 | Sodium and potassium requested | Kidney Function Panel Rs 800, covering both | As expected | Pass |
| T2 | Sodium only | Sodium stays as an individual test | As expected | Pass |
| T3 | Kidney panel and its parts requested | Only the panel is kept | As expected | Pass |
| T4 | Panel has no price, two parts requested | Parts are kept | As expected | Pass |
| T5 | CBC covered by CBC with ESR | Covered | As expected | Pass |
| T6 | CBC, Vitamin D and Thyroid (Rs 1,950) | Essential Checkup Rs 900 + Thyroid Rs 800 = Rs 1,700, saving Rs 250 | As expected | Pass |
| T7 | Sodium and calcium (below threshold) | No package comparison | As expected | Pass |
| T8 | Vitamin D and Thyroid (Rs 1,700), no cheaper option | Individual quote kept | As expected | Pass |
| T9 | Unknown test in basket | Reported as unavailable, total excludes it | As expected | Pass |
| T10 | Sodium, potassium, Vitamin D, Thyroid | Panel rolled up; total Rs 2,500; no cheaper package; individual quote | As expected | Pass |
| T11 | Draft quotes Rs 1,700 and Rs 250 from the quote | Guard accepts | As expected | Pass |
| T12 | Draft quotes Rs 1,650, not produced by the rules | Guard rejects, reports Rs 1,650 | As expected | Pass |
| T13 | Chat request with no key; key not in request body | Refused; key absent from body | As expected | Pass |
| T14 | Prompt built from the engine's prices | Lists engine prices; forbids invented prices | As expected | Pass |
| T15 | Phone number and email in a transcript | Replaced by [phone] and [email]; space kept | As expected | Pass |

**Result:** 15 passed, 0 failed.

## Demonstration output (`npm run demo`)
```
Basket: Sodium, Potassium, Vitamin D, Thyroid Profile  (illustrative threshold 1000)
  test    Vitamin D                   Rs 900
  test    Thyroid Profile             Rs 800
  test    Kidney Function Panel       Rs 800
  Total: Rs 2500  (individual tests)
```

## Not tested here
- Live pricing service, chat-page behaviour, and model output. These need an end-to-end run in the real tool, which is outside this public repository.
