// flex/bubble/applyDayBubble.js
// 以「日期」為主的一張卡，內含多個梯次按鈕（通常 2 個）
// 可調：字體/標籤顏色、分隔線、hero 大小（aspectRatio/Mode/Size），hero 可點擊

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
  
  function thickSeparator(color = '#6B7280', thickness = 3, margin = 'sm') {
    const t = Math.max(1, Number(thickness) || 1);
    if (t === 1) return { type: 'separator', color, margin };
    return {
      type: 'box', layout: 'vertical', margin, spacing: 'none',
      contents: Array.from({ length: t }, () => ({ type: 'separator', color }))
    };
  }
  
  function renderTag(text, ui) {
    const pill = ui.tagStyle === 'pill';
    if (!pill) return { type: 'text', text, size: 'xs', color: ui.tagColor || '#6B7280' };
    return {
      type: 'box', layout: 'horizontal', backgroundColor: ui.tagBgColor || '#EEF2FF',
      cornerRadius: 'xxl', paddingAll: '6px',
      contents: [{ type: 'text', text, size: 'xs', color: ui.tagTextColor || '#4338CA', wrap: false }]
    };
  }
  
  /**
   * day = { date, title, subtitle, hero, heroLink?, detailUrl?, location, price, tags?, slots:[{ id,title,time,applyUrl,detailUrl?,status? }, ...] }
   * ui  = {
   *   bubbleSize?, brandColor?, titleColor?, subtitleColor?, infoColor?, slotTitleColor?, slotTimeColor?,
   *   showTags?, tagStyle?, tagColor?, tagBgColor?, tagTextColor?,
   *   soldOutLabel?, closedLabel?, showSpots?,
   *   slotSeparatorColor?, slotSeparatorThickness?,
   *   // ⬇ 新增：控制 hero 大小/裁切
   *   heroAspectRatio?: '4:3'|'3:2'|'1:1'|'16:9'|'3:4'|'20:13'|string,
   *   heroAspectMode?: 'cover'|'fit',
   *   heroSize?: 'full'|'xxl'|'xl'|'lg'|'md'|'sm',
   *   heroBgColor?: '#FFFFFF'
   * }
   */
  function applyDayBubble(day, ui = {}) {
    // 顏色設定
    const brand = ui.brandColor || '#16A34A';
    const titleColor = ui.titleColor || '#111827';
    const subtitleColor = ui.subtitleColor || '#6B7280';
    const infoColor = ui.infoColor || '#111827';
    const slotTitleColor = ui.slotTitleColor || '#111827';
    const slotTimeColor = ui.slotTimeColor || '#6B7280';
  
    const soldOutLabel = ui.soldOutLabel || '已額滿';
    const closedLabel  = ui.closedLabel  || '已截止';
  
    const sepColor = ui.slotSeparatorColor || '#6B7280';
    const sepThickness = Math.max(1, Number(ui.slotSeparatorThickness) || 3);
  
    const hero = ensureHttps(day.hero, 'https://picsum.photos/1200/800');
    const title = String(day.title || (day.date ? `${day.date} 活動場次` : '活動場次'));
    const subtitle = String(day.subtitle || '擇一梯次參加');
    const location = day.location ? String(day.location) : '';
    const priceTxt = normalizePrice(day.price, '免費');
    const tags = Array.isArray(day.tags) ? day.tags.slice(0, 4) : [];
  
    // 梯次 rows
    const rawSlots = Array.isArray(day.slots) ? day.slots.filter(Boolean) : [];
    const slotBlocks = [];
    rawSlots.forEach((s, idx) => {
      if (idx === 0) slotBlocks.push(thickSeparator(sepColor, sepThickness, 'md'));
      const status = s.status || 'open';
      const label = status === 'full' ? soldOutLabel : (status === 'closed' ? closedLabel : '報名');
      const style = status === 'open' ? 'primary' : 'secondary';
  
      slotBlocks.push({
        type: 'box', layout: 'horizontal', margin: idx === 0 ? 'md' : 'sm',
        contents: [
          {
            type: 'box', layout: 'vertical', flex: 5,
            contents: [
              { type: 'text', text: s.title || `梯次 ${idx + 1}`, weight: 'bold', size: 'sm', color: slotTitleColor, wrap: true },
              ...(s.time ? [{ type: 'text', text: s.time, size: 'xs', color: slotTimeColor }] : [])
            ]
          },
          {
            type: 'button', style, color: brand, flex: 3,
            action: { type: 'uri', label, uri: ensureHttps(s.applyUrl, 'https://example.com/apply') }
          }
        ]
      });
      if (idx < rawSlots.length - 1) slotBlocks.push(thickSeparator(sepColor, sepThickness, 'sm'));
    });
  
    const tagRow = (ui.showTags && tags.length)
      ? [{ type: 'box', layout: 'baseline', margin: 'sm', spacing: 'sm', contents: tags.map(t => renderTag(`#${t}`, ui)) }]
      : [];
  
    // hero 點擊連結（優先序）
    const firstLinkSlot = rawSlots.find(s => s.detailUrl || s.applyUrl) || {};
    const heroActionUrl = ensureHttps(
      day.heroLink || day.detailUrl || firstLinkSlot.detailUrl || firstLinkSlot.applyUrl || hero,
      hero
    );
  
    return {
      type: 'bubble',
      size: ui.bubbleSize || 'kilo',
      hero: {
        type: 'image',
        url: hero,
        size: ui.heroSize || 'full',
        aspectRatio: ui.heroAspectRatio || '3:4',   // ⬅ 這裡改比例就會變高/變方
        aspectMode: ui.heroAspectMode || 'fit',   // 想完整看海報用 'fit'
        backgroundColor: ui.heroBgColor || '#FFFFFF',
        action: { type: 'uri', label: '查看詳情', uri: heroActionUrl }
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm',
        contents: [
          { type: 'text', text: title, weight: 'bold', size: 'lg', color: titleColor, wrap: true },
          { type: 'text', text: subtitle, size: 'sm', color: subtitleColor, wrap: true },
          { type: 'separator', margin: 'md' },
          {
            type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs',
            contents: [
              ...(day.date ? [{ type: 'text', text: `日期：${day.date}`, size: 'sm', color: infoColor, wrap: true }] : []),
              ...(location ? [{ type: 'text', text: `地點：${location}`, size: 'sm', color: infoColor, wrap: true }] : []),
              { type: 'text', text: `費用：${priceTxt}`, size: 'sm', color: infoColor, wrap: true }
            ]
          },
          ...slotBlocks,
          ...tagRow
        ]
      }
    };
  }
  
  module.exports = applyDayBubble;
  
  
