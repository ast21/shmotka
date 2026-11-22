// Builds the showcase into showcase/dist: index.html from snippets/*.html and docs/ai.md,
// app.css compiled by Tailwind + daisyUI with the theme, exactly as a project would.
//   npm run showcase
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, loadTokens } from '../scripts/lib/tokens.mjs';

const DIST = join(ROOT, 'showcase', 'dist');

export function readSnippets(dir = join(ROOT, 'snippets')) {
  return readdirSync(dir).filter((f) => f.endsWith('.html')).sort().map((file) => {
    const src = readFileSync(join(dir, file), 'utf8');
    const m = /^<!--\s*@snippet\s+(.*?)\s*-->\n/s.exec(src);
    if (!m) throw new Error(`${file}: первая строка должна быть <!-- @snippet title="…" about="…" -->`);
    const attrs = Object.fromEntries([...m[1].matchAll(/(\w+)="([^"]*)"/g)].map((a) => [a[1], a[2]]));
    if (!attrs.title || !attrs.about) throw new Error(`${file}: нужны title и about`);
    return { file, id: file.replace(/^\d+-/, '').replace(/\.html$/, ''), ...attrs, code: src.slice(m[0].length).trim() };
  });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderPage({ snippets, ai, tokens, version }) {
  const fonts = tokens.fonts.googleFontsUrl;
  const presets = Object.entries(tokens.accent.presets);
  const install = `npm i tailwindcss daisyui github:ast21/shmotka#v${version}`;
  const css = '@import "tailwindcss";\n@plugin "daisyui" { themes: false; }\n@import "shmotka";';
  const block = (id, code, lang) => `
        <div class="relative">
          <pre class="rounded-box bg-base-300 border border-line p-4 pt-12 sm:pt-4 sm:pr-28 overflow-x-auto font-mono text-[13px] leading-5" data-lang="${lang}"><code id="${id}">${esc(code)}</code></pre>
          <button class="btn btn-xs absolute top-3 right-3" data-copy="${id}">Скопировать</button>
        </div>`;
  const nav = snippets.map((s) => `<li><a href="#${s.id}">${esc(s.title)}</a></li>`).join('\n          ');
  const cards = snippets.map((s) => `
      <section id="${s.id}" class="flex flex-col gap-3 scroll-mt-20">
        <div class="flex flex-wrap items-baseline gap-x-3">
          <h2 class="font-display text-xl font-semibold">${esc(s.title)}</h2>
          <span class="font-mono text-xs text-muted">snippets/${s.file}</span>
        </div>
        <p class="text-muted max-w-prose">${esc(s.about)}</p>
        <div class="rounded-box border border-line overflow-hidden bg-base-300 flex justify-center">
          <iframe class="w-full bg-base-100 transition-[width] block" title="${esc(s.title)}" loading="lazy" data-snippet="${s.id}"></iframe>
        </div>
        <details class="collapse collapse-arrow border border-line bg-base-200">
          <summary class="collapse-title text-sm font-medium">Код</summary>
          <div class="collapse-content">${block(`code-${s.id}`, s.code, 'html')}</div>
        </details>
        <template data-src="${s.id}">${s.code}</template>
      </section>`).join('\n');

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Shmotka — витрина</title>
  <meta name="description" content="Тема и готовые фрагменты daisyUI для личных проектов.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="${fonts}">
  <link rel="stylesheet" href="app.css">
  <script>
    try { const t = localStorage.getItem('shm-theme'); if (t) document.documentElement.dataset.theme = t;
          const a = localStorage.getItem('shm-accent'); if (a && !a.startsWith('#')) document.documentElement.dataset.accent = a; } catch {}
  </script>
</head>
<body class="bg-base-100 text-base-content min-h-screen">
  <header class="sticky top-0 z-30 bg-base-100/90 backdrop-blur border-b border-line">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 py-3 sm:h-16 flex flex-wrap items-center gap-x-3 gap-y-2">
      <a href="#" class="flex items-center gap-2.5 font-display font-bold text-lg mr-auto"><span class="size-2.5 rounded-sm bg-primary"></span>Shmotka <span class="font-mono text-xs font-medium text-success">v${version}</span></a>
      <label class="sr-only" for="accent">Акцент</label>
      <select id="accent" class="select select-sm w-auto">
        ${presets.map(([id, p]) => `<option value="${id}">${esc(p.name)}</option>`).join('\n        ')}
        <option value="custom">Свой цвет…</option>
      </select>
      <input id="accent-color" type="color" value="#e8590c" class="hidden size-8 rounded-md border border-line bg-base-200 p-0.5" aria-label="Свой акцент">
      <div class="join" role="group" aria-label="Тема">
        <button class="btn btn-sm join-item" data-theme-btn="">Авто</button>
        <button class="btn btn-sm join-item" data-theme-btn="shmotka-dark">Тёмная</button>
        <button class="btn btn-sm join-item" data-theme-btn="shmotka-light">Светлая</button>
      </div>
    </div>
  </header>

  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex gap-10 items-start">
    <nav class="hidden lg:block sticky top-24 w-52 shrink-0">
      <ul class="menu menu-sm w-full p-0">
        <li class="menu-title">Начало</li>
        <li><a href="#start">Подключение</a></li>
        <li><a href="#ai">Для нейронок</a></li>
        <li class="menu-title mt-2">Фрагменты</li>
          ${nav}
      </ul>
    </nav>

    <main class="min-w-0 flex-1 flex flex-col gap-14">
      <section class="flex flex-col gap-3">
        <h1 class="font-display text-4xl font-semibold tracking-tight">Shmotka</h1>
        <p class="text-lg text-muted max-w-prose">Тема и готовые фрагменты daisyUI для моих проектов. Общий вид у всех, под проект меняется только акцент. Всё на этой странице — стандартные классы daisyUI и Tailwind.</p>
        <div class="flex flex-wrap items-center gap-3 pt-1">
          <div class="join" role="group" aria-label="Ширина превью">
            <button class="btn btn-sm join-item btn-active" data-width="100%">Десктоп</button>
            <button class="btn btn-sm join-item" data-width="390px">Телефон</button>
          </div>
          <a class="link link-primary text-sm" href="https://github.com/ast21/shmotka">GitHub</a>
        </div>
      </section>

      <section id="start" class="flex flex-col gap-3 scroll-mt-20">
        <h2 class="font-display text-xl font-semibold">Подключение</h2>
        <p class="text-muted max-w-prose">Tailwind и daisyUI проект ставит сам, Shmotka задаёт им вид.</p>
        ${block('code-install', install, 'bash')}
        ${block('code-css', css, 'css')}
        <p class="text-muted max-w-prose">Шрифты — в <code class="font-mono text-sm">&lt;head&gt;</code>. Акцент — <code class="font-mono text-sm">data-accent="ideahub|iskra|finance|inbox|til"</code> на <code class="font-mono text-sm">&lt;html&gt;</code> или своя переменная <code class="font-mono text-sm">--shm-accent</code>. Telegram Mini App:</p>
        ${block('code-tg', "import { connectTelegram } from 'shmotka/telegram';\nconnectTelegram();", 'js')}
      </section>

      <section id="ai" class="flex flex-col gap-3 scroll-mt-20">
        <h2 class="font-display text-xl font-semibold">Для нейронок</h2>
        <p class="text-muted max-w-prose">Скопируйте в <code class="font-mono text-sm">CLAUDE.md</code> проекта — нейронка будет собирать интерфейс в стиле Shmotka. Файл также лежит в пакете: <code class="font-mono text-sm">node_modules/shmotka/docs/ai.md</code>.</p>
        <details class="collapse collapse-arrow border border-line bg-base-200">
          <summary class="collapse-title text-sm font-medium">Правила для нейронки</summary>
          <div class="collapse-content">${block('code-ai', ai, 'md')}</div>
        </details>
      </section>
${cards}
    </main>
  </div>

  <script>
    const root = document.documentElement;
    const css = new URL('app.css', location.href).href;
    const store = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
    let width = '100%';

    function syncFrame(f) {
      const d = f.contentDocument; if (!d || !d.documentElement) return;
      const h = d.documentElement;
      if (root.dataset.theme) h.dataset.theme = root.dataset.theme; else delete h.dataset.theme;
      if (root.dataset.accent) h.dataset.accent = root.dataset.accent; else delete h.dataset.accent;
      const custom = root.style.getPropertyValue('--shm-accent');
      if (custom) h.style.setProperty('--shm-accent', custom); else h.style.removeProperty('--shm-accent');
    }
    function fit(f) { const d = f.contentDocument; if (d && d.body) f.style.height = d.documentElement.scrollHeight + 'px'; }
    const frames = [...document.querySelectorAll('iframe[data-snippet]')];
    for (const f of frames) {
      const html = document.querySelector('template[data-src="' + f.dataset.snippet + '"]').innerHTML;
      f.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        + '<link rel="stylesheet" href="${fonts}"><link rel="stylesheet" href="' + css + '"></head>'
        + '<body class="bg-base-100 text-base-content">' + html + '</body></html>';
      f.addEventListener('load', () => {
        syncFrame(f); fit(f);
        new ResizeObserver(() => fit(f)).observe(f.contentDocument.body);
      });
    }
    const syncAll = () => frames.forEach(syncFrame);

    function setTheme(t) {
      if (t) root.dataset.theme = t; else delete root.dataset.theme;
      store('shm-theme', t || null);
      document.querySelectorAll('[data-theme-btn]').forEach((b) => b.classList.toggle('btn-active', b.dataset.themeBtn === (t || '')));
      syncAll();
    }
    document.querySelectorAll('[data-theme-btn]').forEach((b) => b.addEventListener('click', () => setTheme(b.dataset.themeBtn)));
    setTheme(root.dataset.theme || '');

    const sel = document.getElementById('accent'), picker = document.getElementById('accent-color');
    function setAccent(v) {
      picker.classList.toggle('hidden', !v.startsWith('#'));
      if (v.startsWith('#')) { delete root.dataset.accent; root.style.setProperty('--shm-accent', v); sel.value = 'custom'; picker.value = v; }
      else { root.dataset.accent = v; root.style.removeProperty('--shm-accent'); sel.value = v; }
      store('shm-accent', v);
      syncAll();
    }
    sel.addEventListener('change', () => setAccent(sel.value === 'custom' ? picker.value : sel.value));
    picker.addEventListener('input', () => setAccent(picker.value));
    let saved = null; try { saved = localStorage.getItem('shm-accent'); } catch {}
    setAccent(saved || '${tokens.accent.default}');

    document.querySelectorAll('[data-width]').forEach((b) => b.addEventListener('click', () => {
      width = b.dataset.width;
      document.querySelectorAll('[data-width]').forEach((x) => x.classList.toggle('btn-active', x === b));
      frames.forEach((f) => { f.style.width = width; setTimeout(() => fit(f), 250); });
    }));

    document.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      const text = document.getElementById(b.dataset.copy).textContent;
      try { await navigator.clipboard.writeText(text); b.textContent = 'Скопировано'; }
      catch { b.textContent = 'Не вышло'; }
      setTimeout(() => (b.textContent = 'Скопировать'), 1500);
    }));
  </script>
</body>
</html>
`;
}

export function buildSite() {
  const tokens = loadTokens();
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const snippets = readSnippets();
  const ai = readFileSync(join(ROOT, 'docs', 'ai.md'), 'utf8');
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, 'index.html'), renderPage({ snippets, ai, tokens, version }));
  const cli = join(ROOT, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');
  execFileSync(process.execPath, [cli, '-i', join(ROOT, 'showcase', 'app.css'), '-o', join(DIST, 'app.css'), '--minify'], { cwd: ROOT, stdio: 'pipe' });
  return { dist: DIST, snippets };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { dist, snippets } = buildSite();
  console.log(`Витрина собрана: ${dist} (${snippets.length} фрагментов)`);
}
