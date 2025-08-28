## line-bot-paradise

一個 **LINE Bot** 後端專案，使用 Node.js/Express 建立，並整合 **LINE Messaging API** 與 **Rich Menu 部署工具**。  
本專案支援多租戶 (multi-tenant) 架構，可依照不同帳號 (如 `jieyou`, `ruma`) 管理各自的 Rich Menu 與互動流程。

---

### ✨ 功能特點
- 📩 **Webhook 處理**：接收與處理來自 LINE Bot 的事件（message, follow, postback...）。
- 🗂 **多租戶架構**：不同品牌/客戶可分別設定 Rich Menu 與回覆邏輯。
- 🎨 **Rich Menu 管理**：透過 `scripts/richmenu` 工具快速部署/更新 Rich Menu。
- 🧩 **Flex Message 模組化**：使用 `/flex` 目錄下的模板生成動態訊息（如商品卡片、品牌歡迎訊息）。
- 🗄 **資料庫支援**：內建 `db` 模組，可儲存 LINE Channel、使用者資料等。
- 🔧 **工具集**：包含圖片壓縮、排程、模擬器等工具。

---

## 🚀 快速開始

### 1. 安裝與啟動

```bash
# 安裝相依套件
npm install

# 啟動開發環境
npm run dev

# 正式環境
npm start
```

伺服器啟動後會監聽 .env 內設定的 PORT，並提供：
`POST /webhook-tenant` → 接收 LINE Webhook 事件

### 2. 建立環境檔案

專案使用 `.env` 檔案管理設定，請先複製 `.env.example`：

```bash
cp .env.example .env
```

---

## 📦 常用指令

專案在 `package.json` 中定義了以下指令：

| 指令                  | 說明                     |
| --------------------- | ------------------------ |
| `npm run dev`  | 使用 nodemon 啟動開發環境，會自動監控檔案變動重啟伺服器 |
| `npm start` | 啟動正式環境 (Node.js 直接執行)         |
| `npm test` | 測試指令           |

---

## 🧹 專案結構簡介

```
line-bot-paradise/
├── app.js # Express 主應用入口
├── bin/www.js # 啟動伺服器
├── config/ # 設定檔
├── data/ # 靜態資料 (e.g. 商品資料)
├── db/ # TypeORM 資料庫設定與實體
├── demo/ # 範例腳本與測試用程式
├── dist/ # 編譯輸出 (build 後)
├── flex/ # Flex Message 模板
├── handlers/ # LINE Bot 訊息事件的處理邏輯
├── infra/ # 基礎設施 (env/line client)
├── public/richmenu/ # Rich Menu 圖片資源
├── routes/ # Express 路由 (webhook)
├── scripts/ # Rich Menu 與工具腳本
├── utils/ # 共用工具 (logger 等)
└── test.js # 測試入口

```

---

## 🎨 Rich Menu 本地端部署

建立租戶 Rich Menu，例如租戶名稱為 `jieyou`：

```bash
node scripts/richmenu/deployTenant.js jieyou
```

- 執行後會將對應租戶的 Rich Menu 註冊到 LINE 官方帳號，以便測試

---