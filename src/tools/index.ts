import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig, ToolModuleName } from '../config.js';
import { register as registerGitlabSearchProjects } from './gitlab_search_projects.js';
import { register as registerGitlabReadFile } from './gitlab_read_file.js';
import { register as registerGitlabListTree } from './gitlab_list_tree.js';
import { register as registerGitlabListMrs } from './gitlab_list_mrs.js';
import { register as registerGitlabGetMr } from './gitlab_get_mr.js';
import { register as registerGitlabCreateMr } from './gitlab_create_mr.js';
import { register as registerGitlabUpdateMr } from './gitlab_update_mr.js';
import { register as registerGitlabCloseMr } from './gitlab_close_mr.js';
import { register as registerGitlabCreateMrNote } from './gitlab_create_mr_note.js';
import { register as registerGitlabListPipelines } from './gitlab_list_pipelines.js';
import { register as registerGitlabGetPipeline } from './gitlab_get_pipeline.js';
import { register as registerGitlabRetryPipeline } from './gitlab_retry_pipeline.js';
import { register as registerGitlabListProtectedBranches } from './gitlab_list_protected_branches.js';
import { register as registerGitlabProtectBranch } from './gitlab_protect_branch.js';
import { register as registerGitlabUnprotectBranch } from './gitlab_unprotect_branch.js';
import { register as registerGitlabListProtectedTags } from './gitlab_list_protected_tags.js';
import { register as registerGitlabProtectTag } from './gitlab_protect_tag.js';
import { register as registerGitlabUnprotectTag } from './gitlab_unprotect_tag.js';
import { register as registerGitlabGetProjectSettings } from './gitlab_get_project_settings.js';
import { register as registerGitlabUpdateProjectSettings } from './gitlab_update_project_settings.js';

export function registerDiscoveryTools(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  registerGitlabSearchProjects(server, client, config);
}

export function registerRepositoryTools(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  registerGitlabReadFile(server, client, config);
  registerGitlabListTree(server, client, config);
}

export function registerMergeRequestTools(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  registerGitlabListMrs(server, client, config);
  registerGitlabGetMr(server, client, config);
  registerGitlabCreateMr(server, client, config);
  registerGitlabUpdateMr(server, client, config);
  registerGitlabCloseMr(server, client, config);
  registerGitlabCreateMrNote(server, client, config);
}

export function registerCiTools(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  registerGitlabListPipelines(server, client, config);
  registerGitlabGetPipeline(server, client, config);
  registerGitlabRetryPipeline(server, client, config);
}

export function registerSettingsTools(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  registerGitlabListProtectedBranches(server, client, config);
  registerGitlabProtectBranch(server, client, config);
  registerGitlabUnprotectBranch(server, client, config);
  registerGitlabListProtectedTags(server, client, config);
  registerGitlabProtectTag(server, client, config);
  registerGitlabUnprotectTag(server, client, config);
  registerGitlabGetProjectSettings(server, client, config);
  registerGitlabUpdateProjectSettings(server, client, config);
}

const MODULE_REGISTRARS: Record<ToolModuleName, (server: McpServer, client: GitlabClient, config: ServerConfig) => void> = {
  discovery: registerDiscoveryTools,
  repository: registerRepositoryTools,
  mr: registerMergeRequestTools,
  ci: registerCiTools,
  settings: registerSettingsTools,
};

export function registerTools(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  const activeTools = new Set<ToolModuleName>(config.tools);

  if (activeTools.has('discovery')) {
    MODULE_REGISTRARS.discovery(server, client, config);
  }
  if (activeTools.has('repository')) {
    MODULE_REGISTRARS.repository(server, client, config);
  }
  if (activeTools.has('mr')) {
    MODULE_REGISTRARS.mr(server, client, config);
  }
  if (activeTools.has('ci')) {
    MODULE_REGISTRARS.ci(server, client, config);
  }
  if (activeTools.has('settings')) {
    MODULE_REGISTRARS.settings(server, client, config);
  }
}
