module.exports = function buildRumaWelcomeText({ nickname = '朋友', accountName = "櫓榪竹工作室 Ruma" }) {
    return {
      type: "text",
      text: `${nickname} 您好 👋
  歡迎加入『${accountName}』！
  我們提供：
    🎋 竹藝手作體驗與課程
    🧭 在地文化導覽
    🗓 團體／學校活動預約
    🛒 手作小物選購
  
  請點擊『下方圖文選單』開始探索，或直接留言需求，
  我們將盡快與您聯繫。🙂`
    };
  };
  