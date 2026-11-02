import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_retry_pipeline',
    'Retry a failed or canceled CI/CD pipeline.',
    {
      pipeline_id: z.number().describe('Pipeline ID to retry'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ pipeline_id, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const retried: any = await client.Pipelines.retry(targetProject, pipeline_id);

        return jsonResult({
          id: retried.id,
          status: retried.status,
          ref: retried.ref,
          web_url: retried.web_url,
        });
      });
    }
  );
}
