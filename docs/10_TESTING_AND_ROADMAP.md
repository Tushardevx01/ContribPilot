# 10 — Testing & Roadmap

## Testing strategy
| Layer | Tools | Focus |
|---|---|---|
| Unit | vitest | scoring, URL parsing, claim regex, path safety |
| Contract | zod + golden files | LLM outputs with fake provider |
| Integration | msw | GitHub API fixtures (claimed, linked PR, stale, media) |
| E2E CLI | execa + pty | full flow with mocked network and fake agent binaries |
| Security | custom corpus | injection, traversal, SSRF, token leakage |
| Cross-platform | CI matrix | Win/Mac/Linux, Node 20/22 |
Quality bars: >= 85% coverage in `ranker`, `github`, `llm`; zero flaky tests; no network in CI.

## Evaluation of recommendation quality (important!)
Build a labeled set of ~100 real issues across 10 repos: label "good pick for level X?" and "was it merged?". Track precision@3 per level. Re-run on every scoring/prompt change.

## Roadmap
- **v0.1 MVP**: CLI flow, BYOK Gemini, top-3, pack, 2 agents
- **v0.2**: Media reader, Merge Predictor, Policy Guard, more agents
- **v0.3**: Backend proxy + Google-only login, shared cache
- **v0.4**: Web app + local companion + IDE deep links
- **v0.5**: Outcome loop, Watch mode, GitLab support
- **v1.0**: Maintainer mode (triage dashboard, label suggestions), team plans

## Monetization ideas (later)
Free BYOK CLI; paid hosted AI quota; team/maintainer dashboards; sponsored "bounty-linked" issues (clearly labeled).

## Launch checklist
README with GIF demo · `privacy` doc · example outputs · Product Hunt / Hacker News / r/opensource / dev.to · "First 100 contributors" feedback program.
