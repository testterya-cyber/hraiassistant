import { useState } from 'react';

const USERS = [
  { login: 'client1', password: 'hr2025' },
  { login: 'client2', password: 'recruit2025' },
  { login: 'demo', password: 'demo' },
];

export default function Login({ onLogin, onBack }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const user = USERS.find(u => u.login === login.trim() && u.password === password);
    if (user) { onLogin(); }
    else { setError('Неверный логин или пароль'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,#4ECDC4,#FF6B9D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 14px' }}>🤖</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a1a2e' }}>HR AI Ассистент</div>
          <div style={{ fontSize: '14px', color: '#999', marginTop: '6px' }}>Войдите чтобы продолжить</div>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e8eaf0', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 24px #00000008' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Логин</div>
            <input value={login} onChange={e => { setLogin(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Введите логин"
              style={{ width: '100%', padding: '12px 14px', background: '#f8f9ff', border: '1px solid #e8eaf0', borderRadius: '10px', color: '#1a1a2e', fontSize: '14px' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Пароль</div>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Введите пароль"
              style={{ width: '100%', padding: '12px 14px', background: '#f8f9ff', border: '1px solid #e8eaf0', borderRadius: '10px', color: '#1a1a2e', fontSize: '14px' }} />
          </div>

          {error && <div style={{ color: '#e53e3e', fontSize: '13px', marginBottom: '16px', textAlign: 'center', background: '#fff5f5', padding: '8px', borderRadius: '8px' }}>{error}</div>}

          <button onClick={handleLogin} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg,#4ECDC4,#38b2ac)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            Войти →
          </button>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '13px', cursor: 'pointer' }}>← Назад</button>
          </div>

          <div style={{ marginTop: '18px', padding: '12px', background: '#f8f9ff', borderRadius: '8px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
            Демо: логин <span style={{ color: '#4ECDC4', fontWeight: '600' }}>demo</span> / пароль <span style={{ color: '#4ECDC4', fontWeight: '600' }}>demo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
