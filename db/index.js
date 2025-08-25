const { dataSource } = require("./data-source");
const LineChannel = require("./entities/LineChannel");

async function initDB() {
  await dataSource.initialize();
  console.log("資料庫已初始化");
}

async function getAllChannels() {
  const repo = dataSource.getRepository(LineChannel);
  return repo.find();
}

async function getChannel(channelId) {
  const repo = dataSource.getRepository(LineChannel);
  return repo.findOne({ where: { channel_id: channelId } });
}

module.exports = { initDB, getAllChannels, getChannel };
