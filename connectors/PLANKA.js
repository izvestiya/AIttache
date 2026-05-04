const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const pRoot = process.env.PLANKA_ROOT;
const PEndPnts = {
    "auth": `${pRoot}/api/access-tokens`,
    "projects": `${pRoot}/api/projects`,
    "boards": `${pRoot}/api/boards`
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
const handler = async ({boardID}) => {
    let data = {};
    if (boardID) {
        const res = await fetch(`${PEndPnts.boards}/${boardID}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getAccessToken()}`
                },
            });
        data = await res.json();
    } else {
        const res = await fetch(PEndPnts.projects, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${await getAccessToken()}`
                },
            });
        data = await res.json();
        
    }
    return utilities.sendify(data);
};

module.exports = {
    identifier: "planka_get_overview",
    handler,
    params: {
        boardID: z.string().optional().describe("The Planka board ID. Leave blank to get a total list of boards")
    }, // Params for the endpoint
    getAccessToken,
    PEndPnts
}
