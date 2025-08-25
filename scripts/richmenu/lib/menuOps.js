// scripts/richmenu/lib/menuOps.js

const { api, readImageAsBuffer } = require('./lineApi');

// LINE Rich Menu 固定尺寸
const SIZE = { width: 2500, height: 1686 };

// 小工具：sleep
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * 等待 Rich Menu 建立完成（避免剛建好就查不到 404）
 * - 會以 GET /v2/bot/richmenu/{id} 輪詢
 */
async function waitUntilExists(id, token, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      await api(`/v2/bot/richmenu/${id}`, { method: 'GET' }, token);
      return; // 成功表示存在
    } catch (e) {
      const is404 = String(e.message).includes('404');
      const wait = 500 + i * 1500; // 遞增等待
      if (!is404 && i >= 2) throw e; // 非 404 連續多次就丟出
      await sleep(wait);
    }
  }
  throw new Error(`richmenu ${id} still 404`);
}

/**
 * 上傳 Rich Menu 圖片（帶重試，因為建立後短暫時間可能 404）
 */
async function uploadImageWithRetry(id, imagePath, token, tries = 8) {
  const buf = readImageAsBuffer(imagePath);
  for (let i = 0; i < tries; i++) {
    try {
      await api(`/v2/bot/richmenu/${id}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': String(buf.length),
        },
        body: buf,
      }, token);
      return; // 成功
    } catch (e) {
      if (String(e.message).includes('404') && i < tries - 1) {
        await sleep(800 + i * 2000);
        continue;
      }
      throw e;
    }
  }
}

/**
 * 建立 Rich Menu（JSON 結構 → 等待可查詢 → 上傳圖片）
 * @returns {Promise<string>} richMenuId
 */
async function createMenu({ name, areas, imagePath }, token) {
  const created = await api('/v2/bot/richmenu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      size: SIZE,
      selected: true,
      name,
      chatBarText: '功能選單',
      areas,
    }),
  }, token);

  const id = created.json?.richMenuId;
  if (!id) throw new Error(`No richMenuId for ${name}`);

  await waitUntilExists(id, token);
  await uploadImageWithRetry(id, imagePath, token);

  return id;
}

/**
 * 綁定（或更新）Rich Menu 別名（alias）
 * - 若 alias 已存在且指向不同 id：先刪除再建立
 */
async function setAlias(id, alias, token) {
  try {
    const got = await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'GET' }, token);
    const cur = got.json?.richMenuId;
    if (cur === id) return; // 已是正確綁定
    if (cur) await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'DELETE' }, token);
  } catch (e) {
    if (!String(e.message).includes('404')) throw e; // 404 表示 alias 不存在，無需刪除
  }

  await api('/v2/bot/richmenu/alias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ richMenuAliasId: alias, richMenuId: id }),
  }, token);
}

/**
 * 設為所有使用者的預設 Rich Menu
 */
async function setDefault(id, token) {
  await api(`/v2/bot/user/all/richmenu/${id}`, { method: 'POST' }, token);
}

module.exports = { createMenu, setAlias, setDefault };
