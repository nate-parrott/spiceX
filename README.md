# spiceX

_How will this work? Here's an idea:_

- a **web app** on Google AppEngine that'll store recipes. people can submit recipes here, and we can approve them
- on the pi, every time the camera sees motion, we wait about a second and then upload a pic to the web app, which uploads the pic to google and returns the recipes
- JS in the web page communicates with a local web server on the pi to flip on lights and stuff

[https://spicexbrown.appspot.com](https://spicexbrown.appspot.com)

[Doc for notes](https://docs.google.com/a/brown.edu/document/d/1trEixanEznd0PjVrBvfIbYg7RRwER54C_jklffTsIRM/edit?usp=sharing)

## Running the Spice UI

On the device, go to http://spicexbrown.appspot.com/spicex (or localhost:8080/spicex).

(The camera server must also be running on the device -- run `python camera_server.py camera`)

To debug locally without a camera, run http://spicexbrown.appspot.com/spicex?debug=1. The "camera" will "see" a waffle, and chicken. haha
