import Breadcrumb from '@/components/ui/Breadcrumb';
import Link from 'next/link';

interface PlaceholderPageProps {
  title: string;
  breadcrumbItems?: { label: string; href?: string }[];
}

export default function PlaceholderPage({ title, breadcrumbItems }: PlaceholderPageProps) {
  return (
    <div className="max-w-xl mx-auto text-center">
      {breadcrumbItems && (
        <Breadcrumb items={breadcrumbItems} className="mb-6 justify-center" />
      )}
      <div className="py-16">
        <div className="w-16 h-16 bg-sv-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-sv-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
          {title}
        </h1>
        <p className="text-sm text-ink-secondary mb-6">
          Cette fonctionnalité sera bientôt disponible.
        </p>
        <Link
          href="/pro/dashboard"
          className="inline-block px-5 py-2.5 bg-sv-primary text-white text-sm font-semibold rounded-xl hover:bg-sv-primary-dark transition-colors"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
