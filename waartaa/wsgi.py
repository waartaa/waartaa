import os

from pyramid.paster import get_app, setup_logging

ini_path = os.path.join(os.path.dirname(__file__), '../development.ini')
setup_logging(ini_path)
application = get_app(ini_path, 'main')
