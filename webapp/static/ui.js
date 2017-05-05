
function gotFood(food) {
  console.log(food)
  food = food || {recommendations: [], food_scores: []};
  
  let $main = $('#main').empty();
  let $header = $('<div></div>').addClass('header').appendTo($main);
  $header.append($('<div></div>').addClass('eating-label').text("I'm eating..."));
  let $nav = $('<div></div>').addClass('nav').appendTo($header);
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
    $nav.children().removeClass('selected');
    let idx = foodNames.indexOf(foodName);
    $($nav.children().get(idx)).addClass('selected');
    $recipes.empty();
    recipesByFood[foodName].map((recipe) => {
      $recipes.append(renderRecipe(recipe));
    });

    let selectedRecipe = (recipe) => {
      //setLeds(recipe.led_pins); // Currently removed because it was throwing errors and messing with my sliding! >:( 
    };

    // Make recipes a swipe carousel
    $recipes.itemslide();
    $recipes.on('changeActiveIndex', function(e) {
      let recipe = recipesByFood[foodName][$recipes.getActiveIndex()];
      selectedRecipe(recipe);
    });
    
    if (recipesByFood[foodName].length) {
      let initialRecipe = recipesByFood[foodName];
      selectedRecipe(recipesByFood[foodName][0]);
    }
  }
  
  let renderRecipe = (recipe) => {
    let $card = $('<li></li>').addClass('recipe-container');
    let $recipe = $('<div></div>').addClass('recipe').appendTo($card);
    $('<div></div>').addClass('recipe-icon').appendTo($recipe); // TODO: add in real recipe icons
    $('<h1></h1>').text(recipe.title).appendTo($recipe);

    // add spiciness rating
    let $spiciness = $('<div></div>').addClass('spiciness').appendTo($recipe);
    $spiciness.append($('<div></div>').addClass('spiciness-label').text('spiciness'));
    for (let i = 0; i < recipe.spicyness; i++) {
      $spiciness.append($('<div></div>').addClass('spicy'));
    }
    for (let i = 0; i < (5 - recipe.spicyness); i++) {
      $spiciness.append($('<div></div>').addClass('unspicy'));
    }
    
    $('<p></p>').addClass('description').text(recipe.description).appendTo($recipe);
    let $ingredients = $('<ul></ul>').addClass('ingredients').appendTo($recipe);
    recipe.ingredients.forEach((ingredient) => {
      let $li = $('<li></li>').appendTo($ingredients);
      $('<div></div>').addClass('fake-image').appendTo($li); // TODO: add in real spice images
      let $ingredientInfo = $('<div></div>').addClass('ingredient-info').appendTo($li);
      $ingredientInfo.append($('<strong></strong>').addClass('ingredient-name').text(ingredient.ingredient));
      $ingredientInfo.append($('<span></span>').addClass('ingredient-amount').text(ingredient.amount));
      return $li
    });
    if (recipe.extra_instructions) {
      $('<p></p>').addClass('extra').text(recipe.extra_instructions).appendTo($recipe);
    }

    return $card;
  }
  
  food.recommendations.forEach((obj, i) => {
    if (obj.recipes.length > 0) {
      let foodName = obj.food;
      recipesByFood[foodName] = obj.recipes;
      foodNames.push(foodName);
      
      let label = $('<div></div>').addClass('food').text(foodName).click(() => {
        selectFood(foodName);
      }).appendTo($nav);
    }
  });

  $nav.append($('<div></div>').addClass('help')).click(fullscreenShortcut.tapped);
  
  if (foodNames.length > 0) {
    selectFood(foodNames[0]);
  }

}

// secret shortcut: tap four times on the question mark to toggle fullscreen:
var fullscreenShortcut = {
  lastTap: 0,
  count: 0,
  tapped: function() {
    let tapMaxDuration = 700;
    if (Date.now() - fullscreenShortcut.lastTap >= tapMaxDuration) {
      fullscreenShortcut.count = 0;
    }
    fullscreenShortcut.count++;
    fullscreenShortcut.lastTap = Date.now();
    if (fullscreenShortcut.count === 4) {
      // toggle fullscreen:
      if (screenfull.isFullscreen) {
        screenfull.exit();
      } else {
        screenfull.request();
      }
    }
  }
}
