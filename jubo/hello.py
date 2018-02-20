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

class HelloWorldHandler(IPythonHandler):
    def get(self):
        self.finish('Hello, world!')


def get_list_handeler(nb_server_app):
    class ListHandler(IPythonHandler):
        def get(self):
            from_dir = nb_server_app.notebook_dir
            files = glob.glob(os.path.join(from_dir, '**/**.ipynb'), recursive=True)
            files = [f[len(from_dir) + 1:] for f in files]
            self.set_header('Content-Type', 'application/json')
            self.finish(json.dumps(files))
    return ListHandler

def get_app_handeler(nb_server_app):
    class AppHandler(IPythonHandler):
        def get(self, app):
            app = app[1:] if app [0] == '/' else app
            path =  os.path.join(nb_server_app.notebook_dir, app)
            
            code = convert(path)
            print(code)
            app = Application(CodeHandler(source=code, filename='dynamic_notebook_convert'))

            

            loop = IOLoop.current()

            # TODO: Work this outsome how
            # origin = nb_server_app.web_app.settings.get('allow_origin',None)
            notebook_url = 'localhost:8888'


        
            server = Server({"/": app}, io_loop=loop, port=0,  allow_websocket_origin=[notebook_url])

            # Todo: track and kill off servers?
            # server_id = uuid4().hex
            # curstate().uuid_to_server[server_id] = server

            server.start()
            port = server.port
            if notebook_url.startswith("http"):
                url =  '%s:%d%s' % (notebook_url.rsplit(':', 1)[0], port, "/")
            else:
                url = 'http://%s:%d%s' % (notebook_url.split(':')[0], port, "/")


           
            script = server_document(url)
            self.set_header('Content-Type', 'application/json')
            self.finish(json.dumps({'script':script}))


    return AppHandler


def load_jupyter_server_extension(nb_server_app):
    """
    Called when the extension is loaded.

    Args:
        nb_server_app (NotebookWebApplication): handle to the Notebook webserver instance.
    """
    web_app = nb_server_app.web_app
    host_pattern = '.*$'
    route_pattern = url_path_join(web_app.settings['base_url'], '/jubo/hello')
    web_app.add_handlers(host_pattern, [(route_pattern, HelloWorldHandler)])

    list_route_pattern = url_path_join(web_app.settings['base_url'], r'/jubo/list')
    web_app.add_handlers(host_pattern, [(list_route_pattern, get_list_handeler(nb_server_app))])
    
    app_route_pattern = url_path_join(web_app.settings['base_url'], r'/jubo/app/(.*)')
    web_app.add_handlers(host_pattern, [(app_route_pattern, get_app_handeler(nb_server_app))])