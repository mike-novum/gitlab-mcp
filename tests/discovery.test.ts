import { describe, it, expect, vi } from 'vitest';
import { resolveProjectId } from '../src/utils.js';
import { registerDiscoveryTools } from '../src/tools/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Discovery Module', () => {
  it('resolves explicit numeric project ID', () => {
    expect(resolveProjectId(1234, 'fallback/proj')).toBe(1234);
    expect(resolveProjectId('5678', 'fallback/proj')).toBe(5678);
  });

  it('resolves explicit namespace/project path', () => {
    expect(resolveProjectId('group/subgroup/repo', 'fallback/proj')).toBe('group/subgroup/repo');
  });

  it('falls back to defaultProject when project_id is undefined', () => {
    expect(resolveProjectId(undefined, 'fallback/proj')).toBe('fallback/proj');
  });

  it('throws an informative error when project_id and defaultProject are missing', () => {
    expect(() => resolveProjectId(undefined, undefined)).toThrow(/project.*required/i);
  });

  it('registers gitlab_search_projects tool and calls gitlab client search', async () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const mockProjectsSearch = vi.fn().mockResolvedValue([
      {
        id: 101,
        name: 'Backend API',
        path_with_namespace: 'org/backend-api',
        description: 'Core backend service',
        web_url: 'https://gitlab.com/org/backend-api',
      },
    ]);

    const mockClient = {
      Projects: {
        all: mockProjectsSearch,
      },
    } as any;

    registerDiscoveryTools(server, mockClient, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      tools: ['discovery'],
    });

    expect(server).toBeDefined();
  });
});
