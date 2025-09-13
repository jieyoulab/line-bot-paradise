const buildQuickReplyPostback = require('../../../flex/utils/quickReplyPostback');
const videoCarousel = require('../../../flex/carousel/videoCarousel');

async function handle({ event, client }) {
  const videos = [
    { id: '6b5xWReFzWI', title: '復興桂竹EP.1－竹林生態與產業現況', channel: '街角光影像-桃園市復興區-區域創生紀錄', url: 'https://youtu.be/6b5xWReFzWI?si=jHyqHV1B0x0wvrKg' },
    { id: 'GVkD-SNYjv8', title: '復興桂竹EP.2－歷史脈絡與泰雅文化', channel: '街角光影像-桃園市復興區-區域創生紀錄', url: 'https://youtu.be/GVkD-SNYjv8?si=yS76EGctorZVbCsR' },
    { id: '2xj0L1kaY8s', title: '復興桂竹EP.3－返鄉初心與未來發展', channel: '街角光影像-桃園市復興區-區域創生紀錄', url: 'https://youtu.be/2xj0L1kaY8s?si=m0fon_t2fcDPJfaj' }
  ];

  const contents = videoCarousel(videos, { color: '#768c5d', size: 'deca' });

  const { quickReply } = buildQuickReplyPostback({
    text: '',
    items: [
      { label: '復興桂竹系列', data: 'action=yt_bamboo_list' }, // 當前
      { label: '泰雅族與桂竹', data: 'action=yt_atayal__list' },
      { label: '桂竹協會系列', data: 'action=yt_corporate__list' }
    ]
  });

  await client.replyMessage(event.replyToken, {
    type: 'flex',
    altText: '復興桂竹系列影片',
    contents,
    quickReply
  });
  return true;
}
module.exports = { handle };

// // handlers/postback/ytBambooList.js
// const buildQuickReplyPostback = require('../../flex/utils/quickReplyPostback');

// // --- 產生 YouTube 影片 bubble ---
// function videoBubble({ id, title, channel, url }) {
//   return {
//     type: 'bubble',
//     size: 'deca',// 👈 改這裡：'nano' | 'micro'|'deca' | 'hecto'|'kilo' | 'mega' | 'giga'
//     hero: {
//       type: 'image',
//       url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
//       size: 'full', //橫向滿版
//       aspectRatio: '16:9',
//       aspectMode: 'cover',
//       action: { type: 'uri', uri: url }
//     },
//     body: {
//       type: 'box',
//       layout: 'vertical',
//       spacing: 'sm',
//       contents: [
//         { type: 'text', text: title, weight: 'bold', size: 'md', wrap: true },
//         { type: 'text', text: channel, size: 'sm', color: '#777777', wrap: true }
//       ]
//     },
//     footer: {
//       type: 'box',
//       layout: 'vertical',
//       contents: [
//         { 
//             type: 'button', 
//             style: 'primary', 
//             color: "#768c5d",   // 👈 自訂背景色
//             height: "sm",       // 可選：縮小按鈕高度
//             action: { type: 'uri', label: '觀看影片', uri: url } }
//       ]
//     }
//   };
// }

// // --- 主處理：回 Carousel + 把 quickReply 掛在同一則訊息上 ---
// async function handle({ event, client /*, tenant, data */ }) {
//   // 1) 你的內容（示範 3 支）
//   const videos = [ //id是youtube影片網址
//     { id: '6b5xWReFzWI', title: '復興桂竹EP.1－竹林生態與產業現況',   channel: '街角光影像-桃園市復興區-區域創生紀錄', url: 'https://youtu.be/6b5xWReFzWI?si=jHyqHV1B0x0wvrKg' },
//     { id: 'GVkD-SNYjv8', title: '復興桂竹EP.2－歷史脈絡與泰雅文化', channel: '街角光影像-桃園市復興區-區域創生紀錄', url: 'https://youtu.be/GVkD-SNYjv8?si=yS76EGctorZVbCsR' },
//     { id: '2xj0L1kaY8s', title: '復興桂竹EP.3－返鄉初心與未來發展', channel: '街角光影像-桃園市復興區-區域創生紀錄', url: 'https://youtu.be/2xj0L1kaY8s?si=m0fon_t2fcDPJfaj' }
//   ];
//   const contents = { type: 'carousel', contents: videos.map(videoBubble) };

//   // 2) 準備 quickReply（三顆 postback，跟剛剛那組相同）
//   const { quickReply } = buildQuickReplyPostback({
//     // 這裡 text 不會用到，因為我們只拿 quickReply 物件掛到 Flex
//     text: '',
//     items: [
//       { label: '復興桂竹系列', data: 'action=yt_bamboo_list' },
//       { label: '泰雅族與桂竹', data: 'action=yt_atayal__list' },
//       { label: '桂竹協會系列', data: 'action=yt_corporate__list' }
//     ]
//   });

//   // 3) 回覆 Flex，並把 quickReply 掛在「同一則」訊息上
//   await client.replyMessage(event.replyToken, {
//     type: 'flex',
//     altText: '復興桂竹系列影片',
//     contents,
//     quickReply // ← 關鍵：掛在這裡，底部就會顯示那三顆按鈕
//   });

//   return true;
// }

// module.exports = { handle };
