import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_get_project_settings',
    'Get current configuration and general settings for a GitLab project.',
    {
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const p: any = await client.Projects.show(targetProject);

        return jsonResult({
          id: p.id,
          name: p.name,
          path_with_namespace: p.path_with_namespace,
          default_branch: p.default_branch,
          visibility: p.visibility,
          ci_config_path: p.ci_config_path || '.gitlab-ci.yml',
          auto_cancel_pending_pipelines: p.auto_cancel_pending_pipelines,
          merge_method: p.merge_method,
          squash_option: p.squash_option,
          only_allow_merge_if_pipeline_succeeds: p.only_allow_merge_if_pipeline_succeeds,
          only_allow_merge_if_all_discussions_are_resolved: p.only_allow_merge_if_all_discussions_are_resolved,
          remove_source_branch_after_merge: p.remove_source_branch_after_merge,
        });
      });
    }
  );
}
