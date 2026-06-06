const { z } = require("zod");
const utilities = require("../utilities");

utilities.loadData("My_Gear") || utilities.saveData("My_Gear", {});

const handler = async ({ action, name, content, head }) => {
    const data = utilities.loadData("My_Gear") || {};

    switch (action) {
        case "list": {
            const list = Object.keys(data).map(key => ({ name: key, head: data[key].head }));

            return utilities.sendify(list);
        }
        case "item": {
            if (!name) {
                return utilities.sendify({ error: "Missing required parameter: name" });
            }

            const item = data[name];
            if (!item) {
                return utilities.sendify({ error: "Item not found" });
            }
            return utilities.sendify({name: name, item: item });
        }
        case "add": {
            if (!name || !content || !head) {
                return utilities.sendify({ error: "Missing required parameters. Required: name, content, head" });
            }

            data[name] = { head, content };

            utilities.saveData("My_Gear", data);
            return utilities.sendify({ success: true });
        }
        default:
            return utilities.sendify({ error: "Invalid action" });
    }
};

module.exports = {
    identifier: "My_Gear",
    handler,
    params: {
        action: z.enum(["list", "add", "item"]).describe("List = view list of all gear, without the details, Add = add new gear to the list (requires name and content), Item = fetch details for a specific gear (requires name)"),
        name: z.string().optional().describe("The name of the gear to add (required for add and item action)"),
        head: z.object({}).passthrough().optional().describe("The head of the gear to add, can include any relevant information such as description, specifications, example sentences, etc. keep short, it'll show up in the list (required for add action)"),
        content: z.object({}).passthrough().optional().describe("The content of the gear to add, can include any relevant information such as description, specifications, example sentences, etc. (required for add action)"),
    }
};
