#!/usr/bin/env bash
# Purge des artefacts de build Google Cloud (la source du coût quotidien "Non-Firebase Services").
#
# Chaque `firebase deploy --only functions` pousse une image conteneur par fonction
# dans Artifact Registry, et une archive des sources dans un bucket Cloud Storage.
# Rien n'est purgé automatiquement sur les projets antérieurs aux cleanup policies
# par défaut : le stockage s'accumule et est facturé au prorata, chaque jour, sans trafic.
#
# Usage :
#   bash scripts/gcp-cleanup.sh          # audit seul (aucune modification)
#   bash scripts/gcp-cleanup.sh --apply  # applique les politiques de rétention
#
# Prérequis : gcloud CLI installé et authentifié (gcloud auth login).

set -euo pipefail

PROJECT="site-surprisez-vous"
PROJECT_NUMBER="194856824011"
REGION="us-central1"
APPLY="${1:-}"

gcloud config set project "$PROJECT" --quiet

echo "=============================================="
echo " 1. Taille des dépôts Artifact Registry"
echo "=============================================="
gcloud artifacts repositories list \
  --project="$PROJECT" \
  --format="table(name.basename(), format, location, sizeBytes.size(units_out=G):label=TAILLE_GB)"

echo
echo "=============================================="
echo " 2. Taille des buckets de build"
echo "=============================================="
# NE JAMAIS inclure ici site-surprisez-vous.firebasestorage.app : c'est le bucket
# de production (images produits, PDF catalogues), pas un bucket de build.
BUILD_BUCKETS=(
  "gs://gcf-sources-${PROJECT_NUMBER}-${REGION}"
  "gs://${PROJECT}_cloudbuild"
)
for b in "${BUILD_BUCKETS[@]}"; do
  echo "--- $b"
  gcloud storage du "$b" --summarize --readable-sizes 2>/dev/null || echo "    (inexistant ou inaccessible)"
done

if [ "$APPLY" != "--apply" ]; then
  echo
  echo "Audit terminé. Relancer avec --apply pour appliquer les politiques ci-dessous :"
  echo "  - Artifact Registry : garder les 3 versions les plus récentes, supprimer le reste au-delà de 7 jours"
  echo "  - Buckets de build  : suppression automatique des objets de plus de 30 jours"
  exit 0
fi

POLICY_FILE="$(mktemp)"
cat > "$POLICY_FILE" <<'JSON'
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
JSON

echo
echo "=============================================="
echo " 3. Application des cleanup policies"
echo "=============================================="
# Les dépôts créés par Cloud Functions v2 et App Hosting. Certains peuvent ne pas
# exister selon l'historique du projet — on continue sans échouer.
for repo in gcf-artifacts cloud-run-source-deploy firebaseapphosting-images; do
  echo "--- $repo"
  gcloud artifacts repositories set-cleanup-policies "$repo" \
    --location="$REGION" \
    --project="$PROJECT" \
    --policy="$POLICY_FILE" \
    --no-dry-run \
    --quiet || echo "    (dépôt absent, ignoré)"
done
rm -f "$POLICY_FILE"

LIFECYCLE_FILE="$(mktemp)"
cat > "$LIFECYCLE_FILE" <<'JSON'
{
  "lifecycle": {
    "rule": [
      { "action": { "type": "Delete" }, "condition": { "age": 30 } }
    ]
  }
}
JSON

echo
echo "=============================================="
echo " 4. Cycle de vie des buckets de build"
echo "=============================================="
for b in "${BUILD_BUCKETS[@]}"; do
  echo "--- $b"
  gcloud storage buckets update "$b" --lifecycle-file="$LIFECYCLE_FILE" || echo "    (bucket absent, ignoré)"
done
rm -f "$LIFECYCLE_FILE"

echo
echo "Terminé. La purge Artifact Registry s'exécute de façon asynchrone (quelques heures)."
echo "Vérifier la baisse dans : Facturation > Rapports > grouper par SKU."
