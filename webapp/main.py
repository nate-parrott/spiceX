# Copyright 2016 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import webapp2
from recognition import Recognize, RecognizeBase64, RecognizeAndRecommend
from recipes import SubmitRecipe
from recipe_review import RecipeReview, EnableRecipe
from recommendations import Recommendations
from template import template

class MainPage(webapp2.RequestHandler):
    def get(self):
        self.response.headers['Content-Type'] = 'text/plain'
        self.response.write('Hello, World!')

class SpiceXHandler(webapp2.RequestHandler):
    def get(self):
        self.response.write(template('spicex.html'))

app = webapp2.WSGIApplication([
    ('/', MainPage),
    ('/recognize', Recognize),
    ('/recognize_b64', RecognizeBase64),
    ('/submit', SubmitRecipe),
    ('/review', RecipeReview),
    ('/recommend', Recommendations),
    ('/recognize_and_recommend', RecognizeAndRecommend),
    ('/enable_recipe', EnableRecipe),
    ('/spicex', SpiceXHandler)
], debug=True)
