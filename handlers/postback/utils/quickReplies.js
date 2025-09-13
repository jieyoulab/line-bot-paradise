// utils/quickReplies.js  或 src/utils/quickReplies.js
const path = require('path');
const fs   = require('fs');

// 給定相對於本檔案(__dirname)的候選路徑，回傳第一個存在的完整路徑
function firstExistingPath(candidates) {
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function loadQuickReplies(tenantKey) {
  // 同時支援兩種專案結構：
  // A) utils/quickReplies.js（根目錄下） → ../data
  // B) src/utils/quickReplies.js         → ../../data
  const file = firstExistingPath([
    path.resolve(__dirname, `../data/${tenantKey}/quickReplies.json`),
    path.resolve(__dirname, `../../data/${tenantKey}/quickReplies.json`),
  ]);

  if (!file) {
    // fallback 也支援兩種層級
    const fallback = firstExistingPath([
      path.resolve(__dirname, `../data/default/quickReplies.json`),
      path.resolve(__dirname, `../../data/default/quickReplies.json`),
    ]);
    if (fallback) {
      try {
        return JSON.parse(fs.readFileSync(fallback, 'utf-8'));
      } catch (e) {
        console.warn('[quickReplies] fallback JSON parse error:', e.message, 'file=', fallback);
        return [];
      }
    }
    console.warn('[quickReplies] quickReplies.json not found for tenant=', tenantKey);
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {
    console.warn('[quickReplies] JSON parse error:', e.message, 'file=', file);
    return [];
  }
}

function renderQuickReplyMessage(tpl) {
  // 同時支援兩種 flex 路徑深度
  const buildQuickReplyPath = firstExistingPath([
    path.resolve(__dirname, '../flex/quickReply.js'),
    path.resolve(__dirname, '../../flex/quickReply.js'),
  ]);

  const buildQuickReplyPostbackPath = firstExistingPath([
    path.resolve(__dirname, '../flex/utils/quickReplyPostback.js'),
    path.resolve(__dirname, '../../flex/utils/quickReplyPostback.js'),
  ]);

  if (!buildQuickReplyPath || !buildQuickReplyPostbackPath) {
    console.warn('[quickReplies] flex builders not found',
      { buildQuickReplyPath, buildQuickReplyPostbackPath });
    return { type: 'text', text: tpl?.keyword || '請選擇', quickReply: undefined };
  }

  // 用 require 動態載入（避免相對路徑出錯）
  const buildQuickReply = require(buildQuickReplyPath);
  const buildQuickReplyPostback = require(buildQuickReplyPostbackPath);

  if (tpl?.template === 'quickReplyPostback') {
    return buildQuickReplyPostback({
      text: `${tpl.keyword}：請選擇 👇`,
      items: tpl.items
    });
  }
  return buildQuickReply(tpl.items); // 舊格式：支援 message/uri
}

module.exports = { loadQuickReplies, renderQuickReplyMessage };
