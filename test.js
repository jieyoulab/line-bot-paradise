//把 demo 的 parser 與 queue 相關程式移除，改為在事件處理時先讓 demo 模組嘗試處理；如果 demo 回傳 false，再跑你原本的商務邏輯（方案卡片等）
require("dotenv").config();
const express = require("express");
const { Client, middleware } = require("@line/bot-sdk");
const { initDB, getAllChannels } = require("./db");
// ❶ 引入 demo 模組（取代你原本內嵌的 parser/queue）
const { handleDemoEvent } = require('./demo');
const bodyParser = require("body-parser");


//Carousel為主 比較好擴充(Carousel 中可以有多個Bubble卡片)
const plansMenuCarousel   = require("./flex/carousel/plansMenuCarousel");

//Bubble 基礎方案
const basicOverviewBubble = require("./flex/basicOverviewBubble");
const basicDetailBubble = require("./flex/basicDetailBubble");

//Bubble 進階方案
const proOverviewBubble = require("./flex/proOverviewBubble");
const proDetailBubble   = require("./flex/proDetailBubble"); 

// 模組：首次加入好友：（品牌卡片 → 文字歡迎 → 快速導引需求選單）三連發所需模組
const welcomeBrandBubble  = require("./flex/welcomeBrandBubble"); //品牌slogan
const buildWelcomeText    = require("./flex/messages/welcomeText");//加入好友文字訊息
const needsVerticalBubble = require("./flex/needsVerticalBubble");//首次加入好友快速導引需求

const app = express();

//LINE 的 SDK middleware 會自己解析 req.body 並驗證簽章
//別在全域 app.use(express.json())，避免影響 /webhook 的簽章驗證；若有自訂 API 再針對單一路由掛上 express.json()
//app.use(express.json()); // 不需要，middleware 已處理

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};


const client = new Client(config);


/* -------------------- Human Mode（真人客服） -------------------- */
// 用戶按「聯絡我們」→ 開啟 human mode；期間 Bot 不自動回覆文字；
// 用戶按「結束客服」→ 關閉 human mode，Bot 恢復回覆。
const HUMAN_TTL_MS = 12 * 60 * 60 * 1000; // 12 小時（可自行調整）
const humanMap = new Map();                // userId -> expireAt(ms)

function enableHuman(userId, hours = 12) {
  const ttl = (Number.isFinite(hours) ? hours : HUMAN_TTL_MS / 3600000) * 3600 * 1000;
  humanMap.set(userId, Date.now() + ttl);
}
function disableHuman(userId) {
  humanMap.delete(userId);
}
function isHuman(userId) {
  const exp = humanMap.get(userId);
  if (!exp) return false;
  if (Date.now() > exp) {
    humanMap.delete(userId); // 逾時自動清掉
    return false;
  }
  return true;
}

// 存放多個 client
let lineClients = [];

// 初始化 client（從 DB 撈所有 channel）
async function initClients() {
  await initDB(); // 先初始化資料庫
  const channels = await getAllChannels();
  lineClients = channels.map(ch => ({
    channelId: ch.channel_id,
    client: new Client({
      channelAccessToken: ch.access_token,
      channelSecret: ch.channel_secret,
    }),
  }));
  console.log(`已初始化 ${lineClients.length} 個 LINE Channel`);
}

// 取得對應 client
function getClientByChannel(channelId) {
  const found = lineClients.find(c => c.channelId === channelId);
  return found?.client;
}

// 動態 middleware：因為每個 channel secret 不同
function lineMiddleware(req, res, next) {
  const channelId = req.params.channelId; // <- 從 URL path

  const clientInfo = lineClients.find(c => c.channelId === channelId);
  if (!clientInfo) {
    console.error('找不到對應 channel middleware', channelId);
    return res.status(400).send('Channel not found');
  }
  // 使用 line SDK middleware 驗簽
  const mw = middleware({ channelSecret: clientInfo.client.config.channelSecret });
  return mw(req, res, next);
}

/* -------------------------------------------------------------- */

