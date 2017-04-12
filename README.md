# spiceX

_How will this work? Here's an idea:_

- a **web app** on Google AppEngine that'll store recipes. people can submit recipes here, and we can approve them
- on the pi, every time the camera sees motion, we wait about a second and then upload a pic to the web app, which uploads the pic to google and returns the recipes
- JS in the web page communicates with a local web server on the pi to flip on lights and stuff
