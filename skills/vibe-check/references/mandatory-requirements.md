# Mandatory requirements — checklist + fixes

The canonical list vibe-check scouts for. Each item: **what**, **how it's detected**, and
**the fix** that satisfies it. Source of truth for the gate; mirrors
`docs/01-research-and-requirements.md`. Scout IDs match `scripts/scout.mjs`.

## Next.js (`section: nextjs`)

| id | Requirement | Fix if missing |
|---|---|---|
| `nextjs-scripts` | `package.json` has `dev`, `build`, `start`, `lint` | Add the missing scripts (`next dev` / `next build` / `next start` / `next lint`). |
| `typecheck-script` | `typecheck` script (`tsc --noEmit`) | Add `"typecheck": "tsc --noEmit"`. |
| `single-lockfile` | Exactly one committed lockfile | Keep the one for the chosen package manager; delete the others; commit it. |
| `next-config` | A `next.config.*` file | Create a minimal `next.config.ts` exporting `{}`. |
| `node-version` | Pinned Node version | Add `"engines": { "node": ">=20" }` and/or a `.nvmrc`, on a Vercel-supported runtime. |
| `app-structure` | App Router (`app/layout` + `app/page`) or Pages Router | Create `app/layout.tsx` + `app/page.tsx` if neither router exists. |
| `gitignore` | `.gitignore` covers `node_modules/`, `.next/`, `.env*`, `.vercel/` | Add the missing entries (keep `!.env.example`). |
| `env-example` | `.env.example` (keys, no values) | Create it listing every env var name the app reads, with empty/placeholder values. |
| `readme` | `README.md` with install/run steps | Create one: what the app is, `install`, `dev`, `build`. |
| `ts-strict` | TypeScript with `strict: true` | Add `tsconfig.json` with `"strict": true` (and migrate `.js` as needed). |
| `eslint` | ESLint configured | Run `next lint` to scaffold, or add `eslint.config.mjs`. |
| `prettier` | Prettier configured | Add `.prettierrc` and a `format` script. |
| `env-validation` | Runtime env-var validation | Add `zod` or `@t3-oss/env-nextjs`; validate env at startup so a missing key fails the build. |
| `route-safety` | `error.tsx`, `not-found.tsx`, `loading.tsx`, `global-error.tsx` | Add the missing files under the app root (`global-error.tsx` is the root error boundary). |
| `next-image` | `next/image` for all images | Replace raw `<img>` with `next/image`. |

## Git (`section: git`)

| id | Requirement | Fix if missing |
|---|---|---|
| `git-repo` | Is a git repository | `git init`. |
| `git-remote` | GitHub `origin` remote | Create a GitHub repo (`gh repo create`) and add it as `origin`. |
| `default-branch` | `main` is the production branch | Rename/ set the default branch to `main`. |
| `no-tracked-secrets` | No committed `.env`/secret files | `git rm --cached` the file, add to `.gitignore`, **rotate the secret**, move it to Vercel env vars. |
| `conventional-commits` | Conventional Commits (`feat:`/`fix:`/`chore:`) | Author future commits with the convention; the agent writes the messages. |
| `pr-template` | PR template | Add `.github/pull_request_template.md`. |
| `codeowners` | CODEOWNERS | Add `.github/CODEOWNERS` (the founder can be the sole owner). |
| `pre-commit` | Pre-commit hooks (Husky + lint-staged) | `npx husky init`; add `lint-staged` running lint + `tsc --noEmit` on staged files. |

## Vercel (`section: vercel`)

| id | Requirement | Fix if missing |
|---|---|---|
| `vercel-link` | Project linked to the GitHub repo via Git integration | `vercel link --repo` (or connect the repo in the Vercel dashboard). |
| `prod-branch` | Production branch = `main` | Set the production branch to `main` in project settings. |
| `env-vars` | Env vars set per environment (Dev/Preview/Prod) | Add each secret with `vercel env add` for the right environments; never commit them. |
| `framework-preset` | Framework preset = Next.js | Set in project settings (usually auto-detected). |
| `preview-deploys` | Preview deployments enabled | On by default; confirm it's not disabled. |
| `failed-build-blocks` | Failed build blocks production | Ensure `next.config` does **not** set `eslint.ignoreDuringBuilds` or `typescript.ignoreBuildErrors`. |

## Tooling & access

The scout reports tool **presence**; the agent confirms **auth + access** live during
scouting (these need authenticated/network calls).

| id | Requirement | Fix if missing |
|---|---|---|
| `tool-git` | git installed | Install git. |
| `tool-gh` | GitHub CLI (`gh`) installed | Install `gh` (e.g. `brew install gh`). Needed for PRs and GitHub auth. |
| `tool-vercel` | Vercel CLI installed **or** a Vercel MCP connected | `npm i -g vercel`, or enable the Vercel MCP — only one is needed. |
| `tool-node` | Node.js installed (20+) | Install a Vercel-supported Node version. |
| `tool-pkg-manager` | Package manager matching the lockfile installed | Install npm / pnpm / yarn to match the committed lockfile. |
| `gh-auth` | GitHub logged in | `gh auth login`. |
| `vercel-access` | Vercel reachable (CLI authed, or MCP) | `vercel login`, or use the connected Vercel MCP. |
| `vercel-env-parity` | Every `.env.example` key exists in Vercel (production + preview) | `vercel env add <KEY> production` / `... preview`. Never commit the value. |

## Notes
- `unknown` from the scout means "couldn't determine statically" — the agent verifies via
  the Vercel/GitHub CLI or by asking the user one short question.
- Tests are not a mandatory repo file, but folding them into the build command
  (`"build": "vitest run && next build"`) turns Vercel's free build gate into a test gate.
