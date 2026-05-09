const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const headers = { "User-Agent": "AIttache/1.0" };

const handler = async ({ query, lang }) => {
    if (!query) return utilities.sendify({ error: "query is required" });
    const language = lang || "en";
    const base = `https://${language}.wiktionary.org`;
    const url = `${base}/w/api.php?action=query&format=json&prop=extracts&explaintext&titles=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    return utilities.sendify({ title: page.title, extract: page.extract, pageid: page.pageid, url: `${base}/wiki/${encodeURIComponent(page.title)}` });
};

module.exports = {
    identifier: "wiktionary",
    handler,
    params: {
        query: z.string().describe("Word or phrase to look up"),
        lang: z.string().optional().describe("Wiktionary language code, e.g. 'en', 'jp', 'de'. Defaults to 'en'")
    }
};
