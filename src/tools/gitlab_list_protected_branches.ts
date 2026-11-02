import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_list_protected_branches',
    'List all protected branches in a GitLab project.',
    {
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const branches: any[] = (await client.ProtectedBranches.all(targetProject)) as any[];

        const formatted = branches.map((b) => ({
          name: b.name,
          push_access_levels: b.push_access_levels?.map((lvl: any) => ({
            access_level: lvl.access_level,
            access_level_description: lvl.access_level_description,
          })),
          merge_access_levels: b.merge_access_levels?.map((lvl: any) => ({
            access_level: lvl.access_level,
            access_level_description: lvl.access_level_description,
          })),
          allow_force_push: b.allow_force_push,
          code_owner_approval_required: b.code_owner_approval_required,
        }));

        return jsonResult(formatted);
      });
    }
  );
}
