// flex/bubble/videoBubble.js
// -----------------------------------------------------------------------------
// 共用的「YouTube 單張 Bubble」產生器。
// 特色：
// - 支援只給 id、只給 url、或 id + url 皆可（會自動抽出 YouTube ID）
// - 可選擇高畫質縮圖（maxresdefault）或標準縮圖（hqdefault）
// - 文字區塊支援多行（\n），自動 wrap，並限制行數避免排版爆版
// - 有圖才放 hero、有連結才放 footer，避免 LINE 400「欄位必填」錯誤
// - 可用 opts 控制泡泡尺寸、主色（按鈕色）、縮圖偏好
//
// 典型使用：
//   const bubble = videoBubble({ id: 'abc123', title: '片名', url: 'https://...' }, { size: 'deca', color: '#768c5d' })
//   // 搭配 flex/carousel/videoCarousel.js 將多張 bubble 組成 carousel
// -----------------------------------------------------------------------------

/** 小工具：安全地取值（undefined/null 時回傳預設值） */
function pick(val, fallback) {
    return (val !== undefined && val !== null) ? val : fallback;
  }
  
  /**
   * 從多種 YouTube 連結樣式抽出 video id
   * 支援：
   * - https://www.youtube.com/watch?v=<ID>
   * - https://youtu.be/<ID>
   * - https://www.youtube.com/embed/<ID>
   * - https://www.youtube.com/shorts/<ID>
   */
  function extractYouTubeId(url = '') {
    const m =
      url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/) ||      // youtu.be/<ID>
      url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||           // ...?v=<ID>
      url.match(/\/embed\/([A-Za-z0-9_-]{6,})/) ||        // /embed/<ID>
      url.match(/\/shorts\/([A-Za-z0-9_-]{6,})/);         // /shorts/<ID>
    return m ? m[1] : null;
  }
  
  /** 由 ID 組成標準觀看連結（確保是 https） */
  function toUrl(id)   { return `https://www.youtube.com/watch?v=${id}`; }
  
  /** 高畫質縮圖（有些影片不一定有，若出現空白圖可改用 thumbHQ 或在外層傳 opts.preferMaxRes=false） */
  function thumbMax(id){ return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`; }
  
  /** 標準縮圖（幾乎所有影片都有） */
  function thumbHQ(id) { return `https://img.youtube.com/vi/${id}/hqdefault.jpg`; }
  
  /** 基本 URL 合法性檢查（避免把 '#'、空字串丟進去導致 LINE 400） */
  const isHttp = u => typeof u === 'string' && /^https?:\/\/.+/i.test(u);
  
  /**
   * 片長格式化：
   * - 傳 number 視為秒數 → 轉為 mm:ss / hh:mm:ss
   * - 傳字串則原樣顯示（如 "12:34"）
   */
  function formatRuntime(v) {
    if (v === undefined || v === null) return null;
    if (typeof v === 'string') return v;
    const sec = Math.max(0, Number(v) || 0);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${m}:${String(s).padStart(2,'0')}`;
  }
  
  /**
   * 建立一張 YouTube Bubble（可直接放進 Flex Message 的 contents 裡）
   *
   * @param {Object} item
   * @param {string} [item.id]           - YouTube 影片 ID（可選；若沒給會嘗試從 url 抽）
   * @param {string} [item.url]          - 影片連結（可選；建議 https://www.youtube.com/watch?v=<ID> 或 https://youtu.be/<ID>）
   * @param {string} [item.image]        - 自訂縮圖網址（可選；若沒給會用 id 產）
   * @param {string} [item.title]        - 片名（建議）
   * @param {string} [item.channel]      - 頻道名稱（可選）
   * @param {string} [item.desc]         - 影片描述（可選，支援 '\n' 換行）
   * @param {string} [item.director]     - 導演（可選）
   * @param {string|number} [item.runtime] - 片長（字串或秒數）
   * @param {string} [item.publishedAt]  - 上架日期（可選，自由字串）
   *
   * @param {Object} opts
   * @param {string} [opts.size='deca']        - Bubble 尺寸（'nano'|'micro'|'deca'|'hecto'|'kilo'|'mega'|'giga'）
   * @param {string} [opts.color='#768c5d']    - 主色（按鈕顏色）
   * @param {boolean} [opts.preferMaxRes=true] - 縮圖偏好：true 用 maxres、false 用 hq
   *
   * @returns {Object} LINE Flex Bubble 物件
   */
  module.exports = function videoBubble(item = {}, opts = {}) {
    // ------- 1) 讀取樣式/行為選項 -------
    const size         = pick(opts.size, 'deca');
    const color        = pick(opts.color, '#768c5d');
    const preferMaxRes = pick(opts.preferMaxRes, true);
  
    // ------- 2) 解析影片 ID / URL -------
    // 允許只給 url → extractYouTubeId(url)；也可同時給 id 和 url（以 item.url 為主）
    const id  = item.id || (item.url ? extractYouTubeId(item.url) : null);
    const url = item.url || (id ? toUrl(id) : null);
  
    // ------- 3) 決定縮圖 -------
    // 優先使用外部傳入的 image；否則用 id 生成（preferMaxRes 控制解析度）
    // 注意：部分影片沒有 maxresdefault.jpg，若出現空白圖可在呼叫端傳 { preferMaxRes: false }
    const img = item.image || (id ? (preferMaxRes ? thumbMax(id) : thumbHQ(id)) : null);
  
    // ------- 4) 整理文字欄位 -------
    const title       = item.title || 'YouTube 影片';
    const channel     = item.channel || '';            // 放頻道名稱
    const desc        = item.desc || '';               // 支援 '\n' 多行描述
    const director    = item.director || null;         // 導演
    const runtime     = formatRuntime(item.runtime);   // 片長：統一顯示格式
    const publishedAt = item.publishedAt || null;      // 上架日期
  
    // 組合下方的 meta 資訊（有填才顯示）
    const metaLines = [
      director    ? `導演：${director}`     : null,
      runtime     ? `片長：${runtime}`       : null,
      publishedAt ? `上架：${publishedAt}`   : null
    ].filter(Boolean);
  
    // ------- 5) 建立基礎 Bubble（只有 body 先放，hero/footer 視情況加上）-------
    const bubble = {
      type: 'bubble',
      size,
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          // 片名：加粗、最多 3 行，避免太長
          { type: 'text', text: title, weight: 'bold', size: 'md', wrap: true, maxLines: 3 },
  
          // 頻道名稱：灰字、最多 2 行
          ...(channel ? [{
            type: 'text', text: channel, size: 'sm', color: '#777777', wrap: true, maxLines: 2
          }] : []),
  
          // 影片描述：支援 '\n'，最多 6 行，避免爆版
          ...(desc ? [{
            type: 'text', text: desc, size: 'sm', color: '#555555', wrap: true, maxLines: 6
          }] : []),
  
          // Meta 區塊：導演 / 片長 / 上架日期（有則顯示）
          ...(metaLines.length ? [{
            type: 'box',
            layout: 'vertical',
            spacing: 'xs',
            margin: 'sm',
            contents: metaLines.map(t => ({
              type: 'text', text: t, size: 'xs', color: '#888888', wrap: true
            }))
          }] : [])
        ]
      }
    };
  
    // ------- 6) hero（大圖區）-------
    // 有圖才放 hero，否則不要塞 image 元件避免 LINE 400「must be specified」
    if (img) {
      bubble.hero = {
        type: 'image',
        url: img,
        size: 'full',
        aspectRatio: '16:9',
        aspectMode: 'cover',
        // 有連結時才掛 action，避免 invalid uri
        action: (url && isHttp(url)) ? { type: 'uri', uri: url } : undefined
      };
    }
  
    // ------- 7) footer（按鈕區）-------
    // 有合法連結才放按鈕，避免 invalid uri / invalid scheme
    if (url && isHttp(url)) {
      bubble.footer = {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color,           // 可由 opts.color 客製（支援多租戶主色）
            height: 'sm',
            action: { type: 'uri', label: '觀看影片', uri: url }
          }
        ]
      };
    }
  
    // ------- 8) 回傳 Bubble 物件 -------
    return bubble;
  };
  