// handlers/message/locationHandler.js
module.exports = async function handleLocation(event, client /*, tenant */) {
    const { title, address, latitude, longitude } = event.message || {};
    await client.replyMessage(event.replyToken, {
      type: 'text',
      text: `已收到定位📍\n${title || ''}\n${address || ''}\nlat: ${latitude}, lng: ${longitude}`
    });
    return true;
  };
  