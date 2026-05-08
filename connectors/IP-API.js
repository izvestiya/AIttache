const { z } = require("zod");
const utilities = require("../utilities");

const handler = async ({ ip }) => {
    const target = ip || "";
    const url = `http://ip-api.com/json/${target}?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`;
    const res = await fetch(url);
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "IP_Geolocation",
    handler,
    params: {
        ip: z.string().optional().describe("IP address or domain to look up. Omit to look up the server's own IP")
    }
};
