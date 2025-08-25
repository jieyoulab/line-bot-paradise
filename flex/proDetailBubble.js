module.exports = {
    type: "bubble",
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "text", text: "🔄 進階方案｜內容明細", weight: "bold", size: "lg", color: "#4e7699" },
        { type: "text", text: "已包含 🌱 基礎方案功能", size: "xs", color: "#888888" },
        { type: "separator", margin: "md" },
  
        { type: "text", text: "1️⃣ 表單設計", weight: "bold", size: "sm", margin: "md" },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            { type: "text", text: "✅ Google 表單建立：報名欄位設計與連結整合", size: "sm", wrap: true },
            { type: "text", text: "建議價格：NT$1,500起", size: "xs", align: "end", color: "#4e7699" }
          ]
        },
  
        { type: "separator", margin: "md" },
        { type: "text", text: "2️⃣ 自動寫入 Google Drive + Email 通知", weight: "bold", size: "sm", margin: "md" },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            { type: "text", text: "✅ 表單自動記錄與 Email 通知（表單 → 試算表 → 寄送通知）", size: "sm", wrap: true },
            { type: "text", text: "✅ LINE 客製化表單：LINE 內開啟與填寫，自動帶入用戶資訊（不含外觀設計與資料庫建置）", size: "sm", wrap: true },
            { type: "text", text: "自動記錄／Email：NT$2,000起", size: "xs", align: "end", color: "#4e7699" },
            { type: "text", text: "LINE 客製化表單：NT$5,000～12,000", size: "xs", align: "end", color: "#4e7699" }
          ]
        },
  
        { type: "separator", margin: "md" },
        { type: "text", text: "3️⃣ 接 LINE Pay（金流系統）", weight: "bold", size: "sm", margin: "md" },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            { type: "text", text: "✅ 串接 LINE Pay：建立付款流程、報名整合、票券產出", size: "sm", wrap: true },
            { type: "text", text: "✅ 退款功能支援：商家後台協助／自動退款設計", size: "sm", wrap: true },
            { type: "text", text: "LINE Pay 串接：NT$7,000 起", size: "xs", align: "end", color: "#4e7699" }
          ]
        },
  
        { type: "separator", margin: "md" },
        { type: "text", text: "官方費用：LINE Pay 3% + NT$10／筆（由 LINE 官方收取）", size: "xs", color: "#888888", wrap: true },
  
        { type: "separator", margin: "md" },
        // { type: "text", text: "進階方案參考價：NT$27,500 起", size: "sm", align: "end", color: "#4e7699", wrap: true },
        { type: "text", text: "不含 LINE Pay 官方手續費以及伺服器費用", size: "sm", align: "end", color: "#4e7699", wrap: true }
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
          style: "secondary",
          action: {
            type: "postback",
            label: "⬅️ 回方案列表",
            data: "action=line_oa_build"   //line_oa_build
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
  