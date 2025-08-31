// utils/buildQuickReply.js
module.exports = function buildQuickReply(items, text = '快來關注我～') {
    return {
      type: 'text',
      text,
      quickReply: {
        items: items.map(i => {
          const action =
            i.type === 'message' ? { type: 'message', label: i.label, text: i.text } :
            i.type === 'postback' ? { type: 'postback', label: i.label, data: i.data, displayText: i.displayText || i.label } :
            /* default: uri */     { type: 'uri', label: i.label, uri: i.uri };
  
          return { type: 'action', action };
        })
      }
    };
  };
  