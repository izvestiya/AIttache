const { z } = require("zod");
const utilities = require("../utilities");

const baseURL = "https://help.openai.com/en/articles/6825453-chatgpt-release-notes"

const decodeEntities = (str) => str
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&nbsp;/g, ' ');

// Handler for what to return
const handler = async ({ entries, offset, reverse }) => {

    const res = await fetch(baseURL, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    const rawText = await res.text();
    const text = rawText.split("<article")[1].split("</article>")[0];

    const datePattern = /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/;

    const sections = text.split(/<h1[^>]*>/);
    let results = [];

    for (const section of sections.slice(1)) {
        const date = section.match(/^([^<]+)/)?.[1].replace(/<[^>]+>/g, '').trim();
        if (!date || !datePattern.test(date)) continue;

        const titleMatch = section.match(/<h2[^>]*>(.*?)<\/h2>/s);
        const title = titleMatch?.[1] ? decodeEntities(titleMatch[1].replace(/<[^>]+>/g, '').trim()) : undefined;

        const contentMatches = [...section.matchAll(/<p[^>]*>(.*?)<\/p>/gs)];
        const content = contentMatches.map(m => decodeEntities(m[1].replace(/<[^>]+>/g, ''))).filter(Boolean);

        results.push({ date, title, content });
    }

    if (reverse) results = results.reverse();
    results = results.slice(offset || 0, (entries || 4) + (offset || 0));
    
    return utilities.sendify(results);
};

module.exports = {
    identifier: "ChatGPT_Release_Notes",
    handler,
    params: {
        entries: z.number().int().optional().describe("Number of release notes entries to return (default: 4), set to 0 for all)"),
        offset: z.number().int().optional().describe("Number of entries to skip from the start (default: 0)"),
        reverse: z.boolean().optional().describe("Whether to return entries in reverse chronological order (default: false), is applied before offset and entries. Standard (when set to false) is newest to oldest"),
    } // Params for the endpoint
}
