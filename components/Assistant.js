import { useState, useRef, useCallback } from 'react';

const TABS = [
  { id: 'parse', label: 'Парсинг резюме', icon: '📄', color: '#2a9d8f', bg: '#e8f8f7', border: '#4ECDC4' },
  { id: 'profile', label: 'Профиль должности', icon: '🎯', color: '#d4930a', bg: '#fffbe8', border: '#f0c040' },
  { id: 'score', label: 'Оценка кандидата', icon: '⭐', color: '#c2185b', bg: '#fef0f5', border: '#FF6B9D' },
  { id: 'interview', label: 'Интервью', icon: '💬', color: '#2e7d32', bg: '#f0f8f0', border: '#4CAF50' },
];

const PROMPTS = {
  parse: (t) => `Ты HR-специалист. Проанализируй резюме. Верни ТОЛЬКО валидный JSON без markdown и пояснений:\n{"name":"","contacts":{"email":"","phone":"","city":""},"position":"","experience_years":0,"summary":"","skills":[],"experience":[{"company":"","role":"","period":"","achievements":""}],"education":[{"institution":"","degree":"","year":""}],"strengths":[],"red_flags":[]}\nРезюме: ${t}`,
  profile: (t) => `Ты HR-директор. Составь профиль должности. Верни ТОЛЬКО валидный JSON без markdown:\n{"title":"","department":"","purpose":"","responsibilities":[],"must_have":[],"nice_to_have":[],"soft_skills":[],"kpi":[],"salary_range":"","growth_path":""}\nОписание: ${t}`,
  score: (t) => `Ты рекрутер. Оцени кандидата. Верни ТОЛЬКО валидный JSON без markdown:\n{"overall_score":0,"verdict":"НАНЯТЬ","verdict_reason":"","match":[{"criteria":"","score":0,"comment":""}],"pros":[],"cons":[],"questions_to_clarify":[]}\n${t}`,
  interview: (t) => `Ты интервьюер. Составь вопросы. Верни ТОЛЬКО валидный JSON без markdown:\n{"competency":[{"competency":"","question":"","what_looking_for":""}],"situational":[],"technical":[],"motivation":[],"closing":[]}\n${t}`,
};

function Badge({ children, color, bg }) {
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: bg, color, marginRight: '5px', marginBottom: '5px', border: `1px solid ${color}33` }}>{children}</span>;
}

function Card({ children }) {
  return <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 1px 4px #00000006' }}>{children}</div>;
}

function ParsedResult({ d }) {
  if (!d) return null;
  return (
    <div>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,#e8f8f7,#4ECDC422)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '2px solid #4ECDC444' }}>👤</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a2e' }}>{d.name}</div>
            <div style={{ color: '#2a9d8f', fontSize: '13px' }}>{d.position} · {d.experience_years} лет · {d.contacts?.city}</div>
          </div>
        </div>
        <div style={{ color: '#555', fontSize: '13px', lineHeight: '1.7', marginBottom: '10px' }}>{d.summary}</div>
        <div style={{ fontSize: '12px', color: '#aaa', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          {d.contacts?.email && <span>✉ {d.contacts.email}</span>}
          {d.contacts?.phone && <span>📞 {d.contacts.phone}</span>}
        </div>
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '600' }}>Навыки</div>
          {d.skills?.map(s => <Badge key={s} color="#2a9d8f" bg="#e8f8f7">{s}</Badge>)}
        </Card>
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', fontWeight: '600' }}>Оценка</div>
          {d.strengths?.map(s => <div key={s} style={{ fontSize: '12px', color: '#2e7d32', marginBottom: '3px' }}>✓ {s}</div>)}
          {d.red_flags?.filter(Boolean).map(f => <div key={f} style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '3px' }}>⚠ {f}</div>)}
        </Card>
      </div>
      {d.experience?.map((e, i) => (
        <Card key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{e.role}</span>
            <span style={{ color: '#bbb', fontSize: '12px' }}>{e.period}</span>
          </div>
          <div style={{ color: '#2a9d8f', fontSize: '13px', margin: '3px 0' }}>{e.company}</div>
          <div style={{ color: '#777', fontSize: '13px' }}>{e.achievements}</div>
        </Card>
      ))}
    </div>
  );
}

function ProfileResult({ d }) {
  if (!d) return null;
  return (
    <div>
      <Card>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>{d.title}</div>
        <div style={{ color: '#d4930a', fontSize: '13px', marginBottom: '8px' }}>{d.department} · {d.salary_range}</div>
        <div style={{ color: '#555', fontSize: '13px', lineHeight: '1.7' }}>{d.purpose}</div>
      </Card>
      <Card>
        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '10px', fontWeight: '600' }}>Обязанности</div>
        {d.responsibilities?.map((r, i) => <div key={i} style={{ fontSize: '13px', color: '#333', marginBottom: '6px', paddingLeft: '12px', borderLeft: '3px solid #f0c04055' }}>{r}</div>)}
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Обязательно</div>
          {d.must_have?.map(r => <div key={r} style={{ fontSize: '12px', color: '#333', marginBottom: '5px', paddingLeft: '8px', borderLeft: '2px solid #f0c040' }}>{r}</div>)}
        </Card>
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Желательно</div>
          {d.nice_to_have?.map(r => <div key={r} style={{ fontSize: '12px', color: '#777', marginBottom: '5px', paddingLeft: '8px', borderLeft: '2px solid #ddd' }}>{r}</div>)}
        </Card>
      </div>
      <Card>
        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>KPI</div>
        {d.kpi?.map(k => <Badge key={k} color="#d4930a" bg="#fffbe8">{k}</Badge>)}
      </Card>
      <Card>
        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>Карьерный путь</div>
        <div style={{ color: '#d4930a', fontSize: '13px' }}>→ {d.growth_path}</div>
      </Card>
    </div>
  );
}

