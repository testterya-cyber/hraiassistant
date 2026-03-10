import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEYS = {
  resumes: 'hr-ai-assistant-resumes',
  profiles: 'hr-ai-assistant-profiles',
  evaluations: 'hr-ai-assistant-evaluations',
  interviews: 'hr-ai-assistant-interviews',
};

const TABS = [
  { id: 'parse', label: 'Парсинг резюме', icon: 'CV', color: '#0f766e', accent: '#14b8a6', soft: '#ecfeff' },
  { id: 'profile', label: 'Профиль должности', icon: 'JOB', color: '#9a6700', accent: '#f59e0b', soft: '#fff7ed' },
  { id: 'score', label: 'Оценка кандидата', icon: 'FIT', color: '#be185d', accent: '#ec4899', soft: '#fff1f2' },
  { id: 'interview', label: 'Интервью', icon: 'Q&A', color: '#166534', accent: '#22c55e', soft: '#f0fdf4' },
];

const EMPTY_RESUME = {
  candidateName: '', position: '', city: '', experienceYears: '', salaryExpectation: '', summary: '',
  skills: [], strengths: [], risks: [],
  contacts: { email: '', phone: '', telegram: '' },
  experience: [], education: [], sourceText: '',
};

const EMPTY_PROFILE = {
  title: '', department: '', level: '', purpose: '', responsibilities: [], mustHave: [], niceToHave: [],
  softSkills: [], kpi: [], salaryRange: '', education: '', tools: [], notes: '', sourceText: '',
};

const EMPTY_SCORE = {
  overallScore: 0, verdict: '', verdictReason: '', match: [], pros: [], cons: [], questionsToClarify: [],
};

const EMPTY_INTERVIEW = { competency: [], situational: [], technical: [], motivation: [], closing: [] };

const inputStyle = {
  width: '100%', border: '1px solid #dbe3f0', borderRadius: 14, background: '#fff',
  padding: '12px 14px', color: '#0f172a', fontSize: 14, lineHeight: 1.5,
};

const secondaryButton = {
  border: '1px solid #dbe3f0', borderRadius: 14, padding: '11px 14px', fontSize: 14,
  fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#334155',
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    if (typeof value.question === 'string') return value.question.trim();
    if (typeof value.text === 'string') return value.text.trim();
    if (typeof value.title === 'string') return value.title.trim();
    return JSON.stringify(value);
  }
  return String(value);
}

function toStringArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean);
  if (typeof value === 'string') {
    return value.split(/\n|,|;|•/).map((item) => item.trim()).filter(Boolean);
  }
  return [safeText(value)].filter(Boolean);
}

function normalizeExperience(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    company: safeText(item?.company), role: safeText(item?.role), period: safeText(item?.period),
    achievements: safeText(item?.achievements || item?.responsibilities || item?.result),
  })).filter((item) => item.company || item.role || item.period || item.achievements);
}

function normalizeEducation(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    institution: safeText(item?.institution || item?.school), degree: safeText(item?.degree || item?.speciality), year: safeText(item?.year),
  })).filter((item) => item.institution || item.degree || item.year);
}

function normalizeResume(data, sourceText) {
  return {
    ...EMPTY_RESUME,
    candidateName: safeText(data?.candidateName || data?.name),
    position: safeText(data?.position || data?.target_position),
    city: safeText(data?.city || data?.contacts?.city),
    experienceYears: safeText(data?.experienceYears || data?.experience_years),
    salaryExpectation: safeText(data?.salaryExpectation || data?.expected_salary || data?.salary),
    summary: safeText(data?.summary),
    skills: toStringArray(data?.skills), strengths: toStringArray(data?.strengths),
    risks: toStringArray(data?.risks || data?.red_flags),
    contacts: {
      email: safeText(data?.contacts?.email), phone: safeText(data?.contacts?.phone), telegram: safeText(data?.contacts?.telegram),
    },
    experience: normalizeExperience(data?.experience), education: normalizeEducation(data?.education), sourceText: safeText(sourceText),
  };
}

function normalizeProfile(data, sourceText) {
  return {
    ...EMPTY_PROFILE,
    title: safeText(data?.title), department: safeText(data?.department), level: safeText(data?.level), purpose: safeText(data?.purpose),
    responsibilities: toStringArray(data?.responsibilities), mustHave: toStringArray(data?.mustHave || data?.must_have),
    niceToHave: toStringArray(data?.niceToHave || data?.nice_to_have), softSkills: toStringArray(data?.softSkills || data?.soft_skills),
    kpi: toStringArray(data?.kpi), salaryRange: safeText(data?.salaryRange || data?.salary_range), education: safeText(data?.education),
    tools: toStringArray(data?.tools), notes: safeText(data?.notes), sourceText: safeText(sourceText),
  };
}

