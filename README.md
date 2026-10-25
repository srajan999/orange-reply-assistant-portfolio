# Orange Reply Assistant: Booking Workflow & Quotation Automation

**Business analysis case study.** I identified repetitive steps in a customer-booking chat workflow, translated them into explicit business rules, validated the underlying package data, and tested the rules against expected outcomes.

> **Public version.** This repository contains the analysis, requirements, business rules, test cases and a runnable demonstration of the quotation rules, using **synthetic data only**. The production tool used at work is not included, because it depends on internal pricing, workflow wording and system details that are not public.

---

## 1. Executive summary

Customer-support agents handle several booking chats at once. Each chat needs the customer's location, requested tests, a correct price and a decision on whether a package is cheaper than individual tests. Doing this by hand is slow and error-prone.

I built a Chrome extension for the agent's chat tool that tracks the facts of each conversation, follows the booking steps, and prepares quotations from current prices. While building it I checked the package data against an assumption in the pricing logic. That check found that 11 of 38 packages did not contain a CBC-type test (CBC, CBC with ESR, or Complete Haemogram/CBP), so the rule was corrected.

After the change, booking chats averaged about 10 minutes, against an informal earlier estimate of about 20 minutes. This is an observed improvement across roughly 100 chats handled by several agents, not a controlled study (see [impact and limitations](docs/impact-and-limitations.md)).

## 2. Business context

- **Who:** chat agents in a diagnostic-lab customer-support team.
- **Problem:** booking chats needed the customer's city, the requested tests, the right price, and a package-or-individual decision, all tracked across several parallel chats.
- **Why it matters:** wrong or outdated quotes lead to complaints and rework; slow handling limits how many customers an agent can serve.

## 3. Objectives and scope

**In scope:** process mapping, requirements and business rules, data validation of package coverage, quotation rules (test hierarchy, coverage, package comparison, missing prices), and scenario testing.

**Out of scope:** the production extension, live pricing services, customer data, internal price lists and the employer's system setup.

## 4. Data and assumptions

- All prices, test names and package contents in this repository are **invented for illustration** (`data/`).
- The 11-of-38 finding comes from the internal package list. Only the count is shared here.
- The package threshold in the demo (Rs 1,000) is illustrative, not a business setting.

## 5. Methodology

1. **Process analysis.** Mapped the booking conversation as stages: enquiry, serviceability, test selection, quotation, booking. See [process flow](docs/process-flow.md).
2. **Requirements.** Turned the agents' pain points into functional requirements and business rules with acceptance criteria. See [requirements](docs/requirements.md) and [business rules](docs/business-rules.md).
3. **Data validation.** Compared the package list with the assumption that every package contains CBC. The check found 11 of 38 packages without a CBC-type test, and the coverage rule was made explicit and tested.
4. **Testing.** Wrote scenario tests for quotation totals, roll-up of test parts, package comparison, coverage and missing prices. Results are in [test cases](docs/test-cases.md).

## 5a. AI reply layer

The rules decide the facts (tests, prices, package option, booking step). A language model writes the wording from those facts and the live price list, and a guard rejects any price the rules did not produce. The production bot calls a Groq-hosted model for replies the rules don't cover, and a Claude model for suggestions and rewrites. The design, its guardrails and what is and is not built are in [docs/ai-layer.md](docs/ai-layer.md).

## 6. Key findings

1. **Assumptions need checking against data.** A rule that sounded right ("every package has CBC") was false for 11 of 38 packages. Checking the data changed the logic.
2. **Rules must handle missing data.** An unknown price is reported as unavailable, never replaced with an old or guessed one.
3. **Bundling is not always cheaper.** A rule that replaces parts with a bigger test can raise the price for small baskets. This trade-off needs a business decision, and the demo shows it (see [business rules](docs/business-rules.md)).

## 7. Recommendations

1. Make the package-threshold and roll-up rules explicit business settings, owned and reviewed by the business.
2. Measure handling time and quotation accuracy with a planned before-and-after design, using the same agent group and chat mix.
3. Keep a documented list of the rules that rely on the data, and re-check it whenever the package list changes.

## 8. Artifacts

| Artifact | What it shows |
|---|---|
| [docs/process-flow.md](docs/process-flow.md) | Booking workflow and where manual work occurred |
| [docs/requirements.md](docs/requirements.md) | Business and functional requirements, acceptance criteria |
| [docs/business-rules.md](docs/business-rules.md) | Rules, their rationale and the trade-offs |
| [docs/test-cases.md](docs/test-cases.md) | Expected vs actual results from the runnable tests |
| [docs/ai-layer.md](docs/ai-layer.md) | Model-drafted replies, price guard, redaction and their limits |
| [docs/impact-and-limitations.md](docs/impact-and-limitations.md) | How the time saving was observed and what is not proven |
| `src/quote.js` | The quotation rules, on synthetic data |
| `src/ai-reply.js` | Reply guard, prompt builder, redaction, key handling (no network calls) |
| `data/` | Synthetic prices and packages |

## 9. Reproduce

Requires Node.js 18 or later. No dependencies.

```bash
npm test          # runs the 15 scenario tests
npm run demo      # quotes a sample basket from data/
node src/demo.js "Sodium" "Potassium" "Vitamin D"   # your own basket
```

## 10. Limitations and next steps

- The demo does not call any live pricing service or model, and it has not been run against a live chat tool.
- The model's reply quality on real chats has not been measured.
- The time-saving figure is an observed comparison, not a controlled experiment.
- Next: add more test cases for edge cases, a structured error log, and a usability review with agents.

---

**Author:** Srajan Choudhary, aspiring Business Analyst and Business Systems Analyst.
