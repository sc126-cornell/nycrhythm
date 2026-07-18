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

- [ ] T1.1 `pipeline/gtfs.ts`：RFC 4180 CSV 解析（引號/逗號/換行）＋ zip 讀取助手
- [ ] T1.2 `pipeline/build-network.ts`：routes（官方色常數×route_id 對應）→ stations（parent_station 權威）→ complex（transfers 併查集）→ shapes（5dp 捨入＋chainage）→ 每 shape 代表 trip 的停靠序列投影 stopKm → defaults（route+dir 最長變體）
- [ ] T1.3 `pipeline/validate-network.ts`：路線/母站/變體計數、stopKm 嚴格遞增、投影偏移警示、defaults 全覆蓋
- [ ] T1.4 `web/public/debug.html`（英文）：全 shapes 疊圖＋站點＋警告清單
- [ ] T1.5 network.json 體積管控：目標 gzip ≤ 1.5MB（超標→幾何簡化 tolerance 10m）

## 3. Verify — 技術驗證

- [ ] 257/257 shapes 產出；每 shape stopKm 嚴格遞增；投影偏移 >150m 清單為零或有解釋
- [ ] RT 對應抽測：抓一輪 /rt 樣本，tripId→shape 直配率 ≥90%，其餘落 defaults
- [ ] debug 頁目檢：快車/慢車變體分明、無跨區直線、SIR/Rockaway 遠端正確
- [ ] 體積：network.json gzip 實測 ≤1.5MB；`lint`／`build`／validate 綠（不經管線吞 exit code——M0 教訓）

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
