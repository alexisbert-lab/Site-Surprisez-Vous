import { Suspense } from 'react';
import ProCatalogueClient from './ProCatalogueClient';
import {
  getCachedProducts,
  getCachedStockSettings,
  getCachedStatCategories,
  getCachedCatalogueSettings,
  getCachedAttributeRegistry,
  getCachedAttributeValues,
  getCachedProductAttributes,
  getCachedProductGroups,
} from '@/lib/server-cache';

export default async function ProCataloguePage() {
  const [
    products, stockSettings, statCategories, catalogue,
    attributeDefs, attributeValues, productAttributes, productGroups,
  ] = await Promise.all([
    getCachedProducts(),
    getCachedStockSettings(),
    getCachedStatCategories(),
    getCachedCatalogueSettings(),
    getCachedAttributeRegistry(),
    getCachedAttributeValues(),
    getCachedProductAttributes(),
    getCachedProductGroups(),
  ]);

  return (
    <Suspense>
      <ProCatalogueClient
        initialData={{
          products, stockSettings, statCategories, catalogue,
          attributeDefs, attributeValues, productAttributes, productGroups,
        }}
      />
    </Suspense>
  );
}
