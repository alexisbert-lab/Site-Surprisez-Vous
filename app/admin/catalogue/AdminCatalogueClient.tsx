'use client';

import { useState, useMemo, useEffect } from 'react';
import { filterArticlesVisibles, setProductVisibleOverride, getStatCategory, isEnRupture, isStockFaible, formatEan, type Product } from '@/lib/firestore/products';
import {
  createCategory, updateCategory, deleteCategory,
  saveDeclination, deleteDeclination,
  type Category, type Declination,
} from '@/lib/firestore/categories';
import { saveEvenement, deleteEvenement, type Evenement } from '@/lib/firestore/evenements';
import { saveStockSettings, type StockSettings } from '@/lib/firestore/settings';
import { toggleStatCategoryActif, getNiveau, getParentCode, saveStatCategories, type StatCategory } from '@/lib/firestore/stat-categories';
import { api } from '@/lib/api';
import { invalidateCached } from '@/lib/client-cache';
import Badge from '@/components/ui/Badge';
import Modal, { ModalTitle, ModalActions } from '@/components/ui/Modal';
import { thClass, tdClass, btnPrimSm, btnSecSm, btnDangerSm, inputSm, selectClass } from '@/lib/admin-styles';

interface InitialData {
  products: Product[];
  categories: Category[];
  declinations: Declination[];
  evenements: Evenement[];
  stockSettings: StockSettings;
  statCats: StatCategory[];
}

