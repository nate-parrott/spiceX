let rescale = () => {
  $('.responsive-iframe-container').each((i, container) => {
    container = $(container);
    let iframe = container.find('iframe');
    let xScale = container.width() / iframe.width();
    let yScale = container.outerHeight() / iframe.height();
    iframe.css({transformOrigin: 'left top', transform: 'scale(' + xScale + ', ' + yScale + ')'});
  })
}

$(document).ready(rescale);
$(window).resize(rescale);
