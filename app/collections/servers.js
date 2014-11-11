ServerSchema = new SimpleSchema({
    _id: {
        type: String,
        optional: true,
    },
    name: {
        type: String,
        optional: true,
        label: "Name of Server",
    },
    creator: {
        type: String,
        optional: true,
        label: "User of Creator",
    },
    creator_id: {
        type: String,
        optional: true,
        label: "Id of Creator",
    },
    last_updater: {
        type: String,
        optional: true,
        label: "Username of the Last Updater"
    },
    last_updater_id: {
        type: String,
        optional: true,
        label: "User id of Last Updater"
    },
    created: {
        type: Date,
        optional: true,
        label: "Created At",
    },
    last_updated: {
        type: Date,
        optional: true,
        label: "Last Updated Timestamp"
    },
    connections: {
        connections: [Object],
        optional: true,
        label: 'List of items like {url: "irc.freenode.net', port:
            "6667"
    },
});

Servers = new Meteor.Collection("servers");
Servers.attachSchema(ServerSchema);
