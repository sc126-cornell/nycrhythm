# Phase 計畫 — M3：互動功能（跟車／看板／搜尋／深連結）

| 項目 | 內容 |
|---|---|
| 狀態 | 🔵 進行中（2026-07-19 M2 Gate 通過後開工） |
| 預估 | 1.5 人日 |
| 開始 / 完成日期 | 2026-07-19 / — |

## 1. 目標（Plan）

捷奏 M3 全套互動的紐約版（英文 UI、RT 資料源）＋ M2 code review 兩項待辦：

1. **Follow mode**：點列車→🎥 Follow→鏡頭鎖定；拖曳解鎖＋「Back to train」；即時時速；到終自動解除。
2. **Station board**：點車站（或搜尋）→ 該站（含 complex 全月台）即將進站列車——route bullet、目的地、ETA 倒數，純 RT 推導、逐秒更新。
3. **Search**：站名子字串、跳轉開板；行動版兩列式（捷奏教訓 day-1 套用）。
4. **Deep link**：hash `c/z/f(tripId)/s(stationId)`；throttle 回寫（debounce 飢餓教訓）；開啟還原（過期 trip 靜默略過）。
5. M2 遺留：prev 插值窗 cap 300s、complex 標籤改群質心。

**可展示物**：完整可玩——搜 Times Sq 看板、跟一班 Q 過曼哈頓大橋、把連結傳給朋友。

## 2. 工作項目（Do）

- [ ] T3.0 M2 遺留修正：position prev 窗 cap、complex 標籤質心
- [ ] T3.1 Follow：off/lock/free 狀態機、dragstart 解鎖、Back to train、EMA 時速、資訊卡骨架加 Follow 鈕（iOS 規則：骨架一次、文字節點更新）
- [ ] T3.2 Station board：station→complex→platforms 索引、RT 掃描聚合（route/dest/ETA 排序 limit 12）、簽名重建＋倒數 textContent 更新、站點點擊 guard（防誤選列車）
- [ ] T3.3 Search：zh 不需——英文站名子字串、pointerdown 選取、聚焦全選、行動兩列
- [ ] T3.4 Deep link：throttle 回寫、f=tripId 還原（等首輪 poll 後解析）、s=station 還原＋聚焦（行動抬升 22% 承捷奏）
- [ ] T3.5 行動版面：站板底板、搜尋列全寬、safe-area

## 3. Verify — 技術驗證

- [ ] 看板 ETA 與 /api/rt 原始一致（抽站對照）；逐秒倒數；complex 聚合正確（Times Sq 應同時見 1/2/3/7/S/N/Q/R/W）
- [ ] Follow：鎖定→拖曳解鎖→Back→到終自動解除；時速量級合理（20–55 km/h 段間）
- [ ] Deep link：f= 新分頁還原跟隨；s= 還原看板＋聚焦；過期 trip 靜默
- [ ] lint／build 綠；部署後正式網址實測；行動模擬器目檢
- [ ] Gate 前雙掃描

## 4. Validate — 需求驗收

- [ ] 用戶實測（含遞延的 M2 實地對板一併）：看板 vs 月台倒數時鐘、跟車體驗、分享連結
- [ ] 同意進 M4/M5（收尾：每日 CI、發佈配件、轉 Public）

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

- [ ] 已回報 M3 結果並取得確認（日期：＿＿＿）
- [ ] Gate 前雙掃描已執行
