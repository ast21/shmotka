# Шмотка

Тема и шпаргалка готовых фрагментов [daisyUI](https://daisyui.com) для моих личных проектов: IdeaHub, Искра, Личные финансы и всё новое.
Один набор токенов — общий вид у всех проектов, под проект меняется только цвет акцента.
Тёмная тема — основа, светлая выведена из неё.

Шмотка **не содержит** Tailwind и daisyUI: проект ставит их сам, рядом, а Шмотка задаёт им вид.

## Подключение

```bash
npm i tailwindcss daisyui github:ast21/shmotka#v0.2.0
```

В главном CSS проекта:

```css
@import "tailwindcss";
@plugin "daisyui" { themes: false; }   /* встроенные темы daisyUI не нужны */
@import "shmotka";
```

Шрифты — в `<head>`:

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@500;600;700&display=swap">
```

Обновление — сменить тег в `package.json` (`#v0.3.0`) и `npm i`.

**Витрина** со всеми компонентами и фрагментами в обеих темах, переключателем акцента и кнопкой «скопировать код» —
https://shmotka.pages.dev (собирается `npm run site` в `site/dist`).

### Laravel (Vite)

`npm i -D tailwindcss @tailwindcss/vite daisyui github:ast21/shmotka#v0.2.0`, в `vite.config.js` — плагин `tailwindcss()`,
в `resources/css/app.css` — три строки выше. В `layouts/app.blade.php`: `<html data-theme="shmotka-dark" data-accent="finance">`,
шрифты и `@vite('resources/css/app.css')`.

### React (Vite)

То же: `@tailwindcss/vite` в `vite.config.ts`, три строки в `src/index.css`, `data-theme` и `data-accent` на `<html>` в `index.html`.

### Telegram Mini App

```js
import { connectTelegram } from 'shmotka/telegram';
connectTelegram();                           // тема и акцент — из Telegram, шапка окна — в цвет фона
connectTelegram({ telegramAccent: false });  // акцент проекта, тема — из Telegram
```

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

Свой цвет — одна-две переменные, остальное (мягкая подложка, цвет ссылок) выводится само:

```css
:root {
  --shm-accent: #e8590c;        /* акцент для тёмной темы */
  --shm-accent-light: #b8440a;  /* по желанию: акцент для светлой, иначе выводится из первого */
  --shm-accent-fg: #ffffff;     /* по желанию: текст на акценте */
}
```

Правило: акцент на фоне — не меньше 4.5:1 в обеих темах. Новый пресет добавляется в `tokens/tokens.json` — проверка контраста в CI проверит его сама.

## Что даёт Шмотка

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

- `tokens/tokens.json` — единственный источник: цвета обеих тем, акценты, шрифты, скругления, пары для проверки контраста.
- `scripts/build.mjs` собирает из него `css/shmotka.css` (файл в репозитории, руками не правится): `npm run build`.
- `scripts/check-contrast.mjs` проверяет контраст 4.5:1 (текст) и 3:1 (элементы) в обеих темах для каждого акцента.
- `js/telegram.js` — связка с Telegram Mini App.
- `snippets/` + `docs/ai.md` → `scripts/build-site.mjs` → витрина `site/dist` (деплой на Cloudflare Pages — `.github/workflows/pages.yml`
  после мержа в `main`, нужны секреты `CLOUDFLARE_API_TOKEN` и `CLOUDFLARE_ACCOUNT_ID`).
- `test/` — цветовая математика, связка с Telegram, правила шпаргалки и настоящие сборки Tailwind + daisyUI.
- Все проверки: `npm run check` (то же запускает CI).

## Версии

История изменений — в [`CHANGELOG.md`](CHANGELOG.md). Каждая версия — отдельный PR и релиз на GitHub.
Правила работы над проектом (в том числе для нейронок) — в [`CLAUDE.md`](CLAUDE.md).

---
Создано из [ideahub-project-template](https://github.com/ast21/ideahub-project-template).
