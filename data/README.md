# data資料夾下的JSON資料結構


## 檔名這樣分 `data/<tenantKey>/products.json`


- 本文件說明 `data/<tenantKey>/products.json` 與 `data/<tenantKey>/quickReplies.json` 的結構、維護規則，以及與程式流程的對應。
- 目前這種 products.json / quickReplies.json 最主要是給 event.type === "message"（尤其 message.type === "text"）用的，因為「使用者輸入或熱區丟文字」需要靠 keyword 對照 來決定回什麼: 
- 1. Line事件活動分派器 eventDispatcher：判斷 event.type
- 2. 如果event.type === 'message' => 就會走message訊息事件(這事件又有幾個子型別)
- 3. => handlers/message/index.js：判斷 message.type 是 text 時，才把事件丟給
- 4. => handlers/messageHandler.js 的 handleTextMessage：
- 5. loadQuickReplies(tenant.key) → 讀 data/<tenant>/quickReplies.json
- 6. loadProducts(tenant.key) → 讀 data/<tenant>/products.json
- 7. 比對 keyword（建議用 === 完全相等）
- 8. 命中兩者 ⇒ 回 Flex 並把 Quick Reply 掛在同一則訊息
- 9. 只命中其一 ⇒ 回該類型（Flex 或 文字+QuickReply）
- 10. 都沒命中 ⇒ 讓 routes 的 Echo fallback 回覆

- 以下以租戶 ruma 為例

## 檔案總覽

`data/ruma/products.json`
- 放 Flex 內容 的資料來源（單卡 productCard、或輪播 productCarousel）。
- 由 handlers/messageHandler.js 的 loadProducts(tenant.key) 載入。

`data/ruma/quickReplies.json`
- 放 Quick Reply 的資料來源（底部小按鈕）。
- 由 handlers/messageHandler.js 的 loadQuickReplies(tenant.key) 載入。
- 兩者都採 單一檔案、陣列 格式；每個熱區/關鍵字一筆。

## 事件流程：Rich Menu 熱區送出文字 → eventDispatcher → handlers/message/index.js → handleTextMessage：

- 同時比對 products.json 與 quickReplies.json 的 keyword（嚴格相等 ===）
- 兩者皆命中 ⇒ 回 Flex 並把 Quick Reply 掛在同一則訊息
- 只命中其一 ⇒ 回該類型訊息



## 驗收清單（新增一個熱區時）

1.layout.js：熱區 text 定稿

2.products.json：新增一筆，keyword 與熱區 text 完全一致

3.quickReplies.json：新增一筆，keyword 一致、items 正確

4.測試命中（應回「Flex + Quick Reply」）

5.測試不命中（應回 Echo）