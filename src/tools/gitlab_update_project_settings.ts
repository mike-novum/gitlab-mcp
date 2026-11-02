import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_update_project_settings',
    'Update project settings such as default branch, visibility, merge policies, and CI configuration path.',
    {
      default_branch: z.string().optional().describe('Default branch for repository'),
      visibility: z.enum(['private', 'internal', 'public']).optional().describe('Project visibility'),
      ci_config_path: z.string().optional().describe('Custom path to CI/CD configuration file (e.g. ".gitlab-ci.yml")'),
      auto_cancel_pending_pipelines: z.enum(['enabled', 'disabled']).optional().describe('Auto-cancel pending pipelines on new commits'),
      merge_method: z.enum(['merge', 'rebase_merge', 'ff']).optional().describe('Merge method for merge requests'),
      squash_option: z.enum(['never', 'always', 'default_on', 'default_off']).optional().describe('Squash commits policy for merge requests'),
      only_allow_merge_if_pipeline_succeeds: z.boolean().optional().describe('Require successful pipeline before merge'),
      only_allow_merge_if_all_discussions_are_resolved: z.boolean().optional().describe('Require all discussions to be resolved before merge'),
      remove_source_branch_after_merge: z.boolean().optional().describe('Delete source branch on merge by default'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({
      default_branch,
      visibility,
      ci_config_path,
      auto_cancel_pending_pipelines,
      merge_method,
      squash_option,
      only_allow_merge_if_pipeline_succeeds,
      only_allow_merge_if_all_discussions_are_resolved,
      remove_source_branch_after_merge,
      project_id,
    }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const options: Record<string, any> = {};

        if (default_branch !== undefined) options.defaultBranch = default_branch;
        if (visibility !== undefined) options.visibility = visibility;
        if (ci_config_path !== undefined) options.ciConfigPath = ci_config_path;
        if (auto_cancel_pending_pipelines !== undefined) options.autoCancelPendingPipelines = auto_cancel_pending_pipelines;
        if (merge_method !== undefined) options.mergeMethod = merge_method;
        if (squash_option !== undefined) options.squashOption = squash_option;
        if (only_allow_merge_if_pipeline_succeeds !== undefined) {
          options.onlyAllowMergeIfPipelineSucceeds = only_allow_merge_if_pipeline_succeeds;
        }
        if (only_allow_merge_if_all_discussions_are_resolved !== undefined) {
          options.onlyAllowMergeIfAllDiscussionsAreResolved = only_allow_merge_if_all_discussions_are_resolved;
        }
        if (remove_source_branch_after_merge !== undefined) {
          options.removeSourceBranchAfterMerge = remove_source_branch_after_merge;
        }

        const updated: any = await client.Projects.edit(targetProject, options);

        return jsonResult({
          id: updated.id,
          name: updated.name,
          default_branch: updated.default_branch,
          visibility: updated.visibility,
          ci_config_path: updated.ci_config_path,
          merge_method: updated.merge_method,
          only_allow_merge_if_pipeline_succeeds: updated.only_allow_merge_if_pipeline_succeeds,
          only_allow_merge_if_all_discussions_are_resolved: updated.only_allow_merge_if_all_discussions_are_resolved,
        });
      });
    }
  );
}
