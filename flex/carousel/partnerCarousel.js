// flex/carousel/partnerCarousel.js
// -----------------------------------------------------------------------------
// 將多個夥伴資料組成 Carousel（最多 10 張）
// 允許輸入鍵為 partners 或 products（方便你共用同一份 products.json）
// -----------------------------------------------------------------------------

const partnerCard = require('../bubble/partnerCard');

module.exports = function partnerCarousel(input = [], opts = {}) {
  const list = Array.isArray(input) ? input : [];
  const bubbles = list.slice(0, 10).map(p => partnerCard(p, opts));
  return { type: 'carousel', contents: bubbles };
};
