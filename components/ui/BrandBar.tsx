const brands = [
  { name: 'DécoTable', slug: 'decotable' },
  { name: 'Déguisez-Vous', slug: 'deguisez-vous' },
  { name: 'FêteMaison', slug: 'fetemaison' },
  { name: 'Festivitrines', slug: 'festivitrines' },
  { name: 'NorthPole', slug: 'northpole' },
];

interface BrandBarProps {
  className?: string;
}

export default function BrandBar({ className = '' }: BrandBarProps) {
  return (
    <div className={`flex items-center justify-center gap-6 py-3 px-4 bg-sv-grey-light rounded-xl ${className}`}>
      {brands.map((brand) => (
        <span
          key={brand.slug}
          className="text-sm font-semibold text-sv-primary hover:text-sv-orange transition-colors cursor-pointer whitespace-nowrap"
        >
          {brand.name}
        </span>
      ))}
    </div>
  );
}
