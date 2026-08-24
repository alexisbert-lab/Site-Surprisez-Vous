# Purge des artefacts de build Google Cloud (source du coût quotidien "Non-Firebase Services").
#
# Chaque `firebase deploy --only functions` pousse une image conteneur par fonction
# dans Artifact Registry, et une archive des sources dans un bucket Cloud Storage.
# Rien n'est purgé automatiquement : le stockage s'accumule et est facturé au
# prorata, chaque jour, même sans aucun trafic.
#
# Usage :
#   .\scripts\gcp-cleanup.ps1          # audit seul (aucune modification)
#   .\scripts\gcp-cleanup.ps1 -Apply   # applique les politiques de rétention
#
# Prérequis : gcloud CLI installé et authentifié (gcloud auth login).

param([switch]$Apply)

$Project       = 'site-surprisez-vous'
$ProjectNumber = '194856824011'
$Region        = 'us-central1'

gcloud config set project $Project --quiet

Write-Host ''
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host ' 1. Taille des depots Artifact Registry' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan
gcloud artifacts repositories list --project=$Project --format="table(name.basename(), format, location, sizeBytes.size(units_out=G):label=TAILLE_GB)"

Write-Host ''
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host ' 2. Taille des buckets de build' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan
# NE JAMAIS ajouter site-surprisez-vous.firebasestorage.app : c'est le bucket de
# production (images produits, PDF catalogues), pas un bucket de build.
$BuildBuckets = @(
  "gs://gcf-sources-$ProjectNumber-$Region",
  "gs://${Project}_cloudbuild"
)
foreach ($b in $BuildBuckets) {
  Write-Host "--- $b"
  gcloud storage du $b --summarize --readable-sizes
}

if (-not $Apply) {
  Write-Host ''
  Write-Host 'Audit termine. Relancer avec -Apply pour appliquer :' -ForegroundColor Yellow
  Write-Host '  - Artifact Registry : garder les 3 versions recentes, supprimer le reste au-dela de 7 jours'
  Write-Host '  - Buckets de build  : suppression automatique des objets de plus de 30 jours'
  exit 0
}

$PolicyFile = Join-Path $env:TEMP 'ar-cleanup-policy.json'
$PolicyJson = @'
[
  {
    "name": "garder-versions-recentes",
    "action": { "type": "Keep" },
    "mostRecentVersions": { "keepCount": 3 }
  },
  {
    "name": "supprimer-images-obsoletes",
    "action": { "type": "Delete" },
    "condition": { "olderThan": "7d" }
  }
]
'@
# WriteAllText ecrit en UTF-8 sans BOM : gcloud rejette un JSON avec BOM.
[System.IO.File]::WriteAllText($PolicyFile, $PolicyJson)

Write-Host ''
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host ' 3. Application des cleanup policies' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan
# Depots crees par Cloud Functions v2 et App Hosting. Certains peuvent ne pas
# exister selon l'historique du projet : on continue sans echouer.
foreach ($repo in @('gcf-artifacts', 'cloud-run-source-deploy', 'firebaseapphosting-images')) {
  Write-Host "--- $repo"
  gcloud artifacts repositories set-cleanup-policies $repo --location=$Region --project=$Project --policy=$PolicyFile --no-dry-run --quiet
  if (-not $?) { Write-Host '    (depot absent ou inaccessible, ignore)' -ForegroundColor DarkGray }
}
Remove-Item $PolicyFile -Force

$LifecycleFile = Join-Path $env:TEMP 'gcs-lifecycle.json'
$LifecycleJson = @'
{
  "lifecycle": {
    "rule": [
      { "action": { "type": "Delete" }, "condition": { "age": 30 } }
    ]
  }
}
'@
[System.IO.File]::WriteAllText($LifecycleFile, $LifecycleJson)

Write-Host ''
Write-Host '==============================================' -ForegroundColor Cyan
Write-Host ' 4. Cycle de vie des buckets de build' -ForegroundColor Cyan
Write-Host '==============================================' -ForegroundColor Cyan
foreach ($b in $BuildBuckets) {
  Write-Host "--- $b"
  gcloud storage buckets update $b --lifecycle-file=$LifecycleFile
  if (-not $?) { Write-Host '    (bucket absent ou inaccessible, ignore)' -ForegroundColor DarkGray }
}
Remove-Item $LifecycleFile -Force

Write-Host ''
Write-Host 'Termine. La purge Artifact Registry est asynchrone (quelques heures).' -ForegroundColor Green
Write-Host 'Verifier la baisse dans : Facturation > Rapports > grouper par SKU.'
