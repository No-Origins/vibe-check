---
name: deep-scout
description: Take a deep look at a project's structure and organization — folder layout, where components/utilities/hooks live, naming and colocation — and (with permission) reorganize it toward a clean, conventional Next.js layout using parallel sub-agents, then review the result. Use when the user says "deep-scout", "check my project structure", "review my folder layout", "is my project organized", "clean up my folders", or "reorganize my project".
metadata:
  author: vibe-check
  version: "0.2.0"
---

# Deep-Scout

A deeper reconnaissance than vibe-check. vibe-check only confirms a **valid router entry
exists**; deep-scout looks at **how the whole project is organized** and helps tidy it into
a clean, conventional layout — without breaking anything.

There is no single "correct" Next.js structure (App Router supports colocation), so
deep-scout is **advisory**: it maps what's there, compares it to convention *and* to the
project's own patterns, and proposes changes. It only moves files with your approval, and it
**never changes behavior** — only where files live and the imports that point at them.

The full flow: **scout → report → todo list (with reasons) → your approval → parallel
sub-agents do the work → a separate sub-agent reviews it.**

## The conventional layout it compares against
```
app/  (or src/app/)    routes, layouts, route handlers
components/            reusable UI components
lib/                  utilities, helpers, API clients
hooks/                custom React hooks       (optional)
types/                shared TypeScript types  (optional)
styles/               global styles            (optional)
public/               static assets
```

## Step 1 — Scout the structure
Run the mapper from the repo root (read-only):
```bash
node ~/.claude/skills/deep-scout/scripts/map-structure.mjs
```
(Path varies by install location.) It prints JSON: the router type, whether `src/` is used,
which conventional folders exist, where source files live, a directory tree, and heuristic
flags. Status goes to stderr.

## Step 2 — Assess
Read the map and judge it against (a) the conventional layout above and (b) the project's
own existing patterns — don't impose a layout the project clearly isn't using. Look for:
- Reusable components/utilities mixed into route files with no `components/` or `lib/`.
- Source files loose at the repo root.
- Inconsistent naming or very deep nesting.
- No clear home for shared code.

Colocating a component next to the route that uses it is **fine** — don't flag it.

## Step 3 — Write the report and build the todo list
Create `.vibe-check/reports/<YYYY-MM-DD>-structure.md` (create `.vibe-check/` if needed)
containing:
- the current layout (tree),
- what's working and what could improve,
- the **proposed target layout**, and
- a **todo list of changes**, each written as `from → to` (or the change) **with a one-line
  reason** ("why this helps").

If the project is already clean, say so and stop — don't invent work.

## Step 4 — Show the todo list and ask
Show the user the todo list in plain language — **each item with its short reason** — then
ask:
> Here are the structure changes I'd make, and why. Want me to go ahead? I'll move files
> and fix all the imports so nothing breaks.

Do nothing until they approve.

## Step 5 — Execute the todos with parallel sub-agents (only if approved)
1. **Be on a feature branch, not `main`.** If on `main`, run new-vibe (or
   `git checkout -b chore/tidy-structure`) first.
2. **Split the todos into independent batches** so that **no two batches touch the same
   files.** A good split is one batch per destination folder (e.g. one batch → `lib/`, one
   → `components/`, one → `hooks/`).
3. **Spawn one sub-agent per batch, in parallel.** Give each sub-agent: its batch of moves,
   the target layout, the `@/` path alias to prefer, and these rules:
   - move files with `git mv` (preserves history),
   - fix **every** import that referenced the moved files,
   - create destination folders as needed,
   - **only touch files in its own batch** — never edit a file another batch owns.

   Each sub-agent returns the files it moved and the imports it fixed.
4. After all sub-agents finish, handle any **shared** change yourself, serially — e.g. a
   `tsconfig.json` path alias or a root barrel/`index.ts`.
5. Tick each completed todo off in the report.

(If your environment can't spawn sub-agents, do the batches yourself, one at a time.)

## Step 6 — Review with a separate sub-agent
Spawn a **fresh review sub-agent** (not one of the workers) to check the result:
- run `npm run typecheck` (or `npx tsc --noEmit`) and `npm run build`,
- inspect `git status` and `git diff`,
- confirm: the new structure matches the proposed target, no import is broken, and **only
  file locations and import paths changed** (no behavior change).

It returns a verdict plus any problems. If it finds problems, fix them (or spawn a sub-agent
to) and review again. **Finish only when typecheck and build pass and the reviewer
approves.** Append the verdict to the report.

## Step 7 — Tell the user
Plain language:
> Reorganized into a cleaner layout — moved <n> files across <k> batches, fixed the imports,
> and a review pass confirmed the build still passes.

## Notes
- Deep-Scout does not gate deployment; it's a tidy-up tool, separate from vibe-check's
  mandatory requirements.
- It never changes behavior — only where files live and the imports that point at them.
- Already clean? Say so and skip the reorg — don't invent work.
