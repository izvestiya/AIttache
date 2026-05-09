const { z } = require("zod");
const { execSync } = require("child_process");
const utilities = require("../utilities");
require("dotenv").config({ path: `${__dirname}/.env`, quiet: true });

// Handler for what to return
const handler = async () => {
    const data = {"Name": "Valentina Malenkov", "age": 278, "Height": -2, "City": "Oymyakon"};
    return utilities.sendify(data);
};

module.exports = {
    identifier: "Name_goes_here",
    handler,
    params: {} // Params for the endpoint
}
