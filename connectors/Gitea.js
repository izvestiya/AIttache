const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const base = process.env.GITEA_ROOT;
const token = process.env.GITEA_TOKEN;

const handler = async ({ action, owner, repo, path }) => {
    const headers = { "Authorization": `token ${token}` };

    let url;
    switch (action) {
        case "repos":
            url = `${base}/api/v1/repos/search`;
            break;
        case "issues":
            url = `${base}/api/v1/repos/${owner}/${repo}/issues`;
            break;
        case "tree":
            url = `${base}/api/v1/repos/${owner}/${repo}/git/trees/HEAD?recursive=true`;
            break;
        case "file":
            url = `${base}/api/v1/repos/${owner}/${repo}/contents/${path}`;
            const fileRes = await fetch(url, { headers });
            const fileData = await fileRes.json();
            fileData.content = Buffer.from(fileData.content, "base64").toString("utf8");
            return utilities.sendify(fileData);
        default:
            url = `${base}/api/v1/repos/${owner}/${repo}`;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    return utilities.sendify(data);
};

handler({action: "file", owner: "LucidTech", repo: "setup", path: "Docker/Planka/docker-compose.yml"})

module.exports = {
    identifier: "gitea",
    handler,
    params: {
        action: z.enum(["repos", "repo", "issues", "file", "tree"]).describe("What to fetch: list repos, single repo details, issues, or file contents"),
        owner: z.string().optional().describe("Repo owner/org name"),
        repo: z.string().optional().describe("Repo name"),
        path: z.string().optional().describe("File path within repo, only used with 'file' action")
    }
};
