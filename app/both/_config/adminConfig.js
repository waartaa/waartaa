AdminConfig = {
  name: 'Waartaa',
  adminEmails: ['sheeshmohsin@gmail.com'],
  collections: {
      ChannelNicks: {
          tableColumns: [
            {label: 'Channel Name', name: 'channel_name'},
            {label: 'Server Name', name: 'server_name'},
            {label: 'Nick', name: 'nick'}
          ]
      },
      Servers: {
          tableColumns: [
            {label: 'Name', name: 'name'},
            {label: 'Connections', name: 'connections'},
            {label: 'Created', name: 'created'},
            {label: 'Creator', name: 'creator'},
            {label: 'Creator Id', name: 'creator_id'},
            {label: 'Last Updated', name: 'last_updated'},
            {label: 'Last Updater', name: 'last_updater'},
            {label: 'Last Updater Id', name: 'last_updater_id'},
            {label: 'SSL Cert File', name: 'ssl.cert_file'},
            {label: 'SSL Ca File', name: 'ssl.ca_file'}
          ]
      },
      UserServers: {
          tableColumns: [
            {label: 'Active', name: 'active'},
            {label: 'Channels', name: 'channels'},
            {label: 'Created', name: 'created'},
            {label: 'Creator', name: 'creator'},
            {label: 'Creator id', name: 'creator_id'},
            {label: 'Current Nick', name: 'current_nick'},
            {label: 'Last Updated', name: 'last_updated'},
            {label: 'Last Updater', name: 'last_updater'},
            {label: 'Last Updater id', name: 'last_updater_id'},
            {label: 'Name', name: 'name'},
            {label: 'Nick', name: 'nick'},
            {label: 'Real Name', name: 'real_name'},
            {label: 'Server Id', name: 'server_id'},
            {label: 'Status', name: 'status'},
            {label: 'User', name: 'user'},
            {label: 'User id', name: 'user_id'}
          ]
      },
      UserChannels: {
          tableColumns: [
            {label: 'Active', name: 'active'},
            {label: 'Created', name: 'created'},
            {label: 'Creator', name: 'creator'},
            {label: 'Creator Id', name: 'creator_id'},
            {label: 'Last Updated', name: 'last_updated'},
            {label: 'Last Updater', name: 'last_updater'},
            {label: 'Last Updater Id', name: 'last_updater_id'},
            {label: 'Name', name: 'name'},
            {label: 'Active Server', name: 'server_active'},
            {label: 'Status', name: 'status'},
            {label: 'Topic', name: 'topic'},
            {label: 'User', name: 'user'},
            {label: 'User Id', name: 'user_id'},
            {label: 'User Server Id', name: 'user_server_id'},
            {label: 'User Server Name', name: 'user_server_name'}
          ]
      },
      ChannelLogs: {
          tableColumns: [
            {label: 'Message', name: 'message'},
            {label: 'Raw Message (Prefix)', name: 'raw_message.prefix' },
            {label: 'Raw Message (Nick)', name: 'raw_message.nick' },
            {label: 'Raw Message (User)', name: 'raw_message.user' },
            {label: 'Raw Message (Host)', name: 'raw_message.host' },
            {label: 'Raw Message (command)', name: 'raw_message.command' },
            {label: 'Raw Message (rawCommand)', name: 'raw_message.rawCommand' },
            {label: 'Raw Message (commandType)', name: 'raw_message.commandType' },
            {label: 'Raw Message (Args)', name: 'raw_message.args' },
            {label: 'Channel Name', name: 'channel_name' },
            {label: 'Channel Id', name: 'channel_id' },
            {label: 'Server Name', name: 'server_name' },
            {label: 'Server Id',  name: 'server_id' },
            {label: 'User', name: 'user' },
            {label: 'User Id', name: 'user_id' },
            {label: 'Nick', name: 'nick' },
            {label: 'Created', name: 'created' },
            {label: 'Last Updated', name: 'last_updated' },
            {label: 'Type', name: 'type' },
            {label: 'Global', name: 'global' },
            {label: 'Not for user', name: 'not_for_user'}
          ]
      },
      OldChannelLogs: {
          tableColumns: [
            {label: 'Message', name: 'message'},
            {label: 'Raw Message (Prefix)', name: 'raw_message.prefix' },
            {label: 'Raw Message (Nick)', name: 'raw_message.nick' },
            {label: 'Raw Message (User)', name: 'raw_message.user' },
            {label: 'Raw Message (Host)', name: 'raw_message.host' },
            {label: 'Raw Message (command)', name: 'raw_message.command' },
            {label: 'Raw Message (rawCommand)', name: 'raw_message.rawCommand' },
            {label: 'Raw Message (commandType)', name: 'raw_message.commandType' },
            {label: 'Raw Message (Args)', name: 'raw_message.args' },
            {label: 'Channel Name', name: 'channel_name' },
            {label: 'Channel Id', name: 'channel_id' },
            {label: 'Server Name', name: 'server_name' },
            {label: 'Server Id',  name: 'server_id' },
            {label: 'User', name: 'user' },
            {label: 'User Id', name: 'user_id' },
            {label: 'Nick', name: 'nick' },
            {label: 'Created', name: 'created' },
            {label: 'Last Updated', name: 'last_updated' },
            {label: 'Type', name: 'type' },
            {label: 'Global', name: 'global' },
            {label: 'Not for user', name: 'not_for_user'}
          ]
      }
  }
};
if (Meteor.isClient){
    window.AdminConfig = AdminConfig
}
else if (Meteor.isServer){
    global.AdminConfig = AdminConfig
}

