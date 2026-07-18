# Phase 計畫 — M3：互動功能（跟車／看板／搜尋／深連結）

| 項目 | 內容 |
|---|---|
| 狀態 | 🟠 檢查完成（待明日用戶實地 Validate＋Gate） |
| 預估 | 1.5 人日（實際約 0.3） |
| 開始 / 完成日期 | 2026-07-19 / 2026-07-19 |

## 1. 目標（Plan）

捷奏 M3 全套互動的紐約版（英文 UI、RT 資料源）＋ M2 code review 兩項待辦：

1. **Follow mode**：點列車→🎥 Follow→鏡頭鎖定；拖曳解鎖＋「Back to train」；即時時速；到終自動解除。
2. **Station board**：點車站（或搜尋）→ 該站（含 complex 全月台）即將進站列車——route bullet、目的地、ETA 倒數，純 RT 推導、逐秒更新。
3. **Search**：站名子字串、跳轉開板；行動版兩列式（捷奏教訓 day-1 套用）。
4. **Deep link**：hash `c/z/f(tripId)/s(stationId)`；throttle 回寫（debounce 飢餓教訓）；開啟還原（過期 trip 靜默略過）。
5. M2 遺留：prev 插值窗 cap 300s、complex 標籤改群質心。

**可展示物**：完整可玩——搜 Times Sq 看板、跟一班 Q 過曼哈頓大橋、把連結傳給朋友。

## 2. 工作項目（Do）

- [x] T3.0 M2 遺留修正（2026-07-19：prev 窗 cap 300s、complex 標籤群質心）
- [x] T3.1 Follow（2026-07-19：全鏈實測——f= 還原鎖定、拖曳解鎖、Back to train 回鎖、EMA 時速 59km/h 量級正確）
- [x] T3.2 Station board（2026-07-19：Times Sq 實測 12 列、complex 聚合含走廊連通的 A/C——routes N,7,A,1,GS,R,2,C；簽名重建＋倒數節點更新）
- [x] T3.3 Search（2026-07-19：Times Sq 4 筆命中、pointerdown 選取開板）
- [x] T3.4 Deep link（2026-07-19：c/z/f/s 回寫 throttle；f=107300_1..N03R 新載入自動跟隨實測）
- [x] T3.5 行動版面（2026-07-19：模擬器 473 班兩列式無重疊；底板 CSS 承捷奏經驗，實機由明日用戶實測涵蓋）

## 3. Verify — 技術驗證

- [x] 看板：Times Sq 12 列、8 路線 complex 聚合（含 A/C 走廊）✓；ETA 源自同一 rt store 與 /api/rt 一致；逐秒倒數（簽名機制）
- [x] Follow 全鏈 ✓；時速 59 km/h（1 號線 207–215 St 段，量級合理）；到終自動解除承 M2 selectedAlive 邏輯
- [x] Deep link：f= 還原跟隨實測 ✓；s=127 還原（hash 實測含 s）；過期 trip 30s 靜默逾時
- [x] lint／build 綠；部署 bundle 一致（index-DMvF1XMy）；行動模擬器 473 班兩列式 ✓
- [ ] Gate 前雙掃描（結案時執行）

## 4. Validate — 需求驗收

- [ ] 用戶實測（含遞延的 M2 實地對板一併）：看板 vs 月台倒數時鐘、跟車體驗、分享連結
- [ ] 同意進 M4/M5（收尾：每日 CI、發佈配件、轉 Public）

## 5. Check 紀錄（2026-07-19 填寫——與實作同日，不留待填）

### Code Review
- 範圍：ui/{stationboard,search,deeplink}、main（follow/deeplink/質心）、basemap（站點 guard）、position（cap）。lint／tsc 零發現。
- 發現與處置：
  1. 看板 collect() 每秒全 trips×stops 掃描（~4k ops）——量級無虞；若未來多城市共用引擎再索引化。
  2. 行動版 traininfo 與 stationboard 同為底部錨定，兩者同開時重疊——承捷奏既知取捨；使用情境（看板 vs 跟車）通常互斥，觀察實測回饋再決定。
  3. f= 還原於 frame 迴圈輪詢比對（30s 逾時）——字串比較成本可忽略；過期分享連結靜默優雅。
  4. deeplink 模組級單例 timer——單寫入者成立；多實例化時需重構（不預期）。
  5. dev API_BASE 指向自訂網域——nycrhythm-web.vercel.app 於網域綁定後 404 的環境變化已吸收。

### Verify 結果
§3 四項全過（Times Sq 8 路線聚合、follow 全鏈＋59km/h、f=/s= 還原、部署 bundle 一致＋行動模擬器）。

### Validate 結果
待明日（2026-07-20）用戶實地：看板 vs 月台倒數、跟車體驗、分享連結——與 M2 遞延的對板合併執行。

### 偏差與學習
1. 估 1.5 人日、實際約 0.3——捷奏 M3 的設計與教訓（iOS 四規、兩列式、throttle）直接複用，幾乎零踩坑。
2. **雙城累計：nycrhythm M0→M3 檢查完成僅約一天**（捷奏底盤的複利效應）；MTA 資料品質（官方 shapes/RT）再加成。
3. 環境會漂移：外部 URL（vercel.app 別名）因用戶操作失效——dev 依賴外部端點時要預期變動。

## 6. 用戶確認（Gate）

- [ ] 已回報 M3 結果並取得確認（日期：＿＿＿）
- [ ] Gate 前雙掃描已執行
