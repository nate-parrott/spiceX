function gotFood(food) {
  console.log(food)
  food = food || {recommendations: [], food_scores: []};
  
  let $main = $('#main').empty();
  let $header = $('<div></div>').addClass('header').appendTo($main);
  let $recipes = $('<div></div>').addClass('recipes').appendTo($main);
  
  let $info = $('<div></div>').addClass('info');
  if (location.search.indexOf('info') >= 0) {
    $info.appendTo($main);
  }
  $info.text("I see: " + JSON.stringify(food.food_scores));
  
  let foodNames = [];
  let recipesByFood = {};
  
  let selectFood = (foodName) => {
    $header.children().removeClass('selected');
    let idx = foodNames.indexOf(foodName);
    $($header.children().get(idx)).addClass('selected');
    $recipes.empty();
    recipesByFood[foodName].map((recipe) => {
      $recipes.append(renderRecipe(recipe));
    })
  }
  
  let renderRecipe = (recipe) => {
    let $card = $('<div></div>').addClass('card');
    $('<h1></h1>').text(recipe.title).appendTo($card);
    $('<p></p>').addClass('description').text(recipe.description).appendTo($card);
    let $ingredients = $('<ul></ul').addClass('ingredients').appendTo($card);
    recipe.ingredients.forEach((ingredient) => {
      let $li = $('<li></li>').appendTo($ingredients);
      $li.append($('<strong></strong>').addClass('ingredient').text(ingredient.ingredient));
      $li.append($('<span></span>').addClass('amount').text(ingredient.amount));
      return $li
    });
    if (recipe.extra_instructions) {
      $('<p></p>').addClass('extra').text(recipe.extra_instructions).appendTo($card);
    }
    return $('<div></div>').addClass('recipe').append($card);
  }
  
  food.recommendations.forEach((obj, i) => {
    if (obj.recipes.length > 0) {
      let foodName = obj.food;
      recipesByFood[foodName] = obj.recipes;
      foodNames.push(foodName);
      
      let label = $('<div></div>').text(foodName).click(() => {
        selectFood(foodName);
      }).appendTo($header);
    }
  });
  
  if (foodNames.length > 0) {
    selectFood(foodNames[0]);
  }
}
