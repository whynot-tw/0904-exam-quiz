import { useMemo, useState } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpenCheck, CheckCircle2, ChevronLeft, CircleAlert, Flame, History, Home as HomeIcon, LogIn, RotateCcw, ShieldCheck, Target, XCircle } from "lucide-react";

type Section = "home" | "quiz" | "wrong" | "stats" | "admin";
type Mode = "practice" | "mock" | "wrong";

type Answer = { questionId: string; sequenceNo: number; selectedOption: "A" | "B" | "C" | "D"; correctOption: "A" | "B" | "C" | "D"; isCorrect: boolean; markedReviewError?: string };

const optionLabels = { A: "A", B: "B", C: "C", D: "D" } as const;

export default function Home() {
  const { user, loading, logout } = useAuth();
  const { data, isLoading } = trpc.quiz.bootstrap.useQuery();
  const [section, setSection] = useState<Section>("home");
  const [mode, setMode] = useState<Mode>("practice");
  const [count, setCount] = useState(5);
  const [source, setSource] = useState("全部");
  const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<keyof typeof optionLabels | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [wrongFilter, setWrongFilter] = useState("待複習");
  const questions = data?.questions ?? [];
  const filtered = useMemo(() => source === "全部" ? questions : questions.filter((q: any) => source === "電腦硬體" ? q.source === "HARDWARE" : q.source === "AI"), [questions, source]);
  const current = activeQuestions[cursor];
  const history = trpc.attempts.history.useQuery(undefined, { enabled: Boolean(user) });
  const stats = trpc.attempts.stats.useQuery(undefined, { enabled: Boolean(user) });
  const wrong = trpc.wrongQuestions.list.useQuery(undefined, { enabled: Boolean(user) });
  const complete = trpc.attempts.complete.useMutation({ onSuccess: value => { setResult(value); setFinished(true); history.refetch(); wrong.refetch(); } });

  const startQuiz = () => {
    const pool = [...filtered];
    const selectedQuestions = pool.sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
    setMode(mode); setActiveQuestions(selectedQuestions); setCursor(0); setAnswers([]); setSelected(null); setFinished(false); setResult(null); setSection("quiz");
    localStorage.setItem("sep4-active-attempt", JSON.stringify({ mode, count, source, questionIds: selectedQuestions.map((q: any) => q.id), answers: [] }));
  };

  const submitAnswer = (option: keyof typeof optionLabels) => {
    if (!current || selected) return;
    setSelected(option);
    const answer: Answer = { questionId: current.id, sequenceNo: cursor, selectedOption: option, correctOption: current.correctOption, isCorrect: option === current.correctOption };
    setAnswers(prev => [...prev, answer]);
  };

  const markAndContinue = (mark?: string) => {
    if (!current || !selected) return;
    const nextAnswers = answers.map(a => a.questionId === current.id ? { ...a, markedReviewError: mark } : a);
    setAnswers(nextAnswers);
    if (cursor + 1 >= activeQuestions.length) {
      if (!user) { setFinished(true); setResult({ score: Math.round(nextAnswers.filter(a => a.isCorrect).length / activeQuestions.length * 100), correctCount: nextAnswers.filter(a => a.isCorrect).length, wrongCount: nextAnswers.filter(a => !a.isCorrect).length, passed80: false }); return; }
      complete.mutate({ mode, questionCount: activeQuestions.length, answers: nextAnswers });
    } else { setCursor(cursor + 1); setSelected(null); localStorage.setItem("sep4-active-attempt", JSON.stringify({ mode, count, source, questionIds: activeQuestions.map((q: any) => q.id), answers: nextAnswers })); }
  };

  const nav = (next: Section) => { setSection(next); if (next !== "quiz") { setFinished(false); setActiveQuestions([]); } };

  if (isLoading || loading) return <div className="app-shell"><div className="loading-card">正在準備你的題庫…</div></div>;

  return <div className="app-shell">
    <header className="topbar"><div><div className="eyebrow">9/4 應試準備室</div><h1>專注，從一題開始。</h1></div><div className="top-actions">{user ? <Button variant="ghost" className="user-pill" onClick={() => logout()}>{user.name || "已登入"} · 登出</Button> : <Button variant="outline" className="login-button" onClick={() => startLogin()}><LogIn size={16}/> Manus OAuth 登入</Button>}</div></header>
    <main className="content">
      {section === "home" && <Dashboard onStart={() => { setSection("quiz"); }} data={data} user={user} onAdmin={() => setSection("admin")} />}
      {section === "quiz" && (!activeQuestions.length ? <QuizSetup source={source} setSource={setSource} mode={mode} setMode={setMode} count={count} setCount={setCount} onStart={startQuiz} available={filtered.length} /> : <QuizRunner current={current} cursor={cursor} total={activeQuestions.length} selected={selected} mode={mode} finished={finished} result={result} onAnswer={submitAnswer} onMark={markAndContinue} onBack={() => { setActiveQuestions([]); setSection("home"); }} />)}
      {section === "wrong" && <WrongPanel rows={wrong.data ?? []} questions={questions} filter={wrongFilter} setFilter={setWrongFilter} onStart={(q: any) => { const full = questions.find((item: any) => item.id === q.questionId); if (!full) return; setMode("wrong"); setActiveQuestions([full]); setCursor(0); setAnswers([]); setSelected(null); setFinished(false); setSection("quiz"); }} />}
      {section === "stats" && <StatsPanel attempts={history.data ?? []} stats={stats.data} />}
      {section === "admin" && <AdminPanel isAdmin={user?.role === "admin"} />}
    </main>
    <nav className="bottom-nav">{[["home", HomeIcon, "首頁"],["quiz", BookOpenCheck, "測驗"],["wrong", RotateCcw, "錯題"],["stats", History, "統計"]].map(([key, Icon, label]) => <button key={key as string} className={section === key ? "active" : ""} onClick={() => nav(key as Section)}><Icon size={19}/><span>{label as string}</span></button>)}</nav>
  </div>;
}

