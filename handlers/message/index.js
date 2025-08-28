//handlers/message/index.js (事件=> 訊息子型別分派器)
// message 事件 ==> 底下還有多種子型別：
// text / image / video / audio / file / location / sticker
// 建議把它們各自拆成小 handler，然後在 handlers/message/index.js 用「子型別分派」去呼叫
// 先留空骨架，之後 Phase 3 會啟用
// handlers/message/index.js
const { handleTextMessage } = require('../messageHandler'); // 你夥伴原本那支
const handleImage   = require('./imageHandler');
const handleVideo   = require('./videoHandler');
const handleAudio   = require('./audioHandler');
const handleFile    = require('./fileHandler');
const handleLocation= require('./locationHandler');
const handleSticker = require('./stickerHandler');

// 回傳 Promise<boolean>：true=已回覆/處理完；false=未處理，讓外層有機會 fallback
module.exports = async function handleMessage(event, client, tenant) {
  const m = event.message;
  if (!m) return false;

  const dispatchMap = {
    text:     (e,c,t) => handleTextMessage(e,c,t), // 沿用現有
    image:    handleImage,
    video:    handleVideo,
    audio:    handleAudio,
    file:     handleFile,
    location: handleLocation,
    sticker:  handleSticker,
  };

  const fn = dispatchMap[m.type];
  if (!fn) return false;          // 未支援的子型別

  return fn(event, client, tenant);
};


/**
 * 保持 boolean 介面：每個 handler 都回 true/false，外層好控管 fallback。

下載媒體：未來要拿原始檔可用 client.getMessageContent(messageId)（回傳 stream），建議在各自的 handler 內處理。

地圖或 Flex：locationHandler 之後可以回 Flex Bubble（地圖截圖、導航按鈕）或加 Quick Reply。

權限與額度：若某些子型別只開給會員，直接在各 handler 內做 gating。

錯誤處理：任何 replyMessage 失敗，要記得 try/catch 並回 true/false 規範一致。

index.js 裡的 dispatchMap 寫法很好，之後要做權限/限流/記錄，也可以在這層統一處理。

每個 handler 請維持 Promise<boolean> 介面，外層 fallback 才好控。

 */