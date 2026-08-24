# Diagnostic : cherche les ressources facturees au forfait 24/7 sur le projet.
#
# Contrairement au stockage et aux invocations (qui suivent l'usage), ces
# ressources coutent le meme montant chaque jour meme si personne ne visite le
# site. C'est le profil "je n'ai rien fait et je paie tous les jours".
#
# Lecture seule : ce script ne modifie rien.
# Usage : .\scripts\gcp-diagnostic.ps1

$Project = 'site-surprisez-vous'
$Region  = 'us-central1'

function Section($titre) {
  Write-Host ''
  Write-Host "=== $titre" -ForegroundColor Cyan
}

gcloud config set project $Project --quiet | Out-Null

Section 'Connecteurs VPC Serverless (~9 EUR/mois piece, allumes 24/7)'
gcloud compute networks vpc-access connectors list --region=$Region --project=$Project
if (-not $?) { Write-Host '  (API non activee = aucun connecteur, bonne nouvelle)' -ForegroundColor DarkGray }

Section 'Adresses IP reservees (facturees si non attachees)'
gcloud compute addresses list --project=$Project
if (-not $?) { Write-Host '  (API Compute non activee = aucune IP)' -ForegroundColor DarkGray }

Section 'Instances Compute Engine (VM allumees)'
gcloud compute instances list --project=$Project
if (-not $?) { Write-Host '  (aucune VM)' -ForegroundColor DarkGray }

Section 'Passerelles Cloud NAT'
gcloud compute routers list --project=$Project
if (-not $?) { Write-Host '  (aucun routeur)' -ForegroundColor DarkGray }

Section 'Instances Cloud SQL / Redis (forfait horaire)'
gcloud sql instances list --project=$Project
if (-not $?) { Write-Host '  (aucune instance SQL)' -ForegroundColor DarkGray }
gcloud redis instances list --region=$Region --project=$Project
if (-not $?) { Write-Host '  (aucune instance Redis)' -ForegroundColor DarkGray }

Section 'Services Cloud Run et leur minimum d instances'
gcloud run services list --project=$Project --format="table(metadata.name, status.url, spec.template.metadata.annotations['autoscaling.knative.dev/minScale']:label=MIN_INSTANCES)"

Section 'Taches planifiees (3 gratuites par compte de facturation)'
gcloud scheduler jobs list --location=$Region --project=$Project --format="table(name.basename(), schedule, state)"

Section 'Volume de logs ingere sur 30 jours (50 Gio gratuits)'
gcloud logging buckets list --location=global --project=$Project --format="table(name.basename(), retentionDays, lifecycleState)"

Section 'Datasets BigQuery residuels'
gcloud alpha bq datasets list --project=$Project
if (-not $?) { Write-Host '  (composant alpha absent : verifier a la main dans la console BigQuery)' -ForegroundColor DarkGray }

Section 'Toutes les APIs activees'
gcloud services list --enabled --project=$Project --format="value(config.name)"

Write-Host ''
Write-Host 'Colle cette sortie complete dans la conversation.' -ForegroundColor Green
