// flex/bubble/applyFormBubble.js
// 單一活動 Bubble（含 hero 圖、活動資訊、報名/詳情按鈕）

function ensureHttps(u, fallback) {
    if (!u || typeof u !== 'string') return fallback;
    if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
    return 'https://' + u.replace(/^\/+/, '');
  }
  
  function sanitizeEvent(e = {}) {
    const placeholderImg = 'https://picsum.photos/800/450';
    return {
      id: String(e.id || ''),
      name: String(e.name || '未命名活動'),
      desc: e.desc ? String(e.desc) : '',
      image: e.image ? ensureHttps(e.image, placeholderImg) : placeholderImg,
      date: String(e.date || ''),
      time: String(e.time || ''),
      location: String(e.location || ''),
      price: typeof e.price === 'number' ? e.price : (e.price ? Number(e.price) : undefined),
      status: e.status || 'open', // 'open' | 'full' | 'closed'
    //   spots: e.spots || null,
      applyUrl: ensureHttps(e.applyUrl, 'https://example.com/apply'),
      detailUrl: e.detailUrl ? ensureHttps(e.detailUrl, null) : null
    };
  }
  
  function applyFormBubble(eventInput) {
    const e = sanitizeEvent(eventInput);
  
    const timeLine = [e.date, e.time].filter(Boolean).join(' ');
    const subtitle = [timeLine, e.location].filter(Boolean).join(' ｜ ');
  
    const primaryLabel =
      e.status === 'full' ? '已額滿' :
      (e.status === 'closed' ? '已截止' : '立即報名');
  
    const footerButtons = [{
      type: 'button',
      style: e.status === 'open' ? 'primary' : 'secondary',
      action: { type: 'uri', label: primaryLabel, uri: e.applyUrl }
    }];
  
    if (e.detailUrl) {
      footerButtons.push({
        type: 'button',
        style: 'secondary',
        action: { type: 'uri', label: '詳細資訊', uri: e.detailUrl }
      });
    }
  
    const bodyContents = [
      { type: 'text', text: e.name, weight: 'bold', size: 'lg', wrap: true },
    ];
    if (e.desc) bodyContents.push({ type: 'text', text: e.desc, size: 'sm', wrap: true, color: '#666666' });
    if (subtitle) bodyContents.push({ type: 'text', text: subtitle, size: 'xs', wrap: true, color: '#999999' });
    if (typeof e.price === 'number') bodyContents.push({ type: 'text', text: `費用：${e.price} 元`, size: 'xs', color: '#999999' });
    if (e.spots && typeof e.spots.left === 'number') {
    //   const txt = e.spots.left > 0 ? `剩餘名額：${e.spots.left}` : '剩餘名額：0';
      bodyContents.push({ type: 'text', text: txt, size: 'xs', color: '#999999' });
    }
  
    return {
      type: 'bubble',
      size: 'kilo',
      hero: { type: 'image', url: e.image, size: 'full', aspectRatio: '16:9', aspectMode: 'cover' },
      body: { type: 'box', layout: 'vertical', spacing: 'sm', contents: bodyContents },
      footer: { type: 'box', layout: 'vertical', spacing: 'sm', contents: footerButtons }
    };
  }
  
  module.exports = applyFormBubble;
  