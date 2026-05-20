import Link from 'next/link';

const sections = [
  {
    title: 'Pages principales',
    links: [
      { href: '/', label: 'Accueil' },
      { href: '/catalogue', label: 'Catalogue produits' },
      { href: '/fiche-technique', label: 'Fiches techniques' },
      { href: '/univers', label: 'Nos univers' },
      { href: '/showroom', label: 'Showroom / Présentation' },
      { href: '/revendeur', label: 'Espace revendeurs' },
    ],
  },
  {
    title: 'Espace pro',
    links: [
      { href: '/espace-pro', label: 'Accès espace pro' },
      { href: '/connexion', label: 'Connexion' },
      { href: '/pro/inscription', label: 'Demande d\'accès pro' },
      { href: '/pro/contact', label: 'Contactez-nous' },
    ],
  },
  {
    title: 'Informations légales',
    links: [
      { href: '/mentions-legales', label: 'Mentions légales' },
      { href: '/mentions-legales#protection-donnees', label: 'Politique de confidentialité (RGPD)' },
      { href: '/pro/cgv', label: 'Conditions Générales de Vente' },
      { href: '/demande-oubli', label: 'Demande d\'oubli numérique' },
    ],
  },
];

export default function PlanDuSitePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-sv-primary mb-6 font-[family-name:var(--font-heading)]">
        Plan du site
      </h1>
      <div className="bg-white border border-border rounded-xl p-6 grid sm:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-3">{section.title}</h2>
            <ul className="flex flex-col gap-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-sv-primary hover:underline">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
