//會回一個完整的文字訊息＋quickReply 物件」

module.exports = function buildQuickReply(items) {
  return {
    type: 'text',
    text: '快來關注我～',
    quickReply: {
      items: items.map(i => ({
        type: 'action',
        action: {
          type: i.type,
          label: i.label,
          ...(i.type === 'message' ? { text: i.text } : { uri: i.uri })
        }
      }))
    }
  };
};
