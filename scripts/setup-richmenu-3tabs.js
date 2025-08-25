// scripts/setup-richmenu-3tabs.js
//正確分流 api / api-data、建立→等一致→上傳→Alias→設預設）
// === 1) 讀環境變數與小工具 ====
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('❌ Missing LINE_CHANNEL_ACCESS_TOKEN in env');
  process.exit(1);
}

//sleep：給重試/等待使用
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function isReadableStream(x) { return x && typeof x === 'object' && typeof x.pipe === 'function'; }


// === 2) 正確的 API 網域分流 ===
// 這裡改：/content 走 api-data，其餘走 api
function pickBase(p) {
  return p.includes('/richmenu/') && p.endsWith('/content')
    ? 'https://api-data.line.me' //LINE 的 Rich Menu 圖片上傳要打 api-data.line.me
    : 'https://api.line.me'; //其他操作（建立、查詢、刪除、alias…）都走 api.line.me
} //我一直錯就是 ==> 你卡很久的 404 就是因為把上傳打到 api.line.me。這個分流能一勞永逸


// === 3) 共用的 API 包裝器 ===
// Authorization 放這裡統一加。
// duplex：只有在 ReadableStream（例如 fs.createReadStream）時才需要。
// 最後把 body 先讀成 text，成功就嘗試 JSON.parse，方便上層判斷與印錯誤。
// 你現在改為Buffer 上傳（見下文），所以一般不會再用到 ReadableStream；duplex 只是保險
async function api(p, init = {}) {
  const base = pickBase(p);
  const full = base + p;
  const opts = {
    ...init,
    ...(isReadableStream(init.body) ? { duplex: 'half' } : {}),
    headers: { Authorization: `Bearer ${TOKEN}`, ...(init.headers || {}) }
  };
  const res = await fetch(full, opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`${full} ${res.status} ${text}`);
  try { return { res, json: JSON.parse(text), text }; } catch { return { res, json: null, text }; }
}

// === 4) Rich Menu 版面配置 ===
// ---- Layout config ----
const SIZE = { width: 2500, height: 1686 }; //圖面尺寸固定 2500×1686（圖片也要同尺寸）
const TAB_H = 300, SP = 24, G = 24;
const COLW = [801, 801, 802];
const COLX = [24, 849, 1674];

// 上方三塊用 richmenuswitch + alias（tab1/2/3），這就是分頁切換的基礎。
// areasTab1/2/3() 各自回傳不同內容區塊（postback / uri…），你已經排版好了
const topTabs = () => ([
  { bounds: { x: 0,    y: 0, width: 833, height: TAB_H }, action: { type:'richmenuswitch', richMenuAliasId:'tab1', data:'switch=tab1' } },
  { bounds: { x: 833,  y: 0, width: 833, height: TAB_H }, action: { type:'richmenuswitch', richMenuAliasId:'tab2', data:'switch=tab2' } },
  { bounds: { x: 1666, y: 0, width: 834, height: TAB_H }, action: { type:'richmenuswitch', richMenuAliasId:'tab3', data:'switch=tab3' } },
]);

function areasTab1() { // 友誼推廣
  const row1Y = TAB_H + SP; const row1H = 540;
  const row2Y = row1Y + row1H + G; const row2W = 2500 - 2*SP; const row2H = 774;
  return [
    ...topTabs(),
    { bounds: { x: COLX[0], y: row1Y, width: COLW[0], height: row1H }, action: { type:'postback', data:'action=cooperate',   label:'長期合作洽談', displayText:'長期合作洽談' } },
    { bounds: { x: COLX[1], y: row1Y, width: COLW[1], height: row1H }, action: { type:'uri',      uri:'https://github.com/jieyoulab', label:'GitHub 作品集' } },
    { bounds: { x: COLX[2], y: row1Y, width: COLW[2], height: row1H }, action: { type:'postback', data:'action=qrcode',      label:'建置中(QRcode)', displayText:'建置中(QRcode)' } },
    { bounds: { x: SP,      y: row2Y, width: row2W,   height: row2H }, action: { type:'postback', data:'action=community',   label:'社群與評價', displayText:'社群與評價' } },
  ];
}

