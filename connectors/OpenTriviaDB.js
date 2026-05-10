const { z } = require("zod");
const utilities = require("../utilities");

const CATEGORY_MAP = {
    general: 9, books: 10, film: 11, music: 12, theatre: 13, television: 14,
    videogames: 15, boardgames: 16, nature: 17, computers: 18, maths: 19,
    mythology: 20, sports: 21, geography: 22, history: 23, politics: 24,
    art: 25, celebrities: 26, animals: 27, vehicles: 28, comics: 29,
    gadgets: 30, anime: 31, cartoons: 32
};

const handler = async ({ amount, category, difficulty, type }) => {
    const params = new URLSearchParams();
    params.set("amount", amount ?? 1);
    if (category && CATEGORY_MAP[category]) params.set("category", CATEGORY_MAP[category]);
    if (difficulty) params.set("difficulty", difficulty);
    if (type) params.set("type", type);
    params.set("encode", "url3986");

    const res = await fetch(`https://opentdb.com/api.php?${params}`);
    const data = await res.json();

    if (data.response_code !== 0) {
        return utilities.sendify({ error: "Failed to fetch questions", response_code: data.response_code });
    }

    const decoded = data.results.map(q => ({
        category: decodeURIComponent(q.category),
        type: q.type,
        difficulty: q.difficulty,
        question: decodeURIComponent(q.question),
        correct_answer: decodeURIComponent(q.correct_answer),
        incorrect_answers: q.incorrect_answers.map(a => decodeURIComponent(a))
    }));

    return utilities.sendify(decoded);
};

module.exports = {
    identifier: "Trivia",
    handler,
    params: {
        amount: z.number().min(1).max(10).optional().describe("Number of questions (1-10, default 1)"),
        category: z.enum(Object.keys(CATEGORY_MAP)).optional().describe("Question category"),
        difficulty: z.enum(["easy", "medium", "hard"]).optional().describe("Question difficulty"),
        type: z.enum(["multiple", "boolean"]).optional().describe("Question type: multiple choice or true/false")
    }
};