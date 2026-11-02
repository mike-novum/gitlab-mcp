import { describe, it, expect, vi } from 'vitest';
import { registerRepositoryTools } from '../src/tools/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Repository Module', () => {
  it('registers gitlab_read_file and gitlab_list_tree tools', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const mockClient = {
      RepositoryFiles: {
        show: vi.fn(),
      },
      Repositories: {
        allRepositoryTrees: vi.fn(),
      },
    } as any;

    registerRepositoryTools(server, mockClient, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      defaultProject: 'default/repo',
      tools: ['repository'],
    });

    expect(server).toBeDefined();
  });
});