//API 區
// 首頁 
// health check
// 建議加個極輕量的健康檢查
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Webhook route（單一路由，支援多 channel）
// webhook 接收與處理 ==> 就像一個「總路由器 (router)」
app.post("/webhook/:channelId", bodyParser.raw({ type: 'application/json' }), lineMiddleware, async (req, res) => {
  // req.body 是 Buffer，需要先 parse
  let body;
  try {
    if (Buffer.isBuffer(req.body)) {
      body = JSON.parse(req.body.toString('utf8'));
    } else {
      // 如果 middleware 已經 parse 過，直接用物件
      body = req.body;
    }
  } catch (err) {
    console.error("JSON 解析失敗", err, "req.body:", req.body);
    return res.status(400).send("Invalid JSON");
  }

  console.log("收到 webhook:", body);

  // 加入這段處理 LINE 的空事件驗證請求
  if (!body.events || body.events.length === 0) {
    return res.status(200).send("OK (ping check)");
  }

  const channelId = req.params.channelId;
  const client = getClientByChannel(channelId);
  if (!client) {
    console.error('找不到對應 client', channelId);
    return res.status(400).send("Channel not found");
  }

  try {
    await Promise.all(body.events.map(event => handleEvent(event, client)));
    res.sendStatus(200);
  } catch (err) {
    console.error("webhook error", err);
    res.status(500).end();
  }
});


