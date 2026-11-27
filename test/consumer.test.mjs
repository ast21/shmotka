// Builds a tiny "project" that installs Shmotka the way real projects do
// (@import "tailwindcss"; @plugin "daisyui"; @import "shmotka";) and checks the compiled CSS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, symlinkSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from '../scripts/lib/tokens.mjs';

function withProject(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'shmotka-consumer-'));
  try {
    mkdirSync(join(dir, 'node_modules'));
    symlinkSync(ROOT, join(dir, 'node_modules', 'shmotka'));
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('проект импортирует shmotka/telegram, shmotka/pwa и tokens.json по именам пакета', () => {
  const out = withProject((dir) => {
    writeFileSync(join(dir, 'probe.mjs'),
      "const t = await import('shmotka/telegram'); const p = await import('shmotka/pwa'); const j = await import('shmotka/tokens.json', { with: { type: 'json' } });"
      + "console.log(typeof t.connectTelegram, typeof p.connectPwa, j.default.name);");
    return execFileSync(process.execPath, ['probe.mjs'], { cwd: dir, encoding: 'utf8' }).trim();
  });
  assert.equal(out, 'function function Shmotka');
});

function compile(projectCss, html) {
  const dir = mkdtempSync(join(tmpdir(), 'shmotka-consumer-'));
  try {
    mkdirSync(join(dir, 'node_modules'));
    symlinkSync(ROOT, join(dir, 'node_modules', 'shmotka'));
    for (const dep of ['tailwindcss', 'daisyui']) {
      symlinkSync(join(ROOT, 'node_modules', dep), join(dir, 'node_modules', dep));
    }
    writeFileSync(join(dir, 'app.css'), projectCss);
    writeFileSync(join(dir, 'index.html'), html);
    const cli = join(ROOT, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');
    execFileSync(process.execPath, [cli, '-i', 'app.css', '-o', 'out.css'], { cwd: dir, stdio: 'pipe' });
    return readFileSync(join(dir, 'out.css'), 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const PROJECT = '@import "tailwindcss";\n@plugin "daisyui" { themes: false; }\n@import "shmotka";\n';
const HTML = '<button class="btn btn-primary">Записать</button><span class="badge badge-success">Готово</span>'
  + '<p class="text-muted bg-primary-soft rounded-lg font-display border-line">x</p>';

const css = compile(PROJECT, HTML);

test('обе темы daisyUI собираются', () => {
  assert.match(css, /\[data-theme=["']?shmotka-dark["']?\]/);
  assert.match(css, /\[data-theme=["']?shmotka-light["']?\]/);
});

test('без data-theme тема следует системной настройке', () => {
  assert.match(css, /prefers-color-scheme:\s*dark/);
});

test('акцент проекта управляет цветом primary', () => {
  assert.match(css, /--color-primary:\s*var\(--shm-primary\)/);
  assert.match(css, /--shm-primary:\s*var\(--shm-accent\)/);
  assert.match(css, /--shm-primary-soft:\s*color-mix\(in oklab/);
  assert.match(css, /\[data-accent=["']?finance["']?\]/);
});

test('компоненты daisyUI и утилиты Shmotka попадают в сборку', () => {
  for (const cls of ['.btn-primary', '.badge-success', '.text-muted', '.bg-primary-soft', '.rounded-lg', '.font-display', '.border-line']) {
    assert.ok(css.includes(cls), `нет ${cls}`);
  }
});

test('встроенные темы daisyUI отключены', () => {
  assert.doesNotMatch(css, /\[data-theme=["']?cupcake/);
});
