# 06 — Issue Scoring & Level Policies

## 1. Hard filters (issue removed if any is true)
- Is a PR, closed, locked, or `wontfix`/`duplicate`/`invalid`/`question` label.
- Has an **open linked PR** that is active (activity < 30 days) -> remove (or flag "competing PR").
- Has an **active claim** (comment "I'll work on this"/assigned, activity < 14 days) -> remove.
- Repo bans AI-assisted PRs and user hasn't overridden.
- Last maintainer activity on repo > 90 days (repo likely dead) -> warn/remove.

## 2. Score (0-100) = weighted sum
| Signal | Weight | Notes |
|---|---|---|
| Merge likelihood | 25 | maintainer replied on issue, `help wanted`/`good first issue`, recent merges by external contributors, median PR review time |
| Level fit | 25 | complexity vs level (table below) |
| Clarity | 15 | reproducible, acceptance criteria, screenshots/logs present |
| Impact / need | 15 | reactions, duplicates referencing it, labeled bug/priority, milestone, affects many users |
| Freshness & liveness | 10 | recent activity, not stale-bot-marked |
| Scope containment | 10 | few files, low coupling (from RepoProfile + file retrieval) |
Penalties: -15 competing stale PR (could be taken over), -10 requires infra/secrets, -10 ambiguous maintainers' direction ("needs discussion").

## 3. Level policies
| | Beginner | Intermediate | Pro |
|---|---|---|---|
| Preferred types | docs, tests, small bugs, good first issue | bugs w/ repro, small features, refactors with tests | perf, architecture, concurrency, security (non-sensitive), large features |
| Target effort | 1-4 h | 0.5-2 days | 2+ days |
| Max files touched | ~3 | ~8 | any |
| Needs clear AC? | required | preferred | optional |
| Plan style | verbose, learning notes, glossary | balanced | terse, design trade-offs |
| Avoid | anything needing deep domain knowledge or maintainer design decision | vague epics | trivial typos (low value) |

## 4. Output rule
- Return exactly 3: the highest score = **MOST RECOMMENDED**; others must differ in type or area when scores are close (diversity).
- Each includes: evidence links, why-for-this-level, risks, effort, likely files, "what could make this PR rejected".
- Switching level re-runs ranking only (cached evidence) — no refetch.

## 5. LLM role
Rules compute hard filters + base score deterministically. LLM adds `judgeFit` (0-10) and clarity summary, capped to +/-10 points so the LLM cannot override evidence (e.g., an active competing PR).
