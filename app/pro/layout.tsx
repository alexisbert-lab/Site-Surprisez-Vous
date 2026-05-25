'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import ProHeader from '@/components/layout/ProHeader';
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

  // Auth résolue et non autorisée → null (le useEffect redirige)
  if (!loading && (!user || (profile?.role !== 'pro' && profile?.role !== 'admin'))) return null;

  return (
    <IframeEditProvider>
      <CartProvider>
        <ProHeader />
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-5 pb-5 sm:pb-7" style={{ paddingTop: 154 }}>{children}</main>
        <Footer />
      </CartProvider>
    </IframeEditProvider>
  );
}
