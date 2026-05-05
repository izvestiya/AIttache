// Modules for MCP via STDIO
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");

// Modules for MCP over HTTP
const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const { z } = require("zod");
const fs = require("fs");
const path = require("path");
const utilities = require("./utilities");

require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const mode = process.env.TRANSPORT || "stdio";


if (mode === "stdio") {
    const server = new McpServer({
        name: "aittache",
        version: "0.1.0",
    });

    const { connectorsDir } = utilities;

    fs.readdirSync(connectorsDir)
       .filter(f => f.endsWith(".js"))
       .forEach(f => {
           const connector = require(path.join(connectorsDir, f));
           console.error(`Loading connector ${connector.identifier}...`);
           server.tool(connector.identifier, connector.params, connector.handler);
       });
    const transport = new StdioServerTransport();
    server.connect(transport);
} else {
    const routes = require("./routes");
    let app = express();
    // app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({ exposedHeaders: ["Mcp-Session-Id"] }));
    
    app = routes.load(app);

    const port = process.env.MCP_PORT || 3000;
    app.listen(port, () => console.error(`AIttache HTTP on port ${port}`));
}
