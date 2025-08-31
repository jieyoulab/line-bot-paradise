// # 部署 jieyou 租戶的 richmenu
// npm run deploy-menu -- jieyou

//測試時就跑 ＝> node scripts/richmenu/deployTenant.js jieyou


// scripts/richmenu/jieyou/layout.js
// 目的（WHAT）：定義「解憂（jieyou）」租戶的三個 Rich Menu（tab1/2/3）的版面與互動熱區。
// 作法（HOW）：以函式回傳一個陣列，每個元素代表一份 Rich Menu，包含：圖片路徑、alias、與一組 areas（點擊熱區）。
// 原因（WHY）：拆租戶→拆佈局，讓「每個租戶」可以用自己的圖片與座標配置，同一支部署器可重複使用。
// 注意（ALIAS 前綴策略）：
//   1) 本檔「底部回傳的 alias」使用短字（tab1/tab2/tab3）。部署器會實際註冊為「jieyou_tab1/2/3」。
//   2) 但「區塊內的 richmenuswitch 目標」我直接填完整別名 'jieyou_tabX'，確保切頁能命中最終註冊結果。
//      若你的部署器有「在上傳前自動將區塊內 alias 也加上前綴」的機制，才可以在這裡改回短字 'tabX'。

const { SIZE, validateAreas } = require('../shared/layout');

