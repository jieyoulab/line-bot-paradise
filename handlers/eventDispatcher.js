// handlers/eventDispatcher.js
// Line 事件分派器（dispatcher）— Phase 2：只辨識事件型別，不接手處理（全部回 false）
//
// 任務：它的工作就是看 event.type，把各主事件轉送到對應的 handler；
// ＝> 每個 handler 都應該回 Promise<boolean>（true = 已處理，外層就不再處理）
// 目前階段：先不導到任何 handler，行為維持不變。

//除錯
const makeLogger = require('../utils/logger');
const logger = makeLogger('handlers/eventDispatcher');

// （預留：Phase 3 以後才會打開這些 require）
const handleMessage  = require('./message');
// 🔑 用解構把具名輸出取進來
const { handlePostback } = require('./postback');
// const handleFollow   = require('./follow');
// const handleMember   = require('./member');

// ★ 新增：follow 當下就綁定 richmenu（個人綁定，繞過客戶端同步延遲）
const { linkDefaultByTenantAlias } = require('../infra/richmenuLinker');
module.exports = async function eventDispatcher(event, client, tenant) {
  logger.info('事件分派器', { type: event.type, src: event?.source?.type, tenant: tenant?.key });
    // 可選：開 DEBUG 觀察事件型別，但不改行為
  if (process.env.DEBUG_EVENTS === '1') {
    const srcType = event?.source?.type || '-';
    console.log('[dispatcher]  事件分派器=%s src=%s tenant=%s', event.type, srcType, tenant?.key);
  }
  
  //這裡的event.type是LINE 在webhook所提供的事件總覽
  //
  switch (event.type) {
    case 'message': //使用者訊息
      // Phase 2：先不處理，回 false 讓既有 routes 分支繼續跑
      return handleMessage(event, client, tenant);;

    //點選postback action發生對應動作(很常用)
    case 'postback':
      //return false;
      // 交給 postback 總入口（具名輸出）
      return handlePostback({ event, client, tenant });


    //加好友 或 封鎖
    case 'follow': {
      // 使用者加入好友
      try {
        const userId = event?.source?.userId;
        if (!userId) return false;
        if (!tenant) return false; // 多租戶：沒有租戶就不處理

        // 綁定當前租戶預設 alias：目前你是 'primary'
        const menuId = await linkDefaultByTenantAlias(
          userId,
          tenant.key,
          tenant.channelAccessToken,
          'primary'
        );
        logger.info('follow linked richmenu', { userId, menuId, tenant: tenant.key });

        // 可回一則歡迎訊息，提示使用者展開
        await client.replyMessage(event.replyToken, [
          { type: 'text', text: "歡迎加入Ruma'工作室！請點擊下方圖文選單來認識我們吧 ✅" },
        ]);

        return true; // 已處理
      } catch (err) {
        logger.error('follow link richmenu failed', { error: String(err) });
        // 失敗也不擋住流程
        return false;
      }
    }
    case 'unfollow':
      return false;

    //遷入或移出群組
    case 'join':
    case 'leave':
    //群組成員異動
    case 'memberJoined':
    case 'memberLeft':
      return false;
    //進出beacon範圍
    case 'beacon':
    //帳號連結或解除
    case 'accountLink':
    //影片觀看完成
    case 'videoPlayComplete':
    case 'unsend': //撤回訊息
    //會員相關事件
    case 'membership':
      return false;

    default:
      // 未知事件：也不處理
      return false;
  }
}