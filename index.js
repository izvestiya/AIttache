const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { z } = require("zod");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const server = new McpServer({
  name: "aittache",
  version: "0.1.0",
});

const connectorsDir = path.join(__dirname, "connectors");

fs.readdirSync(connectorsDir)
  .filter(f => f.endsWith(".js"))
  .forEach(f => {
    const connector = require(path.join(connectorsDir, f));
    console.log(`Loading connector ${connector.identifier}...`);
    server.tool(connector.identifier, connector.params, connector.handler);
  });

const transport = new StdioServerTransport();
server.connect(transport);