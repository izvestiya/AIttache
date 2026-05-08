const { z } = require("zod");
const utilities = require("../utilities");

const base = "https://api.open-meteo.com/v1";

const handler = async ({ action, latitude, longitude, location }) => {
    if (location && (!latitude || !longitude)) {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results || !geoData.results.length) return utilities.sendify({ error: "Location not found" });
        latitude = geoData.results[0].latitude;
        longitude = geoData.results[0].longitude;
    }

    if (!latitude || !longitude) return utilities.sendify({ error: "latitude/longitude or location is required" });

    switch (action) {
        case "current": {
            const url = `${base}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            return utilities.sendify(data);
        }
        case "forecast": {
            const url = `${base}/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            return utilities.sendify(data);
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "weather",
    handler,
    params: {
        action: z.enum(["current", "forecast"]).describe("Get current weather conditions or 7-day daily forecast"),
        latitude: z.number().optional().describe("Latitude coordinate. Not needed if location is provided"),
        longitude: z.number().optional().describe("Longitude coordinate. Not needed if location is provided"),
        location: z.string().optional().describe("City or place name, e.g. 'Los Angeles' or 'Tokyo'. Used to auto-resolve coordinates")
    }
};