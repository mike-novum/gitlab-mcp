#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import packageJson from '../package.json' with { type: 'json' };
import { parseConfig } from './config.js';
import { createGitlabClient } from './gitlab.js';
import { registerTools } from './tools/index.js';

async function main(): Promise<void> {
  try {
    const config = parseConfig(process.argv.slice(2));
    const gitlabClient = createGitlabClient(config);

    const server = new McpServer({
      name: 'gitlab-mcp-server',
      version: packageJson.version,
    });

    registerTools(server, gitlabClient, config);

    const transport = new StdioServerTransport();
    await server.connect(transport);

    const cleanup = async () => {
      await server.close();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
  } catch (error: any) {
    process.stderr.write(`Error initializing GitLab MCP server: ${error.message || String(error)}\n`);
    process.exit(1);
  }
}

main();
