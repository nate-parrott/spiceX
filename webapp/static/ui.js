
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function fourRandos(maxIndex, arrLength) {
  let arr = [];
  let i = 0;
  while (i < arrLength) {
    let num = getRandomInt(0, maxIndex);
    if (arr.indexOf(num) == -1) {
      arr.push(num);
      i++;
    }
  }
  return arr;
}

function setSpicecons(spices, $icons) {
  let arr = fourRandos($icons.length-1, 13);
  for (var i = 0; i < $icons.length; i++) {
    if (arr.indexOf(i) != -1) {
      $icons[i].removeClass('fade');
    } else {
      $icons[i].addClass('fade');
    }
  }
}

// sorry this is gross but i am tired
function noFood($main) {
  setLeds([]);
  
  $('<h2></h2>').text('zest').appendTo($main);

  let numCols = 6;
  let numRows = 6;
  let classes = ['even-row', 'odd-row'];
  let spices = [
    'cumin',
    'oregano',
    'ginger',
    'cinnamon',
    'turmeric',
    'nutmeg',
    'garlic',
    'onion',
    'cloves',
    'pepper',
    'chili'
  ];
  let $icons = [];
  let suffix = '.svg';
  let prefix = '/static/icons/spicecons/white/';
  let $spicecons = $('<div></div>').addClass('spicecons').appendTo($main);
  let currentSpiceInd = 0;
  for (var i = 0; i < numRows; i++) {
    let $row = $('<div></div>').addClass(classes[i%2]);
    for (var j = 0; j < numCols; j++) {
      let $icon = $('<img/>').addClass('icon').attr('src', prefix + spices[currentSpiceInd] + suffix).appendTo($row);
      $icons.push($icon);
      currentSpiceInd++;
      if (currentSpiceInd == spices.length) {
        currentSpiceInd = 0;
      }
    }
    $spicecons.append($row);
  }

  setTimeout(function() {
    setSpicecons(spices, $icons);
  }, 10);
  setInterval(
    function() {
      setSpicecons(spices, $icons);
    },
    3000
  );

  let $emptyPageInfo = $('<div></div>').addClass('empty-info').appendTo($main);
  $emptyPageInfo.append($('<div></div>').addClass('header').text('food tasting bland?'));
  $emptyPageInfo.append($('<p></p>').text('Just put your plate on the circle below and find the right combination of toppings for you.'));
}

let _last_food = null;

function gotFood(food) {
  if (food === _last_food) {
    return;
  }

  _last_food = food;

  food = food || {recommendations: [], food_scores: []};
  
  let $main = $('#main').empty();

  if (food.recommendations.length == 0) {
    noFood($main);
    return;
  }

  let $header = $('<div></div>').addClass('header').appendTo($main);
  $header.append($('<div></div>').addClass('eating-label').text("I'm eating..."));
  let $nav = $('<div></div>').addClass('nav').appendTo($header);
  let $navFoods = $('<div></div>').addClass('nav-foods').appendTo($nav);
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
    $navFoods.children().removeClass('selected');
    let idx = foodNames.indexOf(foodName);
    $($navFoods.children().get(idx)).addClass('selected');
    $recipes.empty();
    recipesByFood[foodName].map((recipe) => {
      $recipes.append(renderRecipe(recipe));
    });

    let selectedRecipe = (recipe) => {
      if (recipe) {
        setLeds(recipe.led_pins || []);
      }
    };


    // Make recipes a swipe carousel
    $recipes.itemslide();
    $recipes.addSlide('');
    $recipes.removeSlide($recipes[0].children.length-1);
    let $currentIndex = $recipes.getActiveIndex();
    $recipes.on('changeActiveIndex', function(e) {
      console.log($recipes.getActiveIndex());
      // Hide other arrows and make sure the current one has default opacity
      $('.recipe-arrow').hide();
      if ($('.recipe-container.itemslide-active').scrollTop() == 0) {
        $('.recipe-arrow').css({'opacity': '1'});
      }

      if ($recipes.getActiveIndex() !== $currentIndex) {
        let recipe = recipesByFood[foodName][$recipes.getActiveIndex()];
        selectedRecipe(recipe);
        $currentIndex = $recipes.getActiveIndex();
      }

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
    let $recipeIconContainer = $('<div></div>').addClass('recipe-icon-header').appendTo($recipe);
    let $recipeIcon = $('<img/>').addClass('recipe-icon').appendTo($recipeIconContainer);
    $('<h1></h1>').text(recipe.title).appendTo($recipe);

    // add spiciness rating
    let $spiciness = $('<div></div>').addClass('spiciness').appendTo($recipe);
    $spiciness.append($('<div></div>').addClass('spiciness-label').text('spiciness'));
    for (let i = 0; i < recipe.spicyness-1; i++) {
      $spiciness.append($('<div></div>').addClass('spicy'));
    }
    for (let i = 0; i < (5 - recipe.spicyness); i++) {
      $spiciness.append($('<div></div>').addClass('unspicy'));
    }

    let maxAmount = 0;
    let recipeIconURL = "";
    
    $('<p></p>').addClass('description').text(recipe.description).appendTo($recipe);
    let $ingredients = $('<ul></ul>').addClass('ingredients').appendTo($recipe);
    recipe.ingredients.forEach((ingredient) => {
      let $li = $('<li></li>').appendTo($ingredients);
      $('<img/>').attr('src', ingredient.pic_url).appendTo($li);
      let $ingredientInfo = $('<div></div>').addClass('ingredient-info').appendTo($li);
      $ingredientInfo.append($('<strong></strong>').addClass('ingredient-name').text(ingredient.ingredient));

      // Add shake(s) on for future, but check for previous version
      let amount = ingredient.amount;
      if (!isNaN(amount)) {
        if (amount > maxAmount) {
          maxAmount = parseInt(amount);
          recipeIconURL = ingredient.icon_url;
        }
        amount += " " + ((parseInt(amount) > 1) ? "shakes" : "shake");
      }
      $ingredientInfo.append($('<span></span>').addClass('ingredient-amount').text(amount));
      return $li
    });

    $recipeIcon.attr('src', recipeIconURL);

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
      if (foodNames.indexOf(foodName) != -1) { return }
      recipesByFood[foodName] = obj.recipes;
      foodNames.push(foodName);
      
      let label = $('<div></div>').addClass('food').text(foodName).click(() => {
        selectFood(foodName);
      }).appendTo($navFoods);
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


if (location.search.indexOf('info') == -1) {
  $(document.body).addClass('hide-cursor');
}

