// scripts/richmenu/lib/menuOps.js
const { api, readImageAsBuffer, guessContentType } = require('./lineApi');

// LINE Rich Menu 固定尺寸
const SIZE = { width: 2500, height: 1686 };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** 驗證熱區座標是否在 2500×1686 範圍內 */
function validateAreas(areas) {
  if (!Array.isArray(areas) || areas.length === 0)
    throw new Error('areas 必須是非空陣列');

  for (const [i, a] of areas.entries()) {
    if (!a.bounds) throw new Error(`areas[${i}] 缺少 bounds`);
    const { x, y, width, height } = a.bounds;
    const ok = Number.isFinite(x) && Number.isFinite(y) &&
               Number.isFinite(width) && Number.isFinite(height) &&
               x >= 0 && y >= 0 &&
               width > 0 && height > 0 &&
               (x + width) <= SIZE.width &&
               (y + height) <= SIZE.height;
    if (!ok) {
      throw new Error(`areas[${i}] 座標超界或不合法: ${JSON.stringify(a.bounds)}`);
    }
  }
}

/** 等待 Rich Menu 建立完成（避免剛建好就查不到 404） */
async function waitUntilExists(id, token, tries = 10) {
  for (let i = 0; i < tries; i++) {
    try {
      await api(`/v2/bot/richmenu/${id}`, { method: 'GET' }, token);
      return;
    } catch (e) {
      const is404 = String(e.message).includes('404');
      const wait = 600 + i * 1200;
      if (!is404 && i >= 2) throw e;
      await sleep(wait);
    }
  }
  throw new Error(`richmenu ${id} still 404 after ${tries} tries`);
}

