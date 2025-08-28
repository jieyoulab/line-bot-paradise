// scripts/setup-richmenu-3tabs.js
// 目的（WHAT）：一次性建立 3 份 Rich Menu（tab1/2/3），上傳對應圖片、綁定 alias，並設定預設分頁。
// 作法（HOW）：封裝 create → verify → upload → alias → setDefault 等步驟，並對 API 網域做分流（/content → api-data.line.me）。
// 原因（WHY）：
//  1) LINE 的 Rich Menu 圖片上傳必須走 api-data.line.me，打錯網域會出現 404/400。
//  2) 建立剛完成時有一致性延遲，立刻上傳常見 404 → 需先 GET 驗證或重試。
//  3) 用 alias + richmenuswitch 做「分頁」體驗；用戶端切換即時生效，無需伺服器參與。

/**
 * 分頁切換原理（一句話）：每個分頁都是一個 Rich Menu，三個 Rich Menu 分別綁 alias：tab1、tab2、tab3。上方「分頁列」三塊熱區是 richmenuswitch 動作，點哪一塊就切去對應 alias 所指向的 Rich Menu（在 LINE 用戶端立即生效，不需打 webhook）
 * 常見踩雷點（為什麼這樣設計）

/content 上傳一定要打 api-data.line.me → 已在 pickBase() 自動分流，避免 404。

建立後立刻上傳常見 404 → waitUntilExists() 先 GET 驗證、uploadImageWithRetry() 遇 404 退避重試。

alias 衝突/已存在 → setAlias() 先 GET 檢查，同 ID 直接略過；不同 ID 先 DELETE 再 POST；遇 409 再強制替換。

圖片尺寸 必須等於 SIZE（2500×1686），否則會報錯或熱區錯位。

大量同時建立上傳 容易互相干擾 → 主流程序列化建立三個分頁。

怎麼擴充為 2/4 個分頁？

2 個分頁：把 topTabs() 改成 2 塊（各 1250px 寬或依設計），只建立 tab1/tab2。

4 個分頁：topTabs() 做成四塊、建立 tab4 與對應 areasTab4()、圖片 tab4.png，流程新增一組 createMenu + setAlias。

多租戶（tenant）小提示

alias 命名加入租戶前綴：{tenantId}_tab1、{tenantId}_tab2…，切換熱區也改指向該租戶的 alias。

圖檔/座標依租戶主題不同可動態讀設定（JSON/yaml），主腳本以參數帶入 --tenant=foo 選擇一組配置。
把版面座標抽離到 JSON，讓你對應不同客戶/主題時，只要換圖與 JSON 就能重新部署
 */

// === 1) 讀環境變數與小工具 ===
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// WHAT：從 .env 讀出 LINE 的長期 Channel Access Token，用於所有 Bot API 呼叫做 Bearer 驗證。
// WHY：所有管理 Rich Menu 的 API 皆需 Bearer Token，缺少就提早終止，避免做白工。
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('❌ Missing LINE_CHANNEL_ACCESS_TOKEN in env');
  process.exit(1);
}

// WHAT：簡單 sleep 工具，給重試/退避（backoff）使用。
// WHY：面對一致性延遲或暫時性 404，很有用。
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// WHAT：判斷 body 是否為 ReadableStream（例如 fs.createReadStream）。
// WHY：Node 的 fetch 在串流上傳時需要設置 duplex:'half'；雖然本檔採 Buffer，上留彈性。
function isReadableStream(x) { return x && typeof x === 'object' && typeof x.pipe === 'function'; }


// === 2) 正確的 API 網域分流 ===
// WHAT：依 API 路徑決定要打 api.line.me 還是 api-data.line.me。
// HOW：所有 /v2/bot/richmenu/.../content（圖片上傳）一律走 api-data.line.me，其它走 api.line.me。
// WHY：LINE 官方規定：Rich Menu 圖片上傳專用 api-data 網域；打錯就會得到 404 或奇怪的錯誤。
function pickBase(p) {
  return p.includes('/richmenu/') && p.endsWith('/content')
    ? 'https://api-data.line.me' // ✅ 圖片上傳專用
    : 'https://api.line.me';     // ✅ 其它操作（建立、查詢、刪除、alias、設預設）
}
// 你卡很久的 404 就是把 /content 打到 api.line.me。這個分流讓錯誤一勞永逸地消失。


