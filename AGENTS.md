<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Security rules

These protect tenant isolation and candidate PII. Follow them in every change.

- **Per-user data uses the cookie client.** Read and write org data with `createClient()` from `@/lib/supabase/server` (or `/client` in the browser), so RLS applies. The secret-key client bypasses RLS and is only for server-side background work that sets `organization_id` explicitly.
- **Never query Supabase inside `"use cache"`.** `cacheComponents` is on, and cached results are shared across users and organizations.
- **Verify identity with `getClaims()` or `getUser()` on the server, never `getSession()`.** `getSession()` trusts the cookie without verifying it.
- **No secrets in client code.** Only `NEXT_PUBLIC_*` variables may be read in the browser; `SUPABASE_SECRET_KEY` and LLM keys stay in server-only modules (`import "server-only"`).
- **No resume text, prompts or LLM responses in logs.** Log IDs and error codes only.
- **Database permission changes go through a reviewed migration** with a matching test in `tests/db`.
