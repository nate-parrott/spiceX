from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import sys, os
from StringIO import StringIO

try:
    import picamera
except:
    pass

usage = """Usage:
python camera_server.py camera
 ~or~
python camera_server.py <path to jpeg>
 (for testing purposes)
"""

class ImageFromFile(object):
    def __init__(self, path):
        self.path = path
        self.img = None
    
    def get_image(self):
        try:
            with open(self.path) as f:
                self.img = f.read()
        except IOError:
            pass
        return self.img
            

class ImageFromCamera(object):
    def __init__(self):
        self.camera = picamera.PiCamera()
        # original res: 3280 x 2464
        self.camera.resolution = (820, 616)
    
    def get_image(self):
        io = StringIO()
        self.camera.capture(io, format='jpeg')
        val = io.getvalue()
        return val

if len(sys.argv) < 2:
    print usage
    quit()

arg = sys.argv[1]
if arg == 'camera':
    imager = ImageFromCamera()
else:
    imager = ImageFromFile(arg)

PORT = 8999

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.end_headers()
    
    def do_GET(self):
        self.send_response(200)
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Content-Type": "image/jpeg",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS"
        }
        for h, v in headers.iteritems():
            self.send_header(h, v)
        self.end_headers()
        self.wfile.write(imager.get_image())

try:
    server = HTTPServer(('', PORT), Handler)
    print 'Started server on localhost:{}'.format(PORT)
    server.serve_forever()

except KeyboardInterrupt:
	print '\ngoodbye!'
	server.socket.close()
