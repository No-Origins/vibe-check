---
name: safe-deploy
description: Ship the current branch safely — run the quality gate, commit, push, open a PR with a preview deployment, review it, and (only with explicit approval) merge to production on Vercel. Use when the user says "safe-deploy", "deploy", "ship it", "push this live", "release", "go live", or "create a preview".
metadata:
  author: vibe-check
  version: "0.1.0"
---

# Safe-Deploy

Ship work the safe way: nothing broken goes out, production is never touched without an
explicit OK, and the human reviews the **live preview**, not the code.

## Golden rules
- **Preview first.** Default to a preview deployment. Go to production only when the user
  explicitly approves it.
- **Never ship a failing gate.** Lint, typecheck, tests, and build must all pass before pushing.
- **Never deploy from `main`.** Work ships from a feature branch via a PR.
- **Secrets never go in git.** They live in Vercel env vars.
- **Speak plainly.** A sentence or two per step; the user is not a developer.

## Step 1 — Pre-flight
```bash
git branch --show-current
git status --porcelain
git remote get-url origin
cat .vercel/project.json 2>/dev/null || cat .vercel/repo.json 2>/dev/null   # linked?
vercel whoami 2>/dev/null                                                    # CLI authed?
```
Decide:
- **On `main`** → stop: "We don't ship directly from `main`. Run new-vibe to put this work
  on its own branch first." (Offer to do it.)
- **Not a git repo, or not linked to Vercel** → "This repo isn't set up yet — run
  vibe-check first." Then stop.
- Otherwise continue.

## Step 2 — Run the quality gate (parallel sub-agents)
Spawn **one sub-agent per check, in parallel.** Each runs its command and reports
`pass`/`fail` with the key errors — **checks only, no editing** (so parallel agents never
collide):
- `npm run lint`
- `npm run typecheck`  (or `npx tsc --noEmit`)
- `npm test`           (skip if there's no test script)
- `npm run build`

Gather the results. **If anything fails:** tell the user in plain language what broke, fix
it yourself (serially — not in parallel), and re-run the gate. **Do not continue until the
gate is fully green.**

(If you can't spawn sub-agents, run the checks yourself one at a time.)

## Step 3 — Commit
Stage the work and commit with a Conventional Commit message that describes the change.
Double-check nothing secret is staged.
```bash
git add -A
git commit -m "<type>: <what changed>"   # feat: / fix: / chore: ...
```

## Step 4 — Push and open a PR (this creates the preview)
```bash
git push -u origin <branch>
gh pr create --fill --base main
```
Vercel builds a **preview deployment** automatically from the push — this is the preview,
not production.

## Step 5 — Review the change (review sub-agent)
Spawn a **fresh review sub-agent** to review the diff (`git diff main...HEAD`) for obvious
bugs, security issues, or leftover debug code. It returns findings. Put a short summary in
the PR description; surface anything blocking to the user and fix it — then the gate
(Step 2) must pass again.

## Step 6 — Get the preview URL and hand it to the human
```bash
sleep 5 && vercel ls --format json    # latest deployment's `url`, if the CLI is authed
```
If the CLI isn't authed, point the user to the PR's checks or the Vercel dashboard. Then
tell them, plainly:
> Preview is live: <url>. Open it and check it looks right. Want me to ship it to
> production?

## Step 7 — Production (only on explicit approval)
**Only if the user explicitly approves**, merge the PR to `main` — Vercel deploys production
automatically:
```bash
gh pr merge --squash --delete-branch
```
If they don't approve, **leave the PR open at preview** and stop. Never merge unasked.

## Step 8 — Post-deploy smoke check
After a production merge, confirm prod is healthy:
```bash
sleep 5 && vercel ls --format json    # production deployment URL + state
```
Hit the health route if one exists (`/api/health`). Report the result. **Do not** curl the
site just to "verify" beyond the health check.

## Step 9 — Tell the user
Plain language:
> Shipped — production is live at <url> and the health check passed.

or, if they stopped at preview:

> Preview is at <url>; nothing went to production.

Optionally append a one-line entry to `.vibe-check/memory.md` History:
`- <date> — deployed <branch>: preview <url>` (+ prod url if merged).

## Notes
- Reuses Vercel's git integration (push → preview, merge to `main` → production). For raw
  CLI/token deploys, defer to Vercel's own `deploy-to-vercel` / `vercel-cli-with-tokens`.
- Never put tokens in command arguments; the CLI reads `VERCEL_TOKEN` from the environment.
