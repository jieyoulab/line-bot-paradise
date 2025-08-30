// scripts/richmenu/lib/lineApi.js

// Node 18+ 內建 fetch；若你是 Node 16，請解開下一行：
// const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

/**
 * LINE Rich Menu API 兩個網域：
 * - https://api.line.me        → 一般 API（建立 richmenu、alias、設定預設…）
 * - https://api-data.line.me   → 上傳圖片（/richmenu/{id}/content）
 */
function pickBase(p) {
  return p.includes('/richmenu/') && p.endsWith('/content')
    ? 'https://api-data.line.me'
    : 'https://api.line.me';
}

/**
 * 呼叫 LINE API（自動加 Authorization）
 * @param {string} path - API 路徑（例：/v2/bot/richmenu）
 * @param {RequestInit} init
 * @param {string} token
 */
async function api(path, init = {}, token) {
  if (!token) throw new Error('LINE token missing');
  const res = await fetch(pickBase(path) + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${path} ${res.status} ${text}`);
  try { return { res, json: JSON.parse(text), text }; }
  catch { return { res, json: null, text }; }
}

const fs = require('fs');
const nodePath = require('path');

/** 讀取圖片 Buffer（上傳用） */
function readImageAsBuffer(p) {
  const abs = nodePath.resolve(p);
  if (!fs.existsSync(abs)) throw new Error(`Image not found: ${abs}`);
  return fs.readFileSync(abs);
}

/** 依副檔名推測 Content-Type（png/jpg/jpeg/webp） */
function guessContentType(p) {
  const ext = nodePath.extname(String(p)).toLowerCase().replace('.', '');
  if (ext === 'png')  return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  // 其他副檔名：交給 LINE 拒絕並回報
  return 'application/octet-stream';
}

module.exports = { api, readImageAsBuffer, guessContentType };

// // scripts/richmenu/lib/lineApi.js

// // 注意：Node 18+ 內建 fetch；若你是 Node 16，請先安裝 node-fetch 並解開註解：
// // const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

// /**
//  * LINE Rich Menu API 使用兩個不同網域：
//  * - https://api.line.me        → 一般 API（建立 richmenu、alias、設定預設…）
//  * - https://api-data.line.me   → 上傳圖片（/richmenu/{id}/content）
//  */
// function pickBase(p) {
//     return p.includes('/richmenu/') && p.endsWith('/content')
//       ? 'https://api-data.line.me'
//       : 'https://api.line.me';
//   }
  
//   /**
//    * 呼叫 LINE API（自動加 Authorization）
//    * @param {string} path - API 路徑（例：/v2/bot/richmenu）
//    * @param {RequestInit} init - fetch 設定
//    * @param {string} token - Channel Access Token
//    * @returns {Promise<{res: Response, json: any, text: string}>}
//    */
//   async function api(path, init = {}, token) {
//     if (!token) throw new Error('LINE token missing');
//     const res = await fetch(pickBase(path) + path, {
//       ...init,
//       headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
//     });
//     const text = await res.text();
//     if (!res.ok) throw new Error(`${path} ${res.status} ${text}`);
//     try {
//       return { res, json: JSON.parse(text), text };
//     } catch {
//       return { res, json: null, text };
//     }
//   }
  
//   const fs = require('fs');
//   const path = require('path');
  
//   /**
//    * 讀取圖片檔並回傳 Buffer（上傳用）
//    * @param {string} p - 圖片相對或絕對路徑
//    */
//   function readImageAsBuffer(p) {
//     const abs = path.resolve(p);
//     if (!fs.existsSync(abs)) throw new Error(`Image not found: ${abs}`);
//     return fs.readFileSync(abs);
//   }
  
//   module.exports = { api, readImageAsBuffer };
  