import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import Auth from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getToken()));

  // Restore the session if a token is already stored.
  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  // api.js fires this when the server says the session has expired.
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('kharcha:logout', onLogout);
    return () => window.removeEventListener('kharcha:logout', onLogout);
  }, []);

  if (booting) return <p className="boot">Loading…</p>;

  return user ? (
    <Dashboard
      user={user}
      onLogout={() => {
        setToken(null);
        setUser(null);
      }}
    />
  ) : (
    <Auth onAuthed={setUser} />
  );
}
