# Contributing to ContribPilot

Thank you for your interest in contributing to **ContribPilot**! 🎉  
We welcome contributions from developers of all skill levels — from first-time open-source contributors to seasoned engineers.

---

## 🧭 Code of Conduct

This project and everyone participating in it is governed by the [ContribPilot Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [sayandeep0212@gmail.com](mailto:sayandeep0212@gmail.com).

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0` (Recommended: `pnpm@12.x`)
- **Git**

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/ContribPilot.git
cd ContribPilot
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Build the Monorepo

```bash
pnpm build
```

### 4. Configure Environment Variables (Optional for local testing)

```bash
cp .env.example .env
```

Add your free Gemini API key from [Google AI Studio](https://aistudio.google.com/) or run `pnpm cli login`.

---

## 🧱 Monorepo Architecture

ContribPilot is organized as a Turborepo monorepo with clean separation of concerns:

```
ContribPilot/
├── apps/
│   ├── cli/            # Commander + Clack CLI binary (@contribpilot/cli)
│   └── web/            # Modern showcase landing page (Vite + React + Tailwind)
├── packages/
│   ├── shared/         # Core TypeScript types, typed errors, redact logger
│   ├── auth/           # Google OAuth PKCE, TokenStore (Keychain + AES-GCM vault)
│   ├── github/         # Octokit GitHub client, ETag cache, issue fetcher
│   ├── analyzer/       # Static AST codebase analyzer, rules & health audit
│   ├── ranker/         # Multi-factor issue scoring & level policy matching
│   ├── llm/            # Google Gemini SDK + Groq failover provider
│   ├── pack/           # CONTRIBUTION_PLAN.md renderer & PR checklists
│   ├── handoff/        # Local AI agent detection (Claude, Gemini CLI, Cursor, VS Code)
│   └── core/           # Pipeline orchestrator engine
└── docs/               # Specifications and architectural documentation
```

---

## 🧪 Testing & Quality Standards

Before submitting a Pull Request, make sure all checks pass locally:

```bash
# 1. Run Vitest Unit Tests
pnpm test

# 2. Typecheck all packages
pnpm typecheck

# 3. Lint the codebase (ESLint 9 Flat Config)
pnpm lint

# 4. Format check
pnpm format:check
```

---

## 🌿 Git & Pull Request Guidelines

### Branch Naming Conventions

- `feat/<feature-name>`: New feature or capability
- `fix/<bug-name>`: Bug fix
- `docs/<doc-name>`: Documentation updates
- `refactor/<name>`: Code refactoring without behavioral change
- `test/<name>`: Adding or modifying unit tests

### Commit Messages (Conventional Commits)

Please follow conventional commit formatting:

- `feat(cli): add /quota slash command`
- `fix(auth): handle expired refresh token gracefully`
- `docs(readme): add cli screenshot banner`

### Pull Request Checklist

- [ ] Code compiles cleanly with `pnpm build`
- [ ] All Vitest tests pass with `pnpm test`
- [ ] ESLint passes with `pnpm lint` (0 errors, 0 warnings)
- [ ] No secrets, keys, or credentials committed
- [ ] Description links to the related issue (e.g. `Fixes #12`)

---

## 🐶 Dogfooding ContribPilot on ContribPilot

You can use ContribPilot to contribute to ContribPilot itself!

```bash
pnpm cli start sayandeep0212/ContribPilot
```

---

## 💬 Questions & Community

- **Creator & Lead Maintainer**: **Sayandeep Pradhan** ([@sayandeep0212](https://github.com/sayandeep0212))
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/sayandeep0212/ContribPilot/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sayandeep0212/ContribPilot/discussions)
