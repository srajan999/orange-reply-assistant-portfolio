# Business rules

| # | Rule | Why | Trade-off |
|---|---|---|---|
| R1 | Two or more requested parts of one bigger test are quoted as the bigger test | Matches how the lab sells panels; avoids quoting many small tests | Can raise the price for small baskets. Example in [test cases](test-cases.md), case T10 |
| R2 | A bigger test already requested absorbs its parts | Avoids charging twice | None observed |
| R3 | A test is covered by a package that contains it, or by a listed alternative (CBC by CBC with ESR) | Makes the coverage explicit and testable | Alternatives must be reviewed when the package list changes |
| R4 | Package comparison applies only above the threshold | Keeps small quotes simple | The threshold value is a business decision |
| R5 | Show a package option only if it is cheaper than individual tests | A "saving" must be real | None observed |
| R6 | A missing price is reported as unavailable | Avoids quoting old or invented prices | Agent must check with a senior |
| R7 | The model may state only prices and report times the rules produced | Keeps the AI layer from inventing money figures | Requires the price guard (FR10), which is in the portfolio demo, not yet in production |
| R8 | The agent sends every message; the assistant only inserts text | Keeps a person accountable for what the customer reads | Slower than auto-send |

## Decision for the business
Rule R1 applies at any price in the current design. The business should decide whether it should apply only when the bigger test is cheaper, or always.
