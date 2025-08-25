//BullMQ + Upstash 連線

require('dotenv').config();
const { Queue, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');

if (!process.env.REDIS_URL) {
  console.error('❌ REDIS_URL missing. Expect rediss://:PASSWORD@HOST:PORT');
  process.exit(1);
}

const isTLS = process.env.REDIS_URL.startsWith('rediss://');

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(isTLS ? { tls: {} } : {}), // Upstash rediss:// 用 TLS
});

const eventsConnection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  ...(isTLS ? { tls: {} } : {}),
});

const QUEUE_NAME = 'crawl';
const crawlQueue = new Queue(QUEUE_NAME, { connection });
const crawlEvents = new QueueEvents(QUEUE_NAME, { connection: eventsConnection });

module.exports = { crawlQueue, crawlEvents, QUEUE_NAME };