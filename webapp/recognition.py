import webapp2
from requests import post
from base64 import b64encode, b64decode
import json
from recommendations import get_recommendations

secrets = json.load(open('secrets.json'))

def recognize_clarifai(data):
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer {}".format(secrets['clarifai_token'])
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
    api_resp = json.loads(post(url, data=json.dumps(req), headers=headers).text)
    print api_resp
    
    concepts = api_resp['outputs'][0]['data']['concepts']
    foods = [(c['name'], c['value']) for c in concepts]
    response = {
        "foods": foods
    }
    return response

def recognize_google(data):
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
    resp = json.loads(post(url, data=json.dumps(req), headers=headers).text)
    if 'responses' not in resp:
        print 'ERROR:'
        print resp
    labels = resp['responses'][0]['labelAnnotations']
    foods = [[l['description'], l['score']] for l in labels]
    return {
        "foods": foods
    }
    

class Recognize(webapp2.RequestHandler):
    def post(self):
        data = self.request.body
        response = recognize_google(data)
        self.response.write(json.dumps(response))

class RecognizeBase64(webapp2.RequestHandler):
    def post(self):
        data = b64decode(self.request.get('data').split('base64,', 1)[1])
        response = recognize_google(data)
        self.response.write(json.dumps(response))

class RecognizeAndRecommend(webapp2.RequestHandler):
    def post(self):
        if self.request.get('debug_foods'):
            foods = self.request.get('debug_foods').split('//')
            food_scores = [[food, 1] for food in foods]
        else:
            data = b64decode(self.request.get('data').split('base64,', 1)[1])
            food_scores = recognize_clarifai(data)['foods']
            foods = [f[0] for f in food_scores]
        print 'FOODS:', foods
        recommendations = get_recommendations(foods)
        response = {"recommendations": recommendations, "food_scores": food_scores}
        self.response.write(json.dumps(response))
