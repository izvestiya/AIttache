const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const token = process.env.GITHUB_TOKEN;

const handler = async () => {
    const headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    };

    token ? headers["Authorization"] = `Bearer ${token}` : console.warn("No GitHub token provided, API rate limits may apply.");

    const res = await fetch("https://api.github.com/repos/izvestiya/AIttache/releases/latest", { headers });
    const data = await res.json();

    if (data.message) {
        return utilities.sendify({ error: data.message });
    }

    return utilities.sendify({
        version: data.tag_name,
        name: data.name,
        published_at: data.published_at,
        prerelease: data.prerelease,
        body: data.body,
        url: data.html_url
    });
};

module.exports = {
    identifier: "AIttache_Release_Notes",
    handler,
    params: {}
};