const { z } = require("zod");
const utilities = require("../utilities");

const BASE = "https://www.thecocktaildb.com/api/json/v1/1";

const parseDrink = (drink) => {
    const ingredients = [];
    for (let i = 1; i <= 15; i++) {
        const ing = drink[`strIngredient${i}`];
        const measure = drink[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push(`${measure ? measure.trim() + " " : ""}${ing.trim()}`);
    }
    return {
        name: drink.strDrink,
        category: drink.strCategory,
        alcoholic: drink.strAlcoholic,
        glass: drink.strGlass,
        instructions: drink.strInstructions,
        ingredients,
        thumbnail: drink.strDrinkThumb
    };
};

const handler = async ({ action, query, ingredient }) => {
    let url;
    switch (action) {
        case "search":
            url = `${BASE}/search.php?s=${encodeURIComponent(query ?? "")}`;
            break;
        case "by_ingredient":
            url = `${BASE}/filter.php?i=${encodeURIComponent(ingredient ?? "")}`;
            break;
        case "random":
        default:
            url = `${BASE}/random.php`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (!data.drinks) return utilities.sendify({ error: "No drinks found" });

    const drinks = action === "by_ingredient"
        ? data.drinks.map(d => ({ name: d.strDrink, thumbnail: d.strDrinkThumb }))
        : data.drinks.map(parseDrink);

    return utilities.sendify(drinks);
};

module.exports = {
    identifier: "Cocktails",
    handler,
    params: {
        action: z.enum(["random", "search", "by_ingredient"]).describe("Action to perform"),
        query: z.string().optional().describe("Cocktail name to search for. Only used with 'search' action."),
        ingredient: z.string().optional().describe("Ingredient to filter by. Only used with 'by_ingredient' action.")
    }
};