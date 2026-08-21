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

## New Change Request

- [x] 盤點既有課程進度、作答統計與設定儲存資料流，定義目標完成度與排序規則
- [x] 儲存個人課程完成度目標，並依目標差距產生進度條旁的視覺化激勵提醒
- [x] 在首頁新增登入使用者專屬的各課程學習摘要與快速進入弱項練習入口
- [x] 在課程選單新增依答對率最低、完成度最低排序的控制項，並保留全部課程排序
- [x] 補齊目標、摘要、排序的測試、手機／桌面 QA 與交付說明

## New Change Request

- [x] 擴充每課程統計，計算最近作答日期、久未練習狀態與最低答對率的可練習課程
- [x] 在首頁新增一鍵練習最弱科目入口，並處理尚無作答紀錄的狀態
- [x] 在首頁課程摘要顯示最近作答日期與久未練習提示
- [x] 補齊最弱科目與最近作答資訊的測試、手機／桌面 QA 與交付說明

## Gap Resolution

- [x] 讓首頁一鍵練習最弱科目直接開始 5 題最弱課程練習，而非僅進入測驗設定
- [x] 在課程摘要同時顯示格式化最近作答日期與相對久未練習提示
- [x] 以登入且已有作答資料的狀態完成桌面／手機 QA，並交付最弱科目與最近作答功能結果

## QA Evidence Resolution

- [x] 以登入且已有作答資料的帳號完成桌面／手機 QA，驗證首頁「一鍵練習最弱科目」、格式化最近作答日期與相對久未練習提示
- [x] 向使用者正式回報最弱科目與最近作答功能的實際行為與 QA 結果

## New Change Request

- [x] 盤點官方題庫與 CMS 現有分類欄位，建立次分類分析依據
- [x] 依官方題幹產出 Windows、Linux 等候選次分類草案、題數分布與待判定項目
- [x] 交付次分類分析供使用者確認，確認前不修改題目、答案或既有分類資料

## Confirmed Subcategory Implementation

- [x] 建立主要次分類與待確認標記的資料模型、migration 與官方題庫對照規則
- [x] 依官方題幹批次寫入六個主要次分類，將重疊／未命中題目標記為待確認而非猜測分類
- [x] 在測驗設定加入次分類篩選，並使抽題、進度與最弱科目統計依該範圍正確運作
- [x] 在 admin 後台顯示與可安全調整次分類／待確認狀態
- [x] 補齊匯入、篩選、統計、權限與手機／桌面 QA，保存 checkpoint 並交付結果

## Subcategory Statistics Resolution

- [x] 在測驗設定顯示目前課程範圍內答對率最低的次分類，並與次分類進度資料使用同一題目範圍
- [x] 補齊次分類弱項統計的單元測試與 UI 驗證

## Subcategory Delivery Resolution

- [x] 以登入且已有作答資料的帳號確認桌面／手機的次分類弱項提示、次分類進度與 admin 次分類標籤
- [x] 保存次分類導入與弱項統計版本，並正式交付分類範圍、待確認題數與功能行為

## New Change Request

- [x] 盤點 CMS 中 234 題待確認分類的題目資料、待確認註記與既有 admin 清單流程
- [x] 在 admin 題庫管理新增「待確認分類」篩選與 234 題清單顯示
- [x] 提供逐題次分類、待確認原因與安全修改入口，不改動官方題目或答案
- [x] 補齊待確認分類清單、權限、持久化、手機／桌面 QA 與交付說明

## Regression Fix

- [x] 修正測驗設定初次載入時次分類資料未就緒造成課程進度提示例外的問題

## Pending Classification Review Resolution

- [x] 驗證將待確認分類題目改為已分類後會寫回 CMS，並自待確認分類清單移除
- [x] 核對 admin 已登入狀態下的待確認分類清單、搜尋欄、待確認原因與審核入口
- [x] 向使用者正式交付 234 題待確認分類審核流程與使用方式

## Admin Session QA Follow-up

- [x] 以 admin 已登入工作階段確認待確認分類清單載入 234 題、搜尋與逐題審核控制可實際操作

## New Change Request

