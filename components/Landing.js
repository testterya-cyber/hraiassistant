export default function Landing({ onStart }) {
  const features = [
    { icon: '📄', title: 'Парсинг резюме', desc: 'Загрузи PDF или вставь текст — получи структурированный профиль кандидата за секунды', color: '#e8f8f7', border: '#4ECDC4' },
    { icon: '🎯', title: 'Профиль должности', desc: 'Опиши вакансию словами — получи полный профиль с требованиями, KPI и вилкой зарплаты', color: '#fffbe8', border: '#f0c040' },
    { icon: '⭐', title: 'Оценка кандидата', desc: 'Скор от 0 до 100 и чёткий вердикт: нанять, рассмотреть или отклонить', color: '#fef0f5', border: '#FF6B9D' },
    { icon: '💬', title: 'Вопросы для интервью', desc: 'Вопросы по компетенциям, STAR-методу, технические и мотивационные', color: '#f0f8f0', border: '#4CAF50' },
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: '#f8f9ff', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', padding: '16px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#4ECDC4,#FF6B9D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🤖</div>
          <span style={{ fontSize: '17px', fontWeight: '700', color: '#1a1a2e' }}>HR AI Ассистент</span>
        </div>
        <button onClick={onStart} style={{ padding: '10px 28px', background: 'linear-gradient(135deg,#4ECDC4,#38b2ac)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '600', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 8px #4ECDC444' }}>
          Войти →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '80px 40px 60px' }}>
        <div style={{ display: 'inline-block', padding: '6px 18px', background: '#e8f8f7', border: '1px solid #4ECDC466', borderRadius: '20px', fontSize: '12px', color: '#2a9d8f', marginBottom: '24px', fontWeight: '600', letterSpacing: '0.05em' }}>
          POWERED BY CLAUDE AI
        </div>
        <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: 1.15, margin: '0 0 20px', color: '#1a1a2e' }}>
          Умный помощник<br />
          <span style={{ background: 'linear-gradient(135deg,#4ECDC4,#FF6B9D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>для рекрутера</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#666', maxWidth: '520px', margin: '0 auto 36px', lineHeight: 1.7 }}>
          Анализируй резюме, составляй профили должностей и готовься к интервью в 10 раз быстрее
        </p>
        <button onClick={onStart} style={{ padding: '16px 44px', background: 'linear-gradient(135deg,#4ECDC4,#FF6B9D)', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 20px #4ECDC455' }}>
          Попробовать бесплатно →
        </button>
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '20px', maxWidth: '860px', margin: '0 auto', padding: '0 40px 80px' }}>
        {features.map(f => (
          <div key={f.title} style={{ background: f.color, border: `1px solid ${f.border}44`, borderRadius: '16px', padding: '28px', borderTop: `3px solid ${f.border}` }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{f.icon}</div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' }}>{f.title}</div>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8eaf0', borderBottom: '1px solid #e8eaf0', padding: '40px', display: 'flex', justifyContent: 'center', gap: '80px' }}>
        {[['10x', 'быстрее работа'], ['4', 'инструмента в одном'], ['PDF', 'поддержка файлов']].map(([val, label]) => (
          <div key={val} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#4ECDC4' }}>{val}</div>
            <div style={{ fontSize: '13px', color: '#999', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', padding: '24px', fontSize: '13px', color: '#bbb' }}>
        © 2025 HR AI Ассистент
      </div>
    </div>
  );
}
