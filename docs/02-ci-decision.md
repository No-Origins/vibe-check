# Decision: Testing & deploy gate (no GitHub Actions)
*Status: decided (2026-06-24). Amends Workflow B in `01-research-and-requirements.md`.*

## Decision
**No GitHub Actions / GitHub CI anywhere in this library.** The skills do **not** use it,
do **not** scaffold it, and do **not** even check whether a repo has it. The gate is:

1. **Agent-run local checks (primary):** before any push, the agent runs `lint`,
   `typecheck`, `test`, `build`. It never opens a PR or merges on red.
2. **Vercel build (free remote backstop):** every push runs `next build`, which runs
   TypeScript + ESLint by default, in a clean environment. Fail → failed deploy →
   red check on the PR, automatically, for free.
3. **Human review:** the live preview URL.

## Why no GitHub Actions
- **Enforcement is paywalled where it matters.** Branch protection / rulesets (what makes
  a check un-skippable) are free only on *public* repos; on a free *private* repo they need
  GitHub Pro/Team. Most vibe-coders run private repos on free plans, so an Actions gate
  would be advisory-only anyway — no better than the agent running checks itself.
- **Vercel already covers build + types + lint remotely, for free, with zero setup.** The
  agent covers tests locally. Adding Actions duplicates this and forces setup/maintenance
  the user doesn't want.

## Closing the test gap (free, no Actions)
Fold unit tests into the build command so Vercel's free gate also runs tests:
```jsonc
// package.json — a failing test now fails the Vercel deployment, for free
"build": "vitest run && next build"
```
Caveat: slows builds + uses build minutes; e2e tests needing a live server don't fit here
(run those locally via the agent).

## What this means for the skill library
- `quality-gate` skill = run lint/typecheck/test/build **locally**; the real gate, always present.
- `safe-deploy` / `open-pr` skills rely on the **Vercel build check + the live preview**.
- **No `setup-ci` skill. No skill reads `.github/workflows` or touches branch protection.**
- No skill ever asks the user to configure CI in a web dashboard.

## Sources
- [About rulesets — GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets) (rulesets paid on private repos)
- [Next.js on Vercel — Vercel Docs](https://vercel.com/docs/frameworks/full-stack/nextjs) (build runs lint + types)