// === 3) 共用的 API 包裝器 ===
// WHAT：統一處理 fetch：自動加 Authorization、必要時帶 duplex，回傳 text 與可解析的 json。
// HOW：
//   - 自動套上 Bearer Token。
//   - 若 body 是 ReadableStream，補上 { duplex:'half' }（Node fetch 的要求）。
//   - 統一把 response 讀成文字，成功再嘗試 JSON.parse，方便上層印錯或拿 json。
// WHY：集中權限與錯誤處理，讓主流程更乾淨、日誌更好看。
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
// WHAT：定義圖面固定尺寸與每個區塊的座標，並把「分頁列」三塊熱區抽成 topTabs()。
// WHY：你採固定 2500x1686 的圖片，便於複用與維護座標；上方 3 塊是分頁切換（richmenuswitch）。
const SIZE = { width: 2500, height: 1686 }; // 圖面尺寸固定（圖片也必須完全相同尺寸）
const TAB_H = 300, SP = 24, G = 24;        // 分頁列高度 300、左右內距/間距
const COLW = [801, 801, 802];              // 三欄寬度（總和 + 邊界 ~= 2500）
const COLX = [24, 849, 1674];              // 三欄起始 x 座標

// WHAT：上方三個分頁切換區，對應 alias tab1/2/3。
// HOW：使用 richmenuswitch（客戶端動作），data 可自訂備查。
// WHY：分頁切換在 LINE 用戶端即時生效，不需 webhook；體驗像「多頁籤」。
const topTabs = () => ([
  { bounds: { x: 0,    y: 0, width: 833, height: TAB_H }, action: { type:'richmenuswitch', richMenuAliasId:'tab1', data:'switch=tab1' } },
  { bounds: { x: 833,  y: 0, width: 833, height: TAB_H }, action: { type:'richmenuswitch', richMenuAliasId:'tab2', data:'switch=tab2' } },
  { bounds: { x: 1666, y: 0, width: 834, height: TAB_H }, action: { type:'richmenuswitch', richMenuAliasId:'tab3', data:'switch=tab3' } },
]);

// WHAT：Tab1 的各功能熱區（postback/uri 皆可），含分頁列。
// WHY：把每個分頁自己的內容區拆成函式，易讀易維護與擴充。
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

// WHAT：Tab2 的熱區排版（含大 hero 區塊 + 下排兩格）。
// WHY：與 Tab1 同構，便於以視覺稿對齊座標、逐步調整。
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

// WHAT：Tab3 的熱區（兩排三欄），其中示範一格改直接開 URL（type: uri）。
// WHY：展示 postback 與 uri 可並用；postback 由你 webhook 處理，uri 直接開網頁。
function areasTab3() { // 案例展示
  const rowH = 657; const row1Y = TAB_H + SP; const row2Y = row1Y + rowH + G;
  return [
    ...topTabs(),
    { bounds: { x: COLX[0], y: row1Y, width: COLW[0], height: rowH }, action: { type:'postback', data:'action=case_crm',    label:'客戶數據', displayText:'客戶數據建置' } },
    { bounds: { x: COLX[1], y: row1Y, width: COLW[1], height: rowH }, action: { type:'postback', data:'action=case_booking', label:'預約系統', displayText:'預約系統建置' } },
    { bounds: { x: COLX[2], y: row1Y, width: COLW[2], height: rowH }, action: { type:'postback', data:'action=case_cart',    label:'購物車&金流', displayText:'購物車&金流' } },
    { bounds: { x: COLX[0], y: row2Y, width: COLW[0], height: rowH }, action: { type:'uri', uri:'https://camping-project-one.vercel.app/', label:'商家網站', displayText:'商家網站建置' } },
    { bounds: { x: COLX[1], y: row2Y, width: COLW[1], height: rowH }, action: { type:'postback', data:'action=case_ai',      label:'AI/自動化', displayText:'AI/自動化流程' } },
    { bounds: { x: COLX[2], y: row2Y, width: COLW[2], height: rowH }, action: { type:'postback', data:'action=case_demo',    label:'DEMO功能', displayText:'臨時功能測試區' } },
  ];
}


// === 5) 等待可讀（解一致性延遲 404） ===
// WHAT：剛 POST /richmenu 之後，LINE 端有「一致性延遲」，立刻對該 ID 做操作可能 404。
// HOW：用 GET /v2/bot/richmenu/{id} 做輪詢驗證（退避重試），直到可讀為止。
// WHY：避免馬上上傳圖片時撞 404，提升穩定度與可預期性。
async function waitUntilExists(richMenuId, tries = 8) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await api(`/v2/bot/richmenu/${richMenuId}`, { method: 'GET' });
      console.log('🔎 verify richmenu exists:', richMenuId, 'status', r.res.status);
      return;
    } catch (e) {
      const is404 = String(e.message).includes('404');
      const wait = 500 + i * 1500; // 線性加長退避：0.5s, 2.0s, 3.5s, ...
      console.log(`⏳ wait ${wait}ms (GET richmenu ${is404 ? '404' : 'err'}, retry ${i + 1}/${tries})`);
      await sleep(wait);
      if (!is404 && i >= 2) throw e; // 若不是 404 而且連續數次仍失敗，早點回報真正錯誤。
    }
  }
  throw new Error(`richmenu ${richMenuId} still 404 after retries`);
}


