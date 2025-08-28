#!/usr/bin/env node
require('dotenv').config();

const { getTenantByKey } = require('../../infra/envTenants');
const { resetUser } = require('./lib/menuOps');

async function main() {
  const tenantKey = process.argv[2];
  const userId = process.argv[3];

  if (!tenantKey || !userId) {
    console.error('Usage: node scripts/richmenu/resetUser.js <tenantKey> <userId>');
    process.exit(1);
  }

  const tenant = getTenantByKey(tenantKey);
  if (!tenant) throw new Error(`Tenant not found: ${tenantKey}`);

  await resetUser(userId, tenant.channelAccessToken);
  console.log(`✅ Rich Menu 重置完成，userId=${userId}`);
}

if (require.main === module) {
  main().catch(err => {
    console.error('[ERR]', err);
    process.exit(1);
  });
}

module.exports = { main };
