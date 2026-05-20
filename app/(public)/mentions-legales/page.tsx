'use client';

import EditableText from '@/components/editable/EditableText';
import EditableLink from '@/components/editable/EditableLink';

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-sv-primary mb-6 font-[family-name:var(--font-heading)]">
        <EditableText page="mentions-legales" id="h1">Mentions légales</EditableText>
      </h1>

      <div className="bg-white border border-border rounded-xl p-6 space-y-6 text-sm text-ink leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s1_title">Éditeur du site</EditableText>
          </h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            <EditableText page="mentions-legales" id="s1_content" multiline>{`Le site surprisez-vous.fr est édité par la société Surprisez-Vous.\nForme juridique : \nCapital social : \nAdresse : \nTéléphone : \nEmail : \nSIRET : \nRCS : \nN° TVA intracommunautaire :`}</EditableText>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s2_title">Directeur de publication</EditableText>
          </h2>
          <p>
            <EditableText page="mentions-legales" id="s2_content"> </EditableText>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s3_title">Hébergeur</EditableText>
          </h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            <EditableText page="mentions-legales" id="s3_content" multiline>{`Firebase Hosting — Google LLC\n1600 Amphitheatre Parkway, Mountain View, CA 94043, États-Unis`}</EditableText>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s4_title">Conditions générales de vente</EditableText>
          </h2>
          <p>
            <EditableText page="mentions-legales" id="s4_content">Les conditions générales de vente applicables sont consultables sur la page</EditableText>
            {' '}
            <EditableLink page="mentions-legales" id="s4_link_cgv" href="/pro/cgv" className="text-sv-primary font-semibold hover:underline">
              CGV
            </EditableLink>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s5_title">Médiation de la consommation</EditableText>
          </h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            <EditableText page="mentions-legales" id="s5_content" multiline>{`Conformément aux articles L.616-1 et R.616-1 du code de la consommation, nous proposons un dispositif de médiation de la consommation. L'entité de médiation retenue est :\nNom du médiateur : \nSite : \nAdresse :`}</EditableText>
          </p>
        </section>

        <section id="protection-donnees">
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s6_title">Protection des données personnelles (RGPD)</EditableText>
          </h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            <EditableText page="mentions-legales" id="s6_content" multiline>{`Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez des droits suivants :\n• Droit d'accès (art. 15) : obtenir une copie de vos données\n• Droit de rectification (art. 16) : corriger des données inexactes\n• Droit à l'effacement (art. 17) : demander la suppression de vos données\n• Droit à la limitation du traitement (art. 18) : restreindre l'utilisation de vos données\n• Droit à la portabilité (art. 20) : recevoir vos données dans un format structuré\n• Droit d'opposition (art. 21) : vous opposer au traitement de vos données\n\nBase légale du traitement : exécution du contrat (gestion des commandes), intérêt légitime (amélioration du service), consentement (newsletter).\n\nDurée de conservation : vos données sont conservées pendant la durée de la relation commerciale et 3 ans après le dernier contact, sauf obligation légale contraire.\n\nPour exercer vos droits, contactez le responsable du traitement : contact@surprisez-vous.fr\n\nEn cas de réponse insatisfaisante, vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr) — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — conformément à l'article 77 du RGPD.`}</EditableText>
          </p>
          <p className="mt-2">
            Pour toute demande d&apos;oubli numérique, veuillez utiliser notre{' '}
            <a href="/demande-oubli" className="text-sv-primary font-semibold hover:underline">formulaire dédié</a>.
          </p>
        </section>

        <section id="cookies">
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s7_title">Cookies</EditableText>
          </h2>
          <p style={{ whiteSpace: 'pre-line' }}>
            <EditableText page="mentions-legales" id="s7_content" multiline>{`Ce site utilise deux catégories de cookies :\n\n• Cookies strictement nécessaires : authentification, session de navigation. Aucun consentement requis.\n• Cookies analytiques : Google Analytics (via Firebase Analytics) pour mesurer l'audience et améliorer le service. Ces cookies ne sont activés qu'après votre consentement explicite.\n\nVous pouvez accepter ou refuser les cookies analytiques via le bandeau affiché lors de votre première visite. Votre choix est mémorisé et peut être modifié en vidant les données de votre navigateur.`}</EditableText>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s8_title">Propriété intellectuelle</EditableText>
          </h2>
          <p>
            <EditableText page="mentions-legales" id="s8_content">{"L'ensemble du contenu du site (textes, images, graphismes, logo, icônes) est la propriété exclusive de Surprisez-Vous, sauf mentions contraires. Toute reproduction, même partielle, est interdite sans autorisation préalable."}</EditableText>
          </p>
        </section>
      </div>
    </div>
  );
}
