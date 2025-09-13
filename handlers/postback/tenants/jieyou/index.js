// handlers/postback/tenants/jieyou/index.js
module.exports = {
    __policy__: { inheritBase: false },   // ★ 關掉 base
    // jieyou_latest_news: require('./latestNews').handle,
    // jieyou_services:    require('./servicesList').handle,
  
    // （可選）自訂 default 覆蓋全域 defaultUnknown
    // __default__: require('./defaultForJieyou').handle,
  };
  