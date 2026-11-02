import { describe, it, expect, vi } from 'vitest';
import { cleanAnsi, tailLines } from '../src/utils.js';
import { registerCiTools } from '../src/tools/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('CI / Pipelines Module', () => {
  it('cleans ANSI escape sequences from logs', () => {
    const ansiLog = '\u001b[31mError occurred\u001b[39m in test';
    expect(cleanAnsi(ansiLog)).toBe('Error occurred in test');
  });

  it('tails lines correctly', () => {
    const text = 'line 1\nline 2\nline 3\nline 4\nline 5';
    expect(tailLines(text, 2)).toBe('line 4\nline 5');
    expect(tailLines(text, 10)).toBe(text);
  });

  it('registers all CI tools on McpServer', () => {
    const server = new McpServer({ name: 'test', version: '1.0' });
    const mockClient = {
      Pipelines: {
        all: vi.fn(),
        show: vi.fn(),
        retry: vi.fn(),
      },
      Jobs: {
        all: vi.fn(),
        showLog: vi.fn(),
      },
    } as any;

    registerCiTools(server, mockClient, {
      apiUrl: 'https://gitlab.com/api/v4',
      token: 'test',
      defaultProject: 'default/repo',
      tools: ['ci'],
    });

    expect(server).toBeDefined();
  });
});
