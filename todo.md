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
