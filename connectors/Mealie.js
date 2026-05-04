const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/../.env`, quiet: true });

const base = process.env.MEALIE_ROOT;
const token = process.env.MEALIE_TOKEN;

const handler = async ({ action, query, recipeId }) => {
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    let url;
    switch (action) {
        case "recipes":
            url = `${base}/api/recipes`;
            break;
        case "recipe":
            url = `${base}/api/recipes/${recipeId}`;
            break;
        case "search":
            url = `${base}/api/recipes?search=${encodeURIComponent(query)}`;
            break;
        case "mealplan":
            url = `${base}/api/households/mealplans/today`;
            break;
        case "shopping":
            url = `${base}/api/households/shopping/lists`;
            break;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "mealie",
    handler,
    params: {
        action: z.enum(["recipes", "recipe", "search", "mealplan", "shopping"]).describe("What to fetch: list recipes, single recipe, search, today's meal plan, or shopping lists"),
        query: z.string().optional().describe("Search query, only used with 'search' action"),
        recipeId: z.string().optional().describe("Recipe slug or ID, only used with 'recipe' action")
    }
};