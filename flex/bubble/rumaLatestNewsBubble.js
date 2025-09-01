// flex/rumaLatestNewsBubble.js
module.exports = {
    type: "bubble",
    size: "deca",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: "🎋 櫓榪竹工作室｜最新消息", weight: "bold", size: "lg", color: "#2E5E4E" },
        { type: "text", text: "本週重點：影音圖文報導、展售訊息、社群更新。", size: "sm", wrap: true, color: "#4F7B6D" },
        { type: "separator", margin: "md" }
      ]
    },
    footer: {
      type: "box",
      layout: "horizontal",
      spacing: "md",
      contents: [
        { type: "button", style: "secondary", action: { type: "uri", label: "Facebook",  uri: "https://www.facebook.com/MuduRuma/" } },
        { type: "button", style: "secondary", action: { type: "uri", label: "Instagram", uri: "https://www.instagram.com/muduruma_master/" } }
      ]
    }
  };
  