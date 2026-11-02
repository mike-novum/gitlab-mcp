import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { formatAndTruncateDiffs, jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_get_mr',
    'Get detailed information about a merge request, optionally including diffs, discussions/comments, and pipeline status.',
    {
      mr_iid: z.number().describe('Merge Request IID'),
      include_diff: z.boolean().optional().default(false).describe('Whether to include code diffs'),
      include_discussions: z.boolean().optional().default(false).describe('Whether to include review comments and discussion threads'),
      file_path: z.string().optional().describe('Specific file path to get diff for (when include_diff is true)'),
      max_diff_lines: z.number().optional().default(500).describe('Maximum total lines of diff to include before truncation'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ mr_iid, include_diff, include_discussions, file_path, max_diff_lines, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const mr: any = await client.MergeRequests.show(targetProject, mr_iid);

        const result: Record<string, any> = {
          iid: mr.iid,
          title: mr.title,
          description: mr.description,
          state: mr.state,
          source_branch: mr.source_branch,
          target_branch: mr.target_branch,
          draft: mr.draft || mr.work_in_progress,
          author: mr.author ? { id: mr.author.id, username: mr.author.username, name: mr.author.name } : null,
          assignees: (mr.assignees || []).map((a: any) => ({ id: a.id, username: a.username, name: a.name })),
          reviewers: (mr.reviewers || []).map((r: any) => ({ id: r.id, username: r.username, name: r.name })),
          web_url: mr.web_url,
          head_pipeline: mr.head_pipeline
            ? {
                id: mr.head_pipeline.id,
                status: mr.head_pipeline.status,
                ref: mr.head_pipeline.ref,
                sha: mr.head_pipeline.sha,
                web_url: mr.head_pipeline.web_url,
              }
            : null,
        };

        if (include_diff) {
          const rawDiffs = await client.MergeRequests.allDiffs(targetProject, mr_iid);
          result.diff_data = formatAndTruncateDiffs(rawDiffs as any[], max_diff_lines, file_path);
        }

        if (include_discussions) {
          const discussions = await client.MergeRequestDiscussions.all(targetProject, mr_iid);
          result.discussions = (discussions as any[]).map((disc: any) => ({
            id: disc.id,
            individual_note: disc.individual_note,
            notes: (disc.notes || []).map((note: any) => ({
              id: note.id,
              author: note.author?.username,
              body: note.body,
              system: note.system,
              created_at: note.created_at,
              position: note.position,
              resolvable: note.resolvable,
              resolved: note.resolved,
            })),
          }));
        }

        return jsonResult(result);
      });
    }
  );
}
