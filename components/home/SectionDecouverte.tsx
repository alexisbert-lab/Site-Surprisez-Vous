'use client';
import { Reveal } from '@/components/ui/Reveal';
import { Icon } from '@/components/ui/Icon';
import EditableText from '@/components/editable/EditableText';
import Link from 'next/link';

const MARQUES = [
  { labelId: 'decouverte_marque1', labelDefault: 'MDR',               color: '#E8185A', bg: '#fdeaef' },
  { labelId: 'decouverte_marque2', labelDefault: 'Fête à DÉCO',      color: '#3DBDB0', bg: '#e8f8f7' },
  { labelId: 'decouverte_marque3', labelDefault: 'Oui pour la vie',  color: '#6B4FA0', bg: '#f0edf8' },
  { labelId: 'decouverte_marque4', labelDefault: 'Zéro de Conduite', color: '#2B3EA0', bg: '#eef0fb' },
  { labelId: 'decouverte_marque5', labelDefault: 'OptimiZline',      color: '#E97132', bg: '#fde8dd' },
];

const FEATURES = [
  { icon: 'truck'     as const, labelId: 'decouverte_feat1', labelDefault: 'Livraison express à la demande' },
  { icon: 'box'       as const, labelId: 'decouverte_feat2', labelDefault: 'Conditionnement par lot' },
  { icon: 'clipboard' as const, labelId: 'decouverte_feat3', labelDefault: 'Fiches techniques détaillées' },
  { icon: 'award'     as const, labelId: 'decouverte_feat4', labelDefault: 'Produits exclusifs & tendance' },
];

function StepNumber({ n, color }: { n: string; color: string }) {
  return (
    <div style={{ width: 48, height: 48, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 14, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff' }}>{n}</span>
    </div>
  );
}

export function SectionDecouverte() {
  return (
    <section style={{ background: '#0d0a1a', padding: '100px 32px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, color: '#3DBDB0', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
              <EditableText page="home" id="decouverte_eyebrow">Notre histoire</EditableText>
            </div>
            <h2 style={{ fontSize: 36, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', margin: 0 }}>
              <EditableText page="home" id="decouverte_title">Découvrez Surprisez-Vous</EditableText>
            </h2>
          </div>
        </Reveal>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          {/* Step 01 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <Reveal dir="left">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <StepNumber n="01" color="#E8185A" />
                <div>
                  <div style={{ height: 2, width: 60, background: '#E8185A', marginBottom: 20, transformOrigin: 'left', animation: 'lineGrow 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both' }} />
                  <h3 style={{ fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
                    <EditableText page="home" id="decouverte_step1_title">Notre showroom</EditableText>
                  </h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', lineHeight: 1.7, marginBottom: 16 }}>
                    <EditableText page="home" id="decouverte_step1_desc" multiline>Venez découvrir plus de 3000 références dans nos espaces d&apos;exposition. Nos équipes vous accueillent pour vous guider dans vos achats.</EditableText>
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#3DBDB0', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}>
                    <Icon name="pin" size={14} color="#3DBDB0" />
                    <EditableText page="home" id="decouverte_step1_location">Showroom · Boos (76)</EditableText>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal dir="right">
              <div style={{ background: 'rgba(232,24,90,0.1)', borderRadius: 20, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(232,24,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="building" size={40} color="#E8185A" strokeWidth={1.5} />
                </div>
              </div>
            </Reveal>
          </div>

          {/* Step 02 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <Reveal dir="left">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {MARQUES.slice(0, 4).map((m, i) => (
                  <Reveal key={m.labelId} dir="scale" delay={i * 0.08}>
                    <div style={{ padding: '12px 16px', borderRadius: 12, background: m.bg, textAlign: 'center' }}>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 800, color: m.color }}>
                        <EditableText page="home" id={m.labelId}>{m.labelDefault}</EditableText>
                      </span>
                    </div>
                  </Reveal>
                ))}
                <Reveal dir="scale" delay={4 * 0.08} style={{ gridColumn: '1 / -1' }}>
                  <div style={{ padding: '12px 16px', borderRadius: 12, background: MARQUES[4].bg, textAlign: 'center' }}>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-heading)', fontWeight: 800, color: MARQUES[4].color }}>
                      <EditableText page="home" id={MARQUES[4].labelId}>{MARQUES[4].labelDefault}</EditableText>
                    </span>
                  </div>
                </Reveal>
              </div>
            </Reveal>
            <Reveal dir="right">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <StepNumber n="02" color="#3DBDB0" />
                <div>
                  <div style={{ height: 2, width: 60, background: '#3DBDB0', marginBottom: 20, transformOrigin: 'left', animation: 'lineGrow 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both' }} />
                  <h3 style={{ fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', marginBottom: 12 }}>
                    <EditableText page="home" id="decouverte_step2_title">Nos marques exclusives</EditableText>
                  </h3>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}>
                    <EditableText page="home" id="decouverte_step2_desc" multiline>5 gammes développées en exclusivité pour vous offrir des produits uniques, tendance et adaptés à tous les événements.</EditableText>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Step 03 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            <Reveal dir="left">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <StepNumber n="03" color="#6B4FA0" />
                <div>
                  <div style={{ height: 2, width: 60, background: '#6B4FA0', marginBottom: 20, transformOrigin: 'left', animation: 'lineGrow 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both' }} />
                  <h3 style={{ fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', marginBottom: 20 }}>
                    <EditableText page="home" id="decouverte_step3_title">Nos engagements</EditableText>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {FEATURES.map((f) => (
                      <div key={f.labelId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(107,79,160,0.27)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name={f.icon} size={16} color="#6B4FA0" />
                        </div>
                        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                          <EditableText page="home" id={f.labelId}>{f.labelDefault}</EditableText>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal dir="right">
              <div style={{ background: 'rgba(107,79,160,0.1)', borderRadius: 20, padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(107,79,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="layers" size={40} color="#6B4FA0" strokeWidth={1.5} />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* CTA final */}
        <Reveal>
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <h3 style={{ fontSize: 28, fontFamily: 'var(--font-heading)', fontWeight: 900, color: '#fff', marginBottom: 24 }}>
              <EditableText page="home" id="decouverte_cta_title">Prêt à rejoindre l&apos;aventure ?</EditableText>
            </h3>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link href="/espace-pro" style={{ padding: '14px 28px', borderRadius: 12, background: '#E8185A', color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 8px 24px rgba(232,24,90,0.4)' }}>
                <EditableText page="home" id="decouverte_cta1">Devenir revendeur</EditableText>
              </Link>
              <Link href="/pro/contact" style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)' }}>
                <EditableText page="home" id="decouverte_cta2">Nous contacter</EditableText>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
