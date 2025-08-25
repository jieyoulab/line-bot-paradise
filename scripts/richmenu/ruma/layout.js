// scripts/richmenu/ruma/layout.js
const { SIZE, validateAreas } = require('../shared/layout');

module.exports = function () {
  const TENANT = 'ruma';
  const BASE   = `public/richmenu/${TENANT}`;

  // 固定規格
  const TAB_W = 952;     // 左/中兩塊 tab 寬
  const TAB_H = 294;     // 底部高度
  const BTN_W = 537;     // 最右側按鈕欄寬
  const SP    = 32;      // 右邊留白
  const SAFE_GAP = 4;    // ← 新增：中間區與按鈕欄之間留縫避免邊界搶點

  // 座標（算定值）
  const rowY      = SIZE.height - SP - TAB_H;              // 1360
  const btnX      = SIZE.width  - SP - BTN_W;              // 1931（不變）
  const xRightTab = btnX - SAFE_GAP - TAB_W;               // 979 - SAFE_GAP
  const xLeftTab  = xRightTab - SAFE_GAP - TAB_W;          // 27 - SAFE_GAP（實際會是 23）

  // 右側三顆（確定數字）
  const B1 = { x: btnX, y: rowY,        width: BTN_W, height: 87  };
  const B2 = { x: btnX, y: rowY + 103,  width: BTN_W, height: 87  };
  const B3 = { x: btnX, y: rowY + 206,  width: BTN_W, height: 88  };

  // ========== primary（櫓榪工作室）==========
  const primary = () => {
    const areas = [
      // 左下（櫓榪工作室）→ 切到 primary（自頁；可改成 no-op 或直接不放）
      {
        bounds: { x: xLeftTab, y: rowY, width: TAB_W, height: TAB_H },
        action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_primary', data: 'switch=primary' },
      },
      // 中下（竹部落消息）→ 切到 second
      {
        bounds: { x: xRightTab, y: rowY, width: TAB_W, height: TAB_H },
        action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_second', data: 'switch=second' },
      },
      // 右側三顆
      // { bounds: B1, action: { type: 'postback', data: 'action=booking', displayText: '預約體驗' } },
      // { bounds: B2, action: { type: 'postback', data: 'action=shop',    displayText: '桂竹小物' } },
      // { bounds: B3, action: { type: 'postback', data: 'action=about',   displayText: '關於我們' } },
      // 測試
      { bounds: B1, action: { type: 'message', text: '我要預約體驗' } },
      { bounds: B2, action: { type: 'message', text: '我要看桂竹小物' } },
      { bounds: B3, action: { type: 'message', text: '關於我們' } },

    ];
    const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
    return areas;
  };

  // ========== second（竹部落）==========
  const second = () => {
    const areas = [
      // 左下（櫓榪工作室）→ 切到 primary
      {
        bounds: { x: xLeftTab, y: rowY, width: TAB_W, height: TAB_H },
        action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_primary', data: 'switch=primary' },
      },
      // 中下（竹部落消息）→ 切到 second（自頁；可改成 no-op）
      {
        bounds: { x: xRightTab, y: rowY, width: TAB_W, height: TAB_H },
        action: { type: 'richmenuswitch', richMenuAliasId: 'ruma_second', data: 'switch=second' },
      },
      // 右側三顆
      // { bounds: B1, action: { type: 'uri', uri: 'https://www.facebook.com/...' } },
      // { bounds: B2, action: { type: 'uri', uri: 'https://www.instagram.com/...' } },
      // { bounds: B3, action: { type: 'postback', data: 'action=atayal_bamboo', displayText: '泰雅與竹' } },
      { bounds: B1, action: { type: 'message', text: '測試按鈕一' } },
      { bounds: B2, action: { type: 'message', text: '測試按鈕二' } },
      { bounds: B3, action: { type: 'message', text: '測試按鈕三' } },
    ];
    const errs = validateAreas(areas); if (errs.length) throw new Error(errs.join('; '));
    return areas;
  };

  // 這裡 alias 用短字，deploy 會變成 ruma_primary / ruma_second
  return [
    { alias: 'primary', name: '櫓榪工作室', image: `${BASE}/primary.v1.png`, areas: primary },
    { alias: 'second',  name: '竹部落',     image: `${BASE}/second.v1.png`,  areas: second  },
  ];
};
