import { Suspense } from 'react';
import ProCatalogueClient from './ProCatalogueClient';
import {
  getCachedProducts,
  getCachedDeclinations,
  getCachedStockSettings,
  getCachedStatCategories,
  getCachedCatalogueSettings,
} from '@/lib/server-cache';

export default async function ProCataloguePage() {
  const [products, declinations, stockSettings, statCategories, catalogue] = await Promise.all([
    getCachedProducts(),
    getCachedDeclinations(),
    getCachedStockSettings(),
    getCachedStatCategories(),
    getCachedCatalogueSettings(),
  ]);

  return (
    <Suspense>
      <ProCatalogueClient
        initialData={{ products, declinations, stockSettings, statCategories, catalogue }}
      />
    </Suspense>
  );
}
