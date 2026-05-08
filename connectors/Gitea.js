const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const base = process.env.GITEA_ROOT;
const token = process.env.GITEA_TOKEN;

const handler = async ({ action, owner, repo, path, issueTitle, issueContent }) => {
    const user = await (await fetch(`${base}/api/v1/user`, { headers: { "Authorization": `token ${token}` } })).json();
    const username = user.username;
    const headers = { "Authorization": `token ${token}` };

    console.error(username);

    let url;
    switch (action) {
        case "repos":
            url = `${base}/api/v1/repos/search`;
            break;
        case "issues":
            url = `${base}/api/v1/repos/${owner}/${repo}/issues`;
            break;
        case "create_issue":
            if (!owner || !repo || !issueTitle || !issueContent) {
                return utilities.sendify({ error: "owner, repo, issueTitle, and issueContent are required for create_issue action" });
            }
            url = `${base}/api/v1/repos/${owner}/${repo}/issues`;
            const body = {
                title: issueTitle,
                body: `${issueContent}\n---\n*Issue filled on behalf of ${username} via AIttache*`
            };
            const issueRes = await fetch(url, { method: "POST", headers: { "Authorization": `token ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const issueData = await issueRes.json();
            return utilities.sendify(issueData);
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

module.exports = {
    identifier: "gitea",
    handler,
    params: {
        action: z.enum(["repos", "repo", "issues", "file", "tree", "create_issue"]).describe("What to fetch: list repos, single repo details, issues, or file contents. create_issue creates an issue on the user's behalf"),
        owner: z.string().optional().describe("Repo owner/org name"),
        repo: z.string().optional().describe("Repo name"),
        path: z.string().optional().describe("File path within repo, only used with 'file' action"),
        issueTitle: z.string().optional().describe("Title for the issue, only used with 'create_issue' action"),
        issueContent: z.string().optional().describe("Content for the issue, only used with 'create_issue' action")
    }
};
