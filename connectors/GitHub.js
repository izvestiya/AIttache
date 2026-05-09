const { z } = require("zod");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

const token = process.env.GITHUB_TOKEN;

const handler = async ({ action, owner, repo, path, issueTitle, issueContent }) => {
    const headers = {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28"
    };

    const userRes = await fetch("https://api.github.com/user", { headers });
    const user = await userRes.json();
    const username = user.login;

    console.error(username);

    let url;
    switch (action) {
        case "repos":
            url = `https://api.github.com/user/repos?per_page=100`;
            break;
        case "issues":
            url = `https://api.github.com/repos/${owner}/${repo}/issues`;
            break;
        case "create_issue":
            if (!owner || !repo || !issueTitle || !issueContent) {
                return utilities.sendify({ error: "owner, repo, issueTitle, and issueContent are required for create_issue action" });
            } else if (process.env.GITHUB_ALLOW_ISSUE_CREATION !== "true") {
                return utilities.sendify({ error: "Issue creation is disabled by the administrator" });
            }
            url = `https://api.github.com/repos/${owner}/${repo}/issues`;
            const body = {
                title: issueTitle,
                body: `${issueContent}\n---\n*Issue filed on behalf of ${username} via AIttache*`
            };
            const issueRes = await fetch(url, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify(body) });
            const issueData = await issueRes.json();
            return utilities.sendify(issueData);
        case "tree":
            url = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
            break;
        case "file":
            url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
            const fileRes = await fetch(url, { headers });
            const fileData = await fileRes.json();
            fileData.content = Buffer.from(fileData.content, "base64").toString("utf8");
            return utilities.sendify(fileData);
        default:
            url = `https://api.github.com/repos/${owner}/${repo}`;
    }

    const res = await fetch(url, { headers });
    const data = await res.json();
    return utilities.sendify(data);
};

module.exports = {
    identifier: "GitHub",
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