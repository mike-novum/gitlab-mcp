import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from '../src/tools/index.js';

describe('Tool Registration Filtering', () => {
  const createMockClient = () =>
    ({
      MergeRequests: { all: vi.fn(), show: vi.fn(), create: vi.fn(), allDiffs: vi.fn() },
      MergeRequestNotes: { create: vi.fn() },
      MergeRequestDiscussions: { all: vi.fn(), create: vi.fn(), addNote: vi.fn() },
      Pipelines: { all: vi.fn(), show: vi.fn(), retry: vi.fn() },
      Jobs: { all: vi.fn(), showLog: vi.fn() },
      Repositories: { allRepositoryTrees: vi.fn() },
      RepositoryFiles: { show: vi.fn() },
      ProtectedBranches: { all: vi.fn(), protect: vi.fn(), unprotect: vi.fn() },
      ProtectedTags: { all: vi.fn(), protect: vi.fn(), unprotect: vi.fn() },
      Projects: { all: vi.fn(), show: vi.fn(), edit: vi.fn() },
    }) as any;

  it('registers only MR tools when tools contains only mr', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const client = createMockClient();

    registerTools(server, client, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      tools: ['mr'],
    });

    const registered = Object.keys((server as any)._registeredTools);
    expect(registered).toContain('gitlab_list_mrs');
    expect(registered).toContain('gitlab_get_mr');
    expect(registered).toContain('gitlab_create_mr');
    expect(registered).toContain('gitlab_create_mr_note');
    expect(registered).not.toContain('gitlab_list_pipelines');
    expect(registered).not.toContain('gitlab_read_file');
    expect(registered).not.toContain('gitlab_list_protected_branches');
  });

  it('registers only CI tools when tools contains only ci', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const client = createMockClient();

    registerTools(server, client, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      tools: ['ci'],
    });

    const registered = Object.keys((server as any)._registeredTools);
    expect(registered).toContain('gitlab_list_pipelines');
    expect(registered).toContain('gitlab_get_pipeline');
    expect(registered).toContain('gitlab_retry_pipeline');
    expect(registered).not.toContain('gitlab_list_mrs');
    expect(registered).not.toContain('gitlab_read_file');
  });

  it('registers all tools when tools contains all modules', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const client = createMockClient();

    registerTools(server, client, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      tools: ['mr', 'repository', 'ci', 'settings', 'discovery'],
    });

    const registered = Object.keys((server as any)._registeredTools);
    expect(registered.length).toBeGreaterThanOrEqual(12);
  });
});