// // flex/bubble/applyDayBubble.js
// // 以「日期」為主的一張卡，內含多個梯次按鈕（通常 2 個）

// function ensureHttps(u, fallback) {
//     if (!u || typeof u !== 'string') return fallback;
//     if (/^(https?:|tel:|mailto:)/i.test(u)) return u;
//     return 'https://' + u.replace(/^\/+/, '');
//   }
  
//   function normalizePrice(price, freeLabel = '免費') {
//     if (price === 0 || price === '0') return freeLabel;
//     if (typeof price === 'number' && !Number.isNaN(price)) return `${price} 元`;
//     if (typeof price === 'string' && price.trim()) return price.trim();
//     return freeLabel;
//   }
  
//   /**
//    * day = {
//    *   date: "2025-09-20",
//    *   title: "9/20 編織桂竹永續營",
//    *   subtitle: "擇一梯次參加",
//    *   hero: "https://.../ruma-20250920-hero.jpg",
//    *   location: "桃園市復興區 ...",
//    *   price: "研習免費" | 0 | number,
//    *   tags?: ["桂竹", "竹藝"],
//    *   slots: [
//    *     { id, title: "第一梯次", time: "08:50–13:30", applyUrl, status?: 'open'|'full'|'closed', detailUrl? },
//    *     { id, title: "第二梯次", time: "10:00–15:30", applyUrl, status?: 'open'|'full'|'closed', detailUrl? }
//    *   ]
//    * }
//    *
//    * ui = {
//    *   bubbleSize?: 'kilo'|'mega',
//    *   brandColor?: '#16A34A',
//    *   soldOutLabel?: '已額滿',
//    *   closedLabel?: '已截止'
//    * }
//    */
//   function applyDayBubble(day, ui = {}) {
//     const brand = ui.brandColor || '#16A34A';
//     const soldOutLabel = ui.soldOutLabel || '已額滿';
//     const closedLabel  = ui.closedLabel  || '已截止';
  
//     const hero = ensureHttps(day.hero, 'https://picsum.photos/1200/800');
//     const title = String(day.title || (day.date ? `${day.date} 活動場次` : '活動場次'));
//     const subtitle = String(day.subtitle || '擇一梯次參加');
//     const location = day.location ? String(day.location) : '';
//     const priceTxt = normalizePrice(day.price, '免費');
//     const tags = Array.isArray(day.tags) ? day.tags.slice(0, 4) : [];
  
//     const slotRows = (day.slots || []).filter(Boolean).map((s, idx) => {
//       const status = s.status || 'open';
//       const label =
//         status === 'full'   ? soldOutLabel :
//         status === 'closed' ? closedLabel  : '報名';
//       const style = status === 'open' ? 'primary' : 'secondary';
  
//       return {
//         type: 'box',
//         layout: 'horizontal',
//         margin: idx === 0 ? 'md' : 'sm',
//         contents: [
//           {
//             type: 'box',
//             layout: 'vertical',
//             flex: 5,
//             contents: [
//               { type: 'text', text: s.title || `梯次 ${idx+1}`, weight: 'bold', size: 'sm', wrap: true },
//               ...(s.time ? [{ type: 'text', text: s.time, size: 'xs', color: '#666666' }] : [])
//             ]
//           },
//           {
//             type: 'button',
//             style,
//             color: brand,
//             flex: 3,
//             action: { type: 'uri', label, uri: ensureHttps(s.applyUrl, 'https://example.com/apply') }
//           }
//         ]
//       };
//     });
  
//     const tagRow = tags.length ? [{
//       type: 'box', layout: 'baseline', margin: 'sm',
//       contents: tags.map(t => ({ type: 'text', text: `#${t}`, size: 'xs', color: '#6B7280' }))
//     }] : [];
  
//     return {
//       type: 'bubble',
//       size: 'mega' || ui.bubbleSize,
//       hero: { type: 'image', url: hero, size: 'full', aspectRatio: '3:2', aspectMode: 'cover' },
//       body: {
//         type: 'box', layout: 'vertical', spacing: 'sm',
//         contents: [
//           { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
//           { type: 'text', text: subtitle, size: 'sm', color: '#666666', wrap: true },
//           { type: 'separator', margin: 'md' },
//           {
//             type: 'box', layout: 'vertical', margin: 'md', spacing: 'xs',
//             contents: [
//               ...(day.date ? [{ type: 'text', text: `日期：${day.date}`, size: 'sm', wrap: true }] : []),
//               ...(location ? [{ type: 'text', text: `地點：${location}`, size: 'sm', wrap: true }] : []),
//               { type: 'text', text: `費用：${priceTxt}`, size: 'sm', wrap: true }
//             ]
//           },
//           ...slotRows,
//           ...tagRow
//         ]
//       }
//     };
//   }
  
//   module.exports = applyDayBubble;
  