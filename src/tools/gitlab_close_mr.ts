import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_close_mr',
    'Close an open merge request without merging it.',
    {
      mr_iid: z.number().describe('Merge Request IID'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ mr_iid, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const closed: any = await client.MergeRequests.edit(targetProject, mr_iid, {
          stateEvent: 'close',
        });

        return jsonResult({
          iid: closed.iid,
          title: closed.title,
          state: closed.state,
          web_url: closed.web_url,
        });
      });
    }
  );
}
