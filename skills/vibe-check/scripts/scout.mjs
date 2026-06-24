#!/usr/bin/env node
// vibe-check scout — scans the current directory (the target repo) for the mandatory
// requirements that can be detected statically. JSON → stdout, status → stderr.
// Vercel-side and behavioral checks are emitted as "unknown" for the agent to resolve.
import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];
const log = (m) => process.stderr.write(m + '\n');

const add = (section, id, title, status, detail) =>
  checks.push({ section, id, title, status, detail });
const has = (p) => existsSync(join(root, p));
const read = (p) => { try { return readFileSync(join(root, p), 'utf8'); } catch { return null; } };
const readJSON = (p) => { const t = read(p); if (!t) return null; try { return JSON.parse(t); } catch { return null; } };
const firstExisting = (list) => list.find(has) || null;
const git = (args) => {
  try { return execSync(`git ${args}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { return null; }
};
const cmdExists = (bin) => {
  try { execSync(`${bin} --version`, { stdio: 'ignore' }); return true; }
  catch { return false; }
};

log(`vibe-check: scouting ${root}`);

/* ----------------------------- Next.js ----------------------------- */
const pkg = readJSON('package.json');
if (!pkg) {
  add('nextjs', 'package-json', 'package.json present', 'fail', 'No package.json — is this the project root?');
} else {
  const scripts = pkg.scripts || {};
  const missing = ['dev', 'build', 'start', 'lint'].filter((s) => !scripts[s]);
  add('nextjs', 'nextjs-scripts', 'package.json scripts (dev/build/start/lint)',
    missing.length ? 'fail' : 'pass', missing.length ? `Missing: ${missing.join(', ')}` : 'all present');
  add('nextjs', 'typecheck-script', 'typecheck script (tsc --noEmit)',
    scripts.typecheck ? 'pass' : 'fail', scripts.typecheck || 'no "typecheck" script');
}

const locks = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'].filter(has);
add('nextjs', 'single-lockfile', 'exactly one committed lockfile',
  locks.length === 1 ? 'pass' : 'fail',
  locks.length === 0 ? 'no lockfile' : locks.length === 1 ? locks[0] : `multiple: ${locks.join(', ')}`);

const nextCfg = firstExisting(['next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs']);
add('nextjs', 'next-config', 'Next.js config file', nextCfg ? 'pass' : 'fail', nextCfg || 'no next.config.*');

const engines = pkg?.engines?.node;
add('nextjs', 'node-version', 'pinned Node version (engines or .nvmrc)',
  engines || has('.nvmrc') ? 'pass' : 'fail',
  engines ? `engines.node = ${engines}` : has('.nvmrc') ? '.nvmrc present' : 'no engines.node or .nvmrc');

const srcApp = has('src/app/layout.tsx') || has('src/app/layout.jsx');
const base = srcApp ? 'src/app' : 'app';
const appLayout = firstExisting([`${base}/layout.tsx`, `${base}/layout.jsx`, `${base}/layout.ts`, `${base}/layout.js`]);
const appPage = firstExisting([`${base}/page.tsx`, `${base}/page.jsx`, `${base}/page.ts`, `${base}/page.js`]);
const pagesDir = has('pages') || has('src/pages');
add('nextjs', 'app-structure', 'valid app structure (App or Pages Router)',
  (appLayout && appPage) || pagesDir ? 'pass' : 'fail',
  appLayout && appPage ? 'App Router (layout + page)' : pagesDir ? 'Pages Router' : 'no app/ or pages/');

const gi = read('.gitignore') || '';
const giLines = gi.split('\n').map((l) => l.trim().replace(/^\//, ''));
const giMissing = ['node_modules', '.next', '.env', '.vercel'].filter((e) => !giLines.some((l) => l.startsWith(e)));
add('nextjs', 'gitignore', '.gitignore covers node_modules/.next/.env/.vercel',
  has('.gitignore') && !giMissing.length ? 'pass' : 'fail',
  !has('.gitignore') ? 'no .gitignore' : giMissing.length ? `missing: ${giMissing.join(', ')}` : 'all present');

add('nextjs', 'env-example', '.env.example present (keys, no values)',
  has('.env.example') ? 'pass' : 'unknown',
  has('.env.example') ? 'present' : 'no .env.example — add one if the app uses env vars');

add('nextjs', 'readme', 'README.md present', has('README.md') ? 'pass' : 'fail', has('README.md') ? 'present' : 'missing');

const tsconfig = readJSON('tsconfig.json');
add('nextjs', 'ts-strict', 'TypeScript strict mode',
  !tsconfig ? 'fail' : tsconfig.compilerOptions?.strict === true ? 'pass' : 'fail',
  !tsconfig ? 'no tsconfig.json (TypeScript required)' : tsconfig.compilerOptions?.strict === true ? 'strict: true' : 'strict not enabled');

const eslintCfg = firstExisting(['.eslintrc', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.json', '.eslintrc.yml', 'eslint.config.js', 'eslint.config.mjs', 'eslint.config.ts']) || (pkg?.eslintConfig ? 'package.json#eslintConfig' : null);
const prettierCfg = firstExisting(['.prettierrc', '.prettierrc.js', '.prettierrc.json', '.prettierrc.cjs', '.prettierrc.yml', 'prettier.config.js', 'prettier.config.mjs']) || (pkg?.prettier ? 'package.json#prettier' : null);
add('nextjs', 'eslint', 'ESLint configured', eslintCfg ? 'pass' : 'fail', eslintCfg || 'no ESLint config');
add('nextjs', 'prettier', 'Prettier configured', prettierCfg ? 'pass' : 'fail', prettierCfg || 'no Prettier config');

const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
const envVal = deps['@t3-oss/env-nextjs'] ? '@t3-oss/env-nextjs' : deps['zod'] ? 'zod' : null;
add('nextjs', 'env-validation', 'runtime env-var validation',
  envVal ? 'pass' : 'unknown', envVal ? `found ${envVal}` : 'no zod / @t3-oss/env-nextjs — verify env validation exists');

if (appLayout) {
  const safety = {
    'error.tsx': firstExisting([`${base}/error.tsx`, `${base}/error.jsx`]),
    'not-found.tsx': firstExisting([`${base}/not-found.tsx`, `${base}/not-found.jsx`]),
    'loading.tsx': firstExisting([`${base}/loading.tsx`, `${base}/loading.jsx`]),
    'global-error.tsx': firstExisting([`${base}/global-error.tsx`, `${base}/global-error.jsx`]),
  };
  const miss = Object.entries(safety).filter(([, v]) => !v).map(([k]) => k);
  add('nextjs', 'route-safety', 'route safety files (error/not-found/loading/global-error)',
    miss.length ? 'fail' : 'pass', miss.length ? `missing: ${miss.join(', ')}` : 'all present');
} else {
  add('nextjs', 'route-safety', 'route safety files', 'unknown', 'App Router not detected — check manually');
}

add('nextjs', 'next-image', 'next/image for all images', 'unknown', 'verify images use next/image and there are no raw <img> tags');

/* ------------------------------- Git ------------------------------- */
if (git('rev-parse --is-inside-work-tree') !== 'true') {
  add('git', 'git-repo', 'git repository', 'fail', 'not a git repository');
} else {
  const origin = git('remote get-url origin');
  add('git', 'git-remote', 'GitHub origin remote', origin ? 'pass' : 'fail', origin || 'no origin remote');
  const branch = git('branch --show-current');
  add('git', 'default-branch', 'main is the production branch',
    branch === 'main' ? 'pass' : 'unknown', branch ? `current branch: ${branch}` : 'could not detect branch');
  const tracked = (git('ls-files') || '').split('\n');
  const secretFiles = tracked.filter((f) => /(^|\/)\.env($|\.)/.test(f) && !f.endsWith('.example'));
  add('git', 'no-tracked-secrets', 'no committed .env/secret files',
    secretFiles.length ? 'fail' : 'pass', secretFiles.length ? `tracked: ${secretFiles.join(', ')}` : 'none tracked');
  const msgs = (git('log --pretty=%s -n 10') || '').split('\n').filter(Boolean);
  const cc = msgs.filter((m) => /^(feat|fix|chore|docs|refactor|test|build|ci|perf|style|revert)(\(.+\))?!?:/.test(m));
  add('git', 'conventional-commits', 'Conventional Commits',
    !msgs.length ? 'unknown' : cc.length >= Math.ceil(msgs.length / 2) ? 'pass' : 'fail',
    msgs.length ? `${cc.length}/${msgs.length} recent commits follow the convention` : 'no commits yet');
}

add('git', 'pr-template', 'PR template',
  firstExisting(['.github/pull_request_template.md', '.github/PULL_REQUEST_TEMPLATE.md', 'docs/pull_request_template.md']) ? 'pass' : 'fail', 'looked in .github/');
add('git', 'codeowners', 'CODEOWNERS',
  firstExisting(['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']) ? 'pass' : 'fail', 'looked in .github/ and root');
const husky = has('.husky');
const lintStaged = pkg?.['lint-staged'] || firstExisting(['.lintstagedrc', '.lintstagedrc.json', '.lintstagedrc.js', 'lint-staged.config.js']);
add('git', 'pre-commit', 'pre-commit hooks (Husky + lint-staged)',
  husky && lintStaged ? 'pass' : 'fail', `${husky ? '.husky present' : 'no .husky'}; ${lintStaged ? 'lint-staged configured' : 'no lint-staged'}`);

/* ------------------------------ Vercel ----------------------------- */
add('vercel', 'vercel-link', 'project linked to Vercel (git integration)',
  has('.vercel/project.json') || has('.vercel/repo.json') ? 'pass' : 'fail',
  has('.vercel') ? '.vercel/ link present' : 'not linked — run vercel link');
add('vercel', 'prod-branch', 'production branch = main', 'unknown', 'verify in Vercel (CLI/dashboard)');
add('vercel', 'env-vars', 'env vars set per environment in Vercel', 'unknown', 'verify with `vercel env ls` (needs auth)');
add('vercel', 'framework-preset', 'framework preset = Next.js', 'unknown', 'verify in Vercel project settings');
add('vercel', 'preview-deploys', 'preview deployments enabled', 'unknown', 'default on; verify in Vercel');
add('vercel', 'failed-build-blocks', 'failed build blocks production', 'unknown', 'confirm no ignored build/type errors');

/* ----------------------------- Tooling ----------------------------- */
// Presence only. Auth (gh auth status, vercel whoami) and env-var parity are checked live
// by the agent — see SKILL.md — since they need authenticated/network calls.
const gitOk = cmdExists('git'), ghOk = cmdExists('gh'), vercelOk = cmdExists('vercel');
const pm = locks.includes('pnpm-lock.yaml') ? 'pnpm' : locks.includes('yarn.lock') ? 'yarn' : 'npm';
const pmOk = cmdExists(pm);
add('tooling', 'tool-git', 'git installed', gitOk ? 'pass' : 'fail', gitOk ? 'present' : 'git not found on PATH');
add('tooling', 'tool-gh', 'GitHub CLI (gh) installed', ghOk ? 'pass' : 'fail', ghOk ? 'present' : 'gh not found — needed for PRs and GitHub auth');
add('tooling', 'tool-vercel', 'Vercel CLI installed (or Vercel MCP)', vercelOk ? 'pass' : 'unknown', vercelOk ? 'present' : 'vercel CLI not found — install it, or use the Vercel MCP if connected');
add('tooling', 'tool-node', 'Node.js installed', 'pass', process.version);
add('tooling', 'tool-pkg-manager', `package manager (${pm}) installed`, pmOk ? 'pass' : 'fail', pmOk ? `${pm} present` : `${pm} not found (matches lockfile)`);

/* ----------------------------- output ------------------------------ */
const summary = checks.reduce((a, c) => ((a[c.status] = (a[c.status] || 0) + 1), a), { pass: 0, fail: 0, unknown: 0 });
process.stdout.write(JSON.stringify({ tool: 'vibe-check', root, summary, checks }, null, 2) + '\n');
log(`vibe-check: ${summary.pass} pass, ${summary.fail} fail, ${summary.unknown} unknown`);
