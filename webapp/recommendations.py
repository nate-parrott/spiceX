import webapp2
from models import Recipe, Whitelist
import json

def json_for_recipes(food, recipes):
    return {
        "food": food,
        "recipes": [r.json() for r in recipes]
    }

def get_recommendations(foods):
    if len(foods) == 0:
        return []
    
    recipes = Recipe.query().filter(Recipe.foods.IN(foods)).filter(Recipe.enabled == True).fetch(limit=100)
    recipes.sort(key=lambda r: r.added, reverse=True)
    
    whitelist = set(Whitelist.get())
    print whitelist
    
    results = []
    for food in foods:
        if len(whitelist) == 0 or food in whitelist:
            matching_recipes = [r for r in recipes if food in r.foods]
            results.append(json_for_recipes(food, matching_recipes))
    return results

class Recommendations(webapp2.RequestHandler):
    def get(self):
        foods = self.request.get('foods').split(',')
        self.response.headers.add_header('Content-Type', 'application/json')
        self.response.write(json.dumps(get_recommendations(foods)))
