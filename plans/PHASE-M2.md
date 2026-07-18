# Phase 計畫 — M2：RT 位置引擎（讓真列車上圖）

| 項目 | 內容 |
|---|---|
| 狀態 | ✅ 完成（2026-07-19 Gate 通過；實地對板遞延明日、平日尖峰觀測週一——列 M3 期間驗收項） |
| 預估 | 2 人日（核心實際約 0.4） |
| 開始 / 完成日期 | 2026-07-19 / 2026-07-19 |

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

- [~] **用戶紐約實地對板**：遞延明日（2026-07-20）——M3 期間補記；技術面已有三班 JSON 對照＋A 車地理吻合證據
- [x] 用戶同意進 M3（2026-07-19「實地驗收明天再做，可以進M3」）

## 5. Check 紀錄（2026-07-19 填寫；由用戶提問觸發補填——見偏差 5）

### Code Review
- 範圍：core/{rt,position,geo,solar}、map/{basemap,trains}、ui/theme、main、api/rt（CORS）。lint／tsc 零發現。
- 發現與處置：
  1. **position 的 prev 時效**：分頁長時隱藏後恢復，`prev.at` 可能過舊 → 插值窗被拉長、列車段中偏慢直到下個 bracket 收斂。已有 `fromAt ≥ next.a` 反轉護欄；**M3 待辦：cap 插值窗 ≤300s**。
  2. dwell 近似（25s 或段長 30%）＋ease——RT 每 20s 重錨定，漂移有界；註解已載。
  3. complex 站名標籤取首站座標而非群質心——大型複合站標籤微偏；M3 一併修（改質心）。
  4. tripId 直配常帶尾碼（如 `A..S87X005`）落到 defaults——與 M1 註記同源，模糊前綴比對列 M3 選項（非必要）。
  5. `document.hidden` 輪詢閘門：省電正確；首開於背景分頁會停在 connecting…（前景即活）——行為符合設計，已於驗證中確認。
  6. eco 判斷沿用 UA 嗅探（承捷奏 backlog）；runtime 引擎無單元測試（管線有驗證器）——列 backlog。
  7. api/rt CORS `*`：公開資料，可接受；僅 dev 便利用途。

### Verify 結果
§3 五項全過：三班 JSON 序列對照、改道存證（樣本）、**488 班 61fps**、清理觀測＋審視、正式網址（含用戶新綁 nycrhythm.scottchen0622.com）。

### Validate 結果
待用戶紐約實地對板（網址已在手；週六晚時段理想）；「同意進 M3」隨 Gate。

### 偏差與學習
1. 估 2 人日 vs 核心實際約 0.4 人日；平日尖峰效能觀測週一補記。
2. 「背景分頁」現象兩度出現（fps=1、connecting…）——已內化為第一直覺；閘門設計本身正確，是觀測方法要先前景。
3. 用戶第三度神來一筆綁自訂網域——雙城網址格式就此統一（mrtrhythm／nycrhythm @ scottchen0622.com）。
4. 改道觀測是時段性的——**證據策略：當下存樣本勝於事後重現**（下午的 rt-bdfm 樣本立功）。
5. 本 Check 區塊曾漏填、由用戶提問抓到——**新規則入庫：Gate 前除 checkbox 掃描外，加掃「（待填）」**。

## 6. 用戶確認（Gate）

- [x] 已回報 M2 結果並取得進入 M3 的確認（2026-07-19）
- [x] Gate 前雙掃描已執行（checkbox＋待填——用戶抓包後的新規則首次完整套用）
