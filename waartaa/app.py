# -*- coding: utf-8 -*-
import asyncio
import jinja2
import logging
import os

import sockjs

from aiohttp import web
import aiohttp_jinja2

from waartaa.websocket.session import SockjsSessionHandlerFactory

logger = logging.getLogger()


def sockjs_handler(msg, session):
    if msg.tp == sockjs.MSG_OPEN:
        handler = SockjsSessionHandlerFactory.create(session)
    elif msg.tp == sockjs.MSG_MESSAGE:
        handler = SockjsSessionHandlerFactory.get(session)
        handler.on_message(msg.data)
    elif msg.tp == sockjs.MSG_CLOSED:
        SockjsSessionHandlerFactory.remove(session)
    print(msg, session)


@asyncio.coroutine
@aiohttp_jinja2.template('index.tpl')
def index(request):
    print(request.match_info)
    return {'project': 'waartaa'}


@asyncio.coroutine
def init(loop, host='0.0.0.0', port=6453):
    app = web.Application()

    aiohttp_jinja2.setup(app,
                         context_processors=[aiohttp_jinja2.request_processor],
                         loader=jinja2.FileSystemLoader(
                             os.path.join(os.path.dirname(__file__),
                                          'templates')
                         ))
    sockjs.add_endpoint(app, sockjs_handler, name='sockjs', prefix='/sockjs')

    app.router.add_static('/static',
                          os.path.join(os.path.dirname(__file__),
                                       'static'))
    app.router.add_route('GET', '/{path:.*}', index)

    srv = yield from loop.create_server(
        app.make_handler(logger=logger, access_logger=logger), host, port)
    return srv


def runserver(host='0.0.0.0', port=6453):
    from ircb.storeclient import initialize
    from ircb.utils.config import load_config
    load_config()
    initialize()
    loop = asyncio.get_event_loop()
    loop.run_until_complete(init(loop, host=host, port=port))
    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    runserver()
