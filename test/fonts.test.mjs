// Fonts ship inside the package: css/fonts.css points at /fonts/*, bin/shmotka-fonts copies the files there.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { ROOT } from '../scripts/lib/tokens.mjs';

const BIN = join(ROOT, 'bin', 'shmotka-fonts.mjs');
const FONTS = readdirSync(join(ROOT, 'fonts'));

test('каждый url() в css/fonts.css ведёт на файл из fonts/', () => {
  const css = readFileSync(join(ROOT, 'css', 'fonts.css'), 'utf8');
  const urls = [...css.matchAll(/url\(\/fonts\/([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(urls.length >= 5);
  for (const u of urls) assert.ok(FONTS.includes(u), `нет fonts/${u}`);
  for (const family of ['Inter', '"JetBrains Mono"', '"Space Grotesk"']) assert.ok(css.includes(`font-family: ${family}`), family);
});

test('проект подключает шрифты строкой @import "shmotka/fonts"', () => {
  const dir = mkdtempSync(join(tmpdir(), 'shmotka-fonts-'));
  try {
    mkdirSync(join(dir, 'node_modules'));
    symlinkSync(ROOT, join(dir, 'node_modules', 'shmotka'));
    symlinkSync(join(ROOT, 'node_modules', 'tailwindcss'), join(dir, 'node_modules', 'tailwindcss'));
    writeFileSync(join(dir, 'app.css'), '@import "tailwindcss" source(none);\n@import "shmotka/fonts";\n');
    const cli = join(ROOT, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');
    execFileSync(process.execPath, [cli, '-i', 'app.css', '-o', 'out.css'], { cwd: dir, stdio: 'pipe' });
    const out = readFileSync(join(dir, 'out.css'), 'utf8');
    assert.match(out, /@font-face/);
    assert.match(out, /url\(\/fonts\/inter-cyrillic-wght-normal\.woff2\)/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('shmotka-fonts копирует файлы, --check ловит расхождение', () => {
  const dir = mkdtempSync(join(tmpdir(), 'shmotka-fonts-'));
  const dest = join(dir, 'public', 'fonts');
  const run = (...a) => spawnSync(process.execPath, [BIN, dest, ...a], { encoding: 'utf8' });
  try {
    assert.equal(run('--check').status, 1);
    assert.equal(run().status, 0);
    assert.deepEqual(readdirSync(dest).sort(), [...FONTS].sort());
    assert.equal(run('--check').status, 0);
    writeFileSync(join(dest, 'inter-latin-wght-normal.woff2'), 'old');
    assert.equal(run('--check').status, 1);
    run();
    writeFileSync(join(dest, 'roboto.woff2'), 'x');
    assert.equal(run('--check').status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
