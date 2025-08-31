// infra/richmenuLinker.js
//richmenuLinker 已經會自動把 ${tenantKey}_${alias} 組起來（例如 jieyou_tab2），所以 defaults 回傳的 alias 要用「短字」（'primary'、'tab2'），不要包含租戶前綴
const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: f }) => f(...args)));

function api(path, init, token) {
  const base = (path.includes('/richmenu/') && path.endsWith('/content'))
    ? 'https://api-data.line.me'
    : 'https://api.line.me';
  return fetch(base + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers || {}) },
  });
}

/** 由 alias 取得 richMenuId（例：ruma_primary） */
async function resolveAliasToId(alias, token) {
  const r = await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'GET' }, token);
  const txt = await r.text();
  if (!r.ok) throw new Error(`[resolveAliasToId] ${r.status} ${txt}`);
  return JSON.parse(txt).richMenuId;
}

/** 綁定指定 richMenuId 給某位 user */
async function linkMenuToUser(userId, richMenuId, token) {
  const r = await api(`/v2/bot/user/${userId}/richmenu/${richMenuId}`, { method: 'POST' }, token);
  const txt = await r.text();
  if (!r.ok) throw new Error(`[linkMenuToUser] ${r.status} ${txt}`);
  return true;
}

/** 以租戶預設 alias 綁定（例：ruma_primary） */
async function linkDefaultByTenantAlias(userId, tenantKey, token, alias = 'primary') {
  const full = `${tenantKey}_${alias}`; // 和 deploy 綁 alias 的規則一致
  const id = await resolveAliasToId(full, token);
  await linkMenuToUser(userId, id, token);
  return id;
}

module.exports = { resolveAliasToId, linkMenuToUser, linkDefaultByTenantAlias };
