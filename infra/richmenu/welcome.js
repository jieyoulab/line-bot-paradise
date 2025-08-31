// infra/richmenu/welcome.js
// 功能：依租戶產生「加入好友（follow）」時要回覆的訊息陣列。
// - jieyou：使用你現有的 welcomeText + welcomeBrandBubble Flex
// - 其他租戶：回 defaults 的簡單文字（可日後擴充為各自品牌 Flex）
const path = require('path');
const tenants = require('../../data/tenants.json');

function buildWelcomeMessages({ tenantKey, nickname = '朋友' }) {
  const cfg = tenants[tenantKey];
  if (!cfg) {
    return [{ type: 'text', text: `歡迎加入！${nickname} 👋` }];
  }

  // 動態載入 bubble & text 模組
  const brandBubble = require(path.resolve(__dirname, cfg.brandBubble));
  const buildWelcomeText = require(path.resolve(__dirname, cfg.welcomeText));

  const flexMsg = {
    type: 'flex',
    altText: `${nickname} 您好 👋 歡迎加入 ${cfg.accountName}`,
    contents: brandBubble,
  };

  const textMsg = buildWelcomeText({ nickname, accountName: cfg.accountName });

  return [flexMsg, textMsg];
}

module.exports = { buildWelcomeMessages };
