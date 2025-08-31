module.exports = function buildRumaWelcomeText({
  nickname = '朋友',
  accountName = "櫓榪竹工作室 Ruma Studio"
}) {
  return {
    type: "text",
    text: `${nickname} 您好 👋
感謝加入『${accountName}』！

我們來自桃園市復興區，由泰雅青年經營的桂竹林業團隊，專注於：
🎋 桂竹伐採與林業管理
🧶 竹藝手作與文化體驗
🗓 團體活動預約與教育研習
🛒 產地直售與原生竹小物

👇 點擊下方圖文選單開始探索；
若有需求也可直接留言，我們會盡快回覆。🙂`
  };
};
