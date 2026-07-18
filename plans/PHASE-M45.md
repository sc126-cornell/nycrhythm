# Phase 計畫 — M4/M5：收尾與發佈（合併章）

| 項目 | 內容 |
|---|---|
| 狀態 | 🔵 進行中（2026-07-19 用戶指示：實地驗收明日，先進 M4/M5） |
| 預估 | 1 人日 |
| 開始 / 完成日期 | 2026-07-19 / — |

## 1. 目標（Plan）

1. **每日 GTFS 靜態自動更新 CI**（04:10 NY 時間）——**MTA 免金鑰＝零 secrets 設定**，抓 zip→build→validate→有變更才 commit。
2. **發佈配件**：favicon（♪ bullet）、About 面板（英文：方法、MTA/CARTO attribution、免責、MIT/GitHub）。
3. **BACKLOG.md**：遞延與前瞻項總表（明日實地、週一尖峰、og:image、模糊直配、餵送監測…）。
4. **轉 Public**：技術就緒；扣板機待用戶明確指示（慣例）。

**可展示物**：自動保鮮的完成品＋一鍵可公開的 repo。

## 2. 工作項目（Do）

- [ ] T45.1 `.github/workflows/daily-data.yml`：cron 08:10 UTC（=04:10 EDT）、無 secrets、bot commit、手動觸發驗證一次全綠
- [ ] T45.2 favicon.svg＋About 面板（ℹ 鈕、英文、版本戳）＋og meta 補 url
- [ ] T45.3 BACKLOG.md 建檔（A 驗收遞延／B 技術強化／C 前瞻）
- [ ] T45.4 README 更新（正式網址、狀態徽章區、雙城故事一句）
- [ ] T45.5 轉 Public 就緒檢查（無金鑰入 repo、LICENSE、attribution 齊）——**執行待用戶指令**

## 3. Verify — 技術驗證

- [ ] CI 手動觸發全綠；bot commit 產出或「無變更跳過」訊息正確
- [ ] About 面板開合、favicon 顯示；正式網址實測
- [ ] `git log -p | grep -i` 抽查無任何金鑰痕跡（MTA 本就免金鑰，形式確認）
- [ ] lint／build 綠；Gate 前雙掃描

## 4. Validate — 需求驗收

- [ ] 明日實地日結果（M2 對板＋M3 體驗）回報良好
- [ ] 用戶下令轉 Public → 執行 → **雙城完賽** 🎉

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

- [ ] 已回報並取得 v1.0 出貨確認（日期：＿＿＿）
- [ ] Gate 前雙掃描已執行
