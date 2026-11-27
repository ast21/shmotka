// Shmotka × PWA: метка «PWA» у версии, проверка обновлений и обновление в одно нажатие.
// Разметка — фрагмент «PWA: версия и обновление» (snippets/13-pwa.html), этот файл только оживляет её
// по data-атрибутам. Сайт отдаёт его как /pwa.js (npx shmotka-pwa public/pwa.js) и подключает:
//
//   <script type="module" src="/pwa.js"></script>
//
// Новая версия — когда /health (без кэша, в обход service worker) отвечает другой { version }, чем data-version.
// Проверяет сам: при открытии, при возврате в приложение, раз в 30 минут и когда вернулась сеть;
// нажатие на версию — проверить сейчас. «Обновить» — скачать новый service worker, дождаться его и перезагрузить.
// Проект может отменить обновление (например, есть неотправленный текст):
//
//   addEventListener('shmotka:pwa-update', (e) => { if (draft()) e.preventDefault(); });
//
// Убрать из проекта: разметку с data-shm-pwa*, <script src="/pwa.js">, файл public/pwa.js и шаг shmotka-pwa в сборке.

const MINUTE = 60 * 1000;

/**
 * @param {object} [options]
 * @param {Document} [options.document]
 * @param {typeof fetch} [options.fetch]
 * @param {any} [options.navigator]
 * @param {{ reload(): void }} [options.location]
 * @param {any} [options.window] куда вешать online/shmotka:pwa-update (по умолчанию globalThis)
 * @param {number} [options.interval=30 мин] как часто проверять, пока приложение открыто
 * @param {number} [options.waitWorker=5000] сколько ждать новый service worker перед перезагрузкой, мс
 * @returns {{ check(manual?: boolean): Promise<string>, update(): Promise<boolean>, stop(): void } | null}
 */
export function connectPwa(options = {}) {
  const {
    document: doc = globalThis.document,
    fetch: get = globalThis.fetch?.bind(globalThis),
    navigator: nav = globalThis.navigator,
    location: loc = globalThis.location,
    window: win = globalThis,
    interval = 30 * MINUTE,
    waitWorker = 5000,
  } = options;
  const root = doc?.querySelector('[data-shm-pwa]');
  if (!root || !get) return null;

  // The version of the page that was loaded: its scripts and styles. Parts are looked up on every use,
  // so a project that swaps screens in place (with a new header) keeps working.
  const current = root.dataset.version;
  const health = root.dataset.health || '/health';
  const part = (name) => doc.querySelector(`[data-shm-pwa-${name}]`);
  let found = null;

  let lastCheck = 0;
  let statusTimer;
  const say = (text, keep = false) => {
    const status = part('status');
    if (!status) return;
    clearTimeout(statusTimer);
    status.textContent = text;
    status.hidden = !text;
    if (text && !keep) statusTimer = setTimeout(() => { status.hidden = true; }, 4000);
  };

  async function latest() {
    const sep = health.includes('?') ? '&' : '?';
    const res = await get(`${health}${sep}t=${Date.now()}`, { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) throw new Error(`health ${res.status}`);
    const body = await res.json();
    if (typeof body?.version !== 'string') throw new Error('no version');
    return body.version;
  }

  /** @returns {Promise<'update'|'latest'|'offline'|'error'>} */
  async function check(manual = false) {
    if (nav && nav.onLine === false) {
      if (manual) say('нет сети');
      return 'offline';
    }
    lastCheck = Date.now();
    if (manual) say('проверяю…', true);
    try {
      const v = await latest();
      if (v === current) {
        if (manual) say('последняя версия');
        return 'latest';
      }
      found = v;
      showFound();
      say('');
      return 'update';
    } catch {
      if (manual) say('не удалось проверить');
      return 'error';
    }
  }

  function showFound() {
    const banner = part('update');
    const latestEl = part('latest');
    if (!found || !banner) return;
    if (latestEl && latestEl.textContent !== found) latestEl.textContent = found;
    if (banner.hidden) banner.hidden = false;
  }

  function workerChanged(sw) {
    return new Promise((resolve) => {
      const done = () => { clearTimeout(t); sw.removeEventListener?.('controllerchange', done); resolve(); };
      const t = setTimeout(done, waitWorker);
      sw.addEventListener?.('controllerchange', done);
    });
  }

  async function update() {
    const event = new (win.CustomEvent || CustomEvent)('shmotka:pwa-update', { cancelable: true });
    if (win.dispatchEvent && !win.dispatchEvent(event)) return false;
    const applyBtn = part('apply');
    if (applyBtn) applyBtn.disabled = true;
    const sw = nav?.serviceWorker;
    try {
      const reg = sw && await sw.getRegistration();
      if (reg) {
        await reg.update();
        if (reg.installing || reg.waiting) await workerChanged(sw);
      }
    } catch { /* no network or no worker: a plain reload still brings the new page */ }
    loc.reload();
    return true;
  }

  const onClick = (e) => {
    const t = e.target;
    if (t?.closest?.('[data-shm-pwa-check]')) check(true);
    else if (t?.closest?.('[data-shm-pwa-apply]')) update();
  };
  const onVisible = () => { if (doc.visibilityState === 'visible' && Date.now() - lastCheck > MINUTE) check(); };
  const onOnline = () => check();
  doc.addEventListener('click', onClick);
  // a swapped-in screen comes with the plate hidden again: show the found version there too
  const watcher = globalThis.MutationObserver && doc.body
    ? new globalThis.MutationObserver(() => { if (found) showFound(); }) : null;
  watcher?.observe(doc.body, { childList: true, subtree: true });
  doc.addEventListener('visibilitychange', onVisible);
  win.addEventListener?.('online', onOnline);
  const timer = setInterval(() => { if (doc.visibilityState !== 'hidden') check(); }, interval);
  check();

  return {
    check,
    update,
    stop() {
      clearInterval(timer);
      clearTimeout(statusTimer);
      watcher?.disconnect();
      doc.removeEventListener('click', onClick);
      doc.removeEventListener('visibilitychange', onVisible);
      win.removeEventListener?.('online', onOnline);
    },
  };
}

// Loaded by <script type="module" src="/pwa.js">: start by itself once the page is parsed.
if (globalThis.document?.querySelector) {
  if (globalThis.document.readyState === 'loading') globalThis.document.addEventListener('DOMContentLoaded', () => connectPwa());
  else connectPwa();
}
