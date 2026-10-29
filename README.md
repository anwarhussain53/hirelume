# Hirelume

**AI recruiting copilot.**

Rank resumes against a job requisition with explainable, evidence-backed scores, then move candidates through a hiring pipeline.

> Status: in development. Live demo, screenshots and evaluation results will be added at Milestone 11.

## Features (planned)

- Create jobs with must-have / nice-to-have skills and experience requirements
- Upload 1–50 resume PDFs per job; parse them into structured data
- Match score (0–100) with plain-English reasons quoted from the resume, plus skill gaps
- Personalized outreach emails
- Pipeline board: New → Screened → Interview → Offer → Rejected
- Evaluation page: agreement with hand-labelled pairs, confusion table, cost and latency per resume

## Tech stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · Supabase (Auth, Storage, Postgres + pgvector, RLS) · Zod · Vitest · Playwright · GitHub Actions · Vercel

## Architecture

_Mermaid diagram coming in Milestone 11._

## Fairness and privacy

- Names, contact details and other protected attributes are stripped before scoring.
- Resume PDFs live in a private bucket and are served only through short-lived signed URLs.
- No resume text is written to logs; API keys live only in `.env.local`.

## Local development

Requires Node.js 24 (see `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # fill in Supabase keys
npm run dev
```

| Script              | What it does                 |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start the dev server         |
| `npm run lint`      | ESLint                       |
| `npm run typecheck` | TypeScript, no emit          |
| `npm test`          | Vitest unit tests            |
| `npm run build`     | Production build             |
| `npm run test:db`   | RLS tests against a Supabase stack |
| `npm run db:push`   | Apply migrations to the linked Supabase project |
| `npm run db:seed`   | Create the Techvist org and first admin |
| `npm run db:types`  | Regenerate `src/lib/database.types.ts` |

## Database

Migrations live in [`supabase/migrations`](supabase/migrations). Every org-owned table has row-level
security limiting recruiters to their own organization, and links between rows use composite
`(id, organization_id)` foreign keys so a row can never reference another org's data.

Sign-up is invite-only: a database trigger turns a new Auth user into a recruiter in the org that
invited their email, and rejects anyone without a valid invitation.

CI starts a local Supabase stack, applies all migrations and runs the RLS test suite on every PR.

## Authentication

- `src/proxy.ts` refreshes the Supabase session on every request and redirects signed-out users to
  `/sign-in?next=…`. It is a UX gate only.
- The real check is the data access layer, `getCurrentRecruiter()`, which verifies the JWT with
  `getClaims()` and loads the recruiter and organization through RLS on every request.
- `next` redirect targets are validated as same-origin paths to prevent open redirects.
- Sign-up answers identically for invited and uninvited emails, so it can't be used to discover who
  has an invitation.
- `src/architecture.test.ts` enforces the security rules in `AGENTS.md` (no Supabase inside
  `"use cache"`, no `getSession()`, secret key only in server-only modules).

## Evaluation results

_Coming in Milestone 10._
