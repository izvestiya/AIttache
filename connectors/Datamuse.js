const { z } = require("zod");
const utilities = require("../utilities");

const base = "https://api.datamuse.com";

const handler = async ({ action, word, max }) => {
    if (!word) return utilities.sendify({ error: "word is required" });
    const limit = max || 10;
    let url;

    switch (action) {
        case "synonyms":
            url = `${base}/words?rel_syn=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        case "antonyms":
            url = `${base}/words?rel_ant=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        case "rhymes":
            url = `${base}/words?rel_rhy=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        case "sounds_like":
            url = `${base}/words?sl=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        case "means_like":
            url = `${base}/words?ml=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        case "spelled_like":
            url = `${base}/words?sp=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        case "associated":
            url = `${base}/words?rel_trg=${encodeURIComponent(word)}&max=${limit}&md=d`;
            break;
        default:
            return utilities.sendify({ error: "Invalid action" });
    }

    const res = await fetch(url);
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "datamuse",
    handler,
    params: {
        action: z.enum(["synonyms", "antonyms", "rhymes", "sounds_like", "means_like", "spelled_like", "associated"]).describe("Type of word relationship to query"),
        word: z.string().describe("The word to look up"),
        max: z.number().int().optional().describe("Maximum number of results. Defaults to 10")
    }
};