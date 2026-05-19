const variants = {
  attente: 'bg-amber-100 text-amber-800',
  valide: 'bg-emerald-100 text-emerald-800',
  annule: 'bg-red-100 text-red-800',
  nouveau: 'bg-secondary-light text-secondary',
  groupe: 'bg-primary-light text-primary',
  rupture: 'bg-red-100 text-red-700',
  retour_partiel: 'bg-amber-100 text-amber-700',
  retabli: 'bg-emerald-100 text-emerald-700',
  brouillon: 'bg-gray-100 text-gray-600',
  publie: 'bg-emerald-100 text-emerald-800',
  archive: 'bg-amber-100 text-amber-800',
  licence: 'bg-pink-100 text-pink-800',
  premium: 'bg-yellow-100 text-yellow-800',
  vip: 'bg-secondary-light text-secondary',
  actif: 'bg-emerald-100 text-emerald-800',
  inactif: 'bg-gray-100 text-gray-500',
  stock_faible: 'bg-orange-100 text-orange-700',
  fin_de_vie: 'bg-gray-200 text-gray-600',
} as const;

type BadgeVariant = keyof typeof variants;

export default function Badge({ variant, children }: { variant: BadgeVariant; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full shadow-sm ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function statusBadge(statut: string) {
  if (statut === 'Validee' || statut === 'Valide') return <Badge variant="valide">{statut}</Badge>;
  if (statut === 'Annulee' || statut === 'Refuse') return <Badge variant="annule">{statut}</Badge>;
  if (statut === 'Expediee') return <Badge variant="nouveau">{statut}</Badge>;
  if (statut === 'Livree') return <Badge variant="valide">{statut}</Badge>;
  return <Badge variant="attente">{statut}</Badge>;
}
