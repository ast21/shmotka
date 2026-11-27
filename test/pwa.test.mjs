import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { connectPwa } from '../js/pwa.js';
import { ROOT } from '../scripts/lib/tokens.mjs';

function el(dataset = {}, name = '') {
  const self = { dataset, hidden: true, textContent: '', disabled: false };
  self.closest = (sel) => (sel === `[data-shm-pwa-${name}]` ? self : null);
  return self;
}

function fakeEnv({ version = '1.2.0', latest = '1.2.0', online = true, ok = true, worker } = {}) {
  const parts = {
    '': el({ version }), check: el({}, 'check'), status: el(), update: el(), latest: el(), apply: el({}, 'apply'),
  };
  const docHandlers = {};
  const doc = {
    visibilityState: 'visible',
    querySelector: (sel) => parts[/^\[data-shm-pwa-?([a-z]*)\]$/.exec(sel)[1]] ?? null,
    addEventListener: (e, fn) => { docHandlers[e] = fn; },
    removeEventListener: (e) => { delete docHandlers[e]; },
  };
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url, init });
    if (!ok) return { ok: false, status: 302, json: async () => ({}) };
    return { ok: true, json: async () => ({ ok: true, version: env.latest }) };
  };
  const reloads = [];
  const win = new EventTarget();
  const env = {
    latest, parts, doc, docHandlers, requests, reloads, win,
    navigator: { onLine: online, serviceWorker: worker },
    location: { reload: () => reloads.push(1) },
  };
  env.connect = (extra = {}) => connectPwa({
    document: doc, fetch, navigator: env.navigator, location: env.location, window: win, interval: 1e9, waitWorker: 50, ...extra,
  });
  return env;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

test('без разметки data-shm-pwa ничего не делает', () => {
  assert.equal(connectPwa({ document: { querySelector: () => null }, fetch: async () => {} }), null);
});

test('та же версия: плашки нет, по нажатию — «последняя версия»', async (t) => {
  const env = fakeEnv();
  const pwa = env.connect();
  t.after(() => pwa.stop());
  await tick();
  assert.equal(env.parts.update.hidden, true);
  assert.equal(env.parts.status.hidden, true, 'сама проверка при открытии молчит');
  assert.equal(await pwa.check(true), 'latest');
  assert.equal(env.parts.status.textContent, 'последняя версия');
  assert.equal(env.parts.status.hidden, false);
});

test('/health спрашивается без кэша и с меткой времени', async (t) => {
  const env = fakeEnv();
  const pwa = env.connect();
  t.after(() => pwa.stop());
  await tick();
  assert.match(env.requests[0].url, /^\/health\?t=\d+$/);
  assert.equal(env.requests[0].init.cache, 'no-store');
});

test('новая версия на сервере — плашка с её номером', async (t) => {
  const env = fakeEnv({ latest: '1.3.0' });
  const pwa = env.connect();
  t.after(() => pwa.stop());
  await tick();
  assert.equal(env.parts.update.hidden, false);
  assert.equal(env.parts.latest.textContent, '1.3.0');
});

test('нажатие на версию проверяет сразу', async (t) => {
  const env = fakeEnv();
  const pwa = env.connect();
  t.after(() => pwa.stop());
  await tick();
  env.latest = '1.2.1';
  env.docHandlers.click({ target: env.parts.check });
  await tick(); await tick();
  assert.equal(env.parts.update.hidden, false);
  assert.equal(env.parts.latest.textContent, '1.2.1');
});

test('экран подменили вместе с шапкой — кнопки и плашка работают на новом', async (t) => {
  const env = fakeEnv();
  const pwa = env.connect();
  t.after(() => pwa.stop());
  await tick();
  for (const name of ['check', 'status', 'update', 'latest', 'apply']) env.parts[name] = el({}, name);
  env.latest = '1.3.0';
  env.docHandlers.click({ target: env.parts.check });
  await tick(); await tick();
  assert.equal(env.parts.update.hidden, false);
  assert.equal(env.parts.latest.textContent, '1.3.0');
  env.docHandlers.click({ target: env.parts.apply });
  await tick(); await tick();
  assert.equal(env.reloads.length, 1);
});

test('без сети и при ошибке входа — понятная подпись, без плашки', async (t) => {
  const offline = fakeEnv({ online: false });
  const a = offline.connect();
  t.after(() => a.stop());
  assert.equal(await a.check(true), 'offline');
  assert.equal(offline.parts.status.textContent, 'нет сети');
  assert.equal(offline.requests.length, 0);

  const denied = fakeEnv({ ok: false });
  const b = denied.connect();
  t.after(() => b.stop());
  assert.equal(await b.check(true), 'error');
  assert.equal(denied.parts.status.textContent, 'не удалось проверить');
  assert.equal(denied.parts.update.hidden, true);
});

test('при возврате в приложение проверяет снова, но не чаще раза в минуту', async (t) => {
  const env = fakeEnv();
  const pwa = env.connect();
  t.after(() => pwa.stop());
  await tick();
  env.docHandlers.visibilitychange();
  assert.equal(env.requests.length, 1, 'только что проверяли');
  const now = Date.now;
  Date.now = () => now() + 2 * 60 * 1000;
  try { env.docHandlers.visibilitychange(); } finally { Date.now = now; }
  await tick();
  assert.equal(env.requests.length, 2);
});

test('«Обновить» ждёт новый service worker и перезагружает страницу', async (t) => {
  const sw = new EventTarget();
  const reg = { installing: null, update: async () => { reg.installing = {}; setTimeout(() => sw.dispatchEvent(new Event('controllerchange')), 5); } };
  sw.getRegistration = async () => reg;
  const env = fakeEnv({ latest: '1.3.0', worker: sw });
  const pwa = env.connect();
  t.after(() => pwa.stop());
  assert.equal(await pwa.update(), true);
  assert.equal(env.parts.apply.disabled, true);
  assert.equal(env.reloads.length, 1);
});

test('без service worker «Обновить» просто перезагружает', async (t) => {
  const env = fakeEnv({ latest: '1.3.0' });
  const pwa = env.connect();
  t.after(() => pwa.stop());
  env.docHandlers.click({ target: env.parts.apply });
  await tick(); await tick();
  assert.equal(env.reloads.length, 1);
});

test('проект может отменить обновление событием shmotka:pwa-update', async (t) => {
  const env = fakeEnv({ latest: '1.3.0' });
  env.win.addEventListener('shmotka:pwa-update', (e) => e.preventDefault());
  const pwa = env.connect();
  t.after(() => pwa.stop());
  assert.equal(await pwa.update(), false);
  assert.equal(env.reloads.length, 0);
  assert.equal(env.parts.apply.disabled, false);
});

test('npx shmotka-pwa копирует скрипт, --check ловит устаревший', () => {
  const dir = mkdtempSync(join(tmpdir(), 'shmotka-pwa-'));
  const bin = join(ROOT, 'bin', 'shmotka-pwa.mjs');
  const file = join(dir, 'public', 'pwa.js');
  try {
    assert.equal(spawnSync(process.execPath, [bin, file, '--check']).status, 1, 'файла ещё нет');
    assert.equal(spawnSync(process.execPath, [bin, file]).status, 0);
    assert.deepEqual(readFileSync(file), readFileSync(join(ROOT, 'js', 'pwa.js')));
    assert.equal(spawnSync(process.execPath, [bin, file, '--check']).status, 0);
    writeFileSync(file, '// old');
    assert.equal(spawnSync(process.execPath, [bin, file, '--check']).status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
