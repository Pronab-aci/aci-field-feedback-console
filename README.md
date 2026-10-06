# ACI Field Feedback Console

Internal analytics dashboard for field feedback, including Gemini-powered chat and recommendations.

## Run locally

1. Install dependencies with `bun install`.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
3. Run `bun run dev`.

The real feedback export is intentionally excluded from this repository. `src/lib/feedback-raw.json` is an empty placeholder; use an authorized local export for a populated dashboard and keep it out of Git.
