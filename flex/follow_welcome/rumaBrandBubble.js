module.exports = {
    type: "bubble",
    hero: {
      type: "image",
      url: "https://i.imgur.com/4gG8m8n.png", // 可換品牌主視覺；不放 hero 也可
      size: "full",
      aspectRatio: "20:9",
      aspectMode: "cover"
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "🎋 櫓榪竹工作室 Ruma",
          weight: "bold",
          size: "lg",
          align: "center",
          color: "#2E5E4E"
        },
        {
          type: "text",
          text: "Craft with bamboo, bond with culture.",
          size: "sm",
          color: "#4F7B6D",
          margin: "sm",
          align: "center",
          wrap: true
        },
        {
          type: "text",
          text: "— 竹藝 × 文化體驗 × 在地合作 —",
          size: "md",
          color: "#A07B4F",
          wrap: true,
          margin: "md",
          align: "center"
        }
      ],
      paddingAll: "18px"
    },
    styles: { body: { backgroundColor: "#FBFBF8" } }
  };
  