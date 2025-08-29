// handlers/postback/ytCorporateList.js
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
  if (typeof v === 'string') return v;
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
  const img   = item.image || (id ? toThumb(id, true) : null);
  const title = item.title || 'YouTube 影片';
  const channel = item.channel || '';
  const desc    = item.desc || '';
  const director = item.director || null;
  const runtime  = formatRuntime(item.runtime);
  const publishedAt = item.publishedAt || null;

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
  // TODO: 將 VIDEO_ID_* 換成實際影片 ID；可自由增減、補 desc/導演/片長/日期
  const videos = [
    {
      id: 'NHV136BYmFI',
      title: '【竹編成器 X 桂竹工作坊】',
      channel: '桂竹協會',
      desc: [
        '冬耕春收，竹編工藝落地生根...'
      ].join('\n'),
    //   director: '——',
    //   runtime: 720,
    //   publishedAt: '2024-05-20',
      url: 'https://www.youtube.com/watch?v=NHV136BYmFI'
    },
    {
      id: 'rE42-6wLQAU',
      title: '【部落桂竹工坊 X 竹產業培力】',
      channel: '桂竹協會',
      desc: '從竹篾處理到竹編織的工藝課！由玉環絲竹編織工作室 謝玉環老師教學...',
    //   runtime: '10:12',
    //   publishedAt: '2024-07-03',
      url: 'https://www.youtube.com/watch?v=rE42-6wLQAU'
    },
    {
      id: 'hrBoGRrVYN0',
      title: '櫓榪小舖農產介紹-栗子地瓜',
      channel: '桂竹協會',
      desc: '栗子地瓜是來自日本的品種...。',
      //publishedAt: '2023-12-10',
      url: 'https://www.youtube.com/watch?v=hrBoGRrVYN0'
    }
  ];

  const contents = { type: 'carousel', contents: videos.slice(0, 10).map(videoBubble) };

  // Quick Reply（與其他頁一致）
  const { quickReply } = buildQuickReplyPostback({
    text: '',
    items: [
      { label: '復興桂竹系列', data: 'action=yt_bamboo_list' },
      { label: '泰雅族與桂竹', data: 'action=yt_atayal__list' },
      { label: '桂竹協會系列', data: 'action=yt_corporate__list' } // 當前頁
    ]
  });

  await client.replyMessage(event.replyToken, {
    type: 'flex',
    altText: '桂竹協會系列影片',
    contents,
    quickReply
  });

  return true;
}

module.exports = { handle };
