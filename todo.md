# Project TODO

- [ ] 完整讀取 Google Drive 專案資料夾與指定 MANUS 執行指令文件
- [ ] 完整讀取指定 SPEC 文件並建立可驗證的功能／資料／QA 對照表
- [ ] 完整讀取 9-4筆試刷題App_DB Google Sheet 的欄位、題庫資料與舊錯題資料
- [ ] 取得並讀取 03_甄試題庫中的兩份官方試題 PDF
- [ ] 以官方 PDF 題目與答案作為 Source of Truth，解析不明題目標記 needs_review
- [ ] 建立官方題庫資料模型：題目、選項、正確答案、解析、來源、needs_review、題組／科目
- [ ] 建立題庫匯入與官方資料核對流程，不以網路或新版 Windows 知識改寫官方答案
- [ ] 實作依題組／科目篩選的逐題單選刷題模式
- [ ] 實作作答後即時顯示對錯回饋、官方答案與解析
- [ ] 實作 needs_review「待審」視覺標示，且不阻擋正常作答
- [ ] 實作錯題本，自動記錄答錯題目並支援複習與重新作答
- [ ] 實作各科答題數、正確率與完整歷史作答紀錄
- [ ] 實作 Manus OAuth 登入，保護個人答題紀錄與錯題本
- [ ] 實作僅 admin 可存取的題庫管理後台
- [ ] 實作 admin 檢視全部題目、篩選 needs_review、更新解析或答案
- [ ] 建立響應式深色主題與長時間備考導向的高質感介面
- [ ] 建立 schema、資料庫查詢 helper、tRPC procedures 與前端 typed hooks
- [ ] 完成必要 Vitest 單元測試與錯誤／權限測試
- [ ] 完成 Google Sheet 匯入資料筆數、欄位、官方答案與 needs_review QA
- [ ] 完成舊錯題遷移並記錄遷移結果與異常項目
- [ ] 建立全新隔離 GitHub private repository 與獨立 branch
- [ ] 完成 Vercel Preview，不建立或推送 Production
- [ ] 完成 P0 A–J 驗收與瀏覽器響應式 QA
- [ ] 依 MANUS 執行指令以 A–I 格式回報 GitHub、branch、commit SHA、Preview URL、題庫 QA、Sheet 驗證、舊錯題遷移與 P0 驗收結果

## Change History

- [ ] 2026-08-20：新增深色主題、高質感視覺、刷題／錯題／進度／admin 後台／OAuth 等明確需求。
