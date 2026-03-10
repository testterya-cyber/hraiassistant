import { useState } from "react";

// Список клиентов — просто добавляй новые логины/пароли
const USERS = [
  { login: "client1", password: "hr2025" },
  { login: "client2", password: "recruit2025" },
  { login: "demo", password: "demo" },
];

export default function Login({ onLogin, onBack }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = USERS.find(u => u.login === login.trim() && u.password === password);
    if (user) {
      onLogin();
    } else {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#07070f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "380px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg,#4ECDC4,#FF6B9D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", margin: "0 auto 16px" }}>🤖</div>
          <div style={{ fontSize: "22px", fontWeight: "700", color: "#fff" }}>HR AI Ассистент</div>
          <div style={{ fontSize: "13px", color: "#444", marginTop: "6px" }}>Войдите чтобы продолжить</div>
        </div>

        <div style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", borderRadius: "16px", padding: "32px" }}>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Логин</div>
            <input
              value={login}
              onChange={e => { setLogin(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Введите логин"
              style={{ width: "100%", padding: "12px 14px", background: "#07070f", border: "1px solid #1e1e3a", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Пароль</div>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Введите пароль"
              style={{ width: "100%", padding: "12px 14px", background: "#07070f", border: "1px solid #1e1e3a", borderRadius: "8px", color: "#fff", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && <div style={{ color: "#FF6B6B", fontSize: "13px", marginBottom: "16px", textAlign: "center" }}>{error}</div>}

          <button onClick={handleLogin} style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#4ECDC4,#4ECDC4aa)", border: "none", borderRadius: "8px", color: "#000", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
            Войти →
          </button>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <button onClick={onBack} style={{ background: "none", border: "none", color: "#444", fontSize: "13px", cursor: "pointer" }}>← Назад</button>
          </div>

          <div style={{ marginTop: "20px", padding: "12px", background: "#07070f", borderRadius: "8px", fontSize: "12px", color: "#333", textAlign: "center" }}>
            Демо: логин <span style={{ color: "#4ECDC4" }}>demo</span> / пароль <span style={{ color: "#4ECDC4" }}>demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
