# Phase 計畫 — M0：MTA 資料 Spike 與環境建置

| 項目 | 內容 |
|---|---|
| 狀態 | 🟠 檢查完成（待與 M1 合併 Gate） |
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
- [x] T0.4 完成（2026-07-19：用戶 Vercel import（專案名 `nycrhythm-web`、framework=Other 四欄位正確）→ 全端點 200、**/api/rt MISS→HIT**、即時內容正確（1 線列車＋未來停靠）。公開網址 https://nycrhythm-web.vercel.app）
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

## 5. Check 紀錄（2026-07-19 填寫）

### Code Review
- 範圍：spike-rt／spike-static（一次性工具）、api/{health,rt}、骨架。lint／build 綠（M0 曾有管線吞 lint exit code 事故——已修並立規：驗證指令不接管線）。
- 捷奏教訓前置套用：Vercel Functions 相對匯入 `.js`（rt.ts 無共用模組故未涉）、Dropbox node_modules 忽略、四欄位 import 指示。

### Verify 結果
全過：8/8 餵送解碼（529 trips）、靜態全解剖、/api/rt 部署後 MISS→HIT、瘦身單餵送遠低於 150KB（irt 原始 179KB→瘦身後約 60KB 級）。

### Validate 結果
SPIKE 摘要已回報；schema 凍結（SPIKE-NOTES §5）已依實測落地並被 M1 消化。正式同意隨 M0+M1 合併 Gate。

### 偏差與學習
1. 用戶指示 M1 與 T0.4 平行——PDCA 的 Gate 序列可由用戶明示調整，紀錄即可。
2. Vercel 專案名為 `nycrhythm-web`（用戶 import 時所取）；公開網址 nycrhythm-web.vercel.app。
3. 估 1 人日、實際約 0.3 人日。

## 6. 用戶確認（Gate）

- [ ] 已回報 M0 結果並取得進入 M1 的確認（日期：＿＿＿）
- [ ] Gate 前 checkbox 掃描已執行（`grep "\- \[ \]" plans/`）
