import {
  getCachedProducts,
  getCachedCategories,
  getCachedEvenements,
  getCachedStockSettings,
  getCachedStatCategories,
} from '@/lib/server-cache';
import AdminCatalogueClient from './AdminCatalogueClient';

export default async function AdminCataloguePage() {
  const [products, categories, evenements, stockSettings, statCats] = await Promise.all([
    getCachedProducts(),
    getCachedCategories(),
    getCachedEvenements(),
    getCachedStockSettings(),
    getCachedStatCategories(),
  ]);

  return (
    <AdminCatalogueClient
      initialData={{ products, categories, evenements, stockSettings, statCats }}
    />
  );
}
