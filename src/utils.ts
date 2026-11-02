import stripAnsi from 'strip-ansi';
import { formatGitlabError } from './gitlab.js';

export function cleanAnsi(text: string): string {
  return stripAnsi(text);
}

export function tailLines(text: string, count: number): string {
  const lines = text.split('\n');
  if (lines.length <= count) {
    return text;
  }
  return lines.slice(-count).join('\n');
}

export function resolveProjectId(projectIdParam?: string | number, defaultProject?: string): string | number {
  if (projectIdParam !== undefined && projectIdParam !== null && projectIdParam !== '') {
    if (typeof projectIdParam === 'number') {
      return projectIdParam;
    }
    const trimmed = String(projectIdParam).trim();
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    return trimmed;
  }

  if (defaultProject && defaultProject.trim() !== '') {
    const trimmedDefault = defaultProject.trim();
    if (/^\d+$/.test(trimmedDefault)) {
      return parseInt(trimmedDefault, 10);
    }
    return trimmedDefault;
  }

  throw new Error(
    'Project ID is required. Please specify project_id parameter (numeric ID or "namespace/project-name") or configure GITLAB_DEFAULT_PROJECT in server settings.'
  );
}

export interface TruncatedDiffResult {
  diffs: Array<{
    old_path: string;
    new_path: string;
    diff: string;
    new_file?: boolean;
    renamed_file?: boolean;
    deleted_file?: boolean;
  }>;
  total_files: number;
  diff_truncated: boolean;
  total_lines: number;
}

export function formatAndTruncateDiffs(
  rawDiffs: any[],
  maxLines: number = 500,
  filterFilePath?: string
): TruncatedDiffResult {
  let filtered = rawDiffs;
  if (filterFilePath) {
    filtered = rawDiffs.filter(
      (d) => d.new_path === filterFilePath || d.old_path === filterFilePath
    );
  }

  const resultDiffs: any[] = [];
  let currentLines = 0;
  let truncated = false;

  for (const item of filtered) {
    const patch = item.diff || '';
    const lineCount = patch.split('\n').length;

    if (currentLines + lineCount > maxLines && resultDiffs.length > 0) {
      truncated = true;
      break;
    }

    resultDiffs.push({
      old_path: item.old_path,
      new_path: item.new_path,
      diff: patch,
      new_file: item.new_file,
      renamed_file: item.renamed_file,
      deleted_file: item.deleted_file,
    });

    currentLines += lineCount;
  }

  return {
    diffs: resultDiffs,
    total_files: filtered.length,
    diff_truncated: truncated,
    total_lines: currentLines,
  };
}

export type ToolResult = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};

export function textResult(text: string): ToolResult {
  return {
    content: [{ type: 'text', text }],
  };
}

export function jsonResult(value: unknown): ToolResult {
  return textResult(JSON.stringify(value, null, 2));
}

export async function withGitlabErrors(action: () => Promise<ToolResult>): Promise<ToolResult> {
  try {
    return await action();
  } catch (error) {
    return {
      content: [{ type: 'text', text: formatGitlabError(error) }],
      isError: true,
    };
  }
}
