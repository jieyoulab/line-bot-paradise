#!/usr/bin/env node
require('dotenv').config();

const { getTenantByKey } = require('../../infra/envTenants');
const { createMenu, setAlias, setDefault } = require('./lib/menuOps');

async function deployForTenant(tenantKey) {
  const tenant = getTenantByKey(tenantKey);
  if (!tenant) throw new Error(`Tenant not found: ${tenantKey}`);

  const layoutFactory = require(`./${tenantKey}/layout.js`);
  const pages = layoutFactory(); // [{ alias, name, image, areas }]

  const idByAlias = {};
  for (const p of pages) {
    const areas = typeof p.areas === 'function' ? p.areas() : p.areas;

    // 建立 Rich Menu
    const id = await createMenu(
      { name: p.name, areas, imagePath: p.image },
      tenant.channelAccessToken
    );
    idByAlias[p.alias] = id;

    // 綁 alias：用 tenantKey_alias（避免點號）
    const aliasFull = `${tenant.key}_${p.alias}`; // e.g. ruma_primary / ruma_second
    await setAlias(id, aliasFull, tenant.channelAccessToken);

    console.log(`✅ alias 綁定完成: ${aliasFull} → ${id}`);
  }

  // 預設頁（primary）
  if (idByAlias['primary']) {
    await setDefault(idByAlias['primary'], tenant.channelAccessToken);
    console.log(`⭐ 已將 primary 設為預設 richmenu → ${idByAlias['primary']}`);
  }

  console.log(`[OK] deployed richmenus for tenant=${tenant.key}`);
}

if (require.main === module) {
  const key = process.argv[2];
  if (!key) {
    console.error('Usage: node scripts/richmenu/deployTenant.js <tenantKey>');
    process.exit(1);
  }
  deployForTenant(key).catch(err => {
    console.error('[ERR]', err);
    process.exit(1);
  });
}

module.exports = { deployForTenant };
