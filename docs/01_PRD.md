# 01 — Product Requirements Document (PRD)

## 1. Problem
Developers want to contribute to open source but: (a) don't know which issue fits their level, (b) pick issues
already claimed or with open PRs (wasted work), (c) pick issues maintainers don't care about (PR never merged),
(d) don't understand the codebase well enough to start, (e) lose momentum between "choose" and "start coding".

## 2. Vision
"From repo URL to a started, well-planned contribution in 10 minutes — on an issue the maintainers actually want fixed."

## 3. Target users
| Persona | Need |
|---|---|
| Beginner (first PR) | Safe, well-scoped issue + hand-holding plan + learning notes |
| Intermediate | Real bugs/features, moderate scope, clear acceptance criteria |
| Pro | High-impact, architectural, hard issues; terse plan |
Secondary: students (GSoC/Hacktoberfest), devs building portfolios, maintainers (later: triage view).

## 4. Goals / Non-goals
Goals: pick the right issue; avoid duplicate work; maximize merge likelihood; remove "blank page" with an actionable plan; one-step agent launch.
Non-goals (v1): auto-opening PRs, running the user's code, private repos, non-GitHub hosts (GitLab later), replacing the user's judgement.

## 5. User flow
1. Install -> `contribpilot login` (Google OAuth, loopback + PKCE).
2. `contribpilot start` -> paste public GitHub repo URL.
3. Choose level: Beginner / Intermediate / Pro (stored; `contribpilot level` switches any time; re-ranks using cached data).
4. **Stage A — Codebase analysis**: stack, structure, entrypoints, test setup, build commands, hotspots, TODO/FIXME, lint/test failures *statically inferred*, CONTRIBUTING rules, AI policy.
5. **Stage B — Issue analysis**: fetch open issues; read body, comments, linked PRs, images/videos (multimodal), labels, age, activity; detect claims/duplicates/stale work.
6. **Stage C — Ranking**: score per level (see 06) -> top 3, one tagged MOST RECOMMENDED, each with evidence + "why this level" + risk notes.
7. User picks one -> **Stage D — Contribution Pack** generated.
8. **Handoff**: download `.md` or launch detected agent (CLI) / IDE (web).

## 6. Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| F1 | Google sign-in from CLI; token stored in keychain; logout | P0 |
| F2 | Validate & normalize public GitHub URL (owner/repo, .git, trailing paths) | P0 |
| F3 | Level selection + persistent config + switch any time | P0 |
| F4 | Codebase analysis (static, read-only) with cached `RepoProfile` | P0 |
| F5 | Issue fetch + filter (open, not PR, activity window) | P0 |
| F6 | Issue evidence: comments, linked/open PRs, assignees, claim phrases ("I'll take this"), staleness | P0 |
| F7 | Multimodal reading of issue screenshots/videos (cap size/count) | P1 |
| F8 | Level-aware scoring -> top 3 + MOST RECOMMENDED | P0 |
| F9 | Merge-likelihood signals (maintainer responsiveness, merge history, labels like `help wanted`) | P1 |
| F10 | Contribution Pack generation (`CONTRIBUTION_PLAN.md`) | P0 |
| F11 | Detect installed AI CLI agents; launch with prompt + file | P0 |
| F12 | AI-policy / CLA / DCO / CONTRIBUTING detection and warnings | P1 |
| F13 | Offline cache, resume interrupted run, `--json` output | P1 |
| F14 | Web UI (same core) with download + "open in" buttons | P2 |
| F15 | Learning mode for beginners (glossary, "why" notes) | P2 |

## 7. Non-functional requirements
- First useful output (top 3) in < 90 s for a medium repo (<2k files, <500 open issues) on decent network.
- Works macOS / Linux / Windows. Single install command.
- Cost control: token budget per run, summarize-then-rank pipeline, cache everything.
- Privacy: only public data leaves the machine; no source upload of private code.
- Accessibility: no color-only meaning in CLI; `--no-color`, `--plain`.

## 8. Success metrics
- % of runs ending in a Contribution Pack (target > 60%).
- % of picked issues that get a PR opened within 14 days (self-reported opt-in / link click).
- Merge rate of PRs from picked issues vs baseline.
- Duplicate-work avoidance: % of recommended issues with zero competing open PR (target > 95%).
- Time from `start` to handoff (median < 5 min).

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Google login does not equal free Gemini access | See ARCHITECTURE §4 decision (BYOK first, proxy later) |
| GitHub rate limits | Auth token optional but encouraged; cache; conditional requests (ETag) |
| LLM hallucinated plans | Evidence-cited, schema-validated, file paths verified to exist |
| Prompt injection via issues | SECURITY §3 |
| Spam/AI-slop PRs hurting maintainers | Policy checks, "understand before you code" gate, Learning mode |
| Agent CLI flags change | Adapter layer + VERIFY + tests |
