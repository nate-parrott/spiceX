from __future__ import division
import os
from PIL import Image

def get_size(path):
    return Image.open(path).size

def percent(float):
    return str(float * 100) + '%'

while True:
    x = raw_input(' [image names separated by spaces] ')
    if x == '': break
    names = x.split()
    paths = [os.path.join('images', name) for name in names]
    sizes = [get_size(path) for path in paths]
    container_aspect = sum(w/h for (w,h) in sizes)
    
    output = ""
    output += "<div class='multi' style='padding-bottom: {}'><ul>".format(percent(1.0/container_aspect))
    for path, (w,h) in zip(paths, sizes):
        aspect = w/h
        output += "<li style='width: {}'><img src='{}' /></li>".format(percent(aspect/container_aspect*0.95), path)
    output += "</ul></div>"
    print '\n' + output + '\n'
    