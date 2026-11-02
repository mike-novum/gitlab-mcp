import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { resolveProjectId, textResult, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_read_file',
    'Read the content of a file in a GitLab repository at a specific branch, tag, or commit.',
    {
      file_path: z.string().describe('Full path to the file in the repository (e.g. "src/index.ts")'),
      ref: z.string().optional().default('main').describe('Branch, tag, or commit SHA (defaults to "main")'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ file_path, ref, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const file = await client.RepositoryFiles.show(targetProject, file_path, ref);

        let content = '';
        if (file.encoding === 'base64' && file.content) {
          content = Buffer.from(file.content, 'base64').toString('utf-8');
        } else {
          content = file.content || '';
        }

        return textResult(content);
      });
    }
  );
}
