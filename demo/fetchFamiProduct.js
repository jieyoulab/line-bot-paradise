// demo/fetchFamiProduct.js
const axios = require('axios');
const productCard = require('../flex/bubble/productCard');

async function fetchProduct() {
  try {
    // 這裡換成你想抓的商品 ID
    const itemId = 3693856;
    const userId = 3213872;

    const res = await axios.post(
      'https://api-dot-fami-supersell.de.r.appspot.com/statistics/visits',
      [
        { userId, type: 0, id: userId, isUnique: 0 },
        { userId, type: 2, id: itemId, isUnique: 0 }
      ],
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
      }
    );

    // API 回傳的原始資料
    console.log('原始資料:', res.data);

    // 假設你真正抓到商品資料在 res.data[0].item
    const item = res.data[0]?.item || {};

    // 整理成 productCard 可以用的格式
    const product = {
      name: item.merchandise?.title || '無商品名稱',
      img: item.photoUrls?.[0] || '',
      specs: item.merchSpecs?.map(s => ({
        specName: s.name || '',
        specPrice: s.price || '',
        specLink: '#' // 如果有商品連結可以放這
      })) || []
    };

    // 生成 Flex JSON
    const flex = productCard(product);

    console.log('Flex JSON:', JSON.stringify(flex, null, 2));
  } catch (err) {
    console.error('抓取商品資料失敗：', err.message);
  }
}

fetchProduct();
