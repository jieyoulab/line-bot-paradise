module.exports = {
    type: "bubble",
    size: "mega",
    hero: {
      type: "image",
      url: "https://i.postimg.cc/dtthXzNg/4.png",
      size: "full",
      aspectRatio: "3:2",
      aspectMode: "cover"
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "text", text: "🔄 進階方案(報名整合包)", weight: "bold", size: "lg", color: "#4e7699" },
        { type: "text", text: "包含 🌱 基礎方案 + 表單設計 + 自動寫入 + Email 通知 + LINE Pay（不含官方手續費）", size: "sm", wrap: true, color: "#444444" },
        { type: "separator", margin: "md" },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          margin: "md",
          contents: [
            { type: "text", text: "• 表單設計（Google 表單）", size: "sm", wrap: true },
            { type: "text", text: "• 自動寫入 + Email 通知", size: "sm", wrap: true },
            { type: "text", text: "• 串接 LINE Pay（報名與付款整合）", size: "sm", wrap: true }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "12px",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#9db0c1",
          action: {
            type: "postback",
            label: "查看內容明細",
            data: "action=view_plan&plan=pro"
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#4e7699",
          action: {
            type: "uri",
            label: "📝 填寫需求表單",
            uri: "https://docs.google.com/forms/d/e/1FAIpQLSdIWw7vChsH5jhvUPhjmOLotBqqwqu8zcoZJEc80zek_t-ARw/viewform"
          }
        }
      ]
    },
    styles: { footer: { separator: true } }
  };
  