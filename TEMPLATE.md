# ideahub-project-template

Шаблон для всех проектов, которые реализуются из идей IdeaHub (https://ideahub.ast21k.workers.dev).
В новом проекте этот файл можно удалить в первом PR.

## Что внутри
| Файл | Зачем |
|---|---|
| `CHANGELOG.md` | Журнал версий: одна задача — один PR — одна версия |
| `.github/workflows/release.yml` + `.github/scripts/release_notes.py` | После мержа: тег `vX.Y.Z` и GitHub-релиз из CHANGELOG |
| `.github/workflows/ci.yml` | На каждый PR: формат CHANGELOG, новая версия в PR, `scripts/check.sh` |
| `.github/pull_request_template.md` | Версия, идея, закрытые задачи, чек-лист |
| `scripts/check.sh` | Проверки проекта (тесты, линтер) — заполняется под стек |
| `CLAUDE.md` | Правила для нейронок: версии, PR, squash, работа с IdeaHub |
| `.ideahub` | Номер идеи в IdeaHub и версия шаблона, из которой создан проект |

## Как создать проект
1. GitHub → этот репозиторий → **Use this template** → новый репозиторий.
2. Попросить нейронку: «начни проект по идее #N в репозитории …» — она сделает первый PR 0.1.0 по `CLAUDE.md`.

## Версии шаблона
PR в сам шаблон: заголовок `template X.Y.Z: название`, запись здесь и `template_version` в `.ideahub`; squash-merge.
Версия шаблона — в `.ideahub` (`template_version`), история — ниже. Проекты, созданные раньше,
обновляются отдельно: сравнить их `template_version` с текущей и перенести изменения.

### 1.0.1 — 2026-11-13 — Шаблон не выпускает релизы сам себе
- `release.yml` и проверка новой версии в CI не срабатывают в самом шаблоне — и по флагу Template repository, и по имени
  репозитория. В проектах, созданных из шаблона, всё работает как раньше.
- Свою версию шаблон ведёт здесь, в `TEMPLATE.md`, и в `.ideahub` (`template_version`).

### 1.0.0 — 2026-11-13 — Первая версия
- CHANGELOG, релизы из CHANGELOG, CI с проверкой новой версии в каждом PR, шаблон PR, `scripts/check.sh`,
  `CLAUDE.md` с правилами и работой через IdeaHub, `.ideahub`.