export default function AdminCatalogueClient({ initialData }: { initialData: InitialData }) {
  const [activeTab, setActiveTab] = useState<'articles' | 'categories' | 'declinaisons' | 'evenements' | 'codes-stats'>('articles');
  const [products, setProducts] = useState<Product[]>(() => filterArticlesVisibles(initialData.products));
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStat, setFilterStat] = useState('');
  const [categories, setCategories] = useState<Category[]>(initialData.categories);
  const [newCatName, setNewCatName] = useState('');
  const [newCatCodeStat, setNewCatCodeStat] = useState('');
  const [editCatId, setEditCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatCodeStat, setEditCatCodeStat] = useState('');
  const [modalCatId, setModalCatId] = useState<string | null>(null);
  const [declinations, setDeclinations] = useState<Declination[]>(initialData.declinations);
  const [decForm, setDecForm] = useState<{ id: string; designation: string; sous_titre: string; variants: { label: string; ref: string }[] }>({
    id: '', designation: '', sous_titre: '', variants: [],
  });
  const [evenements, setEvenements] = useState<Evenement[]>(initialData.evenements);
  const [evtForm, setEvtForm] = useState<{ id: string; nom: string; description: string; categories: string[]; actif: boolean }>({
    id: '', nom: '', description: '', categories: [], actif: true,
  });
  const [seuilStockFaible, setSeuilStockFaible] = useState(initialData.stockSettings.seuil_stock_faible);
  const [seuilInput, setSeuilInput] = useState(String(initialData.stockSettings.seuil_stock_faible));
  const [statCats, setStatCats] = useState<StatCategory[]>(initialData.statCats);
  const [expandedStatCode, setExpandedStatCode] = useState<string | null>(null);

  useEffect(() => {
    if (products.length > 0) return;
    api.getProducts().then((data) => setProducts(filterArticlesVisibles(data)));
    api.getCategories().then(setCategories);
    api.getDeclinations().then(setDeclinations);
    api.getEvenements().then(setEvenements);
    api.getStatCategories().then(setStatCats);
    api.getStockSettings().then((s) => { setSeuilStockFaible(s.seuil_stock_faible); setSeuilInput(String(s.seuil_stock_faible)); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const bust = (collection: string) => {
    invalidateCached(collection);
    api.invalidate(collection).catch(() => {});
  };

  const statCategories = useMemo(() => [...new Set(products.map((p) => getStatCategory(p.pdt_code_stat)).filter(Boolean))].sort(), [products]);
  const statCodes = useMemo(() => {
    const source = filterCat ? products.filter((p) => getStatCategory(p.pdt_code_stat) === filterCat) : products;
    return [...new Set(source.map((p) => p.pdt_code_stat).filter(Boolean))].sort();
  }, [products, filterCat]);

  const filteredProducts = useMemo(() => {
    let res = products;
    if (filterCat) res = res.filter((p) => getStatCategory(p.pdt_code_stat) === filterCat);
    if (filterStat) res = res.filter((p) => p.pdt_code_stat === filterStat);
    if (search) { const q = search.toLowerCase(); res = res.filter((p) => (p.pdt_reference ?? '').toLowerCase().includes(q) || (p.pdt_designation ?? '').toLowerCase().includes(q)); }
    return res;
  }, [products, filterCat, filterStat, search]);

  const findProductCategory = (product: Product): Category | undefined => {
    const code = product.pdt_code_stat?.toUpperCase() || '';
    if (!code) return undefined;
    return categories.find((c) => code.startsWith(c.code_stat));
  };

  const modalCat = categories.find((c) => c.id === modalCatId);
  const matchedProducts = modalCat ? products.filter((p) => (p.pdt_code_stat?.toUpperCase() || '').startsWith(modalCat.code_stat)) : [];

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !newCatCodeStat.trim()) return;
    const id = await createCategory(newCatName.trim(), newCatCodeStat.trim());
    bust('categories');
    setCategories((prev) => [...prev, { id, nom: newCatName.trim(), code_stat: newCatCodeStat.trim().toUpperCase() }]);
    setNewCatName(''); setNewCatCodeStat('');
  };
  const handleEditCategory = (cat: Category) => { setEditCatId(cat.id); setEditCatName(cat.nom); setEditCatCodeStat(cat.code_stat); };
  const handleSaveEditCategory = async () => {
    if (!editCatId || !editCatName.trim() || !editCatCodeStat.trim()) return;
    await updateCategory(editCatId, { nom: editCatName.trim(), code_stat: editCatCodeStat.trim() });
    bust('categories');
    setCategories((prev) => prev.map((c) => c.id === editCatId ? { ...c, nom: editCatName.trim(), code_stat: editCatCodeStat.trim().toUpperCase() } : c));
    setEditCatId(null);
  };
  const handleDeleteCategory = async (id: string) => { if (!confirm('Supprimer ce groupe ?')) return; await deleteCategory(id); bust('categories'); setCategories((prev) => prev.filter((c) => c.id !== id)); };

  const resetDecForm = () => setDecForm({ id: '', designation: '', sous_titre: '', variants: [] });
  const handleSaveDec = async () => {
    if (!decForm.designation.trim()) { alert('La designation est obligatoire.'); return; }
    const validVariants = decForm.variants.filter((v) => v.label && v.ref);
    if (!validVariants.length) { alert('Ajoutez au moins un variant.'); return; }
    const id = decForm.id || Math.random().toString(36).slice(2, 10);
    const dec: Declination = { id, designation: decForm.designation, sous_titre: decForm.sous_titre, variants: validVariants.map((v) => ({ label: v.label, ref: v.ref.toUpperCase() })) };
    await saveDeclination(dec);
    bust('declinations');
    setDeclinations((prev) => { const idx = prev.findIndex((d) => d.id === id); if (idx !== -1) { const next = [...prev]; next[idx] = dec; return next; } return [...prev, dec]; });
    resetDecForm();
  };
  const handleEditDec = (dec: Declination) => setDecForm({ id: dec.id, designation: dec.designation, sous_titre: dec.sous_titre || '', variants: dec.variants.map((v) => ({ ...v })) });
  const handleDeleteDec = async (id: string) => { if (!confirm('Supprimer cette declinaison ?')) return; await deleteDeclination(id); bust('declinations'); setDeclinations((prev) => prev.filter((d) => d.id !== id)); };

  const resetEvtForm = () => setEvtForm({ id: '', nom: '', description: '', categories: [], actif: true });
  const handleSaveEvt = async () => {
    if (!evtForm.nom.trim()) return;
    const maxOrdre = evenements.length > 0 ? Math.max(...evenements.map((e) => e.ordre)) + 1 : 0;
    const evt: Evenement = { id: evtForm.id, nom: evtForm.nom.trim(), description: evtForm.description, categories: evtForm.categories, actif: evtForm.actif, ordre: maxOrdre };
    const id = await saveEvenement(evt);
    bust('evenements');
    setEvenements((prev) => {
      const idx = prev.findIndex((e) => e.id === (evtForm.id || id));
      const updated = { ...evt, id: evtForm.id || id };
      if (idx !== -1) { const next = [...prev]; next[idx] = updated; return next; }
      return [...prev, updated];
    });
    resetEvtForm();
  };
  const handleEditEvt = (e: Evenement) => setEvtForm({ id: e.id, nom: e.nom, description: e.description || '', categories: e.categories || [], actif: e.actif });
  const handleDeleteEvt = async (id: string) => { if (!confirm('Supprimer cet événement ?')) return; await deleteEvenement(id); bust('evenements'); setEvenements((prev) => prev.filter((e) => e.id !== id)); };
  const toggleEvtCategory = (catId: string) => {
    setEvtForm((p) => ({ ...p, categories: p.categories.includes(catId) ? p.categories.filter((c) => c !== catId) : [...p.categories, catId] }));
  };

  const handleSyncCache = async (tags: string[]) => {
    tags.forEach(bust);
    await fetch('/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
  };

  const tabs = [
    { key: 'articles' as const, label: 'Articles' },
    { key: 'codes-stats' as const, label: 'Codes stats' },
    { key: 'categories' as const, label: 'Catégories' },
    { key: 'declinaisons' as const, label: 'Déclinaisons' },
    { key: 'evenements' as const, label: 'Événements' },
  ];

  return (
    <>
      <h1 className="text-xl font-bold mb-5">Catalogue &mdash; PIM</h1>

      <div className="flex mb-5 border-b-2 border-gray-200">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 text-sm border-b-2 -mb-[2px] transition-colors cursor-pointer ${
              activeTab === tab.key ? 'text-primary font-bold border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'articles' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <input type="text" placeholder="Ref, designation..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-56 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <label className="text-sm font-semibold text-gray-600">Catégorie :</label>
            <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); setFilterStat(''); }} className={selectClass}>
              <option value="">-- Toutes --</option>
              {statCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="text-sm font-semibold text-gray-600">Code stat :</label>
            <select value={filterStat} onChange={(e) => setFilterStat(e.target.value)} className={selectClass}>
              <option value="">-- Tous --</option>
              {statCodes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-sm text-gray-400">{filteredProducts.length} article(s)</span>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-xs text-gray-500">Seuil stock faible :</label>
              <input type="number" min="1" value={seuilInput} onChange={(e) => setSeuilInput(e.target.value)}
                className="w-16 px-2 py-1 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button className={btnPrimSm} onClick={async () => {
                const val = parseInt(seuilInput, 10);
                if (!val || val < 1) return;
                setSeuilStockFaible(val);
                await saveStockSettings({ seuil_stock_faible: val });
                bust('stock-settings');
              }}>OK</button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse text-sm">
              <thead><tr className="bg-gray-50">
                <th className={thClass}>Référence</th><th className={thClass}>Désignation</th><th className={thClass}>EAN</th>
                <th className={thClass}>Code stat</th><th className={thClass}>Groupe</th>
                <th className={thClass}>Prix vente</th><th className={thClass}>Statut stock</th>
              </tr></thead>
              <tbody>
                {filteredProducts.map((p, i) => {
                  const cat = findProductCategory(p);
                  const rupture = isEnRupture(p);
                  const faible = isStockFaible(p, seuilStockFaible);
                  return (
                    <tr key={p.pdt_reference ?? i} className={`border-b border-gray-100 transition-colors ${rupture ? 'bg-red-50/50' : 'hover:bg-primary-light/50'}`}>
                      <td className={`${tdClass} font-mono text-xs font-semibold`}>{p.pdt_reference}</td>
                      <td className={tdClass}>
                        {p.pdt_designation}
                        {p.pdt_etat === 'N' && <span className="ml-1.5"><Badge variant="fin_de_vie">Fin de vie</Badge></span>}
                      </td>
                      <td className={`${tdClass} font-mono text-xs text-gray-400`}>{formatEan(p.pdt_ean) || '—'}</td>
                      <td className={tdClass}>{p.pdt_code_stat || '\u2014'}</td>
                      <td className={tdClass}>{cat ? <Badge variant="groupe">{cat.nom}</Badge> : <span className="text-gray-400 italic">{'\u2014'}</span>}</td>
                      <td className={`${tdClass} font-mono text-xs font-semibold text-primary`}>
                        {p.prix_vente ? `${p.prix_vente.toFixed(2)} \u20ac` : '\u2014'}
                      </td>
                      <td className={tdClass}>
                        {rupture ? <Badge variant="rupture">Rupture</Badge>
                          : faible ? <Badge variant="stock_faible">Stock faible</Badge>
                          : <span className="text-emerald-600 text-xs font-semibold">OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex gap-2 items-center mb-4">
            <input type="text" placeholder="Nom du groupe (ex : Ballons, Mariage...)" value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)} className={inputSm} />
            <input type="text" placeholder="Code stat (ex : BF, NO...)" value={newCatCodeStat}
              onChange={(e) => setNewCatCodeStat(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              className="w-40 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button className={btnPrimSm} onClick={handleAddCategory}>Ajouter</button>
          </div>
          <p className="text-xs text-gray-400 mb-4">Les articles sont automatiquement rattachés à une catégorie si leur code statistique commence par le préfixe défini.</p>
          {categories.length === 0 ? <p className="text-gray-400 italic text-sm">Aucun groupe créé.</p> : (
            <div className="space-y-2">
              {categories.map((cat) => {
                const count = products.filter((p) => (p.pdt_code_stat?.toUpperCase() || '').startsWith(cat.code_stat)).length;
                const isEditing = editCatId === cat.id;
                return (
                  <div key={cat.id} className="flex justify-between items-center px-3 py-2.5 border border-gray-200 rounded-lg text-sm">
                    {isEditing ? (
                      <div className="flex gap-2 items-center flex-1 mr-2">
                        <input type="text" value={editCatName} onChange={(e) => setEditCatName(e.target.value)} className={inputSm} />
                        <input type="text" value={editCatCodeStat} onChange={(e) => setEditCatCodeStat(e.target.value.toUpperCase())}
                          className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold">{cat.nom}</span>
                        <span className="ml-2 font-mono text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{cat.code_stat}</span>
                        <span className="ml-2 text-xs font-bold text-primary">{count} article(s)</span>
                      </div>
                    )}
                    <div className="space-x-1 flex-shrink-0">
                      {isEditing ? (
                        <>
                          <button className={btnPrimSm} onClick={handleSaveEditCategory}>Enregistrer</button>
                          <button className={btnSecSm} onClick={() => setEditCatId(null)}>Annuler</button>
                        </>
                      ) : (
                        <>
                          <button className={btnSecSm} onClick={() => setModalCatId(cat.id)}>Voir articles</button>
                          <button className={btnSecSm} onClick={() => handleEditCategory(cat)}>Modifier</button>
                          <button className={btnDangerSm} onClick={() => handleDeleteCategory(cat.id)}>Supprimer</button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'declinaisons' && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
            <h2 className="text-[15px] font-bold mb-4 pb-3 border-b border-gray-200">{decForm.id ? `Modifier : ${decForm.designation}` : 'Nouvelle déclinaison'}</h2>
            <div className="flex gap-2 mb-3"><input type="text" placeholder="Désignation (ex : Ballon Métallique Multicolore)" value={decForm.designation} onChange={(e) => setDecForm((p) => ({ ...p, designation: e.target.value }))} className={inputSm} /></div>
            <div className="flex gap-2 mb-4"><input type="text" placeholder="Sous-titre (ex : Tous les chiffres)" value={decForm.sous_titre} onChange={(e) => setDecForm((p) => ({ ...p, sous_titre: e.target.value }))} className={inputSm} /></div>
            {decForm.variants.map((v, i) => (
              <div key={i} className="flex gap-2 items-center mb-2">
                <input type="text" className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Label" value={v.label}
                  onChange={(e) => { const variants = [...decForm.variants]; variants[i] = { ...variants[i], label: e.target.value }; setDecForm((p) => ({ ...p, variants })); }} />
                <input type="text" className="w-40 px-2 py-1.5 border border-gray-300 rounded-lg text-sm" placeholder="Référence" value={v.ref}
                  onChange={(e) => { const variants = [...decForm.variants]; variants[i] = { ...variants[i], ref: e.target.value }; setDecForm((p) => ({ ...p, variants })); }} />
                <button className={btnDangerSm} onClick={() => setDecForm((p) => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }))}>&#x2715;</button>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <button className={btnSecSm} onClick={() => setDecForm((p) => ({ ...p, variants: [...p.variants, { label: '', ref: '' }] }))}>+ Ajouter variant</button>
              <button className={btnPrimSm} onClick={handleSaveDec}>Enregistrer</button>
              {decForm.id && <button className={btnSecSm} onClick={resetDecForm}>Annuler</button>}
            </div>
          </div>
          {declinations.length === 0 ? <p className="text-gray-400 italic text-sm">Aucune déclinaison configurée.</p> : (
            <div className="space-y-2">
              {declinations.map((dec) => (
                <div key={dec.id} className="flex justify-between items-center px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm">
                  <div>
                    <div className="font-semibold">{dec.designation}</div>
                    <div className="text-xs text-gray-400">{dec.sous_titre || ''} &mdash; {dec.variants.length} variant(s)</div>
                  </div>
                  <div className="space-x-1">
                    <button className={btnSecSm} onClick={() => handleEditDec(dec)}>Modifier</button>
                    <button className={btnDangerSm} onClick={() => handleDeleteDec(dec.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'evenements' && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-5">
            <h2 className="text-[15px] font-bold mb-4 pb-3 border-b border-gray-200">{evtForm.id ? `Modifier : ${evtForm.nom}` : 'Nouvel événement'}</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Nom de l'événement (ex : Noël, Halloween...)" value={evtForm.nom} onChange={(e) => setEvtForm((p) => ({ ...p, nom: e.target.value }))} className={inputSm} />
            </div>
            <div className="flex gap-2 mb-3">
              <input type="text" placeholder="Description (optionnel)" value={evtForm.description} onChange={(e) => setEvtForm((p) => ({ ...p, description: e.target.value }))} className={inputSm} />
            </div>
            <label className="flex items-center gap-2 text-sm mb-3">
              <input type="checkbox" checked={evtForm.actif} onChange={(e) => setEvtForm((p) => ({ ...p, actif: e.target.checked }))} /> Actif
            </label>
            {categories.length > 0 && (
              <div className="mb-3">
                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Catégories associées :</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <label key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm cursor-pointer transition-colors ${
                      evtForm.categories.includes(cat.id) ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                      <input type="checkbox" checked={evtForm.categories.includes(cat.id)} onChange={() => toggleEvtCategory(cat.id)} className="hidden" />
                      {cat.nom}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button className={btnPrimSm} onClick={handleSaveEvt}>Enregistrer</button>
              {evtForm.id && <button className={btnSecSm} onClick={resetEvtForm}>Annuler</button>}
            </div>
          </div>
          {evenements.length === 0 ? <p className="text-gray-400 italic text-sm">Aucun événement créé.</p> : (
            <div className="space-y-2">
              {evenements.map((evt) => (
                <div key={evt.id} className="flex justify-between items-center px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white shadow-sm">
                  <div>
                    <div className="font-semibold">
                      {evt.nom}
                      <span className="ml-2"><Badge variant={evt.actif ? 'actif' : 'inactif'}>{evt.actif ? 'Actif' : 'Inactif'}</Badge></span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {evt.categories.length} catégorie(s) associée(s)
                      {evt.description && ` — ${evt.description}`}
                    </div>
                  </div>
                  <div className="space-x-1">
                    <button className={btnSecSm} onClick={() => handleEditEvt(evt)}>Modifier</button>
                    <button className={btnDangerSm} onClick={() => handleDeleteEvt(evt.id)}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'codes-stats' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <button onClick={() => handleSyncCache(['stat-categories', 'products'])} className={btnSecSm}>
              Sync cache
            </button>
          </div>
          {statCats.length === 0 ? <p className="text-gray-400 italic text-sm">Aucun code statistique. Lancez la synchronisation depuis la page Drive.</p> : (() => {
            const inactiveSet = new Set(statCats.filter((c) => !c.actif).map((c) => c.code));
            const isHidden = (code: string) => {
              const p = [code.slice(0, 2), code.slice(0, 4), code].filter((s, i, a) => s && a.indexOf(s) === i);
              return p.some((x) => inactiveSet.has(x));
            };
            const productsForCode = (code: string) => products.filter((p) => (p.pdt_code_stat || '').startsWith(code));
            const toggleActif = async (code: string, current: boolean) => {
              const next = !current;
              let toUpdate: string[];
              if (next) {
                const ancestors = [code.slice(0, 2), code.slice(0, 4), code]
                  .filter((s, i, a) => s && a.indexOf(s) === i);
                toUpdate = statCats.filter((c) => ancestors.includes(c.code)).map((c) => c.code);
              } else {
                toUpdate = statCats.filter((c) => c.code === code || c.code.startsWith(code)).map((c) => c.code);
              }
              await Promise.all(toUpdate.map((c) => toggleStatCategoryActif(c, next)));
              setStatCats((prev) => prev.map((c) => toUpdate.includes(c.code) ? { ...c, actif: next } : c));
              setExpandedStatCode(null);
              await handleSyncCache(['stat-categories', 'products']);
            };
            const activateCascade = async (code: string) => {
              const toUpdate = statCats.filter((c) => c.code === code || c.code.startsWith(code)).map((c) => c.code);
              await Promise.all(toUpdate.map((c) => toggleStatCategoryActif(c, true)));
              setStatCats((prev) => prev.map((c) => toUpdate.includes(c.code) ? { ...c, actif: true } : c));
              setExpandedStatCode(null);
              await handleSyncCache(['stat-categories', 'products']);
            };
            const toggleOverride = async (prod: Product) => {
              const next = !prod.visible_override;
              await setProductVisibleOverride(prod.pdt_reference, next);
              bust('products');
              setProducts((prev) => prev.map((p) => p.pdt_reference === prod.pdt_reference ? { ...p, visible_override: next } : p));
            };
            const renderProductList = (code: string) => {
              const prods = productsForCode(code);
              if (!prods.length) return <p className="text-xs text-gray-400 italic px-3 py-2">Aucun produit pour ce code.</p>;
              return (
                <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                  {prods.map((p) => (
                    <div key={p.pdt_reference} className="flex items-center justify-between px-3 py-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-primary mr-2">{p.pdt_reference}</span>
                        <span className="text-xs text-gray-600">{p.pdt_designation}</span>
                      </div>
                      <button onClick={() => toggleOverride(p)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${p.visible_override ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {p.visible_override ? '✓ Exception' : 'Masqué'}
                      </button>
                    </div>
                  ))}
                </div>
              );
            };
            const ToggleBtn = ({ code, actif, size = 'sm' }: { code: string; actif: boolean; size?: 'lg' | 'sm' }) => (
              <button onClick={() => toggleActif(code, actif)}
                className={`rounded-full font-bold cursor-pointer transition-colors ${size === 'lg' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-xs'} ${actif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                {actif ? 'Actif' : 'Inactif'}
              </button>
            );
            const ExpandBtn = ({ code, hidden }: { code: string; hidden: boolean }) => {
              if (!hidden) return null;
              const count = productsForCode(code).length;
              if (!count) return null;
              const isOpen = expandedStatCode === code;
              return (
                <button onClick={() => setExpandedStatCode(isOpen ? null : code)}
                  className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 hover:bg-orange-200 cursor-pointer transition-colors">
                  {count} produit{count > 1 ? 's' : ''} masqué{count > 1 ? 's' : ''} {isOpen ? '▲' : '▼'}
                </button>
              );
            };
            return (
              <div className="space-y-1">
                {statCats.filter((c) => c.niveau === 1).sort((a, b) => a.code.localeCompare(b.code)).map((cat1) => {
                  const children2 = statCats.filter((c) => c.niveau === 2 && c.parent === cat1.code).sort((a, b) => a.code.localeCompare(b.code));
                  const h1 = isHidden(cat1.code);
                  return (
                    <div key={cat1.code} className="border border-gray-200 rounded-lg">
                      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg ${h1 ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center flex-wrap gap-1 min-w-0">
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">{cat1.code}</span>
                          <span className="font-semibold text-sm">{cat1.designation}</span>
                          <ExpandBtn code={cat1.code} hidden={h1} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {h1 && <button onClick={() => activateCascade(cat1.code)}
                            className="px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                            Tout activer
                          </button>}
                          <ToggleBtn code={cat1.code} actif={cat1.actif} size="lg" />
                        </div>
                      </div>
                      {expandedStatCode === cat1.code && <div className="border-t border-orange-200 bg-orange-50/40">{renderProductList(cat1.code)}</div>}
                      {children2.length > 0 && (
                        <div className="pl-5 py-1">
                          {children2.map((cat2) => {
                            const children3 = statCats.filter((c) => c.niveau === 3 && c.parent === cat2.code).sort((a, b) => a.code.localeCompare(b.code));
                            const h2 = isHidden(cat2.code);
                            return (
                              <div key={cat2.code}>
                                <div className={`flex items-center justify-between px-3 py-1.5 border-l-2 ${h2 ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`}>
                                  <div className="flex items-center flex-wrap gap-1 min-w-0">
                                    <span className="font-mono text-xs px-1.5 py-0.5 bg-gray-100 rounded">{cat2.code}</span>
                                    <span className="text-sm">{cat2.designation}</span>
                                    <ExpandBtn code={cat2.code} hidden={h2} />
                                  </div>
                                  <ToggleBtn code={cat2.code} actif={cat2.actif} />
                                </div>
                                {expandedStatCode === cat2.code && <div className="border-t border-orange-200 bg-orange-50/40 ml-4">{renderProductList(cat2.code)}</div>}
                                {children3.length > 0 && (
                                  <div className="pl-5">
                                    {children3.map((cat3) => {
                                      const h3 = isHidden(cat3.code);
                                      return (
                                        <div key={cat3.code}>
                                          <div className={`flex items-center justify-between px-3 py-1 border-l-2 ${h3 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}`}>
                                            <div className="flex items-center flex-wrap gap-1 min-w-0">
                                              <span className="font-mono text-[10px] px-1 py-0.5 bg-gray-50 rounded">{cat3.code}</span>
                                              <span className="text-xs text-gray-600">{cat3.designation}</span>
                                              <ExpandBtn code={cat3.code} hidden={h3} />
                                            </div>
                                            <ToggleBtn code={cat3.code} actif={cat3.actif} />
                                          </div>
                                          {expandedStatCode === cat3.code && <div className="border-t border-orange-200 bg-orange-50/40 ml-4">{renderProductList(cat3.code)}</div>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      <Modal open={!!modalCatId && !!modalCat} onClose={() => setModalCatId(null)} size="xl">
        {modalCat && (
          <>
            <ModalTitle>Groupe : {modalCat.nom} <span className="font-mono text-sm font-normal ml-2 px-2 py-0.5 bg-gray-100 rounded">{modalCat.code_stat}*</span></ModalTitle>
            <p className="text-sm text-gray-500 mb-3">Articles dont le code statistique commence par <strong className="font-mono">{modalCat.code_stat}</strong> ({matchedProducts.length} résultat{matchedProducts.length !== 1 ? 's' : ''})</p>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {matchedProducts.length === 0 ? (
                <div className="p-3 text-gray-400 italic text-sm text-center">Aucun article ne correspond au préfixe {modalCat.code_stat}</div>
              ) : matchedProducts.map((p) => (
                <div key={p.pdt_reference} className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100 last:border-b-0 text-sm">
                  <span><strong className="font-mono text-xs">{p.pdt_reference}</strong> {p.pdt_designation}</span>
                  <span className="font-mono text-xs text-gray-400">{p.pdt_code_stat}</span>
                </div>
              ))}
            </div>
            <ModalActions><button className={btnSecSm} onClick={() => setModalCatId(null)}>Fermer</button></ModalActions>
          </>
        )}
      </Modal>
    </>
  );
}
