import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient, resolveUserIds } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

const userRefs = z
  .array(z.union([z.number(), z.string()]))
  .optional();

function applyDraft(title: string, draft: boolean): string {
  const stripped = title.replace(/^(?:Draft:|WIP:)\s*/i, '');
  return draft ? `Draft: ${stripped}` : stripped;
}

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_update_mr',
    'Update an existing merge request: title, description, target branch, labels, assignees, reviewers, draft state, and merge options.',
    {
      mr_iid: z.number().describe('Merge Request IID'),
      title: z.string().optional().describe('New title'),
      description: z.string().optional().describe('New description'),
      target_branch: z.string().optional().describe('New target branch'),
      draft: z.boolean().optional().describe('Mark the merge request as draft or remove the draft prefix from the title'),
      assignee_ids: userRefs.describe('Assignees as GitLab user IDs or usernames. An empty list clears assignees'),
      reviewer_ids: userRefs.describe('Reviewers as GitLab user IDs or usernames. An empty list clears reviewers'),
      labels: z.string().optional().describe('Comma-separated labels. Replaces the current set'),
      add_labels: z.string().optional().describe('Comma-separated labels to add'),
      remove_labels: z.string().optional().describe('Comma-separated labels to remove'),
      milestone_id: z.number().int().optional().describe('Milestone ID. Use 0 to remove the milestone'),
      state_event: z.enum(['close', 'reopen']).optional().describe('Close or reopen the merge request'),
      remove_source_branch: z.boolean().optional().describe('Whether to delete the source branch after merge'),
      squash: z.boolean().optional().describe('Whether to squash commits when merging'),
      discussion_locked: z.boolean().optional().describe('Whether discussions are locked'),
      allow_collaboration: z.boolean().optional().describe('Allow commits from members who can merge to the target branch'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({
      mr_iid,
      title,
      description,
      target_branch,
      draft,
      assignee_ids,
      reviewer_ids,
      labels,
      add_labels,
      remove_labels,
      milestone_id,
      state_event,
      remove_source_branch,
      squash,
      discussion_locked,
      allow_collaboration,
      project_id,
    }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const options: Record<string, any> = {};

        if (draft !== undefined) {
          let baseTitle = title;
          if (baseTitle === undefined) {
            const current: any = await client.MergeRequests.show(targetProject, mr_iid);
            baseTitle = typeof current.title === 'string' ? current.title : '';
          }
          options.title = applyDraft(baseTitle ?? '', draft);
        } else if (title !== undefined) {
          options.title = title;
        }
        if (description !== undefined) options.description = description;
        if (target_branch !== undefined) options.targetBranch = target_branch;
        if (labels !== undefined) options.labels = labels;
        if (add_labels !== undefined) options.addLabels = add_labels;
        if (remove_labels !== undefined) options.removeLabels = remove_labels;
        if (milestone_id !== undefined) options.milestoneId = milestone_id;
        if (state_event !== undefined) options.stateEvent = state_event;
        if (remove_source_branch !== undefined) options.removeSourceBranch = remove_source_branch;
        if (squash !== undefined) options.squash = squash;
        if (discussion_locked !== undefined) options.discussionLocked = discussion_locked;
        if (allow_collaboration !== undefined) options.allowCollaboration = allow_collaboration;

        if (assignee_ids !== undefined) {
          options.assigneeIds = await resolveUserIds(client, assignee_ids);
        }

        if (reviewer_ids !== undefined) {
          options.reviewerIds = await resolveUserIds(client, reviewer_ids);
        }

        if (Object.keys(options).length === 0) {
          throw new Error('At least one merge request field must be provided to update.');
        }

        const updated: any = await client.MergeRequests.edit(targetProject, mr_iid, options);

        return jsonResult({
          iid: updated.iid,
          title: updated.title,
          description: updated.description,
          state: updated.state,
          draft: updated.draft || updated.work_in_progress,
          source_branch: updated.source_branch,
          target_branch: updated.target_branch,
          assignees: (updated.assignees || []).map((user: any) => ({
            id: user.id,
            username: user.username,
            name: user.name,
          })),
          reviewers: (updated.reviewers || []).map((user: any) => ({
            id: user.id,
            username: user.username,
            name: user.name,
          })),
          labels: updated.labels,
          milestone: updated.milestone
            ? { id: updated.milestone.id, title: updated.milestone.title }
            : null,
          squash: updated.squash,
          discussion_locked: updated.discussion_locked,
          remove_source_branch: updated.force_remove_source_branch,
          web_url: updated.web_url,
        });
      });
    }
  );
}