// === 6) 圖片上傳（Buffer + 重試 + 正確網域） ===
// WHAT：以 Buffer 方式上傳 PNG 圖片到 /content（= api-data.line.me）。
// HOW：先讀成 Buffer → 設 Content-Type / Content-Length → 針對 404 做退避重試。
// WHY：Buffer 一次性上傳可避開 Node Stream/duplex 邊角相容性；只對「一致性延遲」場景重試。
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
        const wait = 800 + i * 2000; // 慢一點，等 LINE 把剛建立的 menu propagate 完
        console.log(`⏳ wait ${wait}ms (content 404, retry ${i + 1}/${tries})`);
        await sleep(wait);
        continue;
      }
      throw e; // 400/401/403 等屬於資料或權限問題，不應盲重試。
    }
  }
  throw new Error(`content upload still 404 after ${tries} tries`);
}


// === 7) 建立流程封裝 ===
// WHAT：將「建立 → 等待可讀 → 上傳圖片」打包成 createMenu(name, areas, imagePath)。
// WHY：主流程一次建立三個分頁時更乾淨、出錯更集中好查。
async function createMenu(name, areas, imagePath) {
  // 1) 建立 Rich Menu（selected: true 代表建立當下可被設為預設，但我們最後會用 setDefault 控制）
  const created = await api('/v2/bot/richmenu', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ size: SIZE, selected: true, name, chatBarText: '功能選單', areas }),
  });
  const richMenuId = created.json?.richMenuId;
  if (!richMenuId) throw new Error(`No richMenuId returned for ${name}. raw=${created.text}`);
  console.log('🆕 created:', name, richMenuId);

  // 2) 等 LINE 端可讀（避免等下上傳 /content 撞 404）
  await waitUntilExists(richMenuId);

  // 3) 上傳對應圖片（含重試與正確網域）
  await uploadImageWithRetry(richMenuId, imagePath);

  return richMenuId;
}


// === 8) 綁 alias（含覆蓋 + 預檢查） ===
// WHAT：把剛建立好的 richMenuId 綁定（或重綁）到指定 alias，例如 tab1/tab2/tab3。
// HOW：先 GET 檢查 alias 是否存在且指向相同 ID → 是則略過；指向別的 → DELETE 後重建；遇 409 再強制替換。
// WHY：alias 穩定後，分頁切換不需改動「前端」熱區，只要替換 alias 指向即可熱更新。
async function setAlias(richMenuId, alias) {
  // 1) 預查：alias 若已存在且已指向相同 ID，就不必動它
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
    // 404 = alias 不存在 → 正常，進下一步；其他錯誤才中止。
    if (!String(e.message).includes('404')) throw e;
  }

  // 2) 建立/重建 alias；若遇到 race 造成 409，再刪除重建一次以確保成功。
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
// WHAT：把指定 richMenuId 設為「所有用戶的預設」。
// WHY：首次打開聊天時顯示哪個分頁，由你策略決定（例如產品服務 tab2）。
async function setDefault(richMenuId) {
  await api('/v2/bot/user/all/richmenu/' + richMenuId, { method:'POST' });
  console.log('⭐ default set to', richMenuId);
}


// === 10) 主流程：一次建立三個 Tab ===
// WHAT：依序建立 tab1/2/3（避免同時上傳互相干擾），分別綁 alias，最後把 tab2 設為預設。
// WHY：序列化建立 + 每步驟有清楚日誌，遇錯能快速定位；tab2 當預設可導向你最想讓用戶看的頁面。
(async () => {
  try {
    const tab1Id = await createMenu('tab1_友誼推廣', areasTab1(), './public/richmenu/tab1.png');
    await setAlias(tab1Id, 'tab1');

    const tab2Id = await createMenu('tab2_解憂服務', areasTab2(), './public/richmenu/tab2.png');
    await setAlias(tab2Id, 'tab2');

    const tab3Id = await createMenu('tab3_案例展示', areasTab3(), './public/richmenu/tab3.png');
    await setAlias(tab3Id, 'tab3');

    await setDefault(tab2Id); // 預設顯示 tab2（解憂服務）

    console.log('✅ rich menus ready:', { tab1Id, tab2Id, tab3Id, default: 'tab2(解憂服務)' });
    console.log('👉 在手機與 Bot 的一對一聊天發一句話，關掉再打開/下拉刷新，就會看到上方可切換的三個分頁。');
  } catch (e) {
    console.error('❌ setup failed:', e.message || e);
    process.exit(1);
  }
})();
