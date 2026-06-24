---
name: rollback
description: Production is broken — instantly revert Vercel to the last working deployment, then reconcile the code so the bug doesn't come back. Use when the user says "rollback", "revert the deploy", "production is broken", "the site is down", "undo the last deploy", or "go back to the previous version".
metadata:
  author: vibe-check
  version: "0.1.0"
---

# Rollback

Production is broken — get it back to the last working version **fast**, then make the code
match so it stays fixed. Vercel's Instant Rollback re-points the production domain at an
existing good deployment (no rebuild), so it's near-instant.

## Golden rules
- **Restore service first, debug later.** Speed matters; the user may be stressed.
- **Confirm the target** deployment before promoting it — don't roll back blindly.
- **A rollback isn't the end.** It pauses production auto-deploys and leaves `main` unchanged;
  you must reconcile the code and then resume.
- **Speak plainly.**

## Step 1 — Confirm intent
One line: confirm production is broken and they want to go back to the previous working
version.

## Step 2 — Pick the deployment to roll back to
```bash
vercel ls                 # recent deployments (production ones are labeled), newest first
vercel rollback status    # current rollback state, if any
```
The immediately previous production deployment is the usual target — show the user when it
deployed and confirm it's the one.
- **Hobby plan:** you can only roll back to the **immediately previous** production deployment.
- **Pro/Enterprise:** you can target any previous deployment by its URL.
- **No CLI?** Use the Vercel MCP if connected, or guide them through the dashboard:
  Project → Deployments → the last good one → ⋯ → **Instant Rollback**.

## Step 3 — Roll back (restore service)
```bash
vercel rollback                  # → immediately previous production deployment
# or, on Pro/Enterprise, a specific one:
vercel rollback <deployment-url>
```
Confirm it took effect, then report:
```bash
vercel rollback status
```
Tell the user, plainly:
> Production is back on the previous working version — the site should be up again. Heads-up:
> Vercel has paused production auto-deploys until we promote a fix, so the broken version
> won't come back on its own.

## Step 4 — Reconcile the code (so the fix sticks)
The live site is good again, but `main` still has the broken change. Make the code match:
1. Identify the change that broke production (the commit/PR).
2. Start a branch — run **new-vibe** (or `git checkout -b fix/rollback-<desc>`).
3. Undo it: `git revert <bad-commit>` (for a squashed PR, revert that merge commit). Or, if
   you'd rather fix forward, patch the bug instead.
4. Ship the fix with **safe-deploy** (gate → PR → preview → review → merge).

## Step 5 — Resume normal deploys
Because the rollback paused auto-assignment, promote the fixed deployment to re-point
production and turn auto-deploys back on:
```bash
vercel promote <new-good-deployment-url>
```
Confirm production is serving the fix and auto-deploys are restored.

## Step 6 — Tell the user
> Restored production, reverted the bad change, shipped the fix, and re-enabled auto-deploys.

Optionally append a line to `.vibe-check/memory.md` History. Offer to investigate the root
cause of the original break.

## Notes
- Instant Rollback re-points the production domain at an existing build (no rebuild) — that's
  why it's near-instant.
- Rollback only affects **production**; preview deployments are untouched.
- Never put tokens in command arguments; the CLI reads `VERCEL_TOKEN` from the environment.
