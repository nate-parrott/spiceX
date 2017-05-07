// turns on/off LEDs

function setLeds(pins) {
  //console.log('Setting LEDs:', pins);
  let url = 'http://localhost:8999/leds?pins=' + pins.join(',');
  //$.post(url, {}, (resp) => {});
}

// setLeds([2,3])
