const { z } = require("zod");
const utilities = require("../utilities");

const base = "https://api.frankfurter.dev";
const headers = { "User-Agent": "AIttache/1.0" };

const handler = async ({ action, from, to, date }) => {
    let url;

    switch (action) {
        case "rate": {
            if (!from || !to) return utilities.sendify({ error: "from and to are required for rate action" });
            url = `${base}/v2/rate/${from}/${to}`;
            if (date) url += `?date=${date}`;
            break;
        }
        case "latest": {
            url = `${base}/v1/latest?base=${from || "EUR"}`;
            if (to) url += `&symbols=${to}`;
            break;
        }
        case "historical": {
            if (!date) return utilities.sendify({ error: "date is required for historical action (YYYY-MM-DD)" });
            url = `${base}/v1/${date}?base=${from || "EUR"}`;
            if (to) url += `&symbols=${to}`;
            break;
        }
        case "currencies": {
            url = `${base}/v2/currencies`;
            break;
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "Exchange_Rate",
    handler,
    params: {
        action: z.enum(["rate", "latest", "historical", "currencies"]).describe("Get a single currency pair rate, all latest rates, historical rates for a date, or list available currencies. Note, latest works for single values too, but may not contain all currencies"),
        from: z.string().optional().describe("Base currency code, e.g. 'EUR', 'USD', 'JPY'. Defaults to EUR"),
        to: z.string().optional().describe("Target currency code(s), e.g. 'USD' or 'USD,GBP'. Required for 'rate' action, optional for 'latest' and 'historical'"),
        date: z.string().optional().describe("Date in YYYY-MM-DD format. Used with 'historical' and optionally 'rate' action")
    }
};