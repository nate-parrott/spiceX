import json

ingredients = json.load(open('ingredients.json'))
ingredients_by_id = {ingredient['id']: ingredient for ingredient in ingredients}
