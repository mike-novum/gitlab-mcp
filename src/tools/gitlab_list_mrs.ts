import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_list_mrs',
    'List merge requests in a GitLab project with optional filtering.',
    {
      state: z.enum(['opened', 'closed', 'merged', 'all']).optional().default('opened').describe('State of the merge requests'),
      target_branch: z.string().optional().describe('Filter by target branch (e.g. "main")'),
      source_branch: z.string().optional().describe('Filter by source branch'),
      author_username: z.string().optional().describe('Filter by author username'),
      reviewer_username: z.string().optional().describe('Filter by reviewer username'),
      limit: z.number().optional().default(20).describe('Maximum number of MRs to return'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ state, target_branch, source_branch, author_username, reviewer_username, limit, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const options: Record<string, any> = {
          state,
          perPage: limit,
          maxPages: 1,
        };

        if (target_branch) options.targetBranch = target_branch;
        if (source_branch) options.sourceBranch = source_branch;
        if (author_username) options.authorUsername = author_username;
        if (reviewer_username) options.reviewerUsername = reviewer_username;

        const mrs = await client.MergeRequests.all({
          projectId: targetProject,
          ...options,
        });

        const formatted = mrs.map((mr: any) => ({
          iid: mr.iid,
          title: mr.title,
          description: mr.description,
          state: mr.state,
          source_branch: mr.source_branch,
          target_branch: mr.target_branch,
          author: mr.author ? { id: mr.author.id, username: mr.author.username, name: mr.author.name } : null,
          has_conflicts: mr.has_conflicts,
          draft: mr.draft || mr.work_in_progress,
          web_url: mr.web_url,
          created_at: mr.created_at,
          updated_at: mr.updated_at,
        }));

        return jsonResult(formatted);
      });
    }
  );
}
