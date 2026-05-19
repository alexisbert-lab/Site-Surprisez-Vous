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

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s6_title">Protection des données personnelles (RGPD)</EditableText>
          </h2>
          <p>
            <EditableText page="mentions-legales" id="s6_content" multiline>{"Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles. Vous pouvez exercer ces droits en contactant le responsable du traitement à l'adresse contact@surprisez-vous.fr."}</EditableText>
          </p>
          <p className="mt-2">
            Pour toute demande d&apos;oubli numérique, veuillez utiliser notre{' '}
            <a href="/demande-oubli" className="text-sv-primary font-semibold hover:underline">formulaire dédié</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">
            <EditableText page="mentions-legales" id="s7_title">Cookies</EditableText>
          </h2>
          <p>
            <EditableText page="mentions-legales" id="s7_content">Ce site utilise des cookies techniques nécessaires au bon fonctionnement du service. Aucun cookie publicitaire ou de tracking n'est utilisé.</EditableText>
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
