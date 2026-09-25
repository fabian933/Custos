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

## API

### `POST /api/facts`

Header `x-api-key: <agent key from data/agents.json>`.

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
