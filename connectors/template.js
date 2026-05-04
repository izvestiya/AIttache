const { z } = require("zod");

// Handler for what to return
const handler = async () => {
    return {"Name": "Valentina Malenkov", "age": 278, "Height": -2, "City": "Oymyakon"};
};

module.exports = {
    identifier: "Name_goes_here",
    handler,
    params: {} // Params for the endpoint
}
