import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GitlabClient } from '../gitlab.js';
import { ServerConfig } from '../config.js';
import { cleanAnsi, jsonResult, resolveProjectId, tailLines, withGitlabErrors } from '../utils.js';

export function register(server: McpServer, client: GitlabClient, config: ServerConfig): void {
  server.tool(
    'gitlab_get_pipeline',
    'Get detailed information about a CI/CD pipeline, including all jobs and stages. Optionally fetch cleaned traces for failed jobs.',
    {
      pipeline_id: z.number().describe('Pipeline ID'),
      show_trace: z.boolean().optional().default(false).describe('Whether to automatically retrieve and clean log traces for failed jobs'),
      tail_lines: z.number().optional().default(200).describe('Number of trailing lines to return from each failed job log'),
      project_id: z.union([z.string(), z.number()]).optional().describe('Project ID or "group/project" path'),
    },
    async ({ pipeline_id, show_trace, tail_lines: tailLinesCount, project_id }) => {
      return withGitlabErrors(async () => {
        const targetProject = resolveProjectId(project_id, config.defaultProject);
        const pipeline: any = await client.Pipelines.show(targetProject, pipeline_id);
        const jobs: any[] = (await client.Jobs.all(targetProject, { pipelineId: pipeline_id })) as any[];

        const jobsFormatted: any[] = [];
        for (const j of jobs) {
          const item: Record<string, any> = {
            id: j.id,
            name: j.name,
            stage: j.stage,
            status: j.status,
            duration: j.duration,
            failure_reason: j.failure_reason,
            web_url: j.web_url,
          };

          if (show_trace && j.status === 'failed') {
            try {
              const rawTrace = await client.Jobs.showLog(targetProject, j.id);
              const cleaned = cleanAnsi(String(rawTrace || ''));
              item.trace = tailLines(cleaned, tailLinesCount);
            } catch (err: any) {
              item.trace_error = `Could not fetch job trace: ${err.message || String(err)}`;
            }
          }

          jobsFormatted.push(item);
        }

        const stages = Array.from(new Set(jobs.map((j) => j.stage)));

        return jsonResult({
          id: pipeline.id,
          status: pipeline.status,
          ref: pipeline.ref,
          sha: pipeline.sha,
          duration: pipeline.duration,
          stages,
          web_url: pipeline.web_url,
          created_at: pipeline.created_at,
          finished_at: pipeline.finished_at,
          jobs: jobsFormatted,
        });
      });
    }
  );
}
