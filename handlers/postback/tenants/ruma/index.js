// handlers/postback/tenants/ruma/index.js
module.exports = {
    // 不寫 __policy__ => 預設 inheritBase = true
    ruma_latest_video: require('./latestVideo').handle,
  };
  