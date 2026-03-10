import { useState } from 'react';
import Landing from '../components/Landing';
import Login from '../components/Login';
import Assistant from '../components/Assistant';

export default function Home() {
  const [page, setPage] = useState('landing');
  if (page === 'app') return <Assistant onLogout={() => setPage('landing')} />;
  if (page === 'login') return <Login onLogin={() => setPage('app')} onBack={() => setPage('landing')} />;
  return <Landing onStart={() => setPage('login')} />;
}
