# go-cloudrun-echo

An HTTP echo service on Cloud Run. It reflects a request back as JSON, which
makes it useful for checking what actually arrives at a container — headers
rewritten by the Google Front End, query handling, proxy behaviour.

## Endpoints

| Method | Path      | Response                                              |
| ------ | --------- | ----------------------------------------------------- |
| GET    | `/health` | `{"status":"ok"}`                                     |
| any    | any other | JSON echo of method, path, query, headers, and body   |

```console
$ curl -X POST "$URL/foo?a=1" -H 'X-Custom: hi' -d payload
{
  "method": "POST",
  "path": "/foo",
  "query": { "a": "1" },
  "headers": { "X-Custom": "hi", ... },
  "body": "payload",
  "service": "go-cloudrun-echo",
  "revision": "go-cloudrun-echo-00001-abc",
  "time": "2026-09-05T00:00:00Z"
}
```

Two deliberate limits, because the service is deployed publicly:

- `Authorization`, `Proxy-Authorization`, `Cookie` and the IAP assertion header
  are echoed as `[redacted]`, so a caller's credentials are never reflected back
  into a response or into Cloud Logging.
- Request bodies are read through `http.MaxBytesReader` with a 64 KiB cap; a
  larger body is truncated and flagged with `"body_truncated": true` rather than
  being buffered in full.

Note that `/healthz` works locally but is unreachable once deployed: the Google
Front End answers that exact path itself and never forwards it to the container.
That is exactly the kind of thing this service exists to demonstrate — compare
`curl $URL/healthz` against `curl $URL/health`.

## Run locally

```sh
go test ./...
go run .                       # http://localhost:8080

docker build -t go-cloudrun-echo .
docker run --rm -p 8080:8080 go-cloudrun-echo
```

## Deployment

Deployed by `.github/workflows/deploy-go-cloudrun-echo.yml`, which calls the
shared `deploy-service.yml`. It reuses the project, Workload Identity provider
and service accounts already set up for this repository — see
`go-cloudrun-app/scripts/setup-gcp.sh`. Adding this service required no new GCP
resources, because the deployer service account holds `roles/run.admin` at the
project level.
