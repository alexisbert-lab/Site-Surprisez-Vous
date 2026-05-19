'use client';

import { useEffect, useState } from 'react';
import { HeroImmersive } from '@/components/home/heroes/HeroImmersive';
import { SectionKPIs } from '@/components/home/SectionKPIs';
import { SectionUnivers } from '@/components/home/SectionUnivers';
import { SectionDecouverte } from '@/components/home/SectionDecouverte';
import { SectionInstagram } from '@/components/home/SectionInstagram';
import { SectionMarquee } from '@/components/home/SectionMarquee';
import { SectionProduits } from '@/components/home/SectionProduits';
import { fireConfetti } from '@/lib/confetti';
import type { Product } from '@/lib/firestore/products';
import { api } from '@/lib/api';

export default function HomePage() {
  const [nouveautes, setNouveautes] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);

  useEffect(() => {
    fireConfetti();
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('_editmode') === '1') return;
    let cancelled = false;
    Promise.all([
      api.getProducts(),
      api.getPageContent('home'),
    ]).then(([allProducts, homeContent]) => {
      if (cancelled) return;
      const parseIds = (raw: string | undefined): string[] => {
        if (!raw) return [];
        try { return JSON.parse(raw); } catch { return []; }
      };
      const map = new Map(allProducts.map((p) => [p.pdt_reference, p]));
      const pickProducts = (ids: string[]): Product[] =>
        ids.map((id) => map.get(id)).filter(Boolean) as Product[];
      setNouveautes(pickProducts(parseIds(homeContent.nouveautes_products)));
      setBestsellers(pickProducts(parseIds(homeContent.bestsellers_products)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <main>
      <HeroImmersive />
      <SectionKPIs />
      <SectionProduits title="Découvrez les nouveautés" titleId="produits_nouveautes_title" badge="Nouveauté" viewAllId="produits_nouveautes_viewall" sectionId="nouveautes" products={nouveautes} />
      <SectionUnivers />
      <SectionDecouverte />
      <SectionInstagram />
      <SectionProduits title="Nos best-sellers" titleId="produits_bestsellers_title" badge="Best-seller" viewAllId="produits_bestsellers_viewall" sectionId="bestsellers" products={bestsellers} />
      <SectionMarquee />
    </main>
  );
}
