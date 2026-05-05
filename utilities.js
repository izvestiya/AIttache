const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const path = require("path");
const fs = require("fs");
const logging = require("./logging");

const connectorsDir = path.join(__dirname, "connectors");

const sendify = (data) => {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

const loadConnectors = (server, loud=false) => {
    fs.readdirSync(connectorsDir)
           .filter(f => f.endsWith(".js"))
           .forEach(f => {
               const connector = require(path.join(connectorsDir, f));
               if (loud) {
                   logging.log(`Loading connector ${connector.identifier}...`);
               }
               server.tool(connector.identifier, connector.params, connector.handler);
           });
    return server;
};

const createMcpServer = () => {
    let s = new McpServer({
        name: "aittache",
        version: "0.1.0",
    });

    s = loadConnectors(s);

    return s;
}

module.exports = {
    sendify,
    createMcpServer,
    loadConnectors,
    connectorsDir
}
