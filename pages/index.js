import { useState } from 'react';
import Landing from '../components/Landing';
import Login from '../components/Login';
import AssistantSupabase from '../components/AssistantSupabase';

export default function Home() {
  const [page, setPage] = useState('landing');
  if (page === 'app') return <AssistantSupabase onLogout={() => setPage('landing')} />;
  if (page === 'login') return <Login onLogin={() => setPage('app')} onBack={() => setPage('landing')} />;
  return <Landing onStart={() => setPage('login')} />;
}
