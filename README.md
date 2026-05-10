# AIttache

## AI is like acetylene. Very useful for construction. Both blow up sideways if left unsupervised

You know what's great about agentic AI? It can autonomously SSH into your server, confidently misread a log file, and rm -rf something important - all while you're making coffee.

AIttache is not that.

It's a modular MCP server that gives LLMs controlled, read-only access to your infrastructure. Think of it like a diplomatic attaché; present, informed, and strictly prohibited from touching anything. You get the situational awareness. The LLM gets context. Nobody's database gets dropped. Neither does your Taxes 2012 folder.

---

## Why

There's no shortage of MCP tooling that wants to give your LLM more autonomy. Write files, run commands, manage deployments. The whole pitch is that the AI should just *do* things for you.

Bold strategy. Statistically eventful.

AIttache was built out of a specific frustration: the useful part of having an LLM involved in infrastructure work isn't the autonomy; it's the context. Being able to say "look at this log" and have something actually look at it, reason about it (or at least attempts to), and push back. A sparring partner with situational awareness (and sometimes grand delusions), not a golden retriever with sudo access.

The agentic approach solves a different problem (mainly the problem of "too much stability"). AIttache solves the one where you just want a second pair of eyes that can't accidentally kick a production service at 2AM because it was "pretty sure" it knew what it was doing.

---

## What it's good for

Copy-pasting terminal output into a chat window is the 2026-equivalent of faxing. "Here's the log, what do you think?" > paste 300 lines > "actually wait, wrong file" > paste 300 more lines.

AIttache cuts that out entirely. Your LLM gets live access to exactly what you expose, nothing more. Real logs. Real service states. Real uptime data. No copy-paste, no stale context, no surprises.

It's particularly good for:

- Debugging with an LLM that can actually see what's happening
- Keeping tabs on your stack mid-conversation
- Brainstorming with live context instead of vibes
- Pretending you have a NOC when you're just one person in a loft

What it does not improve on:

- The lack of the ability to follow an instruction with more than 2 constraints and 1 goal (it'll be wrong, but informed)
- Makeing vibe-coding viable
- un-`rm -rf /` your server after the OpenClaw experiment

---

## How it works

AIttache exposes your connectors as MCP tools as either `STDIO` or `Streamable HTTP` with `OAuth 2.0` + `PKCE` authentication. Each connector is a self-contained module in the connectors/ directory. Adding or removing a connector is as simple as moving a file. No config changes, no restarts required in HTTP mode.

---

## Installation

```bash
git clone https://github.com/izvestiya/AIttache
cd AIttache
cp .env.example .env
# Fill in your .env
npm install
npm start
```

---

## Configuration

See `.env.example` for all available options. At minimum you'll need the following if using HTTP-mode:

```
MCP_PUBLIC_URL=https://mcp.yourdomain.com
MCP_CLIENT_ID=your_client_id
MCP_CLIENT_SECRET=your_client_secret
```

---

## Writing a connector

Drop a file in `connectors/` that exports the following shape:

```js
const { z } = require("zod");
const utilities = require("../utilities");

const handler = async (params) => {
    // Your logic here
    return utilities.sendify(result);
};

module.exports = {
    identifier: "my_connector",
    handler,
    params: {
        // Zod schema for parameters, or {} for none
    }
};
```

That's it. AIttache picks it up automatically on the next session if in HTTP-mode, or on restart if STDIO-mode.

---

## Philosophy

The trend in MCP tooling is to give LLMs more autonomy. AIttache goes the other way. Read-only by design, scoped by default, and simple enough that you can audit the entire codebase in an afternoon.

An LLM with context is a good sparring partner. An LLM with control is a liability.

Grant the eyes. Keep the hands.

---

## Included connectors

| **Connector**            | **Description**                                                                                                       |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------|
| `system_monitor`         | CPU, memory, disk, network, Docker, GPU                                                                               |
| `terminal_view`          | Live tmux pane capture                                                                                                |
| `file_watcher`           | Tail log/text files                                                                                                   |
| `gitea`                  | Browse repos, trees, and files, and file issues (Note: This is disabled by default and can be enabled in `.env`)      |
| `planka_get_overview`    | Kanban board overview                                                                                                 |
| `mealie`                 | Recipe and meal plan data                                                                                             |
| `tailscale`              | Network status and peer info                                                                                          |
| `speedtest`              | Run a live speedtest                                                                                                  |
| `Uptime_Kuma`            | Service uptime and response times                                                                                     |
| `system_processes`       | System processes (full `ps aux` dump)                                                                                 |
| `journalctl_check`       | JournalCTL-checker. Checks system logs                                                                                |
| `FreshRSS`               | FreshRSS feed                                                                                                         |
| `OpenFoodfacts`          | Fetch food-related data                                                                                               |
| `Wikipedia`              | Fetch data directly from Wikipedia (With language option for articles that only exists in one (or limited) languages) |
| `Wiktionary`             | Fetch etymology, definition, and other data about a word                                                              |
| `Exchange_Rate`          | Fetch exchange rates from Frankfurter.dev                                                                             |
| `Open-Meteo`             | Weather forecast                                                                                                      |
| `IP_Geolocation`         | IP-API.com lookup                                                                                                     |
| `Unshorten`              | URL-shortener. Resolves hidden shortened URLs                                                                         |
| `Steam`                  | Pull data directly from Steam (game info, your library, etc. )                                                        |
| `Datamuse`               | Connector for synonyms, antonyms, rhymes, sounds_like, means_like, spelled_like, associated of a word                 |
| `GitHub`                 | Connector for GitHub. Same as Gitea but for GitHub.                                                                   |
| `OpenTriviaDB`           | Lets you pull random trivia                                                                                           |
| `AIttache_Release_Notes` | Fetch the release notes for AIttache                                                                                  |
| `Random_Nonsense`        | Get random useless fact, Chuck Norris joke, or a Dad joke (I do not recommend)                                        |
| `Generate_Identity`      | Pull randomly generated identities from FakeNameGenerator.com (because, why not?)                                     |
| `Cocktails`              | Search, get recipes, and random entries from TheCocktailDB                                                            |

---

## License

### MIT
