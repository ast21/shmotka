// The cheat sheet must stay "daisyUI + Tailwind + Shmotka utilities only" and the showcase must build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readSnippets, buildSite } from '../showcase/build.mjs';

const snippets = readSnippets();

test('у каждого фрагмента есть название и описание', () => {
  assert.ok(snippets.length >= 12);
  for (const s of snippets) assert.ok(s.title && s.about && s.code, s.file);
});

test('фрагменты без своих стилей и сырых цветов', () => {
  const palette = /\b(?:bg|text|border|from|to|via|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
  for (const s of snippets) {
    assert.doesNotMatch(s.code, /<style/i, `${s.file}: <style> не нужен`);
    assert.doesNotMatch(s.code, /#[0-9a-f]{3,8}\b/i, `${s.file}: hex-цвет вместо смыслового класса`);
    assert.doesNotMatch(s.code, palette, `${s.file}: цвет палитры Tailwind вместо смыслового`);
    for (const [, style] of s.code.matchAll(/style="([^"]*)"/g)) {
      assert.match(style, /^(\s*--[\w-]+:[^;]+;?)+\s*$/, `${s.file}: в style только CSS-переменные компонента (--value)`);
    }
  }
});

test('витрина собирается со всеми фрагментами, и их классы попадают в CSS', () => {
  const { dist } = buildSite();
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const css = readFileSync(join(dist, 'app.css'), 'utf8');
  for (const s of snippets) assert.ok(html.includes(`id="${s.id}"`), `нет раздела ${s.id}`);
  assert.ok(html.includes('Правила для нейронки'));
  for (const cls of ['bg-heat-3', 'drawer-toggle', 'radial-progress', 'timeline', 'dock', 'filter', 'menu-active']) {
    assert.ok(css.includes(cls), `в CSS витрины нет ${cls}`);
  }
  assert.ok(css.includes('doc-toc'), 'в CSS витрины нет правила для скрытия оглавления');
});
