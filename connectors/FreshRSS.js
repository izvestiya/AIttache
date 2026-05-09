const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const baseURL = process.env.FRESHRSS_ROOT || "http://localhost";
const username = process.env.FRESHRSS_USER || "your_username";
const apiPassword = process.env.FRESHRSS_API_PASSWORD || "your_api_password";

const getToken = async () => {
    const res = await fetch(`${baseURL}/api/greader.php/accounts/ClientLogin`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ Email: username, Passwd: apiPassword })
    });
    const text = await res.text();
    console.error("Auth response:", text);
    const match = text.match(/Auth=(.+)/);
    if (!match) throw new Error("FreshRSS auth failed");
    return match[1].trim();
};

const handler = async ({ action }) => {
    const token = await getToken();
    const headers = { "Authorization": `GoogleLogin auth=${token}` };

    const endpoints = {
        unread: `/api/greader.php/reader/api/0/unread-count?output=json`,
        feeds: `/api/greader.php/reader/api/0/subscription/list?output=json`,
        items: `/api/greader.php/reader/api/0/stream/contents/reading-list?output=json&n=20`,
    };

    const res = await fetch(`${baseURL}${endpoints[action]}`, { headers });
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "FreshRSS",
    handler,
    params: {
        action: z.enum(["unread", "feeds", "items"]).describe("What to fetch: unread counts, feed list, or recent items")
    }
};