// flex/bubble/partnerCard.js
// -----------------------------------------------------------------------------
// 夥伴用的單張 Bubble
// -----------------------------------------------------------------------------

const MAX_BTNS = 3;
const BRAND = '#768c5d';

const isHttp   = u => typeof u === 'string' && /^https?:\/\/.+/i.test(u);
const isTel    = u => typeof u === 'string' && /^tel:\+?\d[\d-]*$/i.test(u);
const isMailto = u => typeof u === 'string' && /^mailto:.+@.+/i.test(u);

// tel: 轉換（移除空白、破折等）
function toTelUri(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : null;
}

// mailto: 轉換
function toMailto(email) {
  if (!email) return null;
  const e = String(email).trim();
  return e.includes('@') ? `mailto:${e}` : null;
}

// 產生 footer 按鈕（僅收合規的 action）
// ⚠️ 改：此版本改為接收「已正規化」的欄位
function buildFooterButtons(p) {
  const actions = [];

  if (isHttp(p.url)) {
    actions.push({ type: 'uri', label: '臉書專頁', uri: p.url });
    if (isHttp(p.url_ig)) actions.push({ type: 'uri', label: 'IG粉專', uri: p.url_ig }); 
    // if (isHttp(p.mapUrl)) actions.push({ type: 'uri', label: '查看地圖', uri: p.mapUrl });
  }
  // if (isHttp(p.mapUrl)) {
  //   actions.push({ type: 'uri', label: '查看地圖', uri: p.mapUrl });
  // }
  // if (p.telUri && isTel(p.telUri)) {
  //   actions.push({ type: 'uri', label: '撥打電話', uri: p.telUri });
  // }
  // if (p.mailUri && isMailto(p.mailUri)) {
  //   actions.push({ type: 'uri', label: '寄送Email', uri: p.mailUri });
  // }

  return actions.slice(0, MAX_BTNS).map(a => ({
    type: 'button',
    style: 'primary',
    color: BRAND,
    height: 'sm',
    action: a
  }));
}

/**
 * 夥伴單卡
 * @param {Object} partner - { name, image, desc, address, phone, email, url, mapUrl }
 * @param {Object} opts    - { size='deca' }
 */
module.exports = function partnerCard(partner = {}, opts = {}) {
  const size    = opts.size || 'deca';         // ✅ 用 opts.size
  const name    = partner.name    || '合作夥伴';
  const image   = (partner.image  || '').trim(); // ✅ 先 trim
  const desc    = partner.desc    || '';
  const address = partner.address || '';
  const phone   = partner.phone   || '';
  const email   = partner.email   || '';

  // 自動產 mapUrl（若未提供）
  const mapUrlAuto =
    partner.mapUrl ||
    (partner.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${partner.name || ''} ${partner.address}`)}`
      : null);

  // 先把會用到的連結都正規化好，再交給 buildFooterButtons
  const telUri  = toTelUri(phone);
  const mailUri = toMailto(email);

  const footerButtons = buildFooterButtons({
    url: partner.url,
    url_ig: partner.url_ig, 
    mapUrl: mapUrlAuto, // ✅ 這裡改用 auto 結果
    telUri,
    mailUri
  });

  // 組 body
  const bodyContents = [
    { type: 'text', text: name, weight: 'bold', size: 'lg', wrap: true },
    ...(desc    ? [{ type: 'text', text: desc,    size: 'sm', color: '#666666', wrap: true }] : []),
    ...(address ? [{ type: 'text', text: `📍 ${address}`, size: 'xs', color: '#999999', wrap: true }] : []),
    ...(phone   ? [{ type: 'text', text: `📞 ${phone}`,   size: 'xs', color: '#999999' }] : []),
    ...(email   ? [{ type: 'text', text: `✉️ ${email}`,   size: 'xs', color: '#999999' }] : []),
  ];

  const bubble = {
    type: 'bubble',
    size, // ✅ 套用外部 size
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: bodyContents
    }
  };

  // hero（有圖才放）
  if (isHttp(image)) {
    bubble.hero = {
      type: 'image',
      url: image,
      size: 'full',
      aspectMode: 'cover',
      aspectRatio: '16:9',
      action: (partner.url && isHttp(partner.url)) ? { type: 'uri', uri: partner.url } : undefined
    };
  }

  // footer（有任一有效 action 才放）
  if (footerButtons.length > 0) {
    bubble.footer = {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: footerButtons
    };
  }

  return bubble;
};
