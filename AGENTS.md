# AGENTS.md

Instructions for AI coding agents (Claude Code, Cursor, GitHub Copilot, Codex, Windsurf,
Gemini CLI, Cline, etc.) working with this repository.

## What this repo is

**vibe-check** is a library of [Agent Skills](https://agentskills.io/) that help a
**non-developer** maintain, deploy, and manage Next.js projects on Vercel — safely. Each
skill is a folder under `skills/` containing a `SKILL.md` (plus optional `scripts/` and
`references/`).

The skills:

| Skill | What it does |
|---|---|
| `vibe-check` | Set up & audit a repo so it's safe to deploy (git, Vercel, tooling, env vars) |
| `new-vibe` | Start new work on its own branch |
| `deep-scout` | Analyze & tidy the project's structure |
| `safe-deploy` | Test → preview → production (only on user approval) |
| `rollback` | Instantly revert a broken production deploy, then reconcile the code |

## How to install these skills for the user

When a user shares this repo and asks you to install or set up vibe-check:

### Option A — copy the skills into your skills directory (works everywhere)

1. Make sure the repo is available locally (clone it if needed):
   ```bash
   git clone https://github.com/No-Origins/vibe-check.git
   ```
2. Copy each folder in `skills/` into your agent's skills directory:
   - **Claude Code** → `~/.claude/skills/` (or `.claude/skills/` for a single project):
     ```bash
     mkdir -p ~/.claude/skills && cp -r vibe-check/skills/* ~/.claude/skills/
     ```
   - **Other agents** → wherever you load `SKILL.md`-format skills from. If you're not sure,
     ask the user or check your own documentation for the skills directory.
3. Confirm the five skills are now available.

### Option B — the skills CLI (if the user has it)

The [skills.sh](https://www.skills.sh/) CLI auto-detects the right location per agent:
```bash
npx skills add No-Origins/vibe-check
```

## After installing

Tell the user, in plain language, that vibe-check is installed and they can begin by saying:

> run vibe-check

`vibe-check` will ask before scouting their repo, show what's missing, ask before fixing,
and finish by listing the other skills they can use.

## Contributing to this repo

- Skills follow the [Agent Skills](https://agentskills.io/) standard:
  `skills/<name>/SKILL.md`, with optional `scripts/` and `references/`. Keep each `SKILL.md`
  focused and under ~500 lines; put detail in `references/`.
- The skill roster lives in `skills/vibe-check/references/skills-catalog.md`. **When you add
  a skill, append one line there** — `vibe-check` reads it to tell users what's available.
- Design rationale, requirements, and workflow decisions are in `docs/`.
