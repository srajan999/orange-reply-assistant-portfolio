# AI reply layer

The rules engine decides the facts: the tests, the prices, the package option and the next booking step. The language model writes the words. That split is the main design decision in the AI layer.

## How a reply is produced

1. **Rules first.** For each new customer message, the rules check whether they can answer: serviceability, the test list, the quotation, or the booking step.
2. **Model when the rules don't answer.** Anything the rules don't cover (why a test is done, what a parameter means, a question about the process) goes to the language model.
3. **Context sent to the model:** the booking stage, the chat facts (city, pincode, tests), the live price list for the customer's city, the transcript, and the rules the model must follow.
4. **Draft shown to the agent.** The agent reviews and sends. The assistant inserts text into the message box; it does not press send.

## Guardrails

| Guardrail | Purpose | Status |
|---|---|---|
| Prices and report times come only from the live price list | Prevents invented prices | In the production prompt |
| Every "Rs" amount in a draft must be a number the rules produced | Catches a price the model made up | **In the portfolio demo (`src/ai-reply.js`). Not in the production bot, which has only a pincode-repeat check.** |
| Phone numbers and emails are masked before the transcript is sent | Limits personal data sent to a model | Applied to Scan/Live suggestions and rewrites. **Not applied to the Groq reply path, which sends the raw transcript.** |
| Keys are read from local config or the options page, never from source | Keeps keys out of the code and out of Git | In the production bot |
| The assistant never sends a message itself | Keeps a human in control | In the production bot |

## What the portfolio demo shows (tests T11 to T15)
- A draft whose prices all come from the quote passes the guard.
- A draft with a price the rules did not produce is rejected, and the unsupported amount is reported.
- A chat request without a key is refused, and the key is never written into the request body.
- The prompt carries only the rules' prices and tells the model not to invent any.
- Phone numbers and emails are masked. The redaction keeps the space after a number.

## Limits and open items
- The model's output quality on real chats has not been measured.
- The price guard and the Groq-path redaction are not yet in the production bot.
- Scenario tests use invented prices; the production bot uses a live price service.
