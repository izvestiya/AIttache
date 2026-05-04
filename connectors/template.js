const { z } = require("zod");
const utilities = require("../utilities");

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
