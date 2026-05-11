const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const base = "https://api.open-meteo.com/v1";
const aqBase = "https://air-quality-api.open-meteo.com/v1";

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
        case "air_quality": {
            const url = `${aqBase}/air-quality?latitude=${latitude}&longitude=${longitude}&current=european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&timezone=auto`;
            const res = await fetch(url);
            const data = await res.json();
            return utilities.sendify(data);
        }
        case "sun": {
            const url = `${base}/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset,daylight_duration&timezone=auto&forecast_days=1`;
            const res = await fetch(url);
            const data = await res.json();
            return utilities.sendify(data);
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "Weather",
    handler,
    params: {
        action: z.enum(["current", "forecast", "air_quality", "sun"]).describe("current weather, 7-day forecast, air quality, or sunrise/sunset for today"),
        latitude: z.number().optional().describe("Latitude coordinate. Not needed if location is provided"),
        longitude: z.number().optional().describe("Longitude coordinate. Not needed if location is provided"),
        location: z.string().optional().describe("City or place name, e.g. 'Los Angeles' or 'Tokyo'. Used to auto-resolve coordinates")
    }
};