import webapp2
from google.appengine.ext import ndb
from google.appengine.api import users
from template import template
from models import Recipe

class RecipeReview(webapp2.RequestHandler):
    def get(self):
        if users.is_current_user_admin():
            vars = {
                "recipes": Recipe.query().order(-Recipe.added).fetch()
            }
            self.response.write(template('recipe_review.html', vars))
        elif users.get_current_user():
            return self.redirect(users.create_logout_url('/review'))
        else:
            return self.redirect(users.create_login_url('/review'))

class EnableRecipe(webapp2.RequestHandler):
    def post(self):
        if users.is_current_user_admin():
            id = self.request.get('id')
            enabled = self.request.get('enabled') == 'true'
            recipe = ndb.Key(urlsafe=id).get()
            recipe.enabled = enabled
            recipe.put()
            self.response.write('ok')
