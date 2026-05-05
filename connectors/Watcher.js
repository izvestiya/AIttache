const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");

// Build available watchers from env vars starting with WATCHER_
const watchers = {};
for (const [key, val] of Object.entries(process.env)) {
    if (key.startsWith("WATCHER_")) {
        const name = key.replace("WATCHER_", "").toLowerCase();
        watchers[name] = val;
    }
}

const handler = async ({ name, lines, host }) => {
    if (!name) {
        return utilities.sendify({ available: Object.keys(watchers) });
    }

    const path = watchers[name.toLowerCase()];
    if (!path) {
        return utilities.sendify({ error: `Unknown watcher: ${name}`, available: Object.keys(watchers) });
    }

    const n = lines || 50;
    const output = host 
    ? execSync(`ssh ${host} 'tail -n ${n} "${path}"'`).toString()
    : execSync(`tail -n ${n} "${path}"`).toString();
    return utilities.sendify({ name, path, lines: n, output });
};

module.exports = {
    identifier: "file_watcher",
    handler,
    params: {
        name: z.string().optional().describe("Watcher name (e.g. 'minecraft_logs'). Leave blank to list available watchers"),
        lines: z.number().optional().describe("Number of lines to tail, default 50"),
        host: z.string().optional().describe("SSH host to run on (e.g. user@hostname or a ~/.ssh/config alias). Leave blank for local machine")
    }
};