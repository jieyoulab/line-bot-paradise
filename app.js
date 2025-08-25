// app.js
const express = require('express');
const helmet = require('helmet');
// v7 需要從 express-rate-limit 匯入 ipKeyGenerator
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const pinoHttp = require('pino-http');

const tenantWebhook = require('./routes/webhook-tenant');
const makeLogger = require('./utils/logger');

const app = express();

// 在 Zeabur/反向代理後面，務必開 trust proxy 才抓得到正確 req.ip
// 本地測試也沒問題，會自動 fallback 成 127.0.0.1
app.set('trust proxy', 1);
// 移除 X-Powered-By（安全）
app.disable('x-powered-by');

// HTTP 日誌：pino-http（不解析 body，不破壞 LINE 簽章）
app.use(
  pinoHttp({
    logger: makeLogger.base,
    genReqId: (req) => req.headers['x-request-id'] || undefined, // 有帶就用，沒有就交給 pino 產生
    serializers: {
      req(req) {
        return { method: req.method, url: req.url };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
    customProps: (req) => ({ channelId: req.params?.channelId }),
    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
  })
);

app.use(helmet());

// 健康檢查（活著）
app.get('/healthz', (_req, res) => res.status(200).send('ok'));

// 就緒檢查（有載到租戶才算 ready）
app.get('/readyz', (_req, res) => {
  try {
    const { listTenants } = require('./infra/envTenants');
    const tenants = listTenants();
    if (!tenants.length) {
      return res.status(500).json({ ok: false, reason: 'no tenants' });
    }
    return res.status(200).json({ ok: true, tenants: tenants.length });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: e.message });
  }
});

// 只對 /webhook 做限流；⚠️ 不要在這條路由前加任何 body parser
const webhookLimiter = rateLimit({
  windowMs: 60_000, // 1 分鐘
  max: 60,          // 每分鐘最多 60 次
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // 使用官方 ipKeyGenerator（正確處理 IPv4/IPv6/x-forwarded-for）
    const ipKey = ipKeyGenerator(req, res);
    // 以「租戶 + IP」分桶，避免不同租戶互相牽連
    return `${req.params?.channelId || 'na'}:${ipKey}`;
  },
});
app.use('/webhook', webhookLimiter, tenantWebhook);

// 404
app.use((req, res) => res.status(404).send('Not found'));

// 全域錯誤處理（不輸出堆疊給用戶）
app.use((err, req, res, _next) => {
  req.log?.error({ err }, 'unhandled error');
  res.status(500).send('Internal error');
});

module.exports = app;
