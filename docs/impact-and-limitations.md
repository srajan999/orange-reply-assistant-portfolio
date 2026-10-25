# Impact and limitations

## What was observed
- After introducing the assistant, average booking-chat handling time was **about 10 minutes**.
- The earlier figure of **about 20 minutes** was an **informal estimate**, not a measured baseline.
- The later figure covers **roughly 100 chats** handled by **several agents**.

## What this does and does not show
- It shows a large observed reduction and is consistent with the workflow change.
- It does **not** show that the tool alone caused the whole reduction. Chat mix, complexity and agent experience may differ between the two periods.
- It is **not** a controlled experiment, and it is not evidence of company-wide results.

## How I would measure it properly
1. Define handling time precisely (for example, first agent message to booking confirmed).
2. Record a baseline over a fixed period, with the same agents and a similar chat mix.
3. Run the same measurement after the change and compare medians, not only averages.
4. Record the number of chats, chat types and agents in each period.
5. Track quotation corrections, not only time.

## Limitations of the software
- The demo uses synthetic data and has not been connected to a live pricing service.
- Medical reference content must be reviewed by a clinician before use.
- Customer-facing use requires a senior's check of any price marked unavailable.

## AI layer limits
- The model's reply quality on real chats has not been measured.
- The production bot has no numeric price check on drafts; the portfolio demo shows one.
- The Groq reply path sends the raw transcript; masking is applied to the other AI calls only.
