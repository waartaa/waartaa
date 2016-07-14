# -*- coding: utf-8 -*-

import asyncio
import json
import os

from autobahn.asyncio.websocket import (WebSocketClientProtocol,
                                        WebSocketClientFactory)


class ClientProtocol(WebSocketClientProtocol):

    def onConnect(self, response):
        print("Server connected to: {0}".format(response.peer))

    def onOpen(self):
        self.login()

    def login(self):
        user = os.environ.get('USER')
        password = os.environ.get('PASSWORD')
        action = {
            'type': 'login',
            'data': {
                'username': user,
                'password': password
            }
        }
        self.sendMessage(json.dumps(action).encode('utf-8'))

    def onMessage(self, payload, isBinary):
        if isBinary:
            return

        print(payload)
        action = json.loads(payload.decode('utf-8'))

        callback = getattr(self, 'on_' + action['type'], None)
        if callback:
            callback(action['data'])
        else:
            print('No callback found for type: {0}'.format(
                  action['type']))

    def on_loggedin(self, data):
        print("Logged in: {0}".format(data))
        action = {
            'type': 'subscribe_networks',
            'data': {}
        }
        self.sendMessage(json.dumps(action).encode('utf-8'))
        """

        action = {
            'type': 'subscribe_chat_message_logs',
            'data': {
                'hostname': os.environ.get('IRC_HOSTNAME'),
                'roomname': os.environ.get('IRC_ROOMNAME')
            }
        }
        self.sendMessage(json.dumps(action).encode('utf-8'))
        """

    def on_chat_message_logs_fetched(self, data):
        print('chat message logs fetched: {}'.format(data))

    def on_chat_message_logs_created(self, data):
        print('chat message logs created: {0}'.format(data))

    def on_chat_message_logs_updated(self, data):
        print('chat message logs updated: {}'.format(data))

    def on_networks_fetched(self, data):
        print('networks fetched: {0}'.format(data))
        for item in data:
            action = {
                'type': 'subscribe_channels',
                'data': {
                    'network_id': item['id']
                }
            }
            self.sendMessage(json.dumps(action).encode('utf-8'))

    def on_networks_created(self, data):
        print('networks created: {0}'.format(data))

    def on_networks_updated(self, data):
        print('networks updated: {0}'.format(data))

    def on_channels_fetched(self, data):
        print('channels fetched: {0}'.format(data))

    def on_channels_created(self, data):
        print('channels created: {0}'.format(data))

    def on_channels_updated(self, data):
        print('channels updated: {0}'.format(data))


if __name__ == '__main__':
    factory = WebSocketClientFactory('ws://127.0.0.1:9999')
    factory.protocol = ClientProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_connection(factory, '127.0.0.1', 9999)
    loop.run_until_complete(coro)
    loop.run_forever()
    loop.close()
