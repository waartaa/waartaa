Schemas.ChannelNicks = new SimpleSchema({
    channel_name: {
        type: String,
        label: 'Channel Name'
    },
    server_name: {
        type: String,
        label: 'Server Name' 
    },
    nick: {
        type: String,
        label: 'Nick'
    }
});
ChannelNicks.attachSchema(Schemas.ChannelNicks);

