// handlers/postback/postbackRegistry.js
const path = require('path');

const baseYtBambooList    = require('./base/ytBambooList');
const baseYtAtayalList    = require('./base/ytAtayalList');
const baseYtCorporateList = require('./base/ytCorporateList');
const defaultUnknown      = require('./base/defaultUnknown');

const baseRegistry = {
  yt_bamboo_list:     baseYtBambooList.handle,
  yt_atayal__list:    baseYtAtayalList.handle,
  yt_corporate__list: baseYtCorporateList.handle,
  __default__:        defaultUnknown.handle,
};

// ==== Load tenant overlay (tenants/<tenantKey>/index.js) ====
function loadTenantOverlay(tenantKey) {
    try {
      const overlayPath = path.join(__dirname, 'tenants', tenantKey, 'index.js');
      const overlay = require(overlayPath);
      const keys = overlay && typeof overlay === 'object' ? Object.keys(overlay) : [];
      console.debug('[registry] overlay loaded tenant=%s path=%s keys=%s',
        tenantKey, overlayPath, keys.join(','));
      return overlay && typeof overlay === 'object' ? overlay : {};
    } catch (e) {
      console.warn('[registry] overlay NOT loaded tenant=%s reason=%s', tenantKey, e.message);
      return {};
    }
  }
  
  // ==== Apply per-tenant policy ====
  function applyPolicy({ base, overlay }) {
    const { __policy__, ...overlayMap } = overlay || {};
  
    // 預設：沿用 base（inheritBase = true）
    const inheritBase = (__policy__ && typeof __policy__.inheritBase === 'boolean')
      ? __policy__.inheritBase
      : true;
  
    // 不沿用 base：只用 overlay
    if (!inheritBase) {
      const onlyOverlay = { ...overlayMap };
      if (!onlyOverlay.__default__) onlyOverlay.__default__ = base.__default__;
      console.debug('[registry] policy inheritBase=false -> final keys=%s',
        Object.keys(onlyOverlay).join(','));
      return onlyOverlay;
    }
  
    // 沿用 base，並支援 allow / deny
    let mergedBase = { ...base };
  
    if (Array.isArray(__policy__?.allow) && __policy__.allow.length) {
      mergedBase = Object.fromEntries(
        Object.entries(mergedBase).filter(([k]) => __policy__.allow.includes(k) || k === '__default__')
      );
    }
    if (Array.isArray(__policy__?.deny) && __policy__.deny.length) {
      for (const k of __policy__.deny) delete mergedBase[k];
    }
  
    const merged = { ...mergedBase, ...overlayMap };
    if (!merged.__default__) merged.__default__ = base.__default__;
    console.debug('[registry] policy inheritBase=true -> final keys=%s',
      Object.keys(merged).join(','));
    return merged;
  }
  
  // ==== Public API ====
  function getPostbackHandlers(tenantKey = 'default') {
    const overlay = loadTenantOverlay(tenantKey);
    const finalHandlers = applyPolicy({ base: baseRegistry, overlay });
    return finalHandlers;
  }
  
module.exports = { getPostbackHandlers };
