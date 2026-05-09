const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const handler = async ({ host }) => {
    const output = host 
    ? execSync(`ssh ${host} 'ps aux'`).toString()
    : execSync(`ps aux`).toString();
    return utilities.sendify(output);
};

module.exports = {
    identifier: "system_processes",
    handler,
    params: {
        host: z.string().optional().describe("SSH host to run on (e.g. user@hostname or a ~/.ssh/config alias). Leave blank for local machine"),
    }
};
