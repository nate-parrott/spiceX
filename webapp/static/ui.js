function gotFood(food) {
  console.log(food)
  food = food || {recommendations: [], food_scores: []};
  
  let $main = $('#main').empty();
  let $header = $('<div></div>').addClass('header').appendTo($main);
  let $container = $('<div></div>').addClass('container').appendTo($main);
  let $recipes = $('<ul></ul>').addClass('recipes').appendTo($container);
  
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
    });

    // Make recipes a swipe carousel
    $recipes.itemslide();
  }
  
  let renderRecipe = (recipe) => {
    let $card = $('<li></li>').addClass('recipe');
    $('<h1></h1>').text(recipe.title).appendTo($card);
    $('<p></p>').addClass('description').text(recipe.description).appendTo($card);
    let $ingredients = $('<ul></ul>').addClass('ingredients').appendTo($card);
    recipe.ingredients.forEach((ingredient) => {
      let $li = $('<li></li>').appendTo($ingredients);
      let $fakeImage = $('<div></div>').addClass('fake-image').appendTo($li);
      let $ingredientInfo = $('<div></div>').addClass('ingredient-info').appendTo($li);
      $ingredientInfo.append($('<strong></strong>').addClass('ingredient-name').text(ingredient.ingredient));
      $ingredientInfo.append($('<span></span>').addClass('ingredient-amount').text(ingredient.amount));
      return $li
    });
    if (recipe.extra_instructions) {
      $('<p></p>').addClass('extra').text(recipe.extra_instructions).appendTo($card);
    }

    return $card;
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

  // TODO : replace '?' with actual icon
  let $help = $('<div></div>').addClass('help').text("?").appendTo($header);
}
