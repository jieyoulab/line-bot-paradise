
// infra/envTenants.js
'use strict';

/**
 * .env 需求範例：
 *   TENANTS=ruma,jieyou
 *   TENANT_ruma_CHANNEL_ID=2007985128
 *   TENANT_ruma_CHANNEL_SECRET=xxxxxxxx
 *   TENANT_ruma_CHANNEL_TOKEN=xxxxxxxx
 *   TENANT_jieyou_CHANNEL_ID=1234567890
 *   TENANT_jieyou_CHANNEL_SECRET=yyyyyyyy
 *   TENANT_jieyou_CHANNEL_TOKEN=yyyyyyyy
 */

// 1) 載入 .env（避免載入順序問題）
try { require('dotenv').config(); } catch { /* ignore */ }

// 小工具：將輸入值安全轉為去除前後空白的字串
const normalize = (x) => String(x ?? '').trim();

/**
 * 從環境變數建立租戶註冊表
 * 回傳：
 *   {
 *     list: Tenant[],                     // [{ key, channelId, channelSecret, channelAccessToken }, ...]
 *     byId:  Map<channelId, Tenant>,      // 以 channelId 為 key 的 Map
 *     byKey: Map<key, Tenant>,            // 以 key 為 key 的 Map
 *   }
 */
function buildRegistryFromEnv() {
  // 從環境變數 TENANTS 讀取租戶 key 列表（以逗號分隔）
  // 例如：TENANTS=ruma,jieyou
  const keys = (process.env.TENANTS || '')
    .split(',')
    .map(normalize)
    .filter(Boolean);

  // 組出每個租戶的 LINE 設定
  const list = keys.map((key) => {
    const channelId         = normalize(process.env[`TENANT_${key}_CHANNEL_ID`]);
    const channelSecret     = normalize(process.env[`TENANT_${key}_CHANNEL_SECRET`]);
    const channelAccessToken= normalize(process.env[`TENANT_${key}_CHANNEL_TOKEN`]);

    return { key, channelId, channelSecret, channelAccessToken };
  }).filter(t => t.channelId && t.channelSecret && t.channelAccessToken);

  // 建立查找用 Map（都走 normalize，避免空白/型別差異）
  const byId  = new Map(list.map(t => [normalize(t.channelId), t]));
  const byKey = new Map(list.map(t => [normalize(t.key),       t]));

  // 簡單提示（可改用你的 logger）
  if (list.length === 0) {
    console.warn('[tenants] 未載入任何租戶設定，請確認 TENANTS 與對應變數是否正確');
  } else {
    console.info(`[tenants] 載入 ${list.length} 個租戶 → keys: ${list.map(t => t.key).join(', ')}`);
  }

  return { list, byId, byKey };
}

// === 初始化一次（若需熱重載可呼叫 reloadTenants）===
let registry = buildRegistryFromEnv();

/** 重新載入環境變數的租戶設定（熱重載） */
function reloadTenants() {
  registry = buildRegistryFromEnv();
  return registry.list;
}

/**
 * 依「Channel ID 或租戶 key」取得租戶
 * - 支援傳入數字/字串（會做 normalize）
 * - 你可以在路由寫 getTenantByChannelId(req.params.channelId)，
 *   同時支援 `/webhook/2007985128` 或 `/webhook/ruma`
 */
function getTenantByChannelId(idOrKey) {
  const x = normalize(idOrKey);
  return registry.byId.get(x) || registry.byKey.get(x) || undefined;
}

/** 依租戶 key 取得租戶（等同於 registry.byKey.get(key)） */
function getTenantByKey(key) {
  return registry.byKey.get(normalize(key));
}

/** 列出所有租戶（回傳淺拷貝避免外部修改） */
function listTenants() {
  return registry.list.slice();
}

module.exports = {
  getTenantByChannelId,
  getTenantByKey,
  listTenants,
  reloadTenants,
};

// // infra/envTenants.js
// // infra/envTenants.js
// 'use strict';

// // 1) 載入 .env（避免載入順序問題）
// try { require('dotenv').config(); } catch { /* ignore */ }
// /**
//  * .env 需求範例：
//  *   TENANTS=ruma,jieyou
//  *   TENANT_ruma_CHANNEL_ID=2007985128
//  *   TENANT_ruma_CHANNEL_SECRET=xxxxxxxx
//  *   TENANT_ruma_CHANNEL_TOKEN=xxxxxxxx
//  *   TENANT_jieyou_CHANNEL_ID=1234567890
//  *   TENANT_jieyou_CHANNEL_SECRET=yyyyyyyy
//  *   TENANT_jieyou_CHANNEL_TOKEN=yyyyyyyy
//  */
// // 從 .env 載入租戶清單
// // 到時候要整入到 DB ⇒ 之後把本檔改成查 DB 的 getTenantByChannelId()/listTenants()/getTenantByKey() 即可，其他檔案不用動

// /** TENANTS → registry → getTenant
//  * 多租戶（multi-tenant）LINE Bot 設定管理：
//  * - 從 .env 讀取租戶清單與各租戶的 LINE Channel 設定
//  * - 整理成 list（陣列）與 byId（Map，key=channelId）
//  * - 提供工具：
//  *   - getTenantByChannelId(channelId) → 依 channelId 取租戶
//  *   - getTenantByKey(key) → 依自訂租戶 key 取租戶（e.g. 'ruma'）
//  *   - listTenants() → 所有租戶清單
//  */

// // 從 .env 載入租戶 (tenant) 設定，建立 { byId: Map<channelId, tenant>, list: Tenant[] }
// function loadTenantsFromEnv() {
//   // 從環境變數 TENANTS 讀取租戶 key 列表（以逗號分隔）
//   // 例如 TENANTS=ruma,jieyou
//   const list = (process.env.TENANTS || '')
//     .split(',')
//     .map(s => s.trim())
//     .filter(Boolean);

//   // 根據每個租戶 key，組出對應的 LINE 設定
//   const tenants = list.map(key => ({
//     key, // 租戶識別字（自訂，例如 ruma）
//     channelId: process.env[`TENANT_${key}_CHANNEL_ID`],           // 該租戶的 LINE Channel ID
//     channelSecret: process.env[`TENANT_${key}_CHANNEL_SECRET`],   // 該租戶的 Channel Secret
//     channelAccessToken: process.env[`TENANT_${key}_CHANNEL_TOKEN`]// 該租戶的 Access Token
//   }))
//   // 過濾掉缺少必要資訊的租戶，確保只有完整設定的才保留
//   .filter(t => t.channelId && t.channelSecret && t.channelAccessToken);

//   // 建立 Map：以 channelId 為 key，可以快速找到對應租戶設定
//   const byId = new Map(tenants.map(t => [t.channelId, t]));

//   return { list: tenants, byId };
// }

// // 載入一次，建立全域的租戶註冊表
// const registry = loadTenantsFromEnv();

// // 根據 channelId 找到對應的租戶設定（LINE Webhook 會用到）
// function getTenantByChannelId(channelId) {
//   return registry.byId.get(channelId);
// }

// // 依租戶 key 取設定（部署 richmenu、後台管理常用）
// function getTenantByKey(key) {
//   return registry.list.find(t => t.key === key);
// }

// // 取得所有租戶清單（後台頁面/排錯方便）
// function listTenants() {
//   return registry.list;
// }

// module.exports = { getTenantByChannelId, getTenantByKey, listTenants };
