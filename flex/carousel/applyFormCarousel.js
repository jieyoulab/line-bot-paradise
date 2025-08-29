// flex/carousel/applyFormCarousel.js
// 多活動 Carousel：把多筆活動資料轉成 bubbles

const applyFormBubble = require('../bubble/applyFormBubble'); // 👈 修正路徑：bubble（單數）

function applyFormCarousel(events = []) {
  const bubbles = (events || [])
    .filter(Boolean)
    .map(evt => applyFormBubble(evt))
    .slice(0, 10); // LINE carousel 上限 10

  if (bubbles.length === 0) {
    return {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              { type: 'text', text: '目前沒有可報名的活動', weight: 'bold', size: 'lg' },
              { type: 'text', text: '請稍後再試，或關注最新公告。', size: 'sm', color: '#666666' }
            ]
          }
        }
      ]
    };
  }

  return { type: 'carousel', contents: bubbles };
}

module.exports = applyFormCarousel;
