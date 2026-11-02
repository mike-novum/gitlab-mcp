import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseConfig } from '../src/config.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('parseConfig', () => {
  const originalEnv = process.env;
  let tempDir: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gitlab-mcp-test-'));
  });

  afterEach(() => {
    process.env = originalEnv;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('throws an error if no token is provided', () => {
    delete process.env.GITLAB_TOKEN;
    expect(() => parseConfig([])).toThrow(/token/i);
  });

  it('reads configuration from process.env', () => {
    process.env.GITLAB_TOKEN = 'env-token';
    process.env.GITLAB_API_URL = 'https://gitlab.env.com/api/v4';
    process.env.GITLAB_DEFAULT_PROJECT = 'env-group/env-project';
    process.env.GITLAB_MCP_TOOLS = 'mr,ci';

    const config = parseConfig([]);

    expect(config.token).toBe('env-token');
    expect(config.apiUrl).toBe('https://gitlab.env.com/api/v4');
    expect(config.defaultProject).toBe('env-group/env-project');
    expect(config.tools).toEqual(['mr', 'ci']);
  });

  it('prioritizes CLI flags over process.env', () => {
    process.env.GITLAB_TOKEN = 'env-token';
    process.env.GITLAB_API_URL = 'https://gitlab.env.com/api/v4';
    process.env.GITLAB_DEFAULT_PROJECT = 'env-group/env-project';
    process.env.GITLAB_MCP_TOOLS = 'mr,ci';

    const config = parseConfig([
      '--token', 'cli-token',
      '--url', 'https://gitlab.cli.com/api/v4',
      '--default-project', 'cli-group/cli-project',
      '--tools', 'repository,settings'
    ]);

    expect(config.token).toBe('cli-token');
    expect(config.apiUrl).toBe('https://gitlab.cli.com/api/v4');
    expect(config.defaultProject).toBe('cli-group/cli-project');
    expect(config.tools).toEqual(['repository', 'settings']);
  });

  it('reads from custom .env file via --env-file', () => {
    delete process.env.GITLAB_TOKEN;
    delete process.env.GITLAB_API_URL;

    const envFilePath = path.join(tempDir, '.custom.env');
    fs.writeFileSync(
      envFilePath,
      'GITLAB_TOKEN=file-token\nGITLAB_API_URL=https://gitlab.file.com/api/v4\nGITLAB_DEFAULT_PROJECT=file-proj\n'
    );

    const config = parseConfig(['--env-file', envFilePath]);

    expect(config.token).toBe('file-token');
    expect(config.apiUrl).toBe('https://gitlab.file.com/api/v4');
    expect(config.defaultProject).toBe('file-proj');
  });

  it('resolves all tools when tools is all or empty', () => {
    process.env.GITLAB_TOKEN = 'test-token';

    const configAll = parseConfig(['--tools', 'all']);
    expect(configAll.tools).toEqual(['mr', 'repository', 'ci', 'settings', 'discovery']);

    const configDefault = parseConfig([]);
    expect(configDefault.tools).toEqual(['mr', 'repository', 'ci', 'settings', 'discovery']);
  });
});
