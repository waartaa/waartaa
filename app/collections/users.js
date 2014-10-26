UserServerSchema = new SimpleSchema({
    _id: {
        type: String,
        optional: true,
    },
    name: {
        type: String,
        label: "Name",
        max: 255
    },
    server_id: {
        type: String,
        label: "Server Id",
    },
    nick: {
        type: String,
        label: "Nick",
        max: 255
    },
    password: {
        type: String,
        label: "Password",
        optional: true
    },
    channels: {
        type: [String],
        label: "Channels",
    },
    user: {
        type: String,
        label: "User",
    },
    user_id: {
        type: String,
        label: "User Id",
    },
    created: {
        type: Date,
        label: "Created At",
    },
    creator: {
        type: String,
        label: "Username of Creator"
    },
    creator_id: {
        type: String,
        label: "User id of Creator"
    },
    last_updated: {
        type: Date,
        label: "Last Updated Timestamp"
    },
    last_updater: {
        type: String,
        label: "Username of the Last Updater"
    },
    last_updater_id: {
        type: String,
        label: "User id of Last Updater"
    },
    status: {
        type: String,
        label: "Status of User (online/offline/connecting)",
        optional: true
    }
});

UserServers = new Meteor.Collection("user_servers");
UserServers.attachSchema(UserServerSchema);
