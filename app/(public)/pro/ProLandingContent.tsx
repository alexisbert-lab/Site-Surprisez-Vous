'use client';

import Link from 'next/link';
import EditableText from '@/components/editable/EditableText';
import EditableLink from '@/components/editable/EditableLink';

const MARQUES = [
  { nom: 'MDR', bg: '#E8185A', color: 'white' },
  { nom: 'Fête à DÉCO', bg: '#2B3EA0', color: 'white' },
  { nom: 'Oui pour la vie', bg: '#F5A623', color: '#1A1A2E' },
  { nom: 'Zéro de Conduite', bg: '#3DBDB0', color: 'white' },
  { nom: 'OptimiZline', bg: '#6B4FA0', color: 'white' },
];

const POSTS_INSTAGRAM = [
  { text: 'Découvrez notre nouvelle collection printemps-été 2026 ! Des couleurs vibrantes et des formes originales pour toutes vos fêtes. Voir plus', emoji: '🌸', date: 'Il y a 2j.' },
  { text: 'Notre gamme Léopard est de retour avec de nouveaux coloris. Parfait pour vos événements tendance et originaux. Voir plus', emoji: '🐆', date: 'Il y a 4j.' },
  { text: 'Les ballons métallisés s\'invitent dans vos décorations ! Disponibles en pack pro sur notre catalogue. Voir plus', emoji: '🎈', date: 'Il y a 6j.' },
];

export default function ProLandingContent() {
  return (
    <div>
      {/* ══ HERO 2 COLONNES ══ */}
      <div className="min-h-[500px] flex items-stretch">
        {/* Colonne gauche */}
        <div className="flex-[3] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 max-w-[720px]">
          <h1 className="text-4xl md:text-5xl font-extrabold text-sv-primary mb-3 font-[family-name:var(--font-heading)] leading-tight">
            <EditableText page="pro" id="hero_h1_line1">La fête c&apos;est</EditableText>
            <br />
            <EditableText page="pro" id="hero_h1_line2">du sérieux !</EditableText>
          </h1>
          <p className="text-ink-secondary mb-10 text-base">
            <EditableText page="pro" id="hero_subtitle">Veuillez vous connecter pour accéder à cette partie du site.</EditableText>
          </p>

          <div className="max-w-sm space-y-3">
            <p className="text-sm font-bold text-ink">
              <EditableText page="pro" id="hero_cta_label">Vous êtes un(e) professionnel(le) ?</EditableText>
            </p>

            <EditableLink
              page="pro"
              id="btn_connexion"
              href="/connexion"
              className="block w-full text-center py-3 bg-sv-teal hover:bg-sv-teal-dark text-white font-bold rounded-xl text-sm transition-colors"
            >
              Se connecter
            </EditableLink>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-ink-secondary">ou</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <EditableLink
              page="pro"
              id="btn_inscription"
              href="/pro/inscription"
              className="block w-full text-center py-3 bg-sv-primary hover:bg-sv-primary-dark text-white font-bold rounded-xl text-sm transition-colors"
            >
              Créer un compte
            </EditableLink>
          </div>

          {/* Sinon… */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3 max-w-sm">
            <p className="text-sm text-ink-secondary">Sinon...</p>
            <Link
              href="/revendeur"
              className="flex items-center gap-2 border-2 border-sv-primary text-sv-primary font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-sv-primary hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Trouvez un revendeur près de chez vous
            </Link>
            <Link
              href="/fiche-technique"
              className="flex items-center gap-2 bg-sv-bv hover:opacity-90 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-opacity"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Consulter une fiche technique produit
            </Link>
            <Link
              href="/showroom"
              className="flex items-center gap-2 border border-gray-300 text-ink font-semibold text-sm px-4 py-2.5 rounded-xl hover:border-sv-primary hover:text-sv-primary transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Découvrir Surprisez-Vous
            </Link>
          </div>
        </div>

        {/* Colonne droite */}
        <div
          className="hidden lg:flex flex-[2] items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #F5A623 0%, #E8185A 40%, #6B4FA0 100%)' }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <span className="absolute top-[10%] left-[15%] text-5xl opacity-30 rotate-[-20deg]">🎊</span>
            <span className="absolute top-[25%] right-[12%] text-4xl opacity-25 rotate-[15deg]">✨</span>
            <span className="absolute bottom-[20%] left-[18%] text-5xl opacity-35 rotate-[8deg]">🎉</span>
            <span className="absolute bottom-[30%] right-[10%] text-6xl opacity-30 rotate-[-10deg]">🎈</span>
          </div>
          <div className="relative z-10 text-center">
            <div className="text-9xl mb-4">🎩</div>
            <p className="text-white font-bold text-xl" style={{ whiteSpace: 'pre-line' }}>
              <EditableText page="pro" id="hero_right_text" multiline>{'Bienvenue chez\nSurprisez-Vous !'}</EditableText>
            </p>
          </div>
        </div>
      </div>

      {/* ══ RÉSEAUX SOCIAUX ══ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-5 py-10 border-t border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-sv-primary font-[family-name:var(--font-heading)]">
            <EditableText page="pro" id="section_instagram_title">Suivez-nous sur les réseaux sociaux !</EditableText>
          </h2>
          <div className="flex gap-2">
            {[
              { label: 'Facebook', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
              { label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              { label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
            ].map((s) => (
              <a key={s.label} href="#" aria-label={s.label} className="w-9 h-9 rounded-full bg-sv-primary hover:bg-sv-primary-dark flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d={s.path} /></svg>
              </a>
            ))}
          </div>
        </div>

        {/* Posts Instagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {POSTS_INSTAGRAM.map((post, i) => (
            <div key={i} className="bg-white border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4 flex items-center gap-3 border-b border-gray-50">
                <div className="w-10 h-10 rounded-full bg-sv-primary flex items-center justify-center">
                  <span className="text-white font-black text-sm">SV</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink">surprisez_vous</p>
                  <p className="text-xs text-ink-secondary">{post.date}</p>
                </div>
                <svg className="w-5 h-5 text-sv-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
              <div className="p-4">
                <p className="text-sm text-ink leading-relaxed">
                  <EditableText page="pro" id={`post_${i}_text`} multiline>
                    {post.text.replace('Voir plus', '').trim()}
                  </EditableText>
                  <button className="text-sv-primary font-semibold ml-1">Voir plus</button>
                </p>
              </div>
              <div
                className="h-44 flex items-center justify-center text-6xl"
                style={{ background: `linear-gradient(135deg, #E8185A, #6B4FA0)` }}
              >
                {post.emoji}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LOGOS MARQUES ══ */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-5 py-10 border-t border-gray-100">
        <div className="flex flex-wrap gap-4 items-center justify-center">
          {MARQUES.map((m, i) => (
            <div
              key={i}
              className="px-8 py-4 rounded-xl font-bold text-sm min-w-[130px] text-center cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: m.bg, color: m.color }}
            >
              <EditableText page="pro" id={`marque_${i}_nom`}>{m.nom}</EditableText>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
