---
name: new-vibe
description: Start a new piece of work — a feature, a fix, or any new request — safely on its own git branch. Use when the user says "new-vibe", "start a new feature", "work on something new", "fix a bug", "let's build X", "start working on Y", or otherwise kicks off a fresh change.
metadata:
  author: vibe-check
  version: "0.1.0"
---

# New-Vibe

Kick off new work on its own branch, so `main` always stays deployable. Every feature or
fix gets a fresh branch — the agent never works directly on `main`.

## Golden rules
- **Never start new work on `main`.** New or unrelated work always gets its own branch.
- **Never throw away uncommitted work.** If the working tree is dirty and you need to
  switch branches, stop and ask the user first.
- **Branch off the latest `main`** so new work starts from current production.
- **Speak plainly.** One or two sentences; the user is not a developer.

## Step 1 — Understand the request
Restate what the user wants in one line, and classify it. The kind of work sets both the
branch prefix and the eventual commit type (Conventional Commits):

| Kind of work | Prefix |
|---|---|
| New capability | `feat/` |
| Bug fix | `fix/` |
| Cleanup, deps, config, tooling | `chore/` |
| Docs only | `docs/` |
| Restructure, no behavior change | `refactor/` |

Choose a short kebab-case summary → `<prefix><summary>`, e.g. `feat/dark-mode`,
`fix/login-redirect`. If the request is vague, ask **one** short question to pin down the
goal before branching.

## Step 2 — Check git state and whether a new branch is needed
```bash
git rev-parse --is-inside-work-tree 2>/dev/null   # in a repo?
git branch --show-current                          # current branch
git status --porcelain                             # uncommitted changes?
```

Decide:
- **Not a git repo** → stop and tell the user: "This folder isn't a git repository yet — run
  vibe-check first to set up git and GitHub." Then stop.
- **On `main` (or `master`/production)** → a new branch **is** required. Continue.
- **Already on a feature branch:**
  - If this request **continues that branch's work** → no new branch. Tell the user you'll
    keep working on the current branch, and stop here.
  - If it's **different/unrelated** work → a new branch is required. Continue.

**If `git status --porcelain` shows uncommitted changes** and you need to switch, stop and ask:
> You have unsaved changes on `<branch>`. Want me to commit them here first, or set them
> aside (stash) before starting the new branch?

Handle their choice before switching.

## Step 3 — Tell the user, then check out the new branch
Tell the user what's about to happen (once the tree is clean, no need to ask again):
> Starting `<feature description>`. I'm checking out a new branch `<prefix><summary>` off
> the latest `main`.

Then create it from up-to-date `main`:
```bash
git checkout main
git pull --ff-only          # best effort; if it fails, say so and continue from local main
git checkout -b <prefix><summary>
```
If the production branch isn't `main` (e.g. `master`), use that branch instead and mention it.

## Step 4 — Confirm and hand off
> You're now on `<prefix><summary>`, branched from `main`. Tell me what to build, or go
> ahead and make your changes.

## Notes
- If there is **no `.vibe-check/memory.md`**, mention once: "This repo hasn't been
  vibe-checked yet — consider running vibe-check first." Don't block; the user may proceed.
- New-Vibe only starts the branch. Committing, opening a PR, reviewing, and deploying are
  separate skills.
