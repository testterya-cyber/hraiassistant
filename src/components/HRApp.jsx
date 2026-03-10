"use client";
import { useState, useRef, useCallback } from "react";

const TABS = [
  { id: "parse", label: "Парсинг резюме", icon: "📄", color: "#4ECDC4" },
  { id: "profile", label: "Профиль должности", icon: "🎯", color: "#FFE66D" },
  { id: "score", label: "Оценка кандидата", icon: "⭐", color: "#FF6B9D" },
  { id: "interview", label: "Интервью", icon: "💬", color: "#A8E6CF" },
];

const PROMPTS = {
  parse: (t) => `Ты HR-специалист. Проанализируй резюме. Верни ТОЛЬКО валидный JSON без markdown:\n{"name":"","contacts":{"email":"","phone":"","city":""},"position":"","experience_years":0,"summary":"","skills":[],"experience":[{"company":"","role":"","period":"","achievements":""}],"education":[{"institution":"","degree":"","year":""}],"strengths":[],"red_flags":[]}\nРезюме: ${t}`,
  profile: (t) => `Ты HR-директор. Составь профиль должности. Верни ТОЛЬКО валидный JSON без markdown:\n{"title":"","department":"","purpose":"","responsibilities":[],"must_have":[],"nice_to_have":[],"soft_skills":[],"kpi":[],"salary_range":"","growth_path":""}\nОписание: ${t}`,
  score: (t) => `Ты рекрутер. Оцени кандидата. Верни ТОЛЬКО валидный JSON без markdown:\n{"overall_score":0,"verdict":"НАНЯТЬ","verdict_reason":"","match":[{"criteria":"","score":0,"comment":""}],"pros":[],"cons":[],"questions_to_clarify":[]}\n${t}`,
  interview: (t) => `Ты интервьюер. Составь вопросы. Верни ТОЛЬКО валидный JSON без markdown:\n{"competency":[{"competency":"","question":"","what_looking_for":""}],"situational":[],"technical":[],"motivation":[],"closing":[]}\n${t}`,
};

function Badge({ children, color }) {
  return <span style={{ display:"inline-block", padding:"2px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:"600", background:color+"22", color, border:`1px solid ${color}44`, marginRight:"5px", marginBottom:"5px" }}>{children}</span>;
}

function ParsedResult({ d }) {
  if (!d) return null;
  return (
    <div style={{ display:"grid", gap:"12px" }}>
      <div style={{ background:"linear-gradient(135deg,#4ECDC422,#0d0d1a)", border:"1px solid #4ECDC433", borderRadius:"12px", padding:"18px" }}>
        <div style={{ fontSize:"20px", fontWeight:"700", color:"#fff" }}>{d.name}</div>
        <div style={{ color:"#4ECDC4", fontSize:"13px", margin:"4px 0 8px" }}>{d.position} · {d.experience_years} лет · {d.contacts?.city}</div>
        <div style={{ color:"#999", fontSize:"13px", lineHeight:"1.6" }}>{d.summary}</div>
        <div style={{ marginTop:"8px", fontSize:"12px", color:"#555", display:"flex", gap:"14px", flexWrap:"wrap" }}>
          {d.contacts?.email && <span>✉ {d.contacts.email}</span>}
          {d.contacts?.phone && <span>📞 {d.contacts.phone}</span>}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"8px" }}>Навыки</div>
          {d.skills?.map(s => <Badge key={s} color="#4ECDC4">{s}</Badge>)}
        </div>
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"8px" }}>Оценка</div>
          {d.strengths?.map(s => <div key={s} style={{ fontSize:"12px", color:"#A8E6CF", marginBottom:"3px" }}>✓ {s}</div>)}
          {d.red_flags?.filter(Boolean).map(f => <div key={f} style={{ fontSize:"12px", color:"#FF6B6B", marginBottom:"3px" }}>⚠ {f}</div>)}
        </div>
      </div>
      {d.experience?.map((e, i) => (
        <div key={i} style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:"600", color:"#fff", fontSize:"14px" }}>{e.role}</span>
            <span style={{ color:"#444", fontSize:"12px" }}>{e.period}</span>
          </div>
          <div style={{ color:"#4ECDC4", fontSize:"13px", margin:"3px 0" }}>{e.company}</div>
          <div style={{ color:"#777", fontSize:"13px" }}>{e.achievements}</div>
        </div>
      ))}
    </div>
  );
}

