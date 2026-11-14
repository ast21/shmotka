# Шмотка

Тема и дополнения [daisyUI](https://daisyui.com) для моих личных проектов: IdeaHub, Искра, Личные финансы и всё новое.
Один набор токенов — общий вид у всех проектов, под проект меняется только цвет акцента.
Тёмная тема — основа, светлая выведена из неё.

Шмотка **не содержит** Tailwind и daisyUI: проект ставит их сам, рядом, а Шмотка задаёт им вид.

## Подключение

```bash
npm i tailwindcss daisyui github:ast21/shmotka#v0.1.0
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

Обновление — сменить тег в `package.json` (`#v0.2.0`) и `npm i`.

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

Скоро (0.2.0): карта активности, раскладка документа со скрываемыми оглавлением и панелью, сегментный прогресс,
чипы статусов, связка с темой Telegram Mini App.

## Как устроено

- `tokens/tokens.json` — единственный источник: цвета обеих тем, акценты, шрифты, скругления, пары для проверки контраста.
- `scripts/build.mjs` собирает из него `css/shmotka.css` (файл в репозитории, руками не правится): `npm run build`.
- `scripts/check-contrast.mjs` проверяет контраст 4.5:1 (текст) и 3:1 (элементы) в обеих темах для каждого акцента.
- `test/` — цветовая математика и настоящая сборка Tailwind + daisyUI «проекта», который подключает Шмотку.
- Все проверки: `npm run check` (то же запускает CI).

## Версии

История изменений — в [`CHANGELOG.md`](CHANGELOG.md). Каждая версия — отдельный PR и релиз на GitHub.
Правила работы над проектом (в том числе для нейронок) — в [`CLAUDE.md`](CLAUDE.md).

---
Создано из [ideahub-project-template](https://github.com/ast21/ideahub-project-template).
