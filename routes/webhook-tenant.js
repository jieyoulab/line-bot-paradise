// routes/webhook-tenant.js
// 每個 Channel 自己驗簽（/webhook/:channelId）→ demo 先處理，沒處理再走商務
const express = require('express');
const { middleware } = require('@line/bot-sdk');
const { getTenantByChannelId } = require('../infra/envTenants'); // 從 .env 載入租戶
const getClientFor = require('../infra/lineClient');             // 依租戶快取 LINE Client

const router = express.Router();

// ⚠️ 不要在這裡加任何 body parser（middleware 需要 raw body 驗簽）
router.post('/:channelId',
  // (1) 由 :channelId 找租戶，並用該租戶的 secret 驗簽
  (req, res, next) => {
    const tenant = getTenantByChannelId(req.params.channelId);
    if (!tenant) return res.status(404).send('channel not found');
    req.tenant = tenant;

    // 用該租戶的 channelSecret 建立一次性的 middleware
    const mw = middleware({ channelSecret: tenant.channelSecret });

    // ✅ 重點：自己接 next(err)，簽章錯誤回 401，不要冒泡到全域 500
    return mw(req, res, (err) => {
      if (err) {
        req.log?.warn({ err, channelId: tenant.channelId, tenant: tenant.key }, 'LINE signature validation failed');
        return res.status(401).send('invalid signature');
      }
      next();
    });
  },

  // (2) 事件處理
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

        // 2) 預設商務邏輯
        if (event.type === 'message' && event.message?.type === 'text') {
          return safeReply(client, event.replyToken, {
            type: 'text',
            text: `(${tenant.key}) Echo: ${event.message.text}`,
          }, req);
        }

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

        // 其他事件先忽略
        return;
      } catch (err) {
        req.log?.error({ err, eventType: event?.type }, 'event handling failed');
      }
    }));

    res.status(200).end();
  }
);


function safeRequire(p) { try { return require(p); } catch { return null; } }

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
