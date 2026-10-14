'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const user = await login(email, password);
      router.push(user.role === 'admin' ? '/admin' : next);
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Login failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h2>Welcome back</h2>
      <p className="auth-sub">Sign in to your NOIRÉON account</p>
      <form onSubmit={onSubmit}>
        <div className="field"><label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required /></div>
        <div className="field"><label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required /></div>
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</button>
        {msg && <div className={`form-msg ${msg.kind}`}>{msg.text}</div>}
      </form>
      <div className="hint">Demo admin: admin@noireon.com / admin123 · Demo user: user@noireon.com / user123</div>
      <p className="auth-alt">New here? <Link href="/register">Create an account</Link></p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="auth-wrap">
      <Suspense fallback={<div className="auth-card"><h2>Loading…</h2></div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
