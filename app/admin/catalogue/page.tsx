import {
  getCachedProducts,
  getCachedDeclinations,
  getCachedCategories,
  getCachedEvenements,
  getCachedStockSettings,
  getCachedStatCategories,
} from '@/lib/server-cache';
import AdminCatalogueClient from './AdminCatalogueClient';

export default async function AdminCataloguePage() {
  const [products, declinations, categories, evenements, stockSettings, statCats] = await Promise.all([
    getCachedProducts(),
    getCachedDeclinations(),
    getCachedCategories(),
    getCachedEvenements(),
    getCachedStockSettings(),
    getCachedStatCategories(),
  ]);

  return (
    <AdminCatalogueClient
      initialData={{ products, declinations, categories, evenements, stockSettings, statCats }}
    />
  );
}