function ProfileResult({ d }) {
  if (!d) return null;
  return (
    <div style={{ display:"grid", gap:"12px" }}>
      <div style={{ background:"linear-gradient(135deg,#FFE66D22,#0d0d1a)", border:"1px solid #FFE66D33", borderRadius:"12px", padding:"18px" }}>
        <div style={{ fontSize:"20px", fontWeight:"700", color:"#FFE66D" }}>{d.title}</div>
        <div style={{ color:"#aaa", fontSize:"13px", margin:"4px 0 8px" }}>{d.department} · {d.salary_range}</div>
        <div style={{ color:"#ccc", fontSize:"13px", lineHeight:"1.6" }}>{d.purpose}</div>
      </div>
      <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
        <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", marginBottom:"8px" }}>Обязанности</div>
        {d.responsibilities?.map((r, i) => <div key={i} style={{ fontSize:"13px", color:"#ccc", marginBottom:"5px", paddingLeft:"10px", borderLeft:"2px solid #FFE66D44" }}>{r}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", marginBottom:"8px" }}>Обязательно</div>
          {d.must_have?.map(r => <div key={r} style={{ fontSize:"12px", color:"#fff", marginBottom:"5px", paddingLeft:"8px", borderLeft:"2px solid #FFE66D" }}>{r}</div>)}
        </div>
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", marginBottom:"8px" }}>Желательно</div>
          {d.nice_to_have?.map(r => <div key={r} style={{ fontSize:"12px", color:"#888", marginBottom:"5px", paddingLeft:"8px", borderLeft:"2px solid #444" }}>{r}</div>)}
        </div>
      </div>
      <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
        <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", marginBottom:"8px" }}>KPI</div>
        {d.kpi?.map(k => <Badge key={k} color="#FFE66D">{k}</Badge>)}
      </div>
    </div>
  );
}

function ScoreResult({ d }) {
  if (!d) return null;
  const vc = d.verdict === "НАНЯТЬ" ? "#A8E6CF" : d.verdict === "РАССМОТРЕТЬ" ? "#FFE66D" : "#FF6B6B";
  return (
    <div style={{ display:"grid", gap:"12px" }}>
      <div style={{ background:`linear-gradient(135deg,${vc}22,#0d0d1a)`, border:`1px solid ${vc}44`, borderRadius:"12px", padding:"24px", textAlign:"center" }}>
        <div style={{ fontSize:"60px", fontWeight:"800", color:vc, lineHeight:1 }}>{d.overall_score}</div>
        <div style={{ fontSize:"11px", color:"#444", marginBottom:"10px" }}>из 100</div>
        <div style={{ display:"inline-block", padding:"7px 22px", background:vc+"33", border:`1px solid ${vc}`, borderRadius:"30px", color:vc, fontWeight:"700", fontSize:"15px" }}>{d.verdict}</div>
        <div style={{ color:"#888", fontSize:"13px", marginTop:"10px" }}>{d.verdict_reason}</div>
      </div>
      <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
        {d.match?.map(m => (
          <div key={m.criteria} style={{ marginBottom:"12px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
              <span style={{ fontSize:"13px", color:"#ccc" }}>{m.criteria}</span>
              <span style={{ fontSize:"13px", color:vc, fontWeight:"600" }}>{m.score}/10</span>
            </div>
            <div style={{ background:"#1a1a2e", borderRadius:"4px", height:"5px", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${m.score * 10}%`, background:vc, borderRadius:"4px" }} />
            </div>
            <div style={{ fontSize:"11px", color:"#444", marginTop:"2px" }}>{m.comment}</div>
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", marginBottom:"8px" }}>Плюсы</div>
          {d.pros?.map(p => <div key={p} style={{ fontSize:"12px", color:"#A8E6CF", marginBottom:"4px" }}>+ {p}</div>)}
        </div>
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#555", textTransform:"uppercase", marginBottom:"8px" }}>Минусы</div>
          {d.cons?.map(c => <div key={c} style={{ fontSize:"12px", color:"#FF6B9D", marginBottom:"4px" }}>− {c}</div>)}
        </div>
      </div>
    </div>
  );
}

function InterviewResult({ d }) {
  if (!d) return null;
  return (
    <div style={{ display:"grid", gap:"12px" }}>
      {d.competency?.length > 0 && (
        <div style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
          <div style={{ fontSize:"10px", color:"#FF6B9D", textTransform:"uppercase", marginBottom:"10px" }}>По компетенциям</div>
          {d.competency.map((c, i) => (
            <div key={i} style={{ marginBottom:"12px", paddingBottom:"12px", borderBottom:"1px solid #1a1a2e" }}>
              <div style={{ fontSize:"10px", color:"#FF6B9D", marginBottom:"3px", textTransform:"uppercase" }}>{c.competency}</div>
              <div style={{ fontSize:"14px", color:"#fff", marginBottom:"3px" }}>{c.question}</div>
              <div style={{ fontSize:"11px", color:"#444" }}>↳ {c.what_looking_for}</div>
            </div>
          ))}
        </div>
      )}
      {[["situational","Ситуационные (STAR)","#4ECDC4"],["technical","Технические","#FFE66D"],["motivation","Мотивация","#FF6B9D"],["closing","Завершение","#888"]].map(([key, label, color]) =>
        d[key]?.length > 0 && (
          <div key={key} style={{ background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px" }}>
            <div style={{ fontSize:"10px", color, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"8px" }}>{label}</div>
            {d[key].map((q, i) => <div key={i} style={{ fontSize:"13px", color:"#ccc", marginBottom:"7px", paddingLeft:"10px", borderLeft:`2px solid ${color}44` }}>{q}</div>)}
          </div>
        )
      )}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!login || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      if (res.ok) {
        const d = await res.json();
        onLogin(d.name);
      } else {
        setError("Неверный логин или пароль");
      }
    } catch {
      setError("Ошибка подключения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#07070f", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"360px", background:"#0d0d1a", border:"1px solid #1e1e3a", borderRadius:"16px", padding:"40px" }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:"linear-gradient(135deg,#4ECDC4,#FF6B9D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", margin:"0 auto 16px" }}>🤖</div>
          <div style={{ fontSize:"20px", fontWeight:"700", color:"#fff" }}>HR AI Ассистент</div>
          <div style={{ fontSize:"13px", color:"#444", marginTop:"4px" }}>Войдите чтобы продолжить</div>
        </div>
        <div style={{ display:"grid", gap:"12px" }}>
          <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Логин"
            style={{ padding:"12px 16px", background:"#07070f", border:"1px solid #1e1e3a", borderRadius:"8px", color:"#fff", fontSize:"14px", outline:"none", width:"100%", boxSizing:"border-box" }} />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Пароль"
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            style={{ padding:"12px 16px", background:"#07070f", border:"1px solid #1e1e3a", borderRadius:"8px", color:"#fff", fontSize:"14px", outline:"none", width:"100%", boxSizing:"border-box" }} />
          {error && <div style={{ fontSize:"13px", color:"#FF6B6B", textAlign:"center" }}>{error}</div>}
          <button onClick={handleLogin} disabled={loading || !login || !password}
            style={{ padding:"13px", background: !login || !password || loading ? "#1e1e3a" : "linear-gradient(135deg,#4ECDC4,#4ECDC488)", border:"none", borderRadius:"8px", color: !login || !password || loading ? "#444" : "#000", fontWeight:"700", fontSize:"14px", cursor: !login || !password || loading ? "not-allowed" : "pointer" }}>
            {loading ? "Входим..." : "Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("parse");
  const [inputs, setInputs] = useState({ parse:"", profile:"", score:"", interview:"" });
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const fileRef = useRef();
  const tab = TABS.find(t => t.id === activeTab);

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(",")[1];
      setLoading(true);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: [{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } }, { type:"text", text:"Извлеки весь текст из резюме дословно." }] }),
        });
        const d = await res.json();
        setInputs(p => ({ ...p, parse: d.result || "" }));
      } catch { alert("Ошибка загрузки PDF"); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRun = async () => {
    if (!inputs[activeTab]?.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: PROMPTS[activeTab](inputs[activeTab]) }),
      });
      const d = await res.json();
      let text = d.result || "{}";
      text = text.replace(/```json|```/g, "").trim();
      setResults(p => ({ ...p, [activeTab]: JSON.parse(text) }));
    } catch { alert("Ошибка анализа. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  };

  const ph = {
    parse: "Вставьте текст резюме или загрузите PDF выше...",
    profile: "Опишите вакансию. Например: «Senior Frontend React, 3+ года, удалёнка, стартап»",
    score: "Опишите кандидата и вакансию. Например: «Кандидат: 5 лет в B2B. Вакансия: менеджер SaaS, план $200k/квартал»",
    interview: "Опишите вакансию или профиль кандидата для генерации вопросов...",
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div style={{ fontFamily:"system-ui,sans-serif", background:"#07070f", minHeight:"100vh", color:"#e0e0e0", display:"flex", flexDirection:"column" }}>
      <div style={{ borderBottom:"1px solid #1a1a2e", padding:"14px 22px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:"linear-gradient(135deg,#4ECDC4,#FF6B9D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px" }}>🤖</div>
          <div>
            <div style={{ fontSize:"15px", fontWeight:"700", color:"#fff" }}>HR AI Ассистент</div>
            <div style={{ fontSize:"11px", color:"#333" }}>Powered by Claude AI</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ fontSize:"13px", color:"#444" }}>👤 {user}</span>
          <button onClick={() => setUser(null)} style={{ fontSize:"12px", color:"#333", background:"none", border:"1px solid #1e1e3a", padding:"5px 12px", borderRadius:"6px", cursor:"pointer" }}>Выйти</button>
        </div>
      </div>
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a2e", padding:"0 22px", overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding:"11px 16px", background:"none", border:"none", borderBottom: activeTab === t.id ? `2px solid ${t.color}` : "2px solid transparent", color: activeTab === t.id ? t.color : "#444", cursor:"pointer", fontSize:"12px", fontWeight: activeTab === t.id ? "600" : "400", whiteSpace:"nowrap", display:"flex", alignItems:"center", gap:"5px" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", flex:1, height:"calc(100vh - 100px)" }}>
        <div style={{ borderRight:"1px solid #1a1a2e", padding:"18px", display:"flex", flexDirection:"column", gap:"10px", overflowY:"auto" }}>
          <div style={{ fontSize:"10px", color:"#333", textTransform:"uppercase", letterSpacing:"0.1em" }}>Входные данные</div>
          {activeTab === "parse" && (
            <>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display:"none" }} />
              <button onClick={() => fileRef.current.click()} style={{ padding:"11px", background:"#0d0d1a", border:`1px dashed ${tab.color}55`, borderRadius:"8px", color:tab.color, cursor:"pointer", fontSize:"13px" }}>
                {pdfName ? `📄 ${pdfName}` : "⬆ Загрузить PDF резюме"}
              </button>
            </>
          )}
          <textarea value={inputs[activeTab]} onChange={e => setInputs(p => ({ ...p, [activeTab]:e.target.value }))} placeholder={ph[activeTab]}
            style={{ flex:1, minHeight:"200px", background:"#0d0d1a", border:"1px solid #1a1a2e", borderRadius:"10px", padding:"13px", color:"#ccc", fontSize:"13px", resize:"none", outline:"none", lineHeight:"1.7" }} />
          <button onClick={handleRun} disabled={loading || !inputs[activeTab]?.trim()}
            style={{ padding:"12px", background: !inputs[activeTab]?.trim() || loading ? "#1a1a2e" : `linear-gradient(135deg,${tab.color},${tab.color}88)`, border:"none", borderRadius:"8px", color: !inputs[activeTab]?.trim() || loading ? "#333" : "#000", fontWeight:"700", fontSize:"13px", cursor: !inputs[activeTab]?.trim() || loading ? "not-allowed" : "pointer" }}>
            {loading ? "⏳ Анализирую..." : `${tab.icon} Запустить анализ`}
          </button>
        </div>
        <div style={{ padding:"18px", overflowY:"auto" }}>
          <div style={{ fontSize:"10px", color:"#333", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"14px" }}>Результат</div>
          {!results[activeTab] && !loading && (
            <div style={{ textAlign:"center", padding:"50px 20px", color:"#1e1e3a" }}>
              <div style={{ fontSize:"44px", marginBottom:"10px" }}>{tab.icon}</div>
              <div style={{ fontSize:"13px" }}>Введите данные и нажмите «Запустить анализ»</div>
            </div>
          )}
          {loading && <div style={{ textAlign:"center", padding:"50px", color:tab.color, fontSize:"14px" }}>⚙️ Анализирую...</div>}
          {results[activeTab] && !loading && (
            <>
              {activeTab === "parse" && <ParsedResult d={results.parse} />}
              {activeTab === "profile" && <ProfileResult d={results.profile} />}
              {activeTab === "score" && <ScoreResult d={results.score} />}
              {activeTab === "interview" && <InterviewResult d={results.interview} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
