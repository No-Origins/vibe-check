---
name: vibe-check
description: Set up, audit, and maintain a Next.js + Vercel repository so a non-developer can ship safely. Use when the user says "vibe-check", "run vibe-check", "set up my repo", "check my project", "is my repo ready to deploy", or starts vibe-check in a repository for the first time.
metadata:
  author: vibe-check
  version: "0.3.0"
---

# Vibe-Check

Make a Next.js repository safe for a non-developer to maintain, deploy, and manage on
Vercel. Vibe-Check audits a repo against a fixed list of **mandatory requirements**, fixes
what is missing (with permission), and remembers the setup so future runs are fast.

Vibe-Check keeps two kinds of docs **inside the target repo**, under `.vibe-check/`:

- **Memory doc** — `.vibe-check/memory.md`. One per repository. Holds the vibe-check
  setup, the user's preferences, repo metadata, and the current status. Created on the
  first run, updated on every run.
- **Report docs** — `.vibe-check/reports/<YYYY-MM-DD>-scout.md`. One per audit. Records
  what was checked, what passed, what was missing, and the todo list generated from it.

Use [references/mandatory-requirements.md](references/mandatory-requirements.md) for the
exact checklist and the fix for each item. Use
[references/memory-template.md](references/memory-template.md) and
[references/report-template.md](references/report-template.md) when creating those docs.

## Golden rules

- **Two approval gates, every time:** ask before scouting, and again before fixing.
- **Never deploy to production unasked.** Preview-first.
- **Never put secrets in code or commit them.** Secrets live in Vercel env vars (or a
  gitignored `.env.local`); only key names go in `.env.example`.
- **Speak plainly.** The user is not a developer — say what and why in a sentence or two,
  never paste raw command output as the answer.

---

## Step 0 — Detect first run vs. returning

```bash
cat .vibe-check/memory.md 2>/dev/null
```

- **No memory doc** → first run. Go to Step 1.
- **Memory doc exists** → go to **Returning run** at the end of this file.

## Step 1 — Ask permission to scout

Ask the user, in these exact words:

> Should I start scouting the repository now?

Do nothing else until they approve. If they decline, stop and tell them they can run
vibe-check again whenever they're ready.

## Step 2 — Scout for mandatory requirements

Once approved, run the scout script. It scans the **current directory** as the project, so
run it from the repo root while pointing at the skill's installed location:

```bash
node ~/.claude/skills/vibe-check/scripts/scout.mjs
```

(The path varies by where the skill is installed.) The script prints JSON to stdout — each
requirement with a status of `pass`, `fail`, or `unknown`, plus details. It also reports
**tooling presence**: git, GitHub CLI (`gh`), Vercel CLI, Node, and the package manager.
Status messages go to stderr.

Then check what the script can't see on its own — **access and live Vercel settings**:

- **GitHub login.** Run `gh auth status`. If not logged in → todo: `gh auth login`. (Pushing,
  PRs, and branch settings all need this.)
- **Vercel access.** vibe-check needs one working path to Vercel — the CLI **or** a Vercel MCP:
  - If the Vercel CLI is installed, run `vercel whoami`. Not logged in → todo: `vercel login`.
  - If the CLI isn't installed, check whether a **Vercel MCP** is connected (Vercel MCP tools
    are available to you) and use that. Only treat the Vercel MCP as needed when there's no
    working CLI.
  - If neither works → todo: "set up Vercel access — install + log in the Vercel CLI, or
    enable the Vercel MCP."
- **Vercel env vars exist.** Once Vercel access works and the repo has a `.env.example`, list
  its keys and compare them to Vercel for each environment (`vercel env ls production`,
  `vercel env ls preview`). For every key missing in Vercel → todo: "add `<KEY>` to Vercel
  (production + preview)." **Never print the values.**
- **Git defaults.** `git remote get-url origin`; `git branch --show-current` (should be `main`).
- Anything still ambiguous → ask the user one short question instead of guessing.

Do **not** run `next build` while scouting (slow). Note it as "verified at deploy time."

## Step 3 — Write the report doc

Create `.vibe-check/reports/<YYYY-MM-DD>-scout.md` from
[references/report-template.md](references/report-template.md). List every requirement by
section (Next.js / Git / Vercel) with its status, and end with the **missing** items.

## Step 4 — Build and show the todo list

Turn every `fail` (and every resolvable `unknown`) into a todo. Use your task-tracking tool
if you have one, and also write the list into the report doc as a markdown checklist.

Show the user the todo list with a **very short brief** — what's missing and why it matters,
a line or two total, in plain language. Then ask, in these exact words:

> Want me to go ahead and fix these?

Do nothing else until they approve.

## Step 5 — Complete the todos

Once approved, work through every todo. For each one:

- Apply the fix from
  [references/mandatory-requirements.md](references/mandatory-requirements.md).
- Mark the todo done and tick it off in the report doc's checklist.
- Keep secrets out of git — Vercel env vars or a gitignored `.env.local`, with key-only
  entries added to `.env.example`.

Commit the `.vibe-check/` folder so the configuration travels with the repo.

## Step 6 — Update memory and show the skill roster

When every todo is done, write/refresh `.vibe-check/memory.md` from
[references/memory-template.md](references/memory-template.md), and set its status line to
exactly:

> All the mandatory requirements satisfied

Then send the user that line **plus the roster of skills available to them**. Read
[references/skills-catalog.md](references/skills-catalog.md) and append every skill as a
bullet `- **<name>** — <one-line description>`. Always pull the list from the catalog so it
stays current as new skills are added — never hard-code it here. For example:

> All the mandatory requirements satisfied — your repo is safe to deploy.
>
> Skills you can use from here:
> - **vibe-check** — audit a Next.js repo against the mandatory requirements, fix what's missing, and remember the setup
> - **<next-skill>** — <one-line description>

(Today the catalog holds only vibe-check itself; the list grows automatically as skills are added.)

---

## Returning run (memory doc already exists)

1. Read `.vibe-check/memory.md` for prior setup, preferences, and status.
2. Tell the user briefly what you remember ("Last vibe-check: all requirements satisfied on
   <date>.").
3. Re-run Steps 1–3 to catch drift. Only build a todo list (Step 4) if something regressed
   or a new requirement applies. Keep both approval gates.
4. Update memory and write a fresh report.

---

## Output style

Keep every message short and concrete. Prefer:

> Missing 3 things: a `lint` script, a `.gitignore` entry for `.env`, and a Vercel link.
> All three are quick. Want me to go ahead and fix these?

over long explanations or walls of CLI output.
