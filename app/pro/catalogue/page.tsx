import { Suspense } from 'react';
import ProCatalogueClient from './ProCatalogueClient';
import {
  getCachedProducts,
  getCachedStockSettings,
  getCachedStatCategories,
  getCachedAttributeRegistry,
  getCachedAttributeValues,
  getCachedProductAttributes,
} from '@/lib/server-cache';

export default async function ProCataloguePage() {
  const [
    products, stockSettings, statCategories,
    attributeDefs, attributeValues, productAttributes,
  ] = await Promise.all([
    getCachedProducts(),
    getCachedStockSettings(),
    getCachedStatCategories(),
    getCachedAttributeRegistry(),
    getCachedAttributeValues(),
    getCachedProductAttributes(),
  ]);

  return (
    <Suspense>
      <ProCatalogueClient
        initialData={{
          products, stockSettings, statCategories,
          attributeDefs, attributeValues, productAttributes,
        }}
      />
    </Suspense>
  );
}
