'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api-client';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      router.replace('/agenda');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível conectar à Orbyta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="view-auth">
      <div className="auth-card">
        <div className="orbit-mark">
          <div className="orbit-ring" />
          <div className="orbit-core" />
        </div>
        <div className="brand">Orbyta</div>
        <div className="tagline">Você sabe que precisa estudar. A gente cuida do quando.</div>

        <div className="authtabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Entrar
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Criar conta
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="in-name">Nome</label>
              <input
                id="in-name"
                type="text"
                placeholder="Como podemos te chamar"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="in-email">E-mail</label>
            <input
              id="in-email"
              type="email"
              placeholder="voce@exemplo.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="in-pass">Senha</label>
            <input
              id="in-pass"
              type="password"
              placeholder="••••••••"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button type="submit" className="btn btn-gold btn-block" disabled={submitting}>
            {submitting ? 'Um instante…' : mode === 'signup' ? 'Criar minha conta' : 'Entrar na Orbyta'}
          </button>
        </form>
        <div className="authfoot">Conectado ao backend real da Orbyta.</div>
      </div>
    </section>
  );
}
