# Интерфейс в стиле Шмотки — правила для нейронки

Проект оформлен дизайн-системой **Шмотка** (https://github.com/ast21/shmotka): Tailwind CSS v4 + daisyUI 5 с темой Шмотки.
Собирай интерфейс только из классов daisyUI, утилит Tailwind и утилит Шмотки ниже. Своих CSS-классов и стилей не пиши.
Готовые фрагменты (раскладки, счётчики, статусы, прогресс, карта активности, пустое состояние, уведомления, история версий)
лежат в `node_modules/shmotka/package/snippets/*.html` и на витрине — начинай с них, а не с нуля.

## Подключение (уже сделано в проекте, для справки)

```css
@import "tailwindcss";
@plugin "daisyui" { themes: false; }
@import "shmotka";
```

Шрифты Space Grotesk, Inter, JetBrains Mono — тегом `<link>` Google Fonts в `<head>`.
Тема: `shmotka-dark` / `shmotka-light` в `data-theme` на `<html>`; без атрибута — по настройке системы.
Акцент проекта: `data-accent="ideahub|iskra|finance"` на `<html>` или `--shm-accent` в CSS. Telegram Mini App: `import { connectTelegram } from 'shmotka/telegram'; connectTelegram();`.

## Цвет

- Никаких hex, `rgb()` и цветов палитры Tailwind (`bg-gray-*`, `text-blue-*`) — только смысловые классы:
  - фон и поверхности: `bg-base-100` (страница), `bg-base-200` (карточки, панели, таблицы), `bg-base-300` (вложенный уровень, дорожки, наведение);
  - текст: `text-base-content` (основной), `text-muted` (подписи, метаданные), `text-subtle` (только декор);
  - линии: `border-line` (разделители, рамки карточек), `border-line-strong` (пунктир, заметные рамки);
  - акцент: `btn-primary`, `text-primary`, `bg-primary-soft` + `text-primary-text` (мягкая подложка и текст на ней);
  - состояния: `success`, `warning`, `error`, `info` у компонентов (`badge-success`, `alert-warning`) и мягкие подложки `bg-success-soft`, `bg-warning-soft`, `bg-danger-soft`, `bg-info-soft`;
  - карта активности: `bg-heat-0` … `bg-heat-4`.
- **Один акцент.** `btn-primary` — одно главное действие на экране. `secondary` и `accent` daisyUI — тот же цвет, не используй их для разнообразия.
- Статус показывай словом и формой, не только цветом: `badge badge-soft badge-success` + `<span class="status status-success">` + «Готово».

## Шрифт и текст

- Заголовки — `font-display` (Space Grotesk), `font-semibold`. Текст — шрифт по умолчанию (Inter).
- Машинное — `font-mono` (JetBrains Mono): версии, номера, идентификаторы, надписи над числами (`font-mono text-xs uppercase tracking-widest text-muted`).
- Версия — `font-mono text-success` («v0.2.0»).
- Интерфейс по-русски, по делу: кнопка называет действие («Записать», «Начать проект»), уведомление — результат («Сохранено»),
  ошибка — что случилось и что сделать («Не получилось сохранить: нет связи. Попробуйте ещё раз»).
- Даты по-человечески: «сегодня», «вчера», «14 ноября»; время — 24 часа.

## Форма

- Тонкие линии вместо теней: карточка — `card bg-base-200 border border-line`. Тень (`shadow-lg`) — только у всплывающего: меню, окно, уведомление.
- Скругления — классами `rounded-sm` (6px), `rounded-md` (10px), `rounded-lg` (14px), `rounded-xl` (22px, крупные карточки на телефоне), `rounded-box`.
- Сначала сводка, потом подробности: счётчики (`stats`), статусы, следующий шаг (`bg-primary-soft`) — вверху; детали ниже или в скрываемых панелях.
- Пустое состояние подсказывает первый шаг: пунктирная рамка, одна строка и кнопка (фрагмент «Пустое состояние»).

## Компоненты daisyUI, которые чаще всего нужны

`btn`, `input`, `select`, `textarea`, `fieldset`, `checkbox`, `toggle`, `badge`, `status`, `card`, `table`, `stats`, `progress`,
`radial-progress`, `steps`, `tabs` (`tabs-box` — переключатель вида, `tabs-border` — вкладки раздела), `join`, `menu`, `drawer`
(страница с боковым меню), `dropdown`, `modal`, `toast` + `alert`, `timeline` (история версий), `dock` (нижняя навигация на телефоне), `filter`.

## Иконки и доступность

- Иконки — Lucide, 16px в кнопках и строках, 22px в нижней навигации, цвет `currentColor`. Эмодзи в интерфейсе не используем.
- Видимый фокус у всего интерактивного — даёт daisyUI, не отключай `outline`.
- Цели касания на телефоне — от 44px. Анимации уважают `prefers-reduced-motion` (`motion-safe:`).
