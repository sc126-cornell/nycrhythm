# Phase 計畫 — M0：MTA 資料 Spike 與環境建置

| 項目 | 內容 |
|---|---|
| 狀態 | 🟡 規劃中（待用戶確認開工） |
| 預估 | 1 人日 |
| 開始 / 完成日期 | — / — |

## 1. 目標（Plan）

1. 8 個 GTFS-RT 餵送全數解碼實測，未知數變事實：TripUpdates 欄位、VehiclePositions 可用度、trip/stop ID 格式、各時段列車量級。
2. GTFS 靜態包解剖：routes／stops／shapes 品質、快車 shape 變體、站群（Parent Station／Stations.csv）對應、stop_times 規模與瘦身策略。
3. 專案骨架（承捷奏 monorepo：web/api/pipeline）推上 GitHub `sc126-cornell/nycrhythm`、Vercel 接線出預覽網址。
4. 凍結兩份 schema：`network.json`（NYC 版）＋ `/api/rt` 瘦身 JSON。

**可展示物**：`pipeline/SPIKE-NOTES.md`（含各餵送實測樣本統計）＋ Vercel 預覽網址。

## 2. 工作項目（Do）

- [ ] T0.1 骨架移植：從捷奏複製 monorepo 結構與工具鏈（Vite/TS/ESLint/tsx/CI 模板），去台北專屬碼；MIT、.gitignore；Dropbox node_modules 忽略（捷奏教訓）
- [ ] T0.2 GTFS-RT Spike：`gtfs-realtime-bindings` 解碼 8 餵送 → 統計 entity 數、TripUpdate/VehiclePosition 覆蓋率、stopTimeUpdate 欄位樣態、時間戳新鮮度；樣本入 `pipeline/samples/`
- [ ] T0.3 GTFS 靜態 Spike：下載 zip → 盤點 25+ routes 色票、shapes 變體數、stops 與站群對應、stop_times 行數與壓縮估算
- [ ] T0.4 Vercel 專案建立＋`/api/health`；`/api/rt` 原型（單餵送解碼→瘦身→s-maxage=15）驗證邊緣快取 HIT
- [ ] T0.5 schema 凍結：network.json v2（service→pattern→shape）＋ rt JSON（`[{trip, route, dir, stops:[{s, eta}]}]`）寫入 SDD-lite

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
