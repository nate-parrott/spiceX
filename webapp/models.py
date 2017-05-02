from google.appengine.ext import ndb

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
        from recipes import ingredients
        
        ingredient_ids = set([i['ingredient'] for i in self.ingredients])
        led_pins = [i['pin'] for i in ingredients if i['id'] in ingredient_ids and i.get('pin') is not None]
        
        return {
            "title": self.title,
            "description": self.description,
            "ingredients": self.ingredients,
            "extra_instructions": self.extra_instructions,
            "spicyness": self.spicyness,
            "sweetness": self.sweetness,
            "led_pins": led_pins
        }
