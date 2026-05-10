const { z } = require("zod");
const utilities = require("../utilities");

const NAMESETS = ["us","ar","au","br","celat","ch","zhtw","hr","cs","dk","nl","en","er","fi","fr","gr","gl","sp","hobbit","hu","is","ig","it","jpja","jp","tlh","ninja","no","fa","pl","ru","rucyr","gd","sl","sw","th","vn"];
const COUNTRIES = ["au","as","bg","br","ca","cyen","cygk","cz","dk","ee","fi","fr","gr","gl","hu","is","it","nl","nz","no","pl","pt","sl","za","sp","sw","sz","tn","uk","us","uy"];

const stripTags = str => str.replace(/<[^>]*>/g, "").trim();

const handler = async ({ nameset, country, gender, age_min, age_max, genderWeight }) => {
    const gen = gender === "female" ? 0 : gender === "male" ? 100 : 100 - (genderWeight || 50);

    const params = new URLSearchParams({
        "t": "country",
        "gen": gen,
        "age-min": age_min ?? 19,
        "age-max": age_max ?? 85
    });
    params.append("n[]", nameset ?? "us");
    params.append("c[]", country ?? "us");

    const res = await fetch(`https://www.fakenamegenerator.com/advanced.php?${params}`, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });
    const html = await res.text();

    const identity = {};

    const nameMatch = html.match(/<div class="info">\s*<div class="content">\s*<div class="address">\s*<h3>([^<]+)<\/h3>/);
    if (nameMatch) identity.name = nameMatch[1].trim();

    const adrMatch = html.match(/<div class="adr">\s*([\s\S]*?)<\/div>/);
    if (adrMatch) identity.address = adrMatch[1].replace(/<br\s*\/?>/g, ", ").replace(/<[^>]*>/g, "").trim();

    const dlMatches = html.matchAll(/<dl class="dl-horizontal">\s*<dt>(.*?)<\/dt>\s*<dd>(.*?)<\/dd>\s*<\/dl>/gs);
    for (const match of dlMatches) {
        const key = stripTags(match[1]).trim();
        const raw = match[2].split(/<div class="adtl"/)[0];
        const val = stripTags(raw).replace(/\s+/g, " ").trim();
        if (key && val && key !== "QR Code") identity[key] = val;
    }

    return utilities.sendify(identity);
};

module.exports = {
    identifier: "Generate_Identity",
    handler,
    params: {
        nameset: z.enum(NAMESETS).optional().describe("Name origin (default: us/American)"),
        country: z.enum(COUNTRIES).optional().describe("Address country (default: us)"),
        gender: z.enum(["male", "female", "random"]).optional().describe("Gender (default: random)"),
        genderWeight: z.number().min(0).max(100).optional().describe("odds of result being male/female. lower = male, higher = female. Only applicable when gender is set to random. (default: 50)"),
        age_min: z.number().min(1).max(100).optional().describe("Minimum age (default: 19)"),
        age_max: z.number().min(1).max(100).optional().describe("Maximum age (default: 85)")
    }
};