import { Suspense } from 'react';
import ProCatalogueClient from './ProCatalogueClient';

export default function ProCataloguePage() {
  return (
    <Suspense>
      <ProCatalogueClient
        initialData={{ products: [], declinations: [], stockSettings: { seuil_stock_faible: 20 }, statCategories: [] }}
      />
    </Suspense>
  );
}
