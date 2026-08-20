# 分類審核管理流程強化版 QA 證據

## 範圍與資料保護

本輪功能僅保存及復原 `subcategory`、`subcategoryStatus`、`subcategoryNotes` 三個分類欄位。批次審核歷程中的操作前快照不含官方題幹、選項、正解或解析，因此復原不會改寫官方 PDF Source of Truth。

| 項目 | 驗證結果 |
| --- | --- |
| CMS 題庫總數 | 657 題 |
| 已分類 | 423 題 |
| 待確認分類 | 234 題 |
| 儀表板完成率 | 64%（423 / 657，四捨五入） |
| 歷程資料表 | `classificationReviewBatches` migration 0007 已套用 |

## 功能驗證

| 功能 | 驗證方式 | 結果 |
| --- | --- | --- |
| 批次操作歷程 | admin 批次分類後查詢歷程 | 建立操作前分類快照及批次 metadata |
| 批次復原 | admin API 復原指定 batch | 還原原分類、狀態及註記；官方內容不變 |
| 審核完成率 | CMS aggregate 計數 | 423 已分類、234 待確認、完成率 64% |
| 待確認 CSV | 匯出 API 與 CSV 純函式測試 | 欄位含題號、題幹、A–D、正解、待確認原因、課程、次分類、狀態；引號安全跳脫 |
| 權限 | admin tRPC integration tests | 一般使用者拒絕存取；admin 可更新、復原與匯出 |

## 測試與介面 QA

> 全專案回歸：Vitest 13 個測試檔、34 個測試通過；TypeScript check 與 production build 通過。

| 檢查面向 | 證據 | 結果 |
| --- | --- | --- |
| 後端整合 | `server/permissions.test.ts` | 7 項 admin 權限、批次、歷程、復原、完成率與匯出測試通過 |
| CSV 格式 | `server/adminPendingExport.test.ts` | 1 項欄位與引號跳脫測試通過 |
| 管理員資料回填 | admin tRPC batch request | HTTP 200；最近觀測回應約 1.36 秒 |
| 桌面版 | 1280 × 720 預覽 | 同步提示、完成率卡、CSV 控制項、待確認篩選皆可讀 |
| 手機版 | 390 × 844 預覽 | 同步提示與匯出按鈕垂直排列，未與底部導覽重疊 |

## 可見狀態規則

完成率與復原歷程在載入時顯示「正在同步分類審核資料」。若完成率查詢失敗，頁面明確說明不以 0% 取代真實資料，並提供重新載入按鈕。若尚無批次紀錄，頁面會提示「尚無可復原操作」及其建立條件。
