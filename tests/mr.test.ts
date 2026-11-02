import { describe, it, expect, vi } from 'vitest';
import { formatAndTruncateDiffs } from '../src/utils.js';
import { registerMergeRequestTools } from '../src/tools/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Merge Requests Module', () => {
  it('truncates diff when exceeding line limit', () => {
    const rawDiffs = [
      {
        old_path: 'file1.txt',
        new_path: 'file1.txt',
        diff: Array(300).fill('+ line of code').join('\n'),
      },
      {
        old_path: 'file2.txt',
        new_path: 'file2.txt',
        diff: Array(300).fill('+ another line of code').join('\n'),
      },
    ];

    const result = formatAndTruncateDiffs(rawDiffs, 500);
    expect(result.diff_truncated).toBe(true);
    expect(result.diffs.length).toBe(1);
    expect(result.total_files).toBe(2);
  });

  it('filters diff by file_path when specified', () => {
    const rawDiffs = [
      {
        old_path: 'src/a.ts',
        new_path: 'src/a.ts',
        diff: '+ a content',
      },
      {
        old_path: 'src/b.ts',
        new_path: 'src/b.ts',
        diff: '+ b content',
      },
    ];

    const result = formatAndTruncateDiffs(rawDiffs, 500, 'src/b.ts');
    expect(result.diffs.length).toBe(1);
    expect(result.diffs[0].new_path).toBe('src/b.ts');
    expect(result.diff_truncated).toBe(false);
  });

  it('registers all merge request tools on McpServer', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const mockClient = {
      MergeRequests: {
        all: vi.fn(),
        create: vi.fn(),
        show: vi.fn(),
        allDiffs: vi.fn(),
        allPipelines: vi.fn(),
      },
      MergeRequestNotes: {
        create: vi.fn(),
      },
      MergeRequestDiscussions: {
        all: vi.fn(),
        create: vi.fn(),
        addNote: vi.fn(),
      },
    } as any;

    registerMergeRequestTools(server, mockClient, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      defaultProject: 'default/repo',
      tools: ['mr'],
    });

    expect(server).toBeDefined();
  });
});
