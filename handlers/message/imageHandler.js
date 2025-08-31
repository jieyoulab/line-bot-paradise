// handlers/message/imageHandler.js
const buildQuickReply = require('../../flex/utils/buildQuickReply');         // 你已有的工具
const buildImageCarouselFlex = require('../../flex/utils/buildImageCarouselFlex'); // 前面我給你的工具

/**
 * 收到「圖片訊息」時的處理器
 * 1) 回一則文字 + Quick Reply
 * 2) 再回一則圖片輪播（Flex Carousel）
 */
module.exports = async function handleImage(event, client /*, tenant */) {
  try {
    // 1) Quick Reply 項目（你可以依租戶/情境抽到 JSON）
    const quickReplyItems = [
      { label: 'Facebook 專頁', type: 'uri', uri: 'https://www.facebook.com/MuduRuma/' },
      { label: 'Instagram',   type: 'uri', uri: 'https://www.instagram.com/muduruma_master/' },
      { label: '影音圖文報導', type: 'uri', uri: 'https://www.youtube.com/watch?v=vzatD2Ysl1g' },
      { label: '市集展售訊息', type: 'uri', uri: 'https://www.facebook.com/MuduRuma/' }
    ];

    const textMsg = buildQuickReply(quickReplyItems, '快來關注我～');

    // 2) 圖片輪播卡片（純 hero 圖片，可點擊）
    const cards = [
      {
        imageUrl: 'https://example.com/ruma/hero-01.jpg',
        action: { type: 'uri', uri: 'https://www.facebook.com/MuduRuma/' }
      },
      {
        imageUrl: 'https://example.com/ruma/hero-02.jpg',
        action: { type: 'message', text: '我想看市集展售訊息' }
      },
      {
        imageUrl: 'https://img.youtube.com/vi/vzatD2Ysl1g/hqdefault.jpg',
        action: { type: 'uri', uri: 'https://www.youtube.com/watch?v=vzatD2Ysl1g' }
      }
    ];

    const carouselMsg = buildImageCarouselFlex(cards);

    // ⚠️ 一次 reply 最多 5 則；這裡回 2 則（安全）
    await client.replyMessage(event.replyToken, [textMsg, carouselMsg]);
    return true;
  } catch (err) {
    console.error('[imageHandler] failed:', err);
    // 失敗則至少回覆一則文字避免超時
    try {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '已收到圖片 🙌（稍後再提供更多資訊）'
      });
    } catch {}
    return false;
  }
};

/**
 * uildQuickReply(items, text)：會回一則 文字＋Quick Reply。

buildImageCarouselFlex(cards)：回 Flex Carousel（每張圖一個 bubble，能點擊）。

兩則訊息用 同一次 replyMessage 發送（順序：文字QR → 輪播）。

圖片 URL 必須 HTTPS 且可公開。

之後如果要依 不同租戶 或 不同情境，把 quickReplyItems／cards 抽到 tenantConfigs[ruma].imageReply 這類 JSON 即可。
 */