let cvs = document.createElement('canvas');
let ctx = cvs.getContext('2d');

// function loadImage()
// {
//     var image = new Image();
//     image.src = 'image.jpg';
//     image.addEventListener('load',function()
//         {
//             MainCtx.drawImage(image,MainCanvas.width/2,MainCanvas.height/2);
//             console.log("width here" +image.width+ " maincanvas " +MainCanvas+ " mainctx " +MainCtx+ " image " +image);
//             ImageObject.pixels = getImagePixels(image); //-> store pixel data in the image
//         });
//     return image;
// }

function getImageData(url, callback) {
  let image = new Image();
  image.crossOrigin = "Anonymous";
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
    return averageDiff > 0.2;
  } else {
    return true;
  }
}

let cameraLoopInterval = 300;

class FoodRecognizer {
  constructor() {
    this.timeLeftBeforeSendingImage = null;
    this.prevImage = null;
    this.mostRecentImage = null;
    this.fetchCount = 0;
    this.cameraLoop();
  }
  cameraLoop() {
    this.updateStatus();
    console.log('loop');
    getImageData('http://localhost:8999/', (image) => {
      this.mostRecentImage = image;
      if (this.timeLeftBeforeSendingImage !== null) {
        this.timeLeftBeforeSendingImage -= cameraLoopInterval;
        if (this.timeLeftBeforeSendingImage <= 0) {
          console.log('capture now')
          // we are capturing an image now:
          this.sendImage(() => {
            setTimeout(() => this.cameraLoop(), cameraLoopInterval);
          });
          return;
        }
      }
      if (this.timeLeftBeforeSendingImage === null && this.prevImage && image && imagesAreDifferent(image, this.prevImage)) {
        console.log('schedule capture');
        // let's schedule a capture:
        this.prevImage = image;
        this.timeLeftBeforeSendingImage = 600;
      } else if (this.prevImage === null) {
        this.prevImage = image;
      }
      setTimeout(() => this.cameraLoop(), cameraLoopInterval);
    })
  }
  sendImage(callback) {
    this.timeLeftBeforeSendingImage = null;
    this.fetchCount++;
    // use this.mostRecentImage
    callback();
  }
  updateStatus() {
    $('#status').text(this.fetchCount + ' fetches');
  }
}

$(function() {
  window.rec = new FoodRecognizer();
});
