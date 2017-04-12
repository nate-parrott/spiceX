# python test_recognition.py /Users/nateparrott/Desktop/12604437255_bf728d1b26_c.jpg 

import sys
from requests import post

if len(sys.argv) < 2:
    print 'usage: python test_recognition.py /path/to/file.jpg'
    quit()

path = sys.argv[1]
data = open(path).read()

res = post('http://localhost:8080/recognize', data=data)

print res.text
