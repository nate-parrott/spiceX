
function requestImage(callback) {
  let lastIdx = window.requestImageLastIdx || 0;
  let req = new XMLHttpRequest();
  req.open('GET', 'http://localhost:8999/newcamera?last_idx=' + lastIdx, true);
  req.responseType = 'arraybuffer';
  req.onload = (e) => {
    if (req.getResponseHeader('X-Index')) {
      window.requestImageLastIdx = parseInt(req.getResponseHeader('X-Index'));
    }
    if (req.status == 200) {
      callback(req.response);
    } else {
      callback(null);
    }
  };
  req.send(null);
}

function recognizeImage(imageBuffer, callback) {
  var req = new XMLHttpRequest();
  req.open("POST", '/recognize_and_recommend_binary', true);
  req.setRequestHeader("Content-Type", "image/jpeg");
  req.onload = (e) => {
    callback(JSON.parse(req.responseText));
  };
  req.send(imageBuffer);
}

let cameraLoopInterval = 75;

class FoodRecognizer {
  constructor() {    
    this.lastRec = null;
    this.cameraLoop();
  }
  cameraLoop() {
    let loopAgain = () => {
      this.updateStatus();
      setTimeout(() => this.cameraLoop(), cameraLoopInterval);
    }
    
    requestImage((imageBuffer) => {
      if (imageBuffer) {
        console.log('got new image');
        this.sendImage(imageBuffer, loopAgain);
      } else {
        console.log('no new image');
        loopAgain();
      }
    });
  }
  
  sendImage(imageBuffer, callback) {
    this.fetchCount++;
    recognizeImage(imageBuffer, (results) => {
      this.lastRec = results;
      console.log("recognition.js: " + results);
      window.gotFood(results);
      callback();
    })
  }
  
  updateStatus() {
    $('#status').text(this.fetchCount + ' fetches \nlast rec: ' + JSON.stringify(this.lastRec));
  }
}

$(function() {
  window.gotFood(null);
  if (!window.DEBUG_FOODS) {
    window.rec = new FoodRecognizer();
  } else {
    // the camera sees fake debug foods 
    $.post('/recognize_and_recommend_binary', {debug_foods: window.DEBUG_FOODS.join('//')}, function(resp) {
      window.gotFood(JSON.parse(resp));
    })
  }
});
