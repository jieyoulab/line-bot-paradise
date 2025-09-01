//# 部署 ruma 租戶的 richmenu
//npm run deploy-menu -- ruma

// scripts/richmenu/ruma/layout.js
const { SIZE, validateAreas } = require('../shared/layout');

module.exports = function () {
  const TENANT = 'ruma';
  const BASE   = `public/richmenu/${TENANT}`;

  const SP = 32;                 // 上下留白 邊距（padding），這裡用在 上/下 與右側欄與邊界的間距
  const BTN_W = 537;             // 右側三顆直欄按鈕的固定寬度 //右側直欄的 左上角 x 座標。算式＝總寬 − 邊距 − 按鈕寬 → 讓右欄緊貼右邊距 SP
  const RIGHT_X = SIZE.width - SP - BTN_W;

  const TOTAL_HEIGHT = SIZE.height - SP * 2;  // 可用高度
  const BTN_H = Math.floor(TOTAL_HEIGHT / 3);

  const B1 = { x: RIGHT_X, y: SP,           width: BTN_W, height: BTN_H };
  const B2 = { x: RIGHT_X, y: SP + BTN_H,   width: BTN_W, height: BTN_H };
  const B3 = { x: RIGHT_X, y: SP + BTN_H*2, width: BTN_W, height: TOTAL_HEIGHT - BTN_H*2 };

   // 左上方按鈕，水平排列，高度 = B3.height / 2
  const leftWidth = RIGHT_X - SP;
  const leftHeight = Math.floor(B3.height / 2);
  const B4 = { x: SP, y: B3.y + B3.height - leftHeight, width: Math.floor(leftWidth / 2), height: leftHeight };
  const B5 = { x: SP + Math.floor(leftWidth / 2), y: B3.y + B3.height - leftHeight, width: Math.ceil(leftWidth / 2), height: leftHeight };


  // ========== primary（櫓榪工作室）==========
  const primary = () => {
    const areas = [
      // 左下（櫓榪工作室）→ 切到 primary（自頁；可改成 no-op 或直接不放）
      // {
      //   bounds: { x: xLeftTab, y: rowY, width: TAB_W, height: TAB_H },
      //   action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_primary', data: 'switch=primary' },
      // },
      // 中下（竹部落消息）→ 切到 second
      // {
      //   bounds: { x: xRightTab, y: rowY, width: TAB_W, height: TAB_H },
      //   action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_second', data: 'switch=second' },
      // },
      // 右側三顆
      // { bounds: B1, action: { type: 'postback', data: 'action=booking', displayText: '預約體驗' } },
      // { bounds: B2, action: { type: 'postback', data: 'action=shop',    displayText: '桂竹小物' } },
      // { bounds: B3, action: { type: 'postback', data: 'action=about',   displayText: '關於我們' } },
      // 測試
      { bounds: B1, action: { type: 'message', text: '活動報名' } },
      { bounds: B2, action: { type: 'message', text: '櫓榪店舖' } },
      { bounds: B3, action: { type: 'message', text: '團體活動預約' } },
      // { bounds: B4, action: { type: 'message', text: '櫓榪竹工作室最新消息' } },
      { bounds: B4, action: { 
        "type": "postback",
        "label": "最新消息＋影片",
        "data": "action=ruma_latest_video",
        "displayText": "櫓榪竹工作室最新消息"
        } },
      { bounds: B5, action: { type: 'message', text: '復興桂竹合作夥伴' } }, 
      //復興桂竹合作夥伴
    ];
    const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
    return areas;
  };

  // ========== second（竹部落）==========
  // const second = () => {
  //   const areas = [
  //     // 左下（櫓榪工作室）→ 切到 primary
  //     {
  //       bounds: { x: xLeftTab, y: rowY, width: TAB_W, height: TAB_H },
  //       action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_primary', data: 'switch=primary' },
  //     },
  //     // 中下（竹部落消息）→ 切到 second（自頁；可改成 no-op）
  //     {
  //       bounds: { x: xRightTab, y: rowY, width: TAB_W, height: TAB_H },
  //       action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_second', data: 'switch=second' },
  //     },
  //     // 右側三顆
  //     // { bounds: B1, action: { type: 'uri', uri: 'https://www.facebook.com/...' } },
  //     // { bounds: B2, action: { type: 'uri', uri: 'https://www.instagram.com/...' } },
  //     // { bounds: B3, action: { type: 'postback', data: 'action=atayal_bamboo', displayText: '泰雅與竹' } },
  //     { bounds: B1, action: { type: 'message', text: '測試按鈕一' } },
  //     { bounds: B2, action: { type: 'message', text: '測試按鈕二' } },
  //     { bounds: B3, action: { type: 'message', text: '測試按鈕三' } },
  //   ];
  //   const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
  //   return areas;
  // };

  // 這裡 alias 用短字，deploy 會變成 ruma_primary / ruma_second
  return [
    { alias: 'primary', name: '櫓榪工作室', image: `${BASE}/primary.v2.png`, areas: primary },
    // { alias: 'second',  name: '竹部落',     image: `${BASE}/second.v1.png`,  areas: second  },
  ];
};
