import { Suspense } from 'react';
import {
  getCachedProducts,
  getCachedStatCategories,
  getCachedMarques,
  getCachedProductMarques,
  getCachedCategories,
} from '@/lib/server-cache';
import CatalogueClient from './CatalogueClient';

export default async function CataloguePage() {
  const [products, statCategories, marques, productMarques, categories] = await Promise.all([
    getCachedProducts(),
    getCachedStatCategories(),
    getCachedMarques(),
    getCachedProductMarques(),
    getCachedCategories(),
  ]);

  return (
    <Suspense>
      <CatalogueClient
        products={products}
        statCategories={statCategories}
        marques={marques}
        productMarques={productMarques}
        categories={categories}
      />
    </Suspense>
  );
}
