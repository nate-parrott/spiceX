from google.appengine.ext import ndb
from ingredients import ingredients, ingredients_by_id
from copy import deepcopy

class Recipe(ndb.Model):
    added = ndb.DateTimeProperty(auto_now_add=True)
    
    # this will recipe will appear when foods that match this array are seen; e.g. 'chicken'
    foods = ndb.StringProperty(repeated=True)
    
    title = ndb.TextProperty()
    description = ndb.TextProperty()
    creator = ndb.UserProperty()
    
    ingredients = ndb.JsonProperty() # [{"ingredient": <id>, "amount": <>}]
    extra_instructions = ndb.TextProperty()
    
    spicyness = ndb.FloatProperty()
    sweetness = ndb.FloatProperty()
    
    enabled = ndb.BooleanProperty(default=False)
    
    def json(self):
        recipe_ingredients = deepcopy(self.ingredients)
        led_pins = []
        
        for recipe_ingredient in recipe_ingredients:
            id = recipe_ingredient['ingredient']
            ingredient_info = ingredients_by_id.get(id)
            if ingredient_info:
                if 'pic' in ingredient_info:
                    recipe_ingredient['pic_url'] = '/static/ingredient_images/' + ingredient_info['pic']
                if 'icon' in ingredient_info:
                    recipe_ingredient['icon_url'] = '/static/icons/spicecons/' + ingredient_info['icon']
                if ingredient_info.get('pin') is not None:
                    led_pins.append(ingredient_info['pin'])
        
        return {
            "title": self.title,
            "description": self.description,
            "ingredients": recipe_ingredients,
            "extra_instructions": self.extra_instructions,
            "spicyness": self.spicyness,
            "sweetness": self.sweetness,
            "led_pins": led_pins
        }

class Whitelist(ndb.Model):
    foods = ndb.StringProperty(repeated=True)
    
    @staticmethod
    def get():
        return Whitelist.get_obj().foods
    
    @staticmethod
    def set(foods):
        obj = Whitelist.get_obj()
        obj.foods = foods
        obj.put()
    
    @staticmethod
    def get_obj():
        for obj in Whitelist.query():
            return obj
        return Whitelist(foods=[])
