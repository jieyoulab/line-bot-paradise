// handlers/message/audioHandler.js
module.exports = async function handleAudio(event, client /*, tenant */) {
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: '已收到音訊 🎧（之後可加轉寫流程）'
    });
    return true;
  };
  