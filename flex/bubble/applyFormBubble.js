// flex/bubble/applyFormBubble.js
// 單一活動 Bubble（含 hero 圖、活動資訊、報名/詳情按鈕），支援 ui 設定

function ensureHttps(u, fallback) {
  if (!u || typeof u !== 'string') return fallback;
  if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
  return 'https://' + u.replace(/^\/+/, '');
}

function normalizePrice(price, freeLabel = '免費') {
  if (price === 0 || price === '0') return freeLabel;
  if (typeof price === 'number' && !Number.isNaN(price)) return `${price} 元`;
  if (typeof price === 'string' && price.trim()) return price.trim();
  return freeLabel;
}

function sanitizeEvent(e = {}, ui = {}) {
  const placeholderImg = 'https://picsum.photos/1200/800';
  return {
    id: String(e.id || ''),
    name: String(e.name || '未命名活動'),
    desc: e.desc ? String(e.desc) : '',
    image: e.image ? ensureHttps(e.image, placeholderImg) : placeholderImg,
    date: String(e.date || ''),
    time: String(e.time || ''),
    location: String(e.location || ''),
    priceText: normalizePrice(e.price, ui.freeLabel || '免費'),
    status: (e.status || 'open'), // 'open' | 'full' | 'closed'
    spots: e.spots && typeof e.spots === 'object' ? e.spots : null, // { total, left }
    tags: Array.isArray(e.tags) ? e.tags : [],
    applyUrl: ensureHttps(e.applyUrl, 'https://example.com/apply'),
    detailUrl: e.detailUrl ? ensureHttps(e.detailUrl, null) : null
  };
}

/**
 * e: 活動資料
 * ui: {
 *   bubbleSize?: 'kilo' | 'mega' | ...
 *   showTags?: boolean
 *   showSpots?: boolean
 *   buttons?: [{ type:'uri'|'postback', label:'', key:'applyUrl'|'detailUrl', optional?:true }]
 *   soldOutLabel?: '已額滿'
 *   closedLabel?: '已截止'
 *   freeLabel?: '免費'
 *   brandColor?: '#16A34A'
 * }
 */
function applyFormBubble(eventInput, ui = {}) {
  const brand = ui.brandColor || '#16A34A';
  const soldOutLabel = ui.soldOutLabel || '已額滿';
  const closedLabel  = ui.closedLabel  || '已截止';

  const e = sanitizeEvent(eventInput, ui);

  // 標籤列
  const tagRow =
    ui.showTags && e.tags.length
      ? [{
          type: 'box',
          layout: 'baseline',
          margin: 'sm',
          contents: e.tags.slice(0, 4).map(t => ({
            type: 'text', text: `#${t}`, size: 'xs', color: '#6B7280', wrap: false
          }))
        }]
      : [];

  // 名額列
  const spotsRow =
    ui.showSpots && e.spots && typeof e.spots.left === 'number'
      ? [{
          type: 'text',
          text: (e.spots.left > 0)
            ? `名額 ${e.spots.left}/${e.spots.total ?? '-'}`
            : soldOutLabel,
          size: 'xs',
          color: (e.spots.left > 0) ? '#10B981' : '#EF4444',
          margin: 'sm'
        }]
      : [];

  // 若沒提供 ui.buttons，給預設按鈕（apply 一定有、detail 視資料有無）
  const btnConfig = (Array.isArray(ui.buttons) && ui.buttons.length)
    ? ui.buttons
    : [
        { type: 'uri', label: '立即報名', key: 'applyUrl' },
        ...(e.detailUrl ? [{ type: 'uri', label: '詳細資訊', key: 'detailUrl', optional: true }] : [])
      ];

  // 按鈕（由 btnConfig 描述，從資料 key 取 URL）
  const buttons = btnConfig.map(b => {
    const uri = e[b.key];
    if (!uri && b.optional) return null;

    // 只針對 "apply" 類型按鈕覆蓋文字
    const isApplyBtn = (b.key || '').toLowerCase().includes('apply');
    const dynamicLabel =
      isApplyBtn
        ? (e.status === 'full' ? soldOutLabel : (e.status === 'closed' ? closedLabel : b.label))
        : b.label;

    return {
      type: 'button',
      style: (e.status === 'open' ? 'primary' : 'secondary'),
      color: brand,
      action: (b.type === 'postback'
        ? { type: 'postback', label: dynamicLabel, data: e.id ? `${b.key}:${e.id}` : dynamicLabel }
        : { type: 'uri', label: dynamicLabel, uri: uri || 'https://example.com' }
      ),
      margin: 'sm'
    };
  }).filter(Boolean);

  // 文字區塊
  const timeLine = [e.date, e.time].filter(Boolean).join(' ');
  const subtitle = [timeLine, e.location].filter(Boolean).join(' ｜ ');

  const bodyContents = [
    { type: 'text', text: e.name, weight: 'bold', size: 'lg', wrap: true },
  ];
  if (e.desc) bodyContents.push({ type: 'text', text: e.desc, size: 'sm', wrap: true, color: '#6B7280' });
  if (subtitle) bodyContents.push({ type: 'text', text: subtitle, size: 'xs', wrap: true, color: '#999999' });
  bodyContents.push({ type: 'text', text: `費用：${e.priceText}`, size: 'xs', color: '#999999' });
  bodyContents.push(...tagRow, ...spotsRow);

  return {
    type: 'bubble',
    size: ui.bubbleSize || 'kilo',
    hero: { type: 'image', url: e.image, size: 'full', aspectRatio: '3:2', aspectMode: 'cover' },
    body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: bodyContents },
    footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: buttons }
  };
}

