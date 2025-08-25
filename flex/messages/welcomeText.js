// messages/welcomeText.js //accountName
module.exports = function buildWelcomeText({ nickname, accountName="解憂工程" }) {
    return {
      type: "text",
      text: `${nickname} 您好 👋
  歡迎加入『${accountName}』，我們致力協助品牌、團隊與創業者
  快速打造 LINE 官方帳號全方位設置: 
    🤖 Line機器人自動回覆
    💬 報名系統
    📞 預約系統
    📢 即時通知客人 & 管理者
    💰 整合 LINE Pay 安心收款與退款
  或其他客製化需求：
  請點擊『下方圖文選單』
  感謝您加入我們的官方帳號🥳🥳
  
  👇 請選擇最符合您的需求！`
    };
  };
  // 我們的理念是：
  // 『沒有需求與想像力，技術也無法發揮；它們彼此循環相依，互相共學！』
  