# Agent Skills — vibe-check

Agent skills that let a **non-developer who vibe-codes** maintain, deploy, and manage
Next.js projects on Vercel — safely. Built on the [Agent Skills](https://agentskills.io/)
standard (the `SKILL.md` format read by Claude Code, Cursor, and others).

See [`docs/`](docs/) for the design rationale, the mandatory requirements, and the workflow
options behind these skills.

## Skills

The maintained roster is [`skills/vibe-check/references/skills-catalog.md`](skills/vibe-check/references/skills-catalog.md)
— vibe-check reads it and lists every skill at the end of onboarding. **When you add a
skill, append one line to that catalog.**

### vibe-check
Audits a Next.js repo against the mandatory requirements, fixes what's missing (with your
permission), and remembers the setup per repository. It keeps a **memory doc**
(`.vibe-check/memory.md`) and **report docs** (`.vibe-check/reports/`) inside each repo it
runs in.

→ [`skills/vibe-check/SKILL.md`](skills/vibe-check/SKILL.md)

**First run, in plain terms:** it asks to scout your repo → checks every mandatory
requirement → shows you a short todo list of what's missing → asks before fixing → fixes
everything → records "All the mandatory requirements satisfied" in memory, then lists the
skills you can use next.

### new-vibe
Starts a new piece of work — a feature, fix, or any request — safely on its own git branch,
so `main` stays deployable. It understands the request, checks whether a new branch is
needed, tells you the branch it's creating, and checks out off the latest `main`.

→ [`skills/new-vibe/SKILL.md`](skills/new-vibe/SKILL.md)

### deep-scout
Goes deeper than vibe-check's mandatory router check: it maps the whole project's
organization, writes a report with a todo list (each change explained), and — once you
approve — reorganizes using **parallel sub-agents** (one per independent batch) before a
separate **review sub-agent** verifies the build still passes and only file locations
changed. Advisory only; it doesn't gate deployment.

→ [`skills/deep-scout/SKILL.md`](skills/deep-scout/SKILL.md)

### safe-deploy
Ships the current branch the safe way: runs the quality gate (lint/typecheck/test/build via
**parallel sub-agents**), commits, pushes, opens a PR that triggers a Vercel **preview**, has
a **review sub-agent** check the diff, then merges to production **only when you explicitly
approve** — followed by a post-deploy health check. Preview-first; never touches production
unasked.

→ [`skills/safe-deploy/SKILL.md`](skills/safe-deploy/SKILL.md)

### rollback
The safety net for when a production deploy goes wrong: instantly reverts Vercel to the last
working deployment (re-pointing the production domain, no rebuild), then walks you through
reconciling the code — revert the bad change, ship the fix via safe-deploy, and re-enable
auto-deploys — so the bug can't quietly come back.

→ [`skills/rollback/SKILL.md`](skills/rollback/SKILL.md)

## Install (Claude Code)

```bash
cp -r skills/vibe-check ~/.claude/skills/
```

Then, from any project, say **"run vibe-check"**.

## Layout

```
Agents-Skills/
  docs/                       # design docs (requirements, CI decision, workflows)
  skills/
    vibe-check/
      SKILL.md                # audit & fix a repo against the mandatory requirements
      references/             # checklist, skills catalog, memory/report templates
      scripts/scout.mjs       # static repo scanner → JSON
    new-vibe/
      SKILL.md                # start new work on its own branch
    deep-scout/
      SKILL.md                # deep project-structure analysis + reorg
      scripts/map-structure.mjs
    safe-deploy/
      SKILL.md                # gate → PR/preview → review → prod (on approval)
    rollback/
      SKILL.md                # instant Vercel rollback + code reconcile
  README.md
```
