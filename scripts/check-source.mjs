import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const requiredFiles = [
  'index.html',
  '404.html',
  'mentions-legales/index.html',
  'vite.config.js',
  'src/main.js',
  'src/page.js',
  'src/js/hero/scene.js',
  'src/js/hero/shaders.js',
  'src/js/hero/shapes.js',
  'src/styles/main.css',
];

for (const file of requiredFiles) {
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
  } catch {
    console.error(`Missing required source: ${file}`);
    process.exit(1);
  }
}

const sources = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const name = join(dir, entry.name);
    if (entry.isDirectory()) walk(name);
    else if (entry.isFile() && name.endsWith('.js')) sources.push(name);
  }
}
walk('src');
sources.push('vite.config.js');

for (const filename of sources) {
  const result = spawnSync(process.execPath, ['--check', filename], { encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(`Syntax error in ${filename}: ${result.stderr}`);
    process.exit(1);
  }
}

const html = readFileSync('index.html', 'utf8');
if (!html.includes('/src/main.js') || !html.includes('application/ld+json')) {
  console.error('Homepage must include its source entrypoint and structured data.');
  process.exit(1);
}

console.log(`Source checks passed: ${sources.length} JavaScript files, HTML structure, required files.`);
