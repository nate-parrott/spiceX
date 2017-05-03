#!/usr/bin/python

from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import sys, os
from StringIO import StringIO
from urlparse import urlparse, parse_qs

zoom = 1
for arg in sys.argv[1:]:
    if arg.startswith('--zoom='):
        zoom = float(arg.split('--zoom=')[1])
        print 'Zoom:', zoom

try:
    # from shiftpi.shiftpi import HIGH, LOW, ALL, digitalWrite, delay, shiftRegisters
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BOARD)
    led_pins = [7, 11, 12, 13, 15, 16, 18, 22, 29, 31, 32, 33, 35, 36, 37, 38, 40]
    for pin in led_pins:
        GPIO.setup(pin, GPIO.OUT)
    print 'LEDs available'
    leds_available = True
except ImportError:
    print 'LEDs unavailable -- install rpi-gpi'
    leds_available = False

# GPIO.output(7, True)

try:
    import picamera
    print 'Camera available'
    camera_available = True
except ImportError:
    print 'No camera available'
    camera_available = False

usage = """Usage:
python camera_server.py camera
 ~or~
python camera_server.py <path to jpeg>
 (for testing purposes)

optional argument:
--zoom=2 zooms in
"""

def compute_zoom_rect(zoom_scale):
    w = 1.0 / zoom_scale
    return ((1-w)/2, (1-w)/2, w, w)

# these classes both provide an image -- one is a fake image from a file (for debugging), and one is a real image from the pi's camera

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
        self.camera.zoom = compute_zoom_rect(zoom)
        # original res: 3280 x 2464
        self.camera.resolution = (820, 616)
    
    def get_image(self):
        io = StringIO()
        self.camera.capture(io, format='jpeg')
        val = io.getvalue()
        return val

def set_active_leds(leds):
    print 'Setting active leds:', leds
    if leds_available:
        GPIO.output(pin, (idx in leds))
    else:
        print ' (LEDs not available, so not doing anything real)'

class Handler(BaseHTTPRequestHandler):
    def split_query(self):
        return self.path.split('?', 1) if '?' in self.path else (self.path, '')
    
    def endpoint(self):
        return self.split_query()[0]
    
    def params(self):
        d = parse_qs(self.split_query()[1])
        return {k: vals[0] for k, vals in d.iteritems()}
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
        self.end_headers()
    
    def do_GET(self):
        print self.endpoint(), self.params()
        if self.endpoint() == '/camera':
            self.respond(data=imager.get_image(), content_type='image/jpeg')
        elif self.endpoint() == '/':
            self.respond(data='Try /camera')
        elif self.endpoint() == '/led_test':
            self.respond(data=open('led_test.html').read(), content_type='text/html')
        else:
            self.respond(status=404, data='Unknown path')
    
    def do_POST(self):
        if self.endpoint() == '/leds':
            pins = map(int, self.params().get('pins', '').split(','))
            set_active_leds(pins)
            self.respond(status=200, data='ok')
        else:
            self.respond(status=404, data='Unknown path')
    
    def respond(self, status=200, data='', content_type='text/plain'):
        self.send_response(200)
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Content-Type": content_type,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS, POST"
        }
        for h, v in headers.iteritems():
            self.send_header(h, v)
        self.end_headers()
        self.wfile.write(data)

try:
    if len(sys.argv) < 2:
        print usage
        quit()

    arg = sys.argv[1]
    if arg == 'camera':
        imager = ImageFromCamera()
    else:
        imager = ImageFromFile(arg)

    PORT = 8999
    
    server = HTTPServer(('', PORT), Handler)
    print 'Started server on localhost:{}'.format(PORT)
    server.serve_forever()

except KeyboardInterrupt:
	print '\ngoodbye!'
	server.socket.close()
