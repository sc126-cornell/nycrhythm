# SDD — nycrhythm（精簡版）

| 項目 | 內容 |
|---|---|
| 版本 | v1.0（2026-07-19，M0 Spike 後定稿） |
| Schema 凍結 | 見 [pipeline/SPIKE-NOTES.md](pipeline/SPIKE-NOTES.md) §5 |

## 架構（RT-first，承 mrtrhythm 底盤）

```
GTFS 靜態（每日 CI）──► pipeline ──► network.json（routes色票/母站/shapes+里程）
MTA GTFS-RT ×8 ──► /api/rt?feed=＊（解碼＋瘦身＋s-maxage=15 邊緣快取）──► 前端
前端引擎：RT trips 插值（相鄰停靠 a 時刻間 ease）＋月台→shape 投影 ＝ 列車位置
```

## 與捷奏的模組對照

| 模組 | 處置 |
|---|---|
| core/clock | 簡化：牆鐘即現在（NY 時區 Intl 固定，承 B7 教訓）；時間旅行列 P1 |
| core/position | **重寫**：RT 到站序列插值（取代表定推演）；vehicles.currentStatus 加細 |
| core/schedule＋校正 | **移除**（RT-first 不需串班/相位校正）；站牌看板改讀 RT |
| map/basemap | CARTO 直用（@2x 原生＋全球 CDN——免磚代理、免 NLSC 三痛點） |
| map/trains＋站名標籤 | 直接移植；bullet 圓標樣式 NYC 化（官方幹線色） |
| ui/跟車/搜尋/深連結 | 直接移植（文案全英文） |
| ui/theme | solar.ts 換 NYC 座標＝紐約日夜（純自動，承用戶偏好） |
| api 代理模式 | 同款（8 餵送×15s 共享快取）；tile 代理**不需要** |
| CI daily-data | 同款（GTFS zip → network.json） |

## 規模防線

- 尖峰 ~600 列：Canvas 單 pass（捷奏 149@61fps 基準）；不足時分層（視窗外剔除已有／低縮放聚合備案）
- stop_times 34.7MB 不進前端：站牌未來班次以 RT 為主（未來 ~16 停靠已含），靜態墊底 M1 定案
- 8 餵送輪詢：前端每 20s 依可視路線抓對應餵送（非全抓），邊緣快取吸收多用戶
