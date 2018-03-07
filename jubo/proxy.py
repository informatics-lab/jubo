"""
With thanks to and based on
nbserverproxy
https://github.com/jupyterhub/nbserverproxy/blob/master/nbserverproxy/handlers.py

"""
import inspect
import socket
import os
from tornado import gen, web, httpclient, httputil, process, websocket, ioloop
from .manager import get_app_info
import logging
logger = logging.getLogger("jubo")

# from https://stackoverflow.com/questions/38663666/how-can-i-serve-a-http-page-and-a-websocket-on-the-same-url-in-tornado
class WebSocketHandlerMixin(websocket.WebSocketHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # since my parent doesn't keep calling the super() constructor,
        # I need to do it myself
        bases = inspect.getmro(type(self))
        assert WebSocketHandlerMixin in bases
        meindex = bases.index(WebSocketHandlerMixin)
        try:
            nextparent = bases[meindex + 1]
        except IndexError:
            raise Exception("WebSocketHandlerMixin should be followed "
                            "by another parent to make sense")

        # undisallow methods --- t.ws.WebSocketHandler disallows methods,
        # we need to re-enable these methods
        def wrapper(method):
            def undisallow(*args2, **kwargs2):
                getattr(nextparent, method)(self, *args2, **kwargs2)
            return undisallow

        for method in ["write", "redirect", "set_header", "set_cookie",
                       "set_status", "flush", "finish"]:
            setattr(self, method, wrapper(method))
        nextparent.__init__(self, *args, **kwargs)

    async def get(self, *args, **kwargs):
        if self.request.headers.get("Upgrade", "").lower() != 'websocket':
            return await self.http_get(*args, **kwargs)
        # super get is not async
        super().get(*args, **kwargs)


class LocalProxyHandler(WebSocketHandlerMixin, web.RequestHandler):
    def open(self, app_id, proxied_path=''):
        """
        Called when a client opens a websocket connection.
        We establish a websocket connection to the proxied backend &
        set up a callback to relay messages through.
        """
        if not proxied_path.startswith('/'):
            proxied_path = '/' + proxied_path

        client_info = get_app_info(app_id)

        client_uri = 'ws://{ip}:{port}{path}'.format(
            ip=client_info['ip'],
            port=client_info['port'],
            path=proxied_path
        )


        if self.request.query:
            client_uri += '?' + self.request.query

        def cb(message):
            """
            Callback when the backend sends messages to us
            We just pass it back to the frontend
            """
            # Websockets support both string (utf-8) and binary data, so let's
            # make sure we signal that appropriately when proxying
            if message is None:
                self.close()
            else:
                self.write_message(message, binary=type(message) is bytes)

        async def start_websocket_connection():
            logger.info('Trying to establish websocket connection to {}', client_uri)
            self.ws = await websocket.websocket_connect(client_uri, on_message_callback=cb)
            logger.info('Websocket connection established to {}', client_uri)

        ioloop.IOLoop.current().add_callback(start_websocket_connection)

    def on_message(self, message):
        """
        Called when we receive a message from our client.
        We proxy it to the backend.
        """
        if hasattr(self, 'ws'):
            self.ws.write_message(message)

    def on_close(self):
        """
        Called when the client closes our websocket connection.
        We close our connection to the backend too.
        """
        if hasattr(self, 'ws'):
            self.ws.close()

    async def proxy(self, app_id, proxied_path):
        '''
        This serverextension is given {app_id}/{everything/after}.
        '''
        logger.info('Proxy for app id %s and path %s' % (app_id, proxied_path))
        proxied_path = proxied_path if proxied_path.strip() else app_id
        client_info = get_app_info(app_id)
        logger.info('got client_info for request. app at %s:%s ' % (client_info['ip'],client_info['port']))
        
        if 'Proxy-Connection' in self.request.headers:
            del self.request.headers['Proxy-Connection']

        if self.request.headers.get("Upgrade", "").lower() == 'websocket':
            # We wanna websocket!
            # TODO: WebSocketProxyHandler doesn't exist https://github.com/jupyterhub/nbserverproxy/issues/13
            # ws = WebSocketProxyHandler(*self._init_args, **self._init_kwargs)
            # return await ws.get(client_info, proxied_path)
            raise RuntimeError("This code path isn't implemented....")

        body = self.request.body
        if not body:
            if self.request.method == 'POST':
                body = b''
            else:
                body = None

        
        client_uri = 'http://{ip}:{port}/{path}'.format(
            ip=client_info['ip'],
            port=client_info['port'],
            path=proxied_path
        )
        if self.request.query:
            client_uri += '?' + self.request.query

        client = httpclient.AsyncHTTPClient()
        # client = httpclient.HTTPClient()

        
        req = httpclient.HTTPRequest(
            client_uri, method=self.request.method, body=body,
            headers=self.request.headers, follow_redirects=False)

        logger.info('Will call %s %s. Headers: %s' % (req.method, req.url, list(req.headers.get_all()) ))
        response = await client.fetch(req, raise_error=False) 

        # For all non http errors...
        if response.error and type(response.error) is not httpclient.HTTPError:
            logger.error("proxyed request error:\n%s" % response)
            self.set_status(500)
            self.write(str(response.error))
        else:
            self.set_status(response.code, response.reason)

            # clear tornado default header
            self._headers = httputil.HTTPHeaders()

            for header, v in response.headers.get_all():
                if header not in ('Content-Length', 'Transfer-Encoding',
                    'Content-Encoding', 'Connection'):
                    # some header appear multiple times, eg 'Set-Cookie'
                    self.add_header(header, v)


            if response.body:
                self.write(response.body)

    # support all the methods that torando does by default!
    async def http_get(self, port, proxy_path=''):
        return await self.proxy(port, proxy_path)

    def post(self, port, proxy_path=''):
        return self.proxy(port, proxy_path)

    def put(self, port, proxy_path=''):
        return self.proxy(port, proxy_path)

    def delete(self, port, proxy_path=''):
        return self.proxy(port, proxy_path)

    def head(self, port, proxy_path=''):
        return self.proxy(port, proxy_path)

    def patch(self, port, proxy_path=''):
        return self.proxy(port, proxy_path)

    def options(self, port, proxy_path=''):
        return self.proxy(port, proxy_path)

    def check_xsrf_cookie(self):
        '''
        http://www.tornadoweb.org/en/stable/guide/security.html
        Defer to proxied apps.
        '''
        pass




def main():

    logger.setLevel(logging.INFO)
    # ch = logging.StreamHandler()
    # ch.setLevel(logging.DEBUG)
    # formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    # ch.setFormatter(formatter)
    # logger.addHandler(ch)

    logger.info('Started')

    application = web.Application([
        (r"/app/([^/]+)/?(.*)", LocalProxyHandler)
    ])
    port = 7777
    application.listen(port)
    logger.info('Running at http://localhost:{port}'.format(port=port))
    ioloop.IOLoop.current().start()

if __name__ == "__main__":
    main()