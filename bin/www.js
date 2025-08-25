#!/usr/bin/env node
// 主啟動檔（可獨立執行）
require('dotenv').config();

const http = require('http');
const config = require('../config');               // 用 config.get() 拿設定值
const app = require('../app');                     // Express app
const logger = require('../utils/logger')('www');

const port = Number(config.get?.('web.port')) || Number(process.env.PORT) || 3010;
app.set('port', port);

const server = http.createServer(app);

// ---- 錯誤處理 ----
function onError(error) {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case 'EACCES':     logger.error(`${bind} requires elevated privileges`); process.exit(1);
    case 'EADDRINUSE': logger.error(`${bind} is already in use`);            process.exit(1);
    default:           logger.error(`exception on ${bind}: ${error.code}`);  process.exit(1);
  }
}
server.on('error', onError);

// ---- 可選的 DB 初始化（預設關閉）----
async function initDBIfNeeded() {
  const wantDB = String(process.env.INIT_DB || 'false') === 'true';
  if (!wantDB) {
    logger.info('跳過資料庫連線 (INIT_DB=false)');
    return;
  }

  let dataSource;
  try {
    // 動態載入：沒有檔案也不會崩
    ({ dataSource } = require('../db/data-source'));
  } catch {
    logger.warn('找不到 ../db/data-source，略過 DB 初始化');
    return;
  }

  try {
    await dataSource.initialize();
    logger.info('資料庫連線成功');
  } catch (e) {
    logger.error(`資料庫連線失敗: ${e.message}`);
    process.exit(1);
  }
}

// ---- 啟動 ----
async function start() {
  await initDBIfNeeded();

  const host = process.env.HOST || '0.0.0.0'; // 新增：HOST
  server.listen(port, host, () => logger.info(`伺服器運作中 http://${host}:${port}`));
}

server.on('listening', () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? addr : `${addr.address}:${addr.port}`;
  logger.info(`HTTP server listening on ${bind}`);
});

// ---- 優雅關機（容器/Zeabur 會發 SIGTERM）----
const shutdown = (signal) => async () => {
  logger.warn(`${signal} 收到，準備關機…`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown('SIGTERM'));
process.on('SIGINT', shutdown('SIGINT'));

// （選）全域保險
process.on('unhandledRejection', (e) => logger.error(`unhandledRejection: ${e?.message || e}`));
process.on('uncaughtException',  (e) => { logger.error(`uncaughtException: ${e?.message || e}`); process.exit(1); });

start();
