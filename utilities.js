const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const path = require("path");
const fs = require("fs");

const connectorsDir = path.join(__dirname, "connectors");

const sendify = (data) => {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

const createMcpServer = () => {
    const s = new McpServer({
        name: "aittache",
        version: "0.1.0",
    });

    fs.readdirSync(connectorsDir)
        .filter(f => f.endsWith(".js"))
        .forEach(f => {
            const connector = require(path.join(connectorsDir, f));
            s.tool(connector.identifier, connector.params, connector.handler);
        });

    return s;
}

module.exports = {
    sendify,
    createMcpServer,
    connectorsDir
}
