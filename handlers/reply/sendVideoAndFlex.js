// handlers/reply/sendVideoAndFlex.js
const videoPlayerBubble = require('../../flex/bubble/videoPlayerReplyBubble'); // ← 新檔案
const newsBubble        = require('../../flex/bubble/rumaLatestNewsBubble');    // 你的原 Flex 模組

module.exports = async function sendVideoAndFlex(
  replyToken,
  client,
  {
    mp4Url = 'https://drive.usercontent.google.com/download?id=1jixrWqOvBzqcswnPUNy9inoWhA7Xvj1Y&export=download',
    previewImageUrl = 'https://img.youtube.com/vi/PMkntIbcpMc/hqdefault.jpg',
    aspectRatio = '20:13',  // 想更高可用 '1:1'；想標準用 '16:9'
    quickReply,
    applyQRToBoth = false   // true=兩則都掛；false=只掛在第二則（建議）
  } = {}
) {
  const flexVideoMsg = {
    type: 'flex',
    altText: '最新影片',
    contents: videoPlayerBubble({ mp4Url, previewUrl: previewImageUrl, ratio: aspectRatio }),
    ...(applyQRToBoth && quickReply ? { quickReply } : {})
  };

  const flexNewsMsg = {
    type: 'flex',
    altText: '櫓榪竹工作室｜最新消息',
    contents: newsBubble,
    ...(quickReply ? { quickReply } : {})
  };

  // 先影片（Flex video），再你的 Flex
  return client.replyMessage(replyToken, [flexVideoMsg, flexNewsMsg]);
};
