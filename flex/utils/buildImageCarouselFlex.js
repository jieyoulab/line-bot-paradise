// utils/buildImageCarouselFlex.js
/**
 * cards: Array<{
 *   imageUrl: string,
 *   action?: { type:'uri'|'message'|'postback', uri?:string, text?:string, data?:string }
 *   aspectRatio?: '1:1'|'4:3'|'16:9'|'3:2'
 * }>
 */
module.exports = function buildImageCarouselFlex(cards = []) {
    const bubbles = cards.map(c => ({
      type: 'bubble',
      size: 'kilo',
      hero: {
        type: 'image',
        url: c.imageUrl,
        size: 'full',
        aspectRatio: c.aspectRatio || '16:9',
        aspectMode: 'cover',
        ...(c.action ? { action: c.action } : {})
      }
    }));
  
    return {
      type: 'flex',
      altText: '圖片輪播',
      contents: {
        type: 'carousel',
        contents: bubbles
      }
    };
  };
  