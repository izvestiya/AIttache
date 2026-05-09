const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const handler = async ({ url }) => {
    if (!url) return utilities.sendify({ error: "url is required" });

    const chain = [url];
    let current = url;

    for (let i = 0; i < 20; i++) {
        const res = await fetch(current, { method: "HEAD", redirect: "manual" });
        const location = res.headers.get("location");
        if (!location) break;
        const next = location.startsWith("http") ? location : new URL(location, current).href;
        chain.push(next);
        current = next;
    }

    return utilities.sendify({
        original: url,
        resolved: current,
        hops: chain.length - 1,
        chain
    });
};

module.exports = {
    identifier: "Unshorten",
    handler,
    params: {
        url: z.string().describe("Shortened or suspicious URL to resolve, e.g. 'https://bit.ly/3abc123'")
    }
};