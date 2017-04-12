import webapp2
from requests import post
from base64 import b64encode
import json

secrets = json.load(open('secrets.json'))

class Recognize(webapp2.RequestHandler):
    def post(self):
        data = self.request.body
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
        
        concepts = api_resp['outputs'][0]['data']['concepts']
        foods = [(c['name'], c['value']) for c in concepts]
        response = {
            "foods": foods
        }
        
        self.response.write(json.dumps(response))
