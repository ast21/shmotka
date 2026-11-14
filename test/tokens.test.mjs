import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mixOklab, contrast, loadTokens, resolveTheme } from '../scripts/lib/tokens.mjs';
import { checkContrast } from '../scripts/check-contrast.mjs';
import { build } from '../scripts/build.mjs';

test('color-mix в oklab считается как в браузере', () => {
  assert.equal(mixOklab('#ffffff', 50, '#000000'), '#636363');
  assert.equal(mixOklab('#8b7dff', 100, '#000000'), '#8b7dff');
  assert.equal(mixOklab('#8b7dff', 0, '#0d0f14'), '#0d0f14');
});

test('контраст по WCAG', () => {
  assert.equal(contrast('#000000', '#ffffff').toFixed(0), '21');
  assert.equal(contrast('#777777', '#777777'), 1);
});

test('светлый акцент выводится из тёмного, если проект задал один цвет', () => {
  const t = loadTokens();
  const c = resolveTheme(t, 'light', { dark: '#8b7dff' });
  assert.notEqual(c.primary, '#8b7dff');
  assert.ok(contrast(c.primary, c.bg) >= 3);
});

test('все пары токенов проходят контраст', () => {
  const { failures } = checkContrast(loadTokens());
  assert.deepEqual(failures, []);
});

test('проверка контраста ловит плохой акцент', () => {
  const t = loadTokens();
  t.accent.presets.bad = { name: 'жёлтый', dark: '#ffee00', light: '#fff200' };
  const { failures } = checkContrast(t);
  assert.ok(failures.some((f) => f.accent === 'bad' && f.theme === 'light'));
});

test('каждая тема получает все цвета daisyUI', () => {
  const css = build(loadTokens());
  for (const name of ['base-100', 'base-200', 'base-300', 'base-content', 'neutral', 'neutral-content',
    'primary', 'primary-content', 'secondary', 'accent', 'success', 'success-content', 'warning', 'error', 'info']) {
    assert.equal(css.split(`--color-${name}:`).length - 1, 2, `--color-${name} должен быть в обеих темах`);
  }
});
