'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await register(form.name, form.email, form.password);
      router.push('/dashboard');
    } catch (err) {
      setMsg({ kind: 'error', text: err instanceof Error ? err.message : 'Registration failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2>Create account</h2>
        <p className="auth-sub">Join the NOIRÉON inner circle</p>
        <form onSubmit={onSubmit}>
          <div className="field"><label>Full name</label><input value={form.name} onChange={set('name')} placeholder="Your name" required /></div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={set('email')} placeholder="you@email.com" required /></div>
          <div className="field"><label>Password</label><input type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required /></div>
          <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
          {msg && <div className={`form-msg ${msg.kind}`}>{msg.text}</div>}
        </form>
        <p className="auth-alt">Already a member? <Link href="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
