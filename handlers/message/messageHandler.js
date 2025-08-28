const path = require('path');
const fs = require('fs');
const axios = require('axios');
// const cheerio = require('cheerio');

// 載入所有模板 function
const productCard = require('../flex/bubble/productCard');
const productCarousel = require('../flex/carousel/productCarousel');
const quickReply = require('../flex/quickReply');

// 用 Map 做對應：key = JSON 裡的 template 名稱
const templateMap = {
  productCard,
  productCarousel,
  quickReply
};

function loadProducts(tenantKey) {
  const file = path.resolve(__dirname, `../data/${tenantKey}/products.json`);
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));

  // 如果讀到單一物件或 carousel 物件，包成陣列
  return Array.isArray(data) ? data : [data];
}

function loadQuickReplies(tenantKey) {
  const file = path.resolve(__dirname, `../data/${tenantKey}/quickReplies.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

// 抓取 Famistore 商品資料
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

// 處理 json 資料
async function handleTextMessage(event, client, tenant) {
  const text = event.message?.text || "";

  // ----------------------------
  // 1️⃣ Quick Reply 檢查
  // ----------------------------
  const quickReplies = loadQuickReplies(tenant.key);
  const matchedQR = quickReplies.find(q => text.includes(q.keyword));
  if (matchedQR) {
    const contents = quickReply(matchedQR.items);
    await client.replyMessage(event.replyToken, contents);
    return true;
  }


  // ----------------------------
  // 2️⃣ Flex Message / 商品檢查
  // ----------------------------
  const products = loadProducts(tenant.key);

  // ⓵ 找出符合 keyword 的商品
  const matchedProducts = products.filter(p => text.includes(p.keyword));

  if (matchedProducts.length > 0) {
    let contents;
    const product = matchedProducts[0]; // 取第一個匹配的

    if (product.template === 'productCarousel') {
      // carousel 需傳入 products 陣列
      if (!Array.isArray(product.products) || product.products.length === 0) {
        // 如果沒提供 products，就退回單一卡片
        contents = productCard(product);
      } else {
        contents = productCarousel(product.products);
      }
    } else {
      // bubble 單一卡片
      contents = productCard(product);
    }

    await client.replyMessage(event.replyToken, [{
      type: 'flex',
      altText: product.name || '商品列表',
      contents
    }]);

    return true;
  }

  // ⓶ 檢查是否為 Famistore 商品頁 URL
  if (text.includes('famistore.famiport.com.tw')) {
    try {
      const productData = await fetchProductFromFami(text);
      const contents = productCard(productData);

      await client.replyMessage(event.replyToken, [{
        type: 'flex',
        altText: productData.name,
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

  return false;
}

module.exports = { handleTextMessage };
