// handlers/postback/index.js
const ytBambooList = require('./ytBambooList');
// 之後要做成 Flex 再各自拆檔
// const ytAtayalList = require('./ytAtayalList');
// const ytCorporateList = require('./ytCorporateList');

function parseData(raw) {
  const qs = new URLSearchParams(raw || '');
  return Object.fromEntries(qs.entries());
}

async function handlePostback({ event, client, tenant }) {
  const data = parseData(event.postback?.data);
  const action = data.action;

  switch (action) {
    case 'yt_bamboo_list':
      // 你已經有 handlers/postback/ytBambooList.js 並 export { handle }
      return ytBambooList.handle({ event, client, tenant, data });

    case 'yt_atayal__list':
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '（stub）泰雅族與桂竹：清單準備中 📜'
      });
      return true;

    case 'yt_corporate__list':
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '（stub）桂竹協會系列：清單準備中 🧾'
      });
      return true;

    default:
      // 未知指令：回覆提示
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `指令未支援：${action || '(空)'}`
      });
      return true;
  }
}

module.exports = { handlePostback };
