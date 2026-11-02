import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_create_mr_note',
    'Add a general comment to an MR, reply to an existing discussion, or add an inline code comment to a specific line in the diff.',
    {
      mr_iid: z.number().describe('Merge Request IID'),
      body: z.string().describe('Comment content / markdown body'),
      discussion_id: z.string().optional().describe('Optional ID of existing discussion thread to reply to'),
      path: z.string().optional().describe('File path for inline diff comment (e.g. "src/index.ts")'),
      line: z.number().optional().describe('Line number in the new version of the file for inline comment'),
      old_line: z.number().optional().describe('Line number in the old version of the file (if removed/modified)'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ mr_iid, body, discussion_id, path, line, old_line, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);

        if (discussion_id) {
          const note: any = await client.MergeRequestDiscussions.addNote(
            targetProject,
            mr_iid,
            discussion_id,
            body
          );
          return jsonResult({ id: note.id, body: note.body, discussion_id });
        }

        if (path && (line !== undefined || old_line !== undefined)) {
          const mr: any = await client.MergeRequests.show(targetProject, mr_iid);
          const diffRefs = mr.diff_refs;
          if (!diffRefs) {
            throw new Error('Unable to resolve diff_refs for MR to place inline comment.');
          }

          const position: Record<string, any> = {
            baseSha: diffRefs.base_sha,
            startSha: diffRefs.start_sha,
            headSha: diffRefs.head_sha,
            positionType: 'text',
            newPath: path,
            oldPath: path,
          };

          if (line !== undefined) {
            position.newLine = line;
          }
          if (old_line !== undefined) {
            position.oldLine = old_line;
          }

          const discussion: any = await client.MergeRequestDiscussions.create(
            targetProject,
            mr_iid,
            body,
            { position: position as any }
          );

          return jsonResult({
            discussion_id: discussion.id,
            notes: discussion.notes?.map((n: any) => ({ id: n.id, body: n.body })),
          });
        }

        const note: any = await client.MergeRequestNotes.create(targetProject, mr_iid, body);
        return jsonResult({ id: note.id, body: note.body });
      });
    }
  );
}
