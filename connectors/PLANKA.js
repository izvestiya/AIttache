const { z } = require("zod");
const axios = require("axios");
require("dotenv").config();

const pRoot = process.env.PLANKA_ROOT;
const PEndPnts = {
    "auth": `${pRoot}/api/access-tokens`,
    "projects": `${pRoot}/api/projects`
};

// Check wether the token exists if not, fetch token from server
let accessToken = "";
const getAccessToken = async () => {
    if (!accessToken) {
        const res = await fetch(PEndPnts.auth, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                emailOrUsername: process.env.PLANKA_USER,
                password: process.env.PLANKA_PASSWD
            })
        });
        const data = await res.json();
        if (data.code === 'E_UNAUTHORIZED') {throw new Error("Invalid credentials")}
        accessToken = data.item;
        return data.item;
    } else {
        return accessToken
    }
}

// Handler for what to return
const handler = async () => {
    const res = await fetch(PEndPnts.projects, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getAccessToken()}`
            },
        });

    const data = await res.json();
    return data;
};

module.exports = {
    identifier: "planka_get_overview",
    handler,
    params: {}, // Params for the endpoint
    getAccessToken,
    PEndPnts
}
