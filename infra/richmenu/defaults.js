require('dotenv').config();

/**
 * 取得租戶在 follow 當下要綁定的「短 alias」
 * 規則：
 * 1) 優先讀環境變數：TENANT_<key>_DEFAULT_ALIAS（短字，如 'primary' 或 'tab2'）
 * 2) 否則回傳內建表 DEFAULT_ALIAS_BY_TENANT[key]
 * 3) 都沒有就回 'tab1'
 *
 * 為什麼要短 alias？因為 linkDefaultByTenantAlias 會自動組成 `${tenantKey}_${alias}` → 'jieyou_tab2'
 */
function getDefaultAliasForTenant(tenantKey) {
  const envKey = `TENANT_${tenantKey}_DEFAULT_ALIAS`;
  const override = (process.env[envKey] || '').trim();
  if (override) return override; // 例如 'tab2' / 'primary'

  const DEFAULT_ALIAS_BY_TENANT = {
    ruma: 'primary', // 櫓榪：你的主分頁叫 primary
    jieyou: 'tab2',  // 解憂：預設想停在服務分頁
  };
  return DEFAULT_ALIAS_BY_TENANT[tenantKey] || 'tab1';
}

/**
 * 取得租戶的歡迎訊息
 * 規則同上：可用 TENANT_<key>_WELCOME 覆蓋
 */
function getWelcomeForTenant(tenantKey) {
  const envKey = `TENANT_${tenantKey}_WELCOME`;
  const override = (process.env[envKey] || '').trim();
  if (override) return override;

  const WELCOME_BY_TENANT = {
    ruma: "歡迎加入櫓榪竹工作室！請點擊下方圖文選單開始探索。",
    jieyou: "歡迎加入解憂工程所！請點擊下方圖文選單查看服務與案例。",
  };
  return WELCOME_BY_TENANT[tenantKey] || "歡迎加入！下方為功能選單。";
}

module.exports = { getDefaultAliasForTenant, getWelcomeForTenant };