function ScoreResult({ d }) {
  if (!d) return null;
  const vc = d.verdict === 'НАНЯТЬ' ? '#2e7d32' : d.verdict === 'РАССМОТРЕТЬ' ? '#d4930a' : '#c62828';
  const vcBg = d.verdict === 'НАНЯТЬ' ? '#f0f8f0' : d.verdict === 'РАССМОТРЕТЬ' ? '#fffbe8' : '#fff5f5';
  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <div style={{ fontSize: '64px', fontWeight: '800', color: vc, lineHeight: 1 }}>{d.overall_score}</div>
          <div style={{ fontSize: '12px', color: '#bbb', marginBottom: '12px' }}>из 100</div>
          <div style={{ display: 'inline-block', padding: '8px 28px', background: vcBg, border: `1px solid ${vc}44`, borderRadius: '30px', color: vc, fontWeight: '700', fontSize: '16px' }}>{d.verdict}</div>
          <div style={{ color: '#777', fontSize: '13px', marginTop: '10px' }}>{d.verdict_reason}</div>
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>Детальная оценка</div>
        {d.match?.map(m => (
          <div key={m.criteria} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#333' }}>{m.criteria}</span>
              <span style={{ fontSize: '13px', color: vc, fontWeight: '600' }}>{m.score}/10</span>
            </div>
            <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${m.score * 10}%`, background: `linear-gradient(90deg,${vc}88,${vc})`, borderRadius: '4px' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>{m.comment}</div>
          </div>
        ))}
      </Card>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Плюсы</div>
          {d.pros?.map(p => <div key={p} style={{ fontSize: '12px', color: '#2e7d32', marginBottom: '4px' }}>+ {p}</div>)}
        </Card>
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Минусы</div>
          {d.cons?.map(c => <div key={c} style={{ fontSize: '12px', color: '#c62828', marginBottom: '4px' }}>− {c}</div>)}
        </Card>
      </div>
      {d.questions_to_clarify?.length > 0 && (
        <Card>
          <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Уточнить на интервью</div>
          {d.questions_to_clarify.map(q => <div key={q} style={{ fontSize: '13px', color: '#555', marginBottom: '5px' }}>? {q}</div>)}
        </Card>
      )}
    </div>
  );
}

function InterviewResult({ d }) {
  if (!d) return null;
  return (
    <div>
      {d.competency?.length > 0 && (
        <Card>
          <div style={{ fontSize: '10px', color: '#c2185b', textTransform: 'uppercase', marginBottom: '12px', fontWeight: '600' }}>По компетенциям</div>
          {d.competency.map((c, i) => (
            <div key={i} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '10px', color: '#c2185b', marginBottom: '3px', textTransform: 'uppercase', fontWeight: '600' }}>{c.competency}</div>
              <div style={{ fontSize: '14px', color: '#1a1a2e', marginBottom: '4px' }}>{c.question}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>↳ {c.what_looking_for}</div>
            </div>
          ))}
        </Card>
      )}
      {[['situational', 'Ситуационные (STAR)', '#2a9d8f'], ['technical', 'Технические', '#d4930a'], ['motivation', 'Мотивация', '#c2185b'], ['closing', 'Завершение', '#888']].map(([key, label, color]) =>
        d[key]?.length > 0 && (
          <Card key={key}>
            <div style={{ fontSize: '10px', color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', fontWeight: '600' }}>{label}</div>
            {d[key].map((q, i) => <div key={i} style={{ fontSize: '13px', color: '#444', marginBottom: '8px', paddingLeft: '12px', borderLeft: `3px solid ${color}44` }}>{q}</div>)}
          </Card>
        )
      )}
    </div>
  );
}

export default function Assistant({ onLogout }) {
  const [activeTab, setActiveTab] = useState('parse');
  const [inputs, setInputs] = useState({ parse: '', profile: '', score: '', interview: '' });
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [pdfName, setPdfName] = useState('');
  const [history, setHistory] = useState([]);
  const fileRef = useRef();
  const tab = TABS.find(t => t.id === activeTab);

  const handleFile = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result.split(',')[1];
      setLoading(true);
      try {
        const res = await fetch('/api/claude', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }, { type: 'text', text: 'Извлеки весь текст из резюме дословно.' }] }] })
        });
        const d = await res.json();
        setInputs(p => ({ ...p, parse: d.content?.map(b => b.text || '').join('') || '' }));
      } catch { alert('Ошибка загрузки PDF'); }
      finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRun = async () => {
    if (!inputs[activeTab]?.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/claude', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: PROMPTS[activeTab](inputs[activeTab]) }] })
      });
      const d = await res.json();
      let text = d.content?.map(b => b.text || '').join('') || '{}';
      text = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      setResults(p => ({ ...p, [activeTab]: parsed }));
      setHistory(prev => [{
        id: Date.now(), tab: tab.label, icon: tab.icon,
        title: inputs[activeTab].slice(0, 50) + '...',
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        result: parsed, tabId: activeTab
      }, ...prev.slice(0, 19)]);
    } catch (err) { alert('Ошибка анализа. Попробуйте ещё раз.'); }
    finally { setLoading(false); }
  };

  const ph = {
    parse: 'Вставьте текст резюме или загрузите PDF выше...',
    profile: 'Опишите вакансию. Например: «Senior Frontend React, 3+ года, удалёнка, стартап»',
    score: 'Опишите кандидата и вакансию. Например: «Кандидат: 5 лет в B2B продажах. Вакансия: менеджер SaaS, план $200k/квартал»',
    interview: 'Опишите вакансию или профиль кандидата для генерации вопросов...',
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f5f6fa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px #00000008' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#4ECDC4,#FF6B9D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🤖</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a2e' }}>HR AI Ассистент</div>
            <div style={{ fontSize: '10px', color: '#bbb' }}>Powered by Claude</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: '1px solid #e8eaf0', borderRadius: '8px', color: '#aaa', fontSize: '12px', padding: '6px 16px', cursor: 'pointer' }}>Выйти</button>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '0 24px', display: 'flex', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '13px 18px', background: 'none', border: 'none', borderBottom: activeTab === t.id ? `2px solid ${t.border}` : '2px solid transparent', color: activeTab === t.id ? t.color : '#aaa', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === t.id ? '600' : '400', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, gap: '0', height: 'calc(100vh - 105px)' }}>
        {/* Input */}
        <div style={{ borderRight: '1px solid #e8eaf0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', background: '#fff' }}>
          <div style={{ fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600' }}>Входные данные</div>
          {activeTab === 'parse' && (
            <>
              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current.click()}
                style={{ padding: '12px', background: tab.bg, border: `1px dashed ${tab.border}`, borderRadius: '10px', color: tab.color, cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                {pdfName ? `📄 ${pdfName}` : '⬆ Загрузить PDF резюме'}
              </button>
            </>
          )}
          <textarea value={inputs[activeTab]} onChange={e => setInputs(p => ({ ...p, [activeTab]: e.target.value }))} placeholder={ph[activeTab]}
            style={{ flex: 1, minHeight: '200px', background: '#f8f9ff', border: '1px solid #e8eaf0', borderRadius: '10px', padding: '14px', color: '#333', fontSize: '13px', resize: 'none', lineHeight: '1.7' }} />
          <button onClick={handleRun} disabled={loading || !inputs[activeTab]?.trim()}
            style={{ padding: '13px', background: !inputs[activeTab]?.trim() || loading ? '#f0f0f0' : `linear-gradient(135deg,${tab.border},${tab.color})`, border: 'none', borderRadius: '10px', color: !inputs[activeTab]?.trim() || loading ? '#bbb' : '#fff', fontWeight: '700', fontSize: '14px', cursor: !inputs[activeTab]?.trim() || loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '⏳ Анализирую...' : `${tab.icon} Запустить анализ`}
          </button>

          {/* History */}
          {history.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '8px', marginTop: '8px' }}>История сессии</div>
              {history.map(h => (
                <div key={h.id} onClick={() => { setActiveTab(h.tabId); setResults(p => ({ ...p, [h.tabId]: h.result })); }}
                  style={{ padding: '10px 12px', background: '#f8f9ff', border: '1px solid #e8eaf0', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', color: tab.color, fontWeight: '600' }}>{h.icon} {h.tab}</span>
                    <span style={{ fontSize: '11px', color: '#bbb' }}>{h.time}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Output */}
        <div style={{ padding: '20px', overflowY: 'auto', background: '#f5f6fa' }}>
          <div style={{ fontSize: '10px', color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '16px' }}>Результат</div>
          {!results[activeTab] && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ddd' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>{tab.icon}</div>
              <div style={{ fontSize: '14px', color: '#bbb' }}>Введите данные и нажмите «Запустить анализ»</div>
            </div>
          )}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚙️</div>
              <div style={{ color: tab.color, fontSize: '14px', fontWeight: '500' }}>Анализирую...</div>
            </div>
          )}
          {results[activeTab] && !loading && (
            <>
              {activeTab === 'parse' && <ParsedResult d={results.parse} />}
              {activeTab === 'profile' && <ProfileResult d={results.profile} />}
              {activeTab === 'score' && <ScoreResult d={results.score} />}
              {activeTab === 'interview' && <InterviewResult d={results.interview} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
