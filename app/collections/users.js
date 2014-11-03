UserServerSchema = new SimpleSchema({
    _id: {
        type: String,
        optional: true,
    },
    name: {
        type: String,
        label: "Name",
        optional: true,
        max: 255
    },
    server_id: {
        type: String,
        optional: true,
        label: "Server Id",
    },
    nick: {
        type: String,
        label: "Nick",
        optional: true,
        max: 255
    },
    password: {
        type: String,
        label: "Password",
        optional: true,
    },
    channels: {
        type: [String],
        optional: true,
        label: "Channels",
    },
    user: {
        type: String,
        optional: true,
        label: "User",
    },
    user_id: {
        type: String,
        optional: true,
        label: "User Id",
    },
    created: {
        type: Date,
        optional: true,
        label: "Created At",
    },
    creator: {
        type: String,
        optional: true,
        label: "Username of Creator"
    },
    creator_id: {
        type: String,
        optional: true,
        label: "User id of Creator"
    },
    last_updated: {
        type: Date,
        optional: true,
        label: "Last Updated Timestamp"
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
    active: {
        type: Boolean,
        optional: true,
        label: "To determine is user active"
    },
    status: {
        type: String,
        optional: true,
        label: "Status of User (online/offline/connecting)",
    }
});

UserServers = new Meteor.Collection("user_servers");
UserServers.attachSchema(UserServerSchema);
