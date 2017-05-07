import webapp2
# from requests import post
from base64 import b64encode, b64decode
import json
from recommendations import get_recommendations
from clarifai_token import get_clarifai_token
from google.appengine.api import urlfetch
import urllib2

secrets = json.load(open('secrets.json'))

def post_async(url, data, headers):
    rpc = urlfetch.create_rpc()
    urlfetch.make_fetch_call(rpc, url, payload=data, headers=headers, method='POST')
    
    def future():
        result = rpc.get_result()
        if result.status_code == 200:
            return result.content
        else:
            print "error", result.status_code, "from", url, ":"
            print result.content
            return None
    
    return future

def recognize_clarifai_async(data):
    token = get_clarifai_token()
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(get_clarifai_token())
    }
    req = {
      "inputs": [
        {
          "data": {
            "image": {
              "base64": b64encode(data)
            }
          }
        }
      ]
    }
    url = 'https://api.clarifai.com/v2/models/bd367be194cf45149e75f01d59f77ba7/outputs'
    data_future = post_async(url, data=json.dumps(req), headers=headers)
    def future():
        resp = data_future()
        if resp is None:
            return None
        api_resp = json.loads(resp)
        concepts = api_resp['outputs'][0]['data']['concepts']
        foods = [(c['name'], c['value']) for c in concepts]
        response = {
            "foods": foods
        }
        return response
    return future

def recognize_google_async(data):
    key = secrets['google_key']
    url = "https://vision.googleapis.com/v1/images:annotate?key=" + key
    req = {
      "requests": [
        {
          "image": {
            "content": b64encode(data)
          },
          "features": [
            {
              "type": "LABEL_DETECTION",
              "maxResults": 20
            }
          ]
        }
      ]
    }
    headers = {
        "Content-Type": "application/json"
    }
    data_future = post_async(url, data=json.dumps(req), headers=headers)
    def future():
        resp = data_future()
        print resp
        if resp is None:
            return None
        resp = json.loads(resp)
        if 'responses' not in resp:
            print 'ERROR:'
            print resp
            return None
        labels = resp['responses'][0]['labelAnnotations']
        foods = [[l['description'], l['score']] for l in labels]
        return {
            "foods": foods
        }
    return future
    
def recognize_hybrid(data):
    food_words = ['food' ,'meal', 'drink', 'produce']
    
    google_future = recognize_google_async(data)
    clarifai_future = recognize_clarifai_async(data)
    
    google_foods = google_future()['foods']
    clarifai_foods = clarifai_future()['foods']
    clarifai_foods = clarifai_foods[:min(len(clarifai_foods), 7)]
    print "google: {0}, clarifai: {1}".format([f[0] for f in google_foods], [f[0] for f in clarifai_foods])
    # is this a food? clarifai always returns foods, so ask google:
    is_food = len([result for result in google_foods if result[0] in food_words])
    if is_food:
        return {"foods": google_foods + clarifai_foods}
    else:
        return {"foods": [], "ignored_because_google_doesnt_think_this_is_food": {"google": google_foods, "clarifai": clarifai_foods}}

class Recognize(webapp2.RequestHandler):
    def post(self):
        data = self.request.body
        response = recognize_hybrid(data)
        self.response.write(json.dumps(response))

class RecognizeBase64(webapp2.RequestHandler):
    def post(self):
        data = b64decode(self.request.get('data').split('base64,', 1)[1])
        response = recognize_hybrid(data)
        self.response.write(json.dumps(response))

class RecognizeAndRecommend(webapp2.RequestHandler):
    def post(self):
        if self.request.get('debug_foods'):
            foods = self.request.get('debug_foods').split('//')
            food_scores = [[food, 1] for food in foods]
        else:
            data = b64decode(self.request.get('data').split('base64,', 1)[1])
            food_scores = recognize_hybrid(data)['foods']
            foods = [f[0] for f in food_scores]
        print 'FOODS:', foods
        recommendations = get_recommendations(foods)
        response = {"recommendations": recommendations, "food_scores": food_scores}
        self.response.write(json.dumps(response))

class RecognizeAndRecommendBinary(webapp2.RequestHandler):
    def post(self):
        if self.request.get('debug_foods'):
            foods = self.request.get('debug_foods').split('//')
            food_scores = [[food, 1] for food in foods]
        else:
            food_scores = recognize_hybrid(self.request.body)['foods']
            foods = [f[0] for f in food_scores]
        print 'FOODS:', foods
        recommendations = get_recommendations(foods)
        response = {"recommendations": recommendations, "food_scores": food_scores}
        self.response.write(json.dumps(response))


class RecTest(webapp2.RequestHandler):
    def get(self):
        self.response.write("""
        <form method='POST'>
        <input name='url' placeholder='url' />
        <input type=submit />
        </form>
        """)
    
    def post(self):
        image = urllib2.urlopen(self.request.get('url')).read()
        self.response.write(json.dumps(recognize_hybrid(image)))
