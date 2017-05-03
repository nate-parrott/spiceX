import json
import requests
from requests.auth import HTTPBasicAuth
from google.appengine.api import memcache

secrets = json.load(open('secrets.json'))

def get_clarifai_token():
    if memcache.get('clarifai_token'):
        print 'reusing cached key'
        return memcache.get('clarifai_token')
    
    user = secrets['clarifai_client_id']
    pw = secrets['clarifai_secret']
    resp = requests.post('https://api.clarifai.com/v2/token', auth=HTTPBasicAuth(user, pw), data={"grant_type": "client_credentials"}).json()
    print resp
    
    token = resp['access_token']
    expiration = resp['expires_in']
    memcache.add(key='clarifai_token', value=token, time=expiration-30)
    return token
    

# if __name__ == '__main__':
#     get_clarifai_token()
