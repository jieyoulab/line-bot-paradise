// handlers/message/textHandler.js
// 目標：命中 keyword 回 Flex；若也命中 quickReply，就把 quickReply 掛在同一則 Flex 上

const path = require('path');
const fs = require('fs');
const axios = require('axios');
// const cheerio = require('cheerio'); // 若要用 Fami 抓取再打開

// Flex 產生器（位於專案根的 flex/，此檔案在 handlers/message/ 底下 → ../../）
const productCard     = require('../../flex/bubble/productCard');
const productCarousel = require('../../flex/carousel/productCarousel');
// Quick Reply builder（統一用這個名稱）
const buildQuickReply = require('../../flex/quickReply');

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

// （可選）Famistore 商品資料
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

  const products = loadProducts(tenant.key);
  const matchedProducts = products.filter(p => text === p.keyword);

  // 2) 命中商品 → 組 Flex；若也命中 QR 就掛在 Flex 上
  if (matchedProducts.length > 0) {
    const product = matchedProducts[0];
    let contents;

    if (product.template === 'productCarousel') {
      contents = (Array.isArray(product.products) && product.products.length > 0)
        ? productCarousel(product.products)
        : productCard(product);
    } else {
      contents = productCard(product);
    }

    const msg = {
      type: 'flex',
      altText: product.name || '內容',
      contents
    };

    if (matchedQR) {
      const { quickReply } = buildQuickReply(matchedQR.items); // 只取 quickReply 區塊
      msg.quickReply = quickReply;
    }

    await client.replyMessage(event.replyToken, [msg]);
    return true;
  }

  // 3) 僅命中 Quick Reply → 回「文字 + Quick Reply」
  if (matchedQR) {
    await client.replyMessage(event.replyToken, buildQuickReply(matchedQR.items));
    return true;
  }

  // 4) （可選）Famistore 連結 → 嘗試抓取並回 Flex
  if (text.includes('famistore.famiport.com.tw')) {
    try {
      // 若要啟用，記得把上面的 cheerio require 打開
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
