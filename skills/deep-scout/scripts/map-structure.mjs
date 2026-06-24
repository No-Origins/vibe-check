#!/usr/bin/env node
// deep-scout — maps a project's structure and organization. JSON → stdout, status → stderr.
// Reports facts (where files live, which conventional folders exist, a tree); leaves
// judgment about what to reorganize to the agent.
import { existsSync, readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const root = process.cwd();
const IGNORE = new Set(['node_modules', '.next', '.git', '.vercel', 'dist', 'build', 'out', 'coverage', '.turbo', '.cache', '.idea', '.vscode']);
const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const log = (m) => process.stderr.write(m + '\n');
const has = (p) => existsSync(join(root, p));

log(`deep-scout: mapping ${root}`);

const usesSrc = has('src');
const router = has('app') || has('src/app') ? 'app' : has('pages') || has('src/pages') ? 'pages' : 'unknown';

const conventionalDirs = {};
for (const d of ['app', 'pages', 'components', 'lib', 'utils', 'hooks', 'types', 'styles', 'public', 'context', 'features', 'server', 'tests', '__tests__']) {
  conventionalDirs[d] = has(d) || has(join('src', d));
}

let total = 0;
const byTopDir = {};
const byExt = {};
const rootSourceFiles = [];
const treeLines = [];
const MAX_TREE = 120;

const topDirOf = (rel) => {
  const parts = rel.replace(/^src\//, '').split('/');
  return parts.length > 1 ? parts[0] : '(root)';
};

function walk(dir, depth) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
  entries.sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    if (e.name.startsWith('.') && e.name !== '.github') continue;
    const abs = join(dir, e.name);
    const rel = relative(root, abs);
    if (e.isDirectory()) {
      if (depth <= 2 && treeLines.length < MAX_TREE) treeLines.push('  '.repeat(depth) + e.name + '/');
      walk(abs, depth + 1);
    } else if (SRC_EXT.has(extname(e.name))) {
      total++;
      const ext = extname(e.name);
      byExt[ext] = (byExt[ext] || 0) + 1;
      const td = topDirOf(rel);
      byTopDir[td] = (byTopDir[td] || 0) + 1;
      if (td === '(root)') rootSourceFiles.push(rel);
    }
  }
}
walk(root, 0);

const flags = [];
if (router === 'unknown') flags.push('No app/ or pages/ router directory found.');
if (!conventionalDirs.components && !conventionalDirs.lib && total > 10)
  flags.push('No components/ or lib/ folder, yet many source files — reusable code may be mixed into routes.');
if (rootSourceFiles.length > 3)
  flags.push(`${rootSourceFiles.length} source files sit at the repo root — consider moving them into app/, lib/, or components/.`);
if (!conventionalDirs.public && router !== 'unknown')
  flags.push('No public/ folder for static assets.');

const out = {
  tool: 'deep-scout',
  root,
  router,
  usesSrc,
  conventionalDirs,
  sourceFiles: { total, byTopDir, byExt },
  rootSourceFiles: rootSourceFiles.slice(0, 20),
  tree: treeLines.join('\n'),
  flags,
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
log(`deep-scout: ${total} source files, router=${router}, ${flags.length} flag(s)`);
