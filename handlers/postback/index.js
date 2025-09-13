// handlers/postback/index.js
// # 單一入口：解析 action → 查表 → 執行 handler
//入口只做三件事：parse → lookup → execute。未知 action 走 __default__
// handlers/postback/index.js
// 單一入口：解析 action → 依 tenant 取對應 handler → 執行

const { getPostbackHandlers } = require('./postbackRegistry');
// const { parseData } = require('./utils/parseData');


// 支援物件 / JSON 字串 / querystring
function parseData(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  const s = String(raw).trim();
  if (s.startsWith('{') || s.startsWith('[')) { try { return JSON.parse(s); } catch {} }
  const qs = new URLSearchParams(s);
  return Object.fromEntries(qs.entries());
}



async function handlePostback({ event, client, tenant }) {
  const tenantKey = (tenant?.key || 'default').toLowerCase();
  const raw = event?.postback?.data ?? '';
  const data = parseData(raw);
  const action = data?.action;

  console.debug('[postback] tenant=%s', tenantKey);
  console.debug('[postback] raw data=%s', typeof raw === 'object' ? JSON.stringify(raw) : raw);

  const handlers = getPostbackHandlers(tenantKey);
  console.debug('[postback] actions available=%s', Object.keys(handlers).join(','));

  const handler = (action && handlers[action]) || handlers.__default__;

  try {
    await handler({ event, client, tenant, data });
    return true;
  } catch (err) {
    console.error('[postback error]', { tenantKey, action, err });
    if (handlers.__default__ && handler !== handlers.__default__) {
      await handlers.__default__({ event, client, tenant, data });
    } else {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: `處理指令時發生錯誤：${action || '(空)'}`
      });
    }
    return true;
  }
}

module.exports = { handlePostback };
