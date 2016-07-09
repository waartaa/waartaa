# -*- coding: utf-8 -*-

import asyncio
import json
from autobahn.asyncio.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
import logging

from ircb.storeclient import UserStore


class ServerProtocol(WebSocketServerProtocol):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.log = logging.getLogger()

    def onConnect(self, request):
        self.request = request

    def onOpen(self):
        self.log.info('Connection opened')

    def onMessage(self, payload, isBinary):
        self.log.info(payload)
        if isBinary:
            return

        action = json.loads(payload.decode('utf-8'))

        callback = getattr(self, 'on_' + action['type'], None)
        if callback:
            asyncio.Task(callback(action['data']))

    @asyncio.coroutine
    def on_login(self, data):
        print('login data: {0}'.format(data))
        user = yield from UserStore.get(
            dict(query=('auth', (data['username'], data['password'])))
        )
        if user:
            self.user = user
            response = {'type': 'loggedin', 'data': {'status': 'SUCCESS'}}
            self.sendMessage(json.dumps(response).encode('utf-8'))

    def onClose(self, wasClean, code, reason):
        self.log.info('Websocket connection closed: {0}'.format(reason))


def run():
    from ircb.storeclient import initialize
    from ircb.utils.config import load_config
    load_config()
    initialize()
    host = os.environ.get('HOST') or '127.0.0.1'
    port = os.environ.get('PORT') or 9999
    factory = WebSocketServerFactory(
        'ws://{host}:{port}'.format(host=host, port=port))
    factory.protocol = ServerProtocol

    loop = asyncio.get_event_loop()
    coro = loop.create_server(factory, host, port)
    server = loop.run_until_complete(coro)

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.close()
        loop.close()

if __name__ == '__main__':
    run()