// Rich Menu 區塊設定範例
function areasTab2() { // 解憂服務
  const heroY = TAB_H + SP; const heroH = 720;
  const rowY  = heroY + heroH + G; const rowH  = 594; const heroW = 2500 - 2*SP;
  return [
    ...topTabs(),
    { bounds: { x: SP,      y: heroY, width: heroW,   height: heroH }, action: { type:'postback', data:'action=line_oa_build', label:'LINE OA 建置', displayText:'LINE 官方帳號建置' } },
    { bounds: { x: COLX[0], y: rowY,  width: COLW[0], height: rowH  }, action: { type:'postback', data:'action=contact_us',     label:'聯絡我們', displayText:'聯絡我們' } },
    { bounds: { x: COLX[1], y: rowY,  width: COLW[1], height: rowH  }, action: { type:'postback', data:'action=site_maintain',  label:'現有網站維護', displayText:'現有網站維護' } },
  ];
}

function areasTab3() { // 案例展示
  const rowH = 657; const row1Y = TAB_H + SP; const row2Y = row1Y + rowH + G;
  return [
    ...topTabs(),
    { bounds: { x: COLX[0], y: row1Y, width: COLW[0], height: rowH }, action: { type:'postback', data:'action=case_crm',    label:'客戶數據', displayText:'客戶數據建置' } },
    { bounds: { x: COLX[1], y: row1Y, width: COLW[1], height: rowH }, action: { type:'postback', data:'action=case_booking', label:'預約系統', displayText:'預約系統建置' } },
    { bounds: { x: COLX[2], y: row1Y, width: COLW[2], height: rowH }, action: { type:'postback', data:'action=case_cart',    label:'購物車&金流', displayText:'購物車&金流' } },// 🔽 這裡改成直接開網址
    { bounds: { x: COLX[0], y: row2Y, width: COLW[0], height: rowH }, action: { type:'uri', uri:'https://camping-project-one.vercel.app/', label:'商家網站', displayText:'商家網站建置' } },
    { bounds: { x: COLX[1], y: row2Y, width: COLW[1], height: rowH }, action: { type:'postback', data:'action=case_ai',      label:'AI/自動化', displayText:'AI/自動化流程' } },
    { bounds: { x: COLX[2], y: row2Y, width: COLW[2], height: rowH }, action: { type:'postback', data:'action=case_demo',    label:'DEMO功能', displayText:'臨時功能測試區' } },
  ];
}

// === 5) 等待可讀（解一致性延遲 404） ===
// 剛 POST /richmenu 立刻 POST /content 常見 404（後端尚未一致）。

// 這段是建立後先 GET 確認，若 404 就退避重試一段時間，等到可讀為止
async function waitUntilExists(richMenuId, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await api(`/v2/bot/richmenu/${richMenuId}`, { method: 'GET' });
      console.log('🔎 verify richmenu exists:', richMenuId, 'status', r.res.status);
      return;
    } catch (e) {
      const is404 = String(e.message).includes('404');
      const wait = 500 + i * 1500; // 0.5s, 2.0s, 3.5s, 5.0s, ...
      console.log(`⏳ wait ${wait}ms (GET richmenu ${is404 ? '404' : 'err'}, retry ${i + 1}/${tries})`);
      await sleep(wait);
      if (!is404 && i >= 2) throw e; // 連續非 404 的錯誤就別等了
    }
  }
  throw new Error(`richmenu ${richMenuId} still 404 after retries`);
}

// === 6) 圖片上傳（Buffer + 重試 + 正確網域） ===
// Buffer 上傳：一次送完整 body，避開 Node Stream/duplex 的相容性邊角問題。
// api() 內已改網域分流：/content 自動打 api-data.line.me。
// 遇到 404 時才退避重試；遇到 400/401 直接拋出（那是資料或權限錯）

