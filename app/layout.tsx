import type { Metadata } from 'next';
import { Montserrat, Nunito } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { SiteThemeProvider } from '@/lib/site-theme-context';
import { getCachedThemeColors, getCachedHeaderSettings, getCachedFooterSettings } from '@/lib/server-cache';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', weight: ['400', '600', '700', '800'] });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: 'Surprisez-Vous — Spécialiste de la fête',
  description: 'Grossiste en décoration et articles de fête — Plus de 2000 références pour les professionnels',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [colors, header, footer] = await Promise.all([
    getCachedThemeColors(),
    getCachedHeaderSettings(),
    getCachedFooterSettings(),
  ]);

  return (
    <html lang="fr" className={`${montserrat.variable} ${nunito.variable}`}>
      <body>
        <AuthProvider>
          <SiteThemeProvider initialColors={colors} initialHeader={header} initialFooter={footer}>
            {children}
          </SiteThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
