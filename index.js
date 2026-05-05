// Modules for MCP via STDIO
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

// Modules for MCP over HTTP
const express = require("express");
const cors = require("cors");

const utilities = require("./utilities");
const logging = require("./logging");

require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const mode = process.env.TRANSPORT || "stdio";


if (mode === "stdio") {
    let server = new McpServer({
        name: "aittache",
        version: "0.1.0",
    });

    server = utilities.loadConnectors(server, true);
    const transport = new StdioServerTransport();
    server.connect(transport);
} else {
    const routes = require("./routes");
    let app = express();
    // app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cors({ exposedHeaders: ["Mcp-Session-Id"] }));
    app = logging.load(app);
    app = routes.load(app);

    const port = process.env.MCP_PORT || 3000;
    app.listen(port, () => console.error(`AIttache HTTP on port ${port}`));
}
