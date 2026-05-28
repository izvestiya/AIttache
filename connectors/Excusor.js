const { z } = require("zod");
const utilities = require("../utilities");

const templateObj = {
    folklore: [],
    madeUp: []
}

utilities.loadData("Excusor") || utilities.saveData("Excusor", templateObj);

const buildQuery = (mm, dd) => {
    return `
SELECT ?entity ?entityLabel ?date ?workLabel ?type WHERE {
  {
    ?entity wdt:P569 ?date ;
            wdt:P31 wd:Q95074 .
    BIND("birth" AS ?type)
  } UNION {
    ?entity wdt:P570 ?date ;
            wdt:P31 wd:Q95074 .
    BIND("death" AS ?type)
  } UNION {
    ?entity wdt:P585 ?date ;
            wdt:P31/wdt:P279* wd:Q13406554 .
    BIND("event" AS ?type)
  }
  OPTIONAL { ?entity wdt:P1441 ?work . }
  FILTER(MONTH(?date) = ${parseInt(mm)} && DAY(?date) = ${parseInt(dd)})
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 100
`;
}

const queryWikidata = async (mm, dd) => {
  const res = await fetch("https://query.wikidata.org/sparql", {
    method: "POST",
    headers: {
      "Accept": "application/sparql-results+json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "AIttache/1.0 (AIttache)"
    },
    body: new URLSearchParams({ query: buildQuery(mm, dd) })
  });
  
  if (!res.ok) {
    throw new Error(`Wikidata returned ${res.status}: ${await res.text()}`);
  }
  
  const data = await res.json();
  return data.results.bindings.map(row => ({
    name: row.entityLabel?.value,
    date: row.date?.value,
    work: row.workLabel?.value,
    type: row.type?.value
  }));
}

const handler = async ({ date, factual, fictional, madeUp, folklore }) => {
    const data = utilities.loadData("Excusor") || templateObj;

    // Default to today's date if not provided
    const dateStr = date || new Date().toISOString().split("T")[0];
    const [month, day] = dateStr.split("-").slice(1).map(Number);

    // Pad month and day with leading zeros for consistent formatting
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");

    // Define and decide on category(s) to pull from
    const categories = [];
    if (factual) categories.push("factual");
    if (fictional) categories.push("fictional");
    if (madeUp) categories.push("madeUp");
    if (folklore) categories.push("folklore");

    if (categories.length === 0) {
        categories.push("factual", "fictional", "madeUp");
    }

    const category = utilities.getRandomItem(categories);

    switch (category) {
        case "factual":
            const eventType = utilities.getRandomItem(["events", "births", "deaths"]);
            const res = await fetch(`https://byabbe.se/on-this-day/${month}/${day}/${eventType}.json`);
            const json = await res.json();

            const entry = utilities.getRandomItem(json[`${eventType}`]);
            entry.date = `${month}/${day}`;
            entry.eventType = eventType;

            return utilities.sendify(entry);
        case "fictional":
            try {
                const fictionalEvent = await queryWikidata(mm, dd);
                if (fictionalEvent.length === 0) {
                    return utilities.sendify({ content: [{ type: "text", text: "No fictional events found for this date. Go write the next Lord of the Rings and make today important enough to be recognized by a fanbase" }] });
                }
                return utilities.sendify(utilities.getRandomItem(fictionalEvent));
            } catch (error) {
                console.error("Error querying Wikidata:", error);
                return utilities.sendify({ content: [{ type: "error", text: "could not fetch fictional event. Probably just the API having a dramatic moment. Try again within a UPS-window (somewhere between 1 minute and the heat death of the universe)" }] });
            }
        case "madeUp":
            return utilities.sendify(utilities.getRandomItem(data.madeUp));
        case "folklore":
            const entries = data.folklore;
            const validEntries = entries.filter(e => e?.date.endsWith(`-${mm}-${dd}`));

            if (validEntries.length === 0) {
                return utilities.sendify({ content: [{ type: "text", text: "No folklore entries found for this date." }] });
            }

            console.error(validEntries);

            return utilities.sendify(utilities.getRandomItem(validEntries));
        default:
            throw new Error("Invalid category");
    }
};

module.exports = {
    identifier: "Excusor",
    handler,
    params: {
        date: z.string().optional().describe("ISO date (YYYY-MM-DD) to query. Defaults to today."),
        factual: z.boolean().optional().describe("Whether the content is factual or not (e.g. the date of the Jalta Conference). Defaults to false. Note, if any bools are set to true, everything not set to true will be ignored."),
        fictional: z.boolean().optional().describe("Whether the content is fictional or not (e.g. Harry Potter's birthday). Defaults to false. Note, if any bools are set to true, everything not set to true will be ignored."),
        madeUp: z.boolean().optional().describe("Whether the content is made up or not (e.g. Luke Skywalker's birthday, International Fidget Toy Awareness Day, etc.). Defaults to false. Note, if any bools are set to true, everything not set to true will be ignored."),
        folklore: z.boolean().optional().describe("Whether the content is made up (same as madeUp, but with a date attached). Defaults to false. Note, if any bools are set to true, everything not set to true will be ignored.")
    }
};
