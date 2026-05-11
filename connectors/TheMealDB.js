const { z } = require("zod");
const utilities = require("../utilities");

const base = "https://www.themealdb.com/api/json/v1/1";

const parseMeal = (meal) => {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ing && ing.trim()) ingredients.push(`${measure ? measure.trim() + " " : ""}${ing.trim()}`);
    }
    return {
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory,
        area: meal.strArea,
        instructions: meal.strInstructions,
        ingredients,
        thumbnail: meal.strMealThumb,
        tags: meal.strTags?.split(",").map(t => t.trim()),
        youtube: meal.strYoutube,
        source: meal.strSource
    };
};

const handler = async ({ action, query, ingredient, category, area, id }) => {
    let url;
    switch (action) {
        case "search":
            url = `${base}/search.php?s=${encodeURIComponent(query ?? "")}`;
            break;
        case "by_ingredient":
            url = `${base}/filter.php?i=${encodeURIComponent(ingredient ?? "")}`;
            break;
        case "by_category":
            url = `${base}/filter.php?c=${encodeURIComponent(category ?? "")}`;
            break;
        case "by_area":
            url = `${base}/filter.php?a=${encodeURIComponent(area ?? "")}`;
            break;
        case "details":
            if (!id) return utilities.sendify({ error: "id is required for details" });
            url = `${base}/lookup.php?i=${id}`;
            break;
        case "categories":
            url = `${base}/list.php?c=list`;
            break;
        case "areas":
            url = `${base}/list.php?a=list`;
            break;
        case "random":
        default:
            url = `${base}/random.php`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (data.meals === null) return utilities.sendify({ error: "No meals found" });

    if (action === "categories" || action === "areas") {
        return utilities.sendify(data.meals.map(m => m.strCategory || m.strArea));
    }

    const meals = (action === "by_ingredient" || action === "by_category" || action === "by_area")
        ? data.meals.map(m => ({ id: m.idMeal, name: m.strMeal, thumbnail: m.strMealThumb }))
        : data.meals.map(parseMeal);

    return utilities.sendify(meals);
};

module.exports = {
    identifier: "Meals",
    handler,
    params: {
        action: z.enum(["random", "search", "by_ingredient", "by_category", "by_area", "details", "categories", "areas"]).optional().describe("Action to perform (default: random)"),
        query: z.string().optional().describe("Meal name to search for. Used with 'search'"),
        ingredient: z.string().optional().describe("Ingredient to filter by. Used with 'by_ingredient'"),
        category: z.string().optional().describe("Category to filter by (e.g. 'Seafood', 'Vegetarian'). Used with 'by_category'"),
        area: z.string().optional().describe("Cuisine/area to filter by (e.g. 'Italian', 'Japanese'). Used with 'by_area'"),
        id: z.string().optional().describe("Meal ID. Used with 'details'")
    }
};