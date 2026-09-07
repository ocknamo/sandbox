# sandbox

## Cloud Run services

Each directory is a self-contained service with its own `go.mod` and
`Dockerfile`, deployed to Cloud Run from GitHub Actions using Workload Identity
Federation (no service account keys).

| Directory | Cloud Run service | What it is |
| --- | --- | --- |
| [`go-cloudrun-app`](go-cloudrun-app) | `go-cloudrun-app` | Minimal JSON HTTP service |
| [`go-cloudrun-echo`](go-cloudrun-echo) | `go-cloudrun-echo` | Echoes a request back as JSON |

### How the workflows fit together

`.github/workflows/deploy-service.yml` holds the whole deploy pipeline once —
test, build, push, deploy, then poll `/health` on the live URL and fail if it
never returns 200. Each service adds a thin caller
(`deploy-<service>.yml`) that supplies its name and directory and restricts the
`paths` trigger to its own files, so a push only redeploys what it touched.
Concurrency is keyed per service, so one service's deploy never queues behind
another's.

### Stopping and restarting a service

Run **Manage Cloud Run services** from the Actions tab. It takes an action and a
target service, and needs no local tooling:

| Action | Effect |
| --- | --- |
| `status` | Print each service's URL, whether `allUsers` is bound, and a live `/health` probe |
| `pause` | Remove the `allUsers` invoker binding, so the URL answers 403 |
| `resume` | Put the binding back |
| `delete` | Remove the service (one at a time, and the confirm field must repeat its name) |

`pause` is the usual one: requests denied by IAM are not billed, the service
keeps its configuration and revisions, and `resume` undoes it in one run. Each
action verifies its own result by polling the live URL and fails the run if the
service is still reachable after a pause, so a green run means it really stopped.

Deleting is not permanent in practice: the next push under the service's
directory deploys it again at the same URL.

Note that removing the workflows or the service's source does **not** stop a
running service — the deployed revision lives in GCP, independent of this
repository.

### Adding a service

1. Add a directory with a `Dockerfile` and a `/health` endpoint returning 200.
   Do **not** use `/healthz`: the Google Front End answers that exact path itself
   and the request never reaches the container.
2. Copy a `deploy-<service>.yml` caller and change the two `paths` entries and
   the `service`/`directory` inputs.
3. Add the directory to the matrix in `go-cloudrun-ci.yml`.

No GCP-side work is needed: the deployer service account holds `roles/run.admin`
at the project level, and all images share one Artifact Registry repository.
Services share `GCP_RUNTIME_SA` by default; to give one its own identity, create
a service account, grant the deployer `roles/iam.serviceAccountUser` on it, and
pass it as the `runtime_sa` input.

One-time project setup lives in
[`go-cloudrun-app/scripts/setup-gcp.sh`](go-cloudrun-app/scripts/setup-gcp.sh).

## Other

- [`svelte-voice-api`](svelte-voice-api) — Svelte + Web Speech API experiment.
