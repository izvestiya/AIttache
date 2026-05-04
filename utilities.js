const sendify = (data) => {
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

module.exports = {
    sendify
}