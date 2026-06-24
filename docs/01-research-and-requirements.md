# Agent Skills Library for Vibe-Coders → Next.js on Vercel
*Design research & requirements. Status: reviewed (2026-06-24).*

## Goal
A library of agent skills (Agent Skills / `SKILL.md` standard) that lets a
**non-developer who vibe-codes** maintain, deploy, and manage Next.js projects
on Vercel — safely, with the agent doing the git/deploy/ops work.

---

## 1 & 2. How Vercel built `agent-skills` — the blueprint we copy

[`vercel-labs/agent-skills`](https://github.com/vercel-labs/agent-skills) follows the
open [Agent Skills standard](https://agentskills.io/) — the same `SKILL.md` format
Claude Code, Cursor, and Copilot read.

**Repo layout**
```
agent-skills/
  AGENTS.md / CLAUDE.md     # how agents work in this repo
  README.md                 # human-facing catalog
  skills.sh.json            # groups skills into categories
  skills/
    {kebab-case-name}/
      SKILL.md              # REQUIRED — the skill
      scripts/              # optional .sh / .mjs automation
      references/           # optional docs, loaded on demand
      lib/                  # optional shared code
      metadata.json         # optional version/author/abstract
```

**`SKILL.md` format**
```markdown
---
name: deploy-to-vercel
description: Deploy applications to Vercel. Use when the user says
  "deploy my app", "push this live", or "create a preview deployment".
metadata:
  author: vercel
  version: "3.0.0"
---
# Deploy to Vercel
{instructions, decision trees, exact commands, output templates}
```

**Design principles we adopt wholesale**

| Principle | What it means | Why it matters for vibe-coders |
|---|---|---|
| Progressive disclosure | Only `name`+`description` load at startup; full `SKILL.md` loads on demand; keep < 500 lines | Fast, cheap, fires only when needed |
| Trigger-phrase descriptions | Descriptions embed phrases a user types ("deploy my app") | Plain-language intent auto-activates the right skill |
| Decision trees over assumptions | `deploy-to-vercel` checks git remote / linked / authed / team before acting | Adapts to a beginner's messy repo state |
| Preview-first, ask-before-destructive | "Always deploy as preview unless explicitly asked for production"; "never push without approval" | The #1 safety rule — no accidental prod nukes |
| Scripts over inline code | Heavy logic in `scripts/*.mjs`; stdout=JSON, stderr=status, `set -e`, cleanup traps | Reliable automation, doesn't burn context |
| Plain-English output templates | Literal "Tell the user: 'Your deployment is ready at [url]…'" blocks | Human gets a clear result, not CLI noise |
| State/metrics first, never guess | `vercel-optimize` refuses to read source until real signals exist; never put tokens in command args | Safe, grounded behavior when the operator can't audit |
| One-line install | `npx skills add <repo> --skill <name>` or copy to `~/.claude/skills/` | Realistic for non-devs |

**Reference implementations to learn from / wrap:** `deploy-to-vercel`,
`vercel-cli-with-tokens`, `vercel-optimize`.

---

## 3. Next.js repo requirements
A skill must be able to check each and refuse/repair before deploying.

1. `package.json` with `dev`, `build`, `start`, `lint` scripts.
2. Exactly one committed lockfile (`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`).
3. A Next.js config file (`next.config.ts`/`.js`), even if minimal.
4. Pinned Node version (`"engines"` and/or `.nvmrc`) on a Vercel-supported runtime.
5. Valid app structure — App Router (`app/layout.tsx` + `page.tsx`) or Pages Router. Current Next.js = **v16**.
6. Correct `.gitignore` — excludes `node_modules/`, `.next/`, `.env*` (keep `.env.example`), `.vercel/`.
7. No secrets in repo or git history. Secrets only in Vercel env vars. Committed `.env.example` with keys, no values.
8. `next build` passes cleanly — failing build is a hard blocker.
9. `README.md` with install/run instructions.
10. TypeScript with `strict: true` + a `typecheck` script (`tsc --noEmit`) — catches the class of bugs AI most often introduces.
11. ESLint + Prettier configured, with a `lint` script (run by the agent's local gate; Vercel's build runs ESLint too).
12. Runtime env-var validation (`zod` / `@t3-oss/env-nextjs`) — a missing key fails loudly at build, not silently in production.
13. Route-level safety files: `error.tsx`, `not-found.tsx`, `loading.tsx`, + a root error boundary.
14. `next/image` for all images; metadata/SEO via the Metadata API.

---

## 4. Git requirements
1. Repo connected to a GitHub `origin`.
2. Correct `.gitignore` (no secrets / artifacts).
3. `main` is the single production source of truth.
4. No secrets ever committed (rotate, don't just delete, if leaked).
5. Conventional Commits (`feat:`/`fix:`/`chore:`) — agent authors meaningful messages; enables changelogs and clarity for humans.
6. Feature-branch convention (`feat/login-page`) — the agent never works directly on `main`.
7. Squash-merge PRs to keep `main` history linear and readable.
8. PR template + CODEOWNERS (even if the owner is just the founder).
9. Pre-commit hooks (Husky + lint-staged) to run lint/typecheck before a commit is even made.

## 5. Vercel deployment & management requirements
1. Vercel project linked to the GitHub repo via Git integration (push → deploy, full audit trail).
2. Production branch = `main`.
3. Env vars set per environment (Dev / Preview / Prod) in Vercel, never in repo.
4. Framework preset = Next.js, correct build/output settings.
5. Preview deployments enabled (every PR gets a real URL).
6. Failed build blocks promotion to production.

### Tooling & access preconditions (checked by vibe-check)
Before any of the above can be verified or fixed, the environment must have: **git**, the
**GitHub CLI (`gh`) logged in**, **Node + the package manager**, and **Vercel access** — the
**Vercel CLI logged in *or* a Vercel MCP connected** (only one is needed). vibe-check also
confirms every `.env.example` key exists in Vercel (production + preview).

---

## 6. Three workflow options (code → test → GitHub → PR → review → deploy)

### A — Guardrail Solo (max safety, zero git knowledge)
AI writes code → local gate (typecheck+lint+build) → AI commits to feature branch + pushes →
PR → Vercel preview → AI summarizes change + preview URL → human reviews the **live site** →
squash-merge to main → prod deploy → one-command rollback standing by.
*Review = the running site, not a diff.*

### B — Standard PR Flow (RECOMMENDED DEFAULT)
Feature branch → agent runs local gate (lint+typecheck+test+build) → push → PR →
Vercel build check + preview → review (AI comments + human preview check) →
squash-merge to main → prod deploy → post-deploy smoke check.
*Gate = agent-run local checks + Vercel build. No GitHub Actions — see CI decision doc.*

### C — Staged Team-Grade (most robust)
Feature → PR → local gate (incl. e2e) + Vercel preview → merge to `staging` (Vercel staging
env for QA) → promote to main behind manual approval gate → prod deploy + Sentry + usage
alerts + rollback. Renovate auto-PRs deps through the same pipeline.

| | A Solo | B Standard | C Staged |
|---|---|---|---|
| Branches | feature→main | feature→main | feature→staging→main |
| Test gate | local | local + Vercel build | local + Vercel + e2e |
| Enforcement | optional | agent + Vercel | required + approval |
| Environments | preview+prod | preview+prod | preview+staging+prod |
| Human review | live preview | preview + AI | staging QA + approval |
| Git knowledge | none | minimal | some |

**Decision: build around B as default; A = beginner toggle; C = upgrade path.** Each tier is a superset of the previous.

---

## Sources
- [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (read directly)
- [Agent Skills standard](https://agentskills.io/)
- [Next.js on Vercel — Vercel Docs](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Deploy & optimize Next.js 16 on Vercel](https://raymartin.es/en/blog/nextjs-vercel-deployment)
