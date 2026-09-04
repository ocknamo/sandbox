# go-cloudrun-app

A minimal Go HTTP service deployed to Google Cloud Run from GitHub Actions,
authenticating with Workload Identity Federation (no service account keys).

## Endpoints

| Method | Path       | Response                                          |
| ------ | ---------- | ------------------------------------------------- |
| GET    | `/`        | JSON greeting with `K_SERVICE` / `K_REVISION`     |
| GET    | `/healthz` | `{"status":"ok"}`                                 |

The server reads `PORT` (Cloud Run injects it, defaults to `8080`), logs
requests as JSON on stdout so they land in Cloud Logging, and shuts down
gracefully on `SIGTERM`.

## Run locally

```sh
go test ./...
go run .                       # http://localhost:8080

docker build -t go-cloudrun-app .
docker run --rm -p 8080:8080 go-cloudrun-app
```

The image is multi-stage on top of `distroless/static` and runs as `nonroot`
(~15 MB).

## First-time deployment setup

1. Create (or pick) a GCP project with billing enabled, and note its project ID.

2. Run the setup script once — Cloud Shell is the easiest place, since gcloud is
   already authenticated there:

   ```sh
   git clone https://github.com/ocknamo/sandbox.git
   cd sandbox/go-cloudrun-app
   PROJECT_ID=your-project-id ./scripts/setup-gcp.sh
   ```

   It enables the required APIs and creates: an Artifact Registry repo, a
   deployer service account, a runtime service account, and a Workload Identity
   pool/provider scoped so that only `ocknamo/sandbox` can impersonate the
   deployer.

3. Add the four values it prints as **repository variables** at
   Settings > Secrets and variables > Actions > Variables:
   `GCP_PROJECT_ID`, `GCP_WIF_PROVIDER`, `GCP_DEPLOY_SA`, `GCP_RUNTIME_SA`.

4. Trigger `Deploy to Cloud Run` from the Actions tab, or push a change under
   `go-cloudrun-app/` to `main`.

The workflow runs the tests, builds and pushes the image, deploys the revision,
then polls `/healthz` on the live URL and fails if it never returns 200. The
service URL is printed in the job summary.

## Notes

- The service is deployed with `--allow-unauthenticated`, so the URL is public.
  Drop that flag in `.github/workflows/deploy-cloudrun.yml` to require IAM auth.
  If your organization enforces the "Domain restricted sharing" policy, the flag
  will be rejected and must be removed.
- The runtime service account starts with no project roles. Grant it only what
  the service needs as you add integrations (Firestore, Pub/Sub, and so on).
- Cost: `--min-instances=0` means the service scales to zero and idles for free.
