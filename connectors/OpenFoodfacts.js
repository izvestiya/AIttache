const { z } = require("zod");
const utilities = require("../utilities");

const base = "https://world.openfoodfacts.org";
const headers = { "User-Agent": "AIttache/1.0" };

const handler = async ({ action, query, barcode, page }) => {
    let url;
    const fields = "product_name,brands,nutriscore_grade,nutriments,ingredients_text,allergens,categories,image_url";

    switch (action) {
        case "search":
            if (!query) return utilities.sendify({ error: "query is required for search action" });
            url = `${base}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&page=${page || 1}&fields=${fields}`;
            console.error("Fetching OpenFoodFacts search URL:", url);
            break;
        case "barcode":
            if (!barcode) return utilities.sendify({ error: "barcode is required for barcode action" });
            url = `${base}/api/v2/product/${barcode}.json?fields=${fields}`;
            break;
        default:
            return utilities.sendify({ error: "Invalid action" });
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    return utilities.sendify(data);
};

handler({ action: "search", query: "nutella", page: 2 });

module.exports = {
    identifier: "openfoodfacts",
    handler,
    params: {
        action: z.enum(["search", "barcode"]).describe("Search by text query or look up by barcode"),
        query: z.string().optional().describe("Text search query, e.g. 'nutella' or 'oat milk'. Only used with 'search' action"),
        page: z.number().int().optional().describe("Page number for search results. Only used with 'search' action defaults to 1 (1st page)"),
        barcode: z.string().optional().describe("Product barcode (EAN/UPC). Only used with 'barcode' action")
    } // Params for the endpoint
};