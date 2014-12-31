Schemas.Servers = new SimpleSchema({
    name: {
        type: String,
        label: 'Name'
    },
    connections: {
        type: [Object],
        label: 'Connections'
    },
    "connections.$.url": {
        type: String,
    },
    "connections.$.port": {
        type: String,
    },
    created: {
        type: String,
        label: 'Created'
    },
    creator: {
        type: String,
        label: 'Creator'
    },
    creator_id: {
        type: String,
        label: 'Creator id'
    },
    last_updated: {
        type: String,
        label: 'Last Updated'
    },
    last_updater: {
        type: String,
        label: 'Last Updater'
    },
    last_updater_id: {
        type: String,
        label: 'Last Updater Id'
    },
   "ssl.cert_file": {
       type: String,
       label: 'SSL Cert File'
   },
   "ssl.ca_file": {
       type: String,
       label: 'SSL CA File'
   }
});
Servers.attachSchema(Schemas.Servers);

