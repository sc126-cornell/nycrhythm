# BACKLOG — nycrhythm

> M4/M5 收尾時的遞延與前瞻總表（2026-07-19）。

## A. 驗收遞延（時間到就做）

| # | 項目 | 時點 |
|---|---|---|
| A1 | 實地對板（M2）＋M3 體驗（看板 vs 月台倒數、跟車、分享連結） | 明日（2026-07-20，用戶在紐約） |
| A2 | 平日尖峰效能觀測（600+ 班 fps） | 週一（2026-07-21）早高峰 |
| A3 | 轉 Public（技術已就緒） | 待用戶指令 |

## B. 技術強化

| # | 項目 | 說明 |
|---|---|---|
| B1 | og:image 分享圖 | 1200×630（雙城同款缺） |
| B2 | tripId→shape 模糊直配 | 現 52% 直配＋48% defaults 墊底（100% 覆蓋）；前綴比對可拉高精準變體率 |
| B3 | 餵送健康監測 | 8 餵送個別失效的降級提示（現為整體 stale 標記） |
| B4 | VehiclePositions 加細 | currentStatus（進站/停靠/離站）修飾插值端點 |
| B5 | 單元測試 | position/rt 引擎（現靠管線驗證器＋實測） |
| B6 | eco 判斷 | UA 嗅探 → 能力偵測（承捷奏 backlog） |
| B7 | spike-static.ts 更名 | CI 借用 spike 腳本下載 zip——語義整理為 fetch-static.ts |

## C. 前瞻（不承諾）

Alerts 橫幅（MTA alerts 餵送）、時間旅行（靜態班表重播）、PWA、多城市引擎抽象（等雙城都穩定運轉後再議）、LIRR/Metro-North 擴充

## 流程備忘

- Gate 前雙掃描（checkbox＋待填）；Check 紀錄與實作同日填寫
- 背景 dev server 用完即收（2026-07-19 用戶手機看到 2 running tasks 的教訓）
