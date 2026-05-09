const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const handler = async ({ lines, process }) => {
    let output = "";
    const n = lines || 150;

    if (process) {
        output = execSync(`journalctl -n ${n} --no-pager -u ${process}`).toString();
    } else {
        output = execSync(`journalctl -n ${n} --no-pager`).toString();
    }

    return utilities.sendify(output);
};

module.exports = {
    identifier: "JournalCTL_Check",
    handler,
    params: {
        lines: z.number().int().optional().describe("How many lines to return, default 150"),
        process: z.string().optional().describe("process for which to check logs for. E.g. 'nginx' or 'discord'. Leave blank for all processes"),
    }
};
