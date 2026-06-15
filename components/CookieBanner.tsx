'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { initAnalytics } from '@/lib/firebase';

const CONSENT_KEY = 'sv_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else if (stored === 'accepted') {
      initAnalytics();
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
    initAnalytics();
  }

  function refuse() {
    localStorage.setItem(CONSENT_KEY, 'refused');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-xl">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          Nous utilisons des cookies analytiques (Google Analytics via Firebase) pour mesurer l&apos;audience et améliorer nos services.{' '}
          <Link href="/mentions-legales#cookies" className="text-sv-primary hover:underline">
            En savoir plus
          </Link>.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={refuse}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Refuser
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm bg-sv-primary text-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
