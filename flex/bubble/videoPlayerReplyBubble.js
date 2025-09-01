// flex/bubble/videoPlayerReplyBubble.js
module.exports = function videoPlayerBubble({
    mp4Url,
    previewUrl,
    ratio = "16:9", //"16:9", "20:13", "1:1", "3:4", "4:3" 等
    title = "櫓榪工作室 |《竹葉之青》｜導演：陳駿騰"
  }) {
    return {
      type: "bubble",
      size: "giga",
      hero: {
        type: "video",
        url: mp4Url,            // 必須是可直連 mp4
        previewUrl: previewUrl, // 建議使用 https://img.youtube.com/... 的圖
        aspectRatio: ratio,     // "16:9" | "20:13" | "1:1" | "3:4" ...
        // ★ 必填：提供點擊行為，且要有 label
        action: { type: "uri", label: "觀看影片", uri: mp4Url },
  
        // ★ 必填：altContent（裝置不支援 video 元件時顯示）
        altContent: {
          type: "image",
          url: previewUrl,
          size: "full",
          aspectRatio: ratio,    // 與上面一致，維持版面穩定
          aspectMode: "cover",
          action: { type: "uri", label: "觀看影片", uri: mp4Url }
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          { type: "text", text: title, weight: "bold", size: "md", wrap: true }
        ]
      }
    };
  };