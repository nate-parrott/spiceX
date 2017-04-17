from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import sys, os

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
        pass
    
    def get_image(self):
        pass

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
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'image/jpeg')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.end_headers()
        self.wfile.write(imager.get_image())

try:
    server = HTTPServer(('', PORT), Handler)
    print 'Started server on localhost:{}'.format(PORT)
    server.serve_forever()

except KeyboardInterrupt:
	print '\ngoodbye!'
	server.socket.close()
