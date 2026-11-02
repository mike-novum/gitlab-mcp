import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, _config: ServerConfig): void {
  server.tool(
    'gitlab_search_projects',
    'Search for GitLab projects by name or path to discover project IDs and namespace paths.',
    {
      query: z.string().describe('Search query string (e.g. project name or part of path)'),
      limit: z.number().optional().default(20).describe('Maximum number of projects to return'),
    },
    async ({ query, limit }) => {
      return withGitlabErrors(async () => {
        const projects = await client.Projects.all({
          search: query,
          maxPages: 1,
          perPage: limit,
        });

        const formatted = projects.map((p: any) => ({
          id: p.id,
          name: p.name,
          path_with_namespace: p.path_with_namespace,
          description: p.description || '',
          default_branch: p.default_branch,
          web_url: p.web_url,
        }));

        return jsonResult(formatted);
      });
    }
  );
}
