const { z } = require("zod");
const utilities = require("../utilities");

const baseURL = "https://help.openai.com/en/articles/6825453-chatgpt-release-notes"

// Handler for what to return
const handler = async () => {
    const res = await fetch(baseURL);
    let text = await res.text();

    text = text.split("<article")[1].split("</article>")[0];

    return utilities.sendify(text);
};

module.exports = {
    identifier: "ChatGPT_Release_Notes",
    handler,
    params: {} // Params for the endpoint
}
