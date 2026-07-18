# Phase 計畫 — M4/M5：收尾與發佈（合併章）

| 項目 | 內容 |
|---|---|
| 狀態 | 🟠 檢查完成（待明日實地 Validate＋用戶 Public 指令＝最終 Gate） |
| 預估 | 1 人日（實際約 0.15） |
| 開始 / 完成日期 | 2026-07-19 / 2026-07-19 |

## 1. 目標（Plan）

1. **每日 GTFS 靜態自動更新 CI**（04:10 NY 時間）——**MTA 免金鑰＝零 secrets 設定**，抓 zip→build→validate→有變更才 commit。
2. **發佈配件**：favicon（♪ bullet）、About 面板（英文：方法、MTA/CARTO attribution、免責、MIT/GitHub）。
3. **BACKLOG.md**：遞延與前瞻項總表（明日實地、週一尖峰、og:image、模糊直配、餵送監測…）。
4. **轉 Public**：技術就緒；扣板機待用戶明確指示（慣例）。

**可展示物**：自動保鮮的完成品＋一鍵可公開的 repo。

## 2. 工作項目（Do）

- [x] T45.1 每日 CI（2026-07-19：**首航一次全綠**——零 secrets、bot 首筆 `data: daily refresh` commit 已落地並觸發部署）
- [x] T45.2 favicon（♪ bullet）＋About 面板（英文、姊妹作互鏈）＋og:url——部署驗證 200
- [x] T45.3 BACKLOG.md（A 遞延 3／B 強化 7／C 前瞻＋流程備忘含 dev server 收尾教訓）
- [x] T45.4 README 完稿（正式網址、雙城一句故事、How it works）
- [x] T45.5 Public 就緒 ✓（金鑰痕跡掃描空、LICENSE/README/attribution 齊）——**扣板機待用戶指令**

## 3. Verify — 技術驗證

- [x] CI 全綠＋bot commit（network.json 戳記更新）＋Vercel 自動部署鏈驗證
- [x] favicon 200、About 元素在部署 HTML、bundle 一致（index-CuMsP39I）
- [x] 金鑰痕跡掃描：空（附帶再遇 head 吞 exit code——無害場景，警惕留檔）
- [x] lint／build 綠；雙掃描於最終 Gate 執行

## 4. Validate — 需求驗收

- [ ] 明日實地日結果（M2 對板＋M3 體驗）回報良好
- [ ] 用戶下令轉 Public → 執行 → **雙城完賽** 🎉

## 5. Check 紀錄（2026-07-19 同日填寫）

### Code Review
- 範圍：daily-data.yml、About/favicon/og、README/BACKLOG。lint／build 綠。
- 發現與處置：
  1. CI 的下載步驟借用 spike-static.ts——可用但語義混用，B7 已列更名（fetch-static.ts）。
  2. Actions Node 20 deprecation 標註（跑 Node 24，純提示）——雙城共通 backlog。
  3. Public 就緒掃描中 head 再度吞 exit code（無害場景）——規則不變：關鍵驗證不接管線。

### Verify 結果
§3 四項全過：CI 首航零 secrets 一次綠（對比捷奏 TDX 500 首航——免金鑰＋成熟模板紅利）、部署鏈完整、痕跡掃描空。

### Validate 結果
待明日實地日（M2 對板＋M3 體驗＋M45 整體）；Public 待用戶板機。

### 偏差與學習
1. 估 1 人日、實際約 0.15——收尾章幾乎純模板化。
2. **nycrhythm 全程統計：M0→M45 檢查完成、單日內完成**（vs 捷奏 4.5 人日）——第二座城市的複利是實打實的 30 倍速。
3. 背景任務衛生：dev server 用完即收（用戶手機端看到殘留任務的回饋）。

## 6. 用戶確認（Gate）

- [ ] 已回報並取得 v1.0 出貨確認（日期：＿＿＿）
- [ ] Gate 前雙掃描已執行
