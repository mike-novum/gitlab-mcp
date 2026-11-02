import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { jsonResult, resolveProjectId, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_protect_branch',
    'Protect a repository branch or wildcard pattern with specific access levels.',
    {
      name: z.string().describe('Branch name or wildcard (e.g. "main" or "release/*")'),
      push_access_level: z.number().optional().default(40).describe('Access level allowed to push: 0 (No access), 30 (Developer), 40 (Maintainer), 60 (Admin)'),
      merge_access_level: z.number().optional().default(40).describe('Access level allowed to merge: 0 (No access), 30 (Developer), 40 (Maintainer)'),
      allow_force_push: z.boolean().optional().default(false).describe('Allow force push on protected branch'),
      code_owner_approval_required: z.boolean().optional().default(false).describe('Prevent merges until code owners approve in MR'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ name, push_access_level, merge_access_level, allow_force_push, code_owner_approval_required, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const result: any = await client.ProtectedBranches.protect(targetProject, name, {
          pushAccessLevel: push_access_level,
          mergeAccessLevel: merge_access_level,
          allowForcePush: allow_force_push,
          codeOwnerApprovalRequired: code_owner_approval_required,
        });

        return jsonResult({
          name: result.name,
          allow_force_push: result.allow_force_push,
          code_owner_approval_required: result.code_owner_approval_required,
        });
      });
    }
  );
}
