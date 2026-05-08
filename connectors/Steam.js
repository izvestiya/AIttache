const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const key = process.env.STEAM_API_KEY;
const api = "https://api.steampowered.com";
const store = "https://store.steampowered.com";
const fallbackVanityId = process.env.STEAM_USER_VANITY_ID || "gabelogannewell";

const handler = async ({ action, appid, steamid, query, region }) => {
    switch (action) {
        case "me": {
            if (!key) return utilities.sendify({ error: "STEAM_API_KEY required" });
            const res = await fetch(`${api}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=`);
            const data = await res.json();
            return utilities.sendify(data.response);
        }
        case "app_details": {
            if (!appid) return utilities.sendify({ error: "appid is required" });
            const res = await fetch(`${store}/api/appdetails?appids=${appid}`);
            const data = await res.json();
            return utilities.sendify(data[appid]);
        }
        case "search": {
            if (!query) return utilities.sendify({ error: "query is required" });
            const res = await fetch(`${store}/api/storesearch/?term=${encodeURIComponent(query)}&l=english&cc=${region || "DE"}`);
            const data = await res.json();
            return utilities.sendify(data);
        }
        case "player": {
            if (!steamid) return utilities.sendify({ error: "steamid is required" });
            if (!key) return utilities.sendify({ error: "STEAM_API_KEY required for player lookups" });
            const res = await fetch(`${api}/ISteamUser/GetPlayerSummaries/v2/?key=${key}&steamids=${steamid || fallbackVanityId}`);
            const data = await res.json();
            return utilities.sendify(data.response.players[0] || { error: "Player not found" });
        }
        case "owned_games": {
            if (!steamid) return utilities.sendify({ error: "steamid is required" });
            if (!key) return utilities.sendify({ error: "STEAM_API_KEY required for owned games" });
            const res = await fetch(`${api}/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamid || fallbackVanityId}&include_appinfo=1&include_played_free_games=1`);
            const data = await res.json();
            return utilities.sendify(data.response);
        }
        case "resolve_vanity": {
            if (!query) return utilities.sendify({ error: "query (vanity URL name) is required" });
            if (!key) return utilities.sendify({ error: "STEAM_API_KEY required for vanity URL resolution" });
            const res = await fetch(`${api}/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(query)}`);
            const data = await res.json();
            return utilities.sendify(data.response);
        }
        case "current_players": {
            if (!appid) return utilities.sendify({ error: "appid is required" });
            const res = await fetch(`${api}/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appid}`);
            const data = await res.json();
            return utilities.sendify(data.response);
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "Steam",
    handler,
    params: {
        action: z.enum(["me", "app_details", "search", "player", "owned_games", "resolve_vanity", "current_players"]).describe("Get user info, get app details, search the store, look up a player, list owned games, resolve a vanity URL to SteamID, or get current player count"),
        appid: z.string().optional().describe("Steam App ID, e.g. '730' for CS2. Used with app_details and current_players"),
        steamid: z.string().optional().describe("64-bit Steam ID. Used with player and owned_games"),
        query: z.string().optional().describe("Search term or vanity URL name. Used with search and resolve_vanity"),
        region: z.string().optional().describe("Two-letter country code for store search results, e.g. 'US', 'DE'. Defaults to 'DE'")
    }
};