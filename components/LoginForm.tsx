'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useFadeIn } from '@/lib/useAnime';

interface LoginFormProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export default function LoginForm({ onSuccess, title = 'Espace Pro', subtitle = 'Connectez-vous avec vos identifiants professionnels.' }: LoginFormProps) {
  const { loginWithEmail } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useFadeIn<HTMLDivElement>({ duration: 500 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // Si l'identifiant contient @, c'est un email (admin) — sinon on construit le faux email client
    const email = identifier.includes('@') ? identifier : `${identifier}@sv.local`;
    const firebasePassword = identifier.includes('@') ? password : `sv-${password}`;
    try {
      await loginWithEmail(email, firebasePassword);
      onSuccess?.();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Identifiant ou mot de passe incorrect.');
      } else if (code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Réessayez dans quelques minutes.');
      } else if (code === 'auth/network-request-failed') {
        setError('Erreur réseau. Vérifiez votre connexion.');
      } else {
        setError(`Erreur : ${code || 'inconnue'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={cardRef} className="max-w-sm mx-auto mt-14 border border-border rounded-2xl p-8 shadow-xl shadow-sv-primary/5 bg-surface overflow-hidden" style={{ opacity: 0 }}>
      <div className="h-1 bg-gradient-to-r from-sv-primary to-sv-orange -mt-8 -mx-8 mb-7" />
      <h1 className="text-xl font-bold mb-1.5 text-primary">{title}</h1>
      <p className="text-sm text-ink-secondary mb-6">{subtitle}</p>

      {error && (
        <div className="p-3 mb-4 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="login" className="block text-sm font-semibold text-ink-secondary mb-1">Identifiant</label>
          <input
            type="text"
            id="login"
            name="login"
            placeholder="Votre identifiant"
            required
            autoComplete="off"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="mdp" className="block text-sm font-semibold text-ink-secondary mb-1">Mot de passe</label>
          <input
            type="password"
            id="mdp"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2.5 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primary-dark hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-5 text-[13px] text-ink-secondary text-center">
        Pas encore client Pro ?{' '}
        <a href="/pro/inscription" className="text-primary font-semibold hover:underline">
          Faire une demande
        </a>
      </p>
    </div>
  );
}
