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
├── .env                     # 環境變數設定 (本機)
├── .env.example             # 環境變數範例
├── .git                     # Git 版本控制資料夾
├── .gitignore               # Git 忽略規則
├── README.md                # 專案說明文件
├── app.js                   # Express 主應用入口
├── bin/
│   └── www.js               # 啟動伺服器
├── config/
│   └── index.js             # 環境設定
├── data/                    
│   ├── jieyou/              # 租戶 jieyou 資料
│   └── tenants.json         # 全域租戶清單
├── db/                      # TypeORM 資料庫設定
│   ├── data-source.js       # DB 連線設定
│   ├── entities/            # 資料表實體
│   └── index.js             # 匯出 DB 初始化
├── demo/                    # 範例腳本 / 測試用程式
├── dist/                    # 編譯輸出 (build 後)
├── flex/                    # Flex Message 模板
├── handlers/                # LINE Bot 訊息事件處理邏輯
│   └── eventDispatcher.js   # 事件分派器
├── infra/                   # 基礎設施層
│   ├── envTenants.js        # 租戶環境變數管理
│   ├── lineClient.js        # LINE Bot SDK 初始化
│   ├── richmenu/            # Rich Menu 預設設定
│   └── richmenuLinker.js    # 綁定 Rich Menu
├── public/                  # 靜態資源
├── routes/
│   └── webhook-tenant.js    # Webhook 路由 (多租戶)
├── scripts/                 # 腳本工具
│   ├── richmenu/            # Rich Menu 部署與操作
│   ├── setup-richmenu-3tabs.js # 三分頁 Rich Menu 設定
│   └── tools/               # 工具腳本 (壓縮圖片等)
├── test.js                  # 測試入口
├── utils/
│   └── logger.js            # 共用 logger
├── package.json             # 專案設定與依賴
├── package-lock.json        # 依賴版本鎖定
└── node_modules/            # 安裝套件

```

---

## 🎨 Rich Menu 本地端部署

建立租戶 Rich Menu，例如租戶名稱為 `jieyou`：

```bash
node scripts/richmenu/deployTenant.js jieyou
```

- 執行後會將對應租戶的 Rich Menu 註冊到 LINE 官方帳號，以便測試

---