module.exports = function () {
  // === 路徑與基準設定 ===
  // TENANT：用於組圖檔路徑。這裡不用來動態加 alias 前綴（由部署器負責）。
  const TENANT = 'jieyou';
  const BASE   = `public/richmenu/${TENANT}`; // 對應你的專案中 public/richmenu/jieyou/*.png

  // === 版面常數（座標系統說明） ===
  // LINE Rich Menu 推薦圖面固定 2500×1686；此 SIZE 由 shared/layout.js 匯出。
  // 下列常數是你在「單租戶腳本」已驗證過的欄寬與間距（padding / gutter），沿用即可。
  const TAB_H = 300; // 上方分頁高（上排三塊切頁區）
  const SP    = 24;  // 邊界留白（padding）
  const G     = 24;  // 區塊間距（gutter）

  // 三欄寬（加總=2500 - 左右 padding），與起始 x（左→右）
  const COLW = [801, 801, 802];
  const COLX = [24, 849, 1674];

  // === 上方三塊：分頁切換（richmenuswitch） ===
  // WHY：用 richmenuswitch + alias 實現「多分頁」體驗；使用者點上排三塊即可切換到對應 alias 的 Rich Menu。
  // 注意：此處直接填完整 alias 'jieyou_tabX'；確保與部署器實際建立的 alias 一致。
  const topTabs = () => ([
    { bounds: { x: 0,    y: 0, width: 833, height: TAB_H },
      action: { type:'richmenuswitch', richMenuAliasId:'jieyou_tab1', data:'switch=tab1' } },
    { bounds: { x: 833,  y: 0, width: 833, height: TAB_H },
      action: { type:'richmenuswitch', richMenuAliasId:'jieyou_tab2', data:'switch=tab2' } },
    { bounds: { x: 1666, y: 0, width: 834, height: TAB_H },
      action: { type:'richmenuswitch', richMenuAliasId:'jieyou_tab3', data:'switch=tab3' } },
  ]);

  // === 各分頁 areas ===
  // 共通座標思路：
  // - 先算出第一排（row1）與第二排（row2）的 y 與高度，再把三欄的 x/寬套進去。
  // - 「二排滿版」情境（row2W = SIZE.width - 2*SP）可一口氣覆蓋整寬，利於放單一大按鈕。

  // tab1：友誼推廣 — 包含三欄按鈕 + 下一排一個滿版按鈕
  function areasTab1() {
    // 第一排（row1）頂到 TAB_H（避開上方分頁），高 540
    const row1Y = TAB_H + SP;
    const row1H = 540;
    // 第二排（row2）在 row1 下方 + G，滿版寬（扣左右 padding），高 774
    const row2Y = row1Y + row1H + G;
    const row2W = SIZE.width - 2*SP;
    const row2H = 774;

    const areas = [
      // 上方三塊切頁（tab1/tab2/tab3）
      ...topTabs(),
      // 第一排三欄：合作洽談 / GitHub 作品集 / QRCode（建置中）
      { bounds: { x: COLX[0], y: row1Y, width: COLW[0], height: row1H },
        action: { type:'postback', data:'action=cooperate', label:'長期合作洽談', displayText:'長期合作洽談' } },
      { bounds: { x: COLX[1], y: row1Y, width: COLW[1], height: row1H },
        action: { type:'uri', uri:'https://github.com/jieyoulab', label:'GitHub 作品集' } },
      { bounds: { x: COLX[2], y: row1Y, width: COLW[2], height: row1H },
        action: { type:'postback', data:'action=qrcode', label:'建置中(QRcode)', displayText:'建置中(QRcode)' } },
      // 第二排滿版：社群與評價
      { bounds: { x: SP, y: row2Y, width: row2W, height: row2H },
        action: { type:'postback', data:'action=community', label:'社群與評價', displayText:'社群與評價' } },
    ];

    // 防呆：確認所有 bounds 在 0~SIZE 範圍內、寬高 > 0、整數等（實作細節在 validateAreas）
    const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
    return areas;
  }

  // tab2：解憂服務（建議作為預設分頁）
  // 配置：上方一塊 hero 寬幅（介紹服務），下方兩塊（聯絡我們／網站維護）
  function areasTab2() {
    const heroY = TAB_H + SP;
    const heroH = 720;                  // hero 區塊高度
    const rowY  = heroY + heroH + G;    // 下排起點
    const rowH  = 594;                  // 下排區塊高度
    const heroW = SIZE.width - 2*SP;    // hero 寬度（滿版扣左右 padding）

    const areas = [
      ...topTabs(),
      // Hero 區：點了回 postback，由 server 決定回應哪個 Flex 或引導訊息
      { bounds: { x: SP,      y: heroY, width: heroW,   height: heroH },
        action: { type:'postback', data:'action=line_oa_build', label:'LINE OA 建置', displayText:'LINE 官方帳號建置' } },
      // 下排兩欄（保留第三欄做日後擴充）
      { bounds: { x: COLX[0], y: rowY,  width: COLW[0], height: rowH  },
        action: { type:'postback', data:'action=contact_us', label:'聯絡我們', displayText:'聯絡我們' } },
      { bounds: { x: COLX[1], y: rowY,  width: COLW[1], height: rowH  },
        action: { type:'postback', data:'action=site_maintain', label:'現有網站維護', displayText:'現有網站維護' } },
      // COLX[2] 留白，之後可加「常見問題」、「報價方案」等
    ];

    const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
    return areas;
  }

  // tab3：案例展示 — 上下兩排、各三欄；其中一格直接開外部網站
  function areasTab3() {
    const rowH  = 657;                // 每列高度
    const row1Y = TAB_H + SP;         // 第一列 Y
    const row2Y = row1Y + rowH + G;   // 第二列 Y

    const areas = [
      ...topTabs(),
      // 第一列三欄：CRM / 預約系統 / 購物車金流
      { bounds: { x: COLX[0], y: row1Y, width: COLW[0], height: rowH },
        action: { type:'postback', data:'action=case_crm', label:'客戶數據', displayText:'客戶數據建置' } },
      { bounds: { x: COLX[1], y: row1Y, width: COLW[1], height: rowH },
        action: { type:'postback', data:'action=case_booking', label:'預約系統', displayText:'預約系統建置' } },
      { bounds: { x: COLX[2], y: row1Y, width: COLW[2], height: rowH },
        action: { type:'postback', data:'action=case_cart', label:'購物車&金流', displayText:'購物車&金流' } },

      // 第二列三欄：其一直接開外部網站（展示落地站點），其餘走 postback 讓伺服器回 Flex
      { bounds: { x: COLX[0], y: row2Y, width: COLW[0], height: rowH },
        action: { type:'uri', uri:'https://camping-project-one.vercel.app/', label:'商家網站', displayText:'商家網站建置' } },
      { bounds: { x: COLX[1], y: row2Y, width: COLW[1], height: rowH },
        action: { type:'postback', data:'action=case_ai', label:'AI/自動化', displayText:'AI/自動化流程' } },
      { bounds: { x: COLX[2], y: row2Y, width: COLW[2], height: rowH },
        action: { type:'postback', data:'action=case_demo', label:'DEMO功能', displayText:'臨時功能測試區' } },
    ];

    const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
    return areas;
  }

  // === 最終輸出 ===
  // 每個元素代表一個 Rich Menu：{ alias, name, image, areas }
  // - alias：使用短字（tab1/2/3）。部署時會註冊為加上前綴的 alias（jieyou_tabX）。
  // - name：LINE 後台看的名字，可含中文，便於辨識。
  // - image：PNG 圖檔路徑，務必 2500×1686；不符會 400。
  // - areas：這裡傳「函式」，部署器在建立前會呼叫以取得實際陣列（好處：可在函式內用上面計算過的常數）。
  // 小建議：預設分頁使用 tab2（解憂服務），部署器可在全部建立完後 setDefault(tab2 對應的 richMenuId)。
  return [
    { alias: 'tab1', name: 'tab1_友誼推廣', image: `${BASE}/tab1.png`, areas: areasTab1 },
    { alias: 'tab2', name: 'tab2_解憂服務', image: `${BASE}/tab2.png`, areas: areasTab2 }, // 建議設為預設
    { alias: 'tab3', name: 'tab3_案例展示', image: `${BASE}/tab3.png`, areas: areasTab3 },
  ];
};