// --- handlers ---
// 回覆邏輯
async function handleEvent(event, client) {
  //  A) 先給 demo 模組嘗試處理
  const isDemoHandled = await handleDemoEvent(event, client);
  if (isDemoHandled) return; // demo 已處理，結束

  // B) 好友加入（或解除封鎖後再加入）→ 三連發
  if (event.type === "follow") {
    return handleFollow(event, client);
  }

  //C) Postback 分流
  // 1) 先處理 postback（不顯示文字、切換卡片）
  // Postback
  if (event.type === "postback") {
    const data = event.postback.data || "";
    console.log("POSTBACK:", data); 
    const p = new URLSearchParams(data);
    const action = p.get("action");
    const need   = p.get("need"); //剛加入好友，快速導引需求
    const plan = p.get("plan");

    const userId = event.source?.userId;

    // ✅ human mode 中時，只允許「結束客服」操作，其餘 postback 忽略
    if (userId && isHuman(userId) && action !== "resume_bot") {
      return Promise.resolve(null);
    }
      // 保險：demo 相關一律交給 demo 模組
  //   if (action === "case_demo" || action === "query_land") {
  //     const handled = await handleDemoEvent(event, client);
  //     if (handled) return;
  //     await client.replyMessage(event.replyToken, { type: "text", text: "DEMO 僅限特定商家內測🙏" });
  //     return;
  // }
    // ❶ 轉真人客服：Rich Menu「聯絡我們」→ 開啟 human mode
    if (action === "contact_us") {
      if (userId) enableHuman(userId, 8); // 預設 12 小時

      // （可選）通知內部群組
      if (process.env.GROUP_ID) {
        const nickname = await getDisplayNameSafe(event, client);
        await client.pushMessage(process.env.GROUP_ID, {
          type: "text",
          text: `🔔 ${nickname} 請求真人客服（已切換 human mode）`
        });
      }

      return client.replyMessage(event.replyToken, [
        { type: "text", text: "已為您轉接真人客服，請直接在此對話告訴我們需求（我們的夥伴會盡快回覆您）。" },
        {
          type: "flex",
          altText: "您已轉接真人客服",
          contents: {
            type: "bubble",
            body: {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                { type: "text", text: "🧑‍💻 真人客服中", weight: "bold", size: "lg" },
                { type: "text", text: "若要回到機器人服務，請點下方按鈕。", size: "sm", color: "#666666", wrap: true }
              ]
            },
            footer: {
              type: "box",
              layout: "vertical",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  action: { type: "postback", label: "結束客服，回到機器人", data: "action=resume_bot", displayText: "結束客服" }
                }
              ]
            }
          }
        }
      ]);
    }

    // ❷ 結束真人客服：恢復機器人
    if (action === "resume_bot") {
      if (userId) disableHuman(userId);

      return client.replyMessage(event.replyToken, [
        { type: "text", text: "已結束真人客服，恢復機器人服務 🙌" },
        { type: "flex", altText: "回到主選單", contents: plansMenuCarousel }
      ]);
    }


    // ①快速導引需求 need => 需求入口（新做的直式選單）
    if (action === "need") {
      if (need === "startup") {
        // 導到你既有的 LINE 方案總覽
        return client.replyMessage(event.replyToken, {
          type: "flex",
          altText: "LINE 官方帳號建置",
          contents: plansMenuCarousel
        });
      }
      if (need === "automation") {
        return client.replyMessage(event.replyToken, [
          { type: "text", text: "了解！我們可先初步討論目前貴公司繁瑣工作流程的痛點，將提供不同成本方案來導入流程自動化。" },
          { type: "text", text: "若方便，請先填寫需求表單，我們將盡快與您聯繫：\nhttps://docs.google.com/forms/d/e/1FAIpQLSdIWw7vChsH5jhvUPhjmOLotBqqwqu8zcoZJEc80zek_t-ARw/viewform" }
        ]);
      }
      if (need === "web_maintenance") {
        return client.replyMessage(event.replyToken, [
          { type: "text", text: "OK！我們支援您現有網站的維護與升級。" },
          { type: "text", text: "請提供目前網站連結與想改善的重點:\nhttps://docs.google.com/forms/d/e/1FAIpQLSdIWw7vChsH5jhvUPhjmOLotBqqwqu8zcoZJEc80zek_t-ARw/viewform🙏" }
        ]);
      }
      return Promise.resolve(null);
    }

    //方案列表（兩張總覽）
    if (action === 'line_oa_build') {
        return client.replyMessage(event.replyToken, {
          type: "flex",
          altText: "LINE 官方帳號建置",
          contents: plansMenuCarousel
        });
      }


    // 基礎方案
    if (plan === "basic") {
      if (action === "view_plan") {
        return client.replyMessage(event.replyToken, {
          type: "flex",
          altText: "🌱 基礎方案（內容明細）",
          contents: basicDetailBubble
        });
      }
      if (action === "view_plan_overview") {
        return client.replyMessage(event.replyToken, {
          type: "flex",
          altText: "🌱  基礎方案（總覽）",
          contents: basicOverviewBubble
        });
      }
    }

    // ★ 進階方案 postback
    if (plan === "pro") {
        if (action === "view_plan") {
          return client.replyMessage(event.replyToken, {
            type: "flex",
            altText: "🔄 進階方案（內容明細）",
            contents: proDetailBubble
          });
        }
        if (action === "view_plan_overview") {
          return client.replyMessage(event.replyToken, {
            type: "flex",
            altText: "🔄 進階方案（總覽）",
            contents: proOverviewBubble
          });
        }
      }
    // 其他未定義的 postback 就先忽略
    return Promise.resolve(null);
  }

  // 2) 再處理文字訊息（給你測試或接圖文選單「傳送訊息」）
  // D) 文字訊息（可手動觸發或接圖文選單「傳送訊息」）
  if (event.type === "message" && event.message.type === "text") {
    const userId = event.source?.userId;

    // ✅ human mode 中：不回覆文字（讓真人直接在後台回覆）
    if (userId && isHuman(userId)) {
      return Promise.resolve(null);
    }

    const msg = event.message.text || ""
    const lower = msg.toLowerCase();
    const trimmed = msg.trim();


    // 手動觸發三連發（中英都支援）
    // if (["hi", "hello", "start"].includes(lower) || ["開始", "歡迎"].includes(trimmed)) {
    //   return handleFollow(event, client);
    // }

    // 固定關鍵字
    if (trimmed === "LINE 官方帳號建置") {
      return client.replyMessage(event.replyToken, {
        type: "flex",
        altText: "LINE 官方帳號建置",
        contents: plansMenuCarousel
      });
    }

    // 沒匹配到
    return Promise.resolve(null);
  }
}
// ＝＝＝＝ Welcome Flow ＝＝＝＝

async function handleFollow(event, client) {
  const nickname = await getDisplayNameSafe(event, client);
  const accountName = process.env.ACCOUNT_NAME || "解憂工程";

  const messages = [
    // Step 1: 品牌卡片（Flex）
    {
      type: "flex",
      altText: "歡迎加入解憂工程所",
      contents: welcomeBrandBubble
    },
    // Step 2: 文字歡迎（帶暱稱）
    buildWelcomeText({ nickname, accountName }),
    // Step 3: 直式需求選單（Flex）
    {
      type: "flex",
      altText: "需求導引選單",
      contents: needsVerticalBubble
    }
  ];

  return client.replyMessage(event.replyToken, messages);
}

async function getDisplayNameSafe(event, client) {
  try {
    if (event.source && event.source.userId) {
      const profile = await client.getProfile(event.source.userId);
      return profile.displayName || "朋友";
    }
    return "朋友";
  } catch {
    return "朋友";
  }
}


// 啟動 server
initClients().then(() => {
  const port = process.env.PORT || 3006;
  app.listen(port, () => console.log(`Server running on port ${port}`));
});
