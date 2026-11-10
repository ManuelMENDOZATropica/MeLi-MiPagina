#!/usr/bin/env bash
# Despliegue de MeLi-MiPagina en GCP (proyecto meli-mipagina).
# Un solo servicio de Cloud Run (API + socket.io + frontend) y Postgres en Cloud SQL.
#
#   bash deploy-gcp.sh setup    # una vez: APIs, Cloud SQL, secretos
#   bash deploy-gcp.sh migrate  # copia la base de Render a Cloud SQL (RENDER_DATABASE_URL=...)
#   bash deploy-gcp.sh deploy   # build + deploy (cada vez que haya cambios)
#   bash deploy-gcp.sh domain   # mapea mipagina.tropica.me
set -euo pipefail

PROJECT=meli-mipagina
REGION=us-central1          # domain mappings de Cloud Run existen en us-central1
SERVICE=meli-mipagina
SQL=meli-mipagina-sql
DB=mipagina
DB_USER=mipagina
CONN="$PROJECT:$REGION:$SQL"
G="gcloud --project $PROJECT"

case "${1:-}" in
setup)
  $G services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com \
    artifactregistry.googleapis.com secretmanager.googleapis.com
  $G sql instances create $SQL --database-version=POSTGRES_18 --region=$REGION \
    --edition=ENTERPRISE --tier=db-f1-micro --storage-size=10 --backup
  $G sql databases create $DB --instance=$SQL
  DB_PASS=$(openssl rand -hex 24)
  $G sql users create $DB_USER --instance=$SQL --password="$DB_PASS"
  printf '%s' "postgresql://$DB_USER:$DB_PASS@localhost/$DB?host=/cloudsql/$CONN" \
    | $G secrets create DATABASE_URL --data-file=-
  # Los demás secretos se copian del Environment de Render:
  for S in JWT_SECRET GOOGLE_CLIENT_ID CLOUDINARY_URL GEMINI_API_KEY; do
    read -r -s -p "$S: " V; echo
    printf '%s' "$V" | $G secrets create $S --data-file=-
  done
  SA="$($G projects describe $PROJECT --format='value(projectNumber)')-compute@developer.gserviceaccount.com"
  $G projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/secretmanager.secretAccessor
  $G projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/cloudsql.client
  $G projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=roles/cloudbuild.builds.builder
  ;;
migrate)
  : "${RENDER_DATABASE_URL:?Pega la External Database URL de Render en RENDER_DATABASE_URL}"
  # Requiere cloud-sql-proxy (brew install cloud-sql-proxy) y pg_dump >= 18 (brew install postgresql@18)
  cloud-sql-proxy "$CONN" --port 5499 & PROXY=$!; trap 'kill $PROXY' EXIT; sleep 4
  DB_URL=$($G secrets versions access latest --secret=DATABASE_URL)
  DB_PASS=$(sed -E 's#.*://[^:]+:([^@]+)@.*#\1#' <<<"$DB_URL")
  pg_dump --no-owner --no-privileges "$RENDER_DATABASE_URL" \
    | psql "postgresql://$DB_USER:$DB_PASS@127.0.0.1:5499/$DB" -v ON_ERROR_STOP=1
  ;;
deploy)
  CID=$($G secrets versions access latest --secret=GOOGLE_CLIENT_ID)
  IMG="$REGION-docker.pkg.dev/$PROJECT/cloud-run-source-deploy/$SERVICE:$(git rev-parse --short HEAD)"
  $G artifacts repositories describe cloud-run-source-deploy --location=$REGION >/dev/null 2>&1 \
    || $G artifacts repositories create cloud-run-source-deploy --repository-format=docker --location=$REGION
  cat > /tmp/cloudbuild-mipagina.yaml <<EOF
steps:
- name: gcr.io/cloud-builders/docker
  args: [build, --build-arg, VITE_GOOGLE_CLIENT_ID=$CID, -t, $IMG, .]
images: [$IMG]
EOF
  $G builds submit --config /tmp/cloudbuild-mipagina.yaml .
  # min/max 1 instancia: socket.io guarda los rooms en memoria, todos deben caer en la misma.
  $G run deploy $SERVICE --image "$IMG" --region $REGION --no-invoker-iam-check \
    --add-cloudsql-instances "$CONN" --min-instances 1 --max-instances 1 \
    --session-affinity --timeout 3600 --memory 512Mi \
    --set-secrets DATABASE_URL=DATABASE_URL:latest,DIRECT_URL=DATABASE_URL:latest,JWT_SECRET=JWT_SECRET:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,CLOUDINARY_URL=CLOUDINARY_URL:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest
  ;;
domain)
  # Requiere tropica.me verificado en Search Console con esta cuenta.
  $G beta run domain-mappings create --service $SERVICE --domain mipagina.tropica.me --region $REGION
  echo "Después: en Wix, CNAME mipagina -> ghs.googlehosted.com (quitar los registros de Vercel)."
  ;;
*) sed -n 2,8p "$0"; exit 1 ;;
esac
