import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient, resolveUserIds } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_create_mr',
    'Create a new merge request in a GitLab project.',
    {
      source_branch: z.string().describe('Source branch containing changes'),
      target_branch: z.string().describe('Target branch to merge changes into (e.g. "main")'),
      title: z.string().describe('Title of the merge request'),
      description: z.string().optional().describe('Description / body of the merge request'),
      draft: z.boolean().optional().default(false).describe('Whether to create as draft / work-in-progress'),
      remove_source_branch: z.boolean().optional().default(true).describe('Whether to delete source branch after merge'),
      squash: z.boolean().optional().default(false).describe('Whether to squash commits when merging'),
      labels: z.string().optional().describe('Comma-separated list of labels'),
      assignee_ids: z
        .array(z.union([z.number(), z.string()]))
        .optional()
        .describe('Assignees as GitLab user IDs or usernames'),
      reviewer_ids: z
        .array(z.union([z.number(), z.string()]))
        .optional()
        .describe('Reviewers as GitLab user IDs or usernames'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({
      source_branch,
      target_branch,
      title,
      description,
      draft,
      remove_source_branch,
      squash,
      labels,
      assignee_ids,
      reviewer_ids,
      project_id,
    }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const finalTitle = draft && !title.startsWith('Draft:') ? `Draft: ${title}` : title;

        const options: Record<string, any> = {
          description: description || '',
          removeSourceBranch: remove_source_branch,
          squash,
        };

        if (labels) {
          options.labels = labels;
        }

        if (assignee_ids !== undefined) {
          options.assigneeIds = await resolveUserIds(client, assignee_ids);
        }

        if (reviewer_ids !== undefined) {
          options.reviewerIds = await resolveUserIds(client, reviewer_ids);
        }

        const newMr: any = await client.MergeRequests.create(
          targetProject,
          source_branch,
          target_branch,
          finalTitle,
          options
        );

        return jsonResult({
          iid: newMr.iid,
          title: newMr.title,
          state: newMr.state,
          source_branch: newMr.source_branch,
          target_branch: newMr.target_branch,
          assignees: (newMr.assignees || []).map((user: any) => ({
            id: user.id,
            username: user.username,
            name: user.name,
          })),
          reviewers: (newMr.reviewers || []).map((user: any) => ({
            id: user.id,
            username: user.username,
            name: user.name,
          })),
          web_url: newMr.web_url,
        });
      });
    }
  );
}
