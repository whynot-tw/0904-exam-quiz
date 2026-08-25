import { useEffect, useMemo, useState } from "react";
import { Download, History, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { estimateWrongQuestionCsv, filterWrongQuestionCsvItems, formatWrongQuestionCsvSize, getDefaultWrongQuestionCsvColumns, readWrongQuestionCsvPresets, renameWrongQuestionCsvPreset, serializeWrongQuestionCsvPresets, WRONG_QUESTION_CSV_COLUMNS, type WrongQuestionCsvColumnKey, type WrongQuestionCsvPreset, type WrongQuestionCsvStatus } from "@/lib/wrongQuestionCsv";

type ExportOptions = { columnKeys: WrongQuestionCsvColumnKey[]; startDate?: string; endDate?: string; status: WrongQuestionCsvStatus; courseType?: string; subcategory?: string };

export function CsvExportAdvancedControls({ rows, filter, exporting, onExport }: { rows: any[]; filter: WrongQuestionCsvStatus; exporting: boolean; onExport: (options: ExportOptions) => void }) {
  const { user } = useAuth();
  const exportData = trpc.wrongQuestions.exportPdfData.useQuery(undefined, { enabled: Boolean(user) });
  const history = trpc.wrongQuestions.csvExportHistory.useQuery(undefined, { enabled: Boolean(user) });
  const [columnKeys, setColumnKeys] = useState<WrongQuestionCsvColumnKey[]>(getDefaultWrongQuestionCsvColumns());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [courseType, setCourseType] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presets, setPresets] = useState<WrongQuestionCsvPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [renamePresetName, setRenamePresetName] = useState("");
  const storageKey = `sep4-wrong-question-csv-presets-${user?.id ?? "guest"}`;
  const exportRows = exportData.data ?? [];
  const courseTypes = useMemo(() => Array.from(new Map(exportRows.filter(row => row.courseType).map(row => [row.courseType!, row.courseLabel || row.courseType!])).entries()).map(([id, label]) => ({ id, label })).sort((left, right) => left.label.localeCompare(right.label, "zh-TW")), [exportRows]);
  const subcategories = useMemo(() => Array.from(new Set(exportRows.filter(row => !courseType || row.courseType === courseType).map(row => row.subcategory || "待確認"))).sort((left, right) => left.localeCompare(right, "zh-TW")), [exportRows, courseType]);
  const hasPending = rows.some(row => row.status === "待複習");
  const filterOptions = (status: WrongQuestionCsvStatus): ExportOptions => ({ columnKeys, startDate: startDate || undefined, endDate: endDate || undefined, courseType: courseType || undefined, subcategory: subcategory || undefined, status });
  const liveEstimate = useMemo(() => {
    if (exportData.isLoading || exportData.isFetching) return { loading: true as const, error: null as string | null, questionCount: 0, estimatedBytes: 0 };
    try {
      const matched = filterWrongQuestionCsvItems(exportRows, filterOptions(filter));
      return { loading: false as const, error: null as string | null, ...estimateWrongQuestionCsv(matched, columnKeys) };
    } catch (error) {
      return { loading: false as const, error: error instanceof Error ? error.message : "無法估算目前範圍", questionCount: 0, estimatedBytes: 0 };
    }
  }, [exportData.isLoading, exportData.isFetching, exportRows, filter, columnKeys, startDate, endDate, courseType, subcategory]);
  const persistPresets = (next: WrongQuestionCsvPreset[]) => { setPresets(next); localStorage.setItem(storageKey, serializeWrongQuestionCsvPresets(next)); };
  const toggleColumn = (key: WrongQuestionCsvColumnKey) => setColumnKeys(current => current.includes(key) ? current.filter(item => item !== key) : [...current, key]);
  useEffect(() => { setPresets(readWrongQuestionCsvPresets(localStorage.getItem(storageKey))); setSelectedPresetId(""); setRenamePresetName(""); }, [storageKey]);
  useEffect(() => { if (subcategory && !subcategories.includes(subcategory)) setSubcategory(""); }, [subcategory, subcategories]);
  const savePreset = () => {
    const name = presetName.trim();
    if (!name || !columnKeys.length) { toast.error("請先輸入名稱並選擇至少一個欄位"); return; }
    if (presets.length >= 8) { toast.error("最多可保存 8 組常用欄位"); return; }
    const preset: WrongQuestionCsvPreset = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, columnKeys, startDate: startDate || undefined, endDate: endDate || undefined, courseType: courseType || undefined, subcategory: subcategory || undefined };
    persistPresets([...presets, preset]); setPresetName(""); setSelectedPresetId(preset.id); setRenamePresetName(preset.name); toast.success("已保存完整匯出組合", { description: "欄位、日期與分類篩選都會在下次套用。" });
  };
  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find(item => item.id === presetId);
    if (!preset) return;
    setColumnKeys(preset.columnKeys); setStartDate(preset.startDate ?? ""); setEndDate(preset.endDate ?? ""); setCourseType(preset.courseType ?? ""); setSubcategory(preset.subcategory ?? ""); setRenamePresetName(preset.name);
    toast.success("已套用完整匯出組合", { description: `已套用「${preset.name}」的欄位與篩選範圍。` });
  };
  const renamePreset = () => { if (!selectedPresetId) return; try { const next = renameWrongQuestionCsvPreset(presets, selectedPresetId, renamePresetName); persistPresets(next); setRenamePresetName(next.find(item => item.id === selectedPresetId)?.name ?? ""); toast.success("常用欄位組合已重新命名"); } catch (error) { toast.error("重新命名未完成", { description: error instanceof Error ? error.message : "請稍後再試。" }); } };
  const deletePreset = () => { const preset = presets.find(item => item.id === selectedPresetId); if (!preset) return; persistPresets(presets.filter(item => item.id !== selectedPresetId)); setSelectedPresetId(""); setRenamePresetName(""); toast.success("已移除欄位組合", { description: `「${preset.name}」已從此帳號在此裝置的常用設定移除。` }); };
  const replayHistory = (entry: any) => {
    const validColumns = (entry.columnKeys ?? []).filter((key: string): key is WrongQuestionCsvColumnKey => WRONG_QUESTION_CSV_COLUMNS.some(column => column.key === key));
    onExport({ columnKeys: validColumns.length ? validColumns : getDefaultWrongQuestionCsvColumns(), status: entry.status as WrongQuestionCsvStatus, startDate: entry.startDate ?? undefined, endDate: entry.endDate ?? undefined, courseType: entry.courseType ?? undefined, subcategory: entry.subcategory ?? undefined });
  };
  const exportLabel = `匯出${filter === "全部" ? "錯題本" : filter} CSV`;
  return <div className="csv-export-controls"><div className="csv-export-buttons"><Button variant="outline" size="sm" aria-busy={exporting} disabled={!columnKeys.length || exporting} onClick={() => onExport(filterOptions(filter))}>{exporting ? <Spinner aria-label="正在建立 CSV"/> : <Download size={15}/>}<span>{exporting ? "正在建立 CSV…" : exportLabel}</span></Button><Button variant="outline" size="sm" aria-busy={exporting} disabled={!hasPending || !columnKeys.length || exporting} onClick={() => onExport(filterOptions("待複習"))}>{exporting ? <Spinner aria-label="正在建立待複習 CSV"/> : <RotateCcw size={15}/>}<span>{exporting ? "正在建立 CSV…" : "快速匯出待複習"}</span></Button></div><details className="csv-export-settings"><summary>CSV 欄位、日期與分類設定</summary><div className="csv-export-settings-body"><fieldset><legend>匯出欄位</legend><div className="csv-column-grid">{WRONG_QUESTION_CSV_COLUMNS.map(column => <label key={column.key}><input type="checkbox" checked={columnKeys.includes(column.key)} onChange={() => toggleColumn(column.key)}/>{column.label}</label>)}</div></fieldset><fieldset><legend>官方題庫分類篩選</legend><div className="csv-classification-range"><label>課程類型<select aria-label="CSV 匯出課程類型" value={courseType} onChange={event => setCourseType(event.target.value)}><option value="">全部課程</option>{courseTypes.map(type => <option value={type.id} key={type.id}>{type.label}</option>)}</select></label><label>次分類<select aria-label="CSV 匯出次分類" value={subcategory} onChange={event => setSubcategory(event.target.value)}><option value="">全部次分類</option>{subcategories.map(item => <option value={item} key={item}>{item}</option>)}</select></label></div></fieldset><div className="csv-date-range"><label>起始日期<input type="date" value={startDate} onChange={event => setStartDate(event.target.value)}/></label><label>結束日期<input type="date" value={endDate} onChange={event => setEndDate(event.target.value)}/></label></div><section className="csv-export-estimate" aria-live="polite"><div><strong>匯出預估</strong><span>{liveEstimate.loading ? "正在計算目前範圍…" : liveEstimate.error ? liveEstimate.error : `約 ${liveEstimate.questionCount} 筆 · ${formatWrongQuestionCsvSize(liveEstimate.estimatedBytes)}`}</span></div><small>{liveEstimate.loading || liveEstimate.error ? "" : "大小依目前官方內容與所選欄位計算，實際下載可能有些微差異。"}</small></section><fieldset><legend>常用欄位組合</legend><div className="csv-preset-save"><input aria-label="欄位組合名稱" value={presetName} maxLength={32} placeholder="例如：考前精簡版" onChange={event => setPresetName(event.target.value)}/><Button variant="outline" size="sm" disabled={!columnKeys.length} onClick={savePreset}>保存完整組合</Button></div>{presets.length ? <><div className="csv-preset-apply"><select aria-label="已保存的欄位組合" value={selectedPresetId} onChange={event => applyPreset(event.target.value)}><option value="">選擇常用組合</option>{presets.map(preset => <option value={preset.id} key={preset.id}>{preset.name}（{preset.columnKeys.length} 欄）</option>)}</select><Button variant="ghost" size="sm" disabled={!selectedPresetId} onClick={deletePreset}>刪除組合</Button></div><div className="csv-preset-rename"><input aria-label="重新命名欄位組合" value={renamePresetName} maxLength={32} disabled={!selectedPresetId} placeholder="選擇組合後可重新命名" onChange={event => setRenamePresetName(event.target.value)}/><Button variant="outline" size="sm" disabled={!selectedPresetId || !renamePresetName.trim()} onClick={renamePreset}>更新名稱</Button></div></> : <p className="csv-preset-empty">尚未保存欄位組合；設定好後可在此快速套用。</p>}</fieldset><section className="csv-export-history" aria-label="最近匯出紀錄"><div><History size={15}/><strong>最近匯出紀錄</strong></div>{history.isLoading ? <p>正在讀取你的紀錄…</p> : history.data?.length ? <ul>{history.data.map(entry => <li key={entry.id}><span>{new Date(entry.createdAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {entry.questionCount} 筆 · {formatWrongQuestionCsvSize(entry.estimatedBytes)}</span><Button variant="ghost" size="sm" disabled={exporting} onClick={() => replayHistory(entry)}><Download size={14}/>重新下載</Button></li>)}</ul> : <p>尚無匯出紀錄；完成一次 CSV 下載後會顯示於此。</p>}</section><div className="csv-setting-actions"><Button variant="ghost" size="sm" onClick={() => setColumnKeys(getDefaultWrongQuestionCsvColumns())}>全選欄位</Button><Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setCourseType(""); setSubcategory(""); }}>清除篩選</Button></div></div></details></div>;
}
