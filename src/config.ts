import { Command } from 'commander';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

export type ToolModuleName = 'mr' | 'repository' | 'ci' | 'settings' | 'discovery';

export interface ServerConfig {
  apiUrl: string;
  token: string;
  defaultProject?: string;
  tools: ToolModuleName[];
}

const ALL_TOOLS: ToolModuleName[] = ['mr', 'repository', 'ci', 'settings', 'discovery'];

export function parseTools(toolsArg?: string): ToolModuleName[] {
  if (!toolsArg || toolsArg.trim() === '' || toolsArg.trim() === 'all') {
    return [...ALL_TOOLS];
  }

  const parts = toolsArg
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const validSet = new Set<string>(ALL_TOOLS);
  const result: ToolModuleName[] = [];

  for (const part of parts) {
    if (validSet.has(part)) {
      result.push(part as ToolModuleName);
    }
  }

  return result.length > 0 ? result : [...ALL_TOOLS];
}

export function parseConfig(args: string[]): ServerConfig {
  const program = new Command();
  program
    .exitOverride()
    .option('-t, --token <string>', 'GitLab access token')
    .option('-u, --url <string>', 'GitLab API URL')
    .option('-p, --default-project <string>', 'Default GitLab project (ID or path_with_namespace)')
    .option('--tools <string>', 'Comma-separated modules: mr,repository,ci,settings,discovery or all')
    .option('--env-file <string>', 'Path to custom .env file');

  try {
    program.parse(args, { from: 'user' });
  } catch (err: any) {
    if (err.code === 'commander.helpDisplayed') {
      process.exit(0);
    }
    throw err;
  }
  const opts = program.opts<{
    token?: string;
    url?: string;
    defaultProject?: string;
    tools?: string;
    envFile?: string;
  }>();

  let envConfig: Record<string, string> = {};
  if (opts.envFile) {
    if (fs.existsSync(opts.envFile)) {
      envConfig = dotenv.parse(fs.readFileSync(opts.envFile));
    }
  } else {
    const defaultEnvPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(defaultEnvPath)) {
      envConfig = dotenv.parse(fs.readFileSync(defaultEnvPath));
    }
  }

  const token =
    opts.token ||
    process.env.GITLAB_TOKEN ||
    envConfig.GITLAB_TOKEN;

  if (!token) {
    throw new Error('GitLab token is required. Provide it via --token, GITLAB_TOKEN env variable, or in .env file.');
  }

  const apiUrl =
    opts.url ||
    process.env.GITLAB_API_URL ||
    envConfig.GITLAB_API_URL ||
    'https://gitlab.com/api/v4';

  const defaultProject =
    opts.defaultProject ||
    process.env.GITLAB_DEFAULT_PROJECT ||
    envConfig.GITLAB_DEFAULT_PROJECT ||
    undefined;

  const rawTools =
    opts.tools ||
    process.env.GITLAB_MCP_TOOLS ||
    envConfig.GITLAB_MCP_TOOLS ||
    'all';

  const tools = parseTools(rawTools);

  return {
    token,
    apiUrl,
    defaultProject,
    tools,
  };
}
