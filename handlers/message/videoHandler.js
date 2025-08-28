// handlers/message/videoHandler.js
module.exports = async function handleVideo(event, client /*, tenant */) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '已收到影片 🎬（之後可加轉檔或截圖流程）'
    });
    return true;
  };
  