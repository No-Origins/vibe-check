<div align="center">

# 🌀 vibe-check

### Ship Next.js apps to Vercel — without being a developer.

A library of AI agent skills that **set up, build, deploy, and rescue** your project for you.
You talk in plain language; the right skill quietly does the safe thing.

![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?logo=vercel&logoColor=white)
![Agent Skills](https://img.shields.io/badge/Agent%20Skills-standard-7c3aed)

</div>

---

## 🤔 What is this?

You vibe-code — you describe what you want and the AI writes it. But the *scary* parts aren't
the code: it's git, deployments, environment variables, and the moment production breaks.

**vibe-check handles those parts for you.** Say something in plain English and the matching
skill takes over, with guardrails so you can't accidentally break things:

> 🗣️ *"Is my project ready?"* → it checks everything and fixes what's missing
> 🗣️ *"Start a new feature"* → it sets up a safe place to work
> 🗣️ *"Ship it"* → it tests, previews, and deploys — only going live when you say so
> 🗣️ *"Production is broken!"* → it instantly rolls back to the last working version

Built on the open [Agent Skills](https://agentskills.io/) standard, so it works in Claude
Code, Cursor, and other agents that read `SKILL.md` skills.

---

## 🧰 The skills

| | Skill | Just say… | What it does |
|---|---|---|---|
| 🩺 | **vibe-check** | *"check my repo"* | Audits your repo against every requirement to deploy safely (git, Vercel, tooling, env vars), then fixes what's missing — only after showing you a plain-English to-do list and asking. |
| 🌱 | **new-vibe** | *"start a new feature"* | Begins new work on its own branch so your live site stays safe. You never touch git. |
| 🔭 | **deep-scout** | *"tidy my project"* | Looks at how your project is organized and, with your OK, reorganizes it into a clean layout — moving files and fixing imports so nothing breaks. |
| 🚀 | **safe-deploy** | *"ship it"* | Runs all the checks, opens a preview you can look at, and pushes to production **only when you approve**. |
| ⏪ | **rollback** | *"production is broken"* | Instantly reverts your live site to the last working version, then helps fix the code so the problem can't return. |

---

## 🔄 How it flows

```
   vibe-check  ──►  new-vibe  ──►  ( you build · deep-scout )  ──►  safe-deploy  ──►  rollback
   ───────────      ────────       ──────────────────────────      ───────────      ────────
   set the repo     start work      write code · tidy structure      ship safely     undo a bad
   up to standard   on a branch                                      (preview→prod)   deploy, fast
```

Each step is safe on its own, and they hand off to each other — so the whole journey from
*"empty repo"* to *"live on Vercel"* (and back, if needed) is covered.

---

## 🚀 Quick start

**1. Install the skills** (for Claude Code):

```bash
git clone https://github.com/No-Origins/vibe-check.git
cp -r vibe-check/skills/* ~/.claude/skills/
```

**2. Open your Next.js project and just say:**

```
run vibe-check
```

It will ask before scouting, show you what's missing, ask before fixing, and finish by
telling you which skills you can use next. That's it.

---

## 🛡️ What keeps you safe

Every skill follows the same house rules:

- **Two approval gates.** Nothing important happens without showing you a plain-English
  summary and asking first.
- **Preview first.** You always see a live preview before anything reaches production.
- **Never works on `main`.** All work happens on its own branch and merges through a review.
- **Secrets stay out of your code.** They live in Vercel, never in the repo.
- **Plain language.** No jargon, no walls of terminal output — just what happened and what's next.

---

## 🧩 Under the hood

- **Format:** the open [Agent Skills](https://agentskills.io/) standard — each skill is a
  `SKILL.md` with optional helper scripts and references.
- **Smart checks:** `vibe-check` and `deep-scout` run small Node scripts that scan your repo
  and return facts; the agent decides what to do with them.
- **The deploy gate uses Vercel, not paid CI:** your code is tested locally and on Vercel's
  free build — no GitHub Actions setup required. (See [`docs/`](docs/) for why.)

```
vibe-check/
├── docs/                     # design rationale, requirements, workflow decisions
├── skills/
│   ├── vibe-check/           # the setup & audit gate (scout.mjs, checklist, templates)
│   ├── new-vibe/             # start work on a branch
│   ├── deep-scout/           # structure analysis + reorg (map-structure.mjs)
│   ├── safe-deploy/          # test → preview → review → production (on approval)
│   └── rollback/             # instant Vercel rollback + code reconcile
├── LICENSE
└── README.md
```

---

## ➕ Adding a skill

The roster lives in
[`skills/vibe-check/references/skills-catalog.md`](skills/vibe-check/references/skills-catalog.md).
Add a new skill folder, then append **one line** to that catalog — `vibe-check` reads it and
automatically tells users about the new skill.

---

## 📄 License

[MIT](LICENSE) © No-Origins
