const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const path = require("path");
const fs = require("fs");
const logging = require("./logging");

const connectorsDir = path.join(__dirname, "connectors");
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

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

const loadData = (connectorName) => {
    const dataPath = path.join(dataDir, `${connectorName}.json`);
    if (fs.existsSync(dataPath)) {
        return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    } else {
        return null;
    }
}

const saveData = (connectorName, data) => {
    const dataPath = path.join(dataDir, `${connectorName}.json`);
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = {
    sendify,
    createMcpServer,
    loadConnectors,
    connectorsDir,
    dataDir,
    loadData,
    saveData
}
