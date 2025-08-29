// handlers/message/textHandler.js
// 目標：命中 keyword 回 Flex；若也命中 quickReply，就把 quickReply 掛在同一則 Flex 上

const path = require('path');
const fs = require('fs');
const axios = require('axios');
// const cheerio = require('cheerio'); // 若要用 Fami 抓取再打開（避免未定義）

// ===== Flex 產生器 =====
const productCard       = require('../../flex/bubble/productCard');
const productCarousel   = require('../../flex/carousel/productCarousel');
const partnerCard       = require('../../flex/bubble/partnerCard');
const partnerCarousel   = require('../../flex/carousel/partnerCarousel');

// ===== Quick Reply =====
const buildQuickReply           = require('../../flex/quickReply');                 // 舊：支援 message/uri
const buildQuickReplyPostback   = require('../../flex/utils/quickReplyPostback');  // 新：純 postback

// ====== 單檔 loader（讀 data/<tenant>/*.json） ======
function loadProducts(tenantKey) {
  const file = path.resolve(__dirname, `../../data/${tenantKey}/products.json`);
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return Array.isArray(data) ? data : [data];
}

function loadQuickReplies(tenantKey) {
  const file = path.resolve(__dirname, `../../data/${tenantKey}/quickReplies.json`);
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  return Array.isArray(data) ? data : [data];
}

// --- 小工具：把 quick reply 模板轉成訊息物件（會帶 quickReply 屬性）---
function renderQuickReplyMessage(tpl) {
  if (tpl.template === 'quickReplyPostback') {
    return buildQuickReplyPostback({
      text: `${tpl.keyword}：請選擇 👇`,
      items: tpl.items
    });
  }
  return buildQuickReply(tpl.items); // 舊格式：items 內可混 message/uri
}

// （可選）Famistore 商品資料：啟用時，記得把上面的 cheerio 解註
async function fetchProductFromFami(url) {
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const name = $('.product-title').text().trim();
  const img = $('.product-main-img img').attr('src');
  const specs = [];
  $('.spec-item').each((i, el) => {
    const specName = $(el).find('.spec-name').text().trim();
    const specPrice = $(el).find('.spec-price').text().trim();
    const specLink = $(el).find('a').attr('href');
    specs.push({ specName, specPrice, specLink });
  });
  return { name, img, specs };
}

// ====== 主流程 ======
async function handleTextMessage(event, client, tenant) {
  const text = event.message?.text || '';

  // 1) 同時比對（用 === 避免 includes 誤觸）
  const quickReplies = loadQuickReplies(tenant.key);
  const matchedQR = quickReplies.find(q => text === q.keyword);

  const templates = loadProducts(tenant.key);     // 這裡同時承載商品/夥伴等各種模板
  const matchedTemplates = templates.filter(t => text === t.keyword);

  // 2) 命中模板 → 依 template 決定 renderer；若也命中 QR 就把 quickReply 掛在同一則訊息上
  if (matchedTemplates.length > 0) {
    const tpl = matchedTemplates[0];              // ←★★ 用 tpl，避免未定義
    let contents;

    if (tpl.template === 'partnerCarousel') {
      const list = Array.isArray(tpl.partners) ? tpl.partners
                : Array.isArray(tpl.products) ? tpl.products
                : [];
      contents = partnerCarousel(list, { size: 'deca' });
    }
    else if (tpl.template === 'partnerCard') {
      contents = partnerCard(tpl, { size: 'deca' });
    }
    else if (tpl.template === 'productCarousel') {
      contents = (Array.isArray(tpl.products) && tpl.products.length > 0)
        ? productCarousel(tpl.products)
        : productCard(tpl); // 後備：只有一筆時就用單卡
    }
    else {
      // 預設當作 productCard
      contents = productCard(tpl);
    }

    const msg = {
      type: 'flex',
      altText: tpl.name || '內容',
      contents
    };

    if (matchedQR) {
      const { quickReply } = renderQuickReplyMessage(matchedQR); // 只掛 quickReply
      msg.quickReply = quickReply;
    }

    // ★ 新增：如果是合作夥伴模板，再多回一則「看介紹影片」的文字訊息（掛 postback quick reply）
    const messages = [msg];
    if (tpl.template === 'partnerCarousel' || tpl.template === 'partnerCard') {
      const videoQRMsg = buildQuickReplyPostback({
        text: '想更了解復興桂竹與泰雅族文化？點下方按鈕看介紹影片 👇',
        items: [
          { label: '復興桂竹系列', data: 'action=yt_bamboo_list' },
          { label: '泰雅族與桂竹', data: 'action=yt_atayal__list' },
          { label: '桂竹協會系列', data: 'action=yt_corporate__list' }
        ]
      });
      messages.push(videoQRMsg);

      
    }
    await client.replyMessage(event.replyToken, messages); 
    return true;
  }

  // 3) 僅命中 Quick Reply → 回「文字 + Quick Reply」
  if (matchedQR) {
    await client.replyMessage(event.replyToken, renderQuickReplyMessage(matchedQR));
    return true;
  }

  // 4) （可選）Famistore 連結 → 嘗試抓取並回 Flex
  if (text.includes('famistore.famiport.com.tw')) {
    try {
      // 使用前請確保已 require cheerio
      if (typeof cheerio === 'undefined') throw new Error('cheerio 未載入，請取消上方註解');
      const productData = await fetchProductFromFami(text);
      const contents = productCard(productData);

      await client.replyMessage(event.replyToken, [{
        type: 'flex',
        altText: productData.name || '商品資訊',
        contents
      }]);
      return true;
    } catch (err) {
      console.error('抓取 Famistore 失敗:', err);
      await client.replyMessage(event.replyToken, {
        type: 'text',
        text: '抱歉，商品資料抓取失敗，請稍後再試。'
      });
      return true;
    }
  }

  // 5) 都沒命中 → 交給外層 fallback（Echo）
  return false;
}

module.exports = { handleTextMessage };
