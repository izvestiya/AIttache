const { z } = require("zod");
const utilities = require("../utilities");

utilities.loadData("My_Dict") || utilities.saveData("My_Dict", {});

const handler = async ({ action, entryType, query, word, definition, origin, partOfSpeech, formal, lang }) => {
    const data = utilities.loadData("My_Dict") || {};

    switch (action) {
        case "list": {
            const dictionary = Object.keys(data).map(word => {
                return {
                    word,
                    partOfSpeech: data[word].partOfSpeech
                }
            });

            return utilities.sendify(dictionary);
        }
        case "search": {
            const matches = Object.keys(data).filter(word => {
                const entry = data[word];
                return (
                    word.includes(query) ||
                    entry.definition.includes(query) ||
                    entry.partOfSpeech.some(pos => pos.includes(query)) ||
                    entry.origin.includes(query) ||
                    entry.lang.includes(query)
                );
            }).map(word => {
                return {
                    word,
                    partOfSpeech: data[word].partOfSpeech,
                    origin: data[word].origin,
                    formal: data[word].formal,
                    lang: data[word].lang
                };
            });

            return utilities.sendify(matches);
        }
        case "word": {
            if (!word) {
                return utilities.sendify({ error: "Missing required parameter: word" });
            }

            const entry = data[word];
            if (entry) {
                return utilities.sendify(entry);
            } else {
                return utilities.sendify({ error: "Word not found" });
            }
        }
        case "add": {
            if (!word || !entryType || !definition || !partOfSpeech) {
                return utilities.sendify({ error: "Missing required parameters" });
            }

            data[word] = {
                type: entryType,
                definition: definition,
                partOfSpeech: partOfSpeech || ["none"],
                lang: lang?.toLowerCase() || "en",
                origin: origin || "unknown",
                formal: formal || false
            };

            utilities.saveData("My_Dict", data);
            return utilities.sendify({ success: true });
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "My_Dict",
    handler,
    params: {
        action: z.enum(["list", "search", "word", "add"]).describe("list = view all words, search = find words by keyword, word = fetch definition for a specific word, add = add a new word to the dictionary"),
        entryType: z.enum(["word", "quote", "definition"]).optional().describe("Type of entry to add (required for 'add' action, ignored for other actions)"),
        query: z.string().optional().describe("Search query for 'search' action"),
        word: z.string().optional().describe("Word to fetch definition for or add to the dictionary (required for 'word' and 'add' actions). Note: adding a word that already exists will overwrite the existing entry. This field is also used as the unique identifier for all entry types."),
        definition: z.string().optional().describe("Definition of the word to add to the dictionary (required for 'add' action)"),
        origin: z.string().optional().describe("Origin of the word to add to the dictionary (optional for 'add' action)"),
        partOfSpeech: z.array(z.enum(["noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection", "article", "numeral", "not applicable"])).optional().describe("Array of parts of speech to filter search results by (e.g. ['verb', 'noun'])"),
        formal: z.boolean().optional().describe("Whether to return formal definitions (true) or informal definitions (false) for the 'add' action"),
        lang: z.string().optional().describe("Language of the word (e.g. 'en', 'de', etc.) defaults to 'en'")
    }
};