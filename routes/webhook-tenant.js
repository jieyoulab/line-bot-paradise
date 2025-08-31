// routes/webhook-tenant.js
/**
 * 這支 routes/webhook-tenant.js 是「多租戶 LINE Webhook 入口」的路由。它負責：
 * A).依 URL 參數 :channelId 找到對應的租戶 (tenant)
 * B).用該租戶的 channelSecret 驗簽（防止偽造）
 * C).建立該租戶專屬的 LINE SDK client
 * D).逐一分派處理每個事件（先給 demo；再給正式的分派器；最後有各種 Fallback 以免沉默）
 * E).安全回覆（safeReply）並把錯誤、事件資訊記到 log，便於排查
 */

// 每個 Channel 自己驗簽（/webhook/:channelId）→ demo 先處理，沒處理再走商務
const express = require('express');
const { middleware } = require('@line/bot-sdk');
const { getTenantByChannelId } = require('../infra/envTenants'); // 從 .env 載入租戶
const getClientFor = require('../infra/lineClient'); 
 // 依租戶快取 LINE Client
// const { handleTextMessage } = require('../handlers/message/textHandler.js');           


//在 routes 掛上事件分派器
const eventDispatcher= require('../handlers/eventDispatcher.js');



const router = express.Router();

//A).依 URL 參數 :channelId 找到對應的租戶 (tenant)
// ⚠️ 不要在這裡加任何 body parser（middleware 需要 raw body 驗簽）
//WHY：@line/bot-sdk 的 middleware() 需要 原始 raw body 來做簽章驗證。若先被 JSON 解析器改寫，簽章會失效（出現 401）
router.post('/:channelId',
  // (1) 依 URL 參數 :channelId 找到對應的租戶 (tenant) 並用該租戶的 secret 驗簽
  //POST /:channelId 先依 :channelId 找租戶，動態建立一次性的 LINE middleware({ channelSecret }) 驗簽
  (req, res, next) => {
    const tenant = getTenantByChannelId(req.params.channelId);
    if (!tenant) return res.status(404).send('channel ID not found');
    req.tenant = tenant;

    // 用該租戶的 channelSecret 建立一次性的 middleware
    const mw = middleware({ channelSecret: tenant.channelSecret });

    // ✅ 重點：自己接 next(err)，簽章錯誤回 401，不要冒泡到全域 500
    return mw(req, res, (err) => {
      if (err) {
        req.log?.warn({ err, channelId: tenant.channelId, tenant: tenant.key }, 'LINE signature validation failed');
        return res.status(401).send('invalid signature');
      }
      //錯誤攔截：這裡自己接 next(err)，簽章錯誤回 401，不讓錯誤冒到全域 500。安全且好查
      next();
    });
  },

 // D).逐一分派處理每個事件（先給 demo；再給正式的分派器；最後有各種 Fallback 以免沉默）
  //
  // 立 Client、解析 events、逐一處理（demo → 分派器 → 各別 Fallback）
  // (2) 事件處理 用該租戶的 channelSecret 驗簽（防止偽造）
  async (req, res) => {
    const tenant = req.tenant;
    const client = getClientFor(tenant);
    const events = req.body?.events || [];

    // LINE 驗證 ping（空 events）
    if (!events.length) return res.status(200).send('OK');

    req.log?.info({ channelId: tenant.channelId, tenant: tenant.key, events: events.length }, 'incoming events');

    // 可能沒有 demo 模組，safeRequire 避免 require 失敗
    const { handleDemoEvent } = safeRequire('../demo') || {};

    await Promise.all(events.map(async (event) => {
      try {
        // 1) 先交給 demo 處理：demo 回 true 表示已處理，跳過後續商務邏輯
        if (typeof handleDemoEvent === 'function') {
          const done = await handleDemoEvent(event, client, tenant);
          if (done) return;
        }

        /**
         * 導入handlers/ eventDispatcher 事件分派器
         */
        // 1.5) // 先交給分派器試試（目前一定回 false，所以後面的既有邏輯照跑）
        //→ 這是一個封裝的事件分派器，負責判斷事件類型（message / postback / follow...）
        //→ 並丟給對應的 handler (handlers/messageHandler.js, handlers/postbackHandler.js 等
        const dispatched = await eventDispatcher(event, client, tenant);
        if (dispatched) return;

        // 2) 預設商務邏輯
        // if (event.type === 'message' && event.message?.type === 'text') {
        //   const handled = await handleTextMessage(event, client, tenant);
        //   if (handled) return; // 已處理就直接 return
        //   // 沒匹配到商品，再做預設回覆
        //   return safeReply(client, event.replyToken, {
        //     type: 'text',
        //     text: `(${tenant.key}) Echo: ${event.message.text}`,
        //   }, req);
        // }

        // Fallback（保留）：如果 postback 未被處理就回 echo
        if (event.type === 'postback') {
          return safeReply(client, event.replyToken, {
            type: 'text',
            text: `postback: ${event.postback?.data || ''}`,
          }, req);
        }

        if (event.type === 'follow') {
          return safeReply(client, event.replyToken, {
            type: 'text',
            text: `歡迎加入（${tenant.key}）！`,
          }, req);
        }

        // 4) ★ Fallback：若還沒被處理，且是文字訊息，就回 Echo，避免沉默
       if (event.replyToken && event.type === 'message' && event.message?.type === 'text') {
         return safeReply(client, event.replyToken, {
         type: 'text',
         text: `(${tenant.key}) Echo: ${event.message.text}`,
       }, req);
     }

        // 其他事件先忽略
        return;
      } catch (err) {
        req.log?.error({
          status: err?.statusCode || err?.originalError?.response?.status,
          message: err.message,
          data: err?.originalError?.response?.data,
          eventType: event?.type
        }, 'event handling failed');
      }
    }));

    res.status(200).end();
  }
);