function Dashboard({ onStart, data, user, onAdmin }: any) { return <div className="dashboard-grid"><section className="hero-card"><div className="hero-copy"><Badge className="soft-badge"><Target size={14}/> 9/4 甄試倒數</Badge><h2>把不確定，練成穩定。</h2><p>以官方題庫為核心，讓每一次作答都更接近 80 分目標。</p><Button className="primary-cta" onClick={onStart}>開始測驗 <ArrowRight size={17}/></Button></div><div className="hero-orbit"><span>80</span><small>目標分</small></div></section><section className="metric-row"><Metric icon={<Flame/>} label="目前錯題" value={user ? "同步後查看" : "登入後同步"}/><Metric icon={<CheckCircle2/>} label="已熟悉" value="—"/><Metric icon={<ShieldCheck/>} label="題庫狀態" value={`${data?.qa?.enabled ?? 0} 題可練`}/></section><section className="quick-grid"><QuickCard title="快速練習" desc="5 題即時回饋" onClick={onStart}/><QuickCard title="20 題模擬考" desc="完成後揭曉分數" onClick={onStart}/><QuickCard title="考前衝刺" desc="優先複習弱點" onClick={onStart}/></section>{user?.role === "admin" && <button className="admin-link" onClick={onAdmin}><ShieldCheck size={16}/> 開啟題庫管理後台</button>}</div> }
function Metric({ icon, label, value }: any) { return <Card className="metric-card"><CardContent><div className="metric-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></CardContent></Card> }
function QuickCard({ title, desc, onClick }: any) { return <button className="quick-card" onClick={onClick}><span>{title}</span><small>{desc}</small><ArrowRight size={16}/></button> }
function QuizSetup({ source, setSource, mode, setMode, count, setCount, onStart, available }: any) { return <div className="setup-wrap"><button className="back-link" onClick={() => window.history.back()}><ChevronLeft size={16}/> 回首頁</button><div className="section-heading"><div className="eyebrow">測驗設定</div><h2>今天想怎麼練？</h2><p>選擇題數與範圍，系統會避免同場重複題目。</p></div><Card className="setup-card"><CardHeader><CardTitle>測驗模式</CardTitle></CardHeader><CardContent><Tabs value={mode} onValueChange={v => setMode(v as Mode)}><TabsList className="mode-tabs"><TabsTrigger value="practice">練習模式</TabsTrigger><TabsTrigger value="mock">模擬考</TabsTrigger><TabsTrigger value="wrong">錯題重刷</TabsTrigger></TabsList><TabsContent value="practice"><p className="muted">每題作答後立即顯示正解與解析。</p></TabsContent><TabsContent value="mock"><p className="muted">20 題完成前不公布單題對錯，完成後顯示是否達標。</p></TabsContent><TabsContent value="wrong"><p className="muted">集中處理待複習題目，連續答對兩次即標為已熟悉。</p></TabsContent></Tabs><label>題數<select value={count} onChange={e => setCount(Number(e.target.value))}><option value={5}>5 題快速練習</option><option value={10}>10 題一般練習</option><option value={20}>20 題模擬考</option></select></label><label>來源<select value={source} onChange={e => setSource(e.target.value)}><option>全部</option><option>電腦硬體</option><option>AI</option></select></label><Button className="primary-cta wide" onClick={onStart} disabled={!available}>開始這一回合 <ArrowRight size={17}/></Button><p className="availability">目前範圍有 {available} 題可用</p></CardContent></Card></div> }
function QuizRunner({ current, cursor, total, selected, mode, finished, result, onAnswer, onMark, onBack }: any) { const mock = mode === "mock"; return <div className="runner-wrap"><button className="back-link" onClick={onBack}><ChevronLeft size={16}/> 結束本回合</button>{finished ? <Card className="result-card"><div className="result-kicker">本回合完成</div><h2>{result?.score ?? 0}<small> 分</small></h2><p>{result?.passed80 ? "已達到 80 分目標。" : "還差一點，下一回合會更穩。"}</p><div className="result-stats"><span>答對 <b>{result?.correctCount ?? 0}</b></span><span>答錯 <b>{result?.wrongCount ?? 0}</b></span></div><Button className="primary-cta" onClick={onBack}>返回首頁</Button></Card> : <><div className="progress-line"><span>第 {cursor + 1} / {total} 題</span><div><i style={{ width: `${((cursor + 1) / total) * 100}%` }}/></div></div><Card className="question-card"><div className="question-meta"><Badge variant="outline">{current.source === "AI" ? "AI 工具應用" : "電腦硬體"}</Badge>{current.needsReview && <Badge className="review-badge"><CircleAlert size={13}/> 待審</Badge>}</div><h2>{current.text}</h2><div className="answers">{Object.entries(current.options).map(([key, value]) => <button key={key} className={`answer-button ${selected ? (key === current.correctOption ? "correct" : key === selected ? "wrong" : "muted") : ""}`} onClick={() => onAnswer(key as any)}><span className="answer-letter">{key}</span><span>{value as string}</span>{selected && key === current.correctOption && <CheckCircle2 size={18}/>} {selected && key === selected && key !== current.correctOption && <XCircle size={18}/>}</button>)}</div>{selected && !mock && <div className={`feedback ${selected === current.correctOption ? "good" : "bad"}`}><strong>{selected === current.correctOption ? "答對了" : "再看一次"}</strong><p>正解：{current.correctOption}。{current.explanation || "官方資料未提供解析。"}</p></div>}{selected && mock && <div className="mock-hint">答案已暫存，完成整份模擬考後揭曉。</div>}{selected && !mock && selected !== current.correctOption && <div className="mark-actions"><span>這題答錯的原因？</span><Button variant="outline" onClick={() => onMark("真的不會")}>真的不會</Button><Button variant="outline" onClick={() => onMark("題目看反")}>題目看反</Button></div>}{selected && (selected === current.correctOption || mock) && <Button className="primary-cta wide next-button" onClick={() => onMark()}>{cursor + 1 === total ? "查看結果" : "下一題"} <ArrowRight size={17}/></Button>}</Card></>}</div> }
function WrongPanel({ rows, filter, setFilter, onStart }: any) { const visible = rows.filter((r: any) => filter === "全部" || r.status === filter); return <div className="panel-wrap"><div className="section-heading"><div className="eyebrow">錯題本</div><h2>把錯的，變成熟悉。</h2><p>真正的知識錯題會留在這裡；閱讀失誤不會混在一起。</p></div><div className="filter-pills">{["待複習", "已熟悉", "全部"].map(f => <button className={filter === f ? "selected" : ""} onClick={() => setFilter(f)} key={f}>{f}</button>)}</div>{visible.length ? visible.map((r: any) => <Card className="wrong-row" key={r.id}><CardContent><div><Badge>{r.status}</Badge><h3>{r.questionId}</h3><p>錯誤 {r.wrongCount} 次 · 連續答對 {r.consecutiveCorrect} 次</p></div><Button variant="outline" onClick={() => onStart({ questionId: r.questionId })}>重刷</Button></CardContent></Card>) : <div className="empty-state"><RotateCcw size={28}/><h3>目前沒有符合條件的錯題</h3><p>完成幾回練習後，這裡會自動整理你的複習清單。</p></div>}</div> }
function StatsPanel({ attempts, stats }: any) { const overall = stats?.totalAnswered ? Math.round(stats.totalCorrect / stats.totalAnswered * 100) : 0; return <div className="panel-wrap"><div className="section-heading"><div className="eyebrow">統計</div><h2>看見自己的進步。</h2><p>歷次測驗紀錄會在完成後自動同步。</p></div><div className="metric-row"><Metric icon={<BookOpenCheck/>} label="總答題數" value={stats?.totalAnswered ?? "—"}/><Metric icon={<CheckCircle2/>} label="總正確率" value={stats ? `${overall}%` : "—"}/><Metric icon={<History/>} label="歷史回合" value={attempts.length}/></div><div className="admin-list">{Object.entries(stats?.bySubject ?? {}).map(([subject, value]: any) => <Card className="history-row" key={subject}><CardContent><span>{subject}</span><strong>{value.accuracy}%</strong><small>{value.correct}/{value.answered} 題答對</small></CardContent></Card>)}</div>{attempts.length ? attempts.map((a: any) => <Card className="history-row" key={a.id}><CardContent><span>{a.mode === "mock" ? "模擬考" : "練習"}</span><strong>{a.score} 分</strong><small>{a.correctCount}/{a.questionCount} 題答對</small></CardContent></Card>) : <div className="empty-state"><History size={28}/><h3>尚未有測驗紀錄</h3><p>完成第一回測驗後，這裡會顯示你的歷史成績。</p></div>}</div> }
function AdminPanel({ isAdmin }: { isAdmin: boolean }) { const [reviewOnly, setReviewOnly] = useState(true); const [editing, setEditing] = useState<any>(null); const [explanation, setExplanation] = useState(""); const [correctOption, setCorrectOption] = useState<any>("A"); const query = trpc.quiz.adminList.useQuery({ needsReviewOnly: reviewOnly }, { enabled: isAdmin }); const save = trpc.quiz.adminUpdate.useMutation({ onSuccess: () => { setEditing(null); query.refetch(); } }); if (!isAdmin) return <div className="empty-state"><ShieldCheck size={30}/><h3>需要 admin 權限</h3><p>此區域不對一般使用者開放。</p></div>; return <div className="panel-wrap"><div className="section-heading"><div className="eyebrow">Admin only</div><h2>題庫管理</h2><p>優先處理待審題目；官方答案仍以 PDF Source of Truth 為準。</p></div>{editing && <Card className="setup-card"><CardHeader><CardTitle>編輯 {editing.id}</CardTitle></CardHeader><CardContent><label>正確答案<select value={correctOption} onChange={e => setCorrectOption(e.target.value)}>{["A","B","C","D"].map(o => <option key={o}>{o}</option>)}</select></label><label>解析<textarea value={explanation} onChange={e => setExplanation(e.target.value)} rows={5}/></label><div className="mark-actions"><Button className="primary-cta" onClick={() => save.mutate({ questionId: editing.id, explanation, correctOption })}>儲存更新</Button><Button variant="outline" onClick={() => setEditing(null)}>取消</Button></div></CardContent></Card>}<div className="admin-toolbar"><Button variant={reviewOnly ? "default" : "outline"} onClick={() => setReviewOnly(true)}>只看待審</Button><Button variant={!reviewOnly ? "default" : "outline"} onClick={() => setReviewOnly(false)}>全部題目</Button><Badge>{query.data?.length ?? 0} 題</Badge></div><div className="admin-list">{query.data?.slice(0, 80).map((q: any) => <Card key={q.id} className="admin-row"><CardContent><div><Badge className={q.needsReview ? "review-badge" : ""}>{q.needsReview ? "待審" : "已匯入"}</Badge><h3>{q.id} · {q.text.slice(0, 80)}{q.text.length > 80 ? "…" : ""}</h3><p>正解：{q.correctOption} · {q.section}</p></div><Button variant="outline" size="sm" onClick={() => { setEditing(q); setExplanation(q.explanation || ""); setCorrectOption(q.correctOption); }}>編輯</Button></CardContent></Card>)}</div></div> }
