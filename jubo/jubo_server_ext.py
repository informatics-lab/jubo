from notebook.utils import url_path_join
from notebook.base.handlers import IPythonHandler
import os.path
from .convert import convert


from bokeh.application.handlers.code import CodeHandler
from bokeh.application import Application

from tornado.ioloop import IOLoop
from bokeh.server.server import Server
from bokeh.embed import server_document

import glob
import json
from uuid import uuid4 as uuid
import io
import boto3
import random
import re

localhost_url_matcher = re.compile(r"(https?)://localhost:([0-9]+)")

s3 = boto3.client('s3')

def wrap_class(clazz, nb_app):
    def wrapped_init(func):
        def init( *args, **kwargs):
            the_self = args[0]
            args = args[1:]
            return func(the_self, nb_app, *args, **kwargs)

        return init

    clazz.__init__ = wrapped_init(clazz.__init__)
    return clazz


class JuboHandler(IPythonHandler):
    def __init__(self, nb_app, *args, **kwargs):
        self.nb_app = nb_app
        self.nb_path = self.nb_app.notebook_dir
        return super().__init__(*args, **kwargs)
    
    def _full_path(self, rel_path):
        rel_path = rel_path[1:] if rel_path [0] == '/' else rel_path
        return os.path.join(self.nb_path, rel_path)


class ListHandler(JuboHandler):
    def get(self):
        files = glob.glob(os.path.join(self.nb_path, '**/**.ipynb'), recursive=True)
        files = [f[len(self.nb_path) + 1:] for f in files]
        self.set_header('Content-Type', 'application/json')
        self.finish(json.dumps(files))

class DeployHandler(JuboHandler):
    def get(self, app):
        path =  self._full_path(app)
        app = convert(path)
        app_id = uuid().hex
        s3.put_object(Bucket='jubo-apps', Key='{}/main.py'.format(app_id), Body=app.encode('utf-8'))
        self.set_header('Content-Type', 'application/json')
        self.finish(json.dumps({'id':app_id, 'result':'success'}))
        

class AppHandler(JuboHandler):
    def get(self, app):
        protocol = 'https' if self.get_argument('https', default='false').upper() == 'TRUE' else 'http'
        origin = self.get_argument('origin', default='localhost:{port}' )
        prefix = self.get_argument('prefix', default='/')
        prefix = prefix + '/' if not prefix[-1] == '/' else prefix 
        

        path =  self._full_path(app)
        code = convert(path)
        app = Application(CodeHandler(source=code, filename='dynamic_notebook_convert'))

        loop = IOLoop.current()

        # TODO: Work this outsome how
        port = random.randint(1024, 65535) # TODO: Should check if this is taken or not...
        
        origin = origin.replace("{port}", str(port))
        prefix = prefix.replace("{port}", str(port))
        server = Server({"/": app}, io_loop=loop, port=port, allow_websocket_origin=['localhost:%d'%port, origin, self.request.host])

        # TODO: track and kill off servers?
        # server_id = uuid4().hex
        # curstate().uuid_to_server[server_id] = server

        server.start()

        orig_script = server_document('http://localhost:{port}/'.format(port=port), relative_urls=True)
        print(orig_script)
        ele_id = re.findall(r'\bid="([-A-z0-9]+)"', orig_script)[0]
        script = """<script
            src="{protocol}://{origin}{prefix}autoload.js?bokeh-autoload-element={ele_id}&bokeh-absolute-url={protocol}://{origin}&bokeh-app-path={prefix}"
            id="{ele_id}"
            data-bokeh-model-id=""
            data-bokeh-doc-id=""
        ></script>""".format(protocol=protocol, origin=origin, prefix=prefix, ele_id=ele_id) 

        self.set_header('Content-Type', 'application/json')
        self.finish(json.dumps({'script':script}))


        


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """

    web_app = nb_server_app.web_app
    host_pattern = '.*$'

    list_route_pattern = url_path_join(web_app.settings['base_url'], r'/jubo/list')
    web_app.add_handlers(host_pattern, [(list_route_pattern, wrap_class(ListHandler, nb_server_app))])
    
    app_route_pattern = url_path_join(web_app.settings['base_url'], r'/jubo/app/(.*)')
    web_app.add_handlers(host_pattern, [(app_route_pattern, wrap_class(AppHandler, nb_server_app))])

    app_route_pattern = url_path_join(web_app.settings['base_url'], r'/jubo/deploy/(.*)')
    web_app.add_handlers(host_pattern, [(app_route_pattern, wrap_class(DeployHandler, nb_server_app))])