async function uploadImageWithRetry(richMenuId, imagePath, tries = 8) {
  const imgPath = path.resolve(imagePath);
  if (!fs.existsSync(imgPath)) throw new Error(`Image not found: ${imgPath}`);
  const buf = fs.readFileSync(imgPath);

  for (let i = 0; i < tries; i++) {
    try {
      const r = await api(`/v2/bot/richmenu/${richMenuId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'image/png', 'Content-Length': String(buf.length) },
        body: buf,
      });
      console.log('🖼️  uploaded image status', r.res.status, '→', richMenuId);
      return;
    } catch (e) {
      if (String(e.message).includes('404') && i < tries - 1) {
        const wait = 800 + i * 2000;
        console.log(`⏳ wait ${wait}ms (content 404, retry ${i + 1}/${tries})`);
        await sleep(wait);
        continue;
      }
      throw e;
    }
  }
  throw new Error(`content upload still 404 after ${tries} tries`);
}

// === 7) 建立流程封裝 ===
//把建立 / 等待 / 上傳打包，讓主流程乾淨直覺。
//任一階段失敗會有清楚日誌與錯誤訊息
// ---- Core ops ----
async function createMenu(name, areas, imagePath) {
  // 1) 建立
  const created = await api('/v2/bot/richmenu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: SIZE, selected: true, name, chatBarText: '功能選單', areas }),
  });
  const richMenuId = created.json?.richMenuId;
  if (!richMenuId) throw new Error(`No richMenuId returned for ${name}. raw=${created.text}`);
  console.log('🆕 created:', name, richMenuId);

  // 2) 等到 LINE 端能讀到
  await waitUntilExists(richMenuId);

  // 3) 上傳圖片（拉長退避）
  await uploadImageWithRetry(richMenuId, imagePath);

  return richMenuId;
}


// === 8) 綁 alias（含覆蓋 + 預檢查） ===
async function setAlias(richMenuId, alias) {
  // 1) 預先 GET 檢查：如果 alias 已存在而且已指向同一個 ID，就直接跳過
  try {
    const got = await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'GET' });
    const currentId = got.json?.richMenuId;
    if (currentId) {
      if (currentId === richMenuId) {
        console.log(`🏷️ alias ${alias} already points to ${richMenuId} (skip)`);
        return;
      }
      console.log(`♻️ alias ${alias} points to ${currentId}, will replace → ${richMenuId}`);
      await api(`/v2/bot/richmenu/alias/${alias}`, { method: 'DELETE' });
    }
  } catch (e) {
    // 404 = alias 不存在，略過；其他錯誤才丟出
    if (!String(e.message).includes('404')) throw e;
  }

  // 2) 建立（或重建）；若仍遇到衝突，再強制刪除重建一次
  try {
    await api('/v2/bot/richmenu/alias', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ richMenuAliasId: alias, richMenuId })
    });
    console.log('🏷️ alias created', alias, '→', richMenuId);
  } catch (e) {
    const msg = String(e.message);
    if (msg.includes('409') || msg.includes('conflict richmenu alias id')) {
      console.log(`⚠️ alias ${alias} conflicted unexpectedly, force replace`);
      await api(`/v2/bot/richmenu/alias/${alias}`, { method:'DELETE' });
      await api('/v2/bot/richmenu/alias', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ richMenuAliasId: alias, richMenuId })
      });
      console.log('🔁 alias replaced', alias, '→', richMenuId);
    } else {
      throw e;
    }
  }
}


// === 9) 設預設主圖文選單 ===
async function setDefault(richMenuId) {
  await api('/v2/bot/user/all/richmenu/' + richMenuId, { method:'POST' });
  console.log('⭐ default set to', richMenuId);
}

// ---- Run all ----
// === 10) 主流程：一次建立三個 Tab ===
// 順序建立避免三個同時上傳/重試互相干擾。

// 最後把 tab2 設為預設，讓使用者一打開就看到「解憂服務」。

// 上排三塊的 richmenuswitch 會依據 alias 立即生效
(async () => {
  try {
    const tab1Id = await createMenu('tab1_友誼推廣', areasTab1(), './public/richmenu/tab1.png');
    await setAlias(tab1Id, 'tab1');

    const tab2Id = await createMenu('tab2_解憂服務', areasTab2(), './public/richmenu/tab2.png');
    await setAlias(tab2Id, 'tab2');

    const tab3Id = await createMenu('tab3_案例展示', areasTab3(), './public/richmenu/tab3.png');
    await setAlias(tab3Id, 'tab3');

    await setDefault(tab2Id); // 先讓 tab2 出現在所有用戶

    console.log('✅ rich menus ready:', { tab1Id, tab2Id, tab3Id, default: 'tab2(解憂服務)' });
    console.log('👉 在手機與 Bot 的一對一聊天發一句話，關掉再打開/下拉刷新，就會看到上方可切換的三個分頁。');
  } catch (e) {
    console.error('❌ setup failed:', e.message || e);
    process.exit(1);
  }
})();
