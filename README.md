# GitLab MCP Server

MCP-сервер для GitLab. Транспорт `stdio`. Даёт ассистенту инструменты для поиска проектов, файлов репозитория, merge request, CI и настроек проекта.

`project_id` в инструментах — числовой ID или путь `namespace/project`. Если параметр опущен, используется `GITLAB_DEFAULT_PROJECT`.

## Подключение

```bash
npm install
npm run build
```

Точка входа: `dist/index.js`.

Приоритет настроек: флаги CLI, затем переменные окружения процесса, затем `.env`, затем значения по умолчанию.

| Параметр | CLI | Переменная | По умолчанию |
| --- | --- | --- | --- |
| Токен | `--token`, `-t` | `GITLAB_TOKEN` | обязателен |
| URL API | `--url`, `-u` | `GITLAB_API_URL` | `https://gitlab.com/api/v4` |
| Проект | `--default-project`, `-p` | `GITLAB_DEFAULT_PROJECT` | нет |
| Модули | `--tools` | `GITLAB_MCP_TOOLS` | `all` |
| Файл окружения | `--env-file` | — | `.env` в текущей директории |

Модули `--tools`: `mr`, `repository`, `ci`, `settings`, `discovery`. Несколько модулей через запятую. `all` включает все.

Токену нужны права на вызываемые операции. Для настроек проекта обычно нужен Maintainer.

### Cursor

`.cursor/mcp.json` в проекте или пользовательский MCP-конфиг:

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["/ABS/PATH/gitlab-mcp/dist/index.js"],
      "env": {
        "GITLAB_TOKEN": "glpat-...",
        "GITLAB_API_URL": "https://gitlab.com/api/v4",
        "GITLAB_DEFAULT_PROJECT": "group/project",
        "GITLAB_MCP_TOOLS": "all"
      }
    }
  }
}
```

Для self-hosted GitLab укажите `GITLAB_API_URL`, например `https://gitlab.example.com/api/v4`.

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gitlab": {
      "command": "node",
      "args": ["/ABS/PATH/gitlab-mcp/dist/index.js"],
      "env": {
        "GITLAB_TOKEN": "glpat-...",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add gitlab -- node /ABS/PATH/gitlab-mcp/dist/index.js
```

Переменные окружения задайте в окружении процесса или через `--env-file`.

## Инструменты

### discovery

- `gitlab_search_projects` — поиск проектов по имени или пути. Параметры: `query`, `limit`.

### repository

- `gitlab_read_file` — содержимое файла. Параметры: `file_path`, `ref`, `project_id`.
- `gitlab_list_tree` — дерево файлов и каталогов. Параметры: `path`, `ref`, `recursive`, `limit`, `project_id`.

### mr

- `gitlab_list_mrs` — список merge request. Параметры: `state`, `target_branch`, `source_branch`, `author_username`, `reviewer_username`, `limit`, `project_id`.
- `gitlab_get_mr` — карточка MR. Опционально дифф, обсуждения и статус пайплайна. Параметры: `mr_iid`, `include_diff`, `include_discussions`, `file_path`, `max_diff_lines`, `project_id`. Дифф обрезается, по умолчанию 500 строк.
- `gitlab_create_mr` — создание MR. Параметры: `source_branch`, `target_branch`, `title`, `description`, `draft`, `remove_source_branch`, `squash`, `labels`, `project_id`.
- `gitlab_create_mr_note` — комментарий к MR, ответ в тред или inline-комментарий к строке диффа. Параметры: `mr_iid`, `body`, `discussion_id`, `path`, `line`, `old_line`, `project_id`. Для inline-комментария `diff_refs` запрашиваются у MR автоматически.

### ci

- `gitlab_list_pipelines` — список пайплайнов. Параметры: `ref`, `status`, `limit`, `project_id`.
- `gitlab_get_pipeline` — пайплайн, стадии и джобы. При `show_trace=true` для упавших джоб возвращается хвост лога без ANSI-кодов. Параметры: `pipeline_id`, `show_trace`, `tail_lines`, `project_id`. Хвост по умолчанию 200 строк.
- `gitlab_retry_pipeline` — повтор пайплайна. Параметры: `pipeline_id`, `project_id`.

### settings

- `gitlab_list_protected_branches` — защищённые ветки. Параметр: `project_id`.
- `gitlab_protect_branch` — защита ветки или шаблона. Параметры: `name`, `push_access_level`, `merge_access_level`, `allow_force_push`, `code_owner_approval_required`, `project_id`.
- `gitlab_unprotect_branch` — снятие защиты ветки. Параметры: `name`, `project_id`.
- `gitlab_list_protected_tags` — защищённые теги. Параметр: `project_id`.
- `gitlab_protect_tag` — защита тега или шаблона. Параметры: `name`, `create_access_level`, `project_id`.
- `gitlab_unprotect_tag` — снятие защиты тега. Параметры: `name`, `project_id`.
- `gitlab_get_project_settings` — текущие настройки проекта. Параметр: `project_id`.
- `gitlab_update_project_settings` — изменение настроек. Параметры: `default_branch`, `visibility`, `ci_config_path`, `auto_cancel_pending_pipelines`, `merge_method`, `squash_option`, `only_allow_merge_if_pipeline_succeeds`, `only_allow_merge_if_all_discussions_are_resolved`, `remove_source_branch_after_merge`, `project_id`.

Уровни доступа в защите веток и тегов: `0` — нет доступа, `30` — Developer, `40` — Maintainer, `60` — Admin.

## Релиз

Push в `master` запускает semantic-release. Версия считается по [Conventional Commits](https://www.conventionalcommits.org/): `fix` — patch, `feat` — minor, `feat!` или `BREAKING CHANGE` — major. В GitHub Release прикрепляется собранный `index.js`. `CHANGELOG.md` и поле `version` обновляются автоматически.
