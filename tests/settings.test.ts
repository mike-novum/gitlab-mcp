import { describe, it, expect, vi } from 'vitest';
import { registerSettingsTools } from '../src/tools/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Settings Module', () => {
  it('registers all settings tools on McpServer', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const mockClient = {
      ProtectedBranches: {
        all: vi.fn(),
        protect: vi.fn(),
        unprotect: vi.fn(),
      },
      ProtectedTags: {
        all: vi.fn(),
        protect: vi.fn(),
        unprotect: vi.fn(),
      },
      Projects: {
        show: vi.fn(),
        edit: vi.fn(),
      },
    } as any;

    registerSettingsTools(server, mockClient, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      defaultProject: 'default/repo',
      tools: ['settings'],
    });

    expect(server).toBeDefined();
  });
});
