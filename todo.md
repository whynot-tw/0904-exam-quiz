# Project TODO

- [x] 完整讀取 Google Drive 專案資料夾與指定 MANUS 執行指令文件
- [x] 完整讀取指定 SPEC 文件並建立可驗證的功能／資料／QA 對照表
- [x] 完整讀取 9-4筆試刷題App_DB Google Sheet 的欄位、題庫資料與舊錯題資料
- [x] 取得並讀取 03_甄試題庫中的兩份官方試題 PDF
- [x] 以官方 PDF 題目與答案作為 Source of Truth，解析不明題目標記 needs_review
- [x] 建立官方題庫資料模型：題目、選項、正確答案、解析、來源、needs_review、題組／科目
- [x] 建立題庫匯入與官方資料核對流程，不以網路或新版 Windows 知識改寫官方答案
- [x] 實作依題組／科目篩選的逐題單選刷題模式
- [x] 實作作答後即時顯示對錯回饋、官方答案與解析
- [x] 實作 needs_review「待審」視覺標示，且不阻擋正常作答
- [x] 實作錯題本，自動記錄答錯題目並支援複習與重新作答
- [x] 實作各科答題數、正確率與完整歷史作答紀錄
- [x] 實作 Manus OAuth 登入，保護個人答題紀錄與錯題本
- [x] 實作僅 admin 可存取的題庫管理後台
- [x] 實作 admin 檢視全部題目、篩選 needs_review、更新解析或答案
- [x] 建立響應式深色主題與長時間備考導向的高質感介面
- [x] 建立 schema、資料庫查詢 helper、tRPC procedures 與前端 typed hooks
- [x] 完成必要 Vitest 單元測試與錯誤／權限測試
- [x] 完成 Google Sheet 匯入資料筆數、欄位、官方答案與 needs_review QA
- [x] 完成舊錯題遷移並記錄遷移結果與異常項目
- [x] 建立全新隔離 GitHub private repository 與獨立 branch
- [x] 完成 Vercel Preview，不建立或推送 Production（deployment 已建立；外部存取受 Vercel SSO 保護）
- [x] 完成 P0 A–J 驗收與瀏覽器響應式 QA（managed preview／本地 QA 通過；Vercel 外部 URL 需登入）
- [x] 依 MANUS 執行指令以 A–I 格式回報 GitHub、branch、commit SHA、Preview URL、題庫 QA、Sheet 驗證、舊錯題遷移與 P0 驗收結果

## Change History

- [x] 2026-08-20：新增深色主題、高質感視覺、刷題／錯題／進度／admin 後台／OAuth 等明確需求。

## Gap Resolution History

- [x] 2026-08-20：加入 Google Apps Script bootstrap、completeAttempt 與 updateQuestion 對接層，網站端採 Google Sheet 優先、官方 PDF snapshot fallback。
- [x] 2026-08-20：修正錯題重刷由 questionId 回查完整題目，並補上全量歷史／各科統計 API 與 UI。
- [x] 2026-08-20：adminUpdate 改為本地預覽持久化並在設定 Sheet API 時寫回 Questions，前端編輯表單已接 mutation。
- [x] 2026-08-20：新增 admin 權限、admin 更新、題庫規則測試。
- [x] 2026-08-20：四筆舊錯題已實際回填 Google Sheet WrongQuestions!A13:J16，並回讀驗證為 matched。

## New Change Request

- [x] 將深色主題改為明亮、高質感且適合長時間備考的配色
- [x] 更新明亮主題下的頁面 metadata、PWA theme color 與可讀性對比
- [x] 完成明亮主題的桌面／手機響應式 QA、測試與新 checkpoint

## New Change Request

- [x] 新增使用者可調整的閱讀字級大小設定
- [x] 新增使用者可調整的排版密度設定，影響卡片間距、題目行距與版面留白
- [x] 儲存個人顯示設定並在重新載入後還原
- [x] 完成字級／密度設定的手機與桌面 QA、回歸測試與新 checkpoint

## New Change Request

- [x] 在答題介面新增可切換的星號標記按鈕
- [x] 建立僅限登入使用者的個人星號題目持久化資料與 API
- [x] 在錯題／複習區提供星號題目專屬清單與重新作答入口
- [x] 完成星號標記的權限、資料寫入、手機／桌面 QA 與新 checkpoint

## New Change Request

- [x] 實作星號題目隨機測驗模式，僅使用登入者自己的星號題目
- [x] 支援對每個星號題目儲存與編輯自訂標籤
- [x] 在統計頁顯示星號題目完成率與最近複習日期
- [x] 補齊星號測驗、標籤與統計的資料寫入／權限／回歸測試及響應式 QA

## New Change Request

- [x] 支援依星號標籤篩選的隨機測驗模式
- [x] 支援設定與保存星號題目的提醒日期
- [x] 顯示到期／即將到期的考前複習提示
- [x] 在首頁加入星號題目總數、已複習比例與待處理提醒摘要
- [x] 補齊標籤篩選、提醒日期、首頁摘要的資料寫入／權限／回歸測試與響應式 QA
- [x] 驗證選定星號標籤後，隨機測驗題目池只保留符合標籤的題目
- [x] 驗證星號清單的提醒日期編輯器在手機與桌面均可呈現且保存後可讀回

## New Change Request

- [x] 盤點 Google Drive 原始題庫、既有錯題、備註與設定資料，並核對目前 CMS 資料表
- [x] 建立 CMS 分類、來源追溯與官方 PDF 答案優先的匯入對照規則
- [x] 安全匯入題庫與可遷移的既有學習資料至 CMS 資料庫，不覆寫原始雲端資料
- [x] 驗證 CMS 題庫、分類、資料筆數、既有功能相容性與匯入可重複性
- [x] 保存 CMS 資料匯入版本並交付驗證結果

## New Change Request

- [x] 整理並交付 8 題 needs_review 題目的完整內容、現行答案、解析與待審原因，供使用者逐題審核

## New Change Request

- [x] 維持 8 題 needs_review 題目不變，不進行啟用、刪除、合併或答案修改
- [x] 優先確認並交付既有刷題網站的可用預覽與核心功能狀態

## New Change Request

- [x] 盤點 CMS 的 sourceKey、sourceSection 與 category 分類資料，確認可作為課程類型選擇器來源
- [x] 在測驗設定加入課程類型選擇，並依選擇結果限制可抽取的題目池
- [x] 補齊課程類型篩選的測試、手機／桌面 QA 與交付說明

## New Change Request

- [x] 盤點既有作答紀錄、題目課程對應與可用統計資料，定義各課程答對率與完成度
- [x] 在課程類型選擇器旁實作各課程的進度條與答對率視覺化提示
- [x] 補齊課程進度統計 API、單元測試、手機／桌面 QA 與交付說明
