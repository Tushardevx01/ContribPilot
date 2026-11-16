# 08 — SKILLS

Two kinds: **(A) Builder skills** — instructions for your coding agent while building the project (use the `SKILL.md` format your agent supports, e.g. copy each block into `.claude/skills/<name>/SKILL.md` or equivalent), and **(B) Product skill modules** — capabilities inside ContribPilot.

## A. Builder skills

### skill: ts-monorepo-setup
When: Phase 0. Do: pnpm workspace, turborepo, tsconfig base (strict), eslint (ban `shell: true`, `any`), prettier, vitest, changesets, GitHub Actions (lint, test, typecheck, audit). Done when `pnpm -r test` passes on CI for Win/Mac/Linux.

### skill: secure-oauth-cli
When: Phase 1. Do: loopback + PKCE, state/nonce, random port, single-use server, keytar storage, refresh handling, logout wipes. Test with mocked Google endpoints. Check current Google installed-app docs.

### skill: github-evidence-extraction
When: Phase 3. Do: Octokit with throttling + ETag cache; timeline events API for linked PRs and cross-references; regex+LLM claim detection; stale PR rule; reactions; maintainers = users with write/maintain/admin or `author_association` OWNER/MEMBER/COLLABORATOR.

### skill: llm-structured-output
When: any AI call. Do: zod schema -> JSON mode; delimiters for untrusted text; retry<=2 with error feedback; token budget guard; fixtures + golden tests with a fake provider (no network in CI).

### skill: prompt-injection-defense
When: before merging any prompt. Do: run corpus (`tests/injection/*.md`): hidden HTML comments, "ignore instructions", zero-width chars, fake system messages, malicious image text. Output must remain schema-valid and ignore the payload.

### skill: cli-ux-polish
Do: clack prompts, spinners with real progress counts, `--json/--plain`, helpful errors, Ctrl-C clean exit, resume support, non-TTY detection.

### skill: cross-platform-process-launch
Do: `execa` arg arrays, `which`, Windows `.cmd` shims, quoting-free prompt passing via temp file/stdin, timeouts, clean child cleanup.

### skill: markdown-pack-renderer
Do: template per section, mermaid diagram generation (validate syntax), verify every file path exists in repo tree, include evidence links, level-specific tone.

### skill: release-engineering
Do: npm publish with provenance, semantic versioning, `npx` smoke test, Homebrew/Scoop later, changelog.

## B. Product skill modules (the "unique upgrades")
| Module | What it does | Why it's different |
|---|---|---|
| **Claim Radar** | Detects "I'll take this", assignees, abandoned claims, draft PRs, forks with fixes | Avoids duplicate work, the #1 contributor frustration |
| **Merge Predictor** | Maintainer response time, external-PR merge rate, review latency, label signals | Optimizes for *merged*, not just *findable* |
| **Policy Guard** | Reads CONTRIBUTING, CLA/DCO, AI-usage policy, PR template | Protects the user and maintainers from rejected/spam PRs |
| **Media Reader** | Gemini multimodal reading of screenshots/GIF frames/video keyframes in issues | Many bug reports hide the key info in media |
| **Level Lens** | Re-ranks and rewrites plan tone per level; switch instantly | Core to your idea |
| **Issue-to-Files Mapper** | Retrieval over repo to list likely files with reasons | Turns "issue" into "where to start" |
| **Takeover Finder** | Finds stale abandoned PRs that can be continued | High merge chance, less work |
| **Contribution Pack** | Plan + branch name + commit message + PR draft + test plan | End-to-end, not just a list |
| **Understand-First Gate** | 3 quick comprehension questions before handoff (beginner mode) | Learning and anti-slop quality |
| **Repo Health Score** | Activity, responsiveness, contributor friendliness | Don't waste time on dead repos |
| **Outcome Loop** | Opt-in: record PR opened/merged to tune scoring | Moat: proprietary merge-outcome data over time |
| **Watch Mode** | Notify when a matching new issue appears | Retention |
