'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect } from 'react';
import Link from 'next/link';
import LoginForm from '@/components/LoginForm';

export default function ConnexionPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && (profile?.role === 'pro' || profile?.role === 'admin')) {
      router.push('/pro/dashboard');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-stretch">
      {/* ── Colonne gauche (60%) ── */}
      <div className="flex-[3] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 max-w-[720px]">
        <h1 className="text-4xl md:text-5xl font-extrabold text-sv-primary mb-3 font-[family-name:var(--font-heading)] leading-tight">
          La fête c&apos;est<br />du sérieux !
        </h1>
        <p className="text-ink-secondary mb-10 text-base">
          Veuillez vous connecter pour accéder à cette partie du site.
        </p>

        {/* Formulaire de connexion */}
        <div className="max-w-sm">
          <p className="text-sm font-bold text-ink mb-4">Vous êtes un(e) professionnel(le) ?</p>
          <LoginForm
            onSuccess={() => router.push('/pro/dashboard')}
            title=""
            subtitle=""
          />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-ink-secondary">ou</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <Link
            href="/pro/inscription"
            className="block w-full text-center py-3 bg-sv-primary hover:bg-sv-primary-dark text-white font-bold rounded-xl text-sm transition-colors"
          >
            Créer un compte
          </Link>
        </div>

        {/* Sinon… */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-ink-secondary mb-3">Sinon...</p>
          <Link
            href="/revendeur"
            className="inline-flex items-center gap-2 border-2 border-sv-primary text-sv-primary font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-sv-primary hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Trouvez un revendeur près de chez vous
          </Link>
        </div>
      </div>

      {/* ── Colonne droite (40%) ── */}
      <div
        className="hidden lg:flex flex-[2] items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8185A 40%, #6B4FA0 100%)' }}
      >
        {/* Explosion de poudres colorées (simulation) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          <span className="absolute top-[10%] left-[15%] text-6xl opacity-40 rotate-[-20deg]">🎊</span>
          <span className="absolute top-[20%] right-[10%] text-5xl opacity-30 rotate-[15deg]">✨</span>
          <span className="absolute bottom-[15%] left-[20%] text-5xl opacity-40 rotate-[8deg]">🎉</span>
          <span className="absolute bottom-[25%] right-[15%] text-6xl opacity-35 rotate-[-10deg]">🎈</span>
          <span className="absolute top-[45%] left-[8%] text-4xl opacity-25">🌟</span>
          <span className="absolute top-[55%] right-[8%] text-4xl opacity-25 rotate-[20deg]">🎀</span>
        </div>

        {/* Personnage central placeholder */}
        <div className="relative z-10 w-64 h-80 bg-white/20 border-2 border-white/40 rounded-2xl flex flex-col items-center justify-center text-center p-6">
          <div className="text-8xl mb-4">🎩</div>
          <p className="text-white font-bold text-lg leading-tight">L&apos;espace pro<br />vous attend !</p>
          <p className="text-white/80 text-sm mt-2">+3000 références<br />tarifs exclusifs</p>
        </div>
      </div>
    </div>
  );
}
