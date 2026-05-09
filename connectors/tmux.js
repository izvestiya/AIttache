const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const handler = async ({ pane }) => {
    if (pane) {
        const output = execSync(`tmux capture-pane -t ${pane} -p`).toString();
        return utilities.sendify({ pane, output });
    }

    // List all panes in windows starting with mcp-
    const panes = execSync(
        `tmux list-panes -a -F "#{window_name} #{pane_id}" | grep "^mcp-"`
    ).toString().trim();

    if (!panes) {
        return utilities.sendify({ error: "No mcp- prefixed windows found" });
    }

    const results = {};
    for (const line of panes.split("\n")) {
        const [name, id] = line.split(" ");
        const output = execSync(`tmux capture-pane -t ${id} -p`).toString();
        results[name] = output;
    }

    return utilities.sendify(results);
};

module.exports = {
    identifier: "terminal_view",
    handler,
    params: {
        pane: z.string().optional().describe("Specific tmux pane ID. Leave blank to capture all windows starting with 'mcp-'")
    }
};