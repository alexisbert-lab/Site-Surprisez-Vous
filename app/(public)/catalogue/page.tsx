'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function CataloguePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (profile?.role === 'pro' || profile?.role === 'admin') {
      router.replace('/pro/catalogue');
    } else {
      router.replace('/connexion');
    }
  }, [loading, profile, router]);

  return null;
}
