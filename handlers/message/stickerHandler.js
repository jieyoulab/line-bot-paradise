// handlers/message/stickerHandler.js
module.exports = async function handleSticker(event, client /*, tenant */) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '貼圖好可愛 😄'
    });
    return true;
  };
  