// handlers/postback/tenants/ruma/latestVideo.js
const { loadQuickReplies, renderQuickReplyMessage } = require('../../utils/quickReplies');
const sendVideoAndFlex = require('../../../reply/sendVideoAndFlex');

async function handle({ event, client, tenant }) {
  const tenantKey = (tenant?.key || 'default').toLowerCase();
  const keyword = '櫓榪竹工作室最新消息';

  const quickReplies = loadQuickReplies(tenantKey);
  const matched = quickReplies.find(q => q.keyword === keyword);
  const quickReply = matched ? renderQuickReplyMessage(matched).quickReply : undefined;

  await sendVideoAndFlex(event.replyToken, client, { quickReply });
}

module.exports = { handle };
