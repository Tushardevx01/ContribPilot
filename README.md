# ContribPilot

<p align="center">
  <img src="https://raw.githubusercontent.com/sayandeep0212/ContribPilot/main/docs/assets/contribpilot-banner.png" alt="ContribPilot Banner" width="700" />
</p>

```
   ____            _        _ _     ____  _ _       _   
  / ___|___  _ __ | |_ _ __(_) |__ |  _ \(_) | ___ | |_ 
 | |   / _ \| '_ \| __| '__| | '_ \| |_) | | |/ _ \| __|
 | |__| (_) | | | | |_| |  | | |_) |  __/| | | (_) | |_ 
  \____\___/|_| |_|\__|_|  |_|_.__/|_|   |_|_|\___/ \__|
```

> **AI-powered open-source contribution assistant** that helps developers find, plan, diagnose, and land **mergeable** pull requests in minutes.  
> Powered by your personal **Google Gemini** quota ($0 setup) with automatic **Groq LPU** failover.

---

## What is ContribPilot?

Over **82% of first-time open-source contribution attempts are abandoned** due to broken local toolchains, missed `CONTRIBUTING.md` guidelines, or working on stale, duplicate issues.

**ContribPilot solves this end-to-end directly in your terminal:**
1. **Intelligent Codebase & Policy Analysis:** Lightweight AST parsing across thousands of modules, build/test commands, and contribution policies.
2. **Claim Radar & Issue Filtering:** Automatically discovers unassigned tickets and filters out duplicate or contested PRs.
3. **Multi-Factor Issue Ranking:** Scores and ranks candidates by merge likelihood, contributor skill level, and clarity.
4. **Contribution Plan & Mergeable Diffs:** Generates step-by-step reproduction instructions, affected file lists, unit test suites, and maintainer-compliant PR descriptions.
5. **Direct Agent Handoff:** Integrates with local AI coding agents (**Claude Code**, **Gemini CLI**, **OpenCode**, **Cursor**, **VS Code**).
6. **Pro Repository Health & Secret Auditing:** Scans for exposed tokens, API keys, and repository health metrics powered by Dodo Payments.

---

## ⚡ Quickstart (Zero Installation)

Run ContribPilot instantly with `pnpm dlx` or `npx`:

```bash
# Run on any public repository
npx contribpilot start facebook/react

# Or with pnpm
pnpm dlx contribpilot start shadcn-ui/ui
```

Or install globally:

```bash
npm install -g contribpilot
contribpilot --help
```

---

## 🚀 CLI Commands & Interactive Palette

ContribPilot features an **interactive slash command palette** (`/`). Press `/` anywhere in an interactive prompt to open the fuzzy search palette.

| Command | Description |
| :--- | :--- |
| `contribpilot start [repo]` | Full guided flow: repo analysis ➔ level select ➔ top 3 issues ➔ plan ➔ PR diff |
| `contribpilot audit <repo>` | **[PRO]** Scan repo health, code structure, project summary & secret leaks |
| `contribpilot quota` | Inspect Google Gemini RPM/TPM quota, Groq LPU failover, and device agents |
| `contribpilot level [level]` | Switch contributor experience (`beginner` \| `intermediate` \| `pro`) |
| `contribpilot agents` | Detect and list installed AI coding agents on your device |
| `contribpilot upgrade` / `/pro` | Activate ContribPilot Pro via **Dodo Payments** for hosted quota & deep audits |
| `contribpilot doctor` | Run environment diagnostics (Node, Git, Keychain, Network, API keys) |
| `contribpilot login` | Authenticate with Google OAuth (Loopback Server + PKCE) |
| `contribpilot logout` | Safely wipe stored tokens and credentials from OS keychain |
| `contribpilot whoami` | Show current authenticated user profile and Gemini quota status |
| `contribpilot about` | Show version, developer credits, and architecture overview |

---

## 🔐 Zero Server Cost & Security Model

- **100% Free Tier ($0):** Connects directly to Google's official free Gemini API allowance (15 requests/min, 1,000,000 tokens/min).
- **Local Credential Storage:** Tokens and API keys are stored securely in your OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) with AES-256-GCM encrypted fallback.
- **Strict Network Isolation:** Local loopback servers bind exclusively to `127.0.0.1` with Content-Security-Policy headers and cryptographic CSRF state verification.

---

## 💳 ContribPilot Pro (Powered by Dodo Payments)

For active engineers, staff developers, and teams:
- **Hosted Gemini 1.5 Pro AI Quota:** Zero Google Cloud setup required.
- **Deep Repository Security Audit (`contribpilot audit <repo>`):** Secret leak detection, CVE scan, license compliance, and PR turnaround metrics.
- **Multi-Repo Batch Analysis & Priority AST Reasoning.**

Run in terminal to activate:
```bash
contribpilot upgrade
# Or with a purchased key:
contribpilot upgrade --key cp_pro_xxxxxxxx
```

---

## 🌐 Web Showcase & Landing Page

Preview the modern showcase web app locally:
```bash
pnpm web
# Open http://localhost:3000
```

Build production bundle:
```bash
pnpm web:build
```

---

## 🧪 Testing & Code Quality

```bash
# Run Vitest test suite (16 tests across 4 packages)
pnpm test

# Typecheck all packages
pnpm typecheck

# Lint codebase (ESLint 9 Flat Config)
pnpm lint
```

---

## 👨‍💻 Developer & License

Engineered with ❤️ by **Sayandeep Pradhan** ([@sayandeep0212](https://github.com/sayandeep0212)).

Licensed under the **Apache-2.0 License**.
