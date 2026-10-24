#!/usr/bin/env bash
# One-time GCP setup for deploying go-cloudrun-app from GitHub Actions.
#
# Run this once in Cloud Shell (https://shell.cloud.google.com) or anywhere you
# are logged in with `gcloud auth login`. It is safe to re-run: every step
# tolerates resources that already exist.
#
#   PROJECT_ID=your-project-id ./scripts/setup-gcp.sh
#
# At the end it prints the four repository variables to set on GitHub.

set -euo pipefail

PROJECT_ID="${PROJECT_ID:?set PROJECT_ID, e.g. PROJECT_ID=my-project ./scripts/setup-gcp.sh}"
GITHUB_REPO="${GITHUB_REPO:-ocknamo/sandbox}"
REGION="${REGION:-asia-northeast1}"
SERVICE="${SERVICE:-go-cloudrun-app}"
AR_REPO="${AR_REPO:-apps}"
POOL="${POOL:-github}"
PROVIDER="${PROVIDER:-github}"
DEPLOY_SA_NAME="${DEPLOY_SA_NAME:-github-deployer}"
RUNTIME_SA_NAME="${RUNTIME_SA_NAME:-go-cloudrun-app-run}"
DEPLOY_REF="${DEPLOY_REF:-refs/heads/main}"

GITHUB_OWNER="${GITHUB_REPO%%/*}"
DEPLOY_SA="${DEPLOY_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
RUNTIME_SA="${RUNTIME_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Project: $PROJECT_ID / repo: $GITHUB_REPO / region: $REGION"
gcloud config set project "$PROJECT_ID" >/dev/null

echo "==> Enabling APIs (this can take a minute)"
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

echo "==> Artifact Registry repository: $AR_REPO"
gcloud artifacts repositories describe "$AR_REPO" --location="$REGION" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "$AR_REPO" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Container images deployed to Cloud Run"

echo "==> Service accounts"
gcloud iam service-accounts describe "$DEPLOY_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$DEPLOY_SA_NAME" --display-name="GitHub Actions deployer"
gcloud iam service-accounts describe "$RUNTIME_SA" >/dev/null 2>&1 || \
  gcloud iam service-accounts create "$RUNTIME_SA_NAME" --display-name="$SERVICE runtime identity"

echo "==> Granting deploy permissions to $DEPLOY_SA"
for role in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOY_SA}" --role="$role" --condition=None >/dev/null
done
# The deployer must be allowed to run the service *as* the runtime identity.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role=roles/iam.serviceAccountUser --condition=None >/dev/null

echo "==> Workload Identity Federation pool/provider"
gcloud iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 || \
  gcloud iam workload-identity-pools create "$POOL" \
    --location=global --display-name="GitHub Actions"

# repository_ref joins the repository and the git ref that started the run
# (e.g. ocknamo/sandbox/refs/heads/main), so one principalSet can name a single
# branch of a single repository.
REPO_REF_ATTR="attribute.repository_ref"
REPO_REF_EXPR="assertion.repository + '/' + assertion.ref"

if gcloud iam workload-identity-pools providers describe "$PROVIDER" \
    --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1; then
  # The provider may serve other repositories as well, and update-oidc replaces
  # the whole mapping, so add repository_ref to whatever is already there. The
  # "^;^" prefix makes ; the separator, since a CEL expression may hold commas
  # (and || for or); CEL itself has no use for ;.
  mapping="$(gcloud iam workload-identity-pools providers describe "$PROVIDER" \
      --location=global --workload-identity-pool="$POOL" --format=json \
    | python3 -c 'import json, sys
m = json.load(sys.stdin).get("attributeMapping", {})
m[sys.argv[1]] = sys.argv[2]
if any(";" in k + v for k, v in m.items()):
    sys.exit("An existing attribute mapping contains \";\"; add " + sys.argv[1] + " by hand.")
print("^;^" + ";".join(k + "=" + v for k, v in m.items()))' "$REPO_REF_ATTR" "$REPO_REF_EXPR")"
  gcloud iam workload-identity-pools providers update-oidc "$PROVIDER" \
    --location=global --workload-identity-pool="$POOL" \
    --attribute-mapping="$mapping" >/dev/null
else
  gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
    --location=global \
    --workload-identity-pool="$POOL" \
    --display-name="GitHub OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner,${REPO_REF_ATTR}=${REPO_REF_EXPR}" \
    --attribute-condition="assertion.repository_owner == '${GITHUB_OWNER}'"
fi

# Only runs from this repository's $DEPLOY_REF may impersonate the deployer
# service account. The restriction sits on this binding rather than in the
# provider's condition, so other repositories sharing the pool are unaffected.
POOL_PRINCIPALS="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}"
echo "==> Allowing ${GITHUB_REPO} at ${DEPLOY_REF} to impersonate $DEPLOY_SA"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA" \
  --role=roles/iam.workloadIdentityUser \
  --member="${POOL_PRINCIPALS}/${REPO_REF_ATTR}/${GITHUB_REPO}/${DEPLOY_REF}" \
  --condition=None >/dev/null

# Earlier versions of this script trusted every branch of the repository.
# Drop that binding now that the narrower one is in place.
OLD_MEMBER="${POOL_PRINCIPALS}/attribute.repository/${GITHUB_REPO}"
if gcloud iam service-accounts get-iam-policy "$DEPLOY_SA" \
    --flatten="bindings[].members" --format="value(bindings.members)" | grep -qxF "$OLD_MEMBER"; then
  echo "==> Removing the binding that trusted every branch of ${GITHUB_REPO}"
  gcloud iam service-accounts remove-iam-policy-binding "$DEPLOY_SA" \
    --role=roles/iam.workloadIdentityUser \
    --member="$OLD_MEMBER" --condition=None >/dev/null
fi

WIF_PROVIDER="projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"

cat <<EOF

============================================================
Setup complete. Now add these as GitHub *repository variables*
(not secrets) at:

  https://github.com/${GITHUB_REPO}/settings/variables/actions

  GCP_PROJECT_ID    ${PROJECT_ID}
  GCP_WIF_PROVIDER  ${WIF_PROVIDER}
  GCP_DEPLOY_SA     ${DEPLOY_SA}
  GCP_RUNTIME_SA    ${RUNTIME_SA}

Then run the "Deploy to Cloud Run" workflow (Actions tab >
Run workflow), or merge a change under go-cloudrun-app/.

Only runs from ${DEPLOY_REF} of ${GITHUB_REPO} can act as the
deployer. IAM changes can take several minutes to apply.
============================================================
EOF
