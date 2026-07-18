# Phase 計畫 — M1：資料管線（GTFS 靜態 → network.json）

| 項目 | 內容 |
|---|---|
| 狀態 | ✅ 完成（2026-07-19 Gate 通過） |
| 預估 | 1.5 人日（實際約 0.3） |
| 開始 / 完成日期 | 2026-07-19 / 2026-07-19 |

## 1. 目標（Plan）

1. 正式 CSV 解析（處理引號逗號——Spike 教訓），GTFS 靜態 → `web/public/data/network.json`：
   官方幹線色票 routes、496 母站（含 complex 歸併）、**257 個 shape 變體全量**（里程化＋每變體停靠站投影 stopKm）。
2. RT tripId → shape 對應規則落地（tripId 尾段即 shape 路徑碼；缺席時 route+dir 預設 shape 墊底）。
3. 驗證器＋**英文版 debug 疊圖頁**（CARTO 底圖、全路網、官方色）——隨站部署可視。

**可展示物**：debug 頁上完整 NYC 地鐵路網（29 線官方色）＋驗證報告全綠。

## 2. 工作項目（Do）

- [x] T1.1 `pipeline/gtfs.ts`（2026-07-19：RFC 4180 完整解析＋快速逐行雙模式；幾何工具承捷奏）
- [x] T1.2 `pipeline/build-network.ts`（2026-07-19：29 routes 官方色（GTFS route_color 優先＋幹線常數墊底）／496 母站＋35 complex 群（transfers 併查集）／**257 shapes 全量、DP 6m 簡化 150,744→16,897 點（11%）**／停靠投影**零警示**／defaults 58 鍵＝29 路線×雙向全覆蓋）
- [x] T1.3 驗證器全綠（計數/單調/孤兒月台/defaults 覆蓋）
- [x] T1.4 debug.html 英文版（CARTO＋官方 bullet＋29 線開關）——研發端目檢通過：曼哈頓幹線/洛克威長臂/SIR 全正確
- [x] T1.5 體積：**gzip 0.08MB**（預算 1.5MB 的 5%）——DP 簡化立大功

## 3. Verify — 技術驗證

- [x] 257/257 shapes；stopKm 全單調；投影偏移警示＝0
- [x] RT 對應抽測（519 班實時）：直配 52.4%＋墊底 47.6%＝**100% 覆蓋、零落空**（門檻 90%；直配率提升列 M2 註記——RT path 碼與 shape 碼模糊比對）
- [x] debug 頁目檢（研發端）：變體分明、無跨區直線、SIR／Rockaway 正確；**用戶目檢待 Vercel 部署後**（Validate 項）
- [x] 體積 gzip 0.08MB；lint／build／validate 全綠（無管線吞碼）

## 4. Validate — 需求驗收

- [x] 用戶開 debug 頁目檢（2026-07-19：首開誤入首頁佔位頁「沒有路線圖」→ 指路 /debug.html 後目檢通過；學習：M2 起首頁即主地圖，此混淆自然消失）
- [x] 同意進 M2（2026-07-19 用戶回覆「確認」）

## 5. Check 紀錄（2026-07-19 填寫）

### Code Review
- 範圍：gtfs.ts（雙模式解析）、build-network、validate-network、spike-match、debug.html。lint／build 綠（驗證指令不接管線——M0 規）。
- 發現與處置：
  1. debug.html 曾殘留半成品孤兒迴圈（自我審查抓到並清除）——**教訓：生成長檔後通讀一遍再跑**。
  2. RT 直配率 52.4%：RT path 碼與 shape 碼存在變體差異——M2 註記「模糊比對提升直配」（非必要，defaults 墊底已 100% 覆蓋）。
  3. DP 簡化 6m 容差在地鐵曲率下無視覺損失；stopKm 以簡化後幾何投影，一致性成立。

### Verify 結果
§3 四項全過：257/257 零投影警示、RT 519 班零落空、debug 頁雙端目檢、gzip 0.08MB。

### Validate 結果
用戶 iPhone 目檢通過（含一次首頁/debug 頁指路）；「同意進 M2」已取得。

### 偏差與學習
1. 估 1.5 人日、實際約 0.3 人日——MTA 官方 shapes 現成（台北需自縫的最大工項在紐約不存在）＋捷奏幾何工具直搬。
2. 與 M0/T0.4 平行推進由用戶指示，全程無衝突——雙 phase 平行在資料/部署不相依時可行。

## 6. 用戶確認（Gate）

- [x] 已回報 M1 結果並取得進入 M2 的確認（2026-07-19，用戶回覆「確認，請先更新M0 M1文件」）
- [x] Gate 前 checkbox 掃描已執行（2026-07-19，本次更新後全 plans 零未勾——見 commit）
