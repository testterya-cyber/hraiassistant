export default function Landing({ onStart }) {
  const features = [
    { icon: "📄", title: "Парсинг резюме", desc: "Загрузи PDF или вставь текст — получи структурированный профиль кандидата за секунды" },
    { icon: "🎯", title: "Профиль должности", desc: "Опиши вакансию словами — получи полный профиль с требованиями, KPI и вилкой зарплаты" },
    { icon: "⭐", title: "Оценка кандидата", desc: "Сравни кандидата с вакансией. Скор от 0 до 100 и вердикт: нанять, рассмотреть или отклонить" },
    { icon: "💬", title: "Вопросы для интервью", desc: "Генерирует вопросы по компетенциям, STAR-методу, технические и мотивационные" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#07070f", minHeight: "100vh", color: "#e0e0e0" }}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 60px", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg,#4ECDC4,#FF6B9D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🤖</div>
          <span style={{ fontSize: "16px", fontWeight: "700", color: "#fff" }}>HR AI Ассистент</span>
        </div>
        <button onClick={onStart} style={{ padding: "10px 24px", background: "linear-gradient(135deg,#4ECDC4,#4ECDC4aa)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "600", fontSize: "14px", cursor: "pointer" }}>
          Войти →
        </button>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "100px 40px 80px" }}>
        <div style={{ display: "inline-block", padding: "6px 16px", background: "#4ECDC422", border: "1px solid #4ECDC444", borderRadius: "20px", fontSize: "12px", color: "#4ECDC4", marginBottom: "24px", letterSpacing: "0.05em" }}>
          POWERED BY CLAUDE AI
        </div>
        <h1 style={{ fontSize: "56px", fontWeight: "800", lineHeight: 1.1, margin: "0 0 24px", background: "linear-gradient(135deg, #fff 40%, #4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Умный помощник<br />для рекрутера
        </h1>
        <p style={{ fontSize: "18px", color: "#888", maxWidth: "540px", margin: "0 auto 40px", lineHeight: 1.7 }}>
          Анализируй резюме, составляй профили должностей и готовься к интервью в 10 раз быстрее
        </p>
        <button onClick={onStart} style={{ padding: "16px 40px", background: "linear-gradient(135deg,#4ECDC4,#FF6B9D)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: "700", fontSize: "16px", cursor: "pointer", boxShadow: "0 0 40px #4ECDC444" }}>
          Попробовать бесплатно →
        </button>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", maxWidth: "900px", margin: "0 auto", padding: "0 40px 80px" }}>
        {features.map(f => (
          <div key={f.title} style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: "16px", padding: "28px" }}>
            <div style={{ fontSize: "32px", marginBottom: "14px" }}>{f.icon}</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginBottom: "8px" }}>{f.title}</div>
            <div style={{ fontSize: "14px", color: "#666", lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ borderTop: "1px solid #1a1a2e", borderBottom: "1px solid #1a1a2e", padding: "40px", display: "flex", justifyContent: "center", gap: "80px" }}>
        {[["10x", "быстрее работа"], ["4", "инструмента в одном"], ["PDF", "поддержка файлов"]].map(([val, label]) => (
          <div key={val} style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", fontWeight: "800", color: "#4ECDC4" }}>{val}</div>
            <div style={{ fontSize: "13px", color: "#555", marginTop: "4px" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "30px", fontSize: "12px", color: "#333" }}>
        © 2025 HR AI Ассистент
      </div>
    </div>
  );
}
