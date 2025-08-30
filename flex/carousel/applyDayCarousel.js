// flex/carousel/applyDayCarousel.js
// 把 products 依 date 分組，輸出「日期卡」的 carousel

const applyDayBubble = require('../bubble/applyDayBubble');

function groupByDate(products = []) {
  const map = new Map();
  for (const p of products) {
    if (!p) continue;
    const d = String(p.date || '').trim();
    if (!d) continue;
    if (!map.has(d)) map.set(d, []);
    map.get(d).push(p);
  }
  // 日期排序（升冪）
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, items]) => ({ date, items }));
}

function guessSlotTitle(name, fallback) {
  if (!name) return fallback;
  const m = String(name).match(/(第一|第二|第三|第四)梯次/);
  return m ? m[0] : fallback;
}

/**
 * 用法：
 *   applyDayCarousel(config)  // config = { products, ui, dayTitleMap? }
 *   或
 *   applyDayCarousel(products, ui)
 */
function applyDayCarousel(input, maybeUi) {
  let products = [];
  let ui = {};
  let dayTitleMap = {};

  if (Array.isArray(input)) {
    products = input;
    ui = maybeUi || {};
  } else if (input && Array.isArray(input.products)) {
    products = input.products;
    ui = input.ui || {};
    dayTitleMap = input.dayTitleMap || {};
  }

  const groups = groupByDate(products);
  const bubbles = groups.map(g => {
    const first = g.items[0] || {};
    const title =
      dayTitleMap[g.date] ||
      (first.name ? first.name.replace(/｜.*$/, '') : `${g.date} 活動場次`);

    const slots = g.items.map((p, idx) => ({
      id: p.id,
      title: p.slotTitle || guessSlotTitle(p.name, `梯次 ${idx + 1}`),
      time: p.time || '',
      applyUrl: p.applyUrl,
      status: p.status || ((p.spots && p.spots.left === 0) ? 'full' : 'open'),
      detailUrl: p.detailUrl || null
    }));

    return applyDayBubble({
      date: g.date,
      title,
      subtitle: '擇一梯次參加',
      hero: first.image,
      location: first.location || '',
      price: (typeof first.price !== 'undefined') ? first.price : (ui.freeLabel || '免費'),
      tags: first.tags || [],
      slots
    }, ui);
  }).slice(0, 10); // LINE carousel 上限 10

  if (!bubbles.length) {
    return {
      type: 'carousel',
      contents: [{
        type: 'bubble',
        body: {
          type: 'box', layout: 'vertical',
          contents: [
            { type: 'text', text: '目前沒有可報名的活動', weight: 'bold', size: 'lg' },
            { type: 'text', text: '請稍後再試，或關注最新公告。', size: 'sm', color: '#666666' }
          ]
        }
      }]
    };
  }

  return { type: 'carousel', contents: bubbles };
}

module.exports = applyDayCarousel;
