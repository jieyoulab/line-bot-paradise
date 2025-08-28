// handlers/message/imageHandler.js
module.exports = async function handleImage(event, client /*, tenant */) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '已收到圖片 🙌（之後可加下載與識別流程）'
    });
    return true;
  };