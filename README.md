# Shmotka

Тема и шпаргалка готовых фрагментов [daisyUI](https://daisyui.com) для моих личных проектов: IdeaHub, Искра, Личные финансы и всё новое.
Один набор токенов — общий вид у всех проектов, под проект меняется только цвет акцента.
Тёмная тема — основа, светлая выведена из неё.

Shmotka **не содержит** Tailwind и daisyUI: проект ставит их сам, рядом, а Shmotka задаёт им вид.

## Подключение

```bash
npm i tailwindcss daisyui github:ast21/shmotka#v0.6.1
```

В главном CSS проекта:

```css
@import "tailwindcss";
@plugin "daisyui" { themes: false; }   /* встроенные темы daisyUI не нужны */
@import "shmotka";
```

Шрифты — своими файлами, без Google Fonts. В тот же CSS:

```css
@import "shmotka/fonts";   /* Inter, JetBrains Mono, Space Grotesk — @font-face с адресами /fonts/… */
```

и скопировать файлы туда, откуда сайт отдаёт `/fonts/` (в CI — то же с `--check`):

```bash
npx shmotka-fonts public/fonts
```

Обновление — сменить тег в `package.json` (`#v0.6.1`), `npm i` и `npx shmotka-fonts public/fonts`.

**Витрина** со всеми компонентами и фрагментами в обеих темах, переключателем акцента и кнопкой «скопировать код» —
https://shmotka.pages.dev (собирается `npm run showcase` в `showcase/dist`).

### Laravel (Vite)

`npm i -D tailwindcss @tailwindcss/vite daisyui github:ast21/shmotka#v0.6.1`, в `vite.config.js` — плагин `tailwindcss()`,
в `resources/css/app.css` — строки выше, шрифты — `npx shmotka-fonts public/fonts`.
В `layouts/app.blade.php`: `<html data-theme="shmotka-dark" data-accent="finance">` и `@vite('resources/css/app.css')`.

### React (Vite)

То же: `@tailwindcss/vite` в `vite.config.ts`, три строки в `src/index.css`, `data-theme` и `data-accent` на `<html>` в `index.html`.

### Telegram Mini App

```js
import { connectTelegram } from 'shmotka/telegram';
connectTelegram();                           // тема и акцент — из Telegram, шапка окна — в цвет фона
connectTelegram({ telegramAccent: false });  // акцент проекта, тема — из Telegram
```

### PWA: метка, проверка и обновление

Для сайтов, которые ставятся на телефон (манифест + service worker). Модуль по желанию: подключается и убирается целиком.

- Логотип **PWA** рядом с версией (P и A — цвет текста, W — акцент проекта). Нажатие на версию — «Проверить обновления».
  Логотип — [webmaxru/progressive-web-apps-logo](https://github.com/webmaxru/progressive-web-apps-logo), автор разрешает свободно использовать и менять.
- Сам узнаёт о новой версии: при открытии, при возврате в приложение, раз в 30 минут и когда вернулась сеть.
  Новая версия — когда `/health` отвечает `{ "version": "…" }` не той, что вшита в страницу (`data-version`).
  Запрос идёт без кэша; service worker проекта должен пропускать `/health` в сеть.
- Плашка «Вышла версия X» с кнопкой «Обновить»: скачивает новый service worker, ждёт его (до 5 с) и перезагружает страницу.

Подключить:

1. Разметка — фрагмент «PWA: версия и обновление» (`snippets/13-pwa.html`): `data-shm-pwa` с `data-version`, кнопка
   `data-shm-pwa-check`, подпись `data-shm-pwa-status` и плашка `data-shm-pwa-update` (обе с `hidden`), внутри — `data-shm-pwa-latest`
   и кнопка `data-shm-pwa-apply`. Свой адрес проверки — `data-health="/version"`.
2. Скрипт: `npx shmotka-pwa public/pwa.js` (в CI — то же с `--check`) и `<script type="module" src="/pwa.js"></script>`.
   Можно положить `/pwa.js` в кэш service worker, тогда без сети страница не ругается на скрипт.
3. Отменить обновление (например, не отправлен текст):

```js
addEventListener('shmotka:pwa-update', (e) => { if (draft()) e.preventDefault(); });
```

Убрать: разметку с `data-shm-pwa*`, тег `<script src="/pwa.js">`, файл `public/pwa.js`, шаг `shmotka-pwa` в сборке и `/pwa.js` из кэша service worker.

## Темы

`shmotka-dark` и `shmotka-light`. Без атрибута тема следует системной настройке. Явно — атрибутом:

```html
<html data-theme="shmotka-dark">
```

## Цвет проекта

Готовые акценты — атрибутом на `<html>`:

| `data-accent` | Проект | Тёмная / светлая |
| --- | --- | --- |
| `ideahub` (по умолчанию) | IdeaHub, фиолетовый | `#8b7dff` / `#5b4bdb` |
| `iskra` | Искра, синий | `#5aa9ff` / `#1f74ba` |
| `finance` | Личные финансы, бирюзовый | `#3ccfb4` / `#0f7f6c` |
| `inbox` | Inbox, оранжевый | `#ff8a3d` / `#b34a00` |
| `til` | TIL, жёлтый | `#f2c94c` / `#8a6a00` |

Свой цвет — одна-две переменные, остальное (мягкая подложка, цвет ссылок) выводится само:

```css
:root {
  --shm-accent: #e8590c;        /* акцент для тёмной темы */
  --shm-accent-light: #b8440a;  /* по желанию: акцент для светлой, иначе выводится из первого */
  --shm-accent-fg: #ffffff;     /* по желанию: текст на акценте */
}
```

Правило: акцент на фоне — не меньше 4.5:1 в обеих темах. Новый пресет добавляется в `tokens/tokens.json` — проверка контраста в CI проверит его сама.

## Что даёт Shmotka

- **Компоненты daisyUI** в стиле системы: `btn`, `badge`, `card`, `input`, `checkbox`, `progress`, `table`, `modal`, `tabs`, `menu`, `drawer`…
  `primary`, `secondary` и `accent` daisyUI — один и тот же акцент проекта (принцип «один акцент»).
- **Утилиты Tailwind** для того, чего нет в daisyUI: `text-muted`, `text-subtle`, `border-line`, `border-line-strong`,
  `bg-primary-soft`, `text-primary-text`, `bg-success-soft` (и `warning`/`danger`/`info`), `bg-heat-0…4`, `bg-status-idea`,
  `font-display` (Space Grotesk), `font-mono` (JetBrains Mono), скругления `rounded-sm/md/lg/xl` по токенам.
- **CSS-переменные** `--shm-*` для своих стилей: `--shm-bg`, `--shm-surface`, `--shm-fg-muted`, `--shm-primary-soft`, `--shm-sidebar-w`…

- **Доводка daisyUI** под правила системы: у обычной кнопки рамка как у полей, активный пункт меню — мягкая подложка акцента.
- **Шпаргалка** `snippets/*.html` — готовые фрагменты только на классах daisyUI и Tailwind: компоненты, страница с боковым меню,
  документ со скрываемыми оглавлением и панелью, счётчики, статусы и фильтры, прогресс (полоса, сегменты, кольцо, этапы),
  карта активности, переключатель вида, пустое состояние, уведомление, история версий, мобильный экран.
- **Правила для нейронок** `docs/ai.md` — скопируйте в `CLAUDE.md` проекта (или сошлитесь на `node_modules/shmotka/docs/ai.md`).

## Как устроено

```
shmotka/
│  ── пакет: только это получает проект при npm i (поле "files" в package.json) ──
├── tokens/tokens.json   единственный источник цветов, шрифтов, скруглений, акцентов
├── css/shmotka.css      тема (генерируется из tokens.json, руками не править)
├── js/telegram.js       связка с Telegram Mini App
├── snippets/*.html      шпаргалка готовых фрагментов
├── docs/ai.md           правила для нейронок
│  ── в проект не попадает ──
├── showcase/            витрина https://shmotka.pages.dev
│   ├── build.mjs            собирает dist/ из шпаргалки и правил
│   ├── app.css              подключает тему так же, как проект
│   └── dist/                готовый сайт (не в git)
├── scripts/             инструменты темы
│   ├── build.mjs            tokens.json → css/shmotka.css (npm run build)
│   ├── check-contrast.mjs   контраст 4.5:1 / 3:1 в обеих темах для каждого акцента
│   ├── lib/tokens.mjs       общая цветовая математика
│   └── check.sh             все проверки (npm run check, его же запускает CI)
└── test/                цвета, Telegram, правила шпаргалки, настоящие сборки Tailwind + daisyUI
```

Витрина выкладывается на Cloudflare Pages после каждого мержа в `main` (`.github/workflows/pages.yml`,
секреты `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`).

## Версии

История изменений — в [`CHANGELOG.md`](CHANGELOG.md). Каждая версия — отдельный PR и релиз на GitHub.
Правила работы над проектом (в том числе для нейронок) — в [`CLAUDE.md`](CLAUDE.md).

---
Создано из [ideahub-project-template](https://github.com/ast21/ideahub-project-template).
