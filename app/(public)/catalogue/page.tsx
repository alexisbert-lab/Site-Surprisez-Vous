import { Suspense } from 'react';
import {
  getCachedPublicProducts,
  getCachedStatCategories,
  getCachedMarques,
  getCachedProductMarques,
  getCachedAttributeRegistry,
  getCachedAttributeValues,
  getCachedProductAttributes,
} from '@/lib/server-cache';
import CatalogueClient from './CatalogueClient';

export default async function CataloguePage() {
  const [
    products, statCategories, marques, productMarques,
    attributeDefs, attributeValues, productAttributes,
  ] = await Promise.all([
    getCachedPublicProducts(),
    getCachedStatCategories(),
    getCachedMarques(),
    getCachedProductMarques(),
    getCachedAttributeRegistry(),
    getCachedAttributeValues(),
    getCachedProductAttributes(),
  ]);

  return (
    <Suspense>
      <CatalogueClient
        products={products}
        statCategories={statCategories}
        marques={marques}
        productMarques={productMarques}
        attributeDefs={attributeDefs}
        attributeValues={attributeValues}
        productAttributes={productAttributes}
      />
    </Suspense>
  );
}
