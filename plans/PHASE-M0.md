# Phase 計畫 — M0：MTA 資料 Spike 與環境建置

| 項目 | 內容 |
|---|---|
| 狀態 | ✅ 完成（2026-07-19 與 M1 合併 Gate 通過） |
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

- [x] 8/8 餵送解碼、樣本落盤；**週六實測 529 班**（平日尖峰真值於 M2 上線後自然觀測補記）
- [x] VehiclePositions 有（408）品質足——結論：引擎主用 TripUpdates 插值、vehicles 之 currentStatus 留作 M2/M3 加細
- [x] `/api/rt` 部署後 **MISS→HIT**；最大餵送（irt）瘦身後 **79KB**（門檻 150KB）
- [x] 站群核對（2026-07-19 補做並通過）：Times Sq 五站含 Port Authority 通道、Fulton 四線、Atlantic-Barclays、Union Sq、Court Sq（含 G 轉乘）全數正確
- [x] lint／build 綠；push 自動部署 ✓

## 4. Validate — 需求驗收

- [x] SPIKE-NOTES 摘要已回報；schema 凍結經同意（合併 Gate）
- [x] PRD §6 風險重評完成（SPIKE-NOTES §4：四項✅、兩項🟡待 M2 實測）

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

- [x] 已回報 M0 結果並取得確認（2026-07-19 與 M1 合併 Gate，用戶回覆「確認」；M1 曾依用戶指示先行平行）
- [x] Gate 前 checkbox 掃描已執行（2026-07-19，見 M1 Gate 紀錄）
