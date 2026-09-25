# Custos

A fact gateway for government AI agents. When an agent asks a ministry about a resident, Custos
answers with a signed yes/no fact instead of handing over the record. The raw record never leaves
the ministry.

Single Next.js 14 app (App Router, TypeScript, Tailwind). No database, no separate backend, no
auth system — demo data lives in `data/`.

## Setup

```bash
npm install
npm run genkey          # prints CUSTOS_SIGNING_KEY=... for .env.local
npm run dev             # http://localhost:3000
```

`npm run genkey` generates an Ed25519 keypair and prints the private key (PKCS#8 DER, base64) to
put in `.env.local`. The matching public key is served at `GET /api/public-key`.

```bash
npm test                # vitest
npm run lint
```

Set `OPENAI_API_KEY` in `.env.local` to translate questions with an LLM (model via
`CUSTOS_LLM_MODEL`, default `gpt-4o-mini`). Without it — or if the call fails — `/api/query`
falls back to a keyword parser so the demo never breaks.

## API

### `POST /api/query`

The main flow: a plain-language question (English or Arabic) in, signed yes/no claims out.

```bash
curl -s localhost:3000/api/query \
  -H 'content-type: application/json' \
  -d '{"apiKey":"custos_demo_housing_7f3c1a9b2e","emiratesId":"784-1987-1234567-1",
       "question":"Is this person eligible for a housing grant?"}'
```

```json
{
  "results": [
    { "predicate": "is_uae_national", "args": {}, "result": true },
    { "predicate": "salary_below", "args": { "amount": 30000 }, "result": true }
  ],
  "receipt": {
    "claims": [],
    "subjectHash": "<sha256(emiratesId)>",
    "agentId": "housing-agent",
    "purpose": "housing grant eligibility",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "nonce": "<uuid>",
    "issuer": "custos.gov.demo",
    "signature": "<base64 Ed25519 over the canonical receipt minus signature>"
  },
  "translatedBy": "llm"
}
```

Refusals return `{"refused":true,"reason":"..."}`:

| Case | Reason |
| --- | --- |
| unknown or unregistered `apiKey` | `unregistered agent` |
| question asks for a raw value, the full record, or bulk data | from the translator |
| predicate outside the agent's `allowedPredicates` | `predicate not permitted for this agent's purpose` |

### `POST /api/verify`

Body `{"receipt": <receipt from /api/query>}`. Recomputes the canonical JSON of the receipt
without `signature` and checks the Ed25519 signature against the gateway public key.

```json
{ "valid": true, "reason": "signature matches the canonical receipt" }
```

Flip a claim, drop a field, or edit the subject hash and it returns `valid: false` with the
reason (`400`).

### `GET /api/audit`

Every `/api/query` call, newest first. In-memory only — it resets when the server restarts.

```json
{
  "count": 1,
  "entries": [
    {
      "timestamp": "2025-01-01T00:00:00.000Z",
      "agentId": "housing-agent",
      "subjectHash": "<sha256(emiratesId)>",
      "question": "Is this person eligible for a housing grant?",
      "outcome": "answered",
      "predicates": [{ "predicate": "is_uae_national", "args": {} }],
      "reason": null
    }
  ]
}
```

The log stores the subject hash, never the Emirates ID, and predicates without their results.

### `POST /api/facts`

Debug / manual mode: ask one predicate directly. Header `x-api-key: <agent key from data/agents.json>`.

```bash
curl -s localhost:3000/api/facts \
  -H 'content-type: application/json' \
  -H 'x-api-key: custos_demo_housing_7f3c1a9b2e' \
  -d '{"emiratesId":"784-1987-1234567-1","predicate":"salary_below","value":20000}'
```

```json
{
  "emiratesId": "784-1987-1234567-1",
  "predicate": "salary_below",
  "value": 20000,
  "answer": true,
  "issuedAt": "2025-01-01T00:00:00.000Z",
  "issuer": "custos.gov.demo",
  "agentId": "housing-agent",
  "signature": "<base64 Ed25519>",
  "algorithm": "Ed25519"
}
```

The signature covers the canonical JSON (recursively key-sorted) of the claim — every field of
the response except `signature` and `algorithm`. Verify it against `GET /api/public-key`.

An agent may only ask the predicates listed in its `allowedPredicates`; anything else is `403`,
as is any request from an unregistered agent (`rogue-agent`).

### `GET /api/public-key`

Returns the Ed25519 public key as base64 DER (SPKI) and as PEM.

### `GET /api/agents`

The agent directory (API keys omitted).

## Predicates

`lib/predicates.ts` holds pure functions over a resident record:

| Predicate | Argument | Answers |
| --- | --- | --- |
| `is_uae_national` | — | nationality is UAE |
| `age_at_least` | `n` | age in full years ≥ n |
| `salary_below` | `amount` | `salaryAED < amount` |
| `visa_valid_until` | `date` | visa expiry ≥ date (nationals always valid) |
| `clearance_at_least` | `level` | `clearanceLevel >= level` |
| `insured_for` | `treatment` | treatment is covered |
