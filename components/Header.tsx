'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/useCart';
import { PromoBar } from '@/components/layout/PromoBar';
import { NavItem } from '@/components/layout/NavItem';
import { IconBtn } from '@/components/layout/IconBtn';
import SearchBar from '@/components/ui/SearchBar';
import { Icon } from '@/components/ui/Icon';
import EditableText from '@/components/editable/EditableText';
import EditableImage from '@/components/editable/EditableImage';
import EditableBlock from '@/components/editable/EditableBlock';
import EditableLink from '@/components/editable/EditableLink';

const NAV_ITEMS = [
  { label: 'Accueil',      href: '/',                       sub: null },
  { label: 'Nos produits', href: '/catalogue',              sub: [{ label: 'Par gamme', href: '/catalogue?tab=gamme' }, { label: 'Par marque', href: '/catalogue?tab=marque' }, { label: 'Recherche', href: '/catalogue?tab=search' }] },
  { label: 'Gammes',       href: '/catalogue?tab=gamme',   sub: null },
  { label: 'Marques',      href: '/catalogue?tab=marque',  sub: null },
  { label: 'Showrooms',    href: '/showroom',               sub: null },
];

export default function Header() {
  const { profile } = useAuth();
  const { totalItems } = useCart();
  const isPro = profile?.role === 'pro' || profile?.role === 'admin';
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (y > lastScrollY.current && y > 80 && !document.body.classList.contains('showroom-page')) setHidden(true);
      else if (y < lastScrollY.current) setHidden(false);
      lastScrollY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <EditableBlock
      as="header"
      page="header"
      id="header_bg"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 300,
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.12)' : '0 1px 0 #e2e8f0',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'box-shadow 0.3s, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        background: '#fff',
      }}
    >
      {/* Barre promo */}
      <EditableBlock page="header" id="promobar_bg">
        <PromoBar />
      </EditableBlock>

      {/* Bande principale */}
      <EditableBlock
        page="header"
        id="header_main_bg"
        style={{ height: 72, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, maxWidth: 1280, margin: '0 auto', width: '100%' }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <EditableImage
            page="header"
            id="logo_image"
            src=""
            alt="Logo Surprisez-Vous"
            className="h-[48px] w-auto object-contain"
            fallback={
              <div style={{
                height: 48, minWidth: 48, borderRadius: 10, border: '2px dashed #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#cbd5e1', fontSize: 11, fontWeight: 600, padding: '0 12px',
              }}>
                Logo
              </div>
            }
          />
        </Link>

        {/* SearchBar */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <SearchBar />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          <IconBtn
            icon={<Icon name="user" size={22} />}
            label={isPro ? 'Mon espace' : 'Connexion'}
            onClick={() => window.location.href = isPro ? '/pro/dashboard' : '/connexion'}
          />
          <IconBtn
            icon={<Icon name="cart" size={22} />}
            label="Panier"
            badge={totalItems}
            onClick={() => window.location.href = isPro ? '/pro/panier' : '/connexion'}
          />
          <EditableBlock
            as={Link}
            page="header"
            id="btn_fiche_bg"
            href="/fiche-technique"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #3DBDB0, #2a9a8e)',
              color: '#fff', textDecoration: 'none', padding: '8px 14px', borderRadius: 10,
              fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700,
              boxShadow: '0 2px 12px rgba(61,189,176,0.27)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            className="hidden lg:flex"
            onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(61,189,176,0.4)'; }}
            onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(61,189,176,0.27)'; }}
          >
            <Icon name="clipboard" size={14} />
            <EditableText page="header" id="btn_fiche">Fiche technique</EditableText>
          </EditableBlock>

          {/* Burger mobile */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ border: 'none', background: 'transparent', padding: 8, cursor: 'pointer', color: '#1e2a35' }}>
            <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </EditableBlock>

      {/* Nav bar */}
      <EditableBlock
        page="header"
        id="nav_bar_bg"
        className="hidden md:block"
        style={{ borderTop: '2px solid #f4f4f6' }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44 }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
            {NAV_ITEMS.map((item, i) => (
              <NavItem
                key={i}
                page="header"
                hrefId={`nav_${i}_href`}
                href={item.href}
                label={<EditableText page="header" id={`nav_${i}`}>{item.label}</EditableText>}
                sub={item.sub ?? undefined}
              />
            ))}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {[
              { label: 'Catalogues', id: 'subnav_catalogues', href: '/catalogues', icon: 'book' as const },
              { label: 'Revendeur',  id: 'subnav_revendeur',  href: '/revendeur',  icon: 'store' as const },
              { label: 'Contact',    id: 'subnav_contact',    href: '/pro/contact', icon: 'phone' as const },
            ].map(({ label, id, href, icon }) => (
              <EditableLink key={label} page="header" id={`${id}_href`} href={href} className="flex items-center gap-[5px]" style={{
                fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700,
                color: '#6b7280', textDecoration: 'none', transition: 'color 0.2s',
              }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement).style.color = '#E8185A'}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => (e.currentTarget as HTMLElement).style.color = '#6b7280'}
              >
                <Icon name={icon} size={13} />
                <EditableText page="header" id={id}>{label}</EditableText>
              </EditableLink>
            ))}
            <EditableBlock
              as={Link}
              page="header"
              id="badge_pro_bg"
              href={isPro ? '/pro/dashboard' : '/espace-pro'}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#fdeaef', color: '#E8185A', borderRadius: 20,
                padding: '4px 12px', textDecoration: 'none',
                fontSize: 11, fontFamily: 'var(--font-body)', fontWeight: 800,
              }}
            >
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#E8185A',
                boxShadow: '0 0 6px #E8185A', display: 'inline-block',
                animation: 'dotPulse 1.5s ease-in-out infinite',
              }} />
              <EditableText page="header" id="badge_espace_pro">Espace Pro</EditableText>
            </EditableBlock>
          </div>
        </div>
      </EditableBlock>

      {/* Mobile menu */}
      {mobileOpen && (
        <EditableBlock
          page="header"
          id="mobile_menu_bg"
          style={{ background: '#fff', borderTop: '1px solid #f4f4f6', padding: '12px 24px 20px' }}
        >
          <SearchBar className="mb-3" />
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_ITEMS.map(item => (
              <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)}
                style={{ padding: '10px 0', borderBottom: '1px solid #f4f4f6', fontSize: 14, fontWeight: 700, color: '#1e2a35', textDecoration: 'none' }}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <EditableBlock
              as={Link}
              page="header"
              id="mobile_btn_fiche_bg"
              href="/fiche-technique"
              onClick={() => setMobileOpen(false)}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10,
                background: 'linear-gradient(135deg, #3DBDB0, #2a9a8e)', color: '#fff',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <EditableText page="header" id="mobile_btn_fiche">Fiche technique</EditableText>
            </EditableBlock>
            <EditableBlock
              as={Link}
              page="header"
              id="mobile_btn_connexion_bg"
              href={isPro ? '/pro/dashboard' : '/connexion'}
              onClick={() => setMobileOpen(false)}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 10,
                background: '#fdeaef', color: '#E8185A',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <EditableText page="header" id="mobile_btn_connexion">{isPro ? 'Mon espace' : 'Connexion'}</EditableText>
            </EditableBlock>
          </div>
        </EditableBlock>
      )}
    </EditableBlock>
  );
}