function normalizeScore(data) {
  const rawMatch = Array.isArray(data?.match) ? data.match : Array.isArray(data?.criteria) ? data.criteria : [];
  const score = Number(data?.overallScore || data?.overall_score || 0);
  return {
    ...EMPTY_SCORE,
    overallScore: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
    verdict: safeText(data?.verdict), verdictReason: safeText(data?.verdictReason || data?.verdict_reason),
    match: rawMatch.map((item) => ({ criteria: safeText(item?.criteria || item?.name), score: Number(item?.score || 0), comment: safeText(item?.comment) }))
      .filter((item) => item.criteria || item.comment),
    pros: toStringArray(data?.pros), cons: toStringArray(data?.cons),
    questionsToClarify: toStringArray(data?.questionsToClarify || data?.questions_to_clarify),
  };
}

function normalizeInterview(data) {
  return {
    ...EMPTY_INTERVIEW,
    competency: Array.isArray(data?.competency)
      ? data.competency.map((item) => ({
          competency: safeText(item?.competency || item?.title),
          question: safeText(item?.question),
          whatLookingFor: safeText(item?.whatLookingFor || item?.what_looking_for),
        })).filter((item) => item.competency || item.question || item.whatLookingFor)
      : [],
    situational: toStringArray(data?.situational), technical: toStringArray(data?.technical),
    motivation: toStringArray(data?.motivation), closing: toStringArray(data?.closing),
  };
}

function parseStoredArray(key) {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function extractJson(text) {
  const cleaned = safeText(text).replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('Не удалось разобрать JSON из ответа Claude.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function splitTextarea(value) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function joinTextarea(items) {
  return (items || []).join('\n');
}

function formatStamp(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function promptForResume(text) {
  return `Ты HR-аналитик. Проанализируй резюме и верни только валидный JSON без markdown.
Формат: {"candidateName":"","position":"","city":"","experienceYears":"","salaryExpectation":"","summary":"","skills":[""],"strengths":[""],"risks":[""],"contacts":{"email":"","phone":"","telegram":""},"experience":[{"company":"","role":"","period":"","achievements":""}],"education":[{"institution":"","degree":"","year":""}]}
Резюме:\n${text}`;
}

function promptForProfile(text) {
  return `Ты HR business partner. Составь профиль должности и верни только валидный JSON без markdown.
Формат: {"title":"","department":"","level":"","purpose":"","responsibilities":[""],"mustHave":[""],"niceToHave":[""],"softSkills":[""],"kpi":[""],"salaryRange":"","education":"","tools":[""],"notes":""}
Описание вакансии:\n${text}`;
}

function promptForScore(resume, profile, notes) {
  return `Ты опытный рекрутер. Оцени соответствие кандидата вакансии и верни только JSON без markdown.
Формат: {"overallScore":0,"verdict":"нанять/рассмотреть/отклонить","verdictReason":"","match":[{"criteria":"","score":0,"comment":""}],"pros":[""],"cons":[""],"questionsToClarify":[""]}
Кандидат:\n${JSON.stringify(resume, null, 2)}
Профиль должности:\n${JSON.stringify(profile, null, 2)}
Дополнительные заметки HR:\n${notes || 'нет'}`;
}

function promptForInterview(profile, resume, notes) {
  return `Ты senior interviewer. Подготовь вопросы для интервью и верни только валидный JSON без markdown.
Формат: {"competency":[{"competency":"","question":"","whatLookingFor":""}],"situational":[""],"technical":[""],"motivation":[""],"closing":[""]}
Профиль должности:\n${JSON.stringify(profile, null, 2)}
Кандидат:\n${resume ? JSON.stringify(resume, null, 2) : 'не выбран'}
Дополнительные заметки HR:\n${notes || 'нет'}`;
}

function InfoCard({ title, subtitle, children, actions }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 18, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 4, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{subtitle}</div> : null}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function TinyBadge({ children, tone }) {
  return <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: tone.soft, color: tone.color, marginRight: 8, marginBottom: 8 }}>{children}</span>;
}

function Field({ label, value, onChange, placeholder }) {
  return <label style={{ display: 'block' }}><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} /></label>;
}

function TextAreaField({ label, value, onChange, placeholder, minHeight = 120 }) {
  return <label style={{ display: 'block' }}><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight, resize: 'vertical' }} /></label>;
}

