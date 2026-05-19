'use client';

import Link from 'next/link';
import { useSiteTheme } from '@/lib/site-theme-context';
import EditableText from '@/components/editable/EditableText';
import EditableLink from '@/components/editable/EditableLink';


const fbSvg = <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
const lnSvg = <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
const igSvg = <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>;

export default function Footer() {
  const { footer } = useSiteTheme();

  return (
    <footer className="mt-auto">
      {/* ── SECTION 2 — Footer principal ── */}
      <div className="bg-sv-primary">
        <div className="max-w-[1200px] mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <span className="text-white font-black text-base font-[family-name:var(--font-heading)]">SV</span>
              </div>
              <div className="text-white leading-tight">
                <div className="text-[8px] font-semibold tracking-[0.18em] opacity-80 uppercase">Surprisez</div>
                <div className="text-[12px] font-black tracking-wide uppercase">Vous</div>
              </div>
            </Link>
            <p className="text-white/80 text-sm leading-relaxed"><EditableText page="footer" id="slogan" multiline>Votre grossiste spécialiste des articles de fête et de décoration pour les professionnels.</EditableText></p>
            <div className="flex items-center gap-2">
              <a href={footer.facebook_url || '#'} aria-label="Facebook" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">{fbSvg}</a>
              <a href={footer.linkedin_url || '#'} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">{lnSvg}</a>
              <a href={footer.instagram_url || '#'} aria-label="Instagram" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">{igSvg}</a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide"><EditableText page="footer" id="col1_title">Surprisez-Vous</EditableText></h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/revendeur" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col1_link1">Revendeurs</EditableText></Link></li>
              <li><Link href="/showroom" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col1_link2">Présentation</EditableText></Link></li>
              <li><Link href="/fiche-technique" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col1_link3">Fiches techniques</EditableText></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide"><EditableText page="footer" id="col2_title">Nos produits</EditableText></h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/catalogue" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col2_link1">Ballons & Accessoires</EditableText></Link></li>
              <li><Link href="/catalogue" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col2_link2">Cadeaux Anniversaire</EditableText></Link></li>
              <li><Link href="/catalogue" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col2_link3">Décoration de salle</EditableText></Link></li>
              <li><Link href="/catalogue" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col2_link4">Grivois et sexy</EditableText></Link></li>
              <li><Link href="/catalogue" className="text-white/80 hover:text-white transition-colors"><EditableText page="footer" id="col2_link5">Nos nouveautés</EditableText></Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wide"><EditableText page="footer" id="col3_title">Newsletter</EditableText></h4>
            <p className="text-white/80 text-sm mb-4 leading-relaxed"><EditableText page="footer" id="col3_desc" multiline>Recevez nos dernières nouveautés et offres exclusives en avant-première.</EditableText></p>
            <div className="flex rounded-lg overflow-hidden">
              <input type="email" placeholder="Votre e-mail" className="flex-1 px-3 py-2 text-sm outline-none min-w-0 bg-white" />
              <button className="bg-sv-yellow hover:opacity-90 px-3 flex items-center justify-center text-white transition-opacity cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3 — Barre contact ── */}
      <div className="bg-sv-bv">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-5">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <p className="text-white text-sm text-center sm:text-left"><EditableText page="footer" id="contact_text" multiline>Une question ? Besoin de renseignements ? Nous sommes là pour vous répondre !</EditableText></p>
            <EditableLink page="footer" id="contact_btn" href="/pro/contact" className="shrink-0 bg-sv-yellow hover:opacity-90 text-gray-900 font-bold text-sm px-5 py-2 rounded-lg transition-opacity whitespace-nowrap"><EditableText page="footer" id="contact_btn_label">Contactez-nous !</EditableText></EditableLink>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-white text-sm shrink-0">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            <span><EditableText page="footer" id="contact_address">72 Rue du Bois d'Ennebourg, Z.A des Genets, 76520 BOOS</EditableText></span>
          </div>
          <div className="flex items-center gap-2 text-white shrink-0">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
            <div>
              <div className="font-bold text-sm">{footer.phone || '02.32.80.15.02'}</div>
              <div className="text-xs opacity-80"><EditableText page="footer" id="contact_hours">9h - 17h (du lundi au vendredi)</EditableText></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4 — Mentions légales ── */}
      <div className="bg-white border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Link href="/mentions-legales" className="hover:text-sv-primary transition-colors">Mentions légales</Link>
            <span className="text-gray-300">-</span>
            <Link href="/mentions-legales" className="hover:text-sv-primary transition-colors">RGPD</Link>
            <span className="text-gray-300">-</span>
            <Link href="/pro/cgv" className="hover:text-sv-primary transition-colors">CGV</Link>
            <span className="text-gray-300">-</span>
            <Link href="#" className="hover:text-sv-primary transition-colors">Plan du site</Link>
          </div>
          <span>&copy; {new Date().getFullYear()} Surprisez-Vous - Tous droits réservés.</span>
        </div>
      </div>
    </footer>
  );
}
