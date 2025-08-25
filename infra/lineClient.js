//依租戶產生/快取 Client
//流程：tenant → cache → Client
// 從 LINE 官方 SDK 匯入 Client 類別，用來建立 bot client
const { Client } = require('@line/bot-sdk');

// 用一個快取 Map 來存放已建立的 Client 實例
// key: tenant.channelId, value: 對應的 LINE Client 實例
const cache = new Map();

/**
 * 取得指定租戶 (tenant) 的 LINE Client
 * - 如果該 tenant 還沒有建立 client，就建立並放進 cache
 * - 如果已經建立過，就直接從 cache 取出，避免重複建立
 * 
 * @param {Object} tenant - 租戶資訊，需包含 channelId / channelSecret / channelAccessToken
 * @returns {Client} - 對應的 LINE Client 實例
 */
module.exports = function getClientFor(tenant) {
  if (!tenant) throw new Error('tenant required'); // 如果沒傳 tenant，就拋錯
  
  // 如果 cache 裡還沒有這個 channelId 的 client，就新建一個
  if (!cache.has(tenant.channelId)) {
    cache.set(
      tenant.channelId,
      new Client({
        channelAccessToken: tenant.channelAccessToken, // 必要的 token
        channelSecret: tenant.channelSecret,           // 必要的 secret
      })
    );
  }

  // 從快取拿出對應的 client
  return cache.get(tenant.channelId);
};


/**
 * 避免重複建立 Client 實例
每個 tenant 的 LINE Bot Client 只會建立一次，後續都直接從 cache 拿。

以 channelId 為 key 做快取
同一個租戶（channelId 相同）不會重複生成新的 client，節省資源。

輸出工廠函式
外部呼叫 getClientFor(tenant) 時，自動幫你處理快取 + 建立 Client。

👉 簡單來說：這段程式是 「多租戶 LINE Bot Client 工廠」，專門管理每個租戶的 Client 實例
 */