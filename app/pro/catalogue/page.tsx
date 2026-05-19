import { Suspense } from 'react';
import {
  getCachedProducts,
  getCachedDeclinations,
  getCachedStockSettings,
  getCachedStatCategories,
} from '@/lib/server-cache';
import { filterArticlesVisiblesWithStatCats } from '@/lib/firestore/products';
import ProCatalogueClient from './ProCatalogueClient';

export default async function ProCataloguePage() {
  const [allProducts, declinations, stockSettings, statCategories] = await Promise.all([
    getCachedProducts(),
    getCachedDeclinations(),
    getCachedStockSettings(),
    getCachedStatCategories(),
  ]);

  const products = filterArticlesVisiblesWithStatCats(allProducts, statCategories);

  return (
    <Suspense>
      <ProCatalogueClient
        initialData={{ products, declinations, stockSettings, statCategories }}
      />
    </Suspense>
  );
}