function SelectField({ label, value, onChange, options, placeholder }) {
  return <label style={{ display: 'block' }}><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div><select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

function ListBlock({ title, items, tone }) {
  if (!items?.length) return null;
  return <InfoCard title={title}><div>{items.map((item) => <TinyBadge key={`${title}-${item}`} tone={tone}>{item}</TinyBadge>)}</div></InfoCard>;
}

function primaryButton(tone, disabled) {
  return {
    border: 'none', borderRadius: 14, padding: '12px 16px', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e2e8f0' : `linear-gradient(135deg, ${tone.accent}, ${tone.color})`,
    color: disabled ? '#94a3b8' : '#fff', boxShadow: disabled ? 'none' : `0 12px 24px ${tone.accent}33`,
  };
}

export default function Assistant({ onLogout }) {
  const [activeTab, setActiveTab] = useState('parse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeDraft, setResumeDraft] = useState(EMPTY_RESUME);
  const [profileText, setProfileText] = useState('');
  const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE);
  const [scoreNotes, setScoreNotes] = useState('');
  const [scoreResult, setScoreResult] = useState(EMPTY_SCORE);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewResult, setInterviewResult] = useState(EMPTY_INTERVIEW);
  const [resumes, setResumes] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState('');
  const [selectedInterviewResumeId, setSelectedInterviewResumeId] = useState('');
  const [selectedInterviewProfileId, setSelectedInterviewProfileId] = useState('');
  const fileRef = useRef(null);
  const tone = TABS.find((tab) => tab.id === activeTab);

  useEffect(() => { setResumes(parseStoredArray(STORAGE_KEYS.resumes)); setProfiles(parseStoredArray(STORAGE_KEYS.profiles)); setEvaluations(parseStoredArray(STORAGE_KEYS.evaluations)); setInterviews(parseStoredArray(STORAGE_KEYS.interviews)); }, []);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEYS.resumes, JSON.stringify(resumes)); }, [resumes]);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles)); }, [profiles]);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEYS.evaluations, JSON.stringify(evaluations)); }, [evaluations]);
  useEffect(() => { if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEYS.interviews, JSON.stringify(interviews)); }, [interviews]);
  const selectedResume = useMemo(() => resumes.find((item) => item.id === selectedResumeId) || null, [resumes, selectedResumeId]);
  const selectedProfile = useMemo(() => profiles.find((item) => item.id === selectedProfileId) || null, [profiles, selectedProfileId]);
  const selectedInterviewResume = useMemo(() => resumes.find((item) => item.id === selectedInterviewResumeId) || null, [resumes, selectedInterviewResumeId]);
  const selectedInterviewProfile = useMemo(() => profiles.find((item) => item.id === selectedInterviewProfileId) || null, [profiles, selectedInterviewProfileId]);
  const resumeOptions = useMemo(() => resumes.map((item) => ({ value: item.id, label: `${item.candidateName || 'Без имени'}${item.position ? ` · ${item.position}` : ''}` })), [resumes]);
  const profileOptions = useMemo(() => profiles.map((item) => ({ value: item.id, label: `${item.title || 'Без названия'}${item.department ? ` · ${item.department}` : ''}` })), [profiles]);

  const callClaude = useCallback(async (content) => {
    const response = await fetch('/api/claude', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2500, messages: [{ role: 'user', content }] }),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data?.error || 'Не удалось получить ответ от API.');
    const text = Array.isArray(data.content) ? data.content.map((item) => safeText(item?.text)).join('\n') : safeText(data?.content);
    if (!text.trim()) throw new Error('API вернул пустой ответ.');
    return text;
  }, []);

  const withFeedback = useCallback(async (action, okMessage) => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await action();
      if (okMessage) setSuccess(okMessage);
    } catch (actionError) {
      setError(actionError.message || 'Что-то пошло не так.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFile = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPdfName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      await withFeedback(async () => {
        const base64 = String(reader.result || '').split(',')[1];
        const response = await fetch('/api/claude', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514', max_tokens: 2500,
            messages: [{ role: 'user', content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
              { type: 'text', text: 'Извлеки из резюме весь текст и верни только чистый текст без комментариев.' },
            ] }],
          }),
        });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data?.error || 'Не удалось прочитать PDF.');
        const text = Array.isArray(data.content) ? data.content.map((item) => safeText(item?.text)).join('\n') : '';
        setResumeText(text);
      }, 'Текст резюме извлечён из PDF.');
    };
    reader.readAsDataURL(file);
  }, [withFeedback]);

  const saveResume = useCallback(() => {
    const record = { ...resumeDraft, id: uid('resume'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sourceText: resumeText };
    setResumes((prev) => [record, ...prev]);
    setSelectedResumeId(record.id);
    setSelectedInterviewResumeId(record.id);
    setSuccess(`Резюме «${record.candidateName || 'без имени'}» сохранено.`);
  }, [resumeDraft, resumeText]);

  const saveProfile = useCallback(() => {
    const record = { ...profileDraft, id: uid('profile'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), sourceText: profileText };
    setProfiles((prev) => [record, ...prev]);
    setSelectedProfileId(record.id);
    setSelectedInterviewProfileId(record.id);
    setSuccess(`Профиль «${record.title || 'без названия'}» сохранён.`);
  }, [profileDraft, profileText]);

  const saveScore = useCallback(() => {
    if (!selectedResume || !selectedProfile || !scoreResult.verdict) return;
    const record = { ...scoreResult, id: uid('score'), resumeId: selectedResume.id, profileId: selectedProfile.id, notes: scoreNotes, createdAt: new Date().toISOString() };
    setEvaluations((prev) => [record, ...prev]);
    setSuccess('Оценка кандидата сохранена.');
  }, [scoreNotes, scoreResult, selectedProfile, selectedResume]);

  const saveInterview = useCallback(() => {
    if (!selectedInterviewProfile) return;
    const record = { ...interviewResult, id: uid('interview'), profileId: selectedInterviewProfile.id, resumeId: selectedInterviewResume?.id || '', notes: interviewNotes, createdAt: new Date().toISOString() };
    setInterviews((prev) => [record, ...prev]);
    setSuccess('Набор вопросов сохранён.');
  }, [interviewNotes, interviewResult, selectedInterviewProfile, selectedInterviewResume]);

  const handleResumeAnalyze = async () => {
    if (!resumeText.trim()) return;
    await withFeedback(async () => {
      const raw = await callClaude(promptForResume(resumeText));
      setResumeDraft(normalizeResume(extractJson(raw), resumeText));
    }, 'Резюме проанализировано. Проверь карточку и сохрани в базу.');
  };

  const handleProfileAnalyze = async () => {
    if (!profileText.trim()) return;
    await withFeedback(async () => {
      const raw = await callClaude(promptForProfile(profileText));
      setProfileDraft(normalizeProfile(extractJson(raw), profileText));
    }, 'Профиль должности сформирован. Его можно отредактировать и сохранить.');
  };

  const handleScoreAnalyze = async () => {
    if (!selectedResume || !selectedProfile) return;
    await withFeedback(async () => {
      const raw = await callClaude(promptForScore(selectedResume, selectedProfile, scoreNotes));
      setScoreResult(normalizeScore(extractJson(raw)));
    }, 'Оценка кандидата готова.');
  };

  const handleInterviewAnalyze = async () => {
    if (!selectedInterviewProfile) return;
    await withFeedback(async () => {
      const raw = await callClaude(promptForInterview(selectedInterviewProfile, selectedInterviewResume, interviewNotes));
      setInterviewResult(normalizeInterview(extractJson(raw)));
    }, 'Вопросы для интервью подготовлены.');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)', color: '#0f172a' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '18px 24px 14px', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: 10, alignItems: 'center', padding: '8px 12px', borderRadius: 999, background: '#fff', border: '1px solid #dbe3f0' }}>
              <span style={{ fontWeight: 800, color: '#0f766e' }}>HR AI Assistant</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>локальная база резюме и профилей</span>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>Вкладки связаны между собой: сохраняем резюме и профили, потом используем их в оценке и интервью.</div>
          </div>
          <button onClick={onLogout} style={secondaryButton}>Выйти</button>
        </div>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 24px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {TABS.map((tab) => <button key={tab.id} onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }} style={{ border: activeTab === tab.id ? `1px solid ${tab.accent}` : '1px solid #dbe3f0', background: activeTab === tab.id ? tab.soft : '#fff', color: activeTab === tab.id ? tab.color : '#475569', borderRadius: 16, padding: '12px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{tab.icon} {tab.label}</button>)}
        </div>
      </div>

      <div style={{ maxWidth: 1480, margin: '0 auto', padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px minmax(0, 1fr) 360px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <InfoCard title="База данных" subtitle="Пока без внешней БД: всё сохраняется в браузере через localStorage.">
              <div style={{ display: 'grid', gap: 10 }}>
                {[['Резюме', resumes.length], ['Профили должностей', profiles.length], ['Оценки кандидатов', evaluations.length], ['Наборы вопросов', interviews.length]].map(([label, count]) => <div key={label} style={{ padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 12, color: '#64748b' }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800 }}>{count}</div></div>)}
              </div>
            </InfoCard>

            <InfoCard title="Последние резюме" subtitle={`${resumes.length} резюме в базе`}>
              <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflow: 'auto' }}>
                {resumes.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Сохрани первое резюме, и здесь появится база кандидатов.</div> : null}
                {resumes.slice(0, 6).map((item) => <button key={item.id} onClick={() => { setSelectedResumeId(item.id); setSelectedInterviewResumeId(item.id); setActiveTab('score'); }} style={{ textAlign: 'left', ...secondaryButton }}><div style={{ fontWeight: 700 }}>{item.candidateName || 'Без имени'}</div><div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{item.position || 'Должность не указана'}{item.salaryExpectation ? ` · ${item.salaryExpectation}` : ''}</div></button>)}
              </div>
            </InfoCard>

            <InfoCard title="Последние профили" subtitle={`${profiles.length} профилей в базе`}>
              <div style={{ display: 'grid', gap: 10, maxHeight: 320, overflow: 'auto' }}>
                {profiles.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Когда сохранишь профиль должности, он станет доступен для оценки и интервью.</div> : null}
                {profiles.slice(0, 6).map((item) => <button key={item.id} onClick={() => { setSelectedProfileId(item.id); setSelectedInterviewProfileId(item.id); setActiveTab('interview'); }} style={{ textAlign: 'left', ...secondaryButton }}><div style={{ fontWeight: 700 }}>{item.title || 'Без названия'}</div><div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{item.department || 'Департамент не указан'}{item.salaryRange ? ` · ${item.salaryRange}` : ''}</div></button>)}
              </div>
            </InfoCard>
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {activeTab === 'parse' ? <>
              <InfoCard title="1. Загрузка и анализ резюме" subtitle="Можно вставить текст вручную или сначала извлечь его из PDF.">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: 'none' }} />
                    <button onClick={() => fileRef.current?.click()} style={secondaryButton}>{pdfName ? `PDF: ${pdfName}` : 'Загрузить PDF'}</button>
                    <button onClick={handleResumeAnalyze} disabled={loading || !resumeText.trim()} style={primaryButton(tone, loading || !resumeText.trim())}>Анализировать резюме</button>
                    <button onClick={saveResume} disabled={!resumeDraft.candidateName && !resumeDraft.summary} style={secondaryButton}>Сохранить в базу</button>
                  </div>
                  <TextAreaField label="Текст резюме" value={resumeText} onChange={setResumeText} placeholder="Вставь текст резюме или сначала загрузи PDF" minHeight={280} />
                </div>
              </InfoCard>

              <InfoCard title="2. Редактируемая карточка кандидата" subtitle="После анализа здесь можно поправить поля перед сохранением.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <Field label="ФИО кандидата" value={resumeDraft.candidateName} onChange={(value) => setResumeDraft((prev) => ({ ...prev, candidateName: value }))} />
                  <Field label="Желаемая должность" value={resumeDraft.position} onChange={(value) => setResumeDraft((prev) => ({ ...prev, position: value }))} />
                  <Field label="Город" value={resumeDraft.city} onChange={(value) => setResumeDraft((prev) => ({ ...prev, city: value }))} />
                  <Field label="Опыт (лет)" value={resumeDraft.experienceYears} onChange={(value) => setResumeDraft((prev) => ({ ...prev, experienceYears: value }))} />
                  <Field label="Ожидаемая зарплата" value={resumeDraft.salaryExpectation} onChange={(value) => setResumeDraft((prev) => ({ ...prev, salaryExpectation: value }))} />
                  <Field label="Email" value={resumeDraft.contacts.email} onChange={(value) => setResumeDraft((prev) => ({ ...prev, contacts: { ...prev.contacts, email: value } }))} />
                  <Field label="Телефон" value={resumeDraft.contacts.phone} onChange={(value) => setResumeDraft((prev) => ({ ...prev, contacts: { ...prev.contacts, phone: value } }))} />
                  <Field label="Telegram" value={resumeDraft.contacts.telegram} onChange={(value) => setResumeDraft((prev) => ({ ...prev, contacts: { ...prev.contacts, telegram: value } }))} />
                  <div style={{ gridColumn: '1 / -1' }}><TextAreaField label="Краткое резюме кандидата" value={resumeDraft.summary} onChange={(value) => setResumeDraft((prev) => ({ ...prev, summary: value }))} minHeight={120} /></div>
                  <TextAreaField label="Навыки" value={joinTextarea(resumeDraft.skills)} onChange={(value) => setResumeDraft((prev) => ({ ...prev, skills: splitTextarea(value) }))} minHeight={120} />
                  <TextAreaField label="Сильные стороны" value={joinTextarea(resumeDraft.strengths)} onChange={(value) => setResumeDraft((prev) => ({ ...prev, strengths: splitTextarea(value) }))} minHeight={120} />
                  <div style={{ gridColumn: '1 / -1' }}><TextAreaField label="Риски / замечания HR" value={joinTextarea(resumeDraft.risks)} onChange={(value) => setResumeDraft((prev) => ({ ...prev, risks: splitTextarea(value) }))} minHeight={120} /></div>
                </div>
              </InfoCard>
            </> : null}

            {activeTab === 'profile' ? <>
              <InfoCard title="1. Генерация профиля должности" subtitle="Claude создаёт базовый шаблон, но HR может всё отредактировать перед сохранением.">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={handleProfileAnalyze} disabled={loading || !profileText.trim()} style={primaryButton(tone, loading || !profileText.trim())}>Сформировать профиль</button>
                    <button onClick={saveProfile} disabled={!profileDraft.title && !profileDraft.purpose} style={secondaryButton}>Сохранить профиль</button>
                  </div>
                  <TextAreaField label="Описание вакансии" value={profileText} onChange={setProfileText} placeholder="Опиши вакансию, задачи, KPI, зарплату, стек, образование и особенности компании" minHeight={220} />
                </div>
              </InfoCard>

              <InfoCard title="2. Редактирование профиля" subtitle="Все ключевые поля можно вручную дополнять и использовать повторно из базы.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                  <Field label="Название должности" value={profileDraft.title} onChange={(value) => setProfileDraft((prev) => ({ ...prev, title: value }))} />
                  <Field label="Департамент" value={profileDraft.department} onChange={(value) => setProfileDraft((prev) => ({ ...prev, department: value }))} />
                  <Field label="Уровень" value={profileDraft.level} onChange={(value) => setProfileDraft((prev) => ({ ...prev, level: value }))} />
                  <Field label="Вилка зарплаты" value={profileDraft.salaryRange} onChange={(value) => setProfileDraft((prev) => ({ ...prev, salaryRange: value }))} />
                  <Field label="Образование" value={profileDraft.education} onChange={(value) => setProfileDraft((prev) => ({ ...prev, education: value }))} />
                  <Field label="Инструменты / стек" value={joinTextarea(profileDraft.tools)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, tools: splitTextarea(value) }))} />
                  <div style={{ gridColumn: '1 / -1' }}><TextAreaField label="Цель роли" value={profileDraft.purpose} onChange={(value) => setProfileDraft((prev) => ({ ...prev, purpose: value }))} minHeight={110} /></div>
                  <TextAreaField label="Основные обязанности" value={joinTextarea(profileDraft.responsibilities)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, responsibilities: splitTextarea(value) }))} minHeight={130} />
                  <TextAreaField label="Обязательные требования" value={joinTextarea(profileDraft.mustHave)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, mustHave: splitTextarea(value) }))} minHeight={130} />
                  <TextAreaField label="Желательные требования" value={joinTextarea(profileDraft.niceToHave)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, niceToHave: splitTextarea(value) }))} minHeight={130} />
                  <TextAreaField label="Soft skills" value={joinTextarea(profileDraft.softSkills)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, softSkills: splitTextarea(value) }))} minHeight={130} />
                  <TextAreaField label="KPI" value={joinTextarea(profileDraft.kpi)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, kpi: splitTextarea(value) }))} minHeight={130} />
                  <div style={{ gridColumn: '1 / -1' }}><TextAreaField label="Дополнительные заметки" value={profileDraft.notes} onChange={(value) => setProfileDraft((prev) => ({ ...prev, notes: value }))} minHeight={120} /></div>
                </div>
              </InfoCard>
            </> : null}

            {activeTab === 'score' ? <>
              <InfoCard title="Оценка кандидата по данным из базы" subtitle="Больше не нужно вручную копировать резюме и профиль должности в поле ввода.">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    <SelectField label="Кандидат из базы резюме" value={selectedResumeId} onChange={setSelectedResumeId} options={resumeOptions} placeholder="Выбери кандидата" />
                    <SelectField label="Профиль должности" value={selectedProfileId} onChange={setSelectedProfileId} options={profileOptions} placeholder="Выбери профиль" />
                  </div>
                  <TextAreaField label="Заметки HR" value={scoreNotes} onChange={setScoreNotes} placeholder="Например: важен опыт в B2B SaaS, английский C1, готовность к командировкам" minHeight={120} />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={handleScoreAnalyze} disabled={loading || !selectedResume || !selectedProfile} style={primaryButton(tone, loading || !selectedResume || !selectedProfile)}>Оценить кандидата</button>
                    <button onClick={saveScore} disabled={!scoreResult.verdict || !selectedResume || !selectedProfile} style={secondaryButton}>Сохранить оценку</button>
                  </div>
                </div>
              </InfoCard>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
                <InfoCard title="Кандидат" subtitle={selectedResume ? `${selectedResume.candidateName || 'Без имени'} · ${selectedResume.position || 'без должности'}` : 'Выбери запись из базы'}>
                  {selectedResume ? <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}><div><strong>Город:</strong> {selectedResume.city || 'не указан'}</div><div><strong>Опыт:</strong> {selectedResume.experienceYears || 'не указан'}</div><div><strong>Зарплата:</strong> {selectedResume.salaryExpectation || 'не указана'}</div><div style={{ marginTop: 10 }}>{selectedResume.summary || 'Краткое описание пока пустое.'}</div></div> : <div style={{ fontSize: 13, color: '#94a3b8' }}>Сначала сохрани резюме во вкладке парсинга.</div>}
                </InfoCard>
                <InfoCard title="Профиль должности" subtitle={selectedProfile ? `${selectedProfile.title || 'Без названия'} · ${selectedProfile.department || 'без департамента'}` : 'Выбери профиль должности'}>
                  {selectedProfile ? <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}><div><strong>Уровень:</strong> {selectedProfile.level || 'не указан'}</div><div><strong>Зарплата:</strong> {selectedProfile.salaryRange || 'не указана'}</div><div><strong>Образование:</strong> {selectedProfile.education || 'не указано'}</div><div style={{ marginTop: 10 }}>{selectedProfile.purpose || 'Описание роли пока пустое.'}</div></div> : <div style={{ fontSize: 13, color: '#94a3b8' }}>Сначала сохрани профиль во вкладке должности.</div>}
                </InfoCard>
              </div>
            </> : null}

            {activeTab === 'interview' ? <>
              <InfoCard title="Вопросы для интервью из базы профилей" subtitle="Берём сохранённый профиль должности и, при желании, конкретного кандидата из базы резюме.">
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    <SelectField label="Профиль должности" value={selectedInterviewProfileId} onChange={setSelectedInterviewProfileId} options={profileOptions} placeholder="Выбери профиль" />
                    <SelectField label="Кандидат (необязательно)" value={selectedInterviewResumeId} onChange={setSelectedInterviewResumeId} options={resumeOptions} placeholder="Выбери кандидата" />
                  </div>
                  <TextAreaField label="Что важно проверить на интервью" value={interviewNotes} onChange={setInterviewNotes} placeholder="Например: стрессоустойчивость, опыт запуска отдела продаж с нуля, кейсы по удержанию клиентов" minHeight={120} />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={handleInterviewAnalyze} disabled={loading || !selectedInterviewProfile} style={primaryButton(tone, loading || !selectedInterviewProfile)}>Сгенерировать вопросы</button>
                    <button onClick={saveInterview} disabled={!selectedInterviewProfile} style={secondaryButton}>Сохранить набор вопросов</button>
                  </div>
                </div>
              </InfoCard>

              <InfoCard title="Контекст для интервью" subtitle={selectedInterviewProfile ? selectedInterviewProfile.title : 'Профиль не выбран'}>
                {selectedInterviewProfile ? <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}><div><strong>Must have:</strong> {(selectedInterviewProfile.mustHave || []).join(', ') || 'не заполнено'}</div><div><strong>KPI:</strong> {(selectedInterviewProfile.kpi || []).join(', ') || 'не заполнено'}</div><div><strong>Кандидат:</strong> {selectedInterviewResume ? `${selectedInterviewResume.candidateName || 'Без имени'}${selectedInterviewResume.position ? ` · ${selectedInterviewResume.position}` : ''}` : 'не выбран'}</div></div> : <div style={{ fontSize: 13, color: '#94a3b8' }}>Выбери профиль должности, чтобы сформировать интервью.</div>}
              </InfoCard>
            </> : null}

            {error ? <div style={{ padding: 14, borderRadius: 16, background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', fontSize: 14 }}>{error}</div> : null}
            {success ? <div style={{ padding: 14, borderRadius: 16, background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0', fontSize: 14 }}>{success}</div> : null}
          </div>
          <div style={{ display: 'grid', gap: 16 }}>
            {activeTab === 'parse' ? <>
              <InfoCard title={resumeDraft.candidateName || 'Карточка кандидата'} subtitle={resumeDraft.position || 'После анализа здесь появится структурированный профиль.'}>
                <div style={{ display: 'grid', gap: 10, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                  <div><strong>Город:</strong> {resumeDraft.city || 'не указан'}</div>
                  <div><strong>Опыт:</strong> {resumeDraft.experienceYears || 'не указан'}</div>
                  <div><strong>Ожидаемая зарплата:</strong> {resumeDraft.salaryExpectation || 'не указана'}</div>
                  <div><strong>Контакты:</strong> {[resumeDraft.contacts.email, resumeDraft.contacts.phone, resumeDraft.contacts.telegram].filter(Boolean).join(' · ') || 'нет данных'}</div>
                  <div>{resumeDraft.summary || 'Сводка кандидата пока пустая.'}</div>
                </div>
              </InfoCard>
              <ListBlock title="Навыки" items={resumeDraft.skills} tone={tone} />
              <ListBlock title="Сильные стороны" items={resumeDraft.strengths} tone={tone} />
              <InfoCard title="Риски">{resumeDraft.risks.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Замечаний пока нет.</div> : resumeDraft.risks.map((item) => <div key={item} style={{ fontSize: 14, color: '#7f1d1d', marginBottom: 8 }}>• {item}</div>)}</InfoCard>
              <InfoCard title="Последний опыт">
                {resumeDraft.experience.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Опыт работы появится после анализа.</div> : resumeDraft.experience.map((item, index) => <div key={`${item.company}-${index}`} style={{ paddingBottom: 10, marginBottom: 10, borderBottom: index === resumeDraft.experience.length - 1 ? 'none' : '1px solid #e2e8f0' }}><div style={{ fontWeight: 700 }}>{item.role || 'Без должности'}</div><div style={{ color: '#0f766e', marginTop: 4 }}>{item.company || 'Без компании'}{item.period ? ` · ${item.period}` : ''}</div><div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>{item.achievements || 'Описание не заполнено.'}</div></div>)}
              </InfoCard>
            </> : null}

            {activeTab === 'profile' ? <>
              <InfoCard title={profileDraft.title || 'Профиль должности'} subtitle={profileDraft.department || 'После генерации здесь появится карточка роли.'}>
                <div style={{ display: 'grid', gap: 10, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                  <div><strong>Уровень:</strong> {profileDraft.level || 'не указан'}</div>
                  <div><strong>Вилка зарплаты:</strong> {profileDraft.salaryRange || 'не указана'}</div>
                  <div><strong>Образование:</strong> {profileDraft.education || 'не указано'}</div>
                  <div>{profileDraft.purpose || 'Описание роли пока пустое.'}</div>
                </div>
              </InfoCard>
              <ListBlock title="Обязанности" items={profileDraft.responsibilities} tone={tone} />
              <ListBlock title="Must have" items={profileDraft.mustHave} tone={tone} />
              <ListBlock title="Nice to have" items={profileDraft.niceToHave} tone={tone} />
              <ListBlock title="KPI" items={profileDraft.kpi} tone={tone} />
            </> : null}

            {activeTab === 'score' ? <>
              <InfoCard title="Результат оценки" subtitle={scoreResult.verdict ? `Вердикт: ${scoreResult.verdict}` : 'После анализа здесь появится итоговая оценка.'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 92, height: 92, borderRadius: '50%', background: tone.soft, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800 }}>{scoreResult.overallScore || 0}</div>
                  <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                    <div><strong>Вердикт:</strong> {scoreResult.verdict || 'ещё не рассчитан'}</div>
                    <div>{scoreResult.verdictReason || 'Здесь появится краткое объяснение решения.'}</div>
                  </div>
                </div>
              </InfoCard>
              <InfoCard title="Критерии совпадения">{scoreResult.match.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Оценка по критериям появится после запуска анализа.</div> : scoreResult.match.map((item, index) => <div key={`${item.criteria}-${index}`} style={{ marginBottom: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><div style={{ fontWeight: 700 }}>{item.criteria || 'Критерий'}</div><div style={{ color: tone.color }}>{item.score || 0}/10</div></div><div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>{item.comment || 'Комментарий не указан.'}</div></div>)}</InfoCard>
              <ListBlock title="Плюсы кандидата" items={scoreResult.pros} tone={tone} />
              <ListBlock title="Риски / минусы" items={scoreResult.cons} tone={tone} />
              <ListBlock title="Что уточнить на интервью" items={scoreResult.questionsToClarify} tone={tone} />
            </> : null}

            {activeTab === 'interview' ? <>
              <InfoCard title="Компетентностные вопросы" subtitle="Эта вкладка рендерит только безопасные строки и не должна падать на нестандартном ответе API.">
                {interviewResult.competency.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>После генерации здесь появятся вопросы по компетенциям.</div> : interviewResult.competency.map((item, index) => <div key={`${item.question}-${index}`} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: index === interviewResult.competency.length - 1 ? 'none' : '1px solid #e2e8f0' }}><div style={{ fontSize: 12, fontWeight: 700, color: tone.color, marginBottom: 4 }}>{item.competency || 'Компетенция'}</div><div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.question || 'Вопрос не указан'}</div><div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>{item.whatLookingFor || 'Подсказка для интервьюера не указана.'}</div></div>)}
              </InfoCard>
              <ListBlock title="Ситуационные вопросы" items={interviewResult.situational} tone={tone} />
              <ListBlock title="Технические вопросы" items={interviewResult.technical} tone={tone} />
              <ListBlock title="Мотивация" items={interviewResult.motivation} tone={tone} />
              <ListBlock title="Закрывающие вопросы" items={interviewResult.closing} tone={tone} />
              <InfoCard title="Сохранённые наборы" subtitle="Последние сгенерированные интервью для повторного использования.">
                {interviews.length === 0 ? <div style={{ fontSize: 13, color: '#94a3b8' }}>Ни один набор вопросов пока не сохранён.</div> : interviews.slice(0, 5).map((item) => <div key={item.id} style={{ marginBottom: 12, fontSize: 13, color: '#475569' }}><div style={{ fontWeight: 700 }}>{profiles.find((profile) => profile.id === item.profileId)?.title || 'Профиль удалён'}</div><div style={{ color: '#64748b', marginTop: 2 }}>{formatStamp(item.createdAt)}</div></div>)}
              </InfoCard>
            </> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
