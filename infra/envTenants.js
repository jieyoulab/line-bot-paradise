// infra/envTenants.js

// 從 .env 載入租戶清單
// 到時候要整入到 DB ⇒ 之後把本檔改成查 DB 的 getTenantByChannelId()/listTenants()/getTenantByKey() 即可，其他檔案不用動

/** TENANTS → registry → getTenant
 * 多租戶（multi-tenant）LINE Bot 設定管理：
 * - 從 .env 讀取租戶清單與各租戶的 LINE Channel 設定
 * - 整理成 list（陣列）與 byId（Map，key=channelId）
 * - 提供工具：
 *   - getTenantByChannelId(channelId) → 依 channelId 取租戶
 *   - getTenantByKey(key) → 依自訂租戶 key 取租戶（e.g. 'ruma'）
 *   - listTenants() → 所有租戶清單
 */

// 從 .env 載入租戶 (tenant) 設定，建立 { byId: Map<channelId, tenant>, list: Tenant[] }
function loadTenantsFromEnv() {
  // 從環境變數 TENANTS 讀取租戶 key 列表（以逗號分隔）
  // 例如 TENANTS=ruma,jieyou
  const list = (process.env.TENANTS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // 根據每個租戶 key，組出對應的 LINE 設定
  const tenants = list.map(key => ({
    key, // 租戶識別字（自訂，例如 ruma）
    channelId: process.env[`TENANT_${key}_CHANNEL_ID`],           // 該租戶的 LINE Channel ID
    channelSecret: process.env[`TENANT_${key}_CHANNEL_SECRET`],   // 該租戶的 Channel Secret
    channelAccessToken: process.env[`TENANT_${key}_CHANNEL_TOKEN`]// 該租戶的 Access Token
  }))
  // 過濾掉缺少必要資訊的租戶，確保只有完整設定的才保留
  .filter(t => t.channelId && t.channelSecret && t.channelAccessToken);

  // 建立 Map：以 channelId 為 key，可以快速找到對應租戶設定
  const byId = new Map(tenants.map(t => [t.channelId, t]));

  return { list: tenants, byId };
}

// 載入一次，建立全域的租戶註冊表
const registry = loadTenantsFromEnv();

// 根據 channelId 找到對應的租戶設定（LINE Webhook 會用到）
function getTenantByChannelId(channelId) {
  return registry.byId.get(channelId);
}

// 依租戶 key 取設定（部署 richmenu、後台管理常用）
function getTenantByKey(key) {
  return registry.list.find(t => t.key === key);
}

// 取得所有租戶清單（後台頁面/排錯方便）
function listTenants() {
  return registry.list;
}

module.exports = { getTenantByChannelId, getTenantByKey, listTenants };
