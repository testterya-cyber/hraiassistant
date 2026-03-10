import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabaseClient';

const TABS = [
  { id: 'parse', label: 'Парсинг резюме', color: '#0f766e', accent: '#14b8a6', soft: '#ecfeff' },
  { id: 'profile', label: 'Профиль должности', color: '#9a6700', accent: '#f59e0b', soft: '#fff7ed' },
  { id: 'score', label: 'Оценка кандидата', color: '#be185d', accent: '#ec4899', soft: '#fff1f2' },
  { id: 'interview', label: 'Интервью', color: '#166534', accent: '#22c55e', soft: '#f0fdf4' },
];

const emptyResume = { candidateName: '', position: '', city: '', experienceYears: '', salaryExpectation: '', summary: '', skills: [], strengths: [], risks: [], contacts: { email: '', phone: '', telegram: '' }, sourceText: '' };
const emptyProfile = { title: '', department: '', level: '', purpose: '', responsibilities: [], mustHave: [], niceToHave: [], softSkills: [], kpi: [], salaryRange: '', education: '', tools: [], notes: '', sourceText: '' };
const emptyScore = { overallScore: 0, verdict: '', verdictReason: '', match: [], pros: [], cons: [], questionsToClarify: [] };
const emptyInterview = { competency: [], situational: [], technical: [], motivation: [], closing: [] };
const inputStyle = { width: '100%', border: '1px solid #dbe3f0', borderRadius: 14, background: '#fff', padding: '12px 14px', color: '#0f172a', fontSize: 14, lineHeight: 1.5 };
const secondaryButton = { border: '1px solid #dbe3f0', borderRadius: 14, padding: '11px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', background: '#fff', color: '#334155' };

function safeText(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean);
  return String(value).split(/\n|,|;|•/).map((item) => item.trim()).filter(Boolean);
}

function joinList(items) { return (items || []).join('\n'); }
function splitList(value) { return value.split('\n').map((item) => item.trim()).filter(Boolean); }
function formatStamp(value) { return value ? new Date(value).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; }

