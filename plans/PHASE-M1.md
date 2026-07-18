# Phase 計畫 — M1：資料管線（GTFS 靜態 → network.json）

| 項目 | 內容 |
|---|---|
| 狀態 | 🔵 進行中（2026-07-19 用戶指示與 M0/T0.4 平行開跑） |
| 預估 | 1.5 人日 |
| 開始 / 完成日期 | 2026-07-19 / — |

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

- [ ] 用戶開 debug 頁目檢（你在紐約——對照窗外實地感）
- [ ] 同意進 M2（RT 位置引擎＋列車動畫）

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

- [ ] 已回報 M1 結果並取得進入 M2 的確認（日期：＿＿＿）
- [ ] Gate 前 checkbox 掃描已執行
