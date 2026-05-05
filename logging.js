const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const logStream = fs.createWriteStream(path.join(logsDir, `${timestamp}.log`), { flags: "a" });

const load = (app) => {
    app.use(morgan("combined", { stream: logStream }));
    app.use(morgan("combined", { stream: { write: (msg) => console.error(msg.trim()) } }));

    return app;
};

const log = (msg) => {
    const line = `[${new Date().toISOString()}] ${msg}`;
    logStream.write(line + "\n");
    console.error(line);
};

module.exports = { load, log };