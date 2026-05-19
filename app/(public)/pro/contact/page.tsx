'use client';

import { useState, type FormEvent } from 'react';
import Button from '@/components/ui/Button';
import EditableText from '@/components/editable/EditableText';

const modesContact = [
  { value: 'mail', labelId: 'mode_mail', label: 'Par email' },
  { value: 'tel', labelId: 'mode_tel', label: 'Par téléphone' },
  { value: 'magasin', labelId: 'mode_magasin', label: 'En magasin' },
  { value: 'showroom', labelId: 'mode_showroom', label: 'Au showroom' },
];

export default function ContactProPage() {
  const [modeContact, setModeContact] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const needsTel = modeContact === 'tel';
  const needsCP = modeContact === 'magasin';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!modeContact) {
      setError('Veuillez choisir un mode de contact');
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email invalide');
      return;
    }
    if (needsTel && !telephone) {
      setError('Veuillez saisir votre numéro de téléphone');
      return;
    }
    if (needsCP && !/^\d{5}$/.test(codePostal)) {
      setError('Code postal invalide');
      return;
    }

    setSubmitting(true);
    try {
      // TODO: Cloud Function envoi mail à contact@surprisez-vous.fr + confirmation
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } catch {
      setError('Erreur lors de l\'envoi. Veuillez réessayer.');
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
          <EditableText page="pro-contact" id="success_title">Message envoyé !</EditableText>
        </h2>
        <p className="text-sm text-ink-secondary" style={{ whiteSpace: 'pre-line' }}>
          <EditableText page="pro-contact" id="success_text" multiline>{"Nous avons bien reçu votre demande. Un mail de confirmation vous a été envoyé.\nNotre équipe vous recontactera dans les meilleurs délais."}</EditableText>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold text-sv-primary mb-2 font-[family-name:var(--font-heading)]">
        <EditableText page="pro-contact" id="h1">Nous contacter</EditableText>
      </h1>
      <p className="text-sm text-ink-secondary mb-8">
        <EditableText page="pro-contact" id="intro">Remplissez le formulaire ci-dessous et nous vous recontacterons selon votre préférence.</EditableText>
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-2">
            <EditableText page="pro-contact" id="label_mode">Mode de contact souhaité *</EditableText>
          </label>
          <div className="flex flex-wrap gap-2">
            {modesContact.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setModeContact(m.value)}
                className={`px-4 py-2 rounded-lg text-xs font-medium border cursor-pointer transition-colors ${
                  modeContact === m.value
                    ? 'bg-sv-primary text-white border-sv-primary'
                    : 'bg-white text-ink border-border hover:border-sv-primary'
                }`}
              >
                <EditableText page="pro-contact" id={m.labelId}>{m.label}</EditableText>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">Nom</label>
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
            />
          </div>
        </div>

        {needsTel && (
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">Téléphone *</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: 06 12 34 56 78"
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
            />
          </div>
        )}

        {needsCP && (
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">Code postal *</label>
            <input
              value={codePostal}
              onChange={(e) => setCodePostal(e.target.value)}
              placeholder="Ex: 75001"
              maxLength={5}
              className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-ink-secondary mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-sv-primary focus:ring-2 focus:ring-sv-primary/20 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" variant="secondary" className="w-full" disabled={submitting}>
          {submitting ? 'Envoi...' : <EditableText page="pro-contact" id="btn_submit">Envoyer ma demande</EditableText>}
        </Button>
      </form>
    </div>
  );
}