- [x] 盤點待確認分類題目中可供快速篩選的 Windows、Linux 等關鍵字與題數
- [x] 在 admin 待確認分類介面新增快速關鍵字篩選按鈕，並同步既有搜尋條件
- [x] 補齊快速篩選的單元測試、手機／桌面 QA 與交付說明

## New Change Request

- [x] 盤點待確認題目的未審核數量、快速關鍵字分布與既有 admin 更新安全契約
- [x] 在快速篩選按鈕加入未審核題數徽章，並支援多個關鍵字同時選取與聯集篩選
- [x] 新增僅 admin 可用的批次次分類更新 API，確保只更新分類欄位、不改動官方題目與答案
- [x] 在審核介面提供勾選題目、批次指定次分類／狀態／註記與成功回饋
- [x] 補齊徽章、複選、批次持久化、權限、手機／桌面 QA、checkpoint 與交付說明

## Batch Review Delivery Resolution

- [x] 為批次次分類更新提供已更新題數的成功通知與失敗提示
- [x] 以 admin 已登入工作階段驗證徽章、多選、勾選與批次分類控制的實際操作
- [x] 保存批次審核工具版本並正式交付功能結果

## Batch Review Final QA

- [x] 以登入 admin 工作階段實際驗證未審核徽章、多關鍵字、題目勾選、批次儲存與成功通知
- [x] 保存批次審核工具完整版本並以 checkpoint 正式交付

## New Change Request

- [x] 設計並建立分類審核歷程資料模型，保存批次操作前的分類欄位以供安全復原
- [x] 新增僅 admin 可用的批次操作復原與待確認題目匯出功能，不觸及官方內容欄位
- [x] 在 admin 審核頁新增審核完成率儀表板與近期可復原操作清單
- [x] 補齊歷程、復原、匯出、完成率、權限、手機／桌面 QA、checkpoint 與交付說明

## Review Workflow Quality Follow-up

- [x] 為完成率與復原歷程補上明確 loading、error 與無歷程 empty state，避免查詢失敗顯示為 0
- [x] 以 admin 已登入工作階段驗證桌面／手機的完成率、復原清單、復原按鈕與 CSV 匯出流程
- [x] 保存本輪 checkpoint 並交付分類審核管理流程的功能與 QA 證據

## Review Workflow Verification Recovery

- [x] 為完成率與復原歷程提供頁面內可見的 loading、error 與 empty state，且錯誤時不顯示為 0% 完成率
- [x] 完成已登入 admin 的桌面／手機實際互動 QA，保存完成率、復原操作及 CSV 匯出的可追溯證據
- [x] 保存本輪 checkpoint 並整理本輪分類審核管理流程的交付與 QA 證據

## Publish-First Scope Change

- [x] 暫停管理員進階功能的後續驗證與擴充，先整理核心刷題 App v0.1 的可發布版本
- [x] 完成核心功能回歸驗證並保存可發布 checkpoint，交由使用者在介面執行 Publish

## Wrong Question Book Follow-up

- [x] 盤點錯題自動記錄、錯題清單、狀態篩選與重新作答流程
- [x] 補強錯題本中使用者辨識與回顧答錯紀錄的介面或資料流程缺口
- [x] 驗證答錯寫入、錯題回顧、狀態篩選、重新作答及登入權限，保存 checkpoint 並交付結果

## Wrong Question Book Verification Recovery

- [x] 明確記錄錯題本既有功能是否有產品缺口，若無缺口則保存程式與流程依據
- [x] 補齊錯題本匿名限制、登入讀取、狀態篩選與重新作答的可驗證測試
- [x] 保存本輪錯題本 follow-up checkpoint，並整理驗證結果供使用者查看

## Wrong Question AI Explanation

- [x] 定義錯題 AI 解析輸出格式與官方題庫保護規則，確認 AI 僅補充學習思路
- [x] 建立僅限登入使用者使用的伺服器端 AI 錯題解析 API 與安全錯誤處理
- [x] 在錯題本提供逐題 AI 解析入口，呈現錯誤原因、正確思路與複習重點
- [x] 補齊官方內容不變、權限、輸出格式與手機／桌面 QA，保存 checkpoint 並交付結果

## AI Explanation Verification Recovery

