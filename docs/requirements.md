# Requirements

## Business requirements
- **BR1.** Agents must keep each customer's booking facts separate across parallel chats.
- **BR2.** Quotations must reflect current prices for the customer's city.
- **BR3.** When the individual-test total is high, the agent must see whether a package is cheaper.
- **BR4.** No quotation may contain an invented or outdated price.
- **BR5.** Agents must follow the defined booking steps.

## Functional requirements
| ID | Requirement | Traces to |
|---|---|---|
| FR1 | Store facts (city, tests, quote, stage) per chat | BR1 |
| FR2 | Consider only messages from the last 24 hours | BR1 |
| FR3 | Look up each test's price for the customer's city | BR2 |
| FR4 | Replace two or more requested parts with the bigger test that contains them | BR2, BR3 |
| FR5 | Treat a test as covered when a package contains it or a listed alternative (CBC is covered by CBC with ESR) | BR3 |
| FR6 | Compare one-package and two-package options with individual tests above the threshold | BR3 |
| FR7 | Report any test without a price as unavailable | BR4 |
| FR8 | Determine the next booking step from the conversation | BR5 |
| FR9 | Answer questions the rules do not cover with a model-drafted reply, using the live price list and the transcript | BR1, BR5 |
| FR10 | Reject any drafted reply that states a price the rules did not produce | BR4 |
| FR11 | Mask phone numbers and emails before any transcript is sent to a model | Privacy |

## Acceptance criteria
- **FR4.** *Given* a basket with two sodium and potassium parts, *when* the quote is built, *then* the Kidney Function Panel is quoted at its price and the two parts are listed as covered by it.
- **FR5.** *Given* a request for CBC, *when* a package contains CBC with ESR, *then* the package counts as covering the request.
- **FR6.** *Given* a basket above the threshold, *when* one option is cheaper than the individual tests, *then* the cheapest option is shown with the saving; *otherwise* the individual quote is kept.
- **FR7.** *Given* a test with no price, *when* the quote is built, *then* it appears under "unavailable" and no price is shown for it.

## Acceptance criteria (AI)
- **FR10.** *Given* a drafted reply that states Rs 1,650 when the rules produced Rs 1,700, *when* the guard runs, *then* the draft is rejected and the unsupported amount is reported.
- **FR11.** *Given* a transcript containing a phone number, *when* it is prepared for a model, *then* the number is replaced by [phone] and the surrounding spacing is kept.

## Assumptions
- Prices and package contents are current in the source used by the system.
- The package threshold is a business setting.
- Agents make the final decision and send the reply.

## Out of scope
- Medical advice, diagnosis or clinical interpretation.
- Payment and order processing.
