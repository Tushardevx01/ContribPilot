# 09 — Implementation Plan (phased, with acceptance criteria)

Rule: finish a phase, run tests, summarize, wait for "continue".

## Phase 0 — Scaffold (0.5 day)
Monorepo, tsconfig strict, eslint/prettier, vitest, CI, `contribpilot --version`. **AC:** CI green on 3 OSes.

## Phase 1 — Auth + config (1-2 days)
`login/logout/whoami`, keychain storage, `config` for Gemini key + optional GitHub token, `doctor`. **AC:** OAuth flow tested with mocks; tokens never in logs; works after restart.

## Phase 2 — GitHub + repo intake (1-2 days)
URL normalize/validate, repo metadata, rate-limit handling, SQLite cache. **AC:** bad URLs give friendly errors; second run uses cache; ETag respected.

## Phase 3 — Codebase analyzer (3-4 days)
Tree fetch, manifest parsing, command detection, structure map, TODO index, contribution/AI policy detection, RepoProfile summary by LLM from snippets. **AC:** correct profile on 5 fixture repos (JS, Python, Go, Rust, Java); no repo code executed; caps enforced.

## Phase 4 — Issue evidence (3-4 days)
Fetch issues, comments, timeline, linked PRs, claim detection, staleness, media download (SSRF-safe) + Gemini reading. **AC:** fixtures for claimed/PR-linked/stale issues are filtered correctly; precision >= 90% on labeled test set.

## Phase 5 — Ranking (2-3 days)
Implement 06_SCORING (filters, weights, level policies, LLM judge capped, diversity top 3). **AC:** deterministic tests; level switch re-ranks without network; MOST RECOMMENDED always set; evidence links present.

## Phase 6 — Contribution Pack (2-3 days)
Plan generation w/ verified file paths, mermaid, level tone, PR draft. **AC:** every referenced path exists; markdown lints; golden tests with fake LLM.

## Phase 7 — Handoff (2-3 days)
Detection, clone, branch, adapters for >= 2 agents, clipboard fallback, command preview. **AC:** e2e test with fake agent binaries; no `shell: true`; temp files cleaned.

## Phase 8 — Polish + MVP release (2 days)
UX pass, `--json`, resume, docs, npm provenance publish, `npx` smoke test. **AC:** Definition of Done in master prompt.

## Phase 9 — Backend proxy + quotas (optional, 1 week)
Google ID token verification, Gemini proxy, quotas, shared public cache. **AC:** abuse tests, quota enforcement, no secrets in repo.

## Phase 10 — Web app + local companion (1-2 weeks)
Next.js UI reusing core via API, live progress (SSE), top-3 cards, action bar, `contribpilot serve` companion. **AC:** design states covered; companion localhost-only + token.

## Coding conventions
Small pure functions, dependency injection for I/O (testable), no global state, errors typed, public APIs documented with TSDoc, commits conventional (`feat:`, `fix:`).

## Cost control
Pipeline: cheap model for summarization of many issues -> stronger model only for top ~10 and for the plan. Cache by (issue updated_at, prompt version). Hard per-run token cap with user-visible estimate.
