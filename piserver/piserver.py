#!/usr/bin/python

from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import sys, os
from StringIO import StringIO
from urlparse import urlparse, parse_qs
import time
import threading
import numpy as np
from PIL import Image
import json
# from scipy.misc import imread

IMAGE_DIFF_THRESHOLD = 0.02
STABILITY_THRESHOLD = 0.008

settings_options = {
    "brightness": [15, 25, 35, 50, 65, 75, 85],
    "saturation": [-40, -25, -15, 0, 15, 25, 40],
    "contrast": [-35, -25, -15, -5, 0, 5, 15, 25, 35],
    "exposure_mode": [0, 1, 2],
    "zoom": [1, 1.25, 1.5],
    "thresholds": [0.125, 0.25, 0.5, 0.66, 1, 1.5, 2, 4, 8]
}
exposure_mode_names = ['backlight', 'auto', 'night']
def get_middle(list):
    return list[len(list)/2]

if os.path.exists('settings.json'):
    settings = json.load(open('settings.json'))
else:
    settings = {k: get_middle(v) for k, v in settings_options.iteritems()}
    settings['zoom'] = 1

def update_thresholds():
    global IMAGE_DIFF_THRESHOLD, STABILITY_THRESHOLD
    IMAGE_DIFF_THRESHOLD = 0.02 * settings['thresholds']
    STABILITY_THRESHOLD = 0.008 * settings['thresholds']

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
    print 'LEDs unavailable -- rpi-gpio couldnt be imported'
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
"""

def compute_zoom_rect(zoom_scale):
    w = 1.0 / zoom_scale
    return ((1-w)/2, (1-w)/2, w, w)

def img_data_to_numpy(data):
    # return imread(StringIO(data)).astype('float') / 255.0
    pil_img = Image.open(StringIO(data))
    return np.array(pil_img, dtype=np.uint8).astype('float') / 255.0

def image_diff(im1, im2):
    # pass in numpy images:
    return np.abs(im1 - im2).mean()

class Imager(object):
    def start(self):
        self.last_capture = None # (index, image data)
        thread = threading.Thread(target=self.run, args=[])
        thread.daemon = True
        thread.start()
    
    def apply_settings(self):
        update_thresholds()
    
    def run(self):
        # called on background thread:
        last_capture_np = None
        last_frame_np = None
        capture_idx = 0
        while True:
            frame_data = self.get_image()
            frame_np = img_data_to_numpy(frame_data)
            # if last_frame_np is not None:
            #     diff = image_diff(frame_np, last_frame_np)
            #     print diff
            is_stable = last_frame_np is None or image_diff(frame_np, last_frame_np) < STABILITY_THRESHOLD
            if is_stable:
                is_different = last_capture_np is None or image_diff(frame_np, last_capture_np) > IMAGE_DIFF_THRESHOLD
                if is_different:
                    # make a capture:
                    capture_idx += 1
                    print 'MOTION! making a capture haha', capture_idx
                    self.last_capture = (capture_idx, frame_data)
                    last_capture_np = frame_np
            else:
                print ' there is too much motion i am gonna wait for another frame!'
            last_frame_np = frame_np
            time.sleep(0.1)
    
    def get_new_image(self, prev_index):
        # call from main thread
        if self.last_capture:
            index, img = self.last_capture
            if index > prev_index:
                return index, img
        return None

# these classes both provide an image -- one is a fake image from a file (for debugging), and one is a real image from the pi's camera

class ImageFromFile(Imager):
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
            

class ImageFromCamera(Imager):
    def __init__(self):
        self.camera = picamera.PiCamera()
        self.apply_settings()
        # original res: 3280 x 2464
        # self.camera.resolution = (820, 616)
        self.camera.resolution = (597, 431)
    
    def apply_settings(self):
        update_thresholds()
        self.camera.brightness = settings['brightness']
        self.camera.contrast = settings['contrast']
        self.camera.saturation = settings['saturation']
        self.camera.exposure_mode = exposure_mode_names[settings['exposure_mode']]
        self.camera.zoom = compute_zoom_rect(settings['zoom'])
    
    def get_image(self):
        t = time.time()
        io = StringIO()
        self.camera.capture(io, format='jpeg', use_video_port=True)
        # print "took {} to capture".format(time.time() - t)
        val = io.getvalue()
        # print "took {} to get value".format(time.time() - t)
        return val

def set_active_leds(leds):
    print 'Setting active leds:', leds
    if leds_available:
        for idx, pin in enumerate(led_pins):
            GPIO.output(pin, (idx in leds))
    else:
        print ' (LEDs not available, so not doing anything real)'

def set_setting(k, v):
    if v in settings_options[k]:
        settings[k] = v
    with open('settings.json', 'w') as f:
        f.write(json.dumps(settings))
    imager.apply_settings()

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
        self.send_header('Access-Control-Expose-Headers', 'X-Index')
        self.end_headers()
    
    def do_GET(self):
        print self.endpoint(), self.params()
        if self.endpoint() == '/camera':
            self.respond(data=imager.get_image(), content_type='image/jpeg')
        elif self.endpoint() == '/newcamera':
            last_idx = int(self.params().get('last_idx', '0'))
            resp = imager.get_new_image(last_idx)
            if resp:
                idx, img = resp
                self.respond(data=img, content_type='image/jpeg', extra_headers={'X-Index': str(idx)})
            else:
                self.respond(status=204)
        elif self.endpoint() == '/':
            self.respond(data='Try /camera')
        elif self.endpoint() == '/settings':
            self.respond(data=open('settings.html').read(), content_type='text/html')
        elif self.endpoint() == '/get_settings':
            self.respond(data=json.dumps(settings), content_type='application/json')
        elif self.endpoint() == '/led_test':
            self.respond(data=open('led_test.html').read(), content_type='text/html')
        else:
            self.respond(status=404, data='Unknown path')
    
    def do_POST(self):
        if self.endpoint() == '/leds':
            pins = map(int, self.params().get('pins', '').split(','))
            set_active_leds(pins)
            self.respond(status=200, data='ok')
        elif self.endpoint() in '/set_setting':
            k = self.params().get('key')
            diff = 1 if self.params().get('direction') == 'up' else -1
            options = settings_options[k]
            idx = options.index(settings[k]) + diff
            value = options[idx % len(options)]
            set_setting(k, value)
            self.respond(data=json.dumps(settings), content_type='application/json')
        else:
            self.respond(status=404, data='Unknown path')
    
    def respond(self, status=200, data='', content_type='text/plain', extra_headers={}):
        self.send_response(status)
        headers = {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Content-Type": content_type,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS, POST",
            "Access-Control-Expose-Headers": "x-Index"
        }
        for k, v in extra_headers.iteritems():
            headers[k] = v
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
    imager.start()
    
    PORT = 8999
    
    server = HTTPServer(('', PORT), Handler)
    server.timeout = 10
    print 'Started server on localhost:{}'.format(PORT)
    server.serve_forever()

except KeyboardInterrupt:
	print '\ngoodbye!'
	server.socket.close()
