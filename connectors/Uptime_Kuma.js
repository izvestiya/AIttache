const { z } = require("zod");
const utilities = require("../utilities");

const baseURL = process.env.UPTIME_KUMA_ROOT || "http://localhost:3001";
const token = process.env.UPTIME_KUMA_TOKEN || "your_token_here";

// Handler for what to return
const handler = async () => {
    const res = await fetch(`${baseURL}/metrics`, {
        headers: {
            "Authorization": "Basic " + Buffer.from(":" + token).toString("base64")
        }
    });
    const data = await res.text();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "Uptime_Kuma",
    handler,
    params: {} // Params for the endpoint
}
