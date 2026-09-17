import { lstat, realpath, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// File-by-file allowlist: new files require deliberate review before export.
const files = [
  '.gitignore', 'CHANGELOG.md', 'CONTRACT.md', 'README.md', 'methodology.md',
  'package.json', 'sources-index.md', 'data/cases.json',
  'public/app.js', 'public/core.mjs', 'public/methodology.html', 'public/style.css',
  'scripts/build.mjs', 'scripts/lib.mjs', 'scripts/package-public.mjs',
  'tests/build.test.mjs', 'tests/logic.test.mjs', 'tests/fixtures/cases.json'
].sort();
const root = await realpath(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const output = join(root, 'audit', 'public-repository');
const manifestName = 'manifest.sha256';
const allowedOutputs = new Set([...files, manifestName]);

function contained(base, path) {
  const rel = relative(base, path);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || resolve(base, rel) !== path) {
    throw new Error(`Unsafe path: ${path}`);
  }
}

async function inspect(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function safeDirectory(path) {
  contained(root, path);
  const parts = relative(root, path).split(sep);
  let current = root;
  for (const part of parts) {
    current = join(current, part);
    let stat = await inspect(current);
    if (!stat) { await mkdir(current); stat = await lstat(current); }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`Unsafe directory: ${current}`);
  }
}

async function readSource(name) {
  const path = join(root, ...name.split('/'));
  contained(root, path);
  let current = root;
  const parts = name.split('/');
  for (let index = 0; index < parts.length; index += 1) {
    current = join(current, parts[index]);
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) {
      throw new Error(`Unsafe source: ${current}`);
    }
  }
  return readFile(path);
}

async function validateOutput(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = join(directory, entry.name);
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`Output symlink refused: ${name}`);
    if (stat.isDirectory()) {
      if (!files.some(file => file.startsWith(`${name}/`))) throw new Error(`Unexpected output directory: ${name}`);
      await validateOutput(path, name);
    } else if (!stat.isFile() || stat.nlink !== 1 || !allowedOutputs.has(name)) {
      throw new Error(`Unexpected or unsafe output file: ${name}`);
    }
  }
}

// Read every approved source before changing output. Never delete directories.
const contents = new Map();
for (const name of files) contents.set(name, await readSource(name));
await safeDirectory(output);
await validateOutput(output);
for (const [name, bytes] of contents) {
  const target = join(output, ...name.split('/'));
  contained(output, target);
  await safeDirectory(dirname(target));
  await writeFile(target, bytes);
}
const manifest = [...contents].map(([name, bytes]) => `${createHash('sha256').update(bytes).digest('hex')}  ${name}`).join('\n') + '\n';
await writeFile(join(output, manifestName), manifest);
await validateOutput(output);
console.log(`Prepared ${files.length} public source files plus ${manifestName} at ${output}`);
