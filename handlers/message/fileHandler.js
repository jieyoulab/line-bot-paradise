// handlers/message/fileHandler.js
module.exports = async function handleFile(event, client /*, tenant */) {
    const name = event.message?.fileName || '檔案';
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `已收到檔案：${name} 🗂️（之後可加上傳或掃毒流程）`
    });
    return true;
  };
  