//WHAT：安全地載入可選模組（例如 ../demo、或備援的 eventDispatcher）。

// HOW：失敗就回 null，不讓 require 例外把流程打爆。

// WHY：便於「可插拔」開發，不必保證 demo 檔案一定存在
function safeRequire(p) { try { return require(p); } catch { return null; } }

const handleEventDispatcher =
  safeRequire('../handlers/eventDispatcher') || (async () => false);

  //WHAT：包一層 client.replyMessage，把 SDK 失敗時的 LINE 回傳 body 打到 log。
  //LINE 4xx/5xx 的細節藏在 err.originalError.response.data，直接打出來最省時間排錯（例如 invalid reply token、message too long 等）
async function safeReply(client, replyToken, message, req) {
  try {
    const messages = Array.isArray(message) ? message : [message];
    return await client.replyMessage(replyToken, messages);
  } catch (err) {
    // SDK 失敗時把 LINE 回傳內容打出來（易排查）
    const cause = err?.originalError?.response?.data || err;
    req?.log?.error({ err: cause }, 'replyMessage failed');
  }
}

/* （可選）Upstash Redis 去重範例：避免重送事件重複處理
//7)（可選）Upstash Redis 去重樣板

WHAT：提供一段範例 alreadyProcessed(event, tenant)，用 SET NX EX 做 60 秒去重，避免 LINE 重送事件造成重覆處理。

WHY：LINE 有重送機制（網路不穩或超時），Idempotency 是實務必要。
// const redis = require('../infra/redis');
async function alreadyProcessed(event, tenant) {
  const id = event.message?.id || event.replyToken;
  if (!id) return false;
  const key = `evt:${tenant.key}:${id}`;
  try { return !(await redis.set(key, 1, { nx: true, ex: 60 })); } catch { return false; }
}
// 在每個事件開始時： if (await alreadyProcessed(event, tenant)) return;
*/

module.exports = router;
