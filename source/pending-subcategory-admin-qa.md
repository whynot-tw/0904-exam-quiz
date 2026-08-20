# 待確認分類 Admin 審核 QA

| 項目 | 驗證結果 |
|---|---|
| 登入角色 | Preview 的 `auth.me` 回應為 `role: admin` 的帳號；admin 頁顯示 Admin only 與題庫管理工具列。 |
| 待確認清單 | `quiz.adminList({ needsReviewOnly: false, subcategoryReviewOnly: true })` 的 admin 權限測試回傳 234 題，且每題狀態均為 `needs_manual_review`。 |
| 審核持久化 | 測試將一筆待確認硬體題目改為「電腦硬體與組裝／已分類」，驗證立即自待確認清單移除，最後還原原本的待確認欄位。 |
| 審核介面 | admin 預設篩選為待確認分類；提供搜尋欄、待確認原因、次分類／狀態／註記欄位與「審核分類」入口。 |
| 響應式 | 手機版會將搜尋欄換行為全寬，逐題審核按鈕顯示為全寬，避免 234 題長清單的控制項擠壓。 |

題目文字、選項、官方答案與解析不會由分類審核流程寫入或更動。
