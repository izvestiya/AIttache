const express = require("express");
const crypto = require("crypto");
const OAuthServer = require("@node-oauth/express-oauth-server");
// Modules for MCP via STDIO
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const utilities = require("./utilities");

require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

// MCP endpoint
const transports = {};
const authCodes = {};
const accessTokens = {};

const authMiddleware = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
        return res.status(401).json({ error: "unauthorized" });
    }
    const token = auth.slice(7);
    if (!accessTokens[token]) {
        return res.status(401).json({ error: "invalid_token" });
    }
    next();
};

// OAuth metadata discovery
const protectedResourceDiscovery = (req, res) => {
    console.error("Protected resource discovery hit");
    const base = process.env.MCP_PUBLIC_URL;
    res.json({
        resource: base,
        authorization_servers: [base],
        scopes_supported: ["mcp:tools"],
        bearer_methods_supported: ["header"]
    });
};

const authorizationServerDiscovery = (req, res) => {
    const base = process.env.MCP_PUBLIC_URL;
    res.json({
        issuer: base,
        authorization_endpoint: `${base}/authorize`,
        token_endpoint: `${base}/token`,
        response_types_supported: ["code"],
        grant_types_supported: ["client_credentials"],
        scopes_supported: ["mcp:tools"],
        token_endpoint_auth_methods_supported: ["client_secret_post"],
        code_challenge_methods_supported: ["S256"]
    });
};

const authorize = (req, res) => {
    const { client_id, redirect_uri, state, code_challenge, code_challenge_method } = req.query;
        console.error("Authorize request client_id:", req.query.client_id);
        console.error("Expected client_id:", process.env.MCP_CLIENT_ID);
    if (client_id !== process.env.MCP_CLIENT_ID) {
        return res.status(403).json({ error: "invalid_client" });
    }
    // Auto-approve — generate code immediately, no login page
    const code = crypto.randomBytes(32).toString("hex");
    authCodes[code] = {
        clientId: client_id,
        redirectUri: redirect_uri,
        codeChallenge: code_challenge,
        codeChallengeMethod: code_challenge_method,
        expires: Date.now() + 600000
    };

    const url = new URL(redirect_uri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    res.redirect(url.toString());
};

// Token endpoint
const token = (req, res, next) => {
    if (req.body.grant_type === "authorization_code") {
        const { code, redirect_uri, client_id, code_verifier } = req.body;
        const ac = authCodes[code];
        if (!ac || ac.expires < Date.now() || ac.clientId !== client_id || ac.redirectUri !== redirect_uri) {
            return res.status(400).json({ error: "invalid_grant" });
        }
        
        if (client_id !== process.env.MCP_CLIENT_ID) {
            return res.status(401).json({ error: "invalid_client" });
        }
        if (ac.codeChallenge) {
            const hash = crypto.createHash("sha256").update(code_verifier).digest("base64url");
            if (hash !== ac.codeChallenge) {
                return res.status(400).json({ error: "invalid_grant", error_description: "PKCE failed" });
            }
        }
        delete authCodes[code];
        const token = crypto.randomBytes(48).toString("hex");
        accessTokens[token] = {
            accessToken: token,
            accessTokenExpiresAt: new Date(Date.now() + 3600000),
            client: { id: client_id },
            user: { id: "owner" }
        };
        return res.json({
            access_token: token,
            token_type: "Bearer",
            expires_in: 3600
        });
    }
    next();
};

const mcpPost = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    if (sessionId && transports[sessionId]) {
        await transports[sessionId].handleRequest(req, res);
    } else {
        const mcpServer = utilities.createMcpServer();
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => {
                const id = crypto.randomUUID();
                transports[id] = transport;
                return id;
            }
        });
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res);
    }
};

const mcpGet = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    if (sessionId && transports[sessionId]) {
        await transports[sessionId].handleRequest(req, res);
    } else {
        res.status(400).json({ error: "No active session" });
    }
};
const mcpDelete = async (req, res) => {
    const sessionId = req.headers["mcp-session-id"];
    console.error("DELETE session:", sessionId);
    if (sessionId && transports[sessionId]) {
        delete transports[sessionId];
    }
    res.status(200).end();
};

const load = (app) => {
        app.oauth = new OAuthServer({
        model: {
            getClient: async (clientId, clientSecret) => {
                if (clientId === process.env.MCP_CLIENT_ID) {
                    if (clientSecret && clientSecret !== process.env.MCP_CLIENT_SECRET) return null;
                    return { id: clientId, grants: ["client_credentials", "authorization_code"], redirectUris: [] };
                }
                return null;
            },
            getUserFromClient: async (client) => {
                return { id: "owner" };
            },
            saveToken: async (token, client, user) => {
                token.client = client;
                token.user = user;
                accessTokens[token.accessToken] = token;
                return token;
            },
            getAccessToken: async (accessToken) => {
                return accessTokens[accessToken] || null;
            },
        }
    });
    app.get("/.well-known/oauth-protected-resource", protectedResourceDiscovery);
    app.get("/.well-known/oauth-authorization-server", authorizationServerDiscovery);
    app.get("/authorize", authorize);
    app.post("/token", express.urlencoded({ extended: true }), token, app.oauth.token());
    app.post("/mcp", authMiddleware, mcpPost);
    app.get("/mcp", authMiddleware, mcpGet);
    app.delete("/mcp", authMiddleware, mcpDelete);

    return app;
}
module.exports = { load };
