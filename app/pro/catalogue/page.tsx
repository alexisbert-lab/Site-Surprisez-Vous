import { Suspense } from 'react';
import ProCatalogueClient from './ProCatalogueClient';
import {
  getCachedProducts,
  getCachedDeclinations,
  getCachedStockSettings,
  getCachedStatCategories,
} from '@/lib/server-cache';

export default async function ProCataloguePage() {
  const [products, declinations, stockSettings, statCategories] = await Promise.all([
    getCachedProducts(),
    getCachedDeclinations(),
    getCachedStockSettings(),
    getCachedStatCategories(),
  ]);

  return (
    <Suspense>
      <ProCatalogueClient
        initialData={{ products, declinations, stockSettings, statCategories }}
      />
    </Suspense>
  );
}
