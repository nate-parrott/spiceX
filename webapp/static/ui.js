
function gotFood(food) {
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
      setLeds(recipe.led_pins || []);
    };

    // Make recipes a swipe carousel
    $recipes.itemslide();
    $recipes.on('changeActiveIndex', function(e) {
      // Hide other arrows and make sure the current one has default opacity
      $('.recipe-arrow').hide();
      $('.recipe-arrow').css({'opacity': '1'});

      let recipe = recipesByFood[foodName][$recipes.getActiveIndex()];
      selectedRecipe(recipe);

      // Only shows the down arrows on recipes that are long enough
      // Kind of a shitty workaround, but good enough for now
      let $recipeHeightThreshold = 420;
      if ($('.itemslide-active .recipe')[0].scrollHeight > $recipeHeightThreshold) {
        $('.itemslide-active .recipe-arrow').show();
      }
    });

    // If tapped, 
    $('.recipe-arrow').click(function(e) {
        $(e.target.parentNode).animate({
          scrollTop: 350
        }, 320);
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

      // Add shake(s) on for future, but check for previous version
      let amount = ingredient.amount;
      if (!isNaN(amount)) {
        amount += " " + ((parseInt(amount) > 1) ? "shakes" : "shake");
      }
      $ingredientInfo.append($('<span></span>').addClass('ingredient-amount').text(amount));
      return $li
    });
    if (recipe.extra_instructions) {
      $('<p></p>').addClass('extra').text(recipe.extra_instructions).appendTo($recipe);
    }

    // add down-arrow
    $card.append($('<div></div>').addClass('recipe-arrow'));

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

var recipeArrowScrollStyler = function() {
  let $scrolltop = $('.recipe-container.itemslide-active').scrollTop();
  let threshold = 10;
  if($scrolltop > threshold){
    $('.itemslide-active .recipe-arrow').css('opacity', (1 - (($scrolltop-threshold)/150)));
  } else {
    $('.itemslide-active .recipe-arrow').css('opacity', '1');
  }
}

document.addEventListener('scroll', recipeArrowScrollStyler, true);




