# Phase 計畫 — M0：MTA 資料 Spike 與環境建置

| 項目 | 內容 |
|---|---|
| 狀態 | 🔵 進行中（2026-07-19 用戶 Gate「開工」） |
| 預估 | 1 人日 |
| 開始 / 完成日期 | 2026-07-19 / — |

## 1. 目標（Plan）

1. 8 個 GTFS-RT 餵送全數解碼實測，未知數變事實：TripUpdates 欄位、VehiclePositions 可用度、trip/stop ID 格式、各時段列車量級。
2. GTFS 靜態包解剖：routes／stops／shapes 品質、快車 shape 變體、站群（Parent Station／Stations.csv）對應、stop_times 規模與瘦身策略。
3. 專案骨架（承捷奏 monorepo：web/api/pipeline）推上 GitHub `sc126-cornell/nycrhythm`、Vercel 接線出預覽網址。
4. 凍結兩份 schema：`network.json`（NYC 版）＋ `/api/rt` 瘦身 JSON。

**可展示物**：`pipeline/SPIKE-NOTES.md`（含各餵送實測樣本統計）＋ Vercel 預覽網址。

## 2. 工作項目（Do）

- [x] T0.1 骨架移植（2026-07-19：monorepo＋工具鏈就位、英文起始頁、Dropbox 忽略已套）
- [x] T0.2 GTFS-RT Spike（2026-07-19：**8/8 解碼成功、529 trips／408 vehicles 實時在線**、新鮮度 0–10s、94%+ 含未來停靠；週末改道實錄（E 現身 bdfm）證明 RT-first 天然吸收改道）
- [x] T0.3 GTFS 靜態 Spike（2026-07-19：29 routes／496 母站＋992 月台（N/S 尾碼＝方向）／shapes 257 變體／trips 20,309／stop_times 34.7MB 563K 行／transfers 613）
- [ ] T0.4 `/api/health`＋`/api/rt` 原型**程式已就緒**；👤 待用戶 Vercel import repo（同捷奏四欄位流程）後驗證邊緣快取 HIT
- [x] T0.5 schema 凍結（SPIKE-NOTES §5＋SDD 精簡版；色票以官方幹線色常數為準——簡化 CSV 解析的引號逗號問題已記錄，正式管線需完整 parser）

## 3. Verify — 技術驗證

- [ ] 8/8 餵送解碼成功、樣本落盤；尖峰時段列車總數實測（預估 500–700，取得真值）
- [ ] VehiclePositions 有無／品質結論明確（決定位置引擎用 TripUpdates 插值或混合）
- [ ] `/api/rt` 部署後連打快取 HIT；回應 <1s、瘦身後單餵送 ≤ 150KB
- [ ] 站群對應規則可行（抽 5 大轉運站人工核對：Times Sq、Fulton St、Atlantic Av 等）
- [ ] lint／build 綠燈；push 自動部署

## 4. Validate — 需求驗收

- [ ] SPIKE-NOTES 摘要向用戶回報；schema 凍結經同意
- [ ] PRD §6 風險逐項重評（升/降級）後進 M1

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

- [ ] 已回報 M0 結果並取得進入 M1 的確認（日期：＿＿＿）
- [ ] Gate 前 checkbox 掃描已執行（`grep "\- \[ \]" plans/`）
