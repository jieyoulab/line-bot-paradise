// flex/needsVerticalBubble.js
module.exports = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "lg",
      contents: [
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "創業者", weight: "bold", size: "lg", align: "center" },
            { type: "text", text: "想要打造 LINE 官方帳號與訂單系統", wrap: true, size: "sm", color: "#555555", align: "center", margin: "md" },
            {
              type: "button",
              style: "primary",
              color: "#4e7699",
              margin: "md",
              action: { type: "postback", label: "開始打造", data: "action=need&need=startup", displayText: "我想打造 LINE 官方帳號" }
            }
          ]
        },
        { type: "separator", margin: "lg" },
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "公司業務繁瑣", weight: "bold", size: "lg", align: "center" },
            { type: "text", text: "想用 自動化流程替代繁瑣工作", wrap: true, size: "sm", color: "#555555", align: "center", margin: "md" },
            {
              type: "button",
              style: "primary",
              color: "#4e7699",
              margin: "md",
              action: { type: "postback", label: "開始自動化", data: "action=need&need=automation", displayText: "我想自動化工作流程" }
            }
          ]
        },
        { type: "separator", margin: "lg" },
        {
          type: "box",
          layout: "vertical",
          contents: [
            { type: "text", text: "已有網站", weight: "bold", size: "lg", align: "center" },
            { type: "text", text: "需要維護、升級或加上新功能", wrap: true, size: "sm", color: "#555555", align: "center", margin: "md" },
            {
              type: "button",
              style: "primary",
              color: "#4e7699",
              margin: "md",
              action: { type: "postback", label: "網站維護", data: "action=need&need=web_maintenance", displayText: "我想維護現有網站" }
            }
          ]
        }
      ],
      paddingAll: "20px"
    }
  };
  