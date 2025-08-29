// handlers/postback/ytAtayalList.js
const buildQuickReplyPostback = require('../../flex/utils/quickReplyPostback');

/** 產生 YouTube 縮圖 URL */
function toThumb(id, preferMaxRes = true) {
  return preferMaxRes
    ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
    : `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
const isHttp = u => typeof u === 'string' && /^https?:\/\/.+/i.test(u);

/** 將秒數或 "1:23:45" 樣式轉成統一顯示（可傳 string 或 number） */
function formatRuntime(v) {
  if (!v && v !== 0) return null;
  if (typeof v === 'string') return v; // 已是 "1:23:45" 或 "mm:ss"
  const sec = Math.max(0, Number(v) || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

/** 單張 YouTube Bubble：支援多行描述與 meta（導演／片長／上架日期） */
function videoBubble(item) {
  const id    = item.id;
  const url   = item.url || (id ? `https://www.youtube.com/watch?v=${id}` : null);
  const img   = item.image || (id ? toThumb(id, true) : null); // 若遇到空白圖，可改成 toThumb(id, false)
  const title = item.title || 'YouTube 影片';
  const channel = item.channel || '';      // 建議放「頻道名稱」
  const desc    = item.desc || '';         // 多行描述：可放 \n 斷行
  const director = item.director || null;  // 導演
  const runtime  = formatRuntime(item.runtime); // 片長：秒數或 "mm:ss" / "hh:mm:ss"
  const publishedAt = item.publishedAt || null; // 上架日期（字串）

  const metaLines = [
    director ? `導演：${director}` : null,
    runtime  ? `片長：${runtime}`   : null,
    publishedAt ? `上架：${publishedAt}` : null
  ].filter(Boolean);

  return {
    type: 'bubble',
    size: 'deca',
    ...(img ? {
      hero: {
        type: 'image',
        url: img,
        size: 'full',
        aspectRatio: '16:9',
        aspectMode: 'cover',
        action: (url && isHttp(url)) ? { type: 'uri', uri: url } : undefined
      }
    } : {}),
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        { type: 'text', text: title, weight: 'bold', size: 'md', wrap: true, maxLines: 3 },
        ...(channel ? [{ type: 'text', text: channel, size: 'sm', color: '#777777', wrap: true, maxLines: 2 }] : []),
        ...(desc ? [{ type: 'text', text: desc, size: 'sm', color: '#555555', wrap: true, maxLines: 6 }] : []),
        ...(metaLines.length ? [{
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          margin: 'sm',
          contents: metaLines.map(t => ({ type: 'text', text: t, size: 'xs', color: '#888888', wrap: true }))
        }] : [])
      ]
    },
    ...(url && isHttp(url) ? {
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#768c5d',
            height: 'sm',
            action: { type: 'uri', label: '觀看影片', uri: url }
          }
        ]
      }
    } : {})
  };
}

// --- 主處理：回 Carousel + 把 quickReply 掛在同一則訊息上 ---
async function handle({ event, client /*, tenant, data */ }) {
  // 你的內容（可自由新增／調整）
  const videos = [
    {
        id: 'AofMLXTXyBA',
        title: '《竹葉之青》-2023桃園城市紀錄片',
        channel: '桃園城市紀錄片',
        desc: '阿山與櫓祝是一對在部落長大的夫妻，他們想透過伐竹經驗來為部落創造工作機會...',
        //director: '陳駿騰',
        //runtime: 835,
        //publishedAt: '2023年6月13日',
        url: 'https://www.youtube.com/watch?v=AofMLXTXyBA'
    },
    {
      id: 'YuKFv-64fJs',
      title: '《築業之間》山林裡的寶藏：泰雅族與桂竹',
      channel: '2023地創微電影入圍影片',
      desc: [
        '桃園復興泰雅青年們在蓊鬱的桂竹林中，一刀一劍揮出竹產業的希望。從產地到市場...'
      ].join('\n'),
      //director: '導演-陳駿騰',
      //runtime: '24:20',                 // 或秒數 754
      //publishedAt: '2023年12月12日',        // 任意字串也可
      url: 'https://www.youtube.com/watch?v=YuKFv-64fJs&t=184s'
    },
    {
      id: 'o8585w37PZM',
      title: '櫓榪竹工作室_ Ruma竹業 升級在地創生',
      channel: '原視 TITV+',
      desc: 'CEO是來自桃園復興區義興部落的櫓祝，為了推廣泰雅族竹子文化...',
      //director: '——',
      //runtime: '48:40',
      //publishedAt: '2024-12-10',
      url: 'https://www.youtube.com/watch?v=o8585w37PZM&t=1s'
    }
  ];

  const contents = { type: 'carousel', contents: videos.map(videoBubble) };

  // Quick Reply（與其他頁一致）
  const { quickReply } = buildQuickReplyPostback({
    text: '',
    items: [
      { label: '復興桂竹系列', data: 'action=yt_bamboo_list' },
      { label: '泰雅族與桂竹', data: 'action=yt_atayal__list' },   // 當前頁
      { label: '桂竹協會系列', data: 'action=yt_corporate__list' }
    ]
  });

  await client.replyMessage(event.replyToken, {
    type: 'flex',
    altText: '泰雅族與桂竹系列影片',
    contents,
    quickReply
  });

  return true;
}

module.exports = { handle };
