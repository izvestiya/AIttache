const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");

const run = (cmd, host) => {
    try {
        const fullCmd = host ? `ssh ${host} '${cmd}'` : cmd;
        return execSync(fullCmd, { timeout: 30000 }).toString().trim();
    } catch (e) {
        return `Error: ${e.message}`;
    }
};

const handler = async ({ host }) => {
    const raw = run("speedtest-cli --json", host);
    try {
        const data = JSON.parse(raw);
        return utilities.sendify({
            download: `${(data.download / 1000000).toFixed(2)} Mbps`,
            upload: `${(data.upload / 1000000).toFixed(2)} Mbps`,
            ping: `${data.ping} ms`,
            server: data.server?.sponsor,
            location: data.server?.name
        });
    } catch {
        return utilities.sendify({ raw });
    }
};

module.exports = {
    identifier: "speedtest",
    handler,
    params: {
        host: z.string().optional().describe("SSH host to run on. Leave blank for local machine")
    }
};