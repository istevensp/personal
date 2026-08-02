// Syncs the public istevensp/data-structures repo into external/data-structures
// (gitignored) so the content-layer collections in src/content/config.ts can
// glob it, then copies its files/ into public/teaching/data-structures/files/
// so downloads are served from this site's own origin.
//
// - Local dev/build: reuses the sibling ../data-structures repo if present
//   (both repos live side by side under Github/), falling back to a shallow
//   clone otherwise.
// - CI: a separate actions/checkout step already places the content at
//   external/data-structures before this script runs — it's left untouched.
import { existsSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, 'external', 'data-structures');
const siblingRepo = path.join(root, '..', 'data-structures');
const REMOTE = 'https://github.com/istevensp/data-structures.git';
const isCI = process.env.CI === 'true' || !!process.env.GITHUB_ACTIONS;

function log(message) {
  console.log(`[sync-data-structures] ${message}`);
}

if (isCI) {
  if (!existsSync(target)) {
    throw new Error(
      `${target} not found — the CI workflow must check out istevensp/data-structures there before running the build.`
    );
  }
  log('Running in CI, external/data-structures already checked out — skipping fetch.');
} else if (existsSync(path.join(siblingRepo, '.git'))) {
  log(`Using local sibling repo: ${siblingRepo}`);
  rmSync(target, { recursive: true, force: true });
  mkdirSync(path.dirname(target), { recursive: true });
  cpSync(siblingRepo, target, {
    recursive: true,
    filter: (src) => !src.split(path.sep).includes('.git'),
  });
} else if (existsSync(target)) {
  log('external/data-structures already present, pulling latest.');
  execSync('git pull --ff-only', { cwd: target, stdio: 'inherit' });
} else {
  log(`Cloning ${REMOTE}`);
  mkdirSync(path.dirname(target), { recursive: true });
  execSync(`git clone --depth 1 "${REMOTE}" "${target}"`, { stdio: 'inherit' });
}

const filesSource = path.join(target, 'files');
const filesDest = path.join(root, 'public', 'teaching', 'data-structures', 'files');
rmSync(filesDest, { recursive: true, force: true });
mkdirSync(path.dirname(filesDest), { recursive: true });
cpSync(filesSource, filesDest, { recursive: true });
log(`Copied downloads to ${path.relative(root, filesDest)}`);
