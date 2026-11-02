# Spec Delta

## Purpose

Управление параметрами проекта в GitLab, включая защищенные ветки и теги, выбор ветки по умолчанию, правила слияния Merge Requests и настройки CI/CD.

## ADDED Requirements

### Requirement: Управление защищенными ветками
Сервер ДОЛЖЕН предоставлять инструменты `gitlab_list_protected_branches`, `gitlab_protect_branch` и `gitlab_unprotect_branch` для просмотра, установки и снятия правил защиты веток (уровни доступа на push, merge, force push).

#### Scenario: Защита новой релизной ветки
- **WHEN** агент вызывает `gitlab_protect_branch(name="release/*", push_access_level=40, merge_access_level=40, allow_force_push=false)`
- **THEN** ветка или маска веток защищается с указанными уровнями доступа (Maintainer) и запретом force push

#### Scenario: Снятие защиты с ветки
- **WHEN** агент вызывает `gitlab_unprotect_branch(name="feature-frozen")`
- **THEN** правило защиты для указанной ветки удаляется

### Requirement: Управление защищенными тегами
Сервер ДОЛЖЕН предоставлять инструменты `gitlab_list_protected_tags`, `gitlab_protect_tag` и `gitlab_unprotect_tag` для контроля прав на создание тегов.

#### Scenario: Создание правила защиты тегов
- **WHEN** агент вызывает `gitlab_protect_tag(name="v*", create_access_level=40)`
- **THEN** создание тегов по шаблону `v*` разрешается только Maintainers

### Requirement: Чтение и обновление общих настроек проекта
Сервер ДОЛЖЕН предоставлять инструменты `gitlab_get_project_settings` и `gitlab_update_project_settings` для просмотра и изменения параметров проекта, включая ветку по умолчанию, видимость репозитория и политики доступа.

#### Scenario: Смена ветки по умолчанию
- **WHEN** агент вызывает `gitlab_update_project_settings(default_branch="main")`
- **THEN** в GitLab проект обновляется, и ветка `main` становится дефолтной

### Requirement: Управление политиками слияния Merge Requests
Сервер ДОЛЖЕН поддерживать изменение параметров слияния MR через `gitlab_update_project_settings`, включая методы слияния (`merge_method`), требование успешного пайплайна и резолва всех дискуссий.

#### Scenario: Включение строгих требований к слиянию MR
- **WHEN** агент вызывает обновление настроек с параметрами `only_allow_merge_if_pipeline_succeeds=true`, `only_allow_merge_if_all_discussions_are_resolved=true`, `merge_method="rebase_merge"`
- **THEN** GitLab применяет настройки, блокирующие слияние MR при падении CI или наличии нерешенных тредов

### Requirement: Управление настройками CI/CD проекта
Сервер ДОЛЖЕН поддерживать конфигурацию параметров CI/CD через `gitlab_update_project_settings`, включая путь к файлу конфигурации CI (`ci_config_path`) и авто-отмену устаревших пайплайнов (`auto_cancel_pending_pipelines`).

#### Scenario: Установка кастомного пути к файлу пайплайна
- **WHEN** агент вызывает обновление настроек с `ci_config_path=".gitlab/ci/main.yml"`
- **THEN** путь к пайплайну в настройках проекта обновляется на указанное значение
