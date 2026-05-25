import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BalloonBackgroundLazy from '@/components/BalloonBackgroundLazy';
import { ScrollProgress } from '@/components/ScrollProgress';
import { IframeEditProvider } from '@/lib/iframe-edit-context';
import { getCachedPageContent } from '@/lib/server-cache';
import CookieBanner from '@/components/CookieBanner';
import PageLoader from '@/components/PageLoader';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const headerContent = await getCachedPageContent('header');
  const logoSrc = headerContent?.logo_image ?? '';
  return (
    <IframeEditProvider initialPages={{ header: headerContent }}>
      <PageLoader logoSrc={logoSrc} />
      <BalloonBackgroundLazy />
      {/* Barre de progression scroll */}
      <div id="sv-progress" style={{
        position: 'fixed', top: 0, left: 0, height: 3,
        background: 'linear-gradient(90deg, #E8185A, #F5A623, #3DBDB0)',
        zIndex: 9999, transition: 'width 0.1s linear', pointerEvents: 'none',
        width: '0%',
      }} />
      <ScrollProgress />
      <Header />
      <main className="flex-1" style={{ paddingTop: 154 }}>
        {children}
      </main>
      <Footer />
      <CookieBanner />
    </IframeEditProvider>
  );
}
