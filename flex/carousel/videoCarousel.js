// flex/carousel/videoCarousel.js
const videoBubble = require('../bubble/videoBubble');

/**
 * 共用 Carousel：把 video 陣列轉成 Flex Carousel
 * @param {Array<Object>} videos
 * @param {Object} opts - 會傳給 videoBubble（size/color/preferMaxRes）
 */
module.exports = function videoCarousel(videos = [], opts = {}) {
  const list = Array.isArray(videos) ? videos : [];
  return {
    type: 'carousel',
    contents: list.slice(0, 10).map(v => videoBubble(v, opts))
  };
};
