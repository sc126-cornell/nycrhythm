# Phase 計畫 — M4/M5：收尾與發佈（合併章）

| 項目 | 內容 |
|---|---|
| 狀態 | 🟢 全結案（2026-07-19 發佈 Public；2026-07-20 實地 Validate 通過）——餘 BACKLOG A2 尖峰觀測（非 Gate） |
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
- [x] T45.5 Public 就緒 ✓（金鑰痕跡掃描空、LICENSE/README/attribution 齊）——**2026-07-19 用戶下令，已執行**（gh 確認 visibility=PUBLIC、license=MIT）

## 3. Verify — 技術驗證

- [x] CI 全綠＋bot commit（network.json 戳記更新）＋Vercel 自動部署鏈驗證
- [x] favicon 200、About 元素在部署 HTML、bundle 一致（index-CuMsP39I）
- [x] 金鑰痕跡掃描：空（附帶再遇 head 吞 exit code——無害場景，警惕留檔）
- [x] lint／build 綠；雙掃描於最終 Gate 執行

## 4. Validate — 需求驗收

- [x] 實地日結果（M2 對板＋M3 體驗）回報良好——2026-07-20 多趟實測：操作順暢、誤差最長 30 秒內、大部分幾乎同步
- [x] 用戶下令轉 Public → 執行 → **雙城完賽** 🎉（2026-07-19 用戶指令；gh 確認 PUBLIC/MIT）

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

### 實地回饋 R1（2026-07-19 晚，用戶紐約現場搶先體驗；commit 016b73e）
用戶截圖回報三問題，同晚修復部署：
1. **時速飆到 200–300 km/h**（截圖 223 km/h）：每 20s RT 輪詢重新錨定時，插值位置單幀瞬移，假樣本灌進速度 EMA。修：隱含時速 >110 km/h 的樣本不進 EMA（NYC 極速約 88）。
2. **部分車站沒有站名**：非 complex 車站誤按「站名」歸併——NYC 同名站極多（23 St ×5 線），五站被合併成一個座標居中的標籤，其餘圓點全裸（截圖 Flatiron 即此景）。修：非 complex 改按站 id 各自建標籤；繪製時同名標籤近距離抑制（<70×16px 跳過），低倍率不互疊、拉近後各自顯示。
3. **站點圓圈太小難點**：固定 radius 3。修：隨 zoom 放大（z≥15→6 / z≥13.5→5 / z≥12→4），canvas renderer 加 `tolerance: 8` 擴大點擊判定。
教訓：①插值引擎的任何「重新錨定」都是速度／動畫的汙染源，衍生量（速度）要有物理合理性守門；②凡按名稱做 key 的邏輯在 NYC 都要重新審視（同名站是常態不是例外）——與捷運「站名唯一」的直覺相反。

### 實地回饋 R2（2026-07-19 晚；commit 39dc17d，BUILD M45c）
用戶再報一站無標籤（42 St-Port Authority，A/C/E，紅圈截圖）：成因與 R1 不同——「每 complex 一枚標籤」的設計對**含多個不同站名的 complex** 失效（35 個 complex 中 17 個如此：Times Sq＋Port Authority、Bleecker＋Broadway-Lafayette、51 St＋Lex/53、WTC 四名組…），遠端成員全裸。修：complex 改「**每個不同站名一枚標籤**」（同名月台仍合併質心）。資料驗證：標籤 444→464＝409 獨立站＋55 組（cx×名）全覆蓋 PASS；Port Authority 標籤座標偏移 0.0 m；五個多名 complex 抽測全 YES。
教訓：「一個 complex＝一個地點」是台北直覺；NYC 的 complex 是**通道相連的多個地點**，顯示粒度應以「站名」為準而非 complex。

### Post-M45 調整 code review（2026-07-19，用戶指示；範圍 016b73e..caef3ab）
涵蓋：R1 三修、品牌改名（NYC Rhythm）、R2 complex 標籤、F1 我的位置、F2 光束＋開站自動定位（main.ts / basemap.ts / trains.ts / locate.ts / style.css / index.html）。
1. **修正**：locate.ts iOS motion 權限競態——對話框彈出期間關掉 📍，granted resolve 後仍會綁 compass listener（功能已關卻留監聽、`boundEvent` 失真）。修：resolve 時查 `watchId` 存活才綁（BUILD F2b）。
2. **留觀察**：landscape 的羅盤補償符號（`+ screen.orientation.angle`）未實證；直立（angle=0）不受影響，實測方向不對再校。
3. **已知取捨**：速度濾波 110 門檻下，插值窗被壓縮仍可能短暫顯示 90–110 km/h；根治＝BACKLOG B4（VehiclePositions currentStatus 修飾插值端點）。
4. **確認無虞**：速度濾波跳過幀後 lastSample 仍推進（不凍結）；dup 標籤抑制每幀重建、順序穩定不閃爍；canvas `tolerance` 不影響非互動 polyline；藍點 marker `interactive:false` 不擋點車；toast 層級高於 About；自動定位連續 watchPosition 耗電與同類產品同級。
lint／tsc／build 綠；F2b 部署驗證通過。

## 6. 用戶確認（Gate）

- [x] 已取得用戶「轉 Public」指令並執行＝發佈確認（日期：2026-07-19；實地日回報 7/20 收尾於 Validate ①與 M3 Gate）
- [x] Gate 前雙掃描已執行（2026-07-19：未勾項僅餘 7/20 實地日相關與模板佔位，無漏網）
