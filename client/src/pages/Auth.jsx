import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Auth({ onAuthed }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isRegister = mode === 'register';

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = isRegister ? await api.register(form) : await api.login(form);
      setToken(data.token);
      onAuthed(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <div className="auth-intro">
        <h1 className="brand brand-large">Kharcha</h1>
        <p className="auth-line">Type what you spent. Kharcha files it.</p>
        <p className="auth-sub">
          Write “450 on groceries yesterday” the way you would text a friend. It becomes a dated,
          categorised entry you can check before it is saved.
        </p>
      </div>

      <form className="auth-form" onSubmit={submit}>
        <h2>{isRegister ? 'Create your account' : 'Log in'}</h2>

        {isRegister && (
          <label>
            Name
            <input value={form.name} onChange={update('name')} autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            minLength={isRegister ? 8 : undefined}
            required
          />
          {isRegister && <span className="field-hint">At least 8 characters.</span>}
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button className="btn" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
        </button>

        <button
          type="button"
          className="btn-quiet"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
          }}
        >
          {isRegister ? 'Already have an account? Log in' : 'New here? Create an account'}
        </button>
      </form>
    </main>
  );
}