/** 上傳 Rich Menu 圖片（偵測 Content-Type + 重試） */
async function uploadImageWithRetry(id, imagePath, token, tries = 8) {
  const buf = readImageAsBuffer(imagePath);
  const contentType = guessContentType(imagePath);

  for (let i = 0; i < tries; i++) {
    try {
      await api(`/v2/bot/richmenu/${id}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(buf.length),
        },
        body: buf,
      }, token);
      return; // 成功
    } catch (e) {
      const msg = String(e.message);
      // 新建後常見 404；圖片型態錯誤會是 400 → 直接丟錯不要重試
      if (msg.includes('404') && i < tries - 1) {
        await sleep(800 + i * 1800);
        continue;
      }
      throw e;
    }
  }
}

/** 建立 Rich Menu（JSON → 等待可查詢 → 上傳圖片） */
async function createMenu({ name, areas, imagePath }, token) {
  validateAreas(areas);

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

/** 綁定/更新 alias */
async function setAlias(id, alias, token) {
  try {
    const got = await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'GET' }, token);
    const cur = got.json?.richMenuId;
    if (cur === id) return;
    if (cur) await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'DELETE' }, token);
  } catch (e) {
    if (!String(e.message).includes('404')) throw e;
  }

  await api('/v2/bot/richmenu/alias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ richMenuAliasId: alias, richMenuId: id }),
  }, token);
}

/** 設為所有使用者的預設 Rich Menu */
async function setDefault(id, token) {
  await api(`/v2/bot/user/all/richmenu/${id}`, { method: 'POST' }, token);
}

/** 取得使用者個人資料 */
async function getUserProfile(userId, token) {
  const res = await api(`/v2/bot/profile/${userId}`, { method: 'GET' }, token);
  return res.json;
}

/** 移除單一使用者綁定（會回到 default） */
async function resetUser(userId, token) {
  await api(`/v2/bot/user/${userId}/richmenu`, { method: 'DELETE' }, token);
}

module.exports = { createMenu, setAlias, setDefault, resetUser, getUserProfile };

// // scripts/richmenu/lib/menuOps.js
// const { api, readImageAsBuffer, guessContentType } = require('./lineApi');

// // LINE Rich Menu 固定尺寸
// const SIZE = { width: 2500, height: 1686 };
// const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// /** 驗證熱區座標是否在 2500×1686 範圍內 */
// function validateAreas(areas) {
//   if (!Array.isArray(areas) || areas.length === 0)
//     throw new Error('areas 必須是非空陣列');

//   for (const [i, a] of areas.entries()) {
//     if (!a.bounds) throw new Error(`areas[${i}] 缺少 bounds`);
//     const { x, y, width, height } = a.bounds;
//     const ok = Number.isFinite(x) && Number.isFinite(y) &&
//                Number.isFinite(width) && Number.isFinite(height) &&
//                x >= 0 && y >= 0 &&
//                width > 0 && height > 0 &&
//                (x + width) <= SIZE.width &&
//                (y + height) <= SIZE.height;
//     if (!ok) {
//       throw new Error(`areas[${i}] 座標超界或不合法: ${JSON.stringify(a.bounds)}`);
//     }
//   }
// }

// /** 等待 Rich Menu 建立完成（避免剛建好就查不到 404） */
// async function waitUntilExists(id, token, tries = 10) {
//   for (let i = 0; i < tries; i++) {
//     try {
//       await api(`/v2/bot/richmenu/${id}`, { method: 'GET' }, token);
//       return;
//     } catch (e) {
//       const is404 = String(e.message).includes('404');
//       const wait = 600 + i * 1200; // 稍微拉長一點
//       if (!is404 && i >= 2) throw e;
//       await sleep(wait);
//     }
//   }
//   throw new Error(`richmenu ${id} still 404 after ${tries} tries`);
// }

// /** 上傳 Rich Menu 圖片（偵測 Content-Type + 重試） */
// async function uploadImageWithRetry(id, imagePath, token, tries = 8) {
//   const buf = readImageAsBuffer(imagePath);
//   const contentType = guessContentType(imagePath);

//   for (let i = 0; i < tries; i++) {
//     try {
//       await api(`/v2/bot/richmenu/${id}/content`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': contentType,
//           'Content-Length': String(buf.length),
//         },
//         body: buf,
//       }, token);
//       return; // 成功
//     } catch (e) {
//       const msg = String(e.message);
//       // 新建後常見 404；圖片型態錯誤會是 400 → 直接丟錯不要重試
//       if (msg.includes('404') && i < tries - 1) {
//         await sleep(800 + i * 1800);
//         continue;
//       }
//       throw e;
//     }
//   }
// }

// /** 建立 Rich Menu（JSON → 等待可查詢 → 上傳圖片） */
// async function createMenu({ name, areas, imagePath }, token) {
//   validateAreas(areas);

//   const created = await api('/v2/bot/richmenu', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       size: SIZE,
//       selected: true,              // 建議保留
//       name,
//       chatBarText: '功能選單',
//       areas,
//     }),
//   }, token);

//   const id = created.json?.richMenuId;
//   if (!id) throw new Error(`No richMenuId for ${name}`);

//   await waitUntilExists(id, token);
//   await uploadImageWithRetry(id, imagePath, token);

//   return id;
// }

// /** 綁定/更新 alias */
// async function setAlias(id, alias, token) {
//   try {
//     const got = await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'GET' }, token);
//     const cur = got.json?.richMenuId;
//     if (cur === id) return;
//     if (cur) await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'DELETE' }, token);
//   } catch (e) {
//     if (!String(e.message).includes('404')) throw e;
//   }

//   await api('/v2/bot/richmenu/alias', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ richMenuAliasId: alias, richMenuId: id }),
//   }, token);
// }

// /** 設為所有使用者的預設 Rich Menu */
// async function setDefault(id, token) {
//   await api(`/v2/bot/user/all/richmenu/${id}`, { method: 'POST' }, token);
// }

// /** 取得使用者個人資料 */
// async function getUserProfile(userId, token) {
//   const res = await api(`/v2/bot/profile/${userId}`, { method: 'GET' }, token);
//   return res.json;
// }

// /** 移除單一使用者綁定（會回到 default） */
// async function resetUser(userId, token) {
//   await api(`/v2/bot/user/${userId}/richmenu`, { method: 'DELETE' }, token);
// }

// module.exports = { createMenu, setAlias, setDefault, resetUser, getUserProfile };

// // // scripts/richmenu/lib/menuOps.js

// // const { api, readImageAsBuffer } = require('./lineApi');

// // // LINE Rich Menu 固定尺寸
// // const SIZE = { width: 2500, height: 1686 };

// // // 小工具：sleep
// // const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// // /**
// //  * 等待 Rich Menu 建立完成（避免剛建好就查不到 404）
// //  * - 會以 GET /v2/bot/richmenu/{id} 輪詢
// //  */
// // async function waitUntilExists(id, token, tries = 8) {
// //   for (let i = 0; i < tries; i++) {
// //     try {
// //       await api(`/v2/bot/richmenu/${id}`, { method: 'GET' }, token);
// //       return; // 成功表示存在
// //     } catch (e) {
// //       const is404 = String(e.message).includes('404');
// //       const wait = 500 + i * 1500; // 遞增等待
// //       if (!is404 && i >= 2) throw e; // 非 404 連續多次就丟出
// //       await sleep(wait);
// //     }
// //   }
// //   throw new Error(`richmenu ${id} still 404`);
// // }

// // /**
// //  * 上傳 Rich Menu 圖片（帶重試，因為建立後短暫時間可能 404）
// //  */
// // async function uploadImageWithRetry(id, imagePath, token, tries = 8) {
// //   const buf = readImageAsBuffer(imagePath);
// //   for (let i = 0; i < tries; i++) {
// //     try {
// //       await api(`/v2/bot/richmenu/${id}/content`, {
// //         method: 'POST',
// //         headers: {
// //           'Content-Type': 'image/png',
// //           'Content-Length': String(buf.length),
// //         },
// //         body: buf,
// //       }, token);
// //       return; // 成功
// //     } catch (e) {
// //       if (String(e.message).includes('404') && i < tries - 1) {
// //         await sleep(800 + i * 2000);
// //         continue;
// //       }
// //       throw e;
// //     }
// //   }
// // }

// // /**
// //  * 建立 Rich Menu（JSON 結構 → 等待可查詢 → 上傳圖片）
// //  * @returns {Promise<string>} richMenuId
// //  */
// // async function createMenu({ name, areas, imagePath }, token) {
// //   const created = await api('/v2/bot/richmenu', {
// //     method: 'POST',
// //     headers: { 'Content-Type': 'application/json' },
// //     body: JSON.stringify({
// //       size: SIZE,
// //       selected: true,
// //       name,
// //       chatBarText: '功能選單',
// //       areas,
// //     }),
// //   }, token);

// //   const id = created.json?.richMenuId;
// //   if (!id) throw new Error(`No richMenuId for ${name}`);

// //   await waitUntilExists(id, token);
// //   await uploadImageWithRetry(id, imagePath, token);

// //   return id;
// // }

// // /**
// //  * 綁定（或更新）Rich Menu 別名（alias）
// //  * - 若 alias 已存在且指向不同 id：先刪除再建立
// //  */
// // async function setAlias(id, alias, token) {
// //   try {
// //     const got = await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'GET' }, token);
// //     const cur = got.json?.richMenuId;
// //     if (cur === id) return; // 已是正確綁定
// //     if (cur) await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'DELETE' }, token);
// //   } catch (e) {
// //     if (!String(e.message).includes('404')) throw e; // 404 表示 alias 不存在，無需刪除
// //   }

// //   await api('/v2/bot/richmenu/alias', {
// //     method: 'POST',
// //     headers: { 'Content-Type': 'application/json' },
// //     body: JSON.stringify({ richMenuAliasId: alias, richMenuId: id }),
// //   }, token);
// // }

// // /**
// //  * 設為所有使用者的預設 Rich Menu
// //  */
// // async function setDefault(id, token) {
// //   await api(`/v2/bot/user/all/richmenu/${id}`, { method: 'POST' }, token);
// // }

// // /**
// //  * 取得使用者個人資料
// //  */
// // async function getUserProfile(userId, token) {
// //   const res = await api(`/v2/bot/profile/${userId}`, { method: 'GET' }, token);
// //   return res.json;
// // }

// // /**
// //  * 移除單一使用者的 richmenu 綁定
// //  * - 移除後，LINE 會自動套用 default richmenu
// //  */
// // async function resetUser(userId, token) {
// //   await api(`/v2/bot/user/${userId}/richmenu`, { method: 'DELETE' }, token);
// // }

// // module.exports = { createMenu, setAlias, setDefault, resetUser, getUserProfile };
