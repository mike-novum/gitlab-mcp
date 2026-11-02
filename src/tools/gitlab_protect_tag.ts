import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_protect_tag',
    'Protect a tag or wildcard tag pattern in a repository.',
    {
      name: z.string().describe('Tag name or pattern (e.g. "v*" or "release-*")'),
      create_access_level: z.number().optional().default(40).describe('Access level allowed to create tag: 0 (No access), 30 (Developer), 40 (Maintainer)'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ name, create_access_level, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const result: any = await client.ProtectedTags.protect(targetProject, name, {
          createAccessLevel: create_access_level,
        });

        return jsonResult({
          name: result.name,
          create_access_levels: result.create_access_levels,
        });
      });
    }
  );
}
