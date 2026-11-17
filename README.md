# ContribPilot

> AI-powered CLI assistant that helps developers find, plan, and start **mergeable** open-source contributions.

---

## What is ContribPilot?

Developers want to contribute to open source, but often:
- Struggle to find issues tailored to their exact skill level.
- Accidentally work on issues that are already claimed or have open PRs.
- Spend hours trying to understand a massive new codebase.
- Hit a "blank page" problem between choosing an issue and writing code.

**ContribPilot solves this end-to-end:**
1. **Intelligent Codebase & Policy Analysis:** Analyzes the target repository's architecture, build/test commands, and contribution/AI policies.
2. **Claim Radar & Issue Filtering:** Fetches open issues and filters out claimed issues, competing active PRs, and stale work.
3. **Multi-Factor Issue Ranking:** Scores and ranks candidates by merge likelihood, level fit, clarity, and impact.
4. **Contribution Pack Generation:** Generates a full `CONTRIBUTION_PLAN.md` with problem root cause hypotheses, verified affected files, Mermaid architecture diagrams, step-by-step implementation plans, and regression test suites.
5. **Direct Agent Handoff:** Automatically detects your local AI coding agents (**Claude Code**, **Gemini CLI**, **OpenCode**, **Cursor**, and **VS Code**) and launches them with the contribution plan pre-attached.

---

## Installation & Setup

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Clone & Install
```bash
git clone https://github.com/sayandeep0212/ContribPilot.git
cd ContribPilot
pnpm install
pnpm build
```

---

## Configuration

ContribPilot automatically loads environment variables from a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env`:
```env
# 1. Google Gemini API Key (Get from https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. GitHub Token (Optional, unlocks 5,000 req/hr rate limits)
GITHUB_TOKEN=ghp_your_github_token_here

# 3. Google OAuth Credentials (Optional, for 'pnpm cli login')
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

Or configure keys securely using the CLI (saved in your OS keychain / encrypted store):
```bash
pnpm cli config --gemini <YOUR_KEY>
pnpm cli config --github <YOUR_TOKEN>
```

---

## Usage

### 1. Guided Contribution Flow (`start`)
Run the interactive CLI:
```bash
pnpm cli start
```
Or specify the repository directly:
```bash
pnpm cli start facebook/react
```

### 2. Environment Diagnostics (`doctor`)
Check your node version, API keys, and detected local agents:
```bash
pnpm cli doctor
```

### 3. Check Detected Agents (`agents`)
```bash
pnpm cli agents
```

### 4. Direct CLI Commands
```bash
# Stage A: Codebase static analysis
pnpm cli analyze owner/repo

# Stages B+C: Fetch & rank top 3 issues
pnpm cli issues owner/repo --level intermediate

# Stage D: Generate Contribution Pack for an issue
pnpm cli pack owner/repo <issueNumber>

# Switch experience level (beginner | intermediate | pro)
pnpm cli level beginner
```

---

## Architecture & Monorepo Structure

```
ContribPilot/
├── apps/
│   ├── cli/          # Commander + Clack CLI binary
│   └── web/          # Modern showcase web app (Vite + React + Tailwind)
├── packages/
│   ├── shared/       # Core types, typed errors, secret-redacting logger
│   ├── auth/         # TokenStore (keychain + encrypted vault), PKCE OAuth, Dodo loopback
│   ├── github/       # Octokit client, ETag cache, EvidenceExtractor
│   ├── analyzer/     # Static codebase analyzer (commands, policies, health audit)
│   ├── ranker/       # Multi-factor issue scoring & level policies
│   ├── llm/          # Google Gen AI SDK + Groq failover provider & prompt guards
│   ├── pack/         # CONTRIBUTION_PLAN.md renderer
│   ├── handoff/      # Local agent detection & launch adapters
│   └── core/         # Pipeline engine orchestrator
└── docs/             # Product specifications & architectural docs
```

---

## Web Showcase & Landing Page

Launch the web app locally:
```bash
pnpm web
# Open http://localhost:3000
```
Build static production assets:
```bash
pnpm web:build
```

---

## Testing & Quality

```bash
# Run Vitest test suite
pnpm test

# Typecheck all packages
pnpm typecheck

# Lint codebase (enforces security rules banning shell: true)
pnpm lint
```

---

## Developer Attribution & License

Engineered with ❤️ by **Sayandeep Pradhan** ([@sayandeep0212](https://github.com/sayandeep0212)).

Licensed under [Apache-2.0](LICENSE) © Sayandeep Pradhan.
