const { z } = require("zod");
const utilities = require("../utilities");

const handler = async ({ source }) => {
    switch (source) {
        case "dadjoke": {
            const res = await fetch("https://icanhazdadjoke.com/", {
                headers: { "Accept": "application/json" }
            });
            const data = await res.json();
            return utilities.sendify({ source: "dadjoke", joke: data.joke });
        }
        case "chucknorris": {
            const res = await fetch("https://api.chucknorris.io/jokes/random");
            const data = await res.json();
            return utilities.sendify({ source: "chucknorris", joke: data.value });
        }
        case "uselessfact":
        default: {
            const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random", {
                headers: { "Accept": "application/json" }
            });
            const data = await res.json();
            return utilities.sendify({ source: "uselessfact", fact: data.text });
        }
    }
};

module.exports = {
    identifier: "Random_Nonsense",
    handler,
    params: {
        source: z.enum(["uselessfact", "dadjoke", "chucknorris"]).optional().describe("Source of nonsense (default: uselessfact)")
    }
};