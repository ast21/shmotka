import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectTelegram } from '../js/telegram.js';

function fakeEnv(colorScheme, themeParams) {
  const props = new Map();
  const doc = { documentElement: { dataset: {}, style: {
    setProperty: (k, v) => props.set(k, v), removeProperty: (k) => props.delete(k) } } };
  const handlers = {};
  const calls = [];
  const webApp = {
    colorScheme, themeParams,
    onEvent: (e, fn) => { handlers[e] = fn; },
    offEvent: (e) => { delete handlers[e]; },
    setHeaderColor: (c) => calls.push(['header', c]),
    setBackgroundColor: (c) => calls.push(['bg', c]),
  };
  return { doc, props, handlers, calls, webApp };
}

test('тема Telegram становится темой Шмотки и меняется вместе с ней', () => {
  const env = fakeEnv('dark', {});
  connectTelegram({ webApp: env.webApp, document: env.doc, paintChrome: false });
  assert.equal(env.doc.documentElement.dataset.theme, 'shmotka-dark');
  env.webApp.colorScheme = 'light';
  env.handlers.themeChanged();
  assert.equal(env.doc.documentElement.dataset.theme, 'shmotka-light');
});

test('цвет кнопки Telegram становится акцентом в обеих темах', () => {
  const env = fakeEnv('light', { button_color: '#2481cc', button_text_color: '#ffffff' });
  connectTelegram({ webApp: env.webApp, document: env.doc, paintChrome: false });
  assert.equal(env.props.get('--shm-accent'), '#2481cc');
  assert.equal(env.props.get('--shm-accent-light'), '#2481cc');
  assert.equal(env.props.get('--shm-accent-fg'), '#ffffff');
});

test('акцент проекта остаётся, если telegramAccent: false', () => {
  const env = fakeEnv('dark', { button_color: '#2481cc' });
  connectTelegram({ webApp: env.webApp, document: env.doc, paintChrome: false, telegramAccent: false });
  assert.equal(env.props.has('--shm-accent'), false);
});

test('отключение снимает слежение за темой', () => {
  const env = fakeEnv('dark', {});
  const off = connectTelegram({ webApp: env.webApp, document: env.doc, paintChrome: false });
  off();
  assert.equal(env.handlers.themeChanged, undefined);
});

test('вне Telegram ничего не делает', () => {
  assert.doesNotThrow(() => connectTelegram({ webApp: undefined })());
});
