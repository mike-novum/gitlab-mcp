import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_list_protected_tags',
    'List all protected tags in a GitLab project.',
    {
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const tags: any[] = (await client.ProtectedTags.all(targetProject)) as any[];

        const formatted = tags.map((t) => ({
          name: t.name,
          create_access_levels: t.create_access_levels?.map((lvl: any) => ({
            access_level: lvl.access_level,
            access_level_description: lvl.access_level_description,
          })),
        }));

        return jsonResult(formatted);
      });
    }
  );
}
