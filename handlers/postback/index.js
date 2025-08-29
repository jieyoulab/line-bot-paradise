// handlers/postback/index.js
const ytBambooList   = require('./ytBambooList');
const ytAtayalList   = require('./ytAtayalList');
const ytCorporateList= require('./ytCorporateList');

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
      return ytAtayalList.handle({ event, client, tenant, data });
    
    case 'yt_corporate__list':
      return ytCorporateList.handle({ event, client, tenant, data });

    default:
      // 未知指令：回覆提示
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `目前沒有支援這個指令，請點擊正確按鈕：${action || '(空)'}`
      });
      return true;
  }
}

module.exports = { handlePostback };
