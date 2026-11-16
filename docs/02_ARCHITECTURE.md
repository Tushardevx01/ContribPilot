# 02 — Architecture

## 1. Stack
- Language: TypeScript (strict), Node >= 20
- Monorepo: pnpm workspaces + turborepo
- CLI: `commander` + `@clack/prompts` (UX) + `ora`/`picocolors`
- Validation: `zod`
- Storage: `better-sqlite3` (cache), `keytar` (secrets), `conf` (settings)
- GitHub: `@octokit/rest` (+ throttling plugin) ; optional use of user's `gh` auth
- AI: Gemini via official `@google/genai` SDK behind a `LLMProvider` interface (swappable)
- Tests: vitest, msw (HTTP mocks), execa for CLI e2e
- Web (later): Next.js app reusing `packages/core`

## 2. Packages
```
contribpilot/
  apps/
    cli/            # commands, prompts, rendering
    web/            # later (Next.js)
    api/            # optional backend: auth proxy + LLM proxy + shared cache (phase 5)
  packages/
    core/           # pipeline orchestration (pure TS, no I/O assumptions)
    auth/           # Google OAuth (loopback+PKCE), token store
    github/         # fetchers, rate-limit, cache, evidence extraction
    analyzer/       # codebase analyzer (static)
    ranker/         # scoring + level policies
    llm/            # provider interface, prompts, schemas, injection guards
    pack/           # Contribution Pack renderer (markdown templates)
    handoff/        # agent detection + launch adapters + deep links
    shared/         # types, errors, logger, config
  docs/             # these md files
```

## 3. Pipeline (core)
```
RepoURL -> normalize -> fetchRepoMeta
  -> [A] CodebaseAnalyzer -> RepoProfile            (cached by repo+commit SHA)
  -> [B] IssueCollector -> RawIssue[]               (cached by issue updated_at)
       -> EvidenceExtractor -> IssueEvidence[]      (comments, linked PRs, claims, media)
       -> MediaReader (Gemini multimodal, capped)
  -> [C] Ranker(level, RepoProfile, IssueEvidence) -> Ranked[]  (rule score + LLM judgement)
  -> Top3 + MOST_RECOMMENDED
  -> [D] PackGenerator(issue, RepoProfile, level) -> CONTRIBUTION_PLAN.md
  -> Handoff(agent|download)
```
Each stage emits typed events (`progress`, `warning`, `result`) so CLI and web render the same stream.

## 4. Key decision: "Sign in with Google = Gemini"
Google sign-in gives you **identity**; it does not automatically grant API quota for your app's Gemini calls.
Options (VERIFY current Google docs before building):
| Option | How | Pros | Cons |
|---|---|---|---|
| A. BYOK | User pastes free Gemini API key from Google AI Studio; Google login only for profile | Zero cost to you, fastest MVP | Extra setup step |
| B. Backend proxy | Google login -> your API verifies ID token -> your server calls Gemini with your key | Smooth UX | You pay; need quotas, abuse limits |
| C. User-delegated OAuth scopes | Request Generative Language scope so calls bill to the user's own project | "True" Google-connected | Complex consent/Cloud project setup; verification may be required |
**Recommendation:** MVP = A (+ Google login optional), Phase 5 = B with per-user daily quota. Keep `LLMProvider` so you can add Claude/OpenAI/Ollama later.

## 5. Codebase Analyzer (static, safe)
Inputs: GitHub API tree + selected file contents, or shallow clone (`--depth 1`, no hooks, no submodules, size cap).
Outputs `RepoProfile`: languages, frameworks (from manifests), directory map, entrypoints, build/test/lint commands (from package.json/Makefile/CI yaml),
test coverage shape (test file ratio), hotspots (churn via commits API if cheap), TODO/FIXME index, CONTRIBUTING/CODE_OF_CONDUCT/PR template/AI policy/CLA/DCO flags.
LLM is used only to *summarize and map issue->files*, using retrieved snippets (not whole repo). Use a lexical+symbol index (ripgrep-like) to retrieve relevant files for each candidate issue.

## 6. Data model (SQLite)
`repos(id, owner, name, default_branch, head_sha, fetched_at)`
`repo_profiles(repo_id, sha, json)`
`issues(repo_id, number, updated_at, json)`
`evidence(repo_id, number, updated_at, json)`
`runs(id, repo_id, level, started_at, status)`
`rankings(run_id, issue_number, score, breakdown_json)`
`settings(key, value)` (level, agent preference, telemetry opt-in)

## 7. Error handling
Typed errors (`AuthError`, `RateLimitError`, `RepoNotFound`, `LLMSchemaError`, ...) with user-friendly messages + `--debug`.
Partial results allowed: if media reading fails, continue with text and mark confidence lower.

## 8. Observability
Local structured logs (pino, redacted). Telemetry strictly opt-in, no repo content.
