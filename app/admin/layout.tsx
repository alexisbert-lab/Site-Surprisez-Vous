'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.push('/admin/connexion');
    }
  }, [user, profile, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-admin-bg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sv-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-ink-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') return null;

  return (
    <div className="bg-admin-bg min-h-screen">
      {/* Top bar */}
      <div className="bg-sv-primary text-white h-[50px] flex items-center justify-between px-4 sm:px-5 shadow-md fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-[15px] sm:text-[17px] font-bold font-[family-name:var(--font-heading)]">Surprisez-Vous — Admin</span>
        </div>
        <div className="text-[13px] text-white/85 flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline">{user.email}</span>
          <button onClick={logout} className="px-2.5 py-1 rounded border border-white/40 text-xs hover:bg-white/10 transition-colors cursor-pointer">
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex mt-[50px] min-h-[calc(100vh-50px)]">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="md:ml-[220px] p-4 sm:p-7 flex-1 min-w-0 bg-admin-bg">{children}</main>
      </div>
    </div>
  );
}
