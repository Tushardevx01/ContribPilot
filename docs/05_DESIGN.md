# 05 — Design (CLI first, Web later)

## 1. Principles
Guided not overwhelming · always show progress · evidence over opinion · keyboard-only friendly · no color-only meaning · every step reversible (`Esc` = back).

## 2. CLI flow (screens)
```
$ contribpilot start

 ContribPilot  v0.1
 ◇ Signed in as dev@gmail.com        (or: ◆ Sign in with Google -> opens browser)
 ◆ Paste a public GitHub repo URL:   https://github.com/owner/repo
 ◆ Your level?   ( ) Beginner  (•) Intermediate  ( ) Pro        [change anytime: contribpilot level]

 ✔ Repo found: owner/repo  ★ 12.4k  TypeScript  last push 2d ago
 ⠋ Analyzing codebase ........ 42%   (structure · build/test commands · contribution rules)
 ✔ Contribution rules: CONTRIBUTING.md found · DCO required · AI policy: allowed with disclosure
 ⠋ Reading 187 open issues ... comments · linked PRs · screenshots
 ✔ Removed: 61 claimed, 34 with active PRs, 22 stale

 Top 3 for Intermediate
 ┌ ★ MOST RECOMMENDED ──────────────────────────────────────────┐
 │ #4521  Crash when config file has BOM                  score 91
 │ Why: clear repro, maintainer asked for a PR, touches 2 files
 │ Effort: ~3h   Risks: needs Windows line-ending test
 └──────────────────────────────────────────────────────────────┘
 #4310  Add --json flag to `list`                          score 84
 #4477  Race condition in watcher on rename                score 79

 ◆ Choose an issue  (↑/↓, Enter, `d` details, `l` switch level)
 ✔ Generated CONTRIBUTION_PLAN.md  ->  ./contribpilot/owner-repo-4521/

 ◆ What next?
   ( ) Save the .md only
   (•) Hand off to an AI agent  — detected: claude, gemini, codex
   ( ) Open folder
```
Handoff confirmation shows the exact command + file attached; user presses Enter to launch.

## 3. Microcopy rules
Plain English, verbs first, errors say what happened + what to do (`Rate limit hit. Add a GitHub token: contribpilot config github`).

## 4. Web UI (Phase 6)
Pages: Landing -> Sign in -> Repo input -> Level picker -> Live analysis timeline (SSE) -> Top-3 cards (MOST RECOMMENDED badge) -> Issue detail + plan preview (markdown render + mermaid)
-> **Action bar**: Download .md · Copy prompt · Open in Cursor · Open in VS Code · Open in Antigravity · Open in Google AI Studio.
Layout: single column, max-width 960px, card grid for top 3, sticky action bar. Light/dark. Responsive down to 360px. WCAG AA contrast.
Tokens: radius 12px, spacing scale 4/8/12/16/24/32, one accent color, status colors paired with icons.

## 5. States to design
Empty (no issues match) · Rate-limited · Policy blocked · Partial results (media failed) · Offline cache · Long-running (>60s with cancel).
