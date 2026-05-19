'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AdminConnexionPage() {
  const { user, profile, loading, loginWithEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && profile?.role === 'admin') router.push('/admin');
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try { await loginWithEmail(email, password); router.push('/admin'); }
    catch { setError('Identifiants incorrects.'); }
    finally { setSubmitting(false); }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg">
      <div className="w-[380px] bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
        <h1 className="text-xl font-bold text-primary mb-1">Back-office</h1>
        <p className="text-sm text-gray-500 mb-6">Acces administrateur uniquement</p>

        {error && <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-500 mb-1">Email</label>
            <input type="email" id="email" placeholder="admin@surprisez-vous.fr" required
              value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div className="mb-4">
            <label htmlFor="mdp" className="block text-sm font-semibold text-gray-500 mb-1">Mot de passe</label>
            <input type="password" id="mdp" required value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50">
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

      </div>
    </div>
  );
}
