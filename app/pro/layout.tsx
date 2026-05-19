'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/lib/cart-context';
import { IframeEditProvider } from '@/lib/iframe-edit-context';

export default function ProLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || (profile?.role !== 'pro' && profile?.role !== 'admin'))) {
      router.push('/connexion');
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sv-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || (profile?.role !== 'pro' && profile?.role !== 'admin')) return null;

  return (
    <IframeEditProvider>
      <CartProvider>
        <Header />
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-5 pb-5 sm:pb-7" style={{ paddingTop: 154 }}>{children}</main>
        <Footer />
      </CartProvider>
    </IframeEditProvider>
  );
}
