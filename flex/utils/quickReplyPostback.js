// utils/quickReplyPostback.js
//這支只處理「純 postback」的情境
module.exports = function buildQuickReplyPostback({ text = '請選擇項目：', items = [] } = {}) {
    return {
      type: 'text',
      text,
      quickReply: {
        items: items.map(i => ({
          type: 'action',
          action: {
            type: 'postback',
            label: i.label,
            data: i.data,
            // 顯示在聊天室（可選），沒有就用 label
            displayText: i.displayText || i.label
          }
        }))
      }
    };
  };
  