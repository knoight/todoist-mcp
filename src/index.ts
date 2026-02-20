#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TodoistClient } from "./client.js";
import { registerBasicTools } from "./tools/basic.js";
import { registerAdvancedTools } from "./tools/advanced.js";

const token = process.env.TODOIST_TOKEN;
if (!token) {
  console.error("TODOIST_TOKEN environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "todoist-mcp",
  version: "1.0.0",
});

const client = new TodoistClient(token);

registerBasicTools(server, client);
registerAdvancedTools(server, client);

const transport = new StdioServerTransport();
await server.connect(transport);
