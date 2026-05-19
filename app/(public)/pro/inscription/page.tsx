'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import EditableText from '@/components/editable/EditableText';

interface FormData {
  raisonSociale: string;
  siret: string;
  tvaIntra: string;
  enseigne: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  telephone: string;
  fax: string;
  civilite: string;
  nom: string;
  prenom: string;
  email: string;
  commentaire: string;
  cgvAccepted: boolean;
}

const initialData: FormData = {
  raisonSociale: '', siret: '', tvaIntra: '', enseigne: '',
  adresse: '', codePostal: '', ville: '', pays: 'France',
  telephone: '', fax: '',
  civilite: '', nom: '', prenom: '', email: '',
  commentaire: '', cgvAccepted: false,
};

export default function InscriptionProPage() {
  const [form, setForm] = useState<FormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const update = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.raisonSociale.trim()) errs.raisonSociale = 'Requis';
    if (!form.siret.trim() || !/^\d{14}$/.test(form.siret.replace(/\s/g, ''))) errs.siret = 'SIRET invalide (14 chiffres)';
    if (!form.adresse.trim()) errs.adresse = 'Requis';
    if (!form.codePostal.trim() || !/^\d{5}$/.test(form.codePostal)) errs.codePostal = 'Code postal invalide';
    if (!form.ville.trim()) errs.ville = 'Requis';
    if (!form.telephone.trim()) errs.telephone = 'Requis';
    if (!form.nom.trim()) errs.nom = 'Requis';
    if (!form.prenom.trim()) errs.prenom = 'Requis';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!form.cgvAccepted) errs.cgvAccepted = 'Vous devez accepter les CGV';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // TODO: Appel Cloud Function pour traitement serveur
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } catch {
      alert('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-ink mb-2">
          <EditableText page="pro-inscription" id="success_title">Demande envoyée !</EditableText>
        </h2>
        <p className="text-sm text-ink-secondary">
          <EditableText page="pro-inscription" id="success_text">Votre demande d&apos;inscription a bien été enregistrée. Notre équipe commerciale vous recontactera dans les 48h.</EditableText>
        </p>
      </div>
    );
  }

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/20 ${errors[field] ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-sv-primary'}`;

  const selectClass = (field: keyof FormData) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sv-primary/20 appearance-none bg-white cursor-pointer ${errors[field] ? 'border-red-400 focus:border-red-400' : 'border-border focus:border-sv-primary'}`;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
        <EditableText page="pro-inscription" id="h1">Inscription Professionnelle</EditableText>
      </h1>
      <p className="text-sm text-ink-secondary mb-8">
        <EditableText page="pro-inscription" id="intro">Remplissez le formulaire ci-dessous pour demander l&apos;ouverture d&apos;un compte professionnel.</EditableText>
      </p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Détails Entreprise */}
        <fieldset className="space-y-4">
          <legend className="text-base font-bold text-ink mb-2">
            <EditableText page="pro-inscription" id="section_entreprise">Détails Entreprise</EditableText>
          </legend>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Raison sociale *</label>
              <input value={form.raisonSociale} onChange={(e) => update('raisonSociale', e.target.value)} placeholder="SURPRISEZ-VOUS" className={inputClass('raisonSociale')} />
              {errors.raisonSociale && <p className="text-xs text-red-500 mt-1">{errors.raisonSociale}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">SIRET *</label>
              <input value={form.siret} onChange={(e) => update('siret', e.target.value)} placeholder="14 chiffres" className={inputClass('siret')} />
              {errors.siret && <p className="text-xs text-red-500 mt-1">{errors.siret}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">N° TVA Intracommunautaire</label>
              <input value={form.tvaIntra} onChange={(e) => update('tvaIntra', e.target.value)} className={inputClass('tvaIntra')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Enseigne</label>
              <input value={form.enseigne} onChange={(e) => update('enseigne', e.target.value)} className={inputClass('enseigne')} />
            </div>
          </div>
        </fieldset>

        {/* Coordonnées Entreprise */}
        <fieldset className="space-y-4">
          <legend className="text-base font-bold text-ink mb-2">
            <EditableText page="pro-inscription" id="section_coordonnees">Coordonnées Entreprise</EditableText>
          </legend>
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">Adresse *</label>
            <input value={form.adresse} onChange={(e) => update('adresse', e.target.value)} className={inputClass('adresse')} />
            {errors.adresse && <p className="text-xs text-red-500 mt-1">{errors.adresse}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Code postal *</label>
              <input value={form.codePostal} onChange={(e) => update('codePostal', e.target.value)} className={inputClass('codePostal')} />
              {errors.codePostal && <p className="text-xs text-red-500 mt-1">{errors.codePostal}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Ville *</label>
              <input value={form.ville} onChange={(e) => update('ville', e.target.value)} className={inputClass('ville')} />
              {errors.ville && <p className="text-xs text-red-500 mt-1">{errors.ville}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Pays</label>
              <input value={form.pays} onChange={(e) => update('pays', e.target.value)} className={inputClass('pays')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Téléphone *</label>
              <input value={form.telephone} onChange={(e) => update('telephone', e.target.value)} className={inputClass('telephone')} />
              {errors.telephone && <p className="text-xs text-red-500 mt-1">{errors.telephone}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Fax</label>
              <input value={form.fax} onChange={(e) => update('fax', e.target.value)} className={inputClass('fax')} />
            </div>
          </div>
        </fieldset>

        {/* Responsable Achat */}
        <fieldset className="space-y-4">
          <legend className="text-base font-bold text-ink mb-2">
            <EditableText page="pro-inscription" id="section_responsable">Responsable achat</EditableText>
          </legend>
          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Civilité</label>
              <div className="relative">
                <select value={form.civilite} onChange={(e) => update('civilite', e.target.value)} className={selectClass('civilite')}>
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Mme">Mme</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-secondary">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Nom *</label>
              <input value={form.nom} onChange={(e) => update('nom', e.target.value)} className={inputClass('nom')} />
              {errors.nom && <p className="text-xs text-red-500 mt-1">{errors.nom}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">Prénom *</label>
              <input value={form.prenom} onChange={(e) => update('prenom', e.target.value)} className={inputClass('prenom')} />
              {errors.prenom && <p className="text-xs text-red-500 mt-1">{errors.prenom}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="contact@surprisez-vous.fr" className={inputClass('email')} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
        </fieldset>

        {/* Commentaire */}
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">Commentaire</label>
          <textarea
            value={form.commentaire}
            onChange={(e) => update('commentaire', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20 resize-none"
          />
        </div>

        {/* CGV + Submit */}
        <div className="space-y-4">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.cgvAccepted}
              onChange={(e) => update('cgvAccepted', e.target.checked)}
              className="mt-0.5 accent-sv-primary"
            />
            <span className="text-sm text-ink-secondary">
              J&apos;accepte les <a href="/pro/cgv" target="_blank" className="text-sv-primary underline">Conditions Générales de Vente</a> *
            </span>
          </label>
          {errors.cgvAccepted && <p className="text-xs text-red-500">{errors.cgvAccepted}</p>}

          <Button type="submit" variant="secondary" size="lg" disabled={submitting} className="w-full">
            {submitting ? 'Envoi en cours...' : <EditableText page="pro-inscription" id="btn_submit">S&apos;inscrire</EditableText>}
          </Button>
        </div>
      </form>
    </div>
  );
}
