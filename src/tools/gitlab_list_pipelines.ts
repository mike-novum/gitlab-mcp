import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_list_pipelines',
    'List CI/CD pipelines in a GitLab project with optional filtering by ref and status.',
    {
      ref: z.string().optional().describe('Branch or tag name'),
      status: z.enum(['running', 'pending', 'success', 'failed', 'canceled', 'skipped', 'manual']).optional().describe('Filter by pipeline status'),
      limit: z.number().optional().default(10).describe('Maximum number of pipelines to return'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ ref, status, limit, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const options: Record<string, any> = {
          perPage: limit,
          maxPages: 1,
        };

        if (ref) options.ref = ref;
        if (status) options.status = status;

        const pipelines = await client.Pipelines.all(targetProject, options);

        const formatted = pipelines.map((p: any) => ({
          id: p.id,
          status: p.status,
          ref: p.ref,
          sha: p.sha,
          source: p.source,
          web_url: p.web_url,
          created_at: p.created_at,
          updated_at: p.updated_at,
        }));

        return jsonResult(formatted);
      });
    }
  );
}
