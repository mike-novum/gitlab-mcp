# Tasks

## 1. Инициализация проекта и базовой структуры

- [x] 1.1 Настроить `package.json`, `tsconfig.json` и установить основные зависимости (`@modelcontextprotocol/sdk`, `@gitbeaker/rest`, `commander`, `dotenv`, `zod`, `strip-ansi`) и dev-зависимости (`typescript`, `vitest`, `@types/node`). Проверить успешность установки и компиляции через `npm run build`.
- [x] 1.2 Создать модульную структуру каталогов (`src/config/`, `src/client/`, `src/modules/`, `src/utils/`, `src/index.ts`). Проверить наличие всех директорий и базовых файлов.

## 2. Конфигурация и GitLab клиент

- [x] 2.1 Реализовать парсер конфигурации в `src/config/index.ts` с поддержкой каскада приоритетов (CLI > ENV > .env > defaults), флагов `--env-file` и `--tools`. Написать юнит-тесты в `tests/config.test.ts` и проверить их прохождение.
- [x] 2.2 Реализовать инициализацию клиента GitLab в `src/client/gitlab.ts` с обработкой ошибок API (401, 403, 404, 429). Написать юнит-тесты обработки ошибок и проверить их прохождение.

## 3. Модули project-discovery и repository-files

- [x] 3.1 Реализовать модуль `discovery` с функциями разрешения ID проекта (число / путь namespace/project), fallback на `default_project` и инструментом `gitlab_search_projects`. Проверить юнит-тестами в `tests/discovery.test.ts`.
- [x] 3.2 Реализовать модуль `repository` с инструментами `gitlab_read_file` и `gitlab_list_tree`. Проверить тестами с моками GitLab API в `tests/repository.test.ts`.

## 4. Модуль merge-requests

- [x] 4.1 Реализовать инструменты `gitlab_list_mrs` и `gitlab_create_mr` с валидацией входных параметров через Zod. Проверить юнит-тестами в `tests/mr.test.ts`.
- [x] 4.2 Реализовать инструмент `gitlab_get_mr` с агрегацией данных (`include_diff`, `include_discussions`, статус пайплайна), ограничением объема диффа (по умолчанию 500 строк) и фильтром по `file_path`. Проверить тестами агрегации и обрезки диффа.
- [x] 4.3 Реализовать инструменты для комментирования MR: общее комментирование, ответы в существующие треды, а также inline-комментарии к строкам кода в диффе с автоопределением `diff_refs`. Проверить юнит-тестами в `tests/mr.test.ts`.

## 5. Модуль ci-pipelines

- [x] 5.1 Реализовать инструмент `gitlab_list_pipelines` с фильтрами по статусу и ветке, а также `gitlab_retry_pipeline`. Проверить юнит-тестами в `tests/ci.test.ts`.
- [x] 5.2 Реализовать инструмент `gitlab_get_pipeline` с поддержкой флага `show_trace`, автоматическим сбором логов упавших джоб, очисткой ANSI-символов (`strip-ansi`) и ограничением хвоста лога. Проверить тестами очистки логов и сборки трейсов.

## 6. Модуль project-settings

- [x] 6.1 Реализовать инструменты управления защищенными ветками (`gitlab_list_protected_branches`, `gitlab_protect_branch`, `gitlab_unprotect_branch`) и тегами (`gitlab_list_protected_tags`, `gitlab_protect_tag`, `gitlab_unprotect_tag`). Проверить юнит-тестами в `tests/settings.test.ts`.
- [x] 6.2 Реализовать инструменты `gitlab_get_project_settings` и `gitlab_update_project_settings` (дефолтная ветка, видимость, параметры слияния MR, настройки CI/CD). Проверить тестами обновления настроек.

## 7. Сборка, CLI точка входа и сквозная верификация

- [x] 7.1 Реализовать точку входа `src/index.ts`, подключающую `stdio` транспорт SDK MCP и выборочно регистрирующую модули инструментов на основе активных параметров `--tools`. Проверить, что запуск с `--tools mr` регистрирует только инструменты MR.
- [x] 7.2 Настроить скрипты `build`, `test` и бинарный файл `bin` в `package.json`. Выполнить сборку `npm run build` и полный прогон тестов `npm test`, убедиться в отсутствии ошибок.
