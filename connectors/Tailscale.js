const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const handler = async ({ action }) => {
    let output;
    switch (action) {
        case "status":
            output = JSON.parse(execSync("tailscale status --json").toString());
            break;
        case "peers":
            const status = JSON.parse(execSync("tailscale status --json").toString());
            const peers = Object.values(status.Peer).map(p => ({
                name: p.HostName,
                ip: p.TailscaleIPs?.[0],
                os: p.OS,
                online: p.Online,
                lastSeen: p.LastSeen
            }));
            output = peers;
            break;
        case "ip":
            output = { ip: execSync("tailscale ip").toString().trim() };
            break;
        case "dns":
            output = JSON.parse(execSync("tailscale dns status --json").toString());
            break;
    }

    return utilities.sendify(output);
};

module.exports = {
    identifier: "tailscale",
    handler,
    params: {
        action: z.enum(["status", "peers", "ip", "dns"]).describe("What to fetch: full status, peer list, local IP, or DNS config")
    }
};