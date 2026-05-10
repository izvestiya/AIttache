const { z } = require("zod");
const utilities = require("../utilities");

const handler = async () => {
    const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random", {
        headers: { "Accept": "application/json" }
    });
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "Useless_Fact",
    handler,
    params: {}
};