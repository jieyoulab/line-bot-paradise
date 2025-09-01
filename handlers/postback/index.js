// handlers/postback/index.js
const ytBambooList   = require('./ytBambooList');
const ytAtayalList   = require('./ytAtayalList');
const ytCorporateList= require('./ytCorporateList');

// ★ 同時回 Flex + Video 的共用函式
const sendVideoAndFlex = require('../reply/sendVideoAndFlex');

// ★ 新增：載入 quickReplies.json & 轉成 quickReply 物件
const path = require('path');
const fs   = require('fs');
const buildQuickReply         = require('../../flex/quickReply');
const buildQuickReplyPostback = require('../../flex/utils/quickReplyPostback');

function loadQuickReplies(tenantKey) {
  const file = path.resolve(__dirname, `../../data/${tenantKey}/quickReplies.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function renderQuickReplyMessage(tpl) {
  if (tpl.template === 'quickReplyPostback') {
    return buildQuickReplyPostback({ text: `${tpl.keyword}：請選擇 👇`, items: tpl.items });
  }
  return buildQuickReply(tpl.items); // 舊格式：支援 message/uri
}

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

    // ★★★ 新增：點圖文選單（postback）→ 同時回最新消息 Flex + 影片，並掛上原本的 QR
    case 'ruma_latest_video': {
      const tenantKey = tenant?.key || 'default';

      // 用同一個 keyword 去 quickReplies.json 找到你原本那組 QR
      const keyword = '櫓榪竹工作室最新消息';
      const quickReplies = loadQuickReplies(tenantKey);
      const matchedQR = quickReplies.find(q => q.keyword === keyword);

      let quickReply;
      if (matchedQR) {
        const r = renderQuickReplyMessage(matchedQR); // { type:'text', text, quickReply }
        quickReply = r.quickReply;                    // 只取 quickReply 物件
      }

      // 回 2 則訊息：Flex + Video（兩則都掛上 quickReply）
      await sendVideoAndFlex(event.replyToken, client, { quickReply });
      return true;
    }
    
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
