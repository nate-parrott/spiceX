from google.appengine.api import users
import webapp2
from template import template
import json
from models import Recipe, Whitelist
from ingredients import ingredients

flavor_attributes = [
    {'name': 'spicyness', 'label': 'How spicy will this be?'},
    {'name': 'sweetness', 'label': 'How sweet will this be?'}
]

class SubmitRecipe(webapp2.RequestHandler):
    def get(self):
        if users.get_current_user():
            self.render_form()
        else:
            return self.redirect(users.create_login_url('/submit'))
    
    def render_form(self, error=None, message=None):
        vals = {
            "ingredients": ingredients,
            "error": error,
            "message": message,
            "flavor_attribs": flavor_attributes
        }
        self.response.write(template('submit_recipe.html', vals))
    
    def post(self):
        if users.get_current_user():
            foods = [food.strip().lower() for food in (self.request.get('foods') or '').split(',')]
            if len(foods) == 0:
                return self.render_form(error='Select at least one food')
            title = (self.request.get('title') or '')
            if len(title) == 0:
                return self.render_form(error='Missing title!')
            desc = (self.request.get('description') or '')
            if len(desc) == 0:
                return self.render_form(error='Missing description!')
            extra_prep = self.request.get('extra_prep') or ''
            ingredients_json = []
            for ingredient in ingredients:
                id = ingredient['id']
                if self.request.get(id + '_ingredient'):
                    amount = self.request.get(id + '_ingredient_amount')
                    ingredients_json.append({'ingredient': id, 'amount': amount})
            if len(ingredients_json) == 0:
                return self.render_form(error='Check at least one ingredient!')
            kwargs = {}
            for flavor in flavor_attributes:
                name = flavor['name']
                kwargs[name] = float(self.request.get(name))
            
            recipe = Recipe(foods=foods, 
                            title=title, 
                            description=desc, 
                            ingredients=ingredients_json, 
                            extra_instructions=extra_prep,
                            creator=users.get_current_user(),
                            **kwargs)
            recipe.put()
            
            return self.render_form(message='Thanks for your submission!')


class RecipeWhitelist(webapp2.RequestHandler):
    def get(self):
        if users.is_current_user_admin():
            foods = Whitelist.get()
            self.response.write(template('whitelist.html', {'foods': '\n'.join(foods)}))
        elif users.get_current_user():
            return self.redirect(users.create_logout_url('/whitelist'))
        else:
            return self.redirect(users.create_login_url('/whitelist'))
    
    def post(self):
        if users.is_current_user_admin():
            foods = self.request.get('foods').split('\n')
            foods = [f.lower().strip() for f in foods]
            foods = [f for f in foods if len(f)]
            Whitelist.set(foods)
            self.response.write(template('whitelist.html', {'foods': '\n'.join(foods)}))
        
