const { z } = require("zod");
const utilities = require("../utilities");

const handler = async ({ source, animal }) => {
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
        case "animalfact": {
            const a = animal ?? "cat";
            const url = a === "dog"
                ? "https://dogapi.dog/api/v2/facts"
                : "https://catfact.ninja/fact";
            const res = await fetch(url);
            const data = await res.json();
            const fact = a === "dog" ? data.data[0].attributes.body : data.fact;
            return utilities.sendify({ source: "animalfact", animal: a, fact });
        }
        case "quote": {
            const res = await fetch("https://zenquotes.io/api/random");
            const data = await res.json();
            return utilities.sendify({ source: "quote", quote: data[0].q, author: data[0].a });
        }
        case "onthisday": {
            const now = new Date();
            const month = now.getMonth() + 1;
            const day = now.getDate();
            const res = await fetch(`https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/events/${month}/${day}`);
            const data = await res.json();
            const events = data.events ?? [];
            const pick = events[Math.floor(Math.random() * events.length)];
            return utilities.sendify({ source: "onthisday", date: `${month}/${day}`, year: pick?.year, event: pick?.text });
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
        source: z.enum(["uselessfact", "dadjoke", "chucknorris", "animalfact", "quote", "onthisday"]).optional().describe("Source of nonsense (default: uselessfact)"),
        animal: z.enum(["cat", "dog"]).optional().describe("Animal for fact. Only used with 'animalfact' source (default: cat)")
    }
};