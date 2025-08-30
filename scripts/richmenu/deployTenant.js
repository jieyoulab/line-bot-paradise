#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const { getTenantByKey } = require('../../infra/envTenants');
const { createMenu, setAlias, setDefault } = require('./lib/menuOps');

// 解析 CLI 參數：node deployTenant.js <tenantKey> [--default=alias]
function parseArgs() {
  const [,, tenantKey, ...rest] = process.argv;
  const opts = { tenantKey, defaultAlias: null };
  for (const a of rest) {
    if (a.startsWith('--default=')) opts.defaultAlias = a.split('=')[1];
  }
  return opts;
}

/**
 * 嘗試用多個基準將相對圖檔路徑解析為「存在的絕對路徑」
 * 例如 p.image = 'public/richmenu/ruma/primary.v2.png'
 */
function resolveImagePathMaybe(p) {
  if (/^https?:\/\//.test(p.image)) return p.image; // 網路圖直接返回

  const candidates = [
    path.resolve(__dirname, p.image),                 // 相對 deployTenant.js
    path.resolve(__dirname, '..', p.image),           // ../
    path.resolve(__dirname, '..', '..', p.image),     // 專案根（從 scripts/richmenu 回到根）
    path.resolve(process.cwd(), p.image),             // 執行時工作目錄
    p.image,                                          // 若傳進來就是絕對路徑
  ];

  const found = candidates.find(fp => fs.existsSync(fp));
  if (!found) {
    throw new Error(
      `找不到圖片：${p.image}（alias=${p.alias}）\n` +
      `嘗試過：\n- ${candidates.join('\n- ')}`
    );
  }
  return found; // 回傳可用的絕對路徑
}

async function deployForTenant(tenantKey, defaultAliasFromCli = null) {
  const tenant = getTenantByKey(tenantKey);
  if (!tenant) throw new Error(`Tenant not found: ${tenantKey}`);

  // 取對應租戶的 layout 工廠
  const layoutFactory = require(path.resolve(__dirname, `./${tenantKey}/layout.js`));
  const pages = layoutFactory(); // 期望回傳 [{ alias, name, image, areas }]

  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error(`layout.js 未回傳任何頁面（pages）。tenant=${tenantKey}`);
  }

  const idByAlias = {};
  for (const p of pages) {
    if (!p.alias) throw new Error(`頁面缺少 alias：${JSON.stringify(p)}`);
    if (!p.image) throw new Error(`頁面缺少 image：alias=${p.alias}`);
    if (!p.areas) throw new Error(`頁面缺少 areas：alias=${p.alias}`);

    const areas = (typeof p.areas === 'function') ? p.areas() : p.areas;

    // 解析圖片為絕對路徑（本地檔案時）
    if (!/^https?:\/\//.test(p.image)) {
      const resolved = resolveImagePathMaybe(p);
      p.image = resolved; // 用找到的絕對路徑覆蓋
      console.log(`📷 resolved image for ${p.alias}: ${p.image}`);
    }

    // 建立 Rich Menu
    const id = await createMenu(
      { name: p.name || p.alias, areas, imagePath: p.image },
      tenant.channelAccessToken
    );
    idByAlias[p.alias] = id;

    // 綁 alias：tenantKey_alias（避免衝突）
    const aliasFull = `${tenant.key}_${p.alias}`; // e.g. ruma_primary / ruma_tab2
    await setAlias(id, aliasFull, tenant.channelAccessToken);
    console.log(`✅ alias 綁定完成: ${aliasFull} → ${id}`);
  }

  // ===== 智能選擇 default =====
  // 優先序：
  // 1) CLI 指定的 --default=alias
  // 2) pages 裡有 'primary'
  // 3) 第一頁 pages[0]
  const defaultAlias =
    defaultAliasFromCli ||
    (idByAlias['primary'] ? 'primary' : pages[0].alias);

  const defaultId = idByAlias[defaultAlias];
  if (!defaultId) {
    throw new Error(`找不到要設為 default 的 alias: ${defaultAlias}`);
  }

  await setDefault(defaultId, tenant.channelAccessToken);
  console.log(`⭐ 已將 ${defaultAlias} 設為預設 richmenu → ${defaultId}`);

  console.log(`[OK] deployed richmenus for tenant=${tenant.key}`);
}

// 直接執行
if (require.main === module) {
  const { tenantKey, defaultAlias } = parseArgs();
  if (!tenantKey) {
    console.error('用法：node scripts/richmenu/deployTenant.js <tenantKey> [--default=alias]');
    process.exit(1);
  }
  deployForTenant(tenantKey, defaultAlias).catch(err => {
    console.error('[ERR]', err);
    process.exit(1);
  });
}

module.exports = { deployForTenant };



// #!/usr/bin/env node
// require('dotenv').config();

// const { getTenantByKey } = require('../../infra/envTenants');
// const { createMenu, setAlias, setDefault } = require('./lib/menuOps');

// async function deployForTenant(tenantKey) {
//   const tenant = getTenantByKey(tenantKey);
//   if (!tenant) throw new Error(`Tenant not found: ${tenantKey}`);

//   const layoutFactory = require(`./${tenantKey}/layout.js`);
//   const pages = layoutFactory(); // [{ alias, name, image, areas }]

//   const idByAlias = {};
//   for (const p of pages) {
//     const areas = typeof p.areas === 'function' ? p.areas() : p.areas;

//     // 建立 Rich Menu
//     const id = await createMenu(
//       { name: p.name, areas, imagePath: p.image },
//       tenant.channelAccessToken
//     );
//     idByAlias[p.alias] = id;

//     // 綁 alias：用 tenantKey_alias（避免點號）
//     const aliasFull = `${tenant.key}_${p.alias}`; // e.g. ruma_primary / ruma_second
//     await setAlias(id, aliasFull, tenant.channelAccessToken);

//     console.log(`✅ alias 綁定完成: ${aliasFull} → ${id}`);
//   }

//   // 預設頁（primary）
//   if (idByAlias['primary']) {
//     await setDefault(idByAlias['primary'], tenant.channelAccessToken);
//     console.log(`⭐ 已將 primary 設為預設 richmenu → ${idByAlias['primary']}`);
//   }

//   console.log(`[OK] deployed richmenus for tenant=${tenant.key}`);
// }

// if (require.main === module) {
//   const key = process.argv[2];
//   if (!key) {
//     console.error('Usage: node scripts/richmenu/deployTenant.js <tenantKey>');
//     process.exit(1);
//   }
//   deployForTenant(key).catch(err => {
//     console.error('[ERR]', err);
//     process.exit(1);
//   });
// }

// module.exports = { deployForTenant };