function escapeHtml(value) {
  return safeText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderList(items) {
  if (!items || items.length === 0) return '<p>Не указано</p>';
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function downloadWordDocument(filename, title, sections) {
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #111827; padding: 24px; line-height: 1.5; }
        h1 { font-size: 24px; margin-bottom: 16px; }
        h2 { font-size: 18px; margin-top: 24px; margin-bottom: 8px; }
        p { margin: 6px 0; }
        ul { margin: 6px 0 6px 20px; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      ${sections.map((section) => `<h2>${escapeHtml(section.title)}</h2>${section.body}`).join('')}
    </body>
  </html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function extractJson(text) {
  const cleaned = safeText(text).replace(/```json|```/gi, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Не удалось разобрать JSON из ответа Claude.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function normalizeResume(data, sourceText = '') {
  return {
    ...emptyResume,
    candidateName: safeText(data?.candidateName || data?.candidate_name || data?.name),
    position: safeText(data?.position),
    city: safeText(data?.city || data?.contacts?.city),
    experienceYears: safeText(data?.experienceYears || data?.experience_years),
    salaryExpectation: safeText(data?.salaryExpectation || data?.salary_expectation || data?.salary),
    summary: safeText(data?.summary),
    skills: toList(data?.skills),
    strengths: toList(data?.strengths),
    risks: toList(data?.risks || data?.red_flags),
    contacts: { email: safeText(data?.contacts?.email), phone: safeText(data?.contacts?.phone), telegram: safeText(data?.contacts?.telegram) },
    sourceText: safeText(data?.sourceText || data?.source_text || sourceText),
  };
}

function normalizeProfile(data, sourceText = '') {
  return {
    ...emptyProfile,
    title: safeText(data?.title),
    department: safeText(data?.department),
    level: safeText(data?.level),
    purpose: safeText(data?.purpose),
    responsibilities: toList(data?.responsibilities),
    mustHave: toList(data?.mustHave || data?.must_have),
    niceToHave: toList(data?.niceToHave || data?.nice_to_have),
    softSkills: toList(data?.softSkills || data?.soft_skills),
    kpi: toList(data?.kpi),
    salaryRange: safeText(data?.salaryRange || data?.salary_range),
    education: safeText(data?.education),
    tools: toList(data?.tools),
    notes: safeText(data?.notes),
    sourceText: safeText(data?.sourceText || data?.source_text || sourceText),
  };
}

function normalizeScore(data) {
  return {
    ...emptyScore,
    overallScore: Number(data?.overallScore || data?.overall_score || 0) || 0,
    verdict: safeText(data?.verdict),
    verdictReason: safeText(data?.verdictReason || data?.verdict_reason),
    match: Array.isArray(data?.match) ? data.match.map((item) => ({ criteria: safeText(item?.criteria || item?.name), score: Number(item?.score || 0), comment: safeText(item?.comment) })) : [],
    pros: toList(data?.pros),
    cons: toList(data?.cons),
    questionsToClarify: toList(data?.questionsToClarify || data?.questions_to_clarify),
  };
}

function normalizeInterview(data) {
  return {
    ...emptyInterview,
    competency: Array.isArray(data?.competency) ? data.competency.map((item) => ({ competency: safeText(item?.competency || item?.title), question: safeText(item?.question), whatLookingFor: safeText(item?.whatLookingFor || item?.what_looking_for) })) : [],
    situational: toList(data?.situational),
    technical: toList(data?.technical),
    motivation: toList(data?.motivation),
    closing: toList(data?.closing),
  };
}

function resumeToRow(item) { return { candidate_name: item.candidateName, position: item.position, city: item.city, experience_years: item.experienceYears, salary_expectation: item.salaryExpectation, summary: item.summary, skills: item.skills, strengths: item.strengths, risks: item.risks, contacts: item.contacts, source_text: item.sourceText }; }
function profileToRow(item) { return { title: item.title, department: item.department, level: item.level, purpose: item.purpose, responsibilities: item.responsibilities, must_have: item.mustHave, nice_to_have: item.niceToHave, soft_skills: item.softSkills, kpi: item.kpi, salary_range: item.salaryRange, education: item.education, tools: item.tools, notes: item.notes, source_text: item.sourceText }; }
function rowToResume(row) { return { id: row.id, createdAt: row.created_at, ...normalizeResume(row) }; }
function rowToProfile(row) { return { id: row.id, createdAt: row.created_at, ...normalizeProfile(row) }; }
function rowToEvaluation(row) { return { id: row.id, resumeId: row.resume_id, profileId: row.profile_id, createdAt: row.created_at, ...normalizeScore(row) }; }
function rowToInterview(row) { return { id: row.id, resumeId: row.resume_id, profileId: row.profile_id, createdAt: row.created_at, ...normalizeInterview(row) }; }

function promptResume(text) { return `Ты HR-аналитик. Верни только JSON без markdown: {"candidateName":"","position":"","city":"","experienceYears":"","salaryExpectation":"","summary":"","skills":[""],"strengths":[""],"risks":[""],"contacts":{"email":"","phone":"","telegram":""}} Резюме:\n${text}`; }
function promptProfile(text) { return `Ты HR business partner. Пользователь может прислать только название должности или короткий контекст. Сам создай реалистичный базовый профиль должности как качественный HR-черновик для последующего редактирования. Верни только JSON без markdown: {"title":"","department":"","level":"","purpose":"","responsibilities":[""],"mustHave":[""],"niceToHave":[""],"softSkills":[""],"kpi":[""],"salaryRange":"","education":"","tools":[""],"notes":""} Название должности или контекст:\n${text}`; }
function promptScore(resume, profile, notes) { return `Ты рекрутер. Верни только JSON без markdown: {"overallScore":0,"verdict":"","verdictReason":"","match":[{"criteria":"","score":0,"comment":""}],"pros":[""],"cons":[""],"questionsToClarify":[""]} Кандидат:\n${JSON.stringify(resume, null, 2)}\nПрофиль:\n${JSON.stringify(profile, null, 2)}\nЗаметки:\n${notes || 'нет'}`; }
function promptInterview(profile, resume, notes) { return `Ты interviewer. Верни только JSON без markdown: {"competency":[{"competency":"","question":"","whatLookingFor":""}],"situational":[""],"technical":[""],"motivation":[""],"closing":[""]} Профиль:\n${JSON.stringify(profile, null, 2)}\nКандидат:\n${resume ? JSON.stringify(resume, null, 2) : 'не выбран'}\nЗаметки:\n${notes || 'нет'}`; }

function Card({ title, subtitle, children }) { return <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20, padding: 18, boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)' }}><div style={{ marginBottom: 12 }}><div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>{subtitle ? <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{subtitle}</div> : null}</div>{children}</div>; }
function Field({ label, value, onChange }) { return <label><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div><input value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle} /></label>; }
function Area({ label, value, onChange, minHeight = 120, placeholder = '' }) { return <label><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div><textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight, resize: 'vertical' }} /></label>; }
function Select({ label, value, onChange, options, placeholder }) { return <label><div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>{label}</div><select value={value} onChange={(event) => onChange(event.target.value)} style={inputStyle}><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
export default function AssistantSupabase({ onLogout }) {
  const [activeTab, setActiveTab] = useState('parse');
  const [bootLoading, setBootLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeDraft, setResumeDraft] = useState(emptyResume);
  const [profileText, setProfileText] = useState('');
  const [profileDraft, setProfileDraft] = useState(emptyProfile);
  const [scoreNotes, setScoreNotes] = useState('');
  const [scoreResult, setScoreResult] = useState(emptyScore);
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewResult, setInterviewResult] = useState(emptyInterview);
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

  const selectedResume = useMemo(() => resumes.find((item) => item.id === selectedResumeId) || null, [resumes, selectedResumeId]);
  const selectedProfile = useMemo(() => profiles.find((item) => item.id === selectedProfileId) || null, [profiles, selectedProfileId]);
  const selectedInterviewResume = useMemo(() => resumes.find((item) => item.id === selectedInterviewResumeId) || null, [resumes, selectedInterviewResumeId]);
  const selectedInterviewProfile = useMemo(() => profiles.find((item) => item.id === selectedInterviewProfileId) || null, [profiles, selectedInterviewProfileId]);
  const resumeOptions = useMemo(() => resumes.map((item) => ({ value: item.id, label: `${item.candidateName || 'Без имени'}${item.position ? ` · ${item.position}` : ''}` })), [resumes]);
  const profileOptions = useMemo(() => profiles.map((item) => ({ value: item.id, label: `${item.title || 'Без названия'}${item.department ? ` · ${item.department}` : ''}` })), [profiles]);
  const candidateSummary = useMemo(() => ({
    fullName: selectedResume?.candidateName || resumeDraft.candidateName || '',
    position: selectedResume?.position || resumeDraft.position || '',
    city: selectedResume?.city || resumeDraft.city || '',
    salary: selectedResume?.salaryExpectation || resumeDraft.salaryExpectation || '',
    summary: selectedResume?.summary || resumeDraft.summary || '',
    skills: (selectedResume?.skills && selectedResume.skills.length ? selectedResume.skills : resumeDraft.skills) || [],
    verdict: scoreResult.verdict || '',
    score: scoreResult.overallScore || 0,
    recommendations: scoreResult.pros || [],
    risks: scoreResult.cons || [],
    interviewNotes: scoreResult.questionsToClarify || [],
    hrNotes: scoreNotes || '',
  }), [resumeDraft, scoreNotes, scoreResult, selectedResume]);

  const withFeedback = useCallback(async (action, okMessage) => {
    setLoading(true); setError(''); setSuccess('');
    try { await action(); if (okMessage) setSuccess(okMessage); } catch (actionError) { setError(actionError.message || 'Что-то пошло не так.'); } finally { setLoading(false); }
  }, []);

  const callClaude = useCallback(async (content) => {
    const response = await fetch('/api/claude', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2500, messages: [{ role: 'user', content }] }) });
    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data?.error || 'Не удалось получить ответ от API.');
    const text = Array.isArray(data.content) ? data.content.map((item) => safeText(item?.text)).join('\n') : safeText(data?.content);
    if (!text.trim()) throw new Error('API вернул пустой ответ.');
    return text;
  }, []);

  const loadDatabase = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase) { setBootLoading(false); return; }
    setBootLoading(true);
    const [resumeRes, profileRes, evaluationRes, interviewRes] = await Promise.all([
      supabase.from('resumes').select('*').order('created_at', { ascending: false }),
      supabase.from('job_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('candidate_evaluations').select('*').order('created_at', { ascending: false }),
      supabase.from('interview_sets').select('*').order('created_at', { ascending: false }),
    ]);
    const dbError = [resumeRes.error, profileRes.error, evaluationRes.error, interviewRes.error].filter(Boolean)[0];
    if (dbError) throw dbError;
    setResumes((resumeRes.data || []).map(rowToResume));
    setProfiles((profileRes.data || []).map(rowToProfile));
    setEvaluations((evaluationRes.data || []).map(rowToEvaluation));
    setInterviews((interviewRes.data || []).map(rowToInterview));
    setBootLoading(false);
  }, []);

  useEffect(() => { loadDatabase().catch((loadError) => { setError(loadError.message || 'Не удалось загрузить данные из Supabase.'); setBootLoading(false); }); }, [loadDatabase]);

  const requireDb = useCallback(() => {
    if (!hasSupabaseConfig || !supabase) throw new Error('Supabase ещё не подключён. Добавь NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.');
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
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2500, messages: [{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }, { type: 'text', text: 'Извлеки из резюме весь текст и верни только чистый текст без комментариев.' }] }] }),
        });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data?.error || 'Не удалось прочитать PDF.');
        setResumeText(Array.isArray(data.content) ? data.content.map((item) => safeText(item?.text)).join('\n') : '');
      }, 'Текст резюме извлечён из PDF.');
    };
    reader.readAsDataURL(file);
  }, [withFeedback]);

  const saveResume = useCallback(async () => {
    requireDb();
    await withFeedback(async () => {
      const { data, error: saveError } = await supabase.from('resumes').insert(resumeToRow({ ...resumeDraft, sourceText: resumeText })).select().single();
      if (saveError) throw saveError;
      const saved = rowToResume(data);
      setResumes((prev) => [saved, ...prev]);
      setSelectedResumeId(saved.id);
      setSelectedInterviewResumeId(saved.id);
    }, `Резюме «${resumeDraft.candidateName || 'без имени'}» сохранено.`);
  }, [requireDb, resumeDraft, resumeText, withFeedback]);

  const saveProfile = useCallback(async () => {
    requireDb();
    await withFeedback(async () => {
      const { data, error: saveError } = await supabase.from('job_profiles').insert(profileToRow({ ...profileDraft, sourceText: profileText })).select().single();
      if (saveError) throw saveError;
      const saved = rowToProfile(data);
      setProfiles((prev) => [saved, ...prev]);
      setSelectedProfileId(saved.id);
      setSelectedInterviewProfileId(saved.id);
    }, `Профиль «${profileDraft.title || 'без названия'}» сохранён.`);
  }, [profileDraft, profileText, requireDb, withFeedback]);
  const saveScore = useCallback(async () => {
    requireDb();
    await withFeedback(async () => {
      if (!selectedResume || !selectedProfile || !scoreResult.verdict) throw new Error('Сначала выбери кандидата, профиль и сделай оценку.');
      const { data, error: saveError } = await supabase.from('candidate_evaluations').insert({ resume_id: selectedResume.id, profile_id: selectedProfile.id, overall_score: scoreResult.overallScore, verdict: scoreResult.verdict, verdict_reason: scoreResult.verdictReason, match: scoreResult.match, pros: scoreResult.pros, cons: scoreResult.cons, questions_to_clarify: scoreResult.questionsToClarify, notes: scoreNotes }).select().single();
      if (saveError) throw saveError;
      setEvaluations((prev) => [rowToEvaluation(data), ...prev]);
    }, 'Оценка кандидата сохранена.');
  }, [requireDb, scoreNotes, scoreResult, selectedProfile, selectedResume, withFeedback]);

  const saveInterview = useCallback(async () => {
    requireDb();
    await withFeedback(async () => {
      if (!selectedInterviewProfile) throw new Error('Выбери профиль должности.');
      const { data, error: saveError } = await supabase.from('interview_sets').insert({ resume_id: selectedInterviewResume?.id || null, profile_id: selectedInterviewProfile.id, competency: interviewResult.competency, situational: interviewResult.situational, technical: interviewResult.technical, motivation: interviewResult.motivation, closing: interviewResult.closing, notes: interviewNotes }).select().single();
      if (saveError) throw saveError;
      setInterviews((prev) => [rowToInterview(data), ...prev]);
    }, 'Набор вопросов сохранён.');
  }, [interviewNotes, interviewResult, requireDb, selectedInterviewProfile, selectedInterviewResume, withFeedback]);

  const handleResumeAnalyze = async () => { if (!resumeText.trim()) return; await withFeedback(async () => { const raw = await callClaude(promptResume(resumeText)); setResumeDraft(normalizeResume(extractJson(raw), resumeText)); }, 'Резюме проанализировано.'); };
  const handleProfileAnalyze = async () => { if (!profileText.trim()) return; await withFeedback(async () => { const raw = await callClaude(promptProfile(profileText)); setProfileDraft(normalizeProfile(extractJson(raw), profileText)); }, 'Профиль должности сформирован.'); };
  const handleScoreAnalyze = async () => { if (!selectedResume || !selectedProfile) return; await withFeedback(async () => { const raw = await callClaude(promptScore(selectedResume, selectedProfile, scoreNotes)); setScoreResult(normalizeScore(extractJson(raw))); }, 'Оценка кандидата готова.'); };
  const handleInterviewAnalyze = async () => { if (!selectedInterviewProfile) return; await withFeedback(async () => { const raw = await callClaude(promptInterview(selectedInterviewProfile, selectedInterviewResume, interviewNotes)); setInterviewResult(normalizeInterview(extractJson(raw))); }, 'Вопросы для интервью подготовлены.'); };

  const exportInterviewToWord = useCallback(() => {
    if (!selectedInterviewProfile && interviewResult.competency.length === 0) {
      setError('Сначала сгенерируй вопросы для интервью.');
      return;
    }
    downloadWordDocument(
      `interview-${safeText(selectedInterviewProfile?.title || 'profile')}.doc`,
      `Вопросы для интервью: ${selectedInterviewProfile?.title || 'Профиль должности'}`,
      [
        { title: 'Профиль должности', body: `<p>${escapeHtml(selectedInterviewProfile?.title || 'Не указан')}</p>` },
        { title: 'Кандидат', body: `<p>${escapeHtml(selectedInterviewResume?.candidateName || 'Не выбран')}</p>` },
        { title: 'Компетентностные вопросы', body: interviewResult.competency.length ? `<ul>${interviewResult.competency.map((item) => `<li><strong>${escapeHtml(item.competency || 'Компетенция')}:</strong> ${escapeHtml(item.question)}<br/>Что искать: ${escapeHtml(item.whatLookingFor || 'Не указано')}</li>`).join('')}</ul>` : '<p>Не указано</p>' },
        { title: 'Ситуационные вопросы', body: renderList(interviewResult.situational) },
        { title: 'Технические вопросы', body: renderList(interviewResult.technical) },
        { title: 'Мотивация', body: renderList(interviewResult.motivation) },
        { title: 'Закрывающие вопросы', body: renderList(interviewResult.closing) },
      ]
    );
  }, [interviewResult, selectedInterviewProfile, selectedInterviewResume]);

  const exportSummaryToWord = useCallback(() => {
    if (!candidateSummary.fullName && !candidateSummary.summary) {
      setError('Сначала выбери кандидата и сформируй оценку.');
      return;
    }
    downloadWordDocument(
      `candidate-summary-${safeText(candidateSummary.fullName || 'candidate')}.doc`,
      `Итоговое саммари кандидата: ${candidateSummary.fullName || 'Кандидат'}`,
      [
        { title: 'ФИО кандидата', body: `<p>${escapeHtml(candidateSummary.fullName || 'Не указано')}</p>` },
        { title: 'Желаемая должность', body: `<p>${escapeHtml(candidateSummary.position || 'Не указано')}</p>` },
        { title: 'Город и ожидания по зарплате', body: `<p>${escapeHtml(candidateSummary.city || 'Не указан')} ${candidateSummary.salary ? `| ${escapeHtml(candidateSummary.salary)}` : ''}</p>` },
        { title: 'Краткое описание', body: `<p>${escapeHtml(candidateSummary.summary || 'Не указано')}</p>` },
        { title: 'Навыки', body: renderList(candidateSummary.skills) },
        { title: 'Оценка и вердикт', body: `<p><strong>${escapeHtml(candidateSummary.verdict || 'Не рассчитан')}</strong> | ${escapeHtml(String(candidateSummary.score || 0))}/100</p>` },
        { title: 'Рекомендации', body: renderList(candidateSummary.recommendations) },
        { title: 'Риски', body: renderList(candidateSummary.risks) },
        { title: 'Что уточнить на интервью', body: renderList(candidateSummary.interviewNotes) },
        { title: 'Заметки HR', body: `<p>${escapeHtml(candidateSummary.hrNotes || 'Не указано')}</p>` },
      ]
    );
  }, [candidateSummary]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%)', color: '#0f172a' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', background: 'rgba(255,255,255,0.92)', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '18px 24px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontSize: 22, fontWeight: 800 }}>HR AI Assistant</div><div style={{ marginTop: 6, fontSize: 13, color: '#64748b' }}>Supabase + Claude: общая база резюме, профилей, оценок и интервью.</div></div>
          <button onClick={onLogout} style={secondaryButton}>Выйти</button>
        </div>
        <div style={{ maxWidth: 1440, margin: '0 auto', padding: '0 24px 16px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>{TABS.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ border: activeTab === tab.id ? `1px solid ${tab.accent}` : '1px solid #dbe3f0', background: activeTab === tab.id ? tab.soft : '#fff', color: activeTab === tab.id ? tab.color : '#475569', borderRadius: 16, padding: '12px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{tab.label}</button>)}</div>
      </div>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>
        {!hasSupabaseConfig ? <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: '#fff7ed', color: '#9a6700', border: '1px solid #fed7aa' }}>Добавь `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`, а затем выполни SQL из `supabase/schema.sql`.</div> : null}
        {bootLoading ? <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0' }}>Загружаю данные из базы...</div> : null}
        {error ? <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3' }}>{error}</div> : null}
        {success ? <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0' }}>{success}</div> : null}

        <div style={{ display: 'grid', gridTemplateColumns: '300px minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <Card title="База данных" subtitle="Счётчики записей в Supabase"><div style={{ display: 'grid', gap: 10 }}>{[['Резюме', resumes.length], ['Профили', profiles.length], ['Оценки', evaluations.length], ['Интервью', interviews.length]].map(([label, count]) => <div key={label} style={{ padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 12, color: '#64748b' }}>{label}</div><div style={{ fontSize: 24, fontWeight: 800 }}>{count}</div></div>)}</div></Card>
            <Card title="Кандидаты" subtitle="Последние резюме">{resumes.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 13 }}>База резюме пока пустая.</div> : resumes.slice(0, 6).map((item) => <button key={item.id} onClick={() => { setSelectedResumeId(item.id); setSelectedInterviewResumeId(item.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, ...secondaryButton }}><div style={{ fontWeight: 700 }}>{item.candidateName || 'Без имени'}</div><div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{item.position || 'Должность не указана'}</div></button>)}</Card>
            <Card title="Профили" subtitle="Последние профили должностей">{profiles.length === 0 ? <div style={{ color: '#94a3b8', fontSize: 13 }}>Профилей пока нет.</div> : profiles.slice(0, 6).map((item) => <button key={item.id} onClick={() => { setSelectedProfileId(item.id); setSelectedInterviewProfileId(item.id); }} style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 8, ...secondaryButton }}><div style={{ fontWeight: 700 }}>{item.title || 'Без названия'}</div><div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{item.department || 'Департамент не указан'}</div></button>)}</Card>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {activeTab === 'parse' ? <><Card title="Анализ резюме" subtitle="Загрузка PDF, анализ Claude и сохранение в Supabase"><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}><input ref={fileRef} type="file" accept=".pdf" onChange={handleFile} style={{ display: 'none' }} /><button onClick={() => fileRef.current?.click()} style={secondaryButton}>{pdfName ? `PDF: ${pdfName}` : 'Загрузить PDF'}</button><button onClick={handleResumeAnalyze} disabled={loading || !resumeText.trim()} style={{ ...secondaryButton, borderColor: tone.accent, color: tone.color }}>Анализировать</button><button onClick={saveResume} disabled={loading || (!resumeDraft.candidateName && !resumeDraft.summary)} style={secondaryButton}>Сохранить</button></div><Area label="Текст резюме" value={resumeText} onChange={setResumeText} minHeight={260} /></Card><Card title="Редактирование карточки кандидата"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}><Field label="ФИО" value={resumeDraft.candidateName} onChange={(value) => setResumeDraft((prev) => ({ ...prev, candidateName: value }))} /><Field label="Должность" value={resumeDraft.position} onChange={(value) => setResumeDraft((prev) => ({ ...prev, position: value }))} /><Field label="Город" value={resumeDraft.city} onChange={(value) => setResumeDraft((prev) => ({ ...prev, city: value }))} /><Field label="Ожидаемая зарплата" value={resumeDraft.salaryExpectation} onChange={(value) => setResumeDraft((prev) => ({ ...prev, salaryExpectation: value }))} /><Area label="Краткая сводка" value={resumeDraft.summary} onChange={(value) => setResumeDraft((prev) => ({ ...prev, summary: value }))} minHeight={120} /><Area label="Навыки" value={joinList(resumeDraft.skills)} onChange={(value) => setResumeDraft((prev) => ({ ...prev, skills: splitList(value) }))} minHeight={120} /></div></Card></> : null}
            {activeTab === 'profile' ? <><Card title="Профиль должности" subtitle="Достаточно ввести название должности, а сайт сам создаст черновик профиля под редактирование"><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}><button onClick={handleProfileAnalyze} disabled={loading || !profileText.trim()} style={{ ...secondaryButton, borderColor: tone.accent, color: tone.color }}>Создать черновик профиля</button><button onClick={saveProfile} disabled={loading || (!profileDraft.title && !profileDraft.purpose)} style={secondaryButton}>Сохранить профиль</button></div><Area label="Название должности или короткий контекст" value={profileText} onChange={setProfileText} minHeight={220} placeholder="Например: HR директор" /></Card><Card title="Редактирование профиля"><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}><Field label="Название должности" value={profileDraft.title} onChange={(value) => setProfileDraft((prev) => ({ ...prev, title: value }))} /><Field label="Департамент" value={profileDraft.department} onChange={(value) => setProfileDraft((prev) => ({ ...prev, department: value }))} /><Field label="Уровень" value={profileDraft.level} onChange={(value) => setProfileDraft((prev) => ({ ...prev, level: value }))} /><Field label="Вилка зарплаты" value={profileDraft.salaryRange} onChange={(value) => setProfileDraft((prev) => ({ ...prev, salaryRange: value }))} /><Area label="Цель роли" value={profileDraft.purpose} onChange={(value) => setProfileDraft((prev) => ({ ...prev, purpose: value }))} minHeight={120} /><Area label="Must have" value={joinList(profileDraft.mustHave)} onChange={(value) => setProfileDraft((prev) => ({ ...prev, mustHave: splitList(value) }))} minHeight={120} /></div></Card></> : null}
            {activeTab === 'score' ? <Card title="Оценка кандидата" subtitle="Выбор кандидата и профиля из базы"><div style={{ display: 'grid', gap: 12 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}><Select label="Кандидат" value={selectedResumeId} onChange={setSelectedResumeId} options={resumeOptions} placeholder="Выбери кандидата" /><Select label="Профиль" value={selectedProfileId} onChange={setSelectedProfileId} options={profileOptions} placeholder="Выбери профиль" /></div><Area label="Заметки HR" value={scoreNotes} onChange={setScoreNotes} minHeight={120} /><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button onClick={handleScoreAnalyze} disabled={loading || !selectedResume || !selectedProfile} style={{ ...secondaryButton, borderColor: tone.accent, color: tone.color }}>Оценить</button><button onClick={saveScore} disabled={loading || !scoreResult.verdict} style={secondaryButton}>Сохранить оценку</button><button onClick={exportSummaryToWord} disabled={loading || (!candidateSummary.fullName && !candidateSummary.summary)} style={secondaryButton}>Скачать саммари в Word</button></div><div style={{ padding: 16, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}><div style={{ fontSize: 32, fontWeight: 800, color: tone.color }}>{scoreResult.overallScore || 0}</div><div style={{ marginTop: 8, fontWeight: 700 }}>{scoreResult.verdict || 'Вердикт ещё не рассчитан'}</div><div style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>{scoreResult.verdictReason || 'После анализа здесь появится краткое объяснение.'}</div></div></div></Card> : null}
            {activeTab === 'interview' ? <Card title="Вопросы для интервью" subtitle="Профиль должности и кандидат подтягиваются из базы"><div style={{ display: 'grid', gap: 12 }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}><Select label="Профиль" value={selectedInterviewProfileId} onChange={setSelectedInterviewProfileId} options={profileOptions} placeholder="Выбери профиль" /><Select label="Кандидат" value={selectedInterviewResumeId} onChange={setSelectedInterviewResumeId} options={resumeOptions} placeholder="Необязательно" /></div><Area label="Фокус интервью" value={interviewNotes} onChange={setInterviewNotes} minHeight={120} /><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button onClick={handleInterviewAnalyze} disabled={loading || !selectedInterviewProfile} style={{ ...secondaryButton, borderColor: tone.accent, color: tone.color }}>Сгенерировать</button><button onClick={saveInterview} disabled={loading || !selectedInterviewProfile} style={secondaryButton}>Сохранить набор</button><button onClick={exportInterviewToWord} disabled={loading || (!selectedInterviewProfile && interviewResult.competency.length === 0)} style={secondaryButton}>Скачать вопросы в Word</button></div><div>{interviewResult.competency.map((item, index) => <div key={`${item.question}-${index}`} style={{ padding: 12, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10 }}><div style={{ fontSize: 12, color: tone.color, fontWeight: 700 }}>{item.competency || 'Компетенция'}</div><div style={{ marginTop: 6, fontWeight: 700 }}>{item.question || 'Вопрос не указан'}</div><div style={{ marginTop: 4, fontSize: 13, color: '#64748b' }}>{item.whatLookingFor || 'Подсказка не указана'}</div></div>)}</div></div></Card> : null}
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <Card title="Быстрый просмотр" subtitle="Содержимое текущей вкладки">{activeTab === 'parse' ? <div><div style={{ fontWeight: 700 }}>{resumeDraft.candidateName || 'Кандидат не определён'}</div><div style={{ marginTop: 6, color: '#64748b' }}>{resumeDraft.position || 'Должность не определена'}</div><div style={{ marginTop: 10 }}>{resumeDraft.summary || 'После анализа здесь появится краткая сводка.'}</div></div> : null}{activeTab === 'profile' ? <div><div style={{ fontWeight: 700 }}>{profileDraft.title || 'Профиль не сформирован'}</div><div style={{ marginTop: 6, color: '#64748b' }}>{profileDraft.department || 'Департамент не указан'}</div><div style={{ marginTop: 10 }}>{profileDraft.purpose || 'После генерации здесь появится цель роли.'}</div></div> : null}{activeTab === 'score' ? <div><div style={{ fontWeight: 700 }}>{scoreResult.verdict || 'Оценка не выполнена'}</div><div style={{ marginTop: 6, color: '#64748b' }}>{scoreResult.overallScore || 0}/100</div><div style={{ marginTop: 10 }}>{scoreResult.pros.map((item) => <div key={item}>• {item}</div>)}</div></div> : null}{activeTab === 'interview' ? <div>{interviewResult.situational.map((item) => <div key={item} style={{ marginBottom: 8 }}>• {item}</div>)}</div> : null}</Card>
            <Card title="Сохранённое недавно" subtitle="Последние записи из базы">{activeTab === 'score' ? evaluations.slice(0, 5).map((item) => <div key={item.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700 }}>{item.verdict || 'Без вердикта'} · {item.overallScore || 0}/100</div><div style={{ fontSize: 12, color: '#64748b' }}>{formatStamp(item.createdAt)}</div></div>) : interviews.slice(0, 5).map((item) => <div key={item.id} style={{ marginBottom: 10 }}><div style={{ fontWeight: 700 }}>{profiles.find((profile) => profile.id === item.profileId)?.title || 'Профиль удалён'}</div><div style={{ fontSize: 12, color: '#64748b' }}>{formatStamp(item.createdAt)}</div></div>)}</Card><Card title="Итоговое саммари кандидата" subtitle="Готовая HR-сводка по кандидату">{candidateSummary.fullName || candidateSummary.summary ? <div style={{ fontSize: 14, lineHeight: 1.6, color: '#334155' }}><div><strong>ФИО:</strong> {candidateSummary.fullName || 'Не указано'}</div><div><strong>Должность:</strong> {candidateSummary.position || 'Не указана'}</div><div><strong>Зарплата:</strong> {candidateSummary.salary || 'Не указана'}</div><div style={{ marginTop: 8 }}><strong>Навыки:</strong> {candidateSummary.skills.length ? candidateSummary.skills.join(', ') : 'Не указаны'}</div><div style={{ marginTop: 8 }}><strong>Оценка:</strong> {candidateSummary.verdict || 'Не рассчитана'} · {candidateSummary.score || 0}/100</div><div style={{ marginTop: 8 }}><strong>Рекомендации:</strong></div>{candidateSummary.recommendations.length ? candidateSummary.recommendations.map((item) => <div key={item}>• {item}</div>) : <div>Не указаны</div>}<div style={{ marginTop: 8 }}><strong>Заметки HR:</strong> {candidateSummary.hrNotes || 'Не указаны'}</div></div> : <div style={{ color: '#94a3b8', fontSize: 13 }}>После оценки кандидата здесь появится полное саммари для HR.</div>}</Card>
          </div>
        </div>
      </div>
    </div>
  );
}