- [x] 在 AI 解析 prompt、結構化輸出、API 與錯題卡補上明確的錯誤原因欄位
- [x] 依使用者指示暫緩已登入且有錯題資料的 AI 解析實機測試；保留按鈕、載入、成功與錯誤回饋流程供後續驗收
- [x] 保存 AI 錯題解析 checkpoint 並整理本輪功能交付說明

## Site Identity and Hero Refresh

- [x] 將主標更新為「115 電腦應用與AI工具班」、次標更新為「9/4筆試題庫刷題」，網站名稱顯示為「主標┃次標」
- [x] 將各頁 Hero 主標統一調整為 32px、字重 400，並依明亮主題調整次標視覺層級
- [x] 驗證桌面／手機首頁、測驗、錯題與統計頁的名稱與 Hero 排版，保存 checkpoint 並交付結果
- [x] 保留 AI 錯題解析，等待使用者日後以登入且有錯題資料的帳號完成實機測試

## Vercel Production Domain

- [ ] 核對三個現有 Vercel Production 專案與 exam-quiz.vercel.app 網址可用性
- [ ] 確認應承接正式網址的刷題 App 專案，避免修改或覆蓋不相關的既有部署
- [ ] 在使用者確認切換後設定 exam-quiz.vercel.app 並驗證公開 Production 路由

## Vercel Deployment Discovery Recovery

- [ ] 從專案設定、GitHub 遠端與公開 Vercel 網址自行辨識刷題 App 的實際 Production 專案
- [ ] 核對 exam-quiz.vercel.app 是否可安全由識別出的刷題 App 專案承接，避免影響其他既有網站

## Vercel URL Selection Update

- [ ] 核對 whynot-examquiz.vercel.app 可用性，並確認可由目前明亮版刷題 App 安全承接
- [ ] 建立或連結目前刷題 App 的 Production 專案，設定 whynot-examquiz.vercel.app 並驗證公開頁面

## Production Wrong Question and AI Check

- [ ] 檢查 whynot-examquiz.vercel.app 的錯題本公開載入、登入前置條件與 AI 解析入口
- [ ] 回報錯題記錄、重新作答與 AI 解析在公開部署的可驗證狀態及後續限制

## Production URL Blocking Finding

- [ ] 修復 whynot-examquiz.vercel.app 的 Vercel DEPLOYMENT_NOT_FOUND，完成 Production 專案與網域綁定後重新檢查錯題本及 AI 解析

## Vercel Redeployment Request

- [ ] 將目前已驗證版本重新部署至 Vercel Production，保留三個既有舊部署不受影響
- [ ] 將新版 Production 正確對應至 whynot-examquiz.vercel.app，驗證首頁、錯題本與 AI 解析前置條件

## External Vercel Compatibility

- [ ] 確認全端刷題 App 的資料庫、Manus OAuth、S3 與 AI 服務在外部 Vercel 的可用設定與必要環境變數
- [ ] 在不遺失目前功能的前提下，選擇可運作的公開部署方案並重新驗證 whynot-examquiz.vercel.app

## New Isolated Vercel Project

- [ ] 建立全新隔離的 Vercel 專案 whynot-examquiz，連結 whynot-tw/0904-exam-quiz 的 build/v0.1 分支且不修改舊部署
- [ ] 建立 Production 部署並對應 whynot-examquiz.vercel.app，核對資料庫、OAuth 與 AI 服務設定

## Vercel Deployment Permission Blocker

- [ ] 解除 Vercel 團隊對 whynot-examquiz 的 Production Deployment 403 權限限制後，重新建立部署與綁定網址

## Manus Publish First

- [ ] 以目前已驗證的核心刷題版本透過 Manus 系統隨機網域發布，供使用者先完整刷題
- [ ] 暫緩 Vercel 專案權限與網址綁定工作，待使用者有時間再續作

## Wrong Question PDF Export

- [x] 定義錯題本 PDF 匯出格式，包含題號、題幹、選項、使用者作答、官方答案、官方解析與複習狀態
- [x] 建立登入使用者專屬的錯題匯出資料流程，禁止匿名或跨使用者資料讀取
- [x] 在錯題本新增 PDF 匯出按鈕、下載狀態與空清單提示
- [x] 補齊 PDF 內容、中文排版、權限、下載與手機／桌面 QA，保存 checkpoint 並交付結果
