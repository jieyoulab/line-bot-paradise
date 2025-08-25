//解析：使用者在line輸入的地段地號 專門負責解析使用者輸入的段名地號
// ---- utils: robust parser ----
function toHalfWidthDigits(s = '') {
    // 全形數字轉半形：０-９ -> 0-9
    return s.replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30));
}
  
function parseSectionAndLandNo(raw = '') {
    const msg = toHalfWidthDigits(String(raw).trim());
  
    // 允許：空白(含全形)、各種連字號、波浪等；段名允許「段」「小段」「…小段」等結尾形式
    // 盡量把「第一個數字」當作段名與地號的分界
    const re = /^(.+?段(?:[^\d０-９]*)?)\s*([0-9]{1,4})(?:[ \u3000\-–—~～]*([0-9]{1,4}))?$/;
  
    const m = msg.match(re);
    if (!m) return null;
  
    const section = m[1].trim();     // e.g. "大利段"
    const no1 = m[2];                // e.g. "1300"
    const no2 = (m[3] || '').trim(); // e.g. "0000" or ''
  
    const landNo = no2 ? `${no1}-${no2}` : no1; // 統一傳給 worker，worker 再二次 normalize 也OK
    return { section, landNo };
}  

module.exports = { toHalfWidthDigits, parseSectionAndLandNo };