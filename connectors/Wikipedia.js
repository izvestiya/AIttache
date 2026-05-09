const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const headers = { "User-Agent": "AIttache/1.0" };

const handler = async ({ action, query, lang }) => {
    const language = lang || "en";
    const base = `https://${language}.wikipedia.org`;

    switch (action) {
        case "search": {
            if (!query) return utilities.sendify({ error: "query is required for search action" });
            const url = `${base}/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=5`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            return utilities.sendify(data);
        }
        case "summary": {
            if (!query) return utilities.sendify({ error: "query is required for summary action" });
            const url = `${base}/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            const pages = data.query.pages;
            const page = Object.values(pages)[0];
            return utilities.sendify({ title: page.title, extract: page.extract, pageid: page.pageid, url: `${base}/wiki/${encodeURIComponent(page.title)}` });
        }
        case "full": {
            if (!query) return utilities.sendify({ error: "query is required for full action" });
            const url = `${base}/w/api.php?action=query&format=json&prop=extracts&explaintext&titles=${encodeURIComponent(query)}`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            const pages = data.query.pages;
            const page = Object.values(pages)[0];
            return utilities.sendify({ title: page.title, extract: page.extract, pageid: page.pageid, url: `${base}/wiki/${encodeURIComponent(page.title)}` });
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "wikipedia",
    handler,
    params: {
        action: z.enum(["search", "summary", "full"]).describe("Search for articles, get intro summary, or get full article text"),
        query: z.string().optional().describe("Search query or exact article title"),
        lang: z.string().optional().describe("Wikipedia language code, e.g. 'en', 'fi', 'de'. Defaults to 'en'")
    }
};
