let cvs = document.createElement('canvas');
let ctx = cvs.getContext('2d');
let imageDiffThreshold = 0.01;

let lastDiff = null;

function getImageData(url, callback) {
  let image = new Image();
  image.crossOrigin = "Anonymous";
  // $('#img-container').empty().append(image);
  image.addEventListener('load', function() {
    cvs.width = image.width;
    cvs.height = image.height;
    ctx.drawImage(image, 0, 0);
    callback(ctx.getImageData(0, 0, cvs.width, cvs.height));
  });
  image.addEventListener('error', function() {
    callback(null);
  });
  image.src = url;
}

function imagesAreDifferent(im1, im2) {
  if (im1.data.length === im2.data.length) {
    let diff = 0;
    let len = im1.data.length;
    for (let i=0; i<len; i++) {
      diff += Math.abs(im1.data[i] - im2.data[i]);
    }
    let averageDiff = (diff / 255) / len;
    lastDiff = averageDiff;
    return averageDiff > imageDiffThreshold;
  } else {
    return true;
  }
}

function postImageData(data, callback) {
  ctx.putImageData(data, 0, 0);
  let url = cvs.toDataURL('image/jpeg');
  $.post('/recognize_and_recommend', {data: url}, function(resp) {
    callback(JSON.parse(resp));
  })
}

// TEST RECOGNITION:
// getImageData('http://localhost:8999/', (data) => {
//   postImageData(data, (resp) => {
//     window.gotFood(resp);
//     // console.log(resp)
//   })
// })

let cameraLoopInterval = 50;

class FoodRecognizer {
  constructor() {    
    this.lastQueriedImage = null;
    this.lastFrameImage = null;
    
    this.fetchCount = 0;
    this.lastRec = null;
    this.cameraLoop();
  }
  cameraLoop() {
    this.updateStatus();
    
    console.log('loop');
    
    getImageData('http://localhost:8999/camera', (image) => {
      let loopAgain = () => {
        setTimeout(() => this.cameraLoop(), cameraLoopInterval);
      }
      
      let imageIsStill = this.lastFrameImage && !imagesAreDifferent(image, this.lastFrameImage);
      this.lastFrameImage = image;
      if (imageIsStill) {
        let isDifferentFromLastQueried = !this.lastQueriedImage || imagesAreDifferent(image, this.lastQueriedImage);
        if (isDifferentFromLastQueried) {
          // capture now:
          console.log('capturing now');
          this.lastQueriedImage = image;
          this.sendImage(() => {
            loopAgain();
          });
        } else {
          loopAgain();
        }
      } else {
        loopAgain();
      }
    })
  }
  sendImage(callback) {
    this.fetchCount++;
    // use this.mostRecentImage
    postImageData(this.lastFrameImage, (results) => {
      this.lastRec = results;
      window.gotFood(results);
      callback();
    })
  }
  updateStatus() {
    $('#status').text(this.fetchCount + ' fetches\nlast diff: ' + lastDiff + '\nlast rec: ' + JSON.stringify(this.lastRec));
  }
}

$(function() {
  window.gotFood(null);
  if (!window.DEBUG_FOODS) {
    window.rec = new FoodRecognizer();
  } else {
    // the camera sees fake debug foods 
    $.post('/recognize_and_recommend', {debug_foods: window.DEBUG_FOODS.join('//')}, function(resp) {
      window.gotFood(JSON.parse(resp));
    })
  }
});
