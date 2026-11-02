import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { resolveProjectId, textResult, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_unprotect_tag',
    'Unprotect a tag or tag pattern in a repository.',
    {
      name: z.string().describe('Tag name to unprotect'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ name, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        await client.ProtectedTags.unprotect(targetProject, name);
        return textResult(`Tag "${name}" has been unprotected successfully.`);
      });
    }
  );
}
