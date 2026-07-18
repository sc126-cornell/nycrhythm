# SPIKE-NOTES — MTA 資料實測（M0）

執行：2026-07-19（紐約週六下午時段）。樣本：`pipeline/samples/`；原始包：`pipeline/raw/`（gitignored）。

## 結論一句話

**RT-first 架構完全成立**：8/8 餵送免金鑰解碼成功、此刻 529 班列車實時在線（新鮮度 0–10 秒）、TripUpdates＋VehiclePositions 雙料齊全；靜態包結構乾淨，所有規模數字到手。

## 1. GTFS-RT 實測（週六 ~16:00 EDT）

| 餵送 | 大小 | 新鮮度 | trips | vehicles | 路線 |
|---|---|---|---|---|---|
| irt | 179KB | 4s | 223 | 116 | 1–7＋GS |
| ace | 66KB | 8s | 66 | 66 | A,C,E |
| bdfm | 64KB | 0s | 65 | 65 | D,E,F,FS |
| g | 20KB | 0s | 24 | 24 | G |
| jz | 17KB | 9s | 34 | 34 | J |
| nqrw | 85KB | 10s | 77 | 77 | N,Q,R |
| l | 31KB | 2s | 32 | 18 | L |
| si | 6KB | −5s | 8 | 8 | SI |

- **總計 529 trips／408 vehicles**（週六；平日尖峰預估 600–700，效能目標據此驗證）
- 週末服務證據：B/M/W/Z 未營運；**E 出現在 bdfm 餵送＝週末改道實錄**——RT-first 天然吸收改道 ✅
- 94%+ trips 含未來停靠（208/223 等）→ **到站序列插值可行** ✅
- 瘦身後單餵送估 30–120KB JSON（原始 protobuf 6–179KB）✅ 符合 ≤150KB 目標

## 2. GTFS 靜態解剖

| 檔案 | 規模 | 要點 |
|---|---|---|
| routes | 29 條 | 含快車變體 6X/7X/FX、三接駁 GS/FS/H、SIR |
| stops | **496 母站＋992 月台** | 月台 ID＝`母站+N/S`（`101N/101S`）——**方向就編在 stopId 裡** ✅ |
| shapes | **257 變體／150,744 點** | `1..N03R` 格式；快車/分岔各自成形——幾何無需自建 ✅ |
| trips | 20,309 班 | service_id 乾淨三分：Weekday/Saturday/Sunday ✅ |
| stop_times | **34.7MB／563,534 行** | 證實瘦身策略必要（RT-first、靜態按線懶載） |
| transfers | 613 條 | 站群/轉乘連結存在——complex 歸併可據此 ✅ |

## 3. 設計落定事實

1. **位置引擎**＝該車 `u:[{s,a}]` 相鄰兩停靠間插值＋月台座標投影至該 trip 的 shape；vehicles 的 currentStatus（進站/停靠/離站）可加細。
2. **方向**：stopId 尾碼 N/S；無需 NYCT 擴充欄位即可運作。
3. **色票**：Spike 用簡化 CSV 解析（未處理引號逗號）致 route_color 部分錯讀——正式管線需完整 CSV parser；顏色同時以官方幹線色常數為準（A/C/E 藍 #0039A6、B/D/F/M 橘 #FF6319、G 綠 #6CBE45、J/Z 棕 #996633、L 灰 #A7A9AC、N/Q/R/W 黃 #FCCC0A、1/2/3 紅 #EE352E、4/5/6 綠 #00933C、7 紫 #B933AD、S 灰 #808183、SIR 藍）。
4. **`/api/rt` 原型已就**（本 repo api/rt.ts）：解碼＋瘦身＋s-maxage=15——部署後驗 HIT。

## 4. 風險重評（PRD §6）

| 風險 | 判定 |
|---|---|
| protobuf 細節 | ✅ 已解（樣本落盤） |
| VehiclePositions 可用度 | ✅ 有且量足（408） |
| 600 列渲染 | 🟡 待 M2 實測（捷奏 149@61fps 基準樂觀） |
| shapes 品質/快車變體 | ✅ 官方齊備（257 變體） |
| 站群對應 | ✅ transfers 613 條可據；M1 落實 |
| 餵送穩定性 | 🟡 單點觀測 OK；上線後靠退化路徑（承捷奏） |

## 5. Schema 凍結

```jsonc
// /api/rt?feed=irt → { ok, at, trips:[{ t, r, u:[{ s:"101N", a:unixSec }] }], vehicles:[{ t, s, st, ts }] }

// data/network.json（M1 產出；v2 綱要）
{
  "routes": [{ "id": "A", "color": "#0039A6", "name": "8 Avenue Express" }],
  "stations": [{ "id": "101", "name": "Van Cortlandt Park-242 St", "lonlat": [...], "complex": "..." }],
  "shapes": { "1..N03R": { "pts": [[lon,lat],...], "chainage": [...], "stopKm": { "101N": 0, ... } } }
}
// 靜態時刻表不整包進前端（34.7MB）：RT-first；站牌未來班次由 /api 或按線懶載（M1 定案）
```
