'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { useSiteTheme } from '@/lib/site-theme-context';
import { useState } from 'react';
import ProSearchInput from '@/components/layout/ProSearchInput';
import { ShoppingCart, Menu, X } from 'lucide-react';

interface ProHeaderProps {
  onSearch?: (query: string) => void;
}

function CartButton() {
  const { activeCart, totalPrice } = useCart();
  const nbRefs = activeCart?.items.length ?? 0;

  return (
    <div className="relative group">
      <Link
        href="/pro/panier"
        className="relative flex items-center justify-center w-9 h-9 text-ink-secondary hover:text-sv-primary transition-colors"
        aria-label="Panier"
      >
        <ShoppingCart className="w-5 h-5" />
        {nbRefs > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {nbRefs}
          </span>
        )}
      </Link>
      <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col gap-1 bg-white border border-border rounded-xl shadow-lg px-4 py-3 w-52 z-50 pointer-events-none">
        {activeCart?.nom && (
          <span className="text-xs font-semibold text-ink truncate">{activeCart.nom}</span>
        )}
        <span className="text-xs text-ink-secondary">{nbRefs} référence{nbRefs !== 1 ? 's' : ''}</span>
        <span className="text-sm font-bold text-sv-primary">{totalPrice.toFixed(2)} € HT</span>
      </div>
    </div>
  );
}

export default function ProHeader({ onSearch }: ProHeaderProps) {
  const { user, profile, logout } = useAuth();
  const { colors, header } = useSiteTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-md">
      {/* Info bar */}
      <div className="hidden sm:block text-white text-xs py-1.5" style={{ backgroundColor: colors.sv_primary }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-5 flex items-center justify-between">
          <span>Bienvenue {profile?.entreprise || profile?.nom || user?.email}</span>
          <div className="flex items-center gap-4">
            <span>Nouveautés disponibles</span>
            <span>|</span>
            <span>Salon à venir</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-5 flex items-center gap-3 sm:gap-5 h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          {header.logo_image_url ? (
            <Image 
              src={header.logo_image_url} 
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
            />
          ) : null}
          <span 
            className="font-extrabold font-[family-name:var(--font-heading)] text-lg"
            style={{ color: colors.sv_primary }}
          >
            {header.logo_text}
          </span>
        </Link>

        {/* Search — hidden on mobile, visible on sm+ */}
        <div className="hidden sm:block flex-1 max-w-xl">
          <ProSearchInput />
        </div>

        {/* Spacer for mobile */}
        <div className="flex-1 sm:hidden" />

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-3 ml-auto">
          <Link 
            href="/pro/catalogue" 
            className="text-sm text-ink-secondary hover:transition-colors font-medium"
            style={{ '--hover-color': colors.sv_primary } as any}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Catalogue
          </Link>
          <Link 
            href="/pro/commandes" 
            className="text-sm text-ink-secondary hover:transition-colors font-medium"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Mes commandes
          </Link>
          <Link 
            href="/pro/dashboard" 
            className="text-sm text-ink-secondary hover:transition-colors font-medium"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Mon Espace
          </Link>
          <CartButton />
          <button 
            onClick={logout} 
            className="ml-4 px-3 py-1.5 border text-sm text-ink-secondary rounded-lg hover:bg-sv-grey-light transition-colors cursor-pointer"
            style={{ borderColor: colors.sv_primary + '33' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Déconnexion
          </button>
        </nav>

        {/* Mobile: panier + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <CartButton />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-sv-grey-light transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {menuOpen
              ? <X className="w-6 h-6 text-ink" />
              : <Menu className="w-6 h-6 text-ink" />
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border px-4 pb-4 pt-2 bg-white flex flex-col gap-1">
          {/* Mobile search */}
          <div className="sm:hidden mb-2">
            <ProSearchInput />
          </div>
          <Link 
            href="/pro/catalogue" 
            onClick={() => setMenuOpen(false)} 
            className="py-2 text-sm text-ink hover:transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Catalogue
          </Link>
          <Link 
            href="/pro/commandes" 
            onClick={() => setMenuOpen(false)} 
            className="py-2 text-sm text-ink hover:transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Mes commandes
          </Link>
          <Link 
            href="/pro/dashboard" 
            onClick={() => setMenuOpen(false)} 
            className="py-2 text-sm text-ink hover:transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Mon Espace
          </Link>
          <Link 
            href="/pro/panier" 
            onClick={() => setMenuOpen(false)} 
            className="py-2 text-sm text-ink hover:transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Panier
          </Link>
          <hr className="border-border my-1" />
          <span className="text-xs text-ink-secondary py-1">{profile?.entreprise || user?.email}</span>
          <button 
            onClick={() => { logout(); setMenuOpen(false); }} 
            className="py-2 text-sm text-ink hover:transition-colors text-left cursor-pointer"
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.sv_primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = '')}
          >
            Déconnexion
          </button>
        </div>
      )}
    </header>
  );
}
