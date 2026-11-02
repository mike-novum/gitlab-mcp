import { Gitlab } from '@gitbeaker/rest';
import { ServerConfig } from './config.js';

export type GitlabClient = InstanceType<typeof Gitlab>;

export function sanitizeHost(apiUrl: string): string {
  let cleaned = apiUrl.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/api\/v4$/, '');
  return cleaned;
}

export function createGitlabClient(config: Pick<ServerConfig, 'apiUrl' | 'token'>): GitlabClient {
  const host = sanitizeHost(config.apiUrl);
  return new Gitlab({
    host,
    token: config.token,
  });
}

export async function resolveUserIds(client: GitlabClient, refs: Array<number | string>): Promise<number[]> {
  const ids: number[] = [];

  for (const ref of refs) {
    ids.push(await resolveUserId(client, ref));
  }

  return ids;
}

async function resolveUserId(client: GitlabClient, ref: number | string): Promise<number> {
  if (typeof ref === 'number') {
    if (!Number.isInteger(ref) || ref <= 0) {
      throw new Error(`Invalid GitLab user id: ${ref}`);
    }
    return ref;
  }

  const value = ref.trim();
  if (/^\d+$/.test(value)) {
    const id = parseInt(value, 10);
    if (id <= 0) {
      throw new Error(`Invalid GitLab user id: ${value}`);
    }
    return id;
  }

  const users = await client.Users.all({ username: value });
  const match = users.find((user) => user.username === value);
  if (!match) {
    throw new Error(`GitLab user "${value}" was not found.`);
  }

  return match.id;
}

export function formatGitlabError(error: unknown): string {
  if (!error) {
    return 'Unknown error occurred';
  }

  const errObj = error as Record<string, any>;
  const status = errObj.response?.status || errObj.status;
  const originalMessage = errObj.message || String(error);

  if (status === 401) {
    return `GitLab API Error 401: Unauthorized. Please check that your GITLAB_TOKEN is valid and has not expired. Original error: ${originalMessage}`;
  }

  if (status === 403) {
    return `GitLab API Error 403: Forbidden. Your token does not have sufficient permissions to perform this operation. Original error: ${originalMessage}`;
  }

  if (status === 404) {
    return `GitLab API Error 404: Resource not found. Verify the project ID, path, or resource identifier. Original error: ${originalMessage}`;
  }

  if (status === 429) {
    const retryAfter =
      errObj.response?.headers?.['retry-after'] ||
      errObj.headers?.['retry-after'] ||
      'unknown';
    return `GitLab API Error 429: Rate limit exceeded. Retry after ${retryAfter} seconds.`;
  }

  return `GitLab API Error: ${originalMessage}`;
}
