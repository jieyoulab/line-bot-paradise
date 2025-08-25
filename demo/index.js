// demo/index.js
//要用後端鎖
//處理 demo postback 與 demo 文字輸入（丟 queue）
//這支只處理 demo：postback case_demo/query_land、文字輸入段地號 → 丟 queue。回覆訊息沿用你原本的內容
const { crawlQueue } = require('./queue');
const { parseSectionAndLandNo } = require('./parser');

// 記錄：按過 demo 入口（query_land）的人，之後文字才交給 demo
const demoReadyUsers = new Set();

// 可用白名單鎖 demo（可先不開）
function isDemoAllowed(userId) {
  if (process.env.DEMO_LOCK_ENABLED !== 'true') return true;
  const allow = (process.env.DEMO_ALLOWED_USER_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return allow.includes(userId);
}

/**
 * handleDemoEvent(event, client)
 * 回傳：
 *   - 若有處理（已回覆 / 已入列）：回傳 true
 *   - 若不是 demo 事件：回傳 false（交回主程式處理）
 */
async function handleDemoEvent(event, client) {
  const userId = event.source?.userId;
  console.log('[DEMO] event.type =', event.type, 'userId =', userId);
  // Demo 鎖（可先關閉：DEMO_LOCK_ENABLED=false）
  if (!isDemoAllowed(userId)) {
    console.log('[DEMO] blocked by DEMO_LOCK');
    // 若你希望直接略過 demo 而不是回覆，可回傳 false
    return false;
  }

  // 1) Postback（case_demo / query_land）
  if (event.type === 'postback') {
    const data = event.postback?.data || '';
    const p = new URLSearchParams(data);
    const action = p.get('action');

    // Demo 入口：顯示 Quick Reply
    if (action === 'case_demo') {
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '💬以下DEMO功能清單，請選擇：⤵️',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '「查詢圖資」',
                data: 'action=query_land',
                displayText: '查詢圖資'
              }
            },
            { type: 'action', action: { type: 'message', label: 'DEMO：服務二', text: '服務二' } },
            { type: 'action', action: { type: 'message', label: 'DEMO：服務三', text: '服務三' } },
          ]
        }
      });
      return true;
    }

    // 點「查詢圖資」→ 引導輸入
    if (action === 'query_land') {

      // 標記此使用者接下來的文字由 demo 接手
      //// 記錄此人進入 demo 文字模式
      if (userId) demoReadyUsers.add(userId);

      await client.replyMessage(event.replyToken, {
        type: 'text',
        text:
          `📢 目前只有：桃園市 復興區圖資查詢
          請輸入「地段 地號」，例如：
          ・美麗段 0000
          ・美麗段 0000-0000`
      });
      return true;
    }

    // 其他 postback 就視為非 demo
    return false;
  }

  // 2) 文字訊息：解析「段名 + 地號」→ enqueue
  //文字訊息：只有按過 query_land 的人才由 demo 處理
  if (event.type === 'message' && event.message?.type === 'text') {
    const msg = event.message.text || '';

    if (!userId || !demoReadyUsers.has(userId)) {
      // 尚未進入 demo 文字模式 → 放行給主程式（hi/開始 才會觸發三連發）
      return false;
    }

    const parsed = parseSectionAndLandNo(msg);

    if (!parsed) {
      // 這裡可以再提醒一次格式；提醒後仍由 demo 處理，故 return true
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '請輸入想查詢的地段地號格式：\n「大利段 0000」或「大利段0000-0000」'
      });
      return true; // demo 已處理
    }
    //if (!parsed) return false; // 不是 demo 指令，交回主程式

    const { section, landNo } = parsed;

    await crawlQueue.add('crawl-land-info', {
      city: '桃園市',
      district: '復興區',
      section,
      landNo,
      userId, // push 用
    });

    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `🔍已收到您的查詢：【${section} ${landNo}】，稍後回覆結果，請您耐心等候🔜🔜⤵️⤵️`
    });
    return true;
  }

  // 若你想在入列成功後就關閉 demo 接手，可解除註解下一行：
  //demoReadyUsers.delete(userId);

  // 非 demo 事件
  return false;
}

module.exports = { handleDemoEvent };