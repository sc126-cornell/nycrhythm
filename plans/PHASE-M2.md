# Phase 計畫 — M2：RT 位置引擎（讓真列車上圖）

| 項目 | 內容 |
|---|---|
| 狀態 | 🔵 核心完成（正式站實測通過；待平日尖峰觀測＋用戶實地 Validate） |
| 預估 | 2 人日（核心實際約 0.4） |
| 開始 / 完成日期 | 2026-07-19 / — |

## 1. 目標（Plan)

1. **首頁即主地圖**（取代佔位頁）：CARTO 底圖＋M1 路網＋自繪站名標籤（承捷奏）。
2. **RT 位置引擎**：前端每 20s 輪詢 8 個 `/api/rt` → 合流 → 每班車沿其即時到站序列插值（相鄰兩停靠 a 時刻間 ease、月台 stopKm→shape 座標）；shape 選擇＝tripId 直配→defaults 墊底。
3. **NYC 風格列車標記**：官方色圓標＋路線字母（bullet），點擊出資訊卡（route、下一站、ETA）。
4. 純英文 UI；紐約日夜自動外觀（solar 換座標；承用戶偏好無手動鈕）；NY 時區 Intl 固定（承 B7 教訓）。

**可展示物**：打開首頁，500+ 班真實列車在紐約地圖上呼吸——位置不是推演，是 MTA 實時資料。

## 2. 工作項目（Do）

- [x] T2.1 首頁即地圖、topbar（live 班數＋NY 時鐘）、全英文（2026-07-19）
- [x] T2.2 core/rt：8 餵送輪詢合流＋**first-stop 變化→departed 觀測**（GTFS-RT 只列未來停靠的插值關鍵）＋stale 清理；document.hidden 閘門（省電）
- [x] T2.3 core/position：bracket ease＋prev 觀測／ladder 墊底雙路徑＋終點駐留 45s；shape 直配→defaults
- [x] T2.4 地圖層：CARTO retina、defaults 變體路網（避免 257 疊圖）、complex 合併站名自繪、**NYC bullet（亮度自適應字色——黃底深字）**＋命中測試
- [x] T2.5 資訊卡實測：「A・To Far Rockaway-Mott Av・Next: Broad Channel · 1m45s」——點擊處正是跨牙買加灣段，地理與資料吻合
- [x] T2.6 效能（週六晚）：**488 班 61fps**（門檻 50）；平日尖峰 600+ 班於週一自然觀測補記；?fps=1 已備

## 3. Verify — 技術驗證

- [x] 三班 JSON 對照（2026-07-19）：序列全遞增、ETA 合理（+48s/+82s/+15s…）；另有 A 車資訊卡與地理吻合的實測
- [x] 改道落位：機制按 route 解析與餵送無關（defaults 保證）；**改道實例已存證**（下午 spike `rt-bdfm.sample.json` routeIds 含 E）；本輪觀測窗改道剛好結束（E=0）屬時段性
- [x] **488 班 61fps**（門檻 50）；20s 輪詢；快取 HIT 架構承 M0 驗證
- [x] 過期清理：班數雙向變動（482→488 含進出）＋程式路徑審視；長時觀測隨週一尖峰補
- [x] lint／build 綠（不接管線）；正式網址實測 ✓——**用戶已綁自訂網域 https://nycrhythm.scottchen0622.com**（與捷奏同款操作；nycrhythm-web.vercel.app 綁定期間暫 404，以自訂網域為正式）

## 4. Validate — 需求驗收

- [ ] **用戶紐約實地對板**：站上任一月台，畫面列車進站 vs 現場（RT 直讀，理應 ≤30s）
- [ ] 用戶同意進 M3（跟車/看板/搜尋/深連結）

## 5. Check 紀錄（完成後填寫）

### Code Review
（待填）

### Verify 結果
（待填）

### Validate 結果
（待填）

### 偏差與學習
（待填）

## 6. 用戶確認（Gate）

- [ ] 已回報 M2 結果並取得進入 M3 的確認（日期：＿＿＿）
- [ ] Gate 前 checkbox 掃描已執行
