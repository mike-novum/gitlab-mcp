import { describe, it, expect } from 'vitest';
import { createGitlabClient, formatGitlabError, sanitizeHost } from '../src/gitlab.js';

describe('GitLab Client & Error Handling', () => {
  it('sanitizes host URL by removing trailing slash and /api/v4', () => {
    expect(sanitizeHost('https://gitlab.com/api/v4/')).toBe('https://gitlab.com');
    expect(sanitizeHost('https://gitlab.com/api/v4')).toBe('https://gitlab.com');
    expect(sanitizeHost('https://my-gitlab.org/')).toBe('https://my-gitlab.org');
    expect(sanitizeHost('https://my-gitlab.org')).toBe('https://my-gitlab.org');
  });

  it('creates gitlab client instance with sanitized host and token', () => {
    const client = createGitlabClient({
      apiUrl: 'https://gitlab.example.com/api/v4',
      token: 'test-token',
      tools: ['all' as any],
    });

    expect(client).toBeDefined();
    expect(client.MergeRequests).toBeDefined();
    expect(client.Repositories).toBeDefined();
    expect(client.Pipelines).toBeDefined();
    expect(client.Projects).toBeDefined();
  });

  it('formats 401 error with helpful message', () => {
    const error = { response: { status: 401 }, message: 'Unauthorized' };
    const formatted = formatGitlabError(error);
    expect(formatted).toMatch(/401.*unauthorized.*token/i);
  });

  it('formats 403 error with helpful message about permissions', () => {
    const error = { response: { status: 403 }, message: 'Forbidden' };
    const formatted = formatGitlabError(error);
    expect(formatted).toMatch(/403.*permission.*forbidden/i);
  });

  it('formats 404 error with helpful message', () => {
    const error = { response: { status: 404 }, message: '404 Project Not Found' };
    const formatted = formatGitlabError(error);
    expect(formatted).toMatch(/404.*not found/i);
  });

  it('formats 429 error with rate limit details', () => {
    const error = {
      response: {
        status: 429,
        headers: { 'retry-after': '60' },
      },
      message: 'Too Many Requests',
    };
    const formatted = formatGitlabError(error);
    expect(formatted).toMatch(/429.*rate limit.*60/i);
  });

  it('formats generic or unknown errors', () => {
    const error = new Error('Network failure');
    const formatted = formatGitlabError(error);
    expect(formatted).toContain('Network failure');
  });
});
