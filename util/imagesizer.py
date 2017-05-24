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
    names = [(name + '.png' if '.' not in name else name) for name in names]
    paths = [os.path.join('images', name) for name in names]
    sizes = [get_size(path) for path in paths]
    container_aspect = sum(w/h for (w,h) in sizes)
    
    output = ""
    output += "<div class='multi' style='padding-bottom: {}'><ul>".format(percent(1.0/container_aspect))
    for path, (w,h) in zip(paths, sizes):
        aspect = w/h
        output += "<li style='flex-grow: {}'><img src='{}' /></li>".format(aspect/container_aspect, path)
    output += "</ul></div>"
    print '\n' + output + '\n'
    