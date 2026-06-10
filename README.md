# TENLUMA — Modular Jewelry Configurator

A demo of a rules-based modular product configurator.

Customer story → AI interpretation (OpenAI) → approved Part Master → part-code
sequence → validation → straight 2D bracelet preview → length from
`assembly_pitch_mm` → WhatsApp inquiry summary.

The AI is constrained to output part codes from the approved Part Master only,
so the output is always manufacturable.

## Run locally

```
npm install
npm run build:assets   # generates the 15 transparent PNG part assets
npm run dev            # client on :5173 (proxies /api → :8046)
                       # server on :8046
```

`OPENAI_API_KEY` is optional. Without it the server uses a deterministic mock
interpreter so the demo still works end-to-end.

## Deploy (Burrow Path B)

The Express server binds to `::` on `process.env.PORT` (Burrow injects 8046),
serves `/api/*`, and serves the built Vite client from `dist/`. Push to
`main` and the worker exposes the app on the subdomain.
