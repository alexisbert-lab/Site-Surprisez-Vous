import { Suspense } from 'react';
import {
  getCachedProducts,
  getCachedStatCategories,
  getCachedMarques,
  getCachedProductMarques,
} from '@/lib/server-cache';
import CatalogueClient from './CatalogueClient';

export default async function CataloguePage() {
  const [products, statCategories, marques, productMarques] = await Promise.all([
    getCachedProducts(),
    getCachedStatCategories(),
    getCachedMarques(),
    getCachedProductMarques(),
  ]);

  return (
    <Suspense>
      <CatalogueClient
        products={products}
        statCategories={statCategories}
        marques={marques}
        productMarques={productMarques}
      />
    </Suspense>
  );
}
