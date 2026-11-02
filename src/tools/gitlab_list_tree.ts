import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_list_tree',
    'List files and directories in a GitLab repository tree.',
    {
      path: z.string().optional().default('').describe('Path inside the repository to list (default is root)'),
      ref: z.string().optional().default('main').describe('Branch, tag, or commit SHA (defaults to "main")'),
      recursive: z.boolean().optional().default(false).describe('Whether to list recursively'),
      limit: z.number().optional().default(100).describe('Maximum number of items to return'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ path, ref, recursive, limit, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const tree = await client.Repositories.allRepositoryTrees(targetProject, {
          path,
          ref,
          recursive,
          perPage: limit,
          maxPages: 1,
        });

        const formatted = tree.map((item: any) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          path: item.path,
          mode: item.mode,
        }));

        return jsonResult(formatted);
      });
    }
  );
}