module.exports = applyFormBubble;


// // flex/bubble/applyFormBubble.js
// // 單一活動 Bubble（含 hero 圖、活動資訊、報名/詳情按鈕）

// function ensureHttps(u, fallback) {
//     if (!u || typeof u !== 'string') return fallback;
//     if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
//     return 'https://' + u.replace(/^\/+/, '');
//   }
  
//   function sanitizeEvent(e = {}) {
//     const placeholderImg = 'https://picsum.photos/800/450';
//     return {
//       id: String(e.id || ''),
//       name: String(e.name || '未命名活動'),
//       desc: e.desc ? String(e.desc) : '',
//       image: e.image ? ensureHttps(e.image, placeholderImg) : placeholderImg,
//       date: String(e.date || ''),
//       time: String(e.time || ''),
//       location: String(e.location || ''),
//       price: typeof e.price === 'number' ? e.price : (e.price ? Number(e.price) : undefined),
//       status: e.status || 'open', // 'open' | 'full' | 'closed'
//     //   spots: e.spots || null,
//       applyUrl: ensureHttps(e.applyUrl, 'https://example.com/apply'),
//       detailUrl: e.detailUrl ? ensureHttps(e.detailUrl, null) : null
//     };
//   }
  
//   function applyFormBubble(eventInput) {
//     const e = sanitizeEvent(eventInput);
  
//     const timeLine = [e.date, e.time].filter(Boolean).join(' ');
//     const subtitle = [timeLine, e.location].filter(Boolean).join(' ｜ ');
  
//     const primaryLabel =
//       e.status === 'full' ? '已額滿' :
//       (e.status === 'closed' ? '已截止' : '立即報名');
  
//     const footerButtons = [{
//       type: 'button',
//       style: e.status === 'open' ? 'primary' : 'secondary',
//       action: { type: 'uri', label: primaryLabel, uri: e.applyUrl }
//     }];
  
//     if (e.detailUrl) {
//       footerButtons.push({
//         type: 'button',
//         style: 'secondary',
//         action: { type: 'uri', label: '詳細資訊', uri: e.detailUrl }
//       });
//     }
  
//     const bodyContents = [
//       { type: 'text', text: e.name, weight: 'bold', size: 'lg', wrap: true },
//     ];
//     if (e.desc) bodyContents.push({ type: 'text', text: e.desc, size: 'sm', wrap: true, color: '#666666' });
//     if (subtitle) bodyContents.push({ type: 'text', text: subtitle, size: 'xs', wrap: true, color: '#999999' });
//     if (typeof e.price === 'number') bodyContents.push({ type: 'text', text: `費用：${e.price} 元`, size: 'xs', color: '#999999' });
//     if (e.spots && typeof e.spots.left === 'number') {
//     //   const txt = e.spots.left > 0 ? `剩餘名額：${e.spots.left}` : '剩餘名額：0';
//       bodyContents.push({ type: 'text', text: txt, size: 'xs', color: '#999999' });
//     }
  
//     return {
//       type: 'bubble',
//       size: 'kilo',
//       hero: { type: 'image', url: e.image, size: 'full', aspectRatio: '16:9', aspectMode: 'cover' },
//       body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: bodyContents },
//       footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: footerButtons }
//     };
//   }
  
//   module.exports = applyFormBubble;
  